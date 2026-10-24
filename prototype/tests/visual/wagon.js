'use strict';
// ?v=1&scene=map|page|searched: a real roadside wagon and its choices at desktop and phone landscape sizes.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W,u=new URLSearchParams(location.search);window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});t.GUIDE.on=false;
 const h=Kit.goHome('Ashford'),ps=[];for(let y=h.ty-18;y<h.ty+18;y++)for(let x=h.tx-18;x<h.tx+18;x++)if(t.tAt(x,y)===t.T_OPEN&&t.roadBeside(x,y)&&!t.occAt(x,y)&&!t.TOWNS.some(h=>Math.hypot(h.tx-x,h.ty-y)<t.ENC_SPAWN.hold))ps.push({x:(x+.5)*t.TILE,y:(y+.5)*t.TILE});
 ps.sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y));const at=ps[0];P.x=at.x-24;P.y=at.y+12;P.tx=null;P.stay=null;W.road=null;G.clock=t.DAY*.3;G.paused=true;performance.now=()=>1e7;
 const e=t.roadSpawn('wagon',at.x,at.y);e.seen=1;document.getElementById('log').replaceChildren();t.updateHUD(true);t.frame();
 if(u.get('scene')!=='map'){t.roadMeet(e);if(u.get('scene')==='searched')t.act('enc-do','0')}
 ok(e.inView(t.vis())&&!e.gone,'the abandoned wagon is visible in the scene');
 ok(u.get('scene')==='map'||Kit.text().includes('Abandoned wagon')&&Kit.text().includes('Leave'),'the normal encounter frame displays its title and exit');
});
