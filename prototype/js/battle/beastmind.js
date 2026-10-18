'use strict';
/* ---------- the beasts' own mind: how beasts fight under an AI captain (the soldiers': commander.js; characters': charmind.js) ----------
   Beasts keep no ranks and hold no line. Under an AI captain (the enemy's, your allies', yours under Auto) each group of beasts
   fights its kind's way (BEAST_TACTICS.kinds, by unit type: its way, and that way's numbers, a kind's own over them), handed here
   by the captain before its arms take the rest of a mixed army (commander.js captain: beastsOf), so wolves circle while trolls
   go in at the front. Its orders go through BattleControl, as every captain's do. Beasts never rout (morale.js steady): a
   pack's nerve is its own. Your beasts follow your orders; under Auto, their kind's way (a group of yours is never split).
   on: false, every beast fights as before (tests/harness.js: the older suites; tests/beastai.js turns it on).
   size: at the start (beastPacks, from setup.js initialize) an AI group of that kind splits into packs of size[0]-size[1], side by
   side spread px apart; every group of beasts stands in the pack spread (formations.js FORMS.pack: ragged, no rows). close: at
   its mark, within this of one of them, a group charges, each beast at the foe nearest him (beastGo); one that spits stands
   and spits once its mark is in its reach.
   pack (wolves): the packs pick one prey together (pick: routing, shooters, wounded, alone (a group alone px from its nearest
   friend), far px off costing a point; a new one only keep points better) and circle it ring px out (beyond its own spread),
   step rad a think, each pack to a side of its own (sides: from its rear round; at: rad, near enough), the shorter way round;
   all there (or circleMax s), they bite at once; bite s at grips (biteMax s at most), then pull back back px and come round to
   a fresh side (shift rad on, recircle s at most); a prey whose morale is under press is worried on, not let go. Bitten from
   two sides at once (packs at grips gap rad apart round it), it is surrounded: dread off its morale a think. A pack that loses
   hurt of its health in one bite breaks off regroup px from the foe and gathers rest s; too few left (under size[0]), it
   joins another pack with room.
   rush (boars): headlong at the nearest, rush s at grips, back out back px (a run-up: the next charge lands with its momentum),
   backMax s at most, and again.
   brute (bears, trolls; the dragon, crowd: the most crowded group): straight at the thickest fight (most of a group's men at
   grips with ours), else the strongest group, a new one only keep points better; running from runAt px.
   ambush (spiders, scorpions, the tiger; the wyrm, no cover): into the nearest spot deep in a wood within cover px of them
   (clear px off the foe's middle), and wait, unseen; a foe within strike px, a wound, or wait s, and they go at him, out of
   hiding (seen by those they fight while they fight), and fight on.
   swoop (griffins): round to their mark's rear (shooters first, then the foe's edges and rear: pick), from one side of it then
   the other (off rad), dive s at grips, wheel out px away, again. blob (slimes): an advance, at a walk.
   Its counts for the tests and the lab, captainMem(ck).beast.n: bites, pull-backs, regroups, joins, dread, rushes, strikes
   (unseen: most of them hidden as they struck), dives */
const BEAST_TACTICS={on:true,
  kinds:{wolf:{way:'pack',size:[3,5]},boar:{way:'rush',size:[2,3]},bear:{way:'brute',size:[1,2]},troll:{way:'brute',size:[1,2]},dragon:{way:'brute',crowd:true},
    tiger:{way:'ambush',strike:110,wait:20},spider:{way:'ambush'},scorpion:{way:'ambush',strike:110},wyrm:{way:'ambush',cover:0,strike:150,wait:8},griffin:{way:'swoop'},slime:{way:'blob'}},
  spread:60,close:70,
  pack:{ring:50,step:.8,at:.45,sides:[Math.PI,Math.PI/2,-Math.PI/2,Math.PI*.75,-Math.PI*.75],circleMax:3,recircle:2,bite:4,biteMax:7,back:60,backMax:2,shift:.9,hurt:.75,regroup:140,rest:3,press:50,gap:1.75,dread:6,
    pick:{rout:1,shot:1.5,hurt:2,alone:1,far:150,keep:1}},
  rush:{rush:2.5,back:70,backMax:3},
  brute:{runAt:150,keep:10},
  ambush:{cover:260,clear:150,strike:130,wait:15},
  swoop:{ring:80,step:1,at:.5,off:.7,circleMax:9,dive:1.5,diveMax:6,out:160,wheel:3,pick:{shot:4,edge:2,rear:2,far:400,keep:1}}};
