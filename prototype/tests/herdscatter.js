'use strict';
// A herd after a hunt (the owner, 2026-11-14: "the hunting should not warp the wildlife back to the group, each will keep the state and
// position"): each surviving animal left where it stood, facing its way, with its own wind (data/exertion.js HERD_SCATTER, Herd m),
// the herd still bolting the way they ran; on the map each walks back to its place, none jumping; a hunt begun again meets each
// where it stands. (Armies already hand each man's place to his marcher: worldbattle.js finish.)
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,H=t.WildHunt,X=t.HERD_SCATTER;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;G.paused=false;G.speed=1;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-25;y<=ty+25;y++)for(let x=tx-25;x<=tx+25;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
 P.troops={hum_foot:3};P.bsta=100;const c=t.asHerd({crit:true,id:'deer',n:6,x:P.x+40,y:P.y,hx:P.x+40,hy:P.y,dir:1,t:5,a:0,cool:0,idle:true});W.critters=[c];t.frame();
 ok(!c.m&&X.on,'a herd is one point until a hunt scatters it');
 H.prepare(c);t.frame();let b=t.B,a=b.hunt;t.setAuto(true,true);for(let i=0;i<240&&t.B===b;i++)t.updateBattle(.05);
 const live=a.animals.filter(u=>u.hp>0||u.left);live.forEach((u,i)=>{if(!u.left){u.x+=(i%2?-1:1)*(12+6*i)*a.scale;u.y+=(i%2?4:-6)*a.scale}});// (spread apart, as a chase leaves them)
 const was=live.map(u=>({p:a.world(u),f:u.face<0?-1:1,sta:u.escapeSta,run:u.alert>=1&&(u.left||u.spdNow>0)}));a.end();
 const spot=i=>({x:c.x+c.m[i].dx,y:c.y+c.m[i].dy});
 ok(live.length>1&&Math.max(...was.map(w=>Math.hypot(w.p.x-c.x,w.p.y-c.y)))>10&&c.n===live.length&&c.m?.length===live.length&&was.every((w,i)=>Math.hypot(spot(i).x-w.p.x,spot(i).y-w.p.y)<.01&&c.m[i].f===w.f&&c.m[i].sta===w.sta),
   'the hunt over, each of the '+live.length+' animals left stands where it stood, facing its way, its own wind (spread '+Math.max(...was.map(w=>Math.hypot(w.p.x-c.x,w.p.y-c.y))).toFixed(0)+' px about the herd)');
 const ran=was.filter(w=>w.run).length;ok(ran?c.run===X.run&&Math.abs(Math.cos(c.a))<=1:!c.run,ran+' of them still bolting: the herd '+(ran?'runs on their way for '+X.run+' s':'stands'));
 // (on the map: each walks back, no jump; all back, one point again)
 document.querySelector('[data-act="cont"]')?.click();t.frame();ok(!t.ERR?.length,'the scattered herd is drawn without error');
 let jump=0,steps=0;const at=()=>c.m?c.m.map((m,i)=>({x:c.x+m.dx,y:c.y+m.dy})):null;let prev=at();
 const P0={x:P.x,y:P.y};P.x=c.x+400;P.y=c.y;// (you away: no threat, so it gathers as it goes)
 for(;steps<600&&c.m;steps++){const ox=c.x,oy=c.y;t.HERD_MIND.think(c,.05,0);const now=at();if(now&&prev){const mv=Math.hypot(c.x-ox,c.y-oy);now.forEach((q,i)=>{const d=Math.hypot(q.x-prev[i].x,q.y-prev[i].y)-mv;if(d>jump)jump=d})}prev=now}
 P.x=P0.x;P.y=P0.y;
 ok(!c.m&&steps>3&&jump<=t.moveStep(X.gather,.05)+1e-6,'each walks back to its place in the herd ('+steps+' steps of .05 s, at most '+jump.toFixed(2)+' px a step past the herd\'s own going): one point again');
 // (a hunt begun again on a scattered herd meets each animal where it stands)
 const c2=t.asHerd({crit:true,id:'deer',n:2,x:P.x+40,y:P.y+30,hx:P.x+40,hy:P.y+30,dir:1,t:5,a:0,cool:0,idle:true,m:[{dx:-9,dy:4,f:-1,sta:3,go:false},{dx:7,dy:-5,f:1,sta:5,go:false}]});W.critters=[c2];t.frame();H.prepare(c2);t.frame();b=t.B;a=b.hunt;
 const an=a.animals.filter(u=>u.herd===c2);ok(an.length===2&&an.every((u,i)=>{const p=a.world(u),m=c2.m[i];return Math.hypot(p.x-(c2.x+m.dx),p.y-(c2.y+m.dy))<1&&u.face===m.f&&u.escapeSta===m.sta}),'a hunt begun on a scattered herd meets each animal where it stands, facing its way, with its own wind');
 a.end();document.querySelector('[data-act="cont"]')?.click();
});
