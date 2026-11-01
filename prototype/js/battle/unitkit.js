'use strict';
/* ---------- a unit's kit (doc/UNIT_KITS_DESIGN.md §8; its tables: data/kits.js): its loadout, worked out once from its record (a
   roster group, an AI army's, or a battle group's rank alone: battle/rankskills.js battleRec) by its kinds, race, type, rank, picks
   and bought upgrades. It gives:
   - traits (TRAITS, by its numbers), stances (every one it has) and its stance slots (slots: its kind's own, Q W E);
   - its kinds (kitKinds: by class, shot and tags; a scout's, its kind's and scout's) and their mastery menu (menu);
   - skills in slot order (skills, Z X C V B: its kinds' defaults, then its mastery's unlocks, then its tech tree's (Buffs.skills;
     an AI lord's archers Fire arrows from his level: KITS.aiFire), five at most (KITS.max), each {id, from, idle});
   - perks (its mastery's passives: data/kits.js MASTERY), each mastery pick's gain on a skill or stance (up), its rank's stats (§6:
     dmg, hp, aim, mor, vig; prof, step 1's);
   - its picks (picks: its own, an AI's made by its kinds' order (aiOf); old saves' read as the new menu's, KITS.old), kept ones (an
     upgrade's, those its new menu has), and what it may pick next (opts).
   Step 1's (RANKS.statsOnly off): its ladders' rungs reached (rungs: the foot drills only on foot), the skills on them each at the
   rank it comes (rank; a kept ladder's, had: 0), then the rest its soldiers qualify for.
   UnitKit.of(rec): kept on the record, made again when its type, rank, mastery, picks, ladders or upgrades change. The unit card, the
   order bar, the AI captains (through groupHasAbility), the battle (rankskills.js) and the Army window read it ---------- */
