'use strict';
/* ---------- who comes to the remains of your line, and what each gets (the owner, 2026-11-12: "anyone can get it just that they
   reward differently based on the situations"; "Do 1, 2 and 4"; doc/DEATH_DESIGN.md §9). Numbers: data/death.js DEATH.claim ----------
   - who claims: kin of the fallen (their blood through each new life: Legacy.kinTo) pray for all the experience left and take their
     things freely; a stranger to them prays for a share (stranger.xp), and taking their things costs standing at the family's holding
     (stranger.rep);
   - where they lie: a family plot, a fenced grave, a tomb more (rest: the experience times the most that fits); left unburied, a
     little lost each day to the weather and the beasts (wild: experience down to floor of it, gold, a chance for each piece);
   - others (the owner: "if that companions or heir still alive then they can claim it. Otherwise, just other"; "if that lord is
     greedy or not elegant then they can force their power to claim it, otherwise the passer"):
     - your heir, while they live, near it (lord.seek px, heir: a chance a day), or one of the fallen's own companions, their tavern
       near (comp: tiles, a chance a day), keeps its things for the family (kin free, a stranger pays a share); only when neither the
       heir nor any of them is left does another companion find it, and sell its things to anyone (comp.other);
     - a lord's army near, a lord of a temper that forces his claim (lord.force), takes its things before any passer-by buries it,
       to his holding nearest: his steward sells them back (a share of their worth, kin less), or, a proud lord or one at war with
       your line's realm, he hangs them in his hall as a trophy, yours only when that holding is; any other lord leaves it to the
       passer-by, who buries it with its things;
     - a beast whose lair is near (guard: tiles) guards a body in the wild: no one takes, prays or buries there until it is slain
       or gone.
   Kept (what lords and companions hold: Legacy.held, saved with the legacy). Off (claim.on false): as before, the same for anyone ---------- */
