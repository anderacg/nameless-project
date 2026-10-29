# The questbook: hand-written quests in one place: design

Status: **phases 1 and 2 built** (2026-10-28).

- **Phase 1:** `js/data/questbook/` (`book.js`: `QUESTBOOK`, `QUEST_CHECKS`, `QUESTBOOK_OFFER`; `samples.js`: the first entries); `js/story/questbook.js` (`Questbook`, `BookBandQuest`, `BookBeastQuest`): each entry compiled into a thread kind at load, so several steps, choices and branches work; once and cool. Givers: board, tavern, lord, road. Goals: visit, deliver, clear, beat, hunt, escort; paying is an option's `gold`. Conditions: level, renown, honor, rel, realm, war, kind, culture, day, has, done, comp, gold, and `not`. Console: `book`, `book <id> [step]`.
- **Phase 2:** a deadline for the whole entry (`fail: {days, say, out}`: its days left on its note in your Quests; the day passed, what it waits on is dropped and it fails, `Questbook.expire`, the thread ended `expired`); a step's own stage name (`stage`); two more goals: **rescue** (`held`: lair, the nearest hideout, the default; band, a band set near that carries the captive; holding, the prison of the nearest holding of another realm, ransomed at its Prison: story/steps.js `HeldQuest`) and **kill** (`lord`: a name, or 'enemy': the nearest free lord of a realm at war with the giver's realm; `BookLordQuest`, done when you beat him); two more givers: **temple** (the priest in a holding's streets, under his words: scene/scene.js) and **comp** (a companion's talk, `giver.comp`, its line `giver.ask`: story/conversation.js `CompanionSpeaker`), with the condition `approve` and the outcome `approve` as a plain number (that companion's). Three more samples: the taken pilgrim (temple: a rescue), Elske's fever-house (Elske: a heal check, a visit, her approval), the enemy's champion (lord: an enemy lord to beat within 30 days).
- **Tests:** questbook (every entry linked, walked through every branch with each check won and lost, saved and loaded at each step; the givers' offers; once and cool; the deadline; a lord beaten; a rescue freed; the console).
- **Phase 3 (the owner's: one way to write any story, §10):** built (2026-10-28). The step forms moved into the story system itself (`story/forms.js` `Stories`, `defineStory`); the questbook keeps only its entries and who offers them; the Wounded Traveller is a `defineStory` too.
- **Left:** more entries.

The owner's answers in §9; phases in §8.

## 1. Today

Quests are classes, each kind next to the system it belongs to: the jobs in `world/quests.js` (`JobQuest`: bounty, beast, clear, supply, hunt, courier, troops, lordkill, raid), the story steps in `story/steps.js` (`StepQuest`: visit, deliver, lair, held), the escort in `world/escort.js`, the stash in `world/captivity.js`; a story of several steps is a `Thread` (`story/thread.js`, its data in `data/chains.js`). A new hand-written quest today means a new class or a new chain.

## 2. The idea

Keep the **mechanics** where they are; put hand-written **content** in data. A quest is an entry (who offers it, when, its steps, its checks, its rewards, its words); one runner plays any entry with the step kinds that already exist. Adding a quest is adding an entry; adding a new kind of giver, goal or check is one `define…` call, never an edit to the runner.

## 3. Where it lives (recommended)

| File | What |
|---|---|
| `js/data/questbook/book.js` | `QUESTBOOK = {}`, first of the folder |
| `js/data/questbook/<theme>.js` | entries, one file per theme or region (`vale.js`, `karn.js`, `roads.js`, `taverns.js`…): `Object.assign(QUESTBOOK, {...})`. A new file is one `<script>` tag in `Ashmark.html` and `wiki.html` after `book.js` (tests/structure.js checks both) |
| `js/story/questbook.js` | the runner: `Questbook` (offers, starts, plays an entry), `BookQuest`, and the registries below |
| `tests/questbook.js` | one generic test that walks every entry through every branch |

Why a folder: entries stay plain data (the house rule: tables are data), files stay short and themed, and two people (or agents) can add quests without touching the same file. Each entry's id is global and unique (the test checks it).

## 4. An entry

```js
Object.assign(QUESTBOOK,{
  millers_debt:{
    title:'The miller’s debt', cat:'side',
    giver:{by:'tavern', at:{kind:['village','town']}},          // who offers it, and where (a giver kind: §5)
    when:{level:2, notAt:{war:true}},                            // who may be offered it (conditions: §5)
    once:true,                                                   // once a game (else again after cool days)
    text:'The miller of {town} owes the Red Vipers. Pay it, or end them.',
    steps:{
      start:{goal:'visit', to:{town:'{town}', lot:'house'}, say:'He shows you their mark, cut into his door.', next:'what'},
      what:{choose:[                                             // a page of choices
        {label:'Pay his debt', goal:'pay', gold:80, next:'paid'},
        {label:'Talk them out of it', check:{stat:'talk', base:.3}, win:'talked', lose:'fight'},   // a check (§6)
        {label:'Hunt the band', next:'fight'}]},
      fight:{goal:'beat', band:{name:'Red Vipers', near:'{town}'}, next:'won'},
      talked:{end:{reward:{rep:4, honor:2}, say:'They let the debt go, for now.'}},
      paid:{end:{reward:{rep:3}}},
      won:{end:{reward:{gold:60, rep:6, xp:80}, say:'The Vipers will trouble no one again.'}}},
    fail:{days:20, say:'The Vipers burned his mill.', out:{rep:-2}}
  }
});
```

- **steps** are named; each is a **goal** (a step kind does it), a **choose** (a page of choices), or an **end** (its reward, an `Outcome`: gold, rep, honor, xp, items, relation, approval, a thread to start…).
- **{town}, {lord}, {band}…** are filled from where it was offered (its context).
- One step: it is a single quest of that kind in your Quests. Several: a `Thread` made from the entry, its steps the step quests in turn, its pages `ChoicePage`s; the Quests window shows it as one quest with its stages.

## 5. Dynamic: three registries (the owner: "so that I can add others")

Every part an entry names is looked up in a registry (`Kinds`, story/kinds.js, as every kind is), so adding one is one call in any file:

| Registry | Call | What it says | Built in phase 1 |
|---|---|---|---|
| **Givers** | `defineGiver(id, {offers(t), card(entry, t), place})` | where the offer shows (a card in a place, a page on the road, a lord's talk), and where it may stand | `board` (the notice board), `tavern` (a card in the Tavern), `lord` (a reply in his conversation), `road` (a road encounter's page) |
| **Goals** | `defineGoal(id, {start(step, ctx), words(step)})` | what a step asks and which existing step kind does it | `visit`, `deliver`, `clear`, `rescue`, `escort`, `beat` (a band), `kill` (a lord), `hunt`, `pay`, `bring` (items) |
| **Conditions** | `defineCond(id, (v, ctx) => bool)` | the `when` of an entry, a step or a choice | `level`, `renown`, `honor`, `rel`, `realm` (yours), `war`, `kind` (the holding's), `culture`, `day`, `has` (an item), `done` (another entry finished), `comp` (a companion in your band) |

A future giver (a temple, a companion's wish, a letter) or goal (win the tournament, survive a siege) is one `define…` with its code; every entry may then use it.

## 6. Checks (the owner: yes)

A choice with `check:` rolls by the stats that help, the same way the road's encounters do (`ENC_STAT` in data/encounters.js, `Choice.odds`: its chance, its roll, Insight reading the odds on the button):

- `check:{stat:'talk'}` names an entry of a new table, `QUEST_CHECKS` (data/questbook/book.js), shaped as ENC_STAT's (`{base, parts:[[stat, per point]], cap}`): `talk` (Persuasion, Charisma), `threaten` (Charisma, your renown, your army's power), `sneak` (Agility, Scouting), `heal` (Medicine), `track` (Scouting, Survival), `lift` (Strength, Athletics), `lore` (Intelligence), `haggle` (Trading).
- An entry may set its own `base` or `cap`, or a whole check inline (`check:{base:.2, parts:[['cha',.05]], cap:.8}`).
- `win` / `lose`: the next step on each; a lost check always costs something (its `lose` step, or `cost:` an outcome).
- Its odds on the button by Insight, as everywhere ("a fair chance", "about 45%").

## 7. Tools and tests

- **Developer console:** `book` lists the entries, `book <id>` offers and takes one where you are, `book <id> <step>` jumps to a step.
- **tests/questbook.js:** every entry's ids unique, every `next` / `win` / `lose` names a step of its own, every giver, goal, condition and check it names registered; every entry walked through each branch (a check forced won and lost, as tests/kinds.js walks the road's encounters), each end reached and paid. A new entry is tested without writing a test.
- **Saves:** a running entry is a quest or a thread as today (P.quests, W.story.threads), its entry's id kept; an entry removed from the book later: its running quest closes quietly on load.

## 8. Phases

| Phase | What | Effort |
|---|---|---|
| 1 | The folder and `QUESTBOOK`, the runner, the three registries with the built-in givers, goals and conditions, one-step entries, checks (`QUEST_CHECKS`), the console command, the generic test; two or three sample entries | M |
| 2 | Several steps and choices (the thread built from an entry), fail days, once and cool-down, the Quests window's stages | M |
| 3 | The Wounded Traveller rewritten as an entry (its chain retired), more entries | S–M |

## 9. The owner's answers (2026-10-28)

1. **Givers:** dynamic, so others can be added later (registries, §5).
2. **One file or a folder:** easy to extend: a folder of themed files, each adding entries to one table (§3).
3. **Checks:** yes (§6).

## 10. One way to write any story (phase 3, the owner's: "why a new thing when the story and quests can be refactored")

The questbook's forms are not its own: they belong to every story. So:

| Part | Where | What |
|---|---|---|
| The step forms | `story/forms.js` `Stories`, `defineStory(id, spec)` | a story's steps as a **goal**, a **choice** (with checks) or an **end**, beside the thread's own steps (`start`, `until`, `how`, `then`, kept as written); any field a function of the thread; `remember` on any step; words `{town} {realm} {lord} {you} {to}` and `{key}` for its memory's other fields; outcomes with plain numbers and `once` (a reward the first time in a game, another after) |
| The story's own fields | the same | `fail` (a deadline for the whole of it: `memory.due`; passed, failed, `expired`), `resume` (`{key: step}`: picked up again at that step in a new thread, not archived), `speaker` (who speaks on its pages) |
| Goals and conditions | the same | `defineGoal`, `defineCond`: visit, deliver, escort (its `on: {captured, lost}`: carried off by those who beat you, `memory.held`; or by no one), track (go to where a trail starts; there the nearest hideout of its band is found: `memory.site, lair, lx, ly`), clear, beat, hunt, rescue (by default the one the story remembers holds him), kill |
| Its step kinds | `story/steps.js` | `band` (`BandQuest`), `beasts` (`BeastsQuest`), `foe` (`FoeQuest`), with visit, deliver, lair, held |
| Checks | `data/chains.js` `QUEST_CHECKS` | the checks a choice may name |
| The questbook | `story/questbook.js`, `data/questbook/` | the entries (each a `defineStory`) and who offers them: givers, offers, once and cool |
| The Wounded Traveller | `story/wounded.js` | a `defineStory`, every step in the forms: its escort an **escort** goal (its ends by `key`: carried off, home on his own, Ander loose), its pages (family, trail, thanks) **choices**, its trail a **track** goal, its clear, back and call goals, its rescue a **rescue** goal (by `key`: freed, or on to his walk home) picked up again by `resume: {freed: 'escort'}`. Only what is not a step stays its own code: the healed traveller's offer on the road, Ander wandering the taverns, the heirloom and Ander joining |

A new story is written once, in one format: plain data for a simple one, with functions and `remember` where it needs them, its pages and goals the same either way.
