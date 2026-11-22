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
 ok(!ERR.length,'minimap transparency and GUI ordering produce no runtime errors');
});
