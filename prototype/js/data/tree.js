'use strict';
/* ---------- data: the skill trees, one for each proficiency (the owner, 2026-11-08: "make each skill tree separated by proficiency";
   core/talents.js TalentService, ui/talents.js) ----------
   A proficiency's tree is its tiers, each two nodes, every node of a tier growing from both of the tier below. Your skill points
   (one each level of yours: data/progression.js LEVEL) are spent on any tree's nodes (no milestone: the owner, 2026-11-08, Skyrim's
   way), and what a node gives grows with its proficiency's level (treeScale: a quarter at 0, whole at 100, more past it).
   PROF_TREE[prof]: its tiers in order, each [a, b], a node [id, kind, name, effects, what it does] (no words: made from its effects,
   describeNode). Kinds: s small, n notable, k keystone (a big trade-off), a ability (unlocks or upgrades an active skill).
   Effects (m): attr {str…}: what a point of that old attribute gave, as its bonuses (data/progression.js attrMods; attributes are
   gone); learn: this proficiency learned faster; sk {skill: power}; perk: an old perk this node grants; unlock: an active
   skill; combo3: a third blow (the finisher) in your combo; fin: its finishing style (stun, push; a finisher brings the third blow).
   Stat keys: hp, hpPct, dmg, dmgPct, reach, cd (swing time, negative is faster), spd, crit, block, dr (less damage taken), regen,
   sp, spRegen, mp, mpPct, mpRegen, travel, vis, slots, tHp, tDmg, food, hire, train, prison, morale, loot, kick, fistPct, fistCd,
   grabCd, grabDown, and per ability: <id>R (radius), <id>Dmg, <id>Cost, <id>Cd, <id>Stun, <id>Dur; dodgeCost, dodgeCd. */
