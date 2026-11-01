'use strict';
// Not a test (run by name: -Suites visual/mapfigs): a sheet of the map's people for the eye (the owner, 2026-11-01: "can you update
// encounters and old sprites to look like current sprite designs?"): each kind the old way (the map's small figures, at the map's
// own size) and the new (people.js MAP_FIGS: the battle's figures drawn WORLD_BATTLE.sprite/scale as big, as the marchers are),
// standing and walking, each way it faces, beside a marching soldier (march.js marchSprite's figure at the same size). Three
// blocks: 1, 2 and 4 screen pixels to a map pixel. Its picture is the IMG line, a PNG as a data URL
window.RUN=()=>{const o=[],t=T;
 try{
  window.requestAnimationFrame=()=>0;t.act('begin','soldier');
  const k=t.figK(),col='#c74453',band=t.ENC_RAIDER,soldier=(v,p)=>t.unitSprite('hum_spear',0,false,v,p,false,false,col),S=[soldier(1,0),k,1];
  // (a row: its label, [picture, scale (map px to its px), facing]; old ones at 1, new ones at k; a ship's hi at 1/z)
  const rows=[],add=(label,old,nu)=>rows.push([label,[...old.map(s=>[s,1,1]),null,...nu.map(q=>Array.isArray(q)?q:[q,k,1]),null,S]]);
  const walk=(f,mk)=>[0,2,4,6].map(i=>mk(i));
  for(const [key,race] of [['traveller','human'],['healed','human'],['peddler','human'],['pilgrim','dwarf'],['hunter','elf'],['hunter','human'],['child','human'],['bard','human'],['thief','orc'],['victim','human'],
    ['mourner','human'],['villager','elf'],['beggar','human'],['messenger','human'],['herbalist','human'],['ander','human']])
    add(key+' ('+race+')',[t.roadPerson(key,race,1,0),...walk(0,f=>t.roadPerson(key,race,1,f))],[t.figRoad(key,race,1,0),...[0,1,2,3].map(f=>t.figRoad(key,race,1,t.figPose(f,true))),[t.figRoad(key,race,1,3),k,-1]]);
  add('kneeling: pilgrim, herbalist, hunter, dwarf',[t.roadKneel('pilgrim','human',1),t.roadKneel('herbalist','human',0),t.roadKneel('hunter','human',1),t.roadKneel('villager','dwarf',2)],[t.figKneel('pilgrim','human',1),t.figKneel('herbalist','human',0),t.figKneel('hunter','human',1),t.figKneel('villager','dwarf',2),[t.figKneel('hunter','human',2),k,-1]]);
  add('down: wounded, Ander, shroud',[t.roadDown('traveller','human',0,1),t.roadDown('ander','human',0,1),t.roadDown('shroud','human',5)],[t.figDown('traveller','human',0,1),t.figDown('ander','human',0,1),t.figDown('shroud','human',5),t.figDown('traveller','orc',2)]);
  add('rider, a horse alone',[t.roadRider('messenger','human',0,0,'#3d74d6','chestnut'),t.roadRider('messenger','human',0,2,'#3d74d6','horseG'),t.roadHorse('horse',0),t.roadHorse('horseB',3)],
    [t.figRider('messenger','human',0,'#3d74d6','chestnut',0),t.figRider('messenger','human',0,'#3d74d6','horseG',3),t.figHorse('horse',0),t.figHorse('horseB',4)]);
  add('soldiers: a realm\'s',[0,1,2,3,4,5].map(v=>t.followerSprite('#3d74d6',v,v,'human')),[0,1,2,3,4,5].map(v=>t.figFollower('#3d74d6',v,'human',false,t.figPose(v,v%2===1))));
  add('soldiers: a band',[0,1,2,3,4,5].map(v=>t.followerSprite(band,v,v,'human',true)),[0,1,2,3,4,5].map(v=>t.figFollower(band,v,'human',true,t.figPose(v,v%2===1))));
  add('soldiers: dwarf, elf, orc',['dwarf','elf','orc'].map(r=>t.followerSprite('#3d74d6',0,2,r)),['dwarf','elf','orc'].map(r=>t.figFollower('#3d74d6',2,r,false,0)));
  add('refugees',[0,1,2,3].map(v=>t.refugeeSprite(v,v)),[0,1,2,3].map(v=>t.figRefugee(v,'human',t.figPose(v,true))).concat([t.figRefugee(1,'dwarf',0),t.figRefugee(2,'orc',0)]));
  const jobs=['farmer','herder','woodcutter','miner','fisher','builder'];
  add('workers',jobs.map(j=>t.workerSprite(j,0,'human',1)),jobs.map(j=>t.figWorker(j,'human',1,0)));
  add('workers, loaded',jobs.slice(0,5).concat(['quarry']).map(j=>t.workerSprite(j,2,'human',0,true)),jobs.slice(0,5).concat(['quarry']).map(j=>t.figWorker(j,'human',0,t.figPose(2,true),true)));
  const trades=[['farmer','farmer'],['herder','herder'],['woodcutter','woodcutter'],['miner','miner'],['fisher','fisher'],['quarryman','quarry']];
  rows.push(['on the march: a worker, his load',[...trades.map(([tr])=>[t.unitSprite(t.peasantKind('human',tr),0,false,1,0,false,false,'#bda882'),k,1]),null,...trades.map(([tr,j])=>[t.figCarrier(t.peasantKind('human',tr),1,'#bda882',j,2),k,1]),null,S]]);
  // (ships: the old picture; the new one's hi drawn back to the map's size)
  const ship=on=>{t.MAP_FIGS.on=on;try{return [t.shipSprite({seed:4,big:true,col:'#a8483a'}),t.shipSprite({seed:5,big:false}),t.shipSprite({seed:6,big:true,col:'#3d74d6',moored:true})]}finally{t.MAP_FIGS.on=true}};
  {const old=ship(false),nu=ship(true);rows.push(['ships',[...old.map(s=>[s,1,1]),null,...nu.map(s=>[s.hi,s.width/s.hi.width,1]),null,S]])}
  const block=K=>{const items=r=>r[1],wOf=q=>q?q[0].width*q[1]+3:6,hOf=q=>q?(q[0].height-t.opaqueBox(q[0])[1])*q[1]:0,lw=230/K,
    W=Math.max(...rows.map(r=>items(r).reduce((a,q)=>a+wOf(q),0)))+lw,hs=rows.map(r=>Math.max(...items(r).map(hOf))+4),H=hs.reduce((a,b)=>a+b,0)+10;return{K,W,H,hs,lw,wOf}};
  const B=[1,2,4].map(block),cv=document.createElement('canvas');cv.width=Math.ceil(Math.max(...B.map(b=>b.W*b.K)));cv.height=Math.ceil(B.reduce((a,b)=>a+b.H*b.K,0));
  const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#6f8a5a';g.fillRect(0,0,cv.width,cv.height);let Y=0;
  for(const b of B){const K=b.K;g.fillStyle='#fff';g.font='bold 12px Arial';g.fillText(K+'x: old | new | a marching soldier',4,Y+12);let y=10;
    rows.forEach((r,i)=>{const h=b.hs[i]-4;g.fillStyle='#f4f0e0';g.font='11px Arial';g.fillText(r[0],4,Y+(y+h)*K-2);let x=b.lw;
      for(const q of r[1]){if(!q){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(Math.round((x+2)*K),Y+y*K,Math.max(1,K/2),h*K);x+=6;continue}const [s,sc,face]=q;
        g.save();g.translate(Math.round((x+s.width*sc/2)*K),Math.round(Y+(y+h)*K));g.scale(face*sc*K,sc*K);g.drawImage(s,-(s.width>>1),-s.height);g.restore();x+=b.wOf(q)}
      y+=b.hs[i]});
    Y+=b.H*K}
  o.push('IMG '+cv.toDataURL('image/png'));o.push('PASS map figures sheet drawn ('+rows.length+' rows, '+cv.width+'x'+cv.height+')');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
