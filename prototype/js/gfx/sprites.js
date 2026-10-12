'use strict';
/* ---------- sprites ---------- */
const mkc=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;f(g);return c};
const rect=(g,col,x,y,w=1,h=1)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
const C={skin:'#e8c39e',dark:'#1a1410',steel:'#c9ced8',steel2:'#8e95a6',wood:'#8b5a2b',gold:'#e8b94a',hood:'#3d6b3a',team:['#3d74d6','#b8403a'],teamD:['#2a4f99','#7e2a26'],horse:'#7a4a26',horseD:'#573219'};
const spr={};
// v (0-5) varies a generated soldier: skin tone, helmet or cap, tunic shade, beard
const VAR_TINT=[1,.86,1.12,.94,1.06,.8],VAR_SKIN=[1,.9,1.08,.82,.96,1.04],VAR_HELM=['#c9ced8','#9aa3ad','#a07a4a','#dfe4ea','#7a5a3a','#8e95a6'],VAR_BEARD=['#9a6a3a','#c8a050','#6a4a2a','#d8d0c0','#8a3a20','#3a2a20'];
// pose: 0-1 idle (breathing), 2-5 walking (legs stride, body bobs), then three blows of three frames each (wind up, strike,
// follow through): 6-8 a swing, 9-11 a thrust, 12-14 an overhead chop. A figure is 16x16 drawn into a 20x20 canvas (room for a
// raised or thrust weapon) inside a 1-pixel outline, feet on the bottom row; cached by type, team, variant and pose.
const POSES=15,ATK_BASE={swing:6,thrust:9,overhead:12};
function unitSprite(type,team,hero,v,pose){
  v=hero?0:(v||0)%6;pose=pose||0;const key=type+team+(hero?'h'+P.race+(P.gear.weapon||''):'')+'v'+v+'p'+pose;if(spr[key])return spr[key];
  if(type==='dragon')return spr[key]=dragonSprite(32);
  if(ST[type]&&ST[type].beast)return spr[key]=outlined(ST[type].big?bigBeastSprite(type):beastSprite(type));
  const cid=COMPS[type]?type:'',st=ST[type],race=hero?P.race:st&&st.race;
  if(cid)type=COMPS[cid].look;else if(st&&st.look)type=st.look;
  const sk=shade(race?RACES[race].skin:C.skin,VAR_SKIN[v]),skd=shade(sk,.8),helm=hero?C.steel:VAR_HELM[v],beard=VAR_BEARD[v],horse=type==='horse';
  // what the figure holds: from the hero's weapon, or the troop's kind
  const hk=hero?heroKind():null,hw=hero&&P.gear.weapon?ITEMS[P.gear.weapon]:null;
  const wpn=hero?(hk==='ranged'?'bow':hk==='magic'?'staff':!hw?'sword':hw.base==='spear'||hw.tag==='spear'?'spear':hw.base==='warhammer'||hw.icon==='club'?'hammer':hw.base==='dagger'||hw.icon==='dagger'?'dagger':hw.base==='axe'?'axe':hw.hand==='two'?'great':'sword')
    :type==='spearman'?'spear':type==='mage'?'staff':type==='archer'||type==='ranger'?'bow':type==='chief'?'axe':type==='militia'?'sword':st&&st.range?'bow':'sword';
  const walk=pose>=2&&pose<=5?pose-2:-1,atk=pose>=6?(pose-6)%3:-1,style=pose>=12?'overhead':pose>=9?'thrust':pose>=6?'swing':null,breathe=pose===1?1:0;
  return spr[key]=outlined(mkc(20,horse?16:20,g=>{
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
  }));
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
function partySprite(col,mc,f){f=f||0;const k='p'+col+(mc||'')+f;return spr[k]||(spr[k]=outlined(mkc(12,12,g=>{const r=(c,x,y,w,h)=>rect(g,c,x,y,w,h);
  if(!mc){const L=f?[3,7]:[4,6];r(C.dark,L[0],9,1,3);r('#3a2e26',L[1],9,1,3);r('#3d74d6',4,4,3,5);r('#5a8ae0',4,4,1,5);r('#3a2a1a',4,7,3,1);r(C.skin,4,2,3,2);r('#1a1410',6,2,1,1);r(C.wood,2,1,1,11);r(col,0,1,2,3);r(shade(col,.7),0,3,2,1);return}
  const L=f?[1,4,6,9]:[2,4,7,8];L.forEach((x,i)=>r(i%2?shade(mc,.6):C.dark,x,9,1,3));
  r(shade(mc,.75),1,6,8,3);r(mc,1,6,8,2);r(shade(mc,1.2),2,6,5,1);r(mc,8,4,3,3);r(shade(mc,.6),10,5,1,1);r(shade(mc,.7),0,6,1,3);
  r('#3d74d6',4,2,3,4);r('#5a8ae0',4,2,1,4);r(C.skin,4,0,3,2);r(C.wood,3,0,1,6);r(col,0,0,3,2)})))}
function banditSprite(f){f=f||0;const k='bd'+f;return spr[k]||(spr[k]=outlined(mkc(12,12,g=>{const r=(c,x,y,w,h)=>rect(g,c,x,y,w,h),L=f?[2,7]:[3,6];
  r(C.dark,L[0],9,2,3);r('#2e1c1a',L[1],9,2,3);r('#4a2e2a',2,3,7,6);r('#5e3a34',2,3,1,6);r('#2e1c1a',3,1,5,3);r(C.skin,4,3,3,2);r('#1a1410',6,3,1,1);r(C.wood,9,0,1,10);r('#b8403a',9,0,3,2)})))}
/* holdings: every town, castle and village is drawn from its people's style, its size and its own seed, so no two look alike.
   Styles: human, dwarf, elf, orc (from the first race living there), or port and stilt where the holding sets one. The flag shows the owner. */
const HSIZE={village:[30,22],town:[42,32],castle:[36,32]};
const seeded=s=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
function holdingSprite(t,col){
  col=col||facCol(t);const k='h'+t.name+col;if(spr[k])return spr[k];
  const [W,H]=HSIZE[t.kind],R=seeded(t.seed*7919+11),ri=(a,b)=>a+Math.floor(R()*(b-a+1)),pick=a=>a[ri(0,a.length-1)],style=t.style||t.races[0];
  return spr[k]=mkc(W,H,g=>{
    const r=(c,x,y,w,h)=>rect(g,c,x,y,w||1,h||1),flag=(x,y)=>{r('#5a3a20',x,y,1,8);r(col,x+1,y,4,3);r(shade(col,.7),x+1,y+2,4,1)};
    // building painters: x is the left edge, y the ground line; each returns the top point for a flag
    const B={
      human(x,y,w){const roof=pick(['#a14b38','#8a3d2d','#7a5a3a','#5a6a8a']),h=ri(5,7);r('#d8c8a0',x,y-h,w,h);r('#6a4a2a',x,y-h,1,h);r('#6a4a2a',x+w-1,y-h,1,h);r('#6a4a2a',x,y-Math.ceil(h/2),w,1);
        r(roof,x-1,y-h-2,w+2,2);r(roof,x,y-h-4,w,2);r(shade(roof,.75),x+1,y-h-5,w-2,1);r('#3a2418',x+(w>>1)-1,y-3,2,3);if(w>5)r('#8ab0d8',x+1,y-h+1,1,1);return[x+(w>>1),y-h-5]},
      dwarf(x,y,w){const h=ri(6,8),st=pick(['#7d8494','#6e7480','#8a8478']);r(st,x,y-h,w,h);r(shade(st,.75),x,y-h-1,w,1);r(shade(st,1.2),x+1,y-h,w-2,1);
        r('#3a3020',x+(w>>1)-1,y-5,3,5);r('#e8b94a',x+(w>>1),y-6,1,1);r(shade(st,.8),x+w-3,y-h-4,2,3);r('#9aa3ad',x+w-3,y-h-6,1,1);r('#c8ced8',x+w-2,y-h-8,1,1);return[x+1,y-h-1]},
      elf(x,y,w){const tr=x+(w>>1)-1,h=ri(12,15),leaf=pick(['#2f6a30','#3a7a3a','#2a5a3a']);r('#5a3a20',tr,y-h,2,h);r(leaf,x,y-h-5,w,6);r(shade(leaf,1.3),x+1,y-h-6,w-2,2);
        r('#c8e0a0',x+1,y-8,w-2,4);r('#e8f0d0',x+2,y-7,1,1);r('#7a9a5a',x+1,y-4,w-2,1);return[tr,y-h-6]},
      orc(x,y,w){const hide=pick(['#8a6a4a','#7a5a3a','#9a7a52']),h=ri(4,6);r(hide,x,y-h,w,h);for(let i=0;i<Math.ceil(w/2);i++)r(shade(hide,.8),x+i,y-h-i-1,Math.max(1,w-2*i),1);
        r('#2a1e14',x+(w>>1),y-3,1,3);r('#e8e4d0',x+(w>>1),y-h-Math.ceil(w/2)-1,1,1);return[x+(w>>1),y-h-Math.ceil(w/2)]},
      port(x,y,w){return B.human(x,y,w)},
      stilt(x,y,w){r('#5a4a34',x,y-3,1,3);r('#5a4a34',x+w-1,y-3,1,3);const top=B.orc(x,y-3,w);return top}
    };
    const build=style==='port'||style==='bridge'?'human':style==='stilt'?'stilt':style;
    const prop=(x,y)=>{const p=ri(0,3);
      if(style==='orc'){r('#5a3a20',x,y-8,1,8);r('#e8e4d0',x-1,y-10,3,2);r('#1a1410',x,y-9,1,1)}
      else if(style==='elf'){r('#e8c0d8',x,y-2,1,1);r('#f0e080',x+2,y-1,1,1);r('#e8c0d8',x+4,y-2,1,1)}
      else if(style==='dwarf'){r('#5d6472',x,y-3,4,3);r('#a7adba',x+1,y-3,2,1)}
      else if(p===0){r('#8a7a52',x,y-3,4,3);r('#6a5a3a',x,y-3,4,1)}else if(p===1){r('#7d8494',x,y-4,4,4);r('#3b6ca8',x+1,y-3,2,1)}else{r('#d8b860',x,y-3,3,3);r('#b89848',x,y-1,3,1)}};
    const water=()=>{r('#3b6ca8',0,H-4,W,4);r('#5b8fcb',ri(1,W-6),H-3,4,1);r('#5b8fcb',ri(1,W-6),H-2,3,1)};
    const ground=H-(style==='port'||style==='stilt'||style==='bridge'?4:1);
    let top=[W>>1,2];
    if(style==='port'||style==='stilt'||style==='bridge')water();
    if(t.kind==='castle'){
      if(style==='dwarf'){r('#6e7480',2,6,W-4,H-7);r('#5d6472',0,12,W,H-13);r('#8e95a6',4,6,W-8,2);r('#2a2418',(W>>1)-4,H-12,8,11);r('#e8b94a',(W>>1)-1,H-14,2,2);r('#3a3020',(W>>1)-3,H-10,6,9);r('#a7adba',6,10,3,3);r('#a7adba',W-9,10,3,3);top=[(W>>1),3]}
      else if(style==='elf'){r('#5a3a20',(W>>1)-2,6,4,H-7);r('#2f6a30',3,2,W-6,9);r('#3f8a3e',5,1,W-10,3);r('#5a3a20',4,14,W-8,2);r('#c8e0a0',6,10,6,4);r('#c8e0a0',W-12,10,6,4);r('#dfe4ea',(W>>1)-1,H-12,2,11);r('#7fd8e8',(W>>1)-1,H-13,2,1);top=[W-8,1]}
      else if(style==='orc'){for(let i=0;i<W;i+=2){r('#6a4a2a',i,H-9,2,8);r('#a07a4a',i,H-10,1,1)}B.orc((W>>1)-6,H-9,12);r('#5a3a20',4,H-18,1,9);r('#e8e4d0',3,H-20,3,2);r('#5a3a20',W-5,H-18,1,9);r('#e8e4d0',W-6,H-20,3,2);top=[(W>>1),H-22]}
      else{// stone castle: stone shade, tower count, cone roofs and keep height all come from the seed
        const st=pick(style==='port'?['#9aa0ae','#8e98a8']:['#a7adba','#b4aa98','#9a9488']),dk=shade(st,.75),roof=pick(['#5a6a8a','#a14b38','#4a5a3a',null]),kh=ri(10,16),wy=ground-ri(10,13);
        r(st,4,wy,W-8,ground-wy);r(dk,4,wy,W-8,1);for(let x=4;x<W-4;x+=3)r(st,x,wy-2,2,2);
        const keepX=(W>>1)-4;r(shade(st,1.08),keepX,wy-kh+4,8,kh);for(let x=keepX;x<keepX+8;x+=3)r(shade(st,1.08),x,wy-kh+2,2,2);r('#556',keepX+3,wy-kh+7,2,3);
        const towers=ri(2,3)===3?[0,W-7,ri(8,W-15)]:[0,W-7];
        towers.forEach((tx,i)=>{const th=ri(4,8),ty=Math.max(roof?5:2,wy-th);r(st,tx,ty,7,ground-ty);r(dk,tx,ty,7,1);if(roof){for(let j=0;j<4;j++)r(roof,tx+j,ty-1-j,7-2*j,1)}else{r(st,tx,ty-2,2,2);r(st,tx+5,ty-2,2,2)}r('#556',tx+3,ty+4,1,2)});
        r('#2a2418',(W>>1)-2,ground-6,4,6);r(dk,(W>>1)-3,ground-7,6,1);top=[(W>>1),Math.max(1,wy-kh+2)]}
    }else{
      const n=t.kind==='town'?ri(4,6):ri(2,3),rows=t.kind==='town'?[ground-9,ground]:[ground];
      if(t.kind==='town'){
        if(style==='orc')for(let i=0;i<W;i+=2){r('#6a4a2a',i,ground-5,2,5);r('#a07a4a',i,ground-6,1,1)}
        else if(style==='elf'){r('#2f6a30',0,ground-3,W,3);r('#3f8a3e',0,ground-4,W,1)}
        else if(style!=='port'){const st=style==='dwarf'?'#6e7480':'#9aa0ae';r(st,0,ground-3,W,3);for(let x=0;x<W;x+=4)r(st,x,ground-5,2,2)}
      }
      let placed=0;
      rows.forEach((y,ri_)=>{const per=ri_===0&&rows.length>1?Math.ceil(n/2):n-placed;let x=ri(1,4);
        for(let i=0;i<per&&x<W-5;i++){const w=build==='elf'?8:ri(5,8);const tp=B[build](x,y,Math.min(w,W-x-1));if(R()<.4||!placed)top=tp;x+=w+ri(1,3);placed++}});
      // a landmark for towns: church spire, forge, elf spire, totem, or a dock and boat for ports
      if(t.kind==='town'){const lx=ri(8,W-12);
        if(style==='human'){const lm=ri(0,3);
          if(lm===0){r('#cfc7b0',lx,ground-14,6,10);r('#8e95a6',lx+1,ground-20,4,6);r('#8e95a6',lx+2,ground-23,2,3);r('#e8c040',lx+2,ground-25,2,2);top=[lx+2,ground-25]}
          else if(lm===1){r('#d8c8a0',lx+1,ground-14,5,10);r('#8a3d2d',lx,ground-16,7,2);r('#e4e0cf',lx+3,ground-24,1,9);r('#e4e0cf',lx-1,ground-20,9,1);r('#6a4a2a',lx+3,ground-20,1,1)}
          else if(lm===2){r('#b4aa98',lx,ground-20,6,16);r('#8a3d2d',lx,ground-22,6,2);r('#8a3d2d',lx+1,ground-24,4,2);r('#e8e4d0',lx+1,ground-17,4,4);r('#1a1410',lx+3,ground-16,1,2);top=[lx+2,ground-24]}
          else{r('#a14b38',lx,ground-9,8,1);r('#e8c040',lx+1,ground-8,6,1);r('#6a4a2a',lx,ground-8,1,4);r('#6a4a2a',lx+7,ground-8,1,4);r('#d8b860',lx+2,ground-5,2,2);r('#78c474',lx+5,ground-5,1,2)}}
        else if(style==='dwarf'){r('#5d6472',lx,ground-12,7,8);r('#e8603a',lx+2,ground-8,3,3);r('#ffb04a',lx+3,ground-7,1,1);r('#8e95a6',lx+5,ground-17,2,5);r('#9aa3ad',lx+5,ground-19,1,1)}
        else if(style==='elf'){r('#dfe4ea',lx+2,ground-24,2,20);r('#7fd8e8',lx+2,ground-25,2,1);r('#dfe4ea',lx,ground-14,6,2);top=[lx+2,ground-25]}
        else if(style==='orc'){r('#6a4a2a',lx+2,ground-20,2,16);r('#c84040',lx,ground-20,6,3);r('#e8e4d0',lx+1,ground-16,4,3);r('#1a1410',lx+2,ground-15,1,1);r('#1a1410',lx+4,ground-15,1,1)}
      }
      if(style==='bridge'){const bx=ri(4,W-22);r('#9aa0ae',bx,H-7,18,3);r('#7d8494',bx,H-8,18,1);for(let i=0;i<3;i++){r('#9aa0ae',bx+1+i*6,H-4,2,4);r('#3b6ca8',bx+3+i*6,H-4,3,2)}top=[bx+9,H-16]}
      if(style==='port'){const dx=ri(2,W-14);r('#8b5a2b',dx,H-5,12,2);r('#6a4a2a',dx+2,H-3,1,3);r('#6a4a2a',dx+9,H-3,1,3);const bx=W-10;r('#6a4a2a',bx,H-4,8,2);r('#5a3a20',bx+4,H-14,1,10);r('#e8e4d0',bx+1,H-13,3,6);r(col,bx+4,H-15,3,1)}
      if(t.kind==='village')prop(W-6,ground);
    }
    flag(Math.max(0,Math.min(W-6,top[0])),Math.max(0,top[1]-8));
  });
}
function campSprite(i){const k='camp'+i;return spr[k]||(spr[k]=mkc(20,16,g=>{
  const R=seeded(i*131+7),ri=(a,b)=>a+Math.floor(R()*(b-a+1)),r=(c,x,y,w,h)=>rect(g,c,x,y,w,h),tents=ri(1,3);
  for(let n=0;n<tents;n++){const x=1+n*6+ri(0,2),c=['#7e2a26','#6a4a2a','#5a5a3a'][ri(0,2)];r(c,x,8,6,6);r(shade(c,1.3),x+1,6,4,3);r(shade(c,1.3),x+2,4,2,3);r('#1a1410',x+2,11,2,3)}
  r('#5b3a24',13,11,6,3);r('#e8b94a',15,10,2,2);r('#ff7a30',15,9,2,1);
  r('#5a3a20',ri(0,2),1,1,8);r('#1a1410',ri(1,3),1,3,3);r('#e4e0cf',2,2,1,1);
}))}
/* sites on the map: 20x16, varied by climate, kind and seed */
const ROCK={grass:['#7a6e5a','#9a8c74'],frost:['#9aa6b4','#eef3f8'],desert:['#b8885a','#d8b070'],swamp:['#5a6a4a','#7a8a5a']};
function siteSprite(s){const c=climAt(s.x,s.y),k='site'+s.type+s.seed+c+(s.kind!=null?s.kind:'');return spr[k]||(spr[k]=mkc(20,16,g=>{
  const R=seeded(s.seed),ri=(a,b)=>a+Math.floor(R()*(b-a+1)),r=(col,x,y,w,h)=>rect(g,col,x,y,w||1,h||1),[rk,rl]=ROCK[c];
  if(s.type==='cave'){r(shade(rk,.8),1,9,18,7);r(rk,3,5,14,6);r(rk,6,2,8,4);r(rl,7,2,5,1);r(rl,4,5,4,1);if(c==='frost'){r('#eef3f8',6,2,8,2);r('#eef3f8',3,5,4,1)}
    r('#1a1410',7,9,6,7);r('#1a1410',8,8,4,1);r('#3a2a20',8,10,4,6);r('#e8e4d0',ri(0,1)?2:15,14,2,1);r(shade(rk,.65),ri(0,3),13,2,3);r(shade(rk,.65),ri(15,17),12,2,4)}
  else if(s.type==='travelers'){const tc=TRAVELERS[s.kind].col,wx=ri(0,1)?0:11,tx=wx?0:11;
    r('#6a4a2a',wx+1,8,8,4);r('#e8e4d0',wx+2,4,6,4);r(shade('#e8e4d0',.8),wx+2,7,6,1);r('#1a1410',wx+2,12,2,2);r('#1a1410',wx+6,12,2,2);
    r(tc,tx+1,7,7,7);r(shade(tc,1.25),tx+2,5,5,3);r(shade(tc,1.25),tx+3,3,3,3);r('#1a1410',tx+3,10,3,4);
    r('#5b3a24',8,14,4,2);r('#e8b94a',9,12,2,2);r('#ff7a30',9,11,2,1)}
  else if(s.type==='hideout'){for(let x=0;x<20;x+=2){const h=ri(5,7);r('#6a4a2a',x,16-h,2,h);r('#a07a4a',x,16-h,1,1)}
    r('#5a4a3a',4,4,6,6);r('#7a5a3a',5,2,4,3);r('#6a2a26',11,5,6,5);r('#8a3a30',12,3,4,3);r('#1a1410',13,7,2,3);
    const fx=ri(1,3);r('#5a3a20',fx,0,1,8);r('#1a1410',fx+1,0,3,3);r('#e4e0cf',fx+2,1,1,1)}
  else if(s.type==='ruins'){const st=c==='desert'?'#d8b878':c==='frost'?'#c8d0dc':'#a7a49a',dk=shade(st,.7);
    r(dk,0,13,20,3);[[1,ri(6,10)],[6,ri(9,12)],[12,ri(4,8)],[16,ri(7,11)]].forEach(([x,h])=>{r(st,x,15-h,3,h);r(shade(st,1.15),x,15-h,1,h);r(dk,x,15-h,3,1)});
    r(st,6,3,9,2);r(dk,6,4,9,1);r(st,ri(9,10),13,4,2);r('#3f8a3e',ri(2,15),12,2,1)}
  else{if(c==='desert'){r('#c8a060',8,1,4,15);r('#e0b878',8,1,1,15);r('#e8c040',9,0,2,2);r('#7fd8e8',9,6,2,2)}
    else{const st=c==='frost'?'#b8c4d2':'#8a8a80';[[2,8],[8,11],[14,7]].forEach(([x,h],i)=>{r(st,x,16-h,4,h);r(shade(st,1.2),x,16-h,1,h);r('#7fd8e8',x+1,18-h+i,2,1)});r(shade(st,.7),0,15,20,1)}
    r('#e8b94a',ri(3,15),14,1,1);r('#e0605a',ri(3,15),15,1,1)}
}))}
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
function obstacleSprite(kind,clim){const k='ob'+kind+clim;return spr[k]||(spr[k]=outlined(mkc(14,16,g=>{
  const r=(c,x,y,w,h)=>rect(g,c,x,y,w,h);
  if(kind==='tree'){
    if(clim==='frost'){r('#5a3a20',6,12,2,4);r('#2a4a3a',2,8,10,5);r('#2a4a3a',3,4,8,4);r('#2a4a3a',5,1,4,3);r('#e8eef4',3,8,8,1);r('#e8eef4',4,4,6,1);r('#e8eef4',5,1,4,1)}
    else if(clim==='swamp'){r('#5a4a34',6,3,2,13);r('#5a4a34',3,5,3,1);r('#5a4a34',8,7,4,1);r('#2a3a24',2,0,10,4)}
    else{r('#5a3a20',6,10,2,6);r('#2a5a2a',1,3,12,8);r('#2f6a30',3,0,8,4);r('#3f8a3e',3,3,4,3)}
  }else if(kind==='cactus'){r('#5a8a3a',6,2,3,14);r('#5a8a3a',2,6,2,5);r('#5a8a3a',2,10,4,2);r('#5a8a3a',11,4,2,5);r('#5a8a3a',9,8,4,2);r('#7aaa50',7,3,1,12)}
  else{const d=clim==='desert';r(d?'#7a4a2e':'#5d6472',1,8,12,8);r(d?'#9a6a4a':'#7d8494',2,5,10,8);r(d?'#b5835a':'#a7adba',4,4,5,3);if(clim==='frost')r('#eef3f8',3,4,7,2)}
})))}
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
}):mkc(32,18,g=>{
  const r=(c,x,y,w,h)=>rect(g,c,x,y,w,h),S='#c8964a',D='#9a6a32',L='#e0b870';
  r(D,0,12,32,6);r(S,2,9,26,6);r(L,4,9,20,2);for(let i=0;i<6;i++)r(D,5+i*4,8,2,1);
  r(S,22,2,8,9);r(D,22,9,8,2);r('#e8e4d0',28,9,1,3);r('#e8e4d0',30,9,1,3);r('#e0605a',26,4,2,1);r('#5a3a1a',29,6,2,1);r('#d8b86a',0,15,32,3)
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
function txt(s,x,y,col,al){ctx.font='8px Silkscreen, "Courier New", monospace';ctx.textAlign=al||'left';ctx.textBaseline='alphabetic';ctx.fillStyle='#000';ctx.fillText(s,x+1,y+1);ctx.fillStyle=col||'#e4e0cf';ctx.fillText(s,x,y)}

/* how big a host looks: followers trail the banner, more of them the bigger the band */
/* how big a host looks: followers trail the banner, more of them the bigger the band */
const hostSize=n=>n<5?0:Math.min(14,Math.round(Math.sqrt(n)*1.7)-2);
function followerSprite(col,f){const k='fw'+col+f;return spr[k]||(spr[k]=outlined(mkc(5,8,g=>{const r=(c,x,y,w,h)=>rect(g,c,x,y,w||1,h||1);
  r(C.skin,1,0,3,2);r(shade(col,.55),1,0,3,1);r(col,1,2,3,3);r(shade(col,.7),1,4,3,1);r(C.dark,f?0:1,5,1,3);r(C.dark,f?3:2,5,1,3);r(C.wood,4,0,1,6);r('#c9ced8',4,0,1,1)})))}
