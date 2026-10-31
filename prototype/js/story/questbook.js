'use strict';
/* ---------- the questbook: hand-written quests, offered (doc/QUESTBOOK_DESIGN.md; the entries: data/questbook/) ----------
   Each entry of QUESTBOOK is a story (story/forms.js defineStory: its steps in the story forms, its deadline), defined at load
   as the thread kind 'book:'+id (Questbook.compile); begun (Questbook.take), it is a story in your Quests, saved with the
   threads; its memory is where it was offered: {book, town, fac, lord, comp, x, y, to}. What the questbook adds is who offers
   it, where and when:
   - givers (defineGiver(id, {fits(entry, ctx)})): board (the notice board: a row, world/quests.js jobsBody), tavern (a card:
     ui/town.js Tavern), lord (a reply in his talk: story/conversation.js LordSpeaker), road (a day's chance on the map,
     QUESTBOOK_OFFER.road: its first page; none while the tests' G.quietEvents holds), temple (the priest's words, in a
     holding's streets: scene/scene.js), comp (a companion's talk, its giver.comp: CompanionSpeaker);
   - its conditions (when, its giver's at: story/forms.js conditions), once (once a game) or cool (days before it is offered
     again: the day it last ended, Thread.once('book:'+id)), the same few a holding a week (a hash, no draw) ---------- */
