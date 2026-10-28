'use strict';
/* ---------- state ---------- */
const mkSkills=()=>Object.fromEntries(Object.keys(SKILLS).map(k=>[k,{lv:0,xp:0}]));
const makeRuntimeState=()=>({mode:'title',modal:true,paused:false,speed:1,day:1,clock:0,cam:{x:0,y:0},mouse:{x:VW/2,y:VH/2,in:false,type:'mouse'},keys:{},encCool:0,lastTown:null,town:null,enc:null,scene:null,msgs:[],rankSeen:0,hudT:0,shake:0});
const makePlayerState=()=>({x:0,y:0,tx:null,ty:null,gold:0,troops:{},army:{nextId:1,groups:[]},morale:100,renown:0,level:1,xp:0,bonus:0,stuck:0,dir:1,bg:'',
  attr:{str:2,agi:2,int:2,cha:2},pts:0,sk:mkSkills(),apt:{},perks:[],perkPend:0,prisoners:{},comps:{},fac:null,hostile:{},race:'human',hp:null,sp:null,mp:null,tree:['start'],origin:null,tp:0,slots:Array(10).fill(null),quests:[],jobs:{},qid:0,rep:{},honor:{},gear:emptyGear(),inv:Array(INV_SIZE).fill(null),stay:null,txp:{},fin:null,captives:[],wounded:{},woundedGroups:[],siege:null,raid:null,fiefWeek:0,recruits:{},recN:0});
const G=makeRuntimeState(),P=makePlayerState();
let bandits=[],B=null;

/* your numbers: methods of your band (P: parties.js PlayerParty), under their older names here */
const troopCount=()=>P.troopCount();
const compCount=()=>P.compCount();
const woundedN=()=>P.woundedCount();
const mountedN=()=>P.mountedCount();
const partySize=()=>P.headcount();
const prisonerCount=()=>P.prisonerCount();
// what a skill tree gives: any character's (tmOf, treeSkOf: o is its record, with its own tree; the wiki page has no tree, hence
// the guard), or yours (tm, treeSk)
const tmOf=(o,k)=>typeof TREE==='undefined'?0:(o.tree||[]).reduce((a,id)=>a+(TREE[id]&&TREE[id].m[k]||0),0);
const tm=k=>P.treeMod(k);
const treeSkOf=(o,k)=>typeof TREE==='undefined'?0:(o.tree||[]).reduce((a,id)=>a+(TREE[id]&&TREE[id].m.sk&&TREE[id].m.sk[k]||0),0);
const treeSk=k=>P.treeSkill(k);
const has=p=>P.hasPerk(p);
const roleOf=r=>Object.keys(P.comps).find(id=>P.comps[id].role===r);
const roleBonus=k=>P.roleBonus(k);
const gm=k=>P.gearMod(k);
// what you hold: main and off hand, and the grip that makes (dual, shield, two-handed, or one-handed)
const mainI=()=>P.gear.weapon?ITEMS[P.gear.weapon]:null,offI=()=>P.gear.offhand?ITEMS[P.gear.offhand]:null;
function grip(){const m=mainI(),o=offI();if(o&&o.slot==='weapon')return 'dual';if(o&&o.base==='shield')return 'shield';if(m&&(m.hand==='two'||m.hand==='hybrid'&&!o))return 'two';return 'one'}
const hybridTwo=()=>{const m=mainI();return !!m&&m.hand==='hybrid'&&!offI()};
// the melee discipline of your grip: Two-Handed for a two-handed weapon or a hybrid held in both hands, else One-Handed
const meleeSk=()=>{const m=mainI();return m&&!m.kind&&(m.hand==='two'||hybridTwo())?'twoh':'oneh'};
const gearSkill=k=>P.gearSkill(k);
// the ridden mount, and the ground it crosses at full speed
const mountDef=()=>P.gear.mount?ITEMS[P.gear.mount]:null;
const mountIgn=()=>mountDef()?mountDef().ign:[];
const skill=k=>P.skill(k);
const partyCap=()=>P.cap();
const partyRoom=()=>P.room();
const prisonCap=()=>P.prisonCap();
const eatPerDay=()=>P.eatPerDay();
const vis=()=>P.sight();
const rankName=()=>P.renown>=250?'Lord':P.renown>=100?'Warlord':P.renown>=30?'Captain':'Wanderer';
// what your weapon does: melee (the combo), ranged (a bow) or magic (a staff)
const heroKind=()=>{const w=P.gear&&P.gear.weapon&&ITEMS[P.gear.weapon];return w&&w.kind||'melee'};
// your hero's reach with what they carry: a bow as a bowman's, a crossbow as an arbalester's, a staff or wand as a caster's
const heroRange=()=>{const k=heroKind();if(k==='melee')return 0;if(k==='magic')return 160;const w=P.gear.weapon&&ITEMS[P.gear.weapon];return w&&w.shot&&w.shot.flat?200:400};
const heroStats=()=>P.heroStats();
// your disciplines rise by use (leaders.js: as every leader's do, faster with the attribute behind them and your knacks)
function train(k,n){leaderOf(P).train(k,n)}
function mood(ev){
  for(const id of Object.keys(P.comps)){
    const d=COMPS[id].react[ev];if(!d)continue;const c=P.comps[id],was=c.ap;c.ap=clamp(c.ap+d,-10,10);c.deed=[ev,d,G.day];// (the last deed they cared about: their talk, story/conversation.js)
    if(c.ap<=-5){delete P.comps[id];log(COMPS[id].n+' has had enough and leaves your band.','bad','band')}
    else{log(COMPS[id].n+(d>0?' approves.':' disapproves.'),d>0?'good':'bad','band');const w=DIALOGUE.comps[id]?.warn;if(w&&was>-3&&c.ap<=-3)log(w,'bad','band')}
  }
}
const apName=a=>a>=5?'Loyal':a>=0?'Content':a>-3?'Uneasy':'Angry';

