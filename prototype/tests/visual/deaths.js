'use strict';
window.ARENA=true;
// Not a test (run by name: -Suites visual/deaths): the ways to die (sprites.js DEATHS, deathOf; the owner, 2026-11-03: "make sure
// all sprites has correct dead sprite and more variant of dead sprite"). Every kind's living sprite, its corpse as before
// (DEATHS.on false) and each of its deaths, each on its pool of its kind's blood (DEATHS.blood), at 2x (every kind) and 4x (one of each sort); then a field of 150 dead. Its pictures
// are the IMG lines, PNGs as data URLs: the 2x sheet, the 4x, the field, then the falls (each death's fall into it, at 4x)
Kit.suite(({o,ok})=>{const t=T,L=t.BattleLab,D=t.DEATHS;window.requestAnimationFrame=()=>0;
 L.start({leftGroups:[{type:'militia',count:1}],rightGroups:[{type:'militia',count:1}],morale:false,deploy:false,paused:true,ai:false,seed:3});
 try{
  // (the hunt's game as battle kinds, as battle/hunting.js makes them)
  for(const id in t.CRITTERS){const k='wild_'+id;if(!t.ST[k])t.ST[k]={n:t.CRITTERS[id].n,hp:10,dmg:0,spd:10,reach:2,range:0,cd:1,tier:1,beast:true,wildlife:id,arm:0}}
  const kinds=['hero',...Object.keys(t.ST).filter(k=>k!=='hero')],unit=(type,id)=>({id,type,team:type==='hero'?0:1,hero:type==='hero',v:0,face:1});
  // (each kind's deaths: the first id that draws each)
  const deaths=type=>{const seen=new Map();for(let id=1;id<600;id++){const u=unit(type,id),V=t.deathOf(u);if(!seen.has(V.name))seen.set(V.name,u)}return [...seen].sort((a,b)=>a[0]<b[0]?-1:1)};
  // (one drawn lying, settled; blood: its pool spread)
  const cell=(u,on,blood,W,H,gx,gy)=>{D.on=on;const c={x:gx,y:gy,team:1,face:1,sp:t.corpseOf(u),td:0,dry:!blood,pool:7,seed:1,wi:3,wx:7,wy:2,skin:t.PPAL.wood[2]};t.DEATH_OF.set(c,u);
   const cv=t.mkc(W,H,g=>{t.drawBody(g,c,1,blood?1:0)});D.on=true;return cv};
  const live=u=>{const s=t.actorSprite(u,0);return t.mkc(s.width,s.height,g=>g.drawImage(s,0,0))};
  const rows=[];
  for(const k of kinds){const u=unit(k,1),S=t.ST[k]||{},big=k==='dragon'?2:S.beast?1:t.corpseOf(u).mount?1:0,W=[48,80,104][big],H=[32,56,72][big],gx=W>>1,gy=H-(big===1?18:12);
   rows.push([k,[live(u),cell(u,false,true,W,H,gx,gy),...deaths(k).map(([n,v])=>cell(v,true,true,W,H,gx,gy))],['live','before',...deaths(k).map(d=>d[0])]])}
  const sheet=(rs,K)=>{const lw=110,Wd=lw+Math.max(...rs.map(([,L])=>L.reduce((a,s)=>a+(s.width+6)*K,0))),Ht=rs.reduce((a,[,L])=>a+(Math.max(...L.map(s=>s.height))+6)*K+14,0),cv=document.createElement('canvas');cv.width=Wd;cv.height=Ht;
   const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#6f8a5a';g.fillRect(0,0,Wd,Ht);let y=0;
   for(const [label,L,names] of rs){const h=Math.max(...L.map(s=>s.height));g.fillStyle='#fff';g.font='bold 11px Arial';g.fillText(label,4,y+(h*K+14)/2);let x=lw;g.font='10px Arial';
    L.forEach((s,i)=>{if(i===2&&names[0]==='live'){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x-3,y,2,h*K+14)}g.fillStyle='#fff';g.fillText(names[i],x,y+11,(s.width+4)*K);g.drawImage(s,x,y+14+(h-s.height)*K,s.width*K,s.height*K);x+=(s.width+6)*K});y+=(h+6)*K+14}
   return cv};
  const s2=sheet(rows,2);o.push('IMG '+s2.toDataURL('image/png'));
  // (4x: one of each sort)
  const four=['hero','hum_foot','hum_spear','hum_bow','hum_crossbow','hum_mage','dw_iron','elf_blade','orc_black','hum_knight','hum_lancer','orc_wolf','dw_ram','elf_hart','brann','tavi','wolf','troll','spider','scorpion','slime','wyrm','bear','griffin','boar','tiger','dragon','wild_deer','wild_cow','wild_hen'];
  const s4=sheet(rows.filter(r=>four.includes(r[0])),4);o.push('IMG '+s4.toDataURL('image/png'));
  // (a field of 150 dead: mixed kinds, bleeding, at 2x)
  const mix=['hum_foot','hum_spear','hum_bow','hum_knight','orc_grunt','orc_wolf','dw_axe','elf_archer','militia','wolf','spider','slime','troll','hum_lancer','boar'],FW=560,FH=300,
   field=t.mkc(FW,FH,g=>{g.fillStyle='#6f8a5a';g.fillRect(0,0,FW,FH);const cs=[];for(let i=0;i<150;i++){const u=unit(mix[i%mix.length],i*37+11),c={x:20+(i*97)%(FW-40),y:20+((i*53)%(FH-40)),team:1,face:i%3?1:-1,sp:t.corpseOf(u),td:0,dry:false,pool:7,seed:i%4,wi:i%5,wx:3+i%7,wy:1+i%3,skin:t.PPAL.wood[2]};t.DEATH_OF.set(c,u);cs.push(c)}
    cs.sort((a,b)=>a.y-b.y);for(const c of cs)t.drawBody(g,c,1,1)}),
   F=t.mkc(FW*2,FH*2,g=>{g.imageSmoothingEnabled=false;g.drawImage(field,0,0,FW*2,FH*2)});
  o.push('IMG '+F.toDataURL('image/png'));
  // (falls: each death's fall into it, at 4x: q 0 to 1)
  const Q=[0,.15,.3,.45,.6,.8,1],fall=(k,n)=>{const u=deaths(k).find(d=>d[0]===n)[1],S=t.ST[k]||{},big=S.beast||t.corpseOf(u).mount?1:0,W=[48,80][big],H=[40,56][big];
   return [k+' '+n,Q.map(q=>{const c={x:W>>1,y:H-14,team:1,face:1,sp:t.corpseOf(u),td:0,dry:true,pool:7,seed:1,wi:3,wx:7,wy:2,skin:t.PPAL.wood[2]};t.DEATH_OF.set(c,u);return t.mkc(W,H,g=>t.drawBody(g,c,q,0))}),Q.map(q=>'q '+q)]};
  const falls=[...['face','back','curl','knees','flung'].map(n=>fall('hum_foot',n)),fall('hum_knight','face|across|belly'),fall('hum_knight','back|under|side'),fall('wolf','back'),fall('wolf','slump'),fall('troll','back'),fall('slime','burst'),fall('spider','curl'),fall('wild_deer','back')];
  o.push('IMG '+sheet(falls,4).toDataURL('image/png'));
  ok(true,'death sheets drawn ('+rows.length+' kinds; '+s2.width+'x'+s2.height+', '+s4.width+'x'+s4.height+')');
 }finally{D.on=true;if(L.active)L.exit()}});
