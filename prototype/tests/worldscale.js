'use strict';
// World scale (data/world.js): the named distances, the one movement lever (moveStep) and the caps per size of map hold today's
// numbers exactly; every cap and site count reads the table (MAP_DENS, which grew them from the map's area, is gone); and none of
// the moved numbers is left written out in the files that now read the table.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,get=u=>{const x=new XMLHttpRequest();x.open('GET',u,false);x.send();return x.responseText};
 const S=t.WORLD_SCALE,D=t.DENSITY;
 // ---- the table: every moved number, at today's value
 const want={move:1,sight:{lord:90,band:95,monster:70,caravan:80,refugee:70},
  ai:{graceGap:24,dread:70,bandCamp:220,lairHunt:140,lairLeash:60,mythicRoam:[120,90],mythicScorch:200,gameLeash:50,herdLeash:24,penLeash:99,
   compFoes:90,compFlee:70,compBeat:[80,60],compTake:60,compDraft:120,folkNear:520,folkForget:120,folkBandit:70,folkFear:90,slipAway:40},
  spawn:{bandit:[220,260],monster:[180,240],monsterHold:64,mythic:200,critter:[120,200],critterHold:56},
  econ:{caravanNear:10,caravanFar:90,caravanCost:150,refuge:70,resRange:10,homeRange:24},
  law:{repNear:15,eventNear:15,siegeOutrage:20},land:{shelter:48,healNear:80,estateGuard:7,friendly:50,pacify:35},war:{front:60,raidLeash:80,siegeLeash:80},battle:{elfR:10,bridge:2}};
 ok(JSON.stringify(S)===JSON.stringify(want),'WORLD_SCALE holds every moved distance at today\'s value ('+Object.keys(S).join(', ')+')');
 const classic={bandits:30,camps:12,monsterStart:48,monsterCap:60,critterStart:96,critterCap:120,caravans:72,refugees:42,ships:30,sites:{cave:30,travelers:21,hideout:24,ruins:21,shrine:18}};
 ok(JSON.stringify(D.classic)===JSON.stringify(classic)&&t.density()===D.classic,'DENSITY.classic holds today\'s caps, and it is the one in use');
 // ---- every cap reads the table; the site kinds scattered at random are the table's, and none keeps a count of its own
 const C=D.classic,K=Object.keys(t.SITE_TYPES);
 ok(t.CARAVAN_CAP===C.caravans&&t.REFUGEE_CAP===C.refugees&&t.CRITTER_CAP===C.critterCap&&t.CRITTER_START===C.critterStart,'caravan, refugee and critter caps read the table');
 ok(C.bandits===t.BANDITS&&C.monsterCap===t.MONSTER_CAP&&C.monsterStart===t.MONSTER_START&&C.ships===t.SHIP_CAP&&C.camps===t.CAMP_SPOTS.length,'bandits, monsters and ships read the table, and its camps are the map\'s spots');
 ok(JSON.stringify(K.filter(k=>!t.SITE_TYPES[k].spots))===JSON.stringify(Object.keys(C.sites))&&K.every(k=>!('count' in t.SITE_TYPES[k])),'the table counts every kind of site but the camps, and SITE_TYPES keeps no counts');
 {const core=get('js/core/core.js'),left=['js/core/core.js','js/world/sites.js','wiki.html','tests/sites.js'].filter(f=>/MAP_DENS|MAP_AREA/.test(get(f)));
  ok(!left.length&&!/BANDITS|MONSTER_CAP|MONSTER_START/.test(core)&&(0,eval)('typeof MAP_DENS')==='undefined','MAP_DENS is retired: core.js grows no caps and nothing reads it'+(left.length?': '+left.join(', '):''))}
 ok(t.GRACE_GAP===S.ai.graceGap&&t.RES_RANGE===S.econ.resRange&&t.HOME_RANGE===S.econ.homeRange,'the old names (GRACE_GAP, RES_RANGE, HOME_RANGE) read the table');
 // ---- one movement lever: at move 1 a step is exactly pace x d
 const R=t.seeded(5);let same=true;for(let i=0;i<2000;i++){const px=R()*90,d=R()*.2;same=same&&t.moveStep(px,d)===px*d}
 ok(S.move===1&&same,'moveStep(pace, d) is exactly pace x d at move 1 (2000 samples)');
 // ---- no moved number left written out (the old expressions are gone; every step goes through moveStep)
 const gone={
  'world/brains.js':['const GRACE_GAP=24','this.sight(90)','this.sight(95)','this.sight(80)','o.y-l.y)<70','26*mul*d','16*d','12*d','.9*d','.75*d','dd<90','[1]<70','rint(-80,80)','rint(-60,60)','*d)'],
  'world/caravans.js':['MAP_DENS','>10&&','<90;','/150'],
  'world/sites.js':['MAP_DENS','count:'],
  'world/monsters.js':['initial?180:240','<64)','<140','70*hide','*d,hunt','>60)','<200)','rint(-120,120)','rint(-90,90)','*d)'],
  'data/critters.js':['MAP_DENS'],
  'world/critters.js':['initial?120:200','<56)','*d;walk','99:24):50','*d,ok'],
  'world/refugees.js':['MAP_DENS','d<70','70*hide','*d)'],
  'world/patrols.js':['/l,40)'],
  'world/folk.js':['FOLK_R','<70)','<90;','*d)'],
  'world/estates.js':['<60)','7*TILE'],
  'world/reputation.js':['15*TILE'],
  'world/events.js':['15*TILE'],
  'world/siege.js':['>80)','20*TILE'],
  'world/world.js':['initial?220:260','bd=220','<48)','>80)','<80)','travelMul()*d'],
  'data/economy.js':['RES_RANGE=10','HOME_RANGE=24']};
 const left=[];let reads=0;
 for(const f in gone){const src=get('js/'+f);if(/WORLD_SCALE|moveStep|density\(\)/.test(src))reads++;for(const s of gone[f])if(src.includes(s))left.push(f+': '+s)}
 ok(!left.length&&reads===Object.keys(gone).length,'the '+Object.keys(gone).length+' files read the table, with none of the moved numbers left in them'+(left.length?': '+left.join('; '):''));
 // (a step is pace * d: none left outside moveStep; critters.js keeps two, a herd's spot round its holding at distance d)
 const steps=Object.keys(gone).map(f=>[f,(get('js/'+f).match(/\*d\b/g)||[]).length]).filter(([f,n])=>n!==(f==='world/critters.js'?2:0));
 ok(!steps.length,'no step on the map is written as pace*d outside moveStep'+(steps.length?': '+steps.map(s=>s.join(' ')).join(', '):''));
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
