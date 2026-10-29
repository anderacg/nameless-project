'use strict';
// Drawing on a phone (core.js RENDER, the owner 2026-10-29: "it lags on mobile"): the Resolution setting caps the density drawn at
// (Full: the screen's own, Balanced 2, Fast 1.5), the Frame rate setting the frames a second (60 or 30); both kept as settings, and
// the canvas's pixels follow the cap while its size on the page stays the same.
Kit.suite(({ok})=>{const t=T,R=t.RENDER,keep={res:t.prefGet('res'),fps:t.prefGet('fps')};
 try{
  const dpr=window.devicePixelRatio||1;
  t.prefSet('res','full');ok(R.cap===Infinity&&t.dprOf()===dpr,'Full: the screen\'s own density ('+dpr+')');
  t.prefSet('res','bal');ok(R.cap===2&&t.dprOf()===Math.min(dpr,2),'Balanced: at most 2');
  t.prefSet('res','fast');ok(R.cap===1.5&&t.dprOf()===Math.min(dpr,1.5),'Fast: at most 1.5');
  t.prefSet('res','nonsense');ok(t.prefGet('res')==='bal','anything else read as Balanced');
  t.prefSet('fps',30);ok(R.fps===30&&t.prefGet('fps')===30,'Frame rate 30');t.prefSet('fps',60);ok(R.fps===60,'Frame rate 60');t.prefSet('fps',144);ok(R.fps===60,'any other: 60');
  const h=t.settingsPage();
  ok(/data-act="res" data-arg="fast"/.test(h)&&/data-act="fps" data-arg="30"/.test(h),'both in the Settings window');t.prefSet('res','bal');t.settingAct('res','fast');ok(t.prefGet('res')==='fast','its buttons set them')
 }finally{t.prefSet('res',keep.res);t.prefSet('fps',keep.fps)}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
