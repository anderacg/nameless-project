'use strict';
// The hero's moves, made flashy (gfx/herofx.js HERO_FX; the owner, 2026-10-30: "flashy hero moves and effects"): a ribbon on
// each swing, the finisher's zoom-punch and flash, a crit's star and beat of slow motion (capped), whirlwind after-images, a
// dash's streak, a spell's sparks and burst, a landing's debris and shockwave, her glow; Light keeps the ribbons and flashes;
// all drawn only (no Math.random, no battle field changed).
window.RUN=()=>{const t=T,L=t.BattleLab,G=t.G,P=t.P,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),random=Math.random,ev=s=>(0,eval)(s);try{
 const wait=ms=>{const e=performance.now()+ms;while(performance.now()<e);};
 const kinds=()=>t.FXP.map(p=>p.k),has=k=>kinds().includes(k),count=k=>kinds().filter(x=>x===k).length;
 t.prefSet('bfx','full');
 // ======== in a battle of your own: your hero swings, and her blows tell the effects
 ev('MANUAL_HERO=true');P.level=5;P.troops={militia:2};P.comps={};G.mouse.in=false;P.hp=P.sp=P.mp=null;G.mode='world';G.modal=false;P.gear.weapon=t.gearId('sword',0);
 G.enc={kind:'party',ref:{cool:0},list:['chief']};t.startBattle({enemies:['chief'],tournament:false});t.beginFight();
 const B=t.B,h=B.hero,e=B.units.find(u=>u.team===1);B.noMorale=true;e.x=h.x+10;e.y=h.y;e.cd=99;e.hp=e.max=9999;B.aim=0;
 t.FXP.length=0;h.cd=0;t.swing();ok(has('trail'),'a swing of hers: a ribbon of light along its arc');
 {const V=t.HERO_VIEW;t.battleEvent('swing',{u:h,c:{shape:'arc',arc:.9,dir:1},a:0,r:20,n:1,last:true});wait(40);const z=t.heroZoom(),f=t.heroFlash();
  ok(z>1&&z<1.1&&f>0,'the finisher landing: a zoom-punch (×'+z.toFixed(3)+') and a flash over the field ('+f.toFixed(2)+')');
  {const z0=V.zoom,n0=t.FXP.length;t.battleEvent('swing',{u:e,c:{shape:'arc'},a:0,r:20,n:1,last:true});ok(V.zoom===z0&&t.FXP.length===n0+1,'a foe\'s finisher: its ribbon, never your view\'s punch')}
  wait(260);ok(t.heroZoom()===1&&t.heroFlash()===0,'and both gone within a fifth of a second')}
 // ======== a crit: a star, and a beat of slow motion, at most once every few seconds
 {t.FXP.length=0;const V=t.HERO_VIEW;V.beatAt=-99;V.beat=0;t.battleEvent('blow',{u:h,e,crit:true,kill:false});
  const d=t.heroBeat(.02);ok(has('star')&&d<.02&&d>0,'a crit: a star of light where it lands, and the battle slowed ('+(d/.02).toFixed(2)+'×)');
  let n=0;while(V.beat>0&&n<100){t.heroBeat(.02);n++}ok(n*.02<=t.HERO_FX.beat.t+.02,'for a beat only ('+(n*.02+.02).toFixed(2)+' s)');
  t.battleEvent('blow',{u:h,e,crit:true,kill:true});ok(t.heroBeat(.02)===.02&&has('flash'),'another straight after: its star and a kill\'s burst, but no second beat for '+t.HERO_FX.beat.every+' s');
  t.battleEvent('blow',{u:e,e:h,crit:true,kill:false});ok(t.heroBeat(.02)===.02,'a foe\'s crit never slows your battle')}
 // ======== her skills
 {t.FXP.length=0;t.battleEvent('cast',{u:h,id:'whirl',st:{}});ok(count('ghost')===t.HERO_FX.ghosts,'Whirlwind: '+t.HERO_FX.ghosts+' after-images all round her');
  t.FXP.length=0;t.battleEvent('cast',{u:h,id:'dash',st:{dash:{sx:h.x,sy:h.y,tx:h.x+80,ty:h.y}}});ok(count('streak')===1,'Blade Dash: a streak of light behind her');
  t.FXP.length=0;t.battleEvent('cast',{u:h,id:'fireball',st:{}});ok(count('mote')>=6&&has('flash')&&has('ring'),'a spell: sparks drawn into her hand, then a burst');
  t.FXP.length=0;t.battleEvent('land',{u:h,r:34});ok(count('rock')===t.HERO_FX.debris&&has('wave')&&has('flash'),'Leap Slam\'s landing: debris, a shockwave and a flash');
  t.prefSet('bfx','light');t.FXP.length=0;t.battleEvent('land',{u:h,r:34});t.battleEvent('cast',{u:h,id:'whirl',st:{}});t.battleEvent('swing',{u:h,c:{shape:'arc'},a:0,r:20,n:0,last:false});
  ok(!has('rock')&&!has('ghost')&&has('wave')&&has('trail'),'Battle effects: Light keeps the ribbons and shockwaves, no debris or ghosts');t.prefSet('bfx','full')}
 // ======== drawn only
 {const snap=()=>JSON.stringify([(B.vfx||[]).length,B.units.map(u=>[u.x,u.y,u.hp,u.cd,u.z||0]),B.hx&&B.hx.stop]),s0=snap();let n=0;Math.random=()=>{n++;return random()};
  t.battleEvent('swing',{u:h,c:{shape:'thrust'},a:0,r:20,n:1,last:true});t.battleEvent('blow',{u:h,e,crit:true,kill:true});t.battleEvent('cast',{u:h,id:'nova',st:{}});t.battleEvent('cast',{u:h,id:'whirl',st:{}});t.battleEvent('land',{u:h,r:30});
  t.heroAura(h,h.x,h.y,1);t.heroFxGround();t.heroFxAir();t.heroFlashDraw();Math.random=random;
  ok(!n&&snap()===s0,'the effects draw without Math.random ('+n+') and change nothing in the battle');
  for(let i=0;i<5;i++){B.t+=1/60;t.drawBattle()}t.frame();ok(!ERR.length,'a battle with all of them draws')}
 B.over=true;B.endT=0;t.updateBattle(.01);
}catch(x){o.push('EXC '+x.message+' '+x.stack)}finally{Math.random=random;ev('MANUAL_HERO=false');try{T.prefSet('bfx','full')}catch(x){}if(T.B){T.B.over=true;T.B.endT=0;T.updateBattle(.01)}if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
