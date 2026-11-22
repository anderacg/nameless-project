# Residents, guards and individual health

Built on `codex`, 2026-11-22. The owner approved working camp guards, individual health squares and hostile bandit camp routines, with local detection and spreading alerts.

## Residents

`world/sitelife.js` owns the saved `site.residents` book. Each person has a stable ID, role, troop type, health, routine position and home post. Books live in the existing sites save; older saves create them when needed. Runtime forces and figures are kept outside the save. Reopening a camp does not reroll its people or revive its dead. Outpost ownership changes and cleared bandit camp respawns start a new generation with new IDs.

Encampment roles still come from `CampFolk`. Their routine figures reference the same saved people used in defence. Civilians and children hide; guards, hunters and rangers can fight. Returning after time away places living people in their current daily routine while retaining wounds and identities. Nearby movement runs every world frame; site discovery and threat checks run at a lower rate. Far sites retain records without running individual movement or combat scans.

Outposts draw their real guard count. Three of those residents walk the existing patrol route together; the rest rest or hold nearby posts. Normal garrison reinforcement adds a new ID. It cannot replace someone during a battle or revive an old ID.

## Defence

An awake defender detects enemies locally. Forest cover and night shorten initial detection. Guards intercept hostile bands, aggressive monsters and enemy realm troops near the site, using the existing real-time world battle. They can also join a nearby ongoing fight against an intruder. The routine figures disappear while those same people are combat actors. A guard killed in defence reduces the camp population or outpost garrison exactly once.

Each resident defender has a post and a pursuit leash. Melee guards intercept within that area, ranged guards hold and shoot, and defenders return when a target leaves. Tower archers retain their tower placement and existing ladder/height rules. Resident groups are internal controls and do not each draw a full army banner.

Detection is separate from team visibility. Individual sight and terrain visibility start an alarm. Shouts spread nearby; sleepers take time to wake. Sleeping residents remain living occupants in the battle, hidden in camp until approached, attacked or awakened. They cannot target enemies while asleep. Combat health and casualties write back before the existing battle reward/capture rules settle.

## Bandit camps

Bandit camp rosters are made once from their own seeded stream. Watchmen patrol, cooks work, raiders train, and off-duty people sleep at night. Each visible resident can be clicked and attacked individually. The existing camp encounter and clearing/reward rules remain in use.

Once per day during working hours, up to three actual raiders can leave a visited camp, provided at least three defenders remain. They become an ordinary hostile band, using its existing hunting, caravan raiding and fear behaviour. Their IDs are marked away and removed from the camp defenders. They return after five game hours or at night; survivors resume camp life and casualties remain dead. If their home is cleared, survivors become ordinary roaming bandits. Other lair kinds retain their existing behaviour.

Living residents recover eight percent of maximum health per peaceful game hour. Dead residents never recover. Outpost replacement still follows the existing reinforcement rules; bandit repopulation still follows the existing cleared-site respawn timer.

## Individual health

`ui/individualhealth.js` draws one small square per 25 maximum HP. Damage empties squares, including a partially filled square; a short final segment is full at maximum health. Rows wrap after eight squares. These use each actor's health, never a formation total.

Automatic mode shows wounded, engaged, selected and targeted individuals. Always mode shows all visible living individuals. Beasts always show their individual squares in either mode and retain the incoming removal of combined pack health. Hidden occupants and units outside sight do not reveal health indicators. The existing health preference selects these modes. Indicators draw above world units and below the GUI, using the same zoom/DPR sizing rules as battle indicators. Sprite height determines the battle indicator's anchor.

## Verification

`tests/sitelife.js` exercises IDs, wounds, casualties, save-shaped round trips, camp routine restoration, real guard fights, raid departure/loss/return, delayed alarms, pursuit limits and health segments. `outposts`, `encampments`, `worldcombat`, `battlecommands` and `structure` cover the surrounding systems. Outpost assertions now expect all real guards to be drawn and residents to defend posts independently. Desktop and phone proof images are exported separately from the repository.
