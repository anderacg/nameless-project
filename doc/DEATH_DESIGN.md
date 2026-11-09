# Death to beasts, and a new life in the same world: design

Status: **design** (2026-11-09), not built. The owner: "When you lost to the beast, or monster, you should be dead. But there might be a chance that you may survived which would be wounded but the day should be passed and the monster should not be there anymore. Recheck if there is any quest relevant to it. What do you think? Please help me think of edge cases or similar situations."

**Today:** a fight lost to beasts leaves you "for dead among the fallen", waking where you fell at a quarter of your health (`Captivity.defeat`, `world/captivity.js`, `CAPTIVITY.beast.hp`). Nothing else changes: your band, the beast and your quests stay as they were.

## Decisions (owner, 2026-11-09)

- **Only when your whole side falls.** If anyone on your side is still standing (a companion, a soldier, an ally), they carry you off and the loss works as today.
- **Usually death.** Surviving is the lucky case (about 30%, `DEATH.live`).
- **Surviving:** you wake about a day later, wounded. Your army is dismissed and gone for good. Your companions are scattered, and a reunion quest finds them again.
- **Similar cases, kept:** man-eater legends, beasts raiding your food, your horse lost, people you escort put at risk.
- **Dying:** your loot drops as remains where you fell. You go on as a **new person in the same world**, in the same save.
- **Remains:** anyone may take them first; bandits who find them carry them off.
- **A realm you founded:** the strongest vassal takes the crown.
- **The main story:** it starts again for the new person.

## 1. When it applies

- **A loss to beasts only:** the foe's side is all beasts or monsters (`mapKind` 'monster', a wildlife fight, a den or a beast lair). If any man stands on the foe's side (bandits with war dogs, a beast tamer), it is a loss to men, and capture works as today (`Captivity.defeat` → `captor`).
- **Your whole side down:** your hero, every companion and every soldier fell (wounded or dead), and no ally still stands. An ally who wins the fight for you means you did not lose.
- **Fleeing is not losing:** a flight that works (the encounter page's Flee, the battle's retreat) keeps today's rules.
- **Every kind of fight:** auto-resolve (`autoResolve`), the battle on the world map (`battle/worldbattle.js`), the battle map, and later the skirmish (doc/ACTION_DESIGN.md: its "knocked out" becomes this rule when your whole band falls).
- **Not in tutorials, tournaments or the arena:** those have their own rules. The tests' harness turns it off (`DEATH.on` false), so every fingerprint holds.

## 2. The roll: live or die

- **Base chance to live:** `DEATH.live` (0.3). The roll is shifted by:
  - a healer in the band (the best Medicine among those who fell): +;
  - your armour's worth: +;
  - daylight: + (night: −);
  - a holding or a road within `DEATH.near` (someone finds you): +;
  - the beast's strength: a pack of wolves −, a troll or a wyrm more;
  - a mythic beast: much less;
  - a frost night (weather, cold): −;
  - fighting alone (no band): −.
- **Bounds:** clamped to `DEATH.min`…`DEATH.max` (about 0.1…0.6), so neither outcome is ever sure.
- **Shown first:** the encounter page warns "Beasts take no prisoners", and shows the chance when your band is small.
- **Easy mode:** a difficulty option may always make you live (a later choice; `DEATH.mercy`).

## 3. Surviving

- **Time:** you wake about a day later (`DEATH.wake`, in hours) where you fell, or a little away (dragged into cover). The clock runs on: hours and days pass, and the rest of the world moves.
- **Your body:** you wake at `DEATH.hp` of your health, with no stamina, and are weak for some days (a `Timed` state: slower, less damage).
- **Your army:** dismissed, gone for good (dead, or fled home). Prisoners you held run away.
- **Your companions:** each wakes wounded at a holding near (the nearest few by `Spatial`). They are known to be "somewhere near" and come back through a **reunion quest**:
  - you find them in that holding's tavern;
  - left too long (`DEATH.wander` days), they wander to another holding or leave your service;
  - a companion who has their own quest line keeps it.
