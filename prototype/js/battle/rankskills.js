'use strict';
/* ---------- a group's rank in battle (doc/RANKS_DESIGN.md phases 2 and mastery, doc/UNIT_KITS_DESIGN.md §6, §7; data/ranks.js RANKS,
   data/kits.js KITS; its kit, battle/unitkit.js UnitKit): your group's rank and mastery picks from your roster (core/ranks.js), an AI
   army's from its own (world/armyranks.js; one with no army on the map, a holding's walls or a lab's: RANKS.ai), with what it is
   (aiOf: its lord's level, for the tech tree's skills an AI army has: KITS.aiFire; its picks made by its kind's order); a soldier's
   role on step 1's ladders (spear, bow); the skills it has (groupHasAbility; step 1, by rank: rankAllows), each mastery pick's gain
   on one (rankUp: a skill's dur, rankDur; Rally's gain, Lunge's reach ...); its rank's stats (damage and health, morale, vigor) and
   its perks on each soldier once (rankUnit, rankMor) or read where they act (rankSkill, rankAim: aim, Hedge of spears) ---------- */
const RANK_OF=new WeakMap(),RANKED=new WeakSet(),AI_OF=new WeakMap();
// (a battle group's record: yours, its roster group (or its wounded's); an AI army's on the map, its own group; else its rank alone)
function battleRec(g){if(!g)return null;if(RANK_OF.has(g))return RANK_OF.get(g);
  const u=g.units?.[0],o=u?.sourceArmy,mine=g.player&&g.sourceGroupId&&(partyRoster(P).groups.find(x=>x.id===g.sourceGroupId)||(P.woundedGroups||[]).find(w=>w.id===g.sourceGroupId)),
    theirs=!g.player&&o instanceof Party&&o!==P&&u.sourceGroupId&&aiRankInit(o,partyRoster(o).groups.find(x=>x.id===u.sourceGroupId)),rec=mine||theirs,type=rec?.type||g.type||u?.type;// (an AI army's own: world/armyranks.js)
  const r=rec||{type,rank:type&&rankPeasant(type)?0:RANKS.ai};RANK_OF.set(g,r);if(!mine&&!g.player)AI_OF.set(r,{lv:theirs&&o.mapKind==='lord'?o.lv||1:0});return r}
// (an AI's record: its lord's level (0: no lord's); none, yours)
const aiOf=rec=>AI_OF.get(rec)||null;
const battleRank=g=>{const r=battleRec(g);return r?rankOf(r):0};
const unitRank=u=>battleRank(B?.groups[u.grp]);
// (a soldier's role on step 1's ladders: spear, bow; null for the rest, characters (a leader, not his men: they carry u.lord) and beasts)
function rankRole(u){if(!u||u.hero||u.comp||u.leader||ST[u.type]?.beast)return null;const s=u.s;
  return unitClass(s)==='spear'?'spear':s.range&&!s.magic&&shotKind(u)==='bow'?'bow':null}
// (characters (a leader, not his men) and beasts: on no kit, as rankRole; on a horse: by his own numbers, else his kind's)
const ladderless=u=>!!u&&!!(u.hero||u.comp||u.leader||ST[u.type]?.beast);
const kitRode=(rec,u)=>!!(u?.s||ST[rec.type]||{}).mounted;
// (the rungs he has: his group's kit's perks (step 1: its ladders' reached rungs, its own and those it kept through an upgrade,
// core/ranks.js rankLadders); a foot drill (foot: Hedge of spears, Brace+) not while he rides: battle/dismount.js)
const NO_RUNGS=Object.freeze([]);
function rankRungs(rec,u){return !rec||ladderless(u)?NO_RUNGS:UnitKit.of(rec).rungs(kitRode(rec,u))}
function rankSkill(u,id){return rankRungs(battleRec(B?.groups[u.grp]),u).find(k=>k.id===id)||null}
// (a skill on some kind's step-1 ladder: data/kits.js KITS.ladders)
const onLadder=id=>Object.values(KITS.ladders).some(L=>L.some(x=>x.ab===id));
// (step 1: a skill his group's ladders hold: only from a rung it has; one another ladder holds and his do not: none; one on no ladder
// yet (Spur, Scout ahead), and a group on no ladder: as ever. On a kit (RANKS.statsOnly): its kit says (groupHasAbility))
function rankAllows(g,id){if(RANKS.statsOnly)return true;const u=abilityTroops(g)[0],rec=battleRec(g),has=rankRungs(rec,u).length||rec&&!ladderless(u)&&UnitKit.of(rec).ladders.some(([k])=>KITS.ladders[k]);if(!has&&!KITS.ladders[rankRole(u)])return true;
  return rankRungs(rec,u).some(k=>k.ab===id)||!onLadder(id)}
