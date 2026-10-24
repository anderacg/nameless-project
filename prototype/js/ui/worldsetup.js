'use strict';
/* ---------- the New world screen (doc/WORLD_DESIGN.md §4, D4, D26-D30): after your race and your past (ui.js New
   game: a past's card names 'world:<past>', session.js begin), the world's settings, then "Forging the world…". A window in the
   frame rule:
     header: New world, your race and past;
     left (it scrolls): the presets; the seed (typed, Random; a world code typed or pasted in sets everything: parseWorldCode) and
       the world code with Copy; the size (Normal, Large, Huge, Custom: width and height with − and +); the holdings (Fewer,
       Normal, More: worldsettings.js HOLDING_DENSITY, or a number with − and +); the Advanced fold-out (every other setting).
       Classic locks all but monsters, bandits and your start (greyed). Every change clamped at once (normSettings), a note where
       a limit moved a value or why it stops there;
     right: the preview: the quick sketch (worldgen.js genSketch), redrawn WSETUP.wait ms after a change, or the real map when it
       is made (the world in); your start city ringed; the counts, the time it takes to forge
       here. (No buttons there, the owner 2026-10-22: Random is the seed's own; Enter in the seed redraws the sketch.)
     bottom bar: Back (the New game page) on the left, Forge the world on the right. Esc: Back.
   WSETUP keeps the choice while the page is open (a fresh seed each New game); begin reads it (newWorldSettings) */
const WSETUP={past:null,s:null,typed:null,adv:false,custom:false,full:null,note:'',timer:0,wait:200,pics:{},last:null,
  // (saves cannot be gzipped here (save.js SAVE_ZIP): nothing over Large's tiles, D8)
  zipless:286720,
  // (the forging time at each size on a typical desktop, ms, and this device's measure against it, stored once one is made)
  time:[[143360,2000],[286720,4500],[786432,12000]]};
// the settings' names and their choices' names, in the fold-out's order (the free ones: CLASSIC_FREE; later: shown, kept, read by
// nothing yet)
const WS_SET=[['hamlets','Hamlets',{none:'None',few:'Few',normal:'Normal',many:'Many'}],['sacred','Sacred places',{rare:'Rare',normal:'Normal',common:'Common'}],
  ['wild','Wild land',{few:'Few',normal:'Normal',vast:'Vast'}],['land','Land and water',{continent:'Continent',coasts:'Coasts',sea:'More sea',lakes:'Lakes'}],
  ['rivers','Rivers',{dry:'Dry',normal:'Normal',wet:'Wet'}],['mountains','Mountains',{flat:'Flat',normal:'Normal',rugged:'Rugged'}],
  ['climate','Climate',{cold:'Cold',temperate:'Temperate',warm:'Warm'}],['seasonal','Seasonal rivers',{true:'On',false:'Off'}],
  ['monsters','Monsters',{calm:'Calm',normal:'Normal',deadly:'Deadly'}],['bandits','Bandits',{few:'Few',normal:'Normal',many:'Many'}],
  ['economy','Economy',{poor:'Poor',normal:'Normal',rich:'Rich'}],['sites','Founding sites',{few:'Few',normal:'Normal',many:'Many'}],
  ['start','Start',{wanderer:'Wanderer',settler:'Settler'}]];
const WS_LATER=['hamlets','sacred','wild','sites','start'];
const WS_PRESET={classic:['Classic','The world of Ashmark, the same for everyone. Only monsters, bandits and your start can change.'],
  normal:['Normal','A new world at Normal size, every setting at its default.'],large:['Large','A wider world: more room, more holdings.'],
  huge:['Huge','The largest world. Sparse until later phases fill it.'],frontier:['Wild Frontier','Large and cold, rugged and wet: few holdings, deadly beasts, many bandits, rich land.'],
  crowded:['Crowded Realms','Normal size, half as many holdings again, calm beasts.'],custom:['Custom','Your own mix of settings.']};
