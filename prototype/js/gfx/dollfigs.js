'use strict';
/* ---------- the battle's figures as paper dolls (engine/doll.js PX.doll; the owner, 2026-11-06: "go ahead with the battle figures"):
   a soldier on foot is the doll's base body for his race in his look's parts (dollParts: his hose and boots, his shirt, tunic or
   coat of mail, the side's colour on a tabard (a robe's sash), a belt, a cloak for a cape, his helm or hood, his hair and beard), in
   the game's own palette (PPAL), drawn bare (no outline: its edge its own darkest tones) into the template's place (people.js
   drawFigureBody: the feet on its row 14, the weapon hand before him), mirrored so his weapon hand is the near one. His gear is the
   game's as before, drawn apart from the body's anchors (figures.js FigureRig.dress) and outlined on its own; in a blow his weapon
   arm is drawn apart along the blow's rig (people.js BLOW_RIG, FIST_RIG), the hand where weapons.js holds the weapon. Riders keep
   the template for now (DOLL_FIGS.riders) ---------- */
// on: soldiers on foot as dolls; riders: a rider's body above the saddle a doll too; rim: round each figure a blended outline, a
// deep shade (rimK) of what it borders (people.js prim), else edge: everything drawn with no outline,
// its silhouette's own edge a shade darker (edgeK; people.js poutline); dx, dy: the doll's body over the template's columns and rows (dy 0: its feet on the row
// over the picture's last, the row every figure stands on, battle's and the map's: render.js drawUnit, march.js drawMarcher; was 1
// while it had no outline); the anchors the template kept on its own
// (back: what he wears on his back, its top left, out behind him; off: the shield arm's shield, its top left; guard: a shield raised
// before him, its left); races: those the doll has
const DOLL_FIGS={on:true,riders:true,edge:true,edgeK:.68,rim:true,rimK:.62,rimLit:.86,dx:2,dy:0,back:[2,6],off:[1,8],guard:[8],races:['human','elf','dwarf','orc']};
// whether a look is drawn as a doll
const dollable=o=>DOLL_FIGS.on&&(!o.mount||DOLL_FIGS.riders)&&!!(window.PX&&PX.doll)&&DOLL_FIGS.races.includes(o.race||'human');
// (a look's helm as the doll's head part and its material)
// (each class its own outline (the owner, 2026-11-07: "distinct helmets"): a plume a great helm crested in the side's colour, a horned
// helm its horns, a circlet gold round the brow, a wizard his tall hat, a shaman a skull; several parts a list)
const DOLL_HELM={cap:['cap','steel'],kettle:['kettle','steel'],great:['great','steel'],plume:[['great','steel'],['crest','team']],horned:[['kettle','iron'],['horns','linen']],
  wizard:['wizard','purple'],straw:['cap','cloth'],skull:['skull','white'],bandage:['bandage','linen'],circlet:['circlet','gold'],crown:['crown','gold']};
// a look's parts on the doll, in the game's materials ('team': the side's colour, a tone darker than the palette's lightest: T)
// (o.helmC: a worn helm's own colour, its first part in it; an armour's colour (a '#rrggbb', the item's) its mail's too)
function dollParts(o){const T={dark:1},P=[],out=o.outer||'leather',arm=o.armor||'none',metal=out==='iron'||out==='steel'||out[0]==='#'?out:'steel';
  if(o.robe)P.push(['shoes','leather'],['robe',out],['sash','team',T]);
  else{P.push(['hose',o.legs||'leather'],['boots','leather']);
    // (no tabard (o.tabard false: your hero, his cape your colour): his armour itself shows)
    const tb=o.tabard===false?[]:[['tabard','team',T]];
    if(arm==='mail'||arm==='plate')P.push(['mail',metal],...tb,['belt','leather']);
    // (o.sleeves: a jerkin over the body only, his shirt's sleeves and collar showing (your hero: the owner, 2026-11-07, "too blocky"))
    else if(arm==='leather')P.push(['shirt',o.inner||'linen'],['tunic',out,o.sleeves?{cover:'cbpt'}:undefined],...tb,['belt','leather']);
    else P.push(['shirt','team',T],['vest',out],['belt','leather'])}
  if(o.cape)P.push(['cloak',o.cape===true?'team':o.cape]);
  if(o.dollEye)P.push(['face','skin'],['eye','black']);
  const h0=o.helm==='hood'?['hood',o.hood||'olive']:DOLL_HELM[o.helm],h=h0&&o.helmC?Array.isArray(h0[0])?[[h0[0][0],o.helmC],...h0.slice(1)]:[h0[0],o.helmC]:h0;if(h)Array.isArray(h[0])?P.push(...h):P.push(h);
  return P}