/* the chronicle (G.msgs): lasting events of the game, kept for good (the owner, 2026-10-23) and saved with it (core/save.js); the
   Journal's Chronicle shows it (L: ui/chronicle.js). Each a small record: m (its text, the game's own HTML), day, and only
   when given cls (its tone), kind (one of kinds, for the Chronicle's filters; none: under All only) and ref (what it links to: a
   quest's or story's journal key, 'q12', 't3'; a rumour's news id, 'n40') and at (the day it happened, when you heard of it
   later: a rider's news, world/worldlog.js). page: the messages one Chronicle page shows; budget:
   the most its save part may be (JSON characters), past which the oldest of the spare kinds (your band's, and of no kind) go */
const CHRONICLE={kinds:['war','rumour','band','story'],page:100,budget:1.5e6,spare:['band','']};
// Durable events belong in log(); operational feedback belongs in toast(). Recognize old control spam without dropping stories.
const JOURNAL_TRANSIENT={kinds:['action','system','command'],text:[
  /^Your band (?:hurries:|slows to its marching pace|is too exhausted to hurry|fills its waterskins:|makes for clear ground to camp|makes camp\.|breaks camp\.|drinks (?:its liquor first|water first again))/,
  /^You (?:fill your waterskins:|stop filling your waterskins:|equip the |follow .+ at a distance\.|stop (?:placing|following)\.)/,
  /^(?:By road(?: off)?:|Tile grid (?:on|off)|Sound (?:on|off)|Auto skills (?:on|off)|Game saved(?:\b|\()|Could not save\.|Exit the battle test before |You can only save while |Into the bag:|No clear ground to camp here\.|Marching tires your band\.)/,
  /^(?:The lines meet in |The crowd roars\.|Deploy your band:|The battle begins\.|Group \d+: )/,
  /: (?:at a run|at a walk|attack-move(?: to the line)?|form up there|hold|charge|advance|line|loose|wedge)\.$/
]};
function journalKeep(r){
  if(JOURNAL_TRANSIENT.kinds.includes(r.kind))return false;
  if(r.ref||['story','rumour','war'].includes(r.kind))return true;
  const text=String(r.m||'').replace(/<[^>]*>/g,'');return !JOURNAL_TRANSIENT.text.some(p=>p.test(text));
}
const journalPrune=()=>G.msgs=G.msgs.filter(journalKeep);
// a message: into the chronicle and onto the screen (toast); at: the day it happened, if not today
function log(m,cls,kind,ref,at){const r={m,day:G.day};if(cls)r.cls=cls;if(kind)r.kind=kind;if(ref!=null)r.ref=ref;if(at!=null&&at!==G.day)r.at=at;if(journalKeep(r)){if(typeof KNOWLEDGE!=='undefined')KNOWLEDGE.hear(m);G.msgs.push(r)}toast(m,cls)}
// a line onto the screen only, where it fades after a few seconds (the chronicle keeps what happened; "Welcome back" is no event)
function toast(m,cls){const el=$('#log');if(!el)return;
  const d=document.createElement('div');if(cls)d.className=cls;d.innerHTML=m;el.appendChild(d);while(el.children.length>5)el.firstChild.remove();
  setTimeout(()=>d.classList.add('gone'),6500);setTimeout(()=>d.remove(),7400)}
