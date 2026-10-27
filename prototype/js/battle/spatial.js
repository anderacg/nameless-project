'use strict';
/* ---------- the battle's spatial grid: who stands near whom without a scan of every soldier ---------- */
/* A uniform grid of buckets over the field holding, per team, the B.units indices of the living. It is open only for a
   stretch of the frame in which it knows every move: the soldiers' turns (updateNonHeroActors: only the one taking his turn
   moves, so he is held loose while he acts and filed again after), the jostle (each pushed pair filed again as it moves),
   the arrows' flight (nobody moves). SG is null outside those, and every query falls back to its full scan of B.units.
   (moraleTick files its own live soldiers in one for the morale views: morale.js VIEW_GRID.)
   Exactness: a query gathers a superset (every bucket its box touches, the box a pixel past the reach; the loose soldier;
   any soldier added after the build), sorts it by B.units index, then puts each through the original test with the original
   arithmetic: the same soldiers in the same order as the full scan, so the same pick, the same ties and the same float sums.
   Cell sizes are powers of two, so a cell's edges are exact in floating point (nearest's stopping bound relies on it) */
// (sparse: a grid with more than this many cells a filed man is searched man by man: nearest)
const SPATIAL={cell:32,jostle:16,sparse:4};
let SG=null;
// (ascending, in place: a few dozen indices are sorted fastest by insertion)
const sortIx=a=>{if(a.length>48)return a.sort((x,y)=>x-y);for(let i=1;i<a.length;i++){const v=a[i];let j=i-1;while(j>=0&&a[j]>v){a[j+1]=a[j];j--}a[j+1]=v}return a};
class SpatialGrid{
  // only: which of units to file (default: the living); every index filed or not is still offered while it is loose or late
  constructor(units,cs,only){this.cs=cs;this.inv=1/cs;this.C=this.R=0;this.reset(units,only)}
  // (filed afresh; the buckets of the same field kept, and those filled since the last filing (used: each marked with the filing it
  // is in, stamp) emptied: a world battle's field has thousands, nearly all empty)
  reset(units,only){
    const C=Math.max(1,Math.ceil(BW*this.inv)),R=Math.max(1,Math.ceil(BH*this.inv));
    if(C!==this.C||R!==this.R){this.C=C;this.R=R;this.by={};this.teams=[];this.used=[]}else{for(const b of this.used)b.length=0;this.used.length=0}this.stamp=(this.stamp||0)+1;
    this.U=units;this.n=units.length;this.at=new Int32Array(this.n).fill(-1);this.loose=-1;this.reach=11;this.memo=new Map();// (memo: actors.js targetMembersOf)
    for(let i=0;i<this.n;i++){const u=units[i];if(only?only(u):u.hp>0)this.put(i);const r=u.s&&u.s.reach||11;if(r>this.reach)this.reach=r}
    return this}
  // (a cell column or row; off the field, the edge one; NaN, the first: its tests all fail, as in the full scan)
  cx(x){const c=Math.floor(x*this.inv);return c>=0?(c<this.C?c:this.C-1):0}
  cy(y){const c=Math.floor(y*this.inv);return c>=0?(c<this.R?c:this.R-1):0}
  cells(t){let c=this.by[t];if(!c){c=this.by[t]=Array.from({length:this.C*this.R},()=>[]);this.teams.push(t)}return c}
  put(i){const u=this.U[i],k=this.cy(u.y)*this.C+this.cx(u.x),b=this.cells(u.team)[k];this.at[i]=k;if(b.stamp!==this.stamp){b.stamp=this.stamp;this.used.push(b)}b.push(i)}
  take(i){const k=this.at[i];if(k<0)return;const b=this.by[this.U[i].team][k],j=b.indexOf(i);b[j]=b[b.length-1];b.pop();this.at[i]=-1}
  // (moved: into the bucket it stands in now)
  refile(i){if(i>=this.n||this.at[i]<0)return;const u=this.U[i],k=this.cy(u.y)*this.C+this.cx(u.x);if(k!==this.at[i]){this.take(i);this.put(i)}}
  // (taking his turn: out of the buckets, offered to every query, then filed where he ends up if still alive)
  hold(i){if(i>=this.n)return;this.take(i);this.loose=i}
  release(i){if(i>=this.n)return;this.loose=-1;if(this.U[i].hp>0)this.put(i)}
  // indices in the box (team: that team only; foes: every team but it; null: all), with the loose and the late, ascending
  box(x0,y0,x1,y1,team,foes,out=[]){
    const c0=this.cx(x0),c1=this.cx(x1),r0=this.cy(y0),r1=this.cy(y1),C=this.C;
    for(const t of this.teams){if(team!=null&&(foes?!battleEnemy(team,t):!battleFriend(team,t)))continue;const cl=this.by[t];
      for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const b=cl[r*C+c];for(let k=0;k<b.length;k++)out.push(b[k])}}
    if(this.loose>=0)out.push(this.loose);for(let i=this.n;i<this.U.length;i++)out.push(i);
    return sortIx(out)}
  // the units within r of (x,y) by box (a superset: the caller's own test decides), in B.units order
  near(x,y,r,team,foes){const ix=this.box(x-r,y-r,x+r,y+r,team,foes),U=this.U,o=new Array(ix.length);for(let k=0;k<ix.length;k++)o[k]=U[ix[k]];return o}
  /* actors.js nearest: the least d²·(rout?9:1) among the living of other teams, the first in B.units order on a tie (its strict <
     from 1e9). Rings of cells outward from his: one in ring m stands more than (m-1) cells' width off on x or y (edge cells only
     widen that; with power-of-two cells the bound holds in floats too), so once the best is under ((k-1)·cs)² no ring from k on
     can beat or tie it */
  nearest(u){
    const U=this.U,ux=u.x,uy=u.y,team=u.team,c0=this.cx(ux),r0=this.cy(uy),C=this.C,cs=this.cs;let best=null,bd=1e9,bi=-1;
    const look=b=>{for(let q=0;q<b.length;q++){const i=b[q],e=U[i];if(e.hp<=0||!battleEnemy(team,e)||!ArmyTactics.local(u,e))continue;const d=((e.x-ux)**2+(e.y-uy)**2)*(e.rout?9:1);if(d<bd||d===bd&&i<bi){bd=d;best=e;bi=i}}};
    const extra=[];if(this.loose>=0)extra.push(this.loose);for(let i=this.n;i<U.length;i++)extra.push(i);look(extra);
    // (a sparse grid, sparse cells to every man: a world battle's wide field: each filed man looked at once, as the rings would)
    if(this.n*SPATIAL.sparse<C*this.R){const all=[];for(let i=0;i<this.n;i++)if(this.at[i]>=0)all.push(i);look(all);return best}
    const K=Math.max(c0,C-1-c0,r0,this.R-1-r0);
    for(let k=0;k<=K;k++){
      if(best&&k>1&&bd<((k-1)*cs)**2)break;
      const ra=Math.max(0,r0-k),rb=Math.min(this.R-1,r0+k),ca=Math.max(0,c0-k),cb=Math.min(C-1,c0+k);
      for(const t of this.teams){if(!battleEnemy(team,t))continue;const cl=this.by[t];
        for(let r=ra;r<=rb;r++){const o=r*C;if(r===r0-k||r===r0+k)for(let c=ca;c<=cb;c++)look(cl[o+c]);else{if(c0-k>=0)look(cl[o+c0-k]);if(c0+k<C)look(cl[o+c0+k])}}}
    }
    return best}
}
// open the grid over B.units for a stretch of the frame (only: which to file); close it after (also on a throw). A closed one is
// kept per cell size (SPATIAL_SPARE) and filed afresh by the next opening (one opened inside another gets its own)
const SPATIAL_SPARE={};
function spatialOpen(cs,only){cs=cs||SPATIAL.cell;const g=!SG&&SPATIAL_SPARE[cs];if(g)delete SPATIAL_SPARE[cs];SG=g?g.reset(B.units,only):new SpatialGrid(B.units,cs,only);return SG}
function spatialClose(){if(SG)SPATIAL_SPARE[SG.cs]=SG;SG=null}
// (is the grid open, and over this battle's units)
const spatialOn=()=>!!SG&&!!B&&SG.U===B.units;