// its doll's spec: race, skin, hair, beard, parts, the side's colour, pose. Its colours are channels painted at the last (engine/doll.js
// PX.dollBase, dollPaint): every material by its own name (a ramp or a '#rrggbb', a world army's tint, by its JSON), painted through
// the game's palette (pal); so one base serves every side and tint. seed: by the man himself (his race, skin and hair, his kit's shapes;
// never his side's colours, nor what he carries), so each variant is its own, every side shares his base, and his gear never changes him
const dollChan=m=>typeof m==='string'?m:JSON.stringify(m),dollRamp=n=>{try{return pal(n[0]==='['?JSON.parse(n):n)}catch(e){return null}};
// (an item's '#rrggbb' its ramp of four tones (pal), never one flat colour: an armour and a helm shaded as the rest of him)
function dollSpec(o,pose,frame,moves){const parts=dollParts(o).map(([p,m,x])=>[p,m==='team'?'team':dollChan(typeof m==='string'&&m[0]==='#'?pal(m):m),x]);
  const seed=[...JSON.stringify([o.race,o.skin,o.hair,o.beard,o.armor,o.helm,!!o.cape,!!o.robe,o.v,o.shortHair])].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7);
  return{race:o.race||'human',skin:dollChan(o.skin||'skin'),hair:dollChan(o.hair&&o.hair[0]==='#'?pal(o.hair):o.hair||'brown'),style:o.hairStyle||(o.shortHair===false?'long':'short'),beard:!!o.beard,beardStyle:o.beardStyle||null,uniform:parts,team:dollChan(o.team||'blue'),
    seed,ramp:dollRamp,bare:true,noShadow:true,weapon:null,shield:null,pose,frame,moves}}
// (the poses' own moves on the doll, by the template's walks and styles: [regions, side, dx, dy, from row]; the doll's dx is mirrored
// (dollfigs draws it facing right): +1 is back)
// (rigid, never soft (the owner, 2026-11-07: "the unit is not bending like a soft object"): no part of his head or body moved against
// another, which at this size reads as the figure bending like rubber; only his limbs move (a leg lifted at the knee, a heel, a whole
// arm swung from the shoulder) or the whole of him (struck, flinch: knocked back a pixel, feet and all). So no lean, glance or weight
// shift of the head and shoulders, a breath his arms lifted a pixel from the shoulders, and a blow's body still: its arm and weapon
// do it)
const DOLL_MOVES={lean:[],breath:[['ulh','',0,-1,0]],flinch:[['sfncbulhptko','',1,0,0]],look:[],shift:[],
  // (a run: the walk's steps (engine/doll.js POSES.walk), its arms swung higher; no knee lifted on top of the walk's, which folded
  // the leg back on itself (the owner, 2026-11-07: "make the leg not bending to the back too much"))
  run:[[['ulh','R',0,-1,0]],[['ulh','R',0,-1,0]],[['ulh','L',0,-1,0]],[['ulh','L',0,-1,0]]],
  blow:[[],[],[]],
  // (kneeling (the owner, 2026-11-07: "kneeling looks like a line"), seen from before him as his reference's: his body down 2 rows;
  // his left knee on the ground, its thigh down to it, its shin and foot folded under it out of sight (DOLL_KNEEL_DROP); his right
  // leg bent out to the side, its knee up, its shin and foot planted 2 px out, so it shows beside him)
  kneel:[['sfncbulhp','',0,2,0],['t','L',0,3,0],['t','R',2,1,0],['ko','R',2,0,0]]};
