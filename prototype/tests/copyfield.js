'use strict';
// A fight met on the map fought on a field of its own, copied from the map there (the owner, 2026-11-26: "create a copy version of the
// area and battle in a separate map", "I want style 2"; battle/copyfield.js COPY_FIELD, CopyField, CopyBattleSetup; worldbattle.js
// worldGrid): behind its switch (PREFS.copyfield); the field's size by its soldiers, the map round the fight's middle in its grid
// (woods, rock, water, roads, the holdings' buildings where they stand), its height from its lowest ground, no man on rock or deep
// water; the world waits while it is fought; it ends as a field battle does, back on the map.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',51);G.paused=false;G.speed=1;t.GUIDE.on=false;
 const h=t.TOWNS.find(x=>!x.gone&&x.lots&&x.lots.length>3);P.x=h.x+70;P.y=h.y+30;const home={x:P.x,y:P.y};
 const fight=copy=>{t.prefSet('copyfield',copy);G.mode='world';G.modal=false;P.x=home.x;P.y=home.y;P.troops={hum_levy:12,hum_bow:6};
  const e=t.asParty({kind:'bandits',troops:Array(12).fill('militia'),x:P.x-30,y:P.y,cool:0});W.parties.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};
  t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});return{B:t.B,e}};
 try{
  // (off: on the map, as ever)
  {const {B}=fight(false);ok(!!B&&!!B.world,'switched off: the fight is on the map');t.BattleSetup.undo();G.mode='world'}
  // (on: a field of its own, the map round the fight's middle copied into it)
  const {B,e}=fight(true),T=B&&B.terrain,c=T&&T.copy;ok(!!B&&!B.world&&!!c&&c.s===t.COPY_FIELD.scale,'switched on: a field of its own, copied from the map ('+t.BW+' x '+t.BH+' px, '+Math.round(t.BW/c.s)+' x '+Math.round(t.BH/c.s)+' world px)');
  const m=t.fightArea(G.enc);ok(Math.abs(c.x0+t.BW/2/c.s-m.x)<1&&Math.abs(c.y0+t.BH/2/c.s-m.y)<1,'the window round the fight\'s middle on the map');
  // (each cell from the tile under it: a forest's woods, a mountain's rock, open water deep or wadeable)
  let bad=0,n=0;for(let r=0;r<T.R;r++)for(let q=0;q<T.C;q++){const x=c.x0+(q+.5)*T.cs/c.s,y=c.y0+(r+.5)*T.cs/c.s,k=t.tAt(Math.floor(x/t.TILE),Math.floor(y/t.TILE)),K=T.kind[r*T.C+q];
   if(k===t.T_MOUNT){n++;if(K!==t.TKIND.rock)bad++}else if(k===t.T_FOREST&&t.drawnDepth(x,y)<=0){n++;if(K!==t.TKIND.wood&&!(T.built&&T.built[r*T.C+q]))bad++}else if(k===t.T_ROAD){n++;if(!T.road[r*T.C+q])bad++}}
  ok(!bad,'each cell the tile under it ('+n+' woods, rock and road cells checked, '+bad+' off)');
  ok(Math.min(...T.lvl)===0,'its height from its lowest ground');
  // (the map's roads and the holding's buildings, where they stand)
  const hs=T.recipe.built?T.recipe.built.houses:[];ok(hs.length>0&&hs.every(q=>q.s===t.COPY_FIELD.hs),'the holding\'s buildings where they stand ('+hs.length+')');
  if(T.road.some(v=>v))ok(T.recipe.ways.length>0,'the map\'s roads painted on it ('+T.recipe.ways.length+' ways)');
  // (no man on rock or deep water)
  ok(B.units.every(u=>!T.solid||!T.solid[t.tIx(T,u.x,u.y)]),'no man set down on rock or deep water');
  // (the world waits; it ends as a field battle does)
  const day=G.day,clock=G.clock;B.ready=true;B.paused=false;for(let i=0;i<120;i++)t.updateBattle(1/60);ok(G.day===day&&G.clock===clock,'the world waits while it is fought');
  for(const u of B.units)if(u.team)u.hp=0;for(let i=0;i<900&&t.B===B;i++)t.updateBattle(1/60);ok(t.B!==B&&!W.parties.includes(e),'won: the field gone, their band gone from the map ('+G.mode+')');
 }finally{t.prefSet('copyfield',false)}
 ok(!ERR.length,'no runtime errors')});
