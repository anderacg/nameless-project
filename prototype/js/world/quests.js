'use strict';
/* ---------- quests: jobs from holdings and lords (the Quest shape: story/quest.js; the story wave, S3) ----------
   P.jobs[holding] = {day, list}: up to JOB_OFFERS offers, refreshed every JOB_REFRESH days (a lord: one at a time, G.lordJob).
   P.quests: the ones you took, as many as you like (the boards limit the work). A quest: {id, type, title, text, giver (holding
   or lord name), lord (bool), fac, taken, reward {gold, rep, honor, xp}, done, ...type fields; a timed kind's: days, due}, its
   kind's class put on it (each kind below: its offer, its target, its deed, what it takes).
   Kill, clear and raid quests are done when the deed is (heard on the world's bus, core/bus.js); you then report back.
   Deliveries are handed in where they were asked for. A courier pays on arrival. Lord quests can be reported to the lord or at
   any holding of his faction. No job fails for time (JobQuest). P.track: the one you track (ui/questwindow.js). Their numbers:
   data/quests.js (JOB_OFFERS, JOB_REFRESH, QUEST_LATE, QUEST_CLOSED, QUEST_ABANDON, JOB_NEEDS). */
const BAND_NAMES=['Red Vipers','Ash Crows','Black Hounds','Grey Wolves','Bone Saws','Mud Rats','Iron Jaws','Night Owls','Rusty Knives','Hollow Men','Crooked Spears','Burnt Hands'];
// (the jobs' own dice: the stream 'quests', core/rng.js, so a job kind added or changed never moves the world's Math.random)
const questRng=()=>rngOf('quests');
const qScale=()=>1+G.day/60,qTiles=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)/TILE;
const questBy=id=>P.quests.find(q=>q.id===id);
// (the way to a goal from you, in words: "here", or "12 tiles NE")
const questWay=g=>{const d=Math.round(qTiles(g,P));return d<2?'here':d+' tiles '+compass(g.x-P.x,g.y-P.y)};
// a free spot 8 to 16 tiles from a holding, on ground you can reach
function spotNear(t,lo,hi,ok){
  const from=startHolding(),r=questRng();
  for(let k=0;k<300;k++){const a=r.next()*6.283,d=(lo+r.next()*(hi-lo))*TILE,x=t.x+Math.cos(a)*d,y=t.y+Math.sin(a)*d,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    if(tx<2||ty<2||tx>=MW-2||ty>=MH-2||!passable(tAt(tx,ty))||!Router.reach(from,{x:(tx+.5)*TILE,y:(ty+.5)*TILE})||TOWNS.some(o=>Math.hypot(o.x-x,o.y-y)<48)||(ok&&!ok(x,y)))continue;return{x:(tx+.5)*TILE,y:(ty+.5)*TILE}}
  return null;
}
/* ---------- a job: what every kind a board or a lord offers shares (on the Quest shape, story/quest.js) ----------
   No job fails for time. A kind where time does not matter (bounty, beast, clear, hunt, troops, lordkill, raid) has no timing
   at all: it stays till it is done or given up. One where it does (timed: courier, supply) has a best-by day, its days from the
   day it was taken (due): paid in full by then, less each day after (QUEST_LATE). Each one records the day it was taken.
   The day's check (lapse) closes one the world has ended (gone(): its target broken, slain or cleared by another, or no more;
   its giver's holding gone): a share of its gold (QUEST_CLOSED) and a line, not a failure (quest:ended, how 'closed').
   Its category is the Quest shape's own, 'job' (story/quest.js): what it asks of you before it is given (needs: JOB_NEEDS,
   and its giver's trust: QuestShut), unmet, it is locked; given up (abandon), it costs by its size (penalty: QUEST_ABANDON) and
   its giver gives you no work for a while. */
