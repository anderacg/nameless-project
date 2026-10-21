'use strict';
/* ---------- folk: workers at the estates ---------- */
// W.folk: workers, only around holdings near you (not saved). Every estate's workers live and work at it, inside its building
// (unseen), or in the morning and at midday out on its own ground (FIELD), and once a day carry what they made to their holding:
// each sets out at his own hour between the afternoon and dusk (DELIVER), walks to its gate with his load, stops in a little
// while, and walks back to the estate and in again. Met at their estate (a click on it: estates.js estateMeet) while inside; one
// out on its ground or on the road, where he is (to talk to, hire, rob or press-gang).
// st: 'in' (at work inside), 'field' (at work on the estate's ground), 'out' (to the holding, loaded), 'town' (delivering,
// inside its gate), 'back' (home to the estate)
// a worker (made an EstateWorker in place: asWorker): a world object (parties.js), seen and met only out of doors
class EstateWorker extends WorldObject{
  get mapKind(){return 'worker'}
  here(){return W.folk.includes(this)}
  get meetsAnyTime(){return true}
  meet(){workerMeet(this)}
  inView(V){return folkSeen(this)&&Math.abs(this.x-P.x)<=V*1.3&&Math.abs(this.y-P.y)<=V*1.3}
  // (at work inside: met at his estate, estates.js; out on its ground, or on the road with a delivery, where he is)
  pick(at){if(folkSeen(this))at.add(this,6,4)}
  // the people's figure with his trade's tool, the home's race, his load on his back on the way to the holding or back from his work (folkSprite); his
  // fraction of a pixel (subT) kept inside save/restore
  draw(ents,cam,V){if(!this.inView(V))return;const f=this;
    ents.push({y:f.y,f:()=>{ctx.save();subT(f);const fr=f.moving&&mapStepping(f)?(frameOf(f,WALK.foot,WALK.n)+Math.floor(f.ph*WALK.n))%WALK.n:0,t=townBy(f.home),s=folkSprite(f.job,fr,t&&t.races?t.races[0]:'human',Math.floor(f.ph*7),f.st==='out'||f.load),sx=Math.round(f.x-cam.x),sy=Math.round(f.y-cam.y);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-2,sy-1,5,2);ctx.save();ctx.translate(sx,sy);if(f.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-8,-14);ctx.restore();ctx.restore()}})}
  tip(){return '<b>'+(this.name?this.name+', '+this.job:cap1(this.job))+'</b><small>Of '+this.home+'</small><span class="act">Click: talk</span>'}
}
const asWorker=asClass(EstateWorker);
// (the estates whose workers you have come near: town|estate; forgotten once you are far)
const FOLK_SEEN=new Set();
const dayPart=()=>Clock.frac;
// the hours a delivery may start (share of the day: the afternoon to the end of dusk), and how long it takes inside the gate
const DELIVER={from:.375,to:.575,stop:[1.5,3.5]};// (afternoon to dusk, the day half of 50/50: core.js NIGHT_AT)
// the hours of field work (the morning and midday, to the first delivery), the share of workers out on a day (each by his id and
// the day), their pace (px), how long they stop at a stop of their round and at its work (a tree, the rock, the pier's end), how
// far from the estate their round may go (tiles), and how many spots one works just outside the door
const FIELD={from:.07,to:DELIVER.from,out:.6,speed:26,carry:.7,hurry:37,pause:[1.5,5],work:[3,6],reach:4,spots:[2,3]};
/* each worker is someone: id (his holding, estate and number there), a name and a look (v) of his people, seeded from that id
   (FOLK_COUNT: how many each estate has had, this session; never saved). Recruited where he works (workerRecruit), he leaves his
   estate a pair of hands short (t.lost[k]: the days the gaps fill again) until someone new moves in, REFILL_DAYS later */
const FOLK_NAMES={human:['Alys','Bran','Cedric','Dora','Edwin','Gwen','Hob','Ida','Jory','Maud','Ned','Osric','Peg','Rafe','Tilda','Wat'],
  dwarf:['Bofri','Dagna','Durli','Grimma','Helga','Korri','Nali','Thrain','Ulfa','Vigdis'],elf:['Aelin','Caelir','Elowen','Faelar','Ilyth','Lorien','Naeris','Saelith','Thalia','Varis'],
  orc:['Brak','Durza','Gash','Hruk','Krenna','Mogg','Nazra','Rukk','Shagra','Ugak']};
const FOLK_COUNT=new Map(),REFILL_DAYS=3;
const folkHash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
function folkName(f,race){const N=FOLK_NAMES[race]||FOLK_NAMES.human,h=folkHash(f.id);f.name=N[h%N.length];f.v=(h>>>8)%4;return f}
// the hands an estate is short (recruited away, not yet replaced), and the share of its work still done
const lostHands=(t,k)=>((t.lost||{})[k]||[]).filter(d=>d>G.day).length;
const handsLeft=(t,k)=>{const n=lostHands(t,k);return n?Math.max(0,1-n/Math.min(3,bldLv(t,k)+1)):1};
// a worker's trade as a soldier (a quarry's miners are quarrymen), the peasant he becomes (data/units.js), and why not
const tradeOf=f=>f.k==='quarry'?'quarryman':f.job;
const recruitKind=(t,f)=>peasantKind(t.races[0],tradeOf(f));
function workerRecruitWhy(t,f){const k=recruitKind(t,f),c=hireCost(k);
  return P.fac&&P.fac===t.owner?'Your employer’s people':remembers(t,f)?'They will not follow you':partyRoom()<1?'Your band is full':!partyRoster(P).canAdd(k)?'No room for another group':P.gold<c?'Not enough gold':t.owner!=='player'&&!canHire(t,k)?'They do not trust you yet':''}
