'use strict';
/* ---------- order paths: where your groups are going, drawn on the field (render.js drawBattle). Drawing only: it reads the
   groups, their ways (terrain.js groupWay: g.way.p), the route grids and the sight, and writes none of them (its own ways round
   the ground for an attack, a withdrawal and the queued legs are laid with routePath's cache off, kept here, never on a group)
   - A move: from the group's middle along its way round rock, cliffs and deep water to its place; then each queued waypoint's
     leg (g.queue), routed too, fainter, a small ring at each.
   - An attack: to its target's middle, or (fog, woods, a rise: none of it seen) to where it was last seen (terrain.js sightGoal,
     read without filling its cache); routed when a straight line is blocked. A charge with no target: to the foes its men are on.
   - A withdrawal: to its exit (morale.js exitFor), else its place (g.ax, g.ay).
   A dashed line with chevrons pointing the way, over a dark shadow, the same size on the screen at any zoom out (one field pixel
   zoomed in); only what is still to walk (cut at the point of the path nearest the group's middle); a ring where it ends (and,
   for a move of a selected or hovered group, its men's places there, faint). The dashes and chevrons march along (OPATH.march
   px a second, real time; still with reducedMotion). Yours in your colour, those of yours the AI has (A: deploy.js aiHas) in its
   violet, your allies' in their green (battle.js SIDE), muted; the enemy's never. An attack-move (battlecontrol.js AMOVE): its
   line as a move's, ending in red crossed blades (a queued one's waypoint too) instead of a ring.
   Shown (PREFS.opaths, Settings): 'all' every group of yours and your allies'; 'sel' (the default) the selected, the one whose
   card or icon you point at, and any just given an order (OPATH.flash s, fading over its last OPATH.fade); 'off' none: the
   straight lines as before (battlehud.js drawOrderLines). Culled to the view; no allocation per frame beyond a few strings ---------- */
const OPATH={flash:1.5,fade:.5,near:14,lead:8,gap:24,qgap:36,arm:3,dash:[5,4],dot:[2,3],march:14,reroute:.5,max:256,allyA:.7,allA:.6,goA:.85,
  col:{move:'110,165,245',attack:'255,106,90',withdraw:'226,218,196'},ally:{move:SIDE.ally.rgb,attack:'196,140,128',withdraw:'180,176,166'},
  ai:{move:'180,140,240',attack:'232,120,190',withdraw:'206,192,236'},blades:'255,106,90',
  now:()=>performance.now(),card:null};
// (its state, drawing's own: the frame's path (x, y: n points; q: where the queued legs start; w: the waypoints' indices), a tally
// of each group's men (acc), the ways it laid (memo), each group's last order count and when it changed (seen), the groups drawn
// last frame and its march (drawn, ph: for the tests); b: the battle these belong to)
const OPS={x:new Float64Array(OPATH.max),y:new Float64Array(OPATH.max),n:0,q:0,w:new Int16Array(64),wa:new Uint8Array(64),wn:0,wam:false,kind:'',lost:false,am:false,who:'foot',
  acc:new Map(),memo:new Map(),seen:new Map(),drawn:[],ph:0,b:null,dash:{u:0,d:[0,0],o:[0,0]},none:[],tmp:{x:0,y:0,team:0}};
