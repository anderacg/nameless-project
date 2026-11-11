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
  // (who at the holding gave it: world/givers.js, by its key; a lord's none)
  get person(){
    return this.who?Givers.byKey(this.who):null;
  }
  givenBy(){
    const g=this.person;
    return g?Givers.label(g):super.givenBy();
  }
  /* ---- a lead (doc/QUESTS_DESIGN.md §6, Q4): a kind whose quarry moves (leads) is not pinned till you have found it. Taken, you
     know where it was then (lead {x, y, day, r}); the circle grows LEAD.grow tiles a day (to LEAD.max) as the word ages. It is
     sharpened by the talk at a holding within LEAD.ask tiles of it (hear: where it is now), and by your tracking inside the
     circle (an hour's check, QUEST_CHECKS.track: its tracks, a tight circle where it is); found once you see it (its own sight
     rule, inView), then followed as before. Plain fields, saved with it */
  get leads(){
    return false;
  }
  target(){
    return null;
  }
  markLead(o,r){
    this.lead={x:Math.round(o.x),y:Math.round(o.y),day:G.day,r:r??LEAD.r};
  }
  leadR(){
    const L=this.lead;
    return L?Math.min(LEAD.max,L.r+LEAD.grow*Math.max(0,G.day-L.day)):0;
  }
  // (where to look: the lead's circle, {x, y, r tiles}; found, seen or none: null)
  spot(){
    if(!this.leads||this.found||!this.lead)return null;
    const o=this.target();
    // (in sight; or resting inside a holding (off the map, never in view), that holding in your sight)
    const inn=o&&!o.gone&&o.inside&&townBy(o.inside);
    if(o&&!o.gone&&(o.inView&&o.inView(vis())||inn&&Math.hypot(inn.x-P.x,inn.y-P.y)<=vis())){
      this.found=true;
      log('You have found '+this.quarryName()+'.','gold','story',this.journalKey);
      return null;
    }
    this.track(o);
    return {x:this.lead.x,y:this.lead.y,r:this.leadR()};
  }
  quarryName(){
    return 'them';
  }
  track(o){
    if(!o||o.gone)return;
    const h=Math.floor(Clock.hours()),L=this.lead;
    if(this.trk===h||Math.hypot(P.x-L.x,P.y-L.y)>this.leadR()*TILE)return;
    this.trk=h;
    const k='chk:track';
    ENC_STAT[k]=ENC_STAT[k]||QUEST_CHECKS.track;
    if(!questRng().chance(statOdds(k)))return;
    this.markLead(o,LEAD.r/2);
    log('You find the tracks of '+this.quarryName()+': fresh, and close.','gold','story',this.journalKey);
  }
  // (at a holding: what they say there of it, if it is near)
  hear(t){
    if(!this.leads||this.found||this.done)return;
    const o=this.target();
    if(!o||o.gone||qTiles(o,t)>LEAD.ask)return;
    this.markLead(o);
    log('In '+t.name+' they say '+this.quarryName()+' were seen '+Math.round(qTiles(o,t))+' tiles '+compass(o.x-t.x,o.y-t.y)+' of here.','gold','story',this.journalKey);
  }
  where(g){
    return g&&g.r?'last seen '+questWay(g)+', within '+Math.round(g.r)+' tiles of there (day '+this.lead.day+')':questWay(g);
  }
  // (the true thing it is about, in a line: troubles.js, news.js)
  causeLine(){
    return this.cause||'';
  }
  // (a giver who pays partly in goods: that share of its gold in the holding's goods, Givers.goods)
  static purse(q,g,t){
    const k=Givers.goods(g,q.reward.gold,t);
    if(!k)return;
    q.reward.gold=Math.round(q.reward.gold*g.pays);
    q.reward.goods=k;
  }
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
    const g=this.person,gn=g&&GIVER_REGARD.needs[this.type];
    if(gn!=null)out.push({k:'regard',what:g.name+'’s regard '+signedNum(gn)+' (yours: '+signedNum(Givers.regard(g))+')',met:Givers.regard(g)>=gn});
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
    return super.abandonCost()+(this.lord?', and '+this.giver+' thinks less of you':'')+'; no work from '+(this.lord?pr(this.giver).him:this.home)+' for '+QUEST_ABANDON.shut+' days';
  }
  abandon(){
    QuestShut.set(this);
    Givers.change(this.person,GIVER_REGARD.left);
    super.abandon();
  }
  pay(where){
    super.pay(where);
    Givers.change(this.person,GIVER_REGARD.done);
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
  tally(){
    return this.handsOver?this.progress():(this.done?1:0)+' / 1 '+this.deedWord;
  }
  get deedWord(){
    return 'done';
  }
  get reportsBack(){
    return true;
  }
  // ---- the day's check: never failed for time; closed when the world has ended it; its holding changed hands, the new lords
  // honour it (its realm theirs now, said once: Q5)
  lapse(){
    const t=!this.lord&&townBy(this.home);
    if(t&&!t.gone&&t.owner&&t.owner!==this.fac&&!hostileTo(t.owner)){
      this.fac=t.owner;
      log(this.home+' has changed hands; the '+(FACS[t.owner]?FACS[t.owner].n:'new lords')+' will honour '+this.title+'.','gold','story',this.journalKey);
    }
    if(this.done?this.lost():this.gone())this.close();
  }
  // (done, and never to be reported: its giver's realm fallen, its holding no more. One hostile for a time is waited out)
  lost(){
    if(this.lord)return !!W.dead[this.fac];
    const h=townBy(this.home);
    return !h||!!h.gone;
  }
  // (over: its giver's realm fallen, or turned on you; its holding gone, or held by a realm hostile to you: you could never report
  // there)
  gone(){
    if(this.lord)return !!W.dead[this.fac]||hostileTo(this.fac);
    const h=townBy(this.home);
    return !h||!!h.gone||!!h.owner&&hostileTo(h.owner);
  }
  goneWhy(){
    const h=!this.lord&&townBy(this.home);
    return this.lord?(W.dead[this.fac]?'The '+FACS[this.fac].n+' has fallen.':'The '+FACS[this.fac].n+' is your enemy now.'):!h||h.gone?this.home+' is no more.':this.home+' is held by your enemies now.';
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
// a bounty: a band that really troubles the holding (troubles.js: in its lands, or the talk of a caravan robbed or a raid), the
// one marked once taken; none there, a band out of the nearest hideout or camp takes to its roads (as the world's bands come
// out of theirs), working them (haunt); no hideout near either, no bounty. Done when you break it (in a fight, or it gives up)
const BOUNTY={haunt:[5,12],near:3};
/* ---- what a job leaves (doc/QUESTS_DESIGN.md §9, Q5): paid, a bounty's or a beast hunt's holding is quiet of that trouble for
   QUEST_MARKS days (W.quiet[town][kind]: no band out of a hideout, no pack moving in, for a job there; the real ones still
   come), and the talk says so (news.js quiet); a hunt's meat goes into its stores ---------- */
const QUEST_MARKS={band:20,beast:20};
const Quiet={
  until(t,k){return ((W.quiet||{})[t.name]||{})[k]||0},
  is(t,k){return G.day<this.until(t,k)},
  set(t,k,what){((W.quiet||(W.quiet={}))[t.name]||(W.quiet[t.name]={}))[k]=G.day+QUEST_MARKS[k];newsRecord('quiet',t,{town:t.name,who:bandName(),what})}
};
// a lead's circle: r tiles when fresh, growing grow tiles a day to max; ask: tiles from a holding its talk knows of the quarry
const LEAD={r:4,grow:1.5,max:14,ask:25};
const causeOf=(it,t)=>!it?'':it.k==='caravan'?'They robbed a caravan'+(it.detail.from?' out of '+it.detail.from:'')+' on day '+it.day+'.':it.k==='raid'?'They raided '+(it.detail.town||t.name)+' on day '+it.day+'.':
  it.k==='beast'?'Seen by the fields on day '+it.day+'.':it.k==='siege'?'The siege on day '+it.day+' cut its roads.':'Seen in the lands of '+t.name+' since day '+it.day+'.';
// (a band out of the nearest hideout or camp of t (the site's own when given), n strong, working t's roads (haunt); marked qid,
// called name, with more of its record (carry: a captive); null when there is none: the bounty's, a story's band, a rescue's)
function bandOut(t,n,name,qid,site,more){
  const s=site&&!site.cleared?site:Troubles.lairs(t)[0];
  if(!s)return null;
  const r=questRng(),x=s.x+r.int(-12,12),y=s.y+r.int(10,18),kind=climAt(x,y)==='desert'?'raiders':climAt(x,y)==='swamp'?'bog':'bandits';
  const list=Rng.use('quests',()=>makeEnemies(n,false,kind)),ld=Rng.use('quests',()=>newChief(kind,2+Math.floor(G.day/20))),h=spotNear(t,...BOUNTY.haunt)||{x:t.x,y:t.y};
  const b=asParty({x,y,n,kind,list,t:0,a:0,idle:false,cool:0,qid,name,ld,haunt:{x:Math.round(h.x),y:Math.round(h.y)},...(more||{})});
  bandits.push(b);
  return b;
}
// (a band that troubles t, unmarked, marked qid and called name if it has none; else one out of its nearest hideout)
function bandFor(t,n,name,qid,more){
  const b=Troubles.bands(t).find(o=>!o.qid);
  if(b){b.qid=qid;b.name=b.name||name;if(more)Object.assign(b,more);return b}
  return bandOut(t,n,name,qid,null,more);
}
// (a pack of mon (none: any) by t's fields, unmarked, marked qid; else one of mon (none: of its land) moved into a spot of its
// habitat there (by its fields, else within PACK_FAR tiles); null when no such beast lives there)
const PACK_FAR=26;// (no habitat by its fields: as far as this many tiles, where such beasts live)
function packFor(t,mon,n,lv,qid){
  const m=Troubles.packs(t).find(o=>!o.qid&&(!mon||o.id===mon));
  if(m){m.qid=qid;return m}
  if(Quiet.is(t,'beast'))return null;
  const ids=mon?[mon]:Object.keys(MONSTERS).filter(id=>!MONSTERS[id].mythic&&(MONSTERS[id].where.includes(t.clim)||MONSTERS[id].where.includes('forest')&&t.clim==='grass'));
  if(!ids.length||!MONSTERS[ids[0]])return null;
  const id=mon||questRng().pick(ids),M=MONSTERS[id],fit=(x,y)=>M.where.some(w=>habitatAt(x,y).includes(w)),p=spotNear(t,7,TROUBLE.folds,fit)||spotNear(t,7,PACK_FAR,fit);
  if(!p)return null;
  const o=asMonster({id,x:p.x,y:p.y,hx:p.x,hy:p.y,lv,n:n||Math.max(...M.count),t:0,a:0,cool:0,qid});
  W.monsters.push(o);
  return o;
}
class BountyQuest extends JobQuest{
  setup(t){
    const b=Troubles.bands(t).find(x=>!x.qid),lair=Troubles.lairs(t)[0];
    if(b){
      this.chief=b.ld?b.ld.name:'';
      this.n=b.troops.length;
      this.lx=Math.round(b.x);
      this.ly=Math.round(b.y);
      this.band=b.name||questRng().pick(BAND_NAMES);
      this.cause=causeOf(Troubles.news(t,['caravan','raid','band'])[0],t)||'Seen in the lands of '+t.name+'.';
    }else if(lair&&!Quiet.is(t,'band')){
      this.site=lair.i;
      this.n=questRng().int(4,6)+Math.floor(G.day/12);
      this.band=questRng().pick(BAND_NAMES);
      this.cause='A band out of the '+lair.name+', '+Math.round(qTiles(lair,t))+' tiles '+compass(lair.x-t.x,lair.y-t.y)+', has taken to the roads by '+t.name+'.';
    }else return false;
    this.title='Bounty: the '+this.band;
    this.text=(this.chief?this.chief+' and the ':'The ')+this.band+', about '+this.n+' strong, prey on the roads near '+t.name+'. Find them and break them.';
    this.pays(50+14*this.n,8,3,20+5*this.n);
  }
  // (the band it named, if it is still about; else any that troubles the holding; else one out of the hideout)
  begin(t){
    let b=null;
    if(this.site==null)b=bandits.find(o=>!o.qid&&!o.gone&&!o.fight&&(this.chief?o.ld&&o.ld.name===this.chief:Math.hypot(o.x-this.lx,o.y-this.ly)<TROUBLE.land*TILE))||Troubles.bands(t).find(o=>!o.qid);
    if(b){
      // (another band than it named, its chief another: its words follow the band marked)
      const was=this.chief,now=b.ld&&b.ld.name||null;if(was&&now!==was){this.chief=now;if(now)this.text=this.text.split(was).join(now)}
      b.qid=this.id;
      b.name=b.name||this.band;
      this.band=b.name;
      this.x=b.x;
      this.y=b.y;
      this.markLead(b);
      return;
    }
    const o=bandOut(t,this.n,this.band,this.id,this.site!=null?W.sites[this.site]:null);
    if(!o)return false;
    this.chief=o.ld.name;
    this.x=o.x;
    this.y=o.y;
    this.markLead(o);
  }
  get leads(){
    return true;
  }
  target(){
    return bandits.find(x=>x.qid===this.id)||Quest.quarry(this.id)[0]||null;
  }
  quarryName(){
    return 'the '+this.band;
  }
  aim(){
    return 'Break the '+this.band;
  }
  // (on the map, or gone to ground in a camp: its quarry, story/quest.js)
  seek(){
    const h=this.lair!=null&&W.sites[this.lair];
    if(h&&this.hideOf()===h)return {x:h.x,y:h.y,name:'the '+this.band+' at the '+h.name};
    const b=this.target();
    if(!b)return null;
    const s=this.spot();
    return s?{...s,name:'the '+this.band}:{x:b.x,y:b.y,name:(b.ld?b.ld.name+' and ':'')+'the '+this.band};
  }
  get deed(){
    return 'band:beaten';
  }
  hits(d){
    return d.band.qid===this.id;
  }
  where(g){
    return g.r?super.where(g):'last seen '+questWay(g);
  }
  get deedWord(){
    return 'broken';
  }
  // (a turn, Q5: gone to ground in a hideout or camp: the place it shelters, found, marked; said once)
  hideOf(){
    return W.sites.find(s=>(s.bands||[]).some(b=>b.qid===this.id))||null;
  }
  lapse(){
    const h=!this.done&&this.hideOf();
    if(h&&this.lair!==h.i){
      this.lair=h.i;
      h.seen=true;
      log('The '+this.band+' have gone to ground at the '+h.name+'.','gold','story',this.journalKey);
    }else if(!h&&this.lair!=null)delete this.lair;
    super.lapse();
  }
  // (paid: its holding quiet of bands a while, QUEST_MARKS)
  pay(where){
    super.pay(where);
    const t=townBy(this.home);
    if(t&&!this.lord)Quiet.set(t,'band','the '+this.band);
    Chains.bounty(this);// (its chief got away: The chief who ran, story/chains.js)
  }
  // (broken by another: none of its quarry is left anywhere)
  gone(){
    return super.gone()||!Quest.quarry(this.id).some(o=>!o.gone)&&!this.hideOf();
  }
  goneWhy(){
    return super.gone()?super.goneWhy():'Someone else broke the '+this.band+'.';
  }
}
// beasts at the folds: a pack whose lair lies by the holding's fields (troubles.js packs), the one marked once taken; none, a pack of
// the land's (where such beasts live: a spot of its habitat by its fields, else none) has moved in. Done when they are slain
class BeastQuest extends JobQuest{
  setup(t){
    const m=Troubles.packs(t).find(x=>!x.qid&&MONSTERS[x.id]);
    if(m){
      this.mon=m.id;
      this.n=m.n;
      this.lv=m.lv;
      this.mx=Math.round(m.hx??m.x);
      this.my=Math.round(m.hy??m.y);
      this.cause=causeOf(Troubles.news(t,['beast'])[0],t)||'Their lair lies '+Math.round(qTiles({x:this.mx,y:this.my},t))+' tiles '+compass(this.mx-t.x,this.my-t.y)+' of the fields.';
    }else{
      if(Quiet.is(t,'beast'))return false;
      const c=t.clim,ids=Object.keys(MONSTERS).filter(id=>!MONSTERS[id].mythic&&(MONSTERS[id].where.includes(c)||MONSTERS[id].where.includes('forest')&&c==='grass'));
      if(!ids.length)return false;
      this.mon=questRng().pick(ids);
      const M=MONSTERS[this.mon],p=spotNear(t,7,TROUBLE.folds,(x,y)=>M.where.some(w=>habitatAt(x,y).includes(w)));
      if(!p)return false;
      this.n=Math.max(M.count[0],M.count[1]);
      this.lv=monLevel(questRng())+1;
      this.mx=Math.round(p.x);
      this.my=Math.round(p.y);
      this.stage=true;
      this.cause='Tracks and torn fleeces: something has made its lair '+Math.round(qTiles(p,t))+' tiles '+compass(p.x-t.x,p.y-t.y)+' of '+t.name+'.';
    }
    const M=MONSTERS[this.mon];
    this.title='Beasts at the folds: '+M.n.toLowerCase();
    this.text=(this.n>1?cap1(M.n.toLowerCase())+' have':'A '+M.n.toLowerCase()+' has')+' been taking livestock outside '+t.name+'. Kill '+(this.n>1?'them':'it')+'.';
    this.pays(40+M.xp*this.n*.9,8,2,0);
  }
  // (the pack it named, if it is still there; else the one that moved in, at its lair)
  begin(t){
    const m=!this.stage&&W.monsters.find(o=>!o.qid&&o.id===this.mon&&o.n>0&&Math.hypot((o.hx??o.x)-this.mx,(o.hy??o.y)-this.my)<BOUNTY.near*TILE)||Troubles.packs(t).find(o=>!o.qid&&o.id===this.mon);
    if(m){
      m.qid=this.id;
      this.x=m.x;
      this.y=m.y;
      this.markLead(m);
      return;
    }
    if(this.mx==null)return false;
    // (the pack it named already another's work (a neighbour's board): no second pack at its lair)
    if(W.monsters.some(o=>o.qid&&o.id===this.mon&&Math.hypot((o.hx??o.x)-this.mx,(o.hy??o.y)-this.my)<BOUNTY.near*TILE)){log('Someone has already taken that work.','muted','story');return false}
    W.monsters.push(asMonster({id:this.mon,x:this.mx,y:this.my,hx:this.mx,hy:this.my,lv:this.lv,n:this.n,t:0,a:0,cool:0,qid:this.id}));
    this.x=this.mx;
    this.y=this.my;
    this.markLead({x:this.mx,y:this.my});
  }
  get leads(){
    return true;
  }
  target(){
    return W.monsters.find(x=>x.qid===this.id)||null;
  }
  quarryName(){
    return 'the '+MONSTERS[this.mon].n.toLowerCase();
  }
  aim(){
    return 'Slay '+this.quarryName()+' at the folds';
  }
  // (paid: its fields quiet of beasts a while, QUEST_MARKS)
  pay(where){
    super.pay(where);
    const t=townBy(this.home);
    if(t&&!this.lord)Quiet.set(t,'beast','the '+MONSTERS[this.mon].n.toLowerCase());
    Chains.beast(this);// (a cave near: Something bigger, story/chains.js)
  }
  seek(){
    const m=this.target();
    if(!m)return null;
    const s=this.spot();
    return s?{...s,name:MONSTERS[this.mon].n.toLowerCase()}:{x:m.x,y:m.y,name:MONSTERS[this.mon].n.toLowerCase()};
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
// a clearance: the nearest lair or camp, marked on your map, while what comes out of it troubles the holding (troubles.js: its
// bands, or the talk of robberies and raids; a beast's cave, its packs by the fields); done when it is cleared
class ClearQuest extends JobQuest{
  // (its need read off the world: passed before it is taken, no work: story/quest.js accept)
  needless(){
    return this.gone();
  }
  setup(t){
    const T=Troubles,bands=T.bands(t).length>0||T.news(t,['caravan','raid','band']).length>0,beasts=T.packs(t).length>0;
    const s=W.sites.filter(x=>x.clearJob&&!x.cleared&&qTiles(x,t)<35&&(x instanceof Lair?bands:beasts)).sort((a,b)=>qTiles(a,t)-qTiles(b,t))[0];
    if(!s)return false;
    this.site=s.i;
    this.cause=s instanceof Lair?causeOf(T.news(t,['caravan','raid','band'])[0],t)||'Its bands go to ground there.':'The beasts by the fields come out of it.';
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
// a supply run: a lasting good the holding is short of, handed over into its stock; its days by how long its stock lasts
// (SUPPLY_JOB.days: from min, the emptier the sooner, up to max), paid by its price there (× price) at the least as before;
// as many as about worth gold of it buys at its price there (8–15 of a cheap good, least of a dear one: silver, wine)
const SUPPLY_JOB={days:[5,16,20],price:1.25,worth:240,least:2};
class SupplyQuest extends JobQuest{
  // (its need read off the world: passed before it is taken, no work: story/quest.js accept)
  needless(){
    return this.gone();
  }
  get timed(){
    return true;
  }
  setup(t){
    ensureEcon(t);
    const goods=Object.keys(GOODS).filter(g=>!GOODS[g].spoil&&!GOODS[g].ammo&&needOf(t,g)>.05).sort((a,b)=>(t.stock[a]||0)/targetStock(t,a)-(t.stock[b]||0)/targetStock(t,b));
    if(!goods.length)return false;
    this.good=goods[questRng().int(0,Math.min(1,goods.length-1))];
    this.n=Math.max(SUPPLY_JOB.least,Math.min(questRng().int(8,15),Math.round(SUPPLY_JOB.worth/Math.max(1,marketPrice(t,this.good)))));
    this.days=clamp(Math.round(SUPPLY_JOB.days[0]+Troubles.fill(t,this.good)*SUPPLY_JOB.days[2]),SUPPLY_JOB.days[0],SUPPLY_JOB.days[1]);
    this.cause=causeOf(Troubles.news(t,['caravan','siege','raid'])[0],t)||'Its stores of '+GOODS[this.good].n.toLowerCase()+' run low.';
    this.title='Supply run: '+GOODS[this.good].n.toLowerCase();
    this.text=t.name+' is short of '+GOODS[this.good].n.toLowerCase()+'. Bring '+this.n+' here.';
    this.pays(Math.max(GOODS[this.good].base*1.6,marketPrice(t,this.good)*SUPPLY_JOB.price)*this.n,8,2,15);
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
  // (a turn, Q5: its stores filled by others: closed, a share paid)
  gone(){
    const t=townBy(this.home);
    return super.gone()||!!t&&Troubles.fill(t,this.good)>=1;
  }
  pay(where){
    super.pay(where);
    Chains.supply(this);// (its caravan robbed: The empty larder, story/chains.js)
  }
  goneWhy(){
    return super.gone()?super.goneWhy():this.home+' has its '+GOODS[this.good].n.toLowerCase()+' again.';
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
// a hunt: hides for the tanner (always his; an innkeeper's never; else 2 in 5), or meat for the table, handed over; offered only where game
// that gives them lives near (troubles.js game), named, and where
class HuntQuest extends JobQuest{
  setup(t,lord,spec){
    const g=spec&&Givers.byKey(spec.who),herds=Troubles.game(t),hideHerd=herds.find(c=>CRITTERS[c.id].mat&&CRITTERS[c.id].mat[0]==='hide');
    const hides=!!hideHerd&&(g&&g.role==='tanner'||!(g&&g.role==='innkeeper')&&questRng().chance(.4)),c=hides?hideHerd:herds.find(c=>CRITTERS[c.id].meat>0);
    if(!c||g&&g.role==='tanner'&&!hides)return false;
    const K=CRITTERS[c.id];
    this.mat=hides?'hide':null;
    this.good=hides?null:'meat';
    this.game=c.id;
    this.n=hides?questRng().int(3,5):questRng().int(12,20);
    this.cause=cap1(K.n.toLowerCase())+' graze '+Math.round(qTiles(c,t))+' tiles '+compass(c.x-t.x,c.y-t.y)+' of '+t.name+'.';
    this.title=hides?'Hides for the tanner':'Meat for the table';
    this.text=hides?'The tanner of '+t.name+' wants '+this.n+' '+K.one+' hides.':t.name+' wants '+this.n+' meat for its tables.';
    this.pays(hides?this.n*28:this.n*13,8,1,15);
  }
  get handsOver(){
    return true;
  }
  // (what you carry of it: the hides; the meat you have hunted since you took it, as much of it as you still carry (bought meat
  // counts for nothing: its hunts' tally, got))
  have(){
    return this.mat?invCount('mat',this.mat):Math.min(goodN('meat'),this.got||0);
  }
  ready(){
    return this.have()>=this.n;
  }
  progress(){
    return this.have()+' / '+this.n+' '+(this.mat?'hides':'meat');
  }
  aim(){
    return 'Bring '+this.n+' '+(this.mat?(CRITTERS[this.game]?CRITTERS[this.game].one+' ':'')+'hides':'hunted meat')+' to '+this.home;
  }
  handOver(){
    if(!this.mat){goodTake('meat',this.n);const t=townBy(this.home);if(t){ensureEcon(t);t.stock.meat=(t.stock.meat||0)+this.n}return}
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
// (the meat you hunt, on every meat job you carry: its tally)
worldOn('meat:hunted',d=>{for(const q of P.quests)if(q.type==='hunt'&&!q.mat&&!q.done)q.got=(q.got||0)+d.n});
// a courier: a sealed letter to a holding that is not hostile to you, paid on arrival there (a real one: opened, it pays
// COURIER.opened of its gold)
const COURIER={opened:.5};
class CourierQuest extends JobQuest{
  get timed(){
    return true;
  }
  setup(t){
    // (never to the sender's enemies, nor into a siege)
    const dest=TOWNS.filter(o=>o!==t&&!o.gone&&!hostileTo(o.owner)&&!(o.owner&&t.owner&&atWar(o.owner,t.owner))&&!besieged(o)&&qTiles(o,t)>18&&qTiles(o,t)<60);
    if(!dest.length)return false;
    const d=questRng().pick(dest);
    this.to=d.name;
    this.days=Math.ceil(qTiles(d,t)/8)+5;
    this.cause='The steward has word for '+d.name+' that will not wait for the next rider.';
    this.title='Letter for '+d.name;
    this.text='Carry a sealed letter from '+this.giver+' to '+d.name+', '+Math.round(qTiles(d,t))+' tiles to the '+compass(d.x-t.x,d.y-t.y)+'. You are paid on arrival.';
    this.pays(25+qTiles(d,t)*1.6,5,2,15);
  }
  // (taken: the real letter in your bag, a Quest item (world/letters.js): what its realm writes, as a rider's would, addressed
  // to the holding it goes to; read, sold or burnt, as any letter: read, it is paid less; gone from your bag, the job fails)
  begin(t){
    const d=townBy(this.to);
    this.x=d.x;
    this.y=d.y;
    if(!t||!t.owner||!FACS[t.owner])return;
    const L=LETTER.make({fac:t.owner,home:t.name,x:t.x,y:t.y,i:'q'+this.id});
    Object.assign(L,{from:t.name,to:d.name,toFac:d.owner,seen:0,job:this.id});
    // (its words as they fit where it goes: a realm's war orders to its own holding (and not about the holding itself), an alliance
    // to the realm it is offered; else the news of the sender's holding)
    if((L.kind==='army'||L.kind==='attack')&&(d.owner!==t.owner||L.tgt===d.name)||L.kind==='deal'&&L.with!==d.owner)Object.assign(L,{kind:'news',site:null});
    this.letter=L.id;
    playerInventory.put({k:'letter',id:L.id,n:1,L},true);
  }
  carried(){
    const i=this.letter?LETTER.slotOf(this.letter):-1;
    return i>=0?P.inv[i].L:null;
  }
  seek(){
    const t=townBy(this.to);
    return {x:t.x,y:t.y,name:t.name};
  }
  todo(){
    return 'Deliver to '+this.to+'.';
  }
  lapse(){
    if(this.letter&&!this.done&&!this.carried())return this.fail('You no longer carry the letter.');
    super.lapse();
  }
  earned(){
    const L=this.carried();
    return Math.round(super.earned()*(L&&!L.seal?COURIER.opened:1));
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
  // (over: its holding gone, or held by your enemies, the letter never to be given there)
  gone(){
    const d=townBy(this.to);
    return super.gone()||!d||!!d.gone||!!d.owner&&hostileTo(d.owner);
  }
  goneWhy(){
    const d=townBy(this.to);
    return super.gone()?super.goneWhy():d&&!d.gone?this.to+' is held by your enemies now.':this.to+' is no more.';
  }
  arrive(t){
    if(this.to!==t.name)return;
    const L=this.carried();
    if(this.letter&&!L)return;
    if(L&&!L.seal)log('The lord of '+t.name+' frowns at the broken seal.','bad','story',this.journalKey);
    addRep(t.name,L&&!L.seal?1:3,true);
    this.pay(t.name);
    if(L)P.inv[LETTER.slotOf(L.id)]=null;
  }
}
// reinforcements: troops of a tier or better handed over to the garrison (the greenest that qualify first); offered only while
// its garrison is thin (troubles.js garrison: below its kind's, or a siege or a raid thinned it)
class TroopsQuest extends JobQuest{
  // (its need read off the world: passed before it is taken, no work: story/quest.js accept)
  needless(){
    return this.gone();
  }
  setup(t){
    const g=Troubles.garrison(t);
    if(!g.thin)return false;
    this.n=clamp(g.low,2,5);
    this.tier=2;
    this.cause=g.hurt?'The fighting cost the garrison '+g.low+' men.':'The garrison is '+g.low+' men short.';
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
  // (a turn, Q5: its garrison filled by others: closed, a share paid)
  gone(){
    const t=townBy(this.home);
    return super.gone()||!!t&&(t.gar||0)>=(t.T.gar||0);
  }
  goneWhy(){
    return super.gone()?super.goneWhy():'The garrison of '+this.home+' is full again.';
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
  // (its need read off the world: passed before it is taken, no work: story/quest.js accept)
  needless(){
    return this.gone();
  }
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
  // (gone for good: his realm fallen; or a prisoner, or at peace with them now)
  gone(){
    const l=W.lords.find(x=>x.name===this.target);
    return super.gone()||!l||!!l.gone||!!l.held||!atWar(this.fac,l.fac);
  }
  goneWhy(){
    const l=W.lords.find(x=>x.name===this.target);
    return super.gone()?super.goneWhy():l&&!l.gone&&l.held?this.target+' is a prisoner now.':l&&!l.gone&&!atWar(this.fac,l.fac)?'The war with the '+FACS[l.fac].n+' is over.':this.target+' is gone from the field for good.';
  }
}
// a lord's war work for his own vassals: the nearest unwalled enemy village raided to the ground
class RaidQuest extends JobQuest{
  // (its need read off the world: passed before it is taken, no work: story/quest.js accept)
  needless(){
    return this.gone();
  }
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
  // (gone: no more, his realm's own now, or no enemy of his: peace made)
  gone(){
    const v=townBy(this.village);
    return super.gone()||!v||!!v.gone||v.owner===this.fac||!atWar(this.fac,v.owner);
  }
  goneWhy(){
    const v=townBy(this.village);
    return super.gone()?super.goneWhy():v&&!v.gone&&v.owner===this.fac?this.village+' is the '+FACS[this.fac].n+'’s own now.':v&&!v.gone?'The war with '+this.village+'’s lords is over.':this.village+' is no more.';
  }
}
// a lord's war work: a holding of his realm under siege relieved (its besieger beaten by you); closed once the siege is over
class RelieveQuest extends JobQuest{
  // (its need read off the world: passed before it is taken, no work: story/quest.js accept)
  needless(){
    return this.gone();
  }
  setup(t,lord){
    const h=TOWNS.filter(x=>x.owner===this.fac&&!x.gone&&besieged(x)).sort((a,b)=>qTiles(a,lord)-qTiles(b,lord))[0];
    if(!h)return false;
    const by=W.lords.find(l=>!l.dead&&l.state==='siege'&&l.tgt===h.name);
    if(!by)return false;
    this.town=h.name;
    this.besieger=by.name;
    this.cause=by.name+' of the '+FACS[by.fac].n+' has laid siege to '+h.name+'.';
    this.title='Relieve '+h.name;
    this.text=lord.name+' wants the siege of '+h.name+' broken: beat '+by.name+' before its walls.';
    this.pays(220,0,14,70);
  }
  begin(){
    const h=townBy(this.town);
    this.x=h.x;
    this.y=h.y;
  }
  seek(){
    const h=townBy(this.town);
    return h?{x:h.x,y:h.y,name:h.name}:null;
  }
  get deed(){
    return 'lord:beaten';
  }
  hits(d){
    return d.lord&&d.lord.tgt===this.town&&atWar(d.lord.fac,this.fac);
  }
  get deedWord(){
    return 'relieved';
  }
  gone(){
    const h=townBy(this.town);
    return super.gone()||!h||!!h.gone||!besieged(h);
  }
  goneWhy(){
    return super.gone()?super.goneWhy():'The siege of '+this.town+' is over.';
  }
}
// a lord's war work: an enemy lord's army found in the field (a lead: where it was last heard of) and reported; done once seen
class ScoutQuest extends JobQuest{
  setup(t,lord){
    const foes=W.lords.filter(o=>!o.dead&&!o.gone&&!o.inside&&atWar(this.fac,o.fac)&&o.troops&&o.troops.length);
    if(!foes.length)return false;
    const f=foes.sort((a,b)=>qTiles(a,lord)-qTiles(b,lord))[0];
    this.foeName=f.name;this.words(f,lord.name);
    this.pays(110,0,6,40);
  }
  // (its words: a lord you have not met named only once you take the work, his realm's army till then: knowledge.js)
  words(f,by){
    const n=KNOWLEDGE.knowsLord(f)?f.name:null,who=n?n+'’s army':an(FACS[f.fac].n+' army');this.by=by||this.by;
    this.cause='Word is '+(n?n+' of the '+FACS[f.fac].n:'a lord of the '+FACS[f.fac].n)+' is in the field with '+f.troops.length+' men.';
    this.title='Find '+who;
    this.text=this.by+' wants to know where '+who+' is, and how strong. Find it, and report.';
  }
  begin(){
    const f=this.foe();
    if(!f)return false;
    KNOWLEDGE.lord(f);this.words(f);
    this.markLead(f);
  }
  foe(){
    return W.lords.find(x=>x.name===this.foeName&&!x.dead&&!x.gone)||null;
  }
  get leads(){
    return true;
  }
  target(){
    return this.foe();
  }
  quarryName(){
    return this.foeName+'’s army';
  }
  seek(){
    const f=this.foe();
    if(!f)return null;
    const s=this.spot();
    if(!s&&this.found&&!this.done)this.finish();
    return s?{...s,name:this.foeName}:{x:f.x,y:f.y,name:this.foeName};
  }
  get deedWord(){
    return 'found';
  }
  gone(){
    return super.gone()||!this.foe();
  }
  goneWhy(){
    return super.gone()?super.goneWhy():this.foeName+' is gone from the field.';
  }
}
// a caravan to see through (a merchant: doc/QUESTS_DESIGN.md §5.6): offered only while the talk of the holding is of a caravan
// taken on its roads (news 'caravan', TROUBLE.fresh days). Taken, a real one leaves its gate for a holding not hostile to you,
// CONVOY_JOB.min–max tiles off, its goods off the holding's stock, marked (qid); the band that troubles the holding, if one does,
// works its road (haunt: the way's middle). Reaching its gate with you within CONVOY_JOB.near tiles of it: paid there; taken on
// the road, or there without you: failed (Convoy.heard)
const CONVOY_JOB={min:10,max:40,near:8,load:12,guards:2};
class ConvoyQuest extends JobQuest{
  setup(t){
    const it=Troubles.news(t,['caravan'])[0];
    if(!it||!t.owner)return false;
    const ds=TOWNS.filter(o=>o!==t&&!o.gone&&!hostileTo(o.owner)&&!(o.owner&&atWar(o.owner,t.owner))&&!besieged(o)&&qTiles(o,t)>=CONVOY_JOB.min&&qTiles(o,t)<=CONVOY_JOB.max);
    if(!ds.length)return false;
    const d=questRng().pick(ds),n=Math.round(qTiles(d,t));
    this.to=d.name;
    this.cause='A caravan'+(it.detail.from?' out of '+it.detail.from:'')+' was taken on the road on day '+it.day+'.';
    this.title='Guard a caravan to '+d.name;
    this.text='A caravan of '+t.name+' leaves for '+d.name+', '+n+' tiles to the '+compass(d.x-t.x,d.y-t.y)+'. Ride with it and see it safe to its gate. You are paid there.';
    this.pays(40+n*2.2,8,2,20+n);
  }
  // (taken: the caravan out of its gate, its goods the holding's most worth (none in stock: grain); the band works its road)
  begin(t){
    const d=townBy(this.to);
    if(!t||!d)return false;
    ensureEcon(t);
    const g=Object.keys(t.stock).filter(k=>GOODS[k]&&!GOODS[k].ammo&&(t.stock[k]||0)>=4).sort((a,b)=>t.stock[b]*GOODS[b].base-t.stock[a]*GOODS[a].base)[0],n=g?Math.min(CONVOY_JOB.load,Math.floor(t.stock[g]/2)):0;
    if(n)t.stock[g]-=n;
    const c=asParty({cv:true,fac:t.owner,from:t.name,to:d.name,x:t.x,y:t.y+14,goods:n?{[g]:n}:{grain:CONVOY_JOB.load},guards:CONVOY_JOB.guards+(t.T.guards||0),cool:0,dir:1,qid:this.id});
    W.caravans.push(c);
    const b=Troubles.bands(t).find(o=>!o.qid);
    if(b)b.haunt={x:Math.round((t.x+d.x)/2),y:Math.round((t.y+d.y)/2)};
    this.x=c.x;
    this.y=c.y;
  }
  caravan(){
    return W.caravans.find(c=>c.qid===this.id&&!c.gone)||null;
  }
  seek(){
    const c=this.caravan();
    return c?{x:c.x,y:c.y,name:'the caravan to '+this.to}:null;
  }
  todo(){
    return 'See the caravan safe to '+this.to+'.';
  }
  aim(){
    return 'See the caravan safe to '+this.to;
  }
  tally(){
    return '';
  }
  reportLine(){
    return 'Paid on arrival at '+this.to;
  }
  get reportsBack(){
    return false;
  }
  // (there, taken or robbed by you: the caravan's end, heard on the bus)
  static heard(type,d){
    const c=d&&d.caravan;
    if(!c||c.qid==null)return;
    for(const q of P.quests.slice()){
      if(q.type!=='convoy'||q.done||q.id!==c.qid)continue;
      const Q=Quest.as(q),at=d.to?d.to.name:Q.to;
      if(type!=='caravan:arrived')Q.fail(type==='caravan:robbed'?'You robbed the caravan yourself.':'The caravan was taken on the road.');
      else if(Math.hypot(P.x-c.x,P.y-c.y)>CONVOY_JOB.near*TILE)Q.fail('The caravan reached '+at+' without you.');
      else{log('The caravan rolls in at the gate of '+at+'. The merchant’s factor there pays you.','gold','story',Q.journalKey);Q.pay(at)}
    }
  }
  gone(){
    return super.gone()||!this.caravan();
  }
  goneWhy(){
    return super.gone()?super.goneWhy():'The caravan turned back.';
  }
}
for(const type of ['caravan:arrived','caravan:beaten','caravan:robbed'])worldOn(type,d=>ConvoyQuest.heard(type,d));
// the missing (a priest, a family: §5.9): one of the holding's people really taken. A band that beats a caravan carries off one
// of its people (caravan:beaten: captives.js carry, {cap, n, home, day, as}, named by the holding's folk and the cap's hash, no
// draw). Offered while a band (roving, or sheltering in a camp or hideout) carries one of the holding's; the band a lead, as a
// bounty's; freed when you break it (band:beaten: on the road, or clearing the camp it shelters in), then home with you: report
// there. Its band broken by another, or gone: closed
const MISSING_JOB={as:['drover','carter','merchant’s boy','caravan guard']};
const Missing={
  take(b,c){
    const t=townBy(c.from);
    if(!b||!t)return;
    const N=FOLK_NAMES[(t.races&&t.races[0])||'human']||FOLK_NAMES.human,cap='tk:'+c.from+':'+G.day+':'+Math.round(c.x)+','+Math.round(c.y),h=folkHash(cap);
    (b.carry=b.carry||[]).push({cap,n:N[h%N.length],home:t.name,day:G.day,as:MISSING_JOB.as[(h>>>8)%MISSING_JOB.as.length]});
  },
  // (t's people carried off: each {b, c}, the band that carries one and its carry)
  of(t){
    const out=[];
    for(const b of bandits.concat(...W.sites.map(s=>s.bands||[])))for(const c of b.carry||[])if(c.home===t.name)out.push({b,c});
    return out;
  },
};
worldOn('caravan:beaten',d=>{if(d&&d.band&&d.caravan&&!d.caravan.mine)Missing.take(d.band,d.caravan)});
class MissingQuest extends JobQuest{
  setup(t){
    const f=Missing.of(t).find(x=>!P.quests.some(q=>q.cap===x.c.cap));
    if(!f)return false;
    const {b,c}=f;
    this.cap=c.cap;
    this.pn=c.n;
    this.band=b.name?'the '+b.name:b.ld?b.ld.name+'’s band':'the band';
    this.cause='Bandits took '+c.n+', a '+c.as+' of '+t.name+', when they beat a caravan on the road on day '+c.day+'.';
    this.title='Find '+c.n;
    this.text=c.n+' was carried off by '+this.band+'. Break them, and bring '+c.n+' home to '+t.name+'.';
    this.pays(70+8*((b.troops&&b.troops.length)||5),10,2,35);
  }
  begin(){
    const b=this.holder();
    if(!b)return false;
    this.x=b.x;
    this.y=b.y;
    if(bandits.includes(b))this.markLead(b);
  }
  // (the band that carries them, roving or sheltering; the camp or hideout it shelters in)
  holder(){
    return bandCarrying(this.cap);
  }
  site(){
    return W.sites.find(s=>(s.bands||[]).some(b=>carries(b,this.cap)))||null;
  }
  get leads(){
    return true;
  }
  target(){
    const b=this.holder();
    return b&&bandits.includes(b)?b:null;
  }
  quarryName(){
    return this.band;
  }
  seek(){
    const s=this.site();
    if(s){
      s.seen=true;
      return {x:s.x,y:s.y,name:this.band+' at the '+s.name};
    }
    const b=this.target();
    if(!b)return null;
    const sp=this.spot();
    return sp?{...sp,name:this.band}:{x:b.x,y:b.y,name:this.band};
  }
  todo(){
    return 'Break '+this.band+' and free '+this.pn+'.';
  }
  aim(){
    return 'Free '+this.pn+' from '+this.band;
  }
  get deed(){
    return 'band:beaten';
  }
  hits(d){
    return carries(d.band,this.cap);
  }
  get deedWord(){
    return 'freed';
  }
  // (freed: they ride home with you, said in its done line)
  finish(){
    uncarry(this.holder(),this.cap);
    this.done=true;
    Quest.unmark(this.id);
    log('Quest done: '+this.title+'. You free '+this.pn+', who rides with you, home to '+this.home+'. Report there.','gold','story',this.journalKey);
  }
  gone(){
    return super.gone()||!this.done&&!this.holder();
  }
  goneWhy(){
    return super.gone()?super.goneWhy():'No one knows what became of '+this.pn+'.';
  }
}
/* outposts (doc/STANDARDS_DESIGN.md phase 4; world/standards.js; an outpost to the player, a standard in the code): a lord at war
   wants an outpost taken for his realm: the nearest held by a realm at war with his, a band's lair, or one of his realm's first
   (then: retake); done once its banner is his realm's by your hand (you serving him, or handing it to his realm). A holding's
   board: bandits or goblins driven from the outpost they made their lair near it; the broken tower of an outpost of its realm's
   mended with the timber and stone you bring (its page's Mend its tower). OUTPOST_JOB: how far (tiles) each looks */
/* hold: an outpost of his realm's within r tiles of him, within foe tiles of a holding of a realm at war with his; held hours by
   it (within near tiles), a wave of its foe's men at each of waves' hours (n[i] men and a man a day's ten more), marching on it
   from from tiles its foe's way (at tiles from it, with you not by it, they take it), away hours away from it at most once begun; scout: n of his foes' outposts within r tiles, each looked on from within see tiles, never within spot
   of a guarded one by day (half that by night) */
const OUTPOST_JOB={take:60,lair:40,mend:40,hold:{r:60,foe:80,near:3,hours:12,waves:[3,7,10],n:[4,6,8],away:2,from:12,at:1},scout:{r:140,n:3,least:2,see:6,spot:2.5}};
const outpostNear=(fn,t,r)=>Standards.all().filter(s=>fn(s)&&qTiles(s,t)<r).sort((a,b)=>qTiles(a,t)-qTiles(b,t))[0]||null;
class OutpostQuest extends JobQuest{
  needless(){return this.gone()}
  setup(t,lord){const f=this.fac,s=outpostNear(x=>x.realm!==f&&!x.choose&&(x.band||x.home0===f&&x.realm!=='player'||x.realm&&x.realm!=='player'&&atWar(f,x.realm)),t,OUTPOST_JOB.take);if(!s)return false;
    const back=s.home0===f;this.site=s.i;this.title=(back?'Retake the ':'Take the ')+s.name;
    this.text=(lord?lord.name:t.name)+' wants the '+s.name+(back?' back for the '+FACS[f].n:' taken for the '+FACS[f].n)+': beat its guards and raise their banner over it.';
    this.cause=back?'It was the '+FACS[f].n+'’s, and is '+(s.band?'a lair of '+LAIR_SAY[s.band].toLowerCase():'the '+FACS[s.realm].n+'’s')+' now.':'It stands on the road into the '+FACS[s.realm||'vale'].n+'’s land.';this.pays(150,0,8,40)}
  begin(){const s=Standards.of(this.site);if(!s)return false;s.seen=true;this.x=s.x;this.y=s.y}
  seek(){const s=Standards.of(this.site);return s?{x:s.x,y:s.y,name:'the '+s.name}:null}
  get deed(){return 'standard:taken'}
  hits(d){return d.standard.i===this.site&&d.to===this.fac&&d.by==='you'}
  get deedWord(){return 'taken'}
  gone(){const s=Standards.of(this.site);return super.gone()||!s||!this.done&&s.realm===this.fac}
  goneWhy(){const s=Standards.of(this.site);return super.gone()?super.goneWhy():s?'The '+s.name+' is the '+FACS[this.fac].n+'’s again, by other hands.':'The outpost is gone.'}
}
class OutlairQuest extends JobQuest{
  needless(){return this.gone()}
  setup(t){const s=outpostNear(x=>!!x.band,t,OUTPOST_JOB.lair);if(!s)return false;this.site=s.i;this.title='Drive the '+LAIR_SAY[s.band].toLowerCase()+' from the '+s.name;
    this.text=LAIR_SAY[s.band]+' have made the '+s.name+' to the '+compass(s.x-t.x,s.y-t.y)+' their lair. Drive them out.';this.cause='Their raiders ride out of it onto '+t.name+'’s roads.';this.pays(140,10,3,40)}
  begin(){const s=Standards.of(this.site);if(!s||!s.band)return false;s.seen=true;this.x=s.x;this.y=s.y}
  seek(){const s=Standards.of(this.site);return s?{x:s.x,y:s.y,name:'the '+s.name}:null}
  get deed(){return 'site:cleared'}
  hits(d){return d.site.i===this.site}
  get deedWord(){return 'cleared'}
  gone(){const s=Standards.of(this.site);return super.gone()||!s||!this.done&&!s.band}
  goneWhy(){const s=Standards.of(this.site);return super.gone()?super.goneWhy():s?'Someone else drove them from the '+s.name+'.':'The outpost is gone.'}
}
class MendQuest extends JobQuest{
  needless(){return this.gone()}
  setup(t){const s=outpostNear(x=>x.broken&&x.realm===t.owner,t,OUTPOST_JOB.mend);if(!s)return false;this.site=s.i;this.title='Mend the tower of the '+s.name;
    this.text=t.name+' needs the broken tower of the '+s.name+' mended: bring '+s.costText(STANDARD.repair.cost)+' there.';this.cause='Its guards stand short-handed while it lies broken.';this.pays(90,8,2,30)}
  begin(){const s=Standards.of(this.site);if(!s||!s.broken)return false;s.seen=true;this.x=s.x;this.y=s.y}
  seek(){const s=Standards.of(this.site);return s?{x:s.x,y:s.y,name:'the '+s.name}:null}
  get deed(){return 'standard:mended'}
  hits(d){return d.standard.i===this.site&&d.by==='you'}
  get deedWord(){return 'mended'}
  gone(){const s=Standards.of(this.site);return super.gone()||!s||!this.done&&(!s.broken||s.realm!==this.fac&&!!this.fac)}
  goneWhy(){const s=Standards.of(this.site);return super.gone()?super.goneWhy():s&&!s.broken?'Its tower is mended already.':'The outpost is no longer theirs.'}
}
/* hold the outpost until relief comes (doc/STANDARDS_DESIGN.md §6): a lord at war fears his foes will come for one of his realm's
   outposts near them; once you stand by it, its hold begins: OUTPOST_JOB.hold.hours hours there, a wave of his foe's men (under the
   banner of its nearest holding) coming at you at each of its waves' hours, each to beat before relief comes. Left too long, the
   job is lost; beaten or run off, the outpost is theirs. Its hours from the outposts' hour (world/standards.js Standards.hour) */
class HoldQuest extends JobQuest{
  needless(){return this.gone()}
  setup(t,lord){const f=this.fac,H=OUTPOST_JOB.hold;let best=null,bd=1e9,foe=null;
    for(const s of Standards.all()){if(s.realm!==f||s.choose||s.taking||qTiles(s,lord||t)>H.r)continue;
      for(const h of TOWNS)if(!h.gone&&FACS[h.owner]&&h.owner!=='player'&&atWar(f,h.owner)){const d=qTiles(s,h);if(d<bd&&d<H.foe){bd=d;best=s;foe=h.owner}}}
    if(!best)return false;Object.assign(this,{site:best.i,foeF:foe,h:0,wave:0,away:0,on:false,left:false});this.title='Hold the '+best.name;
    this.text=(lord?lord.name:t.name)+' fears the '+FACS[foe].n+' will come for the '+best.name+'. Hold it until relief comes: '+H.hours+' hours by it, whoever comes.';
    this.cause='It stands '+Math.round(bd)+' tiles from the '+FACS[foe].n+'’s nearest holding.';this.pays(170,0,8,50)}
  begin(){const s=Standards.of(this.site);if(!s)return false;s.seen=true;this.x=s.x;this.y=s.y}
  seek(){const s=Standards.of(this.site);return s?{x:s.x,y:s.y,name:'the '+s.name}:null}
  get deed(){return 'outpost:held'}
  hits(d){return d.standard.i===this.site}
  get deedWord(){return 'held'}
  gone(){const s=Standards.of(this.site);return super.gone()||!s||!this.done&&(s.realm!==this.fac||this.left)}
  goneWhy(){const s=Standards.of(this.site);return super.gone()?super.goneWhy():!s?'The outpost is gone.':this.left?'You left the '+s.name+' before relief came.':'The '+s.name+' fell to the '+(FACS[s.realm]?FACS[s.realm].n:'wilds')+'.'}
  // (an hour: by it, the hold runs (not while a wave of its is out) and a wave sets out at its hour; away once begun, too long and
  // the job is lost)
  hour(){const s=Standards.of(this.site),H=OUTPOST_JOB.hold;if(!s||s.realm!==this.fac||this.done||this.left)return;
    if(Math.hypot(P.x-s.x,P.y-s.y)>H.near*TILE){if(this.on&&++this.away>H.away)this.left=true;return}
    if(!this.on){this.on=true;log('You take your post at the '+s.name+'. Relief is '+H.hours+' hours away.','gold')}
    this.away=0;if(this.out())return;this.h=Math.min(H.hours,this.h+1);const w=H.waves[this.wave];
    if(w!=null&&this.h>=w)this.attack(s);else if(w==null&&this.h>=H.hours){log('Relief comes to the '+s.name+': the '+FACS[this.fac].n+'’s men take it from you.','good');worldEmit('outpost:held',{standard:s,by:'you'})}}
  // (its wave on the map, marching on it: world/brains.js BandBrain, holdWaveStep)
  out(){return bandits.find(o=>o.wave&&o.wave.q===this.id&&!o.gone)||null}
  // (a wave: his foe's men under its nearest holding's banner, setting out from its way OUTPOST_JOB.hold.from tiles off, on land)
  // (his foe with no holding left to send men from: no wave, and relief still comes; it waited for a wave for ever)
  attack(s){const H=OUTPOST_JOB.hold,h=Spatial.nearest(fiefsOf(this.foeF),s.x,s.y);if(!h){this.wave++;return}const a=Math.atan2(h.y-s.y,h.x-s.x);let x=s.x,y=s.y;
    for(let r=H.from;r>=H.near+1;r--){const qx=s.x+Math.cos(a)*r*TILE,qy=s.y+Math.sin(a)*r*TILE;if(passable(terrAt(qx,qy))){x=qx;y=qy;break}}
    const n=H.n[this.wave]+Math.floor(G.day/10);bandits.push(asParty({x,y,n,town:h.name,fac:this.foeF,troops:armyOf(this.foeF,n),t:0,a:0,idle:false,cool:0,wave:{q:this.id,site:s.i,i:this.wave}}));
    log('Men of the '+FACS[this.foeF].n+' march on the '+s.name+' from the '+compass(h.x-s.x,h.y-s.y)+'!','bad')}
  // (a wave upon you: the fight, its guards beside you (their archers on its tower: world/standards.js StandardTower))
  meet(b,s){const g=s.guards>0&&s.realm===this.fac?asParty({src:s,fac:s.realm,name:'Guards of the '+s.name,troops:s.guardList(),x:s.x,y:s.y}):null;if(g)g.n0=g.troops.length;
    startEncounter({kind:'party',ref:b,n:b.troops.length,list:b.troops.slice(),title:FACS[this.foeF].n+' men at the '+s.name,word:'soldiers',hold:this.id,post:s,allies:g?[g]:[]})}
  // (its wave's fight over (the bus's battle:ended): beaten, the next; lost or run from, the outpost theirs, their men its garrison)
  // (its guards who fell beside you lost to it: their party's men at its start (n0) less as the fight left them, a fought one's dead taken off it as they
  // fell (attacks.js: an ally's), an auto-resolved one culled (engage.js autoResolve))
  ended(d){const s=Standards.of(this.site);if(!s)return;const g=((d.enc&&d.enc.allies)||[]).find(a=>a&&a.src===s);
    if(g&&Array.isArray(g.troops)&&g.n0!=null)s.guards=Math.max(0,s.guards-Math.max(0,g.n0-g.troops.length));if(d.how==='won'){this.wave++;return}
    const b=d.enc&&d.enc.ref;if(b&&b.wave){b.gone=true;bandits=bandits.filter(x=>x!==b)}if(s.realm===this.fac)s.taken(this.foeF)}
}
/* scout the enemy's outposts (doc §6): a lord at war wants his foes' outposts near him looked on, unseen: each looked on from within
   OUTPOST_JOB.scout.see tiles; within spot tiles of a guarded one by daylight (half that by night), its guards see you and the
   job is lost. Looked at each hour, and as it points you on (seek) */
class OutscoutQuest extends JobQuest{
  needless(){return this.gone()}
  setup(t,lord){const f=this.fac,X=OUTPOST_JOB.scout,c=Standards.all().filter(s=>s.realm&&s.realm!=='player'&&s.realm!==f&&atWar(f,s.realm)&&qTiles(s,lord||t)<X.r).sort((a,b)=>qTiles(a,lord||t)-qTiles(b,lord||t)).slice(0,X.n);
    if(c.length<X.least)return false;Object.assign(this,{sites:c.map(s=>s.i),looked:[],caught:null});const F=[...new Set(c.map(s=>FACS[s.realm].n))].join(' and the ');
    this.title='Scout the '+F+'’s outposts';this.text=(lord?lord.name:t.name)+' wants the '+c.map(s=>s.name).join(', ')+' looked on, unseen: how many guard them, and what stands there.';
    this.cause='The '+F+' hold them on the roads into his land.';this.pays(120,0,6,40)}
  begin(){for(const i of this.sites){const s=Standards.of(i);if(s)s.seen=true}const n=this.next();if(n){this.x=n.x;this.y=n.y}}
  next(){for(const i of this.sites)if(!this.looked.includes(i)){const s=Standards.of(i);if(s)return s}return null}
  seek(){this.look();const s=this.next();return s?{x:s.x,y:s.y,name:'the '+s.name}:null}
  // (where you stand: seen by a guarded one's men close by day, or near enough to look on one)
  look(){if(this.done||this.caught!=null)return;const X=OUTPOST_JOB.scout,dark=Clock.darkness()>.5;
    for(const i of this.sites){if(this.looked.includes(i))continue;const s=Standards.of(i);if(!s)continue;const d=Math.hypot(P.x-s.x,P.y-s.y)/TILE;
      if(s.guards>0&&s.realm&&atWar(this.fac,s.realm)&&d<X.spot*(dark?.5:1)){this.caught=i;log('The guards of the '+s.name+' see you.','bad');return}
      if(d<X.see){this.looked.push(i);log('You look on the '+s.name+' unseen: '+s.guards+' guards, '+STANDARD_LV[s.lv]+'.','good')}}
    if(this.looked.length===this.sites.length)worldEmit('outposts:scouted',{quest:this.id,by:'you'})}
  hour(){this.look()}
  get deed(){return 'outposts:scouted'}
  hits(d){return d.quest===this.id}
  get deedWord(){return 'scouted'}
  gone(){return super.gone()||!this.done&&this.caught!=null}
  goneWhy(){const s=this.caught!=null&&Standards.of(this.caught);return super.gone()?super.goneWhy():'The guards of the '+(s?s.name:'outpost')+' saw you.'}
}
// (a hold's wave, each frame (world/brains.js BandBrain): on to the outpost; upon you there, the fight; at it with you not by it,
// they take it and stand as its garrison; its job gone, it marches home no more but melts away)
function holdWaveStep(b,d,brain){const q=(P.quests||[]).find(x=>x.id===b.wave.q),s=Standards.of(b.wave.site),H=OUTPOST_JOB.hold;
  if(!q||q.done||!s||s.realm!==q.fac){b.gone=true;bandits=bandits.filter(x=>x!==b);return false}brain.cool(b,d);
  // (upon you: as a band meets you (brains.js canMeet), but seen or not, coming at the post you stand at)
  const pd=Math.hypot(P.x-b.x,P.y-b.y);if(pd<(WORLD_BATTLE.on?worldBattleReach(b):10)&&(b.cool||0)<=0&&G.encCool<=0&&!G.modal&&G.mode==='world'&&!G.enc){Quest.as(q).meet(b,s);return true}
  const sd=Math.hypot(s.x-b.x,s.y-b.y);if(sd<H.at*TILE){if(Math.hypot(P.x-s.x,P.y-s.y)>H.near*TILE){b.gone=true;bandits=bandits.filter(x=>x!==b);s.taken(q.foeF)}return false}
  const sp=moveStep(partySpeed(b,b.troops),d);b.idle=false;if(!Router.travel(b,{x:s.x,y:s.y},sp))walk(b,s.x-b.x,s.y-b.y,Math.min(sd,sp));return false}
// (the outposts' jobs that run by the hour: the hold's waves and hours, the scouting's look (world/standards.js Standards.hour))
const outpostJobsHour=()=>{for(const q of P.quests||[])if((q.type==='hold'||q.type==='outscout')&&!q.done)Quest.as(q).hour()};
worldOn('battle:ended',d=>{const id=d.enc&&d.enc.hold;if(id==null)return;const q=(P.quests||[]).find(x=>x.id===id);if(q)Quest.as(q).ended(d)});
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
  relieve:{cls:RelieveQuest},
  scout:{cls:ScoutQuest},
  convoy:{cls:ConvoyQuest},
  missing:{cls:MissingQuest},
  outpost:{cls:OutpostQuest},
  outlair:{cls:OutlairQuest},
  mend:{cls:MendQuest},
  hold:{cls:HoldQuest},
  outscout:{cls:OutscoutQuest},
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
    return (q.lord?q.giver+' has no work for you':'No work for you here')+' until day '+s.until+' (you gave up '+(q.lord?pr(q.giver).his:'their')+' '+s.what+')';
  },
  day(){
    if(!P.shut)return;
    for(const k of Object.keys(P.shut))if(G.day>=P.shut[k].until)delete P.shut[k];
    if(!Object.keys(P.shut).length)delete P.shut;
  },
};
/* making offers */
// (g: who at the holding gives it, world/givers.js; none: the first there who gives that kind; a lord's none)
const makeQuest=(type,t,lord,g)=>{if(!lord&&!g)g=Givers.for(t,type);const q=Quest.make(type,t,lord,g?{who:g.key}:undefined);if(q&&g){q.who=g.key;JobQuest.purse(q,g,t)}return q};
// the board: each giver there (in a turn the jobs' stream picks) offers one of their kinds whose trouble is true, up to JOB_OFFERS
// different kinds; nothing true, nothing offered (none: its board says so)
function jobsAt(t){
  P.jobs=P.jobs||{};const j=P.jobs[t.name];
  if(!j||Clock.daysSince(j.day)>=JOB_REFRESH){const list=[],r=questRng(),gs=Givers.of(t).map(g=>[r.next(),g]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
    for(const g of gs){if(list.length>=JOB_OFFERS)break;const kinds=g.jobs.map(k=>[r.next(),k]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
      for(const k of kinds){if(list.some(o=>o.type===k))continue;const q=makeQuest(k,t,null,g);if(q){list.push(q);break}}}
    P.jobs[t.name]={day:G.day,list,none:!list.length}}
  return P.jobs[t.name].list;
}
// a lord's job: war work if his faction is at war (raids only for those who serve him), else a bounty or a beast near his lands
function lordJob(l){
  const t=Spatial.nearest(fiefsOf(l.fac).length?fiefsOf(l.fac):TOWNS,l.x,l.y);const kinds=enemiesOf(l.fac).length?(P.fac===l.fac?['lordkill','raid','relieve','scout','outpost','hold','outscout']:['lordkill','relieve','scout','outpost','hold','outscout']):['bounty','beast'];
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
  for(const q of P.quests.slice()){const Q=Quest.as(q);Q.arrive(t);if(Q.hear)Q.hear(t)}
}
/* the one you track (P.track: 'q' and a quest's id, or 't' and a story's number; none tracked: no field, so a save without one
   is as it was): its quest (a story's: the quest its step waits on) and that quest's goal; untracked once it ends */
/* the quests you track (the owner, 2026-10-30: a tracker for quick access, ui/questtrack.js): P.tracks, the newest first, at most
   QUEST_TRACKS; the one marked on the map, P.track, among them. set(k): k tracked and marked; set(null): the marked one let go
   (untracked in your Quests), none marked; drop(k): k over, gone from the tracker, the next marked if it was. A save without
   P.tracks: the marked one alone */
const QUEST_TRACKS=5;
const QuestTrack={
  key(){
    return P.track||null;
  },
  list(){
    return (P.tracks||(P.track?[P.track]:[])).filter(k=>this.quest(k)||this.thread(k));
  },
  set(k){
    const t=P.tracks||(P.tracks=P.track?[P.track]:[]);
    if(k){P.track=k;if(!t.includes(k))t.unshift(k);t.length=Math.min(t.length,QUEST_TRACKS);return}
    const i=t.indexOf(P.track);if(i>=0)t.splice(i,1);delete P.track;
  },
  drop(k){
    const t=P.tracks,was=P.track===k;if(t){const i=t.indexOf(k);if(i>=0)t.splice(i,1)}
    if(!was)return;const next=(t||[]).find(x=>this.quest(x)||this.thread(x));if(next)P.track=next;else delete P.track;
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
worldOn('quest:ended',d=>{if(d&&d.e)QuestTrack.drop('q'+d.e.id)});
worldOn('thread:ended',d=>{if(d&&d.e)QuestTrack.drop('t'+d.e.i)});
/* panels */
const rewardText=r=>'<span class="gold">'+r.gold+' gold</span>'+(r.goods&&GOODS[r.goods[0]]?', '+r.goods[1]+' '+GOODS[r.goods[0]].n.toLowerCase():'')+(r.rep?', +'+r.rep+' reputation':'')+(r.honor?', +'+r.honor+' honor':'')+(r.xp?', '+r.xp+' XP':'');
// a quest's facts, [label, html] each: who gave it, the day taken, its timing, where it is turned in, its reward (a late one's
// pay now); an offer's the same before you take it, and what it requires that you lack (its giver's trust aside: QuestShut's
// line, said once where its offers are)
function questFacts(q){
  q=Quest.as(q);
  const f=[['Given by',q.givenBy()]],tm=q.timing(),r=q.reportLine(),late=q.earned()<q.reward.gold;
  const need=q.id==null?q.needs().filter(n=>!n.met&&n.k!=='shut'):[];
  if(need.length)f.push(['Requires','<span class="bad">'+need.map(n=>n.what).join(', ')+'</span>']);
  if(q.taken!=null)f.push(['Taken','Day '+q.taken]);
  if(tm)f.push(['Timing',late?'<span class="bad">'+tm+'</span>':tm]);
  if(r)f.push(['Turn in',r]);
  f.push(['Reward',q.rewardLine()+(late?', <span class="bad">now '+q.earned()+' gold</span>':'')]);
  return f;
}
const questFactsHtml=q=>'<dl class="qfacts">'+questFacts(q).map(([k,v])=>'<dt>'+k+'</dt><dd>'+v+'</dd>').join('')+'</dl>';
// an offer (a board's, a lord's): its text and facts, and Accept (act, arg); locked, greyed, its Accept off, what it requires in
// its facts
function offerRow(q,act,arg){
  q=Quest.as(q);
  const lock=q.state==='locked',target=q.type==='lordkill'&&W.lords.find(l=>l.name===q.target),title=target?q.title.split(target.name).join(lordName(target)):q.title,text=target?q.text.split(target.name).join(lordName(target)):q.text;
  const g=q.person,who=g?'<small class="qw-who">'+htmlText(g.name+', the '+g.n)+': “'+htmlText(GIVERS[g.role].why)+'”</small>':'',why=q.causeLine?q.causeLine():'';
  return '<div class="row'+(lock?' locked':'')+'"><div class="info"><strong>'+title+(lock?' <span class="qw-st locked">'+QUEST_STATES.locked+'</span>':'')+'</strong>'+who+'<small>'+(why?'<span class="qw-cause">'+htmlText(why)+'</span> ':'')+text+'</small>'+questFactsHtml(q)+'</div>'+
    '<div class="acts"><button class="btn sm" type="button" data-act="'+act+'" data-arg="'+arg+'"'+(lock?' disabled title="'+htmlText(q.needs().filter(n=>!n.met).map(n=>n.what).join('; '))+'"':'')+'>Accept</button></div></div>';
}
// (a quest of yours reported here, in full: who gave it and why, the true thing it is about, its words, its steps (done ticked,
// the one to do now in bold, where it is from you), its facts (taken, timing, where it is turned in, its reward, less if late);
// Report or Hand over, greyed with why while it is not ready)
function hereRow(q){
  q=Quest.as(q);
  const g=q.person,who=g?'<small class="qw-who">'+htmlText(g.name+', the '+g.n)+': “'+htmlText(GIVERS[g.role].why)+'”</small>':'',why=q.causeLine?q.causeLine():'';
  const st=q.steps(),now=st.findIndex(([,d])=>!d),steps='<ol class="qw-steps">'+st.map(([x,d],i)=>'<li'+(d?' class="good"':i===now?' class="now"':'')+'>'+x+'</li>').join('')+'</ol>';
  const f=questFacts(q).filter(([k])=>!(g&&k==='Given by')),at=f.findIndex(([k])=>k==='Reward');f.splice(at<0?f.length:at,0,['Steps',steps]);
  const ready=questReady(q),hand=q.handsOver,off=ready?'':' disabled title="'+htmlText(hand?'You have '+q.progress():'Not done yet: '+q.todo())+'"';
  return '<div class="row"><div class="info"><strong>'+htmlText(q.title)+(ready?' <span class="qw-st done">Ready</span>':'')+'</strong>'+who+
    (why?'<small class="qw-cause">'+htmlText(why)+'</small>':'')+(q.text?'<small>'+htmlText(q.text)+'</small>':'')+'<dl class="qfacts">'+f.map(([k,v])=>'<dt>'+k+'</dt><dd>'+v+'</dd>').join('')+'</dl></div>'+
    '<div class="acts"><button class="btn sm" type="button" data-act="q-turnin" data-arg="'+q.id+'"'+off+'>'+(hand?'Hand over':'Report')+'</button></div></div>';
}
// the notice board: your quests to report here, then the work offered (none for you a while after you gave up one of theirs)
function jobsBody(t){
  const here=P.quests.filter(q=>canReportAt(q,t)),offers=jobsAt(t),n=Quest.jobs(),shut=QuestShut.of({home:t.name});
  return '<div class="lab">Your quests here</div>'+(here.length?here.map(hereRow).join(''):'<p class="muted">None.</p>')+
    '<div class="lab" style="margin-top:6px">Work offered, you hold '+n+' job'+(n===1?'':'s')+'</div>'+
    (shut?'<p class="bad">'+QuestShut.line({home:t.name},shut)+'.</p>':'')+
    NoticeBoard.html(t,offers);// (a cork board, its papers pinned: ui/noticeboard.js; the questbook's among them: story/questbook.js)
}
// town actions (from the town screen) and log actions (from the character screen)
function questAct(a,arg,t){
  if(!a.startsWith('q-'))return false;
  if(a==='q-accept'&&t){const list=jobsAt(t),q=list[+arg];if(q&&Quest.as(q).state==='available'&&(acceptQuest(q)||Quest.as(q).needless()))list.splice(+arg,1)}// (taken, or its need passed: off the board)
  else if(a==='q-turnin'&&t){const q=questBy(+arg);if(q&&canReportAt(q,t)){if(q.done&&!Quest.as(q).handsOver)payQuest(q,t.name);else turnIn(q,t)}}
  // (only a job may be given up: never a main or side quest, nor a story's stage)
  else if(a==='q-abandon'){const q=questBy(+arg);if(q&&Quest.as(q).abandonable)Quest.as(q).abandon()}
  else if(a==='q-lord'&&G.enc&&G.enc.kind==='lord'){const l=G.enc.ref;if(G.lordJob&&Quest.as(G.lordJob).state==='available'){if(acceptQuest(G.lordJob))l.asked=G.day;else Quest.as(G.lordJob).needless();G.lordJob=null}lordMeet(l);return true}// (taken, or its need passed: another next time)
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
    // (a lead: its circle, dashed, a ? at its middle: where to look, Q4)
    if(g.r){ctx.save();ctx.strokeStyle=on?M.on:M.col;ctx.globalAlpha=on?.8:.5;ctx.setLineDash([4,3]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sy,g.r*TILE,0,6.283);ctx.stroke();ctx.restore();txt('?',sx,sy-4+bob,on?M.on:M.col,'center');continue}
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
