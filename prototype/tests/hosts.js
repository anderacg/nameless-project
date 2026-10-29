'use strict';
// Hosts (world/hosts.js, doc/HOSTS_DESIGN.md phase 1): your companions' parties that Follow you march as your host, in a column on
// your own path (each at its place back along your trail, never stacked), at the pace of the slowest; they hunt no prey; one far
// off makes for you; each within HOSTS.join of a battle of yours joins it.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,X=t.HOSTS;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.GUIDE.on=false;
 const ash=Kit.goHome('Ashford');P.troops={hum_levy:20};P.sk.lead.lv=10;
 for(const id of ['brann','elske']){P.comps[id]={ap:5,role:''};const c=t.compInit(id);c.lv=Math.max(c.lv,t.COMP_LEAD.lv);c.ap=5;t.cpGive(id,'hum_levy',4)}
 const ps=t.cparties(),[a,b]=ps;
 ok(ps.length===2&&ps.every(p=>p.order==='follow')&&t.Host.yours()?.members.length===2,'two companions’ parties follow you: your host');
 // ---- on the march: a column on your path
 const dest={x:ash.x+40*t.TILE,y:ash.y+14};let far=0;P.tx=dest.x;P.ty=dest.y;
 const trail=[];Kit.frames(900,.05,null,()=>{trail.push([P.x,P.y]);return P.tx==null});
 const h=t.Host.yours(),[m1,m2]=h.members,d1=Math.hypot(m1.x-P.x,m1.y-P.y),d2=Math.hypot(m2.x-P.x,m2.y-P.y),apart=Math.hypot(m1.x-m2.x,m1.y-m2.y);
 const off=o=>Math.min(...trail.map(([x,y])=>Math.hypot(o.x-x,o.y-y)));
 ok(d1>X.gap*.5&&d1<X.gap*2.2&&d2>d1&&apart>X.gap*.5,'in a column behind you: the first '+Math.round(d1)+' px back, the second '+Math.round(d2)+' px, '+Math.round(apart)+' px apart');
 ok(off(m1)<12&&off(m2)<12,'on your own path ('+Math.round(off(m1))+' and '+Math.round(off(m2))+' px off it)');
 // ---- the pace: the slowest's
 {const own=t.Host.base(P),slow=Math.min(...h.members.map(o=>t.Host.base(o)));ok(Math.abs(h.paceOf()-Math.min(1,Math.max(.3,slow/own)))<1e-6&&h.paceOf()>.8,'the host at its slowest’s pace, the ground aside: ×'+h.paceOf().toFixed(2)+' of yours');
  const p=m1.troops.slice();m1.troops=Array(4).fill('hum_knight');const fast=h.paceOf();m1.troops=p;ok(fast>=h.paceOf()-1e-9,'none slower than you: your own pace')}
 // ---- they hunt no prey: a weak band near, they keep their places
 Kit.frames(200,.05);// (settled in their places, you standing)
 {const bd=t.asParty({kind:'bandits',troops:['militia'],x:m1.x+40,y:m1.y,cool:0,idle:true,t:0,a:0});t.bandits.push(bd);const x0=m1.x,y0=m1.y;for(let i=0;i<40;i++)t.BRAINS.cparty.think(m1,.05);
  ok(!m1.fight&&Math.hypot(m1.x-x0,m1.y-y0)<12,'a weak band near: the party following you keeps its place');t.bandits.length=0}
 // ---- one far off makes for you
 {m2.x=P.x+400;m2.y=P.y;const d0=Math.hypot(m2.x-P.x,m2.y-P.y);for(let i=0;i<60;i++)t.BRAINS.cparty.think(m2,.05);ok(Math.hypot(m2.x-P.x,m2.y-P.y)<d0-20,'far off ('+Math.round(d0)+' px), it makes for you')}
 // ---- a battle: every member within HOSTS.join joins it, beyond REINF.r too
 {m2.x=P.x-(t.REINF.r+40);m2.y=P.y;m1.x=P.x-20;m1.y=P.y;const bd=t.asParty({kind:'bandits',troops:Array(4).fill('militia'),x:P.x+30,y:P.y,cool:0});t.bandits.push(bd);
  t.startEncounter({kind:'party',ref:bd,n:4,list:bd.troops.slice(),band:'bandits'});const al=G.enc?.allies||[];
  ok(al.some(f=>f.src===m1)&&al.some(f=>f.src===m2),'a battle: both join it, the one '+(t.REINF.r+40)+' px back too ('+X.join+' px a host’s reach)');G.enc=null;Kit.world();t.bandits.length=0}
 // ---- told otherwise, out of the host
 {t.cpOrder('elske','patrol');ok(t.Host.yours()?.members.length===1,'told to patrol: out of your host');t.cpOrder('elske','follow');ok(t.Host.yours()?.members.at(-1)===t.compInit('elske').party,'told to follow again: the last in the column')}
 ok(!ERR.length,'no runtime errors');
});
