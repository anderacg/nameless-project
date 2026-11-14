'use strict';
// Outposts (doc/OUTPOSTS_DESIGN.md phase 1; the owner, 2026-11-10: "every factions will also have a static flag in their
// territory ... This tower and flag can be captured by another factions or even bandits, goblin"): a realm's outposts on its
// land at its crossings, fords, passes and resources, the same every time a world begins; drawn (a plinth, a pole, its banners; a
// tower from level 2); taken by you: its guards beaten, your banner up after OUTPOST.hold hours by it, for the realm you serve,
// for yourself once you hold a holding, else handed to a realm near or left to no one; its guards back a day; all through a save.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,S=t.OUTPOST,SP=t.OUTPOST_PLACE;
 Kit.begin('soldier');
 const all=()=>t.Outposts.all(),A=all();
 info(A.length+' outposts: '+A.map(s=>s.name+' ('+s.realm+', level '+s.lv+')').join('; '));
 // ---- where they stand
 const why=A.reduce((a,s)=>(a[s.why]=(a[s.why]||0)+1,a),{}),gap=Math.min(...A.flatMap((a,i)=>A.slice(i+1).map(b=>Math.hypot(a.tx-b.tx,a.ty-b.ty))));
 ok(A.length>=8&&A.every(s=>s instanceof t.Outpost&&W.sites.includes(s)&&t.FACS[s.realm]&&s.realm!=='player'),A.length+' outposts among the sites, each a realm\'s');
 {const bad=A.filter(s=>!(t.tAt(s.tx,s.ty)===t.T_OPEN&&!t.Outposts.built(s.tx,s.ty)&&t.Outposts.realmAt(s.tx,s.ty)===s.realm)).map(s=>s.name+' '+t.tAt(s.tx,s.ty)+' '+t.Outposts.built(s.tx,s.ty)+' '+t.Outposts.realmAt(s.tx,s.ty)+'/'+s.realm);ok(!bad.length,'each on open ground of its own realm\'s land, nothing built within '+SP.clear+' tiles'+(bad.length?': '+bad.join(', '):''))}
 ok(gap>=SP.gap&&why.deposit>0&&Object.keys(why).length>=2,'at least '+SP.gap+' tiles apart ('+gap.toFixed(1)+'); at deposits and at crossings, fords or passes ('+JSON.stringify(why)+')');
 {const byP=new Map();for(const s of A){const p=t.Provinces.at(s.x,s.y);byP.set(p,(byP.get(p)||0)+1)}ok([...byP.values()].every(n=>n<=SP.most+1),'at most '+(SP.most+1)+' a province');
  const again=t.Outposts.place();ok(again.length===A.length&&again.every((s,i)=>s.tx===A[i].tx&&s.ty===A[i].ty&&s.name===A[i].name&&s.lv===A[i].lv),'the same outposts every time the world is reckoned (no draw)')}
 ok(A.every(s=>s.guards===S.guards[s.lv]&&s.lv>=1&&s.lv<=3)&&A.some(s=>s.lv>=2),'its guards by its level ('+S.guards.slice(1).join(', ')+'), some with a tower');
 // ---- drawn, on the minimap and among the places
 {const one=A.find(s=>s.lv===1),two=A.find(s=>s.lv>=2),a=one&&t.siteSprite(one),b=two&&t.siteSprite(two);
  ok(a&&b&&a.width>0&&b.width>a.width&&a===t.siteSprite(one)&&t.Discovery.places().includes(two)&&Array.isArray(two.mapDot(0)||[]),'drawn as a flag post, wider with its tower, made once; among the places you discover')}
 // ---- taken by you: you serve no one and hold nothing: handed to a realm near
 const strong=()=>{P.troops={hum_knight:40,hum_long:20};P.hp=null;t.vitals()};
 {Kit.world({encCool:0});strong();P.fac=null;const s=A.find(x=>x.guards>0),f0=s.realm,r0=P.renown;P.x=s.x+10;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();
  ok(/Attack its guards/.test(Kit.panel()),'its page: whose it is and Attack its guards');
  t.act('site-attack');ok(G.enc&&G.enc.kind==='outpost'&&G.enc.ref===s&&G.enc.list.length===s.guards&&t.hostileTo(f0),'attacking it: its guards to fight, and its realm hostile to you');
  t.act('auto');ok(s.guards===0&&s.taking&&s.taking.h===0,'its guards beaten: your banner begins to go up');
  G.mode='world';G.modal=false;t.hidePanel();for(let i=0;i<S.hold;i++)t.Outposts.hour();
  ok(s.choose&&!s.taking&&G.mode==='site'&&G.site===s&&/Hand it to the/.test(Kit.panel())&&!s.nearRealms().some(([k])=>k===f0),'after '+S.hold+' hours by it, the realms near it to hand it to (not the one you took it from)');
  const to=s.nearRealms()[0][0],r1=P.renown;t.act('site-hand',to);ok(s.realm===to&&!s.choose&&s.guards===1&&P.renown===r1+S.renown&&r1>r0,'handed to the '+t.FACS[to].n+': its banner theirs, a guard of theirs, renown +'+S.renown);
  s.day();ok(s.guards===2,'its guards back a day while its realm holds it')}
 // ---- for the realm you serve; and walking off breaks it off
 {Kit.world({encCool:0});strong();const s=A.find(x=>x.realm&&x.realm!=='karn'&&x.guards>0&&!x.choose);P.fac='karn';s.guards=0;P.x=s.x;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();
  ok(/Raise your banner/.test(Kit.panel()),'no guards left: Raise your banner');t.act('site-attack');ok(s.taking,'your banner goes up at once');
  P.x=s.x+S.r*4;t.Outposts.hour();ok(!s.taking&&s.realm!=='karn','walk well off and it is broken off');
  P.x=s.x;t.act('site-attack');for(let i=0;i<S.hold;i++)t.Outposts.hour();ok(s.realm==='karn'&&!s.choose,'stay by it: it flies the colours of the realm you serve');
  G.site=s;t.showSite();ok(!/Attack its guards|Raise your banner/.test(Kit.panel()),'and yours to keep: no attack on it');P.fac=null}
 // ---- edge cases: names, their tiles kept from building, a fallen realm's, a fight fought out on the field
 {const names=all().map(s=>s.name);ok(new Set(names).size===names.length,'every outpost its own name');
  ok(all().every(s=>s.tiles().every(([x,y])=>t.occAt(x,y)!==0)),'its tiles (plinth, front, tower) kept from every holding\'s building');
  const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'&&x.realm!=='karn'),f=s.realm;W.dead[f]=true;try{s.day();ok(!s.realm&&s.guards===0,'its realm fallen, it is no one\'s')}finally{delete W.dead[f];s.owner=f;s.guards=S.guards[s.lv]}}
 {Kit.world({encCool:0});strong();P.fac=null;const s=all().find(x=>x.guards>0&&x.realm&&x.realm!=='player'&&!x.choose&&!x.taking);P.x=s.x+10;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();t.act('site-attack');
  t.startBattle({enemies:G.enc.list,tournament:false});const B=t.B,foes=B.units.filter(u=>u.team===1),fl=foes.map(u=>t.battleFlag(u)).find(Boolean);
  ok(foes.length===G.enc.list.length&&fl&&fl.col===s.col(),'fought out on the field: its guards there under its realm\'s banner');
  B.win=true;B.over=true;foes.forEach(u=>u.hp=0);t.finishBattle();ok(s.taking&&s.guards===0,'and won there, your banner begins to go up');G.mode='world';t.hidePanel();s.taking=null;s.guards=S.guards[s.lv]}
 // ---- phase 2: its sentries; held in peace it grows on timber and stone; taken, its tower broken and mended slowly
 {const s=all().find(x=>x.lv===1&&t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking),f=s.realm,sup=s.supplier(),Gw=S.grow;
  ok(sup&&sup.owner===f,'its works paid by its realm\'s nearest holding ('+(sup&&sup.name)+')');
  const st=sup.stock,keep={...st};try{
   st.timber=0;s.since=t.G.day-Gw.days[1];s.day();ok(s.lv===1&&s.need&&s.need.timber===Gw.cost[2].timber&&/waits on/.test((G.site=s,G.mode='site',t.showSite(),Kit.panel())),'held long enough but short of timber: it waits, and its page says on what');
   st.timber=100;s.day();ok(s.lv===2&&st.timber===100-Gw.cost[2].timber&&s.since===t.G.day,'its timber paid: it grows to a watchtower ('+Gw.cost[2].timber+' timber)');
   const t0=s.sprite().width;s.give(f==='vale'?'karn':'vale');ok(s.broken&&s.most===S.guards[1]&&s.sprite()!==t0&&/broken/.test(s.tip()),'taken: its tower broken, its guards one level fewer');
   const sup2=s.supplier(),st2=sup2.stock,k2={...st2};try{st2.timber=0;st2.stone=0;for(let i=0;i<S.repair.days;i++)s.day();ok(s.broken&&s.need,'mended only once paid');
    st2.timber=50;st2.stone=50;s.day();ok(!s.broken&&st2.timber===50-S.repair.cost.timber&&s.most===S.guards[2],'paid: its tower mended ('+s.costText(S.repair.cost)+')')}finally{Object.assign(st2,k2)}
  }finally{Object.assign(st,keep);s.owner=f;s.lv=1;s.broken=false;s.guards=S.guards[1];G.mode='world';t.hidePanel()}}
 {const s=all().find(x=>x.guards>0&&t.FACS[x.realm]&&x.realm!=='player');P.x=s.x;P.y=s.y+30;s.seen=true;const ents=[],cam={x:P.x-200,y:P.y-150};t.frame();s.draw(ents,cam,200);
  const mins=(t.G.day+t.Clock.frac)*1440,n=Math.min(S.sentries.most,s.guards),out=[...Array(n).keys()].filter(i=>!s.sentryAt(i,n,mins).inside).length;
  ok(ents.length===1+out&&t.FACS[s.realm]&&typeof s.sentryType()==='string','in your sight its sentries on their beat round it, those resting in its tower not seen ('+out+' of '+n+', '+s.sentryType()+')')}
 // ---- their beat (the owner, 2026-11-11: "patrol around the flag and stop, dont make them always walk, and they should go rest in the tower like garrison")
 // (a sentry steps by the way he walks, as a marcher, at a man's pace: by the clock's minutes, at 1.5 px a minute, a step a second
 //  ("Why the outpost guards looks low framerate", the owner 2026-11-13))
 {const X=S.sentries,s=all().find(x=>t.FACS[x.realm]),perSec=X.pace*1440/(t.DAY*60)/(t.WALK.foot*t.WALK.step);let m=0,p=null;for(;m<3000;m+=.5){p=s.sentryAt(0,3,m);if(p.moving)break}
  const q=p&&s.sentryAt(0,3,m+.1);ok(p&&p.moving&&q.moving&&Math.abs(q.walked-p.walked-X.pace*.1)<1e-6&&perSec>=4,'a sentry steps by the way he walks ('+perSec.toFixed(1)+' steps a second at 1×), never by the clock')}
 {const X=S.sentries;for(const lv of [1,2]){const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'),keep={lv:s.lv,broken:s.broken};s.lv=lv;s.broken=false;delete s._sp;
   const n=3,F=s.footing(),c={walk:0,stand:0,inside:0},on=(p)=>F.some(f=>p.x>f.x&&p.x<f.x+f.w&&p.y>f.y&&p.y<f.y+f.h);let onF=0,far=0,jump=0,last=[];
   for(let m=0;m<3000;m+=.5){for(let i=0;i<n;i++){const p=s.sentryAt(i,n,m);c[p.inside?'inside':p.moving?'walk':'stand']++;if(!p.inside&&on(p))onF++;far=Math.max(far,Math.hypot(p.x-s.x,p.y-s.y));if(last[i]&&!last[i].inside&&!p.inside)jump=Math.max(jump,Math.hypot(p.x-last[i].x,p.y-last[i].y));last[i]=p}}
   const T=c.walk+c.stand+c.inside,pc=k=>Math.round(c[k]/T*100);
   ok(c.stand>c.walk*.5&&c.walk>0,(lv>1?'a watchtower':'the banner alone')+': they walk to a post and stand there a while ('+pc('walk')+'% walking, '+pc('stand')+'% standing)');
   ok(lv>1?c.inside>T*.15&&c.inside<T*.6:c.inside===0,lv>1?'and take turns resting in the tower ('+pc('inside')+'% of the time)':'no tower: none goes in (they rest by the flag\'s foot)');
   ok(!onF&&far<X.r*3+20&&jump<=X.pace*.5+.01,'never on the plinth or in the tower, near the flag (at most '+Math.round(far)+' px), no jumps');
   if(lv>1){let both=0;for(let m=0;m<3000;m+=5)if([0,1,2].filter(i=>s.sentryAt(i,n,m).inside).length===n)both++;ok(both===0,'never all three in at once: one always on watch')}
   Object.assign(s,keep);delete s._sp}}
 // ---- a lost fight: those of its guards you slew stay dead; your own outposts' guards from your nearest holding
 {const s=all().find(x=>x.guards>=3&&t.FACS[x.realm]&&x.realm!=='player'),g0=s.guards;t.ON_WIN.outpost.lost({ref:s},['hum_spear','hum_spear','chief']);ok(s.guards===g0-2,'beaten off it: the two guards you slew stay dead ('+g0+' to '+s.guards+')');s.guards=g0}
 {const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking),f=s.realm,h=t.TOWNS.find(x=>x.owner===f&&!x.gone),o0=h.owner,g0=h.gar,keep=s.guards;
  try{h.owner='player';h.gar=10;s.owner='player';s.guards=0;s.broken=false;const sup=s.supplier();s.day();
   ok(sup===h&&s.guards===1&&h.gar===9&&s.guardList().length===1,'yours: a man a day from your nearest holding\'s garrison ('+h.name+')');h.gar=S.own.keep;s.day();ok(s.guards===1&&h.gar===S.own.keep,'but never below '+S.own.keep+' at home')}
  finally{h.owner=o0;h.gar=g0;s.owner=f;s.guards=keep}}
 // ---- phase 3: the world's captures
 {const R0=Math.random;Math.random=()=>0;try{
  const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking),f=s.realm,foe=Object.keys(t.FACS).find(k=>k!=='player'&&k!==f&&!t.W.dead[k]);
  const r0=t.W.rel[t.rk(f,foe)];t.W.rel[t.rk(f,foe)]={s:'war',since:0};const L=W.lords.find(l=>l.fac===foe&&!l.dead),l0={x:L.x,y:L.y,inside:L.inside,fight:L.fight};
  try{L.inside=null;L.fight=null;L.x=s.x+8;L.y=s.y;L.troops=Array(Math.max(2,s.guards*S.capture.more)).fill('hum_spear');t.Outposts.day();
   ok(s.realm===foe&&s.since===t.G.day,'a lord at war with its realm, strong enough, by it: he takes it for the '+t.FACS[foe].n);
   L.fac=f;t.W.rel[t.rk(f,foe)]={s:'war',since:0};L.fac=foe}finally{Object.assign(L,l0);t.W.rel[t.rk(f,foe)]=r0;s.owner=f;s.guards=S.guards[s.lv];s.broken=false}
  // (a band by a weakly held one makes it its lair; its raiders ride out of it; you drive them out)
  const n0=t.bandits.length,b=t.asParty({x:s.x+6,y:s.y,n:8,kind:'bandits',list:t.makeEnemies(8,false,'bandits'),t:0,a:0,idle:false,cool:0,ld:t.newChief('bandits',1)});t.bandits.push(b);s.guards=1;t.Outposts.day();
  ok(s.band==='bandits'&&!t.bandits.includes(b)&&s.guards===8&&s.banner().k==='rag'&&/lair/.test((G.site=s,G.mode='site',t.showSite(),Kit.panel())),'a band by a weakly held one: their lair now, their men its guards, their rag, its page says so');
  ok(t.Provinces.danger(t.Provinces.at(s.x,s.y)).what.join().length>0&&t.W.sites.filter(x=>x.band).length>=1,'a lair counts in its province\'s danger');
  s.raided=-99;s.day();const out=t.bandits.filter(o=>o.lair===s.i);ok(out.length===1&&out[0].kind==='bandits','a band rides out of it to raid the roads');
  t.bandits=t.bandits.filter(o=>o.lair!==s.i);
  Kit.world({encCool:0});P.troops={hum_knight:40};P.hp=null;t.vitals();P.x=s.x+10;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();ok(/Drive them out/.test(Kit.panel()),'you may drive them out');
  t.act('site-attack');ok(G.enc&&G.enc.kind==='outpost'&&G.enc.band==='bandits','a fight with its raiders');t.act('auto');ok(!s.band&&!s.realm&&s.taking,'driven out: no one\'s, your banner going up');
  s.taking=null;s.owner=f;s.guards=S.guards[s.lv];s.broken=false;G.mode='world';t.hidePanel()
  }finally{Math.random=R0}}
 // ---- sight round yours and your employer's; no band raised by a held one
 {const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'),f=s.realm;P.fac=f;const S0=t.W.seen;t.W.seen=new Uint8Array(t.MW*t.MH);try{s.watch();ok(t.seenAt(s.x,s.y)&&t.seenAt(s.x+(S.sight-1)*t.TILE,s.y),'your employer\'s: the fog lifted '+S.sight+' tiles round it')}finally{t.W.seen=S0;P.fac=null}
  ok(t.Outposts.guarded(s.x+t.TILE,s.y)&&!t.Outposts.guarded(s.x+(S.safe+2)*t.TILE*2,s.y+(S.safe+2)*t.TILE*2),'no band is raised within '+S.safe+' tiles of a held one')}
 // ---- phase 4: the outposts' quests
 {Kit.world({encCool:0});P.troops={hum_knight:40};P.hp=null;t.vitals();P.fac=null;P.quests=[];
  // (the outpost nearest another realm's holding, and that realm)
  let s=null,foe=null,bd=1e9;for(const x of all())if(t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking)for(const h of t.TOWNS)if(!h.gone&&t.FACS[h.owner]&&h.owner!=='player'&&h.owner!==x.realm){const d=Math.hypot(h.x-x.x,h.y-x.y);if(d<bd){bd=d;s=x;foe=h.owner}}
  const f0=s.realm,r0=t.W.rel[t.rk(f0,foe)];
  t.W.rel[t.rk(f0,foe)]={s:'war',since:0};const L=W.lords.find(l=>l.fac===foe&&!l.dead),h=t.Spatial.nearest(t.fiefsOf(foe),s.x,s.y);
  try{let q=null;for(let i=0;i<4&&!q;i++){q=t.makeQuest('outpost',h,L);if(q&&q.site!==s.i)q=null}
   if(!q){const near=t.Outposts.all().filter(x=>x!==s);near.forEach(x=>x._k=x.owner);near.forEach(x=>x.owner=foe);try{q=t.makeQuest('outpost',h,L)}finally{near.forEach(x=>{x.owner=x._k;delete x._k})}}
   ok(q&&q.site===s.i&&/Take the /.test(q.title)&&q.fac===foe,'a lord at war wants an outpost of his foes taken: '+(q&&q.title));
   t.acceptQuest(q);G.site=s;G.mode='site';s.guards=0;s.broken=false;P.x=s.x;P.y=s.y+12;t.act('site-attack');for(let i=0;i<S.hold;i++)t.Outposts.hour();
   ok(s.choose&&s.nearRealms().some(([k])=>k===foe),'taken by you, serving no one: his realm among those you may hand it to');
   t.act('site-hand',foe);const Q=P.quests.find(x=>x.id===q.id);ok(s.realm===foe&&Q&&Q.done,'handed to his realm: the job done ('+(Q&&Q.done)+')');
   s.owner=f0;s.home0=f0;const q2=t.makeQuest('outpost',t.Spatial.nearest(t.fiefsOf(f0),s.x,s.y),W.lords.find(l=>l.fac===f0&&!l.dead));s.owner=foe;
   const q3=(()=>{const L0=W.lords.find(l=>l.fac===f0&&!l.dead),h0=t.Spatial.nearest(t.fiefsOf(f0),s.x,s.y);for(let i=0;i<4;i++){const x=t.makeQuest('outpost',h0,L0);if(x&&x.site===s.i)return x}return null})();
   ok(q3&&/Retake the /.test(q3.title),'its first realm\'s lord wants it back: '+(q3&&q3.title))}
  finally{t.W.rel[t.rk(f0,foe)]=r0;s.owner=f0;s.guards=S.guards[s.lv];s.broken=false;s.choose=false;P.quests=[];G.mode='world';t.hidePanel()}}
 {const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking&&!t.hostileTo(x.realm)),f0=s.realm,t0=t.Spatial.nearest(t.TOWNS.filter(x=>x.owner===f0&&!x.gone),s.x,s.y);Kit.world({encCool:0});
  try{s.broken=true;s.lv=Math.max(2,s.lv);let q=null;for(let i=0;i<4&&!q;i++){q=t.makeQuest('mend',t0,null);if(q&&q.site!==s.i)q=null}
   ok(q&&/Mend the tower/.test(q.title),'a broken tower of its realm\'s: a holding\'s job to mend it ('+(q&&q.title)+')');
   if(q){t.acceptQuest(q);P.x=s.x;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();ok(/Mend its tower/.test(Kit.panel()),'its page: Mend its tower');
    for(const g in S.repair.cost)t.invAdd('good',g,S.repair.cost[g]);t.act('site-mend');const Q=P.quests.find(x=>x.id===q.id);ok(!s.broken&&Q&&Q.done,'mended with the timber and stone you brought: the job done')}
   s.owner='bandits';s.guards=5;let o=null;for(let i=0;i<4&&!o;i++){o=t.makeQuest('outlair',t0,null);if(o&&o.site!==s.i)o=null}
   ok(o&&/Drive the bandits from/.test(o.title),'a band\'s lair near: a holding\'s job to drive them out ('+(o&&o.title)+')');
   if(o){t.acceptQuest(o);P.troops={hum_knight:40};P.hp=null;t.vitals();G.site=s;G.mode='site';t.showSite();t.act('site-attack');t.act('auto');const Q=P.quests.find(x=>x.id===o.id);ok(!s.band&&Q&&Q.done,'driven out: the job done')}}
  finally{s.owner=f0;s.guards=S.guards[s.lv];s.broken=false;s.taking=null;P.quests=[];G.mode='world';t.hidePanel()}}
 // ---- phase 5: its tower in battle: the fight on the world map, its top raised and sheer but its ladder, its archers posted on it
 {Kit.world({encCool:0});strong();P.fac=null;const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking),f0=s.realm,lv0=s.lv,X=S.tower;
  const fight=(lv,broken)=>{s.lv=lv;s.broken=broken;s.guards=S.guards[lv];s.seen=true;P.x=s.x+30;P.y=s.y+24;G.site=s;G.mode='site';t.showSite();t.act('site-attack');
    G.enc.list=G.enc.list.map((k,i)=>i<X.perch[3]?'hum_crossbow':k);t.startBattle({enemies:G.enc.list,tournament:false});return t.B};
  const end=B=>{B.win=true;B.over=true;B.units.filter(u=>u.team===1).forEach(u=>u.hp=0);t.finishBattle();G.mode='world';t.hidePanel();s.taking=null};
  try{const B=fight(3,false),T=B.terrain,w=(T.towers||[]).find(x=>x.s===s),g=B.groups.e0_tower,m=g?t.grpUnits(g.id):[];
   ok(B.world&&w&&w.lv>=X.rise[3],'a fight at an outpost is on the world map, its stone tower '+X.rise[3]+' levels over the ground ('+(w&&w.lv)+')');
   const cells=[],out=[];if(w)for(let r=w.r0;r<=w.r1;r++)for(let c=w.c0;c<=w.c1;c++){const i=r*T.C+c;cells.push(i);
     for(const [q,e] of [[0,c===w.c1],[1,r===w.r1],[2,c===w.c0],[3,r===w.r0]])if(e&&!(T.wall[i]&1<<q))out.push(q)}
   ok(cells.length&&cells.every(i=>T.lvl[i]===w.lv&&T.lift[i]>0&&!T.built[i]),'its top open ground, raised, its men drawn up on it ('+cells.length+' cells)');
   ok(w&&out.length===X.ladder&&out.every(q=>q===w.ladder),'sheer all round but its ladder ('+X.ladder+' cell, on the side away from you: '+out.join()+')');
   {const sp=B.units.find(u=>u.team===0&&!u.hero&&t.routeWho(u.s)==='foot')||B.hero,p=m[0]&&t.routePath(T.route.foot,sp.x,sp.y,m[0].x,m[0].y,{need:t.routeNeedOf(sp)});
    ok(p&&p.ok,'climbed by its ladder: your foot have a way up to them, room for a man ('+(sp&&sp.type)+')')}
   ok(m.length===X.perch[3]&&g.post&&m.every(u=>cells.includes(t.tIx(T,u.x,u.y))),m.length+' of its archers posted on its top, holding their post');
   B.terrain.update();const H=t.HILL.range,u0=m[0];
   ok(m.every(u=>u.z>0&&Math.abs(u.s.range-u.r0*T.rangeMul(t.tIx(T,u.x,u.y)))<1&&u.s.range>=u.r0*(1+H*X.rise[3])-1),'drawn up on it, shooting from its height (range '+(u0&&u0.s.range.toFixed(0))+', '+(u0&&u0.r0)+' on level ground)');
   ok(!B.muster||!B.muster.entries.some(e=>e.g===g),'not marched off it to a formation');
   {const C=t.Commander.of(1).groups();ok(g&&!Object.values(C).some(ids=>ids.includes(g.id))&&Object.values(C).some(ids=>ids.length),'no captain orders them, the rest of its guards his (commander.js: g.post)')}
   {const f=t.OutpostTower.foot(w,T.cs),d0=m.map(u=>Math.hypot(u.sx+g.ax-f.x,u.sy+g.ay-f.y)),foe=B.units.find(u=>u.team===0&&u.hp>0);let drew=true;try{t.OutpostTower.draw(B.world)}catch(e){drew=false}
    ok(drew&&w.l1-w.l0===X.ladder&&!w.back,'its ladder drawn on the field ('+X.ladder+' cells, from the ground to its top)');
    const fx=foe.x,fy=foe.y;foe.x=m[0].x;foe.y=m[0].y;w.seen=0;t.OutpostTower.step(B);const d1=m.map(u=>Math.hypot(u.sx+g.ax-f.x,u.sy+g.ay-f.y));foe.x=fx;foe.y=fy;
    ok(w.back&&d1.reduce((a,b)=>a+b,0)>d0.reduce((a,b)=>a+b,0),'a foe up on its top: its archers fall back from the ladder ('+d0.map(v=>v.toFixed(0)).join(',')+' to '+d1.map(v=>v.toFixed(0)).join(',')+' px from its foot)')}
   end(B);
   const B2=fight(3,true);ok(!B2.groups.e0_tower&&!(B2.terrain.towers||[]).some(x=>x.s===s),'its tower broken: no one on it, nothing raised');end(B2);
   const B3=fight(1,false);ok(B3.world&&!B3.groups.e0_tower,'a flag post alone: fought on the map, no tower');end(B3)}
  finally{s.lv=lv0;s.broken=false;s.owner=f0;s.guards=S.guards[lv0];s.taking=null;s.choose=false;G.mode='world';t.hidePanel()}}
 // ---- phase 4: hold an outpost until relief comes; scout the enemy's outposts unseen
 {Kit.world({encCool:0});P.troops={hum_knight:40,hum_long:20};P.hp=null;t.vitals();P.fac=null;P.quests=[];const H=t.OUTPOST_JOB.hold,X=t.OUTPOST_JOB.scout;
  // (an outpost of a realm with a holding of another near it, both at war)
  let s=null,foe=null,bd=1e9;for(const x of all())if(t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking)for(const h of t.TOWNS)if(!h.gone&&t.FACS[h.owner]&&h.owner!=='player'&&h.owner!==x.realm){const d=Math.hypot(h.x-x.x,h.y-x.y);if(d<bd){bd=d;s=x;foe=h.owner}}
  let f0=s.realm;const rk=t.rk(f0,foe),r0=W.rel[rk],L=W.lords.filter(l=>l.fac===f0&&!l.dead).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0],hh=t.Spatial.nearest(t.fiefsOf(f0),s.x,s.y);
  W.rel[rk]={s:'war',since:0};const hon0={...P.honor},lr0={...(P.lrel||{})},ho0=P.hostile;P.hostile={};for(const k of Object.keys(t.FACS))P.honor[k]=Math.max(0,P.honor[k]||0);(P.lrel??={});for(const l of W.lords)P.lrel[l.id]=50;// (in good standing with every lord here: their jobs given)
  const q0=t.makeQuest('hold',hh,L);if(q0)s=t.Outposts.of(q0.site);const g0=s.guards,lv0=s.lv;
  const hour=()=>{G.mode='world';G.modal=false;G.enc=null;t.hidePanel();t.Outposts.hour()};
  try{
   let q=null;for(let i=0;i<6&&!q;i++){q=t.makeQuest('hold',hh,L);if(q&&q.site!==s.i)q=null}
   ok(q&&/Hold the /.test(q.title)&&q.foeF===foe,'a lord at war fears for an outpost of his near his foes: '+(q&&q.title));
   t.acceptQuest(q);P.x=s.x+400;P.y=s.y;hour();ok(!q.on&&q.h===0,'away from it, the hold has not begun');
   const wave=Q=>t.bandits.find(o=>o.wave&&o.wave.q===Q.id&&!o.gone),BR=new t.BandBrain();let gn0=0,gs0=0,lostG=0;
   P.x=s.x+8;P.y=s.y+8;let waves=0,set=null,closer=false,beside=false,tower=false;for(let i=0;i<40&&!q.done;i++){hour();const b=wave(q);if(!b)continue;
    if(waves===0)s.guardList=()=>['hum_crossbow','hum_crossbow','hum_spear'];
    if(!set){set=Math.hypot(b.x-s.x,b.y-s.y)/t.TILE;const d0=Math.hypot(b.x-s.x,b.y-s.y);for(let k=0;k<20;k++)t.holdWaveStep(b,.5,BR);closer=Math.hypot(b.x-s.x,b.y-s.y)<d0}
    b.x=P.x+10;b.y=P.y;b.cool=0;G.encCool=0;G.modal=false;if(!G.enc)t.holdWaveStep(b,.1,BR);delete s.guardList;
    if(G.enc&&G.enc.hold===q.id){waves++;const e=G.enc;if(waves===1){beside=e.post===s&&e.allies.length===1&&e.allies[0].src===s;s.lv=3;s.broken=false;
      t.startBattle({enemies:e.list,tournament:false});const B=t.B,g=B.groups.a0_tower;tower=!!g&&g.post&&g.team===0&&t.grpUnits(g.id).length===2&&t.grpUnits(g.id).every(u=>u.z>0||B.terrain.lift[t.tIx(B.terrain,u.x,u.y)]>0);
      const gu=B.units.filter(u=>u.sourceArmy&&u.sourceArmy.src===s&&u.type==='hum_spear'),gp=e.allies[0];gn0=gp.troops.length;gs0=s.guards;
      // (one guard down: taken off his party as a blow that kills him takes him, attacks.js)
      if(gu.length){gu[0].hp=0;gp.remove(gu[0].type,1)}
      B.win=true;B.over=true;B.units.filter(u=>u.team===1).forEach(u=>u.hp=0);t.finishBattle();lostG=gs0-s.guards}else t.act('auto')}}
   ok(set>=H.from-2&&closer,'a wave sets out '+(set&&set.toFixed(0))+' tiles off, its foe\'s way, and marches on the outpost');
   ok(beside&&tower,'upon you there: its guards beside you, their archers posted on its tower (yours, holding it)');
   ok(lostG===1,'a guard of its fallen beside you: one fewer guarding it after ('+gs0+' to '+(gs0-lostG)+')');
   ok(waves===H.waves.length&&q.done&&q.wave===H.waves.length,'by it '+H.hours+' hours: '+waves+' waves of the '+t.FACS[foe].n+' beaten, and relief comes: the job done');
   P.quests=[];let q2=null;for(let i=0;i<6&&!q2;i++){q2=t.makeQuest('hold',hh,L);if(q2&&q2.site!==s.i)q2=null}t.acceptQuest(q2);P.x=s.x+8;P.y=s.y+8;hour();P.x=s.x+400;for(let i=0;i<=H.away;i++)hour();
   ok(q2.left&&t.Quest.as(q2).gone()&&/before relief/.test(t.Quest.as(q2).goneWhy()),'left too long once begun: the job lost');
   P.quests=[];let q3=null;for(let i=0;i<6&&!q3;i++){q3=t.makeQuest('hold',hh,L);if(q3&&q3.site!==s.i)q3=null}t.acceptQuest(q3);P.x=s.x+8;P.y=s.y+8;
   for(let i=0;i<H.waves[0];i++)hour();const b3=wave(q3);ok(!!b3&&!G.enc,'a wave sets out at its hour, no fight yet');
   P.x=s.x+400;b3.x=s.x+4;b3.y=s.y;t.holdWaveStep(b3,.1,BR);ok(s.realm===foe&&!wave(q3)&&t.Quest.as(q3).gone(),'it reaches the outpost with you away: the '+t.FACS[foe].n+'\'s, the job lost');
   s.owner=f0;s.guards=g0;P.quests=[];let q4=null;for(let i=0;i<6&&!q4;i++){q4=t.makeQuest('hold',hh,L);if(q4&&q4.site!==s.i)q4=null}t.acceptQuest(q4);P.x=s.x+8;P.y=s.y+8;
   for(let i=0;i<H.waves[0];i++)hour();const b4=wave(q4);b4.x=P.x+10;b4.y=P.y;b4.cool=0;G.encCool=0;t.holdWaveStep(b4,.1,BR);t.Quest.as(q4).ended({how:'lost',enc:G.enc});
   ok(s.realm===foe&&!wave(q4)&&t.Quest.as(q4).gone(),'beaten by it: the outpost the '+t.FACS[foe].n+'\'s, its men its garrison, the job lost');
   s.owner=f0;s.guards=g0;s.broken=false;s.lv=lv0;P.quests=[];G.enc=null;
   // (scouting: the foe's outposts near his lord)
   const Lf=W.lords.filter(l=>l.fac===foe&&!l.dead).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0],hf=t.Spatial.nearest(t.fiefsOf(foe),s.x,s.y);let o=null;for(let i=0;i<6&&!o;i++)o=t.makeQuest('outscout',hf,Lf);
   ok(o&&o.sites.length>=X.least&&o.sites.every(i=>{const x=t.Outposts.of(i);return x&&t.atWar(foe,x.realm)}),'a lord at war wants his foes\' outposts scouted: '+(o&&o.title));
   if(o){t.acceptQuest(o);const A1=t.Outposts.of(o.sites[0]),A2=t.Outposts.of(o.sites[1]);G.clock=t.DAY*.3;
    P.x=A1.x+(X.see-1)*t.TILE;P.y=A1.y;hour();ok(o.looked.includes(A1.i)&&o.caught==null,'from '+(X.see-1)+' tiles, unseen by day: the '+A1.name+' looked on');
    A2.guards=Math.max(1,A2.guards);P.x=A2.x+t.TILE;P.y=A2.y;hour();ok(o.caught===A2.i&&t.Quest.as(o).gone()&&/saw you/.test(t.Quest.as(o).goneWhy()),'a tile from a guarded one by day: its guards see you, the job lost');
    o.caught=null;o.looked=[];G.clock=t.DAY*.75;for(const i of o.sites){const x=t.Outposts.of(i);P.x=x.x+X.spot*.6*t.TILE;P.y=x.y;hour()}
    ok(o.done,'by night closer still, every one looked on unseen: the job done')}}
  finally{W.rel[rk]=r0;P.honor=hon0;P.lrel=lr0;P.hostile=ho0;s.owner=f0;s.guards=g0;s.broken=false;s.lv=lv0;P.quests=[];G.enc=null;G.clock=t.DAY*.3;G.mode='world';t.hidePanel()}}
 // ---- the land each claims round it (doc §4; territory.js): its realm's, its nearest holding's; borders follow it
 {Kit.world({encCool:0});const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking&&t.fiefsOf(x.realm).length),f0=s.realm,
   g=Object.keys(t.FACS).find(k=>k!==f0&&k!=='player'&&t.fiefsOf(k).length),L=S.land.reach,at=()=>t.landHold(s.x,s.y);
  try{ok(t.Outposts.live&&t.Outposts.claims().some(c=>c.s===s&&c.lim===L[Math.max(1,s.lv-(s.broken?1:0))])&&at()===s.supplier(),'a held outpost claims the land round it ('+L[s.lv]+' reach at level '+s.lv+') for its realm\'s nearest holding ('+(at()&&at().name)+')');
   const n0=t.landsOf(f0),m0=t.landsOf(g);s.owner=g;ok(at()&&at().owner===g&&t.landsOf(f0)<n0&&t.landsOf(g)>m0,'handed to the '+t.FACS[g].n+': the land round it theirs now, the border moved ('+n0+' to '+t.landsOf(f0)+' tiles of the '+t.FACS[f0].n+'\'s)');
   s.owner='bandits';ok(!t.Outposts.claims().some(c=>c.s===s),'a band\'s lair claims none');
   s.owner=f0;t.Outposts.live=false;try{ok(!t.Outposts.claims().length&&t.Outposts.landKey()===0,'before a game\'s are placed (a new world), none claim')}finally{t.Outposts.live=true}
   ok(at()===s.supplier()&&t.landsOf(f0)===n0,'its own again: the land as it was')}
  finally{s.owner=f0}}
 // ---- through a save
 {const rec=all().map(s=>[s.name,s.realm,s.lv,s.guards].join());t.saveGame(true,'quick');W.sites=[];t.loadGame('quick');
  ok(all().length===A.length&&all().map(s=>[s.name,s.realm,s.lv,s.guards].join()).join('|')===rec.join('|')&&all().every(s=>s instanceof t.Outpost),'a save keeps every outpost, whose it is, its level and its guards')}
});
