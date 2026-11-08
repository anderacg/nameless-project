'use strict';
// A unit's growth on its card (ui/unitcard.js statGrowth, UnitCard#bar; the owner, 2026-11-01: "the unit detail should show which
// stat they grow from the original (e.g. original 10 and new is 11 then they should have different bar color)"): a troop group's
// numbers past its kind's own (its rank, its upgrades, your talents), a character's past its kind at its level (attributes,
// skills, talents, gear), the gain in the grown colour with its sources named; a temporary state (wounded, hurt) the red end it was.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,ST=t.ST,q=Kit.q,qa=Kit.qa;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const spear=['hum_levy','hum_pike','hum_spear'].find(k=>ST[k]&&ST[k].tier>0&&t.unitClass(ST[k])==='spear'),foot='hum_foot',keep=P.gear?{...P.gear}:{};
 const open=id=>{Kit.world();G.char='roster';t.openChar();t.act('party-select',id);return q('.fb-inspector .ucard-x')};
 const stat=(c,id)=>c&&c.querySelector('.uc-stat[data-stat="'+id+'"]');
 try{
  P.sk.lead.lv=10*PROF.per;P.troops={[spear]:10,[foot]:10};P.wounded={};P.woundedGroups=[];const r=t.partyRoster(P),gs=r.groups.find(g=>g.type===spear),gf=r.groups.find(g=>g.type===foot);
  ok(spear&&gs&&gf,'(a spear group and a foot group: '+spear+', '+foot+')');
  // ======== a fresh troop: its kind's own numbers, nothing grown
  {const g=t.statGrowth(gf);ok(Object.values(g.stats).every(x=>!x.parts.length&&x.now===x.base),'a fresh group: statGrowth finds nothing grown');
   const c=open(gf.id);ok(c&&!c.querySelector('.uc-bar i.gr')&&!c.querySelector('.uc-grow')&&!c.querySelector('.uc-v .gr'),'and its card shows no grown segment, no "Grown by" line')}
  // ======== a ranked group: its rank's stats and its mastery's Long reach (a pick at Adept: doc/UNIT_KITS_DESIGN.md §6, §7), with their sources
  {gs.rank=5;gs.mxp=300;gs.picks=['longReach'];const g=t.statGrowth(gs),R=g.stats.reach,A=g.stats.atk;
   ok(R&&R.now>R.base&&R.parts.some(([l])=>l==='Long reach')&&A.now>A.base&&A.parts.some(([l])=>/^Rank 5/.test(l)),'rank 5 spearmen, Adept: reach '+R.base+' → '+Math.round(R.now)+' (Long reach), attack up by Rank 5 ('+A.parts.map(p=>p[0]).join(', ')+')');
   const c=open(gs.id),s=stat(c,'reach');
   ok(s&&s.querySelector('.uc-bar i.gr')&&s.querySelector('.uc-v .gr')&&/original \d+: .*Long reach \+/.test(s.title),'its card: the reach bar\'s gain in the grown colour, its value too, the tip naming its source ('+(s&&s.title.split(' · ').slice(1).join(' · '))+')');
   ok(/Rank 5/.test(stat(c,'atk').title)&&/Grown by .*Rank 5.*Long reach|Grown by .*Long reach.*Rank 5/.test(c.querySelector('.uc-grow')?.textContent||''),'the attack\'s tip names Rank 5; the line under the bars names every source (a phone has no tooltips)')}
  // ======== an upgrade (world/buffs.js): its own part, by its name
  {t.BUFFS.ugDrill={n:'Drill upgrade',d:'',mods:{hpPct:.2}};try{gs.buffs=[{id:'ugDrill',from:'Ashford'}];const g=t.statGrowth(gs),H=g.stats.hp;
    ok(H.now>H.base&&H.parts.some(([l,n])=>l==='Drill upgrade'&&n>0),'an upgrade bought for the group: health '+H.base+' → '+H.now+' (Drill upgrade)');
    const c=open(gs.id),s=stat(c,'hp');ok(s&&s.querySelector('i.gr')&&/Drill upgrade \+\d/.test(s.title),'its card: the health bar grown, the tip "Drill upgrade +'+(H.now-H.base)+'"')}
   finally{delete t.BUFFS.ugDrill;delete gs.buffs}}
  // ======== a wounded group: its strength's red end, as before; growth and the temporary red apart
  {P.woundedGroups=[{id:gs.id,type:spear,count:3}];P.wounded={[spear]:3};const c=open(gs.id);
   ok(c&&c.querySelector('.uc-strength .uc-bar i.dn')&&/3 hurt/.test(c.querySelector('.uc-strength').textContent)&&stat(c,'reach').querySelector('i.gr'),'wounded: the strength bar\'s red end (3 hurt), its growth still shown');
   P.woundedGroups=[];P.wounded={}}
  // ======== your hero: her attributes, skills, talents and gear past her kind at her level
  {const mail=t.gearId('mail',2);P.gear.body=mail;const g=t.statGrowth(t.charOf(P)),H=g.stats.hp,Ar=g.stats.arm;
   ok(H.parts.some(([l,n])=>l==='Gear'&&n>0)&&Ar.now>Ar.base&&Ar.parts.some(([l])=>l==='Gear'),'your hero in '+t.ITEMS[mail].n+': health and armour grown by Gear ('+H.parts.map(p=>p[0]+' '+Math.round(p[1])).join(', ')+')');
   ok(Math.round(g.s.hp)===Math.round(t.heroStats().hp)&&g.s.dmg===t.heroStats().dmg,'its numbers now are her own (heroStats)');
   P.hp=t.vitals()[0];let c=open('hero'),s=stat(c,'hp');
   ok(s&&s.querySelector('i.gr')&&!s.querySelector('i.dn')&&/Gear \+\d/.test(s.title),'her card: health grown (Gear in its tip), no red at full health');
   P.hp=Math.round(t.vitals()[0]/2);c=open('hero');s=stat(c,'hp');
   ok(s&&s.querySelector('i.gr')&&s.querySelector('i.dn.over')&&s.querySelector('.uc-v .bad'),'hurt: the temporary red over it, striped so the growth shows through; the value in red');
   P.hp=t.vitals()[0]}
  // ======== a companion: the same, by its record
  {const id=Object.keys(t.COMPS).find(k=>ST[k]);if(id&&!P.comps[id])t.compJoin(id,{lv:4,attr:{str:3,agi:2,int:0,cha:0}});const c=id&&t.compOf(id);
   if(c){c.o.gear.body=t.gearId('mail',1);const g=t.statGrowth(c),H=g.stats.hp,now=c.stats();
    ok(H.parts.some(([l])=>l==='Attributes')&&H.parts.some(([l])=>l==='Gear')&&H.now===now.hp,'a companion ('+t.COMPS[id].n+'): health grown by Attributes and Gear, now its own ('+H.base+' → '+H.now+')');
    const card=open('comp_'+id);ok(card&&stat(card,'hp')?.querySelector('i.gr'),'and its card shows it')}
   else ok(false,'a companion to look at')}
  // ======== a troop card with no group (the barracks): no growth
  ok(!/class="gr"/.test(t.unitCard(spear)),'a kind\'s card at the barracks: no growth (it is the original)');
 }finally{Kit.world();P.gear=keep}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
