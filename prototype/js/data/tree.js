'use strict';
/* ---------- data: the skill tree ---------- */
// One point per level. Start in the centre and allocate outward: a node can be taken once it touches one you have.
// Four branches (Might up, Finesse right, Arcana down, Command left), joined by hybrid nodes between them.
// Node kinds: s small, n notable, k keystone (a big trade-off), a ability (unlocks or upgrades an active skill).
// Effects (m): attr {str…} adds to attributes; sk {skill: levels}; perk: an old perk this node grants; unlock: an active skill.
// Stat keys: hp, hpPct, dmg, dmgPct, reach, cd (swing time, negative is faster), spd, crit, block, dr (less damage taken), regen,
// sp, mp, mpPct, mpRegen, spRegen, travel, vis, slots, cap, capPct, tHp, tDmg, food, wage, hire, train, prison, morale, loot,
// and per ability: <id>R (radius), <id>Dmg, <id>Cost, <id>Cd, <id>Stun, <id>Dur; dodgeCost, dodgeCd.
const TREE_BRANCHES=[
  {k:'might',n:'Might',a:'str',ang:-90,col:'#e0605a',
    spine:[['s','Strength',{attr:{str:2}}],['a','Whirlwind',{unlock:'whirl',hp:5},'Active skill: spin and hit every enemy around you. +5 health.'],['n','Brute Force',{dmgPct:.15,sk:{oneh:1}},'Your blows land 15% harder. +1 One-Handed.'],
      ['s','Strength',{attr:{str:2}}],['s','Toughness',{hp:12}],['n','Shieldwall',{perk:'shieldwall',block:.05},'Blocked hits deal only 10% damage.'],
      ['k','Berserker’s Oath',{dmgPct:.35,dr:-.15},'+35% damage, but you take 15% more damage.']],
    sideA:[['a','Leap Slam',{unlock:'leap'},'Learn Leap Slam (E): leap to the cursor and stun where you land.'],['a','Earthshaker',{leapR:.5,leapStun:.5},'Leap Slam lands in a 50% wider circle and stuns longer.'],['a','Quick Leap',{leapCd:.4},'Leap Slam recovers 40% faster.']],
    sideC:[['a','Earthquake',{unlock:'quake'},'Active skill: slam the ground, hurting and staggering every enemy around you.'],['a','Aftershock',{quakeR:.4,quakeStun:.4},'Earthquake reaches 40% farther and staggers longer.'],['n','Iron Hide',{dr:.05,hp:20},'Take 5% less damage. +20 health.']],
    sideD:[['s','Siegecraft',{sk:{eng:2}}],['n','Sapper',{sk:{eng:2},dmgPct:.05},'+2 Engineering: siege camps build faster. +5% damage.']],
    sideB:[['n','Thick Skin',{dr:.08,hp:15},'Take 8% less damage. +15 health.'],['n','Bloodlust',{perk:'bloodlust'},'Your swings crit twice as often.']]},
  {k:'finesse',n:'Finesse',a:'agi',ang:0,col:'#78c474',
    spine:[['s','Agility',{attr:{agi:2}}],['s','Quick Hands',{cd:-.05}],['n','Fleet Foot',{spd:.1,travel:.08},'Move 10% faster in battle and 8% faster on the map.'],
      ['s','Agility',{attr:{agi:2}}],['s','Endurance',{sp:20}],['n','Duelist',{crit:.08,reach:2},'+8% crit chance and a little more reach.'],
      ['k','Lone Wolf',{hpPct:.3,dmgPct:.3,capPct:-.4},'+30% health and damage, but you can lead 40% fewer troops.']],
    sideA:[['a','Cyclone',{whirlR:.4},'Whirlwind reaches 40% farther.'],['a','Bladestorm',{whirlDmg:.4},'Whirlwind hits 40% harder.'],['a','Second Wind',{whirlCost:.4},'Whirlwind costs 40% less.']],
    sideC:[['a','Blade Dash',{unlock:'dash'},'Active skill: dash through enemies, cutting each one you pass.'],['a','Swift Dash',{dashCd:.35,dashDmg:.3},'Blade Dash recovers 35% faster and cuts 30% deeper.'],['a','Rain of Arrows',{unlock:'volley'},'Active skill (needs a bow): loose a volley that falls around your aim.'],['a','Arrow Storm',{volleyDmg:.4,volleyR:.3},'Rain of Arrows hits 40% harder over a wider area.']],
    sideD:[['s','Steady Aim',{sk:{archery:1},crit:.02}],['s','Fleet Runner',{sk:{athl:1},sp:10}],['n','Marksman',{sk:{archery:2},vis:.05},'+2 Archery. See a little farther.']],
    sideB:[['n','Acrobat',{dodgeCost:.4,dodgeCd:.3},'Dodge rolls cost 40% less stamina and recover 30% faster.'],['n','Pathfinder',{perk:'path',travel:.05},'Forest and hills slow you half as much.'],
      ['n','Hawkeye',{perk:'guide',vis:.05},'Shows your arrow\u2019s path and where it will land while you draw a bow.'],
      ['n','Vanish',{perk:'vanish'},'+15% to get away when you flee in forest, hills or at night.'],['n','Forced March',{perk:'forced'},'Your band travels 15% faster, and eats 20% more.']]},
  {k:'arcana',n:'Arcana',a:'int',ang:90,col:'#5a8fe8',
    spine:[['s','Intellect',{attr:{int:2}}],['s','Clarity',{mp:15}],['n','Field Surgeon',{sk:{med:1},regen:.5},'+1 Medicine. Heal 0.5 health a second in battle.'],
      ['s','Intellect',{attr:{int:2}}],['s','Flow',{mpRegen:.25}],['n','Strategist',{sk:{tact:2},loot:.1},'+2 Tactics. Take 10% more gold from battles.'],
      ['k','Arcane Surge',{mpPct:.6,mpRegen:1,hpPct:-.2},'+60% mana and double mana regeneration, but 20% less health.']],
    sideA:[['n','Quartermaster',{perk:'quarter',food:.1},'Your band eats a third less food.'],['n','Scout’s Eye',{sk:{scout:1},vis:.15},'+1 Scouting. See 15% farther.']],
    sideC:[['a','Fireball',{unlock:'fireball'},'Active skill: hurl a ball of fire that bursts over a wide area.'],['a','Inferno',{fireballR:.5,fireballDmg:.3},'Fireball bursts 50% wider and burns 30% hotter.'],['a','Frost Nova',{unlock:'nova'},'Active skill: a freezing burst that hurts and slows every enemy around you.'],['a','Deep Freeze',{novaDur:2,novaR:.3},'Frost Nova slows 2 seconds longer and reaches 30% farther.']],
    sideD:[['a','Healing Light',{unlock:'heal'},'Active skill: mend your wounds and those of the troops near you.'],['a','Renewal',{healDmg:.5,healCd:.3},'Healing Light heals 50% more and recovers 30% faster.'],['s','Spell Study',{sk:{spell:2}}]],
    sideB:[['n','Warden',{perk:'warden',prison:2},'Hold 8 more prisoners.'],['n','Inner Fire',{mp:20,sp:15},'+20 mana and +15 stamina.']]},
  {k:'command',n:'Command',a:'cha',ang:180,col:'#e8b94a',
    spine:[['s','Charisma',{attr:{cha:2}}],['s','Followers',{cap:1}],['n','Silver Tongue',{perk:'silver',hire:.05},'Hiring troops costs 25% less.'],
      ['s','Charisma',{attr:{cha:2}}],['s','Followers',{cap:2}],['n','Drillmaster',{perk:'drill',train:.1},'Training troops costs about half as much.'],
      ['k','Warlord',{tHp:.15,tDmg:.15,dmgPct:-.25},'Your troops get +15% health and damage, but you deal 25% less.']],
    sideA:[['a','War Cry',{unlock:'cry'},'Learn War Cry (R): nearby troops hit harder and move faster; enemies flinch.'],['a','Battle Hymn',{cryDur:4,cryR:.4},'War Cry lasts 4 seconds longer and reaches 40% farther.'],['a','Fearsome Roar',{cryStun:.8},'War Cry makes enemies flinch twice as long.']],
    sideC:[['a','War Banner',{unlock:'banner'},'Active skill: plant your banner; troops near it take 25% less damage.'],['a','Standard Bearer',{bannerDur:4,bannerR:.4},'War Banner lasts 4 seconds longer and covers 40% more ground.'],['n','Logistics',{food:.1,cap:2},'Your band eats 10% less. +2 party size.']],
    sideD:[['s','Drill Yard',{tDmg:.04}],['n','Quartermaster General',{sk:{lead:1},cap:2},'+1 Leadership, +2 party size.'],['n','Rearguard',{perk:'rearguard'},'Caught fleeing, you lose half as many men.']],
    sideB:[['n','Banner Bearer',{tHp:.08,morale:5},'Troops get +8% health. Morale never falls below 5 more.'],['n','Veteran Drill',{tDmg:.08,sk:{lead:1}},'Troops deal 8% more damage. +1 Leadership.']]}
];
// hybrid nodes between neighbouring branches
const TREE_HYBRIDS=[['might','finesse','Warrior’s Poise',{attr:{str:1,agi:1},hp:5}],['finesse','arcana','Keen Mind',{attr:{agi:1,int:1},sp:10}],
  ['arcana','command','Sage Counsel',{attr:{int:1,cha:1},mp:10}],['command','might','Captain’s Grit',{attr:{cha:1,str:1},cap:1}]];
