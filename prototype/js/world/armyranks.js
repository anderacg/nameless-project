'use strict';
/* ---------- an AI army's ranks (doc/RANKS_DESIGN.md §6, phase 5; RANKS.aiStart, aiFight, aiDrill): every group of a party on the map
   ranks as yours do, on its own record (core/ranks.js). Its first rank set when first asked (aiRankInit: by the army's kind; a
   lord's by his level, a chieftain's own group one more; drawn from its own stream, 'army ranks', so the world's dice are as they were); it grows by what it lives through: a battle fought with you, from its
   men's experience as yours (aiBattleRanks), a fight on the map or one auto-resolved, a flat share (aiFightRanks); a lord at rest
   in a holding drills (to RANKS.aiDrill.cap), and there upgrades his rank-5 groups where it trains (aiRanksDay). New recruits keep
   a group's rank; a new group starts at the first ---------- */
// (its first rank, once)
function aiRankInit(o,g){if(!g||g.rank!=null||rankPeasant(g.type))return g;const A=RANKS.aiStart,k=o.mapKind;
  const lo=k==='lord'?1:(A[k]||[1,1])[0],hi=k==='lord'?clamp(1+Math.floor((o.lv||1)/A.lordPer),1,A.lord[1]):(A[k]||[1,1])[1];
  g.rank=clamp(rngOf('army ranks').int(lo,hi)+(k==='band'&&o.ld&&g.type==='chief'?1:0),1,RANKS.max);return g}
const aiGroups=o=>o instanceof Party&&o!==P?partyRoster(o).groups.map(g=>aiRankInit(o,g)):[];
// (a battle fought with you: each AI group its men's average and the fight's, and the win's when its side held the field)
function aiBattleRanks(b){for(const g of Object.values(b.groups)){if(g.player)continue;const men=b.units.filter(u=>u.grp===g.id&&!u.leader&&!u.hero&&!u.comp),u=men[0],o=u?.sourceArmy;
    if(!(o instanceof Party)||o===P||!u.sourceGroupId)continue;const rec=aiRankInit(o,partyRoster(o).groups.find(x=>x.id===u.sourceGroupId));if(!rec)continue;
    rankGain(rec,men.reduce((a,x)=>a+(x.xp||0),0)/men.length+TROOP_XP.fight+((g.team===0)===!!b.win?TROOP_XP.win:0))}}
// (a fight on the map, or one auto-resolved: each of its groups a flat share)
function aiFightRanks(o,won){for(const g of aiGroups(o))rankGain(g,won?RANKS.aiFight.win:RANKS.aiFight.lose)}
// the day's: a lord at rest in a holding drills; where it trains, his rank-5 groups upgrade (into the first of their path)
function aiRanksDay(){for(const l of W.lords){if(l.dead||!l.inside)continue;const t=townBy(l.inside),r=partyRoster(l);
  for(const g of aiGroups(l)){if(rankOf(g)<RANKS.aiDrill.cap)rankGain(g,RANKS.aiDrill.xp);if(t?.T?.train&&rankReady(g)&&UP[g.type]&&!rankPeasant(g.type))r.upgrade(g.id,UP[g.type][0])}}}
Systems.add({name:'army ranks',order:{day:213},day:aiRanksDay});
// (its Look card's line: how seasoned its groups are)
function rankTip(o){const gs=aiGroups(o).filter(g=>!rankPeasant(g.type));if(!gs.length)return '';const rs=gs.map(rankOf),lo=Math.min(...rs),hi=Math.max(...rs);
  return '<small>Ranks '+(lo===hi?lo:lo+'–'+hi)+' '+rankBadge(gs[rs.indexOf(hi)].type,hi,10)+'</small>'}
