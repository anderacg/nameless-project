'use strict';
/* ---------- folk: workers at the estates ---------- */
// W.folk: workers, only around holdings near you (not saved). Every estate's workers live and work at it, inside its building
// (unseen), and once a day carry what they made to their holding: each sets out at his own hour between the afternoon and dusk
// (DELIVER), walks to its gate with his load, stops in a little while, and walks back to the estate and in again. Met at their
// estate (a click on it: estates.js estateMeet); one out on the road, where he walks (to talk to, hire, rob or press-gang).
// st: 'in' (at work inside), 'out' (to the holding, loaded), 'town' (delivering, inside its gate), 'back' (home to the estate)
// a worker (made an EstateWorker in place: asWorker): a world object (parties.js), seen and met only out on the road
class EstateWorker extends WorldObject{
  get mapKind(){return 'worker'}
  here(){return W.folk.includes(this)}
  get meetsAnyTime(){return true}
  meet(){workerMeet(this)}
  inView(V){return folkOut(this)&&Math.abs(this.x-P.x)<=V*1.3&&Math.abs(this.y-P.y)<=V*1.3}
  // (at work inside: met at his estate, estates.js; out on the road with a delivery, where he walks)
  pick(at){if(folkOut(this))at.add(this,6,4)}
  // the people's figure with his trade's tool, the home's race, his load on his back on the way to the holding (folkSprite)
  draw(ents,cam,V){if(!this.inView(V))return;const f=this;
    ents.push({y:f.y,f:()=>{subT(f);const fr=f.moving&&mapStepping(f)?(frameOf(f,WALK.foot,WALK.n)+Math.floor(f.ph*WALK.n))%WALK.n:0,t=townBy(f.home),s=folkSprite(f.job,fr,t&&t.races?t.races[0]:'human',Math.floor(f.ph*7),f.st==='out'),sx=Math.round(f.x-cam.x),sy=Math.round(f.y-cam.y);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-2,sy-1,5,2);ctx.save();ctx.translate(sx,sy);if(f.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-8,-14);ctx.restore()}})}
  tip(){return '<b>'+(this.name?this.name+', '+this.job:cap1(this.job))+'</b><small>Of '+this.home+'</small><span class="act">Click: talk</span>'}
}
const asWorker=asClass(EstateWorker);
// (the estates whose workers you have come near: town|estate; forgotten once you are far)
const FOLK_SEEN=new Set();
const dayPart=()=>G.clock/DAY;
// the hours a delivery may start (share of the day: the afternoon to the end of dusk), and how long it takes inside the gate
const DELIVER={from:.45,to:.66,stop:[1.5,3.5]};
/* each worker is someone: id (his holding, estate and number there), a name and a look (v) of his people, seeded from that id
   (FOLK_COUNT: how many each estate has had, this session; never saved). Recruited where he works (workerRecruit), he leaves his
   estate a pair of hands short (t.lost[k]: the days the gaps fill again) until someone new moves in, REFILL_DAYS later */
const FOLK_NAMES={human:['Alys','Bran','Cedric','Dora','Edwin','Gwen','Hob','Ida','Jory','Maud','Ned','Osric','Peg','Rafe','Tilda','Wat'],
  dwarf:['Bofri','Dagna','Durli','Grimma','Helga','Korri','Nali','Thrain','Ulfa','Vigdis'],elf:['Aelin','Caelir','Elowen','Faelar','Ilyth','Lorien','Naeris','Saelith','Thalia','Varis'],
  orc:['Brak','Durza','Gash','Hruk','Krenna','Mogg','Nazra','Rukk','Shagra','Ugak']};
