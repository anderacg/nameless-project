'use strict';
/* ---------- faces (the owner, 2026-11-07: "another developer developed a portrait generator: utilize that and include the creation
   into our game; the lords and named heroes, companions can also use generated portraits; make hair style match with portraits")
   Every named face is the portrait engine's (engine/face arts/grayscale: PortraitEngine draws it, PortraitCharacters keeps it):
   a recipe kept by its stable id in the world's roster (saved as 'faces'), never rerolled once made, its picture drawn once and
   kept (FACES.px a side, pixel for pixel). Your hero's is the roster's player: made on the New game page (the face maker: the
   portrait workshop's controls, every part of your race's, every tint a colour picker, its proportions, a preset), else one drawn for you as the game starts. A
   lord's by name (its realm's race, a woman or a man as pronouns.js says), a companion's by id (COMPS: race, gender); both made
   the first time they are shown, the roster keeping each unlike your own face and every other; yours and a companion's drawn
   bareheaded (Faces.bare: their hair shows, as on their figures; yours unless you chose headwear), a lord's in its hat or crown
   and its realm's colour. FACES.on false, or the engine
   missing: the painted portraits and sprites as before (characterportraits.js).
   The figure matches the face (Faces.look): your hero's and a companion's hair on the battle doll as the portrait's (its length:
   FACE_HAIR by the engine's hairGroups, a bun its own; its colour the portrait's), a beard if it has one
   (dollfigs.js: o.hairStyle, o.beardStyle; no eye, as every soldier) ---------- */
const FACES={on:true,px:256,mode:'random'};
/* (the owner, 2026-11-09: "Can you make the face a bit more like dwarf?") a dwarf's face by the marks of their people (FACE_KIN,
   Faces.kin): the engine draws a dwarf from every face and nose a human may have, so any of theirs not of their people's own is
   swapped for one that is (face, nose, ears, brows; a man's thin beard a full or braided one), each drawn
   from the face's own seed (the same face every time), and the face made broader (adj: at least these, the engine's bounds). Hairstyles stay shared; the engine biases random cuts by race.
   Every dwarf the world draws: a lord's, a companion's, a kinsman's, a face drawn at random (yours before you shape it); the face
   you made yourself is as you made it */
const FACE_KIN={dwarf:{face:['dwarven','dwarf-square'],nose:['dwarf-bulb','dwarf-broad-bridge','dwarf-broken'],ears:['rounded','broad'],eyes:['deep-set','heavy','focused','dwarf-deep','dwarf-squint'],
  brows:{m:['dwarf-bushy','dwarf-straight','dwarf-weathered','bold'],f:['full-soft','dwarf-straight','dwarf-bushy']},
  beard:{m:['braided','bound-beard','full','forked','dwarf-fan','dwarf-twin-braids']},thin:['none','stubble','goatee','moustache','trimmed','short-boxed','close-beard','sideburns','chin-bristle'],
  // (each proportion at least lo to hi (a man's m, a woman's f), or at most for one below nought: smaller eyes)
  adj:{faceWidth:[2,2],jawWidth:{m:[2,2],f:[1,2]},noseWidth:[1,2],eyeSize:{m:[-1,0],f:[-1,-1]},hairVolume:[0,1]}},
  /* (the owner, 2026-11-09: "make sure all race or factions use the correct appearance and features on their portrait") a goblin:
     the engine has none, so an orc's face made small and sharp: a narrow jaw, big pointed ears and big eyes, a long thin nose,
     little tusks or a sly grin, no beard to speak of; mostly bald (FACE_LOOK) and green-yellow (FACE_LOOK.skin) */
  goblin:{face:['orcish','strong-jaw'],ears:['pointed'],nose:['wide-tip','crooked'],eyes:['keen','natural-wide','deep-almond'],mouth:['small-tusks','asymmetric-smile','stern'],
    beard:{m:['none','chin-bristle'],f:['none']},adj:{faceWidth:[-2,-1],jawWidth:[-2,-2],earSize:[1,1],eyeSize:[1,1],eyeSpacing:[1,2],noseWidth:[-2,-1],mouthWidth:[1,2]}},
  /* (the owner's approved orc study, 2026-11-10, engine/face arts: doc/ORC_PORTRAIT_DESIGN.md) an orc the world draws: the shared hair
     catalog with racial preferences, a flat broad nose, an orc's ears, its tusks, at most a short bristle. world:
     the world's faces only, never yours or a companion's (theirs the engine's own, as you shape yours). A heavy one's face: FACE_UNIT.heavy */
  orc:{world:true,face:['orcish','broad','strong-jaw'],nose:['orc-flat','orc-broad','orc-flat','broad'],ears:['orc','orc','pointed'],mouth:['small-tusks','heavy-tusks','heavy-tusks','stern'],
    brows:['bold','broken','flat','bold'],
    beard:{m:['none','none','stubble','chin-bristle','scruffy'],f:['none']}}};
