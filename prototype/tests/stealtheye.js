'use strict';
Kit.suite(({ok})=>{
 const t=T,col='#82c6b3',draw=t.ctx.drawImage,dpr=Object.getOwnPropertyDescriptor(window,'devicePixelRatio'),vs=t.VS;
 window.requestAnimationFrame=()=>0;
 try{
  let contained=true,shaded=false;
  for(const width of [18,36,54,108])for(const exposure of [0,.25,.5,.75,1]){
   const s=t.stealthEyeSprite(exposure,col,width),g=s.getContext('2d'),pixels=g.getImageData(0,0,s.width,s.height).data;
   ok(s.width===Math.max(72,width)&&s.height===Math.ceil(Math.max(72,width)*2/3)&&t.stealthEyeSprite(exposure,col,width)===s,'eye '+exposure+' at '+width+' pixels has native dimensions and reuses its cache');
   for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const a=pixels[(y*s.width+x)*4+3],b=pixels[((s.height-1-y)*s.width+x)*4+3];if((y===0||y===s.height-1)&&a)contained=false;if(a!==0&&a!==255)shaded=true}
  }
  ok(shaded,'painted eyelids have antialiased curved edges rather than solid pixel blocks');
  ok(contained,'every awareness state keeps transparent padding around its eyelids');
  const calls=[];t.ctx.drawImage=(...a)=>calls.push(a);
  for(const density of [1,1.5,2,2.625,3])for(const zoom of [1,2,3,6,9]){
   Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:density});window.eval('VS='+zoom);
   for(const size of [t.STEALTH_EYE.size,t.STEALTH_EYE.player]){
    t.drawStealthEye(.5,col,10.37,20.63,size);const [s,x,y,w,h]=calls.pop();
    ok(Math.abs(x*zoom-Math.round(x*zoom))<1e-8&&Math.abs(y*zoom-Math.round(y*zoom))<1e-8&&Math.abs(w*zoom-size*t.dprOf())<1e-8&&Math.abs(h/w-2/3)<1e-8&&s.width>=w*zoom,'eye '+size+' at density '+density+' (drawn at '+t.dprOf()+': the Resolution setting\'s cap) and zoom '+zoom+' preserves screen size and uses artwork at display density or above');
   }
  }
 }finally{t.ctx.drawImage=draw;window.eval('VS='+vs);if(dpr)Object.defineProperty(window,'devicePixelRatio',dpr);else delete window.devicePixelRatio}
});
