'use strict';
/* ---------- captivity: beaten but alive (doc/CAPTIVITY_DESIGN.md, phase 1). A band, a lord or a realm's men who rout your band may
   take you: first your chance to get away (escape: Agility, Athletics on foot or Riding mounted, the night, cover; less with
   riders among them or you badly hurt). Got away, you are on the map where you fled, a quarter of your gold gone, your troops
   scattered (some find you within days: scatter). Taken, their leader's page: pay the ransom (ransom: by your renown and level,
   lords and realms dearer), persuade them (persuade: Charisma, Persuasion, and how they see you: renown for a band, honour and his
   regard for a lord; one try, a failure makes the ransom harsher), serve them for some days (a band's raids cost you as if they
   were yours), your realm pays (it thinks well of you: realm), or refuse and sit in their cage (prison: let go after some weeks,
   stripped of your gold, your bag's gear and your troops). Freed, you are at a holding near; a ransom, a fine or your realm's
   help (light) costs one or two pieces from your bag too, their pick. Beasts take no captives: left for dead, you wake where you
   fell. Taken, each companion tries to get away too (their own Agility): those who do are out there.
   Prison (phase 2), a day at a time (prison): wait (their ransom comes down a little each day; your realm may pay; after days you
   are let go), try to break out (Agility, Athletics, a kind soul's help; less the closer they watch you: failing, they watch
   closer and beat you), bribe a guard (with the gold you hid on you: hidden), talk with the other prisoners (news), or pay
   what they ask now. Most days something happens (events): a guard who knows your name, a prisoner's news, a kind soul of the
   house; and your companions who got away may break you out (rescue). Out of their cage you have only the gold you hid.
   Their stash (phase 3: stash): what they took (the gold you paid them or they kept, the gear from your bag) is in their chest,
   in a camp or hideout of theirs near (a band's) or a holding of their realm (a lord's, a realm's); a quest marks it. Clear the
   camp or raid the holding, and 60% of it is yours (stash.back); or buy the gear back from a fence in any tavern at half its
   price (stash.fence). Not won back in 30 days (stash.days), it is sold off.
   Where: taken, you are carried to their camp or hideout near (a band's) or a holding of their realm (placeOf; none: where you
   fell); freed, at its gate, broken out a little way off it, alone (release.out), your realm's ransom at its own holding (release).
   Sold (sold): a band may sell you on to a ransom broker in a holding far off, a new captor (his price higher, harder to talk
   round, work it off for days, his cage shorter and better kept); what the band kept goes to its stash.
   Let go by a lord or a realm any way but breaking out, the score is settled (pardon): their hostility ends, your crimes in their
   holdings are forgiven.
   Break-outs: none too hurt (break.hurt; a day heals heal), none in chains after break.fails tries.
   The traits (phase 4: traits; data/tree.js): Slippery (perk slippery: a better escape roll, yours or a companion's, and an
   easier break-out), Silver Tongue (silver: easier persuasion), Old Soldier (oldsoldier: a smaller ransom and fine, a piece
   fewer from your bag, half the service).
   Prisons (doc/PRISONS_DESIGN.md, phase 1): their cage is a prison of its place's kind (prisonOf; data/prisons.js PRISONS): a
   village's Lock-up, a town's Jail, a city's Prison, a castle's Dungeon, a camp's Cage, a hideout's pit; its own break-out and
   bribe numbers, harder behind walls and a garrison. At war (war: a lord or a realm at war with yours): no persuading, no serving,
   straight to the prison of their nearest walled holding; the war price (war.price times the ransom), never less; no release by
   time; your realm may pay it now and then (war.realm, from its treasury); a lord who thought well of you may let you go on your
   word (parole: by his relation when he took you and your honour with his realm); peace frees you.
   Phase 3: your realm may trade a lord of theirs it holds for you (an exchange: PRISON.exchange a day, world/prisons.js); your
   companions taken with you (with) are freed with you, but left in their prison when you break out alone (broke; your companions'
   rescue, rescued, frees them all): Prisons.leave.
   Straight to their prison (straight): now and then a captor does not bargain at all: a band (band), a lord (lord: less the better
   he thinks of you, rel a point), a realm's men (realm); you are thrown into the prison of their place at once, their ask on the
   cell's page as ever. ---------- */
const CAPTIVITY={escape:{base:.25,agi:.03,skill:.02,mounted:.15,night:.1,cover:.1,riders:.25,hurt:.15,min:.05,max:.9},
  ransom:{base:40,renown:.4,level:15,lord:1.5,harsh:1.25},persuade:{base:.2,cha:.04,pers:.04,renown:.001,honor:.004,regard:.004,war:.15,min:.05,max:.85,fine:.1},
  serve:{band:[4,6],lord:[5,8],rep:6,honor:4},realm:{honor:20,days:[3,5],daily:.25},prison:{days:21,hidden:.15,fall:.04,floor:.5,break:{base:.12,agi:.02,athl:.01,guard:.06,min:.03,max:.6,hurt:.4,fails:2},beat:.2,heal:.1,bribe:{base:20,guard:15,ch:.6,step:.15},events:.35,help:.15,rescue:{each:.07,max:.3}},stash:{back:.6,fence:.5,days:30,near:60},release:{by:2,out:5,far:12},sold:{daily:.05,renown:.0005,floor:.1,far:40,price:1.2,persuade:.6,work:[3,5],days:10,harder:.06},straight:{band:.35,lord:.25,realm:.4,rel:.005,min:.05,max:.8},war:{price:3,realm:.08,parole:{rel:20,base:.02,per:.002,honor:.001,max:.1}},traits:{slippery:{escape:.15,break:.1},silver:.15,oldsoldier:{cost:.75,serve:.5}},scatter:{base:.35,morale:.3,lead:.04,min:.2,max:.9,days:[1,3]},light:[1,2],
  beast:{hp:.25}};
