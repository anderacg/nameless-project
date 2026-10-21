'use strict';
/* ---------- patrols: every holding's guards ride its land ---------- */
// W.patrols: {pt, watch, home, fac, troops, sent, x, y, wx, wy (waypoint), wait, last, cool, dir}. A holding keeps two standing
// watches: the day watch and the night watch (watch: 'day' | 'night'; who they are: its Watches, t.watch). The watch on duty goes
// out from the garrison when it can be spared (its soldiers leave the garrison while it is out; sent: how many), and at the change
// of the watch, at dusk and at dawn, it walks home and rejoins the garrison as the other sets out. It walks its beat round the
// holding's buildings (the day watch also rides out over its land; the night watch keeps close, by torchlight), hunts bandits
// there, fights an enemy army it can beat and runs home from one it can't. It goes home at once when the holding is besieged, or
// when it is down to half. Beaten, only that watch keeps in for a while; the other still goes out at its hour.
// The guards stop you if you have wronged the holding lately (t.crime, known to both watches: pay the fine or fight) and attack
// if their realm is hostile to you. Your own fiefs' guards ride for you.
const patrolOf=t=>W.patrols.find(p=>p.home===t.name);
// the watch on duty: the night watch from nightfall to dawn
const watchNow=()=>Clock.isNight?'night':'day';
const watchOf=p=>p.watch||'day';
const watchName=p=>WATCH[watchOf(p)].n+' of '+p.home;
const crimeAt=t=>t&&t.crime&&t.crime.until>G.day?t.crime:null;
// is (x, y) land the patrol guards: its holding's, or another holding of the same realm's
const patrolLand=(p,x,y)=>{const h=landHold(x,y);return !!h&&(h.name===p.home||h.owner===p.fac)};

/* a holding's watch (t.watch: Watches, a part of the holding kept aside, never saved; doc/STORY_DESIGN.md §7, wave D). Its two
   standing watches are the holding's plain t.watches (saved as they are: holdings.js saveRec), day and night, each {cap (its
   captain: a name of the holding's people, seeded by the holding, as its workers are named), kinds (its make-up: WATCH), n (how
   many it has now: its fallen are lost, and it takes them back from the garrison over the days, refill), off (worldTime:
   beaten, it keeps in till then)}. The watch sets out (send), comes home (back), walks its beat (beat), is beaten (beaten).
   The whole of it is the system 'patrols' (core/systems.js): each day every watch short of men refills and the one on duty
   goes out (Watches.day); twice a second of the map's time, at the change of the watch, the one on duty sets out
   (Watches.frame, its timer Watches.check). Meeting the guards: Watches.meet, its pt- actions Watches.act. The old names
   (watchesOf, sendWatch, watchBack, patrolDay, patrolWaypoint, patrolMeet, patrolAct, patrolBeaten, patrolWon) are aliases */
