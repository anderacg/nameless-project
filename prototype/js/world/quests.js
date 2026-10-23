'use strict';
/* ---------- quests: jobs from holdings and lords (the Quest shape: story/quest.js; the story wave, S3) ----------
   P.jobs[holding] = {day, list}: up to JOB_OFFERS offers, refreshed every JOB_REFRESH days. P.quests: the ones you took (at most
   QUEST_MAX). A quest: {id, type, title, text, giver (holding or lord name), lord (bool), fac, due, reward {gold, rep, honor, xp},
   done, ...type fields}, its kind's class put on it (each kind below: its offer, its target, its deed, what it takes).
   Kill, clear and raid quests are done when the deed is (heard on the world's bus, core/bus.js); you then report back.
   Deliveries are handed in where they were asked for. A courier pays on arrival. Lord quests can be reported to the lord or at
   any holding of his faction. */
const QUEST_MAX=4,JOB_OFFERS=2,JOB_REFRESH=7;
const BAND_NAMES=['Red Vipers','Ash Crows','Black Hounds','Grey Wolves','Bone Saws','Mud Rats','Iron Jaws','Night Owls','Rusty Knives','Hollow Men','Crooked Spears','Burnt Hands'];
// (the jobs' own dice: the stream 'quests', core/rng.js, so a job kind added or changed never moves the world's Math.random)
const questRng=()=>rngOf('quests');
const qScale=()=>1+G.day/60,qTiles=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)/TILE;
const questBy=id=>P.quests.find(q=>q.id===id);
// a free spot 8 to 16 tiles from a holding, on ground you can reach
function spotNear(t,lo,hi,ok){
  const from=startHolding(),r=questRng();
  for(let k=0;k<300;k++){const a=r.next()*6.283,d=(lo+r.next()*(hi-lo))*TILE,x=t.x+Math.cos(a)*d,y=t.y+Math.sin(a)*d,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    if(tx<2||ty<2||tx>=MW-2||ty>=MH-2||!passable(tAt(tx,ty))||!Router.reach(from,{x:(tx+.5)*TILE,y:(ty+.5)*TILE})||TOWNS.some(o=>Math.hypot(o.x-x,o.y-y)<48)||(ok&&!ok(x,y)))continue;return{x:(tx+.5)*TILE,y:(ty+.5)*TILE}}
  return null;
}
/* ---------- the job kinds: one class each (story/quest.js, the Quest shape), its own rules only ---------- */
// a bounty: a band of its own name near the holding; done when you break it (in a fight, or it gives up to you)
class BountyQuest extends Quest{
  setup(t){
    this.band=questRng().pick(BAND_NAMES);
    this.n=questRng().int(4,6)+Math.floor(G.day/12);
    this.days=8;
    this.title='Bounty: the '+this.band;
    this.text='The '+this.band+', a band of about '+this.n+', have been robbing travellers near '+t.name+'. Find them and break them.';
    this.pays(50+14*this.n,8,3,20+5*this.n);
  }
  begin(t){
    const p=spotNear(t,8,16);
    if(!p)return false;
    const kind=climAt(p.x,p.y)==='desert'?'raiders':climAt(p.x,p.y)==='swamp'?'bog':'bandits';
    // (its fighters and its chief made from the jobs' stream too)
    const list=Rng.use('quests',()=>makeEnemies(this.n,false,kind)),ld=Rng.use('quests',()=>newChief(kind,2+Math.floor(G.day/20)));
    bandits.push(asParty({x:p.x,y:p.y,n:this.n,kind,list,t:0,a:0,idle:true,cool:0,qid:this.id,name:this.band,ld}));
    this.x=p.x;
    this.y=p.y;
  }
  // (on the map, or gone to ground in a camp: its quarry, story/quest.js)
  seek(){
    const b=bandits.find(x=>x.qid===this.id)||Quest.quarry(this.id)[0];
    return b?{x:b.x,y:b.y,name:(b.ld?b.ld.name+' and ':'')+'the '+this.band}:null;
  }
  get deed(){
    return 'band:beaten';
  }
  hits(d){
    return d.band.qid===this.id;
  }
}
// a beast hunt: bigger beasts of the holding's lands, set near it; done when they are slain
class BeastQuest extends Quest{
  setup(t){
    const c=t.clim,ids=Object.keys(MONSTERS).filter(id=>MONSTERS[id].where.includes(c)||MONSTERS[id].where.includes('forest')&&c==='grass');
    if(!ids.length)return false;
    this.mon=questRng().pick(ids);
    const M=MONSTERS[this.mon];
    this.n=Math.max(M.count[0],M.count[1]);
    this.lv=monLevel(questRng())+1;
    this.days=10;
    this.title='Beast hunt: '+M.n.toLowerCase();
    this.text=cap1(M.n.toLowerCase())+' have been killing livestock outside '+t.name+'. They are bigger than most. Kill them.';
    this.pays(40+M.xp*this.n*.9,8,2,0);
  }
  // (where they would live, else anywhere near)
  begin(t){
    const M=MONSTERS[this.mon],p=spotNear(t,6,14,(x,y)=>M.where.some(w=>habitatAt(x,y).includes(w)))||spotNear(t,6,14);
    if(!p)return false;
    W.monsters.push(asMonster({id:this.mon,x:p.x,y:p.y,hx:p.x,hy:p.y,lv:this.lv,n:this.n,t:0,a:0,cool:0,qid:this.id}));
    this.x=p.x;
    this.y=p.y;
  }
  seek(){
    const m=W.monsters.find(x=>x.qid===this.id);
    return m?{x:m.x,y:m.y,name:MONSTERS[this.mon].n.toLowerCase()}:null;
  }
  get deed(){
    return 'monster:slain';
  }
  hits(d){
    return d.monster.qid===this.id;
  }
}
// a clearance: the nearest lair or camp that troubles the holding, marked on your map; done when it is cleared
class ClearQuest extends Quest{
  setup(t){
    const s=W.sites.filter(x=>x.clearJob&&!x.cleared&&qTiles(x,t)<35).sort((a,b)=>qTiles(a,t)-qTiles(b,t))[0];
    if(!s)return false;
    this.site=s.i;
    this.days=12;
    this.title='Clear the '+s.name;
    this.text='The '+s.name+' to the '+compass(s.x-t.x,s.y-t.y)+' troubles '+t.name+'. Clear it out.';
    this.pays(130,10,3,40);
  }
  begin(){
    const s=W.sites[this.site];
    if(!s||s.cleared)return false;
    s.seen=true;
    this.x=s.x;
    this.y=s.y;
  }
  seek(){
    const s=W.sites[this.site];
    return s?{x:s.x,y:s.y,name:'the '+s.name}:null;
  }
  get deed(){
    return 'site:cleared';
  }
  hits(d){
    return d.site.i===this.site;
  }
}
// a supply run: a lasting good the holding is short of, handed over into its stock
class SupplyQuest extends Quest{
  setup(t){
    ensureEcon(t);
    const goods=Object.keys(GOODS).filter(g=>!GOODS[g].spoil&&!GOODS[g].ammo&&needOf(t,g)>.05).sort((a,b)=>(t.stock[a]||0)/targetStock(t,a)-(t.stock[b]||0)/targetStock(t,b));
    if(!goods.length)return false;
    this.good=goods[questRng().int(0,Math.min(1,goods.length-1))];
    this.n=questRng().int(8,15);
    this.days=10;
    this.title='Supply run: '+GOODS[this.good].n.toLowerCase();
    this.text=t.name+' is short of '+GOODS[this.good].n.toLowerCase()+'. Bring '+this.n+' here.';
    this.pays(GOODS[this.good].base*this.n*1.6,8,2,15);
  }
  get handsOver(){
    return true;
  }
  ready(){
    return goodN(this.good)>=this.n;
  }
  progress(){
    return goodN(this.good)+' / '+this.n+' '+GOODS[this.good].n.toLowerCase();
  }
  handOver(){
    goodTake(this.good,this.n);
    const ht=townBy(this.home);
    if(ht){
      ensureEcon(ht);
      ht.stock[this.good]=(ht.stock[this.good]||0)+this.n;
    }
  }
}
// a hunt: deer hides for the tanner, or meat for a feast, handed over
class HuntQuest extends Quest{
  setup(t){
    const hides=questRng().chance(.4);
    this.mat=hides?'hide':null;
    this.good=hides?null:'meat';
    this.n=hides?questRng().int(3,5):questRng().int(12,20);
    this.days=12;
    this.title=hides?'Hides for the tanner':'Meat for the feast';
    this.text=hides?'The tanner of '+t.name+' wants '+this.n+' deer hides.':t.name+' is holding a feast and needs '+this.n+' meat.';
    this.pays(hides?this.n*28:this.n*13,8,1,15);
  }
  get handsOver(){
    return true;
  }
  // (what you carry of it)
  have(){
    return this.mat?invCount('mat',this.mat):goodN('meat');
  }
  ready(){
    return this.have()>=this.n;
  }
  progress(){
    return this.have()+' / '+this.n+' '+(this.mat?'hides':'meat');
  }
  handOver(){
    if(!this.mat)return goodTake('meat',this.n);
    let n=this.n;
    for(let i=0;i<P.inv.length&&n;i++){
      const s=P.inv[i];
      if(s&&s.k==='mat'&&s.id===this.mat){
        const k=Math.min(n,s.n);
        s.n-=k;
        n-=k;
        if(!s.n)P.inv[i]=null;
      }
    }
  }
}
// a courier: a sealed letter to a holding that is not hostile to you, paid on arrival there
class CourierQuest extends Quest{
  setup(t){
    const dest=TOWNS.filter(o=>o!==t&&!hostileTo(o.owner)&&qTiles(o,t)>18&&qTiles(o,t)<60);
    if(!dest.length)return false;
    const d=questRng().pick(dest);
    this.to=d.name;
    this.days=Math.ceil(qTiles(d,t)/8)+5;
    this.title='Letter for '+d.name;
    this.text='Carry a sealed letter from '+this.giver+' to '+d.name+', '+Math.round(qTiles(d,t))+' tiles to the '+compass(d.x-t.x,d.y-t.y)+'. You are paid on arrival.';
    this.pays(25+qTiles(d,t)*1.6,5,2,15);
  }
  begin(){
    const d=townBy(this.to);
    this.x=d.x;
    this.y=d.y;
  }
  seek(){
    const t=townBy(this.to);
    return {x:t.x,y:t.y,name:t.name};
  }
  todo(){
    return 'Deliver to '+this.to+'.';
  }
  arrive(t){
    if(this.to!==t.name)return;
    addRep(t.name,3,true);
    this.pay(t.name);
  }
}
// reinforcements: troops of a tier or better handed over to the garrison (the greenest that qualify first)
class TroopsQuest extends Quest{
  setup(t){
    this.n=questRng().int(3,5);
    this.tier=2;
    this.days=12;
    this.title='Reinforce '+t.name;
    this.text='The garrison of '+t.name+' is thin. Hand over '+this.n+' troops of tier 2 or better.';
    this.pays(45*this.n,6,8,25);
  }
  get handsOver(){
    return true;
  }
  have(){
    return Object.keys(P.troops).reduce((a,k)=>a+(ST[k].tier>=this.tier?P.troops[k]:0),0);
  }
  ready(){
    return this.have()>=this.n;
  }
  progress(){
    return this.have()+' / '+this.n+' troops of tier '+this.tier+'+';
  }
  handOver(t){
    let n=this.n;
    for(const k of Object.keys(P.troops).sort((a,b)=>ST[a].tier-ST[b].tier)){
      while(n&&ST[k].tier>=this.tier&&P.troops[k]>0){
        P.remove(k);
        n--;
        t.gar=Math.min(t.T.gar+6,t.gar+1);
      }
    }
  }
}
// a lord's war work: one of the enemy's lords beaten in the field (by you, or yielding to you)
class LordkillQuest extends Quest{
  setup(t,lord){
    const foes=W.lords.filter(o=>!o.dead&&atWar(this.fac,o.fac));
    if(!foes.length)return false;
    const f=questRng().pick(foes);
    this.target=f.name;
    this.tfac=f.fac;
    this.days=20;
    this.title='Defeat '+f.name;
    this.text=lord.name+' wants '+f.name+' of the '+FACS[f.fac].n+' beaten in the field.';
    this.pays(280,0,15,80);
  }
  begin(){
    this.x=null;
  }
  seek(){
    const l=W.lords.find(x=>x.name===this.target&&!x.dead);
    return l?{x:l.x,y:l.y,name:this.target}:null;
  }
  get deed(){
    return 'lord:beaten';
  }
  hits(d){
    return d.lord.name===this.target;
  }
}
// a lord's war work for his own vassals: the nearest unwalled enemy village raided to the ground
class RaidQuest extends Quest{
  setup(t,lord){
    const vs=TOWNS.filter(v=>!walled(v)&&atWar(this.fac,v.owner));
    if(!vs.length)return false;
    const v=vs.sort((a,b)=>qTiles(a,t)-qTiles(b,t))[0];
    this.village=v.name;
    this.days=12;
    this.title='Raid '+v.name;
    this.text=lord.name+' wants the '+FACS[v.owner].n+' village of '+v.name+' raided.';
    this.pays(160,0,10,40);
  }
  begin(){
    const v=townBy(this.village);
    this.x=v.x;
    this.y=v.y;
  }
  seek(){
    const t=townBy(this.village);
    return {x:t.x,y:t.y,name:t.name};
  }
  get deed(){
    return 'holding:razed';
  }
  hits(d){
    return d.town.name===this.village;
  }
}
// the kinds (the holdings' boards name theirs: data/holdings.js jobs; lords give lordkill, raid, bounty and beast: lordJob)
defineKinds('quest',{},{
  bounty:{cls:BountyQuest},
  beast:{cls:BeastQuest},
  clear:{cls:ClearQuest},
  supply:{cls:SupplyQuest},
  hunt:{cls:HuntQuest},
  courier:{cls:CourierQuest},
  troops:{cls:TroopsQuest},
  lordkill:{cls:LordkillQuest},
  raid:{cls:RaidQuest},
});
// their deeds heard on the bus (core/bus.js): a band beaten, a beast slain, a site cleared, a lord beaten, a holding razed
Quest.listen();
/* making offers */
const makeQuest=(type,t,lord)=>Quest.make(type,t,lord);
function jobsAt(t){
  P.jobs=P.jobs||{};const j=P.jobs[t.name];
  if(!j||Clock.daysSince(j.day)>=JOB_REFRESH){const list=[],kinds=t.T.jobs.slice();
    for(let k=0;k<12&&list.length<JOB_OFFERS;k++){const q=makeQuest(questRng().pick(kinds),t);if(q&&!list.some(o=>o.type===q.type))list.push(q)}
    P.jobs[t.name]={day:G.day,list}}
  return P.jobs[t.name].list;
}
// a lord's job: war work if his faction is at war (raids only for those who serve him), else a bounty or a beast near his lands
function lordJob(l){
  const t=Spatial.nearest(fiefsOf(l.fac).length?fiefsOf(l.fac):TOWNS,l.x,l.y);const kinds=enemiesOf(l.fac).length?(P.fac===l.fac?['lordkill','raid']:['lordkill']):['bounty','beast'];
  for(let k=0;k<6;k++){const q=makeQuest(questRng().pick(kinds),t,l);if(q)return q}return null;
}
/* taking a quest, where it points, how far along it is, reporting and failing: the quest's own (story/quest.js); the names
   the panels, the map and the town call */
