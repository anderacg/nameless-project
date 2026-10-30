'use strict';
/* ---------- the test kit: the helpers the suites used to copy (doc/CORE_DESIGN.md, K2) ----------
   Loaded by tests/harness.js before every suite (it is not a suite itself: the runners leave it out of the full sweep), so a
   suite can use Kit.* at once. Each helper does exactly what the suites' own copies did; a suite that needs a little more
   says so (Kit.world({town:null}), Kit.done({cont:true})).
   Kit.suite(body): window.RUN with the report made: body({ok, info, o}) runs in a try (an exception reads EXC), then the
   report, with the page's errors (ERR), goes into <pre id="OUT"> for the runner to read. */
const Kit={
  // ---- the report
  report(){
    const o=[];
    return {
      o,
      ok:(c,m)=>o.push((c?'PASS ':'FAIL ')+m),
      info:m=>o.push('INFO '+m),
      exc:e=>o.push('EXC '+e.message+' '+e.stack),
      out(){
        const d=document.createElement('pre');
        d.id='OUT';
        d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');
        document.body.appendChild(d);
      },
    };
  },
  suite(body){
    window.RUN=()=>{
      const r=Kit.report();
      try{
        body(r);
      }catch(e){
        r.exc(e);
      }
      r.out();
    };
  },
  // ---- the page
  q:s=>document.querySelector(s),
  qa:s=>[...document.querySelectorAll(s)],
  // the panel's HTML and its text
  panel:()=>document.getElementById('panel').innerHTML,
  text:()=>document.getElementById('panel').textContent,
  // a key pressed (code: 'KeyP', 'Escape'…; key: its character)
  key:(code,k)=>window.dispatchEvent(new KeyboardEvent('keydown',{code,key:k,bubbles:true})),
  // ---- a game
  // no saves or settings left from an earlier suite
  fresh(){
    try{localStorage.clear()}catch(e){}
  },
  // a new game (bg: the background; seed: Math.random seeded first), its events quiet
  begin(bg,seed){
    Kit.fresh();
    if(seed!=null)Math.random=T.seeded(seed);
    T.act('begin',bg||'soldier');
    T.G.quietEvents=true;
  },
  // nothing on the map but you and the holdings (what is left out: keep, a list of the names to keep)
  clear(keep){
    const W=T.W,k=new Set(keep||[]);
    if(!k.has('bandits'))T.bandits.length=0;
    for(const n of ['monsters','caravans','refugees','folk','patrols','fights','critters'])if(!k.has(n))W[n]=[];
    if(!k.has('lords'))W.lords.forEach(l=>{l.x=-9999;l.y=-9999});
  },
  // back on the map: the panel hidden, no meeting (more: other fields of G to set, as {town:null, encCool:0})
  world(more){
    const G=T.G;
    T.hidePanel();
    G.mode='world';
    G.modal=false;
    G.enc=null;
    if(more)Object.assign(G,more);
  },
  // the marching armies on the map (world/march.js): their soldiers and leaders are the battle's figures drawn smaller
  // (WORLD_BATTLE.sprite/scale), so resampled on purpose; Kit.marching is true while one is drawn (watchMarch: the hook on,
  // its return takes it off; hide: not drawn at all, for a look at the map's own pixels)
  marching:false,
  watchMarch(hide){
    const fs=['drawMarcher','drawMarchLeader',...(hide?['marchCircle']:[])],keep=fs.map(n=>window[n]);// (hidden: their rings too, drawn smooth)
    fs.forEach((n,i)=>{window[n]=function(){if(hide)return;Kit.marching=true;try{return keep[i].apply(this,arguments)}finally{Kit.marching=false}}});
    return ()=>fs.forEach((n,i)=>{window[n]=keep[i]});
  },
  // a battle begun as Start Battle begins it: a world battle's armies formed up first (worldbattle.js BattleMuster), at most steps of
  // dt s (false: they never formed up)
  engage(steps=4000,dt=.05){
    const b=T.B;if(!b)return false;
    for(let i=0;i<steps&&b.muster?.active&&T.B===b;i++)T.updateBattle(dt);
    T.beginFight();return !b.muster?.active;
  },
  // the perks offered taken, the first each time (cont: the result's Continue first; world: then back on the map)
  done(o){
    const G=T.G;
    if(o&&o.cont)T.act('cont');
    while(G.mode==='perk')T.act('perk',G.perkOffer[0]);
    if(o&&o.world)Kit.world(o.world===true?null:o.world);
  },
  // you at (x,y), going nowhere, the land around you seen
  goTo(x,y){
    const P=T.P;
    P.x=x;
    P.y=y;
    P.tx=null;
    P.stay=null;
    T.reveal();
  },
  // you at a holding's gate (by name or the holding; Ashford by default)
  goHome(town){
    const h=typeof town==='object'?town:T.townBy(town||'Ashford');
    Kit.goTo(h.x,h.y);
    return h;
  },
  // ---- time
  // n steps of fn(dt) (the world's by default), stopping early once until() holds; the steps taken
  frames(n,dt,fn,until){
    const step=fn||(d=>T.updateWorld(d));
    let i=0;
    for(;i<n&&!(until&&until());i++)step(dt==null?.05:dt);
    return i;
  },
  // travel toward (x,y) on the map until you get there, something stops you, or max steps; the steps taken
  travel(x,y,max){
    const P=T.P,G=T.G;
    P.tx=x;
    P.ty=y;
    return Kit.frames(max||4000,.05,null,()=>G.mode!=='world'||P.tx==null||Math.hypot(P.x-x,P.y-y)<2);
  },
  // ---- the dice
  // Math.random fixed (v: a number, or a function) while fn runs
  stub(v,fn){
    const r0=Math.random;
    Math.random=typeof v==='function'?v:()=>v;
    try{return fn()}finally{Math.random=r0}
  },
  // Math.random gives vals in turn, then a seeded stream, while fn runs
  rolls(vals,fn,seed){
    const r0=Math.random,s=T.seeded(seed==null?4242:seed);
    let i=0;
    Math.random=()=>i<vals.length?vals[i++]:s();
    try{return fn()}finally{Math.random=r0}
  },
  // Math.random seeded while fn runs
  seeded(seed,fn){
    return Kit.stub(T.seeded(seed),fn);
  },
  /* a named stream's draws fixed while fn runs (core/rng.js: the story's and the content's, 'road', 'quests'…; what Kit.stub
     and Kit.rolls do for Math.random): v a number (every draw), a function, or a list (its values in turn, then the stream's
     own). Its int, chance, pick and weighted read them too */
  stubStream(name,v,fn){
    const s=T.rngOf(name),own=s.next;
    let i=0;
    s.next=Array.isArray(v)?()=>i<v.length?v[i++]:own.call(s):typeof v==='function'?v:()=>v;
    try{return fn()}finally{delete s.next}
  },
  // ---- meetings
  // a meeting on the map (e: as startEncounter takes it, {kind, ref, list…}), from the map
  meet(e){
    Kit.world();
    T.G.enc=e;
    T.startEncounter(e);
    return e;
  },
  // ---- the story's test kinds (doc/STORY_DESIGN.md S5): the game registers no thread nor gathering yet, so the suites that prove
  // their frameworks (threads, kinds) register these, once, inside the test page only
  storyKinds(){
    if(T.kindOf('thread','test_thread'))return;
    // a thread: a job taken at the memory's town; paid, an encounter where the memory says; failed, a page of two choices
    T.defineKind('thread','test_thread',{n:'A test thread',steps:[
      {id:'job',start:{quest:'supply',town:th=>th.memory.town},remember:d=>({giver:d.e.giver}),then:{paid:'meet',failed:'regret'}},
      {id:'meet',start:{encounter:'merchant',x:th=>th.memory.x,y:th=>th.memory.y}},
      {id:'regret',start:{page:{title:'Word from the giver',text:th=>(th.memory.giver||'The giver')+' is disappointed in you.',choices:[
        {icon:'gold',label:'Make amends',how:'amends',out:()=>({gold:-5,say:'You pay for the trouble.'})},
        {icon:'shoe',label:'Shrug it off',how:'shrug',out:()=>({log:'You shrug it off.'})}]}},then:{amends:null,shrug:null}}]});
    // a gathering: at the first three holdings, every 12 days, told of 3 days ahead, open for 2, a fee of 10
    T.defineKind('gathering','test_fair',{n:'Test fair',ico:'banner',text:'Stalls and games on the green.',places:()=>T.TOWNS.slice(0,3).map(h=>h.name),
      schedule:{every:12},announce:3,lasts:2,fee:10});
  },
};
