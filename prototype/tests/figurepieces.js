'use strict';
// Every figure in one piece (the owner, 2026-11-07: "recheck whether the body composition still match with the new sprites, check for
// all sprites"): each kind's picture, standing, walking, running, striking (swing, thrust, overhead) and guarding, bare (the battle's,
// its weapon apart) and whole (the map's and the cards', its weapon on it), and the folk and workers (their loads) walking, kneeling and
// down: no piece of it (a weapon, a shield, a cape, a bow, a load) apart from the rest; a bare one's weapon hand on him
Kit.suite(({ok,info})=>{const t=T;Kit.begin('soldier');
  const pieces=c=>{const w=c.width,h=c.height,d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,seen=new Uint8Array(w*h);let n=0;
    for(let i=0;i<w*h;i++){if(!d[i*4+3]||seen[i])continue;n++;const q=[i];seen[i]=1;while(q.length){const j=q.pop(),x=j%w,y=(j-x)/w;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const k=Y*w+X;if(d[k*4+3]&&!seen[k]){seen[k]=1;q.push(k)}}}}return n};
  const onHim=c=>{if(!c.hand)return true;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,[hx,hy]=c.hand;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=hx+dx,Y=hy+dy;if(X>=0&&Y>=0&&X<c.width&&Y<c.height&&d[(Y*c.width+X)*4+3])return true}return false};
  const kinds=Object.keys(t.PEOPLE_LOOK).filter(k=>t.ST[k]),bad=[],loose=[];let n=0;
  for(const k of kinds)for(const v of [0,1])for(const p of [0,3,4,15,7,10,13,27])for(const bare of [true,false]){const c=t.unitSprite(k,1,false,v,p,bare);n++;
    if(pieces(c)>1)bad.push(k+' v'+v+' p'+p+(bare?' bare':''));if(bare&&!onHim(c))loose.push(k+' p'+p)}
  const folk=[];for(const r of ['human','elf','dwarf','orc'])for(let v=0;v<3;v++){for(const j of ['farmer','herder','woodcutter','miner','fisher','builder'])folk.push(t.workerLook(j,r,v,true),t.workerLook(j,r,v,false));folk.push(t.refugeeLook(v,r),t.folkLook('priest',r,v),t.ENC_LOOK.traveller(r,v))}
  for(const L of folk)for(const p of [0,3])if(n++,pieces(t.peopleSprite(L,p,false))>1)bad.push((L.load||L.weapon||L.helm)+' '+L.race+' p'+p);
  for(const r of ['human','elf','dwarf','orc'])for(const fn of [t.figKneel,t.figDown])if(n++,pieces(fn('traveller',r,0))>1)bad.push('traveller '+r+' '+fn.name);
  info(n+' pictures');ok(!bad.length,'every figure in one piece: no weapon, shield, cape, bow or load apart from him ('+bad.length+': '+bad.slice(0,8).join('; ')+')');
  ok(!loose.length,'a bare figure\'s weapon hand on his body ('+loose.slice(0,8).join('; ')+')')});
