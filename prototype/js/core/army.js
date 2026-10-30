'use strict';
/* Persistent homogeneous formations. Count maps remain a query/interchange view for economy and world simulation;
   all normal roster mutations pass through this service. Reconciliation also supports explicit developer count edits,
   not old saves (only the current save schema is accepted). IDs never depend on type, slot or array position. */
const ARMY_LIMIT=10;
const ARMY_GROUP={start:3,leadBase:2,units:10};
const armyGroupLimit=o=>o===P?Math.min(ARMY_LIMIT,ARMY_GROUP.start+Math.max(0,(P.sk?.lead?.lv||0)-ARMY_GROUP.leadBase)):ARMY_LIMIT;
class ArmyRoster extends TroopRoster{
  get reserved(){return this.rules.reserved?this.rules.reserved():0}
  get groupLimit(){return armyGroupLimit(this.owner)}
  groupCap(type){return ARMY_GROUP.units}
  groupRoom(type,target){
    const cap=this.groupCap(type),gs=this.groups;
    if(target&&target!=='new'){const g=gs.find(g=>g.id===target&&g.type===type);return g?Math.max(0,cap-g.count-this.wounded(g.id)):0}
    return (target==='new'?0:gs.filter(g=>g.type===type).reduce((n,g)=>n+Math.max(0,cap-g.count-this.wounded(g.id)),0))+Math.max(0,this.groupLimit-this.slots)*cap;
  }
  get groups(){
    const a=this.owner.army||(this.owner.army={nextId:1,groups:[]});
    // Reconcile count-based construction/debug edits without collapsing existing duplicate groups.
    for(const type of new Set([...a.groups.map(g=>g.type),...Object.keys(this.counts)])){
      const want=this.count(type),gs=a.groups.filter(g=>g.type===type);let have=gs.reduce((n,g)=>n+g.count,0);
      for(let i=gs.length-1;i>=0&&have>want;i--){const n=Math.min(gs[i].count,have-want);gs[i].count-=n;have-=n}
      if(have<want){if(gs.some(g=>g.count>0))gs.find(g=>g.count>0).count+=want-have;
        else{if(a.groups.filter(g=>g.count>0).length+this.reserved>=ARMY_LIMIT)throw Error('Army exceeds '+ARMY_LIMIT+' groups.');a.groups.push({id:'g'+a.nextId++,type,count:want-have,form:'line'})}}
    }
    for(let i=a.groups.length-1;i>=0;i--)if(a.groups[i].count<=0)a.groups.splice(i,1);
    // Count-based spawns get the same ten-soldier groups; never discard troops from an already oversized saved army.
    for(const g of a.groups.slice())while(g.count>this.groupCap(g.type)&&a.groups.length+this.reserved<ARMY_LIMIT){const n=Math.min(this.groupCap(g.type),g.count-this.groupCap(g.type));g.count-=n;a.groups.push({id:'g'+a.nextId++,type:g.type,count:n,form:g.form,files:g.files??null})}return a.groups;
  }
  // (a group whose men are all wounded keeps its place till they heal or are lost: no new group takes it)
  get held(){const gs=this.groups;return new Set((this.owner.woundedGroups||[]).filter(w=>w.count>0&&!gs.some(g=>g.id===w.id)).map(w=>w.id)).size}
  get slots(){return this.groups.length+this.reserved+this.held}
  get order(){
    const ids=[...(this.rules.characters?this.rules.characters():[]),...this.groups.map(g=>g.id)],saved=this.owner.army.order||[];
    return [...new Set([...saved.filter(id=>ids.includes(id)),...ids])];
  }
  nameOf(id){return this.owner.army?.groups?.find(g=>g.id===id)?.name||this.owner.army?.names?.[id]||(this.owner.woundedGroups||[]).find(g=>g.id===id)?.name||''}
  wounded(id){return (this.owner.woundedGroups||[]).filter(g=>g.id===id).reduce((n,g)=>n+g.count,0)}
  rename(id,name){
    if(typeof name!=='string'||/[\u0000-\u001f\u007f]/.test(name))return false;name=name.trim().replace(/\s+/g,' ');
    if(Array.from(name).length>32)return false;
    const g=this.groups.find(g=>g.id===id),w=(this.owner.woundedGroups||[]).filter(g=>g.id===id),character=(this.rules.characters?.()||[]).includes(id);
    if(!g&&!w.length&&!character)return false;
    if(g){if(name)g.name=name;else delete g.name}
    if(character){if(name)(this.owner.army.names||(this.owner.army.names={}))[id]=name;else if(this.owner.army.names)delete this.owner.army.names[id]}
    for(const row of w){if(name)row.name=name;else delete row.name}this.changed();return true;
  }
  move(id,step){
    if(step!==1&&step!==-1)return false;const order=this.order,i=order.indexOf(id),j=i+step;if(i<0||j<0||j>=order.length)return false;
    [order[i],order[j]]=[order[j],order[i]];this.owner.army.order=order;
    this.groups.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));this.changed();return true;
  }
  canAdd(type,target,n=1){return this.accepts(type)&&troopAmount(n)&&(target!=='new'||n<=this.groupCap(type))&&this.groupRoom(type,target)>=n}
  add(type,n=1,groupId){
    if(!this.accepts(type)||!troopAmount(n)||!Number.isSafeInteger(this.count(type)+n))return 0;
    if(!this.canAdd(type,groupId,n)||groupId==='new'&&n>this.groupCap(type))return 0;
    const gs=this.groups;let g=groupId==='new'?null:groupId?gs.find(g=>g.id===groupId&&g.type===type):gs.find(g=>g.type===type&&g.count+this.wounded(g.id)<this.groupCap(type));
    if(groupId&&groupId!=='new'&&!g)return 0;
    let left=n;while(left){if(!g){g={id:'g'+this.owner.army.nextId++,type,count:0,form:'line'};gs.push(g)}const put=Math.min(left,this.groupCap(type)-g.count-this.wounded(g.id));g.count+=put;left-=put;g=gs.find(g=>g.type===type&&g.count+this.wounded(g.id)<this.groupCap(type))}
    const c=this.owner[this.field]||(this.owner[this.field]={});c[type]=this.count(type)+n;this.changed();return n;
  }
  remove(type,n=1,groupId){
    let left=this.limit(type,n),taken=0;const gs=this.groups;
    for(const g of gs){if(g.type!==type||groupId&&g.id!==groupId)continue;const m=Math.min(left,g.count);g.count-=m;left-=m;taken+=m;if(!left)break}
    if(taken){const c=this.counts;c[type]-=taken;if(!c[type])delete c[type];
      for(const g of gs.filter(g=>!g.count))for(const w of this.owner.woundedGroups||[])if(w.id===g.id){if(g.name)w.name=g.name;else delete w.name}
      this.owner.army.groups=gs.filter(g=>g.count>0);this.changed()}return taken;
  }
  split(id,n){
    const g=this.groups.find(g=>g.id===id);if(!g||!troopAmount(n)||n>=g.count||n>this.groupCap(g.type)||this.slots>=this.groupLimit)return null;
    const order=this.order;g.count-=n;const out={...g,id:'g'+this.owner.army.nextId++,count:n};delete out.name;this.owner.army.groups.push(out);
    order.splice(order.indexOf(id)+1,0,out.id);this.owner.army.order=order;this.changed();return out;
  }
  merge(fromId,toId){
    const gs=this.groups,a=gs.find(g=>g.id===fromId),b=gs.find(g=>g.id===toId);
    if(!a||!b||a===b||a.type!==b.type||a.count+b.count+this.wounded(a.id)+this.wounded(b.id)>this.groupCap(a.type))return false;b.count+=a.count;this.owner.army.groups=gs.filter(g=>g!==a);
    for(const w of this.owner.woundedGroups||[])if(w.id===a.id){w.id=b.id;if(b.name)w.name=b.name;else delete w.name}this.changed();return true;
  }
  upgrade(id,to){
    const g=this.groups.find(g=>g.id===id);if(!g||!this.accepts(to)||g.type===to)return false;
    const c=this.counts,from=g.type,n=g.count;if(!Number.isSafeInteger(this.count(to)+n))return false;
    c[from]-=n;if(!c[from])delete c[from];c[to]=this.count(to)+n;g.type=to;
    // Do not carry a cavalry-only shape or an old frontage into a different troop type.
    g.form='line';g.files=null;this.changed();return true;
  }
  restore(group,n){
    const gs=this.groups,existing=gs.find(g=>g.id===group.id);
    if(existing){const amount=Math.min(n,this.groupCap(group.type)-existing.count);if(amount<=0)return 0;existing.count+=amount;const c=this.owner[this.field];c[group.type]=this.count(group.type)+amount;this.changed();return amount}
    if(this.slots-(this.wounded(group.id)>0?1:0)>=this.groupLimit||n>this.groupCap(group.type)||!troopAmount(n)||!this.accepts(group.type))return 0;// (its own held place counted once)
    gs.push({id:group.id,type:group.type,count:n,form:'line',...(group.name?{name:group.name}:{})});const c=this.owner[this.field]||(this.owner[this.field]={});c[group.type]=this.count(group.type)+n;this.changed();return n;
  }
  transferTo(target,k,n=1,room=Infinity){
    if(target===this||target.counts===this.counts||!target.accepts(k))return 0;
    const amount=this.limit(k,n,room);if(!amount)return 0;const added=target.add(k,amount);if(added)this.remove(k,added);return added;
  }
  quoteGroupTransfer(target,id,n,to='new',room=Infinity,reserve=0){
    const fail=code=>({ok:false,code});
    if(!(target instanceof ArmyRoster)||target===this||target.counts===this.counts)return fail('same-army');
    const g=this.groups.find(g=>g.id===id);if(!g)return fail('source');
    if(!troopAmount(n)||n>g.count)return fail('amount');
    if(!(room>=n))return fail('capacity');
    if(!Number.isSafeInteger(reserve)||reserve<0)return fail('groups');
    const dest=to==='new'?null:target.groups.find(row=>row.id===to&&row.type===g.type);
    if(!target.accepts(g.type)||to!=='new'&&!dest)return fail('target');
    if(!Number.isSafeInteger(target.count(g.type)+n))return fail('amount');
    if(target.slots+(dest?0:1)+reserve>target.groupLimit||n+(dest?.count||0)+(dest?target.wounded(dest.id):0)>target.groupCap(g.type))return fail('groups');
    return {ok:true,code:'transfer',source:id,target:to,type:g.type,count:n,whole:n===g.count,
      sourceCount:g.count,targetCount:dest?.count||0,sourceName:g.name||'',targetName:dest?.name||'',form:g.form,files:g.files??null,
      fromSlots:this.slots,toSlots:target.slots,fromAfter:this.slots-(n===g.count?1:0),toAfter:target.slots+(dest?0:1)+reserve};
  }
  transferGroupTo(target,id,n,to='new',room=Infinity,reserve=0){
    const q=this.quoteGroupTransfer(target,id,n,to,room,reserve);if(!q.ok)return q;
    const destinationId=to==='new'?'g'+target.owner.army.nextId:to;
    if(target.add(q.type,n,to)!==n)return {ok:false,code:'target'};
    if(to==='new'&&q.whole){const dest=target.groups.find(g=>g.id===destinationId);dest.form=q.form;dest.files=q.files;if(q.sourceName)dest.name=q.sourceName}
    this.remove(q.type,n,id);return {...q,destinationId};
  }
}
