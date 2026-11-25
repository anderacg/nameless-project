'use strict';
// Who lives at a bandit camp and a hideout (the owner, 2026-11-25: "Hideout should be the same as camp, while camp is smaller around 1-6
// men, hideout is bigger and more stationed with more population"; world/sites.js LAIR_LIFE, Lair life; world/sitelife.js): both have
// residents of their own; a camp 1 to 6, a hideout 10 to 16, filling up as the days go and taking in one a day after its losses; the
// bands shelter in both by night and join a fight there; a lair's people stay underground; a camp a tent or two, a hideout up to six;
// a hideout's hoard in its stash (LAIR_HOARD).
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,SL=t.SiteLife,LL=t.LAIR_LIFE;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);G.paused=true;
 const C=t.W.sites.filter(s=>s instanceof t.BanditCamp),H=t.W.sites.filter(s=>s instanceof t.Hideout&&!(s instanceof t.GoblinCamp)&&!s.within),Gb=t.W.sites.filter(s=>s instanceof t.GoblinCamp);
 ok(C.length>0&&H.length>0,'bandit camps ('+C.length+') and hideouts ('+H.length+')');
 // (how many: a camp 1-4 at the start, a hideout 10-14; at most 6 and 16; its chieftain one of them)
 const cn=C.map(s=>SL.ensure(s).length),hn=H.map(s=>SL.ensure(s).length);info('camps: '+cn.join(' ')+'; hideouts: '+hn.join(' '));
 ok(cn.every(n=>n>=LL.camp.n[0]&&n<=LL.camp.n[1]),'a bandit camp starts with 1 to 4 ('+Math.min(...cn)+'-'+Math.max(...cn)+')');
 ok(hn.every(n=>n>=LL.hideout.n[0]&&n<=LL.hideout.n[1]),'a hideout starts with 10 to 14 ('+Math.min(...hn)+'-'+Math.max(...hn)+')');
 ok([...C,...H].every(s=>SL.ensure(s).filter(p=>p.type==='chief').length===1&&s.foes().length===SL.ensure(s).length),'its chieftain one of them; its fight its residents');
 const g=G.day;try{G.day=600;ok(C.every(s=>s.lifeTarget()===LL.camp.most)&&H.every(s=>s.lifeTarget()===LL.hideout.most),'in time a camp holds 6, a hideout 16, no more')}finally{G.day=g}
 ok(Gb.length===0||Gb.every(s=>!SL.managed(s)&&s.foes().length>0),'a goblin camp keeps its goblins rolled at the fight');
 // (its losses made good: one a day)
 const h=H[0],L=SL.ensure(h),dead=L.slice(0,3);for(const p of dead){p.hp=0;p.mode='dead'}const alive=()=>L.filter(p=>p.hp>0).length,a0=alive();
 G.day++;SL.grow(h);const a1=alive();SL.grow(h);const a2=alive();G.day++;SL.grow(h);const a3=alive();
 ok(a1===a0+1&&a2===a1&&a3===a1+1,'a hideout short of its men takes in one a day ('+a0+' → '+a1+', '+a2+' the same day, '+a3+' the next)');
 // (the bands shelter in both by night, and join a fight there)
 const night=t.nightCamps();ok(C.every(s=>night.includes(s))&&H.every(s=>night.includes(s)),'the bands shelter in the camps and the hideouts by night');
 const band=t.bandits.find(b=>!b.dead&&b.kind!=='goblins'),se=window.startEncounter;let got=null;
 if(band){try{window.startEncounter=e=>{got=e};const hb=H.find(s=>!s.tunnel)||H[0];hb.bands=[band];hb.attack(null,{});const own=SL.roster(hb).length,bt=band.troops.length;ok(got&&got.list.length===own+bt,'a band sheltering in a hideout fights there with its men ('+(got&&got.list.length)+': its '+own+' and the band\'s '+bt+')')}
   finally{window.startEncounter=se;for(const s of H)s.bands=[]}}
 // (underground, a lair's people are not seen on the map)
 const lair=H.find(s=>s.tunnel);if(lair){SL.active.set(lair,SL.ensure(lair));P.x=lair.x;P.y=lair.y+20;ok(!SL.visible().some(p=>SL.ensure(lair).includes(p))&&SL.under(lair),'a lair\'s people stay underground, out of sight');SL.active.delete(lair)}
 // (their tents: a camp's one or two, a hideout's up to six)
 ok(C.every(s=>s.tents>=1&&s.tents<=2)&&H.every(s=>s.tents>=Math.ceil(10/3)&&s.tents<=6),'a camp a tent or two, a hideout four to six');
 // (a hideout spread over its ground: its places round its stockade, each on its own open ground, none on another; none for a lair;
 //  their ground worn bare in the map's plan; its watch up at its lookout)
 const open=H.filter(h=>!h.tunnel),lairs=H.filter(h=>h.tunnel),SP=t.LAIR_SPREAD;
 const lay=open.map(h=>h.layout()),tiles=q=>[[0,-1],[1,-1],[0,0],[1,0]].map(([i,j])=>[q.tx+i,q.ty+j]);
 info('places: '+lay.map(L=>L.map(q=>q.k).join('+')).join(', '));
 ok(open.length&&lay.every(L=>L.length>=3&&L.some(q=>q.k==='look')),'each hideout in the open has its places round it, its lookout among them');
 ok(lairs.every(h=>!h.layout().length),'a lair dug in has none');
 ok(open.every((h,n)=>lay[n].filter(q=>q.k!=='gate').every(q=>{const d=Math.hypot(q.tx-h.tx,q.ty-h.ty);return d>=SP.r[0]&&d<=SP.r[1]&&tiles(q).every(([x,y])=>t.tAt(x,y)===t.T_OPEN)})),'each on open ground '+SP.r.join('-')+' tiles from its stockade');
 ok(lay.every(L=>L.every((q,i)=>L.every((o,j)=>i===j||Math.abs(q.tx-o.tx)>1+SP.gap||Math.abs(q.ty-o.ty)>1+SP.gap))),'none on another');
 const plan=t.WorldArt.ensure();ok(lay.every(L=>L.every(q=>plan.tramples.some(r=>Math.abs(r[0]-q.x)<1&&Math.abs(r[1]-(q.y-8))<1))),'their ground worn bare in the map\'s plan');
 const hh=open[0],watch=SL.ensure(hh).find(p=>p.role==='watch'),lk=hh.layout().find(q=>q.k==='look'),post=SL.post(hh,watch,'watch');
 ok(post&&hh.layout().some(q=>(q.k.startsWith('look')||q.k==='gate')&&Math.hypot(post.x-q.x,post.y-q.y)<10),'its watch keeps to its lookout (a stronghold\'s: its lookouts and its gate)');
 // (the lookout: its man sees further; anyone seeing you rouses the camp, none of it asleep; its men taken alone while it sleeps)
 {const h=open.find(h=>{const q=SL.lookOf(h),C=SL.centre(h);return q&&Math.hypot(q.x-C.x,q.y-C.y)>t.SITE_LIFE.shout})||open[0],q=SL.lookOf(h),men=SL.ensure(h),w=men.find(p=>p.role==='watch'),gc=G.clock,se=window.startEncounter,hid=window.hiddenAt;let got=null;
  try{window.hiddenAt=()=>false;w.hp=w.max;G.clock=t.DAY*.3;w.mode='watch';w.x=q.x;w.y=q.y+4;const d=t.SITE_LIFE.sight*1.3,o={x:w.x+d,y:w.y};const far=SL.detects(h,w,o);w.x=o.x-d;w.y=o.y+20;const low=SL.detects(h,w,o);w.x=q.x;w.y=q.y+4;
   ok(SL.atLook(h,w)&&far&&!low,'a man up at its lookout sees further ('+Math.round(d)+' px: '+far+'; off it: '+low+')');
   h.residents.alarm=null;G.clock=t.DAY*.7;SL.routines(h,men,.1);const slept=men.some(p=>p.mode==='sleep');SL.alarm(h);for(const p of men)p.goal=null;SL.routines(h,men,.1);
   ok(slept&&SL.roused(h)&&!men.some(p=>p.mode==='sleep'),'seen, the camp is roused: none of it sleeps');
   ok(!SL.picket(h,w),'roused, its lookout cannot be taken alone');h.residents.alarm=null;
   window.startEncounter=e=>{got=e};for(const p of men){p.away=false;p.mode=p.role==='watch'?'watch':'sleep'}w.x=q.x;w.y=q.y+4;const up=men.filter(p=>p.hp>0&&SL.atLook(h,p));
   const took=SL.picket(h,w),band=t.bandits.find(b=>b.residentHome===h.i&&b.picket);
   ok(took&&got&&got.kind==='party'&&band&&band.residentIds.length===up.length&&men.filter(p=>p.away).length===up.length&&!SL.roused(h),'unseen, its lookout\'s men ('+up.length+') come down to you alone, the camp asleep');
   t.bandits.splice(t.bandits.indexOf(band),1);SL.hour();ok(up.every(p=>p.hp<=0)&&!SL.roused(h),'beaten, they are gone and the camp none the wiser');
   for(const p of up){p.hp=p.max;p.mode='watch';p.away=false;p.x=q.x;p.y=q.y+4}SL.picket(h,w);const b2=t.bandits.find(b=>b.residentHome===h.i&&b.picket);b2.x=h.x;b2.y=h.y;b2.returnAt=0;SL.returnRaid(b2,1,true);
   ok(SL.roused(h)&&up.every(p=>!p.away&&p.hp>0),'if they get away, they are back at its fire and the camp is roused')}
  finally{window.startEncounter=se;window.hiddenAt=hid;G.clock=gc;if(h.residents)h.residents.alarm=null}}
 // (a stronghold: a hideout of 14 or more, by its first count or grown to it; a second lookout, a gate over its way in, its watch at all three)
 {const SS=SP.strong,strong=open.filter(h=>h.grade),dens=open.filter(h=>!h.grade);info('strongholds '+strong.length+', dens '+dens.length);
  ok(open.every(h=>!!h.grade===h.lifeBase()>=SS.at),'a hideout that starts with '+SS.at+' or more is a stronghold ('+strong.length+' of '+open.length+')');
  ok(strong.every(h=>h.layout().some(q=>q.k==='look2')&&h.layout().some(q=>q.k==='gate')&&h.T.n===SS.n)&&dens.every(h=>!h.layout().some(q=>q.k==='look2'||q.k==='gate')),'a stronghold has a second lookout and a gate; a den neither');
  const d=dens.find(h=>h.layout().length>=4);if(d){const gd=G.day,b=SL.ensure(d)&&d.residents;let n=0;try{G.day=400;while(!d.grade&&n++<20){G.day++;SL.grow(d)}}finally{G.day=gd}
   const L=d.layout(),gate=L.find(q=>q.k==='gate');ok(d.built===1&&d.grade===1&&gate&&L.some(q=>q.k==='look2')&&b.people.filter(p=>p.hp>0).length>=SS.at,'a den grown to '+SS.at+' becomes a stronghold, its places laid again ('+L.map(q=>q.k).join('+')+')');
   const posts=new Set(SL.ensure(d).map(p=>{const q=SL.post(d,p,'watch');return Math.round(q.x)+','+Math.round(q.y)}));ok(posts.size>=3,'its watch keeps its lookouts and its gate ('+posts.size+' posts)');
   ok(t.WorldArt.ensure().tramples.some(r=>Math.abs(r[0]-gate.x)<1&&Math.abs(r[1]-(gate.y-8))<1),'the ground under its new places worn in the map\'s plan again')}}
 // (its hoard in its stash: by its seed and people, more as its raiders come home; won, only their purses; yours while it lies empty;
 //  taken unseen at night, found bare by day and the camp roused; seen at it, they come for you; paid off, they take it; a new band a new one)
 {const HL=t.LAIR_HOARD,hs=open.filter(h=>h.stashAt()),h=hs[0],se=window.startEncounter,gc=G.clock,hid=window.hiddenAt,px=P.x,py=P.y,pg=P.gold,gd=G.day;let got=null;
  ok(hs.length&&lairs.every(h=>!h.stashAt()&&!h.hoardNow)&&C.every(s=>!s.hoardNow),'a hideout in the open has its stash; a lair and a camp none ('+hs.length+' of '+open.length+')');
  ok(hs.every(h=>{const o=h.hoardNow,b=HL.per*h.lifeBase();return o.gold>=HL.gold[0]+b&&o.gold<=HL.gold[1]+b&&o.gear>=HL.gear[0]&&o.gear<=HL.gear[1]}),'its hoard by its seed and its people ('+hs.map(h=>h.hoardSay()).join('; ')+')');
  try{window.hiddenAt=()=>false;window.startEncounter=e=>{got=e};
   const men=SL.ensure(h),g0=h.hoardNow.gold;for(const p of men){p.away=false;p.hp=p.max}const raiders=men.filter(p=>p.role==='raider').slice(0,2);for(const p of raiders)p.away=true;
   const rb=t.asParty({kind:h.bandKind,x:h.x,y:h.y,list:raiders.map(p=>p.type),residentHome:h.i,residentEpoch:h.residents.owner,residentIds:raiders.map(p=>p.id),returnAt:0,t:1,a:0,idle:false,cool:4,ld:null});t.bandits.push(rb);
   SL.returnRaid(rb,1,true);ok(h.hoardNow.gold>g0&&!t.bandits.includes(rb),'its raiders home, its hoard grows ('+g0+' → '+h.hoardNow.gold+' gold)');
   // (won: their purses only, the hoard named, left in the stash)
   const res={gold:40},note=h.plunder(res);ok(res.gold===40&&/stash/.test(note)&&h.hoardNow.gold>0,'won, only their purses: the hoard left in their stash ('+note.trim()+')');
   // (at night, all asleep, you unseen at the stash: yours; by day it is found bare and the camp roused)
   const q=h.stashAt();h.residents.alarm=null;G.clock=t.DAY*.9;for(const p of men){p.mode='sleep';p.x=SL.centre(h).x;p.y=SL.centre(h).y}P.x=q.x;P.y=q.y;
   const want=h.hoardNow.gold;P.gold=0;h.seen=true;const spot=t.Stashes.all().find(o=>o.h===h);
   ok(spot&&spot.here()&&t.worldObjects().includes(spot)&&Math.hypot(spot.x-q.x,spot.y-q.y)<1,'its stash on the map, at its place, to click');
   got=null;spot.meet();ok(!got&&P.gold>=want&&!h.hoardNow.gold&&!h.hoardNow.gear&&h.residents.robbed!=null&&!SL.roused(h),'at night, none awake to see: their hoard yours unseen ('+P.gold+' gold), the camp none the wiser');
   ok(!spot.here(),'the stash bare, no more to click');
   G.day++;G.clock=t.DAY*.3;SL.found(h);ok(SL.roused(h)&&h.residents.robbed==null,'by day the stash is found bare: the camp roused');
   // (seen at it: they come for you)
   h.residents.alarm=null;h.hoard=null;h.hoardNow;G.clock=t.DAY*.4;const w=men.find(p=>p.hp>0&&!p.away);w.mode='rest';w.x=q.x+6;w.y=q.y;got=null;
   spot.meet();ok(got&&got.ref===h&&SL.roused(h)&&h.hoardNow.gold>0,'seen at their stash, they come for you, the hoard still theirs');
   // (cleared: yours from the stash or its page; paid off, gone with them; a new band, a new hoard)
   G.site=null;G.mode='world';h.cleared=true;const g1=h.hoardNow.gold;P.gold=0;const pg2=h.page(null,null);
   ok(pg2.acts.some(a=>a.act==='site-hoard'),'cleared, its page offers their hoard');
   spot.meet();ok(P.gold>=g1&&!h.hoardNow.gold,'cleared, the hoard yours from the stash ('+P.gold+' gold)');
   h.hoard=null;h.emptyStash();ok(h.hoardNow.gold===0,'paid off, they ride away with their hoard');
   h.returned();ok(h.hoardNow.gold>0,'a new band gathered, a new hoard');h.cleared=false}
  finally{window.startEncounter=se;window.hiddenAt=hid;G.clock=gc;G.day=gd;P.x=px;P.y=py;P.gold=pg;if(h&&h.residents){h.residents.alarm=null;delete h.residents.robbed}}}
 ok(!ERR.length,'no runtime errors')});
