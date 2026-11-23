# Regional monster difficulty

Implemented: geographic overworld births and a shared campaign danger crest.

| Land | Monster levels | Pack size |
| --- | --- | --- |
| Settled lands | 1–2 | Half the rolled count, rounded up |
| Frontier | 2–3 | The species’ existing minimum |
| Wilds | 3–5 | The species’ existing range |
| Deep wilds | 5–7 | The species’ existing range |

`MONSTER_REGIONS` in `data/monsters.js` owns tuning. `MonsterRegions` in `world/monsters.js` owns the query and spawn policy. Distance to the closest surviving holding gives the base band, with thresholds at 20, 36 and 56 tiles. Within 12 tiles, shelter takes priority. Beyond shelter, woods/hills add 8 tiles of remoteness, harsh climates add 16. World age and player level never raise these bands.

Tigers, bears and scorpions require Frontier or worse; trolls and griffins require Wilds; wyrms require Deep wilds. Settled areas exclude stronger breeds. Existing spawn distances, habitat and land checks still apply. If a rare species cannot find suitably deep land, an eligible local species can take that population slot. The named monster RNG selects a level inside the local band and the existing count roll. Existing monsters are never healed or relevelled when the player approaches. Monsters may roam outside their birth area.

The forged HUD crest appears in world mode on desktop and phone. Four geographic pips describe the land; the Easy/Even/Dangerous/Deadly colour compares a typical eligible local pack with current company power, using the existing encounter thresholds. It is a forecast, not a declaration that the area contains no bandits, armies or roaming bosses. A stronger visible nearby monster raises the warning, including roaming bosses, without changing the area band. Hidden enemies never contribute to this local warning. The phone quest tracker sits below it.

Quest and dungeon level generation and mythic dragon rules remain separate. Higher overworld levels already grant increased XP and gear odds through existing reward rules. No save migration or generator fingerprint re-recording is needed; monster population and level fingerprints may intentionally change because spawn eligibility changed.

Validation: `monsterregions` checks stable level bands, species gates, pack sizes, generated-world coverage and births, relative forecasts and HUD content. `campaignhud` checks existing campaign layout contracts; `alphawolf` checks leader spawning and rewards. Visual checks cover phone portrait, landscape and desktop.