// (pointing at a group's card: its path, as pointing at its icon does (B.iconHov))
if(typeof document!=='undefined'){document.addEventListener('pointerover',e=>{const c=e.target&&e.target.closest&&e.target.closest('.ucard[data-grp]');OPATH.card=c?c.dataset.grp:null});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget)OPATH.card=null})}
const opMode=()=>typeof prefGet==='function'?prefGet('opaths'):'sel',orderPathsOn=()=>opMode()!=='off';
// (a new battle: none of the last one's)
function opReset(){if(OPS.b===B)return;OPS.b=B;OPS.acc.clear();OPS.memo.clear();OPS.seen.clear();OPS.drawn.length=0}
// each group's men, once a frame: its middle (living, not running, on the field), its big ones and riders (its grid, as
// groupWay picks it), and the middle of those of it your side sees (a target's point: nothing given away under fog)
function opTally(){
  for(const a of OPS.acc.values()){a.n=a.x=a.y=a.tn=a.tx=a.ty=a.big=a.mt=0}
  for(const u of B.units){if(u.hp<=0||u.left||!u.grp)continue;let a=OPS.acc.get(u.grp);if(!a)OPS.acc.set(u.grp,a={n:0,x:0,y:0,tn:0,tx:0,ty:0,big:0,mt:0});
    if(u.team===0||seenBy(0,u)){a.tx+=u.x;a.ty+=u.y;a.tn++}
    if(!u.rout){a.x+=u.x;a.y+=u.y;a.n++;if(u.s.big)a.big++;else if(u.s.mounted)a.mt++}}}
// (sightGoal without its cache: the same answer, nothing stored)
function opLost(g){const S=B.sight;if(!S||!S.goal||!g.hasTarget)return null;const key='0|'+g.targetGroupId+'|'+g.targetUnitId;if(S.goal.has(key))return S.goal.get(key);
  let x=0,y=0,c=0,all=true,any=false;for(const u of B.units){if(u.hp<=0||u.left||u.team===g.team||(g.targetGroupId!==null?u.grp!==g.targetGroupId:u.id!==g.targetUnitId))continue;any=true;
    if(!(u.hid&1)){all=false;break}const p=u.ls;if(p&&p[0]!=null){x+=p[0];y+=p[1];c++}}
  return any&&all&&c?(OPS.tmp.x=x/c,OPS.tmp.y=y/c,OPS.tmp):null}
// (a way from (ax,ay) to (bx,by) on who's grid where a straight line is blocked (null: straight), laid again when the goal's cell,
// the grid or the grid kind changes, or the start's cell after OPATH.reroute s; k: which of the group's ways)
function opRoute(id,k,ax,ay,bx,by,who){
  const T=B.terrain;if(!T||!T.blocky||!T.route)return null;const gr=T.route[who];if(!gr||lineClear(gr,ax,ay,bx,by,255,ROUTE_UNIT.r))return null;
  const key=id+k;let M=OPS.memo.get(key);if(!M)OPS.memo.set(key,M={p:null,gc:-1,sc:-1,v:-1,who:'',at:-1e9});
  const gc=routeIx(gr,bx,by),sc=routeIx(gr,ax,ay),now=OPATH.now()/1000;
  if(!M.p||M.gc!==gc||M.v!==gr.v||M.who!==who||M.sc!==sc&&now-M.at>OPATH.reroute){M.p=routePath(gr,ax,ay,bx,by,{cache:false,r:ROUTE_UNIT.r});M.gc=gc;M.sc=sc;M.v=gr.v;M.who=who;M.at=now}
  return M.p.length?M.p:null}
const opPush=(x,y)=>{if(OPS.n<OPATH.max){OPS.x[OPS.n]=x;OPS.y[OPS.n]=y;OPS.n++}};
// the way still to walk: from the middle (cx,cy) to the point of src (len points, its last (lx,ly)) nearest it, then on along src
// (a later leg must be nearer by a pixel a leg, so a way that doubles back is not cut short)
function opTrim(src,len,lx,ly,cx,cy){
  const X=i=>i===len-1?lx:src[i][0],Y=i=>i===len-1?ly:src[i][1];let best=-1,bd=(X(0)-cx)**2+(Y(0)-cy)**2,qx=0,qy=0;
  for(let i=0;i<len-1;i++){const ax=X(i),ay=Y(i),dx=X(i+1)-ax,dy=Y(i+1)-ay,L=dx*dx+dy*dy,t=L>0?Math.max(0,Math.min(1,((cx-ax)*dx+(cy-ay)*dy)/L)):0,px=ax+dx*t,py=ay+dy*t,d=(px-cx)**2+(py-cy)**2+i+1;
    if(d<bd){bd=d;best=i;qx=px;qy=py}}
  opPush(cx,cy);if(best>=0&&(qx-cx)**2+(qy-cy)**2>1)opPush(qx,qy);for(let i=best+1;i<len;i++)opPush(X(i),Y(i))}