const PROF_TREE={
  oneh:[
    [['oneh_third','a','Third Blow',{combo3:1},'Your combo ends in a finisher: a third, heavier blow.'],['oneh_str','s','Strength',{attr:{str:2}}]],
    [['oneh_whirl','a','Whirlwind',{unlock:'whirl',hp:5},'Active skill: spin and hit every enemy around you. +5 health.'],['oneh_dash','a','Blade Dash',{unlock:'dash'},'Active skill: dash through enemies, cutting each one you pass.']],
    [['oneh_stun','n','Stunning Finisher',{combo3:1,fin:'stun'},'A third blow, the finisher, that stuns 60% longer and barely pushes.'],['oneh_push','n','Crushing Finisher',{combo3:1,fin:'push'},'A third blow, the finisher, that knocks foes far away but does not stun.']],
    [['oneh_oath','k','Berserker’s Oath',{dmgPct:.35,dr:-.15},'+35% damage, but you take 15% more damage.'],['oneh_duel','n','Duelist',{crit:.08,reach:2,dmgPct:.1},'+8% crit chance, a little more reach, +10% damage.']]],
  twoh:[
    [['twoh_third','a','Third Blow',{combo3:1},'Your combo ends in a finisher: a third, heavier blow.'],['twoh_tough','s','Toughness',{hp:15}]],
    [['twoh_leap','a','Leap Slam',{unlock:'leap'},'Active skill: leap onto a knot of enemies and stun them where you land.'],['twoh_quake','a','Earthquake',{unlock:'quake'},'Active skill: slam the ground, hurting and staggering every enemy around you.']],
    [['twoh_stun','n','Stunning Finisher',{combo3:1,fin:'stun'},'A third blow, the finisher, that stuns 60% longer and barely pushes.'],['twoh_shake','a','Earthshaker',{leapR:.5,leapStun:.5,quakeR:.4,quakeStun:.4},'Leap Slam and Earthquake reach farther and stun longer.']],
    [['twoh_blood','n','Bloodlust',{perk:'bloodlust',dmgPct:.1},'Your swings crit twice as often. +10% damage.'],['twoh_hide','n','Iron Hide',{dr:.05,hp:20},'Take 5% less damage. +20 health.']]],
  block:[
    [['block_wall','n','Shieldwall',{perk:'shieldwall'},'Blocked hits deal only 10% damage.'],['block_tough','s','Toughness',{hp:12}]],
    [['block_skin','n','Thick Skin',{dr:.08,hp:15},'Take 8% less damage. +15 health.'],['block_guard','s','Steady Guard',{block:.05,sp:15}]],
    [['block_iron','n','Iron Hide',{dr:.05,hp:20},'Take 5% less damage. +20 health.'],['block_rear','n','Rearguard',{perk:'rearguard'},'Caught fleeing, you lose half as many men.']]],
  archery:[
    [['arch_aim','s','Steady Aim',{sk:{archery:1},crit:.02}],['arch_hawk','n','Hawkeye',{perk:'guide',vis:.05},'Shows your arrow’s path and where it will land while you draw a bow.']],
    [['arch_volley','a','Rain of Arrows',{unlock:'volley'},'Active skill: loose eight arrows that fall around your aim.'],['arch_marks','n','Marksman',{sk:{archery:2},vis:.05},'+2 Archery. See a little farther.']],
    [['arch_hail','a','Arrow Hail',{volleyR:.4,volleyDmg:.3},'Rain of Arrows covers 40% more ground and hits 30% harder.'],['arch_hands','s','Quick Hands',{cd:-.08}]],
    [['arch_wolf','k','Lone Wolf',{hpPct:.3,dmgPct:.3,slots:-1},'+30% health and damage, but one unit slot fewer.'],['arch_eagle','n','Eagle Eye',{crit:.1,vis:.1},'+10% crit chance. See 10% farther.']]],
  spell:[
    [['spell_fireball','a','Fireball',{unlock:'fireball'},'Active skill: hurl a ball of fire that bursts over a wide area.'],['spell_nova','a','Frost Nova',{unlock:'nova'},'Active skill: a freezing burst that hurts and slows every enemy around you.']],
    [['spell_clarity','s','Clarity',{mp:20}],['spell_flow','s','Flow',{mpRegen:.35}]],
    [['spell_inferno','a','Inferno',{fireballR:.5,fireballDmg:.3,novaR:.3},'Fireball bursts 50% wider and burns 30% hotter; Frost Nova reaches 30% farther.'],['spell_study','s','Spell Study',{sk:{spell:2},mpPct:.1}]],
    [['spell_surge','k','Arcane Surge',{mpPct:.6,mpRegen:1,hpPct:-.2},'+60% mana and double mana regeneration, but 20% less health.'],['spell_mind','n','Keen Mind',{attr:{int:2},mp:20,sp:10},'+2 Intellect, +20 mana, +10 stamina.']]],
  fist:[
    [['fist_knuckles','n','Bare Knuckles',{fistPct:.15},'Your bare-handed blows land 15% harder.'],['fist_third','a','Third Blow',{combo3:1},'Your combo ends in a finisher: a third, heavier blow.']],
    [['fist_shins','n','Iron Shins',{kick:.4,hp:8},'Your kick lands 40% harder and throws them back farther. +8 health.'],['fist_grapple','n','Grappler',{grabCd:.3,grabDown:.2},'You grapple 30% more often, and a throw puts them down more surely.']],
    [['fist_stun','n','Stunning Finisher',{combo3:1,fin:'stun'},'A third blow, the finisher, that stuns 60% longer and barely pushes.'],['fist_quick','s','Quick Fists',{fistCd:-.1}]],
    [['fist_open','k','Open Hand',{fistPct:.35,fistCd:-.1,dr:-.1},'Bare-handed blows land 35% harder and 10% quicker, but you take 10% more damage.'],['fist_hide','n','Brawler’s Hide',{dr:.08,hp:20},'Take 8% less damage. +20 health.']]],
  athl:[
    [['athl_end','s','Endurance',{sp:20}],['athl_acro','n','Acrobat',{dodgeCost:.4,dodgeCd:.3},'Dodge rolls cost 40% less stamina and recover 30% faster.']],
    [['athl_fleet','n','Fleet Foot',{spd:.1,travel:.08},'Move 10% faster in battle and 8% faster on the map.'],['athl_wind','s','Second Wind',{spRegen:.3,sp:10}]],
    [['athl_agi','s','Agility',{attr:{agi:2}}],['athl_slip','n','Slippery',{perk:'slippery'},'+15% to get away as a battle is lost, and easier to slip out of a cage.']]],
  lead:[
    [['lead_cry','a','War Cry',{unlock:'cry'},'Active skill: nearby troops hit harder and move faster; enemies flinch.'],['lead_follow','s','Followers',{slots:1}]],
    [['lead_banner','a','War Banner',{unlock:'banner'},'Active skill: plant your banner; troops near it take 25% less damage.'],['lead_bearer','n','Banner Bearer',{tHp:.08,morale:5},'Troops get +8% health. Morale never falls below 5 more.']],
    [['lead_hymn','a','Battle Hymn',{cryDur:4,cryR:.4,cryStun:.4},'War Cry lasts 4 seconds longer, reaches 40% farther and makes enemies flinch longer.'],['lead_standard','a','Standard Bearer',{bannerDur:4,bannerR:.4},'War Banner lasts 4 seconds longer and covers 40% more ground.']],
    [['lead_warlord','k','Warlord',{tHp:.15,tDmg:.15,dmgPct:-.25},'Your troops get +15% health and damage, but you deal 25% less.'],['lead_general','n','Quartermaster General',{sk:{lead:1},slots:1},'+1 Leadership, +1 unit slot.']]],
  tact:[
    [['tact_strat','n','Strategist',{sk:{tact:1},loot:.1},'+1 Tactics. Take 10% more gold from battles.'],['tact_drill','s','Veteran Drill',{tDmg:.06}]],
    [['tact_command','n','Field Command',{morale:5,tHp:.05},'Morale never falls below 5 more. Troops get +5% health.'],['tact_spoils','s','Spoils',{loot:.15}]],
    [['tact_yard','n','Drill Yard',{tDmg:.06,tHp:.06},'Troops deal 6% more damage and have 6% more health.'],['tact_cha','s','Charisma',{attr:{cha:2}}]]],
  med:[
    [['med_surgeon','n','Field Surgeon',{sk:{med:1},regen:.5},'+1 Medicine. Heal 0.5 health a second in battle.'],['med_heal','a','Healing Light',{unlock:'heal'},'Active skill: mend your wounds and those of the troops near you.']],
    [['med_renew','a','Renewal',{healDmg:.5,healCd:.3},'Healing Light heals 50% more and recovers 30% faster.'],['med_herbs','s','Herbalist',{sk:{med:2}}]],
    [['med_medic','s','Battle Medic',{regen:1}],['med_fire','n','Inner Fire',{mp:20,sp:15},'+20 mana and +15 stamina.']]],
  eng:[
    [['eng_siege','s','Siegecraft',{sk:{eng:2}}],['eng_sapper','n','Sapper',{sk:{eng:1},dmgPct:.05},'+1 Engineering: siege camps build faster. +5% damage.']],
    [['eng_drill','n','Drillmaster',{perk:'drill',train:.1},'Training troops costs about half as much.'],['eng_logist','s','Logistics',{food:.1}]],
    [['eng_master','s','Master Builder',{sk:{eng:3}}],['eng_int','s','Intellect',{attr:{int:2}}]]],
  pers:[
    [['pers_silver','n','Silver Tongue',{perk:'silver',hire:.05},'Hiring troops costs 25% less. Captors are easier to talk round.'],['pers_cha','s','Charisma',{attr:{cha:2}}]],
    [['pers_old','n','Old Soldier',{perk:'oldsoldier'},'Taken captive, you are treated better: a smaller ransom and fine, a piece less from your bag, half the service.'],['pers_warden','n','Warden',{perk:'warden',prison:2},'Hold 8 more prisoners.']],
    [['pers_envoy','s','Envoy',{sk:{pers:2,trade:1}}],['pers_captor','s','Captor',{prison:4}]]],
  scout:[
    [['scout_eye','n','Scout’s Eye',{sk:{scout:1},vis:.15},'+1 Scouting. See 15% farther.'],['scout_keen','s','Keen Eyes',{vis:.1}]],
    [['scout_vanish','n','Vanish',{perk:'vanish'},'+15% to get away when you flee in forest, hills or at night.'],['scout_track','s','Tracker',{sk:{scout:1,hunt:1}}]],
    [['scout_march','n','Forced March',{perk:'forced'},'Your band travels 15% faster, and eats 20% more.'],['scout_far','s','Far Sight',{vis:.15,sk:{scout:1}}]]],
  ride:[
    [['ride_horse','s','Horseman',{travel:.05}],['ride_agi','s','Agility',{attr:{agi:2}}]],
    [['ride_charge','s','Mounted Pace',{spd:.08}],['ride_end','s','Rider’s Endurance',{sp:15}]],
    [['ride_road','s','Long Road',{travel:.08}],['ride_saddle','s','Saddle Hardened',{hp:15}]]],
  wood:[
    [['wood_path','n','Pathfinder',{perk:'path',travel:.05},'Forest and hills slow you half as much.'],['wood_forest','s','Forester',{sk:{wood:2}}]],
    [['wood_man','s','Woodsman',{travel:.05,sk:{wood:1}}],['wood_bark','s','Bark Skin',{hp:10,dr:.03}]],
    [['wood_stride','s','Ranger’s Stride',{spd:.05,travel:.05}],['wood_wild','s','Wildwood',{sk:{wood:2},vis:.05}]]],
  hunt:[
    [['hunt_trap','s','Trapper',{sk:{hunt:2}}],['hunt_butcher','s','Butcher',{food:.05}]],
    [['hunt_stalk','s','Stalker',{crit:.03,sk:{hunt:1}}],['hunt_fur','s','Furrier',{sk:{hunt:2}}]],
    [['hunt_master','s','Master Hunter',{sk:{hunt:3}}],['hunt_slayer','s','Beastslayer',{dmgPct:.05}]]],
  surv:[
    [['surv_quarter','n','Quartermaster',{perk:'quarter',food:.1},'Your band eats a third less food.'],['surv_hardy','s','Hardy',{hp:10}]],
    [['surv_forage','s','Forager',{food:.1}],['surv_weather','s','Weathered',{sk:{surv:2}}]],
    [['surv_iron','s','Iron Constitution',{regen:.5,hp:10}],['surv_wander','s','Wanderer',{travel:.05,sk:{surv:1}}]]],
  trade:[
    [['trade_haggle','s','Haggler',{sk:{trade:1}}],['trade_coin','s','Coin Sense',{loot:.05}]],
    [['trade_purse','s','Silver Purse',{hire:.05}],['trade_prince','s','Merchant Prince',{sk:{trade:2}}]],
    [['trade_baron','s','Trade Baron',{sk:{trade:3}}],['trade_lender','s','Moneylender',{loot:.1}]]],
  stew:[
    [['stew_reeve','s','Reeve',{sk:{stew:1}}],['stew_order','s','Steward’s Order',{food:.05}]],
    [['stew_tax','s','Tax Collector',{sk:{stew:2}}],['stew_stores','s','Keeper of Stores',{food:.08}]],
    [['stew_lord','s','Lord’s Steward',{sk:{stew:3}}],['stew_pay','s','Garrison Pay',{tHp:.05}]]]};
