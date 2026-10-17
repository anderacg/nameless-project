'use strict';
// characters fall back after a defensive roll (commander.js CHAR_FALL): out of the press toward their own troops, no going back
// in while the place is a trap or their breath is short, in again once it is safe (your hero to your attack order, an AI
// character to the safest foe near), a time cap and no-troops-left way out, and your hero under your own hands untouched
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),auto0=t.AUTOSK.on;try{
 const X=t.CHAR_FALL;
 const army=(left,right,at)=>{if(L.active)L.exit();L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42});const b=t.B;b.obs=[];
  const mine=t.playerGroups().map(id=>b.groups[id]),foe=Object.values(b.groups).filter(g=>g.foe);
  [...mine,...foe].forEach((g,i)=>{g.placeAt(at[i][0],at[i][1]);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})});return {b,mine,foe}};
 const G=(type,count)=>({type,count}),still=g=>g.units.forEach(u=>{u.s={...u.s,spd:0};u.cd=999}),step=s=>{const end=t.B.t+s;while(t.B.t<end-1e-9&&!L.session.result)L.step(6)};
 const mid=l=>({x:l.reduce((a,u)=>a+u.x,0)/l.length,y:l.reduce((a,u)=>a+u.y,0)/l.length}),dd=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 // three foes round a badly hurt character, the rest of their group off to one side
 const press=(u,list)=>{list.forEach((e,i)=>{const a=Math.PI*(.7+.3*i);e.x=u.x+Math.cos(a)*16;e.y=u.y+Math.sin(a)*16})};
 const look=(u,S,n=1)=>{for(let i=0;i<n;i++){S.fbT=0;t.commandCharacters(.01)}};
 // ----- an AI character (Brann, the enemy's): roll, fall back toward his own troops
 let w=army([G('hum_foot',15)],[G('brann',1),G('hum_foot',10)],[[300,300],[480,300],[640,300]]);let u=w.foe[0].units[0],C=t.champ(u),pl=w.mine[0];still(pl);
 const near3=pl.units.slice(0,3);pl.units.slice(3).forEach((e,i)=>{e.x=200+(i%4)*10;e.y=120+Math.floor(i/4)*10});press(u,near3);
 u.hp=u.max*.2;C.shoveCd=99;C.rollCd=0;C.think=0;const P0=mid(near3),d0=dd(u,P0),F0=dd(u,mid(w.foe[1].units));t.commandCharacters(.01);
 ok(C.fallBack&&t.B.floats.some(f=>f.t==='Falling back'),'badly hurt and pressed, a character rolls clear and falls back (a "Falling back" float)');
 const spot={x:C.fallBack.x,y:C.fallBack.y},sd=dd(spot,{x:u.x,y:u.y});ok(sd>=X.near-1&&sd<=X.dist+1,'its spot is '+Math.round(sd)+' px off ('+X.near+'-'+X.dist+')');
 step(2.5);ok(dd(u,P0)>d0+40&&dd(u,mid(w.foe[1].units))<F0,'it moves away from the press, toward its own troops ('+Math.round(dd(u,P0))+' px from the press)');
 ok(!near3.some(e=>e.hp<e.max),'striking nobody on the way (no foe in its reach)');
 look(u,C,2);ok(C.fallBack,'with the place it would go still a trap (three of theirs together), it stays out');
 near3.forEach((e,i)=>{e.x=120+i*90;e.y=470});u.sta=20;look(u,C);ok(C.fallBack,'the place safe, but its breath short: it stays out');
 u.sta=t.FATIGUE.max;look(u,C);ok(!C.fallBack&&u.tgt&&u.tgt.team===0,'breath back and the place safe: it goes in again');
 // ----- the safer target: a lone foe rather than the press it left
 w=army([G('hum_foot',4),G('hum_foot',1)],[G('brann',1),G('hum_foot',10)],[[300,300],[300,140],[480,300],[640,300]]);u=w.foe[0].units[0];C=t.champ(u);w.mine.forEach(still);
 const lone=w.mine[1].units[0];press(u,w.mine[0].units.slice(0,3));w.mine[0].units[3].x=u.x-20;w.mine[0].units[3].y=u.y+20;u.hp=u.max*.2;C.shoveCd=99;C.rollCd=0;C.think=0;t.commandCharacters(.01);step(2.5);
 lone.x=u.x-150;lone.y=u.y-150;u.sta=t.FATIGUE.max;w.b.t+=X.min;look(u,C);ok(!C.fallBack&&u.tgt===lone,'an AI character goes for the lone foe rather than back into the press');
 // ----- the time cap, and no troops of its own left
 w=army([G('hum_foot',15)],[G('brann',1),G('hum_foot',10)],[[300,300],[480,300],[640,300]]);u=w.foe[0].units[0];C=t.champ(u);pl=w.mine[0];still(pl);
 pl.units.forEach((e,i)=>{e.x=u.x-14-(i%4)*8;e.y=u.y-12+Math.floor(i/4)*8});u.hp=u.max*.2;C.shoveCd=99;C.rollCd=0;C.think=0;t.commandCharacters(.01);ok(C.fallBack,'(cap fixture falls back)');
 step(2);u.sta=t.FATIGUE.max;look(u,C);ok(C.fallBack,'(the press it left is still a trap)');w.b.t+=X.max;look(u,C);ok(!C.fallBack,'after CHAR_FALL.max s it goes in anyway: no freezing for ever');
 w=army([G('hum_foot',15)],[G('brann',1),G('hum_foot',10)],[[300,300],[480,300],[640,300]]);u=w.foe[0].units[0];C=t.champ(u);pl=w.mine[0];still(pl);
 pl.units.forEach((e,i)=>{e.x=u.x-14-(i%4)*8;e.y=u.y-12+Math.floor(i/4)*8});u.hp=u.max*.2;C.shoveCd=99;C.rollCd=0;C.think=0;t.commandCharacters(.01);
 w.foe[1].units.forEach(m=>m.hp=0);w.b.t+=X.min;u.sta=20;look(u,C);ok(!C.fallBack,'with no troops of its own left to cover it, it just fights');
 // ----- your hero (Auto skills): falls back, then resumes your attack order
 t.AUTOSK.on=true;w=army([G('hero',1),G('hum_foot',10)],[G('hum_foot',3),G('hum_foot',12)],[[480,300],[300,300],[500,300],[700,120]]);const h=t.B.hero,H=t.heroState(),hg=t.B.groups[h.grp],tg=w.foe[0];w.foe.forEach(still);
 hg.attack(tg);press(h,tg.units);h.hp=h.max*.2;H.shoveCd=99;H.rollCd=0;H.sp=t.maxSP();H.think=0;t.commandCharacters(.01);
 ok(H.fallBack,'your hero on Auto skills falls back too');step(2);ok(dd(h,mid(tg.units))>60,'away from the press, never back through it to troops beyond ('+Math.round(dd(h,mid(tg.units)))+' px)');H.sp=t.maxSP();look(h,H,2);ok(H.fallBack&&hg.targetGroupId===tg.id,'your attack order is kept while the target is a press of three');
 tg.units.forEach((e,i)=>{e.x=200+i*90;e.y=470});H.sp=t.maxSP();look(h,H);ok(!H.fallBack&&hg.targetGroupId===tg.id,'the target spread out: your hero goes in again, still on your order');
 step(.6);ok(h.tgt&&h.tgt.grp===tg.id,'at your ordered target');
 press(h,w.foe[1].units.slice(0,3));h.hp=h.max*.2;H.rollCd=0;H.sp=t.maxSP();H.think=0;t.commandCharacters(.01);ok(H.fallBack,'(falls back again)');hg.moveTo(300,450);look(h,H);ok(!H.fallBack,'a new order of yours (a move) ends a fall-back at once');
 // ----- your hero under your own hands: never
 w=army([G('hero',1),G('hum_foot',10)],[G('hum_foot',3),G('hum_foot',12)],[[480,300],[300,300],[500,300],[700,120]]);(0,eval)('MANUAL_HERO=true');
 try{const h2=t.B.hero,H2=t.heroState();press(h2,w.foe[0].units);h2.hp=h2.max*.2;H2.shoveCd=99;H2.rollCd=0;H2.think=0;t.commandCharacters(.01);ok(!H2.fallBack,'your hero under your own hands (manual) never falls back on its own')}finally{(0,eval)('MANUAL_HERO=false')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{t.AUTOSK.on=auto0;if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