// a group's path into OPS (false: nothing to draw): its kind (move, attack, withdraw), the points, where the queued legs start;
// pv: the way it would take if it withdrew now (WithdrawView)
function opBuild(g,pv=false){
  OPS.n=OPS.q=OPS.wn=0;OPS.lost=OPS.wam=false;OPS.am=!!g.amove;OPS.kind='';const a=OPS.acc.get(g.id);if(!a||!a.n||g.resolve?.routed||g.team!==0)return false;
  const cx=a.x/a.n,cy=a.y/a.n,who=OPS.who=a.big?'big':a.mt*2>a.n?'mounted':'foot',W=g.way;let gx,gy,kind;
  if(pv){kind='withdraw';const e=withdrawView.exit(g,cx,cy);gx=e.x;gy=e.y}
  else if(g.hasTarget){const L=opLost(g),t=g.targetGroupId!==null&&OPS.acc.get(g.targetGroupId);kind='attack';
    if(L){gx=L.x;gy=L.y;OPS.lost=true}else if(t&&t.tn){gx=t.tx/t.tn;gy=t.ty/t.tn}
    else{const e=g.targetGroupId===null&&g.tgt;if(!e||!seenBy(0,e))return false;gx=e.x;gy=e.y}}
  else if(g.order==='charge'){let n=0;gx=gy=0;for(const u of B.units){const e=u.grp===g.id&&u.hp>0&&!u.rout&&u.tgt;if(e&&e.hp>0&&seenBy(0,e)){gx+=e.x;gy+=e.y;n++}}
    if(!n)return false;gx/=n;gy/=n;if(Math.hypot(gx-cx,gy-cy)<=12)return false;kind='attack'}
  else if(g.order==='withdraw'){kind='withdraw';if(exitsOn()){const X=g.exitTo;gx=X?X.x:g.ax;gy=X?X.y:g.ay}// (the exit its men chose, read only: the drawing never picks one, morale.js exitOf)
    else if(B.exit&&typeof exitFor==='function'){const T0=OPS.tmp;T0.x=cx;T0.y=cy;T0.team=g.team;const e=exitFor(T0);gx=e.x;gy=e.y}else{gx=g.ax;gy=g.ay}}
  else{kind='move';const A=g.amove&&g.amove.at?g.amove:null;gx=A?A.x:g.ax;gy=A?A.y:g.ay}// (an attack-move halted to fight on its way: the march still to come)
  OPS.kind=kind;const Q=kind==='move'&&g.queue&&g.queue.length?g.queue:null;
  if(kind==='move'&&Math.hypot(gx-cx,gy-cy)<=OPATH.near){if(!Q)return false;opPush(cx,cy)}
  else if(kind==='move'&&W&&W.mv===g.mvId&&W.p&&W.p.length&&B.terrain&&B.terrain.blocky&&!(g.amove&&g.amove.at)){const n=W.p.length;
    // (its way as laid: reached, its last point is its place now (an advance's place creeps); cut short by the search, on
    // straight to its place; out of reach, it ends where the way does)
    if(W.cut){opTrim(W.p,n,W.p[n-1][0],W.p[n-1][1],cx,cy);opPush(gx,gy)}else opTrim(W.p,n,W.ok?gx:W.p[n-1][0],W.ok?gy:W.p[n-1][1],cx,cy)}
  else{const p=kind==='move'?null:opRoute(g.id,'m',cx,cy,gx,gy,who);if(p)opTrim(p,p.length,p.ok?gx:p[p.length-1][0],p.ok?gy:p[p.length-1][1],cx,cy);else{opPush(cx,cy);opPush(gx,gy)}}
  OPS.q=OPS.n;
  // (the waypoints after it, each leg on its own way)
  if(Q){let px=gx,py=gy;for(let i=0;i<Q.length;i++){const w=Q[i],p=opRoute(g.id,'q'+i,px,py,w.x,w.y,who);
      if(p){for(let j=0;j<p.length-1;j++)opPush(p[j][0],p[j][1])}opPush(w.x,w.y);if(OPS.wn<OPS.w.length){OPS.wa[OPS.wn]=w.am?1:0;if(w.am)OPS.wam=true;OPS.w[OPS.wn++]=OPS.n-1}px=w.x;py=w.y}}
  return OPS.n>1}
