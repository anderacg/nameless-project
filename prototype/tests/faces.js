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
 ok(/fm-pic/.test(html)&&parts>=10&&tints===7&&adjs===Object.keys(E.adjustments).length&&F.draft.rec.config.race==='dwarf'&&F.draft.rec.config.hair===h1&&F.draft.rec.colors.iris==='#2a6a9a'&&F.draft.rec.config.adjustments.jawWidth===2&&new Set([r0,r1,r2,r3]).size===4,
   'the face maker: '+parts+' parts, '+tints+' colour pickers and '+adjs+' proportions, each changing your face');
 F.draft=null;
 // (switched off: the paintings again)
 t.FACES.on=false;try{ok(!/^data:/.test(t.lordPic(L))||!t.NamedPortraits.of(L.name),'FACES.on false: a lord\'s painting again')}finally{t.FACES.on=true}
});
