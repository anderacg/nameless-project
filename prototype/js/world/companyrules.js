'use strict';
/* Optional standing orders. Markets, camps and BattleControl still own the actual transactions and orders. */
const COMPANY_RULES={days:2,reserve:100,wages:2,restAt:25,resumeAt:85,restSpeed:4,every:1,think:.5,gap:45,moved:22};
const COMPANY_DUTIES={manual:['Manual','Wait for your orders.'],protect:['Protect me','Stay close to your hero and fight nearby enemies.'],line:['Hold line','Hold the starting position and fight enemies that approach.'],support:['Support','Follow behind your hero and engage nearby enemies.'],skirmish:['Skirmish','Ranged troops keep their distance; melee troops protect your hero.']};
class CompanyRules{
  constructor(){this.reset()}
  reset(v={}){this.resupply=v.resupply===true;this.rest=v.rest===true;this.duties={};for(const [id,d] of Object.entries(v.duties||{}))if(COMPANY_DUTIES[d]&&d!=='manual')this.duties[id]=d;this.journey=v.journey&&Number.isFinite(v.journey.x)&&Number.isFinite(v.journey.y)?{...v.journey}:null;this.pace=v.pace&&[...SPEEDS,TRAVEL_FAST].includes(v.pace.before)?{...v.pace,boost:Math.max(COMPANY_RULES.restSpeed,v.pace.before)}:null;this.recover=v.recover===true;this.wait=0;this.battles=new WeakMap()}
  save(){if(!this.resupply&&!this.rest&&!Object.keys(this.duties).length&&!this.journey&&!this.pace&&!this.recover)return;return {...(this.recover?{recover:true}:{}),resupply:this.resupply,rest:this.rest,duties:{...this.duties},journey:this.journey&&{...this.journey},...(this.pace?{pace:{...this.pace}}:{})}}
  duty(id){return this.duties[id]||'manual'}
  setDuty(id,d){if(!COMPANY_DUTIES[d]||!partyRoster(P).groups.some(g=>g.id===id))return false;if(d==='manual')delete this.duties[id];else this.duties[id]=d;return true}
  toggle(k){if(k!=='rest'&&k!=='resupply')return;this[k]=!this[k];if(k==='rest'&&!this.rest)this.cancel()}
  reserve(){return Math.max(COMPANY_RULES.reserve,Math.ceil(bandPayroll().total*COMPANY_RULES.wages))}
  room(g){return Math.max(0,goodRoom(g)-(playerInventory.spare-playerInventory.free)*playerInventory.stack('good',g))}
  // Only an admitted visit triggers purchases, once, before the market screen builds its bargain.
  visit(t){
    if(!this.resupply||G.mode!=='town'||G.town?.ref!==t||t.ruined()||foeAt(t)||closedNow(t)||!Gates.admits(t).ok)return 0;
    ensureEcon(t);const reserve=this.reserve(),before=P.gold,want=Math.ceil(bandFoodHour(true)*24*COMPANY_RULES.days*(climAt(t.x,t.y)==='frost'?1+SUPPLY.frostEat*survivalShare():1));
    // Do not automatically take scarce food from a hungry holding.
    for(let left=Math.max(0,want-foodN());left>0&&Economy.of(t).foodDays()>=3;left--){
      const goods=FOODS.filter(g=>t.stock[g]>=1&&this.room(g)>=1&&nextBuy(t,g)<=P.gold-reserve).sort((a,b)=>nextBuy(t,a)-nextBuy(t,b));
      if(!goods.length)break;const r=buyGoods(t,goods[0],1);if(!r.got)break;addRep(t.name,r.spent/60,true);
    }
    const need=Math.max(0,skinsFull()-goodN(SKIN.full)-skinsEmpty()),n=Math.min(need,Math.floor(Math.max(0,P.gold-reserve)/GOODS[SKIN.empty].base),Math.floor(this.room(SKIN.empty)));
    if(n>0)skinsBuy(n);fillNow(true);
    const spent=before-P.gold;if(spent){log('Company supplies replenished at '+t.name+' for '+spent+' gold.','gold','band');updateHUD(true)}return spent;
  }
  speedChanged(){if(this.pace)this.pace.manual=true}
  endPace(){const p=this.pace;this.pace=null;if(p&&!p.manual&&G.speed===p.boost)setSpeed(p.before,undefined,true)}
  paceStep(){
    if(G.mode!=='world'||G.modal){if(G.mode==='battle')this.endPace();return}
    const resting=P.tx==null&&!G.chase&&!G.follow&&!G.pitch&&(P.camp&&!P.camp.pack||P.stay||this.journey&&!P.camp?.pack);
    if(!resting){this.endPace();return}
    if(!this.pace)this.pace={before:G.speed,boost:Math.max(COMPANY_RULES.restSpeed,G.speed),manual:false};
    const p=this.pace,danger=dangerInSight();
    if(danger){if(G.speed>1){if(P.camp)log('Your camp stirs: '+danger+'.','bad','band');setSpeed(1,undefined,true)}p.manual=true;return}
    if(P.bsta>=100){if(!p.manual&&G.speed===p.boost)setSpeed(p.before,undefined,true);p.manual=true;return}
    if(!p.manual&&G.speed!==p.boost)setSpeed(p.boost,undefined,true);
  }
  cancel(){const recovering=this.recover;this.recover=false;this.endPace();const j=this.journey;if((j?.camp||recovering)&&G.pitch&&P.tx===G.pitch.x&&P.ty===G.pitch.y){P.tx=P.ty=null;G.pitch=null}this.journey=null}
  restRate(){const L=supplyLand(),dr=drinkNext(L)||(L.well||canFill(L)?'water':null);return staminaRate(false,dr,L)}
  stopRecovery(){this.cancel();if(P.camp&&!P.camp.pack){this.pace={before:1,boost:COMPANY_RULES.restSpeed,manual:true};setSpeed(1,undefined,true)}}
  beginRecovery(){
    if(G.mode!=='world'||G.modal||P.camp?.pack||P.siege||P.raid||P.stay||dangerInSight()||P.bsta>=100||Captivity.held||this.restRate().n<=0||!P.camp&&!campSpot())return false;
    this.cancel();followStop();G.chase=null;G.pitch=null;P.tx=P.ty=null;
    if(!P.camp&&!makeCamp())return false;
    this.recover=true;this.wait=0;G.paused=false;pauseUI();this.paceStep();updateHUD(true);return true;
  }
  recoveryStep(){
    if(!this.recover||G.mode!=='world'||G.modal)return;
    const pitching=G.pitch&&P.tx===G.pitch.x&&P.ty===G.pitch.y,danger=dangerInSight();
    if(danger){this.cancel();setSpeed(1,undefined,true);toast('Rest interrupted: '+danger+'.','bad','band');return}
    if(P.camp?.pack||P.tx!=null&&!pitching||G.chase||G.follow||P.stay||P.siege||P.raid||!P.camp&&!pitching){this.cancel();return}
    if(!pitching&&this.restRate().n<=0){this.stopRecovery();toast('Recovery needs drinking water.','bad','band');return}
    if(!pitching&&P.bsta>=100){this.cancel();toast('Your band is rested. Camp remains until you pack up.','good','band');updateHUD(true)}
  }
  frame(dt){
    if(this.recover){this.paceStep();if((this.wait-=dt)<=0){this.wait=COMPANY_RULES.every;this.recoveryStep()}return}this.paceStep();if(!this.rest){if(this.journey)this.cancel();return}if((this.wait-=dt)>0)return;this.wait=COMPANY_RULES.every;
    if(G.mode!=='world'||G.modal)return;
    const j=this.journey;
    if(j){
      const pitching=G.pitch&&P.tx===G.pitch.x&&P.ty===G.pitch.y;
      if(P.stay||P.siege||P.raid||G.chase||G.follow||dangerInSight()||P.tx!=null&&!pitching){this.cancel();return}
      if(j.camp&&!P.camp&&!pitching){this.cancel();return}
      if(P.bsta<COMPANY_RULES.resumeAt||pitching)return;
      this.cancel();if(P.camp)breakCamp('Your band is rested and continues its journey.');P.tx=j.x;P.ty=j.y;P.stuck=0;return;
    }
    if(P.bsta>COMPANY_RULES.restAt||P.tx==null||G.chase||G.follow||G.pitch||P.camp||campWhy()||dangerInSight())return;
    const land=supplyLand(),drink=drinkNext(land)||(land.well||canFill(land)?'water':null);if(staminaRate(false,drink,land).n<=0)return;
    this.journey={x:P.tx,y:P.ty,camp:false};P.tx=P.ty=null;
    // A legal site uses the existing camp search and approach. No site: recover where you stopped.
    if(campSpot()&&makeCamp())this.journey.camp=true;
    else toast('Your band rests here before continuing its journey.','gold','band');
    this.paceStep();
  }
  battle(dt){
    if(!B||B.over||B.deploy||B.muster?.active||B.opts?.tournament||B.surprise?.holds(0))return;
    let state=this.battles.get(B);if(!state){state={t:0,groups:new WeakMap()};this.battles.set(B,state)}
    if((state.t-=dt)>0)return;state.t=COMPANY_RULES.think;
    const hero=B.hero;if(!hero||!fighting(hero))return;
    const scale=fightSpace(),gap=COMPANY_RULES.gap*scale;
    const groups=Object.values(B.groups).filter(g=>g.player&&g.role!=='hero');
    for(const [i,g] of groups.entries()){
      const duty=this.duty(g.sourceGroupId);if(!g.player||g.role==='hero'||duty==='manual'||g.orderSeq||aiHas(g)||g.resolve?.routed)continue;
      const units=grpUnits(g.id).filter(fighting);if(!units.length)continue;
      let note=state.groups.get(g);if(!note){note={home:g.centre(),goal:null};state.groups.set(g,note)}
      const c=g.centre(),face=hero.ranks?.face??B.groups[hero.grp]?.face??0;
      const lane=(i-(groups.length-1)/2)*gap;
      let goal=duty==='line'?note.home:{x:hero.x-Math.cos(face)*gap*(duty==='support'?1.7:1)-Math.sin(face)*lane,y:hero.y-Math.sin(face)*gap*(duty==='support'?1.7:1)+Math.cos(face)*lane};
      if(duty==='skirmish'){
        const shooters=units.filter(u=>u.s.range&&!u.empty);g.setFlag('skirmish',true);
        if(shooters.length*2>units.length){let e=null,nearest=Infinity;for(const u of B.units){if(!battleEnemy(0,u)||!fighting(u)||!seenBy(0,u))continue;const d=(u.x-c.x)**2+(u.y-c.y)**2;if(d<nearest){nearest=d;e=u}}
          if(e){const range=Math.min(...shooters.map(u=>u.s.range))*.75,d=Math.hypot(c.x-e.x,c.y-e.y),a=d>1?Math.atan2(c.y-e.y,c.x-e.x):Math.PI;goal={x:e.x+Math.cos(a)*range,y:e.y+Math.sin(a)*range}}}
      }
      if(!note.goal||Math.hypot(goal.x-note.goal.x,goal.y-note.goal.y)>COMPANY_RULES.moved*scale){g.amEnd();if(duty==='line')g.moveTo(goal.x,goal.y);else g.attackMove(goal.x,goal.y);note.goal={...goal}}
    }
  }
}
const companyRules=new CompanyRules();
onWorld(()=>companyRules.reset());
worldOn('battle:ended',()=>companyRules.cancel());
Systems.add({name:'company rules',order:{frame:49},frame:(d,dt)=>companyRules.frame(dt)});
Saves.add({key:'companyRules',order:285,defaults:{},save:()=>companyRules.save(),load:v=>{companyRules.reset(v);if(companyRules.journey&&!P.camp)companyRules.journey.camp=false}});
