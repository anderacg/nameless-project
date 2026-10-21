'use strict';
// World settings, Phase 2b (doc/WORLD_DESIGN.md §4, §15 2b): the holdings' defaults and density (worldsettings.js: 27 / 40 / 66,
// the owner's fewer of 2026-10-22; Fewer, Normal, More), the world code (worldCode, parseWorldCode: every setting and the seed,
// read back clamped), the quick sketch (worldgen.js genSketch: fast at every size, the same twice, its coast the real one's),
// the New world screen (worldsetup.js: after a past with WORLD.gen, the presets, Classic's locks, size, holdings and their notes,
// a seed or a world code typed, the preview, Esc and Back, Forge the world; the full preview reused by the forge), a seeded start
// (a generated world's first sites, herds, bands and beasts from its seed; the classic world's as ever), the Esc menu's World
// page and the save list's line. Flag off and -Gen. INFO: the sketch's time and agreement at each size.
window.RUN=async()=>{const r=Kit.report(),{ok,info}=r;try{
 const t=T,G=t.G,P=t.P,W=t.W,S=t.WSETUP,N=t.normSettings,J=JSON.stringify,r0=Math.random,q=s=>document.querySelector('#panel '+s),txt=()=>document.getElementById('panel').textContent;
 try{localStorage.clear()}catch(e){}
 // ---- the holdings: the defaults and the density
 {const pr=['normal','large','huge','frontier','crowded'].map(p=>N(t.defaultSettings(p)).holdings),D=z=>['fewer','normal','more'].map(d=>t.densityHoldings(N({preset:z}),d)).join('/');
  ok(J(pr)==='[27,40,66,28,40]'&&N(t.classicSettings()).holdings===37&&N({}).holdings===27,'the presets\' holdings: Normal 27, Large 40, Huge 66, Wild Frontier 28, Crowded Realms 40 (about 27% fewer than 37 / 55 / 90); Classic keeps its 37');
  ok(D('normal')==='25/27/37'&&D('large')==='32/40/55'&&D('huge')==='53/66/90','the density: Fewer, Normal, More at Normal '+D('normal')+', Large '+D('large')+', Huge '+D('huge')+' (Fewer never under 25; More today\'s 37 / 55 / 90)');
  const s=N({preset:'large'});ok(t.densityOf(s)==='normal'&&t.densityOf({...s,holdings:55})==='more'&&t.densityOf({...s,holdings:41})===null&&t.densityHoldings(N({preset:'normal',wild:'vast',land:'sea'}),'more')===37,'densityOf reads the density back (a number of its own: none); More within the land\'s limit')}
 // ---- the world code
 {const c=t.worldCode(N({preset:'large',seed:'redwater'})),back=t.parseWorldCode(c);
  ok(/^ASH1-L-[0-9A-Z]+-redwater$/.test(c)&&J(back)===J(N({preset:'large',seed:'redwater'})),'a world code: '+c+', read back to the same settings');
  const R=t.seeded(31),pick=a=>a[Math.floor(R()*a.length)],bad=[];
  for(let k=0;k<200;k++){const s={preset:pick(t.SETTING_CHOICES.preset),seed:R()<.2?'':'w'+k+(R()<.3?'-x y':'')};for(const c of Object.keys(t.SETTING_CHOICES))if(c!=='preset'&&R()<.7)s[c]=pick(t.SETTING_CHOICES[c]);
   if(R()<.6){s.w=R()*1100;s.h=R()*800}if(R()<.6)s.holdings=R()*230;const n=N(s),b=t.parseWorldCode(t.worldCode(n));if(J(b)!==J(n))bad.push(J(n))}
  ok(!bad.length,'200 random settings: each code reads back to its settings, byte for byte (so the same world)'+(bad.length?': '+bad[0]:''));
  const edit=t.parseWorldCode('ASH1-N-ZZZZZZZZ-mine');
  ok(t.parseWorldCode('redwater')===null&&t.parseWorldCode('ASH1-Q-12-x')===null&&t.parseWorldCode('')===null&&(edit===null||J(t.normSettings(edit))===J(edit)),'not a code: null (a seed, an unknown preset); a hand-edited one clamped or refused');
  ok(J(t.parseWorldCode(t.worldCode(t.classicSettings({monsters:'deadly'}))))===J(t.classicSettings({monsters:'deadly'}))&&/^ASH1-C-/.test(t.worldCode(t.classicSettings())),'Classic\'s code: '+t.worldCode(t.classicSettings())+', its free settings kept')}
 // ---- the quick sketch: fast, the same twice, the real coast at its points
 {const sk=t.genSketch({preset:'normal',seed:'s1'}),sk2=t.genSketch({preset:'normal',seed:'s1'}),m=sk.map;
  ok(m.w===256&&m.h===183&&J(Array.from(m.kind))===J(Array.from(sk2.map.kind))&&J(Array.from(m.river))===J(Array.from(sk2.map.river))&&J(sk.holdings)===J(sk2.holdings),'the sketch: '+m.w+' x '+m.h+' cells ('+sk.k.toFixed(2)+' tiles a cell), the same twice');
  const r=t.genWorld({preset:'normal',seed:'s1'}),M=r.map;let same=0,land=0,clim=0;
  for(let i=0;i<m.w*m.h;i++){const x=Math.floor((i%m.w+.5)*sk.k),y=Math.floor(((i-i%m.w)/m.w+.5)*sk.k),j=y*M.w+x,a=m.kind[i]===t.T_WATER,b=M.kind[j]===t.T_WATER&&!(M.river[j]&3);if(a===b)same++;if(!a&&!b){land++;if(m.clim[i]===M.clim[j])clim++}}
  const caps=sk.holdings.filter(h=>h.kind==='city');
  ok(same/(m.w*m.h)>=.9,'its coast is the real one\'s: land and water agree at '+(same*100/(m.w*m.h)).toFixed(1)+'% of its points (90% at least)');
  info('Normal s1: climates agree on '+(clim*100/land).toFixed(0)+'% of the land both call land; the sketch '+sk.holdings.length+' holdings ('+caps.length+' capitals), '+sk.rivers+' rivers, '+(sk.land*100).toFixed(0)+'% land; the world '+r.holdings.length+' holdings, '+t.wsRivers(M)+' rivers of 30 tiles or more');
  ok(clim/land>=.6&&caps.length===5&&new Set(caps.map(h=>h.realm)).size===5&&sk.holdings.length>=r.map.settings.holdings*.8&&sk.holdings.every(h=>m.kind[h.ty*m.w+h.tx]!==t.T_WATER),'its climates mostly the real ones (60%), a capital per realm, about as many holdings as asked, each on land');
  const times=[];for(const p of ['normal','large','huge']){t.genSketch({preset:p,seed:'warm'});let best=1e9;for(let k=0;k<2;k++){const s=t.genSketch({preset:p,seed:'s'+k});best=Math.min(best,s.ms)}times.push(p+' '+best.toFixed(0)+' ms')}
  info('the sketch\'s time (the best of two; the target 150 ms): '+times.join(', '));
  ok(times.every(s=>parseFloat(s.split(' ')[1])<400),'the sketch is quick at every size: '+times.join(', ')+' (under 400 ms in the test browser)')}
 // ---- the New game page: with WORLD.gen a past leads to the world's settings
 t.act('menu','new');const cards=[...document.querySelectorAll('#panel [data-act="begin"]')].map(b=>b.dataset.arg);
 ok(cards.length===7&&cards.every(a=>t.WORLD.gen?/^world:/.test(a):!/^world:/.test(a)),'New game: seven pasts; '+(t.WORLD.gen?'each opens the world\'s settings first (D30)':'each starts at once (the flag off: today\'s map)'));
 // ---- the screen
 t.act('race','dwarf');t.act('begin','world:hedge');
 {const nb=[...document.querySelectorAll('#panel .nav [data-nav]')].map(b=>b.dataset.nav+':'+b.textContent);
  ok(G.mode==='title'&&G.menu==='world'&&/New world/.test(txt())&&/Dwarf · Hedge mage/.test(txt())&&J(nb)===J(['back:Back','close:Forge the world'])&&q('.ws-cv')&&q('.ws-cv').width>2,'the New world screen: its header, the preview drawn, Back on the left and Forge the world on the right ('+nb.join(', ')+')')}
 t.act('ws-preset','classic');
 {const s=S.s,dis=n=>q('[data-act="'+n.split(' ')[0]+'"]'+(n.split(' ')[1]?'[data-arg="'+n.split(' ')[1]+'"]':'')).disabled;
  ok(s.preset==='classic'&&s.seed==='CLASSIC'&&q('#wsSeed').disabled&&dis('ws-size large')&&dis('ws-dens more')&&dis('ws-random')&&!dis('ws-forge'),'Classic: its seed, size and holdings locked (greyed)');
  t.act('ws-adv');const free=['monsters:deadly','bandits:many','start:settler'].every(a=>!dis('ws-set '+a)),locked=['wild:vast','climate:warm','economy:rich'].every(a=>dis('ws-set '+a));
  t.act('ws-set','monsters:deadly');t.act('ws-set','climate:warm');t.act('ws-size','huge');t.act('ws-hold','1');
  ok(free&&locked&&S.s.preset==='classic'&&S.s.monsters==='deadly'&&S.s.climate==='temperate'&&S.s.w===448&&S.s.holdings===37,'Classic: only monsters, bandits and start stay open (§4.2); the rest refused');
  t.wsPreview(true);ok(/holdings/.test(q('.ws-counts').textContent)&&/ringed/.test(q('.ws-cap').textContent),'its preview: '+q('.ws-cap').textContent+'; '+q('.ws-counts').textContent+'; '+q('.ws-time').textContent);
  t.act('ws-set','monsters:normal')}
 t.act('ws-preset','normal');
 {const s=S.s;ok(s.preset==='normal'&&s.seed&&s.seed!=='CLASSIC'&&s.holdings===27&&s.w===448&&!q('#wsSeed').disabled&&q('#wsSeed').value===s.seed,'Normal: a fresh seed ('+s.seed+'), 448 x 320, 27 holdings')}
 {t.act('ws-reroll');const k1=t.wsMapKey(S.s),before=S.pics[k1];await new Promise(r=>setTimeout(r,S.wait+100));
  ok(!before&&S.pics[k1]&&S.last===S.pics[k1]&&S.s.seed,'Reroll: a new seed ('+S.s.seed+'), the preview redrawn '+S.wait+' ms after the change, the last picture shown meanwhile')}
 t.act('ws-size','large');ok(S.s.w===640&&S.s.h===448&&S.s.holdings===40&&S.s.preset==='large','a Large size at the normal density is the Large preset (40 holdings)');
 t.act('ws-dens','more');ok(S.s.holdings===55&&S.s.preset==='custom'&&q('[data-act="ws-dens"][data-arg="more"]').classList.contains('on'),'More: 55 holdings; touching a setting makes it Custom');
 t.act('ws-dens','fewer');t.act('ws-hold','1');ok(S.s.holdings===33&&!q('[data-act="ws-dens"].on'),'Fewer (32), then + one: 33, a number of its own');
 t.wsChange({holdings:999});const n1=S.note;t.act('ws-set','wild:vast');const n2=S.note;
 ok(/up to 110/.test(n1)&&S.s.holdings===82&&/Vast wild land/.test(n2),'live clamps with a note: 999 asked, "'+n1+'"; then Vast wild land, "'+n2+'"');
 t.act('ws-set','wild:normal');t.act('ws-size','custom');const w0=S.s.w;t.act('ws-w','1');
 ok(q('[data-act="ws-w"]')&&S.s.w===w0+32&&S.s.preset==='custom','Custom: width and height with − and + ('+S.s.w+' x '+S.s.h+')');
 for(let k=0;k<20;k++)t.act('ws-w','1');ok(S.s.w<=1024&&S.s.w*S.s.h<=786432,'the width stops at its limit ('+S.s.w+' x '+S.s.h+')');
 // a seed typed, a code pasted
 {const i=q('#wsSeed');i.value='  mymap ';i.dispatchEvent(new Event('input',{bubbles:true}));
  ok(S.s.seed==='mymap'&&q('.ws-code b').textContent===t.worldCode(S.s),'a seed typed: '+S.s.seed+', its code at once');
  const code=t.worldCode(N({preset:'frontier',seed:'redwater'})),i2=q('#wsSeed');i2.value=code;i2.dispatchEvent(new Event('input',{bubbles:true}));
  ok(J(S.s)===J(N({preset:'frontier',seed:'redwater'}))&&/World code read/.test(txt()),'a world code pasted in the seed: every setting from it (Wild Frontier, redwater)')}
 // Esc follows the bar: Back to the New game page; the choice kept
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));
 ok(G.menu==='new'&&S.s.preset==='frontier','Esc: Back to the New game page, the world\'s choice kept');
 // ---- the full preview, reused by the forge; a seeded start
 t.act('begin','world:soldier');t.act('ws-preset','normal');{const i=q('#wsSeed');i.value='s2';i.dispatchEvent(new Event('input',{bubbles:true}))}
 t.act('ws-full');await t.LOADING.task;const fr=S.full&&S.full.r;
 ok(fr&&fr.map.settings.seed==='s2'&&q('.ws-cap').textContent.startsWith('The world itself')&&q('[data-act="ws-full"]').disabled,'Full preview: the real world made ('+(fr?fr.holdings.length+' holdings':'none')+'), the preview its map');
 {const g0=window.genWorldSteps;let calls=0;window.genWorldSteps=s=>{calls++;return g0(s)};
  try{Math.random=t.seeded(1);t.act('ws-forge')}finally{window.genWorldSteps=g0;Math.random=r0}
  G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  ok(t.WM===(fr&&fr.map)&&!calls&&t.WM.settings.seed==='s2'&&!S.full,'Forge the world uses the full preview\'s world, not made again')}
 const snap=()=>J({sites:W.sites.map(s=>[s.type,s.tx,s.ty,s.seed]),bands:t.bandits.map(b=>[b.kind,b.n,Math.round(b.x),Math.round(b.y)]),beasts:W.monsters.map(m=>[m.id,m.lv,m.n,Math.round(m.x),Math.round(m.y)]),herds:W.critters.map(c=>[c.id,c.n,Math.round(c.x),Math.round(c.y)])});
 const begin=(st,seed)=>{Math.random=t.seeded(seed);try{t.begin('soldier',st)}finally{Math.random=r0}G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();return {s:snap(),game:t.Rng.game}};
 {const st=N({preset:'normal',seed:'s2'}),a=begin(st,11),b=begin(st,12),c=begin(t.classicSettings(),11),d=begin(t.classicSettings(),12);
  ok(a.s===b.s&&a.game!==b.game&&JSON.parse(a.s).bands.length>0&&JSON.parse(a.s).herds.length>0,'a generated world starts as its seed says: the same sites, bands, beasts and herds from two games ('+JSON.parse(a.s).sites.length+' sites, '+JSON.parse(a.s).bands.length+' bands, '+JSON.parse(a.s).beasts.length+' beasts, '+JSON.parse(a.s).herds.length+' herds); each game its own number for what happens in play');
  ok(c.s!==d.s,'the classic world starts as ever: its bands and beasts from the game (two games, two starts)')}
 // ---- the Esc menu's World page, the save line
 {G.mode='world';G.modal=false;t.hidePanel();window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));t.act('esc-wpage');
  const s=t.WM.settings,nb=[...document.querySelectorAll('#panel .nav [data-nav]')].map(b=>b.dataset.nav);
  ok(G.mode==='esc'&&/World code/.test(txt())&&txt().includes(t.worldCode(s))&&t.WS_SET.every(([,n])=>txt().includes(n))&&J(nb)===J(['back','close']),'the Esc menu\'s World page: the world code ('+t.worldCode(s)+'), every setting, Back and Resume');
  t.act('esc-back');ok(G.mode==='esc'&&/Paused/.test(txt()),'Back: the Esc menu');t.act('esc-resume')}
 ok(t.worldLine(N({preset:'large',seed:'redwater'}))==='Redwater · Large · seed redwater · '&&t.worldLine(t.classicSettings())==='Ashmark · Classic · '&&/^Mine · Custom 512 × 352 · seed mine · $/.test(t.worldLine(N({preset:'custom',seed:'mine',w:512,h:352}))),
  'the save list\'s line: '+t.worldLine(N({preset:'large',seed:'redwater'}))+'| '+t.worldLine(t.classicSettings())+'| '+t.worldLine(N({preset:'custom',seed:'mine',w:512,h:352})));
}catch(e){r.exc(e)}r.out()};
