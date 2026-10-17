'use strict';
damageTypesInit();// (every troop kind its damage type and armour: matchups.js)
/* ---------- loop ---------- */
let last=performance.now(),hudCards=false;
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!DevConsole.opened){
    if(G.mode==='battle'&&B)updateBattle(dt);
    else if(G.mode==='scene')updateScene(dt);
    else if(G.mode==='world')updateWorld(dt);
  }
  // (the HUD on its own clock, in real time, never the simulation's: in a battle the ability buttons every tick, the orders, unit
  // cards, details and top bar every other one (setOrderUI redraws the abilities too: battlehud.js bhudTop))
  G.hudT+=dt;if(G.hudT>.25){G.hudT=0;updateHUD();if(G.mode==='battle'){updateSkillBar();if(B&&(hudCards=!hudCards))setOrderUI();else bhudAbilities()}}
  frame();requestAnimationFrame(loop);
}
P.x=(TOWNS[0].tx+.5)*TILE;P.y=(TOWNS[0].ty+2.5)*TILE;
initWorld();showTitle();updateHUD(true);requestAnimationFrame(loop);
DevConsole.init();

// Ashmark.html?test=<suite> runs a headless test suite from tests/ (see tests/run-tests.sh); visual/<scene> sets up a screenshot
if(/^(visual\/)?\w+$/.test(new URLSearchParams(location.search).get('test')||'')){const s=document.createElement('script');s.src='tests/harness.js';document.body.appendChild(s)}
