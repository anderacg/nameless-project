'use strict';
// A crossing shut is shut to your own steps too (world/world.js heroStep, router.js crossingOpen; a code review, 2026-11-03: "direct
// player movement accepts a closed bridge tile that the router rejects"): a bridge closed (Router.close), walking for the far bank you
// never set foot on it, the router's way and your own straight step alike (its straight line, router.js clearLine, now keeps off a
// crossing shut as its tile searches do); open again, you cross it as before.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.WM;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});
 const xi=W.crossings.findIndex(c=>c.kind==='bridge'&&c.tiles?.length);ok(xi>=0,'(a bridge to close)');if(xi<0)return;
 const c=W.crossings[xi],[ax,ay]=t.wayCentre(c.i),[bx,by]=t.wayCentre(c.j),on=()=>c.tiles.includes(Math.floor(P.y/t.TILE)*t.MW+Math.floor(P.x/t.TILE));
 const go=()=>{Kit.goTo(ax,ay);P.tx=bx;P.ty=by;let n=0,steps=0;for(;steps<1500&&P.tx!=null;steps++){t.marchStep(1/30);if(on())n++}return{n,steps,far:Math.hypot(P.x-bx,P.y-by)}};
 // (and the straight step itself, when the router has none: heroStep's own walk, toward the far bank)
 const straight=()=>{Kit.goTo(ax,ay);const R=t.Router,tv=R.travel;let n=0;R.travel=()=>false;try{for(let i=0;i<400;i++){t.heroStep(bx-P.x,by-P.y,Math.hypot(bx-P.x,by-P.y),1.5);if(on())n++}}finally{R.travel=tv}return n};
 t.Router.close(xi,true); const shut=go(),shut2=straight();
 ok(shut.n===0&&shut2===0,'the bridge closed: walking for the far bank you never set foot on it, by the router\'s way ('+shut.steps+' steps) and your own straight step alike');
 t.Router.close(xi,false);const open=go();
 ok(open.n>0&&open.far<20,'opened again, you cross it as before ('+open.n+' steps on it)');
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
