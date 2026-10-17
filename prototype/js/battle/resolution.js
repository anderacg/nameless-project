'use strict';
/* ---------- field results and campaign settlement ---------- */
// after a battle: Medicine brings some of the fallen straight back; of the rest, some live but are wounded (more with Medicine):
// they leave the ranks and ride with the band until they heal (woundedDay)
function heal(lost,groups){
  let saved=0,total=0,hurt=0;const ch=.07*skill('med'),wc=Math.min(.7,.25+.04*skill('med'));P.wounded=P.wounded||{};
  const rows=groups||Object.keys(lost).map(type=>({type,count:lost[type]}));
  for(const row of rows){const k=row.type,n=row.count;total+=n;for(let i=n;i>0;i--){if(Math.random()<ch){lost[k]--;row.count--;saved++;row.saved=(row.saved||0)+1}else if(ST[k]&&!ST[k].beast&&Math.random()<wc){P.wounded[k]=(P.wounded[k]||0)+1;hurt++;row.wounded=(row.wounded||0)+1;if(row.id){const wg=P.woundedGroups||(P.woundedGroups=[]),g=wg.find(g=>g.id===row.id&&g.type===k);if(g)g.count++;else wg.push({id:row.id,type:k,count:1})}}}}
  train('med',total*2);if(hurt)log(hurt+' of your fallen live, wounded: they ride with the band until they heal.','gold');return saved;
}
function takePrisoners(slain){
  let n=0;const pool=slain.filter(k=>ST[k].tier<4&&!ST[k].beast),want=Math.round(pool.length*.35);
  while(n<want&&pool.length&&prisonerCount()<prisonCap()){const k=pool.splice(rint(0,pool.length-1),1)[0];P.prisoners[k]=(P.prisoners[k]||0)+1;n++}
  return n;
}
// retreat: you withdrew from the battle ({caught}: the rearguard cut down), neither a victory nor a rout
/* the band's morale after a fight: its outcome (base), then how it went (a battle fought, not resolved): MOOD.loss for all of the
   band lost (a share of it, its share), up to MOOD.shaken more as the men ended shaken (their morale at the end against its
   start), MOOD.rout for an enemy broken and fled. A line for the summary: from what, to what, and why */
let BATTLE_MOOD=null;
const MOOD={loss:20,shaken:15,rout:3,retreat:8,renown:2,runDown:5};
function battleMood(base,why){
  const bm=BATTLE_MOOD;BATTLE_MOOD=null;why=why?[why]:[];let d=base;
  if(bm){if(bm.share>0){d-=MOOD.loss*bm.share;if(bm.share>=.2)why.push('heavy losses')}const sk=bm.shaken-1;if(sk<-.1){d+=MOOD.shaken*sk;why.push('the men shaken')}if(bm.broke){d+=MOOD.rout;why.push('the enemy broke and fled')}}
  const m0=P.morale;P.morale=clamp(P.morale+Math.round(d),0,100);
  return '<p class="'+(P.morale<m0?'bad':P.morale>m0?'good':'muted')+'">Your band\u2019s morale: '+Math.round(m0)+' \u2192 '+Math.round(P.morale)+(why.length?' ('+why.join(', ')+')':'')+'.</p>'}