const WS_SIZE={normal:[448,320],large:[640,448],huge:[1024,768]};
// a fresh seed: two words (crypto.getRandomValues: never Math.random)
const SEED_A=['red','ash','iron','oak','frost','stone','wolf','raven','amber','thorn','elder','storm','salt','moon','gold','black','silver','high','deep','wild','briar','cold','dusk','fern','grey','hawk','mist','pine','rook','sun','west','yew'],
  SEED_B=['water','fell','ford','mere','wood','vale','crest','hollow','brook','gate','moor','reach','field','marsh','barrow','haven','spire','fen','dale','watch','holm','stead','wick','burn','combe','tor','ness','ley','mouth','shaw','well','by'];
const freshSeed=()=>{const r=crypto.getRandomValues(new Uint32Array(1))[0];return SEED_A[r&31]+SEED_B[r>>>5&31]};
// (a phone: a coarse pointer, the short side of the screen under 900 px: Huge is slow to forge there, D44)
const phoneSlow=()=>matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<900;
// the settings the screen holds, clamped (Classic by default); a world with no seed gets a fresh one
function newWorldSettings(){const S=WSETUP;if(!S.s)S.s=classicSettings();if(!S.s.seed)S.s=normSettings({...S.s,seed:freshSeed()});
  if(!SAVE_ZIP&&S.s.w*S.s.h>S.zipless)S.s=classicSettings();return S.s}
// (a new visit to New game: the same choice, a fresh seed for a world of its own)
function worldSetupFresh(){const S=WSETUP;S.typed=null;S.note='';if(S.s&&S.s.preset!=='classic')S.s=normSettings({...S.s,seed:freshSeed()})}
// the preset these settings are (one whose every setting they share), else custom; Classic stays Classic
function wsPreset(s){if(s.preset==='classic')return s;
  const p=Object.keys(WORLD_PRESETS).find(p=>p!=='classic'&&SETTING_KEYS.every(k=>['v','preset','seed'].includes(k)||normSettings(defaultSettings(p))[k]===s[k]));
  return normSettings({...s,preset:p||'custom'})}
// a change asked for: the settings clamped, a note where a limit moved what was asked
function wsChange(o,why){const S=WSETUP,want={...S.s,...o};let s=wsPreset(normSettings(want));
  if(!SAVE_ZIP&&s.w*s.h>S.zipless){while(s.w*s.h>S.zipless&&s.h>WORLD_LIMITS.h[0])s=normSettings({...s,h:s.h-WORLD_LIMITS.step});why='saves here cannot be packed small: up to Large'}
  S.note=want.holdings!=null&&s.holdings!==+want.holdings&&s.preset!=='classic'?'Holdings '+s.holdings+': '+(s.holdings>+want.holdings?'25 at least, 5 a realm':'up to '+maxHoldings(s)+' for this land'+(s.wild==='vast'||s.land==='sea'?' (less with '+(s.wild==='vast'?'Vast wild land':'More sea')+')':''))+'.':
    want.w!=null&&(s.w!==+want.w||s.h!==+want.h)?'Size '+s.w+' × '+s.h+': '+(why||'width '+WORLD_LIMITS.w.join('–')+', height '+WORLD_LIMITS.h.join('–')+', width ÷ height '+WORLD_LIMITS.aspect.join('–'))+'.':'';
  S.s=s;S.full=S.full&&S.full.key===settingsKey(s)?S.full:null}
