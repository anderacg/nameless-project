'use strict';
// Save v3 and sessions (doc/WORLD_DESIGN.md §9.3, §15.2.2 C). A save holds the world it was made in (world.map: gen, settings,
// sum), never the map: a load in another world makes that world again first, and a checksum that differs refuses it ("another
// world version"); v2 saves are refused, never migrated (D7). The fog is saved as run lengths. Slots are gzipped where the browser
// can (a plain header beside the body, so the list reads at once), plain under LOADING.sync. A new game with settings makes that
// world (or uses the one in again, when its settings are the same); without, the world in (with WORLD.gen the New game screen's
// choice, at first the classic seed); its monsters and bandits scale the bands and beasts at the start. Sizes of a save, plain and gzipped, at
// Normal, Large and Huge are reported (INFO).
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W,LD=t.LOADING,r0=Math.random,t0=performance.now();
const J=x=>JSON.stringify(x),strip=s=>{const v=JSON.parse(s);delete v.at;return JSON.stringify(v)},raw=s=>localStorage.getItem(t.slotKey(s));
const diff=(a,b)=>{a=strip(a);b=strip(b);if(a===b)return '';let i=0;while(a[i]===b[i])i++;return '; differ at '+i+': '+a.slice(Math.max(0,i-120),i+40)+' | '+b.slice(Math.max(0,i-120),i+40)};
const save=s=>{G.mode='world';t.saveGame(true,s);return raw(s)},kb=n=>(n/1024).toFixed(0)+' KB';
const fresh=st=>{Math.random=t.seeded(9001);t.begin('soldier',st);Math.random=r0;G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel()};
const play=n=>{Math.random=t.seeded(77);t.setSpeed(3);for(let f=0;f<n;f++)t.updateWorld(.05);Math.random=r0;G.mode='world';G.modal=false;t.hidePanel()};
const refused=f=>{try{f();return null}catch(e){return e}};
try{
 try{localStorage.clear()}catch(e){}
 const home=t.worldKey(t.WM);fresh();const b0=strip(save('5'));// (a game's start in the page's own world)
 // ---- the fog: run lengths, equal to the bits
 {fresh();const n=t.seenArr().length,R=t.seeded(5),cases=[['nothing known',()=>0],['all known',()=>1],['only the last tile',i=>i===n-1?1:0],
   ['patches',i=>R()<((i/97|0)%3?.03:.97)?1:0],['long runs',i=>(i/70000|0)%2]],bits=Math.ceil(Math.ceil(n/8)/3)*4,sizes=[];let all=true;
  for(const [k,f] of cases){const S=t.seenArr();for(let i=0;i<n;i++)S[i]=f(i);const keep=S.slice(),str=t.seenSave();t.seenLoad(str);const same=t.W.seen.every((v,i)=>v===keep[i]);all=all&&same;sizes.push(k+' '+str.length)}
  ok(all,'the fog saved as run lengths loads back tile for tile ('+sizes.join(', ')+' chars; as bits it was '+bits+')');
  t.seenLoad('AAAA');ok(t.W.seen.every(v=>!v),'run lengths that do not add up to the map: nothing known');
  fresh();for(let i=0;i<40;i++){P.x+=40;P.y+=i%2?30:-20;t.reveal()}const k=t.seenArr().reduce((a,v)=>a+v,0),str=t.seenSave();
  info('after a ride of 1600 px, '+k+' tiles known: the fog is '+str.length+' chars (as bits '+bits+')')}
 // ---- v3: the world it was made in, the round trip
 fresh();play(200);const s0=save('quick'),d0=JSON.parse(s0);
 ok(d0.v===3&&d0.world.v===3&&d0.world.map.gen===t.WM.gen&&J(d0.world.map.settings)===J(t.WM.settings)&&d0.world.map.sum===t.WM.sum&&J(d0.world.edits)==='[]'&&!d0.z&&d0.P.army,
  'a save is v3: world.map is the world\'s gen, settings and checksum ('+d0.world.map.gen+', '+d0.world.map.sum+'), edits empty; plain JSON under LOADING.sync');
 ok(!('kind' in d0.world.map)&&s0.length<400000,'the map itself is never saved ('+kb(s0.length)+')');
 // (compared after a load: a load drops what play kept for itself, as a party's power: pw)
 t.loadGame('quick');const s1=save('quick');t.loadGame('quick');
 ok(strip(save('quick'))===strip(s1),'a load and a save again give the same save, and again'+diff(save('quick'),s1));
 // ---- refused: another checksum, another gen, v2 (the game untouched)
 {const snap=()=>J([t.TOWNS.map(z=>z.saveRec()),P.gold,G.day]),before=snap(),put=(k,f)=>{const d=JSON.parse(s0);f(d);localStorage.setItem(t.slotKey(k),J(d))};
  put('3',d=>{d.world.map.sum=(d.world.map.sum+1)>>>0});put('4',d=>{d.world.map.gen='ashmark-9'});
  const e3=refused(()=>t.loadGame('3')),e4=refused(()=>t.loadGame('4'));
  ok(e3&&e3.message===t.OTHER_WORLD&&e4&&e4.message===t.OTHER_WORLD&&snap()===before&&t.worldKey(t.WM)===home,'a save whose checksum or gen is not this world\'s is refused, the game untouched ("'+(e3&&e3.message)+'")');
  put('5',d=>{d.v=2;d.world.v=2;delete d.world.map;delete d.world.edits});G.mode='world';t.loadGame('5');
  ok(!t.readSlot('5')&&t.oldSlot('5')&&G.mode==='title'&&snap()===before,'a v2 save is refused: not listed as a save, not loaded')}
 // ---- a generated world: made by a new game with settings, saved, made again by a load
 {const S={preset:'normal',seed:'redwater'};fresh(S);const m=t.WM;
  ok(m.gen==='ashmark-1'&&m.settings.seed==='redwater'&&m.settings.preset==='normal'&&m.w===448&&m.h===320&&!!m.first&&t.TOWNS.length>0,'a new game with settings makes that world ('+m.gen+', '+m.w+'x'+m.h+', '+t.TOWNS.length+' holdings, sum '+m.sum+')');
  fresh(S);ok(t.WM===m,'a new game with the same settings uses it again (as it first stood)');
  play(200);save('1');t.loadGame('1');const g0=save('1'),sum=t.WM.sum;
  const L1=t.saveLine(t.readSlot('1')),L0=t.saveLine(JSON.parse(s0));
  ok(/^Redwater · Normal · seed redwater · Day \d+ · /.test(L1)&&(t.WORLD.gen?/^Ashmark · Classic · Day/:/^Day/).test(L0),'the save line names the world, its preset and seed (Phase 2b): "'+L1.split(' · ').slice(0,4).join(' · ')+'"; the default world: "'+L0.split(' · ').slice(0,t.WORLD.gen?3:1).join(' · ')+'"');
  // a new game without settings: with WORLD.gen the New game screen's choice (Classic at first), else the world in
  fresh();ok(t.WORLD.gen?t.worldKey(t.WM)===home:t.WM===m,'a new game without settings: '+(t.WORLD.gen?'the New game screen\'s choice, the classic seed':'the world in')+' ('+t.WM.gen+')');
  // the default world back by a load (made again first, flag off); a game in it starts as one in the page's own does (the
  // second new game uses the world the first found: its randoms from the seed, not after the laying out's)
  t.loadGame('quick');ok(t.worldKey(t.WM)===home&&strip(save('quick'))===strip(s1),'a save of the default world loaded in another puts that world and its game back');
  fresh();fresh();ok(strip(save('5'))===b0,'and a game in the world made again starts as one in the page\'s own does'+diff(save('5'),b0));
  t.loadGame('1');ok(t.WM!==m&&t.WM.gen==='ashmark-1'&&t.WM.sum===sum&&strip(save('1'))===strip(g0),'a load in another world makes its world again first (the same checksum) and puts the game back as saved'+diff(save('1'),g0));
  // (the other kind of world: today's map, saved in it (flag off) or claimed by a save of the classic seed (flag on))
  const other=t.WORLD.gen?(()=>{const d=JSON.parse(s0);d.world.map={gen:'classic-0',settings:null,sum:t.classicWorld().map.sum};return J(d)})():s1;
  localStorage.setItem(t.slotKey('2'),other);t.loadGame('2');const back=save('2');
  ok(t.WM.gen==='classic-0'&&t.MW===224&&JSON.parse(back).world.map.sum===JSON.parse(other).world.map.sum,'a save of today\'s map loaded in a generated world makes today\'s map again ('+t.WM.gen+', sum '+t.WM.sum+')');
  if(!t.WORLD.gen)ok(strip(back)===strip(s1),'and puts that game back as it was saved'+diff(back,s1))}
 // ---- monsters and bandits: the start's bands and beasts
 {const n={b:0,m:0},sb=window.spawnBandit,sm=window.spawnMonster;window.spawnBandit=(...a)=>{n.b++;return sb(...a)};window.spawnMonster=(...a)=>{n.m++;return sm(...a)};
  // (each world's own: its density, data/world.js; today's on today's map)
  const count=S=>{n.b=n.m=0;fresh(S);const D=t.density(t.WM);return{got:n.b+'/'+n.m,B:D.bandits,M:D.monsterStart}},c=[count(),count({preset:'normal',seed:'redwater'}),count({preset:'normal',seed:'redwater',bandits:'many',monsters:'calm'}),count({preset:'normal',seed:'redwater',bandits:'few',monsters:'deadly'})];
  window.spawnBandit=sb;window.spawnMonster=sm;const r=Math.round,as=(x,b,m)=>x.got===r(x.B*b)+'/'+r(x.M*m);
  ok(as(c[0],1,1)&&(t.WORLD.gen||c[0].got===t.BANDITS+'/'+t.MONSTER_START)&&as(c[1],1,1)&&c[1].M>t.MONSTER_START&&as(c[2],1.5,.6)&&as(c[3],.6,1.5),'bands and beasts at the start: the world\'s (today\'s on today\'s map, more on a bigger one), then x1.5 and x0.6 by the world\'s settings (bands/beasts '+c.map(x=>x.got).join(', ')+')')}
 // ---- gzipped, a plain header beside it; read back, waiting
 fresh();play(200);save('2');t.loadGame('2');let plain='';
 LD.sync=false;try{
  ok(await t.gunzip64(await t.gzip64('Ashmark · ×'))==='Ashmark · ×','gzip and gunzip, base64, round trip');
  // (the game as it stands now, saved plain and gzipped at once: the page's frames go on between awaits)
  LD.sync=true;plain=save('3');LD.sync=false;const p=t.saveGame(true,'2');ok(p instanceof Promise&&!!t.SAVING,'with CompressionStream a save is written gzipped, a moment later (a Promise)');await p;
  const h=JSON.parse(raw('2'));
  ok(t.SAVE_ZIP&&h.v===3&&h.z&&h.P.level===P.level&&h.P.gold===P.gold&&!h.P.army&&J(h.world.map)===J(JSON.parse(plain).world.map)&&!h.world.own&&J(t.readSlot('2'))===J(h),
   'the slot: a plain header (v, at, the save line\'s fields, world.map) beside the gzipped body; listed at once ('+kb(raw('2').length)+' against '+kb(plain.length)+' plain)');
  ok(t.saveLine({...h,at:0})===t.saveLine({...JSON.parse(plain),at:0}),'its save line is the plain save\'s: '+t.saveLine(h));
  P.gold=-7;t.loadGame('2');await LD.task;
 }finally{LD.sync=true}
 {const gz=save('4');t.loadGame('3');const pl=save('4');
  ok(P.gold!==-7&&strip(gz)===strip(pl),'a gzipped save loads (gunzipped in a step that waits) and puts back the game the plain one does'+diff(gz,pl))}
 {const before=strip(save('3'));localStorage.setItem(t.slotKey('4'),raw('2'));const e=refused(()=>t.loadGame('4'));
  ok(e&&/cannot be read at once/.test(e.message)&&strip(save('3'))===before,'under LOADING.sync a gzipped save cannot be read: it says so, the game untouched')}
 // ---- sizes, plain and gzipped, at Normal, Large and Huge (the stub worlds of Phase 2 wave 0, after 200 frames of play and a ride of 2900 px)
 for(const z of ['normal','large','huge']){const a=performance.now();fresh({preset:z,seed:'redwater'});const b=performance.now();play(200);for(let i=0;i<60;i++){P.x+=48;P.y+=i%2?40:-30;t.reveal()}const s=save('5');
  const gz=(await t.gzip64(s)).length;info(z+' ('+t.MW+'x'+t.MH+', '+t.TOWNS.length+' holdings, '+W.sites.length+' sites): a save is '+kb(s.length)+' plain, '+kb(gz)+' gzipped (base64); the fog '+JSON.parse(s).world.seen.length+' chars; made in '+((b-a)/1000).toFixed(1)+' s')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{Math.random=r0;LD.sync=true}
info('took '+((performance.now()-t0)/1000).toFixed(1)+' s');
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
