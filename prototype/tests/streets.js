'use strict';
// A holding's streets (world/lots.js LOT_STREET; the owner, 2026-11-06: "the buildings actually connected to the road, if there's a
// lot of space the smaller ones"): its houses drawn to the road, the gaps along its streets filled with small things a tile each
// (nooks: stalls, carts, woodpiles...), each by the road; and a lane trodden from each door standing back from the road to it, round
// every lot and field, painted as worn ground (gfx/worldart.js).
Kit.suite(({ok,info})=>{
 const t=T,X=t.LOT_STREET;
 Kit.begin('soldier',2);Kit.world();
 const H=t.TOWNS.filter(z=>z.lots&&!z.gone),houses=H.flatMap(z=>z.lots.filter(l=>l.k==='house'));
 // ---- houses by the road
 const by=houses.filter(l=>t.lotRoadBy(l.x,l.y,l.n)<=1).length;
 ok(houses.length>50&&by/houses.length>=.5,'houses drawn to the road: '+by+' of '+houses.length+' within a tile of it');
 // ---- the gaps along the streets: small things a tile each, by the road
 const nooks=H.flatMap(z=>z.lots.filter(l=>l.k==='nook').map(l=>({z,l})));
 ok(nooks.length&&nooks.every(({l})=>l.n===1&&t.lotRoadBy(l.x,l.y,1)===0),nooks.length+' small things along the streets, each a tile, each beside the road ('+[...new Set(nooks.map(o=>o.l.type))].join(', ')+')');
 ok(H.filter(z=>z.kind==='town'||z.kind==='city').every(z=>z.lots.some(l=>l.k==='nook')),'every town and city has some');
 ok(nooks.every(({z})=>z.layout.housing()>=0)&&H.every(z=>z.lots.filter(l=>l.k==='nook').length<=(X.nook[z.kind]|0)),'no more than its kind’s share, and they house no one');
 // ---- lanes: from doors standing back, round the lots, to the road as drawn
 const P={tramples:[]};t.artGenPlan(P,()=>{});const near=(x,y)=>t.artRoadNear(P,x,y);
 const L=H.flatMap(z=>t.lotLanes(z,near).map(p=>({z,p})));
 const onRoad=L.every(({p})=>near(...p[p.length-1])[2]<1),clear=L.every(({p})=>p.slice(1,-1).every(([x,y])=>!t.OCC[Math.floor(y/t.TILE)*t.MW+Math.floor(x/t.TILE)]));
 ok(L.length>20&&onRoad&&clear,L.length+' lanes from doors standing back from the road, each ending on it, none across a lot or field');
 ok(L.every(({p})=>p.length-2<=X.lane.max+1),'each at most '+X.lane.max+' tiles');
 info(JSON.stringify({houses:houses.length,by,nooks:nooks.length,lanes:L.length}));
});
