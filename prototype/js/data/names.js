'use strict';
/* ---------- data: the names you give your hero and your band (ui/names.js; the owner, 2026-10-23) ----------
   max: the longest a name may be (trimmed); band: your band's name while you have given it none (never stored: a save without
   one shows it). A random hero name is a folk name of her race with a byname (world/folk.js FOLK_NAMES, world/sites.js
   SWORD_BYNAMES); a random band name is one of BAND_FORMS filled from BAND_WORDS (the places by your race) */
const NAMING={max:24,band:'The Free Company'};
const BAND_FORMS=['the adj noun','the adj noun','place noun','place adj noun'];
const BAND_WORDS={
  adj:['Grey','Black','Red','Iron','Free','Silver','Golden','Ashen','Wandering','Broken','Lone','Wild','Crimson','Last'],
  noun:['Company','Riders','Blades','Lances','Banners','Brothers','Swords','Hounds','Wolves','Ravens','Shields','Spears','Sworn','Band'],
  place:{human:['Ashford','Redwater','Millbrook','Harrowfield','Greyhollow','Westmarch'],dwarf:['Stonehold','Deepforge','Ironpeak','Hammerdeep','Coldvein'],
    elf:['Silverwood','Moonbrook','Thornvale','Starfall','Willowmere'],orc:['Bloodsand','Skullrock','Dustwater','Redfang','Ashgor']}};
