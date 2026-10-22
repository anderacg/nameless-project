'use strict';
// Sites: caves, traveller camps, bandit hideouts, ruins and shrines are spread over the map, reachable, hidden until seen;
// each one plays out (fights, chests, trade, sellswords, rest, news, prayer), refills or moves on, saves, and is drawn. A bandit
// camp or hideout, and a cave, open a page when you click them (tests/siteopen.js: only then): scouting, attacking (it asks
// first), a camp's parley, Leave.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,MW=t.MW,MH=t.MH,TILE=t.TILE;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const panel=()=>document.getElementById('panel').innerHTML;
 t.act('begin','soldier');
 const S=W.sites,of=ty=>S.filter(s=>s.type===ty),want=Object.keys(t.SITE_TYPES);
 // (as many as the world holds, data/world.js density: at least 9 in 10, the travellers wanting a roadside)
 ok(want.every(ty=>{const n=of(ty).length,w=t.SITE_TYPES[ty].spots?t.CAMP_SPOTS.length:t.density(t.WM).sites[ty];return n<=w&&n>=w*.9}),'every kind placed: '+want.map(ty=>of(ty).length+' '+ty).join(', '));
 // (the travellers' camps (the owner's play-test, 2026-10-22: "too many pilgrim and wanderer camps"): as many as the world's road
 // holds (data/world.js DENSITY.grow roads), each by a road, SITE_GAP's tiles from another and from the outlaws' camps and hideouts)
 {const tv=of('travelers'),G2=t.SITE_GAP.travelers,near=(a,L)=>Math.min(...L.filter(b=>b!==a).map(b=>Math.hypot(a.tx-b.tx,a.ty-b.ty))),bc=[...of('camp'),...of('hideout')];
  const d1=Math.min(...tv.map(a=>near(a,tv))),d2=Math.min(...tv.map(a=>near(a,bc)));
  ok(tv.length===t.density(t.WM).sites.travelers&&tv.every(s=>t.TravellersCamp.ground(s.tx,s.ty))&&d1>=G2.travelers&&d2>=Math.min(G2.camp,G2.hideout),'the travellers\u2019 camps: '+tv.length+' by '+t.worldRoads(t.WM)+' tiles of road (a track\u2019s a half), each by a road, '+d1.toFixed(1)+' tiles apart at the least ('+G2.travelers+'), '+d2.toFixed(1)+' from the outlaws\u2019 camps and hideouts ('+G2.camp+')')}
 const at=s=>s.type==='cave'?s.ty+1:s.ty;ok(S.every(s=>t.passable(t.tAt(s.tx,at(s)))&&t.Router.reach(t.TOWNS[0],{x:(s.tx+.5)*t.TILE,y:(at(s)+.5)*t.TILE})),'all '+S.length+' sites stand on ground you can reach (a cave: the ground at its mouth)');
 const quad=[0,1,2,3].map(q=>S.filter(s=>(s.tx<MW/2?0:1)+(s.ty<MH/2?0:2)===q).length);ok(quad.every(n=>n>=4),'spread over the whole map (per quarter: '+quad.join(', ')+')');
 ok(S.every(s=>t.TOWNS.every(w=>Math.hypot(w.tx-s.tx,w.ty-s.ty)>=6)),'none sit on top of a holding');
 ok(of('cave').every(s=>t.MONSTERS[s.id]),'every cave has a lair beast ('+[...new Set(of('cave').map(s=>s.id))].join(', ')+')');
 // hidden until seen
 ok(S.filter(s=>s.known()&&s.type!=='camp').length===0,'sites start hidden');
 {const k=of('camp').filter(s=>s.known());ok(k.length<of('camp').length&&of('camp').every(c=>c.known()===t.seenAt(c.x,c.y)),'bandit camps stand in plain sight: on the map (and the minimap) once you have seen their ground, not before ('+k.length+' of '+of('camp').length+' known at the start)')}
 // (reached and clicked: your scouts see it as you come, and the click beside it opens it: world.js clickAt, interact)
 const go=s=>{P.x=s.x;P.y=s.y;P.tx=null;G.mode='world';G.modal=false;t.hidePanel();G.encCool=0;G.lastSite=null;t.updateSites();return t.interact(s)};
 const strong=()=>{P.troops={hum_knight:25,hum_long:15};P.hp=null;t.vitals()};
 // cave
 const cave=of('cave')[0];go(cave);ok(cave.seen&&G.mode==='site'&&new RegExp(cave.name).test(panel())&&document.querySelector('.pg-banner')&&/tracks/.test(panel()),'reaching a cave spots it and opens its page');
 t.act('site-fight');ok(G.enc&&G.enc.kind==='cave'&&G.enc.list.length===t.MONSTERS[cave.id].count[1]+1&&new RegExp(cave.name).test(panel()),'entering starts a lair fight');
 strong();const g0=P.gold,inv0=P.inv.filter(Boolean).length;t.act('auto');
 ok(cave.cleared&&cave.back===G.day+25&&P.gold>g0&&/chest/.test(panel()),'winning empties the cave and opens its chest (+'+(P.gold-g0)+' gold)');t.act('cont');done();
 ok(!t.updateSites()&&G.mode==='world','standing on it does not reopen it');
 G.day=cave.back;t.siteDay();ok(!cave.cleared,'after 25 days something new moves in');
 // hideout
 const hid=of('hideout')[0];go(hid);ok(G.mode==='site'&&!G.enc&&new RegExp(hid.name).test(panel()),'reaching a '+hid.name.toLowerCase()+' opens its page (no fight yet)');
 t.act('site-attack');ok(G.enc&&G.enc.kind==='camp'&&G.enc.list.includes('chief')&&new RegExp(hid.name).test(panel()),'Attack: it fights with a chieftain');
 strong();t.act('auto');ok(hid.cleared&&hid.back===G.day+10,'beating it clears the hideout for 10 days');t.act('cont');done();
 // ruins
 let fights=0,chests=0,lore=0;
 for(let k=0;k<40;k++){const r=of('ruins')[k%of('ruins').length];r.cleared=false;r.looted=false;delete r.stirs;delete r.guard;go(r);const gg=P.gold;t.act('site-search');
   if(G.enc){fights++;strong();t.act('auto');t.act('cont');done()}else{if(P.gold>gg)chests++;else lore++;t.act('site-leave')}}
 ok(fights&&chests&&lore,'searching ruins finds chests ('+chests+'), lore ('+lore+') or guardians ('+fights+')');
 // shrine
 const sh=of('shrine')[0];go(sh);const m=t.vitals();P.sp=1;P.mp=1;t.act('site-pray','0');ok(P.sp===m[1]&&P.mp===m[2]&&sh.back===G.day+7,'praying restores stamina and mana');
 t.act('site-tab','pray');ok(document.querySelector('[data-act="site-pray"]').disabled,'and only once a week');t.act('site-leave');
 // travellers
 const tr=of('travelers').find(s=>t.TRAVELERS[s.kind].race)||of('travelers')[0];if(!t.TRAVELERS[tr.kind].race){tr.kind=0;tr.stockUp()}
 go(tr);ok(G.mode==='site'&&new RegExp(tr.name).test(panel()),'a camp of '+tr.name.toLowerCase());
 P.gold=2000;P.troops={};P.inv=P.inv.map(()=>null);const g=Object.keys(tr.stock)[0],n0=t.goodN(g);t.act('site-buy',g);ok(t.goodN(g)===n0+5,'buy '+g+' from them');
 const w=tr.swords()[0];t.act('site-hire',String(w.i));ok(P.troops[w.k]===1,'hire a sellsword ('+w.name+', '+t.ST[w.k].n+') with no standing');
 P.hp=10;t.act('site-tab','fire');t.act('site-fire');ok(P.hp>10&&document.querySelector('[data-act="site-fire"]').disabled,'rest by their fire once a day');
 const seen0=S.filter(s=>s.seen).length;t.act('site-news');ok(S.filter(s=>s.seen).length===seen0+2&&/on your map/.test(panel()),'news puts two new places on your map');
 t.invAdd('mat','pelt',3);const g1=P.gold;t.act('site-sell');ok(P.gold>g1&&!t.invCount('mat','pelt'),'they buy trophies');
 t.act('site-leave');ok(G.mode==='world','Leave returns to the map');
 const x0=tr.x,y0=tr.y;G.day=tr.until;G.lastSite=null;t.siteDay();ok((tr.x!==x0||tr.y!==y0)&&!tr.seen&&tr.until>G.day,'travellers pack up and move on');
 // save and load
 G.mode='world';t.saveGame();const snap=JSON.stringify(S.map(s=>[s.type,s.x,s.y,s.seen,s.cleared]));W.sites=[];t.act('load');
 ok(JSON.stringify(W.sites.map(s=>[s.type,s.x,s.y,s.seen,s.cleared]))===snap,'sites, what you found and what you cleared survive a reload');
 // drawn
 const blank=W.sites.filter(s=>{const c=t.siteSprite(s),px=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let j=3;j<px.length;j+=4)if(px[j])n++;return n<40});
 ok(!blank.length,'every site has a sprite');
 W.sites.forEach(s=>s.seen=true);P.x=W.sites[0].x+30;P.y=W.sites[0].y;G.mode='world';G.modal=false;t.hidePanel();t.frame();
 t.frame();
 // each kind of site is a class over its plain data
 {const ks=Object.keys(t.SITE_TYPES);ok(ks.every(k=>t.SITE_CLASS[k]&&t.SITE_CLASS[k].prototype instanceof t.Site),'every kind of site has its class ('+ks.map(k=>t.SITE_CLASS[k].name).join(', ')+')');
  ok(W.sites.every(x=>x instanceof t.SITE_CLASS[x.type]),'and every site on the map is one of its kind');
  ok(t.camps()[0] instanceof t.Lair&&W.sites.find(x=>x.type==='hideout') instanceof t.Lair,'camps and hideouts are both bandit lairs');
  const raw=JSON.parse(JSON.stringify(W.sites[0]));ok(!('T' in raw)&&!('label' in raw)&&raw.type,'saved as plain data');G.mode='world';G.modal=false;t.hidePanel();t.saveGame(true);t.loadGame();ok(W.sites.every(x=>x instanceof t.Site),'and made sites again when loaded')}
 // bandits keep their distance from the estates: no estate's building or field within BANDIT_GAP tiles of a camp or hideout
 {let worst=1e9,who='';for(const b of [...t.camps(),...of('hideout')])for(const q of t.TOWNS)for(const l of q.lots||[]){if(!t.ESTATES[l.k])continue;const ts=[];t.lotTiles(l,(x,y)=>ts.push([x,y]));(l.plots||[]).forEach(p=>ts.push(p));
   for(const [x,y] of ts){const d=Math.hypot(x-b.tx,y-b.ty);if(d<worst){worst=d;who=b.type+' by '+q.name+'’s '+l.k}}}
  ok(worst>=t.BANDIT_GAP,'no bandit camp or hideout within '+t.BANDIT_GAP+' tiles of an estate or its fields (nearest: '+worst.toFixed(1)+', a '+who+')');
  // (a camp with no other camp or hideout near the spot just past its gap to the east: on some worlds a second one stands there)
  const G=t.BANDIT_GAP,c=t.camps().find(c=>!t.nearBandits(c.tx+G+1,c.ty,G))||t.camps()[0];ok(t.nearBandits(c.tx+3,c.ty,G)&&!t.nearBandits(c.tx+G+1,c.ty,G),'the same rule stops you building an estate beside one')}
 // the bandit camps are sites too: on their fixed spots, in plain sight, a chieftain and the bands sheltering there
 {const c=t.camps()[0];ok(t.camps().length===t.CAMP_SPOTS.length&&t.camps().every(x=>t.CAMP_SPOTS.some(p=>p.tx===x.tx&&p.ty===x.ty))&&t.objKind(c)==='site'&&/Bandit camp/.test(t.tipFor(c)),'the '+t.CAMP_SPOTS.length+' bandit camps are sites on their spots, with their own tooltip');
  G.mode='world';G.modal=false;t.hidePanel();G.encCool=0;G.enc=null;c.cleared=false;c.bands=[t.asParty({x:c.x,y:c.y,n:3,kind:'bandits',list:['militia','militia','militia'],t:0,a:0,cool:0})];t.enterSite(c);
  ok(G.mode==='site'&&!G.enc,'clicked, one opens its page');t.act('site-attack');
  ok(G.enc&&G.enc.kind==='camp'&&G.enc.ref===c&&G.enc.list.includes('chief')&&G.enc.list.length>=10,'Attack means fighting its chieftain, its raiders and the band sheltering there ('+(G.enc&&G.enc.list.length)+')');t.act('flee');
  t.clearPlace(c,10);ok(c.cleared&&t.pickAt(c.x,c.y-12)!==c,'cleared, it lies empty ('+c.cleared+')');G.day=c.back;t.siteDay();ok(!c.cleared,'and its raiders are back after 10 days ('+c.cleared+' day '+G.day+' back '+c.back+')')}
 // ---- a bandit camp or hideout clicked opens its page (sites.js Lair, window.js PageScreen): what you can see from
 // outside, vague; Scout (once a visit) for the truth; Attack (it asks first: the fight as walking in made it); Parley (pay them
 // off, or make them yield if they fear you); Leave. Cleared, it lies empty. Bands that catch you on the road fight as before
 {const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],world=()=>{G.mode='world';G.modal=false;t.hidePanel();G.encCool=0;G.enc=null;G.site=null;G.siteSpy=null;G.par=null;G.lastSite=null;P.tx=null;G.chase=null};
  const lucky=(a,arg,r)=>{const r0=Math.random;let f=true;const s=t.seeded(91);Math.random=()=>f?(f=false,r):s();try{t.act(a,arg)}finally{Math.random=r0}};
  const c=t.camps()[1],acts=()=>qa('.rwbody .rkact').map(b=>b.dataset.act+':'+b.dataset.rk).join();P.troops={hum_knight:4,hum_long:4};P.gold=2000;P.sk.scout.lv=3;// (a rough read before scouting: window.js insight; tests/conduct.js reads every level)
  world();c.cleared=false;c.bands=[];P.x=c.x;P.y=c.y+6;t.updateSites();ok(G.mode==='world'&&!G.site,'walking up to it, unclicked, opens nothing');t.interact(c);
  ok(G.mode==='site'&&G.site===c&&!G.enc&&q('#panel.paged')&&!q('.rail')&&q('.rwin h2').textContent===c.name&&acts()==='site-scout:q,site-ask:w,site-tab:e'&&/Fewer than|handful|dozen|score|fifteen|dozens/.test(q('.pg-facts').textContent)&&q('.rwbody>.pg-banner')&&!q('.pg-banner').textContent.trim(),
    'a bandit camp clicked opens its page: no fight, its picture (a banner, no words), what you can see ('+q('.pg-facts').textContent+'), Scout, Attack and Parley (Q W E)');
  {const g=c.guess(),txt=q('.rwbody').textContent;ok(new RegExp(t.roughly(g.n),'i').test(txt)&&/they look/i.test(txt)&&/Talk of plunder/.test(txt)&&c.ld&&txt.includes(c.ld.name)&&!/Power \d/.test(txt)&&!/Tier \d/.test(txt)&&!/×\d/.test(txt),'before scouting all of it vague: '+t.roughly(g.n)+', how strong they look, a rumour of loot, their chief by name; no counts, kinds or power')}
  // Scout: unseen, the exact numbers, kinds and loot, and the fight is the one they saw
  {const sk0=P.sk.scout.xp+P.sk.scout.lv*1e4;lucky('site-scout',null,0);const y=c.spied(),txt=q('.rwbody').textContent,all=c.all(y.list);
    ok(y&&y.list.length&&y.list.includes('chief')&&/What your scouts saw/.test(panel())&&new RegExp('Power '+c.power(all)).test(txt)&&qa('.rwbody .rcard').length===Object.keys(t.countsOf(all)).length&&/Loot: about \d+ gold/.test(txt)&&q('.pg-msg')&&P.sk.scout.xp+P.sk.scout.lv*1e4>sk0,
      'Scout, unseen: the exact numbers ('+all.length+'), a card for each kind, their power and loot; Scouting trained');
    ok(q('.rkact[data-act="site-scout"]').disabled&&/had their look/.test(q('.rkact[data-act="site-scout"]').title),'once a visit: Scout is spent');
    t.act('site-ask');ok(q('#panel.confirm')&&!G.enc&&q('.nav [data-nav="close"]').dataset.act==='site-attack'&&new RegExp('Power '+c.power(all)).test(panel()),'Attack asks first, with the power your scouts saw');
    t.onEscape();ok(q('#panel.paged')&&G.site===c&&!G.enc,'Back: the page again, no fight');
    t.act('site-ask');q('.nav [data-nav="close"]').click();ok(G.enc&&G.enc.kind==='camp'&&G.enc.ref===c&&G.enc.list.join()===all.join()&&G.enc.mine,'Confirm: the camp fight, against exactly what your scouts saw ('+G.enc.list.length+')');t.act('flee')}
  // unscouted, Attack is the very fight walking in made: the same rolls, the same foes
  {world();const sd=4711,r0=Math.random;Math.random=t.seeded(sd);const want=t.makeEnemies(t.rint(7,9)+Math.floor(G.day/15),true).join();P.x=c.x;P.y=c.y+6;t.enterSite(c);Math.random=t.seeded(sd);t.act('site-attack');Math.random=r0;
    ok(G.enc&&G.enc.list.join()===want,'unscouted, Attack rolls the same fight as walking in did (its raiders and chieftain as before: '+G.enc.list.length+' foes)');t.act('flee')}
  // seen: they come out for you
  {world();t.enterSite(c);lucky('site-scout',null,.999);ok(G.enc&&G.enc.kind==='camp'&&G.enc.ref===c&&!G.enc.mine&&!G.site,'Scout, seen: they come out for you, a fight you did not start');t.act('flee')}
  // Parley: pay them off; make them yield (only if they fear you); they refuse and fight
  {world();t.enterSite(c);t.act('site-tab','parley');const tb=t.tribute(c),ks=qa('.rwbody .rkact');
    ok(q('.rwin h2').textContent==='Parley'&&ks.map(b=>b.dataset.act).join()==='site-pay,site-yield'&&ks[1].disabled&&/do not fear/.test(ks[1].title)&&new RegExp(tb+'g').test(ks[0].textContent)&&q('.nav [data-nav="back"]').dataset.act==='site-tab','Parley: pay '+tb+'g to break camp; no surrender while they do not fear you; Back');
    const g0=P.gold;t.act('site-pay');ok(P.gold===g0-tb&&c.cleared&&!c.ld&&G.mode==='site'&&/lies empty/.test(panel())&&/ridden off/.test(panel()),'paid: they break camp and ride off, the camp empty');
    t.act('site-leave');ok(G.mode==='world'&&!G.site,'Leave: the map')}
  {c.cleared=false;c.returned();c.bands=[];world();P.troops={hum_knight:40,hum_long:30};P.sk.scout.lv=5;t.enterSite(c);t.act('site-tab','parley');const y=q('.rkact[data-act="site-yield"]');P.sk.scout.lv=3;ok(y&&!y.disabled&&/% they yield/.test(y.textContent),'with a band that frightens them, Demand surrender ('+y.querySelector('small').textContent+')');
    lucky('site-yield',null,0);ok(G.siteTab==='yield'&&q('.rwin h2').textContent==='They yield'&&qa('.rwbody .rkact').map(b=>b.dataset.arg).join()==='cage,join,free'&&q('.nav [data-nav="close"]').dataset.act==='site-fate','they yield: take them prisoner, into your band, or let them go');
    P.prisoners={};const ld=c.ld,p0=t.prisonerCount(),g0=P.gold;t.act('site-fate','cage');/* (room for them: the fights before may have filled it) */ok(c.cleared&&t.prisonerCount()>p0&&P.gold>g0&&t.captives().some(x=>x.ld===ld)&&/lies empty/.test(panel()),'prisoners: bound and marched with you, their plunder and their chieftain yours, the camp empty')}
  {c.cleared=false;c.returned();c.bands=[];world();t.enterSite(c);t.act('site-tab','parley');lucky('site-yield',null,.999);ok(G.enc&&G.enc.kind==='camp'&&G.enc.ref===c&&!c.cleared,'they refuse: the camp fight');t.act('flee')}
  {c.cleared=false;c.returned();c.bands=[];world();P.troops={hum_knight:40,hum_long:30};t.enterSite(c);t.act('site-tab','parley');lucky('site-yield',null,0);P.troops={hum_knight:2};const n0=t.troopCount();t.act('site-fate','join');ok(c.cleared&&t.troopCount()>n0&&G.mode==='site'&&/brigands join/.test(panel()),'into your band: the brigands join ('+(t.troopCount()-n0)+')')}
  // cleared: it lies empty, Leave only
  {world();c.back=G.day+6;t.enterSite(c);ok(G.mode==='site'&&q('#panel.paged')&&/lies empty/.test(panel())&&/6 days/.test(panel())&&!q('.rwbody .rkact')&&q('.nav [data-nav="close"]').dataset.act==='site-leave','a cleared camp: it lies empty, back in 6 days, nothing but Leave');t.act('site-leave')}
  // a hideout the same
  {const h=of('hideout')[1]||of('hideout')[0];h.cleared=false;h.seen=true;world();t.enterSite(h);ok(G.mode==='site'&&!G.enc&&q('#panel.paged')&&acts()==='site-scout:q,site-ask:w,site-tab:e','a hideout opens the same page');
    lucky('site-scout',null,0);const all=h.all(h.spied().list);t.act('site-attack');ok(G.enc&&G.enc.kind==='camp'&&G.enc.list.join()===all.join()&&G.enc.list.includes('chief'),'its scouted fight, chieftain and all');t.act('flee')}
  // the cave: tracks and bones until scouted; Scout shows what lairs there, its level and loot, and that is the fight; seen, it wakes
  {const cv=of('cave')[1]||of('cave')[0],M=t.MONSTERS[cv.id];cv.cleared=false;cv.seen=true;world();t.enterSite(cv);const txt=q('.rwbody').textContent;
    ok(/Tracks and bones|tracks/.test(txt)&&!txt.includes(M.n)&&!txt.includes(t.ST[M.unit].n)&&!/level \d/i.test(txt),'a cave before scouting: tracks and bones, a rough size, not what lairs there');
    // (the scout made to succeed, his roll and the level's seeded: the revealed facts checked against the cave's own beast, count,
    // level, trophy and gear)
    {const r0=Math.random;Math.random=t.seeded(5150);try{lucky('site-scout',null,0)}finally{Math.random=r0}}
    {const y=cv.spied(),n=M.count[1]+1,card=q('.rwbody .rcard'),t2=(card&&card.textContent||'').toLowerCase(),want=[t.ST[M.unit].n,'level '+(y&&y.lv),t.MATS[M.mat].n,...M.gear.map(([it])=>t.ITEMS[it].n)].map(x=>String(x).toLowerCase()),miss=want.filter(x=>!t2.includes(x));
      ok(y&&y.lv>=1&&card&&card.querySelector('.rc-n').textContent==='×'+n&&!miss.length&&/likely loot/.test(t2),'scouted: '+n+' × '+t.ST[M.unit].n+', level '+(y&&y.lv)+', its trophy and gear'+(miss.length?' (missing: '+miss.join(', ')+')':''))}
    const y=cv.spied();
    t.act('site-ask');q('.nav [data-nav="close"]').click();ok(G.enc&&G.enc.kind==='cave'&&G.enc.lv===y.lv&&G.enc.list.length===M.count[1]+1,'Enter asks first, then the lair fight at the level they saw');t.act('flee');
    world();t.enterSite(cv);lucky('site-scout',null,.999);ok(G.enc&&G.enc.kind==='cave'&&!G.site,'seen, the beasts wake: the fight at once');t.act('flee')}
  // bands that catch you on the road: as before, the fight (or, cornered, their parley), never a page
  {world();P.troops={hum_levy:1};t.bandits.length=0;{const h=t.TOWNS[0];P.x=(h.tx+.5)*TILE;P.y=(h.ty+2.5)*TILE}const b=t.asParty({x:P.x+24,y:P.y,n:14,kind:'bandits',list:t.makeEnemies(14,false,'bandits'),t:0,a:0,idle:false,cool:0,ld:null});t.bandits.push(b);G.clock=t.DAY*.3;
    for(let i=0;i<200&&!G.enc;i++)t.updateBands(.05);ok(G.enc&&G.enc.kind==='party'&&G.enc.ref===b&&!q('#panel.paged'),'a band that catches you on the road: the fight, as before'+(G.enc?'':' (none: '+[Math.round(Math.hypot(b.x-P.x,b.y-P.y)),t.stance(b.power()),G.mode,G.par?'par':'',b.cool,b.gone].join()+')'));t.act('flee');world();
    P.troops={hum_knight:40};b.pw=0;t.meetBand(b);ok(G.par&&q('[data-act="pl-yield"]')&&!q('#panel.paged'),'a band you corner: its parley, as before');world();t.bandits.length=0}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
