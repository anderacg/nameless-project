'use strict';
Kit.suite(({ok,info})=>{const t=T,PX=t.PX,C=t.CropWind;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.world();
 const p={tx:5,ty:5,kind:'wheat',clim:'grass',variant:0,stage:'ripe',snow:0,wet:0,fine:2,mask:new Uint8Array(1024).fill(1)},opts={fine:2,stage:'ripe'},sum=a=>a.reduce((s,n)=>s+(n>0),0),pixels=c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data),diff=(a,b)=>a.reduce((s,n,i)=>s+(n!==b[i]),0);
 const soil=PX.worldCrop('wheat','grass',0,{...opts,soilOnly:true}),left=C.sprite(p,-2),right=C.sprite(p,2);
 ok(sum(soil.a)===1024&&sum(left.a)>0&&sum(left.a)<1024,'farm soil is solid while the moving crop is a separate transparent sprite');
 ok(diff(pixels(left),pixels(right))>50,'wheat stalks and heads bend into distinct wind frames');
 const bottom=c=>Array.from(c.a.slice(31*32));ok(JSON.stringify(bottom(left))===JSON.stringify(bottom(right))&&bottom(left).some(Boolean),'wheat roots remain fixed while the tops bend');
 ok(C.sprite(p,-2)===left&&C.sprite(p,2)===right,'wind frames reuse cached artwork instead of generating it every frame');
 const phases=Array.from({length:60},(_,i)=>C.phase(80,80,'wheat',i*.5)),veg=Array.from({length:60},(_,i)=>C.phase(80,80,'veg',i*.5));
 ok(new Set(phases).size>=3&&Math.max(...phases.map(Math.abs))>Math.max(...veg.map(Math.abs)),'wheat responds to changing wind while broad vegetable leaves sway more gently');
 const reduced=window.reducedMotion;try{window.reducedMotion=()=>true;ok(C.phase(80,80,'wheat',12)===0,'reduced motion keeps crops upright')}finally{window.reducedMotion=reduced}
 const bare=C.sprite({...p,stage:'bare'},2),stubble=C.sprite({...p,stage:'stubble'},0);ok(sum(bare.a)===0&&sum(stubble.a)<sum(left.a),'harvested and winter fields do not grow moving ripe wheat');
 const types=Object.keys(PX.CROP_PLANTS),bad=[];for(const kind of types){const stage=t.FARM.grow[kind].summer,sp=C.sprite({...p,kind,stage},1);if(!sum(sp.a)||sp.width!==32)bad.push(kind)}
 ok(!bad.length,'grain, hay, vegetables, roots, herbs, flax, vines and irrigated crops have moving sprites: '+types.join(', '));
 const sea=t.FARM.season;t.FARM.season='summer';try{const town=t.TOWNS.find(q=>t.bldLv(q,'farm')>0),ground=t.estateGround(town,'farm',t.bldLv(town,'farm'));ok(ground.crops?.length>0&&ground.crops.every(q=>q.mask.length===1024&&q.stage),'actual farm ground carries clipped crop records for the live foliage layer')}finally{t.FARM.season=sea}
 const c=t.ctx,fog=t.CHEAT.noFog,stable=pixels(soil);c.save();try{c.setTransform(3,0,0,3,0,0);t.CHEAT.noFog=true;const ground={x:80,y:80,crops:[p]},clear=()=>c.clearRect(0,0,40,40);
  clear();C.draw(ground,10,10,0);const a=c.getImageData(0,0,120,120).data.slice(),time=phases.findIndex(n=>n!==phases[0])*.5;clear();C.draw(ground,10,10,time);const b=c.getImageData(0,0,120,120).data;
  ok(diff(a,b)>0&&diff(stable,pixels(soil))===0,'live drawing moves crop pixels without changing the soil');
 }finally{t.CHEAT.noFog=fog;c.restore()}
 ok(!ERR.length,'animated crops render without runtime errors');info('Transparent cached foliage, fixed roots, growth stages, wind amplitude and real farm integration exercised.');
});
