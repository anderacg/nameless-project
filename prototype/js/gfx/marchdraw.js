'use strict';
// Marching presentation: sprites, animation over the ground, wading and army rings. Movement remains in world/march.js.
// The battle's full sprites at its world scale, with weapons included and movement-driven poses (bare: the melee weapon left
// off, drawn apart: a flag's spear, gfx/marchgear.js).
// (his look, as his sprite's: sprites.js spriteLook, kept on him)
function marchLook(u,o){const type=u.character?u.type.replace(/^comp_/,''):u.type,hero=type==='hero',col=o.look().col;
  const cl=dressClimAt(o.x,o.y);if(!u.mLook||u.mLookC!==col||u.mLookW!==cl){const L=dressedIn(cl,()=>spriteLook(type,o.mapKind==='monster'?1:0,hero,hero||u.row==='leader'?0:u.id%6,col));u.mLook=o.unarmed?{...L,weapon:null,slung:WPN[L.weapon]?null:L.weapon}:L;u.mLookC=col;u.mLookW=cl}return u.mLook}// (unarmed (refugees): their tools slung on their backs, nothing in hand)
// (his stride's frame on the march, 0-3: by the way he has walked, a step each WALK.foot × WALK.step px, so his feet keep to the ground)
const marcherStep=u=>footFrame(u.walk,u.id);
// (drawn walking: stepping, and not yet at his place: there, he stands at once, not on his last stride frozen for the rest of
// MARCH_MOVE.stride; the owner, "leg stuck before going to idle". Drawn only: the march itself reads u.walking)
const marchWalks=u=>!!u.walking&&!(u.tg&&Math.hypot(u.x-u.tg.x,u.y-u.tg.y)<MARCH_MOVE.home);
function marchSprite(u,o,pose,bare){
  const type=chiefLookType(u.character?u.type.replace(/^comp_/,''):u.type,o.ld?.band),hero=type==='hero',lead=hero||u.row==='leader';
  return dressedIn(dressClimAt(o.x,o.y),()=>unitSprite(type,o.mapKind==='monster'?1:0,hero,lead?0:u.id%6,pose??(marchWalks(u)?2+marcherStep(u):0),!!bare,!!o.unarmed,o.look().col));
}
// (your army's pictures made ahead in a frame's spare time (main.js paintIdle): standing and its four strides, armed and bare, one man
// of each kind and look a call, in turn; each first built as he set off had cost a frame 25-50 ms (the owner, 2026-11-17: "lag/freeze"))
const MARCH_WARM={on:true,poses:[0,2,3,4,5],i:0};
function marchWarm(ms){const Q=MARCH_WARM,A=Q.on&&WORLD_BATTLE.on&&MARCH_ARMIES.get(P);if(!A||!A.units.length)return;const t0=performance.now(),U=A.units,seen=new Set();
  for(let n=0;n<U.length&&performance.now()-t0<ms;n++){const u=U[(Q.i+n)%U.length],k=u.type+'|'+(u.row==='leader'||u.character?0:u.id%6);if(seen.has(k))continue;seen.add(k);
    for(const p of Q.poses)for(const b of [false,true]){const a=performance.now();marchSprite(u,P,p,b);if(performance.now()-a>2){Q.i=(Q.i+n)%U.length;return}}}Q.i=(Q.i+1)%U.length}// (one new picture a call at most)
