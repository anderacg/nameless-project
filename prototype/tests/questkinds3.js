'use strict';
// The last two kinds (doc/QUESTS_DESIGN.md §5.6, §5.9): a caravan to see through (a merchant's, offered only after a caravan was
// taken on the holding's roads: a real one leaves, paid at its gate with you beside it; taken, or there without you, failed), and
// the missing (a priest's or a reeve's: a band that beats a caravan carries off one of its people; break that band, on the road
// or in its camp, and they ride home with you).
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',11);Kit.world();Kit.clear();
 const ash=t.townBy('Ashford');P.quests=[];P.level=10;P.renown=100;
 // ======== the givers
 {const temple=t.TOWNS.find(x=>x.T&&x.T.temple),pr=temple&&t.Givers.of(temple).find(g=>g.role==='priest');
  ok(!!pr&&pr.jobs.includes('missing')&&t.GIVERS[pr.role].where==='the temple','a holding with a temple has a priest, who asks after the missing ('+(pr&&t.Givers.label(pr))+')');
  ok(!t.TOWNS.some(x=>!(x.T&&x.T.temple)&&t.Givers.of(x).some(g=>g.role==='priest')),'none where there is no temple');
  ok(t.GIVERS.merchant.jobs.includes('convoy')&&t.GIVERS.reeve.jobs.includes('missing'),'a merchant asks for guards for a caravan; a reeve after a villager taken')}
 // ======== a caravan to see through
 const clearNews=()=>{const N=t.newsW();N.items=N.items.filter(it=>it.k!=='caravan')};clearNews();
 ok(!t.makeQuest('convoy',ash),'no caravan taken on its roads: none offered');
 t.newsRecord('caravan',{x:ash.x+60,y:ash.y+30},{from:'Ashford',band:1});
 const convoy=()=>{let q=null;for(let k=0;k<10&&!q;k++)q=t.makeQuest('convoy',ash);return q};
 {const q=convoy();ok(q&&q.to&&q.cause.includes('taken on the road')&&/Guard a caravan to /.test(q.title),'a caravan taken: offered ('+(q&&q.title)+'; '+(q&&q.cause)+')');
  const n0=W.caravans.length;q.accept();const c=q.caravan();
  ok(c&&W.caravans.length===n0+1&&c.from==='Ashford'&&c.to===q.to&&Object.keys(c.goods).length>0&&c.guards>0,'taken: a real caravan leaves Ashford for '+q.to+' ('+t.cargoText(c)+', '+c.guards+' guards)');
  const g=t.questGoal(q);ok(g&&Math.abs(g.x-c.x)<1&&/caravan to/.test(g.name),'it points at the caravan');
  P.x=c.x+40*TILE;P.y=c.y;t.worldEmit('caravan:arrived',{caravan:c,to:t.townBy(q.to)});
  ok(!P.quests.includes(q)&&G.msgs.some(m=>/without you/.test(m.m)),'there without you: failed')}
 {const q=convoy();q.accept();const c=q.caravan(),g0=P.gold;P.x=c.x+3*TILE;P.y=c.y;t.worldEmit('caravan:arrived',{caravan:c,to:t.townBy(q.to)});
  ok(!P.quests.includes(q)&&P.gold>g0&&G.msgs.some(m=>/factor there pays you/.test(m.m)),'there with you beside it: paid at its gate (+'+(P.gold-g0)+' gold)')}
 {const q=convoy();q.accept();const c=q.caravan();t.worldEmit('caravan:beaten',{caravan:c,band:null,lord:null});
  ok(!P.quests.includes(q)&&G.msgs.some(m=>/taken on the road/.test(m.m)),'taken on the road: failed')}
 // (the real road: the caravan's own brain takes it to its gate, you riding beside it, no band about)
 {const q=convoy(),keep=t.bandits.slice();t.bandits.length=0;q.accept();const c=q.caravan(),g0=P.gold;G.encCool=1e9;let k=0;
  for(;k<6000&&P.quests.includes(q);k++){G.mode='world';G.modal=false;P.x=c.x+8;P.y=c.y+8;P.tx=null;t.updateWorld(.1)}t.bandits.push(...keep);
  ok(!P.quests.includes(q)&&P.gold>g0,'on the real road: it reaches '+q.to+' in '+(k*.1).toFixed(0)+' s of map time, you beside it, and you are paid')}
 {const q=convoy();q.accept();const c=q.caravan();W.caravans=W.caravans.filter(x=>x!==c);t.questDay();ok(!P.quests.includes(q),'turned back (gone from the roads): closed')}
 clearNews();P.quests=[];
 // ======== the missing
 const band=t.asParty({x:ash.x+300,y:ash.y+80,n:5,kind:'bandits',list:t.makeEnemies(5,false,'bandits'),t:0,a:0,idle:true,cool:99,ld:t.newChief('bandits',2)});t.bandits.push(band);
 ok(!t.makeQuest('missing',ash),'no one of Ashford\'s taken: none offered');
 {const cv={from:'Ashford',x:ash.x+280,y:ash.y+70,mine:false};t.worldEmit('caravan:beaten',{caravan:cv,band,lord:null});const c=band.carry&&band.carry[0];
  ok(c&&c.home==='Ashford'&&c.n&&c.as,'a band beats a caravan of Ashford: it carries off '+(c&&c.n)+', a '+(c&&c.as));
  const q=t.makeQuest('missing',ash);ok(q&&q.pn===c.n&&q.cap===c.cap&&q.cause.includes(c.n),'offered: '+(q&&q.title)+' ('+(q&&q.cause)+')');
  q.accept();const g=t.questGoal(q);ok(g&&g.r>0,'the band a lead: where it was last seen');
  const other=t.asParty({x:ash.x-300,y:ash.y,n:4,kind:'bandits',list:t.makeEnemies(4,false,'bandits'),t:0,a:0,idle:true,cool:99});t.bandits.push(other);
  t.worldEmit('band:beaten',{band:other});ok(!q.done,'another band broken: not freed');
  t.worldEmit('band:beaten',{band});ok(q.done&&!(band.carry&&band.carry.length)&&G.msgs.some(m=>new RegExp('You free '+c.n).test(m.m)),'its band broken: '+c.n+' freed, to ride home with you');
  const g0=P.gold;t.payQuest(q,'Ashford');ok(!P.quests.includes(q)&&P.gold>g0,'reported at Ashford: paid')}
 {t.worldEmit('caravan:beaten',{caravan:{from:'Ashford',x:ash.x+1,y:ash.y+2},band,lord:null});const q=t.makeQuest('missing',ash);q.accept();
  const s={x:ash.x+500,y:ash.y,name:'Test camp',bands:[band],i:-1};t.bandits.splice(t.bandits.indexOf(band),1);W.sites.push(s);
  const g=t.questGoal(q);ok(g&&g.x===s.x&&/at the Test camp/.test(g.name),'its band gone to ground in a camp: it points there');
  t.worldEmit('band:beaten',{band});ok(q.done,'the camp cleared (its bands broken): freed');W.sites.pop();P.quests=[]}
 {t.bandits.push(band);t.worldEmit('caravan:beaten',{caravan:{from:'Ashford',x:ash.x+3,y:ash.y+4},band,lord:null});const q=t.makeQuest('missing',ash);q.accept();
  t.bandits.splice(t.bandits.indexOf(band),1);t.questDay();ok(!P.quests.includes(q)&&G.msgs.some(m=>/No one knows what became of/.test(m.m)),'its band gone, broken by another: closed')}
 // ======== on the board: their words
 ok(t.NOTICE.kinds.convoy==='Guards wanted'&&t.NOTICE.kinds.missing==='Missing','on the notice board: "Guards wanted", "Missing"');
 Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