function workerRecruit(f){const t=townBy(f.home);if(!t||!W.folk.includes(f)||workerRecruitWhy(t,f))return false;const k=recruitKind(t,f),c=hireCost(k);
  P.gold-=c;P.add(k);f.gone=true;W.folk=W.folk.filter(x=>x!==f);t.pop=Math.max(10,(t.pop||0)-1);t.lost=t.lost||{};t.lost[f.k]=[...(t.lost[f.k]||[]).filter(d=>d>G.day),G.day+REFILL_DAYS];
  if(t.owner!=='player')addRep(t.name,-2,true);log(f.name+' the '+f.job+' takes your coin and joins your band as '+an(ST[k].n.toLowerCase())+'. The '+ESTATES[f.k].n.toLowerCase()+' of '+t.name+' is a pair of hands short for a few days.','gold');return true}

/* workers */
function folkHome(t){return{x:t.x+rint(-6,6),y:t.y+10}}
// an estate's door: where its workers go in and come out (the front of its building)
function folkDoor(t,k){const sp=bldSpots(t)[k];return sp?{x:sp.x+rint(-3,3),y:sp.y+5}:folkHome(t)}
// out on the road: on the way to the holding or back; seen on the map (and met where he is): on the road or at work out of doors
const folkOut=f=>f.st==='out'||f.st==='back';
const folkSeen=f=>folkOut(f)||f.st==='field';
/* field work: in the field hours each worker is out on his estate's ground or at work inside, by his id and the day (fieldOut).
   Out, he walks from its door to his day's round (fieldPlan: seeded by his id and the day, every stop within FIELD.reach of the
   estate and on ground he can walk) and works it, stopping a while at each stop: a woodcutter from the log yard to a tree in the
   woods near by, chopping, and back to the yard with the log, then another tree; a miner or quarryman between the pit and the
   nearest rock or hill, back with what he cut; a farmer along a row of his fields and back, stopping to work; a herder round the
   pens, outside the fence; a fisher out to the end of the pier and back. With nothing of his trade in reach, he works just outside
   the door (a herder by the pens, a woodcutter at the log yard). He goes in by the way he came at the end of the hours, or while
   bandits or a beast are near (folkThreat), the holding fears you or is besieged, and comes out again once it is safe */
const fieldTime=now=>now>=FIELD.from&&now<FIELD.to;
const fieldOut=f=>folkHash(f.id+'|'+G.day)%1000/1000<FIELD.out;
// (a bandit band or a beast within r of (x, y): the workers keep clear of both)
const folkThreat=(x,y,r)=>bandits.some(b=>Math.hypot(b.x-x,b.y-y)<r)||W.monsters.some(m=>Math.hypot(m.x-x,m.y-y)<r);
const fieldDanger=(t,f)=>Timed.of(t).has('fear')||besieged(t)||folkThreat(f.x,f.y,WORLD_SCALE.ai.folkBandit);
// the stretches of an estate's front row (px across its tile) its 1st, 2nd and 3rd man work along (inner: by a town workshop's door)
const FRONT_AT={mine:[[10,15.5],[4.5,9.5],[.5,4.5]],inner:[[3,7],[9,13],[6,10]],_:[[.5,4.5],[11.5,15.5],[5,11]]};
// rock a miner cuts: hills, or ground at the foot of a mountain
const rockAt=(x,y)=>tAt(x,y)===T_HILL||passable(tAt(x,y))&&nearT(x,y,T_MOUNT,1);
/* his day's round: door (where he goes in and out); loop, its stops ({x, y, w: how long he stops there, load: he carries what he got
   from it to the next}); ping: to and fro along them (else round and round); home: the stop nearest the door, where he starts and
   ends; pier: a fisher's, over the planks (not the land's ways); a herder's pens (he never steps in one) and out: his way from the
   door to home round them when they hem the door in (penWay) */