// (a kind's number: its own, else its way's)
const beastNum=(K,k)=>K[k]??BEAST_TACTICS[K.way][k];
// a group's kind (its BEAST_TACTICS entry), or null: no beast, a character, or the switch off
const beastKind=id=>{const g=B.groups[id];return BEAST_TACTICS.on&&g&&g.role!=='hero'&&BEAST_TACTICS.kinds[g.type]||null};
// (the captain's lists, N: its beast groups taken out of them, and given back as a list)
function beastsOf(N){if(!BEAST_TACTICS.on)return [];const out=[];for(const k of Object.keys(N))N[k]=N[k].filter(id=>{const b=!!beastKind(id);if(b)out.push(id);return !b});return out}
/* (at the start, setup.js initialize: the pack spread for every group of beasts; an AI group split into packs (beastPacks): side by
   side across its front, the first keeping its id, the rest id~2, id~3…, their men by where they stand across it) */
function beastPacks(){
  for(const id of Object.keys(B.groups)){const g=B.groups[id],K=beastKind(id),m=grpUnits(id);if(!K||m.length<2)continue;
    const S=K.size,k=S&&!g.player?Math.max(Math.ceil(m.length/S[1]),Math.round(m.length*2/(S[0]+S[1]))):1,lat=u=>-Math.sin(g.face)*u.x+Math.cos(g.face)*u.y;
    m.sort((a,b)=>lat(a)-lat(b));let i0=0;const ax=g.ax,ay=g.ay,name=g.name.replace(/ \d+$/,'');
    for(let i=0;i<k;i++){const n=Math.floor(m.length/k)+(i<m.length%k?1:0),part=m.slice(i0,i0+n),off=(i-(k-1)/2)*BEAST_TACTICS.spread;i0+=n;
      const q=i?B.groups[id+'~'+(i+1)]=new BattleControl(id+'~'+(i+1),g.team,{player:g.player,ally:g.ally,foe:g.foe,role:g.role,type:g.type,sourceGroupId:g.sourceGroupId,name:g.name,face:g.face}):g;
      if(k>1)q.name=name+' '+(i+1);q.form='pack';q.files=null;
      q.ax=clamp(ax-Math.sin(g.face)*off,8,BW-8);q.ay=clamp(ay+Math.cos(g.face)*off,fieldTop(),fieldBot());for(const u of part)u.grp=q.id;
      layForm(q.id);for(const u of part){u.x=q.ax+u.sx;u.y=q.ay+u.sy}}}}
// (a list's health; its men at grips with a foe; a point d px on from a, away from b (the field's middle when on top of it))
const hpOf=m=>m.reduce((a,u)=>a+u.hp,0);
const atGrips=(m,team)=>m.filter(u=>B.units.some(e=>e.team!==team&&e.hp>0&&!e.left&&Math.hypot(e.x-u.x,e.y-u.y)<(u.s.reach||11)+10));
function awayFrom(a,b,d){let dx=a.x-b.x,dy=a.y-b.y,l=Math.hypot(dx,dy);if(l<1){dx=BW/2-a.x;dy=0;l=Math.abs(dx)||1}return{x:clamp(a.x+dx/l*d,8,BW-8),y:clamp(a.y+dy/l*d,fieldTop(),fieldBot())}}
/* the captain's reading for its beasts, once a think: the foe's groups it sees (routing too: prey), each {key, m, C (middle), r
   (spread), n, rout, shot (shares), hurt (health lost), w (strength), rep (whom an order names), mor (its morale), face, alone};
   the foe's middle (M), ours (mine); reach, nearest (a group they can walk to) */
