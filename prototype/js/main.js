'use strict';
damageTypesInit();// (every troop kind its damage type and armour: matchups.js)
/* ---------- loop ---------- */
let last=performance.now(),hudCards=false;
// (about RENDER.fps frames a second at most: a frame sooner than .65 of its interval after the last is skipped, so a 120 Hz screen
// draws every other one (60), a 90 Hz one each (its frames come late enough); 30: a 60 Hz screen every other one. The setting
// Frame rate, ui.js)
// (an error in a step or a frame never stops the game: the loop goes on, the error still raised a moment later for the tests and
// the console, each one once a second at most (the owner, 2026-11-12: "games freeze after the new battle": one throw in a battle's
// drawing ended the loop, and the game stood still))
// Each one is also told on the screen the first time (its message and where, file:line), so a phone with no console can tell of it
// (the owner, 2026-11-15: a phone's map lost its fog, people and night in the rain); the last LOOP_KEEP kept for the developer
// console's "errors"
const LOOP_ERR=new Map(),LOOP_SEEN=[],LOOP_KEEP=20;
function loopWhere(e){const L=String(e&&e.stack||'').split('\n').find(l=>/\.js:\d+/.test(l))||'',m=L.match(/([^\/\s(@]+\.js):(\d+)/);return m?m[1]+':'+m[2]:''}
function loopError(e){const k=String(e&&e.message||e),t=performance.now();
  if(!LOOP_SEEN.some(x=>x.k===k)){const w=loopWhere(e);LOOP_SEEN.push({k,w,day:typeof G!=='undefined'?G.day:0,mode:typeof G!=='undefined'?G.mode:''});if(LOOP_SEEN.length>LOOP_KEEP)LOOP_SEEN.shift();try{toast('Something went wrong: '+k+(w?' ('+w+')':''),'bad')}catch(_){}}
  if(t-(LOOP_ERR.get(k)||-1e9)<1000)return;LOOP_ERR.set(k,t);setTimeout(()=>{throw e})}
// (the map's chunks ahead painted in what is left of the frame's time once it is drawn: gfx/worldart.js idle)
function paintIdle(now){if(G.mode==='world'&&WM)try{
  WorldArt.keepLive();Quality.watch(now);
  FrameBudget.run(now,RENDER.fps,[['march sprites',ms=>marchWarm(ms)],['terrain paint',ms=>WorldArt.idle(ms)],['buildings',ms=>lotWarm(ms)],['route warmup',ms=>wayWarm(ms)]]);
}catch(e){loopError(e)}}// (and the ways' chunks round you, your army's pictures, the buildings of the holdings ahead and Auto's first frames: router.js wayWarm, gfx/marchdraw.js marchWarm, gfx/quality.js Quality.watch)

function stepSimulation(dt){
  const mode=G.mode;
  if(G.mode==='battle'&&B){updateBattle(heroBeat(dt)*BATTLE_TEMPO);openFightWorld(dt*WORLD_TEMPO)}
  else openFightOver();
  if(G.mode==='scene')updateScene(dt);
  else if(G.mode==='world')updateWorld(dt*WORLD_TEMPO);
  return G.mode===mode;
}
// A hidden tab resumes from now, without replaying time spent in the background.
addEventListener('visibilitychange',()=>{last=performance.now();FrameTime.reset()});

function loop(now){
  if(now-last<650/RENDER.fps){requestAnimationFrame(loop);return}
  const dt=Math.min(FRAME_TIME.catchup,Math.max(0,(now-last)/1000));last=now;
  FrameBudget.begin(now,RENDER.fps);
  fastWatch();// (Travel fast: back to 1x when anything calls for you: world.js)
  const t0=FRAMEPROF.on?performance.now():0;// (the frame timings: ui/frameprof.js)
  if(!DevConsole.opened)try{FrameTime.advance(dt,stepSimulation)}catch(e){FrameTime.reset();loopError(e)}else FrameTime.reset();
  // (the HUD on its own clock, in real time, never the simulation's: in a battle the ability buttons every tick, the orders, unit
  // cards, details and top bar every other one (setOrderUI redraws the abilities too: battlehud.js bhudTop))
  // (one HUD that throws never stops the game: the loop goes on, the error still raised a moment later for the tests and the console;
  // the owner, 2026-11-01: a skill bar written over froze the game mid-battle)
  // (none while loading, between its slices: the world half made, a HUD's look made the map's art plan from it and kept it (supply.js
  // waterEdge: WorldArt.ensure), a new game in steps painted otherwise than at once; loading.js runSteps refreshes it at its end)
  G.hudT+=dt;if(G.hudT>.25&&WM&&G.mode!=='loading'){G.hudT=0;try{updateHUD();if(G.mode==='battle'){updateSkillBar();if(B&&(hudCards=!hudCards))setOrderUI();else bhudAbilities()}}catch(e){setTimeout(()=>{throw e})}}
  audioWatch();// (the music follows the scene; a town, a meeting, a new day, a battle's start are heard: music.js)
  // (the main menu draws its own scene, never the world: ui/mainmenu.js; anything else, the game's frame)
  const t1=FRAMEPROF.on?performance.now():0;try{MainMenu.frame(now);if(G.mode!=='title')frame()}catch(e){loopError(e);ctx.setTransform(1,0,0,1,0,0)}
  const t2=FRAMEPROF.on?performance.now():0;paintIdle(now);
  if(FRAMEPROF.on)FrameProf.frame(t1-t0,t2-t1,performance.now()-t2);
  FrameBudget.end();requestAnimationFrame(loop);
}
// the page opens on the main menu (ui/mainmenu.js) with no world: a new campaign or a load makes one (session.js begin, save.js
// loadGame). The tests and the wiki make the classic world at load (worldmap.js): laid out here as it first stands (session.js worldFirst)
MainMenu.init();
if(WM)worldFirst();showTitle();if(WM)updateHUD(true);
requestAnimationFrame(loop);
DevConsole.init();

// Ashmark.html?test=<suite> runs a headless test suite from tests/ (see tests/run-tests.sh); visual/<scene> sets up a screenshot
if(/^(visual\/)?\w+$/.test(new URLSearchParams(location.search).get('test')||'')){const s=document.createElement('script');s.src='tests/harness.js';document.body.appendChild(s)}
