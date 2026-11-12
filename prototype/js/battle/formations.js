'use strict';
/* ---------- formations: how a group stands. Every group (yours, and the enemy's) keeps its soldiers in slots laid out in ranks
   and files across the way it faces. Its width and depth are the line you drag (right-click and drag: where it runs, how wide,
   which way it faces; wide makes a long thin line, short a deep block or a column); a plain right-click keeps its width and turns
   it toward where it marches. Its formation is how the men stand in that shape: a line, or, for the troops it suits,
   loose order (foot) or a wedge (cavalry). Shield wall is a capability-filtered ability, not a formation. A block 4 or more ranks deep blunts a charge. ---------- */
// files: soldiers abreast (until a line is dragged; a wedge: its widest rank, none a whole triangle); gx, gy: spacing across and
// back (px). who: the troops it suits (FORM_WHO); key: its key. A drag sets every form's width (the owner, 2026-10-31: "the right
// click ... seems to support only lines formation"): a column's, how many columns (dragFiles)
const FORMS={
  line:{n:'Line',files:8,gx:14,gy:13,d:'Ranks across the front, as wide as you drag the line.'},
  // (a column: files cw abreast, a file's gap between columns; files: how many columns, the rest of the men behind, the owner,
  // 2026-10-31: "column will prioritize unit to the back ... dragging long line will create more column")
  column:{n:'Column',col:true,files:1,cw:2,gx:14,gy:13,d:'Files two abreast, deep; the line you drag sets how many columns stand side by side, the rest behind.'},
  loose:{n:'Loose',files:8,gx:24,gy:22,who:'foot',key:'L',d:'Wider spacing only; no direct damage bonus or penalty.'},
  wedge:{n:'Wedge',wedge:true,gx:13,gy:12,who:'cav',key:'T',d:'Cavalry spearhead: 6 formed cavalry give +5% charge, +2.5 percentage points per additional rider, capped at +30% at 16. Scattered or routing riders do not count.'},
  // (beasts: no ranks, a ragged clump files wide, each beast off its place by a fixed jitter, beastmind.js; never one of yours to pick: FORM_ORDER)
  pack:{n:'Pack',pack:true,files:5,gx:17,gy:15,who:'beast',d:'Beasts keep no ranks: a loose, ragged spread.'},
  // (a circle, a schiltron (the owner, 2026-11-01: "the circle size will determine whether to have unit stack by layers ... the
  // maximum circle size is where your unit can fill a whole circle without gap otherwise you may have a gap in circle"): every man
  // facing out, its outer ring files places (circleRings), the rest on rings a rank gy further in; foot who fight hand to hand,
  // spears best (their Brace all round): CIRCLE)
  circle:{n:'Circle',ring:true,files:12,gx:12,gy:7,who:'ring',say:'a circle',d:'Foot in a ring, every man facing out: no flank or rear to strike, Brace all round. Slow: no running, no charging. Its size by the line you drag: small, its men in rings two or more deep; wide, one ring with gaps.'},
  // (the Cantabrian circle: horse archers riding a loop round its middle in single file, shooting as they pass, its size as the
  // circle's, all on one ring (CANTABRIAN); map: the shape it marches in on the map, a loose clump, mapForm)
  cantabrian:{n:'Cantabrian circle',loop:true,files:12,gx:18,gy:22,who:'hbow',map:'loose',say:'a Cantabrian circle',d:'Horse archers ride a loop round its middle in single file, shooting as they pass, never standing to be caught. A move order moves the loop, Hold stops it, Charge or Withdraw break it. Its size by the line you drag.'}
};
// (the battle bar's formation buttons (data-form) and FORM_ORDER stay as they were (tests/battlecommands.js fingerprints them): the
// rings have their own button and key, each group its own ring (commands.js ringForm))
const FORM_ORDER=['line','loose','wedge'],FORM_PICK=['loose','wedge'],RING_FORMS=['circle','cantabrian'];
// (the shape a form marches in on the map: its map form, else its own)
const mapForm=f=>FORMS[f]?.map||f;
/* the circle's rules (FORMS.circle; the owner, 2026-11-01): minR, its least radius (px); near: a man this near his place in it (px,
   at the field's scale: of where its men stand, their median) is formed (ringed); spd: its pace, × a walk (it never runs nor
   charges); gaps: a drag sets it as wide as this many times its men's places at most; arrows: a missile still lands on the side it
   comes from (a man faces out: the far side of the ring takes in the back what flies over it), every blow on his front. ai: an AI
   captain rings a foot group of spears (most of it) when riders are about it, aiNear px off (aiKeep × that once ringed), from more
   than one side (two of them aiSides rad apart round it), and breaks it once they are gone */
