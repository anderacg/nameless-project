'use strict';
// Faces (the owner, 2026-11-07: "a portrait generator: include the creation into our game; the lords and named heroes, companions
// can also use generated portraits; make hair style match with portraits"): the portrait engine loaded; your face made as the game
// starts (by your race), a lord's and a companion's the first time they are shown, each kept by its id, the same after a save and
// a load; the portraits shown where the paintings were; your figure's and a companion's hair (its length, colour) and beard the
// portrait's; the New game page's face maker steps a part and a colour; FACES.on false brings back the paintings.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,F=t.Faces;Kit.begin('soldier',1);
 ok(typeof t.PortraitEngine==='object'&&typeof t.PortraitCharacters==='object'&&F.ok(),'the portrait engine is loaded (engine/face arts/grayscale)');
 const you=F.you();ok(!!you&&you.config.race===F.raceOf(P.race)&&you.config.headwear==='none','your face is made as the game starts, of your race ('+(you&&you.config.race)+'), bareheaded');
 const L=t.W.lords[0],L2=t.W.lords[1],a=F.lord(L),b=F.lord(L),c=F.lord(L2);
 ok(!!a&&JSON.stringify(a)===JSON.stringify(b)&&JSON.stringify(a.config)!==JSON.stringify(c.config),'a lord\'s face made once and kept by name ('+L.name+'), another lord\'s its own');
 ok(/^data:image\/png/.test(t.lordPic(L))&&/^data:image\/png/.test(t.portrait('hero',true))&&/^data:image\/png/.test(t.portrait('brann')),'the lords\', your hero\'s and a companion\'s portraits are their faces');
 // (kept in the save: the same faces after a save and a load)
 const saved=JSON.parse(JSON.stringify(F.save())),was=JSON.stringify([F.you(),F.lord(L),F.companion('brann')]);F.load(saved);
 ok(JSON.stringify([F.you(),F.lord(L),F.companion('brann')])===was,'the same faces after a save and a load ('+saved.characters.length+' kept)');
 // (the figure as the face: hair, its colour, a beard)
 const lk=F.look(F.you()),o=t.lookOf('hero',0,true,0,'',null),cl=F.look(F.companion('brann')),oc=t.lookOf('brann',0,false,0,'brann',null);
 ok(o.hairStyle===lk.hairStyle&&o.hair===lk.hair&&(o.beard||null)===lk.beard&&oc.hairStyle===cl.hairStyle&&oc.hair===cl.hair,'your figure\'s hair and beard are your portrait\'s ('+lk.hairStyle+' '+lk.hair+'), a companion\'s its own');
 info('you: '+you.config.hair+' → '+lk.hairStyle+'; Brann: '+F.companion('brann').config.hair+' → '+cl.hairStyle);
 // (the New game page: the face maker, the workshop's controls: a list for each part, a colour picker for each tint, a slider for
 // each proportion, a preset; each changes your face)
 F.draft=null;const html=F.maker('dwarf','f'),E=t.PortraitEngine,r0=JSON.stringify(F.draft.rec);
 const hairs=E.partsFor('dwarf','hair'),h1=hairs.find(v=>v!==F.draft.rec.config.hair);F.set('hair',h1);const r1=JSON.stringify(F.draft.rec);
 F.tint('iris','#2a6a9a');const r2=JSON.stringify(F.draft.rec);F.adjust('jawWidth',2);const r3=JSON.stringify(F.draft.rec);
 const parts=(html.match(/data-fm-part=/g)||[]).length,tints=(html.match(/type="color"/g)||[]).length,adjs=(html.match(/type="range"/g)||[]).length;
 ok(/fm-portrait/.test(html)&&parts>=10&&tints===7&&adjs===Object.keys(E.adjustments).length&&F.draft.rec.config.race==='dwarf'&&F.draft.rec.config.hair===h1&&F.draft.rec.colors.iris==='#2a6a9a'&&F.draft.rec.config.adjustments.jawWidth===2&&new Set([r0,r1,r2,r3]).size===4,
   'the face maker: '+parts+' parts, '+tints+' colour pickers and '+adjs+' proportions, each changing your face');
 F.draft=null;
 // ---- dressed as they are (FACE_GEAR): armour and helm by tier and people, metal its material's; none worn, no armour drawn; lords armoured by standing
 {const FG=t.FACE_GEAR,g0={...P.gear},cp=P.comps;try{
   for(const k of ['body','head','cape'])delete P.gear[k];const bare=F.yours().config;ok(!FG.armours.includes(bare.clothing)&&!FG.helms.includes(bare.headwear),'nothing worn: no armour on your face ('+bare.clothing+', '+bare.headwear+'), whatever it was made in ('+F.you().config.clothing+')');
   const seen=[];for(let tr=0;tr<7;tr++){P.gear.body=t.gearId('mail',tr);P.gear.head=t.gearId('helm',tr);const c=F.yours();seen.push(c.config.clothing+'/'+c.config.headwear);
     if(c.config.clothing!==F.armour(tr,t.Faces.raceOf(P.race))||c.config.headwear!==F.helm(tr,t.Faces.raceOf(P.race))||(tr>0&&c.colors.metal!==F.metal(tr)))seen.push('WRONG')}
   ok(!seen.includes('WRONG')&&new Set(seen).size>=5,'your armour and helm drawn as worn, wood to adamant, the metal its material\'s ('+seen.join(', ')+')');
   const pic0=t.portrait('hero',true);P.gear.body=t.gearId('mail',1);ok(t.portrait('hero',true)!==pic0,'a new piece put on: your portrait drawn anew');
   for(const r of ['dwarf','elf','orc'])ok(t.PortraitEngine.partsFor(r,'clothing').includes(F.armour(4,r))&&t.PortraitEngine.partsFor(r,'headwear').includes(F.helm(4,r)),t.an(r)+'\'s armour of their own make where it has one ('+F.armour(4,r)+', '+F.helm(4,r)+')');
   P.gear.body='bearcoat';ok(F.yours().config.clothing==='fur','a bear hide coat: fur');
   P.comps={brann:{ap:5,role:''}};t.compInit('brann');P.comps.brann.gear.body=t.gearId('mail',6);ok(F.companion('brann').config.clothing===F.armour(6,'human'),'a companion in the armour you gave him ('+F.companion('brann').config.clothing+')');
   const lo=W.lords.find(o=>!o.dead),lows={...lo,lv:1},highs={...lo,lv:13},a1=F.lord(lows).config,a2=F.lord(highs).config;
   ok(FG.armours.includes(a1.clothing)&&FG.armours.includes(a2.clothing)&&F.lord(highs).colors.metal===F.metal(6)&&a1.headwear===F.lord(highs).config.headwear,'a lord in good armour, the better for his level ('+a1.clothing+' at 1, '+a2.clothing+' at 13), his crown kept ('+a1.headwear+')');
   ok(!FG.armours.includes(F.lord({...lo,id:'kx1',name:'Wat',kinFace:true,plain:true}).config.clothing),'one of his house\'s kin, not a lord: no armour');
 }finally{P.gear=g0;P.comps=cp}}
 // ---- a dwarf's face by the marks of their people (FACE_KIN): every one drawn so; a human's as it is; your own as you made it
 {const K=t.FACE_KIN.dwarf,bad=[];for(let i=0;i<12;i++)for(const g of ['f','m']){const c=F.random(5000+i*13,'dwarf',g).config;
    if(!K.face.includes(c.face)||!K.nose.includes(c.nose)||c.adjustments.faceWidth<2||(g==='m'&&K.thin.includes(c.beard))||!t.PortraitEngine.partsFor('dwarf','hair').includes(c.hair))bad.push(g+':'+c.face+'/'+c.nose+'/'+c.beard+'/'+c.hair)}
  ok(!bad.length,'24 dwarves drawn at random: a dwarf\'s face, nose and breadth; a man\'s beard full or braided, hair from the shared catalog'+(bad.length?' (not: '+bad.join(', ')+')':''));
  const h=t.PortraitCharacters.recipe({config:t.Faces.bare(t.PortraitEngine.random(77,'male','human'))});ok(JSON.stringify(F.kin(h).config)===JSON.stringify(h.config),'a human\'s face as it is');
  const d=t.PortraitCharacters.recipe({config:t.Faces.bare(t.PortraitEngine.random(78,'female','dwarf'))});ok(JSON.stringify(F.kin(d))===JSON.stringify(F.kin(d)),'the same dwarf drawn the same every time')}
 {const E=t.PortraitEngine,C=t.PortraitCharacters,look=beard=>F.look(C.recipe({config:E.normalize({race:'dwarf',beard})}));ok(!look('dwarf-heavy-moustache').beard&&look('dwarf-fan').beard&&look('dwarf-twin-braids').beard,'dwarf moustaches and full beard styles map correctly to battle figures')}
 // ---- approved orc outfits remain selectable and keep their independent torso skin
 {const E=t.PortraitEngine,kits=['orc-leather-vest','orc-studded-leather','orc-cross-harness','orc-ring-harness','orc-layered-hide','orc-leather-guard','orc-bare-cross-harness','orc-bare-ring-harness'],saved=F.draft;
  try{F.draft=null;const html=F.maker('orc','m');for(const clothing of kits){F.set('clothing',clothing);const rec=F.draft.rec,p=E.build(rec.config);ok(html.includes('value="'+clothing+'"')&&html.includes(E.partLabels[clothing])&&rec.config.clothing===clothing&&p.layers.torso.getContext('2d').getImageData(0,0,128,128).data.some((v,i)=>i%4===3&&v)&&/^data:image/.test(F.url(rec,true)),'orc face maker selects and renders '+E.partLabels[clothing]);}
   ok(kits.every(k=>t.FACE_GEAR.armours.includes(k)),'all new orc kits follow the existing worn-armor portrait rules');
  }finally{F.draft=saved}}
 // (hair is a choice shared by every people; racial preferences never replace a chosen cut)
 {const E=t.PortraitEngine,C=t.PortraitCharacters;for(const race of E.races){const rec=C.recipe({config:{race,profile:'female',hair:'war-crest'}});ok(E.options.hair.every(h=>E.partsFor(race,'hair').includes(h))&&F.kin(rec,race,true).config.hair==='war-crest',race+' allows every hairstyle and preserves a chosen mohawk through racial appearance rules');}}
 {const saved=F.draft;try{F.draft=null;F.maker('orc','f');F.set('hair','war-crest');for(const race of t.PortraitEngine.races)F.maker(race,'f');ok(F.draft.rec.config.hair==='war-crest','changing race in the face maker preserves a chosen hairstyle');}finally{F.draft=saved}}
 // ---- closed helmets are selectable and used by the highest worn-gear tier
 {const E=t.PortraitEngine,saved=F.draft;try{F.draft=null;const html=F.maker('human','m');for(const headwear of E.faceCoveringHelmets){F.set('headwear',headwear);ok(html.includes('value="'+headwear+'"')&&html.includes(E.partLabels[headwear])&&F.draft.rec.config.headwear===headwear&&t.FACE_GEAR.helms.includes(headwear)&&/^data:image/.test(F.url(F.draft.rec,true)),'face maker selects and renders '+E.partLabels[headwear]);}
  ok(E.races.every(r=>E.faceCoveringHelmets.includes(F.helm(6,r))),'highest worn helmet tier covers the face for every race');
 }finally{F.draft=saved}}
 // (switched off: the paintings again)
 t.FACES.on=false;try{ok(!/^data:/.test(t.lordPic(L))||!t.NamedPortraits.of(L.name),'FACES.on false: a lord\'s painting again')}finally{t.FACES.on=true}
});
