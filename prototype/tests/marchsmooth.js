'use strict';
// A march forms up and walks smoothly (world/march.js MarchArmy#step, MarchGround#snap; the owner, 2026-10-31: "when units try to
// form in the marching formation they move weird ... the unit seems not walking but shaking a bit"): from a heap every man
// reaches his place, none left hemmed in by his own side (MARCH_MOVE.squeeze); marching, a man's place keeps its own spot (no hop
// from grid cell to cell), so he seldom steps back; and his walk shows as one walk, not a flicker of walking and standing
// (MARCH_MOVE.stride); and every man marches at the army's own step, its roads and woods with it (the owner: "all units should share
// the same speed (army speed)").
Kit.suite(({ok,info})=>{
 const t=T,P=t.P;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});
 let at=null;const okT=q=>q===t.T_OPEN||q===t.T_ROAD;
 for(let ty=10;ty<t.MH-10&&!at;ty+=3)for(let tx=12;tx<t.MW-12&&!at;tx+=3){let open=true;for(let j=-4;j<=4&&open;j++)for(let i=-8;i<=8&&open;i++)if(!okT(t.tAt(tx+i,ty+j)))open=false;
  if(open&&t.TOWNS.every(z=>Math.hypot(z.x-(tx+.5)*16,z.y-(ty+.5)*16)>200))at=[(tx-4.5)*16,(ty+.5)*16]}
 ok(!!at,'(open ground for the march)');if(!at)return;Kit.goTo(at[0],at[1]);P.troops={hum_foot:24,hum_spear:12,hum_knight:8};
 const A=t.MarchArmy.of(P);A.sync();const N=A.units.length;
 // (each step: how often a man steps back against his last step, how often his walk flickers on and off, a second each)
 const run=(sec,dx,dy)=>{const last=new Map();let rev=0,tog=0;
  for(let i=0;i<sec/.05;i++){P.x+=dx*.05;P.y+=dy*.05;const pr=new Map(A.units.map(u=>[u,[u.x,u.y,u.walking]]));A.step(.05);
   for(const u of A.units){if(u.pivot)continue;const p=pr.get(u),sx=u.x-p[0],sy=u.y-p[1],m=Math.hypot(sx,sy);if(u.walking!==p[2])tog++;if(m>.02){const l=last.get(u);if(l&&sx*l[0]+sy*l[1]<-.3*m*Math.hypot(...l))rev++;last.set(u,[sx,sy])}}}
  return{rev:rev/N/sec,tog:tog/N/sec}};
 const off=()=>Math.max(...A.units.filter(u=>u.goal&&!u.pivot).map(u=>Math.hypot(u.goal.x-u.x,u.goal.y-u.y)));
 A.units.forEach((u,i)=>{if(!u.pivot){u.x=P.x+((i*37)%21-10)*1.5;u.y=P.y+((i*53)%17-8)*1.5}});run(10,0,0);
 ok(off()<1.5,'from a heap of '+N+' men, every one reaches his place (the farthest '+off().toFixed(2)+' px off it)');
 const m=run(6,18,0);info('marching: '+m.rev.toFixed(2)+' steps back, '+m.tog.toFixed(2)+' flickers a man a second');
 ok(m.rev<.1,'marching east, a man seldom steps back ('+m.rev.toFixed(2)+' a second; once .9, then .16 with the leader\'s body still hopping his neighbours\' places)');
 ok(m.tog<.5,'and walks as one walk, not walking and standing by turns ('+m.tog.toFixed(2)+' a second; once 2.1)');
 // (a turn: how often a man's step swings more than .6 rad from his last, how often he stops, in a quarter turn and an about turn)
 const turn=(sec,dx,dy)=>{const last=new Map();let sharp=0,n=0,stop=0,all=0;for(let i=0;i<sec/.05;i++){P.x+=dx*.05;P.y+=dy*.05;const pr=new Map(A.units.map(u=>[u,[u.x,u.y]]));A.step(.05);
   for(const u of A.units){if(u.pivot)continue;const p=pr.get(u),sx=u.x-p[0],sy=u.y-p[1];all++;if(Math.hypot(sx,sy)<.02){stop++;continue}const l=last.get(u);
    if(l){const a=Math.atan2(sy,sx)-Math.atan2(l[1],l[0]);n++;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))>.6)sharp++}last.set(u,[sx,sy])}}return{sharp:sharp/n,stop:stop/all}};
 {const q=turn(4,0,26),b=(run(3,0,26),turn(4,0,-26));info('turning: '+(q.sharp*100).toFixed(1)+'% sharp steps a quarter turn, '+(b.sharp*100).toFixed(1)+'% about; stops '+(q.stop*100).toFixed(1)+'%, '+(b.stop*100).toFixed(1)+'%');
  ok(q.sharp<.13&&b.sharp<.15&&q.stop<.1&&b.stop<.1,'wheeling, they curve round at their march pace: few sharp swings ('+(q.sharp*100).toFixed(0)+'% a quarter turn, '+(b.sharp*100).toFixed(0)+'% about; once 19% and 22%), fewer stops ('+(Math.max(q.stop,b.stop)*100).toFixed(0)+'%; once 11%)')}
 run(3,0,18);run(6,0,0);ok(off()<1.5,'turned and halted, they settle in their places again (the farthest '+off().toFixed(2)+' px off)');
 // (the army's own pace, as on a road (faster) and in woods (slower), a fresh army back where it began: in his place every man goes
 // at it, never faster (the parting's nudge aside), and none falls further behind)
 {Kit.goTo(at[0],at[1]);const B2=t.MarchArmy.of(P);B2.sync();for(let i=0;i<120;i++)B2.step(.05);const base=t.moveStep(t.MAP_BASE*t.travelMul(),.05,true),off2=()=>Math.max(...B2.units.filter(u=>u.goal&&!u.pivot).map(u=>Math.hypot(u.goal.x-u.x,u.goal.y-u.y)));
  for(let i=0;i<40;i++){P.x+=base;B2.step(.05)}const o0=off2();let over=0;
  for(const k of [1.4,.6])for(let i=0;i<40;i++){const pr=new Map(B2.units.map(u=>[u,[u.x,u.y]]));P.x+=base*k;B2.step(.05);for(const u of B2.units){if(u.pivot)continue;const p=pr.get(u);over=Math.max(over,Math.hypot(u.x-p[0],u.y-p[1])-Math.max(base,base*k))}}
  const o1=off2();ok(over<.5&&o1<=o0+base,'the army faster (a road) or slower (woods): every man at its step, never faster (most '+over.toFixed(2)+' px over, the parting\'s nudge), none further behind ('+o0.toFixed(1)+' then '+o1.toFixed(1)+' px off his place)')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
