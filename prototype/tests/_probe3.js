'use strict';
Kit.suite(({ok,info})=>{const t=T,SP=t.StartPlace,X=t.HUMBLE_START;t.begin('nobody');
 const row=t.PAST_START.nobody;const ps=SP.places(row,['hamlet'],'free');info('places '+ps.length+' caps '+SP.capitals().map(c=>c.name));
 for(const p of ps.slice(0,30)){const n=SP.fair(p.t);const camp=t.CAMP_SPOTS.map(c=>Math.hypot(c.tx-p.t.tx,c.ty-p.t.ty)).sort((a,b)=>a-b)[0];info(p.t.name+' far '+p.far.toFixed(2)+' own '+p.own.toFixed(2)+' fair '+(n&&n.name)+' camp '+camp.toFixed(0))}});
