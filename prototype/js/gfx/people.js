'use strict';
/* ---------- people and troops, drawn from one template (the style of the Basic Humanoid II pack): a figure about 10×15 in a 16×16
   cell, a 5-wide rounded head looking the way it faces, the arms inside the body's outline, a dark navy outline round the
   silhouette, the pack's own colours. Every soldier is the template in its kind's colours (PEOPLE_LOOK) with a helm, its gear
   (a weapon, a shield, a quiver) drawn apart from its anchors (figures.js), and one of six variants (skin, hair, beard, a helm for
   the plain troops, a shade of cloth) so a line of them is not one man copied. Riders sit on a mount of their race (horse, stag, ram, wolf) in a 32×32 cell, the same rider above the belt.
   Poses as before (sprites.js): 0-1 standing, 2-5 walking, then a swing, a thrust and an overhead blow of three frames each,
   15-18 running, 19-22 climbing a slope and 23-26 coming down one (render.js). ---------- */
// the template: hair 1 2 3, skin s x t u, eyes e, the outer garment a b c d, the front (the side's colour) p q r, under-tunic n o,
// belt and skirt k l, legs L M, feet F. The outline is added after
const PEOPLE_T=[
  '................',
  '......112.......',
  '.....12232......',
  '.....2s3s3......',
  '.....1sexe......',
  '.....1ttxt......',
  '.....12uu2......',
  '....a2pqq2d.....',
  '...abpqqrcd.....',
  '...bcpnnrcd.....',
  '...bspnnrsd.....',
  '...bcqoorcd.....',
  '...bckllkcd.....',
  '.....LL.LM......',
  '.....F...F......',
  '................'];
// a dwarf: the same, a row shorter in the body
const PEOPLE_T_SHORT=PEOPLE_T.filter((r,i)=>i!==9);
const PEOPLE_OUT='#1a1c26',PEOPLE_SCAR='#c06a5a';
// the pack's palette by material, light to dark
const PPAL={
  skin:['#edd1d6','#f3bfad','#de9e8c','#c58faa'],skinTan:['#f0c8a0','#d9a07a','#b87a58','#8e5a4a'],skinDark:['#c8906a','#a06a4a','#7a4a32','#5a3424'],
  elf:['#f6e6e6','#f0d0c8','#dcb0a8','#b8909a'],dwarf:['#f0c0a0','#e09a80','#c07868','#8e5050'],
  orc:['#c8e888','#9ccc5a','#6a9a3a','#4a6a2a'],orcDark:['#a8c870','#7aa848','#527a30','#36541e'],orcGrey:['#b8c8a0','#8aa078','#62785a','#44543e'],
  blond:['#faf8db','#f3e7a8','#dab580','#b3794d'],brown:['#cb804a','#a15735','#682a19','#4a1c10'],ginger:['#fea464','#fc6a08','#ba3900','#7e0e13'],
  black:['#67656d','#3d3f4b','#2e3038','#27272c'],grey:['#ffffff','#dacdc1','#b3a49a','#8f8685'],silver:['#ffffff','#e0e6ee','#abb6c4','#7e8896'],
  olive:['#ebe185','#beb050','#8e8e37','#5d6527'],teal:['#86f1d6','#4ddbc2','#30b3a7','#238585'],steel:['#ffffff','#abd5da','#6e95a9','#5a748d'],
  iron:['#a0a8b8','#6e7890','#4e5468','#383c4c'],violet:['#a5a4d0','#888cbc','#7270ab','#575191'],gold:['#ffdc04','#ffc02a','#cd7900','#ae5800'],
  wood:['#cb804a','#a15735','#682a19','#4a1c10'],leather:['#cb804a','#a15735','#682a19','#402830'],fur:['#d8c098','#a88a60','#7a6040','#4e3c28'],
  cloth:['#e7d494','#cea65f','#9c8850','#6f4d2b'],linen:['#f0ead8','#d8cdb4','#b0a488','#857a62'],dark:['#44563e','#37403c','#404945','#27272c'],
  white:['#faf8db','#dacdc1','#b3a49a','#75776c'],purple:['#dfb2c6','#9b6aa2','#6a4a8a','#3a2a5a'],forest:['#8cd590','#4a9a5a','#2e6a40','#1e4a2e'],
  rust:['#e0905a','#b8603a','#8a3a24','#5a2418'],
  blue:['#a9d4fb','#398dd5','#3056ac','#353287'],red:['#ea7e82','#c74453','#aa1e42','#891a37'],
  horse:['#cb804a','#a15735','#682a19','#4a1c10'],chestnut:['#e0905a','#b8603a','#7a3a1e','#4e2412'],horseW:['#faf8db','#dacdc1','#b3a49a','#75776c'],
  horseB:['#67656d','#3d3f4b','#27272c','#1a1c26'],horseG:['#d8dce6','#a8aebc','#7e8494','#565a68'],stag:['#e8b880','#c08a52','#8a5a30','#5a381c'],
  wool:['#ffffff','#ece4d4','#c8bca8','#948a78'],fleece:['#f4eee0','#dcd2bc','#b0a488','#7e735c'],wolf:['#c8ccd4','#9aa0ac','#6a707e','#454a56'],warg:['#7a7480','#56505e','#3a3642','#26222c']
};
const PEOPLE_EYE='#9ee4ef';
// each race: its skins, its hair, its eyes; a variant v (0-5) takes one of each
const RACE_LOOK={
  human:{skin:['skin','skinTan','skin','skinDark','skin','skinTan'],hair:['brown','blond','black','ginger','brown','grey'],eye:PEOPLE_EYE},
  elf:{skin:['elf'],hair:['blond','silver','blond','brown','silver','blond'],eye:'#a8f0c8',ears:true},
  dwarf:{skin:['dwarf','skinTan','dwarf'],hair:['ginger','brown','black','grey','ginger','blond'],eye:PEOPLE_EYE,short:true,beard:true},
  orc:{skin:['orc','orcDark','orcGrey'],hair:['black','black','brown','black','grey','black'],eye:'#ffdc04',tusk:true}
};
/* each kind's look: helm (cap, kettle, great, plume, horned, hood, wizard, crown, circlet, skull, bare), outer (the garment's
   material), inner, weapon (sword, great, dagger, axe, bigaxe, hammer, spear, pike, javelin, bow, longbow, xbow, sling, staff,
   lance), shield (its material), robe, cape, mount (horse, stag, ram, wolf, warg), plain: its helm and cloth vary by variant */
const PEOPLE_LOOK={
  militia:{helm:'cap',outer:'leather',weapon:'sword',plain:true},spearman:{helm:'kettle',outer:'steel',weapon:'spear',shield:'wood'},
  archer:{helm:'hood',hood:'olive',outer:'olive',weapon:'bow'},ranger:{helm:'hood',hood:'forest',outer:'forest',weapon:'longbow',cape:'forest'},
  horse:{helm:'kettle',outer:'steel',weapon:'lance',mount:'horse'},chief:{helm:'horned',outer:'fur',weapon:'bigaxe',race:'human'},
  brann:{helm:'bare',outer:'fur',weapon:'bigaxe',hair:'ginger',beard:'ginger'},elske:{helm:'bare',outer:'white',inner:'linen',weapon:'staff',robe:true,hair:'blond',hood:'white'},
  tavi:{helm:'hood',hood:'forest',outer:'forest',weapon:'bow',hair:'brown'},ander:{helm:'bare',outer:'dark',inner:'leather',weapon:'sword',cape:'dark',hair:'black',scar:true},
  hum_levy:{helm:'cap',outer:'leather',weapon:'spear',plain:true},hum_spear:{helm:'kettle',outer:'steel',weapon:'spear',shield:'wood'},
  hum_guard:{helm:'great',outer:'steel',weapon:'sword',shield:'steel'},hum_pike:{helm:'kettle',outer:'steel',weapon:'pike'},
  hum_bow:{helm:'hood',hood:'olive',outer:'leather',weapon:'bow',plain:true},hum_long:{helm:'hood',hood:'forest',outer:'forest',weapon:'longbow',cape:'forest'},
  hum_squire:{helm:'kettle',outer:'steel',weapon:'lance',mount:'horse'},hum_knight:{helm:'plume',outer:'steel',weapon:'lance',mount:'horse',barded:true,cape:true},
  dw_clan:{helm:'cap',outer:'leather',weapon:'axe',plain:true},dw_axe:{helm:'horned',outer:'steel',weapon:'axe'},
  dw_iron:{helm:'great',outer:'iron',weapon:'hammer',shield:'iron'},dw_berserk:{helm:'bare',outer:'skin',inner:'leather',weapon:'bigaxe'},
  dw_sling:{helm:'cap',outer:'leather',weapon:'sling',plain:true},dw_xbow:{helm:'kettle',outer:'steel',weapon:'xbow'},
  dw_ram:{helm:'horned',outer:'steel',weapon:'axe',mount:'ram'},dw_ramlord:{helm:'great',outer:'iron',weapon:'hammer',mount:'ram',barded:true},
  elf_glade:{helm:'hood',hood:'teal',outer:'olive',weapon:'sword',plain:true},elf_dancer:{helm:'bare',outer:'teal',weapon:'sword'},
  elf_blade:{helm:'circlet',outer:'teal',weapon:'great',cape:'teal'},elf_sentinel:{helm:'great',outer:'silver',weapon:'spear',shield:'silver'},
  elf_archer:{helm:'bare',outer:'olive',weapon:'bow'},elf_marks:{helm:'hood',hood:'teal',outer:'teal',weapon:'longbow'},
  elf_sharp:{helm:'circlet',outer:'silver',weapon:'longbow',cape:'teal'},elf_hart:{helm:'circlet',outer:'olive',weapon:'spear',mount:'stag'},
  elf_lance:{helm:'great',outer:'silver',weapon:'lance',mount:'stag',barded:true},
  orc_grunt:{helm:'bare',outer:'leather',weapon:'axe',plain:true},orc_brute:{helm:'horned',outer:'rust',weapon:'bigaxe'},
  orc_ironjaw:{helm:'great',outer:'iron',weapon:'bigaxe',shield:'iron'},orc_reaver:{helm:'bare',outer:'skin',inner:'rust',weapon:'great'},
  orc_thrower:{helm:'bare',outer:'leather',weapon:'javelin'},orc_hunter:{helm:'hood',hood:'leather',outer:'leather',weapon:'bow'},
  orc_wolf:{helm:'bare',outer:'leather',weapon:'spear',mount:'wolf'},orc_warg:{helm:'horned',outer:'rust',weapon:'axe',mount:'warg'},
  hum_mage:{helm:'wizard',outer:'violet',weapon:'staff',robe:true,beard:'grey',hair:'grey'},dw_rune:{helm:'horned',outer:'gold',weapon:'staff',robe:true},
  elf_weaver:{helm:'circlet',outer:'teal',weapon:'staff',robe:true},orc_shaman:{helm:'skull',outer:'fur',weapon:'staff',robe:true},
  hum_foot:{helm:'cap',outer:'cloth',weapon:'sword',shield:'wood',plain:true},hum_sword:{helm:'kettle',outer:'steel',weapon:'sword',shield:'steel'},
  hum_sergeant:{helm:'plume',outer:'steel',weapon:'sword',shield:'steel',cape:true},hum_champ:{helm:'great',outer:'steel',weapon:'great'},
  hum_xbow:{helm:'kettle',outer:'leather',weapon:'xbow'},hum_crossbow:{helm:'cap',outer:'leather',weapon:'xbow',plain:true},hum_lancer:{helm:'kettle',outer:'leather',weapon:'lance',mount:'horse'},hum_hbow:{helm:'hood',hood:'olive',outer:'leather',weapon:'bow',mount:'horse'},
  dw_shield:{helm:'cap',outer:'leather',weapon:'hammer',shield:'wood',plain:true},dw_hammer:{helm:'kettle',outer:'steel',weapon:'hammer',shield:'iron'},
  dw_longbeard:{helm:'great',outer:'gold',weapon:'hammer',shield:'gold',beard:'grey'},dw_thane:{helm:'horned',outer:'iron',weapon:'hammer',cape:true},
  elf_spear:{helm:'hood',hood:'teal',outer:'olive',weapon:'spear',shield:'wood'},elf_eternal:{helm:'circlet',outer:'teal',weapon:'spear',shield:'silver'},
  elf_phoenix:{helm:'great',outer:'gold',weapon:'spear',shield:'gold',cape:'teal'},elf_hartbow:{helm:'hood',hood:'forest',outer:'forest',weapon:'bow',mount:'stag'},
  orc_shield:{helm:'bare',outer:'leather',weapon:'axe',shield:'wood',plain:true},orc_warrior:{helm:'horned',outer:'rust',weapon:'axe',shield:'iron'},
  orc_black:{helm:'great',outer:'iron',weapon:'axe',shield:'iron',cape:true},orc_wolfbow:{helm:'bare',outer:'leather',weapon:'bow',mount:'wolf'},
  mage:{helm:'wizard',outer:'violet',weapon:'staff',robe:true,beard:'grey',hair:'grey'},hedge:{helm:'hood',hood:'brown',outer:'cloth',weapon:'staff',robe:true}
};
// the plain troops' helms and cloth by variant (the rest wear their kind's)
const PLAIN_HELM=['cap','bare','cap','hood','kettle','bare'],PLAIN_CLOTH=['leather','cloth','leather','linen','leather','cloth'];
// a colour's own ramp (a companion's gear, a hero's armour: their colour)
const rampOf=c=>[shade(c,1.3),c,shade(c,.75),shade(c,.55)];
const pal=k=>Array.isArray(k)?k:PPAL[k]||(typeof k==='string'&&k[0]==='#'?rampOf(k):PPAL.leather);

