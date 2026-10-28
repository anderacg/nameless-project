'use strict';
/* ---------- the questbook: hand-written quests played from data (doc/QUESTBOOK_DESIGN.md; the entries: data/questbook/) ----------
   Each entry of QUESTBOOK becomes a thread kind, 'book:'+id (story/thread.js), made at load (Questbook.compile): its goal steps
   start the step kinds that already exist (story/steps.js, world/escort.js, and the two below), its choices are a page's
   (story/choice.js, with checks), its ends pay its reward (story/outcome.js). Begun (Questbook.take), it is a story in your
   Quests, saved with the threads; its memory is where it was offered: {book, town, fac, lord, x, y, to}.
   Three registries, so a new kind is one call in any file loaded after this one:
   - givers (defineGiver(id, {offers(ctx), fits(entry, ctx)})): who offers an entry, and where: board (the notice board: a row,
     world/quests.js jobsBody), tavern (a card: ui/town.js Tavern), lord (a reply in his talk: story/conversation.js LordSpeaker),
     road (a day's chance on the map, QUESTBOOK_OFFER.road: its first page; none while the tests'
     G.quietEvents holds);
   - goals (defineGoal(id, {start(step, th), words})): what a goal step asks: visit, deliver, clear (a hideout), beat (a band set
     near), hunt (beasts set near), escort (a passenger);
   - conditions (defineCond(id, (v, ctx) => bool)): an entry's when and its giver's at, an option's when and need.
   A check (an option's check): QUEST_CHECKS's name or its own, put in data/encounters.js ENC_STAT as 'qb:…' so the road's odds,
   rolls and Insight read it (Choice.odds); won or lost, its win or lose step. Once a game (once) or again after cool days: the
   day it last ended, Thread.once('book:'+id). Nothing here draws Math.random: a check rolls the road's stream (Choice.roll), a
   band's numbers the quests' (questRng) ---------- */