// (a mastery's gain on a skill, stance or perk of his group's: each pick of it, kept ones too, its by's key: its kit's)
function rankUp(g,id,key){const rec=battleRec(g),u=g&&abilityTroops(g)[0]||g?.units?.[0];return !rec||ladderless(u)?0:UnitKit.of(rec).up(id,key,kitRode(rec,u))}
const rankDur=(g,id)=>UNIT_SKILLS[id].dur+rankUp(g,id,'dur');
// (his kit's stats (§6: his rank's and his drills'), none for a character or a beast)
function rankStats(u){const g=B?.groups[u.grp],rec=battleRec(g);return !rec||ladderless(u)?null:UnitKit.of(rec).stats}
// (his aim's error: his perks (Steady aim) and their mastery, his rank's and drills', Fire arrows lit (unitabilities.js fireAim))
function rankAim(u){const g=B?.groups[u.grp];if(!RANKS.statsOnly){const k=rankSkill(u,'aim');return (k?k.aim+rankUp(g,'aim','aim'):1)*(1-(u.prof||0))}
  let a=1;for(const k of rankRungs(battleRec(g),u))if(k.aim)a*=k.aim;return a*(1-(rankStats(u)?.aim||0))*fireAim(u)}
// (his rank's morale points (§6), on his start: morale.js moraleInit)
const rankMor=u=>RANKS.statsOnly&&!steady(u)?rankStats(u)?.mor||0:0;
// (his rank's stats, his perks and their mastery on his own numbers, once: damage and health (on the health he has, a lab's own too),
// vigor; reach, range, swing or shot time, speed multiplied, as a world battle's own scale is; armour piercing (ap))
function rankUnit(u){if(RANKED.has(u))return;RANKED.add(u);if(u.hero||u.comp||u.leader||ST[u.type]?.beast)return;const g=B.groups[u.grp],rec=battleRec(g);if(!rec)return;
  let s=u.s;const K=UnitKit.of(rec),S=K.stats;
  if(!RANKS.statsOnly){const p=K.prof;if(p>0){s={...s,dmg:s.dmg*(1+p),hp:Math.round(s.hp*(1+p))};const full=u.hp>=u.max;u.max=Math.round(u.max*(1+p));if(full)u.hp=u.max;u.prof=p}
    for(const k of rankRungs(rec,u)){if(k.reach)s={...s,reach:(s.reach||11)*(k.reach+rankUp(g,k.id,'reach'))};if(k.range&&s.range)s={...s,range:s.range*(k.range+rankUp(g,k.id,'range'))}}
    u.s=s;return}
  if(S.dmg>0||S.hp>0){s={...s,dmg:s.dmg*(1+S.dmg),hp:Math.round(s.hp*(1+S.hp))};const full=u.hp>=u.max;u.max=Math.round(u.max*(1+S.hp));if(full)u.hp=u.max}
  if(S.vig>0&&u.vig!=null)u.vig*=1+S.vig;
  for(const k of rankRungs(rec,u)){const c={};if(k.reach)c.reach=(s.reach||11)*k.reach;if(k.range&&s.range)c.range=s.range*k.range;if(k.cd)c.cd=s.cd*k.cd;if(k.dmg)c.dmg=s.dmg*k.dmg;if(k.spd)c.spd=s.spd*k.spd;if(k.ap)c.ap=k.ap;
    if(Object.keys(c).length)s={...s,...c}}
  u.s=s}
