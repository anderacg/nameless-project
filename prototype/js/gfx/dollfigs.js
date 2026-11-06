'use strict';
/* ---------- the battle's figures as paper dolls (engine/doll.js PX.doll; the owner, 2026-11-06: "go ahead with the battle figures"):
   a soldier on foot is the doll's base body for his race in his look's parts (dollParts: his hose and boots, his shirt, tunic or
   coat of mail, the side's colour on a tabard (a robe's sash), a belt, a cloak for a cape, his helm or hood, his hair and beard), in
   the game's own palette (PPAL), drawn bare (no outline: its edge its own darkest tones) into the template's place (people.js
   drawFigureBody: the feet on its row 14, the weapon hand before him), mirrored so his weapon hand is the near one. His gear is the
   game's as before, drawn apart from the body's anchors (figures.js FigureRig.dress) and outlined on its own; in a blow his weapon
   arm is drawn apart along the blow's rig (people.js BLOW_RIG, FIST_RIG), the hand where weapons.js holds the weapon. Riders keep
   the template for now (DOLL_FIGS.riders) ---------- */
// on: soldiers on foot as dolls; dx, dy: the doll's body over the template's columns and rows (dy 1: its feet on the row the
// template's outline under its feet took, the picture's last); the anchors the template kept on its own
// (back: what he wears on his back, its top left, out behind him; off: the shield arm's shield, its top left; guard: a shield raised
// before him, its left); races: those the doll has
const DOLL_FIGS={on:true,riders:false,dx:2,dy:1,back:[2,6],off:[1,8],guard:[8],races:['human','elf','dwarf','orc']};
// whether a look is drawn as a doll
const dollable=o=>DOLL_FIGS.on&&!o.mount&&!!(window.PX&&PX.doll)&&DOLL_FIGS.races.includes(o.race||'human');
// (a look's helm as the doll's head part and its material)
const DOLL_HELM={cap:['cap','steel'],kettle:['kettle','steel'],great:['great','steel'],plume:['great','steel'],horned:['kettle','iron'],wizard:['hood','purple'],straw:['cap','cloth'],skull:['cap','white'],bandage:['bandage','linen']};
// a look's parts on the doll, in the game's materials ('team': the side's colour, a tone darker than the palette's lightest: T)
function dollParts(o){const T={dark:1},P=[],out=o.outer||'leather',arm=o.armor||'none',metal=out==='iron'||out==='steel'?out:'steel';
  if(o.robe)P.push(['shoes','leather'],['robe',out],['sash','team',T]);
  else{P.push(['hose',o.legs||'leather'],['boots','leather']);
    if(arm==='mail'||arm==='plate')P.push(['mail',metal],['tabard','team',T],['belt','leather']);
    else if(arm==='leather')P.push(['shirt',o.inner||'linen'],['tunic',out],['tabard','team',T],['belt','leather']);
    else P.push(['shirt','team',T],['vest',out],['belt','leather'])}
  if(o.cape)P.push(['cloak',o.cape===true?'team':o.cape]);
  const h=o.helm==='hood'?['hood',o.hood||'olive']:DOLL_HELM[o.helm];if(h)P.push(h);
  return P}
// its doll's spec: race, skin, hair, beard, parts, the side's colour, pose. Its colours are channels painted at the last (engine/doll.js
// PX.dollBase, dollPaint): every material by its own name (a ramp or a '#rrggbb', a world army's tint, by its JSON), painted through
// the game's palette (pal); so one base serves every side and tint. seed: by the man himself (his race, skin and hair, his kit's shapes;
// never his side's colours, nor what he carries), so each variant is its own, every side shares his base, and his gear never changes him
const dollChan=m=>typeof m==='string'?m:JSON.stringify(m),dollRamp=n=>{try{return pal(n[0]==='['?JSON.parse(n):n)}catch(e){return null}};
function dollSpec(o,pose,frame,moves){const parts=dollParts(o).map(([p,m,x])=>[p,m==='team'?'team':dollChan(m),x]);
  const seed=[...JSON.stringify([o.race,o.skin,o.hair,o.beard,o.armor,o.helm,!!o.cape,!!o.robe,o.v,o.shortHair])].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7);
  return{race:o.race||'human',skin:dollChan(o.skin||'skin'),hair:dollChan(o.hair||'brown'),style:o.shortHair===false?'long':'short',beard:!!o.beard,uniform:parts,team:dollChan(o.team||'blue'),
    seed,ramp:dollRamp,bare:true,noShadow:true,weapon:null,shield:null,pose,frame,moves}}
// (the poses' own moves on the doll, by the template's walks and styles: [regions, side, dx, dy, from row]; the doll's dx is mirrored
// (dollfigs draws it facing right): +1 is back. lean: running and climbing, the head and shoulders forward; a breath: the head down a
// pixel; struck (flinch), the head and body back; a glance back (look), the head; the weight shifted (shift), all above the legs)
const DOLL_MOVES={lean:[['sfn','',-1,0,0]],breath:[['sf','',0,1,0]],flinch:[['sfncbulhp','',1,0,0]],look:[['sf','',1,0,0]],shift:[['sfncbulhp','',1,0,0]],
  run:[[],[['ko','L',0,-2,11],['h','R',-1,0,0]],[],[['ko','R',0,-2,11],['h','L',-1,0,0]]]};
/* a figure's body as a doll into grid g at the template's (ox, oy): walk (-2 a breath, -1 standing, 0-15 the strides: walk,
   run, climb, descend, each its doll's step), style and atk (a blow's frame, its weapon arm along the rig). Its pixels are the
   body's (g.body: not outlined, figures.js FigureRig.frame); returns the template's anchors */
