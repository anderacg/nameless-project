'use strict';
// The AI's orders by the ways there are (the owner, 2026-11-08: "fix the auto AI and AI in battle map, especially in the interior
// maps such as caves, fort, etc. make sure they order the unit based on available path"; battle/commander.js PATH_PLACE, SIEGE_AI;
// battlecontrol.js standAt): with the AI on both sides, the game's own switches on (terrain, fog, duels: tests/harness.js turns
// them off), in caves and bandit lairs no group is ever told to stand in rock, and the two sides meet; your army no longer waits at
// the mouth on a line drawn across open ground; at a fort's wall, the attacker's foot work the ram and the gate comes down; off
// (PATH_PLACE, SIEGE_AI), as before. The owner, 2026-11-08: "the player party may be the one who will search while those goblins,
// bandits or monsters may stay at their place if not alerted or detected": none of theirs moves from its post till roused (seeing
// one of yours near, hurt, or alarmed by a roused group near: interior.js insideRoused); your party goes looking and finds them; a
// camp on the open field (a goblin camp, a hideout's tents) held the same way (INTERIOR.holdCamp)
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,W=t.W;
 (0,eval)('TERRAIN.on=true;FOG.on=true;BEAST_TACTICS.on=true;PHYSICS.on=true;DEFENCE.on=true;DUEL.on=true;JOSTLE.on=true;FIELD_SIZES.on=true;EXITS.on=true;COMMAND_POWERS.on=true;INTERIOR.on=true;SIEGE_WALL.on=true;TOWN_WALL.on=true');
 const fight=(start,secs)=>{const keep=Math.random;Math.random=t.seeded(11);const r={rock:0,contact:null,gate:null,ok:false,strayed:0,held:0};
  try{start();const b=t.B;if(!b)return r;r.ok=true;if(b.muster&&b.muster.active)Kit.engage();else if(b.ready)t.beginFight();b.auto=true;const home=new Map();for(const g of Object.values(b.groups))if(g.team!==0)home.set(g,[g.ax,g.ay])
   const R=b.terrain,solid=(x,y)=>R&&R.solid&&R.solid[t.tIx(R,x,y)]===1;
   // (to secs of the battle's own time)
   for(let s=0;b.t<secs&&!b.over&&s<secs*3;s++){for(let k=0;k<20;k++)t.updateBattle(.05);const live=b.units.filter(u=>u.hp>0&&!u.rout&&!u.left);
     if(r.contact==null&&live.some(u=>u.team===0&&live.some(f=>f.team!==0&&Math.hypot(f.x-u.x,f.y-u.y)<60)))r.contact=b.t;
     for(const g of Object.values(b.groups))if(g.ax!=null&&t.grpUnits(g.id).some(u=>u.hp>0)&&solid(g.ax,g.ay))r.rock++;
     if(b.works&&r.gate==null&&b.works.open)r.gate=b.t;
     for(const [g,h] of home){if(g.roused)continue;r.held++;if(Math.hypot(g.ax-h[0],g.ay-h[1])>4)r.strayed++}}
   r.hp=b.works?Math.round(b.works.hp):null;r.end=b.t;r.over=!!b.over;r.alive=[0,1].map(tm=>b.units.filter(u=>u.team===tm&&u.hp>0).length)}
  finally{Math.random=keep;if(t.B){t.B.over=true;t.B=null;try{t.fieldDone()}catch(e){}}G.enc=null;G.site=null;G.bes=null;P.siege=null;G.mode='world';G.modal=false;Kit.world()}return r};
 Kit.begin('soldier',5);Kit.clear();Kit.world();{const r=t.partyRoster(P);r.add('hum_spear',4);r.add('archer',3)}
 const caves=W.sites.filter(s=>s instanceof t.Cave&&!s.cleared).slice(1,3),lairs=W.sites.filter(s=>s instanceof t.Hideout&&s.tunnel&&!s.cleared).slice(0,1);
 const inside=()=>[...caves.map(c=>fight(()=>{Kit.world();Kit.goTo(c.x,c.y+30);t.caveFight(c,3);t.act('fight')},90)),
   ...lairs.map(h=>fight(()=>{Kit.world();Kit.goTo(h.x,h.y+30);h.enter();t.act('site-ask');t.act('in-go');t.act('fight')},90))];
 const on=inside();
 info('runs: '+on.map(r=>'end '+(r.end|0)+(r.over?' over':'')+' alive '+r.alive).join(' | '));
 const sum=(l,k)=>l.reduce((a,r)=>a+(r[k]||0),0);info('inside, orders into rock: '+sum(on,'rock')+'; first contact '+on.map(r=>r.contact==null?'-':r.contact.toFixed(0)).join(', ')+' s');
 ok(on.every(r=>r.ok)&&sum(on,'rock')<=12,'caves and a bandit lair, the AI on both sides: next to no group told to stand in rock ('+sum(on,'rock')+'; some hundreds without PATH_PLACE, 2026-11-08)');
 ok(on.every(r=>!r.strayed)&&on.some(r=>r.held),'theirs at their posts till roused: no group of them sent anywhere before ('+on.map(r=>r.strayed).join(', ')+' strayed; '+on.map(r=>r.held).join(', ')+' group-seconds held)');
 ok(on.every(r=>r.contact!=null&&r.contact<85),'your party goes looking, chamber by chamber at a walk, and finds them in every one, within 85 s ('+on.map(r=>r.contact==null?'never':r.contact.toFixed(0)).join(', ')+')');
// (on the open field: a goblin camp and a hideout's tents, their men at their tents till roused, whoever comes)
 const camps=[W.sites.find(s=>s instanceof t.GoblinCamp&&!s.cleared),W.sites.find(s=>s instanceof t.Hideout&&!s.tunnel&&!s.within&&!(s instanceof t.GoblinCamp)&&!s.cleared)].filter(Boolean);
 const cr=camps.map(c=>fight(()=>{Kit.world();Kit.goTo(c.x,c.y+30);if(c.fight)c.fight(true);else{c.enter();t.act('site-ask');t.act('site-attack')}t.act('fight')},40));
 info('camps ('+camps.map(c=>c.name).join(', ')+'): strayed before roused '+cr.map(r=>r.strayed).join(', ')+', held '+cr.map(r=>r.held).join(', ')+', contact '+cr.map(r=>r.contact==null?'-':r.contact.toFixed(0)).join(', '));
 ok(camps.length===2&&cr.every(r=>r.ok&&!r.strayed&&r.held&&r.contact!=null),'a goblin camp and a bandit hideout\'s tents, fought outside: their men at their tents till roused, and met');
 {const r=t.partyRoster(P);r.add('hum_levy',8);r.add('hum_spear',4)}
 const h=t.TOWNS.find(z=>z.owner&&z.walled&&z.walled()&&t.wallOf(z)>=2);t.Timed.of(P,'hostile').extend(h.owner,60);
 const siege=()=>fight(()=>{Kit.world();Kit.goTo(h.x,h.y+60);P.siege={town:h.name,days:t.RAM_DAYS};G.bes=h;G.mode='besiege';t.startAssault(h,'siege')},55);
 const s1=siege();
 info('the gate of '+h.name+': down at '+(s1.gate==null?'never':s1.gate.toFixed(0)+' s')+' (without SIEGE_AI never touched, 2026-11-08)');
 ok(s1.ok&&s1.gate!=null,'a fort\'s assault under the AI: its foot work the ram, the gate comes down ('+(s1.gate==null?'never':s1.gate.toFixed(0)+' s')+')');
});
