'use strict';
// Volunteers (world/volunteers.js; the owner, 2026-10-30: free recruits "if you have a good reputation and renown", "at holdings, or
// when you set up camp near holdings", replenishing "until max", affecting population; hire stays the instant way; their rate "ok",
// "within territory", "tier 1 only or peasants", "refill existing groups only").
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,V=t.VOLUNTEERS,ash=t.townBy('Ashford');Kit.begin('soldier',1);Kit.clear();Kit.world();P.sk.lead.lv=10;
 const r=t.partyRoster(P),kind=t.RACES.human.melee;P.troops={};r.add(kind,3,'new');r.add('hum_sword',3,'new');const foot=r.groups.find(g=>g.type===kind),sw=r.groups.find(g=>g.type==='hum_sword');
 const uw=()=>{t.frame();t.updateHUD(true);return document.getElementById('underway')},row=k=>uw()?.querySelector('[data-k="'+k+'"]');
 // ======== who will come
 P.rep[ash.name]=0;P.stay={town:ash.name,paidTo:t.worldTime()+t.DAY*5};ok(t.volunteerTown()===ash&&/do not know you/.test(t.volunteerWhy(ash)),'staying in Ashford, little known there: no volunteers ('+t.volunteerWhy(ash)+')');
 P.rep[ash.name]=90;ash.vol=20;ok(!t.volunteerWhy(ash)&&row('volunteers')?.querySelector('[data-act="uw-vgo"]'),'well known: Under way offers Recruit');
 ok(t.volunteerGroups(ash).map(g=>g.id).join()===foot.id,'only your tier-1 groups to refill (the swordsmen, tier 2, not)');
 {const a=t.volunteerRate(ash);P.rep[ash.name]=V.standing-t.standingAt(ash)+P.rep[ash.name];const b=t.volunteerRate(ash);P.rep[ash.name]=90;ok(a>b&&b>=V.slow,'better known, more an hour ('+a.toFixed(2)+' against '+b.toFixed(2)+')')}
 // ======== recruiting
 row('volunteers').querySelector('button').click();ok(P.recruit&&P.recruit.town===ash.name&&row('recruit'),'Recruit: under way, with Stop');
 const n0=foot.count,v0=ash.vol,p0=ash.pop,rate=t.volunteerRate(ash);for(let h=0;h<4;h++)t.volunteerHour();
 const got=foot.count-n0;ok(got===Math.floor(4*rate+1e-9)&&ash.vol===v0-got&&ash.pop===p0-got&&sw.count===3,'four hours: '+got+' join the footmen, free, out of Ashford\'s willing and its people');
 for(let h=0;h<60&&P.recruit;h++)t.volunteerHour();ok(!P.recruit&&r.groupRoom(kind,foot.id)===0,'on till the footmen are full, then done');
 // ======== camped on its lands; leaving them
 {P.stay=null;const g2=r.groups.find(g=>g.type===kind);r.remove(kind,3,g2.id);let spot=null;for(let k=0;k<400&&!spot;k++){const a=k*2.4,d=40+k%6*15,x=ash.x+Math.cos(a)*d,y=ash.y+Math.sin(a)*d;if(t.landHold(x,y)===ash&&t.passable(t.terrAt(x,y)))spot=[x,y]}
  Kit.goTo(spot[0],spot[1]);t.pitchCamp();ok(t.volunteerTown()===ash&&row('volunteers'),'camped on Ashford\'s lands: volunteers too');t.volunteerStart();
  ok(row('recruit')?.querySelector('svg.uw-live')&&row('camp')?.querySelector('svg.uw-live')&&/recruiting/.test(row('camp').textContent),'recruiting in camp: its own icon, pulsing, on its line and on the camp\'s');
  t.breakCamp();t.volunteerHour();ok(!P.recruit,'camp broken: it stops')}
 // ======== a hostile realm's
 {t.pitchCamp();const f=ash.owner;t.Timed.of(P,'hostile').extend(f,10);ok(/hostile/.test(t.volunteerWhy(ash)),'its realm hostile: none');t.breakCamp()}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
