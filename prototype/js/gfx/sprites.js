'use strict';
/* ---------- sprites ---------- */
const mkc=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;f(g);return c};
const rect=(g,col,x,y,w=1,h=1)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
const C={skin:'#e8c39e',dark:'#1a1410',steel:'#c9ced8',steel2:'#8e95a6',wood:'#8b5a2b',gold:'#e8b94a',hood:'#3d6b3a',team:['#3d74d6','#b8403a'],teamD:['#2a4f99','#7e2a26'],horse:'#7a4a26',horseD:'#573219'};
const spr={};
// sprite cells: every figure (people, troops, beasts, monsters, animals, carts) sits in the smallest power-of-two square it
// fits, 8, 16, 32 or 64 pixels, with its feet on the cell's bottom row and its middle on the cell's middle column; nothing is cut
// off. c.cw and c.ch keep the size of the figure itself (for health bars and labels above it).
const CELLS=[8,16,32,64];
function cellOf(src){const n=CELLS.find(s=>s>=src.width&&s>=src.height)||Math.max(src.width,src.height);
  const c=mkc(n,n,g=>g.drawImage(src,(n>>1)-(src.width>>1),n-src.height));c.cw=src.width;c.ch=src.fh||src.height;
  if(src.hand)c.hand=[(n>>1)-(src.width>>1)+src.hand[0],n-src.height+src.hand[1]];// (the hand, where it went)
  return c}
// pose: 0-1 idle (breathing), 2-5 walking (legs stride, body bobs), 15-18 running (a long stride, leaning, bouncing), then three blows of three frames each (wind up, strike,
// follow through): 6-8 a swing, 9-11 a thrust, 12-14 an overhead chop. A figure is 16x16 drawn into a 20x20 canvas (room for a
// raised or thrust weapon) inside a 1-pixel outline, feet on the bottom row; cached by type, team, variant and pose.
const ATK_BASE={swing:6,thrust:9,overhead:12};
// bare: in battle, a soldier's melee weapon is drawn apart (weapons.js); the sprite leaves it off
// (arm: a shooter in melee mode: his bow put away, his body bare for the sidearm drawn in his hand: weapons.js, sidearmLook)
function unitSprite(type,team,hero,v,pose,bare,arm){
  // a companion wears what you gave them: their weapon, armour and helm show (cg)
  const cg=COMPS[type]&&P.comps&&P.comps[type]&&P.comps[type].gear||null;
  // (a beast or a monster: its own figure (engine/beasts.js), one of three variants, its poses: beastSprite)
  if(ST[type]&&ST[type].beast)return beastSprite(type,team,v,pose);
  v=hero?0:(v||0)%6;pose=pose||0;const key=type+team+(hero?'h'+P.race+(P.gear.weapon||'')+(P.gear.body||'')+(P.gear.head||''):'')+(cg?'g'+(cg.weapon||'')+(cg.body||'')+(cg.head||''):'')+'v'+v+'p'+pose+(bare?'b':'')+(arm?'s':'');if(spr[key])return spr[key];
  // soldiers, your hero and companions: the template figures (people.js)
  const cid=COMPS[type]?type:'',L0=lookOf(type,team,hero,v,cid,cg),L=arm?{...L0,weapon:null}:L0;
  // (a bare body in a blow is the body standing: its weapon is drawn apart, so one sprite serves all nine blow frames)
  if(bare&&pose>=6&&pose<=14&&heldWeapon(L)){const k0=key.replace('p'+pose+'b','p0b');return spr[key]=spr[k0]||(spr[k0]=cellOf(peopleSprite(L,0,true)))}
  return spr[key]=cellOf(peopleSprite(L,pose,bare));
}
/* the fallen (vfx.js drawCorpses): a man flat where he fell, head the way he faced, turned a quarter pixel for pixel so he stays
   crisp; a rider thrown from his mount, which lies low beside him; a beast slumped where it stood. stand: him upright (his fall
   turns it about his feet), body: him lying, ax, ay: his feet in it; wk: the weapon he dropped; mount: his mount standing, down: lying */