class Questbook{
  static entry(id){return Object.prototype.hasOwnProperty.call(QUESTBOOK,id)?QUESTBOOK[id]:null}
  static all(){return Object.keys(QUESTBOOK)}
  // ---- may it be offered: not under way, once done or still cooling, its giver's, its place's and your conditions
  static live(id){return Thread.list().on.some(th=>th.k==='book:'+id)}
  static ready(id){const E=this.entry(id),d=Thread.once('book:'+id);return !this.live(id)&&(d==null||!E.once&&E.cool!=null&&G.day-d>=E.cool)}
  static offers(by,ctx){const G0=kindOf('giver',by);if(!G0)return [];
    const ids=this.all().filter(id=>{const E=this.entry(id);return E.giver?.by===by&&this.ready(id)&&G0.fits(E,ctx)&&Stories.holds(E.giver.at,ctx)&&Stories.holds(E.when,ctx)});
    const h=id=>Rng.seedOf('book:'+id+':'+(ctx.town||'')+':'+Math.floor(G.day/7));return ids.sort((a,b)=>h(a)-h(b)).slice(0,QUESTBOOK_OFFER.offers)}
  // ---- begun: its thread, its memory where it was offered (at: a step to begin at; force: offered or not); its line
  static take(id,ctx,at,force){const E=this.entry(id);if(!E||this.live(id)||!force&&!this.ready(id))return null;
    const m={book:id,town:ctx.town||Spatial.nearestHolding(P.x,P.y)?.name,fac:ctx.fac||townBy(ctx.town)?.owner||null,lord:ctx.lord||null,x:Math.round(ctx.x??P.x),y:Math.round(ctx.y??P.y)};
    if(ctx.comp)m.comp=ctx.comp;const th=Thread.start('book:'+id,m,at);if(th)log('New quest: '+E.title+'.','gold','story',th.journalKey);return th}
  // ---- the givers' offers drawn: a card (a tavern's), a row (a board's), a reply (a lord's, a companion's), a button (the priest's)
  static pic(id,t){const g=this.entry(id).giver;return g.pic==='folk'||!g.pic?personPic('folk',t?.races?.[0]||'human',Rng.seedOf(id)%4):portrait(g.pic)}
  static card(id,t){const E=this.entry(id);return {pic:this.pic(id,t),name:E.giver.name||'A stranger',role:E.title,note:Stories.fill(E.text,{memory:{town:t.name,fac:t.owner}}),acts:[['qb-take',id,'Take it']]}}
  static rows(t){return this.offers('board',Stories.ctx({town:t.name})).map(id=>{const E=this.entry(id);return railRow(E.title,Stories.fill(E.text,{memory:{town:t.name}}),railBtn('qb-take',id,'Take it'))}).join('')}
  static replies(l){const t=Spatial.nearest(fiefsOf(l.fac),l.x,l.y),ctx=Stories.ctx({town:t?.name,fac:l.fac,lord:l.name,lordRef:l});
    return this.offers('lord',ctx).map(id=>({act:'qb-take',arg:id+'@'+l.id,label:'Ask about work: '+this.entry(id).title,note:Stories.fill(this.entry(id).text,{memory:ctx})}))}
  static priest(t){return this.offers('temple',Stories.ctx({town:t.name})).map(id=>dlgBtn('qb-take',id,'Ask about '+this.entry(id).title.replace(/^The /,'the '))).join('')}
  static compReplies(cid){const ctx=Stories.ctx({town:Spatial.nearestHolding(P.x,P.y)?.name,comp:cid});
    return this.offers('comp',ctx).map(id=>({act:'qb-take',arg:id+'#'+cid,label:Stories.fill(this.entry(id).giver.ask||'Is something on your mind?',{memory:ctx})}))}
  // ---- each day: a road's offer, a day's chance: one that fits where you are, its first page shown when you are free
  static day(){if(G.quietEvents||Captivity.held||G.mode!=='world'||G.modal)return;const ctx=Stories.ctx({town:Spatial.nearestHolding(P.x,P.y)?.name,x:P.x,y:P.y}),ids=this.offers('road',ctx);
    if(ids.length&&questRng().chance(QUESTBOOK_OFFER.road))this.take(ids[0],{...ctx,x:P.x,y:P.y})}
  // ---- an entry defined as a story: its giver speaks on its pages
  static compile(id){const E=this.entry(id);
    return defineStory('book:'+id,{...E,n:E.title,book:id,comp:E.giver?.comp,who:th=>Stories.fill(E.giver?.name||th.memory.lord||th.memory.town||'',th),
      speaker:E.giver?.name?th=>({name:Stories.fill(E.giver.name,th),pic:Questbook.pic(id,townBy(th.memory.town)),sub:E.title}):undefined})}
}
const defineGiver=(id,spec)=>defineKind('giver',id,{fits:()=>true,...spec});
defineGiver('board',{fits:(E,c)=>!!c.town});
defineGiver('tavern',{fits:(E,c)=>!!c.town&&!!townBy(c.town)?.T.tabs.includes('tavern')});
defineGiver('lord',{fits:(E,c)=>!!c.lord});
defineGiver('road',{fits:()=>G.mode==='world'||G.mode==='dialog'});
defineGiver('temple',{fits:(E,c)=>!!c.town&&!!townBy(c.town)?.T.temple});
defineGiver('comp',{fits:(E,c)=>!!c.comp&&E.giver.comp===c.comp&&!!P.comps[c.comp]});
// (over, however it ended: the day kept, for once and cool)
worldOn('thread:ended',d=>{const k=d?.e?.k;if(typeof k==='string'&&k.startsWith('book:'))Thread.mark(k)});
// every entry defined as a story, at load
for(const id of Questbook.all())Questbook.compile(id);
// (its offers taken: from a tavern's card, a board's row (the holding you are in), a lord's reply (id@lord), a companion's (id#comp),
// the priest's (the holding of the streets you walk))
onAct('qb-',(a,arg)=>{if(a!=='qb-take')return;const [id0,lid]=String(arg).split('@'),[id,cid]=id0.split('#'),l=lid&&W.lords.find(x=>String(x.id)===lid),t=G.town?.ref||G.scene&&townBy(G.scene.ref);
  const ctx=l?Stories.ctx({town:Spatial.nearest(fiefsOf(l.fac),l.x,l.y)?.name,fac:l.fac,lord:l.name,lordRef:l}):cid?Stories.ctx({town:Spatial.nearestHolding(P.x,P.y)?.name,comp:cid}):Stories.ctx({town:t?.name});
  if(!Questbook.take(id,ctx))return;updateHUD(true);if(G.scene){hidePanel();G.modal=false;return}if(G.town)return renderTown();if(G.mode==='dialog'){G.enc=null;G.mode='world';hidePanel()}});
Systems.add({name:'questbook',order:{day:215},day:()=>Questbook.day()});
