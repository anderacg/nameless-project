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
  const c=mkc(n,n,g=>g.drawImage(src,(n>>1)-(src.width>>1),n-src.height));c.cw=src.width;c.ch=src.height;return c}
// v (0-5) varies a generated soldier: skin tone, helmet or cap, tunic shade, beard
const VAR_TINT=[1,.86,1.12,.94,1.06,.8],VAR_SKIN=[1,.9,1.08,.82,.96,1.04],VAR_HELM=['#c9ced8','#9aa3ad','#a07a4a','#dfe4ea','#7a5a3a','#8e95a6'],VAR_BEARD=['#9a6a3a','#c8a050','#6a4a2a','#d8d0c0','#8a3a20','#3a2a20'];
// pose: 0-1 idle (breathing), 2-5 walking (legs stride, body bobs), then three blows of three frames each (wind up, strike,
// follow through): 6-8 a swing, 9-11 a thrust, 12-14 an overhead chop. A figure is 16x16 drawn into a 20x20 canvas (room for a
// raised or thrust weapon) inside a 1-pixel outline, feet on the bottom row; cached by type, team, variant and pose.
const POSES=15,ATK_BASE={swing:6,thrust:9,overhead:12};
function unitSprite(type,team,hero,v,pose){
  // a companion wears what you gave them: their weapon, armour and helm show (cg)
  const cg=COMPS[type]&&P.comps&&P.comps[type]&&P.comps[type].gear||null;
  v=hero?0:(v||0)%6;pose=pose||0;const key=type+team+(hero?'h'+P.race+(P.gear.weapon||''):'')+(cg?'g'+(cg.weapon||'')+(cg.body||'')+(cg.head||''):'')+'v'+v+'p'+pose;if(spr[key])return spr[key];
  if(type==='dragon')return spr[key]=cellOf(dragonSprite(32));
  if(ST[type]&&ST[type].beast)return spr[key]=cellOf(outlined(ST[type].big?bigBeastSprite(type):beastSprite(type)));
  const cid=COMPS[type]?type:'',st=ST[type],race=hero?P.race:st&&st.race;
  if(cid)type=COMPS[cid].look;else if(st&&st.look)type=st.look;
  const sk=shade(race?RACES[race].skin:C.skin,VAR_SKIN[v]),skd=shade(sk,.8),helm=hero?C.steel:VAR_HELM[v],beard=VAR_BEARD[v],horse=type==='horse';
  // what the figure holds: from the hero's weapon, or the troop's kind
  const hk=hero?heroKind():cg&&cg.weapon?ITEMS[cg.weapon].kind||'melee':null,hw=hero&&P.gear.weapon?ITEMS[P.gear.weapon]:cg&&cg.weapon?ITEMS[cg.weapon]:null;
  const wpn=hero||hw?(hk==='ranged'?'bow':hk==='magic'?'staff':!hw?'sword':hw.base==='spear'||hw.tag==='spear'?'spear':hw.base==='warhammer'||hw.icon==='club'?'hammer':hw.base==='dagger'||hw.icon==='dagger'?'dagger':hw.base==='axe'?'axe':hw.hand==='two'?'great':'sword')
    :type==='spearman'?'spear':type==='mage'?'staff':type==='archer'||type==='ranger'?'bow':type==='chief'?'axe':type==='militia'?'sword':st&&st.range?'bow':'sword';
  const walk=pose>=2&&pose<=5?pose-2:-1,atk=pose>=6?(pose-6)%3:-1,style=pose>=12?'overhead':pose>=9?'thrust':pose>=6?'swing':null,breathe=pose===1?1:0;
  return spr[key]=cellOf(outlined(mkc(20,horse?16:20,g=>{
    const t=shade(C.team[team],VAR_TINT[v]),tl=shade(t,1.2),td=shade(C.teamD[team],VAR_TINT[v]),r=(c,x,y,ww,hh)=>rect(g,c,x,y,ww||1,hh||1);
    if(horse){
      const mount=race==='orc'?['#6b6b73','#4a4a52','#8a8a92']:race==='dwarf'?['#c9bfae','#8e8574','#e0d8c8']:race==='elf'?['#c8a070','#9a7448','#dcb88a']:[C.horse,C.horseD,'#9a6a3e'];
      const bob=walk===1||walk===3?-1:0,L=[[4,6,12,14],[5,7,11,13],[4,6,12,14],[3,5,13,15]][walk<0?0:walk];
      // legs: a gallop of four, then the body, neck, head, mane and tail
      L.forEach((x,i)=>{const lift=walk>=0&&(i+walk)%2?1:0;r(i%2?mount[1]:shade(mount[1],.8),x,13-lift,1,3);r(C.dark,x,15,1,1)});
      r(mount[0],3,9+bob,12,5);r(mount[1],3,13+bob,12,1);r(mount[2],4,9+bob,9,1);
      r(mount[0],14,6+bob,3,4);r(mount[0],16,5+bob,3,3);r(mount[1],18,7+bob,1,1);r(C.dark,17,6+bob,1,1);r(mount[1],13,5+bob,2,4);r(mount[1],1,9+bob,2,1);r(mount[1],0,10+bob,2,3);
      if(race==='dwarf')r('#e4e0cf',16,4+bob,1,2);if(race==='elf')r('#e4e0cf',17,3+bob,1,2);
      r('#6a3a20',5,8+bob,7,2);
      // the rider
      const ry=bob;r(t,7,3+ry,4,5);r(tl,7,3+ry,1,5);r(sk,8,0+ry,3,3);r(C.steel,8,0+ry,3,1);r(td,6,4+ry,2,3);
      const lance=atk===1?3:atk===0?-1:0;r(C.wood,10+lance,2+ry,9,1);r(C.steel,18+lance,2+ry,2,1);
      if(race==='orc')r('#fff',10,2+ry,1,1);if(race==='dwarf')r('#9a6a3a',8,2+ry,3,2);
      return;
    }
    g.translate(2,4);const by=(walk===1||walk===3?-1:0),ub=by+breathe,ox=1;
    // legs: stride with the near leg lighter; boots at the bottom
    const legs=walk===0?[[ox+3,12,'far'],[ox+8,12,'near']]:walk===2?[[ox+8,12,'far'],[ox+3,12,'near']]:[[ox+4,12,'far'],[ox+7,12,'near']];
    for(const [x,y,w] of legs){r(w==='near'?'#3a2e26':'#241c16',x,y+by,2,4-by);r('#1a1410',x,15,2+(w==='near'?1:0),1)}
    // torso: tunic with a light edge and a belt; a tabard stripe for veterans
    r(t,ox+3,6+ub,7,6);r(tl,ox+3,6+ub,1,6);r(td,ox+9,7+ub,1,5);r('#3a2a1a',ox+3,10+ub,7,1);r(C.gold,ox+6,10+ub,1,1);
    if(st&&st.tier>=2&&!cid)r(shade(helm,.9),ox+3,6+ub,7,1);
    if(st&&st.tier>=3&&!cid){r(C.gold,ox+6,7+ub,1,3)}
    if(hero){r(C.gold,ox+1,6+ub,2,6);r(shade(C.gold,.75),ox+1,11+ub,2,1)}
    if(type==='mage'){r('#5a3a8a',ox+2,9+ub,9,4);r('#6a4aa8',ox+3,9+ub,1,4)}
    // head: face, eye, and the headgear of the kind
    const hy=2+ub;r(sk,ox+4,hy,5,4);r(skd,ox+4,hy+3,5,1);r('#1a1410',ox+7,hy+1,1,1);r(sk,ox+9,hy+1,1,2);
    if(type==='archer'||type==='ranger'){const hc=type==='ranger'?'#2c5230':C.hood;r(hc,ox+3,hy-1,6,2);r(hc,ox+3,hy,2,4);r(shade(hc,1.25),ox+4,hy-1,3,1)}
    else if(type==='mage'){r('#5a3a8a',ox+3,hy-1,7,2);r('#5a3a8a',ox+5,hy-3,3,2);r('#6a4aa8',ox+6,hy-4,1,1);r('#e8c040',ox+6,hy-1,1,1)}
    else if(hero){r(C.steel,ox+3,hy-1,7,2);r('#dfe4ea',ox+4,hy-1,3,1);r(C.gold,ox+6,hy-2,2,1);r(C.steel,ox+3,hy,1,3)}
    else if(type==='chief'){r(C.steel2,ox+3,hy-1,7,2);r('#e8e4d0',ox+2,hy-3,1,3);r('#e8e4d0',ox+10,hy-3,1,3)}
    else{r(helm,ox+3,hy-1,7,2);r(shade(helm,1.2),ox+4,hy-1,3,1);if(v===2||v===4)r(shade(helm,.75),ox+3,hy,1,3);if(v===3)r(helm,ox+5,hy-2,3,1);if(v===5)r('#a14b38',ox+6,hy-3,1,2)}
    if(race==='elf'){r(sk,ox+9,hy,1,1);r(sk,ox+10,hy-1,1,1)}
    if(race==='orc'){r(shade(sk,.85),ox+4,hy+2,5,2);r('#fff',ox+6,hy+3,1,1);r('#fff',ox+8,hy+3,1,1)}
    if(race==='dwarf'){r(beard,ox+4,hy+3,5,3);r(beard,ox+5,hy+6,3,1);r(shade(beard,1.2),ox+5,hy+3,2,1)}
    if((race==='human'||!race)&&!hero&&v%3===1){r(beard,ox+5,hy+3,4,1);r(beard,ox+6,hy+4,2,1)}
    if(cid==='elske'){r('#e4e0cf',ox+3,hy-1,7,2);r('#e4e0cf',ox+3,hy,1,5)}
    if(cid)r(C.gold,ox+3,11+ub,7,1);
    if(cg&&cg.body){const ac=ITEMS[cg.body].col;r(ac,ox+4,6+ub,5,4);r(shade(ac,1.25),ox+4,6+ub,5,1);r(shade(ac,.7),ox+8,7+ub,1,3)}
    if(cg&&cg.head){const hc=ITEMS[cg.head].col;r(hc,ox+3,hy-1,7,2);r(shade(hc,1.25),ox+4,hy-1,3,1);r(shade(hc,.75),ox+3,hy,1,3)}
    if(type==='spearman'){r(td,ox+1,6+ub,3,6);r(C.steel,ox+1,6+ub,3,1);r(shade(td,1.3),ox+2,8+ub,1,2)}
    // the weapon arm: hold, wind up, strike, follow through
    const hand=(x,y)=>r(sk,x,y,1,1),wy=ub+breathe;
    // melee weapons: a shaft or blade drawn as a line from the hand at an angle (0 points forward, -90 up), with its head at the end
    const MEL={sword:[7,C.steel,'guard'],great:[10,C.steel,'guard'],dagger:[4,C.steel,'guard'],axe:[7,C.wood,'axe'],hammer:[8,C.wood,'hammer'],spear:[14,C.wood,'tip']}[wpn];
    if(MEL){const [L,col,head]=MEL,line=(x0,y0,ang,len,c)=>{for(let i=0;i<len;i++)r(c,Math.round(x0+Math.cos(ang)*i),Math.round(y0+Math.sin(ang)*i),1,1)};
      // hand position and blade angle for each style and frame; spears hold their point forward when they swing or thrust
      const P0={swing:[[8,5,-125],[11,8,-5],[10,10,55]],thrust:[[7,8,-8],[12,8,0],[10,8,0]],overhead:[[8,3,-95],[10,4,-35],[11,9,70]]};
      let [hx,hy,deg]=style?P0[style][atk]:[11,9,-90];if(wpn==='spear'&&style==='swing')[hx,hy,deg]=[[9,7,-40],[11,8,-2],[10,9,25]][atk];
      hx+=ox;hy+=wy;const ang=deg*Math.PI/180,c=Math.cos(ang),sn=Math.sin(ang),tip=[hx+c*(L-1),hy+sn*(L-1)];
      line(hx,hy,ang+Math.PI,wpn==='spear'?4:2,C.wood);line(hx,hy,ang,L,col);
      if(head==='guard'){r(C.gold,Math.round(hx-sn),Math.round(hy+c),1,1);r(C.gold,Math.round(hx+sn),Math.round(hy-c),1,1);line(hx+c,hy+sn,ang,2,shade(col,1.25))}
      else if(head==='tip'){r(C.steel,Math.round(tip[0]),Math.round(tip[1]),1,1);r('#ffffff',Math.round(tip[0]+c),Math.round(tip[1]+sn),1,1);r(C.steel,Math.round(tip[0]-c),Math.round(tip[1]-sn),1,1)}
      else if(head==='axe'){for(let k=0;k<3;k++){r(C.steel2,Math.round(tip[0]-sn*(k+1)-c*k*.5),Math.round(tip[1]+c*(k+1)-sn*k*.5),1,1);r(C.steel,Math.round(tip[0]-sn*(k+1)),Math.round(tip[1]+c*(k+1)),1,1)}}
      else if(head==='hammer'){r(C.steel2,Math.round(tip[0])-1,Math.round(tip[1])-1,3,3);r(C.steel,Math.round(tip[0])-1,Math.round(tip[1])-1,3,1)}
      if(atk===1&&style){r('#ffffff',Math.round(tip[0]),Math.round(tip[1]),1,1)}
      hand(hx,hy)}
    else if(wpn==='staff'){const lift=atk===1?-2:atk===0?-1:0,glow=(st&&st.bolt)||'#9ad0ff';
      r(C.wood,ox+11,1+wy+lift,1,13);r(glow,ox+10,0+wy+lift,3,2);if(atk===1){r(glow,ox+9,-1+wy+lift+1,5,1);r('#ffffff',ox+11,0+wy+lift,1,1)}hand(ox+11,8+wy)}
    else if(wpn==='bow'){const pull=atk===0?2:atk===1?0:0;r(C.wood,ox+12,3+wy,1,8);r(C.wood,ox+11,2+wy,1,1);r(C.wood,ox+11,11+wy,1,1);
      if(pull){r('#e8e4d0',ox+12-pull,4+wy,1,3);r('#e8e4d0',ox+12-pull,7+wy,1,3);r('#c9ced8',ox+10-pull,7+wy,4+pull,1)}else r('#e8e4d0',ox+11,3+wy,1,8);hand(ox+12,7+wy);if(atk===1)r('#e8e4d0',ox+14,7+wy,2,1)}
  })));
}
// which pose a fighter shows now: striking just after an attack, striding while moving, breathing while still
function procPose(u,moved){
  if(u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)return (ATK_BASE[u.atkStyle]||6)+Math.min(2,Math.floor((B.t-u.atkAt)/ATK_ANIM*3));
  if(moved)return 2+Math.floor(B.t*9+(u.v||0))%4;
  return Math.floor(B.t*1.4+(u.v||0)*.37)%2;
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
// a banner bearer on the map: riding a mount of color mc, or on foot without one
// a banner bearer on the map: riding a mount of color mc, or on foot; frame 1 is mid-stride
function partySprite(col,mc,f){f=f||0;const k='p'+col+(mc||'')+f;return spr[k]||(spr[k]=cellOf(outlined(mkc(12,12,g=>{const r=(c,x,y,w,h)=>rect(g,c,x,y,w,h);
  if(!mc){const L=f?[3,7]:[4,6];r(C.dark,L[0],9,1,3);r('#3a2e26',L[1],9,1,3);r('#3d74d6',4,4,3,5);r('#5a8ae0',4,4,1,5);r('#3a2a1a',4,7,3,1);r(C.skin,4,2,3,2);r('#1a1410',6,2,1,1);r(C.wood,2,1,1,11);r(col,0,1,2,3);r(shade(col,.7),0,3,2,1);return}
  const L=f?[1,4,6,9]:[2,4,7,8];L.forEach((x,i)=>r(i%2?shade(mc,.6):C.dark,x,9,1,3));
  r(shade(mc,.75),1,6,8,3);r(mc,1,6,8,2);r(shade(mc,1.2),2,6,5,1);r(mc,8,4,3,3);r(shade(mc,.6),10,5,1,1);r(shade(mc,.7),0,6,1,3);
  r('#3d74d6',4,2,3,4);r('#5a8ae0',4,2,1,4);r(C.skin,4,0,3,2);r(C.wood,3,0,1,6);r(col,0,0,3,2)}))))}
function banditSprite(f){f=f||0;const k='bd'+f;return spr[k]||(spr[k]=cellOf(outlined(mkc(12,12,g=>{const r=(c,x,y,w,h)=>rect(g,c,x,y,w,h),L=f?[2,7]:[3,6];
  r(C.dark,L[0],9,2,3);r('#2e1c1a',L[1],9,2,3);r('#4a2e2a',2,3,7,6);r('#5e3a34',2,3,1,6);r('#2e1c1a',3,1,5,3);r(C.skin,4,3,3,2);r('#1a1410',6,3,1,1);r(C.wood,9,0,1,10);r('#b8403a',9,0,3,2)}))))}
/* holdings: every town, castle and village is drawn from its people's style, its size and its own seed, so no two look alike.
   Styles: human, dwarf, elf, orc (from the first race living there), or port and stilt where the holding sets one. The flag shows the owner. */
const seeded=s=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
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
function arenaFor(c){return ARENAS[c]||(ARENAS[c]=paintArena(c))}
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
// an army follower: 6x6 inside its outline, an 8x8 cell: helmet, face, tunic, striding legs, a spear
function followerSprite(col,f){const k='fw'+col+f;return spr[k]||(spr[k]=cellOf(outlined(mkc(6,6,g=>{const r=(c,x,y,w,h)=>rect(g,c,x,y,w||1,h||1);
  r(shade(col,.55),1,0,3,1);r(C.skin,1,1,3,1);r(col,1,2,3,2);r(shade(col,1.2),1,2,1,1);r(shade(col,.7),1,3,3,1);r(C.dark,f?0:1,4,1,2);r(C.dark,f?3:2,4,1,2);r(C.wood,5,1,1,5);r('#c9ced8',5,0,1,1)}))))}