- **Your goods:**
  - **Food:** the beasts raid it: a share is eaten (`DEATH.food`).
  - **Horse:** it may bolt (`DEATH.horse`); it may be found later near the place, or is lost.
  - **Pack animals and carts:** like the horse.
  - **Your bag and purse:** kept (beasts don't take gold).
- **The beast:** it is gone from the place when you wake. It moves to its den, or leaves the region.
- **Man-eater legend:** a beast that beat your band may become a **named man-eater**:
  - it gets a name ("the Grey Widow", from a named stream: `rngOf('maneater')`);
  - it grows stronger and its bounty grows;
  - news spreads it (`world/news.js`, a "beast" item that names it);
  - killing it later gives a deed and renown. If it was your own band it beat, you get the "avenged" deed.
- **People you escort:** each passenger rolls to live (`EscortQuest`):
  - if they live, they are taken to the holding near, and the escort becomes a search (find them, then go on);
  - if they die, the escort fails, and its giver hears it.

## 4. Quests rechecked (when you survive)

- **A hunt for that beast** (`BeastQuest`, `BeastsQuest`'s step, `ClearQuest` of a den): kept, now harder (the beast is a man-eater, or has moved off). Its deadline is not paused. If the deadline passed while you lay hurt, the quest fails as usual.
- **Deadlines:** every quest's timer runs on through the lost day. Quests that end in that time fail or lapse as they always would, and one line in the log names each.
- **Deliveries and goods:** a parcel or cart for a quest may be lost with your food or horse (the same rolls). Then the quest fails, or turns into a search for it.
- **Your army's tasks** (a lord's war task, patrols, a siege you were part of): failed, since your army is gone. The lord hears it (a small relation loss, less if you tell him first).
- **Captivity and prison:** none. Beasts take no captives.

## 5. Dying

- **The moment:** a page, "Slain", with your hero's life in a few lines: days lived, deeds, renown, the beast that killed you. The chronicle (the journal's history) records your death.
- **Your remains:** a place on the map where you fell, holding your bag, your gear and a share of your gold:
  - **anyone may take them first:** a bandit band near walks to them and carries them off;
  - **getting them back:** beat that band, and its loot holds your gear;
  - **fading:** what nobody takes lies there for `DEATH.remains` days, then is gone.
- **The beast that killed you:** it becomes a man-eater, as in §3, with a large bounty. Its news names your old hero.

## 6. A new person, same world

