'use strict';
/* ---------- sprites ---------- */
const mkc=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d', { willReadFrequently: true });g.imageSmoothingEnabled=false;f(g);return c};
const rect=(g,col,x,y,w=1,h=1)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
const C={skin:'#e8c39e',dark:'#1a1410',steel:'#c9ced8',steel2:'#8e95a6',wood:'#8b5a2b',gold:'#e8b94a',hood:'#3d6b3a',team:['#3d74d6','#b8403a'],teamD:['#2a4f99','#7e2a26'],horse:'#7a4a26',horseD:'#573219'};
const spr={};
// sprite cells: every figure (people, troops, beasts, monsters, animals, carts) sits in the smallest power-of-two square it
// fits, 8, 16, 32 or 64 pixels, with its feet on the cell's bottom row and its middle on the cell's middle column; nothing is cut
// off. c.cw and c.ch keep the size of the figure itself (for health bars and labels above it).
const CELLS=[8,16,32,64];
function cellOf(src){const n=CELLS.find(s=>s>=src.width&&s>=src.height)||Math.max(src.width,src.height);
  const c=mkc(n,n,g=>g.drawImage(src,(n>>1)-(src.width>>1),n-src.height));c.cw=src.width;c.ch=src.fh||src.height;
  for(const k of FIG_ANCHORS)if(src[k])c[k]=[(n>>1)-(src.width>>1)+src[k][0],n-src.height+src[k][1]];// (the hands and back, where they went)
  c.rig=src.rig;
  return c}
// pose: 0-1 idle (breathing), 2-5 walking (legs stride, body bobs), 15-18 running (a long stride, leaning, bouncing), then three blows of three frames each (wind up, strike,
// follow through): 6-8 a swing, 9-11 a thrust, 12-14 an overhead chop; 27 his shield raised to meet a blow (DEF_POSE, battle/defence.js), 28 held low (DEF_LOW, a low cut or a thrust: battle/duel.js). A figure is 16x16 drawn into a 20x20 canvas (room for a
// raised or thrust weapon) inside a 1-pixel outline, feet on the bottom row; cached by type, team, variant and pose.
// 29-40 bare hands (combat.js FISTS), three frames each: a jab, a cross (hook), a kick, a grapple (FIST_STYLES from FIST_POSE)
const ATK_BASE={swing:6,thrust:9,overhead:12,jab:29,hook:32,kick:35,grapple:38},DEF_POSE=27,DEF_LOW=28,FIST_POSE=29,FIST_STYLES=['jab','hook','kick','grapple'];
// 41 struck (a flinch), 42 a glance back, 43 the weight shifted (render.js picks them: drawn only)
// 44 braced, both hands on his pole levelled before him (a pike, a spear with no shield); 45 both hands on a great weapon in guard
// (the owner, 2026-11-06: "bracing spear will adjust their pose to grip a spear and hold the shield to the front"; a shield-bearer
// braces behind it: DEF_POSE)
const FLINCH_POSE=41,LOOK_POSE=42,SHIFT_POSE=43,BRACE_POSE=44,GRIP_POSE=45,LIFE_POSES={41:'flinch',42:'look',43:'shift',44:'brace',45:'grip'};
// bare: in battle, a soldier's melee weapon is drawn apart (weapons.js); the sprite leaves it off, the body and the rest of its
// gear kept by pose in spr (figures.js); else the finished figure, its weapon on it, kept in FIGURES (an LRU: the map, the cards)
// (arm: a shooter in melee mode: his bow put away, slung on his back (figures.js SlungBow), his body bare for the sidearm drawn in
// his hand: weapons.js, sidearmLook)
// (afoot: a rider off his horse, on his own feet, his lance in his hand: battle/dismount.js)
// (your hero's and a companion's key: their gear's, but a melee weapon's when it is held apart: one body for every sword)
// (a figure's look, as unitSprite draws it: its kind's, a companion's gear on him, his side's cloth, tint (a world army's colour)
// over it; the map's marchers' weapons drawn apart read it: weapons.js mapHeld)
// (what the weather asks of his dress: cold, in the frost (people.js winterLook); set by whoever draws him there, about the call:
// a battle by its ground, a march by where it is)
const DRESS={cold:false},coldAt=(x,y)=>WINTER.on&&typeof climAt==='function'&&climAt(x,y)==='frost';
function dressed(cold,f){const k=DRESS.cold;DRESS.cold=!!cold;try{return f()}finally{DRESS.cold=k}}
function spriteLook(type,team,hero,v,tint){const cg=COMPS[type]&&P.comps&&P.comps[type]&&P.comps[type].gear||null,L0=allyLook(lookOf(type,team===2?0:team,hero,hero?0:(v||0)%6,COMPS[type]?type:'',cg),team);const L1=DRESS.cold?winterLook(L0,v):L0;return tint?{...L1,team:tint}:L1}
function unitSprite(type,team,hero,v,pose,bare,arm,tint,afoot){
  // a companion wears what you gave them: their weapon, armour and helm show (cg)
  const cg=COMPS[type]&&P.comps&&P.comps[type]&&P.comps[type].gear||null;
  // (a beast or a monster: its own figure (engine/beasts.js), one of three variants, its poses: beastSprite)
  // (wildlife hunted: the map's own animal; with the paper dolls at its real size beside them (the owner, 2026-11-06: "fit with the
  //  current sprites scale"), drawn with no outline, its own edge darkened, as theirs (critters.js CRITTER_EDGE); else doubled)
  if(ST[type]?.wildlife){const id=ST[type].wildlife,f=pose>=2?pose%PX.MAP_STEPS:0,key='hunt:'+id+':'+f;if(spr[key])return spr[key];const s=critterSprite(id,f);
    if(DOLL_FIGS.on&&DOLL_FIGS.edge)return spr[key]=s;
    const c=mkc(s.width*2,s.height*2,g=>g.drawImage(s,0,0,s.width*2,s.height*2));c.cw=s.cw*2;c.ch=s.ch*2;return spr[key]=c;}
  if(ST[type]&&ST[type].beast)return beastSprite(type,team===2?0:team,v,pose);
  v=hero?0:(v||0)%6;pose=pose||0;const wk=(w,melee)=>bare&&melee?'m':w||'',key=type+team+(typeof Faces!=='undefined'?Faces.lookKey(hero,type):'')+(hero?'h'+P.race+wk(P.gear.weapon,heroKind()==='melee'&&!unarmed())+(P.gear.body||'')+(P.gear.head||'')+(P.gear.offhand||''):'')+(cg?'g'+wk(cg.weapon,cg.weapon&&(ITEMS[cg.weapon].kind||'melee')==='melee')+(cg.body||'')+(cg.head||'')+(cg.offhand||''):'')+'v'+v+'p'+pose+(bare==='bow'?'B':bare?'b':'')+(arm?'s':'')+(afoot?'f':'')+(tint?'c'+tint:'')+(DRESS.cold?'w':'');
  {const c=bare?spr[key]:FIGURES.get(key);if(c)return c}
  // soldiers, your hero and companions: the template figures (people.js)
  const L0=spriteLook(type,team,hero,v,tint),L={...L0,...(arm?{weapon:null,slung:WPN[L0.weapon]?null:L0.weapon}:{}),...(afoot?{mount:null}:{})};
  // (a rider's bare body in a blow is the body standing: its weapon is drawn apart, so one sprite serves all nine blow frames; on
  // foot, each frame his own: people.js BLOW_RIG)
  if(bare&&pose>=6&&pose<=14&&heldWeapon(L)&&L.mount){const k0=key.replace('p'+pose+'b','p0b');return spr[key]=spr[k0]||(spr[k0]=cellOf(peopleSprite(L,0,true)))}
  const c=cellOf(peopleSprite(L,pose,bare));return bare?spr[key]=c:FIGURES.set(key,c);
}
// World combat retains the army's cloth and each marcher's appearance instead of repainting by battle side.
const actorSprite=(u,pose,bare,arm)=>dressed(typeof B!=='undefined'&&B&&B.env&&B.env.c==='frost'&&WINTER.on,()=>unitSprite(u.type,u.worldSide??spriteTeam(u),u.hero,u.v,pose,bare,arm,u.worldTint,u.afoot));
/* a horse no one rides (battle/dismount.js Horse): its rider's mount standing, saddled, a cloth of its side's colour under the
   saddle (people.js drawMount: saddled); in a rider's cell, its feet where his were. Cached by its look */
