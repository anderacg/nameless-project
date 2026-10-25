'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const town=t.TOWNS.find(x=>x.owner&&x.owner!=='player'&&Object.keys(t.bldSpots(x)).some(k=>t.bldLv(x,k)&&t.ESTATES[k]?.work)),k=Object.keys(t.bldSpots(town)).find(k=>t.bldLv(town,k)&&t.ESTATES[k]?.work),job=t.ESTATES[k].work;
 const make=(id,dx)=>t.asWorker({id,folk:true,home:town.name,k,job,st:'field',x:town.x+100+dx,y:town.y+100,dir:1,ph:0,moving:false});
 const workers=[make('worker-world-1',0),make('worker-world-2',8)];W.folk=workers;P.troops={hum_foot:2};P.comps={};Kit.goTo(workers[0].x-12,workers[0].y);t.frame();
 const pixels=s=>Array.from(s.getContext('2d').getImageData(0,0,s.width,s.height).data).join(','),looks=new Map(),positions=new Map();
 for(const f of workers){const L=t.workerAppearance(f),draw=t.ctx.drawImage,images=[];const ents=[];f.draw(ents,{x:P.x-50,y:P.y-50},t.vis());try{t.ctx.drawImage=function(s,...args){images.push(s);return draw.call(this,s,...args)};ents.forEach(e=>e.f())}finally{t.ctx.drawImage=draw}
  const expected=t.unitSprite(L.type,0,false,L.v,0,false,false,L.tint);ok(images.includes(expected),f.id+': world worker draws its actual battle unit sprite');looks.set(f,pixels(expected));positions.set(f,{x:f.x,y:f.y});
 }
 const guards=t.estateGuards(town,k),list=workers.map(f=>t.recruitKind(town,f)).concat(guards),view={x:G.cam.x,y:G.cam.y,z:t.VS,vw:t.VW,vh:t.VH};
 t.robFight(town,workers[0],{ws:workers,gs:guards,list});const e=G.enc;ok(e.kind==='villagers'&&t.worldBattleEligible({tournament:false}),'worker resistance selects world combat');
 t.act('fight');const b=t.B,a=b.world;ok(a&&G.cam.x===view.x&&G.cam.y===view.y&&t.VS===view.z&&t.VW===view.vw&&t.VH===view.vh,'Fight stays on the same world map with no battlefield switch or zoom');
 const actors=b.units.filter(u=>u.worker);ok(actors.length===workers.length&&b.units.filter(u=>u.team===1).length===list.length,'each worker and estate guard becomes one combat actor');
 ok(actors.every(u=>{const p=a.world(u),old=positions.get(u.worker);return Math.hypot(p.x-old.x,p.y-old.y)<1e-6}),'workers enter combat at their exact world positions');
 ok(actors.every(u=>looks.get(u.worker)===pixels(t.actorSprite(u,0))),'worker race, variant, faction cloth and equipment stay identical in combat');
 const duplicate=[];workers.forEach(f=>f.draw(duplicate,{x:P.x,y:P.y},t.vis()));ok(!duplicate.length&&workers.every(f=>a.hides(f)),'worker world figures are suppressed while their battle actors are present');
 const survivor=actors[0],fallen=actors[1],pop=town.pop;Object.assign(survivor,a.field({x:workers[0].x+7,y:workers[0].y+3}));fallen.hp=0;b.win=false;t.workerBattleFinish(b,a);
 ok(Math.abs(workers[0].x-positions.get(workers[0]).x-7)<1e-6&&!W.folk.includes(workers[1])&&town.pop===pop-1,'survivors keep combat positions and fallen workers do not reappear after a defeat');
 const p=town.pop;t.workerBattleFinish(b,a);ok(town.pop===p,'worker casualty settlement is not charged twice');
 window.eval('B=null');Kit.world();
 e.ref.gs=0;t.villagersWon(e);ok(town.pop===p-1&&!W.folk.includes(workers[0]),'a later victory does not charge an already fallen worker to the population twice');
 const victoryWorker=make('worker-world-win',0),popBefore=town.pop;W.folk=[victoryWorker];const win={kind:'villagers',ref:{town:town.name,k,f:victoryWorker,ws:[victoryWorker],gs:0}};
 t.villagersWon(win);ok(!W.folk.includes(victoryWorker)&&town.pop===popBefore-1,'existing victory loot, population and worker removal settlement remains in use');
});
