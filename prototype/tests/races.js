'use strict';
// Races and the dragon (a mythic monster): race bonuses, racial recruits, dragon hunting and battle balance, save migration.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.showTitle('new');ok(document.querySelectorAll('[data-act="race"]').length===4,'4 race buttons on the New game screen');
 t.act('race','orc');ok(/Brutal/.test(document.getElementById('panel').innerHTML),'orc description shown');
 t.act('begin','soldier');ok(P.race==='orc'&&P.attr.str===7&&P.attr.cha===1&&P.sk.oneh.lv===3,'orc bonuses (with +1 from the Soldier origin) str='+P.attr.str+' cha='+P.attr.cha+' oneh='+P.sk.oneh.lv);
 P.gold=2000;const dn=t.townBy('Brinewatch');G.lastTown=null;t.enterTown(dn);const html=document.getElementById('panel').innerHTML;
 ok(/Orc Grunt/.test(html)&&/Glade Warden/.test(html)&&/Wolf Rider/.test(html)&&/Hart Rider/.test(html)&&!/Dwarf/.test(html),'mixed Brinewatch hires orc and elf troops incl. mounts');
 ok(t.hireCost('orc_grunt')<t.hireCost('hum_levy'),'own race discount '+t.hireCost('orc_grunt')+' vs '+t.hireCost('hum_levy'));
 t.act('hire','orc_grunt');t.act('hire','dw_clan');t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 W.monsters=W.monsters.filter(m=>m.id!=='dragon');let D=null;for(let k=0;k<20&&!D;k++)D=t.spawnMythic('dragon');ok(D&&t.mythicOf('dragon')===D&&t.MONSTERS.dragon.mythic,'the dragon is a mythic monster and spawns: '+G.msgs[G.msgs.length-1].m);
 ok(t.mythicIds().includes('dragon')&&!t.MONSTERS.dragon.where.length,'it has no lair habitat: it roams the whole map');
 D.x=P.x+30;D.y=P.y;D.cool=0;G.encCool=0;for(let i=0;i<60&&G.mode==='world';i++)t.updateMonsters(.05);
 ok(G.mode==='dialog'&&G.enc.kind==='monster'&&G.enc.ref===D&&/A dragon descends/.test(document.getElementById('panel').innerHTML),'dragon hunts and attacks player');
 t.act('fight');ok(t.B&&t.B.units.some(u=>u.type==='dragon'),'dragon in battle');
 let i=0,breaths=0;while(t.B&&i<6000){const b0=t.B.floats.filter(f=>f.t==='FIRE').length;t.updateBattle(.033);if(t.B){t.frame();if(t.B.floats.filter(f=>f.t==='FIRE').length>b0)breaths++}i++}
 ok(!t.B,'dragon battle ends ('+i+' steps, '+breaths+' breaths), result: '+(t.mythicOf('dragon')?'dragon won':'dragon slain'));
 t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // balance trials
 const armies={starter:{militia:4,spearman:2},t2x20:{hum_spear:8,hum_long:6,dw_axe:6},mixed30:{hum_spear:6,hum_guard:4,dw_iron:4,elf_marks:6,hum_long:4,orc_brute:6}};
 for(const [name,army] of Object.entries(armies)){let wins=0,loss=0,n=0,tot=0;
  for(let k=0;k<4;k++){P.troops={...army};tot=Object.values(army).reduce((a,b)=>a+b,0);G.mode='world';G.modal=false;const dm=t.mythicOf('dragon')||t.spawnMythic('dragon')||t.spawnMythic('dragon');dm.cool=0;
   t.startMonster(dm);t.act('fight');let j=0;while(t.B&&j<9000){t.updateBattle(.033);j++}
   const left=Object.values(P.troops).reduce((a,b)=>a+b,0);if(!t.mythicOf('dragon'))wins++;loss+=tot-left;n++;t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);}
  o.push('BAL '+name+' ('+tot+' troops, power ratio '+(t.power(['dragon'])/t.power(t.playerList().length>1?t.playerList():['hero'])).toFixed(2)+'): won '+wins+'/4, avg losses '+(loss/n).toFixed(1));}
 P.troops={vale_levy:3,karn_axe:1};P.prisoners={salt_archer:2};G.mode='world';G.modal=false;t.saveGame();t.act('load');
 ok(P.troops.hum_levy===3&&P.troops.dw_axe===1&&P.prisoners.elf_archer===2&&P.race==='orc','old ids migrate on load, race kept');
 G.mode='world';t.openChar();ok(/Orc · level/.test(document.getElementById('panel').innerHTML),'race in char panel');t.act('char-tab','realms');t.act('char-close');t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
