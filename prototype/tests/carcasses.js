'use strict';
// The fallen of a fight on the map: a hunt's kills lie where they fell, their meat and trophies on them, not in your bag; a click
// opens the window of all near, beside your bag; what you leave stays on them; they rot; saved.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,C=t.Carcass;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;G.paused=false;G.speed=1;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+350,home.y+300);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-25;y<=ty+25;y++)for(let x=tx-25;x<=tx+25;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
 P.troops={hum_bow:4};C.list=[];const herd=t.asHerd({crit:true,id:'deer',n:3,x:P.x+30,y:P.y,hx:P.x+30,hy:P.y,dir:1,t:5,a:0,cool:0,idle:true});W.critters=[herd];t.frame();
 const meat0=t.goodN('meat');t.hunt(herd);const b=t.B,a=b?.hunt;if(!a){ok(false,'the hunt begins');return}
 {const u=a.animals[2],seen=t.BattleSight.seen;t.BattleSight.seen=()=>false;try{u.unseen=t.OPEN_FIGHT.lost;a.turn(u,.05)}finally{t.BattleSight.seen=seen}ok(u.left&&u.fled,'a deer none of yours has seen for '+t.OPEN_FIGHT.lost+' s has got away, the field open round it')}
 const prey=a.animals.slice(0,2);for(const u of prey){u.hp=0;const cp={x:u.x,y:u.y,team:u.team,face:u.face,wait:true};b.corpses.push(cp);t.vfxDeath(u,cp)}b.kills=(b.kills||0)+prey.length;
 const at=prey.map(u=>a.world(u));a.end();
 ok(C.list.length===2&&C.list.every((c,i)=>Math.hypot(c.x-at[i].x,c.y-at[i].y)<.2&&c.wild==='deer'),'each deer killed lies where it fell ('+C.list.length+' carcasses)');
 const on=C.list.reduce((n,c)=>n+c.items.reduce((m,s)=>m+(s.id==='meat'?s.n:0),0),0);
 ok(on===2*t.CRITTERS.deer.meat&&t.goodN('meat')===meat0,'their meat lies on them ('+on+'), none in your bag till you take it');
 ok(G.loot&&!G.loot.pile.length&&/lie on the fallen/.test(Kit.text()),'the hunt\'s window has nothing to take: it says the things lie on the fallen');
 t.act('cont');
 // (walked to, met: the window of all near)
 const c=C.list[0];ok(c.inView(t.vis())&&t.pickAt(c.x,c.y-1)===c,'a carcass on the map is clicked like anything else');
 t.interact(c);ok(G.mode==='dialog'&&G.lootView?.keep&&G.loot.pile.some(s=>s.id==='meat'&&s.n===on),'met: the window holds what lies on all the fallen near ('+G.loot.pile.map(s=>s.n+' '+s.id).join(', ')+'), beside your bag');
 ok(/Look each over and take what you want/.test(Kit.text())&&document.querySelector('[data-act="lt-take"]')&&document.querySelector('[data-act="lt-all"]'),'each thing its own tile to take, and Take all');
 const i=G.loot.pile.findIndex(s=>s.id==='meat');G.loot.pile[i].n-=1;t.invAdd('good','meat',0);t.act('lt-take',String(i));
 ok(t.goodN('meat')>meat0&&t.goodN('meat')-meat0===on-1,'taken: into your bag ('+(t.goodN('meat')-meat0)+' meat)');
 G.loot.pile.push({k:'good',id:'meat',n:1});t.act('lt-leave');
 ok(G.mode==='world'&&!G.loot&&c.items.some(s=>s.id==='meat'&&s.n===1)&&C.list.filter(o=>o!==c).every(o=>o.empty()),'left: what you leave stays on the one you clicked, the others picked clean');
 // (a band near the fallen you cannot see picks them over: its plunder yours if you beat it)
 {const o=C.list.find(c=>!c.empty())||C.list[0];if(o.empty())o.items.push({k:'good',id:'meat',n:2});const n=o.items.reduce((a,s)=>a+s.n,0),band=t.asParty({kind:'bandits',troops:['militia'],x:o.x+30,y:o.y,cool:0});t.bandits.push(band);
  const home=[P.x,P.y];Kit.goTo(o.x>t.MW*t.TILE/2?o.x-1500:o.x+1500,o.y);const f=t.CARCASS.find;t.CARCASS.find=1;try{ok(t.Death.unseenAt(o.x,o.y),'(far from them: out of your sight)');C.hour()}finally{t.CARCASS.find=f;Kit.goTo(home[0],home[1])}
  ok(o.empty()&&band.plunder?.items.reduce((a,x)=>a+x[2],0)===n&&/picked clean by/.test(o.tip()),'a band near the fallen you cannot see picks them over ('+n+' things), the carcass "'+o.what()+'"');
  const m=t.goodN('meat');t.Remains.beaten(band);ok(t.goodN('meat')===m+n,'beaten, its plunder is yours');o.items.push({k:'good',id:'meat',n:1})}
 // (saved; rotted)
 t.saveGame(true);C.list=[];t.loadGame();ok(C.list.length===2&&C.list.some(o=>o.items.some(s=>s.id==='meat'))&&C.list.every(o=>o instanceof C&&!o.corpse),'the fallen are saved (their picture a plain one after a load)');
 {const d=G.day;G.day+=t.CARCASS.bare;C.day();ok(C.list.length===1&&!C.list[0].empty(),'picked clean, one rots in '+t.CARCASS.bare+' day');G.day=d+t.CARCASS.days;C.day();ok(!C.list.length,'with things on it, in '+t.CARCASS.days+' days');G.day=d}
 {const was=t.CARCASS.on;t.CARCASS.on=false;ok(t.Carcass.from({world:{},corpses:[]})===null,'CARCASS off: none laid, the window as before');t.CARCASS.on=was}
});
