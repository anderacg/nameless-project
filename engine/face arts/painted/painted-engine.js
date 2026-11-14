/* Painted portrait parts share the existing recipe, geometry and silhouette controls. */
(function(root){
 'use strict';
 const E=root.PortraitEngine,N=E.size,atlases=[],fields=new Map(),BASE={skin:[184,139,105],orc:[130,137,76],hair:[105,66,35],metal:[150,161,175],cloth:[44,70,103],leather:[116,77,46],fur:[94,75,53],lips:[150,100,76]};
 let loaded=false,error=null;
 const canvas=n=>{const c=document.createElement('canvas');c.width=c.height=n;return c},hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
 function recolor(rgb,target,base,contrast=0){const amount=1-Math.pow(Math.max(...rgb)/255,4)*.85;return rgb.map((v,k)=>clamp(v+(target[k]-base[k])*amount+(v-128)*contrast));}
 function frame(sheet,index,side=null,metal=false){
  const key=[sheet,index,side,metal].join(':');if(fields.has(key))return fields.get(key);
  const A=root.PAINTED_PORTRAIT_ASSETS[sheet];let [x,y,w,h]=A.frames[index];
  if(side!==null){const half=Math.floor(w/2);if(side)x+=half;w=half;}
  let raw=atlases[sheet].getImageData(x,y,w,h).data;
  if(side!==null){let l=w,t=h,r=-1,b=-1;for(let Y=0;Y<h;Y++)for(let X=0;X<w;X++)if(raw[(Y*w+X)*4+3]>=128){l=Math.min(l,X);r=Math.max(r,X);t=Math.min(t,Y);b=Math.max(b,Y);}if(r>=0){x+=l;y+=t;w=r-l+1;h=b-t+1;raw=atlases[sheet].getImageData(x,y,w,h).data;}}
  const d=new Uint8ClampedArray(raw),alpha=new Uint8Array(w*h),seen=new Uint8Array(w*h),queue=new Uint32Array(w*h);let end=0;
  for(let i=0;i<alpha.length;i++)alpha[i]=d[i*4+3]>=128?255:0;
  if(A.headwear)for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!alpha[i])continue;let linked=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&alpha[(y+dy)*w+x+dx])linked=true;if(!linked)alpha[i]=0;}
  for(let i=0;i<alpha.length;i++){const k=i*4,lum=(d[k]+d[k+1]+d[k+2])/3;if(alpha[i]&&(!metal||lum>=50)){seen[i]=1;queue[end++]=i;}}
  for(let at=0;at<end;at++){const i=queue[at],X=i%w,Y=Math.floor(i/w);for(const j of [X?i-1:-1,X<w-1?i+1:-1,Y?i-w:-1,Y<h-1?i+w:-1])if(j>=0&&!seen[j]){for(let k=0;k<3;k++)d[j*4+k]=d[i*4+k];seen[j]=1;queue[end++]=j;}}
  const top=new Uint16Array(w).fill(h);for(let Y=0;Y<h;Y++)for(let X=0;X<w;X++)if(alpha[Y*w+X])top[X]=Math.min(top[X],Y);
  const out={w,h,d,alpha,top};fields.set(key,out);return out;
 }
 function bounds(d,side=null){let x=N,y=N,r=-1,b=-1;for(let Y=0;Y<N;Y++)for(let X=side===1?64:0;X<(side===0?64:N);X++)if(d[(Y*N+X)*4+3]){x=Math.min(x,X);r=Math.max(r,X);y=Math.min(y,Y);b=Math.max(b,Y);}return r<0?null:{x,y,w:r-x+1,h:b-y+1};}
 function bodyPart(c){const s=c.clothing;return /dwarf|rune/.test(s)?13:/elf|leaf/.test(s)?15:/harness/.test(s)?14:/fur|cloak/.test(s)?22:/leather|jerkin|hide/.test(s)?21:/mail/.test(s)?11:/plate|cuirass|scale|lamellar|brigandine/.test(s)?12:10;}
 function part(id,c){
  if(id==='torso')return [1,20];
  if(id==='ears')return [0,/elven|elf-swept/.test(c.ears)?8:/pointed|orc/.test(c.ears)?7:c.race==='dwarf'?6:5];
  if(id==='brows')return [0,/dwarf|bold|full/.test(c.brows)?15:/slim|soft|arch/.test(c.brows)?16:14];
  if(id==='nose')return [0,/orc/.test(c.nose)?19:/dwarf|broad|round|wide/.test(c.nose)?18:/slender|soft|button|short/.test(c.nose)?20:17];
  if(id==='mouth')return [0,c.race==='orc'?23:c.race==='dwarf'?24:/full|cupid|pout|bow/.test(c.mouth)||c.profile==='female'?22:21];
  if(id==='beard'){if(['none','stubble','close-beard','chin-bristle'].includes(c.beard))return null;return [1,/moustache|walrus/.test(c.beard)?8:/goatee/.test(c.beard)?9:c.race==='dwarf'||/fork|braid/.test(c.beard)?7:6];}
  if(id.startsWith('hair'))return [1,c.hair==='war-crest'?4:/ponytail|bun|topknot/.test(c.hair)?24:/braid/.test(c.hair)?5:/long|shoulder|loose|half-up/.test(c.hair)?id==='hairBack'?2:3:/wave|swept|curtain|shag|curl/.test(c.hair)?1:0];
  if(id==='armor'||id==='clothing'){if(id==='clothing'&&(E.soldierEquipment.armor.includes(c.clothing)||['scale','lamellar','plate','brigandine'].includes(c.clothing))&&[12,13,15].includes(bodyPart(c)))return [1,c.clothing==='brigandine'||c.clothing==='orc-lamellar'?21:10];if(c.clothing==='coat-of-plates')return [1,id==='clothing'?10:11];if(id==='armor'&&['surcoat','leather-mail'].includes(c.clothing))return [1,11];let n=bodyPart(c);if(id==='armor'&&[10,14,20,21,22].includes(n))n=12;return [1,n];}return null;
 }
 function baseFor(sheet,index,id){if(id==='hairFront'||id==='hairBack'||id==='beard'||id==='brows')return BASE.hair;if(id==='mouth')return index===23?BASE.orc:BASE.lips;if(sheet===0||id==='torso')return sheet===0&&[3,7,19].includes(index)?BASE.orc:BASE.skin;return index===10?BASE.cloth:[14,16,21].includes(index)?BASE.leather:index===22?BASE.fur:BASE.metal;}
 function sample(f,u,v){const x=Math.max(0,Math.min(f.w-1,Math.floor(u*f.w))),y=Math.max(0,Math.min(f.h-1,Math.floor(v*f.h))),i=y*f.w+x;return {rgb:[f.d[i*4],f.d[i*4+1],f.d[i*4+2]],alpha:f.alpha[i]};}
 function put(d,i,rgb,alpha){d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];d[i+3]=alpha;}
 const headRigs=new Map(),HEADS=new Map(root.PAINTED_PORTRAIT_ASSETS.flatMap((a,sheet)=>(a.heads||[]).map((h,index)=>[h.race+'/'+h.profile,{...h,sheet,index}])));
 const DRAW_ORDER=Object.freeze(['hairBack','headwearBack','torso','ears','face','age','marks','nose','eyes','iris','eyelids','brows','mouth','teeth','clothing','armor','hairFront','headwearFront','beard'].map(id=>E.order.find(s=>s.id===id)));
 function headSpec(c){return HEADS.get(c.race+'/'+(c.profile==='female'?'female':'male'));}
 function headWidth(a,y){const hits=[];for(let i=0;i<a.outline.length;i++){const p=a.outline[i],q=a.outline[(i+1)%a.outline.length];if((p[1]<=y&&q[1]>y)||(q[1]<=y&&p[1]>y))hits.push(p[0]+(y-p[1])*(q[0]-p[0])/(q[1]-p[1]));}return hits.length?Math.max(...hits)-Math.min(...hits):0;}
 let bodyFootprint=null;
 function fitHeadToBody(out,size){
  if(!bodyFootprint){bodyFootprint=canvas(N);const g=bodyFootprint.getContext('2d'),p=E.build({...E.defaults,race:'human',face:'angular',clothing:'gambeson',headwear:'none',beard:'none',age:'young',marks:'none'});for(const id of ['face','torso','clothing','armor'])g.drawImage(p.layers[id],0,0);g.fillStyle='#fff';g.fillRect(0,0,N,94);}
  const g=out.getContext('2d');g.save();g.globalCompositeOperation='destination-in';g.imageSmoothingEnabled=false;g.drawImage(bodyFootprint,0,0,size,size);g.restore();return out;
 }
 function referenceHead(h,colors,size){
  const f=frame(h.sheet,h.index),out=canvas(size),g=out.getContext('2d'),im=g.createImageData(size,size),scale=size/N,height=82,width=height*f.w/f.h,target=hex(colors.skin);
  for(let Y=Math.floor(21*scale);Y<Math.min(size,103*scale);Y++)for(let X=0;X<size;X++){const u=.5+((X+.5)/scale-64)/width,v=((Y+.5)/scale-21)/height;if(u<0||u>=1||v<0||v>=1)continue;const s=sample(f,u,v);if(s.alpha)put(im.data,(Y*size+X)*4,recolor(s.rgb,target,h.skinBase),255);}
  g.putImageData(im,0,0);return out;
 }
 function elfSide(a,c,y,full,reference){
  const start=a.mouth.y-2,top=a.mouth.y+3,bottom=101;if(y<=start||y>=bottom)return full;
  const upper=a.w*(c.profile==='female'?.72:.78)+.35*(a.jaw-a.w*reference.jaw/reference.w),lower=17,waist=Math.min(14,a.w*(c.profile==='female'?.49:.58)),bow=(upper+lower)/2-waist,t=Math.max(0,Math.min(1,(y-top)/(bottom-top))),curve=upper+(lower-upper)*t-4*bow*t*(1-t),join=Math.max(0,Math.min(1,(y-start)/(top-start))),blend=join*join*(3-2*join);
  return full+(curve-full)*blend;
 }

 // Elf necks taper gradually below the jaw; keep clavicle shading down by the collar.
 function paintedHead(p,colors,size){
  if(p.config.race==='human'&&p.config.profile!=='female')return referenceHead(headSpec(p.config),colors,size);
  const c=p.config,h=headSpec(c),f=frame(h.sheet,h.index),A=p.anchors,key=c.race+'/'+h.profile,elf=c.race==='elf',chin=h.chin;let B=headRigs.get(key);if(!B){B=E.geometry({...E.startRace(c.race,E.startProfile(h.profile)),profile:h.profile,face:h.referenceFace,adjustments:{}});headRigs.set(key,B);}
  const out=canvas(size),g=out.getContext('2d'),im=g.createImageData(size,size),d=im.data,scale=size/N,top=Math.min(...A.outline.map(q=>q[1])),refTop=Math.min(...B.outline.map(q=>q[1])),eye=A.eyes[0].y,refEye=B.eyes[0].y,target=hex(colors.skin),contrast=(A.definition-B.definition)*.07-(A.softness-B.softness)*.025,neck=Math.max(.85,Math.min(1.15,(A.jaw/A.w)/(B.jaw/B.w)))*(elf?.8:1),half=(103-refTop)*f.w/f.h/2*A.w/B.w;
  const collarT=(94-A.chinY)/(103-A.chinY),collarRow=Math.max(0,Math.min(f.h-1,Math.floor((chin+(elf?collarT*collarT:collarT)*(1-chin))*f.h)));let collarSpan=0;for(let x=0;x<f.w;x++)if(f.alpha[collarRow*f.w+x])collarSpan++;const collarFit=Math.min(1,32/Math.max(1,half*2*neck*collarSpan/f.w));
  for(let Y=Math.max(0,Math.floor(top*scale));Y<Math.min(size,103*scale);Y++){
   const y=(Y+.5)/scale;let v,refY,warp=1;
   if(y<eye){v=(y-top)/(eye-top)*h.eye;refY=refTop+(y-top)/(eye-top)*(refEye-refTop);}
   else if(y<A.chinY){const t=(y-eye)/(A.chinY-eye);v=h.eye+t*(chin-h.eye);refY=refEye+t*(B.chinY-refEye);const bw=headWidth(B,refY)/B.w,aw=headWidth(A,y)/A.w,ratio=bw>.05?Math.max(.65,Math.min(1.4,aw/bw)):1,fade=Math.min(1,(y-eye)/4,(A.chinY-y)/4);warp=1+(ratio-1)*Math.max(0,fade);const blend=elf?8:4,tJoin=Math.max(0,Math.min(1,(y-(A.chinY-blend))/blend)),join=elf?tJoin*tJoin*(3-2*tJoin):tJoin;warp=warp*(1-join)+neck*join;}
   else{const t=(y-A.chinY)/(103-A.chinY);v=chin+(elf?t*t:t)*(1-chin);warp=neck;}
   if(y>A.chinY)warp*=1-(1-collarFit)*Math.min(1,(y-A.chinY)/Math.max(1,94-A.chinY));
   if(v<0||v>=1)continue;const side=elf?elfSide(A,c,y,half*warp,B):Infinity;
   for(let X=0;X<size;X++){const x=(X+.5)/scale;if(Math.abs(x-A.cx)>side)continue;const u=.5+(x-A.cx)/(half*2*warp);if(u<0||u>=1)continue;const s=sample(f,u,v);if(s.alpha){let rgb=recolor(s.rgb,target,h.skinBase,contrast);if(elf&&y>A.mouth.y-2&&y<101){const edge=Math.max(0,1-(side-Math.abs(x-A.cx))/1.5),fade=Math.max(0,Math.min(1,(101-y)/4)),shade=1-edge*edge*fade*(x<A.cx?.04:.07);rgb=rgb.map(n=>clamp(n*shade));}put(d,(Y*size+X)*4,rgb,255);}}
  }g.putImageData(im,0,0);return fitHeadToBody(out,size);
 }
 const isHelmet=c=>/helm|bascinet|sallet|nasal|kettle|coif/.test(c.headwear);
 // Helmet contours and fittings come from their own rig; atlas borders are never stretched into metal.
 // Smooth only the lighting field; material pixels and silhouette alpha keep their native detail.
 const helmetLights=new WeakMap();
 function helmetLight(layer,mask){
  if(helmetLights.has(layer))return helmetLights.get(layer);const weights=[1,3,6,7,6,3,1],sum=new Float32Array(N*N),coverage=new Float32Array(N*N),light=new Float32Array(N*N);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)for(let i=-3;i<=3;i++){const xx=x+i;if(xx<0||xx>=N)continue;const k=(y*N+xx)*4;if(mask[k+3]&&mask[k]>64){sum[y*N+x]+=mask[k]*weights[i+3];coverage[y*N+x]+=weights[i+3];}}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){let value=0,total=0;for(let i=-3;i<=3;i++){const yy=y+i;if(yy<0||yy>=N)continue;const k=yy*N+x;value+=sum[k]*weights[i+3];total+=coverage[k]*weights[i+3];}light[y*N+x]=total?value/total:128;}
  helmetLights.set(layer,light);return light;
 }
 function helmetShade(light,x,y){
  x=Math.max(0,Math.min(N-1,x-.5));y=Math.max(0,Math.min(N-1,y-.5));const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,right=Math.min(N-1,ix+1),bottom=Math.min(N-1,iy+1);return (light[iy*N+ix]*(1-fx)+light[iy*N+right]*fx)*(1-fy)+(light[bottom*N+ix]*(1-fx)+light[bottom*N+right]*fx)*fy;
 }
 // Each cloth hat and crown has its own authored picture, uniformly fitted to the brow.
 const HEADWEAR=new Map(root.PAINTED_PORTRAIT_ASSETS.flatMap((a,sheet)=>(a.headwear||[]).map((id,index)=>[id,{sheet,index}])));
 const HEADWEAR_FIT={'wool-skullcap':[2.35,.94],'liripipe-cap':[2.9,.7],'fur-trimmed-cap':[2.55,.95],bycocket:[2.65,.94],'noble-chaperon':[2.95,.6],hood:[4.1,.39,.835],'wrapped-hood':[3.6,.26,.748],veil:[3.6,.18],'draped-veil':[3.6,.28],'pearl-hood':[3.9,.23,.78],'linen-wrap':[3.4,.42],'arming-cap':[2.35,.55],chaperon:[2.9,.42],turban:[2.4,.8],'straw-hat':[3.6,.69],'feathered-cap':[2.5,.94]};
 function paintedHeadwear(p,colors,size,id){
  const out=canvas(size),g=out.getContext('2d'),im=g.createImageData(size,size),d=im.data,h=HEADWEAR.get(p.config.headwear);if(!h)return out;
  const f=frame(h.sheet,h.index),A=p.anchors,[width,brow,opening]=HEADWEAR_FIT[p.config.headwear]||[2.35,.96],wanted=Math.max(A.w*width/f.w,opening?(A.mouth.y-A.eyes[0].y+19)/(f.h*(opening-brow)):0),fit=['fur-trimmed-cap','bycocket'].includes(p.config.headwear)?Math.min(wanted,(A.eyes[0].y-16)/(f.h*brow)):wanted,top=Math.max(1,A.eyes[0].y-14-f.h*brow*fit),left=A.cx-f.w*fit/2,scale=size/N,target=hex(colors.headwear),base=hex(E.colors.headwear);
  for(let Y=Math.max(0,Math.floor(top*scale));Y<Math.min(size,Math.ceil((top+f.h*fit)*scale));Y++)for(let X=Math.max(0,Math.floor(left*scale));X<Math.min(size,Math.ceil((left+f.w*fit)*scale));X++){
   const x=(X+.5)/scale,y=(Y+.5)/scale;if((id==='headwearBack')!==(y>=94))continue;
   const u=(x-left)/(f.w*fit),v=(y-top)/(f.h*fit);if(u<0||u>=1||v<0||v>=1)continue;const s=sample(f,u,v);if(s.alpha)put(d,(Y*size+X)*4,recolor(s.rgb,target,base),255);
  }
  g.putImageData(im,0,0);return out;
 }
 function paintedHelmet(p,colors,size,id){
  const out=canvas(size),g=out.getContext('2d'),im=g.createImageData(size,size),d=im.data,scale=size/N,A=p.anchors,c=p.config,mask=p.layers[id].getContext('2d').getImageData(0,0,N,N).data,steel=frame(1,19),plate=frame(1,12),horn=frame(1,18),mail=frame(1,11),target=hex(colors.headwear),base=hex(E.colors.headwear),b=bounds(mask);if(!b)return out;const lighting=helmetLight(p.layers[id],mask);
  const chain=c.headwear==='coif'||id==='headwearBack'&&/bascinet|dwarf|great-helm/.test(c.headwear),closed=E.faceCoveringHelmets.includes(c.headwear);
  const outside=new Uint8Array(N*N),queue=[];if(closed&&id==='headwearFront'){for(let y=0;y<N;y++)for(let x=0;x<N;x++)if((!x||!y||x===N-1||y===N-1)&&!mask[(y*N+x)*4+3]){const i=y*N+x;outside[i]=1;queue.push(i);}for(let at=0;at<queue.length;at++){const i=queue[at],x=i%N,y=Math.floor(i/N);for(const j of [x?i-1:-1,x<N-1?i+1:-1,y?i-N:-1,y<N-1?i+N:-1])if(j>=0&&!outside[j]&&!mask[j*4+3]){outside[j]=1;queue.push(j);}}}
  for(let Y=0;Y<size;Y++)for(let X=0;X<size;X++){
   const x=(X+.5)/scale,y=(Y+.5)/scale,k=(Math.floor(y)*N+Math.floor(x))*4;if(!mask[k+3]){if(closed&&id==='headwearFront'&&!outside[k/4]&&Math.abs(y-A.eyes[0].y)<5)put(d,(Y*size+X)*4,x<A.cx?[32,38,43]:[25,30,35],255);continue;}
   const u=(x-b.x)/b.w,v=(y-b.y)/b.h;
   let rgb;
   if(chain){const s=sample(mail,.12+x/N*.76,.4+(y%34)/34*.5);rgb=recolor(s.rgb,target,base);}
   else{
    const ivory=/horned|tusked/.test(c.headwear)&&Math.abs(x-A.cx)>A.w+1&&y<A.eyes[0].y-7;
    const s=ivory?sample(horn,x<A.cx?.11:.89,.23):sample(steel,.17+u*.27,.12+v*.28),raw=s.alpha?s.rgb:sample(steel,.42,.3).rgb,grain=sample(plate,.37+u*.28,.42+v*.42).rgb,light=helmetShade(lighting,x,y),detail=Math.max(-75,Math.min(28,mask[k]-light)),lum=raw.reduce((a,b)=>a+b,0)*.65/3+grain.reduce((a,b)=>a+b,0)*.35/3;
    rgb=raw.map((n,i)=>clamp(n*.65+grain[i]*.35-(lum-150)*.55+(light-150)*.65+detail*.4));if(mask[k]<=64)rgb=rgb.map(n=>clamp(n*(mask[k]<=48?.28:.68)));if(!ivory)rgb=recolor(rgb,target,base);
   }
   put(d,(Y*size+X)*4,rgb,255);
  }
  g.putImageData(im,0,0);return out;
 }
 // Source rectangles can be asymmetric; register clothing to its actual neckline opening.
 const bodyAnchors=new WeakMap();
 function bodyAnchor(f){
  if(bodyAnchors.has(f))return bodyAnchors.get(f);let seed=Math.floor(f.w/2);const centers=[];
  for(let y=Math.floor(f.h*.05);y<f.h*.32;y++){if(f.alpha[y*f.w+seed])break;let left=seed,right=seed;while(left>0&&!f.alpha[y*f.w+left-1])left--;while(right<f.w-1&&!f.alpha[y*f.w+right+1])right++;if(left>0&&right<f.w-1){centers.push((left+right+1)/2);seed=Math.floor((left+right)/2);}}
  centers.sort((a,b)=>a-b);const x=centers.length?centers[Math.floor(centers.length/2)]:f.w/2,y=Array.from({length:5},(_,i)=>f.top[Math.max(0,Math.min(f.w-1,Math.floor(x)+i-2))]).reduce((a,b)=>a+b,0)/5,anchor={x,y,half:Math.min(x,f.w-x)};bodyAnchors.set(f,anchor);return anchor;
 }
 // Leather geometry defines straps and fittings; material samples never add a second harness.
 const LEATHER_ARMOR=new Set(['orc-bare-cross-harness','orc-bare-ring-harness','orc-leather-vest','orc-studded-leather','orc-cross-harness','orc-ring-harness','orc-layered-hide','orc-leather-guard','hide-harness']);
 function leatherMaterial(p,colors,id,x,y,tone){
  const leather=frame(1,21),metal=frame(1,12),u=Math.abs(x-64)/60,v=Math.max(0,Math.min(1,(y-94)/34)),su=x<64?.15+u*.2:.65+u*.2,hardware=id==='armor';
  if(hardware&&tone>80){const s=sample(metal,.38+u*.2,.42+v*.35),rgb=s.rgb.map(n=>clamp(n*(.35+tone/450)));return recolor(rgb,hex(colors.metal),BASE.metal);}
  const s=sample(leather,su,.28+v*.55),rgb=s.rgb.map(n=>clamp(n+(tone-112)*.45));return recolor(rgb,hex(colors.cloth),BASE.leather);
 }
 function paintMask(p,spec,colors,size){
  const id=spec.id;if(id==='face')return paintedHead(p,colors,size);if(id.startsWith('headwear'))return isHelmet(p.config)?paintedHelmet(p,colors,size,id):paintedHeadwear(p,colors,size,id);const src=part(id,p.config),out=canvas(size),g=out.getContext('2d');g.imageSmoothingEnabled=false;
  if(!src){g.drawImage(spec.channel?E.tint(p.layers[id],colors[spec.channel]):p.layers[id],0,0,size,size);return out;}
  const a=p.layers[id].getContext('2d').getImageData(0,0,N,N).data,im=g.createImageData(size,size),d=im.data,pair=id==='ears'||id==='brows',scale=size/N,target=hex(colors[spec.channel]),base=baseFor(...src,id),contrast=0;
  const bodyTops=new Uint16Array(N).fill(N);if(id==='torso')for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(a[(y*N+x)*4+3])bodyTops[x]=Math.min(bodyTops[x],y);
  for(const side of pair?[0,1]:[null]){const b=bounds(a,side);if(!b)continue;const f=frame(...src,side,id.startsWith('headwear')),body=['torso','clothing','armor'].includes(id),anchor=body&&id!=='torso'?bodyAnchor(f):null;
   for(let Y=Math.floor(b.y*scale);Y<Math.ceil((b.y+b.h)*scale);Y++)for(let X=Math.floor(b.x*scale);X<Math.ceil((b.x+b.w)*scale);X++){
    const x=(X+.5)/scale,y=(Y+.5)/scale,k=(Math.floor(y)*N+Math.floor(x))*4;if(!a[k+3])continue;
    let u=(x-b.x)/b.w,v=(y-b.y)/b.h;
    if(body){u=(x-4)/120;if(id==='torso'){const X=Math.max(0,Math.min(f.w-1,Math.floor(u*f.w))),top=f.top[X];v=(top+(y-bodyTops[Math.floor(x)])*f.w/120)/f.h;}else{u=(anchor.x+(x-p.anchors.cx)/60*anchor.half)/f.w;v=(y<103?(y-94)/9*anchor.y:anchor.y+(y-103)/25*(f.h-anchor.y))/f.h;}}
    if((id==='clothing'||id==='armor')&&LEATHER_ARMOR.has(p.config.clothing)){put(d,(Y*size+X)*4,leatherMaterial(p,colors,id,x,y,a[k]),a[k+3]);continue;}
    const sampled=sample(f,u,v);
    const raw=sampled.rgb,warm=raw[0]>raw[1]*1.08&&raw[1]>raw[2]*1.3&&raw[0]>90;let rgb=(id==='armor'||id.startsWith('headwear'))&&warm?raw:recolor(raw,target,base,contrast);
    if(id==='armor'||id==='clothing'||id.startsWith('headwear')){if(a[k]<=48)rgb=rgb.map(v=>clamp(v*(id.startsWith('headwear')?.24:.7)));else if(a[k]<=64)rgb=rgb.map(v=>clamp(v*.8));else if(a[k]>=224)rgb=rgb.map(v=>clamp(v*1.08+10));else rgb=rgb.map(v=>clamp(v+(a[k]-128)*.1));}
    if(['hairFront','hairBack','beard','brows'].includes(id))rgb=rgb.map(v=>clamp(v+(a[k]-128)*.12));
    put(d,(Y*size+X)*4,rgb,a[k+3]);
   }
  }g.putImageData(im,0,0);return out;
 }
 // Ear roots follow the new skin edge; the independent ear artwork is only translated.
 function fitEars(p,layers,size){
  const scale=size/N,headScale=p.config.race==='orc'?(p.config.face==='orc-heavy'?.75:.875):1,y=Math.max(0,Math.min(size-1,Math.round((p.anchors.eyes[0].y+4*headScale)*scale))),face=layers.face.getContext('2d').getImageData(0,0,size,size).data,ear=layers.ears.getContext('2d').getImageData(0,0,size,size).data,out=canvas(size),g=out.getContext('2d');g.imageSmoothingEnabled=false;
  for(const side of [0,1]){const lo=side?size/2:0,hi=side?size:size/2;let edge=side?-1:size,root=side?size:-1;
   for(let x=lo;x<hi;x++)if(face[(y*size+x)*4+3])edge=side?Math.max(edge,x):Math.min(edge,x);
   for(let yy=Math.max(0,y-Math.ceil(scale*2));yy<=Math.min(size-1,y+Math.ceil(scale*2));yy++)for(let x=lo;x<hi;x++)if(ear[(yy*size+x)*4+3])root=side?Math.min(root,x):Math.max(root,x);
   if(edge<0||edge>=size||root<0||root>=size)continue;const shift=Math.round(edge+(side?-1:1)*scale*2-root);g.drawImage(layers.ears,lo,0,size/2,size,lo+shift,0,size/2,size);
  }layers.ears=out;
 }
 // The original painted face edge is authoritative; clip the neck beneath it without reshaping it.
 let neckOpening=null;
 function clipNeck(p,layers,size){
  const elf=p.config.race==='elf',scale=size/N;if(elf&&!neckOpening){const body=E.build({...E.defaults,race:'human',face:'angular',clothing:'gambeson',headwear:'none'}).layers.clothing.getContext('2d').getImageData(0,0,N,N).data;neckOpening=new Uint8Array(N*N);for(let y=94;y<103;y++){let left=N,right=-1;for(let x=0;x<N;x++)if(body[(y*N+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);}for(let x=left;x<=right;x++)if(!body[(y*N+x)*4+3])neckOpening[y*N+x]=1;}}
  const face=layers.face.getContext('2d').getImageData(0,0,size,size).data,g=layers.torso.getContext('2d'),im=g.getImageData(0,0,size,size),bottom=Math.ceil((elf?103:94)*scale);
  for(let y=0;y<bottom;y++)for(let x=0;x<size;x++){const k=(y*size+x)*4;if(!face[k+3]&&(y<94*scale||elf&&neckOpening[Math.floor(y/scale)*N+Math.floor(x/scale)]))im.data[k+3]=0;}g.putImageData(im,0,0);
 }

 // Feature envelopes retain every existing eye and mouth shape; painted folds sit around their openings.
 function feature(p,colors,size,kind,layers){
  const scale=size/N,raw=p.layers[kind].getContext('2d').getImageData(0,0,N,N).data,outputs=kind==='eyes'?['eyes','iris','eyelids']:['mouth'],images=Object.fromEntries(outputs.map(id=>[id,layers[id].getContext('2d').createImageData(size,size)])),c=p.config;
  const form=kind==='eyes'?E.eyeForms[c.eyes]:E.mouthForms[c.mouth];
  for(const side of kind==='eyes'?[0,1]:[null]){const b=bounds(raw,side);if(!b)continue;const index=kind==='eyes'?({human:c.profile==='female'?10:9,dwarf:11,orc:12,elf:13}[c.race]||9):part('mouth',c)[1],f=frame(0,index,side),pad=kind==='eyes'?.8+form[1]:.5+form[1]*.16,target=hex(colors[kind==='eyes'?'skin':'lips']),base=kind==='eyes'&&index===12||kind==='mouth'&&index===23?BASE.orc:kind==='eyes'?BASE.skin:BASE.lips;
   for(let X=Math.max(0,Math.floor((b.x-1)*scale));X<Math.min(size,Math.ceil((b.x+b.w+1)*scale));X++){
    const x=(X+.5)/scale,top=b.y,bottom=b.y+b.h-1;
    for(let Y=Math.max(0,Math.floor((top-pad)*scale));Y<Math.min(size,Math.ceil((bottom+1+pad)*scale));Y++){
     const y=(Y+.5)/scale,local=(x-b.x+1)/(b.w+2),u=kind==='eyes'?.5+(local-.5)*4.85/form[0]:local,bend=kind==='eyes'?(local-.5)*form[2]*(side===0?1:-1):form[2]*((local-.5)*2)**2*.5,v=(y-top+pad-bend)/(bottom-top+1+pad*2),s=sample(f,u,v);if(!s.alpha)continue;const rgb=s.rgb,i=(Y*size+X)*4;
     if(kind==='mouth'){const lip=index===23?hex(colors.skin).map((v,k)=>v*.8+target[k]*.2):target;put(images.mouth.data,i,recolor(rgb,lip,base),s.alpha);continue;}
     const high=Math.max(...rgb),low=Math.min(...rgb),sat=(high-low)/(high||1),circle=((u-.5)/.2)**2+((v-.56)/.32)**2<1,inner=((u-.5)/.11)**2+((v-.56)/.23)**2<1;
     const iris=circle&&(index===12?rgb[0]>rgb[1]*1.1&&rgb[1]>rgb[2]*1.3:index===13?rgb[1]>rgb[0]*.98&&rgb[1]>rgb[2]*1.1:rgb[2]>rgb[0]*1.08&&sat>.18)||inner&&high<65;
     if(iris){const ib=index===12?[184,131,48]:index===13?[99,108,62]:[74,108,129];put(images.eyes.data,i,[158,163,164],255);put(images.iris.data,i,high<55?rgb:recolor(rgb,hex(colors.iris),ib),s.alpha);}
     else if(rgb[0]>rgb[1]*1.05&&rgb[0]>rgb[2]*1.12||index===12&&rgb[1]>rgb[2]*1.2&&sat>.2)put(images.eyelids.data,i,recolor(rgb,target,base),s.alpha);
     else put(images.eyes.data,i,rgb,s.alpha);
    }
   }
  }for(const id of outputs)layers[id].getContext('2d').putImageData(images[id],0,0);
 }
 const SKIN_DETAIL=Object.freeze({age:{radius:2,sigma:.9,depth:.095},scar:{radius:2,sigma:.7,depth:.09},spot:{radius:1,sigma:.55,depth:.11}});
 // Skin relief inherits the color and texture at each pixel instead of tinting gray strokes.
 function skinDetails(p,layers,size){
  const scale=size/N,face=layers.face.getContext('2d').getImageData(0,0,size,size).data,eyes=layers.eyes.getContext('2d').getImageData(0,0,size,size).data,iris=layers.iris.getContext('2d').getImageData(0,0,size,size).data;
  const ageStrength={young:0,mature:.35,seasoned:.7,elder:1,weathered:1.05}[p.config.age],A=p.anchors;
  let aged=face;
  for(const id of ['age','marks']){
   const scar=id==='marks'&&/scar/.test(p.config.marks),spot=id==='marks'&&!scar,rule=SKIN_DETAIL[id==='age'?'age':scar?'scar':'spot'],raw=p.layers[id].getContext('2d').getImageData(0,0,N,N).data,field=new Float32Array(N*N),out=canvas(size),g=out.getContext('2d'),im=g.createImageData(size,size),d=im.data;
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=(y*N+x)*4;if(!raw[k+3])continue;const value=(spot?1:(172-raw[k])/58)*raw[k+3]/255;
    for(let dy=-rule.radius;dy<=rule.radius;dy++)for(let dx=-rule.radius;dx<=rule.radius;dx++){const X=x+dx,Y=y+dy;if(X<0||X>=N||Y<0||Y>=N)continue;field[Y*N+X]+=value*Math.exp(-(dx*dx+dy*dy)/(2*rule.sigma*rule.sigma));}
   }
   const sample=(x,y)=>{x=Math.max(0,Math.min(N-1,x));y=Math.max(0,Math.min(N-1,y));const X=Math.floor(x),Y=Math.floor(y),u=x-X,v=y-Y;return field[Y*N+X]*(1-u)*(1-v)+field[Y*N+Math.min(N-1,X+1)]*u*(1-v)+field[Math.min(N-1,Y+1)*N+X]*(1-u)*v+field[Math.min(N-1,Y+1)*N+Math.min(N-1,X+1)]*u*v;};
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){const k=(y*size+x)*4;if(!face[k+3]||eyes[k+3]||iris[k+3])continue;const X=(x+.5)/scale-.5,Y=(y+.5)/scale-.5;let f=sample(X,Y),volume=0;
    if(id==='age'){if(!ageStrength)continue;for(const eye of A.eyes)volume+=.32*Math.exp(-Math.pow((X-eye.x)/5.5,2)-Math.pow((Y-eye.y-5)/2.2,2));f=(f*.8+volume)*ageStrength;}
    const beauty=spot&&p.config.marks==='beauty-mark',strength=beauty?1.7:spot&&p.config.marks==='weathering'?.65:1,shade=Math.max(-.4,Math.min(1.4,f))*rule.depth*strength,rim=scar||id==='age'?sample(X,Y-1.1)*.012:0;
    let changed=false;for(let c=0;c<3;c++){const base=aged[k+c],warm=spot?[.75,1,1.12][c]:1,tint=scar?(c===0?1.5:c===1?-.5:-.3)*Math.max(0,f):0,delta=Math.round((-base*shade*warm+base*rim+tint)/2)*2;d[k+c]=clamp(base+delta);if(delta)changed=true;}if(changed)d[k+3]=face[k+3];
   }
   g.putImageData(im,0,0);layers[id]=out;
   if(id==='age'){aged=new Uint8ClampedArray(face);for(let k=0;k<d.length;k+=4)if(d[k+3])for(let c=0;c<3;c++)aged[k+c]=d[k+c];}
  }
 }
 // Ease the cut top of the authored nose into the forehead without softening its nostrils.
 function noseRoot(layers,size){
  const g=layers.nose.getContext('2d'),im=g.getImageData(0,0,size,size),d=im.data,skin=layers.face.getContext('2d').getImageData(0,0,size,size).data;let top=size,bottom=0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(d[(y*size+x)*4+3]){top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const depth=Math.max(2,(bottom-top+1)*.22);for(let y=top;y<Math.min(size,top+depth);y++)for(let x=0;x<size;x++){const k=(y*size+x)*4;if(!d[k+3]||!skin[k+3])continue;const t=Math.min(1,(y-top)/depth);for(let c=0;c<3;c++)d[k+c]=clamp(skin[k+c]*(1-t)+d[k+c]*t);}g.putImageData(im,0,0);
 }
 // Paired lower canines keep their rig placement, with pointed tips and warm ivory planes.
 function tusks(p,size){
  const out=canvas(size),g=out.getContext('2d'),raw=p.layers.teeth.getContext('2d').getImageData(0,0,N,N).data,scale=size/N;
  for(const side of [0]){const b=bounds(raw,side);if(!b)continue;
   const x=(side===0?b.x:b.x+b.w)*scale,y=b.y*scale,w=b.w*scale,h=b.h*scale,sign=side===0?1:-1;
   g.save();g.translate(x,y);g.scale(sign,1);g.beginPath();g.moveTo(w*.16,h*.95);g.bezierCurveTo(w*.23,h*.7,w*.08,h*.24,w*.32,0);g.bezierCurveTo(w*.49,h*.16,w*.57,h*.37,w*.7,h*.56);g.quadraticCurveTo(w*.9,h*.82,w*.86,h*.98);g.closePath();g.clip();
   const light=g.createLinearGradient(0,0,w,0);light.addColorStop(0,'#91866b');light.addColorStop(.32,'#e3ddbb');light.addColorStop(.55,'#cfc6a4');light.addColorStop(1,'#9c9272');g.fillStyle=light;g.fillRect(0,0,w,h);
   const root=g.createLinearGradient(0,h*.66,0,h);root.addColorStop(0,'rgba(92,76,49,0)');root.addColorStop(1,'rgba(92,76,49,.45)');g.fillStyle=root;g.fillRect(0,h*.66,w,h*.34);g.restore();
  }
  const im=g.getImageData(0,0,size,size);for(let k=3;k<im.data.length;k+=4)im.data[k]=im.data[k]>=128?255:0;
  const mid=Math.round(p.anchors.mouth.x*scale);for(let y=0;y<size;y++)for(let x=0;x<mid;x++){const other=mid*2-1-x;if(other<0||other>=size)continue;const k=(y*size+x)*4,j=(y*size+other)*4;for(let c=0;c<4;c++)im.data[j+c]=im.data[k+c];}g.putImageData(im,0,0);return out;
 }
 function fromTemplate(p,{colors={},size=256}={}){
  if(!loaded)throw Error('Painted portrait artwork is not ready');if(![128,256,512].includes(size))throw Error('Unsupported portrait size');
  colors=Object.fromEntries(Object.entries(E.colors).map(([key,value])=>[key,/^#[a-f0-9]{6}$/i.test(colors[key]||'')?colors[key]:value]));
  const layers={};for(const spec of E.order)layers[spec.id]=['eyes','iris','eyelids','mouth'].includes(spec.id)?canvas(size):paintMask(p,spec,colors,size);
  fitEars(p,layers,size);clipNeck(p,layers,size);noseRoot(layers,size);feature(p,colors,size,'eyes',layers);feature(p,colors,size,'mouth',layers);skinDetails(p,layers,size);
  if(['small-tusks','heavy-tusks'].includes(p.config.mouth))layers.teeth=tusks(p,size);
  for(const id of ['nose','eyes','iris','eyelids','mouth','teeth',...(['stubble','close-beard','chin-bristle'].includes(p.config.beard)?['beard']:[])]){const g=layers[id].getContext('2d');g.save();g.globalCompositeOperation='destination-in';g.drawImage(layers.face,0,0);g.restore();}
  const gear=HEADWEAR.get(p.config.headwear);
  return {config:p.config,anchors:p.anchors,colors,layers,size,coordinateScale:size/N,template:p,headMaster:{file:root.PAINTED_PORTRAIT_ASSETS[headSpec(p.config).sheet].file,frame:headSpec(p.config).index,profile:headSpec(p.config).profile},headwearMaster:gear?{file:root.PAINTED_PORTRAIT_ASSETS[gear.sheet].file,frame:gear.index}:null,style:'painted-parts'};
 }
 const fittedLayers=new WeakMap();
 function exportLayers(p){
  if(p.config.race!=='human'||p.config.profile==='female')return p.layers;
  if(!fittedLayers.has(p)){const layers={...p.layers};for(const id of ['face','age','marks','nose','eyelids']){const c=canvas(p.size);c.getContext('2d').drawImage(layers[id],0,0);layers[id]=fitHeadToBody(c,p.size);}fittedLayers.set(p,layers);}return fittedLayers.get(p);
 }
 function composite(p,{visible=null}={}){
  const layers=exportLayers(p),out=canvas(p.size),g=out.getContext('2d'),wearing=!visible||visible.headwearFront!==false||visible.headwearBack!==false,rule=wearing?E.headwearRules[p.config.headwear]:E.headwearRules.none,template=p.template;g.imageSmoothingEnabled=false;
  let mask=null;if(rule.hair==='tuck'||rule.hair==='frame'){mask=canvas(p.size);const q=mask.getContext('2d');if(rule.hair==='frame'){for(const id of ['face','headwearFront','headwearBack'])q.drawImage(p.layers[id],0,0);}else{const s=p.config.race==='orc'?(p.config.face==='orc-heavy'?.75:.875):1,dy=96*(1-s),rim=rule.rim*s+dy+(p.anchors.offsetY||0);q.fillStyle='#fff';q.fillRect(0,rim*p.coordinateScale,p.size,p.size);}}
  for(const spec of DRAW_ORDER){const id=spec.id;if(visible&&visible[id]===false||id==='ears'&&rule.ears==='hide'||id==='beard'&&rule.beard==='hide'||spec.feature==='hair'&&(rule.hair==='hide'||rule.hair==='frame'&&id==='hairBack'))continue;let src=layers[id];if(spec.feature==='hair'&&mask){const c=canvas(p.size),q=c.getContext('2d');q.drawImage(src,0,0);q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0);src=c;}g.drawImage(src,0,0);}
  if(rule.face==='covered'&&(!visible||visible.headwearFront!==false)){const c=canvas(p.size),q=c.getContext('2d');q.drawImage(template.layers.eyes,0,0,p.size,p.size);q.globalCompositeOperation='source-in';q.fillStyle='rgba(5,6,9,.78)';q.fillRect(0,0,p.size,p.size);q.globalCompositeOperation='destination-out';q.drawImage(p.layers.headwearFront,0,0);g.drawImage(c,0,0);}
  return out;
 }
 const API={version:2,partCount:79,headCount:8,order:DRAW_ORDER,get loaded(){return loaded},get error(){return error},fromTemplate,exportLayers,build:(input,options)=>fromTemplate(E.build(input),options),composite,render:(input,options={})=>composite(fromTemplate(E.build(input),options),options)};
 API.ready=Promise.all(root.PAINTED_PORTRAIT_ASSETS.map(async A=>{const im=new Image();im.src=A.src;await im.decode();const c=canvas(im.width),g=c.getContext('2d',{willReadFrequently:true});c.height=im.height;g.drawImage(im,0,0);return g;})).then(images=>{atlases.push(...images);loaded=true;root.dispatchEvent(new Event('portrait-art-ready'));return API}).catch(e=>{error=e.message;console.warn('Painted portraits unavailable:',e.message);return null});
 root.PortraitArtwork=Object.freeze(API);
})(globalThis);