// the screen (past: the past chosen on the New game page)
function worldSetup(past){if(!BGS[past])return false;const S=WSETUP;S.past=past;newWorldSettings();G.mode='title';G.menu='world';wsRender();wsPreview(true);return true}
function wsRender(focus){const S=WSETUP,s=S.s,cl=s.preset==='classic',D=s.w*s.h,sc=panel.querySelector('.ws-set'),top=sc?sc.scrollTop:0;
  const chip=(act,arg,label,on,dis)=>'<button class="btn sm'+(on?' on':'')+'" type="button" data-act="'+act+'" data-arg="'+arg+'" aria-pressed="'+!!on+'"'+(dis?' disabled':'')+'>'+label+'</button>';
  const step=(act,v,lo,hi,dis)=>'<span class="ws-num"><button class="btn sm" type="button" data-act="'+act+'" data-arg="-1" aria-label="Fewer"'+(dis||v<=lo?' disabled':'')+'>−</button><b>'+v+'</b><button class="btn sm" type="button" data-act="'+act+'" data-arg="1" aria-label="More"'+(dis||v>=hi?' disabled':'')+'>+</button></span>';
  const size=Object.keys(WS_SIZE).find(z=>WS_SIZE[z][0]===s.w&&WS_SIZE[z][1]===s.h)||'custom',L=WORLD_LIMITS,dens=cl?null:densityOf(s),mx=maxHoldings(s),big=D>S.zipless;
  const sizes=['normal','large','huge'].map(z=>chip('ws-size',z,WS_PRESET[z][0],size===z&&!S.custom,cl||z==='huge'&&!SAVE_ZIP)).join('')+chip('ws-size','custom','Custom',size==='custom'||S.custom,cl);
  const adv=WS_SET.map(([k,n,C])=>'<div class="ws-row"><span class="ws-k">'+n+(WS_LATER.includes(k)?' <small>later</small>':'')+'</span><span class="tabs" role="group" aria-label="'+n+'">'+
    SETTING_CHOICES[k].map(v=>chip('ws-set',k+':'+v,C[v],s[k]===v,cl&&!CLASSIC_FREE.includes(k))).join('')+'</span></div>').join('');
  showPanel('<div class="top"><h2>New world</h2><span class="muted">'+RACES[G.race||'human'].n+' · '+BGS[S.past].n+'</span></div><div class="ws">'+
    '<div class="ws-set"><div class="lab">Preset</div><div class="tabs" role="group" aria-label="Preset">'+Object.keys(WORLD_PRESETS).map(p=>chip('ws-preset',p,WS_PRESET[p][0],s.preset===p,p==='huge'&&!SAVE_ZIP)).join('')+
      (s.preset==='custom'?chip('ws-preset','custom','Custom',true,true):'')+'</div><p class="muted">'+WS_PRESET[s.preset][1]+'</p>'+
    '<div class="lab">Seed</div><div class="ws-line"><input id="wsSeed" class="ws-seed" type="text" maxlength="60" autocomplete="off" spellcheck="false" aria-label="Seed or world code" placeholder="a word, or a world code" value="'+htmlText(S.typed!=null?S.typed:s.seed)+'"'+(cl?' disabled':'')+'>'+
      '<button class="btn sm" type="button" data-act="ws-random"'+(cl?' disabled':'')+'>Random</button></div>'+
    '<div class="ws-line ws-code"><span>World code <b>'+htmlText(worldCode(s))+'</b></span><button class="btn sm" type="button" data-act="ws-copy">Copy</button></div>'+
    '<div class="lab">Size</div><div class="tabs" role="group" aria-label="Size">'+sizes+'</div>'+
    (size==='custom'||S.custom?'<div class="ws-line">Width '+step('ws-w',s.w,L.w[0],L.w[1],cl)+' Height '+step('ws-h',s.h,L.h[0],L.h[1],cl)+'</div>':'')+
    '<p class="muted">'+s.w+' × '+s.h+' tiles'+(big&&phoneSlow()?' · slow to forge on this device':'')+(s.w>=1024?' · sparse until later':'')+'</p>'+
    '<div class="lab">Holdings</div><div class="ws-line"><span class="tabs" role="group" aria-label="Holdings">'+Object.keys(HOLDING_DENSITY).map(d=>chip('ws-dens',d,d[0].toUpperCase()+d.slice(1),dens===d,cl)).join('')+'</span>'+step('ws-hold',s.holdings,L.holdings.min,mx,cl)+'</div>'+
    '<p class="muted">'+(cl?'Today\'s 37, at their places.':'25 to '+mx+' for this land, shared among the five realms'+(s.wild==='vast'||s.land==='sea'?' (fewer with '+(s.wild==='vast'?'Vast wild land':'More sea')+')':'')+'.')+'</p>'+
    (S.note?'<p class="gold ws-note">'+S.note+'</p>':'')+
    '<button class="btn sm ws-adv" type="button" data-act="ws-adv" aria-expanded="'+S.adv+'">Advanced '+(S.adv?'▾':'▸')+'</button>'+
    (S.adv?'<div class="ws-advs">'+adv+'<p class="muted">Settings marked later come with later phases: they are kept in the world code now.</p></div>':'')+'</div>'+
    '<div class="ws-view"><canvas class="ws-cv" width="2" height="2" aria-label="The world, seen from above"></canvas><p class="muted ws-cap"></p>'+
      '<p class="ws-counts"></p><p class="muted ws-time"></p></div></div>'+
    nav(['ws-back',null,'Back'],['ws-forge',null,'Forge the world']));
  panel.classList.add('wide','wsp');const sc2=panel.querySelector('.ws-set');if(sc2)sc2.scrollTop=top;
  if(focus){const b=panel.querySelector(focus);if(b&&!b.disabled)b.focus({preventScroll:true})}
  wsPreview()}