// A short-lived coordinator carries the finished field into campaign settlement. It is never attached to saved state.
class BattleResolution{
  constructor(battle=null){this.battle=battle}
  finish(){
    const b=this.battle;
    this.primaryLossesApplied=!!b.primaryLossesApplied;
    const groupLosses=[];
    // Preserve the original settlement/medicine traversal; sort only the finished report for presentation.
    if(!b.opts.tournament)for(const g of Object.values(b.groups).filter(g=>g.player&&g.sourceGroupId)){
      const members=b.units.filter(u=>u.grp===g.id),fallen=members.filter(u=>u.hp<=0&&!u.left).length;
      groupLosses.push({id:g.sourceGroupId,type:g.type,name:g.name,start:members.length,count:fallen,saved:0,wounded:0,rearguard:0,
        slot:(b.playerOrder||Object.keys(b.groups)).indexOf(g.id)});
      const source=partyRoster(P).groups.find(s=>s.id===g.sourceGroupId);if(source){source.form=g.form;source.files=g.files}
    }
    if(!b.opts.tournament)for(const u of b.units)if(u.team===0&&!u.hero&&!u.comp&&!u.lord&&!u.leader&&(u.hp>0||u.left))(b.txp=b.txp||{})[u.type]=(b.txp[u.type]||0)+(u.xp||0)+TROOP_XP.fight+(b.win?TROOP_XP.win:0);
    const txp=b.txp||{},o=b.opts,win=b.win,retreat=!!b.retreat,caught=b.caught||0,got=b.withdrawn||0,standing=b.units.filter(u=>u.team===1&&u.hp>0).length,fallen=Object.values(b.lost).reduce((a,n)=>a+n,0);bbar.hidden=true;G.mode='dialog';lootStart();
    const lost=o.tournament?{}:b.lost,kills=b.kills,slain=b.slain,h=b.hero,X=b.hx;
    if(b.bestCombo>=3)log('Your longest chain of blows: '+b.bestCombo+' hits.');
    if(b.fired&&b.win&&ammoOf()){const back=invAdd('good',ammoOf(),Math.floor(b.fired*(.35+Math.random()*.2)));if(back)log('You gather '+back+' '+GOODS[ammoOf()].n.toLowerCase()+' from the field.')}
    // carry the hero's condition out of the fight; a knocked-out hero comes to at 10% health
    if(h.hp>0||h.left)P.hp=h.left?h.hpLeft:h.hp;else{P.hp=Math.max(1,Math.round(h.max*.1));log('You come to after the fight, badly wounded.','bad')}
    if(X){P.sp=X.sp;P.mp=X.mp}
    {const m=b.units.filter(u=>u.team===0&&!u.hero&&!u.lord&&!u.leader&&!u.comp&&u.mor0);
      BATTLE_MOOD=o.tournament||!m.length?null:{share:fallen/m.length,shaken:m.filter(u=>u.hp>0||u.left).reduce((a,u)=>a+clamp((u.rout?0:u.mor)/u.mor0,0,1),0)/Math.max(1,m.filter(u=>u.hp>0||u.left).length),broke:b.routed===1}}
    if(!o.tournament)this.characterReport=Object.values(b.groups).filter(g=>g.player&&!g.sourceGroupId).map(g=>{
      const u=b.units.find(u=>u.grp===g.id);return{id:g.id,name:g.name,status:u?.left?'Withdrawn':u?.hp>0?'Standing':'Wounded'};
    });
    B=null;updateHint();
    if(o.tournament){
      let html;if(win){P.gold+=45;P.renown+=6;gainXp(25);if(G.town)addRep(G.town.ref.name,8);html='<h2>Champion</h2><p>The crowd chants your name. You take <strong class="gold">45 gold</strong> and gain renown.</p>';log('You win the tournament.','good')}
      else{html='<h2>Beaten</h2><p>The champion takes your entry fee and sends you off with a bruised pride.</p>';log('You lose the tournament.','bad')}
      lootShow(html,null,0,'back-town');return;
    }
    this.conclude(win,lost,kills,false,slain,retreat&&{caught,got,standing,fallen,carried:h.hp<=0&&!h.left},txp,groupLosses);
  }
  conclude(win,lost,kills,auto,slain,retreat,txp,groupLosses){
    if(auto)BATTLE_MOOD=null;
    lootStart();const e=G.enc;if(e)reinfAfter(e,win);let html;const saved=heal(lost,groupLosses);
    if(groupLosses){for(const g of groupLosses)if(g.count)partyRoster(P).remove(g.type,g.count,g.id)}else applyLosses(lost);
    if(win){
      const O=ON_WIN[e.kind]||ON_WIN.party,big=!!O.big,res={gold:0,fame:O.fame};let bounty='';slain=slain||[];
      const beasts=slain.filter(k=>ST[k].beast).length;for(let i=0;i<kills-beasts;i++)res.gold+=rint(2,6);
      const furs=invAdd('good','furs',Math.floor(slain.filter(k=>k==='wolf').length/2));if(furs>0)bounty+=' You skin '+furs+' furs from the wolves.';
      if(big)res.gold+=25;if(auto)res.gold=Math.floor(res.gold*.8);res.gold=Math.round(res.gold*(1+tm('loot')));
      P.renown+=Math.ceil(kills*(big?1.5:1));const moodLine=battleMood(4,'victory');gainXp(kills*8+(big?30:0));
      if(troopCount()>0)train('lead',3+kills*.5);train('tact',auto?6:2);
      const taken=takePrisoners(slain),drop=O.drop&&O.drop();
      if(drop&&!invAdd('gear',drop,1))log('Your bag is full. You leave a '+ITEMS[drop].n+' behind.','bad');
      {const c=(e.kind==='party'||e.kind==='camp')&&e.ref&&e.ref.ld;if(c){captureChief(c);e.ref.ld=null;bounty+=' You take '+chiefLabel(c)+' captive: hand him over for '+bountyOf(c)+' gold, or let him go (Hero, Party).'}}
      bounty=(O.won(e,slain,res)||'')+bounty;
      P.gold+=res.gold;
      const fame=res.fame==null?Math.max(2,Math.round(kills/2)):res.fame;if(fame)repNear(P.x,P.y,fame);
      html='<h2>Victory</h2><p>You defeated '+(e.kind==='monster'?(kills>1?kills+' ':'the ')+MONSTERS[e.ref.id].n.toLowerCase():kills+' '+(e.kind==='lord'?'soldiers':'foes'))+(taken?' and took '+taken+' prisoner'+(taken>1?'s':''):'')+'.'+bounty+'</p>'+moodLine;
      log('Victory. +'+res.gold+' gold, renown now '+P.renown+'.','good');mood('win');
    }else if(retreat){
      // as fleeing on the map (fleeOdds): a fight you started you simply leave; else a race. Got away, they lose your trail for a
      // while; run down, your rearguard pays and you must face them again. The foes you slew stay dead either way.
      const o=e.ref;slain=slain||[];if(!this.primaryLossesApplied&&o&&(e.kind==='lord'||e.kind==='patrol'||e.kind==='party'))for(const k of slain){try{partyRemove(o,k,1)}catch(err){}}
      if(e.list)for(const k of slain){const i=e.list.indexOf(k);if(i>=0)e.list.splice(i,1)}
      mood('flee');if(kills)gainXp(kills*4);
      const od=fleeOdds(e),away=od.leave||od.ch>0&&Math.random()<od.ch,rear={};
      // (a retreat costs, as in Total War: the band's morale and your renown; run down, more)
      const moodLine=battleMood(-MOOD.retreat-(away?0:MOOD.runDown),away?'a retreat':'run down in the retreat');P.renown=Math.max(0,P.renown-MOOD.renown);
      if(away){if(o&&o.x!=null){const dx=P.x-o.x,dy=P.y-o.y,l=Math.hypot(dx,dy)||1;walk(P,dx/l,dy/l,40)}if(o&&e.kind!=='camp')o.cool=12}
      else{const n=P.size?Math.max(1,Math.round(P.size*.1*(has('rearguard')?.5:1))):0;
        const before=groupLosses&&new Map(partyRoster(P).groups.map(g=>[g.id,g.count]));
        Object.assign(rear,countsOf(P.removeAny(n)));for(const k in rear)lost[k]=(lost[k]||0)+rear[k];
        if(before){const after=new Map(partyRoster(P).groups.map(g=>[g.id,g.count]));for(const row of groupLosses)row.rearguard=(before.get(row.id)||0)-(after.get(row.id)||0)}
        e.noFlee=true;e.foes=[];e.allies=[];G.encAgain=e}
      const n=troopCount(),rn=Object.values(rear).reduce((a,x)=>a+x,0);
      html='<h2>'+(away?'Withdrawn':'Run down')+'</h2><p>'+(retreat.carried?'You fall in the fight, and your men carry you off the field. ':'')+'You pull your band out of the fight'+(kills?', leaving '+kills+' of them dead':'')+'. '+(retreat.caught?retreat.caught+' '+(retreat.caught>1?'were':'was')+' cut down before reaching the edge of the field.':'Everyone who withdrew got clear of the field.')+'</p>'+
        '<p class="'+(away?'good':'bad')+'">'+(od.leave?'They let you go.':away?'You get away ('+Math.round(od.ch*100)+'% chance): they lose your trail.':(od.ch<=0?od.why+': ':'')+'They run you down'+(rn?': your rearguard loses '+lossText(rear):'')+'. You must face them again.')+' You ride on with '+n+' soldier'+(n===1?'':'s')+'.</p>'+
        '<div class="lab">The battle</div><div class="loot-stats">'+[['Enemies slain',kills,'good'],['Your fallen',retreat.fallen||0,retreat.fallen?'bad':''],['Got away',retreat.got||0,''],['Enemies still standing',retreat.standing||0,'']].map(([k,v,c])=>'<span><b>'+k+'</b><span class="'+c+'">'+v+'</span></span>').join('')+'</div>'+moodLine+'<p class="bad">Renown −'+MOOD.renown+' for the retreat.</p>';
    }else{
      const lose=Math.floor(P.gold*.25);P.gold-=lose;const moodLine=battleMood(-15,'defeat');if(auto){vitals();P.hp=Math.max(1,Math.round(P.hp*.5))}
      if(prisonerCount()){P.prisoners={};log('Your prisoners escape in the chaos.','bad')}
      captivesEscape();
      if(e.kind==='siege'||e.kind==='raid'){P.siege=null;G.capWith=null;e.ref.gar=Math.max(1,Math.round(e.ref.gar*.75))}
      if(e.kind==='patrol'){const h=townBy(e.ref.home);if(h)h.crime=null}
      if(e.kind==='party'||e.kind==='camp')chiefWins(e.ref,partySize()+1);// the chieftain who beat you grows
      const safe=TOWNS.filter(t=>!hostileTo(t.owner)),near=nearestOf(P,safe.length?safe:TOWNS);
      P.x=near.x;P.y=near.y+24;G.lastTown=near;if(e.kind!=='camp')e.ref.cool=8;
      if(e.kind==='lord'){const l=e.ref;if(auto)cull(l,.3);else if(!this.primaryLossesApplied)for(const k of slain)partyRemove(l,k,1);lordWins(l,partySize())}
      html='<h2>Defeat</h2><p>Your band was routed. You lost '+lose+' gold and woke up near '+near.name+'.</p>'+moodLine;
      log('Defeat. You wake near '+near.name+'.','bad');
    }
    // your troops' experience (core/recruitment.js): what each kind earned, after the shared roster has applied the losses
    {const before=Object.keys(P.troops).reduce((a,k)=>a+txpReady(k),0);
      if(auto){const n=troopCount(),each=TROOP_XP.auto*(TROOP_XP.fight+(win?TROOP_XP.win:0)+(n?kills*TROOP_XP.kill*2/n:0));for(const k in P.troops)txpGain(k,each*P.troops[k])}
      else for(const k in txp||{})txpGain(k,txp[k]);txpClamp();const ready=Object.keys(P.troops).reduce((a,k)=>a+txpReady(k),0);
      if(ready>before)html+='<p class="gold">Your troops learn from the fight: '+ready+' soldier'+(ready>1?'s are':' is')+' ready to train at a barracks.</p>'}
    G.encCool=retreat?4:3;G.enc=null;G.mode='dialog';
    const report=groupLosses?{groups:groupLosses.slice().sort((a,b)=>a.slot-b.slot).map(row=>({id:row.id,type:row.type,name:row.name,start:row.start,
      fit:row.start-row.count-row.rearguard,wounded:row.wounded,killed:row.count-row.wounded+row.rearguard,saved:row.saved,rearguard:row.rearguard})),characters:this.characterReport||[]}:null;
    lootShow(html,lost,saved,'cont',report);
  }
}
// Existing callers (simulation, auto-resolve, encounters and tests) keep the same entry points.
function finishBattle(){if(B&&B.opts.sandbox)return BattleLab.finish();return new BattleResolution(B).finish()}
function concludeEncounter(win,lost,kills,auto,slain,retreat,txp){return new BattleResolution().conclude(win,lost,kills,auto,slain,retreat,txp)}
