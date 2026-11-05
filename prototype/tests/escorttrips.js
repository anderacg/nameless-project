'use strict';
// Road escorts go some way (the owner, 2026-11-05: an escort met by a village, "within 2 grid far the destination is already
// there"): the refugees' holding, the lost child's home and the false toll-man's reeve each ESCORT.trip.min tiles at least from
// where you meet them (and at most max), reachable, not hostile; refugees with no such holding ask no escort. Met at many points
// along the roads by the holdings.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,T0=t.ESCORT.trip,TL=t.TILE;Kit.begin('soldier',1);Kit.world();
 const pts=[];for(const h of t.TOWNS)for(const [dx,dy] of [[3,2],[-4,3],[6,-2]]){const x=(h.tx+dx+.5)*TL,y=(h.ty+dy+.5)*TL;if(t.passable(t.terrAt(x,y)))pts.push({x,y,h})}
 const dist=(a,name)=>{const b=t.townBy(name);return Math.hypot(b.x-a.x,b.y-a.y)/TL};
 const bad=[],ds=[];let none=0;
 for(const p of pts){const e={x:p.x,y:p.y,seed:3};const s=t.roadEscort(e,'refugees');if(!s){none++;continue}const d=dist(p,s.to.town);ds.push(d);
  if(d<T0.min||d>T0.max||t.hostileTo(t.townBy(s.to.town).owner)||!t.Router.reach(p,t.townBy(s.to.town)))bad.push('refugees '+Math.round(d)+' to '+s.to.town)}
 ok(!bad.length&&ds.length>pts.length*.8,'refugees met at '+pts.length+' points by the holdings: each escort goes '+T0.min+'-'+T0.max+' tiles (nearest '+Math.round(Math.min(...ds))+', median '+Math.round(ds.sort((a,b)=>a-b)[ds.length>>1])+'), '+none+' ask none'+(bad.length?': '+bad.slice(0,4).join('; '):''));
 // (the lost child: her home some way off)
 {const cb=[],cd=[];for(const p of pts.slice(0,40)){P.x=p.x;P.y=p.y;const e={x:p.x,y:p.y,seed:5};t.ROAD_ENC.child.setup(e);const d=dist(p,e.to);cd.push(d);if(d<T0.min)cb.push(e.to+' '+Math.round(d))}
  ok(cb.length<=cd.length*.1,'the lost child’s home '+T0.min+' tiles off at least, near every holding but where none is that far ('+cb.length+' of '+cd.length+(cb.length?': '+cb.slice(0,3).join(', '):'')+')')}
 // (the false toll-man to a reeve of the realm they claimed, some way off)
 {const tb=[];let n=0;for(const p of pts.slice(0,40)){const h=p.h;if(!h.owner||!t.FACS[h.owner])continue;n++;const s=t.tollReport({x:p.x,y:p.y,fac:h.owner,home:h.name});const d=dist(p,s.to.town);if(d<T0.min&&t.TOWNS.some(o=>o.owner===h.owner&&Math.hypot(o.x-p.x,o.y-p.y)/TL>=T0.min&&Math.hypot(o.x-p.x,o.y-p.y)/TL<=T0.max))tb.push(s.to.town+' '+Math.round(d))}
  ok(n>5&&!tb.length,'the false toll-man to a reeve of their realm '+T0.min+' tiles off at least where it has one ('+n+' met)'+(tb.length?': '+tb.slice(0,3).join(', '):''))}
});