function fieldPlan(t,f){
  const R=seeded(folkHash(f.id+'|'+G.day+'|w')),l=lotAt(t,f.k),p=bldSpots(t)[f.k],door={x:f.x,y:f.y},loop=[],pl={door,loop,R,day:G.day,ping:true,home:0,pier:false,out:[]},
    rk=Math.max(0,W.folk.filter(x=>x.home===f.home&&x.k===f.k).indexOf(f)),stop=(x,y,w,load)=>({x,y,w:w||FIELD.pause,load:!!load}),pick=a=>a[(rk+Math.floor(R()*2))%Math.min(a.length,3)];// (rk: which man of its crew he is)
  if(!l||!p){loop.push(stop(door.x,door.y));return pl}
  const X=p.tx*TILE,Y=p.ty*TILE,far=FIELD.reach*TILE-8,fs=PLOTS[f.k]?plotsAt(t,f.k,bldLv(t,f.k)):[],pr=f.k==='port'&&pierOf(t);
  // (just outside the door, in front of the building: its front row's last pixel, each man to a stretch of it, FRONT_AT)
  const front=w=>{const S=FRONT_AT[f.k]||(INNER.includes(f.k)?FRONT_AT.inner:FRONT_AT._),[a,b]=S[rk%S.length];return stop(X+a+R()*(b-a),Y+15+R()*.8,w)};
  // (free tiles of a kind within reach, walked to straight from a: the nearest first)
  const around=(a,ok)=>{const r=FIELD.reach,out=[];for(let y=p.ty-r;y<=p.ty+r;y++)for(let x=p.tx-r;x<=p.tx+r;x++){const s={x:x*TILE+4+R()*8,y:y*TILE+9+R()*5};
    if(ok(x,y)&&passable(tAt(x,y))&&!lotOf(x,y)&&Math.hypot(s.x-p.x,s.y-p.y)<=far&&clearLine(a.x,a.y,s.x,s.y))out.push(s)}return out.sort((u,v)=>Math.hypot(u.x-a.x,u.y-a.y)-Math.hypot(v.x-a.x,v.y-a.y))};
  if(pr){const len=10+bldLv(t,'port')*6,v=pr.dir==='n'||pr.dir==='s',sg=pr.dir==='s'||pr.dir==='e'?1:-1,o=R()*2-1.5,a=sg*(len-2-R()*3);pl.pier=true;
    loop.push(stop(pr.x,pr.y,[.5,1.5]),stop(v?pr.x+o:pr.x+a,v?pr.y+a:pr.y+o,FIELD.work))}
  // (a woodcutter's trees at the wood's edge first: he stands in the clearing before one, where nothing is painted (worldart.js
  // isClear) and the woods begin 3 px up)
  else if(f.k==='lumber'||f.k==='mine'){const y=front([1,2.5]),all=around(y,f.k==='lumber'?(x,y)=>tAt(x,y)===T_FOREST:rockAt),
      edge=f.k==='lumber'?all.map(s=>{const Y0=Math.floor(s.y/TILE)*TILE;for(let y=Y0+15;y>=Y0+4;y--)if(isClear(s.x,y)&&!isClear(s.x,y-3))return{x:s.x,y:y+.5};return null}).filter(Boolean):[],to=edge.length?edge:all;
    if(to.length){const a=pick(to),b=to[(to.indexOf(a)+1)%Math.min(to.length,4)];pl.ping=false;loop.push(y,stop(a.x,a.y,FIELD.work,true),front([1,2.5]),stop(b.x,b.y,FIELD.work,true))}
    else loop.push(y,front())}
  else if(f.k==='quarry'&&fs.length){const [qx,qy]=fs[rk%fs.length],y=stop(qx*TILE+3+R()*9,qy*TILE+6+R()*8,[1,2.5]),to=around(y,rockAt);
    if(to.length){const a=pick(to);loop.push(y,stop(a.x,a.y,FIELD.work,true))}else loop.push(y,stop(qx*TILE+3+R()*9,qy*TILE+6+R()*8))}
  // (a farmer to a row of his own: across the plots beside his in that row, stopping to work along it)
  else if(f.k==='farm'&&fs.length){const T=fs[(folkHash(t.name+'|farm|'+G.day)+rk)%fs.length],has=x=>fs.some(c=>c[0]===x&&c[1]===T[1]),ry=T[1]*TILE+5+R()*9;let x0=T[0],x1=T[0];while(has(x0-1))x0--;while(has(x1+1))x1++;
    const a=x0*TILE+2,b=(x1+1)*TILE-3,n=3+Math.floor(R()*2);for(let i=0;i<n;i++)loop.push(stop(a+(b-a)*(i+R()*.6)/(n-.4),ry+R()-.5,[1,2.5]))}
  // (a herder round the pens' fence: their corners and sides; where some of it is no ground to walk, to and fro along the rest)
  else if(f.k==='pasture'&&fs.length){const xs=fs.map(c=>c[0]),ys=fs.map(c=>c[1]),x0=Math.min(...xs)*TILE-2,x1=(Math.max(...xs)+1)*TILE+1,y0=Math.min(...ys)*TILE-1,y1=(Math.max(...ys)+1)*TILE+2,mx=(x0+x1)/2,my=(y0+y1)/2;
    const ring=[[x0,y0],[mx,y0],[x1,y0],[x1,my],[x1,y1],[mx,y1],[x0,y1],[x0,my]].map(([x,y],i)=>({...stop(x,y,i%2?FIELD.pause:[.5,1.5]),ok:passable(terrAt(x,y))&&Math.hypot(x-p.x,y-p.y)<=far}));
    if(ring.every(s=>s.ok)){pl.ping=false;const k=rk*4+Math.floor(R()*2);for(let i=0;i<8;i++)loop.push(ring[(k+i)%8])}
    else{let best=[],run=[];for(const s of ring.concat(ring))if(s.ok){run.push(s);if(run.length>best.length&&run.length<=8)best=run.slice()}else run=[];best.forEach(s=>loop.push(s))}
    if(!loop.length)loop.push(front())}
  else{const n=FIELD.spots[0]+Math.floor(R()*(FIELD.spots[1]-FIELD.spots[0]+1));for(let i=0;i<n;i++)loop.push(front())}
  // (home: the stop nearest the door, a herder's one he reaches from it clear of the pens by a pixel)
  const pen=s=>{if(f.k!=='pasture')return false;const n=Math.ceil(Math.hypot(s.x-door.x,s.y-door.y)*4);for(let k=0;k<=n;k++){const x=door.x+(s.x-door.x)*k/n,y=door.y+(s.y-door.y)*k/n;if(fs.some(c=>Math.abs(x-c[0]*TILE-8)<9&&Math.abs(y-c[1]*TILE-8)<9))return true}return false},
    by=s=>Math.hypot(s.x-door.x,s.y-door.y)+(pen(s)?1e4:0);
  loop.forEach((s,i)=>{if(by(s)<by(loop[pl.home]))pl.home=i});
  // (pens hemming the door in, no stop clear of them from it: his way to home and back round their fences (out); none, he works
  // at the door)
  if(f.k==='pasture'&&fs.length){pl.pens=fs;if(pen(loop[pl.home])){const w=penWay(fs,l,p,door,loop,far);
    if(w){pl.home=w.home;pl.out=w.way.map((s,o)=>({x:s.x,y:s.y,i:-1,o}))}else{loop.length=0;loop.push(front());pl.home=0}}}
  return pl}