function beastCtx(team,S,Q){
  const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),G={},seen=B.units.filter(u=>u.team!==team&&u.hp>0&&!u.left&&seenBy(team,u));
  for(const u of seen){const k=u.grp||'u'+u.id;(G[k]||(G[k]={key:k,m:[]})).m.push(u)}
  const L=Object.values(G);for(const f of L){const m=f.m,g=B.groups[f.key];f.C=centroid(m);f.n=m.length;f.r=Math.min(80,Math.max(...m.map(u=>d2(u,f.C))));f.rout=m.filter(u=>u.rout).length/f.n;
    f.shot=m.filter(u=>u.s.range&&!u.empty).length/f.n;f.hurt=1-hpOf(m)/m.reduce((a,u)=>a+u.max,0);f.w=m.reduce((a,u)=>a+wOf(u),0);f.rep=m.find(u=>!u.rout)||m[0];const r=!B.noMorale&&resolveOf(f.rep);f.mor=r?r.mor:100;
    f.face=g?g.currentFacing??g.face:null}
  for(const f of L)f.alone=L.reduce((a,o)=>o===f||o.rout>.5?a:Math.min(a,d2(o.C,f.C)),400);
  const reach=(C,p)=>!(B.terrain&&B.terrain.blocky)||canReach(C,p);// (a way there round cliffs and rock: none, and it is no mark: terrain.js)
  const M=S.foes.length?centroid(S.foes):L.length?centroid(seen):{x:BW/2,y:BH/2},mine=centroid(S.mine.length?S.mine:[{x:BW/2,y:BH/2}]);
  return{team,Q,n:Q.beast.n,L,d2,M,mine,byKey:k=>L.find(f=>f.key===k)||null,reach,nearest:(C,stand)=>{const l=L.filter(f=>(!stand||f.rout<.5)&&reach(C,f.C));return l.length?l.reduce((a,f)=>d2(f.C,C)<d2(a.C,C)?f:a):null}}}
// (a think: the time in its phase; its men standing; their middle)
function beastTick(g){g.t=(g.t||0)+FOE_CMD.think;const m=grpUnits(g.id).filter(u=>!u.rout);return{m,C:m.length?centroid(m):{x:g.ax,y:g.ay}}}
// (a mark shared by the groups of one way (wolves' prey, griffins' mark): kept till another scores keep better; null: none they reach)
function beastMark(c,way,from,sc,keep){const P=c.Q.beast.mark;let best=null,bv=-Infinity;
  for(const f of c.L){if(!c.reach(from,f.C))continue;const v=sc(f);if(v>bv){bv=v;best=f}}
  const cur=c.byKey(P[way]);if(cur&&c.reach(from,cur.C)&&sc(cur)+keep>=bv)return cur;P[way]=best?best.key:null;return best}
/* round its mark, ring px beyond the mark's own spread, step rad a think the shorter way to its side a (radians round it): true
   once there (within at rad and 35 px of the ring). The other way round if this one cannot be walked; no way either side: false
   and stuck (beastCircle's caller goes straight in) */
function beastCircle(c,g,C,f,a,X){
  const R=X.ring+f.r,b=Math.atan2(C.y-f.C.y,C.x-f.C.x),d=Math.atan2(Math.sin(a-b),Math.cos(a-b)),dist=c.d2(C,f.C),near=Math.abs(d)<X.at&&Math.abs(dist-R)<35;
  for(const s of [1,-1]){const nb=b+s*Math.sign(d||1)*Math.min(Math.abs(d)||0,X.step),p={x:clamp(f.C.x+Math.cos(nb)*R,8,BW-8),y:clamp(f.C.y+Math.sin(nb)*R,fieldTop(),fieldBot())};
    if(!c.reach(C,p))continue;g.standAt(p.x,p.y);g.setRun(c.d2(C,p)>50);g.faceTo(Math.atan2(f.C.y-C.y,f.C.x-C.x));return near?'there':'going'}
  return 'stuck'}
/* (at its mark, at a run: set on it (its men at its men, cuffing whoever they brush past) till within close px of one of them, then a
   charge, each at the foe nearest him: a beast set on one man of a crowd stands idle behind the beasts on him (actors.js CROWD).
   One that spits (a spider, a slime), its mark within its reach, stands and spits, as shooters holding do: on a charge it would
   back off a foe closing on it, into a corner) */
function beastGo(g,f,C){const r=f.rep,on=r.grp&&B.groups[r.grp]?g.targetGroupId===r.grp:g.targetUnitId===r.id,d=Math.min(...f.m.map(e=>Math.hypot(e.x-C.x,e.y-C.y))),sh=g.units.filter(u=>u.s.range);
  if(sh.length&&d<=Math.min(...sh.map(u=>u.s.range))*.9){g.standAt(C.x,C.y);g.setRun(false)}
  else if(d<BEAST_TACTICS.close){if(g.order!=='charge'||g.hasTarget)g.charge({run:true});else g.setRun(true)}else if(g.order!=='charge'||!on)g.attack(r,{run:true});else g.setRun(true);
  g.faceTo(Math.atan2(f.C.y-C.y,f.C.x-C.x))}
