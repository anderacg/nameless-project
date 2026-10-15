'use strict';
/* ---------- the battle camera (Phase 4 of RTS command): the field starts seen whole; zoom in on the fight and pan about it.
   Wheel: zoom toward the cursor. Middle-drag or the arrow keys: pan. + and -: zoom on the middle. 0: the whole field again.
   A group's number twice quickly: look at it. A small map of the field (top right) shows every soldier and where you look;
   click it to look there. The camera runs on real time, so it moves while the battle is paused. ---------- */
// zooms: the steps of the wheel (1: the whole field); pan: arrow-key speed (screen px a second); mini: the small map (HUD px)
const BCAM={zooms:[1,1.25,1.5,2,2.5,3],pan:420,dbl:350,mini:{w:80,h:50,x:6,y:24},miniBelow:58};
// (the whole field: the zoom that fits it in the view (BVW x BVH, the screen's shape), 1 unless the screen is narrower than it)
const camFit=()=>Math.min(1,BVW/BW,BVH/BH);
const camZooms=()=>{const f=camFit();return[f,...BCAM.zooms.filter(z=>z>f+.01)]};
function camInit(){B.cam={z:camFit(),fit:true,x:0,y:0,keys:{},lt:0};camClamp()}
const bcam=()=>B&&B.cam||{z:1,x:0,y:0,keys:{}};
// keep the view on the field; a view wider (or higher) than the field has it in the middle. Seeing it whole (c.fit), a new
// window shape (a phone turned) still sees it whole
function camClamp(){const c=bcam();if(B&&B.cam&&(c.fit||c.z<camFit()))c.z=camFit();const w=BVW/c.z,h=BVH/c.z;c.x=w>=BW?(BW-w)/2:clamp(c.x,0,BW-w);c.y=h>=BH?(BH-h)/2:clamp(c.y,0,BH-h)}
// a point on the canvas (0..BVW, 0..BVH) to the field, and back
const toField=p=>{const c=bcam();return{x:c.x+p.x/c.z,y:c.y+p.y/c.z}};
const fromField=p=>{const c=bcam();return{x:(p.x-c.x)*c.z,y:(p.y-c.y)*c.z}};
// zoom a step in (dir 1) or out (-1), keeping the field point under (sx, sy) on the canvas where it is
function camZoom(dir,sx,sy){
  if(!B||!B.cam)return;const c=B.cam,Z=camZooms(),i=Z.indexOf(c.z),j=clamp((i<0?0:i)+dir,0,Z.length-1);if(Z[j]===c.z)return;
  if(sx==null){sx=BVW/2;sy=BVH/2}const w=toField({x:sx,y:sy});c.z=Z[j];c.fit=j===0;c.x=w.x-sx/c.z;c.y=w.y-sy/c.z;camClamp();
}
// look at a point of the field (keeping the zoom)
function camCentre(x,y){if(!B||!B.cam)return;const c=B.cam;c.x=x-BVW/c.z/2;c.y=y-BVH/c.z/2;camClamp()}
function camReset(){if(!B||!B.cam)return;B.cam.z=camFit();B.cam.fit=true;B.cam.x=B.cam.y=0;camClamp()}
// pan by (dx, dy) canvas pixels
function camPan(dx,dy){if(!B||!B.cam)return;const c=B.cam;c.x+=dx/c.z;c.y+=dy/c.z;camClamp()}
// look at a group (its number pressed twice quickly)
function camLookAt(gs){const m=gs.flatMap(grpUnits);if(!m.length)return;camCentre(m.reduce((a,u)=>a+u.x,0)/m.length,m.reduce((a,u)=>a+u.y,0)/m.length)}
// each drawn frame: the arrow keys held pan the view (real time: it moves while paused too)
function camTick(){
  const c=B.cam,now=performance.now(),dt=c.lt?Math.min(.1,(now-c.lt)/1000):0;c.lt=now;const k=c.keys;
  const dx=(k.arrowright?1:0)-(k.arrowleft?1:0),dy=(k.arrowdown?1:0)-(k.arrowup?1:0);if(dx||dy)camPan(dx*BCAM.pan*dt,dy*BCAM.pan*dt);
}
// the small map, in HUD pixels (VW×VH), and on the canvas
// (below the time controls whatever the screen's scale: HUD_PX game pixels to a CSS pixel, core.js)
const miniRect=()=>{const m=BCAM.mini,h=Math.round(m.w*BH/BW);return{x:VW-m.x-m.w,y:Math.max(m.y,Math.ceil(BCAM.miniBelow*HUD_PX)),w:m.w,h}};
function miniHit(p){if(!B||!B.cam)return null;const r=miniRect(),sx=BVW/VW,sy=BVH/VH,x=p.x/sx,y=p.y/sy;
  if(x<r.x||x>r.x+r.w||y<r.y||y>r.y+r.h)return null;return{x:(x-r.x)/r.w*BW,y:(y-r.y)/r.h*BH}}
// drawn in the HUD (its scale): the field, every soldier a dot, the view a box
function drawMiniField(){
  if(!B.cam)return;const r=miniRect(),c=B.cam,kx=r.w/BW,ky=r.h/BH;
  ctx.fillStyle='rgba(10,12,18,.75)';ctx.fillRect(r.x-1,r.y-1,r.w+2,r.h+2);ctx.fillStyle='rgba(90,120,70,.55)';ctx.fillRect(r.x,r.y,r.w,r.h);
  for(const u of B.units){if(u.hp<=0)continue;ctx.fillStyle=u.hero?'#e8b94a':u.team?(u.rout?'#f2c0b8':'#e0605a'):(u.rout?'#c8d8f0':'#6fa8e0');ctx.fillRect(Math.round(r.x+u.x*kx),Math.round(r.y+u.y*ky),1,1)}
  ctx.strokeStyle='#e4e0cf';ctx.lineWidth=1;ctx.strokeRect(Math.round(r.x+c.x*kx)+.5,Math.round(r.y+c.y*ky)+.5,Math.round(BVW/c.z*kx),Math.round(BVH/c.z*ky));
  if(c.z>camFit()+.01)txt(c.z+'×',r.x+r.w-2,r.y+r.h+8,'#98a0ba','right');
}
