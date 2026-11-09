# Death to beasts, and a new life in the same world: design

Status: **design** (2026-11-09); every question answered (round 5). **Phase 1, living, built** (`world/death.js`, `data/death.js`; tests `death`): the roll and its odds. **Phase 2, dying, built** (`Death.died`, `Remains`): a lost roll lays your remains where you fell (all your gear and bag, 60% of your gold; bandits near may carry it off, beaten they give it back; whoever comes to them takes what is left), makes the beast a man-eater with a bounty on it, writes the chronicle and shows the Slain page. **Phase 4, graves, built** (`Grave`, `world/death.js`; the owner: "the grave should have a cool flow animations, and when interact player can select Pray and then the flow (like xp, etc) will flow into new character"): as you go on, your remains are buried, at your heir's holding (safe from robbers while it is theirs) or under a cairn where you fell. The grave holds half the experience that hero gained and what was left of their remains. A light breathes over it while it holds anything; rumours tell of it. Pray at it and its light flows across the map into your new hero, the experience gained as it arrives (a gift, never counted toward your own grave); its goods can be taken. Spent, it stays. A place of its own (the owner: "Can the grave be a special area? And more detail": `gfx/graveart.js`): a cairn in a ring of standing stones with your weapon planted in it, or a fenced plot with a carved headstone, candles and your heir's banner; found as a place is, then on the minimap. How you are laid to rest (the owner: "if you died whatout much renown or if you died far away then you may have a grave or remains"): by your renown and where you fell: far from anyone, your remains left as they lay, or a cairn if you were known; near people ("someone may burry for you"), a grave at the nearest holding (an heir's at theirs), finer with renown: a small grave, a headstone (50), a fenced plot (200), a tomb (500). A family plot (the owner: "Yes, make a family plot"): those of your line buried by people lie together at the holding that buried the first, in rows within a low wall. The lords' houses ("Create a family system for lords as well. Lord die may also have grave but may be different grave": `world/lineage.js`): a lord dead for good (put to death, or slain as his army is beaten) lies in his house's crypt at its seat, a stone mausoleum where you may pay your respects; one of his house succeeds him after mourning. Burial takes time ("is there a chance to let the remain stay there"): your body lies unburied where you fell; your heir comes for it in 3 days, each day someone may find and bury it (30% near people, 4% far off, more with renown), or your new hero buries it; remains no one finds stay. Kin ("1. Small 2. Ok"): going on as the child, sibling or cousin of the one who fell (their people, any past) carries a keepsake, a tenth of their renown, half their lords' regard and feuds, and a start where the family is known; a stranger carries nothing; the family tree branches by kin. Your family ("Go with 3, 1, 10 and 7 first"): a family name chosen as you go on, your line's graves and plot by it; a family tree in the Journal; lords' houses shown with them; a grudge from a house one of whom you killed, gone when you die. Resting places (the owner: "Can you make it a actual places?"): each plot, crypt and lone grave is a site on the map, named and found as places are, on the full map, its page the site window's (the dead who lie there; pray, take, pay your respects). Many lives (the owner: "Bear in mind, player may died a lot"): no grave on another, one rumour an hour at most, your line counted, an heir's fallen realm out of the realms that act. **Phase 3, a new person, built** (`world/legacy.js` `Legacy`; `DEATH.die` on): from the Slain page you pick a new race, name and past and go on in the same world on the same day. The heir (the most loyal companion, Loyal or better) leads a company as a lord: crowned over a realm of your banner's name if you held holdings of your own, else one of the lords of the realm you served; the companions content with them ride along; your holdings and caravans' purses go to them. With no heir, each holding goes to the realm nearest it. Every other companion is free in their tavern, hired again as they were. Your hero, quests, map knowledge and stories reset; the world stays. Not yet: the heir racing for your remains, a free company for an heir with no realm (they go free), the old hero's prisoners in your prisons, the caravans run on by the heir (their purses go to the treasury), the heir and lords remembering the old hero in talk. Not yet: pack animals, a bolted horse found again, a favour as a way to win a companion back, a lord's war task failed with your army. The owner: "When you lost to the beast, or monster, you should be dead. But there might be a chance that you may survived which would be wounded but the day should be passed and the monster should not be there anymore. Recheck if there is any quest relevant to it. What do you think? Please help me think of edge cases or similar situations."

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

## Decisions, round 2 (owner, 2026-11-09)

- **The map is forgotten** by the new person.
- **No easy mode** that always lets you live.

## Decisions, round 3 (owner, 2026-11-09)

- **A companion is your heir:** "let companion have it, and companion will lead the band if their loyalty is high, they will keep up your legacy but no benefit for new character". What the old hero leaves goes to their most loyal companion, who leads a band of their own (§6.1). An heir for the new person (kin) comes later.

## Decisions, round 4 (owner, 2026-11-09)

- **Graves:** "how about we add a grave system where you can regain all exp or experience from. The more hero dies the more grave will have. The grave may be places near where you died or in your own fief or holdings. You may get rumors of the fallen grave randomly." Each fallen hero leaves a grave; the new person who finds it and pays their respects regains half that hero's experience (§6.2, round 5). This is the one thing a new person can take from the old life.

## Decisions, round 5 (owner, 2026-11-09)

- **The crown:** the heir takes it, over the realm's strongest vassal.
- **A grave gives half:** half the experience the fallen hero gained in their life (not their start, not an older grave's gift); no proficiencies.
- **An heir for the new person** (kin): later.
- **The remains never fade, and are one with the grave:** what lies where you fell (your gear, bag and a share of your gold) is buried with you as grave goods (§5, §6.2).
- **Companions left too long leave you**, and must be won back.
- **Kept as proposed:** the chance to live (about 30%, 10–60%); the heir only if loyal, the others with them if content; fiefs to the heir if the realm's ruler accepts them; a spent grave stays on the map; graves never fade.

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
- **No easy mode:** no setting makes you always live (owner, 2026-11-09).

## 3. Surviving

- **Time:** you wake about a day later (`DEATH.wake`, in hours) where you fell, or a little away (dragged into cover). The clock runs on: hours and days pass, and the rest of the world moves.
- **Your body:** you wake at `DEATH.hp` of your health, with no stamina, and are weak for some days (a `Timed` state: slower, less damage).
- **Your army:** dismissed, gone for good (dead, or fled home). Prisoners you held run away.
- **Your companions:** each wakes wounded at a holding near (the nearest few by `Spatial`). They are known to be "somewhere near" and come back through a **reunion quest**:
  - you find them in that holding's tavern;
  - left too long (`DEATH.wander` days), they wander to another holding and leave your service; to have them back you must **win them back**: a talk (Persuasion), a favour they ask (a small quest of their own) or their pay owed, their approval lower for being left (`DEATH.left`);
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
- **Your remains:** your body where you fell, with your bag, your gear and a share of your gold. They never fade; they become your grave (§6.2):
  - **anyone may take them first:** a bandit band near walks to them and carries off what it can, before you are buried, and robs a cairn later (grave robbers);
  - **getting them back:** beat that band, and its loot holds your gear;
  - **buried:** what is left goes into your grave as its grave goods: with an heir, carried to their fief; with none, under a cairn where you fell.
- **The beast that killed you:** it becomes a man-eater, as in §3, with a large bounty. Its news names your old hero.

## 6. A new person, same world

- **Starting over:** you pick a new person (race, background, name) as at a new game, but in **this world, at this date**, in the same save. You start at a holding near or one you pick (as a new game's start).
- **What stays in the world:** every holding, lord, war, realm and the date.
- **What goes:**
  - **Companions:** the heir and those who follow them go with the heir (§6.1). The rest are free again: they go to taverns and may be hired again (they remember the old hero: a line).
  - **Troops:** gone.
  - **Estates and fiefs:** go to the heir (§6.1); with no heir, back to the realm that granted them (its lord gives them anew).
  - **A realm you founded:** the heir takes the crown (§6.1); with no heir, its strongest vassal does, and the realm goes on, now ruled by the AI. If it has no vassals, its holdings go to the realm next to each.
  - **Prisoners you held:** go free. Someone else's captives you held go home.
  - **Your caravans** (`world/caravans.js`, `mine`): go to the heir (§6.1); with no heir, their goods and purse go to the realm of the holding they are bound for, and they become its caravans.

### 6.1 The heir: a companion keeps your legacy

- **Who:** the companion with the highest approval, if it is at least "loyal" (`apName`, core/state.js) and they are alive. A tie goes to the higher level. A companion who leads a band of their own already (`compInit(id).party`) counts too.
- **No one loyal:** no heir. Everything goes as in §6 (to the realms, the companions free).
- **What they take:** the old hero's caravans, fiefs and estates (they hold them as a vassal of the same realm, if its ruler accepts them; else the fiefs go back to the realm), the crown of a realm the hero founded, They go for your remains (§5) and may race the bandits for them, but what they recover goes into your grave, not their purse.
- **Their band:** the heir leads a lord-like party, "<heir>'s company", under the old hero's banner:
  - the other companions who are at least "content" with the heir go with them; the rest go free;
  - no troops at first (the old army fell); they recruit over the next days, as a lord does, paid from the inheritance;
  - they act as a lord of their realm, or as a free company without one: they guard their fiefs, run the caravans, hunt the beast that killed the hero (its man-eater bounty), and go to the realm's wars.
- **No benefit for the new person:** nothing of the heir's passes to you (the graves aside: §6.2). The heir's company is a party like any other: neutral to you at first, it can be talked to (they speak of the old hero), traded with, fought or befriended as any lord. Its companions cannot be hired while they serve the heir.
- **The legacy ends** when the heir dies, is captured and never ransomed, or loses everything (no gold, no fief, no men): their company breaks up and its companions go free.
- **Surviving is unchanged:** an heir is only for a death (§5).
- **What resets:**
  - **Reputation:** renown, honour and relations start fresh. Lords who knew the old hero remember them in a line, not in numbers.
  - **Quests:** all dropped. Each giver is told, with no penalty to anyone. A quest the world tracks (a bounty) stays open for anyone.
  - **Progress:** level, points, the tree and proficiencies start as the new background gives; half the old hero's experience can be won back at their grave (§6.2).
  - **Known places:** forgotten. The map you discovered is dark again, and the new person finds it anew (owner, 2026-11-09).
- **The main story:** it starts again for the new person, at its opening (doc/MAIN_QUEST_DESIGN.md, doc/OPENING_STORY_DESIGN.md). What the old hero did in it stays in the world as fact (a defeated foe stays defeated; a lost relic stays where it fell).
- **Once-a-game events:** stay used (no second first-visit gift).
- **Saves:** your saves go on. A save from before the death can still be loaded, as any save can.

### 6.2 Graves: the fallen's experience and goods

- **One grave a death:** each hero who dies leaves a grave. The more heroes die, the more graves lie in the world.
- **Where it is:**
  - **with an heir:** in the heir's fief, at its holding's graveyard (they carry the body home); or, with no fief, at the holding they pass first;
  - **with no heir:** near where the hero fell, a cairn raised by whoever found the body (a shepherd, a patrol), a little off the spot (`DEATH.cairn` px).
- **What it holds:**
  - **half the experience that hero gained** in their own life (`P.xpEarned` × `DEATH.grave`, 0.5; the owner, 2026-11-09: "the exp from grave is the gained exp"): only what they earned by deeds and proficiencies after they began (counted as it comes, `Character#addXp`), never what their start gave them, nor what they themselves took from an older grave (a grave's gift is added with `gift`, uncounted), so nothing is counted twice;
  - **its grave goods:** the remains (§5) that nobody took first: gear, bag and gold.
- **Finding it:** the map is forgotten (§6), so you learn of graves by rumour:
  - now and then a teller speaks of one (`world/news.js` `rumourFrom`: "They buried a hero at Dunmere, the one the wolves took"; "A cairn stands by the north road, over some brave fool"), at random, more often near it;
  - its rumour marks the map roughly (as rumours do: a little off its true spot, `drawRumourMarks`), and fades; it is heard again later;
  - you know it when you walk near it (a grave on the map, `WorldObject`).
- **Paying respects:** at the grave, a short page with the hero's life (from the chronicle). Kneel, and:
  - **experience:** you gain its half (`gainXp`), with the levels and skill points it brings;
  - **grave goods:** you may take them (into your purse and bag; a full bag leaves the rest in the grave), or leave them;
  - the grave is then spent (it stays on the map as a grave, with nothing more to give).
- **A grave in a fief:** you must reach it: through the holding's gate (`world/gates.js`), its owner's leave or a bribe, as any holding. In a heir's fief, the heir lets you in (they knew the hero).
- **A cairn in the wilds:** the beast that killed the hero may still roam there (its man-eater); the cairn may stand in a beast's land. Bandits may rob its goods (never its experience): beat them to win the goods back.
- **A grave in a fief** is safe from robbers while the fief holds.
- **Waiting:** a grave never fades. One not yet found waits for the next person, and the next.


- **Your whole side down, but an ally army stands:** that is not a loss, so no death roll. The allies win or flee, and you wake wounded among them as today.
- **A beast fight that men join:** a band that joins a beast fight (`JOIN_RULES`) makes it a fight with men. If you lose, the men's capture rules apply; the beasts take no one.
- **Your hero falls but the band wins:** that is not a loss. You wake wounded as now.
- **You fall while your companions flee and survive:** a companion who fled is "standing", so the band carries you off (§1).
- **Losing in a siege of a beast lair or ruin:** the same rule (beasts on the foe's side).
- **Losing during an escort or a caravan's guard:** §3 for the people; the caravan's goods are left as remains, as yours are.
- **During a quest that needs you alive** (a duel set, a wedding, a meeting): if you survive, its date passes as usual. If you die, the quest is dropped (§6).
- **Your realm's king** (you are a vassal) hears of your death; your fiefs go back to him.
- **A companion leads a band apart from you:** they keep it. If they are the heir, it becomes the heir's company (§6.1); else it breaks up and they go free.
- **The heir is wounded or captured when you die:** they still inherit, and take up the band once healed or free.
- **The heir's realm is at war with the new person's:** nothing special; they are a lord of that realm.
- **You die again before reaching a grave:** both graves wait; the third person may find both.
- **The new person claims grave 1, then dies:** grave 2 holds only what the second hero earned (grave 1's gift is not counted again).
- **The heir's fief falls to another realm:** the grave stays in it, now behind another realm's gate.
- **The holding is sacked or burned:** its graveyard stays.
- **Two graves in one place** (two heroes buried in one fief): two graves, each its own.
- **Saving during the lost day:** you cannot; the day passes in one step.
- **A death in the tutorial or the opening story:** the opening's rule (you live, wounded).

## 8. How it would be built

- **Tunables:** `data/death.js` (new), `DEATH`: `on`, `live`, `min`, `max`, the roll's shifts, `wake`, `hp`, `food`, `horse`, `wander`, `left`, `near`, `grave`, `cairn`, `rumour`, the man-eater's growth and bounty.
- **The rule:** `world/death.js` (new), a `Death` class:
  - `beastLoss(e)`: is it a loss to beasts with your whole side down? `Captivity.defeat` asks it first.
  - `roll(e)`: the chance to live.
  - `survive(e)`: time passes, the band breaks up, goods are lost, the beast moves, quests are rechecked.
  - `die(e)`: the remains, the slain page, the grave, then the new person.
- **The man-eater:** a flag and a name on the monster (`W.monsters`), saved; drawn with a mark; news and a bounty.
- **The remains:** the grave's goods before burial (the same `Grave`, not yet buried); bandits seek it as they seek prey. Saved; never fades.
- **Graves:** `world/graves.js` (new), `Grave` (a `WorldObject`: who, where, the experience and goods it holds, buried or not, spent or not), in `W.graves`, saved; its rumours a news kind in `world/news.js` (`grave`), at random (`DEATH.rumour`, a day's chance); its page from the chronicle.
- **The heir's company:** a lord-like party led by a companion (the companion parties that exist today, `compInit(id).party`, given a lord's brain: recruiting, fiefs, caravans, wars). Saved.
- **Starting over:** the new-game start (`core/session.js`, the character maker) run into the live world:
  - first the old hero's things are handed out (the heir, estates, realm, companions);
  - then a fresh `P` is made for the new person.
  - This is the largest part, and it needs a careful pass over everything kept on `P`.
- **Quests:** a world event `hero:fell` {lived} that quests listen to (the bus: `worldOn`), so each quest kind decides its own outcome (§4).
- **Saves:** new fields get defaults on load (`Saves.add` `defaults`).
- **Tests:** a new suite `death`:
  - a beast loss with your whole side down rolls; one with a soldier standing does not;
  - one that men joined goes to capture;
  - surviving: a day passes, the band breaks up, the companions' reunion, the escort's search, the man-eater;
  - graves: one a death, where (the heir's fief, a cairn where you fell), its rumour, paying respects (half the experience and the grave goods, once), robbed cairns, nothing counted twice;
  - surviving: a companion left too long leaves and is won back;
  - dying: the remains (and bandits taking them), the heir (the most loyal; none below loyal), their company, fiefs and caravans; the realm's crown to the heir, or to a vassal; the new person in the same world, quests dropped.

## 9. Phases

1. **The rule and surviving:** the roll; the lost day; the army gone; companions scattered and their reunion; food, horse and escorts; the man-eater; quests rechecked.
2. **Dying:** the slain page, the remains, the chronicle.
3. **A new person:** the old hero's things handed out, the heir and their company, the realm's crown, the new person in the same world, the main story restarting.
4. **Graves:** where they lie, the remains in them, grave robbers, their rumours, paying respects.
5. **The skirmish:** the same rule once real-time fights are built.

## 10. Open questions

- None now (owner's answers, round 5). The kin heir for the new person is for later.