class Captivity{
  static held=null;static scattered=[];
  // who would take you: a band, a lord, a realm's men; null: beasts (or no one)
  static captor(e){if(!e||['monster','cave','tourney','hunt'].includes(e.kind))return null;
    if(e.kind==='lord'&&e.ref)return{k:'lord',id:e.ref.id,fac:e.ref.fac,name:lordName(e.ref)};
    if(e.kind==='party'||e.kind==='camp')return{k:'band',name:'the '+(e.ref?.kind==='raiders'?'raiders':e.ref?.kind==='bog'?'bog raiders':'bandits')};
    const f=foeRealm(e);return f&&FACS[f]?{k:'realm',fac:f,name:'the men of the '+FACS[f].n}:null}
  static lord(c){return c?.k==='lord'?W.lords.find(l=>l.id===c.id)||null:null}
  // (taken at war: a lord or a realm's men at war with your realm)
  static atWar(c){return !!P.fac&&!!c?.fac&&(c.k==='lord'||c.k==='realm')&&atWar(P.fac,c.fac)}
  // the prison they hold you in: its kind's row (PRISONS), its title, its break-out odds with its walls and garrison (brk); null:
  // their cage (no place, or a broker's house)
  static prisonOf(c){const s=c&&c.k!=='broker'&&c.at&&this.spot(c.at),X=PRISONS;if(!s)return null;
    if(s.site){const k=s.site instanceof Hideout?'hideout':'camp';return{...X[k],kind:k,title:k==='hideout'?'In the pit':'In their Cage'}}
    const t=s.town,row=X[t.kind];return row?{...row,kind:t.kind,title:'In the '+row.name+' of '+t.name,brk:row.brk-wallOf(t)*X.walls-Math.min(X.garMax,(t.gar||0)*X.garrison)}:null}
  // (your first day in it)
  static jail(c,event){return{day:1,guard:this.prisonOf(c)?.watch||0,hidden:c.hidden??Math.floor(P.gold*CAPTIVITY.prison.hidden),offer:c.ransom,talked:false,help:0,event}}
  // (a lord's word, a day's chance at war: by his relation with you when he took you (rel) and your honour with his realm)
  static paroleChance(c){const X=CAPTIVITY.war.parole;if(!c.war||!this.lord(c)||(c.rel||0)<X.rel)return 0;
    return Math.min(X.max,X.base+(c.rel-X.rel)*X.per+Math.max(0,honorWith(c.fac))*X.honor)}
  // your chance to get away as the rout comes
  static escapeChance(e){const X=CAPTIVITY.escape,mounted=!!P.gear.mount,list=e.list||[],riders=list.length?list.filter(k=>ST[k]&&(ST[k].mounted||ST[k].beast)).length/list.length:0;
    return clamp(X.base+(P.attr?.agi||0)*X.agi+skill(mounted?'ride':'athl')*X.skill+(mounted?X.mounted:0)+(Clock.isNight?X.night:0)+(hiddenAt(P.x,P.y)?X.cover:0)-riders*X.riders-(P.hp<vitals()[0]/2?X.hurt:0)+(has('slippery')?CAPTIVITY.traits.slippery.escape:0),X.min,X.max)}
  // the defeat, as the battle is lost (resolution.js conclude): the words for the battle's page
  static defeat(e){const c=this.captor(e);
    if(!c){P.hp=Math.max(1,Math.min(P.hp,Math.round(vitals()[0]*CAPTIVITY.beast.hp)));return{how:'beast',text:'Left for dead among the fallen, you wake where you fell, badly hurt.'}}
    const ch=this.escapeChance(e);if(Math.random()<ch){const lose=Math.floor(P.gold*.25);P.gold-=lose;const o=e.ref;if(o&&Number.isFinite(o.x)){const dx=P.x-o.x,dy=P.y-o.y,l=Math.hypot(dx,dy)||1;walk(P,dx/l,dy/l,40)}
      const back=this.scatter();return{how:'escaped',text:'In the rout you slip away ('+Math.round(ch*100)+'% chance) and lose '+lose+' gold in the flight. Your soldiers scatter'+(back?': '+back+' of them may find you in the next days.':'.')}}
    const away=compsInBand().filter(id=>{const o=compInit(id);return Math.random()<clamp(CAPTIVITY.escape.base+(o?.attr?.agi||0)*CAPTIVITY.escape.agi+(o?.perks?.includes('slippery')?CAPTIVITY.traits.slippery.escape:0),CAPTIVITY.escape.min,CAPTIVITY.escape.max)});
    const war=this.atWar(c),l=this.lord(c),at=this.placeOf(c,war),s=at&&this.spot(at),h=this.held={...c,since:G.day,tried:[],away,with:compsInBand().filter(id=>!away.includes(id)),at,war,rel:l?relWith(l):0};h.ransom=this.ransomOf(h);if(s)this.put(s);
    const pk=this.prisonOf(h),where=pk?pk.title.replace(/^In t/,'t')+(s?.site?' at '+s.name:''):'their cage',cell=war||Math.random()<this.straight(c);
    if(cell)h.prison=this.jail(h,war?'A prisoner of war: the '+FACS[c.fac].n+' will not bargain with you, nor let you go while the war lasts.':c.k==='band'?'No talk of ransom: they bind your hands and throw you into '+where+'. Their ask comes later.':cap1(c.name)+' have no words for you: you are taken to '+where+'. Their ask comes later.');
    return{how:'taken',text:'The rout catches you ('+Math.round(ch*100)+'% chance to get away): you are taken by '+c.name+(war?', a prisoner of war':'')+(s?', to '+(pk?where:s.name):'')+(cell&&!war?'. They do not bargain: straight into '+where:'')+'.'+(away.length?' '+away.map(id=>COMPS[id].short).join(' and ')+' got away.':'')}}
  // (the chance they do not bargain, straight to their prison: straight; a broker always does)
  static straight(c){const X=CAPTIVITY.straight,l=this.lord(c);return c.k==='broker'?0:clamp((X[c.k]||0)-(l?relWith(l)*X.rel:0),X.min,X.max)}
  static ransomOf(c,harsh=false){const X=CAPTIVITY.ransom;return Math.round((X.base+P.renown*X.renown+P.level*X.level)*(c.k==='band'?1:c.k==='broker'?CAPTIVITY.sold.price:X.lord)*(c.war?CAPTIVITY.war.price:1)*(harsh?X.harsh:1)*(has('oldsoldier')?CAPTIVITY.traits.oldsoldier.cost:1)/5)*5}
  static persuadeChance(c){const X=CAPTIVITY.persuade,l=this.lord(c),regard=l?relWith(l):0,honor=c.fac&&FACS[c.fac]?honorWith(c.fac):0;
    return clamp(X.base+(P.attr?.cha||0)*X.cha+skill('pers')*X.pers+(c.k==='band'?P.renown*X.renown:honor*X.honor+regard*X.regard)-(c.fac&&hostileTo(c.fac)?X.war:0)+(has('silver')?CAPTIVITY.traits.silver:0),X.min,X.max)*(c.k==='broker'?CAPTIVITY.sold.persuade:1)}
  static realmPays(c){return !!P.fac&&P.fac!==c.fac&&FACS[P.fac]&&honorWith(P.fac)>=CAPTIVITY.realm.honor}
  static serves(c){return c.k==='band'||c.k==='broker'||!P.fac}
  // (how long they keep you in their cage: a broker less, waiting for a buyer)
  static limit(c){return c.k==='broker'?CAPTIVITY.sold.days:CAPTIVITY.prison.days}
  // the captor's page: its choices, what each costs, and the odds where there are some (the frame: its bar's way out is refusing)
  // the captor's page: a talk with them (story/conversation.js CaptorSpeaker): what has happened (facts), their words, your choices
  // (replies), with what each costs and the odds where there are some (the frame: its bar's way out is refusing)
  static open(){const c=this.held;if(!c)return;if(c.prison)return this.cell();G.mode='dialog';const cv=this.cv?.sp.o===c?this.cv:(this.cv=new Conversation(new CaptorSpeaker(c)));
    cv.show({body:'<p class="muted">Ransom, persuasion or your realm’s help: freed at a holding near, your troops scattered, a piece or two from your bag taken. Serving them: you keep your goods. Refusing: '+(this.prisonOf(c)?.title.replace(/^In t/,'t')||'their cage')+', for about '+this.limit(c)+' days at most, and out of it you keep only the gold you hide on you; your bag’s gear and your troops are lost.</p>',
      close:['held-refuse',null,'Refuse'+(this.prisonOf(c)?' (to the '+this.prisonOf(c).name.replace(/^The /,'').toLowerCase()+')':'')]})}
  static facts(c){return '<p><b>'+(c.k==='broker'?'Sold.':'Taken captive.')+'</b> '+(c.note?c.note+' ':'')+'You are held by '+c.name+'. '+(c.k==='band'?'They want gold, and know your name.':c.k==='broker'?'He paid for you, and wants his price back with a profit.':c.fac&&hostileTo(c.fac)?'You are an enemy of the '+FACS[c.fac].n+', and worth something to them.':'They will hear you out.')+'</p>'+
    (c.tried.includes('persuade')?'<p class="bad">Your words failed: they ask more now.</p>':'')}
  static replies(c){const odds=this.persuadeChance(c),tried=k=>c.tried.includes(k);
    return [{act:'held-pay',label:'Pay the ransom · '+c.ransom+'g',why:P.gold<c.ransom?'You have '+P.gold+'g':'',primary:true},
      !tried('persuade')&&{act:'held-persuade',label:'Persuade them to let you go · '+insight(['you cannot tell your odds',odds>=.5?'they may well listen':'they might listen','about '+Math.round(odds*100)+'%'],'know the odds')},
      this.serves(c)&&{act:'held-serve',label:(c.k==='band'?'Ride with the band':c.k==='broker'?'Work off your price':'Serve '+c.name)+' for some days'},
      this.realmPays(c)&&{act:'held-realm',label:'Wait for the '+FACS[P.fac].n+' to pay for you'}]}
  static act(a){const c=this.held;if(!c)return;if(c.prison)return this.cellAct(a);
    if(a==='held-pay'){if(P.gold<c.ransom)return;P.gold-=c.ransom;return this.free('light','You pay '+c.ransom+' gold, and they let you go.',c.ransom)}
    if(a==='held-persuade'&&!c.tried.includes('persuade')){c.tried.push('persuade');train('pers',4);if(Math.random()<this.persuadeChance(c)){const fine=Math.floor(P.gold*CAPTIVITY.persuade.fine*(has('oldsoldier')?CAPTIVITY.traits.oldsoldier.cost:1));P.gold-=fine;return this.free('light','Your words carry: they let you go'+(fine?' for a fine of '+fine+' gold':'')+'.',fine)}
      c.ransom=this.ransomOf(c,true);log('Your words fail: '+c.name+' raise the ransom to '+c.ransom+' gold.','bad','war');this.cv?.say(DIALOGUE.captor.you,false,heroName()||'You').say(DIALOGUE.captor.no+' '+c.ransom+' gold.');return this.open()}
    if(a==='held-serve'&&this.serves(c)){const [lo,hi]=c.k==='band'?CAPTIVITY.serve.band:c.k==='broker'?CAPTIVITY.sold.work:CAPTIVITY.serve.lord,d=Math.ceil(rint(lo,hi)*(has('oldsoldier')?CAPTIVITY.traits.oldsoldier.serve:1));Clock.passHours(d*24);
      if(c.k==='band'){const X=CAPTIVITY.serve;repNear(P.x,P.y,-X.rep);FIDS.forEach(f=>addHonor(f,-X.honor,true));return this.free('serve','You ride with the band for '+d+' days, and their raids are yours to answer for (reputation −'+X.rep+', honour −'+X.honor+' with every realm). Then they let you go.')}
      if(c.k==='broker')return this.free('serve','You work off your price in '+c.town+' for '+d+' days; then he lets you go.');
      return this.free('serve','You serve '+c.name+' for '+d+' days; then they let you go.')}
    if(a==='held-realm'&&this.realmPays(c)){const [lo,hi]=CAPTIVITY.realm.days,d=rint(lo,hi);Clock.passHours(d*24);return this.free('light','After '+d+' days the '+FACS[P.fac].n+' pay for you, and you are let go.',0,true)}
    if(a==='held-refuse'){c.prison=this.jail(c,'Their cage is cold, and the guards bored.');return this.cell()}}
  // ---- prison: today's page (the frame: its bar's way out is waiting a day)
  static breakChance(q){const X=CAPTIVITY.prison.break;return clamp(X.base+(P.attr?.agi||0)*X.agi+skill('athl')*X.athl+q.help-q.guard*X.guard+(this.prisonOf(this.held)?.brk||0)+(has('slippery')?CAPTIVITY.traits.slippery.break:0)-(this.held?.k==='broker'?CAPTIVITY.sold.harder:0),X.min,X.max)}
  static bribe(q){const X=CAPTIVITY.prison.bribe;return{cost:Math.round((X.base+q.guard*X.guard)*(this.prisonOf(this.held)?.bribe||1)/5)*5,ch:clamp(X.ch-q.guard*X.step,.05,.9)}}
  // (no break-out in chains (after break.fails tries), nor too hurt (under break.hurt of your health: a day in the cage heals heal))
  static breakWhy(q){const X=CAPTIVITY.prison.break;return (q.fails||0)>=X.fails?'They keep you in chains now':P.hp<vitals()[0]*X.hurt?'Too hurt: rest a few days first':''}
  // (the others held where you are (world/prisons.js): none in a cage of no prison's, or an empty one: no one to talk with; the
  // owner, 2026-10-29)
  static fellows(c){return c?.at?Prisons.of(Prisons.keyOf(c.at)).reduce((n,r)=>n+(r.k==='men'?r.n:1),0):0}
  static cell(){const c=this.held,q=c.prison,X=CAPTIVITY.prison,br=this.breakChance(q),bb=this.bribe(q),pk=this.prisonOf(c),realm=this.realmPays(c)&&FACS[P.fac].n;G.mode='dialog';
    const btns=[dlgBtn('held-break',null,'Try to break out · '+insight(['you cannot tell your odds',br>=.3?'you might make it':'it is a long chance','about '+Math.round(br*100)+'%'],'know the odds'),this.breakWhy(q),true),
      dlgBtn('held-bribe',null,'Bribe a guard · '+bb.cost+'g',q.hidden<bb.cost?'You hid '+q.hidden+'g':''),
      dlgBtn('held-talk',null,'Talk with the other prisoners',!this.fellows(c)?'No one else is held here':q.talked?'Not again today':''),
      dlgBtn('held-pay',null,(c.war?'Pay the war price · ':'Pay what they ask now · ')+q.offer+'g',P.gold<q.offer?'You have '+P.gold+'g':'')];
    showPanel('<h2>'+(pk?pk.title:'In their cage')+'</h2><p class="muted">Day '+q.day+(c.war?' · a prisoner of war':' of about '+this.limit(c))+' · held by '+c.name+' · '+['they watch you as they watch anyone','they watch you closely','they never take their eyes off you'][Math.min(2,q.guard)]+' · '+q.hidden+'g hidden on you</p><p>'+q.event+'</p>'+
      '<div class="btns cv-choices">'+btns.join('')+'</div><p class="muted">Each choice but talking takes the day. '+(c.war?'No prisoner of war is let go while the war lasts: peace frees you'+(realm?'; the '+realm+' may pay your war price':'')+(this.paroleChance(c)?'; '+c.name+' might take your word':'')+'.':'Their ransom comes down a little each day'+(realm?'; the '+realm+' may pay for you':'')+'.')+'</p>'+nav(null,['held-wait',null,'Wait a day']))}
  static cellAct(a){const c=this.held,q=c.prison,X=CAPTIVITY.prison;
    if(a==='held-pay'){if(P.gold<q.offer)return;P.gold-=q.offer;return this.free('light','You pay '+q.offer+' gold, and they let you out.',q.offer)}
    if(a==='held-talk'){if(q.talked||!this.fellows(c))return;q.talked=true;train('pers',1);q.event=this.news()||'The others have nothing new to tell.';return this.cell()}
    if(a==='held-break'){if(this.breakWhy(q))return;if(Math.random()<this.breakChance(q))return this.free('broke','In the dark you slip your bonds and get over the wall.');
      q.guard++;q.fails=(q.fails||0)+1;P.hp=Math.max(1,Math.round(P.hp-vitals()[0]*X.beat*(this.prisonOf(c)?.beat||1)));q.help=0;return this.day('They catch you at the wall and beat you for it. '+(q.fails>=X.break.fails?'They put you in chains.':'They watch you closer now.'))}
    if(a==='held-bribe'){const b=this.bribe(q);if(q.hidden<b.cost)return;q.hidden-=b.cost;if(Math.random()<b.ch)return this.free('broke','The guard takes your '+b.cost+' gold and leaves the door unbarred.');
      q.guard++;return this.day('The guard takes your '+b.cost+' gold, and tells his captain. They watch you closer now.')}
    if(a==='held-wait')return this.day('')}
  // a day in the cage: their ask comes down, your realm may pay, your companions may come, something may happen; let go at the end
  static day(text){const c=this.held,q=c.prison,X=CAPTIVITY.prison;Clock.passHours(24);q.day++;q.talked=false;P.hp=Math.min(vitals()[0],P.hp+Math.round(vitals()[0]*X.heal));
    if(c.war&&!this.atWar(c))return this.free('peace','The '+FACS[c.fac].n+' are at war with your realm no more: peace, and their prisoners are let go.');
    if(!c.war)q.offer=Math.max(Math.round(c.ransom*X.floor/5)*5,q.offer-Math.max(5,Math.round(q.offer*X.fall/5)*5));
    if(this.realmPays(c)&&Math.random()<(c.war?CAPTIVITY.war.realm:CAPTIVITY.realm.daily)&&(!c.war||payRealm(P.fac,c.ransom)))return this.free('light','On day '+q.day+' the '+FACS[P.fac].n+' pay '+(c.war?'your war price, '+c.ransom+' gold,':'for you')+' and you are let out.',0,true);
    {const x=c.war&&Prisons.heldBy(P.fac,r=>r.k==='lord'&&r.fac===c.fac);if(x&&Math.random()<PRISON.exchange){Prisons.out(x.r,x.key,'exchanged');return this.free('exchange','On day '+q.day+' the '+FACS[P.fac].n+' trade '+x.r.name+', a lord of the '+FACS[c.fac].n+' they hold, for you.')}}
    if(Math.random()<this.paroleChance(c))return this.free('parole','On day '+q.day+' '+c.name+' sends for you: he remembers you from before the war, and lets you go on your word.');
    if(c.away.length&&Math.random()<Math.min(X.rescue.max,c.away.length*X.rescue.each))return this.free('rescued',c.away.map(id=>COMPS[id].short).join(' and ')+' come for you in the night and break you out.');
    if(c.k==='band'&&this.sells(c,q))return this.sell(c,q);
    if(!c.war&&q.day>this.limit(c))return this.free('prison',c.k==='broker'?'No buyer comes for you; after '+this.limit(c)+' days he lets you go.':'After '+X.days+' days they tire of you and turn you out, with nothing but what you hid.');
    q.event=(text?text+' ':'')+(Math.random()<X.events?this.event():'');if(!q.event.trim())q.event='Another day in their cage.';return this.cell()}
  // (a band in want of its gold sells you on to a ransom broker: a day's chance (sold.daily, more for your renown, more once their ask
  // is at its floor))
  static sells(c,q){const S=CAPTIVITY.sold,X=CAPTIVITY.prison,floor=q.offer<=Math.round(c.ransom*X.floor/5)*5;return Math.random()<S.daily+P.renown*S.renown+(floor?S.floor:0)}
  // sold: they keep all you had but the gold you hid (in their stash), and carry you to a holding with a ransom broker, sold.far tiles
  // off or the farthest; your companions lose track of you; a new captor, his page
  static sell(c,q){const S=CAPTIVITY.sold,bs=TOWNS.filter(t=>t.T.broker).map(t=>[t,Math.hypot(t.x-P.x,t.y-P.y)]).sort((a,b)=>a[1]-b[1]),pick=bs.find(([,d])=>d>=S.far*TILE)||bs[bs.length-1];
    if(!pick){q.event='Another day in their cage.';return this.cell()}const t=pick[0],keep=q.hidden,took=Math.max(0,P.gold-keep);P.gold=Math.min(P.gold,keep);const gear=this.stripBag();
    for(const g of partyRoster(P).groups.slice())partyRoster(P).remove(g.type,g.count,g.id);const st=(took||gear.length)&&this.stash(c,took,gear);
    this.held={k:'broker',name:'the ransom broker of '+t.name,town:t.name,since:G.day,tried:[],away:[],with:c.with||[],at:{k:'holding',town:t.name},hidden:keep};this.held.ransom=this.ransomOf(this.held);this.put(this.spot(this.held.at));
    this.held.note='On day '+q.day+' '+c.name+' sell you to a ransom broker, who carries you to '+t.name+'. They keep all you had but the gold you hid'+(st?' (in '+st.to.name+': a quest marks it)':'')+'.'+(c.away.length?' '+c.away.map(id=>COMPS[id].short).join(' and ')+' lose'+(c.away.length>1?'':'s')+' track of you.':'');
    log('Sold to the ransom broker of '+t.name+'.','bad','war');return this.open()}
  // (what happens: a guard who knows your name watches you less; a prisoner's news; a kind soul of the house, who will help)
  static event(){const c=this.held,q=c.prison,k=['name','news','kind'][Math.floor(Math.random()*3)];
    if(k==='name'&&P.renown>=40&&q.guard>0){q.guard--;return 'A guard knows your name, and watches you less.'}
    if(k==='kind'&&c.k!=='band'){q.help=CAPTIVITY.prison.help;return 'A kind soul of the house slips you a word: the north wall is badly kept. (A better chance to break out.)'}
    return this.news()||''}
  static news(){const l=W.lords.filter(l=>!l.dead&&!KNOWLEDGE.knowsLord(l));if(!l.length)return '';const o=l[Math.floor(Math.random()*l.length)];KNOWLEDGE.lord(o);return 'A prisoner tells you of '+o.name+' of the '+FACS[o.fac].n+'.'}
  // freed: at a holding near the captor (theirs or not hostile to you); what it cost by the way out
  static free(how,text,took=0,realm=false){const c=this.held;this.held=null;const lost=[],gear=[];
    if(how==='prison'||how==='broke'||how==='rescued'){const keep=c.prison?.hidden||0;if(P.gold>keep){lost.push(P.gold-keep+' gold');took+=P.gold-keep}P.gold=Math.min(P.gold,keep);gear.push(...this.stripBag());const n=gear.length;if(n)lost.push(n+' piece'+(n>1?'s':'')+' of gear');const t=troopCount();for(const g of partyRoster(P).groups.slice())partyRoster(P).remove(g.type,g.count,g.id);if(t)lost.push(t+' soldiers')}
    else{if(how==='light'){gear.push(...this.stripBag(rint(...CAPTIVITY.light)-(has('oldsoldier')?1:0)));const n=gear.length;if(n)lost.push(n+' piece'+(n>1?'s':'')+' of gear from your bag')}const back=this.scatter();if(back)text+=' Your soldiers scattered: '+back+' of them may find you in the next days.'}
    // (their stash, near where they took you)
    const st=c.k!=='broker'&&(took||gear.length)&&this.stash(c,took,gear);
    const at=this.release(c,how,realm);
    if(c.away?.length)text+=' '+c.away.map(id=>COMPS[id].short).join(' and ')+', who got away, '+(c.away.length>1?'find':'finds')+' you.';
    if(st)text+=' What they took is in '+st.to.name+': a quest marks it.';
    // (yours taken with you: with you, but in their prison still when you broke out alone)
    {const w=(c.with||[]).filter(id=>P.comps[id]);if(how==='broke'&&w.length&&c.at)text+=' '+w.map(id=>COMPS[id].short).join(' and ')+' '+(w.length>1?'are':'is')+' still in '+Prisons.leave(w,c.at,c.fac||c.k)+'.'}
    if(how!=='broke'&&how!=='rescued'&&this.pardon(c))text+=' The '+FACS[c.fac].n+' hold nothing against you now.';
    log('Freed near '+at.name+'.','gold','war');notice('Free',text+(lost.length?' Lost: '+lost.join(', ')+'.':'')+' You are near '+at.name+'.',how==='prison'||how==='broke'||how==='rescued'?'bad':'gold')}
  // (let go by a lord or a realm (served, ransomed, fined, your term done): the score settled: their hostility over, your crimes in
  // their holdings forgiven; the honour you lost stays lost (paying a debt earns no praise); a war with your employer is not theirs
  // to forgive. true: settled)
  static pardon(c){if(!c||!c.fac||!FACS[c.fac]||c.k==='band'||c.k==='broker')return false;const h=Timed.of(P,'hostile'),was=h.has(c.fac)||TOWNS.some(t=>t.owner===c.fac&&crimeAt(t));
    h.clear(c.fac);for(const t of TOWNS)if(t.owner===c.fac)t.crime=null;return was}
  // (their pick from your bag: n pieces of gear, or all of it; the ids taken)
  static stripBag(n=Infinity){const ids=[];for(const s of P.inv.slice()){if(ids.length>=n)break;if(s&&s.k==='gear'){const id=s.id,k=playerInventory.take('gear',id,Math.min(s.n||1,n-ids.length));for(let i=0;i<k;i++)ids.push(id)}}return ids}
  // where they keep you and what they took: a camp or hideout of a band's within stash.near tiles, a holding of their realm (at war,
  // its nearest walled one); null: none
  static placeOf(c,war=false){if(c.k==='band'){const l=Spatial.nearest(W.sites.filter(s=>s instanceof Lair&&!s.cleared&&!s.within&&Math.hypot(s.x-P.x,s.y-P.y)<=CAPTIVITY.stash.near*TILE),P.x,P.y);return l?{k:'site',i:l.i,seed:l.seed}:null}
    const own=TOWNS.filter(t=>t.owner===c.fac),walled=war?own.filter(t=>wallOf(t)>0):[],t=Spatial.nearest(walled.length?walled:own,P.x,P.y);return t?{k:'holding',town:t.name}:null}
  // (that place on the map now: {x, y, name, site | town}; null: gone)
  static spot(h){if(h.k==='site'){const s=W.sites.find(x=>x.i===h.i&&x.seed===h.seed);return s?{x:s.x,y:s.y,name:'the '+s.name,site:s}:null}const t=townBy(h.town);return t?{x:t.x,y:t.y,name:t.name,town:t}:null}
  // (you at it: a holding's gate, a camp's edge (release.by tiles); out tiles off it, away from it: broken out)
  static put(s,out=0){if(s.town)heroAtGate(s.town);else{P.x=s.x;P.y=s.y+CAPTIVITY.release.by*TILE}
    if(out){const a=Math.atan2(P.y-s.y,P.x-s.x)+(Math.random()-.5);P.x+=Math.cos(a)*out*TILE;P.y+=Math.sin(a)*out*TILE}unstick(P);P.tx=P.ty=null;P.stuck=0}
  // freed: your realm's ransom at its nearest holding; broken out (or by your companions), off their camp or holding, alone (out
  // tiles); let go by a realm at war with yours, far from its gate (far tiles: clear of its watch and its caravans); any other way,
  // at their gate; their place gone, at the nearest holding not hostile to you (the rest of the way)
  static release(c,how,realm){const home=realm&&P.fac&&Spatial.nearest(fiefsOf(P.fac),P.x,P.y),s=!home&&c.at&&this.spot(c.at);
    const X=CAPTIVITY.release,war=!!P.fac&&!!c.fac&&atWar(P.fac,c.fac);if(home)heroAtGate(home);else if(s)this.put(s,war?X.far:how==='broke'||how==='rescued'?X.out:0);else{const safe=TOWNS.filter(t=>!hostileTo(t.owner));heroAtGate(Spatial.nearest(safe.length?safe:TOWNS,P.x,P.y))}
    G.lastTown=Spatial.nearestHolding(P.x,P.y);G.encCool=4;return home||s||G.lastTown}
  // their stash: where it is (where they kept you, else placeOf), and the quest that marks it; null: nowhere
  static stash(c,gold,gear){const holder=c.at||this.placeOf(c);
    if(!holder)return null;const home=Spatial.nearestHolding(P.x,P.y),q=Quest.make('stash',home,null,{holder,gold,gear,by:c.name});return q&&q.accept()?q:null}
  // your fit troops scattered: a share of each group (by your band's morale and your Leadership) finds you within days; the rest
  // are lost. How many may come back
  static scatter(){const X=CAPTIVITY.scatter,share=clamp(X.base+P.morale/100*X.morale+skill('lead')*X.lead,X.min,X.max),r=partyRoster(P);let back=0;
    for(const g of r.groups.slice()){const n=Math.round(g.count*share);r.remove(g.type,g.count,g.id);if(n){this.scattered.push({type:g.type,n,at:Clock.hours()+24*rint(...X.days)});back+=n}}return back}
  // each hour: the scattered who reach you rejoin (if there is room for them); a captivity left open by a load opens again
  static hour(){if(this.held&&G.mode==='world'&&!G.modal)return this.open();const now=Clock.hours(),r=partyRoster(P);
    for(const s of this.scattered.filter(s=>s.at<=now)){this.scattered.splice(this.scattered.indexOf(s),1);let k=0;while(k<s.n&&partyRoom()>0&&r.canAdd(s.type)&&r.add(s.type,1))k++;
      log(k?k+' of your scattered '+ST[s.type].n.toLowerCase()+(k>1?'s':'')+' find you again.':'Your scattered '+ST[s.type].n.toLowerCase()+'s find no room in your band, and go their way.',k?'good':'bad','war')}}
  static save(){return this.held||this.scattered.length?{held:this.held,scattered:this.scattered}:null}
  static load(v){this.held=v?.held||null;this.scattered=v?.scattered||[]}
}
/* the stash's quest (a side quest, never offered on a board; step kind 'stash', story/steps.js StepQuest): its holder a camp or
   hideout (cleared: won) or a holding (raided by you, or yours or your realm's: won); won, stash.back of its gold and gear. Its
   gear can be bought back from a fence in any tavern (Captivity.fenceCard). Its days up, or its holder cleared by another: sold. */
