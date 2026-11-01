'use strict';
// The ambush by the woods (world/road.js roadLie; world/encounters.js the lure and the road's ambush, roadFight; the owner,
// 2026-11-01: "the ambush event such as fake wounded, should happen near wood and should make the spawn bandits not look like
// they are out of no where"): a lure comes only beside a road with woods behind him, never on open plain; his band lies hidden in
// those trees, never drawn; Scouting's warning is a rustle at their real spot (a glint too, at count); sprung, the battle on the
// map opens with them in the trees where they lay, coming out at you; called out, they stand at the tree line; left be, they
// slip away; the road's ambush keeps its band in the woods by it too
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE,L=t.ENC_TUNE.lure;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
 W.lords=[];W.patrols=[];W.monsters=[];W.caravans=[];t.bandits.length=0;G.clock=t.DAY*.3;P.troops={hum_levy:6};P.gold=500;P.sk.scout.lv=0;t.invAdd('good','grain',10);
 const R=()=>t.roadSt(),pickA=i=>t.act('enc-do',String(i)),world=()=>{Kit.world({road:null,chase:null,encCool:0});P.tx=null},logsSince=n=>G.msgs.slice(n).map(m=>m.m).join(' | ');
 const far=(tx,ty)=>t.TOWNS.every(z=>Math.hypot(z.tx-tx,z.ty-ty)>10);
 const find=f=>{for(let ty=12;ty<t.MH-12;ty++)for(let tx=12;tx<t.MW-12;tx++)if(f(tx,ty))return{tx,ty,x:(tx+.5)*TILE,y:(ty+.5)*TILE};return null};
 // (woods within r px of a point; the road tile nearest a point, its middle)
 const woodsBy=(x,y,r)=>{for(let j=-r;j<=r;j+=2)for(let i=-r;i<=r;i+=2)if(Math.hypot(i,j)<=r&&t.hiddenAt(x+i,y+j))return true;return false};
 const roadAt=(x,y)=>{let b=Infinity,r=null;const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++){if(t.tAt(tx+i,ty+j)!==t.T_ROAD)continue;const q=[(tx+i+.5)*TILE,(ty+j+.5)*TILE],d=Math.hypot(q[0]-x,q[1]-y);if(d<b){b=d;r=q}}return r};
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 // (a lure's spot, and a spot beside a road with no woods near)
 const home=find((tx,ty)=>far(tx,ty)&&t.ENC_ON.lure(tx,ty)),plain=find((tx,ty)=>far(tx,ty)&&t.roadBeside(tx,ty)&&!woodsBy((tx+.5)*TILE,(ty+.5)*TILE,L.woods+TILE));
 ok(!!home&&!!plain,'a spot beside a road with woods behind it ('+(home&&home.tx+','+home.ty)+') and one on open plain ('+(plain&&plain.tx+','+plain.ty)+')');if(!home||!plain)return;
 const lie0=t.roadLie(home.x,home.y);
 // (a lure at its spot, you d px from him toward the road)
 const lureAt=(d=12)=>{world();Kit.clear();const n=Math.hypot(home.x-lie0.x,home.y-lie0.y)||1;Kit.goTo(home.x+(home.x-lie0.x)/n*d,home.y+(home.y-lie0.y)/n*d);R().on=[];return t.roadSpawn('lure',home.x,home.y)};
 try{
  // ---- where: only by woods
  {let n=0,bad=0;for(let ty=home.ty-30;ty<=home.ty+30;ty++)for(let tx=home.tx-30;tx<=home.tx+30;tx++){if(!t.ENC_ON.lure(tx,ty))continue;n++;const x=(tx+.5)*TILE,y=(ty+.5)*TILE;if(t.hiddenAt(x,y)||!woodsBy(x,y,L.woods))bad++}
   ok(n>0&&!bad,'every tile a lure may come on (of '+n+' round the spot) lies out of the trees, with woods within '+L.woods+' px of it')}
  {const ps=[];let made=0,hid=0;for(let a=0;a<8&&ps.length<20;a++){const V=t.vis(),x=home.x+Math.cos(a*.785)*(V+80),y=home.y+Math.sin(a*.785)*(V+80);if(!t.passable(t.terrAt(x,y)))continue;Kit.goTo(x,y);
    const sd=t.seeded(77);for(let i=0;i<40;i++){const p=Kit.stubStream('road',sd,()=>t.roadSpot('lure'));if(p)ps.push(p)}}
   for(const [x,y] of ps){R().on=[];const e=t.roadSpawn('lure',x,y);if(e){made++;if(e.lie&&t.hiddenAt(e.lie[0],e.lie[1]))hid++}}
   ok(ps.length>0&&ps.every(([x,y])=>!t.hiddenAt(x,y)&&woodsBy(x,y,L.woods+TILE))&&made>0&&hid===made,'the road picks its spots by woods only ('+ps.length+' spots, '+made+' lures, each its band in the trees)')}
  {world();Kit.clear();Kit.goTo(plain.x+30,plain.y);R().on=[];ok(!t.ENC_ON.lure(plain.tx,plain.ty)&&!t.roadSpawn('lure',plain.x,plain.y)&&!R().on.length,'on open plain, no woods near: no lure there')}
  // (the weighted pick, the lure weighing all: from where you stand (at), n picks; how many lures, how many of them with no woods by them, how many of another kind)
  {const D=t.ROAD_ENC.lure,w0=D.w,picks=(at,n)=>{const r={lures:0,bad:0,other:0};for(let i=0;i<n;i++){world();Kit.clear();const p=at(i);Kit.goTo(p[0],p[1]);W.road=null;const e=Kit.stubStream('road',t.seeded(100+i),()=>t.roadPick());if(!e)continue;if(e.k==='lure'){r.lures++;if(!woodsBy(e.x,e.y,L.woods+TILE)||!e.lie)r.bad++}else r.other++}return r};
   D.w=1e6;let a,b;try{a=picks(i=>[plain.x+(i%4)*6,plain.y],8);b=picks(i=>{const V=t.vis();for(let k=0;k<8;k++){const q=(i+k)*.785,x=home.x+Math.cos(q)*(V+80),y=home.y+Math.sin(q)*(V+80);if(t.passable(t.terrAt(x,y)))return[x,y]}return[home.x,home.y]},8)}finally{D.w=w0}
   ok(!a.bad&&a.other>0&&!b.bad&&b.lures>0,'the weighted pick, the lure weighing all: from the open plain a lure only where there are woods ('+a.lures+'), else another kind ('+a.other+'); toward the woods, lures ('+b.lures+'), each by them')}
  // ---- its band: hidden in the trees behind him
  {const e=lureAt();ok(e&&e.lie&&e.edge&&t.hiddenAt(e.lie[0],e.lie[1])&&t.hiddenAt(e.edge[0],e.edge[1])&&dist(e.lie,[e.x,e.y])<=L.woods+L.hide+2&&dist(e.lie,roadAt(e.x,e.y))>dist([e.x,e.y],roadAt(e.x,e.y)),
     'its band lies hidden in the trees behind him, away from the road ('+Math.round(dist(e.lie,[e.x,e.y]))+' px from him, '+Math.round(dist(e.lie,e.edge))+' px past the tree line; the road by him '+Math.round(dist([e.x,e.y],roadAt(e.x,e.y)))+' px from him, '+Math.round(dist(e.lie,roadAt(e.x,e.y)))+' from them)');
   ok(e.dir===(e.lie[0]>e.x?-1:1),'he lies facing the road, the woods behind him');
   ok(t.ENC_SCENE.lay(e,false).every(p=>p.k==='down')&&!t.bandits.length,'not drawn while hidden: only the “wounded man” on the map, no band about');
   // ---- Scouting's warning: at their real spot
   const hint=lv=>{P.sk.scout.lv=lv;return t.ENC_SCENE.lay(e,false).filter(p=>p.k==='rustle')};
   const h2=hint(2),h3=hint(3),h5=hint(5);
   ok(!h2.length&&h3.length===1&&h3[0].x===e.lie[0]&&h3[0].y===e.lie[1]&&!h3[0].o.v&&h5.length===1&&h5[0].o.v===1,'warned (Scouting '+L.warn+'): the brush moves where they really lie; at '+L.count+' a glint of steel there too; below, nothing');
   {const ents=[];e.seen=1;e.draw(ents,G.cam,t.vis());let err=null;try{for(const x of ents)x.f()}catch(x){err=x}ok(ents.some(x=>x.top)&&!err,'the rustle is drawn over the trees ('+ents.length+' pieces)'+(err?': '+err.message:''))}
   ok(t.ENC_SCENE.pics(e).length===1,'his page’s banner shows only him');P.sk.scout.lv=0;
   // (saved and loaded: the spot kept)
   {const s=JSON.parse(JSON.stringify(e.save()));ok(dist(s.lie,e.lie)<1e-9&&dist(s.edge,e.edge)<1e-9,'saved with its band’s hiding place')}}
  // ---- sprung: the battle opens with them in the trees where they lay
  {P.sk.scout.lv=0;const e=lureAt(),bait=[e.x,e.y];t.roadMeet(e);pickA(0);const b=G.enc&&G.enc.ref;
   ok(G.enc?.btype?.kind==='ambush'&&b&&dist([b.x,b.y],e.lie)<1,'sprung: their band stands where it lay hidden, not beside him');
   t.act('fight');const B=t.B;
   if(!B||!B.world)ok(false,'a battle on the map');
   else{const foes=()=>B.units.filter(u=>u.team!==0&&u.hp>0&&!u.left),wp=u=>{const p=B.world.world(u);return[p.x,p.y]},hero=()=>wp(B.hero),mid=us=>{const ps=us.map(wp);return[ps.reduce((a,p)=>a+p[0],0)/ps.length,ps.reduce((a,p)=>a+p[1],0)/ps.length]};
    const f0=foes(),m0=mid(f0),inWood=f0.filter(u=>t.hiddenAt(...wp(u))).length,side=(m0[0]-bait[0])*(e.lie[0]-bait[0])+(m0[1]-bait[1])*(e.lie[1]-bait[1]),d0=dist(m0,hero());
    info('ambushers: '+f0.length+', in the trees '+inWood+', their middle '+Math.round(dist(m0,e.lie))+' px from where they lay, '+Math.round(d0)+' px from you');
    ok(f0.length&&inWood>=f0.length/2&&side>0&&dist(m0,e.lie)<=L.woods,'the battle opens with them in the trees on the woods’ side ('+inWood+' of '+f0.length+' in the trees), your army caught off guard');
    const first=new Map();for(const u of f0)if(t.seenBy(0,u))first.set(u,wp(u));
    for(let i=0;i<300&&!B.over&&first.size<f0.length;i++){t.updateBattle(.05);for(const u of foes())if(!first.has(u)&&t.seenBy(0,u))first.set(u,wp(u))}
    const seen=[...first.values()],fe=seen.length?Math.max(...seen.map(p=>dist(p,e.edge))):Infinity,m1=foes().length?mid(foes()):hero(),d1=dist(m1,hero());
    info('first seen: '+seen.length+' of '+f0.length+', each within '+Math.round(fe)+' px of the tree line; their middle '+Math.round(d0)+' → '+Math.round(d1)+' px from you');
    ok(seen.length&&fe<=L.woods,'they are first seen coming out of the trees, at the woods’ edge (within '+Math.round(fe)+' px of the tree line)');
    ok(d1<d0,'and come at you');
    B.over=true;B.win=true;B.endT=0;t.updateBattle(.01);Kit.done({cont:true,world:true})}}
  world();
  // ---- warned, called out: they stand at the tree line; the fight there
  {P.sk.scout.lv=L.warn;const e=lureAt();e.foes=e.foes.concat(['militia','militia']);t.roadMeet(e);Kit.stubStream('road',.999,()=>pickA(3));
   const out=t.ENC_SCENE.lay(e,false).filter(p=>p.k==='soldier');ok(e.out&&out.length===3&&out.every(p=>dist([p.x,p.y],e.edge)<=10)&&!t.ENC_SCENE.lay(e,false).some(p=>p.k==='rustle'),'called out: three of them show themselves at the tree line, the rustle gone');
   pickA(4);const b=G.enc&&G.enc.ref;ok(b&&!G.enc.btype&&dist([b.x,b.y],e.edge)<1,'Fight them: the fight begins with them at the tree line');world()}
  {P.sk.scout.lv=L.warn;const e=lureAt();t.roadMeet(e);pickA(2);const b=G.enc&&G.enc.ref;ok(b&&!G.enc.btype&&dist([b.x,b.y],e.lie)<1,'Approach ready: they break cover from where they lay');world();P.sk.scout.lv=0}
  // ---- left be: they slip away
  {const e=lureAt(),n0=G.msgs.length,b0=t.bandits.length;e.seen=1;const n=Math.hypot(e.x-e.lie[0],e.y-e.lie[1])||1,V=t.vis();Kit.goTo(e.x+(e.x-e.lie[0])/n*V*1.6,e.y+(e.y-e.lie[1])/n*V*1.6);
   for(let i=0;i<5&&!e.gone;i++)t.updateRoad(.05);
   ok(e.gone&&e.fin==='left'&&!R().on.some(x=>x.trace)&&t.bandits.length===b0&&/Word on the road/.test(logsSince(n0)),'left be: the band slips back into the woods and is gone (no band left on the map), and word gets round')}
  // ---- the road's ambush: its band in the woods by it, where the battle finds them
  {world();Kit.clear();Kit.goTo(home.x-10,home.y);R().on=[];const a=t.roadSpawn('ambush',home.x,home.y);
   ok(a&&a.lie&&t.hiddenAt(a.lie[0],a.lie[1]),'the road’s ambush: its band waits in the woods by it ('+(a&&a.lie?Math.round(dist(a.lie,[a.x,a.y])):'?')+' px off)');
   if(a){t.roadMeet(a);pickA(0);const b=G.enc&&G.enc.ref;ok(G.enc?.btype?.kind==='ambush'&&b&&dist([b.x,b.y],a.lie)<1,'sprung, the battle finds them there')}world()}
 }finally{world();P.sk.scout.lv=0;t.bandits.length=0}
 ok(!ERR.length,'no runtime errors');
});
