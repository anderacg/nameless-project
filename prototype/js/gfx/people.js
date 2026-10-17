'use strict';
/* ---------- people and troops, drawn from one template (the style of the Basic Humanoid II pack): a figure about 10×15 in a 16×16
   cell, a 5-wide rounded head looking the way it faces, the arms inside the body's outline, a dark navy outline round the
   silhouette, the pack's own colours. Every soldier is the template in its kind's colours (PEOPLE_LOOK) with a helm, a shield and
   a weapon over it, and one of six variants (skin, hair, beard, a helm for the plain troops, a shade of cloth) so a line of them is
   not one man copied. Riders sit on a mount of their race (horse, stag, ram, wolf) in a 32×32 cell, the same rider above the belt.
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
const PEOPLE_OUT='#1a1c26';
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
  wool:['#ffffff','#ece4d4','#c8bca8','#948a78'],wolf:['#c8ccd4','#9aa0ac','#6a707e','#454a56'],warg:['#7a7480','#56505e','#3a3642','#26222c']
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
  tavi:{helm:'hood',hood:'forest',outer:'forest',weapon:'bow',hair:'brown'},
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
  hum_xbow:{helm:'kettle',outer:'leather',weapon:'xbow'},hum_hbow:{helm:'hood',hood:'olive',outer:'leather',weapon:'bow',mount:'horse'},
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
function poutline(g){const o=[];for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++)if(!pget(g,x,y)&&(pget(g,x-1,y)||pget(g,x+1,y)||pget(g,x,y-1)||pget(g,x,y+1)))o.push([x,y]);for(const [x,y] of o)pset(g,x,y,PEOPLE_OUT)}
// (the grid turned a quarter clockwise, pixel for pixel: what stood up now lies, head to the right)
function pturn(g){const r=pgrid(g.h,g.w);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const c=g.p[y*g.w+x];if(c)r.p[x*r.w+(g.h-1-y)]=c}return r}
function pcanvas(g){return mkc(g.w,g.h,x=>{for(let y=0;y<g.h;y++)for(let i=0;i<g.w;i++){const c=g.p[y*g.w+i];if(c){x.fillStyle=c;x.fillRect(i,y,1,1)}}})}

// a soldier's whole look: its kind's, its race's, its variant's; the hero's and a companion's from their gear
function lookOf(type,team,hero,v,cid,cg){
  const st=ST[type],race=hero?P.race:(st&&st.race)||(PEOPLE_LOOK[type]&&PEOPLE_LOOK[type].race)||'human',R=RACE_LOOK[race]||RACE_LOOK.human;
  let L=hero?{helm:'crown',outer:'steel',weapon:'sword',cape:true}:PEOPLE_LOOK[cid||type]||PEOPLE_LOOK[st&&st.look]||PEOPLE_LOOK.militia;
  L={...L};v=v||0;
  const o={race,skin:R.skin[v%R.skin.length],hair:L.hair||R.hair[v%R.hair.length],eye:R.eye,ears:R.ears,tusk:R.tusk,short:R.short,
    beard:L.beard||(R.beard?(L.hair||R.hair[v%R.hair.length]):race==='human'&&!hero&&v%3===1&&!L.robe?R.hair[v%R.hair.length]:null),
    helm:L.helm,hood:L.hood,outer:L.outer==='skin'?R.skin[v%R.skin.length]:L.outer,inner:L.inner||'dark',team:team?'red':'blue',weapon:L.weapon,shield:L.shield,
    robe:L.robe,cape:L.cape,mount:L.mount,barded:L.barded,shortHair:v%2===0};
  if(L.plain){o.helm=race==='orc'&&PLAIN_HELM[v]==='hood'?'bare':PLAIN_HELM[v];o.outer=PLAIN_CLOTH[v]}
  if(o.mount==='horse')o.mountC=L.barded?'horseW':['horse','chestnut','horseB','horse','horseG','chestnut'][v];
  // your hero: your race, your weapon, your armour and helm as you wear them
  if(hero||cg){const hk=hero?heroKind():cg&&cg.weapon?ITEMS[cg.weapon].kind||'melee':null,hw=hero&&P.gear.weapon?ITEMS[P.gear.weapon]:cg&&cg.weapon?ITEMS[cg.weapon]:null;
    if(hk==='ranged')o.weapon='bow';else if(hk==='magic')o.weapon='staff';
    else if(hw)o.weapon=hw.base==='spear'||hw.tag==='spear'?'spear':hw.base==='warhammer'||hw.icon==='club'?'hammer':hw.base==='dagger'||hw.icon==='dagger'?'dagger':hw.base==='axe'||hw.icon==='axe'?'axe':hw.base==='great'||hw.base==='greatsword'?'great':'sword';
    const body=hero?P.gear.body:cg&&cg.body,head=hero?P.gear.head:cg&&cg.head;
    if(body&&ITEMS[body]&&ITEMS[body].col)o.outer=ITEMS[body].col;if(head&&ITEMS[head]&&ITEMS[head].col){o.helm=hero?'crown':'kettle';o.helmC=ITEMS[head].col}}
  if(hero){o.cape=true;o.beard=null;o.hair=R.hair[0]}
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
/* a figure into grid g at (ox, oy): the template, then its head, shield and weapon. walk: -1 or 0-3; atk: -1 or 0-2 with style */
function drawFigure(g,o,ox,oy,walk,style,atk,cut){
  const run=walk>=4&&walk<8,climb=walk>=8&&walk<12,desc=walk>=12,T=o.short?PEOPLE_T_SHORT:PEOPLE_T,Lc=lettersOf(o),sh=o.short?1:0;
  const bob=run?RUN_BOB[walk-4]:climb?CLIMB_BOB[walk-8]:desc?DESC_BOB[walk-12]:walk===1||walk===3||walk===-2?-1:0,lean=run?9:desc?6:0;
  // (climbing: bent double, the head two pixels forward and the shoulders one, all above the belt a pixel lower)
  const set=climb?(x,y,c)=>pset(g,ox+x+(y<6?2:y<9?1:0),oy+y+(y<9?1:0)+(y<13-sh?bob:0),c):(x,y,c)=>pset(g,ox+x+(y<lean?1:0),oy+y+(y<13-sh?bob:0),c);
  T.forEach((row,y)=>{if(cut!=null&&y>cut)return;[...row].forEach((c,x)=>{if(c==='.'||c==='L'||c==='M'||c==='F')return;set(x,y+(o.short&&y>=9?0:0),Lc[c])})});
  const ly=13-sh;
  // legs and feet (by the stride), or a robe to the ground
  if(cut==null){if(o.robe){for(let x=4;x<=9;x++)set(x,ly,x<6?Lc.b:x<8?Lc.c:Lc.d);set(5,ly+1,Lc.d);set(8,ly+1,Lc.d)}
    else{const s=run?STRIDE_RUN[walk-4]:climb?STRIDE_CLIMB[walk-8]:desc?STRIDE_DESC[walk-12]:STRIDE[walk<0?2:walk],k=climb&&walk&1?1:0;/* (standing or breathing: the standing stride; climbing, the front knee up: k) */
      set(s[0],ly,Lc.L);set(s[0]+1,ly,Lc.L);set(s[1],ly-k,Lc.L);set(s[1]+1,ly-k,Lc.M);set(s[2],ly+1,Lc.F);set(s[3],ly+1-k,Lc.F)}}
  // short hair: off the shoulders
  if(o.shortHair&&!o.robe){set(5,7,Lc.a);set(9,7,Lc.c);set(5,6,Lc.t)}
  if(o.cape){const C=pal(o.cape===true?o.team:o.cape);for(let y=7;y<=12-sh;y++){set(2,y,C[2]);set(3,y,y===7?C[1]:C[2])}set(2,12-sh,C[3])}
  const B=o.beard&&pal(o.beard);
  if(B){set(6,5,B[1]);set(7,5,B[1]);set(8,5,B[0]);set(9,5,B[1]);set(6,6,B[2]);set(7,6,B[1]);set(8,6,B[1]);set(9,6,B[2]);if(o.short){set(7,7,B[2]);set(8,7,B[3])}}
  if(o.ears){set(4,3,Lc.s);set(4,4,Lc.t)}
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
  // the shield on its left, in front
  if(o.shield){const C=pal(o.shield),Tm=pal(o.team);for(let y=8;y<=11-sh;y++){set(2,y,C[1]);set(3,y,y===8?C[0]:C[2])}set(2,9,Tm[1]);set(2,10-sh,Tm[2]);set(3,12-sh,C[3]);set(2,12-sh,C[2])}
  drawWeapon(g,o,ox,oy+bob,style,atk,sh);
  return[ox+11,oy+bob+10-sh];// (the weapon hand: weapons.js holds a weapon there)
}
// the weapon in its right hand: upright at rest; in a blow, swung from the hand at the frame's angle (as the old figures did)
const WPN={sword:[6,'steel','guard'],great:[9,'steel','guard'],dagger:[4,'steel','guard'],axe:[7,'wood','axe'],bigaxe:[9,'wood','bigaxe'],hammer:[7,'wood','hammer'],
  spear:[12,'wood','tip'],pike:[15,'wood','tip'],javelin:[10,'wood','tip'],lance:[16,'wood','pennant'],
  hoe:[10,'wood','hoe'],pick:[8,'wood','pick'],crook:[12,'wood','crook'],rod:[13,'wood','rod']};// (workers' tools: the world map, folk.js)
