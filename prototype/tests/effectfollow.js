'use strict';
// Every effect on the man it belongs to, over its life (the owner, 2026-11-18: "Recheck every effects whether it animated correctly to
// the casters or characters"; tests/effectcentre.js has each one's place on a hill): on a classic field and in a fight on the map, where
// each man is drawn WORLD_BATTLE.sprite times his size round his feet. Each is measured as the share of his drawn figure's height up from
// his drawn feet where it is born (0 his feet, 1 the top of his head), and how far it is left behind when he moves while it plays.
//   a blow's flash and its blood on his body, a rider's on him, not his horse's legs; your hero's swing ribbon, a crit's star, a cast's
//   light and the sparks drawn into his hand, his whirl's after-images: on him, and with him as he moves; a body's effect as big as he is
//   drawn; a leap's after-image where he is drawn up; an arrow loosed from the bowman's hand; a spent man's sweat at his head; a flank's
//   flash on him; the words over a man over his head; a stunned man's stars over him lying down; on the map, a blessing's ring at the feet
//   of a man leaping or climbing an edge, where he is drawn.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',51);Kit.clear();Kit.world();t.GUIDE.on=false;G.paused=false;G.speed=1;
 P.troops={hum_foot:4,hum_bow:3,hum_knight:2};
 const rec=(names,fn)=>{const c=t.ctx,keep={},out=[];for(const n of names){keep[n]=c[n];c[n]=function(...a){out.push({n,a,T:this.getTransform()});return keep[n].apply(this,a)}}try{fn()}finally{for(const n of names)c[n]=keep[n]}return out};
 const fix=v=>(+v).toFixed(2);
 const run=(mode)=>{
  const world=mode==='map';t.WORLD_BATTLE.on=world;G.mode='world';G.modal=false;
  const enemy=t.asParty({kind:'bandits',troops:['militia','militia','archer','hum_knight'],x:P.x+70,y:P.y,cool:0});W.parties.push(enemy);G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};
  t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const B=t.B;if(!B||!!B.world!==world){ok(false,mode+': the fight begins ('+(B?B.world?'on the map':'its own field':'none')+')');return}
  const k=world?t.WORLD_BATTLE.sprite:1,L=(x,y)=>t.fieldLift(x,y);t.FXP.length=0;B.vfx=[];
  // (as drawn, in the canvas's px: his feet and his figure's height, from his own sprite's drawing (render.js drawUnitAt: its foot 2 px
  //  over the sprite's bottom, his height its ch, under the transform he is drawn by); a particle's point, from the transform its first
  //  drawing call is made under, it alone drawn (a ghost's at its own origin, blood's where its drop is drawn))
  const P2=(T,x,y)=>[T.a*x+T.c*y+T.e,T.b*x+T.d*y+T.f];
  const tall=u=>t.actorSprite(u).ch*k;// (on the field, unlifted: a particle born there, before it is drawn)
  const fig=u=>{const s=t.actorSprite(u),c=rec(['drawImage'],()=>t.drawUnit(u)).find(c=>c.a.length===3&&c.a[0].width===s.width&&c.a[0].height===s.height);if(!c)return{feet:0,tall:1};return{feet:P2(c.T,c.a[1],c.a[2]+s.height-2)[1],tall:s.ch*Math.hypot(c.T.c,c.T.d)}};
  const up=(u,cy)=>{const F=fig(u);return(F.feet-cy)/F.tall};
  const at=(list,p,fn)=>{const keep=list.slice();list.length=0;list.push(p);let c;try{c=rec(['arc','lineTo','moveTo','fillRect','drawImage','ellipse'],fn)[0]}finally{list.length=0;list.push(...keep)}if(!c)return[0,-1e9];return p.k==='ghost'?P2(c.T,0,0):p.k==='blood'?P2(c.T,c.a[0],c.a[1]):P2(c.T,p.x,p.y)};
  const live=B.units.filter(u=>u.hp>0),hero=B.hero,foot=live.find(u=>u.team&&!u.s.mounted&&!u.s.beast),rider=live.find(u=>u.s.mounted),bow=live.find(u=>/bow|archer/.test(u.type));
  for(const u of live)t.drawUnit(u);// (each drawn once: his figure's height remembered as drawn)
  info(mode+': k '+k+'; your hero '+(hero?hero.type:'none')+', a foot soldier '+(foot?foot.type:'none')+', a rider '+(rider?rider.type:'none')+', a bowman '+(bow?bow.type:'none'));
  const last=(L0,kind)=>{for(let i=L0.length-1;i>=0;i--)if(L0[i].k===kind)return L0[i];return null};
  // ---- a blow's flash and blood, on the man struck
  for(const u of [foot,rider].filter(Boolean)){B.vfx=[];t.vfxHit(hero||live[0],u,9);const g=last(B.vfx,'glow'),bl=last(B.vfx,'blood'),f=g?up(u,at(B.vfx,g,()=>t.vfxAir())[1]):-1,lo=u.s.mounted?.35:.3,hi=u.s.mounted?.85:.65;
   ok(g&&f>=lo&&f<=hi,mode+': a blow\'s flash on the '+(u.s.mounted?'rider':'man')+' struck, '+fix(f)+' of his height up (between '+lo+' and '+hi+')');
   if(bl){const fb=up(u,at(B.vfx,bl,()=>t.vfxAir())[1]);ok(fb>=lo&&fb<=hi,mode+': his blood flies from '+fix(fb)+' of his height up')}}
  if(!hero){info(mode+': no hero in the fight: his effects not checked');return}
  // (a particle of the hero's effects (herofx.js): the last of a kind in FXP, its point as drawn)
  const fxl=kind=>last(t.FXP,kind),drawn=(p,fn)=>at(t.FXP,p,fn||(()=>t.heroFxAir()));
  // (moved by dx, a moment of the real clock for the particles (vfx.js fxpStep), back)
  const moved=(u,dx,fn)=>{const x0=u.x;u.x+=dx;t.fxpStep();try{return fn()}finally{u.x=x0}};
  // ---- your hero's swing ribbon: from his body, with him as he steps
  {t.FXP.length=0;t.battleEvent('swing',{u:hero,c:{arc:.9,dir:1},a:0,r:20,n:0,last:false});const p=fxl('trail');
   if(!p)info(mode+': no swing ribbon (effects off?)');else{const f=up(hero,drawn(p)[1]),d0=p.x-hero.x,d1=moved(hero,12,()=>p.x-hero.x);
    ok(f>=.25&&f<=.6,mode+': your hero\'s swing ribbon from '+fix(f)+' of his height up');ok(Math.abs(d1-d0)<.5,mode+': it moves with him (stepping 12 px it is left '+fix(d0-d1)+' px behind)')}}
  // ---- a crit's star on the man struck, with him as he is thrown back
  if(foot){t.FXP.length=0;t.battleEvent('blow',{u:hero,e:foot,crit:true,kill:false});const p=fxl('star');
   if(p){const f=up(foot,drawn(p)[1]),d0=p.x-foot.x,d1=moved(foot,10,()=>p.x-foot.x);ok(f>=.3&&f<=.75,mode+': a crit\'s star on him, '+fix(f)+' of his height up');ok(Math.abs(d1-d0)<.5,mode+': it goes with him thrown back ('+fix(d0-d1)+' px behind)')}}
  // ---- a cast: its light at his hand, the sparks drawn into it, with him
  {t.FXP.length=0;t.battleEvent('cast',{u:hero,id:'heal',st:{}});const p=fxl('flash'),m=fxl('mote');
   if(!p)info(mode+': no cast light');else{const f=up(hero,drawn(p,()=>t.stateFxAir())[1]),d0=p.x-hero.x,d1=moved(hero,12,()=>p.x-hero.x);
    ok(f>=.45&&f<=.85,mode+': a cast\'s light at his hand, '+fix(f)+' of his height up');ok(Math.abs(d1-d0)<.5,mode+': it moves with him ('+fix(d0-d1)+' px behind)');
    if(m){const end=m.tx!=null?[m.tx,m.ty]:[m.x,m.y];ok(Math.abs(end[0]-p.x)<.5&&Math.abs(end[1]-p.y)<.5,mode+': its sparks are drawn into his hand, where its light is ('+fix(end[0]-p.x)+', '+fix(end[1]-p.y)+' px off)')}
    // (a body's light as big as he is drawn: its radius k times its own)
    const c=rec(['createRadialGradient'],()=>t.stateFxAir()).filter(c=>c.a[5]>0),r=c.length?c[c.length-1].a[5]*c[c.length-1].T.a/t.ctx.getTransform().a:0;
    ok(c.length&&Math.abs(r-p.r*k)<.6,mode+': its light '+fix(r)+' px across his '+fix(tall(hero))+' px figure ('+p.r+' px of his own, k '+k+')')}}
  // ---- a whirl's after-images round him, with him, as big as he is
  {t.FXP.length=0;t.battleEvent('cast',{u:hero,id:'whirl',st:{}});const p=fxl('ghost');
   if(p){const d0=p.x-hero.x,d1=moved(hero,12,()=>p.x-hero.x);ok(Math.abs(d1-d0)<.5,mode+': his whirl\'s after-images turn round him as he moves ('+fix(d0-d1)+' px behind)');
    const c=rec(['drawImage'],()=>t.heroFxAir()),sc=c.length?c[0].T.a/t.ctx.getTransform().a:0;ok(c.length&&Math.abs(sc-k)<.01,mode+': each drawn at his size ('+fix(sc)+' of the field\'s, he '+k+')')}}
  // ---- a leap: his after-image where he is drawn up in the air
  {B.vfx=[];const z0=hero.z;hero.z=12;try{t.vfxGhost(hero);const g=last(B.vfx,'ghost'),d=g?at(B.vfx,g,()=>t.vfxAir())[1]-fig(hero).feet:99;ok(g&&Math.abs(d)<1,mode+': a leap\'s after-image at his feet as drawn 12 px up ('+fix(d)+' px off)')}finally{hero.z=z0}}
  // ---- an arrow loosed from the bowman's hand
  if(bow){const n0=B.arrows.length;t.Missile.fire(bow,0,5,bow.s,120);const a=B.arrows[n0];B.arrows.length=n0;
   if(a&&a.arc){const sp=t.actorSprite(bow),hand=(sp.height-2-(sp.hand?sp.hand[1]:24))*k,hz=(()=>{try{return t.arrowUp(a)}catch(e){return 4+Math.max(0,a.z)}})();
    ok(Math.abs(hz-hand)<=3*k,mode+': an arrow drawn '+fix(hz)+' px up as it leaves the bow, his hand '+fix(hand)+' px up')}}
  // ---- a spent man's sweat at his head
  if(foot){t.FXP.length=0;const s0=foot.sta;foot.sta=0;try{const x=Math.round(foot.x),y=Math.round(foot.y),h=t.actorSprite(foot).ch;for(let i=0;i<3000&&!fxl('sweat');i++)t.stateAir(foot,x,y,h);const p=fxl('sweat');
    if(!p)info(mode+': no sweat (not spent?)');else{const f=(foot.y-p.y)/tall(foot);ok(f>=.6&&f<=1.05,mode+': a spent man\'s sweat at his head, '+fix(f)+' of his height up')}}finally{foot.sta=s0}}
  // ---- a flank's flash on him
  if(foot){t.FXP.length=0;t.battleEvent('flank',{u:foot,src:{x:foot.x+30,y:foot.y}});const p=fxl('flash');if(p){const f=up(foot,drawn(p,()=>t.stateFxAir())[1]);ok(f>=.2&&f<=.65,mode+': a flank\'s flash on his side, '+fix(f)+' of his height up')}}
  // ---- words over a man: over his head
  if(foot){B.floats.length=0;t.moraleSay(foot,'Steady!','#fff',.6);const f=B.floats[0];if(f){const q=(foot.y-f.y)/tall(foot);ok(q>=1,mode+': the words over a man over his head ('+fix(q)+' of his height up)')}}
  // ---- a stunned man lying down: his stars over him as he lies
  if(foot&&t.PHYSICS.on){const s0=foot.stun,d0=foot.down,f0=foot.downFor;foot.stun=1;foot.down=.5;foot.downFor=1.5;try{const x=Math.round(foot.x),y=Math.round(foot.y),h=t.actorSprite(foot).ch;
    const c=rec(['fillRect'],()=>t.stateAir(foot,x,y,h)).slice(0,3),top=c.length?Math.min(...c.map(c=>c.a[1])):0,q=(y-top)/h;
    ok(c.length&&q<=.75,mode+': a stunned man lying down has his stars over him lying ('+fix(q)+' of his standing height up, as he lies)')}finally{foot.stun=s0;foot.down=d0;foot.downFor=f0}}
 };
 run('field');(0,eval)('B=null');run('map');
 // ---- on the map: a blessing's ring at the feet of a man leaping an edge, where he is drawn (march.js MarchArmy body, MARCH_UP)
 {(0,eval)('B=null');G.mode='world';G.modal=false;t.drawWorld();const A=t.marchLive(P),u=A&&A.units.find(u=>!u.dead);
  if(!u)info('no army marching: the blessing on a leaping man not checked');else{const M=(()=>{try{return t.MARCH_UP}catch(e){return null}})(),was=M&&M.get(u);if(M)M.set(u,6);try{const b=A.body(u),f=t.liftY(u.x,u.y);ok(Math.abs(b.foot-(f-6))<.01,'a blessing\'s ring at the feet of a man leaping, drawn 6 px up ('+fix(f-b.foot)+' px up)')}finally{if(M){if(was==null)M.delete(u);else M.set(u,was)}}}}
});
