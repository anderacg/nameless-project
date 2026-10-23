'use strict';
/* ---------- tracks: every band that moves on the map leaves a trail of prints (doc/WORLD_DESIGN.md §12.7, the owner's 2026-10-23;
   the numbers: data/tracks.js TRACKS). Your band, the lords' armies, bandit bands, patrols, your companions' parties, caravans,
   refugees, beasts and the wild game; never the workers about their estates (they keep to the roads and tracks, where nothing
   shows anyway), the ships, livestock or a mythic beast in flight. Kept in W.tracks (saved, capped: the oldest points dropped
   first); drawn by gfx/tracks.js; read by hovering one, or Look on the action ring (trackTip): the more Scouting, the more it
   says. The way to find a roving band or its hideout: walk along its tracks. ---------- */
// (where a print shows, and how clearly: 0 on roads and tracks as drawn, water, fords and the peaks; else its climate's, by its cover)
function trackGround(x,y){const t=terrAt(x,y);if(t===T_WATER||t===T_FORD||t===T_MOUNT||t===T_ROAD||RoadBand.on(x,y))return 0;
  return TRACKS.ground[climAt(x,y)]*(t===T_HILL?TRACKS.cover.hill:t===T_FOREST?TRACKS.cover.forest:TRACKS.cover.open)}
// (the hours a print there lasts: its climate's life, cut by its weather)
const trackLife=(x,y)=>TRACKS.life[climAt(x,y)]/TRACKS.weather[ambWeather(x,y)];
// (the world's time in tenths of an hour: a print's time)
const trackNow=()=>Math.round(Clock.hours()*10);
// (a party's size class, 0-3: data/tracks.js size)
const trackClass=n=>{const S=TRACKS.size;return n<=S[0]?0:n<=S[1]?1:n<=S[2]?2:3};
// ('northeast' to 'NE')
const trackHeading=(dx,dy)=>compass(dx,dy).replace(/north|south|east|west/g,w=>w[0].toUpperCase());
/* a trail: one band's prints since it last came off a road. k its kind ('you', 'lord', 'band:raiders', 'patrol', 'cparty',
   'caravan', 'refugee', 'mon:wolf', 'crit:deer'), n how many walked it, m 1 mounted, nm its name as it was ('' for yours, a beast's or game's: its kind's, trackWho), q a bounty's quest
   id (0: none); p its points, x, y, t three by three (whole px; t: tenths of an hour since the world began, trackNow). Kept aside,
   never saved: box (its points' bounds, for the drawing's quick skip), read (you have read it once: it trained you) and by (who
   walks it, while it is still walked: Tracks.live). In a save
   (toJSON): [k, n, m, nm, q, x0, y0, t0, then each next point as its steps from the last: dx, dy, dt] */
