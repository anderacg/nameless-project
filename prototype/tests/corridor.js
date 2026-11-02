'use strict';
// An army routes as one, round a holding's solid walls (battle/route.js PATHS.corridor, PATHS.holding; world/march.js MarchArmy
// corridor, holdFooting; world/router.js holdShut; the owner, 2026-11-02: "why some of unit decided to move away from army not
// follow their comrades when there's an obstacle blocked, should the pathfinder calculated as a whole group first then make the
// unit move together?", and "the holding walls is not correct because the unit can walk through it"). Columns that keep steady
// (world/marchstyles.js TRAVEL_STYLES.steady, yourChoice: "if your army cannot form a column it'll keep reorganize", "for player
// army it should not auto change formation if enemy is near"), and men who give up a place they cannot reach (MARCH_MOVE.formGiveUp:
// "after 5 secs or xxx cooldown timer then it just stop trying and stand there", "this will apply to all formations in marching or
// in battle").
// The map: your army of 60 sent past Ashford's citadel, west to east and north to south, every man round the side its guide takes,
// none in its walls, none stuck, all arrived; past a citadel its guide walks straight through (a building the world's ways do not
// know), all round one side as the corridor goes, where today they split. The walls: its footing its walls' ground, its gate open,
// its tiles shut to the world's ways, a walker's way round them to its gate, you entering at the gate; ruined, open. A battle: a group
// through a wall of rock with two gaps, all through one. Columns: a foe at the alert edge, a column that cannot form, a short click by
// road, a click behind, yours and a lord's near a foe. Giving up: on the map and in battle. Each switch off: today.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,PA=t.PATHS,M=t.MARCH_MOVE,TS=t.TRAVEL_STYLES,Style=t.TravelStyle,TILE=t.TILE,D=1/30;
 const keep={corridor:PA.corridor,holding:PA.holding,steady:TS.steady,yourChoice:TS.yourChoice,formGiveUp:M.formGiveUp};
 const sw=o=>{for(const k of ['corridor','holding'])if(k in o)PA[k]=o[k];for(const k of ['steady','yourChoice'])if(k in o)TS[k]=o[k];if('formGiveUp' in o)M.formGiveUp=o.formGiveUp};
 const back=()=>sw(keep);
 const reroute=()=>{(0,eval)('WAYV++;PAIRS.clear();WM.graph.chunk.clear();ROUTES=new WeakMap()');t.Router.holdings()};
 const openLand=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64;t.tiles[i]=t.T_OPEN}};
 const off=a=>a.units.filter(u=>!u.dead&&!u.gave&&u.goal&&Math.hypot(u.x-u.goal.x,u.y-u.goal.y)>2).length;// (off their places, not given up: formGiveUp)
 try{
 // ======== the map: past Ashford's citadel (its other lots taken away a while, its land cleared)
 Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;G.mode='world';
 let h=t.townBy('Ashford'),c=h.lots.find(l=>l.k==='centre'),lots0=h.lots.slice();
 const foot=()=>t.holdFooting(t.lotModel(h,c)).map(r=>({x:c.x*TILE+r.x,y:c.y*TILE+r.y,w:r.w,h:r.h}));
 // (a march from sx, sy to gx, gy by the world: your click, your guide by the router; every man looked at each frame: in the walls,
 // the side he passes them on (the guide's too), stuck (his place over 2 px off, gone under .5 px in 4 s), the ms a frame)
 const past=(sx,sy,gx,gy,on)=>{sw(on);h.lots=[c];Kit.goTo(sx,sy);P.troops={hum_foot:40,hum_bow:20};P.comps={};P.bsta=100;P.byRoad=false;G.byRoad=null;delete P.army.march;t.MARCH_ARMIES.delete(P);
  openLand(c.x-16,c.y-14,c.x+c.n+16,c.y+c.n+14);reroute();for(let i=0;i<90;i++)t.updateWorld(D);P.tx=gx;P.ty=gy;
  const F=foot(),vert=Math.abs(gy-sy)>Math.abs(gx-sx),x0=c.x*TILE,x1=(c.x+c.n)*TILE,fy0=Math.min(...F.map(r=>r.y)),fy1=Math.max(...F.map(r=>r.y+r.h)),mx=(x0+x1)/2,my=(fy0+fy1)/2;
  const side=p=>vert?(p.y>fy0&&p.y<fy1?(p.x<mx?'W':'E'):null):(p.x>x0&&p.x<x1?(p.y<my?'N':'S'):null);
  const o={inFoot:0,sides:new Map(),guide:new Set(),stuck:0,ms:0,n:0};const last=new Map();let i=0;
  for(;i<30*120&&P.tx!=null;i++){const t0=performance.now();t.updateWorld(D);o.ms+=performance.now()-t0;o.n++;const a=t.MARCH_ARMIES.get(P);if(!a)continue;const gs=side({x:a.gx,y:a.gy});if(gs)o.guide.add(gs);
   for(const u of a.units){if(u.dead)continue;if(F.some(r=>u.x>r.x&&u.x<r.x+r.w&&u.y>r.y&&u.y<r.y+r.h))o.inFoot++;const s=side(u);if(s){let q=o.sides.get(u);if(!q)o.sides.set(u,q=new Set());q.add(s)}
    let k=last.get(u);if(!k)last.set(u,k={x:u.x,y:u.y,t:i});if(Math.hypot(u.x-k.x,u.y-k.y)>.5||!u.goal||Math.hypot(u.goal.x-u.x,u.goal.y-u.y)<=2||u.gave){k.x=u.x;k.y=u.y;k.t=i}else if(i-k.t>120){o.stuck++;k.t=i}}}
  for(let k=0;k<30*5;k++)t.updateWorld(D);// (its men a while to settle or stand: formGiveUp)
  const a=t.MARCH_ARMIES.get(P),g=[...o.guide][0];o.t=i*D;o.done=P.tx==null;o.left=off(a);o.wrong=[...o.sides.values()].filter(q=>q.size>1||!q.has(g)).length;o.men=o.sides.size;o.g=g;h.lots=lots0;back();return o};
 const say=(n,o)=>n+': '+o.t.toFixed(1)+' s, '+(o.ms/o.n).toFixed(3)+' ms a frame; its guide round the '+[...o.guide].join('/')+', '+o.wrong+' of '+o.men+' men round the other side (or both); in its walls '+o.inFoot+', stuck '+o.stuck+', off their places at the end '+o.left;
 {const cy=(c.y+c.n*.6)*TILE,cx=(c.x+c.n/2)*TILE;
  const we=past(c.x*TILE-90,cy,(c.x+c.n)*TILE+90,cy,{}),ns=past(cx,c.y*TILE-70,cx,(c.y+c.n)*TILE+90,{});info(say('Ashford west to east',we));info(say('north to south',ns));
  for(const [n,o] of [['west to east',we],['north to south',ns]])ok(o.done&&o.guide.size===1&&!o.wrong&&!o.inFoot&&!o.stuck&&o.left<=4,'an army of 60 sent past Ashford\'s citadel '+n+': its guide round the '+o.g+', every man round the same side ('+o.wrong+' not), none in its walls ('+o.inFoot+'), none stuck ('+o.stuck+'), arrived in '+o.t.toFixed(1)+' s ('+o.left+' off their places)');
  const old=past(c.x*TILE-90,cy,(c.x+c.n)*TILE+90,cy,{corridor:false,holding:false});info(say('west to east, both off (today)',old));
  ok(old.inFoot>0,'today its men walk through the citadel ('+old.inFoot+' looks of a man in its walls)')}
 // ---- a citadel its guide walks straight through (a copy laid on cleared land: no world's way round it), the corridor round one side
 const scene=(troops,lay)=>{Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;const hh=Kit.goHome('Ashford');Kit.goTo(hh.x+240,hh.y+200);P.troops={...troops};delete P.army.march;
  const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE);openLand(tx-24,ty-24,tx+44,ty+24);const town=t.townBy('Ashford'),src=k=>town.lots.find(l=>l.st==='built'&&(l.type===k||l.k===k)),lots=lay.map(([dx,dy,k],i)=>({...src(k),x:tx+dx,y:ty+dy,id:'corlot'+i,_ft:null}));
  town.lots.push(...lots);const a=t.MarchArmy.of(P);a.ground=null;return{a,tx,ty,town,lots,done:()=>{town.lots=town.lots.filter(l=>!lots.includes(l))}}};
 const through=(on,dy)=>{sw(on);const S=scene({hum_foot:40,hum_bow:20},[[8,-4,'centre']]),a=S.a,x0=(S.tx+8)*TILE,x1=(S.tx+16)*TILE,y0=(S.ty-2)*TILE,y1=(S.ty+4)*TILE,sides=new Map(),n0=t.MARCH_COR.n;
  for(let i=0;i<60;i++)a.step(D);P.y+=dy;let ms=0;const t0=performance.now();
  for(let i=0;i<1200;i++){if(i<900)P.x+=.4;a.step(D);for(const u of a.units)if(u.x>x0&&u.x<x1&&(u.y<y0||u.y>y1)){let q=sides.get(u);if(!q)sides.set(u,q=new Set());q.add(u.y<y0?'N':'S')}}ms=(performance.now()-t0)/1200;
  let N=0,So=0,B2=0;for(const q of sides.values()){if(q.size>1)B2++;else if(q.has('N'))N++;else So++}const o={N,S:So,both:B2,left:off(a),ms,made:t.MARCH_COR.n-n0};S.done();back();return o};
 {const rs=[0,-10,10].map(dy=>[dy,through({},dy),through({corridor:false},dy)]);
  for(const [dy,on,o] of rs)info('a citadel walked through, '+dy+' px off its middle: now N '+on.N+' S '+on.S+' both '+on.both+' ('+on.made+' corridors, '+on.ms.toFixed(3)+' ms a step), today N '+o.N+' S '+o.S+' both '+o.both+' ('+o.ms.toFixed(3)+' ms)');
  ok(rs.every(([,on])=>Math.min(on.N,on.S)+on.both<=5&&on.left<=2),'a citadel its guide walks straight through: its men round one side of it as their corridor goes (at most 5 of 61 round the other: '+rs.map(([,on])=>Math.min(on.N,on.S)+on.both).join(', ')+'), all but 2 at most in their places after ('+rs.map(([,on])=>on.left).join(', ')+' not)');
  ok(rs.every(([,,o])=>Math.min(o.N,o.S)>=10),'today they split round both sides ('+rs.map(([,,o])=>o.N+'/'+o.S).join(', ')+')')}
 // ======== the walls
 Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;h=t.townBy('Ashford');c=h.lots.find(l=>l.k==='centre');lots0=h.lots.slice();
 {const F=t.holdFooting(t.lotModel(h,c)),m=t.lotModel(h,c),N=m.cell;let area=0;for(const r of F)area+=r.w*r.h;const top=Math.min(...F.map(r=>r.y)),gx=m.gateX;
  const gate=F.every(r=>!(gx>r.x&&gx<r.x+r.w&&N-4>r.y&&N-4<r.y+r.h));
  ok(top<=N*.3&&top>=N*.15&&area>=N*N*.6&&gate,'Ashford\'s citadel solid on its walls\' ground: its lower '+Math.round((1-top/N)*100)+'% ('+Math.round(area/(N*N)*100)+'% of its picture), its gate in the front wall open ('+gate+')');
  reroute();const sh=[];for(let y=c.y;y<c.y+c.n;y++)for(let x=c.x;x<c.x+c.n;x++)if(t.SHUT&&t.SHUT[y*t.MW+x]&2)sh.push([x,y]);
  const inF=(x,y)=>F.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h),agree=sh.every(([x,y])=>inF((x-c.x+.5)*TILE,(y-c.y+.5)*TILE));
  ok(sh.length>=c.n*c.n*.6&&agree,'its tiles shut to the world\'s ways ('+sh.length+' of '+c.n*c.n+'), each one\'s middle in its walls');
  // (a walker from behind the citadel to its gate, the way a lord goes: never on a shut tile, at the gate in the end)
  const walker=(on)=>{sw(on);reroute();const w={x:(c.x+c.n/2)*TILE,y:c.y*TILE-40},gg=t.gateGoal(h);let bad=0,n=0;for(;n<4000&&Math.hypot(w.x-gg.x,w.y-gg.y)>3;n++){if(!t.Router.travel(w,gg,1.5))break;const i=Math.floor(w.y/TILE)*t.MW+Math.floor(w.x/TILE);if(t.SHUT&&t.SHUT[i]&2||inF(w.x-c.x*TILE,w.y-c.y*TILE))bad++}
   back();reroute();return{bad,n,at:Math.hypot(w.x-gg.x,w.y-gg.y)}};
  const wk=walker({}),wo=walker({holding:false});
  ok(wk.at<=3&&!wk.bad,'a lord\'s way from behind the citadel to its gate goes round its walls ('+wk.n+' steps, '+wk.bad+' in them), at the gate ('+wk.at.toFixed(1)+' px)');
  ok(wo.bad>0,'today it goes through them ('+wo.bad+' steps in its walls, '+wo.n+' steps)');
  // (ruined: open; built again: shut)
  const v0=t.WAYV;c.st='ruined';t.Router.holdings();const open=[...sh].every(([x,y])=>!(t.SHUT[y*t.MW+x]&2)),v1=t.WAYV;c.st='built';t.Router.holdings();const again=sh.every(([x,y])=>t.SHUT[y*t.MW+x]&2);
  ok(open&&again&&v1>v0&&t.WAYV>v1,'ruined, its tiles open (the ways found again: WAYV '+v0+' to '+v1+'); built again, shut');
  // (you sent at it from behind, by the world: round its walls, entering at its gate)
  h.lots=[c];Kit.goTo((c.x+c.n/2)*TILE,c.y*TILE-60);P.troops={hum_foot:20};P.byRoad=false;G.byRoad=null;delete P.army.march;t.MARCH_ARMIES.delete(P);openLand(c.x-16,c.y-14,c.x+c.n+16,c.y+c.n+14);reroute();
  for(let i=0;i<60;i++)t.updateWorld(D);G.lastTown=null;G.chase=h;let n=0,inW=0,near=Infinity;for(;n<30*90&&G.mode==='world'&&G.lastTown!==h;n++){t.updateWorld(D);const a=t.MARCH_ARMIES.get(P);if(a)for(const u of a.units)if(!u.dead&&foot().some(r=>u.x>r.x&&u.x<r.x+r.w&&u.y>r.y&&u.y<r.y+r.h))inW++}
  {const a=t.MARCH_ARMIES.get(P);if(a)for(const u of a.units)if(!u.dead)near=Math.min(near,Math.hypot(u.x-h.x,u.y-h.y))}
  ok(G.lastTown===h&&!inW&&near<=60,'you sent at it from behind: round its walls ('+inW+' looks of a man in them), entering it at its gate after '+(n*D).toFixed(1)+' s (your nearest man '+near.toFixed(1)+' px from it)');
  Kit.world({encCool:1e9});h.lots=lots0;
  // (off: the picture's foot, nothing shut, reached at its lot)
  sw({holding:false});t.Router.holdings();c._ft=null;const lf=t.lotFooting(h,c),none=!t.SHUT||![...t.SHUT].some(v=>v&2);const r1=h.reachRadius();sw({holding:true});const r2=h.reachRadius();back();t.Router.holdings();
  ok(lf.length===1&&none&&r1>=r2,'holding off: its centre\'s picture\'s foot ('+lf.length+' rect), no tile shut ('+none+'), reached at its lot as before ('+r1.toFixed(0)+' px toward you, '+r2.toFixed(0)+' at its gate)')}
 // ======== a battle: a group round a wall of rock with two gaps, all through one
 Kit.begin('soldier',1);Kit.clear();Kit.world();
 {const L=t.BattleLab,K=t.TKIND;
  const lab=()=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:[{type:'hum_foot',count:24}],rightGroups:[{type:'hum_foot',count:4}],deploy:false,ai:false,paused:true,morale:false,seed:5,ground:{rocks:[{x:.42,y:.3,r:40}]}});t.B.obs=[];t.B.cmdT=1e9;return t.B};
  const place=(g,x,y)=>{g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})};
  const gaps=on=>{sw(on);const B=lab(),T=B.terrain,cc=T.C>>1,top=Math.ceil(t.fieldTop()/T.cs),bot=Math.floor(t.fieldBot()/T.cs),mid=Math.floor((top+bot)/2),ga=mid-6,gb=mid+6;
   for(let r=top;r<=bot;r++)if(Math.abs(r-ga)>1&&Math.abs(r-gb)>1){T.kind[r*T.C+cc]=K.rock;T.kind[r*T.C+cc+1]=K.rock}T.index();T.routes.build();
   const g=B.groups[t.playerGroups()[0]],foe=Object.values(B.groups).find(q=>q.foe),X=(cc+1)*T.cs;place(g,X-160,mid*T.cs);place(foe,40,t.fieldTop()+30);g.moveTo(X+160,(mid+.5)*T.cs);B.paused=false;
   const via=new Map();while(B.t<30&&t.B===B){t.updateBattle(1/60);for(const u of g.units)if(u.hp>0&&!via.has(u)&&u.x>X)via.set(u,Math.abs(u.y/T.cs-ga)<Math.abs(u.y/T.cs-gb)?'a':'b')}
   const n={a:0,b:0};for(const v of via.values())n[v]++;const home=g.units.filter(u=>u.hp>0&&Math.hypot(g.ax+(u.sx||0)-u.x,g.ay+(u.sy||0)-u.y)<16).length;const all=g.units.length;if(L.active)L.exit();G.mode='world';back();return{...n,home,all}};
  const on=gaps({}),old=gaps({corridor:false});info('a wall of rock with two gaps: now through a '+on.a+', b '+on.b+' ('+on.home+' of '+on.all+' in place); today a '+old.a+', b '+old.b+' ('+old.home+')');
  ok(Math.min(on.a,on.b)===0&&on.a+on.b===on.all&&on.home>=on.all*.9,'a group ordered past a wall of rock with two gaps: all through the one its way takes ('+on.a+' and '+on.b+'), formed beyond ('+on.home+' of '+on.all+')')}
 // ======== columns
 // (a lord marched man by man near you, bound for a holding near (no column) or far (a column: his trip far, TravelStyle far))
 const lordAt=farTrip=>{Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;const l=W.lords.find(q=>!q.dead&&q.troops.length>=10),own=t.TOWNS.filter(q=>q.owner===l.fac).sort((a,b)=>Math.hypot(b.x-P.x,b.y-P.y)-Math.hypot(a.x-P.x,a.y-P.y));
  l.x=P.x+60;l.y=P.y;l.inside=null;l.state='march';l.tgt=own[0].name;l.follow=l.with=null;Style.forget(l);t.MARCH_ARMIES.delete(l);const a=t.MarchArmy.of(l);return{l,a,far:own[0].name,near:t.townBy('Ashford').name}};
 const tick=(a,n=1)=>{for(let i=0;i<n;i++){t.WORLD_LOD.n++;a.step(D)}};
 {const flips=on=>{sw(on);const {l,a}=lordAt(true),b=t.asParty({kind:'bandits',ld:t.newChief('bandits',2),troops:Array(12).fill('militia'),x:l.x,y:l.y-400,cool:0,t:999,idle:true});t.bandits.push(b);tick(a,60);
   // (the edge: the nearest b is not seen at, straight ahead of the lord's side)
   let E=0;for(let k=400;k>0;k-=2){b.x=l.x;b.y=l.y-k;if(Style.threat(l)){E=k;break}}const start=Style.column(l),c0=t.TRAVEL_SEEN.get(l).sw;
   for(let i=0;i<300;i++){b.x=l.x;b.y=l.y-(E+(i%40<20?-6:6));tick(a);Style.column(l)}const n=t.TRAVEL_SEEN.get(l).sw-c0;t.bandits.length=0;back();return{start,n,E}};
  const now=flips({}),old=flips({steady:false});info('a band at a lord\'s column\'s alert edge ('+now.E+' px), in and out by 6 px each 2/3 s for 10 s: '+now.n+' switches; today '+old.n);
  ok(now.start&&now.E>0&&now.n<=1&&old.n>=4,'a lord\'s column with a foe hovering at its alert edge switches at most once in 10 s ('+now.n+'; today '+old.n+')')}
 {const give=on=>{sw(on);const {l,a}=lordAt(false);l.state='rest';Style.forget(l);tick(a,30);for(let i=0;i<600&&(a.col||Style.column(l));i++)tick(a);const col0=Style.column(l),C=TS.column,pl=C.place,st=t.MarchGround.prototype.straight;
   // (into a column that cannot form: none of its men may walk straight to his place, nor stand in it)
   C.place=-1;t.MarchGround.prototype.straight=()=>false;const sl=PA.slide;PA.slide=false;l.state='march';let gave=-1,again=-1,formed=-1;
   try{for(let i=0;i<30*16;i++){l.x+=.2;tick(a);const c=Style.column(l);if(formed<0&&a.col)formed=i;if(formed>=0&&gave<0&&!c)gave=i;if(gave>=0&&again<0&&c)again=i}}finally{C.place=pl;t.MarchGround.prototype.straight=st;PA.slide=sl}
   back();return{col0,gave:gave<0?-1:(gave-formed)*D,again:again<0?-1:(again-gave)*D}};
  const now=give({}),old=give({steady:false});info('a lord\'s column that cannot form: given up '+now.gave.toFixed(1)+' s after it began, a column tried again '+now.again.toFixed(1)+' s later; today given up '+(old.gave<0?'never':old.gave.toFixed(1)+' s'));
  ok(!now.col0&&now.gave>0&&now.again>=TS.retry-.2&&old.gave<0,'a column whose men cannot form gives up ('+now.gave.toFixed(1)+' s after it began), its formation for '+TS.retry+' s ('+now.again.toFixed(1)+' s) before it tries again; today it tries on')}
 // ---- yours by road: a short click along the road, a click behind, a foe near
 const {segs:S}=t.artRoadSegs();
 const stretch=len=>{for(let q=0;q<S.length;q+=5){const a=S[q],b=S[q+1],L=Math.hypot(S[q+2]-a,S[q+3]-b);if(L<4)continue;const hx=(S[q+2]-a)/L,hy=(S[q+3]-b)/L;
   for(let s=0;s<=L;s+=8){const x=a+hx*s,y=b+hy*s;if(t.TOWNS.some(q=>Math.hypot(q.x-x,q.y-y)<200))continue;let good=true;for(let k=-len;k<=len&&good;k+=4){const X=x+hx*k,Y=y+hy*k;if((t.RoadBand.at(X,Y)&63)<63||!t.passable(t.terrAt(X,Y)))good=false}
    if(good)return{x,y,hx,hy}}}return null};
 const Q=stretch(200);
 if(!Q)info('no straight road found');else{
  // (you on the road, By road on or off, a column marched 120 px along it and halted; a click d px on from your army's point (negative:
  // behind); each frame the distance to the goal, about faces, switches)
  const click=(d,road,on)=>{sw(on);Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;Kit.goTo(Q.x-Q.hx*150,Q.y-Q.hy*150);P.troops={hum_foot:20,hum_bow:10};P.comps={};P.bsta=100;delete P.army.march;
   t.setByRoad(road);Style.forget(P);t.MARCH_ARMIES.delete(P);const A=t.MarchArmy.of(P);A.face=A.heading=Math.atan2(Q.hy,Q.hx);A.trail.clear();A.sync();for(let i=0;i<60;i++)t.updateWorld(D);
   P.tx=Q.x;P.ty=Q.y;G.byRoad=null;for(let i=0;i<30*30&&P.tx!=null;i++)t.updateWorld(D);for(let i=0;i<60;i++)t.updateWorld(D);
   const gx=P.x+Q.hx*d,gy=P.y+Q.hy*d,col0=Style.column(P);P.tx=gx;P.ty=gy;G.byRoad=null;let worst=0,best=Math.hypot(gx-P.x,gy-P.y),turns=0,flips=0,was=A.turned,wc=Style.column(P),i=0;
   for(;i<30*40&&P.tx!=null;i++){t.updateWorld(D);const a=t.MARCH_ARMIES.get(P),dd=Math.hypot(gx-P.x,gy-P.y);if(dd<best)best=dd;worst=Math.max(worst,dd-best);if(a.turned!==was){turns++;was=a.turned}const cc=Style.column(P);if(cc!==wc){flips++;wc=cc}}
   back();t.setByRoad(false);return{t:i*D,worst,turns,flips,col0,col:wc,done:P.tx==null,end:Math.hypot(gx-P.x,gy-P.y)}};
  for(const d of [40,90]){const now=click(d,true,{}),old=click(d,true,{steady:false}),plain=click(d,false,{});
   info('a click '+d+' px along the road, By road on: now '+now.t.toFixed(1)+' s, the distance grew '+now.worst.toFixed(1)+' px at most, '+now.turns+' about faces, '+now.flips+' switches, a column '+now.col+'; today '+old.t.toFixed(1)+' s, grew '+old.worst.toFixed(1)+' px, '+old.turns+' about faces, a column '+old.col+'; By road off '+plain.t.toFixed(1)+' s');
   ok(now.done&&now.col0&&now.col&&!now.flips&&now.worst<=4&&!now.turns&&now.t<=plain.t*1.5+1.5,'a click '+d+' px along the road by road: a column all the way ('+now.flips+' switches), never farther from the goal ('+now.worst.toFixed(1)+' px), no about face, there in '+now.t.toFixed(1)+' s ('+plain.t.toFixed(1)+' plain, its file closing up after: 1.5 s more at most)')}
  {const bk=click(-120,true,{});info('a click 120 px behind: '+bk.t.toFixed(1)+' s, '+bk.turns+' about faces, '+bk.flips+' switches, '+bk.end.toFixed(1)+' px off at the end');
   ok(bk.done&&bk.turns===1&&!bk.flips,'a click behind your column: one clean about face ('+bk.turns+'), a column still ('+bk.flips+' switches), there in '+bk.t.toFixed(1)+' s')}
  // (a band walked up within alert of you: your column a column, your lanes your lanes)
  const foe=(road,on)=>{sw(on);Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;Kit.goTo(Q.x,Q.y);P.troops={hum_foot:20};P.comps={};delete P.army.march;t.setByRoad(road);Style.forget(P);t.MARCH_ARMIES.delete(P);
   for(let i=0;i<120;i++)t.updateWorld(D);const b=t.asParty({kind:'bandits',ld:t.newChief('bandits',2),troops:Array(12).fill('militia'),x:P.x-Q.hy*300,y:P.y+Q.hx*300,cool:0,t:999,idle:true});t.bandits.push(b);const c0=Style.column(P);let sw2=0,wc=c0;
   for(let i=0;i<200;i++){const k=Math.max(TS.alert*.5,300-i*2);b.x=P.x-Q.hy*k;b.y=P.y+Q.hx*k;b.cool=999;t.WORLD_LOD.n++;t.MarchArmy.of(P).step(D);const cc=Style.column(P);if(cc!==wc){sw2++;wc=cc}}
   t.bandits.length=0;back();t.setByRoad(false);return{c0,sw:sw2,col:wc}};
  const yr=foe(true,{}),yf=foe(false,{}),yo=foe(true,{yourChoice:false});
  ok(yr.c0&&yr.col&&!yr.sw&&!yf.c0&&!yf.col&&!yf.sw,'a band walked up within '+TS.alert+' px of you: By road on, your column stays a column ('+yr.sw+' switches); off, your lanes ('+yf.sw+')');
  ok(yo.c0&&!yo.col,'yourChoice off: your column forms up at it, as before')}
 {sw({});const {l,a}=lordAt(true);tick(a,30);const c0=Style.column(l),b=t.asParty({kind:'bandits',ld:t.newChief('bandits',2),troops:Array(12).fill('militia'),x:l.x,y:l.y-TS.alert*.5,cool:0,t:999,idle:true});t.bandits.push(b);
  tick(a,10);const c1=Style.column(l);t.bandits.length=0;ok(c0&&!c1,'a lord\'s column with a band near forms up, as before ('+c0+' then '+c1+')')}
 // ======== giving up: on the map
 {// (your army formed by a citadel, then sent 40 px on, some of its places on its walls; none snapped off them (MarchGround snap as it
  // is: places it cannot reach); the men moving each frame after it halted)
  const halt=on=>{sw(on);const S=scene({hum_foot:30},[[3,0,'centre']]),a=S.a,sn=t.MarchGround.prototype.snap;for(let i=0;i<90;i++)a.step(D);
   t.MarchGround.prototype.snap=function(p,r,s){return s&&s.add?{x:p.x,y:p.y}:sn.apply(this,arguments)};const moves=[];let still=-1,gave=0,settled=false;
   try{for(let i=0;i<30*20;i++){if(i<60)P.x+=.7;const was=a.units.map(u=>[u.x,u.y]);a.step(D);const m=a.units.filter((u,k)=>Math.hypot(u.x-was[k][0],u.y-was[k][1])>.02).length;if(i>=60){moves.push(m);if(m)still=-1;else if(still<0)still=i-60}}
    gave=a.units.filter(u=>u.gave).length;settled=t.marchArrived(P.x,P.y)}finally{t.MarchGround.prototype.snap=sn}
   const late=moves.slice(30*(2*M.formTry+2)).reduce((s,v)=>s+v,0),all=moves.reduce((s,v)=>s+v,0);
   // (a new order: 100 px back the way it came; all of them follow)
   let after=-1;for(let i=0;i<30*12;i++){if(i<150)P.x-=.7;a.step(D);if(i===30)after=a.units.filter(u=>u.gave).length}const far=Math.max(...a.units.map(u=>Math.hypot(u.x-P.x,u.y-P.y))),R=t.marchOuter(P);S.done();back();
   return{gave,settled,late,all,after,far,R,still:still*D}};
  const now=halt({}),old=halt({formGiveUp:false});
  info('halted with places on a citadel\'s walls: now '+now.gave+' men give up, all still from '+now.still.toFixed(1)+' s, '+Math.round(now.all/18*60)+' man-steps of re-forming a minute ('+now.late+' after '+(2*M.formTry+2)+' s); today '+Math.round(old.all/18*60)+' a minute ('+old.late+' after)');
  ok(now.gave>0&&!now.late&&now.settled,'halted, its men who cannot reach their places stop trying '+M.formTry+' s after they last came nearer and stand ('+now.gave+' of them; none moves after '+(2*M.formTry+2)+' s: '+now.late+'), the army settled (arrived: '+now.settled+')');
  ok(!now.after&&now.far<=now.R+8,'a new order: they all try again ('+now.after+' still given up), none left behind (the farthest '+now.far.toFixed(0)+' px from its point, its ring '+now.R.toFixed(0)+')');
  ok(old.late>0&&old.gave===0,'formGiveUp off: they try on, as before ('+old.late+' moves after '+(2*M.formTry+2)+' s)')}
 // ======== giving up: in battle (a group ordered to a line part across rock and a wood; its slots on the rock out of reach: slotWay none)
 {const L=t.BattleLab,K=t.TKIND;
  const bat=on=>{sw(on);if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:[{type:'hum_foot',count:20}],rightGroups:[{type:'hum_foot',count:4}],deploy:false,ai:false,paused:true,morale:false,seed:5,ground:{rocks:[{x:.42,y:.3,r:40}]}});t.B.obs=[];t.B.cmdT=1e9;const B=t.B,T=B.terrain;
   const g=B.groups[t.playerGroups()[0]],foe=Object.values(B.groups).find(q=>q.foe),cy=Math.floor((t.fieldTop()+t.fieldBot())/2/T.cs),cc=T.C>>1;
   for(let r=cy-2;r<=cy+12;r++)for(let k=cc+2;k<cc+8;k++)T.kind[r*T.C+k]=K.rock;for(let r=cy-8;r<cy-3;r++)for(let k=cc+2;k<cc+8;k++)T.kind[r*T.C+k]=K.wood;T.has.wood=true;T.index();T.routes.build();
   g.placeAt(cc*T.cs-120,cy*T.cs);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)});foe.placeAt(40,t.fieldTop()+30);t.layForm(foe.id);foe.units.forEach(u=>{u.x=foe.ax+(u.sx||0);u.y=foe.ay+(u.sy||0)});
   const sw0=window.slotWay;window.slotWay=()=>null;let late=0,all=0,inSlot=0,after=0,n=g.units.length;
   try{g.moveTo((cc+5)*T.cs,cy*T.cs);B.paused=false;const t1=B.t+M.formTry+17;while(B.t<t1+3&&t.B===B){const was=g.units.map(u=>[u.x,u.y]);t.updateBattle(1/60);const m=g.units.filter((u,k)=>Math.hypot(u.x-was[k][0],u.y-was[k][1])>.05).length;all+=m;if(B.t>t1)late+=m}
    inSlot=g.units.filter(u=>u.inSlot||u[t.FORM_SLOT]?.gave).length}finally{window.slotWay=sw0}
   if(t.B===B){g.moveTo(cc*T.cs-160,cy*T.cs);const t2=B.t+15;while(B.t<t2&&t.B===B)t.updateBattle(1/60);if(t.B===B)after=g.units.filter(u=>Math.hypot(g.ax+(u.sx||0)-u.x,g.ay+(u.sy||0)-u.y)<16).length}
   if(L.active)L.exit();G.mode='world';back();return{late,all,inSlot,after,n}};
  const now=bat({}),old=bat({formGiveUp:false});info('a group ordered to a line part on rock: now '+now.late+' moves in the last 3 s ('+now.all+' in all), '+now.inSlot+' of '+now.n+' counted in their slots, '+now.after+' formed after a new order; today '+old.late+' in the last 3 s');
  ok(!now.late&&now.inSlot===now.n,'in battle, a group whose slots lie on rock: after '+M.formTry+' s no man moves ('+now.late+'), the group formed ('+now.inSlot+' of '+now.n+')');
  ok(now.after===now.n,'a new order moves them all: formed at their new places ('+now.after+' of '+now.n+'), none left behind');
  ok(old.late>0,'formGiveUp off: they push on at the rock, as before ('+old.late+' moves in the last 3 s)')}
 // ======== each switch off: today
 {sw({corridor:false});const S=scene({hum_foot:30},[[8,-4,'centre']]),n0=t.MARCH_COR.n;for(let i=0;i<600;i++){P.x+=.4;S.a.step(D)}const made=t.MARCH_COR.n-n0,cor=S.a.cor;S.done();back();
  ok(!made&&!cor,'corridor off: no corridor made, its men down the old fields ('+made+')')}
 {sw({steady:false,yourChoice:false});const {l}=lordAt(true),r=Style.column(l)===Style.decide(l);back();ok(r,'steady and yourChoice off: a column as decide gives it, as before')}
 }finally{back();if(t.BattleLab.active)t.BattleLab.exit();G.mode='world'}
});