const CORPSES=new WeakMap(),BEAST_FALL={troll:'over',spider:'back',scorpion:'back',slime:'melt'};
/* the beasts and monsters (engine/beasts.js PX.beast): the people's style, side-on, in a power-of-two cell (the dragon 64, a troll
   or a wyrm 32, a slime 16, the rest 32), feet on its bottom row; three variants; the poses as the people's (BEAST_POSES: 0-1
   standing, 2-5 walking, 15-18 running, 6-8 the attack, 9-11 the dragon's breath) and lying dead (PX.BEAST_DEAD). One of yours
   (team 0) wears the side's blue; a wild one nothing. Cached by kind, side, variant and pose (the climbs walk, the other blows
   strike) */
const BEAST_POSES=PX.BEAST_POSES;
const beastPoseOf=(type,p)=>p===PX.BEAST_DEAD?p:p>=19?2+(p-19)%4:p>=12&&p<=14?p-6:p>=9&&p<=11&&type!=='dragon'?p-3:p;
function beastSprite(type,team,v,pose){v=(v||0)%3;pose=beastPoseOf(type,pose||0);const k='bst'+type+(team?1:0)+v+'p'+pose;
  return spr[k]||(spr[k]=cellOf(PX.beast(type,{v,pose,team:team?1:0})))}
// a beast's pose now: striking (or breathing fire, winding up a spit), running or walking as it moves, leaping (a pounce), breathing
function beastPose(u,moved){
  if(u.s.breath&&u.br!=null&&u.br>3.5-ATK_ANIM*1.5)return 9+Math.min(2,Math.floor((3.5-u.br)/(ATK_ANIM*1.5)*3));
  if(u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)return 6+Math.min(2,Math.floor((B.t-u.atkAt)/ATK_ANIM*3));
  if(u.shot)return 6;
  if((u.z||0)>1)return 16;
  if(moved)return u.spdNow>u.s.spd*.75?15+Math.floor(B.t*12+(u.v||0))%4:2+Math.floor(B.t*8+(u.v||0))%4;
  return (B.t*.8+((u.id||0)*.37)%1)%1<.45?1:0}
// a monster on the world map: the dragon on the wing (its own small figure in a 32 cell, wings up, then level); the rest walking, f 0-3
function monsterMapSprite(id,f){const M=MONSTERS[id],k='mm'+M.unit+(f||0);if(spr[k])return spr[k];
  return spr[k]=M.mythic?cellOf(PX.beastMap(M.unit,f||0)):unitSprite(M.unit,1,false,0,2+((f||0)%4))}
function corpseOf(u){
  const base=unitSprite(u.type,u.team,u.hero,u.v,0,true);let c=CORPSES.get(base);if(c)return c;
  // (a beast: it sinks as it falls (a troll over as a man does, a spider or a scorpion onto its back, a slime running flat, the rest
  // pressed low), then lies in its dead pose, down: engine/beasts.js)
  if(ST[u.type]&&ST[u.type].beast)c={beast:base,down:unitSprite(u.type,u.team,false,u.v,PX.BEAST_DEAD),how:BEAST_FALL[u.type]||'side'};
  else{const L=unitLook(u),wk=heldWeapon(L),g=pgrid(24,20);drawFigure(g,{...L,mount:null,weapon:wk?null:L.weapon},4,3,-1,null,-1);const lie=pturn(g);poutline(g);poutline(lie);
    c={stand:pcanvas(g),body:pcanvas(lie),ax:2,ay:12,wk,team:L.team};
    if(L.mount){const m=pgrid(32,32),d=pgrid(32,22);drawMount(m,L,-1);drawMountDown(d,L);poutline(m);poutline(d);c.mount=pcanvas(m);c.down=pcanvas(d)}}
  CORPSES.set(base,c);return c}
// which pose a fighter shows now: striking just after an attack, striding while moving, breathing while still
/* the sprites a battle will need, made a little each frame before they are first shown (WARM.budget ms a frame, during the
   deployment and the opening): every body of every kind, side and look on the field, standing, breathing, walking and
   running, and their weapons at every angle. A pose first drawn mid-fight would otherwise cost a hitch */
