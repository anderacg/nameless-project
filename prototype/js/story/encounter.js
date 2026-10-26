'use strict';
/* ---------- the Encounter shape: one met on the map (doc/STORY_DESIGN.md §2, the story wave S1; split from story/happening.js,
   the code as it was): its behaviours (Behaviours) and the Encounter class. Its kinds, their numbers, figures and pages: world/road.js ---------- */
/* ---------- the encounters' behaviours: small strategies, chosen by data (the record's beh; its kind's beh to begin with) ----------
   Each: step(e, m) (a moment of it, m: {d (world time), V (your sight), now (hours), dist (from you), see (in your sight), dx, dy
   (to you)}): true when it opened its page, false when it is done for this moment (it ended, or it rests), nothing to go on
   (an ambush may still spring); ends (how one ends when its time is up in your sight, if its kind does not say: 'leave', else
   'unseen'); due(e) (its time is up: what it does first); settle(e) (it was dealt with, or left be: what it does next).
   approach (walks up to you; reaching you, it is met), stay, scene (under way: it plays out by itself), flee (runs as you come; or
   across your view on its own way, hx, hy; or, startled, a little way and then stops: its kind's stop), walk (a procession: on
   along the roads to its goal), leave (walks off: along the road, else away from you), bolt (gone at a run), graze (a stray:
   grazes, trots off from you, and may be sent home), and the chase (one you run after on the map: its own while e.chase is set).
   A new behaviour is one more entry. */
const Behaviours={
  approach:{
    step(e,m){
      if(e.met)return;
      // (to where it meets you on your way, or straight at you)
      const v=ENC_SPD[e.D.spd||'approach'],w=roadWay(e,v),gx=w?w[0]-e.x:m.dx,gy=w?w[1]-e.y:m.dy;
      if(m.dist>8&&Math.hypot(gx,gy)>2)e.go(gx,gy,v,m.d);
      if(m.dist<=ENC_LIFE.hail&&!G.modal&&G.encCool<=0){
        roadMeet(e);
        return true;
      }
    },
    // (its time up, it turns away; met or left be, it goes on its way)
    due(e){
      e.beh='leave';
    },
    settle(e){
      e.beh='leave';
    },
  },
  stay:{
    ends:'leave',
    step(){},
  },
  scene:{
    ends:'leave',
    step(){},
  },
  flee:{
    // (across your view on its own way, or from you once you come near (or it has seen you); one that stops, once startled,
    // runs its whole way and is calm after it, and grazes; the rest are gone once they have run out of your sight)
    step(e,m){
      if(e.met)return;
      const D=e.D;
      if(!e.calm&&(e.hx!=null||e.spooked||m.dist<m.V*(D.spook||ENC_LIFE.spook))){
        if(D.stop)e.spooked=1;
        e.run(m.d,ENC_SPD[e.hx!=null?'run':'flee']);
        e.fled=1;
        if(D.stop&&e.ran>=e.stop)e.calm=1;
      }
      if(e.fled&&!D.stop&&e.vw&&!m.see){
        e.over();
        return false;
      }
    },
    settle(e){
      if(!e.D.stop)e.beh='leave';
    },
  },
  walk:{
    // (on along the roads to its goal; there, or with no way on, it ends out of your sight or at a holding's gate; else it stays
    // at its place a while, or, with no way on, walks off)
    step(e,m){
      const g=e.goal(),ox=e.x,there=!!g&&Math.hypot(g.x-e.x,g.y-e.y)<10;
      if(there||!g||!Router.travel(e,g,moveStep(ENC_SPD.walk,m.d))){
        if(!m.see||there&&g.tw){
          e.over();
          return false;
        }
        e.arrive(m.now,there);
        return false;
      }
      if(e.x!==ox)e.dir=e.x>ox?1:-1;
    },
  },
  leave:{
    step(e,m){
      if(e.lg===undefined)e.lg=roadOffGoal(e);
      e.off(m.d);
      if(!m.see&&m.dist>m.V*.8){
        e.over();
        return false;
      }
    },
  },
  bolt:{
    step(e,m){
      e.go(-m.dx,-m.dy,ENC_SPD.bolt,m.d);
      if(!m.see){
        e.over();
        return false;
      }
    },
  },
  graze:{
    ends:'unseen',
    step(e,m){
      if(e.herded&&e.herded(m))return false;
      if(m.dist<ENC_SHEEP.shy)e.go(-m.dx,-m.dy,ENC_SPD.stray,m.d);
    },
  },
  /* the chase (Chase on its page: encounters.js roadChase), shared: it runs from you at catchSpd; within catchReach you have it
     (nabbed: its page again, the catch's choices); it is away after ENC_CATCH.hours, or once lose × your sight from you */
  chase:{
    step(e,m){
      if(m.dist<=catchReach()&&!G.modal){
        e.nabbed();
        return true;
      }
      if(m.now>=e.chase||m.dist>m.V*ENC_CATCH.lose){
        e.chase=0;
        e.done=1;
        if(G.chase===e)G.chase=null;
        e.say(e.D.lost||'It gets away.','bad');
        e.finish('escaped');
        e.over();
        return false;
      }
      e.run(m.d,catchSpd());
      return false;
    },
  },
};

