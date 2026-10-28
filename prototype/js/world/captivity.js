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
   Break-outs: none too hurt (break.hurt; a day heals heal), none in chains after break.fails tries.
   The traits (phase 4: traits; data/tree.js): Slippery (perk slippery: a better escape roll, yours or a companion's, and an
   easier break-out), Silver Tongue (silver: easier persuasion), Old Soldier (oldsoldier: a smaller ransom and fine, a piece
   fewer from your bag, half the service). ---------- */
const CAPTIVITY={escape:{base:.25,agi:.03,skill:.02,mounted:.15,night:.1,cover:.1,riders:.25,hurt:.15,min:.05,max:.9},
  ransom:{base:40,renown:.4,level:15,lord:1.5,harsh:1.25},persuade:{base:.2,cha:.04,pers:.04,renown:.001,honor:.004,regard:.004,war:.15,min:.05,max:.85,fine:.1},
  serve:{band:[4,6],lord:[5,8],rep:6,honor:4},realm:{honor:20,days:[3,5],daily:.25},prison:{days:21,hidden:.15,fall:.04,floor:.5,break:{base:.12,agi:.02,athl:.01,guard:.06,min:.03,max:.6,hurt:.4,fails:2},beat:.2,heal:.1,bribe:{base:20,guard:15,ch:.6,step:.15},events:.35,help:.15,rescue:{each:.07,max:.3}},stash:{back:.6,fence:.5,days:30,near:60},release:{by:2,out:5},traits:{slippery:{escape:.15,break:.1},silver:.15,oldsoldier:{cost:.75,serve:.5}},scatter:{base:.35,morale:.3,lead:.04,min:.2,max:.9,days:[1,3]},light:[1,2],
  beast:{hp:.25}};