const DOLL_KNEEL_DROP=[['ko','L']];
/* a shooter's arms (the owner, 2026-11-07: "archers bow shooting position is not correct"): drawing a bow (the thrust frames:
   half, full, held), the bow arm raised to his shoulder and out toward his mark (his weapon hand, R: the bow on it, figures.js
   ShooterGear), the drawing hand forward across him to his chin, the string back to it (figures.js BOW_PULL; the owner, 2026-11-07: "fix posture"); the reload (the overhead frames), the bow arm still up, the other hand back to
   the quiver over his shoulder and down to nock; a crossbow raised to his shoulder to aim (his other arm as it was: raised, it read as a stick), lowered to span it.
   [regions, side, dx, dy, from row] as DOLL_MOVES (dx mirrored: -1 forward) */
const DOLL_SHOOT={bow:{thrust:[[['lh','R',-1,-4,0],['lh','L',-3,-3,0]],[['lh','R',-1,-4,0],['l','L',-2,-3,0],['h','L',-4,-4,0]],[['lh','R',-1,-4,0],['l','L',-2,-3,0],['h','L',-4,-4,0]]],
    overhead:[[['lh','R',-1,-2,0],['lh','L',0,-4,0]],[['lh','R',-1,-2,0],['lh','L',0,-5,0]],[['lh','R',-1,-2,0],['lh','L',-1,-3,0]]]},
  xbow:{thrust:[[['lh','R',-1,-2,0]],[['lh','R',-1,-2,0]],[['lh','R',-1,-2,0]]],overhead:[[],[],[]]}};
/* a blow's weight (the owner, 2026-11-07: "make unit animations more realistic when battle"), in his legs and the drop of his weight,
   his head and body never apart: a cut, his front foot stepping out and his back heel up as it lands; a thrust, a lunge, his front
   leg reaching forward from the knee, the back heel up, held a frame; a chop, all of him above the knees sinking a pixel into it as
   it falls, as a step lands. By the blow's three frames (wind up, strike, follow through); none for a rider (his mount stays)
   nor a shooter (his own arms: DOLL_SHOOT) */
const DOLL_LUNGE={swing:[[],[['o','R',-1,0,14],['o','L',0,-1,14]],[['o','R',-1,0,14]]],
  thrust:[[],[['ko','R',-1,0,13],['o','R',-1,0,14],['o','L',0,-1,14]],[['ko','R',-1,0,13],['o','R',-1,0,14]]],
  overhead:[[],[['sfncbupt','',0,1,0],['lh','L',0,1,0]],[['sfncbupt','',0,1,0],['lh','L',0,1,0]]]};
// (his stance as he shoots, on foot (the owner, 2026-11-07: a side-on archer's stance): his front foot a pixel forward, his back foot set
// a pixel behind him, braced, through the draw, the loose and the reload alike so his feet stay put between them)
const DOLL_SHOOT_STANCE=[['o','R',-1,0,14],['o','L',1,0,14]];
const shootArms=(o,style,atk)=>{if(atk<0||o.held)return [];const k=o.weapon==='longbow'?'bow':o.weapon,T=DOLL_SHOOT[k];if(!T)return [];const A=T[style]?T[style][atk]||[]:[];return o.mount?A:[...A,...DOLL_SHOOT_STANCE]};
/* a figure's body as a doll into grid g at the template's (ox, oy): walk (-2 a breath, -1 standing, 0-15 the strides: walk,
   run, climb, descend, each its doll's step), style and atk (a blow's frame, its weapon arm along the rig). Its pixels are the
   body's (g.body: not outlined, figures.js FigureRig.frame); returns the template's anchors */