// a group's path, for the tests and anyone else: {kind, lost, pts (the way still to walk, from its middle: [[x,y], …]), queue
// (the queued legs' points after it), end}; null for nothing to draw, and always for the enemy's; pv: its withdrawal's preview
function orderPath(id,pv=false){
  const g=B&&B.groups[id];if(!g||g.team!==0)return null;opReset();opTally();if(!opBuild(g,pv))return null;const pts=[];for(let i=0;i<OPS.n;i++)pts.push([OPS.x[i],OPS.y[i]]);
  const main=pts.slice(0,OPS.q);return{kind:OPS.kind,lost:OPS.lost,am:OPS.am,who:OPS.who,pts:main,queue:pts.slice(OPS.q),end:main[main.length-1]}}
// how strongly a group's path shows now (0: not at all): selected or pointed at 1; just given an order, fading; Always, a little
// less; yours withdrawing, or in the withdrawal's preview, goA at least, selected or not; your allies' muted; the enemy's never
function orderPathAlpha(id,sel,now){
  const g=B.groups[id],mode=opMode();if(!g||g.team!==0||mode==='off'||!g.player&&!g.ally)return 0;
  const hov=B.iconHov===id||OPATH.card===id||OPATH.card==='all'&&g.player;let a=sel.includes(id)||hov?1:0;
  if(g.player){const s=OPS.seen.get(id),q=g.orderSeq|0;if(!s)OPS.seen.set(id,{q,t:-1e9});else if(s.q!==q){s.q=q;s.t=now}
    const S=OPS.seen.get(id),age=(now-S.t)/1000;if(age<OPATH.flash)a=Math.max(a,Math.min(1,(OPATH.flash-age)/OPATH.fade))}
  if(mode==='all')a=Math.max(a,OPATH.allA);if(g.player&&(g.order==='withdraw'||withdrawView.shows(id)))a=Math.max(a,OPATH.goA);return g.ally?a*OPATH.allyA:a}
