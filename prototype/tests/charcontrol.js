'use strict';
// Your orders still command your hero under the one character AI (commander.js charAuto): move, attack a chosen enemy, hold,
// pace and withdraw; a duel never pulls them off a move or off the enemy you chose.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),out=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
 const t=T,G=t.G,P=t.P;
 try{t.act('begin','soldier');P.troops={hum_spear:4};P.slots=Array(10).fill(null);
  const L=t.W.lords.find(l=>!l.dead);Object.assign(L,{inside:null,x:P.x,y:P.y,troops:Array(6).fill('hum_spear')});G.mode='world';G.modal=false;t.hidePanel();
  t.startEncounter({kind:'lord',ref:L,list:L.troops.slice(),allies:[],foes:[]});t.startBattle({enemies:G.enc.list,tournament:false});const B=t.B;B.obs=[];
  const h=B.hero,lord=B.units.find(x=>x.leader&&x.leader.ref===L),run=n=>{for(let j=0;j<n;j++)t.updateBattle(.03)};
  B.units.filter(u=>u.team===1).forEach(u=>{u.cd=99;u.s={...u.s,spd:0};u.hp=u.max=9999});
  // move
  t.selectGroup('hero');const tx=h.x+120,ty=h.y+40;t.rtsOrder(tx,ty);run(200);ok(Math.hypot(h.x-tx,h.y-ty)<20,'move: the hero goes where sent ('+Math.round(Math.hypot(h.x-tx,h.y-ty))+' px off)');
  // a duel does not pull them off a move
  lord.x=h.x+30;lord.y=h.y;const tx2=h.x-150;t.rtsOrder(tx2,h.y);run(15);ok(h.tgt!==lord||h.x<lord.x-40,'on the move, the enemy lord near does not pull them away');run(200);ok(Math.abs(h.x-tx2)<20,'and they arrive');
  // attack a chosen enemy, with the lord close
  const e=B.units.find(u=>u.team===1&&!u.leader);e.x=h.x+80;e.y=h.y+30;lord.x=h.x+25;lord.y=h.y-10;t.rtsOrder(e.x,e.y-6);run(40);ok(B.groups.hero.tgt===e&&(h.tgt===e||h.tgt===h.near),'attack: the hero goes for the one you chose, not the lord nearby ('+(h.tgt===lord?'lord':h.tgt===e?'chosen':'other')+')');
  // hold
  t.setOrder('hold');run(60);const hx=h.x,hy=h.y;run(100);ok(Math.hypot(h.x-hx,h.y-hy)<25,'hold: they stand ('+Math.round(Math.hypot(h.x-hx,h.y-hy))+' px)');
  // pace
  t.setOrder('charge');ok(!t.walking(B.groups.hero),'run: the pace changes');t.setOrder('advance');ok(t.walking(B.groups.hero),'walk: and back');
  // withdraw
  B.units.filter(u=>u.team===1).forEach(u=>{u.x=t.BW-30});const x0=h.x;t.setOrder('withdraw');let cast=0;const c0=JSON.stringify(t.heroState().cds);run(150);ok(h.x<x0-60||h.left,'withdraw: the hero heads off your edge');
  ok(JSON.stringify(t.heroState().cds)===c0,'and uses no skills on the way');
  B.over=true;B.endT=0;
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}out()};