// Leaders use the same character kind and equipment as battle; cached cells also serve map picking and banner height.
const MARCH_LEADERS=new WeakMap();
function marchLeaderSprite(o,f){
  const hero=o===P,cid=o.cid,type=hero?'hero':cid?charOf(compInit(cid),cid).key:o.mapKind==='lord'?charOf(o).key:o.ld?charOf(o.ld).key:partyRoster(o).groups[0]?.type||'militia';
  const pose=f?2+Math.floor(f/2)%4:0,base=unitSprite(type,0,hero,0,pose,false,false,o.look().col);
  let s=MARCH_LEADERS.get(base);if(!s){const k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale;s=mkc(Math.ceil(base.width*k),Math.ceil(base.height*k),g=>g.drawImage(base,0,0,base.width*k,base.height*k));s.base=base;MARCH_LEADERS.set(base,s)}return s;
}
function marchDraw(ents,o,cam){
  if(!WORLD_BATTLE.on)return false;const army=MarchArmy.of(o);army.sync();marchCircle(ents,o,cam,undefined,undefined,army);
  // (another's men only those in your sight, each by his own ground (worldobject.js spotted, manSpotted): a host's van seen as it comes
  // on, the rest still in the fog; yours and your companions' all)
  const own=o===P||o.faction==='player',S=!own&&SIGHT_EYES.armies&&G.mode==='world'&&!B?yourSight():null;
  // (each one drawn bends the grass he walks through: worldterrain.js grassFoot)
  for(const u of army.units)if(!S||manSpotted(S,u)){const D=ST[u.type]||{};grassFoot(u.x,u.y,marchWalks(u),D.mounted||D.big||D.beast,u);ents.push({x:u.x,y:u.y,own,f:()=>drawMarcher(u,o,cam)})}
  // (a beast's marker over its middle)
  const u0=army.units[0];if(u0&&o.mapKind==='monster')ents.push({x:o.x,y:o.y,f:()=>BANNERQ.push({o,marker:{h:marchSprite(u0,o).height*WORLD_BATTLE.sprite/WORLD_BATTLE.scale,col:o.look().col}})});return true;
}
// (a marcher going up a slope, down one or up a cliff, by the land's height a few px ahead of him the way he faces (map.js headingUp):
// 'up', 'down', 'cliff' (a rock tile, climbed: map.js heroClimbs) or null on the flat; and his pose for it, as in a fight (render.js
// drawUnitAt's climbState): 19-22 up, 23-26 down, CLIFF_POSE's four a cliff (gfx/dollfigs.js DOLL_CLIMB); none standing)
function marchSlope(u,o){const tx=Math.floor(u.x/TILE),ty=Math.floor(u.y/TILE);if(tx<0||ty<0||tx>=MW||ty>=MH)return null;const i=ty*MW+tx;if(WM.kind[i]===T_MOUNT)return 'cliff';
  const c=WM.slope&&WM.slope[i];if(c!==1&&c!==2)return null;const a=u.dir??marchFacing(o),up=headingUp(u.x,u.y,u.x+Math.cos(a)*8,u.y+Math.sin(a)*8);return up==null?null:up?'up':'down'}
function marchClimbPose(u,o){if(!marchWalks(u)||(ST[u.type]||{}).fly)return undefined;const s=marchSlope(u,o);if(!s)return undefined;return (s==='up'?19:s==='down'?23:CLIFF_POSE)+marcherStep(u)}
/* a marcher's moment over a ledge, a bank or out of the water (the owner, 2026-11-17: "make jumping animation when ascending the hill
   edge (if can go down)", "add crawling up animation from shore, edge of land and water"; 2026-11-18: "The jumping and animations should
   be based on the height right? ... if the water is at foot level then there no need to jump down", "the distance to play animation
   should be close to edge"), drawn only, by the land as painted (liftAt: a river's water lies some px below its banks, a lake's level
   with them). Walking, he looks along his way up to look game px for a face: the first px where the land changes by rate px or more
   from the one before; its height from the px before it to the land past it (the face running on up to face px while it changes by soft
   px or more a px). When his feet are within reach px of it (or the px he moves this frame), its height picks his move (game px; a man
   stands some 16): going down, under down[0] he walks on, under down[1] a step down, under down[2] a hop, more a jump; going up, under
   up[0] he walks on, under up[1] a step up, more a pull up (the cliff's scramble); up out of water deep or deeper (levels, map.js WATER:
   waist; the water's own depth over the ramp px behind him, not the drawn shallows at its bank) by crawl px or more, he crawls out on his
   hands and knees. On a graded way (a ford, a road: marchGraded) he only steps down or up, however high. A beast neither climbs nor
   crawls (its moves drawn as its walk), a rider never crawls. The move is played over the
   ground he covers from there (span game px of it plus per px of its height, at least past the face), so it begins at the edge and ends
   where the land does; met while in a move past its own face (a narrow stream's far bank), the next from where he is drawn; standing
   still stall s, it is dropped; a far move (far px, a gate) none. Past a face in one frame, the move from the height he left. Its pose and how far up from where the land would put him (dy, game px) */