// (the engine's own peoples: a goblin's face is drawn on an orc's)
const FACE_RACE={goblin:'orc',hobgoblin:'orc'};
/* (the owner: "Dont forget to have bald (or none hair) as well"; every face the world draws, yours before you shape it) bald: the
   share of a people's men (m) and women (f) with no hair; skin and hair: each people's tones, one by the face's seed (the engine
   gives every face of a people the same two); skinOf, hairOf: a figure's (gfx/people.js PPAL) as a portrait's, so a troop's face
   is its figure's */
const FACE_LOOK={bald:{human:{m:.14},dwarf:{m:.2},orc:{m:.3,f:.04},elf:{m:.02},goblin:{m:.85,f:.5}},
  skin:{human:['#e2b896','#d2a37e','#bf8f6b','#a87656','#8a5c40','#6a4430'],dwarf:['#cfa283','#bd8f70','#a87b5e','#d9b090'],elf:['#e4d2c0','#d6bfa8','#c8ae96','#b89c84'],
    orc:['#76885a','#66784a','#5a6a40','#7c8060','#6e7a58'],goblin:['#7e8c42','#8a9448','#6e7c36','#909650']},
  hair:{human:['#2a211c','#45372e','#5e4130','#7a4a2a','#9a5a2c','#b98a50','#8f8a84','#4a3e36'],dwarf:['#9a4e24','#76543a','#3a2c22','#b8823e','#8c8680','#c09858'],
    elf:['#c8b27a','#e0d6b0','#d8d8d0','#8a6a44','#3a3028','#a18c60'],orc:['#2a2820','#1c1b16','#40362a','#5e5c52'],goblin:['#2a2820','#3a3226','#4a4030']},
  skinOf:{skin:'#e2b896',skinTan:'#bf8f6b',skinDark:'#8a5c40',elf:'#d6bfa8',dwarf:'#bd8f70',orc:'#6e8050',orcDark:'#5a6a40',orcGrey:'#727a62',goblin:'#7e8c42',goblinDark:'#6a7834',hobgoblin:'#a8704a'},
  hairOf:{brown:'#5e4130',blond:'#b98a50',black:'#2a211c',ginger:'#9a4e24',grey:'#8f8a84',silver:'#d8d8d0'}};
/* (the owner, 2026-11-09: "Make sure to change old unit portrait (unitcard) to generated sprite and please use most relevant armor
   for each unit") a troop's portrait is a face of its people (Faces.unit), dressed as its figure is (gfx/people.js lookOf): its
   armour (body: by the armour it wears, its people's make where they have one; robe a caster's; plain a worker's clothes by their
   colour), its helm as headwear (head), the figure's colours (its cloth, its metal: metal, its skin and hair), where the rules
   miss the kind's own (own: clothing, headwear); a list, one by the face's seed (the leather and harness kits of the approved orc study
   for every people: the owner, 2026-11-10, "leather or harness can be wore by everyone"); women: the share of each people's troops
   who are; beasts keep their paintings */