function horseSprite(L){const key='hz'+L.mount+(L.mountC||'')+L.team+(L.barded?'b':'');if(spr[key])return spr[key];
  const box=mountMetrics(L.mount),g=pgrid(box.w,box.h);g.edge=true;drawMount(g,{...L,saddled:true},-1);poutline(g);return spr[key]=cellOf(pcanvas(g))}
/* the fallen (vfx.js drawCorpses): a man flat where he fell, head the way he faced, turned a quarter pixel for pixel so he stays
   crisp; a rider thrown from his mount, which lies low beside him; a beast slumped where it stood. stand: him upright (his fall
   turns it about his feet), body: him lying, ax, ay: his feet in it; wk: the weapon he dropped; mount: his mount standing, down:
   lying */
const CORPSES=new WeakMap(),BEAST_FALL={troll:'over',spider:'back',scorpion:'back',slime:'melt'};
// (whose mount each lying one is, for its deaths: horseDeathOf)
const DOWN_LOOK=new WeakMap();
/* the beasts and monsters (engine/beasts.js PX.beast): the people's style, side-on, in a power-of-two cell (the dragon 64, a troll
   or a wyrm 32, a slime 16, the rest 32), feet on its bottom row; three variants; the poses as the people's (BEAST_POSES: 0-1
   standing, 2-5 walking, 15-18 running, 6-8 the attack, 9-11 the dragon's breath) and lying dead (PX.BEAST_DEAD). One of yours
   (team 0) wears the side's blue; a wild one nothing. Cached by kind, side, variant and pose (the climbs walk, the other blows
   strike) */
const BEAST_POSES=PX.BEAST_POSES;
const beastPoseOf=(type,p)=>type==='tiger'?p:p>=PX.BEAST_DEAD?p:p>=19?2+(p-19)%4:p>=12&&p<=14?p-6:p>=9&&p<=11&&type!=='dragon'?p-3:p;
function beastSprite(type,team,v,pose){v=(v||0)%3;pose=beastPoseOf(type,pose||0);const k='bst'+type+(team?1:0)+v+'p'+pose;
  return spr[k]||(spr[k]=cellOf(PX.beast(type,{v,pose,team:team?1:0})))}
// a beast's pose now: striking (or breathing fire, winding up a spit), running or walking as it moves, leaping (a pounce), breathing
function beastPose(u,moved){
  if(u.type==='tiger'&&PX.tiger)return PX.tiger.live(u,B.t,moved,ATK_ANIM);
  if(PX.wolf&&PX.wolf.isWolf(u.type))return PX.wolf.live(u,B.t,moved,ATK_ANIM);
  if(u.s.breath&&u.br!=null&&u.br>3.5-ATK_ANIM*1.5)return 9+Math.min(2,Math.floor((3.5-u.br)/(ATK_ANIM*1.5)*3));
  if(u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)return 6+Math.min(2,Math.floor((B.t-u.atkAt)/ATK_ANIM*3));
  if(u.shot)return 6;
  if((u.z||0)>1)return 16;
  if(moved){const phase=u.walkPhase!=null?u.walkPhase+(u.v||0):null;return u.spdNow>u.s.spd*.75?15+Math.floor(phase??B.t*12+(u.v||0))%4:2+Math.floor(phase??B.t*8+(u.v||0))%4}
  return (B.t*.8+((u.id||0)*.37)%1)%1<.45?1:0}
// a monster on the world map (engine/beasts.js PX.beastMap): the dragon on the wing (its own small figure in a 32 cell, wings up,
// then level: it should look huge: f 0-1); the rest their own small figures in a 16 cell, f their step (PX.MAP_STEPS of them to a
// body length walked: monsters.js)
function monsterMapSprite(id,f,alpha=false){const M=MONSTERS[id],type=alpha&&id==='wolf'?WOLF_ALPHA.unit:M.unit,n=M.mythic?2:PX.MAP_STEPS,k='mm'+type+((f||0)%n);if(spr[k])return spr[k];return spr[k]=cellOf(PX.beastMap(type,(f||0)%n))}
function corpseOf(u){
  const base=actorSprite(u,0,true);let c=CORPSES.get(base);if(c)return c;
  // (a beast: it sinks as it falls (a troll over as a man does, a spider or a scorpion onto its back, a slime running flat, the rest
  // pressed low), then lies in its dead pose, down: engine/beasts.js)
  if(ST[u.type]&&ST[u.type].beast)c={beast:base,down:actorSprite(u,PX.BEAST_DEAD),how:BEAST_FALL[u.type]||'side',...(u.type==='tiger'?{frames:Array.from({length:8},(_,i)=>actorSprite(u,PX.tiger.pose('death_back',i)))}:PX.wolf.isWolf(u.type)?{frames:Array.from({length:8},(_,i)=>actorSprite(u,PX.wolf.pose('death_side',i)))}:{})};
  else{const L=unitLook(u),wk=heldWeapon(L),g=pgrid(24,20);drawFigure(g,{...L,mount:null,weapon:wk?null:L.weapon},4,3,-1,null,-1);const lie=pturn(g);poutline(g);poutline(lie);
    c={stand:pcanvas(g),body:pcanvas(lie),ax:2,ay:12,wk,team:L.team};
    if(L.mount){const box=mountMetrics(L.mount),m=pgrid(box.w,box.h),d=pgrid(box.w,box.downH);m.edge=d.edge=true;drawMount(m,L,-1);drawMountDown(d,L);poutline(m);poutline(d);c.mount=pcanvas(m);c.down=pcanvas(d);DOWN_LOOK.set(c.down,L)}}
  CORPSES.set(base,c);return c}
/* one knocked down, not dead (render.js drawDowned): him falling and lying as the fallen do, but his weapon kept in his hand (the
   owner, 2026-11-01: "draw a weapon from start to finish"), GEAR.room rows over him for it (top); his corpse's (corpseOf) when he
   holds none apart. Kept by his body, apart from the corpse's record (the battle keeps that) */
