'use strict';
// The workers' way to work and back, the owner's KPI after play-test 3 ("make sure that you have bridges near holdings to connect to
// any estates that may spawn across lands"): on the world in use (today's map, or the classic seed with -Gen), the classic seed, Normal
// s1-s4 and the owner's saltwell world, each holding's day run near it (folk.js updateFolk, the clock on by each step, 2 days), every
// estate's workers out of their estate with the day's load at their hour (afternoon to dusk), to the holding's gate and back in.
// Each trip: none stranded (a worker who finds no way is put in at the gate or the door: never), back in by WAYS_BY of the day (before it
// ends: a delivery sets out as late as the end of dusk, and the laden walk is slow); and
// the land's shortest way between the gate and his door (8 ways over walkable ground, fords, bridges and ferries' landings, the
// terrain's pace aside: what water makes of it) at most WAYS_ROUND times the straight way and 3 tiles more. INFO per world: trips,
// the worst trip's time, his walk against the straight way (by the router, roads first), the latest back in, the estates' tracks
// (lots.js estTrack: the workers' way through the woods, router.js WAY.folk). The bandits, beasts, lords and fears sent away.
// Today's map's Fernhollow, across its lake, INFO (below). And on the generated worlds every holding that wants a lumber camp
// (Buildings init, its cap left out) and has a spot for one has one: a spot by the woods as lots.js asks (lotFits: free, on its own
// land, two trees by it at least; clear of the town's yard and the bandits; its door walked to, not far round, lotWalks) within 12
// tiles, or out to LOT_FAR[0] with its door at most LOT_FAR[1] steps from the gate (play-test 4: Redspire's, on Normal s1, its woods
// past 12 tiles on its own bank); those with woods near but no such spot, INFO.
const WAYS_BY=.95,WAYS_ROUND=2;
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,TL=t.TILE,step=.1,U=t.DAY/t.DAY_SECONDS;try{localStorage.clear()}catch(e){}
 // (the shortest way over walkable ground from tile a to tile b, 8 ways, no corner cut past water or a peak, and over ferries, within
 // 40 tiles: tiles)
 const landWay=(ax,ay,bx,by)=>{const MW=t.MW,fx=new Map();for(const c of t.WM.crossings)if(c.kind==='ferry'){fx.set(c.i,c.j);fx.set(c.j,c.i)}const R=40,n=2*R+1,D=new Float64Array(n*n).fill(Infinity),L=(x,y)=>(y-ay+R)*n+x-ax+R,q=[[0,ax,ay]];D[L(ax,ay)]=0;
  while(q.length){let k=0;for(let j=1;j<q.length;j++)if(q[j][0]<q[k][0])k=j;const [d,x,y]=q.splice(k,1)[0];if(x===bx&&y===by)return d;if(d>D[L(x,y)])continue;
   for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const nx=x+a,ny=y+b;if(!(a||b)||Math.abs(nx-ax)>R||Math.abs(ny-ay)>R||!t.passable(t.tAt(nx,ny))||a&&b&&(!t.passable(t.tAt(nx,y))||!t.passable(t.tAt(x,ny))))continue;
    const c=d+(a&&b?1.414:1);if(c<D[L(nx,ny)]){D[L(nx,ny)]=c;q.push([c,nx,ny])}}
   // (and over a ferry, sailed straight: its tiles)
   const f=fx.get(y*MW+x);if(f!=null){const nx=f%MW,ny=(f-nx)/MW,c=d+Math.hypot(nx-x,ny-y);if(Math.abs(nx-ax)<=R&&Math.abs(ny-ay)<=R&&c<D[L(nx,ny)]){D[L(nx,ny)]=c;q.push([c,nx,ny])}}}return Infinity};
 const worlds=[['the world in use',null],...(t.WORLD.gen?[]:[['classic seed',t.classicSettings()]]),...[1,2,3,4].map(k=>['Normal s'+k,{preset:'normal',seed:'s'+k}]),['saltwell',t.parseWorldCode('ASH1-X-2V40O9HH-saltwell')]];
 // (what each holding wants of its estates: Buildings init with no cap, then as it is)
 const B=(0,eval)('Buildings'),init0=B.prototype.init;B.prototype.init=function(){this.cap=()=>this.t.T.estMax;init0.call(this);const want={...this.t.bld};delete this.cap;init0.call(this);this.t._want=want};
 try{for(const [name,S] of worlds){
  const a0=performance.now();t.begin('soldier',S||undefined);G.quietEvents=true;P.fac=null;P.hostile={};
  const calm=()=>{t.bandits.length=0;W.monsters=[];W.lords.forEach(l=>{if(l.state==='siege')l.state='march';l.x=-999;l.y=-999});t.TOWNS.forEach(x=>{x.fear=0;x.lost={};delete x.mem})};
  let trips=0,worst=null,late=0,lateOf=new Set(),lateAt=0,round=null,onW=0,allW=0;const bad=[],stuck=[],far=[];
  // (the estates whose own track runs to them: their workers' steps on the way out and back, and those on a road or track)
  const MW0=t.MW,tracked=new Set();for(const r of t.WM.roads)if(r.est){const e=r.path[r.path.length-1],ex=e%MW0,ey=(e-ex)/MW0,z=t.townBy(r.est);for(const l of z.lots||[])if(t.ESTATES[l.k]&&[[l.x,l.y,l.n],...(l.plots||[]).map(([a,b])=>[a,b,1])].some(([a,b,n])=>ex>=a-1&&ex<=a+n&&ey>=b-1&&ey<=b+n))tracked.add(z.name+'|'+l.k)}
  for(const tw of t.TOWNS){if(!tw.bld||t.ruined(tw))continue;const sp=t.bldSpots(tw);if(!Object.keys(sp).some(k=>t.bldLv(tw,k)&&t.ESTATES[k].work))continue;
   for(let day=1;day<=2;day++){G.day=day;calm();t.hidePanel();G.mode='world';G.modal=false;W.folk=[];t.FOLK_SEEN.clear();P.x=tw.x;P.y=tw.y+30;G.clock=t.DAY*.3;
    const S2=new Map();
    for(let i=0;G.clock<t.DAY*WAYS_BY;i++){t.updateFolk(step);G.clock+=step*U;
     for(const f of W.folk){if(f.home!==tw.name)continue;let s=S2.get(f);if(!s){s={st:f.st,x:f.x,y:f.y};S2.set(f,s)}
      if(f.st==='out'||f.st==='back'){s.walk=(s.walk||0)+Math.hypot(f.x-s.x,f.y-s.y);if(tracked.has(tw.name+'|'+f.k)){const k=t.tiles[Math.floor(f.y/TL)*MW0+Math.floor(f.x/TL)];allW++;if(k===t.T_ROAD||k===t.T_FORD)onW++}}
      if(s.st!==f.st){const now=G.clock/t.DAY;
       if(s.st==='in'&&f.st==='out'){s.t0=now;s.walk=0;s.from={x:f.x,y:f.y}}
       if(s.st==='out'&&f.st==='town'){s.w1=s.walk;s.t1=now;if(Math.hypot(s.x-f.tx,s.y-f.ty)>TL)stuck.push(tw.name+' '+f.k+' on the way out')}
       if(s.st==='town'&&f.st==='back'){s.walk=0;s.t2=now}
       if(s.st==='back'&&f.st==='in'&&s.t0!=null){if(Math.hypot(s.x-f.tx,s.y-f.ty)>TL)stuck.push(tw.name+' '+f.k+' on the way back');
        const straight=Math.hypot(sp[f.k].x-tw.x,sp[f.k].y-tw.y),walk=(s.w1+s.walk)/2,time=(s.t1-s.t0)+(now-s.t2),r=walk/(straight+3*TL);trips++;
        if(!worst||time>worst.time)worst={time,who:tw.name+' '+f.k,walk,straight};if(!round||r>round.r)round={r,who:tw.name+' '+f.k,walk,straight};
        const gx=tw.tx,gy=tw.ty+1,dx=Math.floor(sp[f.k].x/TL),dy=Math.floor(sp[f.k].y/TL),lw=landWay(gx,gy,dx,dy),st=Math.hypot(dx-gx,dy-gy);if(!(lw<=WAYS_ROUND*st+3))far.push(tw.name+' '+f.k+' '+lw.toFixed(0)+' tiles for '+st.toFixed(0));lateAt=Math.max(lateAt,now);s.t0=null}
       s.st=f.st}
      s.x=f.x;s.y=f.y}}
    for(const f of W.folk)if(f.home===tw.name&&(f.st!=='in'||f.done!==day)){late++;lateOf.add(tw.name);if(bad.length<4)bad.push(tw.name+' '+f.k+' '+f.st)}}}
  const ms=performance.now()-a0;
  if(t.WM.gen!=='classic-0'){const [R0,S0]=t.LOT_FAR,miss=[],none=[];let n=0;
   for(const z of t.TOWNS){if(!(z._want&&z._want.lumber))continue;n++;if(t.bldLv(z,'lumber')&&t.lotAt(z,'lumber'))continue;
    const w=t.lotWalk(z).all,k=t.lotSize(t.ESTATE_LOT.lumber),wb=t.wallBox(z);let spot=null,wood=false;
    for(let y=z.ty-1-R0;y<=z.ty-1+R0&&!spot;y++)for(let x=z.tx-R0;x<=z.tx+R0&&!spot;x++){const d=Math.hypot(x+k/2-.5-z.tx,y+k/2-.5-(z.ty-1));if(d<3||d>R0)continue;
     if(t.tAt(x,y)===t.T_FOREST&&t.walkTo(z,x,y))wood=true;
     if(wb&&x+k>wb.x0-1&&x<=wb.x1+1&&y+k>wb.y0-1&&y<=wb.y1+1||!t.lotFits(z,x,y,k,'forest',true)||t.nearBandits(x+k/2-.5,y+k/2-.5,t.BANDIT_GAP+k/2)||!t.lotWalks(z,x,y,k)||d>12&&t.placeWalkSteps(w,x+(k>>1),y+k-1)>S0)continue;spot=[x,y]}
    if(spot)miss.push(z.name+' (a spot at '+spot.join(',')+')');else if(wood)none.push(z.name)}
   if(none.length)info(name+': lumber camps wanted with woods near but no spot for one (the woods in the town’s yard, on another’s land, too few trees together, far round or past '+S0+' steps, by bandits): '+none.join(', '));
   ok(!miss.length,name+': every holding that wants a lumber camp ('+n+') and has a spot for one has one'+(miss.length?': not '+miss.join(', '):''))}
  const est=t.WM.roads.filter(r=>r.est);
  if(t.WM.gen!=='classic-0')ok(allW&&onW/allW>=.6,name+': the workers of the estates with their own track keep to the roads and tracks: '+Math.round(100*onW/Math.max(1,allW))+'% of their steps out and back (60% or more)');
  info(name+': '+est.length+' estate tracks ('+est.reduce((a,r)=>a+r.path.length-1,0)+' tiles); '+trips+' trips in '+(ms/1000).toFixed(1)+' s; the longest '+(worst?(worst.time*24).toFixed(1)+' hours ('+worst.who+', '+(worst.walk/TL).toFixed(0)+' tiles each way, '+(worst.straight/TL).toFixed(0)+' straight)':'none')+'; the farthest round '+(round?round.r.toFixed(2)+' x ('+round.who+', '+(round.walk/TL).toFixed(0)+' tiles for '+(round.straight/TL).toFixed(0)+')':'none')+'; the last back in at '+(lateAt*24).toFixed(1)+' h');
  ok(trips>30&&!stuck.length,name+': every worker finds his way from his estate to the holding\'s gate and back ('+trips+' trips)'+(stuck.length?': not '+stuck.slice(0,4).join(', '):''));
  const lm=name+': all back in with the day\'s load delivered by '+(WAYS_BY*24).toFixed(1)+' h'+(late?' ('+late+' not: '+bad.join(', ')+')':'');
  // (today's map: Fernhollow's farm and pasture lie across its lake, as they always have: no spot near holds them, and taking one
  // away (or moving its harbours) changes what begin draws, so the battle fingerprints would move: left as it was, INFO, the owner's
  // call; the generated worlds bridge such water: worldplace.js placeHoldXing)
  const mine=t.WM.gen==='classic-0'&&!S,msg=name+': the land’s way from each gate to each door at most '+WAYS_ROUND+' times the straight way (and 3 tiles)'+(far.length?': '+[...new Set(far)].slice(0,4).join(', '):'');
  if(mine&&[...lateOf].every(x=>x==='Fernhollow'))info(lm+(late?' (today’s map: Fernhollow as it always was)':''));else ok(!late,lm);
  if(mine&&far.every(x=>/^Fernhollow /.test(x)))info(msg+(far.length?' (today’s map: Fernhollow as it always was)':''));else ok(!far.length,msg)}}finally{B.prototype.init=init0}
});
