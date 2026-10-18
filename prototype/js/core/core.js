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
const cv=$('#game'),ctx=cv.getContext('2d');
cv.width=VW;cv.height=VH;ctx.imageSmoothingEnabled=false;
// the battlefield: BW x BH, set as a battle starts by its size (setup.js FIELD_SIZES); with sizes off (the older test suites) today's
// field, FIELD_H high and as wide as the screen's shape asks (FIELD_W). In a battle the canvas runs at BVW x BVH (FIELD_H field px
// down at zoom 1, the screen's shape) in the same space on screen; the camera fits the whole field in it (camera.js camFit), and
// its HUD is drawn at the screen's scale
const FIELD_H=600,FIELD_W={min:960,max:1300};
let BW=960,BH=FIELD_H,BVW=960,BVH=FIELD_H;
function setRes(w,h){if(cv.width===w&&cv.height===h)return;cv.width=w;cv.height=h;ctx.imageSmoothingEnabled=false}
// (the test suites keep the old fixed view, 576 x 360, so their clicks and sums stay put; ?v= is a look at the real thing)
const FIXED_VIEW=/[?&]test=/.test(location.search)&&!/[?&]v=/.test(location.search);
// the screen is the window; the canvas fills it at a whole-number scale (a game pixel's last part may run past the edge)
function fitScreen(){
  const scr=cv.parentElement,dpr=window.devicePixelRatio||1,aw=innerWidth,ah=innerHeight;
  const s=FIXED_VIEW?Math.max(1,Math.floor(Math.min(aw*dpr/576,ah*dpr/360))):Math.max(1,Math.floor(Math.min(ah*dpr/VIEW.h,aw*dpr/VIEW.w)));
  VW=FIXED_VIEW?576:Math.ceil(aw*dpr/s);VH=FIXED_VIEW?360:Math.ceil(ah*dpr/s);BVH=FIELD_H;BVW=Math.round(FIELD_H*VW/VH);
  const w=VW*s/dpr,h=VH*s/dpr;HUD_PX=dpr/s;cv.style.width=w+'px';cv.style.height=h+'px';
  if(FIXED_VIEW){scr.style.width=w+'px';scr.style.height=h+'px'}else{scr.style.width=aw+'px';scr.style.height=ah+'px'}
  if(typeof B!=='undefined'&&B&&B.cam&&typeof camClamp==='function')camClamp();
}
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
// the first 60% is daylight, then dusk, night and dawn fill the last 40% (NIGHT_AT on)
const DAY_SECONDS=120,NIGHT_AT=.6;
const WORLD_PACE=.6,BATTLE_PACE=.6,HERO_PACE=.85;
const MAP_AREA=MW*MH/(112*80),MAP_DENS=.75*MAP_AREA; // the world is 4x the old map; wild things are 3x as many
const BANDITS=Math.round(10*MAP_DENS),MONSTER_CAP=Math.round(20*MAP_DENS),MONSTER_START=Math.round(16*MAP_DENS);
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
