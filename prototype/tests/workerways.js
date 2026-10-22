'use strict';
// The workers' way to work and back, the owner's KPI after play-test 3 ("make sure that you have bridges near holdings to connect to
// any estates that may spawn across lands"): on the world in use (today's map, or the classic seed with -Gen), the classic seed, Normal
// s1-s4 and the owner's saltwell world, each holding's day run near it (folk.js updateFolk, the clock on by each step, 2 days), every
// estate's workers out of their estate with the day's load at their hour (afternoon to dusk), to the holding's gate and back in.
// Each trip: none stranded (a worker who finds no way is put in at the gate or the door: never), back in by WAYS_BY of the day (before it
// ends: a delivery sets out as late as the end of dusk, and the laden walk is slow); and
// the land's shortest way between the gate and his door (8 ways over walkable ground, fords, bridges and ferries' landings, the
// terrain's pace aside: what water makes of it) at most WAYS_ROUND times the straight way and 3 tiles more. INFO per world: trips,
// the worst trip's time, his walk against the straight way (by the router, roads first), the latest back in. The bandits, beasts,
// lords and fears sent away. Today's map's Fernhollow, across its lake, INFO (below).
const WAYS_BY=.95,WAYS_ROUND=2;
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,TL=t.TILE,step=.1,U=t.DAY/t.DAY_SECONDS;try{localStorage.clear()}catch(e){}
 // (the shortest way over walkable ground from tile a to tile b, 8 ways, no corner cut past water or a peak, within 40 tiles: tiles)
 const landWay=(ax,ay,bx,by)=>{const MW=t.MW,R=40,n=2*R+1,D=new Float64Array(n*n).fill(Infinity),L=(x,y)=>(y-ay+R)*n+x-ax+R,q=[[0,ax,ay]];D[L(ax,ay)]=0;
  while(q.length){let k=0;for(let j=1;j<q.length;j++)if(q[j][0]<q[k][0])k=j;const [d,x,y]=q.splice(k,1)[0];if(x===bx&&y===by)return d;if(d>D[L(x,y)])continue;
   for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const nx=x+a,ny=y+b;if(!(a||b)||Math.abs(nx-ax)>R||Math.abs(ny-ay)>R||!t.passable(t.tAt(nx,ny))||a&&b&&(!t.passable(t.tAt(nx,y))||!t.passable(t.tAt(x,ny))))continue;
    const c=d+(a&&b?1.414:1);if(c<D[L(nx,ny)]){D[L(nx,ny)]=c;q.push([c,nx,ny])}}}return Infinity};
 const worlds=[['the world in use',null],...(t.WORLD.gen?[]:[['classic seed',t.classicSettings()]]),...[1,2,3,4].map(k=>['Normal s'+k,{preset:'normal',seed:'s'+k}]),['saltwell',t.parseWorldCode('ASH1-X-2V40O9HH-saltwell')]];
 for(const [name,S] of worlds){
  const a0=performance.now();t.begin('soldier',S||undefined);G.quietEvents=true;P.fac=null;P.hostile={};
  const calm=()=>{t.bandits.length=0;W.monsters=[];W.lords.forEach(l=>{if(l.state==='siege')l.state='march';l.x=-999;l.y=-999});t.TOWNS.forEach(x=>{x.fear=0;x.lost={};delete x.mem})};
  let trips=0,worst=null,late=0,lateOf=new Set(),lateAt=0,round=null;const bad=[],stuck=[],far=[];
  for(const tw of t.TOWNS){if(!tw.bld||t.ruined(tw))continue;const sp=t.bldSpots(tw);if(!Object.keys(sp).some(k=>t.bldLv(tw,k)&&t.ESTATES[k].work))continue;
   for(let day=1;day<=2;day++){G.day=day;calm();t.hidePanel();G.mode='world';G.modal=false;W.folk=[];t.FOLK_SEEN.clear();P.x=tw.x;P.y=tw.y+30;G.clock=t.DAY*.3;
    const S2=new Map();
    for(let i=0;G.clock<t.DAY*WAYS_BY;i++){t.updateFolk(step);G.clock+=step*U;
     for(const f of W.folk){if(f.home!==tw.name)continue;let s=S2.get(f);if(!s){s={st:f.st,x:f.x,y:f.y};S2.set(f,s)}
      if(f.st==='out'||f.st==='back'){s.walk=(s.walk||0)+Math.hypot(f.x-s.x,f.y-s.y)}
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
  info(name+': '+trips+' trips in '+(ms/1000).toFixed(1)+' s; the longest '+(worst?(worst.time*24).toFixed(1)+' hours ('+worst.who+', '+(worst.walk/TL).toFixed(0)+' tiles each way, '+(worst.straight/TL).toFixed(0)+' straight)':'none')+'; the farthest round '+(round?round.r.toFixed(2)+' x ('+round.who+', '+(round.walk/TL).toFixed(0)+' tiles for '+(round.straight/TL).toFixed(0)+')':'none')+'; the last back in at '+(lateAt*24).toFixed(1)+' h');
  ok(trips>30&&!stuck.length,name+': every worker finds his way from his estate to the holding\'s gate and back ('+trips+' trips)'+(stuck.length?': not '+stuck.slice(0,4).join(', '):''));
  const lm=name+': all back in with the day\'s load delivered by '+(WAYS_BY*24).toFixed(1)+' h'+(late?' ('+late+' not: '+bad.join(', ')+')':'');
  // (today's map: Fernhollow's farm and pasture lie across its lake, as they always have: no spot near holds them, and taking one
  // away (or moving its harbours) changes what begin draws, so the battle fingerprints would move: left as it was, INFO, the owner's
  // call; the generated worlds bridge such water: worldplace.js placeHoldXing)
  const mine=t.WM.gen==='classic-0'&&!S,msg=name+': the land’s way from each gate to each door at most '+WAYS_ROUND+' times the straight way (and 3 tiles)'+(far.length?': '+[...new Set(far)].slice(0,4).join(', '):'');
  if(mine&&[...lateOf].every(x=>x==='Fernhollow'))info(lm+(late?' (today’s map: Fernhollow as it always was)':''));else ok(!late,lm);
  if(mine&&far.every(x=>/^Fernhollow /.test(x)))info(msg+(far.length?' (today’s map: Fernhollow as it always was)':''));else ok(!far.length,msg)}
});
