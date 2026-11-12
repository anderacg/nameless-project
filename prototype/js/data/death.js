'use strict';
/* ---------- data: a fight lost to beasts (the owner, 2026-11-09: "When you lost to the beast, or monster, you should be dead. But
   there might be a chance that you may survived which would be wounded but the day should be passed and the monster should not be
   there anymore"; doc/DEATH_DESIGN.md). World/death.js Death reads it ----------
   on: the rule at all (the tests' harness: off, a beast's loss as before); die: a roll lost kills you (phase 2; then you go on as a new person in the
   same world, phase 3: world/legacy.js); live: the chance to live, shifted (shift) and kept within min-max:
     med: a point of the best Medicine among those who fell; armor: your body armour's class; day / night; near: a holding within
     near tiles; road: on a road; lv: each level of the beast past the first (less); big: a big beast (less); mythic (less); frost: a
     frost night (less); alone: no companion and no soldier with you (less);
   wake: the hours you lie there; hp: your health on waking (of the most); weak: the days you are weak, and your damage and speed
   while so; food: the share of your food the beasts eat; horse: the chance your horse bolts (lost);
   comps: where your companions wake (among the n nearest holdings), wounded for hurt days; after wander days they leave your service
   for another holding (a tile range), their approval left lower; won back: a talk (base, a point of Persuasion, a point of approval,
   min-max; one a day) or their pay (base + lv a level);
   pass: the chance each passenger you escort lives (else slain);
   eater: the chance the beast becomes a man-eater: levels and beasts it gains, its bounty (× a quest's gold that marks it), the
   renown for slaying it, the parts of its name; slayer: the bounty on one that killed you (gold, a level of yours more);
   grave (phase 4): the share of the experience the fallen gained that their grave holds; where it lies (a cairn this many px off where
   they fell; a grave this far from their heir's holding); the chance a day it is talked of; its light at rest (motes, their rise a
   second, how high, its breathing) and as it flows into you when you pray (seconds, motes, how far apart they leave, their curve,
   the gain shown for so long); its place (art: its picture's size and foot, its ground's oval, tufts, flowers, fireflies by night,
   the cairn's ring of stones, its rows, the blade in it, the grave's fence: gfx/graveart.js; yard: how far from the holding, the
   ways tried; past its lots and fields: how far out to look (min, max, step px), the tiles about it that must be clear of lots,
   fields and water (clear), and of any holding (town px), the woods counted round it (wood tiles) and how much nearer counts
   against them (near, a step); find: unburied, the days before your heir comes for them, the chance a day someone finds and buries them near people
   and far from anyone, more by each point of renown, at most max; plot: your family's plot, its rows of graves (to a row, apart, rows closer) and the wall round them (px out); tiers: how you are laid to rest (far: tiles from any holding, off the roads, that no one buries you; the renown a cairn
   needs there; near people, the renown each finer grave needs: a small grave, a headstone, a fenced plot, a tomb; how much each kind
   is talked of); words: each kind's names and lines; apart: no two graves nearer, rings: how far out to look for room, for you may die many times in one place); its colours;
   house (the lords' houses, world/lineage.js): the chance a lord dies when his army is beaten, the days of mourning before one of his
   house takes his place, the levels the next has less, their men, what paying your respects at a crypt gives with its living lords
   (relation), the grudge a house holds when one of it dies by your hand (relation, its living lords and the next), the titles that follow their bearer's sex (others stay as they are);
   kin (world/legacy.js: going on as kin of the one who fell): the share of their renown you carry, of their lords' regard and grudges,
   the standing you begin with where the family is known;
   heir (phase 3): the approval a companion needs to be your heir (Loyal), the approval the others need to ride with them (Content),
   the men they start with when they led no party of their own;
   remains (phase 2, dying): the share of your gold left with them (the rest scattered), how near a band finds them (seek px) and its
   chance an hour, their look;
   claim (world/claims.js; the owner, 2026-11-12: "anyone can get it just that they reward differently based on the situations"): on:
   the rule (off: the same for anyone, as before); kin: the experience's share kin of the fallen pray for; stranger: one of no blood of
   theirs, its share, and the standing lost at the family's holding for taking their things; rest: the experience by where they lie
   (the family plot's and each kind's: the most kept); wild: each day a body lies unburied, the share of its first experience lost
   (never below floor of it), of its gold, and the chance each piece is lost; lord: how near a lord's army finds an unburied body
   (seek px), its chance a day, his steward's price (a share of their worth: kin, a stranger); comp: the fallen's companions, how
   near their tavern (tiles), the chance a day, a stranger's price; guard: a beast whose lair lies this near (tiles) guards a body */
