'use strict';
/* ---------- hosts: armies that march together (doc/HOSTS_DESIGN.md, phases 1 and 2) ----------
   A host is a leader and the armies that follow him, each still drawn and fighting as itself, never merged. On the march they walk
   in a column on the leader's own path: his trail (a point every HOSTS.crumb px, kept for each leader while he leads, never saved),
   member i making for the point (i + 1) × HOSTS.gap px back along it, so on a long road they string out along it, through a ford
   or round a wood as he went; standing still, they stand in that column behind him. A member behind its place hurries
   (HOSTS.catch); one farther than HOSTS.far (back from a patrol, a stay) makes straight for the leader first. The host goes at its
   slowest member's pace: the leader is slowed to it (paceOf). A member keeps its place: it runs off after no prey.
   Phase 1: your host, you and your companions' parties with the order Follow (world/brains.js CompanionBrain), in the order
   they were given it (fseq); each within HOSTS.join of a battle of yours joins it (battle/engage.js).
   Phase 2 (HOSTS.lord): lords. Who may march with you: a lord of your realm, of a realm allied to it, or one whose relation with
   you is lord.rel or more (Host.friend); never one hostile to you.
   - A lord follows you (l.follow: {since, until, seq}, saved with him): asked in his talk (story/conversation.js LordSpeaker, the
     check 'follow' of DIALOGUE.checks: by his relation, your honour with his realm, your renown, Charisma and Persuasion, his
     temper; refused while he has fewer than lord.troops men, a siege to lay or to break, or your host has lord.max lords), or
     offering it himself (a day's chance, lord.offer, a friend within lord.near: his page, Accept or Decline). He keeps his place
     (world/brains.js LordBrain); his days up, he takes his leave; turned hostile, no longer a friend, his men too few: he goes.
     In a battle of yours each decides as any lord near would (battle/engage.js lordWhy: his realm at war with your foe's, a
     friend), within HOSTS.join; he stands aside when you attack those his realm is at peace with (and leaves your host for it,
     relation lord.peace lower) or when the odds are hopeless (lord.hopeless) and his temper cautious; the battle's page names him.
   - You follow a lord (Host.under: {id, since, until}, saved: the piece hosts): Follow on a friend's ring (world.js followStart)
     makes you a member of his host; your band keeps its place in his column (world.js followStep), waits at his gate while he is
     inside, and takes it up again after a battle or a talk. His battle near: its page, Join or Stand aside (relation lord.aside
     lower). His days up, he lets you go (relation, renown, honour: lord.end); Stop following before that, or gone far from him
     (lord.desert × far), costs relation lord.leave and honour lord.honor.
   Phase 3 (HOSTS.camp): realm campaigns. Each day a realm at war with no campaign under way may begin one (camp.start): its
   strongest free lord its marshal (l.campaign: {tgt, since, until}), camp.members of its free lords nearest him (within
   camp.reach, camp.troops men or more) his host (l.with: his id; wseq, their places); they march on its enemy holding nearest
   him, at the host's pace, and lay siege together: the marshal resolves it with all their strength (realms.js resolveSiege,
   Host.besiegers), the members never alone. It ends: the holding taken (or no longer an enemy's), the marshal beaten, or its
   days up (camp.days); its members go their own way. Serving the realm, you are summoned (a page: Ride with his host, his
   days; Decline, honour camp.refuse lower). ---------- */
const HOSTS={crumb:6,gap:22,catch:1.3,far:160,join:220,
  lord:{rel:20,max:3,troops:6,days:[5,10],near:150,offer:.03,leave:6,honor:2,end:{rel:5,renown:3,honor:2},hopeless:2.5,cautious:['greedy','cunning'],aside:3,peace:6,desert:3},
  camp:{start:.12,min:3,members:[2,4],troops:9,reach:700,days:20,refuse:3}};
