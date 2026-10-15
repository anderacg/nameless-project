'use strict';
/* ---------- battle control: the one place a group of soldiers is commanded (one BattleControl for each group: B.groups). You (your clicks, keys and buttons) and the AI (a captain:
   commander.js) give it orders the same way, through these methods, and nothing else changes what it does. Its soldiers
   (battle.js aiUnit) are only actors: they keep their places in its formation, pick their foes, shoot and strike. Between
   orders the group minds itself (step): it lets a fallen target go, walks its waypoints, creeps on an advance, backs off
   together when it skirmishes. It decides nothing: when to stop, whom to shoot, when to skirmish are yours or its commander's.
   Its state, read by its soldiers and the HUD: order (hold, charge, advance, withdraw), tgt (the foe it is set on), ax, ay
   (where it stands), face, form, files (its formation), queue (waypoints), mvId (a move under way: battle.js relocating),
   walk, run (its pace), firm, cease, skirmish, melee (its flags: battle.js GRP_FLAGS), pace (its slowest man's speed),
   going (its place on the move), backing (backing off from a foe). An AI keeps its own notes on it too (phase, t, prefer,
   stand, formAt, lax, lay) ---------- */
// (every FORM_SWAP.every seconds its places are shared out again, a swap made when it saves FORM_SWAP.gain px of walking)
const FORM_SWAP={every:1,gain:6};
class BattleControl{
  constructor(id,team,o){Object.assign(this,{id,team,order:'hold',spread:false,ax:0,ay:0,tgt:null,queue:[],form:'line',face:team?Math.PI:0,files:null,mvId:0,run:false},GRP_FLAGS,o||{})}
  get units(){return grpUnits(this.id)}
  // where its men are, on average
  centre(){const m=this.units;return m.length?{x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length}:{x:this.ax,y:this.ay}}
  regroup(){const m=this.units;if(!m.length)return;const C=this.centre();this.ax=C.x;this.ay=C.y}
  // ---------- orders: the same for you and the AI ----------
  // stand where they are
  hold(){this.tgt=null;this.queue=[];this.run=false;this.regroup();this.order='hold'}
  // go to (x,y) and stand there, turned toward it if it is far (face: a facing of its own); run: at a run; a move under way
  moveTo(x,y,o){o=o||{};this.tgt=null;this.queue=[];this.order='hold';this.run=!!o.run;moveOrder(this.id);
    if(o.face!=null){this.face=o.face;if(o.files!==undefined)this.files=o.files;layForm(this.id)}else if(o.turn!==false)faceToward(this.id,x,y);
    this.ax=clamp(x,8,BW-8);this.ay=clamp(y,fieldTop(),fieldBot())}
  // standing (its waypoints kept): from a charge or an advance, where they are
  toHold(){if(this.order!=='hold'){this.regroup();this.order='hold';this.tgt=null}}
  // a waypoint after its last
  queueTo(x,y){this.toHold();this.queue.push({x:clamp(x,8,BW-8),y:clamp(y,fieldTop(),fieldBot())})}
  // put at (x,y) at once (deploying: no march), standing
  placeAt(x,y){this.ax=x;this.ay=y;this.order='hold';this.tgt=null;this.queue=[]}
  // handed to the AI: its notes and waypoints cleared, for a fresh start
  aiReset(){this.phase=null;this.t=0;this.queue=[]}
  // the AI's placing: stand at (x,y); a move (its men break off and go) only when that is well away from where it last stood
  standAt(x,y){this.order='hold';this.tgt=null;this.ax=clamp(x,8,BW-8);this.ay=clamp(y,fieldTop(),fieldBot());
    if(this.lax==null||Math.hypot(this.ax-this.lax,this.ay-this.lay)>CAPT.move){if(this.lax!=null)moveOrder(this.id);this.lax=this.ax;this.lay=this.ay}}
  // set on one foe (run: at a run, a charge); a shield wall breaks to go
  attack(e,o){o=o||{};breakWall(this.id);this.queue=[];this.tgt=e;this.order='charge';if(o.run!=null)this.run=!!o.run}
  // at them all: each man at the foe nearest him
  charge(o){o=o||{};breakWall(this.id);this.queue=[];this.tgt=null;this.order='charge';if(o.run!=null)this.run=!!o.run}
  // walk on at the foe, in its ranks (step)
  advance(){if(this.order!=='advance'){this.regroup();this.order='advance';this.tgt=null}}
  // off the field by your edge, striking no one
  withdraw(){this.tgt=null;this.queue=[];this.run=false;this.regroup();this.order='withdraw';this.ax=B.exit?B.exit.x:MARCH.edge}
  // its pace: walk (keeping its ranks) or run; this order at a run (the AI's charges)
  setWalk(walk){this.walk=!!walk;this.run=false;if(!walk)breakWall(this.id)}
  setRun(run){this.run=!!run}
  setFlag(k,on){this[k]=!!on}
  // a formation (formations.js), facing face, files wide
  setForm(f,o){o=o||{};if(o.face!=null)this.face=o.face;if(o.files!==undefined)this.files=o.files;this.form=f;if(FORMS[f]&&FORMS[f].wedge&&o.files===undefined)this.files=null;layForm(this.id)}
  // a foe worth shooting, pointed out to its shooters (a suggestion: each shoots him if he can reach him: battle.js shooterTarget)
  suggest(t){this.prefer=t||null}
  // ---------- its own moment ----------
  step(dt){
    const m=this.units.filter(u=>!u.rout);
    if(this.tgt&&this.tgt.hp<=0)this.tgt=null;// (its foe fallen: let go)
    // (its place on the move: its men keep walking with it, no stop, step, stop)
    if(this.px==null){this.px=this.ax;this.py=this.ay}else if(this.px!==this.ax||this.py!==this.ay){this.movedAt=B.t;this.px=this.ax;this.py=this.ay}
    this.going=B.t-(this.movedAt??-9)<.5;
    if(!m.length){this.backing=false;return}
    this.pace=Math.min(...m.map(u=>u.s.spd));// (walking: the slowest sets the pace)
    // (its places shared out again now and then: two of its men who would each be nearer their places by swapping, swap; else
    // one who must pass another to get to his can shove and be shoved forever)
    if((this.swapT=(this.swapT||0)-dt)<=0){this.swapT=FORM_SWAP.every;const at=u=>({x:this.ax+(u.sx||0),y:this.ay+(u.sy||0)}),dd=(u,p)=>Math.hypot(u.x-p.x,u.y-p.y);
      for(let i=0;i<m.length;i++)for(let j=i+1;j<m.length;j++){const a=m[i],b=m[j];if(a.hero||b.hero)continue;const pa=at(a),pb=at(b);
        if(dd(a,pb)+dd(b,pa)<dd(a,pa)+dd(b,pb)-FORM_SWAP.gain){const sx=a.sx,sy=a.sy;a.sx=b.sx;a.sy=b.sy;b.sx=sx;b.sy=sy}}}
    // the next waypoint once they are there
    if(this.queue&&this.queue.length&&this.order==='hold'){const cx=m.reduce((a,u)=>a+u.x-(u.sx||0),0)/m.length,cy=m.reduce((a,u)=>a+u.y-(u.sy||0),0)/m.length;
      if(Math.hypot(cx-this.ax,cy-this.ay)<MARCH.reached){const w=this.queue.shift();this.ax=w.x;this.ay=w.y;moveOrder(this.id)}}
    const foes=B.units.filter(e=>e.team!==this.team&&e.hp>0&&!e.rout),C=this.centre(),near=foes.length?foes.reduce((a,e)=>Math.hypot(e.x-this.ax,e.y-this.ay)<Math.hypot(a.x-this.ax,a.y-this.ay)?e:a):null;
    // an advance: its place walks on at the nearest foe till it is close (shooters stop further off)
    if(this.order==='advance'&&near){const dx=near.x-this.ax,dy=near.y-this.ay,d=Math.hypot(dx,dy)||1,stop=m.some(u=>u.s.range)?(m.some(u=>u.s.magic)?60:85):FOE_CMD.clash*.6;
      if(d>stop){this.ax=clamp(this.ax+dx/d*FOE_CMD.advance*dt,8,BW-8);this.ay=clamp(this.ay+dy/d*FOE_CMD.advance*.5*dt,fieldTop(),fieldBot())}}
    const sh=m.filter(u=>u.s.range&&!u.empty);
    // skirmish: a foe who fights hand to hand inside its shooters' keeping distance (SKIRM.keep of their range, at most
    // SKIRM.max), the whole group backs away from him, in its ranks, facing him, at a run, till he is SKIRM.until of it off;
    // but never more than SKIRM.burst at a time: then it stands SKIRM.stand to loose a volley (a foe as fast as they are would
    // otherwise keep them running and never shooting), and backs off again if he is still that near
    const was=this.backing;this.backing=false;
    if(was&&B.t-(this.backAt||0)>SKIRM.burst)this.standTill=B.t+SKIRM.stand;
    if(this.skirmish&&sh.length&&this.order!=='charge'&&!this.tgt&&!(B.t<(this.standTill||0))){let foe=null;
      for(const u of sh){const keep=Math.min(SKIRM.max,u.s.range*SKIRM.keep),e=meleeFoe(u,was?keep*SKIRM.until/SKIRM.keep:keep);if(e){foe=e;break}}
      if(foe&&was&&B.t-(this.backAt||0)>SKIRM.burst)foe=null;
      // (no use running: from a foe clearly faster than they are, or with no room left behind them (the field's edge, a corner):
      // they stand and shoot instead, till he is gone (cornered))
      if(foe&&(foe.s.spd>this.pace*SKIRM.outpaced||this.cornered))foe=null;
      if(foe){const S={x:sh.reduce((a,u)=>a+u.x,0)/sh.length,y:sh.reduce((a,u)=>a+u.y,0)/sh.length},dx=S.x-foe.x,dy=S.y-foe.y,l=Math.hypot(dx,dy)||1,sp=this.pace*dt;
        const nx=clamp(this.ax+dx/l*sp,8+SKIRM.room,BW-8-SKIRM.room),ny=clamp(this.ay+dy/l*sp,fieldTop()+SKIRM.room*.5,fieldBot()-SKIRM.room*.5);
        // (cornered: a step back gains next to nothing on him)
        if(Math.hypot(nx-foe.x,ny-foe.y)-Math.hypot(this.ax-foe.x,this.ay-foe.y)<sp*.3)this.cornered=true;else{this.ax=nx;this.ay=ny;this.backing=true;for(const u of m)u.mvId=this.mvId}}
      else if(this.cornered&&!sh.some(u=>meleeFoe(u,Math.min(SKIRM.max,u.s.range*SKIRM.keep)*SKIRM.until/SKIRM.keep)))this.cornered=false}
    if(this.backing&&!was){this.runWas=this.run;this.run=true;this.backAt=B.t}else if(!this.backing&&was)this.run=this.runWas;
    if(this.backing){this.lax=this.ax;this.lay=this.ay}// (backing off is no move of the AI's: standAt)
  }
}
