'use strict';
/* ---------- data: the questbook's first entries (data/questbook/book.js: their shape) ---------- */
Object.assign(QUESTBOOK,{
  // (a tavern's: a visit, a choice with a check, a band to beat)
  millers_debt:{title:'The miller’s debt',ico:'gold',giver:{by:'tavern',name:'The miller',pic:'folk',at:{kind:['village','town']}},when:{level:1},once:true,
    text:'The miller of {town} owes the Red Vipers more than he can pay. They have promised to burn his mill.',
    steps:{
      start:{goal:'visit',to:{town:'{town}',lot:'house'},title:'Hear the miller out',note:'See the miller at his house in {town}.',say:'He shows you their mark, cut deep into his door.',next:'what'},
      what:{title:'The Red Vipers’ mark',text:'“They come back at the new moon,” the miller says. “Eighty gold, or the mill burns.”',note:'Decide what to do for the miller.',choose:[
        {label:'Pay his debt',icon:'gold',gold:80,tip:'Pay them off for him.',say:'You count out the gold for the Vipers.',next:'paid'},
        {label:'Talk them out of it',icon:'truce',check:'talk',tip:'Meet them, and make them see sense.',win:'talked',lose:'fight',winSay:'They grumble, and let the debt go.',loseSay:'They laugh at you. It will come to blows.'},
        {label:'Hunt the band',icon:'sword',tip:'End them.',next:'fight'}]},
      fight:{goal:'beat',band:{name:'Red Vipers'},n:5,title:'Break the Red Vipers',note:'Find the Red Vipers near {town} and break them.',next:'won'},
      paid:{end:{reward:{rep:3},say:'The miller weeps with relief.'}},
      talked:{end:{reward:{rep:4,honor:2,xp:40},say:'The miller can hardly believe it.'}},
      won:{end:{reward:{gold:60,rep:6,xp:80},say:'The Vipers will trouble no one again.'}}}},
  // (a notice board's: one step, goods to bring)
  poorhouse_grain:{title:'Bread for the poorhouse',ico:'sack',giver:{by:'board',at:{kind:['town','city']}},cool:20,
    text:'The poorhouse of {town} has run out of grain. Bring them some.',
    steps:{start:{goal:'deliver',to:{town:'{town}',lot:'house'},give:{grain:10},title:'Bread for the poorhouse',note:'Bring 10 grain to the poorhouse in {town}.',say:'The sisters bless you.',days:12,reward:{gold:40,rep:4}}}},
  // (a lord's: carry his word to another holding of his realm)
  lords_word:{title:'A word for the steward',ico:'scroll',giver:{by:'lord'},when:{rel:0},cool:15,
    text:'{lord} wants a word carried to his steward, quickly and quietly.',
    steps:{start:{goal:'visit',to:{pick:'realm'},title:'Carry {lord}’s word',note:'Carry {lord}’s word to {to}.',say:'The steward reads it, and burns it.',days:8,reward:{gold:30,rel:5,honor:2}}}},
  // (the road's: a page first, a check, a beast hunt)
  shepherds_wolves:{title:'The shepherd’s wolves',ico:'sheep',giver:{by:'road',name:'A shepherd',pic:'folk'},cool:30,
    text:'A shepherd waves you down: something has been taking his flock at night.',
    steps:{
      start:{title:'The shepherd’s flock',text:'“Three ewes this week,” he says. “Tracks as big as my hand.”',note:'Hear the shepherd out.',choose:[
        {label:'Follow the tracks',icon:'eye',check:'track',win:'hunt',lose:'lost',winSay:'The trail is plain: you know where they den.',loseSay:'The tracks vanish in the rocks.'},
        {label:'Ride on',icon:'shoe',next:'left'}]},
      hunt:{goal:'hunt',title:'Hunt the beasts',note:'Hunt down the beasts taking the shepherd’s flock.',next:'thanks'},
      thanks:{end:{reward:{gold:35,rep:5,xp:60},say:'The shepherd presses a cheese on you, and his thanks.'}},
      lost:{end:{reward:{morale:-2},say:'You lose the trail, and the shepherd his hope.',failed:true}},
      left:{end:{say:'You leave him to his flock.'}}}},
  // (a temple's: a rescue from a hideout)
  pilgrim_taken:{title:'The taken pilgrim',ico:'altar',giver:{by:'temple',name:'The priest',pic:'folk'},once:true,
    text:'Brother Aldo set out for the shrine a week ago. Bandits took him on the road.',
    steps:{start:{goal:'rescue',held:'lair',n:'Brother Aldo',title:'Free Brother Aldo',note:'Free Brother Aldo from the hideout where he is held.',say:'You cut Brother Aldo loose. He blesses you through cracked lips.',reward:{rep:6,renown:3,xp:60}}}},
  // (a companion's: a choice with a heal check, then a visit, their approval)
  elske_fever:{title:'Elske’s fever-house',ico:'wounded',giver:{by:'comp',comp:'elske',name:'Elske',ask:'Elske, you look troubled.'},when:{approve:1},once:true,
    text:'Elske has heard of a fever in {town}.',
    steps:{
      start:{title:'Elske’s worry',text:'“There is a fever in {town},” Elske says. “They have no one to tend them. Will you help me?”',note:'Answer Elske.',choose:[
        {label:'Help her tend them',icon:'wounded',check:'heal',win:'go',lose:'go',winSay:'You learn her ways quickly.',loseSay:'You will have to follow her lead.'},
        {label:'Not now',icon:'shoe',next:'no'}]},
      go:{goal:'visit',to:{town:'{town}',lot:'house'},title:'The fever-house',note:'Go with Elske to the fever-house in {town}.',say:'For three days you carry water and burn rags.',next:'thanks'},
      thanks:{end:{reward:{approve:3,rep:5,xp:50},say:'“You did not have to,” Elske says. “Thank you.”'}},
      no:{end:{reward:{approve:-1},say:'Elske says nothing, and turns away.'}}}},
  // (a lord's: an enemy lord to beat, the whole of it in 30 days)
  lords_enemy:{title:'The enemy’s champion',ico:'sword',giver:{by:'lord'},when:{realm:'same',war:true},cool:20,fail:{days:30,say:'{lord} has found someone else for the work.',out:{rel:-3}},
    text:'{lord} wants an enemy lord brought low before the month is out.',
    steps:{start:{goal:'kill',lord:'enemy',title:'Bring down an enemy lord',note:'Beat {to} in battle.',stage:'The enemy lord',say:'{lord} will hear of it.',reward:{gold:120,rel:8,honor:5,renown:5}}}}
});