class Host{
  constructor(lead,members){this.lead=lead;this.members=members}
  // ---- your host: you, your companions' parties that follow you and the lords that do (none: no host)
  static yours(){const ps=cparties().filter(p=>p.order==='follow'&&!p.inside&&!p.fight),ls=this.lords().filter(l=>!l.fight),seq=o=>o.cid?o.fseq||0:o.follow.seq||0;
    const m=[...ps,...ls].sort((a,b)=>seq(a)-seq(b));return m.length?new Host(P,m):null}
  static lords(){return W.lords.filter(l=>l.follow&&!l.dead&&!l.gone&&!l.held)}
  // (the host an army is in, or leads: yours, or the lord's you follow)
  static of(o){const h=this.yours();if(h&&(h.lead===o||h.members.includes(o)))return h;const u=this.leader();if(u&&(o===P||o===u))return new Host(u,[...this.campMembers(u),P]);
    const L=o.campaign?o:o.with&&W.lords.find(l=>l.id===o.with&&l.campaign&&!l.dead);return L?new Host(L,this.campMembers(L)):null}
  // (a marshal's host: the lords with him, in their places)
  static campMembers(L){return W.lords.filter(l=>l.with===L.id&&!l.dead&&!l.gone&&!l.held).sort((a,b)=>(a.wseq||0)-(b.wseq||0))}
  // (a lord's pace in his host: a marshal's, slowed to his host's slowest)
  static paceFor(l){return l.campaign?this.of(l)?.paceOf()??1:1}
  // (the next place in your column)
  static seq(){return Math.max(0,...cparties().map(p=>p.fseq||0),...this.lords().map(l=>l.follow.seq||0))+1}
  // ---- the leader's trail: a point each time he has gone crumb px, as long as the column needs
  static trailOf(o){let t=this.trails.get(o);if(!t)this.trails.set(o,t=[[o.x,o.y]]);return t}
  mark(){const o=this.lead,t=Host.trailOf(o),l=t[t.length-1];if(Math.hypot(o.x-l[0],o.y-l[1])<HOSTS.crumb)return;t.push([o.x,o.y]);
    const keep=Math.ceil((this.members.length+2)*HOSTS.gap/HOSTS.crumb)+2;if(t.length>keep)t.splice(0,t.length-keep)}
  // a member's place: (i + 1) × gap back along the trail from the leader; the trail shorter, its oldest point
  slot(o){const i=this.members.indexOf(o);if(i<0)return null;const t=Host.trailOf(this.lead);let left=(i+1)*HOSTS.gap,x=this.lead.x,y=this.lead.y;
    for(let k=t.length-1;k>=0;k--){const [px,py]=t[k],d=Math.hypot(px-x,py-y);if(d>=left&&d>0){const f=left/d;return {x:x+(px-x)*f,y:y+(py-y)*f}}left-=d;x=px;y=py}return {x,y}}
  // ---- a member's moment (go(x, y, step): its brain's way of moving there, its step at its own pace sp)
  static keep(o,sp,go){const h=this.of(o);if(!h)return false;h.mark();const L=h.lead,far=Math.hypot(L.x-o.x,L.y-o.y)>HOSTS.far,s=far?{x:L.x,y:L.y}:h.slot(o),d=Math.hypot(s.x-o.x,s.y-o.y);
    if(d>1.5)go(s.x,s.y,Math.min(d,sp*(far||d>HOSTS.gap/2?HOSTS.catch:1)));return true}
  // ---- the leader's pace: slowed to its slowest member near (within far), never faster. Their own paces, before the ground
  // (they walk where he walked a moment later: the ground slows them as it slowed him); a multiplier of his
  static base(o){return o===P?bandPace():paceRatio(listSpeeds(o.troops))*sizeMul(o.troops.length)*EscapeStamina.factor(o)*(o.mapKind==='lord'&&mountedShare(listSpeeds(o.troops))<.5?.85:1)}
  paceOf(){const own=Host.base(this.lead);let m=1;for(const o of this.members)if(Math.hypot(o.x-this.lead.x,o.y-this.lead.y)<=HOSTS.far)m=Math.min(m,Host.base(o)/Math.max(.01,own));return Math.max(.3,m)}
  // (your pace, as world.js moves you: your host's slowest member's, or yours)
  static yourPace(){const h=this.yours();return h?h.paceOf():1}
  // (is o one of your host's members, near enough a battle of yours to join it)
  static joins(o){const h=this.yours();return !!h&&h.members.includes(o)&&Math.hypot(o.x-P.x,o.y-P.y)<HOSTS.join}

