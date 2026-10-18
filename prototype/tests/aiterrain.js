'use strict';
// the captains read the ground (commander.js TERRAIN_AI; terrain phase 2, doc/TERRAIN_DESIGN.md §5): a defender takes the crest,
// no running charge up at a held crest, shooters to higher ground (out of woods; elves into them), riders round woods and at
// marks out of them, routes over a river by its crossings and the bank held at them, the race keys; with ground of no
// features, reading it changes nothing; AI-on-AI battles on hill fields run to an end (lab INFO lines); and at cliff-ringed hills
// (phase 4) the AI goes round by the ramp and up, never standing at a cliff's face with an order past it
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),ev=s=>(0,eval)(s);try{
 const TA=t.TERRAIN_AI,TT=t.TERRAIN_TEMPER,K=t.TKIND,BH=t.BH,W=()=>t.BW,lv=p=>t.levelAt(p.x,p.y),gk=p=>t.groundAt(p.x,p.y);
 // left/right: group specs; at: [x,y] for each group (left first, then right), laid out in its formation there (or a function of
// the field's band, top and bottom: the battle HUD's, which differs from one lab battle to the next); ground: the lab's
 const army=(left,right,at,ground,extra={})=>{if(L.active)L.exit();t.G.mode='world';t.G.modal=false;L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42,...(ground?{ground}:{}),...extra});const b=t.B;b.obs=[];
  const mine=t.playerGroups().map(id=>b.groups[id]),foe=Object.values(b.groups).filter(g=>g.foe);if(typeof at==='function')at=at(t.fieldTop(),t.fieldBot());
  if(at)[...mine,...foe].forEach((g,i)=>{g.placeAt(at[i][0],at[i][1]);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})});return {b,mine,foe}};
 const G=(type,count,form)=>({type,count,...(form?{form}:{})}),C=g=>g.centre(),still=g=>g.units.forEach(u=>{u.s={...u.s,spd:0};u.cd=999}),set=(ck,k)=>{t.captainMem(ck).temper=k};
 const step=s=>{const end=t.B.t+s;while(t.B.t<end-1e-9&&!L.session.result)L.step(30)},read=on=>{TA.on=on};
 const hill=(x,y,r,top)=>({hills:[{x:x/W(),y:y/BH,r,top}],woods:[],seed:3}),share=p=>({x:p.x/W(),y:p.y/BH});
 // ----- no ground: nothing read
 let w=army([G('hum_foot',10)],[G('hum_foot',10)],[[200,300],[700,300]]);ok(!t.B.terrain&&t.groundAI(1)===null,'no terrain: the captains read no ground (every rule skipped)');
 ok(Object.values(TT).every(e=>Object.keys(e).every(k=>k in TA))&&!TT.human&&!TT.mixed,'every race ground key names a TERRAIN_AI tunable; men and a mixed host use the base');
 // ----- a defender takes the crest of a top on its half, its shooters behind it on the top
 const X0=()=>W()-300,defend=(ground,on=true,temper)=>{read(on);w=army([G('hum_foot',36)],[G('hum_foot',12),G('hum_bow',16)],[[250,300],[W()-160,300],[W()-110,300]],ground);still(w.mine[0]);if(temper)set(1,temper);t.command(1);return w.foe};
 let [di,da]=defend(hill(X0(),300,100,2));const Q=t.captainMem(1);
 ok(Q.post==='defend'&&Q.hold&&Q.hold.lvl===2,'weaker but outshooting, the enemy defends, and takes the hill on its half ('+(Q.hold?'level '+Q.hold.lvl+' at '+Math.round(Q.hold.x):'none')+')');
 ok(lv({x:di.ax,y:di.ay})===2&&di.ax<Q.hold.x&&lv({x:di.ax-40,y:di.ay})<2,'its infantry is sent to the forward crest (front toward the foe, '+Math.round(Q.hold.x-di.ax)+' px ahead of the top)');
 step(10);{const onTop=di.units.filter(u=>lv(u)===2).length,sh=da.units.filter(u=>lv(u)>=1).length;
  ok(onTop>=di.units.length*.75&&sh>=da.units.length*.75,'after 10 s the line stands on the crest ('+onTop+'/'+di.units.length+' on level 2) and the shooters on the hill ('+sh+'/'+da.units.length+')')}
 [di]=defend(hill(X0(),300,100,2),false);ok(!t.captainMem(1).hold&&lv({x:di.ax,y:di.ay})===0,'blind (TERRAIN_AI.on false): the plain line in front of its shooters');read(true);
 // dwarves look further for a hill to hold; orcs less far
 const far=hill(W()-430,300,90,2);[di]=defend(far);const hu=!!t.captainMem(1).hold;[di]=defend(far,true,'dwarf');const dw=t.captainMem(1).hold;
 ok(!hu&&dw&&dw.lvl===2,'a hill '+Math.round(W()-150-40-(W()-430))+' px off: men keep their line, dwarves go and hold it (holdR '+TA.holdR+' vs '+t.tun(TT.dwarf,TA,'holdR')+')');
 [di]=defend(hill(X0(),300,100,2),true,'orc');ok(!t.captainMem(1).hold,'orcs take a hill only right at hand: not the one men take (holdR '+t.tun(TT.orc,TA,'holdR')+')');
 // a top the foe already stands on is not taken
 [di]=defend(hill(X0(),300,100,2));{w.mine[0].units.forEach((u,i)=>{u.x=X0()+(i%6)*8;u.y=290+Math.floor(i/6)*8});delete t.captainMem(1).hold;t.command(1);ok(t.captainMem(1).hold===false,'a top the foe already holds is not chosen')}
 // ----- no running charge up at a held crest: men advance at a walk; stronger, or orcs on a low hill, go in
 const upTest=(top,temper,n=20)=>{const hx=300;w=army([G('hum_foot',16)],[G('hum_foot',n)],[[hx,300],[hx+150,300]],top?hill(hx,300,top===2?115:100,top):null);still(w.mine[0]);if(temper)set(1,temper);t.captainMem(1).commit=true;t.command(1);return w.foe[0]};
 let f=upTest(0);ok(f.order==='charge','on the flat, fresh and attacking 20 to 16: they charge from footFar');
 f=upTest(2);ok(f.order!=='charge'&&lv(C(w.mine[0]))===2&&lv(C(f))===0,'at a foe two levels up: no charge, they advance at a walk ('+f.order+')');
 f=upTest(1);ok(f.order!=='charge','one level up: still no charge for men');f=upTest(1,'orc');ok(f.order==='charge','orcs charge up a low hill (uphill '+t.tun(TT.orc,TA,'uphill')+' levels)');
 f=upTest(2,null,32);ok(f.order==='charge','strong enough (32 to 16, over attackAt×'+TA.uphillOdds+'): they go up anyway');
 // the lines met: they go in, walking up, running only the last upRun px
 {const fin=g=>{const N={inf:[g.id],arc:[],mag:[],cav:[],hero:[]};t.captainFinish(1,N)};w=army([G('hum_foot',16)],[G('hum_foot',20)],[[300,300],[300+80,300]],hill(300,300,115,2));still(w.mine[0]);f=w.foe[0];f.charge();fin(f);const up=f.run;
  w=army([G('hum_foot',16)],[G('hum_foot',20)],[[300,300],[300+80,300]]);still(w.mine[0]);f=w.foe[0];f.charge();fin(f);ok(!up&&f.run,'charging a foe up a hill they walk (on the flat, at a run from runFar)')}
 {w=army([G('hum_foot',16)],[G('hum_foot',20)],[[300,300],[300+75,300]],hill(300,300,115,2));still(w.mine[0]);f=w.foe[0];t.captainMem(1).commit=true;t.command(1);const v=t.tun(null,t.FOE_CMD,'volley');ok(f.order==='charge'&&v*TA.upVolley>v,'once the lines meet they go in all the same (and attacking with shooters, they wait '+TA.upVolley+'× the volleys first)')}
 // ----- shooters to higher ground along the army's line; out of woods; elves under the trees
  // (riders on the other side keep the archers from hunting: they go to their place on the army's line)
 const plan=(ground,temper)=>{w=army([G('hum_foot',10),G('hum_knight',4)],[G('hum_foot',20),G('hum_bow',16)],[[250,300],[150,200],[W()-180,300],[W()-130,300]],ground);still(w.mine[0]);if(temper)set(1,temper);t.command(1);return{P:t.captainMem(1).plan,a:w.foe[1]}};
 let {P,a}=plan(null);const spot={x:a.ax,y:a.ay},near={x:spot.x,y:spot.y+48};ok(P&&!a.hunt&&Math.abs(a.ay-P.y)<1,'(fixture: the archers are sent to '+Math.round(spot.x)+','+Math.round(spot.y)+' on the army’s line)');
 ({P,a}=plan({hills:[{...share(near),r:34,top:1}],woods:[],seed:3}));ok(lv({x:a.ax,y:a.ay})>=1&&Math.abs(a.ax-spot.x)<1&&Math.abs(a.ay-spot.y)<=TA.shooterHill,'a knoll '+(near.y-spot.y)+' px along the line: the archers stand on it ('+Math.round(a.ay-spot.y)+' px over, level '+lv({x:a.ax,y:a.ay})+')');
 read(false);({P,a}=plan({hills:[{...share(near),r:34,top:1}],woods:[],seed:3}));ok(Math.abs(a.ay-spot.y)<1,'blind: on the line as planned');read(true);
 const wood={hills:[],woods:[{...share(near),r:30}],seed:3};({P,a}=plan(wood));const hum=gk({x:a.ax,y:a.ay});({P,a}=plan(wood,'elf'));
 ok(hum!==K.wood&&gk({x:a.ax,y:a.ay})===K.wood,'a wood beside the spot: men’s archers keep out of it, elves’ stand under the trees');
 ({P,a}=plan({hills:[],woods:[{...share(spot),r:30}],seed:3}));ok(gk({x:a.ax,y:a.ay})!==K.wood&&gk(spot)===K.wood,'their spot in a wood: men’s archers step out of it ('+Math.round(Math.abs(a.ay-spot.y))+' px)');
 // out hunting (nobody in reach, safe): a knoll near their spot, still in reach of their mark
 {const hunt=ground=>{w=army([G('hum_foot',10)],[G('hum_foot',20),G('hum_bow',16)],[[250,300],[W()-180,300],[W()-130,300]],ground);still(w.mine[0]);t.command(1);return w.foe[1].hunt};
  const h0=hunt(null),h1=h0&&hunt({hills:[{...share({x:h0.x,y:h0.y+44}),r:30,top:1}],woods:[],seed:3});
  ok(h0&&lv(h0)===0&&h1&&lv(h1)>=1&&Math.hypot(h1.x-h1.tx,h1.y-h1.ty)<=t.ST.hum_bow.range*(1+t.HILL.range*lv(h1)),'hunting, a knoll near their spot: they shoot from it ('+(h1?Math.round(Math.hypot(h1.x-h0.x,h1.y-h0.y))+' px over, still in reach of their mark':'no hunt')+')')}
 // ----- riders: round a wood on the way to the flank, the flank spot in the open, marks out of woods
 const cavW=(ground)=>{w=army([G('hum_foot',16)],[G('hum_knight',8)],[[300,300],[W()-260,150]],ground);still(w.mine[0]);t.command(1);return w.foe[0]};
 let k=cavW(null);const flank={x:k.ax,y:k.ay},mid={x:(C(k).x+flank.x)/2,y:(C(k).y+flank.y)/2};
 const woodsMid={hills:[],woods:[{...share(mid),r:45}],seed:3};k=cavW(woodsMid);
 const cells=(a,b)=>{let n=0;for(let i=0;i<=40;i++)if(t.groundAt(a.x+(b.x-a.x)*i/40,a.y+(b.y-a.y)*i/40)===K.wood)n++;return n},C0=C(k);
 ok(Math.hypot(k.ax-flank.x,k.ay-flank.y)>30&&cells(C0,{x:k.ax,y:k.ay})===0&&cells(C0,flank)>0,'a wood on the straight way to the flank: the riders head for a point beside it ('+Math.round(k.ax)+','+Math.round(k.ay)+')');
 {let most=0,best=1e9;for(let i=0;i<24;i++){step(.5);most=Math.max(most,k.units.filter(u=>t.inWood(u)).length);best=Math.min(best,Math.hypot(C(k).x-flank.x,C(k).y-flank.y));if(k.phase!=='flank')break}
  read(false);k=cavW(woodsMid);let most0=0;for(let i=0;i<24;i++){step(.5);most0=Math.max(most0,k.units.filter(u=>t.inWood(u)).length);if(k.phase!=='flank')break}read(true);
  ok(most<=1&&most0>=3,'riding round it, at most '+most+' rider in the wood at a time (blind: '+most0+')')}
 {const fw={hills:[],woods:[{...share(flank),r:28}],seed:3},ride=()=>{let most=0;for(let i=0;i<24&&k.phase==='flank';i++){step(.5);most=Math.max(most,k.units.filter(u=>t.inWood(u)).length)}return most};
  k=cavW(fw);const to={x:k.ax,y:k.ay},most=ride();
  ok(gk(flank)===K.wood&&gk(to)!==K.wood&&Math.hypot(to.x-flank.x,to.y-flank.y)>20&&most===0,'the flank spot in a wood: they make for one in the open, and none enters the wood (blind they make for the wood itself)')}
 {const pk=ground=>{w=army([G('hum_foot',10),G('hum_foot',10)],[G('hum_knight',8)],[[420,200],[300,420],[W()-300,200]],ground);w.mine.forEach(still);k=w.foe[0];k.phase='charge';k.t=0;t.command(1);return k.targetGroupId};
  const wd={hills:[],woods:[{x:420/W(),y:200/BH,r:60}],seed:3},inW=pk(wd);read(false);const inW0=pk(wd);read(true);
  ok(inW0===w.mine[0].id&&inW===w.mine[1].id,'charging: the nearer foot in a wood is passed over for those in the open (blind: the nearer)')}
 // riders on the flank wait for a mark not up a hill (or once he is fighting ours, or after flankMax×upWait s)
 {w=army([G('hum_foot',24)],[G('hum_knight',8)],[[300,300],[300,140]],hill(300,300,115,2));still(w.mine[0]);k=w.foe[0];k.phase='flank';k.t=0;t.command(1);const waited=k.phase==='flank';
  k.t=t.FOE_CMD.flankMax*TA.upWait+1;t.command(1);ok(waited&&k.phase==='charge','riders on the flank of foot on a hilltop wait (a charge uphill is weak), and go in after '+t.FOE_CMD.flankMax*TA.upWait+' s')}
 // ----- a river: an attack goes over by the crossing, its files narrowed to it; the defenders hold the bank at the crossings
 // (the river laid by hand on an empty lab ground: a deep band down the middle, fords, terrain.js's crossing records)
 const river=(fords)=>{const T0=t.B.terrain,cs=T0.cs,mx=W()/2,half=24,out=[];fords=fords.map(y=>Math.round(y/cs)*cs);// (on cell rows: the record's edges are the cells')
 for(let r=0;r<T0.R;r++)for(let c=0;c<T0.C;c++){const x=(c+.5)*cs;if(Math.abs(x-mx)<half)T0.kind[r*T0.C+c]=K.deep}
  for(const fy of fords){const y0=fy-32,y1=fy+32;for(let r=0;r<T0.R;r++)for(let c=0;c<T0.C;c++){const x=(c+.5)*cs,y=(r+.5)*cs;if(Math.abs(x-mx)<half&&y>y0&&y<y1)T0.kind[r*T0.C+c]=K.ford}
   out.push({kind:'ford',x:mx,y:fy,w:64,y0,y1,x0:mx-half,x1:mx+half})}T0.has.water=true;T0.ai.crossings=out;t.terrainRoutes(T0);return out};// (its grids again: deep water impassable, phase 4)
 const empty={hills:[],woods:[],seed:3},top=()=>t.fieldTop(),bot=()=>t.fieldBot();
 {w=army([G('hum_foot',8)],[G('hum_foot',16)],(T0)=>[[W()/2-160,T0+30],[W()/2+160,T0+30]],empty);still(w.mine[0]);const [cr]=river([bot()-60]);f=w.foe[0];t.captainMem(1).commit=true;t.command(1);
  ok(Math.abs(f.ay-cr.y)<1&&Math.abs(f.ax-(cr.x1+TA.bank))<1&&f.files===Math.floor(cr.w/t.FORMS.line.gx),'the foe across deep water: the attack goes to the ford’s near end first ('+Math.round(f.ax)+','+Math.round(f.ay)+'), its files narrowed to '+f.files);
  let wet=0,across=false,charged=false;for(let i=0;i<60&&!charged;i++){step(.5);wet=Math.max(wet,f.units.filter(u=>gk(u)===K.deep).length);across=across||f.units.every(u=>u.x<cr.x0);charged=f.order==='charge'&&across}
  ok(across&&charged&&wet<=2,'over by the ford (at most '+wet+' man in deep water at a time), then at the foe');ok(!t.captainMem(1).files||!(f.id in t.captainMem(1).files),'across, its files given back ('+f.files+')');
  read(false);w=army([G('hum_foot',8)],[G('hum_foot',16)],(T0)=>[[W()/2-160,T0+30],[W()/2+160,T0+30]],empty);still(w.mine[0]);river([bot()-60]);f=w.foe[0];t.captainMem(1).commit=true;let wet0=0;for(let i=0;i<30;i++){step(.5);wet0=Math.max(wet0,f.units.filter(u=>gk(u)===K.deep).length)}read(true);
  ok(wet0===0,'blind, they still go over by the ford: deep water is impassable and the soldiers route (phase 4; '+wet0+' in deep water)')}
 {w=army([G('hum_foot',40)],[G('hum_foot',12),G('hum_foot',12),G('hum_bow',12)],(T0,B0)=>[[200,(T0+B0)/2],[W()/2+170,T0+60],[W()/2+170,B0-60],[W()/2+220,(T0+B0)/2]],empty);still(w.mine[0]);const L2=river([top()+60,bot()-60]);
  const S={...t.assess(1)},S2={ratio:.95,shootMe:.3,shootFoe:.3,mine:S.mine,foes:S.foes};w.b.t=40;const p1=t.posture(1,S2);read(false);const p0=t.posture(1,S2);read(true);
  ok(p1==='defend'&&p0==='attack','a river between them: an army a little the weaker holds (defendAt ×'+TA.riverDefend+'), where without it it would attack');w.b.t=0;
  t.command(1);const [i1,i2]=w.foe,at=(g,c)=>Math.abs(g.ay-c.y)<1&&g.ax>c.x1&&g.ax-c.x1<TA.bank+40;
  ok(t.captainMem(1).post==='defend'&&at(i1,L2[0])&&at(i2,L2[1]),'defending near the river, each infantry group holds its bank at a crossing ('+[i1,i2].map(g=>Math.round(g.ax)+','+Math.round(g.ay)).join(' / ')+')')}
 // ----- a river laid by terrain.js itself (phase 2, once it has them: the lab's rivers), its crossing records as the contract gives them
 if(ev('typeof TERRAIN_RIVER')!=='undefined'){const rg={hills:[],woods:[],rivers:[{x:.5,meander:0,crossings:[{kind:'ford',y:.55,w:64}]}],seed:3};
  w=army([G('hum_foot',8)],[G('hum_foot',16)],(T0)=>[[W()/2-170,T0+30],[W()/2+170,T0+30]],rg);still(w.mine[0]);const TR=t.B.terrain,cr=TR.ai.crossings[0];f=w.foe[0];t.captainMem(1).commit=true;t.command(1);
  ok(TR.has.water&&cr&&['x0','x1','y0','y1'].every(k=>typeof cr[k]==='number')&&Math.abs(f.ay-cr.y)<1&&f.ax>cr.x1,'terrain.js’s river: the attack makes for its ford first ('+Math.round(f.ax)+','+Math.round(f.ay)+'; ford '+Math.round(cr.x0)+'-'+Math.round(cr.x1)+' at '+Math.round(cr.y)+')');
  let wet=0,over=false;for(let i=0;i<70&&!over;i++){step(.5);wet=Math.max(wet,f.units.filter(u=>gk(u)===K.deep).length);over=f.units.every(u=>u.x<cr.x0)&&f.order==='charge'}
  ok(over&&wet<=2,'over by it and at the foe, at most '+wet+' man in deep water at a time');
  w=army([G('hum_foot',40)],[G('hum_foot',12),G('hum_bow',12)],(T0,B0)=>[[200,(T0+B0)/2],[W()/2+170,(T0+B0)/2],[W()/2+220,(T0+B0)/2]],rg);still(w.mine[0]);t.command(1);const c2=t.B.terrain.ai.crossings[0],h=w.foe[0];
  ok(t.captainMem(1).post==='defend'&&Math.abs(h.ay-c2.y)<1&&h.ax>c2.x1&&h.ax-c2.x1<TA.bank+40,'and the defenders hold their bank at it ('+Math.round(h.ax)+','+Math.round(h.ay)+')')}
 else info('terrain.js has no rivers yet: their checks wait for phase 2');
 // ----- ground with no features: reading it changes nothing, frame for frame
 {const run=on=>{read(on);army([G('hum_foot',16),G('hum_bow',12),G('hum_knight',6,'wedge')],[G('hum_foot',16),G('hum_bow',12),G('hum_knight',6,'wedge')],null,empty,{ai:true,seed:5});for(let i=0;i<40&&!L.session.result;i++)L.step(30);read(true);
   return JSON.stringify(t.B.units.map(u=>[Math.round(u.x*100),Math.round(u.y*100),Math.round(u.hp*100)]))};
  ok(run(true)===run(false),'ground with no hills, woods or water: an AI-on-AI battle reads it and fights exactly as blind (20 s)')}
 // ----- AI on AI on hill fields: both read the ground, and the battle comes to an end (lab: tests/aiterrain INFO)
 {const arm=[G('hum_foot',20),G('hum_bow',12),G('hum_knight',6,'wedge')],grounds={pair:{hills:[{x:.3,y:.5,r:110,top:2},{x:.7,y:.5,r:110,top:2}],woods:[],seed:4},centre:{hills:[{x:.5,y:.5,r:120,top:2}],woods:[{x:.5,y:.2,r:50}],seed:4}};
  for(const [n,gd] of Object.entries(grounds)){army(arm,arm,null,gd,{ai:true,seed:7,distance:500});let s=0;while(!L.session.result&&t.B.t<240&&s++<1000)L.step(60);
   ok(!ERRS(),'AI on AI on a '+n+' field runs to '+(L.session.result||'no end')+' in '+Math.round(t.B.t)+' s');info(n+': '+(L.session.result||'unfinished')+', '+Math.round(t.B.t)+' s, left '+t.B.units.filter(u=>u.team===0&&u.hp>0&&!u.rout).length+' / right '+t.B.units.filter(u=>u.team===1&&u.hp>0&&!u.rout).length+' standing')}}
 // ----- cliffs (phase 4; the owner: "the AI stops when facing a high cliff"): the captains judge the lines met by the way a man can
 // walk (commander.js within), an advance's place walks round by the ramp (terrain.js wayOn), the wait for the volleys ends, a man
 // keeping his place steps out after no foe over a cliff's edge, a place over a one-way cliff is pulled in onto the top. In lab
 // battles on ramp hills the AI's men go round and up and fight on the top, and no AI group stands at a cliff's face (most of its
 // men within 24 px of one) with its goal over the cliff from its middle, nobody in its reach, its middle within 12 px, over 8 s
 {const TR0=ev('TERRAIN.on');ev('TERRAIN.on=true');const arm=[G('hum_foot',20),G('hum_bow',12),G('hum_knight',6,'wedge')],tough=g=>g.units.forEach(u=>{u.s={...u.s,spd:0};u.hp=u.max=u.max*3});
  const put=(g,x,y)=>{g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})};
  const cliffNear=(T,x,y)=>{if(!T.wall)return false;const cs=T.cs,c0=Math.floor(x/cs),r0=Math.floor(y/cs);for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){const c=c0+dc,r=r0+dr;if(c>=0&&r>=0&&c<T.C&&r<T.R&&T.wall[r*T.C+c]&&Math.hypot((c+.5)*cs-x,(r+.5)*cs-y)<=24+cs*.7)return true}return false};
  // (run to cap, each second: the longest stall of an AI group, its infantry's order changes at a cliff, the AI's men on the top (on))
  const watch=(cap,on,teams=[1])=>{const B=t.B,T=B.terrain,st={},last={};let first=null,s=0,k0=-1,flips=0;const up=new Set();
   while(!L.session.result&&B.t<cap&&s++<2000){L.step(30);const k=Math.floor(B.t);if(k===k0)continue;k0=k;
    for(const g of Object.values(B.groups)){if(!teams.includes(g.team))continue;const m=g.units.filter(u=>u.hp>0&&!u.rout&&!u.left);if(!m.length)continue;
     if(on)for(const u of m)if(on(u)){up.add(u.id);if(first==null)first=B.t}
     const Cg=g.centre(),foes=B.units.filter(e=>e.team!==g.team&&e.hp>0&&!e.rout&&!e.left),busy=m.some(u=>foes.some(e=>Math.hypot(e.x-u.x,e.y-u.y)<(u.s.range?u.s.range*1.15:(u.s.reach||11)+8)));
     const goal=g.order==='charge'?g.targetPoint()||foes.reduce((a,e)=>!a||Math.hypot(e.x-Cg.x,e.y-Cg.y)<Math.hypot(a.x-Cg.x,a.y-Cg.y)?e:a,null):{x:g.ax,y:g.ay};
     const at=m.filter(u=>cliffNear(T,u.x,u.y)).length>m.length*.3,bad=!busy&&at&&!!goal&&Math.hypot(goal.x-Cg.x,goal.y-Cg.y)>30&&!t.lineClear(T.route[t.routeWho(m[0].s)],Cg.x,Cg.y,goal.x,goal.y,255,3);
     const S=st[g.id]||(st[g.id]={at:null,x:0,y:0,max:0});if(!bad||S.at!=null&&Math.hypot(Cg.x-S.x,Cg.y-S.y)>=12){S.at=bad?B.t:null;S.x=Cg.x;S.y=Cg.y}if(S.at!=null)S.max=Math.max(S.max,B.t-S.at);
     if(g.role==='inf'&&last[g.id]&&last[g.id]!==g.order&&at)flips++;last[g.id]=g.order}}
   return{end:L.session.result,t:B.t,stall:Math.max(0,...Object.values(st).map(S=>S.max)),up:up.size,first,flips}};
  const say=r=>(r.end||'unfinished')+' at '+Math.round(r.t)+' s; longest stall at a cliff '+Math.round(r.stall)+' s; infantry order changes at cliffs '+r.flips+(r.first!=null?'; first man up at '+Math.round(r.first)+' s, '+r.up+' up':'');
  // the lines have not met over a cliff: foot below a sheer top's east face, yours on it 70 px off as the crow flies: they advance,
  // their place walking round to the ramp (west), and go in on the top
  {w=army([G('hum_foot',12)],[G('hum_foot',12)],null,{hills:[{x:.5,y:.5,r:110,top:1,cliff:true,ramps:[180]}],woods:[],seed:3},{morale:false});const h=t.B.terrain.recipe.hills[0];
   put(w.mine[0],h.x+h.rx-40,h.y);tough(w.mine[0]);f=w.foe[0];put(f,h.x+h.rx+30,h.y);t.captainMem(1).commit=true;t.command(1);const o0=f.order;let mx=f.ax;for(let i=0;i<60&&!(f.order==='charge'&&lv(C(f))>=1);i++){step(1);mx=Math.min(mx,f.ax)}const went=f.order==='charge'&&lv(C(f))>=1,t1=t.B.t;
   const r=watch(150,u=>lv(u)>=1);ok(o0==='advance'&&mx<h.x-h.rx/2&&went&&r.up>=10&&r.stall<=8,'foot below a sheer top’s face, your men on it 70 px off over the cliff: no charge at the rock ('+o0+'); its place walks round to the ramp (west) and they go up, in on the top at '+Math.round(t1)+' s: '+say(r))}
  // a group's place on a one-way top by its edge: its men's places over the cliff below are pulled in onto the top
  {w=army([G('hum_foot',8)],[G('hum_foot',24)],[[150,150],[700,300]],{hills:[{x:.5,y:.5,r:110,top:1,oneway:true,ramps:[180]}],woods:[],seed:3},{morale:false});t.B.cmdT=1e9;still(w.mine[0]);
   const h=t.B.terrain.recipe.hills[0];f=w.foe[0];f.moveTo(h.x,h.y-h.ry+10,{face:-Math.PI/2,files:24});step(60);
   const low=f.units.filter(u=>u.sf&&lv({x:u.sf[3],y:u.sf[4]})<1).length,onTop=f.units.filter(u=>lv(u)>=1).length;
   ok(!low&&onTop>=22,'a line of 24 sent to a one-way top’s north edge: none of its places left below the cliff, all of them up by the ramp ('+onTop+'/24 on the top after '+Math.round(t.B.t)+' s)')}
  // the wait for the volleys ends: shooters that reach nobody from their line (Q.lineT), and the infantry goes on
  {w=army([G('hum_foot',16)],[G('hum_foot',16),G('hum_bow',12)],[[300,300],[W()-200,300],[W()-150,300]],{hills:[{x:300/W(),y:.5,r:110,top:1,cliff:true,ramps:[0]}],woods:[],seed:3},{morale:false});still(w.mine[0]);
   const Q=t.captainMem(1);Q.commit=true;t.command(1);const o0=w.foe[0].order;Q.lineT=1e3;t.command(1);
   ok(o0==='hold'&&w.foe[0].order==='advance','attacking with shooters, the infantry stands for their volleys ('+o0+'); once they have stood twice the volleys’ time reaching nobody, it goes on ('+w.foe[0].order+')')}
  // a man keeping his place below a cliff does not go round after a foe over its edge
  {w=army([G('hum_foot',4)],[G('hum_foot',8)],null,{hills:[{x:.5,y:.5,r:110,top:1,cliff:true,ramps:[180]}],woods:[],seed:3},{morale:false});t.B.cmdT=1e9;const h=t.B.terrain.recipe.hills[0];
   put(w.mine[0],h.x+h.rx-14,h.y);still(w.mine[0]);f=w.foe[0];put(f,h.x+h.rx+14,h.y);const p0=f.units.map(u=>[u.x,u.y]);step(4);
   const moved=Math.max(...f.units.map((u,i)=>Math.hypot(u.x-p0[i][0],u.y-p0[i][1])));ok(moved<16,'foot holding below a sheer face, yours on its edge within reach of their places: they keep them, none goes round after them ('+moved.toFixed(1)+' px at most)')}
  // foot charging a foe over a cliff's edge goes round by the ramp, not up yet: it walks while the way is long, and runs from any
  // way off while shot at (a walk under arrows all the way round to the ramp lost the attack); up an open slope, shot at, it walks
  {const runs=(hl,shot)=>{w=army([G('hum_foot',12)],[G('hum_foot',12)],null,{hills:[hl],woods:[],seed:3},{morale:false});const h=t.B.terrain.recipe.hills[0];
    put(w.mine[0],h.x+h.rx-40,h.y);still(w.mine[0]);f=w.foe[0];put(f,h.x+h.rx+30,h.y);f.attack(w.mine[0].units[0]);if(shot)f.units.forEach(u=>u.shotAt=t.B.t);
    t.captainFinish(1,{inf:[f.id],arc:[],mag:[],cav:[],hero:[]});return f.order==='charge'&&f.run};
   const sheer={x:.5,y:.5,r:110,top:1,cliff:true,ramps:[180]},r0=runs(sheer,false),r1=runs(sheer,true),r2=runs({x:.5,y:.5,r:110,top:1},true);
   ok(!r0&&r1&&!r2,'foot charging your men over a sheer face, round by its ramp: '+(r0?'runs':'walks')+' while the way is long, '+(r1?'runs':'walks')+' once shot at; up an open slope, shot at: '+(r2?'runs':'walks'))}
  // your army still on a ramp hill's top (sheer, its ramp away or to the side; one-way; two levels), the AI attacking from the east
  for(const [n,hl] of [['sheer, ramp west',{x:.5,y:.5,r:110,top:1,cliff:true,ramps:[180]}],['sheer, ramp north',{x:.5,y:.5,r:110,top:1,cliff:true,ramps:[270]}],['one-way, ramp west',{x:.5,y:.5,r:110,top:1,oneway:true,ramps:[180]}],['sheer, two levels',{x:.5,y:.5,r:120,top:2,cliff:true,ramps:[180]}]]){
   w=army(arm,arm,null,{hills:[hl],woods:[],seed:3},{morale:false});const h=t.B.terrain.recipe.hills[0],at=[[h.x+20,h.y],[h.x-25,h.y-20],[h.x-30,h.y+30]];
   w.mine.forEach((g,i)=>{put(g,at[i][0],at[i][1]);tough(g)});w.foe.forEach((g,i)=>put(g,W()-120,h.y-80+i*80));
   const r=watch(300,u=>lv(u)>=h.top&&Math.hypot(u.x-h.x,u.y-h.y)<Math.max(h.rx,h.ry));
   ok(!!r.end&&r.stall<=8&&r.first!=null&&r.first<30&&r.up>=25&&r.flips<=3,'your army on a '+n+' top, the AI attacking: '+say(r))}
  // crags fields: your army still on the highest cliffed top, the AI from the far side (its shooters may be left plinking at your
  // men from afar: no end asked); and AI on AI, to an end
  for(const seed of [2,7]){let top=null;for(let k=0;k<30&&!top;k++){army(arm,arm,null,{recipe:'crags',seed:seed*7+k},{morale:false,seed,distance:500});const tops=t.B.terrain.ai.tops.filter(p=>p.cliff);if(tops.length)top=tops.sort((a,b)=>b.lvl-a.lvl)[0]}
   const T0=t.B.terrain,mine=t.playerGroups().map(id=>t.B.groups[id]),foe=Object.values(t.B.groups).filter(g=>g.foe),on=(x,y)=>t.levelAt(x,y)>=top.lvl&&!T0.solid[t.tIx(T0,x,y)];
   mine.forEach((g,i)=>{let p=null;for(let r=0;r<120&&!p;r+=8)for(let a=0;a<6.28&&!p;a+=.4){const x=top.x+Math.cos(a+i*2)*r,y=top.y+Math.sin(a+i*2)*r;if(on(x,y)&&on(x+20,y)&&on(x-20,y)&&on(x,y+12)&&on(x,y-12))p={x,y}}p=p||top;
    put(g,p.x,p.y);g.units.forEach(u=>{if(!on(u.x,u.y)){u.x=p.x;u.y=p.y}});tough(g)});
   const fx=top.x<W()/2?W()-120:120;foe.forEach((g,i)=>put(g,fx,t.fieldTop()+(t.fieldBot()-t.fieldTop())*(i+1)/(foe.length+1)));
   const r=watch(300,u=>on(u.x,u.y)&&Math.hypot(u.x-top.x,u.y-top.y)<200);
   ok(r.stall<=8&&r.first!=null&&r.first<30&&r.up>=12&&r.flips<=3,'crags (seed '+seed+'), your army on its highest top (level '+top.lvl+(top.oneway?', one-way':', sheer')+'), the AI from the far side: '+say(r))}
  for(const seed of [4,10]){army(arm,arm,null,{recipe:'crags',seed},{ai:true,seed,distance:500});const r=watch(300,null,[0,1]);ok(!!r.end&&r.stall<=8,'crags (seed '+seed+'), AI on AI: '+say(r))}
  ev('TERRAIN.on='+TR0)}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{T.TERRAIN_AI.on=true;if(L.active)L.exit()}
 function ERRS(){return ERR.length}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