// (in a pen, among the animals: m px in from its fence)
const inPen=(fs,x,y,m)=>fs.some(c=>x>c[0]*TILE+m&&x<c[0]*TILE+TILE-m&&y>c[1]*TILE+m&&y<c[1]*TILE+TILE-m);
/* a herder's way from the door (a) to the stop of his round (loop) nearest by it, round the pens' fences: on a 2-px grid within 2
   tiles of the pens and the building (l), never in a pen nor in the building above its front row, on ground he can walk within
   far of its spot (p), cut to the corners where it turns. {home: that stop, way: the corners}; null: no way */
function penWay(fs,l,p,a,loop,far){
  const S=2,xs=fs.map(c=>c[0]).concat(l.x,l.x+l.n-1),ys=fs.map(c=>c[1]).concat(l.y,l.y+l.n-1),x0=(Math.min(...xs)-2)*TILE,y0=(Math.min(...ys)-2)*TILE,
    nx=(Math.max(...xs)+3)*TILE/S-x0/S+1,ny=(Math.max(...ys)+3)*TILE/S-y0/S+1,
    free=(x,y)=>passable(terrAt(x,y))&&!inPen(fs,x,y,.5)&&!(x>l.x*TILE&&x<(l.x+l.n)*TILE&&y>=l.y*TILE&&y<(l.y+l.n)*TILE-2)&&Math.hypot(x-p.x,y-p.y)<=far,
    clear=(u,v)=>{const n=Math.ceil(Math.hypot(v.x-u.x,v.y-u.y)*2);for(let k=1;k<n;k++)if(!free(u.x+(v.x-u.x)*k/n,u.y+(v.y-u.y)*k/n))return false;return true},
    cell=s=>{const i=Math.round((s.x-x0)/S),j=Math.round((s.y-y0)/S);return i<0||j<0||i>=nx||j>=ny?-1:j*nx+i},pt=c=>({x:x0+c%nx*S,y:y0+Math.floor(c/nx)*S});
  // (breadth first from the door's cell)
  const from=new Int32Array(nx*ny).fill(-1),c0=cell(a);if(c0<0)return null;from[c0]=c0;
  for(let h=0,q=[c0];h<q.length;h++){const c=q[h],i=c%nx;for(const d of [1,-1,nx,-nx]){const m=c+d;if(m<0||m>=nx*ny||d===1&&i===nx-1||d===-1&&!i||from[m]>=0)continue;const s=pt(m);if(free(s.x,s.y)){from[m]=c;q.push(m)}}}
  // (the stop whose cell he reaches by the fewest steps)
  const len=c=>{let n=0;for(;c!==c0;c=from[c])n++;return n};let home=-1,best=1e9;
  loop.forEach((s,i)=>{const c=cell(s);if(c>=0&&from[c]>=0&&clear(pt(c),s)&&len(c)<best){best=len(c);home=i}});if(home<0)return null;
  const ps=[loop[home]];for(let c=cell(loop[home]);;c=from[c]){ps.unshift(pt(c));if(c===c0)break}ps.unshift(a);
  // (cut to its corners: from each, the farthest point in a clear line)
  const way=[];for(let i=0;i<ps.length-1;){let j=ps.length-1;while(j>i+1&&!clear(ps[i],ps[j]))j--;way.push(ps[j]);i=j}
  way.pop();return{home,way}}
// the stops from a to b along his round (the shorter way round)
function fieldWay(pl,a,b){const n=pl.loop.length,out=[];if(pl.ping){const s=b>a?1:-1;for(let i=a;i!==b;i+=s)out.push(i)}
  else{const fw=(b-a+n)%n,s=fw<=n-fw?1:-1;for(let i=a;i!==b;i=(i+s+n)%n)out.push(i)}out.push(b);return out.map(i=>({...pl.loop[i],i}))}
// out to his work: from the door to the round's first stop, or (now: as you first come near) already at a stop of it
function goField(t,f,now){const pl=f.plan&&f.plan.day===G.day?f.plan:f.plan=fieldPlan(t,f);f.st='field';f.gin=false;f.load=false;f.dn=1;
  if(now){const i=Math.floor(pl.R()*pl.loop.length);f.si=i;f.x=pl.loop[i].x;f.y=pl.loop[i].y;f.wp=[];fieldRest(f)}else{f.si=-1;f.wp=pl.out.concat(fieldWay(pl,pl.home,pl.home))}}
