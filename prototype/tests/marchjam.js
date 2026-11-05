'use strict';
// No army freezes in a narrow place (world/march.js MarchArmy#step, MARCH_MOVE.jam; the owner, 2026-11-01: an army whose men jam in
// a crossing must never freeze): an army's middle never runs ahead of its men (MARCH_MOVE.leash), so men jammed in a crossing held
// it for good. In battle lanes (world/marchstyles.js) every group of an army of foot stands ahead of your hero, so all of them press
// into a ford together. Now a man stuck MARCH_MOVE.jam s while the army marches squeezes through, as one does when it halts.
// A one-tile ford, a bridge and a pass in a cliff: your army, its groups all ahead of you, and one with riders, march through,
// each man on open ground, and the army never stands more than a few seconds.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,J=t.MARCH_MOVE.jam,STALL=J*2+.5;
 function begin(troops){
  Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
  const h=Kit.goHome('Ashford');Kit.goTo(...Kit.field(h));P.troops=troops;delete P.army.march;
  const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-20;y<=ty+20;y++)for(let x=tx-20;x<=tx+30;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
  return t.MarchArmy.of(P);
 }
 // (a wall of water, or cliff, across the way 60 px ahead, one tile of it open (gap); the army told to go 200 px on, as the map moves
 // you a step a moment; worst: the longest it stood, its middle held by its men)
 const cross=(wall,gap,troops)=>{const a=begin(troops);for(let i=0;i<120;i++)a.step(1/30);const start=P.x,col=Math.floor((P.x+60)/t.TILE),row=Math.floor(P.y/t.TILE);
  for(let y=row-18;y<=row+18;y++)if(t.WM.has(col,y))t.WM.kind[y*t.MW+col]=y===row?gap:wall;a.ground=null;
  let stall=0,worst=0,legal=true;for(let i=0;i<40*30;i++){const x0=P.x;if(P.x<start+200)P.x+=.4;a.step(1/30);stall=P.x-x0>.05||P.x>=start+200?0:stall+1/30;worst=Math.max(worst,stall);for(const u of a.units)legal&&=t.passable(t.terrAt(u.x,u.y))}
  const over=a.units.filter(u=>u.x>(col+1)*t.TILE).length;info(JSON.stringify(troops)+': '+Math.round(P.x-start)+' px on, longest stand '+worst.toFixed(1)+' s, '+over+'/'+a.units.length+' over');
  return{on:P.x-start,worst,all:over===a.units.length,legal}};
 const foot={hum_levy:45},riders={hum_levy:30,hum_knight:12};
 for(const [name,wall,gap] of [['a ford',t.T_WATER,t.T_FORD],['a bridge',t.T_WATER,t.T_ROAD],['a pass in a cliff',t.T_MOUNT,t.T_OPEN]])for(const [who,tc] of [['your foot, every group ahead of you',foot],['foot and riders',riders]]){
  const r=cross(wall,gap,tc);ok(r.on>=200&&r.all&&r.legal&&r.worst<=STALL,name+', '+who+': through, every man over on open ground, never standing more than '+STALL+' s ('+r.worst.toFixed(1)+' s)')}

});
