'use strict';
/* ---------- what villagers wear, by the land they live in (the owner, 2026-11-14: "make a clothing variation for villagers like using
   white, or natural colors and material based on locations. The colder area may wear fur clothes") ----------
   By climate (data/places.js CLIMS: grass, frost, desert, swamp): outer (their coat or tunic), inner (their shirt and its trim), head
   (bare, a straw hat, a hood, a wolf's or a bear's pelt), hood (its cloth), robe (the share in a long robe), cape (fur cloaks: their
   colours, cloak the share who wear one), trade (true: the trades' own coats give way to it too, a smith in furs in the frost; else
   they keep theirs and take only the shirt). The colours are people.js PPAL's: undyed linen, white, hemp, wool, ash grey, sand,
   reed (the marsh's dull green), leather, fur. on: the switch (off, everyone as before) */
const FOLK_DRESS={on:true,
  grass:{outer:['linen','white','hemp','cloth','wool','ash','leather','hemp'],inner:['hemp','linen','ash','dark','white'],head:['bare','bare','bare','straw','hood','bare'],hood:['linen','hemp','ash'],robe:.15},
  frost:{outer:['fur','fur','wool','leather','fur','ash'],inner:['wool','ash','dark','fur'],head:['pelt_wolf','pelt_bear','hood','pelt_wolf','hood'],hood:['fur','wool','ash'],robe:.1,
    cape:['#c8c4b8','#7a5236','#a89070','#d8d0c0'],cloak:.75,trade:true},
  desert:{outer:['white','linen','sand','white','hemp','sand'],inner:['white','linen','sand'],head:['hood','hood','bare','hood'],hood:['white','linen','sand'],robe:.55,trade:true},
  swamp:{outer:['reed','hemp','ash','leather','dark','reed'],inner:['dark','ash','hemp'],head:['hood','bare','bare','hood'],hood:['reed','ash','dark'],robe:.1}};
