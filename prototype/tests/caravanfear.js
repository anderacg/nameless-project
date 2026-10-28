'use strict';
// A caravan afraid of you near where it is bound (world/brains.js CaravanBrain, caravans.js CARAVAN_FEAR): you standing at its
// gate, it turns for another holding of its realm instead of pacing in and out forever; the gate nearer it than you, it runs for it.
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
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
