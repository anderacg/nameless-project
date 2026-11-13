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
  for(let i=0;i<alpha.length;i++){const k=i*4,lum=(d[k]+d[k+1]+d[k+2])/3;alpha[i]=d[k+3]>=128?255:0;if(alpha[i]&&(!metal||lum>=50)){seen[i]=1;queue[end++]=i;}}
  for(let at=0;at<end;at++){const i=queue[at],X=i%w,Y=Math.floor(i/w);for(const j of [X?i-1:-1,X<w-1?i+1:-1,Y?i-w:-1,Y<h-1?i+w:-1])if(j>=0&&!seen[j]){for(let k=0;k<3;k++)d[j*4+k]=d[i*4+k];seen[j]=1;queue[end++]=j;}}
  const top=new Uint16Array(w).fill(h);for(let Y=0;Y<h;Y++)for(let X=0;X<w;X++)if(alpha[Y*w+X])top[X]=Math.min(top[X],Y);
  const out={w,h,d,alpha,top};fields.set(key,out);return out;
 }
 function bounds(d,side=null){let x=N,y=N,r=-1,b=-1;for(let Y=0;Y<N;Y++)for(let X=side===1?64:0;X<(side===0?64:N);X++)if(d[(Y*N+X)*4+3]){x=Math.min(x,X);r=Math.max(r,X);y=Math.min(y,Y);b=Math.max(b,Y);}return r<0?null:{x,y,w:r-x+1,h:b-y+1};}
 function bodyPart(c){const s=c.clothing;return /dwarf|rune/.test(s)?13:/elf|leaf/.test(s)?15:/harness/.test(s)?14:/fur|cloak/.test(s)?22:/leather|jerkin|hide/.test(s)?21:/mail/.test(s)?11:/plate|cuirass|scale|lamellar|brigandine/.test(s)?12:10;}
 function part(id,c){
  if(id==='face')return [0,c.race==='human'?(c.profile==='female'?1:0):({dwarf:2,orc:3,elf:4}[c.race]||0)];
  if(id==='torso')return [1,20];
  if(id==='ears')return [0,/elven|elf-swept/.test(c.ears)?8:/pointed|orc/.test(c.ears)?7:c.race==='dwarf'?6:5];
  if(id==='brows')return [0,/dwarf|bold|full/.test(c.brows)?15:/slim|soft|arch/.test(c.brows)?16:14];
  if(id==='nose')return [0,/orc/.test(c.nose)?19:/dwarf|broad|round|wide/.test(c.nose)?18:/slender|soft|button|short/.test(c.nose)?20:17];
  if(id==='mouth')return [0,c.race==='orc'?23:c.race==='dwarf'?24:/full|cupid|pout|bow/.test(c.mouth)||c.profile==='female'?22:21];
  if(id==='beard'){if(['none','stubble','close-beard','chin-bristle'].includes(c.beard))return null;return [1,/moustache|walrus/.test(c.beard)?8:/goatee/.test(c.beard)?9:c.race==='dwarf'||/fork|braid/.test(c.beard)?7:6];}
  if(id.startsWith('hair'))return [1,c.hair==='war-crest'?4:/ponytail|bun|topknot/.test(c.hair)?24:/braid/.test(c.hair)?5:/long|shoulder|loose|half-up/.test(c.hair)?id==='hairBack'?2:3:/wave|swept|curtain|shag|curl/.test(c.hair)?1:0];
  if(id.startsWith('headwear'))return [1,c.headwear==='coif'?11:/hood|cap|veil|wrap|turban|hat|beret/.test(c.headwear)?16:/horn|dwarf|forge/.test(c.headwear)?18:/closed|great|bascinet|sallet|mask|visor/.test(c.headwear)?19:17];
  if(id==='armor'||id==='clothing'){let n=bodyPart(c);if(id==='armor'&&[10,14,20,21,22].includes(n))n=12;return [1,n];}return null;
 }
 function baseFor(sheet,index,id){if(id==='hairFront'||id==='hairBack'||id==='beard'||id==='brows')return BASE.hair;if(id==='mouth')return index===23?BASE.orc:BASE.lips;if(sheet===0||id==='torso')return sheet===0&&[3,7,19].includes(index)?BASE.orc:BASE.skin;return index===10?BASE.cloth:[14,16,21].includes(index)?BASE.leather:index===22?BASE.fur:BASE.metal;}
 function sample(f,u,v){const x=Math.max(0,Math.min(f.w-1,Math.floor(u*f.w))),y=Math.max(0,Math.min(f.h-1,Math.floor(v*f.h))),i=y*f.w+x;return {rgb:[f.d[i*4],f.d[i*4+1],f.d[i*4+2]],alpha:f.alpha[i]};}
 function put(d,i,rgb,alpha){d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];d[i+3]=alpha;}
 function paintMask(p,spec,colors,size){
  const id=spec.id,src=part(id,p.config),out=canvas(size),g=out.getContext('2d');g.imageSmoothingEnabled=false;
  if(!src){g.drawImage(spec.channel?E.tint(p.layers[id],colors[spec.channel]):p.layers[id],0,0,size,size);return out;}
  const a=p.layers[id].getContext('2d').getImageData(0,0,N,N).data,im=g.createImageData(size,size),d=im.data,pair=id==='ears'||id==='brows',scale=size/N,target=hex(colors[spec.channel]),base=baseFor(...src,id),contrast=id==='face'?(p.anchors.definition-.4)*.07-(p.anchors.softness-.5)*.025:0;
  const bodyTops=new Uint16Array(N).fill(N);if(['torso','clothing','armor'].includes(id)){const masks=id==='torso'?[a]:['clothing','armor'].map(key=>p.layers[key].getContext('2d').getImageData(0,0,N,N).data);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(masks.some(d=>d[(y*N+x)*4+3]))bodyTops[x]=Math.min(bodyTops[x],y);}
  for(const side of pair?[0,1]:[null]){const b=bounds(a,side);if(!b)continue;const f=frame(...src,side,id.startsWith('headwear')),body=['torso','clothing','armor'].includes(id);
   for(let Y=Math.floor(b.y*scale);Y<Math.ceil((b.y+b.h)*scale);Y++)for(let X=Math.floor(b.x*scale);X<Math.ceil((b.x+b.w)*scale);X++){
    const x=(X+.5)/scale,y=(Y+.5)/scale,k=(Math.floor(y)*N+Math.floor(x))*4;if(!a[k+3])continue;
    let u=(x-b.x)/b.w,v=(y-b.y)/b.h;
    if(body){u=(x-4)/120;const X=Math.max(0,Math.min(f.w-1,Math.floor(u*f.w))),top=f.top[X];v=(top+(y-bodyTops[Math.floor(x)])*f.w/120)/f.h;}
    if(id==='face'){const A=p.anchors,eye=A.eyes[0].y;v=y<eye?(y-A.top)/(eye-A.top)*.4:y<A.chinY?.4+(y-eye)/(A.chinY-eye)*.42:.82+(y-A.chinY)/(103-A.chinY)*.18;}
    const sampled=sample(f,u,v);if(id==='face'&&!sampled.alpha)continue;
    const raw=sampled.rgb,warm=raw[0]>raw[1]*1.08&&raw[1]>raw[2]*1.3&&raw[0]>90;let rgb=(id==='armor'||id.startsWith('headwear'))&&warm?raw:recolor(raw,target,base,contrast);
    if(id==='armor'||id==='clothing'||id.startsWith('headwear')){if(a[k]<=48)rgb=rgb.map(v=>clamp(v*(id.startsWith('headwear')?.24:.7)));else if(a[k]<=64)rgb=rgb.map(v=>clamp(v*.8));else if(a[k]>=224)rgb=rgb.map(v=>clamp(v*1.08+10));else rgb=rgb.map(v=>clamp(v+(a[k]-128)*.1));}
    if(['hairFront','hairBack','beard','brows'].includes(id))rgb=rgb.map(v=>clamp(v+(a[k]-128)*.12));
    put(d,(Y*size+X)*4,rgb,a[k+3]);
   }
  }g.putImageData(im,0,0);return out;
 }
 // The original painted face edge is authoritative; clip the neck beneath it without reshaping it.
 function clipNeck(layers,size){
  const face=layers.face.getContext('2d').getImageData(0,0,size,size).data,g=layers.torso.getContext('2d'),im=g.getImageData(0,0,size,size),bottom=Math.ceil(94*size/N);
  for(let y=0;y<bottom;y++)for(let x=0;x<size;x++){const k=(y*size+x)*4;if(!face[k+3])im.data[k+3]=0;}g.putImageData(im,0,0);
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
  clipNeck(layers,size);noseRoot(layers,size);feature(p,colors,size,'eyes',layers);feature(p,colors,size,'mouth',layers);skinDetails(p,layers,size);
  if(['small-tusks','heavy-tusks'].includes(p.config.mouth))layers.teeth=tusks(p,size);
  for(const id of ['nose','eyelids',...(['stubble','close-beard','chin-bristle'].includes(p.config.beard)?['beard']:[])]){const g=layers[id].getContext('2d');g.save();g.globalCompositeOperation='destination-in';g.drawImage(layers.face,0,0);g.restore();}
  return {config:p.config,anchors:p.anchors,colors,layers,size,coordinateScale:size/N,template:p,style:'painted-parts'};
 }
 function composite(p,{visible=null}={}){
  const out=canvas(p.size),g=out.getContext('2d'),wearing=!visible||visible.headwearFront!==false||visible.headwearBack!==false,rule=wearing?E.headwearRules[p.config.headwear]:E.headwearRules.none,template=p.template;g.imageSmoothingEnabled=false;
  let mask=null;if(rule.hair==='tuck'||rule.hair==='frame'){mask=canvas(p.size);const q=mask.getContext('2d');if(rule.hair==='frame'){for(const id of ['face','headwearFront','headwearBack'])q.drawImage(template.layers[id],0,0,p.size,p.size);}else{const s=p.config.race==='orc'?(p.config.face==='orc-heavy'?.75:.875):1,dy=96*(1-s),rim=rule.rim*s+dy+(p.anchors.offsetY||0);q.fillStyle='#fff';q.fillRect(0,rim*p.coordinateScale,p.size,p.size);}}
  for(const spec of E.order){const id=spec.id;if(visible&&visible[id]===false||id==='ears'&&rule.ears==='hide'||id==='beard'&&rule.beard==='hide'||spec.feature==='hair'&&(rule.hair==='hide'||rule.hair==='frame'&&id==='hairBack'))continue;let src=p.layers[id];if(spec.feature==='hair'&&mask){const c=canvas(p.size),q=c.getContext('2d');q.drawImage(src,0,0);q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0);src=c;}g.drawImage(src,0,0);}
  if(rule.face==='covered'&&(!visible||visible.headwearFront!==false)){const c=canvas(p.size),q=c.getContext('2d');q.drawImage(template.layers.eyes,0,0,p.size,p.size);q.globalCompositeOperation='source-in';q.fillStyle='rgba(5,6,9,.78)';q.fillRect(0,0,p.size,p.size);q.globalCompositeOperation='destination-out';q.drawImage(p.layers.headwearFront,0,0);g.drawImage(c,0,0);}
  return out;
 }
 const API={version:1,partCount:50,get loaded(){return loaded},get error(){return error},fromTemplate,build:(input,options)=>fromTemplate(E.build(input),options),composite,render:(input,options={})=>composite(fromTemplate(E.build(input),options),options)};
 API.ready=Promise.all(root.PAINTED_PORTRAIT_ASSETS.map(async A=>{const im=new Image();im.src=A.src;await im.decode();const c=canvas(im.width),g=c.getContext('2d',{willReadFrequently:true});c.height=im.height;g.drawImage(im,0,0);return g;})).then(images=>{atlases.push(...images);loaded=true;root.dispatchEvent(new Event('portrait-art-ready'));return API}).catch(e=>{error=e.message;console.warn('Painted portraits unavailable:',e.message);return null});
 root.PortraitArtwork=Object.freeze(API);
})(globalThis);
