'use strict';
/* ---------- a world's settings (doc/WORLD_DESIGN.md §4, §15.2.1): the generator's one input (worldgen.js genWorld). Every value is
   clamped first (normSettings), and the clamped settings are what is stored (WM.settings, the save's world.map) and hashed
   (settingsKey, in WM.sum): the same settings and seed make the same world, byte for byte, in every browser. normSettings never
   reads the device (Huge on a phone is the New game screen's note, not a clamp), so one code makes one world everywhere.
   Settings later phases show (hamlets, sacred, wild, sites, start) are stored, clamped and hashed now, and read by nothing yet.
   Seeded and isolated as the generator is (§8.1): no Math.random, no rnd, rint or pick, no Math.hypot, sin, cos, exp, pow, log
   or atan2 (tests/structure.js reads this file's text) ---------- */
// the keys, in their order (settingsKey's)
const SETTING_KEYS=['v','preset','w','h','seed','holdings','hamlets','sacred','wild','land','rivers','mountains','climate','seasonal','monsters','bandits','economy','sites','start'];
// the choices of each setting, its default first-named in SETTING_DEFAULT (§4.1)
const SETTING_CHOICES={
  preset:['classic','normal','large','huge','frontier','crowded','custom'],
  hamlets:['none','few','normal','many'],sacred:['rare','normal','common'],wild:['few','normal','vast'],land:['continent','coasts','sea','lakes'],
  rivers:['dry','normal','wet'],mountains:['flat','normal','rugged'],climate:['cold','temperate','warm'],seasonal:[true,false],
  monsters:['calm','normal','deadly'],bandits:['few','normal','many'],economy:['poor','normal','rich'],sites:['few','normal','many'],start:['wanderer','settler']
};
const SETTING_DEFAULT={hamlets:'normal',sacred:'normal',wild:'normal',land:'coasts',rivers:'normal',mountains:'normal',climate:'temperate',seasonal:true,
  monsters:'normal',bandits:'normal',economy:'normal',sites:'normal',start:'wanderer'};
/* the limits (§4.1, §4.5): w, h (tiles) in steps of step, w ÷ h within aspect, tiles at most (Huge, on every device: D44);
   holdings at least min, at most by the map's area (max: [tiles, holdings] points, linear between, the first below), x wild with
   Vast wild land, x sea with More sea, floored; the seed text cut to seed characters */
const WORLD_LIMITS={w:[320,1024],h:[224,768],step:32,aspect:[1.2,1.6],tiles:786432,seed:24,
  holdings:{min:25,max:[[143360,60],[286720,110],[786432,200]],def:[[143360,37],[286720,55],[786432,90]],wild:.75,sea:.85}};
/* the presets (§4.2): each fills every setting; touching one afterwards makes it custom (the screen's). Classic: seed CLASSIC at
   Normal, today's holdings as anchors (§8.15), every map setting locked to its default: only monsters, bandits and start free */
const WORLD_PRESETS={
  classic:{w:448,h:320,seed:'CLASSIC',holdings:37},
  normal:{w:448,h:320,holdings:37},
  large:{w:640,h:448,holdings:55},
  huge:{w:1024,h:768,holdings:90},
  frontier:{w:640,h:448,holdings:38,hamlets:'few',sacred:'common',wild:'vast',land:'continent',rivers:'wet',mountains:'rugged',climate:'cold',monsters:'deadly',bandits:'many',economy:'rich',sites:'many'},
  crowded:{w:448,h:320,holdings:55,hamlets:'many',wild:'few',monsters:'calm',sites:'few'}
};
// (the settings Classic leaves free)
const CLASSIC_FREE=['monsters','bandits','start'];
// a preset's settings, whole (custom: Normal's), before clamping
function defaultSettings(preset){if(!WORLD_PRESETS[preset]&&preset!=='custom')preset='normal';
  return{v:1,preset,seed:'',...SETTING_DEFAULT,...(WORLD_PRESETS[preset]||WORLD_PRESETS.normal)}}
// (a value of a [tiles, value] table at n tiles: linear between its points, the first below them, the last above)
function areaTable(T,n){if(n<=T[0][0])return T[0][1];for(let i=1;i<T.length;i++)if(n<=T[i][0]){const [a,u]=T[i-1],[b,v]=T[i];return u+(v-u)*(n-a)/(b-a)}return T[T.length-1][1]}
// the most holdings a map of these settings takes (§4.1): by its area, fewer with Vast wild land or More sea
function maxHoldings(s){const L=WORLD_LIMITS.holdings;return Math.floor(areaTable(L.max,s.w*s.h)*(s.wild==='vast'?L.wild:1)*(s.land==='sea'?L.sea:1))}
/* the settings clamped (§4.5): unknown keys dropped, unknown choices their default, numbers into their ranges, Classic's locks;
   normSettings(normSettings(s)) equals normSettings(s) */
function normSettings(s){
  s=s&&typeof s==='object'?s:{};const L=WORLD_LIMITS,preset=SETTING_CHOICES.preset.includes(s.preset)?s.preset:'custom',D=defaultSettings(preset),o={v:1,preset};
  const num=(v,d)=>typeof v==='number'&&isFinite(v)?v:typeof v==='string'&&v.trim()!==''&&isFinite(+v)?+v:d,step=v=>Math.round(v/L.step)*L.step;
  for(const k in SETTING_CHOICES)if(k!=='preset')o[k]=SETTING_CHOICES[k].includes(s[k])?s[k]:D[k];
  // size: each side clamped and stepped, then the height moved into the aspect's range, then the area capped
  let w=step(clamp(num(s.w,D.w),L.w[0],L.w[1])),h=step(clamp(num(s.h,D.h),L.h[0],L.h[1]));
  const h0=Math.max(L.h[0],Math.ceil(w/L.aspect[1]/L.step)*L.step),h1=Math.min(L.h[1],Math.floor(w/L.aspect[0]/L.step)*L.step);h=clamp(h,h0,h1);
  while(w*h>L.tiles)h-=L.step;o.w=w;o.h=h;
  o.seed=String(s.seed==null?D.seed:s.seed).trim().slice(0,L.seed);
  // Classic: its size, seed and holdings, every map setting its default
  if(preset==='classic'){const C=WORLD_PRESETS.classic;Object.assign(o,{w:C.w,h:C.h,seed:C.seed});for(const k in SETTING_DEFAULT)if(!CLASSIC_FREE.includes(k))o[k]=SETTING_DEFAULT[k]}
  // holdings: the preset's at its size, else by the area (as the presets' are); Classic's 37
  const hd=Math.floor(num(s.holdings,preset!=='custom'&&o.w===D.w&&o.h===D.h?D.holdings:Math.round(areaTable(L.holdings.def,o.w*o.h))));
  o.holdings=preset==='classic'?WORLD_PRESETS.classic.holdings:clamp(hd,L.holdings.min,maxHoldings(o));
  const out={};for(const k of SETTING_KEYS)out[k]=o[k];return out}
// the settings as one text: equal for equal clamped settings (the world's key: WM.sum, world reuse, the save)
function settingsKey(s){return s?JSON.stringify(SETTING_KEYS.map(k=>normSettings(s)[k])):''}
// the classic world's settings (o: its free ones, monsters, bandits and start)
function classicSettings(o){return normSettings({...(o||{}),preset:'classic'})}
// a seed text as 32 bits: FNV-1a over its characters
function seedNum(text){let h=2166136261;text=String(text);for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;return h}
