'use strict';
window.RUN=()=>{const t=T,P=t.P,G=t.G,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 t.begin('soldier');G.quietEvents=true;P.gold=100000;P.renown=10000;const town=t.townBy('Ashford'),r=t.partyRoster(P),service=t.recruitment,k=t.RACES.human.melee,to=t.UP[k][0];P.rep[town.name]=100;town.vol=100;P.sk.lead.lv=10;// all ten slots (a new band starts at three)
 r.add(k,4);r.add(k,1,'new');const a=r.groups[0],b=r.groups[1],state=()=>JSON.stringify({gold:P.gold,troops:P.troops,army:P.army,wounded:P.wounded,wg:P.woundedGroups,vol:town.vol,pop:town.pop});
 const rejects=(fn,code,label)=>{const before=state(),q=fn();ok(!q.ok&&q.code===code&&state()===before,label)};
 let before=state(),q=service.quoteHire(town,k,5,b.id);ok(q.ok&&q.cost===5*service.hireCost(k)&&state()===before,'bulk quote is read-only and multiplies the existing unit price');
 const gold=P.gold,vol=town.vol;service.hire(town,k,5,b.id);ok(a.count===4&&b.count===6&&P.gold===gold-q.cost&&town.vol===vol-5,'bulk hire spends exact totals and reinforces only the chosen duplicate');
 const slots=r.slots;service.hire(town,k,3,'new');const c=r.groups[r.groups.length-1];ok(c.count===3&&r.slots===slots+1,'bulk new-group recruitment uses one slot, not one per soldier');
 for(const n of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER])rejects(()=>service.hire(town,k,n,a.id),'amount','invalid quantity '+n+' is non-mutating');
 rejects(()=>service.hire(town,k,1,'missing'),'target','missing target is not silently replaced');r.add('hum_bow',2);const bow=r.groups.find(g=>g.type==='hum_bow');
 rejects(()=>service.hire(town,k,1,bow.id),'target','a different unit type cannot enter the selected group');
 const available=town.vol;town.vol=2;rejects(()=>service.hire(town,k,3,a.id),'volunteers','insufficient volunteers rejects the entire order');town.vol=available;
 const funds=P.gold;P.gold=0;rejects(()=>service.hire(town,k,3,a.id),'gold','insufficient gold rejects the entire order');P.gold=funds;
 {const v=town.vol;town.vol=1e4;rejects(()=>service.hire(town,k,t.partyCap(),a.id),'capacity','bulk hire checks headcount for the whole order');town.vol=v}
 while(r.slots<10)r.add(k,1,'new');rejects(()=>service.hire(town,k,2,'new'),'groups','full-slot army cannot create another bulk group');
 ok(service.hire(town,k,2,a.id).ok,'a full-slot army can reinforce an existing group');
 t.rankGain(a,t.RANKS.xp[t.ST[k].tier].reduce((x,y)=>x+y,0));/* (rank 5, no mastery: nothing to carry) */a.form='loose';a.files=2;const count=a.count,id=a.id,oldGold=P.gold,oldOther=b.count;
 before=state();q=service.quoteGroupTraining(town,id,to);ok(q.ok&&q.count===count&&q.cost===count*service.trainPrice(to)&&q.rank===t.RANKS.max&&state()===before,'whole-group quote: its gold and its rank, without mutation');
 ok(service.trainGroup(town,id,to).ok&&r.slots===10&&a.id===id&&a.type===to&&a.count===count,'whole-group upgrade preserves ID, count and slot in a full army');
 ok(b.type===k&&b.count===oldOther&&P.gold===oldGold-q.cost&&t.rankOf(a)===1,'upgrade does not change the duplicate, spends its gold once, and starts again at rank 1');
 ok(a.form==='line'&&a.files===null,'upgraded group resets potentially incompatible formation/frontage');
 rejects(()=>service.trainGroup(town,id,to),'upgrade','an upgrade cannot be purchased twice');
 rejects(()=>service.trainGroup(town,b.id,to),'experience','a group below rank '+t.RANKS.max+' cannot upgrade');t.rankGain(b,1e6);
 P.woundedGroups=[{id:b.id,type:k,count:1}];P.wounded[k]=1;rejects(()=>service.trainGroup(town,b.id,to),'wounded-group','pending wounded cannot be stranded by an in-place type change');P.woundedGroups=[];P.wounded={};
 {const tier=t.TRAIN_PLACE.tier;t.TRAIN_PLACE.tier=1;town.raided=G.day+2;rejects(()=>service.trainGroup(town,b.id,to),'training-unavailable','closed barracks reject whole-group upgrades that need a holding');town.raided=0;t.TRAIN_PLACE.tier=tier}
 // The barracks (town.js Barracks, ui/hiredesk.js; the owner, 2026-10-31: whole units, and a section to replenish): Recruit unit, one
 // whole unit of its kind's size a press, into a free slot; Refill and Refill all, your short units; the willing and your gold checked
 // as you press; asked first when a press spends more than half your gold; the Upgrade tab's whole-group upgrade.
 G.mode='world';G.modal=false;t.hidePanel();t.enterTown(town);t.act('tab','recruit');const n=t.unitSize(k),txt=()=>panel.textContent,go=a=>{t.act(a[0],a[1]);if(G.town.recAsk)t.act('rec-ok')};
 {const u=panel.querySelector('[data-act="rec-unit"][data-arg="'+k+'"]');ok(r.slots>=r.groupLimit&&u.disabled&&/No free unit slot/.test(u.title),'a full army: Recruit unit greyed, no free unit slot')}
 {const g=r.groups.find(x=>x.type===k&&r.groupRoom(k,x.id)>0),need=r.groupRoom(k,g.id),c0=g.count;before=state();go(['rec-refill',g.id]);ok(g.count===c0+need&&g.count+r.wounded(g.id)===n,'Refill: a short unit filled to its '+n+' ('+c0+' to '+g.count+')')}
 town.vol=1000;go(['rec-refillall']);town.vol=100;ok(r.groups.filter(x=>x.type===k).every(x=>!r.groupRoom(k,x.id)),'Refill all: every short unit of the kind filled');
 {r.remove(k,2,b.id);town.vol=0;t.act('tab','recruit');const f=panel.querySelector('[data-act="rec-refill"][data-arg="'+b.id+'"]'),was=state();t.act('rec-refill',b.id);ok(f.disabled&&state()===was,'none willing: Refill greyed, nothing bought');town.vol=100}
 {while(r.slots>3){const g=r.groups[r.groups.length-1];r.remove(g.type,g.count,g.id)}t.act('tab','recruit');const s0=r.slots,m0=P.troops[k]||0;go(['rec-unit',k]);const g=r.groups[r.groups.length-1];
  ok(r.slots===s0+1&&g.type===k&&g.count===n&&P.troops[k]===m0+n&&/A new unit of/.test(txt()),'Recruit unit: one whole unit of '+n+' into a free slot')}
 {const g0=P.gold;P.gold=Math.floor(n*service.hireCost(k)*1.5);const asked=state();t.act('rec-unit',k);ok(G.town.recAsk&&state()===asked&&/more than half your gold/.test(txt()),'spending more than half your gold asks first');
  t.act('rec-no');ok(!G.town.recAsk&&state()===asked,'Cancel: nothing bought');P.gold=g0}
 {const g=r.groups.find(x=>x.type===k);t.rankGain(g,1e6);t.act('rec-tab','train');const up=panel.querySelector('[data-act="rec-upgroup"][data-arg="'+g.id+':'+to+'"]');ok(up,'Upgrade: a whole group’s upgrade offered (at rank '+t.RANKS.max+')');
  const id=g.id;t.act('rec-upgroup',id+':'+to);ok(r.groups.find(x=>x.id===id)?.type===to,'and done in one press, keeping its place');t.act('rec-tab','hire')}
 G.mode='world';t.saveGame(true,'quick');const saved=JSON.stringify(P.army);t.begin('hedge');t.loadGame('quick');ok(JSON.stringify(P.army)===saved,'upgraded group identity and composition survive current-schema save/load');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