/* ---------- an encounter on the map (world/encounters.js: its kinds; data/encounters.js: their numbers; its figures, its page). Its record: {rd, i, k, x,
   y, dir, beh, race, t0, end (hours), d0 (how far it first stood), seed, seen (heard or seen: highlighted from then), met, done,
   fin (how its story ended: finish), ...its kind's}; a trace: {rd, i, k, trace, from, end}. A kind's hooks (setup, ending, meet) are called through it, so a kind
   of its own class overrides them as methods ---------- */
class Encounter extends Happening{
  get shape(){
    return 'encounter';
  }
  get mapKind(){
    return 'road';
  }
  // its kind (ROAD_ENC's, a trace's, a part's), and its behaviour now
  get D(){
    return this.kind;
  }
  get behaviour(){
    return Behaviours[this.beh];
  }
  here(){
    return !this.gone&&roadList().includes(this);
  }
  get meetsAnyTime(){
    return true;
  }
  chaseable(){
    return !this.gone&&!this.done&&!this.trace;
  }
  // highlighted: you know of it, it is unmet and still there for you
  marked(){
    return !!this.seen&&!this.met&&!this.done&&!this.trace&&!this.gone;
  }
  // seen: within your sight (woods hide it till nearer); the lights of a bog from farther; an ambush only by Scouting; a trace
  // once its time has come
  inView(V){
    if(this.gone||this.trace&&roadNow()<this.from)return false;
    const D=this.D;
    if(D.hidden&&skill('scout')<INSIGHT.rough)return false;
    return D.glow?this.fromYou()<V*1.3:spotted(this,V);
  }
  pick(at){
    if(this.chaseable()&&this.inView(at.V)){
      const b=this.box();
      at.box(this,b[0],b[1],b[2],b[3]);
      at.add(this,10,4);
    }
  }
  box(){
    return ENC_SCENE.box(this);
  }
  // ---- its kind's hooks: made when it comes (false: no way for it from there), met, and its story ending
  setup(){
    const D=this.D;
    return D.setup?D.setup(this):undefined;
  }
  meet(){
    if(!this.chaseable())return;
    if(this.D.meet)this.D.meet(this);
    else if(this.chase)this.nabbed();
    else roadMeet(this);
  }
  ending(){
    const D=this.D;
    if(D.ending)D.ending(this);
  }
  // ---- presence: its tooltip, its figures, its dot and mark, its banner, its page
  tip(){
    const D=this.D;
    return '<b>'+D.n+'</b><small>'+(D.tip||'')+'</small>'+(this.chaseable()?'<span class="act">Click: meet</span>':'');
  }
  draw(ents,cam,V){
    if(this.inView(V))ENC_SCENE.draw(this,ents,cam);
  }
  marker(){
    return this.marked()?{x:this.x,y:this.y,icon:'!',col:'#e8b94a',tip:this.D.n}:null;
  }
  mapDot(V){
    const k=this.marked()&&this.inView(V)?this.marker():null;
    return k?[k.col,2]:null;
  }
  // (its banner, kept by its key: where it is, done or not, and its kind's stage if it has one: the traveller healed)
  view(){
    const D=this.D;
    return {key:'road:'+this.i+':'+this.k+':'+Math.round(this.x)+','+Math.round(this.y)+':'+(this.done?1:0)+(D.stage?':'+D.stage(this):''),x:this.x,y:this.y+2,alt:D.n,ps:(D.under?D.under(this):[]).concat(ENC_SCENE.pics(this))};
  }
  // its page (story/choice.js ChoicePage): its banner, what you see, its choices; forced: no way out till chosen
  page(){
    const D=this.D,done=!!this.done;
    return {ico:D.ico,title:D.n,sub:regionAt(this.x,this.y).name+' · day '+G.day,banner:this.view(),msg:G.roadMsg,text:D.text(this),facts:D.facts&&D.facts(this),
      choices:D.acts,subject:this,act:'enc-do',done,close:roadForced(this)&&!done?null:['enc-leave',null,D.leave||'Leave']};
  }
  // first heard (a caller, near enough) or seen: the log line, a soft sound unless silent; its call-out waits to be on the screen
  notice(){
    this.seen=1;
    const D=this.D;
    this.say((D.hear||'Your scouts spot '+(D.hidden?'movement in the trees':D.n.toLowerCase())+' to the {d}.').replace('{d}',compass(this.x-P.x,this.y-P.y)));
    if(!D.silent)sfx('notify');
    if(D.heard)D.heard(this);
  }
  /* ---- a moment of it (d: world time, V: your sight, now: hours): true when it opened its page (it reached you, or you sprang
     it). A trace only fades; the chase is its own; then the lifetime (far from you, or done with and out of your sight: over;
     its time up: out of your sight it ends, in it its kind's way: ends), the wary and the far, and its behaviour's step; last, an
     ambush springs as you pass */
  step(d,V,now){
    const D=this.D,dist=this.fromYou(),see=this.inView(V);
    if(this.trace){
      if(now>=this.end)this.gone=1;
      return false;
    }
    if(!this.seen&&!this.met&&!D.part&&(see||D.hear&&dist<V+ENC_SPAWN.near[1]+16))this.notice();
    if(see)this.vw=1;// (it has been in your sight)
    const m={d,V,now,dist,see,dx:P.x-this.x,dy:P.y-this.y};
    if(this.chase)return Behaviours.chase.step(this,m);
    if(dist>Math.max(ENC_LIFE.leave*V,this.d0+ENC_LIFE.slack)||this.done&&!see){
      this.over();
      return false;
    }
    if(now>=this.end){
      const b=this.behaviour;
      if(b.due)b.due(this);
      if(!see||this.timeUp(now,dist,V)){
        this.over();
        return false;
      }
    }
    // (one wary of you that sees you before you see it runs; a click on one you cannot walk up to opens its page at once)
    if(D.wary&&this.beh==='stay'&&!this.seen&&!this.met&&dist<V*D.wary()){
      this.beh='flee';
      this.spooked=1;
    }
    if(D.far&&G.chase===this&&!this.met&&!G.modal&&see){
      roadMeet(this);
      return true;
    }
    const r=this.behaviour.step(this,m);
    if(r!==undefined)return r;
    if(D.spring&&!this.met&&dist<=ENC_LIFE.spring&&!G.modal){
      roadMeet(this);
      return true;
    }
    return false;
  }
  // (a step at speed v toward (sx, sy), facing the way it goes)
  go(sx,sy,v,d){
    if(walk(this,sx,sy,moveStep(v,d)))this.dir=sx>=0?1:-1;
  }
  // a procession's goal: the gate of the holding it walks to (tw), or the place (gx, gy)
  goal(){
    const t=this.tw&&townBy(this.tw);
    return t?gateGoal(t):this.gx!=null?{x:this.gx,y:this.gy}:null;
  }
  // running, shared (one fleeing, one across your view, one you chase): on its own way (hx, hy), else away from you; ran: how
  // far it has run
  run(d,v){
    const own=this.hx!=null,sx=own?this.hx:this.x-P.x,sy=own?this.hy:this.y-P.y,s=moveStep(v,d);
    const ox=this.x;
    if(Router.flee(this,own?{x:this.x-sx,y:this.y-sy}:P,s)){
      if(Math.abs(this.x-ox)>.01)this.dir=this.x>ox?1:-1;
      this.ran=(this.ran||0)+s;
    }
  }
  // run down in the chase: its page again, the catch's choices
  nabbed(){
    this.chase=0;
    this.nab=1;
    roadMeet(this);
  }
  // done with, or left be: whoever walks goes on their way (its behaviour's settle); lights and ambushers are gone
  settle(){
    const b=this.behaviour;
    if(b.settle)b.settle(this);
    if(this.done&&this.D.vanish)this.gone=1;
  }
  // ---- how it ends
  // (its kind's way when its time is up in your sight: its own, else its behaviour's)
  get ends(){
    const D=this.D;
    return D.ends&&this.beh===D.beh?D.ends:this.behaviour.ends||'unseen';
  }
  /* its story over: the one way every ending goes, once (fin: how it ended, kept on its record), told on the bus as
     encounter:ended {e, how}. how: 'done' (dealt with: a choice, or its own story's end: the flock home), 'left' (met and left
     be, or passed by, or ridden away from), 'timeout' (its time ran out unresolved: it ended by itself), 'caught' (a horse
     caught, a stray sent home), 'escaped' (one you chased, or tried to catch, got away), and a fight's: 'won', 'lost' or
     'fled' (begun with encounter:fought: fought; settled with the battle, Encounter.battled, or left before the first blow,
     Encounter.unfought). A trace never ends this way (it only fades) */
  finish(how){
    if(this.fin)return;
    this.fin=how;
    this.announceEnd(how);
  }
  /* it leaves the map. Passed by (you knew of it, never met it): the timer falls by a quarter to a half. Unresolved, its story
     ends by itself: its trace, from when its time would have been up */
  over(){
    if(this.gone)return;
    this.gone=1;
    const R=roadSt(),D=this.D,S=ENC_SPAWN;
    this.ending();
    if(this.seen&&!this.met&&!D.part){
      R.c*=1-S.pass[0]-roadRng().next()*(S.pass[1]-S.pass[0]);
      if(D.after&&!this.done)this.say(D.after(this));
    }
    if(D.trace&&!this.done)this.drop(Math.max(roadNow(),this.end));
    this.finish(this.done?'done':this.met||roadNow()<this.end?'left':'timeout');
  }
  /* ---- a fight on the road begins (world/encounters.js roadFight): off the map at once, encounter:fought {e} on the bus; how it
     ends is the battle's: the fight (Encounter.fight: {e, w (the world it began in)}) is settled by battle:ended (resolution.js),
     or, left before the first blow, once you are back on the map with no battle to face (updateRoad) */
  fought(){
    this.done=1;
    this.gone=1;
    Encounter.fight={e:this,w:W};
    worldEmit('encounter:fought',{e:this});
  }
  // (battle:ended {enc, how}: won, lost, withdrawn (got away: fled); run down, it is to be faced again)
  static battled(d){
    const f=Encounter.fight;
    if(!f||!d||!d.enc||d.enc.road!==f.e||d.how==='rundown')return;
    Encounter.fight=null;
    f.e.finish(d.how==='withdrawn'?'fled':d.how);
  }
  static unfought(){
    const f=Encounter.fight;
    if(!f)return;
    const e=f.e,on=x=>!!x&&x.road===e;
    if(f.w===W&&!e.fin&&(on(G.enc)||on(G.encAgain)||B))return;
    Encounter.fight=null;
    if(f.w===W)e.finish('fled');
  }
  // its trace where it is, from the hour at
  drop(at){
    worldEmit('trace:left',{e:this,trace:this.D.trace});
    const R=roadSt();
    R.on.push(asRoadEnc({rd:1,i:++R.id,k:this.D.trace,trace:1,x:this.x,y:this.y,dir:this.dir,race:this.race,seed:this.seed,from:at,end:at+ENC_LIFE.trace}));
  }
  /* its time up in your sight: true when it ends here and now. Walking off: once, unless it is still running; one walking off
     lingering past its time ends once far, though in your sight; the dying die */
  timeUp(now,dist,V){
    const how=this.ends,L=ENC_LIFE;
    if(how==='die')return now>=this.end+L.dying;
    if(how==='leave'&&this.beh!=='leave'&&!(this.fled&&!this.calm))this.goOff();
    return this.beh==='leave'&&now>=this.end+L.linger&&dist>V*.8;
  }
  // packs up and walks off: its people only; its trace (the cart, the burnt wagon) left now in its place, and it done with (its
  // time ran out: its story ends so)
  goOff(){
    this.beh='leave';
    this.left=1;
    this.ending();
    if(this.D.trace&&!this.done){
      this.drop(roadNow());
      this.done=1;
      this.finish('timeout');
    }
  }
  // a procession at its goal (there) in your sight: it stays a while (praying, at the shrine); with no way on, it walks off
  arrive(now,there){
    if(!there){
      this.end=Math.min(this.end,now);
      this.goOff();
      return;
    }
    const L=ENC_LIFE.pray;
    this.beh='stay';
    this.pray=1;
    this.end=now+L[0]+roadRng().next()*(L[1]-L[0]);
  }
  /* a step walking off (data/encounters.js ENC_OFF): along the road to its tile lg; then (or with none) by the land's ways to its spot
     la away from you; with none, straight away from you */
  off(d){
    const s=moveStep(ENC_SPD.leave,d),g=this.lg,ox=this.x;
    if(g){
      const goal=g[1]*MW+g[0];
      let r=ROAD_OFF.get(this);
      if(!r||r.goal!==goal){
        const st=roadTileBy(this.x,this.y),fr=st<0?null:roadAlong(st,ENC_OFF.steps*2,goal),path=[];
        if(fr&&fr.has(goal))for(let k=goal;k!==-1;k=fr.get(k))path.unshift(k);
        // (it joins the road ahead: at the first of its tiles farther from you than it is, never back past you)
        const d0=this.fromYou(),far=k=>Math.hypot((k%MW+.5)*TILE-P.x,(Math.floor(k/MW)+.5)*TILE-P.y);
        let i=1;
        while(i<path.length&&far(path[i])<=d0)i++;
        r={goal,path,i};
        ROAD_OFF.set(this,r);
      }
      while(r.i<r.path.length){
        const k=r.path[r.i],cx=(k%MW+.5)*TILE,cy=(Math.floor(k/MW)+.5)*TILE,dd=Math.hypot(cx-this.x,cy-this.y);
        if(dd<2){
          r.i++;
          continue;
        }
        if(walk(this,cx-this.x,cy-this.y,Math.min(dd,s))&&Math.abs(cx-this.x)>.5)this.dir=cx>=this.x?1:-1;
        return;
      }
    }
    if(this.la===undefined)this.la=roadAwayAt(this);
    if(!(this.la&&Router.travel(this,{x:this.la[0],y:this.la[1]},s)))Router.flee(this,P,s);
    if(Math.abs(this.x-ox)>.01)this.dir=this.x>ox?1:-1;
  }
}
Encounter.fight=null;
worldOn('battle:ended',d=>Encounter.battled(d));
// (today's names: the road's encounter, and making a record one)
const RoadEncounter=Encounter;
const asEncounter=rec=>Encounter.as(rec);
const asRoadEnc=asEncounter;
