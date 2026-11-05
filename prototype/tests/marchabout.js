'use strict';
// About face (world/march.js MARCH_MOVE.about, MarchArmy aboutColumn, reorder, loopStart; marchstyles.js MarchColumn turn, pass,
// MarchLoop; the owner, 2026-11-01: a column sent the other way "kind of chaos, it takes several seconds just to turn around"):
// every man turns where he stands, the tail the head. A column turned back, and a march formation sent right round: off the new way
// at once, no man walking more than the march, the tail leading. A formation's order chosen comes back after a long leg (none
// walking back) or at a halt; a column's only at a halt, by its countermarch (MARCH_MOVE.about.loop; the owner: "make them one line
// each and move around in circle to rotate between head and tail"): single file round an oval where it stands, none off it, none
// passing another, half a lap; none where there is no room; stopped when sent on. With the loop off, a column's order as before
// (a long leg, a halt walking back beside its file); with MARCH_MOVE.about off, as before that. Every army (a caravan). And
// Outriders on the map (march.js marchOutriders; data/kits.js MASTERY): an army's pace × its spd only while every group of it rides
// and has it (its pace through world.js travelMul and partySpeed, each times marchOutriders).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,AF=t.MARCH_MOVE.about,AL=AF.loop,TS=t.TRAVEL_STYLES,Style=t.TravelStyle,you=TS.kinds.you,on0=AF.on,loop0={...AL},D=1/30;
 function begin(troops,col){
  TS.kinds.you=col?'always':you;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
  const h=Kit.goHome('Ashford');Kit.goTo(...Kit.field(h));P.troops=troops;P.comps={};P.bsta=100;P.tx=null;delete P.army.march;delete P.army.column;t.setByRoad(false);
  const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-30;y<=ty+30;y++)for(let x=tx-50;x<=tx+50;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
  Style.forget(P);t.MARCH_ARMIES.delete(P);return t.MarchArmy.of(P)}
 const pace=()=>t.moveStep(t.marchPace(P),D);
 // (n moments of the march, the guide moved v px a moment along x (as the map moves you); each is given the army)
 const go=(a,v,n,each)=>{for(let i=0;i<n;i++){P.x+=v;a.step(D);if(each&&each(i)===false)break}};
 const front=(a,k,dir)=>a.units.filter(u=>!u.dead&&u.row!=='hero').sort((p,q)=>dir*(q.x-p.x)).slice(0,k);
 // (a march east, formed, then sent back west: s till its men's midst goes 4 px west, the spread of its men's moves in its first
 // second (each one's less the median: how far any walks off the march), whether it turned about the old way, its first 4 men west)
 const midst=a=>a.units.reduce((s,u)=>s+u.x,0)/a.units.length;
 function turn(troops,col){const a=begin(troops,col),v=pace();go(a,v,420);const formed=col?!!a.col&&!a.forming:!a.forming;
  const x0=midst(a),p0=P.x,at=a.units.map(u=>[u.x,u.y]);let off=-1,point=-1,old=false;
  go(a,-v,30,i=>{old||=a.about;if(off<0&&midst(a)<=x0-4)off=(i+1)*D;if(point<0&&P.x<=p0-4)point=(i+1)*D});
  const mv=a.units.map((u,i)=>[u.x-at[i][0],u.y-at[i][1]]),med=k=>mv.map(q=>q[k]).sort((p,q)=>p-q)[mv.length>>1],mx=med(0),my=med(1),spread=Math.max(...mv.map(q=>Math.hypot(q[0]-mx,q[1]-my)));
  go(a,-v,60,i=>{old||=a.about;if(off<0&&midst(a)<=x0-4)off=(i+31)*D});
  return{a,v,formed,off,point,spread,old,lead:front(a,4,-1),went:x0-midst(a)}}
 const kinds=us=>us.map(u=>u.type).join(' ');
 const troops={hum_foot:12,hum_bow:8};
 // (an army A halted: s till its loop starts (at most 4 s: its men come to their places), then on till it is over (at most most s),
 // its men followed round it: s it took (map time) and what half a lap at its pace takes (and half its ease); the most any stood off the oval (px from
 // its pieces near where he walks) once on it (within 1.5 px: one alone in his rank starts on its middle), s till all were;
 // whether any passed the man ahead of him (each one's px round it against the next's, as they stood at its start); after a second
 // more, the most any stands off his place; its turned, loop)
 function looped(A,most=30){let k=0;while(!A.loop&&k<120){A.step(D);k++}const L=A.loop;if(!L)return null;
  const n=L.px.length-1,du=L.du,T=A.targets(),ix=new Map(T.map((p,k)=>[p.row+':'+p.index,k])),men=A.units.filter(u=>!u.dead&&ix.has(u.row+':'+u.index));
  // (his nearest point round it within 24 px of c (px round it, followed): [px off, px round])
  const near=(u,c)=>{let best=Infinity,bu=c;for(let k=Math.floor((c-24)/du);k<=Math.ceil((c+24)/du);k++){const i=(k%n+n)%n,x0=L.px[i],y0=L.py[i],dx=L.px[i+1]-x0,dy=L.py[i+1]-y0,f=t.clamp(((u.x-x0)*dx+(u.y-y0)*dy)/(dx*dx+dy*dy||1),0,1),d=Math.hypot(x0+dx*f-u.x,y0+dy*f-u.y);if(d<best){best=d;bu=(k+f)*du}}return[best,bu]};
  const U=men.map(u=>near(u,L.u0[ix.get(u.row+':'+u.index)]+L.u)[1]),ord=men.map((u,i)=>i).sort((p,q)=>U[p]-U[q]);const on=men.map(()=>false);let off=0,join=0,crossed=false,s=0;
  for(;A.loop&&s<most/D;s++){A.step(D);if(!A.loop)break;men.forEach((u,i)=>{const [d,b]=near(u,U[i]);U[i]=b;if(!on[i]&&d<=1.5){on[i]=true;join=(s+1)*D}if(on[i])off=Math.max(off,d)});
   for(let j=0;j<ord.length;j++){const p=ord[j],q=ord[(j+1)%ord.length];if(U[q]+(j+1===ord.length?L.P:0)-U[p]<=0)crossed=true}}
  for(let i=0;i<30;i++)A.step(D);const W=new Map(A.targets().map(p=>[p.row+':'+p.index,p])),place=Math.max(...A.units.filter(u=>!u.dead).map(u=>{const p=W.get(u.row+':'+u.index);return p?Math.hypot(u.x-p.x,u.y-p.y):0}));
  return{wait:k*D,join:on.every(Boolean)?join:Infinity,s:(s+1)*D,half:L.half/(t.moveStep(t.marchPace(A.owner),D)*AL.pace)*D+AL.ease/2,off,crossed,place,men:men.length,turned:A.turned,loop:A.loop,len:L.L}}
 try{
  // ---- a column turned back: its file the other way where it stands, off at once, the bows (its tail) leading
  {AF.on=true;const r=turn(troops,true),a=r.a;
   info('a column turned back: its point off the new way in '+r.point.toFixed(2)+' s (map time), its men '+r.off.toFixed(2)+' s, their moves '+r.spread.toFixed(1)+' px off the march at most in the first second, leading: '+kinds(r.lead)+'; went '+r.went.toFixed(0)+' px in 3 s at '+(r.v/D).toFixed(1)+' px/s');
   ok(r.formed&&!r.old&&a.col&&a.turned&&r.point>=0&&r.point<=.25&&r.off>=0&&r.off<=.8,'a column turned back about-faces: no re-forming, off the new way at once ('+r.point.toFixed(2)+' s), its men as their bodies turn ('+r.off.toFixed(2)+' s)');
   ok(r.spread<=3,'no man walks more than the march ('+r.spread.toFixed(1)+' px off it at most)');
   ok(r.lead.every(u=>u.type==='hum_bow')&&r.went>=r.v/D*3*.8,'its tail leads (the bows), the army at its pace ('+r.went.toFixed(0)+' px in 3 s)');
   // (yours bound to a spot by its own file: as before)
   const b=begin(troops,true),v=pace();go(b,v,420);const head=b.gx;P.tx=head-20;P.ty=P.y;let old=false;go(b,-v,10,()=>{old||=b.about});P.tx=null;
   ok(old,'bound to a spot beside its own file (20 px behind its head): it turns as before, out of its column round its middle')}
  // ---- a march formation (your lanes) sent right round: its facing at once, the bows (its rear) leading
  {AF.on=true;const r=turn(troops,false),a=r.a;
   info('your lanes sent round: its point off the new way in '+r.point.toFixed(2)+' s, its men '+r.off.toFixed(2)+' s, their moves '+r.spread.toFixed(1)+' px off the march, leading: '+kinds(r.lead));
   ok(r.formed&&Math.cos(a.face)<-.99&&a.turned&&r.point>=0&&r.off>=0&&r.off<=.8,'a march formation sent round about-faces: its facing the new way at once, its men off as their bodies turn ('+r.off.toFixed(2)+' s; its point, their middle, '+r.point.toFixed(2)+' s)');
   ok(r.spread<=6,'each man keeps his spot where he stands ('+r.spread.toFixed(1)+' px off the march at most in the first second)');
   ok(r.lead.every(u=>u.type==='hum_bow'),'its rear leads (the bows)')}
  // ---- the loop on: a column's order not back on a long leg (none pulled out of its file on the march)
  {AF.on=AL.on=true;const r=turn(troops,true),a=r.a;let back=false;go(a,-r.v,240,()=>{back||=!a.turned||!!a.reorder||!!a.loop});
   ok(!back&&a.turned&&front(a,4,-1).every(u=>u.type==='hum_bow'),'the loop on, a column on a long leg ('+(r.v*330).toFixed(0)+' px) keeps its order the other way round: none out of its file, the bows still leading')}
  // ---- the loop: halted, a column turned back walks an oval in single file, half a lap, and stands in its chosen order
  {AF.on=AL.on=true;const a=begin(troops,true),v=pace();go(a,v,420);go(a,-v,60);const was=a.turned,r=looped(a),lead=front(a,4,-1);
   info('the loop ('+r.men+' men, the column '+r.len.toFixed(0)+' px): begun '+r.wait.toFixed(2)+' s into the halt, all on it in '+r.join.toFixed(2)+' s; '+r.s.toFixed(2)+' s (half a lap at its pace, its ease in: '+r.half.toFixed(2)+' s); the most any man stood off the oval '+r.off.toFixed(2)+' px; after, the most off his place '+r.place.toFixed(2)+' px; leading: '+kinds(lead));
   ok(was&&r&&!r.turned&&!r.loop&&lead.every(u=>u.type==='hum_foot'),'halted, a column turned back loops and stands in its chosen order, the foot leading again, facing the way it went');
   ok(r.join<=1&&r.off<=3&&!r.crossed,'single file round the oval: all on it in '+r.join.toFixed(2)+' s, none more than '+r.off.toFixed(2)+' px off it since (3 at most: half a body), none passing the man ahead of him');
   ok(Math.abs(r.s-r.half)<=.5&&r.place<=1.5,'about half a lap at its pace ('+r.s.toFixed(2)+' s for '+r.half.toFixed(2)+' s), then each man in his place ('+r.place.toFixed(2)+' px at most)')}
  // ---- its time by size (foot; and riders with foot, its pace held to what its riders turn at round its ends)
  {AF.on=AL.on=true;const out=[];for(const [n,troops] of [['20 men',{hum_foot:20}],['50 men',{hum_foot:50}],['80 men',{hum_foot:80}],['20 riders, 20 foot',{hum_knight:20,hum_foot:20}]]){const a=begin(troops,true),v=pace();go(a,v,600);go(a,-v,60);const r=looped(a,40);out.push(n+': '+r.s.toFixed(1)+' s (the column '+r.len.toFixed(0)+' px, begun '+r.wait.toFixed(1)+' s into the halt, off '+r.off.toFixed(1)+' px'+(r.crossed?', crossed':'')+')');
    ok(r&&!r.turned&&!r.crossed&&r.join<=1&&r.off<=3&&r.place<=1.5,n+': the loop in '+r.s.toFixed(1)+' s of map time, none off it, none passing another, each in his place after')}
   info('the loop\'s time: '+out.join('; '))}
  // ---- no room (a causeway: water a px or two past its lanes): its order kept the other way round; tried again at its next halt
  {AF.on=AL.on=true;begin(troops,true);const ty=Math.floor(P.y/t.TILE);P.y=ty*t.TILE+5;t.MARCH_ARMIES.delete(P);const a=t.MarchArmy.of(P),v=pace(),x0=Math.floor(P.x/t.TILE),wet=k=>{for(let x=x0-50;x<=x0+50;x++)for(const y of [ty-1,ty+1])t.WM.kind[y*t.MW+x]=k;a.ground=null};
   wet(t.T_WATER);go(a,v,420);go(a,-v,60);for(let i=0;i<60;i++)a.step(D);const kept=a.turned&&!a.loop&&a.loopNo,lead=front(a,4,-1);
   wet(t.T_OPEN);go(a,-v,30);const r=looped(a);
   ok(kept&&lead.every(u=>u.type==='hum_bow'),'no room (water 1 px past its lanes): no loop, its order kept the other way round (the bows leading)');
   ok(r&&!r.turned&&front(a,4,-1).every(u=>u.type==='hum_foot'),'the water gone, at its next halt it loops, the foot leading again')}
  // ---- a new order mid-loop: the loop stops at once, it marches off as it stands (still turned); a new loop at its next halt
  {AF.on=AL.on=true;const a=begin(troops,true),v=pace();go(a,v,420);go(a,-v,60);let k=0;while(!a.loop&&k++<60)a.step(D);for(let i=0;i<30;i++)a.step(D);const mid=!!a.loop;
   const x0=P.x;go(a,-v,1);const stopped=!a.loop&&a.turned;go(a,-v,89);const went=x0-P.x,r=looped(a);
   ok(mid&&stopped,'sent on mid-loop: the loop stops at once, its order still the other way round');
   ok(went>=v*90*.95&&r&&!r.turned&&!r.crossed&&front(a,4,-1).every(u=>u.type==='hum_foot'),'it marches off ('+went.toFixed(0)+' px in 3 s), then loops at its next halt into its chosen order')}
  // ---- the loop off: a column's order back as before, after a long leg (none walking back) or at a halt (beside the file)
  {AF.on=true;AL.on=false;const r=turn(troops,true),a=r.a,v=r.v;let started=false,n=0,back=0;const low=new Map();
   go(a,-v,1500,()=>{if(a.reorder)started=true;if(started){n++;for(const u of a.units){const m=Math.min(low.get(u)??u.x,u.x);low.set(u,m);back=Math.max(back,-(m-u.x))}}if(started&&!a.reorder)return false});
   const lead=front(a,4,-1);
   info('the loop off, a long leg: its order back over '+(n*D).toFixed(1)+' s, the most any man walked back '+back.toFixed(2)+' px; leading: '+kinds(lead));
   ok(started&&!a.reorder&&!a.turned&&!a.loop&&n*D<AF.most/2,'the loop off: after '+AF.leg+' px the new way its order comes back ('+(n*D).toFixed(1)+' s)');
   ok(back<=2.5,'none walks back through the file: the most any man went back '+back.toFixed(2)+' px (a jostle)');
   ok(lead.every(u=>u.type==='hum_foot'),'the foot at its head again')}
  {AF.on=true;AL.on=false;const a=begin(troops,true),v=pace();go(a,v,420);go(a,-v,60);const turned=a.turned,y0=a.gy;
   // (each man's px walked back (east) in the file, and beside it)
   let n=0;const was=new Map(a.units.map(u=>[u,u.x])),inF=new Map(),outF=new Map();
   for(let i=0;i<1500;i++){a.step(D);if(!a.reorder&&n)break;if(!a.reorder){for(const u of a.units)was.set(u,u.x);continue}n++;for(const u of a.units){const e=u.x-was.get(u);if(e>0){const m=Math.abs(u.y-y0)<6?inF:outF;m.set(u,(m.get(u)||0)+e)}was.set(u,u.x)}}
   const lead=front(a,4,-1),most=Math.max(0,...inF.values()),beside=Math.max(0,...outF.values());
   info('the loop off, a halt: its order back over '+(n*D).toFixed(1)+' s; walked back beside the file up to '+beside.toFixed(0)+' px, in it '+most.toFixed(1)+' px at most; leading: '+kinds(lead));
   ok(turned&&!a.turned&&!a.reorder&&!a.loop&&n*D<AF.most/2&&beside>20&&most<=AF.pass,'the loop off, halted, its order comes back: those walking back go down beside the file ('+beside.toFixed(0)+' px), none through it ('+most.toFixed(1)+' px at most in it: his last step in, '+AF.pass+' px at most)');
   ok(lead.every(u=>u.type==='hum_foot'),'the foot at its head again')}
  // ---- your lanes' order back after a long leg: the foot ahead again, none walking back (the bows stand till it comes past them)
  {AF.on=AL.on=true;const r=turn(troops,false),a=r.a,v=r.v;let started=false,n=0,back=0;const low=new Map();
   go(a,-v,1500,()=>{if(a.reorder)started=true;if(started){n++;for(const u of a.units){const m=Math.min(low.get(u)??u.x,u.x);low.set(u,m);back=Math.max(back,u.x-m)}}if(started&&!a.reorder)return false});
   go(a,-v,150);const lead=front(a,4,-1),body=t.marchBodyOf('hum_bow')*t.WORLD_BATTLE.sprite/t.WORLD_BATTLE.scale;
   info('your lanes, a long leg: their order back over '+(n*D).toFixed(1)+' s, the most any man walked back '+back.toFixed(2)+' px; leading: '+kinds(lead));
   ok(started&&!a.reorder&&!a.turned&&n*D<AF.most/2&&Math.cos(a.face)<-.99&&back<body*.6&&lead.every(u=>u.type==='hum_foot'),'your lanes after '+AF.leg+' px (the loop is a column\'s only): their order back ('+(n*D).toFixed(1)+' s), the bows aside past its flanks till it comes by, the foot ahead, none walking back ('+back.toFixed(2)+' px at most: a jostle, under a body)')}
  // ---- off: as before (out of its column, round its middle, a creep)
  {AF.on=false;const r=turn(troops,true),f=turn(troops,false);
   info('off: a column off the new way '+r.off.toFixed(2)+' s, its lanes '+f.off.toFixed(2)+' s; its men '+r.spread.toFixed(1)+' px off the march, its lanes\' '+f.spread.toFixed(1));
   ok(r.old&&!r.a.turned&&(r.off<0||r.off>1)&&r.spread>6,'MARCH_MOVE.about off: a column turned back re-forms round its middle, its guide creeping ('+(r.off<0?'not 4 px in 3 s':r.off.toFixed(2)+' s')+')');
   ok(!f.a.turned&&Math.cos(f.a.face)>-.99&&f.spread>8,'and a march formation wheels, its far side sweeping round ('+f.spread.toFixed(1)+' px off the march)')}
  // ---- every army: a caravan (always a column) turned back, then halted: its loop round its wagon, its first guard first again
  {AF.on=AL.on=true;begin({hum_foot:4},false);const W=t.W,tw=t.TOWNS.filter(h=>h.owner&&h.owner!=='player'),c=t.asParty({cv:true,fac:tw[0].owner,from:tw[0].name,to:tw[1].name,x:P.x+200,y:P.y,goods:{grain:5},guards:8,cool:0,dir:1});W.caravans.push(c);Style.forget(c);
   const A=t.MarchArmy.of(c),v=t.moveStep(t.marchPace(c),D);let old=false;for(let i=0;i<420;i++){c.x+=v;A.step(D)}const x0=c.x,lead0=A.units.reduce((p,u)=>u.x>p.x?u:p);
   for(let i=0;i<30;i++){c.dir=-1;c.x-=v;A.step(D);old||=A.about}const lead=A.units.reduce((p,u)=>u.x<p.x?u:p);
   ok(!!t.marchLayout(c).column&&!old&&A.turned&&x0-c.x>=v*30*.6&&lead!==lead0,'a caravan turned back about-faces too (off '+(x0-c.x).toFixed(0)+' px in a second, its last guard now first)');
   const r=looped(A),x1=Math.min(...A.units.map(u=>u.x)),first=lead0.x<=x1+2;
   info('a caravan\'s loop ('+(r?r.men:0)+' men round its wagon): '+(r?r.s.toFixed(2)+' s, all on it in '+r.join.toFixed(2)+' s'+(r.crossed?', crossed':'')+(first?'':', another first')+', off it '+r.off.toFixed(2)+' px at most, after off his place '+r.place.toFixed(2)+' px':'none'));
   ok(r&&!r.turned&&!r.crossed&&r.join<=1&&r.off<=3&&r.place<=1.5&&first,'halted, a caravan loops round its wagon too, none off the oval or passing another: its first guard in its first rank again');W.caravans.length=0}
  // ---- Outriders on the map
  {AF.on=on0;begin({hum_knight:6},false);const g=t.partyRoster(P).groups[0],mount=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].slot==='mount');P.gear.mount=mount;
   const spd=t.MASTERY.outriders.spd,base=t.travelMul();g.picks=['outriders'];const has=t.marchOutriders(P),up=t.travelMul();
   P.gear.mount=null;const walking=t.marchOutriders(P);P.gear.mount=mount;
   P.troops={hum_knight:6,hum_foot:4};const fg=t.partyRoster(P).groups;for(const x of fg)if(x.type==='hum_knight')x.picks=['outriders'];const foot=t.marchOutriders(P);
   P.troops={hum_knight:6};t.partyRoster(P).groups.forEach(x=>x.picks=[]);const none=t.marchOutriders(P);
   info('Outriders: your riders '+base.toFixed(3)+', with it '+up.toFixed(3)+' (×'+(up/base).toFixed(3)+')');
   ok(has===spd&&Math.abs(up/base-spd)<1e-6,'every group mounted with Outriders, your hero riding: the army\'s map pace ×'+spd+' ('+(up/base).toFixed(3)+')');
   ok(walking===1&&foot===1&&none===1,'not with your hero on foot, a group on foot, or riders without it: its slowest set the pace');
   const L=t.W.lords[0],keep={troops:L.troops,army:L.army};try{L.troops=Array(6).fill('hum_knight');delete L.army;const bare=t.marchOutriders(L),made=!!L.army;
    const lg=t.partyRoster(L).groups;const b0=t.partySpeed(L,L.troops);lg.forEach(x=>x.picks=['outriders']);const b1=t.partySpeed(L,L.troops);
    ok(bare===1&&!made,'a lord\'s army with no roster made: none (and none made)');
    ok(Math.abs(b1/b0-spd)<1e-6,'a lord\'s riders, each group with Outriders: his pace ×'+spd+' ('+(b1/b0).toFixed(3)+')')}finally{L.troops=keep.troops;L.army=keep.army}
   P.gear.mount=null}
 }finally{AF.on=on0;Object.assign(AL,loop0);TS.kinds.you=you}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
