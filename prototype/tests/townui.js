'use strict';
// The town's rail and windows (ui/window.js, ui/townui.js): the rail lists the places with a status each and opens each one's
// window; Back goes to the overview, the way out leaves, Esc steps back; the number keys pick places; it fits a phone on its
// side with nothing sideways; your holding's rail lists its walls, houses and estates, each with its own window, its actions
// as before. The people drawer (ui/peopledrawer.js): P and its tab open and close it, it lists your companions and the lords,
// Show on map centres its map on them, and it keeps to what you know.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,W=t.W;
  window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],panel=()=>q('#panel').innerHTML,h2=()=>(q('.rwin h2')||{}).textContent||'';
  const key=(code,k)=>window.dispatchEvent(new KeyboardEvent('keydown',{code,key:k,bubbles:true}));
  const world=()=>{G.mode='world';G.modal=false;G.town=null;t.hidePanel();G.lastTown=null};
  try{
    Math.random=t.seeded(6100);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
    const ash=t.townBy('Ashford');P.gold=2000;P.quests=[];world();
    // ---- the rail: the places, each with a status and a number key
    t.enterTown(ash);const places=t.townPlaces(ash);
    ok(G.mode==='town'&&G.town.tab===null&&q('#panel.railed')&&q('.rail')&&q('.rwin'),'entering opens the overview with the rail beside it');
    ok(['trade','tavern','smith','stable','recruit','hall','jobs','garrison','siege'].every(k=>places.includes(k))&&(!ash.T.tourney||places.includes('tourney')),'Ashford\'s places: '+places.join(', '));
    const items=qa('.rail-i');ok(items.length===places.length&&items.every((b,i)=>b.dataset.act==='tab'&&b.dataset.arg===places[i]&&b.querySelector('.ri-ico svg')&&b.querySelector('small')&&b.querySelector('small').textContent.trim()),
      'each rail entry has an icon, a name and a status: '+items.map(b=>b.querySelector('.ri-n').textContent+' ('+b.querySelector('small').textContent+')').join(', '));
    ok(items.slice(0,10).every((b,i)=>b.dataset.key==='1234567890'[i]&&b.querySelector('kbd').textContent==='1234567890'[i]),'the first ten show their number keys');
    ok(/Ashford/.test(h2())&&/Held by/i.test(panel())&&/Your standing/i.test(panel())&&!q('.nav [data-nav="back"]')&&/Leave city/.test(q('.nav [data-nav="close"]').textContent),'the overview: the town, its owner, standing and garrison; no Back, the way out');
    // ---- each place opens its window, Back returns to the overview
    let bad=[];for(const k of places){t.act('tab',k);const on=q('.rail-i.on');if(G.town.tab!==k||h2()!==t.PLACES[k].n||!on||on.dataset.arg!==k||!q('.nav [data-nav="back"]'))bad.push(k+':'+h2());t.act('tab','home');if(G.town.tab!==null)bad.push(k+' back')}
    ok(!bad.length,'every place opens its own window (its name in the header, chosen on the rail, Back at the bottom left) and Back returns'+(bad.length?': '+bad.join(', '):''));
    t.act('tab','trade');ok(/data-act="buy"/.test(panel())&&q('.rwin .top .rw-gold')&&/Ashford/.test(q('.rw-h .muted').textContent),'the Market window: the trade rows, the town\'s name and your gold in its header');
    t.act('tab','tavern');ok(/Lodgings/.test(panel())&&!/data-act="tourney"/.test(panel())&&!/data-act="contract"/.test(panel()),'the Tavern: lodgings and rumours (the lists and the contract have places of their own)');
    t.act('tab','hall');ok(/data-act="contract"/.test(panel())||P.fac||!ash.T.contract,'the Lord\'s hall offers the mercenary contract');
    if(ash.T.tourney){t.act('tab','tourney');ok(/data-act="tourney"/.test(panel()),'the Tournament place enters the lists')}
    t.act('tab','recruit');ok(/data-act="hire"/.test(panel())&&q('.rwbody .reccard'),'the Barracks: hires and the unit card');
    {const g0=P.gold,id=t.stableStock(ash).find(k=>t.canBuyMount(ash,k));t.act('tab','stable');P.gear.mount=null;t.act('buy-mount',id);ok(P.gear.mount===id&&P.gold<g0&&G.town.tab==='stable','actions work as before (a mount bought in the Stable window)')}
    // ---- Esc steps back; the way out leaves
    t.act('tab','smith');t.onEscape();ok(G.mode==='town'&&G.town.tab===null,'Esc from a place: back to the overview');
    t.onEscape();ok(G.mode==='world'&&!G.town,'Esc from the overview: out of the town');
    t.enterTown(ash);t.act('tab','jobs');t.act('leave');ok(G.mode==='world'&&!G.town,'Leave city from a place goes to the map');
    // ---- the number keys
    t.enterTown(ash);key('Digit2','2');ok(G.town.tab===places[1],'2 opens the second place ('+G.town.tab+')');
    key('Digit1','1');ok(G.town.tab===places[0],'1 the first ('+G.town.tab+')');
    if(places.length>=10){key('Digit0','0');ok(G.town.tab===places[9],'0 the tenth ('+G.town.tab+')')}
    world();P.tx=null;const sp=G.speed;key('Digit2','2');ok(G.speed!==sp||G.speed===t.SPEEDS[1],'on the map the numbers still set the speed');t.setSpeed(1);
    // ---- the Esc menu leaves the rail as it was
    t.enterTown(ash);t.act('tab','trade');t.showEsc();ok(!q('#panel.railed'),'the pause menu is a plain window');t.escAct('esc-resume');ok(q('#panel.railed')&&q('.rail-i.on')&&G.mode==='town','resuming brings the rail window back');t.act('leave');
    // ---- a phone on its side: 844 x 390, nothing sideways
    {const scr=q('#screen'),css=scr.style.cssText;scr.style.cssText+=';width:844px;height:390px';t.enterTown(ash);const fits=[];
      for(const k of [null,...places]){t.act('tab',k||'home');q('#panel').style.animation='none';const p=q('#panel'),// (measured as it stands, not as it rises in)
b=q('.rwbody'),r=q('.rail'),s=scr.getBoundingClientRect(),pr=p.getBoundingClientRect();
        if(pr.left<s.left-.5||pr.right>s.right+.5||pr.bottom>s.bottom+.5||p.scrollWidth>p.clientWidth+1||b.scrollWidth>b.clientWidth+1||r.scrollWidth>r.clientWidth+1||r.getBoundingClientRect().width>84)fits.push((k||'overview')+' '+JSON.stringify([s.left,s.right,s.bottom,pr.left,pr.right,pr.bottom,p.scrollWidth,p.clientWidth,innerWidth,innerHeight].map(Math.round))+' '+Math.round(pr.width)+'x'+Math.round(pr.height)+' body '+b.scrollWidth+'/'+b.clientWidth+' rail '+Math.round(r.getBoundingClientRect().width))}
      const nav=q('.rwin>.nav').getBoundingClientRect(),pr=q('#panel').getBoundingClientRect();
      ok(!fits.length&&nav.bottom<=pr.bottom+.5,'at 844 x 390 every window fits: a slim rail ('+Math.round(q('.rail').getBoundingClientRect().width)+' px), nothing scrolls sideways, the bottom bar on screen'+(fits.length?': '+fits.join('; '):''));
      ok(getComputedStyle(q('.rail-i .ri-n')).display==='none'&&getComputedStyle(q('.rail-i .ri-s')).display!=='none'&&getComputedStyle(q('.rail-i small')).display==='none','the slim rail shows icons with short names');
      q('#panel').style.animation='';t.act('leave');scr.style.cssText=css}
    // ---- your holding: its walls, houses and estates down the rail, each with its window
    ash.owner='player';ash.lastOwner='player';ash.sacked=ash.raided=ash.turmoil=0;t.ensureEcon(ash);world();t.enterTown(ash);
    ok(t.townPlaces(ash).includes('fief')&&t.townPlaces(ash).includes('garrison')&&!t.townPlaces(ash).includes('siege'),'your own town: Fief and Garrison, no Siege');
    t.act('tab','fief');const hi=qa('.rail-i');
    ok(G.town.tab==='fief'&&hi[0].dataset.arg==='fief'&&['wall','house',...Object.keys(t.ESTATES)].every(k=>hi.some(b=>b.dataset.act==='bld'&&b.dataset.arg===k))&&/People and stores/.test(panel())&&/Your holding/.test(h2()),'the Fief turns the rail into the holding\'s: walls, houses and every estate; its overview the people, taxes and stores');
    ok(hi.every(b=>b.querySelector('small')&&b.querySelector('small').textContent.trim()),'each with its status: '+hi.slice(0,6).map(b=>b.querySelector('.ri-n').textContent+' ('+b.querySelector('small').textContent+')').join(', '));
    {const built=Object.keys(t.ESTATES).find(k=>t.bldLv(ash,k)&&t.MAKE[k].out);ash.sab={[built]:G.day+4};ok(t.bldStatus(ash,built)[0]==='sabotaged','a wrecked estate reads sabotaged');ash.sab={};
      const none=Object.keys(t.ESTATES).find(k=>!t.bldLv(ash,k));ok(!none||/not built|no land|needs/.test(t.bldStatus(ash,none)[0]),'one not built says so ('+(none?t.bldStatus(ash,none)[0]:'none')+')');
      t.act('bld','farm');ok(h2()==='Farmland'&&/Production/.test(panel())&&/In store/.test(panel())&&/data-act="fief-build" data-arg="farm"|data-act="fief-demolish" data-arg="farm"/.test(panel())&&q('.rail-i.on').dataset.arg==='farm','a building\'s window: its state, production, stores and its build buttons');
      Object.assign(ash.stock,{timber:300,stone:300,tools:60,iron:60});ash.work=null;const g0=P.gold,lv=t.bldLv(ash,'farm');
      if(lv&&lv<t.bldCap(ash,'farm')){t.act('fief-build','farm');ok(ash.work&&ash.work.k==='farm'&&P.gold<g0&&G.town.bld==='farm'&&/building \d+%/.test(t.bldStatus(ash,'farm')[0]),'upgrading from its window works ('+t.bldStatus(ash,'farm')[0]+')')}
      t.act('bld','wall');ok(/Fortif/.test(panel())&&h2()==='Walls','the walls\' window fortifies')}
    t.onEscape();ok(G.town.tab==='fief'&&!G.town.bld,'Esc from a building: the holding\'s overview');
    t.onEscape();ok(G.town.tab===null,'again: the town\'s overview');t.onEscape();ok(G.mode==='world','and out');
    {const k=t.TOWNS.find(x=>x.kind==='castle');const o0=k.owner;k.owner='player';world();t.enterTown(k);const pl=t.townPlaces(k);
      ok(['stores','garrison','fief'].every(x=>pl.includes(x)),'a castle of yours: Stores, Garrison and Fief ('+pl.join(', ')+')');t.act('leave');k.owner=o0}
    // ---- the people drawer
    world();P.comps={brann:{ap:2,role:'scout'}};t.compInit('brann');t.frame();const E=t.PEOPLE.el;t.peopleRender();// (as its once-a-second look at your companions would)
    ok(E&&getComputedStyle(E.root).display!=='none'&&E.tab.querySelector('img')&&!E.root.classList.contains('open'),'on the map: the people tab on the right edge, a companion\'s face on it');
    key('KeyP','p');ok(t.PEOPLE.on&&E.root.classList.contains('open')&&/Brann/.test(E.list.innerHTML),'P opens the drawer on your companions');
    key('KeyP','p');ok(!t.PEOPLE.on&&!E.root.classList.contains('open'),'P closes it');
    E.tab.click();ok(t.PEOPLE.on,'its tab opens it');q('.pp-scrim').click();ok(!t.PEOPLE.on,'a tap outside closes it');
    E.tab.click();t.onEscape();ok(!t.PEOPLE.on&&G.mode==='world','Esc closes it first');
    // lords: one in sight, one far away inside a holding you have never been near
    const [l1,l2]=W.lords.filter(l=>!l.gone);l1.dead=false;l1.inside=null;l1.x=P.x+30;l1.y=P.y;const far=t.TOWNS.slice().sort((a,b)=>Math.hypot(b.x-P.x,b.y-P.y)-Math.hypot(a.x-P.x,a.y-P.y))[0];
    l2.dead=false;l2.inside=far.name;l2.x=far.x;l2.y=far.y;t.PEOPLE.seen.clear();t.peopleWatch();
    t.peopleToggle(true);E.tabs.querySelector('[data-arg="lords"]').click();const e1=E.list.querySelector('[data-id="l:'+l1.id+'"]'),e2=E.list.querySelector('[data-id="l:'+l2.id+'"]');
    ok(t.PEOPLE.tab==='lords'&&E.list.querySelectorAll('.pp-grp').length>=2&&e1&&e2,'the Lords tab: grouped by realm');
    ok(/In sight/.test(e1.textContent)&&new RegExp(l1.troops.length+' soldiers').test(e1.textContent)&&!e1.querySelector('[data-pp="look"]').disabled,'a lord in sight: where, his army, Show on map');
    ok(/Whereabouts unknown/.test(e2.textContent)&&!e2.textContent.includes(far.name)&&e2.querySelector('[data-pp="look"]').disabled&&!t.ppSpot('l:'+l2.id)&&!/soldiers/.test(e2.textContent),'a lord you cannot know of: whereabouts unknown, no army, no Show on map ('+e2.textContent.slice(0,60)+')');
    e1.querySelector('[data-pp="look"]').click();ok(t.PEOPLE.look&&t.PEOPLE.look.x===l1.x&&t.PEOPLE.look.y===l1.y&&!E.map.hidden,'Show on map centres the drawer\'s map on him');
    {const r=t.cv.getBoundingClientRect(),sr=E.root.getBoundingClientRect(),k=r.width/t.cv.width,x=(l1.x-G.cam.x)*k+r.left-sr.left;ok(!E.ping.hidden&&Math.abs(parseFloat(E.ping.style.left)-x)<1.5,'and rings him on the world where he stands')}
    l1.x=P.x+5000;t.peopleWatch();t.peopleRender();ok(/Seen/.test(E.list.querySelector('[data-id="l:'+l1.id+'"]').textContent),'out of sight: where you last saw him');
    G.day+=t.PEOPLE.memory+1;t.peopleRender();ok(/Whereabouts unknown/.test(E.list.querySelector('[data-id="l:'+l1.id+'"]').textContent),'and after a few days, unknown again');G.day-=t.PEOPLE.memory+1;
    E.list.querySelector('[data-id="l:'+l2.id+'"] [data-pp="card"]').click();ok(E.list.querySelector('.pp-card')&&/Lord of the/.test(E.list.querySelector('.pp-card').innerHTML),'Profile: a small card');
    E.tabs.querySelector('[data-arg="realms"]').click();ok(t.FIDS.filter(f=>!W.dead[f]).every(f=>E.list.querySelector('[data-id="r:'+f+'"]'))&&/holding/.test(E.list.textContent),'the Realms tab: each realm, its holdings and wars');
    t.peopleToggle(false);
    // in a town: over its window; Talk to a lord holding court there, and back
    {const fr=t.TOWNS.find(x=>x.owner&&x.owner!=='player'&&!t.hostileTo(x.owner)&&x.kind!=='village');P.hostile={};const l=W.lords.find(x=>x.fac===fr.owner&&!x.gone)||l2;l.dead=false;l.fac=fr.owner;l.inside=fr.name;l.x=fr.x;l.y=fr.y;
      world();t.enterTown(fr);t.frame();key('KeyP','p');ok(t.PEOPLE.on&&G.mode==='town','in a town P opens the drawer over its window');
      E.tabs.querySelector('[data-arg="lords"]').click();const tb=E.list.querySelector('[data-id="l:'+l.id+'"] [data-pp="talk"]');ok(tb&&/Here, in/.test(E.list.querySelector('[data-id="l:'+l.id+'"]').textContent),'a lord inside is here, with Talk');
      if(tb){tb.click();ok(!t.PEOPLE.on&&G.mode==='dialog'&&new RegExp(l.name).test(panel()),'Talk: the lord\'s own dialogue');t.act('lord-leave');ok(G.mode==='town'&&q('#panel.railed'),'Leave: back to the town')}
      t.onEscape();ok(G.mode==='world','and out of town');}
    // never in battle
    P.troops={hum_foot:3};G.enc={kind:'party',ref:{x:P.x+8,y:P.y,cool:0},list:['militia'],allies:[],foes:[]};t.startBattle({enemies:['militia'],tournament:false});t.frame();
    key('KeyP','p');ok(!t.PEOPLE.on&&getComputedStyle(E.root).display==='none','in battle there is no drawer, and P does nothing');
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
