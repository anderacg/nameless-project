'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;P.troops={hum_levy:3};t.fitScreen();G.mode='char';t.openMarch();
 const cv=document.getElementById('marchCanvas'),box=cv.getBoundingClientRect(),v=t.marchCanvasView(),rows=t.marchDraftRows();
 ok(box.width>innerWidth*.45&&box.height>=270,'formation drawing uses the available left pane');
 const bitmap=cv.width;cv.width=bitmap+400;const resized=cv.getBoundingClientRect();
 ok(Math.abs(resized.width-box.width)<1&&Math.abs(resized.height-box.height)<1,'canvas bitmap changes do not resize the preview pane');
 cv.width=bitmap;t.drawMarch();
 const sizes=[];for(const row of rows){const draws=[],g={save(){},restore(){},drawImage(...a){draws.push(a)}};t.marchUnitPreview(g,row,100,100,v.scale);sizes.push(...draws.map(a=>a[3]/a[0].width))}
 {const k=t.marchSpriteK(v.scale);ok(sizes.every(x=>Math.abs(x-k)<.001),'hero and soldiers drawn at the map\'s own size for the view, as their spacing is ('+k.toFixed(2)+'×: WORLD_BATTLE.sprite / scale × the view; the owner, 2026-10-31: "match the real battle space and proportion")')}
 ok(!ERR.length,'editor renders without errors on '+innerWidth+' by '+innerHeight);
});