  // ---- phase 2: who may march with you: your realm's, its ally's, a friend; never one hostile to you
  static friend(l){return !!l&&!hostileTo(l.fac)&&(!!P.fac&&(P.fac===l.fac||relOf(P.fac,l.fac).s==='ally')||relWith(l)>=HOSTS.lord.rel)}
  // (why he will not follow you now: '' he may; false: not to be asked)
  static askWhy(l){const X=HOSTS.lord;if(!l||l.dead||l.follow||hostileTo(l.fac)||this.leader()===l)return false;if(!this.friend(l))return 'He does not know you well enough';
    if(this.lords().length>=X.max)return 'Your host has lords enough';if(l.troops.length<X.troops)return 'He has too few men';if(l.state==='siege'||l.state==='relieve')return 'He has a siege to see to';return ''}
  // he follows you, for days; his line
  static lead(l,days){const X=HOSTS.lord,n=days||rint(...X.days);if(l.inside)l.leave();l.follow={since:G.day,until:G.day+n,seq:this.seq()};log(lordName(l)+' follows you for '+n+' days.','good','war');return n}
  static release(l,why){if(!l.follow)return;l.follow=null;if(!l.dead)lordThink(l);if(why)log(why,'gold','war')}
  // ---- a lord's moment while he follows you (world/brains.js LordBrain): his place in your column
  static lordStep(l,d,brain){if(l.inside)l.leave();if(inFight(l))return true;brain.cool(l,d);const ox=l.x;
    this.keep(l,moveStep(lordSpeed(l),d),(x,y,s)=>Router.travel(l,{x,y},s));brain.face(l,ox);return true}
  // ---- a battle of yours: each lord of your host decides (engage.js, after its helpers are asked): the odds hopeless and his
  // temper cautious, he stands aside; left out (lordWhy: his realm at peace with your foe's), he stands aside, and for an attack
  // on those at peace with his realm he leaves your host. The ones standing aside, with why: e.asides
  static decide(e){const X=HOSTS.lord,fr=foeRealm(e),out=[];if(e.kind==='tourney')return;
    const foe=rating(e.list||[],e.lv||1)+e.foes.reduce((a,o)=>a+(o.power?o.power():power(o.troops)),0),ours=partyPower()+e.allies.reduce((a,o)=>a+(o.power?o.power():power(o.troops)),0);
    for(const l of this.lords()){if(Math.hypot(l.x-P.x,l.y-P.y)>HOSTS.join||l===e.ref)continue;const i=e.allies.indexOf(l),temper=l.temper||'';
      if(i>=0&&foe>ours*X.hopeless&&X.cautious.includes(temper)){e.allies.splice(i,1);out.push([l,'the odds are hopeless']);continue}
      if(i>=0)continue;const peace=fr&&fr!=='player'&&FACS[fr]&&!atWar(l.fac,fr)&&l.fac!==fr;
      if(peace&&!(P.fac&&atWar(P.fac,fr))){out.push([l,'his realm is at peace with the '+FACS[fr].n]);changeRel(l,-X.peace,'you attacked those at peace with his realm');this.release(l,lordName(l)+' will not ride with one who attacks the friends of his realm. He leaves your host.')}
      else if(fr===l.fac)out.push([l,'they are his own realm']);else out.push([l,'he has no quarrel with them'])}
    e.asides=out}
  static asidesHtml(e){return e.asides?.length?'<p class="bad">Standing aside: '+e.asides.map(([l,w])=>lordName(l)+' ('+w+')').join('; ')+'.</p>':''}
  // ---- you follow a lord: his host (Host.under), its leader now
  static leader(){const u=this.under;return u&&W.lords.find(l=>l.id===u.id&&!l.dead&&!l.gone&&!l.held)||null}
  static follows(o){return !!this.under&&this.leader()===o}
  static canFollow(o){return o?.mapKind==='lord'&&this.friend(o)&&!o.follow&&!this.under&&!o.dead&&o.troops.length>0}
  static join(o,days){const X=HOSTS.lord,n=days||rint(...X.days);this.under={id:o.id,since:G.day,until:G.day+n};log('You join the host of '+lordName(o)+' for '+n+' days.','gold','war');return n}
  // (you leave him: before his days are up, relation and honour; his days up, his thanks; why: its line)
  static leave(early,why){const l=this.leader(),X=HOSTS.lord;this.under=null;if(!l)return;
    if(early){changeRel(l,-X.leave,'you left his host');addHonor(l.fac,-X.honor,true);log(why||'You leave the host of '+lordName(l)+' before he lets you go.','bad','war')}
    else{changeRel(l,X.end.rel,'you marched with him');P.renown+=X.end.renown;addHonor(l.fac,X.end.honor,true);log(lordName(l)+' lets you go with his thanks.','good','war')}}
  // (your place in his column: world.js followStep; he inside a holding, at its gate)
  static yourSlot(l){if(l.inside){const t=townBy(l.inside);return t?gateGoal(t):{x:l.x,y:l.y}}const h=this.of(P);h.mark();return h.slot(P)}
  // (each moment on the map: your place taken up again after a battle or a talk; his battle near, its page)
  static watch(){const l=this.leader();if(!l){if(this.under)this.under=null;return}if(G.mode!=='world'||G.modal)return;
    if(!G.follow&&this.paused){this.paused=false;if(followable(l)||l.inside){G.follow={o:l,crumbs:[[l.x,l.y]],host:true}}}
    const f=l.fight&&W.fights.find(x=>x.id===l.fight);if(f&&this.asked!==f.id&&Math.hypot(f.x-P.x,f.y-P.y)<HOSTS.join){this.asked=f.id;fightMeet(f)}}
  // (his battle's page: Stand aside, in place of Watch from afar)
  static asideAct(f){const l=this.leader();return l&&f.sides.some((_,i)=>sideParties(f,i).includes(l))?['hs-aside',null,'Stand aside']:null}
  // ---- each day: lords that follow you, their days up or no longer friends, go; his host: its days, or you gone far from it;
  // a friend near may offer to follow you
  static day(){const X=HOSTS.lord;this.campaignDay();
    for(const l of this.lords()){if(G.day>=l.follow.until)this.release(l,lordName(l)+' takes his leave of your host.');else if(!this.friend(l)||l.troops.length<3)this.release(l,lordName(l)+' leaves your host.')}
    if(this.under){const l=this.leader();if(!l||hostileTo(l.fac))this.under=null;else if(G.day>=this.under.until)this.leave(false);
      else if(!G.follow&&!this.paused&&Math.hypot(l.x-P.x,l.y-P.y)>HOSTS.far*X.desert)this.leave(true,'You have gone far from the host of '+lordName(l)+': he counts you gone.')}
    if(G.quietEvents||G.mode!=='world'||G.modal||Captivity.held)return;
    const o=W.lords.find(l=>!this.askWhy(l)&&!l.inside&&!l.fight&&Math.hypot(l.x-P.x,l.y-P.y)<X.near);if(o&&Math.random()<X.offer)this.offer(o)}
  // (his offer: a page, Accept or Decline)
  static offer(l){G.mode='dialog';G.hostOffer=l;showPanel('<h2>'+lordName(l)+'</h2><p>'+lordName(l)+' of the '+FACS[l.fac].n+' rides up beside you. “The road is safer for two hosts than one. May I ride with you for a while?”</p>'+
    '<div class="btns">'+dlgBtn('hs-accept',null,'Accept',this.askWhy(l)||'',true)+'</div>'+nav(null,['hs-decline',null,'Decline']))}
  // ---- phase 3: each day, the realms' campaigns under way kept to their aim, ended when done; a realm at war may begin one
  static campaignDay(){const C=HOSTS.camp;
    for(const L of W.lords.filter(l=>l.campaign)){const c=L.campaign,t=townBy(c.tgt),ms=this.campMembers(L);
      if(L.dead||L.gone||L.held)this.disband(L,'The host of '+L.name+' breaks up.');
      else if(t&&t.owner===L.fac)this.disband(L,'With '+t.name+' taken, the host of '+L.name+' breaks up.');
      else if(!t||!atWar(L.fac,t.owner)||G.day>c.until||!ms.length)this.disband(L,'The host of '+L.name+' disperses.');
      else{if(L.state!=='siege'){L.state='march';L.tgt=c.tgt}for(const m of ms){if(m.troops.length<3){this.part(m);continue}m.state=L.state==='siege'?'siege':'march';m.tgt=L.tgt}}}
    for(const l of W.lords.filter(l=>l.with&&(l.dead||!W.lords.some(L=>L.id===l.with&&L.campaign&&!L.dead))))this.part(l);
    for(const f of FIDS){if(W.dead[f]||!realmOf(f).enemies().length||W.lords.some(l=>l.campaign&&l.fac===f)||Math.random()>=C.start)continue;this.campaign(f)}}
  // (a realm's campaign begun: its marshal, his host, his aim; its news; you summoned, serving it)
  static campaign(f){const C=HOSTS.camp,free=lordsOf(f).filter(l=>!l.dead&&!l.gone&&!l.held&&!l.follow&&!l.with&&!l.campaign&&!l.fight&&l.troops.length>=C.troops&&!['siege','relieve'].includes(l.state)&&this.leader()!==l);
    if(free.length<C.min)return null;const L=free.reduce((a,b)=>b.power()>a.power()?b:a),foes=TOWNS.filter(t=>!t.gone&&t.owner&&atWar(f,t.owner)),t=Spatial.nearest(foes,L.x,L.y);if(!t)return null;
    const ms=free.filter(l=>l!==L&&Math.hypot(l.x-L.x,l.y-L.y)<=C.reach).sort((a,b)=>Math.hypot(a.x-L.x,a.y-L.y)-Math.hypot(b.x-L.x,b.y-L.y)).slice(0,C.members[1]);if(ms.length<C.members[0])return null;
    if(L.inside)L.leave();L.campaign={tgt:t.name,since:G.day,until:G.day+C.days};L.state='march';L.tgt=t.name;ms.forEach((m,i)=>{m.with=L.id;m.wseq=i+1;m.state='march';m.tgt=t.name});
    worldEvent({text:'The '+FACS[f].n+' make '+L.name+' their marshal: '+(ms.length+1)+' lords march on '+t.name+'.',fac:[f,t.owner],x:L.x,y:L.y,towns:[t],cls:t.owner===P.fac||t.owner==='player'?'bad':f===P.fac?'good':'',
      past:L.name+' of the '+FACS[f].n+' led '+(ms.length+1)+' lords on '+t.name});
    if(P.fac===f&&!this.under&&!G.quietEvents&&G.mode==='world'&&!G.modal&&!Captivity.held)this.summon(L);return L}
  static summon(L){G.mode='dialog';G.hostSummon=L;const c=L.campaign;showPanel('<h2>'+lordName(L)+', marshal of the '+FACS[L.fac].n+'</h2><p>A rider brings word: '+lordName(L)+' calls the lords of the '+FACS[L.fac].n+' to march with him on '+c.tgt+'. You serve the realm: will you ride with his host?</p>'+
    '<div class="btns">'+dlgBtn('hs-summon',null,'Ride with his host',this.under?'You follow another':'',true)+'</div><p class="muted">Declining costs honour with the '+FACS[L.fac].n+' ('+HOSTS.camp.refuse+').</p>'+nav(null,['hs-decline-summon',null,'Decline']))}
  // (a member gone its own way; a campaign ended, its line, its members released)
  static part(l){l.with=null;l.wseq=null;if(!l.dead)lordThink(l)}
  static disband(L,why){for(const m of this.campMembers(L))this.part(m);L.campaign=null;if(!L.dead){L.state=L.state==='siege'?L.state:'home';lordThink(L)}
    if(why)worldEvent({text:why,fac:[L.fac],x:L.x,y:L.y,past:why.replace(/\.$/,'')})}
  // (the lords besieging t with l: his host's, there; or him alone)
  static besiegers(l,t){return l.campaign?[l,...this.campMembers(l).filter(m=>!m.fight&&Math.hypot(m.x-t.x,m.y-t.y)<HOSTS.far*1.5)]:[l]}
  static save(){return this.under?{under:this.under}:null}
  static load(v){this.under=v?.under||null;this.paused=!!this.under}
}
Host.trails=new WeakMap();Host.under=null;
onWorld(()=>{Host.trails=new WeakMap();Host.under=null;Host.paused=false;Host.asked=null});
onAct('hs-',a=>{
  if(a==='hs-accept'||a==='hs-decline'){const l=G.hostOffer;G.hostOffer=null;G.mode='world';hidePanel();if(a==='hs-accept'&&l&&!Host.askWhy(l))Host.lead(l);else if(l)log('You thank '+lordName(l)+', and ride on alone.','gold','war');return}
  if(a==='hs-summon'||a==='hs-decline-summon'){const L=G.hostSummon;G.hostSummon=null;G.mode='world';hidePanel();if(!L||!L.campaign)return;
    if(a==='hs-summon'&&!Host.under){Host.join(L,Math.max(1,L.campaign.until-G.day));Host.paused=false;G.follow={o:L,crumbs:[[L.x,L.y]],host:true}}else{addHonor(L.fac,-HOSTS.camp.refuse,true);log('You do not answer the call of '+lordName(L)+'.','bad','war')}return}
  if(a==='hs-aside'){const l=Host.leader();if(l)changeRel(l,-HOSTS.lord.aside,'you stood aside from his battle');G.fg=null;G.mode='world';hidePanel();if(l)log('You stand aside while '+lordName(l)+' fights.','bad','war')}});
Systems.add({name:'hosts',order:{day:177},day:()=>Host.day()});
Saves.add({key:'hosts',order:345,defaults:null,save:()=>Host.save(),load:v=>Host.load(v)});
