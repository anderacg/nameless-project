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
   const arc=b.units.filter(u=>u.team===1&&u.s.range),foot=b.units.filter(u=>u.team===1&&!u.s.range&&!u.leader&&!u.hero);
   ok(arc.length&&arc.every(u=>u.x>=w.x0&&u.x<w.x1)&&foot.every(u=>u.x>=w.x1),'their shooters on the wall-walk ('+arc.length+'), their foot behind it ('+foot.length+')');
   const p0=foot.map(u=>[u.x,u.y]);for(let i=0;i<60;i++)t.updateBattle(.05);
   ok(foot.every((u,i)=>Math.hypot(u.x-p0[i][0],u.y-p0[i][1])<24),'they hold their posts till roused');
   // (the ram: your foot at the gate; broken, a way through, every defender roused)
   const men=b.units.filter(u=>u.team===0&&!u.hero&&!u.s.range).slice(0,4);men.forEach((u,i)=>{u.x=w.x0-8;u.y=w.gy0+8+i*12});const hp0=w.hp;w.step(1);
   ok(w.hp<hp0&&Math.abs(hp0-w.hp-4*X.ram)<1e-6,'the ram: '+X.ram+' a second for each of your foot at the gate ('+Math.round(hp0)+' → '+Math.round(w.hp)+')');
   w.hp=1;w.step(1);const after=T2.routes.wayLen(g0,g1,'foot');
   ok(w.open&&T2.kind[mid(w.g0)+w.c0]===t.TKIND.open&&after<straight&&Object.values(b.groups).filter(g=>g.team===1).every(g=>g.roused),'broken: the gate a way through ('+Math.round(straight)+' → '+Math.round(after)+' px), every defender roused');
   done()}
  // ---- no ram yet: the gate holds
  {const b=assault(t.LADDER_DAYS),w=b.works;ok(w&&!w.ram,'before the ram is built ('+t.LADDER_DAYS+' days): ladders only');const men=b.units.filter(u=>u.team===0&&!u.hero&&!u.s.range).slice(0,4);men.forEach((u,i)=>{u.x=w.x0-8;u.y=w.gy0+8+i*12});const hp0=w.hp;w.step(2);ok(w.hp===hp0,'the gate holds');done()}
  // ---- a village (no walls), and the switch off: the open field
  {const v=t.TOWNS.find(z=>z.owner===h.owner&&!z.walled());if(v){Kit.world();Kit.goTo(v.x,v.y+60);G.bes=v;G.mode='besiege';t.startAssault(v,'raid');ok(B()&&!B().works,'a raid on '+v.name+' (no walls): the open field');done()}
   X.on=false;const b=assault(t.RAM_DAYS);ok(b&&!b.works,'off: the open field as before');done()}
 }finally{X.on=on0;t.FIELD_SIZES.on=fs0}
});
