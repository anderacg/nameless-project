'use strict';
/* ---------- art: sprite sheets from graphics/ ---------- */
// Pictures load in the background; until a sheet has loaded (or if it is missing) the generated sprites are drawn instead.
// A sheet: file (with {C} for a colour: Cyan, Red, Lime, Purple), frame size fw, and animations walk / atk as [right row, left row, frames].
// Most sheets keep 4 rows per animation (down, up, right, left); a left row of null mirrors the right one.
const ART_DIR='graphics/',ART_COLS=['Cyan','Red','Lime','Purple'];
const A=(base,n,r=2,l=3)=>[base+r,l==null?null:base+l,n];
const CH='Characters/',MEL=CH+'Soldiers/Melee/{C}Melee/',RNG=CH+'Soldiers/Ranged/{C}Ranged/',MON=CH+'Monsters/',CHA=CH+'Champions/';
const SHEETS={
  sword:{f:MEL+'Swordsman{C}.png',walk:A(0,5),atk:A(4,4)},
  spear:{f:MEL+'Spearman{C}.png',walk:A(0,5)},
  axe:{f:MEL+'Axeman{C}.png',walk:A(0,5)},
  hood:{f:MEL+'Assasin{C}.png',walk:A(0,5),atk:A(4,4)},
  bow:{f:RNG+'Bowman{C}.png',walk:A(0,5),atk:A(4,3)},
  musket:{f:RNG+'Musketeer{C}.png',walk:A(0,5),atk:A(4,4)},
  mage:{f:RNG+'Mage{C}.png',walk:A(0,4)},
  farmer:{f:CH+'Workers/{C}Worker/Farmer{C}.png',walk:A(0,5)},
  knight:{f:CH+'Soldiers/Mounted/{C}Knight.png',fw:32,walk:[3,6,4],atk:[5,8,4]},
  orc:{f:MON+'Orcs/Orc.png',walk:A(0,5),atk:A(4,6)},
  clubgob:{f:MON+'Orcs/ClubGoblin.png',walk:A(0,5),atk:A(4,3)},
  speargob:{f:MON+'Orcs/SpearGoblin.png',walk:A(0,5)},
  archgob:{f:MON+'Orcs/ArcherGoblin.png',walk:A(0,5),atk:A(4,3)},
  pgrunt:{f:MON+'Pirates/PirateGrunt.png',walk:A(0,5),atk:A(4,5)},
  pcapt:{f:MON+'Pirates/PirateCaptain.png',walk:A(0,5),atk:A(4,4)},
  pgun:{f:MON+'Pirates/PirateGunner.png',walk:A(0,5),atk:A(4,4)},
  yeti:{f:MON+'Frostborn/Yeti.png',walk:A(0,5),atk:A(4,6)},
  crab:{f:MON+'GiantAnimals/GiantCrab.png',walk:A(0,3)},
  shaman:{f:MON+'Orcs/OrcShaman.png',walk:A(0,5),atk:A(4,5)},
  slime:{f:MON+'Slimes/Slime.png',walk:A(0,6)},
  dragon:{f:MON+'Dragons/RedDragon.png',fw:32,walk:A(0,4,3,2),atk:A(4,2,3,2)},
  wyrm:{f:MON+'Dragons/YellowDragon.png',fw:32,walk:A(0,4,3,2),atk:A(4,2,3,2)},
  arthax:{f:CHA+'Arthax.png',walk:A(0,5),atk:A(4,5)},
  borg:{f:CHA+'Börg.png',walk:A(0,5),atk:A(4,6)},
  okomo:{f:CHA+'Okomo.png',walk:A(0,5),atk:A(4,4)},
  katan:{f:CHA+'Katan.png',walk:A(0,5),atk:A(4,6)},
  kanji:{f:CHA+'Kanji.png',walk:A(0,5),atk:A(4,6)},
  gangblanc:{f:CHA+'Gangblanc.png',walk:A(0,5),atk:A(4,8)},
  boar:{f:'Animals/Boar.png',walk:A(0,4)},
  pig:{f:'Animals/Pig.png',walk:A(0,4)},
  sheep:{f:'Animals/Sheep.png',walk:A(0,4)},
  goat:{f:'Animals/HornedSheep.png',walk:A(0,4)},
  hen:{f:'Animals/Chicken.png',walk:A(0,4,3,2)},
  horse:{f:'Animals/Horse(32x32).png',fw:32,walk:[2,null,4]}
};
// which sheet each fighter wears; bandits are pirates, dwarves axemen and musketeers, elves hooded blades and bowmen
const UNIT_ART={militia:'pgrunt',spearman:'spear',archer:'pgun',ranger:'bow',horse:'knight',chief:'pcapt',
  hum_levy:'farmer',hum_spear:'spear',hum_guard:'sword',hum_pike:'spear',hum_bow:'bow',hum_long:'bow',hum_squire:'knight',hum_knight:'knight',
  dw_clan:'axe',dw_axe:'axe',dw_iron:'axe',dw_berserk:'axe',dw_sling:'musket',dw_xbow:'musket',dw_ram:'knight',dw_ramlord:'knight',
  elf_glade:'hood',elf_dancer:'hood',elf_blade:'hood',elf_sentinel:'spear',elf_archer:'bow',elf_marks:'bow',elf_sharp:'bow',elf_hart:'knight',elf_lance:'knight',
  orc_grunt:'clubgob',orc_brute:'orc',orc_ironjaw:'orc',orc_reaver:'orc',orc_thrower:'speargob',orc_hunter:'archgob',
  hum_mage:'mage',dw_rune:'mage',elf_weaver:'mage',orc_shaman:'shaman',hedge:'mage',slime:'slime',boar:'boar',troll:'yeti',scorpion:'crab',wyrm:'wyrm',dragon:'dragon',brann:'gangblanc',elske:'mage',tavi:'kanji'};