/* the nodes, by id: prof, tier, the other of its pair (pair). Each past begins with its origin (a node of no tree: its small head
   start: what its old attributes gave, attr, as their bonuses); your race its own (r_<race>, never on P.tree: state.js tmOf, from
   data/races.js attr); a companion, a lord or a chieftain with 'start' (nothing) */
const TREE={start:{id:'start',n:'Start',t:'start',m:{},links:[],d:'Where a companion, a lord or a chieftain begins: nothing yet.'}};
const ORIGINS={
  soldier:{n:'Soldier',m:{attr:{str:3},hp:10}},
  guard:{n:'Guard',m:{attr:{str:1,cha:1},slots:1,block:.03}},
  woodcutter:{n:'Woodcutter',m:{attr:{str:2},hp:8,sp:10}},
  exile:{n:'Exile',m:{attr:{agi:2},sk:{archery:1},vis:.05}},
  apprentice:{n:'Apprentice',m:{attr:{int:1,agi:1},mp:5,sp:5,sk:{med:1}}},
  hedge:{n:'Hedge Mage',m:{attr:{int:2},mp:10,sk:{spell:1}}},
  merchant:{n:'Merchant',m:{attr:{cha:2},hire:.05,sk:{trade:1}}},
  nobody:{n:'Nobody',m:{sp:10}}
};
const originOf=bg=>'o_'+(ORIGINS[bg]?bg:'soldier');
(()=>{
  for(const prof in PROF_TREE){PROF_TREE[prof].forEach((pair,tier)=>pair.forEach(([id,t,n,m,d],i)=>{
    TREE[id]={id,t,n,m:nodeMods(m),d:d||'',prof,tier,pair:pair[1-i][0],links:[]}}))}
  for(const bg in ORIGINS){const O=ORIGINS[bg];TREE['o_'+bg]={id:'o_'+bg,t:'origin',bg,n:O.n,m:nodeMods(O.m),links:[],d:''}}
  for(const r in RACES)TREE['r_'+r]={id:'r_'+r,t:'race',n:RACES[r].n,m:nodeMods({attr:RACES[r].attr}),links:[],d:''}
  // describe the small nodes from their effects
  for(const id in TREE){const N=TREE[id];if(!N.d)N.d=(N.t==='origin'?'Where a '+N.n.toLowerCase()+' begins. ':'')+describeNode(N.m)}
})();
// (a node's effects with an old attribute's made into its bonuses, attr gone)
function nodeMods(m){if(!m.attr)return m;const o={...m};delete o.attr;return attrMods(m.attr,o)}
function describeNode(m){
  const L={hp:'+{} health',dmg:'+{} damage',reach:'+{} reach',sp:'+{} stamina',mp:'+{} mana',slots:'+{} unit slot',prison:'+{} prisoners',morale:'+{} minimum morale',
    hpPct:'{%} health',dmgPct:'{%} damage',cd:'{%} swing time',spd:'{%} battle speed',crit:'{%} crit chance',block:'{%} less blocked damage',dr:'{%} less damage taken',
    mpPct:'{%} mana',mpRegen:'{%} mana regeneration',spRegen:'{%} stamina regeneration',travel:'{%} travel speed',vis:'{%} vision',tHp:'{%} troop health',tDmg:'{%} troop damage',food:'{%} less food eaten',
    hire:'{%} cheaper hiring',train:'{%} cheaper training',loot:'{%} battle gold',fistCd:'{%} bare-handed swing time',regen:'+{} health per second'};
  const out=[];
  if(m.learn)out.push(Math.round(m.learn*100)+'% faster learning of this proficiency');
  if(m.sk)for(const k in m.sk)out.push('+'+m.sk[k]+' '+SKILLS[k].n);
  for(const k in L)if(m[k]){const v=m[k],pc=Math.round(v*100);out.push(L[k].replace('{}',v).replace('{%}',(pc>0?'+':'')+pc+'%'))}
  return out.join(', ')+'.';
}
