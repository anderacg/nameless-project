'use strict';
/* ---------- choices and their page (doc/STORY_DESIGN.md §3.4; the story wave, S0) ----------
   A Choice is one verb on a page: a happening's (a road encounter's), a thing's (the sealed letter's) or a place's (a shrine's).
   Made from its spec, plain data, each field read with the subject s it is about (the encounter, the letter, the site):
     icon, label, tip;
     when(s): offered now (none: always);
     need(s): why it is greyed ('' or false: free to choose);
     ask(s): the confirm before it (what cannot be undone; none or null: no confirm);
     again: the page stays open after it;
     odds: an ENC_STAT check (encounters.js): chance() its odds, roll() the draw, read(o) its Insight read, helps() the
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
  roll(){
    return Math.random()<this.chance();
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
  // its key action on a page (window.js railKeyActions): it sends act with its place in the list
  button(s,act,i){
    return {icon:this.icon,label:this.label,facts:this.factsFor(s),act,arg:i,why:this.why(s),tip:this.tip};
  }
}
class ChoicePage extends PageScreen{
  /* show(o, key): o {ico, title, sub, banner (its picture: window.js pageBanner), msg (the last result), text (what you see)
     and facts (what you know: a list; none: no line), or body (its own markup), choices (Choice list), subject (what they
     are about), act (the action its buttons send), done (no choices now), note, back, close}; key: as PageScreen's */
  show(o,key){
    const body=o.body!=null?o.body:'<p>'+o.text+'</p>'+(o.facts?pageFacts(o.facts):'');
    super.show({ico:o.ico,title:o.title,sub:o.sub,banner:o.banner,msg:o.msg,body,acts:o.done?[]:this.buttons(o.choices,o.subject,o.act),note:o.note,back:o.back,close:o.close},key);
  }
  // the choices offered now, as key actions (each its place in the whole list)
  buttons(cs,s,act){
    return cs.map((c,i)=>[c,i]).filter(([c])=>c.shown(s)).map(([c,i])=>c.button(s,act,i));
  }
  // the choice a press picked (arg: its place, '!' after it once its confirm is answered), if it is offered and free
  choose(cs,arg,s){
    const c=cs[parseInt(arg)];
    return c&&c.shown(s)&&!c.why(s)?c:null;
  }
  // its confirm (o: sub, act, i (its place), back): the same window as every confirm (window.js railConfirm)
  confirm(c,s,o){
    const fs=c.factsFor(s);
    railConfirm({title:c.label+'?',sub:o.sub,text:c.asks(s),facts:fs?fs.filter(Boolean):[],confirm:[o.act,o.i+'!',c.label],back:o.back});
  }
}
const CHOICE_PAGE=new ChoicePage();
