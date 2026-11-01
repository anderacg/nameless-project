'use strict';
/* ---------- filling places (the owner, 2026-11-01: "when unit groups moving in march formation or battle, just make units try to
   fill the position instead of fixed to one specific unit"). A group's men are one another's equals: each new set of its places (a
   move, a turn, a new width, a column forming or breaking, a man fallen) goes to them by the least walking in all, the sum of the
   squares of the px each walks, so a line turned about takes its back rank for its front and nobody walks through the ranks (and
   the sum is the same wherever the places stand: a far move shares them as a near one does). Its characters (your hero, a
   companion, a lord, a chief) and its men at grips keep their own (the march, world/march.js MarchArmy refill; battle,
   battle/formations.js layForm and battlecontrol.js step). Men of one group only: never across groups.
   on: false, every place goes as before (each man by his index; the proof switch for the fingerprints); exact: up to so many men
   the least of all (the Hungarian way, n^3: 30 men ~0.06 ms), more by nearest first (each pair's cost in grain-ths of a px
   squared), then up to swaps passes of swaps; march: on the map, every s at most it looks again while marching, and at once when
   its places have turned turn radians since, taking the new share when it saves gain px of walking in all (world px); a column
   formed or broken, whenever it is less. (Battle: battlecontrol.js FORM_SWAP, its every and gain) ---------- */
const SLOTFILL={on:true,exact:30,grain:64,swaps:3,march:{every:1.5,gain:2,turn:.6}};
// (the buffers: n men at mx, my and k places at px, py written in by the caller, men in a stable order (by id: a battle replays the
// same); out[i] the place man i takes, -1 none. Grown once to the biggest group, then kept: no allocation per call)
const FILL={cap:0,mx:null,my:null,px:null,py:null,out:null,u:null,v:null,mn:null,p:null,way:null,used:null,c:null};
function fillRoom(n){
  if(n<=FILL.cap)return FILL;const c=Math.max(n,2*FILL.cap,32),F=Float64Array,I=Int32Array;FILL.cap=c;
  Object.assign(FILL,{mx:new F(c),my:new F(c),px:new F(c),py:new F(c),out:new I(c),u:new F(c+1),v:new F(c+1),mn:new F(c+1),p:new I(c+1),way:new I(c+1),used:new Uint8Array(c+1),c:null});return FILL}
// (the square of man i's px to place j)
const fillCost=(i,j)=>{const dx=FILL.mx[i]-FILL.px[j],dy=FILL.my[i]-FILL.py[j];return dx*dx+dy*dy};
// n men to k places (fillRoom(max(n, k)) first, then the positions): into FILL.out; its sum of squares
function assignSlots(n,k){
  const o=FILL.out;for(let i=0;i<n;i++)o[i]=-1;if(!n||!k)return 0;
  if(Math.max(n,k)<=SLOTFILL.exact)fillExact(n,k);else fillGreedy(n,k);
  let s=0;for(let i=0;i<n;i++)if(o[i]>=0)s+=fillCost(i,o[i]);return s}
// (the Hungarian way, the shortest augmenting path, rows the fewer of men and places; ties to the lower index)
function fillExact(n,k){
  const flip=n>k,R=flip?k:n,C=flip?n:k,{u,v,mn,p,way,used}=FILL,cost=(r,c)=>flip?fillCost(c-1,r-1):fillCost(r-1,c-1);
  for(let j=0;j<=C;j++){v[j]=0;p[j]=0;way[j]=0}for(let i=0;i<=R;i++)u[i]=0;
  for(let i=1;i<=R;i++){p[0]=i;let j0=0;for(let j=0;j<=C;j++){mn[j]=Infinity;used[j]=0}
    do{used[j0]=1;const i0=p[j0];let d=Infinity,j1=0;
      for(let j=1;j<=C;j++)if(!used[j]){const cur=cost(i0,j)-u[i0]-v[j];if(cur<mn[j]){mn[j]=cur;way[j]=j0}if(mn[j]<d){d=mn[j];j1=j}}
      for(let j=0;j<=C;j++)if(used[j]){u[p[j]]+=d;v[j]-=d}else mn[j]-=d;j0=j1}while(p[j0]!==0);
    do{const j1=way[j0];p[j0]=p[j1];j0=j1}while(j0)}
  for(let j=1;j<=C;j++)if(p[j]){if(flip)FILL.out[j-1]=p[j]-1;else FILL.out[p[j]-1]=j-1}}
// (nearest first: every pair by its cost (in grain-ths of a px squared: one number with its pair, a man's index times k and a
// place's, sorted as numbers: ties to the lower man, then place), the nearest taken while both are free; then up to swaps passes,
// two men trading places when that is less walking in all)
function fillGreedy(n,k){
  const N=n*k,o=FILL.out,G=SLOTFILL.grain;if(!FILL.c||FILL.c.length<N)FILL.c=new Float64Array(N);const c=FILL.c.subarray(0,N),taken=FILL.used;
  for(let i=0,q=0;i<n;i++)for(let j=0;j<k;j++,q++)c[q]=Math.round(fillCost(i,j)*G)*N+q;c.sort();for(let j=0;j<k;j++)taken[j]=0;
  for(let q=0,left=Math.min(n,k);q<N&&left;q++){const a=c[q]%N,i=(a/k)|0,j=a-i*k;if(o[i]<0&&!taken[j]){o[i]=j;taken[j]=1;left--}}
  for(let r=0,more=true;r<SLOTFILL.swaps&&more;r++){more=false;for(let i=0;i<n;i++){if(o[i]<0)continue;for(let h=i+1;h<n;h++){if(o[h]<0)continue;const a=o[i],b=o[h];
    if(fillCost(i,b)+fillCost(h,a)<fillCost(i,a)+fillCost(h,b)-1e-9){o[i]=b;o[h]=a;more=true}}}}}
// (px walked in all by men 0..n-1 to places at[i] (null: each to his own, man i to place i): a share's walk, to weigh a new one
// against the one they have)
function fillWalk(n,at){let s=0;for(let i=0;i<n;i++){const j=at?at[i]:i;if(j>=0)s+=Math.sqrt(fillCost(i,j))}return s}
