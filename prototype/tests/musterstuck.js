'use strict';
// A world battle stuck "Forming up" (the owner, 2026-11-01: "I fought about 2 armies before and I won ... I upgraded [my hero], and
// once the lord approached me to attack then I press attack and the game froze"): his hero's new active skill in a slot, its slot
// text (combat.js HeroHands#updateBar, every [data-slot] on the page) written over the units' skill bar, whose next HUD tick threw
// (battlehud.js skillState) and stopped the game's loop. Now: the owner's sequence, through the game's own loop (main.js loop, the
// HUD with it), reaches ready; the muster ends at BATTLE_MUSTER.max s as it stands (the owner: "we only give forming up around 10
// seconds"), a man still on his way walking to his place once the battle runs, his formation's anchor held; a goal in a house or
// the water planned to the nearest standable spot; an army in column on the road by Millbrook's river forms up; G.modal left set
// with no window open never freezes it. No runtime errors.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,M=t.BATTLE_MUSTER;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:99});t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
 for(const k of ['TERRAIN','PHYSICS','EXITS','JOSTLE'])t[k].on=true;// (the field as in the game: its routes round the river and the houses)
 window.requestAnimationFrame=()=>0;let now=performance.now();const tick=()=>{now+=50;t.loop(now)};// (the game's loop: battle, HUD, skill bars, frame)
 const run=f=>{try{f();return null}catch(e){return e.message}};
 // (a road beside Millbrook, by its river: your army laid along it in column, By road)
 const H=t.TOWNS.find(h=>h.name==='Millbrook'),{segs:S}=t.artRoadSegs(),spots=[];
 for(let q=0;q<S.length;q+=5){const a=S[q],b=S[q+1],c=S[q+2],d=S[q+3],L=Math.hypot(c-a,d-b);if(!L)continue;for(let s=0;s<=L;s+=6){const x=a+(c-a)*s/L,y=b+(d-b)*s/L,r=Math.hypot(x-H.x,y-H.y);if(r>20&&r<60)spots.push({x,y,r,hx:(c-a)/L,hy:(d-b)/L})}}
 spots.sort((a,b)=>Math.abs(a.r-45)-Math.abs(b.r-45));const wet=Q=>{let n=0;for(let dy=-50;dy<=50;dy+=5)for(let dx=-50;dx<=50;dx+=5)if(t.tAt(Math.floor((Q.x+dx)/t.TILE),Math.floor((Q.y+dy)/t.TILE))===t.T_WATER)n++;return n};
 const road=spots[0];ok(road&&wet(road)>5,'Millbrook stands by a river, a road beside it ('+(road?wet(road):0)+' water samples round it)');
 const column=Q=>{Kit.world({encCool:99});Kit.goTo(Q.x,Q.y);t.setByRoad(true);t.TravelStyle.forget(P);t.MARCH_ARMIES.delete(P);const A=t.MarchArmy.of(P);A.face=A.heading=Math.atan2(Q.hy,Q.hx);A.trail.clear();A.sync();for(let i=0;i<200;i++){P.x+=Q.hx*.25;P.y+=Q.hy*.25;A.step(1/30)}return A};
 const lordAt=(dx,dy)=>{const L=W.lords.find(l=>!l.dead);Object.assign(L,{inside:null,fight:null,x:P.x+dx,y:P.y+dy,troops:[...Array(9).fill('hum_spear'),...Array(3).fill('hum_bow')],cool:0});t.MARCH_ARMIES.delete(L);t.MarchArmy.of(L).sync();return L};
 // (a muster run on the game's loop till it ends, or 30 s of frames)
 const muster=b=>{let err=null;for(let i=0;i<600&&b.muster?.active&&!err;i++)err=run(tick);return err};
 P.troops={hum_spear:5,hum_bow:4,hum_knight:1};P.comps={};
 // ---- the owner's sequence: two fights won, a level and an active skill learned, a lord's attack, the battle
 let errs=[];
 for(const n of [1,2]){const A=column(road);const band=t.asParty({kind:'bandits',troops:Array(5).fill('militia'),x:P.x+30,y:P.y+10,cool:0});t.bandits.push(band);
  t.startEncounter({kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[]});t.act('fight');const b=t.B;const e=muster(b);if(e)errs.push(e);
  t.beginFight();for(const u of b.units)if(u.team===1)u.hp=0;for(let i=0;i<300&&t.B===b;i++){const e=run(tick);if(e){errs.push(e);break}}if(G.mode!=='world')t.act('cont');Kit.done({world:{encCool:99}})}
 ok(!errs.length&&G.mode==='world','two fights won and back on the map'+(errs.length?': '+errs[0]:''));
 t.gainXp(450);t.openSkills('talents');for(let k=0;k<10&&P.tp>0;k++){const ids=Object.keys(t.TREE).filter(id=>t.canTakeOf(P,id)),id=ids.find(id=>t.TREE[id].m.unlock)||ids[0];if(!id)break;t.act('tree-take',id)}t.act('sk-close');t.act('char-close');
 const active=P.slots.filter(Boolean);ok(active.length&&G.mode==='world'&&!G.modal,'your hero levels up and learns an active skill, in a slot ('+active.join(', ')+'), the windows closed');
 column(road);const L=lordAt(40,20);t.startEncounter({kind:'lord',ref:L,list:L.troops.slice()});ok(G.mode==='dialog'&&/attacks/.test(Kit.text()),'a lord comes to attack you: his dialog');
 t.act('fight');let b=t.B,m=b?.muster;ok(m?.active&&G.mode==='battle'&&!G.modal,'Fight: a world battle, forming up ('+(m?m.entries.length:0)+' men)');
 {const err=muster(b);ok(!err&&!m.active&&b.ready&&b.paused&&m.time<=M.max+.11,'the owner\'s sequence reaches "Armies are in position" within '+M.max+' s, the game\'s loop running ('+m.time.toFixed(1)+' s, '+m.done+'/'+m.entries.length+' in place'+(err?'; '+err:'')+')')}
 {const bar=document.querySelector('#bbar .borders .skills'),before=[...bar.children].map(x=>x.innerHTML).join();b.hx?.updateBar();const after=[...bar.children].map(x=>x.innerHTML).join();
  const e=run(()=>{t.setOrderUI();for(let i=0;i<10;i++)tick()}),parts=[...bar.children].every(x=>x.querySelector('.acd'));
  ok(parts&&!e,'the units\' skill bar keeps its parts and the HUD its clock after the hero\'s slots are written'+(e?': '+e:''));
  ok(before===after,'the slot bar of your hero leaves the skill bar of the units alone (combat.js updateBar on #slotbar only)')}
 // ---- out of time: a man still on his way when BATTLE_MUSTER.max s pass; the battle ready as it stands, then he walks to his place
 const begin=dx=>{column(road);const band=t.asParty({kind:'bandits',troops:Array(5).fill('militia'),x:P.x+dx,y:P.y,cool:0});t.bandits.push(band);t.startEncounter({kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[]});t.act('fight');return t.B};
 b=begin(160);m=b.muster;
 {const e=m.entries.find(e=>e.u.team===0&&!e.u.hero&&!t.isChar(e.u)),u=e.u,g=e.g,a=b.world,gx=g.ax,gy=g.ay,s0=u.s,grid=b.terrain.route[t.routeWho(u.s)];
  // (him far from his place (on ground he can walk from, the farthest from the foe), as slow as can be: he cannot get there in time)
  const reach=t.routeFlood(grid,t.routeIx(grid,u.x,u.y)),foes=b.units.filter(v=>v.team===1);let far=null,keep=-1;
  for(let k=0;k<72;k++)for(const f of [.4,.65,.9]){const ang=k*Math.PI/36,p={x:a.cx+Math.cos(ang)*a.radius*f,y:a.cy+Math.sin(ang)*a.radius*f},i=t.routeIx(grid,p.x,p.y),foe=Math.min(...foes.map(v=>Math.hypot(v.x-p.x,v.y-p.y)));
   if(grid.cost[i]&&reach[i]&&Math.hypot(p.x-e.goal.x,p.y-e.goal.y)>260&&foe>keep){keep=foe;far=p}}
  u.x=far.x;u.y=far.y;u.s={...s0,spd:0};const dist=Math.hypot(u.x-e.goal.x,u.y-e.goal.y);
  let err=null,steps=0;for(;steps<400&&m.active&&!err;steps++)err=run(()=>t.updateBattle(.05));
  ok(!err&&!m.active&&Math.abs(m.time-M.max)<.06&&!e.done&&m.done<m.entries.length,'a man '+dist.toFixed(0)+' px from his place at '+M.max+' s: the muster ends then, as it stands ('+m.done+'/'+m.entries.length+' in place)');
  ok(b.ready&&b.paused&&!document.getElementById('bStart').disabled,'the battle is ready: Start Battle');
  ok(Math.hypot(u.x-far.x,u.y-far.y)<dist&&Math.hypot(u.x-e.goal.x,u.y-e.goal.y)>5,'no one teleported: he stands where his walk left him');
  u.s=s0;t.beginFight();const slot=()=>({x:g.ax+u.sx,y:g.ay+u.sy});let near=Infinity,i=0;
  for(;i<400&&!err&&t.B===b;i++){err=run(()=>t.updateBattle(.05));const q=slot();near=Math.hypot(u.x-q.x,u.y-q.y);if(near<6)break}
  ok(!err&&near<6,'once the battle runs he walks to his place in the formation ('+(i*.05).toFixed(1)+' s, '+near.toFixed(1)+' px off it)'+(err?': '+err:''));
  ok(Math.hypot(g.ax-gx,g.ay-gy)<.001&&g.order==='hold','his formation holds its anchor meanwhile')}
 // ---- a goal in a house's footprint or the water: planned to the nearest standable spot, never run at the wall
 b=begin(60);m=b.muster;
 {const e=m.entries.find(e=>e.u.team===0&&!e.u.hero),grid=b.terrain.route[t.routeWho(e.u.s)],i0=t.routeIx(grid,e.goal.x,e.goal.y),c0=i0%grid.C,r0=Math.floor(i0/grid.C);
  for(const g of Object.values(b.terrain.route)){for(let r=r0-2;r<=r0+2;r++)for(let c=c0-2;c<=c0+2;c++)if(r>=0&&c>=0&&r<g.R&&c<g.C)g.cost[r*g.C+c]=0;g.v++}
  const goal={...e.goal};m.plan(e);const at=t.routeIx(grid,e.goal.x,e.goal.y);
  ok(grid.cost[at]>0&&Math.hypot(e.goal.x-goal.x,e.goal.y-goal.y)<4*grid.cs&&Math.hypot(e.g.ax+e.u.sx-e.goal.x,e.g.ay+e.u.sy-e.goal.y)<.001,'a goal in a blocked footprint moves to the nearest standable spot ('+Math.hypot(e.goal.x-goal.x,e.goal.y-goal.y).toFixed(0)+' px), his place with it');
  const err=muster(b);ok(!err&&!m.active&&b.ready&&e.done,'and he forms up there')}
 // ---- a column on the road by the river, the lord from every side: everyone forms up within the time
 {let bad=[];for(const Q of spots.filter((_,i)=>i%Math.max(1,Math.floor(spots.length/3))===0).slice(0,3))for(const [dx,dy] of [[40,20],[-40,-25],[0,45]]){column(Q);const L=lordAt(dx,dy);t.startEncounter({kind:'lord',ref:L,list:L.troops.slice()});t.act('fight');const b=t.B,m=b.muster,err=muster(b);
   if(err||m.active||!b.ready||m.time>M.max+.11)bad.push((err||'')+' '+m.time.toFixed(1)+' s '+m.done+'/'+m.entries.length)}
  ok(!bad.length,'an army in column on the road by Millbrook\'s river forms up against a lord from every side, within '+M.max+' s'+(bad.length?': '+bad.join('; '):''))}
 // ---- G.modal left set with no window open never freezes the muster; a window really open holds it
 b=begin(60);m=b.muster;
 {const pos=()=>b.units.map(u=>u.x+','+u.y).join();t.hidePanel();G.modal=true;let p=pos();t.updateBattle(.05);const moved=pos()!==p;
  t.showPanel('<h2>A window</h2>');G.mode='battle';p=pos();const time=m.time;t.updateBattle(.05);const held=pos()===p&&m.time===time;t.hidePanel();
  ok(moved&&held,'G.modal with no window shown: the muster goes on; a window open: it waits');
  const err=muster(b);ok(!err&&!m.active&&b.ready,'and it ends ready')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR.slice(0,3).join(' | '):''));
});