// (a pack gathered after a regroup with fewer than its kind's least: it joins the nearest other pack with room (size[1]); true if so)
function packJoin(c,g,m,K){if(m.length>=K.size[0])return false;let q=null,qd=Infinity;
  for(const o of c.packs){const n=grpUnits(o.id).length;if(o===g||!n||n+m.length>K.size[1])continue;const d=c.d2(o.centre(),centroid(m));if(d<qd){qd=d;q=o}}
  if(!q)return false;for(const u of m)u.grp=q.id;layForm(q.id);c.n.join++;return true}
// (a pack's bite: its nerve (g.mark) reckoned from its health now)
function packBite(c,g,f,C){c.n.bite++;g.phase='bite';g.t=0;g.inMelee=0;g.mark=hpOf(grpUnits(g.id));beastGo(g,f,C)}
// (in the melee: s at grips, counted while half of them are)
function beastGrips(g,m,team){const n=atGrips(m,team).length;g.inMelee=n*2>=m.length?(g.inMelee||0)+FOE_CMD.think:g.inMelee||0;return n}
// each way: (c: beastCtx, id: the group, K: its kind)
const BEAST_WAYS={
  pack(c,id,K){
    const g=B.groups[id],X=BEAST_TACTICS.pack,{m,C}=beastTick(g);if(!m.length)return;g.phase=g.phase||'circle';
    // (hurt in its bite: it breaks off, away from the foe, and gathers)
    if(g.phase==='bite'&&hpOf(m)<g.mark*(1-X.hurt)){c.n.regroup++;const p=awayFrom(C,c.M,X.regroup);g.moveTo(p.x,p.y,{run:true});g.phase='regroup';g.t=0;g.inMelee=0;return}
    if(g.phase==='regroup'){if(g.t<X.rest)return;g.phase='circle';g.t=0;if(packJoin(c,g,m,K))return}
    if(g.phase==='back'){if(g.t<X.backMax&&c.d2(C,{x:g.ax,y:g.ay})>25)return;g.phase='circle';g.t=X.circleMax-X.recircle}// (round again: recircle s at most)
    const P=c.Q.beast,f=beastMark(c,'pack',P.packC||C,e=>{const Y=X.pick;return Y.rout*e.rout+Y.shot*e.shot+Y.hurt*e.hurt+Y.alone*Math.min(1,e.alone/200)-c.d2(e.C,P.packC||C)/Y.far},X.pick.keep);
    if(!f){const e=c.nearest(C);if(e)beastGo(g,e,C);return}
    if(g.prey!==f.key&&g.phase!=='bite'){g.prey=f.key;g.side=null;if(g.phase==='wait')g.phase='circle'}
    if(g.phase==='bite'){const e=c.byKey(g.prey)||f;beastGrips(g,m,c.team);
      // (a prey shaken (its morale under press) is worried on, not let go)
      if(g.inMelee>=X.bite&&e.mor<X.press){g.inMelee=0;g.t=0}
      if(g.inMelee>=X.bite||g.t>=X.biteMax){c.n.back++;const p=awayFrom(C,e.C,X.back);g.moveTo(p.x,p.y,{run:true});g.phase='back';g.t=0;g.inMelee=0;g.side=g.side==null?null:g.side+X.shift*(c.packs.indexOf(g)%2?1:-1);return}
      g.prey=e.key;beastGo(g,e,C);return}
    // (a side of its own round the prey: the free one nearest it, from the prey's rear round)
    if(g.side==null){const face=f.face??Math.atan2(c.mine.y-f.C.y,c.mine.x-f.C.x),b=Math.atan2(C.y-f.C.y,C.x-f.C.x),taken=c.packs.filter(o=>o!==g&&o.prey===f.key&&o.side!=null).map(o=>o.side);
      const free=X.sides.map(s=>face+s).filter(a=>!taken.some(t=>angGap(t,a)<.3));g.side=(free.length?free:X.sides.map(s=>face+s)).reduce((a,s)=>angGap(s,b)<angGap(a,b)?s:a)}
    // (it bites at once: the prey is running, or already at grips with these)
    if(f.rout>.5||atGrips(m,c.team).length){packBite(c,g,f,C);return}
    const at=beastCircle(c,g,C,f,g.side,X);if(at==='stuck'||g.t>=X.circleMax){packBite(c,g,f,C);return}
    if(at==='there'&&g.phase==='circle'){g.phase='wait'}},
  rush(c,id,K){
    const g=B.groups[id],X=BEAST_TACTICS.rush,{m,C}=beastTick(g);if(!m.length)return;g.phase=g.phase||'rush';
    if(g.phase==='back'){if(g.t<X.backMax&&c.d2(C,{x:g.ax,y:g.ay})>25)return;g.phase='rush';g.t=0;g.inMelee=0}
    const f=c.byKey(g.prey)||c.nearest(C);if(!f)return;g.prey=f.key;beastGrips(g,m,c.team);
    if(g.inMelee>=X.rush){c.n.rush++;const p=awayFrom(C,f.C,X.back);g.moveTo(p.x,p.y,{run:true});g.phase='back';g.t=0;g.inMelee=0;return}
    beastGo(g,f,C)},
  brute(c,id,K){
    const g=B.groups[id],X=BEAST_TACTICS.brute,{m,C}=beastTick(g);if(!m.length)return;
    // (the thickest fight: most of its men at grips with ours; none, the strongest; the dragon, the most crowded)
    const ours=B.units.filter(u=>u.team===c.team&&fighting(u)),grips=f=>f.m.filter(e=>ours.some(u=>c.d2(u,e)<20)).length,crowd=f=>f.m.filter(e=>c.d2(e,f.C)<40).length;
    const sc=f=>(K.crowd?crowd(f)*10:grips(f)*10+f.w)-c.d2(f.C,C)/40;let best=null,bv=-Infinity;for(const f of c.L)if(c.reach(C,f.C)&&f.rout<.5){const v=sc(f);if(v>bv){bv=v;best=f}}
    const cur=c.byKey(g.prey),f=cur&&cur.rout<.5&&sc(cur)+X.keep>=bv?cur:best||c.nearest(C);if(!f)return;g.prey=f.key;beastGo(g,f,C);g.setRun(c.d2(C,f.C)<X.runAt)},
  ambush(c,id,K){
    const g=B.groups[id],{m,C}=beastTick(g),hp=hpOf(m);if(!m.length)return;if(g.mark==null)g.mark=hp;g.phase=g.phase||'hide';
    if(g.phase==='hide'){if(!g.lurk)g.lurk=beastCover(c,C,beastNum(K,'cover'));const R=beastNum(K,'strike');let near=null,nd=R;
      for(const f of c.L)for(const e of f.m)for(const u of m){const d=c.d2(e,u);if(d<nd){nd=d;near=f}}
      if(c.d2(C,g.lurk)>20)g.mark=hp;// (only a wound while lying in wait springs it)
      if(!near&&hp>=g.mark&&g.t<beastNum(K,'wait')){g.standAt(g.lurk.x,g.lurk.y);g.setRun(false);return}
      const f=near||c.nearest(C);if(!f)return;c.n.strike++;if(m.filter(u=>!seenBy(f.rep.team,u)).length*2>m.length)c.n.unseen++;g.phase='strike';g.prey=f.key;beastGo(g,f,C);return}
    // (sprung: out of hiding, seen by the side they fight while they fight (terrain.js sightStep: as if each had just struck)
    const cur=c.byKey(g.prey),f=cur&&cur.rout<.5?cur:c.nearest(C,true)||cur;if(f){g.prey=f.key;beastGo(g,f,C);for(const u of m)(u.rv||(u.rv=[]))[f.rep.team]=B.t}},
  swoop(c,id,K){
    const g=B.groups[id],X=BEAST_TACTICS.swoop,{m,C}=beastTick(g);if(!m.length)return;g.phase=g.phase||'circle';
    if(g.phase==='wheel'){if(g.t<X.wheel&&c.d2(C,{x:g.ax,y:g.ay})>25)return;g.phase='circle';g.t=0}
    // (its mark: shooters, then the foe's edges (far from their middle) and rear (beyond their middle from us))
    const Y=X.pick,dM=c.d2(c.mine,c.M),f=beastMark(c,'swoop',C,e=>Y.shot*e.shot+Y.edge*Math.min(1,c.d2(e.C,c.M)/200)+Y.rear*clamp((c.d2(e.C,c.mine)-dM)/150,-1,1)-c.d2(e.C,C)/Y.far,Y.keep);
    if(!f)return;if(g.prey!==f.key&&g.phase!=='dive'){g.prey=f.key;g.phase='circle';g.t=0}
    if(g.phase==='dive'){beastGrips(g,m,c.team);if(g.inMelee>=X.dive||g.t>=X.diveMax){const p=awayFrom(C,f.C,X.out);g.moveTo(p.x,p.y,{run:true});g.phase='wheel';g.t=0;g.inMelee=0;g.side=-(g.side||1);return}beastGo(g,f,C);return}
    const rear=(f.face??Math.atan2(c.mine.y-f.C.y,c.mine.x-f.C.x))+Math.PI,at=beastCircle(c,g,C,f,rear+X.off*(g.side||1),X);
    if(at!=='going'||g.t>=X.circleMax){c.n.dive++;g.phase='dive';g.t=0;g.inMelee=0;beastGo(g,f,C)}},
  blob(c,id,K){const g=B.groups[id];beastTick(g);if(g.order!=='advance')g.advance();g.setRun(false)}};
