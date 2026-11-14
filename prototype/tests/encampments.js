'use strict';
// Encampments (doc/ENCAMPMENTS_DESIGN.md, phase 1; world/encampments.js, data/encampments.js): camps where people live. Every
// kind on the map, one at least, as many as the land gives (the owner, 2026-11-14: "at least one for each and scale based on the
// world"); its tents by its people (a tent for every ENCAMP.tents.per); its people living their day within your sight by the
// clock (asleep by night with a watch, round the fire at dawn and dusk, at work by day, the pilgrims at prayer at midday), in
// their tents when a band comes near, forgotten far off, and never drawing on the world's Math.random; each kind's page (the
// hermit's counsel, alms and volunteers at the refugees'); their people saved, and an older save given them.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,K=t.ENCAMP_KINDS,F=t.ENCAMP.folk,q=s=>document.querySelector(s),panel=()=>q('#panel').innerHTML;
 Kit.begin('soldier',1);Kit.clear();Kit.world();
 const camps=()=>W.sites.filter(s=>s instanceof t.Encampment),of=k=>camps().filter(s=>s.kind===k);
 // ---- the table
 ok(K.every(k=>k.roles.every(([r])=>t.ENCAMP_ROLES[r])&&k.pop[0]>=1&&k.pop[1]>=k.pop[0]&&['settled','seasonal','wandering'].includes(k.life)&&t.ENCAMP_GROUND[k.ground]&&k.count>=1),
  'every kind ('+K.length+') has its roles, its people, its way of living and its ground: '+K.map(k=>k.key+' '+k.life+' '+k.ground).join(', '));
 ok(t.TRAVELERS===K&&K.slice(0,6).map(k=>k.n).join()==='Merchant caravan,Dwarf prospectors,Elf wanderers,Orc hunters,Pilgrims,Minstrels','the old travellers are its first six, as they were (a save’s kind)');
 // ---- counts by the land, one at least
 {const land=t.worldMeasures(t.WM).land,n=K.map((k,i)=>of(i).length),want=K.map((k,i)=>t.Encampment.count(i,t.WM));
  ok(n.every((c,i)=>c===want[i]&&c>=1)&&want.every((c,i)=>c===Math.max(1,Math.round(K[i].count*Math.sqrt(land)))),'each kind as many as the land gives ('+land.toFixed(2)+' times the base), one at least: '+K.map((k,i)=>k.key+' '+n[i]).join(', '));
  const m0=window.worldMeasures;try{window.worldMeasures=()=>({land:.2});ok(K.every((k,i)=>t.Encampment.count(i,{})===1),'a small world: one of each')}finally{window.worldMeasures=m0}
  ok(camps().every(s=>t.Encampment.spec(s.kind).ground(s.tx,s.ty)&&t.encampClear(s.tx,s.ty)),'each on its kind’s ground, with room for its tents')}
 // ---- people and tents
 ok(camps().every(s=>s.pop>=s.TR.pop[0]&&s.pop<=s.TR.pop[1]&&s.tents===Math.min(t.ENCAMP.tents.most,Math.max(1,Math.ceil(s.pop/t.ENCAMP.tents.per)))),'each camp’s people in its kind’s range, a tent for every '+t.ENCAMP.tents.per+' ('+camps().slice(0,6).map(s=>s.pop+':'+s.tents).join(', ')+')');
 {const s=of(4).sort((a,b)=>b.pop-a.pop)[0],h=of(8)[0];s.seen=true;h.seen=true;
  const L=t.CampSite.layout(s.key,s.x,s.y,s.pop,t.ENCAMP.tents.per,t.ENCAMP.tents.most);
  ok(L.length>=1&&L.length<=s.tents&&L.every(p=>t.CampSite.tentOk(p.x,p.y)),'its tents laid round its fire where they may stand: '+L.length+' of '+s.tents+' for '+s.pop+' pilgrims');
  ok(h.pop===1&&h.tents===1,'the hermit lives alone in one tent');
  // ---- their day (Clock.frac), as you come near: placed where the hour has them
  const near=(s,fr)=>{t.CampFolk.forget(s);Kit.goTo(s.x,s.y+60);G.clock=t.DAY*fr;for(let i=0;i<6;i++)t.CampFolk.step(.05);return t.CampFolk.of.get(s)};
  const r0=Math.random;let draws=0;Math.random=()=>{draws++;return r0()};let C;
  try{C=near(s,.7)}finally{Math.random=r0}
  ok(C&&C.ppl.length===Math.min(s.pop,F.most)&&C.ppl.filter(p=>!p.hid).length===C.ppl.filter(p=>p.watch==='fire'||p.watch==='ring').length,'by night they sleep in their tents ('+C.ppl.filter(p=>p.hid).length+' of '+C.ppl.length+'), their watch awake');
  ok(!draws,'their life draws nothing from the world’s Math.random ('+draws+')');
  C=near(s,.22);ok(C.ppl.some(p=>p.role==='priest')&&C.ppl.filter(p=>p.R.work==='pray').every(p=>p.kneel&&Math.hypot(p.x-p.seat.x,p.y-p.seat.y)<2),'at midday the pilgrims kneel in prayer round the fire');
  C=near(s,.45);ok(C.ppl.every(p=>p.mode==='seat'&&!p.hid),'at dusk everyone gathers at the fire');
  {const hu=of(3)[0];hu.seen=true;W.monsters=W.monsters.filter(m=>Math.hypot(m.x-hu.x,m.y-hu.y)>F.danger*3);const H=near(hu,.15),out=H.ppl.filter(p=>p.R.work==='out');
   ok(out.length&&out.every(p=>Math.hypot(p.x-hu.x,p.y-hu.y)>=F.out[0]*t.TILE*.9),'by day the orc hunters are out on their ground, '+F.out.join('-')+' tiles off ('+out.map(p=>(Math.hypot(p.x-hu.x,p.y-hu.y)/t.TILE).toFixed(1)).join(', ')+')');
   const p=out[0];for(let i=0;i<400&&p.leg!=='back';i++)t.CampFolk.step(.1);const d0=Math.hypot(p.x-p.door.x,p.y-p.door.y);for(let i=0;i<5;i++)t.CampFolk.step(.1);
   ok(p.leg==='back'&&Math.hypot(p.x-p.door.x,p.y-p.door.y)<d0,'after his work there he walks back to his tent ('+p.leg+')')}
  // ---- danger: a band near sends them in, the guards to the fire
  {const m=of(0)[0];m.seen=true;let D=near(m,.2);const b=t.asParty({x:m.x+40,y:m.y,n:8,kind:'bandits',list:t.makeEnemies(8,false,'bandits'),t:0,a:0,idle:false,cool:0,ld:null});t.bandits.push(b);
   for(let i=0;i<200;i++)t.CampFolk.step(.1);D=t.CampFolk.of.get(m);
   ok(D.danger&&D.ppl.filter(p=>p.role!=='guard').every(p=>p.hid)&&D.ppl.filter(p=>p.role==='guard').every(p=>!p.hid&&p.mode==='seat'),'a band near: the folk hide in their tents, the guards stand at the fire');
   t.bandits.splice(t.bandits.indexOf(b),1)}
  // ---- forgotten far off; drawn only in your sight
  {Kit.goTo(s.x,s.y+60);G.clock=t.DAY*.2;t.CampFolk.step(.05);const ents=[];t.drawWorld();const cam={x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)};
   const S=t.yourSight(),n0=t.CampFolk.of.get(s).ppl.filter(p=>!p.hid&&S.sees(p.x,p.y,1.2)).length;s.draw(ents,cam,t.vis());
   ok(n0>0&&ents.length>=n0,'its people drawn about their tents ('+n0+' in sight)');
   const sv=S.sees;try{S.sees=()=>false;const e2=[];s.draw(e2,cam,t.vis());ok(e2.length===ents.length-n0,'out of your sight, its tents but none of them')}finally{S.sees=sv}
   const far=t.TOWNS.reduce((a,b)=>Math.hypot(b.x-s.x,b.y-s.y)>Math.hypot(a.x-s.x,a.y-s.y)?b:a);Kit.goTo(far.x,far.y);t.CampFolk.step(.05);ok(!t.CampFolk.of.has(s),'far off, they are forgotten (made again from its seed when you come back)')}
  // ---- each kind's pieces round its tents: as many as it has, where the ground lets them stand, clear of its tents and one another
  {const bad=[];let n=0,w=0;for(const x of camps()){const L=t.CampSite.layout(x.key,x.x,x.y,x.pop,t.ENCAMP.tents.per,t.ENCAMP.tents.most),pr=x.props(),want=x.TR.props.reduce((a,b)=>a+b[1],0);n+=pr.length;w+=want;
     if(pr.length>want||pr.some(q=>!t.CampSite.tentOk(q.x,q.y)||L.some(z=>Math.hypot(z.x-q.x,z.y-q.y)<t.ENCAMP_PROPS.gap)))bad.push(x.name)}
   ok(!bad.length&&n>=w*.85,'each camp’s pieces (wagons, racks of hides, charcoal mounds...) round its tents: '+n+' of '+w+' laid'+(bad.length?' (wrong: '+bad.join(', ')+')':''));
   const bu=of(6)[0];ok(bu.props().some(q=>q.type==='mound')&&t.propPic({type:'mound',s:1},'grass').width===16&&t.propPic({type:'rack',s:1},'grass').width===16&&t.propPic({type:'wagon',s:1},'grass').width>0,'the charcoal burners’ mounds, the hunters’ racks drawn here, the wagons the engine’s')}
  // ---- their animals: the prospectors' goats, the nomads' camels and goats, tethered past the tents on ground they may stand,
  // grazing round it by day, still by night; and the woodpile drawn here, logs stacked
  {const pr=of(1)[0];pr.seen=true;W.monsters=W.monsters.filter(z=>Math.hypot(z.x-pr.x,z.y-pr.y)>F.danger*3);const A=near(pr,.2),b=A.beasts[0],G2=t.ENCAMP.folk.graze;
   ok(A.beasts.length===2&&A.beasts.every(z=>z.id==='goat'&&t.passable(t.tAt(Math.floor(z.x/t.TILE),Math.floor(z.y/t.TILE)))&&A.L.every(q=>Math.hypot(q.x-z.x,q.y-z.y)>=10)),'the prospectors\u2019 two pack goats, tethered clear of the tents ('+A.beasts.map(z=>z.id).join(', ')+')');
   let far=0,moved=0;const x0=b.x,y0=b.y;for(let i=0;i<300;i++){t.CampFolk.step(.1);far=Math.max(far,Math.hypot(b.x-b.hx,b.y-b.hy))}moved=Math.hypot(b.x-x0,b.y-y0)+b.walked;
   ok(moved>0&&far<=G2.r+.5,'by day it grazes round its tether (walked '+b.walked.toFixed(1)+' px, at most '+far.toFixed(1)+' px out)');
   G.clock=t.DAY*.7;const w0=b.walked;for(let i=0;i<100;i++)t.CampFolk.step(.1);ok(b.walked===w0,'by night it stands');
   const no=of(7)[0];if(no){no.seen=true;const N2=near(no,.2);ok(N2.beasts.some(z=>z.id==='camel')&&N2.beasts.some(z=>z.id==='goat'),'the nomads\u2019 camels and goats ('+N2.beasts.map(z=>z.id).join(', ')+')')}
   ok(t.propPic({type:'woodpile',s:2},'grass').width===16&&!t.ENCAMP_PROPS.woodpile.model,'a woodpile drawn here: logs stacked, their cut ends out')}
  // ---- a click on one of them: his name, and the camp's page at his place there, his greeting over it
  {const m=of(0)[0];m.seen=true;W.monsters=W.monsters.filter(z=>Math.hypot(z.x-m.x,z.y-m.y)>F.danger*3);const D=near(m,.2);t.drawWorld();
   const talk=role=>{const p=D.ppl.find(z=>z.role===role&&!z.hid);if(!p)return null;Kit.world();G.lastSite=null;P.x=p.x;P.y=p.y+8;const o=t.pickAt(p.x,p.y-4);if(o!==p)return 'picked '+(o&&(o.name||o.mapKind));t.interact(o);return p};
   const tr=talk('trader');ok(tr&&tr.name&&G.site===m&&G.siteTab==='trade'&&panel().includes(tr.name)&&/wares/.test(panel()),'a trader clicked: '+(tr&&tr.name)+' opens the camp at its wagons, greeting you');
   ok(/Click: talk/.test(tr.tip())&&tr.tip().includes(tr.name),'his tip: his name and calling ('+tr.tip().replace(/<[^>]+>/g,' ').trim()+')');
   const gd=talk('guard');ok(gd&&G.site===m&&G.siteTab==='hire'&&panel().includes(gd.name),'a guard: the sellswords');
   const ck=talk('cook');ok(ck&&G.siteTab==='fire'&&/bowl/.test(panel()),'the cook: the fire');t.act('site-leave');
   const hd=D.ppl.find(z=>z.role==='trader');hd.hid=true;ok(!t.CampFolk.all().includes(hd)&&!hd.inView(t.vis()),'one in his tent cannot be clicked');hd.hid=false}
  // ---- out to work by the router's ways: round water and rock, on ground one may walk
  {const hu=of(3)[1]||of(3)[0];hu.seen=true;W.monsters=W.monsters.filter(z=>Math.hypot(z.x-hu.x,z.y-hu.y)>F.danger*3);const H=near(hu,.1),p=H.ppl.find(z=>z.R.work==='out');
   p.x=p.door.x;p.y=p.door.y;p.leg='back';t.CampFolk.aim(H,p,'work');const d0=Math.hypot(p.x-p.spot.x,p.y-p.spot.y);let wet=0,steps=0;for(let i=0;i<600&&Math.hypot(p.x-p.tx,p.y-p.ty)>1.5;i++){t.CampFolk.step(.1);steps++;if(!t.passable(t.tAt(Math.floor(p.x/t.TILE),Math.floor(p.y/t.TILE))))wet++}
   ok(d0>t.ENCAMP.folk.route*t.TILE&&Math.hypot(p.x-p.spot.x,p.y-p.spot.y)<=1.5&&!wet&&t.Router.reach({x:hu.x,y:hu.y},p.spot),'a hunter walks out to his spot by the router’s ways, never over water or rock ('+(d0/t.TILE).toFixed(1)+' tiles, '+steps+' steps)')}
  // ---- the pages: each kind's places
  const go=x=>{Kit.world();x.seen=true;P.x=x.x;P.y=x.y+20;G.lastSite=null;t.interact(x);return [...document.querySelectorAll('.rail-i .ri-n')].map(b=>b.textContent).join()};
  P.gold=500;
  {const tabs=go(h);t.act('site-tab','fire');ok(G.site===h&&tabs==='Campfire'&&/hermit/i.test(panel())&&q('[data-act="site-counsel"]'),'the hermit’s camp: no wares, no sellswords, his fire and his counsel ('+tabs+')');
   const seen0=W.sites.filter(x=>x.seen).length;t.act('site-counsel');ok(W.sites.filter(x=>x.seen).length>seen0&&h.counsel===G.day&&q('[data-act="site-counsel"]').disabled,'his counsel puts places on your map, once a week')}
  {const rf=of(9)[0],tabs=go(rf);t.act('site-tab','fire');ok(G.site===rf&&tabs==='Volunteers,Campfire'&&q('[data-act="site-alms"]'),'the refugees’ camp: volunteers and alms by the fire ('+tabs+')');
   const r0=P.renown,g0=P.gold;t.act('site-alms');ok(P.renown===r0+1&&P.gold===g0-20&&rf.helped===1,'alms: 20 gold, renown +1');
   ok(rf.unit===t.peasantLevy(rf.folkRace),'its volunteers are levies of its people ('+t.ST[rf.unit].n+')');
   const n0=rf.pop,w=rf.swords()[0];P.troops={};t.act('site-tab','hire');t.partyRoster(P).add(w.k,1,'new');const ug=t.partyRoster(P).groups.find(x=>x.type===w.k);t.act('site-rec-refill',ug.id);ok(rf.pop===n0-1,'one who follows you leaves the camp ('+n0+' → '+rf.pop+')')}
  {const tabs=go(of(0)[0]);ok(/^Wagons,Sellswords,Campfire$/.test(tabs),'a merchants’ camp: wagons, sellswords, the fire ('+tabs+')')}
  {const tabs=go(of(6)[0]);ok(tabs==='Wagons,Campfire'&&/stay/i.test(panel()),'charcoal burners: their wares and fire; they stay ('+tabs+')')}
  t.act('site-leave');
  // ---- saved; an older save's camp given its people
  {G.mode='world';t.saveGame();const snap=JSON.stringify(camps().map(x=>[x.kind,x.pop,x.race||'']));W.sites=[];t.act('load');
   ok(JSON.stringify(camps().map(x=>[x.kind,x.pop,x.race||'']))===snap,'their kinds and people survive a reload');
   const old=t.siteOf({i:999,type:'travelers',kind:4,tx:5,ty:5,x:88,y:88,seed:3,seen:false,cleared:false,back:0,stock:{},until:9});ok(old.pop===11&&old.folkRace==='human','an older save’s camp: its people the middle of its kind’s ('+old.pop+')')}
 }
});
