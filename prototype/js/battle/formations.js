'use strict';
/* ---------- formations: how a group stands. Every group (yours, and the enemy's) keeps its soldiers in slots laid out in ranks
   and files across the way it faces. Its width and depth are the line you drag (right-click and drag: where it runs, how wide,
   which way it faces; wide makes a long thin line, short a deep block or a column); a plain right-click keeps its width and turns
   it toward where it marches. Its formation is how the men stand in that shape: a line, or, for the troops it suits,
   loose order (foot) or a wedge (cavalry). Shield wall is a capability-filtered ability, not a formation. A block 4 or more ranks deep blunts a charge. ---------- */
// files: soldiers abreast (until a line is dragged); gx, gy: spacing across and back (px).
// who: the troops it suits (FORM_WHO); key: its key; drag: fixed (its own shape: a dragged line sets only where and which way)
const FORMS={
  line:{n:'Line',files:8,gx:14,gy:13,d:'Ranks across the front, as wide as you drag the line.'},
  loose:{n:'Loose',files:8,gx:24,gy:22,who:'foot',key:'L',d:'Wider spacing only; no direct damage bonus or penalty.'},
  wedge:{n:'Wedge',wedge:true,gx:13,gy:12,drag:'fixed',who:'cav',key:'T',d:'Cavalry spearhead: 6 formed cavalry give +5% charge, +2.5 percentage points per additional rider, capped at +30% at 16. Scattered or routing riders do not count.'},
  // (beasts: no ranks, a ragged clump files wide, each beast off its place by a fixed jitter, beastmind.js; never one of yours to pick: FORM_ORDER)
  pack:{n:'Pack',pack:true,files:5,gx:17,gy:15,drag:'fixed',who:'beast',d:'Beasts keep no ranks: a loose, ragged spread.'}
};
const FORM_ORDER=['line','loose','wedge'],FORM_PICK=['loose','wedge'];
const WALL={near:16,front:.65,spd:.6},WEDGE={min:6,start:.05,step:.025,cap:.3,slot:28};
const shieldEligible=u=>!!(u.s&&!u.s.range&&!u.s.mounted&&!u.s.charge&&tagsOf(u.s).includes('shield'));
// Group flags request actions; each soldier must have the capability.
const flagEligible=(u,f)=>f==='shieldWall'?shieldEligible(u):['melee','cease','skirmish'].includes(f)?!!u.s.range:true;
const unitFlag=(u,f)=>!!(u.grp&&B.groups[u.grp]&&B.groups[u.grp][f]&&flagEligible(u,f));
// (no shield wall in woods, a ford or deep water, nor riders in the wedge there: they break formations, terrain.js groundThin)
function wallReady(u){const g=u.grp&&B.groups[u.grp];return !!(unitFlag(u,'shieldWall')&&g.walk&&!g.run&&u.hp>0&&!u.rout&&!(u.stun>0)&&g.order!=='charge'&&g.order!=='withdraw'&&!groundThin(u))}
function shieldWallActive(u){return wallReady(u)&&B.units.some(o=>o!==u&&o.team===u.team&&wallReady(o)&&Math.hypot(o.x-u.x,o.y-u.y)<=WALL.near&&angGap(B.groups[o.grp].face||0,B.groups[u.grp].face||0)<1.05)}
function wedgeMembers(g){
  const gr=B.groups[g];if(!gr||gr.form!=='wedge')return [];
  const m=grpUnits(g).filter(u=>!u.rout&&!withdrawing(u)&&u.s.charge&&!(u.stun>0)&&!groundThin(u));if(!m.length)return [];
  // Inferred median anchors reject distant stragglers while allowing the wedge to move.
  const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)],x=median(m.map(u=>u.x-(u.sx||0))),y=median(m.map(u=>u.y-(u.sy||0)));
  return m.filter(u=>Math.hypot(u.x-x-(u.sx||0),u.y-y-(u.sy||0))<=WEDGE.slot&&angGap(u.dir??gr.face,gr.face||0)<1.05);
}
const wedgeBonus=n=>n<WEDGE.min?0:Math.min(WEDGE.cap,WEDGE.start+(n-WEDGE.min)*WEDGE.step);
const FORM_WHO={melee:u=>!u.s.range&&!u.s.charge,shield:u=>!u.s.range&&!u.s.mounted&&tagsOf(u.s).includes('shield'),foot:u=>!u.s.mounted,cav:u=>!!u.s.charge,beast:u=>!!(u.s.beast||u.s.big)},WHO_N={melee:'melee infantry',shield:'shielded infantry',foot:'foot troops',cav:'cavalry',beast:'beasts'};
const DEPTH={ranks:4,charge:.7};// a block this many ranks deep takes a charge's bonus at this much of its force (not from behind)
const FORM_DRAG=8;// a right-click dragged further than this lays out a line
// does formation f suit group g (most of its soldiers are of the kind it is for)
function formFits(g,f){const F=FORMS[f];if(!F)return false;if(!F.who)return true;if(g==='hero')return false;const m=grpUnits(g);return m.length>0&&m.filter(FORM_WHO[F.who]).length*2>=m.length}
// a group's shape: soldiers abreast and ranks deep
function grpShape(g){const gr=B.groups[g],n=grpUnits(g).length;if(!gr||!n)return null;const F=FORMS[gr.form]||FORMS.line;
  if(F.wedge){let r=0,i=0;while(i<n){i+=r+1;r++}return{files:Math.min(n,r),ranks:r}}const w=Math.max(1,Math.min(n,gr.files||F.files));return{files:w,ranks:Math.ceil(n/w)}}
