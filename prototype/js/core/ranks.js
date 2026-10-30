'use strict';
/* ---------- a troop group's rank (doc/RANKS_DESIGN.md §1; its numbers data/ranks.js RANKS): a group record carries xp (toward its
   next rank) and rank (1 to RANKS.max; none set: 1, xp 0). It earns experience in battle (battle/resolution.js groupRanks) and
   keeps its rank whoever joins it (the owner: as in Total War); at the last rank it waits to upgrade (core/recruitment.js), after
   which it starts again, half (RANKS.mastery.carry) of its mastery's experience its first. At the last rank its experience is
   mastery's (mxp: bronze, silver, gold at RANKS.mastery.xp), each mastery a pick (picks: a skill's id, or 'drill'). A peasants'
   group has no rank: its xp runs to RANKS.peasant, its first upgrade ---------- */
const rankPeasant=type=>!(ST[type]?.tier>0);
const rankOf=g=>rankPeasant(g.type)?0:g.rank||1;
const rankXp=g=>g.xp||0;
// (experience to its next rank: none at the last; a peasants' group, to its upgrade)
const rankNeed=g=>{if(rankPeasant(g.type))return RANKS.peasant;const r=rankOf(g);return r>=RANKS.max?0:RANKS.xp[Math.min(3,ST[g.type].tier)][r-1]};
// (ready to upgrade: at the last rank; a peasants' group, its experience full)
const rankReady=g=>rankPeasant(g.type)?rankXp(g)>=RANKS.peasant:rankOf(g)>=RANKS.max;
// (mastery: its experience, its level (0 none, 1 bronze, 2 silver, 3 gold), the experience to its next, its picks still to make)
const masteryXp=g=>g.mxp||0;
const masteryEnds=()=>RANKS.mastery.xp.reduce((a,x)=>(a.push((a[a.length-1]||0)+x),a),[]);
const masteryOf=g=>masteryEnds().filter(e=>masteryXp(g)>=e).length;
const masteryNeed=g=>{const e=masteryEnds(),m=masteryOf(g);return m>=e.length?0:e[m]-masteryXp(g)};
const masteryPending=g=>masteryOf(g)-(g.picks||[]).length;
// n experience to a group: its ranks gained (a peasants' group: none, its xp up to its upgrade's; at the last rank, mastery's)
function rankGain(g,n){if(!(n>0))return 0;if(rankPeasant(g.type)){g.xp=Math.min(rankXp(g)+n,RANKS.peasant);return 0}
  let r=rankOf(g),x=rankXp(g)+n,up=0;
  while(r<RANKS.max&&x>=RANKS.xp[Math.min(3,ST[g.type].tier)][r-1]){x-=RANKS.xp[Math.min(3,ST[g.type].tier)][r-1];r++;up++}
  g.rank=r;if(r>=RANKS.max){g.xp=0;const end=masteryEnds().pop();if(x>0)g.mxp=Math.min(end,masteryXp(g)+x)}else g.xp=x;return up}
// (one group's rank and mastery into another, the further on kept: a merge; a group emptied into its wounded, and back)
const rankPlace=g=>[rankOf(g),masteryXp(g),rankXp(g)];
function rankKeep(from,to){const a=rankPlace(from),b=rankPlace(to);if(a[0]>b[0]||a[0]===b[0]&&(a[1]>b[1]||a[1]===b[1]&&a[2]>b[2])){rankReset(to);for(const k of ['rank','xp','mxp','picks'])if(from[k]!=null)to[k]=k==='picks'?from[k].slice():from[k]}}
// (a fresh start: an upgraded group; carry, its mastery's experience carried into it first)
function rankReset(g){delete g.rank;delete g.xp;delete g.mxp;delete g.picks}
// (a mastery's pick: a skill of its ladder (data/ranks.js RANK_SKILLS, one with an up, reached), or a drill)
function masteryPick(g,id){if(masteryPending(g)<1)return false;(g.picks||(g.picks=[])).push(id);return true}
// (its proficiency: each rank above the first, and each drill picked)
const rankProf=g=>(Math.max(0,rankOf(g)-1)+(g.picks||[]).filter(x=>x==='drill').length)*RANKS.prof;
