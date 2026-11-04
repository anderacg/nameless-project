'use strict';
/* ---------- what troubles a holding now (doc/QUESTS_DESIGN.md §2, Q1; the owner, 2026-11-04: "design the quest properly"): the
   one place the quests ask what is true about a holding, so a job is offered only for a trouble the world has. Read only: it
   draws no random number and changes nothing.
   - bands: bands (not yours, not in a fight, not gone) in its lands (territory.js landHold) or within TROUBLE.land tiles,
     nearest first, each with what the talk says of it (news 'band', 'caravan', 'raid' near it, TROUBLE.fresh days);
   - packs: beasts (not mythic) whose lair lies within TROUBLE.folds tiles of it (where they hunt: its fields and folds);
   - lairs: hideouts and camps not cleared within TROUBLE.lair tiles (where its bands may go to ground, or come from);
   - game: wild herds within TROUBLE.game tiles, by kind (data/critters.js: what each gives);
   - short: lasting goods it is short of, the shortest first (economy.js needOf, targetStock);
   - garrison: how far its garrison is below its kind's (t.T.gar), and whether a siege or a raid thinned it;
   - news(t, kinds): what really happened near it of those kinds, freshest first (world/news.js W.news).
   Their numbers: TROUBLE ---------- */
const TROUBLE={land:20,fresh:12,folds:14,lair:40,game:16,garrison:.8};
const Troubles={
  tiles(a,b){return Math.hypot(a.x-b.x,a.y-b.y)/TILE},
  news(t,kinds){return (W.news?.items||[]).filter(it=>it.near===t.name&&kinds.includes(it.k)&&Clock.daysSince(it.day)<=TROUBLE.fresh).sort((a,b)=>b.day-a.day)},
  bands(t){return bandits.filter(b=>!b.gone&&!b.fight&&b.troops?.length&&(landHold(b.x,b.y)===t||this.tiles(b,t)<TROUBLE.land)).sort((a,b)=>this.tiles(a,t)-this.tiles(b,t))},
  packs(t){return W.monsters.filter(m=>m.n>0&&!MONSTERS[m.id]?.mythic&&this.tiles({x:m.hx??m.x,y:m.hy??m.y},t)<TROUBLE.folds).sort((a,b)=>this.tiles(a,t)-this.tiles(b,t))},
  lairs(t){return W.sites.filter(s=>s instanceof Lair&&!s.cleared&&this.tiles(s,t)<TROUBLE.lair).sort((a,b)=>this.tiles(a,t)-this.tiles(b,t))},
  game(t){return W.critters.map(asHerd).filter(c=>c.wild&&c.n>0&&this.tiles(c,t)<TROUBLE.game).sort((a,b)=>this.tiles(a,t)-this.tiles(b,t))},
  short(t){ensureEcon(t);return Object.keys(GOODS).filter(g=>!GOODS[g].spoil&&!GOODS[g].ammo&&needOf(t,g)>.05).sort((a,b)=>this.fill(t,a)-this.fill(t,b))},
  // (how full its stock of g is: 0 none, 1 what it wants)
  fill(t,g){return (t.stock[g]||0)/Math.max(1,targetStock(t,g))},
  garrison(t){const want=t.T.gar||0,low=Math.max(0,want-(t.gar||0)),hurt=this.news(t,['siege','raid']).length>0||besieged(t);
    return{want,low,hurt,thin:want>0&&(t.gar||0)<want*TROUBLE.garrison||hurt&&low>0}},
  // (everything at once, for a look and the tests)
  of(t){return{bands:this.bands(t),packs:this.packs(t),lairs:this.lairs(t),game:this.game(t),short:this.short(t),garrison:this.garrison(t),news:this.news(t,['band','caravan','raid','beast','siege'])}}
};
