'use strict';
// Smooth walking on the world map: the map drawn at the screen's own scale (core.js VS, here 3, as a 1080p desktop has it), the
// camera following you to 1/VS of a game pixel and everyone who moves drawn at his own place to 1/VS px (render.js drawWorld,
// subT), while what stands keeps to the map's grid and no picture is ever resampled; the walk cycles of WALK.n frames (render.js
// WALK, people.js MAP_WALK, engine/beasts.js PX.mapLegs), frame 0 standing; clicks read through the fractional camera; the battle
// drawn as before.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
const t=T,G=t.G,P=t.P,W=t.W,pn=performance.now,r0=Math.random,ev=s=>(0,eval)(s);
try{
 try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;G.encCool=1e9;
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.chase=null;P.tx=null};world();
 const S=3;ev('VS='+S);G.clock=t.DAY*.3;let now=1e7;performance.now=()=>now;
 // a quiet spot on open ground: nobody but you and one lord walking by
 let spot=null;for(let ty=12;ty<t.MH-12&&!spot;ty++)for(let tx=12;tx<t.MW-12&&!spot;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;let n=0;for(let j=-3;j<=3;j++)for(let i=-5;i<=5;i++)if(t.tAt(tx+i,ty+j)===t.T_OPEN)n++;
  if(n===77&&t.TOWNS.every(z=>Math.hypot(z.x-x,z.y-y)>240)&&W.sites.every(z=>Math.hypot(z.x-x,z.y-y)>120))spot=[x,y]}
 const clear=()=>{t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];W.ships=[];W.fights=[]};clear();
 P.x=spot[0]+.4;P.y=spot[1]+.2;P.stay=null;P.troops={hum_levy:12};t.reveal();
 const L=W.lords.find(l=>!l.dead);Object.assign(L,{x:P.x-30.2,y:P.y+14,inside:null,fight:null,dead:false,dir:1});
 // (each drawImage on the screen while a frame is drawn: the picture, its source and target sizes, the transform)
 const c=t.ctx,calls=[];let rec=false;const di0=c.drawImage;c.drawImage=function(img,...a){if(rec)calls.push([img,a,this.getTransform()]);return di0.apply(this,[img,...a])};
 const frame=()=>{calls.length=0;rec=true;try{t.frame()}finally{rec=false}};
 // (the context's transform is kept in single precision: within 1e-4 of a device pixel)
 const isInt=v=>Math.abs(v-Math.round(v))<1e-4,EPS=1e-4;
 try{
  // ---- the camera: to 1/VS of a game pixel, its fraction the screen's shift
  frame();const C=G.cam;
  ok(t.cv.width===t.VW*S&&t.cv.height===t.VH*S&&t.CVS===S,'the world map\'s canvas is the screen\'s own pixels: '+t.cv.width+' x '+t.cv.height+' ('+S+' a game pixel)');
  ok(!isInt(C.x)&&isInt(C.x*S)&&isInt(C.y*S)&&Math.abs(C.x-(P.x-t.VW/2))<=.5/S&&Math.abs(C.y-(P.y-t.VH/2))<=.5/S,'the camera follows you to 1/'+S+' of a game pixel ('+C.x.toFixed(4)+', '+C.y.toFixed(4)+')');
  // ---- no picture is resampled: each drawn at its own size, the transform a whole VS (a mirror allowed), on device pixels
  {const bad=calls.filter(([img,a,m])=>{const w=img.width,h=img.height,sz=a.length===2||(a.length===8&&a[2]===a[6]&&a[3]===a[7]);
    return !sz||Math.abs(Math.abs(m.a)-S)>EPS||Math.abs(m.d-S)>EPS||m.b||m.c||!isInt(m.e+m.a*(a.length===8?a[4]:a[0]))||!isInt(m.f+m.d*(a.length===8?a[5]:a[1]))});
   ok(calls.length>8&&!bad.length,'every picture on the screen ('+calls.length+') is drawn at its own size, scaled by '+S+' whole, on whole device pixels: never resampled'+(bad.length?': '+bad.slice(0,3).map(([img,a,m])=>img.width+'x'+img.height+' '+a.map(v=>+(+v).toFixed(3)).join(',')+' @'+[m.a,m.d,m.e,m.f].map(v=>+v.toFixed(3)).join(',')).join('; '):''))}
  // ---- what stands keeps to the grid: the screen in whole S x S blocks on the camera's fraction, away from anyone who moves
  {const g=c.getImageData(0,0,t.cv.width,t.cv.height),d=g.data,W2=g.width,off=((-Math.round(C.x*S))%S+S)%S,offy=((-Math.round(C.y*S))%S+S)%S,px=(x,y)=>d.subarray((y*W2+x)*4,(y*W2+x)*4+4).join();
   let blocks=0,badB=0;for(let by=offy+S;by<60*S;by+=S)for(let bx=off+S;bx<200*S;bx+=S){const p0=px(bx,by);let same=true;for(let j=0;j<S&&same;j++)for(let i=0;i<S;i++)if(px(bx+i,by+j)!==p0){same=false;break}blocks++;if(!same)badB++}
   ok(blocks>1000&&!badB,'the ground and what stands lie in whole '+S+' x '+S+' blocks on the camera\'s fraction (the top left of the screen: '+blocks+' blocks'+(badB?', '+badB+' not':'')+'): on the map\'s grid, gliding with it')}
  // ---- your band steady in the middle; a lord walking by glides a device pixel at a time, his parts whole game pixels apart
  const figs=new Set([...Array(t.PEOPLE_STEPS).keys()].map(f=>t.partySprite(t.FACS[L.fac].col,t.C.horse,f))),lead=new Set([...figs,...[...Array(t.PEOPLE_STEPS).keys()].map(f=>t.partySprite('#e8b94a','',f))]),fol=img=>img.width===16&&img.height===16&&!lead.has(img)&&img.ox==null;
  const seen=()=>{const q=calls.filter(([img])=>figs.has(img));if(!q.length)return null;const [img,a,m]=q[q.length-1];return m.e/S};
  const mine=()=>{const q=calls.filter(([img])=>[...Array(t.PEOPLE_STEPS).keys()].some(f=>img===t.partySprite('#e8b94a','',f)));return q.length?q[q.length-1][2].e/S:null};
  {const xs=[],me=[],rel=[];for(let i=0;i<40;i++){t.walk(L,1,0,.15);now+=16.7;frame();xs.push(seen());me.push(mine());
     // (his followers: drawn just before him, back to anything else)
     const li=calls.findIndex(([img])=>figs.has(img));if(li>=0)for(let j=li-1;j>=0&&fol(calls[j][0]);j--)rel.push(calls[j][2].e/S-calls[li][2].e/S)}
   const st=xs.slice(1).map((x,i)=>x-xs[i]);
   ok(xs.every(x=>x!=null&&isInt(x*S))&&st.every(s=>s>-EPS&&s<=1/S+EPS)&&xs[xs.length-1]-xs[0]>4,'a lord walking by moves on monotonically, by at most 1/'+S+' of a game pixel a frame ('+(xs[xs.length-1]-xs[0]).toFixed(2)+' px in 40 frames; steps '+[...new Set(st.map(s=>s.toFixed(3)))].join(', ')+')');
   ok(rel.length>20&&rel.every(isInt),'his host keeps whole game pixels from him: a figure never shears ('+rel.length+' followers drawn)');
   ok(me.every(x=>x!=null&&Math.abs(x-me[0])<EPS),'your own band stays still in the middle of the screen as the map glides')}
  // (you walking: the camera steps 1/VS at a time too)
  {const cs=[];for(let i=0;i<30;i++){t.walk(P,1,0,.15);now+=16.7;frame();cs.push(G.cam.x)}const st=cs.slice(1).map((x,i)=>x-cs[i]);
   ok(cs.every(x=>isInt(x*S))&&st.every(s=>s>-EPS&&s<=1/S+EPS)&&st.some(s=>s>0)&&st.filter(s=>s>0).length>st.length/3,'as you walk the camera glides by 1/'+S+' px steps, most frames ('+st.filter(s=>s>0).length+' of '+st.length+')')}
  // ---- every label and the minimap crisp: a label drawn as a picture of game pixels (sprites.js txtPic)
  {const pics=calls.filter(([img])=>img.ox!=null&&img.oy!=null);ok(pics.length>0,'labels are laid on as pictures in game pixels ('+pics.length+' this frame), not drawn as text at the finer scale')}
  // ---- a click through the fractional camera: a real pointer event on a beast beside you meets it
  {world();clear();P.x=Math.floor(P.x)+.4;const m={id:'boar',x:P.x+12.3,y:P.y+.4,hx:P.x,hy:P.y,lv:1,n:2,t:0,a:0,cool:5};W.monsters=[m];G.encCool=0;frame();
   const r=t.cv.getBoundingClientRect(),x=r.left+(m.x-G.cam.x)*r.width/t.VW,y=r.top+(m.y-4-G.cam.y)*r.height/t.VH,p=t.toCanvas({clientX:x,clientY:y});
   ok(!isInt(G.cam.x)&&Math.abs(G.cam.x+p.x-m.x)<1e-6&&Math.abs(G.cam.y+p.y-(m.y-4))<1e-6,'the pointer reads as the map\'s point under it with the camera at '+G.cam.x.toFixed(3)+' (toCanvas in game pixels)');
   t.cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:x,clientY:y,pointerType:'mouse',bubbles:true}));ok(G.enc&&G.enc.kind==='monster','a click on the beast beside you meets it');if(G.enc)t.act('flee');world();W.monsters=[];G.encCool=1e9}
  {L.x=P.x+20.37;L.y=P.y+6.2;frame();ok(t.pickAt(L.x+.3,L.y-6)===L,'a party is picked at its place as drawn')}
 }finally{c.drawImage=di0}
 // ---- the walk cycles: WALK.n frames (6 to 8), 0 standing
 {const n=t.WALK.n,ppl=[...Array(n).keys()].map(f=>t.followerSprite('#3d74d6',f,2,'human')),rid=[...Array(n).keys()].map(f=>t.partySprite('#c74453',t.C.horse,f)),
   wolf=[...Array(n).keys()].map(f=>t.monsterMapSprite('wolf',f)),cow=[...Array(n).keys()].map(f=>t.critterSprite('cow',f)),cv=[...Array(n).keys()].map(f=>t.caravanSprite('#c74453',f)),
   px=s=>s.getContext('2d').getImageData(0,0,s.width,s.height).data.join(),dist=a=>new Set(a.map(px)).size;
  ok(n>=6&&n<=8&&t.PEOPLE_STEPS===n&&t.PX.MAP_STEPS===n&&t.WALK.foot*n===10&&t.WALK.ride*n===16,'the map\'s walk cycles have '+n+' frames, the stride cut to match (a frame each '+t.WALK.foot+' px on foot, '+t.WALK.ride+' riding: the same pace)');
  ok(dist(ppl)===n&&dist(rid)>=n-2&&dist(wolf)>=n-2&&dist(cow)>=n-2&&dist(cv)===n,'each frame its own pose: a person '+dist(ppl)+', a rider '+dist(rid)+', a wolf '+dist(wolf)+', a cow '+dist(cow)+', a caravan '+dist(cv));
  const o2={x:0,y:0};t.WALKED.set(o2,7.3);t.stepOf(o2,1.25);now+=1000;ok(t.stepOf(o2,1.25)===0&&t.frameOf(o2,1.25,n)!==0,'standing still, a figure shows frame 0')}
 // ---- the battle is drawn as before: in its own pixels, whatever the world's scale
 {world();const shot=vs=>{ev('VS='+vs);Math.random=t.seeded(5);now=2e7;t.frame();return [t.cv.width,t.cv.height,t.CVS,(()=>{const d=t.ctx.getImageData(0,0,t.cv.width,t.cv.height).data;let h=0;for(let i=0;i<d.length;i+=7)h=(h*31+d[i])|0;return h})()].join()};
  P.troops={hum_spear:6,hum_bow:4};Math.random=t.seeded(3);t.startBattle({enemies:['orc_grunt','orc_grunt','archer'],tournament:false});for(let i=0;i<20;i++)t.updateBattle(.03);G.mode='battle';
  const a=shot(1),b=shot(S);ok(a===b&&a.startsWith(t.BVW+','+t.BVH+',1,'),'a battle is drawn in its own pixels, the same at any world scale ('+a+')')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{performance.now=pn;Math.random=r0;try{ev('VS=1')}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
