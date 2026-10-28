'use strict';
window.RUN=()=>{const t=T,P=t.P,G=t.G,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 t.begin('soldier');G.quietEvents=true;P.gold=100000;P.renown=10000;const town=t.townBy('Ashford'),r=t.partyRoster(P),service=t.recruitment,k=t.RACES.human.melee,to=t.UP[k][0];P.rep[town.name]=100;town.vol=100;P.sk.lead.lv=10;// all ten slots (a new band starts at three)
 r.add(k,5);const a=r.groups[0],b=r.split(a.id,1),state=()=>JSON.stringify({gold:P.gold,troops:P.troops,army:P.army,xp:P.txp,wounded:P.wounded,wg:P.woundedGroups,vol:town.vol,pop:town.pop});
 const rejects=(fn,code,label)=>{const before=state(),q=fn();ok(!q.ok&&q.code===code&&state()===before,label)};
 let before=state(),q=service.quoteHire(town,k,5,b.id);ok(q.ok&&q.cost===5*service.hireCost(k)&&state()===before,'bulk quote is read-only and multiplies the existing unit price');
 const gold=P.gold,vol=town.vol;service.hire(town,k,5,b.id);ok(a.count===4&&b.count===6&&P.gold===gold-q.cost&&town.vol===vol-5,'bulk hire spends exact totals and reinforces only the chosen duplicate');
 const slots=r.slots;service.hire(town,k,3,'new');const c=r.groups[r.groups.length-1];ok(c.count===3&&r.slots===slots+1,'bulk new-group recruitment uses one slot, not one per soldier');
 for(const n of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER])rejects(()=>service.hire(town,k,n,a.id),'amount','invalid quantity '+n+' is non-mutating');
 rejects(()=>service.hire(town,k,1,'missing'),'target','missing target is not silently replaced');r.add('hum_bow',2);const bow=r.groups.find(g=>g.type==='hum_bow');
 rejects(()=>service.hire(town,k,1,bow.id),'target','a different unit type cannot enter the selected group');
 const available=town.vol;town.vol=2;rejects(()=>service.hire(town,k,3,a.id),'volunteers','insufficient volunteers rejects the entire order');town.vol=available;
 const funds=P.gold;P.gold=0;rejects(()=>service.hire(town,k,3,a.id),'gold','insufficient gold rejects the entire order');P.gold=funds;
 const fame=P.renown;P.renown=0;rejects(()=>service.hire(town,k,t.partyCap(),a.id),'capacity','bulk hire checks headcount for the whole order');P.renown=fame;
 while(r.slots<10)r.add(k,1,'new');rejects(()=>service.hire(town,k,2,'new'),'groups','full-slot army cannot create another bulk group');
 ok(service.hire(town,k,2,a.id).ok,'a full-slot army can reinforce an existing group');
 P.txp[k]=P.troops[k]*t.txpNeed(k);a.form='loose';a.files=2;const count=a.count,id=a.id,oldGold=P.gold,oldXP=P.txp[k],oldOther=b.count;
 before=state();q=service.quoteGroupTraining(town,id,to);ok(q.ok&&q.count===count&&q.cost===count*service.trainCost(to)&&q.xpCost===count*t.txpNeed(k)&&state()===before,'whole-group quote shows exact gold and pooled-XP totals without mutation');
 ok(service.trainGroup(town,id,to).ok&&r.slots===10&&a.id===id&&a.type===to&&a.count===count,'whole-group upgrade preserves ID, count and slot in a full army');
 ok(b.type===k&&b.count===oldOther&&P.gold===oldGold-q.cost&&P.txp[k]===oldXP-q.xpCost,'upgrade does not change the duplicate and spends XP/gold exactly once');
 ok(a.form==='line'&&a.files===null,'upgraded group resets potentially incompatible formation/frontage');
 rejects(()=>service.trainGroup(town,id,to),'upgrade','an upgrade cannot be purchased twice');
 P.txp[k]=0;rejects(()=>service.trainGroup(town,b.id,to),'experience','partial experience cannot upgrade a whole group');P.txp[k]=P.troops[k]*t.txpNeed(k);
 P.woundedGroups=[{id:b.id,type:k,count:1}];P.wounded[k]=1;rejects(()=>service.trainGroup(town,b.id,to),'wounded-group','pending wounded cannot be stranded by an in-place type change');P.woundedGroups=[];P.wounded={};
 town.raided=G.day+2;rejects(()=>service.trainGroup(town,b.id,to),'training-unavailable','closed barracks reject whole-group upgrades');town.raided=0;
 // The barracks (town.js Barracks): how many of each with − + · +5 · Max, the hire bar's totals, Groups (automatic or chosen),
 // Hire (asked first when it spends much), Fill band, and the Train tab's whole-group upgrade. Nothing is spent before Hire.
 G.mode='world';G.modal=false;t.hidePanel();t.enterTown(town);t.act('tab','recruit');const bar=()=>panel.querySelector('.rec-bar').textContent;
 before=state();t.act('rec-add',k+':3');ok(state()===before&&G.town.cart[k]===3&&bar().includes(String(service.hireCost(k)*3)+'g'),'choosing how many updates the totals without spending');
 t.act('rec-add',k+':-1');ok(G.town.cart[k]===2,'− takes one off');t.act('rec-add',k+':1');
 t.act('rec-groups');const sel=panel.querySelector('[data-recruit-field="cartTarget:'+k+'"]');sel.value=b.id;sel.dispatchEvent(new Event('change',{bubbles:true}));
 ok(G.town.cartTarget[k]===b.id&&state()===before,'Groups: the order’s kind sent to a chosen group, nothing spent');
 const bc=b.count;t.act('rec-hire');ok(b.count===bc+3&&!Object.keys(G.town.cart).length,'Hire: one order, into the chosen group, and the order is cleared');
 const done=state();t.act('rec-hire');ok(state()===done,'Hire again with nothing ordered buys nothing');
 delete G.town.cartTarget[k];t.act('rec-add',k+':2');const room=r.groups.filter(g=>g.type===k).reduce((n,g)=>n+r.groupRoom(k,g.id),0),n0=P.troops[k];t.act('rec-hire');
 ok(P.troops[k]===n0+Math.min(2,room)&&r.slots===10,'automatic groups: into the groups of its kind with room, the army already full');
 t.act('rec-add',k+':2');town.vol=0;const unavailable=state();t.act('rec-hire');ok(state()===unavailable,'the willing are checked as you hire');town.vol=100;t.act('rec-clear');
 t.act('rec-add',k+':max');ok(G.town.cart[k]===Math.min(town.vol,t.partyCap()-t.partySize()),'Max: all you have room and gold for ('+G.town.cart[k]+')');t.act('rec-clear');
 {const g0=P.gold;P.gold=service.hireCost(k)*3;t.act('rec-add',k+':2');const asked=state();t.act('rec-hire');ok(G.town.cartAsk&&state()===asked&&/more than half your gold/.test(bar()),'spending more than half your gold asks first');
  t.act('rec-hire-no');ok(!G.town.cartAsk&&state()===asked,'Cancel: nothing bought');t.act('rec-clear');P.gold=g0}
 {while(r.slots>3)r.dismiss?.(r.groups[r.groups.length-1].id)||r.remove(r.groups[r.groups.length-1].type,r.groups[r.groups.length-1].count,r.groups[r.groups.length-1].id);t.act('rec-fill');const c2=G.town.cart,T=Object.keys(c2).reduce((n,x)=>n+c2[x],0),ranged=Object.keys(c2).some(x=>t.ST[x].range);
  ok(T>0&&T<=t.partyCap()-t.partySize()&&ranged&&Object.keys(c2).some(x=>!t.ST[x].range),'Fill band: your free places, melee and ranged ('+Object.keys(c2).map(x=>t.ST[x].n+' ×'+c2[x]).join(', ')+')');t.act('rec-clear')}
 {const g=r.groups.find(x=>x.type===k);P.txp[k]=P.troops[k]*t.txpNeed(k);t.act('rec-tab','train');const up=panel.querySelector('[data-act="rec-upgroup"][data-arg="'+g.id+':'+to+'"]');ok(up,'Train: a whole group’s upgrade offered');
  const id=g.id;t.act('rec-upgroup',id+':'+to);ok(r.groups.find(x=>x.id===id)?.type===to,'and done in one press, keeping its place');t.act('rec-tab','hire')}
 G.mode='world';t.saveGame(true,'quick');const saved=JSON.stringify(P.army);t.begin('hedge');t.loadGame('quick');ok(JSON.stringify(P.army)===saved,'upgraded group identity and composition survive current-schema save/load');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
