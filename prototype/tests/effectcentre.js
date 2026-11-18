'use strict';
// Effects on the men where they are drawn (the owner, 2026-11-17: "Recheck the shrine effect and all effects whether they still center to
// characters right now it seems offset"): on the map a man is drawn up by his ground's lift (worldterrain.js liftDraw, liftY), and in a
// fight on the map each man by the lift of his ground (render.js drawUnit, vfx.js fieldLift). On a hill: a shrine's blessing reaches
// each of your men at his feet and his body as drawn (gfx/blessing.js, march.js MarchArmy body), the eye over your hero over his head;
// in a fight there a glow, a ground ring, the selection under him and a corpse where he fell, on him.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;window.requestAnimationFrame=()=>0;Kit.begin('soldier',51);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;G.paused=false;G.speed=1;
 // ---- a hillside: open ground well lifted, open round it
 let spot=null,best=0;for(let ty=20;ty<t.MH-20;ty+=2)for(let tx=20;tx<t.MW-20;tx+=2){if(t.WM.kind[ty*t.MW+tx]!==t.T_OPEN)continue;let open=true;for(let j=-3;j<=3&&open;j++)for(let i=-3;i<=3&&open;i++)if(t.WM.kind[(ty+j)*t.MW+tx+i]!==t.T_OPEN)open=false;
   if(!open)continue;const x=(tx+.5)*TILE,y=(ty+.5)*TILE,L=t.liftAt(x,y);if(L>best&&L<40){best=L;spot=[x,y]}}
 if(!spot||best<3){ok(false,'a hillside of open ground to stand on ('+best.toFixed(1)+' px of lift at most)');return}
 Kit.goTo(spot[0],spot[1]);P.troops={hum_foot:6,hum_bow:3};G.mode='world';G.modal=false;for(let i=0;i<40;i++){t.drawWorld();t.WorldArt.step(40)}t.drawWorld();
 const cam={x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)},A=t.marchLive(P);info('on a hillside at '+spot.map(Math.round)+', its ground drawn '+t.liftAt(P.x,P.y).toFixed(1)+' px up');
 // (the calls a draw makes, their arguments)
 const rec=(names,fn)=>{const c=t.ctx,keep={},out=[];for(const n of names){keep[n]=c[n];c[n]=function(...a){out.push({n,a,T:this.getTransform()});return keep[n].apply(this,a)}}try{fn()}finally{for(const n of names)c[n]=keep[n]}return out};
 // ---- the shrine's blessing: its ring at each man's feet as drawn, its light at his body's middle
 if(!A)info('no army marching: the blessing checked on your band alone');
 {const X=t.BLESS_FX,men=t.BlessFx.men(),now0=performance.now,T0=1000,at=X.lead+X.fly+X.glow*.25,live=A?A.units.filter(u=>!u.dead):[];
  t.BlessFx.list=[{x:P.x+30,y:P.y,t0:T0}];performance.now=()=>T0+at*1000;let calls;try{calls=rec(['ellipse','createRadialGradient'],()=>t.BlessFx.draw(cam))}finally{performance.now=now0;t.BlessFx.list=[]}
  const rings=calls.filter(c=>c.n==='ellipse').map(c=>[c.a[0]+cam.x,c.a[1]+cam.y]),glows=calls.filter(c=>c.n==='createRadialGradient'&&c.a[5]===9).map(c=>[c.a[0]+cam.x,c.a[1]+cam.y]);// (his lighting: a halo 9 px wide; the motes' own in flight)
  const feet=live.length?live.slice(0,rings.length).map(u=>A.body(u)):[{x:P.x,foot:t.liftY(P.x,P.y),mid:t.liftY(P.x,P.y)-X.mid,top:t.liftY(P.x,P.y)-12}];
  const off=rings.map((r,i)=>feet[i]?Math.hypot(r[0]-feet[i].x,r[1]-feet[i].foot):99),lifts=feet.map(f=>f.foot-(live[feet.indexOf(f)]||P).y);
  ok(rings.length>0&&off.every(d=>d<1),'each man lit has its ring at his feet as he is drawn ('+rings.length+' rings, off by '+off.map(d=>d.toFixed(1)).join(', ')+' px; his ground drawn '+lifts.map(v=>(-v).toFixed(1)).join(', ')+' px up)');
  const inBody=glows.filter(g=>feet.some(f=>Math.abs(g[0]-f.x)<3&&g[1]<=f.foot&&g[1]>=f.top));ok(glows.length>0&&inBody.length===glows.length,'its light on his body as drawn: '+inBody.length+' of '+glows.length+' glows between his feet and his head');
  ok(men.length&&men.every(m=>m.mid<m.y),'BlessFx.men: each man\'s foot and his middle over it, as drawn ('+men.slice(0,3).map(m=>m.x.toFixed(0)+','+m.y.toFixed(1)+' mid '+m.mid.toFixed(1)).join('; ')+')')}
 // ---- the eye over your hero, over his head as drawn
 if(A&&A.carrier){const u=A.carrier,b=A.body(u),e=t.heroTagAt(cam),bot=e.bottom+cam.y;ok(bot<=b.top+1&&bot>=b.top-8,'the eye over your hero sits over his head as drawn (its foot at '+bot.toFixed(1)+', his head '+b.top.toFixed(1)+', his ground '+(u.y-b.foot).toFixed(1)+' px up)')}
 // ---- a fight on the map on the hillside
 const enemy=t.asParty({kind:'bandits',troops:['militia','militia','archer'],x:P.x+70,y:P.y,cool:0});W.parties.push(enemy);G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};
 t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const Bt=t.B;if(!Bt||!Bt.world){ok(false,'a fight on the map begins');return}
 const us=Bt.units.filter(u=>u.team===0&&u.hp>0).map(u=>[u,t.fieldLift(u.x,u.y)]).sort((a,b)=>b[1]-a[1]),[u,Lf]=us[0]||[];
 if(!u||Lf<1){info('no man of yours on lifted ground in the fight ('+(Lf||0).toFixed(1)+')');return}
 // (his figure's box as drawn, in the canvas's px; a point drawn at field px (x, y) under transform T, in the same px)
 const P2=(T,x,y)=>[T.a*x+T.c*y+T.e,T.b*x+T.d*y+T.f];
 const shots=rec(['drawImage'],()=>t.drawUnit(u)).filter(c=>c.a.length===3||c.a.length===5||c.a.length===9);let bx0=1e9,by0=1e9,bx1=-1e9,by1=-1e9;
 for(const c of shots){const a=c.a,dx=a.length===9?a[5]:a[1],dy=a.length===9?a[6]:a[2],dw=a.length===3?a[0].width:a.length===9?a[7]:a[3],dh=a.length===3?a[0].height:a.length===9?a[8]:a[4];
   for(const [x,y] of [[dx,dy],[dx+dw,dy+dh]]){const p=P2(c.T,x,y);bx0=Math.min(bx0,p[0]);bx1=Math.max(bx1,p[0]);by0=Math.min(by0,p[1]);by1=Math.max(by1,p[1])}}
 const T0=t.ctx.getTransform(),unit=P2(T0,u.x,u.y),down=P2(T0,u.x,u.y+1)[1]-unit[1],fl=Lf*down;
 info('your '+u.type+' on ground drawn '+Lf.toFixed(1)+' field px up ('+fl.toFixed(1)+' canvas px): drawn '+[bx0,by0,bx1,by1].map(v=>v.toFixed(0)).join(',')+', his point '+unit.map(v=>v.toFixed(0)).join(','));
 ok(shots.length&&by1<unit[1]-fl*.5,'he is drawn up by his ground\'s lift (his feet at '+by1.toFixed(0)+', his ground\'s point '+unit[1].toFixed(0)+')');
 const inFig=([x,y],pad=0)=>x>=bx0-pad&&x<=bx1+pad&&y>=by0-pad&&y<=by1+pad;
 // (a glow on him: vfx.js vfxAir)
 {const was=Bt.vfx;Bt.vfx=[];t.vfx({k:'glow',x:u.x,y:u.y-6,r:4,col:'rgba(255,255,255,1)',life:1});const c=rec(['arc'],()=>t.vfxAir()).map(c=>P2(c.T,c.a[0],c.a[1]));Bt.vfx=was;
  ok(c.length&&c.every(p=>inFig(p,2)),'a glow on him is drawn on his figure ('+c.map(p=>p.map(v=>v.toFixed(0)).join(',')).join('; ')+')')}
 // (a ring at his feet: vfx.js stateGround)
 {t.fxp({k:'ring',x:u.x,y:u.y,r:10,col:'255,255,255',life:5});const c=rec(['ellipse'],()=>t.stateGround()).map(c=>P2(c.T,c.a[0],c.a[1]));t.FXP.length=0;
  ok(c.length&&c.every(p=>Math.abs(p[1]-by1)<=Math.max(4,(by1-by0)*.25)&&p[0]>=bx0-2&&p[0]<=bx1+2),'a ring at his feet is drawn at his feet ('+c.map(p=>p.map(v=>v.toFixed(0)).join(',')).join('; ')+', his feet '+by1.toFixed(0)+')')}
 // (the selection under him: battlehud.js drawSelection)
 {const s0=Bt.sel;Bt.sel=u.grp;const c=rec(['ellipse'],()=>t.drawSelection()).map(c=>P2(c.T,c.a[0],c.a[1]));Bt.sel=s0;const mine=c.filter(p=>Math.abs(p[0]-(bx0+bx1)/2)<=(bx1-bx0)/2+2);
  ok(mine.length&&mine.every(p=>Math.abs(p[1]-by1)<=Math.max(4,(by1-by0)*.25)),'the selection under him at his feet ('+mine.slice(0,2).map(p=>p.map(v=>v.toFixed(0)).join(',')).join('; ')+', his feet '+by1.toFixed(0)+')')}
 // (the owner's phone, 2026-11-17: "Recheck why cursor is not centered at unit": a move's path and its ring where it ends, drawn up by
 // the lift of the ground they lie on; a tap on a man as drawn picks him; a tap on the ground goes to the ground drawn there)
 {const k=t.WORLD_BATTLE.sprite,g=Bt.groups[u.grp],s0=Bt.sel;Bt.sel=u.grp;const dx=u.x+40*k,dy=u.y+12*k;g.moveTo(dx,dy,{});const end={x:g.ax,y:g.ay};
  const c=rec(['ellipse'],()=>t.drawOrderPaths()).map(c=>({p:P2(c.T,c.a[0],c.a[1]),f:[c.a[0],c.a[1]]}));Bt.sel=s0;
  const want=end.y-t.fieldLift(end.x,end.y),near=c.filter(q=>Math.abs(q.f[0]-end.x)<=4*k&&Math.abs(q.f[1]-want)<=4*k),flat=c.filter(q=>Math.abs(q.f[1]-end.y)<=4*k&&Math.abs(end.y-want)>8*k);
  if(!c.length)info('no order path drawn (OPATH: '+t.opMode()+')');else ok(near.length&&!flat.length,'a move\'s ring where it ends drawn on its ground as drawn ('+near.length+' rings there, '+flat.length+' on the flat; its ground '+(end.y-want).toFixed(0)+' field px up)')}
 {const k=t.WORLD_BATTLE.sprite,at=t.rtsUnitAt(u.x,u.y-6*k-Lf,0),flat=t.rtsUnitAt(u.x,u.y-6*k,0);
  ok(at===u,'a tap on his body as drawn picks him ('+(at?at.type:'none')+'; where it was reckoned before, '+Lf.toFixed(0)+' field px under it: '+(flat===u?'him too':flat?flat.type:'none')+')')}
 {const x=u.x+30,y=u.y+30,drawn=y-t.fieldLift(x,y),g=t.fieldGround(x,drawn);ok(Math.abs(g-y)<1.5,'a tap on the ground goes to the ground drawn there ('+g.toFixed(1)+', its ground '+y.toFixed(1)+')')}
 // (one field point the same for every effect: effectTransform, fxEach and fieldLift lift alike)
 {const c=rec(['fillRect'],()=>{t.ctx.save();t.effectTransform(u.x,u.y,1);t.ctx.fillRect(u.x,u.y,1,1);t.ctx.restore();t.fxEach([{x:u.x,y:u.y}],p=>t.ctx.fillRect(p.x,p.y,1,1))}).map(c=>P2(c.T,c.a[0],c.a[1]));
  ok(c.length===2&&Math.abs(c[0][1]-c[1][1])<.01&&Math.abs(c[0][1]-(unit[1]-fl))<.6,'effectTransform and fxEach lift a point alike, as the man standing there ('+c.map(p=>p[1].toFixed(1)).join(', ')+'; his '+(unit[1]-fl).toFixed(1)+')')}
});