/* the grid: a canvas-free picture we draw into, then outline, then make a canvas of */
const pgrid=(w,h)=>({w,h,p:new Array(w*h).fill(null)});
const pset=(g,x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<g.w&&y<g.h)g.p[y*g.w+x]=c||null};
const pget=(g,x,y)=>x>=0&&y>=0&&x<g.w&&y<g.h?g.p[y*g.w+x]:null;
// (a paper doll's body (g.body: its pixels, dollfigs.js) wears no outline: only what is not the body is outlined. With the dolls'
// edge (DOLL_FIGS.edge, the owner's reference: no outline anywhere), the rest wears none either: its own pixels at its silhouette's
// edge a shade darker (DOLL_FIGS.edgeK), the body's untouched: a figure with a doll's body (g.body), or a mount drawn alone (g.edge))
// (no pinholes (the owner, 2026-11-07: "fix any weird transparent pixel"): a gap of up to 3 px shut in by the figure, left where
// two parts meet, takes the colour most of its neighbours share (never an eye copied, which stands alone))
function pfillHoles(g){const w=g.w,h=g.h,seen=new Uint8Array(w*h),q=[];for(let i=0;i<w*h;i++){if(seen[i]||g.p[i])continue;const R=[];let open=false;q.push(i);seen[i]=1;
    while(q.length){const j=q.pop(),x=j%w,y=(j/w)|0;R.push(j);if(x===0||y===0||x===w-1||y===h-1)open=true;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const k=Y*w+X;if(!seen[k]&&!g.p[k]){seen[k]=1;q.push(k)}}}
    if(!open&&R.length<=3)for(const j of R){const x=j%w,y=(j/w)|0,n=new Map();let best=null,bn=0;for(const c of [pget(g,x-1,y),pget(g,x+1,y),pget(g,x,y+1),pget(g,x,y-1)])if(c){const k=(n.get(c)||0)+1;n.set(c,k);if(k>bn){bn=k;best=c}}g.p[j]=best}}}
// (nothing loose (the owner, 2026-11-07: "recheck any weird distorted pixels"): a piece of up to 8 px cut off from the figure, a hand
// or a far arm a pixel or two from its body, joined to it along the shortest way in the piece's own colour; one of 2 px or less
// farther than 3 px away dropped)
function pjoin(g){const w=g.w,h=g.h,id=new Int32Array(w*h).fill(-1),C=[];for(let i=0;i<w*h;i++){if(id[i]>=0||!g.p[i])continue;const q=[i],P=[];id[i]=C.length;
    while(q.length){const j=q.pop(),x=j%w,y=(j/w)|0;P.push(j);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const k=Y*w+X;if(id[k]<0&&g.p[k]){id[k]=C.length;q.push(k)}}}C.push(P)}
  if(C.length<2)return;const main=C.reduce((a,b)=>b.length>a.length?b:a);
  for(const P of C){if(P===main||P.length>8)continue;let best=null,bd=1e9;for(const j of P)for(const k of main){const d=Math.max(Math.abs(j%w-k%w),Math.abs((j/w|0)-(k/w|0)));if(d<bd){bd=d;best=[j,k]}}
    if(bd<=3){const [j,k]=best,c=g.p[j],x0=k%w,y0=k/w|0,x1=j%w,y1=j/w|0;for(let s=1;s<bd;s++){const x=Math.round(x0+(x1-x0)*s/bd),y=Math.round(y0+(y1-y0)*s/bd);if(!g.p[y*w+x]){g.p[y*w+x]=c;if(g.body)g.body.add(y*w+x)}}}
    else if(P.length<=2)for(const j of P)g.p[j]=null}}
// (the blended outline (the owner, 2026-11-07: "the outline should blend with the sprite, a darker shade of it"): a deep shade of
// the figure's own colour (engine/pixel.js PX.rim, DOLL_FIGS.rimK dark))
// (inside the figure, not round it (the owner, 2026-11-07: "a bit too big", "floating"): the figure's own edge pixels the outline,
// so it is no bigger than drawn and stands where it stood; natural, not square: a line a pixel thin (a shaft, a staff, a tail's tip)
// left as drawn, the lit side's edge (top, left) a lighter shade (rimLit) than the shaded side's (rimK); the picture's edge (feet on
// its last row) no edge)
function prim(g){const w=g.w,h=g.h,hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)],R=[],op=(x,y)=>x<0||y<0||x>=w||y>=h||!!g.p[y*w+x],
    clr=(x,y)=>!op(x,y),thin=(x,y)=>clr(x-1,y)&&clr(x+1,y)||clr(x,y-1)&&clr(x,y+1);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=g.p[y*w+x];if(!c||c[0]!=='#'||c.length!==7||thin(x,y))continue;const lit=clr(x-1,y)||clr(x,y-1),dark=clr(x+1,y)||clr(x,y+1);
    if(lit||dark)R.push([y*w+x,PX.rim([hx(c)],dark&&!lit?DOLL_FIGS.rimK:DOLL_FIGS.rimLit)])}
  for(const [i,c] of R)g.p[i]='#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')}
function poutline(g){const B=g.body,on=(x,y)=>!!pget(g,x,y)&&!(B&&B.has(y*g.w+x));
  if(DOLL_FIGS.on&&DOLL_FIGS.edge&&(B||g.edge)){pfillHoles(g);if(DOLL_FIGS.rim){prim(g);pfillHoles(g)}else{const e=[];for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){if(!on(x,y))continue;if(!pget(g,x-1,y)||!pget(g,x+1,y)||!pget(g,x,y-1)||!pget(g,x,y+1))e.push([x,y])}
    for(const [x,y] of e){const c=pget(g,x,y);if(c&&c[0]==='#'&&c.length===7)pset(g,x,y,PX.shade(c,DOLL_FIGS.edgeK))}}return}
  const o=[];for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++)if(!pget(g,x,y)&&(on(x-1,y)||on(x+1,y)||on(x,y-1)||on(x,y+1)))o.push([x,y]);for(const [x,y] of o)pset(g,x,y,PEOPLE_OUT)}
// (the grid turned a quarter clockwise, pixel for pixel: what stood up now lies, head to the right)
function pturn(g){const r=pgrid(g.h,g.w);if(g.body)r.body=new Set();for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const c=g.p[y*g.w+x];if(!c)continue;const j=x*r.w+(g.h-1-y);r.p[j]=c;if(g.body&&g.body.has(y*g.w+x))r.body.add(j)}return r}
// (g's part from (x0, y0), w × h, as a grid of its own; ptop: g's first row with a pixel, g.h if none)
const pcrop=(g,x0,y0,w,h)=>{const r=pgrid(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)r.p[y*w+x]=pget(g,x0+x,y0+y);return r};
const ptop=g=>{const i=g.p.findIndex(c=>c);return i<0?g.h:Math.floor(i/g.w)};
function pcanvas(g){return mkc(g.w,g.h,x=>{for(let y=0;y<g.h;y++)for(let i=0;i<g.w;i++){const c=g.p[y*g.w+i];if(c){x.fillStyle=c;x.fillRect(i,y,1,1)}}})}

// a soldier's whole look: its kind's, its race's, its variant's; the hero's and a companion's from their gear
function lookOf(type,team,hero,v,cid,cg){
  const st=ST[type],race=hero?P.race:(st&&st.race)||(PEOPLE_LOOK[type]&&PEOPLE_LOOK[type].race)||'human',R=RACE_LOOK[race]||RACE_LOOK.human;
  let L=hero?{helm:'bare',outer:'leather',inner:'linen',armor:'leather',weapon:'sword'}:PEOPLE_LOOK[cid||type]||PEOPLE_LOOK[st&&st.look]||PEOPLE_LOOK.militia;
  L={...L};v=v||0;
  const o={race,skin:R.skin[v%R.skin.length],hair:L.hair||R.hair[v%R.hair.length],eye:R.eye,ears:R.ears,tusk:R.tusk,short:R.short,
    beard:L.beard||(R.beard?(L.hair||R.hair[v%R.hair.length]):race==='human'&&!hero&&v%3===1&&!L.robe?R.hair[v%R.hair.length]:null),
    helm:L.helm,hood:L.hood,outer:L.outer==='skin'?R.skin[v%R.skin.length]:L.outer,inner:L.inner||'dark',team:team?'red':'blue',weapon:L.weapon,shield:L.shield,
    robe:L.robe,cape:L.cape,mount:L.mount,barded:L.barded,shortHair:v%2===0,scar:L.scar,armor:hero?L.armor:st?armorOf(st):'none'};
  if(L.plain){o.helm=race==='orc'&&PLAIN_HELM[v]==='hood'?'bare':PLAIN_HELM[v];o.outer=PLAIN_CLOTH[v]}
  if(o.mount==='horse')o.mountC=L.barded?'horseW':['horse','chestnut','horseB','horse','horseG','chestnut'][v];
  // your hero: your race, your weapon, your armour and helm as you wear them
  if(hero||cg){const hk=hero?heroKind():cg&&cg.weapon?ITEMS[cg.weapon].kind||'melee':null,hw=hero&&P.gear.weapon?ITEMS[P.gear.weapon]:cg&&cg.weapon?ITEMS[cg.weapon]:null;
    // (a crossbow its own look, and so its own shot: the reload a crossbow's, battle/actors.js shotKind; the owner, 2026-11-01)
    if(hk==='ranged')o.weapon=hw&&(hw.base==='crossbow'||hw.shot?.flat)?'xbow':'bow';else if(hk==='magic')o.weapon='staff';
    else if(hero&&unarmed())o.weapon=null;// (bare hands: combat.js FISTS)
    else if(hw)o.weapon=hw.base==='spear'||hw.tag==='spear'?'spear':hw.base==='warhammer'||hw.icon==='club'?'hammer':hw.base==='dagger'||hw.icon==='dagger'?'dagger':hw.base==='axe'||hw.icon==='axe'?'axe':hw.base==='great'||hw.base==='greatsword'?'great':'sword';
    const body=hero?P.gear.body:cg&&cg.body,head=hero?P.gear.head:cg&&cg.head,lg=hero?P.gear.legs:cg&&cg.legs,ft=hero?P.gear.feet:cg&&cg.feet;
    // (what is worn on the legs and the feet: a rider's seated leg shows them, RIDER_LEG)
    if(lg&&ITEMS[lg]&&ITEMS[lg].col)o.legsC=ITEMS[lg].col;if(ft&&ITEMS[ft]&&ITEMS[ft].col)o.feetC=ITEMS[ft].col;
    // (the owner, 2026-11-07: "hero sprite looks weird": what he wears as it is: a mail or plate coat mail, a coat or vest a tunic, in the
    // item's colour; a helm worn a helm in its colour; nothing worn, a leather jerkin, his head bare (the owner: "no need the crown"))
    if(body&&ITEMS[body]&&ITEMS[body].col){const bi=ITEMS[body];o.outer=bi.col;o.armor=bi.base==='mail'||bi.icon==='plate'?'mail':'leather'}
    if(head&&ITEMS[head]&&ITEMS[head].col){o.helm='kettle';o.helmC=ITEMS[head].col}
    // (a shield in the off hand shows, slung on his arm: drawn only, offShield (his kind's o.shield is what CharacterMind reads))
    const off=hero?P.gear.offhand:cg&&cg.offhand,oi=off&&ITEMS[off];if(oi&&oi.icon==='shield')o.offShield=oi.col||'wood'}
  // (no cape (the owner, 2026-11-07: "please remove cape"); his head a crop and an eye: "revise head")
  if(hero){o.cape=false;o.beard=null;o.hair=R.hair[0];o.tabard=false;o.sleeves=true;o.hairStyle='crop';o.dollEye=true}
  return o;
}
// the letters' colours for a look
function lettersOf(o){
  const H=pal(o.hair),S=pal(o.skin),A=pal(o.outer),T=pal(o.team),I=pal(o.inner),K=PPAL.leather,Lg=pal(o.legs||'leather');
  return {'1':H[0],'2':H[2],'3':H[3],s:S[1],x:S[0],t:S[2],u:S[3],e:o.eye||PEOPLE_EYE,a:A[0],b:A[1],c:A[2],d:A[3],p:T[0],q:T[1],r:T[2],n:I[0],o:I[1],k:K[0],l:K[1],L:Lg[1],M:Lg[2],F:Lg[3]};
}
// the legs as it walks: [left leg x, right leg x, left foot x, right foot x] for each of the four strides
const STRIDE=[[4,9,4,10],[5,8,5,8],[5,9,5,9],[6,8,6,8]];
// running (walk 4-7): a long stride, a moment off the ground, the body leaning forward and bouncing
const STRIDE_RUN=[[3,10,2,11],[5,8,5,9],[4,9,3,11],[6,7,6,8]],RUN_BOB=[0,-2,0,-1];
// climbing a slope (walk 8-11): bent forward, short steps, the front knee lifted every other frame, a small bob; descending (walk
// 12-15): the head forward, long steps, sinking a little (render.js picks them from the ground's climbState)
const STRIDE_CLIMB=[[5,8,5,9],[5,9,5,10],[5,8,5,9],[4,9,4,10]],CLIMB_BOB=[0,-1,0,0],STRIDE_DESC=[[4,9,3,10],[5,8,5,9],[3,10,3,11],[6,8,6,8]],DESC_BOB=[0,0,1,0];
/* a figure into grid g at (ox, oy): its body (on foot a paper doll: dollfigs.js), then its gear from the body's anchors (figures.js
   FigureRig). walk: -1 or 0-3; atk:
   -1 or 0-2 with style; cut: only the rows down to it (a rider). Returns its anchors (drawFigureBody's) */
function drawFigure(g,o,ox,oy,walk,style,atk,cut){if(dollable(o))return drawDollFigure(g,o,ox,oy,walk,style,atk,cut);const A=drawFigureBody(g,o,ox,oy,walk,style,atk,cut);FigureRig.dress(g,o,A,style,atk);return A}
/* a figure's body into grid g at (ox, oy): the template, its legs, cape, beard, helm and limbs, no gear. Returns its anchors, in
   g's pixels (its gear is drawn from them: figures.js): hand, the weapon hand (weapons.js holds a weapon there); off, the shield
   arm (a shield slung there, its top left); guard, a shield raised before him, over his front (its top left); back, between the
   shoulders; free, the off hand (a marcher's torch: marchgear.js); sh, a dwarf's row less; rig, its blow drawn on the rig */