const SWING={swing:[[-3,-4,-125],[1,-1,-5],[0,1,55]],thrust:[[-2,-1,-8],[2,-1,0],[0,-1,0]],overhead:[[-2,-6,-95],[0,-5,-35],[1,0,70]]};
function drawWeapon(g,o,ox,oy,style,atk,sh){
  const k=o.weapon;if(!k)return;const set=(x,y,c)=>pset(g,ox+x,oy+y,c),hx0=11,hy0=10-sh,skin=pal(o.skin)[1],W=PPAL.wood,M=PPAL.steel,Tm=pal(o.team);
  const w=WPN[k];
  if(w){const [len,mat,head]=w,col=mat==='steel'?M[1]:W[1];let hx=hx0,hy=hy0,deg=-90;
    if(atk>=0&&style){const t=(k==='spear'||k==='pike'||k==='javelin')&&style==='swing'?[[-1,-2,-40],[1,-1,-2],[0,0,25]]:SWING[style];[hx,hy,deg]=[hx0+t[atk][0],hy0+t[atk][1],t[atk][2]]}
    else if(k==='lance')deg=-62;else if(k==='rod')deg=-55;else if(k==='hoe'||k==='pick')deg=-75;
    const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),line=(x0,y0,ang,n,cl)=>{for(let i=0;i<n;i++)set(x0+Math.cos(ang)*i,y0+Math.sin(ang)*i,cl)};
    line(hx,hy,a+Math.PI,k==='spear'||k==='pike'?3:1,W[2]);line(hx,hy,a,len,col);
    const tx=hx+c*(len-1),ty=hy+s*(len-1);
    if(head==='guard'){line(hx+c,hy+s,a,len-1,M[0]);set(hx-s,hy+c,PPAL.gold[1]);set(hx+s,hy-c,PPAL.gold[2])}
    if(head==='tip'){set(tx,ty,M[1]);set(tx+c,ty+s,M[0])}
    if(head==='pennant'){set(tx,ty,M[0]);set(tx-s,ty+c,Tm[1]);set(tx-s*2,ty+c*2,Tm[2]);set(tx-s-c,ty+c-s,Tm[1])}
    if(head==='axe'||head==='bigaxe'){for(let i=1;i<=(head==='bigaxe'?3:2);i++){set(tx-s*i,ty+c*i,M[1]);set(tx-s*i-c,ty+c*i-s,M[2])}if(head==='bigaxe')for(let i=1;i<=2;i++)set(tx+s*i,ty-c*i,M[1])}
    if(head==='hammer'){for(let i=-1;i<=1;i++){set(tx-s*i,ty+c*i,M[1]);set(tx-s*i-c,ty+c*i-s,M[2])}}
    // (a tool's head, across the haft at its end: px, py the way across, forward)
    {const px=-s,py=c;
      if(head==='hoe'){set(tx+px,ty+py,M[2]);set(tx+px*2,ty+py*2,M[1]);set(tx+px*2-c,ty+py*2-s,M[1])}
      if(head==='pick'){for(const k2 of [-2,-1,1,2])set(tx+px*k2,ty+py*k2,Math.abs(k2)===1?M[1]:M[2]);set(tx+px*2-c,ty+py*2-s,M[2]);set(tx-px*2-c,ty-py*2-s,M[2])}
      if(head==='crook'){set(tx+c,ty+s,W[1]);set(tx+c+px,ty+s+py,W[1]);set(tx+px*2,ty+py*2,W[1]);set(tx+px*2-c,ty+py*2-s,W[2])}
      if(head==='rod'){for(let i=1;i<=5;i++)set(tx,ty+i,'#d8dce4')}}
    if(atk===1&&style)set(tx+c,ty+s,'#ffffff');
    set(hx,hy,skin);return}
  // (a shooter's frames: swing, the loose (drawn, the flash, at rest); thrust, the draw (half, full, held at full, the tip
  // catching the light); overhead, the reload (a bow's hand back to the quiver and an arrow nocked; a crossbow tipped down and
  // spanned; a sling's pouch filled; a staff at rest))
  const draw=style==='thrust'&&atk>=0,reload=style==='overhead'&&atk>=0;
  if(k==='bow'||k==='longbow'){const L=k==='longbow'?5:4,pull=draw?[1,2,2][atk]:reload?0:atk===0?2:0;for(let y=-L;y<=L;y++)set(hx0+1-(Math.abs(y)>=L-1?1:0),hy0+y-1,W[1]);
    for(let y=-L+1;y<=L-1;y++)set(hx0-(Math.abs(y)<2?pull:0),hy0+y-1,PPAL.white[1]);if(pull)for(let i=0;i<5;i++)set(hx0-pull+i,hy0-1,i===4?M[0]:W[2]);if(draw&&atk===2)set(hx0-pull+5,hy0-1,'#ffffff');
    if(reload){const hd=[[-2,-3],[-3,-5],[-1,-1]][atk];set(hx0+hd[0],hy0+hd[1],skin);if(atk===2)for(let i=0;i<3;i++)set(hx0-1+i,hy0-1,W[2])}
    if(atk===1&&!draw&&!reload)set(hx0+3,hy0-1,PPAL.white[0]);set(hx0,hy0-1,skin);return}
  if(k==='xbow'){if(reload){for(let i=0;i<5;i++)set(hx0+1,hy0-2+i,W[1]);for(let i=-2;i<=2;i++)set(hx0+1+i,hy0+3,M[1]);set(hx0+1,hy0-1+[2,1,0][atk],skin);set(hx0,hy0+2,skin);return}
    const up=draw&&atk>=1?-1:0;for(let i=0;i<5;i++)set(hx0-1+i,hy0+up,W[1]);set(hx0+3,hy0-1+up,M[1]);set(hx0+3,hy0+1+up,M[1]);set(hx0+3,hy0-2+up,M[2]);set(hx0+3,hy0+2+up,M[2]);if(atk===1&&!draw)set(hx0+5,hy0,PPAL.white[0]);set(hx0,hy0+up,skin);return}
  if(k==='sling'){const sw=draw?[[-2,-5],[2,-4],[-1,-6]][atk]:reload?[[0,3],[1,3],[0,2]][atk]:atk>=0?[[-2,-5],[2,-4],[2,1]][atk]:[1,2];set(hx0+sw[0],hy0+sw[1],PPAL.leather[1]);set(hx0+sw[0]/2,hy0+sw[1]/2,PPAL.cloth[2]);set(hx0,hy0,skin);return}
  if(k==='staff'){const lift=reload?0:draw?-1:atk===1?-2:atk===0?-1:0,gem=o.race==='dwarf'?PPAL.gold:o.race==='orc'?PPAL.forest:o.race==='elf'?PPAL.teal:PPAL.violet;
    for(let y=hy0-8+lift;y<=hy0+4;y++)set(hx0,y,W[1]);set(hx0,hy0-9+lift,gem[1]);set(hx0,hy0-10+lift,gem[0]);set(hx0+1,hy0-9+lift,gem[2]);if(atk===1){set(hx0-1,hy0-10+lift,gem[0]);set(hx0+1,hy0-11+lift,'#ffffff')}set(hx0,hy0,skin)}
}
// mounts: a horse (and its kin) seen from the side in a 32×32 cell, a rider's lower body hidden in it; walk 0-3 gallops
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
function drawMount(g,o,walk){
  const kind=o.mount,C=pal(kind==='horse'?o.mountC||'horse':kind==='stag'?'stag':kind==='ram'?'wool':kind),Mn=pal(kind==='ram'?'wool':kind==='wolf'||kind==='warg'?kind:'dark'),Tm=pal(o.team);
  const gal=walk>=4,y0=kind==='ram'?16:14,legs=kind==='ram'?3:5,bob=gal?[0,-1,-2,-1][walk-4]:walk===1||walk===3?-1:0;
  const wolf=kind==='wolf'||kind==='warg';(wolf?WOLF_T:MOUNT_T).forEach((r,y)=>[...r].forEach((c,x)=>{const col={H:C[1],h:C[0],d:C[2],y:C[2],m:Mn[2]}[c];if(col)pset(g,x,y0+y+bob,col)}));
  if(wolf)pset(g,28,y0+5+bob,o.team==='red'?'#ffdc04':'#ffdc04');
  // legs: a gallop of four
  // (a gallop: the legs flung out before and behind, then gathered under)
  const LX=gal?[[4,9,18,23],[7,11,15,19],[5,12,16,22],[8,10,17,19]][walk-4]:[[7,10,17,20],[6,11,16,21],[7,10,17,20],[8,9,18,19]][walk<0?0:walk];
  LX.forEach((x,i)=>{for(let y=0;y<legs;y++){pset(g,x,y0+11+y,i%2?C[2]:C[3]);pset(g,x+1,y0+11+y,i%2?C[1]:C[2])}pset(g,x,y0+11+legs,PEOPLE_OUT==='x'?0:'#27272c');pset(g,x+1,y0+11+legs,'#27272c')});
  // its kind: a stag's antlers, a ram's horns, a wolf's ears (and no mane)
  if(kind==='stag'){for(const [x,y] of [[25,-1],[24,-2],[26,-2],[23,-3],[27,-3],[28,0],[29,-1]])pset(g,x,y0+y+bob,PPAL.cloth[0])}
  if(kind==='ram'){for(const [x,y] of [[24,1],[23,2],[23,3],[24,4],[25,4]])pset(g,x,y0+y+bob,PPAL.cloth[2])}
  // a barded mount wears the side's colour; else a saddle
  if(o.barded){for(let x=7;x<=21;x++){pset(g,x,y0+6+bob,Tm[0]);pset(g,x,y0+7+bob,Tm[1]);pset(g,x,y0+8+bob,Tm[2]);pset(g,x,y0+9+bob,x%2?Tm[3]:Tm[2])}for(let x=7;x<=21;x++)pset(g,x,y0+7+bob,PPAL.gold[1])}
  else for(let x=11;x<=15;x++)pset(g,x,y0+6+bob,PPAL.leather[x<13?0:1]);
  return y0+bob;
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
  const kind=o.mount,C=pal(kind==='horse'?o.mountC||'horse':kind==='stag'?'stag':kind==='ram'?'wool':kind),Mn=pal(kind==='ram'?'wool':kind==='wolf'||kind==='warg'?kind:'dark'),Tm=pal(o.team),y0=9;
  LIE_T.forEach((r,y)=>[...r].forEach((c,x)=>{const col={H:C[1],h:C[0],d:C[2],y:C[2],m:Mn[2]}[c];if(col)pset(g,x,y0+y,col)}));
  // (the legs: the hind pair out behind, the fore pair out ahead, each ending in a hoof)
  for(const [x,dx] of [[8,-1],[11,-1],[19,1],[22,1]]){for(let k=0;k<4;k++){pset(g,x+dx*k,y0+6+k,k<2?C[2]:C[3]);pset(g,x+1+dx*k,y0+6+k,C[2])}pset(g,x+dx*4,y0+10,'#27272c');pset(g,x+1+dx*4,y0+10,'#27272c')}
  if(o.barded){for(let x=6;x<=21;x++){pset(g,x,y0+2,Tm[0]);pset(g,x,y0+3,Tm[1]);pset(g,x,y0+4,x%2?Tm[3]:Tm[2])}for(let x=6;x<=21;x++)pset(g,x,y0+3,PPAL.gold[1])}
  else for(let x=10;x<=14;x++)pset(g,x,y0+1,PPAL.leather[x<12?0:1]);
}
/* the sprite: a figure on foot in a 24×20 canvas (room round it for a raised or thrust weapon), or a rider on its mount in 32×32;
   outlined, then placed in its power-of-two cell (sprites.js cellOf) */
