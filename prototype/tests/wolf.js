'use strict';
// Approved wolf pixels through the production animation, map and corpse renderers.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,PX=t.PX,api=PX.wolf,A=PX.WOLF_ART;t.act('begin','soldier');
 const pixels=c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).join();
 ok(A.frames.length===108&&Object.keys(A.clips).length===14&&A.map.frames.length===8,'all 116 approved combat and map frames are available synchronously');
 const clips=Object.keys(A.clips),images=clips.flatMap(n=>Array.from({length:A.clips[n][1]},(_,i)=>t.unitSprite('wolf',1,false,0,api.pose(n,i))));
 ok(images.every(c=>c.width===64&&c.height===64&&c.ch>0),'combat clips share a padded 64-pixel cell and a standing height');
 const badPixels=[];
 for(let frame=0;frame<images.length;frame++){
  const c=images[frame],w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data,on=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&d[(y*w+x)*4+3],seen=new Uint8Array(w*h);let components=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x;if(d[i*4+3]!==0&&d[i*4+3]!==255)badPixels.push(frame+' alpha');
   if(!on(x,y)&&on(x-1,y)&&on(x+1,y)&&on(x,y-1)&&on(x,y+1))badPixels.push(frame+' hole');
   if(!on(x,y)||seen[i])continue;components++;const q=[i];seen[i]=1;
   while(q.length){const j=q.pop(),xx=j%w,yy=Math.floor(j/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=xx+dx,Y=yy+dy,k=Y*w+X;if(on(X,Y)&&!seen[k]){seen[k]=1;q.push(k)}}}
  }
  if(components!==1)badPixels.push(frame+' components '+components);
 }
 ok(!badPixels.length,'all 108 game-scale frames keep binary alpha, connected silhouettes and no pinholes'+(badPixels.length?': '+badPixels.slice(0,10).join(', '):''));
 ok(clips.every(n=>new Set(Array.from({length:A.clips[n][1]},(_,i)=>pixels(api.render({pose:api.pose(n,i),team:1})))).size>1),'all 14 clips keep distinct poses at game scale');
 ok(new Set([0,1,2].map(v=>pixels(api.render({v,team:1})))).size===3,'three deterministic grey coat variants');
 ok(PX.beast('wolf',{pose:0,team:1})===api.render({pose:0,team:1})&&PX.beast('tiger',{pose:0,team:1})===PX.tiger.render({pose:0,team:1}),'wolf and tiger each use their approved renderer');
 ok(Array.from({length:8},(_,f)=>PX.beastMap('wolf',f)).every((c,f)=>c.width===16&&c.height===16&&c===api.map(f)),'world-map wolves use their dedicated native 16-pixel walk');
 const u={id:1,type:'wolf',s:{spd:60},spdNow:60,atkAt:null,hitAt:null,z:0,team:1,v:0};
 ok(api.live(u,1,false,.3)===api.sample('idle',1.037),'idle uses the approved eight-frame clip');
 u.atkAt=1;ok(api.live(u,1.15,false,.3)===api.pose('bite',3),'bite uses its corrected jaw frames');u.id=2;ok(api.live(u,1.15,false,.3)===api.pose('lunge',3),'lunge uses its corrected jaw frames');u.id=1;u.atkAt=null;
 u.hitAt=1;ok(api.live(u,1.15,false,.3)===api.pose('hurt',1),'hurt uses the approved reaction clip');u.hitAt=null;
 const base=t.corpseOf(u);ok(base.frames.length===8,'fallback corpse includes the eight-frame side-fall');
 const names=new Set();let frameChecks=true,drawChecks=true;
 for(let id=1;id<=60;id++){const actor={...u,id},death=t.deathOf(actor);names.add(death.name);frameChecks=frameChecks&&death.frames.length===8&&death.frames[7]===t.unitSprite('wolf',1,false,0,api.pose('death_'+death.name,7));
  const c=document.createElement('canvas');c.width=128;c.height=96;const g=c.getContext('2d'),seen=[],draw=g.drawImage;g.drawImage=function(s,...a){seen.push(s);return draw.call(this,s,...a)};
  t.drawBody(g,{x:64,y:80,sp:death,face:1,pool:0,seed:0,dry:true},.5,0);drawChecks=drawChecks&&seen.includes(death.frames[4]);}
 ok(names.has('side')&&names.has('back')&&names.has('slump')&&frameChecks,'all three death selections hold their approved final frames, including folded legs in the back slot');
 ok(drawChecks,'production corpse drawing plays the authored keyframes');
 const dead=t.unitSprite('wolf',1,false,0,api.pose('death_back',7));ok(pixels(dead)!==pixels(t.unitSprite('wolf',1,false,0,api.pose('death_side',7))),'folded-leg and side-fall variants remain distinct');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
