'use strict';
// Count actual render calls, then compare with real battle actors, not just the displayed label.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;P.troops={hum_foot:3};P.comps={};
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);const cam={x:P.x-100,y:P.y-100};t.frame();
 function count(o){const marcher=window.drawMarcher,leader=window.drawMarchLeader;let n=0;const inView=o.inView;o.inView=()=>true;
  try{window.drawMarcher=()=>n++;window.drawMarchLeader=()=>n++;window.eval('BANNERQ=[]');const ents=[];o.draw(ents,cam,t.vis());ents.forEach(e=>e.f());return n}finally{window.drawMarcher=marcher;window.drawMarchLeader=leader;o.inView=inView}
 }
 const chief=t.newChief('bandits',1),lord=W.lords.find(l=>!l.dead);Object.assign(lord,{inside:null,x:P.x+25,y:P.y});lord.troops=Array(7).fill('hum_foot');
 const cases=[
  ['ordinary band',t.asParty({kind:'bandits',troops:Array(8).fill('militia'),x:P.x+25,y:P.y}),'party'],
  ['band with an additional chieftain',t.asParty({kind:'bandits',ld:chief,troops:Array(7).fill('militia'),x:P.x+25,y:P.y}),'party'],
  ['band with a chief already in its troop list',t.asParty({kind:'bandits',ld:t.newChief('bandits',1),troops:[...Array(7).fill('militia'),'chief'],x:P.x+25,y:P.y}),'party'],
  ['lord and seven soldiers',lord,'lord'],
  ['patrol with no extra commander actor',t.asParty({pt:true,home:home.name,fac:home.owner,troops:Array(8).fill('hum_foot'),x:P.x+25,y:P.y}),'patrol'],
  ['eight-wolf pack',t.asMonster({id:'wolf',n:8,lv:1,x:P.x+25,y:P.y,hx:P.x+25,hy:P.y,cool:0}),'monster']
 ];
 for(const [name,o,kind] of cases){Kit.world();const drawn=count(o);ok(drawn===8,name+': exactly eight world figures are drawn');
  G.enc={kind,ref:o,list:o.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
  ok(t.B.units.filter(u=>u.team===1).length===drawn,name+': real battle actor count matches world sprites');window.eval('B=null');
 }
 Kit.world();const own=t.MarchArmy.of(P);ok(own.units.length===3&&t.marchSeparateLeader(P)&&P.fighters===4,'player marches three soldiers and one separate hero, without a duplicate hero');
 P.comps.brann={ap:5};t.compInit('brann');const companion=t.asParty({cid:'brann',troops:Array(7).fill('hum_foot'),x:P.x+25,y:P.y});P.comps.brann.party=companion;
 ok(count(companion)===8&&t.battleLeaders({kind:'field',allies:[t.forceOf(companion)],foes:[]}).length===1,'detached companion draws seven troops plus its one reinforcement leader');
});
