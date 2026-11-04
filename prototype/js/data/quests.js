'use strict';
/* ---------- the quests' numbers: the boards, a job's timing, giving one up, what a job asks of you, the journal
   (world/quests.js, story/quest.js, ui/questwindow.js; doc/STORY_DESIGN.md QM) ---------- */
// the boards: the offers a holding shows at once, and the days till they change
const JOB_OFFERS=2,JOB_REFRESH=7;
// a timed job paid late: perDay less a day past its best-by day, never under floor; a job the world closed: gold, its share of
// the reward's
const QUEST_LATE={perDay:.1,floor:.5},QUEST_CLOSED={gold:.25};
// a job given up (the owner, 2026-10-23): its cost grows with its size, clamp(round(rep × its reputation (a lord's: honor × its
// honor) + its gold ÷ gold), min, max), lost at its holding (a lord's: honour with his realm, and his regard as ever); and its
// giver has no work for you for shut days
const QUEST_ABANDON={rep:1.5,honor:1.5,gold:40,min:4,max:20,shut:3};
// what a job asks of you before it is given (till then it is shown greyed, with them): a holding's, your standing there; a
// lord's, his regard for you and your honour with his realm; the bigger kinds, renown or level besides
const JOB_NEEDS={holding:{standing:-10},lord:{rel:RELATION.jobsAt,honor:0},kinds:{clear:{renown:20},troops:{level:3},lordkill:{renown:40}}};
// the journal (your Quests, C): its categories (each a tab: tab, its name; n, one of them), the states every quest and story
// reads, and the ended ones it keeps
const QUEST_CATS={main:{tab:'Main',n:'Main quest'},side:{tab:'Side',n:'Side quest'},job:{tab:'Jobs',n:'Job'}};
const QUEST_STATES={locked:'Locked',available:'Available',active:'Active',completed:'Completed',done:'Done',failed:'Failed',abandoned:'Abandoned'};
const QUEST_ARCHIVE={keep:60};
/* the givers (doc/QUESTS_DESIGN.md §4; world/givers.js): the people of a holding who give work, each a row: n (their trade, as
   said), at (where there is one: kind, a holding kind among these; estate, it has one; walls, at least that wall), jobs (the
   kinds they give, world/quests.js), why (what they care about, said on their offers), pays (gold: a share of a job's gold they
   pay, the rest in goods of the holding's (GIVER_PAY)). A holding has every one whose at fits, in this order. To add one: a row */
const GIVERS={
  reeve:{n:'reeve',at:{kind:['village']},jobs:['beast','bounty','hunt'],why:'The village is mine to keep.',pays:.5},
  herder:{n:'herder',at:{estate:'pasture'},jobs:['beast'],why:'Every ewe lost is a winter lost.',pays:.4},
  captain:{n:'captain of the watch',at:{walls:1},jobs:['bounty','clear','troops'],why:'The roads are the watch’s to keep.',pays:1},
  steward:{n:'steward',at:{kind:['town','city','castle']},jobs:['supply','courier','troops'],why:'The stores answer to me.',pays:1},
  merchant:{n:'merchant',at:{estate:'market'},jobs:['supply','bounty'],why:'My caravans go out on those roads.',pays:1},
  tanner:{n:'tanner',at:{estate:'workshop'},jobs:['hunt'],why:'No hides, no leather.',pays:.7},
  innkeeper:{n:'innkeeper',at:{kind:['village','town','city']},jobs:['hunt'],why:'A full table keeps the tavern full.',pays:.6}};
// what a giver who pays partly in goods pays the rest in: the first of these the holding has in stock, as many as that gold buys
const GIVER_PAY=['cheese','grain','ale','cloth','furs','tools'];
// a giver's regard for you (P.grel): what a job done, given up, and work offered by them asks (offered: their kinds at least
// that regard; a kind not listed none)
const GIVER_REGARD={done:3,left:-4,needs:{}};
