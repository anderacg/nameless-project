'use strict';
/* ---------- core: DOM handles, canvas, constants and tiny helpers ---------- */
const $=s=>document.querySelector(s);
const htmlText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TILE=16,DAY=12,SAVE='ashmark.save.v2';
// the world's size in tiles: the map that is in's (useWorld, world/worldmap.js); the classic map's till then
let MW=224,MH=160;
// the view: the game's pixels across and down (VW x VH). The game fills the window: each game pixel a whole number of device
// pixels (VIEW.h or more of them down, VIEW.w or more across on a narrow phone), so a bigger window sees more of the map
const VIEW={h:320,w:400};
let VW=576,VH=360,HUD_PX=.5;// (HUD_PX: game pixels to one CSS pixel)
// VS: the world map's canvas pixels to a game pixel (the screen's own: its backing store VW*VS x VH*VS, every game pixel VS x VS
// device pixels), so the world glides a device pixel at a time (render.js drawWorld); CVS: the canvas's now (VS on the map, 1 in
// a battle, a scene or a town, drawn in game pixels as before)
let VS=1,CVS=1;
// ctx: the context drawn into; the world map's ground and buildings go into a canvas of game pixels first (render.js drawWorld)
const cv=$('#game');let ctx=cv.getContext('2d');const ctx0=ctx;
cv.width=VW;cv.height=VH;ctx.imageSmoothingEnabled=false;
// the battlefield: BW x BH, set as a battle starts by its size (setup.js FIELD_SIZES); with sizes off (the older test suites) today's
// field, FIELD_H high and as wide as the screen's shape asks (FIELD_W). In a battle the canvas runs at BVW x BVH (FIELD_H field px
// down at zoom 1, the screen's shape) in the same space on screen; the camera fits the whole field in it (camera.js camFit), and
// its HUD is drawn at the screen's scale
const FIELD_H=600,FIELD_W={min:960,max:1300};
let BW=960,BH=FIELD_H,BVW=960,BVH=FIELD_H;
function setRes(w,h,k=1){CVS=k;if(cv.width===w&&cv.height===h)return;cv.width=w;cv.height=h;ctx0.imageSmoothingEnabled=false}
// (the test suites keep the old fixed view, 576 x 360, so their clicks and sums stay put; ?v= is a look at the real thing)
const FIXED_VIEW=/[?&]test=/.test(location.search)&&!/[?&]v=/.test(location.search);
/* the world map's zoom: its scale a whole number of device pixels to a game pixel still, so the art stays crisp. z: the scale
   asked for (0 auto: the window's own, s0, as ever; Settings → Map zoom, the wheel, + and −, the buttons, a pinch: mapZoom),
   kept within lo (out: at most OUT game px in view, and no more than the map; a phone's farthest is then 2, as at 1 a frame
   costs 4x: tests/visual/smoothperf.js) and hi (in: at least IN px across, IN_H down).
   Only while the map is drawn (map: render.js frame); battles, scenes and the HUD keep s0 (vw x vh, the view at it). k(): the
   HUD's share of a game pixel on the zoomed map (the minimap keeps its size on the screen) */
