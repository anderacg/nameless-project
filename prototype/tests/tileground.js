'use strict';
// The map's ground from stored pieces (the owner, 2026-11-24: "would it better if we skip those drawing by using tileset concept? Just
// store curve and edge, hill and all as variants"; gfx/tileground.js TileSet, tileChunk; data/world.js TILE_GROUND): off unless asked;
// on, a chunk painted from the stored textures, edges and face strips keeps every record the game reads (what is wet, how deep, the
// lift, the ground row, the props), agrees with the lab's painter on where the water is and how high the land stands, and is quicker.
Kit.suite(({ok,info})=>{const t=T,G=t.G,TG=t.TILE_GROUND,WA=t.WorldArt;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);G.paused=true;
 ok(TG.on===false&&!t.tileGroundOn(),'off unless asked (TILE_GROUND.on false)');
 const was=TG.on;try{TG.on=true;ok(t.tileGroundOn(),'on when TILE_GROUND.on');TG.on='phone';ok(t.tileGroundOn()===matchMedia('(pointer: coarse)').matches,'"phone": on a phone only')}finally{TG.on=was}
 const town=t.TOWNS.find(h=>h.kind==='town'),cx=Math.floor(town.x/t.CHUNK),cy=Math.floor(town.y/t.CHUNK),fine=t.paintRes();
 const paint=on=>{TG.on=on;try{const j=WA.paintJob(cx,cy,fine),t0=performance.now();t.runGen(j.gen);return{rec:j.rec,ms:performance.now()-t0}}finally{TG.on=was}};
 paint(true);const A=paint(false),B=paint(true),a=A.rec,b=B.rec,[,,w,h]=WA.rect(cx,cy);
 info('chunk '+cx+','+cy+' at '+fine+'x: the lab\'s painter '+Math.round(A.ms)+' ms, the stored pieces '+Math.round(B.ms)+' ms');
 ok(b.fcv&&b.fcv.width===a.fcv.width&&b.fcv.height===a.fcv.height&&b.fr===a.fr,'its picture the same size ('+b.fcv.width+' x '+b.fcv.height+')');
 ok(['wet','shd','lift','dep'].every(k=>b[k]&&b[k].length===w*h),'every record the game reads, one a game px (wet, shd, lift, dep)');
 ok(b.shore instanceof Int16Array&&b.flow instanceof Int16Array&&b.props.length>50&&b.grass&&b.grass.n>50,'its shore, props ('+b.props.length+') and grass ('+(b.grass&&b.grass.n)+')');
 let agree=0,dl=0,n=0;for(let k=0;k<w*h;k++){if(!!a.wet[k]===!!b.wet[k])agree++;if(!a.wet[k]&&!b.wet[k]){dl+=Math.abs(a.lift[k]-b.lift[k]);n++}}
 ok(agree/(w*h)>.95,'the water where the lab\'s painter has it ('+(agree/(w*h)*100).toFixed(1)+'% of game px)');
 ok(dl/n<4,'the land as high (mean lift apart '+(dl/n).toFixed(2)+' fine px)');
 ok(B.ms<A.ms,'quicker than the lab\'s painter')});