// a stop: a while, and maybe a turn the other way partway through
function fieldRest(f){const R=f.plan.R,w=f.plan.loop[f.si].w;f.wait=w[0]+R()*(w[1]-w[0]);f.turn=R()<.6?f.wait*R():0}
// a step toward the next point of his way (in haste on his way in), on the land's ways (world.js walk: round what is in the way),
// a fisher's over the planks; true once there
function fieldStep(f,d,fast){const p=f.wp[0],dx=p.x-f.x,dy=p.y-f.y,dd=Math.hypot(dx,dy),s=moveStep(fast?FIELD.hurry:FIELD.speed*(f.load?FIELD.carry:1),d);
  if(Math.abs(dx)>.2)f.dir=dx>0?1:-1;f.moving=true;
  if(dd<=s){WALKED.set(f,(WALKED.get(f)||0)+dd);f.x=p.x;f.y=p.y;f.wp.shift();if(p.i>=0)f.si=p.i;return true}
  if(f.plan.pier||!walk(f,dx,dy,s,f.plan.pens&&((x,y)=>!inPen(f.plan.pens,x,y,1)))){WALKED.set(f,(WALKED.get(f)||0)+s);f.x+=dx/dd*s;f.y+=dy/dd*s}return false}
// at work out of doors: home by his round and in at the door when the hours end, his day is inside or danger comes; else stop to
// stop, carrying what he got from a stop to the next
function fieldWork(t,f,d,now){const pl=f.plan,risk=fieldDanger(t,f);
  // (in by his round to home, then his way round the pens back to the door: by the corners he has passed, if still on his way out)
  if(!f.gin&&(!fieldTime(now)||!fieldOut(f)||risk||pl.day!==G.day)){f.gin=true;const at=f.wp.length&&f.wp[0].i>=0?f.wp[0].i:f.si,o=at>=0?pl.out.length:f.wp.length&&f.wp[0].o!=null?f.wp[0].o:0;
    f.wp=(at<0?[]:fieldWay(pl,at,pl.home)).concat(pl.out.slice(0,o).reverse(),[{...pl.door,i:-1}])}
  if(f.wp.length){if(fieldStep(f,d,f.gin)&&!f.wp.length&&!f.gin){f.load=false;fieldRest(f)}return}
  f.moving=false;if(f.gin){f.st='in';f.gin=false;f.load=false;return}
  f.wait-=d;if(f.turn&&f.wait<f.turn){f.dir=-f.dir;f.turn=0}
  if(f.wait<=0){const n=pl.loop.length;if(n<2)return fieldRest(f);let i=f.si+(pl.ping?f.dn:1);if(pl.ping&&(i<0||i>=n)){f.dn=-f.dn;i=f.si+f.dn}
    f.load=pl.loop[f.si].load;f.wp=[{...pl.loop[(i+n)%n],i:(i+n)%n}]}}
