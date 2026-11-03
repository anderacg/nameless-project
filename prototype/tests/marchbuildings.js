'use strict';
// A march's grid follows the buildings it lies over (world/march.js MarchGround fresh, marchBlocksSig; the code review's finding,
// 2026-11-03: building changes moved no world version, the grid kept right only by its timer): standing by a holding, its grid is
// kept while nothing changes; a building on it burnt (or raised, or finished), the grid is made again at once, its footing gone.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;
 const ash=t.townBy('Ashford')||t.TOWNS[0];Kit.goTo(ash.x+20,ash.y+40);P.troops={hum_foot:8};const A=t.MarchArmy.of(P);A.sync();
 for(let i=0;i<5;i++)A.step(.05);const g0=A.ground;ok(!!g0,'(an army standing by '+ash.name+', its grid made)');
 A.step(.05);ok(A.ground===g0&&g0.fresh(),'nothing changed: the same grid kept');
 const l=(ash.lots||[]).find(l=>l.st==='built'&&l.k!=='field'&&l.k!=='pasture'&&l.k!=='centre'&&l.x*t.TILE<g0.x1&&l.y*t.TILE<g0.y1&&(l.x+l.n)*t.TILE>g0.x&&(l.y+l.n)*t.TILE>g0.y);
 ok(!!l,'(a building of '+ash.name+' under its grid: '+(l&&l.k)+')');if(!l)return;
 const had=g0.blocks.length;l.st='ruined';l._s=null;ok(!g0.fresh(),'burnt: the grid knows it is stale');
 A.step(.05);ok(A.ground!==g0&&A.ground.fresh()&&A.ground.blocks.length<had,'made again at once, before its timer: its footing gone ('+had+' blocks, now '+A.ground.blocks.length+')');
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