const FOLK_COUNT=new Map(),REFILL_DAYS=3;
const folkHash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
function folkName(f,race){const N=FOLK_NAMES[race]||FOLK_NAMES.human,h=folkHash(f.id);f.name=N[h%N.length];f.v=(h>>>8)%4;return f}
// the hands an estate is short (recruited away, not yet replaced), and the share of its work still done
const lostHands=(t,k)=>((t.lost||{})[k]||[]).filter(d=>d>G.day).length;
const handsLeft=(t,k)=>{const n=lostHands(t,k);return n?Math.max(0,1-n/Math.min(3,bldLv(t,k)+1)):1};
// a worker's trade as a soldier (a quarry's miners are quarrymen), the peasant he becomes (data/units.js), and why not
const tradeOf=f=>f.k==='quarry'?'quarryman':f.job;
const recruitKind=(t,f)=>peasantKind(t.races[0],tradeOf(f));
function workerRecruitWhy(t,f){const k=recruitKind(t,f),c=hireCost(k);
  return P.fac&&P.fac===t.owner?'Your employer’s people':remembers(t,f)?'They will not follow you':partyRoom()<1?'Your band is full':!partyRoster(P).canAdd(k)?'No room for another group':P.gold<c?'Not enough gold':t.owner!=='player'&&!canHire(t,k)?'They do not trust you yet':''}
function workerRecruit(f){const t=townBy(f.home);if(!t||!W.folk.includes(f)||workerRecruitWhy(t,f))return false;const k=recruitKind(t,f),c=hireCost(k);
  P.gold-=c;P.add(k);f.gone=true;W.folk=W.folk.filter(x=>x!==f);t.pop=Math.max(10,(t.pop||0)-1);t.lost=t.lost||{};t.lost[f.k]=[...(t.lost[f.k]||[]).filter(d=>d>G.day),G.day+REFILL_DAYS];
  if(t.owner!=='player')addRep(t.name,-2,true);log(f.name+' the '+f.job+' takes your coin and joins your band as '+an(ST[k].n.toLowerCase())+'. The '+ESTATES[f.k].n.toLowerCase()+' of '+t.name+' is a pair of hands short for a few days.','gold');return true}

