'use strict';
/* ---------- choices and their page (doc/STORY_DESIGN.md §3.4; the story wave, S0) ----------
   A Choice is one verb on a page: a happening's (a road encounter's), a thing's (the sealed letter's) or a place's (a shrine's).
   Made from its spec, plain data, each field read with the subject s it is about (the encounter, the letter, the site):
     icon, label, tip (label and tip: plain, or of s: a person's he or she, core/pronouns.js); words: what your hero says choosing it;
     when(s): offered now (none: always);
     need(s): why it is greyed ('' or false: free to choose);
     ask(s): the confirm before it (what cannot be undone; none or null: no confirm);
     again: the page stays open after it;
     odds: an ENC_STAT check (world/encounters.js statOdds): chance() its odds, roll() the draw, read(o) its Insight read, helps() the
       stats that help;
     out(s): its outcome (Outcome, story/outcome.js), built without doing anything and without a draw, so it can be shown
       as well as done; or run(s, choice): a hook for what an outcome cannot say (a roll, a chase, its own state), returning
       an outcome for its plain part or the result's line;
     facts(s): what its button says: written from out's outcome (Outcome.facts), and also(s) the lines no outcome can say,
       after it (a trap, a stat that helps); by hand only for a run hook, whose outcome is known only once done.
   perform(s) does it and gives the result's line. Choice.list(specs) makes a list of them (one made already is kept).
   ChoicePage (on window.js PageScreen) shows any of them: its header, its banner, the last result, what you see (text and
   its facts, or a body of its own), the choices as key actions, and its bottom bar (nav: Back on the left, the way out on
   the right: the frame rule). Kinds never build the page: they say what is there. */
class Choice{
  constructor(spec){
    Object.assign(this,spec);
  }
  static list(specs){
    return specs.map(s=>s instanceof Choice?s:new Choice(s));
  }
  // offered now; why not ('' when it can be chosen); the confirm's words (null: none)
  shown(s){
    return !this.when||!!this.when(s);
  }
  why(s){
    return this.need&&this.need(s)||'';
  }
  asks(s){
    return this.ask&&this.ask(s)||null;
  }
  // what it will do, without doing it (only a declared out: run's is known only once done)
  preview(s){
    return this.out?this.out(s):null;
  }
  // its button's words: from its outcome (and its own lines after), else by hand
  factsFor(s){
    if(this.facts)return this.facts(s);
    const o=this.preview(s);
    if(!o)return undefined;
    const fs=Outcome.facts(o);
    return this.also?fs.concat(this.also(s)):fs;
  }
  // ---- its odds (ENC_STAT)
  chance(){
    return statOdds(this.odds);
  }
  // (the road's stream: its odds are the road's checks, core/rng.js)
  roll(){
    return Dice.check(this.chance(),typeof this.label==='string'?this.label:'',()=>rngOf('road').next());
  }
  read(o){
    return statRead(this.odds,o);
  }
  helps(){
    return statHelps(this.odds);
  }
  // done: its outcome applied (out's, or the one run returned), and the result's line
  perform(s){
    const r=this.out?this.out(s):this.run(s,this);
    return Outcome.is(r)?Outcome.apply(r,{e:s}).say:r;
  }
  // its words (plain, or of s)
  labelFor(s){
    return typeof this.label==='function'?this.label(s):this.label;
  }
  tipFor(s){
    return typeof this.tip==='function'?this.tip(s):this.tip;
  }
  // your words as you choose it (its words, of s; else DIALOGUE.says by its label; none: null, what you did shown instead)
  sayFor(s){
    return (typeof this.words==='function'?this.words(s):this.words)||DIALOGUE.says[this.labelFor(s)]||null;
  }
  // its key action on a page (window.js railKeyActions): it sends act with its place in the list
  button(s,act,i){
    return {icon:this.icon,label:this.labelFor(s),facts:this.factsFor(s),act,arg:i,why:this.why(s),tip:this.tipFor(s)};
  }
}
class ChoicePage extends PageScreen{
  /* show(o, key): o {ico, title, sub, banner (its picture: window.js pageBanner), who (who speaks: {name, pic, sub}), msg (the last result), text (what you see)
     and facts (what you know: a list; none: no line), or body (its own markup), choices (Choice list), subject (what they
     are about), act (the action its buttons send), done (no choices now), note, back, close}; key: as PageScreen's */
  show(o,key){
    // (someone speaking (o.who: {name, pic, sub}): their head, the text in a talk's frame: story/conversation.js)
    const text=o.who?Conversation.headOf(o.who)+'<div class="talk-lines"><div class="talk-told">'+o.text+'</div></div>':'<p>'+o.text+'</p>',said=this.exchange(o,key),body=(o.body!=null?o.body:text+(o.facts?pageFacts(o.facts):''))+said;
    super.show({ico:o.ico,title:o.title,sub:o.sub,banner:o.banner,msg:said?null:o.msg,body,acts:o.done?[]:this.buttons(o.choices,o.subject,o.act),keys:CHOICE_KEYS,note:o.note,back:o.back,close:o.close},key);
  }
  /* (the exchange on its page, kept while the page is the same (key) about the same (subject): each choice made, your words (sayFor) or what you did, and what
     came of it (its result, o.msg), as a talk's lines: story/conversation.js; the last TALK.lines of them; once it has begun, a result
     that came of no choice (a fight's end) told too) */
  exchange(o,key){if(key!==this.key||o.subject!==this.subj){this.key=key;this.subj=o.subject;this.log=[];this.lastMsg=null}
    if(o.msg&&o.msg!==this.lastMsg&&(this.picked||this.log.length)){const p=this.picked;this.log.push({say:p?p.c.sayFor(p.s):null,did:p?p.c.labelFor(p.s):null,msg:o.msg})}
    this.picked=null;this.lastMsg=o.msg||null;if(!this.log.length)return '';const you=htmlText(heroName()||'You');
    return '<div class="talk-lines pg-talk">'+this.log.slice(-TALK.lines).map(x=>(x.say?'<p class="talk-line you"><b>'+you+'</b> &ldquo;'+x.say+'&rdquo;</p>':x.did?'<p class="talk-line you did"><b>'+you+'</b> '+x.did+'</p>':'')+'<div class="talk-told">'+x.msg+'</div>').join('')+'</div>'}
  // the choices offered now, as key actions (each its place in the whole list)
  buttons(cs,s,act){
    return cs.map((c,i)=>[c,i]).filter(([c])=>c.shown(s)).map(([c,i])=>c.button(s,act,i));
  }
  // the choice a press picked (arg: its place, '!' after it once its confirm is answered), if it is offered and free
  choose(cs,arg,s){
    const c=cs[parseInt(arg)],ok=c&&c.shown(s)&&!c.why(s)?c:null;
    if(ok)this.picked={c,s};
    return ok;
  }
  // its confirm (o: sub, act, i (its place), back): the same window as every confirm (window.js railConfirm)
  confirm(c,s,o){
    const fs=c.factsFor(s);
    railConfirm({title:c.labelFor(s)+'?',sub:o.sub,text:c.asks(s),facts:fs?fs.filter(Boolean):[],confirm:[o.act,o.i+'!',c.labelFor(s)],back:o.back});
  }
}
// (a choice page's keys: numbers, as a talk's replies are: story/conversation.js)
const CHOICE_KEYS='123456789';
const CHOICE_PAGE=new ChoicePage();
onWorld(()=>{CHOICE_PAGE.key=null;CHOICE_PAGE.log=[]});
