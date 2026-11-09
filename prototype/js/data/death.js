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
   ways tried; apart: no two graves nearer, rings: how far out to look for room, for you may die many times in one place); its colours;
   heir (phase 3): the approval a companion needs to be your heir (Loyal), the approval the others need to ride with them (Content),
   the men they start with when they led no party of their own;
   remains (phase 2, dying): the share of your gold left with them (the rest scattered), how near a band finds them (seek px) and its
   chance an hour, their look */
const DEATH={on:true,die:true,live:.3,min:.1,max:.6,
  shift:{med:.03,armor:{leather:.03,mail:.06,plate:.1},day:.05,night:-.05,near:.08,road:.04,lv:.02,big:.08,mythic:.2,frost:.06,alone:.05},near:12,
  wake:24,hp:.2,weak:{days:3,dmg:.85,spd:.9},food:.6,horse:.5,
  comps:{n:3,hurt:2,wander:7,far:[8,30],left:2,talk:{base:.35,pers:.05,ap:.04,min:.1,max:.9},pay:{base:40,lv:12}},
  heir:{ap:5,follow:0,men:4},
  grave:{share:.5,cairn:12,yard:{r:70,tries:12},apart:34,rings:6,rumour:.35,idle:{motes:10,rise:.3,h:20,breathe:2.2},flow:{dur:2.4,motes:36,spread:.55,bend:26,arc:22,show:1.6},
    art:{w:56,h:44,foot:12,ground:[22,10],tufts:16,flowers:9,flies:6,ring:{n:7,rx:17,ry:8},rows:[14,12,9,6,3],blade:8,fence:{w:30,h:14,gap:4}},
    col:{stone:'#8d8f95',stone2:'#7a7c82',light:'#b3b5bb',shade:'#5c5e64',dark:'#3e3f44',moss:'#6f8a4a',mound:'#5b4a3a',earth:'#7a6a50',earth2:'#6b5a44',grass:'#5f7d3c',grass2:'#7a9a4c',
      flowers:['#e06a6a','#f2d16b','#f4f0e6','#b88ae0'],blade:'#c8ccd2',guard:'#b08a3a',grip:'#5a3a22',cloth:'#f0d060',wood:'#6a4a2e',wood2:'#4e3520',carve:'#5c5e64',wax:'#f3ead2',flame:'#ffb347',flame2:'#fff2a8',fly:'#d8ff8a',
      glow:'#ffe7a0',mote:'#ffd54a',mote2:'#9fd8ff',core:'#fffbe6',text:'#ffe08a'}},pass:.5,remains:{gold:.6,seek:160,find:.15,col:{cloth:'#5b4a3a',bone:'#e8dfc8',steel:'#9aa4ad',glint:'#ffffff'}},
  eater:{chance:.6,lv:2,n:1,bounty:1.5,renown:12,slayer:{base:100,lv:30},first:['Grey','Red','Black','Old','Scarred','Pale','Hollow','Silent'],last:['Widow','Maw','Hunger','Shadow','Fang','Reaver','Ghost','Butcher']}};