const HERO_ART={human:'arthax',dwarf:'borg',elf:'okomo',orc:'katan'};
const CRITTER_ART={pig:'pig',sheep:'sheep',hen:'hen',goat:'goat',ibex:'goat'};
// building colours by owner; the Horde builds orc huts, your own banner plain wood
const OWNER_SET={vale:'Red',karn:'Cyan',sylvan:'Purple',horde:'orc',salt:'Lime',player:'Wood'};
const LORD_COL={vale:'Red',karn:'Cyan',sylvan:'Purple',horde:'Lime',salt:'Red'};
const TEAM_COL=['Cyan','Red'];
const BLD=['Keep','Houses','Huts','Market','Taverns','Chapels','Docks','Well'];
const MISC={cave:'Buildings/Wood/CaveV2.png',ruin:'Buildings/Enemy/Mausoleum.png',portal:'Miscellaneous/Portal.png',wall:'Buildings/Enemy/SpearWall.png',orcb:'Buildings/Enemy/Orc/AllBuildings-Preview.png',
  trees:'Nature/Trees.png',wtrees:'Nature/WinterTrees.png',dtrees:'Nature/DeadTrees.png',cactus:'Nature/Cactus.png',rocks:'Nature/Rocks.png',wheat:'Nature/Wheatfield.png'};
