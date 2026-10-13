'use strict';
// Fog of war: you start knowing only what you can see; travel reveals the land. Land you have seen but are not looking at is
// remembered (its ground and buildings, as you last saw them) and nothing that moves shows on it; land you have never seen
// is dark. The save keeps what you have explored.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE,MW=t.MW,MH=t.MH;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;G.clock=t.DAY*.3;W.monsters=[];W.critters=[];t.bandits.length=0;W.caravans=[];W.folk=[];W.ships=[];W.patrols=[];W.refugees=[];
 const world=()=>{G.mode='world';G.modal=false;t.hidePanel()};world();t.drawWorld();
 const count=()=>t.seenArr().reduce((a,v)=>a+v,0),V=t.vis();
 ok(t.seenAt(P.x,P.y)&&!t.seenAt(P.x+V*3,P.y)&&count()<MW*MH*.05,'you start knowing only the land around you ('+count()+' tiles)');
 const c0=count();P.x+=V*1.5;t.drawWorld();ok(count()>c0&&t.seenAt(P.x,P.y),'travel reveals more of the map ('+c0+' → '+count()+' tiles)');P.x-=V*1.5;t.drawWorld();
 // what is dark, what is remembered, what you see
 const px=(x,y)=>{const d=t.ctx.getImageData(Math.round(x-G.cam.x),Math.round(y-G.cam.y),1,1).data;return[d[0],d[1],d[2]]};
 {let ux=null;for(let x=P.x+V+20;x<G.cam.x+t.VW-4&&ux==null;x+=8)if(!t.seenAt(x,P.y))ux=x;if(ux!=null){const c=px(ux+6,P.y+6);ok(c[0]<20&&c[1]<20&&c[2]<30,'land you have never seen is dark on the screen ('+c.join(',')+')')}else ok(true,'(no unseen land on screen)')}
 // a lord on land you know but cannot see now is not drawn; in your sight he is
 const spot={x:P.x+V+40,y:P.y};for(let k=-2;k<=2;k++)for(let j=-2;j<=2;j++)t.seenArr()[(Math.floor(spot.y/TILE)+j)*MW+Math.floor(spot.x/TILE)+k]=1;
 const L=W.lords.find(l=>!l.dead);const keep=[L.x,L.y,L.inside];L.inside=null;
 const shot=()=>{t.drawWorld();return t.ctx.getImageData(Math.round(spot.x-G.cam.x-10),Math.round(spot.y-G.cam.y-22),20,26).data};
 L.x=-9999;L.y=-9999;const a0=shot();L.x=spot.x;L.y=spot.y;const a1=shot();let diff=0;for(let i=0;i<a0.length;i++)if(Math.abs(a0[i]-a1[i])>6)diff++;
 ok(diff<12,'a lord on land you know but cannot see now is not shown ('+diff+' pixels differ)');
 L.x=P.x+30;L.y=P.y;spot.x=L.x;spot.y=L.y;const b1=shot();L.x=-9999;const b0=shot();let d2=0;for(let i=0;i<b0.length;i++)if(Math.abs(b0[i]-b1[i])>6)d2++;
 ok(d2>40,'in your sight he is ('+d2+' pixels)');[L.x,L.y,L.inside]=keep;
 // buildings outside your sight stay as you last saw them
 {const z=t.TOWNS.find(q=>q.lots&&q.lots.some(l=>l.k==='house'));const l=z.lots.find(q=>q.k==='house');P.x=(l.x+.5)*TILE;P.y=(l.y+1.5)*TILE;t.drawWorld();const seenAs=l._mem;
  const st0=l.st;l.st='ruined';l._s=null;P.x+=V+60;t.drawWorld();ok(l._mem===seenAs&&l._memSt===st0,'a house that burns while you are away still stands in your memory of '+z.name);l.st=st0;l._s=null}
 // the save keeps it
 world();const n0=count();t.saveGame(true);t.fogReset();t.loadGame();ok(count()===n0,'a save keeps what you have explored ('+count()+' tiles)');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
