'use strict';
// Workplaces stand where they make sense (the owner's play-test, 2026-10-23: a mine in a forest clearing, nowhere near ore: "I don't
// want mine or any other buildings to spawn or build in the area that is not relevant to them"). One table, data/economy.js
// ESTATE_LAND, says what each place of work needs of its land, for whether a holding has one (buildings.js canHave) and where it
// stands (lots.js lotFits, landFits). Over the classic world and Normal s1-s4: every mine at the rock (ESTATE_LAND.mine.rock of its
// tiles on a hill or beside a mountain) with an ore vein of its land within reach; every mine and quarry with its back to the rock;
// every quarry at the rock; every lumber camp in the woods; every farm and its fields on fertile ground (not the desert's dry sand);
// every pasture on grass or hills. No mine without ore, and no ore brought up from nothing (resources.js resOut); a holding with no
// ore in its land has no mine, is never offered one, and the Fief greys it with the reason. Pasture herds by their land
// (data/critters.js PASTURE_HERD): a desert pasture keeps goats or camels, a frost one reindeer or sheep. Camels, water buffalo and
// kept reindeer are drawn. INFO per world: how many holdings have each workplace; and the herds by land.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,KS=['farm','pasture','lumber','mine','quarry','port'],EL=t.ESTATE_LAND;
 const worlds=[['classic',null],...[1,2,3,4].map(k=>['Normal s'+k,{preset:'normal',seed:'s'+k}])];
 const rockAt=(x,y)=>t.tAt(x,y)===t.T_HILL||[-1,0,1].some(b=>[-1,0,1].some(a=>t.tAt(x+a,y+b)===t.T_MOUNT));
 const tilesOf=l=>{const a=[];t.lotTiles(l,(x,y)=>a.push([x,y]));return a};
 const herdsBy={};let noOre=null,camels=0;
 for(const [name,S] of worlds){
  t.begin('soldier',S||undefined);G.quietEvents=true;const TW=t.TOWNS,bad={},no=(k,m)=>(bad[k]=bad[k]||[]).push(m);
  info(name+': '+TW.length+' holdings; '+KS.map(k=>k+' '+TW.filter(z=>t.bldLv(z,k)).length).join(', '));
  for(const z of TW)for(const k of KS){const l=t.lotAt(z,k);if(!l||!t.bldLv(z,k))continue;const T0=tilesOf(l),at=z.name+' '+l.x+','+l.y,pl=l.plots||[];
   if(k==='mine'||k==='quarry'){const r=T0.filter(([x,y])=>rockAt(x,y)).length;if(r<EL[k].rock*T0.length)no(k,at+' '+r+'/'+T0.length+' at the rock')}
   if(k==='mine'){const R=EL.mine.ore,near=t.DEPOSITS.some(d=>d.kind==='ore'&&(d.home===z.name||Math.hypot(d.tx-z.tx,d.ty-z.ty)<=t.RES_RANGE)&&d.tx>=l.x-R&&d.tx<l.x+l.n+R&&d.ty>=l.y-R&&d.ty<l.y+l.n+R);if(!near)no(k,at+' no ore of its land near')}
   if(EL[k].face){const want=t.rockYaw(l);if(want!=null&&l.yaw!==want)no('facing',at+' '+k+' faces '+l.yaw+', its back to the rock is '+want)}
   if(k==='lumber'){const was=t.trackWas();let w=0;for(let j=-1;j<=l.n;j++)for(let i=-1;i<=l.n;i++)if(t.kindWas(was,l.x+i,l.y+j)===t.T_FOREST)w++;if(w<EL.lumber.wood*(l.n+2)*(l.n+2))no(k,at+' '+w+' wooded tiles')}
   if(k==='farm'){const F=T0.concat(pl).filter(([x,y])=>!t.fertileAt(x,y)).concat(pl.filter(([x,y])=>t.tAt(x,y)!==t.T_OPEN));if(F.length)no(k,at+' '+F.length+' tiles not fertile open ground')}
   if(k==='pasture'){const F=T0.filter(([x,y])=>![t.T_OPEN,t.T_HILL].includes(t.tAt(x,y))).concat(pl.filter(([x,y])=>t.tAt(x,y)!==t.T_OPEN));if(F.length)no(k,at+' '+F.length+' tiles not grass or hills')}}
  const say=k=>bad[k]?': not '+bad[k].slice(0,4).join('; '):'';
  ok(!bad.mine,name+': every mine at the foot of the hills or mountains ('+EL.mine.rock*100+'% of its tiles), an ore vein of its land within '+EL.mine.ore+' tiles'+say('mine'));
  ok(!bad.facing,name+': every mine and quarry with rock to one side turns its back to it'+say('facing'));
  ok(!bad.quarry,name+': every quarry at the rock'+say('quarry'));
  ok(!bad.lumber,name+': every lumber camp in the woods ('+EL.lumber.wood*100+'% of the tiles in and round it wooded, as the land lay before the estates’ tracks)'+say('lumber'));
  ok(!bad.farm,name+': every farm and its fields on fertile open ground'+say('farm'));
  ok(!bad.pasture,name+': every pasture on grass or hills'+say('pasture'));
  // no mine without ore, nor ore from nothing
  {const m=TW.filter(z=>t.bldLv(z,'mine')),none=TW.filter(z=>!t.resHas(z,'ore').length);
   ok(m.every(z=>t.resHas(z,'ore').length&&Object.keys(t.resOut(z,'mine')).every(g=>t.resOf(z)[g])),name+': every mine ('+m.length+') digs the ores of its own land, nothing else');
   ok(none.every(z=>!t.bldLv(z,'mine')&&!t.canHave(z,'mine')&&!t.bldCap(z,'mine')&&!Object.keys(t.resOut(z,'mine')).length),name+': no holding without ore in its land ('+none.length+') has a mine, may build one, or brings up ore from nothing');
   if(!noOre&&none.length)noOre=[name,S,none[0].name]}
  // the pastures' herds, by their land
  for(const z of TW){const c=t.herdOf(z);if(!c||!c.pen||!t.bldLv(z,'pasture'))continue;const land=t.pastureLand(z);(herdsBy[land]=herdsBy[land]||[]).push(c.id);if(c.id==='camel')camels++}}
 {const lands=Object.keys(herdsBy);
  info('pasture herds by land, over the five worlds: '+lands.map(land=>land+' '+[...new Set(herdsBy[land])].map(id=>id+' '+herdsBy[land].filter(x=>x===id).length).join(' ')).join('; '));
  ok(lands.length>=4&&lands.every(land=>herdsBy[land].every(id=>t.PASTURE_HERD[land].includes(id))),'every pasture keeps its land’s animals ('+lands.length+' lands)');
  ok((herdsBy.desert||[]).every(id=>id==='goat'||id==='camel')&&(herdsBy.frost||[]).every(id=>id==='tamereindeer'||id==='sheep')&&(herdsBy.swamp||[]).every(id=>id==='pig'||id==='buffalo'),'a desert pasture keeps goats or camels, a frost one reindeer or sheep, a swamp one pigs or water buffalo');
  ok(camels>0,'camels graze in some desert pasture ('+camels+')')}
 // the land decides, the people's taste only tips it: each people there keeps that land's animals, the same every time
 {const z=t.TOWNS.find(q=>t.bldLv(q,'pasture')),r0=z.races,seen={};
  for(const race of ['human','dwarf','elf','orc']){z.races=[race];seen[race]=t.pastureHerd(z)}z.races=r0;
  ok(Object.values(seen).every(id=>t.PASTURE_HERD[t.pastureLand(z)].includes(id))&&t.pastureHerd(z)===t.pastureHerd(z),z.name+' ('+t.pastureLand(z)+'): whoever lives there keeps that land’s animals: '+JSON.stringify(seen))}
 // a camel pasture makes milk and hides (furs), a buffalo one milk and meat: the pasture's day is its herd's
 {const z=t.TOWNS.find(q=>t.bldLv(q,'pasture')),keep=window.pastureHerd;
  try{for(const id of ['camel','buffalo']){window.pastureHerd=()=>id;const m=t.estateOf(z,'pasture').makes();ok(m===t.CRITTERS[id].make&&m.milk>0&&(id==='camel'?m.furs>0:m.meat>0)&&!m.wool,'a pasture of '+t.CRITTERS[id].n.toLowerCase()+' makes '+Object.keys(m).join(', '))}}
  finally{window.pastureHerd=keep}
  ok(t.estateOf(z,'pasture').makes()===(t.CRITTERS[t.pastureHerd(z)].make||t.MAKE.pasture.out),'the others make what pastures always made')}
 // a holding with no ore: never offered a mine, greyed in the Fief with the reason, no spot for one by hand
 if(noOre){t.begin('soldier',noOre[1]||undefined);G.quietEvents=true;const z=t.townBy(noOre[2]);z.owner='player';P.gold=99999;t.ensureEcon(z);Object.assign(z.stock,{timber:500,stone:500,tools:100});z.work=null;
  const row=t.estateRow(z,'mine');ok(/No ore in this land/.test(row)&&/data-arg="mine" disabled/.test(row),noOre[0]+': '+z.name+' (no ore in its land): the Fief greys the mine, “No ore in this land”');
  t.buildAct(z,'mine');ok(!z.work&&!t.bldLv(z,'mine'),'and an order to build one there starts nothing');
  const n=t.lotSize(t.ESTATE_LOT.mine);let fits=0;for(let y=z.ty-16;y<=z.ty+16;y++)for(let x=z.tx-16;x<=z.tx+16;x++)if(t.placeOk(z,'mine',x,y,n))fits++;
  ok(!fits,'no spot of its land takes one placed by hand')}
 else info('every holding of the five worlds has ore in its land');
 // camels, water buffalo and kept reindeer: drawn as the herds are, a camel and a buffalo as big as a cow
 {const look=id=>{const c=t.critterSprite(id),b=t.opaqueBox(c);let n=0;const d=c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,c.width,c.height).data;for(let j=3;j<d.length;j+=4)if(d[j])n++;return {n,cell:c.width,w:b[2]-b[0]+1,h:b[3]-b[1]+1}};
  const q={};for(const id of ['camel','buffalo','tamereindeer','cow'])q[id]=look(id);
  ok(['camel','buffalo','tamereindeer'].every(id=>q[id].n>=30&&q[id].cell===16)&&q.camel.w>=q.cow.w-1&&q.buffalo.w>=q.cow.w-1&&t.critterSprite('camel',1)!==t.critterSprite('camel',0),'camels, water buffalo and reindeer are drawn in 16 cells, walking ('+['camel','buffalo','tamereindeer'].map(id=>id+' '+q[id].w+' x '+q[id].h).join(', ')+'; a cow '+q.cow.w+' x '+q.cow.h+')')}
});