// the map these settings make, as a key: their own (settingsKey) but for the free settings (monsters, bandits, start), which
// change nothing on the map
const wsMapKey=s=>settingsKey({...s,...Object.fromEntries(CLASSIC_FREE.map(k=>[k,SETTING_DEFAULT[k]]))});
// the real world with the map of these settings, when one is made: the full preview, else the world in ({map, holdings})
function wsReal(s){const S=WSETUP,k=wsMapKey(s);if(S.full&&wsMapKey(S.full.r.map.settings)===k)return S.full.r;
  return WM&&wsMapKey(WM.settings)===k?{map:WM,holdings:WM.first?WM.first.towns.map(t=>JSON.parse(t)):TOWNS}:null}
// the full preview's world, for begin: once (it becomes the world in)
function worldPreviewTake(s){const S=WSETUP,r=S.full&&S.full.key===settingsKey(s)?S.full.r:null;if(r)S.full=null;return r}
// the preview: a picture of the real world or the sketch, the holdings over it, your start city ringed; the caption, the counts
// and the time. One already made is drawn at once; a new one is made now when asked (now), else WSETUP.wait ms after the last
// change, the last picture shown meanwhile
function wsPreview(now){const S=WSETUP;clearTimeout(S.timer);const cv=panel.querySelector('.ws-cv');if(!cv||G.menu!=='world')return;const s=S.s,key=wsMapKey(s);
  let p=S.pics[key];if(!p&&!now){if(S.last)wsDraw(cv,S.last,s);S.timer=setTimeout(()=>wsPreview(true),S.wait);return}
  if(!p){const real=wsReal(s);p=real?wsPic(real.map,real.holdings,Math.max(2,Math.ceil(real.map.w/256)),true):wsPicSketch(genSketch(s));S.pics={[key]:p}}
  S.last=p;wsDraw(cv,p,s)}
function wsDraw(cv,p,s){const S=WSETUP;
  cv.width=p.pic.width*2;cv.height=p.pic.height*2;const g=cv.getContext('2d', { willReadFrequently: true });g.imageSmoothingEnabled=false;g.drawImage(p.pic,0,0,cv.width,cv.height);
  const race=G.race||'human',fs=Object.keys(FACS).filter(f=>FACS[f].races.includes(race)),home=fs.find(f=>FACS[f].races.length===1)||fs[0];
  for(const h of p.holdings){const x=Math.round(h.x*2),y=Math.round(h.y*2),r=h.kind==='city'?3:2;g.fillStyle='#07090e';g.fillRect(x-r-1,y-r-1,r*2+3,r*2+3);g.fillStyle=FACS[h.realm]?FACS[h.realm].col:'#ccc';g.fillRect(x-r,y-r,r*2+1,r*2+1)}
  const st=p.holdings.find(h=>h.kind==='city'&&h.realm===home);
  if(st){const x=Math.round(st.x*2),y=Math.round(st.y*2);g.lineWidth=2;g.strokeStyle='#07090e';g.strokeRect(x-9,y-9,19,19);g.strokeStyle='#fff';g.strokeRect(x-7,y-7,15,15)}
  const q=s=>panel.querySelector(s);
  const cap=q('.ws-cap');cap.textContent=cap.title=(p.real?'The world itself':'Sketch: mountains, rivers and holdings approximate')+' · your start ringed';
  q('.ws-counts').textContent=(p.real?'':'About ')+p.holdings.length+' holdings · '+p.rivers+' rivers · '+Math.round(p.land*100)+'% land';
  q('.ws-time').textContent=WM&&settingsKey(WM.settings)===settingsKey(s)?'Ready: it is the world in now.':S.full&&S.full.key===settingsKey(s)?'Ready: Forge the world uses this one.':'Forging it takes about '+wsTime(s)+' s here.'}