/* (a wood to lie in wait in: the nearest spot within R px of C deep in one (wood all round it two cells out: the pack fits), clear px at least
   from the foe's middle, that they can walk to; none: where they stand) */
function beastCover(c,C,R){const T=B.terrain;if(!(R>0)||!T||!T.has.wood)return{x:C.x,y:C.y};
  const cs=T.cs,n=Math.ceil(R/cs),deep=(x,y)=>[[0,0],...[0,1,2,3,4,5,6,7].map(k=>[Math.cos(k*Math.PI/4)*2*cs,Math.sin(k*Math.PI/4)*2*cs])].every(([dx,dy])=>groundAt(x+dx,y+dy)===TKIND.wood);let best=null,bd=Infinity;
  for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++){const d=Math.hypot(i,j)*cs,p={x:C.x+i*cs,y:C.y+j*cs};
    if(d>R||d>=bd||p.x<8||p.x>BW-8||p.y<fieldTop()||p.y>fieldBot()||c.d2(p,c.M)<BEAST_TACTICS.ambush.clear||!deep(p.x,p.y))continue;best=p;bd=d}
  return best&&c.reach(C,best)?best:{x:C.x,y:C.y}}
/* the captain's beasts, once a think (commander.js captain): each group its kind's way; the packs on one prey bite together once all
   are on their sides. None in sight: those not lying in wait go looking, as the captain's own would (captainSearch); an army
   falling back takes its beasts with it */