// (the dashes' march: px along the way, from the real clock; none with reducedMotion)
const orderPathPhase=(now,rm)=>rm?0:now/1000*OPATH.march;
// every path shown, beneath the soldiers, trees and rock (render.js drawBattle: a way round a mountain runs behind its picture); false
// when they are off (Settings): render.js draws the straight lines instead (orderPathsOn)
function drawOrderPaths(){
  if(opMode()==='off')return false;if(B.deploy)return true;opReset();
  const now=OPATH.now(),sel=selGroups(),z=B.cam?B.cam.z:1,u=1/Math.min(1,z),ph=orderPathPhase(now,reducedMotion()),vx=B.cam?B.cam.x:0,vy=B.cam?B.cam.y:0,vw=BVW/z,vh=BVH/z;
  const D=OPS.dash;if(D.u!==u){D.u=u;D.d=OPATH.dash.map(v=>v*u);D.o=OPATH.dot.map(v=>v*u)}
  let tallied=false;OPS.drawn.length=0;OPS.ph=ph;
  for(const id in B.groups){const al=orderPathAlpha(id,sel,now),pv=withdrawView.shows(id)&&B.groups[id].order!=='withdraw';if(al<=.01)continue;if(!tallied){opTally();tallied=true}if(!opBuild(B.groups[id],pv))continue;
    // (culled: none of it in view)
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let i=0;i<OPS.n;i++){const x=OPS.x[i],y=OPS.y[i];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
    if(x1<vx-12*u||x0>vx+vw+12*u||y1<vy-12*u||y0>vy+vh+12*u)continue;
    // (its first OPATH.lead px not drawn: the group's middle, among its men, is not marked)
    if(OPS.q>1){const dx=OPS.x[1]-OPS.x[0],dy=OPS.y[1]-OPS.y[0],L=Math.hypot(dx,dy),k=L>0?Math.min(OPATH.lead*u,L*.5)/L:0;OPS.x[0]+=dx*k;OPS.y[0]+=dy*k}
    OPS.drawn.push(id);const g=B.groups[id],col=(g.ally?OPATH.ally:aiHas(g)?OPATH.ai:OPATH.col)[OPS.kind],full=sel.includes(id)||B.iconHov===id||OPATH.card===id,q=OPS.q;
    const dk='rgba(10,12,18,'+(.6*al).toFixed(2)+')',cl='rgba('+col+','+al.toFixed(2)+')';ctx.lineCap='butt';ctx.lineJoin='miter';ctx.lineWidth=u;ctx.lineDashOffset=-ph*u;
    // (the line: dashed, a withdrawal's dotted; its queued legs fainter)
    ctx.setLineDash(OPS.kind==='withdraw'?D.o:D.d);opLine(0,q,u,dk,cl);
    if(OPS.n>q){ctx.setLineDash(D.d);opLine(Math.max(0,q-1),OPS.n,u,'rgba(10,12,18,'+(.36*al).toFixed(2)+')','rgba('+col+','+(.6*al).toFixed(2)+')')}
    // (the chevrons and rings, in one stroke: a ring where it ends (dotted for a place last seen), a small one at each waypoint)
    ctx.setLineDash(OPS.none);opMarks(u,u,ph,vx,vy,vw,vh);ctx.strokeStyle=dk;ctx.stroke();opMarks(0,u,ph,vx,vy,vw,vh);ctx.strokeStyle=cl;ctx.stroke();
    if(OPS.am||OPS.wam){ctx.lineWidth=1.5*u;opBlades(u,u);ctx.strokeStyle=dk;ctx.stroke();opBlades(0,u);ctx.strokeStyle='rgba('+OPATH.blades+','+al.toFixed(2)+')';ctx.stroke();ctx.lineWidth=u}// (an attack-move's end)
    if(OPS.lost&&q>1){ctx.setLineDash(D.o);for(let k=0;k<2;k++){const o=k?0:u;ctx.beginPath();ctx.ellipse(OPS.x[q-1]+o,OPS.y[q-1]+o,6*u,3*u,0,0,6.283);ctx.strokeStyle=o?dk:cl;ctx.stroke()}ctx.setLineDash(OPS.none)}
    // (a withdrawal's end, previewed or under way: where they leave the field)
    if(OPS.kind==='withdraw'&&q>1&&(pv||full))txt(pv?'Would leave here':'Leaving here',Math.round(clamp(OPS.x[q-1],vx+44*u,vx+vw-44*u)),Math.round(clamp(OPS.y[q-1]-7*u,vy+10*u,vy+vh-4*u)),'rgba('+col+','+al.toFixed(2)+')','center');
    // (a move's men's places where it ends, faint, when it is yours to look at)
    if(OPS.kind==='move'&&full&&q>1){ctx.fillStyle='rgba('+col+','+(.55*al).toFixed(2)+')';const s=Math.max(2,u*2,B.world?4*WORLD_BATTLE.sprite:2);for(const m of B.units)if(m.grp===id&&m.hp>0&&!m.rout)ctx.fillRect(Math.round(g.ax+(m.sx||0))-s/2,Math.round(g.ay+(m.sy||0))-s/2,s,s)}}
  ctx.setLineDash(OPS.none);ctx.lineDashOffset=0;ctx.lineWidth=1;return true}
