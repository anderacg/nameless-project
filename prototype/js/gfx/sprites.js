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
  v=hero?0:(v||0)%6;pose=pose||0;const key=type+team+(hero?'h'+P.race+(P.gear.weapon||'')+(P.gear.body||'')+(P.gear.head||''):'')+(cg?'g'+(cg.weapon||'')+(cg.body||'')+(cg.head||''):'')+'v'+v+'p'+pose+(bare?'b':'')+(arm?'s':'');if(spr[key])return spr[key];
  if(type==='dragon')return spr[key]=cellOf(dragonSprite(32));
  if(ST[type]&&ST[type].beast)return spr[key]=cellOf(outlined(ST[type].big?bigBeastSprite(type):beastSprite(type)));
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
function corpseOf(u){
  const base=unitSprite(u.type,u.team,u.hero,u.v,0,true);let c=CORPSES.get(base);if(c)return c;
  // (a beast: one that stands upright falls as a man does; a spider or a scorpion ends on its back; a slime runs flat; the rest lie
  // on their side, which seen at the field's slant is their shape pressed low)
  if(u.type==='dragon'||ST[u.type]&&ST[u.type].beast)c={beast:base,how:BEAST_FALL[u.type]||'side'};
  else{const L=unitLook(u),wk=heldWeapon(L),g=pgrid(24,20);drawFigure(g,{...L,mount:null,weapon:wk?null:L.weapon},4,3,-1,null,-1);const lie=pturn(g);poutline(g);poutline(lie);
    c={stand:pcanvas(g),body:pcanvas(lie),ax:2,ay:12,wk,team:L.team};
    if(L.mount){const m=pgrid(32,32),d=pgrid(32,22);drawMount(m,L,-1);drawMountDown(d,L);poutline(m);poutline(d);c.mount=pcanvas(m);c.down=pcanvas(d)}}
  CORPSES.set(base,c);return c}
// which pose a fighter shows now: striking just after an attack, striding while moving, breathing while still
/* the sprites a battle will need, made a little each frame before they are first shown (WARM.budget ms a frame, during the
   deployment and the opening): every body of every kind, side and look on the field, standing, breathing, walking and
   running, and their weapons at every angle. A pose first drawn mid-fight would otherwise cost a hitch */
const WARM={q:[],budget:4};
function warmBattle(units){
  WARM.q=[];const seen=new Set(),late=[];
  for(const u of units){if(ST[u.type]&&ST[u.type].beast)continue;const v=u.hero?0:(u.v||0)%6,k=u.type+'|'+u.team+'|'+(u.hero?1:0)+'|'+v;if(seen.has(k))continue;seen.add(k);
    for(const p of [0,1,2,3,4,5,15,16,17,18])WARM.q.push(()=>unitSprite(u.type,u.team,u.hero,u.v,p,true));
    const L=unitLook(u),w=heldWeapon(L);
    if(w){const sk=pal(L.skin)[1],kw=w+L.team+sk;if(!seen.has(kw)){seen.add(kw);for(let i=0;i<WEAPON_STEPS;i++)WARM.q.push(()=>weaponSprite(w,L.team,sk,i))}}
    else for(let p=6;p<=14;p++)WARM.q.push(()=>unitSprite(u.type,u.team,u.hero,u.v,p,true));
    // (and last, how he lies when he falls, and the weapon he drops: vfx.js drawCorpses)
    late.push(()=>corpseOf(u));if(u.s.range&&!u.s.magic){for(const p of [0,2,3,4,5,6,7,8])late.push(()=>unitSprite(u.type,u.team,u.hero,u.v,p,true,true));const sk=pal(L.skin)[1],kw='sword'+L.team+sk;if(!seen.has(kw)){seen.add(kw);for(let i=0;i<WEAPON_STEPS;i++)late.push(()=>weaponSprite('sword',L.team,sk,i))}}if(w)for(const i of [0,1,WEAPON_STEPS-1,WEAPON_STEPS/2,WEAPON_STEPS/2+1])late.push(()=>weaponSprite(w,L.team,PPAL.wood[2],i))}
  WARM.q.push(...late)}
