'use strict';
/* ---------- data: goblins, their troops, their warbands and their camps (world/goblins.js, world/sites.js GoblinCamp) ----------
   The owner, 2026-11-07: "Goblin enemy should also be added, similar to bandits but can use building sprite from orc factions for
   their camps." Weak, cheap and many: frail and quick, and short of nerve. Their camps stand deep in the wilds (the hideouts' wild
   land), built as the Ashgor Horde's yurts in a ring of stakes; their warbands roam the land round them.
   on: the switch (camps and warbands; off, the world is as it was). col: their colour (host, flag, minimap). band: a warband's
   fighters [from, to] (+1 every grow days); bossAt: a warband this big has a boss; mix: each troop's share of a crowd; boss: who
   leads. bands: warbands a camp keeps out; spawn: the day's chance a camp short of them sends one; leash: tiles a warband strays
   from its camp before it turns back; nerve: how bold they are (they judge you as if they had this share of their power);
   camp: a camp's own fighters as a hideout's (sites.js HIDEOUT_BAND: size0, foes, chief, gold, gear); respawn: days a cleared
   camp lies empty; loot: the stolen goods in its pile (one of goods, n of it). raid: a warband within r tiles of a hamlet or a
   village, by chance a day: its workers run home for fear days and it carries off steal of its food. morale: the rank and
   file's nerve in battle (matchups.js unitMoraleOf: a levy's 50), the boss's bossMorale: they break and run early. warren: a camp
   among hills (sites.js HIDEOUT_LAIR's hills within its r tiles) is a warren dug into the hillside, fought inside (on: the switch;
   banner: its banner by its mouth, [cloth, shade] (structures.js lairSprite); T: its type's words, as a site's) */
const GOBLINS={on:true,col:'#6f9a3a',band:[8,12],grow:12,bossAt:12,mix:[['gob_stab',.45],['gob_spear',.3],['gob_bow',.25]],boss:'gob_boss',
  bands:2,spawn:.35,leash:14,nerve:.7,camp:{size0:12,foes:[11,14],chief:[1,3],gold:1.2,gear:.3},respawn:20,
  loot:{goods:['grain','meat','cloth','tools','iron'],n:[3,6]},raid:{r:4,chance:.3,fear:2,steal:[3,6]},morale:28,bossMorale:45,
  names:['Snaggle Warren','Rotgut Camp','Mudhole Warren','Gristle Hill','Nettle Warren','Sourbog Camp','Gnawbone Camp','Mossrot Warren','Skulk Hollow','Grubpit Camp','Ratchew Warren','Thornmouth Camp'],
  d:'A goblin camp of hide yurts in a ring of stakes. Many weak goblins, their boss, and a pile of stolen goods.',
  warren:{on:true,banner:['#6f9a3a','#3f5a1e'],T:{n:'Goblin warren',ico:'cave',col:'#6f9a3a',respawn:20,d:'A goblin warren dug into the hillside. Many weak goblins packed in its burrows, their boss, and a pile of stolen goods deep inside.'}},
  meet:'Small green shapes in ragged hoods scurry through the brush, yelling and waving knives. They keep their distance until they are sure of you.'};
// goblins and every other band at feud (the owner, 2026-11-08: "Make sure that bandits and goblins are hostile to each other";
// world/brains.js BandBrain feud): a band rides down a rival in sight (see, px) it thinks it can take (the rival's power at most
// dare × its own, by its nerve), not while it fears you or cools from its last fight; two rivals within meet px of each other fight,
// whichever is the stronger (fights.js: in a fight, sides.js armyRelation puts them on opposite sides). on false: they pass by
const BAND_FEUD={on:true,see:100,dare:1.1,meet:10};
// their troops: [id, name, tier, hp, dmg, spd, reach, range, cd, look, tags, armour, damage type]. The stabber's knife and small
// round shield, the spearman's short spear, the archer's short bow, the boss's hand axe in a pelt (no mail: the owner, 2026-11-08, "goblins
// should not wear full armor")
[['gob_stab','Goblin Stabber',1,16,4,44,9,0,.75,'militia',['shield'],'leather','pierce'],['gob_spear','Goblin Spearman',1,18,5,42,18,0,1,'spearman',['spear'],'leather','pierce'],
 ['gob_bow','Goblin Archer',1,13,4,42,0,340,1.5,'archer',[],'none','pierce'],['gob_boss','Goblin Boss',2,44,9,40,15,0,.95,'chief',['shock'],'hide','slash']
].forEach(([id,n,tier,hp,dmg,spd,reach,range,cd,look,tags,armor,dt])=>{ST[id]={n,tier,hp,dmg,spd,reach,range,cd,look,race:'goblin',home:['forest','swamp'],charge:false,tags,armor,dt,morale:GOBLINS.morale}});
ST.gob_bow.bow=true;ST.gob_boss.morale=GOBLINS.bossMorale;
