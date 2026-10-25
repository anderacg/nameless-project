'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;P.troops={hum_foot:2};
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);const fac=t.FIDS.find(f=>f!=='player'),c=t.asParty({cv:true,fac,from:h.name,to:h.name,goods:{grain:4},guards:7,x:P.x+40,y:P.y,dir:1,cool:0});W.caravans=[c];
 const list=c.troops.slice(),roster=t.partyRoster(c),army=t.MarchArmy.of(c);army.sync();
 ok(army.units.length===list.length&&!army.units.some(u=>u.pivot),'caravan travel draws every real guard around the cart without adding a leader fighter');
 const ents=[];c.draw(ents,G.cam,t.vis());ok(ents.length===list.length+2,'caravan draws its army ring, guard figures and retained cart');
 const initial=army.units.map(u=>({id:u.id,x:u.x,y:u.y}));G.enc={kind:'caravan',ref:c,list,allies:[],foes:[],mine:true};t.startBattle({enemies:list,tournament:false});const b=t.B,area=b.world,guards=b.units.filter(u=>u.team===1&&!u.leader);
 ok(area&&guards.length===list.length&&guards.every(u=>u.sourceArmy===c),'caravan combat uses the actual source roster in the seamless world battle');
 ok(guards.every(u=>u.marchUnit&&initial.some(p=>p.id===u.marchUnit.id&&Math.hypot(area.world(u).x-p.x,area.world(u).y-p.y)<.001)),'guards enter at their marching positions with the same actor identities');
 ok(guards.every(u=>u.worldTint===t.caravanCol(c)&&u.worldSide===0&&u.type===u.marchUnit.type),'guard race/type, faction cloth and sprite variation carry into combat');
 const base=window.marchDraw,seen=[];try{window.marchDraw=(out,o,cam)=>{seen.push(o);return base(out,o,cam)};t.frame()}finally{window.marchDraw=base}
 ok(!seen.includes(c),'caravan travel guards are suppressed while their battle actors fight');
 const before=c.guards;t.applyDmg(guards[0],100000,1,null,b.hero,false);ok(c.guards===before-1&&c.troops.length===before-1,'caravan guard casualties update its persistent roster exactly once');
 for(const kind of ['estate','camp','ruin']){Kit.world();G.enc={kind,ref:{x:P.x+30,y:P.y,fac:kind==='estate'?fac:null,town:h.name,k:'farm',cool:0},list:['militia'],allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});ok(t.B.world instanceof t.WorldBattleArea,kind+' outdoor encounter starts on its existing world location');if(kind==='estate')ok(t.B.units.filter(u=>u.team===1).every(u=>u.worldTint===t.FACS[fac].col),'estate guards keep their owning realm cloth in the world battle')}
 for(const kind of ['cave','siege','raid','tourney']){G.enc={kind};ok(!t.worldBattleEligible({}),kind+' retains its special battlefield')}
 ok(!t.worldBattleEligible({sandbox:true})&&!t.worldBattleEligible({tournament:true}),'battle lab and tournaments remain separate');
});
