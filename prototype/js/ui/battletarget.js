'use strict';
/* Read-only feedback for an explicit enemy order. Combat still owns range, movement and attack timing. */
const BATTLE_TARGET={every:100,ready:'#a9d58c',wait:'#e6c57d',blocked:'#ed9c81'};
class BattleTargetFeedback{
  constructor(){this.battle=null;this.at=0;this.selection='';this.mark=null;this.value=null;this.el=null}
  active(){return B&&G.mode==='battle'&&!G.modal&&!B.over&&!B.deploy&&!B.muster?.active}
  ordered(g,t){return !!g?.hasTarget&&(g.targetUnitId===t.id||g.targetGroupId!=null&&g.targetGroupId===t.grp)}
  target(gs){
    const marked=B.mark?.target;
    const controls=gs.map(id=>B.groups[id]).filter(g=>g?.hasTarget);
    if(marked&&marked.hp>0&&!marked.left&&seenBy(0,marked)&&battleEnemy(0,marked)&&controls.some(g=>this.ordered(g,marked)))return marked;
    for(const g of controls){const t=g.tgt;if(t&&t.hp>0&&!t.left&&seenBy(0,t)&&battleEnemy(0,t))return t}return null;
  }
  measure(u,t){
    const g=B.groups[u.grp],melee=!!(u.s.range&&!u.empty&&g?.melee),ranged=!!u.s.range&&!melee;
    const range=ranged?u.s.range:(melee?BLADE.reach*meleeK():u.s.reach||11)+3;
    const distance=Math.hypot(t.x-u.x,t.y-u.y)-(t.s.big&&!ranged?12:0);
    const result=(text,kind='wait')=>({unit:u,target:t,range,ranged,text,kind,distance});
    if(u.rout)return result('Routing','blocked');
    if(g?.order==='withdraw')return result('Withdrawing','blocked');
    if(PHYSICS.on&&u.down>0)return result('Getting up','blocked');
    if(u.stun>0)return result('Stunned','blocked');
    if(!ranged&&B.terrain?.lift&&B.terrain.apart(u,t))return result('Different ground level','blocked');
    if(ranged&&groundNoShoot(u))return result('Cannot shoot from water','blocked');
    if(distance>range)return result('Closing distance');
    if(ranged&&!inArc(u,t))return result('Turning to aim');
    if(ranged&&(u.spdNow>0||u.skirm)&&!onTheMove(u.s))return result('Stopping to shoot');
    if(u.wind)return result('Winding up');
    if(u.shot)return result('Aiming');
    if(u.cd>0)return result(ranged&&!u.s.magic?'Reloading':'Recovering');
    return result('In reach','ready');
  }
  sample(){
    if(!this.active())return null;const gs=selGroups(),target=this.target(gs);if(!target)return null;
    const men=gs.flatMap(grpUnits).filter(u=>u.hp>0&&!u.left&&battleFriend(0,u)&&this.ordered(B.groups[u.grp],target));if(!men.length)return null;
    // Inspect the nearest three instead of walking terrain/arc queries for an entire army on every paint.
    men.sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));
    const choices=men.slice(0,3).map(u=>this.measure(u,target)),rank={ready:0,wait:1,blocked:2};
    choices.sort((a,b)=>rank[a.kind]-rank[b.kind]||a.distance-b.distance);return choices[0];
  }
  view(){
    if(!this.active()){this.value=null;return null}const now=performance.now(),key=selGroups().join('|');
    // Visibility and death are checked even between samples; a marker must never follow an unseen enemy.
    if(this.value&&(this.value.unit.hp<=0||this.value.unit.left||this.value.target.hp<=0||this.value.target.left||!seenBy(0,this.value.target)||!selGroups().some(id=>this.ordered(B.groups[id],this.value.target))))this.value=null;
    if(this.battle!==B||this.selection!==key||this.mark!==B.mark||now>=this.at){this.battle=B;this.selection=key;this.mark=B.mark;this.at=now+BATTLE_TARGET.every;this.value=this.sample()}
    return this.value;
  }
  hud(){
    const v=this.view();if(!this.el){if(!v)return;this.el=document.createElement('div');this.el.id='bTargetFeedback';this.el.className='battle-target-feedback';this.el.setAttribute('role','status');this.el.setAttribute('aria-live','polite')}
    const host=document.querySelector('.btop');if(host&&this.el.parentNode!==host)host.appendChild(this.el);this.el.hidden=!v;
    if(v){this.el.dataset.kind=v.kind;setHtml(this.el,icon('sword',12)+'<strong>'+htmlText(v.target.s.n||ST[v.target.type]?.n||'Enemy')+'</strong><span>'+htmlText(v.text)+'</span>')}
  }
  drawGround(){
    const v=this.view();if(!v)return;const u=v.unit,t=v.target,col=BATTLE_TARGET[v.kind];ctx.save();ctx.strokeStyle=col;ctx.globalAlpha=.38;ctx.lineWidth=1;ctx.setLineDash([3,4]);
    if(!v.ranged){ctx.beginPath();ctx.arc(u.x,u.y-fieldLift(u.x,u.y),v.range,0,Math.PI*2);ctx.stroke()}
    ctx.beginPath();ctx.moveTo(u.x,u.y-fieldLift(u.x,u.y));ctx.lineTo(t.x,t.y-fieldLift(t.x,t.y));ctx.stroke();ctx.restore();
  }
  drawTarget(){
    const v=this.view();if(!v)return;const t=v.target,p=fromField({x:t.x,y:t.y-fieldLift(t.x,t.y)}),x=p.x,y=p.y,k=unitIconScale()/UICON.k,r=((t.s.big?11:8)+(reducedMotion()?0:Math.sin(performance.now()/260)*.6))*k;
    ctx.save();ctx.strokeStyle=BATTLE_TARGET[v.kind];ctx.lineWidth=1.5*k;ctx.beginPath();ctx.ellipse(x,y,r,r*.45,0,0,Math.PI*2);ctx.stroke();
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(x+side*(r+4*k),y-5*k);ctx.lineTo(x+side*(r+k),y);ctx.lineTo(x+side*(r+4*k),y+5*k);ctx.stroke()}
    ctx.fillStyle=BATTLE_TARGET[v.kind];ctx.beginPath();ctx.moveTo(x,y-19*k);ctx.lineTo(x+2.5*k,y-16*k);ctx.lineTo(x,y-13*k);ctx.lineTo(x-2.5*k,y-16*k);ctx.closePath();ctx.fill();ctx.restore();
  }
}
const battleTargetFeedback=new BattleTargetFeedback();
