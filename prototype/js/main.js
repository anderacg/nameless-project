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
const LOOP_ERR=new Map();
function loopError(e){const k=String(e&&e.message||e),t=performance.now();if(t-(LOOP_ERR.get(k)||-1e9)<1000)return;LOOP_ERR.set(k,t);setTimeout(()=>{throw e})}
function loop(now){
  if(now-last<650/RENDER.fps){requestAnimationFrame(loop);return}
  const dt=Math.min(.05,(now-last)/1000);last=now;
  fastWatch();// (Travel fast: back to 1x when anything calls for you: world.js)
  const t0=FRAMEPROF.on?performance.now():0;// (the frame timings: ui/frameprof.js)
  if(!DevConsole.opened)try{
    if(G.mode==='battle'&&B){updateBattle(heroBeat(dt));openFightWorld(dt)}// (a crit's or a kill's beat of slow motion: gfx/herofx.js; the world on round a fight on the map: worldbattle.js)
    else openFightOver();// (the fight over: your band's days and hours kept through it, worldbattle.js)
    if(G.mode==='scene')updateScene(dt);
    else if(G.mode==='world')updateWorld(dt);
  }catch(e){loopError(e)}
  // (the HUD on its own clock, in real time, never the simulation's: in a battle the ability buttons every tick, the orders, unit
  // cards, details and top bar every other one (setOrderUI redraws the abilities too: battlehud.js bhudTop))
  // (one HUD that throws never stops the game: the loop goes on, the error still raised a moment later for the tests and the console;
  // the owner, 2026-11-01: a skill bar written over froze the game mid-battle)
  // (none while loading, between its slices: the world half made, a HUD's look made the map's art plan from it and kept it (supply.js
  // waterEdge: WorldArt.ensure), a new game in steps painted otherwise than at once; loading.js runSteps refreshes it at its end)
  G.hudT+=dt;if(G.hudT>.25&&WM&&G.mode!=='loading'){G.hudT=0;try{updateHUD();if(G.mode==='battle'){updateSkillBar();if(B&&(hudCards=!hudCards))setOrderUI();else bhudAbilities()}}catch(e){setTimeout(()=>{throw e})}}
  audioWatch();// (the music follows the scene; a town, a meeting, a new day, a battle's start are heard: music.js)
  // (the main menu draws its own scene, never the world: ui/mainmenu.js; anything else, the game's frame)
  const t1=FRAMEPROF.on?performance.now():0;try{MainMenu.frame(now);if(G.mode!=='title')frame()}catch(e){loopError(e);ctx.setTransform(1,0,0,1,0,0)}if(FRAMEPROF.on)FrameProf.frame(t1-t0,performance.now()-t1);requestAnimationFrame(loop);
}
// the page opens on the main menu (ui/mainmenu.js) with no world: a new campaign or a load makes one (session.js begin, save.js
// loadGame). The tests and the wiki make the classic world at load (worldmap.js): laid out here as it first stands (session.js worldFirst)
MainMenu.init();
if(WM)worldFirst();showTitle();if(WM)updateHUD(true);
requestAnimationFrame(loop);
DevConsole.init();

// Ashmark.html?test=<suite> runs a headless test suite from tests/ (see tests/run-tests.sh); visual/<scene> sets up a screenshot
if(/^(visual\/)?\w+$/.test(new URLSearchParams(location.search).get('test')||'')){const s=document.createElement('script');s.src='tests/harness.js';document.body.appendChild(s)}