function updateFolk(d){
  // workers belong to nearby holdings only; far ones go, and so do those whose estate is gone (pulled down or burnt to nothing:
  // one out on the road goes home first)
  const A=WORLD_SCALE.ai;W.folk=W.folk.filter(f=>{const t=townBy(f.home);return t&&Math.hypot(t.x-P.x,t.y-P.y)<A.folkNear+A.folkForget&&!f.gone&&(f.st!=='in'&&f.st!=='field'||bldLv(t,f.k)>0)});
  for(const key of FOLK_SEEN){const t=townBy(key.split('|')[0]);if(!t||Math.hypot(t.x-P.x,t.y-P.y)>A.folkNear+A.folkForget)FOLK_SEEN.delete(key)}/* (out of reach: met afresh next time) */
  const now=dayPart(),win=now>=DELIVER.from&&now<DELIVER.to;
  for(const t of TOWNS){if(!t.bld||Math.hypot(t.x-P.x,t.y-P.y)>A.folkNear||ruined(t))continue;const sp=bldSpots(t);
    for(const k in sp){const lv=bldLv(t,k),job=ESTATES[k]&&ESTATES[k].work;if(!lv||!job)continue;
      // (as you come near, some of them there, 1 to the full crew, seeded by the estate and the day; the rest, and one taken or
      // fled, come back only slowly, so a hire or a press-gang shows)
      const key=t.name+'|'+k,first=!FOLK_SEEN.has(key),most=Math.min(3,lv+1)-lostHands(t,k),want=first?Math.min(most,1+folkHash(key+'|'+G.day)%Math.max(1,most)):most;FOLK_SEEN.add(key);
      for(let have=W.folk.filter(f=>f.home===t.name&&f.k===k).length;have<want&&(first||Math.random()<d*.02);have++){const no=(FOLK_COUNT.get(key)||0)+1;FOLK_COUNT.set(key,no);const at=folkDoor(t,k),leave=DELIVER.from+Math.random()*(DELIVER.to-DELIVER.from);
        W.folk.push(asWorker(folkName({id:key+'|'+no,folk:true,home:t.name,k,job,x:at.x,y:at.y,tx:at.x,ty:at.y,st:'in',leave,done:now>leave?G.day:-1,dir:1,ph:Math.random()*6,fresh:first},t.races[0])))}}}
  for(const f of W.folk){
    const t=townBy(f.home),fresh=f.fresh;f.fresh=false;if(!t){f.gone=true;continue}
    const threat=folkThreat(f.x,f.y,A.folkBandit)||Timed.of(t).has('fear')&&Math.hypot(P.x-f.x,P.y-f.y)<A.folkFear;
    // at work inside: out with the day's load at his hour (not while the holding is besieged or afraid); in the field hours, out
    // to his work on the estate's ground if it is his day for it and safe (already at it as you first come near)
    if(f.st==='in'){f.moving=false;if(win&&f.done!==G.day&&now>=f.leave&&!besieged(t)&&!Timed.of(t).has('fear')){const g=folkHome(t);f.st='out';f.tx=g.x;f.ty=g.y}
      else if(fieldTime(now)&&fieldOut(f)&&!fieldDanger(t,f))goField(t,f,fresh);continue}
    if(f.st==='field'){fieldWork(t,f,d,now);continue}
    // delivering inside the gate: then back to the estate
    if(f.st==='town'){f.wait-=d;if(f.wait<=0){const g=folkHome(t),door=folkDoor(t,f.k);f.x=g.x;f.y=g.y;f.tx=door.x;f.ty=door.y;f.st='back'}continue}
    const dx=f.tx-f.x,dy=f.ty-f.y,dd=Math.hypot(dx,dy);
    if(dd>1.5){f.dir=dx>=0?1:-1;f.moving=true;if(Router.travel(f,{x:f.tx,y:f.ty},moveStep(threat?FIELD.hurry:FIELD.speed*(f.st==='out'?FIELD.carry:1),d)))continue}// (laden on the way to the holding: slower)
    // (there, or no way there: in at the gate, or in at the estate's door; a new hour for tomorrow's load)
    f.moving=false;
    if(f.st==='out'){f.st='town';f.wait=DELIVER.stop[0]+Math.random()*(DELIVER.stop[1]-DELIVER.stop[0]);f.done=G.day;f.leave=DELIVER.from+Math.random()*(DELIVER.to-DELIVER.from)}
    else if(f.st==='back'){f.st='in';const door=folkDoor(t,f.k);f.x=door.x;f.y=door.y}
  }
}
// a worker on the map: the people's figure with the trade's tool (people.js workerSprite), the home's race
// (carry: his load on his back, on the way to the holding)
function folkSprite(job,frame,race,v,carry){return workerSprite(job,frame,race,v,carry)}

// (only those out on the road: the rest are at work inside their estate, or delivering inside the gate)
function drawFolk(ents,cam,V){for(const f of W.folk)asWorker(f).draw(ents,cam,V)}

/* meeting a worker: talk, hire, rob or press-gang. His window: what he says, then his deeds as key actions (window.js
   railKeyActions): Hire, Rob and Press-gang, the two last asking first (railConfirm); Rob shows what he carries and the Insight
   read of whether they would fight back (window.js insight) */
// (from: the estate it was opened from: on its rail (estates.js estateRail), Back returns there)
function workerMeet(f,from){
  const t=townBy(f.home);if(!t)return;G.wk=f;G.wkFrom=from||null;G.mode='dialog';P.tx=null;G.chase=null;ensureEcon(t);
  const short=Object.keys(GOODS).filter(g=>marketState(t,g)==='shortage').slice(0,3).map(g=>GOODS[g].n.toLowerCase()),glut=Object.keys(GOODS).filter(g=>marketState(t,g)==='surplus').slice(0,3).map(g=>GOODS[g].n.toLowerCase());
  const own=t.owner==='player',mem=remembers(t,f),rum=mem?'':rumourSay(rumourSource('estate',f.home+':'+f.k,bldSpots(t)[f.k]||f,{from:'a worker of '+t.name}));// (his estate's rumour of the day: news.js)
  const title=cap1(an(f.job))+' of '+t.name,sub=t.owner?'Subject of the '+FACS[t.owner].n:'',body='<p>&ldquo;'+(mem?warySay(f):(foodDays(t)<2?'There is hardly any bread left in '+t.name+'.':t.pros>70?'Good times in '+t.name+'.':'We get by.')+(short.length?' We are short of '+short.join(', ')+'.':'')+(glut.length?' There is plenty of '+glut.join(', ')+'.':''))+'&rdquo;</p>'+(rum?'<p>&ldquo;And have you heard? '+rum+'&rdquo;</p>':'')+
    '<p class="muted">'+t.name+': '+t.pop+' people, prosperity '+Math.round(t.pros)+'%, food for '+foodDays(t)+' days.'+(mem?' <span class="bad">They remember what you did.</span>':'')+'</p>'+
    railKeyActions(workerDeeds(t,f),own?'':'Robbing or press-ganging: reputation in '+t.name+' falls, the '+(t.owner?FACS[t.owner].n:'owner')+' resents it, and its workers flee the fields for a while.'),close=['dlg-close',null,'Leave'];
  if(from)estateRail(from,'folk',{title,sub,body,back:['wk-back',null,'Back'],close},'wk');
  else showPanel('<div class="top"><h2>'+title+'</h2><span class="muted">'+sub+'</span></div>'+body+nav(null,close));
}
// his deeds: Hire; someone else's worker, Rob and Press-gang (each asks first: wk-ask)
function workerDeeds(t,f){const own=t.owner==='player',lv=levyOf(t.races[0]),c=hireCost(lv),mem=remembers(t,f),rb=CONDUCT.robWorker,pg=CONDUCT.pressWorker;
  return [{icon:'troops',label:'Hire',act:'wk-hire',facts:['as '+an(ST[lv].n.toLowerCase()),c+'g'],why:mem?'They will not follow you':partyRoom()<1?'Your band is full':P.gold<c?'Not enough gold':!canHire(t,lv)&&!own?'They do not trust you':'',
      tip:'Hire the '+f.job+' as '+an(ST[lv].n.toLowerCase())+' for '+c+' gold: '+t.name+' has one less pair of hands.'},
    !own&&{icon:'bag',label:'Rob',act:'wk-ask',arg:'rob',facts:[robCarries(t,f),mem?'':robRead(t,f,robOdds(t,f))],why:mem?'They have nothing left to give you':'',
      tip:'Take what they carry. They may fight back, with any guards near: then it is a fight. Reputation −'+rb.rep+', honor −'+rb.honor+'; killing them costs far more. It asks you first.'},
    !own&&{icon:'prisoners',label:'Press-gang',act:'wk-ask',arg:'press',facts:['into your band','reputation −'+pg.rep+' · honor −'+pg.honor],why:partyRoom()<1?'Your band is full':'',
      tip:'Drag the '+f.job+' into your ranks: reputation −'+pg.rep+', honor −'+pg.honor+', morale −'+pg.morale+', and his estate remembers you for '+ROB.estate+' days. It asks you first.'}]}