const DEATH={on:true,die:true,live:.3,min:.1,max:.6,
  shift:{med:.03,armor:{leather:.03,mail:.06,plate:.1},day:.05,night:-.05,near:.08,road:.04,lv:.02,big:.08,mythic:.2,frost:.06,alone:.05},near:12,
  wake:24,hp:.2,weak:{days:3,dmg:.85,spd:.9},food:.6,horse:.5,
  comps:{n:3,hurt:2,wander:7,far:[8,30],left:2,talk:{base:.35,pers:.05,ap:.04,min:.1,max:.9},pay:{base:40,lv:12}},
  heir:{ap:5,follow:0,men:4},
  /* kin (the owner, 2026-11-10: "you cannot start as someone who is already old, you should be a new one that just born and grow";
     which kin, random): a share of their renown, of their lords' regard, your standing where the family is known; past: the young
     one's own, just come of age, little of their own (as a Nobody's start: bare hands, these coins and food, a little Athletics),
     the family's keepsake in their bag */
  kin:{renown:.1,rel:.5,rep:10,past:{gold:20,cargo:{grain:4},sk:{athl:1}}},
  house:{slain:.06,wait:5,lv:2,men:6,respect:3,grudge:-40,tell:50,
    // (a house's family: a lord wed as his house is first known (wed) with 0-2 children (kids) of 0-200 days (age); of age at adult days;
    // each day one of age and unwed may wed (marry), a couple have a child (birth) up to most; no more than cap of it alive)
    fam:{wed:.75,kids:[0,2],age:[0,200],adult:120,marry:.01,birth:.01,most:4,cap:24},
    titles:{Lord:['Lord','Lady'],Lady:['Lord','Lady'],Ser:['Ser','Dame'],Dame:['Ser','Dame'],Thane:['Thane','Clanmother'],Clanmother:['Thane','Clanmother'],
      Warchief:['Warchief','Warmother'],Warmother:['Warchief','Warmother'],Warden:['Warden','Warden'],Admiral:['Admiral','Admiral'],Captain:['Captain','Captain']}},
  grave:{share:.5,find:{heir:3,near:.3,far:.04,renown:.002,max:.9},cairn:12,yard:{r:70,tries:12,min:110,max:330,step:22,clear:2,town:90,wood:3,near:.6},apart:34,rings:6,plot:{cols:4,gap:30,row:.8,wall:16},
    tiers:{far:22,cairn:50,near:{small:0,stone:50,grave:200,tomb:500},talk:{remains:0,small:.5,stone:1,cairn:1,grave:1,tomb:1}},
    words:{remains:{h:'Remains',label:'Body',name:'Remains of ',tip:'The remains of ',at:'over the remains of',line:'No one came to bury them: bones in the grass, picked at by beasts. '},
      small:{h:'A small grave',label:'Grave',name:'Grave of ',tip:'A small grave: ',at:'at the small grave of',line:'A mound of earth and a cross of sticks by {at}, dug by someone who passed: '},
      stone:{h:'A grave',label:'Grave',name:'Grave of ',tip:'The grave of ',at:'at the grave of',line:'A headstone by {at}, flowers on the mound: '},
      tomb:{h:'A tomb',label:'Tomb',name:'Tomb of ',tip:'The tomb of ',at:'at the tomb of',line:'A tall stone by {at}, railed in iron, its candles kept lit: '},
      cairn:{h:'A cairn',label:'Cairn',name:'Cairn of ',tip:'The cairn over ',at:'at the cairn of',line:'Stones piled by the road: '},
      grave:{h:'A grave',label:'Grave',name:'Grave of ',tip:'The grave of ',at:'at the grave of',line:'A stone by {at}, kept clean: '}},rumour:.35,idle:{motes:10,rise:.3,h:20,breathe:2.2},flow:{dur:2.4,motes:36,spread:.55,bend:26,arc:22,show:1.6},
    art:{w:56,h:44,foot:12,ground:[22,10],groundOf:{remains:[10,5],small:[12,6],stone:[14,7],tomb:[26,12],crypt:[24,11]},rail:{w:34,h:16,gap:3},tufts:16,flowers:9,flies:6,ring:{n:7,rx:17,ry:8},rows:[14,12,9,6,3],blade:8,fence:{w:30,h:14,gap:4}},
    col:{stone:'#8d8f95',stone2:'#7a7c82',light:'#b3b5bb',shade:'#5c5e64',dark:'#3e3f44',moss:'#6f8a4a',mound:'#5b4a3a',earth:'#7a6a50',earth2:'#6b5a44',grass:'#5f7d3c',grass2:'#7a9a4c',
      flowers:['#e06a6a','#f2d16b','#f4f0e6','#b88ae0'],blade:'#c8ccd2',guard:'#b08a3a',grip:'#5a3a22',cloth:'#f0d060',wood:'#6a4a2e',cloak:'#4a3a30',iron:'#3a3c42',bone:'#e8dfc8',wood2:'#4e3520',carve:'#5c5e64',wax:'#f3ead2',flame:'#ffb347',flame2:'#fff2a8',fly:'#d8ff8a',
      glow:'#ffe7a0',mote:'#ffd54a',mote2:'#9fd8ff',core:'#fffbe6',text:'#ffe08a'}},pass:.5,remains:{gold:.6,seek:160,find:.15,col:{cloth:'#5b4a3a',bone:'#e8dfc8',steel:'#9aa4ad',glint:'#ffffff'}},
  claim:{on:true,kin:{xp:1},stranger:{xp:.5,rep:5},rest:{plot:1.15,grave:1.1,tomb:1.3},wild:{xp:.05,floor:.5,gold:.08,item:.05},
    lord:{seek:140,find:.2,price:{kin:.4,stranger:.8}},comp:{near:25,find:.15,price:.3},guard:4},
  eater:{chance:.6,lv:2,n:1,bounty:1.5,renown:12,slayer:{base:100,lv:30},first:['Grey','Red','Black','Old','Scarred','Pale','Hollow','Silent'],last:['Widow','Maw','Hunger','Shadow','Fang','Reaver','Ghost','Butcher']}};
