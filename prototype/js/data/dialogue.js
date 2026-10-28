'use strict';
/* ---------- data: conversations' words and faces (doc/DIALOGUE_DESIGN.md; story/conversation.js) ----------
   greet: the speaker's first words, by role: first (you have not met: TalkMemory), again (you have). {N} the speaker's name,
   {realm} his realm, {you} your hero's name (or "stranger"), {town} the holding. A role with none says nothing first.
   TALK_PIC: each role's portrait (a function of the speaker's record and its holding, giving an image's URL); any of them may be
   swapped for a bigger bust later without touching the conversations. */
const DIALOGUE={
  greet:{
    // (a lord's by his temper (TEMPERS, below); none: this one)
    lord:{first:'I am {N} of the {realm}. What brings you to me?',again:'{you}. Speak, then.',
      proud:{first:'You stand before {N} of the {realm}. Be brief.',again:'{you}. You may speak.'},
      honourable:{first:'Well met. I am {N}, sworn to the {realm}.',again:'{you}. Good to see you.'},
      greedy:{first:'{N} of the {realm}. Have you come with something worth my while?',again:'{you}! What have you brought me?'},
      cunning:{first:'So you are the one I have heard of. I am {N}. What do you want?',again:'{you}. What do you know that I do not?'},
      kind:{first:'Be welcome. I am {N} of the {realm}.',again:'{you}, welcome back. Sit, rest a while.'},
      // (remembered: a threat for a month, a slight for a week; before any other words)
      threatened:'I have not forgotten your threats, {you}.',slighted:'You again. Mind your tongue this time.'},
    guard:{first:'Stranger.',again:'You again.'},
    worker:{}
  },
  /* a lord's checks (story/conversation.js LordSpeaker): once a day each (favour: once while he lends, RELATION.troopsDays). The
     odds: base, + per point of Charisma (cha), Persuasion (pers), renown, honour with his realm (honor), the power you have
     over him (power: your power over his, less one), and his temper's (temper); kept between min and max. Won (win) or lost
     (lose): an outcome (story/outcome.js: rel his relation, honor his realm's, gold; favour won: he lends you his soldiers). His
     words: yes or no, by temper (none: the plain one); yours: you */
  checks:{
    flatter:{label:'Praise his deeds',base:.45,cha:.04,pers:.04,temper:{proud:-.3,cunning:-.15,greedy:.05,kind:.1,honourable:-.05},win:{rel:4},lose:{rel:-3},
      you:'Your deeds are spoken of in every hall from here to the sea.',
      yes:{plain:'Kind of you to say.',greedy:'Ha! Words cost nothing, but I like them.',kind:'You are generous.'},no:{plain:'Spare me the honey.',proud:'Do you take me for a fool, to be bought with words?',cunning:'Flattery. What are you after?'}},
    favour:{label:'Ask a favour: some of his soldiers',base:.25,cha:.03,pers:.05,renown:.001,honor:.004,temper:{kind:.15,honourable:.05,greedy:-.15,proud:-.05,cunning:-.05},lose:{rel:-3},
      you:'I could use a few good men. Would you spare me some of yours?',
      yes:{plain:'Take them, and bring them back alive.',kind:'Of course. Take care of them.',greedy:'You will owe me for this.'},no:{plain:'I need every man I have.',proud:'My soldiers are not yours to ask for.'}},
    threaten:{label:'Threaten him',base:.2,cha:.02,power:.3,renown:.001,temper:{kind:.15,greedy:.05,cunning:-.05,honourable:-.1,proud:-.25},win:{gold:60,rel:-8},lose:{rel:-12,honor:-5},
      you:'Pay me, or I will burn your fields to the last stalk.',
      yes:{plain:'Take it, then, and go.',greedy:'Fine! Take it. But this is not over.'},no:{plain:'Get out before I have you thrown out.',proud:'You dare? Out of my sight!',honourable:'I do not bend to threats.'}},
    min:.05,max:.9},
  // (what another lord tells you of a lord's manner, asked about other lords)
  tells:'Of their manner: {list}.'
};
// a lord's temper (drawn once, from the stream talk, at your first meeting): how he speaks, and what moves him
const TEMPERS=['proud','honourable','greedy','cunning','kind'];
const TALK_PIC={
  lord:l=>portrait(charOf(l).key),
  folk:(n,t)=>personPic('folk',t?.races?.[0]||'human',n?.v||0),
  guard:(n,t)=>portrait(RACES[t?.races?.[0]||'human']?.melee||'hum_foot'),
  worker:(f,t)=>personPic('folk',t?.races?.[0]||'human',(f?.id||'').length%4)
};
