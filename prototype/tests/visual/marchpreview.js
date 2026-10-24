'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;P.troops={hum_levy:3};t.fitScreen();G.mode='char';t.openMarch();
 const cv=document.getElementById('marchCanvas'),box=cv.getBoundingClientRect(),v=t.marchCanvasView(),rows=t.marchDraftRows();
 ok(box.width>innerWidth*.45&&box.height>=270,'formation drawing uses the available left pane');
 const sizes=[];for(const row of rows){const draws=[],g={save(){},restore(){},drawImage(...a){draws.push(a)}};t.marchUnitPreview(g,row,100,100,v.scale);sizes.push(...draws.map(a=>a[3]/a[0].width))}
 ok(sizes.every(k=>Math.abs(k-t.MARCH_PREVIEW.sprite)<.001),'hero and soldiers use one fixed preview sprite scale');
 ok(!ERR.length,'editor renders without errors on '+innerWidth+' by '+innerHeight);
});
