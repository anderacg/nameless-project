'use strict';
// Cavalry in hard places (commander.js CavalryRide): a moving mark, a crowded field, spears, woods, a river, hills and the world
// battle's edge. In each the riders keep riding (a plan most of the time, none dropped half way), charge only from a run-up (but
// when cornered or met by riders as fast: forced), are
// not caught standing (stuck: on a leg but not moving, out of reach of any foe) and do not swing back and forth (flips: a run-in
// given up within 2 s of starting it; reversals: their way turned round, over 140°, between two half-second looks).
Kit.suite(({ok,info})=>{
 const LS=+(new URLSearchParams(location.search).get('ls')||7),t=T,L=t.BattleLab,X=t.CAVALRY_RIDE;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.PHYSICS.on=true;t.TERRAIN.on=true;t.FOG.on=false;t.COMMAND_POWERS.on=false;
 const mounted=g=>g.units.every(u=>u.s.mounted&&!u.s.range);
 // (the riders' record over secs s: each through its own loop, step (each: before each frame))
 const record=(b,cav,secs,each)=>{const o={charges:[],stuck:0,flips:0,drops:0,turns:0,plan:0,start:cav.units.length};let last=null,lastAt=0,lastPh=null,prevDir=null;const mid=()=>{const m=cav.units.filter(u=>u.hp>0&&!u.left);return m.length?t.centroid(m):cav.centre()};let prevC=mid();
  for(let i=0;i<secs*30&&t.B===b&&!b.over;i++){each&&each(b,cav,i);t.updateBattle(1/30);const p=cav.ridePlan,ph=p?.phase;if(p)o.plan+=1/30;
   if(ph!==last){if(ph==='charge')o.charges.push({d:Math.round(p.runup),forced:p.forced});if(last==='approach'&&ph==='exit'&&b.t-lastAt<2)o.flips++;if(!p&&(lastPh==='approach'||lastPh==='exit')&&b.t-(cav.ridePlan?.at??lastAt)>X.travelMax)o.drops++;last=ph;lastAt=b.t}lastPh=ph;
   if(i%15===0){const C=mid(),dx=C.x-prevC.x,dy=C.y-prevC.y,sp=Math.hypot(dx,dy)*2,close=b.units.some(e=>t.battleEnemy(cav.team,e)&&e.hp>0&&!e.rout&&Math.hypot(e.x-C.x,e.y-C.y)<X.clear);
    if((ph==='approach'||ph==='exit')&&sp<8&&!close)o.stuck+=.5;if(sp>10){const a=Math.atan2(dy,dx);if(prevDir!=null&&t.angGap(a,prevDir)>2.45)o.turns++;prevDir=a}prevC=C}
   if(i%150===0)t.frame()}
  o.alive=cav.units.filter(u=>u.hp>0&&!u.left).length;o.left=cav.units.filter(u=>u.left).length;return o};
 const say=(name,o)=>info(name+': charges '+(o.charges.map(c=>c.d+(c.forced?' (forced)':'')).join(', ')||'none')+'; stuck '+o.stuck+' s, flips '+o.flips+', drops '+o.drops+', reversals '+o.turns+'; riding '+Math.round(o.plan)+' s; '+o.alive+'/'+o.start+' left standing');
 const TR=new URLSearchParams(location.search).get('trace'),R=t.CavalryRide;
 const hook=()=>{const log=[],ch=R.charge,st=R.step,rt=R.route,ba=R.breakAway;let n=0;
  R.charge=function(c,g,p,C,e,f){log.push(t.B.t.toFixed(1)+' CHARGE '+p.phase+' d'+Math.round(c.d2(C,e))+(f?' forced':''));return ch.apply(this,arguments)};
  R.breakAway=function(c,g,m,C,p,foe){log.push(t.B.t.toFixed(1)+' BREAK '+p.phase+' gap'+Math.round(c.d2(foe,C))+' legs'+(p.legs||0));return ba.apply(this,arguments)};
  R.route=function(c,C,E,v,exit){const r=rt.apply(this,arguments);if(!r&&n++<8)log.push(t.B.t.toFixed(1)+' NOROUTE '+(exit?'exit':'in')+' C'+Math.round(C.x)+','+Math.round(C.y)+' E'+Math.round(E.x)+','+Math.round(E.y));return r};
  R.step=function(c,g,m){const had=g.ridePlan?.phase,r=st.apply(this,arguments);if(!r&&n++<30)log.push(t.B.t.toFixed(1)+' FALSE had '+had+' alive '+m.length);if(g.ridePlan?.phase!==had)log.push(t.B.t.toFixed(1)+' '+had+'>'+g.ridePlan?.phase+' alive'+m.length+' near'+Math.round(c.d2(R.nearest(c,t.centroid(m)),t.centroid(m))));return r};
  const cv=t.Commander.prototype.cavalry,od=t.Commander.prototype.orders;let k=0;t.Commander.prototype.cavalry=function(c,id){if(t.B.groups[id].foe&&k++%4===0)log.push(t.B.t.toFixed(1)+' CAV post '+c.Q.post+' commit '+!!c.Q.commit+' take '+!!c.take+' rush '+!!c.rush+' hold '+!!c.holding+' order '+t.B.groups[id].order+' ph '+t.B.groups[id].phase);return cv.apply(this,arguments)};
  t.Commander.prototype.orders=function(){const r=od.apply(this,arguments);if(this.team===1&&k++%4===0)log.push(t.B.t.toFixed(1)+' ORD foes '+this.assess().foes.length+' lull '+(t.B.t-Math.max(t.B.lastHit||0,this.Q.seen||0)).toFixed(1));return r};
  const tick=setInterval(()=>{},1000);clearInterval(tick);
  return ()=>{log.push('END t'+t.B.t.toFixed(1)+' over '+t.B.over+' k'+k+' groups '+JSON.stringify(Object.values(t.B.groups).map(g=>[g.id,g.foe,g.order,g.units.filter(u=>u.hp>0).length,g.resolve?.routed])));t.Commander.prototype.cavalry=cv;t.Commander.prototype.orders=od;R.charge=ch;R.step=st;R.route=rt;R.breakAway=ba;info('TRACE '+log.join(' | '))}};
 const lab=(name,cfg,secs,each)=>{L.start({deploy:false,paused:false,morale:false,seed:LS,...cfg});const b=t.B,cav=Object.values(b.groups).find(g=>g.foe&&mounted(g)),un=TR&&name.startsWith(TR)?hook():null;let o;try{o=record(b,cav,secs,each)}finally{un&&un()}say(name,o);L.exit();return o};
 const steady=(name,o)=>ok(o.stuck<=3&&o.flips<=3&&o.drops===0&&o.turns<=6,name+': the riders neither stall nor swing back and forth');
 // (forced: cornered with no way out, or met by riders as fast: at most one)
 const runUps=(name,o,n)=>ok(o.charges.length>=n&&o.charges.every(c=>c.forced||c.d>=X.runMin)&&o.charges.filter(c=>c.forced).length<=1,name+': '+n+'+ charges, each from a run-up of '+X.runMin+' px at least (one forced at most)');
 const knights={type:'hum_knight',count:6},open={recipe:'open',seed:LS},march=(b,cav,i)=>{if(i%240===0)for(const g of Object.values(b.groups).filter(g=>g.player))g.moveTo(g.ax,i%480?t.fieldTop()+70:t.fieldBot()-70)};
 const moving=lab('a column marching across',{leftGroups:[{type:'hum_foot',count:12}],rightGroups:[knights],ai:false,ground:open},45,march);runUps('a moving column',moving,2);steady('a moving column',moving);
 const crowd=lab('a crowded field',{leftGroups:[{type:'hum_foot',count:24},{type:'hum_spear',count:16},knights],rightGroups:[{type:'hum_foot',count:24},{type:'hum_levy',count:24},{type:'hum_bow',count:12},knights],ai:true,ground:open},50);ok(crowd.charges.length>=1&&crowd.alive>=crowd.start-3,'a crowded field: the riders charge and are not caught in the press (three lost at most: both sides\u2019 knights ride on to low stamina and meet)');steady('a crowded field',crowd);
 const pikes=lab('a pike line facing them',{leftGroups:[{type:'hum_pike',count:20}],rightGroups:[knights],ai:true,ground:open},45);ok(pikes.alive>=pikes.start-1&&pikes.charges.every(c=>c.d>=X.runMin),'a pike line facing them: no charge onto its points, and next to no losses');ok(pikes.plan>30,'a pike line facing them: they stand off and watch it rather than giving up the ride');
 // (in woods the trees hide the foot as well: the riders may not see them to charge at all)
 const woods=lab('woods',{leftGroups:[{type:'hum_foot',count:16}],rightGroups:[knights],ai:true,ground:{recipe:'forest',seed:LS}},45);runUps('woods',woods,0);ok(woods.alive>=woods.start-1,'woods: the riders are not caught among the trees');steady('woods',woods);
 const river=lab('a river with a bridge',{leftGroups:[{type:'hum_foot',count:16}],rightGroups:[knights],ai:true,ground:{recipe:'river',seed:LS,river:{bridge:true}}},45);runUps('a river',river,2);steady('a river',river);
 const hills=lab('hills',{leftGroups:[{type:'hum_foot',count:16}],rightGroups:[knights],ai:true,ground:{recipe:'hills',seed:LS}},45);runUps('hills',hills,1);steady('hills',hills);
 // the world battle's edge: your riders (the AI's) with their backs to it, a band between them and the middle
 {const P=t.P,G=t.G;t.WORLD_BATTLE.on=true;t.EXITS.on=true;G.paused=false;G.speed=1;P.troops={hum_knight:6};const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-30;y<=ty+30;y++)for(let x=tx-30;x<=tx+30;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
  const band=t.asParty({kind:'bandits',troops:Array(12).fill('militia'),x:P.x+25,y:P.y,cool:0});t.bandits.push(band);G.enc={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,surprise:true});const b=t.B,a=b.world;t.setAuto(true,true);
  const cav=Object.values(b.groups).find(g=>g.player&&mounted(g)),put=(l,x,y)=>{const C=t.centroid(l);for(const u of l){u.x+=x-C.x;u.y+=y-C.y}};put(cav.units,a.cx+a.radius-45,a.cy);put(b.units.filter(u=>u.team),a.cx+a.radius-170,a.cy);for(const u of b.units)u.s={...u.s,dmg:u.team?.5:1};
  const edge=record(b,cav,45);say('the world battle edge',edge);const C=t.centroid(cav.units.filter(u=>u.hp>0&&!u.left));
  ok(edge.left===0&&a.inside(C,60),'the world battle edge: no rider rides out of the battle, and they win back room from the edge');runUps('the world battle edge',edge,1);steady('the world battle edge',edge)}
 ok(!ERR.length,'cavalry in hard places has no runtime errors');
});
