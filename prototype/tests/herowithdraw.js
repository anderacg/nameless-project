'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
// Your hero withdrawn by hand, the screen drawn every frame (order paths on, as in the game): the battle goes on to its end.
// (A withdrawing group's order path once built a stand-in man for the exit code; with EXITS.on it threw and the game froze.)
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),out=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
 const t=T,G=t.G,P=t.P;
 const go=(lab,on)=>{
  t.TERRAIN.on=on;t.FOG.on=on;t.EXITS.on=on;if(t.BEAST_TACTICS)t.BEAST_TACTICS.on=on;
  t.act('begin','soldier');P.troops={hum_spear:6,hum_bow:4};P.slots=Array(10).fill(null);
  const L=t.W.lords.find(l=>!l.dead);Object.assign(L,{inside:null,x:P.x,y:P.y,troops:Array(10).fill('hum_spear')});G.mode='world';G.modal=false;t.hidePanel();
  t.startEncounter({kind:'lord',ref:L,list:L.troops.slice(),allies:[],foes:[]});t.startBattle({enemies:G.enc.list,tournament:false});const B=t.B;
  t.beginFight();// (battles open deploying or waiting for Start Battle)
  const h=B.hero;t.selectGroup('hero');
  const bad=[];B.units.forEach((u,i)=>{if(!u||!u.s)bad.push(i+':'+(u?Object.keys(u).slice(0,12).join('/'):String(u)))});o.push('INFO units without s: '+(bad.join(' ; ')||'none'));
  for(const id in B.groups){const gu=B.groups[id].units;if(gu&&gu.some(u=>!u||!u.s))o.push('INFO group '+id+' units bad: '+gu.map(u=>u?(u.s?'ok':'noS'):String(u)).join(','))}
  t.setOrder('withdraw');
  let i=0,t0=performance.now(),err=null,leftAt=null,modeAt=null;
  try{for(;i<6000;i++){t.updateBattle(.03);if(h.left&&leftAt==null)leftAt=i;if(G.mode!=='battle'){modeAt=i;break}t.frame()}}catch(e){err=e.message+' '+(e.stack||'').split(String.fromCharCode(10)).slice(0,10).join(' | ')}
  const mine=B.units.filter(u=>u.team===0&&u.hp>0).length,theirs=B.units.filter(u=>u.team===1&&u.hp>0).length;
  o.push('INFO '+lab+': frames '+i+', ms '+Math.round(performance.now()-t0)+', hero left at '+leftAt+', over '+B.over+', mode '+G.mode+' at '+modeAt+', mine '+mine+', theirs '+theirs+', hero hp '+h.hp+' left '+h.left+(err?', EXC '+err:''));
  ok(!err,lab+': no exception');ok(G.mode!=='battle'||B.over,lab+': the battle ends or goes on to an end');
  if(G.mode==='battle'){B.over=true;B.endT=0;try{t.updateBattle(.03)}catch(e){}}
 };
 try{go('harness settings',false);go('game settings (terrain, fog, exits on)',true)}catch(e){o.push('EXC '+e.message+' '+e.stack)}out()};