const DOWNED=new WeakMap();
function downedOf(u){const c=corpseOf(u);if(!c.wk)return DEATHS.on&&ST[u.type]?.wildlife?wildDeath(u,c,deathMap(u),'belly'):c;const base=actorSprite(u,0,true);let d=DOWNED.get(base);if(d)return d;
  const L=unitLook(u),R=GEAR.room,g=pgrid(24,20+R);drawFigure(g,{...L,mount:null},4,3+R,-1,null,-1);const lie=pturn(g);poutline(g);poutline(lie);
  d={stand:pcanvas(g),body:pcanvas(lie),ax:c.ax,ay:c.ay,top:R};DOWNED.set(base,d);return d}
/* ---------- the ways to die (the owner, 2026-11-03: "make sure all sprites has correct dead sprite and more variant of dead
   sprite"). Each kind has its deaths and their weights, one picked by a hash of the fallen's id (deathPick: never Math.random, so
   a battle's dice stay as they were); each drawn from the living figures turned, flipped and re-cut, crisp, in their own colours
   and outline. man: face, face down, his head the way he faced (corpseOf's); back, on his back, his head behind him; curl, on his
   side, his knees drawn up, his head bowed; knees, fallen to his knees, slumped forward; flung, on his back, an arm flung past his
   head. His shield lies by him, his helm or hat (hats) rolls off for a share of them (helm), his weapon drops by him (vfx.js).
   rider: thrown clear of his mount (a man's death of his own), draped across it (face down) or pinned under it (on his back);
   mount: on its side, legs out, or down on its belly, its legs folded (mountDown: a wolf as a wolf, a stag with its antlers; a
   horse killed under its rider by where it lies, horseDeathOf). beast: its kind's
   deaths (engine/beasts.js PX.BEAST_DEATHS), these their weights (1 if left out); wild: the hunt's game (critters.js
   CRITTER_DEATHS). fall: how a beast goes down into each (vfx.js drawBody; a kind's own first, 'kind.name'; else pressed low).
   on false: corpseOf's one corpse for every one, as before (the fingerprints' proof) ---------- */
const DEATHS={on:true,man:{face:3,back:3,curl:2,knees:2,flung:2},helm:.35,hats:['cap','kettle','great','plume','horned','straw','wizard'],
  rider:{clear:3,across:2,under:2},mount:{side:3,belly:2},
  beast:{side:3,back:2,slump:2,wing:2,curl:3,splay:2,limp:2,melt:3,burst:2,sag:2,over:3,flung:2,flat:3,belly:2,arch:2},wild:{back:3,belly:2,slump:2},
  fall:{back:'back','troll.back':'tip',over:'over',flung:'over',melt:'melt',burst:'melt',sag:'melt'},
  // blood by kind (the owner, 2026-11-03: "make sure that not all monsters have red blood"; drawn only): a kind's (blood), its pool's
  // tones middle to edge and a fleck in it (gore; vfx.js poolSprite); red (GORE.col) for the rest, people, horses, wolves, bears,
  // boars and the game; none, no pool, for the undead and the made (dust and chips: vfx.js undead); slime, a puddle of its own coat
  blood:{spider:'ichor',scorpion:'ichor',slime:'slime',troll:'murk',wyrm:'fire',dragon:'fire'},
  gore:{ichor:{col:['#3e4a10','#5e7018','#86a028']},murk:{col:['#1e2a1a','#2e3a22','#44502c']},fire:{col:['#4a1008','#7a240c','#b04416'],fleck:'#f0a040'}}};
// (one's blood: {key, col, fleck}, or null: none)
function bloodOf(u){const n=DEATHS.blood[u.type]||(undead(u)?'none':'red');if(n==='none')return null;
  if(n==='slime'){const v=(u.v||0)%3,R=PX.ramp(PX._beastKit.KINDS.slime.coats[v]);return{key:'slime'+v,col:[R[3],R[2],R[1]]}}
  return DEATHS.gore[n]?{key:n,...DEATHS.gore[n]}:{key:'red',col:GORE.col}}
// (a name of table W by its weight, by a hash of id and salt: each choice its own salt)
function deathPick(id,W,salt){let s=0;for(const k in W)s+=W[k];let r=PX.hash(id|0,salt,7177)*s;for(const k in W)if((r-=W[k])<0)return k;return Object.keys(W)[0]}
// (the grid turned a quarter the other way: what stood up now lies on its back, its head to the left)
function pturnL(g){const r=pgrid(g.h,g.w);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const c=g.p[y*g.w+x];if(c)r.p[(g.w-1-x)*r.w+y]=c}return r}
// (g's pixels each moved by f(x, y): [dx, dy] (null: left out), in order, into a grid w x h)
function pmove(g,f,w=g.w,h=g.h){const r=pgrid(w,h);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const c=g.p[y*g.w+x],d=c&&f(x,y);if(d)pset(r,x+d[0],y+d[1],c)}return r}
// (a's pixels where b's differ, a grid of their own a pixel round them: a piece of gear lifted off a figure; null if none)
function pdiff(a,b){let x0=1e9,y0=1e9,x1=-1,y1=-1;const on=(x,y)=>{const c=a.p[y*a.w+x];return c&&c!==b.p[y*a.w+x]};
  for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++)if(on(x,y)){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  if(x1<0)return null;const r=pgrid(x1-x0+3,y1-y0+3);for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(on(x,y))pset(r,x-x0+1,y-y0+1,a.p[y*a.w+x]);return r}
// (his look, kept apart from him: unitLook keeps it on him, where the fight's records would show it)
const DEATH_LOOK=new WeakMap(),deathLook=u=>u.look?unitLook(u):DEATH_LOOK.get(u)||(DEATH_LOOK.set(u,unitLook({...u})),DEATH_LOOK.get(u));
const DEATH_SPR=new WeakMap(),deathMap=u=>{const b=actorSprite(u,0,true);let m=DEATH_SPR.get(b);if(!m)DEATH_SPR.set(b,m={});return m};
/* one's death: what vfx.js drawBody draws him by. corpseOf's record when DEATHS is off; else his death's, kept by his body and
   death: name, blood (bloodOf); a beast's beast, down, how (its fall); a man's stand, body, ax, ay as corpseOf's, fall (over, back or knees), wk, wd
   (the side his weapon drops: 1 ahead of him, -1 behind), bits ([canvas, x, y]: his shield, his helm, lying by him), pool ([x, y]:
   his blood's middle); a rider's mount, down, ride and at (where he lies from his mount's middle) */
function deathOf(u){const c=corpseOf(u);if(!DEATHS.on)return c;const id=u.id|0,S=ST[u.type]||{},m=deathMap(u);
  if(S.wildlife)return wildDeath(u,c,m,deathPick(id,DEATHS.wild,1));
  if(u.type==='tiger'&&c.frames)return{...c,name:'side',blood:bloodOf(u)};
  if(S.beast){const names=PX.BEAST_DEATHS[u.type]||['side'],how=deathPick(id,Object.fromEntries(names.map(n=>[n,DEATHS.beast[n]??1])),1);
    return m[how]||(m[how]={beast:c.beast,down:actorSprite(u,PX.BEAST_DEAD+names.indexOf(how)),how:DEATHS.fall[u.type+'.'+how]||DEATHS.fall[how]||'side',name:how,blood:bloodOf(u),...(PX.wolf.isWolf(u.type)?{frames:Array.from({length:8},(_,i)=>actorSprite(u,PX.wolf.pose('death_'+how,i)))}:{})})}
  const L=deathLook(u),ride=c.mount?deathPick(id,DEATHS.rider,2):null,lie=ride&&deathPick(id,DEATHS.mount,3),how=ride==='across'?'face':ride==='under'?'back':deathPick(id,DEATHS.man,1),
    helm=DEATHS.hats.includes(L.helm)&&PX.hash(id,4,7177)<DEATHS.helm,k=how+(helm?'h':'')+(ride?ride+lie:'');
  return m[k]||(m[k]=Object.assign(manDeath(c,L,how,helm,ride,lie),{blood:bloodOf(u)}))}