const MARCH_ACT={look:6,reach:2,rate:1.5,face:4,soft:.5,moved:.1,far:8,stall:.4,down:[2.5,5,9],up:[2.5,5],deep:.35,crawl:4,ramp:8,
  span:{step:3,hop:5,jump:7,stepup:3,climb:5,crawl:7},per:.3,arc:{hop:1.5,jump:3}};
// (the face along (hx, hy) from map px (x, y) within look px: {a: px to it, end: px to the land past it, from, to: the land's lift
// before and past it, h: to - from}; none, null)
function marchFace(x,y,hx,hy,J=MARCH_ACT){let p=liftAt(x,y),a0=0;
  for(let a=1;a<=J.look;a++){const v=liftAt(x+hx*a,y+hy*a);if(Math.abs(v-p)>=J.rate){a0=a;break}p=v}
  if(!a0)return null;let to=liftAt(x+hx*a0,y+hy*a0),b=a0;const sg=Math.sign(to-p);
  for(;b<a0+J.face;b++){const v=liftAt(x+hx*(b+1),y+hy*(b+1));if(Math.abs(v-to)<J.soft||Math.sign(v-to)!==sg)break;to=v}
  return{a:a0,end:b,from:p,to,h:to-p}}
// (the move over a face h px high (up +), out of water wd levels deep, by his kind S, on a graded way or not; none, null)
function marchMove(h,wd,S,graded,J=MARCH_ACT){if(h<0){const d=-h;return d<J.down[0]?null:d<J.down[1]||graded?'step':d<J.down[2]?'hop':'jump'}
  if(h<J.up[0])return null;if(S.beast||graded)return 'stepup';if(wd>=J.deep&&h>=J.crawl&&!S.mounted)return 'crawl';return h<J.up[1]?'stepup':'climb'}
// (on a bridge's span at map px (x, y): its deck and the road ramped up to it (worldways.js bridgeShift: drawn on the deck), where
// no edge move is played; the land under it is the river's, never his)
const marchOnBridge=(x,y)=>typeof bridgeShift==='function'&&!!bridgeShift(x,y);
// (a graded way at map px (x, y): a ford's tile, a road's, or well into a road's band as drawn (roadband.js), where the way is cut down
// the bank: walked, stepping down or up it, never leapt, climbed or crawled)
function marchGraded(x,y){const t=terrAt(x,y);return t===T_FORD||t===T_ROAD||typeof RoadBand!=='undefined'&&(RoadBand.at(x,y)&63)>=ROAD_BAND.name*63}
// (how deep the water he is leaving is, levels: its tiles' own depth (open water WATER.open) over the ramp px behind him; none, 0)
function marchWaterBehind(x,y,hx,hy,J=MARCH_ACT){if(typeof drawnWet!=='function')return 0;const D=waterDepths(WM);let w=0;
  for(let k=0;k<=J.ramp;k+=2){const px=x-hx*k,py=y-hy*k;if(!drawnWet(px,py))continue;const i=Math.floor(py/TILE)*MW+Math.floor(px/TILE),d=D[i]<0?WATER.open:D[i];if(d>w)w=d}
  return w}
