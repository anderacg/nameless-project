'use strict';
Kit.suite(({ok})=>{const t=T;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.frame();
 const alpha=()=>{const c=t.MINI_FACE,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let translucent=0,opaque=0;for(let i=3;i<d.length;i+=4){if(d[i]>80&&d[i]<180)translucent++;if(d[i]>240)opaque++}return{translucent,opaque,total:d.length/4}};
 let a=alpha();ok(a.translucent>a.total*.5,'most map terrain is translucent');ok(a.opaque>0,'map markers retain opaque pixels');
 const hud=window.campaignHud;ok(t.MINI_FACE.parentNode===hud.slot&&hud.presentMini(t.MINI_FACE),'campaign minimap uses the HTML GUI layer');
 const di=t.ctx.drawImage;let copies=0;t.ctx.drawImage=function(pic,...args){if(pic===t.MINI_FACE)copies++;return di.call(this,pic,...args)};
 try{t.frame();ok(copies===0,'the HTML minimap is not also painted onto the world canvas')}finally{t.ctx.drawImage=di}
 t.SEAMLESS.on=true;const band=t.asParty({kind:'bandits',troops:['militia'],x:t.P.x+30,y:t.P.y,cool:0});t.bandits.push(band);t.startEncounter({kind:'party',ref:band,list:band.troops.slice(),mine:true});
 const mini=window.drawWorldMini,units=window.drawUnitIcons,order=[];window.drawWorldMini=(...args)=>{order.push('minimap');return mini(...args)};window.drawUnitIcons=(...args)=>{order.push('units');return units(...args)};
 try{t.frame();ok(order.filter(x=>x==='minimap').length===1&&order.indexOf('minimap')>order.indexOf('units'),'world combat draws the minimap once, after units and unit icons')}finally{window.drawWorldMini=mini;window.drawUnitIcons=units}
 ok(!hud.presentMini(t.MINI_FACE),'battle minimap uses the final canvas GUI pass while campaign controls are hidden');
 a=alpha();ok(a.translucent>a.total*.5,'battle map terrain remains translucent');
 // A flag captured in a raised, fine-resolution structure pass must replay in the same map position.
 {const F=t.WorldFlags,c=t.ctx,old=F.list.slice(),collect=F.collect,cam=F.cam,fog=t.CHEAT.noFog,pic=t.mkc(4,4,g=>{g.fillStyle='#d63232';g.fillRect(0,0,4,4)});
  try{c.save();c.setTransform(2,0,0,2,0,-20);F.begin({x:100,y:200});F.add(pic,5,15,4,4);F.collect=false;c.restore();
   ok(F.list.length===1&&F.list[0].x===105&&F.list[0].y===205,'foreground flags retain their camera position and ground lift');
   c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle='#000';c.fillRect(0,0,20,20);t.CHEAT.noFog=true;F.draw({x:100,y:200});const pixel=c.getImageData(6,6,1,1).data;
   ok(pixel[0]===214&&pixel[1]===50,'a foreground flag covers character pixels beneath its cloth');c.restore();
  }finally{F.list=old;F.collect=collect;F.cam=cam;t.CHEAT.noFog=fog}
  const draw=F.draw,unit=window.drawUnit,events=[];F.draw=(...args)=>{events.push('flag');return draw.apply(F,args)};window.drawUnit=(...args)=>{events.push('unit');return unit(...args)};
  try{t.frame();ok(events.includes('unit')&&events.lastIndexOf('flag')>events.lastIndexOf('unit'),'world battle structural flags draw after the characters')}finally{F.draw=draw;window.drawUnit=unit}
 }
 // Dedicated battlefields use the same final GUI ordering and translucent map background.
 Kit.clear();Kit.world();t.startBattle({sandbox:true,enemies:['militia'],deploy:false});
 {const field=window.drawMiniField,flash=window.heroFlashDraw,events=[];window.drawMiniField=(...args)=>{events.push('mini');return field(...args)};window.heroFlashDraw=(...args)=>{events.push('flash');return flash(...args)};
  try{t.frame();ok(!t.B.world&&events.filter(s=>s==='mini').length===1&&events.indexOf('mini')>events.indexOf('flash'),'separate-battle minimaps render once in the final GUI pass, above scene effects')}finally{window.drawMiniField=field;window.heroFlashDraw=flash}
  const c=t.ctx,r=t.miniRect();c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(r.x,r.y,r.w,r.h);t.drawMiniField();const pixels=c.getImageData(r.x+2,r.y+2,r.w-4,r.h-4).data;let translucent=0;
  for(let i=3;i<pixels.length;i+=4)if(pixels[i]>50&&pixels[i]<200)translucent++;
  ok(translucent>pixels.length/4*.6,'dedicated battlefield terrain is translucent while markers retain their own opacity');c.restore();
 }
 ok(!ERR.length,'minimap transparency and GUI ordering produce no runtime errors');
});
