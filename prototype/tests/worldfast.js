'use strict';
// The same world, reckoned with less work (world/worldobject.js WORLD_FAST; a code review's measure, 2026-11-11): the bands' feuds look
// only through the bands filed near (brains.js BandBrain near), and the land is looked at once before the beasts' moments
// (territory.js landHeldFor), an outpost's part of its key from the outposts alone (outposts.js posts). Each must give what the old
// reckoning gave. A seeded world run for days with them on, and at every step of it the old rule asked beside the new: each feud's
// pick against the old look through every band, the land's key against the old look at every site, and after each beast's moment
// the land still what it was when the pass began (so nothing was missed by not looking again).
Kit.suite(({ok,info})=>{
 const t=T,F=t.WORLD_FAST,keep={...F},lod0=t.WORLD_LOD.on,rnd=Math.random;
 try{
  F.feud=F.land=true;window.Math.random=t.seeded(7);Kit.begin('soldier',1);Kit.world();const G=t.G,W=t.W,B=t.BRAINS.band,X=t.BAND_FEUD;t.GUIDE.on=false;t.WORLD_LOD.on=true;G.speed=8;G.paused=false;
  // (the old look: through every band, as brains.js had it)
  const old=b=>{const gob=b.kind==='goblins',mine=b.power()*(b.nerve||1)*X.dare;let r=null,bd=X.see;
   for(const o of t.bandits){if(o===b||o.gone||t.inFight(o)||(o.kind==='goblins')===gob)continue;const dd=Math.hypot(o.x-b.x,o.y-b.y);if(dd<bd&&(dd<X.meet||o.power()<=mine)){bd=dd;r=o}}return r?{r,bd}:null};
  let scans=0,found=0,bad=0,first='',stale=0,thinks=0,moved=0,keys=0,badKey=0;
  const r0=B.rival,M=t.BEAST_MIND,th=M.think,sys=t.Systems.list.find(x=>x.name==='monsters'),um=sys.frame;let sig=0,key=0,passes=0;
  // (the new first, as the game does; then the old: were a stale mark left by the new, the old would clear it and the next count shows it)
  B.rival=function(b){const a=r0.call(this,b);for(const o of t.bandits)if(o.fight&&!o.gone&&o!==b&&!t.fightOf(o))stale++;const z=old(b);scans++;if(z)found++;if((a&&a.r)!==(z&&z.r)||(a&&a.bd)!==(z&&z.bd)){bad++;first=first||'day '+G.day+' band at '+Math.round(b.x)+','+Math.round(b.y)}return a};
  M.think=function(m,d,h){const r=th.call(this,m,d,h);thinks++;if(t.landSigOf()!==sig||t.Outposts.landKey()!==key)moved++;return r};
  sys.frame=function(d){passes++;t.landFresh();sig=t.landSigOf();key=t.Outposts.landKey();return um(d)};// (the beasts' pass, as the systems run it)
  try{for(let i=0;i<2400;i++){G.encCool=1e9;if(G.mode!=='world'){t.hidePanel();G.mode='world';G.modal=false}t.updateWorld(1/60);
    if(i%20===0){keys++;const a=t.Outposts.landKey();F.land=false;const z=t.Outposts.landKey();F.land=true;if(a!==z)badKey++}}}
  finally{delete B.rival;M.think=th;sys.frame=um}
  const gob=t.bandits.filter(b=>b.kind==='goblins').length,posts=(W.sites||[]).filter(s=>s.type===OUTPOST_TYPE).length;
  info(t.bandits.length+' bands ('+gob+' goblins), '+W.monsters.length+' beasts, '+posts+' outposts, to day '+G.day+': '+scans+' feud looks ('+found+' found a rival), '+thinks+' beasts\' moments, '+keys+' keys');
  ok(gob>0&&gob<t.bandits.length&&scans>2000&&found>50&&thinks>5000&&passes>2000&&posts>0,'the run has what the changes touch: goblins and other bands, feuds between them, beasts, outposts');
  ok(bad===0,'every feud look picks the rival the old look through every band picks, as far off'+(first?' (first: '+first+')':''));
  ok(stale===0,'and leaves no band marked for a fight that is gone, as the old look left none');
  ok(moved===0,'the land held through the beasts\' moments: after each of them it is what it was when the pass began');
  ok(badKey===0,'an outpost\'s part of the land\'s key from the outposts alone: the same number as from every site');
  // (the cells follow the bands: each look takes in every band within sight, in the bands' order; a band that moved is filed again;
  // off, every band looked at)
  {t.BandBrain.pass++;const S=X.see,all=t.bandits.every(b=>{const L=B.near(b),ix=L.map(o=>t.bandits.indexOf(o));return t.bandits.every(o=>Math.hypot(o.x-b.x,o.y-b.y)>=S||L.includes(o))&&ix.every((v,i)=>!i||v>ix[i-1])});
   ok(all,'a look takes in every band within '+S+' px, in the bands\' own order');
   const b=t.bandits[0],o=t.bandits[t.bandits.length-1],x=o.x,y=o.y;o.x=b.x+900;o.y=b.y+900;B.moved(o);const off=!B.near(b).includes(o);o.x=b.x+5;o.y=b.y;B.moved(o);const on=B.near(b).includes(o);o.x=x;o.y=y;B.moved(o);
   ok(off&&on,'a band that moved is filed where it stands');
   F.feud=false;ok(B.near(b)===t.bandits,'off: through every band, as before');F.feud=true}
  // (the land held through a pass; a holding added or lost seen at once all the same; off, looked at afresh at every asking)
  {const z=t.TOWNS.find(x=>x.owner),o=z.owner,other=t.FIDS.find(f=>f!==o);let v0=0,in1=0;t.landFresh();t.landHeldFor(()=>{v0=t.landVer;z.owner=other;t.landFresh();in1=t.landVer;z.owner=o});
   ok(in1===v0,'held: not looked at again within the pass');
   F.land=false;let v1=0,v2=0;t.landHeldFor(()=>{v1=t.landVer;z.owner=other;t.landFresh();v2=t.landVer;z.owner=o;t.landFresh()});ok(v2>v1,'off: looked at afresh at every asking, as before');F.land=true}
 }finally{Object.assign(F,keep);t.WORLD_LOD.on=lod0;window.Math.random=rnd}
});
