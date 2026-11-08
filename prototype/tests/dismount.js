'use strict';
// The dismount (battle/dismount.js Horse, Dismount; data/dismount.js DISMOUNT; doc/TROOPS_DESIGN.md step 4; the owner, 2026-10-31): Dismount
// leaves the riders on foot where they stand, their horses standing there, till Mount sends each back to his own horse (enemies or
// none); a charge, a hard blow or braced spears may throw a rider (down, "Unhorsed"), who goes back up on his own unless an enemy is
// near; a share of every hit lands on the horse, and a horse killed leaves its man on foot; a riderless horse is drawn; your group's
// horses after the fight (the dead lost), its men without one on foot next time, horses bought at a stable, refills without, saved.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,L=t.BattleLab,D=t.DISMOUNT,ev=s=>(0,eval)(s),Gp=(type,count)=>({type,count});
 const lab=(left,right)=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:false,morale:false,seed:7});const B=t.B;B.obs=[];B.cmdT=1e9;return B};
 const go=(B,s,stop)=>{const end=B.t+s;while(B.t<end-1e-9){t.updateBattle(1/30);if(stop&&stop())return true}return false};
 const mine=B=>B.groups[t.playerGroups()[0]],theirs=B=>Object.values(B.groups).find(q=>q.foe);
 // (the foe kept harmless and still, far off or at dx of him)
 const tame=(B,u,dx)=>{for(const f of theirs(B).units){f.s={...f.s,spd:0};f.cd=1e9;f.hp=f.max=1e5;f.x=u.x+dx;f.y=u.y}return theirs(B).units[0]};
 const keep={phys:t.PHYSICS.on,on:D.on,brace:D.brace,slam:t.MOVESETS.hard.slam.down};
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;window.__cbo=t.checkBattleOver;ev('checkBattleOver=()=>{}');
 try{
  ev('DISMOUNT.on=true;PHYSICS.on=false');
  ok(D.spd.plate<D.spd.none&&D.stun>0&&D.mountT>0&&D.near>D.reach&&D.hp.m_destrier>D.hp.m_horse&&D.share.missile>D.share.blow&&D.share.spear>D.share.blow&&D.seat>0,'the tunables in one table: pace on foot, stun, mounting, the horses\' health and their share of the hits');
  // ---- the orders: Dismount where they stand, Mount back to their own horses
  {const B=lab([Gp('hum_lancer',6)],[Gp('militia',2)]),g=mine(B),m=g.units;tame(B,m[0],600);go(B,.1);const s0=m.map(u=>u.s),spd=m[0].s.spd;
   ok(t.groupHasAbility(g,'dismount')&&!t.groupHasAbility(g,'mount')&&!t.UNIT_ABILITIES.brace.who(m[0]),'six Lancers in the saddle: Dismount, not Mount; no Brace on horseback');
   const at=m.map(u=>[u.x,u.y]);ok(g.useAbility('dismount'),'Dismount ordered');
   ok(m.every(u=>u.afoot&&!u.s.mounted&&!u.s.charge&&u.s.spd<spd&&t.unitClass(u.s)==='spear'&&t.UNIT_ABILITIES.brace.who(u)),'all six on foot: no charge, a man\'s pace ('+Math.round(m[0].s.spd)+' against '+spd+'), spearmen again with Brace');
   ok(t.B.horses.length===6&&m.every((u,i)=>u.horse.x===at[i][0]&&u.horse.y===at[i][1]&&!u.horse.dead),'their six horses stand where they stepped down');
   const st=t.cardStatus(g.id,m,null,null).find(o=>o.k==='mounted');ok(st&&st.n==='0/6'&&/0\/6 mounted/.test(st.w),'the group card: 0/6 mounted ('+(st&&st.w)+')');
   ok(!t.groupHasAbility(g,'dismount')&&t.groupHasAbility(g,'mount'),'now Mount, not Dismount');
   g.moveTo(g.ax,g.ay+60);go(B,5);ok(m.every(u=>u.afoot)&&Math.hypot(m[0].x-at[0][0],m[0].y-at[0][1])>40,'moved off 60 px on foot, still on foot ('+Math.round(Math.hypot(m[0].x-at[0][0],m[0].y-at[0][1]))+' px from his horse)');
   ok(g.useAbility('mount')&&m.every(u=>u.remount==='order'),'Mount ordered: each makes for his own horse');
   const done=go(B,8,()=>m.every(u=>!u.afoot));ok(done&&!t.B.horses.length&&m.every((u,i)=>u.s===s0[i]&&u.s.mounted),'all walked back and mounted, their horses gone from the ground, as they rode before (B.t '+t.B.t.toFixed(1)+' s)');
   ok(!t.cardStatus(g.id,m,null,null).some(o=>o.k==='mounted'),'all in the saddle: no count on the card')}
  // ---- thrown (physics on): down, "Unhorsed"; up again on his own with no enemy near; fighting on foot with one near
  ev('PHYSICS.on=true');
  {const B=lab([Gp('hum_lancer',1)],[Gp('militia',1)]),u=mine(B).units[0],f=tame(B,u,500);
   t.physThrow(u,0,200,true);
   ok(u.afoot&&u.down>0&&t.physDownPose(u)!=null&&u.remount==='auto'&&B.floats.some(x=>x.t==='Unhorsed')&&t.B.horses.length===1,'a throw hard enough: out of the saddle, down a moment, "Unhorsed" over him, his horse left standing');
   const up=go(B,8,()=>!u.afoot);ok(up&&!u.horse.dead&&!t.B.horses.length,'no enemy near: up again, back to his horse and into the saddle on his own ('+B.t.toFixed(1)+' s)');
   go(B,2);f.x=u.x+16;f.y=u.y;t.physThrow(u,0,200,true);ok(u.afoot,'thrown again with an enemy at his side');
   go(B,4);ok(u.afoot&&u.remount==='auto'&&u.tgt===f,'an enemy near: he fights him on foot, his horse waiting');
   f.x=u.x+600;const up2=go(B,10,()=>!u.afoot);ok(up2,'the enemy gone: back into the saddle');
   // (the commander's Mount: back to his horse whatever is near)
   go(B,2);f.x=u.x+16;f.y=u.y;t.physThrow(u,0,200,true);go(B,2);ok(u.afoot,'thrown once more, the enemy at his side');
   ok(mine(B).useAbility('mount'),'Mount ordered');const up3=go(B,8,()=>!u.afoot);ok(up3&&Math.hypot(f.x-u.x,f.y-u.y)<D.near,'ordered to: mounted with the enemy still beside him')}
  {const B=lab([Gp('hum_lancer',1)],[Gp('troll',1)]),u=mine(B).units[0],tr=theirs(B).units[0];tame(B,u,14);
   t.physBlow(tr,u);ok(!u.afoot,'a troll\'s normal blow does not unhorse him');
   t.MOVESETS.hard.slam.down=1;t.physBlow(tr,u,t.MOVESETS.hard.slam);ok(u.afoot&&u.down>0,'its club slam (a hard attack) does')}
  {const B=lab([Gp('hum_knight',1)],[Gp('hum_pike',1)]),u=mine(B).units[0],p=theirs(B).units[0];tame(B,u,14);D.brace=1;u.vel=60;
   t.physBraced(u,p,1);ok(u.afoot&&u.down>0,'braced spears: a knight at the gallop thrown from the saddle');D.brace=keep.brace}
  {const B=lab([Gp('hum_lancer',1)],[Gp('militia',1)]),u=mine(B).units[0];tame(B,u,500);t.physThrow(u,0,5,true);ok(!u.afoot,'a light throw (5 px/s) leaves him in the saddle')}
  ev('PHYSICS.on=false');
  // ---- his horse's health: a share of the hits; killed, he fights on foot to the end
  {const B=lab([Gp('hum_lancer',1)],[Gp('militia',1)]),u=mine(B).units[0],f=tame(B,u,500),hp=u.hp;
   t.applyDmg(u,20,1,'pierce',f,true);const h=u.horse;ok(h&&h.hp===h.max-20*D.share.missile&&u.hp===hp-Math.round(20*(1-D.share.missile)),'an arrow of 20: '+20*D.share.missile+' on his horse, '+(hp-u.hp)+' on him');
   h.hp=1;const c0=B.corpses.length;t.applyDmg(u,20,1,'slash',f,false);
   ok(u.afoot&&h.dead&&!t.B.horses.length&&B.corpses.length===c0+1&&B.corpses[c0].sp.horse&&B.floats.some(x=>x.t==='Horse down'),'his horse killed: it lies there, he is down, "Horse down"');
   ok(!t.groupHasAbility(mine(B),'mount')&&!mine(B).useAbility('mount'),'no Mount for a man whose horse is dead');go(B,6);ok(u.afoot,'he stays on foot')}
  // ---- a riderless horse drawn: saddled, its side's cloth, among the living
  {const B=lab([Gp('hum_lancer',1)],[Gp('militia',1)]),u=mine(B).units[0];tame(B,u,500);mine(B).useAbility('dismount');const h=u.horse,sp=t.horseSprite(h.look);
   const px=sp.getContext('2d').getImageData(0,0,sp.width,sp.height).data,hex=i=>'#'+[px[i],px[i+1],px[i+2]].map(v=>v.toString(16).padStart(2,'0')).join(''),cols=new Set();for(let i=0;i<px.length;i+=4)if(px[i+3])cols.add(hex(i));
   const cloth=t.pal(h.look.team)[1],g0=t.pgrid(32,32);t.drawMount(g0,h.look,-1);ok(cols.has(cloth.toLowerCase())&&g0.p.includes(cloth),'the horse\'s picture: its side\'s cloth under the saddle (and under its rider: 2026-11-07, the owner, "more details")');
   ok(t.battleEnts().includes(h),'among what stands on the field (render.js battleEnts)');
   let n=0;const d=h.draw;h.draw=function(){n++;return d.apply(this,arguments)};try{t.drawBattle()}finally{h.draw=d}ok(n===1,'drawn with the field (once; '+n+')')}
  if(L.active)L.exit();
  // ---- your group's horses: after a fight, next time, a stable, refills, saved
  {const r=t.partyRoster(P);P.troops={};P.comps={};P.gold=1e5;P.sk.lead.lv=10*PROF.per;r.add('hum_lancer',6,'new');const g=r.groups.find(x=>x.type==='hum_lancer'),id=g.id,gr=()=>t.partyRoster(t.P).groups.find(x=>x.id===id);
   ok(g.horses==null&&t.groupHorses(g)===6,'a new unit of Lancers: a horse a man, nothing kept');
   const fight=()=>{G.mode='world';G.modal=false;G.enc={kind:'party',ref:{cool:0},list:['militia','militia']};t.startBattle({enemies:['militia','militia'],deploy:false});const Bt=t.B;if(Bt.ready||Bt.deploy)t.beginFight();Bt.paused=false;t.updateBattle(.02);return Bt};
   const end=Bt=>{Bt.over=true;Bt.win=true;Bt.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();t.hidePanel();G.mode='world';G.modal=false};
   {const Bt=fight(),m=Bt.units.filter(u=>u.sourceGroupId===id&&u.sourceArmy===t.P),e=Bt.units.find(u=>u.team===1);
    for(const u of m.slice(0,2)){t.Horse.of(u).hp=1;t.applyDmg(u,4,1,'slash',e,false)}t.Horse.of(m[2]).hp-=15;m[2].hp=m[2].max;
    ok(m.length===6&&m.filter(u=>u.afoot).length===2,'in the fight two horses killed, one hurt ('+m.length+' men, '+m.filter(u=>u.afoot).length+' on foot)');end(Bt)}
   ok(gr().count===6&&gr().horses===4&&t.horsesShort(gr())===2,'after it: the hurt one back, the dead lost: 4 horses for 6 men');
   {const Bt=fight(),m=Bt.units.filter(u=>u.sourceGroupId===id&&u.sourceArmy===t.P),off=m.filter(u=>u.afoot);
    ok(off.length===2&&off.every(u=>u.horse===null&&!u.s.mounted)&&m.filter(u=>u.s.mounted).length===4,'the next fight: two of them on foot from the start, with no horse');
    const st=t.cardStatus(Bt.groups[m[0].grp].id,m,null,null).find(o=>o.k==='mounted');ok(st&&st.n==='4/6','its card: 4/6 mounted');
    ok(!off.some(u=>t.UNIT_ABILITIES.mount.who(u)),'no Mount for them');end(Bt)}
   ok(gr().horses===4,'that fight lost none: still 4');
   G.mode='world';t.saveGame(true,'quick');t.loadGame('quick');const g2=t.partyRoster(t.P).groups.find(x=>x.id===id);ok(g2&&g2.horses===4,'saved and loaded: its 4 horses');
   // (a stable: your spare horse first, the rest bought)
   const P2=t.P,town=t.TOWNS.find(x=>x.T?.tabs?.includes('stable')&&t.stableStock(x).includes('m_horse')&&t.canBuyMount(x,'m_horse')&&!t.recruitment.closed(x));
   if(!town)ok(false,'a holding whose stable sells riding horses');else{
    P2.gold=1e5;t.invAdd('gear','m_horse',1);const gold=P2.gold,price=t.gearPrice('m_horse');G.mode='world';G.modal=false;t.hidePanel();t.enterTown(town);t.act('tab','stable');
    ok(/Horses for your riders/.test(document.getElementById('panel').textContent),'the stable at '+town.name+': Horses for your riders');
    const b=document.querySelector('[data-act="buy-horses"][data-arg="'+id+'"]');ok(b&&!b.disabled,'a button to horse them');if(b)b.click();
    const g3=t.partyRoster(P2).groups.find(x=>x.id===id);ok(g3.horses==null&&t.horsesShort(g3)===0&&P2.gold===gold-price&&t.invCount('gear','m_horse')===0,'horsed: your spare one and one bought ('+(gold-P2.gold)+'g); all six ride again');
    t.act('leave');G.mode='world';G.modal=false;t.hidePanel()}
   // (refills come without horses; a new unit with them; a lord's army keeps none)
   {const r2=t.partyRoster(t.P),gg=r2.groups.find(x=>x.id===id);r2.remove('hum_lancer',2,id);r2.add('hum_lancer',2,id);ok(gg.horses===4&&t.horsesShort(gg)===2,'two men refilling it come without horses');
    const lord=t.W.lords.find(l=>!l.dead);if(lord){const lr=t.partyRoster(lord),lg=lr.groups.find(x=>t.horseOf(x.type));if(lg){lr.add(lg.type,1,lg.id);ok(lg.horses==null,'a lord\'s refilled riders: no horses kept')}}}}
 }finally{if(L.active)L.exit();D.brace=keep.brace;t.MOVESETS.hard.slam.down=keep.slam;ev('PHYSICS.on='+keep.phys+';DISMOUNT.on='+keep.on+';checkBattleOver=window.__cbo')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR.join(' | '):''));
});
