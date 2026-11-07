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
  static lord(l){const name=l&&(l.name||l.id);if(!name)return null;const F=FACS[l.fac],rs=l.race?[l.race]:F?.races||['human'];
    const r=this.of('lord:'+name,rs[Rng.seedOf('face:'+name)%rs.length],genderOf(l)||'m','lord');
    // (in its realm's colour: a recipe's cloth, drawn so, its saved face unchanged)
    return r&&F?{...r,colors:{...r.colors,cloth:PX.shade(F.col,.7)}}:r}
  static companion(id){const c=COMPS[id],r=c?this.of('comp:'+id,c.race||'human',c.gender||'m','companion'):null;return r?{...r,config:this.bare(r.config)}:null}
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
