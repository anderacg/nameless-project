'use strict';
Kit.suite(({ok})=>{const t=T;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.SEAMLESS.on=true;
 const enemy=t.asParty({kind:'bandits',troops:['militia'],x:t.P.x+35,y:t.P.y,cool:0});t.bandits.push(enemy);t.startEncounter({kind:'party',ref:enemy,list:enemy.troops.slice(),mine:true});
 const b=t.B,a=b.world,k=a.scale,cv=t.mkcv(128,128),g=cv.getContext('2d'),ctx0=t.ctx,motion=window.reducedMotion,time=b.t,hero={x:b.hero.x,y:b.hero.y},shape=[a.x,a.y,a.radius],hp=b.units.map(u=>u.hp);
 t.G.cam.x=a.x+a.r-t.VW/2;t.G.cam.y=a.y-t.VH/2;a.syncCamera();
 const draw=time=>{b.t=time;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,128,128);g.setTransform(1/k,0,0,1/k,64-(a.cx+a.radius)/k,64-a.cy/k);g.globalAlpha=.73;g.setLineDash([2,3]);const before=g.getTransform();a.drawBoundary();
   ok(Math.abs(g.globalAlpha-.73)<1e-6&&g.getLineDash().join(',')==='2,3'&&g.getTransform().e===before.e,'boundary restores canvas state');
   const d=g.getImageData(0,0,128,128).data;let h=2166136261,n=0;for(let i=0;i<d.length;i++){h=Math.imul(h^d[i],16777619)>>>0;if(i%4===3&&d[i])n++}return{h,n}};
 window.__edgeCtx=g;window.eval('ctx=window.__edgeCtx');
 try{window.reducedMotion=()=>false;const x=draw(0),y=draw(2);ok(x.n>20&&y.n>20,'the actual eastern boundary paints a visible glow');ok(x.h!==y.h,'pulse, accents and sparks animate');
   window.reducedMotion=()=>true;const still=draw(0),later=draw(4);ok(still.h===later.h,'reduced motion keeps a steady boundary');
   b.hero.x=a.cx+a.radius-2*k;b.hero.y=a.cy;ok(draw(4).h!==still.h,'the boundary warms as the hero approaches it');
   ok([a.x,a.y,a.radius].every((v,i)=>v===shape[i])&&b.units.every((u,i)=>u.hp===hp[i]),'boundary drawing does not change the combat area or health');
 }finally{window.__edgeCtx=ctx0;window.eval('ctx=window.__edgeCtx');delete window.__edgeCtx;window.reducedMotion=motion;b.t=time;Object.assign(b.hero,hero)}
 ok(!ERR.length,'boundary effects produce no runtime errors');
});
