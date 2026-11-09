'use strict';
/* ---------- data: conversations' words and faces (doc/DIALOGUE_DESIGN.md; story/conversation.js) ----------
   greet: the speaker's first words, by role: first (you have not met: TalkMemory), again (you have). {N} the speaker's name,
   {realm} his realm, {you} your hero's name (or "stranger"), {town} the holding; {he} {his} {him} {himself} and {lord} (capitalised too: {He}) the
   speaker's words, {you.he} and the like your hero's (core/pronouns.js prFill). A role with none says nothing first.
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
    flatter:{label:'Win {his} regard',short:'{his} regard',ways:['praise','honour','bond'],part:{rel:2},half:{plain:'Perhaps. We shall see.',proud:'Words. Show me deeds.'},base:.45,cha:.04,pers:.04,temper:{proud:-.3,cunning:-.15,greedy:.05,kind:.1,honourable:-.05},win:{rel:4},lose:{rel:-3},
      you:'Your deeds are spoken of in every hall from here to the sea.',
      yes:{plain:'You speak well. I will remember it.',greedy:'Ha! Words cost nothing, but I like them.',kind:'You are generous.',honourable:'Well said. I hold you the higher for it.'},no:{plain:'Spare me.',proud:'Do you take me for a fool, to be won with words?',cunning:'Fine words. What are you after?'}},
    favour:{label:'Ask a favour: some of {his} soldiers',short:'{his} soldiers',ways:['honour','gain','bond','fear'],part:{lend:2},half:{plain:'Two of them, no more.',greedy:'Two. And you owe me.'},base:.25,cha:.03,pers:.05,renown:.001,honor:.004,temper:{kind:.15,honourable:.05,greedy:-.15,proud:-.05,cunning:-.05},lose:{rel:-3},
      you:'I could use a few good men. Would you spare me some of yours?',ask:'I could use a few good men. Would you spare me some of yours?',
      yes:{plain:'Take them, and bring them back alive.',kind:'Of course. Take care of them.',greedy:'You will owe me for this.'},no:{plain:'I need every man I have.',proud:'My soldiers are not yours to ask for.'}},
    threaten:{label:'Demand tribute',short:'tribute',ways:['fear'],part:{gold:25,rel:-10},half:{plain:'Take this, and be gone. It is all you will get.'},base:.2,cha:.02,power:.3,renown:.001,temper:{kind:.15,greedy:.05,cunning:-.05,honourable:-.1,proud:-.25},win:{gold:60,rel:-8},lose:{rel:-12,honor:-5},
      you:'Pay me, or I will burn your fields to the last stalk.',
      yes:{plain:'Take it, then, and go.',greedy:'Fine! Take it. But this is not over.'},no:{plain:'Get out before I have you thrown out.',proud:'You dare? Out of my sight!',honourable:'I do not bend to threats.'}},
    // (ask him to follow you: he marches in your host for some days: world/hosts.js; by his relation with you too (rel))
    follow:{label:'Ask {him} to follow you',short:'{his} company',ways:['honour','gain','bond'],part:{days:2},half:{plain:'Two days, then. No more.'},base:.25,cha:.03,pers:.03,renown:.0015,honor:.004,rel:.006,temper:{honourable:.1,kind:.1,proud:-.15,greedy:-.05,cunning:0},
      you:'Ride with me for a while. There is work on the road for both of us.',ask:'Ride with me for a while. There is work on the road for both of us.',
      yes:{plain:'Very well. For a few days, then.',honourable:'Gladly. Lead on.',greedy:'If there is plunder in it, why not.'},no:{plain:'I have my own road to ride.',proud:'I follow my liege, and no one else.',cunning:'Not yet. Show me what you are worth first.'}},
    min:.05,max:.9},
  /* the ways to put it (deeper persuasion: story/conversation.js LordSpeaker): each aim above has its ways (ways); his temper takes
     to each or not (temper: over the aim's own odds, in place of the aim's own); a way may need something (need: warm, his liking
     at least Warm; power, your army the stronger); its cost whatever comes of it (cost: his liking, fear's, but for tribute); your words:
     what you ask (an aim's ask), then the way's (you). The roll: under the odds, won;
     under them and part more, won in part (the aim's part, his half words); else lost. Insight (rough) marks the way his manner
     suits best; his manner known, so does it */
  ways:{
    praise:{label:'Praise {him}',you:'Your deeds are spoken of in every hall from here to the sea.',temper:{kind:.1,greedy:.05,proud:-.3,cunning:-.15,honourable:-.05}},
    honour:{label:'Speak of honour and duty',you:'It is a matter of honour, and I know you for one who keeps {his} word.',temper:{honourable:.2,proud:.1,kind:.05,greedy:-.1,cunning:-.1}},
    gain:{label:'Speak of what {he} gains',you:'There is profit in it for you, and more to come.',temper:{greedy:.25,cunning:.1,honourable:-.15,kind:-.05,proud:-.05}},
    bond:{label:'Ask it as a friend',you:'We have stood together before. I ask it as a friend.',need:'warm',temper:{kind:.2,honourable:.1,cunning:-.1,proud:-.05}},
    fear:{label:'Lean on {him}',you:'It would go hard for you to refuse me.',need:'power',cost:-5,temper:{kind:.15,greedy:.05,cunning:-.05,honourable:-.1,proud:-.25}}},
  part:.2,
  // (what another lord tells you of a lord's manner, asked about other lords)
  tells:'Of their manner: {list}.',
  /* your words as you choose on a story's page (story/choice.js ChoicePage: the exchange kept on the page as a talk's lines), by the
     choice's label, only those that mean the same wherever they are; a choice's own words first (the toll's); none: what you did */
  says:{'Ask for news':'Any news from the road?','Ask why they fled':'What drove you from your homes?','Call them out':'Come out. We know you are there.',
    'Pray with them':'May I pray with you?','Walk and pray with them':'We go your way. May we walk with you?','Give alms':'Here. Take this, and eat.',
    'Take them in':'Lay down your arms and ride with me, and no one need know.','Turn them in':'You will answer for deserting.','Hear his song':'Play us something, friend.',
    'Listen':'Go on. I am listening.','Return the purse':'You dropped this.','Pay respects':'I am sorry for your loss.','Learn from her':'Will you teach me what you know?'},
  /* what a lord remembers and tells you as you meet (story/conversation.js LordSpeaker#remarks): at most most of them a visit, each
     said once, the first of these that hold: your line (he knew one of it who fell: kin of theirs, their look; a stranger under
     their banner), his house's grudge, its mourning (one of it dead within days), its joy (a wedding or a child within days: their
     names only to a close friend, DEATH.house.tell), his taking up of the place, your last deed toward him (within days: the
     reason his liking moved, in his words), the war his realm is in, your name (first meeting, renown at least known); the last keep
     of what was said remembered */
  remember:{most:2,days:20,deed:30,known:50,famed:150,keep:40,month:30,
    kin:'You have the look of {who}. I knew {them}, before {they} fell to {by}.',
    stranger:'Another under the banner {who} rode under. I knew {them}; {they} fell to {by}.',
    grudge:'You killed {name}. My house has not forgotten it.',kinGrudge:'Your kin killed {name}. My house has not forgotten it.',
    mourn:'We buried {name} {ago}. {How}.',mournVague:'My house is in mourning.',
    born:'A {child} was born to my house {ago}: {name}.',bornVague:'There is a new child in my house.',
    wed:'{name} of my house is newly wed, to {spouse}.',wedVague:'There has been a wedding in my house.',
    rose:'I have held the place of {name} since {they} fell.',
    good:'I have not forgotten: {why}. You have my thanks.',bad:'{Why}. I have not forgotten it.',
    ally:'Good that you ride for the {realm}. The {foe} press us hard.',shared:'We fight the same foe, you and I: the {foe}.',war:'We are at war with the {foe}. These are hard days.',
    known:'Your name goes before you.',famed:'Even here they sing of you.'},
  /* companions (phase 3; story/conversation.js CompanionSpeaker): greet by their approval (core/state.js apName: loyal, content,
     uneasy, angry); about (their story); warn (their words as they turn angry: one more and they leave); wish (asked once you
     have their trust, wish.trust approval or more: their own quest, a step kind (story/steps.js) with its spec; done, its prize:
     their approval and experience) */
  comps:{
    brann:{greet:{loyal:'Point me at them, captain.',content:'Captain.',uneasy:'What now?',angry:'Make it quick.'},
      about:'I sold my sword in Karn Hold for ten years. The last company I rode with left me for dead in a ditch and kept my pay. I have not forgotten their faces.',
      warn:'Brann spits. "One more like that, captain, and I am gone."',
      wish:{ask:'The Grey Wolves, the company that left me in that ditch, have gone to ground in a hideout near Karn Hold. Help me pay them back.',
        kind:'lair',spec:{title:'Brann’s old score',text:'Brann’s old company, the men who left him for dead, hide in a hideout near Karn Hold. Clear it out.',prize:{approve:['brann',3],xp:80}}}},
    elske:{greet:{loyal:'Bless you. Where do we go?',content:'Yes?',uneasy:'I am listening.',angry:'Say what you must.'},
      about:'I was a sister of the Saltmere hospice until the plague year. We buried more than we saved. I swore I would go where the hurt are, not wait for them to come to me.',
      warn:'Elske will not look at you. "I cannot ride with this much longer."',
      wish:{ask:'There is a holding near here where the people go hungry. Bring them grain and cloth, and I will tend the sick there.',
        kind:'deliver',spec:{title:'Bread for the hungry',give:{grain:20,cloth:5},prize:{approve:['elske',3],xp:60}}}},
    tavi:{greet:{loyal:'Ready when you are!',content:'Hey, captain.',uneasy:'Hm?',angry:'What.'},
      about:'Ashford born. My father was a road-warden; he took me up every hill in the Vale before I could read. I want to see the far edge of the map before I die.',
      warn:'Tavi kicks at the dirt. "I did not sign on to starve, you know."',
      wish:{ask:'Have you ever seen the far side of the world? Take me to the farthest holding there is. Just once.',
        kind:'visit',spec:{title:'The far edge of the map',prize:{approve:['tavi',3],xp:60}}}}
  },
  trust:3,
  // (a companion's opinion, asked how you are doing: their last deed they cared about, by whether they liked it; none: by approval)
  feel:{ransom:{good:'Ransoms! Good coin and no one dies.',bad:'Selling men for silver. I do not like it.'},win:{good:'We won, and well. Keep it up.',bad:'We won, but at what cost?'},
    flee:{good:'Running was wise.',bad:'We ran. I hate running.'},release:{good:'You let them go. That was right.',bad:'You let them go? They will be back.'},
    cruel:{good:'They had it coming.',bad:'That was cruel, and needless.'},mercy:{good:'Mercy. Good.',bad:'Mercy is for the weak.'},
    kind:{good:'That was kind of you.',bad:'Soft.'},hungry:{good:'Hunger hardens a band.',bad:'My belly aches. We need food.'},unpaid:{good:'',bad:'Where is my pay?'},
    none:{loyal:'We are doing well, captain. I am glad I came.',content:'Well enough.',uneasy:'I have had better days.',angry:'Badly.'}},
  // (banter on the road: now and then, two companions in your band, a line each (the first, then the second); either order)
  banter:[{a:'brann',b:'elske',lines:['You patch them up, I cut them down. Fair trade.','I would rather patch fewer.']},
    {a:'brann',b:'tavi',lines:['Quiet, scout. You talk more than you look.','And you look more than you think.']},
    {a:'elske',b:'tavi',lines:['Eat something, Tavi. You are thin as a reed.','Only if you stop fussing.']},
    {a:'brann',b:'elske',lines:['A prisoner is gold walking, sister.','A prisoner is a man, Brann.']}],
  banterDay:.4,
  // (phase 4: your captor's words (world/captivity.js): first, by who holds you; persuaded and refused: you, then theirs)
  captor:{band:'Well, well. What is a fine captain worth, I wonder?',lord:'You are my prisoner, {you}. Let us speak of your ransom.',
    realm:'You will be held until someone pays for you.',broker:'I paid good silver for you. Now you will pay me back, with a little on top.',
    you:'Let me go. You will gain nothing by holding me.',no:'You talk too much. The price just went up.'}
};
// a lord's temper (drawn once, from the stream talk, at your first meeting): how he speaks, and what moves him
const TEMPERS=['proud','honourable','greedy','cunning','kind'];
const TALK_PIC={
  lord:l=>lordPic(l),
  companion:id=>portrait(id),
  captor:c=>c.k==='broker'?personPic('merchant',townBy(c.town)?.races?.[0]||'human',1):c.k==='band'?portrait('militia'):portrait(RACES[fiefsOf(c.fac)[0]?.races?.[0]||'human']?.melee||'hum_foot'),
  folk:(n,t)=>personPic('folk',t?.races?.[0]||'human',n?.v||0),
  guard:(n,t)=>portrait(RACES[t?.races?.[0]||'human']?.melee||'hum_foot'),
  worker:(f,t)=>personPic('folk',t?.races?.[0]||'human',(f?.id||'').length%4)
};
