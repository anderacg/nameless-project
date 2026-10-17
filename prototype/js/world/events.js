'use strict';
/* ---------- road events ---------- */
// Each event: w = weight, ok() = can it happen here and now, then either run() for an instant event (returns a log line and its tone)
// or text + choices for a decision. A choice has a label, an optional need() that returns why it is unavailable, and run() that returns the outcome.
const nearHold=()=>{const t=nearestOf(P,TOWNS);return t&&Math.hypot(t.x-P.x,t.y-P.y)<15*TILE?t:null};
const gainGrain=n=>invAdd('good','grain',n);
const EVENTS=[
  // instant
  {id:'refugees',w:2,ok:()=>true,run:()=>{const k=gainGrain(4);P.renown+=1;return['Refugee farmers thank you for safe passage and leave you '+k+' grain.','good']}},
  {id:'wagon',w:2,ok:()=>true,run:()=>{P.gold+=15;return['You find an abandoned wagon and sell what is in it for 15 gold.','good']}},
  {id:'fever',w:1.5,ok:()=>climAt(P.x,P.y)!=='swamp',run:()=>{P.morale-=6;return['Fever spreads through the camp. Morale drops.','bad']}},
  {id:'storm',w:1.5,ok:()=>true,run:()=>{foodTake(2);return['A storm soaks your supplies. Some food is ruined.','bad']}},
  {id:'blizzard',w:3,ok:()=>climAt(P.x,P.y)==='frost',run:()=>{if(RACES[P.race].home.includes('frost'))return['A blizzard howls, but your dwarven instincts find shelter.','good'];foodTake(3);P.morale-=4;return['A blizzard buries the camp. You lose food and spirits sink.','bad']}},
  {id:'sandstorm',w:3,ok:()=>climAt(P.x,P.y)==='desert',run:()=>{if(RACES[P.race].home.includes('desert'))return['A sandstorm rolls past. Your band shrugs it off.','good'];foodTake(2);P.morale-=4;return['A sandstorm scours the camp. Supplies are lost.','bad']}},
  {id:'pilgrims',w:1.5,ok:()=>!!nearHold(),run:()=>{const t=nearHold();addRep(t.name,3,true);P.morale+=4;return['Pilgrims bound for '+t.name+' share your fire and spread good words about you.','good']}},
  {id:'warning',w:1,ok:()=>true,run:()=>{train('scout',6);spawnBandit(false);return['A shepherd warns of raiders on the move. You keep your eyes open.','']}},
  {id:'mirage',w:2,ok:()=>climAt(P.x,P.y)==='desert',run:()=>Math.random()<.5?(P.morale+=5,['Your scouts find a real spring among the dunes. Everyone drinks deep.','good']):(P.morale-=2,['The lake on the horizon was only a mirage. Spirits sag.','bad'])},
  // choices
  {id:'traveler',w:2,ok:()=>true,text:()=>'A wounded traveler lies by the road, robbed and left for dead. He clutches a purse the bandits missed.',
    choices:[{label:'Tend his wounds (−3 food)',need:()=>foodN()<3&&'You have no food to spare.',run:()=>{foodTake(3);const t=nearHold();if(t)addRep(t.name,4,true);P.renown+=1;return'He recovers and swears to tell '+(t?t.name:'everyone')+' of your kindness.'}},
      {label:'Take his purse',run:()=>{P.gold+=20;const t=nearHold();if(t)addHonor(t.owner,-5,true);P.morale-=3;return'You take 20 gold. Some of your band look away.'+(t?' Word reaches the '+FACS[t.owner].n+'.':'')}},
      {label:'Ride on',run:()=>'You leave him to his fate.'}]},
  {id:'merchant',w:2,ok:()=>true,text:()=>{G.event.item=G.event.item||randomGear(0,Math.min(MATERIALS.length-1,1+Math.floor(G.day/15)));return'A traveling peddler opens a chest: a <span style="color:'+RARITY[ITEMS[G.event.item].r]+'">'+ITEMS[G.event.item].n+'</span> ('+ITEMS[G.event.item].d+') for '+Math.round(ITEMS[G.event.item].v*.7)+' gold.'},
    choices:[{label:'Buy it',need:()=>P.gold<Math.round(ITEMS[G.event.item].v*.7)?'Not enough gold.':!invFree()&&'Your bag is full.',run:()=>{const id=G.event.item;P.gold-=Math.round(ITEMS[id].v*.7);invAdd('gear',id,1);return'The '+ITEMS[id].n+' goes in your bag.'}},
      {label:'Decline',run:()=>'The peddler shrugs and moves on.'}]},
  {id:'shrine',w:1.5,ok:()=>climAt(P.x,P.y)!=='desert',text:()=>'An old roadside shrine, moss on its stones. Offerings of coin lie in a bowl.',
    choices:[{label:'Pray',run:()=>{P.morale+=8;return'A quiet moment. The band rises calmer.'}},
      {label:'Leave an offering (20 gold)',need:()=>P.gold<20&&'Not enough gold.',run:()=>{P.gold-=20;P.morale+=12;gainXp(25);return'You feel watched over. (+25 XP)'}},
      {label:'Take the coins',run:()=>{P.gold+=12;P.morale-=8;return'12 gold richer. Nobody sleeps well that night.'}}]},
  {id:'deserters',w:1.2,ok:()=>partySize()<partyCap(),text:()=>{const t=nearestOf(P,TOWNS);G.event.unit=G.event.unit||RACES[t.races[0]].melee;return'Two '+ST[G.event.unit].n.toLowerCase()+'s who fled their lord ask to join your band for food and 15 gold.'},
    choices:[{label:'Take them in (15 gold)',need:()=>P.gold<15?'Not enough gold.':partySize()+2>partyCap()?'No room in your party.':!partyRoster(P).canAdd(G.event.unit)&&'No free army group.',run:()=>{P.gold-=15;P.add(G.event.unit,2);return'Two new '+ST[G.event.unit].n.toLowerCase()+'s fall in line.'}},
      {label:'Turn them away',run:()=>'They vanish into the trees.'}]},
  {id:'gamblers',w:1.2,ok:()=>P.gold>=20,text:()=>'Off-duty soldiers wave you over to a game of bones. The pot is 20 gold a hand.',
    choices:[{label:'Play a hand (20 gold)',need:()=>P.gold<20&&'Not enough gold.',run:()=>{if(Math.random()<.48){P.gold+=20;return'You win 20 gold. They grumble.'}P.gold-=20;return'You lose 20 gold. They laugh.'}},
      {label:'Walk on',run:()=>'You leave them to it.'}]},
  {id:'mine',w:2,ok:()=>terrAt(P.x,P.y)===T_HILL||nearMount(),text:()=>'A collapsed mine shaft opens into the hillside. Old carts still sit inside.',
    choices:[{label:'Explore it',run:()=>{if(Math.random()<.6){const k=invAdd('good','iron',5);let x=' You haul out '+k+' iron.';if(Math.random()<.4){const id=randomGear(1,3);if(invAdd('gear',id,1))x+=' Deep inside lies a '+ITEMS[id].n+'.'}return'The tunnels hold.'+x}
        const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0);if(ks.length){const k=ks[rint(0,ks.length-1)];P.remove(k);return'A tunnel caves in. You lose '+an(ST[k].n.toLowerCase())+'.'}P.morale-=8;return'A tunnel caves in. You barely crawl out.'}},
      {label:'Leave it',run:()=>'You mark it on your map and move on.'}]},
  {id:'hunters',w:2,ok:()=>terrAt(P.x,P.y)===T_FOREST||climAt(P.x,P.y)==='frost',text:()=>'A camp of hunters drying pelts by the fire.',
    choices:[{label:'Buy 3 furs (15 gold)',need:()=>P.gold<15?'Not enough gold.':goodRoom('furs')<3&&'No room in your bag.',run:()=>{P.gold-=15;invAdd('good','furs',3);return'Three warm furs for the road.'}},
      {label:'Join the hunt',run:()=>{gainXp(15);train('scout',8);const k=invAdd('good','meat',3);return'A good chase. (+15 XP, '+k+' meat)'}},
      {label:'Move on',run:()=>'You nod and ride past.'}]},
  {id:'child',w:1,ok:()=>!!nearHold(),text:()=>'A lost child sits crying by the road. She says she lives in '+nearHold().name+'.',
    choices:[{label:'Take her home',run:()=>{const t=nearHold();addRep(t.name,6,true);P.morale+=5;return'Her family in '+t.name+' will not forget you.'}},
      {label:'Point the way',run:()=>'She trudges off toward home.'}]},
  {id:'bard',w:1.2,ok:()=>true,text:()=>'A wandering bard offers to make a song of your deeds.',
    choices:[{label:'Pay him (10 gold)',need:()=>P.gold<10&&'Not enough gold.',run:()=>{P.gold-=10;P.morale+=8;P.renown+=2;return'The song spreads from tavern to tavern. (+2 renown)'}},
      {label:'Send him off',run:()=>'He sings something rude as he leaves.'}]},
  {id:'wisps',w:3,ok:()=>climAt(P.x,P.y)==='swamp',text:()=>'Pale lights dance over the bog, drifting deeper into the mire.',
    choices:[{label:'Follow them',run:()=>{if(Math.random()<.5){P.gold+=40;return'They lead to a drowned chest with 40 gold.'}P.morale-=6;return'They lead you in circles until dawn.'}},
      {label:'Stay on the path',run:()=>'The lights fade behind you.'}]},
  {id:'caravan',w:1.2,ok:()=>troopCount()>=3,text:()=>'A merchant caravan is under attack by raiders just ahead.',
    choices:[{label:'Charge in',run:()=>{G.event.fight=true;return'You draw steel and ride at the raiders.'}},
      {label:'Stay clear',run:()=>'You wait until the screams stop.'}]}
];
function nearMount(){const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE);for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++)if(tAt(tx+i,ty+j)===T_MOUNT)return true;return false}
// called from the daily tick
function roadEvent(){
  if(G.quietEvents||G.mode!=='world'||G.modal)return;
  const ok=EVENTS.filter(e=>e.ok());let r=Math.random()*ok.reduce((a,e)=>a+e.w,0),ev=ok[0];for(const e of ok){r-=e.w;if(r<=0){ev=e;break}}
  if(!ev)return;
  if(ev.run){const [m,c]=ev.run();log(m,c);return}
  G.event={id:ev.id};G.mode='event';P.tx=null;showEvent();
}
const eventDef=()=>EVENTS.find(e=>e.id===G.event.id);
function showEvent(result){
  const ev=eventDef();
  showPanel('<div class="top"><h2>On the road</h2><span class="muted">Day '+G.day+' · '+regionAt(P.x,P.y).name+'</span></div><p>'+ev.text()+'</p>'+
    (result!=null?'<p class="gold">'+result+'</p>'+nav(null,['ev-done',null,'Continue'])
      :'<div class="btns">'+ev.choices.map((c,i)=>{const why=c.need&&c.need();return '<button class="btn'+(i===0?' primary':'')+'" type="button" data-act="ev-choose" data-arg="'+i+'"'+(why?' disabled title="'+why+'"':'')+'>'+c.label+(why?' · '+why:'')+'</button>'}).join('')+'</div>'));
}
function eventAct(a,arg){
  if(a==='ev-choose'&&G.mode==='event'){const c=eventDef().choices[+arg];if(c.need&&c.need())return true;const res=c.run();P.morale=clamp(P.morale,0,100);updateHUD(true);log(res);showEvent(res);return true}
  if(a==='ev-done'&&G.mode==='event'){const fight=G.event.fight;G.event=null;G.mode='world';hidePanel();
    if(fight)startEncounter({kind:'party',ref:{x:P.x,y:P.y,cool:0},n:rint(4,6)+Math.floor(G.day/15),band:'bandits'});else saveGame(true);return true}
  return false;
}
onAct('ev-',eventAct);
