'use strict';
/* graphics quality (the owner, 2026-11-18: "Can we optimize the game performance on mobile?", then "go ahead with 1-3"): what each
   level draws, chosen in Settings → Graphics (PREFS gfx, ui.js; applied by gfx/quality.js). A level's number left out is the game's
   own (High leaves them all out: the game as it always was). The trees and the grass are the same at every level, the land drawn as
   fine, every clump and its bending by feet (the owner, 2026-11-18: "can you remove the settings for trees and grasses, right now it
   seems weird"): no level sets fine, grass or feet, kept here for a test's or a dev's use.
     fine: the scene's fine px a game px at most (render.js resAt: 1 the map at its game px, so no fine grass, no fine buildings and a
       quarter of the painting); cap: device px a CSS px at most and fps: frames a second at most, each the lower of it and
       Settings → Resolution's and Frame rate's (ui.js renderCaps);
     grass: the share of the grass clumps drawn (worldterrain.js terrainEnts, by each clump's place: the same ones always); feet: the
       grass bent by feet (grassFeet);
     fx: battle effects light (the rings, flashes and trails only: vfx.js fxLite) or full; fxCap: the fighters' state particles at
       once (vfx.js fxp); vfx: the blows' particles at once (VFX.max);
     ambient: ambient life's numbers (AMBIENT.density); mist: its cells' px and the ms its misty picture is kept (MIST.res,
       WFOG.mistEvery); mini: the ms between the minimap's faces and between its land picture's looks (MINIMAP.world, refresh).
   auto: what Auto picks: on a phone (a coarse pointer, the screen's short side under short px) phone, else desk; on the phone the
   first frames on the map timed (frames of them, once after ms of play) and, their median work over slow ms, stepped down to weak,
   the phone remembered as weak (its own key, ashmark.gfxweak). The tests' pages always High, unless a test asks (Quality.testAuto) */
const QUALITY={
  levels:{
    low:{cap:1.5,fps:30,fx:'light',fxCap:80,vfx:250,ambient:.4,mist:[16,240],mini:[600,4000]},
    medium:{fps:30,fxCap:160,vfx:450,ambient:.7,mist:[12,120],mini:[300,2000]},
    high:{}},
  auto:{phone:'medium',weak:'low',desk:'high',short:900,frames:90,after:3000,slow:30},
  names:{auto:'Auto',low:'Low',medium:'Medium',high:'High'}};