- **Starting over:** you pick a new person (race, background, name) as at a new game, but in **this world, at this date**, in the same save. You start at a holding near or one you pick (as a new game's start).
- **What stays in the world:** every holding, lord, war, realm and the date.
- **What goes:**
  - **Companions:** the old hero's companions are free again. They go to taverns and may be hired again (they remember the old hero: a line).
  - **Troops:** gone.
  - **Estates and fiefs:** go back to the realm that granted them (its lord gives them anew).
  - **A realm you founded:** its strongest vassal takes the crown and the realm goes on, now ruled by the AI. If it has no vassals, its holdings go to the realm next to each.
  - **Prisoners you held:** go free. Someone else's captives you held go home.
  - **Your stash, workshops and caravans:** go to the holding's lord, or are lost.
- **What resets:**
  - **Reputation:** renown, honour and relations start fresh. Lords who knew the old hero remember them in a line, not in numbers.
  - **Quests:** all dropped. Each giver is told, with no penalty to anyone. A quest the world tracks (a bounty) stays open for anyone.
  - **Progress:** level, points, the tree and proficiencies start as the new background gives.
  - **Known places:** the map you discovered stays; a person hears of the world. This is the kindest choice; tell me if it should reset too.
- **The main story:** it starts again for the new person, at its opening (doc/MAIN_QUEST_DESIGN.md, doc/OPENING_STORY_DESIGN.md). What the old hero did in it stays in the world as fact (a defeated foe stays defeated; a lost relic stays where it fell).
- **Once-a-game events:** stay used (no second first-visit gift).
- **Saves:** your saves go on. A save from before the death can still be loaded, as any save can.

## 7. Edge cases

- **Your whole side down, but an ally army stands:** that is not a loss, so no death roll. The allies win or flee, and you wake wounded among them as today.
- **A beast fight that men join:** a band that joins a beast fight (`JOIN_RULES`) makes it a fight with men. If you lose, the men's capture rules apply; the beasts take no one.
- **Your hero falls but the band wins:** that is not a loss. You wake wounded as now.
- **You fall while your companions flee and survive:** a companion who fled is "standing", so the band carries you off (§1).
- **Losing in a siege of a beast lair or ruin:** the same rule (beasts on the foe's side).
- **Losing during an escort or a caravan's guard:** §3 for the people; the caravan's goods are left as remains, as yours are.
- **During a quest that needs you alive** (a duel set, a wedding, a meeting): if you survive, its date passes as usual. If you die, the quest is dropped (§6).
- **Your realm's king** (you are a vassal) hears of your death; your fiefs go back to him.
- **A companion leads a band apart from you** (if that is built): they keep it, and become free with it, a lord-like party of their own.
- **Saving during the lost day:** you cannot; the day passes in one step.
- **A death in the tutorial or the opening story:** the opening's rule (you live, wounded).

## 8. How it would be built

- **Tunables:** `data/death.js` (new), `DEATH`: `on`, `live`, `min`, `max`, the roll's shifts, `wake`, `hp`, `food`, `horse`, `wander`, `remains`, `near`, `mercy`, the man-eater's growth and bounty.
- **The rule:** `world/death.js` (new), a `Death` class:
  - `beastLoss(e)`: is it a loss to beasts with your whole side down? `Captivity.defeat` asks it first.
  - `roll(e)`: the chance to live.
  - `survive(e)`: time passes, the band breaks up, goods are lost, the beast moves, quests are rechecked.
  - `die(e)`: the remains, the slain page, then the new person.
- **The man-eater:** a flag and a name on the monster (`W.monsters`), saved; drawn with a mark; news and a bounty.
- **The remains:** a `WorldObject` on the map holding the goods; bandits seek it as they seek prey. It is saved, and fades.
- **Starting over:** the new-game start (`core/session.js`, the character maker) run into the live world:
  - first the old hero's things are handed out (estates, realm, companions);
  - then a fresh `P` is made for the new person.
  - This is the largest part, and it needs a careful pass over everything kept on `P`.
- **Quests:** a world event `hero:fell` {lived} that quests listen to (the bus: `worldOn`), so each quest kind decides its own outcome (§4).
- **Saves:** new fields get defaults on load (`Saves.add` `defaults`).
- **Tests:** a new suite `death`:
  - a beast loss with your whole side down rolls; one with a soldier standing does not;
  - one that men joined goes to capture;
  - surviving: a day passes, the band breaks up, the companions' reunion, the escort's search, the man-eater;
  - dying: the remains (and bandits taking them), the realm's crown to a vassal, the new person in the same world, quests dropped.

## 9. Phases

1. **The rule and surviving:** the roll; the lost day; the army gone; companions scattered and their reunion; food, horse and escorts; the man-eater; quests rechecked.
2. **Dying:** the slain page, the remains, the chronicle.
3. **A new person:** the old hero's things handed out, the realm's crown, the new person in the same world, the main story restarting.
4. **The skirmish:** the same rule once real-time fights are built.

## 10. Open questions

- **The map you knew:** kept for the new person (above), or forgotten?
- **The old hero's gold in the bank or stash:** to the holding's lord (above), or partly inherited by the new person (a "kin" background)?
- **Easy mode:** should a difficulty setting always let you live?