function drawFigureBody(g,o,ox,oy,walk,style,atk,cut){
  const run=walk>=4&&walk<8,climb=walk>=8&&walk<12,desc=walk>=12,T=o.short?PEOPLE_T_SHORT:PEOPLE_T,Lc=lettersOf(o),sh=o.short?1:0,shield=shieldLook(o);
  const bob=run?RUN_BOB[walk-4]:climb?CLIMB_BOB[walk-8]:desc?DESC_BOB[walk-12]:walk===1||walk===3||walk===-2?-1:0,lean=run?9:desc?6:0;
  // (climbing: bent double, the head two pixels forward and the shoulders one, all above the belt a pixel lower)
  // (bare hands: a frame of the rig, FIST_RIG: the head and the body each moved, the arms and legs drawn from their joints)
  // (a weapon held apart (o.held): a frame of BLOW_RIG, the body turning into the blow, its weapon in the fore hand; meeting a blow,
  // the flinch; standing about, a glance back or the weight shifted: NUDGE, the head and the body only)
  const rig=cut==null&&!o.weapon&&!o.mount?FIST_STYLES.includes(style)&&atk>=0?FIST_RIG[style][atk]:o.held&&BLOW_RIG[style]&&atk>=0?blowRig(o,style,atk):style==='flinch'?blowRig(o,style,0):o.guardUp&&!shield?FIST_RIG.guard[0]:null:null,
    nd=!rig&&cut==null&&NUDGE[style],rd=y=>{const R=rig||nd;return !R||y>=13-sh?null:y<7?R.head:R.body};
  // (where a pixel of the template lands: ax, ay; climbing, bent double; else leaning, bobbing, the rig's or a nudge's head and body)
  const ax=climb?(x,y)=>ox+x+(y<6?2:y<9?1:0):(x,y)=>{const d=rd(y);return ox+x+(y<lean?1:0)+(d?d[0]:0)},ay=climb?(x,y)=>oy+y+(y<9?1:0)+(y<13-sh?bob:0):(x,y)=>{const d=rd(y);return oy+y+(y<13-sh?bob:0)+(d?d[1]:0)};
  const set=(x,y,c)=>pset(g,ax(x,y),ay(x,y),c);
  if(rig)rigLimbs(g,o,ox,oy+bob,rig,sh,true);// (an arm behind the body first)
  T.forEach((row,y)=>{if(cut!=null&&y>cut)return;[...row].forEach((c,x)=>{if(c==='.'||c==='L'||c==='M'||c==='F'||rig&&y>=7&&(x<=4||x>=10))return;set(x,y+(o.short&&y>=9?0:0),Lc[c])})});// (rigged: the arms drawn apart)
  const ly=13-sh;
  // legs and feet (by the stride), or a robe to the ground
  // (rigged: its legs drawn with its arms, rigLimbs)
  if(cut==null&&!(rig&&!o.robe)){if(o.robe){for(let x=4;x<=9;x++)set(x,ly,x<6?Lc.b:x<8?Lc.c:Lc.d);set(5,ly+1,Lc.d);set(8,ly+1,Lc.d)}
    else{const s=run?STRIDE_RUN[walk-4]:climb?STRIDE_CLIMB[walk-8]:desc?STRIDE_DESC[walk-12]:STRIDE[walk<0?2:walk],k=climb&&walk&1?1:0;/* (standing or breathing: the standing stride; climbing, the front knee up: k) */
      set(s[0],ly,Lc.L);set(s[0]+1,ly,Lc.L);set(s[1],ly-k,Lc.L);set(s[1]+1,ly-k,Lc.M);set(s[2],ly+1,Lc.F);set(s[3],ly+1-k,Lc.F)}}
  // short hair: off the shoulders
  if(o.shortHair&&!o.robe){set(5,7,Lc.a);set(9,7,Lc.c);set(5,6,Lc.t)}
  if(o.cape){const C=pal(o.cape===true?o.team:o.cape);for(let y=7;y<=12-sh;y++){set(2,y,C[2]);set(3,y,y===7?C[1]:C[2])}set(2,12-sh,C[3])}
  const B=o.beard&&pal(o.beard);
  if(B){set(6,5,B[1]);set(7,5,B[1]);set(8,5,B[0]);set(9,5,B[1]);set(6,6,B[2]);set(7,6,B[1]);set(8,6,B[1]);set(9,6,B[2]);if(o.short){set(7,7,B[2]);set(8,7,B[3])}}
  if(o.ears){set(4,3,Lc.s);set(4,4,Lc.t)}
  if(o.scar){set(6,4,PEOPLE_SCAR);set(6,5,PEOPLE_SCAR)}// (a scar down the cheek: Ander)
  if(o.tusk){set(9,6,'#faf8db');set(7,6,'#faf8db')}
  const M=pal(o.helmC||(o.helm==='great'&&o.outer==='iron'?'iron':'steel')),h=o.helm;
  if(h==='cap'){set(6,1,M[0]);set(7,1,M[1]);set(8,1,M[2]);set(5,2,M[0]);set(6,2,M[1]);set(7,2,M[1]);set(8,2,M[2]);set(9,2,M[3])}
  if(h==='kettle'){set(6,1,M[0]);set(7,1,M[1]);set(8,1,M[2]);for(let x=4;x<=10;x++)set(x,2,x<7?M[1]:x<9?M[2]:M[3])}
  if(h==='great'||h==='plume'){for(let y=1;y<=6;y++)for(let x=5;x<=9;x++)if(!(y===1&&(x===5||x===9)))set(x,y,x<7?M[1]:x<9?M[2]:M[3]);set(6,1,M[0]);set(5,2,M[0]);
    set(7,4,PEOPLE_OUT);set(8,4,PEOPLE_OUT);set(9,4,PEOPLE_OUT);set(8,6,M[3]);if(h==='plume'){set(6,0,PPAL.red[1]);set(7,0,PPAL.red[0]);set(5,0,PPAL.red[2]);set(5,-1,PPAL.red[1])}}
  if(h==='horned'){set(6,1,M[0]);set(7,1,M[1]);set(8,1,M[2]);set(5,2,M[1]);set(6,2,M[1]);set(7,2,M[1]);set(8,2,M[2]);set(9,2,M[3]);set(4,1,PPAL.white[0]);set(4,0,PPAL.white[1]);set(10,1,PPAL.white[2]);set(10,0,PPAL.white[1])}
  if(h==='hood'){const C=pal(o.hood||'olive');for(const [x,y] of [[6,1],[7,1],[8,1],[5,2],[6,2],[7,2],[8,2],[9,2],[5,3],[5,4],[5,5],[5,6],[9,3]])set(x,y,x<7?C[1]:C[2]);set(6,1,C[0]);set(4,6,C[2]);set(4,7,C[3])}
  if(h==='wizard'){const C=pal('purple');for(let x=4;x<=10;x++)set(x,2,x<7?C[1]:C[2]);set(6,1,C[1]);set(7,1,C[1]);set(8,1,C[2]);set(7,0,C[0]);set(8,-1,C[1]);set(5,3,C[2])}
  if(h==='straw'){const C=PPAL.cloth;for(let x=3;x<=11;x++)set(x,2,x<5||x>9?C[2]:x<7?C[0]:C[1]);set(6,1,C[0]);set(7,1,C[1]);set(8,1,C[1]);set(7,0,C[2])}
  if(h==='crown'){set(6,1,PPAL.gold[1]);set(7,1,PPAL.red[1]);set(8,1,PPAL.gold[2]);set(6,0,PPAL.gold[0]);set(8,0,PPAL.gold[1])}
  if(h==='circlet'){set(5,2,PPAL.gold[1]);set(6,2,PPAL.gold[0]);set(7,2,PPAL.teal[0]);set(8,2,PPAL.gold[1]);set(9,2,PPAL.gold[2])}
  if(h==='skull'){const W=PPAL.white;set(6,1,W[0]);set(7,1,W[1]);set(8,1,W[1]);set(5,2,W[1]);set(6,2,PEOPLE_OUT);set(7,2,W[1]);set(8,2,PEOPLE_OUT);set(9,2,W[2])}
  if(h==='bandage'){set(5,3,'#d8d2c4');set(6,3,'#f2efe6');set(7,3,'#f2efe6');set(8,3,'#a8302a');set(9,3,'#d8d2c4')}// (a bandage round the brow, blood on it: one tended on the road, MAP_FIGS)
  if(rig)rigLimbs(g,o,ox,oy+bob,rig,sh,false);
  // (the hand: rigged, the fore fist (the weapon in it); else before the belt, moved with the body as it glances or shifts)
  const f=rig&&o.held&&rig.fore[2],hand=f?[ox+f[0],oy+bob+f[1]-(f[1]>=9?sh:0)]:[ox+11+(nd?nd.body[0]:0),oy+bob+10-sh+(nd?nd.body[1]:0)],gy=o.guardUp==='low'?8:5;
  const fy=FIG_AT.free[1]-sh;
  return{hand,off:[ax(FIG_AT.off[0],FIG_AT.off[1]),ay(FIG_AT.off[0],FIG_AT.off[1])],guard:[ax(10,gy),ay(10,gy)],back:[ax(FIG_AT.back[0],FIG_AT.back[1]),ay(FIG_AT.back[0],FIG_AT.back[1])],free:[ax(FIG_AT.free[0],fy),ay(FIG_AT.free[0],fy)],sh,rig:!!rig};
}
// (the anchors on the template: the shield arm's shield, its top left; the back, between the shoulders; the free (off) hand, the
// far arm's fist on his side)
const FIG_AT={off:[0,8],back:[3,7],free:[4,10]};
// (a figure's shield: its kind's, or the one in your hero's or a companion's off hand: drawn only, CharacterMind reads o.shield)
const shieldLook=o=>o.shield||o.offShield||null;
/* a weapon's blows on the rig (the owner, 2026-10-30: "more alive bodies"; Wave 3): swing, thrust and overhead, three frames each
   (wind-up, strike, follow through), as FIST_RIG's: the body turns back into the wind-up and forward into the strike, the knees
   bend and the front foot steps in (the back heel up), the fore arm carries the weapon (its fist the weapon hand: weapons.js
   drawHeld), the free arm swings back to balance; a two-handed weapon (great, big axe, hammer, a pole) has both hands on it (grip),
   a shield arm keeps its shield; a pole's swing is a thrust from the hips. flinch: struck, the head and body jerked back, the arms
   in. NUDGE: standing about (render.js), a glance back (look), the weight on the back foot (shift) */
const BLOW_RIG={
  swing:[{head:[-1,0],body:[-1,0],fore:[[8,8],[8,6],[9,5]],rear:[[4,8],[5,10],[7,10]],grip:[[5,8],[7,7],[8,6]],lead:[[8,12],[9,13],[10,14]],back:[[6,12],[5,13],[4,14]]},
    {head:[1,0],body:[1,0],fore:[[10,8],[12,9],[13,9]],rear:[[6,8],[5,10],[4,11]],grip:[[6,8],[9,9],[11,9]],lead:[[9,12],[11,13],[12,14]],back:[[7,12],[5,13],[3,14]],toe:true},
    {head:[1,0],body:[1,0],fore:[[10,8],[11,10],[12,11]],rear:[[6,8],[5,10],[5,12]],grip:[[6,8],[8,10],[10,11]],lead:[[9,12],[10,13],[11,14]],back:[[7,12],[5,13],[4,14]]}],
  thrust:[{head:[-1,0],body:[-1,0],fore:[[8,8],[8,10],[9,10]],rear:[[4,8],[4,10],[5,11]],grip:[[4,8],[6,10],[7,10]],lead:[[8,12],[9,13],[10,14]],back:[[6,12],[5,13],[4,14]]},
    {head:[1,0],body:[1,0],fore:[[10,8],[12,9],[14,9]],rear:[[6,8],[5,10],[4,10]],grip:[[6,8],[9,9],[11,9]],lead:[[9,12],[11,13],[12,14]],back:[[7,12],[5,13],[3,14]],toe:true},
    {head:[1,0],body:[1,0],fore:[[10,8],[12,9],[13,9]],rear:[[6,8],[5,10],[4,11]],grip:[[6,8],[8,9],[10,9]],lead:[[9,12],[10,13],[11,14]],back:[[7,12],[5,13],[4,14]]}],
  overhead:[{head:[-1,0],body:[0,0],fore:[[9,8],[9,6],[9,4]],rear:[[5,8],[5,10],[6,11]],grip:[[5,8],[7,6],[8,5]],lead:[[8,12],[9,13],[10,14]],back:[[6,12],[5,13],[4,14]]},
    {head:[1,1],body:[1,1],fore:[[10,9],[12,8],[13,8]],rear:[[6,9],[5,11],[5,12]],grip:[[6,9],[9,8],[11,8]],lead:[[9,13],[10,13],[11,14]],back:[[7,13],[5,13],[4,14]]},
    {head:[1,1],body:[1,1],fore:[[10,9],[11,11],[12,12]],rear:[[6,9],[5,11],[4,12]],grip:[[6,9],[8,11],[10,12]],lead:[[9,13],[10,13],[11,14]],back:[[7,13],[5,13],[4,14]],toe:true}],
  flinch:[{head:[-1,0],body:[-1,0],fore:[[8,8],[9,10],[10,8]],rear:[[4,8],[4,10],[5,9]],grip:[[4,8],[6,9],[8,8]],lead:[[8,12],[9,13],[10,14]],back:[[6,12],[5,13],[3,14]]}]};
const NUDGE={look:{head:[-1,0],body:[0,0]},shift:{head:[-1,0],body:[-1,0]}};
const SHIELD_ARM=[[5,8],[4,10],[3,10]];
// (a frame for this figure: a pole's swing a thrust; both hands on a two-handed weapon; a shield kept on its arm)
function blowRig(o,style,atk){const st=style==='swing'&&POLE(o.held)?'thrust':style,f=BLOW_RIG[st][atk];
  if(shieldLook(o))return{...f,rear:SHIELD_ARM,over:false};return o.held&&(POLE(o.held)||o.held==='great'||o.held==='bigaxe'||o.held==='hammer')?{...f,rear:f.grip,over:true}:f}
