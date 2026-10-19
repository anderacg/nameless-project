'use strict';
// Estates and sites on the shared rail (ui/window.js): an estate met on the map shows its own areas down the rail (never the
// holding's other estates), named as the rooms of a house with no status under them, its overview first; the people in an
// area (its workers, its guards, a pasture's herd; a camp's sellswords and storytellers) are cards with portraits and buttons; your own estate is managed right there (Manage), a
// rival's offers sabotage, plunder and burning (Raid); its workers open on the same rail and come back; its Pens only tell of its
// herd (nothing is sold). The travellers' places down their rail, each with its window, Back to their overview; a shrine, ruins,
// a cave, a camp or a hideout one page, no rail: a banner picture of the place, what you know, its key actions. Leave, Esc and the number keys as in towns; all of it fits a phone on its
// side; and towns, holdings, estates and sites all go through the one base (no other file builds the rail).
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
      c.querySelector('[data-act="es-folk"]').click();ok(G.wk&&q('#panel.railed')&&on()==='folk'&&q('.rwbody .rkact[data-act="wk-hire"]')&&q('.nav [data-nav="back"]').dataset.act==='wk-back','Talk: the worker\'s talk in the window, on the estate\'s rail');
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
    // ---- the pasture's Pens: its herd and what the pasture makes of it, to look at only (nothing is sold, no herders' window)
    W.critters=[];t.initCritters();{if(!t.bldLv(ash,'pasture')){ash.bld.pasture=1;t.syncLots(ash)}
      world();t.estateMeet(t.estatePick(ash,'pasture'));ok(menus().includes('herd')&&!menus().some(k=>ESTS.includes(k))&&names()[menus().indexOf('herd')]==='Pens','the pasture: its Pens among its areas ('+names().join(', ')+')');t.act('es-tab','herd');
      {const h=t.herdOf(ash),c=q('.rwbody .rcard');ok(G.mode==='dialog'&&h2()==='Pens'&&c&&c.querySelector('img.rc-pic').src===t.critterPic(h.id)&&c.querySelector('.rc-n').textContent==='×'+h.n&&/Not for sale/.test(c.textContent)&&/makes about/.test(c.textContent)&&!q('.rwbody button')&&!/herd-|es-herd/.test(panel()),
        'the Pens: a card for the herd (its picture, how many, what it makes), no Buy, no milk, no taking one, no herders\' window ('+(c&&c.querySelector('.rc-facts').textContent)+')')}
      fits('the Pens',[['pens',()=>{}]]);
      t.onEscape();ok(G.mode==='dialog'&&G.est&&G.estTab===null,'Esc from the Pens: the pasture\'s overview');
      {const c=t.herdOf(ash);W.critters=W.critters.filter(x=>x!==c);world();t.estateMeet(t.estatePick(ash,'pasture'));ok(!menus().includes('herd'),'no herd (yet): no Pens');W.critters.push(c);world()}}
    fits('the estate windows',[['rival',()=>{world();t.estateMeet(t.estatePick(z,k0))}],['own farm',()=>{world();t.estateMeet(t.estatePick(ash,'farm'))}],['farmhouse',()=>t.act('es-tab','folk')],['barn',()=>t.act('es-tab','works')]]);
    world();
    // ---- sites. A shrine, ruins, a cave, a bandit camp or hideout: one page each, no rail (window.js PageScreen): its header,
    // what it is, its picture tiles (each tile's action under it, its digit), its key actions, Leave in the bar
    const S=W.sites,of=ty=>S.find(s=>s.type===ty),pages=[],ACTS={cave:'site-scout:q,site-ask:w',ruins:'site-search:q,site-lore:w',shrine:'site-pray:q,site-pray:w',camp:'site-scout:q,site-ask:w,site-tab:e',hideout:'site-scout:q,site-ask:w,site-tab:e'};
    // (a page fits a phone on its side: no rail, nothing sideways, its bottom bar on screen)
    const fitsPage=(name,go)=>{const scr=q('#screen'),css=scr.style.cssText;scr.style.cssText+=';width:844px;height:390px';const bad=[];
      for(const [n,f] of go){f();q('#panel').style.animation='none';const p=q('#panel'),b=q('.rwbody'),s=scr.getBoundingClientRect(),pr=p.getBoundingClientRect(),nv=q('.rwin>.nav');
        if(!b||q('.rail')||!nv){bad.push(n+' no page');continue}const nr=nv.getBoundingClientRect();
        if(pr.left<s.left-.5||pr.right>s.right+.5||pr.bottom>s.bottom+.5||p.scrollWidth>p.clientWidth+1||b.scrollWidth>b.clientWidth+1||nr.bottom>pr.bottom+.5)bad.push(n+' '+Math.round(pr.width)+'x'+Math.round(pr.height)+' body '+b.scrollWidth+'/'+b.clientWidth)}
      ok(!bad.length,'at 844 x 390 '+name+' fit: no rail, nothing sideways, the bottom bar on screen'+(bad.length?': '+bad.join('; '):''));q('#panel').style.animation='';scr.style.cssText=css};
    for(const ty of ['cave','ruins','shrine','camp','hideout']){const s=ty==='camp'?t.camps()[0]:of(ty);s.cleared=false;s.seen=true;if(ty==='shrine')s.back=0;world();G.lastSite=null;t.enterSite(s);
      const bn=q('.rwbody>.pg-banner'),cv=bn&&t.BANNER_CV[bn.dataset.pk];
      ok(G.mode==='site'&&!G.enc&&s.screen===t.PAGE_SCREEN&&s.screen instanceof t.PageScreen&&t.PAGE_SCREEN instanceof t.RailScreen&&q('#panel.paged')&&!q('#panel.railed')&&!q('.rail')&&!q('.rail-i')&&q('.rwin h2').textContent===s.name&&q('.rwin>.top .rh-flag svg')&&
        !q('.nav [data-nav="back"]')&&q('.nav [data-nav="close"]').dataset.act==='site-leave'&&qa('.rwbody .rkact').map(b=>b.dataset.act+':'+b.dataset.rk).join()===ACTS[ty]&&!q('.rwbody [data-key]')&&!q('.rwbody [class^="rt"]'),
        s.T.n+': one page, no rail: its name and icon in the header, its key actions ('+qa('.rwbody .rkact b').map(b=>b.textContent).join(', ')+'), no tiles, no digits, Leave in the bar');
      {const px=cv?(()=>{const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,set=new Set();for(let i=0;i<d.length;i+=16)set.add(d[i]+','+d[i+1]+','+d[i+2]);return set.size})():0;
        ok(bn&&bn===q('.rwbody').firstElementChild&&!bn.textContent.trim()&&!bn.querySelector('*')&&/url\("?data:image\/png/.test(bn.style.backgroundImage)&&cv.width===t.PAGE_BANNER.w&&cv.height===t.PAGE_BANNER.h&&px>30,
          s.T.n+': on top a banner, a picture of the place only (no words in it): '+cv.width+' × '+cv.height+', '+px+' colours, the place on its own ground')}
      pages.push([ty,()=>{world();G.lastSite=null;t.enterSite(s)}]);t.onEscape();ok(G.mode==='world'&&!G.site,s.T.n+': Esc leaves')}
    // the banner fills the window's width at a whole scale (×4, ×2 on a small screen), never smoothed
    {const sh=of('shrine');sh.back=0;world();G.lastSite=null;t.enterSite(sh);const bad=[];
      for(const [w,h,k] of [[1280,720,4],[844,390,2],[420,900,2]]){const scr=q('#screen'),css=scr.style.cssText;scr.style.cssText+=';width:'+w+'px;height:'+h+'px';q('#panel').style.animation='none';const bd=q('.rwbody'),bn=q('.pg-banner'),r=bn.getBoundingClientRect(),br=bd.getBoundingClientRect(),cs=getComputedStyle(bn);
        if(Math.abs(r.height-t.PAGE_BANNER.h*k)>.5||cs.backgroundSize!==t.PAGE_BANNER.w*k+'px '+t.PAGE_BANNER.h*k+'px'||Math.abs(r.width-bd.clientWidth)>1||r.left>br.left+.5||cs.imageRendering!=='pixelated'||bd.scrollWidth>bd.clientWidth+1)bad.push(w+'x'+h+' '+Math.round(r.width)+'x'+Math.round(r.height)+' '+cs.backgroundSize);
        q('#panel').style.animation='';scr.style.cssText=css}
      ok(!bad.length,'the banner spans the window at 1280 × 720 (×4, '+t.PAGE_BANNER.h*4+' px high), 844 × 390 and 420 × 900 (×2), crisp'+(bad.length?': '+bad.join('; '):''));
      // the shrine: Pray and Offer as its key actions, what they give in its body
      P.sp=1;ok(/Pray at the altar/.test(q('.rwbody').textContent)&&/offering stone/.test(q('.rwbody').textContent),'the shrine: what praying and an offering give, in its body');
      key('KeyQ','q');ok(sh.back===G.day+7&&P.sp>1&&G.mode==='site'&&q('#panel.paged')&&q('.rkact[data-act="site-pray"][data-arg="0"]').disabled,'Q prays: restored, then once a week (Pray greyed)');
      const g0=P.gold;key('KeyW','w');ok(P.gold===g0,'W is taken by the greyed Offer: nothing happens');t.act('site-leave')}
    {const cv=of('cave');cv.cleared=false;world();G.lastSite=null;t.enterSite(cv);const ks=qa('.rwbody .rkacts .rkact');
      ok(ks.map(b=>b.dataset.act+':'+b.dataset.rk).join()==='site-scout:q,site-ask:w'&&!q('.rwbody .rt-act')&&!q('.rwbody [data-key]'),'the cave: Scout (Q) and Enter (W) as its key actions; no tile action, no digits');
      key('KeyW','w');ok(q('#panel.confirm')&&!G.enc&&q('.nav [data-nav="close"]').dataset.act==='site-fight','W: Enter asks first');t.onEscape();ok(q('#panel.paged')&&G.site===cv,'Back: the cave\'s page again');t.act('site-leave')}
    fitsPage('the site pages',pages);world();
    // the travellers: the rail's default first page (no tiles): their Wagons and Campfire down the rail, a plain list
    {const tr=of('travelers');if(!t.TRAVELERS[tr.kind].race){tr.kind=0;tr.stockUp()}tr.seen=true;world();G.lastSite=null;t.enterSite(tr);
      ok(G.mode==='site'&&q('#panel.railed')&&tr.screen===t.RAIL_SCREEN&&!q('.pg-banner')&&qa('.rwbody .tnotes li').length===2&&qa('.rail-i .ri-n').map(b=>b.textContent).join()==='Wagons,Campfire'&&!q('.nav [data-nav="back"]'),'the travellers: the rail (Wagons, Campfire) and the plain overview, no tiles');
      const bad=[];for(const k of ['trade','fire']){t.act('site-tab',k);if(G.siteTab!==k||on()!==k||!q('.nav [data-nav="back"]'))bad.push(k);t.onEscape();if(G.siteTab!==null||G.mode!=='site')bad.push(k+' esc')}
      ok(!bad.length,'each opens its window, Back and Esc to the overview'+(bad.length?': '+bad.join(', '):''));
      key('Digit1','1');ok(G.siteTab==='trade','1 picks the Wagons');t.act('site-tab','home');
      P.gold=2000;P.inv=P.inv.map(()=>null);t.act('site-tab','trade');const g=Object.keys(tr.stock)[0],n0=t.goodN(g);t.act('site-buy',g);
      ok(t.goodN(g)===n0+5&&G.siteTab==='trade'&&/You buy/.test(q('.rwbody').textContent),'an action works as before; its result shows in the window, which stays open');
      ok(q('.rwbody .rcard img.rc-pic')&&/The traders/.test(q('.rwbody .rcard').textContent)&&qa('.rwbody .row [data-act="site-buy"]').length===Object.keys(tr.stock).length,'the Wagons: the traders as a card, their goods as rows');
      // the Campfire: a card for each sellsword, his own name, look, tier and price, Hire; hiring him takes his card away
      tr.mercs=3;delete tr.hired;P.troops={};t.act('site-tab','fire');const sw=tr.swords(),cs=qa('.rwbody .rcard').filter(c=>c.querySelector('[data-act="site-hire"]'));
      ok(sw.length===3&&cs.length===3&&cs.every((c,i)=>{const w=sw[i];return c.querySelector('strong').textContent===w.name&&c.querySelector('img.rc-pic').src===t.portrait(w.k,false,w.v)&&new RegExp('Tier '+t.ST[w.k].tier).test(c.textContent)&&new RegExp(w.c+'g').test(c.textContent)&&!c.querySelector('.rc-n')&&c.querySelector('[data-act="site-hire"]').dataset.arg===String(w.i)}),
        'the Campfire: a card for each of the 3 sellswords, his own name, look, tier and price, a Hire each, no count ('+sw.map(w=>w.name+' '+t.ST[w.k].n+' '+w.c+'g').join('; ')+')');
      ok(new Set(sw.map(w=>w.name)).size===3&&JSON.stringify(tr.swords())===JSON.stringify(sw),'each his own name, the same each time they are asked (seeded from the camp)');
      ok(q('.rwbody .rcard [data-act="site-news"]')&&q('.rwbody .row [data-act="site-fire"]')&&!q('[data-act="site-hirepick"]'),'the greybeard with news and the fire stay as they were; no amount picker');
      {const w=sw[1],g0=P.gold;q('.rwbody [data-act="site-hire"][data-arg="'+w.i+'"]').click();
        ok(P.troops[w.k]===1&&P.gold===g0-w.c&&tr.mercs===2&&tr.hired.join()===String(w.i)&&!q('.rwbody [data-act="site-hire"][data-arg="'+w.i+'"]')&&qa('.rwbody [data-act="site-hire"]').length===2&&!panel().includes(w.name+'</strong>')&&G.siteTab==='fire'&&q('#panel.railed'),
          'Hire: '+w.name+' joins ('+w.c+'g), his card goes, the other two stay as they were');
        ok(JSON.stringify(tr.swords())===JSON.stringify(sw.filter(x=>x!==sw[1]).map(x=>x)),'the two left keep their names and looks');
        G.mode='world';t.saveGame(true,'3');const sv=t.readSlot('3').world.sites.find(x=>x.tx===tr.tx&&x.ty===tr.ty&&x.type==='travelers');ok(sv&&sv.mercs===2&&sv.hired.join()===String(w.i),'saved: how many are left and whose place was hired (the rest of the save as it was)');G.mode='site'}
      fits('the travellers\' windows',[['travellers',()=>{world();G.lastSite=null;t.enterSite(tr)}],['campfire',()=>t.act('site-tab','fire')]]);
      t.act('site-leave');ok(G.mode==='world','Leave: the map')}
    world();
    // ---- one base: towns, holdings, estates and sites all through window.js
    {const get=u=>{const x=new XMLHttpRequest();x.open('GET',u,false);x.send();return x.responseText},srcs=[...document.querySelectorAll('script[src^="js/"]')].map(s=>s.getAttribute('src'));
      const builds=srcs.filter(f=>f!=='js/ui/window.js'&&/class="rail|rail-i|rail-head|rh-flag|class="rwin|rwbody"|class="rcard|class="rc-|ri-dot|class="rkact|class="rka-|class="rtile|class="rt-|class="pg-|class="pk-|class="qty/.test(get(f).replace(/querySelector(All)?\('[^']*'\)/g,'')));
      ok(!builds.length,'no script but ui/window.js builds the rail\'s, the cards\' or the dot\'s markup'+(builds.length?': '+builds.join(', '):''));
      const via2={'js/ui/town.js':'railCards(','js/ui/townui.js':'railCards(','js/world/estates.js':'railCards(','js/world/sites.js':'railCards('};
      ok(Object.entries(via2).every(([f,c])=>get(f).includes(c))&&['js/ui/town.js','js/world/estates.js'].every(f=>get(f).includes('railKeyActions(')),'the town, the hall, the estate and the site give their people to the one card builder (window.js railCards), and the estate and the town their key actions to railKeyActions');
      const via={'js/ui/townui.js':'showRail(','js/world/estates.js':'showRail(','js/world/sites.js':'showRail(','js/world/folk.js':'estateRail('};
      ok(Object.entries(via).every(([f,c])=>get(f).includes(c))&&get('js/world/sites.js').includes('PAGE_SCREEN.show(')&&/class PageScreen extends RailScreen/.test(get('js/ui/window.js'))&&!/estateRail\(|showPanel\(/.test(get('js/world/critters.js')),'the town, the holding, the estate (its workers) and the site screens all call the one base; the one-page sites its PageScreen; no window is built for a herd');
      const keys=[];t.enterTown(ash);keys.push(q('#panel').dataset.rail);t.act('tab','fief');keys.push(q('#panel').dataset.rail);t.act('leave');world();t.estateMeet(t.estatePick(ash,'farm'));keys.push(q('#panel').dataset.rail);world();
      G.lastSite=null;t.enterSite(of('travelers'));keys.push(q('#panel').dataset.rail);world();G.lastSite=null;t.enterSite(of('shrine'));keys.push(q('#panel').dataset.page);world();
      ok(/^town:/.test(keys[0])&&/^town:.*:fief:/.test(keys[1])&&/^est:/.test(keys[2])&&/^site:/.test(keys[3])&&/^site:/.test(keys[4]),'each one\'s window is shown by showRail, a page by PageScreen show ('+keys.join(', ')+')');
      t.enterTown(ash);ok(!q('.pg-banner')&&q('#panel.railed')&&t.RAIL_SCREEN.constructor===t.RailScreen,'a town keeps its rail and plain first page (a banner is a page’s: PageScreen)');t.act('leave');world()}
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