const WATCHES=new WeakMap();
class Watches{
  constructor(t){
    this.t=t;
  }
  // a holding's watch (made once and kept aside)
  static of(t){
    let w=WATCHES.get(t);
    if(!w)WATCHES.set(t,w=new Watches(t));
    return w;
  }
  /* its two standing watches: made when first needed, and again (captains, strength and rest kept) when the holding's kind
     changes the watch's size */
  all(){
    const t=this.t,n=t.T.patrol.size,o=t.watches;if(o&&o.day.kinds.length===n)return o;
    const R=seeded(folkHash(t.name+' watch')),rc=k=>RACES[t.races[k%t.races.length]],nm=r=>FOLK_NAMES[r]||FOLK_NAMES.human,a=nm(t.races[0]),b=nm(t.races[1]||t.races[0]);
    let i=Math.floor(R()*a.length),j=Math.floor(R()*b.length);if(a[i]===b[j])j=(j+1)%b.length;const cap={day:a[i],night:b[j]};
    const make=w=>{const X=WATCH[w],kinds=[...Array(n)].map((_,k)=>{const c=rc(k),q=X.lead[k]||X.mix[Math.floor(R()*X.mix.length)];return q==='spear'?UP[c.melee][0]:c[q]});
      return {cap:o?o[w].cap:cap[w],kinds,n:o?Math.min(o[w].n,n):n,off:o?o[w].off:0}};
    return t.watches={day:make('day'),night:make('night')};
  }
  // the watch on duty out on the land; its strength, out or as it would go out now
  out(){
    const t=this.t;
    return W.patrols.find(p=>p.home===t.name&&!p.gone&&watchOf(p)===watchNow());
  }
  power(){
    const p=this.out();if(p)return p.power();const X=this.all()[watchNow()];return rating(X.kinds.slice(0,X.n));
  }
  // the watch on duty goes out, if it is not out already or resting, has half its men or more, and the garrison can spare them
  send(){
    const t=this.t;
    if(!t.owner||besieged(t)||ruined(t))return;const w=watchNow(),X=this.all()[w];if(X.off>worldTime()||W.patrols.some(p=>p.home===t.name&&watchOf(p)===w))return;
    const n=X.n;if(n*2<t.T.patrol.size||t.gar<t.T.patrol.keep+n)return;
    t.gar-=n;W.patrols.push(asParty({pt:true,watch:w,home:t.name,fac:t.owner,troops:X.kinds.slice(0,n),sent:n,x:t.x+rint(-6,6),y:t.y+14,wx:null,wy:null,cool:0,dir:1}));
  }
  // home (or scattered): those still standing rejoin the garrison; the fallen are lost to the watch
  back(p){
    const t=this.t;
    t.gar+=p.troops.length;const X=this.all()[watchOf(p)];X.n=Math.max(0,X.n-((p.sent||p.troops.length)-p.troops.length));p.gone=true;
  }
  // a watch short of men takes WATCH.refill back while the whole garrison (in and out) can spare them
  refill(){
    const t=this.t;
    if(t.owner&&!ruined(t)){const all=t.gar+W.patrols.reduce((a,p)=>a+(p.home===t.name?p.troops.length:0),0);
      for(const X of Object.values(this.all()))if(X.n<X.kinds.length&&all>=t.T.patrol.keep+X.n+WATCH.refill)X.n=Math.min(X.kinds.length,X.n+WATCH.refill)}
  }
  // its beat: from building to building of the holding (its centre, houses, estates and their fields), one of the nearest it has
  // not just left, to a corner just outside it, where it stops a moment to look about; now and then out along its land
  beat(p){
    const t=this.t;
    const ls=(t.lots||[]).filter(l=>l.st!=='ruined'&&l.id!==p.last).sort((a,b)=>Math.hypot((a.x+a.n/2)*TILE-p.x,(a.y+a.n/2)*TILE-p.y)-Math.hypot((b.x+b.n/2)*TILE-p.x,(b.y+b.n/2)*TILE-p.y)).slice(0,4);
    if(ls.length&&(watchOf(p)==='night'||Math.random()<.85)){const l=ls[rint(0,ls.length-1)];p.last=l.id;p.wait=.6+Math.random()*1.4;
      for(let k=0;k<4;k++){const c=rint(0,3),x=(l.x+(c&1?l.n:0))*TILE+(c&1?5:-5),y=(l.y+(c&2?l.n:0))*TILE+(c&2?7:-3);if(passable(terrAt(x,y))){p.wx=x;p.wy=y;return}}
      p.wx=(l.x+l.n/2)*TILE;p.wy=(l.y+l.n)*TILE+6;return}
    p.wait=0;
    const R=t.T.reach;for(let k=0;k<30;k++){const x=(t.tx+rint(-R,R)+.5)*TILE,y=(t.ty+rint(-R,R)+.5)*TILE;if(passable(terrAt(x,y))&&landHold(x,y)===t){p.wx=x;p.wy=y;return}}
    p.wx=t.x;p.wy=t.y+20;
  }
  // beaten: that watch (only) keeps in for a while, short of its fallen; those still standing make their way home
  beatenOff(p){
    this.all()[watchOf(p)].off=worldTime()+PATROL.rest*DAY;this.back(p);
  }

  /* the system: each day, every holding's watches refill, then the one on duty goes out */
  static day(){
    for(const t of TOWNS){
      const w=Watches.of(t);
      w.refill();
      w.send();
    }
  }
  // the change of the watch: the one on duty sets out (checked twice a second of the map's time)
  static frame(d){
    if((Watches.check-=d)<=0){
      Watches.check=.5;
      for(const t of TOWNS)Watches.of(t).send();
    }
  }