function peopleSprite(o,pose,bare){
  // (pose 1: a breath in, walk -2)
  // (19-22: climbing, walk 8-11; 23-26: descending, walk 12-15; a rider's mount just walks)
  const walk=pose===1?-2:pose>=2&&pose<=5?pose-2:pose>=15&&pose<=18?pose-11:pose>=19&&pose<=26?(o.mount?(pose-19)%4:pose-11):-1,blow=pose>=6&&pose<=14,atk=blow?(pose-6)%3:-1,style=!blow?null:pose>=12?'overhead':pose>=9?'thrust':'swing';
  // (bare: the melee weapon left off, to be held apart: weapons.js)
  if(bare&&heldWeapon(o))o={...o,weapon:null};
  if(o.mount){const g=pgrid(32,32),top=drawMount(g,o,walk),hand=drawFigure(g,{...o,shield:null},6,top-6,-1,style,atk,12);g.fh=32-(top-6);
    // the rider's leg down the mount's side
    const Lc=lettersOf(o);pset(g,11,top+7,Lc.L);pset(g,11,top+8,Lc.L);pset(g,11,top+9,Lc.F);poutline(g);const c=pcanvas(g);c.fh=g.fh;c.hand=hand;return c}
  const g=pgrid(24,19),hand=drawFigure(g,o,4,3,walk,style,atk);poutline(g);const c=pcanvas(g);c.fh=o.short?15:16;c.hand=hand;return c;
}