// build the nodes with positions: spines run out from the centre; side chains branch off the 3rd and 5th spine node
// The middle is the Crossroads, a node like any other that joins the four paths. Each past starts from its own origin
// on a ring around the Crossroads (at), joined to the first node of its path or, between two paths, of both (to); already learned, with a small bonus.
const TREE={start:{id:'start',n:'Crossroads',t:'start',m:{hp:5,mp:5},x:0,y:0,links:[],d:''}};
const ORIGINS={
  soldier:{n:'Soldier',at:[-53,-54],to:['might0'],m:{attr:{str:1},hp:10}},
  guard:{n:'Guard',at:[-127,-23],to:['command0','might0'],m:{cap:1,block:.03}},
  woodcutter:{n:'Woodcutter',at:[53,-54],to:['might0','finesse0'],m:{hp:8,sp:10}},
  exile:{n:'Exile',at:[127,-23],to:['finesse0'],m:{sk:{archery:1},vis:.05}},
  apprentice:{n:'Apprentice',at:[127,23],to:['finesse0','arcana0'],m:{mp:5,sp:5,sk:{med:1}}},
  hedge:{n:'Hedge Mage',at:[53,54],to:['arcana0'],m:{mp:10,sk:{spell:1}}},
  merchant:{n:'Merchant',at:[-53,54],to:['arcana0','command0'],m:{hire:.05,sk:{trade:1}}}
};
const originOf=bg=>'o_'+(ORIGINS[bg]?bg:'soldier');
(()=>{
  const link=(a,b)=>{TREE[a].links.push(b);TREE[b].links.push(a)},YS=.62,XS=1.45;
  const add=(id,spec,x,y,br)=>{const [t,n,m,d]=spec;TREE[id]={id,t,n,m,x:Math.round(x*XS),y:Math.round(y*YS),br,links:[],d:d||''}};
  for(const B of TREE_BRANCHES){
    const a=B.ang*Math.PI/180,ux=Math.cos(a),uy=Math.sin(a),px=-uy,py=ux,R=[62,120,178,236,294,352,418];
    // labels go where nothing else is: notables opposite their side chain, keystones past the end, side nodes outward
    B.spine.forEach((s,i)=>{const id=B.k+i;add(id,s,ux*R[i],uy*R[i],B.k);link(i?B.k+(i-1):'start',id);TREE[id].lab=i===2?[px,py]:i===5?[-px,-py]:[ux,uy]});
    const side=(list,base,sgn,tag)=>list.forEach((s,i)=>{const id=B.k+tag+i,r=R[base]+i*46,o=sgn*(70+i*42);add(id,s,ux*r+px*o,uy*r+py*o,B.k);link(i?B.k+tag+(i-1):B.k+base,id);TREE[id].lab=[sgn*px,sgn*py]});
    // side chains: A and D off the 3rd spine node (either side), B and C off the 5th (either side)
    side(B.sideA,2,-1,'a');side(B.sideB,4,1,'b');side(B.sideC||[],4,-1,'c');side(B.sideD||[],2,1,'d');
  }
  for(const [p,q,n,m] of TREE_HYBRIDS){const A=TREE[p+'2'],C=TREE[q+'2'],id='h_'+p+'_'+q;
    TREE[id]={id,t:'s',n,m,x:Math.round((A.x+C.x)/2*1.25),y:Math.round((A.y+C.y)/2*1.25),br:'hybrid',links:[],d:''};link(p+'2',id);link(id,q+'2')}
  for(const bg in ORIGINS){const O=ORIGINS[bg],id='o_'+bg,[x,y]=O.at;
    TREE[id]={id,t:'origin',bg,n:O.n,m:O.m,x,y,br:null,links:[],d:'',lab:Math.abs(x)>90?[Math.sign(x),0]:[0,Math.sign(y)]};O.to.forEach(n=>link(id,n))}
  // describe the small nodes from their effects
  for(const id in TREE){const N=TREE[id];if(!N.d)N.d=(N.t==='origin'?'Where a '+N.n.toLowerCase()+' begins. ':N.t==='start'?'Joins the four paths. ':'')+describeNode(N.m)}
})();
function describeNode(m){
  const L={hp:'+{} health',dmg:'+{} damage',reach:'+{} reach',sp:'+{} stamina',mp:'+{} mana',cap:'+{} party size',prison:'+{} prisoners',morale:'+{} minimum morale',
    hpPct:'{%} health',dmgPct:'{%} damage',cd:'{%} swing time',spd:'{%} battle speed',crit:'{%} crit chance',block:'{%} less blocked damage',dr:'{%} less damage taken',
    mpPct:'{%} mana',mpRegen:'{%} mana regeneration',travel:'{%} travel speed',vis:'{%} vision',tHp:'{%} troop health',tDmg:'{%} troop damage',food:'{%} less food eaten',
    hire:'{%} cheaper hiring',train:'{%} cheaper training',loot:'{%} battle gold',capPct:'{%} party size',regen:'+{} health per second'};
  const out=[];
  if(m.attr)for(const a in m.attr)out.push('+'+m.attr[a]+' '+ATTRS[a][0]);
  if(m.sk)for(const k in m.sk)out.push('+'+m.sk[k]+' '+SKILLS[k].n);
  for(const k in L)if(m[k]){const v=m[k],pc=Math.round(v*100);out.push(L[k].replace('{}',v).replace('{%}',(pc>0?'+':'')+pc+'%'))}
  return out.join(', ')+'.';
}