class Captivity{
  static held=null;static scattered=[];
  // who would take you: a band, a lord, a realm's men; null: beasts (or no one)
  static captor(e){if(!e||['monster','cave','tourney','hunt'].includes(e.kind))return null;
    if(e.kind==='lord'&&e.ref)return{k:'lord',id:e.ref.id,fac:e.ref.fac,name:lordName(e.ref)};
    if(e.kind==='party'||e.kind==='camp')return{k:'band',name:'the '+(e.ref?.kind==='raiders'?'raiders':e.ref?.kind==='bog'?'bog raiders':'bandits')};
    const f=foeRealm(e);return f&&FACS[f]?{k:'realm',fac:f,name:'the men of the '+FACS[f].n}:null}
  static lord(c){return c?.k==='lord'?W.lords.find(l=>l.id===c.id)||null:null}
  // your chance to get away as the rout comes
  static escapeChance(e){const X=CAPTIVITY.escape,mounted=!!P.gear.mount,list=e.list||[],riders=list.length?list.filter(k=>ST[k]&&(ST[k].mounted||ST[k].beast)).length/list.length:0;
    return clamp(X.base+(P.attr?.agi||0)*X.agi+skill(mounted?'ride':'athl')*X.skill+(mounted?X.mounted:0)+(Clock.isNight?X.night:0)+(hiddenAt(P.x,P.y)?X.cover:0)-riders*X.riders-(P.hp<vitals()[0]/2?X.hurt:0)+(has('slippery')?CAPTIVITY.traits.slippery.escape:0),X.min,X.max)}
  // the defeat, as the battle is lost (resolution.js conclude): the words for the battle's page
  static defeat(e){const c=this.captor(e);
    if(!c){P.hp=Math.max(1,Math.min(P.hp,Math.round(vitals()[0]*CAPTIVITY.beast.hp)));return{how:'beast',text:'Left for dead among the fallen, you wake where you fell, badly hurt.'}}
    const ch=this.escapeChance(e);if(Math.random()<ch){const lose=Math.floor(P.gold*.25);P.gold-=lose;const o=e.ref;if(o&&Number.isFinite(o.x)){const dx=P.x-o.x,dy=P.y-o.y,l=Math.hypot(dx,dy)||1;walk(P,dx/l,dy/l,40)}
      const back=this.scatter();return{how:'escaped',text:'In the rout you slip away ('+Math.round(ch*100)+'% chance) and lose '+lose+' gold in the flight. Your soldiers scatter'+(back?': '+back+' of them may find you in the next days.':'.')}}
    const away=compsInBand().filter(id=>{const o=compInit(id);return Math.random()<clamp(CAPTIVITY.escape.base+(o?.attr?.agi||0)*CAPTIVITY.escape.agi+(o?.perks?.includes('slippery')?CAPTIVITY.traits.slippery.escape:0),CAPTIVITY.escape.min,CAPTIVITY.escape.max)});
    const at=this.placeOf(c),s=at&&this.spot(at);this.held={...c,since:G.day,ransom:this.ransomOf(c),tried:[],away,at};if(s)this.put(s);
    return{how:'taken',text:'The rout catches you ('+Math.round(ch*100)+'% chance to get away): you are taken by '+c.name+(s?', to '+s.name:'')+'.'+(away.length?' '+away.map(id=>COMPS[id].short).join(' and ')+' got away.':'')}}
  static ransomOf(c,harsh=false){const X=CAPTIVITY.ransom;return Math.round((X.base+P.renown*X.renown+P.level*X.level)*(c.k==='band'?1:X.lord)*(harsh?X.harsh:1)*(has('oldsoldier')?CAPTIVITY.traits.oldsoldier.cost:1)/5)*5}
  static persuadeChance(c){const X=CAPTIVITY.persuade,l=this.lord(c),regard=l?relWith(l):0,honor=c.fac&&FACS[c.fac]?honorWith(c.fac):0;
    return clamp(X.base+(P.attr?.cha||0)*X.cha+skill('pers')*X.pers+(c.k==='band'?P.renown*X.renown:honor*X.honor+regard*X.regard)-(c.fac&&hostileTo(c.fac)?X.war:0)+(has('silver')?CAPTIVITY.traits.silver:0),X.min,X.max)}
  static realmPays(c){return !!P.fac&&P.fac!==c.fac&&FACS[P.fac]&&honorWith(P.fac)>=CAPTIVITY.realm.honor}
  static serves(c){return c.k==='band'||!P.fac}
  // the captor's page: its choices, what each costs, and the odds where there are some (the frame: its bar's way out is refusing)
  static open(){const c=this.held;if(!c)return;if(c.prison)return this.cell();G.mode='dialog';const odds=this.persuadeChance(c),tried=k=>c.tried.includes(k);
    const btns=[dlgBtn('held-pay',null,'Pay the ransom · '+c.ransom+'g',P.gold<c.ransom?'You have '+P.gold+'g':'',true),
      !tried('persuade')&&dlgBtn('held-persuade',null,'Persuade them to let you go · '+insight(['you cannot tell your odds',odds>=.5?'they may well listen':'they might listen','about '+Math.round(odds*100)+'%'],'know the odds')),
      this.serves(c)&&dlgBtn('held-serve',null,(c.k==='band'?'Ride with the band':'Serve '+c.name)+' for some days'),
      this.realmPays(c)&&dlgBtn('held-realm',null,'Wait for the '+FACS[P.fac].n+' to pay for you')].filter(Boolean);
    showPanel('<h2>Taken captive</h2><p>You are held by '+c.name+'. '+(c.k==='band'?'They want gold, and know your name.':c.fac&&hostileTo(c.fac)?'You are an enemy of the '+FACS[c.fac].n+', and worth something to them.':'They will hear you out.')+'</p>'+
      (c.tried.includes('persuade')?'<p class="bad">Your words failed: they ask more now.</p>':'')+'<div class="btns cv-choices">'+btns.join('')+'</div>'+
      '<p class="muted">Ransom, persuasion or your realm’s help: freed at a holding near, your troops scattered, a piece or two from your bag taken. Serving them: you keep your goods. Refusing: their cage, for about '+CAPTIVITY.prison.days+' days at most, and out of it you keep only the gold you hide on you; your bag’s gear and your troops are lost.</p>'+
      nav(null,['held-refuse',null,'Refuse']))}
  static act(a){const c=this.held;if(!c)return;if(c.prison)return this.cellAct(a);
    if(a==='held-pay'){if(P.gold<c.ransom)return;P.gold-=c.ransom;return this.free('light','You pay '+c.ransom+' gold, and they let you go.',c.ransom)}
    if(a==='held-persuade'&&!c.tried.includes('persuade')){c.tried.push('persuade');train('pers',4);if(Math.random()<this.persuadeChance(c)){const fine=Math.floor(P.gold*CAPTIVITY.persuade.fine*(has('oldsoldier')?CAPTIVITY.traits.oldsoldier.cost:1));P.gold-=fine;return this.free('light','Your words carry: they let you go'+(fine?' for a fine of '+fine+' gold':'')+'.',fine)}
      c.ransom=this.ransomOf(c,true);log('Your words fail: '+c.name+' raise the ransom to '+c.ransom+' gold.','bad','war');return this.open()}
    if(a==='held-serve'&&this.serves(c)){const [lo,hi]=c.k==='band'?CAPTIVITY.serve.band:CAPTIVITY.serve.lord,d=Math.ceil(rint(lo,hi)*(has('oldsoldier')?CAPTIVITY.traits.oldsoldier.serve:1));Clock.passHours(d*24);
      if(c.k==='band'){const X=CAPTIVITY.serve;repNear(P.x,P.y,-X.rep);FIDS.forEach(f=>addHonor(f,-X.honor,true));return this.free('serve','You ride with the band for '+d+' days, and their raids are yours to answer for (reputation −'+X.rep+', honour −'+X.honor+' with every realm). Then they let you go.')}
      return this.free('serve','You serve '+c.name+' for '+d+' days; then they let you go.')}
    if(a==='held-realm'&&this.realmPays(c)){const [lo,hi]=CAPTIVITY.realm.days,d=rint(lo,hi);Clock.passHours(d*24);return this.free('light','After '+d+' days the '+FACS[P.fac].n+' pay for you, and you are let go.',0,true)}
    if(a==='held-refuse'){c.prison={day:1,guard:0,hidden:Math.floor(P.gold*CAPTIVITY.prison.hidden),offer:c.ransom,talked:false,help:0,event:'Their cage is cold, and the guards bored.'};return this.cell()}}
  // ---- prison: today's page (the frame: its bar's way out is waiting a day)
  static breakChance(q){const X=CAPTIVITY.prison.break;return clamp(X.base+(P.attr?.agi||0)*X.agi+skill('athl')*X.athl+q.help-q.guard*X.guard+(has('slippery')?CAPTIVITY.traits.slippery.break:0),X.min,X.max)}
  static bribe(q){const X=CAPTIVITY.prison.bribe;return{cost:X.base+q.guard*X.guard,ch:clamp(X.ch-q.guard*X.step,.05,.9)}}
  // (no break-out in chains (after break.fails tries), nor too hurt (under break.hurt of your health: a day in the cage heals heal))
  static breakWhy(q){const X=CAPTIVITY.prison.break;return (q.fails||0)>=X.fails?'They keep you in chains now':P.hp<vitals()[0]*X.hurt?'Too hurt: rest a few days first':''}
  static cell(){const c=this.held,q=c.prison,X=CAPTIVITY.prison,br=this.breakChance(q),bb=this.bribe(q);G.mode='dialog';
    const btns=[dlgBtn('held-break',null,'Try to break out · '+insight(['you cannot tell your odds',br>=.3?'you might make it':'it is a long chance','about '+Math.round(br*100)+'%'],'know the odds'),this.breakWhy(q),true),
      dlgBtn('held-bribe',null,'Bribe a guard · '+bb.cost+'g',q.hidden<bb.cost?'You hid '+q.hidden+'g':''),
      dlgBtn('held-talk',null,'Talk with the other prisoners',q.talked?'Not again today':''),
      dlgBtn('held-pay',null,'Pay what they ask now · '+q.offer+'g',P.gold<q.offer?'You have '+P.gold+'g':'')];
    showPanel('<h2>In their cage</h2><p class="muted">Day '+q.day+' of about '+X.days+' · held by '+c.name+' · '+['they watch you as they watch anyone','they watch you closely','they never take their eyes off you'][Math.min(2,q.guard)]+' · '+q.hidden+'g hidden on you</p><p>'+q.event+'</p>'+
      '<div class="btns cv-choices">'+btns.join('')+'</div><p class="muted">Each choice but talking takes the day. Their ransom comes down a little each day'+(this.realmPays(c)?'; the '+FACS[P.fac].n+' may pay for you':'')+'.</p>'+nav(null,['held-wait',null,'Wait a day']))}
  static cellAct(a){const c=this.held,q=c.prison,X=CAPTIVITY.prison;
    if(a==='held-pay'){if(P.gold<q.offer)return;P.gold-=q.offer;return this.free('light','You pay '+q.offer+' gold, and they let you out.',q.offer)}
    if(a==='held-talk'){if(q.talked)return;q.talked=true;train('pers',1);q.event=this.news()||'The others have nothing new to tell.';return this.cell()}
    if(a==='held-break'){if(this.breakWhy(q))return;if(Math.random()<this.breakChance(q))return this.free('broke','In the dark you slip your bonds and get over the wall.');
      q.guard++;q.fails=(q.fails||0)+1;P.hp=Math.max(1,Math.round(P.hp-vitals()[0]*X.beat));q.help=0;return this.day('They catch you at the wall and beat you for it. '+(q.fails>=X.break.fails?'They put you in chains.':'They watch you closer now.'))}
    if(a==='held-bribe'){const b=this.bribe(q);if(q.hidden<b.cost)return;q.hidden-=b.cost;if(Math.random()<b.ch)return this.free('broke','The guard takes your '+b.cost+' gold and leaves the door unbarred.');
      q.guard++;return this.day('The guard takes your '+b.cost+' gold, and tells his captain. They watch you closer now.')}
    if(a==='held-wait')return this.day('')}
  // a day in the cage: their ask comes down, your realm may pay, your companions may come, something may happen; let go at the end
  static day(text){const c=this.held,q=c.prison,X=CAPTIVITY.prison;Clock.passHours(24);q.day++;q.talked=false;P.hp=Math.min(vitals()[0],P.hp+Math.round(vitals()[0]*X.heal));q.offer=Math.max(Math.round(c.ransom*X.floor/5)*5,q.offer-Math.max(5,Math.round(q.offer*X.fall/5)*5));
    if(this.realmPays(c)&&Math.random()<CAPTIVITY.realm.daily)return this.free('light','On day '+q.day+' the '+FACS[P.fac].n+' pay for you, and you are let out.',0,true);
    if(c.away.length&&Math.random()<Math.min(X.rescue.max,c.away.length*X.rescue.each))return this.free('broke',c.away.map(id=>COMPS[id].short).join(' and ')+' come for you in the night and break you out.');
    if(q.day>X.days)return this.free('prison','After '+X.days+' days they tire of you and turn you out, with nothing but what you hid.');
    q.event=(text?text+' ':'')+(Math.random()<X.events?this.event():'');if(!q.event.trim())q.event='Another day in their cage.';return this.cell()}
  // (what happens: a guard who knows your name watches you less; a prisoner's news; a kind soul of the house, who will help)
  static event(){const c=this.held,q=c.prison,k=['name','news','kind'][Math.floor(Math.random()*3)];
    if(k==='name'&&P.renown>=40&&q.guard>0){q.guard--;return 'A guard knows your name, and watches you less.'}
    if(k==='kind'&&c.k!=='band'){q.help=CAPTIVITY.prison.help;return 'A kind soul of the house slips you a word: the north wall is badly kept. (A better chance to break out.)'}
    return this.news()||''}
  static news(){const l=W.lords.filter(l=>!l.dead&&!KNOWLEDGE.knowsLord(l));if(!l.length)return '';const o=l[Math.floor(Math.random()*l.length)];KNOWLEDGE.lord(o);return 'A prisoner tells you of '+o.name+' of the '+FACS[o.fac].n+'.'}
  // freed: at a holding near the captor (theirs or not hostile to you); what it cost by the way out
  static free(how,text,took=0,realm=false){const c=this.held;this.held=null;const lost=[],gear=[];
    if(how==='prison'||how==='broke'){const keep=c.prison?.hidden||0;if(P.gold>keep){lost.push(P.gold-keep+' gold');took+=P.gold-keep}P.gold=Math.min(P.gold,keep);gear.push(...this.stripBag());const n=gear.length;if(n)lost.push(n+' piece'+(n>1?'s':'')+' of gear');const t=troopCount();for(const g of partyRoster(P).groups.slice())partyRoster(P).remove(g.type,g.count,g.id);if(t)lost.push(t+' soldiers')}
    else{if(how==='light'){gear.push(...this.stripBag(rint(...CAPTIVITY.light)-(has('oldsoldier')?1:0)));const n=gear.length;if(n)lost.push(n+' piece'+(n>1?'s':'')+' of gear from your bag')}const back=this.scatter();if(back)text+=' Your soldiers scattered: '+back+' of them may find you in the next days.'}
    // (their stash, near where they took you)
    const st=(took||gear.length)&&this.stash(c,took,gear);
    const at=this.release(c,how,realm);
    if(c.away?.length)text+=' '+c.away.map(id=>COMPS[id].short).join(' and ')+', who got away, '+(c.away.length>1?'find':'finds')+' you.';
    if(st)text+=' What they took is in '+st.to.name+': a quest marks it.';
    log('Freed near '+at.name+'.','gold','war');notice('Free',text+(lost.length?' Lost: '+lost.join(', ')+'.':'')+' You are near '+at.name+'.',how==='prison'||how==='broke'?'bad':'gold')}
  // (their pick from your bag: n pieces of gear, or all of it; the ids taken)
  static stripBag(n=Infinity){const ids=[];for(const s of P.inv.slice()){if(ids.length>=n)break;if(s&&s.k==='gear'){const id=s.id,k=playerInventory.take('gear',id,Math.min(s.n||1,n-ids.length));for(let i=0;i<k;i++)ids.push(id)}}return ids}
  // where they keep you and what they took: a camp or hideout of a band's within stash.near tiles, a holding of their realm; null: none
  static placeOf(c){if(c.k==='band'){const l=Spatial.nearest(W.sites.filter(s=>s instanceof Lair&&!s.cleared&&!s.within&&Math.hypot(s.x-P.x,s.y-P.y)<=CAPTIVITY.stash.near*TILE),P.x,P.y);return l?{k:'site',i:l.i,seed:l.seed}:null}
    const t=Spatial.nearest(TOWNS.filter(t=>t.owner===c.fac),P.x,P.y);return t?{k:'holding',town:t.name}:null}
  // (that place on the map now: {x, y, name, site | town}; null: gone)
  static spot(h){if(h.k==='site'){const s=W.sites.find(x=>x.i===h.i&&x.seed===h.seed);return s?{x:s.x,y:s.y,name:'the '+s.name,site:s}:null}const t=townBy(h.town);return t?{x:t.x,y:t.y,name:t.name,town:t}:null}
  // (you at it: a holding's gate, a camp's edge (release.by tiles); out tiles off it, away from it: broken out)
  static put(s,out=0){if(s.town)heroAtGate(s.town);else{P.x=s.x;P.y=s.y+CAPTIVITY.release.by*TILE}
    if(out){const a=Math.atan2(P.y-s.y,P.x-s.x)+(Math.random()-.5);P.x+=Math.cos(a)*out*TILE;P.y+=Math.sin(a)*out*TILE}unstick(P);P.tx=P.ty=null;P.stuck=0}
  // freed: your realm's ransom at its nearest holding; broken out (or by your companions), off their camp or holding, alone; any
  // other way, at their gate; their place gone, at the nearest holding not hostile to you (the rest of the way)
  static release(c,how,realm){const home=realm&&P.fac&&Spatial.nearest(fiefsOf(P.fac),P.x,P.y),s=!home&&c.at&&this.spot(c.at);
    if(home)heroAtGate(home);else if(s)this.put(s,how==='broke'?CAPTIVITY.release.out:0);else{const safe=TOWNS.filter(t=>!hostileTo(t.owner));heroAtGate(Spatial.nearest(safe.length?safe:TOWNS,P.x,P.y))}
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
onWorld(()=>{Captivity.held=null;Captivity.scattered=[]});
Systems.add({name:'captivity',order:{hour:160},hour:()=>Captivity.hour()});
Saves.add({key:'captivity',order:330,defaults:null,save:()=>Captivity.save(),load:v=>Captivity.load(v)});
