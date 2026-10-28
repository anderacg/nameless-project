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
   fell. Your companions share your fate (phase 1). ---------- */
const CAPTIVITY={escape:{base:.25,agi:.03,skill:.02,mounted:.15,night:.1,cover:.1,riders:.25,hurt:.15,min:.05,max:.9},
  ransom:{base:40,renown:.4,level:15,lord:1.5,harsh:1.25},persuade:{base:.2,cha:.04,pers:.04,renown:.001,honor:.004,regard:.004,war:.15,min:.05,max:.85,fine:.1},
  serve:{band:[4,6],lord:[5,8],rep:6,honor:4},realm:{honor:20,days:[3,5]},prison:{days:21},scatter:{base:.35,morale:.3,lead:.04,min:.2,max:.9,days:[1,3]},light:[1,2],
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
    return clamp(X.base+(P.attr?.agi||0)*X.agi+skill(mounted?'ride':'athl')*X.skill+(mounted?X.mounted:0)+(Clock.isNight?X.night:0)+(hiddenAt(P.x,P.y)?X.cover:0)-riders*X.riders-(P.hp<vitals()[0]/2?X.hurt:0),X.min,X.max)}
  // the defeat, as the battle is lost (resolution.js conclude): the words for the battle's page
  static defeat(e){const c=this.captor(e);
    if(!c){P.hp=Math.max(1,Math.min(P.hp,Math.round(vitals()[0]*CAPTIVITY.beast.hp)));return{how:'beast',text:'Left for dead among the fallen, you wake where you fell, badly hurt.'}}
    const ch=this.escapeChance(e);if(Math.random()<ch){const lose=Math.floor(P.gold*.25);P.gold-=lose;const o=e.ref;if(o&&Number.isFinite(o.x)){const dx=P.x-o.x,dy=P.y-o.y,l=Math.hypot(dx,dy)||1;walk(P,dx/l,dy/l,40)}
      const back=this.scatter();return{how:'escaped',text:'In the rout you slip away ('+Math.round(ch*100)+'% chance) and lose '+lose+' gold in the flight. Your soldiers scatter'+(back?': '+back+' of them may find you in the next days.':'.')}}
    this.held={...c,since:G.day,ransom:this.ransomOf(c),tried:[]};return{how:'taken',text:'The rout catches you ('+Math.round(ch*100)+'% chance to get away): you are taken by '+c.name+'.'}}
  static ransomOf(c,harsh=false){const X=CAPTIVITY.ransom;return Math.round((X.base+P.renown*X.renown+P.level*X.level)*(c.k==='band'?1:X.lord)*(harsh?X.harsh:1)/5)*5}
  static persuadeChance(c){const X=CAPTIVITY.persuade,l=this.lord(c),regard=l?relWith(l):0,honor=c.fac&&FACS[c.fac]?honorWith(c.fac):0;
    return clamp(X.base+(P.attr?.cha||0)*X.cha+skill('pers')*X.pers+(c.k==='band'?P.renown*X.renown:honor*X.honor+regard*X.regard)-(c.fac&&hostileTo(c.fac)?X.war:0),X.min,X.max)}
  static realmPays(c){return !!P.fac&&P.fac!==c.fac&&FACS[P.fac]&&honorWith(P.fac)>=CAPTIVITY.realm.honor}
  static serves(c){return c.k==='band'||!P.fac}
  // the captor's page: its choices, what each costs, and the odds where there are some (the frame: its bar's way out is refusing)
  static open(){const c=this.held;if(!c)return;G.mode='dialog';const odds=this.persuadeChance(c),tried=k=>c.tried.includes(k);
    const btns=[dlgBtn('held-pay',null,'Pay the ransom · '+c.ransom+'g',P.gold<c.ransom?'You have '+P.gold+'g':'',true),
      !tried('persuade')&&dlgBtn('held-persuade',null,'Persuade them to let you go · '+insight(['you cannot tell your odds',odds>=.5?'they may well listen':'they might listen','about '+Math.round(odds*100)+'%'],'know the odds')),
      this.serves(c)&&dlgBtn('held-serve',null,(c.k==='band'?'Ride with the band':'Serve '+c.name)+' for some days'),
      this.realmPays(c)&&dlgBtn('held-realm',null,'Wait for the '+FACS[P.fac].n+' to pay for you')].filter(Boolean);
    showPanel('<h2>Taken captive</h2><p>You are held by '+c.name+'. '+(c.k==='band'?'They want gold, and know your name.':c.fac&&hostileTo(c.fac)?'You are an enemy of the '+FACS[c.fac].n+', and worth something to them.':'They will hear you out.')+'</p>'+
      (c.tried.includes('persuade')?'<p class="bad">Your words failed: they ask more now.</p>':'')+'<div class="btns cv-choices">'+btns.join('')+'</div>'+
      '<p class="muted">Ransom, persuasion or your realm’s help: freed at a holding near, your troops scattered, a piece or two from your bag taken. Serving them: you keep your goods. Refusing: their cage for '+CAPTIVITY.prison.days+' days, and you lose your gold, your bag’s gear and your troops.</p>'+
      nav(null,['held-refuse',null,'Refuse']))}
  static act(a){const c=this.held;if(!c)return;
    if(a==='held-pay'){if(P.gold<c.ransom)return;P.gold-=c.ransom;return this.free('light','You pay '+c.ransom+' gold, and they let you go.')}
    if(a==='held-persuade'&&!c.tried.includes('persuade')){c.tried.push('persuade');train('pers',4);if(Math.random()<this.persuadeChance(c)){const fine=Math.floor(P.gold*CAPTIVITY.persuade.fine);P.gold-=fine;return this.free('light','Your words carry: they let you go'+(fine?' for a fine of '+fine+' gold':'')+'.')}
      c.ransom=this.ransomOf(c,true);log('Your words fail: '+c.name+' raise the ransom to '+c.ransom+' gold.','bad','war');return this.open()}
    if(a==='held-serve'&&this.serves(c)){const [lo,hi]=c.k==='band'?CAPTIVITY.serve.band:CAPTIVITY.serve.lord,d=rint(lo,hi);Clock.passHours(d*24);
      if(c.k==='band'){const X=CAPTIVITY.serve;repNear(P.x,P.y,-X.rep);FIDS.forEach(f=>addHonor(f,-X.honor,true));return this.free('serve','You ride with the band for '+d+' days, and their raids are yours to answer for (reputation −'+X.rep+', honour −'+X.honor+' with every realm). Then they let you go.')}
      return this.free('serve','You serve '+c.name+' for '+d+' days; then they let you go.')}
    if(a==='held-realm'&&this.realmPays(c)){const [lo,hi]=CAPTIVITY.realm.days,d=rint(lo,hi);Clock.passHours(d*24);return this.free('light','After '+d+' days the '+FACS[P.fac].n+' pay for you, and you are let go.')}
    if(a==='held-refuse'){Clock.passHours(CAPTIVITY.prison.days*24);return this.free('prison','You sit in their cage for '+CAPTIVITY.prison.days+' days, and in the end they let you go: stripped of your gold and the gear in your bag, your soldiers long gone.')}}
  // freed: at a holding near the captor (theirs or not hostile to you); what it cost by the way out
  static free(how,text){const c=this.held;this.held=null;const lost=[];
    if(how==='prison'){if(P.gold)lost.push(P.gold+' gold');P.gold=0;const n=this.stripBag();if(n)lost.push(n+' piece'+(n>1?'s':'')+' of gear');const t=troopCount();for(const g of partyRoster(P).groups.slice())partyRoster(P).remove(g.type,g.count,g.id);if(t)lost.push(t+' soldiers')}
    else{if(how==='light'){const n=this.stripBag(rint(...CAPTIVITY.light));if(n)lost.push(n+' piece'+(n>1?'s':'')+' of gear from your bag')}const back=this.scatter();if(back)text+=' Your soldiers scattered: '+back+' of them may find you in the next days.'}
    const safe=TOWNS.filter(t=>!hostileTo(t.owner)),at=Spatial.nearest(safe.length?safe:TOWNS,P.x,P.y);heroAtGate(at);G.lastTown=at;G.encCool=4;
    log('Freed near '+at.name+'.','gold','war');notice('Free',text+(lost.length?' Lost: '+lost.join(', ')+'.':'')+' You are near '+at.name+'.',how==='prison'?'bad':'gold')}
  // (their pick from your bag: n pieces of gear, or all of it)
  static stripBag(n=Infinity){let k=0;for(const s of P.inv.slice()){if(k>=n)break;if(s&&s.k==='gear'){k+=playerInventory.take('gear',s.id,Math.min(s.n||1,n-k))}}return k}
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
onAct('held-',a=>Captivity.act(a));
onWorld(()=>{Captivity.held=null;Captivity.scattered=[]});
Systems.add({name:'captivity',order:{hour:160},hour:()=>Captivity.hour()});
Saves.add({key:'captivity',order:330,defaults:null,save:()=>Captivity.save(),load:v=>Captivity.load(v)});
