'use strict';
// Paths round obstacles (battle/route.js PATHS; the owner, 2026-11-01: "can you make the pathfinder better for obstacles? right now
// the units seem to bump into boundaries, houses, etc. which sometimes make them stuck", and "does it going to impact the
// performance? if so can we have a better technique?"). Each grid's clearance (routeRoom), a flow field per army and per group
// (routeFlow), string-pulled ways with the body's room, sliding along walls and a stuck rescue; buildings solid on their ground plan
// alone (world/march.js marchFootings: "only certain part should be allowed like if this building is tall then you can partially
// walk behind with building sprite transparent").
// The map: an army marched down a street of houses, past and between them, through the gaps of a row across it and round a pond's
// corner: no man in a footing, none within his body's room of a shut cell, none stuck; searches a step no more than with every
// switch off. A battle: foot, riders and a troll ordered through a gap in a rock wall, past rocks and a wood, the same. Buildings:
// footings within their pictures, a cluster's and a towered building's blocking only their ground parts, a man standing behind a
// tall house drawn faded through it. Every switch off: today's ways, as before (the fingerprints prove the whole).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,TILE=t.TILE,PA=t.PATHS,SW=['clear','flow','smooth','slide','footing'],keep=Object.fromEntries(SW.map(k=>[k,PA[k]]));
 const set=on=>{for(const k of SW)PA[k]=typeof on==='object'?!!(on[k]??true):!!on};
 const RN=t.ROUTE_N,tol=.05;
 try{
 // ======== the map
 // (your army of troops on cleared open ground, Ashford's house lots copied where lay puts them ([tile dx, dy, lot kind]: about
 // the army's start), its march formation its style's)
 const scene=(troops,lay,water=[])=>{Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
  const h=Kit.goHome('Ashford');Kit.goTo(...Kit.field(h,52,32));/* (the fewest lots in the ground the scene clears, 44 tiles east, 24 either side) */P.troops={...troops};delete P.army.march;
  const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE);for(let y=ty-24;y<=ty+24;y++)for(let x=tx-24;x<=tx+44;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
  for(const [x,y] of water)t.WM.kind[(ty+y)*t.MW+tx+x]=t.T_WATER;
  const town=t.townBy('Ashford'),src=k=>town.lots.find(l=>l.st==='built'&&(l.type===k||l.k===k))||town.lots.find(l=>l.k==='house'),lots=lay.map(([dx,dy,k],i)=>({...src(k||'house'),x:tx+dx,y:ty+dy,id:'pathlot'+i,_ft:null}));
  town.lots.push(...lots);const a=t.MarchArmy.of(P);a.ground=null;return{a,tx,ty,town,lots,done:()=>{town.lots=town.lots.filter(l=>!lots.includes(l))}}};
 // (a march: you sent on px a moment for go moments, then halted for rest; every man judged every step: in a footing, his exact
 // room (route.js routeGap: px to the nearest shut cell) short of what he keeps (routeNeed), stuck (his place over 2 px off, gone
 // under .5 px in stall s while the army marches); the searches (its per-man ones, its fields) and its step's time)
 const march=(S,px,go,rest,stall=4)=>{const a=S.a,o={steps:0,inFoot:0,clip:0,worst:Infinity,stuck:0,stuckS:0,q:0,f:0,ms:0,left:0,on:0};const last=new Map();let time=0;
  for(let i=0;i<go+rest;i++){if(i<go)P.x+=px;const t0=performance.now();a.step(1/30);o.ms+=performance.now()-t0;o.steps++;time+=1/30;o.q+=a.queries;o.f+=a.fields||0;const nav=a.ground,g=nav.grid;
   for(const u of a.units){if(u.dead)continue;if(nav.blocks.some(b=>u.x>b.x&&u.x<b.x+b.w&&u.y>b.y&&u.y<b.y+b.h))o.inFoot++;
    if(PA.clear&&nav.contains(u)){t.routeRoom(g);const r=t.marchBody(u)/2,w=t.routeNeed(g,t.routeIx(g,u.x-nav.x,u.y-nav.y),r),v=nav.gap(u,w);if(v<w-tol)o.clip++;o.worst=Math.min(o.worst,v-w)}
    let k=last.get(u);if(!k)last.set(u,k={x:u.x,y:u.y,t:time});if(Math.hypot(u.x-k.x,u.y-k.y)>.5||!u.goal||Math.hypot(u.goal.x-u.x,u.goal.y-u.y)<=2||i>=go){k.x=u.x;k.y=u.y;k.t=time}else if(time-k.t>stall){o.stuck++;o.stuckS=Math.max(o.stuckS,time-k.t);k.t=time}}}
  const L=a.units.filter(u=>!u.dead&&u.goal&&Math.hypot(u.x-u.goal.x,u.y-u.goal.y)>2);o.left=L.length;o.on=P.x;
  return o};
 const say=(n,o)=>n+': '+o.steps+' steps, '+(o.ms/o.steps).toFixed(3)+' ms a step, '+(o.q/o.steps).toFixed(2)+' searches and '+(o.f/o.steps).toFixed(2)+' fields a step; in a footing '+o.inFoot+', within his room of a wall '+o.clip+(o.worst<Infinity?' (worst '+o.worst.toFixed(2)+' px)':'')+', stuck '+o.stuck+' (longest '+o.stuckS.toFixed(1)+' s), off his place at the end '+o.left;
 // a street: a row of houses either side, side by side, a row across its end with gaps, cottages (L-shaped) among them
 const street=[];for(let x=3;x<=17;x+=2){street.push([x,-4,x%4===1?'cottage':'townhouse']);street.push([x,2,x%4===3?'cottage':'townhouse'])}for(let y=-6;y<=4;y+=3)street.push([21,y,'townhouse']);
 {set(true);const S=scene({hum_foot:30,hum_bow:12},street),o=march(S,.4,900,600);info(say('a street, all on',o));
  ok(!o.inFoot&&!o.clip&&!o.stuck,'an army of 42 marched down a street of houses, past and between them and through the gaps of a row across it: no man in a footing, none within his body\'s room of a wall ('+o.clip+'), none stuck ('+o.stuck+')');
  ok(o.left===0,'it forms up beyond them, every man in his place ('+o.left+' not)');S.done()}
 {set(false);const S=scene({hum_foot:30,hum_bow:12},street),o=march(S,.4,900,600);info(say('a street, all off (today)',o));S.done();
  set(true);const S2=scene({hum_foot:30,hum_bow:12},street),o2=march(S2,.4,900,600);S2.done();
  ok((o2.q+o2.f)<=o.q,'searches: '+(o2.q+o2.f)+' in '+o2.steps+' steps with the field ('+o2.q+' of their own, '+o2.f+' fields), '+o.q+' today: no more than before')}
 // riders and foot together: their rooms their own
 {set(true);const S=scene({hum_foot:16,hum_knight:12},street),o=march(S,.4,900,600);info(say('foot and riders, all on',o));
  ok(!o.inFoot&&!o.clip&&!o.stuck&&o.left===0,'foot and riders down the street: none in a footing, within his room of a wall, or stuck; all formed up beyond ('+o.left+' not)');S.done()}
 // a corner: a pond's two banks meeting by the army's way, open at one end; its guide along the bank, round its end and down its far
 // side, so its rear men's places lie round the bank from them: none stands held there long (stall: s without going .5 px on, his
 // place over 2 px off), all reach their places
 {const pond=[];for(let y=-8;y<=6;y++)pond.push([10,y]);for(let x=4;x<=10;x++)pond.push([x,6]);
  const run=on=>{set(on);const S=scene({hum_foot:24},[],pond),a=S.a;for(let i=0;i<60;i++)a.step(1/30);
   let k=0,long=0,held=0;const at=new Map(),x0=P.x,y0=P.y,way=[[0,-11],[16,-11],[16,-3]].map(([x,y])=>[x0+x*TILE,y0+y*TILE]);
   for(let i=0;i<2400;i++){const w=way[k];if(w){const dx=w[0]-P.x,dy=w[1]-P.y,l=Math.hypot(dx,dy);if(l>.4){P.x+=dx/l*.4;P.y+=dy/l*.4}else k++}a.step(1/30);
    for(const u of a.units){if(u.dead||!u.goal)continue;let s=at.get(u);if(!s)at.set(u,s={x:u.x,y:u.y,t:0,over:false});
     if(Math.hypot(u.x-s.x,u.y-s.y)>.5||Math.hypot(u.goal.x-u.x,u.goal.y-u.y)<=2){s.x=u.x;s.y=u.y;s.t=0;s.over=false}else{s.t+=1/30;long=Math.max(long,s.t);if(s.t>=1.5&&!s.over){s.over=true;held++}}}}
   const left=a.units.filter(u=>!u.dead&&u.goal&&Math.hypot(u.x-u.goal.x,u.y-u.goal.y)>2).length;S.done();return{long,held,left}};
  const off=run(false),on=run(true);info('a pond\'s corner: today '+off.held+' times a man stood held 1.5 s or more (the longest '+off.long.toFixed(1)+' s), '+off.left+' off their places at the end; now '+on.held+' ('+on.long.toFixed(1)+' s), '+on.left);
  ok(on.held<=off.held&&on.long<=Math.max(off.long,2)&&on.left===0,'round a pond\'s corner: its men slide along its banks, none held there longer than before ('+on.long.toFixed(1)+' s at most, '+off.long.toFixed(1)+' today; '+on.held+' times 1.5 s or more, '+off.held+' today), and all reach their places ('+on.left+' not)')}
 // ======== buildings
 {set(true);Kit.begin('soldier',1);Kit.clear();Kit.world();const lots=[];for(const town of t.TOWNS)for(const l of town.lots||[])if(l.st==='built'&&l.k!=='field'&&l.k!=='pasture')lots.push([town,l]);
  let inside=true,under=true,n=0;const shapes=[];
  for(const [town,l] of lots.slice(0,120)){const s=t.lotSprite(town,l),f=t.modelFooting(t.lotModel(town,l));if(!f||!f.length)continue;n++;const d=s.getContext('2d').getImageData(0,0,s.width,s.height).data;
   let area=0,x0=1e9,y0=1e9,x1=-1,y1=-1;for(const r of f){area+=r.w*r.h;x0=Math.min(x0,r.x);y0=Math.min(y0,r.y);x1=Math.max(x1,r.x+r.w);y1=Math.max(y1,r.y+r.h);if(r.x<0||r.y<0||r.x+r.w>s.width||r.y+r.h>s.height)inside=false;
    for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)if(d[(y*s.width+x)*4+3]<250)under=false}
   const box=t.opaqueBox(s);shapes.push({town,l,s,f,area,fill:area/((x1-x0)*(y1-y0)),tall:y0-box[1],y0,y1,x0,x1})}
  ok(n>20&&inside&&under,'each building\'s footing lies on its own picture, under what it shows ('+n+' lots): no wall unseen');
  // (a camp's and a site's too: their models' ground parts, on their pictures, under what they show)
  {const ss=t.W.sites.filter(s=>s instanceof t.BanditCamp||s.type==='ruins'||s.type==='cave').slice(0,6);let fine=ss.length>0,n2=0;
   for(const s of ss){const sp=t.siteSprite(s),f=t.siteFooting(s),X=s.x-sp.ax,Y=s.y+8-sp.ay,d=sp.getContext('2d').getImageData(0,0,sp.width,sp.height).data;if(!f.length){fine=false;continue}n2++;
    for(const r of f)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const px=x-X,py=y-Y;if(px<0||py<0||px>=sp.width||py>=sp.height||d[(py*sp.width+px)*4+3]<250)fine=false}}
   ok(fine,'a camp\'s and a site\'s footing: its model\'s ground parts, under its picture ('+n2+' of '+ss.length+': '+ss.map(s=>s.type||'camp').join(', ')+')')}
  ok(shapes.every(q=>q.tall>=4),'every footing is lower than its picture\'s top: the tall part above it is no wall (least '+Math.min(...shapes.map(q=>q.tall))+' px)');
  // an L-shaped or towered building, or a cluster: its footing is its ground parts, not their box; the grid shuts those and not the rest
  const odd=shapes.filter(q=>q.fill<.8&&q.area>=200).sort((a,b)=>a.fill-b.fill)[0];
  if(!odd)ok(false,'an L-shaped, towered or clustered building among the lots');else{
   // (the ground with it and without it (its lot taken out a moment): cells wholly in its footing shut that were open, cells wholly out
   // of it, in its box, as they were; a cell part in, part out, shut: a building's edge reaches into it)
   // (its footing alone: a slit between it and a neighbour shut too is march.js shutSlits', MARCH_MOVE.slit, left out here: tests/marchslit.js)
   const X=odd.l.x*TILE,Y=odd.l.y*TILE;Kit.goTo(X+odd.s.width/2,Y+odd.s.height+40);const sl=t.MARCH_MOVE.slit;t.MARCH_MOVE.slit=0;const nav=new t.MarchGround(P,[]),g=nav.grid;
   const at=odd.town.lots.indexOf(odd.l);odd.town.lots.splice(at,1);const g0=new t.MarchGround(P,[]).grid;odd.town.lots.splice(at,0,odd.l);t.MARCH_MOVE.slit=sl;let shutIn=0,cellsIn=0,openOut=0,cellsOut=0;
   const inF=(x,y)=>odd.f.some(r=>x>=X+r.x&&x<X+r.x+r.w&&y>=Y+r.y&&y<Y+r.y+r.h);
   for(let r=0;r<g.R;r++)for(let c=0;c<g.C;c++){const x0=nav.x+c*g.cs,y0=nav.y+r*g.cs,i=r*g.C+c;if(x0<X+odd.x0||x0+g.cs>X+odd.x1||y0<Y+odd.y0||y0+g.cs>Y+odd.y1||!g0.cost[i])continue;let all=true,none=true;
    for(let y=y0;y<y0+g.cs;y++)for(let x=x0;x<x0+g.cs;x++){const k=inF(x+.5,y+.5);all&&=k;none&&=!k}if(all){cellsIn++;if(!g.cost[i])shutIn++}if(none){cellsOut++;if(g.cost[i])openOut++}}
   ok(cellsIn>0&&shutIn===cellsIn&&cellsOut>0&&openOut===cellsOut,'a '+odd.l.type+' (its footing '+Math.round(odd.fill*100)+'% of its box, '+odd.f.length+' rects) blocks exactly its footing: '+shutIn+'/'+cellsIn+' cells wholly in it shut, '+openOut+'/'+cellsOut+' wholly out of it (in its box) open')}
  // a man behind a tall house: open ground, and he is drawn faded through it
  const tall=shapes.filter(q=>q.tall>=14&&q.fill>.8).sort((a,b)=>b.tall-a.tall)[0];
  if(!tall)ok(false,'a tall house among the lots');else{
   const X=tall.l.x*TILE,Y=tall.l.y*TILE,bx=X+(tall.x0+tall.x1)/2,by=Y+tall.y0-8;
   for(const q of [...t.W.lords,...t.bandits])q.x=q.y=-9999;Kit.goTo(bx,by);P.troops={};delete P.army.march;t.WORLD_BATTLE.on=true;const a=t.MarchArmy.of(P);a.ground=null;for(let i=0;i<60;i++)a.step(1/30);
   const hero=a.units[0],nav=a.ground;ok(nav.open({x:bx,y:by})&&hero&&Math.hypot(hero.x-bx,hero.y-by)<1,'the ground '+(tall.y0-3)+' px down a '+tall.l.type+'\'s picture (its roof\'s band, behind it) is open: your hero stands there ('+(hero?Math.hypot(hero.x-bx,hero.y-by).toFixed(2):'none')+' px off), '+(tall.y0-8-t.opaqueBox(tall.s)[1])+' px below the picture\'s top');
   const D=t.WDEPTH,pn=performance.now;let now=pn.call(performance);performance.now=()=>now;try{D.on=true;D.al.clear();D.cov.clear();D.t=0;for(let i=0;i<12;i++){now+=50;t.drawWorld()}
    const on=t.ctx.getImageData(0,0,t.VW,t.VH).data,box=D.boxes.find(b=>b[5]),cov=D.cov.has(tall.s)||[...D.cov].some(k=>k===tall.l._s);D.on=false;t.drawWorld();const off=t.ctx.getImageData(0,0,t.VW,t.VH).data;D.on=true;
    let diff=0;if(box)for(let y=box[1];y<=box[3];y++)for(let x=box[0];x<=box[2];x++){const i=(y*t.VW+x)*4;if(on[i]!==off[i]||on[i+1]!==off[i+1]||on[i+2]!==off[i+2])diff++}
    ok(!!box&&cov&&diff>0,'drawn there, he is covered by the house and shows through it faded (gfx/depth.js: the house among what fades over him: '+cov+'; '+diff+' px of him differ from his drawing with depth off)')}
   finally{performance.now=pn}}}
 // ======== battles
 {const L=t.BattleLab,K=t.TKIND;
  const lab=(left,right)=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:true,morale:false,seed:5,ground:{rocks:[{x:.42,y:.3,r:40}]}});t.B.obs=[];t.B.cmdT=1e9;return t.B};
  const place=(g,x,y)=>{g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})};
  // (a wall of rock down the field's middle, a gap of three cells in it; a wood before it; rebuilt on the grids)
  const wall=B=>{const T=B.terrain,cc=T.C>>1,top=Math.ceil(t.fieldTop()/T.cs),bot=Math.floor(t.fieldBot()/T.cs),gap=Math.floor((top+bot)/2);
   for(let r=top;r<=bot;r++)if(Math.abs(r-gap)>1){T.kind[r*T.C+cc]=K.rock;T.kind[r*T.C+cc+1]=K.rock}
   for(let r=gap+3;r<gap+7;r++)for(let c=cc-6;c<cc-3;c++)T.kind[r*T.C+c]=K.wood;T.has.wood=true;T.index();T.routes.build();return{x:(cc+1)*T.cs,y:(gap+.5)*T.cs,cc}};
  const watch=(B,mine,s)=>{const T=B.terrain,o={frames:0,solid:0,clip:0,worst:Infinity,stuck:0,ms:0,q:0,f:0};const last=new Map();B.paused=false;const q0=RN.search,f0=RN.flow;
   while(B.t<s){const t0=performance.now();t.updateBattle(1/60);o.ms+=performance.now()-t0;o.frames++;
    for(const g of mine)for(const u of g.units){if(u.hp<=0)continue;const gr=T.route[t.routeWho(u.s)],i=t.routeIx(gr,u.x,u.y);if(!gr.cost[i]){o.solid++;continue}
     if(PA.clear){t.routeRoom(gr);const w=t.routeNeed(gr,i,t.routeBody(u)),v=t.routeGap(gr,u.x,u.y,w);if(v<w-tol)o.clip++;o.worst=Math.min(o.worst,v-w)}
     const sx=g.ax+(u.sx||0),sy=g.ay+(u.sy||0);let k=last.get(u);if(!k)last.set(u,k={x:u.x,y:u.y,t:B.t});if(Math.hypot(u.x-k.x,u.y-k.y)>2||Math.hypot(sx-u.x,sy-u.y)<20){k.x=u.x;k.y=u.y;k.t=B.t}else if(B.t-k.t>3){o.stuck++;k.t=B.t}}}
   B.paused=true;o.q=RN.search-q0;o.f=RN.flow-f0;return o};
  const through=on=>{set(on);const B=lab([{type:'hum_foot',count:16},{type:'hum_knight',count:8},{type:'troll',count:1}],[{type:'hum_foot',count:4}]),W=wall(B),[gf,gk,gt]=t.playerGroups().map(id=>B.groups[id]),foe=Object.values(B.groups).find(q=>q.foe);
   const Y=W.y;place(gf,W.x-200,Y-60);place(gk,W.x-220,Y+70);place(gt,W.x-160,Y+10);place(foe,t.BW-40,t.fieldBot()-30);
   for(const [g,dy] of [[gf,-30],[gk,40],[gt,0]])g.moveTo(W.x+180,Y+dy);const o=watch(B,[gf,gk,gt],30);
   o.home=[gf,gk,gt].map(g=>g.units.filter(u=>u.hp>0&&Math.hypot(g.ax+(u.sx||0)-u.x,g.ay+(u.sy||0)-u.y)<(u.s.big?32:16)).length/g.units.filter(u=>u.hp>0).length);return o};
  const off=through(false),on=through(true);
  const bs=(n,o)=>n+': '+o.frames+' frames, '+(o.ms/o.frames).toFixed(3)+' ms, '+(o.q/o.frames).toFixed(3)+' searches and '+(o.f/o.frames).toFixed(3)+' fields a frame; in rock '+o.solid+', within his room '+o.clip+(o.worst<Infinity?' (worst '+o.worst.toFixed(2)+')':'')+', stuck '+o.stuck+', in place '+o.home.map(v=>Math.round(v*100)+'%').join(' / ');
  info(bs('a gap in a rock wall, today',off));info(bs('now',on));
  ok(!on.solid&&!on.clip&&!on.stuck,'foot, riders and a troll ordered through a gap in a rock wall past a wood: none in rock, none within his body\'s room of it ('+on.clip+'), none stuck ('+on.stuck+')');
  ok(on.home.every(v=>v>=.9),'each group is through and formed at its place ('+on.home.map(v=>Math.round(v*100)+'%').join(', ')+')');
  ok(on.q<=off.q&&on.f<=3*2,'searches no more than before ('+on.q+' of their own and '+on.f+' fields in '+on.frames+' frames, '+off.q+' today: the fields, one a group, where a man\'s body found his straight way blocked)');
  // the measure: a battle of 150 among rocks, a wood and a wall with a gap, both sides' captains fighting it; best of three
  const fight=on=>{set(on);if(L.active)L.exit();G.mode='world';G.modal=false;const side=[{type:'hum_foot',count:30},{type:'hum_spear',count:25},{type:'hum_knight',count:20}];
   L.start({leftGroups:side,rightGroups:side.map(g=>({...g})),deploy:false,ai:true,paused:true,morale:true,seed:5,ground:{rocks:[{x:.42,y:.3,r:40},{x:.6,y:.7,r:36}]}});const B=t.B;B.obs=[];wall(B);B.paused=false;
   const q0=RN.search,f0=RN.flow;let ms=0,n=0;const r0=Math.random;Math.random=t.seeded(9);try{while(B.t<15&&!L.session.result){const t0=performance.now();t.updateBattle(1/60);ms+=performance.now()-t0;n++}}finally{Math.random=r0}
   return{ms:ms/n,q:(RN.search-q0)/n,f:(RN.flow-f0)/n,n,units:B.units.length}};
  const best={false:null,true:null};for(let k=0;k<3;k++)for(const on of [false,true]){const r=fight(on);const b=best[on];if(!b||r.ms<b.ms)best[on]=r}
  info('a battle of '+best.true.units+' among rocks, a wood and a wall, 15 s: today '+best.false.ms.toFixed(3)+' ms a frame, '+best.false.q.toFixed(3)+' searches a frame; now '+best.true.ms.toFixed(3)+' ms, '+best.true.q.toFixed(3)+' searches and '+best.true.f.toFixed(3)+' fields a frame (best of 3)');
  // (today: every switch off in this code; the measure against the code before it, the report's. A guard against a slowing, not the measure)
  ok(best.true.ms<=best.false.ms*1.25,'the battle\'s frame within a quarter of today\'s ways ('+best.true.ms.toFixed(3)+' ms a frame, '+best.false.ms.toFixed(3)+' with every switch off)');
  ok(best.true.q+best.true.f<=best.false.q,'and searches no more a frame ('+(best.true.q+best.true.f).toFixed(3)+' with the fields, '+best.false.q.toFixed(3)+' today)');
  if(L.active)L.exit();G.mode='world'}
 // ======== the map's measure: an army of 60 down the street; best of three
 {const best={false:null,true:null};for(let k=0;k<3;k++)for(const on of [false,true]){set(on);const S=scene({hum_foot:40,hum_bow:20},street),o=march(S,.4,900,300);S.done();const r={ms:o.ms/o.steps,q:o.q/o.steps,f:o.f/o.steps};const b=best[on];if(!b||r.ms<b.ms)best[on]=r}
  info('an army of 60 down a street of houses: today '+best.false.ms.toFixed(3)+' ms a step, '+best.false.q.toFixed(3)+' searches a step; now '+best.true.ms.toFixed(3)+' ms, '+best.true.q.toFixed(3)+' searches and '+best.true.f.toFixed(3)+' fields a step (best of 3)');
  ok(best.true.ms<=best.false.ms*1.5,'the march\'s step within half again today\'s ways in this code ('+best.true.ms.toFixed(3)+' ms a step, '+best.false.ms.toFixed(3)+' with every switch off, its men\'s buckets made faster for both)');
  ok(best.true.q+best.true.f<=best.false.q,'and searches no more a step ('+(best.true.q+best.true.f).toFixed(3)+' with the fields, '+best.false.q.toFixed(3)+' today)')}
 // ======== each switch off: today's ways
 {set(false);const g=t.routeGrid(20,20,4);for(let c=5;c<15;c++)t.routeCell(g,c,10,0);const p0=t.routePath(g,10,20,40,70,{cache:false}),p1=t.routePath(g,10,20,40,70,{cache:false,need:3});
  ok(JSON.stringify(p0)===JSON.stringify(p1)&&!g.cl&&t.lineClear(g,10,38,70,38,255,3)===t.lineClear(g,10,38,70,38,255,3),'clear off: no clearance made, a body\'s room asked of a search changes nothing');
  set({clear:false});const g2=t.routeGrid(20,20,4);t.routePath(g2,10,20,40,70,{need:3});ok(!g2.cl,'clear off alone: none made either');
  set({flow:false});const S=scene({hum_foot:20},street),f0=RN.flow;march(S,.4,240,0);ok(RN.flow===f0&&S.a.units.every(u=>!u.flow),'flow off: no field made, every blocked man asks his own way as before');S.done();
  set({slide:false});const S2=scene({hum_foot:20},street);march(S2,.4,240,0);ok(S2.a.units.every(u=>!u.pk),'slide off: no man\'s stuck watch, no slide');S2.done();
  set({footing:false});const S3=scene({hum_foot:4},street),N3=new t.MarchGround(P,S3.a.units),x1=N3.x+N3.grid.C*N3.grid.cs,y1=N3.y+N3.grid.R*N3.grid.cs,fp=t.marchFootprints(N3.x,N3.y,x1,y1).filter(b=>b.x<x1&&b.y<y1&&b.x+b.w>N3.x&&b.y+b.h>N3.y);
  ok(fp.length>0&&JSON.stringify(N3.blocks)===JSON.stringify(fp),'footing off: the buildings\' blocks are their pictures\' feet as before (marchFootprints: '+fp.length+')');S3.done()}
 }finally{for(const k of SW)PA[k]=keep[k]}
});
