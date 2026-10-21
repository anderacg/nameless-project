'use strict';
// World fingerprints (doc/WORLD_DESIGN.md §2.0, Step 0.0): eight hashes of the classic world that every Phase 0 refactor keeps as
// they are, recorded at the baseline commit 0a42712, and B2 (begin twice, R3, below). Each is printed as an INFO line (to diff a
// refactor against) and PASSed against its constant in EXPECT.
//   W1 tiles and climate (the roads already led round the centres to the gates: lots.js roadsToGates, once a map)
//   W2 DEPOSITS (every field, in order) and DEP_AT
//   W3 TOWNS as JSON after begin's initWorld: owners, garrisons, economy, estates and lots (keys starting with _ left out: caches)
//   W4 LAND (the territory: an index into TOWNS or -1, a tile; hashed a byte a tile, as it was kept before R1 made it 16-bit)
//   W5 the painted world as the game holds it after begin, every byte of worldCv()'s pixels: painted afresh after begin (its
//      useWorld forgets the title screen's picture, worldart.js), so it shows begin's lots; the suite asks for the title's first,
//      so it is the same picture whether or not that frame came before the suite, and again after the second begin (equal)
//   W6 drawWorld() at three fixed spots (where begin puts you; map pixel (1792, 1280), the middle; (2688, 768)), each by day (clock
//      .3 of a day) and by night (.8): the whole 576 x 360 view (its fog, lights, labels and minimap); the six parts are printed too
//   W7 the save string (the quick slot, its time stamp 'at' left out) once 3 days have passed since begin
//   W8 the place of every party and mover after 600 frames of updateWorld(.05): you (walking toward +96, +48 px), the lords (dead
//      ones too), bands, patrols, companions' parties, caravans, beasts, herds, refugees, workers, ships and fights
// Mode: ONE begin('soldier') a page, then every hash in turn on that game: W1-W5, W6, then W8's 600 frames, then on until 3 days
// have passed, then W7. Then begin twice (R3, the world reset: useWorld's onWorld hooks): a second begin, after those days of
// play, must make what the page's first made: W1-W4 as above, and B2, the save straight after it, equal to the save a fresh
// page makes straight after its begin (recorded at R3 by saving there in a one-off run: saving at the first begin here would
// move W7). (Before R3 it made other lots and estates: initEstates read the last game's lots, and the holdings kept what the
// last game left on them.) Each stage seeds
// Math.random itself (as battlesetup does), so the page's seed changes nothing and an unseeded run gives the hashes of -Seed 1:
// begin 9001 (both begins); each of W6's draws 9061+k, with performance.now held at 1e7 + k x 1e4 (clocks, flicker and throttles read alike);
// W8 9008 (speed 1); the days to W7 9007 (you parked off the map at -999, -999, as visual/worldsim: nothing meets you; speed 3).
// The harness's switches hold (TERRAIN, FOG, AUDIO, FIELD_SIZES... off: all battle-side; the world's fog of war is on),
// G.quietEvents is on, and the view is the tests' fixed 576 x 360. Hash: FNV-1a 32-bit over bytes, char codes or 32-bit words;
// W8's places at 1e-6 px.
// G1-G8 (doc/WORLD_DESIGN.md §15.2, "Which hashes may change, and when"): the same eight measures, and B2, on the generated classic
// world (WORLD.gen on: the runner's -Gen), checked against GEXPECT in its place. And the sums the generator makes (WM.sum: the
// classic world, seeds s1-s3 at Normal and s1 at Large), against SUMS, with the flag on or off (genWorld makes them either way).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W;
// (G1-G8, GB2 and the sums recorded 2026-10-22 in wave 3's last merge (E), on 70970ed: A's classic terrain (the hints of §8.15) and
//  B's classic anchors (today's 37 holdings at their places), the first generated classic world the plan holds still. From here
//  they hold, re-recorded only with a reason; at the flip (wave 4) W1-W8 take their values. With the flag on, W6's spots are the
//  same map pixels (where begin puts you, the classic world's Ashford; (1792, 1280); (2688, 768)), on that world)
// (G6, G7, G8 and GB2 re-recorded 2026-10-22, on purpose, the spawn fix (world.js gateSpot, tests/herowalk.js): a new game put you
//  2 tiles under your home's tile, which on the generated classic world is Ashford's house lot (83, 87): you began standing on a
//  house. Now on the open land in front of its gate, the road at (81, 87), so the first spot's pictures (G6), the march from there
//  (G8), the save after it (G7) and the save straight after begin (GB2: your place) move. Checked by putting the old spot back in
//  gateSpot with every other change of that work kept (the hero routed round water, Hurry, the encounters halved, hunger and thirst
//  on your hero, camps on clear ground): all nine as before. Was G6 fd29ebee, G7 dccc7da8, G8 dfad1cf1, GB2 bc14e9a8; G1-G5 unchanged)
const GEXPECT={W1:'94e87250',W2:'6bc88128',W3:'0240c3fb',W4:'ceb55e1f',W5:'ab5e5d34',W6:'41cdb7ab',W7:'8a722172',W8:'f540d98e',B2:'b4f0d917'};
const SUMS={classic:'7333836c','Normal s1':'128cfb7e','Normal s2':'2b581da4','Normal s3':'c38ac906','Large s1':'5af09941'};
const EXPECT={W1:'65e24662',W2:'2b49a168',W3:'dc546553',W4:'46450e62',W5:'0152341c',W6:'33d059e4',W7:'5dae222a',W8:'742df600',B2:'fd6d5be4'};// (at 0a42712; B2 at R3; W6-W8 at Phase 1; W6 at depth, smooth walking and pasture herds and label layout; W7, B2 at save v3)
// (W5 re-recorded 2026-10-22, on purpose: swamp water a lighter peat blue (gfx/worldart.js WATER_RGB.swamp), the owner's pick from
//  tests/visual/swampwater.js (C), so the fen's rivers read as water; today's map has fen water too. Was 6587a43c.)
// (W7 re-recorded again 2026-10-21, on purpose (owner: "water registered too slow"): your waterskins fill the moment you stand at a
//  holding's well (world/supply.js supplyFrame, half a second), not on the hour; the run's first moments are at your home's well, before
//  you are parked off the map, so the save carries full skins. Was ca9d7773; with supplyFrame taken out it is ca9d7773 again.)
// (W7 re-recorded 2026-10-21, on purpose, for supplies (doc/SUPPLY_DESIGN.md, world/supply.js): your band eats and drinks by the
//  hour, not once a day, and its stamina (your hero's sp, in the save) drains on W8's march and comes back by the hour; the band's
//  own record (its hour's counters) is saved as the world piece 'band' once it is not fresh. Checked by switching it off: with the
//  supply hour taken out and the day's eating put back (bandDay), W7 is d7c2a900 as before. Was W7 d7c2a900; W1-W6, W8 and B2
//  unchanged: a fresh game's band record is not saved)
// (W6, W7, W8 and B2 re-recorded 2026-10-21 S4: story and content systems on named streams, seeded per world and per game (owner accepted once); the estates' sort keys drawn before sorting (doc/STORY_DESIGN.md §9).
//  The wild game and the beasts begin places draw from their streams ('critters', 'monsters', core/rng.js), seeded by the world
//  and by the game's number, one draw of Math.random as the game begins (Rng.newGame, before the wild game is placed), so they
//  stand elsewhere (W6's first spot by day and night: f4403dad 3d69a9d9, were 2b5e65e0 a8d18b3d) and the world draws Math.random
//  differently from there (W8); the save holds the game's number and the streams' states (world.rng: B2, W7); the realms'
//  building choice draws one key a kind before its sort (world/buildings.js), not inside its comparator (W7). Checked by switching
//  each off: the streams back on Math.random (no game's number drawn, their save piece left out), W6, W8 and B2 are as before and
//  W7 is f9b6f403 (the estates' keys alone); the estates' comparator as it was too, every hash is as before (the house builder's
//  log line and the new game's timers reset in defence.js and patrols.js move nothing); the streams with no game's number give
//  W6 935d7896, W8 ca1ff21b. Was W6 089d600e, W7 74c85482, W8 0f46a757, B2 2c4b512f; W1-W5 unchanged)
// (W7 re-recorded 2026-10-19, the save only: the world's news (world/news.js W.news, saved once there is any) is in it after
//  3 days. Recording draws no Math.random and changes nothing else: with W.news left out of the save, W7 is c1557699 as before;
//  was W7 c1557699; W1-W6, W8 and B2 (a fresh game: no news yet, none saved) unchanged)
// (W7, B2 re-recorded 2026-10-19, the save only: a new skill, Woodcraft (data/progression.js SKILLS.wood), in P.sk: was
//  W7 053d11da, B2 9b654422; W1-W6, W8 unchanged)
// (W7, W8 merged: the two watches together with day and night half and half: 2109e5d0, aec30b66)
// (W6, W7, W8, B2 re-recorded 2026-10-19, on purpose: wild game placed by its woods (data/critters.js CRITTER_WOODS, rare;
//  a1c79a2 to 56f7e97) draws the shared randomness differently, so the beasts stand elsewhere and the world runs on from there: was
//  W6 b82e8af1, W7 2109e5d0, W8 aec30b66, B2 5c35ee22 (W6 17092e81 then). W6 again, 17092e81 to 1850a1f2, drawing only: what stands
//  in front of any figure in your sight fades to WDEPTH.fade .2 (gfx/depth.js), not only over yours. W1-W5 unchanged)
// (W8 again, d0699187 to ef75dd4c: workers walk at a travelling party's pace, slower with a load: FIELD.speed 26, carry .7, hurry 37)
// (W5, W6 re-recorded in Phase 0 wave 1, on purpose, a fix: the painted world and the minimap were the title screen's, from the
//  lots main.js lays out at load, never repainted for a game's own (begin lays out others); now begin repaints them, so the map
//  shows the real lots. W6 moved only at the third spot (2688, 768) by night and day; was W5 aceeae00, W6 7a99f543)
// (W6, W7, W8 re-recorded in Phase 1, on purpose (doc/WORLD_DESIGN.md D9, D23, D25): W6, the map's own smaller figures (people,
//  riders, hosts, beasts, herds, caravans, ships), stepping by the distance walked; W7 and W8, the slower pace: the day 180 s at
//  a world pace of .4 (72 units of world time a day, as before), every step x .68 (WORLD_SCALE.move), the grace after a fight
//  x 1.47; W7 now takes 3401 frames to its 3 days, not 2200. Was W6 f2016cf2, W7 c50cf16f, W8 847c821c; W1-W5 and B2 unchanged.
//  W6 again, f364827a to 251c8821, at the owner's review: no banner held in the figures' hands, each party's own banner floating
//  over it instead, Total War-style, its label over the banner: render.js drawBanners)
// (W6 again, 251c8821 to 462d81a4, the world's depth order (doc/WORLD_DESIGN.md §12.5, gfx/depth.js): what stands in front of a
//  figure (trees, rock, buildings) is drawn again over it, faded over yours; each structure's shadow its own picture, laid in one
//  pass under them all; the clouds and weather, fog and night under the banners and labels. W1-W5, W7, W8 and B2 unchanged)
// (W6 again, 462d81a4 to 0a25d50c, smooth walking on the map: the walk cycles of eight frames, not four (render.js WALK, people.js
//  MAP_WALK, engine/beasts.js PX.mapLegs). Only the first spot's day picture moved (999c849a, was 903794fd): a pasture's herd and a
//  builder on his planks step by the clock, so they show another frame of the new cycles; with their frames held at 0 every part
//  is as before. The world drawn at the screen's scale (core.js VS) is 1 in the tests' fixed view, so nothing else moves. W1-W5,
//  W7, W8 and B2 unchanged)
// (W6 again, 0a25d50c to b82e8af1, a pasture's herd made part of its estate (critters.js penEnts, drawn with the holding's lots):
//  a cow to each fenced tile or two of a smaller kind, each kept inside its fence as it grazes (before: one animal a tile swinging
//  3 px either way, a cow over the rails). Only the spots by a pasture moved: the first (Ashford's cattle) and the third (Karn
//  Hold's goats), by day and by night (999c849a a10a58b9 f3510035 cff909bc, now 2b5e65e0 a8d18b3d 598f1d1e aad55e57); the middle
//  spot's parts, W1-W5, W7, W8 and B2 unchanged: the herds move as before, only where they are drawn changed)
// (W7 and B2 re-recorded in Phase 2 wave 1, once, on purpose (doc/WORLD_DESIGN.md §15.2, D7, D43): save v3, the format only:
//  v 3, world.v 3, world.map {gen 'classic-0', settings null, sum} and world.edits [] added, world.seen as run lengths (fog.js
//  seenSave). The same save turned back into v2's form (v 2, no map or edits, seen a bit a tile) still hashes to the old values,
//  checked once. B2 hashes a save too. Was W7 3ef9ffd9, B2 00a93435; W1-W6 and W8 unchanged)
// (W6 again, 0a25d50c to 4033f0b4, the labels laid out (render.js labelLayout, tests/labels.js): a party's label nudged up off a
//  holding's name or a label laid before it. Only the third spot moved, by day and night (f3510035 to d9650abf, cff909bc to
//  8e5a398c): two parties stand together there, their labels "12" and "8" on one spot, and the "8" now sits 6 px over the "12".
//  W1-W5, W7, W8 and B2 unchanged)
// (W7 and W8 re-recorded, on purpose, for the estate workers' field work (folk.js FIELD, tests/fieldwork.js): W8's 600 frames run
//  from dawn into the morning, so the workers near you are now 1 to a full crew as you come near (17, was 23) and some walk out
//  to work their rounds: W8 hashes their places, and the workers' draws of Math.random (fewer made, gaps filling) move every party
//  after them. W7 starts from the world W8 leaves. Was W7 a53f54ac, W8 d4c01429; W1-W6 and B2 unchanged)
// (W3, W7, W8 and B2 re-recorded, on purpose, for the two standing watches (world/patrols.js watchesOf, tests/watches.js): every
//  holding keeps t.watches (its day and night captains, make-ups, strength and rest), so TOWNS as JSON (W3) and the saves (W7,
//  B2) carry it; each watch goes out as it is made (riders and archers by day, spearmen and shield foot by night, not garList's
//  mix), so the patrols walk at other paces and W8's places move. Was W3 7a0dcbac, W7 42990e29, W8 ef75dd4c, B2 6f533c8c;
//  W1, W2, W4-W6 unchanged)
// (W3 re-recorded, on purpose, a fix: a holding's centre lot kept a copy of its walls (fort), which saves left out, so a loaded
//  town's citadel or castle's keep stood with no walls until its walls next changed (tests/loadlook.js); the centre is now drawn
//  with its holding's walls as they stand (wallOf, gfx/structures.js lotSprite) and its lot keeps no fort, so TOWNS as JSON lost
//  that key. Was W3 b7aebfe4; W1, W2, W4-W8 and B2 unchanged)
// (W6, W7, W8 and B2 re-recorded 2026-10-19, on purpose: the wilds are dangerous, the lands are defended (the owner's rules,
//  world/defence.js, tests/landdefence.js). Beasts make their lairs in the wilds, on no holding's land (monsters.js lairLand), and
//  bands spawn at least WORLD_SCALE.spawn.away from any holding and estate (world.js spawnBandit), so begin's beasts and bands
//  stand elsewhere and draw the shared randomness differently (B2: the save straight after begin); the world runs on from there,
//  with watches and lords riding at bands and beasts on their land and beasts falling on bands (W8's places, W7's save). W6
//  moved where a band or beast stood in view: the middle spot by day and night, the third by night (06897de7 4b880f03
//  2bfb2642; the first spot's two and the third's by day unchanged). Was W6 1850a1f2, W7 de907005, W8 d2be3a92, B2 1d2e7bc4;
//  W1-W5 unchanged)
const r0=Math.random,pn=performance.now,t0=pn.call(performance);
try{
 try{localStorage.clear()}catch(e){}
 const fnv=()=>{let h=2166136261;const H={
   b(a){for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619)>>>0;return H},// bytes, or 32-bit words (a Uint32Array)
   s(x){x=String(x);for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619)>>>0;return H},
   n(v){h=Math.imul(h^(Math.round(v*1e6)|0),16777619)>>>0;h=Math.imul(h^(Math.round(v)|0),16777619)>>>0;return H},
   get x(){return h.toString(16).padStart(8,'0')}};return H};
 const bytes=a=>new Uint8Array(a.buffer,a.byteOffset,a.byteLength),words=a=>new Uint32Array(a.buffer,a.byteOffset,a.byteLength>>2);
 const got={},lines={},check=(id,h,what)=>{got[id]=h;lines[id]=id+' '+h+' '+what},seed=n=>{Math.random=t.seeded(n)};
 // ---- the game: one begin (the world's picture made first, as the title screen makes it)
 t.worldCv();seed(9001);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();const d0=G.day;
 // W1-W4: the world begin leaves (asked again after the second begin)
 const world=()=>{const h={};
  h.W1=[fnv().b(t.tiles).b(t.climate).x,'tiles and climate ('+t.MW+'x'+t.MH+')'];
  {const x=fnv();for(const d of t.DEPOSITS)x.s(JSON.stringify(d));x.b(bytes(t.DEP_AT));h.W2=[x.x,'DEPOSITS ('+t.DEPOSITS.length+') and DEP_AT']}
  {const s=JSON.stringify(t.TOWNS,(k,v)=>k[0]==='_'?undefined:v);h.W3=[fnv().s(s).x,'TOWNS as JSON ('+t.TOWNS.length+' holdings, '+t.TOWNS.reduce((a,z)=>a+(z.lots||[]).length,0)+' lots, '+s.length+' chars)']}
  // (LAND a byte a tile: TOWNS is far under 128 long, so its 16-bit values are the bytes it had)
  {t.landFresh();const L=t.LAND;h.W4=[fnv().b(bytes(Int8Array.from(L))).x,'LAND ('+L.filter(v=>v>=0).length+' tiles claimed)']}
  return h};
 // the save (the quick slot, its time stamp left out)
 const save=()=>{t.saveGame(true,'quick');const raw=localStorage.getItem(t.SAVE+'.quick'),sv=raw&&JSON.parse(raw);if(sv)delete sv.at;try{localStorage.removeItem(t.SAVE+'.quick')}catch(e){}return sv?JSON.stringify(sv):''};
 const w1=world();for(const id in w1)check(id,w1[id][0],w1[id][1]);
 const paint=()=>{const c=t.worldCv();return [fnv().b(words(c.getContext('2d').getImageData(0,0,c.width,c.height).data)).x,c.width+'x'+c.height]};
 {const [h,wh]=paint();check('W5',h,'the painted world ('+wh+')')}
 // ---- W6: three spots, by day and by night
 {const spots=[[P.x,P.y],[1792,1280],[2688,768]],keep={x:P.x,y:P.y,clock:G.clock},parts=[],h=fnv();let k=0,now=1e7;
  performance.now=()=>now;
  for(const [x,y] of spots)for(const day of [.3,.8]){P.x=x;P.y=y;P.tx=P.ty=null;G.chase=null;G.clock=day*t.DAY;seed(9061+k);now=1e7+k*1e4;
   t.drawWorld();const p=fnv().b(words(t.ctx.getImageData(0,0,t.VW,t.VH).data)).x;parts.push(p);h.s(p);k++}
  performance.now=pn;P.x=keep.x;P.y=keep.y;G.clock=keep.clock;
  check('W6',h.x,'drawWorld at 3 spots by day and night ('+t.VW+'x'+t.VH+': '+parts.join(' ')+')')}
 // ---- W8: 600 frames, you on the move
 {seed(9008);t.setSpeed(1);P.tx=P.x+96;P.ty=P.y+48;for(let f=0;f<600;f++)t.updateWorld(.05);
  const h=fnv().n(P.x).n(P.y),n=[],lists={lords:W.lords,bands:t.bandits,patrols:W.patrols,comps:t.cparties(),caravans:W.caravans,monsters:W.monsters,
   critters:W.critters,refugees:W.refugees,folk:W.folk,ships:W.ships,fights:W.fights};
  for(const k in lists){const L=lists[k]||[];h.s(k).n(L.length);for(const q of L)h.n(q.x).n(q.y);n.push(k+' '+L.length)}
  check('W8',h.x,'every party\'s place after 600 frames (you at '+P.x.toFixed(1)+','+P.y.toFixed(1)+', mode '+G.mode+'; '+n.join(', ')+')')}
 // ---- W7: on until 3 days have passed, then the save
 {seed(9007);P.x=-999;P.y=-999;P.tx=P.ty=null;G.chase=null;t.setSpeed(3);let f=0;
  for(;f<4000&&G.day<d0+3;f++)t.updateWorld(.05);
  const mode=G.mode;G.mode='world';const s=save();
  check('W7',fnv().s(s).x,'the save once 3 days have passed (day '+G.day+', '+f+' more frames, mode '+mode+', '+s.length+' chars)')}
 // ---- begin twice: the same world and the same game as the first begin, a fresh page's
 {seed(9001);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  const w2=world(),s=save(),diff=Object.keys(w1).filter(id=>w2[id][0]!==w1[id][0]),p2=paint()[0];
  ok(p2===got.W5,'begin twice: the second paints the world as the first did (W5'+(p2===got.W5?'':'; differs: '+p2)+')');
  ok(!diff.length,'begin twice: the second makes the world the first made (W1-W4'+(diff.length?'; differ: '+diff.map(id=>id+' '+w2[id][0]).join(', '):'')+')');
  check('B2',fnv().s(s).x,'begin twice: the save straight after the second begin, as a fresh page makes it ('+s.length+' chars)')}
 // (the generated classic world's: G1-G8 and GB2, against GEXPECT)
 const GEN=t.WM.gen!=='classic-0',BASE=GEN?GEXPECT:EXPECT,name=id=>GEN?'G'+id.replace(/^W/,''):id;
 for(const id in BASE)if(lines[id])info((GEN?'G'+lines[id].replace(/^W/,''):lines[id]));
 for(const id in BASE)if(BASE[id])ok(got[id]===BASE[id],name(id)+' equals the baseline ('+got[id]+(got[id]===BASE[id]?'':'; baseline '+BASE[id])+')');
  else o.push('FAIL '+name(id)+' has no baseline ('+got[id]+')');
 // ---- the generator's sums: the classic world, seeds s1-s3 at Normal, s1 at Large
 {const S={classic:t.classicSettings(),'Normal s1':{preset:'normal',seed:'s1'},'Normal s2':{preset:'normal',seed:'s2'},'Normal s3':{preset:'normal',seed:'s3'},'Large s1':{preset:'large',seed:'s1'}};
  for(const k in SUMS){const h=t.genWorld(S[k]).map.sum.toString(16).padStart(8,'0');info('sum '+k+' '+h);if(SUMS[k])ok(h===SUMS[k],'the sum the generator makes, '+k+', equals the baseline ('+h+(h===SUMS[k]?'':'; baseline '+SUMS[k])+')');else o.push('FAIL sum '+k+' has no baseline ('+h+')')}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{Math.random=r0;performance.now=pn}
info('took '+((pn.call(performance)-t0)/1000).toFixed(1)+' s');
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
