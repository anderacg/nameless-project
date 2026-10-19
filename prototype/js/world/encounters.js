'use strict';
/* ---------- encounters on the road (doc/ENCOUNTERS_DESIGN.md, phase 1): the people you meet travelling are small scenes on the
   map, not windows popping up: a wounded man by the road, a peddler walking up, hunters round a fire, a caravan fighting off
   raiders. Today's people events moved here from world/events.js (it keeps the weather, the sickness and the finds), their
   rules and outcomes as they were. W.road (made with the first, saved only then: roadSave): {on (the encounters and their
   traces), c (the hours you have travelled since you last met one), h (the hour under way), day, n (how many came that day), cd
   ({kind: the day it last came}), id}.
   - Spawning, a pity timer (ENC_SPAWN): each whole hour you travel (moving on the map: not in a holding, paused, in a window or
     a battle), the chance is base + rate × c, at most cap, × the land you are on (a road busier, a holding's land, the wild
     rarer); at most perDay a day, a kind not again within `again` days, one at a time. Met (you meet it): c is 0; passed by
     (you knew of it, it left unmet): c falls by 25–50%. G.quietEvents (the tests' switch) holds it all, as it holds the events.
   - Which (ROAD_ENC w, wf, ok: today's events' rules: the climate, the land, the night, a holding near, your band) and where
     (on: ENC_ON, its own ground): your sight + 40–120 px out, ahead of the way you go, never in a holding.
   - Behaviour (beh): approach (walks up to you; reaching you, it is met), stay, flee (runs as you come), scene (already under
     way: it plays out by itself), leave (going: walks off). How long each lasts unmet: ENC_LIFE. Everything leaves once you are
     far (leave × your sight, or farther than it first stood); met and done with, once out of your sight. A few, their time up
     unresolved, leave a trace (the body, the burnt wagon) that fades after a day.
   - Shown (no pause): heard or seen the first time, a log line and a soft sound; then, while unmet, highlights (gfx/worldui.js
     wuiRoadUnder, wuiRoadOver): a glow round its figures, a pulsing "!" over it, its call-out line, an arrow at the screen's
     edge while it is off the screen. Its figures: today's map people and beasts, a cart, a tent, a fire, a shrine, a mine's
     head (EncounterScene, from its kind's scene).
   - Met: its page (window.js PageScreen: its banner cropped from the map round it, what you see, Insight by Scouting, its
     choices as key actions, a confirm before what cannot be undone, Leave at the bottom). An ambush springs as you pass: its
     page a forced choice; only Scouting INSIGHT.rough or more sees it before ---------- */
// spawning: base, rate (a travelled hour), cap; land (× by where you are); perDay, again (days); near: how far past your sight
// (px); arc: how far off the way you go (rad; arcTo for those that walk up to you, so they can reach your way); tries (spots tried); hold: tiles from a holding; pass: what passing one by takes
// off the timer [from, to]
const ENC_SPAWN={base:.004,rate:.0016,cap:.15,land:{road:1.5,held:1,wild:.6},perDay:2,again:5,near:[40,120],arc:1.1,arcTo:.5,tries:60,hold:6,pass:[.25,.5]};
// how long one lasts unmet, in-game hours [from, to], by behaviour; trace: the hours a trace lies; leave: gone past this × your
// sight (or slack px farther than it first stood); say: real seconds its call-out shows; hail: px at which one walking up to you
// stops you (it has reached you); spring: px at which an ambush springs
const ENC_LIFE={approach:[2,3],stay:[6,8],flee:[2,2],scene:[3,8],trace:24,leave:1.5,slack:24,say:4,hail:20,spring:18};
// how fast they walk (px of world time, as a party's base, yours 34): hurrying to you, running from you, going away
const ENC_SPD={approach:24,flee:20,leave:12};
const ENC_DICE=.48;// (a hand of bones won)
const ENC_RAIDER='#4a2c26';// (raiders' rags: darker than any realm's colours, so a fight reads at a glance)
const roadNow=()=>G.day*24+G.clock/DAY*24;// (the world's clock, in hours)
const roadSt=()=>W.road||(W.road={on:[],c:0,h:0,day:G.day,n:0,cd:{},id:0});
const roadList=()=>W.road?W.road.on:[];
// the land under a point, for the chance: a road (on one or a tile by), a holding's land, the wild
const roadLand=(x,y)=>nearTile(Math.floor(x/TILE),Math.floor(y/TILE),T_ROAD,1)?'road':landHold(x,y)?'held':'wild';
// each kind's ground (a tile): on or by a road; open land off it; anywhere off a road; a wood's edge (open land with the trees
// behind or beside it, none in front, so its camp shows; open land in the frost); hills (or by the mountains); a bog; cover beside a road (encounters.js coverAt)
const ENC_ON={road:(tx,ty)=>nearTile(tx,ty,T_ROAD,1),open:(tx,ty)=>tAt(tx,ty)===T_OPEN&&!nearTile(tx,ty,T_ROAD,1),wild:(tx,ty)=>tAt(tx,ty)!==T_ROAD,
  wood:(tx,ty)=>tAt(tx,ty)===T_OPEN&&(nearTile(tx,ty,T_FOREST,1)&&![-1,0,1].some(i=>tAt(tx+i,ty+1)===T_FOREST)||climAt((tx+.5)*TILE,(ty+.5)*TILE)==='frost'),hill:(tx,ty)=>tAt(tx,ty)===T_HILL||nearTile(tx,ty,T_MOUNT,1),
  bog:(tx,ty)=>tAt(tx,ty)!==T_ROAD&&climAt((tx+.5)*TILE,(ty+.5)*TILE)==='swamp',cover:(tx,ty)=>nearTile(tx,ty,T_ROAD,2)&&!!coverAt((tx+.5)*TILE,(ty+.5)*TILE)};
// the people in them (folk of the nearest holding's race, v a variant): today's map figures in small variants
const ENC_LOOK={traveller:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'bare',outer:'blue',team:'linen'}),
  peddler:(r,v)=>({...folkLook('merchant',r,v),load:'pack',weapon:'crook'}),pilgrim:(r,v)=>({...folkLook('priest',r,v),weapon:v%2?'crook':null}),
  hunter:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'hood',hood:'forest',outer:'leather',team:'forest',weapon:v%2?'bow':'spear'}),
  child:(r,v)=>({...folkLook('folk',r,v),robe:false,short:true,beard:null,helm:'bare',weapon:null}),
  bard:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'hood',hood:'violet',outer:'red',team:'gold',cape:'violet',weapon:'lute'})};
