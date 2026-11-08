'use strict';
/* ---------- the battle camera (Phase 4 of RTS command): the field starts seen whole; zoom in on the fight and pan about it.
   Wheel: zoom toward the cursor. Middle-drag or the arrow keys: pan. + and -: zoom on the middle. 0: the whole field again.
   A group's number twice quickly: look at it. A small map of the field (top right) shows every soldier and where you look;
   click it to look there. The camera runs on real time, so it moves while the battle is paused. ---------- */
// zooms: the steps of the wheel past the whole field's (those under it unused: .5 and .75 only on a field larger than the view,
// setup.js FIELD_SIZES); pan: arrow-key speed (screen px a second); mini: the small map (HUD px). Drawn sharp (core.js bview):
// snap, the whole field's view put down onto a whole number of device px a field px if it is still snap of its size or more;
// ease, how fast a zoom glides onto its stop (a share 1-e^-ease a second)
const BCAM={zooms:[.5,.75,1,1.25,1.5,2,2.5,3],pan:420,dbl:350,mini:{w:80,h:50,x:6,y:24},miniBelow:58,snap:.85,ease:14};
// (the whole field: the zoom that fits it in the view (BVW x BVH, the screen's shape): today's field 1 unless the screen is narrower
// than it (the view FIELD_H high, as the field); a larger one under 1, a small one a little over)
const camFit=()=>B?.world?1/B.world.scale:Math.min(BVW/BW,BVH/BH);
/* the zoom's stops, the whole field's first. Drawn sharp (the owner, 2026-11-01: "please make it render good on battle map,
   because we need some of them for specific fights"), every step a whole number of device px a field px, from the whole field's
   in to BCAM.zooms' last; the whole field's its exact fit in the view (under 1 on a large field), or the whole number under it
   (BCAM.snap) */
function camZooms(){const V=bview();if(!V.sharp){const f=camFit();return[f,...BCAM.zooms.filter(z=>z>f+.01)]}
  const d=Math.min(V.w/BW,V.h/BH)*V.k,n=Math.floor(d),far=n>=1&&n>=d*BCAM.snap?n:d,near=Math.max(Math.floor(far)+1,Math.round(BCAM.zooms[BCAM.zooms.length-1]*V.k)),Z=[far/V.k];
  for(let i=Math.floor(far)+1;i<=near;i++)Z.push(i/V.k);return Z}
