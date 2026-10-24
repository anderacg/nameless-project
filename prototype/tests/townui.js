'use strict';
// The town's rail and windows (ui/window.js, ui/townui.js): the rail lists the places, areas named as the rooms of a house
// (no status under them; a dot only where a quest is ready), and opens each one's window, its people as cards with their
// portraits and buttons; Back goes to the overview, the way out leaves, Esc steps back; the number keys pick places; it fits a phone on its
// side with nothing sideways; your holding's rail lists its walls, houses and estates, each with its own window, its actions
// as before. People has no separate menu; the Journal keeps lord and realm knowledge, and Army keeps companion management.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,W=t.W;
  window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
  const h2s=()=>(document.querySelector('#panel h2')||{}).textContent||'',q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],panel=()=>q('#panel').innerHTML,h2=()=>(q('.rwin h2')||{}).textContent||'';
  const key=(code,k)=>window.dispatchEvent(new KeyboardEvent('keydown',{code,key:k,bubbles:true}));
  const world=()=>{G.mode='world';G.modal=false;G.town=null;t.hidePanel();G.lastTown=null};
  try{
    Math.random=t.seeded(6100);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
    const ash=t.townBy('Ashford');P.gold=2000;P.quests=[];world();
    // ---- the rail: the places, each an icon, an area's name and a number key
    t.enterTown(ash);const places=t.townPlaces(ash);
    ok(G.mode==='town'&&G.town.tab===null&&q('#panel.railed')&&q('.rail')&&q('.rwin'),'entering opens the overview with the rail beside it');
    ok(['trade','tavern','smith','stable','recruit','hall','jobs','garrison'].every(k=>places.includes(k))&&!places.includes('siege')&&/data-act="siege-ask"/.test(panel())&&(!ash.T.tourney||places.includes('tourney')),'Ashford\'s places (the attack on the whole town on its overview): '+places.join(', '));
    {const b=q('.rwbody .rkact[data-act="siege-ask"]');ok(b&&b.dataset.rk==='q'&&/plan an attack/.test(b.title)&&/power \d+ vs \d+/.test(b.textContent),'the attack: a key action on the overview, its odds under it, Q ('+(b&&b.querySelector('small').textContent)+')');
      key('KeyQ','q');ok(G.mode==='town'&&q('#panel.confirm')&&q('.nav [data-nav="close"]').dataset.act==='plan-siege'&&q('.nav [data-nav="back"]'),'Q asks first: a confirm window, Plan the attack on the right, Back on the left');
      t.onEscape();ok(G.mode==='town'&&q('#panel.railed')&&G.town.tab===null,'Esc from the confirm: the overview again, nothing done');key('KeyQ','q');q('.nav [data-nav="close"]').click();ok(G.mode==='besiege'&&!G.town,'Confirm: leave the gates and plan the attack, as before');t.act('sg-leave');world();G.mode='world';t.hidePanel();t.enterTown(ash)}
    const items=qa('.rail-i');ok(items.length===places.length&&items.every((b,i)=>b.dataset.act==='tab'&&b.dataset.arg===places[i]&&b.querySelector('.ri-ico svg')&&b.querySelector('.ri-n').textContent===t.PLACES[places[i]].n&&!b.querySelector('small')&&b.textContent.replace(/\d$/,'').trim()===t.PLACES[places[i]].n+(t.PLACES[places[i]].short||t.PLACES[places[i]].n)),
      'each rail entry is an icon and an area\'s name, no status line under it: '+items.map(b=>b.querySelector('.ri-n').textContent).join(', '));
    {const want={trade:'Market square',tavern:'Tavern',smith:'Smithy',stable:'Stable',recruit:'Barracks',hall:'Lord’s hall',jobs:'Notice board',tourney:'The lists',stores:'Storehouse',garrison:'Walls & garrison',fief:'Steward’s office',siege:'Siege camp'};
      ok(Object.keys(want).every(k=>t.PLACES[k].n===want[k]),'the town\'s areas: '+Object.values(t.PLACES).map(p=>p.n).join(', '))}
    // the attention dot: on the Notice board, only while a quest of yours is ready to report here
    {ok(!q('.rail-i .ri-dot'),'no quest ready: no dot on the rail');P.inv=P.inv.map(()=>null);const qs=t.makeQuest('supply',ash);t.acceptQuest(qs);t.renderTown();ok(!t.questReady(qs)&&!q('.rail-i .ri-dot'),'a quest taken but not ready: still no dot');
      t.invAdd('good',qs.good,qs.n);t.renderTown();
      const dots=qa('.rail-i .ri-dot');ok(t.questReady(qs)&&dots.length===1&&dots[0].closest('.rail-i').dataset.arg==='jobs'&&!dots[0].textContent,'a quest ready to report: one small dot, on the Notice board only');P.quests=[];t.renderTown();ok(!q('.rail-i .ri-dot'),'reported or gone: the dot goes')}
    ok(items.slice(0,10).every((b,i)=>b.dataset.key==='1234567890'[i]&&b.querySelector('kbd').textContent==='1234567890'[i]),'the first ten show their number keys');
    ok(/Ashford/.test(h2())&&/Held by/i.test(panel())&&/Your standing/i.test(panel())&&!q('.nav [data-nav="back"]')&&/Leave city/.test(q('.nav [data-nav="close"]').textContent),'the overview: the town, its owner, standing and garrison; no Back, the way out');
    // ---- each place opens its window, Back returns to the overview
    let bad=[];for(const k of places){t.act('tab',k);const on=q('.rail-i.on');if(G.town.tab!==k||h2()!==t.PLACES[k].n||!on||on.dataset.arg!==k||!q('.nav [data-nav="back"]'))bad.push(k+':'+h2());t.act('tab','home');if(G.town.tab!==null)bad.push(k+' back')}
    ok(!bad.length,'every place opens its own window (its name in the header, chosen on the rail, Back at the bottom left) and Back returns'+(bad.length?': '+bad.join(', '):''));
    t.act('tab','trade');ok(/data-act="buy"/.test(panel())&&q('.rwin .top .rw-gold')&&/Ashford/.test(q('.rw-h .muted').textContent),'the Market window: the trade rows, the town\'s name and your gold in its header');
    t.act('tab','tavern');ok(/Lodgings/.test(panel())&&!/data-act="tourney"/.test(panel())&&!/data-act="contract"/.test(panel()),'the Tavern: lodgings and rumours (the lists and the contract have places of their own)');
    ok(qa('.rwbody .rcard').length>=1&&qa('.rwbody .rcard').every(c=>c.querySelector('.rc-pic')&&c.querySelector('.rc-id strong'))&&q('.rwbody .rcard [data-act="sy-stay"],.rwbody .rcard [data-act="sy-leave"]')&&!/sy-food/.test(panel()),'the Tavern\'s people are cards: the innkeeper with Stay, no food (that is the market\'s) ('+qa('.rwbody .rcard .rc-id strong').map(e=>e.textContent).join(', ')+')');
    {const id=Object.keys(t.COMPS).find(c=>!P.comps[c]),c0=t.COMPS[id].town;t.COMPS[id].town='Ashford';t.renderTown();const card=q('.rwbody .rcard [data-act="hire-comp"][data-arg="'+id+'"]');card&&(card.__c=card.closest('.rcard'));
      ok(card&&card.__c.querySelector('img.rc-pic').src===t.portrait(id)&&card.__c.textContent.includes(t.COMPS[id].n)&&/Hire \d+g/.test(card.textContent),'a companion for hire: a card with his portrait, name and Hire');t.COMPS[id].town=c0;t.renderTown()}
    // the ransom broker: Ransom opens a picker of your prisoners (how many of each, their worth, the total), Confirm sells those
    {P.prisoners={militia:3,hum_levy:2};ash.T.broker=ash.T.broker||true;t.act('tab','tavern');const b=q('.rwbody .rcard [data-act="ransom-pick"]');ok(b&&b.textContent==='Ransom'&&/Worth \d+g/.test(b.closest('.rcard').textContent),'the broker\'s card: Ransom (a verb), the worth in its facts');
      b.click();const rows=qa('.pk-row');ok(q('#panel.picker')&&rows.length===2&&/Ransom prisoners/.test(h2s())&&q('.nav [data-nav="back"]').dataset.act==='tab'&&q('.nav [data-nav="close"]').dataset.act==='ransom'&&/The broker pays \d+g/.test(q('.pk-total').textContent),'Ransom: a picker, each kind with its count and worth, the total, Back and Ransom');
      t.act('pk-set','militia:1');const v=t.RANSOM[t.ST.militia.tier]+2*t.RANSOM[t.ST.hum_levy.tier],g0=P.gold;ok(new RegExp(v+'g').test(q('.pk-total').textContent),'choosing fewer: the total follows ('+q('.pk-total').textContent+')');
      q('.nav [data-nav="close"]').click();ok(P.gold===g0+v&&P.prisoners.militia===2&&!P.prisoners.hum_levy&&G.town.tab==='tavern'&&q('#panel.railed'),'Confirm: those sold, the rest kept, back in the Tavern');
      t.act('ransom-pick');t.onEscape();ok(G.town.tab==='tavern'&&P.prisoners.militia===2,'Esc from the picker: back, nothing sold');P.prisoners={}}
    t.act('tab','hall');ok(/data-act="contract"/.test(panel())||P.fac||!ash.T.contract,'the Lord\'s hall offers the mercenary contract');
    {const l=W.lords.find(x=>x.fac===ash.owner&&!x.gone&&!x.dead);const in0=l.inside;l.inside=ash.name;l.x=ash.x;l.y=ash.y;P.hostile={};t.renderTown();const c=q('.rwbody .rcard [data-act="hall-talk"][data-arg="'+l.id+'"]');
      ok(c&&c.closest('.rcard').querySelector('.rc-pic svg')&&c.closest('.rcard').textContent.includes(t.lordName(l))&&/soldiers/.test(c.closest('.rcard').textContent),'a lord holding court: a card with his realm\'s banner, his soldiers and Talk');
      if(c){const before=panel();t.act('hall-talk','missing-lord');ok(G.mode==='town'&&panel()===before,'a stale court action cannot start a remote audience');c.click();ok(G.mode==='dialog'&&new RegExp(l.name).test(panel()),'Talk: his own talk');t.act('lr-lords',l.id);t.onEscape();ok(G.mode==='town'&&G.town.tab==='hall'&&q('#panel.railed'),'Esc after a dialogue topic: back to the hall');q('.rwbody .rcard [data-act="hall-talk"][data-arg="'+l.id+'"]').click();t.act('lord-leave');ok(G.mode==='town'&&G.town.tab==='hall'&&q('#panel.railed'),'Leave: back to the hall')}l.inside=in0}
    if(ash.T.tourney){t.act('tab','tourney');ok(/data-act="tourney"/.test(panel()),'the Tournament place enters the lists')}
    t.act('tab','recruit');ok(/data-act="hire"/.test(panel())&&q('.rwbody .reccard'),'the Barracks: hires and the unit card');
    {const cs=qa('.rwbody .rcards .rcard').filter(c=>c.querySelector('[data-act="hire"]'));ok(cs.length===ash.races.flatMap(r=>ash.hires(r)).length&&cs.every(c=>c.querySelector('img.rc-pic').src.startsWith('data:image')&&/\d+ willing/.test(c.textContent)&&c.dataset.act==='rec-pick'),
      'the Barracks\' recruits: a card each, portrait, "N willing" and Hire ('+cs.map(c=>c.querySelector('.rc-id strong').textContent.trim()+': '+c.querySelector('.rc-facts span').textContent).join('; ')+')');
      const k=cs[1]&&cs[1].dataset.arg;if(k){cs[1].click();ok(G.town.pick===k&&q('.rwbody .rcard.sel').dataset.arg===k,'a click on a card picks it for its unit card')}}
    // the market's ×1 / ×5: one toggle for the window, its Buy and Sell take that many
    t.act('tab','trade');{const one=qa('.rwbody .row [data-act="buy"]');ok(q('.rwbody .qty')&&one.length>3&&one.every(b=>b.textContent==='Buy'&&/:1$/.test(b.dataset.arg))&&!qa('.rwbody .row .btn').some(b=>/Buy 5|Sell 5/.test(b.textContent)),'the Market: Buy and Sell, short, with a ×1 / ×5 toggle (×1 now)');
      q('.qty [data-arg="5"]').click();const n0=t.goodN('grain');ok(G.town.qty===5&&qa('.rwbody .row [data-act="buy"]').every(b=>/:5$/.test(b.dataset.arg))&&q('.qty [data-arg="5"]').classList.contains('on'),'×5: every Buy and Sell takes five');
      q('.rwbody .row [data-act="buy"][data-arg="grain:5"]').click();ok(t.goodN('grain')===n0+5,'and Buy buys five, as the old Buy 5 did');t.act('qty','1')}
    t.act('tab','trade');ok(q('.rwbody .rcard img.rc-pic')&&qa('.rwbody .row [data-act="buy"]').length>3&&!q('.rwbody .rcard [data-act="buy"]'),'the Market: its merchants as a card, the goods as rows');
    t.act('tab','smith');ok(q('.rwbody .rcard img.rc-pic')&&/The smith/.test(q('.rwbody .rcard').textContent),'the Smithy: the smith as a card');t.act('tab','stable');ok(/The stablemaster/.test(q('.rwbody .rcard').textContent),'the Stable: the stablemaster');
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
      // rows stack on a narrow screen: the name and its line, then the buttons on a line of their own, wide enough to tap
      {t.act('tab','trade');q('#panel').style.animation='none';const r=q('.rwbody .row'),i=r.querySelector('.info').getBoundingClientRect(),a=r.querySelector('.acts').getBoundingClientRect(),bs=[...r.querySelectorAll('.acts .btn')].map(b=>b.getBoundingClientRect());
        ok(a.top>=i.bottom-1&&a.width>=r.getBoundingClientRect().width*.8&&bs.every(b=>b.height>=39&&b.width>=80),'at 844 × 390 a Market row stacks: its buttons on their own line, full width ('+bs.map(b=>Math.round(b.width)+'×'+Math.round(b.height)).join(', ')+')')}
      ok(getComputedStyle(q('.rail-i .ri-n')).display==='none'&&getComputedStyle(q('.rail-i .ri-s')).display!=='none'&&!q('.rail-i small'),'the slim rail shows icons with short names');
      // the cards wrap into a grid: one or two a row on a phone, inside the window, nothing sideways
      {const bad=[];for(const k of ['tavern','recruit','hall','trade']){t.act('tab',k);q('#panel').style.animation='none';const b=q('.rwbody').getBoundingClientRect();
        for(const g of qa('.rwbody .rcards')){const cs=[...g.children].map(c=>c.getBoundingClientRect()),cols=new Set(cs.map(r=>Math.round(r.left))).size;if(cols>2||cs.some(r=>r.left<b.left-.5||r.right>b.right+.5||r.width<200))bad.push(k+': '+cols+' a row, '+cs.map(r=>Math.round(r.width)).join('/'))}}
        ok(!bad.length,'at 844 x 390 the card grids fit: one or two a row, inside the window'+(bad.length?': '+bad.join('; '):''))}
      q('#panel').style.animation='';t.act('leave');scr.style.cssText=css}
    // ---- a phone held upright (420 × 900): the rail a strip along the top, the window the full width, rows stacked, a card a row
    {const scr=q('#screen'),css=scr.style.cssText;scr.style.cssText+=';width:420px;height:900px';t.enterTown(ash);t.act('tab','tavern');q('#panel').style.animation='none';
      const p=q('#panel').getBoundingClientRect(),r=q('.rail').getBoundingClientRect(),w=q('.rwin').getBoundingClientRect(),cs=qa('.rwbody .rcard').map(c=>c.getBoundingClientRect());
      ok(r.width>=p.width-2&&r.height<130&&w.top>=r.bottom-1&&w.width>=p.width-2&&q('.rail').scrollWidth>=q('.rail').clientWidth&&new Set(cs.map(c=>Math.round(c.left))).size===1&&q('.rwbody').scrollWidth<=q('.rwbody').clientWidth+1,
        'at 420 × 900 the rail is a strip along the top ('+Math.round(r.width)+' × '+Math.round(r.height)+'), the window the full width, one card a row');
      t.act('tab','trade');q('#panel').style.animation='none';const rw=q('.rwbody .row'),ii=rw.querySelector('.info').getBoundingClientRect(),aa=rw.querySelector('.acts').getBoundingClientRect();ok(aa.top>=ii.bottom-1&&q('.rwbody').scrollWidth<=q('.rwbody').clientWidth+1,'and a Market row stacks, nothing sideways');
      q('#panel').style.animation='';t.act('leave');scr.style.cssText=css;world()}
    // ---- your holding: its walls, houses and estates down the rail, each with its window
    ash.owner='player';ash.lastOwner='player';ash.sacked=ash.raided=ash.turmoil=0;t.ensureEcon(ash);world();t.enterTown(ash);
    ok(t.townPlaces(ash).includes('fief')&&t.townPlaces(ash).includes('garrison')&&!t.townPlaces(ash).includes('siege'),'your own town: Fief and Garrison, no Siege');
    t.act('tab','fief');const hi=qa('.rail-i');
    ok(G.town.tab==='fief'&&hi[0].dataset.arg==='fief'&&['wall','house',...Object.keys(t.ESTATES)].every(k=>hi.some(b=>b.dataset.act==='bld'&&b.dataset.arg===k))&&/People and stores/.test(panel())&&/Your holding/.test(h2()),'the Fief turns the rail into the holding\'s: walls, houses and every estate; its overview the people, taxes and stores');
    ok(hi.every(b=>!b.querySelector('small'))&&hi[0].querySelector('.ri-n').textContent==='Steward’s office'&&['wall','house',...Object.keys(t.ESTATES).filter(k=>t.bldLv(ash,k))].every(k=>q('.rwbody .tnotes').textContent.includes(t.bldName(k)+': '+t.bldStatus(ash,k)[0])),
      'no status on the rail: each building\'s state is in the holding\'s window ('+q('.rwbody .tnotes').textContent.slice(0,90)+'…)');
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
    // ---- no separate People menu; existing destinations still work
    world();t.frame();
    ok(!q('#peopleBtn')&&!q('#people')&&!document.querySelector('script[src="js/ui/peopledrawer.js"]'),'People has no dock button, drawer or loaded script');
    const before=panel();key('KeyP','p');ok(G.mode==='world'&&panel()===before,'P does nothing on the map');
    t.onEscape();ok(G.mode==='esc','Esc opens the Game Menu directly');t.escAct('esc-resume');
    key('KeyJ','j');ok(G.mode==='journal','J still opens the Journal');t.act('jn-sec','lords');ok(/known lord/.test(panel()),'Journal still has its discovered Lords section');t.act('jn-sec','realms');ok(/known realm/.test(panel()),'Journal still has its discovered Realms section');t.act('journal-close');
    P.comps={brann:{ap:2,role:'scout'}};t.compInit('brann');t.openComp('brann');ok(G.mode==='char'&&panel().includes('Brann'),'companion management is still available in Army');t.act('char-close');
    t.enterTown(ash);t.act('tab','hall');const townBefore=panel();key('KeyP','p');ok(G.mode==='town'&&panel()===townBefore,'P does nothing in a town');t.act('leave');
    // The world pass still records known sightings after removing the drawer's watch wrapper.
    const K=t.KNOWLEDGE,l=W.lords.find(x=>!x.gone&&!x.dead);K.reset();K.lord(l);l.inside=null;l.x=P.x+3;l.y=P.y;const paused=G.paused;G.paused=false;t.updateWorld(0);G.paused=paused;
    ok(K.lords[l.id]&&K.lords[l.id].seen&&K.lords[l.id].text.includes(l.troops.length+' soldiers'),'world updates still save last-known sightings for Journal');
    // never in battle
    world();P.troops={hum_foot:3};G.enc={kind:'party',ref:{x:P.x+8,y:P.y,cool:0},list:['militia'],allies:[],foes:[]};t.startBattle({enemies:['militia'],tournament:false});t.frame();
    key('KeyP','p');ok(G.mode==='battle'&&!q('#people'),'P does nothing in battle');
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