// (where a move A draws him at its share q: the land's lift there, eased from the height he left to the new, a hop's or a jump's arc over it)
// (how far up each marcher is drawn by his move over an edge this frame (marchDraw): where effects on him are, MarchArmy body)
const MARCH_UP=new WeakMap();
function marchActLift(A,q,J=MARCH_ACT){const k=A.k,sm=q*q*(3-2*q);return A.from+A.h*(k==='hop'||k==='jump'?q*q:sm)+(J.arc[k]?J.arc[k]*4*q*(1-q):0)}
function marchAct(u){const J=MARCH_ACT,now=performance.now()/1000,S=ST[u.type]||{},none={pose:undefined,dy:0};if(S.fly||typeof liftAt!=='function')return none;
  const walks=marchWalks(u),m=u._ax!=null?Math.hypot(u.x-u._ax,u.y-u._ay):0,hx=m>0?(u.x-u._ax)/m:0,hy=m>0?(u.y-u._ay)/m:0,L=liftAt(u.x,u.y),aL=u._aL;
  u._ax=u.x;u._ay=u.y;u._aL=L;let A=u._act;if(marchOnBridge(u.x,u.y)){u._act=null;return none}// (on a bridge's span: walked level on its deck)
  if(m>J.far){u._act=null;return none}
  if(A){if(m>0){A.go+=m;A.t=now}if(now-A.t>J.stall||A.go>=A.span)u._act=A=null}
  // (a face at his feet: its move; met while still in a move past its own face (a narrow stream's far bank), the next from where he is drawn)
  if(walks&&m>=J.moved&&(!A||A.go>=A.past)){
    const f=marchFace(u.x,u.y,hx,hy,J);let k=null,from=0,h=0,end=0;
    if(f&&f.a<=Math.max(J.reach,m*1.5)){k=marchMove(f.h,f.h>0?marchWaterBehind(u.x,u.y,hx,hy,J):0,S,marchGraded(u.x,u.y)||marchGraded(u.x+hx*f.end,u.y+hy*f.end),J);if(A&&!k)k=A.k;from=A?marchActLift(A,Math.min(1,A.go/A.span),J):f.from;h=f.to-from;end=f.end}
    else if(!A&&!f&&aL!=null&&Math.abs(L-aL)/m>=J.rate){h=L-aL;from=aL;k=marchMove(h,h>0?marchWaterBehind(u.x,u.y,hx,hy,J):0,S,marchGraded(u.x,u.y),J)}
    if(k)u._act=A={k,t:now,go:0,from,h,past:end,span:Math.max(J.span[k]+J.per*Math.abs(h),end+1)}}
  if(!A)return none;const q=Math.min(1,A.go/A.span),dy=marchActLift(A,q,J)-L,k=A.k;if(S.beast)return{pose:undefined,dy};const st=marcherStep(u);
  return{pose:k==='step'?23+st:k==='stepup'?19+st:k==='climb'?CLIFF_POSE+st:k==='crawl'?CRAWL_POSE+Math.floor(q*8)%4:JUMP_POSE,dy}}
