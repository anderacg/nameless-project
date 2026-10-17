'use strict';
// Report, not a test (run by name: run-tests.ps1 -Suites visual/monsterbalance): how 12 tier-2 troops and the hero fare
// against each monster, 3 fights at level 1 and at level 3. The BAL lines never fail.
window.RUN=()=>{const o=[];
try{
 const t=T,G=t.G,P=t.P,W=t.W,MONSTERS=t.MONSTERS;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const reset=()=>{G.mode='world';G.modal=false;G.enc=null;t.hidePanel()};
 t.act('begin','soldier');W.critters=[];W.sites=[];W.lords.forEach(l=>{l.x=-999;l.y=-999});
 const near=(id,lv)=>{const m={id,x:P.x+40,y:P.y,hx:P.x+40,hy:P.y,lv:lv||1,n:MONSTERS[id].count[0],cool:0,t:9,a:0};W.monsters.push(m);return m};
 for(const id of Object.keys(MONSTERS).filter(id=>!MONSTERS[id].mythic)){const res=[];for(const lv of [1,3]){let w=0,lost=0;for(let k=0;k<3;k++){P.troops={hum_spear:6,hum_long:3,hum_squire:3};
   reset();const m=near(id,lv);m.n=MONSTERS[id].count[1];G.encCool=0;t.startMonster(m);t.act('fight');let i=0;while(t.B&&i<12000){t.updateBattle(.033);i++}
   if(!W.monsters.includes(m))w++;lost+=12-t.troopCount();t.act('cont');done();W.monsters=W.monsters.filter(x=>x!==m)}res.push('lv'+lv+' won '+w+'/3 lost '+(lost/3).toFixed(1))}
   o.push('BAL '+id+' ×'+MONSTERS[id].count[1]+': '+res.join(', '))}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
