'use strict';
/* ---------- data: outlaws, the bandits' own troops (battle/engage.js makeEnemies) ----------
   The owner, 2026-11-07: "add more variations for bandits not to use the soldier knight sprites". Bandits drew the realms' own
   militia, spearmen and archers (and an orc grunt among them); now they are men of the road, each kind its own: a looter with a
   hatchet, a cutthroat's sword, a brigand's axe and round shield, a highwayman's spear, a poacher's bow. Each is as strong as the
   kind it stands for (base), so a fight is as hard as it was. Their dress (gfx/people.js PEOPLE_LOOK outlaw: true): cloth of the
   road by the man, a headscarf, a hood, a cap or his bare head, and his side's colour on a headscarf or a sash, never a soldier's
   tabard. on: the switch (off: the old troops, as they were). kinds: [id, name, base]. pick: makeEnemies' rolls, by the old kind
   rolled, to an outlaw (orc grunts among bandits: a brigand). */
const OUTLAWS={on:true,kinds:[['band_looter','Looter','militia'],['band_cutthroat','Cutthroat','militia'],['band_brigand','Brigand','orc_grunt'],
    ['band_highway','Highwayman','spearman'],['band_poacher','Poacher','archer']],
  pick:{militia:['band_looter','band_cutthroat'],orc_grunt:['band_brigand'],spearman:['band_highway'],archer:['band_poacher']}};
OUTLAWS.kinds.forEach(([id,n,base])=>{ST[id]={...ST[base],n,look:id,race:'human'}});
// (an outlaw for a kind rolled: of two, by the roll's own fraction, so no draw more is made)
const outlawOf=(k,r)=>{const L=OUTLAWS.on&&OUTLAWS.pick[k];return L?L[Math.floor((r*997)%1*L.length)]:k};
// a band hunting a caravan (the owner, 2026-11-08: "bandits or goblins, looters should rob caravans"; world/brains.js BandBrain
// hunt): one in sight (see, px) whose guards it thinks it can take (the caravan's power at most dare × its own, by its nerve), not
// while it fears you, lies in wait or cools from its last fight; it rides at pace × its speed, and its fight with the caravan's guards
// (fights.js) plunders it if it wins
const BAND_HUNT={on:true,see:110,dare:1.15,pace:1};
