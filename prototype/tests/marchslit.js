'use strict';
// A slit between buildings is no way (world/march.js MarchGround shutSlits, MARCH_MOVE.slit; the owner, 2026-11-04: "unit seems
// to stuck if building is built like this"): Ashford's guards walked into the gap between two houses by its smithy, narrower than a
// man, and stood there, no way out of it. Now every such gap at a footing is shut on the march's grid; the lane between the castle
// and the houses, a tile wide, stays open.
Kit.suite(({ok})=>{
 const t=T,P=t.P,M=t.MARCH_MOVE;Kit.begin('soldier',1);Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;
 const ash=t.townBy('Ashford')||t.TOWNS[0];Kit.goTo(ash.x+60,ash.y-40);
 const at=n=>{const k=M.slit;M.slit=n;try{return new t.MarchGround(P,[])}finally{M.slit=k}},g0=at(0),g1=at(8),G=g1.grid,cs=G.cs,w=Math.floor(8/cs);
 let shut=0,foot=true;for(let i=0;i<G.cost.length;i++)if(g0.grid.cost[i]&&!G.cost[i]){shut++;if(!g1.foot[i])foot=false}
 ok(shut>0&&foot,'gaps between '+ash.name+'\'s buildings shut ('+shut+' cells), each one a footing now');
 // (none left: no open run of w cells or fewer, shut on both sides, a footing one of them, along a row or a column)
 {let left=0;const run=(ix,len)=>{for(let k=0,s=-1;k<=len;k++){const i=k<len?ix(k):-1,o=i>=0&&G.cost[i]>0;if(o){if(s<0)s=k;continue}if(s>0&&i>=0&&k-s<=w&&(g1.foot[i]||g1.foot[ix(s-1)]))left++;s=-1}};
  for(let r=0;r<G.R;r++)run(c=>r*G.C+c,G.C);for(let c=0;c<G.C;c++)run(r=>r*G.C+c,G.R);ok(!left,'no slit narrower than '+M.slit+' px left at a footing ('+left+')')}
 // (only slits: every cell it shut was open in a run of w cells or fewer)
 {const G0=g0.grid,runOf=(i,dc,dr)=>{let n=1;for(const s of [-1,1]){let c=i%G0.C,r=Math.floor(i/G0.C);for(;;){c+=dc*s;r+=dr*s;if(c<0||r<0||c>=G0.C||r>=G0.R||!G0.cost[r*G0.C+c])break;n++}}return n};
  let wide=0;for(let i=0;i<G.cost.length;i++)if(G0.cost[i]&&!G.cost[i]&&runOf(i,1,0)>w&&runOf(i,0,1)>w)wide++;ok(!wide,'nothing wider shut ('+wide+' cells)')}
 // (a gap a tile wide, as between Ashford's castle and its houses, a way still)
 {let lanes=0,kept=0;for(let r=0;r<G.R;r++)for(let c=0,s=-1;c<=G.C;c++){const i=r*G.C+c,o=c<G.C&&g0.grid.cost[i]>0;if(o){if(s<0)s=c;continue}
   if(s>0&&c<G.C&&c-s>=t.TILE/cs&&c-s<=t.TILE/cs+1&&g0.foot[i]&&g0.foot[r*G.C+s-1]){lanes++;if(G.cost[r*G.C+s]&&G.cost[r*G.C+c-1])kept++}s=-1}
  ok(kept===lanes,'a lane a tile wide between buildings kept ('+kept+' of '+lanes+' rows)')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