/* bare hands (combat.js FISTS): a small rig, each frame of a jab, a cross (the rear hand), a kick and a grapple (reach, lift,
   throw), and the fists up to meet a blow (guard). head, body: [dx, dy] the head (rows 0-6) and the body (7-12) moved from the
   standing figure; fore, rear: the arms, [shoulder, elbow, fist] (rear drawn behind the body unless over: it crosses in front);
   lead, back: the legs, [hip, knee, foot]; on the figure's grid, facing right (a dwarf's below the chest a row higher). The guard
   hand stays at the chin while the other strikes; the knees bend, the hips turn, the rear heel lifts (a foot of one pixel) */
const FIST_RIG={
  jab:[{head:[0,0],body:[0,0],fore:[[9,8],[10,10],[11,7]],rear:[[5,8],[6,10],[8,6]],lead:[[8,12],[9,13],[10,14]],back:[[6,12],[5,13],[4,14]]},
    {head:[1,0],body:[1,0],fore:[[10,8],[13,8],[16,8]],rear:[[6,8],[7,10],[9,6]],lead:[[9,12],[11,13],[11,14]],back:[[7,12],[5,13],[3,14]]},
    {head:[0,0],body:[1,0],fore:[[10,8],[12,9],[13,8]],rear:[[6,8],[7,10],[9,6]],lead:[[9,12],[10,13],[11,14]],back:[[7,12],[5,13],[4,14]]}],
  hook:[{head:[-1,0],body:[-1,0],fore:[[8,8],[10,10],[10,6]],rear:[[4,8],[3,10],[4,7]],lead:[[8,12],[9,13],[10,14]],back:[[6,12],[5,13],[4,14]]},
    {head:[2,0],body:[1,0],fore:[[10,8],[10,10],[10,6]],rear:[[7,8],[11,8],[15,7]],over:true,lead:[[9,12],[10,13],[11,14]],back:[[7,12],[6,13],[6,14]],toe:true},
    {head:[1,0],body:[1,0],fore:[[10,8],[11,10],[11,6]],rear:[[7,8],[9,10],[12,8]],over:true,lead:[[9,12],[10,13],[11,14]],back:[[7,12],[6,13],[5,14]]}],
  kick:[{head:[-1,0],body:[-1,0],fore:[[8,8],[9,10],[10,6]],rear:[[4,8],[4,10],[6,7]],lead:[[7,12],[10,11],[10,13]],back:[[5,12],[5,13],[5,14]]},
    {head:[-2,1],body:[-1,0],fore:[[8,8],[8,10],[7,11]],rear:[[4,8],[3,7],[2,6]],lead:[[7,11],[11,11],[15,10]],back:[[5,12],[5,13],[4,14]]},
    {head:[-1,0],body:[-1,0],fore:[[8,8],[9,10],[10,6]],rear:[[4,8],[4,10],[6,7]],lead:[[7,12],[9,12],[9,14]],back:[[5,12],[5,13],[5,14]]}],
  grapple:[{head:[1,1],body:[1,1],fore:[[10,9],[12,9],[14,9]],rear:[[6,9],[9,10],[13,10]],over:true,lead:[[9,13],[10,13],[11,14]],back:[[7,13],[5,13],[4,14]]},
    {head:[0,-1],body:[0,0],fore:[[9,8],[11,6],[12,4]],rear:[[6,8],[9,6],[11,4]],over:true,lead:[[8,12],[9,13],[10,14]],back:[[6,12],[5,13],[4,14]]},
    {head:[2,2],body:[1,1],fore:[[10,9],[12,11],[14,12]],rear:[[7,9],[10,11],[13,12]],over:true,lead:[[9,13],[11,13],[12,14]],back:[[7,13],[5,13],[3,14]],toe:true}],
  guard:[{head:[0,0],body:[0,0],fore:[[9,8],[11,9],[11,6]],rear:[[5,8],[7,10],[9,6]],lead:[[8,12],[9,13],[10,14]],back:[[6,12],[5,13],[4,14]]}]};
// (a limb of the rig: a pixel line through its joints, in col, its upper part a pixel thicker (wide: [dx, dy], in dark), and its
// end: a fist (skin, a knuckle darker) or a foot)
function rigLine(g,ox,oy,pts,sh,col,end,wide,dark){const at=([x,y])=>[x,y-(y>=9?sh:0)];
  for(let i=0;i+1<pts.length;i++){const [x0,y0]=at(pts[i]),[x1,y1]=at(pts[i+1]),n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);
    for(let k=0;k<=n;k++){const x=ox+Math.round(x0+(x1-x0)*k/n),y=oy+Math.round(y0+(y1-y0)*k/n);if(wide&&i===0)pset(g,x+wide[0],y+wide[1],dark);pset(g,x,y,col)}}
  if(end)end(at(pts[pts.length-1]))}
// (the rig's limbs: behind, the rear arm unless it crosses over and the back leg; else the legs, then the arms in front)
function rigLimbs(g,o,ox,oy,R,sh,behind){const S=pal(o.skin),A=pal(o.outer),Lg=pal(o.legs||'leather'),put=(x,y,c)=>pset(g,ox+x,oy+y,c);
  const arm=(pts,col)=>rigLine(g,ox,oy,pts,sh,col,([x,y])=>{put(x,y,S[1]);put(x,y+1,S[2])},[0,1],A[3]),leg=(pts,col,toe)=>rigLine(g,ox,oy,pts,sh,col,([x,y])=>{put(x,y,Lg[3]);if(!toe)put(x+1,y,Lg[3])},[1,0],Lg[2]);
  if(behind){if(!R.over)arm(R.rear,A[3]);if(!o.robe)leg(R.back,Lg[2],R.toe);return}
  if(!o.robe)leg(R.lead,Lg[1]);if(R.over)arm(R.rear,A[3]);arm(R.fore,A[2])}
// the weapons in hand (figures.js HandWeapon, weapons.js drawBlade): [length, material, head]; upright at rest (but WPN_REST's), in
// a blow swung from the hand at its frame's [hand dx, dy, angle] (SWING; a pole's swing POLE_SWING)
const WPN={sword:[6,'steel','guard'],great:[9,'steel','guard'],dagger:[4,'steel','guard'],axe:[7,'wood','axe'],bigaxe:[9,'wood','bigaxe'],hammer:[7,'wood','hammer'],
  spear:[12,'wood','tip'],pike:[15,'wood','tip'],javelin:[10,'wood','tip'],lance:[16,'wood','pennant'],
  hoe:[10,'wood','hoe'],pick:[8,'wood','pick'],crook:[12,'wood','crook'],rod:[13,'wood','rod']};// (workers' tools: the world map, folk.js)
const SWING={swing:[[-3,-4,-125],[1,-1,-5],[0,1,55]],thrust:[[-2,-1,-8],[2,-1,0],[0,-1,0]],overhead:[[-2,-6,-95],[0,-5,-35],[1,0,70]]};
const POLE_SWING=[[-1,-2,-40],[1,-1,-2],[0,0,25]],WPN_REST={lance:-62,rod:-55,hoe:-75,pick:-75,crook:-82};// (a crook upright by him, a walking staff)
// mounts: a horse (and its kin) seen from the side in a 32×32 cell, a rider's lower body hidden in it; walk 0-3 gallops (the
// horse and the stag are HORSE_ART's now, below; this the ram's, and the horse's with HORSE_ART.on false)
const MOUNT_T=[
  '..........................yy....',
  '.........................yHHy...',
  '........................mHhHHh..',
  '.......................mHHHHHHH.',
  '......................mHHH..hH..',
  '.....................mHHH.......',
  '.......hhhhhhhhhhhhhhHHH........',
  '.....mhHHHHHHHHHHHHHHHH.........',
  '....m.hHHHHHHHHHHHHHHHd.........',
  '....m.dHHHHHHHHHHHHHHdd.........',
  '......ddddddddddddddd...........'];
// a wolf (and a warg): long and low, its head forward at the height of its back, ears up, its tail raised
const WOLF_T=[
  '................................',
  '................................',
  '................................',
  '.........................h..h...',
  '........................hHHhH...',
  '.......y...............hHHHHHHd.',
  '......yy.hhhhhhhhhhhhhhHHHHHd...',
  '.......yHHHHHHHHHHHHHHHHHd......',
  '........HHHHHHHHHHHHHHHHd.......',
  '........dHHHHHHHHHHHHHdd........',
  '.........dddddddddddddd.........'];
/* the horse (the owner, 2026-11-02: "can you fix the mounts sprites? i mean the horse legs", then "make sure to make it look like
   horse"; doc/references' gallops: silhouette first, the body high in the suspension and low at the landing, the tail a frame
   behind the hip, the rider a frame behind the horse): a horse's shape, an arched neck and a wedge head, a deep chest, rounded
   quarters, the tail from the croup, and legs that bend (a forearm, knee and cannon before; a gaskin and a hock angled back
   behind; a fetlock, a hoof), the near pair lighter. body: its two shapes, standing and running (the neck stretched out), rows
   from y0-2; tails: cell px at rest; each frame (idle 0-1, a four-beat walk 0-3: far hind, far fore, near hind, near fore
   lifted in turn; a gallop 4-7: reaching, the push off, gathered off the ground, the hind landing): bob the body's rise, head
   the head's against it (x from headX, its rows to headY), the tail's shape, rider his seat against the saddle (a frame
   behind), and the legs (far hind, near hind, far fore, near fore) [hip dx, knee or hock dx, h, fetlock dx, h, hoof dx, h] from
   hips, h px above the ground. A horse and a stag (its antlers on its ears: ears, from the old head's); a ram and a wolf keep
   their own. down: the fallen horse, its legs' joints [x, y] from its top. on false: the old horse, pixel for pixel.
   Two builds (the owner, 2026-11-03: "a second pass for leggier horses", then a little longer only, +1): first, the first
   pass's (tall false; y0: the body's row; top: its rows' first against y0; ground: the hooves' row from y0; seat: the rider's
   row against it); sized, the same horse on legs leg px longer, with its own gallop and, from the owner's photos ("the head when
   running is too small", "not too square"), a thick neck rising at about 45° from the shoulders (lower and forward at the
   gallop), a maned crest, and one head in every frame: head, a long wedge hung from the poll (two ears pricked forward, the eye
   high, a rounded jowl over a dark jaw, narrowing to a rounded muzzle and its nostril), its top left at poll [x, y from y0] by
   shape, moved by the frame's head (horseBuild); its muzzle (the owner, 2026-11-04: "the horse nose is a bit weird") one even
   front over two rows, the nostril a pixel inside it, the lower lip no further out than the rest: no beak in the outline */
const HORSE_ART={on:true,tall:true,hoof:'#3d3f4b',
  leg:1,sized:{sink:0,top:-3,headX:32,headY:0,ears:{stand:[-3,-4],run:[-2,-2]},poll:{stand:[23,-3],run:[24,-1]},head:[
    '.yy....',
    '.mHh...',
    'HHkHh..',
    'HHHHh..',
    '.dHHHh.',
    '..dHHkh',
    '...dHHd'],
  body:{stand:[
    '',
    '',
    '.....................mm.........',
    '....................mmH.........',
    '...................mHHH.........',
    '..................mHHHHd........',
    '.................mHHHHHd........',
    '................mHHHHHHd........',
    '.......hhhh....mHHHHHHHd........',
    '......hHHHhhhhhhHHHHHHHd........',
    '......hHHHHHHHHHHHHHHHHd........',
    '......HHHHHHHHHHHHHHHHHd........',
    '......HHHHHHHHHHHHHHHHHd........',
    '......dHHHHHHHHHHHHHHHd.........',
    '.......dHHHHddddddHHHd..........'],run:[
    '',
    '',
    '',
    '......................mmm.......',
    '...................mmmHH........',
    '.................mmHHHHH........',
    '................mHHHHHHd........',
    '................mHHHHHHd........',
    '.......hhhh....mHHHHHHHd........',
    '......hHHHhhhhhhHHHHHHHd........',
    '......hHHHHHHHHHHHHHHHHd........',
    '......HHHHHHHHHHHHHHHHHd........',
    '......HHHHHHHHHHHHHHHHHd........',
    '......dHHHHHHHHHHHHHHHd.........',
    '.......dHHHHddddddHHHd..........']},
  gallop:[
    {bob:0,body:'run',head:-1,tail:'up',rider:-1,legs:[[-1,-4,4,-6,3,-7,3],[0,-3,3,-5,1,-6,0],[2,5,4,7,3,8,2],[1,2,3,4,1,5,0]]},
    {bob:-1,body:'run',head:0,tail:'mid',rider:1,legs:[[0,-2,4,-1,2,0,2],[1,-2,4,-1,2,0,2],[0,-1,3,-2,2,-3,2],[0,-1,3,-2,1,-3,0]]},
    {bob:-2,body:'run',head:1,tail:'low',rider:1,legs:[[0,-2,5,1,2,3,1],[1,-1,5,3,2,5,1],[1,2,7,-1,6,-3,5],[0,2,6,0,5,-2,4]]},
    {bob:-1,body:'run',head:0,tail:'mid',rider:-1,legs:[[0,-2,3,-1,1,-1,0],[1,-1,3,2,1,3,0],[1,3,4,3,2,2,2],[1,3,4,4,2,5,2]]}]},
  first:{y0:14,ground:16,seat:0,top:-2,hips:[12,10,18,20],thick:2,headX:23,headY:6,ears:{stand:[-4,-2],run:[-2,0]},
  body:{stand:[
    '.....................y.y........',
    '....................mHhH........',
    '...................mHHHhH.......',
    '...................mHHHkHh......',
    '..................mHHHHHHHh.....',
    '..................mHHH..HHHh....',
    '.................mHHHH...HHHh...',
    '.......hhhh.....mHHHHH....dd....',
    '......hHHHhhhhhhHHHHHH..........',
    '......hHHHHHHHHHHHHHHHd.........',
    '......HHHHHHHHHHHHHHHHd.........',
    '......dHHHddddddddHHdd..........'],run:[
    '',
    '',
    '.......................y.y......',
    '.....................mmHhHh.....',
    '...................mmHHHHkHhh...',
    '.................mmHHHHHHHHHHh..',
    '................mHHHHHHH...ddd..',
    '.......hhhh....mHHHHHHH.........',
    '......hHHHhhhhhhHHHHHHd.........',
    '......hHHHHHHHHHHHHHHHd.........',
    '......HHHHHHHHHHHHHHHHd.........',
    '......dHHHddddddddHHdd..........']},
  tails:{hang:[[5,20],[5,21],[4,22],[4,23],[4,24],[5,25]],sway:[[5,20],[5,21],[4,22],[4,23],[3,24],[3,25]],
    up:[[5,20],[4,19],[3,19],[2,20],[1,20],[1,21]],mid:[[5,20],[4,20],[3,21],[2,21],[2,22],[1,23]],low:[[5,20],[4,21],[3,22],[3,23],[2,24],[2,25]]},
  idle:[{bob:0,tail:'hang',legs:[[0,-2,3,-1,1,-1,0],[0,-2,3,-1,1,-1,0],[0,0,3,0,1,0,0],[0,0,3,0,1,0,0]]}],
  walk:[
    {bob:0,tail:'hang',legs:[[0,-1,4,0,3,1,2],[0,-2,3,-1,1,-1,0],[0,-1,3,-1,1,-2,0],[0,1,3,1,1,2,0]]},
    {bob:-1,tail:'hang',legs:[[0,-1,3,0,1,1,0],[0,-3,3,-3,1,-4,0],[0,1,3,0,2,-1,2],[0,0,3,0,1,0,0]]},
    {bob:0,tail:'sway',legs:[[0,-2,3,-1,1,-1,0],[0,-1,4,0,3,1,2],[0,1,3,1,1,2,0],[0,-1,3,-1,1,-2,0]]},
    {bob:-1,tail:'sway',legs:[[0,-3,3,-3,1,-4,0],[0,-1,3,0,1,1,0],[0,0,3,0,1,0,0],[0,1,3,0,2,-1,2]]}],
  gallop:[
    {bob:0,body:'run',head:-1,tail:'up',rider:-1,legs:[[-1,-4,4,-6,3,-7,3],[0,-3,3,-5,1,-6,0],[2,5,4,7,3,8,2],[1,2,3,4,1,5,0]]},
    {bob:-1,body:'run',head:0,tail:'mid',rider:1,legs:[[0,-2,4,-1,2,0,2],[1,-2,4,-1,2,0,2],[0,-1,3,-2,2,-3,2],[0,-1,3,-2,1,-3,0]]},
    {bob:-2,body:'run',head:1,tail:'low',rider:1,legs:[[0,-1,5,2,3,3,2],[1,0,4,3,2,4,1],[1,3,4,1,2,0,2],[0,2,5,0,3,-1,3]]},
    {bob:-1,body:'run',head:0,tail:'mid',rider:-1,legs:[[0,-2,3,-1,1,-1,0],[1,-1,3,2,1,3,0],[1,3,4,3,2,2,2],[1,3,4,4,2,5,2]]}],
  down:{body:[
    '.......hhhhhhhhhhh..............',
    '.....hhHHHHHHHHHHHhh............',
    '...mmHHHHHHHHHHHHHHHhmm.........',
    '..m..HHHHHHHHHHHHHHHHHHmmh......',
    '..m..dHHHHHHHHHHHHHHHHHHHHHHhy..',
    '......dHHHHHHHHHHHddHHHHkHHHHHh.',
    '........ddddddddd....ddddddddd..'],
    legs:[[[8,5],[5,7],[4,9],[3,10]],[[11,6],[9,8],[7,9],[6,10]],[[17,6],[19,7],[21,8],[22,9]],[[19,6],[21,8],[20,9],[21,10]]],thick:7}}};