// (a horse killed under its rider, who fought on (battle/dismount.js): on its side or its belly by a hash of where it lies, a
// wolf as a wolf (mountDown); null if it is not a rider's)
const HORSE_DEATH=new WeakMap();
function horseDeathOf(c){const S=c.sp,L=DOWN_LOOK.get(S.down);if(!L)return null;const lie=deathPick(Math.round(c.x)*7+Math.round(c.y)*3,DEATHS.mount,3);
  let m=HORSE_DEATH.get(S.down);if(!m)HORSE_DEATH.set(S.down,m={});return m[lie]||(m[lie]={...S,down:lie==='side'&&L.mount==='horse'?S.down:mountDown(L,lie),name:lie})}
// (the game's: its figure dead in its own cell, at the battle's twice)
function wildDeath(u,c,m,how){if(m[how])return m[how];const s=critterDead(ST[u.type].wildlife,how),b=c.beast;
  return m[how]={beast:b,down:mkc(b.width,b.height,g=>g.drawImage(s,(b.width>>1)-s.width,b.height-s.height*2,s.width*2,s.height*2)),how:how==='back'?'back':'side',name:how,blood:bloodOf(u)}}
// (where a man's gear lies by him, by his death: [x, y] from his feet (the side he faced ahead): his shield, his helm, and (arms
// flung) the bow or staff he held)
const DEATH_BITS={face:[[5,6],[19,1]],back:[[-5,6],[-19,1]],curl:[[6,-8],[16,4]],knees:[[-7,0],[9,0]],flung:[[5,6],[-19,4],[3,-10]]};
function manDeath(c,L,how,helm,ride,lie){
  const sh=L.short?1:0,B={...L,mount:null,weapon:c.wk?null:L.weapon,shield:null,offShield:null,...(helm?{helm:'bare'}:{})},
    fig=(o,style,atk,cut)=>{const g=pgrid(24,20);drawFigure(g,o,4,3,-1,style,atk,cut);return g},g0=fig(B,null,-1);
  let body,ax=2,ay=12,wd=1,pool=[7,3],fall='over';
  if(how==='back'||how==='flung'){body=pturnL(how==='flung'?fig({...B,weapon:null,held:'sword'},'thrust',1):g0);ax=17;ay=16;wd=-1;pool=[-7,3];fall='back'}
  // (curled: his head bowed a pixel, laid down, his legs drawn up under him: his thighs toward his front, his shins and feet back)
  else if(how==='curl'){const Lc=lettersOf(B);body=pturn(pmove(g0,(x,y)=>y>=16-sh?null:y<10?[1,0]:[0,0]));
    for(const [x,y,k] of [[4,15,'L'],[5,15,'M'],[4,16,'L'],[5,16,'M'],[3,17,'L'],[4,17,'M'],[2,17,'F'],[2,16,'F']])pset(body,x,y,Lc[k])}
  // (to his knees: what is above his belt two rows lower, bent forward over them, his head hung; his knees and feet on the ground)
  else if(how==='knees'){const Lc=lettersOf(B),gy=17-sh;body=pmove(fig(B,null,-1,12-sh),(x,y)=>{const t=y-3;return[t<7?3:t<10?2:t<12?1:0,2+(t<7?2:t<10?1:0)]});
    for(let x=9;x<=13;x++)pset(body,x,gy,x<12?Lc.L:Lc.M);pset(body,7,gy,Lc.F);pset(body,8,gy,Lc.F);ax=12;ay=18;pool=[4,2];fall='knees'}
  else body=pturn(g0);
  // (his shield and his helm off him, each lying on its side)
  const bits=[],at=DEATH_BITS[how],piece=(o,turn,i)=>{const p=pdiff(fig(o,null,-1),g0);if(!p)return;const q=turn?pturn(p):pmove(p,(x,y)=>[0,p.h-1-2*y]);if(dollable(B))q.edge=true;poutline(q);bits.push([pcanvas(q),...at[i]])};
  if(shieldLook(L))piece({...B,shield:L.shield,offShield:L.offShield},true,0);if(helm)piece({...B,helm:L.helm},false,1);
  if(how==='flung'&&B.weapon){const p=pdiff(g0,fig({...B,weapon:null},null,-1));if(p){const q=pturn(p);if(dollable(B))q.edge=true;poutline(q);bits.push([pcanvas(q),...at[2]])}}
  // (his dying (the owner, 2026-11-07: "a dying sequence", after his knight sheet): struck, he staggers back (the flinch); then to his
  // knees, upright, his legs folded under him; then down into his death; in his own pictures, never the standing one turned)
  // (kneeling: a doll in its own kneeling pose (one knee down, the other up, dollfigs.js DOLL_MOVES.kneel); the old figure his body
  // (without what he carries) down until it rests on the row his feet stood on, its knee pixels drawn)
  const lowOf=q=>{let lo=-1;for(let i=0;i<q.p.length;i++)if(q.p[i])lo=Math.max(lo,(i/q.w)|0);return lo},feet=lowOf(fig({...B,weapon:null},null,-1)),kd=Math.max(0,feet-lowOf(fig({...B,weapon:null},null,-1,12-sh))),stg=fig(B,'flinch',-1),kn0=dollable(B)?fig({...B,weapon:null},'kneel',-1):null,kn=kn0?pmove(kn0,(x,y)=>[0,feet-lowOf(kn0)]):pmove(fig({...B,weapon:null},null,-1,12-sh),(x,y)=>[0,kd]);// (on his knees his weapon dropped; a doll in its own kneeling pose (dollfigs.js DOLL_MOVES.kneel), set on the row his feet stood on)
  if(!B.robe){const gy=17-sh;if(dollable(B)){}
    else{const Lc=lettersOf(B);pset(kn,15,gy-1,Lc.L);pset(kn,15,gy,Lc.M);pset(kn,16,gy,Lc.F);pset(kn,6,gy,Lc.F);pset(kn,5,gy,Lc.F)}}
  // (all of them in the dolls' style, their outline inside them, however they were moved or turned)
  const doll=dollable(B);for(const q of [stg,kn,body])if(doll)q.edge=true;poutline(stg);poutline(kn);
  poutline(body);const r={stand:c.stand,stagger:pcanvas(stg),kneel:pcanvas(kn),body:pcanvas(body),ax,ay,wk:c.wk,team:c.team,fall,wd,bits,pool,name:how+(helm?' helm':'')};
  if(ride)Object.assign(r,{mount:c.mount,down:lie==='side'&&L.mount==='horse'?c.down:mountDown(L,lie),ride,at:{clear:[9,8],across:[-4,-8],under:[-2,0]}[ride],name:r.name+'|'+ride+'|'+lie});
  return r}
