'use strict';
// Wildlife as battle figures (engine/wildlife.js, gfx/sprites.js wildKind; data/critters.js WILD_ART; the owner, 2026-11-12: "make wildlife
// sprite a battle sprite too"): every animal hunted or kept has its figure, in the beasts' style, at its real size beside a man;
// walking, running and its three deaths each drawn; a hunt's animal drawn by it; off, its map figure as before.
Kit.suite(({ok,info})=>{const t=T,PX=t.PX;Kit.begin('soldier');
 const ids=Object.keys(t.CRITTERS),kind=id=>'w_'+(t.CRITTERS[id].look||id);
 ok(ids.every(id=>PX.WILD_KINDS.includes(kind(id))),'every animal has its battle figure ('+ids.length+': '+PX.WILD_KINDS.map(k=>k.slice(2)).join(', ')+')');
 {const bad=[];for(const k of PX.WILD_KINDS){const f=PX._beastFit(k);if(!f.ok)bad.push(k+' fit');if(PX.BEAST_DEATHS[k].length<3)bad.push(k+' deaths');
   const key=p=>PX.beast(k,{v:0,pose:p,team:1}).toDataURL(),d=[0,1,2].map(i=>key(PX.BEAST_DEAD+i));if(new Set(d).size<3)bad.push(k+' deaths alike');if(key(0)===key(3)||key(3)===key(16))bad.push(k+' poses alike')}
  ok(!bad.length,'each fits its canvas in every pose, walks, runs and dies three ways'+(bad.length?': '+bad.join(', '):''))}
 // ---- a camel shaded brown, never red (the owner, 2026-11-13: "fix the sprites in pasture": the made ramp's shade turned its sandy
 // coat red), and its pens 4, 6, 8 tiles a level
 {let red=0,all=0;for(const v of [0,1,2]){const c=PX.beast('w_camel',{v,pose:0,team:1}),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   for(let i=0;i<d.length;i+=4)if(d[i+3]){all++;if(d[i]>d[i+1]*1.5&&d[i]>90)red++}}
  ok(all>0&&red===0,'a camel\'s coats shaded brown: '+red+' red pixels of '+all);
  ok([1,2,3].map(lv=>t.PLOTS_AT.pasture(lv)).join()==='4,6,8'&&t.PLOTS.pasture===8,'a pasture\'s pen 4, 6, 8 tiles a level (was 2, 3, 4)')}
 // ---- its size beside a man's: a deer's head about a man's, a cow long and low, a rabbit small
 {const top=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3])return c.height-y;return 0};
  const man=top(t.unitSprite('hum_spear',1,false,0,0)),h=k=>top(PX.beast(k,{v:0,pose:0,team:1}));
  ok(h('w_deer')>man*.7&&h('w_deer')<=man+6&&h('w_rabbit')<=man*.55&&h('w_hen')<=man*.65&&h('w_camel')>h('w_cow'),'at its real size: a man '+man+' px tall, a deer '+h('w_deer')+', a cow '+h('w_cow')+', a camel '+h('w_camel')+', a rabbit '+h('w_rabbit')+', a hen '+h('w_hen'))}
 // ---- in a hunt: its unit drawn by its figure, its deaths the beasts'; off, its map figure
 {const id='deer',key='wild_'+id;if(!t.ST[key])t.ST[key]={n:'Deer',hp:20,dmg:0,spd:40,reach:2,range:0,cd:1,tier:1,beast:true,wildlife:id,arm:0};
  const u={type:key,team:1,id:7,v:0,s:t.ST[key]},s=t.unitSprite(key,1,false,0,0),m=t.critterSprite(id,0);
  ok(t.wildKind(key)==='w_deer'&&s.width>=32&&s.height>=32&&s.toDataURL()!==m.toDataURL(),'a hunted deer drawn by its battle figure ('+s.width+'x'+s.height+'), not its map one ('+m.width+'x'+m.height+')');
  const D=t.deathOf(u);ok(D&&D.down&&t.PX.BEAST_DEATHS.w_deer.includes(D.name),'it dies as the beasts do: '+D.name);
  // (on the map too: the same figure, at the marchers' scale; the owner, 2026-11-12: "the sprite in world map should be the same as battle")
  {const A=t.critterArt(id,0,0),B0=t.unitSprite(key,1,false,0,0),k=t.WORLD_BATTLE.sprite/t.WORLD_BATTLE.scale;ok(A.s===B0&&A.k===k&&A.w>0&&A.h>0,'on the map the same figure as in its hunt, at the marchers\' scale ('+k+'): '+A.w+'x'+A.h+' px');
   ok(t.critterArt(id,3,0).s!==A.s,'and walking there as it walks in battle')}
  t.WILD_ART.on=false;try{ok(t.wildKind(key)===null&&t.unitSprite(key,1,false,0,0).width<32&&t.critterArt(id,0,0).s===t.critterSprite(id,0),'off: its map figure, on the map and in its hunt, as before')}finally{t.WILD_ART.on=true}}
});
