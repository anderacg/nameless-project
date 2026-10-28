# Dialogue: talking with people: design

Status: **phase 1 built** (2026-10-28): `story/conversation.js` (`Conversation`, `Speaker`: `LordSpeaker`, `FolkSpeaker`, `GuardSpeaker`, `WorkerSpeaker`; `TalkMemory`, saved as `talk`), `data/dialogue.js` (`DIALOGUE` greetings, `TALK_PIC` portraits), the window's styles (style.css 8e). A lord, a townsperson, a guard and a worker now talk in one window: face, name and standing, what was said this visit (quoted), replies numbered 1–9 (keys answer), their own blocks, the bottom bar; their content as before, plus a greeting by memory (first meeting, again). Tests: conversation, lorddialogue, news. **Phase 2 built** (2026-10-28): each lord has a temper (`TEMPERS`, drawn once from the stream `talk` at your first meeting, kept on the lord), which picks his greeting and makes the checks easier or harder; named on his card once your Insight is sharp (2) or another lord told you (asking about other lords tells their manner too). Three checks (`DIALOGUE.checks`), once a day each, the odds read by Insight and the outcome on the button: **praise his deeds** (relation +4 / −3), **ask a favour** (his soldiers lent though he is no friend yet; a failure costs relation), **threaten him** (only with the stronger army: 60 gold from his realm's treasury, relation −8; failing, relation −12 and honour −5). Failing a check is a slight he remembers for a week; a threat, won or lost, for a month: he greets you with it. Outcome gained a `rel` handler. **Phase 3 built** (2026-10-28): companions (`CompanionSpeaker`; their words in `DIALOGUE.comps`). From the Army's Role tab (approval now in words, the number in its tip), **Talk with** a companion: a greeting by approval, their story, what they think (of the last deed they cared about, kept by `mood` as `c.deed`; else by approval), and, at approval 3 or more, their **wish**, once: Brann's old score (clear a hideout near Karn Hold), Elske's bread for the hungry (grain and cloth to the poorest holding near), Tavi's far edge of the map (the farthest holding); done, approval +3 and experience (Outcome gained `approve`). Turning angry (approval −3), they warn you before they leave. **Banter**: about once in two or three days on the road, two companions in your band speak (`DIALOGUE.banter`, the stream `talk`). Phase 4 to come. The owner's answers (§10): both hand-written and world-built lines; the existing portraits for now, swappable (`TALK_PIC`); tempers hinted, named once known; companion approval in words; phase 1 for lords, townsfolk, guards and workers.

## 1. Today

Talk is scattered, each place with its own page and its own words:

| Who | Where | What it is now |
|---|---|---|
| A lord | `world/realms.js` `lordMeet` | one fixed panel: his facts, Ask for rumours, Ask about other lords, his job, relation, Attack, Leave |
| Townsfolk, a guard | `scene/scene.js` `sceneTalk`, `sceneSay` | one line of gossip in a box, Back |
| A shop's keeper | `sceneTalk` | a greeting line, then the shop |
| A worker | `world/folk.js` `workerMeet` (from `ui/estate.js`) | its own page |
| A captor | `world/captivity.js` `Captivity.open` | its own page of choices |
| A road encounter | `story/encounter.js`, `world/encounters.js` | `Choice`s on a `ChoicePage`, with odds (ENC_STAT) and outcomes |
| A companion | `data/progression.js` `react` | reactions to your deeds, logged; no talk |

There is no conversation: no lines back and forth, no memory of what was said, no personality, no checks of your words except on the road.

## 2. The idea

**One way to talk with anyone**: a conversation window with the speaker's portrait and name, what they say, and your replies as choices. Replies can be plain questions, or checks (persuade, intimidate, flatter, lie) with their odds read by Insight, and they have outcomes (relation, honour, gold, knowledge, a quest). People remember what you said to them, and speak in their own manner.

Keep it short (OPENING_STORY_DESIGN.md: "two or three sentences and clear action labels"): a few lines a time, more as questions, never a wall of lore.

## 3. The pieces (OOP; the story system's parts reused)

