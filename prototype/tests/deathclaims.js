'use strict';
// Who comes to the remains of your line, and what each gets (world/claims.js Claims, data/death.js DEATH.claim; the owner, 2026-11-12:
// "anyone can get it just that they reward differently based on the situations"; "Do 1, 2 and 4"): kin of the fallen pray for all of
// it and take their things freely, a stranger for a share and at a cost in standing; a plot, a fenced grave, a tomb give more, a body
// left in the wild wastes; a lord's men carry its things to his steward (or his hall, a trophy), the fallen's companion keeps them for
// the family, a beast near guards it; off, as before.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,D=t.Death,X=t.DEATH,C=X.claim,L=t.Legacy,Cl=t.Claims;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const rnd=Math.random,roll=v=>{window.Math.random=()=>v},panel=()=>document.getElementById('panel').innerHTML,on0=X.on,die0=X.die,mm=[X.min,X.max],unseen0=D.unseenAt;
 const gid=Object.keys(t.ITEMS).find(q=>t.ITEMS[q].slot==='weapon'),stranger=Object.keys(t.BGS)[0];
 const setup=()=>{Kit.world();t.Captivity.held=null;t.Captivity.scattered=[];P.quests=[];P.comps={};P.troops={};P.woundedGroups=[];P.gold=400;P.hp=t.vitals()[0];P.gear.mount=null;D.pending=null};
 // (a death to wolves, then a new life: past, a stranger's or 'kin'; the grave of the one who fell)
 const die=past=>{setup();P.xpEarned=400;X.min=X.max=0;X.die=true;
  try{const m=t.asMonster({id:'wolf',n:3,lv:1,x:P.x+20,y:P.y,hx:P.x+4000,hy:P.y,cool:0,t:0,a:0});W.monsters=[m];t.startEncounter({kind:'monster',ref:m,lv:1,list:m.troops.slice(),allies:[],foes:[]});t.concludeEncounter(false,{},0,true,[],null,{})}finally{[X.min,X.max]=mm}
  t.act('cont');const n=D.slain.n;t.act('death-new');const k0=L.kinOf;L.kinOf=()=>'child';try{t.act('death-past',past)}finally{L.kinOf=k0}W.monsters=[];return t.Remains.list.find(o=>o.grave&&o.n===n)};
 // (a body of your line made here: unburied where it lay, unless told)
 const grave=o=>{const g=t.asGrave({rm:1,grave:1,rest:'remains',unburied:1,n:1,who:'Ada Test',day:G.day,x:P.x+40,y:P.y,gold:100,items:[],xp:200,life:{level:3,renown:0,by:'wolves'},...o});t.Remains.list.push(g);t.RestSite.sync();return g};
 X.on=true;
 try{
  // ---- who claims: kin of the fallen, their blood through each life; a stranger in the line breaks it
  {L.clear();t.Remains.list=[];const a=die(stranger);ok(a&&!Cl.kin(a)&&Cl.xp(a)===Math.round(a.xp*C.stranger.xp*Cl.place(a)),'a stranger goes on: no kin of '+a.who+', '+Cl.xp(a)+' of its '+a.xp+' experience for a prayer ('+Math.round(C.stranger.xp*100)+'%)');
   const b=die('kin');ok(b&&Cl.kin(b)&&Cl.xp(b)===Math.round(b.xp*C.kin.xp*Cl.place(b))&&!Cl.kin(a),'their child goes on: kin of '+b.who+' (all '+Cl.xp(b)+' of it), but no kin of '+a.who+', a stranger before them');
   const h=Cl.home(a),r0=P.rep[h.name]||0;a.gold=Math.max(a.gold,20);const got=a.take(),said=Cl.took(a);ok(got&&(P.rep[h.name]||0)===r0-C.stranger.rep&&/a stranger took them/.test(said),'taking '+a.who+'\'s things, a stranger to them: standing at '+h.name+' −'+C.stranger.rep);
   b.gold=Math.max(b.gold,20);const hb=Cl.home(b),rb=P.rep[hb.name]||0;b.take();ok(Cl.cost(b)===0&&!Cl.took(b)&&(P.rep[hb.name]||0)===rb,'taking '+b.who+'\'s, their kin: no cost');
   const xa=t.HERO_XP_ALL(P.level,P.xp),want=Cl.xp(b);G.mode='world';b.pray();ok(Math.round(t.HERO_XP_ALL(P.level,P.xp)-xa)===want,'their kin prays: +'+want+' XP');b.flowed();
   {L.kin={rel:'child',of:3};L.line.push({n:3,rel:null,of:null});ok(L.kinTo(3)&&!L.kinTo(2)&&!L.kinTo(1),'kin of a stranger: of their blood only, not of those before them');L.line.pop()}}
  // ---- where they lie: a plot, a fenced grave, a tomb give more; left in the wild, it wastes
  {t.Remains.list=[];L.kin={rel:'child',of:1};const p=grave({rest:'stone',unburied:0,at:'X',plot:'X'}),s=grave({rest:'stone',unburied:0}),tb=grave({rest:'tomb',unburied:0}),fg=grave({rest:'grave',unburied:0});
   ok(Cl.xp(p)===Math.round(200*C.rest.plot)&&Cl.xp(s)===200&&Cl.xp(tb)===Math.round(200*C.rest.tomb)&&Cl.xp(fg)===Math.round(200*C.rest.grave),'kin praying: a headstone 200, in the family plot '+Cl.xp(p)+', a fenced grave '+Cl.xp(fg)+', a tomb '+Cl.xp(tb));
   const w=grave({gold:100,items:[['gear',gid,1]]});roll(0);try{for(let i=0;i<3;i++)Cl.waste(w)}finally{window.Math.random=rnd}
   ok(w.xp===200-3*Math.round(200*C.wild.xp)&&w.gold<100&&!w.items.length,'left unburied three days: '+w.xp+' experience left of 200, '+w.gold+' of 100 gold, its blade lost to the weather');
   for(let i=0;i<40;i++)Cl.waste(w);ok(w.xp===Math.round(200*C.wild.floor),'and never below '+Math.round(C.wild.floor*100)+'% of it ('+w.xp+')');
   ok(/the weather has taken some/.test(Cl.praySay(w)),'its page says why: "'+Cl.praySay(w)+'"')}
  // ---- a lord who forces his claim (greedy, cunning, proud) takes its things before any passer-by buries it: his steward sells
  // them back (kin less), or a proud lord keeps them in his hall; an honourable or kind one leaves it to the passer-by
  {t.Remains.list=[];W.monsters=[];L.kin={rel:null,of:1};L.held=[];const l=W.lords.find(o=>!o.dead&&!o.gone&&!o.inside&&!o.heir&&t.FACS[o.fac]),lx=[l.x,l.y],tp=l.temper;
   const g=grave({gold:200,items:[['gear',gid,1]],x:P.x+200,y:P.y+200});l.x=g.x+10;l.y=g.y;l.temper='greedy';D.unseenAt=()=>true;roll(0);
   try{t.Grave.daily()}finally{window.Math.random=rnd;D.unseenAt=unseen0}
   const h=L.held.find(o=>o.by==='lord');ok(h&&g.empty()&&g.taken&&h.lord===l.id&&!h.trophy&&t.townBy(h.at)?.owner===l.fac,'a greedy lord near, a day unseen: '+l.name+'\'s men take its things to '+(h&&h.at)+', a holding of his, before the passer-by buries it ('+(g.unburied?'unburied':'buried, empty')+')');
   if(h){const T0=t.townBy(h.at),card=Cl.cards(T0).find(c=>/steward/.test(c.name)),p=Cl.price(h);
    ok(card&&card.acts[0][0]==='claim-get'&&p===Math.max(5,Math.round(Cl.worth(h)*C.lord.price.stranger/5)*5),'in its tavern, his steward sells them back: '+p+'g, a stranger ('+Math.round(C.lord.price.stranger*100)+'% of their worth '+Cl.worth(h)+')');
    L.kin={rel:'child',of:1};const pk=Cl.price(h);ok(pk<p,'their kin pays less: '+pk+'g');
    const hg=h.gold;P.gold=pk+50;G.town=null;t.act('claim-get',h.id);ok(P.gold===50+hg&&P.inv.some(q=>q&&q.id===gid)&&!L.held.includes(h),'bought back: the blade in your bag, its '+hg+' gold yours')}
   const g2=grave({gold:80,items:[],x:P.x+260,y:P.y+200});l.x=g2.x;l.y=g2.y;l.temper='proud';D.unseenAt=()=>true;roll(0);try{Cl.seize(g2)}finally{window.Math.random=rnd;D.unseenAt=unseen0}
   const tr=L.held.find(o=>o.trophy);ok(tr&&!Cl.cards(t.townBy(tr.at)).find(c=>/hall/.test(c.name))?.acts,'a proud lord: a trophy in the hall of '+(tr&&tr.at)+', not for sale');
   if(tr){const T1=t.townBy(tr.at),o0=T1.owner,g0=P.gold;T1.owner='player';try{Cl.daily()}finally{T1.owner=o0}ok(P.gold===g0+80&&!L.held.includes(tr),'that holding yours: its trophy yours again (+80 gold)')}
   {const g3=grave({gold:90,items:[],x:P.x+320,y:P.y+200});l.x=g3.x;l.y=g3.y;l.temper='honourable';const n0=L.held.length;D.unseenAt=()=>true;roll(0);try{t.Grave.daily()}finally{window.Math.random=rnd;D.unseenAt=unseen0}
    ok(L.held.length===n0&&!g3.unburied&&g3.gold===90,'an honourable lord near: he leaves it to the passer-by, who buries it with its things ('+g3.kind+', '+g3.gold+' gold in it)')}
   l.x=lx[0];l.y=lx[1];l.temper=tp;W.lords.forEach(o=>{if(!o.heir){o.x=-9999;o.y=-9999}})}
  // ---- the fallen's companion: keeps its things in their tavern for the family (kin free, a stranger pays)
  {t.Remains.list=[];L.held=[];L.kept={brann:{lv:3}};const ct=t.compTown('brann'),g=grave({gold:60,items:[['gear',gid,1]],x:ct.x+40,y:ct.y+40});D.unseenAt=()=>true;roll(0);
   try{Cl.others(g)}finally{window.Math.random=rnd;D.unseenAt=unseen0}
   const h=L.held.find(o=>o.by==='comp');ok(h&&h.cid==='brann'&&h.at===ct.name&&g.empty(),'Brann, in the tavern at '+ct.name+', finds the body and keeps what lay with it');
   if(h){L.kin={rel:null,of:1};const ps=Cl.price(h);L.kin={rel:'child',of:1};const pk=Cl.price(h),card=Cl.cards(ct).find(c=>c.name===t.COMPS.brann.n);
    ok(ps>0&&pk===0&&card&&/Take them/.test(card.acts[0][2]),'a stranger pays them '+ps+'g; the family takes them back for nothing ("'+(card&&card.acts[0][2])+'")')
    t.enterTown(ct);t.act('tab','tavern');ok(new RegExp('Keeps the things of '+g.who).test(panel())&&new RegExp('data-act="claim-get"[^>]*data-arg="'+h.id+'"|data-arg="'+h.id+'"[^>]*data-act="claim-get"').test(panel()),'in the tavern window: their card, its Take them');
    const nG=()=>P.inv.reduce((n,q)=>n+(q&&q.id===gid?q.n||1:0),0),n0=nG();t.act('claim-get',h.id);ok(nG()===n0+1&&!L.held.includes(h),'taken: back in your bag');Kit.world()}
   L.kept={}}
  // ---- your heir, while they live, keeps them for the family; neither the heir nor any of the fallen's companions left, another
  // companion finds them and sells them to anyone
  {t.Remains.list=[];L.held=[];L.kept={};const l=W.lords.find(o=>!o.dead&&!o.gone&&!o.inside&&!o.heir&&t.FACS[o.fac]),lx=[l.x,l.y];l.heir={cid:'brann',comps:['brann'],of:'Ada Test'};
   try{const g=grave({gold:70,items:[],x:P.x+380,y:P.y+200});l.x=g.x;l.y=g.y;D.unseenAt=()=>true;roll(0);try{Cl.others(g)}finally{window.Math.random=rnd;D.unseenAt=unseen0}
    const h=L.held.find(o=>o.by==='heir');L.kin={rel:'child',of:1};const pk=h&&Cl.price(h);L.kin={rel:null,of:1};const ps=h&&Cl.price(h);
    ok(h&&h.name===l.name&&pk===0&&ps>0&&Cl.cards(t.townBy(h.at)).some(c=>/heir of your line/.test(c.note)),'your heir '+l.name+' finds the body: keeps its things at '+(h&&h.at)+' for the family (kin free, a stranger '+ps+'g)');
    const other=Object.keys(t.COMPS).find(id=>t.compTown(id)&&!t.Legacy.serves(id)),ot=t.compTown(other),g2=grave({gold:40,items:[],x:ot.x+30,y:ot.y+30});l.x=-9999;D.unseenAt=()=>true;roll(0);try{Cl.others(g2)}finally{window.Math.random=rnd;D.unseenAt=unseen0}
    ok(!L.held.some(o=>o.by==='other'),'the heir still living: no other companion takes them');
    delete l.heir;roll(0);D.unseenAt=()=>true;try{Cl.others(g2)}finally{window.Math.random=rnd;D.unseenAt=unseen0}const ho=L.held.find(o=>o.by==='other');
    L.kin={rel:'child',of:1};const pko=ho&&Cl.price(ho);L.kin={rel:null,of:1};const pso=ho&&Cl.price(ho);ok(ho&&pko>0&&pko===pso,'no heir and none of the fallen\'s companions left: '+(ho&&t.COMPS[ho.cid].short)+' finds them, and sells them to anyone, kin too ('+pko+'g)')}
   finally{delete l.heir;l.x=lx[0];l.y=lx[1];L.held=[]}}
  // ---- a beast whose lair is near guards a body in the wild: no prayer, no taking, no robbers, no lord's men, till it is gone
  {t.Remains.list=[];L.held=[];L.kin={rel:'child',of:1};const g=grave({gold:50,x:P.x+300,y:P.y+300}),m=t.asMonster({id:'wolf',n:2,lv:1,x:g.x+30,y:g.y,hx:g.x+30,hy:g.y,cool:0,t:0,a:0});W.monsters=[m];
   const l=W.lords.find(o=>!o.dead&&!o.gone&&!o.inside&&!o.heir&&t.FACS[o.fac]);l.x=g.x;l.y=g.y;delete l.temper;D.unseenAt=()=>true;roll(0);try{t.Grave.daily()}finally{window.Math.random=rnd;D.unseenAt=unseen0}
   ok(Cl.guard(g)===m&&!g.pray()&&g.take()===''&&!g.robbable()&&!L.held.length&&g.gold===50-Math.ceil(50*C.wild.gold)&&g.unburied,'wolves lair by '+g.who+': no prayer, nothing taken, no robbers, the lord\'s men pass it by, no one buries it (it still wastes)');
   const site=W.sites.find(o=>o.type==='rest'&&o.members().includes(g));G.mode='world';G.modal=false;if(site){site.meet();ok(/guards them/.test(panel()),'its page: "'+(Cl.guardWhy(g))+'", its deeds shut')}
   Kit.world();m.n=0;const xp=Cl.xp(g);ok(!Cl.guard(g)&&g.pray()&&xp>0,'the wolves slain: you pray, +'+xp+' XP');l.x=-9999;l.y=-9999;W.monsters=[]}
  // ---- saved: what lords and companions keep
  {L.held=[{id:7,who:'Ada',n:1,day:1,gold:5,items:[],by:'comp',cid:'brann',at:'X'}];L.heldN=7;L.fallen=Math.max(1,L.fallen);const sv=JSON.parse(JSON.stringify(L.save()));L.clear();L.load(sv);ok(L.held.length===1&&L.heldN===7,'saved and loaded: what they keep for you');L.held=[]}
  // ---- off: the same for anyone, as before
  {t.Remains.list=[];C.on=false;try{L.kin={rel:null,of:1};const g=grave({rest:'tomb',unburied:0}),m=t.asMonster({id:'wolf',n:2,lv:1,x:g.x,y:g.y,hx:g.x,hy:g.y,cool:0,t:0,a:0});W.monsters=[m];
   ok(Cl.xp(g)===g.xp&&!Cl.guard(g)&&!Cl.cost(g)&&!Cl.cards(t.TOWNS[0]).length,'off: the whole of it for anyone, no cost, nothing guards it')}finally{C.on=true;W.monsters=[]}}
 }finally{window.Math.random=rnd;D.unseenAt=unseen0;X.on=on0;X.die=die0;[X.min,X.max]=mm;D.slain=null;t.Remains.list=[];W.sites=W.sites.filter(o=>o.type!=='rest');W.lords=W.lords.filter(l=>!l.heir);for(const x of t.TOWNS)if(L.realms[x.owner])x.owner=t.FIDS[0];L.clear();P.comps={}}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