const acceptQuest=q=>Quest.as(q).accept();
const questGoal=q=>Quest.as(q).goal();
const questReady=q=>Quest.as(q).ready();
const questProgress=q=>Quest.as(q).progress();
const payQuest=(q,where)=>Quest.as(q).pay(where);
// hand in at a holding: takes the goods or troops it asked for
const turnIn=(q,t)=>Quest.as(q).turnIn(t);
const canReportAt=(q,t)=>Quest.as(q).reportableAt(t);
const failQuest=(q,why)=>Quest.as(q).fail(why);
// each day: deadlines pass
function questDay(){
  for(const q of P.quests.slice())Quest.as(q).lapse();
}
// arriving at a holding: couriers deliver
function questArrive(t){
  for(const q of P.quests.slice())Quest.as(q).arrive(t);
}
/* panels */
const rewardText=r=>'<span class="gold">'+r.gold+' gold</span>'+(r.rep?' · +'+r.rep+' reputation':'')+(r.honor?' · +'+r.honor+' honor':'')+(r.xp?' · '+r.xp+' XP':'');
function jobsBody(t){
  const here=P.quests.filter(q=>canReportAt(q,t)),offers=jobsAt(t),full=Quest.jobs()>=QUEST_MAX,st=standingAt(t);
  const row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  return '<div class="lab">Your quests here</div>'+(here.length?here.map(q=>row(q.title,questProgress(q)+' · '+rewardText(q.reward),'<button class="btn sm" type="button" data-act="q-turnin" data-arg="'+q.id+'"'+(questReady(q)?'':' disabled')+'>'+(Quest.as(q).handsOver?'Hand over':'Report')+'</button>')).join(''):'<p class="muted">None.</p>')+
    '<div class="lab" style="margin-top:6px">Work offered · '+Quest.jobs()+' / '+QUEST_MAX+' quests taken</div>'+
    (st<-10?'<p class="muted">Nobody here trusts you with work. Raise your standing first.</p>':offers.length?offers.map((q,i)=>row(q.title,q.text+' '+q.days+' days. Reward: '+rewardText(q.reward),'<button class="btn sm" type="button" data-act="q-accept" data-arg="'+i+'"'+(full?' disabled title="You have too many quests"':'')+'>Accept</button>')).join(''):'<p class="muted">No more work this week.</p>');
}
function questsBody(){
  if(!P.quests.length)return '<p class="muted">No quests. Look for work in the Jobs tab of any holding, or ask a friendly lord.</p>';
  return P.quests.map(q=>{const g=questGoal(q),d=g?Math.round(qTiles(g,P)):0;return '<div class="row"><div class="info"><strong>'+q.title+'</strong><small>'+q.text+'</small><small class="'+(q.done||questReady(q)?'good':'')+'">'+questProgress(q)+'</small>'+
    '<small>'+(g?'Go '+(d<2?'here':d+' tiles '+compass(g.x-P.x,g.y-P.y))+(g.name?' to '+g.name:'')+'. ':'')+(q.days?(q.due-G.day)+' days left · ':'')+Quest.as(q).rewardLine()+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="q-abandon" data-arg="'+q.id+'">Abandon</button></div></div>'}).join('');
}
// town actions (from the town screen) and log actions (from the character screen)
function questAct(a,arg,t){
  if(!a.startsWith('q-'))return false;
  if(a==='q-accept'&&t){const list=jobsAt(t),q=list[+arg];if(q&&standingAt(t)>=-10&&acceptQuest(q))list.splice(+arg,1)}
  else if(a==='q-turnin'&&t){const q=questBy(+arg);if(q&&canReportAt(q,t)){if(q.done&&!Quest.as(q).handsOver)payQuest(q,t.name);else turnIn(q,t)}}
  else if(a==='q-abandon'){const q=questBy(+arg);if(q)Quest.as(q).abandon()}
  else if(a==='q-lord'&&G.enc&&G.enc.kind==='lord'){const l=G.enc.ref;if(G.lordJob&&acceptQuest(G.lordJob)){G.lordJob=null;l.asked=G.day}lordMeet(l);return true}
  else if(a==='q-lord-report'&&G.enc&&G.enc.kind==='lord'){const l=G.enc.ref,t=lordPayAt(l);P.quests.filter(q=>q.lord&&q.giver===l.name&&q.done).forEach(q=>payQuest(q,t&&t.name));lordMeet(l);return true}
  return 'refresh';
}
// where a lord's report is paid (the reputation's holding): his realm's holding nearest him; his realm holding none, the nearest
// holding not hostile to you; none at all: null, paid by the lord himself (no holding's reputation, the rest of the reward as ever)
const lordPayAt=l=>Spatial.nearest(fiefsOf(l.fac),l.x,l.y)||Spatial.nearestHolding(l.x,l.y,t=>!hostileTo(t.owner));
// the lord dialog's job section
function lordJobHtml(l){
  if(hostileTo(l.fac))return '';
  if(relWith(l)<RELATION.jobsAt)return '<p class="muted">'+l.name+' has no work for you.</p>';
  const done=P.quests.filter(q=>q.lord&&q.giver===l.name&&q.done),mine=P.quests.find(q=>q.lord&&q.giver===l.name);
  if(done.length)return '<p class="gold">'+l.name+' hears your report.</p><div class="btns"><button class="btn primary" type="button" data-act="q-lord-report">Report: '+done.map(q=>q.title).join(', ')+'</button></div>';
  if(mine)return '<p class="muted">You are working for '+l.name+': '+mine.title+'.</p>';
  if(honorWith(l.fac)<0)return '<p class="muted">'+l.name+' has no work for someone the '+FACS[l.fac].n+' distrusts.</p>';
  if(l.asked===G.day)return '';
  if(!G.lordJob||G.lordJob.giver!==l.name)G.lordJob=lordJob(l);const q=G.lordJob;
  return q?'<div class="row"><div class="info"><strong>'+q.title+'</strong><small>'+q.text+' '+q.days+' days. Reward: '+rewardText(q.reward)+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="q-lord"'+(Quest.jobs()>=QUEST_MAX?' disabled':'')+'>Accept</button></div></div>':'<p class="muted">'+l.name+' has no work for you.</p>';
}
/* the map: a marker over each quest's goal (a home a step is bound for, an escort's, has its own house: gfx/worldui.js wuiEscorts) */
function drawQuestMarks(cam){
  const t=performance.now()/300;
  for(const q of P.quests){if(Quest.as(q).homeMark())continue;const g=questGoal(q);if(!g)continue;const sx=Math.round(g.x-cam.x),sy=Math.round(g.y-cam.y);
    if(sx<-10||sy<-10||sx>VW+10||sy>VH+10)continue;txt(q.done||questReady(q)?'?':'!',sx,sy-24+Math.round(Math.sin(t)*2),'#ffe040','center')}
}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'quests',order:{day:210},day:questDay});
