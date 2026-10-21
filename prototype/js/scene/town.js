'use strict';
/* ---------- the town scene: laid out from the town's seed, people, walls and trade ---------- */
// A ring of walls (or a fence where there are none) with the gate at the bottom, a market square in the middle and a street
// down to the gate. The buildings of the people who work here go where they like to stand (the hall at the top, the barracks
// and stable by the gate, the tavern, smithy and temple by the square), houses fill the rest, and every door gets a path
// to the streets, so the whole town is walkable. Port towns have the sea along the east wall, with a pier.
// The same town always gets the same layout.
const TOWN_W=40,TOWN_H=30;
// which panel tabs a holding offers (the town panel and the scene agree on this: the places it has, ui/town.js PLACES)
const TAB_N={recruit:'Recruit',trade:'Trade',stores:'Stores',smith:'Smith',stable:'Stable',jobs:'Jobs',tavern:'Tavern'};
function townTabs(t){
  const tabs=t.T.tabs.map(k=>[k,TAB_N[k]]);
  if(PLACES.fief.at(t))tabs.unshift(['fief','Fief']);
  tabs.push(['garrison','Garrison']);
  // any holding that is not yours or your employer's can be attacked from its own tab
  if(PLACES.siege.at(t))tabs.push(['siege','Besiege']);
  return tabs;
}
// the people who work here: everyone whose tab the holding offers (the reeve instead of the steward in your own fief)
function townRoles(t){
  const tabs=townTabs(t).map(x=>x[0]);
  return Object.keys(SCENE_ROLES).filter(r=>{const R=SCENE_ROLES[r];if(r==='steward')return t.owner!=='player';if(r==='priest')return !!t.T.temple;return tabs.includes(R.tab)});
}
function genTown(t){
  const W=TOWN_W,H=TOWN_H,R=seeded(t.seed*977+5),ri=(a,b)=>a+Math.floor(R()*(b-a+1)),tiles=new Uint8Array(W*H);
  const S={kind:'town',ref:t.name,W,H,tiles,blds:[],npcs:[],folk:[],deco:[],style:t.style||t.races[0],clim:t.clim||climAt(t.x,t.y),wall:wallOf(t),seed:t.seed,col:facCol(t),port:t.style==='port'};
  const set=(x,y,v)=>{if(x>=0&&y>=0&&x<W&&y<H)tiles[y*W+x]=v},at=(x,y)=>sceneAt(S,x,y);
  const fill=(x,y,w,h,v)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)set(i,j,v)};
  // the ring and the gate
  for(let i=1;i<W-1;i++){set(i,1,S_SOLID);set(i,H-2,S_SOLID)}for(let j=1;j<H-1;j++){set(1,j,S_SOLID);set(W-2,j,S_SOLID)}
  for(let i=0;i<W;i++){set(i,0,S_SOLID);set(i,H-1,S_SOLID)}for(let j=0;j<H;j++){set(0,j,S_SOLID);set(W-1,j,S_SOLID)}
  const gx=(W>>1)-1;fill(gx,H-2,2,2,S_PATH);S.gate={x:gx,y:H-2,w:2};
  // the sea and a pier
  const east=S.port?W-10:W-2;
  if(S.port){fill(east,2,W-2-east,H-4,S_WATER);const py=ri(10,16);fill(east,py,6,2,S_PIER);S.pier={x:east,y:py,w:6,h:2}}
  // the square and the main street
  const cx=Math.round((2+east)/2),sq={x:cx-6,y:11,w:12,h:6};S.square=sq;
  fill(sq.x,sq.y,sq.w,sq.h,S_PATH);fill(gx,sq.y+sq.h,2,H-2-(sq.y+sq.h),S_PATH);
  if(S.port)fill(sq.x+sq.w,S.pier.y,east-(sq.x+sq.w),2,S_PATH);
  // a path from a door to the streets, around everything in the way; false if there is none
  const carve=(x,y)=>{const prev=new Int32Array(W*H).fill(-1),q=[y*W+x];prev[y*W+x]=y*W+x;let hit=-1;
    for(let h=0;h<q.length&&hit<0;h++){const i=q[h],px=i%W,py=(i/W)|0;if(i!==y*W+x&&at(px,py)===S_PATH){hit=i;break}
      for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){const nx=px+dx,ny=py+dy,j=ny*W+nx,v=at(nx,ny);if((v===S_GROUND||v===S_PATH)&&prev[j]<0){prev[j]=i;q.push(j)}}}
    if(hit<0)return false;for(let i=hit;i!==y*W+x;i=prev[i])set(i%W,(i/W)|0,S_PATH);set(x,y,S_PATH);return true};
  // put a building where it likes to be: the best of many tries that fits, with room around it and a way to its door
  const place=(k,role)=>{
    const B=SCENE_BLD[k],w=B.w,h=B.h;let best=null,bs=1e9;
    for(let n=0;n<260;n++){const x=ri(3,east-w-1),y=ri(3,H-h-4);let ok=true;
      for(let j=y-1;j<=y+h&&ok;j++)for(let i=x-1;i<=x+w&&ok;i++){const v=at(i,j),inside=i>=x&&i<x+w&&j>=y&&j<y+h;if(inside?v!==S_GROUND:(v===S_SOLID||v===S_WATER))ok=false}
      const dx=x+(w>>1),dy=y+h;if(!ok||at(dx,dy)===S_SOLID||at(dx,dy)===S_WATER)continue;
      const mid=[x+w/2,y+h/2],sc=B.near==='north'?y*3+Math.abs(mid[0]-cx):B.near==='gate'?Math.hypot(mid[0]-gx,mid[1]-H):B.near==='square'?Math.hypot(mid[0]-cx,mid[1]-(sq.y+3)):R()*10;
      if(sc<bs){bs=sc;best=[x,y]}}
    if(!best)return null;const [x,y]=best;fill(x,y,w,h,S_SOLID);
    const door=[x+(w>>1),y+h];if(!carve(door[0],door[1])){fill(x,y,w,h,S_GROUND);return null}
    const b={k,x,y,w,h,door,role,v:ri(0,9)};S.blds.push(b);return b};
  // the people who work here, at their doors; merchants at stalls along the top of the square
  const roles=townRoles(t),seen={};
  for(const r of roles){const R0=SCENE_ROLES[r];if(R0.bld==='stall')continue;
    let b=seen[R0.bld];if(!b){b=place(R0.bld,r);seen[R0.bld]=b}if(!b)continue;
    S.npcs.push({role:r,x:(b.door[0]+.5)*TILE+(b.npcs?10:0),y:(b.door[1]+1)*TILE-3,dir:1,ph:R()*6});b.npcs=(b.npcs||0)+1}
  if(roles.includes('merchant')){const n=ri(2,4);for(let i=0;i<n;i++){const x=sq.x+1+i*3,y=sq.y;set(x,y,S_SOLID);set(x+1,y,S_SOLID);S.deco.push({k:'stall',x,y,v:ri(0,9)});
    if(!i)S.npcs.push({role:'merchant',x:(x+1)*TILE,y:(y+2)*TILE-3,dir:1,ph:R()*6})}}
  // a well in the square, houses on the rest of the land, trees in the gaps, lamps along the main street
  {const wx=cx-1+ri(0,1),wy=sq.y+3;set(wx,wy,S_SOLID);S.deco.push({k:'well',x:wx,y:wy})}
  const houses=clamp(Math.round((t.pop||100)/30),4,12);for(let i=0;i<houses;i++)place('house',null);
  for(let n=0;n<40;n++){const x=ri(3,east-2),y=ri(3,H-4);if(at(x,y)!==S_GROUND)continue;let near=false;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(at(x+i,y+j)!==S_GROUND)near=true;if(near)continue;set(x,y,S_SOLID);S.deco.push({k:'tree',x,y,v:ri(0,9)})}
  for(let y=sq.y+sq.h+1;y<H-3;y+=3){S.deco.push({k:'lamp',x:gx-1,y});S.deco.push({k:'lamp',x:gx+2,y})}
  // townsfolk wander the streets
  S.walk=[];for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(at(i,j)===S_PATH&&j<H-2)S.walk.push([i,j]);
  const folk=clamp(Math.round((t.pop||100)/25),4,14),race=t.races;
  for(let i=0;i<folk;i++){const [x,y]=S.walk[ri(0,S.walk.length-1)];S.folk.push({folk:true,x:(x+.5)*TILE,y:(y+1)*TILE-3,dir:1,race:race[i%race.length],v:ri(0,23),wait:R()*3,t:0})}
  // lords staying here, by the hall
  {const hall=S.blds.find(b=>b.k==='hall');if(hall)lordsInside(t).slice(0,3).forEach((l,i)=>S.npcs.push({lord:l.id,x:(hall.door[0]+.5)*TILE-14*(i+1),y:(hall.door[1]+1)*TILE-3,dir:1,ph:R()*6,race:t.races[0]}))}
  // two guards at the gate
  for(const dx of [-1,2])S.npcs.push({guard:true,x:(gx+dx+.5)*TILE,y:(H-3)*TILE-3,dir:dx<0?1:-1,ph:R()*6,race:race[0]});
  S.start={x:(gx+1)*TILE,y:(H-3)*TILE};
  return S;
}
