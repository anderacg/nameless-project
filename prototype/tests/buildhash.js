'use strict';
// Building hashes: every PX.building, PX.site and PX.camp the engine draws stays pixel for pixel what it was when the building
// code was split into its shared kit (engine/buildkit.js, the world-map building redesign's step 1: a refactor, byte-identical).
// Recorded at the base commit f08c720, before the split. Each type is drawn for every people, 8 seeds, and a set of variants:
// the seed's own pick, each view and facing, end-on and not, levels 2 and 3, fortification 0-3, snow and each climate, stilts;
// sites in each climate (rock, snow, glow), camps with and without a flag. Hashed: every byte of img and shadow, and the result's
// fields (w, h, ax, ay, tiles, facing, view, deep, clipped, gateX, flag, fire). One INFO line a type (to diff a change against),
// PASSed against its constant in EXPECT. Hash: FNV-1a 32-bit.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
const EXPECT={// (at f08c720)
 cottage:'d3e169d3',townhouse:'0ec95f91',fisherhut:'b2db6b93',chapel:'a8df4427',stall:'6a08cea5',tower:'96acf1e0',yurt:'2d1865dd',
 longhouse:'5c4ea416',tavern:'b2c24b6c',smithy:'6e15f9f8',church:'3c6d47dd',barn:'46d28aa3',granary:'d5c4d311',windmill:'84db36bb',
 watermill:'c5e2e626',warehouse:'1889d768',gatehouse:'981b295d',hidehall:'803883c5',watchtower:'26bf581a',treehouse:'27bdd3c1',
 elfhall:'88cda18f',spire:'97720bed',stonehall:'4d99f299',forge:'90139ae7',keep:'9d2e1c0d',citadel:'0055b83e',well:'fcc6a4cd',
 tent:'711a895d',wagon:'cdb3073d',minehead:'adae26cd',lumbershed:'ede91035',crane:'03c4f725',village:'ff234dee',
 'site:cave':'6c928795','site:ruins':'60daee81','site:shrine':'562b6fc5','site:hideout':'47086745','site:travelers':'2dc725c5',camps:'3865f509'};
try{
 const fnv=()=>{let h=2166136261;const H={b(a){for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619)>>>0;return H},s(x){x=String(x);for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619)>>>0;return H},get x(){return h.toString(16).padStart(8,'0')}};return H};
 const px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
 const add=(H,b)=>{H.b(px(b.img));if(b.shadow)H.b(px(b.shadow));H.s(JSON.stringify([b.w,b.h,b.ax,b.ay,b.tiles,b.facing,b.view,b.deep,b.clipped,b.gateX,b.flag,b.fire,b.img.width,b.img.height]))};
 const STYLES=['human','dwarf','elf','orc'],SEEDS=[1,2,3,5,8,13,21,34],DEEP=['longhouse','barn','warehouse','hidehall','elfhall','stonehall'];
 const VARS=[{},{facing:'left'},{facing:'right'},{facing:'front'},{view:'top'},{view:'angled'},{lv:2},{lv:3},{lv:3,facing:'left'},{lv:2,view:'top'},
  {fort:0,view:'top'},{fort:1},{fort:2,view:'top'},{fort:3},{snow:true,env:'frost'},{env:'desert'},{env:'swamp',stilts:true},{banner:'#c84040',fort:1,facing:'left'}];
 const got={},t0=performance.now();let n=0;
 for(const type of PX.BUILDING_TYPES){const H=fnv();
  for(const style of STYLES)for(const seed of SEEDS)for(const v of VARS.concat(DEEP.includes(type)?[{deep:true},{deep:false},{deep:true,lv:3,fort:1}]:[])){add(H,PX.building({type,style,seed,...v}));n++}
  got[type]=H.x}
 for(const type of PX.SITE_TYPES){const H=fnv();
  for(const style of STYLES)for(const seed of SEEDS)for(const env of ['grass','frost','desert','swamp'])for(const v of [{},{snow:env==='frost',mat:{grass:'rock',frost:'frostrock',desert:'sandrock',swamp:'darkrock'}[env],glow:env==='desert'?'#e8c040':'#7fd8e8',banner:'#4a72b0'}]){add(H,PX.site({type,style,seed,env,...v}));n++}
  got['site:'+type]=H.x}
 {const H=fnv();for(const kind of ['bandit','hideout','travelers'])for(const seed of SEEDS.concat([77,131*3+7]))for(const banner of [undefined,'#c84040']){add(H,PX.camp({kind,seed,banner}));n++}got['camps']=H.x}
 const ms=performance.now()-t0,keys=Object.keys(got),bad=keys.filter(k=>EXPECT[k]&&EXPECT[k]!==got[k]),miss=keys.filter(k=>!EXPECT[k]);
 for(const k of keys)info(k+' '+got[k]+(EXPECT[k]&&EXPECT[k]!==got[k]?' (was '+EXPECT[k]+')':''));
 info(n+' pictures hashed in '+Math.round(ms)+' ms');
 ok(!miss.length,'a recorded hash for every type, site and the camps'+(miss.length?': none for '+miss.join(', '):''));
 ok(!bad.length,keys.length+' kinds ('+n+' pictures): every building, site and camp is pixel for pixel as recorded at f08c720'+(bad.length?': changed '+bad.join(', '):''));
}catch(e){o.push('EXC '+e.message+'\n'+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