// (a made world's picture: worldgen's map at 1 px per k tiles (map.js fullMapPic, all of it seen, no realms' tint), its holdings)
function wsPic(m,hs,k,real){const N=m.w*m.h,seen=new Uint8Array(N).fill(1),land=new Int8Array(N).fill(-1),pic=fullMapPic(m,k,seen,land,[]);let L=0;for(let i=0;i<N;i++)if(m.kind[i]!==T_WATER)L++;
  return{pic,real,map:m,holdings:hs.map(h=>({x:(h.tx+.5)/k,y:(h.ty+.5)/k,realm:h.realm||h.owner,kind:h.kind})),rivers:real?wsRivers(m):0,land:L/N}}
// (a made world's rivers of GEN_SKETCH.river tiles and more, as the sketch counts them)
const wsRivers=m=>(m.rivers||[]).filter(r=>r.path.length>=GEN_SKETCH.river).length;
function wsPicSketch(r){const p=wsPic(r.map,r.holdings,1,false);p.rivers=r.rivers;p.land=r.land;return p}
// the seconds forging these settings takes here: the desktop's at its size, times this device's measure
function wsTime(s){let f=1;try{f=+localStorage.getItem('ashmark.forgerate')||1}catch(e){}return Math.max(1,Math.round(areaTable(WSETUP.time,s.w*s.h)*clamp(f,.2,10)/1000))}
// (a world made in ms here: this device's measure kept, a convenience: session.js begin, the full preview)
function forgeTimed(s,ms){if(!(ms>0&&isFinite(ms)))return;try{localStorage.setItem('ashmark.forgerate',String(Math.round(ms/areaTable(WSETUP.time,s.w*s.h)*100)/100))}catch(e){}}
// the seed typed: a world code sets everything; else the seed (empty: a fresh one when you forge or regenerate)
function wsTyped(v){const S=WSETUP,c=parseWorldCode(v);if(c){S.typed=null;S.s=c;S.note='World code read: '+WS_PRESET[c.preset][0]+', '+c.w+' × '+c.h+', seed '+c.seed+'.';wsRender('#wsSeed');return}
  S.typed=v;const t=v.trim().slice(0,WORLD_LIMITS.seed);if(!t)return;S.s=normSettings({...S.s,seed:t});S.full=null;const b=panel.querySelector('.ws-code b');if(b)b.textContent=worldCode(S.s);wsPreview()}
