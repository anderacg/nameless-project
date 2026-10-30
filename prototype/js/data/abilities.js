'use strict';
/* ---------- data: abilities, one list for every unit (characters.js: Unit.traits, Unit.actives; battle/abilities.js uses them).
   kind 'active': cast in battle, paid in breath (sp) and mana (mp), then a cooldown (cd). Every character learns each on its own
   skill tree (learn: its node) and puts it in a slot (characters.js). melee: not for a fighter with a bow; needs: 'bow' (and arrows); magic: spell power makes it stronger.
   kind 'trait': what a unit is, always on: a troop's by its kind (has: from its numbers and tags), a monster's by its ability.
   d: what it does (a function where it reads the game's numbers). ---------- */
const ABILITIES={
  whirl:{kind:'active',n:'Whirlwind',learn:'might1',melee:true,cd:6,mp:15,sp:20,d:'Spin and hit every enemy around you for 1.3× damage.'},
  leap:{kind:'active',n:'Leap Slam',learn:'mighta0',melee:true,cd:9,mp:20,sp:25,d:'Leap onto a knot of enemies and stun every one where you land.'},
  quake:{kind:'active',n:'Earthquake',learn:'mightc0',cd:12,mp:20,sp:20,d:'Slam the ground: hurt and stagger every enemy around you.'},
  dash:{kind:'active',n:'Blade Dash',learn:'finessec0',melee:true,cd:7,mp:0,sp:25,d:'Dash toward your aim, cutting every enemy you pass. You cannot be hit while dashing.'},
  volley:{kind:'active',n:'Rain of Arrows',learn:'finessec2',cd:14,mp:10,sp:15,needs:'bow',d:'Loose eight arrows that fall around your aim. Needs a bow and 4 arrows.'},
  fireball:{kind:'active',n:'Fireball',learn:'arcanac0',cd:8,mp:25,sp:0,magic:true,d:'Hurl a ball of fire that bursts over a wide area. Ignores armor.'},
  nova:{kind:'active',n:'Frost Nova',learn:'arcanac2',cd:14,mp:25,sp:0,magic:true,d:'A freezing burst: hurts and slows every enemy around you.'},
  heal:{kind:'active',n:'Healing Light',learn:'arcanad0',cd:20,mp:30,sp:0,magic:true,d:'Mend 30% of your health, and 20% of your nearby troops’.'},
  cry:{kind:'active',n:'War Cry',learn:'commanda0',cd:18,mp:30,sp:0,d:'Nearby troops hit 30% harder and move 25% faster for 6 seconds. Nearby enemies flinch.'},
  banner:{kind:'active',n:'War Banner',learn:'commandc0',cd:24,mp:20,sp:10,d:'Plant your banner: troops near it take 25% less damage for 8 seconds.'},
  // traits: troops'
  brace:{kind:'trait',n:'Set spears',has:s=>unitClass(s)==='spear',d:'Braced against a charge on its front: riders who hit it there get no charge bonus and no shock. Its thrusts carry on into the enemy behind for half damage.'},
  charge:{kind:'trait',n:'Cavalry charge',has:s=>unitClass(s)==='cav',d:()=>'Its first blow after a full run hits '+Math.round(CHARGE.cav*100)+'% harder, knocks the one it hits back and shakes their morale.'},
  runcharge:{kind:'trait',n:'Running charge',has:s=>unitClass(s)==='foot'&&!s.range,d:()=>'Running in, its first blow hits up to '+Math.round(CHARGE.foot*100)+'% harder.'},
  shield:{kind:'trait',n:'Shield',has:s=>tagsOf(s).includes('shield')&&!s.mounted,d:'Takes 30% less from arrows, bolts and javelins that hit it from the front (not from spells).'},
  heavy:{kind:'trait',n:'Heavy armour',has:s=>tagsOf(s).includes('heavy'),d:'Plate armour: slashing blows and arrows do little; crushing blows, armour-piercing ones and magic still bite.'},
  pierce:{kind:'trait',n:'Armour-piercing',has:s=>tagsOf(s).includes('pierce'),d:'Armour stops only half as much of its blows (heavy armour, hides and scales included).'},
  shock:{kind:'trait',n:'Shock troops',has:s=>tagsOf(s).includes('shock'),d:'+40% against archers and casters.'},
  mobile:{kind:'trait',n:'Shoots on the move',has:s=>!!s.range&&!s.magic&&(tagsOf(s).includes('mobile')||s.race==='elf'),d:'Draws and looses while moving, skirmishing or marching; other shooters must stand still to shoot.'},
  ward:{kind:'trait',n:'Warded',has:s=>tagsOf(s).includes('ward'),d:'Takes 40% less from magic.'},
  bolts:{kind:'trait',n:'Magic bolts',has:s=>!!s.magic,d:'Slow bolts that splash, ignore armour (+25% against heavy), fly through trees and are only half blocked.'},
  elvenaim:{kind:'trait',n:'Elven aim',has:s=>!!s.bow&&s.race==='elf',d:'Outranges everyone, and its arrows scatter half as much.'},
  longshot:{kind:'trait',n:'Longshot',has:s=>!!s.bow&&s.race!=='elf',d:'Bows outrange every other weapon: arrows lob over the lines.'},
  direct:{kind:'trait',n:'Direct fire',has:s=>!!s.flat,d:'Bolts fly flat and fast instead of lobbing: they hit the first in their way.'},
  few:{kind:'trait',n:'Few missiles',has:s=>!!s.ammo&&s.ammo<12,d:s=>'Only '+(s?s.ammo:'a few')+' to throw; then it fights hand to hand.'},
  wedge:{kind:'trait',n:'Wedge',has:s=>!!s.charge,d:'Formed cavalry: +5% charge at 6 riders, +2.5 percentage points per additional rider, capped at +30% at 16. Scattered and routing riders do not count.'},
  horsebow:{kind:'trait',n:'Horse archer',has:s=>!!(s.mounted&&s.range),d:'Shoots from the saddle: fast enough to keep away from foot and loose as it goes.'},
  shieldwall:{kind:'trait',n:'Shield wall',has:s=>tagsOf(s).includes('shield')&&!s.range&&!s.mounted&&!s.charge,d:'B toggles shield wall for eligible shield infantry. Nearby active, aligned shields provide 35% less frontal damage and 40% slower movement. Alone: personal shield blocking only. Charge/run lowers shields.'},
  // traits: monsters'
  pounce:{kind:'trait',n:'Pounce',has:s=>s.ability==='pounce',d:'Pounces on a fighter 24–110 px away for 1.6× damage, then waits 4.5 s.'},
  web:{kind:'trait',n:'Web',has:s=>s.ability==='web',d:'Spits webs (range 60) that halve the target’s speed for 2 s.'},
  regen:{kind:'trait',n:'Regenerate',has:s=>s.ability==='regen',d:'Regenerates 4 health per second.'},
  huge:{kind:'trait',n:'Huge',has:s=>!!s.big,d:'Takes up more room and ignores battleground rules.'}
};
const abilityText=(id,s)=>{const d=ABILITIES[id].d;return typeof d==='function'?d(s):d};
// a unit's traits (by its numbers)
const traitsOf=s=>Object.keys(ABILITIES).filter(id=>ABILITIES[id].kind==='trait'&&ABILITIES[id].has(s));
