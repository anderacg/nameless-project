'use strict';
/* ---------- state ---------- */
const mkSkills=()=>Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{lv:0,xp:0}]));
const makeRuntimeState=()=>({mode:'title',modal:true,paused:false,speed:1,day:1,clock:0,cam:{x:0,y:0},mouse:{x:VW/2,y:VH/2,in:false,type:'mouse'},keys:{},encCool:0,lastTown:null,town:null,enc:null,scene:null,msgs:[],rankSeen:0,hudT:0,shake:0});
const makePlayerState=()=>({x:0,y:0,tx:null,ty:null,gold:0,troops:{},army:{nextId:1,groups:[]},morale:80,renown:0,level:1,xp:0,bonus:0,stuck:0,dir:1,bg:'',
  attr:{str:2,agi:2,int:2,cha:2},pts:0,sk:mkSkills(),apt:{},perks:[],perkPend:0,prisoners:{},comps:{},fac:null,hostile:{},race:'human',hp:null,sp:null,mp:null,tree:['start'],origin:null,tp:0,slots:Array(10).fill(null),quests:[],jobs:{},qid:0,rep:{},honor:{},gear:emptyGear(),inv:Array(INV_SIZE).fill(null),stay:null,txp:{},fin:null,captives:[],wounded:{},woundedGroups:[],siege:null,raid:null,fiefWeek:0,recruits:{},recN:0});
const G=makeRuntimeState(),P=makePlayerState();
let bandits=[],B=null;

const troopCount=()=>sum(P.troops);
const compCount=()=>Object.keys(P.comps).length;
const woundedN=()=>sum(P.wounded||{});
// riders in your band (their horses want feed and their wages are higher)
const mountedN=()=>Object.keys(P.troops).reduce((a,k)=>a+(ST[k]&&ST[k].mounted?P.troops[k]:0),0);
const partySize=()=>troopCount()+compCount()+woundedN();
const prisonerCount=()=>sum(P.prisoners);
// the sum of one effect over your talents (the wiki page has no tree, hence the guard)
// what a skill tree gives: yours (tm), or any character's (tmOf: o is its record, with its own tree)
const tmOf=(o,k)=>typeof TREE==='undefined'?0:(o.tree||[]).reduce((a,id)=>a+(TREE[id]&&TREE[id].m[k]||0),0);
const tm=k=>tmOf(P,k);
const treeSkOf=(o,k)=>typeof TREE==='undefined'?0:(o.tree||[]).reduce((a,id)=>a+(TREE[id]&&TREE[id].m.sk&&TREE[id].m.sk[k]||0),0);
const treeSk=k=>treeSkOf(P,k);
// perks: the old picks, or the talent notables that grant them
const has=p=>P.perks.includes(p)||typeof TREE!=='undefined'&&(P.tree||[]).some(id=>TREE[id]&&TREE[id].m.perk===p);
const roleOf=r=>Object.keys(P.comps).find(id=>P.comps[id].role===r);
// a companion in a role adds their own discipline: 2, and a third of their Scouting (scout) or Medicine (surgeon)
const roleBonus=k=>{const id=k==='scout'?roleOf('scout'):k==='med'?roleOf('surgeon'):null;return id&&(typeof compInBand!=='function'||compInBand(id))?2+Math.floor((typeof compSkill==='function'?compSkill(id,k):0)/3):0};
// sum of one stat over the hero's equipped gear
const gm=k=>{let a=0;for(const key in P.gear){const id=P.gear[key];if(!id||!ITEMS[id])continue;if(MOUNT_KEYS.includes(key)&&!P.gear.mount)continue;
  const I=ITEMS[id];let v=I.m[k]||0;if(key==='offhand'&&I.slot==='weapon'&&k==='dmg')v*=.5;a+=v}return a+tm(k)};
