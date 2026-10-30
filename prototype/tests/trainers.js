'use strict';
// Trainers (world/trainers.js, data/trainers.js TRAINERS; doc/RANKS_DESIGN.md phase 3; the owner, 2026-10-30: "like Skyrim when
// some NPCs can teach you"; a lesson a flat experience by the trainer's expertise; "about 5 times a week", "for the whole army";
// a trainer "expert in different types of unit"; his level caps the training; yours (a train trait) in your camp, otherwise gold
// at a holding; "the player may need this trainer to upgrade some specific units").
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,X=t.TRAINERS;Kit.begin('soldier',1);Kit.clear();Kit.world();P.sk.lead.lv=10;const r=t.partyRoster(P),ash=t.townBy('Ashford');P.troops={};P.gold=2000;P.rep[ash.name]=90;
 const grp=(k,n)=>{r.add(k,n,'new');return r.groups.filter(x=>x.type===k).pop()};
 const sp=grp('hum_spear',5),bw=grp('hum_bow',5);
 ok(t.trainRole('hum_spear')==='spear'&&t.trainRole('hum_bow')==='bow'&&t.trainRole('hum_xbow')==='xbow'&&t.trainRole('hum_mage')==='caster'&&t.trainRole('hum_knight')==='cav'&&t.trainRole('hum_foot')==='foot','each kind its role');
 // ======== a holding's
 {const L=t.trainersAt(ash);ok(L.length>=1&&L.every(x=>x.level>=1&&x.level<=3&&x.roles.length&&x.name)&&t.trainersAt(ash)===L,'Ashford keeps its trainers (made once: '+L.map(x=>x.name+', '+t.trainLevelN(x)+' of '+t.trainRolesN(x)).join('; ')+')')}
 ok(!t.trainersAt(t.TOWNS.find(h=>!h.T.train)).length,'a holding that does not train has none');
 // (a known pair for the rest: Ashford's an expert of spears, a journeyman of bows)
 t.W.trainers[ash.name]=[{id:'A:0',name:'Hob the Spearmaster',roles:['spear'],level:2,town:ash.name},{id:'A:1',name:'Ida the Bowmaster',roles:['bow'],level:1,town:ash.name}];
 const [ex,jy]=t.trainersAt(ash);
 {const g0=P.gold,x0=t.rankXp(sp),q=t.lesson(ex,sp);ok(q.ok&&t.rankXp(sp)===x0+X.xp[1]&&P.gold===g0-X.gold[1]*2&&t.trainLeft(ex)===X.week-1,'a lesson: the spearmen +'+X.xp[1]+' (an expert\'s), for '+X.gold[1]*2+'g (his price, tier 2), '+(X.week-1)+' left this week')}
 ok(t.lessonWhy(ex,bw)==='Teaches Spear only'&&t.lessonWhy(jy,sp)==='Teaches Bow only','each teaches his roles only');
 {for(let i=0;i<40&&t.lessonWhy(jy,bw)==='';i++){t.lesson(jy,bw);if(t.trainLeft(jy)<1){t.G.day+=7}}ok(t.rankOf(bw)===X.cap[0]&&t.rankXp(bw)<t.rankNeed(bw)&&/rank 2 at most/.test(t.lessonWhy(jy,bw)),'a journeyman trains to rank '+X.cap[0]+' at most')}
 {const g=grp('hum_spear',3),wk=t.trainWeek();let n=0;while(t.lessonWhy(ex,g)===''&&n<20){t.lesson(ex,g);n++}ok(t.trainWeek()===wk&&t.trainLeft(ex)===0&&/No more lessons/.test(t.lessonWhy(ex,g))&&n<=X.week,X.week+' lessons a week, for your whole army');
  G.day+=7;ok(t.trainLeft(ex)===X.week,'next week, '+X.week+' again')}
 // ======== in the Barracks
 G.mode='world';G.modal=false;t.hidePanel();t.enterTown(ash);t.act('tab','recruit');t.act('rec-tab','train');
 {const b=document.querySelector('[data-act="trn-lesson"][data-arg="A:0|'+sp.id+'"]');ok(b&&!b.disabled&&/Trainers here/.test(document.getElementById('panel').textContent),'the Barracks\' Train & upgrade tab: its trainers, a lesson for each of your groups of theirs');
  const x0=t.rankXp(sp)+100*t.rankOf(sp);b.click();ok(t.rankXp(sp)+100*t.rankOf(sp)>x0,'one press: a lesson')}
 // ======== a special upgrade: an expert of its role
 {const pk=grp('hum_spear',2);t.rankGain(pk,t.RANKS.xp[2].reduce((a,b)=>a+b,0));ok(t.recruitment.quoteGroupTraining(ash,pk.id,'hum_pike').ok,'pikemen (tier 3) at Ashford: its expert of spears there, so it may');
  t.W.trainers[ash.name]=[jy];ok(t.recruitment.quoteGroupTraining(ash,pk.id,'hum_pike').code==='training-unavailable','with only a journeyman of bows there: not here');t.W.trainers[ash.name]=[ex,jy]}
 t.act('leave');
 // ======== yours: in camp, free
 {Kit.world();ok(!t.ownTrainers().length,'no Drillmaster, no Trainer: none of your own');P.tree.push('drill');P.perks.push('drill');const own=t.ownTrainers();
  ok(own.length===1&&own[0].own&&own[0].level===3&&own[0].roles.includes('spear'),'Drillmaster: your hero trains (Leadership 10: a master)');
  ok(t.lessonWhy(own[0],sp)==='Only in your camp','out of camp: not now');t.pitchCamp();const g0=P.gold,q=t.lesson(own[0],sp);ok(q.ok&&P.gold===g0,'in camp: a lesson, free');
  const pk=r.groups.find(g=>g.type==='hum_spear'&&t.rankReady(g));const tr=t.upgradeTrainer(null,'hum_pike');ok(tr&&tr.own&&t.recruitment.quoteGroupTraining(null,pk.id,'hum_pike').ok&&t.recruitment.quoteGroupTraining(null,pk.id,'hum_pike').cost===0,'and in camp your own master of spears makes pikemen, free');t.breakCamp()}
 {P.comps={tavi:{ap:0,role:'trainer'}};t.compInit('tavi');const c=t.ownTrainers().find(x=>x.id==='comp_tavi');ok(c&&c.roles.join()==='bow','a companion as Trainer: his roles by his kind (Tavi, a ranger: bows)')}
 // ======== saved
 {G.mode='world';G.modal=false;t.hidePanel();t.saveGame(true);const was=JSON.stringify(t.W.trainers);t.loadGame();ok(JSON.stringify(t.W.trainers)===was,'saved and loaded: the holdings\' trainers and their week')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
