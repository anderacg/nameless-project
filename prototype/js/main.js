'use strict';
/* ---------- loop ---------- */
let last=performance.now();
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(G.mode==='battle'&&B)updateBattle(dt);
  else if(G.mode==='scene')updateScene(dt);
  else if(G.mode==='world')updateWorld(dt);
  G.hudT+=dt;if(G.hudT>.25){G.hudT=0;updateHUD();if(G.mode==='battle')updateSkillBar()}
  frame();requestAnimationFrame(loop);
}
P.x=(TOWNS[0].tx+.5)*TILE;P.y=(TOWNS[0].ty+2.5)*TILE;
initWorld();showTitle();updateHUD(true);requestAnimationFrame(loop);

// Ashmark.html?test=<suite> runs a headless test suite from tests/ (see tests/run-tests.sh); visual/<scene> sets up a screenshot
if(/^(visual\/)?\w+$/.test(new URLSearchParams(location.search).get('test')||'')){const s=document.createElement('script');s.src='tests/harness.js';document.body.appendChild(s)}