// the slots of n soldiers in formation f, facing a (radians), files wide: positions relative to its anchor (its middle)
function formSlots(f,n,a,files,space=1){
  const F=FORMS[f]||FORMS.line,out=[];if(n<=0)return out;
  if(F.wedge){let r=0,i=0;while(i<n){const k=Math.min(r+1,n-i);for(let j=0;j<k;j++)out.push([-r*F.gy,(j-(k-1)/2)*F.gx]);i+=k;r++}}
  else if(F.pack){const w=Math.max(1,Math.min(n,files||F.files));for(let i=0;i<n;i++){const r=Math.floor(i/w),c=i%w,rowN=Math.min(w,n-r*w);out.push([-r*F.gy+((i*37)%11-5)*1.6,(c-(rowN-1)/2+(r%2)*.5)*F.gx+((i*53)%9-4)*1.5])}}
  else{const w=Math.max(1,Math.min(n,files||F.files));for(let i=0;i<n;i++){const r=Math.floor(i/w),c=i%w,rowN=Math.min(w,n-r*w);out.push([-r*F.gy,(c-(rowN-1)/2)*F.gx])}}
  const mr=out.reduce((s,p)=>s+p[0],0)/out.length,ca=Math.cos(a),sa=Math.sin(a);
  return out.map(([fx,lat])=>{const x=fx-mr;return[(x*ca-lat*sa)*space,(x*sa+lat*ca)*space]});
}
// lay a group's soldiers into its formation: front slots first, each to the nearest soldier still free
function layForm(g){
  const gr=B.groups[g],m=grpUnits(g);if(!gr||!m.length)return;const S=formSlots(gr.form||'line',m.length,gr.face||0,gr.files,B.world?WORLD_BATTLE.sprite:1),free=m.slice();
  for(const [sx,sy] of S){let bi=0,bd=1e9;free.forEach((u,i)=>{const d=Math.hypot(u.x-(gr.ax+sx),u.y-(gr.ay+sy));if(d<bd){bd=d;bi=i}});const u=free.splice(bi,1)[0];u.sx=sx;u.sy=sy}
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
// Only an individually supported shield-wall soldier pays the ability's speed cost.
const formPace=u=>shieldWallActive(u)?WALL.spd:1;

// an order to charge breaks a shield wall
function breakWall(g){const gr=B.groups[g];if(gr&&gr.shieldWall){gr.setFlag('shieldWall',false);toast(htmlText(groupName(g))+' lower their shield wall.')}}
// Turn toward a plain move, including short repositioning. Ignore only effectively zero displacement;
// explicit dragged facing bypasses this helper in BattleControl.moveTo.
function faceToward(g,x,y){const gr=B.groups[g],m=grpUnits(g);if(!m.length)return;const cx=m.reduce((a,u)=>a+u.x,0)/m.length,cy=m.reduce((a,u)=>a+u.y,0)/m.length;if(Math.hypot(x-cx,y-cy)>.01)gr.setForm(gr.form||'line',{face:Math.atan2(y-cy,x-cx),files:gr.files})}
// a line dragged from (x0,y0) to (x1,y1): the selection along it, shared by their numbers, facing the left of the drag.
// Each is as wide as its share of the line (and so as deep as its numbers make it); a wedge keeps its shape.
// Your hero shares the line as a one-person group, like a companion; preview and placement use this same plan.
function dragFiles(f,n,seg){const F=FORMS[f]||FORMS.line;return F.drag==='fixed'?null:Math.max(1,Math.min(n,Math.round(seg/(F.gx*(B?.world?WORLD_BATTLE.sprite:1)))+1))}
function formPlan(x0,y0,x1,y1){
  const gs=selGroups().filter(g=>grpUnits(g).length&&!B.groups[g].resolve?.routed),L=Math.hypot(x1-x0,y1-y0);if(!gs.length||L<FORM_DRAG)return[];
  const ux=(x1-x0)/L,uy=(y1-y0)/L;
  // (its front on the left of the drag, as in Total War: dragged down they face right, up left, left to right up, right to left down)
  const face=Math.atan2(-ux,uy),tot=gs.reduce((a,g)=>a+grpUnits(g).length,0);let s=0;
  return gs.map(g=>{const n=grpUnits(g).length,seg=L*n/tot,c=s+seg/2;s+=seg;
    return{g,...(g==='hero'?{hero:true}:{}),ax:clamp(x0+ux*c,8,BW-8),ay:clamp(y0+uy*c,fieldTop(),fieldBot()),face,files:g==='hero'?null:dragFiles(B.groups[g].form||'line',n,seg)}});
}
// the ghost of a dragged line: each soldier's slot, faint, and an arrow the way they will face. On a phone or a small window
// (GHOST.mq) it is drawn bold in screen terms, so it reads at the whole field's zoom: the line, dots and arrow in CSS px (line,
// dot, arrow), brighter, over a dark edge; a dot never wider than most of its slot's spacing. It only draws: no state changes
const GHOST={mq:typeof matchMedia==='function'?matchMedia('(pointer:coarse),(max-height:600px),(max-width:820px)'):null,line:3,dot:5,arrow:22};
function drawFormGhost(){
  const d=B.rdrag;if(!d||Math.hypot(d.x1-d.x0,d.y1-d.y0)<FORM_DRAG)return;const plan=formPlan(d.x0,d.y0,d.x1,d.y1);
  if(!(GHOST.mq&&GHOST.mq.matches)){
    ctx.strokeStyle='rgba(232,185,74,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(d.x0,d.y0);ctx.lineTo(d.x1,d.y1);ctx.stroke();
    for(const p of plan){const gr=B.groups[p.g],S=p.hero?[[0,0]]:formSlots(gr.form||'line',grpUnits(p.g).length,p.face,p.files,B.world?WORLD_BATTLE.sprite:1);
      ctx.fillStyle='rgba(232,185,74,.8)';for(const [sx,sy] of S)ctx.fillRect(Math.round(p.ax+sx)-2,Math.round(p.ay+sy)-2,4,4);
      ctx.strokeStyle='rgba(232,185,74,.8)';ctx.beginPath();ctx.moveTo(p.ax,p.ay);ctx.lineTo(p.ax+Math.cos(p.face)*14,p.ay+Math.sin(p.face)*14);ctx.stroke()}
    return}
  // (k: field units to a CSS px at this zoom; every size at least what the desktop draws)
  const r=cv.getBoundingClientRect(),k=cv.width/Math.max(1,r.width)/(B.world?VS:1)/(B.cam?B.cam.z:1),lw=Math.max(1,GHOST.line*k),ek=Math.max(1,k),gold='rgba(255,214,110,.95)',dark='rgba(10,12,18,.6)';
  const seg=(x0,y0,x1,y1)=>{ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke()};ctx.lineCap='round';
  ctx.strokeStyle=dark;ctx.lineWidth=lw+2*ek;seg(d.x0,d.y0,d.x1,d.y1);ctx.strokeStyle=gold;ctx.lineWidth=lw;seg(d.x0,d.y0,d.x1,d.y1);
  const ghosts=plan.map(p=>{const f=B.groups[p.g].form||'line',F=FORMS[f]||FORMS.line,S=p.hero?[[0,0]]:formSlots(f,grpUnits(p.g).length,p.face,p.files,B.world?WORLD_BATTLE.sprite:1);
    return{p,S,s:Math.max(4,Math.min(GHOST.dot*k,Math.min(F.gx,F.gy)*.7))}});
  ctx.fillStyle=dark;for(const {p,S,s} of ghosts){const o=s/2+ek;for(const [sx,sy] of S)ctx.fillRect(Math.round(p.ax+sx)-o,Math.round(p.ay+sy)-o,2*o,2*o)}
  ctx.fillStyle=gold;for(const {p,S,s} of ghosts)for(const [sx,sy] of S)ctx.fillRect(Math.round(p.ax+sx)-s/2,Math.round(p.ay+sy)-s/2,s,s);
  // (the facing: an arrow with a head, over its dark edge)
  for(const {p} of ghosts){const L=Math.max(14,GHOST.arrow*k),c=Math.cos(p.face),sn=Math.sin(p.face),hx=p.ax+c*L,hy=p.ay+sn*L,h=Math.max(4,L*.35);
    const head=()=>{seg(hx,hy,hx-c*h-sn*h*.6,hy-sn*h+c*h*.6);seg(hx,hy,hx-c*h+sn*h*.6,hy-sn*h-c*h*.6)};
    ctx.strokeStyle=dark;ctx.lineWidth=lw+2*ek;seg(p.ax,p.ay,hx,hy);head();ctx.strokeStyle=gold;ctx.lineWidth=lw;seg(p.ax,p.ay,hx,hy);head()}
  ctx.lineCap='butt';ctx.lineWidth=1;
}
// a formation's icon: its own slots, drawn small (shields for the wall), facing up
function formIcon(f,w,h){
  w=w||22;h=h||14;const F=FORMS[f],n=F.wedge?10:12,S=formSlots(f,n,-Math.PI/2,F.wedge?null:6),xs=S.map(p=>p[0]),ys=S.map(p=>p[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),k=Math.min((w-4)/Math.max(1,x1-x0),(h-4)/Math.max(1,y1-y0),.35);
  const dots=S.map(([x,y])=>{const px=(w/2+(x-(x0+x1)/2)*k).toFixed(1),py=(h/2+(y-(y0+y1)/2)*k).toFixed(1);
    return f==='wall'?'<rect x="'+(px-1.5)+'" y="'+(py-1.5)+'" width="3" height="3" fill="currentColor"/>':'<circle cx="'+px+'" cy="'+py+'" r="1.3" fill="currentColor"/>'}).join('');
  return '<svg class="ficon" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'" aria-hidden="true">'+dots+'</svg>';
}