class Track{
  constructor(k,n,m,nm,q){this.k=k;this.n=n;this.m=m;this.nm=nm;this.q=q||0;this.p=[];this.box=[Infinity,Infinity,-Infinity,-Infinity]}
  get own(){return this.k==='you'}
  get size(){return this.p.length/3}
  // how old its stretch from point i is, in hours at now (trackNow): as old as its newer end (a band that stood a while, then walked
  // on, walked it lately); the last point's, or none while it is still walked (live: Tracks.live)
  age(i,now,live){const p=this.p,j=3*i+3<p.length?3*i+3:3*i;return j===3*i&&live?0:(now-p[j+2])/10}
  // how it walks: a style of prints (data/tracks.js step: foot, hoof, paw, rut, drag)
  get style(){const k=this.k,i=k.indexOf(':'),id=i<0?'':k.slice(i+1);
    return k==='caravan'?'rut':k.startsWith('mon:')?TRACKS.beast[id]||'paw':k.startsWith('crit:')?(CRITTERS[id]&&CRITTERS[id].size>=2?'hoof':'paw'):this.m?'hoof':'foot'}
  get beast(){return this.k.startsWith('mon:')||this.k.startsWith('crit:')}
  add(x,y,t){x=Math.round(x);y=Math.round(y);this.p.push(x,y,t);const b=this.box;if(x<b[0])b[0]=x;if(y<b[1])b[1]=y;if(x>b[2])b[2]=x;if(y>b[3])b[3]=y}
  // its first n points gone (the oldest), its bounds again
  trim(n){if(n<=0)return;this.p.splice(0,3*n);const b=this.box,p=this.p;b[0]=b[1]=Infinity;b[2]=b[3]=-Infinity;
    for(let i=0;i<p.length;i+=3){if(p[i]<b[0])b[0]=p[i];if(p[i+1]<b[1])b[1]=p[i+1];if(p[i]>b[2])b[2]=p[i];if(p[i+1]>b[3])b[3]=p[i+1]}}
  toJSON(){const p=this.p,a=[this.k,this.n,this.m,this.nm,this.q];if(p.length)a.push(p[0],p[1],p[2]);for(let i=3;i<p.length;i+=3)a.push(p[i]-p[i-3],p[i+1]-p[i-2],p[i+2]-p[i-1]);return a}
  static from(a){const tr=new Track(a[0],a[1],a[2],a[3],a[4]);if(a.length<8)return tr;let x=a[5],y=a[6],t=a[7];tr.add(x,y,t);
    for(let i=8;i+2<a.length;i+=3){x+=a[i];y+=a[i+1];t+=a[i+2];tr.add(x,y,t)}return tr}
  // what the card says of it, by your Scouting (lv) at its point i (data/tracks.js read)
  card(i,lv){const p=this.p,a=3*i,j=a+3<p.length?a+3:a,k=j>a?a:Math.max(0,a-3),dir=trackHeading(p[j]-p[k],p[j+1]-p[k+1]),age=this.age(i,trackNow()),R=TRACKS.read;
    if(this.own)return '<b>Your band’s tracks</b><small>Heading '+dir+', '+trackAgo(age)+'</small>';
    const how=this.m&&!this.beast?TRACKS.how.mounted:TRACKS.how[this.style],about=n=>n<=12?String(n):String(Math.round(n/5)*5);
    if(lv<R[0])return '<b>Tracks</b><small class="muted">Better Scouting would read more in them</small>';
    if(lv<R[1])return '<b>Tracks of about '+about(this.n)+'</b><small>'+cap1(how)+', heading '+dir+'</small>';
    if(lv<R[2])return '<b>'+trackWho(this)+', about '+about(this.n)+'</b><small>'+cap1(how)+', '+trackOld(age)+', heading '+dir+'</small>';
    return '<b>'+(this.nm||trackWho(this))+', '+this.n+' '+(this.beast?'of them':'men')+'</b><small>'+cap1(how)+', '+trackAgo(age)+', heading '+dir+'</small>'}
}
// (how old, roughly: the card from read[1]; and to the hour: from read[2] and yours)
const trackOld=h=>h<3?'fresh':h<9?'a few hours old':h<18?'half a day old':h<36?'a day old':Math.round(h/24)+' days old';
const trackAgo=h=>h<1?'within the hour':Math.round(h)+' hour'+(Math.round(h)===1?'':'s')+' ago';
// (who left a trail, by its kind: the card from read[1])
function trackWho(tr){const k=tr.k,id=k.slice(k.indexOf(':')+1);
  if(k.startsWith('band'))return BANDS[id]?BANDS[id][0].replace(' ahead',''):'Bandits';
  if(k.startsWith('mon:'))return MONSTERS[id]?MONSTERS[id].n:'Beasts';
  if(k.startsWith('crit:'))return CRITTERS[id]?CRITTERS[id].n:'Game';
  return {lord:'An army',patrol:'A patrol',cparty:'Your companion’s party',caravan:'A caravan',refugee:'Refugees'}[k]||'Someone'}
/* the system: what it samples each frame (each band that moved sample px since its last point adds one to its trail, a trail
   ending where the ground keeps none and a new one starting past it), what it trims each hour (points past keep or their ground's
   life) and whenever there are more than cap + slack (the oldest dropped till cap are left), what you see (view, seen) and the
   trail under a point (at). OPEN: each band's last point and its trail (kept aside, never saved: a load starts new trails) */
