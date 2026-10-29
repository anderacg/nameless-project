'use strict';
/* ---------- duels: two men who meet in melee fight each other (the owner, 2026-10-29: "units fight each other with more
   animations; commands still force them"; think Total War). A soldier's blow at a free man, himself free, pairs them (u.duel,
   each the other's): they trade blows, each meeting his partner's better (def more, at most cap: battle/defence.js) and, blocking or
   parrying him, answering at once (riposte: his next blow within that many s). Another who strikes a man in a duel catches him on his blind
   side (busy: × his chance), so flanking and numbers still tell. A duel ends when either falls, runs, or is more than his reach
   and slack away: an order that sends one elsewhere (a move, a withdrawal, another target) ends it by taking him away. While it
   lasts he keeps to his partner (actors.js step: unless sent at others), but any number may strike him; his partner down, the
   next who strikes him (and is free) is his new one. Your hero and the characters duel too (the owner's: "like a normal attack,
   with more animations"; your hero's blows are still yours or their own mind's, their defence in their stance). Never a shooter
   with his bow, a beast or a big one.
   The look of each blow (u.atkLook: drawn only, weapons.js holdOf; the rules keep troopStyle's), by his weapon (blade, heavy,
   pole) and what he fights (man, beast, big): weights in moves; a shield adds a bash. A defence's look follows the blow it meets
   (high: a swing, an overhead, a bash; low: a low cut, a thrust; t.defH), a dodge back or aside (t.defV), a heavy blow blocked
   pushes him a step back; a blow of stagger of his health or more staggers him.
   on: false, none of it (tests/harness.js turns it off for the older suites, whose fingerprints it would move) ---------- */
const DUEL={on:true,def:.3,cap:.75,busy:.35,riposte:.3,slack:8,stagger:.25,push:12,
  moves:{blade:{man:{swing:3,low:2,overhead:1,thrust:1},beast:{low:3,thrust:2,swing:1},big:{thrust:2,low:1,swing:1}},
    heavy:{man:{overhead:3,swing:2,low:1},beast:{overhead:2,low:2},big:{overhead:2,swing:1}},
    pole:{man:{thrust:4,high:1,low:1},beast:{thrust:3,low:2},big:{thrust:3,high:2}},
    shield:{man:{bash:1},beast:{bash:1},big:{}}},
  low:['low','thrust']};
const Duel={
  // (his partner still: standing, near, his; else none, the duel over)
  of(u){const p=u.duel;if(!p)return null;
    if(p.hp<=0||u.hp<=0||p.rout||u.rout||p.duel!==u||Math.hypot(p.x-u.x,p.y-u.y)-(p.s.big?12:0)>Math.max(u.s.reach||11,p.s.reach||11)+DUEL.slack){u.duel=null;return null}return p},
  // (who may duel: any man with a weapon in his hand, your hero and the characters too; never a shooter with his bow, a beast)
  can(u){return !u.s.beast&&!u.s.big&&!(u.s.range&&!u.empty&&!u.inMelee)},
  // (a blow from u at t: paired when both are free)
  meet(u,t){if(!DUEL.on||!this.can(u)||!this.can(t))return;if(!this.of(u)&&!this.of(t)){u.duel=t;t.duel=u}},
  // (his chance to meet att's blow, p as defence.js reckons it: his partner's better, another's on his blind side)
  mod(att,t,p){if(!DUEL.on)return p;const d=this.of(t);return d===att?p+DUEL.def:d?p*DUEL.busy:p},
  cap(att,t){return DUEL.on&&t.duel===att?DUEL.cap:DEFENCE.cap},
  // (the look of u's blow at t: by his weapon and what t is, a shield's bash among them; none when off or no weapon in hand)
  look(u,t){if(!DUEL.on)return null;const k=!u.s.beast&&heldWeapon(unitLook(u));if(!k)return u.atkLook=null;
    const w=POLE(k)?'pole':k==='great'||k==='bigaxe'||k==='hammer'?'heavy':'blade',f=t.s.big?'big':t.s.beast?'beast':'man',
      M={...DUEL.moves[w][f],...(Defence.shieldOf(u.s)?DUEL.moves.shield[f]:{})},ks=Object.keys(M),tot=ks.reduce((a,x)=>a+M[x],0);
    let r=Math.random()*tot;for(const x of ks){r-=M[x];if(r<0)return u.atkLook=x}return u.atkLook=ks[0]},
  // (a defence shown: its height by the blow, a dodge back or aside, a heavy blow's push; a block or parry in a duel answered at once)
  shown(att,t,k){if(!DUEL.on)return;t.defH=DUEL.low.includes(att.atkLook)?'low':'high';t.defV=k==='dodge'?(Math.random()<.5?'side':'back'):k==='block'&&att.s.dmg>=DUEL.push?'push':null;
    if(k!=='dodge'&&this.of(t)===att)t.cd=Math.min(t.cd,DUEL.riposte)},
  // (a wound of amt: a heavy one staggers him)
  struck(t,amt){if(DUEL.on&&amt>=t.max*DUEL.stagger)t.stagAt=B.t}
};
