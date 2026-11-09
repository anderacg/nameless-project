# Fighting on the map, in real time: design

Status: **design only** (2026-11-09). Nothing here is built yet. The owner: "Can we make battle realtime in the world map? And for the existing world map battle and separated battle map we still keep them. I want to make it like mmorpg style where you can move and kill it and it drops something on the ground like just cool dot effects or small icons for exp and items. Design with me first."

**Words used here:**
- A **skirmish** is the new kind of fight: on the world map, as you travel, with no encounter page, no ring and no pause.
- The **battle on the world map** (`battle/worldbattle.js`, the ring, campaign time stopped) and the **battle map** (the separate field) stay as they are. A skirmish is a third way, for small fights.

## Decisions (owner, 2026-11-09)

- **Your whole band fights:** your hero, your companions and your troops. You control your hero; the rest fight on their own around you.
- **Small groups only:** wildlife, beasts, monsters and bands of up to about 8 (`ACTION.most`). A bigger party still meets you through the encounter page and its two battle modes.
- **Time keeps running at 1×:** the world goes on around the fight (other parties move, and may come into it); the speed is held at 1× until the fight is over.
- **Knocked out, not captured by beasts:** your hero down, you wake nearby, wounded, missing some gold (`ACTION.down`); against bandits the usual capture rules still apply.

## 1. How a skirmish starts and ends

- **Starts:** you tap a small enemy (or press Attack on its ring), or one that is hostile notices you and comes for you (its aggro range, `ACTION.aggro`). No page opens: the fight is on.
- **Who is in it:** you and your band; the enemy party and anyone it calls; any other small hostile party that comes within reach while it lasts (as the world battle's joining rules, `JOIN_RULES`, only those that see or hear it).
- **Ends:** when no enemy stands within `ACTION.leash` of you, or you run past it (they give up and walk home, mending as they go: the MMO's leash).
- **Bigger than small:** a party over `ACTION.most` men, a lord's army, a holding's walls: the encounter page, as today.

## 2. Your side

- **Your hero, yours to steer:** tap the ground to move; tap an enemy to go and attack it (your weapon's combo, as in battle: `HeroHands`); the skill bar (1–0, buttons on a phone) for your active skills; the dodge roll. A bow or staff shoots from range. Your numbers are your battle numbers (`heroStats`, the tree's, gear).
- **Your companions** fight as champions do in battle (`CharacterMind`), each near you, their own skills from their slots.
- **Your troops** break from their march round you into fighters (each soldier a fighter, its kind's numbers and its rank: `fieldStats`), the battle AI's simple orders: attack the nearest enemy that threatens the band, keep near the hero, archers shoot from behind. When it ends they fall back into the march.
- **Losses are real:** a soldier who falls is wounded or dies by the same rules as a battle (`resolution.js`); a companion is wounded, never killed.

## 3. The enemy

- **Aggro and leash:** a hostile party within `ACTION.aggro` of your band, that sees you (`seenBy`, night and woods hide you), comes for you; past `ACTION.leash` from where it began, it gives up and goes home, mending.
- **Its numbers:** each man or beast fights by its own kind's stat block and moveset (`ST`, `MOVESETS`, `PackMind` for a pack).
- **Yielding, fleeing:** a band may break and run (morale as in battle); one that runs leaves its drops where it fell.

## 4. Drops: the dots and the icons

- **Experience:** each kill bursts into small glowing dots that fly to your hero at once (its share as now: `gainXp`, and practice for your weapon's proficiency: `REWARD_TRAIN`), with a float "+12 XP".
- **Gold:** a few coin sparkles that lie where it fell.
- **Items:** the kill's loot (the same tables as now: `ON_WIN` drops, beasts' hides and meat, a chieftain's purse) as small icons on the ground, each its item's own picture (`ui/icons.js`), bobbing and glinting by its rarity.
- **Picking up:** your hero walking within `ACTION.pick` draws them in (they fly to you); a pickup's line ("+3 gold", "Wolf pelt"). A full bag: the item stays on the ground (or overflows as now).
- **Fading:** what is left fades after `ACTION.fade` (about 2 minutes of game time).
- **No loot window:** these fights hand out their spoils on the ground, kill by kill.

## 5. On the screen

- Health bars over every fighter that has been hit; floating damage numbers; hit flashes; the death fall (`FIGURES`, the dying sequence) and a fade.
- Your band's figures from their march formation, drawn as the world battle draws them (the same sprites and scale).
- A small fight banner at the top while it lasts ("Wolves · 3 left"); the speed buttons dimmed at 1×.
- The phone: tap to move or attack, the skill bar along the bottom as in battle.

## 6. How it is built

- **A light layer on the map, not a battle:** `world/skirmish.js` (new): the fight's fighters (from the parties' men), their targets, hits and deaths, run each map frame while the campaign runs (a system: `Systems.add`, frame). It borrows the battle's rules where they are pure (a blow's damage, its armour and weapon types, morale, the combo and skills' numbers), not its field, its ring or its setup.
- **Drops:** `world/drops.js` (new): what lies on the ground, its picking up and fading; drawn by `gfx/` with the map's other things.
- **Tunables:** `data/action.js` (new): `ACTION` (`on`, `most`, `aggro`, `leash`, `pick`, `fade`, `down`, the drops' look).
- **The tests' world:** `ACTION.on` false in the test harness (as weather, gates and discovery are), so every fingerprint holds; a new suite `skirmish` (a wolf pack met and killed, its drops picked up, a band's leash, your hero knocked out and waking, a big party still meeting you by its page).
- **Saves:** a skirmish is never saved (saving during one ends it as a flight); drops on the ground are not saved.

## 7. Phases

1. **You against beasts:** the fight starting and ending, your hero steered and fighting, beasts fighting back, aggro and leash, XP dots and item drops picked up, knocked out and waking.
2. **Your band and bands:** your companions and troops fighting round you, small bandit bands (morale, flight, capture on defeat), others joining.
3. **Finish:** health bars, damage numbers, the fight banner, skills and the phone's controls, sounds, tests, docs.

## 8. Open questions

- **How many is small?** `ACTION.most` 8 to start; tell me if it should be more or fewer.
- **Do you want to choose the old way too?** For a small party, a long press (or a menu) could still open its encounter page and the battle modes.
- **Gold and items:** picked up by walking near (above), or only by tapping each one?
