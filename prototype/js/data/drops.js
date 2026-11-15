'use strict';
/* ---------- data: what falls in a fight (the owner, 2026-11-09: "it drops something on the ground like just cool dot effects or small
   icons for exp and items", "can you make this drops in the other battle type too?"; doc/ACTION_DESIGN.md §0) ----------
   on: drawn at all (the tests' harness: off, so no picture moves); loot: the coins and gear on the ground are real (picked up into your
   purse and bag), else drawn only; xp: the experience a kill is worth to your hero, shown (the end of the fight pays it, as ever);
   dots: how many dots a kill bursts into, gold to your hero, blue to the soldier who struck it; speed: the dots' flight (px a second, ×
   the map's scale in a battle on the map); coin: the chance of coins from a man, and how many (a range); gear: the chance he drops his
   gear (a piece of his tier), gears at most a fight (the 2026-11-13 balance: .1 a man, a lord's battle of 50 left 5 pieces); beast: the chance a beast leaves its hide (its kind's: data/monsters.js MATS); pick: how near your hero or
   a companion draws them in (px); bob: the ground's icons' bob (px) and glint period (s); col: the dots' and coins' colours */
// (art: px a ground item's picture is drawn, the inventory's illustration: battle/drops.js)
// worn: besides a whole piece, the chance a man leaves a damaged one of his tier (data/gear.js DAMAGED) and the chance of junk (JUNK),
// most of both a fight (the owner, 2026-11-13: "make drops for junk gears / damaged gear")
const DROPS={on:true,art:14,loot:true,xp:8,dots:{xp:6,troop:3},speed:220,coin:{chance:.6,n:[1,4]},gear:.03,gears:2,worn:{damaged:.06,junk:.15,most:5},beast:.6,pick:26,bob:[1.5,1.6],
  col:{xp:'#ffd54a',xpCore:'#fff6c8',troop:'#7fc8ff',troopCore:'#e6f6ff',coin:'#f2c94c',coinEdge:'#a8781c'}};
/* the fallen of a fight on the map (world/carcasses.js Carcass; the owner, 2026-11-14: "trophy required player to click at carcass
   to loot them", "we need a window to decide which to take and inspect"): what the fight gave lies on them (DROPS then leaves no
   gear, coins or hides about the field: only its dots), a click on one opens all within near px of it (pick: px a click finds one);
   they rot: days with anything on them, bare once picked clean, most kept on the map; a band within seek px of ones you cannot see
   picks them over, by find an hour (its plunder yours if you beat it); col: a plain one's (after a load), its glint */
// A thing lying to be taken (a carcass with something on it, world/carcasses.js; the field's drops, battle/drops.js): a soft glow round
// it (col, rgb), breathing between a's alpha at speed, r px at the world's scale; a glint rising from it every 1/rise s (the owner,
// 2026-11-15: "if there's item on ground and not picked yet, make sure we have a glowing or something noticeable")
const LOOT_GLOW={on:true,r:12,a:[.3,.7],speed:2.6,rise:.7,col:'255,206,90'};// (added on the ground: it lights it)
const CARCASS={on:true,near:40,pick:8,days:3,bare:1,most:240,seek:160,find:.35,col:{hide:'#7a5a3e',bone:'#e4dccb',cloth:'#6a5e50',glint:'#ffe08a'},
  // (looters (the owner, 2026-11-15: "make random looters loot or check body"): a band near the fallen walks to them, searches them
  //  check s of world time once within at px (its men round them), takes what is on them; while fresh ones (laid within fresh days) hold something and no band is near, a
  //  band of n looters may come out of the wilds for them each hour (spawn), from px off, out of your sight, most of them at once)
  loot:{at:24,check:6,fresh:1,spawn:.25,n:[2,4],from:[220,320],most:3,kind:'band_looter'},
  // (clearers (the owner: "make people work to clear those corpses"): folk of the nearest holding within reach px of its gate come
  //  out to the fallen, picked clean ones after bare days, any after after days (what is on them theirs), and dig a while (dig s),
  //  their pace px a s; out of your sight they are simply gone)
  clear:{after:1.5,bare:.25,reach:420,dig:8,pace:20,most:3}};
/* junk (the owner, 2026-11-13): broken pieces a fallen man leaves (DROPS.worn.junk), good for nothing but a few coins at any market,
   as a trophy is (data/monsters.js MATS: v its worth, icon and col its picture) */
const JUNK={junk_blade:{n:'Broken Blade',v:3,icon:'blade',col:'#7d7b72'},junk_links:{n:'Rusted Mail Links',v:2,icon:'plate',col:'#8a6a4a'},
  junk_helm:{n:'Dented Helm',v:3,icon:'helm',col:'#7d7b72'},junk_shield:{n:'Splintered Shield',v:2,icon:'shield',col:'#8a6a40'},
  junk_boots:{n:'Torn Boots',v:1,icon:'boots',col:'#6a5040'},junk_bow:{n:'Snapped Bow',v:2,icon:'bow',col:'#8a6a40'},junk_buckle:{n:'Bent Buckle',v:1,icon:'belt',col:'#9a8a5a'}};
for(const k in JUNK)MATS[k]={...JUNK[k],junk:true};