const horseArt=kind=>HORSE_ART.on&&(kind==='horse'||kind==='stag');
/* the build drawn: tall false, the first pass's; else sized: the first pass's with its own gallop (gathered, the fore legs
   folded back under the chest and the hind reaching forward, as the references' suspension), its legs HORSE_ART.leg px longer
   (the body and the saddle that much higher, the rider sunk up to sink px into it so he rises a px less (+1: not at all); each
   joint's height x (8 + leg) / 8, so the knees, hocks and gaits keep their shape; the tail with the croup, a hanging one as much
   longer; the fallen one's legs as much longer). Made once a length */
const HORSE_BUILDS={};
function horseBuild(){const A=HORSE_ART;return !A.tall?A.first:HORSE_BUILDS[A.leg]||(HORSE_BUILDS[A.leg]=sizedHorse(A.first,A.sized,A.leg))}
function sizedHorse(S,Z,n){const k=(8+n)/8,legs=F=>({...F,legs:F.legs.map(l=>l.map((v,i)=>i&&!(i&1)?Math.round(v*k):v))}),
    tail=P=>{const t=P.map(([x,y])=>[x,y-n]),e=t[t.length-1];if(e[1]-t[0][1]<4)return t;for(let i=1;i<=n;i++)t.push([e[0],e[1]+i]);return t},
    reach=P=>P.map(([x,y],i)=>i?[Math.round(P[0][0]+(x-P[0][0])*k),Math.min(11,Math.round(P[0][1]+(y-P[0][1])*k))]:[x,y]);
  return{...S,top:Z.top,body:Z.body,head:Z.head,poll:Z.poll,headX:Z.headX,headY:Z.headY,ears:Z.ears,y0:S.y0-n,ground:S.ground+n,seat:Math.max(0,Math.min(n,Z.sink)),idle:S.idle.map(legs),walk:S.walk.map(legs),gallop:Z.gallop.map(legs),
    tails:Object.fromEntries(Object.entries(S.tails).map(([k,P])=>[k,tail(P)])),down:{...S.down,legs:S.down.legs.map(reach)}}}
// (a horse's leg: its hip, knee (or hock), fetlock and hoof, [x, y] each, drawn by set; near: the lighter; 2 px thick to row
// thickTo, the second px to side; a fetlock and a hoof)
// (the owner, 2026-11-04: "make sure the legs when walking or running are correct, and fix the extra dots in the outer line": a
// near leg 2 px thick its whole length, the far one 1 px and darker, a pixel apart from it so a pair reads as two legs; each
// line stepped edge to edge (never only corner to corner, which the outline broke into dots), its hoof as wide)
// (the owner, 2026-11-07: "some legs seem like a stick and too thin": the near leg 3 px over the forearm or gaskin and 2 below, the
// far one 2 px down to the fetlock and 1 on the pastern; the hoof 2 wide; the shade on the leg's back edge)
function horseLeg(set,P,C,near,thickTo,side){const w=s=>near?s===0?3:2:s<2?2:1,dot=(x,y,k,n,ks)=>{set(x,y,k);if(n>1)set(x+side,y,ks||k);if(n>2)set(x-side,y,near?C[0]:k)};
  let px=null,py=null;
  for(let s=0;s<3;s++){const [x0,y0]=P[s],[x1,y1]=P[s+1],n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1),c=near?C[1]:C[2],cs=near?C[2]:C[3];
    for(let i=0;i<=n;i++){const x=Math.round(x0+(x1-x0)*i/n),y=Math.round(y0+(y1-y0)*i/n);if(px!=null&&x!==px&&y!==py)dot(px,y,c,w(s),cs);dot(x,y,c,w(s),cs);px=x;py=y}}
  dot(P[2][0],P[2][1],near?C[2]:C[3],near?2:1);dot(P[3][0],P[3][1],HORSE_ART.hoof,2)}
// (its letters' colours: coat light, mid and shade, the mane, an eye)
const horseCols=(C,Mn)=>({H:C[1],h:C[0],d:C[2],y:C[2],m:Mn[2],k:'#27272c'});
// a horse standing, walking or galloping (HORSE_ART), in the cell by ps; returns the rider's seat row (drawMount's)
function drawHorse(ps,o,walk,C,Mn,Tm,get){const A=horseBuild(),y0=A.y0,F=walk>=4?A.gallop[(walk-4)%4]:walk>=0?A.walk[walk%4]:A.idle[0],bob=F.bob,shape=F.body||'stand',col=horseCols(C,Mn),on=new Set();
  // the legs behind the body, the far pair first: from the hip, inside it, to the hoof
  for(const i of [0,2,1,3]){const L=F.legs[i],h=A.hips[i],G=y0+A.ground;horseLeg(ps,[[h+L[0],y0+8+bob],[h+L[1],G-L[2]],[h+L[3],G-L[4]],[h+L[5],G-L[6]]],C,i%2===1,y0+9+bob+A.thick,i<2?-1:1)}
  // the body (its rows from y0+top; the first pass's head on it, moved by the frame's head), then its own head hung at its poll
  const mane=[],paint=(rows,X,Y,dh)=>rows.forEach((r,y)=>[...r].forEach((c,x)=>{const k=col[c];if(!k)return;const yy=Y+y+bob+dh(x,y);ps(X+x,yy,k);on.add(X+x+','+yy);if(c==='m')mane.push([X+x,yy])}));
  paint(A.body[shape],0,y0+A.top,(x,y)=>x>=A.headX&&y<=A.headY?F.head||0:0);
  if(A.head){const [hx,hy]=A.poll[shape];paint(A.head,hx,y0+hy,()=>F.head||0)}
  // (its tail: each point joined to the last by an edge, never only a corner, the outline's dots: the owner, 2026-11-04)
  A.tails[F.tail].forEach(([x,y],i,T)=>{if(i){const [px,py]=T[i-1];if(px!==x&&py!==y)ps(px,y+bob,Mn[2])}ps(x,y+bob,Mn[i?2:1])});
  if(get)mountCoat((x,y,c)=>c?ps(x,y,c):on.has(x+','+y)?get(x,y):null,32,32,C,false);
  horseDetail(ps,on,mane,A,F,shape,C,Mn,Tm,o,y0+bob);
  // barded: the side's colour over its body; else a saddle (and, no one in it, a cloth under it, its pommel, cantle and stirrup)
  if(o.barded){const deep=HORSE_TACK.on&&A.poll,rows=deep?[Tm[1],PPAL.gold[1],Tm[1],Tm[1],Tm[2],Tm[2]]:[Tm[0],PPAL.gold[1],Tm[2],null];for(let x=6;x<=22;x++)rows.forEach((c,k)=>{const y=y0+6+k+bob;if(on.has(x+','+y))ps(x,y,c||(x%2?Tm[3]:Tm[2]))});
    // (its hem dagged: every other pixel along its foot a shade deeper, a gilt point between)
    if(deep)for(let x=6;x<=22;x++){let y=-1;for(let k=0;k<6;k++)if(on.has(x+','+(y0+6+k+bob)))y=y0+6+k+bob;if(y>=0)ps(x,y,x%3===0?PPAL.gold[2]:Tm[3])}}
  else{const tk=HORSE_TACK.on;if(tk||o.saddled)for(let x=10;x<=16;x++){ps(x,y0+7+bob,Tm[1]);ps(x,y0+8+bob,Tm[2]);ps(x,y0+9+bob,tk?Tm[3]:x%2?Tm[3]:Tm[2])}
    for(let x=11;x<=15;x++)ps(x,y0+6+bob,PPAL.leather[x<13?0:1]);if(tk&&o.mount!=='stag')for(let y=7;y<=9;y++)ps(15,y0+y+bob,PPAL.leather[2])}
  if(o.saddled){ps(11,y0+5+bob,PPAL.leather[0]);ps(15,y0+5+bob,PPAL.leather[1]);ps(13,y0+10+bob,'#27272c');ps(13,y0+11+bob,'#27272c')}
  return y0+A.seat+bob+(F.rider||0)}
/* a mount's coat (the owner, 2026-11-07: "can you add detail like furs, or shading to mounts"): its main colour (C[1]) rounded
   down each column's run of it on the body: its first row a sheen (C[1] toward C[0], MOUNT_COAT.sheen), its lower third a tone
   toward the shade (shade), its foot a deeper one (deep); a run under 4 rows left flat. fur (a wolf's, a warg's, a ram's): the
   shade's edge in tufts, every MOUNT_COAT.fur-th column (by a hash of x) a row higher and the next a row lower, so it hangs ragged,
   and strands of fur two px long down its flank (strand), a run of 3 shaded already;
   each tone a band or a tooth on one, never a lone pixel. px(x, y) its colour on the body (null off it), px(x, y, c) sets it */
const MOUNT_COAT={on:true,sheen:.45,shade:.45,deep:.8,fur:3,strand:4};
function mountCoat(px,w,h,C,fur){const T=MOUNT_COAT;if(!T.on)return;const c1=C[1],sh=PX.mix(c1,C[0],T.sheen),md=PX.mix(c1,C[2],T.shade),dp=PX.mix(c1,C[2],T.deep);
  for(let x=0;x<w;x++)for(let y=0;y<h;y++){if(px(x,y)!==c1)continue;let e=y;while(e+1<h&&px(x,e+1)===c1)e++;const n=e-y+1;
    if(n>=(fur?3:4)){const t=(x*7+3)%T.fur,b=e-Math.floor(n/3)+(fur?t===0?-1:t===1?1:0:0);for(let k=y;k<=e;k++){const c=k===y&&n>=5?sh:k===e?dp:k>=b?md:null;if(c)px(x,k,c)}
      // (fur: a strand two px long, every MOUNT_COAT.strand-th column by its hash, dark from the shade up or light from the top down)
      if(fur&&n>=4){const s=(x*5+1)%T.strand;if(s===0&&b-2>=y){px(x,b-1,md);px(x,b-2,md)}else if(s===2&&y+2<b){px(x,y+1,sh);px(x,y+2,sh)}}}
    y=e}}
/* a horse's detail (the owner, 2026-11-07: "make sure mount have more details. Current one looks really ugly"): its mane thick
   and in strands down the crest (a dark strand on the edge, a lighter one inside it every other row), the line of its flank and
   of its shoulder's back in shade; a horse's tack (HORSE_TACK: a bridle, the headstall down its cheek and the bit; a breast strap
   to the chest, studded; no reins, which read as a stick across the neck) and, under the saddle, a cloth of the side's colour,
   the girth over it (drawHorse); barded, its caparison down to the belly (the body as deep as its legs are long: the owner,
   2026-11-07, "the mount portions still weird"); a stag's (no tack, its saddle only) small lyre of antlers (HORSE_TACK.antlers: x, y from its poll, rising from its ears, each pixel joined by an edge, the beams darker, the tines
   bone); HORSE_TACK.on false: none of it, the cloth only under an empty saddle, the stag's old antlers. on: its body's pixels, Y:
   its body's row y0 as it bobs */
