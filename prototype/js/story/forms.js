'use strict';
/* ---------- a story's step forms: one way to write any story (doc/QUESTBOOK_DESIGN.md §10; on the Thread shape, story/thread.js) ----------
   defineStory(id, spec) defines a thread kind whose steps may be written in three short forms besides the thread's own
   ({start, until, how, remember, then}, kept as written):
   - a goal: {goal (a goal kind: visit, deliver, escort, track, clear, beat, hunt, rescue, kill; Stories.goals), its fields (to, give,
     band, n, mon, held, lord, site, near, at…), spec (more of its quest's spec, or all of it: an object or a function of the
     thread), title, text, note, stage, say, days, reward, next (the step after it is done; none: the end), failed (the step if it
     fails; none: the story failed), on ({key: step}: its other ends, an escort's captured (taken by those who beat you: memory.held)
     or lost (taken by no one); a key named here is kept as it is, done or not), key (a function of the event and the thread: its
     end's key in place of its quest's fate, read against on, then done or failed as ever)};
   - a choice: {choose: [options], title, text, who, note, stage}: an option {label, icon, tip, ask, when, need (conditions, or
     functions of the thread), gold (its cost), out (an outcome, or a function), say, how (its key; none: c<i>), next; or a check:
     check (a QUEST_CHECKS name, or {base, parts, cap}: data/chains.js), win, lose, winOut, loseOut, winSay, loseSay};
   - an end: {end: {reward, say, failed}}.
   Every field may be a function of the thread (a computed place, a line from what it remembers), and any step may remember
   (remember(d, th)) what it learnt. Words: {town} {realm} {lord} {you} {to}, and {key} for any other plain field of its memory.
   Outcomes: story/outcome.js's, with rep, honor, rel, approve as plain numbers (at its holding, with its realm, its lord, its
   companion) and once ({once: key, first, then}: first the first time in a game, then after: Thread.once).
   The story's own fields: n (its name), title, text, ico (its pages'), speaker (who speaks on its pages: a function of the
   thread, {name, pic, sub}), fail ({days, say, out}: a deadline for the whole of it, memory.due from the day it begins; passed,
   what it waits on is dropped and it fails, ended 'expired': Stories.expire, each day), resume ({key: step}: ended with that key,
   it is picked up again in a new thread at that step, with its memory; not archived).
   Two registries, a new kind one call: defineGoal(id, {start(step, th), remember?}), defineCond(id, test(v, ctx), why(v)).
   Nothing here draws Math.random: a check rolls the road's stream (Choice.roll), a band's numbers the quests' (questRng) ---------- */