// (how far up a man the water stands at depth d (levels), figure px: WATER.cut's bands eased one into the next, full at each band's
// middle (MARCH_WADE), so he sinks as he wades in and rises as he wades out, the drawn depth easing in from the bank; any water an ankle's,
// a ford's and a brook's drawn over the land (their depth 0) too)
const MARCH_WADE=[0,.06,.235,.575,.8];
function wadeCut(d){if(!(d>0))return 0;const C=WATER.cut,K=MARCH_WADE;for(let b=1;b<K.length;b++)if(d<K[b])return Math.max(C[1],Math.round(C[b-1]+(C[b]-C[b-1])*(d-K[b-1])/(K[b]-K[b-1])));return C[4]}
// (drawn small without losing its lines when zoomed out: render.js reduced)
function drawMarcher(u,o,cam){if(u.gateAt)return;if(o.drawMan)return o.drawMan(u,cam);return reduced(()=>drawMarcherAt(u,o,cam))}// (an army of no soldiers draws its own men: refugees.js)// (waiting his turn at a gate: unseen, gatefile.js)
function drawMarcherAt(u,o,cam){
  // (standing: his fidgets, as in battle: render.js idleLife, on the real clock)
  const S=ST[u.type]||{},I=!marchWalks(u)?idleLife(u.id,performance.now()/1000,S.beast?'beast':S.mounted?'mount':'foot'):null;
  // (what he carries besides, gfx/marchgear.js: his army's flag (on a spear of its own, his body bare; else at his back, before
  // his body), a torch after dark)
  const act=marchAct(u);MARCH_UP.set(u,act.dy);subT(u);const k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale,x=Math.round(u.x-cam.x),y=Math.round(u.y-cam.y-act.dy),sx=Math.cos(u.dir??marchFacing(o))<0?-k:k,G=marchGear(u,o,x,y,sx);
  // (his body bare, his weapon apart in his hand, as in battle: weapons.js mapHeld (a sword worn out of sight: SHEATH); a flag-bearer's
  // (your hero's, carrying your banner) only if it is sheathed (SHEATH.show), his hands on the pole; none for a beast)
  const s=marchSprite(u,o,I?.pose??act.pose??marchClimbPose(u,o),true);IndividualHealth.anchor(u,x,y-IndividualHealth.top(s)*k);// (his health squares over his head as drawn)
  const bx=-Math.floor(s.width/2)+(I?.dx||0),by=-s.height+2,H0=S.beast?null:mapHeld(marchLook(u,o),s,marchWalks(u),marcherStep(u)),H=G.bare&&!H0?.sheathed?null:H0;
  // (in water, the world lab's way: under it from his feet up as deep as it is where he stands (WATER.cut figure px, eased between its bands: wadeCut; worldterrain.js
  //  drawnDepth: his tile's depth eased in from the drawn bank, none on the drawn bank); his body under it faint and wavering, the water's line about him
  //  a wavy ring of foam, a ripple spreading from him (the owner, 2026-11-16: "the water that wrap around unit looks too flat"))
  const tx=Math.floor(u.x/TILE),ty=Math.floor(u.y/TILE),inn=!S.fly&&tx>=0&&ty>=0&&tx<MW&&ty<MH,ground=inn?WorldGround.at(u.x,u.y):null,deck=ground?.onDeck,cut=!ground||deck?0:wadeCut(ground.depth)||(ground.wet?WATER.cut[1]:0);
  ctx.save();ctx.translate(x,y);ctx.scale(sx,k);if(cut){ctx.beginPath();ctx.rect(bx-8,by-8,s.width+16,s.height+8-cut);ctx.clip()}
  G.back(s,bx,by);if(H&&H.back)ctx.drawImage(H.w,bx+H.x,by+H.y);ctx.drawImage(s,bx,by);if(H&&!H.back){ctx.drawImage(H.w,bx+H.x,by+H.y);drawGrip(s,bx,by,marchLook(u,o))}G.front(s,bx,by);ctx.restore();
  if(cut)drawWading(s,x,y,sx,k,bx,by,cut,u.id,marchWalks(u),cam);else if(!S.fly&&!deck&&typeof grassOver==='function'){grassOver(u.x,u.y,s.width*k/2);stepPrint(u,!!(S.beast||S.mounted),o)}}// (on a bridge's deck: no water at his legs, no grass)