function drawDollBody(g,o,ox,oy,walk,style,atk,cut){
  const rig=atk>=0?(FIST_STYLES.includes(style)?FIST_RIG[style][atk]:o.held&&BLOW_RIG[style]?blowRig(o,style,atk):null):style==='flinch'?blowRig(o,'flinch',0):o.guardUp&&!shieldLook(o)&&!o.weapon?FIST_RIG.guard[0]:null;
  const M=DOLL_MOVES,run=walk>=4&&walk<8,climb=walk>=8,moves=[...(run||climb?M.lean:[]),...(run?M.run[walk&3]:[]),...(walk===-2?M.breath:[]),...(M[style]&&!Array.isArray(M[style][0][0])?M[style]:[])];
  // (braced or gripping: both arms forward to the weapon, the near hand on it before him, the far one behind it along a pole levelled
  //  (brace) or just under the near one on a great weapon raised (grip): DOLL_GRIP)
  const two=DOLL_GRIP[style]||null;
  const s=dollSpec(o,walk>=0?'walk':'idle',walk>=0?walk&3:0,moves);if(rig)s.drop=[['ulh','R']];if(two)s.drop=[['ulh','']];
  const cv=PX.doll(s),D=PX.DOLL.D,sh=15-cv.rows,d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,dx=DOLL_FIGS.dx;
  // (his body, mirrored: the doll's right (the picture's left) his near side, before him; cut: only the rows down to it, the
// template's rows (a kneeler's: the doll a row lower, as its feet))
  const tx=X=>8-(X-D.OX)+dx,ty=Y=>Y-cv.oy+sh+DOLL_FIGS.dy;g.body=g.body||new Set();
  for(let Y=0;Y<cv.height;Y++){if(cut!=null&&ty(Y)-DOLL_FIGS.dy>cut)continue;for(let X=0;X<cv.width;X++){const i=(Y*cv.width+X)*4;if(!d[i+3])continue;const x=ox+tx(X),y=oy+ty(Y);
    pset(g,x,y,'#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join(''));if(x>=0&&y>=0&&x<g.w&&y<g.h)g.body.add(y*g.w+x)}}
  const [hx,hy]=cv.anchors.hand,[fx,fy]=cv.anchors.off;let hand=[ox+tx(hx)+1,oy+ty(hy)-DOLL_FIGS.dy];// (the weapon hand where the template held it, five rows over the picture's bottom)
  // (a blow: his weapon arm from the shoulder along the rig's joints in his sleeve, his fist the hand)
  if(rig){const f=rig.fore,T=cv.tones,sl=T.u||T.l||PPAL.leather[1],sk=T.h||PPAL.skin[1],pts=[[8,7]].concat(f.map(([x,y])=>[x,y-(y>=9?sh:0)])).map(([x,y])=>[x,y+DOLL_FIGS.dy]);
    for(let k=1;k<pts.length;k++){const [ax,ay]=pts[k-1],[bx,by]=pts[k],n=Math.max(Math.abs(bx-ax),Math.abs(by-ay))||1;
      for(let j=0;j<=n;j++){const x=ox+Math.round(ax+(bx-ax)*j/n),y=oy+Math.round(ay+(by-ay)*j/n);pset(g,x,y,k===pts.length-1&&j===n?sk:sl);if(x>=0&&y>=0&&x<g.w&&y<g.h)g.body.add(y*g.w+x)}}
    const e=pts[pts.length-1];hand=[ox+e[0],oy+e[1]]}
  if(two){const T=cv.tones,sl=T.u||T.l||PPAL.leather[1],sk=T.h||PPAL.skin[1],Y=DOLL_FIGS.dy,arm=(pts)=>{for(let k=1;k<pts.length;k++){const [ax,ay]=pts[k-1],[bx,by]=pts[k],n=Math.max(Math.abs(bx-ax),Math.abs(by-ay))||1;
      for(let j=0;j<=n;j++){const x=ox+Math.round(ax+(bx-ax)*j/n),y=oy+Math.round(ay+(by-ay)*j/n)+Y;pset(g,x,y,k===pts.length-1&&j===n?sk:sl);if(x>=0&&y>=0&&x<g.w&&y<g.h)g.body.add(y*g.w+x)}}};
    arm(two.rear);arm(two.fore);const e=two.fore[two.fore.length-1];hand=[ox+e[0],oy+e[1]+Y-1]}
  const gy=(o.guardUp==='low'?8:5)+DOLL_FIGS.dy,B=DOLL_FIGS,Y=B.dy;
  return{hand,off:[ox+B.off[0],oy+B.off[1]+sh+Y],guard:[ox+B.guard[0],oy+gy+sh],back:[ox+B.back[0],oy+B.back[1]+sh+Y],free:[ox+tx(fx),oy+ty(fy)],sh,rig:!!rig}}
// (the two-handed holds, in the template's place: each arm's joints from the shoulder, the last its hand: brace, a pole levelled before
// him, the far hand four pixels back along it; grip, a great weapon up before him, the far hand under the near)
const DOLL_GRIP={brace:{fore:[[8,5],[10,7],[11,9]],rear:[[4,5],[5,7],[7,9]]},grip:{fore:[[8,5],[9,7],[10,8]],rear:[[4,5],[6,7],[9,9]]}};
// a figure as a doll: its body, then its gear from the body's anchors (figures.js FigureRig.dress)
function drawDollFigure(g,o,ox,oy,walk,style,atk,cut){const A=drawDollBody(g,o,ox,oy,walk,style,atk,cut);FigureRig.dress(g,o,A,style,atk);return A}