const HORSE_TACK={on:true,strap:[[1,2],[1,3],[2,4],[3,5]],bit:[4,6],breast:[[19,7],[20,7],[21,8],[22,8]],stud:[21,8],steel:'#b8bcc8',
  lines:[[11,8],[11,9],[17,8],[16,9]],
  antlers:{beam:[[1,-1],[1,-2],[0,-2],[0,-3],[-1,-3],[-1,-4],[2,-1],[2,-2],[3,-2],[3,-3],[4,-3],[4,-4]],tine:[[-1,-5],[0,-5],[4,-5],[3,-5]]},};
function horseDetail(ps,on,mane,A,F,shape,C,Mn,Tm,o,Y){const T=HORSE_TACK,inBody=(x,y)=>on.has(x+','+y),put=(x,y,c)=>{if(inBody(x,y))ps(x,y,c)},stag=o.mount==='stag';
  if(!T.on){if(stag){const [ex,ey]=A.ears[shape];for(const [x,y] of [[25,-1],[24,-2],[26,-2],[23,-3],[27,-3],[28,0],[29,-1]])ps(x+ex,Y+y+ey+(shape==='run'?F.head||0:0),PPAL.cloth[0])}return}
  if(!stag)for(const [x,y] of mane){put(x+1,y,Mn[2]);if(y%2===0)put(x+2,y,Mn[1])}
  for(const [x,y] of T.lines)put(x,Y+y,C[2]);
  // (a tail of strands: each point a pixel thicker toward the croup, a lighter strand along it)
  A.tails[F.tail].forEach(([x,y],i,P)=>{if(i&&i<P.length-1)ps(x+1,y+Y-A.y0,i%2?Mn[1]:Mn[2])});
  const [hx,hy]=A.poll?A.poll[shape]:[A.headX,A.headY],HY=Y+hy+(F.head||0);
  if(stag){for(const [x,y] of T.antlers.beam)ps(hx+x,HY+y,PPAL.cloth[2]);for(const [x,y] of T.antlers.tine)ps(hx+x,HY+y,PPAL.cloth[0]);return}
  if(!A.poll)return;const L=PPAL.leather[2];for(const [x,y] of T.strap)put(hx+x,HY+y,L);
  ps(hx+T.bit[0],HY+T.bit[1],T.steel);
  for(const [x,y] of T.breast)put(x,Y+y,L);put(T.stud[0],Y+T.stud[1],PPAL.gold[1])}
function drawMount(g,o,walk,dx=0,dy=0){const ps=(x,y,c)=>pset(g,x+dx,y+dy,c);// (dx, dy: the cell's corner in g)
  const kind=o.mount,C=pal(kind==='horse'?o.mountC||'horse':kind==='stag'?'stag':kind==='ram'?'fleece':kind),Mn=pal(kind==='ram'?'wool':kind==='wolf'||kind==='warg'?kind:'dark'),Tm=pal(o.team);
  if(horseArt(kind))return drawHorse(ps,o,walk,C,Mn,Tm,(x,y)=>pget(g,x+dx,y+dy))+dy;
  const gal=walk>=4,y0=kind==='ram'?16:14,legs=kind==='ram'?3:5,bob=gal?[0,-1,-2,-1][walk-4]:walk===1||walk===3?-1:0;
  // (a wolf, a warg, a ram: drawn by hand, engine/beasts.js PX.mountArt; its saddle or barding only on its body)
  const art=window.PX&&PX.mountArt&&PX.mountArt(kind,walk,{C,M:kind==='ram'?pal('#9a7a5a'):pal('wool')});
  if(art){const on=new Set(),A=art.g,y1=art.seat-6,[b0,b1]=art.body;
    mountCoat((x,y,c)=>{if(y<b0||y>b1)return null;if(c)A.p[y*A.w+x]=c;else return A.p[y*A.w+x]},A.w,A.h,C,true);for(let y=0;y<A.h;y++)for(let x=0;x<A.w;x++){const c=A.p[y*A.w+x];if(c){ps(x,y,c);on.add(x+','+y)}}
    const pb=(x,y,c)=>{if(on.has(x+','+y))ps(x,y,c)};
    if(o.barded){for(let x=6;x<=20;x++){pb(x,y1+6,Tm[0]);pb(x,y1+7,PPAL.gold[1]);pb(x,y1+8,Tm[2]);pb(x,y1+9,x%2?Tm[3]:Tm[2])}}
    else{const tk=HORSE_TACK.on;if(tk||o.saddled)for(let x=10;x<=16;x++){pb(x,y1+7,Tm[1]);pb(x,y1+8,Tm[2]);pb(x,y1+9,tk?Tm[3]:x%2?Tm[3]:Tm[2])}
      for(let x=11;x<=15;x++)ps(x,y1+5,PPAL.leather[x<13?0:1]);if(tk)for(let y=7;y<=9;y++)pb(15,y1+y,PPAL.leather[2])}
    if(o.saddled){ps(11,y1+4,PPAL.leather[0]);ps(15,y1+4,PPAL.leather[1]);ps(13,y1+9,'#27272c');ps(13,y1+10,'#27272c')}
    return y1+dy}
  const wolf=kind==='wolf'||kind==='warg';(wolf?WOLF_T:MOUNT_T).forEach((r,y)=>[...r].forEach((c,x)=>{const col={H:C[1],h:C[0],d:C[2],y:C[2],m:Mn[2]}[c];if(col)ps(x,y0+y+bob,col)}));
  if(wolf)ps(28,y0+5+bob,o.team==='red'?'#ffdc04':'#ffdc04');
  // legs: a gallop of four
  // (a gallop: the legs flung out before and behind, then gathered under)
  const LX=gal?[[4,9,18,23],[7,11,15,19],[5,12,16,22],[8,10,17,19]][walk-4]:[[7,10,17,20],[6,11,16,21],[7,10,17,20],[8,9,18,19]][walk<0?0:walk];
  LX.forEach((x,i)=>{for(let y=0;y<legs;y++){ps(x,y0+11+y,i%2?C[2]:C[3]);ps(x+1,y0+11+y,i%2?C[1]:C[2])}ps(x,y0+11+legs,PEOPLE_OUT==='x'?0:'#27272c');ps(x+1,y0+11+legs,'#27272c')});
  // its kind: a stag's antlers, a ram's horns, a wolf's ears (and no mane)
  if(kind==='stag'){for(const [x,y] of [[25,-1],[24,-2],[26,-2],[23,-3],[27,-3],[28,0],[29,-1]])ps(x,y0+y+bob,PPAL.cloth[0])}
  if(kind==='ram'){for(const [x,y] of [[24,1],[23,2],[23,3],[24,4],[25,4]])ps(x,y0+y+bob,PPAL.cloth[2])}
  // a barded mount wears the side's colour; else a saddle
  if(o.barded){for(let x=7;x<=21;x++){ps(x,y0+6+bob,Tm[0]);ps(x,y0+7+bob,Tm[1]);ps(x,y0+8+bob,Tm[2]);ps(x,y0+9+bob,x%2?Tm[3]:Tm[2])}for(let x=7;x<=21;x++)ps(x,y0+7+bob,PPAL.gold[1])}
  else{if(o.saddled)for(let x=10;x<=16;x++){ps(x,y0+7+bob,Tm[1]);ps(x,y0+8+bob,Tm[2]);ps(x,y0+9+bob,x%2?Tm[3]:Tm[2])}// (no one in it: a cloth of its side's colour under the saddle)
    for(let x=11;x<=15;x++)ps(x,y0+6+bob,PPAL.leather[x<13?0:1])}
  // (saddled, no one in it (battle/dismount.js): its pommel and cantle up, a stirrup hanging)
  if(o.saddled){ps(11,y0+5+bob,PPAL.leather[0]);ps(15,y0+5+bob,PPAL.leather[1]);ps(13,y0+10+bob,'#27272c');ps(13,y0+11+bob,'#27272c')}
  return y0+bob+dy;
}
// a mount fallen: on its side, its back to the far side, head flat on the ground ahead, legs out toward you (32×20)
const LIE_T=[
  '......hhhhhhhhhhhhhhh...........',
  '....mhHHHHHHHHHHHHHHHHh.........',
  '...m.HHHHHHHHHHHHHHHHHHhmm......',
  '...m.HHHHHHHHHHHHHHHHHHHHHmhh...',
  '.....dHHHHHHHHHHHHHHHHHHHHHHHHh.',
  '......ddHHHHHHHHHHHHHHdddHHHHHHy',
  '........ddddddddddddd....ddddd..'];
function drawMountDown(g,o){
  const kind=o.mount,C=pal(kind==='horse'?o.mountC||'horse':kind==='stag'?'stag':kind==='ram'?'fleece':kind),Mn=pal(kind==='ram'?'wool':kind==='wolf'||kind==='warg'?kind:'dark'),Tm=pal(o.team),y0=9;
  // (a horse: HORSE_ART's, its legs as a standing one's, out toward you; its cloth over its body, or its saddle)
  if(horseArt(kind)){const D=horseBuild().down,col=horseCols(C,Mn),on=new Set(),ps=(x,y,c)=>pset(g,x,y0+y,c);
    for(const i of [0,2,1,3])horseLeg(ps,D.legs[i],C,i%2===1,D.thick,i<2?-1:1);
    D.body.forEach((r,y)=>[...r].forEach((c,x)=>{if(col[c]){ps(x,y,col[c]);on.add(x+','+y)}}));
    if(o.barded){for(let x=6;x<=19;x++)[Tm[0],PPAL.gold[1],x%2?Tm[3]:Tm[2]].forEach((c,k)=>{if(on.has(x+','+(2+k)))ps(x,2+k,c)})}
    else for(let x=10;x<=14;x++)ps(x,1,PPAL.leather[x<12?0:1]);
    return}
  const art=window.PX&&PX.mountArt&&PX.mountArt(kind,0,{C,M:kind==='ram'?pal('#9a7a5a'):pal('wool')},true);
  if(art){const A=art.g,on=new Set();for(let y=0;y<A.h;y++)for(let x=0;x<A.w;x++){const c=A.p[y*A.w+x];if(c){pset(g,x,y,c);on.add(x+','+y)}}
    const top=Math.min(...[...on].map(k=>+k.split(',')[1]));if(o.barded)for(let x=7;x<=19;x++){if(on.has(x+','+(top+1)))pset(g,x,top+1,Tm[1]);if(on.has(x+','+(top+2)))pset(g,x,top+2,PPAL.gold[1])}
    else for(let x=10;x<=14;x++)if(on.has(x+','+top))pset(g,x,top,PPAL.leather[x<12?0:1]);return}
  LIE_T.forEach((r,y)=>[...r].forEach((c,x)=>{const col={H:C[1],h:C[0],d:C[2],y:C[2],m:Mn[2]}[c];if(col)pset(g,x,y0+y,col)}));
  // (the legs: the hind pair out behind, the fore pair out ahead, each ending in a hoof)
  for(const [x,dx] of [[8,-1],[11,-1],[19,1],[22,1]]){for(let k=0;k<4;k++){pset(g,x+dx*k,y0+6+k,k<2?C[2]:C[3]);pset(g,x+1+dx*k,y0+6+k,C[2])}pset(g,x+dx*4,y0+10,'#27272c');pset(g,x+1+dx*4,y0+10,'#27272c')}
  if(o.barded){for(let x=6;x<=21;x++){pset(g,x,y0+2,Tm[0]);pset(g,x,y0+3,Tm[1]);pset(g,x,y0+4,x%2?Tm[3]:Tm[2])}for(let x=6;x<=21;x++)pset(g,x,y0+3,PPAL.gold[1])}
  else for(let x=10;x<=14;x++)pset(g,x,y0+1,PPAL.leather[x<12?0:1]);
}
// (a rider's seated leg, facing right: [x, y from the seat row, its letter: L leg, M its shade, F his foot])
// (its colours by what he wears (the owner, 2026-11-04: "can the legs differ, like chain mail or different boots"): greaves and
// boots of yours or a companion's in their own metal's colours (legsC, feetC); else by his armour: plate, steel greaves (a lit
// thigh) and sabatons; mail, chain links (two shades in a check) and iron-shod boots; hide, fur leggings; leather or none, his
// leggings (o.legs) and leather boots)
function riderLegCol(o,k,x,y){const a=o.armor,P=PPAL;
  if(k==='F'){const f=o.feetC?pal(o.feetC):a==='plate'?P.steel:a==='mail'?P.iron:P.leather;return f[x%2?1:2]}
  const L=o.legsC?pal(o.legsC):a==='plate'?P.steel:a==='mail'?P.iron:a==='hide'?P.fur:pal(o.legs||'leather');
  if(!o.legsC&&a==='mail')return L[(x+y)%2?1:2];
  return k==='M'?L[2]:a==='plate'&&y===6?L[0]:L[1]}
const RIDER_LEG=[[11,6,'L'],[12,6,'L'],[13,6,'L'],[12,7,'M'],[13,7,'L'],[13,8,'L'],[13,9,'F'],[14,9,'F']];// (the owner: "too long and too square": a short thigh, the shin slanting from the knee, a small boot)
/* the sprite: a figure on foot in a 24×19 frame (the man at 4, 3), or a rider on its mount in 32×32, its gear on it (figures.js
   FigureRig), laid in a grid GEAR.room px wider each way and taller, outlined round it all, cut to the frame grown only where the
   gear reaches past it (a pike, a lance, a blade raised), so nothing is cut off; then placed in its power-of-two cell (sprites.js
   cellOf), its feet on the bottom row and its middle the cell's */