// (points i0 … i1-1 as a line, over a dark copy a pixel down and right, so it reads on grass, snow and sand alike: one field pixel
// wide, one screen pixel zoomed out; thin lines, as a wide or soft edge costs the canvas several times more)
function opLine(i0,i1,u,dk,cl){if(i1-i0<2)return;const X=OPS.x,Y=OPS.y;
  for(let k=0;k<2;k++){const o=k?0:u;ctx.beginPath();ctx.moveTo(X[i0]+o,Y[i0]+o);for(let i=i0+1;i<i1;i++)ctx.lineTo(X[i]+o,Y[i]+o);ctx.strokeStyle=o?dk:cl;ctx.stroke()}}
// (the frame's chevrons, a V every OPATH.gap px along (OPATH.qgap on the queued legs) the way it goes, on a pixel's middle so it
// stays crisp, marching with the dashes (none at the main stretch's first few px, among the men, nor its last, under the ring;
// culled to the view), and its rings, as one path, offset by o)
function opMarks(o,u,ph,vx,vy,vw,vh){
  const X=OPS.x,Y=OPS.y,q=OPS.q,A=OPATH.arm*u;ctx.beginPath();
  const vees=(i0,i1,main)=>{if(i1-i0<2)return;const G=(main?OPATH.gap:OPATH.qgap)*u;let tot=0;for(let i=i0;i<i1-1;i++)tot+=Math.hypot(X[i+1]-X[i],Y[i+1]-Y[i]);const lo=main?4*u:2*u,hi=tot-(main?8*u:4*u);let s=(ph*u)%G,acc=0;
    for(let i=i0;i<i1-1&&s<=hi;i++){const dx=X[i+1]-X[i],dy=Y[i+1]-Y[i],L=Math.hypot(dx,dy);if(!(L>0))continue;const cx=dx/L,cy=dy/L;
      for(;s<=acc+L&&s<=hi;s+=G){if(s<lo)continue;const t=s-acc,px=Math.round((X[i]+cx*t)/u)*u+u/2+o,py=Math.round((Y[i]+cy*t)/u)*u+u/2+o;if(px<vx-A||px>vx+vw+A||py<vy-A||py>vy+vh+A)continue;
        ctx.moveTo(px-cx*A-cy*A,py-cy*A+cx*A);ctx.lineTo(px,py);ctx.lineTo(px-cx*A+cy*A,py-cy*A-cx*A)}
      acc+=L}};
  vees(0,q,true);if(OPS.n>q)vees(Math.max(0,q-1),OPS.n,false);
  const ring=(i,rx,ry)=>{const x=X[i]+o,y=Y[i]+o;ctx.moveTo(x+rx,y);ctx.ellipse(x,y,rx,ry,0,0,6.283)};
  if(q>1&&!OPS.lost&&!(OPS.am&&OPS.kind==='move'))ring(q-1,6*u,3*u);for(let k=0;k<OPS.wn;k++)if(!OPS.wa[k])ring(OPS.w[k],k===OPS.wn-1?5*u:3*u,k===OPS.wn-1?2.5*u:1.5*u)}