/* workers */
function folkHome(t){return{x:t.x+rint(-6,6),y:t.y+10}}
// an estate's door: where its workers go in and come out (the front of its building)
function folkDoor(t,k){const sp=bldSpots(t)[k];return sp?{x:sp.x+rint(-3,3),y:sp.y+5}:folkHome(t)}
// out on the map (seen, and met where he walks): on the way to the holding or back
const folkOut=f=>f.st==='out'||f.st==='back';
function updateFolk(d){
  // workers belong to nearby holdings only; far ones go, and so do those whose estate is gone (pulled down or burnt to nothing:
  // one out on the road goes home first)
  const A=WORLD_SCALE.ai;W.folk=W.folk.filter(f=>{const t=townBy(f.home);return t&&Math.hypot(t.x-P.x,t.y-P.y)<A.folkNear+A.folkForget&&!f.gone&&(f.st!=='in'||bldLv(t,f.k)>0)});
  for(const key of FOLK_SEEN){const t=townBy(key.split('|')[0]);if(!t||Math.hypot(t.x-P.x,t.y-P.y)>A.folkNear+A.folkForget)FOLK_SEEN.delete(key)}/* (out of reach: met afresh next time) */
  const now=dayPart(),win=now>=DELIVER.from&&now<DELIVER.to;
  for(const t of TOWNS){if(!t.bld||Math.hypot(t.x-P.x,t.y-P.y)>A.folkNear||ruined(t))continue;const sp=bldSpots(t);
    for(const k in sp){const lv=bldLv(t,k),job=ESTATES[k]&&ESTATES[k].work;if(!lv||!job)continue;
      // (all of them there as you come near; one taken or fled comes back only slowly, so a hire or a press-gang shows)
      const key=t.name+'|'+k,first=!FOLK_SEEN.has(key);FOLK_SEEN.add(key);
      for(let have=W.folk.filter(f=>f.home===t.name&&f.k===k).length;have<Math.min(3,lv+1)-lostHands(t,k)&&(first||Math.random()<d*.02);have++){const no=(FOLK_COUNT.get(key)||0)+1;FOLK_COUNT.set(key,no);const at=folkDoor(t,k),leave=DELIVER.from+Math.random()*(DELIVER.to-DELIVER.from);
        W.folk.push(asWorker(folkName({id:key+'|'+no,folk:true,home:t.name,k,job,x:at.x,y:at.y,tx:at.x,ty:at.y,st:'in',leave,done:now>leave?G.day:-1,dir:1,ph:Math.random()*6},t.races[0])))}}}
  for(const f of W.folk){
    const t=townBy(f.home);if(!t){f.gone=true;continue}
    const threat=bandits.some(b=>Math.hypot(b.x-f.x,b.y-f.y)<A.folkBandit)||until(t,'fear')&&Math.hypot(P.x-f.x,P.y-f.y)<A.folkFear;
    // at work inside: out with the day's load at his hour (not while the holding is besieged or afraid)
    if(f.st==='in'){f.moving=false;if(win&&f.done!==G.day&&now>=f.leave&&!besieged(t)&&!until(t,'fear')){const g=folkHome(t);f.st='out';f.tx=g.x;f.ty=g.y}continue}
    // delivering inside the gate: then back to the estate
    if(f.st==='town'){f.wait-=d;if(f.wait<=0){const g=folkHome(t),door=folkDoor(t,f.k);f.x=g.x;f.y=g.y;f.tx=door.x;f.ty=door.y;f.st='back'}continue}
    const dx=f.tx-f.x,dy=f.ty-f.y,dd=Math.hypot(dx,dy);
    if(dd>1.5){f.dir=dx>=0?1:-1;f.moving=true;if(Router.travel(f,{x:f.tx,y:f.ty},moveStep(threat?16:9,d)))continue}
    // (there, or no way there: in at the gate, or in at the estate's door; a new hour for tomorrow's load)
    f.moving=false;
    if(f.st==='out'){f.st='town';f.wait=DELIVER.stop[0]+Math.random()*(DELIVER.stop[1]-DELIVER.stop[0]);f.done=G.day;f.leave=DELIVER.from+Math.random()*(DELIVER.to-DELIVER.from)}
    else if(f.st==='back'){f.st='in';const door=folkDoor(t,f.k);f.x=door.x;f.y=door.y}
  }
}
// a worker on the map: the people's figure with the trade's tool (people.js workerSprite), the home's race
// (carry: his load on his back, on the way to the holding)
function folkSprite(job,frame,race,v,carry){return workerSprite(job,frame,race,v,carry)}

// (only those out on the road: the rest are at work inside their estate, or delivering inside the gate)
function drawFolk(ents,cam,V){for(const f of W.folk)asWorker(f).draw(ents,cam,V)}

/* meeting a worker: talk, hire, rob or press-gang. His window: what he says, then his deeds as key actions (window.js
   railKeyActions): Hire, Rob and Press-gang, the two last asking first (railConfirm); Rob shows what he carries and the Insight
   read of whether they would fight back (window.js insight) */