class Questbook{
  static entry(id){return Object.prototype.hasOwnProperty.call(QUESTBOOK,id)?QUESTBOOK[id]:null}
  static all(){return Object.keys(QUESTBOOK)}
  // (a thread's entry: book:id)
  static of(th){return this.entry(th?.memory?.book||String(th?.k||'').slice(5))}
  // ---- the words: {town} {realm} {lord} {you} {to} from its memory
  static fill(s,th){const m=th?.memory||th||{};return String(s||'').replace(/\{town\}/g,m.town||'').replace(/\{realm\}/g,m.fac&&FACS[m.fac]?'the '+FACS[m.fac].n:'the realm')
    .replace(/\{lord\}/g,m.lord||'the lord').replace(/\{you\}/g,heroName()||'stranger').replace(/\{to\}/g,m.to||'')}
  // ---- an outcome from an entry's (rep, honor, rel as plain numbers: at its holding, with its realm, with its lord)
  static outcome(o,th){if(!o)return {};const m=th?.memory||{},r={...o},l=m.lord&&W.lords.find(x=>x.name===m.lord);
    if(typeof o.rep==='number')r.rep=[m.town,o.rep];if(typeof o.honor==='number')r.honor=[m.fac&&FACS[m.fac]?m.fac:null,o.honor];if(typeof o.rel==='number')r.rel=[l,o.rel,'the work you did'];
    if(typeof o.say==='string')r.say=this.fill(o.say,th);return r}
  // ---- conditions: every one of c holds (none: true); not: none of its own do
  static holds(c,ctx){if(!c)return true;return Object.entries(c).every(([k,v])=>{if(k==='not')return !Object.keys(v).some(x=>this.holds({[x]:v[x]},ctx));const C=kindOf('cond',k);if(!C)throw new Error('No questbook condition '+k);return C.test(v,ctx)})}
  // (what is unmet, in words, for a greyed button)
  static why(c,ctx){if(!c)return '';const k=Object.keys(c).find(k=>!this.holds({[k]:c[k]},ctx));return k?(kindOf('cond',k).why?.(c[k],ctx)||'Not yet'):''}
  // ---- may it be offered: not under way, once done or still cooling, its giver's, its place's and your conditions
  static live(id){return Thread.list().on.some(th=>th.k==='book:'+id)}
  static ready(id){const E=this.entry(id),d=Thread.once('book:'+id);return !this.live(id)&&(d==null||!E.once&&E.cool!=null&&G.day-d>=E.cool)}
  static offers(by,ctx){const G0=kindOf('giver',by);if(!G0)return [];
    const ids=this.all().filter(id=>{const E=this.entry(id);return E.giver?.by===by&&this.ready(id)&&G0.fits(E,ctx)&&this.holds(E.giver.at,ctx)&&this.holds(E.when,ctx)});
    // (the same few for a holding a week: by a hash of the entry, the place and the week, no draw)
    const h=id=>Rng.seedOf('book:'+id+':'+(ctx.town||'')+':'+Math.floor(G.day/7));return ids.sort((a,b)=>h(a)-h(b)).slice(0,QUESTBOOK_OFFER.offers)}
  // ---- begun: its thread, its memory where it was offered; its line
  static take(id,ctx,at,force){const E=this.entry(id);if(!E||this.live(id)||!force&&!this.ready(id))return null;
    const m={book:id,town:ctx.town||Spatial.nearestHolding(P.x,P.y)?.name,fac:ctx.fac||townBy(ctx.town)?.owner||null,lord:ctx.lord||null,x:Math.round(ctx.x??P.x),y:Math.round(ctx.y??P.y)};
    const th=Thread.start('book:'+id,m,at);if(th)log('New quest: '+E.title+'. Track it in your Quests (Q).','gold','story',th.journalKey);return th}
  // (its context for conditions: the place, its realm, the lord)
  static ctx(o){const t=o.town&&townBy(o.town);return {town:t?.name,kind:t?.kind,culture:t?.culture,fac:o.fac||t?.owner,lord:o.lord||null,lordRef:o.lordRef||null,x:o.x??t?.x,y:o.y??t?.y}}
  // ---- the givers' offers drawn: a card (a tavern's), a row (a board's), a reply (a lord's)
  static card(id,t){const E=this.entry(id),g=E.giver,ctx={memory:{town:t.name,fac:t.owner}};
    return {pic:g.pic==='folk'||!g.pic?personPic('folk',t.races?.[0]||'human',Rng.seedOf(id)%4):portrait(g.pic),name:g.name||'A stranger',role:E.title,note:this.fill(E.text,ctx),acts:[['qb-take',id,'Take it']]}}
  static rows(t){return this.offers('board',this.ctx({town:t.name})).map(id=>{const E=this.entry(id);return railRow(E.title,this.fill(E.text,{memory:{town:t.name}}),railBtn('qb-take',id,'Take it'))}).join('')}
  static replies(l){const t=Spatial.nearest(fiefsOf(l.fac),l.x,l.y),ctx=this.ctx({town:t?.name,fac:l.fac,lord:l.name,lordRef:l});
    return this.offers('lord',ctx).map(id=>({act:'qb-take',arg:id+'@'+l.id,label:'Ask about work: '+this.entry(id).title,note:this.fill(this.entry(id).text,{memory:ctx})}))}
  // ---- a road's offer, a day's chance: one that fits where you are, its first page shown when you are free
  static day(){if(G.quietEvents||Captivity.held||G.mode!=='world'||G.modal)return;const ctx=this.ctx({town:Spatial.nearestHolding(P.x,P.y)?.name,x:P.x,y:P.y}),ids=this.offers('road',ctx);
    if(ids.length&&questRng().chance(QUESTBOOK_OFFER.road))this.take(ids[0],{...ctx,x:P.x,y:P.y})}
  // ---- an entry made a thread kind: its steps, by kind
  static compile(id){const E=this.entry(id),ids=Object.keys(E.steps||{});if(!ids.length)throw new Error('The questbook entry '+id+' has no steps');
    return defineKind('thread','book:'+id,{n:E.title,book:id,who:th=>Questbook.fill(E.giver?.name||th.memory.lord||th.memory.town||'',th),first:E.first||(E.steps.start?'start':ids[0]),
      steps:ids.map(sid=>this.step(id,sid,E.steps[sid]))})}
  static step(id,sid,st){const E=this.entry(id),note=th=>Questbook.fill(st.note||st.title||E.title,th),stage=th=>Questbook.fill(st.title||st.note||sid,th);
    if(st.end)return {id:sid,stage,note,start:{goal:{goal:'end',end:st.end}},fail:st.end.failed?['failed']:undefined,then:null};
    if(st.choose)return this.page(id,sid,st,note,stage);
    if(!kindOf('goal',st.goal))throw new Error('The questbook entry '+id+', step '+sid+': no goal '+st.goal);
    // (its fate: done (arrived, cleared, beaten, slain, gone: what it waited on is over) on to next; failed (late, left, captured)
    // to failed, else the quest failed)
    const ok=['arrived','cleared','beaten','slain','gone','freed'],bad=['late','left','captured','scattered'];
    return {id:sid,stage,note,start:{goal:{...st,book:id}},how:d=>{const f=fateOf(d);return ok.includes(f)?'ok':f},
      fail:st.failed?undefined:bad,then:{ok:st.next||null,...Object.fromEntries(bad.map(b=>[b,st.failed||null]))}}}
  // (a choice step: a page; each option's key c<i>, a check's c<i>w or c<i>l (its roll, kept on the memory as it is chosen))
  static page(id,sid,st,note,stage){const E=this.entry(id),then={};
    const choices=st.choose.map((o,i)=>{const k='c'+i,odds=o.check&&this.check(id,sid,i,o.check),c={icon:o.icon||'scroll',label:o.label,tip:o.tip,
        when:o.when?th=>Questbook.holds(o.when,Questbook.ctxOf(th)):undefined,
        need:th=>(o.gold&&P.gold<o.gold?'You have '+P.gold+'g':'')||Questbook.why(o.need,Questbook.ctxOf(th))};
      if(odds){then[k+'w']=o.win||null;then[k+'l']=o.lose||null;
        return {...c,odds,facts(th){return [statRead(odds,{vague:'you cannot tell your odds',what:'to succeed'}),statHelps(odds)]},
          run(th,ch){const won=ch.roll();th.memory.bk=k+(won?'w':'l');const r=Questbook.outcome(won?o.winOut:o.loseOut,th);r.say=Questbook.fill(won?o.winSay:o.loseSay,th)||(won?'You succeed.':'You fail.');return r}}}
      then[k]=o.next||null;
      return {...c,how:k,out:th=>{const r=Questbook.outcome(o.out,th);if(o.gold)r.gold=-o.gold+(r.gold||0);if(o.say)r.say=Questbook.fill(o.say,th);return r}}});
    return {id:sid,stage,note,start:{page:{ico:st.ico||E.ico||'scroll',title:th=>Questbook.fill(st.title||E.title,th),text:th=>Questbook.fill(st.text||E.text,th),
      who:E.giver?.name?th=>({name:Questbook.fill(E.giver.name,th),pic:Questbook.card(id,townBy(th.memory.town)||TOWNS[0]).pic,sub:E.title}):undefined,choices}},
      how:(d,th)=>{const k=th.memory.bk||d.how;delete th.memory.bk;return k},then}}
  // (a check's ENC_STAT key: a named one's, or its own)
  static check(id,sid,i,c){if(typeof c==='string'){if(!QUEST_CHECKS[c])throw new Error('No quest check '+c);const k='qb:'+c;ENC_STAT[k]=ENC_STAT[k]||QUEST_CHECKS[c];return k}
    const k='qb:'+id+':'+sid+':'+i;ENC_STAT[k]={base:0,cap:.9,...c};return k}
  // (a thread's memory as conditions read it)
  static ctxOf(th){const m=th.memory;return this.ctx({town:m.town,fac:m.fac,lord:m.lord,x:m.x,y:m.y})}
  // ---- a goal step begun (Thread.starters.goal): its quest, made where it was offered
  static spec(st,th){const s=this.fill(st.say,th)||undefined;return {title:this.fill(st.title||this.of(th).title,th),text:this.fill(st.text||st.note||this.of(th).text,th),prize:this.outcome(st.reward,th),
    say:s&&{arrive:s,cleared:s,beaten:s,slain:s},days:st.days||0}}
  static quest(kind,st,th,more){const r=Thread.starters.quest.start({quest:kind,spec:{...this.spec(st,th),...more}},th),q=r&&P.quests.find(x=>x.id===r.id);if(q?.to?.name)th.memory.to=q.to.name;return r}
  // (a goal's place: {town (filled), lot}, or pick: 'realm' (another holding of its realm) or 'any' (another not hostile to you), the nearest)
  static place(to,th){const m=th.memory;if(!to)return {town:m.town};if(to.town)return {town:this.fill(to.town,th),lot:to.lot,i:th.i};
    const from=townBy(m.town)||P,pool=TOWNS.filter(t=>!t.gone&&t.name!==m.town&&!hostileTo(t.owner)&&(to.pick!=='realm'||t.owner===m.fac));const t=Spatial.nearest(pool,from.x,from.y);return t?{town:t.name,lot:to.lot,i:th.i}:null}
}
// (a step's key: its quest's fate, else the event's how: story/wounded.js fateOf)
// ---- the registries
const defineGiver=(id,spec)=>defineKind('giver',id,{fits:()=>true,...spec});
const defineGoal=(id,spec)=>defineKind('goal',id,spec);
const defineCond=(id,test,why)=>defineKind('cond',id,{test,why});
defineGiver('board',{fits:(E,c)=>!!c.town});
defineGiver('tavern',{fits:(E,c)=>!!c.town&&!!townBy(c.town)?.T.tabs.includes('tavern')});
defineGiver('lord',{fits:(E,c)=>!!c.lord});
defineGiver('road',{fits:()=>G.mode==='world'||G.mode==='dialog'});
// (the goals: a quest of an existing kind; an end pays at once)
defineGoal('end',{start(st,th){const o=Questbook.outcome(st.end.reward,th),r=Outcome.apply(o,{e:th}),s=Questbook.fill(st.end.say,th)||r.say;
  if(s)log(s,st.end.failed?'bad':'good','story',th.journalKey);log((st.end.failed?'Quest failed: ':'Quest complete: ')+th.title+'.'+(r.say&&r.say!==s?' '+r.say:''),st.end.failed?'bad':'good','story',th.journalKey);
  updateHUD(true);return {how:st.end.failed?'failed':'done'}}});
