'use strict';
// A way's goal and its outcome told plainly (battle/route.js routePath, world/march.js MarchGround#path; a code review, 2026-11-03):
// a goal off the grid is taken at the nearest point on it, and said so (clamped), the way never ending off the grid; none to be had
// (ok false), the search's budget run out first (cut) and a way found are told apart, and the march's own ways keep all of it.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T;try{
 const C=30,R=30,cs=8,g=t.routeGrid(C,R,cs),W=C*cs,H=R*cs,inside=p=>p.every(([x,y])=>x>=0&&y>=0&&x<W&&y<H);
 const a=t.routePath(g,20,20,W+90,H/2,{});ok(a.ok&&a.clamped&&inside(a)&&Math.abs(a[a.length-1][0]-W)<1,'a goal off the grid, the way clear: to the nearest point on it ('+a[a.length-1].map(Math.round).join(', ')+'), clamped, never off it');
 const b=t.routePath(g,20,20,100,100,{});ok(b.ok&&!b.clamped&&!b.cut,'a goal on it: no clamp');
 // (a box walled in: none to be had; a long way round a wall, a budget too small for it: cut, part of the way)
 for(let y=10;y<=14;y++)for(let x=10;x<=14;x++)if(y===10||y===14||x===10||x===14)g.cost[y*C+x]=0;g.v++;
 const c=t.routePath(g,20,20,12.5*cs,12.5*cs,{cache:false});ok(!c.ok&&!c.cut,'walled off: none to be had (ok false, not cut)');
 const g2=t.routeGrid(C,R,cs);for(let y=0;y<R-2;y++)g2.cost[y*C+15]=0;g2.v++;const d=t.routePath(g2,20,20,25*cs,20,{budget:20,cache:false});
 ok(!d.ok&&d.cut,'round a long wall on a budget too small: the budget run out (cut), not none to be had');
 // (the march's own: MarchGround#path, in world px, its outcome kept)
 const M=Object.create(t.MarchGround.prototype);Object.assign(M,{grid:g2,x:1000,y:2000,body:()=>0});const e=M.path({x:1020,y:2020},{x:1000+25*cs,y:2020});
 ok(e.length&&e.ok===true&&e.cut===false&&e.clamped===false&&e[0].x>=1000,'the march\'s ways keep it all (ok, cut, clamped), in world px');
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
}catch(e){o.push('EXC '+e.message+' '+e.stack)}const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