class JobQuest extends Quest{
  // (the lord who gave it, if one did)
  giverLord(){
    return this.lord&&W.lords.find(l=>l.name===this.giver)||null;
  }
  // ---- what it asks of you before it is given: its giver's needs, then its kind's (JOB_NEEDS, measured by JOB_NEED), {k, what,
  // met} each; and, while its giver gives you no work (QuestShut), their trust
  needs(){
    const N=JOB_NEEDS,o={...(this.lord?N.lord:N.holding),...N.kinds[this.type]},out=[];
    for(const [k,n] of Object.entries(o)){
      const R=JOB_NEED[k],have=R.have(this);
      if(have!=null)out.push({k,what:R.what(this,n)+' (yours: '+signedNum(have)+')',met:have>=n});
    }
    const s=QuestShut.of(this);
    if(s)out.push({k:'shut',what:QuestShut.line(this,s),met:false});
    return out;
  }
  // ---- failed (given up, or in a story's step): its cost grows with its size; given up, its giver shut to you too
  penalty(){
    const K=QUEST_ABANDON,r=this.reward,n=clamp(Math.round((this.lord?K.honor*(r.honor||0):K.rep*(r.rep||0))+r.gold/K.gold),K.min,K.max);
    return this.lord?{honor:[this.fac,-n]}:{rep:[this.home,-n]};
  }
  abandonCost(){
    return super.abandonCost()+(this.lord?', and '+this.giver+' thinks less of you':'')+'; no work from '+(this.lord?'him':this.home)+' for '+QUEST_ABANDON.shut+' days';
  }
  abandon(){
    QuestShut.set(this);
    super.abandon();
  }
  get timed(){
    return false;
  }
  stamp(){
    this.taken=G.day;
    if(this.timed)this.due=G.day+this.days;
  }
  takenLine(){
    return this.timed?'Best by day '+this.due+'. ':'';
  }
  // ---- its timing: days past its best-by day, the share of its gold it pays now, the gold
  late(){
    return this.timed&&this.due!=null?Math.max(0,G.day-this.due):0;
  }
  payShare(){
    return Math.max(QUEST_LATE.floor,1-QUEST_LATE.perDay*this.late());
  }
  earned(){
    return Math.round(this.reward.gold*this.payShare());
  }
  timing(){
    if(!this.timed)return 'No time limit';
    const by=this.due!=null?this.due:G.day+this.days,left=by-G.day;
    if(left>=0)return 'Best by day '+by+' ('+left+' day'+(left===1?'':'s')+' left); later pays less';
    return 'Best by day '+by+', '+(-left)+' day'+(left===-1?'':'s')+' past: it pays '+Math.round(this.payShare()*100)+'% now';
  }
  // ---- its steps: what to do (where it is now, how far along), then where to report
  steps(){
    const g=this.goal(),w=g&&!this.done&&!this.handsOver?this.where(g):'',t=this.tally(),r=this.reportLine();
    const s=[[this.aim()+(w?', '+w:'')+(t?'; '+t:''),this.ready()]];
    if(r&&!this.handsOver&&this.reportsBack)s.push(['Then report back '+r[0].toLowerCase()+r.slice(1),false]);
    return s;
  }
  aim(){
    return this.title;
  }
  where(g){
    return questWay(g);
  }
  tally(){
    return this.handsOver?this.progress():(this.done?1:0)+' / 1 '+this.deedWord;
  }
  get deedWord(){
    return 'done';
  }
  get reportsBack(){
    return true;
  }
  // ---- the day's check: never failed for time; closed when the world has ended it
  lapse(){
    if(!this.done&&this.gone())this.close();
  }
  gone(){
    if(this.lord)return !!W.dead[this.fac];
    const h=townBy(this.home);
    return !h||!!h.gone;
  }
  goneWhy(){
    return this.lord?'The '+FACS[this.fac].n+' has fallen.':this.home+' is no more.';
  }
  close(){
    const g=Math.round(this.reward.gold*QUEST_CLOSED.gold);
    P.gold+=g;
    P.quests=P.quests.filter(x=>x!==this);
    Quest.unmark(this.id);
    log('Quest over: '+this.title+'. '+this.goneWhy()+' You are paid '+g+' gold for your trouble.','gold','story',this.journalKey);
    this.announceEnd('closed');
  }
}
/* ---------- the job kinds: one class each (on JobQuest), its own rules only ---------- */
// a bounty: a band of its own name near the holding; done when you break it (in a fight, or it gives up to you)
class BountyQuest extends JobQuest{
  setup(t){
    this.band=questRng().pick(BAND_NAMES);
    this.n=questRng().int(4,6)+Math.floor(G.day/12);
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
  where(g){
    return 'last seen '+questWay(g);
  }
  get deedWord(){
    return 'broken';
  }
  // (broken by another: none of its quarry is left anywhere)
  gone(){
    return super.gone()||!Quest.quarry(this.id).some(o=>!o.gone);
  }
  goneWhy(){
    return super.gone()?super.goneWhy():'Someone else broke the '+this.band+'.';
  }
}
// a beast hunt: bigger beasts of the holding's lands, set near it; done when they are slain
class BeastQuest extends JobQuest{
  setup(t){
    const c=t.clim,ids=Object.keys(MONSTERS).filter(id=>MONSTERS[id].where.includes(c)||MONSTERS[id].where.includes('forest')&&c==='grass');
    if(!ids.length)return false;
    this.mon=questRng().pick(ids);
    const M=MONSTERS[this.mon];
    this.n=Math.max(M.count[0],M.count[1]);
    this.lv=monLevel(questRng())+1;
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
  get deedWord(){
    return 'slain';
  }
  gone(){
    return super.gone()||!W.monsters.some(m=>m.qid===this.id);
  }
  goneWhy(){
    return super.gone()?super.goneWhy():'Someone else killed the '+MONSTERS[this.mon].n.toLowerCase()+'.';
  }
}
// a clearance: the nearest lair or camp that troubles the holding, marked on your map; done when it is cleared
class ClearQuest extends JobQuest{
  setup(t){
    const s=W.sites.filter(x=>x.clearJob&&!x.cleared&&qTiles(x,t)<35).sort((a,b)=>qTiles(a,t)-qTiles(b,t))[0];
    if(!s)return false;
    this.site=s.i;
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
  get deedWord(){
    return 'cleared';
  }
  gone(){
    const s=W.sites[this.site];
    return super.gone()||!s||!!s.cleared;
  }
  goneWhy(){
    const s=W.sites[this.site];
    return super.gone()?super.goneWhy():s?'Someone else cleared the '+s.name+'.':'The place is gone.';
  }
}
// a supply run: a lasting good the holding is short of, handed over into its stock
class SupplyQuest extends JobQuest{
  get timed(){
    return true;
  }
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
  aim(){
    return 'Bring '+this.n+' '+GOODS[this.good].n.toLowerCase()+' to '+this.home;
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
class HuntQuest extends JobQuest{
  setup(t){
    const hides=questRng().chance(.4);
    this.mat=hides?'hide':null;
    this.good=hides?null:'meat';
    this.n=hides?questRng().int(3,5):questRng().int(12,20);
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
  aim(){
    return 'Bring '+this.n+' '+(this.mat?'deer hides':'meat')+' to '+this.home;
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
class CourierQuest extends JobQuest{
  get timed(){
    return true;
  }
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
  aim(){
    return 'Carry the letter to '+this.to;
  }
  tally(){
    return '';
  }
  // (paid on arrival: nothing to report)
  reportLine(){
    return 'Paid on arrival at '+this.to;
  }
  get reportsBack(){
    return false;
  }
  gone(){
    const d=townBy(this.to);
    return super.gone()||!d||!!d.gone;
  }
  goneWhy(){
    return super.gone()?super.goneWhy():this.to+' is no more.';
  }
  arrive(t){
    if(this.to!==t.name)return;
    addRep(t.name,3,true);
    this.pay(t.name);
  }
}
// reinforcements: troops of a tier or better handed over to the garrison (the greenest that qualify first)
class TroopsQuest extends JobQuest{
  setup(t){
    this.n=questRng().int(3,5);
    this.tier=2;
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
  aim(){
    return 'Hand over '+this.n+' troops of tier '+this.tier+' or better at '+this.home;
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
class LordkillQuest extends JobQuest{
  setup(t,lord){
    const foes=W.lords.filter(o=>!o.dead&&atWar(this.fac,o.fac));
    if(!foes.length)return false;
    const f=questRng().pick(foes);
    this.target=f.name;
    this.tfac=f.fac;
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
  where(g){
    return 'last seen '+questWay(g);
  }
  get deedWord(){
    return 'beaten';
  }
  // (gone for good: his realm fallen)
  gone(){
    const l=W.lords.find(x=>x.name===this.target);
    return super.gone()||!l||!!l.gone;
  }
  goneWhy(){
    return super.gone()?super.goneWhy():this.target+' is gone from the field for good.';
  }
}
// a lord's war work for his own vassals: the nearest unwalled enemy village raided to the ground
class RaidQuest extends JobQuest{
  setup(t,lord){
    const vs=TOWNS.filter(v=>!walled(v)&&atWar(this.fac,v.owner));
    if(!vs.length)return false;
    const v=vs.sort((a,b)=>qTiles(a,t)-qTiles(b,t))[0];
    this.village=v.name;
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
  get deedWord(){
    return 'raided';
  }
  // (gone: no more, or his realm's own now)
  gone(){
    const v=townBy(this.village);
    return super.gone()||!v||!!v.gone||v.owner===this.fac;
  }
  goneWhy(){
    const v=townBy(this.village);
    return super.gone()?super.goneWhy():v&&!v.gone?this.village+' is the '+FACS[this.fac].n+'’s own now.':this.village+' is no more.';
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
/* what a job's needs measure (JOB_NEEDS, data/quests.js): yours now (null: nothing to measure), and its words */
const signedNum=n=>(n<0?'−':'')+Math.abs(Math.round(n));
const JOB_NEED={
  standing:{have:q=>{const t=townBy(q.home);return t?standingAt(t):null},what:(q,n)=>'standing '+signedNum(n)+' at '+q.home},
  rel:{have:q=>{const l=q.giverLord();return l?Math.round(relWith(l)):null},what:(q,n)=>q.giver+'’s regard '+signedNum(n)},
  honor:{have:q=>Math.round(honorWith(q.fac)),what:(q,n)=>'honor '+signedNum(n)+' with the '+FACS[q.fac].n},
  renown:{have:()=>P.renown,what:(q,n)=>'renown '+n},
  level:{have:()=>P.level,what:(q,n)=>'level '+n},
};
/* the givers who give you no work for a while (you gave up one of their jobs: QUEST_ABANDON.shut days): P.shut by key (a
   holding's name; a lord's, 'lord:' and his name), {until (the day work comes again), what (the job given up)}; none: no field,
   so a save without one is as it was. The day's check drops those over */
const QuestShut={
  key:q=>q.lord?'lord:'+q.giver:q.home,
  set(q){
    (P.shut||(P.shut={}))[this.key(q)]={until:G.day+QUEST_ABANDON.shut,what:q.title};
  },
  // (q: a job or offer, or {home} a holding's, {lord, giver} a lord's)
  of(q){
    const s=P.shut&&P.shut[this.key(q)];
    return s&&G.day<s.until?s:null;
  },
  line(q,s){
    return (q.lord?q.giver+' has no work for you':'No work for you here')+' until day '+s.until+' (you gave up '+(q.lord?'his':'their')+' '+s.what+')';
  },
  day(){
    if(!P.shut)return;
    for(const k of Object.keys(P.shut))if(G.day>=P.shut[k].until)delete P.shut[k];
    if(!Object.keys(P.shut).length)delete P.shut;
  },
};
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
// each day: each quest's check (a step's or an escort's due day; a job's target gone: JobQuest)
function questDay(){
  for(const q of P.quests.slice())Quest.as(q).lapse();
  QuestShut.day();
}
// arriving at a holding: couriers deliver
function questArrive(t){
  for(const q of P.quests.slice())Quest.as(q).arrive(t);
}
/* the one you track (P.track: 'q' and a quest's id, or 't' and a story's number; none tracked: no field, so a save without one
   is as it was): its quest (a story's: the quest its step waits on) and that quest's goal; untracked once it ends */
const QuestTrack={
  key(){
    return P.track||null;
  },
  set(k){
    if(k)P.track=k;
    else delete P.track;
  },
  thread(k){
    return k&&k[0]==='t'?Thread.list().on.find(th=>th.i===+k.slice(1))||null:null;
  },
  quest(k){
    if(!k)return null;
    if(k[0]==='q')return questBy(+k.slice(1))||null;
    const th=this.thread(k),w=th&&th.wait;
    return w&&w.shape==='quest'&&questBy(w.id)||null;
  },
  goal(k){
    const q=this.quest(k);
    return q?questGoal(q):null;
  },
  // (is quest q the tracked one, or the one the tracked story waits on)
  on(q){
    const k=P.track;
    return !!k&&this.quest(k)===q;
  },
};
worldOn('quest:ended',d=>{if(d&&d.e&&P.track==='q'+d.e.id)QuestTrack.set(null)});
worldOn('thread:ended',d=>{if(d&&d.e&&P.track==='t'+d.e.i)QuestTrack.set(null)});
/* panels */
const rewardText=r=>'<span class="gold">'+r.gold+' gold</span>'+(r.rep?' · +'+r.rep+' reputation':'')+(r.honor?' · +'+r.honor+' honor':'')+(r.xp?' · '+r.xp+' XP':'');
// a quest's facts, [label, html] each: who gave it, the day taken, its timing, where it is turned in, its reward (a late one's
// pay now); an offer's the same before you take it, and what it requires that you lack (its giver's trust aside: QuestShut's
// line, said once where its offers are)
function questFacts(q){
  q=Quest.as(q);
  const f=[['Given by',q.givenBy()]],tm=q.timing(),r=q.reportLine(),late=q.earned()<q.reward.gold;
  const need=q.id==null?q.needs().filter(n=>!n.met&&n.k!=='shut'):[];
  if(need.length)f.push(['Requires','<span class="bad">'+need.map(n=>n.what).join(' · ')+'</span>']);
  if(q.taken!=null)f.push(['Taken','Day '+q.taken]);
  if(tm)f.push(['Timing',late?'<span class="bad">'+tm+'</span>':tm]);
  if(r)f.push(['Turn in',r]);
  f.push(['Reward',q.rewardLine()+(late?' · <span class="bad">now '+q.earned()+' gold</span>':'')]);
  return f;
}
const questFactsHtml=q=>'<dl class="qfacts">'+questFacts(q).map(([k,v])=>'<dt>'+k+'</dt><dd>'+v+'</dd>').join('')+'</dl>';
// an offer (a board's, a lord's): its text and facts, and Accept (act, arg); locked, greyed, its Accept off, what it requires in
// its facts
function offerRow(q,act,arg){
  q=Quest.as(q);
  const lock=q.state==='locked';
  return '<div class="row'+(lock?' locked':'')+'"><div class="info"><strong>'+q.title+(lock?' <span class="qw-st locked">'+QUEST_STATES.locked+'</span>':'')+'</strong><small>'+q.text+'</small>'+questFactsHtml(q)+'</div>'+
    '<div class="acts"><button class="btn sm" type="button" data-act="'+act+'" data-arg="'+arg+'"'+(lock?' disabled title="'+htmlText(q.needs().filter(n=>!n.met).map(n=>n.what).join('; '))+'"':'')+'>Accept</button></div></div>';
}
// the notice board: your quests to report here, then the work offered (none for you a while after you gave up one of theirs)
function jobsBody(t){
  const here=P.quests.filter(q=>canReportAt(q,t)),offers=jobsAt(t),n=Quest.jobs(),shut=QuestShut.of({home:t.name});
  const row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong>'+sub+'</div><div class="acts">'+acts+'</div></div>';
  return '<div class="lab">Your quests here</div>'+(here.length?here.map(q=>row(q.title,'<small>'+questProgress(q)+' · '+Quest.as(q).rewardLine()+'</small>','<button class="btn sm" type="button" data-act="q-turnin" data-arg="'+q.id+'"'+(questReady(q)?'':' disabled')+'>'+(Quest.as(q).handsOver?'Hand over':'Report')+'</button>')).join(''):'<p class="muted">None.</p>')+
    '<div class="lab" style="margin-top:6px">Work offered · you hold '+n+' job'+(n===1?'':'s')+'</div>'+
    (shut?'<p class="bad">'+QuestShut.line({home:t.name},shut)+'.</p>':'')+
    (offers.length?offers.map((q,i)=>offerRow(q,'q-accept',i)).join(''):'<p class="muted">No more work this week.</p>');
}
// town actions (from the town screen) and log actions (from the character screen)
function questAct(a,arg,t){
  if(!a.startsWith('q-'))return false;
  if(a==='q-accept'&&t){const list=jobsAt(t),q=list[+arg];if(q&&Quest.as(q).state==='available'&&acceptQuest(q))list.splice(+arg,1)}
  else if(a==='q-turnin'&&t){const q=questBy(+arg);if(q&&canReportAt(q,t)){if(q.done&&!Quest.as(q).handsOver)payQuest(q,t.name);else turnIn(q,t)}}
  // (only a job may be given up: never a main or side quest, nor a story's stage)
  else if(a==='q-abandon'){const q=questBy(+arg);if(q&&Quest.as(q).abandonable)Quest.as(q).abandon()}
  else if(a==='q-lord'&&G.enc&&G.enc.kind==='lord'){const l=G.enc.ref;if(G.lordJob&&Quest.as(G.lordJob).state==='available'&&acceptQuest(G.lordJob)){G.lordJob=null;l.asked=G.day}lordMeet(l);return true}
  else if(a==='q-lord-report'&&G.enc&&G.enc.kind==='lord'){const l=G.enc.ref,t=lordPayAt(l);P.quests.filter(q=>q.lord&&q.giver===l.name&&q.done).forEach(q=>payQuest(q,t&&t.name));lordMeet(l);return true}
  return 'refresh';
}
// where a lord's report is paid (the reputation's holding): his realm's holding nearest him; his realm holding none, the nearest
// holding not hostile to you; none at all: null, paid by the lord himself (no holding's reputation, the rest of the reward as ever)
const lordPayAt=l=>Spatial.nearest(fiefsOf(l.fac),l.x,l.y)||Spatial.nearestHolding(l.x,l.y,t=>!hostileTo(t.owner));
// the lord dialog's job section: your report; the one you work on for him; else his offer (locked: greyed, with what it requires,
// his regard and your honour among them, JOB_NEEDS; none for you a while after you gave up one of his: QuestShut)
function lordJobHtml(l){
  if(hostileTo(l.fac))return '';
  const done=P.quests.filter(q=>q.lord&&q.giver===l.name&&q.done),mine=P.quests.find(q=>q.lord&&q.giver===l.name);
  if(done.length)return '<p class="gold">'+l.name+' hears your report.</p><div class="btns"><button class="btn primary" type="button" data-act="q-lord-report">Report: '+done.map(q=>q.title).join(', ')+'</button></div>';
  if(mine)return '<p class="muted">You are working for '+l.name+': '+mine.title+'.</p>';
  if(l.asked===G.day)return '';
  if(!G.lordJob||G.lordJob.giver!==l.name)G.lordJob=lordJob(l);
  const q=G.lordJob&&Quest.as(G.lordJob);
  if(!q)return '<p class="muted">'+l.name+' has no work for you.</p>';
  if(q.state==='available')return offerRow(q,'q-lord','');
  const s=QuestShut.of(q);
  return '<p class="muted">'+(s?QuestShut.line(q,s):l.name+' has no work for you yet')+'.</p>'+offerRow(q,'q-lord','');
}
/* the map: a marker over each quest's goal (a home a step is bound for, an escort's, has its own house: gfx/worldui.js
   wuiEscorts); the tracked one's the strongest: brackets round its goal, its mark brighter, an arrow at the screen's edge
   while it is off it (QUEST_MARK: its colours, the arrow's inset, the minimap dots' sizes) */
const QUEST_MARK={col:'#ffe040',on:'#fff6c0',ring:'#ffd040',edge:14,mini:2,miniOn:4};
function drawQuestMarks(cam){
  const t=performance.now()/300,M=QUEST_MARK,bob=Math.round(Math.sin(t)*2);
  for(const q of P.quests){const Q=Quest.as(q),on=QuestTrack.on(Q),g=questGoal(q);if(!g)continue;const sx=Math.round(g.x-cam.x),sy=Math.round(g.y-cam.y);
    if(sx<-10||sy<-10||sx>VW+10||sy>VH+10){if(on)questEdgeMark(sx,sy,t);continue}
    if(on)questBrackets(sx,sy,t);
    if(Q.homeMark())continue;
    txt(q.done||questReady(q)?'?':'!',sx,sy-24+bob,on?M.on:M.col,'center')}
}
// (brackets round the tracked goal, breathing)
function questBrackets(x,y,t){
  const M=QUEST_MARK,r=9+Math.round((1+Math.sin(t*1.5))*1.5),a=3;
  for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const cx=x+dx*r,cy=y-6+dy*r;rect(ctx,M.ring,dx<0?cx:cx-a+1,cy,a,1);rect(ctx,M.ring,cx,dy<0?cy:cy-a+1,1,a)}
}
// (an arrow at the screen's edge toward the tracked goal off it)
function questEdgeMark(sx,sy,t){
  const M=QUEST_MARK,cx=VW/2,cy=VH/2,dx=sx-cx,dy=sy-cy,k=Math.min((cx-M.edge)/Math.max(1e-6,Math.abs(dx)),(cy-M.edge)/Math.max(1e-6,Math.abs(dy)));
  ctx.save();
  ctx.translate(Math.round(cx+dx*k),Math.round(cy+dy*k));
  ctx.rotate(Math.atan2(dy,dx));
  ctx.globalAlpha=.75+.25*Math.sin(t*1.5);
  ctx.fillStyle=M.ring;
  ctx.beginPath();
  ctx.moveTo(6,0);
  ctx.lineTo(-4,-5);
  ctx.lineTo(-2,0);
  ctx.lineTo(-4,5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
// the minimap's dots (dot: gfx/render.js drawWorld's), the tracked one last, bigger, in a white ring
function drawQuestDots(dot){
  const M=QUEST_MARK;let on=null;
  for(const q of P.quests){const g=questGoal(q);if(!g)continue;if(QuestTrack.on(q))on=g;else dot(g.x,g.y,M.col,M.mini)}
  if(on){dot(on.x,on.y,'#fff',M.miniOn+2);dot(on.x,on.y,M.ring,M.miniOn)}
}
// the full map's marks (ui/map.js): each quest's goal, its title, whether it is the tracked one
const questMapMarks=()=>P.quests.map(q=>{const g=questGoal(q);return g&&{x:g.x,y:g.y,title:q.title+(g.name?': '+g.name:''),on:QuestTrack.on(q)}}).filter(Boolean);
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'quests',order:{day:210},day:questDay});