defineGoal('visit',{start:(st,th)=>{const to=Questbook.place(st.to,th);return to&&Questbook.quest('visit',st,th,{to})}});
defineGoal('deliver',{start:(st,th)=>{const to=Questbook.place(st.to,th);return to&&Questbook.quest('deliver',st,th,{to,give:st.give})}});
defineGoal('escort',{start:(st,th)=>{const to=Questbook.place(st.to,th);return to&&Questbook.quest('escort',st,th,{to,who:st.who||'traveller',n:st.n?Questbook.fill(st.n,th):undefined})}});
defineGoal('clear',{start:(st,th)=>{const t=townBy(th.memory.town);return Questbook.quest('lair',st,th,{band:st.band,near:t?{x:t.x,y:t.y}:{x:th.memory.x,y:th.memory.y}})}});
defineGoal('beat',{start:(st,th)=>Questbook.quest('bookband',st,th,{band:st.band?.name?Questbook.fill(st.band.name,th):null,n:st.n})});
defineGoal('hunt',{start:(st,th)=>Questbook.quest('bookbeast',st,th,{mon:st.mon,n:st.n})});
// (the conditions: on you, the place it is offered at, its realm and lord)
defineCond('level',(v)=>P.level>=v,v=>'Level '+v);
defineCond('renown',(v)=>P.renown>=v,v=>'Renown '+v);
defineCond('honor',(v,c)=>!!c.fac&&!!FACS[c.fac]&&honorWith(c.fac)>=v,v=>'Honour '+v+' with this realm');
defineCond('rel',(v,c)=>{const l=c.lordRef||c.lord&&W.lords.find(x=>x.name===c.lord);return !!l&&relWith(l)>=v},v=>'His regard '+v);
defineCond('realm',(v,c)=>v===true?!!P.fac:v===false?!P.fac:v==='same'?!!P.fac&&P.fac===c.fac:P.fac===v,()=>'Not your realm');
defineCond('war',(v,c)=>!!c.fac&&FACS[c.fac]&&realmOf(c.fac).enemies().length>0===!!v);
defineCond('kind',(v,c)=>[].concat(v).includes(c.kind));
defineCond('culture',(v,c)=>[].concat(v).includes(c.culture));
defineCond('day',(v)=>G.day>=v,v=>'Not before day '+v);
defineCond('has',(v)=>!!P.inv.some(s=>s&&s.id===v),v=>'You need '+(ITEMS[v]?.n||v));
defineCond('done',(v)=>Thread.once('book:'+v)!=null);
defineCond('comp',(v)=>compsInBand().includes(v),v=>(COMPS[v]?.short||v)+' must ride with you');
defineCond('gold',(v)=>P.gold>=v,v=>'You need '+v+'g');
// (a goal step's starter for every thread: story/thread.js Thread.starters)
Thread.starters.goal={until:'quest:ended',start:(v,th)=>kindOf('goal',v.goal.goal).start(v.goal,th)};
/* beat a band (spec: {band (its name; none: one of BAND_NAMES), n (its size; none: 4–6 and more with the days), title, text, prize,
   say, days}): set near its holding, as a bounty's (world/quests.js BountyQuest); broken by you (band:beaten): beaten; gone to
   ground everywhere, broken by another: over (gone) */