const roadCol=e=>e.fac&&FACS[e.fac]?FACS[e.fac].col:'#8a7458',roadPrice=e=>Math.round(ITEMS[e.item].v*.7);
// a fight on the road, as today's events made them: the raiders on a caravan, or an ambush (its own band, its fighters mustered
// here; you in their trap)
function roadFight(e,amb){e.done=1;e.gone=1;G.road=null;const c=climAt(P.x,P.y),k=amb?(c==='desert'?'raiders':c==='swamp'?'bog':'bandits'):'bandits',n=amb?rint(5,7)+Math.floor(G.day/15):e.n,b=asParty({x:P.x,y:P.y,cool:0,n,kind:k});
  startEncounter({kind:'party',ref:b,n,list:b.troops.slice(),band:k,...(amb?{btype:{kind:'ambush',hid:1}}:{})})}
/* the kinds: n, ico (its page's icon), w (weight; wf: × by your band), ok() (can it come here and now: today's event's rule), on
   (its ground: ENC_ON), beh, call (its call-out), hear (the log line when it is first heard: {d} its way; none: seen only), tip,
   trace (left when its time is up unresolved: ROAD_TRACE), setup(e) (its own state, made when it comes), scene(e) (its pieces:
   EncounterScene), text(e), facts(e) (what you can tell: Insight), left(e) (the log line when you leave it be), acts (its
   choices: {icon, label, facts(e), need(e) (why not), ask(e) (asks first: what cannot be undone), again (it stays open),
   run(e) (the outcome's line)}), hidden (seen only by Scouting INSIGHT.rough+), spring (springs as you pass), forced (no Leave
   until chosen), vanish (gone once dealt with), glow (lights: seen from farther), foe */
