'use strict';
// The fighters' states, shown on them (gfx/vfx.js STATE_FX; the owner, 2026-10-30: "highlight on units" when morale falls or
// buffs): rings at the feet for War Cry, the War Banner, Stand Fast! and a rally; pale when routing, grey when shattered; a
// wavering man's flicker; the moments' particles (a rout's ring, a rally's sparks); Battle effects: Light keeps no particles;
// all of it drawn only (no Math.random, no battle field changed).
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),random=Math.random;try{
 const start=()=>{if(L.active)L.exit();L.start({leftGroups:[{type:'hum_foot',count:12}],rightGroups:[{type:'hum_foot',count:12}],morale:true,deploy:false,paused:true,ai:false,seed:42});const b=t.B,g=b.groups[t.playerGroups()[0]],foe=Object.values(b.groups).find(x=>x.foe);b.obs=[];for(const [gr,x] of [[g,300],[foe,360]]){gr.placeAt(x,300);t.layForm(gr.id);gr.units.forEach(u=>{u.x=gr.ax+u.sx;u.y=gr.ay+u.sy;u.cd=999})}return {b,g,r:g.resolve,a:g.units}};
 const C=t.STATE_FX.col;t.prefSet('bfx','full');
 // ======== the rings: what lifts him now
 let f=start();const u=f.a[0];ok(!t.stateRings(u).length,'a man nothing lifts has no ring');
 u.buffT=3;ok(t.stateRings(u).includes(C.cry),'War Cry\'s heart: a ring of its own');u.buffT=0;
 f.b.banner={x:u.x,y:u.y,r:60,t:5,team:u.team};ok(t.stateRings(u).includes(C.banner),'within the War Banner\'s reach: its ring');
 u.x+=200;ok(!t.stateRings(u).includes(C.banner),'out of its reach: none');u.x-=200;f.b.banner=null;
 f.r.standUntil=f.b.t+5;ok(t.stateRings(u).includes(C.stand),'Stand Fast!: its ring on each of the group\'s men');f.r.standUntil=null;
 // ======== his colours: pale routing, grey shattered, flickering wavering
 {const sp=t.actorSprite(u,0,true),rr=t.resolveOf(u);ok(t.statePic(u,sp)===sp,'a steady man is drawn as he is');
  u.rout=true;const p=t.statePic(u,sp);ok(p!==sp&&p.width===sp.width&&p.ch===sp.ch&&t.statePic(u,sp)===p,'a routing man: a pale copy of his sprite, its size and marks kept, made once');
  rr.shattered=true;const gr=t.statePic(u,sp);ok(gr!==sp&&gr!==p,'his group shattered: grey');rr.shattered=false;u.rout=false;
  const m0=u.mor;u.mor=t.MORALE.waver-5;let dim=false;for(let i=0;i<40&&!dim;i++){const [,a]=t.stateShake(u);if(a<1)dim=true;const e=performance.now()+15;while(performance.now()<e);}
  ok(dim,'a wavering man flickers dim now and then');u.mor=m0;ok(t.stateShake(u).join()==='0,1','a steady man is still')}
 // ======== the moments: a rout's ring and shudder, a rally's sparks
 {t.FXP.length=0;t.battleEvent('rout',{r:f.r,m:f.a});ok(t.FXP.some(p=>p.k==='ring')&&t.STATE_MARKS.get(f.r).shock===f.b.t,'a group breaking: a grey ring round it, a shudder through its men');
  t.FXP.length=0;t.battleEvent('rally',{r:f.r});ok(t.FXP.filter(p=>p.k==='spark').length===2*f.a.filter(x=>x.hp>0).length&&t.stateRings(u).length===0&&t.STATE_MARKS.get(f.r).rally===f.b.t,'rallying: sparks from each of its men ('+t.FXP.length+'), and a flare at their feet');
  t.prefSet('bfx','light');t.FXP.length=0;t.battleEvent('rally',{r:f.r});t.battleEvent('rout',{r:f.r,m:f.a});
  ok(!t.FXP.some(p=>p.k==='spark')&&t.FXP.some(p=>p.k==='ring'),'Battle effects: Light keeps the rings, no sparks');t.prefSet('bfx','full')}
 // ======== drawn only: no random, no field of the battle or its men changed
 {u.buffT=2;u.stun=1;u.rout=true;f.a[1].mor=t.MORALE.waver-5;f.b.banner={x:u.x,y:u.y,r:60,t:5,team:u.team};const snap=()=>JSON.stringify([(f.b.vfx||[]).length,f.b.units.map(x=>[x.x,x.y,x.hp,x.mor,x.buffT,x.stun,x.rout,x.cd])]),s0=snap();
  let n=0;Math.random=()=>{n++;return random()};for(const x of f.a){t.stateAura(x,x.x,x.y,1);t.statePic(x,t.actorSprite(x,0,true));t.stateShake(x);t.stateAir(x,x.x,x.y,20)}t.stateGround();t.stateFxAir();Math.random=random;
  ok(!n&&snap()===s0,'the effects draw without Math.random ('+n+') and change nothing in the battle');
  for(let i=0;i<5;i++){f.b.t+=1/60;t.drawBattle()}ok(!ERR.length,'a battle with every state on draws');f.b.banner=null}
 // ======== a new battle starts with no particles of the last
 t.battleEvent('rout',{r:f.r,m:f.a});f=start();t.battleEvent('flank',{u:f.a[0],src:{x:f.a[0].x+10,y:f.a[0].y}});ok(t.FXP.length===1&&t.FXP[0].k==='flash','a new battle drops the last one\'s particles; a flank\'s flash on the side struck');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=random;try{T.prefSet('bfx','full')}catch(e){}if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