/* the world map: a party's leader in a 16×16 cell, its banner in its colour; a lord rides the battle's horse (drawMount: the same
   horse on the same scale, the same rider seated on it, above the belt) in a 32×32 cell, his banner on a pole in his hand; a
   bandit, hooded, with a spear. f: 0 or 1, the step (mounted: standing, then the legs apart); mountCol: the horse's coat */
function mapFigure(o,f,mountCol){
  const C=pal(o.team),W=PPAL.wood;
  if(mountCol){const g=pgrid(32,32),top=drawMount(g,{mount:'horse',mountC:mountCol,team:o.team},f?1:0),ry=top-6;
    drawFigure(g,{...o,weapon:null,shield:null,cape:null},6,ry,-1,null,-1,12);
    // (his leg down the horse's side, as in battle; the banner's pole from his hand to above his head, its flag at the top)
    const Lc=lettersOf(o);pset(g,11,top+7,Lc.L);pset(g,11,top+8,Lc.L);pset(g,11,top+9,Lc.F);
    for(let y=ry-2;y<=ry+12;y++)pset(g,18,y,y>ry+9?W[2]:W[1]);pset(g,18,ry-3,PPAL.gold[1]);
    [[19,-2,0],[20,-2,1],[21,-2,1],[22,-2,1],[19,-1,1],[20,-1,1],[21,-1,2],[22,-1,2],[19,0,2],[20,0,2],[21,0,3]].forEach(([x,y,k])=>pset(g,x,ry+y,C[k]));
    poutline(g);const c=pcanvas(g);c.fh=32-(ry+(f?1:0)-3);return cellOf(c)}// (fh: to the banner's top, standing: a label above it keeps still)
  const g=pgrid(16,16);drawFigure(g,{...o,shield:null,cape:null},0,0,f?0:2,null,-1);
  if(!o.weapon){for(let y=2;y<=13;y++)pset(g,12,y,W[1]);pset(g,13,2,C[0]);pset(g,14,2,C[1]);pset(g,13,3,C[1]);pset(g,14,3,C[2]);pset(g,13,4,C[2]);pset(g,11,10,pal(o.skin)[1])}
  poutline(g);return cellOf(pcanvas(g));
}