function captainBeasts(team,ck,S,ids){
  const Q=captainMem(ck),P=Q.beast||(Q.beast={mark:{},n:{bite:0,back:0,regroup:0,join:0,dread:0,rush:0,strike:0,unseen:0,dive:0}}),L=ids.filter(id=>B.groups[id].order!=='withdraw'&&grpUnits(id).some(u=>!u.rout));
  if(team===1&&B.fallBack){for(const id of L)B.groups[id].withdraw();return}
  const hid=id=>{const g=B.groups[id];return beastKind(id).way==='ambush'&&(g.phase||'hide')==='hide'&&g.t<beastNum(beastKind(id),'wait')};
  if(!S.foes.length){for(const id of L)if(hid(id))beastTick(B.groups[id]);
    const seen=B.fog&&Q.seen||0;if(B.t-Math.max(B.lastHit||0,seen)>FOE_CMD.lull||B.fog&&B.t>FOG.scout&&!foesKnown(team))captainSearch(team,{beasts:L.filter(id=>!hid(id))});return}
  const c=beastCtx(team,S,Q),packs=L.filter(id=>beastKind(id).way==='pack');c.packs=packs.map(id=>B.groups[id]);
  P.packC=packs.length?centroid(packs.flatMap(grpUnits)):null;
  for(const id of L){const K=beastKind(id);BEAST_WAYS[K.way](c,id,K)}
  // (the packs on one prey all on their sides: they bite as one)
  for(const g of c.packs)if(g.phase==='wait'&&c.packs.every(o=>o.prey!==g.prey||o.phase!=='circle')){const f=c.byKey(g.prey),m=grpUnits(g.id);if(f&&m.length)packBite(c,g,f,centroid(m))}
  packDread(c)}
// (a prey bitten from two sides at once or more (packs at grips gap rad apart round its middle): its morale shaken, dread a think)
function packDread(c){const X=BEAST_TACTICS.pack;if(B.noMorale)return;
  for(const f of c.L){const a=[];for(const g of c.packs){if(g.phase!=='bite'||g.prey!==f.key)continue;const m=atGrips(grpUnits(g.id),c.team);if(m.length){const C=centroid(m);a.push(Math.atan2(C.y-f.C.y,C.x-f.C.x))}}
    if(!a.some((x,i)=>a.some((y,j)=>j>i&&angGap(x,y)>=X.gap)))continue;const r=resolveOf(f.rep);if(r&&!r.routed){r.shock(X.dread);c.n.dread++;moraleSay(f.rep,'Surrounded!','#ffb04a',.6)}}}