function peopleSprite(o,pose,bare){
  // (pose 1: a breath in, walk -2)
  // (19-22: climbing, walk 8-11; 23-26: descending, walk 12-15; a rider's mount just walks)
  const walk=pose===1?-2:pose>=2&&pose<=5?pose-2:pose>=15&&pose<=18?pose-11:pose>=19&&pose<=26?(o.mount?(pose-19)%4:pose-11):-1,blow=pose>=6&&pose<=14,
    fist=pose>=FIST_POSE&&pose<FIST_POSE+12,atk=blow?(pose-6)%3:fist?(pose-FIST_POSE)%3:-1,style=fist?FIST_STYLES[(pose-FIST_POSE)/3|0]:LIFE_POSES[pose]||(!blow?null:pose>=12?'overhead':pose>=9?'thrust':'swing');// (fist: bare hands; LIFE_POSES: struck, glancing, shifting: sprites.js)
  // (bare: the melee weapon left off, to be held apart: weapons.js; DEF_POSE: standing, his shield raised before him)
  if(bare&&heldWeapon(o))o={...o,weapon:null,held:heldWeapon(o)};if(pose===DEF_POSE||pose===DEF_LOW)o={...o,guardUp:pose===DEF_LOW?'low':true};
  const R=GEAR.room;
  if(o.mount){const g=pgrid(32+2*R,32+R),top=drawMount(g,o,walk,R,R),A=drawFigure(g,{...o,shield:null,offShield:null},6+R,top-6,-1,style,atk,12);
    // the rider's leg down the mount's side (the owner, 2026-11-04: the rider looked low, "show more of him"): his thigh forward
    // from the hip over the cloth, the knee, the shin down the horse's side and his foot, outlined on its own so it reads
    // against the cloth (RIDER_LEG: [x, y from the seat row, letter] each)
    const leg=RIDER_LEG.map(([x,y,k])=>[x+R,top+y,riderLegCol(o,k,x,y)]),on=new Set(leg.map(([x,y])=>x+','+y));
    if(!(DOLL_FIGS.on&&DOLL_FIGS.edge&&g.body))for(const [x,y] of leg)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(y+dy);if(!on.has(k)){on.add(k);pset(g,x+dx,y+dy,PEOPLE_OUT)}}
    for(const [x,y,c] of leg)pset(g,x,y,c);return FigureRig.frame(g,R,32,A,32-(top-R-6),false)}
  const g=pgrid(24+2*R,19+R),A=drawFigure(g,o,4+R,3+R,walk,style,atk);return FigureRig.frame(g,R,24,A,o.short?15:16,!!o.held&&(blow||pose===FLINCH_POSE));
}

/* the world map's own figures (doc/WORLD_DESIGN.md §10.1), smaller than the battle's, so a person is clearly smaller than a
   house: a person 4 × 9 inside the outline (6 × 10 with it, over the outline under the feet; a dwarf a row shorter), a 3-px head,
   the shoulders and the front in the side's colours, a belt, legs and feet. PEOPLE_MAP_T uses the battle template's letters
   (lettersOf), so every look maps one to one; a small helm, beard, shield, cape and load go over it, and what is in the hand
   stands in a column before him (MAP_HELD). walk 0 to PEOPLE_STEPS-1, a step each WALK.foot px walked (render.js stepOf), 0
   standing (MAP_WALK). cut: only the rows down to it (a rider, a sailor at the rail). Since 2026-11-01 the map's people are the
   battle's figures (MAP_FIGS, below): these stay for the map off the march (WORLD_BATTLE.on false), the menu's art, the cards,
   and MAP_FIGS.on false */
const PEOPLE_MAP_T=['.112','.2se','..tu','apqc','bpqd','bqrd','bkld'];
/* the map's walk, PEOPLE_STEPS frames, facing right: the near leg's x and the far leg's on the legs' row (L, M: a hip each), and
   the feet, [x, lifted] (a lifted foot drawn on the legs' row, nothing under it). Passing (the feet together; 0 is standing too),
   the far foot swinging through lifted, the stride (contact), the back foot lifting off; then the same with the near leg ahead */
const PEOPLE_STEPS=8,MAP_WALK=[[1,2,[[1],[2]]],[1,2,[[1],[3,1]]],[1,2,[[0],[3]]],[1,2,[[0,1],[3]]],[2,1,[[1],[2]]],[2,1,[[1],[3,1]]],[2,1,[[0],[3]]],[2,1,[[0,1],[3]]]];
// what is in the hand: [top row, bottom row, material, head] (above the legs' row, so no gap is shut in by a striding foot)
const MAP_HELD={sword:[2,4,'steel','guard'],great:[1,4,'steel','guard'],dagger:[3,4,'steel','guard'],axe:[2,6,'wood','axe'],bigaxe:[1,6,'wood','axe'],
  hammer:[2,6,'wood','hammer'],spear:[0,6,'wood','tip'],pike:[0,6,'wood','tip'],javelin:[1,6,'wood','tip'],lance:[0,6,'wood','tip'],staff:[0,6,'wood','gem'],
  hoe:[1,6,'wood','hoe'],pick:[2,6,'wood','pick'],crook:[0,6,'wood','crook'],rod:[1,6,'wood','rod'],bow:[2,6,'wood','bow'],longbow:[1,6,'wood','bow'],
  xbow:[5,5,'wood','xbow'],sling:[6,6,'leather','sling'],lute:[2,5,'wood','lute']};
function drawMapFigure(g,o,ox,oy,walk,cut){FigureRig.dress(g,o,drawMapBody(g,o,ox,oy,walk,cut),null,-1)}
// (its body: the template, its legs, cape, beard and helm; returns its anchors, as drawFigureBody's: the hand (3, 5), the shield
// arm (a shield slung behind him, its top), the back (his corner: a load's pixels are from it), ly the legs' row, cut)
function drawMapBody(g,o,ox,oy,walk,cut){
  const T=o.short?PEOPLE_MAP_T.filter((r,i)=>i!==4):PEOPLE_MAP_T,Lc=lettersOf(o),set=(x,y,c)=>pset(g,ox+x,oy+y,c),ly=T.length,w=walk>0?walk%PEOPLE_STEPS:0,S=MAP_WALK[w];
  T.forEach((row,y)=>{if(cut==null||y<=cut)[...row].forEach((c,x)=>{if(c!=='.')set(x,y,Lc[c])})});
  // the legs by the stride (MAP_WALK), or a robe to the ground, the feet under its hem
  if(cut==null){if(o.robe){[Lc.b,Lc.c,Lc.c,Lc.d].forEach((c,x)=>set(x,ly,c));for(const [x,up] of S[2])if(!up)set(x,ly+1,Lc.d)}
    else{set(S[0],ly,Lc.L);set(S[1],ly,Lc.M);for(const [x,up] of S[2])set(x,up?ly:ly+1,Lc.F)}}
  if(o.cape){const C=pal(o.cape===true?o.team:o.cape);for(let y=3;y<ly&&(cut==null||y<=cut);y++)set(0,y,C[y===3?1:2])}
  const Bd=o.beard&&pal(o.beard);if(Bd){set(2,2,Bd[1]);set(3,2,Bd[2]);if(o.short)set(3,3,Bd[3])}
  if(o.ears)set(0,1,Lc.s);if(o.tusk)set(3,2,'#faf8db');if(o.scar)set(2,2,PEOPLE_SCAR);
  // the helm over the 3-px head: its top row (the face's row under a great helm, with its slit), a brim, horns, a plume
  const M=pal(o.helmC||(o.helm==='great'&&o.outer==='iron'?'iron':'steel')),h=o.helm,top=(a,b,c)=>{set(1,0,a);set(2,0,b);set(3,0,c)},Wt=PPAL.white;
  if(h==='cap'||h==='kettle'||h==='horned'||h==='great'||h==='plume')top(M[0],M[1],M[2]);
  if(h==='kettle')set(0,1,M[2]);
  if(h==='great'||h==='plume'){set(1,1,M[1]);set(2,1,M[2]);set(3,1,PEOPLE_OUT);set(2,2,M[2]);set(3,2,M[3]);if(h==='plume')set(1,0,PPAL.red[1])}
  if(h==='horned'){set(0,0,Wt[1]);set(4,0,Wt[2])}
  if(h==='hood'){const C=pal(o.hood||'olive');top(C[0],C[1],C[2]);set(1,1,C[1]);set(1,2,C[2])}
  if(h==='wizard'){const C=PPAL.purple;top(C[0],C[1],C[2]);set(0,1,C[2]);set(4,1,C[3])}
  if(h==='straw'){const C=PPAL.cloth;top(C[0],C[1],C[1]);set(0,1,C[2]);set(4,1,C[2])}
  if(h==='crown')top(PPAL.gold[1],PPAL.red[1],PPAL.gold[2]);
  if(h==='circlet'){set(2,0,PPAL.gold[1]);set(3,0,PPAL.gold[2])}
  if(h==='bandage'){set(0,1,'#d8d2c4');set(1,1,'#f2efe6');set(2,1,'#a8302a');set(3,1,'#f2efe6');set(4,1,'#d8d2c4')}// (a bandage round the brow, blood on it: one tended on the road)
  if(h==='skull'){top(Wt[0],Wt[1],Wt[2]);set(3,1,PEOPLE_OUT)}
  return{hand:[ox+3,oy+5],off:[ox-1,oy+3],back:[ox,oy],ly,cut,map:true};
}
// a load carried on the back (the left of a figure facing right): a sack, a churn, logs, a basket or a sack of ore
const LOADS={farmer:['sack','#ece4cc'],herder:['churn','#d8dce4'],woodcutter:['logs','#9a6436'],miner:['sack','#7a808e'],fisher:['basket','#a8804e'],quarry:['sack','#a8a49a'],pack:['pack','#8a6a44'],
  bundle:['bundle','#8a7458'],builder:['planks','#b08a58']};// (builder: planks over his shoulder, a building site's carrier: structures.js drawSite)// (bundle: a refugee's blanket rolled over his shoulders, a sack under it: MAP_FIGS only)
function drawMapLoad(set,job){const L=LOADS[job]||LOADS.farmer,R=rampOf(L[1]);
  if(L[0]==='logs'){set(-1,2,'#e8c890');set(-1,3,R[0]);set(-1,4,R[2]);set(-1,5,'#c8a070');return}
  set(-1,3,R[0]);set(-1,4,R[1]);set(-1,5,R[2]);
  if(L[0]==='pack'){set(-1,2,R[0]);set(-2,3,R[1]);set(-2,4,R[2]);set(-2,5,R[3])}// (a peddler's: a tall pack, two wide)
  if(L[0]==='sack')set(-1,5,R[3]);if(L[0]==='churn')set(-1,3,R[3]);if(L[0]==='basket')set(-1,3,'#9ab8c8')}
// (a map figure's grid: a person's interior placed at (3, 1: his middle on a 16 cell's), room round it for a load on his back and
// what is in his hand, and GEAR.mapRoom rows over his head for a pole, cut away again but the one its outline takes; f the step,
// cut as drawMapFigure)
const MAP_OX=3;
function mapGrid(o,f,cut){const R=GEAR.mapRoom,g=pgrid(11,11-(o.short?1:0)-(cut!=null?PEOPLE_MAP_T.length+1-cut:0)+R);drawMapFigure(g,o,MAP_OX,1+R,f,cut);
  const t=Math.max(0,Math.min(R,ptop(g)-1));return pcrop(g,0,t,g.w,g.h-t)}

/* a party's leader on the map: on foot a person, his sword (or, a bandit, his spear) in his hand; a lord (or you, mounted) on a
   horse of the map's own, 11 × 6 inside its outline (13 × 8 with it), the rider seated on it to his belt (12 high): in a 16×16
   cell, its feet on the bottom row but one. No banner in the hand: the party's banner floats over it, a sprite of its own
   (sprites.js bannerSprite, render.js drawBanners). f: the step (0 to PEOPLE_STEPS-1: on foot a step each WALK.foot px; mounted,
   the horse's legs a step each WALK.ride px); mountCol: the horse's coat. The horse's walk: its legs (far hind, near hind, far
   fore, near fore; HORSE_STRIDE: the hooves' x) gathered under it, the near pair swinging forward lifted (HORSE_LIFT, a bit a leg: its hoof drawn up on the
   legs' row: a pixel ahead swinging forward, its own lifting off), the stride, the far pair lifting off behind, gathered, the far pair swinging, the other stride, the near pair lifting */
const MAP_HORSE=['.........hh','........hHe','.mhhhhhhHd.','m.HHHHHHHd.'],HORSE_LEGS=[2,3,7,8];
const HORSE_UNDER=[0,0,0,0],HORSE_STRIDE=[HORSE_UNDER,[0,1,0,1],[-1,1,-1,1],HORSE_UNDER,HORSE_UNDER,[1,0,1,0],[1,-1,1,-1],HORSE_UNDER],HORSE_LIFT=[0,10,0,5,0,5,0,10];
// (the map's horse on its own in g, its body's top left at (X, H0), its coat mountCol, step f: a rider seated on it (mapFigure), or
// a saddle on an empty one (a runaway: encounterscene.js roadHorse); returns its pixel setter)
function drawMapHorse(g,mountCol,f,X,H0){const H=pal(mountCol),Mn=pal('dark'),hs=(x,y,c)=>pset(g,X+x,H0+y,c);
  MAP_HORSE.forEach((r,y)=>[...r].forEach((c,x)=>{const col={h:H[0],H:H[1],d:H[2],k:'#27272c',e:'#27272c',m:Mn[2]}[c];if(col)hs(x,y,col)}));
  // the legs: the far pair in shade behind, the near pair over them; the lower half stepping by the stride
  HORSE_LEGS.forEach((x,i)=>{const near=i%2===1,dx=HORSE_STRIDE[f][i];if(HORSE_LIFT[f]>>i&1)hs(x+dx,4,'#27272c');else{hs(x,4,near?H[1]:H[2]);hs(x+dx,5,'#27272c')}});
  return hs}
function mapFigure(o,f,mountCol){
  f=(f||0)%PEOPLE_STEPS;
  if(mountCol){const g=pgrid(15,16),H0=9,X=2,hs=drawMapHorse(g,mountCol,f,X,H0);
    // the rider to his belt, his near leg down the horse's side
    drawMapFigure(g,{...o,weapon:null,shield:null,cape:null},X+2,H0-3,-1,4);
    const Lc=lettersOf(o);hs(3,3,Lc.L);hs(3,4,Lc.F);
    poutline(g);return cellOf(pcanvas(g))}
  return mapPerson({...o,weapon:o.weapon||'sword'},f);
}

