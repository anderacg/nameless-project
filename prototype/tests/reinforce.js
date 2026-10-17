'use strict';
// Reinforcements: friendly lords near a fight join your side (employer, its allies, or a faction that honors you), and only
// against foes of theirs; an enemy lord's faction and allies join him; helpers fight as their own units, lose their own troops,
// are thanked or routed afterwards, and auto-resolve counts them.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const panel=()=>document.getElementById('panel').innerHTML;
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.encCool=0};
 t.act('begin','soldier');W.critters=[];W.sites=[];W.monsters=[];t.bandits.length=0;
 const mk=(name,fac,dx,n,type)=>({id:name,name,fac,x:P.x+dx,y:P.y,troops:Array(n).fill(type||'hum_spear'),state:'rest',tgt:t.TOWNS[0].name,sd:0,dead:false,cool:0});
 const band=()=>{const b={x:P.x+5,y:P.y,n:6,cool:0,t:0,a:0,kind:'bandits'};t.bandits.push(b);t.bandPower(b);return b};
 P.troops={hum_levy:6};
 // nobody helps a stranger
 const ally=mk('Ser Help','vale',40,10);W.lords=[ally];P.fac=null;P.honor={};world();t.startEncounter({kind:'party',ref:band(),n:6,band:'bandits'});
 ok(!G.enc.allies.length,'a faction that does not know you stays out of it');t.act('flee');
 // your employer's lord does
 P.fac='vale';world();t.startEncounter({kind:'party',ref:band(),n:6,band:'bandits'});ok(G.enc.allies[0]===ally&&/At your side: Ser Help/.test(panel()),'your employer\'s lord joins you against bandits');
 // too far away
 ally.x=P.x+300;t.act('flee');world();t.startEncounter({kind:'party',ref:band(),n:6,band:'bandits'});ok(!G.enc.allies.length,'a lord far away cannot help');t.act('flee');ally.x=P.x+40;
 // honor alone is enough
 P.fac=null;P.honor={vale:30};world();t.startEncounter({kind:'party',ref:band(),n:6,band:'bandits'});ok(G.enc.allies[0]===ally,'a faction that honors you (30) also helps');
 // in battle: their own units, their own losses
 t.act('fight');const B=t.B,au=B.units.filter(u=>u.lord===ally);ok(au.length===10&&au.every(u=>u.team===0&&u.grp&&B.groups[u.grp].ally&&!t.playerGroups().includes(u.grp)),'they fight as 10 units on your side, in their own groups under their own captain, outside your orders');
 const n0=ally.troops.length;au[0].hp=1;t.applyDmg(au[0],50);ok(ally.troops.length===n0-1&&!B.lost.hum_spear,'their dead come out of their army, not yours');
 B.units.filter(u=>u.team===1).forEach(u=>t.applyDmg(u,999));for(let i=0;i<80&&!B.over;i++)t.updateBattle(.05);B.endT=0;t.updateBattle(.01);
 ok(t.honorWith('vale')>30,'winning beside them earns honor');t.act('cont');done();
 // they only join fights against their enemies
 world();const foe=mk('Thane Foe','karn',8,10,'dw_clan');W.lords=[ally,foe];P.fac='vale';P.hostile={karn:G.day+30};
 W.rel[t.rk('vale','karn')]={s:'peace',since:G.day};t.startEncounter({kind:'lord',ref:foe,list:foe.troops.slice()});ok(!G.enc.allies.length,'at peace with the Karn Clans, the Vale lord stays out');t.act('flee');
 W.rel[t.rk('vale','karn')]={s:'war',since:G.day};foe.dead=false;foe.cool=0;world();t.startEncounter({kind:'lord',ref:foe,list:foe.troops.slice()});ok(G.enc.allies[0]===ally,'at war, he rides in');t.act('flee');
 // the enemy's friends join him
 const foe2=mk('Thane Two','karn',-50,8,'dw_axe');W.lords=[ally,foe,foe2];foe.cool=0;world();t.startEncounter({kind:'lord',ref:foe,list:foe.troops.slice()});
 ok(G.enc.foes[0]===foe2&&/Riding to help them: Thane Two/.test(panel()),'another Karn lord nearby rides to help him');
 t.act('fight');ok(t.B.units.filter(u=>u.lord===foe2&&u.team===1).length===8,'his men fight on the enemy side');t.B.over=true;t.B.win=true;t.B.endT=0;t.updateBattle(.01);
 ok(foe2.dead,'winning routes the helper too');t.act('cont');done();
 // auto-resolve counts helpers: a band you could not beat alone
 world();P.troops={hum_levy:2};ally.troops=Array(30).fill('hum_knight');ally.dead=false;W.lords=[ally];P.fac='vale';let wins=0;
 for(let k=0;k<6;k++){world();const b={x:P.x+5,y:P.y,n:14,cool:0,t:0,a:0,kind:'bandits'};t.bandits.push(b);t.bandPower(b);t.startEncounter({kind:'party',ref:b,n:14,band:'bandits'});t.act('auto');if(/Victory/.test(panel()))wins++;t.act('cont');done();ally.troops=Array(30).fill('hum_knight');ally.dead=false;P.troops={hum_levy:2}}
 ok(wins>=4,'with 30 allied knights, auto-resolve wins against 14 bandits ('+wins+'/6)');
 const n1=ally.troops.length;world();const b3={x:P.x+5,y:P.y,n:14,cool:0,t:0,a:0,kind:'bandits'};t.bandits.push(b3);t.bandPower(b3);t.startEncounter({kind:'party',ref:b3,n:14,band:'bandits'});t.act('auto');ok(ally.troops.length<=n1,'and the allies take losses too');t.act('cont');done();
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