/* the world map's people beside the lords, every one the same figure (the same height: a soldier, a worker and a lord stand
   alike) in a 16×16 cell: a lord's followers in his colour and of his race, armed (a bandit's hooded); a worker with the tool of
   the trade; a refugee with a blanket on the back. f: the step (0, 1), v: the variant */
function mapPerson(o,f){const g=pgrid(16,16);drawFigure(g,o,0,0,f?0:2,null,-1);if(o.load)drawLoad(g,o.load);poutline(g);return cellOf(pcanvas(g))}
// a load carried on the back (the left of a figure facing right): a sack, a churn, logs, a basket or a sack of ore
const LOADS={farmer:['sack','#ece4cc'],herder:['churn','#d8dce4'],woodcutter:['logs','#9a6436'],miner:['sack','#7a808e'],fisher:['basket','#a8804e'],quarry:['sack','#a8a49a']};
function drawLoad(g,job){const L=LOADS[job]||LOADS.farmer,R=rampOf(L[1]),s=(x,y,c)=>pset(g,x,y,c);
  if(L[0]==='logs'){for(let x=0;x<=6;x++){s(x,6,R[0]);s(x,7,R[2])}s(0,6,R[3]);s(0,7,R[3]);s(6,6,'#e8c890');s(6,7,'#c8a070');return}
  for(const [x,y] of [[2,5],[1,6],[2,6],[3,6],[1,7],[2,7],[3,7],[1,8],[2,8],[3,8],[2,9]])s(x,y,x===1||y===5?R[0]:x===3||y===9?R[2]:R[1]);
  if(L[0]==='sack'){s(2,4,R[2]);s(2,5,R[2])}
  if(L[0]==='churn'){s(1,5,R[2]);s(3,5,R[2]);s(2,4,R[3])}
  if(L[0]==='basket'){s(2,6,'#9ab8c8');s(3,6,'#c8dce8');s(1,8,R[3]);s(3,8,R[3])}}