const FACE_UNIT={women:{human:.15,elf:.35,orc:.1,dwarf:.1,goblin:0},
  body:{plate:{any:'plate',dwarf:'dwarf-iron-guard',orc:'orc-lamellar',elf:'elf-leaf-mail'},mail:{any:'mail',orc:'orc-lamellar',elf:'elf-leaf-mail'},
    leather:{any:['gambeson','orc-leather-vest','orc-studded-leather','orc-leather-guard'],orc:['orc-leather-vest','orc-studded-leather','orc-leather-guard'],dwarf:['leather','orc-studded-leather','orc-leather-guard'],
      elf:['leather-mail','orc-leather-vest'],goblin:['orc-leather-vest','orc-studded-leather']},
    hide:{any:['fur','orc-layered-hide','orc-cross-harness'],orc:['orc-layered-hide','orc-cross-harness','orc-ring-harness'],dwarf:['fur','orc-layered-hide'],goblin:'orc-layered-hide'},none:{any:'tunic',elf:'leaf-mantle',orc:['orc-bare-cross-harness','orc-bare-ring-harness'],dwarf:'fur',goblin:['orc-bare-cross-harness','orc-bare-ring-harness']}},
  // (the approved orc study: a heavy orc's face, its head smaller (the engine's 75%), on those in mail or plate)
  heavy:{orc:{armor:['mail','plate'],face:'orc-heavy'}},
  robe:{any:'robe',elf:'embroidered-robe'},
  plain:{leather:'leather',fur:'fur',forest:'jerkin',cloth:'tunic',blue:'linen-chemise',any:'tunic'},
  head:{cap:'arming-cap',kettle:'kettle',great:{any:'ridge-helm',dwarf:'dwarf-guard-helm',orc:'orc-war-helm',elf:'elf-guard-helm'},horned:{any:'round-helm',dwarf:'forge-helm',orc:'orc-war-helm'},
    hood:'hood',bare:'none',circlet:{any:'circlet',elf:'leaf-circlet'},wizard:'wrapped-hood',plume:'sallet',straw:'straw-hat',bandana:'headband',skull:'warband'},
  // (a people known by their ears (elves, goblins): a hood down, so they show)
  open:{elf:{hood:'leaf-circlet'},goblin:{hood:'none'}},
  metal:{steel:'#8f969a',iron:'#6e737c',silver:'#b8c0c8',gold:'#b8923a',rust:'#8a5a3a'},
  own:{hum_knight:['plate','sallet'],hum_guard:['coat-of-plates','open-bascinet'],hum_sergeant:['steel-cuirass','sallet'],hum_champ:['surcoat','open-bascinet'],
    hum_bow:['padded-jack','arming-cap'],hum_crossbow:['padded-jack','kettle'],hum_xbow:['leather-mail','kettle'],hum_long:['padded-jack','hood'],hum_hbow:['leather','hood'],hum_lancer:['mail','nasal'],
    hum_pike:['brigandine','kettle'],hum_levy:['gambeson','arming-cap'],hum_foot:['gambeson','coif'],hum_sword:['mail','nasal'],hum_spear:['mail','nasal'],hum_squire:['mail','kettle'],
    chief:['fur','fur-cap'],horse:['mail','nasal'],dw_rune:['rune-mail','forge-helm'],dw_longbeard:['rune-mail','forge-helm'],dw_thane:['rune-mail','forge-helm'],dw_hammer:['dwarf-iron-guard','dwarf-guard-helm'],
    dw_xbow:['mail','kettle'],elf_sharp:['elf-leaf-mail','leaf-circlet'],elf_blade:['leather-mail','leaf-circlet'],elf_eternal:['elf-leaf-mail','leaf-circlet'],
    orc_shaman:['fur','warband'],orc_reaver:['orc-bare-cross-harness','warband'],orc_wolf:['orc-leather-guard','warband'],orc_wolfbow:['orc-studded-leather','warband'],orc_thrower:['orc-leather-vest','none'],
    elf_glade:['leaf-mantle','hood'],gob_stab:['orc-leather-vest','none'],gob_bow:['orc-bare-ring-harness','hood'],gob_boss:['orc-layered-hide','hood']}};
/* (the owner, 2026-11-09: "Ensure that the characters wearing the correct armor or equipment based on their current armor and make
   sure lords are having a good armor") a face dressed as its wearer is (Faces.dress): the body armour worn its clothing, by its tier
   (body: wood a padded jack … adamant plate; bodyOf: a people's own make where it has one; items: the pieces of beasts' hides),
   its metal the armour's material (gear.js MATERIALS); a helm its headwear by tier (head, headOf), else the face's own; a cloak
   and no armour, a cloak; nothing worn, the face's own clothes, but never armour or a helm not worn (plain: your past's clothes). A lord has no gear: he is armoured by his standing (lord: the tier
   from his level, from at least min, lv levels a tier; his realm's colour on it and his crown kept); his house's kin are not */
