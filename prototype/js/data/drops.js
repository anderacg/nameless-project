'use strict';
/* ---------- data: what falls in a fight (the owner, 2026-11-09: "it drops something on the ground like just cool dot effects or small
   icons for exp and items", "can you make this drops in the other battle type too?"; doc/ACTION_DESIGN.md §0) ----------
   on: drawn at all (the tests' harness: off, so no picture moves); loot: the coins and gear on the ground are real (picked up into your
   purse and bag), else drawn only; xp: the experience a kill is worth to your hero, shown (the end of the fight pays it, as ever);
   dots: how many dots a kill bursts into, gold to your hero, blue to the soldier who struck it; speed: the dots' flight (px a second, ×
   the map's scale in a battle on the map); coin: the chance of coins from a man, and how many (a range); gear: the chance he drops his
   gear (a piece of his tier); beast: the chance a beast leaves its hide (its kind's: data/monsters.js MATS); pick: how near your hero or
   a companion draws them in (px); bob: the ground's icons' bob (px) and glint period (s); col: the dots' and coins' colours */
// (art: px a ground item's picture is drawn, the inventory's illustration: battle/drops.js)
const DROPS={on:true,art:14,loot:true,xp:8,dots:{xp:6,troop:3},speed:220,coin:{chance:.6,n:[1,4]},gear:.1,beast:.6,pick:26,bob:[1.5,1.6],
  col:{xp:'#ffd54a',xpCore:'#fff6c8',troop:'#7fc8ff',troopCore:'#e6f6ff',coin:'#f2c94c',coinEdge:'#a8781c'}};