// (from: the estate it was opened from: on its rail (estates.js estateRail), Back returns there)
function workerMeet(f,from){
  const t=townBy(f.home);if(!t)return;G.wk=f;G.wkFrom=from||null;G.mode='dialog';P.tx=null;G.chase=null;ensureEcon(t);
  const short=Object.keys(GOODS).filter(g=>marketState(t,g)==='shortage').slice(0,3).map(g=>GOODS[g].n.toLowerCase()),glut=Object.keys(GOODS).filter(g=>marketState(t,g)==='surplus').slice(0,3).map(g=>GOODS[g].n.toLowerCase());
  const own=t.owner==='player',mem=remembers(t,f);
  const title=cap1(an(f.job))+' of '+t.name,sub=t.owner?'Subject of the '+FACS[t.owner].n:'',body='<p>&ldquo;'+(mem?warySay(f):(foodDays(t)<2?'There is hardly any bread left in '+t.name+'.':t.pros>70?'Good times in '+t.name+'.':'We get by.')+(short.length?' We are short of '+short.join(', ')+'.':'')+(glut.length?' There is plenty of '+glut.join(', ')+'.':''))+'&rdquo;</p>'+
    '<p class="muted">'+t.name+': '+t.pop+' people, prosperity '+Math.round(t.pros)+'%, food for '+foodDays(t)+' days.'+(mem?' <span class="bad">They remember what you did.</span>':'')+'</p>'+
    railKeyActions(workerDeeds(t,f),own?'':'Robbing or press-ganging: reputation in '+t.name+' falls, the '+(t.owner?FACS[t.owner].n:'owner')+' resents it, and its workers flee the fields for a while.'),close=['dlg-close',null,'Leave'];
  if(from)estateRail(from,'folk',{title,sub,body,back:['wk-back',null,'Back'],close},'wk');
  else showPanel('<div class="top"><h2>'+title+'</h2><span class="muted">'+sub+'</span></div>'+body+nav(null,close));
}
// his deeds: Hire; someone else's worker, Rob and Press-gang (each asks first: wk-ask)
function workerDeeds(t,f){const own=t.owner==='player',lv=levyOf(t.races[0]),c=hireCost(lv),mem=remembers(t,f),rb=CONDUCT.robWorker,pg=CONDUCT.pressWorker;
  return [{icon:'troops',label:'Hire',act:'wk-hire',facts:['as '+an(ST[lv].n.toLowerCase()),c+'g'],why:mem?'They will not follow you':partyRoom()<1?'Your band is full':P.gold<c?'Not enough gold':!canHire(t,lv)&&!own?'They do not trust you':'',
      tip:'Hire the '+f.job+' as '+an(ST[lv].n.toLowerCase())+' for '+c+' gold: '+t.name+' has one less pair of hands.'},
    !own&&{icon:'bag',label:'Rob',act:'wk-ask',arg:'rob',facts:[robCarries(t,f),mem?'':robRead(t,f,robOdds(t,f))],why:mem?'They have nothing left to give you':'',
      tip:'Take what they carry. They may fight back, with any guards near: then it is a fight. Reputation −'+rb.rep+', honor −'+rb.honor+'; killing them costs far more. It asks you first.'},
    !own&&{icon:'prisoners',label:'Press-gang',act:'wk-ask',arg:'press',facts:['into your band','reputation −'+pg.rep+' · honor −'+pg.honor],why:partyRoom()<1?'Your band is full':'',
      tip:'Drag the '+f.job+' into your ranks: reputation −'+pg.rep+', honor −'+pg.honor+', morale −'+pg.morale+', and his estate remembers you for '+ROB.estate+' days. It asks you first.'}]}
/* robbing (doc/CONDUCT_RUINS_DESIGN.md §2; its numbers: ROB, data/conduct.js). What he carries goes by what he is doing (robLoot);
   whether they fight back, by their power against yours and their nerve (robOdds); given in, you take it (robTake); fighting
   back, it is a fight with them as their peasant kinds (data/units.js), and the estate's guards if near (robFight: won,
   villagersWon; fled or lost, villagersLost). A robbed worker remembers you for days, his whole estate after a killing or a
   press-gang (t.mem: his id, or the estate's kind, to the day they forget; saved: holdings.js); while they do, they will not
   talk to you as before, nor be robbed or hired */
