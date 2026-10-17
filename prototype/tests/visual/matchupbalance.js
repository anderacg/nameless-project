'use strict';
// Report, not a test (run by name: run-tests.ps1 -Suites visual/matchupbalance): real battles of horsemen, spearmen, militia
// and archers, 4 each. The BAL lines never fail.
window.RUN=()=>{const o=[];
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;
 const fight=(mine,theirs)=>{let w=0;for(let k=0;k<4;k++){P.troops={...mine};P.comps={};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0},list:theirs.slice()};t.startBattle({enemies:theirs,tournament:false});
   t.B.hero.hp=0;let i=0;while(t.B&&!t.B.over&&i<9000){t.updateBattle(.033);i++}if(t.B&&t.B.win)w++;if(t.B){t.B.over=true;t.B.endT=0;t.updateBattle(.01)}t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0])}return w};
 o.push('BAL 8 spearmen vs 6 horsemen: won '+fight({spearman:8},Array(6).fill('horse'))+'/4');
 o.push('BAL 8 militia vs 6 horsemen: won '+fight({militia:8},Array(6).fill('horse'))+'/4');
 o.push('BAL 6 horsemen vs 8 archers: won '+fight({horse:6},Array(8).fill('archer'))+'/4');
 o.push('BAL 6 horsemen vs 8 spearmen: won '+fight({horse:6},Array(8).fill('spearman'))+'/4');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
