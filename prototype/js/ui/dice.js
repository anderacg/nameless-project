'use strict';
/* ---------- the dice (the owner, 2026-11-09: "Can we add a cool dice animations when rolling something?") ----------
   A check you make (a bribe, a break-out, words with a lord, a road's chance, the roll to live) is shown as it falls: a die
   tumbles onto the screen and lands on your roll (a hundred-sided: 1 to 100), the bar under it the odds you had (won at or
   under the mark; won in part, the amber beyond it), then what came of it. Only the showing: the roll is the check's own draw
   (Dice.check draws it once, as the check did; Dice.show shows one already drawn), so no stream, no fingerprint moves.
   DICE: on; tumble, how long the die rolls (ms); hold, how long the result stays; reduced motion (the system's): the result
   alone, still. A click dismisses it; a new roll replaces it. The overlay is over the screen, not in the window: no page's
   content changes ---------- */
const DICE={on:true,tumble:1000,hold:1400};
class Dice{
  // (a chance p tried: drawn (draw: the check's own, Math.random unless given), shown, true when won)
  static check(p,label,draw=Math.random){const r=draw(),won=r<p;this.show({p,r,label});return won}
  /* (a roll already drawn, shown: p its odds, r the draw, label what it was for; part: the share beyond p that wins in part;
     won: what came of it when the check is its own (the roll to live: won is living)) */
  static show(o){if(!DICE.on||typeof document==='undefined'||!document.body)return;const s=this.face(o);setTimeout(()=>this.draw(s),0)}
  // (what the die says: its number, the mark, what came of it; the number kept on the right side of the mark)
  static face({p,r,label,part=0}){const need=Math.max(0,Math.min(100,Math.round(p*100))),won=r<p,half=!won&&part>0&&r<p+part;
    let n=Math.min(100,Math.floor(r*100)+1);if(won&&n>need)n=Math.max(1,need);if(!won&&n<=need)n=Math.min(100,need+1);
    return {label,need,n,part:Math.round(Math.min(1,p+part)*100),res:won?'won':half?'part':'lost'}}
  // (its other faces' numbers from its roll, never a draw of the game's: Math.random is the simulation's)
  static draw(s){this.clear();const quiet=matchMedia('(prefers-reduced-motion: reduce)').matches,rnd=k=>1+(s.n*37+k*53)%100;
    const faces=[s.n,rnd(1),rnd(2),rnd(3),rnd(4),rnd(5)].map(v=>'<i>'+v+'</i>').join(''),W={won:'Success',part:'In part',lost:'Failed'}[s.res];
    const el=document.createElement('div');el.className='dice-ov'+(quiet?' quiet':'');el.setAttribute('role','status');el.setAttribute('aria-live','polite');
    el.innerHTML='<div class="dice-card dice-'+s.res+'">'+(s.label?'<div class="dice-lab">'+s.label+'</div>':'')+
      '<div class="die-wrap"><div class="die">'+faces+'</div><div class="die-shadow"></div></div>'+
      '<div class="dice-bar"><b style="width:'+s.need+'%"></b>'+(s.part>s.need?'<u style="left:'+s.need+'%;width:'+(s.part-s.need)+'%"></u>':'')+'<em style="left:'+s.n+'%"></em></div>'+
      '<div class="dice-res"><span>Rolled '+s.n+' · needed '+s.need+' or less'+(s.part>s.need?' ('+s.part+' in part)':'')+'</span><strong>'+W+'</strong></div></div>';
    el.style.setProperty('--tumble',(quiet?0:DICE.tumble)+'ms');el.addEventListener('click',()=>this.clear());document.body.appendChild(el);this.el=el;
    this.timer=setTimeout(()=>this.clear(),(quiet?0:DICE.tumble)+DICE.hold+300)}
  static clear(){clearTimeout(this.timer);if(this.el)this.el.remove();this.el=null}
}