const ROAD_ENC={
  traveller:{n:'Wounded traveller',ico:'wounded',w:2,ok:()=>true,on:'road',beh:'stay',call:'Help! Over here!',hear:'Someone calls out from the road to the {d}.',trace:'body',tip:'Lying by the road',
    scene:()=>[['down','traveller',0,0,{blood:1}]],
    text:()=>'A wounded traveller lies by the road, robbed and left for dead. He clutches a purse the bandits missed.',
    facts:e=>[insight(['badly hurt','he will not last the day without help','he has about '+Math.max(1,Math.round(e.end-roadNow()))+' hours left'],'know how long he has'),'a purse: about 20 gold'],
    left:()=>'You leave him to his fate.',
    acts:[{icon:'food',label:'Tend his wounds',facts:()=>['−3 food','reputation, renown +1'],need:()=>foodN()<3&&'You have no food to spare.',tip:'Bandage him and share your food.',
        run:()=>{foodTake(3);const t=nearHold();if(t)addRep(t.name,4,true);P.renown+=1;return'He recovers and swears to tell '+(t?t.name:'everyone')+' of your kindness.'}},
      {icon:'gold',label:'Take his purse',facts:()=>['+20 gold','honour, morale −3'],ask:()=>'Take the last coins of a dying man? Your band will see it, and word gets round.',
        run:()=>{P.gold+=20;const t=nearHold(),f=t&&FACS[t.owner]&&t.owner;if(f)addHonor(f,-5,true);P.morale-=3;return'You take 20 gold. Some of your band look away.'+(f?' Word reaches the '+FACS[f].n+'.':'')}}]},
  merchant:{n:'Wandering merchant',ico:'stall',w:2,ok:()=>true,on:'road',beh:'approach',call:'Wares! Fine wares!',hear:'A peddler hails you from the road to the {d}.',tip:'A peddler with his pack',
    setup:e=>{e.item=randomGear(0,Math.min(MATERIALS.length-1,1+Math.floor(G.day/15)))},
    scene:()=>[['walk','peddler',0,0]],
    text:e=>{const I=ITEMS[e.item];return 'A travelling peddler opens his pack: a <span style="color:'+RARITY[I.r]+'">'+I.n+'</span> ('+I.d+') for '+roadPrice(e)+' gold.'},
    left:()=>'The peddler shrugs and moves on.',
    acts:[{icon:'gold',label:'Buy it',facts:e=>[roadPrice(e)+' gold'],need:e=>P.gold<roadPrice(e)?'Not enough gold.':!invFree()&&'Your bag is full.',
      run:e=>{P.gold-=roadPrice(e);invAdd('gear',e.item,1);return'The '+ITEMS[e.item].n+' goes in your bag.'}}]},
  pilgrims:{n:'Roadside shrine',ico:'altar',w:2,ok:()=>climAt(P.x,P.y)!=='desert',on:'road',beh:'stay',hear:'Singing drifts from a shrine to the {d}.',tip:'Pilgrims at an old shrine',
    setup:e=>{const t=nearHold();e.to=t?t.name:null},
    scene:()=>[['bld','shrine',0,-3],['stand','pilgrim',-8,3,{v:1}],['stand','pilgrim',7,4,{v:2,face:-1}],['stand','pilgrim',-1,6,{v:3}]],
    text:e=>'An old roadside shrine, moss on its stones. '+(e.to?'Pilgrims bound for '+e.to+' kneel':'Pilgrims kneel')+' before it, and offerings of coin lie in a bowl.',
    facts:e=>[e.to&&'they will speak of you in '+e.to],
    acts:[{icon:'morale',label:'Pray with them',facts:e=>['morale +8',e.to&&'reputation in '+e.to],run:e=>{P.morale+=8;const t=e.to&&townBy(e.to);if(t)addRep(t.name,3,true);return'A quiet moment. The band rises calmer.'+(t?' The pilgrims spread good words about you in '+t.name+'.':'')}},
      {icon:'gold',label:'Give alms',facts:()=>['20 gold','morale +12','+25 XP'],need:()=>P.gold<20&&'Not enough gold.',run:()=>{P.gold-=20;P.morale+=12;gainXp(25);return'You feel watched over. (+25 XP)'}},
      {icon:'sack',label:'Take the coins',facts:()=>['+12 gold','morale −8'],ask:()=>'Take the offerings from the pilgrims’ bowl? Nobody will sleep well.',run:()=>{P.gold+=12;P.morale-=8;return'12 gold richer. Nobody sleeps well that night.'}}]},
  deserters:{n:'Deserters',ico:'troops',w:1.2,ok:()=>partySize()<partyCap(),on:'wild',beh:'stay',tip:'Soldiers with no banner',
    setup:e=>{const t=nearestOf(P,TOWNS);e.race=t.races[0];e.unit=RACES[e.race].melee;e.fac=t.owner&&FACS[t.owner]?t.owner:null;if(e.fac&&P.fac===e.fac)e.beh='flee'},
    scene:e=>[['soldier','',-4,0,{col:roadCol(e),v:1}],['soldier','',5,2,{col:roadCol(e),v:4,face:-1}]],
    text:e=>'Two '+ST[e.unit].n.toLowerCase()+'s who fled their lord ask to join your band for food and 15 gold.',
    facts:e=>[e.fac&&'deserters from the '+FACS[e.fac].n,insight(['soldiers, by their gear','two '+ST[e.unit].n.toLowerCase()+'s, worn but armed','2 × '+ST[e.unit].n+', tier '+ST[e.unit].tier],'know what they are')],
    left:()=>'They vanish into the trees.',
    acts:[{icon:'troops',label:'Take them in',facts:()=>['15 gold','2 soldiers'],need:e=>P.gold<15?'Not enough gold.':partySize()+2>partyCap()?'No room in your party.':!partyRoster(P).canAdd(e.unit)&&'No free army group.',
        run:e=>{P.gold-=15;P.add(e.unit,2);return'Two new '+ST[e.unit].n.toLowerCase()+'s fall in line.'}},
      {icon:'prisoners',label:'Turn them in',facts:e=>[e.fac&&'honour with the '+FACS[e.fac].n+' +3','10 gold bounty'],need:e=>!e.fac&&'They serve no realm.',ask:e=>'Hand them to the '+FACS[e.fac].n+'’s men? Deserters hang.',
        run:e=>{addHonor(e.fac,3,true);P.gold+=10;return'You hand them over to the '+FACS[e.fac].n+'. The bounty is 10 gold.'}}]},
  gamblers:{n:'Gamblers',ico:'mug',w:1.2,ok:()=>P.gold>=20,on:'road',beh:'stay',hear:'Laughter and the rattle of dice to the {d}.',tip:'Soldiers at dice',
    setup:e=>{const t=nearestOf(P,TOWNS);e.race=t.races[0];e.fac=t.owner&&FACS[t.owner]?t.owner:null},
    scene:e=>[['cloth','',0,1],['soldier','',-6,0,{col:roadCol(e),v:0}],['soldier','',6,0,{col:roadCol(e),v:2,face:-1}],['soldier','',1,-4,{col:roadCol(e),v:5}],['fire','',-13,-2]],
    text:()=>'Off-duty soldiers wave you over to a game of bones. Pick your stake.',
    facts:()=>[insight(['they seem to win a fair share','the dice favour them a little',Math.round(ENC_DICE*100)+'% to win a hand'],'know the odds')],
    left:()=>'You leave them to it.',
    acts:[10,20,50].map(s=>({icon:'gold',label:'Play for '+s,facts:()=>[s+' gold a hand'],again:true,need:()=>P.gold<s&&'Not enough gold.',
      run:()=>{if(Math.random()<ENC_DICE){P.gold+=s;return'You win '+s+' gold. They grumble.'}P.gold-=s;return'You lose '+s+' gold. They laugh.'}}))},
  mine:{n:'Collapsed mine',ico:'pick',w:2,ok:()=>terrAt(P.x,P.y)===T_HILL||nearMount(),on:'hill',beh:'stay',tip:'An old shaft in the hillside',
    scene:()=>[['bld','minehead',0,2]],
    text:()=>'A collapsed mine shaft opens into the hillside. Old carts still sit inside.',
    facts:()=>[insight(['the timbers creak','the tunnels look unsafe, though more hold than fall','6 in 10 tunnels hold: iron inside, maybe more'],'know the risk')],
    left:()=>'You mark it on your map and move on.',
    acts:[{icon:'pick',label:'Search it',facts:()=>['iron, maybe gear','a cave-in may cost you'],tip:'Go in with lamps and see what is left.',
      run:()=>{if(Math.random()<.6){const k=invAdd('good','iron',5);let x=' You haul out '+k+' iron.';if(Math.random()<.4){const id=randomGear(1,3);if(invAdd('gear',id,1))x+=' Deep inside lies a '+ITEMS[id].n+'.'}return'The tunnels hold.'+x}
        const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0);if(ks.length){const k=ks[rint(0,ks.length-1)];P.remove(k);return'A tunnel caves in. You lose '+an(ST[k].n.toLowerCase())+'.'}P.morale-=8;return'A tunnel caves in. You barely crawl out.'}}]},
  hunters:{n:'Hunters’ camp',ico:'fire',w:2,ok:()=>terrAt(P.x,P.y)===T_FOREST||climAt(P.x,P.y)==='frost',on:'wood',beh:'stay',hear:'Smoke rises from a hunters’ fire to the {d}.',tip:'Hunters drying pelts by a fire',
    scene:()=>[['bld','tent',-12,1],['prop','woodpile',13,0],['fire','',2,2],['stand','hunter',-3,5,{v:1}],['stand','hunter',8,5,{v:2,face:-1}]],
    text:()=>'A camp of hunters drying pelts by the fire.',
    left:()=>'You nod and ride past.',
    acts:[{icon:'furs',label:'Buy 3 furs',facts:()=>['15 gold'],need:()=>P.gold<15?'Not enough gold.':goodRoom('furs')<3&&'No room in your bag.',run:()=>{P.gold-=15;invAdd('good','furs',3);return'Three warm furs for the road.'}},
      {icon:'eye',label:'Join the hunt',facts:()=>['+15 XP','Scouting','meat'],run:()=>{gainXp(15);train('scout',8);const k=invAdd('good','meat',3);return'A good chase. (+15 XP, '+k+' meat)'}}]},
  child:{n:'Lost child',ico:'people',w:1,ok:()=>!!nearHold(),on:'road',beh:'approach',call:'Please, help me!',hear:'A child is crying on the road to the {d}.',tip:'A child alone',
    setup:e=>{const t=nearHold();e.to=t.name;e.race=t.races[0]},
    scene:()=>[['walk','child',0,0]],
    text:e=>'A lost child sits crying by the road. She says she lives in '+e.to+'.',
    left:()=>'She trudges off toward home.',
    acts:[{icon:'house',label:'Take her home',facts:e=>['reputation in '+e.to,'morale +5'],run:e=>{const t=townBy(e.to);if(t)addRep(t.name,6,true);P.morale+=5;return'Her family in '+e.to+' will not forget you.'}}]},
  bard:{n:'Wandering bard',ico:'renown',w:1.2,wf:()=>1+Math.min(1,P.renown/60),ok:()=>true,on:'road',beh:'approach',call:'A song for a hero?',hear:'A lute plays on the road to the {d}.',tip:'A bard with a lute',
    scene:()=>[['walk','bard',0,0]],
    text:()=>'A wandering bard offers to make a song of your deeds.',
    left:()=>'He sings something rude as he leaves.',
    acts:[{icon:'renown',label:'Hear his song',facts:()=>['10 gold','renown +2','morale +8'],need:()=>P.gold<10&&'Not enough gold.',run:()=>{P.gold-=10;P.morale+=8;P.renown+=2;return'The song spreads from tavern to tavern. (+2 renown)'}}]},
  wisps:{n:'Will-o’-wisps',ico:'moon',w:3,ok:()=>climAt(P.x,P.y)==='swamp'&&darkness()>0,on:'bog',beh:'flee',glow:true,vanish:true,hear:'Pale lights flicker over the bog to the {d}.',tip:'Pale lights over the bog',
    scene:()=>[['wisp','',0,0,{v:0}],['wisp','',-9,-3,{v:1}],['wisp','',8,-6,{v:2}]],
    text:()=>'Pale lights dance over the bog, drifting deeper into the mire.',
    facts:()=>[insight(['who knows where they lead','half the tales end in treasure','an even chance: 40 gold, or a night lost'],'know the tales')],
    left:()=>'The lights fade behind you.',
    acts:[{icon:'moon',label:'Follow them',facts:()=>['treasure, or a night lost'],run:()=>{if(Math.random()<.5){P.gold+=40;return'They lead to a drowned chest with 40 gold.'}P.morale-=6;return'They lead you in circles until dawn.'}}]},
  caravan:{n:'Caravan under attack',ico:'sword',w:1.2,ok:()=>troopCount()>=3,on:'road',beh:'scene',call:'Raiders! Help us!',hear:'Shouts and the clash of steel on the road to the {d}.',trace:'wreck',foe:true,tip:'Raiders falling on a caravan',
    setup:e=>{e.n=rint(4,6)+Math.floor(G.day/15);const t=nearestOf(P,TOWNS);e.fac=t.owner&&FACS[t.owner]?t.owner:null},
    scene:e=>[['cart','',0,0,{col:roadCol(e)}],['soldier','',18,2,{col:roadCol(e),v:2}],['soldier','',20,-3,{col:roadCol(e),v:4}],['dust','',25,0],['soldier','',29,1,{band:1,col:ENC_RAIDER,v:1,face:-1}],['soldier','',32,-3,{band:1,col:ENC_RAIDER,v:4,face:-1}],['soldier','',30,5,{band:1,col:ENC_RAIDER,v:5,face:-1}]],
    text:()=>'A merchant caravan is under attack by raiders just ahead.',
    facts:e=>[insight(['raiders','about '+roughly(e.n)+' raiders',e.n+' raiders'],'know how many'),'it will not hold out long'],
    left:()=>'You wait until the screams stop.',
    acts:[{icon:'sword',label:'Join the fight',facts:e=>[insight(['raiders','about '+roughly(e.n),e.n+' raiders'],'know how many')],run:e=>{roadFight(e);return'You draw steel and ride at the raiders.'}}]},
  ambush:{n:'Ambush',ico:'sword',w:1.5,ok:()=>TERRAIN.on&&troopCount()>=3&&!!coverAt(P.x,P.y),on:'cover',beh:'stay',hidden:true,spring:true,forced:true,vanish:true,foe:true,call:'Movement in the trees…',hear:null,tip:'Movement in the trees',
    scene:()=>[['soldier','',-4,0,{band:1,col:ENC_RAIDER,v:1,a:.7}],['soldier','',5,-2,{band:1,col:ENC_RAIDER,v:3,face:-1,a:.7}]],
    text:e=>'The road runs on between '+COVER_SAY[coverAt(e.x,e.y)||'field']+'. No birdsong. Too late, your outriders see the glint of steel beside the road: an ambush.',
    acts:[{icon:'sword',label:'Close up and fight',facts:()=>['caught in their trap'],run:e=>{roadFight(e,true);return'Your band closes up on the road, weapons drawn.'}},
      {icon:'exit',label:'Cut the baggage loose and run',facts:()=>['−4 food','−15 gold','morale −4'],run:()=>{foodTake(4);P.gold=Math.max(0,P.gold-15);P.morale-=4;return'You leave the baggage to them and ride hard. They are too busy looting to follow.'}}]},
  refugees:{n:'Refugees',ico:'people',w:2,ok:()=>true,on:'road',beh:'approach',call:'Spare some bread, friend?',hear:'A family with a cart hails you from the road to the {d}.',tip:'A family with a cart',
    scene:()=>[['cart','',0,0,{col:'#9a8a6a'}],['refugee','',-19,1,{v:0}],['refugee','',-24,-2,{v:1}],['walk','child',-14,3,{v:2}]],
    text:()=>'Refugee farmers on the road with all they own on a cart, a child at their heels.',
    left:()=>'They trudge on.',
    acts:[{icon:'troops',label:'Escort them',facts:()=>['safe passage','renown +1','grain'],run:()=>{const k=gainGrain(4);P.renown+=1;return'Refugee farmers thank you for safe passage and leave you '+k+' grain.'}},
      {icon:'food',label:'Give food',facts:()=>['−3 food','renown +1','morale +3'],need:()=>foodN()<3&&'You have no food to spare.',run:()=>{foodTake(3);P.renown+=1;P.morale+=3;mood('kind');return'They eat their first warm meal in days and bless your name.'}}]},
  warning:{n:'Shepherd’s warning',ico:'sheep',w:1,ok:()=>true,on:'open',beh:'approach',call:'Raiders about!',hear:'A shepherd waves to you from the {d}.',tip:'A shepherd and his flock',
    scene:()=>[['worker','herder',0,0],['beast','sheep',-8,1,{v:0}],['beast','sheep',-13,-2,{v:3}],['beast','sheep',-6,-3,{v:5}]],
    text:()=>'A shepherd leaves his flock and hurries over, waving his crook.',
    left:()=>'He goes back to his sheep, shaking his head.',
    acts:[{icon:'eye',label:'Listen',facts:()=>['Scouting','word of a band'],run:()=>{train('scout',6);const n=bandits.length;spawnBandit(false);const b=bandits.length>n&&bandits[bandits.length-1];
      return'He warns of raiders on the move'+(b?' to the '+compass(b.x-P.x,b.y-P.y):'')+'. You keep your eyes open.'}}]}
};
// what an encounter left unresolved leaves when its time is up: the body, the burnt wagon (fading over its last hours)
const ROAD_TRACE={body:{n:'A dead traveller',scene:()=>[['down','traveller',0,0,{blood:1}]]},wreck:{n:'A burnt wagon',scene:()=>[['wreck','',0,0],['smoke','',-1,-6]]}};