/* (a mount down, lie: side, on its side, its legs out, or belly, on its belly, its legs folded under it. A horse or a stag: people.js
   drawMountDown, a stag's antlers on the ground by its head; on its belly its legs cut short under it, set down on the ground. The
   rest (a ram, a wolf, a warg): its own standing figure laid down, its head sunk to its back, its legs out stiff or folded away.
   The size of drawMountDown's, its ground on the same row) */
function mountDown(L,lie){const G=19,belly=lie==='belly';let d;
  if(L.mount==='wolf'||L.mount==='warg'){const box=mountMetrics(L.mount);d=pgrid(box.w,box.downH);drawMountDown(d,L,lie)}
  else if(horseArt(L.mount)){d=pgrid(32,22);drawMountDown(d,L);if(belly)d=pmove(d,(x,y)=>y>15?null:[0,4]);
    if(L.mount==='stag')for(const [x,y] of [[27,12],[26,11],[28,11],[25,10],[29,10],[24,9]])pset(d,x,y+(belly?4:0),PPAL.cloth[0])}
  else{const m=pgrid(32,32);drawMount(m,L,-1);const n=y=>{let k=0;for(let x=0;x<32;x++)if(m.p[y*32+x])k++;return k};
    let bel=31,top=0,hd=0;while(bel>0&&!n(bel))bel--;while(bel>0&&n(bel)<=10)bel--;while(top<bel&&n(top)<=12)top++;while(hd<top&&!n(hd))hd++;
    const sink=Math.max(0,top-hd-3),lift=belly?0:2;d=pmove(m,(x,y)=>y>bel?null:[0,G-lift-bel+(y<top?sink:0)],32,22);
    // (its legs: stiff stubs from its belly, out behind and ahead; or a hoof showing at each end)
    const at=[];for(let x=0;x<32;x++)if(m.p[(bel+1)*32+x]&&!m.p[(bel+1)*32+x-1])at.push(x);
    for(const x of at){const s=x<16?-1:1;if(belly){pset(d,x,G,'#27272c');continue}const c=m.p[(bel+2)*32+x];pset(d,x,G-1,c);pset(d,x+1,G-1,c);pset(d,x+s,G,'#27272c');pset(d,x+1+s,G,'#27272c')}}
  // (its outline inside it as every figure's, however it was moved: people.js poutline)
  if(DOLL_FIGS.on&&DOLL_FIGS.edge)d.edge=true;poutline(d);return pcanvas(d)}
// which pose a fighter shows now: striking just after an attack, striding while moving, breathing while still
/* the sprites a battle will need, made a little each frame before they are first shown (WARM.budget ms a frame, during the
   deployment and the opening): every body of every kind, side and look on the field, standing, breathing, walking and
   running, and their weapons at every angle. A pose first drawn mid-fight would otherwise cost a hitch */
// (the beasts' poses in a queue of their own, b, made after the rest; last of all each one's own death, deathOf, by his id)
const WARM={q:[],b:[],budget:4};
function warmBattle(units){
  WARM.q=[];WARM.b=[];const seen=new Set(),late=[];
  for(const u of units){if(ST[u.type]&&ST[u.type].beast){const k=u.type+'|'+(u.team?1:0)+'|'+(u.v||0)%3;if(!seen.has(k)){seen.add(k);for(const p of [...BEAST_POSES,PX.BEAST_DEAD])WARM.b.push(()=>actorSprite(u,p))}continue}const v=u.hero?0:(u.v||0)%6,k=u.type+'|'+spriteTeam(u)+'|'+(u.hero?1:0)+'|'+v+'|'+(u.worldTint||'')+'|'+(u.worldSide??'');if(seen.has(k))continue;seen.add(k);
    for(const p of [0,1,2,3,4,5,15,16,17,18])WARM.q.push(()=>actorSprite(u,p,true));
    const L=unitLook(u),w=heldWeapon(L);
    if(w){const sk=pal(L.skin)[1],kw=w+L.team+sk;if(!seen.has(kw)){seen.add(kw);for(let i=0;i<WEAPON_STEPS;i++)WARM.q.push(()=>weaponSprite(w,L.team,sk,i))}}
    for(const p of [6,7,8,9,10,11,12,13,14,FLINCH_POSE,LOOK_POSE,SHIFT_POSE,DEF_POSE,BRACE_POSE,GRIP_POSE])WARM.q.push(()=>actorSprite(u,p,true));
    if(u.hero&&unarmed())for(let p=FIST_POSE;p<FIST_POSE+12;p++)WARM.q.push(()=>actorSprite(u,p,true));// (bare hands: the fists' blows)
    // (and last, how he lies when he falls, and the weapon he drops: vfx.js drawCorpses)
    late.push(()=>corpseOf(u));if(u.s.range&&!u.s.magic){for(const p of [0,2,3,4,5,6,7,8])late.push(()=>actorSprite(u,p,true,true));const sk=pal(L.skin)[1],kw='sword'+L.team+sk;if(!seen.has(kw)){seen.add(kw);for(let i=0;i<WEAPON_STEPS;i++)late.push(()=>weaponSprite('sword',L.team,sk,i))}}if(w)for(const i of [0,1,WEAPON_STEPS-1,WEAPON_STEPS/2,WEAPON_STEPS/2+1])late.push(()=>weaponSprite(w,L.team,PPAL.wood[2],i))}
  WARM.q.push(...late);if(DEATHS.on)for(const u of units)WARM.b.push(()=>deathOf(u))}
