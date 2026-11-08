'use strict';
// Discovery (world/discovery.js; the owner, 2026-11-08: "you may not know the name right the way but once you near it then you'll
// have a text animation like You discovered xxxxxx"): off (the harness's) every name known; on, what a game begins near is known
// quietly, a holding or a named site farther off only by its kind (on the map, its tip, the full map, its lands) until your band
// comes near it: then its name, its title over the map, a line in the log and Scouting practice; saved and loaded.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,D=t.Discovery,DC=t.DISCOVER;
 Kit.begin('soldier',1);Kit.world();
 // ---- off (the harness's): every name known, nothing kept
 {const far=t.TOWNS[t.TOWNS.length-1];ok(!DC.on&&D.named(far)&&D.nameOf(far)===far.name&&!('found' in t.Saves.save()),'off: every place known by its name, nothing saved')}
 DC.on=true;D.reset();
 try{
  // ---- the start: what is near you known, quietly
  {const n0=G.msgs.length;D.check();const near=D.places().filter(o=>Math.hypot(o.x-P.x,o.y-P.y)<=DC.start*t.TILE);
   ok(near.length>0&&near.every(o=>D.named(o))&&G.msgs.length===n0&&!document.querySelector('#discover.on'),'a game begins knowing the places near you ('+near.map(o=>o.name).join(', ')+'), no title, no line')}
  // ---- a place farther off: its kind only
  const far=t.TOWNS.filter(h=>!D.named(h)).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
  ok(far&&D.nameOf(far)===t.cap1(far.label)&&!new RegExp(far.name).test(far.tip())&&t.landName(far.x,far.y)==='Unknown lands','a holding you have not come near: by its kind ('+D.nameOf(far)+'), unnamed in its tip and its lands');
  {const s=t.W.sites.find(x=>x instanceof t.Ruins&&!D.named(x));ok(!s||D.nameOf(s)===s.T.n&&!new RegExp(s.name).test(s.tip()),'a site too: by its kind ('+(s&&D.nameOf(s))+')')}
  {const bc=t.W.sites.find(x=>x instanceof t.BanditCamp);ok(!bc||!D.places().includes(bc),'a bandit camp is not a place to discover (it has no name)')}
  // ---- coming near it: its name, its title, a line, Scouting practice
  {const a=Math.atan2(P.y-far.y,P.x-far.x),sk=P.sk.scout.lv*1e3+P.sk.scout.xp;P.x=far.x+Math.cos(a)*(DC.r+1)*t.TILE;P.y=far.y+Math.sin(a)*(DC.r+1)*t.TILE;G.mode='world';D.check();
   ok(!D.named(far),'not yet, '+(DC.r+1)+' tiles off');
   P.x=far.x+Math.cos(a)*(DC.r-1)*t.TILE;P.y=far.y+Math.sin(a)*(DC.r-1)*t.TILE;D.check();const el=document.getElementById('discover');
   ok(D.named(far)&&D.nameOf(far)===far.name&&t.landName(far.x,far.y)===far.name+' lands','within '+DC.r+' tiles: '+far.name+' known by its name, and its lands');
   ok(el&&el.classList.contains('on')&&/You discovered/i.test(el.textContent)&&el.textContent.includes(far.name),'its title over the map: '+(el&&el.textContent));
   ok(G.msgs.some(m=>(m.m||'').startsWith('You discovered '+far.name))&&P.sk.scout.lv*1e3+P.sk.scout.xp>sk,'a line in the log, and Scouting practice');
   const n=D.found.size;D.check();ok(D.found.size===n,'once only')}
  // ---- the full map names it now, and not one you have not seen
  {const html=t.fullMapMarks(20),u=t.TOWNS.find(h=>!D.named(h)&&html.includes('fm-unk')),seenFar=html.includes(far.name+'<');
   ok(seenFar||!html.includes(t.cap1(far.label)),'the full map names it'+(u?'; one you have not come near by its kind, grey':''))}
  // ---- saved and loaded
  {const keys=[...D.found];t.saveGame(true);D.reset();ok(!D.named(far),'(forgotten)');t.loadGame();ok(D.named(far)&&D.found.size===keys.length,'saved and loaded: '+keys.length+' places known')}
 }finally{DC.on=false;D.reset()}
});
