'use strict';
/* ---------- formations: how a group stands. Every group (yours, and the enemy's) keeps its soldiers in slots laid out in ranks
   and files across the way it faces. Its width and depth are the line you drag (right-click and drag: where it runs, how wide,
   which way it faces; wide makes a long thin line, short a deep block or a column); a plain right-click keeps its width and turns
   it toward where it marches. Its formation is how the men stand in that shape: a line, or, for the troops it suits, a shield
   wall (melee infantry), loose order (foot) or a wedge (cavalry). See FORMS. A block 4 or more ranks deep blunts a charge. ---------- */
// files: soldiers abreast (until a line is dragged); gx, gy: spacing across and back (px); spd: its pace; taken: damage it takes;
// front: from the front (within 60° of its facing); arrows: from arrows; chargeMul: its own charge; firm: holds its ground;
// who: the troops it suits (FORM_WHO); key: its key; drag: fixed (its own shape: a dragged line sets only where and which way)
const FORMS={
  line:{n:'Line',files:8,gx:14,gy:13,d:'Ranks across the front, as wide as you drag the line.'},
  wall:{n:'Shield wall',files:8,gx:11,gy:11,spd:.6,front:.65,firm:true,who:'shield',key:'B',d:'Shielded infantry: tight ranks, shields up: 35% less damage from the front, 40% slower, and they hold their ground. An order to charge breaks it.'},
  loose:{n:'Loose',files:8,gx:24,gy:22,arrows:.6,taken:1.1,who:'foot',key:'L',d:'Foot troops: spread out: 40% less damage from arrows, 10% more in melee.'},
  wedge:{n:'Wedge',wedge:true,gx:13,gy:12,chargeMul:1.3,drag:'fixed',who:'cav',key:'T',d:'Cavalry: a spearhead: its charge hits 30% harder. It keeps its shape: a dragged line sets only where it stands and which way it faces.'}
};
const FORM_ORDER=['line','wall','loose','wedge'],FORM_PICK=['wall','loose','wedge'];
const FORM_WHO={melee:u=>!u.s.range&&!u.s.charge,shield:u=>!u.s.range&&!u.s.mounted&&tagsOf(u.s).includes('shield'),foot:u=>!u.s.mounted,cav:u=>!!u.s.charge},WHO_N={melee:'melee infantry',shield:'shielded infantry',foot:'foot troops',cav:'cavalry'};
const DEPTH={ranks:4,charge:.7};// a block this many ranks deep takes a charge at this much of its force
const FORM_DRAG=8;// a right-click dragged further than this lays out a line
// does formation f suit group g (most of its soldiers are of the kind it is for)
function formFits(g,f){const F=FORMS[f];if(!F)return false;if(!F.who)return true;if(g==='hero')return false;const m=grpUnits(g);return m.length>0&&m.filter(FORM_WHO[F.who]).length*2>=m.length}
// a group's shape: soldiers abreast and ranks deep
function grpShape(g){const gr=B.groups[g],n=grpUnits(g).length;if(!gr||!n)return null;const F=FORMS[gr.form]||FORMS.line;
  if(F.wedge){let r=0,i=0;while(i<n){i+=r+1;r++}return{files:Math.min(n,r),ranks:r}}const w=Math.max(1,Math.min(n,gr.files||F.files));return{files:w,ranks:Math.ceil(n/w)}}
// the slots of n soldiers in formation f, facing a (radians), files wide: positions relative to its anchor (its middle)
function formSlots(f,n,a,files){
  const F=FORMS[f]||FORMS.line,out=[];if(n<=0)return out;
  if(F.wedge){let r=0,i=0;while(i<n){const k=Math.min(r+1,n-i);for(let j=0;j<k;j++)out.push([-r*F.gy,(j-(k-1)/2)*F.gx]);i+=k;r++}}
  else{const w=Math.max(1,Math.min(n,files||F.files));for(let i=0;i<n;i++){const r=Math.floor(i/w),c=i%w,rowN=Math.min(w,n-r*w);out.push([-r*F.gy,(c-(rowN-1)/2)*F.gx])}}
  const mr=out.reduce((s,p)=>s+p[0],0)/out.length,ca=Math.cos(a),sa=Math.sin(a);
  return out.map(([fx,lat])=>{const x=fx-mr;return[x*ca-lat*sa,x*sa+lat*ca]});
}
// lay a group's soldiers into its formation: front slots first, each to the nearest soldier still free
function layForm(g){
  const gr=B.groups[g],m=grpUnits(g);if(!gr||!m.length)return;const S=formSlots(gr.form||'line',m.length,gr.face||0,gr.files),free=m.slice();
  for(const [sx,sy] of S){let bi=0,bd=1e9;free.forEach((u,i)=>{const d=Math.hypot(u.x-(gr.ax+sx),u.y-(gr.ay+sy));if(d<bd){bd=d;bi=i}});const u=free.splice(bi,1)[0];u.sx=sx;u.sy=sy}
}
// what a group's formation does to a blow on one of its soldiers (src: the attacker, or an arrow's origin)
// a shield: missiles that hit its bearer's front do SHIELD_ARROWS of their damage
const SHIELD_ARROWS=.7;
const shieldMul=(t,src)=>src&&src.arrow&&t.s&&tagsOf(t.s).includes('shield')&&B&&sideOf(t,src)==='front'?SHIELD_ARROWS:1;
function formTaken(t,src){
  const sh=shieldMul(t,src),g=t.grp&&B.groups[t.grp];if(!g||!g.form)return sh;const F=FORMS[g.form];let k=(F.taken||1)*sh;
  if(src&&src.arrow&&F.arrows)k*=F.arrows;
  if(src&&F.front){const a=Math.atan2(src.y-t.y,src.x-t.x),df=angGap(a,g.face||0);if(df<1.05)k*=F.front}
  return k;
}
// a charge: its force by the charger's formation (a wedge) and the depth of the block it hits
const formCharge=(att,t)=>{const ga=att.grp&&B.groups[att.grp],sh=t.grp&&B.groups[t.grp]&&grpShape(t.grp);return (ga&&FORMS[ga.form]&&FORMS[ga.form].chargeMul||1)*(sh&&sh.ranks>=DEPTH.ranks?DEPTH.charge:1)};
// a group's pace in its formation (a shield wall is slow)
const formPace=g=>g&&FORMS[g.form]&&FORMS[g.form].spd||1;

