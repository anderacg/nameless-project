'use strict';
window.ARENA=true;
// The ways to die (sprites.js DEATHS, deathOf; vfx.js drawBody, drawFallen; engine/beasts.js PX.BEAST_DEATHS; critters.js critterDead;
// the owner, 2026-11-03: "make sure all sprites has correct dead sprite and more variant of dead sprite"): every kind (every troop,
// your hero, the companions, every beast and monster, the hunt's game) lies dead in a sprite of its own, not its standing one, on the
// ground, whole; each its several deaths, picked by its id; a rider's mount lies by him; no random draw; DEATHS.on false: the corpses
// as before, pixel for pixel; 150 dead cost no more a frame. Drawn only: the fight's numbers stay as they were.
Kit.suite(({ok,info})=>{const t=T,L=t.BattleLab,D=t.DEATHS,random=Math.random;
 L.start({leftGroups:[{type:'militia',count:1}],rightGroups:[{type:'militia',count:1}],morale:false,deploy:false,paused:true,ai:false,seed:3});
 try{
  // (the hunt's game as battle kinds, as battle/hunting.js makes them)
  for(const id in t.CRITTERS){const k='wild_'+id;if(!t.ST[k])t.ST[k]={n:t.CRITTERS[id].n,hp:10,dmg:0,spd:10,reach:2,range:0,cd:1,tier:1,beast:true,wildlife:id,arm:0}}
  const kinds=['hero',...Object.keys(t.ST).filter(k=>k!=='hero')],unit=(type,id)=>({id,type,team:type==='hero'?0:1,hero:type==='hero',v:0,face:1});
  const data=s=>s.getContext('2d',{willReadFrequently:true}).getImageData(0,0,s.width,s.height).data,key=s=>{const d=data(s);let h=0;for(let i=0;i<d.length;i++)h=(h*31+d[i])|0;return s.width+'x'+s.height+':'+h};
  // (its opaque box: [x0, y0, x1, y1], or null)
  const box=s=>{const d=data(s),w=s.width;let a=1e9,b=1e9,c=-1,e=-1;for(let i=3;i<d.length;i+=4)if(d[i]){const x=(i>>2)%w,y=(i>>2)/w|0;a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x);e=Math.max(e,y)}return c<0?null:[a,b,c,e]};
  // (one drawn at (G, G) in a canvas 2G across: settled (q 1), no blood; on: DEATHS.on; mark: his death kept by the corpse)
  const G=64,draw=(u,on,mark=true,q=1)=>{const k0=D.on;D.on=on;const c={x:G,y:G,team:1,face:1,sp:t.corpseOf(u),td:0,dry:true,pool:7,seed:1,wi:3,wx:7,wy:2,skin:t.PPAL.wood[2]};if(mark)t.DEATH_OF.set(c,u);
   try{return t.mkc(2*G,2*G,g=>t.drawBody(g,c,q,0))}finally{D.on=k0}};
  // (each kind's deaths: the first id that draws each)
  const deaths=type=>{const m=new Map();for(let id=1;id<500;id++){const u=unit(type,id),V=t.deathOf(u);if(!m.has(V.name))m.set(V.name,u)}return m};
  const ALL=new Map(kinds.map(k=>[k,deaths(k)]));
  // ======== the table
  ok(D.on&&Object.values(D.man).every(w=>w>0)&&D.rider.clear>0&&D.mount.belly>0&&D.helm>0&&D.helm<1&&Object.keys(D.wild).every(n=>t.CRITTER_DEATHS.includes(n)),'the deaths and their weights in one table, DEATHS (on)');
  ok(t.PX.BEAST_KINDS.every(k=>t.PX.BEAST_DEATHS[k].length>=3),'every beast has three deaths: '+t.PX.BEAST_KINDS.map(k=>k+' '+t.PX.BEAST_DEATHS[k].join('/')).join(', '));
  {const f=t.PX.BEAST_KINDS.map(k=>t.PX._beastFit(k)).filter(r=>!r.ok);ok(!f.length,'none of a beast\'s deaths reaches its canvas\'s edge (PX._beastFit)'+(f.length?': '+JSON.stringify(f):''))}
  // ======== every kind: a dead sprite of its own, whole, on the ground
  {const bad=[];
   for(const [k,m] of ALL){const S=t.ST[k]||{},beast=!!S.beast;
    for(const [n,u] of m){const V=t.deathOf(u);
     if(beast){const b=box(V.down),st=V.beast;if(!b){bad.push(k+' '+n+' blank');continue}
      if(key(V.down)===key(st)||S.wildlife&&[0,1,2,3,4,5,6,7].some(f=>key(V.down)===key(t.unitSprite(k,1,false,0,f+2))))bad.push(k+' '+n+' standing');
      if(V.down.width!==st.width||V.down.height!==st.height)bad.push(k+' '+n+' cell '+V.down.width+'x'+V.down.height);
      if(b[3]<V.down.height-3)bad.push(k+' '+n+' floats '+(V.down.height-1-b[3]));}
     else{const b=box(V.body);if(!b){bad.push(k+' '+n+' blank');continue}
      if(key(V.body)===key(V.stand))bad.push(k+' '+n+' standing');
      // (on the ground: drawn, his lowest pixel just below his point, nothing far above it; inside the blood layer's reach, vfx.js bake)
      const d=box(draw(u,true));if(!d||d[3]<G-1||d[3]>G+(V.mount?24:18)||d[1]<G-32||d[0]<G-46||d[2]>G+46)bad.push(k+' '+n+' lies '+(d&&d.map(v=>v-G)))}}}
   ok(!bad.length,'all '+kinds.length+' kinds ('+[...ALL.values()].reduce((a,m)=>a+m.size,0)+' deaths) lie dead, each not its standing sprite, whole, on the ground'+(bad.length?': '+bad.slice(0,12).join('; '):''))}
  // (the hunt's game: dead, not walking (before: a frame of its walk))
  {const u=unit('wild_deer',1),k0=D.on;D.on=false;const before=t.deathOf(u).down;D.on=k0;
   ok(before===t.unitSprite('wild_deer',1,false,0,t.PX.BEAST_DEAD)&&key(t.deathOf(u).down)!==key(before),'the hunt\'s game lies dead in a pose of its own (before: a frame of its walk)')}
  // ======== the deaths: several to a kind, each its own picture
  {const few=[],same=[];
   for(const [k,m] of ALL){const S=t.ST[k]||{},need=k==='tiger'?1:S.wildlife?3:S.beast?3:t.corpseOf(unit(k,1)).mount?6:5;if(m.size<need)few.push(k+' '+m.size);
    const pics=[...m.values()].map(u=>key(draw(u,true)));if(new Set(pics).size!==pics.length)same.push(k)}
   ok(!few.length,'each kind its deaths: a man 5 (face, back, curl, knees, flung), a rider 6 or more, a beast 3 (the tiger uses its approved side-fall)'+(few.length?': '+few.join(', '):''));
   ok(!same.length,'each of a kind\'s deaths drawn its own'+(same.length?': '+same.join(', '):''))}
  {const m=ALL.get('hum_foot'),names=[...m.keys()],helm=[...ALL.values()].some(x=>[...x.keys()].some(n=>/helm/.test(n)));
   ok(['face','back','curl','knees','flung'].every(n=>names.some(x=>x.startsWith(n)))&&helm,'a footman: face down, on his back, curled, on his knees, arms flung; some with their helm rolled off ('+names.join(', ')+')');
   const V=t.deathOf(m.get(names.find(n=>n.startsWith('back'))));ok(V.bits.length>=1&&V.wd===-1&&V.fall==='back','his shield lies by him, his weapon dropped behind him, on his back he fell backwards')}
  // ======== the pick: by his id, the same every time
  {const a=['hum_foot','hum_knight','wolf','slime','wild_cow'].every(k=>{for(let id=1;id<60;id++){const n=t.deathOf(unit(k,id)).name;if(t.deathOf(unit(k,id)).name!==n||t.deathOf({...unit(k,id),x:id*7,hp:0}).name!==n)return false}return true});
   const spread=new Set([...Array(200)].map((_,i)=>t.deathOf(unit('hum_foot',i+1)).name.split(/[ |]/)[0]));
   ok(a&&spread.size===5,'the pick is his id\'s: the same each time, wherever he lies; 200 men use all five deaths');
   const n=[...Array(400)].reduce((o,_,i)=>{const w=t.deathOf(unit('militia',i+1)).name.replace(/ .*/,'');o[w]=(o[w]||0)+1;return o},{}),tot=Object.values(D.man).reduce((a,b)=>a+b,0);
   ok(Object.keys(D.man).every(w=>Math.abs((n[w]||0)/400-D.man[w]/tot)<.09),'by their weights: '+JSON.stringify(n))}
  // ======== a rider: his mount lies by him, on its side or its belly; he clear of it, across it or under it
  {const bad=[],seen=new Set();
   for(const k of kinds){const m=ALL.get(k);if(!t.corpseOf(unit(k,1)).mount)continue;
    for(const [n,u] of m){const V=t.deathOf(u),[,ride,lie]=n.split('|');seen.add(ride+'|'+lie);if(!V.mount||!V.down||!box(V.down))bad.push(k+' '+n+' no mount');
     const w=draw(u,true),wo=t.mkc(2*G,2*G,g=>{const c={x:G,y:G,team:1,face:1,sp:t.corpseOf(u),td:0,dry:true,pool:7,seed:1,wi:3,wx:7,wy:2,skin:t.PPAL.wood[2]};t.drawFallen(g,c,{...V,mount:null,at:[0,0]},1,0)});
     // (its mount drawn: more of the picture filled than him alone (2026-11-06: by its pixels, not its width: he is thrown to his own
     //  place by the mount, and a doll's narrower body may lie as wide as the mount does))
     const fill=s=>{const d=data(s);let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n};if(fill(w)<=fill(wo)+40)bad.push(k+' '+n+' mount not drawn')}}
   ok(!bad.length&&seen.size===6,'every rider\'s mount drawn by him, all six ways ('+[...seen].join(', ')+')'+(bad.length?': '+bad.slice(0,8).join('; '):''))}
  {const L0=t.unitLook(unit('orc_wolf',1)),k0=D.on;D.on=false;const before=t.corpseOf(unit('orc_wolf',1)).down;D.on=k0;
   const side=[...ALL.get('orc_wolf')].map(([n,u])=>t.deathOf(u)).find(V=>V.ride&&/side$/.test(V.name));
   ok(L0.mount==='wolf'&&side&&key(side.down)!==key(before),'a wolf rider\'s wolf lies as a wolf (before: a horse\'s shape)')}
  // (a horse killed under its rider, who fought on (battle/dismount.js): its own kind, on its side or its belly by where it lies)
  {const hc=(k,x)=>{const c0=t.corpseOf(unit(k,1));return[c0,{x,y:G,team:1,face:1,sp:{mount:c0.mount,down:c0.down,horse:true},td:0,dry:true,pool:9,seed:1}]};
   const lies=new Set([...Array(20)].map((_,i)=>t.horseDeathOf(hc('hum_knight',G+i)[1]).name)),side=[...Array(20)].map((_,i)=>hc('hum_knight',G+i)).find(([,c])=>t.horseDeathOf(c).name==='side');
   const [w0,wc]=hc('orc_wolf',G),W=t.horseDeathOf(wc),k0=D.on;D.on=false;const off=key(t.mkc(2*G,2*G,g=>t.drawBody(g,wc,1,0)));D.on=k0;const on=key(t.mkc(2*G,2*G,g=>t.drawBody(g,wc,1,0)));
   ok(lies.has('side')&&lies.has('belly')&&t.horseDeathOf(side[1]).down===side[0].down&&W.horse&&W.down!==w0.down&&on!==off,'a horse killed under its rider lies on its side or its belly by where it lies, a wolf as a wolf; off, as before')}
  // ======== blood by kind (the owner, 2026-11-03: "make sure that not all monsters have red blood"): drawn only
  {const red=new Set(t.GORE.col),rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),bl=k=>t.deathOf(unit(k,1)).blood,
     pool=b=>{const d=data(t.poolSprite(9,1,b)),cs=new Set();for(let i=0;i<d.length;i+=4)if(d[i+3])cs.add('#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join(''));return cs},
     notRed=k=>{const b=bl(k);return b===null||[...pool(b)].every(c=>!red.has(c))};
   const men=['hero','hum_foot','hum_knight','orc_grunt','brann','wolf','bear','boar','wild_deer'].every(k=>{const b=bl(k);return b&&b.key==='red'&&[...pool(b)].every(c=>red.has(c))});
   const ich=['spider','scorpion'].every(k=>bl(k).col.every(c=>{const [r,g]=rgb(c);return g>r})),murk=bl('troll').col.every(c=>{const [r,g,b]=rgb(c);return g>=r&&g>=b}),
     fire=['wyrm','dragon'].every(k=>bl(k).fleck&&bl(k).key==='fire'),slime=[0,1,2].every(v=>{const b=t.deathOf({...unit('slime',1),v}).blood;const R=t.PX.ramp(t.PX._beastKit.KINDS.slime.coats[v]);return b.key==='slime'+v&&b.col.every(c=>R.includes(c))});
   const undead=t.bloodOf({...unit('militia',3),s:{undead:true}})===null&&t.bloodOf({...unit('militia',3),type:'skeleton'})===null;
   ok(['spider','scorpion','slime','troll','wyrm','dragon'].every(notRed)&&ich&&murk&&fire&&slime,'not every monster bleeds red: spiders and scorpions a green-yellow ichor, a slime a puddle of its own coat, a troll a murky green, a wyrm and a dragon a dark hot orange with embers');
   ok(men&&undead,'people, horses, wolves, bears, boars and the game bleed red; the undead and the made not at all (dust)');
   const c={x:G,y:G,team:1,face:1,sp:t.corpseOf(unit('spider',1)),td:0,dry:false,pool:9,seed:1,wi:0,wx:7,wy:2,skin:t.PPAL.wood[2]};t.DEATH_OF.set(c,unit('spider',1));
   const k0=D.on;D.on=false;const offRed=[...(()=>{const d=data(t.mkc(2*G,2*G,g=>t.drawBody(g,c,1,1)));const s=new Set();for(let i=0;i<d.length;i+=4)if(d[i+3])s.add(d[i]>d[i+1]+30?'r':'g');return s})()].includes('r');D.on=k0;
   ok(offRed,'DEATHS.on false: a spider bleeds red, as before')}
  // ======== no random draw: the picks, the sprites and every frame of the falls
  {let n=0;Math.random=()=>{n++;return random()};
   try{for(const [k,m] of ALL)for(const u of m.values()){t.deathOf(u);for(const q of [0,.3,.55,.8,1])draw(u,true,true,q)}}finally{Math.random=random}
   ok(!n,'every death picked, made and drawn through its fall with no random draw ('+n+')')}
  // ======== DEATHS.on false: the corpses as before, pixel for pixel
  {const diff=[];for(const k of kinds)for(const id of [1,2,3,5,8]){const u=unit(k,id);for(const q of [.4,1]){if(key(draw(u,false,true,q))!==key(draw(u,false,false,q)))diff.push(k)}if(D.on&&t.deathOf(u)===t.corpseOf(u))diff.push(k+' same')}
   const k0=D.on;D.on=false;const off=t.deathOf(unit('hum_foot',4))===t.corpseOf(unit('hum_foot',4));D.on=k0;
   ok(!diff.length&&off,'DEATHS.on false: every corpse drawn as before (corpseOf\'s), pixel for pixel'+(diff.length?': '+diff.slice(0,8).join(', '):''))}
  // ======== in a battle: the dice and the corpses' records the same, on and off; 150 dead cost no more a frame
  {const run=on=>{D.on=on;if(L.active)L.exit();L.start({leftGroups:[{type:'hum_foot',count:60},{type:'hum_knight',count:15}],rightGroups:[{type:'orc_grunt',count:60},{type:'wolf',count:15}],morale:false,deploy:false,paused:true,ai:false,seed:11});
    const B=t.B;Math.random=t.seeded(5);const dead=B.units.slice(0,150);for(const u of dead){u.hp=0;const cp={x:u.x,y:u.y,team:u.team,face:u.face,hero:u.hero,wait:true};B.corpses.push(cp);t.vfxDeath(u,cp)}
    const after=Math.random();Math.random=random;const rec=JSON.stringify(B.corpses.map(c=>({...c,sp:Object.keys(c.sp).join()})))+JSON.stringify(B.vfx.map(v=>({...v,corpse:null})));
    // (frames: falling, bleeding, then settled into the blood layer)
    const fr=[];B.gore=null;for(let i=0;i<40;i++){B.t+=.08;const t0=performance.now();t.drawCorpses();fr.push(performance.now()-t0)}
    const live=fr.slice(0,30).reduce((a,b)=>a+b,0)/30,settled=fr.slice(36).reduce((a,b)=>a+b,0)/4;return{after,rec,live,settled,baked:B.corpses.filter(c=>c.baked).length}};
   // (each way three times, in turn, after a run of each to make the sprites: the best of each)
   try{run(true);run(false);const R={on:[],off:[]};for(let i=0;i<3;i++){R.off.push(run(false));R.on.push(run(true))}
    const best=(rs,k)=>Math.min(...rs.map(r=>r[k])),[off,on]=[R.off[0],R.on[0]],ol=best(R.off,'live'),nl=best(R.on,'live'),os=best(R.off,'settled'),ns=best(R.on,'settled');
    ok(on.after===off.after&&on.rec===off.rec,'150 struck down with DEATHS on and off: the same dice after, the same corpses and effects (drawn only)');
    ok(on.baked===150&&off.baked===150,'all 150 settle into the blood layer');
    info('150 dead, drawCorpses a frame (best of 3): falling and bleeding '+nl.toFixed(2)+' ms (off '+ol.toFixed(2)+'), settled '+ns.toFixed(3)+' ms (off '+os.toFixed(3)+')');
    ok(nl<=ol*1.5+.5&&ns<=os*1.5+.2,'no cost a frame worth noting: '+nl.toFixed(2)+' ms against '+ol.toFixed(2)+' while they fall and bleed, '+ns.toFixed(3)+' against '+os.toFixed(3)+' settled')}
   finally{D.on=true;Math.random=random}}
  // ======== made ahead: each one's own death in the battle's warm-up
  {const B=t.B;t.warmBattle(B.units);let n=0;while((t.WARM.q.length||t.WARM.b.length)&&n++<4000)t.warmStep();
   const u=B.units.find(x=>x.type==='hum_knight'),m=t.DEATH_SPR.get(t.actorSprite(u,0,true)),V=m&&Object.values(m);
   ok(!t.WARM.q.length&&!t.WARM.b.length&&V&&V.some(r=>r===t.deathOf(u)),'each one\'s own death made ahead, after the battle\'s other sprites (WARM.b)')}
  // ---- his dying in frames (the owner, 2026-11-07: "a dying sequence"): he staggers, goes to his knees, then down into his death;
  // each its own picture, the kneel lower than he stood and on the ground; a two-handed grip's far hand on the shaft (hand2)
  {const low=c=>{const w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data;let lo=-1,hi=h;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]){lo=Math.max(lo,y);hi=Math.min(hi,y)}return[hi,lo]},px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.join();
   const bad=[];for(const [k,id] of [['hum_spear',1],['hum_sword',2],['dw_axe',3],['elf_archer',5],['hum_mage',4]]){const V=t.deathOf({type:k,id,team:0,v:0,s:t.ST[k]});if(!V.stagger||!V.kneel){bad.push(k+' none');continue}
     const [st0,st1]=low(V.stand),[k0,k1]=low(V.kneel);if(px(V.stagger)===px(V.stand)||k0<=st0||k1!==st1)bad.push(k+' '+[st0,st1,k0,k1])}
   ok(!bad.length&&t.DYING.stagger<t.DYING.kneel&&t.DYING.kneel<1,'a man dies in frames: he staggers, kneels lower on the ground, then falls into his death (DYING '+JSON.stringify(t.DYING)+')'+(bad.length?' — '+bad.join('; '):''));
   const g=t.unitSprite('hum_champ',0,false,0,t.GRIP_POSE,true);ok(g.hand&&g.hand2&&(g.hand[0]!==g.hand2[0]||g.hand[1]!==g.hand2[1]),'a great weapon gripped in both hands: his far hand on the shaft too ('+g.hand+' / '+g.hand2+')')}
  // ---- no navy outline on the dead (the owner, 2026-11-07: "the dead body still has an outer line, check all variants"): on no
  // picture of his dying or his death, his shield and helm by him, his fallen mount, nor the weapon flung from his hand, a navy pixel
  // on its silhouette's edge (a black horse's coat has the colour inside it, and on a leg a pixel thin, which the outline leaves as
  // drawn)
  {const rim=c=>{if(!c||!c.getContext)return 0;const w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data,A=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&d[(y*w+x)*4+3];let n=0;
     for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i+3]&&d[i]===0x1a&&d[i+1]===0x1c&&d[i+2]===0x26&&(!A(x-1,y)||!A(x+1,y)||!A(x,y-1)||!A(x,y+1))&&!(!A(x-1,y)&&!A(x+1,y)||!A(x,y-1)&&!A(x,y+1)))n++}return n},bad=new Set();let n=0;
   for(const k of Object.keys(t.ST)){if(t.ST[k].beast||t.ST[k].wildlife)continue;for(let id=0;id<12;id++){const V=t.deathOf({type:k,id,team:id%2,v:id%3,s:t.ST[k]});n++;
     for(const f of ['stand','stagger','kneel','body','mount','down'])if(rim(V[f]))bad.add(k+' '+f);for(const b of V.bits||[])if(rim(b[0]))bad.add(k+' bit');if(V.wk&&rim(t.weaponSprite(V.wk,V.team,'#f3bfad',3,undefined,t.DOLL_FIGS.on)))bad.add(k+' flung '+V.wk)}}
   ok(!bad.size,'no navy outline on any death ('+n+' men\'s): his dying, his body, his shield and helm, his fallen mount, his flung weapon'+(bad.size?' — '+[...bad].slice(0,8).join(', '):''))}
 }finally{D.on=true;Math.random=random;if(L.active)L.exit()}});
