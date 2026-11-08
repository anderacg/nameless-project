'use strict';
// The AI's orders by the ways there are (the owner, 2026-11-08: "fix the auto AI and AI in battle map, especially in the interior
// maps such as caves, fort, etc. make sure they order the unit based on available path"; battle/commander.js PATH_PLACE, SIEGE_AI;
// battlecontrol.js standAt): with the AI on both sides, the game's own switches on (terrain, fog, duels: tests/harness.js turns
// them off), in caves and bandit lairs no group is ever told to stand in rock, and the two sides meet; your army no longer waits at
// the mouth on a line drawn across open ground; at a fort's wall, the attacker's foot work the ram and the gate comes down; off
// (PATH_PLACE, SIEGE_AI), as before
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,W=t.W;
 (0,eval)('TERRAIN.on=true;FOG.on=true;BEAST_TACTICS.on=true;PHYSICS.on=true;DEFENCE.on=true;DUEL.on=true;JOSTLE.on=true;FIELD_SIZES.on=true;EXITS.on=true;COMMAND_POWERS.on=true;INTERIOR.on=true;SIEGE_WALL.on=true;TOWN_WALL.on=true');
 const fight=(start,secs)=>{const keep=Math.random;Math.random=t.seeded(11);const r={rock:0,contact:null,gate:null,ok:false};
  try{start();const b=t.B;if(!b)return r;r.ok=true;if(b.ready)t.beginFight();b.auto=true;for(const g of Object.values(b.groups))if(g.team===1)g.roused=true;
   const R=b.terrain,solid=(x,y)=>R&&R.solid&&R.solid[t.tIx(R,x,y)]===1;
   for(let s=0;s<secs&&!b.over;s++){for(let k=0;k<20;k++)t.updateBattle(.05);const live=b.units.filter(u=>u.hp>0&&!u.rout&&!u.left);
     if(r.contact==null&&live.some(u=>u.team===0&&live.some(f=>f.team!==0&&Math.hypot(f.x-u.x,f.y-u.y)<60)))r.contact=b.t;
     for(const g of Object.values(b.groups))if(g.ax!=null&&t.grpUnits(g.id).some(u=>u.hp>0)&&solid(g.ax,g.ay))r.rock++;
     if(b.works&&r.gate==null&&b.works.open)r.gate=b.t}
   r.hp=b.works?Math.round(b.works.hp):null}
  finally{Math.random=keep;if(t.B){t.B.over=true;t.B=null;try{t.fieldDone()}catch(e){}}G.enc=null;G.site=null;G.bes=null;P.siege=null;G.mode='world';G.modal=false;Kit.world()}return r};
 Kit.begin('soldier',5);Kit.clear();Kit.world();{const r=t.partyRoster(P);r.add('hum_spear',4);r.add('archer',3)}
 const caves=W.sites.filter(s=>s instanceof t.Cave&&!s.cleared).slice(0,3),lairs=W.sites.filter(s=>s instanceof t.Hideout&&s.tunnel&&!s.cleared).slice(0,2);
 const inside=()=>[...caves.map(c=>fight(()=>{Kit.world();Kit.goTo(c.x,c.y+30);t.caveFight(c,3);t.act('fight')},60)),
   ...lairs.map(h=>fight(()=>{Kit.world();Kit.goTo(h.x,h.y+30);h.enter();t.act('site-ask');t.act('in-go');t.act('fight')},60))];
 const on=inside();t.PATH_PLACE.on=false;const off=inside();t.PATH_PLACE.on=true;
 const sum=(l,k)=>l.reduce((a,r)=>a+(r[k]||0),0);info('inside, orders into rock: '+sum(on,'rock')+' (off: '+sum(off,'rock')+'); first contact '+on.map(r=>r.contact==null?'-':r.contact.toFixed(0)).join(', ')+' s (off: '+off.map(r=>r.contact==null?'-':r.contact.toFixed(0)).join(', ')+')');
 ok(on.every(r=>r.ok)&&sum(on,'rock')<=sum(off,'rock')/10,'caves and bandit lairs, the AI on both sides: no group told to stand in rock ('+sum(on,'rock')+', '+sum(off,'rock')+' without PATH_PLACE)');
 ok(on.every(r=>r.contact!=null&&r.contact<55),'and the two sides meet in every one, within 55 s ('+on.map(r=>r.contact==null?'never':r.contact.toFixed(0)).join(', ')+')');
 {const r=t.partyRoster(P);r.add('hum_levy',8);r.add('hum_spear',4)}
 const h=t.TOWNS.find(z=>z.owner&&z.walled&&z.walled()&&t.wallOf(z)>=2);t.Timed.of(P,'hostile').extend(h.owner,60);
 const siege=()=>fight(()=>{Kit.world();Kit.goTo(h.x,h.y+60);P.siege={town:h.name,days:t.RAM_DAYS};G.bes=h;G.mode='besiege';t.startAssault(h,'siege')},75);
 const s1=siege();t.SIEGE_AI.on=false;const s0=siege();t.SIEGE_AI.on=true;
 info('the gate of '+h.name+': down at '+(s1.gate==null?'never':s1.gate.toFixed(0)+' s')+' (off: '+(s0.gate==null?'never, '+s0.hp+' hp left':s0.gate.toFixed(0)+' s')+')');
 ok(s1.ok&&s1.gate!=null,'a fort\'s assault under the AI: its foot work the ram, the gate comes down ('+(s1.gate==null?'never':s1.gate.toFixed(0)+' s')+')');
});
