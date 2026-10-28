'use strict';
/* ---------- data: the questbook, hand-written quests (doc/QUESTBOOK_DESIGN.md; its runner: story/questbook.js) ----------
   QUESTBOOK: the entries, by id (unique across the folder); every other file of data/questbook adds its own with
   Object.assign(QUESTBOOK, {...}) (one <script> tag in Ashmark.html and wiki.html, after this one). An entry:
     title, ico (its pages' icon), cat ('side'; 'main' for the main story);
     giver: {by (a giver: board, tavern, lord, road; Questbook.givers), name, pic (portrait kind), at (conditions on its place)};
     when (conditions on you; story/questbook.js Questbook.conds), once (once a game), cool (days before it is offered again);
     text: its offer; {town} {realm} {lord} {you} are filled in from where it was offered;
     first: its first step (none: 'start', else the first written); steps {id: step}, each one of:
       a goal {goal (a goal: visit, deliver, clear, beat, hunt, escort; Questbook.goals), its fields (to, give, band, n, mon,
         who…), title, text, note (what to do now), say (its line there), days (a deadline), reward (on reaching it), next (the
         step after; none: the end, done), failed (the step if it fails; none: the quest failed)};
       a choice {choose: [options], title, text, note}: an option {label, icon, tip, when (conditions: offered), need
         (conditions: else greyed), gold (what it costs), out (an outcome), say, next; a check: check (a QUEST_CHECKS name, or its
         own {base, parts, cap}), win, lose (the steps on each), winOut, loseOut, winSay, loseSay};
       an end {end: {reward, say, failed (true: the quest failed)}}.
   Outcomes (reward, out, winOut, loseOut): story/outcome.js's keys, and rep, honor, rel as plain numbers (at the giver's holding,
   with its realm, with the lord who gave it).
   QUEST_CHECKS: the checks a choice may name, shaped as data/encounters.js ENC_STAT's ({base, parts: [[stat or skill, per point]],
   cap}); their odds on the button read by Insight. QUESTBOOK_OFFER: how many a giver shows at once (offers), a road's chance of
   one a day (road). ---------- */
const QUESTBOOK={};
const QUEST_CHECKS={
  talk:{base:.25,parts:[['pers',.05],['cha',.04]],cap:.9},
  threaten:{base:.15,parts:[['cha',.04],['str',.04]],cap:.8},
  sneak:{base:.2,parts:[['agi',.05],['scout',.04]],cap:.85},
  heal:{base:.1,parts:[['med',.1],['int',.02]],cap:.95},
  track:{base:.2,parts:[['scout',.06],['surv',.04]],cap:.9},
  lift:{base:.15,parts:[['str',.06],['athl',.04]],cap:.85},
  lore:{base:.15,parts:[['int',.06]],cap:.85},
  haggle:{base:.2,parts:[['trade',.06],['cha',.02]],cap:.85}
};
const QUESTBOOK_OFFER={offers:2,road:.04};