const FACE_GEAR={
  body:['padded-jack','scale','mail','brigandine','coat-of-plates','steel-cuirass','plate'],
  bodyOf:{dwarf:[null,null,'dwarf-iron-guard','dwarf-iron-guard','rune-mail','rune-mail','rune-mail'],orc:[null,'lamellar','orc-lamellar','orc-lamellar','orc-lamellar','steel-cuirass','plate'],
    elf:[null,null,'elf-leaf-mail','elf-leaf-mail','elf-leaf-mail','steel-cuirass','plate']},
  items:{bearcoat:'fur',silkvest:'jerkin',scorpplate:'lamellar',trollhide:{orc:'orc-layered-hide',any:'fur'}},
  head:['arming-cap','coif','nasal','kettle','sallet','open-bascinet','closed-knight-helm'],
  headOf:{dwarf:[null,null,'dwarf-guard-helm','dwarf-guard-helm','forge-helm','forge-helm','visored-bascinet'],orc:[null,null,'orc-war-helm','orc-war-helm','orc-war-helm','orc-war-helm','slit-mask-helm'],
    elf:[null,null,'elf-guard-helm','elf-guard-helm','elf-guard-helm','elf-guard-helm','closed-sallet']},
  cape:'cloak',
  // (no armour worn: a face's own armour (armours) its past's plain clothes (plain; any: anyone else's), its own helm (helms) off)
  armours:['orc-bare-cross-harness','orc-bare-ring-harness','orc-leather-vest','orc-studded-leather','orc-cross-harness','orc-ring-harness','orc-layered-hide','orc-leather-guard','mail','brigandine','scale','lamellar','plate','ruffled-mail','rune-mail','leather-mail','coat-of-plates','steel-cuirass','dwarf-iron-guard','orc-lamellar','elf-leaf-mail','dwarf-runic-plate','dwarf-forge-plate','elf-silver-scale','elf-leaf-cuirass'],
  helms:['barrel-great-helm','rivet-banded-helm','fluted-knight-helm','horned-closed-helm','leaf-visor-helm','tusked-closed-helm','great-helm','closed-knight-helm','visored-bascinet','closed-sallet','beaked-bascinet','slit-mask-helm','coif','nasal','kettle','round-helm','forge-helm','open-bascinet','sallet','ridge-helm','dwarf-guard-helm','orc-war-helm','elf-guard-helm','horned-helm','dwarf-horned-helm','dwarf-rune-helm','elf-winged-helm'],
  plain:{soldier:'gambeson',guard:'gambeson',woodcutter:'jerkin',exile:'leather',merchant:'doublet',hedge:'robe',nobody:'linen-chemise',apprentice:'tunic',any:'traveler-coat'},
  // (the metal's colour: its material's, steel (steel) mixed in by tint, so gold reads gilt and mithril pale, not paint)
  steel:'#8f969a',tint:.5,
  lord:{min:3,lv:3}
};
// (the doll's hair by the portrait's: its length group, the tied-up styles a bun on top; no hair, none)
const FACE_HAIR={Short:'crop',Medium:'cropMid',Long:'cropLong','No hair':'bald',bun:['high-bun','low-bun','topknot','braided-crown','war-crest']};
/* the face maker's controls, as the portrait workshop's (engine/face arts/grayscale workshop.js): each part a list of your race's
   choices (FACE_PARTS: the engine's options but your race, chosen above; their names), each tint a colour picker (FACE_TINTS), the
   eight proportions a slider each (the engine's adjustments, their own bounds), a preset of your race */
