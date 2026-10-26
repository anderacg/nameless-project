'use strict';
// Only escape effort spends this pool. Changing targets/roles never refills it; player stamina uses supplies as before.
class EscapeStamina{
  static active=new Map();static time=0;static dt=0;static frame=0;
  static kind(o){return o.mapKind||(o.crit?'critter':o.folk?'worker':o.rf?'refugee':o.cv?'caravan':o.id&&MONSTERS[o.id]?'monster':'other')}
  static capacity(o){const k=this.kind(o);if(k==='critter')return ESCAPE_STAMINA.wild[o.id]||16;const base=ESCAPE_STAMINA.capacity[k]||ESCAPE_STAMINA.capacity.other,list=o instanceof Party&&k!=='monster'?o.troops:[];return base*(list.length&&list.filter(t=>ST[t]?.mounted||ST[t]?.charge).length/list.length>=.5?ESCAPE_STAMINA.mounted:1)}
  static ratio(o){if(o===P)return clamp(P.bsta/100,0,1);return o.escapeSta==null?1:clamp(o.escapeSta/this.capacity(o),0,1)}
  static factor(o){if(o===P)return 1;const q=this.ratio(o);return q>=.6?1:q>=.25?.8+(q-.25)/.35*.2:ESCAPE_STAMINA.floor+q/.25*(.8-ESCAPE_STAMINA.floor)}
  static state(o){if(o===P){const s=P.staminaState();return s==='fresh'?(P.bsta<60?'tiring':'fresh'):s}const q=this.ratio(o);return q>=.6?'fresh':q>=.4?'tiring':q>=.15?'tired':'exhausted'}
  static run(o,threat,step,move,factored=false){
    if(o===P)return move(step);const x=o.x,y=o.y,capacity=this.capacity(o),budget=step*(factored?1:this.factor(o)),result=move(budget),moved=Math.hypot(o.x-x,o.y-y);
    let s=this.active.get(o);if(!s){s={at:this.time,frame:-1};this.active.set(o,s)}s.threat=threat;s.at=this.time;
    if(moved>.001&&s.frame!==this.frame){o.escapeSta=Math.max(0,Math.min(capacity,o.escapeSta??capacity)-this.dt*Math.min(1,moved/Math.max(.001,budget)));s.frame=this.frame}
    return result;
  }
  static flee(o,threat,step){return this.run(o,threat,step,n=>FleeRoutes.step(o,threat,n),['lord','band','patrol','cparty'].includes(o.mapKind))}
  static tick(rt){
    if(G.paused||G.modal||B)return;this.dt=Math.max(0,rt*G.speed);this.time+=this.dt;this.frame++;
    // Loaded tired entities are adopted without resetting their saved stamina.
    for(const o of [...W.parties,...W.monsters,...W.caravans,...W.refugees,...W.critters,...W.folk])if(o.escapeSta!=null&&!this.active.has(o))this.active.set(o,{at:this.time,frame:-1});
    for(const [o,s] of this.active){if(o.dead||o.gone){this.active.delete(o);continue}const cap=this.capacity(o),safe=!s.threat||s.threat.dead||s.threat.gone||Math.hypot(o.x-s.threat.x,o.y-s.threat.y)>ESCAPE_STAMINA.safe;
      if(safe&&this.time-s.at>=ESCAPE_STAMINA.delay){o.escapeSta=Math.min(cap,(o.escapeSta??cap)+cap*ESCAPE_STAMINA.recovery*this.dt);if(o.escapeSta>=cap){delete o.escapeSta;this.active.delete(o)}}
    }
  }
}
onWorld(()=>{EscapeStamina.active.clear();EscapeStamina.time=EscapeStamina.dt=EscapeStamina.frame=0});
Systems.add({name:'escape stamina',order:{frame:4},frame:(d,rt)=>EscapeStamina.tick(rt)});
