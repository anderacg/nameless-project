'use strict';
/* ---------- data: conversations' words and faces (doc/DIALOGUE_DESIGN.md; story/conversation.js) ----------
   greet: the speaker's first words, by role: first (you have not met: TalkMemory), again (you have). {N} the speaker's name,
   {realm} his realm, {you} your hero's name (or "stranger"), {town} the holding. A role with none says nothing first.
   TALK_PIC: each role's portrait (a function of the speaker's record and its holding, giving an image's URL); any of them may be
   swapped for a bigger bust later without touching the conversations. */
const DIALOGUE={
  greet:{
    lord:{first:'I am {N} of the {realm}. What brings you to me?',again:'{you}. Speak, then.'},
    guard:{first:'Stranger.',again:'You again.'},
    worker:{}
  }
};
const TALK_PIC={
  lord:l=>portrait(charOf(l).key),
  folk:(n,t)=>personPic('folk',t?.races?.[0]||'human',n?.v||0),
  guard:(n,t)=>portrait(RACES[t?.races?.[0]||'human']?.melee||'hum_foot'),
  worker:(f,t)=>personPic('folk',t?.races?.[0]||'human',(f?.id||'').length%4)
};
