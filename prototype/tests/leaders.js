'use strict';
// Leaders: the hero, lords, companions and bandit chieftains grow by one set of rules (a level from experience, level x 60 to
// the next; disciplines by use, (level + 1) x 20). Chieftains are named, grow only by winning battles, harden their band,
// carry a bounty that is yours when you hand them over, and the taverns talk of the most wanted.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])},world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null};
 // one rule for every kind
 const L=W.lords[0];t.lordStats(L);L.lv=1;L.xp=0;P.comps={brann:{ap:0,role:''}};const c=t.compInit('brann');c.lv=1;c.xp=0;
 const ch=t.newChief('bandits',1);t.bandits.push({x:-999,y:-999,n:4,kind:'bandits',list:['militia'],t:0,a:0,cool:0,ld:ch});
 P.level=1;P.xp=0;const ups=[t.leaderOf(P),t.leaderOf(L),t.leaderOf(c,'brann'),t.leaderOf(ch)].map(x=>x.gainXp(59)+x.gainXp(1));
 ok(ups.every(u=>u===1)&&P.level===2&&L.lv===2&&c.lv===2&&ch.lv===2,'hero, lord, companion and chieftain all reach level 2 at 60 experience ('+ups.join(', ')+')');
 ok([t.leaderOf(P),t.leaderOf(L),t.leaderOf(c),t.leaderOf(ch)].map(x=>x.role).join()==='hero,lord,companion,chieftain'&&[P,L,c,ch].every(o=>t.charOf(o) instanceof t.Character&&t.charOf(o) instanceof t.Unit),'each one Character (a Unit), in its own role');
 {const s0=P.sk.lead.xp,l0=L.sk.lead.xp;t.train('lead',5);t.lordTrain(L,'lead',5);ok(P.sk.lead.xp-s0>L.sk.lead.xp-l0,'you learn faster than a lord, by your Charisma and your knacks')}
 {c.lv=2;c.xp=0;c.perkPend=0;t.compXp('brann',2*60+1);ok(c.lv===3&&c.perkPend===1,'a companion still earns a perk every third level')}
 {const tp=P.tp||0;t.gainXp(P.level*60);ok(P.tp===tp+1,'and you a skill point a level')}
 // chieftains
 t.bandits.length=0;for(let i=0;i<6;i++)t.spawnBandit(true);const lairs=W.sites.filter(s=>s.type==='camp'||s.type==='hideout');
 ok(t.bandits.every(b=>b.ld&&b.ld.name)&&lairs.every(s=>s.ld&&s.ld.name),'every band, bandit camp and hideout has a named chieftain');
 {const names=t.allChiefs().map(x=>x.name);ok(new Set(names).size===names.length,'no two share a name ('+names.length+')')}
 {const b=t.bandits[0];b.ld.lv=1;b.pw=0;const p1=t.bandPower(b);b.ld.lv=7;b.pw=0;const p7=t.bandPower(b);ok(p7>p1&&t.bountyOf(b.ld)>t.bountyOf({lv:1}),'a stronger chieftain makes a stronger band, and a bigger bounty ('+p1+' → '+p7+', '+t.bountyOf(b.ld)+' gold)');b.ld.lv=1;b.pw=0}
 {const b=t.bandits[0];ok(/Led by .+ \(level \d+\) · bounty \d+ gold/.test(t.tipFor(b)),'its tooltip names the chieftain, level and bounty');
  const s=lairs[0];ok(/Led by/.test(t.tipFor(s)),'and so does a camp or hideout’s')}
 // it grows only by winning
 {const b=t.bandits[0],x0=b.ld.xp+b.ld.lv*1000;t.updateWorld&&0;ok(b.ld.wins===0,'a new chieftain has won nothing');
  t.chiefWins(b,8);ok(b.ld.wins===1&&b.ld.xp+b.ld.lv*1000>x0,'a won battle makes it grow')}
 // beating you
 {world();P.troops={hum_levy:2};const b=t.bandits[0];b.x=P.x+8;b.y=P.y;const w0=b.ld.wins;t.startEncounter({kind:'party',ref:b,n:b.n,list:b.list.slice(),band:'bandits'});
  ok(G.enc.lv===t.chiefLv(b),'its band fights at the level its chieftain gives ('+G.enc.lv+')');t.concludeEncounter(false,{},0,true,[]);t.act('cont');done();
  ok(b.ld.wins===w0+1,'when it beats you, it grows')}
 // the bounty
 {world();P.troops={hum_levy:20};const b=t.bandits[1];b.x=P.x+8;b.y=P.y;const bo=t.bountyOf(b.ld),g0=P.gold;t.startEncounter({kind:'party',ref:b,n:b.n,list:b.list.slice(),band:'bandits'});
  const ld=b.ld;t.concludeEncounter(true,{},0,true,[]);const cap=(P.captives||[]).findIndex(c=>c.ld===ld);ok(cap>=0&&new RegExp('take '+ld.name).test(document.getElementById('panel').innerHTML),'break its band and its chieftain is your captive');t.act('cont');done();
  const g1=P.gold;t.act('ct-hand',String(cap));ok(P.gold-g1===bo&&!(P.captives||[]).some(c=>c.ld===ld),'hand him over and the bounty is yours ('+bo+' gold)')}
 // the taverns
 {world();const top=t.mostWanted(1)[0];top.c.lv=9;G.lastTown=null;t.enterTown(t.townBy('Ashford'));t.act('tab','tavern');
  ok(new RegExp('most wanted is '+top.c.name+' \\(level 9\\)').test(document.getElementById('panel').innerHTML),'the taverns talk of the most wanted: '+top.c.name);t.act('leave');done()}
 // a camp that returns has a new chieftain
 {const s=W.sites.find(x=>x.type==='camp'),old=s.ld.name;t.clearPlace(s,10);G.day=s.back;t.siteDay();ok(!s.cleared&&s.ld&&s.ld!==null&&s.ld.lv>=1,'a cleared camp returns under a new chieftain ('+old+' → '+s.ld.name+')')}
 // saves
 {world();const b=t.bandits[0],n=b.ld.name,lv=b.ld.lv;t.saveGame(true);t.loadGame();const b2=t.bandits.find(x=>x.ld&&x.ld.name===n);ok(b2&&b2.ld.lv===lv&&t.leaderOf(b2.ld).role==='chieftain','a save keeps the chieftains')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
