'use strict';
/* ---------- through the gate (the owner, 2026-11-14: "when lord enter the castle or building I can see that the entire army just
   disappeared right before my eye. How can we improve this?"; "I also see the small village can store up mounts and entire army
   with in just a small house?") ----------
   An army you see marched man by man (march.js) going into a holding files in at its gate: its men, the nearest first, a man every
   gap s, walk to the gate at pace px a second, each fading over his last fade px (at most most of them). Coming out, its march is
   laid afresh with every man at the gate, and they walk out to their places in it. Drawn only: the army's own march is idle while it
   is in (march formations), nothing of the world's moves.
   A holding quarters at most its kind's quarter men (data/holdings.js HOLDING_TYPES; roomFor: why not, ''); an army with more
   (yours, a companion's, a lord's) stays outside, camped by its gate: a lord at rest there has his tents pitched beside it, by
   their feet among everyone (camp: on) ---------- */
const GATE_FILE={on:true,gap:.07,pace:26,fade:8,most:80,out:true,camp:true,spread:3};
// (why t has no room for n men: its quarter; '' if it has)
const roomFor=(t,n)=>{const q=t&&t.T&&t.T.quarter;return q&&n>q?'A '+(t.label||t.T.n)+' has no room for '+n+' men (it quarters '+q+')':''};
class GateFile{
  static list=[];
  // (o goes into t: its marchers, copied, file in)
  static start(o,t){const X=GATE_FILE;if(!X.on||!WORLD_BATTLE.on||!t)return;const a=typeof marchLive==='function'&&marchLive(o);if(!a)return;
    const g=gateGoal(t),d=u=>Math.hypot(u.x-g.x,u.y-g.y),men=a.units.filter(u=>!u.dead).sort((p,q)=>d(p)-d(q)).slice(0,X.most).map((u,i)=>({...u,walking:false,tg:null,plan:null,goal:null,wait:i*X.gap}));
    if(men.length)this.list.push({o,g,men,t:0})}
  // (o out of t: its march laid afresh, every man at the gate, a step apart, to walk out to his place)
  static out(o,t){const X=GATE_FILE;if(!X.on||!X.out||!WORLD_BATTLE.on||!t||typeof MarchArmy==='undefined'||Math.hypot(o.x-P.x,o.y-P.y)>vis()+MARCH_MOVE.active)return;
    MARCH_ARMIES.delete(o);const a=MarchArmy.of(o),g=gateGoal(t);a.units.forEach((u,i)=>{u.x=g.x+((i%3)-1)*X.spread;u.y=g.y+Math.floor(i/3)%3;u.plan=null;u.walking=false})}
  static step(d){const X=GATE_FILE;
    for(const f of this.list){f.t+=d;for(const u of f.men){if(f.t<u.wait)continue;const dx=f.g.x-u.x,dy=f.g.y-u.y,l=Math.hypot(dx,dy),s=Math.min(l,X.pace*d);if(l<.5){u.gone=true;continue}
      u.walking=true;u.x+=dx/l*s;u.y+=dy/l*s;u.walk=(u.walk||0)+s;u.dir=Math.atan2(dy,dx)}f.men=f.men.filter(u=>!u.gone)}
    this.list=this.list.filter(f=>f.men.length)}
  // (each man filing in, by his feet among everyone, fading at the gate)
  static draw(ents,cam){const X=GATE_FILE;for(const f of this.list){const own=f.o===P||f.o.faction==='player';
    for(const u of f.men){const a=Math.min(1,Math.hypot(f.g.x-u.x,f.g.y-u.y)/X.fade);ents.push({y:u.y,own,f:()=>{ctx.save();ctx.globalAlpha*=a;drawMarcher(u,f.o,cam);ctx.restore()}})}}}
  // (a lord at rest outside a holding with no room for his men: his camp beside its gate, in your sight)
  static camps(ents,cam,V){if(!GATE_FILE.camp)return;const S=yourSight(V);
    for(const l of W.lords){if(l.dead||l.inside||l.fight||l.state!=='rest')continue;const t=townBy(l.tgt),g=t&&gateGoal(t);if(!g||Math.hypot(l.x-g.x,l.y-g.y)>16||!roomFor(t,l.troops.length)||!S.sees(l.x,l.y))continue;
      const side=(l.id.length%2?1:-1),s=campSprite(l.id.length*13+3,'travelers'),X=g.x+side*26,Y=g.y+6;
      ents.push({y:Y,f:()=>{const x=Math.round(X-s.ax-cam.x),y=Math.round(Y-s.ay-cam.y);if(s.sh){ctx.globalAlpha=SHADOW.a;ctx.drawImage(s.sh,x,y);ctx.globalAlpha=1}ctx.drawImage(s,x,y)}})}}
}
onWorld(()=>{GateFile.list=[]});
// its work in the world's frame (core/systems.js): after the armies' marches
Systems.add({name:'gate file',order:{frame:146},frame:d=>GateFile.step(d)});
