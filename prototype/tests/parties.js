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
 // a band's list and n follow its counts
 {const b=t.bandits[0];const n0=b.n;t.partyAdd(b,'militia',2);ok(b.n===n0+2&&b.list.length===b.n&&b.list===b.troops,'a band’s list and its count follow its soldiers');
  const pw=t.bandPower(b);t.partyRemoveAny(b,2);ok(b.n===n0&&t.bandPower(b)<=pw,'and its power is reckoned anew')}
 // plain data becomes a party where it is changed
 {const raw={x:0,y:0,n:3,kind:'bandits',list:['militia','militia','archer'],t:0,a:0,cool:0};t.bandits.push(raw);ok(raw.list.length===3,'a band made as plain data reads as before');
  t.partyRemove(raw,'militia',1);ok(raw instanceof t.BandParty&&raw.n===2&&raw.tc.militia===1,'and becomes a party the moment its soldiers change');t.bandits.pop()}
 // companions
 {P.comps={brann:{ap:5,role:''}};const c=t.compInit('brann');c.lv=3;P.troops={hum_levy:6};t.cpGive('brann','hum_levy',4);
  ok(c.party instanceof t.CompanionParty&&c.party.tc.hum_levy===4&&P.troops.hum_levy===2,'giving soldiers to a companion moves them as counts');
  c.party.x=P.x;c.party.y=P.y;t.cpTake('brann','hum_levy',2);ok(c.party.tc.hum_levy===2&&P.troops.hum_levy===4,'and taking them back')}
 // your own band is a party too: its counts are P.troops, changed the same way
 {P.troops={hum_levy:3};ok(P instanceof t.PlayerParty&&P instanceof t.Party&&P.size===3&&P.size===t.troopCount(),'your band is a party: '+P.size+' soldiers');
  P.add('hum_bow',2);ok(P.troops.hum_bow===2&&P.size===5,'P.add adds to your troops');ok(P.remove('hum_levy',5)===3&&!P.troops.hum_levy,'P.remove takes what there is');
  ok(P.brain===null&&!W.parties.includes(P),'you are its brain (it is not among the parties the world moves)')}
 // saves keep the counts
 {const L=W.lords.find(l=>!l.dead);L.troops=['hum_knight','hum_knight','hum_spear'];const b=t.bandits[0],bn=b.n;G.mode='world';t.saveGame(true);
  let raw=null;try{raw=JSON.parse(localStorage.getItem(t.slotKey('auto'))||'null')}catch(e){}
  const rl=raw&&raw.world&&raw.world.lords.find(x=>x.id===L.id);ok(rl&&rl.tc&&rl.tc.hum_knight===2&&!rl.troops,'a save keeps a party’s counts, not a list');
  t.loadGame();const L2=W.lords.find(x=>x.id===L.id);ok(L2 instanceof t.LordParty&&L2.troops.length===3&&L2.tc.hum_knight===2&&t.bandits[0].n===bn,'and loading makes them parties again');ok(P instanceof t.PlayerParty&&typeof P.troops==='object'&&!Array.isArray(P.troops),'your band stays a party after loading')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