// (the beasts' poses in a queue of their own, b, made after the rest)
const WARM={q:[],b:[],budget:4};
function warmBattle(units){
  WARM.q=[];WARM.b=[];const seen=new Set(),late=[];
  for(const u of units){if(ST[u.type]&&ST[u.type].beast){const k=u.type+'|'+(u.team?1:0)+'|'+(u.v||0)%3;if(!seen.has(k)){seen.add(k);for(const p of [...BEAST_POSES,PX.BEAST_DEAD])WARM.b.push(()=>unitSprite(u.type,u.team,false,u.v,p))}continue}const v=u.hero?0:(u.v||0)%6,k=u.type+'|'+u.team+'|'+(u.hero?1:0)+'|'+v;if(seen.has(k))continue;seen.add(k);
    for(const p of [0,1,2,3,4,5,15,16,17,18])WARM.q.push(()=>unitSprite(u.type,u.team,u.hero,u.v,p,true));
    const L=unitLook(u),w=heldWeapon(L);
    if(w){const sk=pal(L.skin)[1],kw=w+L.team+sk;if(!seen.has(kw)){seen.add(kw);for(let i=0;i<WEAPON_STEPS;i++)WARM.q.push(()=>weaponSprite(w,L.team,sk,i))}}
    else for(let p=6;p<=14;p++)WARM.q.push(()=>unitSprite(u.type,u.team,u.hero,u.v,p,true));
    // (and last, how he lies when he falls, and the weapon he drops: vfx.js drawCorpses)
    late.push(()=>corpseOf(u));if(u.s.range&&!u.s.magic){for(const p of [0,2,3,4,5,6,7,8])late.push(()=>unitSprite(u.type,u.team,u.hero,u.v,p,true,true));const sk=pal(L.skin)[1],kw='sword'+L.team+sk;if(!seen.has(kw)){seen.add(kw);for(let i=0;i<WEAPON_STEPS;i++)late.push(()=>weaponSprite('sword',L.team,sk,i))}}if(w)for(const i of [0,1,WEAPON_STEPS-1,WEAPON_STEPS/2,WEAPON_STEPS/2+1])late.push(()=>weaponSprite(w,L.team,PPAL.wood[2],i))}
  WARM.q.push(...late)}
function warmStep(){const t0=performance.now();while((WARM.q.length||WARM.b.length)&&performance.now()-t0<WARM.budget)(WARM.q.length?WARM.q:WARM.b).shift()()}
// a soldier's look (what unitSprite draws him from), for the weapon in his hand
// a shooter's sidearm: a short sword, on the weapon layer
const sidearmLook=u=>u.side||(u.side={...unitLook(u),weapon:'sword'});
function unitLook(u){if(u.look)return u.look;const cg=COMPS[u.type]&&P.comps&&P.comps[u.type]&&P.comps[u.type].gear||null;return u.look=lookOf(u.type,u.team,u.hero,u.hero?0:(u.v||0)%6,COMPS[u.type]?u.type:'',cg)}
function procPose(u,moved){
  // (a shooter: drawing, three steps to full; just loosed; reloading)
  if(u.shot)return ATK_BASE.thrust+Math.min(2,Math.floor(u.shot.t/u.shot.aim*3));
  if(u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)return (ATK_BASE[u.atkStyle]||6)+Math.min(2,Math.floor((B.t-u.atkAt)/ATK_ANIM*3));
  if(u.s.range&&!u.inMelee&&u.cd>0&&u.atkAt!=null&&!moved)return ATK_BASE.overhead+Math.floor((B.t-u.atkAt)*5)%3;
  // (running: the run, faster; walking: the walk)
  if(moved)return u.spdNow>u.s.spd*.75?15+Math.floor(B.t*14+(u.v||0))%4:2+Math.floor(B.t*9+(u.v||0))%4;
  // (standing: breathing, slow, each on his own rhythm)
  return (B.t*.8+((u.id||0)*.37)%1)%1<.45?1:0;
}
// a banner bearer on the map (people.js): the party's leader in the banner's colour, on foot or riding a mount of colour mc; f the step
function partySprite(col,mc,f){f=f||0;const k='p'+col+(mc||'')+f;if(spr[k])return spr[k];
  const you=col==='#e8b94a',R=RACE_LOOK[you?P.race:'human']||RACE_LOOK.human;
  return spr[k]=mapFigure({race:you?P.race:'human',skin:R.skin[0],hair:R.hair[you?0:2],eye:R.eye,ears:R.ears,tusk:R.tusk,short:R.short,beard:R.beard?R.hair[0]:null,
    helm:you?'crown':'kettle',outer:'steel',inner:'dark',team:col,shortHair:true},f,mc||null)}
