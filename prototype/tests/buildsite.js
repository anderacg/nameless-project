'use strict';
// A building site's crew (gfx/structures.js drawSite, SITE; the owner, 2026-11-04: "add all three"): builders of the holding's
// people walk the planks and hammer, the soldiers' overhead blow and a spark at the strike; a bigger site has two of them and a
// carrier bringing planks; a small one its one builder. Drawn only; off the battle's figures, the small builder as before.
Kit.suite(({ok})=>{
 const t=T,S=t.SITE;Kit.begin('soldier',1);Kit.world();
 const pn=performance.now,wf=window.figWorker,seen=[];
 const run=(N,race,secs)=>{seen.length=0;let now=0;performance.now=()=>now;window.figWorker=(...a)=>{seen.push(a);return wf(...a)};
  const s=t.mkc(N,N,g=>{g.fillStyle='#887766';g.fillRect(0,0,N,N)});
  try{for(let k=0;k<secs*20;k++){now=k*50;t.drawSite(s,40,100,N,.5,false,7,race)}}finally{performance.now=pn;window.figWorker=wf}
  const at=new Map();return{poses:new Set(seen.map(a=>a[3])),races:new Set(seen.map(a=>a[1])),carry:seen.some(a=>a[4]),per:seen.length/(secs*20)}};
 {const r=run(64,'dwarf',12);
  ok([12,13,14].every(p=>r.poses.has(p))&&[2,3,4,5].some(p=>r.poses.has(p)),'a builder walks to his spot and hammers: the overhead blow\'s three frames ('+[...r.poses].sort((a,b)=>a-b).join(' ')+')');
  ok(r.races.size===1&&r.races.has('dwarf'),'of the holding\'s people (a dwarf hold\'s builders are dwarves)');
  ok(r.per===3&&r.carry,'a big site: two builders and one carrying planks in')}
 {const r=run(16,'human',8);ok(r.per===1&&!r.carry,'a small one: its one builder')}
 {const r=run(32,'orc',8);ok(r.per===2&&r.carry&&r.races.has('orc'),'a middling one: a builder and a carrier')}
 {const was=t.MAP_FIGS.on;t.MAP_FIGS.on=false;let n=0;const ws=window.workerSprite;window.workerSprite=(...a)=>{n++;return ws(...a)};
  try{t.drawSite(t.mkc(32,32,()=>{}),40,100,32,.5,false,7,'human')}finally{window.workerSprite=ws;t.MAP_FIGS.on=was}ok(n===1,'off the battle\'s figures: the small builder as before')}
 ok(t.LOADS.builder&&t.LOAD_ART.planks,'the carrier\'s planks: a load of their own');
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