const CIRCLE={minR:12,near:24,spd:.5,gaps:2,arrows:true,ai:true,aiNear:160,aiKeep:1.3,aiSides:1.6};
/* the Cantabrian circle (FORMS.cantabrian): its places turn round its middle, pace × its walk (px/s along the loop), its riders
   keeping to them at a walk and shooting as they ride (actors.js onTheMove: horse archers do); dir -1: counter-clockwise on the
   field, each rider's right to the foe outside; minR: its least radius (px), room for a horse to wheel; Hold stops it (still:
   battlecontrol.js) */
const CANTABRIAN={pace:.9,dir:-1,minR:40};
const WALL={near:16,front:.65,spd:.6},WEDGE={min:6,start:.05,step:.025,cap:.3,slot:28};
const shieldEligible=u=>!!(u.s&&!u.s.range&&!u.s.mounted&&!u.s.charge&&tagsOf(u.s).includes('shield'));
// Group flags request actions; each soldier must have the capability.
const flagEligible=(u,f)=>f==='shieldWall'?shieldEligible(u):['melee','cease','skirmish'].includes(f)?!!u.s.range:true;
const unitFlag=(u,f)=>!!(u.grp&&B.groups[u.grp]&&B.groups[u.grp][f]&&flagEligible(u,f));
// (no shield wall in woods, a ford or deep water, nor riders in the wedge there: they break formations, terrain.js groundThin)
function wallReady(u){const g=u.grp&&B.groups[u.grp];return !!(unitFlag(u,'shieldWall')&&g.walk&&!g.run&&u.hp>0&&!u.rout&&!(u.stun>0)&&g.order!=='charge'&&g.order!=='withdraw'&&!groundThin(u))}
function shieldWallActive(u){return wallReady(u)&&B.units.some(o=>o!==u&&battleFriend(o,u)&&wallReady(o)&&Math.hypot(o.x-u.x,o.y-u.y)<=WALL.near&&angGap(B.groups[o.grp].face||0,B.groups[u.grp].face||0)<1.05)}
function wedgeMembers(g){
  const gr=B.groups[g];if(!gr||gr.form!=='wedge')return [];
  const m=grpUnits(g).filter(u=>!u.rout&&!withdrawing(u)&&u.s.charge&&!(u.stun>0)&&!groundThin(u));if(!m.length)return [];
  // Inferred median anchors reject distant stragglers while allowing the wedge to move.
  const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)],x=median(m.map(u=>u.x-(u.sx||0))),y=median(m.map(u=>u.y-(u.sy||0)));
  return m.filter(u=>Math.hypot(u.x-x-(u.sx||0),u.y-y-(u.sy||0))<=WEDGE.slot&&angGap(u.dir??gr.face,gr.face||0)<1.05);
}
const wedgeBonus=n=>n<WEDGE.min?0:Math.min(WEDGE.cap,WEDGE.start+(n-WEDGE.min)*WEDGE.step);
// (ring: foot who fight hand to hand, a circle's (not riders, not shooters, not beasts); hbow: riders who shoot, a Cantabrian circle's)
const FORM_WHO={melee:u=>!u.s.range&&!u.s.charge,shield:u=>!u.s.range&&!u.s.mounted&&tagsOf(u.s).includes('shield'),foot:u=>!u.s.mounted,cav:u=>!!u.s.charge,beast:u=>!!(u.s.beast||u.s.big),
  ring:u=>!u.s.range&&!u.s.mounted&&!u.s.beast&&!u.s.big,hbow:u=>!!(u.s.mounted&&u.s.range&&!u.s.magic)},
  WHO_N={melee:'melee infantry',shield:'shielded infantry',foot:'foot troops',cav:'cavalry',beast:'beasts',ring:'foot who fight hand to hand',hbow:'horse archers'};
const DEPTH={ranks:4,charge:.7};// a block this many ranks deep takes a charge's bonus at this much of its force (not from behind)
const FORM_DRAG=8;// a right-click dragged further than this lays out a line
// does formation f suit group g (most of its soldiers are of the kind it is for)
function formFits(g,f){const F=FORMS[f];if(!F)return false;if(!F.who)return true;if(g==='hero')return false;const m=grpUnits(g);return m.length>0&&m.filter(FORM_WHO[F.who]).length*2>=m.length}
// a group's shape: soldiers abreast and ranks deep
function grpShape(g){const gr=B.groups[g],n=grpUnits(g).length;if(!gr||!n)return null;const F=FORMS[gr.form]||FORMS.line;
  if(F.ring||F.loop){const R=circleRings(n,gr.files,F,F.loop);return{files:R[0][1],ranks:R.length}}
  if(F.wedge){const W=gr.files||Infinity;let r=0,i=0;while(i<n){i+=Math.min(r+1,W);r++}return{files:Math.min(n,r,W),ranks:r}}if(F.col){const a=Math.min(n,Math.max(1,gr.files||1)*F.cw);return{files:a,ranks:Math.ceil(n/a)}}const w=Math.max(1,Math.min(n,gr.files||F.files));return{files:w,ranks:Math.ceil(n/w)}}