/* the world map's people beside the lords, every one the same small figure (a soldier, a worker and a lord stand alike) in a
   16×16 cell: a lord's followers in his colour and of his race, armed (a bandit's hooded); a worker with the tool of the trade;
   a refugee with a blanket on the back. f: the step (0 to PEOPLE_STEPS-1), cut: as drawMapFigure (a sailor at the rail: ships.js) */
function mapPerson(o,f,cut){const g=mapGrid(o,f,cut);poutline(g);return cellOf(pcanvas(g))}
function followerSprite(col,f,v,race,band){v=(v||0)%6;f=(f||0)%PEOPLE_STEPS;race=race||'human';const k='fw'+col+f+v+race+(band?'b':''),c=FIGURES.get(k);if(c)return c;
  return FIGURES.set(k,mapPerson(followerLook(col,v,race,band),f))}
// (a follower's look: his lord's colour and race, armed, a shield now and then; a band's hooded and ragged)
function followerLook(col,v,race,band){const R=RACE_LOOK[race]||RACE_LOOK.human,arms=['spear','spear','sword','spear','axe','spear'][v];
  return{race,skin:R.skin[v%R.skin.length],hair:R.hair[v%R.hair.length],eye:R.eye,ears:R.ears,tusk:R.tusk,short:R.short,beard:R.beard?R.hair[v%R.hair.length]:null,
    helm:band?(v%3?'hood':'bare'):['kettle','cap','kettle','bare','kettle','cap'][v],hood:'leather',outer:band?['leather','fur','cloth'][v%3]:v%3===2?'leather':'steel',inner:'dark',team:col,
    weapon:band?['spear','axe','dagger','spear','sword','axe'][v]:arms,shield:!band&&(v===2||v===4)?'wood':null,shortHair:v%2===0}}
// a worker in the fields: the trade's clothes and tool (economy.js JOBS), the home's race
const WORK_LOOK={farmer:{helm:'straw',outer:'cloth',team:'linen',weapon:'hoe'},herder:{helm:'hood',hood:'leather',outer:'fur',team:'leather',weapon:'crook'},
  woodcutter:{helm:'bare',outer:'forest',team:'leather',weapon:'axe'},miner:{helm:'cap',helmC:'iron',outer:'leather',team:'dark',weapon:'pick'},fisher:{helm:'bare',outer:'blue',team:'linen',weapon:'rod'},
  builder:{helm:'cap',helmC:'leather',outer:'linen',team:'leather',weapon:'hammer'}};
// (the peasants recruited from the estates wear their trade's clothes and carry its tool: data/units.js TRADES)
for(const k in ST)if(ST[k].peasant){const {team,...L}=WORK_LOOK[ST[k].peasant]||{...WORK_LOOK.miner,weapon:'hammer'};PEOPLE_LOOK[k]=L}
function workerSprite(job,f,race,v,carry){v=(v||0)%4;f=(f||0)%PEOPLE_STEPS;race=race||'human';const k='wk'+job+f+race+v+(carry?'c':''),c=FIGURES.get(k);if(c)return c;
  return FIGURES.set(k,mapPerson(workerLook(job,race,v,carry),f))}
const workerLook=(job,race,v,carry)=>{const L={...folkLook('folk',race,v*3+1),robe:false,...(WORK_LOOK[job]||WORK_LOOK.farmer)};if(carry){L.weapon=null;L.load=job}return L};// (loaded: his tool left behind)
// a refugee: worn clothes, a hood, a rolled blanket on the back, a walking stick now and then
function refugeeSprite(f,v){v=(v||0)%4;f=(f||0)%PEOPLE_STEPS;const k='rf'+f+v,c=FIGURES.get(k);if(c)return c;
  return FIGURES.set(k,mapPerson(refugeeLook(v,'human'),f))}
const refugeeLook=(v,race)=>({...folkLook('folk',race,v*5+2),robe:false,helm:v%2?'hood':'bare',hood:'linen',outer:['linen','cloth','leather','linen'][v],team:'dark',cape:'leather',weapon:v===1||v===3?'crook':null});

/* townsfolk: the same figures in their trade's clothes (and folk in all sorts, a dress now and then), their race's skin and hair */
const FOLK_CLOTH=['cloth','linen','olive','teal','violet','rust','forest','leather','blue','red'];
function folkLook(look,race,v){
  const R=RACE_LOOK[race]||RACE_LOOK.human,n=v>>>0,o={race,skin:R.skin[n%R.skin.length],hair:R.hair[(n*5+1)%R.hair.length],eye:R.eye,ears:R.ears,tusk:R.tusk,short:R.short,
    beard:R.beard?R.hair[(n*5+1)%R.hair.length]:race==='human'&&n%4===1?R.hair[(n*5+1)%R.hair.length]:null,helm:'bare',outer:FOLK_CLOTH[n%FOLK_CLOTH.length],
    inner:'dark',team:FOLK_CLOTH[(n*3+2)%FOLK_CLOTH.length],shortHair:n%2===0,robe:look==='folk'&&n%3===0};
  const T={smith:{outer:'leather',team:'dark',weapon:'hammer',beard:o.beard||R.hair[0]},innkeeper:{outer:'linen',team:'white'},merchant:{outer:'purple',team:'gold',helm:'hood',hood:'purple'},
    priest:{outer:'white',team:'gold',robe:true,helm:'hood',hood:'white',beard:null},steward:{outer:'blue',team:'gold',robe:true},groom:{outer:'cloth',team:'leather',helm:'kettle',helmC:'#d8c060'}}[look];
  return T?{...o,...T}:o;
}

/* ---------- the map's people in the battle's figures (the owner, 2026-11-01: "can you update encounters and old sprites to look
   like current sprite designs?"). Every person on the world map is drawn as its marchers are (march.js drawMarcher): the battle's
   template and gear (peopleSprite, figures.js), at the battle's density, drawn figK() as big (drawFig), each in its own clothes
   with its own things: a follower's arms in his colour, a worker's tool or his load, a refugee's bundle, a peddler's pack, the
   wounded's blood and bandage, a rider's horse, a sailor at the rail. They walk as the marchers do (figPose: the battle's four
   steps, a step each WALK.foot px walked), standing at 0. Each made once and kept in FIGURES by its key, in its cell (sprites.js
   cellOf), dense (drawn at the guards' size: encounterscene.js). figsOn(): MAP_FIGS.on while the march draws its men (off the
   march, WORLD_BATTLE.on false, the map keeps its small figures throughout); off, the map's own small figures as before
   (mapPerson, mapFigure): the proof (tests/mapfigs.js) ---------- */
const MAP_FIGS={on:true};
const figsOn=()=>MAP_FIGS.on&&WORLD_BATTLE.on;
// (the map px to a figure's px, as the marchers'; a map walk frame f (0 to WALK.n-1) as a pose: walking (go) the battle's steps,
// else standing)
const figK=()=>WORLD_BATTLE.sprite/WORLD_BATTLE.scale,figPose=(f,go)=>go?2+(f||0)%4:0;
// one drawn with its feet at (x, y) on the screen, facing face, as a marcher is; its picture at the map's own size (a click, a
// box, a page's banner: figPic)
function drawFig(s,x,y,face){const k=figK();ctx.save();ctx.translate(x,y);ctx.scale(face<0?-k:k,k);ctx.drawImage(s,-(s.width>>1),2-s.height);ctx.restore()}
const FIG_PICS=new WeakMap();
function figPic(s){let m=FIG_PICS.get(s);if(m)return m;const k=figK();m=mkc(Math.ceil(s.width*k),Math.ceil(s.height*k),g=>g.drawImage(s,0,0,s.width*k,s.height*k));
  m.cw=Math.ceil((s.cw||s.width)*k);m.ch=Math.ceil((s.ch||s.height)*k);FIG_PICS.set(s,m);return m}
// (made once by its key (mk: its cell), kept, dense)
const figKeep=(k,mk)=>FIGURES.get(k)||FIGURES.set(k,Object.assign(mk(),{dense:true}));
const figOf=(L,pose)=>cellOf(peopleSprite(L,pose));
// a lord's follower (followerLook), a worker (workerLook; carry: loaded), a refugee (his bundle on his back), one of a road
// encounter (ENC_LOOK[key]) on foot or riding (on a horse of coat, in col), a saddled horse no one rides
function figFollower(col,v,race,band,pose){v=(v||0)%6;race=race||'human';return figKeep('mfw'+col+v+race+(band?'b':'')+'p'+pose,()=>figOf(followerLook(col,v,race,band),pose))}
function figWorker(job,race,v,pose,carry){v=(v||0)%4;race=race||'human';return figKeep('mwk'+job+race+v+(carry?'c':'')+'p'+pose,()=>figOf(workerLook(job,race,v,carry),pose))}
function figRefugee(v,race,pose){v=(v||0)%4;race=race||'human';return figKeep('mrf'+v+race+'p'+pose,()=>figOf({...refugeeLook(v,race),load:'bundle'},pose))}
function figRoad(key,race,v,pose){return figKeep('mrp'+key+race+v+'p'+pose,()=>figOf(ENC_LOOK[key](race,v),pose))}
function figRider(key,race,v,col,coat,pose){return figKeep('mrr'+key+race+v+col+coat+'p'+pose,()=>figOf({...ENC_LOOK[key](race,v),team:col||'leather',mount:'horse',mountC:coat||'horse'},pose))}
function figHorse(coat,pose){return figKeep('mrh'+coat+'p'+pose,()=>{const g=pgrid(32,32);g.edge=true;drawMount(g,{mount:'horse',mountC:coat,team:'red',saddled:true},pose>=2?pose-2:-1);poutline(g);return cellOf(pcanvas(g))})}
// a worker on the march's map carrying his load to his holding (folk.js): his trade's battle kind (type, v) in his holding's
// cloth (tint), his tool left behind
function figCarrier(type,v,tint,job,pose){return figKeep('mca'+type+v+tint+job+'p'+pose,()=>figOf({...lookOf(type,0,false,v%6),team:tint,weapon:null,load:job},pose))}
/* kneeling: the body FIG_KNEEL rows down, sat back on its heels, the near knee forward and the far foot out behind (a robe's hem on
   the ground); lying: the standing figure turned a quarter, head to the right, as the battle's fallen are (sprites.js corpseOf);
   blood: in a pool of it (FIG_BLOOD: [colour, x, y, w, h] in a 16 cell's px, as the map's was, grown to its own) */
const FIG_KNEEL=2,FIG_BLOOD=[['#5a1414',3,13,10,1],['#6e1a18',1,14,14,1],['#8a2a22',5,14,5,1],['#5a1414',3,15,10,1]];
function figKneel(key,race,v){return figKeep('mrk'+key+race+v,()=>{const L=ENC_LOOK[key](race,v),R=GEAR.room,g=pgrid(24+2*R,19+R+(dollable(L)?1-DOLL_FIGS.dy:0)),sh=L.short?1:0,ox=4+R,gy=3+R+14-sh+(dollable(L)?DOLL_FIGS.dy:0);// (a doll's knees on the row his feet stand on, his grid as tall as his standing one's)
  // (a doll in its own kneeling pose, one knee down and the other up (dollfigs.js DOLL_MOVES.kneel); the old figure cut at its knees)
  const D=dollable(L),A=D?drawFigure(g,L,ox,3+R,-1,'kneel',-1):drawFigure(g,L,ox,3+R+FIG_KNEEL,-1,null,-1,12-sh);
  if(!L.robe&&!D){const Lc=lettersOf(L);pset(g,ox+11,gy-1,Lc.L);pset(g,ox+11,gy,Lc.M);pset(g,ox+12,gy,Lc.F);pset(g,ox+2,gy,Lc.F);pset(g,ox+1,gy,Lc.F)}
  // (on the ground whatever he wears: a robe's hem, a short man's knees, set down on the row a standing doll's feet take, whatever
  // his race: 3 + R + 15)
  if(dollable(L)){let lo=-1;for(let i=0;i<g.p.length;i++)if(g.p[i])lo=Math.max(lo,(i/g.w)|0);const d=3+R+15+DOLL_FIGS.dy-lo;if(lo>=0&&d!==0){if(d>0){g.p.copyWithin(d*g.w,0,g.p.length-d*g.w);g.p.fill(null,0,d*g.w)}else{g.p.copyWithin(0,-d*g.w);g.p.fill(null,g.p.length+d*g.w)}
    if(g.body)g.body=new Set([...g.body].map(i=>i+d*g.w).filter(i=>i<g.p.length));for(const k of FIG_ANCHORS)if(A[k])A[k]=[A[k][0],A[k][1]+d]}}
  return cellOf(FigureRig.frame(g,R,24,A,16-FIG_KNEEL-sh,false))})}
function figDown(key,race,v,blood){return figKeep('mrd'+key+race+v+(blood?'b':''),()=>{
  if(blood){const b=figDown(key,race,v),n=b.width,s=n/16,c=mkc(n,n,g=>{for(const [col,x,y,w,h] of FIG_BLOOD)rect(g,col,x*s,y*s,w*s,h*s);g.drawImage(b,0,-s)});c.cw=b.cw;c.ch=b.ch+s;return c}
  const g=pgrid(24,20);drawFigure(g,{...ENC_LOOK[key](race,v),weapon:null,load:null},4,3,-1,null,-1);const L=pturn(g);let h=L.h;
  while(h>1&&!L.p.slice((h-1)*L.w,h*L.w).some(Boolean))h--;L.h=h+1;L.p.length=L.w*L.h;L.p.fill(null,h*L.w);poutline(L);return cellOf(pcanvas(L))})}
// a sailor at the rail (ships.js): head and shoulders over the side, down to the figure's row FIG_RAIL, its last row the picture's
// but one (the outline under it); mx: his head's middle
const FIG_RAIL=8;
function figCrew(L){const g=pgrid(24,FIG_RAIL+5);drawFigure(g,L,4,3,-1,null,-1,FIG_RAIL);poutline(g);const t=ptop(g),c=pcanvas(pcrop(g,0,t,24,g.h-t));c.mx=11;return c}