// a bandit on the map: hooded, a spear
function banditSprite(f){f=f||0;const k='bd'+f;return spr[k]||(spr[k]=mapFigure({race:'human',skin:'skinTan',hair:'black',helm:'hood',hood:'leather',outer:'leather',inner:'dark',team:'#8a3a2a',weapon:'spear',shortHair:true},f,null))}
/* pre-rendered world map: ground colors per climate, then terrain on top */
const PAL={
  grass:{g:['#4f7a3a','#4c7738'],s:['#5d8c44','#3f6a30'],road:['#b89b62','#d0b880','#9a7f4c'],tree:['#2a5a2a','#2f6a30','#3f8a3e'],hill:['#7a6e46','#9a8c5c','#a89a68','#c4b684'],mini:['#4f7a3a','#2f5a2c','#8a7a52','#3b6ca8','#b89b62','#8e95a6']},
  frost:{g:['#d9e1ea','#d2dbe6'],s:['#eef3f8','#b8c4d2'],road:['#b8b2a6','#cfc9bd','#9a9488'],tree:['#2a4a3a','#e8eef4','#3a5a48'],hill:['#9aa6b4','#b8c4d2','#cfd8e2','#eef3f8'],mini:['#d9e1ea','#3a5a48','#9aa6b4','#7fa6c8','#b8b2a6','#eef3f8']},
  desert:{g:['#d8b86a','#d2b064'],s:['#e6c87e','#b8944c'],road:['#c9a868','#dcc084','#a8884c'],tree:['#5a8a3a','#6a9a44','#7aaa50'],hill:['#9a5a32','#b5733e','#c8885a','#dca070'],mini:['#d8b86a','#7a9a44','#b5733e','#4a8ab8','#c9a868','#9a6a4a']},
  swamp:{g:['#4a5a34','#465630'],s:['#5a6a3a','#3a4a2a'],road:['#7a6a48','#8a7a58','#5a4a34'],tree:['#2a3a24','#3a4a2a','#5a4a34'],hill:['#5a5a3a','#6a6a46','#7a7a52','#8a8a5c'],mini:['#4a5a34','#2a3a24','#6a6a46','#3d5a4a','#7a6a48','#8e95a6']}
};
// the painted map is kept by chunks (worldart.js WorldArt); worldCv() is the whole of it as one canvas, painted on first use (when
// every script and every estate plot is ready), for the blit until render.js draws by chunks, for the wiki and the tests
const worldCv=()=>WorldArt.whole();
// the minimap from the tile data (WorldArt.mini, drawn by render.js): made now, from the map as the scripts leave it (as it
// always was: the roads lots.js leads to the gates come after it), and again when next shown after WorldArt.invalidate()
WorldArt.mini();
/* battle arenas: one per climate, built when first needed */
const ARENAS={};
// (by climate and field size: only the field size in use kept, a huge field's ground being large)
function arenaFor(c){const s='|'+BW+'x'+BH,k=c+s;if(!ARENAS[k]){for(const q of Object.keys(ARENAS))if(!q.endsWith(s))delete ARENAS[q];ARENAS[k]=paintArena(c)}return ARENAS[k]}
/* the obstacles of a field without terrain (B.obs: setup.js placeObstacles) in the ground's style (engine/ground.js
   PX.battleObstacle: a tree of the climate's, a boulder of its rock, a cactus), each its look by where it stands (a hash, never
   Math.random); drawing only: where they stand and what they block (r) are the battle's. obstacleGround: their shadows, roots and
   scree, under everyone, once a frame (render.js, before the depth-sorted list), and each one covering one of your men behind it
   fading to PROPFADE.a, as a terrain prop does (OBFADE, by obstacle); drawObstacle: one standing, in the depth order */
