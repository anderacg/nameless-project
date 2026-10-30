'use strict';
/* ---------- a troop group's rank (doc/RANKS_DESIGN.md §1; its numbers data/ranks.js RANKS): a group record carries xp (toward its
   next rank) and rank (1 to RANKS.max; none set: 1, xp 0). It earns experience in battle (battle/resolution.js groupRanks) and
   keeps its rank whoever joins it (the owner: as in Total War); at the last rank it waits to upgrade (core/recruitment.js), after
   which it starts again. A peasants' group has no rank: its xp runs to RANKS.peasant, its first upgrade ---------- */
const rankPeasant=type=>!(ST[type]?.tier>0);
const rankOf=g=>rankPeasant(g.type)?0:g.rank||1;
const rankXp=g=>g.xp||0;
// (experience to its next rank: none at the last; a peasants' group, to its upgrade)
const rankNeed=g=>{if(rankPeasant(g.type))return RANKS.peasant;const r=rankOf(g);return r>=RANKS.max?0:RANKS.xp[Math.min(3,ST[g.type].tier)][r-1]};
// (ready to upgrade: at the last rank; a peasants' group, its experience full)
const rankReady=g=>rankPeasant(g.type)?rankXp(g)>=RANKS.peasant:rankOf(g)>=RANKS.max;
// n experience to a group: its ranks gained (a peasants' group: none, its xp up to its upgrade's)
function rankGain(g,n){if(!(n>0)||rankReady(g))return 0;let x=rankXp(g)+n,up=0;
  if(rankPeasant(g.type)){g.xp=Math.min(x,RANKS.peasant);return 0}
  let r=rankOf(g);while(r<RANKS.max&&x>=RANKS.xp[Math.min(3,ST[g.type].tier)][r-1]){x-=RANKS.xp[Math.min(3,ST[g.type].tier)][r-1];r++;up++}
  g.rank=r;g.xp=r>=RANKS.max?0:x;return up}
// (one group's rank into another, the higher kept: a merge; a group emptied into its wounded, and back)
function rankKeep(from,to){if(rankOf(from)>rankOf(to)||rankOf(from)===rankOf(to)&&rankXp(from)>rankXp(to)){to.rank=from.rank;to.xp=from.xp;if(to.rank==null)delete to.rank;if(to.xp==null)delete to.xp}}
// (a fresh start: an upgraded group)
function rankReset(g){delete g.rank;delete g.xp}