function warmStep(){const t0=performance.now();while((WARM.q.length||WARM.b.length)&&performance.now()-t0<WARM.budget)(WARM.q.length?WARM.q:WARM.b).shift()()}
// a soldier's look (what unitSprite draws him from), for the weapon in his hand
// a shooter's sidearm: a short sword, on the weapon layer
const sidearmLook=u=>u.side||(u.side={...unitLook(u),weapon:'sword'});
// (a rider on foot: his look without his mount, battle/dismount.js)
const FOOT_LOOK=new WeakMap();
function unitLook(u){const L=riderLook(u);if(!u.afoot)return L;let f=FOOT_LOOK.get(L);if(!f)FOOT_LOOK.set(L,f={...L,mount:null});return f}
// (his look as he is made, a rider in the saddle: kept on him)
// (the look a chief is drawn in, by his band: a goblin band's or camp's leader a goblin of his own look (people.js gob_chief; the
// hobgoblin, hob_chief, kept for later), every other the human chieftain)
const chiefLookType=(type,band)=>type==='chief'&&band==='goblins'?'gob_chief':type;
function riderLook(u){if(u.look)return u.look;const cg=COMPS[u.type]&&P.comps&&P.comps[u.type]&&P.comps[u.type].gear||null;const L=allyLook(lookOf(chiefLookType(u.type,u.leader?.ref?.band||u.leader?.band),u.worldSide??u.team,u.hero,u.hero?0:(u.v||0)%6,COMPS[u.type]?u.type:'',cg),u.worldSide??spriteTeam(u));return u.look=u.worldTint?{...L,team:u.worldTint}:L}
// (your allies' men (team 2: battle.js spriteTeam) in their side's cloth, SIDE.ally.tabard)
const allyLook=(L,team)=>team===2?{...L,team:SIDE.ally.tabard}:L;
function procPose(u,moved){
  // (a shooter: drawing, three steps to full; just loosed; reloading)
  if(u.shot)return ATK_BASE.thrust+Math.min(2,Math.floor(u.shot.t/u.shot.aim*3));
  // (meeting a blow: his shield up; a parry or a dodge stands, his weapon and his lean showing it: weapons.js, render.js)
  {const d=Defence.now(u);if(d)return d==='block'||u.hero&&d==='parry'&&unarmed()?(u.defH==='low'?DEF_LOW:DEF_POSE):0}// (bare hands: a parry is his fists up)
  if(u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM&&u.atkLook==='bash')return DEF_POSE;// (a bash: his shield driven forward, battle/duel.js)
  if(u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)return (ATK_BASE[u.atkStyle]||6)+Math.min(2,Math.floor((B.t-u.atkAt)/ATK_ANIM*3));
  if(u.s.range&&!u.inMelee&&u.cd>0&&u.atkAt!=null&&!moved)return ATK_BASE.overhead+Math.floor((B.t-u.atkAt)*5)%3;
  // (running: the run, faster; walking: the walk)
  if(moved){const phase=u.walkPhase!=null?u.walkPhase+(u.v||0):null;return u.spdNow>u.s.spd*.75?15+Math.floor(phase??B.t*14+(u.v||0))%4:2+Math.floor(phase??B.t*9+(u.v||0))%4}
  // (standing near a foe, his weapon toward him (weapons.js holdOf: nearW): behind his shield raised before him, or braced with both
  //  hands on a pole, or gripping a great weapon in both)
  if(u.nearW&&!u.s.range){const L=unitLook(u),k=heldWeapon(L);if(k&&!L.mount){if(shieldLook(L))return DEF_POSE;if(POLE(k)&&k!=='lance')return BRACE_POSE;if(k==='great'||k==='bigaxe'||k==='hammer')return GRIP_POSE}}
  // (standing: breathing, slow, each on his own rhythm)
  return (B.t*.8+((u.id||0)*.37)%1)%1<.45?1:0;
}
// a banner bearer on the map (people.js mapFigure): the party's leader in the banner's colour, on foot or riding a mount of colour
// mc; f the step (0 to WALK.n-1)
function partySprite(col,mc,f,race){f=(f||0)%PEOPLE_STEPS;const you=col==='#e8b94a';race=race||(you?P.race:'human');const k='p'+col+(mc||'')+f+race,c=FIGURES.get(k);if(c)return c;
  const R=RACE_LOOK[race]||RACE_LOOK.human;
  return FIGURES.set(k,mapFigure({race,skin:R.skin[0],hair:R.hair[you?0:2],eye:R.eye,ears:R.ears,tusk:R.tusk,short:R.short,beard:R.beard?R.hair[0]:null,
    helm:you?'crown':'kettle',outer:'steel',inner:'dark',team:col,shortHair:true},f,mc||null))}
// a bandit on the map: hooded, a spear
function banditSprite(f){f=(f||0)%PEOPLE_STEPS;const k='bd'+f;return FIGURES.get(k)||FIGURES.set(k,mapFigure({race:'human',skin:'skinTan',hair:'black',helm:'hood',hood:'leather',outer:'leather',inner:'dark',team:'#8a3a2a',weapon:'spear',shortHair:true},f,null))}
/* a party's banner: on its card (ui.js tipFlag; none floats over an army now, the owner, 2026-11-01) and on your camp's pole
   (render.js drawBanners): a pole with a gilt finial (a spearhead over a knob and a collar) and its cloth flying east, in a 32
   cell, the pole's foot at (px, py) of the cell (render.js bannerAt stands it there), its cloth's middle lx. Its look b
   (Party.banner): k, the shape: 'banner' a swallow-tailed standard (a realm's lords, you, your companions), 'pennant' a tapering
   pennant (a holding's guards), 'trade' a small pennant on a short pole (a caravan), 'rag' a tattered standard (bandits, desert
   raiders, bog raiders); col its field, dev its device (BANNER_DEV: a realm's emblem by its id, a crown for you, a star for a
   companion, a skull, a coin, a lit lantern (a night watch's pennant: gilt, its flame pale)). The cloth in the field's ramp (engine
   PX.ramp: light, the colour, shade, deep), lit from the top left: its folds run down it, each column lit as its fold turns to the
   light and in shade as it turns away (BANNER.fold), the hem along its top lit and its foot in shade; its fly end waves (the
   device's columns stay flat, so it reads); the device in the middle of the field, light on a dark field and dark on a light one,
   ringed in the field's deepest shade so it stays clear zoomed out (a pennant's the device in small: BANNER_DEV's every other row
   and column); outlined inside as every figure is (people.js poutline, the edge kept). f: the flutter (0, 1), the folds half a fold along.
   BANNER: the grid (w, h), the cloth's top and the pole's foot (rows; a caravan's top: trade), each shape's cloth [w, h], the folds
   across it (fold) and where its fly end begins to wave (fly, columns) */
const BANNER={w:16,h:24,top:4,foot:22,trade:10,cloth:{banner:[11,9],rag:[11,9],pennant:[12,8],trade:[7,4]},fold:2.2,fly:8};
// (a band's rag by its kind: bandits, desert raiders, bog raiders)
const BAND_FLAG={bandits:'#8a2a2a',raiders:'#b07a38',bog:'#4e6a3a'};
const BANNER_DEV={vale:['..w..','..w..','wwwww','..x..','..x..'],karn:['wwwww','wwwww','..x..','..x..','..x..'],sylvan:['..w..','.www.','wwwww','.www.','..x..'],
  horde:['w...w','.w.w.','..x..','.w.w.','w...w'],salt:['..w..','wwwww','..w..','w.w.w','.www.'],crown:['.....','w.w.w','wwwww','wxwxw','.....'],
  star:['.....','..w..','.www.','..w..','.....'],skull:['.www.','wxwxw','.www.','.w.w.','.....'],coin:['ww','wx'],lantern:['.g.','gfg','gfg','.g.']};
/* a banner's cloth by s(x, y, colour): its first column at x0 (by the pole), the rest out to dir (1: to the right, -1: to the left,
   trailing back from a man facing right), its top row at top; its size by its shape from sizes (BANNER.cloth, BATTLE_BANNER.cloth),
   its folds and its fly's wave by o (fold, fly; notch: how deep a swallow tail is cut, 3 columns else): the field in its ramp, lit by its folds, each shape's own outline (a swallow tail's
   notch, a rag's torn foot and fly, a pennant's taper), the device in the middle of the field ringed in its deepest shade (a
   pennant's in small, a caravan's coin gilt) */
