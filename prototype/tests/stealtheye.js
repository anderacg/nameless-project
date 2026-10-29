'use strict';
Kit.suite(({ok})=>{
 const t=T,col='#82c6b3',draw=t.ctx.drawImage,dpr=Object.getOwnPropertyDescriptor(window,'devicePixelRatio'),vs=t.VS;
 window.requestAnimationFrame=()=>0;
 try{
  let symmetric=true,contained=true,opaque=true;
  for(const width of [18,36,54,108])for(const exposure of [0,.25,.5,.75,1]){
   const s=t.stealthEyeSprite(exposure,col,width),g=s.getContext('2d'),pixels=g.getImageData(0,0,s.width,s.height).data;
   ok(s.width===width&&s.height===width*2/3&&t.stealthEyeSprite(exposure,col,width)===s,'eye '+exposure+' at '+width+' pixels has native dimensions and reuses its cache');
   for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const a=pixels[(y*s.width+x)*4+3],b=pixels[((s.height-1-y)*s.width+x)*4+3];if(a!==b)symmetric=false;if((y===0||y===s.height-1)&&a)contained=false;if(a!==0&&a!==255)opaque=false}
  }
  ok(opaque,'every eye pixel is either solid or transparent, with no blurred antialiased edges');
  ok(symmetric&&contained,'eyelids remain vertically symmetric with transparent padding in every awareness state');
  const calls=[];t.ctx.drawImage=(...a)=>calls.push(a);
  for(const density of [1,1.5,2,2.625,3])for(const zoom of [1,2,3,6,9]){
   Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:density});window.eval('VS='+zoom);
   for(const size of [t.STEALTH_EYE.size,t.STEALTH_EYE.player]){
    t.drawStealthEye(.5,col,10.37,20.63,size);const [s,x,y,w,h]=calls.pop();
    ok(Math.abs(x*zoom-Math.round(x*zoom))<1e-8&&Math.abs(y*zoom-Math.round(y*zoom))<1e-8&&w*zoom===s.width&&h*zoom===s.height&&s.width===18*Math.max(1,Math.round(size*t.dprOf()/18)),'eye '+size+' at density '+density+' (drawn at '+t.dprOf()+': the Resolution setting\'s cap) and zoom '+zoom+' draws one source pixel per canvas pixel');
   }
  }
 }finally{t.ctx.drawImage=draw;window.eval('VS='+vs);if(dpr)Object.defineProperty(window,'devicePixelRatio',dpr);else delete window.devicePixelRatio}
});
