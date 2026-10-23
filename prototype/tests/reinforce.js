'use strict';
// Reinforcements: armies near a fight join your side (the owner, 2026-10-23: on neutral or better terms; REINF). Against a
// common enemy: your friends always, a neutral lord by a chance fixed for the encounter and only at fair odds, a holding's
// watch always on its realm's land and by chance off it, a caravan's guards only for their own caravan; against a realm's
// army only armies at war with it (a watch on its own land). At most REINF.max, the nearest and strongest first, each with
// its reason on the page. An enemy lord's faction and allies join him; helpers fight as their own units, lose their own
// troops, are thanked or routed afterwards (relation, honour, the renown shared, a share of the gold), and auto-resolve
// counts them.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const panel=()=>document.getElementById('panel').innerHTML;
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.encCool=0};
 t.act('begin','soldier');W.critters=[];W.sites=[];W.monsters=[];t.bandits.length=0;W.patrols=[];W.caravans=[];
 const mk=(name,fac,dx,n,type)=>t.asParty({id:name,name,fac,x:P.x+dx,y:P.y,troops:Array(n).fill(type||'hum_spear'),state:'rest',tgt:t.TOWNS[0].name,sd:0,dead:false,cool:0});
 const band=()=>{const b={x:P.x+5,y:P.y,n:6,cool:0,t:0,a:0,kind:'bandits'};t.bandits.push(t.asParty(b));return b};
 P.troops={hum_levy:6};
 // nobody helps a stranger who is cool toward him (a neutral one helps by chance: below)
 const ally=mk('Ser Help','vale',40,10);W.lords=[ally];P.fac=null;P.honor={};P.lrel={[ally.id]:-t.RELATION.helpAt};world();t.startEncounter({kind:'party',ref:band(),n:6,band:'bandits'});
 ok(!G.enc.allies.length,'a lord of a faction that does not know you, cool toward you, stays out of it');t.act('flee');
 // your employer's lord does
 P.fac='vale';world();t.startEncounter({kind:'party',ref:band(),n:6,band:'bandits'});ok(G.enc.allies[0]===ally&&/At your side: Ser Help/.test(panel()),'your employer\'s lord joins you against bandits');
 // too far away
 ally.x=P.x+300;t.act('flee');world();t.startEncounter({kind:'party',ref:band(),n:6,band:'bandits'});ok(!G.enc.allies.length,'a lord far away cannot help');t.act('flee');ally.x=P.x+40;
 // honor alone is enough
 P.fac=null;P.honor={vale:30};world();t.startEncounter({kind:'party',ref:band(),n:6,band:'bandits'});ok(G.enc.allies[0]===ally,'a faction that honors you (30) also helps');
 // in battle: their own units, their own losses
 t.act('fight');const B=t.B,au=B.units.filter(u=>u.lord===ally);ok(au.length===10&&au.every(u=>u.team===0&&u.grp&&B.groups[u.grp].ally&&!t.playerGroups().includes(u.grp)),'they fight as 10 units on your side, in their own groups under their own captain, outside your orders');
 const n0=ally.troops.length;au[0].hp=1;t.applyDmg(au[0],50);ok(ally.troops.length===n0-1&&!B.lost.hum_spear,'their dead come out of their army, not yours');
 B.units.filter(u=>u.team===1).forEach(u=>t.applyDmg(u,999));for(let i=0;i<80&&!B.over;i++)t.updateBattle(.05);B.endT=0;t.updateBattle(.01);
 ok(t.honorWith('vale')>30,'winning beside them earns honor');t.act('cont');done();
 // they only join fights against their enemies
 world();const foe=mk('Thane Foe','karn',8,10,'dw_clan');W.lords=[ally,foe];P.fac='vale';P.hostile={karn:G.day+30};
 W.rel[t.rk('vale','karn')]={s:'peace',since:G.day};t.startEncounter({kind:'lord',ref:foe,list:foe.troops.slice()});ok(!G.enc.allies.length,'at peace with the Karn Clans, the Vale lord stays out');t.act('flee');
 W.rel[t.rk('vale','karn')]={s:'war',since:G.day};foe.dead=false;foe.cool=0;world();t.startEncounter({kind:'lord',ref:foe,list:foe.troops.slice()});ok(G.enc.allies[0]===ally,'at war, he rides in');t.act('flee');
 // the enemy's friends join him
 const foe2=mk('Thane Two','karn',-50,8,'dw_axe');W.lords=[ally,foe,foe2];foe.cool=0;world();t.startEncounter({kind:'lord',ref:foe,list:foe.troops.slice()});
 ok(G.enc.foes[0]===foe2&&/Riding to help them: Thane Two/.test(panel()),'another Karn lord nearby rides to help him');
 t.act('fight');ok(t.B.units.filter(u=>u.lord===foe2&&u.team===1).length===8,'his men fight on the enemy side');t.B.over=true;t.B.win=true;t.B.endT=0;t.updateBattle(.01);
 ok(foe2.dead,'winning routes the helper too');t.act('cont');done();
 // auto-resolve counts helpers: a band you could not beat alone
 world();P.troops={hum_levy:2};ally.troops=Array(30).fill('hum_knight');ally.dead=false;W.lords=[ally];P.fac='vale';let wins=0;
 for(let k=0;k<6;k++){world();const b={x:P.x+5,y:P.y,n:14,cool:0,t:0,a:0,kind:'bandits'};t.bandits.push(t.asParty(b));t.startEncounter({kind:'party',ref:b,n:14,band:'bandits'});t.act('auto');if(/Victory/.test(panel()))wins++;t.act('cont');done();ally.troops=Array(30).fill('hum_knight');ally.dead=false;P.troops={hum_levy:2}}
 ok(wins>=4,'with 30 allied knights, auto-resolve wins against 14 bandits ('+wins+'/6)');
 const n1=ally.troops.length;world();const b3={x:P.x+5,y:P.y,n:14,cool:0,t:0,a:0,kind:'bandits'};t.bandits.push(t.asParty(b3));t.startEncounter({kind:'party',ref:b3,n:14,band:'bandits'});t.act('auto');ok(ally.troops.length<=n1,'and the allies take losses too');t.act('cont');done();
 // ======== armies on neutral or better terms help (the owner, 2026-10-23; REINF): who helps depends on whom you fight
 world();const R=t.REINF,RL=t.RELATION;W.lords=[];W.patrols=[];W.caravans=[];W.fights=[];P.fac=null;P.honor={};P.hostile={};P.lrel={};P.quests=[];P.troops={hum_levy:6};
 const T0=t.TOWNS.find(h=>h.owner&&h.owner!=='player'&&!t.besieged(h)&&t.landHold(h.x,h.y+20)===h),A=T0.owner;P.x=T0.x;P.y=T0.y+20;
 const T1=t.TOWNS.find(h=>h.owner&&h.owner!=='player'&&h.owner!==A),Bf=T1.owner,K=t.FIDS.find(f=>f!==A&&f!==Bf);
 const vs=list=>{world();const b={x:P.x+5,y:P.y,n:list?list.length:6,cool:0,t:0,a:0,kind:'bandits'};if(list)b.troops=list.slice();t.bandits.push(t.asParty(b));t.startEncounter({kind:'party',ref:b,n:b.n,band:'bandits',...(list?{list:list.slice()}:{})});return G.enc};
 const helps=(o,e=G.enc)=>e.allies.some(a=>a===o||a.src===o);
 const days=(f,n=40)=>{const d0=G.day,r=[];for(let d=1;d<=n;d++){G.day=d0+d;r.push(f())}G.day=d0;t.bandits.length=0;return r};
 const wt=(T,dx,n)=>{const p=t.asParty({pt:true,watch:'day',home:T.name,fac:T.owner,troops:Array(n||6).fill('hum_spear'),sent:n||6,x:P.x+dx,y:P.y,wx:null,wy:null,cool:0,dir:1});W.patrols.push(p);return p};
 // ---- lords: a neutral one by chance (fixed for the encounter), a friend always, a hostile one never, a cautious one not against a much stronger foe
 {const nl=mk('Lord Neutral',Bf,30,10);W.lords=[nl];
  const s=days(()=>{const e=vs(),a=helps(nl),line=/Lord Neutral of the [^(]+\(10\), for the bounty/.test(panel()),b=t.nearAllies(e).includes(nl);G.day+=7;const c=t.nearAllies(e).includes(nl);G.day-=7;return{a,line,same:a===b&&a===c}}),n=s.filter(x=>x.a).length;
  ok(n>0&&n<40,'a neutral lord helps against bandits by chance: on '+n+' of 40 days (REINF.chance '+R.chance+' at a relation of 0)');
  ok(s.every(x=>x.same),'and his choice holds for the encounter (asked again, and a week later)');
  ok(s.every(x=>x.line===x.a),'a neutral lord’s line on the page: “for the bounty”');
  P.lrel[nl.id]=-RL.helpAt;ok(days(()=>helps(nl,vs())).every(x=>!x),'a lord cool toward you ('+(-RL.helpAt)+') never helps');
  P.lrel[nl.id]=RL.helpAt;ok(days(()=>helps(nl,vs())).every(Boolean)&&/Lord Neutral of the [^(]+\(10\), a friend/.test(panel()),'a friend (+'+RL.helpAt+') always helps: “a friend”');
  P.hostile[Bf]=G.day+100;ok(days(()=>helps(nl,vs())).every(x=>!x),'a friend whose realm is hostile to you never helps');P.hostile={};
  P.lrel[nl.id]=0;nl.troops=Array(3).fill('hum_levy');const big=Array(40).fill('orc_grunt');ok(days(()=>helps(nl,vs(big))).every(x=>!x),'a cautious neutral lord will not throw in against a much stronger foe');
  P.lrel[nl.id]=RL.helpAt;ok(helps(nl,vs(big)),'a friend comes all the same');P.lrel={};world();t.bandits.length=0}
 // ---- the watch: always on its realm's land, off it by chance; never when its realm is hostile
 W.lords=[];{const p0=wt(T0,25);
  ok(days(()=>helps(p0,vs()),10).every(Boolean)&&/Day watch of [^(]+\(6\), riding in to clear its road/.test(panel()),'a holding’s watch always helps on its realm’s land: “riding in to clear its road”');
  P.hostile[A]=G.day+30;ok(days(()=>helps(p0,vs()),10).every(x=>!x),'not when its realm is hostile to you');P.hostile={};W.patrols=[];
  const p1=wt(T1,25);ok(!t.patrolLand(p1,P.x,P.y),'(another realm’s watch, off its land)');const n=days(()=>helps(p1,vs())).filter(Boolean).length;
  ok(n>0&&n<40,'off its land, a watch helps by chance, as a neutral lord: on '+n+' of 40 days');
  {const e=vs();ok(helps(p1,e)===helps(p1,{allies:t.nearAllies(e)}),'(the same draw for the encounter)')}W.patrols=[];world();t.bandits.length=0}
 // ---- caravan guards: only for their own caravan
 {const cv=t.asParty({cv:1,fac:A,from:T0.name,to:T1.name,x:P.x+20,y:P.y,goods:{},guards:4,cool:0,dir:1});W.caravans=[cv];
  ok(cv instanceof t.CaravanParty&&days(()=>helps(cv,vs()),10).every(x=>!x),'a caravan near your fight with bandits stays out of it');
  world();const b={x:P.x+5,y:P.y,n:6,cool:0,t:0,a:0,kind:'bandits'};t.bandits.push(t.asParty(b));t.startEncounter({kind:'party',ref:b,n:6,band:'bandits',road:{k:'caravan',fac:A}});
  const g=G.enc.allies.find(a=>a.kind==='guards');ok(g&&g.troops.length===R.guards&&g.fac===A&&/the caravan’s guards \(2\), defending their carts/.test(panel()),'the caravan you ride to save on the road fights beside you with its own '+R.guards+' guards');
  world();t.bandits.length=0;const bb=t.asParty({x:P.x+30,y:P.y,n:4,cool:0,t:0,a:0,kind:'bandits'});t.bandits.push(bb);const f=t.startFight([cv],[bb]);G.fg=f;t.act('fg-join','0');
  ok(G.enc&&G.enc.kind==='field'&&G.enc.allies.some(a=>a.src===cv)&&/At your side: Caravan of [^(]+\(4\), already in the fight/.test(panel()),'join a fight where bandits fall on a caravan: its guards are at your side');
  world();W.fights=[];cv.fight=null;bb.fight=null;W.caravans=[];t.bandits.length=0}
 // ---- a realm's army: only armies at war with that realm; a watch of a realm at war with it, on its own land
 {const foe=mk('Thane Against',K,8,10,'dw_clan'),nl=mk('Lord Bystander',A,40,10),p0=wt(T0,25);W.lords=[foe,nl];P.hostile={[K]:G.day+30};
  const vsLord=()=>{world();foe.dead=false;foe.cool=0;t.startEncounter({kind:'lord',ref:foe,list:foe.troops.slice()});return G.enc};
  W.rel[t.rk(A,K)]={s:'war',since:G.day};let e=vsLord();ok(helps(p0,e)&&/riding out against the [^.;]+ on its land/.test(panel()),'a watch whose realm is at war with them rides out on its own land');
  ok(!helps(nl,e),'a neutral lord of that realm stays out of a war against a realm (only friends at war with it, as before)');
  P.lrel[nl.id]=RL.helpAt;ok(helps(nl,vsLord()),'a friend at war with them rides in');P.lrel={};
  W.rel[t.rk(A,K)]={s:'peace',since:G.day};e=vsLord();ok(!helps(p0,e)&&!helps(nl,e),'at peace with them, neither does');
  W.patrols=[];const p1=wt(T1,25);W.rel[t.rk(Bf,K)]={s:'war',since:G.day};ok(!helps(p1,vsLord()),'a watch at war with them, off its own land, stays out');
  W.patrols=[];W.lords=[];P.hostile={};world()}
 // ---- the cap: at most REINF.max, the nearest first, of those about as near the strongest
 {P.fac=A;const L=[[20,5],[25,20],[40,8],[70,30],[90,30]].map(([dx,n],i)=>mk('Ser Cap'+i,A,dx,n));W.lords=L.slice();const e=vs();
  ok(e.allies.length===R.max&&e.allies[0]===L[1]&&e.allies[1]===L[0]&&e.allies[2]===L[2],'five of your liege’s lords near: '+R.max+' join, the nearest first, of those about as near the stronger ('+e.allies.map(l=>l.name).join(', ')+')');
  ok(/Ser Cap1 of the [^(]+\(20\), your liege’s man/.test(panel()),'a liege’s lord’s line: “your liege’s man”');P.fac=null;W.lords=[];world();t.bandits.length=0}
 // ---- after the fight: relation up, honour, the renown shared, the loot share
 {const fr=mk('Ser Friend',Bf,30,10),p0=wt(T0,25);W.lords=[fr];P.lrel[fr.id]=RL.helpAt;P.honor={};const r0=t.relWith(fr),hA=t.honorWith(A),hB=t.honorWith(Bf);
  const e=vs();ok(helps(fr,e)&&helps(p0,e),'(a friend and the watch beside you)');const g0=P.gold,n0=P.renown,men=e.men;
  t.act('fight');const B=t.B;B.units.filter(u=>u.team===1).forEach(u=>t.applyDmg(u,999));for(let i=0;i<80&&!B.over;i++)t.updateBattle(.05);B.endT=0;t.updateBattle(.01);
  const html=panel(),k=+((html.match(/You defeated (\d+) foes/)||[])[1]||0),cuts=[...html.matchAll(/(Ser Friend|Day watch of [^<]+?) takes (\d+) gold for (?:his|its) (\d+) men/g)].map(m=>({who:m[1],g:+m[2],n:+m[3]}));
  ok(t.relWith(fr)===r0+RL.fightBeside,'the lord who helped thinks better of you (+'+RL.fightBeside+')');
  ok(t.honorWith(Bf)===hB+R.honor.beside,'his realm honours you (+'+R.honor.beside+')');
  const fame=Math.max(1,Math.round(Math.max(2,Math.round(k/2))/3));// (the holding's own thanks for the fight near it: reputation.js repNear)
  ok(t.honorWith(A)===hA+R.honor.beside+R.honor.land+fame,'the watch’s realm too, and more for a common enemy cleared on its land (+'+R.honor.beside+' +'+R.honor.land+', and +'+fame+' for the fight near its holding, as before)');
  ok(k>0&&P.renown-n0===Math.ceil(k*R.renown),'the renown is shared: +'+(P.renown-n0)+' for '+k+' foes (x'+R.renown+')');
  const got=P.gold-g0,all=men+cuts.reduce((a,c)=>a+c.n,0),gold=got+cuts.reduce((a,c)=>a+c.g,0);
  ok(cuts.length===2&&cuts.every(c=>c.g===Math.round(gold*c.n/all))&&/You share the renown with them/.test(html),'each takes his share of the gold by his men ('+cuts.map(c=>c.who+' '+c.g+' for '+c.n).join(', ')+'; yours '+got+' of '+gold+' for '+men+')');
  t.act('cont');done();W.patrols=[];W.lords=[];P.lrel={}}
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
