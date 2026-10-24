'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const town=Kit.goHome('Ashford'),k=town.hires(town.races[0])[0];P.troops={[k]:3};P.comps={};P.wounded={};P.woundedGroups=[];P.gold=10000;town.vol=100;town.sacked=town.raided=town.turmoil=0;
 const r=t.partyRoster(P),g=r.groups[0],cost=t.hireCost(k),tick=()=>{t.recruitment.autoWait=0;t.autoReinforceStep(1,.6)},near=()=>{P.x=town.x;P.y=town.y;G.paused=false;G.modal=false;Kit.world()};near();
 G.char='roster';t.openChar();t.act('party-select',g.id);
 ok(t.panel.textContent.includes('Battle Group')&&!t.panel.textContent.includes('New recruit group')&&!t.panel.querySelector('[data-act="army-recruit"]'),'Battle Group replaces Battle order and Army recruit-target controls are removed');
 ok(t.panel.querySelector('[data-act="army-edit"]')?.textContent==='Manage Group'&&!t.panel.querySelector('[data-act="army-auto-reinforce"]'),'unit details lead to Manage Group rather than a direct reinforce action');
 t.act('army-edit',g.id);let button=t.panel.querySelector('[data-act="army-auto-reinforce"]');ok(button?.getAttribute('aria-pressed')==='false','Manage Group contains an accessible off-by-default Auto Reinforce toggle');
 button.click();button=t.panel.querySelector('[data-act="army-auto-reinforce"]');ok(t.autoReinforceOn(g.id)&&button.getAttribute('aria-pressed')==='true','toggle changes the saved group setting and pressed state');
 near();P.x=town.x+t.REACH+20;tick();ok(P.troops[k]===3,'no recruitment outside interaction reach');
 near();P.wounded[k]=2;P.woundedGroups=[{id:g.id,type:k,count:2}];const gold=P.gold,vol=town.vol;tick();ok(P.troops[k]===8&&P.gold===gold-5*cost&&town.vol===vol-5,'near a matching holding fills only free slots and pays normal gold and volunteers');
 const fullGold=P.gold;tick();ok(P.gold===fullGold&&t.autoReinforceOn(g.id)&&r.groups.length===1,'full group stays enabled without repeated spending or new groups');
 r.remove(k,3,g.id);P.gold=cost*2;tick();ok(P.troops[k]===7&&P.gold===0,'limited gold permits an affordable partial reinforcement');
 P.gold=10000;town.vol=0;tick();ok(P.troops[k]===7,'no volunteers means no automatic hire');town.vol=100;
 town.raided=G.day+1;tick();ok(P.troops[k]===7,'raided hiring places cannot reinforce');town.raided=0;
 const allowed=t.recruitment.rules.canHire,capacity=t.recruitment.rules.capacity;
 try{t.recruitment.rules.canHire=()=>false;tick();ok(P.troops[k]===7,'normal standing requirements are enforced');t.recruitment.rules.canHire=allowed;t.recruitment.rules.capacity=()=>t.partySize();tick();ok(P.troops[k]===7,'army headcount capacity is enforced')}finally{t.recruitment.rules.canHire=allowed;t.recruitment.rules.capacity=capacity}
 G.paused=true;tick();ok(P.troops[k]===7,'paused campaign cannot auto hire');G.paused=false;
 P.army.autoReinforce[g.id]=false;tick();ok(P.troops[k]===7,'switching off stops recruitment');P.army.autoReinforce[g.id]=true;
 const other=r.add(k,1,'new'),duplicate=r.groups.find(x=>x.id!==g.id);tick();ok(other===1&&duplicate.count===1&&P.troops[k]===9,'only the enabled group refills, leaving duplicate groups unchanged');
 const races=town.races;town.races=[];r.remove(k,1,g.id);try{tick();ok(r.groups.find(x=>x.id===g.id).count===7,'a holding without matching troops cannot reinforce')}finally{town.races=races}
 t.saveGame(true);P.army.autoReinforce={};t.loadGame();ok(t.autoReinforceOn(g.id),'per-group toggle survives actual campaign save and load');
});
