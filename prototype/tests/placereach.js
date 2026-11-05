'use strict';
// A place is reached from your army's ring (the owner, 2026-11-01: "my hero have to be near camp or building to interact ... the
// spawn will be overlap with my army"): a camp, a site or a friendly holding opens when your army's interaction ring touches its
// footprint (march.js ringReach, WorldObject reachRadius), so a big army halts at its edge and your hero never walks into it; a
// fight at a place musters its defenders clear of your army (worldbattle.js WorldBattleArea.clearOf, WORLD_BATTLE.clear). With
// the world's battles off, the old touching distance (REACH)
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;W.sites=W.sites.filter(s=>s.type==='camp');
 const reset=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.town=null;G.site=null;G.siteSpy=null;G.chase=null;G.lastSite=null;G.lastTown=null;G.encCool=0;P.tx=P.ty=null;P.stuck=0;P.camp=null;t.Captivity.held=null;P.hp=t.vitals()[0];
   t.bandits.length=0;W.monsters=[];W.critters=[];W.folk=[];W.patrols=[];W.caravans=[];W.refugees=[];if(W.road)W.road.on=[]};
 const walk=n=>{let i=0;for(;i<n&&G.mode==='world';i++){if(W.road)W.road.on=[];t.updateWorld(.05)}return i};
 const open=(x,y)=>x>0&&y>0&&x<t.MW*TILE&&y<t.MH*TILE&&t.tAt(Math.floor(x/TILE),Math.floor(y/TILE))===t.T_OPEN;
 // (open ground r px off o's point, in a plain line of it, clear of every holding's town)
 const towns=t.TOWNS.map(h=>t.Layout.of(h).footprint()).filter(Boolean),inTown=(x,y)=>towns.some(b=>x>b.x0-TILE&&x<b.x1+TILE&&y>b.y0-TILE&&y<b.y1+TILE);
 const offAt=(o,r)=>{for(let a=0;a<32;a++){const x=o.x+Math.cos(a*Math.PI/16)*r,y=o.y+Math.sin(a*Math.PI/16)*r;if(open(x,y)&&!inTown(x,y)&&t.clearLine(x,y,o.x,o.y))return[x,y]}return null};
 const boxDist=(b,x,y)=>Math.hypot(Math.max(b.x0-x,0,x-b.x1),Math.max(b.y0-y,0,y-b.y1));
 const big={hum_foot:60,hum_bow:30},small={hum_foot:2};
 P.troops={...big};const ringBig=t.marchInteractRadius(P);P.troops={...small};const ringSmall=t.marchInteractRadius(P);
 // (a camp on open ground, 5 tiles round: one in the woods halts a small army a little short, 2026-11-05)
 const openAt=s=>{const tx=s.x/TILE|0,ty=s.y/TILE|0;for(let j=-5;j<=5;j++)for(let i=-5;i<=5;i++)if(t.tAt(tx+i,ty+j)!==t.T_OPEN&&t.tAt(tx+i,ty+j)!==t.T_ROAD)return false;return true};
 const camp=t.camps().find(c=>openAt(c)&&offAt(c,ringBig+60)&&offAt(c,ringSmall+60))||t.camps().find(c=>offAt(c,ringBig+60)&&offAt(c,ringSmall+60))||t.camps()[0];camp.cleared=false;camp.bands=[];camp.seen=true;
 ok(camp.reachRadius()>=0&&t.worldBattleReach(camp)===t.marchInteractRadius(P)+camp.reachRadius()&&t.worldBattleReach(camp)>t.REACH,'a place is reached from your army\'s ring: its reach your ring and its footprint toward you ('+Math.round(t.worldBattleReach(camp))+' px for a band of 2)');
 // a big army: a click on the camp halts it at its ring's edge, and the camp opens; the hero never walks in
 const go=(troops,label)=>{reset();P.troops={...troops};const ring=t.marchInteractRadius(P),far=offAt(camp,ring+60);if(!far){info(label+': no open ground in a line '+Math.round(ring+60)+' px off the camp');return null}
   Kit.goTo(camp.x,camp.y);Kit.goTo(far[0],far[1]);t.MarchArmy.of(P).relocate(P.x,P.y);const opened=t.approach(camp);ok(!opened&&G.chase===camp,label+': a click on the camp from beyond its reach walks your army there');
   const n=walk(800),d=Math.hypot(P.x-camp.x,P.y-camp.y),A=t.MARCH_ARMIES.get(P),edge=Math.min(...A.units.map(u=>Math.hypot(u.x-camp.x,u.y-camp.y)-t.marchDisc(u)))-camp.reachRadius()-t.WORLD_BATTLE.interaction;return{ring,d,n,gap:d-ring-camp.reachRadius(),edge}};
 {const r=go(big,'a big army');if(r){ok(G.mode==='site'&&G.site===camp&&P.tx==null,'a big army: the camp opens on arrival ('+G.mode+' after '+r.n+' steps)');
   // (the owner, 2026-11-01: meetings measure to the shape) its outline on the camp's edge: its nearest man's disc there
   ok(r.d>t.REACH+20&&Math.abs(r.edge)<=8,'a big army halts with its outline on the camp\'s edge: its hero '+Math.round(r.d)+' px off (its nearest man '+r.edge.toFixed(1)+' px off it, the camp\'s reach '+Math.round(camp.reachRadius())+', its ring '+Math.round(r.ring)+'); it never walks in')}}
 {const r=go(small,'a small army');if(r){ok(G.mode==='site'&&G.site===camp,'a small army: the camp opens on arrival as before ('+G.mode+')');ok(r.d<=t.worldBattleReach(camp)+1&&r.d>=r.ring-8,'a small army halts at its own, smaller ring ('+Math.round(r.d)+' px off, ring '+Math.round(r.ring)+')')}}
 // the one you just left stays known as left while you stand there, and is forgotten well away
 {t.act('site-leave');t.hidePanel();G.mode='world';G.modal=false;t.updateSites();ok(G.lastSite===camp,'standing where your army reached it, the camp you left is still the one you left');
   const away=offAt(camp,t.worldBattleReach(camp)+t.REACH+20);if(away){P.x=away[0];P.y=away[1];t.updateSites();ok(G.lastSite===null,'well away from it, forgotten')}}
 // a friendly holding opens when your army's ring reaches its walls
 {reset();P.troops={...big};P.hostile={};const ring=t.marchInteractRadius(P),hs=t.TOWNS.filter(h=>!t.hostileTo(h.owner)&&t.Layout.of(h).centre()).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));
  // (measured from its town as reached, its footprint: holding.js reachRadius; a hamlet's houses and estates lie a way off its centre)
  const fpOf=x=>{const f=t.Layout.of(x).footprint();return f?{x0:f.x0,y0:f.y0,x1:f.x1,y1:f.y1}:t.lotBox(t.Layout.of(x).centre())};
  let h=null,far=null;for(const x of hs){const b=fpOf(x),r=Math.hypot(Math.max(x.x-b.x0,b.x1-x.x),Math.max(x.y-b.y0,b.y1-x.y))+ring+40;far=offAt(x,r);if(far){h=x;break}}
  if(!h)info('no friendly holding with open ground round it');else{const b=fpOf(h);Kit.goTo(far[0],far[1]);t.approach(h);ok(G.chase===h,'a friendly holding clicked from afar: your army walks there');G.encCool=1e3;walk(1600);
   const d=boxDist(b,P.x,P.y);ok(G.mode==='town'&&G.town&&G.town.ref===h,'and it opens as your ring reaches its walls ('+G.mode+')');
   ok(d>0&&d<=ring+8&&Math.hypot(P.x-h.x,P.y-h.y)>t.REACH+20,'your army halts outside '+h.name+': its middle '+Math.round(d)+' px off the town, its ring '+Math.round(ring)+' px')}
  // at war with you, a holding is reached at its gate as before (its siege's leash is measured from there)
  const e=t.TOWNS.find(x=>x.owner);t.realmOf(e.owner).provoke(30,0);ok(t.hostileTo(e.owner)&&e.reachRadius()!==null&&t.worldBattleReach(e)>t.REACH,'a holding at war with you: reached from your ring too (its siege and raid leashes measured past that reach: world.js, siege.js)');P.hostile={}}
 // the camp assaulted: a world battle with a clear gap between the two sides, at the start and once formed up
 const gapNow=b=>{const a=b.world,live=u=>u.hp>0&&!u.left,mine=b.units.filter(u=>u.team===0&&live(u)),foe=b.units.filter(u=>u.team===1&&live(u));let m=Infinity;for(const u of mine)for(const v of foe)m=Math.min(m,Math.hypot(u.x-v.x,u.y-v.y));return{m:m/a.scale,mine:mine.length,foe:foe.length}};
 const fight=(label,setup)=>{reset();P.troops={...big};setup();G.encCool=0;if(G.mode==='site')t.act('site-attack');else t.campFight(camp);if(G.enc&&G.mode==='dialog')t.act('fight');const b=t.B;
   if(!(b&&b.world)){ok(false,label+': a world battle ('+G.mode+')');return}
   const g0=gapNow(b),C=t.WORLD_BATTLE.clear,A=b.world.starts[0],D=b.world.starts[1];ok(g0.foe>0&&g0.mine>0&&g0.m>=C,label+': the sides start '+g0.m.toFixed(1)+' px apart at least (WORLD_BATTLE.clear '+C+'; '+g0.mine+' of yours, '+g0.foe+' of theirs)');
   ok((D.x-camp.x)*(camp.x-A.x)+(D.y-camp.y)*(camp.y-A.y)>=0&&Math.hypot(D.x-A.x,D.y-A.y)>=Math.hypot(camp.x-A.x,camp.y-A.y)-.01,label+': the defenders muster at the camp or beyond it, on its far side from your army ('+Math.round(Math.hypot(D.x-camp.x,D.y-camp.y))+' px past it)');
   const armies=b.muster?b.muster.armies:[];ok(armies.length>=2&&armies.every(x=>Number.isFinite(x.anchor.x)&&Number.isFinite(x.anchor.y)),label+': each side forms up from its own ground (the defenders from the place: '+armies.map(x=>x.team+' '+Math.round(x.anchor.x)+','+Math.round(x.anchor.y)).join('; ')+')');
   const formed=Kit.engage(),g1=gapNow(b);ok(formed&&g1.m>=C,label+': formed up, still '+g1.m.toFixed(1)+' px apart');
   t.finishBattle();if(G.mode==='battle'||G.mode==='result')t.act('lt-leave');Kit.done({world:true});Kit.clear();camp.cleared=false;camp.bands=[];camp.seen=true};
 fight('a camp stormed from where your army reached it',()=>{const far=offAt(camp,ringBig+60);Kit.goTo(far[0],far[1]);t.approach(camp);walk(800)});
 fight('a camp fight with your army standing on it (a stale position)',()=>{Kit.goTo(camp.x,camp.y);t.MarchArmy.of(P).relocate(P.x,P.y)});
 // with the world's battles off, the old touching distance
 {reset();t.WORLD_BATTLE.on=false;P.troops={...big};ok(t.worldBattleReach(camp)===t.REACH&&t.worldBattleReach(t.TOWNS[0])===t.REACH,'the world\'s battles off: every place reached at REACH ('+t.REACH+' px), as before');
  const far=offAt(camp,60);if(far){Kit.goTo(far[0],far[1]);t.approach(camp);walk(800);ok(G.mode==='site'&&Math.hypot(P.x-camp.x,P.y-camp.y)<=t.REACH+1,'and the camp opens with your hero at it, as before')}
  t.WORLD_BATTLE.on=true}
 // (the owner, 2026-11-01: "the holding interaction should be separated from estate buildings and houses") a holding is reached at
 // its own building (its centre's lot); beside one of its houses, away from that, you reach the house and not the holding
 {reset();P.troops={};const pick=t.TOWNS.map(h=>{const c=t.Layout.of(h).centre(),hs=(h.lots||[]).filter(l=>l.k==='house'&&l.st==='built');if(!c||!hs.length)return null;const cb=t.lotBox(c),far=hs.map(l=>({l,d:Math.hypot((l.x+l.n/2)*TILE-(cb.x0+cb.x1)/2,(l.y+l.n/2)*TILE-(cb.y0+cb.y1)/2)})).sort((a,b)=>b.d-a.d)[0];return far&&{h,...far}}).filter(Boolean).sort((a,b)=>b.d-a.d)[0];
  if(!pick)info('no holding with a built house');else{const {h,l}=pick,hb=t.lotBox(l),house=t.housePick(h,l);
   const spot=[[hb.x1+3,(hb.y0+hb.y1)/2],[hb.x0-3,(hb.y0+hb.y1)/2],[(hb.x0+hb.x1)/2,hb.y1+3],[(hb.x0+hb.x1)/2,hb.y0-3]].find(([x,y])=>t.passable(t.terrAt(x,y)))||[hb.x1+3,hb.y0];
   Kit.goTo(spot[0],spot[1]);t.MarchArmy.of(P).sync();const dH=Math.hypot(h.x-P.x,h.y-P.y),dh=Math.hypot(house.x-P.x,house.y-P.y);
   ok(dh<=t.worldBattleReach(house)&&dH>t.worldBattleReach(h),'beside a house of '+h.name+' ('+Math.round(pick.d)+' px from its centre): the house is in reach, the holding not ('+Math.round(dH)+' px, its reach '+Math.round(t.worldBattleReach(h))+')')}}
 reset();ok(!ERR.length,'no runtime errors');
});
