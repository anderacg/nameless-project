'use strict';
// A caravan afraid of you near where it is bound (world/brains.js CaravanBrain, caravans.js CARAVAN_FEAR): you standing at its
// gate, it turns for another holding of its realm instead of pacing in and out forever; the gate nearer it than you, it runs for it.
// Two on the same way (CARAVAN_GAP): the one behind holds back, so they string out along the road.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TA=t.TravelAwareness,sees=TA.sees;Kit.begin('soldier',1);Kit.clear();Kit.world();G.mode='world';G.modal=false;
 const f=t.FIDS.find(x=>t.TOWNS.filter(y=>y.owner===x).length>=2),[to,other]=t.TOWNS.filter(y=>y.owner===f),gate=t.gateGoal(to);
 const mk=(x,y)=>{const c=t.asParty({x,y,cv:true,fac:f,troops:['militia'],guards:1,from:other.name,to:to.name,goods:{},dir:1,cool:0});W.caravans.length=0;W.caravans.push(c);return c};
 try{TA.sees=()=>true;t.Timed.of(P,'hostile').set(f,20);
  {P.x=gate.x;P.y=gate.y;const c=mk(gate.x+50,gate.y);for(let i=0;i<5;i++)t.BRAINS.caravan.think(c,.05);ok(c.to!==to.name&&t.townBy(c.to).owner===f,'you at its gate: it turns for '+c.to+', another holding of its realm')}
  {P.x=gate.x+70;P.y=gate.y;const c=mk(gate.x+25,gate.y),d0=Math.hypot(c.x-gate.x,c.y-gate.y);for(let i=0;i<5;i++)t.BRAINS.caravan.think(c,.05);
   ok(c.to===to.name&&Math.hypot(c.x-gate.x,c.y-gate.y)<d0||c.gone,'the gate nearer it than you: it runs for it ('+Math.round(d0)+' → '+Math.round(Math.hypot(c.x-gate.x,c.y-gate.y))+' px)')}
  {P.x=gate.x+400;P.y=gate.y+400;const c=mk(gate.x+120,gate.y),dp=Math.hypot(c.x-P.x,c.y-P.y);for(let i=0;i<5;i++)t.BRAINS.caravan.think(c,.05);ok(Math.hypot(c.x-P.x,c.y-P.y)>=dp-.01||Math.hypot(c.x-gate.x,c.y-gate.y)<120,'you far, between it and nothing: it keeps away from you or makes for its gate')}
 }finally{TA.sees=sees;t.Timed.of(P,'hostile').clear(f);W.caravans.length=0}
 {P.x=-9999;P.y=-9999;const a=t.asParty({x:gate.x+200,y:gate.y,cv:true,fac:f,troops:['militia'],guards:1,from:other.name,to:to.name,goods:{},dir:1,cool:0}),b=t.asParty({x:gate.x+206,y:gate.y+2,cv:true,fac:f,troops:['militia'],guards:1,from:other.name,to:to.name,goods:{},dir:1,cool:0});
  W.caravans.length=0;W.caravans.push(a,b);const g0=Math.hypot(a.x-b.x,a.y-b.y);let da=0,db=0;
  for(let i=0;i<40;i++){const [ax,ay,bx,by]=[a.x,a.y,b.x,b.y];t.BRAINS.caravan.think(a,.05);t.BRAINS.caravan.think(b,.05);da+=Math.hypot(a.x-ax,a.y-ay);db+=Math.hypot(b.x-bx,b.y-by)}const g1=Math.hypot(a.x-b.x,a.y-b.y);
  ok(g1>g0+8&&da>10&&db>10,'two caravans on the same way: one holds back till they string out ('+Math.round(g0)+' → '+Math.round(g1)+' px apart; they went '+Math.round(da)+' and '+Math.round(db)+' px)');W.caravans.length=0}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