const MAPZOOM={z:0,map:false,on:false,s0:1,lo:1,hi:1,vw:576,vh:360,IN:320,IN_H:180,OUT:1.7e6,PINCH:1.25,WHEEL:140,wt:0,k(){return this.on?this.s0/VS:1}};
// the screen is the window; the canvas fills it at a whole-number scale (a game pixel's last part may run past the edge)
function fitScreen(){
  const scr=cv.parentElement,dpr=window.devicePixelRatio||1,aw=innerWidth,ah=innerHeight,Z=MAPZOOM;
  const s0=FIXED_VIEW?Math.max(1,Math.floor(Math.min(aw*dpr/576,ah*dpr/360))):Math.max(1,Math.floor(Math.min(ah*dpr/VIEW.h,aw*dpr/VIEW.w)));
  // (the screen in device pixels: the window, or the tests' fixed view at its scale; the view at a scale s: dw/s x dh/s)
  const dw=FIXED_VIEW?576*s0:aw*dpr,dh=FIXED_VIEW?360*s0:ah*dpr,fit=s=>Math.ceil(dw/s)*Math.ceil(dh/s)<=Z.OUT&&Math.ceil(dw/s)<=MW*TILE&&Math.ceil(dh/s)<=MH*TILE;
  Z.s0=s0;Z.vw=Math.ceil(dw/s0);Z.vh=Math.ceil(dh/s0);Z.hi=Math.max(s0,Math.floor(Math.min(dw/Z.IN,dh/Z.IN_H)));Z.lo=s0;while(Z.lo>1&&fit(Z.lo-1))Z.lo--;
  const s=Z.map&&Z.z?Math.max(Z.lo,Math.min(Z.hi,Z.z)):s0;Z.on=s!==s0;
  VW=Math.ceil(dw/s);VH=Math.ceil(dh/s);BVH=FIELD_H;BVW=Math.round(FIELD_H*Z.vw/Z.vh);
  const w=VW*s/dpr,h=VH*s/dpr;HUD_PX=dpr/s0;VS=s;cv.style.width=w+'px';cv.style.height=h+'px';
  if(FIXED_VIEW){scr.style.width=w+'px';scr.style.height=h+'px'}else{scr.style.width=aw+'px';scr.style.height=ah+'px'}
  if(typeof B!=='undefined'&&B&&B.cam&&typeof camClamp==='function')camClamp();
  if(typeof zoomUI==='function')zoomUI();
}
// a step of the map's zoom (d: 1 in, -1 out) within its range, remembered (ui.js PREFS mapzoom); back at s0 it is auto again.
// False at the end of the range
function mapZoom(d){const Z=MAPZOOM,cur=Z.map?VS:Z.s0,s=Math.max(Z.lo,Math.min(Z.hi,cur+d));if(s===cur)return false;prefSet('mapzoom',s===Z.s0?0:s);return true}
addEventListener('resize',fitScreen);fitScreen();
const ov=$('#ov'),panel=$('#panel'),bbar=$('#bbar');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
// Shared numeric helpers: available to simulation, rendering and the wiki without a renderer dependency.
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const seeded=s=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
const angGap=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
// pace: share of full speed for the world (travel, days, everyone on the map) and for battles (movement, attacks, arrows).
// Visual effects ignore it. Lower is calmer; 1 is the original pace.
// the world clock: one day (DAY clock units) lasts DAY_SECONDS real seconds at 1x speed, whatever the travel pace;
// the first 60% is daylight, then dusk, night and dawn fill the last 40% (NIGHT_AT on). A day of 180 s at a world pace of .4
// (doc/WORLD_DESIGN.md D9: it was 120 s at .6) keeps 72 units of the world's time to a day, so every timer counted in it lasts
// the same share of a day; what moves goes slower on screen (data/world.js WORLD_SCALE.move)
const DAY_SECONDS=180,NIGHT_AT=.6;
const WORLD_PACE=.4,BATTLE_PACE=.6,HERO_PACE=.85;
// the world's time controls (D23): 1x, 2x and 4x (keys 1-3), and Travel fast (key 4), 8x until anything calls for you (world.js fastWatch)
const SPEEDS=[1,2,4],TRAVEL_FAST=8;
// actions: every button names one (data-act="prefix-name"); each system claims its prefix once with onAct, so two systems can
// never answer the same button. Actions without a registered prefix fall through to act() in input.js (menu, encounters), and
// a town's own (tab, hire, buy …) on to townAct in ui/town.js.
const ACTS={};
function onAct(prefix,fn){if(!/^[a-z]+-$/.test(prefix))throw new Error('Action prefixes look like "name-": '+prefix);if(ACTS[prefix])throw new Error('Two systems claim the action prefix '+prefix);ACTS[prefix]=fn}
// run a registered action; false if no system owns its prefix
function routeAct(a,arg){const i=a.indexOf('-'),fn=i>0&&ACTS[a.slice(0,i+1)];if(!fn)return false;fn(a,arg);return true}
// a world goes in: each system that keeps per-tile arrays or caches of the map claims its reset once with onWorld, and useWorld
// (world/worldmap.js) runs them all, in the order they came, with the map. One claimed while a map is in runs at once for it.
const WORLD_HOOKS=[];
function onWorld(fn){WORLD_HOOKS.push(fn);if(typeof WM!=='undefined'&&WM)fn(WM)}
const cap1=w=>w[0].toUpperCase()+w.slice(1);
const an=w=>(/^[aeiou]/i.test(w)?'an ':'a ')+w;
