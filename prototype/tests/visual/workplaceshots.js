'use strict';
// Not a test: workplaces where they make sense (tests/workplaces.js), seen in the game at its zoom: a mine at the rock, a quarry,
// a lumber camp in the woods (on the grass where one is), a desert pasture of camels, a frost pasture of reindeer and a swamp one of water buffalo, the first
// of each found over the classic world and Normal s1-s4. Each drawn by drawWorld (the fog lifted, by day, its workers about) with
// a x3 crop of its middle, printed as "SHOT <name> <data URL>" lines (decode them into PNGs)
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W,TL=16;
try{
 window.requestAnimationFrame=()=>0;(0,eval)('drawWorldFog=function(){}');const shots=[],want={mine:1,quarry:1,lumber:1,camel:1,tamereindeer:1,buffalo:1};
 const snap=(name,x,y)=>{P.x=x;P.y=y;P.tx=null;G.clock=t.DAY*.3;W.folk=[];for(let i=0;i<240;i++)t.updateFolk(.05);
  t.drawWorld();t.drawWorld();const cv=t.cv;shots.push(['SHOT '+name,cv.toDataURL('image/png')]);
  const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const g=c.getContext('2d', { willReadFrequently: true });g.imageSmoothingEnabled=false;const w=Math.round(cv.width/3),h=Math.round(cv.height/3);
  g.drawImage(cv,Math.round((cv.width-w)/2),Math.round((cv.height-h)/2),w,h,0,0,w*3,h*3);shots.push(['SHOT '+name+'_x3',c.toDataURL('image/png')]);o.push('INFO '+name+' at '+Math.round(x/TL)+','+Math.round(y/TL))};
 for(const S of [null,...[1,2,3,4].map(k=>({preset:'normal',seed:'s'+k}))]){
  if(!Object.keys(want).length)break;
  Math.random=t.seeded(4242);t.begin('soldier',S||undefined);G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  W.seen&&W.seen.fill&&W.seen.fill(1);const wn=S?S.seed:'classic';
  for(const k of ['mine','quarry','lumber']){if(!want[k])continue;const ok=q=>q.lots&&t.lotAt(q,k)&&t.bldLv(q,k)&&(k==='lumber'||t.rockYaw(t.lotAt(q,k))!=null),z=t.TOWNS.find(q=>ok(q)&&t.climAt(q.x,q.y)==='grass')||t.TOWNS.find(ok);if(!z)continue;const l=t.lotAt(z,k);
   snap(k+'_'+wn+'_'+z.name.replace(/\W/g,''),(l.x+l.n/2)*TL,(l.y+l.n/2)*TL);delete want[k]}
  for(const z of t.TOWNS){const c=t.herdOf(z);if(!c||!c.pen||!want[c.id])continue;const F=t.fieldsOf(z,'pasture');if(!F)continue;
   snap('pasture_'+c.id+'_'+t.pastureLand(z)+'_'+wn+'_'+z.name.replace(/\W/g,''),F.x,F.y);delete want[c.id]}}
 if(Object.keys(want).length)o.push('INFO not found: '+Object.keys(want).join(', '));
 for(const [k,v] of shots)o.push(k+' '+v);
 o.push('PASS workplaceshots: '+shots.length+' pictures');
}catch(e){o.push('EXC '+e.message+'\n'+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