// (the seed field, read once more: empty, a fresh seed)
function wsSeedNow(){const S=WSETUP;if(S.typed!=null&&!S.typed.trim()){S.s=normSettings({...S.s,seed:freshSeed()});S.typed=null}else S.typed=null}
onAct('ws-',(a,arg)=>{const S=WSETUP;if(G.menu!=='world'||!S.s)return;const s=S.s,cl=s.preset==='classic',f='[data-act="'+a+'"]'+(arg!=null?'[data-arg="'+arg+'"]':'');
  if(a==='ws-back'){clearTimeout(S.timer);return showTitle('new')}
  if(a==='ws-forge'){clearTimeout(S.timer);wsSeedNow();return begin(S.past,S.s)}
  if(a==='ws-copy'){const c=worldCode(s);copyText(c).then(ok=>{if(G.menu!=='world')return;S.note=ok?'World code '+c+' copied.':'Could not copy it: the code is '+c+'.';wsRender(f)});return}
  if(a==='ws-adv'){S.adv=!S.adv;return wsRender(f)}
  if(a==='ws-preset'&&WS_PRESET[arg]&&arg!=='custom'){S.custom=false;S.typed=null;S.note='';S.s=arg==='classic'?classicSettings():normSettings({...defaultSettings(arg),seed:cl||!s.seed?freshSeed():s.seed});S.full=null;return wsRender(f)}
  if(a==='ws-set'){const [k,v0]=String(arg).split(':'),v=k==='seasonal'?v0==='true':v0;if(!SETTING_CHOICES[k]||cl&&!CLASSIC_FREE.includes(k))return;wsChange({[k]:v});return wsRender(f)}
  if(cl)return;// (the rest change the map: Classic keeps them)
  if(a==='ws-random'){S.typed=null;wsChange({seed:freshSeed()});return wsRender(f)}
  if(a==='ws-regen'){wsSeedNow();S.pics={};wsRender(f);return wsPreview(true)}
  if(a==='ws-size'){const z=WS_SIZE[arg],d=densityOf(s)||'normal';S.custom=arg==='custom';if(!z)return wsRender(f);const o={w:z[0],h:z[1]};o.holdings=densityHoldings({...s,...o},d);wsChange(o);return wsRender(f)}
  if(a==='ws-w'||a==='ws-h'){const k=a==='ws-w'?'w':'h',d=densityOf(s),o={[k]:s[k]+(+arg)*WORLD_LIMITS.step};
    if(d)o.holdings=densityHoldings(normSettings({...s,...o}),d);S.custom=true;wsChange(o);return wsRender(f)}
  if(a==='ws-dens'&&HOLDING_DENSITY[arg]){wsChange({holdings:densityHoldings(s,arg)});return wsRender(f)}
  if(a==='ws-hold'){wsChange({holdings:s.holdings+(+arg)});return wsRender(f)}
});
// the seed field: typing (input), Enter (Regenerate), Esc (out of the field: the next Esc goes Back)
panel.addEventListener('input',e=>{if(e.target&&e.target.id==='wsSeed')wsTyped(e.target.value)});
panel.addEventListener('keydown',e=>{if(!e.target||e.target.id!=='wsSeed')return;if(e.key==='Enter'){e.preventDefault();act('ws-regen')}else if(e.key==='Escape')e.target.blur()});
/* the World page (the Esc menu's: ui.js): the world in use, its name, preset, seed and world code (Copy), every setting, and
   what it holds now */
function worldPage(){const m=WM,s=m.settings,n=m.first?m.first.towns.length:TOWNS.length,row=(k,v)=>'<div class="ws-row"><span class="ws-k">'+k+'</span><span>'+v+'</span></div>';
  let L=0;for(let i=0;i<m.kind.length;i++)if(m.kind[i]!==T_WATER)L++;
  return '<div class="ws-page">'+row('World',htmlText(worldName(m))+' · '+WS_PRESET[s.preset][0])+row('Seed','<b>'+htmlText(s.seed)+'</b>')+
    '<div class="ws-row"><span class="ws-k">World code</span><span class="ws-line"><b>'+htmlText(worldCode(s))+'</b><button class="btn sm" type="button" data-act="esc-code">Copy</button></span></div>'+
    row('Size',s.w+' × '+s.h+' tiles')+row('Holdings',n+(n!==s.holdings?' ('+s.holdings+' asked: too few fitted)':''))+
    WS_SET.map(([k,name,C])=>row(name,C[s[k]]+(WS_LATER.includes(k)?' <small class="muted">later</small>':''))).join('')+
    row('Now',wsRivers(m)+' rivers · '+(m.crossings||[]).length+' crossings · '+CAMP_SPOTS.length+' camps · '+Math.round(L*100/m.kind.length)+'% land')+'</div>'}
