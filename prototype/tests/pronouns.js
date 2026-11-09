'use strict';
// Gender and pronouns (core/pronouns.js; the owner, 2026-11-01: "the people in the world should have gender"): every named
// person is a he or a she, from their data, their title, their given name or a hash of their name (never a draw), and the text
// about them says so: a Lady's dialogue and log lines say she and her, a Lord's he and his; a neutral title's gender is the same
// across a save and a load and in two new games from one seed; a female companion's lines say her; a save from before (no gender
// anywhere, the hero's P.gender missing) loads with the same pronouns, your hero a man; a group, or no one, is they. The female
// titles of the generator (world/worldplace.js LORD_SHE) go only on the lords whose syllables hash to a woman's. Your hero: a man
// or a woman chosen on the New game page (ui/names.js), kept as P.gender only for a woman, shown on the hero's card.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,q=Kit.q;
 window.requestAnimationFrame=()=>0;
 // ---- the helper
 ok(t.pr(null).he==='they'&&t.pr([]).his==='their'&&t.pr({group:true}).him==='them'&&t.pr(null).Himself==='Themselves','pr of no one or a group: they, their, them');
 ok(t.pr('Lady Maren').he==='she'&&t.pr('Lady Maren').His==='Her'&&t.pr('Lord Aldric').his==='his'&&t.pr('Lord Aldric').He==='He','a title decides: Lady she, Lord he');
 ok(t.genderOf('Thane Borka')==='f'&&t.genderOf('Thane Hroth')==='m'&&t.genderOf('Warchief Ulgra')==='f'&&t.genderOf('Ser Corwin')==='m'&&t.genderOf('Admiral Neri')==='f','a realm\'s named lords by their data (their portraits): Borka, Ulgra and Neri women, Corwin a man');
 ok(t.genderOf('brann')==='m'&&t.genderOf('elske')==='f'&&t.genderOf('tavi')==='f'&&t.genderOf('ander')==='m','the companions by their data: Brann and Ander men, Elske and Tavi women');
 ok(t.genderOf('Morwen the Red')==='f'&&t.genderOf('Grak One-Eye')==='m'&&t.genderOf('Alys the Bowmaster')==='f'&&t.genderOf('Bran the Drillmaster')==='m','chiefs and trainers by their given names');
 {const ns=['Captain Selwen','Admiral Brana','Ser Talric','Warden Nydor','Captain Rod'],a=ns.map(t.genderOf).join();ok(ns.every(n=>/^[mf]$/.test(t.genderOf(n)))&&ns.map(t.genderOf).join()===a&&t.genderOf('Captain Selwen')===t.genderHash('Selwen'),'a neutral title: the hash of the name past it, the same each time ('+a+')')}
 ok(t.prFill('{He} said {his} piece to {him}, {you.sir}; {Lord} of it.','Lady Maren')==='She said her piece to her, sir; Lady of it.','prFill: the speaker\'s words, and your hero\'s (a man: sir)');
 ok(t.Stories.fill('{lord} wants a word carried to {lord.his} steward.',{memory:{lord:'Lady Maren'}})==='Lady Maren wants a word carried to her steward.','a story\'s {lord.his}: the lord its memory names');
 // ---- the generator's women's titles: only where the name's syllables hash to a woman's; the men's titles the rest
 {const she=t.LORD_SHE,he=Object.keys(she),fem=Object.values(she);ok(he.every(k=>t.TITLE_GENDER[k]==='m')&&fem.every(k=>t.TITLE_GENDER[k]==='f'),'every title with a woman\'s form is a man\'s, and the form a woman\'s ('+he.map(k=>k+'/'+she[k]).join(', ')+')')}
 // (the generator's lords past the four, made from one seeded stream with the swap and without it: the same draws, the same names
 // but for the titles swapped, each where its syllables hash to a woman's)
 {const run=()=>{let n=0;const R0=t.seeded(7),R=()=>{n++;return R0()};return {o:t.placeLords(R,12),n}},she=t.LORD_SHE,keep={...she};
  const a=run();let b;try{for(const k in she)delete she[k];b=run()}finally{Object.assign(she,keep)}
  const A=Object.values(a.o).flat(),B=Object.values(b.o).flat(),un=s=>{const w=s.split(' ');const m=Object.keys(keep).find(k=>keep[k]===w[0]);return m?[m,...w.slice(1)].join(' '):s};
  const swapped=A.filter((s,i)=>s!==B[i]);
  ok(a.n===b.n&&A.length===B.length&&A.every((s,i)=>un(s)===B[i]),'the generator: the same draws ('+a.n+') and the same lords with the swap off, but for their titles');
  ok(swapped.length>0&&swapped.every(s=>t.genderOf(s)==='f'&&t.genderHash(s.split(' ')[1])==='f')&&A.filter(s=>keep[s.split(' ')[0]]&&!t.FIDS.some(f=>t.FACS[f].lords.includes(s))).every(s=>t.genderHash(s.split(' ')[1])==='m'),swapped.length+' women among the dwarves\' and orcs\' lords: '+swapped.slice(0,6).join(', '))}
 // ---- a game
 const start=()=>{Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});P.hostile={}};
 start();
 {const fixed=new Set(t.FIDS.flatMap(f=>t.FACS[f].lords)),gen=W.lords.filter(l=>!fixed.has(l.name)),sw=gen.filter(l=>Object.values(t.LORD_SHE).includes(l.name.split(' ')[0])),he=gen.filter(l=>t.LORD_SHE[l.name.split(' ')[0]]);
  ok(sw.every(l=>t.genderHash(l.name.split(' ')[1])==='f'&&t.genderOf(l)==='f')&&he.every(l=>t.genderHash(l.name.split(' ')[1])==='m'&&t.genderOf(l)==='m'),gen.length+' generated lords: '+sw.length+' with a woman\'s title, each hashed a woman; '+he.length+' with a man\'s, each a man');
  info('lords: '+W.lords.map(l=>l.name+' '+t.genderOf(l)).join(', '))}
 const lady=W.lords.find(l=>l.name==='Lady Maren'),lord=W.lords.find(l=>l.name==='Lord Aldric');
 const talk=l=>{Object.assign(l,{inside:null,x:P.x+3,y:P.y,dead:false,gone:false,held:false});Kit.world({town:null});t.lordMeet(l);t.act('talk-topic','sway');t.act('talk-flatter',l.id);return Kit.text()};
 const leaveHost=l=>{t.Host.under=null;t.Host.join(l,2);t.Host.leave(false);return G.msgs[G.msgs.length-1]?.m||''};
 // (a Lady: her dialogue and her log lines)
 {const s=talk(lady);ok(/Lady of the/.test(s)&&/Win her regard/.test(s)&&/Praise her/.test(s)&&!/Praise him|his regard/.test(s),'a Lady\'s audience: Lady of the realm, Win her regard, Praise her');
  ok(/Threaten her/.test(s)||!q('[data-act="talk-threaten"]'),'Threaten her (when offered)');t.act('lord-leave');
  const m=leaveHost(lady);ok(/lets you go with her thanks/.test(m),'her log line: "'+m+'"');
  ok(t.charOf(lady).roleName==='Lady','her role on her card: Lady')}
 // (a Lord: his)
 {const s=talk(lord);ok(/Lord of the/.test(s)&&/Win his regard/.test(s)&&/Praise him/.test(s),'a Lord\'s audience: Lord of the realm, Win his regard, Praise him');t.act('lord-leave');
  const m=leaveHost(lord);ok(/lets you go with his thanks/.test(m),'his log line: "'+m+'"');ok(t.charOf(lord).roleName==='Lord','his role: Lord')}
 // ---- a neutral title, stable across a save and a load, and in two new games from one seed
 const neutral=W.lords.find(l=>/^(Ser|Warden|Admiral|Captain) /.test(l.name)&&!t.FACS[l.fac].gender?.[l.name])||W.lords.find(l=>/^(Ser|Warden|Admiral|Captain) /.test(l.name));
 const all=()=>W.lords.map(l=>l.name+':'+t.genderOf(l)).join();
 {const g0=t.genderOf(neutral),a0=all();Kit.world();t.saveGame(true,'quick');t.loadGame('quick');Kit.world();const back=W.lords.find(l=>l.name===neutral.name);
  ok(back&&t.genderOf(back)===g0&&all()===a0,neutral.name+' ('+g0+'): the same across a save and a load, and every other lord with it');
  start();const a1=all();start();ok(a1===a0&&all()===a0,'two new games from one seed: the same lords, the same genders')}
 // ---- a female companion
 {const c=t.Prisons.card({k:'comp',id:'tavi',keep:'band',since:1},0,'x',null,false);ok(/Get her out, or she may slip away/.test(c.note),'Tavi held: "'+c.note+'"');
  t.registerRecruit('rc_t',{n:'Morwen the Red',kind:'chief',from:'chief'});ok(/now she rides with you/.test(t.COMPS.rc_t.d),'a chief recruited, Morwen: "'+t.COMPS.rc_t.d+'"');delete t.COMPS.rc_t}
 // ---- the wounded traveller, a woman by her name
 {const th={memory:{name:'Aelin',town:t.TOWNS[0].name,x:P.x,y:P.y},i:1},e=t.Wounded.escort(th);
  ok(/Wherever they hold her, she lives/.test(e.say.captured)&&/Her family will hear/.test(e.say.late)&&t.Wounded.spouse(th)==='husband'&&t.Wounded.kin(th)==='her family','a woman traveller: her lines, her husband');
  const m={...th,memory:{...th.memory,name:'Oswin'}};ok(/hold him, he lives/.test(t.Wounded.escort(m).say.captured)&&t.Wounded.spouse(m)==='wife','a man traveller: his')}
 // ---- your hero: a man by default; a woman chosen on the New game page; a save without it a man's
 {start();ok(t.genderOf(P)==='m'&&!('gender' in P),'a new game: your hero a man, nothing stored');
  t.showTitle('new');const b=q('#panel [data-act="nm-gender"][data-arg="f"]');ok(!!b&&!!q('#panel [data-act="nm-gender"][data-arg="m"].on'),'the New game page: Man (chosen) and Woman, beside your name');
  b.click();ok(t.NEW_NAMES.gender==='f'&&b.classList.contains('on')&&b.getAttribute('aria-pressed')==='true','Woman chosen');
  start();ok(P.gender==='f'&&t.genderOf(P)==='f'&&t.prFill('{you.sir}',null)==='my lady','the game begun: P.gender f, "my lady"');
  Kit.world();t.saveGame(true,'quick');const d=JSON.parse(localStorage.getItem(t.slotKey('quick')));ok(d.P.gender==='f','saved: her gender');
  delete d.P.gender;localStorage.setItem(t.slotKey('quick'),JSON.stringify(d));t.loadGame('quick');ok(t.genderOf(P)==='m'&&t.pr(lady).he==='she','an old save without it: a man, and the lords as they were');
  t.NEW_NAMES.gender='m';const rn=t.randomHeroName('human','f');ok(t.genderOf(rn.split(' ')[0])==='f','a random name for a woman: a woman\'s ('+rn+')')}
 Kit.world();
});