class StashQuest extends StepQuest{
  setup(t,lord,s){this.holder=s.holder;this.gold=s.gold||0;this.gear=s.gear||[];this.by=s.by;this.days=CAPTIVITY.stash.days;this.prize={};this.forfeit={};this.reward=StepQuest.reward({});
    const h=this.place();if(!h)return false;this.to={k:'spot',x:h.x,y:h.y,name:h.name};this.x=h.x;this.y=h.y;this.giver=t.name;
    this.title='Take back what they took';this.text=cap1(s.by)+' keep '+this.what()+' in '+h.name+'. '+(this.holder.k==='site'?'Clear it out':'Raid it')+' and some of it is yours again; a fence in any tavern sells the gear back. In '+this.days+' days it is sold off.'}
  // (its holder: the camp or hideout bound, or the holding)
  place(){return Captivity.spot(this.holder)}
  what(){return [this.gold&&this.gold+' gold',this.gear.length&&this.gear.length+' piece'+(this.gear.length>1?'s':'')+' of your gear'].filter(Boolean).join(' and ')||'nothing now'}
  begin(){const h=this.place();if(h?.site)h.site.seen=true}
  get deed(){return this.holder?.k==='site'?'site:cleared':'holding:raided'}
  hits(d){const h=this.holder;return h.k==='site'?!!d.site&&d.site.i===h.i&&d.site.seed===h.seed:!!d.town&&d.town.name===h.town}
  // (won: stash.back of the gold and of the gear, the rest spent or lost)
  finish(){const X=CAPTIVITY.stash,g=Math.round(this.gold*X.back),n=Math.round(this.gear.length*X.back),got=[];P.gold+=g;if(g)got.push(g+' gold');
    let k=0;for(const id of this.gear.slice(0,n))if(invAdd('gear',id,1))k++;if(k)got.push(k+' piece'+(k>1?'s':'')+' of your gear');
    this.lines={cleared:'In their chest you find '+(got.join(' and ')||'nothing left of yours')+'.'};this.pay('won','cleared')}
  todo(){return (this.holder.k==='site'?'Clear ':'Raid ')+this.to.name+', or buy your gear back from a fence.'}
  lapse(){const h=this.place();if(!h||h.site?.cleared)return this.over('gone','gone');if(h.town&&(h.town.owner==='player'||P.fac&&h.town.owner===P.fac))return this.finish();super.lapse()}
  sayOf(k){return {late:'What they took has been sold off.',gone:'Their stash is gone: someone else got there first.'}[k]||super.sayOf(k)}
}
defineKind('step','stash',{cls:StashQuest});
// a fence in a tavern (ui/town.js Tavern): a card while a stash of yours holds gear, its Buy back at stash.fence of its price
Captivity.fenceCard=(t,race)=>{const qs=P.quests.filter(q=>q.type==='stash'&&q.gear?.length).map(q=>Quest.as(q));if(!qs.length)return null;
  return {pic:personPic('merchant',race,2),name:'A fence',role:'Deals in what was taken',facts:qs.map(q=>q.gear.length+' piece'+(q.gear.length>1?'s':'')+' of your gear, from '+q.by),
    acts:qs.map(q=>{const p=Captivity.fencePrice(q);return ['held-fence',q.id,'Buy back '+p+'g',P.gold<p?'You have '+P.gold+'g':'']})}};
Captivity.fencePrice=q=>Math.max(5,Math.round(q.gear.reduce((n,id)=>n+gearPrice(id),0)*CAPTIVITY.stash.fence/5)*5);
onAct('held-',(a,arg)=>{if(a==='held-fence'){const q=P.quests.find(q=>q.id===+arg||q.id===arg);if(!q)return;const Q=Quest.as(q),p=Captivity.fencePrice(Q);if(P.gold<p)return;P.gold-=p;let k=0;for(const id of Q.gear)if(invAdd('gear',id,1))k++;Q.gear=[];
  log('You buy back '+k+' piece'+(k>1?'s':'')+' of your gear from a fence for '+p+' gold.','gold','story',Q.journalKey);if(!Q.gold)Q.over('bought','bought');if(G.town){updateHUD(true);renderTown()}return}Captivity.act(a)});
onWorld(()=>{Captivity.held=null;Captivity.scattered=[];Captivity.cv=null});
Systems.add({name:'captivity',order:{hour:160},hour:()=>Captivity.hour()});
Saves.add({key:'captivity',order:330,defaults:null,save:()=>Captivity.save(),load:v=>Captivity.load(v)});
