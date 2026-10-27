'use strict';
/* ---------- waylay: a band (often) or a lord (rarely) lies in wait in the trees by a road, by day, for whoever passes that it
   can beat. It picks a forest tile within look tiles of it and road tiles of a road (not on it), walks there (its prints lead
   off the road: tracks.js) and stands for wait hours (a lord lordWait: he has a war to ride to), at most share of the bands at
   once; night, or the time up, ends it. Unseen while it waits (worldobject.js spotted). Your sight sources (sources: your band
   today, by Scouting, slower if you hurry, less by night; a pet or a scout later) spot it within their reach: then it is shown,
   lying in wait, and springs on no one you lead. Unspotted, you within reach of it: it springs, a battle with you caught off
   guard (morale.js Surprise). Another party passing within meet px that it would fight: that party sees it first by a chance
   of its kind (sees, once each), else it is waylaid: a map fight (fights.js) in which the ambusher fights fight times as hard
   for fightFor of its length. ---------- */
const WAYLAY={band:.01,lord:.002,share:.25,wait:[3,6],lordWait:[1,2],look:6,road:2,meet:26,odds:.7,
  spot:{base:30,scout:12,hurry:.7,night:.7},sees:{patrol:.5,lord:.35,cparty:.35,band:.3,caravan:.2},fight:1.5,fightFor:.3};
class Waylay{
  static of(o){return o.waylay||null}
  static hidden(o){return !!o.waylay&&!o.waylay.seen}
  // your sight sources, each {x, y, r} (your band now; a scouting pet or a rider of yours later)
  static sources(){const S=WAYLAY.spot;return [{x:P.x,y:P.y,r:(S.base+S.scout*skill('scout'))*(G.hurry?S.hurry:1)*(Clock.isDay?1:S.night)}]}
  // (a forest tile beside a road, nearest it within look tiles: its middle; none: null)
  static spot(o){const X=WAYLAY,tx=Math.floor(o.x/TILE),ty=Math.floor(o.y/TILE);let best=null,bd=Infinity;
    for(let j=-X.look;j<=X.look;j++)for(let i=-X.look;i<=X.look;i++){const u=tx+i,v=ty+j;if(tAt(u,v)!==T_FOREST)continue;const x=(u+.5)*TILE,y=(v+.5)*TILE,d=i*i+j*j;if(d<bd&&roadNear(x,y,X.road)){best={x,y};bd=d}}return best}
  // it takes to the trees, now and then by day (rate a second; a band under share of them waiting)
  static consider(o,d,lord=false){const X=WAYLAY;if(o.waylay||!Clock.isDay||o.inside||inFight(o)||Math.random()>=(lord?X.lord:X.band)*d)return false;
    if(!lord&&bandits.filter(b=>b.waylay).length>=Math.max(1,bandits.length*X.share))return false;const at=this.spot(o);if(!at)return false;
    const [a,b]=lord?X.lordWait:X.wait;o.waylay={x:at.x,y:at.y,until:Clock.hours()+a+Math.random()*(b-a),seen:false,met:[]};return true}
  // one think while it waits: false (it is over, the brain goes on), 'met' (it sprang on you: the world stops), else true
  static step(o,sp){const w=o.waylay,X=WAYLAY;if(!w)return false;if(!Clock.isDay||Clock.hours()>=w.until){delete o.waylay;return false}
    if(G.chase===o||w.seen&&TravelAwareness.sees(o)){delete o.waylay;return false}// (you ride at it, or it is found out and knows it)
    const dx=w.x-o.x,dy=w.y-o.y,d=Math.hypot(dx,dy);if(d>2){walk(o,dx,dy,Math.min(d,sp));return true}
    if(!w.seen&&this.springs(o)){delete o.waylay;this.onYou(o);return 'met'}
    for(const p of this.passing(o)){w.met.push(uidOf(p));if(Math.random()<(X.sees[p.mapKind]||0))continue;delete o.waylay;const f=startFight([o],[p]);if(f)f.amb={side:0,until:f.dur*X.fightFor};return false}
    return true}
  // (you within reach, free to be met, a foe it would fall on)
  static springs(o){if(P.stay||G.modal||G.encCool>0||o.cool>0||Math.hypot(P.x-o.x,P.y-o.y)>=worldBattleReach(o))return false;
    return o.mapKind==='lord'?hostileTo(o.fac)&&!lordSpares(o):stance(o.power(),o)!=='afraid'}
  static onYou(o){log((o.mapKind==='lord'?lordName(o)+'’s men':o.label())+' burst from the trees!','bad','war');
    if(o.mapKind==='lord')startEncounter({kind:'lord',ref:o,list:o.troops.slice(),btype:{kind:'ambush',hid:1}});else startEncounter({kind:'party',ref:o,n:o.troops.length,list:o.troops.slice(),band:o.kind||'bandits',btype:{kind:'ambush',hid:1}})}
  // the parties passing within meet px that it would fall on (at war with it, not too strong), each once
  static passing(o){const X=WAYLAY,w=o.waylay;return [...W.lords,...W.patrols,...W.caravans,...bandits,...cparties()].filter(p=>p!==o&&!p.dead&&!p.gone&&!p.inside&&!inFight(p)&&p.troops?.length&&!w.met.includes(uidOf(p))&&Math.hypot(p.x-o.x,p.y-o.y)<X.meet&&armyRelation(o,p)<0&&o.power()>=p.power()*X.odds)}
  // each frame: your sources spot the ambushes within their reach
  static sight(){for(const o of [...bandits,...W.lords]){const w=o.waylay;if(!w||w.seen||!this.sources().some(s=>Math.hypot(s.x-o.x,s.y-o.y)<s.r))continue;w.seen=true;log('Your scouts spot men lying in wait in the trees to the '+compass(o.x-P.x,o.y-P.y)+'.','gold','war')}}
}
