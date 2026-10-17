'use strict';
// Report, not a test (run by name: run-tests.ps1 -Suites visual/dragonbalance): three armies against the dragon, 4 fights
// each. The BAL lines never fail.
window.RUN=()=>{const o=[];
try{const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;W.monsters=W.monsters.filter(m=>m.id!=='dragon');
 const armies={starter:{militia:4,spearman:2},t2x20:{hum_spear:8,hum_long:6,dw_axe:6},mixed30:{hum_spear:6,hum_guard:4,dw_iron:4,elf_marks:6,hum_long:4,orc_brute:6}};
 for(const [name,army] of Object.entries(armies)){let wins=0,loss=0,n=0,tot=0;
  for(let k=0;k<4;k++){P.troops={...army};tot=Object.values(army).reduce((a,b)=>a+b,0);G.mode='world';G.modal=false;const dm=t.mythicOf('dragon')||t.spawnMythic('dragon')||t.spawnMythic('dragon');dm.cool=0;
   t.startMonster(dm);t.act('fight');let j=0;while(t.B&&j<9000){t.updateBattle(.033);j++}
   const left=Object.values(P.troops).reduce((a,b)=>a+b,0);if(!t.mythicOf('dragon'))wins++;loss+=tot-left;n++;t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);}
  o.push('BAL '+name+' ('+tot+' troops, power ratio '+(t.power(['dragon'])/t.power(t.playerList().length>1?t.playerList():['hero'])).toFixed(2)+'): won '+wins+'/4, avg losses '+(loss/n).toFixed(1));}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
