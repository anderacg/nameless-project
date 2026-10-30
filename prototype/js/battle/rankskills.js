'use strict';
/* ---------- a group's rank in battle (doc/RANKS_DESIGN.md phases 2 and mastery; data/ranks.js RANKS, RANK_SKILLS): your group's
   rank, proficiency and mastery picks from your roster (core/ranks.js), an AI army's from its own (world/armyranks.js; one
   with no army on the map, a holding's walls or a lab's: RANKS.ai); a soldier's
   role (spear, bow; none: a role not yet on a ladder); the ladder's abilities unlocked by rank (groupHasAbility), each mastery pick
   of one its up more (rankUp: an ability's dur, rankDur; Rally's gain, Fire arrows' mul); its passives and its proficiency (damage,
   health, aim) on each soldier once (rankUnit) or read where they act (rankSkill, rankAim: aim, the hedge of spears) ---------- */
const RANK_OF=new WeakMap(),RANKED=new WeakSet();
// (a battle group's record: yours, its roster group (or its wounded's); an AI army's on the map, its own group; else its rank alone)
function battleRec(g){if(!g)return null;if(RANK_OF.has(g))return RANK_OF.get(g);
  const u=g.units?.[0],o=u?.sourceArmy,mine=g.player&&g.sourceGroupId&&(partyRoster(P).groups.find(x=>x.id===g.sourceGroupId)||(P.woundedGroups||[]).find(w=>w.id===g.sourceGroupId)),
    theirs=!g.player&&o instanceof Party&&o!==P&&u.sourceGroupId&&aiRankInit(o,partyRoster(o).groups.find(x=>x.id===u.sourceGroupId)),rec=mine||theirs,type=rec?.type||g.type||u?.type;// (an AI army's own: world/armyranks.js)
  const r=rec||{type,rank:type&&rankPeasant(type)?0:RANKS.ai};RANK_OF.set(g,r);return r}
const battleRank=g=>{const r=battleRec(g);return r?rankOf(r):0};
const unitRank=u=>battleRank(B?.groups[u.grp]);
// (a soldier's role on a ladder: spear, bow; null for the rest, characters (a leader, not his men: they carry u.lord) and beasts)
function rankRole(u){if(!u||u.hero||u.comp||u.leader||ST[u.type]?.beast)return null;const s=u.s;
  return unitClass(s)==='spear'?'spear':s.range&&!s.magic&&shotKind(u)==='bow'?'bow':null}
// (a rung of his ladder he has reached: its skill)
function rankSkill(u,id){const L=RANK_SKILLS[rankRole(u)];if(!L)return null;const r=unitRank(u);for(let i=0;i<Math.min(r,L.length);i++)if(L[i].id===id)return L[i];return null}
// (an ability his group's ladder holds: only from its rung; one another ladder holds and his does not: none; one on no ladder yet
// (Spur, Scout ahead: their roles' to come), and a role not on one: as ever)
const onLadder=id=>Object.values(RANK_SKILLS).some(L=>L.some(x=>x.ab===id));
function rankAllows(g,id){const u=abilityTroops(g)[0],L=RANK_SKILLS[rankRole(u)];if(!L)return true;const i=L.findIndex(x=>x.ab===id);return i>=0?battleRank(g)>i:!onLadder(id)}
// (a mastery's gain on a skill or ability of his group's ladder: each pick of it, its up's key)
function rankUp(g,id,key){const rec=battleRec(g),u=g&&abilityTroops(g)[0]||g?.units?.[0],L=RANK_SKILLS[rankRole(u)],k=L&&L.find(x=>(x.id||x.ab)===id);
  return k?.up?.[key]?(rec?.picks||[]).filter(x=>x===id).length*k.up[key]:0}
const rankDur=(g,id)=>UNIT_ABILITIES[id].dur+rankUp(g,id,'dur');
// (his aim's error: his ladder's Steady aim, its mastery, his proficiency)
function rankAim(u){const g=B?.groups[u.grp],k=rankSkill(u,'aim');return (k?k.aim+rankUp(g,'aim','aim'):1)*(1-(u.prof||0))}
// (his proficiency, his ladder's passives and their mastery on his own stats, once: damage and health; reach and range
// multiplied, as a world battle's own scale is)
function rankUnit(u){if(RANKED.has(u))return;RANKED.add(u);if(u.hero||u.comp||u.leader||ST[u.type]?.beast)return;const g=B.groups[u.grp],rec=battleRec(g);if(!rec)return;
  let s=u.s;const p=rankProf(rec);if(p>0){s={...s,dmg:s.dmg*(1+p),hp:Math.round(s.hp*(1+p))};const full=u.hp>=u.max;u.max=s.hp;if(full)u.hp=s.hp;u.prof=p}
  const L=RANK_SKILLS[rankRole(u)];if(L){const r=rankOf(rec);for(let i=0;i<Math.min(r,L.length);i++){const k=L[i];
    if(k.reach)s={...s,reach:(s.reach||11)*(k.reach+rankUp(g,k.id,'reach'))};if(k.range&&s.range)s={...s,range:s.range*(k.range+rankUp(g,k.id,'range'))}}}
  u.s=s}