class Claims{
  static get on(){return DEATH.on&&DEATH.claim.on}
  // ---- who claims
  // (you kin of the one buried there: of your line's blood)
  static kin(g){return g?.n!=null&&Legacy.kinTo(g.n)}
  // the experience a prayer gives you now: what is left, by who you are to them and where they lie
  static xp(g){const C=DEATH.claim,x=g.xp||0;return this.on?Math.round(x*(this.kin(g)?C.kin.xp:C.stranger.xp)*this.place(g)):x}
  // (where they lie: the most of its kind's and the family plot's)
  static place(g){const R=DEATH.claim.rest;return Math.max(R[g.kind]||1,g.plot?R.plot:1)}
  // (the family's holding, where a stranger taking their things is talked of: where they lie, else the fallen's home)
  static home(g){return townBy(g.at)||townBy(g.home)||Spatial.nearestHolding(g.x,g.y,t=>!t.gone)}
  // (what taking their things costs you: a stranger's standing there; kin, nothing)
  static cost(g){return this.on&&g?.grave&&!this.kin(g)?DEATH.claim.stranger.rep:0}
  static costFact(g){const c=this.cost(g),h=c&&this.home(g);return h?'standing at '+h.name+' −'+c:''}
  // (taken: a stranger's standing lost; its line for the log)
  static took(g){const c=this.cost(g),h=c&&this.home(g);if(!h)return '';P.rep[h.name]=(P.rep[h.name]||0)-c;return ' Folk at '+h.name+' hear that a stranger took them (standing −'+c+').'}
  // (its words for a grave's page: what a prayer gives you, and why)
  static praySay(g){const n=this.xp(g);if(!this.on)return n+' experience, for one who prays';
    const why=[this.kin(g)?'you are of their blood':'you are no kin of theirs: '+Math.round(DEATH.claim.stranger.xp*100)+'% for you',this.place(g)>1?(g.plot?'they rest in the family plot':'they rest well'):'',g.unburied&&g.xp0&&g.xp<g.xp0?'the weather has taken some':''].filter(Boolean);
    return n+' experience, for you who pray ('+why.join('; ')+')'}
  // ---- a beast guarding them: its lair near a body in the wild, while any of it lives
  static guard(g){if(!this.on||!g||g.crypt||g.at)return null;const r=DEATH.claim.guard*TILE;
    return W.monsters.find(m=>m.n>0&&Math.hypot((m.hx??m.x)-g.x,(m.hy??m.y)-g.y)<r)||null}
  static guardWhy(g){const m=this.guard(g),M=m&&monOf(m);return m?(m.eater?cap1(m.eater.name):'A '+(M?.n||'beast').toLowerCase())+' lairs here, and guards them':''}
  // ---- each day: the bodies left unburied waste, and others come to them (Grave.daily); trophies come home with their holding
  static daily(){if(!this.on)return;for(const g of Remains.list.filter(o=>o.grave&&o.unburied)){this.waste(g);this.others(g)}this.home2()}
  // (a day in the wild: a share of the first experience gone (never below floor of it), of the gold, and now and then a piece)
  static waste(g){const X=DEATH.claim.wild;if(g.xp0==null)g.xp0=g.xp||0;
    if(!g.spent)g.xp=Math.max(Math.min(g.xp,Math.round(g.xp0*X.floor)),g.xp-Math.round(g.xp0*X.xp));
    if(g.gold)g.gold-=Math.ceil(g.gold*X.gold);
    g.items=g.items.filter(it=>{if(Math.random()<X.item)it[2]--;return it[2]>0})}
  // (a lord near who forces his claim (his temper: lord.force) takes its things, before any passer-by buries them (Grave.daily); any
  // other lord leaves them to the passer-by)
  static seize(g){const C=DEATH.claim;if(!this.on||g.empty()||this.guard(g))return false;
    const l=W.lords.find(o=>!o.dead&&!o.gone&&!o.inside&&!o.heir&&FACS[o.fac]&&Math.hypot(o.x-g.x,o.y-g.y)<C.lord.seek);
    if(!l||!C.lord.force.includes(lordTemper(l))||Math.random()>=C.lord.find)return false;const t=this.seat(l,g);
    return !!t&&!!this.carry(g,{by:'lord',lord:l.id,name:l.name,fac:l.fac,at:t.name,trophy:this.trophy(l,g)})}
  static seat(l,g){return Spatial.nearest(fiefsOf(l.fac).filter(x=>!x.gone),g.x,g.y)}
  // (the fallen's companions free in their taverns, not with you nor riding with your heir)
  static own(){return Object.keys(Legacy.kept).filter(id=>COMPS[id]&&!P.comps[id]&&!Legacy.serves(id))}
  // (your heir near, else one of the fallen's own companions in a tavern near, keeps its things for the family; neither the heir nor
  // any of them left, another companion free finds it; never before your eyes, nor past a beast that guards it)
  static others(g){if(g.empty()||!Grave.unseen(g)||this.guard(g))return;const C=DEATH.claim,heirs=Legacy.lords(),own=this.own();
    const hl=heirs.find(l=>!l.inside&&Math.hypot(l.x-g.x,l.y-g.y)<C.lord.seek),ht=hl&&this.seat(hl,g);
    if(ht&&Math.random()<C.heir.find)return this.carry(g,{by:'heir',lord:hl.id,name:hl.name,fac:hl.fac,at:ht.name});
    const pool=own.length?own:heirs.length?[]:Object.keys(COMPS).filter(id=>!P.comps[id]&&!Legacy.serves(id)&&!Legacy.kept[id]);
    for(const id of pool){const t=compTown(id);
      if(t&&!t.gone&&Math.hypot(t.x-g.x,t.y-g.y)/TILE<=C.comp.near&&Math.random()<C.comp.find)return this.carry(g,{by:own.length?'comp':'other',cid:id,at:t.name})}}
  // (kept as a trophy: a proud lord's, or one at war with the realm your line served)
  static trophy(l,g){return l.temper==='proud'||!!(g.realm&&FACS[g.realm]&&!W.dead[g.realm]&&realmOf(l.fac).atWar(g.realm))}
  // (its things carried off: kept by them, word of it in the log)
  static carry(g,o){const h={id:++Legacy.heldN,who:g.who,n:g.n,day:G.day,gold:g.gold,items:g.items,...o},lord=o.by==='lord'||o.by==='heir';g.gold=0;g.items=[];g.taken={by:lord?o.name:COMPS[o.cid].short,at:o.at};Legacy.held.push(h);
    log(o.by==='lord'?'Word comes that the men of '+o.name+' found the body of '+g.who+' and took what lay with it to '+o.at+(o.trophy?', a trophy for his hall.':', where his steward will sell it.'):
      o.by==='heir'?o.name+', your line\'s heir, found the body of '+g.who+', and keeps what lay with it at '+o.at+', for the family.':
      COMPS[o.cid].short+' found the body of '+g.who+', and keeps what lay with it in the tavern at '+o.at+(o.by==='comp'?', for the family.':', for whoever will pay.'),'muted','story');return h}
  // (a trophy's holding yours: what hangs there is yours again)
  static home2(){for(const h of Legacy.held.filter(h=>h.trophy&&townBy(h.at)?.owner==='player')){const got=this.give(h);log('In the hall of '+h.at+' hang the things of '+h.who+', yours again: '+(got||'nothing you can carry')+'.','gold','story')}}
  // ---- what they keep, and getting it back
  static worth(h){return (h.gold||0)+h.items.reduce((n,[k,id,c])=>n+(ITEM_KINDS[k]?.worth?.({id})||0)*c,0)}// (each piece its worth (core/items.js): priced by cost, goods threw and a valuable or a trophy counted 5g, 2026-11-13)
  // (its price to you: a lord's steward's (kin less); your heir's or the fallen's companion's (kin nothing); another companion's, the same to anyone)
  static price(h){const C=DEATH.claim,kin=Legacy.kinTo(h.n),s=h.by==='lord'?C.lord.price[kin?'kin':'stranger']:h.by==='other'?C.comp.other:kin?0:C.comp.price;return s?Math.max(5,Math.round(this.worth(h)*s/5)*5):0}
  static what(h){const g=h.items.reduce((n,[k,,c])=>n+(k==='gear'?c:0),0),o=h.items.reduce((n,[k,,c])=>n+(k==='gear'?0:c),0);
    return [h.gold&&h.gold+' gold',g&&g+' piece'+(g>1?'s':'')+' of gear',o&&o+' other thing'+(o>1?'s':'')].filter(Boolean).join(', ')||'nothing'}
  // (into your bag: the gold, what fits; the rest kept for you)
  static give(h){P.gold+=h.gold||0;const g=h.gold;h.gold=0;let n=0;h.items=h.items.filter(it=>{const put=invAdd(it[0],it[1],it[2]);n+=put;it[2]-=put;return it[2]>0});
    if(!h.items.length)Legacy.held=Legacy.held.filter(o=>o!==h);return [g&&g+' gold',n&&n+' piece'+(n>1?'s':'')].filter(Boolean).join(' and ')}
  // the tavern's cards (ui/town.js Tavern): a companion keeping them, a lord's steward selling them, a trophy in the hall
  static cards(t){if(!this.on)return [];const race=t.races?.[0];return Legacy.held.filter(h=>h.at===t.name).map(h=>{const p=this.price(h),why=P.gold<p?'You have '+P.gold+'g':'';
    if(h.by==='comp'||h.by==='other')return {pic:portrait(h.cid),name:COMPS[h.cid].n,role:'Keeps the things of '+htmlText(h.who),facts:[this.what(h)],note:h.by==='comp'?'They rode with '+htmlText(h.who)+'. They found the body, and kept what lay with it for the family.':'They found a body on the road, and kept what lay with it. They will part with it for a price.',
      acts:[['claim-get',h.id,p?'Pay '+p+'g for them':'Take them',why]]};
    if(h.by==='heir')return {pic:personPic('noble',race),name:'The steward of '+htmlText(h.name),role:'Keeps the things of '+htmlText(h.who),facts:[this.what(h)],note:htmlText(h.name)+', the heir of your line, found the body and keeps what lay with it for the family.',
      acts:[['claim-get',h.id,p?'Pay '+p+'g for them':'Take them',why]]};
    if(h.trophy)return {pic:personPic('noble',race),name:'The hall of '+htmlText(h.name),role:'A trophy',facts:[this.what(h)],note:'The things of '+htmlText(h.who)+' hang in the hall, '+htmlText(h.name)+'’s trophy. They are yours again only when '+t.name+' is.'};
    return {pic:personPic('merchant',race,3),name:'The steward of '+htmlText(h.name),role:'Sells what his men found',facts:[this.what(h)],note:'His men found the body of '+htmlText(h.who)+' on the road, and brought back what lay with it.',acts:[['claim-get',h.id,'Buy back '+p+'g',why]]}})}
  static act(a,arg){if(a!=='claim-get')return;const h=Legacy.held.find(o=>o.id===+arg);if(!h||h.trophy)return;const p=this.price(h);if(P.gold<p)return;P.gold-=p;
    const got=this.give(h);log('The things of '+h.who+(p?', for '+p+' gold':'')+': '+(got||'nothing you can carry')+'.','gold','story');updateHUD(true);if(G.town)renderTown()}
}
// (a lord's temper, drawn once from the stream talk as his words first need it: story/conversation.js LordSpeaker)
const lordTemper=l=>l.temper||(l.temper=rngOf('talk').pick(TEMPERS));
onAct('claim-',(a,arg)=>Claims.act(a,arg));
