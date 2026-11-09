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
  items:{bearcoat:'fur',silkvest:'jerkin',scorpplate:'lamellar',trollhide:{orc:'hide-harness',any:'fur'}},
  head:['arming-cap','coif','nasal','kettle','sallet','open-bascinet','ridge-helm'],
  headOf:{dwarf:[null,null,'dwarf-guard-helm','dwarf-guard-helm','forge-helm','forge-helm','forge-helm'],orc:[null,null,'orc-war-helm','orc-war-helm','orc-war-helm','orc-war-helm','orc-war-helm'],
    elf:[null,null,'elf-guard-helm','elf-guard-helm','elf-guard-helm','elf-guard-helm','elf-guard-helm']},
  cape:'cloak',
  // (no armour worn: a face's own armour (armours) its past's plain clothes (plain; any: anyone else's), its own helm (helms) off)
  armours:['mail','brigandine','scale','lamellar','plate','ruffled-mail','rune-mail','leather-mail','coat-of-plates','steel-cuirass','dwarf-iron-guard','orc-lamellar','elf-leaf-mail'],
  helms:['coif','nasal','kettle','round-helm','forge-helm','open-bascinet','sallet','ridge-helm','dwarf-guard-helm','orc-war-helm','elf-guard-helm'],
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
  static raceOf(r){return PortraitEngine.races.includes(r)?r:'human'}
  // (a face drawn at random for a race and a man or a woman, its seed given)
  static random(seed,race,g){return PortraitCharacters.recipe({config:this.bare(PortraitEngine.random(seed>>>0,this.profileOf(g),this.raceOf(race)))})}
  // (bareheaded: your hero's and a companion's face shows its hair, as their figures do; a lord's keeps its hat, helm or crown)
  static bare(c){return PortraitEngine.normalize({...c,headwear:'none'})}
  // ---- the New game page's face: the draft, made again when your race or your hero's gender changes
  static draftFor(race,g){const D=this.draft;if(D&&D.race===race&&D.g===g)return D.rec;
    const rec=D?.rec?PortraitCharacters.recipe({config:PortraitEngine.startProfile(this.profileOf(g),PortraitEngine.startRace(this.raceOf(race),D.rec.config)),colors:{}}):this.random(Math.random()*4294967296,race,g);
    this.draft={race,g,rec};return rec}
  static maker(race,g){if(!this.ok())return '';const E=PortraitEngine,rec=this.draftFor(race,g),c=rec.config,r=this.raceOf(race);
    const part=([k,n])=>{const L=E.partsFor(r,k);return L.length<2?'':'<label class="fm-row"><span>'+n+'</span><select data-fm-part="'+k+'">'+L.map(v=>'<option value="'+v+'"'+(v===c[k]?' selected':'')+'>'+this.partName(v)+'</option>').join('')+'</select></label>'};
    const tint=([k,n])=>'<label class="fm-tint"><input type="color" data-fm-tint="'+k+'" value="'+(rec.colors[k]||E.colors[k])+'"><span>'+n+'</span></label>';
    const adj=([k,A])=>'<label class="fm-row"><span>'+A.name+'</span><input type="range" data-fm-adj="'+k+'" min="'+A.min+'" max="'+A.max+'" step="1" value="'+(c.adjustments?.[k]||0)+'"><b>'+(c.adjustments?.[k]||0)+'</b></label>';
    const pre=(E.presets||[]).map((p,i)=>[p,i]).filter(([p])=>this.raceOf(p.config?.race)===r);
    return '<div class="face-maker"><div class="fm-side"><img class="fm-pic" src="'+this.url(rec,true)+'" alt="Your face"><button class="btn sm" type="button" data-act="fm-random">Random face</button>'+
      (pre.length?'<select data-fm-preset aria-label="Preset"><option value="">Preset…</option>'+pre.map(([p,i])=>'<option value="'+i+'">'+htmlText(p.name)+'</option>').join('')+'</select>':'')+'</div>'+
      '<div class="fm-main"><div class="fm-rows">'+FACE_PARTS.map(part).join('')+'</div><div class="fm-tints">'+FACE_TINTS.map(tint).join('')+'</div><div class="fm-rows fm-adj">'+Object.entries(E.adjustments).map(adj).join('')+'</div></div></div>'}
  static partName(v){return String(v).replace(/-/g,' ').replace(/^./,s=>s.toUpperCase())}
  // (a part chosen (the draft made again within your race's choices), a tint, a proportion, a preset of your race)
  static set(k,v){const D=this.draft;if(!D)return;D.rec=PortraitCharacters.recipe({config:PortraitEngine.normalize({...D.rec.config,[k]:v}),colors:D.rec.colors})}
  static tint(k,v){const D=this.draft;if(D&&/^#[0-9a-f]{6}$/i.test(v))D.rec={...D.rec,colors:{...D.rec.colors,[k]:v}}}
  static adjust(k,v){const D=this.draft,A=PortraitEngine.adjustments[k];if(!D||!A)return;const n=Math.max(A.min,Math.min(A.max,Math.round(+v||0)));
    D.rec=PortraitCharacters.recipe({config:PortraitEngine.normalize({...D.rec.config,adjustments:{...D.rec.config.adjustments,[k]:n}}),colors:D.rec.colors})}
  static preset(i){const D=this.draft,p=PortraitEngine.presets?.[+i];if(!D||!p)return;D.rec=PortraitCharacters.recipe({config:PortraitEngine.startRace(this.raceOf(D.race),PortraitEngine.normalize(p.config)),colors:D.rec.colors})}
  static reroll(){const D=this.draft;if(D)D.rec=this.random(Math.random()*4294967296,D.race,D.g)}
  // (the portrait shown again as a picker or a slider moves, the page kept as it is)
  static refresh(){const img=panel.querySelector('.fm-pic');if(img&&this.draft)img.src=this.url(this.draft.rec,true)}
  // ---- the world's roster: made as the game starts (your face the page's, else one drawn by your race and gender), or loaded
  static start(){this.R=null;this.pics=new Map();if(!this.ok())return;const g=P.gender==='f'?'f':'m',D=this.draft,
      rec=D&&D.race===P.race&&D.g===g?D.rec:this.random(Rng.seedOf('face:you'),P.race,g);this.draft=null;
    try{this.R=new PortraitCharacters.Roster({seed:Rng.seedOf('faces'),player:rec})}catch(e){this.R=null}}
  // (a new person in the same world, world/legacy.js: a face of their own (n: the generation), kin's like the one who fell, theirs
  // the same shape of face, nose and ears and the same skin, hair and eyes; the world's faces kept as they were, saved: the roster's)
  static next(saved,old,n){if(!this.ok())return;const g=P.gender==='f'?'f':'m',C=PortraitCharacters;let rec=null;
    if(old?.config)try{const base=PortraitEngine.normalize({...old.config,profile:this.profileOf(g),race:this.raceOf(P.race)}),
        [c]=C.variations({base,seed:Rng.seedOf('face:kin:'+n),count:1,locks:['face','nose','ears']});
      rec=C.recipe({config:this.bare(c),colors:{skin:old.colors?.skin,hair:old.colors?.hair,iris:old.colors?.iris}})}catch(e){rec=null}
    rec??=this.random(Rng.seedOf('face:you:'+n),P.race,g);
    try{this.R=new C.Roster({seed:saved?.seed??Rng.seedOf('faces'),player:rec,characters:saved?.characters||[]})}
    catch(e){try{this.R=new C.Roster({seed:Rng.seedOf('faces'),player:rec})}catch(e2){}}}
  static save(){return this.R?this.R.export():undefined}
  static load(v){this.R=null;this.pics=new Map();if(!this.ok())return;if(!v){this.start();return}try{this.R=PortraitCharacters.Roster.restore(v)}catch(e){this.R=null}}
  // (a recipe's picture: drawn once, FACES.px a side, pixel for pixel, kept by its recipe)
  static url(rec,draft){const key=JSON.stringify(rec);this.pics??=new Map();let u=this.pics.get(key);if(u)return u;
    const src=PortraitEngine.composite(PortraitEngine.build(rec.config),{colors:rec.colors}),n=FACES.px;
    u=mkc(n,n,g=>{g.imageSmoothingEnabled=false;g.drawImage(src,0,0,n,n)}).toDataURL();if(!draft)this.pics.set(key,u);return u}
  // ---- the faces: yours, a lord's, a companion's (null: none, the old pictures stand)
  static you(){return this.R?this.R.player:null}
  static of(id,race,g,role){if(!this.R)return null;let r=this.R.get(id);if(r)return r;
    try{r=this.R.create({id,race:this.raceOf(race),profile:this.profileOf(g),role,mode:FACES.mode})}catch(e){return null}return r}
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
  static companion(id){const c=COMPS[id],r=c?this.of('comp:'+id,c.race||'human',c.gender||'m','companion'):null;return r?this.dress({...r,config:this.bare(r.config)},P.comps?.[id]?.gear,c.race||'human'):null}
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
  static pic(rec){return rec?this.url(rec):''}
  // (a figure's picture key by the face it wears: your hero's, a companion's; '' none)
  static lookKey(hero,type){if(!this.ok())return '';const f=hero?this.you():COMPS[type]?this.companion(type):null;return f?'f'+Rng.seedOf(JSON.stringify(this.look(f))):''}
  // ---- the figure as the face: its hair (style, colour), its beard, its face from before him
  static look(rec){if(!rec)return null;const c=rec.config,G=PortraitEngine.hairGroups,grp=Object.keys(G).find(k=>G[k].includes(c.hair))||'Short',col=rec.colors.hair;
    const bearded=c.beard&&!['none','stubble','moustache','walrus','sideburns'].includes(c.beard);
    return{hairStyle:FACE_HAIR.bun.includes(c.hair)?'cropBun':FACE_HAIR[grp],hair:col,beard:bearded?col:null,beardStyle:bearded?'beardF':null}}// (no eye drawn on the figure: the owner, 2026-11-07)
}
Saves.add({key:'faces',order:365,save:()=>Faces.save(),load:v=>Faces.load(v)});
onAct('fm-',(a,arg)=>{
  if(a==='fm-random')Faces.reroll();else return false;
  const y=panel.scrollTop;showTitle('new');panel.scrollTop=y;return true});
// (its lists and its preset: the page made again; its pickers and sliders as they move: only the portrait)
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.closest||!t.closest('.face-maker'))return;
  if(t.dataset.fmPart)Faces.set(t.dataset.fmPart,t.value);else if(t.hasAttribute('data-fm-preset')){if(!t.value)return;Faces.preset(t.value)}else return;
  const y=panel.scrollTop;showTitle('new');panel.scrollTop=y});
document.addEventListener('input',e=>{const t=e.target;if(!t||!t.closest||!t.closest('.face-maker'))return;
  if(t.dataset.fmTint)Faces.tint(t.dataset.fmTint,t.value);else if(t.dataset.fmAdj){Faces.adjust(t.dataset.fmAdj,t.value);const b=t.parentNode.querySelector('b');if(b)b.textContent=t.value}else return;Faces.refresh()});
