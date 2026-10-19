'use strict';
// Estates and sites on the shared rail (ui/window.js): an estate met on the map shows its own menus down the rail (never the
// holding's other estates), each with its status, its overview first; your own estate is managed right there (Manage), a
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
    ok(/Production|Nothing made/.test(panel())&&/In store/.test(panel())&&/A mine|\./.test(panel()),'the overview: what it is, its state, what it made yesterday and its stores');
    ok(menus().join()===(t.ESTATES[k0].work?'folk,raid':'raid')&&!menus().some(k=>ESTS.includes(k))&&qa('.rail-i').every(b=>b.querySelector('.ri-ico svg')&&b.querySelector('small').textContent.trim()),
      'the rail: its own menus with a status each, no other estate: '+qa('.rail-i').map(b=>b.querySelector('.ri-n').textContent+' ('+b.querySelector('small').textContent+')').join(', '));
    ok(q('.rail-head').textContent.includes(t.ESTATES[k0].n)&&q('.rail-head .rh-flag svg')&&q('.rail-head .gold'),'the rail\'s header: the estate, its owner\'s banner and your gold');
    ok(!q('.nav [data-nav="back"]')&&/Leave/.test(q('.nav [data-nav="close"]').textContent),'no Back, Leave on the right');
    t.act('es-tab','raid');ok(G.estTab==='raid'&&on()==='raid'&&h2()==='Raid'&&['es-sabotage','es-plunder','es-burn'].every(a=>q('.rwbody [data-act="'+a+'"]'))&&/guards watch it \(power/.test(panel())&&/Plunder: you fight the guards/.test(panel())&&q('.nav [data-nav="back"]'),
      'Raid: its guards and power, Sabotage, Plunder and Burn with their rules, Back');
    t.onEscape();ok(G.mode==='dialog'&&G.estTab===null,'Esc: back to the overview');
    key(String(menus().length===2?'Digit2':'Digit1'),menus().length===2?'2':'1');ok(G.estTab==='raid','its number key picks Raid');
    t.act('es-tab','home');t.onEscape();ok(G.mode==='world'&&t.ov.hidden&&!G.est,'Esc at the overview: out to the map');
    t.estateMeet(t.estatePick(z,k0));t.act('dlg-close');ok(G.mode==='world'&&!G.est,'Leave: out to the map');
    {const o0=P.fac;P.fac=z.owner;t.estateMeet(t.estatePick(z,k0));ok(!menus().includes('raid'),'no Raid on your employer\'s estate');P.fac=o0;world()}
    {world();t.estateMeet(t.estatePick(z,k0));t.act('es-tab','raid');t.act('es-burn');ok(G.enc&&G.enc.kind==='estate'&&G.enc.ref.burn&&t.hostileTo(z.owner),'Burn: a fight with its guards, as before');t.act('flee');world();P.hostile={}}
    // ---- your own farm: managed right there
    const ash=t.townBy('Ashford');ash.owner='player';ash.lastOwner='player';ash.sacked=ash.raided=ash.turmoil=0;t.ensureEcon(ash);world();
    Object.assign(ash.stock,{timber:300,stone:300,tools:60,iron:60});ash.work=null;P.gold=3000;
    W.folk=[];t.FOLK_SEEN.clear();P.x=ash.x;P.y=ash.y+40;G.clock=t.DAY*.2;for(let i=0;i<300;i++)t.updateFolk(.05);
    t.estateMeet(t.estatePick(ash,'farm'));
    ok(h2()==='Farmland of Ashford'&&menus().join()==='folk,manage'&&/Production/.test(panel())&&/In store/.test(panel())&&!/Fief tab/.test(panel()),'your own farm: Farmers and Manage (no Raid; no more "from the Fief tab"): '+qa('.rail-i').map(b=>b.querySelector('.ri-n').textContent+' ('+b.querySelector('small').textContent+')').join(', '));
    t.act('es-tab','manage');ok(on()==='manage'&&q('.rwbody [data-act="fief-build"][data-arg="farm"]')&&q('.rwbody [data-act="fief-demolish"][data-arg="farm"]'),'Manage: the holding\'s building buttons, Upgrade and Pull down');
    {const g0=P.gold,lv=t.bldLv(ash,'farm');if(lv<t.bldCap(ash,'farm')){t.act('fief-build','farm');ok(ash.work&&ash.work.k==='farm'&&P.gold===g0-t.bldCost('farm',lv+1)&&G.est&&G.mode==='dialog'&&G.estTab==='manage'&&/building \d+%/.test(q('.rail-i.on small').textContent)&&/Done in/.test(panel()),'Upgrade from the estate: the work starts, the gold is paid, the window stays ('+q('.rail-i.on small').textContent+')')}
      else ok(false,'Ashford\'s farm can be upgraded')}
    ash.work=null;world();
    // ---- its workers: in the window, on the same rail, Back to the overview
    {const f=W.folk.find(x=>x.home==='Ashford'),k=f.k;world();t.estateMeet(t.estatePick(ash,k));t.act('es-tab','folk');
      ok(G.wk&&q('#panel.railed')&&on()==='folk'&&/Hire as/.test(panel())&&q('.nav [data-nav="back"]').dataset.act==='wk-back','its '+f.job+'s: the worker\'s talk in the window, on the estate\'s rail');
      fits('the worker\'s window',[['worker',()=>{}]]);
      t.act('wk-back');ok(G.mode==='dialog'&&G.est&&!G.wk&&G.estTab===null,'Back: the estate\'s overview again');
      t.act('es-folk');ok(G.wk&&on()==='folk','(Talk to the '+f.job+'s, as before, opens it too)');t.onEscape();ok(G.est&&!G.wk,'Esc from the worker: the estate again');
      t.act('es-folk');t.act('es-tab','manage');ok(G.est&&!G.wk&&G.mode==='dialog'&&on()==='manage','another menu from the worker\'s window');
      t.act('dlg-close')}
    // ---- the pasture's herd: Livestock, on the same rail, Back to the pasture
    W.critters=[];t.initCritters();{if(!t.bldLv(ash,'pasture')){ash.bld.pasture=1;t.syncLots(ash)}
      world();t.estateMeet(t.estatePick(ash,'pasture'));ok(menus().includes('herd')&&!menus().some(k=>ESTS.includes(k)),'the pasture: Livestock among its menus ('+menus().join(', ')+')');t.act('es-tab','herd');
      ok(G.mode==='herd'&&q('#panel.railed')&&on()==='herd'&&/data-act="herd-buy"/.test(panel())&&q('.nav [data-nav="back"]').dataset.act==='herd-back','Livestock: the herders\' window on the pasture\'s rail');
      fits('the herders\' window',[['herd',()=>{}]]);
      const g0=P.gold;t.act('herd-buy');ok(P.gold<g0&&G.mode==='herd'&&q('#panel.railed'),'buying keeps the window on its rail');
      t.act('herd-back');ok(G.mode==='dialog'&&G.est&&/Pasture of Ashford/.test(h2()),'Back: the pasture again');
      t.act('es-herd');t.onEscape();ok(G.mode==='dialog'&&G.est&&!G.herd,'Esc from the herders: the pasture again');
      t.act('es-herd');t.act('herd-leave');ok(G.mode==='world','Leave from the herders: the map')}
    fits('the estate windows',[['rival',()=>{world();t.estateMeet(t.estatePick(z,k0))}],['raid',()=>t.act('es-tab','raid')],['own farm',()=>{world();t.estateMeet(t.estatePick(ash,'farm'))}],['manage',()=>t.act('es-tab','manage')]]);
    world();
    // ---- sites: their places down the rail, each with its window
    const S=W.sites,of=ty=>S.find(s=>s.type===ty),seen=[];
    for(const ty of ['cave','ruins','shrine','travelers']){const s=of(ty);s.cleared=false;s.seen=true;if(ty==='shrine')s.back=0;world();G.lastSite=null;t.enterSite(s);
      const ps=qa('.rail-i').map(b=>b.dataset.arg),bad=[];
      ok(G.mode==='site'&&q('#panel.railed')&&h2()===s.name&&!q('.nav [data-nav="back"]')&&q('.nav [data-nav="close"]').dataset.act==='site-leave'&&ps.length&&q('.rail-head').textContent.includes(s.T.n)&&qa('.rail-i small').length===ps.length,
        s.T.n+': its overview, the rail of its places ('+qa('.rail-i .ri-n').map(b=>b.textContent).join(', ')+'), Leave');
      for(const k of ps){t.act('site-tab',k);if(G.siteTab!==k||on()!==k||!q('.nav [data-nav="back"]')||!q('.rwbody .row'))bad.push(k);t.onEscape();if(G.siteTab!==null||G.mode!=='site')bad.push(k+' esc')}
      ok(!bad.length,s.T.n+': each place opens its window (its rows), Back and Esc to the overview'+(bad.length?': '+bad.join(', '):''));
      key('Digit1','1');ok(G.siteTab===ps[0],s.T.n+': 1 picks its first place');
      seen.push([ty,()=>{world();G.lastSite=null;t.enterSite(s)}],[ty+' '+ps[0],()=>t.act('site-tab',ps[0])]);
      t.onEscape();t.onEscape();ok(G.mode==='world'&&!G.site,s.T.n+': Esc again leaves')}
    {const tr=of('travelers');world();G.lastSite=null;t.enterSite(tr);P.gold=2000;P.inv=P.inv.map(()=>null);t.act('site-tab','trade');const g=Object.keys(tr.stock)[0],n0=t.goodN(g);t.act('site-buy',g);
      ok(t.goodN(g)===n0+5&&G.siteTab==='trade'&&/You buy/.test(q('.rwbody').textContent),'an action works as before; its result shows in the window, which stays open');t.act('site-leave');ok(G.mode==='world','Leave: the map')}
    fits('the site windows',seen);world();
    {const h=of('hideout');h.cleared=false;G.lastSite=null;t.enterSite(h);ok(G.enc&&G.enc.kind==='camp'&&!q('#panel.railed'),'a hideout still means a fight at once (no window)');t.act('flee');world()}
    // ---- one base: towns, holdings, estates and sites all through window.js
    {const get=u=>{const x=new XMLHttpRequest();x.open('GET',u,false);x.send();return x.responseText},srcs=[...document.querySelectorAll('script[src^="js/"]')].map(s=>s.getAttribute('src'));
      const builds=srcs.filter(f=>f!=='js/ui/window.js'&&/class="rail|rail-i|rail-head|rh-flag|class="rwin|rwbody"/.test(get(f).replace(/querySelector(All)?\('[^']*'\)/g,'')));
      ok(!builds.length,'no script but ui/window.js builds the rail\'s markup'+(builds.length?': '+builds.join(', '):''));
      const via={'js/ui/townui.js':'showRail(','js/world/estates.js':'showRail(','js/world/sites.js':'showRail(','js/world/folk.js':'estateRail(','js/world/critters.js':'estateRail('};
      ok(Object.entries(via).every(([f,c])=>get(f).includes(c)),'the town, the holding, the estate (its workers and herd) and the site screens all call the one base');
      const keys=[];t.enterTown(ash);keys.push(q('#panel').dataset.rail);t.act('tab','fief');keys.push(q('#panel').dataset.rail);t.act('leave');world();t.estateMeet(t.estatePick(ash,'farm'));keys.push(q('#panel').dataset.rail);world();
      G.lastSite=null;t.enterSite(of('shrine'));keys.push(q('#panel').dataset.rail);world();
      ok(/^town:/.test(keys[0])&&/^town:.*:fief:/.test(keys[1])&&/^est:/.test(keys[2])&&/^site:/.test(keys[3]),'each one\'s window is shown by showRail ('+keys.join(', ')+')')}
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