const robLoot=f=>ROB.loot[f.st==='in'||f.st==='out'?f.st:'town'];
const remembers=(t,f)=>{const m=t.mem||{};return Math.max(m[f.id]||0,m[f.k]||0)>G.day};
function remember(t,key,days){t.mem=t.mem||{};t.mem[key]=Math.max(t.mem[key]||0,G.day+days)}
const WARY_SAY=['You’ve taken enough from us.','Leave us be. There is nothing more to take.','We remember you. Go away.','Please, no more. We have children to feed.'];
const warySay=f=>WARY_SAY[folkHash(f.id)%WARY_SAY.length];
// (the workers within reach of him, the estate's guards if he is within reach of it: their kinds, their power, the chance they resist)
function robOdds(t,f){const R=ROB.reach*TILE,sp=bldSpots(t)[f.k],ws=W.folk.filter(x=>x.home===f.home&&x.k===f.k&&Math.hypot(x.x-f.x,x.y-f.y)<=R);if(!ws.includes(f))ws.unshift(f);
  const gs=sp&&Math.hypot(sp.x-f.x,sp.y-f.y)<=R?estateGuards(t,f.k):[],list=ws.map(x=>recruitKind(t,x)).concat(gs),pw=rating(list),
    nerve=(ROB.nerve[t.races[0]]||1)*(until(t,'fear')?ROB.fear:1)*((t.pros||0)>=ROB.loveAt?ROB.love:1);
  return{ws,gs,list,pw,ch:clamp(ROB.k*pw/Math.max(1,partyPower())*nerve,ROB.resist[0],ROB.resist[1])}}
function robCarries(t,f){const L=robLoot(f),[g]=jobGood(t,f.job);return (L.goods[1]?L.goods[0]+'–'+L.goods[1]+' '+GOODS[g].n.toLowerCase()+', ':'')+L.coins[0]+'–'+L.coins[1]+' coins'}
// the Insight read (window.js insight): what anyone sees, how they look, or the numbers and the chance
function robRead(t,f,o){const n=o.ws.length,g=o.gs.length,who=n>1?f.job+'s':f.job,tone=o.ch>=.5?'bad':o.ch>=.2?'gold':'good';
  return insight([(n>1?'a group of '+who+' with their':an(f.job)+' with his')+' tools'+(g?', guards about':''),
    '<span class="'+tone+'">'+(o.ch>=.5?'they look ready to fight':o.ch>=.2?'they may fight back':'they cower')+'</span>'+(g?', '+roughly(g)+' guards near':''),
    n+' '+who+(g?' and '+g+' guards':'')+', power '+o.pw+' vs your '+partyPower()+': <span class="'+tone+'">'+Math.round(o.ch*100)+'% they fight back</span>'],'know their odds')}
function robTake(t,f){const L=robLoot(f),[g]=jobGood(t,f.job),n=L.goods[1]?rint(L.goods[0],L.goods[1]):0;ensureEcon(t);
  const k=n?invAdd('good',g,Math.min(n,Math.max(1,t.stock[g]||0))):0;if(k)t.stock[g]=Math.max(0,(t.stock[g]||0)-k);const gold=rint(L.coins[0],L.coins[1]);P.gold+=gold;
  return (k?k+' '+GOODS[g].n.toLowerCase()+' and ':'')+gold+' coins'}
function robFight(t,f,o){G.wk=G.wkFrom=null;const who=o.ws.length>1?f.job+'s':f.job;log('The '+who+' of '+t.name+' will not give up what is theirs!','bad');
  startEncounter({kind:'villagers',mine:true,ref:{town:t.name,k:f.k,f,ws:o.ws,x:f.x,y:f.y,fac:t.owner,cool:0},list:o.list.slice(),allies:[],foes:[],word:'villagers'+(o.gs.length?' and guards':''),title:'The '+who+' of '+t.name+' fight back'})}
