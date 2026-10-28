# Captivity: beaten but alive: design

Status: **phase 1 built** (2026-10-28, `prototype/js/world/captivity.js` `Captivity`, numbers in `CAPTIVITY`; tests/captivity.js): the escape roll, the captor's page (ransom, persuade, serve, your realm pays, refuse), §6's outcomes and the scattered troops' return; beasts take no captives. Simplified for now: refusing is a 21-day wait, not phase 2's prison days; companions share your fate (no roll of their own); what is taken is gone (no stash: phase 3). Designed (owner, 2026-10-22). **Death** is separate: for now a hero whose health runs out outside a battle ends the game, with a Load last save button (built with the play-test fixes). The owner plans more for death later.

## 1. Today

Lose a battle (routed, not withdrawn) and you lose 25% of your gold and "wake up near" the nearest holding (`battle/resolution.js` `conclude`). Your troops that fell are lost, your companions are wounded for a few days, and nothing else follows. Leaders you beat can be your captives (`world/captives.js`); you can never be theirs.

## 2. The idea (the owner's)

Beaten but alive, **you may be taken captive**: by the bandits or the lord who beat you.

1. **First a chance to escape**, better with Agility and the skills for it.
2. **Taken**, what happens depends on **who holds you** and **how they see you**: your reputation, your relations with them, your honour and renown, your bounty.
3. **You choose** how to get out:
   - **ransom**;
   - **persuade them to let you go**;
   - **serve them** for a while;
   - or end up **in prison**, where there is more to do later (escaping a prison).
4. **What you keep** (companions, gold, gear, troops) **depends on the way out.** The worst ways cost everything, with **a quest to take some of it back**.

## 3. The escape roll (as the battle is lost)

As the rout comes, your hero tries to get away:

```text
escape = base + Agility × a + (Athletics on foot | Riding mounted) × b + night + cover (woods, hills) + traits
         − captor's riders (cavalry or wolves among them) − your wounds (health under half)
```

- **Got away:**
  - you are on the map, alone or with whoever also got away, a little way off, wounded;
  - you lose some gold in the flight (as today);
  - your troops **scatter** (§6).
- **Caught:** you are taken (§4).
- **Each companion rolls on their own** (their own Agility). Those who get away are hiding nearby and rejoin you within a day or two; the rest are taken with you.
- **Beasts take no captives:** beaten by monsters, you are left for dead and wake wounded where you fell, as today.

