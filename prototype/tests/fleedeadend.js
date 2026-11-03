'use strict';
// A fleer in a dead end finds the way out past its first search (world/router.js FleeRoutes, FLEE_ROUTE wait, grow; a code review,
// 2026-11-03: a search that found no way was kept for ever, the fleer standing in the dead end): a corridor running east to a
// dead end, its ways on, a passage north and the corridor's far end, far to the west, past the threat; the fleer runs to the end, finds nothing within its
// radius, waits a while (not a search every moment), then looks twice as far, and again, and gets out past the threat. Its own map: no world.
Kit.suite(({ok})=>{
 const t=T,saved={w:t.MW,h:t.MH,tiles:t.tiles,climate:t.climate};window.requestAnimationFrame=()=>0;
 const w=70,h=40,kind=new Uint8Array(w*h).fill(t.T_WATER);for(let x=5;x<=60;x++)kind[30*w+x]=t.T_OPEN;for(let y=2;y<=30;y++)kind[y*w+20]=t.T_OPEN;
 window.__deadEnd={w,h,kind};window.eval('MW=__deadEnd.w;MH=__deadEnd.h;tiles=__deadEnd.kind;climate=new Uint8Array(MW*MH);SHUT=null;WAYV++');t.FleeRoutes.paths=new WeakMap();
 const pt=(x,y)=>({x:(x+.5)*t.TILE,y:(y+.5)*t.TILE}),threat=pt(45,30),f=pt(56,30),plan=t.FleeRoutes.plan.bind(t.FleeRoutes);let plans=0;
 try{t.FleeRoutes.plan=(...a)=>{plans++;return plan(...a)};
  let atEnd=-1,searchesStuck=0;for(let i=0;i<120;i++){t.Router.flee(f,threat,1);if(atEnd<0&&f.x>=59.5*t.TILE)atEnd=i}
  const end=Math.hypot(f.x-threat.x,f.y-threat.y);{const p0=plans;for(let i=0;i<10;i++)t.Router.flee(f,threat,1);searchesStuck=plans-p0}
  ok(atEnd>=0&&end>=14*t.TILE,'it runs to the dead end ('+Math.round(end/t.TILE)+' tiles from the threat)');
  ok(searchesStuck<=1,'nothing within its radius: it waits, no search every moment ('+searchesStuck+' in 10 moments)');
  for(let i=0;i<2000;i++)t.Router.flee(f,threat,1);const out=Math.hypot(f.x-threat.x,f.y-threat.y);
  ok(out>end+5*t.TILE,'then it looks farther, finds a way out past the threat and takes it ('+Math.round(out/t.TILE)+' tiles from the threat, at '+Math.floor(f.x/t.TILE)+', '+Math.floor(f.y/t.TILE)+'; '+plans+' searches)');
 }finally{t.FleeRoutes.plan=plan;window.__restore=saved;window.eval('MW=__restore.w;MH=__restore.h;tiles=__restore.tiles;climate=__restore.climate;WAYV++');t.FleeRoutes.paths=new WeakMap()}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