function bannerCloth(s,x0,top,b,f,sizes,dir,o){const R=PX.ramp(b.col),G=PPAL.gold,trade=b.k==='trade',pen=b.k==='pennant'||trade,[cw,ch]=sizes[b.k]||sizes.banner,X=i=>x0+dir*i;
  const lum=[1,3,5].reduce((a,i,k)=>a+parseInt(b.col.slice(i,i+2),16)*[.3,.59,.11][k],0)/255,D=lum>.6?['#4a2226','#2a1418']:['#f6eedc','#d0c4a6'];
  // the cloth: each column's rows [r0, r1] by its shape
  const rows=i=>{if(pen){const t=Math.round(i*(ch-1)/(cw-1));return[[0,ch-1-t]]}
    if(b.k==='rag'){const d=[0,1,0,2,1,0,3,1,2,0,2][(i+f*3)%11];return i===cw-1?[[0,0],[2,2],[4,Math.min(5,ch-1)]]:[[0,ch-1-Math.min(d,ch>>1)]]}
    const n=i-(cw-(o.notch||3)),m=(ch-1)>>1;return n<0?[[0,ch-1]]:[[0,m-1-n],[m+1+n,ch-1]]};
  const ph=i=>(i/cw*o.fold+f*.5)*Math.PI,wave=i=>i<o.fly?0:Math.round(Math.sin(ph(i))),at=new Map();
  for(let i=0;i<cw;i++){const sl=Math.cos(ph(i)),k=i===0?1:sl>.45?0:sl<-.45?2:1;for(const [r0,r1] of rows(i))for(let r=r0;r<=r1;r++){const y=top+r+wave(i);at.set(i+','+r,y);s(X(i),y,R[r===0?Math.max(0,k-1):r===r1?Math.min(3,k+1):k])}}
  if(b.k==='rag'&&cw>7){s(X(cw-5),top+3+wave(cw-5),R[3]);s(X(cw-4),top+Math.min(5,ch-2)+wave(cw-4),R[3])}// (a hole, a stain)
  let T=BANNER_DEV[b.dev];if(T&&pen&&!trade&&b.dev!=='lantern')T=[0,2,4].map(y=>[0,2,4].map(x=>T[y][x]).join(''));
  if(T){const i0=trade?1:pen?1:(cw-T[0].length)>>1,r0=trade?0:pen?Math.min(2,ch-T.length):(ch-T.length)>>1,C={w:trade?G[0]:D[0],x:trade?G[2]:D[1],g:G[1],f:'#fff2a0'},dev=new Set();
    T.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')dev.add((i0+x)+','+(r0+y))}));
    if(!trade)for(const p of dev){const [i,r]=p.split(',').map(Number);for(const [di,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const q=(i+di)+','+(r+dr);if(!dev.has(q)&&at.has(q))s(X(i+di),at.get(q),R[3])}}
    T.forEach((row,y)=>[...row].forEach((c,x)=>{const q=(i0+x)+','+(r0+y);if(c!=='.'&&at.has(q))s(X(i0+x),at.get(q),C[c])}))}}
function bannerSprite(b,f){f=f?1:0;const key='bn'+b.k+b.col+b.dev+f;if(spr[key])return spr[key];
  const N=BANNER,g=pgrid(N.w,N.h),s=(x,y,c)=>pset(g,x,y,c),Wd=PPAL.wood,G=PPAL.gold,trade=b.k==='trade',top=trade?N.trade:N.top,[cw]=N.cloth[b.k]||N.cloth.banner;
  // the pole, its foot darker; the finial: a collar, a knob, a point
  for(let y=top;y<=N.foot;y++)s(2,y,y>N.foot-4?Wd[2]:Wd[1]);s(2,top-1,G[2]);s(1,top-2,G[2]);s(2,top-2,G[0]);s(3,top-2,G[1]);s(2,top-3,G[0]);
  bannerCloth(s,3,top,b,f,N.cloth,1,N);
  g.edge=true;poutline(g);const c=cellOf(pcanvas(g)),n=c.width;c.px=(n>>1)-(N.w>>1)+2;c.py=n-N.h+N.foot;c.lx=c.px+1+(cw>>1);return spr[key]=c}
/* pre-rendered world map: ground colors per climate, then terrain on top; mini: the minimap's colour of each kind of tile (T_OPEN
   ... T_FORD, map.js) */
const PAL={
  grass:{g:['#4f7a3a','#4c7738'],s:['#5d8c44','#3f6a30'],road:['#b89b62','#d0b880','#9a7f4c'],tree:['#2a5a2a','#2f6a30','#3f8a3e'],hill:['#7a6e46','#9a8c5c','#a89a68','#c4b684'],mini:['#4f7a3a','#2f5a2c','#8a7a52','#3b6ca8','#b89b62','#8e95a6','#6a92bc']},
  frost:{g:['#d9e1ea','#d2dbe6'],s:['#eef3f8','#b8c4d2'],road:['#b8b2a6','#cfc9bd','#9a9488'],tree:['#2a4a3a','#e8eef4','#3a5a48'],hill:['#9aa6b4','#b8c4d2','#cfd8e2','#eef3f8'],mini:['#d9e1ea','#3a5a48','#9aa6b4','#7fa6c8','#b8b2a6','#eef3f8','#a8c4dc']},
  desert:{g:['#d8b86a','#d2b064'],s:['#e6c87e','#b8944c'],road:['#c9a868','#dcc084','#a8884c'],tree:['#5a8a3a','#6a9a44','#7aaa50'],hill:['#9a5a32','#b5733e','#c8885a','#dca070'],mini:['#d8b86a','#7a9a44','#b5733e','#4a8ab8','#c9a868','#9a6a4a','#7aa8c8']},
  swamp:{g:['#4a5a34','#465630'],s:['#5a6a3a','#3a4a2a'],road:['#7a6a48','#8a7a58','#5a4a34'],tree:['#2a3a24','#3a4a2a','#5a4a34'],hill:['#5a5a3a','#6a6a46','#7a7a52','#8a8a5c'],mini:['#4a5a34','#2a3a24','#6a6a46','#3d5a4a','#7a6a48','#8e95a6','#5d7a6a']}
};
// the painted map is kept by chunks (worldart.js WorldArt); worldCv() is the whole of it as one canvas, painted on first use (when
// every script and every estate plot is ready), for the blit until render.js draws by chunks, for the wiki and the tests
const worldCv=()=>WorldArt.whole();
// the minimap from the tile data (WorldArt.mini, drawn by render.js): made now, from the map as the scripts leave it (as it
// always was: the roads lots.js leads to the gates come after it), and again when next shown after WorldArt.invalidate()
if(WM)WorldArt.mini();
/* battle arenas: one per climate, built when first needed (R16: no pixels of its own, its tiles painted as they are seen:
   worldart.js paintArena) */
const ARENAS={};
// (by climate and field size: only the field size in use kept, a huge field's tiles being large)
function arenaFor(c){const it=arenaSteps(c);let n;while(!(n=it.next()).done);return n.value}
// (the same as a generator (setup.js BattleSetup.paint))
function* arenaSteps(c){const s='|'+BW+'x'+BH,k=c+s;if(!ARENAS[k]){for(const q of Object.keys(ARENAS))if(!q.endsWith(s))delete ARENAS[q];ARENAS[k]=yield* paintArena(c,true)}return ARENAS[k]}
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
    // (a waterskin: full, a plump leather bag with its cork, the water's drop by it in the item's colour; empty, flat and creased)
    case 'skin':{const L='#a8845a',Ld=shade(L,.65),Ll=shade(L,1.25);r('#6a4a2a',7,1,2,2);r(Ll,6,3,4,2);r(L,4,5,8,8);r(L,3,6,10,6);r(L,5,13,6,1);r(Ll,5,6,2,4);r(Ld,4,12,8,1);r(Ld,11,7,1,4);r('#5a3a1a',10,3,2,1);r('#5a3a1a',12,4,1,3);r(c,12,0,1,1);r(c,11,1,3,2);r(lt,11,1,1,1);break}
    case 'skinflat':r('#6a4a2a',5,5,2,2);r(lt,6,7,3,2);r(c,4,9,8,1);r(c,2,10,12,3);r(c,3,13,10,1);r(lt,4,10,3,1);r(dk,6,10,1,3);r(dk,9,11,1,2);r(dk,2,12,12,1);r(dk,3,13,10,1);break;
    case 'jug':r('#8a6a4a',5,1,6,2);r('#c8b8a0',4,3,8,10);r(c,5,4,6,4);r(lt,5,4,2,8);r('#c8b8a0',12,5,2,5);r(shade('#c8b8a0',.7),4,12,8,1);break;
    case 'cheese':r(c,2,6,12,7);r(c,4,4,8,2);r(c,7,3,4,1);r(lt,3,6,10,1);r(dk,2,12,12,1);r(dk,5,8,2,2);r(dk,10,9,2,2);r(dk,8,11,1,1);break;
    case 'fruit':r(c,2,6,6,6);r(c,8,7,6,6);r(lt,3,7,2,2);r(lt,9,8,2,2);r(dk,2,11,6,1);r(dk,8,12,6,1);r('#5a3a20',5,4,1,2);r('#3f8a3e',6,3,2,1);r('#5a3a20',11,5,1,2);break;
    case 'mount':r(c,8,6,4,8);r(c,5,3,6,4);r(c,2,5,5,4);r(c,9,1,2,2);r(dk,11,3,2,10);r(dk,12,13,1,2);r('#1a1410',6,4,1,1);r(dk,2,8,1,1);r('#c8a24a',4,6,5,1);r(lt,6,3,3,1);r(dk,2,9,4,1);break;
    case 'letter':r(dk,2,4,12,9);r(c,2,4,12,8);r(lt,3,5,10,1);for(let i=0;i<6;i++){r(dk,2+i,4+i);r(dk,13-i,4+i)}if(def.seal){r('#8a1e1a',6,8,4,3);r('#c0302a',7,8,2,2)}else{r('#8a1e1a',5,10,2,1);r('#8a1e1a',9,11,2,1)}break;
    case 'belt':r(c,1,6,14,4);r(dk,1,9,14,1);r('#c8a24a',6,5,4,6);r(c,7,6,2,4);r(lt,2,6,4,1);r(lt,11,6,3,1);break;
  }
}))}
/* ---------- text on canvas ---------- */
// while TXTQ is an array (the world's things being drawn), labels are queued and drawn after all of them, on top (those of the
// scene in game pixels too: TXTQ.lo, render.js drawWorld). World labels are flushed through mapTxt at native resolution;
// txt and txtPic keep the existing small pixel font for other canvas text.
let TXTQ=null;
const TXT_FONT='8px Silkscreen, "Courier New", monospace';
function txt(s,x,y,col,al){if(TXTQ&&(ctx===TXTQ.ctx||ctx===TXTQ.lo)){TXTQ.push([s,x,y,col,al]);return}
  // (on the map's canvas of VS px a game px, its picture enlarged; a battle drawn sharp (core.js bview) writes it at its own px)
  if(CVS>1&&ctx===ctx0&&MAPZOOM.map){const c=txtPic(s,col,al);ctx.drawImage(c,x-c.ox,y-c.oy);return}
  ctx.font=TXT_FONT;ctx.textAlign=al||'left';ctx.textBaseline='alphabetic';ctx.fillStyle='#000';ctx.fillText(s,x+1,y+1);ctx.fillStyle=col||'#e4e0cf';ctx.fillText(s,x,y)}
