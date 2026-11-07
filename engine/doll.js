'use strict';
/* ---------- PX engine: paper-doll figures (the owner, 2026-11-06: "a base body skeleton, then gear or each component added to the
   body by parts: hairstyle, equipment, clothes, different uniforms"). A figure is a base body (its skeleton: which part of the body
   each pixel is, and how lit) and the parts laid over it in their slots' order, each colouring the body's regions it covers in its
   material's tones by the body's own shading, or adding pixels of its own round an anchor (hair, a hood, a cloak's sides); its
   weapon and shield from the hands. No outline: the edge is each part's darkest tone (the style the owner chose: a small head, the
   arms hanging and flaring to the hands at the hips, an A stance, muted cloth, dark straps, a shadow underfoot). Plain script;
   everything on window.PX ---------- */
(function(PX){
  /* the skeleton, 9 wide, 15 rows over a shadow row; each row its regions and its shading (0 lit ... 3 the edge):
     s scalp, f face, n neck and shoulders, c chest, b belly, u upper arm, l forearm, h hand, p hips, t thigh, k shin, o foot.
     Its left half is his right (the picture's left: the weapon hand), its right his left (the shield hand) */
  const SKEL=[
    ['...sss...','...012...'],
    ['...ffs...','...002...'],
    ['...ffs...','...102...'],
    ['..nnnnn..','..30103..'],
    ['.ucccccu.','.3000013.'],
    ['.ucccccu.','.1000023.'],
    ['.ubbbbbul','.03000323'],
    ['llbbbbbll','320000332'],
    ['hlppppplh','301010132'],
    ['hhttttthh','323000332'],
    ['..ttttt..','..30300..'],
    ['..ttttt..','..30300..'],
    ['..kk.kkk.','..30.303.'],
    ['..kk..kk.','..31..33.'],
    ['...o...o.','...3...3.']];
  // (in the saddle: the hands a row lower, at his thighs, as the first cut had them, so a rider and his weapon keep their pixels)
  const SEAT_HANDS=['.httttt.h','.030300.2'];
  // the cell: the skeleton at (OX, OY) in a W x H picture (room for a weapon either side and a hood or a helm's crest above)
  const D={W:17,H:19,OX:4,OY:2};
  // the races: their skin's tones, and how the skeleton changes (drop: rows taken out, dup: rows doubled, wide: the torso a pixel
  // wider each side; hair and beard by default): a dwarf a row shorter and broader, as the game's template had him
  // (legs a row longer than the first cut, his hands at his hips (the owner, 2026-11-07: "the hand looks longer than legs"); seat: in
  //  the saddle, his legs by the horse's side, as they were, so a rider keeps his cell)
  const RACES={human:{skin:'skin',dup:[12],seat:{dup:[]}},elf:{skin:'elf',dup:[12,13],ears:true,seat:{dup:[12]}},dwarf:{skin:'dwarf',wide:true,beard:true,seat:{drop:[12]}},orc:{skin:'orc',dup:[12],wide:true,tusk:true,seat:{dup:[]}},
    // (a goblin (the owner, 2026-11-07, with the reference): small, a chest row and a thigh row short, his long ears out behind his head
    //  and up, over a hood too)
    goblin:{skin:'goblin',drop:[5,10],goblinEars:true,seat:{drop:[5]}}};
  /* the materials, each four tones: lit, mid, shade, edge (muted, as the owner's reference) */
  const MAT={
    skin:['#f9b488','#e28852','#c67749','#a5623e'],elf:['#f8d8c8','#e8b8a4','#c8968a','#9a7068'],dwarf:['#f4b090','#d88a68','#b86a50','#8a4a38'],
    orc:['#a8c070','#86a050','#647a3a','#465a28'],
    linen:['#e0e0c7','#b5b5a1','#8c8c7c','#6b6b5f'],buff:['#c8b070','#a08a52','#7a6a3a','#56482a'],leather:['#a06a3a','#7a4b22','#5a3416','#3a220e'],
    wool:['#9a8a6a','#76684c','#564a34','#3a3222'],grey:['#9a9a8c','#78786c','#58584e','#3c3c34'],
    mail:['#b8bcb4','#8e928a','#6a6e66','#4a4e48'],steel:['#d8dce0','#a8b0b8','#7a8490','#525a66'],iron:['#8a8e96','#6a6e76','#4e525a','#34383e'],
    blue:['#6a8cc0','#4a6c9e','#34507a','#24385a'],red:['#c8564a','#a23c34','#7a2a24','#521a16'],green:['#7a944c','#5a7236','#405426','#2a3818'],
    white:['#e8e8dc','#c8c8b8','#a0a090','#787868'],black:['#5a5a62','#404048','#2c2c34','#1c1c22'],purple:['#8a6a9a','#6a4a7a','#4e345c','#34223e'],
    gold:['#f0c860','#c89a30','#9a7020','#6a4a14'],wood:['#a07040','#7a5028','#5a3818','#3a240e'],
    // hair
    brown:['#8a5a30','#6a4020','#4a2a14','#341c0c'],blond:['#ffea73','#fac110','#c89010','#8a6008'],black_h:['#4a4a52','#34343a','#24242a','#18181c'],
    ginger:['#e8803a','#c05a20','#8a3a14','#5a240c'],greyh:['#e0e0d8','#b8b8b0','#909088','#686860']};
  const HAIR_MAT={brown:'brown',blond:'blond',black:'black_h',ginger:'ginger',grey:'greyh',white:'greyh'};
  // the shadow underfoot: its navy, and darker under each foot
  const SHADOW=['#000037','#1f2303'];
  /* the parts, by slot, in the order they are laid on (a later slot over an earlier):
     cover: the body's regions it colours (rows: only rows from..to of the skeleton, by the skeleton's own row numbers); shape: its
     own pixels, rows of [region-free letters] round an anchor: 'head' (the scalp's top left) or 'body' (the skeleton's top left),
     each letter a shade (0-3) or '.'; dark: its tones a step darker; mottle: a share of its pixels a tone lighter or darker (cloth
     worn and patched, as the reference); line: a dark line of its own (a strap from shoulder to hip, a belt across the hips) */
  const SLOTS=['legs','boots','shirt','tunic','tabard','belt','strap','cloak','hair','beard','head','crest'];
  const PARTS={
    // legs: hose or trousers, breeches to the knee
    // (a loincloth when nothing else covers his hips)
    loin:{slot:'legs',cover:'p',dark:1},
    hose:{slot:'legs',cover:'tk',mottle:.2},breeches:{slot:'legs',cover:'t',mottle:.2},
    // feet
    boots:{slot:'boots',cover:'o',rows:[13,14],extra:'k',dark:1},shoes:{slot:'boots',cover:'o',dark:1},
    // the body: a shirt (sleeves to the wrist or the elbow), a tunic to mid-thigh, a robe to the feet, a coat of mail
    shirt:{slot:'shirt',cover:'ncbul',mottle:.15},vest:{slot:'shirt',cover:'cb',mottle:.15},
    tunic:{slot:'tunic',cover:'ncbulpt',rows:[3,11],mottle:.25},robe:{slot:'tunic',cover:'ncbulptk',rows:[3,14],mottle:.25,skirt:true},
    mail:{slot:'tunic',cover:'ncbulpt',rows:[3,10],mottle:.4},
    // a uniform's front: a tabard in the side's colour over the chest and down the thighs, its sleeves left to what is under it
    tabard:{slot:'tabard',cover:'cbpt',rows:[4,11],cols:[2,6],mottle:.15},
    // a belt across the hips (its buckle in the middle), a strap from the right shoulder to the left hip
    belt:{slot:'belt',line:'belt'},strap:{slot:'strap',line:'strap'},sash:{slot:'belt',line:'sash'},
    // a cloak, seen from before him as it hangs behind him: a mantle over his shoulders (its collar and the tops of his arms), then
    // only its edge, a pixel of cloth from his shoulder down behind his back arm (the picture is mirrored to face right: his left, +x, is his back)
    // to a hem at the knee; his arms their own sleeves (the owner, 2026-11-07: "too blocky", "the cape is a square")
    cloak:{slot:'cloak',cover:'nu',rows:[3,5],shape:{at:'body',rows:['..........','..........','..........','..........','........1.','........1.','.........2','.........2','.........2','.........2','.........3','........33']}},
    // hair: short (the scalp), long (to the shoulders), a tail, none; a beard over the jaw
    short:{slot:'hair',cover:'s'},long:{slot:'hair',cover:'s',shape:{at:'head',rows:['.....','....2','....2','...33']}},
    tail:{slot:'hair',cover:'s',shape:{at:'head',rows:['.....','....2','....3','....3']}},bald:{slot:'hair'},
    beard:{slot:'beard',shape:{at:'head',rows:['.....','.....','.12..','.23..']}},
    // (a crop, seen from before him as his body is (the owner, 2026-11-07: "revise head", then "make the head look more forward"):
    //  his hair on his scalp, his head no bigger than any man's (the owner: "why it's bob?", "head too big": no hair beside his
    //  face, nor above his head); his face its full width (face: the scalp's back column
    //  skin, not hair) and two eyes)
    crop:{slot:'hair',cover:'s'},
    // (and the lengths of the portraits' hair (prototype ui/faces.js FACE_HAIR), the head kept its size: falling behind his neck (mid),
    //  on to his shoulders (long), a bun
    //  on top (bun); a beard seen from before him over his jaw and chin)
    cropMid:{slot:'hair',cover:'s',shape:{at:'head',rows:['.....','.....','.....','2...2']}},
    cropLong:{slot:'hair',cover:'s',shape:{at:'head',rows:['.....','.....','.....','2...2','3...3']}},
    cropBun:{slot:'hair',cover:'s',shape:{at:'head',up:1,rows:['..1..']}},
    beardF:{slot:'beard',shape:{at:'head',rows:['.....','.....','.121.','..2..']}},
    // (a beast's pelt worn over the head, its fur down his back (the owner, 2026-11-07: "unit in winter area may use wolf or bear fur",
    //  with the reference): a wolf's, its pricked ears and its muzzle over his brow; a bear's, rounder, its small ears)
    peltWolf:{slot:'head',cover:'s',shape:{at:'head',up:2,rows:['...0.','..01.','00112','....2','....3','...23']}},
    peltBear:{slot:'head',cover:'s',shape:{at:'head',up:2,rows:['.0.1.','01112','01112','....3','...23']}},
    // (a headscarf knotted at the back of his head, its two ends hanging: an outlaw's, after the owner's reference)
    bandana:{slot:'head',cover:'s',shape:{at:'head',rows:['.....','....1','....2']}},
    // (a cross on a surcoat, in the side's colour: a knight's, as the owner's crusader reference)
    cross:{slot:'belt',shape:{at:'body',rows:['.','.','.','.','....1','...111','....1','....1','....1']}},
    face:{slot:'beard',shape:{at:'head',rows:['.....','...1.','...1.']}},
    eye:{slot:'beard',shape:{at:'head',rows:['.....','.3.3.']}},
    // the head: a hood (over the scalp, round the face, onto the shoulders), a cap, a kettle helm (its brim), a great helm (face and
    // all), a coif of mail
    // (open before the face, so it shows side-on as under a helm, never framed full-face nor with a pixel like an eye in it (the owner,
    //  2026-11-07: "there should be no eyes and the head should look like others (facing a bit to the left or right not center)"): a
    //  hood's peak over the brow, its cowl behind and under the chin; a coif, a pelt, long hair the same)
    hood:{slot:'head',cover:'s',shape:{at:'head',rows:['112..','....2','....3','2..23']},mottle:.15},
    cap:{slot:'head',cover:'s'},kettle:{slot:'head',cover:'s',shape:{at:'head',rows:['.....','0112.']}},
    great:{slot:'head',cover:'sf',shape:{at:'head',rows:['.012.']},slit:true},
    // (a bandage round the brow: one tended on the road)
    bandage:{slot:'head',shape:{at:'head',rows:['.....','.001.']}},coif:{slot:'head',cover:'s',shape:{at:'head',rows:['0....','....2','...23']}},
    // (each class its own outline (the owner, 2026-11-07): a gold circlet round the brow, the hair showing; a wizard's tall hat, its
    //  brim; a skull worn as a cap; up: rows of its shape over the scalp's top)
    circlet:{slot:'head',shape:{at:'head',rows:['.....','.012.']}},
    // (a crown: a gilt band on top of his hair, two points up from it)
    crown:{slot:'head',shape:{at:'head',up:2,rows:['.0.0.','.010.']}},
    wizard:{slot:'head',cover:'s',shape:{at:'head',up:3,rows:['..1..','.12..','.122.','01223']}},
    skull:{slot:'head',cover:'s',shape:{at:'head',up:1,rows:['.001.','0....']}},
    // (over a helm: a crest of plumes in the side's colour; a pair of horns, out either side)
    crest:{slot:'crest',shape:{at:'head',up:2,rows:['...0.','.012.']}},horns:{slot:'crest',shape:{at:'head',up:1,rows:['0...0','1...1']}}};
  // the uniforms: their parts and each one's material ('team': the side's colour; 'hair': the figure's own), a weapon and a shield
  const UNIFORMS={
    peasant:{parts:[['breeches','wool'],['shoes','leather'],['shirt','linen'],['vest','wool'],['sash','leather']],weapon:'club'},
    militia:{parts:[['hose','grey'],['boots','leather'],['shirt','linen'],['vest','leather'],['sash','red']],weapon:'club'},
    spearman:{parts:[['hose','grey'],['boots','leather'],['mail','mail'],['tabard','team'],['belt','leather'],['kettle','steel']],weapon:'spear'},
    swordsman:{parts:[['hose','grey'],['boots','leather'],['mail','mail'],['tabard','team'],['belt','leather'],['coif','mail']],weapon:'sword',shield:'team'},
    archer:{parts:[['breeches','leather'],['boots','leather'],['shirt','buff'],['tunic','green'],['belt','leather'],['strap','leather'],['hood','green']],weapon:'bow'},
    knight:{parts:[['hose','iron'],['boots','iron'],['mail','steel'],['tabard','team'],['belt','leather'],['cloak','team'],['great','steel']],weapon:'sword',shield:'team'},
    monk:{parts:[['shoes','leather'],['robe','wool'],['belt','leather'],['hood','wool']],weapon:'staff'},
    mage:{parts:[['shoes','leather'],['robe','purple'],['sash','gold'],['hood','purple']],weapon:'staff'}};
  // the weapons, from the weapon hand (his right, the picture's left): a line of its own pixels (wood, its head), behind the body
  // where it crosses him (the reference: a spear across the back, low left to high right); a shield on the other arm
  const WEAPONS={
    spear:{behind:true,pts:[[-3,4],[-2,3],[-1,2],[0,1],[1,0],[2,-1],[3,-2],[4,-3],[5,-4],[6,-5],[7,-6],[8,-7]],head:[[9,-8],[9,-9]],mat:'wood',hm:'steel'},
    staff:{behind:false,pts:[[-1,4],[-1,3],[-1,2],[-1,1],[-1,0],[-1,-1],[-1,-2],[-1,-3],[-1,-4],[-1,-5],[-1,-6],[-1,-7]],head:[[0,-8],[-1,-8],[-2,-8],[-2,-7]],mat:'wood',hm:'wood'},
    // (a sword held low and out from him, the owner 2026-11-06: tilted 30-45 degrees: its pommel over the hand, a guard across the
    //  blade, the blade down and away, 37 degrees from upright)
    sword:{behind:false,pts:[[1,-1],[-1,0],[0,1]],head:[[-1,1],[-2,2],[-2,3],[-3,4]],mat:'iron',hm:'steel'},
    club:{behind:false,pts:[[0,1],[-1,2]],head:[[-1,3],[-2,3],[-2,4]],mat:'wood',hm:'wood'},
    bow:{behind:false,off:true,pts:[[1,-4],[2,-3],[2,-2],[2,-1],[2,0],[2,1],[2,2],[2,3],[1,4]],head:[[1,-3],[1,-2],[1,-1],[1,0],[1,1],[1,2],[1,3]],mat:'wood',hm:'linen'}};
  /* the poses: idle, and a walk of four frames (the reference's figures face us; the owner, 2026-11-07: "more natural", "not
     bending like a soft object", then "the walking animations is not realistic"), a stride along the way he goes (-x: the
     picture is mirrored to face right): a contact (his weight landing: all of him above the knees down a pixel as one, his legs
     straight under him, never spread (the owner, 2026-11-07: "make heroes walking animation leg not spread"), the far (L) heel
     up, his off hand swung back), then the pass (his body up again, that leg's knee lifted through), then the other contact (the
     near heel up, the off hand swung forward and up), and its pass.
     His weapon hand goes down with him as each foot lands, so his weapon bobs with his step (the owner, 2026-11-07: "make weapon at
     least shake or moving a bit with unit walking"; its swing: gfx/weapons.js WEAPON_SWAY). His head and
     body never move against each other; each a list of moves [regions, side ('R' his right / 'L' his left / ''), dx, dy, rows
     from] */
  // (a stride (the owner, 2026-11-07: "make the left legs cross and go back, same with right leg. Just make it look like walking"):
  //  a leg's foot F px forward of where it stands (- back), its thigh's foot a pixel of it, its knee and shin more, its foot all of
  //  it (STRIDE_SPLIT: of F's 4, rows 11, 12-13, 14). His legs stand apart (the near leading), come together under him as they pass,
  //  then cross, the far leg leading, the near one behind; -x is forward
  const STRIDE_SPLIT={4:[1,2,1],2:[1,1,0],0:[0,0,0]},LEG=(sd,F)=>{const [a,b,c]=STRIDE_SPLIT[Math.abs(F)],k=-Math.sign(F);return F?[['tko',sd,k*a,0,11],['ko',sd,k*b,0,12],['o',sd,k*c,0,14]]:[]};
  const POSES={idle:[[]],walk:[
      [['sfncbupt','',0,1,0],['lh','',0,1,0],['o','L',0,-1,14],['h','L',1,0,0]],
      [...LEG('R',-2),...LEG('L',2),['ko','L',0,-1,13]],
      [['sfncbupt','',0,1,0],['lh','',0,1,0],...LEG('R',-4),...LEG('L',4),['o','R',0,-1,14],['h','L',-1,-1,0]],
      [...LEG('R',-2),...LEG('L',2),['ko','R',0,-1,13]]],
    // a blow: the weapon arm raised and forward
    strike:[[['lh','R',-1,-2,6]]]};

  const pick=(r,i)=>r[Math.max(0,Math.min(3,i))];
  // the skeleton for a race, as cells {x, y, r (region), s (shade), side}
  function skeleton(race,seat){const R=RACES[race]||RACES.human,out=[],cells=[];
    const Q=seat&&R.seat?{...R,...R.seat}:R;(seat?SKEL.map((r,i)=>i===10?SEAT_HANDS:r):SKEL).forEach((r,i)=>{if(Q.drop&&Q.drop.includes(i))return;out.push([r,i]);if(Q.dup&&Q.dup.includes(i))out.push([r,i])});
    // (wide: the middle column doubled from the shoulders to the thighs, his left half a pixel further out)
    out.forEach(([[rg,sh],row],y)=>{const w=R.wide&&row>=3&&row<=11;for(let x=0;x<rg.length;x++){if(rg[x]==='.')continue;const c={x:w&&x>4?x+1:x,y,row,r:rg[x],s:+sh[x],side:x<4?'R':x>4?'L':''};cells.push(c);
      if(w&&x===4)cells.push({...c,x:5,side:'L'})}});
    return{cells,rows:out.length,oy:D.H-1-out.length}}
  // its rows by the skeleton's own numbering (a dwarf's shorter body keeps the rows' meaning)
  const inRows=(c,p)=>!p.rows||c.row<0||c.row>=p.rows[0]&&c.row<=p.rows[1];

  /* a figure in two steps (the owner, 2026-11-06: "base sprites grayscale, so we can dynamically change colours, reused by factions"):
     its base (PX.dollBase), drawn once for its shapes, each pixel a colour slot (a channel: 'team', 'hair', 'skin' or a material's
     name, '#rrggbb' a fixed colour) and a tone (0 lit ... 3 the edge), shown grey; then painted (PX.dollPaint) from any palette, each
     channel a ramp of four tones. The bases are kept (by their shapes alone), so every side, faction and tint paints the same one.
     spec {race, skin, hair (colour), style (hair style), beard, uniform (a name or a list of [part, material, overrides]), team,
     weapon, shield, pose, frame, seed, bare, noShadow, drop, moves; and how to paint: ramp (a function, a channel's colour name to
     its ramp: a game's palette) or ramps (name -> ramp), else MAT}. Returns its picture (D.W x D.H) with anchors {hand, off, head,
     feet}, its gear (each piece: slot, kind, the anchor it hangs from and where, behind or before him), drawn apart (PX.dollGear);
     bare: the body alone, its gear left to whoever draws it (the battle turns a weapon through its blow), else laid on */
  // (the look (the owner, 2026-11-07: "avoid using too many shading to make unit sprite looks clean and distinguishable for each body
  //  part"): mottle, a share of a part's own; tones, each of the skeleton's four shades as drawn (lit and mid as one, the shade, the edge))
  const LOOK={mottle:0,tones:[0,1,2,3]};
  const BASES=new Map(),BASE_CAP=4000,GREY=['#c8c8c8','#9a9a9a','#6e6e6e','#464646'];
  const chanOf=m=>m==='team'||m==='hair'||m==='skin'?m:m;
  PX.dollBase=spec=>{const und=v=>v===undefined?'~':v,key=JSON.stringify([spec.race,spec.style,spec.beard,spec.beardStyle||null,spec.uniform,und(spec.weapon),und(spec.shield),spec.pose,spec.frame|0,spec.seed|0,!!spec.bare,!!spec.noShadow,spec.drop||null,spec.moves||null,!!spec.seat]);
    let B=BASES.get(key);if(B)return B;if(BASES.size>BASE_CAP)BASES.clear();
    const race=spec.race||'human',R=RACES[race]||RACES.human,seed=spec.seed|0,U=typeof spec.uniform==='string'?UNIFORMS[spec.uniform]:spec.uniform?{parts:spec.uniform}:null;
    const S=skeleton(race,spec.seat),ox=D.OX,oy=S.oy,G=new Array(D.W*D.H).fill(null),put=(x,y,k,t)=>{if(x>=0&&y>=0&&x<D.W&&y<D.H&&k)G[y*D.W+x]=[k,LOOK.tones[Math.max(0,Math.min(3,t|0))]]};
    // (the pose: each cell moved; moves: the caller's own, after the pose's: a glance back, the weight shifted)
    const moves=(((POSES[spec.pose]||POSES.idle)[(spec.frame|0)%((POSES[spec.pose]||POSES.idle).length)])||[]).concat(spec.moves||[]);
    const at=c=>{let x=c.x,y=c.y;for(const [rg,sd,dx,dy,from] of moves)if(rg.includes(c.r)&&(!sd||c.side===sd)&&c.row>=from){x+=dx;y+=dy}return[ox+x,oy+y]};
    const noise=(x,y,k)=>PX.hash(x,y,seed*31+k);
    // the parts in their slots' order: the uniform's, then the figure's own hair and beard (under a hood or a helm)
    // (each [part, material, overrides]: a part's own numbers changed for this figure, dark: its tones a step darker)
    const parts=[];for(const [n,m,x] of (U?U.parts:[]))if(PARTS[n])parts.push({...PARTS[n],...(x||{}),name:n,m:chanOf(m)});
    if(!parts.some(p=>p.cover&&p.cover.includes('p')||p.slot==='legs'))parts.push({...PARTS.loin,name:'loin',m:'linen'});
    const style=spec.style||'short';if(PARTS[style])parts.push({...PARTS[style],name:style,m:'hair'});if(spec.beard??R.beard)parts.push({...PARTS[spec.beardStyle]||PARTS.beard,name:'beard',m:'hair'});
    parts.sort((a,b)=>SLOTS.indexOf(a.slot)-SLOTS.indexOf(b.slot));
    const headCover=parts.some(p=>p.slot==='head'&&p.cover&&p.cover.includes('s')),slit=parts.some(p=>p.slit);
    const hands=S.cells.filter(c=>c.r==='h'),hR=hands.filter(c=>c.side==='R').sort((a,b)=>b.y-a.y)[0],hL=hands.filter(c=>c.side==='L').sort((a,b)=>b.y-a.y)[0];
    const hand=hR?at(hR):[ox,oy+9],off=hL?at(hL):[ox+8,oy+9];
    // (its gear, each piece apart (PX.dollGear): which, from which anchor, behind him or before him; laid on here only when not bare)
    const wk=spec.weapon===undefined?U&&U.weapon:spec.weapon,shk=spec.shield??(U&&U.shield),gear=[];
    if(WEAPONS[wk])gear.push({slot:'weapon',kind:wk,anchor:WEAPONS[wk].off?'off':'hand',at:WEAPONS[wk].off?off:hand,behind:!!WEAPONS[wk].behind});
    if(shk)gear.push({slot:'shield',kind:'shield',mat:chanOf(shk),anchor:'off',at:off,behind:false});
    const lay=behind=>{if(spec.bare)return;for(const q of gear){if(q.behind!==behind)continue;for(const [dx,dy,k,t] of gearPx(q.kind,q.mat))put(q.at[0]+dx,q.at[1]+dy,k,t)}};
    // the weapon behind him first, then the body: skin, then each part over the regions it covers
    lay(true);
    // (drop: regions of a side left off ([regions, side] each: an arm drawn apart in a blow); tones: what its sleeve and hand are)
    const dropped=c=>(spec.drop||[]).some(([rg,sd])=>rg.includes(c.r)&&(!sd||c.side===sd)),tones={};
    for(const c of S.cells){const [x,y]=at(c);let k='skin',t=c.s;
      for(const p of parts){if(!p.cover||!p.cover.includes(c.r)||!inRows(c,p)||p.cols&&(c.x<p.cols[0]||c.x>p.cols[1]))continue;if(p.slot==='hair'&&headCover)continue;
        t=c.s+(p.dark|0);if(p.mottle&&noise(x,y,p.slot.length)<p.mottle*LOOK.mottle)t+=noise(x,y,7)<.5?1:-1;k=p.m}
      if(slit&&c.r==='f'&&c.row===1){k='black';t=3}
      if(c.side==='R'&&!tones[c.r])tones[c.r]=[k,Math.max(0,Math.min(3,t))];if(!dropped(c))put(x,y,k,t)}
    // (a robe's skirt (the owner, 2026-11-07: "mage should wear robes as the reference"): whole from leg to leg down to his feet, its hem
    //  a pixel wider each side on its last two rows and darker on the last)
    for(const p of parts){if(!p.skirt)continue;const by=new Map();for(const c of S.cells){if(c.r!=='k'||dropped(c))continue;const [x,y]=at(c),r=by.get(y)||[x,x];by.set(y,[Math.min(r[0],x),Math.max(r[1],x)])}
      const ys=[...by.keys()].sort((a,b)=>a-b),last=ys[ys.length-1];for(const y of ys){const [x0,x1]=by.get(y),f=y>=last-1?1:0;for(let x=x0-f;x<=x1+f;x++)put(x,y,p.m,y===last?2:x===x0-f||x===x1+f?2:1)}}
    // the parts' own pixels round their anchors: the head's (the scalp's top left) or the body's
    const scalp=S.cells.filter(c=>c.r==='s'),hx=scalp.length?Math.min(...scalp.map(c=>at(c)[0])):ox+2,hy=scalp.length?Math.min(...scalp.map(c=>at(c)[1])):oy;
    for(const p of parts){if(!p.shape||p.slot==='hair'&&headCover)continue;const [ax,ay0]=p.shape.at==='head'?[hx-1,hy]:[ox,oy],ay=ay0-(p.shape.up||0);
      p.shape.rows.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch==='.')return;const x=ax+i,y=ay+j;let t=+ch;if(p.mottle&&noise(x,y,9)<p.mottle*LOOK.mottle)t+=1;put(x,y,p.m,t)}))}
    // the lines: a belt across the hips (a buckle), a sash, a strap from his right shoulder to his left hip
    for(const p of parts){if(!p.line)continue;const hips=S.cells.filter(c=>c.r==='p'),py=hips.length?at(hips[0])[1]:oy+8;
      if(p.line==='belt'||p.line==='sash'){for(const c of hips){const [x,y]=at(c);put(x,y,p.m,c.x===4&&p.line==='belt'?0:2+(c.x===2||c.x===6?1:0))}if(p.line==='belt')put(ox+4,py,'gold',1)}
      else{const top=[ox+2,oy+3+(S.rows<15?-1:0)];for(let k=0;k<=5;k++)put(top[0]+Math.round(k*.8),top[1]+k,p.m,k&1?3:2)}}
    // his race's own: an elf's ears, an orc's tusks (over a bare head only)
    if(R.ears&&!headCover)put(hx+3,hy+1,'skin',1);// (an elf's ear behind his face, in his hair: before it, it read as a nose)if(R.goblinEars){put(hx+3,hy+1,'skin',1);put(hx+4,hy+1,'skin',1);put(hx+4,hy,'skin',2)}if(R.tusk)put(hx+1,hy+2,'#f0ecd8',0);
    // the gear before him: the shield on his left arm, a weapon in front
    lay(false);
    // the shadow underfoot
    const feet=S.cells.filter(c=>c.r==='o').map(at),fy=feet.length?Math.max(...feet.map(f=>f[1]))+1:D.H-1;
    if(!spec.noShadow)for(let x=ox+1;x<=ox+8;x++)if(!G[fy*D.W+x])put(x,fy,feet.some(f=>f[0]===x)?SHADOW[1]:SHADOW[0],0);
    // (its index: a channel number and a tone a pixel; its channels; its grey picture)
    const chans=[],K=new Uint16Array(D.W*D.H),T=new Uint8Array(D.W*D.H);G.forEach((c,i)=>{if(!c)return;let j=chans.indexOf(c[0]);if(j<0){j=chans.length;chans.push(c[0])}K[i]=j+1;T[i]=c[1]});
    const cv=PX.canvas(D.W,D.H,g=>{const im=g.createImageData(D.W,D.H),o=im.data;for(let i=0;i<K.length;i++){if(!K[i])continue;const c=GREY[T[i]];o[i*4]=o[i*4+1]=o[i*4+2]=parseInt(c.slice(1,3),16);o[i*4+3]=255}g.putImageData(im,0,0)});
    B={grey:cv,K,T,chans,anchors:{hand,off,head:[hx,hy],feet:[ox+4,fy]},gear,tones,rows:S.rows,oy,race};BASES.set(key,B);return B};
  // a channel's ramp for a spec: '#rrggbb' fixed; team, hair, skin by the spec's own; then the caller's ramp (a function) or ramps, MAT
  const rampFor=spec=>{const race=spec.race||'human',R=RACES[race]||RACES.human,F=spec.ramp,Rm=spec.ramps;
    return n=>{if(n[0]==='#')return[n,n,n,n];const nm=n==='team'?spec.team||'blue':n==='hair'?spec.hair||'brown':n==='skin'?spec.skin||R.skin:n;
      const f=F&&F(nm);if(f)return f;if(Rm&&Rm[nm])return Rm[nm];if(n==='hair')return MAT[HAIR_MAT[nm]]||MAT[nm]||MAT.brown;return MAT[nm]||MAT.grey}};
  // a base painted: each channel's ramp (ramp(channel) -> four tones), its tone of it
  PX.dollPaint=(B,ramp)=>{const rs=B.chans.map(ramp),cv=PX.canvas(D.W,D.H,g=>{const im=g.createImageData(D.W,D.H),o=im.data;
      for(let i=0;i<B.K.length;i++){if(!B.K[i])continue;const c=rs[B.K[i]-1][B.T[i]];o[i*4]=parseInt(c.slice(1,3),16);o[i*4+1]=parseInt(c.slice(3,5),16);o[i*4+2]=parseInt(c.slice(5,7),16);o[i*4+3]=255}g.putImageData(im,0,0)});
    const tones={};for(const [r,[k,t]] of Object.entries(B.tones))tones[r]=ramp(k)[t];
    Object.assign(cv,{anchors:B.anchors,gear:B.gear,tones,rows:B.rows,oy:B.oy,base:B});return cv};
  PX.doll=spec=>PX.dollPaint(PX.dollBase(spec),rampFor(spec));
  /* a piece of gear, apart from the body: its pixels [dx, dy, channel, tone] from its grip (a weapon's hand, a shield's arm). A weapon
     (WEAPONS): its shaft or grip in its wood or leather, its head in its metal; a shield: its face in its colour (m) inside an iron
     rim, a boss in the middle, four wide and six tall, its point down */
  function gearPx(kind,m){const o=[];
    if(kind==='shield'){for(let j=-4;j<=1;j++)for(let i=-1;i<=2;i++){if(j===1&&(i<0||i>1))continue;const rim=i===-1||i===2||j===-4||j===1;o.push(rim?[i,j,'iron',i===2||j===1?3:1]:[i,j,m||'blue',i===0?0:1])}o.push([1,-2,'steel',0]);return o}
    const W=WEAPONS[kind];if(!W)return o;for(const [dx,dy] of W.pts)o.push([dx,dy,W.mat,1]);for(const [dx,dy] of W.head||[])o.push([dx,dy,W.hm,0]);return o}
  // the same as its own picture: ax, ay its grip in it (the game draws it from the hand anchor, and turns it through a blow); m: a
  // shield's colour (a material or a spec's team), ramp: how to paint it (as PX.doll's)
  PX.dollGear=(kind,m,ramp)=>{const P=gearPx(kind,m);if(!P.length)return null;const R=ramp||rampFor({}),x0=Math.min(...P.map(p=>p[0])),y0=Math.min(...P.map(p=>p[1])),x1=Math.max(...P.map(p=>p[0])),y1=Math.max(...P.map(p=>p[1]));
    const cv=PX.canvas(x1-x0+1,y1-y0+1,g=>{for(const [x,y,k,t] of P){g.fillStyle=R(k)[t];g.fillRect(x-x0,y-y0,1,1)}});cv.ax=-x0;cv.ay=-y0;cv.behind=kind!=='shield'&&!!(WEAPONS[kind]||{}).behind;return cv};
  PX.dollClear=()=>BASES.clear();
  PX.DOLL={D,SKEL,RACES,LOOK,MAT,SLOTS,PARTS,UNIFORMS,WEAPONS,POSES,HAIR_MAT};
})(window.PX=window.PX||{});
