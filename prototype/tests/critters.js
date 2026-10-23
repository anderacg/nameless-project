'use strict';
// Food and critters: the band eats any food (perishables first), fresh food spoils, variety lifts morale; wild game lives in
// its biomes, bolts and tires, and hunting it gives meat and trophies; livestock lives in its holding's pasture, drawn with it inside
// its fence, never met, clicked or sold.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const panel=()=>document.getElementById('panel').innerHTML;
 const empty=()=>{P.inv=Array(t.invCap()).fill(null)};
 t.act('begin','soldier');
 // food
 ok(t.FOODS.length===8&&t.FOODS.every(g=>t.GOODS[g].food)&&t.FOODS[0]==='milk'&&['grain','cheese'].includes(t.FOODS[7]),'eight foods (salmon and eel only where they are caught), most perishable eaten first: '+t.FOODS.join(', '));
 empty();t.invAdd('good','grain',10);t.invAdd('good','milk',3);t.invAdd('good','meat',4);
 ok(t.foodN()===17&&t.foodKinds()===3,'food counts every kind');t.foodTake(5);ok(t.goodN('milk')===0&&t.goodN('meat')===2&&t.goodN('grain')===10,'milk goes first, then meat, grain last');
 // (it eats by the hour: world/supply.js; it drinks too: water given with the food, since the skins fill only by the frame, timed,
 // and only empty ones: SKINS)
 const day=()=>{t.supplyMoved();for(let h=0;h<24;h++)t.supplyHour()};
 empty();t.invAdd('good','meat',8);t.invAdd('good','water',10);P.troops={militia:7};P.morale=60;const eat=t.eatPerDay();day();
 ok(t.goodN('meat')<=8-eat&&P.morale>=52,'a band with only meat eats it, no hunger ('+t.goodN('meat')+' left)');
 empty();t.invAdd('good','water',10);P.morale=60;day();ok(P.morale<=52,'no food of any kind: the band goes hungry');
 empty();t.invAdd('good','milk',20);t.invAdd('good','cheese',20);P.troops={};let m0=t.goodN('milk');for(let i=0;i<5;i++)t.dayTick();
 ok(t.goodN('milk')<m0-6&&t.goodN('cheese')===20,'milk spoils, cheese keeps ('+m0+' → '+t.goodN('milk')+' milk)');
 empty();['grain','cheese','fruit','meat'].forEach(g=>t.invAdd('good',g,20));P.morale=50;t.dayTick();ok(P.morale>=52,'four kinds of food lift morale (+'+(P.morale-50)+')');
 t.updateHUD(true);ok(/title="Food: /.test(document.getElementById('stats').innerHTML)&&!/title="Grain/.test(document.getElementById('stats').innerHTML),'the HUD shows Food');
 ok(t.TOWNS.filter(x=>x.mod).every(x=>t.FOODS.filter(g=>!t.GOODS[g].res).every(g=>x.mod[g]>0)),'every market prices every common food (regional fish go by what is caught)');
 const fishy=t.TOWNS.find(x=>x.style==='port');ok(fishy.mod.fish<.9,fishy.name+' sells fish cheap');
 // wild game
 const wild=W.critters.filter(c=>!c.home),herds=W.critters.filter(c=>c.home);
 ok(wild.length>=t.density(t.WM).critterStart&&wild.length<=t.density(t.WM).critterCap,'wild herds roam ('+wild.length+'): '+[...new Set(wild.map(c=>c.id))].join(', '));
 ok(wild.every(c=>t.CRITTERS[c.id].where.some(w=>t.habitatAt(c.hx,c.hy).includes(w))),'each in its own biome');
 const kinds=new Set();for(let i=0;i<300;i++){W.critters=[];t.spawnCritter(true);if(W.critters[0])kinds.add(W.critters[0].id)}
 ok(['rabbit','deer','stag','ibex','reindeer','hare','gazelle','fowl'].every(k=>kinds.has(k)),'every wild kind turns up somewhere');
 W.critters=[];t.initCritters();
 ok(herds.length===t.TOWNS.filter(x=>x.kind!=='castle').length&&herds.every(c=>{const z=t.townBy(c.home);return c.pen?t.PASTURE_HERD[t.pastureLand(z)].includes(c.id):t.LIVESTOCK[z.races[0]].includes(c.id)}),'every village and town has a herd: a pasture’s of its land’s animals (workplaces), else of its people’s livestock');
 // fleeing and tiring
 const deer={crit:true,id:'deer',x:0,y:0,hx:0,hy:0,n:3,t:0,a:0,dir:1,tire:0,cool:0};const spot=W.critters.find(c=>!c.home);deer.x=deer.hx=spot.x;deer.y=deer.hy=spot.y;
 W.critters=[deer];P.x=deer.x-30;P.y=deer.y;G.mode='world';G.modal=false;G.encCool=0;t.hidePanel();
 const d0=Math.hypot(deer.x-P.x,deer.y-P.y);t.updateCritters(.1);ok(Math.hypot(deer.x-P.x,deer.y-P.y)>d0,'deer bolt when you come close');
 deer.tire=5;const x1=deer.x;t.updateCritters(.1);const fresh=Math.abs(deer.x-x1);ok(fresh<t.CRITTERS.deer.spd*.1*.5,'and slow down once tired');
 // hunting
 empty();P.troops={hum_bow:8};P.sk.hunt.lv=3;const xp=P.xp+P.level*1000;deer.x=P.x+5;deer.y=P.y;deer.n=3;deer.cool=0;t.updateCritters(.01);
 const killed=3-(W.critters.includes(deer)?deer.n:0);ok(killed>=3&&t.goodN('meat')===killed*4,'8 bows and Hunting 3 bring down '+killed+' deer for '+t.goodN('meat')+' meat');
 ok(!W.critters.includes(deer),'a herd hunted out is gone');
 const rab={crit:true,id:'rabbit',x:P.x+5,y:P.y,hx:P.x,hy:P.y,n:4,t:0,a:0,dir:1,tire:0,cool:0};W.critters=[rab];P.troops={};P.sk.hunt.lv=0;
 let lone=0;for(let i=0;i<20;i++){P.sk.hunt={lv:0,xp:0};rab.n=4;rab.cool=0;rab.x=P.x+5;rab.y=P.y;if(!W.critters.includes(rab))W.critters.push(rab);const b=t.goodN('meat');t.updateCritters(.01);lone=Math.max(lone,t.goodN('meat')-b)}
 ok(lone>=1&&lone<=2,'alone, you catch one or two rabbits at a time');
 // chase
 const stag={crit:true,id:'stag',x:P.x+40,y:P.y,hx:P.x+40,hy:P.y,n:1,t:0,a:0,dir:1,tire:0,cool:0};W.critters=[stag];G.chase=stag;t.updateWorld(.05);ok(P.tx===stag.x||G.chase===stag,'clicking a critter chases it');G.chase=null;P.tx=null;
 // livestock
 // (a holding with a pasture and its herd: Ashford, else the first that has them (a generated world lays its estates its own way))
 W.critters=[];t.initCritters();empty();P.gold=500;const ash=[t.townBy('Ashford'),...t.TOWNS].find(x=>x&&t.fieldsOf(x,'pasture')&&t.herdOf(x)),cow=t.herdOf(ash);cow.id='cow';cow.n=4;cow.x=P.x=ash.x+60;cow.y=P.y=ash.y+40;cow.cool=0;G.mode='world';G.modal=false;G.encCool=0;t.hidePanel();
 // (a pasture's herd is only to be seen: walking into it opens nothing, a click on its fields picks the pasture, whose herders trade;
 // clicked from beside the fields: a pasture may lie farther from its holding than you see)
 t.updateCritters(.01);ok(G.mode==='world'&&cow.decor,'walking into a pasture\'s herd opens nothing (it is only to be seen)');
 {const F=t.fieldsOf(ash,'pasture'),at=t.fieldSpot(F);P.x=at.x+20;P.y=at.y;const o=t.pickAt(at.x,at.y);ok(o&&o.est&&o.k==='pasture','a click on '+ash.name+'\'s pasture fields picks the pasture: '+(o&&(o.k||o.name||o.id)))}
 // (no livestock is sold: not at the pasture, not from a herd; the Pens tell of it)
 t.estateMeet(t.estatePick(ash,'pasture'));ok(/data-act="es-tab" data-arg="herd"/.test(panel())&&!/herd-buy|herd-milk|herd-steal|es-herd/.test(panel()),'the pasture shows its Pens, and nothing to buy');t.act('es-tab','herd');
 ok(G.mode==='dialog'&&/Cattle/.test(panel())&&/Not for sale/.test(panel())&&!/data-act="(herd-|es-herd)/.test(panel())&&!document.querySelector('.rwbody button'),'the Pens: the herd and what it makes, information only');
 {const g0=P.gold,m0=t.goodN('meat'),n0=cow.n;['es-herd','herd-buy','herd-milk','herd-steal'].forEach(a=>t.act(a));ok(P.gold===g0&&t.goodN('meat')===m0&&cow.n===n0&&G.mode==='dialog'&&!('openHerd' in window)&&!('herdRows' in window),'no way left to buy, milk or take one: those actions do nothing and the herders’ window is gone')}
 t.act('dlg-close');ok(G.mode==='world','Leave returns to the map');
 // a holding's livestock is never a figure of its own: not picked, hovered or met, wherever its data stands; with a pasture it is
 // drawn there, inside the fence (even a herd that grazed by the holding before its pasture was built)
 {const free=Object.assign(cow,{decor:false,pen:null});free.x=free.hx=ash.x+60;free.y=free.hy=ash.y+40;P.x=free.x;P.y=free.y;G.mode='world';G.modal=false;G.encCool=0;free.cool=0;t.hidePanel();t.updateCritters(.01);
  ok(G.mode==='world'&&t.pickAt(free.x,free.y-3)!==free&&t.tipFor(free)===''&&!free.inView(999),'a herd standing loose by its holding is not picked, hovered or met, and not drawn there');
  const sp=t.penSpots(ash,0);ok(t.fieldsOf(ash,'pasture')&&sp.length===Math.min(cow.n,t.fieldsOf(ash,'pasture').tiles.length)&&sp.every(q=>t.fieldsOf(ash,'pasture').tiles.some(([x,y])=>x===q.tx&&y===q.ty)),'it is drawn in its pasture instead: '+sp.length+' cattle on its fenced tiles');
  const ents=[];t.penEnts(ash,ents,{x:0,y:0});ok(ents.length===sp.length&&ents.every(e=>e.y>0&&typeof e.f==='function'),'its animals are drawn among the rest by depth, with the estate (one entry each)')}
 // the pasture animals stay inside their fence over time, every kind of livestock, two of a small kind to a tile
 {const bad=[];let n=0;for(const id of ['cow','sheep','pig','goat','hen','camel','buffalo','tamereindeer']){cow.id=id;cow.n=9;for(let k=0;k<240;k++){const now=k*137.3;for(const q of t.penSpots(ash,now)){n++;const x0=q.tx*16,y0=q.ty*16,w=q.a.cw||q.a.width,h=q.a.ch||q.a.height;
     if(q.x-w/2<x0+1||q.x+w/2>x0+15||q.y>y0+14||q.y-h<y0)bad.push(id+'@'+now+' '+q.x.toFixed(1)+','+q.y)}}}
  ok(n>1000&&!bad.length,'pasture animals stay inside their fenced tiles at every moment ('+n+' places, cattle one a tile, the small kinds two)'+(bad.length?': '+bad.slice(0,4).join('; '):''));
  cow.id='sheep';ok(t.penSpots(ash,0).length===Math.min(9,2*t.fieldsOf(ash,'pasture').tiles.length),'two sheep to a fenced tile');cow.id='cow';cow.n=4}
 {const lv=t.bldLv(ash,'pasture');ash.bld.pasture=0;ok(!t.penSpots(ash,0).length,'a pasture pulled down or burnt to nothing shows no herd anywhere');ash.bld.pasture=lv}
 // save
 G.mode='world';t.saveGame();const snap=JSON.stringify(W.critters.map(c=>[c.id,c.n,c.home||'']));W.critters=[];t.act('load');ok(JSON.stringify(W.critters.map(c=>[c.id,c.n,c.home||'']))===snap,'critters survive a reload');
 // sprites and icons
 const blank=Object.keys(t.CRITTERS).filter(k=>{const c=t.critterSprite(k),px=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let j=3;j<px.length;j+=4)if(px[j])n++;return n<15});
 ok(!blank.length,'every critter is drawn'+(blank.length?': blank '+blank:''));
 // livestock: each herd stands where its kind can graze, stays there as it wanders, and pasture herds stay in their fence
 {W.critters=[];t.initCritters();const herds=W.critters.filter(c=>c.home),bad=herds.filter(c=>!t.grazeOk(c.id,c.hx,c.hy,c.pen));
  ok(herds.length>=10&&!bad.length,herds.length+' village herds, every one on ground its kind can graze'+(bad.length?': bad '+bad.map(c=>c.id+'@'+c.home).join(', '):''));
  ok(!herds.some(c=>!c.pen&&(t.terrAt(c.hx,c.hy)===t.T_ROAD||t.isClear(c.hx,c.hy))),'no herd on a road, a yard or another estate');
  ok(herds.filter(c=>c.id==='cow').every(c=>c.pen||t.climAt(c.hx,c.hy)!=='desert')&&herds.filter(c=>c.id==='sheep').every(c=>c.pen||['grass','frost'].includes(t.climAt(c.hx,c.hy))),'cattle are never kept in the desert, sheep only in grass or frost');
  const pens=herds.filter(c=>c.pen);ok(pens.length>0,pens.length+' herds graze inside a pasture fence');
  P.x=-9999;P.y=-9999;for(let i=0;i<1500;i++)t.updateCritters(.05);
  const strays=herds.filter(c=>W.critters.includes(c)&&!t.grazeOk(c.id,c.x,c.y,c.pen));ok(!strays.length,'after a long while grazing, none has strayed onto ground it cannot use'+(strays.length?': '+strays.map(c=>c.id+'@'+c.home).join(', '):''));
  const wild=W.critters.filter(c=>!c.home),out=wild.filter(c=>!t.habitatOk(c.id,c.x,c.y));ok(out.length<=wild.length*.1,'wild game keeps to its habitat when undisturbed ('+out.length+' of '+wild.length+' outside)')}
 W.critters.forEach(c=>{c.x=P.x+20;c.y=P.y});t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