// the slots of n soldiers in formation f, facing a (radians), files wide: positions relative to its anchor (its middle)
/* a circle's rings for n men, files the outer ring's places: [radius, men] each, the outermost first. The outer ring files × gx
   round (CIRCLE.minR its least radius, as many places as that holds at least); each next a rank gy further in, holding as many as
   fit at gx apart; one under gx/2 round, a man in the middle. Files past its men: one ring, its men spread evenly, with gaps. Too
   few files to hold them all: as few more as do. one: all on one ring (a Cantabrian loop, CANTABRIAN.minR round at least) */
function circleRings(n,files,F,one){
  const lay=f=>{const R0=Math.max(one?CANTABRIAN.minR:CIRCLE.minR,f*F.gx/(2*Math.PI)),out=[];let left=n;
    for(let k=0,R=R0;left>0;k++,R-=F.gy){if(k&&one)return null;if(R<F.gx/2){if(left>1)return null;out.push([0,1]);break}
      const c=Math.min(left,k?Math.floor(2*Math.PI*R/F.gx):Math.max(f,Math.floor(2*Math.PI*R0/F.gx)));out.push([R,c]);left-=c}return out};
  for(let f=Math.max(1,files||F.files);;f++){const L=lay(f);if(L)return L}
}
function formSlots(f,n,a,files,space=1){
  const F=FORMS[f]||FORMS.line,out=[];if(n<=0)return out;
  // (a circle, a loop: about its middle, each ring's men evenly round it, every other ring turned half a place)
  if(F.ring||F.loop){const ca=Math.cos(a),sa=Math.sin(a);
    circleRings(n,files,F,F.loop).forEach(([R,c],k)=>{for(let j=0;j<c;j++){const t=(j+(k%2)*.5)*2*Math.PI/c,x=R*Math.cos(t),y=R*Math.sin(t);out.push([(x*ca-y*sa)*space,(x*sa+y*ca)*space])}});return out}
  if(F.wedge){const W=files||Infinity;let r=0,i=0;while(i<n){const k=Math.min(r+1,W,n-i);for(let j=0;j<k;j++)out.push([-r*F.gy,(j-(k-1)/2)*F.gx]);i+=k;r++}}
  else if(F.col){const k=Math.max(1,Math.min(Math.ceil(n/F.cw),files||1)),a=k*F.cw,at=j=>Math.floor(j/F.cw)*(F.cw+1)+j%F.cw;// (at: a file's place across, a gap after each column's)
    for(let i=0;i<n;i++){const r=Math.floor(i/a),rowN=Math.min(a,n-r*a);out.push([-r*F.gy,(at(i%a)-at(rowN-1)/2)*F.gx])}}
  else if(F.pack){const w=Math.max(1,Math.min(n,files||F.files));for(let i=0;i<n;i++){const r=Math.floor(i/w),c=i%w,rowN=Math.min(w,n-r*w);out.push([-r*F.gy+((i*37)%11-5)*1.6,(c-(rowN-1)/2+(r%2)*.5)*F.gx+((i*53)%9-4)*1.5])}}
  else{const w=Math.max(1,Math.min(n,files||F.files));for(let i=0;i<n;i++){const r=Math.floor(i/w),c=i%w,rowN=Math.min(w,n-r*w);out.push([-r*F.gy,(c-(rowN-1)/2)*F.gx])}}
  const mr=out.reduce((s,p)=>s+p[0],0)/out.length,ca=Math.cos(a),sa=Math.sin(a);
  return out.map(([fx,lat])=>{const x=fx-mr;return[(x*ca-lat*sa)*space,(x*sa+lat*ca)*space]});
}
// lay a group's soldiers into its formation: its slots to its men by the least walking in all (core/assign.js SLOTFILL), its
// characters and its men at grips keeping theirs (each the free slot nearest his: kept, slotKept, till his fight is over:
// battlecontrol.js refill); SLOTFILL off: front slots first, each to the nearest soldier still free. A Cantabrian loop's turned as
// far as it has ridden (spin: battlecontrol.js loop)
function layForm(g){
  const gr=B.groups[g],m=grpUnits(g);if(!gr||!m.length)return;const S=formSlots(gr.form||'line',m.length,(gr.face||0)+(gr.spin||0),gr.files,B.world?WORLD_BATTLE.sprite:1),free=m.slice();
  if(SLOTFILL.on)return fillForm(gr,m,S);
  for(const [sx,sy] of S){let bi=0,bd=1e9;free.forEach((u,i)=>{const d=Math.hypot(u.x-(gr.ax+sx),u.y-(gr.ay+sy));if(d<bd){bd=d;bi=i}});const u=free.splice(bi,1)[0];u.sx=sx;u.sy=sy}
}
// (a man at grips: standing, a foe standing on the field within his reach and grips px more (beastmind.js atGrips's measure; a big
// one's body more); foes: his group's foes, fillFoes)
const FILL_GRIPS=10;
const fillFoes=team=>B.units.filter(e=>e.hp>0&&!e.left&&!e.rout&&battleEnemy(team,e));
function fillEngaged(u,foes){if(u.rout||u.hp<=0)return false;const r=(u.s.reach||11)+FILL_GRIPS;for(const e of foes)if(Math.hypot(e.x-u.x,e.y-u.y)<r+(e.s.big?12:0))return true;return false}
// (m: its men, S: its slots; the kept first, by id, each the free slot nearest his own; the rest by the least walking, by id)
function fillForm(gr,m,S){
  const foes=fillFoes(gr.team),keep=[],free=[],taken=new Uint8Array(S.length);
  for(const u of m)(u.sx!=null&&(isChar(u)||fillEngaged(u,foes))?keep:free).push(u);keep.sort((a,b)=>a.id-b.id);free.sort((a,b)=>a.id-b.id);
  for(const u of keep){let bj=-1,bd=Infinity;S.forEach(([x,y],j)=>{const d=(x-u.sx)**2+(y-u.sy)**2;if(!taken[j]&&d<bd){bd=d;bj=j}});if(bj<0){free.push(u);continue}taken[bj]=1;
    if(!isChar(u)&&bd>.25)u.slotKept=true;else if(u.slotKept)delete u.slotKept}
  const F=fillRoom(S.length);let k=0;const at=[];S.forEach(([x,y],j)=>{if(taken[j])return;F.px[k]=gr.ax+x;F.py[k]=gr.ay+y;at.push(j);k++});
  free.forEach((u,i)=>{F.mx[i]=u.x;F.my[i]=u.y});assignSlots(free.length,k);
  free.forEach((u,i)=>{const j=F.out[i];if(j<0)return;[u.sx,u.sy]=S[at[j]];if(u.slotKept)delete u.slotKept});
}
// what a group's formation does to a blow on one of its soldiers (src: the attacker, or an arrow's origin)
// a shield: missiles that hit its bearer's front do SHIELD_ARROWS of their damage
const SHIELD_ARROWS=.7;
const shieldMul=(t,src)=>src&&src.arrow&&t.s&&tagsOf(t.s).includes('shield')&&B&&sideOf(t,src)==='front'?SHIELD_ARROWS:1;
function formTaken(t,src){
  let k=shieldMul(t,src);const g=t.grp&&B.groups[t.grp];
  if(src&&g&&shieldWallActive(t)){const a=Math.atan2(src.y-t.y,src.x-t.x);if(angGap(a,g.face||0)<1.05)k*=WALL.front}
  return k;
}
// a charge's bonus (morale.js chargeMul: 1+bonus*this), by the charger's formation (a wedge) and the depth of the block it hits
// (side: where it lands, sideOf; depth never blunts a charge from behind)
const formCharge=(att,t,side)=>{const m=att.s.charge&&att.grp?wedgeMembers(att.grp):[],sh=side!=='rear'&&t.grp&&B.groups[t.grp]&&grpShape(t.grp);return (1+(m.includes(att)?wedgeBonus(m.length):0))*(sh&&sh.ranks>=DEPTH.ranks?DEPTH.charge:1)};
// Only an individually supported shield-wall soldier pays the ability's speed cost; a circle's every man its slow walk (CIRCLE.spd).
const formPace=u=>(shieldWallActive(u)?WALL.spd:1)*(u.grp&&B.groups[u.grp]?.form==='circle'?CIRCLE.spd:1);
/* a man of a formed circle (sideOf: every blow on his front; facing: out): his group's form a circle, not charging nor withdrawing,
   he standing in the fight (not running) within CIRCLE.near px of his place round where its men stand (their median: ringAt, once
   a moment, so a circle on the move is still one); ringFace: the way he faces, out from its middle (its man in the middle, its front) */
