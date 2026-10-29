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
/* the density drawn at (the owner, 2026-10-29: "it lags on mobile"): the screen's own (devicePixelRatio), at most cap (the setting
   Resolution, ui.js: Full none, Balanced 2, Fast 1.5). The game's art is whole pixels, so a canvas of fewer pixels shown at the
   window's size (pixelated, style.css) looks the same, its text a little coarser, and draws in a fraction of the time on a phone
   (at 3, Balanced fills 4/9 of the pixels, Fast 1/4) */
const RENDER={cap:2,fps:60};
// the pictures drawn from art (art/: the tracks): smooth at the screen's pixels, or pixel, the same pixelated in game pixels (the
// setting Sprites, ui.js: the owner, 2026-10-29)
const SPRITES={pixel:false};
const dprOf=()=>Math.min(window.devicePixelRatio||1,RENDER.cap);
// ctx: the context drawn into; the world map's ground and buildings go into a canvas of game pixels first (render.js drawWorld)
const cv=$('#game');let ctx=cv.getContext('2d', { willReadFrequently: true });const ctx0=ctx;
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
/* Map art stays on whole device pixels. z: saved scale (0 Auto); lo/hi: zoom limits. Desktop Auto and limits follow the
   window. On phones, the former default (PHONE × window scale, bounded by PHONE_IN/PHONE_IN_H) is now the farthest view.
   Auto starts PHONE_START times closer, with further zoom up to PHONE_MAX times the former default. HUD scale stays s0. */
const MAPZOOM={z:0,map:false,on:false,s0:1,auto:1,lo:1,hi:1,vw:576,vh:360,IN:320,IN_H:180,OUT:1.7e6,PINCH:1.25,WHEEL:140,SMALL:540,PHONE:3,PHONE_START:1.5,PHONE_MAX:2,PHONE_IN:240,PHONE_IN_H:120,wt:0,k(){return this.on?this.s0/VS:1},phone(w,h){return !FIXED_VIEW&&Math.min(w,h)<=this.SMALL}};
// the screen is the window; the canvas fills it at a whole-number scale (a game pixel's last part may run past the edge)
function fitScreen(){
  const scr=cv.parentElement,dpr=dprOf(),aw=innerWidth,ah=innerHeight,Z=MAPZOOM,phone=Z.phone(aw,ah);
  const s0=FIXED_VIEW?Math.max(1,Math.floor(Math.min(aw*dpr/576,ah*dpr/360))):Math.max(1,Math.floor(Math.min(ah*dpr/VIEW.h,aw*dpr/VIEW.w)));
  // (the screen in device pixels: the window, or the tests' fixed view at its scale; the view at a scale s: dw/s x dh/s)
  const dw=FIXED_VIEW?576*s0:aw*dpr,dh=FIXED_VIEW?360*s0:ah*dpr,fit=s=>Math.ceil(dw/s)*Math.ceil(dh/s)<=Z.OUT&&Math.ceil(dw/s)<=MW*TILE&&Math.ceil(dh/s)<=MH*TILE;
  Z.s0=s0;Z.vw=Math.ceil(dw/s0);Z.vh=Math.ceil(dh/s0);Z.hi=Math.max(s0,Math.floor(Math.min(dw/(phone?Z.PHONE_IN:Z.IN),dh/(phone?Z.PHONE_IN_H:Z.IN_H))));Z.lo=s0;while(Z.lo>1&&fit(Z.lo-1))Z.lo--;
  if(phone){const far=Math.min(Z.hi,s0*Z.PHONE);Z.lo=far;Z.auto=Math.ceil(far*Z.PHONE_START);Z.hi=Math.max(Z.auto+1,Math.ceil(far*Z.PHONE_MAX))}else Z.auto=s0;
  const s=Z.map?Math.max(Z.lo,Math.min(Z.hi,Z.z||Z.auto)):s0;Z.on=s!==s0;
  VW=Math.ceil(dw/s);VH=Math.ceil(dh/s);BVH=FIELD_H;BVW=Math.round(FIELD_H*Z.vw/Z.vh);
  const w=VW*s/dpr,h=VH*s/dpr;HUD_PX=dpr/s0;VS=s;cv.style.width=w+'px';cv.style.height=h+'px';
  if(FIXED_VIEW){scr.style.width=w+'px';scr.style.height=h+'px'}else{scr.style.width=aw+'px';scr.style.height=ah+'px'}
  if(typeof B!=='undefined'&&B?.world){BVW=VW;BVH=VH}
  if(typeof B!=='undefined'&&B&&B.cam&&typeof camClamp==='function')camClamp();
  if(typeof zoomUI==='function')zoomUI();
}
// a step of the map's zoom (d: 1 in, -1 out) within its range, remembered (ui.js PREFS mapzoom); back at auto it is auto again.
// False at the end of the range
function mapZoom(d){const Z=MAPZOOM,cur=Z.map?VS:Z.auto,s=Math.max(Z.lo,Math.min(Z.hi,cur+d));if(s===cur)return false;prefSet('mapzoom',s===Z.auto?0:s);return true}
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
// the first half is daylight, then dusk, night and dawn fill the other half (NIGHT_AT on; the owner, 2026-10-19: 50/50). A day of 180 s at a world pace of .4
// (doc/WORLD_DESIGN.md D9: it was 120 s at .6) keeps 72 units of the world's time to a day, so every timer counted in it lasts
// the same share of a day; what moves goes slower on screen (data/world.js WORLD_SCALE.move)
const DAY_SECONDS=180,NIGHT_AT=.5;
const WORLD_PACE=.4,BATTLE_PACE=.6,HERO_PACE=.85;
// the world's time controls (D23): 1x, 2x and 4x (keys 1-3), and Travel fast (key 4, the top bar's 8×), 8x till you change the
// speed (the owner, 2026-10-22: back on the bar; Hurry, the band's own pace, is on the action ring and key R: world/supply.js)
const SPEEDS=[1,2,4],TRAVEL_FAST=8;
// the developer console's cheats (ui/developer.js): your band's map speed × speed (world.js bandPace); noNeeds: no hunger, thirst
// or stamina drain, nor their tolls on your hero (world/supply.js). Runtime only, never saved; off unless a test sets them
const CHEAT={speed:1,noNeeds:false};
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
