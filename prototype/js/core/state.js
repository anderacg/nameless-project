'use strict';
/* ---------- state ---------- */
const G={mode:'title',modal:true,paused:false,speed:1,day:1,clock:0,cam:{x:0,y:0},mouse:{x:VW/2,y:VH/2,in:false,type:'mouse'},keys:{},encCool:0,lastTown:null,town:null,enc:null,msgs:[],rankSeen:0,hudT:0,shake:0};
const mkSkills=()=>Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{lv:0,xp:0}]));
const P={x:0,y:0,tx:null,ty:null,gold:0,troops:{},morale:80,renown:0,level:1,xp:0,bonus:0,stuck:0,dir:1,bg:'',
  attr:{str:2,agi:2,int:2,cha:2},pts:0,sk:mkSkills(),perks:[],perkPend:0,prisoners:{},comps:{},fac:null,hostile:{},race:'human',hp:null,sp:null,mp:null,tree:['start'],origin:null,tp:0,slots:Array(10).fill(null),quests:[],jobs:{},qid:0,rep:{},honor:{},gear:emptyGear(),inv:Array(INV_SIZE).fill(null)};
let bandits=[],B=null;

const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const troopCount=()=>sum(P.troops);
const compCount=()=>Object.keys(P.comps).length;
const partySize=()=>troopCount()+compCount();
const prisonerCount=()=>sum(P.prisoners);
// the sum of one effect over your talents (the wiki page has no tree, hence the guard)
const tm=k=>typeof TREE==='undefined'?0:(P.tree||[]).reduce((a,id)=>a+(TREE[id]&&TREE[id].m[k]||0),0);
const treeSk=k=>typeof TREE==='undefined'?0:(P.tree||[]).reduce((a,id)=>a+(TREE[id]&&TREE[id].m.sk&&TREE[id].m.sk[k]||0),0);
// perks: the old picks, or the talent notables that grant them
const has=p=>P.perks.includes(p)||typeof TREE!=='undefined'&&(P.tree||[]).some(id=>TREE[id]&&TREE[id].m.perk===p);
const roleOf=r=>Object.keys(P.comps).find(id=>P.comps[id].role===r);
const roleBonus=k=>(k==='scout'&&roleOf('scout')||k==='med'&&roleOf('surgeon'))?2:0;
// sum of one stat over the hero's equipped gear
const gm=k=>{let a=0;for(const key in P.gear){const id=P.gear[key];if(!id||!ITEMS[id])continue;if(MOUNT_KEYS.includes(key)&&!P.gear.mount)continue;
  const I=ITEMS[id];let v=I.m[k]||0;if(key==='offhand'&&I.slot==='weapon'&&k==='dmg')v*=.5;a+=v}return a+tm(k)};
// what you hold: main and off hand, and the grip that makes (dual, shield, two-handed, or one-handed)
const mainI=()=>P.gear.weapon?ITEMS[P.gear.weapon]:null,offI=()=>P.gear.offhand?ITEMS[P.gear.offhand]:null;
function grip(){const m=mainI(),o=offI();if(o&&o.slot==='weapon')return 'dual';if(o&&o.base==='shield')return 'shield';if(m&&(m.hand==='two'||m.hand==='hybrid'&&!o))return 'two';return 'one'}
const hybridTwo=()=>{const m=mainI();return !!m&&m.hand==='hybrid'&&!offI()};
const gearSkill=k=>Object.values(P.gear).reduce((a,id)=>a+(id&&ITEMS[id].m.sk&&ITEMS[id].m.sk[k]||0),0);
// the ridden mount, and the ground it crosses at full speed
const mountDef=()=>P.gear.mount?ITEMS[P.gear.mount]:null;
const mountIgn=()=>mountDef()?mountDef().ign:[];
const skill=k=>P.sk[k].lv+roleBonus(k)+gearSkill(k)+treeSk(k);
const partyCap=()=>Math.max(3,Math.round((8+P.level*3+Math.floor(P.renown/25)+skill('lead')+Math.floor(P.attr.cha/2)+tm('cap'))*(1+tm('capPct'))));
const prisonCap=()=>2+skill('lead')+(has('warden')?6:0)+tm('prison');
const eatPerDay=()=>Math.ceil((partySize()+prisonerCount()+1)/4*(has('quarter')?.75:1)*(roleOf('quarter')?.75:1)*(1-tm('food')));
const hireCost=k=>Math.round(HIRE[k]*(has('silver')?.8:1)*(1-.02*P.attr.cha)*(ST[k].race&&ST[k].race===P.race?.85:1)*(1-tm('hire')));
const trainCost=to=>Math.round((ST[to].tier>=3?45:25)*(has('drill')?.6:1)*(1-tm('train')));
const vis=()=>(110+8*skill('scout'))*visMulAt(P.x,P.y)*(1+gm('vis'));
const rankName=()=>P.renown>=250?'Lord':P.renown>=100?'Warlord':P.renown>=30?'Captain':'Wanderer';
// what your weapon does: melee (the combo), ranged (a bow) or magic (a staff)
const heroKind=()=>{const w=P.gear&&P.gear.weapon&&ITEMS[P.gear.weapon];return w&&w.kind||'melee'};
const heroStats=()=>({n:'You',hp:Math.round((50+10*P.level+4*P.attr.str+gm('hp'))*(1+tm('hpPct'))),dmg:(8+2*P.level+P.bonus+P.attr.str*.5+skill('oneh')*.6+gm('dmg'))*(1+tm('dmgPct'))*(hybridTwo()?1.2:1),spd:(48+P.attr.agi*2)*(1+gm('spd')),reach:21+skill('oneh')*.4+gm('reach')+(hybridTwo()?4:0),range:heroKind()==='melee'?0:130,magic:heroKind()==='magic',cd:.45*(1-P.attr.agi*.03)*(1+gm('cd')),tags:Object.values(P.gear).map(id=>id&&ITEMS[id].tag).filter(Boolean)});
function train(k,n){
  const s=P.sk[k];if(s.lv>=10||!(n>0))return;
  s.xp+=n*(1+P.attr[SKILLS[k].a]*.1);
  while(s.lv<10&&s.xp>=(s.lv+1)*20){s.xp-=(s.lv+1)*20;s.lv++;log(SKILLS[k].n+' rises to '+s.lv+'.','gold')}
  if(s.lv>=10)s.xp=0;
}
function mood(ev){
  for(const id of Object.keys(P.comps)){
    const d=COMPS[id].react[ev];if(!d)continue;const c=P.comps[id];c.ap=clamp(c.ap+d,-10,10);
    if(c.ap<=-5){delete P.comps[id];log(COMPS[id].n+' has had enough and leaves your band.','bad')}
    else log(COMPS[id].n+(d>0?' approves.':' disapproves.'),d>0?'good':'bad');
  }
}
const apName=a=>a>=5?'Loyal':a>=0?'Content':a>-3?'Uneasy':'Angry';

function log(m,cls){G.msgs.push({m,cls});if(G.msgs.length>40)G.msgs.shift();const el=$('#log');el.innerHTML=G.msgs.slice(-4).map(x=>'<div'+(x.cls?' class="'+x.cls+'"':'')+'>'+x.m+'</div>').join('')}
