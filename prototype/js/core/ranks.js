'use strict';
/* ---------- a troop group's rank (doc/RANKS_DESIGN.md §1, doc/UNIT_KITS_DESIGN.md §6, §7; its numbers data/ranks.js RANKS): a group
   record carries xp (toward its next rank) and rank (1 to RANKS.max; none set: 1, xp 0). It earns experience in battle
   (battle/resolution.js groupRanks) and keeps its rank whoever joins it (the owner: as in Total War); at the last rank it waits to
   upgrade (core/recruitment.js), after which it starts again, a share (RANKS.mastery.carry) of its mastery's experience its first.
   At the last rank its experience is mastery's (mxp: Adept to Legend at RANKS.levels.ends; step 1, bronze, silver, gold), each
   level a pick (picks: data/kits.js MASTERY's ids; step 1, a ladder skill's id or 'drill'). A peasants' group has no rank: its xp
   runs to RANKS.peasant, its first upgrade ---------- */
const rankPeasant=type=>!(ST[type]?.tier>0);
const rankOf=g=>rankPeasant(g.type)?0:g.rank||1;
const rankXp=g=>g.xp||0;
// (a rank's name: Recruit to Elite)
const rankWord=r=>RANKS.names[r-1]||'';
// (experience to its next rank: none at the last; a peasants' group, to its upgrade)
const rankNeed=g=>{if(rankPeasant(g.type))return RANKS.peasant;const r=rankOf(g);return r>=RANKS.max?0:RANKS.xp[Math.min(3,ST[g.type].tier)][r-1]};
// (ready to upgrade: at the last rank; a peasants' group, its experience full)
const rankReady=g=>rankPeasant(g.type)?rankXp(g)>=RANKS.peasant:rankOf(g)>=RANKS.max;
// (mastery: its experience, its level (0 none, then Adept to Legend), its name, the experience to its next, its picks still to make)
const masteryXp=g=>g.mxp||0;
const masteryEnds=()=>RANKS.mastery5?RANKS.levels.ends:RANKS.mastery1.xp.reduce((a,x)=>(a.push((a[a.length-1]||0)+x),a),[]);
const masteryOf=g=>masteryEnds().filter(e=>masteryXp(g)>=e).length;
const masteryWord=m=>RANKS.mastery.n[m-1]||'';
const masteryNeed=g=>{const e=masteryEnds(),m=masteryOf(g);return m>=e.length?0:e[m]-masteryXp(g)};
const masteryPending=g=>masteryOf(g)-(g.picks||[]).length;
// n experience to a group: its ranks gained (a peasants' group: none, its xp up to its upgrade's; at the last rank, mastery's)
function rankGain(g,n){if(!(n>0))return 0;if(rankPeasant(g.type)){g.xp=Math.min(rankXp(g)+n,RANKS.peasant);return 0}
  let r=rankOf(g),x=rankXp(g)+n,up=0;
  while(r<RANKS.max&&x>=RANKS.xp[Math.min(3,ST[g.type].tier)][r-1]){x-=RANKS.xp[Math.min(3,ST[g.type].tier)][r-1];r++;up++}
  g.rank=r;if(r>=RANKS.max){g.xp=0;const end=masteryEnds().slice(-1)[0];if(x>0)g.mxp=Math.min(end,masteryXp(g)+x)}else g.xp=x;return up}
// (one group's rank and mastery into another, the further on kept: a merge; a group emptied into its wounded, and back)
const rankPlace=g=>[rankOf(g),masteryXp(g),rankXp(g)];
// a group's learned ladders (step 1, RANKS.statsOnly off; the owner, 2026-10-31: "upgrading won't loose skills of that unit"): its own
// kind's, at its rank, and those it kept from the kinds it was before (g.learned: a ladder's role, its rung; g.keptPicks: their
// mastery picks), each its best: [role, rungs]
function rankLadders(g){const own=typeof rankRole==='function'?rankRole({s:ST[g.type]||{},type:g.type,team:0}):null,out=own?{[own]:rankOf(g)}:{};
  for(const [k,n] of Object.entries(g.learned||{}))out[k]=Math.max(out[k]||0,n);return Object.entries(out)}
// (upgraded: its picks kept (§7: those its new kind can use count, battle/unitkit.js), its rank begun again; step 1, its ladders too)
function rankLearn(g){const L={};if(!RANKS.statsOnly)for(const [k,n] of rankLadders(g))if(n>0)L[k]=n;g.learned=L;g.keptPicks=[...(g.keptPicks||[]),...(g.picks||[]).filter(x=>x!=='drill')];if(!g.keptPicks.length)delete g.keptPicks;if(!Object.keys(L).length)delete g.learned}
function rankKeep(from,to){const a=rankPlace(from),b=rankPlace(to);if(a[0]>b[0]||a[0]===b[0]&&(a[1]>b[1]||a[1]===b[1]&&a[2]>b[2])){rankReset(to);for(const k of ['rank','xp','mxp','picks'])if(from[k]!=null)to[k]=k==='picks'?from[k].slice():from[k]}
  for(const [k,n] of Object.entries(from.learned||{}))(to.learned||(to.learned={}))[k]=Math.max(to.learned[k]||0,n);if(from.keptPicks&&!to.keptPicks)to.keptPicks=from.keptPicks.slice()}
// (a fresh start: an upgraded group; carry, its mastery's experience carried into it first)
function rankReset(g){delete g.rank;delete g.xp;delete g.mxp;delete g.picks}
// (a mastery's pick: one of its kind's menu it may take (battle/unitkit.js UnitKit opts); step 1, a reached ladder skill with an up, or a drill)
function masteryPick(g,id){if(masteryPending(g)<1)return false;(g.picks||(g.picks=[])).push(id);return true}
// (its proficiency, step 1's: each rank above the first, and each drill picked; its kit's stats: battle/unitkit.js UnitKit)
const rankProf=g=>(Math.max(0,rankOf(g)-1)+(g.picks||[]).filter(x=>x==='drill').length)*RANKS.prof;
/* old saves (§9: no migration, defaults on load): a save made before the five levels has no 'kits' piece; loaded, each of your groups'
   picks are read as the new menu's (KITS.old), and what its rank gave it on its kind's old ladder (KITS.oldRungs) it keeps as picks,
   up to its levels (its mastery's experience stands, its level read again); a ladder kept from a kind it was, as kept picks */
const KITS_V=2;
function kitsMigrate(g){const O=KITS.old,map=x=>O[x]||x,role=rankRole({s:ST[g.type]||{},type:g.type,team:0});if(g.picks)g.picks=g.picks.map(map);if(g.keptPicks)g.keptPicks=g.keptPicks.map(map);
  const R=KITS.oldRungs[role]||[];for(let i=0;i<Math.min(rankOf(g),R.length);i++){const id=R[i],L=g.picks||[];if(id&&!L.includes(id)&&L.length<masteryOf(g))(g.picks=L).push(id)}
  for(const [k,n] of Object.entries(g.learned||{}))if(k!==role)for(const id of (KITS.oldRungs[k]||[]).slice(0,n))if(id&&!(g.keptPicks||[]).includes(id))(g.keptPicks||(g.keptPicks=[])).push(id);
  delete g.learned}
Saves.add({key:'kits',order:355,defaults:0,save:()=>RANKS.mastery5?KITS_V:undefined,
  settle:v=>{if(RANKS.mastery5&&v<KITS_V)for(const g of [...partyRoster(P).groups,...(P.woundedGroups||[])])kitsMigrate(g)}});