const KIT_OF=new WeakMap();
// (a soldier's kinds (§8): by his class, his shot and his tags; a scout's his kind's and the scouts')
function kitKinds(u){const s=u.s,k=s.magic?'mage':s.range?(s.mounted?'horsebow':s.flat?'xbow':shotKind(u)==='bow'?'bow':'thrower'):s.charge||s.mounted?'cav':unitClass(s)==='spear'?'spear':'foot';return isScout(u.type)?[k,'scout']:[k]}
// (a pick's id as the new menu reads it: an old save's (KITS.old))
const kitPickId=x=>RANKS.mastery5&&KITS.old[x]||x;
class UnitKit{
  constructor(rec){
    const t=rec.type,s=ST[t]||{},u={s,type:t,team:0},L=rec.learned;let ln=0;if(L)for(const k in L)ln+=L[k];
    // (what it was made from: holds)
    Object.assign(this,{type:t,s,rank:rankOf(rec),mx:masteryOf(rec),pk:rec.picks,pn:rec.picks?.length|0,kp:rec.keptPicks,kn:rec.keptPicks?.length|0,lr:L,ln,bf:rec.buffs,bn:rec.buffs?.length|0,ai:aiOf(rec)});
    this.traits=traitsOf(s);
    this.stances=STANCE_ORDER.filter(id=>STANCES[id].who(u));
    this.slots=KITS.slots.filter(id=>this.stances.includes(id)).slice(0,KIT_KEYS.now.stance.length);
    this.role=rankRole(u);this.ladders=rankLadders(rec);this.prof=rankProf(rec);
    if(!RANKS.statsOnly){this.ladder(rec,u);this.stats={dmg:this.prof,hp:this.prof,aim:this.prof,mor:0,vig:0};return}
    // (its kinds, their menu; its picks: yours, or an AI's by its kinds' order; kept: an upgrade's its menu still has, the rest idle)
    this.kinds=kitKinds(u);this.menu=[...new Set(this.kinds.flatMap(k=>KITS.kinds[k].menu))];
    const own=this.ai?this.aiPicks(rec):(rec.picks||[]).map(kitPickId).filter(id=>MASTERY[id]),kept=(rec.keptPicks||[]).map(kitPickId).filter(id=>MASTERY[id]);
    this.picks=own;this.kept=kept.filter(id=>this.menu.includes(id));this.idle=kept.filter(id=>!this.menu.includes(id));
    const all=[...own,...this.kept];this.count={};for(const x of all)this.count[x]=(this.count[x]||0)+1;
    this.perks=[...new Set(all)].filter(id=>MASTERY[id].perk).map(id=>({id,...MASTERY[id]}));this.foot=this.perks;this.ride=this.perks.filter(r=>!r.foot);
    // (its skills: its kinds', its mastery's, its tech tree's (an AI lord's archers, Fire arrows from his level), five at most)
    const sk=[],add=(id,from)=>{if(UNIT_SKILLS[id]&&!sk.some(x=>x.id===id))sk.push({id,from,rank:0,idle:from==='tech'&&!UNIT_SKILLS[id].who(u)})};
    for(const k of this.kinds)for(const id of KITS.kinds[k].skills)add(id==='lunge'&&!KITS.brace?'brace':id,'kind');
    for(const id of all)if(MASTERY[id].sk)add(MASTERY[id].sk,'mastery');
    if(KITS.cap){for(const id of Buffs.skills(rec.buffs,t,s))add(id,'tech');if(this.ai&&this.ai.lv>=KITS.aiFire&&UNIT_SKILLS.fire.who(u))add('fire','tech')}
    this.skills=KITS.cap?sk.slice(0,KITS.max):sk;
    // (its rank's stats (§6), and its drills')
    const P=RANKS.per,r=Math.max(0,this.rank-1),dr=this.count.drill||0,D=RANKS.drill;
    this.stats={dmg:r*P.dmg+dr*D.dmg,hp:r*P.hp+dr*D.hp,aim:r*P.aim+dr*D.aim,mor:r*P.mor,vig:r*P.vig};this.prof=this.stats.dmg}
  // (step 1's: its ladders' rungs reached and their skills, each at its rank, then those its soldiers qualify for)
  ladder(rec,u){
    this.count={};for(const x of [...(rec.picks||[]),...(rec.keptPicks||[])])this.count[x]=(this.count[x]||0)+1;
    // (its rungs reached, its own ladder first; on a horse, its foot drills none)
    this.foot=[];for(const [k,n] of this.ladders){const R=KITS.ladders[k];if(R)for(let i=0;i<Math.min(n,R.length);i++)this.foot.push(R[i])}
    this.ride=this.foot.filter(r=>!r.foot);
    // (its ladders' skills and perks: its own kind's each at its rung's rank, a kept one's those it had)
    const sk=[],pk=[],own=this.role;
    for(const [k,n] of this.ladders){const R=KITS.ladders[k];if(!R)continue;R.forEach((r,i)=>{if(k!==own&&i>=n||!(r.ab||r.id))return;(r.ab?sk:pk).push({id:r.ab||r.id,rank:k===own?i+1:0,foot:!!r.foot,rung:r})})}
    const laddered=this.ladders.some(([k])=>KITS.ladders[k]);
    for(const id of SKILL_ORDER)if(!STANCE_SKILLS.has(id)&&!UNIT_SKILLS[id].kit&&!sk.some(x=>x.id===id)&&(!laddered||!onLadder(id))&&UNIT_SKILLS[id].who(u))sk.push({id,rank:0,foot:false});
    this.skills=sk;this.perks=pk}
  // (an AI unit's picks (§9): its levels' worth of its kinds' order, then drills)
  aiPicks(rec){const order=[...new Set(this.kinds.flatMap(k=>KITS.kinds[k].ai))],n=masteryOf(rec);return Array.from({length:n},(_,i)=>order[i]||'drill')}
  // (still this record's: its type, rank, mastery, picks, ladders and upgrades as when made)
  holds(rec){const L=rec.learned;let ln=0;if(L)for(const k in L)ln+=L[k];
    return this.type===rec.type&&this.rank===rankOf(rec)&&this.mx===masteryOf(rec)&&this.pk===rec.picks&&this.pn===(rec.picks?.length|0)&&this.kp===rec.keptPicks&&this.kn===(rec.keptPicks?.length|0)&&this.lr===L&&this.ln===ln&&this.bf===rec.buffs&&this.bn===(rec.buffs?.length|0)&&this.ai===aiOf(rec)}
  static of(rec){let k=KIT_OF.get(rec);if(!k||!k.holds(rec))KIT_OF.set(rec,k=new UnitKit(rec));return k}
  // its rungs (perks) it has (rode: on a horse); a perk of them by its id; a mastery's gain on a skill, stance or perk of its (each
  // pick of it, kept ones too, times its by's (step 1: its up's) key)
  rungs(rode){return rode?this.ride:this.foot}
  perk(id,rode){return this.rungs(rode).find(r=>r.id===id)||null}
  up(id,key,rode){if(!RANKS.statsOnly){const k=this.rungs(rode).find(x=>(x.id||x.ab)===id);return k?.up?.[key]?(this.count[id]||0)*k.up[key]:0}
    let n=0;for(const p in this.count){const M=MASTERY[p];if(M.up===id&&M.by[key]&&!(rode&&M.foot))n+=this.count[p]*M.by[key]}return n}
  // (has it a skill, not idle; a skill or perk its rank has not reached yet: step 1's)
  has(id){return this.skills.some(x=>x.id===id&&!x.idle)}
  locked(x){return x.rank>this.rank}
  // (a pick's name in its menu (a kind's own word for it: kn))
  pickName(id){const M=MASTERY[id];return M?(this.kinds||[]).map(k=>M.kn?.[k]).find(Boolean)||M.n:id}
  // what it may pick next (§7): its menu's options, a skill only while it has room (KITS.max) and one it lacks, the rest once
  // unless again (a step each time)
  opts(){if(!RANKS.statsOnly||!RANKS.mastery5)return [];const room=this.skills.length<KITS.max||!KITS.cap,all=[...this.picks,...this.kept];
    return this.menu.filter(id=>{const M=MASTERY[id];return M.again||!all.includes(id)&&(!M.sk||room&&!this.has(M.sk))})}
}
// a battle group's kit (none for characters or beasts: on no kit)
function groupKit(g){const u=g&&abilityTroops(g)[0],rec=u&&battleRec(g);return rec&&!ladderless(u)?UnitKit.of(rec):null}
// a battle group's skill bar: its kit's skills in their slots (locked: step 1, its rank short of one; idle: a bought one its men
// cannot use), then any other it has now (a dismounted rider's, say: still yours, past the slots with no key)
function groupSlots(g){const K=groupKit(g),out=K?K.skills.filter(x=>!x.idle).map(x=>({id:x.id,rank:x.rank,locked:K.locked(x)})):[];
  for(const id of SKILL_ORDER)if(!STANCE_SKILLS.has(id)&&!out.some(x=>x.id===id)&&groupHasAbility(g,id))out.push({id,rank:0,locked:false});return out}
// a battle group's stance slots (§7b: Q W E): its kind's own stances, those a soldier of it takes, in their slot order
function groupStances(g){const m=abilityTroops(g);return KITS.slots.filter(id=>m.some(u=>STANCES[id].who(u))).slice(0,KIT_KEYS.now.stance.length)}
