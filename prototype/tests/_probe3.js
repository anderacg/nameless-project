'use strict';
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W,MW=t.MW;t.begin('soldier',{preset:'normal',seed:'s3'});G.quietEvents=true;P.fac=null;P.hostile={};
const tw=t.townBy('Wardhurst');t.bandits.length=0;W.monsters=[];W.lords.forEach(l=>{l.x=-999;l.y=-999});G.day=1;t.hidePanel();G.mode='world';G.modal=false;W.folk=[];t.FOLK_SEEN.clear();P.x=tw.x;P.y=tw.y+30;G.clock=t.DAY*.3;
const U=t.DAY/24/3600*60,step=.05;let last=-1;
for(let i=0;G.clock<t.DAY*.95&&i<400000;i++){t.updateFolk(step);G.clock+=step*(t.DAY/24)/60*3;const h=Math.floor(G.clock/t.DAY*24);if(h!==last){last=h;const fs=W.folk.filter(f=>f.home==='Wardhurst'&&f.k==='quarry');o.push('INFO h'+h+' '+fs.map(f=>f.st+'@'+(f.x/16).toFixed(1)+','+(f.y/16).toFixed(1)+(f.load?'L':'')+(f.plan?' pl':'')).join(' | '))}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
