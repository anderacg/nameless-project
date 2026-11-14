'use strict';
/* ---------- camp art: a camp's tents and pieces as the engine's models (the owner, 2026-11-14: "make more tent variety", "make each
   object such as barrel etc more detailed", "if they are a cluster then just stack them", "it should be top down view") ----------
   Each a 16 px model of engine/build-camp.js, drawn in the map's own view (model.js: roofs seen from above, fronts below, lit from
   the upper left, outlined and snowed as every building): CampArt.tent(style, look, seed, clim), a tent of a style (ridge, bell,
   tepee, yurt, pavilion, leanto, pup, marquee, porch, hut; each varied by its seed) in its look's cloth and trim (any colour: the engine's nearest, PX.campLv); CampArt.prop(type,
   n, seed, clim, look), a piece (barrels, crates, sacks, logs: n of them heaped; wagon, cart, stall, shrine, rack, mound); CampArt.army
   (i, seed, clim, col), an army's tent i. Each a canvas as a site's (structures.js siteCanvas: ax, ay its feet, sh its shadow) ---------- */
const CAMP_ART={canvas:['#d8ccb0','#cbbd9c','#e0d6c0'],army:['ridge','bell','pup','porch','ridge','marquee','bell'],
  // (a piece's type here, the engine's there: the logs stacked are its camp_logs)
  props:{woodpile:'logs'}};
const CampArt={
  model(type,seed,clim,lv){const k='campm:'+type+':'+seed+':'+clim+':'+lv;if(spr[k])return spr[k];
    const m=PX.buildingModel({type:'camp_'+type,seed,env:clim,snow:clim==='frost'?1:0,lv});return spr[k]=siteCanvas(m,m.cell/2,m.cell)},
  tent(style,L,seed,clim){return CampArt.model(style,seed%12,clim,PX.campLv(L.cloth,L.trim,0))},// (each tent its own of 12 by its seed: engine/build-camp.js varies them)
  prop(type,n,seed,clim,L){return CampArt.model(CAMP_ART.props[type]||type,seed%5,clim,PX.campLv(L&&L.cloth,L&&L.trim,Math.min(7,n||1)))},
  // (an army's tents: plain canvas of a few styles, its first, its commander's, a pavilion in its side's colour)
  army(i,seed,clim,col){const A=CAMP_ART;return CampArt.tent(i===0?'pavilion':A.army[(seed+i)%A.army.length],{cloth:A.canvas[(seed*3+i)%A.canvas.length],trim:col||'#8a6a4a'},seed,clim)}
};
const CAMP_TENTS=Object.fromEntries(['ridge','bell','tepee','yurt','pavilion','leanto','pup','marquee','porch','hut'].map(k=>[k,'camp_'+k]));
