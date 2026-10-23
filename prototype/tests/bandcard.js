'use strict';
// The band card (render.js updateHUD; the owner, 2026-10-23) and the names (ui/names.js): the Fitness formula (world/supply.js
// fitnessOf, bandFitness); the three bars in % (Fitness, Morale, Stamina) with their tooltips, the morale chip gone; the band's
// name over your hero's, level and rank; names on the New game page (set, empty: the defaults and nothing stored, Random, too
// long, HTML-escaped); the Names window from the card (the frame rule, Esc, Save, emptied); saves with and without names.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,q=s=>document.querySelector(s),card=()=>q('#stats'),own=k=>Object.prototype.hasOwnProperty.call(P,k);
 const typeName=(k,v)=>{const i=q('#panel [data-name="'+k+'"]');i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));return i};
 const newGame=(hero,band)=>{Kit.fresh();t.showTitle('new');if(hero!=null)typeName('hero',hero);if(band!=null)typeName('band',band);t.act('begin','soldier');G.quietEvents=true;Kit.world();P.comps={};t.updateHUD(true)};
 const raw=s=>JSON.parse(localStorage.getItem(t.slotKey(s)));
 // ---- the formula
 const r=n=>Math.round(n*100)/100;
 ok(Math.round(t.fitnessOf(8,2,.5))===77&&r(t.fitnessOf(8,2,.5))===r(8.5/11*100),'10 troops, 2 wounded, your hero at 50%: (8 + 0.5) / 11 = '+r(t.fitnessOf(8,2,.5))+'%');
 ok(t.fitnessOf(0,0,1)===100&&t.fitnessOf(0,0,.5)===50,'no troops: your hero alone, her health ('+t.fitnessOf(0,0,1)+'%, at half '+t.fitnessOf(0,0,.5)+'%)');
 ok(t.fitnessOf(0,4,1)===20&&t.fitnessOf(0,4,0)===0,'all wounded: only your hero counts (4 wounded, hero full: '+t.fitnessOf(0,4,1)+'%; hero at 0: 0%)');
 ok(t.fitnessOf(10,0,1)===100,'everyone fit and your hero at full: 100%');
 // ---- the card
 newGame();
 P.troops={hum_levy:8};P.wounded={hum_levy:2};P.hp=t.vitals()[0]/2;P.morale=64;P.bsta=55;t.updateHUD(true);
 {const F=t.bandFitness(),el=card(),bar=c=>el.querySelector('.bars .bar.'+c);
  ok(F.fit===8&&F.wounded===2&&F.hp===.5&&Math.round(F.pct)===77,'your band: 8 fit, 2 wounded, your hero at half: '+Math.round(F.pct)+'%');
  ok(el.querySelectorAll('.bars .bar').length===3&&['fit','mor','sta'].every(c=>bar(c)),'three bars: Fitness, Morale, Stamina, in that order ('+[...el.querySelectorAll('.bars .bar')].map(b=>b.className).join(' | ')+')');
  ok(/^Fitness77%$/.test(bar('fit').textContent)&&bar('fit').querySelector('i').style.width==='77%'&&!bar('fit').classList.contains('low'),'Fitness 77%, the bar 77% full ('+bar('fit').textContent+')');
  ok(/^Morale64%$/.test(bar('mor').textContent)&&bar('mor').querySelector('i').style.width==='64%','Morale 64% ('+bar('mor').textContent+')');
  ok(/^Stamina.*55%$/.test(bar('sta').textContent)&&bar('sta').querySelector('i').style.width==='55%','Stamina 55% ('+bar('sta').textContent+')');
  ok(/8 fit, 2 wounded, your hero at 50% health/.test(bar('fit').title),'Fitness on hover: the fit, the wounded, your hero ('+bar('fit').title+')');
  ok(/drifts toward/.test(bar('mor').title)&&/nerve is \d+/.test(bar('mor').title),'Morale on hover: the troops’ nerve it drifts toward ('+bar('mor').title+')');
  ok(/stamina 55%/.test(bar('sta').title)&&/Tired under \d+%, Exhausted under \d+%/.test(bar('sta').title),'Stamina on hover: as today, in % ('+bar('sta').title+')');
  ok(![...el.querySelectorAll('.pc-res .chip')].some(c=>/^Morale/.test(c.title))&&!el.querySelector('.pc-res [data-icon="morale"]'),'no morale chip among the resources ('+[...el.querySelectorAll('.pc-res .chip')].map(c=>c.title.split(/[:(]/)[0].trim()).join(', ')+')');
  ok(el.querySelectorAll('.pc-res .chip').length<=6,'the resources: '+el.querySelectorAll('.pc-res .chip').length+' chips (two rows of three)')}
 P.troops={};P.wounded={hum_levy:4};P.hp=t.vitals()[0];P.morale=20;t.updateHUD(true);
 ok(/^Fitness20%$/.test(card().querySelector('.bar.fit').textContent)&&card().querySelector('.bar.fit.low')&&card().querySelector('.bar.mor.low'),'all wounded: Fitness 20%, red; Morale 20%, low');
 P.wounded={};t.updateHUD(true);ok(/^Fitness100%$/.test(card().querySelector('.bar.fit').textContent),'no troops, your hero at full: Fitness 100%');
 // ---- the header, no names: the default band name over your race and past
 {const b=card().querySelector('.pc-band'),s=card().querySelector('.pc-who small'),who=t.RACES[P.race].n+' '+t.BGS[P.bg].n;
  ok(b&&b.tagName==='BUTTON'&&b.textContent===t.NAMING.band&&b.dataset.act==='nm-open','the band’s name, big, a button ('+(b&&b.textContent)+')');
  ok(s.textContent===who+' · Lv '+P.level+' · '+t.rankName(),'under it your race and past, level and rank ('+s.textContent+')');
  ok(!own('name')&&!own('band'),'a new game with no names stores none')}
 // ---- a new game with names
 newGame('Bran Redhand','The Grey Company');
 ok(P.name==='Bran Redhand'&&P.band==='The Grey Company'&&!t.NEW_NAMES.hero&&!t.NEW_NAMES.band,'names typed on the New game page: your hero’s and your band’s, the page’s cleared');
 ok(card().querySelector('.pc-band').textContent==='The Grey Company'&&card().querySelector('.pc-who small').textContent==='Bran Redhand · Lv 1 · '+t.rankName(),'on the card: '+card().querySelector('.pc-band').textContent+' / '+card().querySelector('.pc-who small').textContent);
 ok(/You ride out of .* alone, as Bran Redhand, a /.test(G.msgs[0].m)&&/The Grey Company is you alone for now/.test(G.msgs[0].m),'the first line names them ('+G.msgs[0].m+')');
 // ---- empty, spaces only: the defaults, nothing stored
 newGame('   ','');ok(!own('name')&&!own('band')&&card().querySelector('.pc-band').textContent===t.NAMING.band,'left empty (or spaces): the defaults, nothing stored');
 ok(/^You ride out of .* alone, as a human .*\. Win fame around here/.test(G.msgs[0].m),'and the first line as before ('+G.msgs[0].m+')');
 // ---- random
 t.showTitle('new');{const hs=[],bs=[];for(let i=0;i<30;i++){t.act('nm-random','hero');hs.push(q('#panel [data-name="hero"]').value);t.act('nm-random','band');bs.push(q('#panel [data-name="band"]').value)}
  const folk=t.FOLK_NAMES[G.race||'human'];
  ok(hs.every(n=>n&&n.length<=t.NAMING.max&&folk.includes(n.split(' ')[0])&&t.SWORD_BYNAMES.some(b=>n.endsWith(' '+b))),'Random: a folk name of your race with a byname ('+hs.slice(0,4).join(', ')+')');
  ok(bs.every(n=>n&&n.length<=t.NAMING.max)&&new Set(bs).size>5&&bs.some(n=>/^The /.test(n))&&bs.some(n=>!/^The /.test(n)),'Random band names, varied ('+bs.slice(0,5).join(', ')+')');
  ok(t.NEW_NAMES.hero===hs[29]&&t.NEW_NAMES.band===bs[29],'the random names are the ones the game takes');
  t.act('begin','soldier');G.quietEvents=true;Kit.world();ok(P.name===hs[29]&&P.band===bs[29],'and taken: '+P.name+', '+P.band)}
 // ---- too long; spaces squeezed
 newGame('  Aelin    of the   very long  western marches ','A'.repeat(40));
 ok(P.name==='Aelin of the very long w'&&P.name.length===t.NAMING.max&&P.band==='A'.repeat(t.NAMING.max),'too long: trimmed to '+t.NAMING.max+' characters, spaces squeezed ('+P.name+')');
 // ---- HTML-escaped
 newGame('<img src=x onerror=1>','A&B "<i>Co</i>"');
 {const el=card();ok(!el.querySelector('img:not(.pc-pic)')&&!el.querySelector('.pc-band i')&&el.querySelector('.pc-band').textContent==='A&B "<i>Co</i>"'&&el.querySelector('.pc-who small').textContent.startsWith('<img src=x onerror=1>'),'names are plain text on the card ('+el.querySelector('.pc-band').innerHTML+')');
  ok(!document.querySelector('#log img')&&G.msgs[0].m.includes('&lt;img'),'and in the first line')}
 // ---- the Names window, from the card
 newGame();Kit.world();card().querySelector('.pc-band').click();
 {const nb=q('#panel .nav'),btns=nb?[...nb.querySelectorAll('button')]:[];
  ok(G.mode==='names'&&/Names/.test(q('#panel h2').textContent)&&q('#panel [data-name="hero"]')&&q('#panel [data-name="band"]')&&q('#panel [data-act="nm-random"][data-arg="band"]'),'the band’s name opens the Names window: both names, each with Random');
  ok(btns.length===2&&btns[0].dataset.nav==='back'&&btns[0].textContent==='Back'&&btns[1].dataset.nav==='close'&&btns[1].textContent==='Save'&&nb===q('#panel').lastElementChild,'the frame rule: a header, the bar at the bottom, Back on the left, Save on the right');
  ok(document.activeElement===q('#panel [data-name="hero"]'),'the hero’s field has the focus')}
 typeName('band','Ashford Free Riders');Kit.key('Escape','Escape');
 ok(G.mode==='world'&&q('#ov').hidden&&!own('band'),'Esc goes Back: closed, nothing changed');
 card().querySelector('.pc-band').click();typeName('band','Ashford Free Riders');{const i=typeName('hero','Wat the Quiet');i.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}))}
 ok(G.mode==='world'&&!own('band')&&!own('name'),'Esc in a field: Back too');
 card().querySelector('.pc-band').click();typeName('band','Ashford Free Riders');typeName('hero','Wat the Quiet');t.act('nm-save');
 ok(G.mode==='world'&&q('#ov').hidden&&P.band==='Ashford Free Riders'&&P.name==='Wat the Quiet'&&card().querySelector('.pc-band').textContent==='Ashford Free Riders','Save: both names, on the card');
 ok(G.msgs.some(m=>/Your band is now Ashford Free Riders/.test(m.m)),'said in the log');
 card().querySelector('.pc-band').click();ok(q('#panel [data-name="band"]').value==='Ashford Free Riders'&&q('#panel [data-name="hero"]').value==='Wat the Quiet','opened again: the names as they are');
 typeName('hero','Peg');q('#panel [data-name="hero"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));ok(G.mode==='world'&&P.name==='Peg','Enter in a field saves');
 card().querySelector('.pc-band').click();typeName('hero','');typeName('band','  ');t.act('nm-save');
 ok(!own('name')&&!own('band')&&card().querySelector('.pc-band').textContent===t.NAMING.band,'emptied and saved: back to the defaults, stored as none');
 G.modal=true;card().querySelector('.pc-band').click();ok(G.mode==='world','with a window open, the card’s name opens nothing');Kit.world();
 // ---- saves
 newGame();t.saveGame(true,'1');{const d=raw('1');ok(d&&!('name' in d.P)&&!('band' in d.P),'a save with no names holds none')}
 t.loadGame('1');ok(!own('name')&&!own('band')&&card().querySelector('.pc-band').textContent===t.NAMING.band,'loaded: the defaults');
 P.name='Bran <Redhand>';P.band='The Grey Company';Kit.world();t.saveGame(true,'2');{const d=raw('2');ok(d.P.name==='Bran <Redhand>'&&d.P.band==='The Grey Company','a save with names holds them')}
 delete P.name;delete P.band;t.loadGame('2');t.updateHUD(true);
 ok(P.name==='Bran <Redhand>'&&P.band==='The Grey Company'&&card().querySelector('.pc-band').textContent==='The Grey Company'&&card().querySelector('.pc-who small').textContent.startsWith('Bran <Redhand> ·'),'loaded: the names back, on the card');
 t.loadGame('1');ok(!own('name')&&!own('band'),'and a save without them loaded after: none (the last game’s names do not leak)');
});
