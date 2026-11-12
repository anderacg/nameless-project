'use strict';
// A siege's walls on the field (battle/siegeworks.js; the owner, 2026-11-06: real siege walls, now): the assault on a walled
// holding is fought against its wall: a wall-walk raised by its walls, a sheer face outside climbed only by your ladders, stairs
// inside, towers, the gate shut till the ram breaks it (built by RAM_DAYS in camp); its shooters on the wall-walk, its foot
// behind the gate, holding their posts till roused; everyone on foot. A village's assault, a raid, and the switch off: the open
// field as before.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,X=t.SIEGE_WALL,on0=X.on,fs0=t.FIELD_SIZES.on,B=()=>t.B;
 try{
  X.on=true;t.FIELD_SIZES.on=true;Kit.begin('soldier',4);Kit.clear();Kit.world();{const r=t.partyRoster(P);r.add('archer',6);r.add('hum_levy',12)}
  const h=t.TOWNS.find(z=>z.owner&&z.walled()&&t.wallOf(z)>=2);t.Timed.of(P,'hostile').extend(h.owner,60);
  const assault=days=>{Kit.world();Kit.goTo(h.x,h.y+60);P.siege={town:h.name,days};G.bes=h;G.mode='besiege';t.startAssault(h,'siege');const b=B();if(b&&b.ready)t.beginFight();return b};
  const done=()=>{t.B=null;t.fieldDone();P.siege=null;Kit.world()};
  // ---- the wall
  {const b=assault(t.RAM_DAYS),w=b&&b.works,T2=b&&b.terrain;
   ok(!!w&&w.t===h&&w.L===X.lv[t.wallOf(h)],'an assault on '+h.name+' ('+t.WALL_N[t.wallOf(h)]+'): fought against its wall, its walk '+(w&&w.L)+' levels up');
   const C=T2.C,mid=r=>r*C,walk=[];for(let r=w.R0+1;r<w.R1;r++)if(!(r>=w.g0&&r<=w.g1)&&!w.isTower(r))walk.push(r);
   ok(walk.every(r=>T2.lvl[mid(r)+w.c0]===w.L)&&[...Array(w.g1-w.g0+1)].every((_,k)=>T2.kind[mid(w.g0+k)+w.c0]===t.TKIND.rock),'the walk raised its length; the gate shut (rock)');
   const rd=w.ladders[0],out={x:w.x0-40,y:(rd+.5)*w.cs},top={x:(w.x0+w.x1)/2,y:(rd+.5)*w.cs},yard={x:w.x1+80,y:(w.gy0+w.gy1)/2},noLad=walk.find(r=>!w.ladders.includes(r)&&!w.stairs.some(q=>Math.abs(q-r)<=2));
   ok(T2.routes.canReach(out,top,'foot')&&T2.routes.canReach(out,yard,'foot'),'up by a ladder, and down the stairs into the yard');
   ok(T2.wall[mid(noLad)+w.c0-1]&1&&T2.wall[mid(rd)+w.c0-1]===0,'the outer face sheer but at the ladders');
   const g0={x:w.x0-30,y:(w.gy0+w.gy1)/2},g1={x:w.x1+30,y:(w.gy0+w.gy1)/2},straight=T2.routes.wayLen(g0,g1,'foot');
   ok(b.units.every(u=>!u.s.mounted),'everyone on foot');
   {const H=w.houses.filter(q=>!q.out),c=H.find(q=>q.big),cell=q=>Math.floor((q.y+q.h/2)/cs0)*C+Math.floor((q.x+q.w/2)/cs0),cs0=w.cs,gy=(w.gy0+w.gy1)/2;
    ok(H.length>=6&&c&&H.every(q=>T2.built&&T2.built[cell(q)]===1&&q.x>=w.x1),'the town behind the wall: its '+(c&&c.type)+' and '+(H.length-1)+' houses of its own kinds ('+[...new Set(H.map(q=>q.type))].join(', ')+'), each standing where the way is barred');
    ok(c&&T2.routes.canReach({x:w.x1+30,y:gy},{x:c.x-10,y:c.y+c.h/2},'foot')&&b.ground.props.filter(p=>p.dk===5).length===H.length,'a street from the gate to it, each building drawn standing')}
   const arc=b.units.filter(u=>u.team===1&&u.s.range),foot=b.units.filter(u=>u.team===1&&!u.s.range&&!u.leader&&!u.hero);
   ok(arc.length&&arc.every(u=>u.x>=w.x0&&u.x<w.x1)&&foot.every(u=>u.x>=w.x1),'their shooters on the wall-walk ('+arc.length+'), their foot behind it ('+foot.length+')');
   const p0=foot.map(u=>[u.x,u.y]);for(let i=0;i<60;i++)t.updateBattle(.05);
   ok(foot.every((u,i)=>Math.hypot(u.x-p0[i][0],u.y-p0[i][1])<24),'they hold their posts till roused');
   // (the ram: your foot at the gate; broken, a way through, every defender roused)
   const men=b.units.filter(u=>u.team===0&&!u.hero&&!u.s.range).slice(0,4);men.forEach((u,i)=>{u.x=w.x0-8;u.y=w.gy0+8+i*12});const hp0=w.hp;w.step(1);
   ok(w.hp<hp0&&Math.abs(hp0-w.hp-4*X.ram)<1e-6,'the ram: '+X.ram+' a second for each of your foot at the gate ('+Math.round(hp0)+' → '+Math.round(w.hp)+')');
   w.hp=1;w.step(1);const after=T2.routes.wayLen(g0,g1,'foot');
   const dg=Object.values(b.groups).filter(g=>g.team===1&&t.grpUnits(g.id).some(u=>u.hp>0)),hold=dg.filter(g=>(g.role==='inf'||g.role==='cav')&&!g.roused),gy=(w.gy0+w.gy1)/2;
   ok(w.open&&T2.kind[mid(w.g0)+w.c0]===t.TKIND.open&&after<straight,'broken: the gate a way through ('+Math.round(straight)+' → '+Math.round(after)+' px)');
   ok(hold.length&&hold.every(g=>Math.abs(g.ax-(w.x1+X.hold))<2&&Math.abs(g.ay-gy)<2)&&dg.filter(g=>g.role!=='inf'&&g.role!=='cav'&&g.role!=='arc'&&g.role!=='mag').every(g=>g.roused),'its foot to hold it from inside ('+hold.length+' groups), the rest roused');
   {const a=b.units.find(u=>u.team===1&&u.x>=w.x0&&u.x<w.x1&&t.levelAt(u.x,u.y)>=w.L),sh={x:w.x0-80,y:a?a.y:0};ok(a&&w.cover(a,sh)===X.cover&&w.cover(a,{x:a.x+2,y:a.y})===1,'on the wall-walk, a shot from below does '+X.cover+' of its harm (its merlons); from the walk itself, all of it')}
   done()}
  // ---- siege engines (SIEGE_ENGINE): trebuchets from the camp's days, stones at the wall's sections, a section brought down
  {const E=t.SIEGE_ENGINE,n=d=>{P.siege={town:h.name,days:d};return t.siegeEngines(h)};
   ok(n(E.days-1)===0&&n(E.days)===1&&n(E.days+E.more)===2&&n(E.days+E.more*9)===E.most,'trebuchets by the siege\'s day: none before day '+E.days+', one more every '+E.more+', '+E.most+' at most');
   const b=assault(E.days+E.more),w=b.works,T2=b.terrain,cs=w.cs,C=T2.C;
   ok(w.engines.length===2&&w.engines.every(e=>e.hp>0&&e.x<w.x0-E.range+1)&&w.secs.length>4&&w.secs.some(q=>q.tower),'two trebuchets back from the wall, its stretches and towers each a section ('+w.secs.length+')');
   ok(t.wallOf(h)>=E.def.lv?!!w.mangonel&&w.towers.includes(w.mangonel.r):!w.mangonel,'the defenders\' mangonel on a tower behind walls of stone or better');
   const sec=w.secs.find(q=>!q.tower&&q.r1<w.g0-2),y=(sec.r0+sec.r1+1)/2*cs;ok(w.aimAt((w.x0+w.x1)/2,y)&&w.mark()===sec,'a click on a stretch of the wall: your engines\' mark');
   const h0=sec.hp;w.land({tx:(w.x0+w.x1)/2,ty:y,sec});ok(sec.hp<h0&&!sec.down,'a stone on it: its strength taken ('+Math.round(h0)+' → '+Math.round(sec.hp)+')');
   const out={x:w.x0-60,y},yard={x:w.x1+60,y},before=T2.routes.wayLen(out,yard,'foot'),on=b.units.find(u=>u.team===1&&u.x>=w.x0&&u.x<w.x1),hp1=on&&on.hp;if(on){on.x=(w.x0+w.x1)/2;on.y=y}
   sec.hp=1;w.land({tx:(w.x0+w.x1)/2,ty:y,sec});const after=T2.routes.wayLen(out,yard,'foot'),mid=Math.floor(y/cs)*C+w.c0;
   ok(sec.down&&T2.kind[mid]===t.TKIND.open&&T2.lvl[mid]<=E.rubble&&after<before,'brought down: a rubble slope, a way over it ('+Math.round(before)+' → '+Math.round(after)+' px)');
   ok(!on||on.hp<hp1,'its men fall with it, hurt');
   {b.auto=true;const Cm=t.Commander.of(0),N=Cm.groups(),at={x:w.x0-t.SIEGE_AI.foot,y:(sec.r0+sec.r1+1)/2*cs};Cm.siege(N);const sent=(N.inf||[]).filter(id=>{const g=b.groups[id];return Math.hypot(g.ax-at.x,g.ay-at.y)<6||g.hasTarget});
    ok(sent.length>0,'your captain sends his foot at the breach ('+sent.length+' of '+(N.inf||[]).length+' groups)')}
   if(w.mangonel){const e=w.engines[0],e0=e.hp;w.land({def:true,at:e,tx:e.x,ty:e.y});ok(e.hp<e0,'the mangonel\'s stone on a trebuchet: its strength taken');
    const tw=w.secs.find(q=>q.tower&&q.r0===w.mangonel.r),np=w.art.props.length;tw.hp=1;w.land({tx:w.x0,ty:(tw.r0+.5)*cs,sec:tw});ok(tw.down&&w.mangonel.lost&&w.art.props.length===np-1,'its tower brought down: the tower gone, the mangonel with it')}
   for(let i=0;i<40;i++)t.updateBattle(.25);ok(w.shots.length>0||w.engines.some(e=>e.shotT>0),'in the fight, the trebuchets loose their stones');
   done()}
  // ---- the fight at the wall (SIEGE_FIGHT): ladders thrown down and raised again, pitch on the ram's crew, your mantlets
  {const F=t.SIEGE_FIGHT,D=F.ladder,odds0=D.odds,b=assault(t.RAM_DAYS),w=b.works,T2=b.terrain,cs=w.cs,C=T2.C;
   try{D.odds=1;const l=w.lad[0],y=(l.r+.5)*cs,at=r=>r*C+w.c0-1,def=b.units.find(u=>u.team===1&&u.hp>0),me=b.units.find(u=>u.team===0&&!u.hero&&!u.s.range&&u.hp>0);
    for(const u of b.units)if(u!==def&&u!==me&&Math.abs(u.y-y)<D.reach+cs&&u.x>w.x0-D.foot-10&&u.x<w.x1){u.x=w.x1+120;u.y=y}
    def.x=w.x0+cs*.5;def.y=y;me.x=w.x0-6;me.y=y;const hp0=me.hp;
    ok(w.lad.length===w.ladders.length&&w.lad.every(q=>q.up)&&!(T2.wall[at(l.r)]&1),'the ladders up as the fight begins');
    w.ladderStep(D.look+.01);ok(!l.up&&T2.wall[at(l.r)]&1&&me.hp<hp0,'a defender at a ladder\'s top, none of yours up there: he throws it down, its face sheer, your man on it falling, hurt');
    def.x=w.x1+120;me.x=w.x0-D.foot*.5;me.y=y;w.ladderStep(D.raise*.5);ok(!l.up,'your foot at its foot raise it again: not at once');
    w.ladderStep(D.raise*.5+.01);ok(l.up&&!(T2.wall[at(l.r)]&1)&&T2.routes.canReach({x:w.x0-40,y},{x:(w.x0+w.x1)/2,y},'foot'),'after '+D.raise+' s: up, and a way up it again');
    const pic=w.art.ladPic(l);ok(pic&&pic.width===w.L*10+20,'drawn: its picture, rails and rungs from its foot to the parapet');
    {const P2=F.pitch,crew=b.units.filter(u=>u.team===0&&!u.hero&&!u.s.range&&u.hp>0).slice(0,3);crew.forEach((u,i)=>{u.x=w.x0-8;u.y=w.gy0+8+i*12});const h0=crew.map(u=>u.hp);
     w.ramT=b.t;w.pitchCool=.001;w.pitchStep(.01);ok(w.ram&&!w.open&&crew.every((u,i)=>u.hp<h0[i]),'the ram at work: pitch poured on its crew, every man of it hurt');
     const h1=crew.map(u=>u.hp);w.pitchStep(.01);ok(crew.every((u,i)=>u.hp===h1[i])&&w.pitchCool>=P2.every[0]-.02,'then not for '+P2.every[0]+'-'+P2.every[1]+' s')}
    {const M=F.mantlet,m=w.mantlets[0],u=me;ok(w.mantlets.length>=M.n[0]&&w.mantlets.length<=M.n[1]&&w.mantlets.every(q=>Math.abs(q.x-(w.x0-M.out))<=6&&Math.abs(q.y-(w.gy0+w.gy1)/2)>=M.gate-6),'your mantlets set out '+M.out+' px before the wall ('+w.mantlets.length+'), clear of the gate');
     u.x=m.x-8;u.y=m.y;const wall={x:w.x0+20,y:m.y},cv=w.cover(u,wall);u.x=m.x+6;const open=w.cover(u,wall);u.x=m.x-8;const back=w.cover(u,{x:u.x-60,y:u.y});
     ok(cv===M.cover&&open===1&&back===1,'behind one, a shot from the wall does '+M.cover+' of its harm; before it, or from behind, all of it')}
   }finally{D.odds=odds0}
   done()}
  // ---- the wall's height drawn, the castle's keep and court, the lord's standard taken (SIEGE_FIGHT.flag)
  {const F=t.SIEGE_FIGHT.flag,b=assault(t.RAM_DAYS),w=b.works,cs=w.cs,f=w.flag,kp=w.houses.find(q=>q.big);
   {const a=b.units.find(u=>u.team===1&&u.x>=w.x0&&u.x<w.x1&&t.levelAt(u.x,u.y)>=w.L),l=w.lad.find(q=>q.up),me=b.units.find(u=>u.team===0&&!u.hero&&u.hp>0),y=(l.r+.5)*cs;
    me.x=w.x0-w.run/2;me.y=y;w.liftStep();const half=me.z;me.x=w.x0-w.run-20;w.liftStep();const ground=me.z;
    ok(a&&a.z===w.z&&Math.abs(half-w.z/2)<1.5&&ground===0,'the men on the walk drawn up its height ('+w.z+' px), one half up a ladder half of it, on the ground none');
    const lp=w.art.leanPic(l,w.art.ladPic(l));ok(lp&&lp.height===w.art.ladPic(l).height+w.z,'a ladder drawn leaning from its foot up to the walk\'s height')}
   ok(kp&&kp.k===t.SIEGE_TOWN.kc&&kp.x>f.x+f.court&&f.x>w.x1,'the castle\'s keep, '+t.SIEGE_TOWN.kc+' times its model ('+kp.type+'), its standard in the court before it');
   ok(w.houses.every(q=>q.big||!(q.x<f.x+f.court&&q.x+q.w>f.x-f.court&&q.y<f.y+f.court&&q.y+q.h>f.y-f.court)),'the court kept clear of houses');
   ok(b.ground.props.some(p=>p.flag),'the standard standing in it');
   const theirs=b.units.filter(u=>u.team!==0&&u.hp>0),mine=b.units.filter(u=>u.team===0&&u.hp>0).slice(0,3);
   for(const u of theirs){if(Math.hypot(u.x-f.x,u.y-f.y)<F.r+10){u.x=w.x1+F.x+F.court+150;u.y=f.y+200}}mine.forEach((u,i)=>{u.x=f.x+i*6;u.y=f.y+4});
   w.flagStep(F.hold/2);ok(!f.taken&&Math.abs(f.prog-F.hold/2)<.01,'your men alone by it: its taking goes on');
   const d=theirs[0],dx=d.x,dy=d.y;mine.forEach(u=>{u.x=f.x-200});d.x=f.x;d.y=f.y;w.flagStep(1);ok(f.prog<F.hold/2&&f.prog>0,'theirs alone there: lost again, slowly');
   d.x=dx;d.y=dy;mine.forEach((u,i)=>{u.x=f.x+i*6;u.y=f.y+4});w.flagStep(F.hold);
   ok(f.taken&&theirs.filter(u=>u.hp>0).every(u=>u.rout||u.left)&&b.ground.props.filter(p=>p.flag).length===1,'held '+F.hold+' s: the standard taken, every defender breaking, your banner raised on it');
   ok(theirs.filter(u=>u.hp>0).every(u=>{const r=t.resolveOf(u);return !r||r.shattered}),'broken for good: none of them rallies (a review of the rules, 2026-11-11)');
   done()}
  {const b=assault(t.RAM_DAYS),w=b.works;b.auto=true;w.open=true;const Cm=t.Commander.of(0),N=Cm.groups(),id=(N.inf||[])[0],g=id&&b.groups[id];
   if(g){for(const u of t.grpUnits(id))if(u.hp>0){u.x=w.x1+40;u.y=w.flag.y+30}for(const u of b.units)if(u.team!==0&&u.hp>0){u.x=t.BW-30;u.y=w.flag.y+300}g.tgt=null;Cm.siege(N);
    ok(Math.hypot(g.ax-w.flag.x,g.ay-w.flag.y)<6||g.hasTarget,'your captain sends a group inside the wall to the standard')}
   done()}
  // ---- no ram yet: the gate holds
  {const b=assault(t.LADDER_DAYS),w=b.works;ok(w&&!w.ram,'before the ram is built ('+t.LADDER_DAYS+' days): ladders only');const men=b.units.filter(u=>u.team===0&&!u.hero&&!u.s.range).slice(0,4);men.forEach((u,i)=>{u.x=w.x0-8;u.y=w.gy0+8+i*12});const hp0=w.hp;w.step(2);ok(w.hp===hp0,'the gate holds');done()}
  // ---- a village (no walls), and the switch off: the open field
  {const v=t.TOWNS.find(z=>z.owner===h.owner&&!z.walled());if(v){Kit.world();Kit.goTo(v.x,v.y+60);G.bes=v;G.mode='besiege';t.startAssault(v,'raid');ok(B()&&!B().works,'a raid on '+v.name+' (no walls): the open field');done()}
   X.on=false;const b=assault(t.RAM_DAYS);ok(b&&!b.works,'off: the open field as before');done()}
 }finally{X.on=on0;t.FIELD_SIZES.on=fs0}
});
