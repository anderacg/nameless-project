'use strict';
// Hunters (the owner, 2026-11-15: "Add hunters and they will hunt wildlife"; world/hunters.js, data/hunters.js HUNTERS): a village's
// band sets out by day for wild game in range of it (none at night), closes on a herd and stalks it, the herd bolting from them as
// from anyone; a shot that hits takes one from the herd, they carry it home and the holding gains its meat; too few to lift it, or
// driven off, it lies where it fell as a carcass with its meat; HUNTERS.on false: none. Their steps draw no Math.random.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,X=t.HUNTERS,H=t.Hunters,DAY=t.DAY,keep={...X};window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;G.paused=false;G.speed=1;
 // (Math.random counted while the hunters step: the system calls Hunters.step by name)
 const step0=H.step;let draws=0;H.step=function(d){const r0=Math.random;Math.random=function(){draws++;return r0.apply(this,arguments)};try{return step0.call(this,d)}finally{Math.random=r0}};
 try{
  // a village (else a hamlet) with open, reachable ground at a walk from its gate, for a herd there
  let home=null,spot=null;
  for(const z of t.TOWNS.filter(z=>z.kind==='village').concat(t.TOWNS.filter(z=>z.kind==='hamlet'))){if(z.ruined())continue;
   for(let k=0;k<24&&!spot;k++){const a=k/24*6.283,x=z.x+Math.cos(a)*170,y=z.y+12+Math.sin(a)*170;
    if(t.passable(t.terrAt(x,y))&&!t.TOWNS.some(o=>o!==z&&Math.hypot(o.x-x,o.y-y)<120)&&t.Router.reach(z,{x,y})&&t.clearLine(z.x,z.y+12,x,y))spot={x,y}}
   if(spot){home=z;break}}
  ok(!!home,'a village or hamlet with open ground near it: '+(home?home.name+' ('+home.kind+')':'none'));if(!home)return;
  Kit.goTo(home.x+20,home.y-30);t.ensureEcon(home);
  const herd=(id,n)=>{const c=t.asHerd({crit:true,id,n,x:spot.x,y:spot.y,hx:spot.x,hy:spot.y,dir:1,t:9,a:0,cool:0,idle:true,tire:0});W.critters.push(c);return c};
  // (only our band goes out: the others of the holdings near you stay in today)
  const ours=()=>{G.clock=DAY*.1;W.critters=[];H.list=[];H.step(.02);const bs=H.list.filter(h=>h.home===home.name);
   for(const h of H.list){h.plan();h.out=false;h.look=0}const h=bs[0];h.out=true;h.sets=0;return h};
  const run=(n,until,clock=.15)=>Kit.frames(n,.05,d=>{G.clock=DAY*clock;t.updateWorld(d)},until);
  // ---- they set out by day for game in range, never at night
  X.hit=0;let h=ours();const c=herd('deer',4),m0=home.stock.meat||0;
  ok(H.list.some(b=>b.home===home.name)&&H.list.every(b=>X.kinds[t.townBy(b.home).kind])&&H.list.every(b=>b.men.length>=X.men[0]&&b.men.length<=X.men[1]&&b.men.every(m=>m.name)),
   'the villages and hamlets near you keep their bands ('+H.list.length+', '+X.men.join('-')+' men each, named), '+home.name+' '+H.list.filter(b=>b.home===home.name).length);
  run(2);ok(h.st==='out'&&h.herd===c&&!h.inside,'by day their band ('+h.names()+') sets out from '+home.name+' after the '+c.id+' '+Math.round(Math.hypot(c.x-home.x,c.y-home.y))+' px off');
  ok(H.seen().includes(h)&&t.worldObjects().includes(h)&&/hunter/i.test(h.tip())&&h.tip().includes(home.name),'out of doors they are on the map, hovered: '+h.tip().replace(/<[^>]+>/g,' ').trim());
  // ---- they close on the herd; stalking, it notices them only near; a shot (a miss) and it bolts
  let near=1e9,stalked=false,shot=false,bolt=false;const was={};
  run(4000,()=>{near=Math.min(near,Math.hypot(c.x-h.x,c.y-h.y));if(h.st==='stalk')stalked=true;if(h.arrow&&!shot){shot=true;was.x=c.x;was.y=c.y;was.d=Math.hypot(c.x-h.x,c.y-h.y)}
   if(shot&&t.WildlifeThreats.chosen.get(c)===h&&Math.hypot(c.x-h.x,c.y-h.y)>was.d+4)bolt=true;return bolt});
  ok(stalked&&near<=X.bow+1,'they walk up and stalk it, to bow range (nearest '+near.toFixed(0)+' px, the bow '+X.bow+')');
  ok(shot&&bolt,'they loose an arrow and the herd bolts from them, as from anyone (WildlifeThreats)');
  ok(c.n===4,'a miss takes none from it ('+c.n+')');
  // ---- a hit: one fewer in the herd, carried home, the holding's meat
  X.hit=1;h.tries=0;run(6000,()=>h.st==='fetch'||h.st==='home'||h.st==='in');
  ok(c.n===3&&W.critters.includes(c),'a hit brings one down: the herd one fewer ('+c.n+')');
  run(4000,()=>h.st==='home');ok(h.st==='home'&&h.load.length===1&&h.load[0]==='deer'&&!t.Carcass.list.length,'they lift it and carry it home on their backs');
  run(8000,()=>h.st==='in');const m1=home.stock.meat||0;
  ok(h.st==='in'&&h.done&&!h.load.length&&m1-m0===t.CRITTERS.deer.meat,'home at the gate: '+home.name+' gains its meat ('+m0+' → '+m1+')');
  run(200);ok(h.st==='in','one hunt a day: they stay in');
  // ---- too few to lift a stag: it lies where it fell, its meat on it; the last of a herd: the herd gone
  h=ours();h.men=h.men.slice(0,1);const s=herd('stag',1);t.Carcass.list=[];run(12000,()=>h.st==='home'||h.done);
  const cs=t.Carcass.list.find(k=>k.wild==='stag');
  ok(!W.critters.includes(s)&&s.gone&&cs&&cs.items.some(i=>i.k==='good'&&i.id==='meat'&&i.n===t.CRITTERS.stag.meat)&&!h.load.length,'one man cannot lift a stag: it lies where it fell, '+(cs?cs.what():'none')+', and the herd of one is gone');
  // ---- driven off before they lift it: left lying, home at a run
  h=ours();const r=herd('rabbit',3);t.Carcass.list=[];run(12000,()=>h.st==='fetch');const f=h.fell;
  W.monsters.push({id:'wolf',x:h.x+20,y:h.y});try{h.step(.02)}finally{W.monsters.length=0}
  ok(f&&h.st==='home'&&!h.load.length&&t.Carcass.list.some(k=>k.wild==='rabbit'&&Math.hypot(k.x-f.x,k.y-f.y)<.01),'a beast near before they lift it: they run home, the kill left where it fell');
  // ---- at night: none sets out, and one out goes in
  G.clock=DAY*.7;H.list=[];W.critters=[];herd('deer',3);H.step(.02);for(const b of H.list){b.plan();b.out=true;b.sets=0;b.look=0}for(let i=0;i<20;i++)H.step(.02);
  ok(H.list.length&&H.list.every(b=>b.st==='in'),'at night none of the '+H.list.length+' bands sets out');
  h=ours();herd('deer',3);run(3);const out=h.st!=='in';G.clock=DAY*.65;H.step(.02);ok(out&&h.st==='in','one still out as night falls goes in');
  ok(draws===0,'their steps drew no Math.random ('+draws+')');
  // ---- off: none
  X.on=false;H.step(.02);const c2=herd('deer',3);run(200,null,.15);ok(!H.list.length&&!H.seen().length&&c2.n===3,'HUNTERS.on false: no hunters, the game left alone');
 }finally{H.step=step0;Object.assign(X,keep)}
});