const Tracks={
  n:0,known:new Set(),OPEN:new WeakMap(),times:null,
  V:{now:0,lv:0,age:0,r2:0,v2:0,x:0,y:0},
  reset(){W.tracks=[];this.n=0;this.known=new Set();this.OPEN=new WeakMap()},
  // a new trail for o (its kind k), as it is now
  start(o,k){let n=1,m=0,nm='',q=0;
    if(o===P){n=P.troopCount()+1;m=mountDef()?1:0}
    else if(k==='caravan'){n=(o.guards||0)+1;nm='The caravan of '+o.from}
    else if(k==='refugee'){n=o.n;nm='Refugees from '+o.from}
    else if(k.startsWith('mon:')||k.startsWith('crit:'))n=o.n||1;
    else{const tc=o.tc||{};n=0;let r=0;for(const u in tc){n+=tc[u];if(ST[u]&&ST[u].mounted)r+=tc[u]}m=r*2>=n?1:0;n=k==='band'||k.startsWith('band:')?o.n||n:n+1;
      nm=k==='lord'?o.name+'’s army':k==='patrol'?watchName(o):k==='cparty'?o.label():o.name?'The '+o.name:o.ld?o.ld.name+'’s band':trackWho({k});q=o.qid||0}
    const tr=new Track(k,n,m,nm,q);tr.by=o;W.tracks.push(tr);return tr},
  // the walker of a trail still being walked (its last point on to where it is now: gfx/tracks.js), else null
  live(tr){const o=tr.by,s=o&&this.OPEN.get(o);return s&&s.tr===tr?o:null},
  // one band's moment (k its kind; off: not walking on the map now, its trail ended)
  step(o,k,off,now){const O=this.OPEN;let s=O.get(o);
    if(off){if(s)s.tr=null;return}
    if(!s){O.set(o,{tr:null,x:o.x,y:o.y,t:now});return}
    const dx=o.x-s.x,dy=o.y-s.y,d2=dx*dx+dy*dy,S=TRACKS.sample;if(d2<S*S)return;
    if(d2>S*S*TRACKS.gap*TRACKS.gap)s.tr=null;
    else if(!trackGround(o.x,o.y))s.tr=null;
    else{if(!s.tr||s.tr.gone){s.tr=this.start(o,k);if(trackGround(s.x,s.y)){s.tr.add(s.x,s.y,s.t);this.n++}}s.tr.add(o.x,o.y,now);this.n++}
    s.x=o.x;s.y=o.y;s.t=now},
  // each frame: every band on the map (no list made: the frame's own), then the cap
  frame(){if(!TRACKS.on||!W.tracks)return;const now=trackNow();
    this.step(P,'you',!!P.stay,now);
    for(const l of W.lords)this.step(l,'lord',!l.onMap(),now);
    for(const b of bandits)this.step(b,'band:'+(b.kind||'bandits'),!b.onMap(),now);
    for(const p of W.patrols)this.step(p,'patrol',!p.onMap(),now);
    for(const id in P.comps){const p=P.comps[id].party;if(p)this.step(p,'cparty',!!(p.dead||p.inside),now)}
    for(const c of W.caravans)this.step(c,'caravan',!c.onMap(),now);
    for(const r of W.refugees)this.step(r,'refugee',false,now);
    for(const m of W.monsters){const M=MONSTERS[m.id];if(M&&!M.mythic)this.step(m,'mon:'+m.id,!!m.dead,now)}
    for(const c of W.critters){const C=CRITTERS[c.id];if(C&&!C.live)this.step(c,'crit:'+c.id,false,now)}
    if(this.n>TRACKS.cap+TRACKS.slack)this.cut(TRACKS.cap)},
  // the oldest points dropped till only keep are left (a trail left with none is gone)
  cut(keep){const L=W.tracks,N=this.n;if(N<=keep)return;
    if(!this.times||this.times.length<N)this.times=new Float64Array(N+TRACKS.slack*2);
    let j=0;for(const tr of L){const p=tr.p;for(let i=2;i<p.length;i+=3)this.times[j++]=p[i]}
    const T=this.times.subarray(0,j).sort(),cut=T[j-keep];
    for(const tr of L){const p=tr.p;let i=0;while(i<p.length&&p[i+2]<cut)i+=3;if(i){tr.trim(i/3);this.n-=i/3}}
    this.sweep()},
  // each hour: from each trail's oldest end, the points whose stretch (to the next: tr.age) is past keep hours or its ground's life
  hour(){if(!TRACKS.on||!W.tracks)return;const now=trackNow();
    for(const tr of W.tracks){const p=tr.p;let i=0;while(i<p.length){const age=tr.age(i/3,now);if(age<TRACKS.keep&&age<trackLife(p[i],p[i+1]))break;i+=3}if(i){tr.trim(i/3);this.n-=i/3}}
    this.sweep()},
  // the trails left with no points gone
  sweep(){const L=W.tracks;let w=0;for(const tr of L){if(tr.p.length)L[w++]=tr;else tr.gone=true}L.length=w},
  /* what you see this frame (kept in V, no new object): the time, your Scouting, others' oldest (age, hours) and farthest
     (r2, px squared) trails seen, your sight (v2) and where you stand */
  view(){const V=this.V,s=vis(),lv=skill('scout'),S=TRACKS.see;V.now=trackNow();V.lv=lv;V.age=S.age[0]+S.age[1]*lv;
    const r=s*Math.min(1,S.range[0]+S.range[1]*lv);V.r2=r*r;V.v2=s*s;V.x=P.x;V.y=P.y;return V},
  // how clearly you see trail tr's point i (its stretch to the next): 0 not at all, else its alpha (V: view)
  seen(tr,i,V){const p=tr.p,x=p[3*i],y=p[3*i+1],age=tr.age(i,V.now,this.live(tr)),dx=x-V.x,dy=y-V.y,d2=dx*dx+dy*dy;
    if(d2>(tr.own?V.v2:V.r2)||!tr.own&&age>V.age)return 0;
    const f=1-age/trackLife(x,y);return f>0?TRACKS.alpha*trackGround(x,y)*f:0},
  // the trail you see under a point (wx, wy), within r px of its line: {tr, i}, or null (the nearest)
  at(wx,wy,r=5){if(!TRACKS.on||!W.tracks)return null;const V=this.view();let best=null,bd=r*r;
    for(const tr of W.tracks){const b=tr.box,p=tr.p;if(wx<b[0]-r||wx>b[2]+r||wy<b[1]-r||wy>b[3]+r)continue;
      for(let i=0;i+3<p.length;i+=3){const ax=p[i],ay=p[i+1],vx=p[i+3]-ax,vy=p[i+4]-ay,L=vx*vx+vy*vy,u=L?clamp(((wx-ax)*vx+(wy-ay)*vy)/L,0,1):0,ex=ax+u*vx-wx,ey=ay+u*vy-wy,d=ex*ex+ey*ey;
        if(d<bd&&this.seen(tr,i/3,V)>0){bd=d;best={tr,i:i/3}}}}
    return best},
  // you read a trail: once each, it trains your Scouting; a bounty's band's, read with Scouting enough to tell who left it (read[1]),
  // from then on shows faintly gold (gfx/tracks.js)
  read(tr){if(tr.q&&skill('scout')>=TRACKS.read[1])this.known.add(tr.q);if(tr.read)return;tr.read=true;if(!tr.own)train('scout',TRACKS.train)},
  // (in a save: the trails, and the bounties whose tracks you know; none: no key)
  save(){if(!TRACKS.on||!W.tracks||!W.tracks.length)return;return this.known.size?{l:W.tracks,kq:[...this.known]}:{l:W.tracks}},
  load(v){this.reset();if(!v||!v.l)return;W.tracks=v.l.map(a=>Track.from(a)).filter(tr=>tr.p.length);this.n=W.tracks.reduce((a,tr)=>a+tr.size,0);this.known=new Set(v.kq||[])}
};
// the card of the trail under a point on the map, as the pointer's tip or the action ring's Look shows it ('' for none): reading it
function trackTip(wx,wy){const h=Tracks.at(wx,wy);if(!h)return '';Tracks.read(h.tr);return h.tr.card(h.i,skill('scout'))}
onWorld(()=>Tracks.reset());
// (its work in the world's frame and hour: core/systems.js; first in the frame, so no frame another system ends skips it)
Systems.add({name:'tracks',order:{frame:5,hour:20},frame:()=>Tracks.frame(),hour:()=>Tracks.hour()});
Saves.add({key:'tracks',order:290,defaults:null,save:()=>Tracks.save(),load:v=>Tracks.load(v)});
