'use strict';
// The soldiers' picks, found faster and the same (battle/actors.js nearestSeen, nearWithin; terrain.js BattleSight shown; a code
// review's measure, 2026-11-11): a soldier with no foe in sight sifted the whole battle every frame, and one sent at a foe looked
// over the whole field for the foe right on top of him. Both now look at fewer and must pick exactly as before: here each is
// set against the old rule, written out again below, for every soldier through a fogged fight on ground with woods and rises, the
// grid open and shut, routers among them.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,keep={};for(const k of ['TERRAIN','FOG','BEAST_TACTICS','PHYSICS','DISMOUNT','DEFENCE','JOSTLE','FIELD_SIZES','EXITS','COMMAND_POWERS'])keep[k]=t[k].on;const wb0=t.WORLD_BATTLE.on;
 try{
  for(const k in keep)t[k].on=true;t.WORLD_BATTLE.on=false;Kit.begin('soldier',4);Kit.clear();Kit.world();const r=t.partyRoster(P);r.add('archer',10);r.add('militia',14);r.add('spearman',10);r.add('horse',6);
  const kinds=['archer','militia','spearman','horse','militia','spearman','archer','militia'],enemies=[];for(let i=0;i<40;i++)enemies.push(kinds[i%kinds.length]);
  G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:enemies,allies:[],foes:[]};t.startBattle({enemies,tournament:false});Kit.engage();const b=t.B;b.auto=true;b.noMorale=true;// (no one breaks by himself: the fight goes on, and the routers below are made)
  ok(!!b.sight&&!!b.fog&&!!b.terrain,'a fogged fight on real ground ('+b.units.length+' soldiers)');
  // (the old rules: the nearest of all, then, he unseen, the whole battle sifted; the foe on top of him by the nearest of all)
  const oldSeen=u=>{const n=t.nearest(u);if(!n||t.seenBy(u.team,n))return n;let best=null,bd=1e9;
   for(const e of b.units){if(e.hp<=0||!t.battleEnemy(e,u)||!t.ArmyTactics.local(u,e)||!t.seenBy(u.team,e))continue;const d=((e.x-u.x)**2+(e.y-u.y)**2)*(e.rout?9:1);if(d<bd){bd=d;best=e}}return best};
  const onTop=(n,u,c)=>n&&!n.rout&&Math.hypot(n.x-u.x,n.y-u.y)<c?n:null;
  let n=0,bad=0,none=0,found=0,empty=0,tops=0,badTop=0,first='';
  const check=open=>{if(open)t.spatialOpen();try{for(const u of b.units){if(u.hp<=0)continue;n++;
     const a=t.nearestSeen(u),o=oldSeen(u);if(a!==o){bad++;first=first||'nearestSeen '+u.id+' at '+b.t.toFixed(1)}if(o)found++;else none++;if(!b.sight.shown(u.team).length)empty++;
     for(const c of [19,30,60]){const x=onTop(t.nearWithin(u,c),u,c),y=onTop(t.nearest(u),u,c);if(x!==y){badTop++;first=first||'nearWithin '+u.id+' r '+c+' at '+b.t.toFixed(1)}if(y)tops++}}}finally{if(open)t.spatialClose()}};
  for(let f=0;f<900&&!b.over;f++){t.updateBattle(1/30);if(f%6===0){check(true);if(f%30===0)check(false)}
   // (now and then a few made to rout where they stand, so routers stand among the fighting)
   if(f===240||f===420){let k=0;for(const u of b.units)if(u.hp>0&&!u.rout&&!u.hero&&k++%6===0)u.rout=true}}
  info(n+' soldiers looked at to '+b.t.toFixed(0)+' s: a foe found '+found+', none '+none+' (no one shown to his side '+empty+'); a foe on top of him '+tops);
  ok(found>200&&none>200&&empty>50&&tops>100,'the fight gives each case: a foe in sight, none, no one shown at all, a foe right on top');
  ok(bad===0,'nearestSeen picks as the old sifting did, every time'+(first?' (first: '+first+')':''));
  ok(badTop===0,'the foe on top of him: nearWithin gives what the nearest of all gave, every time');
  // (the shown list follows who is hidden: made again at a reckoning and when a blow shows its striker)
  {const S=b.sight,v=S.hv,a=b.units.find(u=>u.team===1),d=b.units.find(u=>u.team===0);if(a&&d){a.hid|=1;S.hv++;const was=S.shown(0).includes(a);S.struckBy(a,d);ok(!was&&S.shown(0).includes(a)&&S.hv>v,'a hidden soldier who strikes is shown at once: the list made again')}}
 }finally{for(const k in keep)t[k].on=keep[k];t.WORLD_BATTLE.on=wb0;t.B=null;t.fieldDone&&t.fieldDone()}
});
