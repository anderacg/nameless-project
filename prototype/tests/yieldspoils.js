'use strict';
// A band that yields hands over what it carried (battle/parley.js yieldEnd, yieldSpoils; the owner, 2026-11-01: "disarm bandit should
// also show renown loots from them like battle ends"): each yield's ending opens a won fight's window (ui/loot.js lootShow), its head,
// the renown and gold it brought and the pile of their gear to take or leave; rolled as a win's spoils (engage.js ON_WIN party:
// its drop), those disarmed and sent off leaving their weapons (one more roll every YIELD_SPOILS.arms of them); no experience for a
// fight not fought; its chieftain yours as prisoners, else he gets away; Continue (and Esc, as the bar) back to the map.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,q=Kit.q,qa=Kit.qa;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const A=t.YIELD_SPOILS.arms;
 // (a band of n militia beside you, yielded: its fate to choose; ld: a chieftain at its head)
 const yielded=(n,ld)=>{Kit.world();t.bandits.length=0;const b=t.asParty({kind:'bandits',x:P.x+5,y:P.y,troops:Array(n).fill('militia'),t:0,a:0,idle:false,cool:0});if(ld)b.ld=t.newChief('bandits',2);
  t.bandits.push(b);G.par={o:b,kind:'band'};return b};
 const head=()=>q('#panel h2')?.textContent,chip=n=>qa('#panel .loot-stats > span').find(s=>s.querySelector('b')?.textContent===n)?.lastChild.textContent,gear=()=>(G.loot?.pile||[]).filter(s=>s.k==='gear').length;
 const closeBtn=()=>q('#panel .nav [data-nav="close"]');
 try{
  // ======== disarmed: their weapons on the pile (the drop rolled 1 + round(n / arms) times), renown +1, no experience
  {const b=yielded(8),xp=t.xpTotal(),r=P.renown;P.inv=P.inv.map(()=>null);Kit.stub(.01,()=>t.act('pl-free'));
   ok(head()==='Disarmed'&&G.lootView&&G.mode==='dialog'&&!G.par,'disarm and let go: the end window a won fight opens, its head "Disarmed"');
   ok(P.renown===r+1&&chip('Renown')==='+1','the renown it brought, counted as a battle\'s (+1)');
   ok(gear()===1+Math.round(8/A)&&qa('#panel .loot-item').length>=1,'their weapons on the pile: a win\'s drop rolled once, and once more for every '+A+' sent off ('+gear()+' pieces for 8)');
   ok(t.xpTotal()===xp&&!chip('XP'),'no experience: there was no fight');
   ok(!t.bandits.includes(b),'and the band is gone from the map');
   ok(closeBtn()?.dataset.act==='lt-leave'&&closeBtn().hasAttribute('data-noesc'),'its way out: Continue, leaving the rest behind (never done by Esc, as a battle\'s)');
   // (Esc with things on the pile: the Game Menu, the pile kept; once more, back to the window)
   Kit.key('Escape','Escape');ok(G.mode==='esc'&&G.loot&&gear()===1+Math.round(8/A),'Esc follows the bar: with gear on the pile it leaves nothing behind (the Game Menu)');
   Kit.key('Escape','Escape');ok(G.mode==='dialog'&&head()==='Disarmed','and Esc again resumes the window');
   t.act('lt-take','0');ok(P.inv.some(s=>s&&s.k==='gear'),'a piece taken into your bag');
   t.act('lt-leave');ok(G.mode==='world'&&!G.loot&&!G.lootView,'Continue: back on the map')}
  // ======== prisoners: the stolen gold, renown +2, the prisoners; nothing on the pile with a bad roll: Continue, and Esc takes it
  {P.prisoners={};P.sk.lead.lv=5*PROF.per;const b=yielded(3),g=P.gold,r=P.renown,xp=t.xpTotal();Kit.stub(.99,()=>t.act('pl-cage'));
   ok(head()==='Prisoners'&&P.gold>g&&chip('Gold')==='+'+(P.gold-g)&&P.renown===r+2&&/^\+3/.test(chip('Prisoners')||''),'take them prisoner: "Prisoners", their stolen gold, renown +2 and the prisoners, in the window ('+chip('Gold')+' gold, '+chip('Prisoners')+')');
   ok(!gear()&&/No goods or gear/.test(Kit.panel())&&closeBtn()?.dataset.act==='cont'&&t.xpTotal()===xp,'no weapons to take this time (the drop missed): Continue only; no experience');
   Kit.key('Escape','Escape');ok(G.mode==='world'&&!G.loot,'Esc follows the bar: Continue, back on the map');
   ok(!t.bandits.includes(b),'the band gone')}
  // ======== a chieftain: yours with the prisoners (his purse with him); disarmed, he gets away
  {P.prisoners={};P.captives=[];const b=yielded(2,true),ld=b.ld;Kit.stub(.99,()=>t.act('pl-cage'));
   ok(P.captives.some(c=>c.k==='chief'&&c.ld===ld)&&!b.ld&&new RegExp(ld.name).test(Kit.text()),'with them prisoner, their chieftain is your captive ('+ld.name+'), and the window says so');t.act('lt-leave');
   const b2=yielded(2,true),ld2=b2.ld,ex=W.exiles.length;Kit.stub(.99,()=>t.act('pl-free'));
   ok(W.exiles.length===ex+1&&W.exiles.some(x=>x.ld===ld2)&&!P.captives.some(c=>c.ld===ld2),'disarmed and let go, he gets away (back with a new band in a few days)');t.act('lt-leave')}
  // ======== recruits: the men, the morale and honor; those sent off leave their weapons
  {P.sk.lead.lv=10*PROF.per;P.troops={hum_knight:4};P.wounded={};const b=yielded(5),m=P.morale,n0=t.troopCount(),xp=t.xpTotal();t.act('pl-join');ok(/Take them into your band/.test(Kit.panel()),'(choosing who joins)');
   t.act('pl-pick','militia:-1');t.act('pl-pick','militia:-1');const took=G.par.take.militia;Kit.stub(.01,()=>t.act('pl-take'));
   ok(head()==='New recruits'&&t.troopCount()===n0+took&&P.morale<m&&/the rest are disarmed and sent off/.test(Kit.text()),'into your band: "New recruits", '+took+' join, morale lower, the rest sent off');
   ok(gear()===1+Math.round((5-took)/A)&&t.xpTotal()===xp&&!t.bandits.includes(b),'the '+(5-took)+' sent off leave their weapons on the pile ('+gear()+'); no experience');
   t.act('lt-leave');ok(G.mode==='world'&&!G.loot,'Continue: back on the map')}
  // ======== a camp or hideout that yields (sites.js Lair site-fate, parley.js lairFate): the page left for the same window
  {const c=W.sites.find(s=>s instanceof t.Lair);c.cleared=false;c.seen=true;c.returned();c.bands=[];const ld=c.ld,ex=W.exiles.length;let cleared=null;t.worldOn('site:cleared',d=>{cleared=d.site});
   Kit.world();P.troops={hum_knight:40,hum_long:30};P.inv=P.inv.map(()=>null);const xp=t.xpTotal(),r=P.renown,tc=P.sk.tact.lv*1e3+P.sk.tact.xp;t.enterSite(c);t.act('site-tab','parley');Kit.stub(0,()=>t.act('site-yield'));
   ok(G.siteTab==='yield'&&G.siteSpy?.yielded,'(the '+c.T.n.toLowerCase()+' yields)');const men=G.siteSpy.yielded.filter(u=>u!=='chief').length;
   Kit.stub(.01,()=>t.act('site-fate','free'));
   ok(head()==='Disarmed'&&!G.site&&G.lootView&&G.mode==='dialog'&&P.renown===r+1&&chip('Renown')==='+1','let go: the page left for the end window, "Disarmed", renown +1');
   ok(gear()===1+Math.round(men/A)&&P.sk.tact.lv*1e3+P.sk.tact.xp===tc,'their weapons on the pile ('+gear()+' for '+men+': a beaten camp\'s drop, once more every '+A+'); no battle\u2019s practice');
   ok(c.cleared&&cleared===c&&W.exiles.some(x=>x.ld===ld)&&!c.ld&&W.exiles.length===ex+1,'the '+c.T.n.toLowerCase()+' lies empty (site:cleared heard), its chieftain gone to rebuild');
   t.act('lt-leave');ok(G.mode==='world'&&!G.loot,'Continue: back on the map')}
  // ======== a lord who yields: his ransom, renown and the shame as ever, in the same window, his army's weapons on the pile
  {Kit.world();P.prisoners={};P.sk.lead.lv=2*PROF.per;const l=W.lords.find(x=>!x.dead);l.troops=Array(8).fill('hum_levy');P.hostile[l.fac]=G.day+20;const g=P.gold,r=P.renown,xp=t.xpTotal(),h=t.honorWith(l.fac),tc=P.sk.tact.lv*1e3+P.sk.tact.xp;
   G.par={o:l,kind:'lord'};Kit.stub(.01,()=>t.act('pl-yield'));const pn=t.prisonerCount();
   ok(head()===l.name+' yields'&&G.lootView&&l.dead&&P.gold>=g+80&&P.renown===r+8&&chip('Renown')==='+8'&&t.honorWith(l.fac)<h,'a lord yields: "'+l.name+' yields", his ransom (+'+(P.gold-g)+' gold), renown +8, the honor it costs, in the end window');
   ok(gear()===1+Math.round((8-pn)/A)&&P.sk.tact.lv*1e3+P.sk.tact.xp===tc,'the '+(8-pn)+' sent home unarmed leave their weapons ('+gear()+'); no battle\u2019s practice');
   t.act('lt-leave');ok(G.mode==='world'&&!G.loot,'Continue: back on the map')}
  // ======== a quest's hooks: band:beaten still heard
  {let heard=null;t.worldOn('band:beaten',d=>{heard=d.band});const b=yielded(2);Kit.stub(.99,()=>t.act('pl-free'));ok(heard===b,'a yield still tells the world the band is broken (band:beaten: bounties, a captive it held)');t.act('lt-leave')}
 }finally{Kit.world();G.par=null;t.lootEnd()}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