const sheetFile=(k,c)=>SHEETS[k].f.replace(/\{C\}/g,c||'Red');
const bldFile=(set,n)=>set==='Wood'?'Buildings/Wood/'+n+'.png':'Buildings/'+set+'/'+set+n+'.png';
// every picture: ok once loaded, bad if missing
// mode 'pack' loads the sheets; 'procedural' loads nothing and draws everything with the generated sprites
const ART_KEY='ashmark.art';
window.ART={ready:false,loaded:false,started:false,img:{},failed:[],mode:(()=>{try{return localStorage.getItem(ART_KEY)==='procedural'?'procedural':'pack'}catch(e){return 'pack'}})()};
function loadArt(){
  if(ART.started)return;ART.started=true;const files=new Set();
  for(const k in SHEETS)(SHEETS[k].f.includes('{C}')?ART_COLS:[null]).forEach(c=>files.add(sheetFile(k,c)));
  ['Red','Cyan','Lime','Purple','Wood'].forEach(s=>BLD.forEach(n=>{if(!(s==='Wood'&&n==='Well'))files.add(bldFile(s,n))}));
  Object.values(MISC).forEach(f=>files.add(f));
  let left=files.size;
  const settle=()=>{if(--left)return;ART.loaded=true;ART.ready=ART.mode==='pack';for(const k in spr)delete spr[k];if(typeof updateHUD==='function'&&G.mode!=='title')updateHUD(true)};
  files.forEach(f=>{const i=new Image();ART.img[f]=i;i.onload=()=>{i.ok=true;settle()};i.onerror=()=>{ART.failed.push(f);settle()};i.src=ART_DIR+f.split('/').map(encodeURIComponent).join('/')});
}
const artImg=f=>{const i=ART.img[f];return i&&i.ok?i:null};
// the sheet and picture for a fighter, or null to draw the generated sprite
function unitArt(type,team,hero){
  const k=hero?HERO_ART[P.race]:UNIT_ART[type];if(!k||!ART.ready)return null;
  const img=artImg(sheetFile(k,TEAM_COL[team]||'Red'));return img?{sh:SHEETS[k],img}:null;
}
function sheetArt(k,c){if(!ART.ready||!SHEETS[k])return null;const img=artImg(sheetFile(k,c));return img?{sh:SHEETS[k],img}:null}
// draw one frame with its feet at (x,y); face -1 looks left
function drawArt(a,anim,frame,face,x,y,scale,alpha){
  const sh=a.sh,fw=sh.fw||16,an=sh[anim]||sh.walk,[r,l,n]=an,left=face<0,row=left&&l!=null?l:r,flip=left&&l==null,z=scale||1;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);if(alpha!=null)ctx.globalAlpha=alpha;
  ctx.drawImage(a.img,(Math.max(0,frame)%n)*fw,row*fw,fw,fw,-Math.round(fw*z/2),-Math.round(fw*z)+Math.round(2*z),Math.round(fw*z),Math.round(fw*z));ctx.restore();
}
/* buildings: holdings composed from the building sheets, seeded per holding */
function holdingArt(t,col){
  if(!ART.ready)return null;const set=OWNER_SET[t.owner]||'Wood',R=seeded(t.seed*7919+3),ri=(a,b)=>a+Math.floor(R()*(b-a+1));
  const orc=set==='orc',ob=artImg(MISC.orcb),get=n=>artImg(bldFile(set,n));
  if(orc?!ob:!get('Houses'))return null;
  const W=t.kind==='town'?48:t.kind==='castle'?36:36,H=t.kind==='village'?24:36;
  return mkc(W,H,g=>{
    const cell=(img,cx,cy,x,y,s)=>{s=s||16;if(img)g.drawImage(img,cx*s,cy*s,s,s,x,y,s,s)};
    const flag=(x,y)=>{rect(g,'#5a3a20',x,y,1,8);rect(g,col,x+1,y,4,3);rect(g,shade(col,.7),x+1,y+2,4,1)};
    if(orc){
      if(t.kind==='castle'){cell(ob,ri(0,3),ri(0,1),2,4,32);flag(W-6,0)}
      else if(t.kind==='town'){cell(ob,ri(0,3),ri(0,1),8,0,32);cell(ob,ri(1,4),4,0,20);cell(ob,ri(1,4),5,32,20);flag(W-6,0)}
      else{cell(ob,ri(1,4),4,2,8);cell(ob,ri(1,4),5,18,6);flag(W-6,0)}
      return;
    }
    if(t.kind==='castle'){cell(get('Keep'),ri(0,2),ri(0,1),2,4,32);flag(W-6,0);return}
    if(t.kind==='town'){
      cell(get('Market'),ri(0,2),ri(1,3),0,4);cell(get('Taverns'),ri(1,2),ri(0,3),16,2);cell(get('Chapels'),ri(0,2),1,32,4);
      cell(get('Houses'),ri(0,2),ri(1,3),6,18);
      if(t.style==='port')cell(get('Docks'),2,0,24,20);else cell(get('Houses'),ri(0,2),ri(1,3),24,18);
      flag(W-6,0);return;
    }
    const wheat=artImg(MISC.wheat);if(wheat&&!t.style)cell(wheat,ri(1,3),0,10,8);
    cell(get('Houses'),ri(0,2),ri(1,3),1,6);cell(get('Huts'),ri(1,4),0,19,8);
    if(t.style==='port')cell(get('Docks'),2,0,19,8);
    flag(W-6,0);
  });
}
/* sites */
function siteArt(s){
  if(!ART.ready)return null;const R=seeded(s.seed),ri=(a,b)=>a+Math.floor(R()*(b-a+1));
  if(s.type==='cave'){const i=artImg(MISC.cave);return i&&mkc(20,16,g=>g.drawImage(i,ri(0,2)*16,ri(0,1)*16,16,16,2,0,16,16))}
  if(s.type==='ruins'){const i=artImg(MISC.ruin);return i&&mkc(32,28,g=>g.drawImage(i,ri(0,1)*32,0,32,32,0,-4,32,32))}
  if(s.type==='shrine'){const i=artImg(MISC.portal);return i&&mkc(20,16,g=>g.drawImage(i,ri(0,3)*16,0,16,16,2,0,16,16))}
  if(s.type==='hideout'){const i=artImg(MISC.wall);return i&&mkc(32,20,g=>{g.drawImage(campSprite(s.i+40),6,0);for(let k=0;k<2;k++)g.drawImage(i,ri(0,2)*16,0,16,16,k*16,6,16,16)})}
  return null;
}
/* battle obstacles: trees, cacti and rocks by climate */
function obstacleArt(kind,clim){
  if(!ART.ready)return null;
  if(kind==='rock'){const i=artImg(MISC.rocks);return i&&mkc(16,16,g=>g.drawImage(i,16,(clim==='frost'?3:clim==='swamp'?1:0)*16,16,16,0,0,16,16))}
  if(kind==='cactus'){const i=artImg(MISC.cactus);return i&&mkc(16,16,g=>g.drawImage(i,16*1,0,16,16,0,0,16,16))}
  if(kind==='tree'){const [f,cx,cy]=clim==='frost'?[MISC.wtrees,1,3]:clim==='swamp'?[MISC.dtrees,2,0]:clim==='desert'?[MISC.cactus,2,0]:[MISC.trees,1,0];const i=artImg(f);return i&&mkc(16,16,g=>g.drawImage(i,cx*16,cy*16,16,16,0,0,16,16))}
  return null;
}
/* the hero and parties on the world map */
function drawHeroMap(x,y,moving){
  const a=sheetArt(HERO_ART[P.race]);if(!a)return false;const f=moving?Math.floor(performance.now()/130):0,m=mountDef();
  if(m){const h=sheetArt('horse');if(h){drawArt(h,'walk',f,P.dir,x,y+2,1);
    ctx.save();ctx.beginPath();ctx.rect(x-12,y-30,24,20);ctx.clip();drawArt(a,'walk',0,P.dir,x+(P.dir>0?-1:1),y-7,1);ctx.restore();return true}}
  drawArt(a,'walk',f,P.dir,x,y,1);return true;
}
function drawLordMap(l,x,y){const a=sheetArt('knight',LORD_COL[l.fac]||'Red');if(!a)return false;drawArt(a,'walk',l.state==='rest'||l.state==='siege'?0:Math.floor(performance.now()/150),l.x>P.x?-1:1,x,y+2,1);return true}
// switch modes: procedural stops using the sheets at once; pack loads them (once) and uses them when ready
function setArtMode(m){
  ART.mode=m==='procedural'?'procedural':'pack';try{localStorage.setItem(ART_KEY,ART.mode)}catch(e){}
  if(ART.mode==='pack'){if(ART.loaded)ART.ready=true;else loadArt()}else ART.ready=false;
  for(const k in spr)delete spr[k];if(typeof updateHUD==='function')updateHUD(true);const b=document.getElementById('artBtn');if(b)b.textContent=artLabel();
}
const artLabel=()=>'Art: '+(ART.mode==='pack'?'Sprites':'Procedural');
if(ART.mode==='pack')loadArt();