/* robbing (doc/CONDUCT_RUINS_DESIGN.md §2; its numbers: ROB, data/conduct.js). What he carries goes by what he is doing (robLoot);
   whether they fight back, by their power against yours and their nerve (robOdds); given in, you take it (robTake); fighting
   back, it is a fight with them as their peasant kinds (data/units.js), and the estate's guards if near (robFight: won,
   villagersWon; fled or lost, villagersLost). A robbed worker remembers you for days, his whole estate after a killing or a
   press-gang (t.mem: his id, or the estate's kind, to the day they forget; saved: holdings.js); while they do, they will not
   talk to you as before, nor be robbed or hired */
const robLoot=f=>ROB.loot[f.st==='field'?'in':f.st==='in'||f.st==='out'?f.st:'town'];// (at work out of doors: as at work inside)
const remembers=(t,f)=>{const m=Timed.of(t,'mem');return m.has(f.id)||m.has(f.k)};
function remember(t,key,days){Timed.of(t,'mem').extend(key,days)}
const WARY_SAY=['You’ve taken enough from us.','Leave us be. There is nothing more to take.','We remember you. Go away.','Please, no more. We have children to feed.'];
const warySay=f=>WARY_SAY[folkHash(f.id)%WARY_SAY.length];
// (the workers within reach of him, the estate's guards if he is within reach of it: their kinds, their power, the chance they resist)
function robOdds(t,f){const R=ROB.reach*TILE,sp=bldSpots(t)[f.k],ws=W.folk.filter(x=>x.home===f.home&&x.k===f.k&&Math.hypot(x.x-f.x,x.y-f.y)<=R);if(!ws.includes(f))ws.unshift(f);
  const gs=sp&&Math.hypot(sp.x-f.x,sp.y-f.y)<=R?estateGuards(t,f.k):[],list=ws.map(x=>recruitKind(t,x)).concat(gs),pw=rating(list),
    nerve=(ROB.nerve[t.races[0]]||1)*(Timed.of(t).has('fear')?ROB.fear:1)*((t.pros||0)>=ROB.loveAt?ROB.love:1);
  return{ws,gs,list,pw,ch:clamp(ROB.k*pw/Math.max(1,partyPower())*nerve,ROB.resist[0],ROB.resist[1])}}
function robCarries(t,f){const L=robLoot(f),[g]=jobGood(t,f.job);return (L.goods[1]?L.goods[0]+'–'+L.goods[1]+' '+GOODS[g].n.toLowerCase()+', ':'')+L.coins[0]+'–'+L.coins[1]+' coins'}
// the Insight read (window.js insight): what anyone sees, how they look, or the numbers and the chance
function robRead(t,f,o){const n=o.ws.length,g=o.gs.length,who=n>1?f.job+'s':f.job,tone=o.ch>=.5?'bad':o.ch>=.2?'gold':'good';
  return insight([(n>1?'a group of '+who+' with their':an(f.job)+' with his')+' tools'+(g?', guards about':''),
    '<span class="'+tone+'">'+(o.ch>=.5?'they look ready to fight':o.ch>=.2?'they may fight back':'they cower')+'</span>'+(g?', '+roughly(g)+' guards near':''),
    n+' '+who+(g?' and '+g+' guards':'')+', power '+o.pw+' vs your '+partyPower()+': <span class="'+tone+'">'+Math.round(o.ch*100)+'% they fight back</span>'],'know their odds')}
