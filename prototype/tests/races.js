'use strict';
// Races and the dragon (a mythic monster): race bonuses, racial recruits, dragon hunting, the race kept in a save. (Dragon balance trials: visual/dragonbalance.js.)
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.showTitle('new');ok(document.querySelectorAll('[data-act="race"]').length===4,'4 race buttons on the New game screen');
 t.act('race','orc');ok(/Brutal/.test(document.getElementById('panel').innerHTML),'orc description shown');
 t.act('begin','soldier');ok(P.race==='orc'&&P.attr.str===7&&P.attr.cha===1&&P.sk.oneh.lv===0&&P.apt.oneh===.75,'orc bonuses (with +1 from the Soldier origin) str='+P.attr.str+' cha='+P.attr.cha+'; One-Handed starts at 0, learned '+Math.round(P.apt.oneh*100)+'% faster');
 P.gold=2000;const dn=t.townBy('Brinewatch');G.lastTown=null;t.enterTown(dn);t.act('tab','recruit');const html=document.getElementById('panel').innerHTML;
 ok(/Orc Grunt/.test(html)&&/Glade Warden/.test(html)&&/Wolf Rider/.test(html)&&/Hart Rider/.test(html)&&!/Dwarf/.test(html),'mixed Brinewatch hires orc and elf troops incl. mounts');
 ok(t.hireCost('orc_grunt')<t.hireCost('hum_levy'),'own race discount '+t.hireCost('orc_grunt')+' vs '+t.hireCost('hum_levy'));
 t.act('hire','orc_grunt');t.act('hire','dw_clan');t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 W.monsters=W.monsters.filter(m=>m.id!=='dragon');let D=null;for(let k=0;k<20&&!D;k++)D=t.spawnMythic('dragon');ok(D&&t.mythicOf('dragon')===D&&t.MONSTERS.dragon.mythic,'the dragon is a mythic monster and spawns: '+G.msgs[G.msgs.length-1].m);
 ok(t.mythicIds().includes('dragon')&&!t.MONSTERS.dragon.where.length,'it has no lair habitat: it roams the whole map');
 D.x=P.x+30;D.y=P.y;D.cool=0;G.encCool=0;for(let i=0;i<60&&G.mode==='world';i++)t.updateMonsters(.05);
 ok(G.mode==='dialog'&&G.enc.kind==='monster'&&G.enc.ref===D&&/A dragon descends/.test(document.getElementById('panel').innerHTML),'dragon hunts and attacks player');
 t.act('fight');ok(t.B&&t.B.units.some(u=>u.type==='dragon'),'dragon in battle');
 let i=0,breaths=0;while(t.B&&i<6000){const b0=t.B.floats.filter(f=>f.t==='FIRE').length;t.updateBattle(.033);if(t.B){if(i%15===0)t.frame();if(t.B.floats.filter(f=>f.t==='FIRE').length>b0)breaths++}i++}
 ok(!t.B,'dragon battle ends ('+i+' steps, '+breaths+' breaths), result: '+(t.mythicOf('dragon')?'dragon won':'dragon slain'));
 t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 G.mode='world';G.modal=false;t.saveGame();t.act('load');ok(P.race==='orc','race survives a reload');
 G.mode='world';t.openChar();ok(/Orc · level/.test(document.getElementById('panel').innerHTML),'race in char panel');t.act('char-tab','realms');t.act('char-close');t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