// (the fates a goal's quest ends with: done, on to next; failed, to failed or the story failed)
const STORY_OK=['arrived','cleared','beaten','slain','gone','freed'],STORY_BAD=['late','left','captured','scattered'];
class Stories{
  // ---- a field: plain, or a function of the thread
  static val(x,th){return typeof x==='function'?x(th):x}
  // (a goal's fields resolved, its hooks kept)
  static vals(st,th){const o={};for(const [k,v] of Object.entries(st))o[k]=['remember','how','then','on','when','need'].includes(k)?v:this.val(v,th);return o}
  // ---- its words, from its memory
  static fill(s,th){const m=th?.memory||th||{};s=this.val(s,th);if(s==null)return '';
    return String(s).replace(/\{(\w+)\}/g,(all,k)=>k==='town'?m.town||'':k==='realm'?(m.fac&&FACS[m.fac]?'the '+FACS[m.fac].n:'the realm'):k==='lord'?m.lord||'the lord':k==='you'?heroName()||'stranger':k==='to'?m.to||'':
      typeof m[k]==='string'||typeof m[k]==='number'?String(m[k]):all)}
  // ---- an outcome from a story's (plain numbers by its memory; once: the first time, then after)
  static outcome(o,th){o=this.val(o,th);if(!o)return {};const m=th?.memory||{};
    if(o.once){const first=Thread.once(o.once)==null,r=this.outcome(first?o.first:o.then,th);if(first){const key=o.once,call=r.call;r.call=c=>{Thread.mark(key);if(call)call(c)}}return r}
    const r={...o},l=m.lord&&W.lords.find(x=>x.name===m.lord);
    if(typeof o.rep==='number')r.rep=[m.town,o.rep];if(typeof o.honor==='number')r.honor=[m.fac&&FACS[m.fac]?m.fac:null,o.honor];if(typeof o.rel==='number')r.rel=[l,o.rel,'the work you did'];
    if(typeof o.approve==='number')r.approve=[m.comp||th?.kind?.comp,o.approve];if(typeof o.say==='string')r.say=this.fill(o.say,th);return r}
  // ---- conditions: every one of c holds (none: true; a function of the thread: its own); not: none of its own do
  static holds(c,ctx,th){if(!c)return true;if(typeof c==='function')return !!c(th);return Object.entries(c).every(([k,v])=>{if(k==='not')return !Object.keys(v).some(x=>this.holds({[x]:v[x]},ctx));
    const C=kindOf('cond',k);if(!C)throw new Error('No story condition '+k);return C.test(v,ctx)})}
  static why(c,ctx,th){if(!c)return '';if(typeof c==='function')return c(th)||'';const k=Object.keys(c).find(k=>!this.holds({[k]:c[k]},ctx));return k?(kindOf('cond',k).why?.(c[k],ctx)||'Not yet'):''}
  // (conditions' context: a place, its kind, culture and realm, a lord, a companion)
  static ctx(o){const t=o.town&&townBy(o.town);return {town:t?.name,kind:t?.kind,culture:t?.culture,fac:o.fac||t?.owner,lord:o.lord||null,lordRef:o.lordRef||null,comp:o.comp||null,x:o.x??t?.x,y:o.y??t?.y}}
  static ctxOf(th){const m=th.memory;return this.ctx({town:m.town,fac:m.fac,lord:m.lord,comp:m.comp,x:m.x,y:m.y})}
  // (a check's ENC_STAT key: a named one's, or its own)
  static check(kid,sid,i,c){if(typeof c==='string'){if(!QUEST_CHECKS[c])throw new Error('No story check '+c);const k='chk:'+c;ENC_STAT[k]=ENC_STAT[k]||QUEST_CHECKS[c];return k}
    const k='chk:'+kid+':'+sid+':'+i;ENC_STAT[k]={base:0,cap:.9,...c};return k}
  // ---- a story defined: its steps in any form (a list with ids, or {id: step}); its first; resumed ends not archived
  static define(id,spec){const S=spec.steps,list=Array.isArray(S)?S.map(s=>[s.id,s]):Object.entries(S||{});if(!list.length)throw new Error('The story '+id+' has no steps');
    const K={...spec,id,n:spec.n||spec.title,first:spec.first||(list.some(([s])=>s==='start')?'start':list[0][0])};if(spec.resume)K.resumes=[...new Set([...(spec.resumes||[]),...Object.keys(spec.resume)])];
    K.steps=list.map(([sid,st])=>this.step(K,sid,st));return defineKind('thread',id,K)}
  static step(K,sid,st){if(!st.goal&&!st.choose&&!st.end)return {...st,id:sid};
    const left=th=>th.memory.due!=null?' ('+Math.max(0,th.memory.due-G.day)+' days left)':'',
      note=th=>Stories.fill(st.note||st.title||K.title||K.n,th)+left(th),stage=th=>Stories.fill(st.stage||st.title||st.note||sid,th);
    if(st.end)return {id:sid,stage,note,start:{goal:'end'},form:st,fail:st.end.failed?['failed']:undefined,then:{[st.end.failed?'failed':'done']:null}};
    if(st.choose)return this.page(K,sid,st,note,stage);
    const G0=kindOf('goal',st.goal);if(!G0)throw new Error('The story '+K.id+', step '+sid+': no goal '+st.goal);const on=st.on||{};
    return {id:sid,stage,note,start:{goal:st.goal},form:st,remember:st.remember||G0.remember&&((d,th)=>G0.remember(d,th,st)),
      how:st.how||((d,th)=>{const f=st.key?st.key(d,th):fateOf(d);return f in on?f:f==='captured'&&d?.e?.by?.k==='none'&&'lost' in on?'lost':STORY_OK.includes(f)?'ok':f}),
      fail:st.fail||(st.failed?undefined:STORY_BAD.filter(b=>!(b in on))),then:st.then||{ok:st.next||null,...Object.fromEntries(STORY_BAD.map(b=>[b,st.failed||null])),...on}}}
  // (a choice: a page; each option's key, its how or c<i>, a check's c<i>w or c<i>l (its roll, kept on the memory as it is chosen))
  static page(K,sid,st,note,stage){const then={};
    const choices=st.choose.map((o,i)=>{const k=o.how||'c'+i,odds=o.check&&this.check(K.id,sid,i,o.check),c={icon:o.icon||'scroll',label:o.label,tip:o.tip,ask:o.ask,
        when:o.when?th=>Stories.holds(o.when,Stories.ctxOf(th),th):undefined,need:th=>(o.gold&&P.gold<o.gold?'You have '+P.gold+'g':'')||Stories.why(o.need,Stories.ctxOf(th),th)};
      if(odds){then[k+'w']=o.win||null;then[k+'l']=o.lose||null;
        return {...c,odds,facts(th){return [statRead(odds,{vague:'you cannot tell your odds',what:'to succeed'}),statHelps(odds)]},
          run(th,ch){const won=ch.roll();th.memory.bk=k+(won?'w':'l');const r=Stories.outcome(won?o.winOut:o.loseOut,th);r.say=Stories.fill(won?o.winSay:o.loseSay,th)||r.say||(won?'You succeed.':'You fail.');return r}}}
      then[k]=o.next||null;
      return {...c,how:k,also:o.also,out:th=>{const r=Stories.outcome(o.out,th);if(o.gold)r.gold=-o.gold+(r.gold||0);if(o.say)r.say=Stories.fill(o.say,th);return r}}});
    return {id:sid,stage,note,remember:st.remember,start:{page:{ico:st.ico||K.ico||'scroll',title:th=>Stories.fill(st.title||K.title||K.n,th),text:th=>Stories.fill(st.text||K.text,th),
      who:st.who||K.speaker||undefined,choices}},how:(d,th)=>{const k=th.memory.bk||d.how;delete th.memory.bk;return k},then}}
  // ---- a goal begun: its quest, made where the story is (its memory's holding), from its spec
  static spec(st,th){const K=th.kind,s=typeof st.say==='string'?this.fill(st.say,th):null;
    return {title:this.fill(st.title||K.title||K.n,th),text:this.fill(st.text||st.note||K.text,th),prize:this.outcome(st.reward,th),days:st.days||0,
      say:st.say&&typeof st.say==='object'?st.say:s?{arrive:s,cleared:s,beaten:s,slain:s,band:s,lair:s,paid:s,taken:s}:undefined,...(st.spec||{})}}
  static quest(kind,st,th,more){const r=Thread.starters.quest.start({quest:kind,town:st.town,spec:{...this.spec(st,th),...more,...(st.spec||{})}},th),q=r&&P.quests.find(x=>x.id===r.id);
    if(q?.to?.name)th.memory.to=q.to.name;return r}
  // (a goal's place: {town (filled), lot}, a spot {x, y, name}, or pick: 'realm' (another holding of its realm) or 'any' (another
  // not hostile to you), the nearest)
  static place(to,th){const m=th.memory;if(!to)return {town:m.town};if(to.town)return {town:this.fill(to.town,th),lot:to.lot,i:to.i??th.i};if(to.x!=null)return to;
    const from=townBy(m.town)||P,pool=TOWNS.filter(t=>!t.gone&&t.name!==m.town&&!hostileTo(t.owner)&&(to.pick!=='realm'||t.owner===m.fac));const t=Spatial.nearest(pool,from.x,from.y);return t?{town:t.name,lot:to.lot,i:th.i}:null}
  // (who holds a rescue's captive (world/captives.js carryOff's record): given (an object), the one the story remembers (memory.held,
  // the default when there is one), a band set near (band), the nearest hideout (lair), or the prison of the nearest holding of
  // another realm (holding))
  static held(st,th){const m=th.memory,t=townBy(m.town)||P,at=st.held||(m.held&&m.held.k?'memory':'lair');
    if(typeof at==='object')return at;if(at==='memory')return m.held&&m.held.k&&m.held.k!=='none'?{...m.held}:null;
    if(at==='holding'){const h=Spatial.nearest(TOWNS.filter(x=>!x.gone&&x.owner&&x.owner!=='player'&&x.owner!==m.fac&&x.owner!==P.fac),t.x,t.y);return h?{k:'holding',town:h.name,fac:h.owner}:null}
    if(at==='band'){const p=spotNear(t,8,16);if(!p)return null;const kind=climAt(p.x,p.y)==='desert'?'raiders':climAt(p.x,p.y)==='swamp'?'bog':'bandits',n=st.size||questRng().int(4,6),cap='st:'+th.i;
      const b=asParty({x:p.x,y:p.y,n,kind,list:Rng.use('quests',()=>makeEnemies(n,false,kind)),t:0,a:0,idle:true,cool:0,ld:Rng.use('quests',()=>newChief(kind,2+Math.floor(G.day/20))),carry:[{cap,n:this.fill(st.n||'the captive',th)}]});
      bandits.push(b);return {k:'band',cap,kind,chief:b.ld?.name||''}}
    const s=LairQuest.near(st.near||t,st.band);return s?{k:'lair',site:s.i,sseed:s.seed,lair:s.name,kind:s.bandKind}:null}
  // (a kill's lord: named, or an enemy: of a realm at war with its realm (none: hostile to you), the nearest free one)
  static target(st,th){const m=th.memory,t=townBy(m.town)||P,free=W.lords.filter(l=>!l.dead&&!l.gone&&!l.held);
    if(st.lord&&st.lord!=='enemy')return free.find(l=>l.name===this.fill(st.lord,th))||null;
    return Spatial.nearest(free.filter(l=>m.fac&&FACS[m.fac]?atWar(m.fac,l.fac):hostileTo(l.fac)),t.x,t.y)}
  // (a trail followed: the nearest hideout of its band from where it starts (at), else any, marked; remembered {site, lair, lx,
  // ly}; none: site null, the trail cold)
  static bind(st,th){const s=LairQuest.near(st.at||th.memory.at||{x:th.memory.x,y:th.memory.y},st.band||'bandits');if(!s)return {site:null};s.seen=true;return {site:s.i,lair:s.name,lx:s.x,ly:s.y}}
  // ---- each day: a story whose days are up fails
  static day(){for(const th of Thread.list().on.slice())if(th.memory.due!=null&&G.day>th.memory.due)this.expire(th)}
  // (out of time: what it waits on dropped (a quest off your list, its quarry unmarked), its forfeit, its line; ended, failed)
  static expire(th){const F=th.kind.fail||{},w=th.wait,q=w?.shape==='quest'&&P.quests.find(x=>x.id===w.id);if(q){P.quests=P.quests.filter(x=>x!==q);Quest.unmark(q.id)}
    if(F.out)Outcome.apply(this.outcome(F.out,th),{e:th});log('Quest failed: '+th.title+'. '+(this.fill(F.say,th)||'You ran out of time.'),'bad','story',th.journalKey);th.end('expired')}
}
const defineStory=(id,spec)=>Stories.define(id,spec);
const defineGoal=(id,spec)=>defineKind('goal',id,spec);
const defineCond=(id,test,why)=>defineKind('cond',id,{test,why});
// (a goal step's starter: its form's goal, story/thread.js Thread.starters)
Thread.starters.goal={until:'quest:ended',start:(v,th)=>{const st=Stories.vals(th.current.form,th);return kindOf('goal',v.goal).start(st,th)}};
// ---- the goals: a quest of an existing kind (story/steps.js, world/escort.js); an end pays at once
defineGoal('end',{start(st,th){const E=st.end,o=Stories.outcome(E.reward,th),r=Outcome.apply(o,{e:th}),s=Stories.fill(E.say,th)||r.say;
  if(s)log(s,E.failed?'bad':'good','story',th.journalKey);log((E.failed?'Quest failed: ':'Quest complete: ')+th.title+'.'+(r.say&&r.say!==s?' '+r.say:''),E.failed?'bad':'good','story',th.journalKey);
  updateHUD(true);return {how:E.failed?'failed':'done'}}});
