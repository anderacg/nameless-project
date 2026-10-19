'use strict';
// Parties: lords, your companions' parties, bandit bands and patrols keep their soldiers as counts by kind (as your own band
// does); their troops are a read-only list built from the counts. Changes go through the party, and saves keep the counts.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;
 const all=W.parties;
 ok(all.length&&all.every(p=>p instanceof t.Party&&p.tc&&typeof p.tc==='object'),'every party on the map ('+all.length+') keeps its soldiers as counts');
 const kinds=[...new Set(all.map(p=>p.constructor.name))].sort().join(', ');ok(/LordParty/.test(kinds)&&/BandParty/.test(kinds)&&/PatrolParty/.test(kinds),'lords, bands and patrols each of their kind ('+kinds+')');
 // the list is a view of the counts
 {const L=W.lords.find(l=>!l.dead);L.troops=['hum_spear','hum_spear','hum_bow'];ok(L.tc.hum_spear===2&&L.tc.hum_bow===1&&L.troops.length===3&&L.size===3,'setting a lord’s troops sets its counts');
  let threw=false;try{L.troops.push('hum_bow')}catch(e){threw=true}ok(threw&&L.size===3,'the list cannot be changed behind the party’s back');
  L.add('hum_bow',2);ok(L.tc.hum_bow===3&&L.troops.length===5,'add');ok(L.remove('hum_spear',5)===2&&!L.has('hum_spear')&&L.troops.length===3,'remove takes what there is');
  const got=L.removeAny(2);ok(got.length===2&&L.size===1,'removeAny takes at random');
  L.troops=Array(100).fill('hum_levy');L.cull(.5);ok(L.size>25&&L.size<75,'cull loses about that share ('+L.size+' of 100)')}
 // a band's n follows its counts; its power is kept until they change
 {const b=t.bandits[0];const n0=b.n;b.add('militia',2);ok(b.n===n0+2&&b.troops.length===b.n,'a band’s count follows its soldiers');
  const pw=b.power();ok(b.pw===pw&&pw===t.rating(b.troops,t.chiefLv(b)),'its power: its fighters, hardened by its chieftain ('+pw+')');
  b.removeAny(2);ok(b.n===n0&&!b.pw&&b.power()<=pw,'and reckoned anew when they change')}
 // plain data is made a party where it is made or loaded; a band with only its number musters its fighters then, not when measured
 {const raw=t.asParty({x:0,y:0,n:4,kind:'raiders',t:0,a:0,cool:0});ok(raw instanceof t.BandParty&&raw.n===4&&raw.troops.length===4,'a band made with only its number musters its fighters');
  const tc=JSON.stringify(raw.tc),m=raw.power();ok(m>0&&raw.power()===m&&JSON.stringify(raw.tc)===tc,'and measuring its power changes nothing ('+m+')')}
 // each kind says for itself what it is, how strong, its name and whose it is
 {const L=W.lords.find(l=>!l.dead),b=t.bandits[0],tw=t.TOWNS.find(x=>x.owner),
   pt=t.asParty({pt:true,watch:'day',home:tw.name,fac:tw.owner,troops:['hum_spear','hum_bow'],x:0,y:0,cool:0,dir:1}),cv=t.asParty({cv:true,fac:tw.owner,from:tw.name,to:tw.name,x:0,y:0,goods:{},guards:3,cool:0,dir:1});
  ok([L,b,pt,cv,P].map(q=>q.mapKind).join()==='lord,band,patrol,caravan,you','what it is');
  ok(L.power()===t.rating(L.troops)&&pt.power()===t.rating(pt.troops)&&cv.power()===t.rating(cv.troops)&&P.power()===t.partyPower(),'how strong');
  ok(L.label()===L.name&&pt.label()==='Day watch of '+tw.name&&cv.label()==='Caravan of '+tw.name&&b.label()===t.BANDS[b.kind][0].replace(' ahead','')&&P.label()==='Your band','its name');
  ok(L.faction===L.fac&&pt.faction===tw.owner&&cv.faction===tw.owner&&b.faction===null&&P.faction==='player','and whose it is')}
 // companions
 {P.comps={brann:{ap:5,role:''}};const c=t.compInit('brann');c.lv=3;P.troops={hum_levy:6};t.cpGive('brann','hum_levy',4);
  ok(c.party instanceof t.CompanionParty&&c.party.tc.hum_levy===4&&P.troops.hum_levy===2,'giving soldiers to a companion moves them as counts');
  ok(c.party.mapKind==='cparty'&&c.party.label()===t.COMPS.brann.short+'’s party'&&c.party.faction==='player'&&c.party.power()===t.power(c.party.troops)*(1+.04*t.compSkill('brann','lead')),'a companion’s party: yours, as strong as its soldiers and his Leadership');
  c.party.x=P.x;c.party.y=P.y;t.cpTake('brann','hum_levy',2);ok(c.party.tc.hum_levy===2&&P.troops.hum_levy===4,'and taking them back')}
 // your own band is a party too: its counts are P.troops, changed the same way
 {P.troops={hum_levy:3};ok(P instanceof t.PlayerParty&&P instanceof t.Party&&P.size===3&&P.size===t.troopCount(),'your band is a party: '+P.size+' soldiers');
  P.add('hum_bow',2);ok(P.troops.hum_bow===2&&P.size===5,'P.add adds to your troops');ok(P.remove('hum_levy',5)===3&&!P.troops.hum_levy,'P.remove takes what there is');
  ok(P.brain===null&&!W.parties.includes(P),'you are its brain (it is not among the parties the world moves)')}
 // saves keep the counts
 {const L=W.lords.find(l=>!l.dead);L.troops=['hum_knight','hum_knight','hum_spear'];const b=t.bandits[0],bn=b.n;G.mode='world';t.saveGame(true);
  let raw=null;try{raw=JSON.parse(localStorage.getItem(t.slotKey('auto'))||'null')}catch(e){}
  const rl=raw&&raw.world&&raw.world.lords.find(x=>x.id===L.id);ok(rl&&rl.tc&&rl.tc.hum_knight===2&&!rl.troops,'a save keeps a party’s counts, not a list');
  t.loadGame();const L2=W.lords.find(x=>x.id===L.id);ok(L2 instanceof t.LordParty&&L2.troops.length===3&&L2.tc.hum_knight===2&&t.bandits[0].n===bn&&t.cparties().length===1&&t.cparties().every(q=>q instanceof t.CompanionParty),'and loading makes them parties again');ok(P instanceof t.PlayerParty&&typeof P.troops==='object'&&!Array.isArray(P.troops),'your band stays a party after loading')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