const obstacleLook=o=>PX.battleObstacle(o.kind,B.env.c,Math.floor(PX.hash(o.x,o.y,71)*6));
const OBFADE=new WeakMap();let OBT=0;
function obstacleGround(){
  const L=B.obs;if(!L||!L.length)return;const c=B.cam,z=c?c.z:1,vx=c?c.x:0,vy=c?c.y:0,x0=vx-ENT_PAD.x,x1=vx+BVW/z+ENT_PAD.x,y0=vy-ENT_PAD.up,y1=vy+BVH/z+ENT_PAD.down;
  const now=performance.now(),st=OBT?Math.min(.1,(now-OBT)/1000)*PROPFADE.rate:1;OBT=now;let men=null;
  for(const o of L){if(o.x<x0||o.x>x1||o.y<y0||o.y>y1)continue;const k=obstacleLook(o),b=k.box,bx=o.x-k.ax,by=o.y-k.ay;ctx.drawImage(k.g,Math.round(o.x)-k.gx,Math.round(o.y)-k.gy);
    if(!men)men=B.units.filter(u=>u.hp>0&&u.team===0);let cov=false;
    for(const u of men){const s=u.s.big?2:1;if(u.y<o.y&&u.x+5*s>=bx+b[0]&&u.x-5*s<=bx+b[2]&&u.y-1>=by+b[1]&&u.y-15*s<=by+b[3]){cov=true;break}}
    const to=cov?PROPFADE.a:1,a=OBFADE.has(o)?OBFADE.get(o):1;OBFADE.set(o,a<to?Math.min(to,a+st):Math.max(to,a-st))}}
