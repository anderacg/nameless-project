'use strict';
// Matchups: the counter triangle and traits, every unit's strengths and weaknesses, braced charges, armor vs arrows,
// gear that changes the hero's class, and the UI text. BAL lines compare real battles; they never fail.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,ST=t.ST,mu=(a,d)=>+t.matchup(ST[a],ST[d]).toFixed(3);try{localStorage.clear()}catch(e){}
 ok(mu('horse','archer')===1.4,'cavalry beat archers (×1.4)');
 ok(mu('archer','militia')===1.2,'archers beat unarmored foot (×1.2)');
 ok(mu('militia','spearman')===1.25,'foot beat spearmen (×1.25)');
 ok(mu('spearman','horse')===1.6&&mu('spearman','troll')===1.6,'spears beat cavalry and large monsters (×1.6)');
 ok(mu('archer','hum_guard')===.65&&mu('hum_long','hum_guard')===1.3,'heavy armor shrugs off arrows (×0.65) unless they pierce (×1.3)');
 ok(mu('dw_berserk','archer')===1.4,'shock troops tear into archers (×1.4)');
 ok(mu('militia','militia')===1,'even fights stay even');
 const gaps=Object.keys(ST).filter(k=>{const v=t.vsInfo(ST[k]);return !v.strong.length||!v.weak.length});
 ok(!gaps.length,'every unit ('+Object.keys(ST).length+') has a strength and a weakness'+(gaps.length?': missing '+gaps.join(', '):''));
 // battle mechanics
 t.act('begin','soldier');P.troops={horse:1};P.comps={};G.mode='world';G.enc={kind:'party',ref:{cool:0},list:['spearman']};t.startBattle({enemies:['spearman'],tournament:false});
 const B=t.B,hu=B.units.find(u=>u.type==='horse'),sp=B.units.find(u=>u.type==='spearman');hu.spdNow=70;const hp0=sp.hp;t.attack(hu,sp);
 ok(B.floats.some(f=>f.t==='Braced')&&hp0-sp.hp<=ST.horse.dmg*1.2+1,'a charge into spearmen is braced: no charge bonus ('+(hp0-sp.hp)+' damage)');
 B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');
 // the hero's class follows the gear
 P.gear.weapon='wyrmspear';ok(t.unitClass(t.heroStats())==='spear','the Wyrm Tooth Spear makes your hero fight as a spearman');P.gear.weapon=null;
 P.gear.body='scorpplate';ok(t.matchup(ST.archer,t.heroStats())===.65,'Scorpion Plate gives your hero heavy armor against arrows');P.gear.body=null;
 // UI
 P.gold=999;G.mode='world';G.modal=false;G.lastTown=null;t.enterTown(t.townBy('Ashford'));ok(/Strong vs/.test(document.getElementById('panel').innerHTML),'recruit screen lists strengths and weaknesses');t.act('leave');
 while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 const m={id:'troll',x:P.x+30,y:P.y,hx:P.x,hy:P.y,lv:1,n:1,cool:0};t.W.monsters.push(m);t.startMonster(m);ok(/Weak vs [^<]*spearmen/.test(document.getElementById('panel').innerHTML),'monster encounter names its weakness');t.act('flee');
 // real battles: the same 6 horsemen against 8 spearmen vs 8 militia
 const fight=(mine,theirs)=>{let w=0;for(let k=0;k<4;k++){P.troops={...mine};P.comps={};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0},list:theirs.slice()};t.startBattle({enemies:theirs,tournament:false});
   t.B.hero.hp=0;let i=0;while(t.B&&!t.B.over&&i<9000){t.updateBattle(.033);i++}if(t.B&&t.B.win)w++;if(t.B){t.B.over=true;t.B.endT=0;t.updateBattle(.01)}t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0])}return w};
 o.push('BAL 8 spearmen vs 6 horsemen: won '+fight({spearman:8},Array(6).fill('horse'))+'/4');
 o.push('BAL 8 militia vs 6 horsemen: won '+fight({militia:8},Array(6).fill('horse'))+'/4');
 o.push('BAL 6 horsemen vs 8 archers: won '+fight({horse:6},Array(8).fill('archer'))+'/4');
 o.push('BAL 6 horsemen vs 8 spearmen: won '+fight({horse:6},Array(8).fill('spearman'))+'/4');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