function robTake(t,f){const L=robLoot(f),[g]=jobGood(t,f.job),n=L.goods[1]?rint(L.goods[0],L.goods[1]):0;ensureEcon(t);
  const k=n?invAdd('good',g,Math.min(n,Math.max(1,t.stock[g]||0))):0;if(k)t.stock[g]=Math.max(0,(t.stock[g]||0)-k);const gold=rint(L.coins[0],L.coins[1]);P.gold+=gold;
  return (k?k+' '+GOODS[g].n.toLowerCase()+' and ':'')+gold+' coins'}
function robFight(t,f,o){G.wk=G.wkFrom=null;const who=o.ws.length>1?f.job+'s':f.job;log('The '+who+' of '+t.name+' will not give up what is theirs!','bad');
  startEncounter({kind:'villagers',mine:true,ref:{town:t.name,k:f.k,f,ws:o.ws,gs:o.gs.length,x:f.x,y:f.y,fac:t.owner,cool:0},list:o.list.slice(),allies:[],foes:[],word:'villagers'+(o.gs.length?' and guards':''),title:'The '+who+' of '+t.name+' fight back'})}
// won (engage.js ON_WIN.villagers): what he carried, and the dead: the estate short of their hands and remembering you
function villagersWon(e){const r=e.ref,t=townBy(r.town);if(!t)return '';if(r.gs)guardsBeaten(t,r.k);const got=robTake(t,r.f),c=CONDUCT.killWorkers,n=r.ws.length;
  r.ws.forEach(x=>x.gone=true);W.folk=W.folk.filter(x=>!r.ws.includes(x));t.pop=Math.max(10,(t.pop||0)-n);t.lost=t.lost||{};t.lost[r.k]=[...(t.lost[r.k]||[]).filter(d=>d>G.day),...r.ws.map(()=>G.day+REFILL_DAYS)];
  remember(t,r.k,ROB.estate);const cost=wrong(t,{...c,hostile:rint(c.hostile[0],c.hostile[1])});mood('cruel');
  return ' You take '+got+' from the dead. Killing the people of '+t.name+' costs you dearly: '+cost+'. Its '+ESTATES[r.k].n.toLowerCase()+' will remember you.'}
// fled, or beaten (ON_WIN.villagers lost): nothing taken, word spreads, and the holding's guards want you
function villagersLost(e){const r=e.ref,t=townBy(r.town);if(!t)return;const cost=wrong(t,CONDUCT.robFailed),c=crimeAt(t);if(c)c.until=Math.max(c.until,G.day+ROB.hostile);
  log('The people of '+t.name+' drove you off with nothing. Word spreads ('+cost+'), and its guards want you for '+ROB.hostile+' days.','bad')}
function workerAct(a,arg){
  const f=G.wk,t=f&&townBy(f.home);if(!t){closeDialog();return}
  if(a==='wk-back'){const o=G.wkFrom;G.wk=null;G.wkFrom=null;if(o)estateBack(o,'folk');else closeDialog();return}
  if(a==='wk-talk')return workerMeet(f,G.wkFrom);
  // (Rob and Press-gang ask first: what it does and costs, Rob what they carry and the read of them; Confirm does it, Back his talk)
  if(a==='wk-ask'){const d=workerDeeds(t,f).find(x=>x&&x.arg===arg);if(!d||d.why)return workerMeet(f,G.wkFrom);
    return railConfirm({title:d.label+' '+f.name+'?',sub:cap1(f.job)+' of '+t.name,text:d.tip.replace(' It asks you first.',''),facts:arg==='rob'?['They carry '+d.facts[0],d.facts[1]]:d.facts,confirm:[arg==='rob'?'wk-rob':'wk-press',null,d.label],back:['wk-talk',null,'Back']})}
  const take=()=>{f.gone=true;W.folk=W.folk.filter(x=>x!==f);t.pop=Math.max(10,t.pop-1)};
  if(a==='wk-hire'){const lv=levyOf(t.races[0]),c=hireCost(lv);if(remembers(t,f)||partyRoom()<1||!partyRoster(P).canAdd(lv)||P.gold<c||!canHire(t,lv)&&t.owner!=='player')return;P.gold-=c;P.add(lv);take();
    return notice('A new recruit','The '+f.job+' lays down the '+(f.job==='farmer'?'hoe':'tools')+' and joins your band as '+an(ST[lv].n.toLowerCase())+'. '+t.name+' has one less pair of hands.','good')}
  if(a==='wk-rob'){if(t.owner==='player'||remembers(t,f))return;const o=robOdds(t,f);remember(t,f.id,ROB.memory);if(Math.random()<o.ch)return robFight(t,f,o);
    const got=robTake(t,f),cost=wrong(t,CONDUCT.robWorker);mood('cruel');return notice('Robbed','You take '+got+'. The workers of '+t.name+' run for home. It costs you: '+cost+'.','bad')}
  if(a==='wk-press'){if(partyRoom()<1)return;const lv=levyOf(t.races[0]);if(!partyRoster(P).canAdd(lv))return;P.add(lv);take();remember(t,f.k,ROB.estate);const cost=wrong(t,CONDUCT.pressWorker);mood('cruel');
    return notice('Press-ganged','Your soldiers drag the '+f.job+' into the ranks. '+cap1(an(ST[lv].n.toLowerCase()))+' joins, unwilling, and the fields of '+t.name+' empty for days. It costs you: '+cost+'.','bad')}
}
onAct('wk-',workerAct);
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'folk',order:{frame:140},frame:updateFolk});