const RING_AT=new WeakMap();
function ringAt(g){let a=RING_AT.get(g);if(a&&a.t===B.t&&a.U===B.units)return a;const m=grpUnits(g.id).filter(u=>!u.rout&&u.sx!=null),med=v=>v.sort((p,q)=>p-q)[v.length>>1];
  a={t:B.t,U:B.units,x:m.length?med(m.map(u=>u.x-u.sx)):g.ax,y:m.length?med(m.map(u=>u.y-u.sy)):g.ay};RING_AT.set(g,a);return a}
function ringed(u){const g=u&&u.grp&&B.groups[u.grp];if(!g||g.form!=='circle'||u.rout||u.hp<=0||u.sx==null||g.order==='charge'||g.order==='withdraw')return false;
  const a=ringAt(g);return Math.hypot(u.x-a.x-u.sx,u.y-a.y-u.sy)<=CIRCLE.near*(B.world?WORLD_BATTLE.sprite:1)}
const ringFace=u=>Math.hypot(u.sx,u.sy)>.5?Math.atan2(u.sy,u.sx):B.groups[u.grp].face||0;
// (should an AI captain ring this foot group, its men m standing (CIRCLE.ai): most of them spears, riders about it from more than one
// side; kept: ringed already, so they may be a little further off)
function ringWanted(id,m,foes,kept){if(!m.length||!formFits(id,'circle')||m.filter(u=>unitClass(u.s)==='spear').length*2<m.length)return false;
  const n=m.length,cx=m.reduce((a,u)=>a+u.x,0)/n,cy=m.reduce((a,u)=>a+u.y,0)/n,r=CIRCLE.aiNear*(kept?CIRCLE.aiKeep:1)*(B.world?WORLD_BATTLE.sprite:1),at=[];
  for(const e of foes)if(e.s.charge&&!e.rout&&Math.hypot(e.x-cx,e.y-cy)<r)at.push(Math.atan2(e.y-cy,e.x-cx));
  return at.some((p,i)=>at.some((q,j)=>j>i&&angGap(p,q)>=CIRCLE.aiSides))}

