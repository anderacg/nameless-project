'use strict';
// The map's frame, layer by layer (the owner, 2026-11-28: "Can you make the drawing layer more streamlined and more structured?",
// "Define each layer carefully so it easier to maintain and develop further"; gfx/render.js WORLD_LAYERS, WorldFrame, WORLD_ENT;
// doc/DRAW_LAYERS.md): the order of what is drawn is one table, a layer a row with its pass and when it is drawn, each name a method
// of the frame; a frame runs every layer once, in the table's order, the scene's into the kept scene and the rest onto the screen; a
// layer that throws is left out and the rest drawn; a layer's when is kept; every entry of the frame's list carries only the fields
// defined for one (WORLD_ENT); what stands is drawn by its feet, whoever moves after it, what lies before those standing, a flyer last.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,L=t.WORLD_LAYERS,F=t.WorldFrame.prototype,E=t.WORLD_ENT;Kit.begin('soldier',1);Kit.world();G.mode='world';G.modal=false;
 const names=L.map(l=>l.name),passes=[...new Set(L.map(l=>l.pass))],runs=L.map(l=>l.pass).filter((p,i,a)=>!i||a[i-1]!==p);
 ok(passes.join()==='scene,movers,sky,light,over,mini'&&runs.join()===passes.join(),'the passes, bottom to top, each its layers together: '+passes.join(', '));
 ok(names.every(n=>typeof F[n]==='function')&&new Set(names).size===names.length&&L.every(l=>Object.keys(l).every(k=>['name','pass','when'].includes(k))&&(!l.when||typeof l.when==='function')),
  'every layer of the table is a method of the frame, none twice, each a name, a pass and at most a when ('+names.length+': '+names.join(', ')+')');
 {const own=Object.getOwnPropertyNames(F).filter(n=>!['constructor','draw','pass'].includes(n)),stray=own.filter(n=>!names.includes(n));
  ok(!stray.length,'the frame has no layer the table does not order'+(stray.length?': '+stray.join(', '):''))}
 // ---- a frame: every layer once, in the table's order; the scene's into the kept scene, the rest not
 const wrap=(fn)=>{const keep={};for(const n of names){keep[n]=F[n];F[n]=function(){return fn(n,()=>keep[n].call(this),this)}}return()=>{for(const n of names)F[n]=keep[n]}};
 {const ran=[],into={},undo=wrap((n,go,fr)=>{ran.push(n);into[n]=t.ctx.canvas===fr.low;return go()});
  try{t.drawWorld()}finally{undo()}
  const due=L.filter(l=>!l.when||l.when({snap:false})).map(l=>l.name),wrong=L.filter(l=>into[l.name]!=null&&into[l.name]!==(l.pass==='scene')).map(l=>l.name);
  ok(ran.join()===due.join(),'a frame of the map draws them once each, in that order ('+ran.length+' layers; not drawn now: '+(names.filter(n=>!ran.includes(n)).join(', ')||'none')+')');
  ok(!wrong.length&&into.ground===true&&into.figures===false,'the scene\'s layers draw into the kept scene, every other onto the screen'+(wrong.length?': not '+wrong.join(', '):''))}
 // ---- a layer's when: the grid only while it is on or a building is placed
 {const on=t.GRID.on,ran=[],undo=wrap((n,go)=>{ran.push(n);return go()});
  try{t.GRID.on=false;t.drawWorld();const a=ran.includes('grid');ran.length=0;t.GRID.on=true;t.drawWorld();ok(!a&&ran.includes('grid'),'a layer is drawn only while its when holds: the grid off, not drawn; on, drawn')}finally{t.GRID.on=on;undo()}}
 // ---- a layer that throws: left out, its error told, every other drawn, the canvas's state as it was
 {const le=window.loopError,told=[],ran=[];window.loopError=e=>told.push(e.message);const undo=wrap((n,go)=>{ran.push(n);if(n==='flyers'){t.ctx.globalAlpha=.3;throw new Error('a layer broke')}return go()});
  try{t.drawWorld()}finally{undo();window.loopError=le}
  ok(told.join()==='a layer broke'&&ran.includes('minimap')&&ran.indexOf('squares')===ran.indexOf('flyers')+1&&t.ctx.globalAlpha===1,'a layer that throws is left out, its error told once, the layers after it drawn ('+(ran.length-1)+' more) and the canvas as it was')}
 // ---- the list's entries: only the fields defined for one, its feet a number and its drawing a function
 {const seen=new Set(),bad=[];let n=0;const ev=F.standing;F.standing=function(){ev.call(this);for(const e of this.ents){n++;for(const k of Object.keys(e))if(k[0]!=='_'){seen.add(k);if(!(k in E))bad.push(k)}if(typeof e.f!=='function'||typeof e.y!=='number')bad.push('an entry with no f or y')}};
  try{for(const h of t.TOWNS.slice(0,3)){Kit.goTo(h.x,h.y+24);for(let i=0;i<3;i++)t.drawWorld()}}finally{F.standing=ev}
  ok(n>100&&!bad.length&&Object.values(E).every(v=>typeof v==='string'&&v.length>10),'every entry of the frame\'s list carries only the fields defined for one, each field said what it means ('+n+' entries by 3 holdings; in use: '+[...seen].sort().join(', ')+')'+(bad.length?': not '+[...new Set(bad)].join(', '):''))}
 // ---- the list: what stands into the scene by its feet; of the movers, what lies first, then each by its feet; a flyer after all
 {const drew=[],mk=(name,o)=>({x:P.x+40,...o,f:()=>drew.push(name)}),mine=[mk('tree',{y:P.y+9,st:true}),mk('house',{y:P.y+3,st:true}),mk('man',{y:P.y+6}),mk('deer',{y:P.y+1}),mk('body',{y:P.y+8,lay:1}),mk('blood',{y:P.y+8,lay:0}),mk('griffin',{y:P.y-5,top:true})];
  const ev=F.everyone;F.everyone=function(){ev.call(this);this.ents.push(...mine)};
  try{t.drawWorld()}finally{F.everyone=ev}
  ok(drew.join()==='house,tree,blood,body,deer,man,griffin','what stands first, by its feet; then what lies (blood, the fallen), everyone by his feet, and the flyer last ('+drew.join(', ')+')')}
});