function followerSprite(col,f,v,race,band){v=(v||0)%6;race=race||'human';const k='fw'+col+(f?1:0)+v+race+(band?'b':'');if(spr[k])return spr[k];
  const R=RACE_LOOK[race]||RACE_LOOK.human,arms=['spear','spear','sword','spear','axe','spear'][v],
    o={race,skin:R.skin[v%R.skin.length],hair:R.hair[v%R.hair.length],eye:R.eye,ears:R.ears,tusk:R.tusk,short:R.short,beard:R.beard?R.hair[v%R.hair.length]:null,
      helm:band?(v%3?'hood':'bare'):['kettle','cap','kettle','bare','kettle','cap'][v],hood:'leather',outer:band?['leather','fur','cloth'][v%3]:v%3===2?'leather':'steel',inner:'dark',team:col,
      weapon:band?['spear','axe','dagger','spear','sword','axe'][v]:arms,shield:!band&&(v===2||v===4)?'wood':null,shortHair:v%2===0};
  return spr[k]=mapPerson(o,f)}
// a worker in the fields: the trade's clothes and tool (economy.js JOBS), the home's race
const WORK_LOOK={farmer:{helm:'straw',outer:'cloth',team:'linen',weapon:'hoe'},herder:{helm:'hood',hood:'leather',outer:'fur',team:'leather',weapon:'crook'},
  woodcutter:{helm:'bare',outer:'forest',team:'leather',weapon:'axe'},miner:{helm:'cap',helmC:'iron',outer:'leather',team:'dark',weapon:'pick'},fisher:{helm:'bare',outer:'blue',team:'linen',weapon:'rod'},
  builder:{helm:'cap',helmC:'leather',outer:'linen',team:'leather',weapon:'hammer'}};
function workerSprite(job,f,race,v,carry){v=(v||0)%4;race=race||'human';const k='wk'+job+(f?1:0)+race+v+(carry?'c':'');if(spr[k])return spr[k];
  const L={...folkLook('folk',race,v*3+1),robe:false,...(WORK_LOOK[job]||WORK_LOOK.farmer)};if(carry){L.weapon=null;L.load=job}// (loaded: his tool left behind)
  return spr[k]=mapPerson(L,f)}
// a refugee: worn clothes, a hood, a rolled blanket on the back, a walking stick now and then
function refugeeSprite(f,v){v=(v||0)%4;const k='rf'+(f?1:0)+v;if(spr[k])return spr[k];
  return spr[k]=mapPerson({...folkLook('folk','human',v*5+2),robe:false,helm:v%2?'hood':'bare',hood:'linen',outer:['linen','cloth','leather','linen'][v],team:'dark',cape:'leather',weapon:v===1||v===3?'crook':null},f)}

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
