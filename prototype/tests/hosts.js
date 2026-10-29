'use strict';
// Hosts (world/hosts.js, doc/HOSTS_DESIGN.md phase 1): your companions' parties that Follow you march as your host, in a column on
// your own path (each at its place back along your trail, never stacked), at the pace of the slowest; they hunt no prey; one far
// off makes for you; each within HOSTS.join of a battle of yours joins it.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,X=t.HOSTS;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.GUIDE.on=false;
 const ash=Kit.goHome('Ashford');P.troops={hum_levy:20};P.sk.lead.lv=10;
 for(const id of ['brann','elske']){P.comps[id]={ap:5,role:''};const c=t.compInit(id);c.lv=Math.max(c.lv,t.COMP_LEAD.lv);c.ap=5;t.cpGive(id,'hum_levy',4)}
 const ps=t.cparties(),[a,b]=ps;
 ok(ps.length===2&&ps.every(p=>p.order==='follow')&&t.Host.yours()?.members.length===2,'two companions’ parties follow you: your host');
 // ---- on the march: a column on your path
 const dest={x:ash.x+40*t.TILE,y:ash.y+14};let far=0;P.tx=dest.x;P.ty=dest.y;
 const trail=[];Kit.frames(900,.05,null,()=>{trail.push([P.x,P.y]);return P.tx==null});
 const h=t.Host.yours(),[m1,m2]=h.members,d1=Math.hypot(m1.x-P.x,m1.y-P.y),d2=Math.hypot(m2.x-P.x,m2.y-P.y),apart=Math.hypot(m1.x-m2.x,m1.y-m2.y);
 const off=o=>Math.min(...trail.map(([x,y])=>Math.hypot(o.x-x,o.y-y)));
 ok(d1>X.gap*.5&&d1<X.gap*2.2&&d2>d1&&apart>X.gap*.5,'in a column behind you: the first '+Math.round(d1)+' px back, the second '+Math.round(d2)+' px, '+Math.round(apart)+' px apart');
 ok(off(m1)<12&&off(m2)<12,'on your own path ('+Math.round(off(m1))+' and '+Math.round(off(m2))+' px off it)');
 // ---- the pace: the slowest's
 {const own=t.Host.base(P),slow=Math.min(...h.members.map(o=>t.Host.base(o)));ok(Math.abs(h.paceOf()-Math.min(1,Math.max(.3,slow/own)))<1e-6&&h.paceOf()>.8,'the host at its slowest’s pace, the ground aside: ×'+h.paceOf().toFixed(2)+' of yours');
  const p=m1.troops.slice();m1.troops=Array(4).fill('hum_knight');const fast=h.paceOf();m1.troops=p;ok(fast>=h.paceOf()-1e-9,'none slower than you: your own pace')}
 // ---- they hunt no prey: a weak band near, they keep their places
 Kit.frames(200,.05);// (settled in their places, you standing)
 {const bd=t.asParty({kind:'bandits',troops:['militia'],x:m1.x+40,y:m1.y,cool:0,idle:true,t:0,a:0});t.bandits.push(bd);const x0=m1.x,y0=m1.y;for(let i=0;i<40;i++)t.BRAINS.cparty.think(m1,.05);
  ok(!m1.fight&&Math.hypot(m1.x-x0,m1.y-y0)<12,'a weak band near: the party following you keeps its place');t.bandits.length=0}
 // ---- one far off makes for you
 {m2.x=P.x+400;m2.y=P.y;const d0=Math.hypot(m2.x-P.x,m2.y-P.y);for(let i=0;i<60;i++)t.BRAINS.cparty.think(m2,.05);ok(Math.hypot(m2.x-P.x,m2.y-P.y)<d0-20,'far off ('+Math.round(d0)+' px), it makes for you')}
 // ---- a battle: every member within HOSTS.join joins it, beyond REINF.r too
 {m2.x=P.x-(t.REINF.r+40);m2.y=P.y;m1.x=P.x-20;m1.y=P.y;const bd=t.asParty({kind:'bandits',troops:Array(4).fill('militia'),x:P.x+30,y:P.y,cool:0});t.bandits.push(bd);
  t.startEncounter({kind:'party',ref:bd,n:4,list:bd.troops.slice(),band:'bandits'});const al=G.enc?.allies||[];
  ok(al.some(f=>f.src===m1)&&al.some(f=>f.src===m2),'a battle: both join it, the one '+(t.REINF.r+40)+' px back too ('+X.join+' px a host’s reach)');G.enc=null;Kit.world();t.bandits.length=0}
 // ---- told otherwise, out of the host
 {t.cpOrder('elske','patrol');ok(t.Host.yours()?.members.length===1,'told to patrol: out of your host');t.cpOrder('elske','follow');ok(t.Host.yours()?.members.at(-1)===t.compInit('elske').party,'told to follow again: the last in the column')}
 // ======== phase 2: lords
 t.cpOrder('brann','return');t.cpOrder('elske','return');for(let i=0;i<80;i++){t.BRAINS.cparty.think(t.compInit('brann').party||{troops:[]},.05)}P.comps={};
 const f=t.FIDS[0],g=t.FIDS.find(x=>x!==f),k=t.FIDS.find(x=>x!==f&&x!==g),rel=(a,b,s)=>{W.rel[t.rk(a,b)]={s,since:G.day}};
 const lordOf=fac=>{const l=W.lords.find(x=>x.fac===fac&&!x.dead&&!x.follow);Object.assign(l,{x:P.x+30,y:P.y,inside:null,fight:null,state:'rest',dead:false,troops:Array(10).fill('hum_foot')});return l};
 P.fac=f;const L=lordOf(f),N=lordOf(g);t.Relations.change(N,-t.relWith(N),'test');
 ok(t.Host.friend(L)&&!t.Host.friend(N)&&t.Host.askWhy(L)===''&&/know you well enough/.test(t.Host.askWhy(N)),'who may march with you: your realm’s lord, not a stranger');
 {const r=t.relWith(N);t.Relations.change(N,30,'test');ok(t.Host.friend(N),'a friend of another realm may');t.Relations.change(N,r-t.relWith(N),'test')}
 // (asked in his talk)
 {G.enc={kind:'lord',ref:L,list:L.troops.slice()};t.lordMeet(L);const b=document.querySelector('[data-act="talk-follow"]');ok(b&&!b.disabled&&/follow you/.test(b.textContent),'his talk: Ask him to follow you');
  Kit.stubStream('talk',0,()=>t.act('talk-follow',L.id));ok(L.follow&&L.follow.until>G.day&&/will follow you for/.test(document.getElementById('panel').textContent),'he agrees: he follows you for '+(L.follow&&L.follow.until-G.day)+' days');Kit.world()}
 {const h=t.Host.yours();ok(h&&h.members.includes(L),'a lord in your host');P.tx=P.x+20*t.TILE;P.ty=P.y;Kit.frames(500,.05,null,()=>P.tx==null);const d=Math.hypot(L.x-P.x,L.y-P.y);ok(d<X.gap*3,'he keeps his place in your column ('+Math.round(d)+' px back)')}
 // (a battle of yours: he joins against bandits; against a realm at peace with his, he stands aside and leaves your host)
 {const bd=t.asParty({kind:'bandits',troops:Array(4).fill('militia'),x:P.x+30,y:P.y,cool:0});t.bandits.push(bd);t.startEncounter({kind:'party',ref:bd,n:4,list:bd.troops.slice(),band:'bandits'});
  ok((G.enc?.allies||[]).includes(L),'bandits: he joins your battle');G.enc=null;Kit.world();t.bandits.length=0}
 {L.temper='greedy';const bd=t.asParty({kind:'bandits',troops:Array(60).fill('hum_knight'),x:P.x+30,y:P.y,cool:0});t.bandits.push(bd);t.startEncounter({kind:'party',ref:bd,n:60,list:bd.troops.slice(),band:'bandits'});
  ok(!(G.enc?.allies||[]).includes(L)&&/Standing aside: .*hopeless/.test(document.getElementById('panel').innerHTML),'the odds hopeless, his temper cautious: he stands aside, named on the page');G.enc=null;Kit.world();t.bandits.length=0;L.temper='honourable'}
 {rel(f,k,'peace');rel(L.fac,k,'peace');const o=lordOf(k);t.Timed.of(P,'hostile').set(k,20);const r0=t.relWith(L);t.startEncounter({kind:'lord',ref:o,list:o.troops.slice()});
  ok(!(G.enc?.allies||[]).includes(L)&&!L.follow&&t.relWith(L)<r0,'a lord of a realm at peace with his: he stands aside, and leaves your host');G.enc=null;Kit.world();t.Timed.of(P,'hostile').clear(k)}
 // (his days up: he takes his leave)
 {t.Host.lead(L,2);G.day=L.follow.until;t.Host.day();ok(!L.follow&&!t.Host.yours(),'his days up: he takes his leave')}
 // (a friend near offers to follow you: his page)
 {L.x=P.x+40;L.y=P.y;G.quietEvents=false;const r=Math.random;try{Math.random=()=>0;t.Host.day()}finally{Math.random=r;G.quietEvents=true}
  ok(G.mode==='dialog'&&/May I ride with you/.test(document.getElementById('panel').textContent),'a friend near asks to ride with you');t.act('hs-accept');ok(!!L.follow,'accepted: he follows you');t.Host.release(L)}
 // ---- you follow a lord: his host
 {Kit.world();Object.assign(L,{x:P.x+30,y:P.y,state:'patrol',inside:null});Kit.goTo(P.x,P.y);t.followStart(L);ok(t.Host.under?.id===L.id&&G.follow?.host,'Follow on a lord of your realm: you join his host');
  const s=JSON.stringify(t.Host.save());t.Host.under=null;t.Host.load(JSON.parse(s));ok(t.Host.under?.id===L.id,'kept in the save');
  Kit.world();G.follow={o:L,crumbs:[[L.x,L.y]],host:true};L.x+=80;for(let i=0;i<200;i++){t.followStep();t.updateWorld(.05)}const d=Math.hypot(L.x-P.x,L.y-P.y);ok(d<X.gap*3,'your band keeps its place in his column ('+Math.round(d)+' px)');
  const r0=t.relWith(L);t.Host.leave(true);ok(!t.Host.under&&t.relWith(L)<r0,'leaving before he lets you go: his regard lower');
  L.x=P.x+30;L.y=P.y;Kit.goTo(P.x,P.y);t.followStart(L);const r1=t.relWith(L),n0=P.renown;G.day=t.Host.under.until;t.Host.day();ok(!t.Host.under&&t.relWith(L)>r1&&P.renown>n0,'his days up: he lets you go with his thanks');t.followStop()}
 // (his battle near you: its page, Stand aside)
 {L.x=P.x+30;L.y=P.y;Kit.goTo(P.x,P.y);t.followStart(L);const bd=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:L.x+20,y:L.y,cool:0,idle:true});t.bandits.push(bd);Kit.world();const fg=t.startFight([L],[bd]);t.Host.watch();
  ok(G.mode==='dialog'&&document.querySelector('[data-act="hs-aside"]'),'his battle near: its page, Stand aside');const r0=t.relWith(L);t.act('hs-aside');ok(t.relWith(L)<r0&&G.mode==='world','standing aside: his regard lower');t.Host.under=null;t.followStop()}
 P.fac=null;
 // ======== phase 3: a realm's campaign under its marshal
 {const C=t.HOSTS.camp,fa=t.FIDS[1],fb=t.FIDS.find(x=>x!==fa),town=t.TOWNS.find(x=>x.owner===fa);rel(fa,fb,'war');for(const o of t.FIDS)if(o!==fa&&o!==fb)rel(fa,o,'peace');
  const ls=W.lords.filter(l=>l.fac===fa&&!l.gone).slice(0,4);ls.forEach((l,i)=>Object.assign(l,{dead:false,held:false,follow:null,with:null,campaign:null,inside:null,fight:null,state:'rest',x:town.x+i*14,y:town.y+30,troops:Array(12+i).fill('hum_foot')}));
  if(ls.length<3)ok(true,'(too few lords in this world for a campaign)');else{
   const r=Math.random;try{Math.random=()=>0;t.Host.campaignDay()}finally{Math.random=r}
   const L=ls.find(l=>l.campaign),ms=L?t.Host.campMembers(L):[];
   ok(L&&L.power()===Math.max(...ls.map(l=>l.power()))&&ms.length>=C.members[0]&&ms.every(m=>m.with===L.id),'a realm at war makes its strongest lord its marshal, '+ms.length+' lords his host, marching on '+L?.campaign?.tgt);
   ok(t.townBy(L.campaign.tgt)&&t.atWar(fa,t.townBy(L.campaign.tgt).owner)&&L.state==='march','his aim: an enemy holding, '+L.campaign.tgt);
   for(let i=0;i<300;i++){t.BRAINS.lord.think(L,.05);ms.forEach(m=>t.BRAINS.lord.think(m,.05))}
   const far=Math.max(...ms.map(m=>Math.hypot(m.x-L.x,m.y-L.y)));ok(far<X.gap*(ms.length+2),'they march in his column (the last '+Math.round(far)+' px back)');
   const tg=t.townBy(L.campaign.tgt);ms.forEach(m=>{m.x=tg.x+5;m.y=tg.y+12});L.x=tg.x;L.y=tg.y+12;ok(t.Host.besiegers(L,tg).length===ms.length+1,'at the walls: the marshal’s siege has all his host’s strength ('+(ms.length+1)+' lords)');
   // (you, serving the realm: summoned)
   P.fac=fa;G.quietEvents=false;try{L.campaign=null;ms.forEach(m=>m.with=null);Math.random=()=>0;Kit.world();t.Host.campaign(fa)}finally{Math.random=r;G.quietEvents=true}
   const L2=ls.find(l=>l.campaign);ok(G.mode==='dialog'&&/calls the lords of the/.test(document.getElementById('panel').textContent),'serving the realm: you are summoned to '+L2?.name+'’s host');
   t.act('hs-summon');ok(t.Host.under?.id===L2.id&&G.follow?.host&&t.Host.of(P).members.at(-1)===P,'answered: you ride in his host, last in his column');t.Host.under=null;t.followStop();
   // (its days up: it disperses, its lords their own way)
   G.day=L2.campaign.until+1;{const r=Math.random;try{Math.random=()=>.99;t.Host.campaignDay()}finally{Math.random=r}}ok(!L2.campaign&&ls.every(l=>!l.with),'its days up: the host disperses');P.fac=null}}
 ok(!ERR.length,'no runtime errors');
});