const camFar=()=>camZooms()[0];
function camInit(){B.cam={z:camFar(),fit:true,x:0,y:0,keys:{},lt:0};camClamp()}
const bcam=()=>B&&B.cam||{z:1,x:0,y:0,keys:{}};
// device px a field px (sprites placed on them: render.js drawUnit); the field in view (field px), for what is drawn only there
const camPx=()=>B?.world?VS/B.world.scale:bview().k*bcam().z;
const camView=()=>{const c=bcam(),V=bview();return{x:c.x,y:c.y,w:V.w/c.z,h:V.h/c.z,z:c.z}};
// keep the view on the field; a view wider (or higher) than the field has it in the middle. Seeing it whole (c.fit), a new
// window shape (a phone turned) still sees it whole
function camClamp(){const c=bcam(),V=bview();if(B?.world){B.world.syncCamera();return}if(B&&B.cam){const f=camFar();if(c.fit||c.z<f)c.z=f}const w=V.w/c.z,h=V.h/c.z;c.x=w>=BW?(BW-w)/2:clamp(c.x,0,BW-w);c.y=h>=BH?(BH-h)/2:clamp(c.y,0,BH-h)}
// a point on the canvas (0..BVW, 0..BVH) to the field, and back
const toField=p=>{const c=bcam();return{x:c.x+p.x/c.z,y:c.y+p.y/c.z}};
const fromField=p=>{const c=bcam();return{x:(p.x-c.x)*c.z,y:(p.y-c.y)*c.z}};
// (the zoom z at once, fit or not, the field point under canvas point (sx, sy) kept there)
function camSet(z,fit,sx,sy){const c=B.cam,w=toField({x:sx,y:sy});if(c.ease)c.ease=null;c.z=z;c.fit=fit;c.x=w.x-sx/c.z;c.y=w.y-sy/c.z;camClamp()}
// (drawn sharp: a zoom glides onto its stop, camTick, about (sx, sy); at once for those who ask for less motion)
function camEase(z,fit,sx,sy){const c=B.cam;if(reducedMotion())return camSet(z,fit,sx,sy);c.fit=false;c.ease={z,fit,sx,sy,w:toField({x:sx,y:sy})}}
// zoom a step in (dir 1) or out (-1), keeping the field point under (sx, sy) on the canvas where it is
function camZoom(dir,sx,sy){
  // (from a pinched zoom between the steps: the next step that way; gliding, the next from the stop it goes to)
  if(!B||!B.cam)return;if(B.world){if(mapZoom(dir))camCentre(B.world.cx,B.world.cy);B.world.syncCamera();return}const c=B.cam,Z=camZooms(),z0=c.ease?c.ease.z:c.z,i=Z.indexOf(z0),j=i>=0?clamp(i+dir,0,Z.length-1):dir>0?Z.findIndex(z=>z>z0):Z.findLastIndex(z=>z<z0);if(j<0||Z[j]===z0)return;
  const V=bview();if(sx==null){sx=V.w/2;sy=V.h/2}(V.sharp?camEase:camSet)(Z[j],j===0,sx,sy);
}
// (drawn sharp, a pinch let go or the window resized: onto the stop nearest (now: at once), about (sx, sy), else the view's middle)
function camSettle(sx,sy,now){const c=B&&B.cam,V=bview();if(!c||B.world||!V.sharp)return;const Z=camZooms(),z0=c.ease?c.ease.z:c.z,d=z=>Math.abs(Math.log(z/z0));let j=0;
  for(let i=1;i<Z.length;i++)if(d(Z[i])<d(Z[j]))j=i;if(sx==null){sx=V.w/2;sy=V.h/2}(now?camSet:camEase)(Z[j],j===0,sx,sy)}
// (fitScreen: the window resized)
function camResize(){if(B&&B.cam&&!B.cam.fit)camSettle(null,null,true);camClamp()}
// a pinch (two fingers, input.js): zoom z, anywhere from the whole field to the closest step, the field point w held under the
// canvas point (sx, sy), their middle (so moving both fingers pans); drawn sharp, let go it settles on a stop (input.js touchUp)
function camPinch(w,z,sx,sy){if(!B||!B.cam)return;if(B.world){const p=B.world.world(w);G.cam.x=p.x-sx;G.cam.y=p.y-sy;B.world.pan(0,0);return}const c=B.cam,V=bview(),Z=camZooms(),f=Z[0];if(c.ease)c.ease=null;c.z=clamp(z,f,V.sharp?Z[Z.length-1]:BCAM.zooms[BCAM.zooms.length-1]);c.fit=c.z<f+.01;if(c.fit)c.z=f;c.x=w.x-sx/c.z;c.y=w.y-sy/c.z;camClamp()}
// look at a point of the field (keeping the zoom)
function camCentre(x,y){if(!B||!B.cam)return;if(B.world){const p=B.world.world({x,y});G.cam.x=p.x-VW/2;G.cam.y=p.y-VH/2;B.world.pan(0,0);return}const c=B.cam,V=bview();if(c.ease)c.ease=null;c.x=x-V.w/c.z/2;c.y=y-V.h/c.z/2;camClamp()}
function camReset(){if(!B||!B.cam)return;if(B.world){G.cam.x=B.world.viewport.x;G.cam.y=B.world.viewport.y;B.world.syncCamera();return}if(B.cam.ease)B.cam.ease=null;B.cam.z=camFar();B.cam.fit=true;B.cam.x=B.cam.y=0;camClamp()}
// pan by (dx, dy) canvas pixels (gliding, the point it glides about goes with it)
function camPan(dx,dy){if(!B||!B.cam)return;if(B.world)return B.world.pan(dx,dy);const c=B.cam,e=c.ease;if(e){e.w.x+=dx/c.z;e.w.y+=dy/c.z}c.x+=dx/c.z;c.y+=dy/c.z;camClamp()}
// look at a group (its number pressed twice quickly)
function camLookAt(gs){const m=gs.flatMap(grpUnits);if(!m.length)return;camCentre(m.reduce((a,u)=>a+u.x,0)/m.length,m.reduce((a,u)=>a+u.y,0)/m.length)}
// each drawn frame: the arrow keys held pan the view (real time: it moves while paused too)
function camTick(){
  if(B.world)B.world.syncCamera();const c=B.cam,now=performance.now(),dt=c.lt?Math.min(.1,(now-c.lt)/1000):0;c.lt=now;const k=c.keys;
  const dx=(k.arrowright?1:0)-(k.arrowleft?1:0),dy=(k.arrowdown?1:0)-(k.arrowup?1:0);if(dx||dy)camPan(dx*BCAM.pan*dt,dy*BCAM.pan*dt);
  // (a zoom gliding onto its stop (camEase), the point it glides about held still: there once within a hundredth of it)
  const e=c.ease;if(e&&dt>0){const L=Math.log(e.z/c.z);if(Math.abs(L)<.01)camSet(e.z,e.fit,e.sx,e.sy);else{c.z*=Math.exp(L*(1-Math.exp(-BCAM.ease*dt)));c.x=e.w.x-e.sx/c.z;c.y=e.w.y-e.sy/c.z;camClamp()}}
}
// the small map, in HUD pixels (VW×VH), and on the canvas
// (below the time controls whatever the screen's scale: HUD_PX game pixels to a CSS pixel, core.js)
const miniRect=()=>{const m=BCAM.mini,h=Math.round(m.w*BH/BW);return{x:VW-m.x-m.w,y:Math.max(m.y,Math.ceil(BCAM.miniBelow*HUD_PX)),w:m.w,h}};
function miniHit(p){if(!B||!B.cam)return null;if(B.world){const r=worldMiniView();return p.x>=r.x&&p.y>=r.y&&p.x<=r.x+r.w&&p.y<=r.y+r.h?B.world.field({x:((p.x-r.x)/r.s+r.ox)*TILE,y:((p.y-r.y)/r.s+r.oy)*TILE}):null}const r=miniRect(),V=bview(),sx=V.w/VW,sy=V.h/VH,x=p.x/sx,y=p.y/sy;
  if(x<r.x||x>r.x+r.w||y<r.y||y>r.y+r.h)return null;return{x:(x-r.x)/r.w*BW,y:(y-r.y)/r.h*BH}}
