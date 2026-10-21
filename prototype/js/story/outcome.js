'use strict';
/* ---------- outcomes: what a choice does, declared (doc/STORY_DESIGN.md §3.5; the story wave, S0) ----------
   An outcome is plain data, e.g. {gold:20, honor:[fac,-5], morale:-3, say:'You take 20 gold.'}. Each key is one effect,
   done by its handler (Outcome.handlers), in the order the keys are written: the very calls today's choices made, in their
   order (P.gold+=…, foodTake, invAdd, addRep, addHonor, gainXp, train, mood…), so moving a choice onto an outcome changes
   nothing. No handler draws Math.random: a choice that rolls rolls first, then returns the outcome of what came up.
   - Outcome.apply(o, ctx) (applyOutcome): does it. ctx.e is the happening it is about (an encounter on the road: the fight,
     the chase and the end need it). Returns what came of it, res: what each handler got (res.goods.iron: the iron that fit
     in your bag; res.gear: the piece, if it fit; res.cost: what a wrong cost; res.band: the band set on the map…) and
     res.say, the result's line: o.say (words, or a function of res), else a handler's own (the chase's).
   - Outcome.facts(o) and describeOutcome(o): its text from the same object ('+20 gold · honour with the Vale −5 · morale −3'),
     so what a button says and what it does cannot drift apart. Silent effects (a companion's mood, a log line, the end) say
     nothing.
   A new effect (a title, a trophy, a passenger) is one more handler here, with its text (a quest item: item). */
