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
 // Real UI: choose quantity and duplicate, review/cancel, then confirm. No hidden mutation on draft changes.
 G.mode='world';G.modal=false;t.hidePanel();t.enterTown(town);t.act('tab','recruit');t.act('rec-pick',k);
 const change=(field,value)=>{const el=panel.querySelector('[data-recruit-field="'+field+'"]');el.value=String(value);el.dispatchEvent(new Event('change',{bubbles:true}))};
 before=state();change('hireTarget',b.id);change('hireCount',3);ok(state()===before&&panel.querySelector('.recruit-totals').textContent.includes(String(service.hireCost(k)*3)+'g'),'draft controls update totals without spending');
 const input=panel.querySelector('[data-recruit-field="hireCount"]');input.focus();input.value='4';input.dispatchEvent(new Event('input',{bubbles:true}));
 ok(panel.querySelector('[data-recruit-field="hireCount"]')===input&&document.activeElement===input&&G.town.hireCount===4,'live quantity typing preserves input identity, focus and the entered value');
 const reviewButton=panel.querySelector('[data-act=rec-review]');input.dispatchEvent(new Event('change',{bubbles:true}));ok(panel.querySelector('[data-act=rec-review]')===reviewButton,'blur/change does not replace the button the user is clicking');
 input.value='0';input.dispatchEvent(new Event('input',{bubbles:true}));ok(panel.querySelector('[data-act=rec-review]').disabled&&state()===before,'zero quantity disables review without spending');change('hireCount',3);
 ok(panel.querySelector('.recruit-totals').textContent.includes('Groups 10 → 10 / 10'),'UI previews the slot budget when reinforcing a full army');
 t.act('rec-review');ok(G.town.review&&state()===before&&panel.querySelector('[data-act=rec-confirm]'),'review is a separate non-mutating step');t.act('rec-cancel');ok(state()===before&&!G.town.review,'cancel discards only the draft confirmation');
 t.act('rec-review');const bc=b.count;t.act('rec-confirm');ok(b.count===bc+3&&!G.town.review,'actual confirmation executes one bulk transaction');const done=state();t.act('rec-confirm');ok(state()===done,'double confirmation cannot buy the same order twice');
 const quick=b.count;t.act('hire',k);ok(b.count===quick+1&&a.type===to,'quick Hire 1 also honours the selected destination for its type');
 // (b is full now: a group holds ten, so c merges into another)
 r.merge(c.id,r.groups.find(g=>g.type===k&&g!==b&&g!==c).id);change('hireTarget','new');t.act('hire',k);const created=r.groups[r.groups.length-1],afterNew=r.slots;t.act('hire',k);
 ok(created.count===2&&r.slots===afterNew&&G.town.hireTarget===created.id,'quick new-group hiring switches its next recruit to the newly created group');change('hireTarget',created.id);
 t.act('rec-review');const price=service.hireCost(k);P.attr.cha++;const changed=state();t.act('rec-confirm');ok(state()===changed&&!G.town.review&&panel.textContent.includes('order changed'),'changed prices require a fresh review instead of silently charging new terms');P.attr.cha--;
 t.act('rec-review');town.vol=0;const unavailable=state();t.act('rec-confirm');ok(state()===unavailable&&!G.town.review,'availability is rechecked at confirmation');town.vol=100;
 P.txp[k]=P.troops[k]*t.txpNeed(k);t.act('rec-pick',k+'>'+to);change('trainingGroup',b.id);before=state();t.act('rec-review');ok(state()===before&&G.town.review.code==='group-training','UI reviews a specific duplicate group upgrade');t.act('rec-confirm');ok(b.type===to&&a.id!==b.id&&r.slots===10,'UI upgrades the chosen group without merging it into an existing upgraded group');
 G.mode='world';t.saveGame(true,'quick');const saved=JSON.stringify(P.army);t.begin('hedge');t.loadGame('quick');ok(JSON.stringify(P.army)===saved,'upgraded group identity and composition survive current-schema save/load');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