  /* meeting the guards (by its captain: the watch's name, his, and its words, WATCH say) */
  static meet(p){
    const t=townBy(p.home),f=FACS[p.fac],c=crimeAt(t),X=WATCH[watchOf(p)],cap='Captain '+(t?Watches.of(t).all()[watchOf(p)].cap:'');G.pt=p;P.tx=null;G.chase=null;p.cool=6;
    if(hostileTo(p.fac))return startEncounter({kind:'patrol',ref:p,list:p.troops.slice(),title:watchName(p)});
    G.mode='dialog';
    if(c&&p.fac!=='player')return showPanel('<h2>The '+X.n.toLowerCase()+' of '+p.home+' stops you</h2><p><b>'+cap+'</b>: &ldquo;You have wronged the people of '+p.home+'. Pay '+c.fine+' gold to set it right, or answer for it.&rdquo;</p>'+
      '<p class="muted">'+p.troops.length+' guards of the <span style="color:'+f.col+'">'+f.n+'</span> (power '+p.power()+' vs your '+partyPower()+'). Refusing makes the '+f.n+' hostile for 20 days.</p><div class="btns">'+
      dlgBtn('pt-pay',null,'Pay '+c.fine+' gold',P.gold<c.fine?'Not enough gold':'',true)+dlgBtn('pt-fight',null,'Refuse and fight')+'</div>'+nav(null,['pt-run',null,'Run for it']));
    const S=X.say,line=p.fac==='player'?S.mine:bandits.some(b=>patrolLand(p,b.x,b.y))?S.band:S.quiet[G.day%S.quiet.length],rum=t?rumourSay(rumourSource('watch',p.home,t,{from:'the watch of '+p.home})):'';// (news on its land: news.js)
    showPanel('<h2>'+watchName(p)+'</h2><p class="muted">'+cap+' and '+p.troops.length+' soldiers of the <span style="color:'+f.col+'">'+f.n+'</span>, '+X.beat+' '+p.home+'.</p><p><b>'+cap+'</b>: &ldquo;'+line+'&rdquo;</p>'+(rum?'<p><b>'+cap+'</b>: &ldquo;Keep your eyes open. '+rum+'&rdquo;</p>':'')+'<div class="btns">'+
      (p.fac==='player'||P.fac===p.fac?'':dlgBtn('pt-attack',null,'Attack (the '+f.n+' turns hostile)'))+'</div>'+nav(null,['dlg-close',null,'Leave']));
  }
  // its pt- actions: pay the fine, run for it, refuse and fight, attack
  static act(a){
    const p=G.pt;if(!p){closeDialog();return}const t=townBy(p.home),c=crimeAt(t);
    if(a==='pt-pay'&&c&&P.gold>=c.fine){P.gold-=c.fine;t.crime=null;addRep(t.name,2,true);G.pt=null;return notice('Fine paid','The guards take '+c.fine+' gold and let you pass. The matter is closed.','good')}
    if(a==='pt-run'){const l=Math.hypot(P.x-p.x,P.y-p.y)||1;walk(P,(P.x-p.x)/l,(P.y-p.y)/l,WORLD_SCALE.ai.slipAway);p.cool=8;G.pt=null;closeDialog();G.encCool=4;log('You slip away from the guards of '+p.home+'. They will be looking for you.','bad');return}
    if(a==='pt-fight'||a==='pt-attack'){realmOf(p.fac).provoke(20,a==='pt-fight'?5:10);G.pt=null;
      return startEncounter({kind:'patrol',ref:p,list:p.troops.slice(),title:watchName(p)})}
  }
  // beaten: the patrol is gone, those still standing make their way home, and that watch (only) keeps in for a while, short of
  // its fallen; its holding remembers
  static beaten(p){
    const t=townBy(p.home);W.patrols=W.patrols.filter(x=>x!==p);if(t)Watches.of(t).beatenOff(p);p.gone=true;return t;
  }
  // (those you slew are its fallen, whether or not the battle took them off it already)
  static won(e,slain){
    const p=e.ref;p.troops=p.troops.slice(0,Math.max(0,e.list.length-(slain||[]).length));const t=Watches.beaten(p);if(t){addRep(t.name,-5,true);t.crime=null}
    return ' The '+WATCH[watchOf(p)].n.toLowerCase()+' of '+p.home+' is scattered: it keeps in until tomorrow, short of its fallen, but the '+(watchOf(p)==='night'?'day':'night')+' watch still goes out.';
  }
}
// (the half-second timer for the change of the watch: from 0 again in a new game or a load, so a game never runs on from the last
// one's timer and the same game plays the same in one page)
Watches.check=0;onWorld(()=>{Watches.check=0});
// the old names
const watchesOf=t=>Watches.of(t).all();
const sendWatch=t=>Watches.of(t).send();
const watchBack=(t,p)=>Watches.of(t).back(p);
const patrolDay=()=>Watches.day();
const patrolWaypoint=(p,t)=>Watches.of(t).beat(p);
// (a function, so a test can stand in for it: parties.js PatrolParty meet calls it by name)
function patrolMeet(p){return Watches.meet(p)}
const patrolAct=a=>Watches.act(a);
onAct('pt-',patrolAct);
const patrolBeaten=p=>Watches.beaten(p);
const patrolWon=(e,slain)=>Watches.won(e,slain);

/* on the map: guards on foot behind their banner */
// drawn with every party (render.js drawParties; its look: parties.js)
// its work in the world's day and frame (core/systems.js): the watches' day, and the change of the watch each moment (after the
// other parties, before the land's defence and the patrols' own moments: brains.js)
Systems.add({name:'patrols',order:{day:40,frame:101},day:()=>Watches.day(),frame:d=>Watches.frame(d)});
