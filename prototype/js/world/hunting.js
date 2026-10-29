'use strict';
/* The map chooses the ground; the ordinary world battle owns the hunt. */
class WildHunt{
  static choice=null;static armed=false;
  static toggle(){this.armed=!this.armed;toast(this.armed?'Hunting area: hold a spot on the map to choose your ground.':'Hunting area selection cancelled.');this.controls()}
  static controls(){for(const e of document.querySelectorAll('[data-act="hunt-area"]')){e.classList.toggle('on',this.armed);e.setAttribute('aria-pressed',String(this.armed));e.textContent='Hunting area'}}
  static prey(area){return W.critters.map(asHerd).filter(c=>c.wild&&c.n>0&&Math.hypot(c.x-area.x,c.y-area.y)<=HUNT_AREA.radius&&c.inView(vis()))}
  static prepare(c){if(!c?.wild||!c.n||!W.critters.includes(c)||!c.inView(vis())||P.stay||B)return false;return this.preview(c.x,c.y)}
  static preview(x,y){
    if(B||P.stay||G.mode!=='world')return false;this.armed=false;this.controls();this.choice={x,y};const prey=this.prey(this.choice),close=Math.hypot(P.x-x,P.y-y)<HUNT_AREA.radius-WORLD_BATTLE.inner,ready=close&&prey.length>0;
    G.mode='dialog';G.chase=null;P.tx=P.ty=null;
    showPanel('<div class="top"><h2>Hunting area</h2></div><p>'+prey.reduce((n,c)=>n+c.n,0)+' animals in '+prey.length+' visible wildlife groups.</p><p>Auto Hunt starts with your whole army, using normal weapons and ammunition. Give battle orders or use the AI control to take command. Animals flee and tire; those beyond the circle escape. Kills provide meat and species trophies in the loot screen.</p>'+nav(['hunt-back',null,'Cancel'],['hunt-start',null,'Begin hunt',ready?'':!close?'Move closer to this hunting area':'No visible wildlife in this area']));panel.classList.add('hunt-setup');return true;
  }
  static start(){
    const area=this.choice;if(!area||B||G.mode!=='dialog'||P.stay||Math.hypot(P.x-area.x,P.y-area.y)>=HUNT_AREA.radius-WORLD_BATTLE.inner)return false;const herds=this.prey(area);if(!herds.length)return false;
    this.choice=null;breakCamp();followStop();G.chase=null;G.pitch=null;G.byRoad=null;if(G.hurry)setHurry(false);G.mode='world';hidePanel();
    const ref=herds[0];G.enc={kind:'hunt',name:'Wildlife hunt',ref,list:[],lv:1,allies:[],foes:[],hunt:{...area,herds}};return new HuntBattleSetup({enemies:[],lv:1,deploy:false,surprise:true}).start();
  }
  static drawArea(cam){const a=this.choice;if(!a)return;const k=dprOf()/VS;ctx.save();ctx.strokeStyle='#d8c179';ctx.lineWidth=1.5*k;ctx.setLineDash([6*k,4*k]);ctx.beginPath();ctx.arc(a.x-cam.x,a.y-cam.y,HUNT_AREA.radius,0,Math.PI*2);ctx.stroke();ctx.restore()}
}
onAct('hunt-',a=>{if(a==='hunt-area')return WildHunt.toggle();if(a==='hunt-start')return WildHunt.start();if(a==='hunt-back'){WildHunt.choice=null;G.mode='world';hidePanel()}});
onWorld(()=>{WildHunt.choice=null;WildHunt.armed=false;WildHunt.controls()});
