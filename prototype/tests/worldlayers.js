'use strict';
// The map's frame, layer by layer (the owner, 2026-11-28: "Can you make the drawing layer more streamlined and more structured?";
// gfx/render.js WORLD_LAYERS, WorldFrame): the order of what is drawn is one table, a pass a row, each name a method of the frame;
// a frame runs every layer once, in the table's order; what stands is drawn into the kept scene by its feet, whoever moves after
// it, what lies on the ground before those standing, whoever flies last.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,L=t.WORLD_LAYERS,F=t.WorldFrame.prototype;Kit.begin('soldier',1);Kit.clear();Kit.world();G.mode='world';G.modal=false;
 const passes=Object.keys(L),names=passes.flatMap(k=>L[k]);
 ok(passes.join()==='scene,movers,sky,light,over,mini','the passes, bottom to top: '+passes.join(', '));
 ok(names.every(n=>typeof F[n]==='function')&&new Set(names).size===names.length,'every layer of the table is a method of the frame, none twice ('+names.length+': '+names.join(', ')+')');
 {const own=Object.getOwnPropertyNames(F).filter(n=>!['constructor','draw','pass'].includes(n)),stray=own.filter(n=>!names.includes(n));
  ok(!stray.length,'the frame has no layer the table does not order'+(stray.length?': '+stray.join(', '):''))}
 // ---- a frame: every layer once, in the table's order
 {const ran=[],keep={};for(const n of names){keep[n]=F[n];F[n]=function(){ran.push(n);return keep[n].call(this)}}
  try{t.drawWorld()}finally{for(const n of names)F[n]=keep[n]}
  ok(ran.join()===names.join(),'a frame of the map draws them all once, in that order ('+ran.length+' layers)')}
 // ---- the list: what stands into the scene by its feet; of the movers, what lies first, then each by its feet; a flyer after all
 {const drew=[],mk=(name,o)=>({x:t.P.x+40,...o,f:()=>drew.push(name)}),mine=[mk('tree',{y:t.P.y+9,st:true}),mk('house',{y:t.P.y+3,st:true}),mk('man',{y:t.P.y+6}),mk('deer',{y:t.P.y+1}),mk('body',{y:t.P.y+8,lay:1}),mk('blood',{y:t.P.y+8,lay:0}),mk('griffin',{y:t.P.y-5,top:true})];
  const ev=F.everyone;F.everyone=function(){ev.call(this);this.ents.push(...mine)};
  try{t.drawWorld()}finally{F.everyone=ev}
  ok(drew.join()==='house,tree,blood,body,deer,man,griffin','what stands first, by its feet; then what lies (blood, the fallen), everyone by his feet, and the flyer last ('+drew.join(', ')+')')}
});
