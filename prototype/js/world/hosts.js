'use strict';
/* ---------- hosts: armies that march together (doc/HOSTS_DESIGN.md, phase 1) ----------
   A host is a leader and the armies that follow him, each still drawn and fighting as itself, never merged. On the march they walk
   in a column on the leader's own path: his trail (a point every HOSTS.crumb px, kept for each leader while he leads, never saved),
   member i making for the point (i + 1) × HOSTS.gap px back along it, so on a long road they string out along it, through a ford
   or round a wood as he went; standing still, they stand in that column behind him. A member behind its place hurries
   (HOSTS.catch); one farther than HOSTS.far (back from a patrol, a stay) makes straight for the leader first. The host goes at its
   slowest member's pace: the leader is slowed to it (paceOf). A member keeps its place: it runs off after no prey; every member
   within HOSTS.join of a battle of the leader's joins it (battle/engage.js).
   Phase 1: your host, you and your companions' parties with the order Follow (world/brains.js CompanionBrain), in the order
   they were given it (fseq). ---------- */
const HOSTS={crumb:6,gap:22,catch:1.3,far:160,join:220};
class Host{
  constructor(lead,members){this.lead=lead;this.members=members}
  // ---- your host: you and your companions' parties that follow you (none: no host)
  static yours(){const m=cparties().filter(p=>p.order==='follow'&&!p.inside&&!p.fight).sort((a,b)=>(a.fseq||0)-(b.fseq||0));return m.length?new Host(P,m):null}
  // (the host an army is in, or leads)
  static of(o){const h=this.yours();return h&&(h.lead===o||h.members.includes(o))?h:null}
  // ---- the leader's trail: a point each time he has gone crumb px, as long as the column needs
  static trailOf(o){let t=this.trails.get(o);if(!t)this.trails.set(o,t=[[o.x,o.y]]);return t}
  mark(){const o=this.lead,t=Host.trailOf(o),l=t[t.length-1];if(Math.hypot(o.x-l[0],o.y-l[1])<HOSTS.crumb)return;t.push([o.x,o.y]);
    const keep=Math.ceil((this.members.length+2)*HOSTS.gap/HOSTS.crumb)+2;if(t.length>keep)t.splice(0,t.length-keep)}
  // a member's place: (i + 1) × gap back along the trail from the leader; the trail shorter, its oldest point
  slot(o){const i=this.members.indexOf(o);if(i<0)return null;const t=Host.trailOf(this.lead);let left=(i+1)*HOSTS.gap,x=this.lead.x,y=this.lead.y;
    for(let k=t.length-1;k>=0;k--){const [px,py]=t[k],d=Math.hypot(px-x,py-y);if(d>=left&&d>0){const f=left/d;return {x:x+(px-x)*f,y:y+(py-y)*f}}left-=d;x=px;y=py}return {x,y}}
  // ---- a member's moment (go(x, y, step): its brain's way of moving there, its step at its own pace sp)
  static keep(o,sp,go){const h=this.of(o);if(!h)return false;h.mark();const L=h.lead,far=Math.hypot(L.x-o.x,L.y-o.y)>HOSTS.far,s=far?{x:L.x,y:L.y}:h.slot(o),d=Math.hypot(s.x-o.x,s.y-o.y);
    if(d>1.5)go(s.x,s.y,Math.min(d,sp*(far||d>HOSTS.gap/2?HOSTS.catch:1)));return true}
  // ---- the leader's pace: slowed to its slowest member near (within far), never faster. Their own paces, before the ground
  // (they walk where he walked a moment later: the ground slows them as it slowed him); a multiplier of his
  static base(o){return o===P?bandPace():paceRatio(listSpeeds(o.troops))*sizeMul(o.troops.length)*EscapeStamina.factor(o)}
  paceOf(){const own=Host.base(this.lead);let m=1;for(const o of this.members)if(Math.hypot(o.x-this.lead.x,o.y-this.lead.y)<=HOSTS.far)m=Math.min(m,Host.base(o)/Math.max(.01,own));return Math.max(.3,m)}
  // (your pace, as world.js moves you: your host's slowest member's, or yours)
  static yourPace(){const h=this.yours();return h?h.paceOf():1}
  // (is o one of your host's members, near enough a battle of yours to join it)
  static joins(o){const h=this.yours();return !!h&&h.members.includes(o)&&Math.hypot(o.x-P.x,o.y-P.y)<HOSTS.join}
}
Host.trails=new WeakMap();
onWorld(()=>{Host.trails=new WeakMap()});