/* ---------- its figures: an EncounterScene lays out each kind's pieces from its data (scene(e): [piece, which, dx, dy, opts], dx
   mirrored as it faces left: walk / stand (a person of ENC_LOOK, stepping as it moves), down (the fallen pose), soldier (a
   follower: a realm's colour, or a band's; down with blood: lying in a pool of it), refugee, worker, beast (a herd's animal), cart (the caravan's), bld (a tent, a
   shrine, a mine's head), prop, fire, cloth (dice on it), wreck; wisp, dust and smoke drawn live), each its feet at its point,
   for the map (draw: each piece by its feet in the depth order, at the encounter's own place to the screen's pixel: subT) and
   for its page's banner (pics) ---------- */
function roadPerson(key,race,v,f){const k='rp'+key+race+v+f;return spr[k]||(spr[k]=mapPerson(ENC_LOOK[key](race,v),f))}
// (lying: the figure turned a quarter, head to the right, as the battle's fallen are (sprites.js corpseOf), on the ground)
function roadDown(key,race,v,blood){const k='rpd'+key+race+v+(blood?'b':'');if(spr[k])return spr[k];if(blood){const b=roadDown(key,race,v);return spr[k]=mkc(16,16,g=>{rect(g,'#5a1414',3,13,10,1);rect(g,'#6e1a18',1,14,14,1);rect(g,'#8a2a22',5,14,5,1);rect(g,'#5a1414',3,15,10,1);g.drawImage(b,0,-1)})}
  const L=pturn(mapGrid(ENC_LOOK[key](race,v),0));let h=L.h;
  while(h>1&&!L.p.slice((h-1)*L.w,h*L.w).some(Boolean))h--;L.h=h+1;L.p.length=L.w*L.h;L.p.fill(null,h*L.w);poutline(L);return spr[k]=cellOf(pcanvas(L))}