const FACE_PARTS=[['face','Face'],['ears','Ears'],['hair','Hair'],['eyes','Eyes'],['brows','Brows'],['nose','Nose'],['mouth','Mouth'],['beard','Facial hair'],['age','Age'],['marks','Marks'],['clothing','Clothing'],['headwear','Headwear']];
const FACE_TINTS=[['skin','Skin'],['hair','Hair'],['iris','Eyes'],['lips','Lips'],['cloth','Cloth'],['metal','Metal'],['headwear','Headwear']];
class Faces{
  static ok(){return FACES.on&&typeof PortraitCharacters!=='undefined'&&typeof PortraitEngine!=='undefined'}
  static profileOf(g){return g==='f'?'female':'male'}
  static raceOf(r){r=FACE_RACE[r]||r;return PortraitEngine.races.includes(r)?r:'human'}
  // (a face drawn at random for a race and a man or a woman, its seed given)
  // (own: your own face, as the engine and its people's marks make it: no tone or bald head of the world's, FACE_LOOK; you choose yours)
  static random(seed,race,g,own){return this.kin(PortraitCharacters.recipe({config:this.bare(PortraitEngine.random(seed>>>0,this.profileOf(g),this.raceOf(race)))}),race,own)}
  /* (a face by the marks of its people (race: the wearer's, a goblin on an orc's face; FACE_KIN: none, as it is), each choice from
     its own seed: a part not of theirs swapped for one that is (a dwarf's thin beard only for a full one); bald by its people's
     share (FACE_LOOK.bald); its skin and hair one of its people's tones, unless chosen (colours not the engine's own); mine: your
     own face, its people's marks only) */
  static kin(rec,race,mine){if(!rec)return rec;const r=rec.config.race,r0=race&&this.raceOf(race)===r?race:r,K=FACE_KIN[r0],c={...rec.config,adjustments:{...rec.config.adjustments}},f=c.profile==='female'?'f':'m',
      H=k=>PortraitCharacters.hash(c.seed+'/'+r0+'/'+k),pick=(k,L)=>L[H(k)%L.length],set=(k,L)=>{if(L&&!L.includes(c[k])){const v=pick(k,L.filter(x=>this.fits(r,k,x)));if(v)c[k]=v}};
    if(K&&!(mine&&K.world)){for(const k of['face','nose','ears','eyes','brows','mouth'])set(k,Array.isArray(K[k])?K[k]:K[k]?.[f]);
      const B=K.beard?.[f];if(B&&(!K.thin||K.thin.includes(c.beard)))set('beard',B);
      for(const k in K.adj||{}){const A=PortraitEngine.adjustments[k],R=Array.isArray(K.adj[k])?K.adj[k]:K.adj[k][f],[lo,hi]=R,n=lo+H('adj/'+k)%(hi-lo+1),v=c.adjustments[k]||0;
        if(A)c.adjustments[k]=Math.max(A.min,Math.min(A.max,n<0?Math.min(v,n):Math.max(v,n)))}}
    if(mine)return {...rec,config:PortraitEngine.normalize(c)};
    const bald=FACE_LOOK.bald[r0]?.[f]||0;if(bald&&c.hair!=='none'&&H('bald')%1000<bald*1000&&this.fits(r,'hair','none'))c.hair='none';
    const pal=PortraitCharacters.palettes[r]||{},own=rec.colors&&(rec.colors.skin&&rec.colors.skin!==pal.skin||rec.colors.hair&&rec.colors.hair!==pal.hair);
    return {...rec,config:PortraitEngine.normalize(c),colors:own?rec.colors:{...rec.colors,...this.tone(r0,c.seed)}}}
  // (a people's skin and hair, one of each by a seed: FACE_LOOK)
  static tone(race,seed){const L=FACE_LOOK,S=L.skin[race],Hr=L.hair[race],h=k=>PortraitCharacters.hash(seed+'/tone/'+k),o={};if(S)o.skin=S[h('s')%S.length];if(Hr)o.hair=Hr[h('h')%Hr.length];return o}
  // (bareheaded: your hero's and a companion's face shows its hair, as their figures do; a lord's keeps its hat, helm or crown)
  static bare(c){return PortraitEngine.normalize({...c,headwear:'none'})}
  // ---- the New game page's face: the draft, made again when your race or your hero's gender changes
  static draftFor(race,g){const D=this.draft;if(D&&D.race===race&&D.g===g)return D.rec;
    const rec=D?.rec?PortraitCharacters.recipe({config:{...PortraitEngine.startProfile(this.profileOf(g),PortraitEngine.startRace(this.raceOf(race),D.rec.config)),hair:D.rec.config.hair},colors:{}}):this.random(Math.random()*4294967296,race,g,true);
    this.draft={race,g,rec};return rec}
  static maker(race,g){if(!this.ok())return '';const E=PortraitEngine,rec=this.draftFor(race,g),c=rec.config,r=this.raceOf(race);
    const part=([k,n])=>{const L=E.partsFor(r,k);return L.length<2?'':'<label class="fm-row"><span>'+n+'</span><select data-fm-part="'+k+'">'+L.map(v=>'<option value="'+v+'"'+(v===c[k]?' selected':'')+'>'+this.partName(v)+'</option>').join('')+'</select></label>'};
    const tint=([k,n])=>'<label class="fm-tint"><input type="color" data-fm-tint="'+k+'" value="'+(rec.colors[k]||E.colors[k])+'"><span>'+n+'</span></label>';
    const adj=([k,A])=>'<label class="fm-row"><span>'+A.name+'</span><input type="range" data-fm-adj="'+k+'" min="'+A.min+'" max="'+A.max+'" step="1" value="'+(c.adjustments?.[k]||0)+'"><b>'+(c.adjustments?.[k]||0)+'</b></label>';
    const pre=(E.presets||[]).map((p,i)=>[p,i]).filter(([p])=>this.raceOf(p.config?.race)===r);
    return '<div class="face-maker"><div class="fm-side"><img class="fm-pic" src="'+this.url(rec,true)+'" alt="Your face"><button class="btn sm" type="button" data-act="fm-random">Random face</button>'+
      (pre.length?'<select data-fm-preset aria-label="Preset"><option value="">Preset…</option>'+pre.map(([p,i])=>'<option value="'+i+'">'+htmlText(p.name)+'</option>').join('')+'</select>':'')+'</div>'+
      '<div class="fm-main"><div class="fm-rows">'+FACE_PARTS.map(part).join('')+'</div><div class="fm-tints">'+FACE_TINTS.map(tint).join('')+'</div><div class="fm-rows fm-adj">'+Object.entries(E.adjustments).map(adj).join('')+'</div></div></div>'}
  static partName(v){return (typeof PortraitEngine!=='undefined'&&PortraitEngine.partLabels?.[v])||String(v).replace(/-/g,' ').replace(/^./,s=>s.toUpperCase())}
  // (a part chosen (the draft made again within your race's choices), a tint, a proportion, a preset of your race)
  static set(k,v){const D=this.draft;if(!D)return;D.rec=PortraitCharacters.recipe({config:PortraitEngine.normalize({...D.rec.config,[k]:v}),colors:D.rec.colors})}
  static tint(k,v){const D=this.draft;if(D&&/^#[0-9a-f]{6}$/i.test(v))D.rec={...D.rec,colors:{...D.rec.colors,[k]:v}}}
  static adjust(k,v){const D=this.draft,A=PortraitEngine.adjustments[k];if(!D||!A)return;const n=Math.max(A.min,Math.min(A.max,Math.round(+v||0)));
    D.rec=PortraitCharacters.recipe({config:PortraitEngine.normalize({...D.rec.config,adjustments:{...D.rec.config.adjustments,[k]:n}}),colors:D.rec.colors})}
  static preset(i){const D=this.draft,p=PortraitEngine.presets?.[+i];if(!D||!p)return;D.rec=PortraitCharacters.recipe({config:PortraitEngine.startRace(this.raceOf(D.race),PortraitEngine.normalize(p.config)),colors:D.rec.colors})}
  static reroll(){const D=this.draft;if(D)D.rec=this.random(Math.random()*4294967296,D.race,D.g,true)}
  // (the portrait shown again as a picker or a slider moves, the page kept as it is)
  static refresh(){const img=panel.querySelector('.fm-pic');if(img&&this.draft)img.src=this.url(this.draft.rec,true)}
  // ---- the world's roster: made as the game starts (your face the page's, else one drawn by your race and gender), or loaded
  // (from the world's seed alone (Rng.worldOf): made before the game's number is drawn, from the last game's it made a second new
  // game's faces unlike a fresh page's, worldsave)
  static start(){this.R=null;this.pics=new Map();if(!this.ok())return;const g=P.gender==='f'?'f':'m',D=this.draft,
      rec=D&&D.race===P.race&&D.g===g?D.rec:this.random(Rng.worldOf('face:you'),P.race,g,true);this.draft=null;
    try{this.R=new PortraitCharacters.Roster({seed:Rng.worldOf('faces'),player:rec})}catch(e){this.R=null}}
  // (a new person in the same world, world/legacy.js: a face of their own (n: the generation), kin's like the one who fell, theirs
  // the same shape of face, nose and ears and the same skin, hair and eyes; the world's faces kept as they were, saved: the roster's)
  // (young: kin just come of age, a young face, no beard yet)
  static next(saved,old,n,young){if(!this.ok())return;const g=P.gender==='f'?'f':'m',C=PortraitCharacters;let rec=null;
    if(old?.config)try{const base=PortraitEngine.normalize({...old.config,profile:this.profileOf(g),race:this.raceOf(P.race)}),
        [c]=C.variations({base,seed:Rng.seedOf('face:kin:'+n),count:1,locks:['face','nose','ears']});
      rec=C.recipe({config:this.bare(c),colors:{skin:old.colors?.skin,hair:old.colors?.hair,iris:old.colors?.iris}})}catch(e){rec=null}
    rec??=this.random(Rng.seedOf('face:you:'+n),P.race,g,true);if(young&&rec)rec={...rec,config:PortraitEngine.normalize({...rec.config,age:'young',beard:'none'})};
    try{this.R=new C.Roster({seed:saved?.seed??Rng.seedOf('faces'),player:rec,characters:saved?.characters||[]})}
    catch(e){try{this.R=new C.Roster({seed:Rng.seedOf('faces'),player:rec})}catch(e2){}}}
  static save(){return this.R?this.R.export():undefined}
  static load(v){this.R=null;this.pics=new Map();if(!this.ok())return;if(!v){this.start();return}try{this.R=PortraitCharacters.Roster.restore(v)}catch(e){this.R=null}}
  // (a recipe's picture: drawn once, FACES.px a side, pixel for pixel, kept by its recipe)
  static url(rec,draft){const key=JSON.stringify(rec);this.pics??=new Map();let u=this.pics.get(key);if(u)return u;
    const src=globalThis.PortraitArtwork?.loaded?PortraitArtwork.render(rec.config,{colors:rec.colors}):PortraitEngine.composite(PortraitEngine.build(rec.config),{colors:rec.colors}),n=FACES.px;
    u=mkc(n,n,g=>{g.imageSmoothingEnabled=false;g.drawImage(src,0,0,n,n)}).toDataURL();if(!draft)this.pics.set(key,u);return u}
  // ---- the faces: yours, a lord's, a companion's (null: none, the old pictures stand)
  static you(){return this.R?this.R.player:null}
  // (one of the world's faces by its id, made the first time; drawn by the marks of its people: kin)
  // (mine: a face kept as the engine and its people's marks make it, as yours: a companion's, whose figure in battle wears its hair)
  static of(id,race,g,role,mine){if(!this.R)return null;let r=this.R.get(id);if(r)return this.kin(r,race,mine);
    try{r=this.R.create({id,race:this.raceOf(race),profile:this.profileOf(g),role,mode:FACES.mode})}catch(e){return null}return this.kin(r,race,mine)}
  // (one of a lord's house's kin, or a lord who was one (kinFace): the face kept by their id, as they grow up and take up a title;
  // a child's young and beardless: world/lineage.js)
  static lord(l){const name=l&&(l.name||l.id);if(!name)return null;const F=FACS[l.fac],rs=l.race?[l.race]:F?.races||['human'];
    let r=this.of(l.kinFace?'kin:'+l.id:'lord:'+name,rs[Rng.seedOf('face:'+name)%rs.length],genderOf(l)||'m','lord');
    if(r&&l.young)r={...r,config:PortraitEngine.normalize({...r.config,age:'young',beard:'none'})};
    // (a lord in armour fit for him; a child, or one of his house's kin (plain), in the clothes of the house)
    if(r&&!l.young&&!l.plain)r=this.armoured(r,l);
    // (in its realm's colour: a recipe's cloth, drawn so, its saved face unchanged)
    return r&&F?{...r,colors:{...r.colors,cloth:PX.shade(F.col,.7)}}:r}
  // (a companion's, bareheaded, in what they wear: P.comps' gear)
  static companion(id){const c=COMPS[id],r=c?this.of('comp:'+id,c.race||'human',c.gender||'m','companion',true):null;return r?this.dress({...r,config:this.bare(r.config)},P.comps?.[id]?.gear,c.race||'human'):null}
  // ---- dressed as they are (FACE_GEAR): gear a slot's item ids (P.gear, a companion's); race the wearer's people
  static fits(race,part,v){return !!v&&PortraitEngine.partsFor(this.raceOf(race),part).includes(v)}
  static metal(t){const D=FACE_GEAR;return PX.mix(MATERIALS[t].col,D.steel,D.tint)}
  static armour(t,race){const D=FACE_GEAR,own=D.bodyOf[race]?.[t];return this.fits(race,'clothing',own)?own:D.body[Math.max(0,Math.min(D.body.length-1,t))]}
  static helm(t,race){const D=FACE_GEAR,own=D.headOf[race]?.[t];return this.fits(race,'headwear',own)?own:D.head[Math.max(0,Math.min(D.head.length-1,t))]}
  static dress(rec,gear,race,past){if(!rec||!this.ok())return rec;gear=gear||{};const D=FACE_GEAR,r=this.raceOf(race||rec.config.race),c={...rec.config},col={...rec.colors},b=ITEMS[gear.body],h=ITEMS[gear.head];
    if(b){const it=D.items[gear.body],cl=it?(typeof it==='string'?it:it[r]||it.any):b.base==='mail'?this.armour(b.tier,r):null;
      if(this.fits(r,'clothing',cl)){c.clothing=cl;if(b.base==='mail'&&b.tier>0)col.metal=this.metal(b.tier)}}
    else if(gear.cape&&this.fits(r,'clothing',D.cape))c.clothing=D.cape;
    else if(D.armours.includes(c.clothing)){const pl=D.plain[past]||D.plain.any;if(this.fits(r,'clothing',pl))c.clothing=pl}
    if(h&&h.base==='helm'){const hw=this.helm(h.tier,r);if(this.fits(r,'headwear',hw)){c.headwear=hw;if(!b&&h.tier>0)col.metal=this.metal(h.tier)}}
    else if(D.helms.includes(c.headwear))c.headwear='none';
    return {...rec,config:PortraitEngine.normalize(c),colors:col}}
  // (your hero's face as you are now: in what you wear)
  static yours(){return this.dress(this.you(),P.gear,P.race,P.bg)}
  // (a lord's armour by his standing: his tier from his level, his people's make, its metal that tier's)
  static armoured(rec,l){const L=FACE_GEAR.lord,t=Math.max(L.min,Math.min(MATERIALS.length-1,L.min+Math.floor(((l.lv||1)-1)/L.lv))),r=this.raceOf(rec.config.race),cl=this.armour(t,r);
    return this.fits(r,'clothing',cl)?{...rec,config:PortraitEngine.normalize({...rec.config,clothing:cl}),colors:{...rec.colors,metal:this.metal(t)}}:rec}
  /* (a troop's face (FACE_UNIT): one of its people's, a man or a woman by its kind and v (the figure's variant), dressed as the
     figure (lookOf) is (v: which figure, by default the kind's own, vOf); the same in every world, kept; null for a beast, a
     companion (their own), a kind unknown) */
  static unit(type,v){if(!this.ok())return null;const s=ST[type];if(!s||s.beast||COMPS[type])return null;v=v??this.vOf(type);const key=type+':'+(v|0),C=this.units??=new Map();if(C.has(key))return C.get(key);
    let rec=null;try{rec=this.dressUnit(type,v|0)}catch(e){rec=null}C.set(key,rec);return rec}
  // (a kind's own figure where none is named: its card's (ui/unitcard.js), so kinds of a people are not all one skin and hair)
  static vOf(type){return PortraitCharacters.hash('v:'+type)%6}
  static dressUnit(type,v){const s=ST[type],L=lookOf(type,0,false,v),race=L.race||s.race||'human',r=this.raceOf(race),U=FACE_UNIT,P0=PortraitCharacters,h=k=>P0.hash('unit:'+type+':'+v+':'+k),
      one=(x,k)=>Array.isArray(x)?x[h(k)%x.length]:x,by=(t,k='by')=>t==null?null:typeof t==='string'?t:one(t[race]||t[r]||t.any,k),fit=(k,x,d)=>this.fits(r,k,x)?x:d;
    const g=h('g')%1000<(U.women[race]||0)*1000?'f':'m',rec=this.random(h('face'),race,g),c={...rec.config},col={...rec.colors},own=U.own[type];
    const cl=own?own[0]:!s.tier||L.plain?U.plain[L.outer]||U.plain.any:L.robe?by(U.robe):L.outer==='fur'&&L.armor!=='plate'?'fur':by(U.body[L.armor]||U.body.none);
    c.clothing=fit('clothing',cl,fit('clothing',by(U.body[L.armor]||U.body.none),c.clothing));{const Hv=U.heavy[race];if(Hv&&Hv.armor.includes(L.armor))c.face=fit('face',Hv.face,c.face)}c.headwear=fit('headwear',own?own[1]:by(U.head[L.helm])||'none','none');c.headwear=fit('headwear',U.open[race]?.[c.headwear]||c.headwear,c.headwear);
    // (its colours: the figure's skin and hair, its cloth its coat's, its metal its armour's)
    const F=FACE_LOOK,cloth=k=>PPAL[k]?PX.mix(PPAL[k][2],'#5a4a3c',.25):null,mt=U.metal[L.outer];
    if(F.skinOf[L.skin])col.skin=F.skinOf[L.skin];if(F.hairOf[L.hair])col.hair=F.hairOf[L.hair];
    if(mt)col.metal=mt;else if(cloth(L.outer))col.cloth=cloth(L.outer);if(L.hood&&cloth(L.hood))col.headwear=cloth(L.hood);else if(mt)col.headwear=mt;
    return {...rec,config:PortraitEngine.normalize(c),colors:col}}
  static pic(rec){return rec?this.url(rec):''}
  // (a figure's picture key by the face it wears: your hero's, a companion's; '' none)
  static lookKey(hero,type){if(!this.ok())return '';const f=hero?this.you():COMPS[type]?this.companion(type):null;return f?'f'+Rng.seedOf(JSON.stringify(this.look(f))):''}
  // ---- the figure as the face: its hair (style, colour), its beard, its face from before him
  static look(rec){if(!rec)return null;const c=rec.config,G=PortraitEngine.hairGroups,grp=Object.keys(G).find(k=>G[k].includes(c.hair))||'Short',col=rec.colors.hair;
    const bearded=c.beard&&!['none','stubble','moustache','walrus','sideburns','dwarf-heavy-moustache'].includes(c.beard);
    return{hairStyle:FACE_HAIR.bun.includes(c.hair)?'cropBun':FACE_HAIR[grp],hair:col,beard:bearded?col:null,beardStyle:bearded?'beardF':null}}// (no eye drawn on the figure: the owner, 2026-11-07)
}
Saves.add({key:'faces',order:365,save:()=>Faces.save(),load:v=>Faces.load(v)});
// A face requested before the bundled art decoded refreshes in place when it is ready.
addEventListener('portrait-art-ready',()=>{const previous=new Map();for(const [key,url] of Faces.pics||[])previous.set(url,key);Faces.pics=new Map();for(const img of document.images){const key=previous.get(img.getAttribute('src'));if(key)img.src=Faces.url(JSON.parse(key));}Faces.refresh()});
onAct('fm-',(a,arg)=>{
  if(a==='fm-random')Faces.reroll();else return false;
  const y=panel.scrollTop;showTitle('new');panel.scrollTop=y;return true});
// (its lists and its preset: the page made again; its pickers and sliders as they move: only the portrait)
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.closest||!t.closest('.face-maker'))return;
  if(t.dataset.fmPart)Faces.set(t.dataset.fmPart,t.value);else if(t.hasAttribute('data-fm-preset')){if(!t.value)return;Faces.preset(t.value)}else return;
  const y=panel.scrollTop;showTitle('new');panel.scrollTop=y});
document.addEventListener('input',e=>{const t=e.target;if(!t||!t.closest||!t.closest('.face-maker'))return;
  if(t.dataset.fmTint)Faces.tint(t.dataset.fmTint,t.value);else if(t.dataset.fmAdj){Faces.adjust(t.dataset.fmAdj,t.value);const b=t.parentNode.querySelector('b');if(b)b.textContent=t.value}else return;Faces.refresh()});
