'use strict';
/* ---------- data: the names you give your hero and your band (ui/names.js; the owner, 2026-10-23) ----------
   max: the longest a name may be (trimmed); band: your band's name while you have given it none (never stored: a save without
   one shows it). A random hero name is a folk name of her race with a byname (world/folk.js FOLK_NAMES, world/sites.js
   SWORD_BYNAMES); a random band name is one of BAND_FORMS filled from BAND_WORDS (the places by your race) */
const NAMING={max:24,band:'The Free Company'};
/* your army's flag (the owner, 2026-11-24: "add army flag customization at the start and use it everywhere for player faction";
   ui/names.js): its field's colour and its device (gfx/sprites.js BANNER_DEV), chosen on the New game page and in the Names window.
   def: the Free Banner's as it always was (a game that keeps it stores none); cols and devs: the choices, each with its name */
const ARMY_FLAG={def:{col:'#f0d060',dev:'crown'},
  cols:[['#f0d060','Gold'],['#c23b3b','Crimson'],['#3f66c4','Royal blue'],['#3e8c4a','Forest green'],['#7d4fb0','Purple'],['#2f2b2b','Black'],['#ebe4d2','White'],['#d9782d','Orange'],['#2c8c8c','Teal'],['#7a5232','Brown']],
  devs:[['crown','Crown'],['star','Star'],['sword','Sword'],['tower','Tower'],['sun','Sun'],['moon','Moon'],['key','Key'],['chevron','Chevron']]};
const BAND_FORMS=['the adj noun','the adj noun','place noun','place adj noun'];
const BAND_WORDS={
  adj:['Grey','Black','Red','Iron','Free','Silver','Golden','Ashen','Wandering','Broken','Lone','Wild','Crimson','Last'],
  noun:['Company','Riders','Blades','Lances','Banners','Brothers','Swords','Hounds','Wolves','Ravens','Shields','Spears','Sworn','Band'],
  place:{human:['Ashford','Redwater','Millbrook','Harrowfield','Greyhollow','Westmarch'],dwarf:['Stonehold','Deepforge','Ironpeak','Hammerdeep','Coldvein'],
    elf:['Silverwood','Moonbrook','Thornvale','Starfall','Willowmere'],orc:['Bloodsand','Skullrock','Dustwater','Redfang','Ashgor']}};