// (a man in water (march.js drawMarcherAt): his picture s drawn at (x, y) scaled (sx, k), its corner (bx, by); the water cut figure px up
// his body. Under the line his body faint and wavering; at it a darker band of water and a broken ring of foam, wavering; a ripple ring
// spreading from him, quicker while he moves; all of it only over the screen's px where water is drawn (the owner: "the water circle
// is draw over the land"), the ground each px shows read through the land's lift (worldterrain.js liftGround, drawnWet)
function drawWading(s,x,y,sx,k,bx,by,cut,id,moving,cam){const t=performance.now()/1000,W=WATER.draw,yl=s.height+by-cut;
  const R=Math.ceil((s.width/2+10)*k),Y0=Math.floor((yl-4)*k),Y1=Math.ceil((s.height+by+8)*k),wet=new Path2D();let any=false;
  if(cam&&typeof liftGround==='function'){const L=typeof LIFT_NOW==='number'?LIFT_NOW:0;
    for(let ly=Y0;ly<=Y1;ly++){let a=null;for(let lx=-R;lx<=R+1;lx++){const g=lx<=R&&liftGround(cam.x+x+lx+.5,cam.y+y+ly+.5-L),on=g&&drawnWet(g.x,g.y);
      if(on&&a===null)a=lx;else if(!on&&a!==null){wet.rect(a,ly,lx-a,1);any=true;a=null}}}
    if(!any)return}else wet.rect(-R,Y0,2*R+1,Y1-Y0+1);
  ctx.save();ctx.translate(x,y);ctx.clip(wet);ctx.scale(sx,k);ctx.beginPath();ctx.rect(bx-8,yl,s.width+16,cut+8);ctx.clip();ctx.globalAlpha=W.under;ctx.drawImage(s,bx+Math.round(Math.sin(t*3+id)*.8),by+1);ctx.restore();
  ctx.save();ctx.translate(x,y);ctx.clip(wet);ctx.scale(k,k);const w=Math.max(6,Math.round(s.width*.55)),h=w>>1;
  ctx.fillStyle=W.shade;ctx.beginPath();ctx.ellipse(0,yl+1.5,h+1,2,0,0,Math.PI*2);ctx.fill();
  for(let i=-h;i<=h;i++){const wv=Math.sin(i*.9+t*6+id),a=1-Math.abs(i)/(h+1);if(wv<-.55)continue;ctx.fillStyle=`rgba(236,246,250,${(.35+.5*a).toFixed(2)})`;ctx.fillRect(i,Math.round(yl+(wv>.5?-1:0)),1,1)}
  const ph=(t*(moving?W.rippleMove:W.ripple)+id*.37)%1;ctx.strokeStyle=`rgba(236,246,250,${(.4*(1-ph)*(1-ph)).toFixed(2)})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,yl+1,h+ph*w*W.spread,1+ph*1.6,0,0,Math.PI*2);ctx.stroke();
  ctx.restore()
}
// (the owner, 2026-10-31: "the army ring speed is based on the overall unit speed so it can keep centered") its rings drawn on the
// middle its men make (MarchArmy mid: each man's spot less his place in it, their median), so they go as the men go, and settle
// on the army's own as they do; no men formed near, on the army's own. Its army given (marchDraw), the outline of its men's ground
// instead (MarchOutline, MARCH_RING), drawn as the circles are, about its middle
function marchCircle(ents,o,cam,r=marchOuter(o),col=o===P?B?'#e4c777':travelDetectionColor(travelDetectionShown(travelDetectionState())):o.look().col,army=null){
  const L=army&&MARCH_RING.on&&army.units.length?army.ring||(army.ring=new MarchOutline()):null;
  // (MARCH_RING.draw off: no ring drawn, its outline kept for the rules all the same)
  if(L){L.update(army);if(!MARCH_RING.draw)return;ents.push({x:o.x,ly:o.y,y:o.y+L.top,f:()=>{const x=o.x-cam.x,y=o.y-cam.y;ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=.55;L.path(L.out[0],x,y);ctx.stroke();
    ctx.globalAlpha=.28;ctx.setLineDash(RING_DASH);L.path(L.out[1],x,y);ctx.stroke();ctx.restore()}});return}
  if(!MARCH_RING.draw)return;const m=MARCH_ARMIES.get(o)?.mid,c=m&&Math.hypot(m.x-o.x,m.y-o.y)<r?m:o;
  ents.push({x:c.x,ly:c.y,y:c.y-r,f:()=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(c.x-cam.x,c.y-cam.y,r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.28;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(c.x-cam.x,c.y-cam.y,marchInteractRadius(o,r),0,Math.PI*2);ctx.stroke();ctx.restore()}});
}
