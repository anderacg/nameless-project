'use strict';
// Compare pixels captured before combat with the real actors after the world-to-battle handoff.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;P.troops={hum_foot:3};P.comps={brann:{ap:5}};t.compInit('brann');
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);const lord=W.lords.find(l=>!l.dead);Object.assign(lord,{inside:null,x:P.x+35,y:P.y});lord.troops=['hum_foot','hum_foot','orc_grunt','elf_spear'];
 const pixels=s=>Array.from(s.getContext('2d').getImageData(0,0,s.width,s.height).data).join(','),before=new Map(),owners=new Map();
 for(const o of [P,lord])for(const u of t.MarchArmy.of(o).units){before.set(u,pixels(t.marchSprite(u,o)));owners.set(u,o)}
 const leader=pixels(t.marchLeaderSprite(lord,0).base),hero=pixels(t.marchLeaderSprite(P,0).base),cloth=lord.look().col;
 G.enc={kind:'lord',ref:lord,list:lord.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,men=b.units.filter(u=>u.marchUnit&&!u.leader);
 ok(men.length>=7&&men.every(u=>before.get(u.marchUnit)===pixels(t.actorSprite(u,0))),'every matched marcher retains identical race, cloth, hair and equipment pixels on battle entry');
 const commander=b.units.find(u=>u.leader?.ref===lord);ok(commander.v===0&&pixels(t.actorSprite(commander,0))===leader,'mounted lord retains exactly the same horse colour and character variant');
 ok(pixels(t.actorSprite(b.hero,0))===hero,'hero appearance matches before and during battle');
 ok(men.filter(u=>u.team===1).every(u=>u.worldTint===cloth&&t.unitLook(u).team===cloth),'enemy cloth and separately drawn weapons use the source faction colour');
 ok(t.unitLook(commander).mountC===t.lookOf(commander.type,0,false,0).mountC,'leader body and weapon layers agree on the same mounted appearance');
 const enemy=men.find(u=>u.team===1),draw=t.ctx.drawImage,images=[];try{t.ctx.drawImage=function(s,...args){images.push(s);return draw.call(this,s,...args)};enemy.plx=enemy.x;enemy.ply=enemy.y;enemy.movF=0;t.drawUnit(enemy);ok(images.some(s=>s===t.actorSprite(enemy,0,true)||s===t.actorSprite(enemy,1,true)),'actual battle rendering uses the retained appearance for the body')}finally{t.ctx.drawImage=draw}
 const legacy={type:'hum_foot',team:1,v:2,hero:false};ok(t.actorSprite(legacy,0)===t.unitSprite('hum_foot',1,false,2,0),'separate tactical battle sprites retain their existing side palettes');
 window.eval('B=null');Kit.world();ok([...before].every(([u,p])=>p===pixels(t.marchSprite(u,owners.get(u)))), 'travel appearance remains stable after leaving battle');
});
