'use strict';
window.ARENA=true;// (the battle screen's own field: tests/harness.js)
// Your hero's weapon in every pose (the owner, 2026-11-01: "the hero battle unit should also draw a weapon from start to finish"):
// with a sword, a spear, a greatsword, a warhammer, a bow, a crossbow and a staff, every pose and frame of the battle (render.js
// drawUnit), both facings, his weapon's pixels are seen: the figure drawn with it and with it taken off (figures.js FigureRig.gearOf
// less the hand's gear, weapons.js heldNow none) differ. A weapon whose place is behind the body is drawn before it when the body
// would hide it (weapons.js peeks: a sword on the shoulder); knocked down he keeps it (render.js drawDowned, sprites.js
// downedOf); on the march (march.js marchSprite, at its scale) and as the march's leader; a lord riding and off his horse; bare hands
// none (tests/visual/heroweapon.js draws the sheet)
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,keep={};const stub=(n,f)=>{if(!(n in keep))keep[n]=window[n];window[n]=f};
 const gearOf=t.FigureRig.gearOf,held=window.heldNow,FX=t.STATE_FX.on;
 try{
  window.requestAnimationFrame=()=>0;Kit.begin('soldier',3);
  G.mode='world';G.modal=false;t.hidePanel();P.troops={hum_foot:4};G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia','militia']};t.startBattle({enemies:G.enc.list,tournament:false});
  const B=t.B,h=B.hero;t.STATE_FX.on=false;B.terrain=null;
  const setCtx=(0,eval)('c=>{const k=ctx;ctx=c;return k}'),spr=t.spr,clear=()=>{for(const k in spr)delete spr[k];t.FIGURES.map.clear()};let off=false;
  t.FigureRig.gearOf=(L,map)=>{const g=gearOf(L,map);return off?g.filter(x=>x.slot!=='main'&&x.slot!=='shooter'):g};
  for(const n of ['heroAura','drawStuck','drawMorale'])stub(n,()=>{});stub('idleLife',()=>({pose:null,dx:0}));
  const W=48,H=48,px=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data;
  const diff=(a,b)=>{const A=px(a),D=px(b);let n=0;for(let i=0;i<A.length;i+=4)if(A[i+3]!==D[i+3]||A[i]!==D[i]||A[i+1]!==D[i+1]||A[i+2]!==D[i+2])n++;return n};
  // (his weapon's pixels as seen: draw(c) with it and without it)
  const seen=draw=>{const pic=w=>{off=!w;clear();const c=document.createElement('canvas');c.width=W;c.height=H;draw(c);return c};const no=pic(false),yes=pic(true);off=false;return diff(yes,no)};
  // (drawUnit for u in pose p facing f; dq: knocked down, how far)
  const unit=(u,p,f,dq)=>c=>{const k=setCtx(c.getContext('2d'));stub('procPose',()=>p);stub('physDownPose',()=>dq??null);stub('heldNow',off?()=>null:held);
    try{Object.assign(u,{x:W/2,y:H-6,plx:W/2,ply:H-6,face:f,hitAt:null,stun:0,spdNow:p>=15?u.s.spd*.9:p>=2&&p<=5?u.s.spd*.5:0,movF:0,z:0,wIdx:null,tgt:null,
      atkAt:p>=6&&p<=14?B.t-t.ATK_ANIM*((p-6)%3+.5)/3:null,atkStyle:p>=12?'overhead':p>=9?'thrust':'swing'});t.drawUnit(u)}finally{setCtx(k)}};
  const sprite=mk=>c=>{const s=mk(),k=t.WORLD_BATTLE.sprite/t.WORLD_BATTLE.scale*2,g=c.getContext('2d');g.save();g.translate(W/2,H-4);g.scale(k,k);g.drawImage(s,-(s.width>>1),-s.height+2);g.restore()};
  // (MIN: 3 since 2026-11-06, a paper doll's weapon a thin unoutlined line, 3 px of a sword past his raised shield)
  const POSES=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,41,42,43],MIN=3;
  const all=(label,cells)=>{const bad=cells.map(([n,d])=>[n,seen(d)]).filter(([n,v])=>v<MIN);ok(!bad.length,label+(bad.length?': none seen in '+bad.map(([n,v])=>n+' ('+v+')').join(', '):''));return bad};
  const P0={...P.gear};
  for(const b of ['sword','spear','greatsword','warhammer','bow','crossbow','staff']){P.gear.weapon='g_'+b+'_2';P.gear.offhand=null;h.look=null;h.side=null;
    all('your hero with a '+b+': his weapon seen in every pose and frame, facing right and left ('+POSES.length+' poses)',[1,-1].flatMap(f=>POSES.map(p=>['p'+p+(f<0?'L':''),unit(h,p,f)])));
    all('with a '+b+', knocked down, falling, lying and getting up, it is still in his hand',[.2,.5,.8,1].map(q=>['q'+q,unit(h,0,1,q)]));
    all('with a '+b+', on the march at its scale (and as its leader)',[0,2,3,4,5].map(p=>['p'+p,sprite(()=>t.unitSprite('hero',0,true,0,p,false,false,null))]).concat([['leader',sprite(()=>t.marchLeaderSprite(P,2).base)]]))}
  // (the owner, 2026-11-01: a crossbow drawn as a bow, and shot as one) your hero's crossbow is a crossbow to see and to shoot: its own
  // look, its reload (battle/actors.js shotKind); a bow still a bow
  for(const [b,k] of [['crossbow','xbow'],['bow','bow']]){P.gear.weapon='g_'+b+'_2';P.gear.offhand=null;h.look=null;h.side=null;ok(t.unitLook(h).weapon===k&&t.shotKind(h)===k,'your hero with a '+b+': drawn and shot as a '+k+' ('+t.unitLook(h).weapon+', '+t.shotKind(h)+')')}
  // (a shooter in melee mode: his bow on his back, a sword in his hand)
  P.gear.weapon='g_bow_2';h.look=null;h.side=null;h.inMelee=true;all('a bow put away in melee, his sword seen in his hand walking and in each blow',[0,2,3,6,7,8,9,10,11].map(p=>['p'+p,unit(h,p,1)]));h.inMelee=false;
  // (bare hands: none)
  P.gear.weapon=null;P.gear.offhand=null;h.look=null;h.side=null;
  ok(!t.heldWeapon(t.unitLook(h))&&[0,2,6,10,15].every(p=>seen(unit(h,p,1))===0),'bare hands: no weapon drawn (combat.js FISTS)');
  Object.assign(P.gear,P0);h.look=null;h.side=null;
  // (a lord, a character drawn as the troops are: riding with a lance, off his horse, and on foot with a sword)
  {const lu=B.units.find(u=>!u.hero&&u.team===1),k0=lu.type,s0=lu.s;
   try{lu.type='hum_knight';lu.look=null;lu.s={...s0,mounted:true};all('a lord riding, his lance seen in every pose',POSES.filter(p=>p<19||p>26).map(p=>['p'+p,unit(lu,p,1)]));
    lu.afoot=true;lu.look=null;all('off his horse, his lance in his hand in every pose',POSES.map(p=>['p'+p,unit(lu,p,-1)]));lu.afoot=false;
    lu.type='hum_sergeant';lu.look=null;lu.s={...s0,mounted:false};all('a lord with a sword: every pose, and knocked down',POSES.map(p=>['p'+p,unit(lu,p,1)]).concat([.5,1].map(q=>['q'+q,unit(lu,0,-1,q)])))}
   finally{lu.type=k0;lu.s=s0;lu.look=null;lu.afoot=false}}
  // (behind the body only while it shows past it: weapons.js peeks)
  {const w=t.weaponSprite('sword',t.lookOf('hum_foot',0,false,0,'',null).team,'#f3bfad',20),bl=document.createElement('canvas'),full=document.createElement('canvas');bl.width=full.width=32;bl.height=full.height=32;
   full.getContext('2d').fillRect(0,0,32,32);ok(t.peeks(bl,w,4,4)&&!t.peeks(full,w,4,4),'a weapon behind a body that hides it is drawn before it (peeks: '+t.GEAR.peek+' of it must show past the body)');
   P.gear.weapon='g_sword_2';h.look=null;h.side=null;clear();Object.assign(h,{tgt:null,atkAt:null,stun:0,wIdx:null,movF:6,spdNow:h.s.spd*.5});const sp=t.actorSprite(h,3,true),hw=t.heldNow(h,t.unitLook(h),sp),a=(h.wIdx/t.WEAPON_STEPS*360+180)%360-180;
   // (2026-11-07: a paper doll's sword as he walks low before him as at rest, all of it showing (the owner: "shorter when walking"))
   ok((t.DOLL_FIGS.on?a>20&&a<80:a>t.GEAR.behind[0]&&a<t.GEAR.behind[1])&&!hw.back,'your hero\'s sword as he walks ('+Math.round(a)+' degrees) is drawn before him, all of it showing');
   Object.assign(P.gear,P0);h.look=null;h.side=null}
 }finally{t.FigureRig.gearOf=gearOf;t.STATE_FX.on=FX;for(const n in keep)window[n]=keep[n]}
});