// (an attack-move's crossed blades, where its move ends and at each waypoint of one, as one path, offset by o: two blades crossed,
// a guard across each near its hilt)
function opBlades(o,u){ctx.beginPath();const X=OPS.x,Y=OPS.y,at=(i,r)=>{const x=X[i]+o,y=Y[i]+o,h=r*.55;
    for(const s of [-1,1]){ctx.moveTo(x-s*r,y-r*.6);ctx.lineTo(x+s*r,y+r*.6);const gx=x+s*r*.55,gy=y+r*.33;ctx.moveTo(gx-h*.35,gy-h*.6*s);ctx.lineTo(gx+h*.35,gy+h*.6*s)}};
  if(OPS.am&&OPS.kind==='move'&&OPS.q>1)at(OPS.q-1,7*u);for(let k=0;k<OPS.wn;k++)if(OPS.wa[k])at(OPS.w[k],k===OPS.wn-1?5*u:4*u)}
/* the withdrawal's preview: pointing at a Withdraw button (or a first tap on one on a touch screen, held arm s: a second tap
   withdraws) shows, for each selected group of yours not yet withdrawing, the way it would take off the field now: its exit
   (morale.js exitChoose; the world battle's circle, worldbattle.js exit; else your edge, straight back), looked at again every
   every s of battle, laid round the ground as a withdrawal's path, with where they would leave. Drawing only: no exit is chosen
   for a group, and its order stands till you give one. Bound to the buttons once (bind) */
const WITHDRAW_VIEW={arm:6,every:.5};
class WithdrawView{
 constructor(){this.hover=false;this.armedAt=-1e9;this.memo=new Map()}
 get on(){return this.hover||this.armed()}
 armed(){return OPATH.now()/1000-this.armedAt<WITHDRAW_VIEW.arm}
 // the groups it shows: the selected ones of yours still to withdraw
 ids(){return this.on&&B?selGroups().filter(id=>B.groups[id]?.player&&B.groups[id].order!=='withdraw'&&grpUnits(id).some(u=>u.hp>0&&!u.left)):[]}
 shows(id){return this.on&&this.ids().includes(id)}
 // (a tap: true, held (its way shown, armed); false, let through (armed already: the withdrawal itself, or nothing to show))
 tap(){if(this.armed()){this.armedAt=-1e9;return false}if(!B||!selGroups().some(id=>B.groups[id]?.order!=='withdraw'))return false;this.armedAt=OPATH.now()/1000;return true}
 disarm(){this.armedAt=-1e9;this.hover=false}
 exit(g,cx,cy){const M=this.memo.get(g.id);if(M&&M.b===B&&Math.abs(B.t-M.t)<WITHDRAW_VIEW.every)return M;
  let e=null;if(B.world)e=B.world.exit({x:cx,y:cy,team:g.team},2);else if(exitsOn()){const m=grpUnits(g.id).filter(u=>!u.rout);e=m.length?exitChoose(m,g.team,null):null}
  if(!e)e={x:g.team?BW-MORALE.edge:MORALE.edge,y:cy};const r={b:B,t:B.t,x:e.x,y:e.y,side:e.side||null};this.memo.set(g.id,r);return r}
 // where its way points, in words: by the edge it leaves by, or (the world battle; no edges) to the way off the field
 where(id){const g=B.groups[id],m=grpUnits(id).filter(u=>u.hp>0&&!u.left&&!u.rout);if(!g||!m.length)return '';const C=centroid(m),e=this.exit(g,C.x,C.y);
  if(e.side)return 'by the '+{W:'west',E:'east',N:'north',S:'south'}[e.side]+' edge';const a=Math.round(Math.atan2(e.y-C.y,e.x-C.x)/(Math.PI/4));return 'to the '+['east','south-east','south','south-west','west','north-west','north','north-east'][(a+8)%8]}
 bind(){for(const b of document.querySelectorAll('.obtn[data-order="withdraw"]')){if(b.dataset.wv)continue;b.dataset.wv='1';
   b.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')this.hover=true});b.addEventListener('pointerleave',()=>{this.hover=false});
   b.addEventListener('focus',()=>{this.hover=true});b.addEventListener('blur',()=>{this.hover=false})}}
}
const withdrawView=new WithdrawView();
if(typeof document!=='undefined')withdrawView.bind();

