'use strict';
damageTypesInit();// (every troop kind its damage type and armour: matchups.js)
/* ---------- loop ---------- */
let last=performance.now(),hudCards=false;
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  fastWatch();// (Travel fast: back to 1x when anything calls for you: world.js)
  if(!DevConsole.opened){
    if(G.mode==='battle'&&B)updateBattle(dt);
    else if(G.mode==='scene')updateScene(dt);
    else if(G.mode==='world')updateWorld(dt);
  }
  // (the HUD on its own clock, in real time, never the simulation's: in a battle the ability buttons every tick, the orders, unit
  // cards, details and top bar every other one (setOrderUI redraws the abilities too: battlehud.js bhudTop))
  G.hudT+=dt;if(G.hudT>.25&&WM){G.hudT=0;updateHUD();if(G.mode==='battle'){updateSkillBar();if(B&&(hudCards=!hudCards))setOrderUI();else bhudAbilities()}}
  audioWatch();// (the music follows the scene; a town, a meeting, a new day, a battle's start are heard: music.js)
  frame();requestAnimationFrame(loop);
}
// the world as it first stands (session.js worldFirst: every new game's start), laid out once it is in: at once, or with WORLD.gen
// on the game's own page forged first behind the overlay (worldmap.js leaves it to here; the tests and the wiki make it at once)
if(WM){worldFirst();showTitle();updateHUD(true)}
else{const made={};runSteps('Forging the world…',[...forgeSteps('ashmark-1',classicSettings(),r=>made.r=r),{id:'install',label:'Drawing borders',w:150,run:()=>{installWorld(made.r);worldFirst()}}],
  {back:['Try again',()=>location.reload()]}).then(()=>{showTitle();updateHUD(true)},()=>{})}
requestAnimationFrame(loop);
DevConsole.init();

// Ashmark.html?test=<suite> runs a headless test suite from tests/ (see tests/run-tests.sh); visual/<scene> sets up a screenshot
if(/^(visual\/)?\w+$/.test(new URLSearchParams(location.search).get('test')||'')){const s=document.createElement('script');s.src='tests/harness.js';document.body.appendChild(s)}
