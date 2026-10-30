'use strict';
/* ---------- a group's rank in battle (doc/RANKS_DESIGN.md phase 2; data/ranks.js RANK_SKILLS): your group's rank from your roster
   (core/ranks.js), an AI army's RANKS.ai till its armies rank; a soldier's role (spear, bow; none: a role not yet on a ladder);
   the ladder's abilities unlocked by rank (groupHasAbility), its passives on each soldier once (rankUnit: reach, range) or read
   where they act (rankSkill: aim, the hedge of spears) ---------- */
const RANK_OF=new WeakMap(),RANKED=new WeakSet();
// (a battle group's rank: yours, its roster group's; a peasants' 0)
function battleRank(g){if(!g)return 0;if(RANK_OF.has(g))return RANK_OF.get(g);
  const rec=g.player&&g.sourceGroupId&&(partyRoster(P).groups.find(x=>x.id===g.sourceGroupId)||(P.woundedGroups||[]).find(w=>w.id===g.sourceGroupId)),type=rec?.type||g.type||g.units?.[0]?.type;
  const r=rec?rankOf(rec):type&&rankPeasant(type)?0:RANKS.ai;RANK_OF.set(g,r);return r}
const unitRank=u=>battleRank(B?.groups[u.grp]);
// (a soldier's role on a ladder: spear, bow; null for the rest, characters and beasts)
function rankRole(u){if(!u||u.hero||u.comp||u.lord||u.leader||ST[u.type]?.beast)return null;const s=u.s;
  return unitClass(s)==='spear'?'spear':s.range&&!s.magic&&shotKind(u)==='bow'?'bow':null}
// (a rung of his ladder he has reached: its skill)
function rankSkill(u,id){const L=RANK_SKILLS[rankRole(u)];if(!L)return null;const r=unitRank(u);for(let i=0;i<Math.min(r,L.length);i++)if(L[i].id===id)return L[i];return null}
// (an ability his group's ladder holds: only from its rung; one another ladder holds and his does not: none; one on no ladder yet
// (Spur, Scout ahead: their roles' to come), and a role not on one: as ever)
const onLadder=id=>Object.values(RANK_SKILLS).some(L=>L.some(x=>x.ab===id));
function rankAllows(g,id){const u=abilityTroops(g)[0],L=RANK_SKILLS[rankRole(u)];if(!L)return true;const i=L.findIndex(x=>x.ab===id);return i>=0?battleRank(g)>i:!onLadder(id)}
// (his ladder's passives on his own stats, once: reach and range multiplied, as a world battle's own scale is)
function rankUnit(u){if(RANKED.has(u))return;RANKED.add(u);const L=RANK_SKILLS[rankRole(u)];if(!L)return;const r=unitRank(u);let s=u.s;
  for(let i=0;i<Math.min(r,L.length);i++){const k=L[i];if(k.reach)s={...s,reach:(s.reach||11)*k.reach};if(k.range&&s.range)s={...s,range:s.range*k.range}}u.s=s}