// drawn in the HUD (its scale): the field (its fog: battlefog.js), every soldier a dot (but enemies your side does not see: terrain.js seenBy), the view a box
function drawMiniField(){
  if(!B.cam)return;const r=miniRect(),c=B.cam,V=bview(),kx=r.w/BW,ky=r.h/BH;
  drawMapFrame(r);
  // (a field with terrain: its painted ground, a pixel a cell, terraces' edges dark (engine/ground.js), dimmed under the dots)
  const gm=B.world?null:B.terrain&&B.ground&&(B.groundMini||(B.groundMini=PX.battleGroundMini({...B.terrain,climate:B.env.c},B.ground)));
  if(gm){ctx.globalAlpha=.8;ctx.drawImage(gm,r.x,r.y,r.w,r.h);ctx.globalAlpha=1}else{ctx.fillStyle='rgba(90,120,70,.55)';ctx.fillRect(r.x,r.y,r.w,r.h)}
  fogMiniField(r);// (the ground out of your side's sight shaded: battlefog.js)
  for(const u of B.units){if(u.hp<=0||!seenBy(0,u))continue;ctx.fillStyle=u.hero?'#e8b94a':sideCol(u,u.rout?'rout':'ui');ctx.fillRect(Math.round(r.x+u.x*kx),Math.round(r.y+u.y*ky),1,1)}
  ctx.strokeStyle=MAP_FRAME.view;ctx.lineWidth=1;ctx.strokeRect(Math.round(r.x+c.x*kx)+.5,Math.round(r.y+c.y*ky)+.5,Math.round(V.w/c.z*kx),Math.round(V.h/c.z*ky));
  // (zoomed in: by how much; drawn sharp, how many device px a field px)
  if(c.z>camFar()+.01)txt((V.sharp?Math.round(c.z*V.k*10)/10:c.z)+'×',r.x+r.w-2,r.y+r.h+8,MAP_FRAME.muted,'right');
}
