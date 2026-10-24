'use strict';
/* ---------- sounds beyond sight: no news, names, map marks or saved knowledge ----------
   A noisy world event, or an ongoing fight you ride within earshot of, emits a short wordless cry and white waves from its
   source (gfx/worldui.js). Hearing reaches 1.25 times the army's current sight; woodland can hide the source inside that.
   Cues expire in real seconds, as encounter waves do. Nearby reports coalesce; none play over a window or a battle. */
const DISTRACTION={range:1.25,life:6,gap:8,max:6,col:'#ffffff',kinds:{battle:1,siege:1,relieved:1,fell:1,raid:1}};
class WorldDistractions{
  constructor(){this.reset()}
  reset(){this.cues=new Map();this.last=new Map()}
  kind(ev){const k=ev.noise||(ev.news||ev.heard||[])[0];return DISTRACTION.kinds[k]?k:null}
  audible(p){return WORLD_LOG.on&&G.mode==='world'&&!G.modal&&!G.dead&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&!spotted(p,vis())&&Math.hypot(p.x-P.x,p.y-P.y)<=vis()*DISTRACTION.range}
  prune(now){
    for(const [k,c] of this.cues)if(now-c.t>=DISTRACTION.life*1000||!this.audible(c))this.cues.delete(k);
    for(const [k,c] of this.last)if(now-c.t>=DISTRACTION.gap*1000)this.last.delete(k);
  }
  notice(ev,kind=this.kind(ev),now=performance.now()){
    this.prune(now);if(!kind||!DISTRACTION.kinds[kind]||!this.audible(ev)||G.paused)return false;
    if([...this.last.values()].some(c=>Math.hypot(c.x-ev.x,c.y-ev.y)<TILE*2))return false;
    const k=Math.round(ev.x/TILE)+','+Math.round(ev.y/TILE),c={x:ev.x,y:ev.y,t:now};
    this.cues.set(k,c);this.last.set(k,c);
    if(this.cues.size>DISTRACTION.max)this.cues.delete(this.cues.keys().next().value);
    if(this.last.size>DISTRACTION.max*4)this.last.delete(this.last.keys().next().value);
    const r=vis()*DISTRACTION.range,d=Math.hypot(c.x-P.x,c.y-P.y);
    sfx('distantbattle',{pan:clamp((c.x-P.x)/r,-1,1)*.85,vol:.45+.35*(1-d/r)});
    return true;
  }
  active(now=performance.now()){this.prune(now);return [...this.cues.values()]}
}
const DISTRACTIONS=new WorldDistractions();
onWorld(()=>DISTRACTIONS.reset());