class BookBandQuest extends StepQuest{
  setup(t,lord,s){this.band=s.band||questRng().pick(BAND_NAMES);this.n=s.n||questRng().int(4,6)+Math.floor(G.day/12);this.giver=t.name;
    this.title=s.title||'Break the '+this.band;this.text=s.text||'Find the '+this.band+' near '+t.name+' and break them.';this.takes(s)}
  begin(t){const p=spotNear(t,8,16);if(!p)return false;const kind=climAt(p.x,p.y)==='desert'?'raiders':climAt(p.x,p.y)==='swamp'?'bog':'bandits';
    const list=Rng.use('quests',()=>makeEnemies(this.n,false,kind)),ld=Rng.use('quests',()=>newChief(kind,2+Math.floor(G.day/20)));
    bandits.push(asParty({x:p.x,y:p.y,n:this.n,kind,list,t:0,a:0,idle:true,cool:0,qid:this.id,name:this.band,ld}));this.x=p.x;this.y=p.y}
  seek(){const b=bandits.find(x=>x.qid===this.id)||Quest.quarry(this.id)[0];return b?{x:b.x,y:b.y,name:'the '+this.band}:null}
  get deed(){return 'band:beaten'}
  hits(d){return d.band?.qid===this.id}
  finish(){Quest.unmark(this.id);this.pay('beaten','beaten')}
  todo(){return 'Break the '+this.band+'.'}
  lapse(){if(!Quest.quarry(this.id).some(o=>!o.gone))return this.over('gone','gone');super.lapse()}
}
/* hunt beasts (spec: {mon (a MONSTERS id; none: of its holding's lands), n, title, text, prize, say, days}): set near its holding,
   as a beast hunt's (world/quests.js BeastQuest); slain by you (monster:slain): slain; gone: over (gone) */