// an order to charge breaks a shield wall
function breakWall(g){const gr=B.groups[g];if(gr&&gr.shieldWall){gr.setFlag('shieldWall',false);toast(htmlText(groupName(g))+' lower their shield wall.')}}
// a charge, an attack or a withdrawal breaks a circle or a Cantabrian loop into a line
function breakRing(g){const gr=B.groups[g];if(!gr||!RING_FORMS.includes(gr.form))return;const was=FORMS[gr.form].n.toLowerCase();gr.setForm('line');if(gr.player&&!aiHas(gr))toast(htmlText(groupName(g))+' break their '+was+'.')}
// Turn toward a plain move, including short repositioning. Ignore only effectively zero displacement;
// explicit dragged facing bypasses this helper in BattleControl.moveTo.
function faceToward(g,x,y){const gr=B.groups[g],m=grpUnits(g);if(!m.length)return;const cx=m.reduce((a,u)=>a+u.x,0)/m.length,cy=m.reduce((a,u)=>a+u.y,0)/m.length;if(Math.hypot(x-cx,y-cy)>.01)gr.setForm(gr.form||'line',{face:Math.atan2(y-cy,x-cx),files:gr.files})}
// a line dragged from (x0,y0) to (x1,y1): the selection along it, shared by their numbers, facing the left of the drag.
// Each is as wide as its share of the line (and so as deep as its numbers make it); a wedge as wide at its back, a column as many
// columns as fit.
// Your hero shares the line as a one-person group, like a companion; preview and placement use this same plan.
// (a column: how many columns the line holds, each cw files and a file's gap; a circle or a loop: the line its width across, its
// outer ring the places round it (CIRCLE.gaps × its men at most))
function dragFiles(f,n,seg,space=B?.world?WORLD_BATTLE.sprite:1){const F=FORMS[f]||FORMS.line;if(F.drag==='fixed')return null;
  if(F.ring||F.loop)return Math.max(1,Math.min(n*CIRCLE.gaps,Math.round(Math.PI*seg/(F.gx*space))));
  if(F.col)return Math.max(1,Math.min(Math.ceil(n/F.cw),Math.round((seg/(F.gx*space)+1)/(F.cw+1))));return Math.max(1,Math.min(n,Math.round(seg/(F.gx*space))+1))}
