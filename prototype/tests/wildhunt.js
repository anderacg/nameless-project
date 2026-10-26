'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,H=t.WildHunt;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;G.paused=false;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+350,home.y+300);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-20;y<=ty+20;y++)for(let x=tx-20;x<=tx+20;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
 P.troops={hum_bow:3,hum_foot:3};const make=()=>{const c=t.asHerd({crit:true,id:'deer',x:P.x+30,y:P.y,hx:P.x+30,hy:P.y,n:3,dir:1,t:5,a:0,tire:0,cool:0,idle:true});W.critters=[c];return c};
 let c=make(),meat=t.goodN('meat');H.toggle();ok(H.armed,'Hunting area toggles on');t.ringOpen(100,100,c.x,c.y);ok(H.choice&&G.modal&&document.querySelector('.hunt-setup')&&!H.armed,'holding a map spot previews the fixed hunting circle and setup');
 ok(c.n===3&&t.goodN('meat')===meat,'preview grants no instant kill or rewards');t.act('hunt-back');ok(!G.modal&&!H.choice&&G.mode==='world','Cancel returns to ordinary world interaction');
 t.hunt(c);const selected=H.choice.selected.slice(),actual=new Map([...t.MarchArmy.of(P).units,H.heroSource].map(u=>[u,{x:u.x,y:u.y}]));t.act('hunt-start');let h=H.active;
 ok(h&&h.sources.length===selected.length&&h.sources.every(u=>actual.has(u)&&u.x===actual.get(u).x&&u.y===actual.get(u).y)&&!G.modal,'ranged hunt selects fit real marchers at their current positions');
 const bounds={x:h.x,y:h.y,r:h.radius},hunter=h.sources[0];h.order(h.x+h.radius*3,h.y);h.step(.01,.01);ok(Math.hypot(h.goalFor(hunter.row,hunter.index).x-h.x,h.goalFor(hunter.row,hunter.index).y-h.y)<h.radius&&hunter.x===actual.get(hunter).x,'orders clamp hunter destinations to the circle without teleporting');h.manual=null;
 const random=Math.random;try{Math.random=()=>.1;for(let i=0;i<300&&!h.body;i++)h.step(.025,.025)}finally{Math.random=random}
 ok(h.body&&c.n===2&&t.goodN('meat')===meat,'a physical ranged hit kills one animal and waits for collection');
 h.collect();hunter.x=h.body.x;hunter.y=h.body.y;h.step(.01,.01);ok(!h.body&&t.goodN('meat')>meat,'Collect requires a hunter to physically reach the fallen game');const loot=t.goodN('meat');h.collect();h.step(.01,.01);ok(t.goodN('meat')===loot,'game cannot be collected twice');h.finish();
 P.gear.weapon=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].slot==='weapon'&&!t.ITEMS[k].kind);c=make();t.hunt(c);t.act('hunt-method','melee');ok(H.choice.method==='melee'&&H.pool('melee').some(u=>u.type==='hero'),'melee hunt supports suitable troops and the equipped melee hero');t.act('hunt-start');h=H.active;h.pursue=true;for(const u of h.sources){u.x=c.x-20;u.y=c.y}h.step(.01,.01);ok(!h.body&&c.n===3,'melee hunters cannot hit from interaction distance');
 const melee=h.sources.find(u=>!u.character)||h.sources[0];melee.x=c.x-1;melee.y=c.y;h.step(.1,.1);for(let i=0;i<50&&!h.body;i++)h.step(.1,.1);ok(h.body&&c.n===2,'melee hunter damages prey only at actual weapon contact');h.finish();
 c=make();t.hunt(c);t.act('hunt-start');h=H.active;const ownBounds={x:h.x,y:h.y,r:h.radius};h.sources=[];h.time=20;h.step(.1,.1);ok(H.active===h&&h.x===ownBounds.x&&h.y===ownBounds.y&&h.radius===ownBounds.r,'a hunt has no arbitrary fourteen-second timeout and its circle stays fixed');
 c.x=h.x+h.radius+5;for(let i=0;i<50;i++)h.step(.1,.1);ok(!h.target&&H.active===h,'prey can escape beyond the circle while the hunt remains available for other targets');h.finish();
 P.troops={hum_foot:2};P.wounded={hum_bow:3};c=make();t.hunt(c);ok(!H.pool('ranged').length&&H.choice.method==='melee','wounded archers do not provide ranged hunters and melee remains available');t.act('hunt-back');P.wounded={};
 c.escapeSta=2;t.hunt(c);t.act('hunt-start');h=H.active;ok(c.escapeSta===2,'beginning another hunt never refills prey endurance');const time=h.time;G.paused=true;h.step(1,1);ok(h.time===time,'pause freezes hunting');G.paused=false;t.worldMove(P.x-20,P.y);ok(!H.active&&!document.getElementById('huntBar'),'a normal travel order ends the hunt and releases temporary hunter positions');
 ok(!ERR.length,'area hunting produces no runtime errors');
});