// an order to charge breaks a shield wall
function breakWall(g){const gr=B.groups[g];if(gr&&gr.form==='wall'){gr.setForm('line');log(GN[g]+' break their shield wall to charge.')}}
// turn a group toward where it marches (a plain right-click, far enough to matter)
function faceToward(g,x,y){const gr=B.groups[g],m=grpUnits(g);if(!m.length)return;const cx=m.reduce((a,u)=>a+u.x,0)/m.length,cy=m.reduce((a,u)=>a+u.y,0)/m.length;if(Math.hypot(x-cx,y-cy)>40)gr.setForm(gr.form||'line',{face:Math.atan2(y-cy,x-cx),files:gr.files})}
// a line dragged from (x0,y0) to (x1,y1): the selection along it, shared by their numbers, facing the left of the drag.
// Each is as wide as its share of the line (and so as deep as its numbers make it); a wedge keeps its shape; your hero stands
// just behind the line's middle, not in it
function dragFiles(f,n,seg){const F=FORMS[f]||FORMS.line;return F.drag==='fixed'?null:Math.max(1,Math.min(n,Math.round(seg/F.gx)+1))}
function formPlan(x0,y0,x1,y1){
  const sel=selGroups().filter(g=>grpUnits(g).length),gs=sel.filter(g=>g!=='hero'),L=Math.hypot(x1-x0,y1-y0);if(!sel.length||L<FORM_DRAG)return[];
  const ux=(x1-x0)/L,uy=(y1-y0)/L,foes=B.units.filter(u=>u.team===1&&u.hp>0),ex=foes.length?foes.reduce((a,u)=>a+u.x,0)/foes.length:BW,ey=foes.length?foes.reduce((a,u)=>a+u.y,0)/foes.length:BH/2;
  // (its front on the left of the drag, as in Total War: dragged down they face right, up left, left to right up, right to left down)
  const face=Math.atan2(-ux,uy),mx=(x0+x1)/2,my=(y0+y1)/2;
  const tot=gs.reduce((a,g)=>a+grpUnits(g).length,0);let s=0;
  const plan=gs.map(g=>{const n=grpUnits(g).length,seg=L*n/tot,c=s+seg/2;s+=seg;
    return{g,ax:clamp(x0+ux*c,8,BW-8),ay:clamp(y0+uy*c,fieldTop(),fieldBot()),face,files:dragFiles(B.groups[g].form||'line',n,seg)}});
  if(sel.includes('hero'))plan.push({g:'hero',hero:true,ax:clamp(mx-Math.cos(face)*(gs.length?30:0),8,BW-8),ay:clamp(my-Math.sin(face)*(gs.length?30:0),fieldTop(),fieldBot()),face,files:null});
  return plan;
}
// the ghost of a dragged line: each soldier's slot, faint, and an arrow the way they will face
function drawFormGhost(){
  const d=B.rdrag;if(!d||Math.hypot(d.x1-d.x0,d.y1-d.y0)<FORM_DRAG)return;
  ctx.strokeStyle='rgba(232,185,74,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(d.x0,d.y0);ctx.lineTo(d.x1,d.y1);ctx.stroke();
  for(const p of formPlan(d.x0,d.y0,d.x1,d.y1)){const gr=B.groups[p.g],S=p.hero?[[0,0]]:formSlots(gr.form||'line',grpUnits(p.g).length,p.face,p.files);
    ctx.fillStyle='rgba(232,185,74,.8)';for(const [sx,sy] of S)ctx.fillRect(Math.round(p.ax+sx)-2,Math.round(p.ay+sy)-2,4,4);
    ctx.strokeStyle='rgba(232,185,74,.8)';ctx.beginPath();ctx.moveTo(p.ax,p.ay);ctx.lineTo(p.ax+Math.cos(p.face)*14,p.ay+Math.sin(p.face)*14);ctx.stroke()}
}
// a formation's icon: its own slots, drawn small (shields for the wall), facing up
function formIcon(f,w,h){
  w=w||22;h=h||14;const F=FORMS[f],n=F.wedge?10:12,S=formSlots(f,n,-Math.PI/2,F.wedge?null:6),xs=S.map(p=>p[0]),ys=S.map(p=>p[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),k=Math.min((w-4)/Math.max(1,x1-x0),(h-4)/Math.max(1,y1-y0),.35);
  const dots=S.map(([x,y])=>{const px=(w/2+(x-(x0+x1)/2)*k).toFixed(1),py=(h/2+(y-(y0+y1)/2)*k).toFixed(1);
    return f==='wall'?'<rect x="'+(px-1.5)+'" y="'+(py-1.5)+'" width="3" height="3" fill="currentColor"/>':'<circle cx="'+px+'" cy="'+py+'" r="1.3" fill="currentColor"/>'}).join('');
  return '<svg class="ficon" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'" aria-hidden="true">'+dots+'</svg>';
}