function formPlan(x0,y0,x1,y1){
  const gs=selGroups().filter(g=>grpUnits(g).length&&!B.groups[g].resolve?.routed),L=Math.hypot(x1-x0,y1-y0);if(!gs.length||L<FORM_DRAG)return[];
  if(gs.length>1&&keepFormOn())return GroupBlock.of(gs).lineAt(x0,y0,x1,y1);// (keep formation: the line is the block's new front)
  const ux=(x1-x0)/L,uy=(y1-y0)/L;
  // (its front on the left of the drag, as in Total War: dragged down they face right, up left, left to right up, right to left down)
  const face=Math.atan2(-ux,uy),tot=gs.reduce((a,g)=>a+grpUnits(g).length,0);let s=0;
  return gs.map(g=>{const n=grpUnits(g).length,seg=L*n/tot,c=s+seg/2;s+=seg;
    return{g,...(g==='hero'?{hero:true}:{}),ax:clamp(x0+ux*c,8,BW-8),ay:clamp(y0+uy*c,fieldTop(),fieldBot()),face,files:g==='hero'?null:dragFiles(B.groups[g].form||'line',n,seg)}});
}
/* keep formation (the order bar's toggle, Shift+K, on by default: commands.js toggleKeepForm): two or more groups sent as one
   block, as Total War's formation lock. The block: its centre (the groups' places, ax/ay, so men lagging behind do not drag it),
   its facing (theirs, averaged) and each group's part in it (fwd: ahead of the centre, lat: to its right, rel: its own facing off
   the block's). A right-click turns it toward where it is sent (further than turn px; nearer, it keeps its facing); a drag makes
   the line its new front: the groups within rank px of its front share the line by their numbers, as a drag does; the rest keep
   their files and their places behind, spread as the front is and set back (or up) as its depth changed, the gap behind its back
   rank kept. turn, rank: at the
   desktop field's scale (a world battle's: WORLD_BATTLE.sprite times) */