| Piece | File | What it owns |
|---|---|---|
| `Conversation` | `story/conversation.js` (new) | one talk with one speaker: the topic now, the lines said this visit (the transcript), the replies offered, going back, leaving; its result lines |
| `Speaker` | `story/speaker.js` (new) | wraps whoever talks (a lord, a companion, a townsperson, a guard, a worker, a captor, an encounter's leader): name, portrait, role, manner (§5), relation, memory key, the topics it has |
| `Topic` | `data/dialogue.js` (new), `defineKind('topic', id, …)` | a subject: who has it (`who`), when (`when`), what the speaker says (`say`, by manner), the replies (`replies`), where they lead (`next`) |
| `Reply` | a `Choice` (`story/choice.js`) | one answer: label, `when`, `need`, `odds` (ENC_STAT, read by Insight), `out` (an `Outcome`), `next` (a topic, or back, or leave) |
| `TalkMemory` | `story/talkmemory.js` (new) | what each person remembers of you: met, topics asked (and the day), favours, slights, promises; read by `when` and by the manner |
| The window | `ui/conversation.js` (new) | the frame rule: header (portrait, name, role, relation tag), the transcript (the last few exchanges), the replies (keys 1–9), bottom bar from `nav()` (Back to the topics on the left, Leave on the right; Esc follows it) |

Topics are plain data in one table, as the game's other tables are; the classes run them. An `Outcome` (`story/outcome.js`) does what a reply does, so a reply can be shown before it is chosen ("+5 relation", "costs 50g"), as road encounters' choices are.

## 4. What you can say

**Common topics** (the speaker's role decides which it has):

| Topic | Who | Replies, outcomes |
|---|---|---|
| Greeting | everyone | by manner and relation; first meeting vs again (memory) |
| News and rumours | lords, townsfolk, innkeepers, prisoners | today's `rumourSay` (once a day each) |
| Other lords | lords | today's `lordTies` (known to you after: KNOWLEDGE) |
| Work | lords, headmen | the job board's or the lord's job (`lordJobHtml`'s, as a reply) |
| Directions | townsfolk, guards | where a holding, a lord or a site is (marked) |
| About them | lords, companions | their story, their realm, their view of you |
| Persuade, flatter, threaten | lords, captors, encounter leaders | a check (ENC_STAT, Insight reads the odds); outcomes by manner (§5) |
| Leave | everyone | closes; some people remember a rude goodbye |

**Checks** use what exists: Charisma, Persuasion, renown, honour, relation, your army's power for threats, Silver Tongue. A failed check costs something (relation, a harsher price, a chance closed for the day), never nothing, so it is a real choice.

## 5. Manner: people speak as they are

Each lord gets a **temper** (seeded once from the story stream, `rngOf('lords')`: no `Math.random` in content), each townsperson and guard a manner by their holding's culture and their role:

| Temper | Speaks | Moved by | Put off by |
|---|---|---|---|
| Proud | formal, short | your renown, rank | flattery, threats |
| Honourable | plain, fair | your honour, oaths kept | lies, a broken promise |
| Greedy | warm to gold | gifts, a share | asking favours for free |
| Cunning | asks back | information, a trade | being read too easily (Insight) |
| Kind | gentle | appeals to mercy | cruelty you are known for |

The temper picks the line's variant (`say: {proud: …, kind: …}`, a plain default for the rest) and which check is easier. Shown on his card once you know him (Insight, or asked about by another lord).

## 6. Memory

`TalkMemory` keeps, per person (a lord by id, a companion by id, a holding's townsfolk as one):

- met (the day), last talked (the day);
- topics asked today (no second rumour the same day: memory, not a flag in each topic);
- deeds remembered: a favour done, a slight, a promise made and whether it was kept;
- lines it changes: "We meet again", "You still owe me", "You lied to me once".

Saved with the world (`Saves.add({key: 'talk', defaults: …})`); forgotten slowly (a slight fades over weeks).

## 7. Where it goes

| Today | With conversations |
|---|---|
| `lordMeet` panel | a conversation with the lord: greeting, News, Other lords, Work, About him, Persuade…, Attack, Leave (his facts on the header card) |
| `sceneSay` gossip | a short conversation: greeting, News, Directions, Leave |
| A shop's greeting | the greeting as one line, then the shop as today |
| A worker's page | a conversation with the worker, Recruit as a reply |
| Captor's page | later (phase 4): the captor speaks; ransom, persuade, serve as replies |
| Road encounters | stay `ChoicePage`s (they are events, not talks); an encounter's leader may open a conversation (talk your way through) |
| Companions | phase 3: talk at camp or on the road |

## 8. Companions (phase 3)

- Talk to a companion from the Army page or at camp: their story, what they think of your deeds (`react`), their wish (each has one: a place, a person, a cause).
- **Approval**: their `react` grows into an approval number; high, they open up (a personal quest); low, they warn you, then leave.
- **Banter**: now and then on the road two companions speak (a line each, in the log or a small bubble), by who they are and what you did lately.

## 9. Phases

| Phase | What | Effort |
|---|---|---|
| 1 | The core: `Conversation`, `Speaker`, `Topic` registry, `TalkMemory` (saved), the window (desktop and phone); lords' and townsfolk's talk moved into it, same content (no new words yet) | M |
| 2 | Lords' tempers; checks with outcomes (persuade, flatter, threaten), failures that cost; the memory's lines | M |
| 3 | Companions: talk, approval, a wish each, banter | M–L |
| 4 | Story and captors as conversations: the opening's roadkeeper, a thread's page step as a talk, the captor's page | M |
| Later | culture voices for townsfolk, barks on the map, a lord's offer to buy you from captors, voiced pages for the main quest | — |

**Tests:** `conversation` (topics, replies, back and leave, the frame rule, keys, phone width), `talkmemory` (once a day, remembered across a save), `lordtalk` (the old panel's actions all reachable, same results), and in phase 2 a check's odds and costs. **Fingerprints:** none should move (talk changes no simulation) unless a reply's outcome is chosen.

## 10. For the owner to decide

1. **How much is written:** hand-written topics only (richer, slower to grow), or hand-written plus procedural lines built from the world (news, a lord's war, a holding's shortage: more to say, plainer)? *Suggested: both; hand-written for people's character, procedural for news.*
2. **Portraits:** the existing pixel portraits (`portrait`, `personPic`) in the header, or bigger busts? *Suggested: the existing ones, larger.*
3. **Tempers shown:** told plainly once known, or only hinted in how they speak? *Suggested: hinted, named once your Insight or another lord tells you.*
4. **Companion approval:** a number you see, or only words ("Brann trusts you")? *Suggested: words, with the number in the tooltip.*
5. **Phase 1 scope:** lords and townsfolk only, or workers too?
