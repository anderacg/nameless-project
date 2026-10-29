'use strict';
/* ---------- waylay: a band (often) or a lord (rarely) lies in wait in the trees by a road, by day, for whoever passes that it
   can beat. It picks a forest tile within look tiles of it and road tiles of a road (not on it), walks there (its prints lead
   off the road: tracks.js) and stands for wait hours (a lord lordWait: he has a war to ride to), at most share of the bands at
   once; night, or the time up, ends it. Unseen while it waits (worldobject.js spotted). Only who can see it may find it out
   (the owner, 2026-10-29: "cannot be detected by ambushed army (even player) if they cannot see them"): your sight sources
   (sources: your band today, your sight's reach (P.sight: Scouting, the ground) into the trees, trees of it; a pet or a scout
   later), while it is within one, notice it at rate a second, more with Scouting (scout each), less if you hurry: men in the
   trees are hard to make out even in sight. Noticed: it is shown, lying in wait, and springs on no one you lead. Unnoticed, you
   within spring px of it (alongside, as an ambush waits for: the battle's reach would be beyond its own sight of you), it springs, a battle with you caught off guard (morale.js Surprise). Another party it would fight, so
   long as it is within that party's own sight by its kind (see: px, trees of it into the woods), notices it at its kind's
   rate a second (sees) and passes by; unnoticed when it comes within meet px, it is waylaid: a map fight (fights.js) in which
   the ambusher fights fight times as hard for fightFor of its length. ---------- */
const WAYLAY={band:.01,lord:.002,share:.25,wait:[3,6],lordWait:[1,2],look:6,road:2,meet:26,spring:40,odds:.7,
  spot:{trees:.45,rate:.2,scout:.12,hurry:.5},
  see:{patrol:110,lord:90,cparty:90,band:95,caravan:80},sees:{patrol:1,lord:.6,cparty:.6,band:.5,caravan:.3},fight:1.5,fightFor:.3};
class Waylay{
  static of(o){return o.waylay||null}
  static hidden(o){return !!o.waylay&&!o.waylay.seen}
  // your sight sources, each {x, y, r: its reach into the trees, k: its rate a second} (your band now; a scouting pet or a rider of yours later)
  static sources(){const S=WAYLAY.spot;return [{x:P.x,y:P.y,r:vis()*S.trees,k:(S.rate+S.scout*skill('scout'))*(G.hurry?S.hurry:1)}]}
  // (noticed in d s at rate k a second)
  static notices(k,d){return Math.random()<1-Math.exp(-k*d)}
  // (a forest tile beside a road, nearest it within look tiles: its middle; none: null)
  static spot(o){const X=WAYLAY,tx=Math.floor(o.x/TILE),ty=Math.floor(o.y/TILE);let best=null,bd=Infinity;
    for(let j=-X.look;j<=X.look;j++)for(let i=-X.look;i<=X.look;i++){const u=tx+i,v=ty+j;if(tAt(u,v)!==T_FOREST)continue;const x=(u+.5)*TILE,y=(v+.5)*TILE,d=i*i+j*j;if(d<bd&&roadNear(x,y,X.road)){best={x,y};bd=d}}return best}
  // it takes to the trees, now and then by day (rate a second; a band under share of them waiting)
  static consider(o,d,lord=false){const X=WAYLAY;if(o.waylay||!Clock.isDay||o.inside||inFight(o)||Math.random()>=(lord?X.lord:X.band)*d)return false;
    if(!lord&&bandits.filter(b=>b.waylay).length>=Math.max(1,bandits.length*X.share))return false;const at=this.spot(o);if(!at)return false;
    const [a,b]=lord?X.lordWait:X.wait;o.waylay={x:at.x,y:at.y,until:Clock.hours()+a+Math.random()*(b-a),seen:false,met:[]};return true}
  // one think (dt s since the last) while it waits: false (it is over, the brain goes on), 'met' (it sprang on you: the world stops), else true
  static step(o,sp,dt=1){const w=o.waylay,X=WAYLAY;if(!w)return false;if(!Clock.isDay||Clock.hours()>=w.until){delete o.waylay;return false}
    if(G.chase===o||w.seen&&TravelAwareness.sees(o)){delete o.waylay;return false}// (you ride at it, or it is found out and knows it)
    const dx=w.x-o.x,dy=w.y-o.y,d=Math.hypot(dx,dy);if(d>2){walk(o,dx,dy,Math.min(d,sp));return true}
    if(!w.seen&&this.springs(o)){delete o.waylay;this.onYou(o);return 'met'}
    for(const p of this.passing(o)){if(this.notices(X.sees[p.mapKind]||0,dt)){w.met.push(uidOf(p));continue}if(Math.hypot(p.x-o.x,p.y-o.y)>=X.meet)continue;w.met.push(uidOf(p));delete o.waylay;const f=startFight([o],[p]);if(f)f.amb={side:0,until:f.dur*X.fightFor};return false}
    return true}
  // (you alongside, free to be met, a foe it would fall on)
  static springs(o){if(P.stay||G.modal||G.encCool>0||o.cool>0||Math.hypot(P.x-o.x,P.y-o.y)>=Math.min(WAYLAY.spring,worldBattleReach(o)))return false;
    return o.mapKind==='lord'?hostileTo(o.fac)&&!lordSpares(o):stance(o.power(),o)!=='afraid'}
  static onYou(o){log((o.mapKind==='lord'?lordName(o)+'’s men':o.label())+' burst from the trees!','bad','war');
    if(o.mapKind==='lord')startEncounter({kind:'lord',ref:o,list:o.troops.slice(),btype:{kind:'ambush',hid:1}});else startEncounter({kind:'party',ref:o,n:o.troops.length,list:o.troops.slice(),band:o.kind||'bandits',btype:{kind:'ambush',hid:1}})}
  // the parties passing that it would fall on (at war with it, not too strong), each once, while it is within their sight into the trees
  static passing(o){const X=WAYLAY,w=o.waylay;return [...W.lords,...W.patrols,...W.caravans,...bandits,...cparties()].filter(p=>p!==o&&!p.dead&&!p.gone&&!p.inside&&!inFight(p)&&p.troops?.length&&!w.met.includes(uidOf(p))&&Math.hypot(p.x-o.x,p.y-o.y)<Math.max(X.meet,(X.see[p.mapKind]||0)*X.spot.trees)&&armyRelation(o,p)<0&&o.power()>=p.power()*X.odds)}
  // each frame (d s): your sources, each that has it in sight, may notice the ambushes
  static sight(d){const S=this.sources();for(const o of [...bandits,...W.lords]){const w=o.waylay;if(!w||w.seen||!S.some(s=>Math.hypot(s.x-o.x,s.y-o.y)<s.r&&this.notices(s.k,d)))continue;w.seen=true;log('Your scouts spot men lying in wait in the trees to the '+compass(o.x-P.x,o.y-P.y)+'.','gold','war')}}
}