// won (encounters.js ON_WIN.villagers): what he carried, and the dead: the estate short of their hands and remembering you
function villagersWon(e){const r=e.ref,t=townBy(r.town);if(!t)return '';const got=robTake(t,r.f),c=CONDUCT.killWorkers,n=r.ws.length;
  r.ws.forEach(x=>x.gone=true);W.folk=W.folk.filter(x=>!r.ws.includes(x));t.pop=Math.max(10,(t.pop||0)-n);t.lost=t.lost||{};t.lost[r.k]=[...(t.lost[r.k]||[]).filter(d=>d>G.day),...r.ws.map(()=>G.day+REFILL_DAYS)];
  remember(t,r.k,ROB.estate);const cost=wrong(t,{...c,hostile:rint(c.hostile[0],c.hostile[1])});mood('cruel');
  return ' You take '+got+' from the dead. Killing the people of '+t.name+' costs you dearly: '+cost+'. Its '+ESTATES[r.k].n.toLowerCase()+' will remember you.'}
// fled, or beaten (ON_WIN.villagers lost): nothing taken, word spreads, and the holding's guards want you
function villagersLost(e){const r=e.ref,t=townBy(r.town);if(!t)return;const cost=wrong(t,CONDUCT.robFailed),c=crimeAt(t);if(c)c.until=Math.max(c.until,G.day+ROB.hostile);
  log('The people of '+t.name+' drove you off with nothing. Word spreads ('+cost+'), and its guards want you for '+ROB.hostile+' days.','bad')}
function workerAct(a,arg){
  const f=G.wk,t=f&&townBy(f.home);if(!t){closeDialog();return}
  if(a==='wk-back'){const o=G.wkFrom;G.wk=null;G.wkFrom=null;if(o)estateBack(o,'folk');else closeDialog();return}
  if(a==='wk-talk')return workerMeet(f,G.wkFrom);
  // (Rob and Press-gang ask first: what it does and costs, Rob what they carry and the read of them; Confirm does it, Back his talk)
  if(a==='wk-ask'){const d=workerDeeds(t,f).find(x=>x&&x.arg===arg);if(!d||d.why)return workerMeet(f,G.wkFrom);
    return railConfirm({title:d.label+' '+f.name+'?',sub:cap1(f.job)+' of '+t.name,text:d.tip.replace(' It asks you first.',''),facts:arg==='rob'?['They carry '+d.facts[0],d.facts[1]]:d.facts,confirm:[arg==='rob'?'wk-rob':'wk-press',null,d.label],back:['wk-talk',null,'Back']})}
  const take=()=>{f.gone=true;W.folk=W.folk.filter(x=>x!==f);t.pop=Math.max(10,t.pop-1)};
  if(a==='wk-hire'){const lv=levyOf(t.races[0]),c=hireCost(lv);if(remembers(t,f)||partyRoom()<1||!partyRoster(P).canAdd(lv)||P.gold<c||!canHire(t,lv)&&t.owner!=='player')return;P.gold-=c;P.add(lv);take();
    return notice('A new recruit','The '+f.job+' lays down the '+(f.job==='farmer'?'hoe':'tools')+' and joins your band as '+an(ST[lv].n.toLowerCase())+'. '+t.name+' has one less pair of hands.','good')}
  if(a==='wk-rob'){if(t.owner==='player'||remembers(t,f))return;const o=robOdds(t,f);remember(t,f.id,ROB.memory);if(Math.random()<o.ch)return robFight(t,f,o);
    const got=robTake(t,f),cost=wrong(t,CONDUCT.robWorker);mood('cruel');return notice('Robbed','You take '+got+'. The workers of '+t.name+' run for home. It costs you: '+cost+'.','bad')}
  if(a==='wk-press'){if(partyRoom()<1)return;const lv=levyOf(t.races[0]);if(!partyRoster(P).canAdd(lv))return;P.add(lv);take();remember(t,f.k,ROB.estate);const cost=wrong(t,CONDUCT.pressWorker);mood('cruel');
    return notice('Press-ganged','Your soldiers drag the '+f.job+' into the ranks. '+cap1(an(ST[lv].n.toLowerCase()))+' joins, unwilling, and the fields of '+t.name+' empty for days. It costs you: '+cost+'.','bad')}
}
onAct('wk-',workerAct);
