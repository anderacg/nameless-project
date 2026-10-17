'use strict';
// Reputation: a lone start in your race's home town, standing gates hiring by tier, and how reputation and honor are earned or lost.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const panel=()=>document.getElementById('panel').innerHTML;
 const town=n=>{G.mode='world';G.modal=false;G.lastTown=null;t.enterTown(t.townBy(n))};
 // starts
 t.act('race','orc');t.act('begin','merchant');const sun=t.townBy('Sunreach');
 ok(!Object.keys(P.troops).length&&Math.hypot(P.x-sun.x,P.y-sun.y)<40,'an orc starts alone at Sunreach');
 t.act('race','human');t.act('begin','soldier');const ash=t.townBy('Ashford');
 ok(!Object.keys(P.troops).length&&Math.hypot(P.x-ash.x,P.y-ash.y)<40&&t.repAt('Ashford')===12,'a human veteran starts alone at Ashford, known locally (12)');
 // standing gates hiring
 ok(t.standingAt(ash)===22&&t.canHire(ash,'hum_levy'),'home standing 22 (12 local + 10 same race) hires tier 1');
 const hm=t.townBy('Highmoor');ok(t.standingAt(hm)===10&&!t.canHire(hm,'hum_levy')&&!t.canHire(hm,'hum_squire'),'Highmoor (10) is not enough for anything yet');
 P.gold=500;town('Ashford');t.act('hire','hum_levy');ok(P.troops.hum_levy===1,'hiring works with enough standing');t.act('leave');done();
 town('Highmoor');ok(/Needs standing 15/.test(panel())&&document.querySelector('[data-act="hire"]').disabled,'the recruit screen shows the requirement and disables Hire');
 t.act('hire','hum_levy');ok(P.troops.hum_levy===1&&/do not know you/.test(G.msgs[G.msgs.length-1].m),'a hire without standing is refused');t.act('leave');done();
 const elg=t.townBy('Elderglen');ok(t.standingAt(elg)===0,'other races start at zero');
 // earning reputation
 P.troops={hum_spear:10};P.x=ash.x+60;P.y=ash.y;const r0=t.repAt('Ashford');
 G.mode='world';G.modal=false;t.startEncounter({kind:'party',ref:t.asParty({x:P.x,y:P.y,cool:0,n:4,kind:'bandits'}),n:4,band:'bandits'});t.autoResolve();t.act('cont');done();
 ok(t.repAt('Ashford')>r0,'beating bandits near a holding raises its reputation ('+r0+' → '+t.repAt('Ashford')+')');
 const c0=t.repAt('Ashford'),camp={cleared:false,back:0,x:P.x,y:P.y};G.mode='world';G.modal=false;t.startEncounter({kind:'camp',ref:camp,n:3});t.autoResolve();t.act('cont');done();
 ok(t.repAt('Ashford')>=c0+10,'clearing a camp is worth 10');
 town('Ashford');t.act('tab','trade');t.invAdd('good','iron',20);const tr0=t.repAt('Ashford');t.act('sell','iron:5');ok(t.repAt('Ashford')>tr0,'trading builds reputation');t.act('leave');done();
 // honor
 W.rel={};W.rel[t.rk('vale','karn')]={s:'war',since:1};const kl=W.lords.find(l=>l.fac==='karn');const hv=t.honorWith('vale'),hk=t.honorWith('karn');
 G.mode='world';G.modal=false;t.startEncounter({kind:'lord',ref:kl,list:['dw_clan','dw_clan']});t.autoResolve();t.act('cont');done();
 ok(t.honorWith('vale')===hv+5&&t.honorWith('karn')===hk-10,'beating a Karn lord: Vale honor +5, Karn honor −10');
 const sl=W.lords.find(l=>l.fac==='salt'&&!l.dead);G.mode='world';G.modal=false;G.encCool=0;t.lordMeet(sl);const hs=t.honorWith('salt');t.act('lord-attack');ok(t.honorWith('salt')===hs-15,'attacking a lord costs 15 honor');t.act('flee');done();
 P.fac='vale';const hc=t.honorWith('vale');t.dayTick();ok(t.honorWith('vale')===hc+1,'mercenary service earns honor daily');P.fac=null;
 // honor raises standing across the faction
 P.honor.sylvan=30;ok(t.standingAt(elg)===15&&t.canHire(elg,'elf_glade'),'honor 30 with the Sylvan Court opens their recruits (15)');
 // tournament
 town('Ashford');const tw0=t.repAt('Ashford');t.startBattle({enemies:['chief'],tournament:true});t.B.win=true;t.B.over=true;t.B.endT=0;t.updateBattle(.01);ok(t.repAt('Ashford')===tw0+8,'winning a tournament is worth 8');t.act('back-town');t.act('leave');done();
 // realms tab and save
 G.mode='world';G.modal=false;t.openChar();t.act('char-tab','realms');ok(/Your reputation/.test(panel())&&/Your honor/.test(panel()),'realms tab lists reputation and honor');t.act('char-close');
 const rep=JSON.stringify(P.rep),hon=JSON.stringify(P.honor);t.saveGame();P.rep={};P.honor={};t.act('load');ok(JSON.stringify(P.rep)===rep&&JSON.stringify(P.honor)===hon,'save/load keeps reputation and honor');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
