'use strict';
/* ---------- the sealed letter (doc/ENCOUNTERS_DESIGN.md, phase 4): what a messenger on the road (world/encounters.js) carries, and,
   robbed, a real thing in your bag: a Quest item (doc/ITEMS_DESIGN.md §4: bound, never sold at the market nor dropped, never left
   behind for want of room; sold, delivered or burnt on its own page). Its contents are chosen when he comes (make) from the world as
   it stands: where one of his realm's lords marches (army), a holding of an enemy his realm means to fall on (attack), a deal offered
   another realm (deal), or plain news (news, maybe of a place you have not found). From (a holding of his realm) and to (the holding
   it is addressed to: his realm's, or for a deal the other's) are saved with it.
   In the bag: a slot {k: 'letter', id, n: 1, L} (core/inventory.js; one to a slot, never stacked; its record L goes with it, so
   it saves and loads as the bag does): L {id, kind, fac (the sender), from, to, toFac (to's realm then), day (written), stale
   (the day it is old news), worth (gold: ENC_TUNE.letter), seal (1: still sealed), seen (the robbery was seen: the witness roll,
   made as you rob him), and its kind's: lord, ln, tgt, n (army); vs, tgt (attack); with, vs, rel (deal); site (news: tx,ty of
   a place)}.
   Its kind is Letter (an item kind, core/items.js ItemKind), one object (ITEM_KINDS.letter) that does all of it: what the bag's
   record is, its contents and words, the robbery, and its page (window.js PageScreen, from the bag or from the holding you are in:
   page), verbs only (LETTER_VERBS): Break the seal (you read it: its news on your map and in your log), Sell it to a rival (in a
   holding of a realm at war with the sender), Deliver it (at the holding it is addressed to: a reward, unless the robbery was
   seen), Burn it. Sealed pays more; a stale one (its news has happened, or it is old) little ---------- */
class Letter extends ItemKind{
  constructor(){super('letter')}
  // ---- the bag's record: its item (sealed or opened, its icon: gfx/sprites.js itemIcon 'letter'), its record, its slot
  def(s){const L=this.of(s),open=L&&!L.seal;
    return{n:open?'Opened letter':'Sealed letter',icon:'letter',col:open?'#d8c8a0':'#e8dcb8',seal:!open,d:L?'From the '+this.facName(L.fac)+' at '+L.from+', to the lord of '+L.to+'.':'A letter.'}}
  catId(s){return 'quest'}
  worth(s){
    const L=this.of(s);
    return L?L.worth:0;
  }
  title(s){return this.name(s)+', to '+s.L.to}
  compare(a,b){return String(a.id).localeCompare(b.id)}
  verbSpecs(){return []}
  of(s){return s.L||((P.inv.find(x=>x&&x.k==='letter'&&x.id===s.id)||{}).L)||null}
  slotOf(id){return P.inv.findIndex(s=>s&&s.k==='letter'&&s.id===id)}
  facName(f){return FACS[f]?FACS[f].n:'a fallen realm'}
  // its page's verbs (read with its record L): Break the seal, Sell it to a rival, Deliver it, Burn it
  get pageVerbs(){return LETTER_VERBS}