const KEEPFORM={turn:40,rank:24};
const keepFormOn=()=>typeof prefGet==='function'&&!!prefGet('keepform');
class GroupBlock{
  // at: a group's place and facing ({x, y, face}; its ax, ay, face by default; a Shift-queue's, its last waypoint's)
  constructor(gs,at){at=at||(g=>{const gr=B.groups[g];return{x:gr.ax,y:gr.ay,face:gr.face||0}});
    const P=gs.map(g=>({g,...at(g)})),n=P.length||1,s=P.reduce((a,p)=>a+Math.sin(p.face),0),c=P.reduce((a,p)=>a+Math.cos(p.face),0);
    this.x=P.reduce((a,p)=>a+p.x,0)/n;this.y=P.reduce((a,p)=>a+p.y,0)/n;this.face=Math.hypot(s,c)>1e-6?Math.atan2(s,c):P[0]?P[0].face:0;
    const ca=Math.cos(this.face),sa=Math.sin(this.face);
    this.parts=P.map(p=>{const dx=p.x-this.x,dy=p.y-this.y;return{g:p.g,fwd:dx*ca+dy*sa,lat:dy*ca-dx*sa,rel:p.face-this.face}})}
  static of(gs,at){return new GroupBlock(gs,at)}
  static get sp(){return B&&B.world?WORLD_BATTLE.sprite:1}
  // its facing marching to (x,y): toward it, or as it is when that is near
  faceTo(x,y){return Math.hypot(x-this.x,y-this.y)>KEEPFORM.turn*GroupBlock.sp?Math.atan2(y-this.y,x-this.x):this.face}
  // each group's place with the block's centre at (x,y), facing face: [{g, ax, ay, face}]
  placeAt(x,y,face){const ca=Math.cos(face),sa=Math.sin(face);
    return GroupBlock.fit(this.parts.map(p=>({g:p.g,ax:x+p.fwd*ca-p.lat*sa,ay:y+p.fwd*sa+p.lat*ca,face:face+p.rel})))}
  // a line dragged from (x0,y0) to (x1,y1) as its front, facing the left of the drag (formPlan's plan: {g, hero, ax, ay, face, files})
  lineAt(x0,y0,x1,y1){
    const L=Math.hypot(x1-x0,y1-y0),ux=(x1-x0)/L,uy=(y1-y0)/L,face=Math.atan2(-ux,uy),ca=Math.cos(face),sa=Math.sin(face),sp=GroupBlock.sp;
    const top=Math.max(...this.parts.map(p=>p.fwd)),front=this.parts.filter(p=>p.fwd>=top-KEEPFORM.rank*sp).sort((a,b)=>a.lat-b.lat),tot=front.reduce((a,p)=>a+grpUnits(p.g).length,0);
    // (a group's slots files wide, facing ahead: how far back of its place they reach, and their sides)
    const box=(g,files)=>{const S=g==='hero'?[[0,0]]:formSlots(B.groups[g].form||'line',grpUnits(g).length,0,files,sp);return{back:-Math.min(...S.map(s=>s[0])),lo:Math.min(...S.map(s=>s[1])),hi:Math.max(...S.map(s=>s[1]))}};
    const out=[],tag=g=>g==='hero'?{hero:true}:{};let s=0,deeper=-Infinity,lo=Infinity,hi=-Infinity;
    for(const p of front){const g=p.g,n=grpUnits(g).length,seg=L*n/tot,c=s+seg/2,files=g==='hero'?null:dragFiles(B.groups[g].form||'line',n,seg),was=box(g,B.groups[g].files);s+=seg;
      deeper=Math.max(deeper,box(g,files).back-was.back);lo=Math.min(lo,p.lat+was.lo);hi=Math.max(hi,p.lat+was.hi);out.push({g,...tag(g),ax:x0+ux*c,ay:y0+uy*c,face,files})}
    // (the rest: as far behind the front as they were, plus what it gained (or lost) in depth; their sides spread as its width changed)
    const mx=(x0+x1)/2,my=(y0+y1)/2,mid=(lo+hi)/2,k=hi-lo>1?L/(hi-lo):1;
    for(const p of this.parts)if(!front.includes(p)){const f=p.fwd-top-deeper,l=(p.lat-mid)*k;out.push({g:p.g,...tag(p.g),ax:mx+f*ca-l*sa,ay:my+f*sa+l*ca,face:face+p.rel,files:B.groups[p.g].files})}
    return GroupBlock.fit(out)}
  // on the field; deploying, the block moved whole into your zone as far as it fits, then each group into it (deploy.js inZone)
  static fit(ps){
    if(B.deploy&&ps.length){const Z=deployZone(),by=(v,a,b)=>{const lo=Math.min(...v),hi=Math.max(...v);return hi-lo>b-a?(a+b-lo-hi)/2:lo<a?a-lo:hi>b?b-hi:0};
      const dx=by(ps.map(p=>p.ax),Z.x0,Z.x1),dy=by(ps.map(p=>p.ay),Z.y0,Z.y1);for(const p of ps){const q=inZone(p.ax+dx,p.ay+dy);p.ax=q.x;p.ay=q.y}}
    for(const p of ps){p.ax=clamp(p.ax,8,BW-8);p.ay=clamp(p.ay,fieldTop(),fieldBot())}return ps}
}
// World ghosts scale with the battle sprites and their slot spacing.
// the ghost of a dragged line: each soldier's slot, faint, and an arrow the way they will face. On a phone or a small window
// (GHOST.mq) it is drawn bold in screen terms, so it reads at the whole field's zoom: the line, dots and arrow in CSS px (line,
// dot, arrow), brighter, over a dark edge; a dot never wider than most of its slot's spacing. A circle or a loop: its ring round
// its men too, so its size reads as it is dragged. It only draws: no state changes
const ghostRing=(p,S)=>!p.hero&&RING_FORMS.includes(B.groups[p.g].form)?Math.max(...S.map(([x,y])=>Math.hypot(x,y))):0;
const GHOST={mq:typeof matchMedia==='function'?matchMedia('(pointer:coarse),(max-height:600px),(max-width:820px)'):null,line:3,dot:5,arrow:22};
function drawFormGhost(){
  const d=B.rdrag;if(!d||Math.hypot(d.x1-d.x0,d.y1-d.y0)<FORM_DRAG)return;const plan=formPlan(d.x0,d.y0,d.x1,d.y1),scale=B.world?WORLD_BATTLE.sprite:1,dot=4*scale;
  if(!(GHOST.mq&&GHOST.mq.matches)){
    ctx.strokeStyle='rgba(232,185,74,.7)';ctx.lineWidth=scale;ctx.beginPath();ctx.moveTo(d.x0,d.y0);ctx.lineTo(d.x1,d.y1);ctx.stroke();
    for(const p of plan){const gr=B.groups[p.g],S=p.hero?[[0,0]]:formSlots(gr.form||'line',grpUnits(p.g).length,p.face,p.files,B.world?WORLD_BATTLE.sprite:1);
      ctx.fillStyle='rgba(232,185,74,.8)';for(const [sx,sy] of S)ctx.fillRect(Math.round(p.ax+sx)-dot/2,Math.round(p.ay+sy)-dot/2,dot,dot);
      ctx.strokeStyle='rgba(232,185,74,.8)';{const r=ghostRing(p,S);if(r){ctx.beginPath();ctx.arc(p.ax,p.ay,r,0,2*Math.PI);ctx.stroke()}}ctx.beginPath();ctx.moveTo(p.ax,p.ay);ctx.lineTo(p.ax+Math.cos(p.face)*14*scale,p.ay+Math.sin(p.face)*14*scale);ctx.stroke()}
    ctx.lineWidth=1;return}
  // (k: field units to a CSS px at this zoom; every size at least what the desktop draws)
  const r=cv.getBoundingClientRect(),k=cv.width/Math.max(1,r.width)/(B.world?VS:bview().k)/(B.cam?B.cam.z:1),lw=Math.max(scale,GHOST.line*k),ek=Math.max(1,k),gold='rgba(255,214,110,.95)',dark='rgba(10,12,18,.6)';
  const seg=(x0,y0,x1,y1)=>{ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke()};ctx.lineCap='round';
  ctx.strokeStyle=dark;ctx.lineWidth=lw+2*ek;seg(d.x0,d.y0,d.x1,d.y1);ctx.strokeStyle=gold;ctx.lineWidth=lw;seg(d.x0,d.y0,d.x1,d.y1);
  const ghosts=plan.map(p=>{const f=B.groups[p.g].form||'line',F=FORMS[f]||FORMS.line,S=p.hero?[[0,0]]:formSlots(f,grpUnits(p.g).length,p.face,p.files,B.world?WORLD_BATTLE.sprite:1);
    return{p,S,s:Math.max(dot,Math.min(GHOST.dot*k,Math.min(F.gx,F.gy)*scale*.7))}});
  ctx.fillStyle=dark;for(const {p,S,s} of ghosts){const o=s/2+ek;for(const [sx,sy] of S)ctx.fillRect(Math.round(p.ax+sx)-o,Math.round(p.ay+sy)-o,2*o,2*o)}
  ctx.fillStyle=gold;for(const {p,S,s} of ghosts)for(const [sx,sy] of S)ctx.fillRect(Math.round(p.ax+sx)-s/2,Math.round(p.ay+sy)-s/2,s,s);
  for(const {p,S} of ghosts){const r=ghostRing(p,S);if(!r)continue;for(const [c,w] of [[dark,lw+2*ek],[gold,lw]]){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.arc(p.ax,p.ay,r,0,2*Math.PI);ctx.stroke()}}
  // (the facing: an arrow with a head, over its dark edge)
  for(const {p} of ghosts){const L=Math.max(14*scale,GHOST.arrow*k),c=Math.cos(p.face),sn=Math.sin(p.face),hx=p.ax+c*L,hy=p.ay+sn*L,h=Math.max(4,L*.35);
    const head=()=>{seg(hx,hy,hx-c*h-sn*h*.6,hy-sn*h+c*h*.6);seg(hx,hy,hx-c*h+sn*h*.6,hy-sn*h-c*h*.6)};
    ctx.strokeStyle=dark;ctx.lineWidth=lw+2*ek;seg(p.ax,p.ay,hx,hy);head();ctx.strokeStyle=gold;ctx.lineWidth=lw;seg(p.ax,p.ay,hx,hy);head()}
  ctx.lineCap='butt';ctx.lineWidth=1;
}
// a formation's icon: its own slots, drawn small (shields for the wall), facing up
function formIcon(f,w,h){
  w=w||22;h=h||14;const F=FORMS[f],n=F.wedge?10:12,S=formSlots(f,n,-Math.PI/2,F.wedge?null:F.ring||F.loop?n:6),xs=S.map(p=>p[0]),ys=S.map(p=>p[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),k=Math.min((w-4)/Math.max(1,x1-x0),(h-4)/Math.max(1,y1-y0),.35);
  const dots=S.map(([x,y])=>{const px=(w/2+(x-(x0+x1)/2)*k).toFixed(1),py=(h/2+(y-(y0+y1)/2)*k).toFixed(1);
    return f==='wall'?'<rect x="'+(px-1.5)+'" y="'+(py-1.5)+'" width="3" height="3" fill="currentColor"/>':'<circle cx="'+px+'" cy="'+py+'" r="1.3" fill="currentColor"/>'}).join('');
  return '<svg class="ficon" data-ui-formation="'+f+'" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'" aria-hidden="true"><defs><linearGradient id="formation-metal-'+f+'" x2="0" y2="1"><stop stop-color="#ffe0a0"/><stop offset=".45" stop-color="#c39a4b"/><stop offset="1" stop-color="#72552e"/></linearGradient></defs>'+dots.replace(/fill="currentColor"/g,'fill="url(#formation-metal-'+f+')" stroke="#3f3220" stroke-width=".35"')+'</svg>';
}