function roadBld(type,e){const c=climAt(e.x,e.y),sd=e.seed%4,k='rb'+type+sd+c;if(spr[k])return spr[k];
  const b=type==='shrine'?PX.site({type,style:'human',seed:sd,env:c,mat:ROCK_MAT[c],snow:c==='frost',glow:'#7fd8e8'}):PX.building({type,style:'human',seed:sd,snow:c==='frost'});
  return spr[k]=mkc(b.w,b.h,g=>{g.globalAlpha=SHADOW.a;g.drawImage(b.shadow,0,0);g.globalAlpha=1;g.drawImage(b.img,0,0)})}
const roadProp=t=>spr['rpp'+t]||(spr['rpp'+t]=PX.prop({type:t}).img);
const roadFire=()=>spr.rpFire||(spr.rpFire=PX.outline(PX.canvas(8,3,g=>{const P=PX.paint(g),q=PX.part.tone;P.rect(q('stone',1),0,1,8,2);P.rect(q('stone',0),0,1,8,1);P.rect(q('log',1),2,0,4,2);P.px(q('log',0),2,0)})));
const roadCloth=()=>spr.rpCloth||(spr.rpCloth=mkc(7,4,g=>{rect(g,'#1a1c26',0,0,7,4);rect(g,'#8a3a2a',1,1,5,2);rect(g,'#a8483a',1,1,5,1);rect(g,'#f4f0e0',2,1);rect(g,'#f4f0e0',4,2)}));
// (the burnt wagon: the caravan's cart without its ox and drover, charred)
const roadWreck=()=>spr.rpWreck||(spr.rpWreck=cellOf(mkc(14,12,g=>{g.drawImage(caravanSprite('#6a5a48',0),0,20,14,12,0,0,14,12);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(28,20,16,.62)';g.fillRect(0,0,14,12)})));
const ROAD_FLIP=new WeakMap(),roadFlip=s=>{let c=ROAD_FLIP.get(s);if(!c){c=mkc(s.width,s.height,g=>{g.scale(-1,1);g.drawImage(s,-s.width,0)});ROAD_FLIP.set(s,c)}return c};
const ROAD_LIVE=['wisp','dust','smoke'];
class EncounterScene{
  // its pieces now: {k, s (the picture, null for one drawn live), x, y (its feet on the map), face, a, o}; still: standing (the banner)
  lay(e,still){const m=e.dir<0?-1:1,go=!still&&mapStepping(e),f=go?frameOf(e,WALK.foot,WALK.n):0,out=[];
    for(const [k,w,dx,dy,o={}] of e.D.scene(e)){const fr=go?(f+(o.v||0)*3)%WALK.n:0;out.push({k,s:ROAD_LIVE.includes(k)?null:this.pic(k,w,e,o,fr),x:e.x+dx*m,y:e.y+dy,face:(o.face||1)*m,a:o.a??1,o})}
    return out}
  pic(k,w,e,o,f){const r=e.race||'human',v=o.v||0;
    return k==='walk'?roadPerson(w,r,v,f):k==='stand'?roadPerson(w,r,v,0):k==='down'?roadDown(w,r,v,o.blood):k==='soldier'?followerSprite(o.col||ENC_RAIDER,f,v,r,o.band):k==='refugee'?refugeeSprite(f,v):
      k==='worker'?workerSprite(w,f,r,v):k==='beast'?critterSprite(w,f):k==='cart'?caravanSprite(o.col||'#8a7a5a',f):k==='bld'?roadBld(w,e):k==='prop'?roadProp(w):k==='fire'?roadFire():k==='cloth'?roadCloth():k==='wreck'?roadWreck():null}
  // the box it covers on the map [x0, y0, x1, y1] (a click anywhere on it, the highlights round it)
  box(e){let b=null;for(const p of this.lay(e,true)){const w=p.s?p.s.width:12,h=p.s?(p.s.ch||p.s.height):12,x0=Math.round(p.x)-(w>>1),y0=Math.round(p.y)+1-h;
    b=b?[Math.min(b[0],x0),Math.min(b[1],y0),Math.max(b[2],x0+w),Math.max(b[3],p.y+1)]:[x0,y0,x0+w,p.y+1]}
    return b||[e.x-6,e.y-12,e.x+6,e.y+2]}
  // onto the frame's list, each piece by its feet (a trace fading over its last six hours)
  draw(e,ents,cam){const fade=e.trace?clamp((e.end-roadNow())/6,0,1):1,t=performance.now()/1000,rm=reducedMotion();
    for(const p of this.lay(e,false))ents.push({y:p.y,f:()=>{subT(e);const X=Math.round(p.x-cam.x),Y=Math.round(p.y-cam.y);ctx.globalAlpha=p.a*fade;
      if(p.k==='wisp'){const ph=e.seed%7+p.o.v*2.1,x=X+(rm?0:Math.round(Math.sin(t*.9+ph)*3)),y=Y-6+(rm?0:Math.round(Math.sin(t*1.7+ph)*2)),g=ctx.createRadialGradient(x,y,0,x,y,7);
        g.addColorStop(0,'rgba(170,255,235,.55)');g.addColorStop(1,'rgba(120,230,220,0)');ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(x-7,y-7,14,14);ctx.restore();rect(ctx,'#c8fff0',x-1,y-1,2,2);rect(ctx,'#ffffff',x,y-1)}
      else if(p.k==='dust'){for(let i=0;i<5;i++){const a=t*3+i*1.26,r=5+2*Math.sin(t*5+i);ctx.fillStyle='rgba(200,184,150,'+(.35+.15*Math.sin(t*6.7+i)).toFixed(2)+')';ctx.fillRect(Math.round(X+Math.cos(a)*r)-2,Math.round(Y-4+Math.sin(a)*r*.5)-1,3,2)}
        for(let i=-2;i<=2;i++){rect(ctx,'#1a1c26',X+i-1,Y-18+i,3,3);rect(ctx,'#1a1c26',X-i-1,Y-18+i,3,3)}for(let i=-2;i<=2;i++){rect(ctx,'#e4e0cf',X+i,Y-17+i);rect(ctx,'#e4e0cf',X-i,Y-17+i)}// (crossed blades over it, as a fight on the map has)
        if(Math.floor(t*8)%3===0)rect(ctx,'#fff8d0',X+Math.round(Math.sin(t*13)*5),Y-6-Math.round((1+Math.sin(t*7))*3))}
      else if(p.k==='smoke'){for(let i=0;i<3;i++){const q=((rm?0:t*.35)+i/3)%1;ctx.fillStyle='rgba(70,64,60,'+(.45*(1-q)).toFixed(2)+')';ctx.fillRect(X+Math.round(Math.sin(q*5+i)*2)-1,Y-Math.round(q*12),2+Math.round(q*2),2)}}
      else{const s=p.s;if(['walk','stand','soldier','refugee','worker','beast'].includes(p.k)){ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(X-3,Y-1,6,2)}
        ctx.save();ctx.translate(X,Y);if(p.face<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),1-s.height);ctx.restore();
        if(p.k==='fire'){drawFire(X,Y-1,e.seed);LIGHTQ.push({x:X,y:Y-3,r:22})}}
      ctx.globalAlpha=1}})}
  // its pictures for the page's banner: [picture, x, y (top left, map px), alpha], a fire's flame and the lights as they stand
  pics(e){const out=[];for(const p of this.lay(e,true)){
    if(p.s)out.push([p.face<0?roadFlip(p.s):p.s,Math.round(p.x)-(p.s.width>>1),Math.round(p.y)+1-p.s.height,p.a]);
    if(p.k==='fire'){const fl=spr.flm0||(spr.flm0=PX.flame(0));out.push([fl.img,Math.round(p.x)-fl.ax,Math.round(p.y)-1-fl.ay])}
    if(p.k==='wisp')out.push([spr.rpWisp||(spr.rpWisp=mkc(5,5,g=>{rect(g,'rgba(150,240,225,.45)',0,1,5,3);rect(g,'rgba(150,240,225,.45)',1,0,3,5);rect(g,'#c8fff0',1,1,3,3);rect(g,'#ffffff',2,1)})),Math.round(p.x)-2,Math.round(p.y)-8])}
    return out}
}
const ENC_SCENE=new EncounterScene();

/* ---------- an encounter on the map (plain data, saved as it is: {rd, i, k, x, y, dir, beh, race, t0, end (hours), d0 (how far it
   first stood), seed, seen (heard or seen: highlighted from then), met, done, ...its kind's}; a trace: {rd, i, k, trace, from,
   end}): a world object (parties.js) ---------- */
const ROAD_SAY=new WeakMap();// (when its call-out first showed: real ms, kept aside)
class RoadEncounter extends WorldObject{
  get mapKind(){return 'road'}
  get D(){return ROAD_ENC[this.k]||ROAD_TRACE[this.k]}
  here(){return !this.gone&&roadList().includes(this)}
  get meetsAnyTime(){return true}
  chaseable(){return !this.gone&&!this.done&&!this.trace}
  // highlighted: you know of it, it is unmet and still there for you
  marked(){return !!this.seen&&!this.met&&!this.done&&!this.trace&&!this.gone}
  // seen: within your sight (woods hide it till nearer); the lights of a bog from farther; an ambush only by Scouting; a trace
  // once its time has come
  inView(V){if(this.gone||this.trace&&roadNow()<this.from)return false;const D=this.D;if(D.hidden&&skill('scout')<INSIGHT.rough)return false;return D.glow?this.fromYou()<V*1.3:spotted(this,V)}
  pick(at){if(this.chaseable()&&this.inView(at.V)){const b=this.box();at.box(this,b[0],b[1],b[2],b[3]);at.add(this,10,4)}}
  box(){return ENC_SCENE.box(this)}
  meet(){if(this.chaseable())roadMeet(this)}
  tip(){const D=this.D;return '<b>'+D.n+'</b><small>'+(D.tip||'')+'</small>'+(this.chaseable()?'<span class="act">Click: meet</span>':'')}
  draw(ents,cam,V){if(this.inView(V))ENC_SCENE.draw(this,ents,cam)}
  mapDot(V){return this.marked()&&this.inView(V)?['#e8b94a',2]:null}
  view(){return{key:'road:'+this.i+':'+this.k+':'+Math.round(this.x)+','+Math.round(this.y)+':'+(this.done?1:0),x:this.x,y:this.y+2,alt:this.D.n,ps:ENC_SCENE.pics(this)}}
  // first heard (a caller, near enough) or seen: the log line, a soft sound; its call-out waits to be on the screen
  notice(){this.seen=1;const D=this.D;log((D.hear||'Your scouts spot '+(D.hidden?'movement in the trees':D.n.toLowerCase())+' to the {d}.').replace('{d}',compass(this.x-P.x,this.y-P.y)));sfx('notify')}
  /* a moment of it (d: world time, V: your sight, now: hours): true when it opened its page (it reached you, or you sprang it) */
  step(d,V,now){const D=this.D,dist=this.fromYou();
    if(this.trace){if(now>=this.end)this.gone=1;return false}
    if(!this.seen&&!this.met&&(this.inView(V)||D.hear&&dist<V+ENC_SPAWN.near[1]+16))this.notice();
    if(dist>Math.max(ENC_LIFE.leave*V,this.d0+ENC_LIFE.slack)||this.done&&!this.inView(V)){this.over();return false}
    if(now>=this.end){if(this.beh==='approach')this.beh='leave';else if(this.beh!=='leave'||now>=this.end+2){this.over();return false}}
    const dx=P.x-this.x,dy=P.y-this.y,go=(sx,sy,v)=>{if(walk(this,sx,sy,moveStep(v,d)))this.dir=sx>=0?1:-1};
    // (coming to you: to where it meets you on your way, or straight at you)
    if(this.beh==='approach'&&!this.met){const w=roadWay(this),gx=w?w[0]-this.x:dx,gy=w?w[1]-this.y:dy;if(dist>8&&Math.hypot(gx,gy)>2)go(gx,gy,ENC_SPD.approach);if(dist<=ENC_LIFE.hail&&!G.modal&&G.encCool<=0){roadMeet(this);return true}}
    else if(this.beh==='flee'&&!this.met){if(dist<V*.6){go(-dx,-dy,ENC_SPD.flee);this.fled=1}else if(this.fled&&!this.inView(V)){this.over();return false}}
    else if(this.beh==='leave'){go(-dx,-dy,ENC_SPD.leave);if(!this.inView(V)&&dist>V*.8){this.over();return false}}
    if(D.spring&&!this.met&&dist<=ENC_LIFE.spring&&!G.modal){roadMeet(this);return true}
    return false}
  /* it leaves the map. Passed by (you knew of it, never met it): the timer falls by a quarter to a half. Unresolved, its story
     ends by itself: its trace, from when its time would have been up */
  over(){if(this.gone)return;this.gone=1;const R=roadSt(),D=this.D,S=ENC_SPAWN;
    if(this.seen&&!this.met)R.c*=1-S.pass[0]-Math.random()*(S.pass[1]-S.pass[0]);
    if(D.trace&&!this.done){const at=Math.max(roadNow(),this.end);R.on.push(asRoadEnc({rd:1,i:++R.id,k:D.trace,trace:1,x:this.x,y:this.y,dir:this.dir,race:this.race,seed:this.seed,from:at,end:at+ENC_LIFE.trace}))}}
}
// (while you travel toward a goal, where one hurrying to you meets you on your way: the point ahead you both reach at once, you
// at your pace, it at its own (|r − u·vp·t| = vo·t, its first t); none if it cannot catch you there, or you are not moving: it
// comes straight at you)
function roadWay(o){if(P.tx==null||!(ROAD_AT.m>0))return null;const vx=P.tx-P.x,vy=P.ty-P.y,L=Math.hypot(vx,vy);if(L<1)return null;
  const ux=vx/L,uy=vy/L,vp=MAP_BASE*travelMul(),vo=ENC_SPD.approach,rx=o.x-P.x,ry=o.y-P.y,a=vp*vp-vo*vo,b=-2*vp*(rx*ux+ry*uy),c=rx*rx+ry*ry;let t=null;
  if(Math.abs(a)<1e-6)t=b<0?-c/b:null;else{const D=b*b-4*a*c;if(D>=0){const q=Math.sqrt(D);t=[(-b-q)/(2*a),(-b+q)/(2*a)].filter(x=>x>0).sort((m,n)=>m-n)[0]??null}}
  if(t==null)return null;const k=Math.min(vp*t,L);return[P.x+ux*k,P.y+uy*k]}
const asRoadEnc=asClass(RoadEncounter);
function drawRoad(ents,cam,V){for(const e of roadList())e.draw(ents,cam,V)}

/* ---------- spawning ---------- */
// one of a kind at (x, y): its time by its behaviour, the nearest holding's people; facing (its scene laid out toward: dir) the
// open side when only one is (a wood's edge: its camp out of the trees), else you
const roadOpen=(x,y,i)=>{const q=tAt(Math.floor(x/TILE)+i,Math.floor(y/TILE));return q===T_OPEN||q===T_ROAD};
function roadSpawn(k,x,y){const D=ROAD_ENC[k],R=roadSt(),now=roadNow(),L=ENC_LIFE[D.beh],t=nearestOf({x,y},TOWNS),side=roadOpen(x,y,1)!==roadOpen(x,y,-1)?(roadOpen(x,y,1)?1:-1):0;
  const e=asRoadEnc({rd:1,i:++R.id,k,x,y,dir:side||(P.x>=x?1:-1),beh:D.beh,race:t&&t.races?t.races[rint(0,t.races.length-1)]:'human',t0:now,end:now+L[0]+Math.random()*(L[1]-L[0]),d0:Math.hypot(x-P.x,y-P.y),seed:rint(1,9999),seen:0,met:0,done:0});
  if(D.setup)D.setup(e);R.on.push(e);if(R.day!==G.day){R.day=G.day;R.n=0}R.n++;R.cd[k]=G.day;return e}
// a spot for its ground (ENC_ON): past your sight by near px, ahead of where you are going (within arc; else wider after half the
// tries), on ground you can walk to, nothing built on it, clear of the holdings
function roadSpot(on,arc){const S=ENC_SPAWN,V=vis(),fit=ENC_ON[on],a0=P.tx!=null?Math.atan2(P.ty-P.y,P.tx-P.x):Math.random()*6.2832;
  for(let i=0;i<S.tries;i++){const a=a0+(Math.random()*2-1)*(arc||S.arc*(i<S.tries/2?1:2.86)),r=V+S.near[0]+Math.random()*(S.near[1]-S.near[0]),x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    if(tx<2||ty<2||tx>=MW-2||ty>=MH-2||!passable(tAt(tx,ty))||occAt(tx,ty)||!fit(tx,ty))continue;
    if(TOWNS.some(t=>Math.hypot(t.tx-tx,t.ty-ty)<S.hold)||!Router.reach(P,{x,y}))continue;
    return[x,y]}
  return null}
const roadW=k=>{const D=ROAD_ENC[k];return D.w*(D.wf?D.wf():1)};
// which comes: of the kinds that can come here and now (not too soon again), by weight; tried at its own ground, else another
function roadPick(){const R=roadSt(),ks=Object.keys(ROAD_ENC).filter(k=>!(R.cd[k]!=null&&G.day-R.cd[k]<ENC_SPAWN.again)&&ROAD_ENC[k].ok());
  while(ks.length){let r=Math.random()*ks.reduce((a,k)=>a+roadW(k),0),k=ks[0];for(const q of ks){r-=roadW(q);if(r<=0){k=q;break}}
    const D=ROAD_ENC[k],p=roadSpot(D.on,D.beh==='approach'?ENC_SPAWN.arcTo:0);if(p)return roadSpawn(k,p[0],p[1]);ks.splice(ks.indexOf(k),1)}
  return null}
// the hour's roll: none past perDay a day or while one is about; else the pity timer's chance, by the land you are on
function roadRoll(){const R=roadSt(),S=ENC_SPAWN;if(R.day!==G.day){R.day=G.day;R.n=0}
  if(R.n>=S.perDay||R.on.some(e=>!e.trace&&!e.gone))return null;
  return Math.random()<roadChance()?roadPick():null}
const roadChance=()=>{const S=ENC_SPAWN;return Math.min(S.cap,S.base+S.rate*roadSt().c)*S.land[roadLand(P.x,P.y)]};
// a moment's travel: the hours you moved add to the timer; each whole one, the roll (ROAD_AT: where you were, how far you went
// last moment: kept aside)
const ROAD_AT={x:NaN,y:NaN,m:0};
function roadTravel(d){const m=Math.hypot(P.x-ROAD_AT.x,P.y-ROAD_AT.y);ROAD_AT.x=P.x;ROAD_AT.y=P.y;ROAD_AT.m=m<20?m:0;if(G.quietEvents||!(m>0&&m<20))return;
  const R=roadSt(),h=d/WORLD_PACE*24/DAY_SECONDS;R.c+=h;R.h+=h;while(R.h>=1){R.h--;if(roadRoll())break}}
// each moment on the map (world.js updateWorld): the travel, then each encounter; true when one opened its page
function updateRoad(d){roadTravel(d);const R=W.road;if(!R)return false;R.on=R.on.filter(e=>!e.gone);const V=vis(),now=roadNow();
  for(const e of R.on)if(asRoadEnc(e).step(d,V,now))return true;return false}

/* ---------- meeting one: its page ---------- */
function roadMeet(e){e.met=1;e.seen=1;roadSt().c=0;G.road=e;G.roadMsg='';G.mode='road';P.tx=null;G.chase=null;showRoad()}
function showRoad(){const e=G.road,D=e.D,done=!!e.done;
  PAGE_SCREEN.show({ico:D.ico,title:D.n,sub:regionAt(e.x,e.y).name+' · day '+G.day,banner:e.view(),msg:G.roadMsg,body:'<p>'+D.text(e)+'</p>'+(D.facts?pageFacts(D.facts(e)):''),
    acts:done?[]:D.acts.map((c,i)=>({icon:c.icon,label:c.label,facts:c.facts&&c.facts(e),act:'enc-do',arg:i,why:c.need&&c.need(e)||'',tip:c.tip})),
    close:D.forced&&!done?null:['enc-leave',null,'Leave']},'road:'+e.i)}
// done with (or left be): whoever walks goes on their way; lights and ambushers are gone
function roadDone(e){if(e.beh==='approach'||e.beh==='flee')e.beh='leave';if(e.done&&e.D.vanish)e.gone=1}
function roadAct(a,arg){const e=G.road;if(G.mode!=='road'||!e)return;const D=e.D;
  if(a==='enc-leave'){if(D.forced&&!e.done)return;if(!e.done&&D.left)log(D.left(e));roadDone(e);G.road=null;G.mode='world';hidePanel();saveGame(true);return}
  if(a==='enc-back'){showRoad();return}
  if(a==='enc-do'&&!e.done){const i=parseInt(arg),c=D.acts[i];if(!c||c.need&&c.need(e))return;
    if(c.ask&&!String(arg).endsWith('!'))return railConfirm({title:c.label+'?',sub:D.n,text:c.ask(e),facts:c.facts?c.facts(e).filter(Boolean):[],confirm:['enc-do',i+'!',c.label],back:['enc-back',null,'Back']});
    const m=c.run(e);P.morale=clamp(P.morale,0,100);updateHUD(true);if(G.road!==e)return;// (a fight began)
    if(!c.again){e.done=1;roadDone(e)}G.roadMsg=m;log(m);showRoad();railFocus(a,arg)}}
onAct('enc-',roadAct);

/* ---------- the save: W.road, once there is one (absent: none, as every save before it) ---------- */
const roadSave=()=>W.road?{road:{...W.road,on:W.road.on.filter(e=>!e.gone)}}:{};
function roadLoad(r){W.road=r||null;if(r)r.on.forEach(asRoadEnc)}
