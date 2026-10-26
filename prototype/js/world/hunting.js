'use strict';
/* Short, optional world-map hunts. Existing herds, marchers, cover, swept hits and tracks remain authoritative. */
const WILD_HUNT={range:80,speed:140,shots:4,helpers:3,interval:1.2,duration:14,collect:14,escape:110,opening:.85,ordinary:.65,moving:.5};
class WildHunt{
  static active=null;
  static choice=null;
  static hunters(){const army=MarchArmy.of(P);army.sync();return army.units.filter(u=>!u.character&&ST[u.type]?.range&&!ST[u.type].magic).slice(0,WILD_HUNT.helpers)}
  static prepare(c){
    if(this.active||!c?.wild||!c.n||!W.critters.includes(c)||!c.inView(vis())||P.stay||B)return false;
    this.choice=c;G.chase=null;P.tx=P.ty=null;G.mode='dialog';
    const ready=this.hunters().length;
    showPanel('<div class="top"><h2>Hunt '+htmlText(CRITTERS[c.id].n.toLowerCase())+'</h2></div><p>Approach quietly and take an automatic shot. Forest cover helps your opening. One animal is a successful hunt; the others may escape.</p><p>'+(ready?'Up to three fit ranged troops hunt with your army.':'Hunting requires at least one fit ranged troop with a physical ranged weapon.')+'</p><div class="btns">'+fbBtn('hunt-start','band','Hunt',ready?'':'Requires a fit ranged troop')+'</div>'+nav(['hunt-back',null,'Back'],['hunt-back',null,'Leave']));return true;
  }
  constructor(c,hunters){
    this.herd=c;this.time=0;this.shots=0;this.next=0;this.phase='approach';this.arrows=[];this.body=null;this.collected=false;this.alert=false;this.alertAt=Infinity;this.oldPause=G.paused;
    const sprite=critterSprite(c.id),space=Math.max(4,Math.round(sprite.cw*.55));
    this.animals=Array.from({length:c.n},(_,i)=>({id:i,x:c.x+(i?((i%3)-1)*space:0),y:c.y-Math.floor((i+1)/3)*space,hp:CRITTERS[c.id].size>=3?2:1,team:1,s:{big:CRITTERS[c.id].size>=3},dir:c.dir||1,vx:0,vy:0,walk:0}));
    this.sources=hunters;
    breakCamp();followStop();G.chase=null;G.pitch=null;G.byRoad=null;if(G.hurry)setHurry(false);G.mode='world';G.paused=false;hidePanel();
    Tracks.step(c,'crit:'+c.id,false,trackNow());this.bar();
  }
  static start(){const c=this.choice;if(!c||B||G.mode!=='dialog'||!W.critters.includes(c)||!c.n)return false;const hunters=this.hunters();if(!hunters.length){toast('Hunting requires a fit ranged troop.');return false}this.choice=null;this.active=new WildHunt(c,hunters);return true}
  bar(){
    let el=document.getElementById('huntBar');if(!el){el=document.createElement('div');el.id='huntBar';el.className='hunt-bar';el.innerHTML='<strong></strong><span></span><button type="button" class="btn sm">Leave hunt</button>';document.getElementById('screen').appendChild(el);el.querySelector('button').onclick=()=>this.finish('You leave the hunt.')}
    el.querySelector('strong').textContent='Hunting '+CRITTERS[this.herd.id].n.toLowerCase();el.querySelector('span').textContent=this.phase==='collect'?'Collecting game':this.phase==='shoot'?'Taking the shot':'Approaching';
  }
  flee(d,dt){
    const c=this.herd,D=CRITTERS[c.id],live=this.animals.filter(a=>a.hp>0);
    WildlifeThreats.rebuild();const threat=WildlifeThreats.target(c);
    if(!this.alert&&(threat||live.some(a=>this.sources.some(s=>Math.hypot(a.x-s.x,a.y-s.y)<TRAVEL_AWARE.contact)))){this.alert=true;this.alertAt=this.time}
    for(const a of live){const x=a.x,y=a.y;if(this.alert&&this.time-this.alertAt>.35){Router.flee(a,threat||P,moveStep(D.spd*.8,d));if(Math.abs(a.x-x)>Math.hypot(a.x-x,a.y-y)*.35&&Math.abs(a.x-x)>.01)a.dir=a.x>x?1:-1;a.walk+=Math.hypot(a.x-x,a.y-y)}a.vx=(a.x-x)/Math.max(.001,dt);a.vy=(a.y-y)/Math.max(.001,dt)}
    if(live.length){c.x=live[0].x;c.y=live[0].y;c.hx=c.x;c.hy=c.y;c.dir=live[0].dir;c.tire=0;c.cool=6;Tracks.step(c,'crit:'+c.id,false,trackNow())}
  }
  fire(source,target){
    const d=Math.hypot(target.x-source.x,target.y-source.y),T=d/WILD_HUNT.speed,hidden=hiddenAt(P.x,P.y)&&!this.alert,chance=clamp((hidden?WILD_HUNT.opening:this.alert?WILD_HUNT.moving:WILD_HUNT.ordinary)+skill('hunt')*.025,.4,.96),hit=Math.random()<chance;
    const x=target.x+target.vx*T,y=target.y+target.vy*T+(hit?0:12+Math.random()*8),angle=Math.atan2(y-source.y,x-source.x),dist=Math.hypot(x-source.x,y-source.y),flight=dist/WILD_HUNT.speed,H=Math.min(12,dist*dist/700);
    this.arrows.push({x:source.x,y:source.y,z:0,vx:Math.cos(angle)*WILD_HUNT.speed,vy:Math.sin(angle)*WILD_HUNT.speed,vz:4*H/Math.max(.05,flight),g:8*H/Math.max(.05,flight)**2,t:0,life:flight+.15,team:0});this.shots++;
    TravelAwareness.notice(this.herd,source.row||'hero');if(!this.alert){this.alert=true;this.alertAt=this.time}if(sfxOn())sfxAt('loose',source.x,source.y);
  }
  projectiles(dt){
    for(const a of this.arrows){const from={x:a.x,y:a.y,z:Math.max(0,a.z)};a.t+=dt;a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.z+=a.vz*dt-a.g*dt*dt/2;a.vz-=a.g*dt;
      const hit=this.body?null:worldMissileHit(a,from,true,this.animals,.5);if(hit){a.life=0;if(--hit.hp<=0){this.herd.n=Math.max(0,this.herd.n-1);if(!this.body){this.body=hit;this.phase='collect';this.collectAt=this.time}if(!this.herd.n)W.critters=W.critters.filter(c=>c!==this.herd)}}
      if(a.z<0&&a.t>.03)a.life=0;
    }this.arrows=this.arrows.filter(a=>a.life>0);
  }
  step(d,rt){
    if(WildHunt.active!==this||G.paused||G.modal)return;const dt=rt*G.speed;this.time+=dt;this.flee(d,dt);this.projectiles(dt);
    if(this.body){P.tx=this.body.x;P.ty=this.body.y;if([P,...this.sources].some(s=>Math.hypot(s.x-this.body.x,s.y-this.body.y)<=WILD_HUNT.collect)){this.collected=true;return this.finish()}
      if(this.time-this.collectAt>10)return this.finish('The fallen game is beyond reach.');this.bar();return;
    }
    const live=this.animals.filter(a=>a.hp>0),target=live.sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
    if(!target)return this.finish();const distance=Math.hypot(target.x-P.x,target.y-P.y);
    if(!this.herd.inView(vis())||this.time>WILD_HUNT.duration||distance>WILD_HUNT.escape&&this.alert||this.shots>=WILD_HUNT.shots&&!this.arrows.length)return this.finish('The game escapes. Its tracks lead away.');
    if(Math.min(...this.sources.map(s=>Math.hypot(target.x-s.x,target.y-s.y)))>WILD_HUNT.range-4){P.tx=target.x;P.ty=target.y;this.phase='approach'}else{P.tx=P.ty=null;this.phase='shoot'}
    if(this.time>=this.next&&this.phase==='shoot'){for(const source of this.sources){if(this.shots>=WILD_HUNT.shots)break;if(Math.hypot(target.x-source.x,target.y-source.y)<=WILD_HUNT.range)this.fire(source,target)}this.next=this.time+WILD_HUNT.interval}
    this.bar();
  }
  finish(message){
    if(WildHunt.active!==this)return;WildHunt.active=null;document.getElementById('huntBar')?.remove();P.tx=P.ty=null;G.chase=null;G.paused=this.oldPause;
    this.herd.cool=6;if(this.collected)huntRewards(this.herd,1);else if(message)toast(message);updateHUD(true);
  }
  draw(ents,cam){
    for(const a of this.animals){if(!inSight(a.x,a.y)||a.hp>0&&!spotted(a,vis()))continue;ents.push({y:a.y,f:()=>{const s=critterSprite(this.herd.id,a.hp>0&&a.walk?Math.floor(a.walk/4)%PX.MAP_STEPS:0);ctx.save();ctx.translate(Math.round(a.x-cam.x),Math.round(a.y-cam.y));if(a.hp<=0){ctx.globalAlpha=.65;ctx.scale(1,.35)}else if(a.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),-s.height+1);ctx.restore()}})}
    for(const a of this.arrows)ents.push({y:a.y,f:()=>{ctx.save();ctx.translate(a.x-cam.x,a.y-cam.y-a.z-2);ctx.rotate(Math.atan2(a.vy-a.vz,a.vx));ctx.fillStyle='#e8e4d0';ctx.fillRect(-3,0,6,1);ctx.fillStyle='#c9ced8';ctx.fillRect(3,0,1,1);ctx.restore()}});
  }
}
onAct('hunt-',a=>{if(a==='hunt-start')return WildHunt.start();if(a==='hunt-back'){WildHunt.choice=null;G.mode='world';hidePanel()}});
onWorld(()=>{WildHunt.active=null;WildHunt.choice=null;document.getElementById('huntBar')?.remove()});
Systems.add({name:'hunting',order:{frame:119},frame:(d,dt)=>{WildHunt.active?.step(d,dt);return false}});