  /* ---- its contents, when the messenger comes: of the kinds there can be, by ENC_TUNE.letter.w (its draws, and the witness
     roll's, from the stream 'letters': core/rng.js) */
  make(e){const r=rngOf('letters'),x=ENC_TUNE.letter,f=e.fac,own=fiefsOf(f),home=townBy(e.home)||own[0]||Spatial.nearestHolding(e.x,e.y),others=own.filter(t=>t!==home);
    const from=others.length?r.pick(others):home,kinds=[];
    const ls=W.lords.filter(l=>l.fac===f&&!l.dead&&['march','siege','relieve'].includes(l.state)&&townBy(l.tgt));
    if(ls.length)kinds.push(['army',()=>{const l=r.pick(ls);return{to:home,lord:l.id,ln:l.name,tgt:l.tgt,n:l.troops.length}}]);
    const foes=enemiesOf(f).filter(g=>g!=='player'&&fiefsOf(g).length);
    if(foes.length)kinds.push(['attack',()=>{const g=r.pick(foes);return{to:home,vs:g,tgt:Spatial.nearest(fiefsOf(g),home.x,home.y).name}}]);
    const pals=FIDS.filter(g=>g!==f&&g!=='player'&&!W.dead[g]&&!atWar(f,g)&&fiefsOf(g).length);
    if(pals.length)kinds.push(['deal',()=>{const g=r.pick(pals),c=enemiesOf(f).find(c=>c!==g&&c!=='player'&&atWar(g,c))||enemiesOf(f).find(c=>c!==g&&c!=='player')||null;
      return{to:Spatial.nearest(fiefsOf(g),e.x,e.y),with:g,vs:c,rel:relOf(f,g).s}}]);
    kinds.push(['news',()=>{const s=W.sites.filter(s=>s.scoutable&&!s.seen).sort((a,b)=>Math.hypot(a.x-home.x,a.y-home.y)-Math.hypot(b.x-home.x,b.y-home.y))[0];return{to:home,site:s?[s.tx,s.ty]:null}}]);
    let w=r.next()*kinds.reduce((a,[k])=>a+x.w[k],0),pick=kinds[kinds.length-1];for(const q of kinds){w-=x.w[q[0]];if(w<=0){pick=q;break}}
    const k=pick[0],o=pick[1](),to=o.to;delete o.to;
    return{id:'L'+e.i,kind:k,fac:f,from:from.name,to:to.name,toFac:to.owner,day:G.day,stale:G.day+r.int(x.stale[0],x.stale[1]),worth:Math.round(r.int(x.worth[0],x.worth[1])*x.kind[k]),seal:1,seen:0,...o}}
  site(L){return L.site?W.sites.find(s=>s.tx===L.site[0]&&s.ty===L.site[1]):null}
  // what it says (its news, in the sender's words)
  text(L){const F=this.facName(L.fac);
    if(L.kind==='army')return '“'+L.ln+' marches with '+L.n+' men on '+L.tgt+'. Hold '+L.to+' ready, and send what grain you can spare to his host.”';
    if(L.kind==='attack')return '“The '+F+' will fall on '+L.tgt+' of the '+this.facName(L.vs)+'. Muster your men at '+L.to+' and wait for the word.”';
    if(L.kind==='deal')return L.vs?'“The '+F+' offers the '+this.facName(L.with)+' an alliance against the '+this.facName(L.vs)+'. Send your answer by this rider.”':'“The '+F+' offers the '+this.facName(L.with)+' a treaty of friendship and trade.”';
    const s=this.site(L),t=townBy(L.to);return s&&t?'“All is well at '+L.from+'. Our riders found the '+s.label+', to the '+compass(s.x-t.x,s.y-t.y)+' of '+L.to+'.”':'“All is well at '+L.from+': the tithes are in and the roads are quiet.”'}
  // stale: why its news is old ('' while it is fresh): its lord arrived, rides elsewhere or fell; the attack came; the realms settled
  // it; or its days are up
  stale(L){
    if(L.kind==='army'){const l=W.lords.find(o=>o.id===L.lord);if(!l||l.dead)return 'its lord has fallen';if(l.tgt===L.tgt&&(l.state==='siege'||l.inside===L.tgt))return 'its lord has reached '+L.tgt;if(l.tgt!==L.tgt)return 'its lord rides elsewhere now'}
    if(L.kind==='attack'){const t=townBy(L.tgt);if(!t||t.owner!==L.vs)return L.tgt+' has changed hands';if(besieged(t))return 'the attack on '+L.tgt+' has come'}
    if(L.kind==='deal'&&relOf(L.fac,L.with).s!==L.rel)return 'the realms have settled it';
    return G.day>=L.stale?'it is '+Clock.daysSince(L.day)+' days old':''}
  // what it fetches: its worth × mul, less opened, little once stale
  fetchOf(L,mul){const x=ENC_TUNE.letter;return Math.max(1,Math.round(L.worth*mul*(L.seal?1:x.opened)*(this.stale(L)?x.old:1)))}

  /* ---- robbing the rider: the witness roll (who was near him, less by your Scouting and the night), then the letter into your bag
     (a quest item: never left in the mud for want of room) */
  witness(e){const w=ENC_TUNE.letter.witness,near=o=>o&&o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<w.r;
    const n=W.folk.filter(f=>folkOut(f)&&near(f)).length+W.caravans.filter(near).length+W.patrols.filter(near).length+W.refugees.filter(near).length+
      W.lords.filter(l=>!l.dead&&!l.inside&&near(l)).length+bandits.filter(near).length+roadList().filter(o=>!o.trace&&!o.gone&&near(o)).length,
      hold=TOWNS.some(t=>!t.gone&&Math.hypot(t.x-e.x,t.y-e.y)<w.holdR);
    return clamp((w.base+w.per*n+(hold?w.hold:0))*(1-w.scout*skill('scout'))*(darkness()>0?w.night:1),w.lo,w.hi)}
  take(e){const L={...e.letter,seen:rngOf('letters').chance(this.witness(e))?1:0};
    playerInventory.put({k:'letter',id:L.id,n:1,L},true);return ' and his sealed letter, addressed to '+L.to+'. '+(L.seen?'Someone on the road saw it all':'Nobody saw you')}

