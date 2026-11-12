'use strict';
window.ARENA=true;
// Monster breeds (data/monsters.js MONSTER_BREEDS): each its kind's figure in its own coats, its own fighter and lore; a lair takes one by
// the ground it lies on, by a hash (no draw); its troops, name, loot, save and battle its own; the slime without eyes.
Kit.suite(({ok,info})=>{const t=T;Kit.begin('soldier');const PX=t.PX,MB=t.MONSTER_BREEDS,ST=t.ST,ids=Object.keys(MB.kinds);
 ok(ids.length>=10,ids.length+' breeds: '+ids.join(', '));
 // ---- each a fighter of its kind's, changed, and a figure of its kind's in its own colours, its deaths and map figure its kind's
 {const bad=[];for(const k of ids){const b=MB.kinds[k],u=t.MONSTERS[b.kind].unit,S=ST[k];
   if(!S||!S.beast||S.breed!==b.kind||t.breedOf(k)!==u)bad.push(k+' fighter');
   if(!PX.BEAST_KINDS.includes(k)||PX.BEAST_DEATHS[k]!==PX.BEAST_DEATHS[u]||!PX._beastFit(k).ok)bad.push(k+' figure');
   const a=PX.beast(u,{pose:0,team:1}),c=PX.beast(k,{pose:0,team:1});if(!c||c.width!==a.width||c.height!==a.height||c.toDataURL()===a.toDataURL())bad.push(k+' colours');
   if(!PX.beastMap(k,0)||PX.beastMap(k,0).toDataURL()===PX.beastMap(u,0).toDataURL())bad.push(k+' map');
   if(!t.MATS[t.monRec(b.kind,k).mat])bad.push(k+' trophy');
   if(t.RESIST[k]!==(b.resist||t.RESIST[u])||t.UNIT_DT[k]!==(b.dt||t.UNIT_DT[u])||t.BEAST_TACTICS.kinds[k]!==t.BEAST_TACTICS.kinds[u]||t.PHYSICS.mass.kinds[k]!==t.PHYSICS.mass.kinds[u]||t.MOVESETS.kinds[k]!==t.MOVESETS.kinds[u])bad.push(k+' tables');
   if(!t.NamedPortraits.unit(k)||t.NamedPortraits.unit(k)!==t.NamedPortraits.unit(u))bad.push(k+' portrait')}
  ok(!bad.length,'every breed: its fighter, its figure in its own colours (battle and map), its trophy, its kind\'s tables and portrait'+(bad.length?': '+bad.join(', '):''))}
 ok(ST.ember_slime.bolt!==ST.slime.bolt&&t.UNIT_DT.ember_slime==='fire'&&t.RESIST.ember_slime.fire<1&&t.RESIST.frost_slime.frost<1&&t.RESIST.frost_troll.fire>t.RESIST.troll.fire,'their own: an ember slime spits fire and shrugs it off, a frost troll burns the more');
 // ---- the slime: no eyes (the owner, 2026-11-12); its gloss and its spitting mouth kept
 {const px=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<d.length;i+=4)if(d[i+3])s.add((d[i]<<16|d[i+1]<<8|d[i+2]).toString(16).padStart(6,'0'));return s};
  const eyes=['1e1a24','e8f0e8'],f=[0,1,2,3,PX.BEAST_DEAD,PX.BEAST_DEAD+1,PX.BEAST_DEAD+2].flatMap(p=>[...px(PX.beast('slime',{pose:p,team:1,v:1}))]);
  ok(!eyes.some(e=>f.includes(e)),'a slime has no eyes, standing, walking or dead');ok(px(PX.beast('slime',{pose:7,team:1})).has('3a2430'),'its mouth opens as it spits')}
 // ---- a lair's breed: by its ground, by a hash (no draw), its kind's own on its kind's ground too; none with the switch off
 {const r=Math.random;let n=0;const seen={};try{Math.random=()=>{throw Error('a breed rolled Math.random')};
   for(let i=0;i<400;i++){const b=t.breedAt('slime',100+i*37,200+i*53,['frost']);if(b!=='frost_slime')n++;const c=t.breedAt('slime',100+i*37,200+i*53,['swamp']);seen[c||'slime']=1;const d=t.breedAt('troll',90+i*41,70+i*29,['frost']);seen[d||'troll']=1}}finally{Math.random=r}
  ok(!n&&seen.slime&&!seen.frost_slime&&seen.troll&&seen.frost_troll,'a slime in the frost is a frost slime; one in the swamp its kind\'s own; a troll in the frost either: '+Object.keys(seen).join(', '));
  ok(t.lairWhere('slime').includes('desert')&&t.lairWhere('slime').includes('frost'),'slimes may lair in the frost and the desert now (their breeds\')');
  MB.on=false;try{ok(t.breedAt('slime',10,10,['frost'])===null&&t.lairWhere('slime').join()===t.MONSTERS.slime.where.join(),'switched off: no breeds, every kind on its own ground')}finally{MB.on=true}}
 // ---- a breed's lair on the map: its fighters, name, figure, save, loot, xp and encounter its own
 {const m=t.asMonster({id:'troll',breed:'frost_troll',x:t.P.x+60,y:t.P.y,hx:t.P.x+60,hy:t.P.y,lv:1,n:2,t:0,a:0,cool:0}),plain=t.asMonster({id:'troll',x:t.P.x+60,y:t.P.y,hx:t.P.x+60,hy:t.P.y,lv:1,n:2,t:0,a:0,cool:0});
  ok(m.troops.join()==='frost_troll,frost_troll'&&m.tc.frost_troll===2&&m.power()>plain.power(),'its fighters frost trolls, the stronger: '+m.troops.join(', '));
  ok(/Frost troll/.test(m.tip())&&m.label()==='Frost troll','named its own: "'+m.label()+'"');
  const back=t.asMonster(t.unpackRec(t.packRec(m,t.MON_KEYS,['pw','t','a']),t.MON_KEYS,{t:0,a:0}));ok(back.breed==='frost_troll'&&back.troops[0]==='frost_troll','its breed kept in a save');
  ok(m.removeAny(1)[0]==='frost_troll'&&m.n===1,'its losses frost trolls');
  ok(t.monsterXp(plain,['troll'])<t.monsterXp(m,['frost_troll']),'it pays its own xp');
  const s=t.monsterMapSprite('troll',0,false,'frost_troll');ok(s&&s.toDataURL()!==t.monsterMapSprite('troll',0).toDataURL(),'its own figure on the map');
  const e=t.asMonster({id:'slime',breed:'ember_slime',x:t.P.x+40,y:t.P.y,hx:t.P.x+40,hy:t.P.y,lv:1,n:3,t:0,a:0,cool:0}),j=t.invCount('mat','ember');t.monsterLoot(e,['ember_slime','ember_slime']);ok(t.invCount('mat','ember')===j+2,'ember slimes leave ember jelly');
  t.startMonster(e);ok(t.G.enc.list.every(k=>k==='ember_slime')&&/Ember slimes/.test(document.getElementById('panel').textContent),'meeting them: ember slimes, by name');t.G.enc=null;t.G.mode='world';t.hidePanel()}
 // ---- spawned: the production path gives a slime in the frost its breed
 {const w=Object.fromEntries(Object.entries(t.MONSTERS).map(([k,v])=>[k,v.w])),before=t.W.monsters.length;
  try{for(const [k,M] of Object.entries(t.MONSTERS))M.w=k==='slime'?1:0;for(let i=0;i<12;i++)t.spawnMonster(true);const born=t.W.monsters.slice(before),by={};for(const m of born)by[m.breed||'slime']=(by[m.breed||'slime']||0)+1;
   ok(born.length&&born.every(m=>m.id==='slime'&&(!m.breed||t.MONSTER_BREEDS.kinds[m.breed].kind==='slime')&&m.troops.every(k=>k===(m.breed||'slime'))),'spawned slimes: '+JSON.stringify(by))}
  finally{for(const [k,v] of Object.entries(w))t.MONSTERS[k].w=v;t.W.monsters.length=before}}
 // ---- in battle: their own stats, their kind's tactics
 {try{t.BattleLab.start({leftGroups:[{type:'militia',count:4}],rightGroups:[{type:'ice_bear',count:1},{type:'bear',count:1}],seed:3,deploy:false,paused:true,ai:true});
   const B=t.B,a=B.units.find(u=>u.type==='ice_bear'),b=B.units.find(u=>u.type==='bear');ok(a&&b&&a.max>b.max&&t.beastKind(a.grp)?.way===t.beastKind(b.grp)?.way,'an ice bear fights: tougher than a bear, as a bear does');
   t.BattleLab.step(30);ok(t.actorSprite(a,0)&&t.corpseOf(a).down,'drawn, and it can fall')}
  finally{if(t.BattleLab.active)t.BattleLab.exit()}}
 info('breeds: '+ids.map(k=>MB.kinds[k].n+' ('+MB.kinds[k].where.join('/')+')').join('; '));
});
