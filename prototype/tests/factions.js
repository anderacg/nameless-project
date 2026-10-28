'use strict';
// Factions: holdings, contracts, hostility, lord battles, branching training and world save/load.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 t.act('begin','soldier');
 ok(t.TOWNS.length===37&&t.TOWNS.filter(x=>x.kind==='castle').length===9,'37 holdings incl 9 castles');
 ok(['vale','karn','sylvan','horde'].every(f=>new Set(t.fiefsOf(f).flatMap(x=>x.races)).size===1)&&t.FACS.salt.races.length===3,'four single-race kingdoms and one mixed league');
 ok(W.lords.length===20&&Object.values(W.rel).filter(r=>r.s==='war').length===1,'20 lords, one war at the start');
 // fix diplomacy so the checks below don't depend on the random starting war
 W.rel={};W.rel[t.rk('vale','karn')]={s:'war',since:1};
 P.gold=1000;
 t.enterTown(t.townBy('Ashford'));t.act('tab','tavern');t.act('contract');ok(P.fac==='vale'&&t.hostileTo('karn')&&!t.hostileTo('salt'),'contract with vale makes karn hostile');
 P.troops.hum_spear=2;t.act('tab','recruit');t.act('rec-tab','train');ok(/Pikeman/.test(document.getElementById('panel').innerHTML),'branching upgrade shown');
 P.txp={hum_spear:t.txpNeed('hum_spear')};t.act('train','hum_spear:hum_pike');ok(P.troops.hum_pike===1,'trained pikeman (with the experience for it)');
 // (a third group wants a step of Leadership: an army starts with room for 3, your hero's own one of them, army.js armyGroupLimit)
 P.sk.lead.lv=Math.max(P.sk.lead.lv,t.ARMY_GROUP.leadBase+1);t.act('hire','hum_levy');ok(P.troops.hum_levy===1,'hired race troop');
 t.act('leave');done();
 const kh=t.townBy('Karn Hold');P.x=kh.x;P.y=kh.y+3;G.lastTown=null;G.encCool=99;t.updateWorld(.016);
 ok(G.mode==='besiege'&&/Make siege camp/.test(document.getElementById('panel').innerHTML),'a hostile holding opens the siege screen instead of its gates');t.act('sg-leave');
 const kl=W.lords.find(l=>l.fac==='karn'&&!l.dead);kl.troops=Array(14).fill('dw_axe');kl.cool=0;kl.inside=null;kl.fight=null;kl.state='home';// (out and about: one resting in its realm's holding stays in)
 G.encCool=0;P.x=kl.x+3;P.y=kl.y;t.TravelAwareness.notice(kl);t.updateLords(.016);
 ok(G.mode==='dialog'&&G.enc&&G.enc.kind==='lord','hostile lord attacks');
 t.act('fight');if(t.B)t.beginFight();ok(t.B&&t.B.units.some(u=>u.team===1&&['dwarf','orc'].includes(t.ST[u.type].race)),'battle vs dwarf/orc troops');
 let i=0;while(t.B&&i<20000){t.B.units.forEach(u=>{if(u.team===0&&!u.left)u.hp=u.max});t.updateBattle(.033);if(t.B&&i%15===0)t.frame();i++}
 ok(G.mode==='dialog'&&kl.dead,'beat lord in '+i+' steps; renown '+P.renown);
 t.act('cont');done();
 const sl=W.lords.find(l=>l.fac==='salt'&&!l.dead);sl.inside=null;G.encCool=0;t.lordMeet(sl);/* met on the road (in a hall there is no attacking) */ok(/Attack/.test(document.getElementById('panel').innerHTML),'neutral lord dialog');
 t.act('lord-attack');ok(G.enc.kind==='lord'&&t.hostileTo('salt'),'attacking makes salt hostile');t.act('auto');t.act('cont');done();
 G.mode='world';t.openJournal('realms');ok(/Relations/.test(document.getElementById('panel').innerHTML),'realms tab');t.act('journal-close');
 for(let k=0;k<3;k++)t.dayTick();
 t.TOWNS[2].owner='karn';t.saveGame();t.TOWNS[2].owner='vale';W.lords[0].troops=[];
 t.act('load');ok(t.TOWNS[2].owner==='karn'&&W.lords.length===20&&P.fac==='vale','save/load keeps world');
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
