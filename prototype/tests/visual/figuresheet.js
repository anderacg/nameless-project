'use strict';
// Not a test (run by name: -Suites visual/figuresheet): a sheet of figures and their gear (figures.js), drawn 4x, for the eye: rows of
// the battle's finished figures (standing, walking, a blow, a raised shield, a crossbow spanned, a bow put away in melee, a rider
// off his horse with his lance, your hero with a shield in his off hand), the battle's bodies with the weapon held apart (march,
// rest), and the map's small people. Its picture is the IMG line, a PNG as a data URL
window.RUN=()=>{const o=[],t=T,P=t.P;
 try{
  window.requestAnimationFrame=()=>0;t.act('begin','soldier');
  const K=4,rows=[],add=(label,list)=>rows.push([label,list]);
  const kinds=['hum_spear','hum_pike','hum_guard','hum_bow','hum_long','hum_xbow','hum_knight','hum_lancer','dw_axe','dw_iron','elf_sentinel','elf_blade','orc_brute','orc_warrior','hum_mage','hum_sergeant'];
  add('standing',kinds.map(k=>t.unitSprite(k,0,false,1,0)));
  add('walking',kinds.map(k=>t.unitSprite(k,0,false,2,3)));
  add('a blow / a shot',kinds.map(k=>t.unitSprite(k,1,false,3,10)));
  add('shield up, reload',kinds.map(k=>t.unitSprite(k,1,false,4,t.DEF_POSE===27&&t.ST[k].range?13:t.DEF_POSE)));
  add('melee mode, afoot',[...['hum_bow','hum_long','hum_xbow','elf_archer','orc_hunter'].map(k=>t.unitSprite(k,0,false,0,0,false,true)),...['hum_knight','hum_lancer','elf_lance','dw_ram','orc_wolf'].map(k=>t.unitSprite(k,0,false,0,0,false,false,null,true))]);
  // (your hero: a sword, then a shield in his off hand too, then a bow)
  const sh=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].icon==='shield'),sw=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].base==='sword'||t.ITEMS[k].icon==='blade'),bw=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].kind==='ranged');
  const hero=[];P.gear.weapon=sw;P.gear.offhand=null;hero.push(t.unitSprite('hero',0,true,0,0));P.gear.offhand=sh;hero.push(t.unitSprite('hero',0,true,0,0),t.unitSprite('hero',0,true,0,3),t.unitSprite('hero',0,true,0,t.DEF_POSE));
  P.gear.offhand=null;P.gear.weapon=bw;hero.push(t.unitSprite('hero',0,true,0,0),t.unitSprite('hero',0,true,0,10),t.unitSprite('hero',0,true,0,0,false,true));add('your hero',hero);
  add('battle bodies (bare)',kinds.map(k=>t.unitSprite(k,0,false,1,0,true)));
  const map=[];for(const r of ['human','dwarf','elf','orc'])for(let v=0;v<6;v++)map.push(t.followerSprite('#3d74d6',2,v,r));for(const j of ['farmer','woodcutter','miner','fisher'])map.push(t.workerSprite(j,1,'human',0),t.workerSprite(j,1,'human',1,true));
  add('the map\'s people',map);
  // (the map's banners: each realm's standard, yours, a companion's, a guard's pennant and the night watch's, a band's rag, a caravan's)
  const bn=[...Object.keys(t.FACS).filter(k=>t.BANNER_DEV[k]).map(k=>({k:'banner',col:t.FACS[k].col,dev:k})),{k:'banner',col:t.FACS.player.col,dev:'crown'},{k:'banner',col:t.FACS.player.col,dev:'star'},
    {k:'pennant',col:t.FACS.vale.col,dev:'vale'},{k:'pennant',col:t.WATCH.night.pennant,dev:'lantern'},{k:'rag',col:t.BAND_FLAG.bandits,dev:'skull'},{k:'trade',col:'#c74453',dev:'coin'}];
  add('banners',bn.flatMap(b=>[t.bannerSprite(b,0),t.bannerSprite(b,1)]));
  const W=Math.max(...rows.map(([l,L])=>L.reduce((a,s)=>a+s.width+4,0))),H=rows.reduce((a,[l,L])=>a+Math.max(...L.map(s=>s.height))+6,0),cv=document.createElement('canvas');cv.width=(W+90)*K;cv.height=H*K;
  const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#6f8a5a';g.fillRect(0,0,cv.width,cv.height);let y=0;
  for(const [label,L] of rows){const h=Math.max(...L.map(s=>s.height));g.fillStyle='#fff';g.font='12px Arial';g.fillText(label,4,(y+h/2)*K);let x=90;for(const s of L){g.drawImage(s,x*K,(y+h-s.height)*K,s.width*K,s.height*K);x+=s.width+4}y+=h+6}
  o.push('IMG '+cv.toDataURL('image/png'));o.push('PASS figure sheet drawn ('+rows.length+' rows)');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
