'use strict';
// A cleared hunt, then an ordinary battle in the same page: UI, captain ownership and settlement stay separate.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;G.paused=false;G.speed=1;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-25;y<=ty+25;y++)for(let x=tx-25;x<=tx+25;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
 P.troops={hum_foot:4,hum_bow:3};const c=t.asHerd({crit:true,id:'deer',n:1,x:P.x+25,y:P.y,hx:P.x+25,hy:P.y,dir:1,t:5,a:0,cool:0,idle:true});W.critters=[c];t.frame();t.hunt(c);t.WildHunt.start();let b=t.B,a=b.hunt,animal=a.animals[0];Object.assign(animal,a.exit(animal,4));a.turn(animal,.1);t.updateBattle(3);
 ok(!t.B&&G.mode==='dialog'&&G.loot.pile.length===0,'all wildlife escaping automatically ends the hunt with no meat or trophies');ok(c.n===1&&W.critters.includes(c),'an escaped animal survives on the campaign map');t.act('lt-leave');Kit.done({world:true});
 const enemy=t.asParty({kind:'bandits',troops:['militia','militia','archer'],x:P.x+20,y:P.y,cool:0});t.bandits.push(enemy);G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,lv:1,surprise:true});b=t.B;t.frame();
 ok(b.world&&!b.hunt,'ordinary encounters keep the standard world battle path');ok(document.getElementById('huntEnd').hidden&&document.getElementById('bFoeLabel').textContent==='Enemy','the next ordinary battle hides End hunt and restores the enemy label');
 t.setAuto(false,true);const groups=Object.values(b.groups).filter(g=>g.player),manual=groups.find(g=>g.type==='hum_foot'),controlled=groups.find(g=>g.type==='hum_bow');manual.standAt(manual.ax-10,manual.ay+10);const before=[manual.ax,manual.ay,manual.order,manual.targetGroupId];t.setGroupsAuto([controlled.id],true,true);t.command(.6);
 ok(JSON.stringify(before)===JSON.stringify([manual.ax,manual.ay,manual.order,manual.targetGroupId])&&t.aiHas(controlled)&&!t.aiHas(manual),'the normal captain only controls groups handed to AI');t.setAuto(true,true);const at=b.t;for(let i=0;i<20&&!b.over;i++)t.updateBattle(.05);ok(b.t>at&&t.aiAll(),'ordinary whole-army AI continues to advance combat');
 const gold=P.gold,renown=P.renown;for(const u of b.units.filter(u=>u.team===1&&u.hp>0))t.applyDmg(u,100000,1,null,b.hero,false);b.win=true;b.over=true;b.endT=0;t.finishBattle();
 ok(!t.B&&G.mode==='dialog'&&G.lootView.head.includes('Victory')&&P.gold>gold&&P.renown>renown,'ordinary victories retain war rewards and normal battle settlement');ok(!ERR.length,'hunting does not leak runtime state into an ordinary battle');
});
