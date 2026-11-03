'use strict';
damageTypesInit();// (every troop kind its damage type and armour: matchups.js)
/* ---------- loop ---------- */
let last=performance.now(),hudCards=false;
// (about RENDER.fps frames a second at most: a frame sooner than .65 of its interval after the last is skipped, so a 120 Hz screen
// draws every other one (60), a 90 Hz one each (its frames come late enough); 30: a 60 Hz screen every other one. The setting
// Frame rate, ui.js)
function loop(now){
  if(now-last<650/RENDER.fps){requestAnimationFrame(loop);return}
  const dt=Math.min(.05,(now-last)/1000);last=now;
  fastWatch();// (Travel fast: back to 1x when anything calls for you: world.js)
  const t0=FRAMEPROF.on?performance.now():0;// (the frame timings: ui/frameprof.js)
  if(!DevConsole.opened){
    if(G.mode==='battle'&&B)updateBattle(heroBeat(dt));// (a crit's or a kill's beat of slow motion: gfx/herofx.js)
    else if(G.mode==='scene')updateScene(dt);
    else if(G.mode==='world')updateWorld(dt);
  }
  // (the HUD on its own clock, in real time, never the simulation's: in a battle the ability buttons every tick, the orders, unit
  // cards, details and top bar every other one (setOrderUI redraws the abilities too: battlehud.js bhudTop))
  // (one HUD that throws never stops the game: the loop goes on, the error still raised a moment later for the tests and the console;
  // the owner, 2026-11-01: a skill bar written over froze the game mid-battle)
  G.hudT+=dt;if(G.hudT>.25&&WM){G.hudT=0;try{updateHUD();if(G.mode==='battle'){updateSkillBar();if(B&&(hudCards=!hudCards))setOrderUI();else bhudAbilities()}}catch(e){setTimeout(()=>{throw e})}}
  audioWatch();// (the music follows the scene; a town, a meeting, a new day, a battle's start are heard: music.js)
  // (the main menu draws its own scene, never the world: ui/mainmenu.js; anything else, the game's frame)
  const t1=FRAMEPROF.on?performance.now():0;MainMenu.frame(now);if(G.mode!=='title')frame();if(FRAMEPROF.on)FrameProf.frame(t1-t0,performance.now()-t1);requestAnimationFrame(loop);
}
// the page opens on the main menu (ui/mainmenu.js) with no world: a new campaign or a load makes one (session.js begin, save.js
// loadGame). The tests and the wiki make the classic world at load (worldmap.js): laid out here as it first stands (session.js worldFirst)
MainMenu.init();
if(WM)worldFirst();showTitle();if(WM)updateHUD(true);
requestAnimationFrame(loop);
DevConsole.init();

// Ashmark.html?test=<suite> runs a headless test suite from tests/ (see tests/run-tests.sh); visual/<scene> sets up a screenshot
if(/^(visual\/)?\w+$/.test(new URLSearchParams(location.search).get('test')||'')){const s=document.createElement('script');s.src='tests/harness.js';document.body.appendChild(s)}