defineGoal('visit',{start:(st,th)=>{const to=Stories.place(st.spec?.to||st.to,th);return to&&Stories.quest('visit',st,th,{to})}});
defineGoal('deliver',{start:(st,th)=>{const to=Stories.place(st.spec?.to||st.to,th);return to&&Stories.quest('deliver',st,th,{to,give:st.give})}});
defineGoal('escort',{start:(st,th)=>{const to=Stories.place(st.spec?.to||st.to,th);return to&&Stories.quest('escort',st,th,{to,who:st.who||'traveller',n:st.n?Stories.fill(st.n,th):undefined})},
  remember:(d,th,st)=>fateOf(d)==='captured'?{held:d?.e?.by||null}:{}});
// (a trail: go to where it starts, and there the nearest hideout of its band is found: Stories.bind)
defineGoal('track',{start:(st,th)=>{const to=Stories.place(st.spec?.to||st.to,th);return to&&Stories.quest('visit',st,th,{to})},
  remember:(d,th,st)=>STORY_OK.includes(fateOf(d))?Stories.bind(Stories.vals(st,th),th):{}});
defineGoal('clear',{start:(st,th)=>{const t=townBy(th.memory.town);return Stories.quest('lair',st,th,{band:st.band,site:st.site,near:st.near||(t?{x:t.x,y:t.y}:{x:th.memory.x,y:th.memory.y})})}});
defineGoal('beat',{start:(st,th)=>Stories.quest('band',st,th,{band:st.band?.name?Stories.fill(st.band.name,th):null,n:st.n})});
defineGoal('hunt',{start:(st,th)=>Stories.quest('beasts',st,th,{mon:st.mon,n:st.n})});
defineGoal('rescue',{start:(st,th)=>{const held=st.spec?.held||Stories.held(st,th);return held&&Stories.quest('held',st,th,{held,n:Stories.fill(st.n||'the captive',th),home:st.home||5,price:st.price||60})}});
defineGoal('kill',{start:(st,th)=>{const l=Stories.target(st,th);return l&&Stories.quest('foe',st,th,{target:l.id})}});
// ---- the conditions: on you, the place it is offered at, its realm, lord and companion
defineCond('level',(v)=>P.level>=v,v=>'Level '+v);
defineCond('renown',(v)=>P.renown>=v,v=>'Renown '+v);
defineCond('honor',(v,c)=>!!c.fac&&!!FACS[c.fac]&&honorWith(c.fac)>=v,v=>'Honour '+v+' with this realm');
defineCond('rel',(v,c)=>{const l=c.lordRef||c.lord&&W.lords.find(x=>x.name===c.lord);return !!l&&relWith(l)>=v},v=>'His regard '+v);
defineCond('realm',(v,c)=>v===true?!!P.fac:v===false?!P.fac:v==='same'?!!P.fac&&P.fac===c.fac:P.fac===v,()=>'Not your realm');
defineCond('war',(v,c)=>!!c.fac&&!!FACS[c.fac]&&realmOf(c.fac).enemies().length>0===!!v);
defineCond('kind',(v,c)=>[].concat(v).includes(c.kind));
defineCond('culture',(v,c)=>[].concat(v).includes(c.culture));
defineCond('day',(v)=>G.day>=v,v=>'Not before day '+v);
defineCond('has',(v)=>!!P.inv.some(s=>s&&s.id===v),v=>'You need '+(ITEMS[v]?.n||v));
defineCond('done',(v)=>Thread.once('book:'+v)!=null||Thread.once(v)!=null);
defineCond('comp',(v)=>compsInBand().includes(v),v=>(COMPS[v]?.short||v)+' must ride with you');
defineCond('approve',(v,c)=>(P.comps[c.comp]?.ap??-99)>=v,v=>'Approval '+v);
defineCond('gold',(v)=>P.gold>=v,v=>'You need '+v+'g');
// (a story begun: its deadline from today; ended with a key its kind resumes at: picked up again there, with its memory)
worldOn('thread:ended',d=>{const th=d?.e,at=th?.kind?.resume?.[d.how];if(at)Thread.start(th.k,th.memory,at)});
Systems.add({name:'deadlines',order:{day:214},day:()=>Stories.day()});
