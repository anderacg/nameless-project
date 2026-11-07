/* Character creation, structural face reservations and persistent NPC recipes. */
(function(root){
  'use strict';
  const E=root.PortraitEngine;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const ROLES=Object.freeze({
    lord:{clothing:['brocade','embroidered-doublet','guild-doublet','rune-mail','leaf-mantle','plate','robe','velvet-bodice','hide-harness'],headwear:['circlet','coronet','heraldic-cap','forge-helm','warband','vine-diadem','none']},
    soldier:{clothing:['padded-jack','leather-mail','coat-of-plates','steel-cuirass','dwarf-iron-guard','orc-lamellar','elf-leaf-mail','mail','gambeson'],headwear:['open-bascinet','sallet','ridge-helm','dwarf-guard-helm','orc-war-helm','elf-guard-helm','kettle','coif']},
    infantry:{clothing:['coat-of-plates','steel-cuirass','dwarf-iron-guard','orc-lamellar','elf-leaf-mail','mail'],headwear:['open-bascinet','ridge-helm','dwarf-guard-helm','orc-war-helm','elf-guard-helm','kettle']},
    archer:{clothing:['padded-jack','leather-mail','gambeson','leather'],headwear:['kettle','ridge-helm','arming-cap','warband','vine-diadem','none']},
    cavalry:{clothing:['steel-cuirass','coat-of-plates','dwarf-iron-guard','rune-mail','orc-lamellar','elf-leaf-mail','plate'],headwear:['sallet','open-bascinet','ridge-helm','dwarf-guard-helm','forge-helm','orc-war-helm','elf-guard-helm']},
    guard:{clothing:['coat-of-plates','dwarf-iron-guard','orc-lamellar','elf-leaf-mail','mail','gambeson','brigandine','rune-mail','hide-harness','leather'],headwear:['open-bascinet','dwarf-guard-helm','orc-war-helm','elf-guard-helm','coif','round-helm','nasal','forge-helm','warband','none']},
    villager:{clothing:['tunic','robe','linen-chemise','traveler-coat'],headwear:['cap','straw-hat','linen-wrap','none']},
    wanderer:{clothing:['cloak','leather','traveler-coat','leaf-mantle','hide-harness'],headwear:['hood','headband','none']},
    bandit:{clothing:['leather','fur','hide-harness','gambeson'],headwear:['hood','cap','warband','none']},
    companion:{clothing:['cloak','guild-doublet','rune-mail','leaf-mantle','brigandine'],headwear:['headband','warband','vine-diadem','none']}
  });
  const PALETTES=Object.freeze({human:{skin:'#b88b69',hair:'#45372e',cloth:'#70464b'},dwarf:{skin:'#ad886e',hair:'#76543a',cloth:'#685746'},orc:{skin:'#718454',hair:'#302f25',lips:'#716b50',cloth:'#574c3d'},elf:{skin:'#c3ac98',hair:'#a18c60',cloth:'#526d65'}});
  class GenerationError extends Error{constructor(code,message){super(message);this.name='GenerationError';this.code=code;}}
  function hash(value){let n=2166136261;for(const c of String(value)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
  function stream(seed){let n=seed>>>0;return()=>{n+=0x6d2b79f5;let t=Math.imul(n^n>>>15,n|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function configOf(value){return E.normalize(value?.config||value);}
  function eyeFamily(eyes){if(['round','wide','natural-wide'].includes(eyes))return'open';if(['keen','focused','heavy'].includes(eyes))return'narrow';if(['hooded','deep-set'].includes(eyes))return'hooded';if(['almond','deep-almond','upturned','elf-slanted'].includes(eyes))return'almond';return'neutral';}
  function faceTraits(value){const c=configOf(value),g=E.geometry(c);return{
    face:[g.w,g.jaw,g.chin,g.chinY,g.definition,g.softness],
    eyes:[eyeFamily(c.eyes),g.eyes[1].x-g.eyes[0].x,g.eyeScale],
    nose:[c.nose,c.adjustments.noseWidth]
  };}
  function faceKey(value){return JSON.stringify(faceTraits(value));}
  function faceDistance(a,b){const x=faceTraits(a),y=faceTraits(b);return Object.keys(x).filter(k=>JSON.stringify(x[k])!==JSON.stringify(y[k])).length;}
  function distinctFromPlayer(a,b){const x=configOf(a),y=configOf(b);return faceDistance(x,y)>=2&&(x.face!==y.face||eyeFamily(x.eyes)!==eyeFamily(y.eyes)||x.nose!==y.nose);}
  function variantKey(value){const c=configOf(value);return JSON.stringify([Object.keys(E.options).map(k=>c[k]),c.adjustments]);}
  function countOf(value,fallback=12){const n=value===undefined?fallback:value;if(!Number.isInteger(n)||n<1||n>128)throw new GenerationError('INVALID_COUNT','Choose between 1 and 128 characters.');return n;}
  function colorsFor(config,patch={}){const result={...E.colors,...PALETTES[config.race]};for(const key of Object.keys(E.colors))if(/^#[0-9a-f]{6}$/i.test(patch[key]))result[key]=patch[key];return result;}
  function recipe(value){const config=configOf(value);return{version:E.version,config,colors:colorsFor(config,value?.colors||{}),colored:value?.colored!==false};}
  function randomAdjustments(seed,strength=1){const R=stream(seed);return Object.fromEntries(Object.entries(E.adjustments).map(([k,r])=>[k,Math.max(r.min,Math.min(r.max,Math.floor(R()*(strength*2+1))-strength))]));}
  function validateLocks(locks=[]){const valid=new Set([...Object.keys(E.options).filter(k=>k!=='race'),'adjustments',...Object.keys(E.adjustments).map(k=>'adjustments.'+k)]);for(const k of locks)if(!valid.has(k))throw new GenerationError('INVALID_LOCK','Unknown locked part: '+k);return new Set(locks);}
  function variations({base,seed=1,count=12,locks=[],varyAdjustments=false}={}){
    const c=configOf(base),n=countOf(count),held=validateLocks(locks),result=[],seen=new Set([variantKey(c)]);
    for(let attempt=0;attempt<n*80&&result.length<n;attempt++){
      const s=hash(seed+'/'+attempt),next=E.random(s,c.profile,c.race);next.adjustments=varyAdjustments?randomAdjustments(s^1237):clone(c.adjustments);
      for(const k of held){if(k==='adjustments')next.adjustments=clone(c.adjustments);else if(k.startsWith('adjustments.'))next.adjustments[k.slice(12)]=c.adjustments[k.slice(12)];else next[k]=c[k];}
      const q=E.normalize(next),key=variantKey(q);if(seen.has(key))continue;seen.add(key);result.push(q);
    }
    if(result.length!==n)throw new GenerationError('LOCKED_POOL_EXHAUSTED','The locked parts leave too few variations. Unlock more features or request fewer faces.');
    return result;
  }
  function generateNPCs(options={}){
    if(!options.player)throw new GenerationError('PLAYER_REQUIRED','Save a player face before generating NPCs.');
    const player=configOf(options.player),n=countOf(options.count,8),race=options.race||player.race,profile=options.profile||'custom',mode=options.mode||'mixed',role=options.role||'lord',seed=Number.isFinite(options.seed)?options.seed>>>0:1;
    if(!E.races.includes(race)||!E.profiles.includes(profile)||!['random','preset','mixed'].includes(mode)||!Object.hasOwn(ROLES,role))throw new GenerationError('INVALID_GENERATION_OPTIONS','Choose a supported race, profile, generation mode and role.');
    const existing=options.existing||[],used=new Set([faceKey(player),...existing.map(faceKey)]),ids=new Set(existing.map(r=>r.id).filter(Boolean)),R=stream(seed),pick=values=>values[Math.floor(R()*values.length)];
    const pool=[...E.presets,...(options.presets||[])].filter(p=>configOf(p).race===race&&(profile==='custom'||configOf(p).profile===profile)&&(Array.isArray(p.roles)?!p.roles.length||p.roles.includes(role):ROLES[role].clothing.includes(configOf(p).clothing))).map(p=>({name:String(p.name||'Saved preset').slice(0,80),recipe:recipe(p)}));
    const result=[];let candidates=0;
    function accept(config,source,preset){
      const key=faceKey(config);if(used.has(key)||!distinctFromPlayer(config,player))return false;
      const id=options.ids?.[result.length]||String(options.idPrefix||'npc-'+seed.toString(16))+'-'+(result.length+1);
      if(typeof id!=='string'||!id.trim()||ids.has(id))throw new GenerationError('DUPLICATE_ID','Character IDs must be nonempty and unique.');
      used.add(key);ids.add(id);result.push({id,role,source,sourcePreset:preset?.name||null,faceKey:key,config:E.normalize(config),colors:colorsFor(config,{...(preset?.recipe.colors||{}),...(options.colors||{})})});return true;
    }
    if(mode==='preset'){
      const shuffled=pool.map(p=>({p,order:R()})).sort((a,b)=>a.order-b.order);for(const {p} of shuffled){accept(p.recipe.config,'preset',p);if(result.length===n)break;}
      if(result.length<n)throw new GenerationError('PRESET_POOL_EXHAUSTED','Only '+result.length+' eligible distinct preset faces are available. Reduce the count or choose Mixed / Random.');
      return result;
    }
    while(result.length<n&&candidates<n*100){
      const attempt=candidates++,s=hash(seed+'/'+attempt);if(mode==='mixed'&&pool.length&&R()<.35){const p=pick(pool);if(accept(p.recipe.config,'preset',p))continue;}
      const c=E.random(s,profile,race);c.adjustments=randomAdjustments(s^0x73c9);
      for(const key of ['clothing','headwear']){const allowed=ROLES[role][key].filter(v=>E.partsFor(race,key).includes(v));if(allowed.length){const cultural={human:{clothing:['guild-doublet','brocade','embroidered-doublet'],headwear:['heraldic-cap','circlet']},dwarf:{clothing:['rune-mail','dwarf-iron-guard'],headwear:['forge-helm','dwarf-guard-helm']},orc:{clothing:['hide-harness','orc-lamellar'],headwear:['warband','orc-war-helm']},elf:{clothing:['leaf-mantle','elf-leaf-mail'],headwear:['vine-diadem','leaf-circlet','elf-guard-helm']}}[race][key].filter(v=>allowed.includes(v));c[key]=pick(cultural.length&&R()<.65?cultural:allowed);}}
      accept(E.normalize(c),'random');
    }
    if(result.length<n)throw new GenerationError('FACE_POOL_EXHAUSTED','Not enough distinct faces remain for this player and roster. Use fewer characters or broaden the race/preset pool.');
    return result;
  }
  class Roster{
    #player;#records;#images;
    constructor({seed=1,player,characters=[]}={}){
      if(!player)throw new GenerationError('PLAYER_REQUIRED','A roster needs the saved player recipe.');
      this.seed=seed>>>0;this.#player=recipe(player);this.#records=new Map();this.#images=new Map();const keys=new Set([faceKey(this.#player)]);
      for(const entry of characters){if(typeof entry?.id!=='string'||!entry.id.trim()||this.#records.has(entry.id))throw new GenerationError('DUPLICATE_ID','Saved character IDs must be unique.');const config=configOf(entry),key=faceKey(config);if(keys.has(key)||!distinctFromPlayer(config,this.#player))throw new GenerationError('SAVED_FACE_CONFLICT','A saved NPC conflicts with the player or another NPC.');keys.add(key);this.#records.set(entry.id,{...clone(entry),config,faceKey:key,colors:colorsFor(config,entry.colors)});}
    }
    get player(){return clone(this.#player);}
    create({id,...options}={}){if(typeof id!=='string'||!id.trim())throw new GenerationError('INVALID_ID','Use the stable game character ID.');if(this.#records.has(id))return clone(this.#records.get(id));const record=generateNPCs({...options,count:1,ids:[id],seed:hash(this.seed+'/'+id),player:this.#player,existing:[...this.#records.values()]})[0];this.#records.set(id,record);return clone(record);}
    get(id){const record=this.#records.get(id);return record?clone(record):null;}
    portrait(id){const record=this.#records.get(id);if(!record)return null;if(!this.#images.has(id))this.#images.set(id,E.composite(E.build(record.config),{colors:record.colors}));return this.#images.get(id);}
    export(){return clone({version:E.version,seed:this.seed,player:this.#player,characters:[...this.#records.values()]});}
    static restore(saved){if(!saved||![7].includes(saved.version))throw new GenerationError('INVALID_ROSTER','Choose a version 7 character roster.');return new Roster(saved);}
  }
  function inspect(value){
    const q=E.build(configOf(value)),issues=[],read=c=>c.getContext('2d').getImageData(0,0,E.size,E.size).data;
    const skin=read(q.layers.face);for(const p of [...q.anchors.eyes,q.anchors.nose,q.anchors.mouth])if(!skin[(Math.round(p.y)*128+Math.round(p.x))*4+3])issues.push({part:'face',severity:'error',message:'A facial anchor falls outside the skin.'});
    const eyes=read(q.layers.eyes),lids=read(q.layers.eyelids),iris=read(q.layers.iris),marks=read(q.layers.marks),age=read(q.layers.age);for(let i=3;i<eyes.length;i+=4){if(iris[i]&&(!eyes[i]||lids[i])){issues.push({part:'iris',severity:'error',message:'An iris crosses its lid or eye opening.'});break;}if((marks[i]||age[i])&&(eyes[i]||lids[i])){issues.push({part:'marks',severity:'error',message:'A skin overlay crosses an eye.'});break;}}
    for(const id of ['hairFront','hairBack','mouth','brows']){const a=read(q.layers[id]);let isolated=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++){if(!a[(y*128+x)*4+3])continue;let touches=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx>=0&&xx<128&&yy>=0&&yy<128&&a[(yy*128+xx)*4+3])touches=true;}if(!touches)isolated++;}if(isolated)issues.push({part:id,severity:'notice',message:isolated+' detached pixel(s); inspect this part at full size.'});}
    const rule=E.headwearRules[q.config.headwear];if(rule.hair==='hide'){const vis=Object.fromEntries(E.order.map(s=>[s.id,s.feature!=='hair']));if(E.composite(q).toDataURL()!==E.composite(q,{visible:vis}).toDataURL())issues.push({part:'hair',severity:'error',message:'Hair protrudes through enclosing headwear.'});}
    return issues;
  }
  root.PortraitCharacters=Object.freeze({roles:ROLES,palettes:PALETTES,GenerationError,hash,recipe,faceTraits,faceKey,faceDistance,distinctFromPlayer,variations,generateNPCs,Roster,inspect});
})(globalThis);
