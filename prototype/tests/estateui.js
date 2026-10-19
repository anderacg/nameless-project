'use strict';
// Estates and sites on the shared rail (ui/window.js): an estate met on the map shows its own areas down the rail (never the
// holding's other estates), named as the rooms of a house with no status under them, its overview first; the people in an
// area (its workers, its herders, its guards; a camp's sellswords and storytellers) are cards with portraits and buttons; your own estate is managed right there (Manage), a
// rival's offers sabotage, plunder and burning (Raid); its workers and its herd open on the same rail and come back. A site's
// places down its rail, each with its window, Back to its overview. Leave, Esc and the number keys as in towns; all of it fits
// a phone on its side; and towns, holdings, estates and sites all go through the one base (no other file builds the rail).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,W=t.W;
  window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],panel=()=>q('#panel').innerHTML,h2=()=>(q('.rwin h2')||{}).textContent||'';
  const key=(code,k)=>window.dispatchEvent(new KeyboardEvent('keydown',{code,key:k,bubbles:true}));
  const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.town=null;G.site=null;G.herd=null;G.wk=null;G.est=null;G.enc=null;P.tx=null;G.chase=null;G.encCool=0};
  const on=()=>(q('.rail-i.on')||{dataset:{}}).dataset.arg;
  // a phone on its side: the window in front fits, a slim rail, nothing sideways, its bottom bar on screen
  const fits=(name,go)=>{const scr=q('#screen'),css=scr.style.cssText;scr.style.cssText+=';width:844px;height:390px';const bad=[];
    for(const [n,f] of go){f();q('#panel').style.animation='none';const p=q('#panel'),b=q('.rwbody'),r=q('.rail'),s=scr.getBoundingClientRect(),pr=p.getBoundingClientRect();
      if(!r||!b){bad.push(n+' no rail');continue}const nv=q('.rwin>.nav').getBoundingClientRect();
      if(pr.left<s.left-.5||pr.right>s.right+.5||pr.bottom>s.bottom+.5||p.scrollWidth>p.clientWidth+1||b.scrollWidth>b.clientWidth+1||r.scrollWidth>r.clientWidth+1||r.getBoundingClientRect().width>84||nv.bottom>pr.bottom+.5)
        bad.push(n+' '+Math.round(pr.width)+'x'+Math.round(pr.height)+' body '+b.scrollWidth+'/'+b.clientWidth+' rail '+Math.round(r.getBoundingClientRect().width)+' '+r.scrollWidth+'/'+r.clientWidth+' panel '+p.scrollWidth+'/'+p.clientWidth+' nav '+Math.round(nv.bottom)+'/'+Math.round(pr.bottom))}
    ok(!bad.length,'at 844 x 390 '+name+' fit'+(go.length>1?'':'s')+': a slim rail, nothing sideways, the bottom bar on screen'+(bad.length?': '+bad.join('; '):''));
    q('#panel').style.animation='';scr.style.cssText=css};
  try{
    Math.random=t.seeded(7300);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;P.quests=[];P.fac=null;P.hostile={};
    const menus=()=>qa('.rail-i').map(b=>b.dataset.arg),ESTS=Object.keys(t.ESTATES);
    // ---- a rival's estate: its own menus down the rail (never the holding's other estates), its overview first
    const z=t.TOWNS.filter(x=>x.owner&&x.owner!=='player'&&!x.sacked&&!x.raided).sort((a,b)=>Object.keys(t.bldSpots(b)).filter(k=>t.bldLv(b,k)).length-Object.keys(t.bldSpots(a)).filter(k=>t.bldLv(a,k)).length)[0];
    const zk=Object.keys(t.bldSpots(z)).filter(k=>t.bldLv(z,k)),k0=zk.includes('mine')?'mine':zk[0];P.troops={hum_knight:6};world();
    W.folk=[];t.FOLK_SEEN.clear();P.x=z.x;P.y=z.y+40;G.clock=t.DAY*.2;for(let i=0;i<300;i++)t.updateFolk(.05);
    t.estateMeet(t.estatePick(z,k0));
    ok(G.mode==='dialog'&&G.est&&G.estTab===null&&q('#panel.railed')&&h2()===t.ESTATES[k0].n+' of '+z.name&&/Level \d/.test(q('.rw-h .muted').textContent)&&q('.rail-head[aria-current]')&&!q('.rail-i.on'),'meeting the '+t.ESTATES[k0].n.toLowerCase()+' of '+z.name+': its overview, its name, level and owner in the header');
    const A0=t.ESTATE_AREAS[k0],names=()=>qa('.rail-i .ri-n').map(b=>b.textContent);
    ok(/State/.test(panel())&&/Level/.test(panel())&&qa('.rwbody .tnotes li').length===menus().length,'the overview: what it is, its state, and a line on each area');
    ok(menus().join()===[t.ESTATES[k0].work&&'folk',A0.works&&'works'].filter(Boolean).join()&&names().join()===[t.ESTATES[k0].work&&A0.folk,A0.works].filter(Boolean).join()&&!menus().some(k=>ESTS.includes(k))&&qa('.rail-i').every(b=>b.querySelector('.ri-ico svg')&&!b.querySelector('small')),
      'the rail: its own areas, an icon and a name, no status, no other estate: '+names().join(', '));
    if(A0.works){t.act('es-tab','works');ok(h2()===A0.works&&/Production|Nothing made/.test(panel())&&/In store/.test(panel()),'its '+A0.works+': what it made yesterday and its stores');t.act('es-tab','home')}
    ok(q('.rail-head').textContent.includes(t.ESTATES[k0].n)&&q('.rail-head .rh-flag svg')&&q('.rail-head .gold'),'the rail\'s header: the estate, its owner\'s banner and your gold');
    ok(!q('.nav [data-nav="back"]')&&/Leave/.test(q('.nav [data-nav="close"]').textContent),'no Back, Leave on the right');
    ok(G.estTab===null&&!menus().includes('raid')&&['sabotage','plunder','burn'].every(a=>q('.rwbody [data-act="es-ask"][data-arg="'+a+'"]'))&&/guards watch it \(power/.test(panel())&&/Plunder its stores/.test(panel())&&!q('.nav [data-nav="back"]')&&/Leave/.test(q('.nav [data-nav="close"]').textContent),
      'the raid is on the overview (no Outskirts area): its guards and power, Sabotage, Plunder and Burn; Leave on the right');
    {const c=q('.rwbody .rcard'),g=t.estateGuards(z,k0);ok(c&&c.querySelector('img.rc-pic').src===t.portrait(g[0])&&c.querySelector('.rc-n').textContent==='×'+g.length&&!c.querySelector('button'),'its guards: a card for information only, their portrait and how many ('+(c&&c.querySelector('.rc-n').textContent)+'), no buttons on it')}
    {const ks=qa('.rwbody .rkacts .rkact');ok(ks.map(b=>b.dataset.arg).join()==='sabotage,plunder,burn'&&ks.map(b=>b.querySelector('b').textContent).join()==='Sabotage,Plunder,Burn'&&ks.map(b=>b.dataset.rk).join()==='q,w,e'&&ks.every(b=>b.querySelector('.rka-ico svg')&&b.querySelector('small')&&b.querySelector('kbd').textContent===b.dataset.rk.toUpperCase()&&b.title.length>20)&&/% unseen/.test(ks[0].textContent),
      'the estate\'s key actions in a bar on its overview: an icon, the label, its chance or cost, its rules in the tooltip, Q W E ('+ks.map(b=>b.querySelector('b').textContent+' ['+b.querySelector('small').textContent+']').join('; ')+')');
      const tr=P.troops;P.troops={};t.showEstate();const pb=q('.rkact[data-arg="plunder"]');ok(pb.disabled&&/Need 3 troops/.test(pb.title)&&pb.querySelector('.rka-why').textContent==='Need 3 troops','a disabled key action says why: in its tooltip and a small line ('+pb.querySelector('.rka-why').textContent+')');
      key('KeyW','w');ok(!G.enc&&G.est,'its letter key does nothing while it is disabled');P.troops=tr;t.showEstate();key('KeyE','e');ok(!G.enc&&q('#panel.confirm')&&q('.nav [data-nav="close"]').dataset.act==='es-burn'&&/Burn/.test(q('#panel h2').textContent)&&/hostile/.test(panel()),'E asks first: the burn confirm, what it costs, Burn on the right, Back on the left');
      t.onEscape();ok(!G.enc&&G.est&&q('#panel.railed')&&G.estTab===null,'Back from the confirm: the overview, nothing burnt');key('KeyE','e');q('.nav [data-nav="close"]').click();ok(G.enc&&G.enc.kind==='estate'&&G.enc.ref.burn,'Confirm: Burn it, a fight with its guards, as before');t.act('flee');world();P.hostile={};t.estateMeet(t.estatePick(z,k0))}
    {const n=String(menus().length);key('Digit'+n,n);ok(G.estTab===menus()[menus().length-1],'its number key picks an area');t.onEscape();ok(G.mode==='dialog'&&G.estTab===null,'Esc: back to the overview')}
    t.act('es-tab','home');t.onEscape();ok(G.mode==='world'&&t.ov.hidden&&!G.est,'Esc at the overview: out to the map');
    t.estateMeet(t.estatePick(z,k0));t.act('dlg-close');ok(G.mode==='world'&&!G.est,'Leave: out to the map');
    {const o0=P.fac;P.fac=z.owner;t.estateMeet(t.estatePick(z,k0));ok(!q('.rwbody [data-arg="plunder"]'),'no raid on your employer\'s estate');P.fac=o0;world()}
    {world();t.estateMeet(t.estatePick(z,k0));t.act('es-burn');ok(G.enc&&G.enc.kind==='estate'&&G.enc.ref.burn&&t.hostileTo(z.owner),'Burn: a fight with its guards, as before');t.act('flee');world();P.hostile={}}
    // ---- your own farm: managed right there
    const ash=t.townBy('Ashford');ash.owner='player';ash.lastOwner='player';ash.sacked=ash.raided=ash.turmoil=0;t.ensureEcon(ash);world();
    Object.assign(ash.stock,{timber:300,stone:300,tools:60,iron:60});ash.work=null;P.gold=3000;
    W.folk=[];t.FOLK_SEEN.clear();P.x=ash.x;P.y=ash.y+40;G.clock=t.DAY*.2;for(let i=0;i<300;i++)t.updateFolk(.05);
    t.estateMeet(t.estatePick(ash,'farm'));
    ok(h2()==='Farmland of Ashford'&&menus().join()==='folk,fields,works'&&names().join()==='Farmhouse,Fields,Barn'&&!/Fief tab/.test(panel()),'your own farm: Farmhouse, Fields and Barn: '+names().join(', '));
    t.act('es-tab','works');ok(h2()==='Barn'&&/Production/.test(panel())&&/In store/.test(panel()),'its Barn: what it made and its stores');
    t.act('es-tab','fields');ok(h2()==='Fields'&&/Fields worked/.test(panel())&&q('.rwbody .row'),'its Fields: the fields it works, as rows');
    t.act('es-tab','home');ok(G.estTab===null&&q('.rwbody [data-act="fief-build"][data-arg="farm"]')&&q('.rwbody [data-act="es-ask"][data-arg="demolish"]'),'the overview: the building buttons, Upgrade and Pull down');
    {const lv0=t.bldLv(ash,'farm');t.act('es-ask','demolish');ok(q('#panel.confirm')&&q('.nav [data-nav="close"]').dataset.act==='fief-demolish'&&t.bldLv(ash,'farm')===lv0,'Pull down asks first (nothing pulled down yet)');t.act('es-tab','home')}
    ok(qa('.rwbody .rkact').map(b=>b.dataset.act+':'+b.dataset.rk).join()===(t.bldLv(ash,'farm')<t.bldCap(ash,'farm')?'fief-build:q,':'')+'es-ask:w'&&/\d+g · \d+ days/.test(q('.rwbody .rkact').textContent),'your own estate\'s key actions: Upgrade (its cost and days) and Pull down, Q and W');
    {const g0=P.gold,lv=t.bldLv(ash,'farm');if(lv<t.bldCap(ash,'farm')){key('KeyQ','q');ok(ash.work&&ash.work.k==='farm'&&P.gold===g0-t.bldCost('farm',lv+1)&&G.est&&G.mode==='dialog'&&G.estTab===null&&/building \d+%/.test(q('.rwbody').textContent)&&/Done in/.test(panel()),'Upgrade from the estate: the work starts, the gold is paid, the window stays (its state: '+t.bldStatus(ash,'farm')[0]+')')}
      else ok(false,'Ashford\'s farm can be upgraded')}
    ash.work=null;world();
    // ---- its workers: in the window, on the same rail, Back to the overview
    {const f=W.folk.find(x=>x.home==='Ashford'),k=f.k,ws=()=>W.folk.filter(x=>x.home==='Ashford'&&x.k===k);ws()[0].st='out';world();t.estateMeet(t.estatePick(ash,k));t.act('es-tab','folk');const c=q('.rwbody .rcard'),inn=ws().filter(x=>x.st==='in');
      ok(G.est&&!G.wk&&on()==='folk'&&h2()===t.ESTATE_AREAS[k].folk&&inn.length>=1&&qa('.rwbody .rcard').length===inn.length&&inn.every(x=>{const cd=q('.rwbody .rcard [data-act="es-folk"][data-arg="'+x.id+'"]');return cd&&cd.closest('.rcard').textContent.includes(x.name)&&cd.closest('.rcard').querySelector('img.rc-pic').src===t.workerPic(x.job,ash.races[0],x.v)&&cd.closest('.rcard').querySelector('[data-act="es-recruit"][data-arg="'+x.id+'"]')}),
        'the '+t.ESTATE_AREAS[k].folk+': a card for each '+f.job+' at work there now (not the one out on the road), his own name and portrait, Talk and Recruit ('+inn.map(x=>x.name).join(', ')+')');
      ok(new Set(ws().map(x=>x.name+x.v)).size>1||ws().length<2,'each worker his own name and look, seeded');
      fits('the workers\' area',[['folk',()=>{}]]);
      c.querySelector('[data-act="es-folk"]').click();ok(G.wk&&q('#panel.railed')&&on()==='folk'&&/Hire as/.test(panel())&&q('.nav [data-nav="back"]').dataset.act==='wk-back','Talk: the worker\'s talk in the window, on the estate\'s rail');
      fits('the worker\'s window',[['worker',()=>{}]]);
      t.act('wk-back');ok(G.mode==='dialog'&&G.est&&!G.wk&&G.estTab==='folk','Back: the '+t.ESTATE_AREAS[k].folk+' again');
      t.act('es-folk');ok(G.wk&&on()==='folk','(Talk to the '+f.job+'s, as before, opens it too)');t.onEscape();ok(G.est&&!G.wk,'Esc from the worker: the estate again');
      t.act('es-folk');t.act('es-tab','works');ok(G.est&&!G.wk&&G.mode==='dialog'&&on()==='works','another menu from the worker\'s window');
      // recruit one: a tier-0 peasant of his trade, the estate a pair of hands short, then someone new
      {world();t.estateMeet(t.estatePick(ash,k));t.act('es-tab','folk');const w=ws().find(x=>x.st==='in'),kk=t.recruitKind(ash,w),before=P.troops[kk]||0,g0=P.gold,h0=t.handsLeft(ash,k);ash.lost={};P.troops={hum_knight:2};t.showEstate();
        t.act('es-recruit',w.id);ok(P.troops[kk]===1&&t.ST[kk].tier===0&&t.ST[kk].n===t.TRADES[t.tradeOf(w)].n&&t.UP[kk][0]===t.RACES[ash.races[0]].melee&&P.gold===g0-t.hireCost(kk)&&!W.folk.includes(w)&&!q('.rwbody [data-arg="'+w.id+'"]'),
          'Recruit: '+w.name+' joins as a '+t.ST[kk].n+' (tier 0, '+t.hireCost(kk)+'g, trains into '+t.ST[t.UP[kk][0]].n+'), his card gone');
        ok(t.handsLeft(ash,k)<1&&/hands short/.test(panel()),'the '+t.ESTATES[k].n.toLowerCase()+' makes less: '+Math.round(t.handsLeft(ash,k)*100)+'% until someone new moves in');
        const d0=G.day;G.day+=t.REFILL_DAYS;ok(t.handsLeft(ash,k)===1,'after '+t.REFILL_DAYS+' days the gap is filled');G.day=d0;
        P.fac=null;W.folk=[];t.FOLK_SEEN.clear();P.x=z.x;P.y=z.y+40;for(let i=0;i<300;i++)t.updateFolk(.05);const wz=W.folk.find(x=>x.home===z.name&&x.st==='in');P.rep[z.name]=60;
        if(wz){P.troops={hum_knight:2};t.estateMeet(t.estatePick(z,wz.k));const r1=t.repAt(z.name);t.act('es-recruit',wz.id);ok(t.repAt(z.name)<r1,'recruiting at someone else\'s estate costs a little reputation there ('+r1.toFixed(1)+' → '+t.repAt(z.name).toFixed(1)+')');P.fac=z.owner;t.estateMeet(t.estatePick(z,wz.k));t.act('es-tab','folk');const b=q('.rwbody [data-act="es-recruit"]');ok(!b||b.disabled&&/employer/.test(b.title),'not from your employer\'s estate');P.fac=null}
        P.troops={hum_knight:6};world();P.x=ash.x;P.y=ash.y+40}
      t.act('dlg-close')}
    // ---- the pasture's herd: Livestock, on the same rail, Back to the pasture
    W.critters=[];t.initCritters();{if(!t.bldLv(ash,'pasture')){ash.bld.pasture=1;t.syncLots(ash)}
      world();t.estateMeet(t.estatePick(ash,'pasture'));ok(menus().includes('herd')&&!menus().some(k=>ESTS.includes(k))&&names()[menus().indexOf('herd')]==='Pens','the pasture: its Pens among its areas ('+names().join(', ')+')');t.act('es-tab','herd');
      {const h=t.herdOf(ash),n0=h.n,g0=P.gold;ok(G.mode==='dialog'&&h2()==='Pens'&&q('.rwbody .row [data-act="herd-buy"]')&&/grazing/.test(panel())&&!/Buy livestock/.test(panel()),'the Pens: what the herders sell, as rows with Buy, right there (no Buy livestock step)');
        q('.rwbody [data-act="herd-buy"]').click();ok(h.n===n0-1&&P.gold<g0&&G.mode==='dialog'&&G.estTab==='herd'&&q('#panel.railed'),'Buy in the Pens: one bought, the Pens stay open');t.act('es-herd')}
      ok(G.mode==='herd'&&q('#panel.railed')&&on()==='herd'&&/data-act="herd-buy"/.test(panel())&&q('.nav [data-nav="back"]').dataset.act==='herd-back','Buy livestock: the herders\' window on the pasture\'s rail');
      fits('the herders\' window',[['herd',()=>{}]]);
      const g0=P.gold;t.act('herd-buy');ok(P.gold<g0&&G.mode==='herd'&&q('#panel.railed'),'buying keeps the window on its rail');
      t.act('herd-back');ok(G.mode==='dialog'&&G.est&&G.estTab==='herd'&&/Pasture of Ashford/.test(q('.rw-h .muted').textContent),'Back: the pasture\'s Pens again');
      t.act('es-herd');t.onEscape();ok(G.mode==='dialog'&&G.est&&!G.herd,'Esc from the herders: the pasture again');
      t.act('es-herd');t.act('herd-leave');ok(G.mode==='world','Leave from the herders: the map')}
    fits('the estate windows',[['rival',()=>{world();t.estateMeet(t.estatePick(z,k0))}],['own farm',()=>{world();t.estateMeet(t.estatePick(ash,'farm'))}],['farmhouse',()=>t.act('es-tab','folk')],['barn',()=>t.act('es-tab','works')]]);
    world();
    // ---- sites: their places down the rail, each with its window
    const S=W.sites,of=ty=>S.find(s=>s.type===ty),seen=[],AREAS={cave:'Cave mouth',ruins:'Ruined hall',shrine:'Altar,Offering stone',travelers:'Wagons,Campfire'};
    for(const ty of ['cave','ruins','shrine','travelers']){const s=of(ty);s.cleared=false;s.seen=true;if(ty==='shrine')s.back=0;world();G.lastSite=null;t.enterSite(s);
      const ps=qa('.rail-i').map(b=>b.dataset.arg),bad=[];
      ok(G.mode==='site'&&q('#panel.railed')&&h2()===s.name&&!q('.nav [data-nav="back"]')&&q('.nav [data-nav="close"]').dataset.act==='site-leave'&&ps.length&&q('.rail-head').textContent.includes(s.T.n)&&!qa('.rail-i small').length&&qa('.rail-i .ri-n').map(b=>b.textContent).join()===AREAS[ty],
        s.T.n+': its overview, the rail of its areas, no status under them ('+qa('.rail-i .ri-n').map(b=>b.textContent).join(', ')+'), Leave');
      for(const k of ps){t.act('site-tab',k);if(G.siteTab!==k||on()!==k||!q('.nav [data-nav="back"]')||!q('.rwbody .row,.rwbody .rcard'))bad.push(k);t.onEscape();if(G.siteTab!==null||G.mode!=='site')bad.push(k+' esc')}
      ok(!bad.length,s.T.n+': each place opens its window (its rows), Back and Esc to the overview'+(bad.length?': '+bad.join(', '):''));
      key('Digit1','1');ok(G.siteTab===ps[0],s.T.n+': 1 picks its first place');t.act('site-tab','home');
      // its first page: a big tile per area (window.js RailScreen tiles, sites.js SiteScreen), a picture and lines; a tile opens its area
      {const ts=qa('.rwbody .rtile');ok(s.screen instanceof t.SiteScreen&&s.screen instanceof t.RailScreen&&ts.length===ps.length&&ts.every((x,i)=>{const im=x.querySelector('.rt-pic img');const cv=t.TILE_CV[im.dataset.pk];return im&&/^data:image\/png/.test(im.getAttribute('src'))&&cv&&cv.width===128&&cv.height===56&&x.querySelectorAll('.rt-t small').length>=2&&x.querySelector('.rt-open').dataset.arg===ps[i]})&&!q('.rwbody .tnotes'),
          s.T.n+': its first page is a tile per area, each a picture (128 × 56, shown ×2) and its lines ('+ts.map(x=>x.querySelector('b').textContent).join(', ')+')');
        const px=(()=>{const im=ts[0].querySelector('img'),c=t.TILE_CV[im.dataset.pk];if(!c)return 0;const g=c.getContext('2d');const d=g.getImageData(0,0,128,56).data,set=new Set();for(let i=0;i<d.length;i+=16)set.add(d[i]+','+d[i+1]+','+d[i+2]);return set.size})();ok(px>12,s.T.n+': the picture is drawn, not blank ('+px+' colours)');
        ts[ts.length-1].querySelector('.rt-open').click();ok(G.siteTab===ps[ps.length-1],s.T.n+': a click on a tile opens its area');t.act('site-tab',ps[0])}
      seen.push([ty,()=>{world();G.lastSite=null;t.enterSite(s)}],[ty+' '+ps[0],()=>t.act('site-tab',ps[0])]);
      t.onEscape();t.onEscape();ok(G.mode==='world'&&!G.site,s.T.n+': Esc again leaves')}
    // the shrine: Pray right from its tile
    {const sh=of('shrine');sh.back=0;world();G.lastSite=null;t.enterSite(sh);P.sp=1;const b=q('.rwbody .rtile .rt-act [data-act="site-pray"][data-arg="0"]');ok(b&&!b.disabled,'the shrine\'s Altar tile carries Pray');b.click();
      ok(sh.back===G.day+7&&P.sp>1&&G.mode==='site'&&q('.rwbody .rtile [data-act="site-pray"][data-arg="0"]').disabled,'Pray from the tile works: restored, then once a week');
      const bad=[];for(const [w,h] of [[1280,720],[844,390],[420,900]]){const scr=q('#screen'),css=scr.style.cssText;scr.style.cssText+=';width:'+w+'px;height:'+h+'px';q('#panel').style.animation='none';const b=q('.rwbody'),br=b.getBoundingClientRect();
        for(const x of qa('.rwbody .rtile')){const r=x.getBoundingClientRect(),ir=x.querySelector('.rt-pic img').getBoundingClientRect();if(r.left<br.left-.5||r.right>br.right+.5||ir.width%128||ir.width>r.width)bad.push(w+'x'+h+' '+Math.round(r.width)+'/'+Math.round(ir.width))}if(b.scrollWidth>b.clientWidth+1)bad.push(w+'x'+h+' sideways');q('#panel').style.animation='';scr.style.cssText=css}
      ok(!bad.length,'the tiles fit at 1280 × 720, 844 × 390 and 420 × 900, their pictures at whole scales'+(bad.length?': '+bad.join('; '):''));t.act('site-leave')}
    {const tr=of('travelers');world();G.lastSite=null;t.enterSite(tr);P.gold=2000;P.inv=P.inv.map(()=>null);t.act('site-tab','trade');const g=Object.keys(tr.stock)[0],n0=t.goodN(g);t.act('site-buy',g);
      ok(t.goodN(g)===n0+5&&G.siteTab==='trade'&&/You buy/.test(q('.rwbody').textContent),'an action works as before; its result shows in the window, which stays open');
      ok(q('.rwbody .rcard img.rc-pic')&&/The traders/.test(q('.rwbody .rcard').textContent)&&qa('.rwbody .row [data-act="site-buy"]').length===Object.keys(tr.stock).length,'the Wagons: the traders as a card, their goods as rows');
      if(!tr.unit){tr.kind=0;tr.stockUp()}tr.mercs=Math.max(tr.mercs,3);P.troops={};t.act('site-tab','fire');{const c=q('.rwbody .rcard [data-act="site-hirepick"]'),cd=c&&c.closest('.rcard');
        ok(cd&&cd.querySelector('img.rc-pic').src===t.portrait(tr.unit)&&cd.querySelector('.rc-n').textContent==='×'+tr.mercs&&new RegExp(tr.mercs+' willing').test(cd.textContent)&&/^Hire$/.test(c.textContent)&&/\d+g each/.test(cd.textContent)&&q('.rwbody .rcard [data-act="site-news"]')&&q('.rwbody .row [data-act="site-fire"]'),
          'the Campfire: the sellswords as a card ('+(cd?cd.querySelector('.rc-facts').textContent:'none')+', Hire), the storyteller with news, the fire to rest by');
        if(c){const m0=tr.mercs,g0=P.gold;c.click();ok(q('#panel.picker')&&q('.pk-row')&&/Hire sellswords/.test(q('#panel h2').textContent)&&q('.nav [data-nav="close"]').dataset.arg==='1','Hire: a picker, how many, Back and Hire (1 to start)');
          t.act('pk-set','merc:2');ok(q('.nav [data-nav="close"]').dataset.arg==='2'&&/2 \/ /.test(q('.pk-n').textContent),'+ and −: the count, and the total ('+q('.pk-total').textContent+')');q('.nav [data-nav="close"]').click();
          ok(tr.mercs===m0-2&&P.troops[tr.unit]===2&&P.gold===g0-2*t.mercCost(tr.unit)&&G.siteTab==='fire'&&q('#panel.railed'),'Confirm: two sellswords hired, back at the fire')}}
      t.act('site-leave');ok(G.mode==='world','Leave: the map')}
    fits('the site windows',seen);world();
    {const h=of('hideout');h.cleared=false;G.lastSite=null;t.enterSite(h);ok(G.enc&&G.enc.kind==='camp'&&!q('#panel.railed'),'a hideout still means a fight at once (no window)');t.act('flee');world()}
    // ---- one base: towns, holdings, estates and sites all through window.js
    {const get=u=>{const x=new XMLHttpRequest();x.open('GET',u,false);x.send();return x.responseText},srcs=[...document.querySelectorAll('script[src^="js/"]')].map(s=>s.getAttribute('src'));
      const builds=srcs.filter(f=>f!=='js/ui/window.js'&&/class="rail|rail-i|rail-head|rh-flag|class="rwin|rwbody"|class="rcard|class="rc-|ri-dot|class="rkact|class="rka-|class="rtile|class="rt-|class="pk-|class="qty/.test(get(f).replace(/querySelector(All)?\('[^']*'\)/g,'')));
      ok(!builds.length,'no script but ui/window.js builds the rail\'s, the cards\' or the dot\'s markup'+(builds.length?': '+builds.join(', '):''));
      const via2={'js/ui/town.js':'railCards(','js/ui/townui.js':'railCards(','js/world/estates.js':'railCards(','js/world/sites.js':'railCards('};
      ok(Object.entries(via2).every(([f,c])=>get(f).includes(c))&&['js/ui/town.js','js/world/estates.js'].every(f=>get(f).includes('railKeyActions(')),'the town, the hall, the estate and the site give their people to the one card builder (window.js railCards), and the estate and the town their key actions to railKeyActions');
      const via={'js/ui/townui.js':'showRail(','js/world/estates.js':'showRail(','js/world/sites.js':'showRail(','js/world/folk.js':'estateRail(','js/world/critters.js':'estateRail('};
      ok(Object.entries(via).every(([f,c])=>get(f).includes(c)),'the town, the holding, the estate (its workers and herd) and the site screens all call the one base');
      const keys=[];t.enterTown(ash);keys.push(q('#panel').dataset.rail);t.act('tab','fief');keys.push(q('#panel').dataset.rail);t.act('leave');world();t.estateMeet(t.estatePick(ash,'farm'));keys.push(q('#panel').dataset.rail);world();
      G.lastSite=null;t.enterSite(of('shrine'));keys.push(q('#panel').dataset.rail);world();
      ok(/^town:/.test(keys[0])&&/^town:.*:fief:/.test(keys[1])&&/^est:/.test(keys[2])&&/^site:/.test(keys[3]),'each one\'s window is shown by showRail ('+keys.join(', ')+')');
      t.enterTown(ash);ok(!q('.rwbody .rtile')&&t.RAIL_SCREEN.constructor===t.RailScreen,'a town keeps the default first page (no tiles): only screens that extend RailScreen get them');t.act('leave');world()}
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
