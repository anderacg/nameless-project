'use strict';
// Named faces follow the person through allegiances, gear changes and captivity, not their troop type.
Kit.suite(({ok})=>{
 const t=T;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});
 // (the paintings, faces switched off (ui/faces.js FACES.on); with them on, the generated faces: below)
 t.FACES.on=false;
 const names=t.FIDS.flatMap(f=>t.FACS[f].lords),lords=names.map(name=>t.lordPic({name,fac:t.FIDS.find(f=>t.FACS[f].lords.includes(name))}));
 ok(lords.every(s=>s.startsWith('art/portrait/game/'))&&new Set(lords).size===20,'the twenty founding lords have distinct authored portraits');
 const comps=['brann','elske','tavi','ander'].map(id=>t.portrait(id));
 ok(comps.every(s=>s.startsWith('art/portrait/game/'))&&new Set(comps.concat(lords)).size===24,'all four named companions have their own faces, separate from lords');
 const animals=['bear','wolf','boar','tiger','griffin','dragon'];
 for(const id of animals){const pic=t.portrait(id);ok(pic.startsWith('art/portrait/game/'+id+'.webp?v='),'the '+id+' uses its corrected animal-pose artwork in the game');ok(t.unitCard(id).includes('src="'+pic+'"'),'the '+id+' unit card displays that same corrected portrait')}
 const l={id:'vale0',name:'Lord Aldric',fac:'vale'},a=t.lordPic(l);l.fac='karn';
 ok(t.lordPic(l)===a&&t.TALK_PIC.lord(l)===a,'a lord keeps his face when his allegiance changes, and dialogue uses it');
 ok(t.lordPic({name:'Lord Aldric',fac:'vale'})===a,'a captured record without the world party still resolves the same face');
 const b=t.portrait('brann');t.P.comps.brann={gear:{weapon:'unknown'}};
 ok(t.portrait('brann')===b,'a companion keeps his identity when equipment changes');
 const extra={id:'vale8',name:'Lord Newface',fac:'vale'},fallback=t.lordPic(extra);
 ok(fallback.startsWith('data:image/')&&t.lordPic({...extra})===fallback,'extra generated lords have a stable sprite fallback, with no missing asset URL');
 // (the troops' painted portraits, the owner 2026-10-29: "change all unit icon to portrait"; the battle's own cards keep the sprite)
 {const types=Object.keys(t.ST),miss=types.filter(k=>!t.portrait(k).startsWith('art/portrait/game/'));
  ok(!miss.length,'every one of the '+types.length+' unit types shows a painted portrait'+(miss.length?': not '+miss.slice(0,6).join(', '):''));
  ok(t.portrait('hum_sword').startsWith('art/portrait/game/hum_sword.webp?v=')&&t.portrait('hero',true).startsWith('data:image/'),'a troop\'s is its kind\'s painted portrait; the customizable player keeps the generated one');
  ok(t.hudPic('hum_sword').startsWith('data:image/')&&t.hudPic('brann')===t.portrait('brann'),'the battle\'s own cards keep the sprite for troops (a named face stays a face)')}
 // (the unit card: a button shows its sprite, standing, enlarged; again, the portrait)
 {const panel=document.getElementById('panel');t.showPanel(t.unitCard('hum_sword'));const card=panel.querySelector('.ucard-x'),img=card.querySelector('img.uc-pic'),cv=card.querySelector('canvas.uc-anim');
  ok(img.src.includes('hum_sword.webp')&&cv.hidden&&card.querySelector('.uc-sprbtn[data-act="uc-sprite"]'),'its card: the portrait, and a View sprite button');
  t.act('uc-sprite','hum_sword');const px=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<px.length;i+=4)if(px[i])n++;
  ok(!cv.hidden&&img.hidden&&n>200&&/View portrait/.test(card.innerHTML),'pressed: the sprite in its place, standing, drawn large ('+n+' pixels; the button now says View portrait)');
  t.act('uc-sprite','hum_sword');ok(cv.hidden&&!img.hidden,'pressed again: the portrait back');t.hidePanel()}
 const card=t.railCard({pic:a,fac:'vale',name:'Lord Aldric',role:'Your prisoner'});
 ok(card.includes('src="'+a+'"')&&!card.includes('rc-em'),'prison cards display the individual face when both face and faction are supplied');
 const known=t.W.lords.find(l=>l.name==='Lord Aldric');if(known){t.KNOWLEDGE.lord(known);ok(t.lordsPage().includes(t.lordPic(known)),'the known-lords journal includes its individual portrait')}
 // (2026-11-07, the owner: "the lords and named heroes, companion can also use generated portraits": with faces on, each its own
 // generated face, kept through a change of allegiance (its cloth the new realm's colour), the battle's card the same face)
 t.FACES.on=true;
 {const L2=names.map(name=>t.lordPic({name,fac:t.FIDS.find(f=>t.FACS[f].lords.includes(name))})),C2=['brann','elske','tavi','ander'].map(id=>t.portrait(id));
  ok(L2.every(s=>s.startsWith('data:image/png'))&&new Set(L2).size===20&&C2.every(s=>s.startsWith('data:image/png'))&&new Set(C2.concat(L2)).size===24,'with faces: the twenty lords and four companions each their own generated face');
  const l2={name:'Lord Aldric',fac:'vale'},f0=JSON.stringify(t.Faces.lord(l2).config);l2.fac='karn';
  ok(JSON.stringify(t.Faces.lord(l2).config)===f0&&t.TALK_PIC.lord(l2)===t.lordPic(l2)&&t.hudPic('brann')===t.portrait('brann'),'with faces: a lord keeps his face when his allegiance changes, dialogue and the battle\'s cards show the same faces')}
 // (2026-11-09, the owner: "change old unit portrait (unitcard) to generated sprite and please use most relevant armor for each unit";
 // "make sure all race or factions use the correct appearance and features on their portrait. Dont forget to have bald")
 {const F=t.Faces,ST=t.ST,types=Object.keys(ST),men=types.filter(k=>!ST[k].beast&&!t.COMPS[k]),beasts=types.filter(k=>ST[k].beast);
  const bad=men.filter(k=>!t.portrait(k).startsWith('data:image/png')||!F.unit(k));
  ok(!bad.length,'with faces: every one of the '+men.length+' troop kinds a generated face'+(bad.length?' (not '+bad.slice(0,6).join(', ')+')':''));
  ok(beasts.every(k=>!F.unit(k)&&t.portrait(k).startsWith('art/portrait/game/')),'a beast keeps its painting ('+beasts.length+')');
  ok(t.unitCard('hum_knight').includes('src="'+t.portrait('hum_knight')+'"'),'the unit card shows the generated face');
  ok(F.unit('hum_knight')===F.unit('hum_knight')&&JSON.stringify(F.unit('hum_levy',0))!==JSON.stringify(F.unit('hum_levy',1)),'a kind\'s face kept; another of its figures (v) another face');
  const C=k=>F.unit(k).config,arm=[['hum_knight','plate','sallet'],['hum_levy','gambeson','arming-cap'],['hum_squire','mail','kettle'],['dw_iron','dwarf-iron-guard','dwarf-guard-helm'],
    ['dw_rune','rune-mail','forge-helm'],['orc_ironjaw','orc-lamellar','orc-war-helm'],['orc_reaver','orc-bare-cross-harness','warband'],['elf_phoenix','elf-leaf-mail','elf-guard-helm'],['elf_archer','leaf-mantle','none'],
    ['hum_mage','robe','wrapped-hood'],['hum_farmer','tunic','straw-hat']],wrong=arm.filter(([k,cl,hw])=>C(k).clothing!==cl||C(k).headwear!==hw);
  ok(!wrong.length,'each kind in its own armour and helm: plate and a sallet for a knight, a gambeson for a levy, the dwarves\' and orcs\' and elves\' own makes, a robe for a mage, plain clothes for a farmer'+(wrong.length?' ('+wrong.map(([k])=>k+': '+C(k).clothing+'/'+C(k).headwear).join(', ')+')':''));
  const metal=['hum_knight','hum_squire','dw_iron','orc_ironjaw','elf_phoenix'].every(k=>men.includes(k)&&/^#[0-9a-f]{6}$/i.test(F.unit(k).colors.metal)),armless=men.filter(k=>!ST[k].tier&&t.FACE_GEAR.armours.includes(C(k).clothing));
  const outl=men.filter(k=>/^band_/.test(k)).flatMap(k=>[0,1,2,3].map(v=>C(k)&&F.unit(k,v).config.clothing)).filter(c=>t.FACE_GEAR.armours.includes(c));
  ok(metal&&!armless.length&&!outl.length,'armour in its metal; no worker in armour, no outlaw in mail'+(armless.length?' ('+armless.join(', ')+')':''));
  // (each people's marks: elves' ears and no beard, orcs' face, dwarves' beards, goblins green with pointed ears)
  const of=r=>men.filter(k=>(ST[k].race||'human')===r).flatMap(k=>[undefined,0,1,2,3,4,5].map(v=>F.unit(k,v))),E=t.PortraitEngine,pr=(r,k,x)=>E.partsFor(r,k).includes(x);
  const elf=of('elf'),orc=of('orc'),dw=of('dwarf'),gob=of('goblin'),hum=of('human');
  ok(elf.every(f=>f.config.race==='elf'&&f.config.beard==='none'&&['pointed','elven-long','elf-swept'].includes(f.config.ears)||f.config.ears==='none'),'elves: elven ears, never a beard');
  ok(orc.every(f=>f.config.race==='orc'&&pr('orc','face',f.config.face))&&orc.some(f=>/tusks/.test(f.config.mouth)),'orcs: orcish faces, tusks among them');
  ok(dw.filter(f=>f.config.profile==='male').every(f=>!['none','stubble'].includes(f.config.beard)||f.config.beard!=='none'),'dwarves: the men bearded');
  ok(gob.length&&gob.every(f=>f.config.race==='orc'&&f.config.ears==='pointed'&&f.config.beard!=='full'&&t.FACE_LOOK.skin.goblin.concat(Object.values(t.FACE_LOOK.skinOf)).includes(f.colors.skin)),'goblins: on an orc\'s face, pointed ears, green skin');
  ok(new Set(hum.map(f=>f.colors.skin)).size>=3&&new Set(hum.map(f=>f.colors.hair)).size>=4,'humans in more than one skin and hair ('+new Set(hum.map(f=>f.colors.skin)).size+' skins, '+new Set(hum.map(f=>f.colors.hair)).size+' hairs)');
  // (the owner's approved orc study (doc/ORC_PORTRAIT_DESIGN.md): orc troops in its leather and harness kits, a heavy one's face on
  // those in mail or plate; the world's orcs mostly the war crest, never a human's pageboy; yours and a companion's the engine's own)
  {const kits=['orc-leather-vest','orc-studded-leather','orc-leather-guard','orc-layered-hide','orc-cross-harness','orc-ring-harness','orc-bare-cross-harness','orc-bare-ring-harness'],
    oT=men.filter(k=>{const L=t.lookOf(k,0,false,0);return (L.race||ST[k].race)==='orc'&&ST[k].tier}),bad=[];
   for(const k of oT){const L=t.lookOf(k,0,false,0),f=F.unit(k),heavy=['mail','plate'].includes(L.armor);
     if(['leather','hide','none'].includes(L.armor)&&L.outer!=='fur'&&!kits.includes(f.config.clothing))bad.push(k+' '+f.config.clothing);if(heavy!==(f.config.face==='orc-heavy'))bad.push(k+' face '+f.config.face)}
   const W=[...Array(60)].map((_,i)=>F.random(i*17+3,'orc','m')),crest=W.filter(f=>f.config.hair==='war-crest').length,human=W.filter(f=>['pageboy','low-bun','curtains','waves'].includes(f.config.hair)).length;
   const e=t.PortraitEngine.random(4242,'male','orc'),mine=F.random(4242,'orc','m',true);
   ok(oT.length>5&&!bad.length&&crest>=15&&!human&&mine.config.hair===t.Faces.bare(e).hair,'orcs as approved: troops in the orc leather and harness kits, the heavy face on mail and plate; the world\'s orcs mostly the war crest ('+crest+' of 60), no human hairstyle; your own face the engine\'s'+(bad.length?': '+bad.join(', '):''))}
  // (bald heads among every people's men but the elves', by their share; a woman's hair kept but among goblins and orcs)
  const share=r=>{let n=0;for(let i=0;i<300;i++)if(F.random(i*31+7,r,'m').config.hair==='none')n++;return n/300},sh=Object.fromEntries(['human','dwarf','orc','goblin','elf'].map(r=>[r,share(r)]));
  ok(sh.human>.07&&sh.dwarf>.1&&sh.orc>.2&&sh.goblin>.7&&sh.elf<.08&&[0,1,2,3,4].every(i=>F.random(i*31+7,'human','f').config.hair!=='none'),'bald heads: '+Object.entries(sh).map(([r,v])=>r+' '+Math.round(v*100)+'%').join(', ')+'; no human woman bald');
  const mine=t.PortraitCharacters.recipe({config:F.random(5,'human','m').config,colors:{skin:'#123456',hair:'#654321'}});
  ok(F.kin(mine,'human').colors.skin==='#123456'&&F.kin(mine,'human').colors.hair==='#654321','a face\'s own chosen colours are kept');
  // (faces off: every kind its painting still, the outlaws the old bandits', the alpha a wolf's)
  t.FACES.on=false;const miss=types.filter(k=>!t.portrait(k).startsWith('art/portrait/game/'));ok(!miss.length,'faces off: every kind its painting ('+miss.join(', ')+')');t.FACES.on=true}
});
