'use strict';
// Power rating: hero, companions and troops add up; gear and levels raise it; fights and lords show both sides.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');P.troops={hum_levy:4,hum_bow:2};P.comps={};
 const hero=t.rating(['hero']),troops=t.rating(Array(4).fill('hum_levy').concat(['hum_bow','hum_bow']));
 ok(Math.abs(t.partyPower()-(hero+troops))<=1,'party power = hero '+hero+' + troops '+troops+' ≈ '+t.partyPower());
 P.comps={brann:{ap:0,role:''}};ok(t.partyPower()>hero+troops,'a companion adds power (now '+t.partyPower()+')');
 const p0=t.partyPower();P.gear.weapon='wyrmspear';ok(t.partyPower()>p0,'gear raises power ('+p0+' → '+t.partyPower()+')');P.gear.weapon=null;
 ok(t.rating(['tiger'],3)>t.rating(['tiger'],1),'monster levels raise power');
 ok(t.rating(['hum_knight'])>t.rating(['hum_spear'])&&t.rating(['hum_spear'])>t.rating(['hum_levy']),'higher tiers rate higher');
 t.updateHUD(true);ok(new RegExp('Power</b><span class="gold">'+t.partyPower()).test(document.getElementById('stats').innerHTML),'HUD shows power');
 G.mode='world';t.openChar();t.act('char-tab','party');const h=document.getElementById('panel').innerHTML;
 ok(/Party power/.test(h)&&/Brann the Wolf/.test(h)&&/Levy/.test(h),'party tab breaks power down by hero, companion and troop type');t.act('char-close');
 t.startEncounter({kind:'party',ref:t.bandits[0],n:5,band:'bandits'});ok(/Your power <strong>\d+<\/strong> vs <strong>\d+<\/strong>/.test(document.getElementById('panel').innerHTML),'encounters show your power vs theirs');t.act('flee');
 const m={id:'troll',x:P.x+30,y:P.y,hx:P.x,hy:P.y,lv:2,n:1,cool:0};W.monsters.push(m);G.encCool=0;t.startMonster(m);
 ok(document.getElementById('panel').innerHTML.includes('vs <strong>'+t.rating(['troll'],2)+'</strong>'),'monster encounter uses the leveled power');t.act('flee');
 const l=W.lords.find(x=>!x.dead);G.mode='world';G.modal=false;P.hostile={};P.fac=null;W.rel={};t.lordMeet(l);ok(/power \d+ vs your \d+/.test(document.getElementById('panel').innerHTML),'lord dialog shows both powers');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
