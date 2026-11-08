'use strict';
// Approved tiger art through the production renderer, animation selection and corpse drawing.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,PX=t.PX,art=PX.TIGER_ART,api=PX.tiger;t.act('begin','soldier');
 const pixels=c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).join();
 ok(art.frames.length===92&&Object.keys(api.clips).length===12,'all 92 approved frames and 12 clips are available synchronously');
 const clips=Object.keys(api.clips),images=clips.flatMap(n=>Array.from({length:api.clips[n][1]},(_,i)=>t.unitSprite('tiger',1,false,0,api.pose(n,i))));
 ok(images.every(c=>c.width===64&&c.height===64&&c.ch>0),'all frames share one 64-pixel cell and a standing height');
 ok(clips.every(n=>new Set(Array.from({length:api.clips[n][1]},(_,i)=>pixels(api.render({pose:api.pose(n,i),team:1})))).size>1),'every animation retains distinct poses at game scale');
 ok(new Set([0,1,2].map(v=>pixels(api.render({pose:0,v,team:1})))).size===3,'three deterministic coat variants');
 const u={id:1,type:'tiger',s:{spd:60},spdNow:60,atkAt:null,hitAt:null,z:0};
 ok(api.live(u,1,false,.3)===api.sample('idle',1.037),'idle uses its eight-frame timing');
 u.atkAt=1;ok(api.live(u,1.15,false,.3)===api.pose('swipe',3),'attacks use the approved swipe frames');u.atkAt=null;
 u.hitAt=1;ok(api.live(u,1.15,false,.3)===api.pose('hurt',1),'hit reactions select the hurt clip');u.hitAt=null;
 u.z=5;ok(api.live(u,2,true,.3)===api.pose('run',3),'airborne pounce keeps the battle height without adding a second jump');u.z=0;
 api.pounce(u,2);ok(api.live(u,2.3,true,.3)===api.pose('pounce',3),'the pounce ability plays the approved pounce clip');api.pounce(u,-100);
 const corpse=t.corpseOf({...u,team:1,v:0}),death=t.deathOf({...u,team:1,v:0});
 ok(corpse.frames.length===8&&death.frames===corpse.frames&&corpse.frames[7]===t.unitSprite('tiger',1,false,0,api.pose('death_back',7)),'corpse and death selection keep the approved eight-frame side-fall');
 const c=document.createElement('canvas');c.width=128;c.height=96;const g=c.getContext('2d'),seen=[],draw=g.drawImage;g.drawImage=function(s,...args){seen.push(s);return draw.call(this,s,...args)};
 const record={x:64,y:80,sp:corpse,face:1,pool:0,seed:0,dry:true};t.drawBody(g,record,.5,0);t.drawBody(g,record,1,0);
 ok(seen.includes(corpse.frames[4])&&seen.includes(corpse.frames[7]),'production corpse drawing uses keyframes and holds the resting pose');
 const preview=document.createElement('canvas');preview.width=900;preview.height=420;preview.id='tiger-preview';preview.style.cssText='position:fixed;left:0;top:0;z-index:999999';const cg=preview.getContext('2d');cg.imageSmoothingEnabled=false;cg.fillStyle='#a5aa91';cg.fillRect(0,0,900,420);cg.fillStyle='#222';cg.font='18px Arial';cg.fillText('Approved tiger · production game sprites',20,28);
 ['idle','walk','run','swipe','death_back'].forEach((n,i)=>{const s=t.unitSprite('tiger',1,false,0,api.pose(n,n==='death_back'?7:3));cg.drawImage(s,i*175,42,256,256);cg.fillText(n,i*175+20,320)});document.body.prepend(preview);
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