function drawDollBody(g,o,ox,oy,walk,style,atk,cut){
  const shooter=!o.held&&['bow','longbow','xbow','sling','staff'].includes(o.weapon),lunge=atk>=0&&!o.mount&&!shooter&&DOLL_LUNGE[style]?DOLL_LUNGE[style][atk]||[]:[];
  const rig=atk>=0?(FIST_STYLES.includes(style)?FIST_RIG[style][atk]:o.held&&BLOW_RIG[style]?blowRig(o,style,atk):null):style==='flinch'?blowRig(o,'flinch',0):o.guardUp&&!shieldLook(o)&&!o.weapon?FIST_RIG.guard[0]:null;
  const M=DOLL_MOVES,run=walk>=4&&walk<8,climb=walk>=8,moves=[...(run||climb?M.lean:[]),...(run?M.run[walk&3]:[]),...(walk===-2?M.breath:[]),...(atk>=0&&M.blow[atk]?M.blow[atk]:[]),...shootArms(o,style,atk),...lunge,...(M[style]&&M[style].length&&!Array.isArray(M[style][0][0])?M[style]:[])];
  // (braced or gripping: both arms forward to the weapon, the near hand on it before him, the far one behind it along a pole levelled
  //  (brace) or just under the near one on a great weapon raised (grip): DOLL_GRIP)
  // (a great weapon carried on the move, walking or running (the owner, 2026-11-07: "two-handed weapons on the march"): both hands on it as
  //  in the grip, his legs his own: DOLL_CARRY2)
  const two=DOLL_GRIP[style]||(DOLL_CARRY2.on&&walk>=0&&style==null&&atk<0&&!o.mount&&DOLL_CARRY2.kinds.includes(o.held)?DOLL_GRIP.grip:null);
  const s=dollSpec(o,walk>=0?'walk':'idle',walk>=0?walk&3:0,moves);if(rig)s.drop=[['ulh','R']];if(two)s.drop=[['ulh','']];if(style==='kneel')s.drop=[...(s.drop||[]),...DOLL_KNEEL_DROP];
  const cv=PX.doll(s),D=PX.DOLL.D,sh=15-cv.rows,d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,dx=DOLL_FIGS.dx;
  // (his body, mirrored: the doll's right (the picture's left) his near side, before him; cut: only the rows down to it, the
// template's rows (a kneeler's: the doll a row lower, as its feet))
  const tx=X=>8-(X-D.OX)+dx,ty=Y=>Y-cv.oy+sh+DOLL_FIGS.dy;g.body=g.body||new Set();
  for(let Y=0;Y<cv.height;Y++){if(cut!=null&&ty(Y)-DOLL_FIGS.dy>cut)continue;for(let X=0;X<cv.width;X++){const i=(Y*cv.width+X)*4;if(!d[i+3])continue;const x=ox+tx(X),y=oy+ty(Y);
    pset(g,x,y,'#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join(''));if(x>=0&&y>=0&&x<g.w&&y<g.h)g.body.add(y*g.w+x)}}
  const [hx,hy]=cv.anchors.hand,[fx,fy]=cv.anchors.off;let hand=[ox+tx(hx)+1,oy+ty(hy)-DOLL_FIGS.dy],hand2=null;// (the weapon hand where the template held it, five rows over the picture's bottom)
  // (a blow: his weapon arm from the shoulder along the rig's joints in his sleeve, his fist the hand)
  if(rig){const f=rig.fore,T=cv.tones,sl=T.u||T.l||PPAL.leather[1],sk=T.h||PPAL.skin[1],pts=[[8,7]].concat(f.map(([x,y])=>[x,y-(y>=9?sh:0)])).map(([x,y])=>[x,y+DOLL_FIGS.dy]);
    for(let k=1;k<pts.length;k++){const [ax,ay]=pts[k-1],[bx,by]=pts[k],n=Math.max(Math.abs(bx-ax),Math.abs(by-ay))||1;
      // (2 px thick (the owner, 2026-11-07: "a 2-px forearm"): a second pixel under it where it runs across, behind it where it runs
      // down; the hand at its end alone)
      const flat=Math.abs(bx-ax)>=Math.abs(by-ay);for(let j=0;j<=n;j++){const x=ox+Math.round(ax+(bx-ax)*j/n),y=oy+Math.round(ay+(by-ay)*j/n),end=k===pts.length-1&&j===n;pset(g,x,y,end?sk:sl);if(x>=0&&y>=0&&x<g.w&&y<g.h)g.body.add(y*g.w+x);
        if(!end&&!(k===pts.length-1&&j>=n-1)){const x2=flat?x:x-1,y2=flat?y+1:y;if(!pget(g,x2,y2)||g.body.has(y2*g.w+x2)){pset(g,x2,y2,T.l?PX.shade(sl,.82):sl);if(x2>=0&&y2>=0&&x2<g.w&&y2<g.h)g.body.add(y2*g.w+x2)}}}}
    const e=pts[pts.length-1];hand=[ox+e[0],oy+e[1]]}
  if(two){const T=cv.tones,sl=T.u||T.l||PPAL.leather[1],sk=T.h||PPAL.skin[1],Y=DOLL_FIGS.dy,arm=(pts)=>{for(let k=1;k<pts.length;k++){const [ax,ay]=pts[k-1],[bx,by]=pts[k],n=Math.max(Math.abs(bx-ax),Math.abs(by-ay))||1;
      for(let j=0;j<=n;j++){const x=ox+Math.round(ax+(bx-ax)*j/n),y=oy+Math.round(ay+(by-ay)*j/n)+Y;pset(g,x,y,k===pts.length-1&&j===n?sk:sl);if(x>=0&&y>=0&&x<g.w&&y<g.h)g.body.add(y*g.w+x)}}};
    arm(two.rear);arm(two.fore);const e=two.fore[two.fore.length-1],r2=two.rear[two.rear.length-1];hand=[ox+e[0],oy+e[1]+Y-1];hand2=[ox+r2[0],oy+r2[1]+Y]}
  const gy=(o.guardUp==='low'?8:5)+DOLL_FIGS.dy,B=DOLL_FIGS,Y=B.dy;
  return{hand,hand2,off:[ox+B.off[0],oy+B.off[1]+sh+Y],guard:[ox+B.guard[0],oy+gy+sh],back:[ox+B.back[0],oy+B.back[1]+sh+Y],free:[ox+tx(fx),oy+ty(fy)],sh,rig:!!rig}}
// (the two-handed holds, in the template's place: each arm's joints from the shoulder, the last its hand: brace, a pole levelled before
// him, the far hand four pixels back along it; grip, a great weapon up before him, the far hand under the near)
const DOLL_CARRY2={on:true,kinds:['great','bigaxe','hammer']};
const DOLL_GRIP={brace:{fore:[[8,5],[10,7],[11,9]],rear:[[4,5],[5,7],[7,9]]},grip:{fore:[[8,5],[9,7],[10,8]],rear:[[4,5],[6,7],[9,9]]}};
// a figure as a doll: its body, then its gear from the body's anchors (figures.js FigureRig.dress)
function drawDollFigure(g,o,ox,oy,walk,style,atk,cut){const A=drawDollBody(g,o,ox,oy,walk,style,atk,cut);FigureRig.dress(g,o,A,style,atk);return A}
// the beasts and monsters in the same style (engine/beasts.js: no outline, their own edge darker) and at their real size beside the
// dolls (PX.BEAST_SIZE: a boar; the wolf, the bear and the tiger drawn at their own size, the monsters as they are)
if(window.PX&&PX.beast){PX.BEAST_EDGE=DOLL_FIGS.on&&DOLL_FIGS.edge;Object.assign(PX.BEAST_SIZE,DOLL_FIGS.on?{boar:.6}:{})}
