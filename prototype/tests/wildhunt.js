'use strict';
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
 // Quiet, passable ground with enough space for a brief retreat.
 let at=null;for(let y=20;y<t.MH-20&&!at;y++)for(let x=20;x<t.MW-20&&!at;x++)if(t.tAt(x,y)===t.T_OPEN&&t.tAt(x+1,y)===t.T_OPEN&&t.tAt(x+2,y)===t.T_OPEN&&t.tAt(x+3,y)===t.T_OPEN)at={x:(x+.5)*t.TILE,y:(y+.5)*t.TILE};
 Kit.goTo(at.x,at.y);P.troops={hum_bow:3};P.inv=Array(t.INV_SIZE).fill(null);G.paused=false;
 const make=(n=3)=>{const c=t.asHerd({crit:true,id:'deer',x:P.x+40,y:P.y,hx:P.x+40,hy:P.y,n,dir:1,t:0,a:0,tire:0,cool:0});W.critters=[c];return c};
 P.troops={hum_foot:3};let blocked=make();t.hunt(blocked);ok(document.querySelector('[data-act="hunt-start"]').disabled&&Kit.text().includes('requires at least one fit ranged troop'),'melee-only armies see the ranged troop requirement and a disabled Hunt button');
 t.act('hunt-start','hero');ok(!t.WildHunt.active&&blocked.n===3,'a direct or old hero-only action cannot bypass the ranged troop requirement');t.act('hunt-back');
 P.troops={};P.wounded={hum_bow:2};ok(!t.WildHunt.hunters().length,'wounded ranged soldiers cannot hunt');P.wounded={};P.troops={hum_bow:3};
 let c=make(),count=c.n,meat=t.goodN('meat');ok(t.hunt(c)&&c.n===count&&t.goodN('meat')===meat&&G.modal,'hunt opens a choice without instantly collecting animals or rewards');
 t.act('hunt-back');ok(G.mode==='world'&&!G.modal&&c.n===count,'leaving preparation costs no animals or resources');
 t.approach(c);ok(G.modal&&P.tx==null,'visible wildlife can be selected for a hunt without first chasing into touching range');
 t.act('hunt-start','band');let h=t.WildHunt.active;ok(h&&h.herd===c&&h.animals.length===count&&h.sources.length===3&&!h.sources.includes(P)&&G.mode==='world'&&!t.B,'hunt uses actual fit ranged marchers without giving the hero a free bow');
 const rng=Math.random;try{Math.random=()=>.1;for(let i=0;i<100&&!h.body&&t.WildHunt.active;i++)h.step(.05*t.WORLD_PACE,.05)}finally{Math.random=rng}
 ok(h.body&&c.n===count-1&&t.goodN('meat')===meat,'a physical arrow hit brings down one real animal; rewards wait for collection');
 const survivor=h.animals.find(a=>a.hp>0),old={x:survivor.x,y:survivor.y};h.time=h.alertAt+1;h.flee(.8,.8);
 ok(Math.hypot(survivor.x-old.x,survivor.y-old.y)>0&&c.hx===c.x,'survivors move away and the original herd follows their real position');
 h.flee(1,1);ok(W.tracks.some(tr=>tr.k==='crit:deer'&&tr.p.length>=6),'fleeing survivors leave actual wildlife tracks');
 P.x=h.body.x;P.y=h.body.y;h.step(.01,.01);const loot=t.goodN('meat');ok(!t.WildHunt.active&&loot>meat&&c.n===count-1,'reaching fallen game automatically collects rewards and leaves survivors in the world');
 h.finish();ok(t.goodN('meat')===loot,'hunt rewards cannot be collected twice');
 c=make(1);t.hunt(c);P.troops={hum_foot:2};ok(!t.WildHunt.start()&&!t.WildHunt.active,'the ranged requirement is checked again when starting');P.troops={hum_bow:3};t.act('hunt-start','band');h=t.WildHunt.active;ok(h.sources.length>0&&h.sources.every(s=>t.ST[s.type].range&&!t.ST[s.type].magic),'only fit troops with physical ranged weapons shoot during a hunt');
 const shots=h.shots;G.paused=true;h.step(1,1);ok(h.shots===shots&&h.time===0,'pausing the world pauses the hunt');G.paused=false;
 const inv=t.goodN('meat');h.time=t.WILD_HUNT.duration+1;h.step(.01,.01);ok(!t.WildHunt.active&&c.n===1&&t.goodN('meat')===inv,'an escaped hunt ends promptly without consuming animals or granting loot');
 c=make();t.hunt(c);t.act('hunt-start','band');h=t.WildHunt.active;t.worldMove(P.x-10,P.y);ok(!t.WildHunt.active&&!document.getElementById('huntBar'),'a normal travel order leaves the hunt and removes its controls');
 c=make();t.hunt(c);t.act('hunt-start','band');h=t.WildHunt.active;const ents=[];h.draw(ents,G.cam);ok(ents.length===c.n,'the hunt draws each real animal rather than a representative herd icon');
 const before=P.x;h.finish();ok(P.x===before&&c.n===3,'leaving freely preserves the herd and player position');
 // Concealment changes opening accuracy without changing damage.
 c=make();t.hunt(c);t.act('hunt-start','band');h=t.WildHunt.active;const i=Math.floor(P.y/t.TILE)*t.MW+Math.floor(P.x/t.TILE),tile=t.tiles[i],random=Math.random;
 try{Math.random=()=>.75;h.alert=false;t.tiles[i]=t.T_FOREST;h.fire(P,h.animals[0]);const concealed=h.arrows.pop();t.tiles[i]=t.T_OPEN;h.alert=false;h.fire(P,h.animals[0]);const open=h.arrows.pop();ok(Math.abs(concealed.vy)<Math.abs(open.vy),'undetected forest opening improves aim rather than adding damage')}finally{t.tiles[i]=tile;Math.random=random;h.finish()}
});