// (a label's picture: drawn as txt draws it at a whole pixel, its pen (ox, oy) a whole pixel in it, so its letters fall on the
// same pixels; kept by text, colour and alignment, the lot let go when it grows past 600 or a font comes in)
const TXTC=new Map();let TXTM=null;
if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>TXTC.clear());
function txtPic(s,col,al){s=String(s);const k=s+'|'+col+'|'+al;let c=TXTC.get(k);if(c)return c;if(TXTC.size>600)TXTC.clear();
  const m=TXTM||(TXTM=mkc(1,1,()=>{}).getContext('2d', { willReadFrequently: true }));m.font=TXT_FONT;const w=Math.ceil(m.measureText(s).width),ox=1+(al==='center'?Math.ceil(w/2):al==='right'?w:0),oy=10;
  c=mkc(w+4,14,g=>{g.font=TXT_FONT;g.textAlign=al||'left';g.textBaseline='alphabetic';g.fillStyle='#000';g.fillText(s,ox+1,oy+1);g.fillStyle=col||'#e4e0cf';g.fillText(s,ox,oy)});
  c.ox=ox;c.oy=oy;TXTC.set(k,c);return c}

/* World labels are cached at their final device-pixel size, never enlarged from the 8px text above. Arial matches the UI;
   a small CSS-size floor keeps phones readable. The outline is part of the cached picture, not a blurred canvas shadow. */
const MAP_TEXT={size:8,min:11,font:'Arial, sans-serif',weight:600,edge:'#09080a'};
function mapTxtPic(s,col,al,scale,dpr){
  s=String(s);const size=Math.max(Math.ceil(MAP_TEXT.min*dpr),Math.round(MAP_TEXT.size*scale)),line=Math.max(2,Math.round(2*dpr)),font=MAP_TEXT.weight+' '+size+'px '+MAP_TEXT.font,k='map|'+size+'|'+line+'|'+s+'|'+col+'|'+al;
  let c=TXTC.get(k);if(c)return c;if(TXTC.size>600)TXTC.clear();
  const m=TXTM||(TXTM=mkc(1,1,()=>{}).getContext('2d', { willReadFrequently: true }));m.font=font;m.textAlign='left';m.textBaseline='alphabetic';
  const metric=m.measureText(s),w=Math.ceil(metric.width),up=Math.ceil(metric.actualBoundingBoxAscent||size),down=Math.ceil(metric.actualBoundingBoxDescent||0),pad=Math.ceil(line/2)+2,ox=pad+(al==='center'?Math.ceil(w/2):al==='right'?w:0),oy=pad+up;
  c=mkc(w+2*pad,up+down+2*pad,g=>{g.font=font;g.textAlign=al||'left';g.textBaseline='alphabetic';g.lineJoin='round';g.lineWidth=line;g.strokeStyle=MAP_TEXT.edge;g.strokeText(s,ox,oy);g.fillStyle=col||'#e4e0cf';g.fillText(s,ox,oy)});
  c.ox=ox;c.oy=oy;c.deviceText=true;c.labelSize=size;TXTC.set(k,c);return c;
}
// A queued map label's anchor passes through the current camera transform, then the finished picture is copied 1:1.
function mapTxt(s,x,y,col,al){
  const g=ctx,m=g.getTransform(),dpr=dprOf(),c=mapTxtPic(s,col,al,Math.hypot(m.a,m.b),dpr),px=Math.round(m.a*x+m.c*y+m.e),py=Math.round(m.b*x+m.d*y+m.f);
  g.save();try{g.setTransform(1,0,0,1,0,0);g.shadowBlur=0;g.drawImage(c,px-c.ox,py-c.oy)}finally{g.restore()}
}

/* how big a host looks: followers trail the banner, more of them the bigger the band, at most 9 (render.js drawHost) */
const hostSize=n=>n<5?0:Math.min(9,Math.round(Math.sqrt(n)*1.7)-2);
// (a follower on the map: people.js followerSprite)
