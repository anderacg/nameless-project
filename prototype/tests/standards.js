'use strict';
// Standards (doc/STANDARDS_DESIGN.md phase 1; the owner, 2026-11-10: "every factions will also have a static flag in their
// territory ... This tower and flag can be captured by another factions or even bandits, goblin"): a realm's standards on its
// land at its crossings, fords, passes and resources, the same every time a world begins; drawn (a plinth, a pole, its banners; a
// tower from level 2); taken by you: its guards beaten, your banner up after STANDARD.hold hours by it, for the realm you serve,
// for yourself once you hold a holding, else handed to a realm near or left to no one; its guards back a day; all through a save.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,S=t.STANDARD,SP=t.STANDARD_PLACE;
 Kit.begin('soldier');
 const all=()=>t.Standards.all(),A=all();
 info(A.length+' standards: '+A.map(s=>s.name+' ('+s.realm+', level '+s.lv+')').join('; '));
 // ---- where they stand
 const why=A.reduce((a,s)=>(a[s.why]=(a[s.why]||0)+1,a),{}),gap=Math.min(...A.flatMap((a,i)=>A.slice(i+1).map(b=>Math.hypot(a.tx-b.tx,a.ty-b.ty))));
 ok(A.length>=8&&A.every(s=>s instanceof t.Standard&&W.sites.includes(s)&&t.FACS[s.realm]&&s.realm!=='player'),A.length+' standards among the sites, each a realm\'s');
 {const bad=A.filter(s=>!(t.tAt(s.tx,s.ty)===t.T_OPEN&&!t.Standards.built(s.tx,s.ty)&&t.Standards.realmAt(s.tx,s.ty)===s.realm)).map(s=>s.name+' '+t.tAt(s.tx,s.ty)+' '+t.Standards.built(s.tx,s.ty)+' '+t.Standards.realmAt(s.tx,s.ty)+'/'+s.realm);ok(!bad.length,'each on open ground of its own realm\'s land, nothing built within '+SP.clear+' tiles'+(bad.length?': '+bad.join(', '):''))}
 ok(gap>=SP.gap&&why.deposit>0&&Object.keys(why).length>=2,'at least '+SP.gap+' tiles apart ('+gap.toFixed(1)+'); at deposits and at crossings, fords or passes ('+JSON.stringify(why)+')');
 {const byP=new Map();for(const s of A){const p=t.Provinces.at(s.x,s.y);byP.set(p,(byP.get(p)||0)+1)}ok([...byP.values()].every(n=>n<=SP.most+1),'at most '+(SP.most+1)+' a province');
  const again=t.Standards.place();ok(again.length===A.length&&again.every((s,i)=>s.tx===A[i].tx&&s.ty===A[i].ty&&s.name===A[i].name&&s.lv===A[i].lv),'the same standards every time the world is reckoned (no draw)')}
 ok(A.every(s=>s.guards===S.guards[s.lv]&&s.lv>=1&&s.lv<=3)&&A.some(s=>s.lv>=2),'its guards by its level ('+S.guards.slice(1).join(', ')+'), some with a tower');
 // ---- drawn, on the minimap and among the places
 {const one=A.find(s=>s.lv===1),two=A.find(s=>s.lv>=2),a=one&&t.siteSprite(one),b=two&&t.siteSprite(two);
  ok(a&&b&&a.width>0&&b.width>a.width&&a===t.siteSprite(one)&&t.Discovery.places().includes(two)&&Array.isArray(two.mapDot(0)||[]),'drawn as a standard, wider with its tower, made once; among the places you discover')}
 // ---- taken by you: you serve no one and hold nothing: handed to a realm near
 const strong=()=>{P.troops={hum_knight:40,hum_long:20};P.hp=null;t.vitals()};
 {Kit.world({encCool:0});strong();P.fac=null;const s=A.find(x=>x.guards>0),f0=s.realm,r0=P.renown;P.x=s.x+10;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();
  ok(/Attack its guards/.test(Kit.panel()),'its page: whose it is and Attack its guards');
  t.act('site-attack');ok(G.enc&&G.enc.kind==='standard'&&G.enc.ref===s&&G.enc.list.length===s.guards&&t.hostileTo(f0),'attacking it: its guards to fight, and its realm hostile to you');
  t.act('auto');ok(s.guards===0&&s.taking&&s.taking.h===0,'its guards beaten: your banner begins to go up');
  G.mode='world';G.modal=false;t.hidePanel();for(let i=0;i<S.hold;i++)t.Standards.hour();
  ok(s.choose&&!s.taking&&G.mode==='site'&&G.site===s&&/Hand it to the/.test(Kit.panel())&&!s.nearRealms().some(([k])=>k===f0),'after '+S.hold+' hours by it, the realms near it to hand it to (not the one you took it from)');
  const to=s.nearRealms()[0][0],r1=P.renown;t.act('site-hand',to);ok(s.realm===to&&!s.choose&&s.guards===1&&P.renown===r1+S.renown&&r1>r0,'handed to the '+t.FACS[to].n+': its banner theirs, a guard of theirs, renown +'+S.renown);
  s.day();ok(s.guards===2,'its guards back a day while its realm holds it')}
 // ---- for the realm you serve; and walking off breaks it off
 {Kit.world({encCool:0});strong();const s=A.find(x=>x.realm&&x.realm!=='karn'&&x.guards>0&&!x.choose);P.fac='karn';s.guards=0;P.x=s.x;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();
  ok(/Raise your banner/.test(Kit.panel()),'no guards left: Raise your banner');t.act('site-attack');ok(s.taking,'your banner goes up at once');
  P.x=s.x+S.r*4;t.Standards.hour();ok(!s.taking&&s.realm!=='karn','walk well off and it is broken off');
  P.x=s.x;t.act('site-attack');for(let i=0;i<S.hold;i++)t.Standards.hour();ok(s.realm==='karn'&&!s.choose,'stay by it: it flies the colours of the realm you serve');
  G.site=s;t.showSite();ok(!/Attack its guards|Raise your banner/.test(Kit.panel()),'and yours to keep: no attack on it');P.fac=null}
 // ---- edge cases: names, their tiles kept from building, a fallen realm's, a fight fought out on the field
 {const names=all().map(s=>s.name);ok(new Set(names).size===names.length,'every standard its own name');
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
  ok(ents.length===1+Math.min(S.sentries.most,s.guards)&&t.FACS[s.realm]&&typeof s.sentryType()==='string','in your sight its sentries walk their beat round it ('+(ents.length-1)+', '+s.sentryType()+')')}
 // ---- a lost fight: those of its guards you slew stay dead; your own standards' guards from your nearest holding
 {const s=all().find(x=>x.guards>=3&&t.FACS[x.realm]&&x.realm!=='player'),g0=s.guards;t.ON_WIN.standard.lost({ref:s},['hum_spear','hum_spear','chief']);ok(s.guards===g0-2,'beaten off it: the two guards you slew stay dead ('+g0+' to '+s.guards+')');s.guards=g0}
 {const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking),f=s.realm,h=t.TOWNS.find(x=>x.owner===f&&!x.gone),o0=h.owner,g0=h.gar,keep=s.guards;
  try{h.owner='player';h.gar=10;s.owner='player';s.guards=0;s.broken=false;const sup=s.supplier();s.day();
   ok(sup===h&&s.guards===1&&h.gar===9&&s.guardList().length===1,'yours: a man a day from your nearest holding\'s garrison ('+h.name+')');h.gar=S.own.keep;s.day();ok(s.guards===1&&h.gar===S.own.keep,'but never below '+S.own.keep+' at home')}
  finally{h.owner=o0;h.gar=g0;s.owner=f;s.guards=keep}}
 // ---- phase 3: the world's captures
 {const R0=Math.random;Math.random=()=>0;try{
  const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking),f=s.realm,foe=Object.keys(t.FACS).find(k=>k!=='player'&&k!==f&&!t.W.dead[k]);
  const r0=t.W.rel[t.rk(f,foe)];t.W.rel[t.rk(f,foe)]={s:'war',since:0};const L=W.lords.find(l=>l.fac===foe&&!l.dead),l0={x:L.x,y:L.y,inside:L.inside,fight:L.fight};
  try{L.inside=null;L.fight=null;L.x=s.x+8;L.y=s.y;L.troops=Array(Math.max(2,s.guards*S.capture.more)).fill('hum_spear');t.Standards.day();
   ok(s.realm===foe&&s.since===t.G.day,'a lord at war with its realm, strong enough, by it: he takes it for the '+t.FACS[foe].n);
   L.fac=f;t.W.rel[t.rk(f,foe)]={s:'war',since:0};L.fac=foe}finally{Object.assign(L,l0);t.W.rel[t.rk(f,foe)]=r0;s.owner=f;s.guards=S.guards[s.lv];s.broken=false}
  // (a band by a weakly held one makes it its lair; its raiders ride out of it; you drive them out)
  const n0=t.bandits.length,b=t.asParty({x:s.x+6,y:s.y,n:8,kind:'bandits',list:t.makeEnemies(8,false,'bandits'),t:0,a:0,idle:false,cool:0,ld:t.newChief('bandits',1)});t.bandits.push(b);s.guards=1;t.Standards.day();
  ok(s.band==='bandits'&&!t.bandits.includes(b)&&s.guards===8&&s.banner().k==='rag'&&/lair/.test((G.site=s,G.mode='site',t.showSite(),Kit.panel())),'a band by a weakly held one: their lair now, their men its guards, their rag, its page says so');
  ok(t.Provinces.danger(t.Provinces.at(s.x,s.y)).what.join().length>0&&t.W.sites.filter(x=>x.band).length>=1,'a lair counts in its province\'s danger');
  s.raided=-99;s.day();const out=t.bandits.filter(o=>o.lair===s.i);ok(out.length===1&&out[0].kind==='bandits','a band rides out of it to raid the roads');
  t.bandits=t.bandits.filter(o=>o.lair!==s.i);
  Kit.world({encCool:0});P.troops={hum_knight:40};P.hp=null;t.vitals();P.x=s.x+10;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();ok(/Drive them out/.test(Kit.panel()),'you may drive them out');
  t.act('site-attack');ok(G.enc&&G.enc.kind==='standard'&&G.enc.band==='bandits','a fight with its raiders');t.act('auto');ok(!s.band&&!s.realm&&s.taking,'driven out: no one\'s, your banner going up');
  s.taking=null;s.owner=f;s.guards=S.guards[s.lv];s.broken=false;G.mode='world';t.hidePanel()
  }finally{Math.random=R0}}
 // ---- sight round yours and your employer's; no band raised by a held one
 {const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'),f=s.realm;P.fac=f;const S0=t.W.seen;t.W.seen=new Uint8Array(t.MW*t.MH);try{s.watch();ok(t.seenAt(s.x,s.y)&&t.seenAt(s.x+(S.sight-1)*t.TILE,s.y),'your employer\'s: the fog lifted '+S.sight+' tiles round it')}finally{t.W.seen=S0;P.fac=null}
  ok(t.Standards.guarded(s.x+t.TILE,s.y)&&!t.Standards.guarded(s.x+(S.safe+2)*t.TILE*2,s.y+(S.safe+2)*t.TILE*2),'no band is raised within '+S.safe+' tiles of a held one')}
 // ---- phase 4: the outposts' quests
 {Kit.world({encCool:0});P.troops={hum_knight:40};P.hp=null;t.vitals();P.fac=null;P.quests=[];
  // (the outpost nearest another realm's holding, and that realm)
  let s=null,foe=null,bd=1e9;for(const x of all())if(t.FACS[x.realm]&&x.realm!=='player'&&!x.choose&&!x.taking)for(const h of t.TOWNS)if(!h.gone&&t.FACS[h.owner]&&h.owner!=='player'&&h.owner!==x.realm){const d=Math.hypot(h.x-x.x,h.y-x.y);if(d<bd){bd=d;s=x;foe=h.owner}}
  const f0=s.realm,r0=t.W.rel[t.rk(f0,foe)];
  t.W.rel[t.rk(f0,foe)]={s:'war',since:0};const L=W.lords.find(l=>l.fac===foe&&!l.dead),h=t.Spatial.nearest(t.fiefsOf(foe),s.x,s.y);
  try{let q=null;for(let i=0;i<4&&!q;i++){q=t.makeQuest('outpost',h,L);if(q&&q.site!==s.i)q=null}
   if(!q){const near=t.Standards.all().filter(x=>x!==s);near.forEach(x=>x._k=x.owner);near.forEach(x=>x.owner=foe);try{q=t.makeQuest('outpost',h,L)}finally{near.forEach(x=>{x.owner=x._k;delete x._k})}}
   ok(q&&q.site===s.i&&/Take the /.test(q.title)&&q.fac===foe,'a lord at war wants an outpost of his foes taken: '+(q&&q.title));
   t.acceptQuest(q);G.site=s;G.mode='site';s.guards=0;s.broken=false;P.x=s.x;P.y=s.y+12;t.act('site-attack');for(let i=0;i<S.hold;i++)t.Standards.hour();
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
 // ---- through a save
 {const rec=all().map(s=>[s.name,s.realm,s.lv,s.guards].join());t.saveGame(true,'quick');W.sites=[];t.loadGame('quick');
  ok(all().length===A.length&&all().map(s=>[s.name,s.realm,s.lv,s.guards].join()).join('|')===rec.join('|')&&all().every(s=>s instanceof t.Standard),'a save keeps every standard, whose it is, its level and its guards')}
});
