'use strict';
// The path cache keeps paths with and without a body's room apart (battle/route.js routePath's key; a code review, 2026-11-03:
// "different routes with zero versus nonzero body clearance can share a cache key and receive the wrong path"): on a grid with a
// wall, a way from the corner with room kept is cached first; a way from the same corner to a cell whose old key it shared, no room
// kept, gets its own way to its own goal, not the cached one; and the cached one is still used for its own query.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T;try{
 const C=40,R=40,cs=8,N=C*R,g=t.routeGrid(C,R,cs),cell=i=>[(i%C+.5)*cs,(Math.floor(i/C)+.5)*cs],at=(p,i)=>{const [x,y]=cell(i),q=p[p.length-1];return !!q&&Math.hypot(q[0]-x,q[1]-y)<cs};
 // (a wall down column 2, a gap at its foot: every way from the corner round it, so each one is searched and cached)
 for(let y=0;y<R-2;y++)g.cost[y*C+2]=0;g.v++;
 // (the old key: no room, s*N+t; room q quarter px, (s*N+t)*128+q: the way 0 → 5 kept 1 px (q 4) took key 644, the old key of 0 → 644)
 const s=0,t1=5,need=1,t0=(s*N+t1)*128+Math.round(need*4)-s*N;ok(t0>0&&t0<N&&g.cost[t0]>0,'(a pair whose keys met: 0 → '+t1+' with room 1 px, and 0 → '+t0+' with none)');
 const [ax,ay]=cell(s),[bx,by]=cell(t1),[cx,cy]=cell(t0);
 const a=t.routePath(g,ax,ay,bx,by,{need});ok(a.ok&&at(a,t1)&&a.n>0,'the way with room kept: searched, to its own goal, cached');
 const b=t.routePath(g,ax,ay,cx,cy,{});ok(b.ok&&at(b,t0)&&b.n>0,'the way with none, whose old key the first had taken: searched afresh, to its own goal (not the cached way to '+t1+')');
 const a2=t.routePath(g,ax,ay,bx,by,{need});ok(a2.ok&&at(a2,t1)&&a2.n===0,'and the first, asked again: from the cache, to its own goal');
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
}catch(e){o.push('EXC '+e.message+' '+e.stack)}const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