const Outcome={
  // (a number with its sign: +3, −3)
  signed(n){
    return (n<0?'−':'+')+Math.abs(n);
  },
  // (gold as {n, min}: never below min)
  amount(v){
    return typeof v==='number'?v:v.n;
  },
  handlers:{
    // gold: n (or {n, min}: P.gold no lower than min)
    gold:{
      apply(v){
        if(typeof v==='number')P.gold+=v;
        else P.gold=Math.max(v.min,P.gold+v.n);
      },
      text:v=>Outcome.signed(Outcome.amount(v))+' gold',
    },
    // food: −n, taken from any food you carry (core/inventory.js foodTake)
    food:{
      apply(v,ctx,res){
        res.food=foodTake(-v);
      },
      text:v=>Outcome.signed(v)+' food',
    },
    // goods: {good: n}, into your bag (invAdd: res.goods[good], what fit) or, n below 0, out of it (goodTake)
    goods:{
      apply(v,ctx,res){
        for(const [g,n] of Object.entries(v))res.goods[g]=n<0?-goodTake(g,-n):invAdd('good',g,n);
      },
      text:v=>Object.entries(v).map(([g,n])=>Outcome.signed(n)+' '+GOODS[g].n.toLowerCase()),
    },
    // gear: an item id, into your bag (res.gear: it, if it fit)
    gear:{
      apply(v,ctx,res){
        res.gear=invAdd('gear',v,1)?v:null;
      },
      text:v=>'a '+ITEMS[v].n,
    },
    // item: {give: id}, a quest item (QUEST_ITEMS) into your bag, bound to the quest or thread this is part of (core/items.js
    // QuestItem: gone when it ends; res.item: it); {take: id}, one out of it (handed over)
    item:{
      apply(v,ctx,res){
        const Q=ITEM_KINDS.quest;
        if(v.give)res.item=Q.give(v.give,ctx.e)?v.give:null;
        if(v.take)Q.take(v.take);
      },
      text:v=>[v.give&&'the '+QUEST_ITEMS[v.give].n.toLowerCase(),v.take&&'you hand over the '+QUEST_ITEMS[v.take].n.toLowerCase()],
    },
    // troops: {unit: n}, joining your band
    troops:{
      apply(v){
        for(const [k,n] of Object.entries(v))P.add(k,n);
      },
      text:v=>Object.entries(v).map(([k,n])=>Outcome.signed(n)+' '+ST[k].n),
    },
    // lose: a unit, one of it gone from your band
    lose:{
      apply(v,ctx,res){
        P.remove(v);
        res.lost=v;
      },
      text:v=>'−1 '+ST[v].n,
    },
    // wounded: {unit: n}, out of the line and riding with you while they heal (P.wounded, as a battle leaves them)
    wounded:{
      apply(v){
        P.wounded=P.wounded||{};
        for(const [k,n] of Object.entries(v)){
          const m=P.remove(k,n);
          if(m)P.wounded[k]=(P.wounded[k]||0)+m;
        }
      },
      text:v=>Object.entries(v).map(([k,n])=>n+' '+ST[k].n+' wounded'),
    },
    // rep: [holding's name, n] (none: nothing), quietly
    rep:{
      apply(v){
        if(v[0])addRep(v[0],v[1],true);
      },
      text:v=>v[0]?'reputation in '+v[0]+' '+Outcome.signed(v[1]):'',
    },
    // honor: [realm, n] (none: nothing), quietly
    honor:{
      apply(v){
        if(v[0])addHonor(v[0],v[1],true);
      },
      text:v=>v[0]&&FACS[v[0]]?'honour with the '+FACS[v[0]].n+' '+Outcome.signed(v[1]):'',
    },
    renown:{
      apply(v){
        P.renown+=v;
      },
      text:v=>'renown '+Outcome.signed(v),
    },
    // morale: n (kept between 0 and 100 by whoever shows the result, as the road's page does), or {n, min, max}: kept
    // between them at once (a place's page: the shrine)
    morale:{
      apply(v){
        if(typeof v==='number')P.morale+=v;
        else P.morale=clamp(P.morale+v.n,v.min,v.max);
      },
      text:v=>'morale '+Outcome.signed(Outcome.amount(v)),
    },
    // vitals: 'rest' (stamina and mana back, a quarter of your health) or 'full' (all of them: combat.js restoreVitals)
    vitals:{
      apply(v){
        if(v==='full')return restoreVitals();
        const m=vitals();
        P.sp=m[1];
        P.mp=m[2];
        P.hp=Math.min(m[0],P.hp+m[0]*.25);
      },
      text:v=>v==='full'?'fully restored':'stamina and mana, some health',
    },
    xp:{
      apply(v){
        gainXp(v);
      },
      text:v=>Outcome.signed(v)+' XP',
    },
    // train: [discipline, n]
    train:{
      apply(v){
        train(v[0],v[1]);
      },
      text:v=>SKILLS[v[0]].n,
    },
    // sp: stamina, n
    sp:{
      apply(v){
        P.sp+=v;
      },
      text:v=>Outcome.signed(v)+' stamina',
    },
    // hours: time spent (the clock on, a new day rolling over as on the map: clock.js passHours)
    hours:{
      apply(v){
        Clock.passHours(v);
      },
      text:v=>v===1?'1 hour':v>=1?v+' hours':Math.round(v*60)+' minutes',
    },
    // mood: 'kind' or 'cruel' (your companions' reaction: state.js mood)
    mood:{
      apply(v){
        mood(v);
      },
      text:()=>'',
    },
    // wrong: [holding, CONDUCT entry], charged against it (conduct.js wrong: res.cost, what it cost in words; its text in the same
    // words, a fact each)
    wrong:{
      apply(v,ctx,res){
        res.cost=v[0]?wrong(v[0],v[1]):'';
      },
      text:([t,c])=>{
        if(!t)return '';
        const own=t.owner&&t.owner!=='player';
        return [c.rep&&'reputation in '+t.name+' −'+c.rep,c.morale&&'morale −'+c.morale,own&&c.honor&&'honour with the '+FACS[t.owner].n+' −'+c.honor].filter(Boolean);
      },
    },
    // log: a line (or [line, its class])
    log:{
      apply(v){
        if(typeof v==='string')log(v);
        else log(v[0],v[1]);
      },
      text:()=>'',
    },
    // news: [kind, where, detail] (news.js newsRecord)
    news:{
      apply(v){
        newsRecord(v[0],v[1],v[2]);
      },
      text:()=>'word gets round',
    },
    // fight: {amb, edge} (encounters.js roadFight: an ambush's band, you in their trap), true: the plain one
    fight:{
      apply(v,ctx){
        if(v===true)roadFight(ctx.e);
        else roadFight(ctx.e,v.amb,v.edge);
      },
      text:()=>'a fight',
    },
    // chase: after it on the map (encounters.js roadChase; its line, res.say)
    chase:{
      apply(v,ctx,res){
        res.say=roadChase(ctx.e);
      },
      text:()=>'a chase on the map',
    },
    // end: it is done with now (even a choice that leaves it open); gone: off the map at once
    end:{
      apply(v,ctx){
        ctx.e.done=1;
      },
      text:()=>'',
    },
    gone:{
      apply(v,ctx){
        ctx.e.gone=1;
      },
      text:()=>'',
    },
    // start: another happening (res.started): {k, x, y} an encounter of kind k there (road.js roadSpawn); {thread, memory}
    // a thread of that kind, what it knows to begin with (story/thread.js Thread.start)
    start:{
      apply(v,ctx,res){
        res.started=v.thread?Thread.start(v.thread,v.memory):roadSpawn(v.k,v.x,v.y);
      },
      text:v=>'then: '+(v.thread?kindOf('thread',v.thread):kindOf('encounter',v.k)).n.toLowerCase(),
    },
    // band: a band of raiders set on the map (world.js spawnBandit; res.band, it)
    band:{
      apply(v,ctx,res){
        const n=bandits.length;
        spawnBandit(false);
        res.band=bandits.length>n&&bandits[bandits.length-1];
      },
      text:()=>'word of a band',
    },
    // call: a step of a hook's own, in its place (res.call: what it gave)
    call:{
      apply(v,ctx,res){
        res.call=v(ctx,res);
      },
      text:()=>'',
    },
  },
  // is r an outcome (and not a plain line)?
  is(r){
    return !!r&&typeof r==='object';
  },
  apply(o,ctx){
    const res={goods:{},say:undefined};
    ctx=ctx||{};
    for(const k of Object.keys(o)){
      if(k==='say')continue;
      const h=this.handlers[k];
      if(!h)throw new Error('No outcome handler for '+k);
      h.apply(o[k],ctx,res);
    }
    if(o.say!==undefined)res.say=typeof o.say==='function'?o.say(res):o.say;
    return res;
  },
  // its facts, a few words each, in its order
  facts(o){
    const out=[];
    for(const k of Object.keys(o)){
      if(k==='say')continue;
      const h=this.handlers[k];
      if(!h)throw new Error('No outcome handler for '+k);
      const t=h.text(o[k]);
      for(const x of Array.isArray(t)?t:[t])if(x)out.push(x);
    }
    return out;
  },
  describe(o){
    return this.facts(o).join(' · ');
  },
};
const applyOutcome=(o,ctx)=>Outcome.apply(o,ctx);
const describeOutcome=o=>Outcome.describe(o);
