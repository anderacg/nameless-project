'use strict';
// Not a test: scenes for screenshots of the Game Menu (ui/hub.js; headless Chrome --screenshot at a window size).
// ?shot=menu (over the map) | battle (over a battle: every tile greyed, no saving) | settings (Settings opened from the menu); &w=844&h=390: the screen that size
window.RUN=()=>{
 const t=T,G=t.G,P=t.P,u=new URLSearchParams(location.search),shot=u.get('shot')||'menu';
 window.requestAnimationFrame=()=>0;Math.random=t.seeded(23);
 Kit.begin('soldier',23);Kit.world();Kit.goHome('Ashford');P.name='Bran Redhand';P.band='The Grey Company';
 if(shot==='battle'){t.startBattle({enemies:['militia','militia','militia','militia'],tournament:false});for(let i=0;i<3;i++)t.frame()}else t.frame();
 t.showEsc();if(shot==='settings')t.act('esc-settings');
 // (the size last, and again on a resize: the frames above and the window's own resize fit the screen to its whole-number scale)
 const size=()=>{if(u.get('w')){const e=document.getElementById('screen').style;e.width=u.get('w')+'px';e.height=u.get('h')+'px'}};size();addEventListener('resize',size);
 const p=document.getElementById('panel');if(p)p.style.animation='none';
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS game menu '+shot;document.body.appendChild(d);
};
