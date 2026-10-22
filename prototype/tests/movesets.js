'use strict';
// Movesets (battle/movesets.js, MOVESETS; the owner, 2026-10-22: "only a hard or charge attack can knock down"): a normal blow never
// throws anyone down (a push at most); a hard attack is wound up first (its ring and name), lands, may throw down, and is not
// used again within its cooldown; a charge throws down only at speed, after a true run; braced spears stop it; nobody goes down
// again within the grace after getting up, nor while rolling clear; a stun spoils a wind-up; with physics off hard attacks still
// land (and throw no one down); your hero's and a champion's heavy weapons wind up their finisher. And the measure the owner
// asked for: the hero's knockdowns a minute against two bears, a troll and six knights, with the old rules (MOVESETS.old) and
// the new. The other suites see the movesets as they are (their fingerprints held: tests/harness.js leaves MOVESETS alone).
Kit.suite(({ok,info})=>{const t=T,G=t.G,L=t.BattleLab,M=t.MOVESETS,ev=s=>(0,eval)(s),Gp=(type,count,form)=>({type,count,...(form?{form}:{})});
 const lab=(left,right,x={})=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:false,morale:false,seed:7,...x});const B=t.B;B.obs=[];if(!x.ai)B.cmdT=1e9;return B};
 const go=(B,s,watch)=>{const end=B.t+s;while(B.t<end-1e-9){t.updateBattle(1/30);if(watch)watch()}};
 const mine=B=>B.groups[t.playerGroups()[0]],theirs=B=>Object.values(B.groups).find(q=>q.foe);
 const keep={old:M.old,maul:M.hard.maul.down,heavy:M.hard.heavy.down,phys:t.PHYSICS.on,beasts:t.BEAST_TACTICS.on,weapon:null};
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;window.__cbo=t.checkBattleOver;keep.weapon=t.P.gear.weapon;ev('checkBattleOver=()=>{}');
 try{
  ev('PHYSICS.on=true');
  // ======== the table, and whose moveset is which
  ok(M.old===false&&M.grace>0&&M.charge.speed>0&&Object.values(M.hard).every(H=>H.wind>0&&H.cd>H.wind&&H.down>0&&H.down<=1&&H.dmg>1),'the tunables in one table: each hard attack\'s wind-up, cooldown, chance and damage; the charge\'s speed; the grace; the old switch off');
  {const B=lab([Gp('bear',1),Gp('hum_knight',1),Gp('hum_champ',1),Gp('dw_hammer',1),Gp('militia',1),Gp('hum_bow',1)],[Gp('troll',1),Gp('dragon',1),Gp('wolf',1),Gp('boar',1),Gp('hum_foot',1),Gp('orc_reaver',1)]);
   const ms=k=>{const u=B.units.find(q=>q.type===k),m=t.Moveset.of(u);return (m.hard?m.hard.n:'normal')+(m.charge?' + charge'+(m.charge!==1?' ×'+m.charge:''):'')},row=['bear','troll','dragon','wolf','boar','hum_knight','hum_champ','orc_reaver','dw_hammer','militia','hum_foot','hum_bow'].map(k=>k+': '+ms(k));
   info('movesets: '+row.join('; '));
   ok(ms('bear')==='Maul + charge ×1.6'&&ms('troll')==='Club slam'&&ms('dragon')==='Stomp'&&ms('wolf')==='normal'&&ms('boar')==='normal + charge'&&ms('hum_knight')==='normal + charge'&&ms('hum_champ')==='Heavy blow'&&ms('orc_reaver')==='Heavy blow'&&ms('dw_hammer')==='Heavy blow'&&ms('militia')==='normal'&&ms('hum_foot')==='normal'&&ms('hum_bow')==='normal',
    'whose: a bear mauls and rushes, a troll slams, the dragon stomps, wolves and foot strike normally, riders and boars charge, two-handers and maces strike hard')}
  // ======== a normal blow never throws down (a rider standing still, a bear whose maul is not ready): a push at most; the old rules did
  const normal=(k,old)=>{M.old=old;const B=lab([Gp(k,1)],[Gp('militia',1)]),u=mine(B).units[0],f=theirs(B).units[0];u.x=400;u.y=300;f.x=400+(u.s.reach||11);f.y=300;f.hp=f.max=1e5;u.vel=0;u.run=0;u.hardAt=1e9;
   let down=0,push=0;for(let i=0;i<30;i++){f.down=0;f.upAt=null;f.kx=f.ky=0;t.attack(u,f);if(f.down>0)down++;push=Math.max(push,Math.hypot(f.kx,f.ky))}M.old=false;return{down,push}};
  for(const k of ['hum_knight','bear']){const n=normal(k,false),o=normal(k,true);
   ok(n.down===0&&n.push>0&&o.down>0,'30 normal blows of a '+k+' standing still on a militiaman: none throws him down (pushed '+Math.round(n.push)+' px/s at most); the old rules threw him down '+o.down+' times')}
  // ======== a hard attack: wound up (its telegraph), then it lands and may throw down; never again within its cooldown
  {M.hard.maul.down=1;const B=lab([Gp('bear',1)],[Gp('militia',1)]),u=mine(B).units[0],f=theirs(B).units[0],H=M.hard.maul;u.x=400;u.y=300;f.x=414;f.y=300;f.hp=f.max=1e5;f.cd=999;f.s={...f.s,spd:0};mine(B).attack(f);
   const winds=[],downs=[],marks=[];let w=false,d=false,early=0;
   go(B,25,()=>{if(u.wind&&!w){winds.push(B.t);marks.push(B.rings.some(r=>r.col==='255,150,60')&&B.floats.some(x=>x.t===H.n))}w=!!u.wind;const dn=f.down>0;if(dn&&!d){downs.push(B.t);const s=winds[winds.length-1];if(s==null||B.t-s<H.wind-.05)early++}d=dn});
   const gaps=winds.slice(1).map((x,i)=>x-winds[i]);
   ok(winds.length>=2&&marks.every(Boolean)&&downs.length>=2&&early===0,'a bear on a militiaman for 25 s: '+winds.length+' mauls wound up (each with its ring and name), '+downs.length+' throw-downs, none before its wind-up ('+H.wind+' s) was through');
   ok(gaps.every(g=>g>=H.cd+H.wind-.05),'never again within its cooldown: '+gaps.map(g=>g.toFixed(1)).join(', ')+' s between mauls (cooldown '+H.cd+' s from the wind-up\'s end)');
   M.hard.maul.down=keep.maul}
  // ======== a stun spoils a wind-up; so does a throw-down
  {const B=lab([Gp('bear',1)],[Gp('militia',1)]),u=mine(B).units[0],f=theirs(B).units[0];u.x=400;u.y=300;f.x=414;f.y=300;u.hardAt=-10;t.attack(u,f);const wound=!!u.wind;t.stun(u,.3);const a=!u.wind;
   u.stun=0;u.hardAt=-10;t.attack(u,f);const wound2=!!u.wind;t.physFall(u,100);ok(wound&&a&&wound2&&!u.wind,'a stun or a fall spoils a wind-up')}
  // ======== a charge throws down only at speed, after a true run
  const charge=(k,foe,run,v,o={})=>{const hero=foe==='hero',B=hero?lab([{type:'hero',count:1}],[Gp(k,1)]):lab([Gp(k,1)],[Gp(foe,1)]),u=(hero?theirs(B):mine(B)).units[0],f=hero?B.hero:theirs(B).units[0];u.x=400;u.y=300;f.x=414;f.y=300;f.dir=f.hd=Math.PI;f.face=-1;u.hd=0;u.dir=0;
   f.down=0;f.upAt=o.up!=null?B.t-o.up:null;if(o.inv)B.hx.inv=1;u.run=t.CHARGE.run*run;u.vel=u.s.spd*v;u.sta=100;t.chargeMul(u,f);return{down:f.down>0,braced:B.floats.some(x=>/^Braced/.test(x.t)),vel:u.vel}};
  {const full=charge('hum_knight','militia',1,1),short=charge('hum_knight','militia',.3,1);M.old=true;const shortOld=charge('hum_knight','militia',.3,1);M.old=false;
   const foot=charge('hum_foot','militia',1,1),bear=charge('bear','militia',1,1),bearSlow=charge('bear','militia',.5,1);
   ok(full.down&&!short.down&&shortOld.down,'a knight at the gallop after a full run throws a militiaman down; at the gallop but only just turned on him (momentum 0.3), not (the old rules did)');
   ok(!foot.down&&bear.down&&!bearSlow.down,'a footman\'s running blow never does; a bear\'s full rush does (its rush ×'+t.Moveset.of(t.B.units.find(q=>q.type==='bear')).charge+'), half a rush not')}
  // ======== braced spears stop it
  {const r=charge('hum_knight','hum_spear',1,1);ok(r.braced&&!r.down&&r.vel===0,'a knight at the gallop into a braced spearman: "Braced!", the rider stopped dead, the spearman on his feet')}
  {const B=lab([Gp('troll',1)],[Gp('hum_spear',1),Gp('hum_foot',1),Gp('militia',1)]),u=mine(B).units[0],[sp,sh,mi]=B.units.filter(q=>q.team===1);
   for(const q of [sp,sh,mi]){q.x=420;q.y=300;q.dir=q.hd=Math.PI;q.face=-1}u.x=400;u.y=300;const R=M.resist,F=q=>t.Moveset.footing(u,q);
   ok(F(sp)===R.brace*R.shield&&F(sh)===R.shield&&F(mi)===1,'a hard blow\'s footing: a braced spearman (with his shield) ×'+F(sp)+', a shield toward it ×'+F(sh)+', a militiaman ×'+F(mi))}
  // ======== no second fall within the grace after getting up; none while rolling clear
  {const B=lab([Gp('hum_knight',1)],[Gp('militia',1)]),f=theirs(B).units[0];f.down=.05;t.physDown(f,.1);const up=f.upAt===B.t&&!(f.down>0);
   const soon=charge('hum_knight','militia',1,1,{up:M.grace-.5}),later=charge('hum_knight','militia',1,1,{up:M.grace+.1});
   ok(up&&!soon.down&&later.down,'up again (getting up marks the time): a full charge '+(M.grace-.5)+' s later leaves him standing, '+(M.grace+.1)+' s later throws him down (grace '+M.grace+' s)')}
  {const r=charge('hum_knight','hero',1,1,{inv:true}),n=charge('hum_knight','hero',1,1);ok(!r.down&&n.down,'your hero rolling clear is not thrown down by a full charge; standing, they are')}
  // ======== physics off: hard attacks still wind up and land, ×dmg, and throw no one down
  {ev('PHYSICS.on=false');const B=lab([Gp('troll',1)],[Gp('militia',1)]),u=mine(B).units[0],f=theirs(B).units[0];u.x=400;u.y=300;f.x=420;f.y=300;f.hp=f.max=1e5;f.cd=999;f.s={...f.s,spd:0};mine(B).attack(f);
   let n=0,w=false,down=0,hp=f.hp,hard=1e9,norm=0;go(B,20,()=>{const lost=hp-f.hp;hp=f.hp;if(lost>0){if(w&&!u.wind)hard=Math.min(hard,lost);else norm=Math.max(norm,lost)}if(u.wind&&!w)n++;w=!!u.wind;if(f.down>0)down++});ev('PHYSICS.on=true');
   ok(n>=2&&hard>norm&&norm>0&&down===0,'physics off: a troll on a militiaman slams '+n+' times in 20 s (its least slam '+hard+' hp, its hardest normal blow '+norm+'), nobody down')}
  // ======== your hero with a heavy weapon, and a champion's: their finisher wound up as a hard attack
  {if(L.active)L.exit();t.P.gear.weapon=t.gearId('greatsword',0);M.hard.heavy.down=1;const B=lab([{type:'hero',count:1}],[Gp('militia',3)],{ai:true}),h=B.hero,foes=theirs(B).units;foes.forEach((f,i)=>{f.hp=f.max=1e5;f.cd=999;f.s={...f.s,spd:0};f.y=200+i*100});h.hp=h.max=1e5;
   let n=0,w=false,downs=0,was=new Set();go(B,25,()=>{if(h.wind&&!w)n++;w=!!h.wind;for(const f of foes){if(f.down>0&&!was.has(f)){downs++;was.add(f)}if(!(f.down>0))was.delete(f)}});
   ok(t.Moveset.of(h).hard===M.hard.heavy&&n>=2&&downs>=1,'your hero with a greatsword: a heavy blow, wound up '+n+' times in 25 s, its finisher threw a man down '+downs+' times');
   L.exit();t.P.gear.weapon=keep.weapon;M.hard.heavy.down=keep.heavy;const B2=lab([{type:'hero',count:1}],[Gp('militia',1)]);ok(!t.Moveset.of(B2.hero).hard,'with a sword: no hard attack')}
  {const B=lab([Gp('brann',1)],[Gp('militia',3)],{ai:true}),c=mine(B).units[0];c.s={...c.s,dmg:14};c.hp=c.max=1e5;theirs(B).units.forEach(f=>{f.hp=f.max=1e5;f.cd=999});
   let n=0,w=false;go(B,25,()=>{if(c.wind&&!w)n++;w=!!c.wind});ok(t.Moveset.of(c).hard===M.hard.heavy&&n>=2,'a champion with a heavy weapon winds up their finisher too: '+n+' times in 25 s')}
  // ======== the old switch: nothing asked of the movesets, nothing kept on anyone
  {M.old=true;const B=lab([Gp('bear',2),Gp('hum_champ',4)],[Gp('troll',1),Gp('hum_foot',6)],{ai:true});let w=0;go(B,20,()=>{for(const u of B.units)if(u.wind)w++});M.old=false;
   ok(w===0&&B.units.every(u=>u.hardAt===undefined),'MOVESETS.old: in a 20 s fight of bears, a troll and greatswords no one winds up, no cooldown is kept')}
  // ======== the measure: your hero's knockdowns a minute (no armour, mass 1) against two bears, a troll and six knights, old rules and new
  ev('BEAST_TACTICS.on=true');
  const fight=(foe,n,form,seed)=>{const B=lab([{type:'hero',count:1}],[Gp(foe,n,form)],{ai:true,seed,distance:300,ground:'none'}),h=B.hero;h.hp=h.max=1e6;for(const u of B.units)if(u.team===1)u.hp=u.max=1e6;
   let downs=0,was=false;go(B,60,()=>{const d=h.down>0;if(d&&!was)downs++;was=d});return{downs,mass:t.physMass(h),armor:t.armorOf(h.s)}};
  for(const [name,foe,n,form] of [['two bears','bear',2],['a troll','troll',1],['six knights','hum_knight',6,'wedge']]){
   const per=old=>{M.old=old;try{const R=[1,2,3].map(s=>fight(foe,n,form,s));return{avg:R.reduce((a,r)=>a+r.downs,0)/R.length,R}}finally{M.old=false}},b=per(true),a=per(false);
   info('MEASURE '+name+': your hero ('+b.R[0].armor+', mass '+b.R[0].mass.toFixed(2)+') knocked down '+b.avg.toFixed(1)+' a minute with the old rules ('+b.R.map(r=>r.downs).join(', ')+'), '+a.avg.toFixed(1)+' with movesets ('+a.R.map(r=>r.downs).join(', ')+')');
   ok(a.avg*4<b.avg,'against '+name+': '+a.avg.toFixed(1)+' knockdowns a minute, from '+b.avg.toFixed(1))}
 }finally{if(L.active)L.exit();M.old=keep.old;M.hard.maul.down=keep.maul;M.hard.heavy.down=keep.heavy;t.P.gear.weapon=keep.weapon;ev('PHYSICS.on='+keep.phys+';BEAST_TACTICS.on='+keep.beasts+';checkBattleOver=window.__cbo');if(L.active)L.exit()}
});
