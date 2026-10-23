'use strict';
// Not a test: scenes for screenshots of the straight ways and Follow (headless Chrome --screenshot at a window size), the land all
// seen. ?shot=around (a way round water or peaks by the router, straightened, its footprints) | before (the same with
// WAY_SMOOTH.on false: tile to tile) | road (By road on: the way keeps to the road) | follow (your band following a lord, the day
// bar's tag, the footprints to him)
window.RUN=()=>{
 const t=T,G=t.G,P=t.P,W=t.W,TL=t.TILE,q=new URLSearchParams(location.search),shot=q.get('shot')||'around';let now=1e7;
 window.requestAnimationFrame=()=>0;Math.random=t.seeded(77);performance.now=()=>now;
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;G.mode='world';G.modal=false;t.hidePanel();G.encCool=1e9;G.clock=t.DAY*.35;
 const clear=()=>{t.bandits.length=0;W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];W.fights=[];W.lords.forEach(l=>{l.x=-9999;l.y=-9999})};
 t.seenArr().fill(1);P.troops={hum_spear:6,hum_bow:4};P.fac=null;P.hostile={};
 const at=ms=>{now+=ms;t.frame()},show=()=>{for(let i=0;i<40;i++)at(30);t.updateHUD(true)};
 const open=(x,y)=>t.tAt(x,y)===t.T_OPEN;
 if(shot==='around'||shot==='before'){clear();t.WAY_SMOOTH.on=shot!=='before';
  // (a trip of 10-16 tiles across, 5-9 down, both ends on open ground, the straight line blocked, the router's way not far round)
  let pick=null;const R=t.seeded(5);for(let k=0;k<200000&&!pick;k++){const tx=8+Math.floor(R()*(t.MW-40)),ty=8+Math.floor(R()*(t.MH-30)),dx=10+Math.floor(R()*7),dy=5+Math.floor(R()*5);
   if(!open(tx,ty)||!open(tx+dx,ty+dy)||t.TOWNS.some(h=>Math.hypot(h.tx-tx,h.ty-ty)<12))continue;const x0=(tx+.5)*TL,y0=(ty+.5)*TL,x1=(tx+dx+.5)*TL,y1=(ty+dy+.5)*TL;
   if(t.clearLine(x0,y0,x1,y1))continue;const p=t.findPath(x0,y0,x1,y1);if(!p||p.length>Math.hypot(dx,dy)*1.25)continue;let n=0;for(const i of p)if(t.tiles[i]===t.T_OPEN)n++;if(n<p.length*.8)continue;pick=[x0,y0,x1,y1]}
  P.x=pick[0];P.y=pick[1];P.tx=pick[2];P.ty=pick[3];show()}
 else if(shot==='road'){clear();const r=W&&t.WM.roads.find(r=>r.kind==='road'&&r.path.length>40&&r.path.length<70);const a=t.wayCentre(r.path[4]),b=t.wayCentre(r.path[r.path.length-6]);
  P.byRoad=true;P.x=a[0]+20;P.y=a[1]+20;if(!t.passable(t.terrAt(P.x,P.y))){P.x=a[0];P.y=a[1]}P.tx=b[0];P.ty=b[1]+24;if(!t.passable(t.terrAt(P.tx,P.ty)))P.ty=b[1];G.byRoad=null;t.mapZoom(-1);show()}
 else if(shot==='follow'){clear();let L=null;
  for(const l of W.lords){if(L)break;const fs=t.TOWNS.filter(h=>h.owner===l.fac);for(const a of fs){if(L)break;for(const b of fs)if(a!==b&&Math.hypot(a.x-b.x,a.y-b.y)>50*TL&&t.Router.reach(a,b)){const s=t.gateSpot(a);Object.assign(l,{x:s.x,y:s.y,inside:null,fight:null,dead:false,state:'home',tgt:b.name,cool:0});L=l;break}}}
  P.x=L.x;P.y=L.y+48;t.followStart(L);for(let i=0;i<520;i++){t.updateWorld(.05);now+=16}show()}
};