  /* ---- its page: from the bag (G.mode 'inv') or the holding you are in ('town'); its verbs; Back to where you were, the way out to
     the map (or out of the holding). G.ltr {id, L, from ('inv' or 'town'), msg, done (it is gone: sold, delivered, burnt)} */
  here(){return G.town&&G.town.ref||null}
  // (why you cannot sell it, or deliver it, here: '' when you can)
  sellWhy(L,h){if(!h)return 'Only in a holding of a realm at war with the '+this.facName(L.fac)+'.';
    return h.owner&&h.owner!=='player'&&atWar(h.owner,L.fac)?'':(h.owner&&FACS[h.owner]?'The '+FACS[h.owner].n:h.name)+' is not at war with the '+this.facName(L.fac)+'.'}
  giveWhy(L,h){if(!h||h.name!==L.to)return 'Only at '+L.to+', where it is addressed.';return h.owner===L.toFac?'':L.to+' is no longer the '+this.facName(L.toFac)+'’s.'}
  // out of the bag
  drop(L){const i=this.slotOf(L.id);if(i>=0)P.inv[i]=null;G.ltr.done=1}
  // Break the seal: you read it; its news on your map (the place it names, or round the holding it names) and in your log
  read(L){L.seal=0;const t=townBy(L.tgt),s=this.site(L);let on='';
    if(s&&!s.seen){s.seen=true;on=' The '+s.label+' is on your map now.'}else if(t){this.reveal(t.x,t.y);on=' '+L.tgt+' is marked on your map.'}
    log('A letter of the '+this.facName(L.fac)+': '+this.text(L));return 'You break the seal and read it.'+on}
  reveal(x,y){const S=seenArr(),r=ENC_TUNE.letter.reveal,cx=Math.floor(x/TILE),cy=Math.floor(y/TILE);
    for(let ty=cy-r;ty<=cy+r;ty++)for(let tx=cx-r;tx<=cx+r;tx++)if(tx>=0&&ty>=0&&tx<MW&&ty<MH&&Math.hypot(tx-cx,ty-cy)<=r)S[ty*MW+tx]=1;fogDirty=true}
  page(){const g=G.ltr,L=g.L,F=this.facName(L.fac),old=this.stale(L),h=this.here();
    const body='<p>'+(L.seal?'A letter under the wax seal of the '+F+', taken from their rider on the road. It is addressed to the lord of '+L.to+'.':'The '+F+'’s letter to the lord of '+L.to+', its seal broken. It reads:')+'</p>'+
      (L.seal?'':'<blockquote class="ltr-text">'+this.text(L)+'</blockquote>')+
      pageFacts(['from '+L.from,old?'<span class="bad">stale: '+(L.seal?'whatever it says has surely happened by now':old)+'; worth little</span>':'its news is fresh',L.seen?'<span class="bad">someone saw you rob the rider</span>':'nobody saw you rob the rider']);
    CHOICE_PAGE.show({ico:'scroll',title:L.seal?'Sealed letter':'Opened letter',sub:'The '+F+' to '+L.to+(h?' · in '+h.name:''),msg:g.msg,body,
      choices:LETTER_VERBS,subject:L,act:'ltr-do',done:g.done,
      back:['ltr-back',null,g.from==='town'?'Back':'Back to the bag'],close:['ltr-close',null,g.from==='town'?'Leave '+h.label:'Back to map']},'letter:'+L.id)}
  act(a,arg){
    if(a==='ltr-open'){const [id,from]=String(arg).split(':'),i=this.slotOf(id);if(i<0||!['inv','town'].includes(G.mode))return;G.ltr={id,L:P.inv[i].L,from:from==='town'?'town':'inv',msg:'',done:0};G.mode='letter';this.page();return}
    const g=G.ltr;if(G.mode!=='letter'||!g)return;
    if(a==='ltr-back'){G.ltr=null;G.mode=g.from;if(g.from==='town')renderTown();else{const i=this.slotOf(g.id);G.invSel=i>=0?i:null;G.invArm=null;renderInv()}return}
    if(a==='ltr-close'){G.ltr=null;if(g.from==='town'){G.mode='town';return act('leave')}G.mode='world';hidePanel();return}
    if(a==='ltr-again'){this.page();return}
    if(a==='ltr-do'&&!g.done){const i=parseInt(arg),c=CHOICE_PAGE.choose(LETTER_VERBS,arg,g.L);if(!c)return;
      if(c.asks(g.L)&&!String(arg).endsWith('!'))return CHOICE_PAGE.confirm(c,g.L,{sub:g.L.seal?'Sealed letter':'Opened letter',act:'ltr-do',i,back:['ltr-again',null,'Back']});
      g.msg=c.perform(g.L);log(g.msg);updateHUD(true);this.page();railFocus(a,arg)}}
  // (the bag's detail on one: what it is, and its page; bound, it has no Drop)
  detail(k,s){const L=s.L,def=this.def(s),old=this.stale(L);
    return '<h3>'+def.n+'</h3><p class="muted">Quest item · from the '+this.facName(L.fac)+' to '+L.to+'</p><p>'+def.d+'</p>'+(old?'<p class="bad">Stale: worth little now.</p>':'')+
      '<div class="btns"><button class="btn sm primary" type="button" data-act="ltr-open" data-arg="'+L.id+'">Look it over</button></div>'}
  // (a holding's overview: the letters you carry that it would take: addressed here, or a rival's here would buy)
  townHtml(t){const ls=P.inv.filter(s=>s&&s.k==='letter').map(s=>s.L).filter(L=>!this.giveWhy(L,t)||!this.sellWhy(L,t));if(!ls.length)return '';
    return '<div class="lab">Your letters</div>'+ls.map(L=>railRow((L.seal?'Sealed':'Opened')+' letter of the '+this.facName(L.fac),!this.giveWhy(L,t)?'Addressed here: deliver it to the lord.':'The '+FACS[t.owner].n+' is at war with its sender: they would buy it.',railBtn('ltr-open',L.id+':town','Show it'))).join('')}
}
const LETTER=ITEM_KINDS.letter=new Letter();
// (its verbs: Choices, story/choice.js; need: why not here)
const LETTER_VERBS=Choice.list([
  {icon:'scroll',label:'Break the seal',when:L=>!!L.seal,facts:()=>['you read it','it then sells and delivers for less'],tip:'Read what it says: its news goes on your map and in your log.',run:L=>LETTER.read(L)},
  {icon:'gold',label:'Sell it to a rival',need:L=>LETTER.sellWhy(L,LETTER.here()),tip:'A realm at war with its sender pays for what it says.',
    out:L=>{const x=ENC_TUNE.letter,h=LETTER.here(),g=LETTER.fetchOf(L,x.sell);
      return{gold:g,rep:[h&&h.name,x.rep.sell],call:()=>LETTER.drop(L),say:()=>'The steward of '+h.name+' pays '+g+' gold for the '+LETTER.facName(L.fac)+'’s letter'+(L.seal?', its seal unbroken':'')+'.'}}},
  {icon:'house',label:'Deliver it',also:L=>L.seen?['they know you robbed the rider']:[],
    need:L=>LETTER.giveWhy(L,LETTER.here()),ask:L=>L.seen?'Word of the robbery came ahead of you: they know who took it from their rider. Deliver it anyway?':null,tip:'Hand it to the lord it is addressed to, as if you found it on the road.',
    out:L=>{const x=ENC_TUNE.letter,h=LETTER.here(),drop=()=>LETTER.drop(L);
      if(L.seen)return{call:drop,rep:[h&&h.name,-x.rep.seen],say:()=>'The lord of '+h.name+' takes the letter, and his eyes narrow: word came ahead of you that you robbed his rider. (reputation −'+x.rep.seen+')'};
      const g=LETTER.fetchOf(L,x.deliver),r=L.seal?x.rep.deliver:Math.ceil(x.rep.deliver/2);
      return{call:drop,gold:g,rep:[h&&h.name,r],say:()=>'The lord of '+h.name+' thanks you for the letter his rider lost'+(L.seal?'':', though he frowns at the broken seal')+', and pays you '+g+' gold.'}}},
  {icon:'fire',label:'Burn it',also:()=>['it is gone','nobody learns what it said'],ask:()=>'Burn the letter? Nobody will learn what it said.',out:L=>({call:()=>LETTER.drop(L),say:'The letter curls up in the fire. Nobody will learn what it said.'})}]);
onAct('ltr-',(a,arg)=>LETTER.act(a,arg));
// (the old names, as the encounters, the bag, the holding's overview and the tests call them)
const letterMake=e=>LETTER.make(e);
const letterTake=e=>LETTER.take(e);
const letterText=L=>LETTER.text(L);
const letterSite=L=>LETTER.site(L);
const letterStale=L=>LETTER.stale(L);
const letterWitness=e=>LETTER.witness(e);
const letterDetail=(k,s)=>LETTER.detail(k,s);
const letterTownHtml=t=>LETTER.townHtml(t);
