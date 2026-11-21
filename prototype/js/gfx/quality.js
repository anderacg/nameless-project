'use strict';
/* ---------- graphics quality applied (data/quality.js QUALITY; Settings → Graphics: PREFS gfx, ui.js) ----------
   Quality.level: the level in force ('low', 'medium', 'high'), Quality.now its numbers; apply() as the setting changes (at once, no
   reload: the map's chunks painted coarser are painted finer again in the background, worldart.js); pick(v) what a setting means
   here (Auto: the phone test, the weak phone remembered); watch(now) Auto's first frames on a phone (main.js paintIdle); note() the line Settings shows under the choice */
const Quality={
  base:null,level:'high',now:null,testAuto:false,W:null,
  phone(){try{return typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<QUALITY.auto.short}catch(e){return false}},
  weak(){try{return localStorage.getItem('ashmark.gfxweak')==='1'}catch(e){return false}},
  setWeak(on){try{if(on)localStorage.setItem('ashmark.gfxweak','1');else localStorage.removeItem('ashmark.gfxweak')}catch(e){}},
  pick(v){if(QUALITY.levels[v])return v;const A=QUALITY.auto;if(!this.testAuto&&typeof location!=='undefined'&&/[?&]test=/.test(location.search))return A.desk;return this.phone()?(this.weak()?A.weak:A.phone):A.desk},
  apply(){const B=this.base||(this.base={fine:WORLD_VIEW.fine,fxCap:FXP_CAP,vfx:VFX.max,ambient:AMBIENT.density,mist:[MIST.res,WFOG.mistEvery],mini:[MINIMAP.world,MINIMAP.refresh]});
    const lv=this.pick(prefGet('gfx')),Q=QUALITY.levels[lv],o=(k,d)=>Q[k]===undefined?d:Q[k];
    this.level=lv;this.now={fine:o('fine',B.fine),cap:o('cap',Infinity),fps:o('fps',60),grass:o('grass',1),feet:o('feet',true),fx:o('fx','full'),fxCap:o('fxCap',B.fxCap)};
    VFX.max=o('vfx',B.vfx);AMBIENT.density=o('ambient',B.ambient);[MIST.res,WFOG.mistEvery]=o('mist',B.mist);[MINIMAP.world,MINIMAP.refresh]=o('mini',B.mini);
    RENDER.fine=this.now.fine;this.W=null;renderCaps();return lv},
  // (Auto on a phone: the work of its first frames on the map (from the frame's start to its spare time), once play has gone on
  //  after ms; their median over slow ms: the weak phone's level, remembered for the next game)
  watch(now){const A=QUALITY.auto;if(prefGet('gfx')!=='auto'||this.level!==A.phone||this.weak())return;
    const W=this.W||(this.W={t0:now,f:[]});if(now-W.t0<A.after||W.done)return;W.f.push(performance.now()-now);if(W.f.length<A.frames)return;
    W.done=true;const m=W.f.slice().sort((a,b)=>a-b)[W.f.length>>1];W.median=m;if(m>A.slow){this.setWeak(true);this.apply();if(typeof toast==='function')toast('Graphics set to '+QUALITY.names[this.level]+' for this device (Settings → Graphics).')}},
  note(){const v=prefGet('gfx'),n=QUALITY.names;return (v==='auto'?'Auto: '+n[this.level]+' on this device. ':'')+'The land, trees and grass look the same at every level. Low: fewer effects, ambient life and mist, the screen a little coarser, at 30 frames a second; Medium: fewer particles, at 30; High: everything, at up to 60.'}};
Quality.apply();
