'use strict';
Kit.suite(({ok})=>{
 const t=T,col='#82c6b3',draw=t.ctx.drawImage,dpr=Object.getOwnPropertyDescriptor(window,'devicePixelRatio'),vs=t.VS;
 window.requestAnimationFrame=()=>0;
 try{
  let contained=true,shaded=false;
  for(const width of [18,36,54,108])for(const exposure of [0,.25,.5,.75,1]){
   const s=t.stealthEyeSprite(exposure,col,width),g=s.getContext('2d'),pixels=g.getImageData(0,0,s.width,s.height).data;
   ok(s.width===Math.round(width)&&s.height===Math.round(width*2/3)&&t.stealthEyeSprite(exposure,col,width)===s,'eye '+exposure+' at '+width+' pixels is painted at that size (its device px: render.js devPic) and reuses its cache');
   for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const a=pixels[(y*s.width+x)*4+3],b=pixels[((s.height-1-y)*s.width+x)*4+3];if((y===0||y===s.height-1)&&a)contained=false;if(a!==0&&a!==255)shaded=true}
  }
  ok(shaded,'painted eyelids have antialiased curved edges rather than solid pixel blocks');
  // (shut, it reads as a closed eye, not a hairline (the owner, 2026-11-21: "that weird grey line"): its drawn rows a fifth of its
  //  height at least, at the player's size)
  {const s=t.stealthEyeSprite(0,col,t.STEALTH_EYE.player),d=s.getContext('2d').getImageData(0,0,s.width,s.height).data;let y0=s.height,y1=-1;
   for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)if(d[(y*s.width+x)*4+3]>64){y0=Math.min(y0,y);y1=Math.max(y1,y)}
   ok(y1-y0+1>=s.height*.2,'a shut eye is a lid and its lashes, '+(y1-y0+1)+' of '+s.height+' rows, not a thin line')}
  ok(contained,'every awareness state keeps transparent padding around its eyelids');
  const calls=[];t.ctx.drawImage=(...a)=>calls.push(a);
  for(const density of [1,1.5,2,2.625,3])for(const zoom of [1,2,3,6,9]){
   Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:density});window.eval('VS='+zoom);
   for(const size of [t.STEALTH_EYE.size,t.STEALTH_EYE.player]){
    t.drawStealthEye(.5,col,10.37,20.63,size);const [s,x,y,w,h]=calls.pop();
    ok(Math.abs(x*zoom-Math.round(x*zoom))<1e-8&&Math.abs(y*zoom-Math.round(y*zoom))<1e-8&&Math.abs(w*zoom-s.width)<1e-8&&Math.abs(h*zoom-s.height)<1e-8&&Math.abs(s.width-size*t.dprOf())<=.5&&Math.abs(s.height-size*t.dprOf()*2/3)<=.5,'eye '+size+' at density '+density+' (drawn at '+t.dprOf()+': the Resolution setting\'s cap) and zoom '+zoom+' keeps its screen size, a px of its own to each device px, at whole device px');
   }
  }
  // (your own eye drawn only while someone is about who could see you: alone, none)
  {const obs=t.TravelAwareness.observers,calls2=[];t.ctx.drawImage=(...a)=>calls2.push(a);
   try{t.TravelAwareness.observers=()=>new Set();window.DETECT_LAST=null;(0,eval)('DETECT_LAST=null');Kit.begin('soldier',1);Kit.world();const n0=calls2.length;t.drawTravelDetection(t.G.cam||{x:t.P.x-t.VW/2,y:t.P.y-t.VH/2});
     ok(calls2.length===n0,'alone, with no one about who could see you, your eye is not drawn ('+(calls2.length-n0)+' drawn)')}
   finally{t.TravelAwareness.observers=obs;(0,eval)('DETECT_LAST=null')}}
 }finally{t.ctx.drawImage=draw;window.eval('VS='+vs);if(dpr)Object.defineProperty(window,'devicePixelRatio',dpr);else delete window.devicePixelRatio}
});