function drawObstacle(o){const k=obstacleLook(o),a=OBFADE.has(o)?OBFADE.get(o):1;if(a<1)ctx.globalAlpha=a;ctx.drawImage(k.s,Math.round(o.x)-k.ax,Math.round(o.y)-k.ay);if(a<1)ctx.globalAlpha=1}
/* inventory icons: 16x16, one shape per icon kind, tinted by the item's color */
const shade=(hex,f)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(hex.slice(i,i+2),16)*f))).toString(16).padStart(2,'0')).join('');
function itemIcon(def){const k='ic'+def.icon+def.col;return spr[k]||(spr[k]=mkc(16,16,g=>{
  const r=(c,x,y,w,h)=>rect(g,c,x,y,w||1,h||1),c=def.col,dk=shade(c,.65),lt=shade(c,1.25),diag=(x0,y0,n,col,w)=>{for(let i=0;i<n;i++)r(col,x0+i,y0-i,w||1,w||1)};
  switch(def.icon){
    case 'dagger':diag(5,11,7,'#c9ced8',2);diag(6,10,6,'#eef3f8');r(c,3,10,4,1);r(c,6,13,1,1);r(C.wood,2,12,3,3);r(c,1,14,2,2);break;
    case 'bow':for(let i=0;i<13;i++){const x=4+Math.round(Math.sin(i/12*Math.PI)*6);r(c,x,1+i,2,1)}r('#e8e4d0',4,1,1,13);r(dk,3,1,2,1);r(dk,3,13,2,1);break;
    case 'shield':r(c,3,2,10,9);r(c,4,11,8,2);r(c,6,13,4,2);r(lt,4,3,4,4);r(dk,3,2,10,1);r(dk,7,3,2,11);r('#c8a24a',7,6,2,2);break;
    case 'tome':r('#6a3a2a',3,2,10,12);r(c,4,3,8,10);r(lt,5,4,3,2);r('#e8e4d0',12,3,1,10);r('#c8a24a',7,7,2,2);r(dk,3,13,10,1);break;
    case 'torch':diag(4,14,8,C.wood,2);r('#ff7a30',10,1,4,5);r('#ffd24a',11,2,2,3);r('#fff2a0',11,3,1,1);r(c,9,5,3,2);break;
    case 'stone':r(c,2,6,6,4);r(c,8,7,6,5);r(c,4,10,7,4);r(lt,2,6,6,1);r(lt,8,7,6,1);r(dk,4,13,7,1);r(dk,13,8,1,4);break;
    case 'wool':r(c,3,5,10,7);r(c,2,7,12,4);r(lt,4,5,4,2);r(dk,3,11,10,1);r(dk,9,8,2,2);r(dk,5,9,1,1);break;
    case 'tools':diag(3,13,9,C.wood,1);r(c,9,2,5,3);r(lt,9,2,5,1);r(C.wood,12,6,1,8);r(c,10,13,5,2);r(dk,10,14,5,1);break;
    case 'barrel':r('#6a4a2a',4,2,8,12);r(c,3,4,10,8);r(lt,5,4,2,8);r('#3a2a1a',3,5,10,1);r('#3a2a1a',3,10,10,1);r('#e8e4d0',6,2,4,1);break;
    case 'arrows':for(let k=0;k<3;k++){const x=4+k*3;r(C.wood,x,3,1,10);r('#c9ced8',x-1,1,3,2);r(c,x-1,12,1,2);r(c,x+1,12,1,2)}r(dk,2,9,11,2);break;
    case 'bolts':for(let k=0;k<3;k++){const x=4+k*3;r('#6a4a2a',x,4,1,8);r(c,x-1,2,3,2);r(lt,x,2,1,1);r('#8a6a4a',x-1,11,3,2)}r(dk,2,8,11,2);break;
    case 'axe':diag(2,15,12,C.wood);r(c,9,1,5,6);r(lt,10,1,3,2);r(dk,9,6,5,1);r(c,7,3,2,2);break;
    case 'crossbow':diag(3,14,10,C.wood,2);r(c,2,3,12,2);r(lt,2,3,12,1);r('#e8e4d0',3,5,1,4);r('#e8e4d0',12,5,1,4);r(dk,7,1,2,3);break;
    case 'wand':diag(4,14,9,'#6a4a2a');r(c,11,2,3,3);r('#ffffff',12,3,1,1);r(lt,10,1,1,1);r(lt,14,5,1,1);r(lt,14,1,1,1);break;
    case 'staff':diag(2,15,12,C.wood);r(c,11,1,4,4);r(lt,12,1,2,2);r('#9ad0ff',12,2,2,2);r(dk,10,4,2,1);break;
    case 'blade':diag(4,12,10,'#c9ced8',2);r('#eef3f8',13,2,1,1);r(c,3,11,3,3);r(dk,2,13,2,2);r(c,6,7,1,3);r(c,9,4,1,3);break;
    case 'club':diag(2,14,8,C.wood,2);r(c,8,3,6,6);r(lt,9,3,3,2);r('#e8e4d0',13,4,2,1);r('#e8e4d0',10,2,1,2);r(dk,8,8,5,1);break;
    case 'spear':diag(1,15,13,C.wood);r(c,12,1,3,3);r(lt,13,1,2,1);r('#e8e4d0',14,0,2,1);r(dk,11,4,2,1);break;
    case 'coat':r(c,4,3,8,11);r(c,2,4,2,8);r(c,12,4,2,8);r(dk,7,3,2,11);r(lt,4,3,3,1);r(lt,9,3,3,1);r(dk,4,13,8,1);break;
    case 'vest':r(c,4,3,8,10);r(dk,7,4,2,9);r(lt,5,3,2,2);r(lt,9,3,2,2);r(shade(c,.85),4,12,8,1);break;
    case 'plate':r(c,3,3,10,10);for(let i=0;i<3;i++)r(dk,3,5+i*3,10,1);r(lt,4,3,8,1);r(dk,7,3,2,10);r(c,2,3,1,4);r(c,13,3,1,4);break;
    case 'charm':r('#8a7a52',5,1,6,1);r('#8a7a52',4,2,1,4);r('#8a7a52',11,2,1,4);r('#c8a24a',5,6,6,6);r('#e8c86a',6,6,4,1);r(c,6,7,4,4);r(lt,6,7,2,2);r(shade('#c8a24a',.7),5,11,6,1);break;
    case 'pelt':r(c,3,4,10,8);r(c,2,3,3,2);r(c,11,3,3,2);r(c,2,11,3,2);r(c,11,11,3,2);r(dk,6,6,2,2);r(dk,9,8,2,2);r(lt,4,5,2,1);break;
    case 'tusk':r(c,3,12,3,2);r(c,5,10,3,2);r(c,7,7,3,3);r(c,9,4,3,3);r(c,11,2,2,2);r(shade(c,.75),3,13,6,1);r(shade(c,.75),8,9,2,1);break;
    case 'silk':r(c,4,4,8,8);r(c,3,5,10,6);r(c,5,3,6,10);r(dk,4,6,8,1);r(dk,4,9,8,1);r(dk,7,4,1,8);r(c,12,11,3,1);break;
    case 'vial':r('#c9ced8',6,1,4,2);r(C.wood,7,0,2,1);r('#c9ced8',5,3,6,1);r(c,4,4,8,9);r(lt,5,5,2,4);r(dk,4,12,8,1);r('#eef3f8',4,4,1,8);break;
    case 'scale':r(c,4,2,8,9);r(c,5,11,6,2);r(c,7,13,2,1);r(lt,5,3,3,3);r(dk,6,8,4,1);r(dk,7,10,2,1);break;
    case 'feather':diag(3,13,10,dk);r(c,5,6,4,6);r(c,7,3,4,5);r(c,10,2,3,3);r(lt,6,7,2,3);r(lt,8,4,2,2);break;
    case 'helm':r(c,3,4,10,8);r(c,4,2,8,2);r(lt,5,2,4,1);r(dk,3,11,10,1);r('#1a1410',5,7,6,2);r(dk,7,9,2,3);r(lt,4,4,2,3);break;
    case 'greaves':r(c,3,2,4,12);r(c,9,2,4,12);r(dk,3,7,4,1);r(dk,9,7,4,1);r(lt,4,2,2,4);r(lt,10,2,2,4);r(dk,2,13,5,2);r(dk,9,13,5,2);break;
    case 'gloves':r(c,2,6,5,7);r(c,9,6,5,7);r(c,2,3,1,4);r(c,4,2,1,4);r(c,6,3,1,4);r(c,9,3,1,4);r(c,11,2,1,4);r(c,13,3,1,4);r(dk,2,11,5,2);r(dk,9,11,5,2);r(lt,3,7,2,2);break;
    case 'boots':r(c,3,3,4,9);r(c,9,3,4,9);r(c,1,10,6,4);r(c,9,10,6,4);r(dk,1,13,6,1);r(dk,9,13,6,1);r(lt,4,3,2,4);r(lt,10,3,2,4);break;
    case 'mask':r(c,2,4,12,8);r(c,4,12,8,2);r('#1a1410',4,6,3,2);r('#1a1410',9,6,3,2);r(dk,7,8,2,3);r(lt,3,4,10,1);break;
    case 'earring':r('#c8a24a',7,1,2,4);r('#c8a24a',6,4,1,1);r('#c8a24a',9,4,1,1);r(c,5,6,6,6);r(lt,6,7,2,2);r(dk,5,11,6,1);r(c,7,12,2,3);break;
    case 'ring':r(c,4,6,8,2);r(c,4,12,8,2);r(c,3,7,2,6);r(c,11,7,2,6);r(lt,5,6,3,1);r('#e0605a',6,3,4,3);r('#ffb0a8',6,3,2,1);break;
    case 'cloak':r(c,4,2,8,3);r(c,3,5,10,8);r(c,2,12,12,3);r(dk,7,5,2,10);r(lt,4,2,3,2);r('#c8a24a',7,3,2,2);break;
    case 'pack':r(c,3,4,10,10);r(dk,3,8,10,1);r(c,5,2,6,2);r(lt,4,4,3,3);r('#c8a24a',7,9,2,2);r(dk,3,13,10,1);break;
    case 'sack':r(c,4,5,8,9);r(c,3,7,10,6);r(dk,6,2,4,3);r('#6a4a2a',5,4,6,1);r(lt,5,6,2,5);r(dk,3,13,10,1);r(lt,10,3,2,1);break;
    case 'ingot':r(c,4,4,8,4);r(lt,5,3,6,1);r(dk,4,7,8,1);r(c,2,9,12,4);r(lt,3,8,10,1);r(dk,2,12,12,1);r(lt,3,10,3,1);break;
    case 'bolt':r(c,2,4,11,8);r(lt,2,4,11,1);r(dk,2,7,11,1);r(dk,2,10,11,1);r(shade(c,1.4),12,4,3,8);r(dk,13,7,1,2);r(c,1,11,4,3);break;
    case 'logs':for(const y of [3,7,11]){r(c,1,y,12,3);r(dk,1,y+2,12,1);r('#d8b070',12,y,3,3);r('#a07a4a',13,y+1,1,1)}break;
    case 'gem':r(dk,5,4,6,1);r(c,4,5,8,3);r(lt,5,5,2,1);r(c,5,8,6,2);r(dk,6,10,4,2);r(dk,7,12,2,1);r('#ffffff',6,6,1,1);break;
    case 'pearl':r('#c8a878',2,9,12,4);r('#a8885a',3,12,10,1);r(c,5,5,6,5);r(lt,6,5,3,2);r(dk,5,9,6,1);r('#ffffff',6,6,1,1);break;
    case 'jar':r(c,4,5,8,9);r(c,5,3,6,2);r('#6a4a2a',5,2,6,1);r(lt,5,6,2,5);r(dk,4,13,8,1);r('#e8c040',6,9,4,2);break;
    case 'meat':r(c,3,3,8,7);r(c,2,5,10,4);r(lt,4,4,3,2);r(dk,3,9,8,1);r('#e8e4d0',10,9,2,2);r('#e8e4d0',11,11,3,2);r('#e8e4d0',13,10,2,1);break;
    case 'fish':r(c,3,6,9,4);r(c,4,5,7,1);r(c,4,10,7,1);r(dk,12,5,3,6);r(lt,4,6,4,1);r('#1a1410',5,7,1,1);r(dk,3,9,8,1);break;
    case 'jug':r('#8a6a4a',5,1,6,2);r('#c8b8a0',4,3,8,10);r(c,5,4,6,4);r(lt,5,4,2,8);r('#c8b8a0',12,5,2,5);r(shade('#c8b8a0',.7),4,12,8,1);break;
    case 'cheese':r(c,2,6,12,7);r(c,4,4,8,2);r(c,7,3,4,1);r(lt,3,6,10,1);r(dk,2,12,12,1);r(dk,5,8,2,2);r(dk,10,9,2,2);r(dk,8,11,1,1);break;
    case 'fruit':r(c,2,6,6,6);r(c,8,7,6,6);r(lt,3,7,2,2);r(lt,9,8,2,2);r(dk,2,11,6,1);r(dk,8,12,6,1);r('#5a3a20',5,4,1,2);r('#3f8a3e',6,3,2,1);r('#5a3a20',11,5,1,2);break;
    case 'mount':r(c,8,6,4,8);r(c,5,3,6,4);r(c,2,5,5,4);r(c,9,1,2,2);r(dk,11,3,2,10);r(dk,12,13,1,2);r('#1a1410',6,4,1,1);r(dk,2,8,1,1);r('#c8a24a',4,6,5,1);r(lt,6,3,3,1);r(dk,2,9,4,1);break;
    case 'belt':r(c,1,6,14,4);r(dk,1,9,14,1);r('#c8a24a',6,5,4,6);r(c,7,6,2,4);r(lt,2,6,4,1);r(lt,11,6,3,1);break;
  }
}))}
/* ---------- text on canvas ---------- */
// while TXTQ is an array (the world's things being drawn), labels are queued and drawn after all of them, on top
let TXTQ=null;
function txt(s,x,y,col,al){if(TXTQ&&ctx===TXTQ.ctx){TXTQ.push([s,x,y,col,al]);return}ctx.font='8px Silkscreen, "Courier New", monospace';ctx.textAlign=al||'left';ctx.textBaseline='alphabetic';ctx.fillStyle='#000';ctx.fillText(s,x+1,y+1);ctx.fillStyle=col||'#e4e0cf';ctx.fillText(s,x,y)}

/* how big a host looks: followers trail the banner, more of them the bigger the band */
/* how big a host looks: followers trail the banner, more of them the bigger the band */
const hostSize=n=>n<5?0:Math.min(14,Math.round(Math.sqrt(n)*1.7)-2);
// (a follower on the map: people.js followerSprite)