**New traits and skills** (in the hero's tree; companions may have them):

| Trait | Effect |
|---|---|
| **Slippery** | escape +15%; a better chance to slip away from prison |
| **Silver tongue** | persuasion checks easier |
| **Old soldier** | captors treat you better (less taken); serving shortens |
| **Escape artist** (later, with prison mechanics) | locks, ropes, guards: prison escapes easier |

## 4. Held: who holds you and how they see you

| Captor | How they see you | Leaning |
|---|---|---|
| **Bandits** (a band, a chieftain) | your bounty on them, your fame, your gold | ransom (they want gold), or serve them (ride with the band); prison is a cage in their camp |
| **A lord at war with your realm** | your rank, his relation to you, your honour | ransom (to your realm or you), prison in his castle; parole for the honourable |
| **A lord not at war** (you attacked him, or are hostile) | relation, honour, why you fought | persuasion works best; a fine and a release |

**A captivity page** (the frame rule; the story system's page: `ChoicePage`, choices with their odds and outcomes; it is a **Thread** of the story system, held across days) opens with the captor's leader. The choices offered depend on how they see you:

| Choice | When offered | Check | Outcome |
|---|---|---|---|
| **Pay the ransom** | always; its sum by your renown, level and the captor | gold (or a debt to a lord) | free, at a holding near; §6 "light" |
| **Persuade them** | relation not hostile, or honour high, or a bounty they fear | Charisma and Persuasion (Silver tongue); odds shown by Insight | free with a fine; §6 "light". Failing: one choice fewer, and they are less kind |
| **Serve them** | bandits; a lord who would take a sellsword | none | ride with them N days (a band's raids, a lord's war) with a reputation cost for bandits' deeds; free after; §6 "serve" |
| **Refuse** / no way out | nothing else works | — | **prison** (§5) |
| **Your realm pays** | you serve a realm, and it thinks well of you | — | after some days, free; §6 "light" |

Events while held (by reputation and relations): a guard who knows your name, a fellow prisoner with news, a rival lord's offer to buy you, a sympathetic daughter of the house.

## 5. Prison

Held in the captor's holding (a lord's castle dungeon) or camp (a cage).

- **Each day** you can:
  - wait, for the ransom offer to come down or your realm to act;
  - try to escape (Agility, Slippery; a failure means harder guarding, or a beating that costs health);
  - bribe a guard (with gold hidden on you);
  - talk with the other prisoners.
- **Days pass in the world** while you sit. Your companions who got away may try a **rescue** (a quest of their own).
- **Later** (the owner: "more game mechanics related to this, like escape from prison"): a walkable prison scene (the scene system), guards' rounds, a breakout.

## 6. What you keep, by the way out

| Way out | Gold | Gear | Troops | Companions |
|---|---|---|---|---|
| **Escaped as the battle was lost** | lose some (as today) | keep | scatter: some come back within days (§6.1) | those who escaped rejoin; the taken stay held (rescue them, or they are let go later) |
| **"Light"** (ransom paid, persuaded, your realm paid) | lose some (the ransom, a fine) | lose one or two pieces (their pick) | scatter | released with you |
| **"Serve"** (served them) | keep most | keep | scatter | wait for you at a holding |
| **Prison, then escaped or released** | lose all | lose all but what is worn; quest items kept | lost (scattered for good) | held or released, by the captor |

- **6.1 Scattered troops:** a share of them (by your band's morale, its Leadership, and how far you are) find their way back over a few days, rejoining you on the map or waiting at a holding. The rest are lost.
- **6.2 Taking it back** (the owner: "you can have a quest to take yours back, some of it"): what the captor took goes into **their stash** (a bandit camp's, a lord's castle's), and a quest marks where it is. Clear the camp, raid the castle, or buy it back from a fence, and part of it is yours again. A stash not reclaimed within some weeks is sold off.

## 7. What changes in code

- `battle/resolution.js` `conclude`: a defeat with your hero alive goes to the escape roll, then captivity (no more "wake up near").
- `world/captivity.js` (new): the escape roll, the captor's view, the page's choices, prison days, the stash, scattered troops' return.
- The story system: captivity as a **Thread** (it spans days), its page a `ChoicePage`, its choices and outcomes (`story/outcome.js` gains `ransom`, `fine`, `confiscate`, `scatter`, `serve`), the stash quest on the quest board.
- Traits: Slippery, Silver tongue, Old soldier in the tree (`data/tree.js`); companions' (PROGRESSION_DESIGN.md).
- **Saves:** `P.captivity` (the captor, the day it began, the prison's state), the stashes in the world part; no migration.
- **Fingerprints:** the battle suites' defeat cases (`battleresolution`) move once, on purpose.

## 8. Phases and effort

| Phase | What | Effort |
|---|---|---|
| 1 | The escape roll; captivity's page with ransom, persuade, serve, your realm pays; §6's outcomes; scattered troops' return | **M–L** |
| 2 | Prison days (wait, try to escape, bribe), events while held, companions' rescue | **M** |
| 3 | The stash and the quest to take it back | **M** |
| 4 | The traits (Slippery, Silver tongue, Old soldier) | **S** |
| Later | A walkable prison and breakouts (the owner's "more mechanics") | **L** |

## 9. The owner's answers (2026-10-22: "use the defaults")

1. **The escape roll:** about 1 in 4 for an average hero on foot; better mounted, at night, in woods or hills.
2. **Monsters** take no captives: left for dead, you wake wounded where you fell.
3. **Serving bandits:** their raids cost you reputation and honour as if you had done them yourself.
4. **Prison:** with no ransom and no escape, you are let go after about **3 weeks**.
5. **The stash** is sold off after about **a month**.