// what you hold: main and off hand, and the grip that makes (dual, shield, two-handed, or one-handed)
const mainI=()=>P.gear.weapon?ITEMS[P.gear.weapon]:null,offI=()=>P.gear.offhand?ITEMS[P.gear.offhand]:null;
function grip(){const m=mainI(),o=offI();if(o&&o.slot==='weapon')return 'dual';if(o&&o.base==='shield')return 'shield';if(m&&(m.hand==='two'||m.hand==='hybrid'&&!o))return 'two';return 'one'}
const hybridTwo=()=>{const m=mainI();return !!m&&m.hand==='hybrid'&&!offI()};
// the melee discipline of your grip: Two-Handed for a two-handed weapon or a hybrid held in both hands, else One-Handed
const meleeSk=()=>{const m=mainI();return m&&!m.kind&&(m.hand==='two'||hybridTwo())?'twoh':'oneh'};
const gearSkill=k=>Object.values(P.gear).reduce((a,id)=>a+(id&&ITEMS[id].m.sk&&ITEMS[id].m.sk[k]||0),0);
// the ridden mount, and the ground it crosses at full speed
const mountDef=()=>P.gear.mount?ITEMS[P.gear.mount]:null;
const mountIgn=()=>mountDef()?mountDef().ign:[];
const skill=k=>P.sk[k].lv+roleBonus(k)+gearSkill(k)+treeSk(k);
const partyCap=()=>Math.max(3,Math.round((8+P.level*3+Math.floor(P.renown/25)+skill('lead')+Math.floor(P.attr.cha/2)+tm('cap'))*(1+tm('capPct'))));
const partyRoom=()=>partyCap()-partySize();// negative while over capacity; callers decide whether a transfer is allowed
const prisonCap=()=>2+skill('lead')+(has('warden')?6:0)+tm('prison');
const eatPerDay=()=>Math.ceil((partySize()+mountedN()+prisonerCount()+1)/4*(has('forced')?1.2:1)*(has('quarter')?.75:1)*(roleOf('quarter')?.75:1)*(1-tm('food')));
const vis=()=>(110+8*skill('scout'))*visMulAt(P.x,P.y)*(1+gm('vis'));
const rankName=()=>P.renown>=250?'Lord':P.renown>=100?'Warlord':P.renown>=30?'Captain':'Wanderer';
// what your weapon does: melee (the combo), ranged (a bow) or magic (a staff)
const heroKind=()=>{const w=P.gear&&P.gear.weapon&&ITEMS[P.gear.weapon];return w&&w.kind||'melee'};
// your hero's reach with what they carry: a bow as a bowman's, a crossbow as an arbalester's, a staff or wand as a caster's
const heroRange=()=>{const k=heroKind();if(k==='melee')return 0;if(k==='magic')return 160;const w=P.gear.weapon&&ITEMS[P.gear.weapon];return w&&w.shot&&w.shot.flat?200:400};
const heroStats=()=>({n:'You',hp:Math.round((50+10*P.level+4*P.attr.str+gm('hp'))*(1+tm('hpPct'))),dmg:(8+2*P.level+P.bonus+P.attr.str*.5+skill(meleeSk())*.6+gm('dmg'))*(1+tm('dmgPct'))*(hybridTwo()?1.2:1),spd:(48+P.attr.agi*2)*(1+gm('spd')),reach:21+skill(meleeSk())*.4+gm('reach')+(hybridTwo()?4:0),range:heroRange(),magic:heroKind()==='magic',dt:itemDt(P.gear.weapon)||(heroKind()==='magic'?'arcane':'blunt'),armor:itemArmor(P.gear.body)||'none',race:P.race,cd:.45*(1-P.attr.agi*.03)*(1+gm('cd')),tags:Object.values(P.gear).map(id=>id&&ITEMS[id].tag).filter(Boolean)});
// your disciplines rise by use (leaders.js: as every leader's do, faster with the attribute behind them and your knacks)
function train(k,n){leaderOf(P).train(k,n)}
function mood(ev){
  for(const id of Object.keys(P.comps)){
    const d=COMPS[id].react[ev];if(!d)continue;const c=P.comps[id];c.ap=clamp(c.ap+d,-10,10);
    if(c.ap<=-5){delete P.comps[id];log(COMPS[id].n+' has had enough and leaves your band.','bad')}
    else log(COMPS[id].n+(d>0?' approves.':' disapproves.'),d>0?'good':'bad');
  }
}
const apName=a=>a>=5?'Loyal':a>=0?'Content':a>-3?'Uneasy':'Angry';

// a message: into the log (L shows the last 150, with the day) and onto the screen, where it fades after a few seconds
function log(m,cls){G.msgs.push({m,cls,day:G.day});if(G.msgs.length>150)G.msgs.shift();const el=$('#log');if(!el)return;
  const d=document.createElement('div');if(cls)d.className=cls;d.innerHTML=m;el.appendChild(d);while(el.children.length>5)el.firstChild.remove();
  setTimeout(()=>d.classList.add('gone'),6500);setTimeout(()=>d.remove(),7400)}
