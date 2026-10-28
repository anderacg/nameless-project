'use strict';
// Matchups: the counter triangle and traits, every unit's strengths and weaknesses, braced charges, armor vs arrows,
// gear that changes the hero's class, and the UI text. (Real battles compared: visual/matchupbalance.js.)
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,ST=t.ST,mu=(a,d)=>+(t.matchup(ST[a],ST[d])/t.typeMul(ST[a],ST[d])).toFixed(3),tm=(a,d)=>+t.typeMul(ST[a],ST[d]).toFixed(3);/* (mu: the counter triangle alone; tm: damage type against armour) */try{localStorage.clear()}catch(e){}
 ok(mu('horse','archer')===1.4,'cavalry beat archers (×1.4)');
 ok(mu('archer','militia')===1.2,'archers beat unarmored foot (×1.2)');
 ok(mu('militia','spearman')===1.25,'foot beat spearmen (×1.25)');
 ok(mu('spearman','horse')===1.6&&mu('spearman','troll')===1.6,'spears beat cavalry and large monsters (×1.6)');
 {const pl=1-t.ARMOR.plate.v/100*t.ARMOR_PEN.pierce;ok(tm('archer','hum_guard')===+pl.toFixed(3)&&tm('hum_long','hum_guard')===+(pl+(1-pl)*t.AP).toFixed(3)&&pl<.65,'plate (armour '+t.ARMOR.plate.v+') shrugs off arrows (×'+pl.toFixed(3)+'), armour-piercing ones half as much')}
 ok(['none','leather','hide','mail','plate'].every((k,i,a)=>!i||t.ARMOR[k].v>t.ARMOR[a[i-1]].v)&&t.ARMOR_PEN.slash>t.ARMOR_PEN.pierce&&t.ARMOR_PEN.pierce>t.ARMOR_PEN.blunt,'armour has a value, rising from none to plate; slashes are stopped most by it, blows least');
 ok(mu('dw_berserk','archer')===1.4,'shock troops tear into archers (×1.4)');
 ok(mu('militia','militia')===1,'even fights stay even');
 const gaps=Object.keys(ST).filter(k=>{const v=t.vsInfo(ST[k]);return !v.strong.length||!v.weak.length});
 ok(!gaps.length,'every unit ('+Object.keys(ST).length+') has a strength and a weakness'+(gaps.length?': missing '+gaps.join(', '):''));
 // battle mechanics
 t.act('begin','soldier');P.troops={horse:1};P.comps={};G.mode='world';G.enc={kind:'party',ref:{cool:0},list:['spearman']};t.startBattle({enemies:['spearman'],tournament:false});
 const B=t.B,hu=B.units.find(u=>u.type==='horse'),sp=B.units.find(u=>u.type==='spearman');hu.run=t.CHARGE.run;sp.inSlot=false;sp.dir=Math.atan2(hu.y-sp.y,hu.x-sp.x);const hp0=sp.hp;t.attack(hu,sp);
 ok(B.floats.some(f=>f.t==='Braced')&&hp0-sp.hp<=ST.horse.dmg*1.2+1,'a charge into spearmen is braced: no charge bonus ('+(hp0-sp.hp)+' damage)');
 B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');
 // the hero's class follows the gear
 P.gear.weapon='wyrmspear';ok(t.unitClass(t.heroStats())==='spear','the Wyrm Tooth Spear makes your hero fight as a spearman');P.gear.weapon=null;
 P.gear.body='scorpplate';ok(t.heroStats().armor==='plate'&&Math.abs(t.typeMul(ST.archer,t.heroStats())-(1-t.ARMOR.plate.v/100*t.ARMOR_PEN.pierce))<1e-9,'Scorpion Plate gives your hero plate against arrows');P.gear.body=null;
 // UI
 P.gold=999;G.mode='world';G.modal=false;G.lastTown=null;t.enterTown(t.townBy('Ashford'));t.act('tab','recruit');ok(/Strong vs/.test(document.getElementById('panel').innerHTML),'recruit screen lists strengths and weaknesses');t.act('leave');
 while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 const m={id:'troll',x:P.x+30,y:P.y,hx:P.x,hy:P.y,lv:1,n:1,cool:0};t.W.monsters.push(m);t.startMonster(m);ok(/Weak vs [^<]*spearmen/.test(document.getElementById('panel').innerHTML),'monster encounter names its weakness');t.act('flee');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