class BookBeastQuest extends StepQuest{
  setup(t,lord,s){const ids=Object.keys(MONSTERS).filter(id=>MONSTERS[id].where.includes(t.clim)||MONSTERS[id].where.includes('forest')&&t.clim==='grass');
    this.mon=s.mon||(ids.length?questRng().pick(ids):'wolf');const M=MONSTERS[this.mon];if(!M)return false;this.n=s.n||Math.max(...M.count);this.lv=monLevel(questRng())+1;this.giver=t.name;
    this.title=s.title||'Hunt the '+M.n.toLowerCase();this.text=s.text||cap1(M.n.toLowerCase())+' prowl near '+t.name+'. Hunt them down.';this.takes(s)}
  begin(t){const M=MONSTERS[this.mon],p=spotNear(t,6,14,(x,y)=>M.where.some(w=>habitatAt(x,y).includes(w)))||spotNear(t,6,14);if(!p)return false;
    W.monsters.push(asMonster({id:this.mon,x:p.x,y:p.y,hx:p.x,hy:p.y,lv:this.lv,n:this.n,t:0,a:0,cool:0,qid:this.id}));this.x=p.x;this.y=p.y}
  seek(){const m=W.monsters.find(x=>x.qid===this.id);return m?{x:m.x,y:m.y,name:MONSTERS[this.mon].n.toLowerCase()}:null}
  get deed(){return 'monster:slain'}
  hits(d){return d.monster?.qid===this.id}
  finish(){this.pay('slain','slain')}
  todo(){return 'Hunt the '+MONSTERS[this.mon].n.toLowerCase()+'.'}
  lapse(){if(!W.monsters.some(m=>m.qid===this.id))return this.over('gone','gone');super.lapse()}
}
defineKinds('step',{},{bookband:{cls:BookBandQuest},bookbeast:{cls:BookBeastQuest}});
// (over, however it ended: the day kept, for once and cool)
worldOn('thread:ended',d=>{const k=d?.e?.k;if(typeof k==='string'&&k.startsWith('book:'))Thread.mark(k)});
// every entry made a thread kind, at load
for(const id of Questbook.all())Questbook.compile(id);
// (its offers taken: from a tavern's card, a board's row (the holding you are in), a lord's reply (id@lord))
onAct('qb-',(a,arg)=>{if(a!=='qb-take')return;const [id,lid]=String(arg).split('@'),l=lid&&W.lords.find(x=>String(x.id)===lid),t=G.town?.ref;
  const ctx=l?Questbook.ctx({town:Spatial.nearest(fiefsOf(l.fac),l.x,l.y)?.name,fac:l.fac,lord:l.name,lordRef:l}):Questbook.ctx({town:t?.name});
  if(!Questbook.take(id,ctx))return;updateHUD(true);if(G.town)return renderTown();if(G.mode==='dialog'){G.enc=null;G.mode='world';hidePanel()}});
Systems.add({name:'questbook',order:{day:215},day:()=>Questbook.day()});
