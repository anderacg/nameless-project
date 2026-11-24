# Regional monster difficulty

Implemented: geographic overworld births and company-relative stars above visible enemies. Regional bands are available in the full-map legend; the changing top-left forecast has been removed.

| Land | New monster levels | Pack size |
| --- | --- | --- |
| Settled lands | 1 | 30% of the rolled count, rounded up |
| Frontier | 1–2 | 50% of the rolled count, rounded up |
| Wilds | 2–4 | 80% of the rolled count, rounded up |
| Deep wilds | 4–6 | Full rolled count |

`MONSTER_REGIONS` in `data/monsters.js` owns tuning. `MonsterRegions` in `world/monsters.js` owns the query and spawn policy. Distance to the closest surviving holding gives the base band, with thresholds at 24, 42 and 64 tiles. Within 16 tiles, shelter takes priority. Beyond shelter, woods/hills add 5 tiles of remoteness, harsh climates add 10. World age and player level never raise these bands. The wider bands accommodate ordinary spawn distances without forcing most early packs into higher levels.

Levels favor the low end of each band: weights are 2:1 for Frontier and 3:2:1 for Wilds/Deep wilds. Each level roll uses one draw from the existing named monster RNG. Pack counts are always at least one. Wolves near settlements spawn in pairs; boars are solitary; spiders and slimes appear in groups of one or two.

Scorpions require Frontier; tigers and bears require Wilds; trolls, griffins and wyrms require Deep wilds. Alpha wolves and stronger regional breeds begin in Wilds. This reduces early threats without changing unit stats, mounted alpha wolves or authored boss encounters. Existing spawn distances, habitat and land checks still apply. If a rare species cannot find suitable land, an eligible local species can take that population slot.

Enemy stars use the existing Easy/Even/Dangerous/Deadly power thresholds against the player's company. Nearby or selected visible armies and packs show one to four stars above their actual flags/badges; targeted wildlife uses its individual position. Hidden enemies never retain indicators. Region stars in the full map describe geography instead of the current enemy.

Existing monsters keep their stored levels and pack sizes; approaching them does not heal or rescale them. Quest and dungeon level generation and mythic dragon rules remain separate. Higher overworld levels grant increased XP and gear odds through existing reward rules. No save migration is required. Monster population composition and levels may intentionally change for new games and new births.

Validation uses `monsterregions` for weighted levels, safe births, species gates, population, habitat and level bounds; `alphawolf` checks that eligible wilderness packs still receive leaders and riders retain their existing alpha mounts. No full test sweep or fingerprint re-recording is required for these spawn tunables.

2026-11-24 validation: monsterregions 47 and alphawolf 25 checks passed. The seeded 60-birth sample contained 23 level-one, 23 level-two, 11 level-three and 3 level-four monsters; all respected local levels, species gates and habitat. Population filled all 60 slots. No fingerprints were re-recorded.