function warmStep(){const t0=performance.now();while(WARM.q.length&&performance.now()-t0<WARM.budget)WARM.q.shift()()}
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
function dragonSprite(w){const k='dr'+w;return spr[k]||(spr[k]=mkc(32,24,g=>{
  const r=(c,x,y,ww,hh)=>rect(g,c,x,y,ww,hh),B='#b8403a',D='#7e2a26',Wg='#5e1f1c',Y='#e8a04a';
  r(Wg,6,1,4,2);r(Wg,4,3,8,3);r(Wg,2,6,10,2);r(D,8,3,1,5);r(D,5,5,1,3);
  r(B,8,10,14,7);r(D,8,16,14,1);r(Y,11,14,9,2);
  r(B,4,12,5,3);r(B,1,14,4,2);r(D,0,15,2,1);
  r(B,21,7,4,6);r(B,24,4,6,5);r(D,24,8,6,1);r('#ffe08a',27,5,1,1);r('#e4e0cf',25,3,1,2);r('#e4e0cf',28,3,1,2);r('#ff7a30',30,7,2,1);
  r(D,10,17,2,5);r(D,18,17,2,5);r(C.dark,9,21,4,1);r(C.dark,17,21,4,1);
  r(Wg,14,2,4,2);r(Wg,13,4,7,4);r(Wg,12,8,6,2);
}))}
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
// painted on first use, when every script (and every estate plot) is ready
let mapCv=null;
const worldCv=()=>mapCv||(mapCv=paintWorld());
const miniCv=mkc(MW,MH,g=>{for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)rect(g,PAL[CLIMS[climate[y*MW+x]]].mini[tiles[y*MW+x]],x,y,1,1)});
/* battle arenas: one per climate, built when first needed */
const ARENAS={};
function arenaFor(c){const k=c+BW;return ARENAS[k]||(ARENAS[k]=paintArena(c))}
function obstacleSprite(kind,clim){const k='ob'+kind+clim;return spr[k]||(spr[k]=cellOf(outlined(mkc(14,16,g=>{
  const r=(c,x,y,w,h)=>rect(g,c,x,y,w,h);
  if(kind==='tree'){
    if(clim==='frost'){r('#5a3a20',6,12,2,4);r('#2a4a3a',2,8,10,5);r('#2a4a3a',3,4,8,4);r('#2a4a3a',5,1,4,3);r('#e8eef4',3,8,8,1);r('#e8eef4',4,4,6,1);r('#e8eef4',5,1,4,1)}
    else if(clim==='swamp'){r('#5a4a34',6,3,2,13);r('#5a4a34',3,5,3,1);r('#5a4a34',8,7,4,1);r('#2a3a24',2,0,10,4)}
    else{r('#5a3a20',6,10,2,6);r('#2a5a2a',1,3,12,8);r('#2f6a30',3,0,8,4);r('#3f8a3e',3,3,4,3)}
  }else if(kind==='cactus'){r('#5a8a3a',6,2,3,14);r('#5a8a3a',2,6,2,5);r('#5a8a3a',2,10,4,2);r('#5a8a3a',11,4,2,5);r('#5a8a3a',9,8,4,2);r('#7aaa50',7,3,1,12)}
  else{const d=clim==='desert';r(d?'#7a4a2e':'#5d6472',1,8,12,8);r(d?'#9a6a4a':'#7d8494',2,5,10,8);r(d?'#b5835a':'#a7adba',4,4,5,3);if(clim==='frost')r('#eef3f8',3,4,7,2)}
}))))}
function beastSprite(type){const k='bs'+type;return spr[k]||(spr[k]=mkc(14,14,g=>{
  const r=(c,x,y,w,h)=>rect(g,c,x,y,w,h);
  if(type==='wolf'){r('#6b737d',2,6,9,4);r('#9aa3ad',2,6,9,2);r('#6b737d',10,4,3,3);r('#9aa3ad',11,3,1,1);r('#1a1410',12,5,1,1);r('#ffd24a',11,4,1,1);r('#6b737d',0,5,2,2);
    r('#4a525c',3,10,1,4);r('#4a525c',5,10,1,4);r('#4a525c',8,10,1,4);r('#4a525c',10,10,1,4)}
  else if(type==='slime'){r('#5a9a3a',3,8,9,6);r('#8ad06a',4,7,7,2);r('#a8e888',5,7,2,1);r('#3a7a2a',3,13,9,1);r('#1a1410',5,9,1,2);r('#1a1410',9,9,1,2)}
  else if(type==='boar'){r('#5a3a28',2,6,10,5);r('#7a5038',3,5,8,3);r('#5a3a28',11,6,3,4);r('#e8e4d0',13,8,1,2);r('#1a1410',12,7,1,1);r('#3a2418',1,5,2,2);
    r('#3a2418',3,11,1,3);r('#3a2418',5,11,1,3);r('#3a2418',9,11,1,3);r('#3a2418',11,11,1,3)}
  else if(type==='tiger'){r('#e08a2a',1,6,10,5);r('#f0a848',2,6,8,2);r('#e08a2a',10,4,4,4);r('#1a1410',3,6,1,4);r('#1a1410',6,6,1,4);r('#1a1410',9,6,1,3);r('#f4ecd8',11,6,3,2);
    r('#3ac04a',12,5,1,1);r('#e08a2a',0,4,2,2);r('#c06a1a',2,11,1,3);r('#c06a1a',4,11,1,3);r('#c06a1a',8,11,1,3);r('#c06a1a',10,11,1,3)}
  else if(type==='bear'){r('#5a3e2a',1,4,11,7);r('#6e4e36',2,3,9,3);r('#5a3e2a',10,2,4,5);r('#5a3e2a',10,1,1,1);r('#5a3e2a',13,1,1,1);r('#1a1410',12,4,1,1);r('#2a1e14',13,5,1,1);
    r('#3e2a1c',2,11,2,3);r('#3e2a1c',5,11,2,3);r('#3e2a1c',8,11,2,3);r('#3e2a1c',11,11,2,3)}
  else if(type==='spider'){r('#2a2230',4,6,6,5);r('#3a3044',5,5,4,3);r('#2a2230',9,6,3,3);r('#e0605a',10,6,1,1);r('#e0605a',11,7,1,1);r('#8a3a8a',5,8,3,1);
    for(let i=0;i<4;i++){r('#2a2230',1+i,10-i%2,1,4);r('#2a2230',11-i,10-i%2,1,4)}}
  else if(type==='griffin'){r('#c8a060',3,7,8,4);r('#e8dcc0',8,3,4,5);r('#f0c040',12,5,2,1);r('#1a1410',10,4,1,1);r('#8a6a3a',1,2,6,3);r('#a8844a',0,4,7,2);r('#e8dcc0',4,2,3,2);
    r('#8a6a3a',4,11,1,3);r('#8a6a3a',9,11,1,3);r('#c8a060',0,8,3,1)}
  else{r('#8a5a2b',3,7,7,4);r('#b5733e',4,7,5,2);r('#8a5a2b',9,8,3,2);r('#e8a04a',11,7,2,2);r('#8a5a2b',1,5,3,2);r('#8a5a2b',1,2,2,3);r('#c8885a',2,1,3,1);r('#e0605a',4,1,1,1);
    for(let i=0;i<3;i++){r('#5a3a20',4+i*2,11,1,3);r('#5a3a20',3+i*2,11,1,1)}}
}))}
function bigBeastSprite(type){const k='bb'+type;return spr[k]||(spr[k]=type==='troll'?mkc(22,24,g=>{
  const r=(c,x,y,w,h)=>rect(g,c,x,y,w,h),S='#6a8a6a',D='#4a6a4e',L='#8aa88a';
  r(D,6,18,3,6);r(D,13,18,3,6);r(S,4,8,14,11);r(L,6,9,10,4);r(S,7,2,8,7);r(D,7,7,8,1);r('#ffd24a',9,4,1,1);r('#ffd24a',12,4,1,1);r('#e8e4d0',9,7,1,1);r('#e8e4d0',12,7,1,1);
  r(S,1,9,3,10);r(S,18,9,3,9);r('#7a5a3a',19,4,2,16);r('#9a7a52',18,3,4,4);r('#5a3a28',4,14,14,2)
}):mkc(30,18,g=>{
  const r=(c,x,y,w,h)=>rect(g,c,x,y,w,h),S='#c8964a',D='#9a6a32',L='#e0b870';
  r(D,0,12,30,6);r(S,2,9,24,6);r(L,4,9,18,2);for(let i=0;i<5;i++)r(D,5+i*4,8,2,1);
  r(S,20,2,8,9);r(D,20,9,8,2);r('#e8e4d0',26,9,1,3);r('#e8e4d0',28,9,1,3);r('#e0605a',24,4,2,1);r('#5a3a1a',27,6,2,1);r('#d8b86a',0,15,30,3)
}))}
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
