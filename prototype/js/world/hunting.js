'use strict';
/* A bounded world hunt uses actual marching hunters and actual wildlife. The boundary never traps prey. */
class WildHunt{
  static active=null;static choice=null;static armed=false;
  static heroSource={id:-1,type:'hero',character:true,row:'hero',index:0,get x(){return P.x},get y(){return P.y},set x(v){P.x=v},set y(v){P.y=v}};
  static pool(method='ranged'){
    const army=MarchArmy.of(P);army.sync();const troops=army.units.filter(u=>!u.dead&&!u.character&&(method==='ranged'?ST[u.type]?.range&&!ST[u.type].magic:ST[u.type]&&!ST[u.type].range)),hero=!!mainI()&&(method==='melee'?heroKind()==='melee':heroKind()==='ranged');return hero?[this.heroSource,...troops]:troops;
  }
  static hunters(method='ranged'){return this.pool(method).slice(0,HUNT_AREA.hunters)}
  static toggle(){if(this.active)return this.active.finish('You end the hunt.');this.armed=!this.armed;toast(this.armed?'Hunting area: hold a spot on the map to choose your ground.':'Hunting area selection cancelled.');this.controls()}
  static controls(){for(const e of document.querySelectorAll('[data-act="hunt-area"]')){e.classList.toggle('on',this.armed||!!this.active);e.setAttribute('aria-pressed',String(this.armed||!!this.active));e.textContent=this.active?'End hunt':'Hunting area'}}
  static prey(area){return W.critters.map(asHerd).filter(c=>c.wild&&c.n>0&&Math.hypot(c.x-area.x,c.y-area.y)<=HUNT_AREA.radius&&c.inView(vis()))}
  static prepare(c){if(this.active)return this.active.select(c);if(!c?.wild||!c.n||!W.critters.includes(c)||!c.inView(vis())||P.stay||B)return false;return this.preview(c.x,c.y,c)}
  static preview(x,y,target=null){
    if(this.active||B||P.stay||G.mode!=='world')return false;this.armed=false;this.controls();const method=this.pool('ranged').length?'ranged':'melee';this.choice={x,y,target,method,selected:this.hunters(method).map(u=>u.id)};this.setup();return true;
  }
  static setup(){
    const c=this.choice;if(!c)return;const pool=this.pool(c.method),prey=this.prey(c),ready=c.selected.length>0&&prey.length>0;
    G.mode='dialog';G.chase=null;P.tx=P.ty=null;
    showPanel('<div class="top"><h2>Hunting area</h2></div><p>'+prey.length+' visible wildlife group'+(prey.length===1?'':'s')+' in this fixed circle. Animals can escape beyond it; hunters stay inside.</p><div class="btns">'+['ranged','melee'].map(m=>fbBtn('hunt-method',m,m==='ranged'?'Ranged hunt':'Melee hunt',this.pool(m).length?'':'No fit hunters available',c.method===m?'on':'')).join('')+'</div><p>Choose up to '+HUNT_AREA.hunters+' hunters · '+c.selected.length+' selected</p><div class="hunt-picker">'+pool.slice(0,24).map(u=>fbBtn('hunt-pick',String(u.id),htmlText(u.character?'Hero':ST[u.type].n+' '+(u.id+1)),'',c.selected.includes(u.id)?'on':'')).join('')+'</div><p class="muted">Ranged hunters approach to shooting distance. Melee hunters must reach the animal. Your current stamina and army travel pace still apply.</p>'+nav(['hunt-back',null,'Cancel'],['hunt-start',null,'Begin hunt',ready?'':'Select hunters and an area with visible wildlife']));panel.classList.add('hunt-setup');
  }
  static start(){
    const c=this.choice;if(!c||B||G.mode!=='dialog')return false;const hunters=this.pool(c.method).filter(u=>c.selected.includes(u.id)).slice(0,HUNT_AREA.hunters);if(!hunters.length||!this.prey(c).length)return false;
    this.choice=null;this.active=new WildHunt(c,hunters);this.controls();return true;
  }
  constructor(area,sources){
    this.x=area.x;this.y=area.y;this.radius=HUNT_AREA.radius;this.method=area.method;this.sources=sources;this.time=0;this.next=0;this.shots=0;this.arrows=[];this.actors=new Map();this.cooldowns=new Map();this.goals=new Map();this.home=new Map();this.revision=0;this.pursue=false;this.moveArmed=false;this.phase='Choose prey';this.oldPause=G.paused;
    for(const u of MarchArmy.of(P).units)this.home.set(u.row+':'+u.index,{x:u.x,y:u.y});
    breakCamp();followStop();G.chase=null;G.pitch=null;G.byRoad=null;if(G.hurry)setHurry(false);G.mode='world';G.paused=false;hidePanel();this.select(area.target||WildHunt.prey(this)[0]);this.bar();
  }
  inside(p){return Math.hypot(p.x-this.x,p.y-this.y)<=this.radius}
  clamp(p){const dx=p.x-this.x,dy=p.y-this.y,d=Math.hypot(dx,dy),r=this.radius-2;return d>r?{x:this.x+dx*r/d,y:this.y+dy*r/d}:{x:p.x,y:p.y}}
  actor(c){let a=this.actors.get(c);if(!a){a={herd:c,hp:CRITTERS[c.id].size*4,max:CRITTERS[c.id].size*4,team:1,s:{big:CRITTERS[c.id].size>=3},alert:0,vx:0,vy:0,x:c.x,y:c.y};this.actors.set(c,a)}return a}
  select(c){if(!c||!c.wild||!c.n||!this.inside(c)||!c.inView(vis())||this.body)return false;this.target=this.actor(c);this.lost=0;this.phase='Approaching';this.manual=null;this.bar();return true}
  threatFor(c){const a=this.actors.get(c);if(!a||a.alert<1)return null;const u=Spatial.nearest(this.sources,c.x,c.y);return u&&Math.hypot(u.x-c.x,u.y-c.y)<CRITTERS[c.id].shy+20?u:null}
  goalFor(row,index){return this.goals.get(row+':'+index)||this.home.get(row+':'+index)}
  setGoal(u,p){p=this.clamp(p);const key=u.row+':'+u.index,old=this.goals.get(key);if(!old||Math.hypot(old.x-p.x,old.y-p.y)>1){this.goals.set(key,p);this.revision++}if(u.type==='hero'){P.tx=p.x;P.ty=p.y}}
  order(x,y){this.moveArmed=false;this.manual=this.clamp({x,y});this.phase='Moving hunters';this.bar()}
  collect(){if(this.body){this.collecting=true;this.phase='Collecting game';this.bar()}}
  damage(a,n){a.hp-=n;if(a.hp>0)return;const c=a.herd;c.n=Math.max(0,c.n-1);this.body={x:c.x,y:c.y,id:c.id,herd:c};this.collecting=false;this.phase='Game down · Collect';this.arrows=[];if(!c.n)W.critters=W.critters.filter(o=>o!==c);this.target=null;this.bar()}
  fire(source,a){
    const c=a.herd,hidden=hiddenAt(source.x,source.y)&&a.alert<1,chance=clamp((hidden?.85:a.alert>=1?.5:.65)+skill('hunt')*.025,.4,.96),hit=Math.random()<chance,d=Math.hypot(a.x-source.x,a.y-source.y),lead=d/HUNT_AREA.arrow,x=a.x+a.vx*lead,y=a.y-3+a.vy*lead+(hit?0:10+Math.random()*8),angle=Math.atan2(y-source.y,x-source.x);
    this.arrows.push({x:source.x,y:source.y-3,vx:Math.cos(angle)*HUNT_AREA.arrow,vy:Math.sin(angle)*HUNT_AREA.arrow,life:d/HUNT_AREA.arrow+.35,team:0,dmg:ST[source.type]?.dmg||P.heroStats().dmg});this.shots++;a.alert=1;TravelAwareness.notice(c,source.row);if(sfxOn())sfxAt('loose',source.x,source.y);
  }
  projectiles(dt){
    const animals=[...this.actors.values()].filter(a=>a.herd.n>0);
    for(const a of this.arrows){const from={x:a.x,y:a.y};a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;const hit=this.body?null:worldMissileHit(a,from,false,animals,.5);if(hit){a.life=0;this.damage(hit,a.dmg)}}this.arrows=this.arrows.filter(a=>a.life>0);
  }
  step(d,rt){
    if(WildHunt.active!==this||G.paused||G.modal)return;const dt=rt*G.speed;this.time+=dt;
    for(const c of W.critters)if(c.wild&&(this.inside(c)||this.actors.has(c))){const a=this.actor(c);a.vx=(c.x-a.x)/Math.max(.001,dt);a.vy=(c.y-a.y)/Math.max(.001,dt);a.x=c.x;a.y=c.y;const hunter=Spatial.nearest(this.sources,c.x,c.y),distance=hunter?Math.hypot(c.x-hunter.x,c.y-hunter.y):Infinity;if(distance<CRITTERS[c.id].shy*(hunter&&hiddenAt(hunter.x,hunter.y)?.6:1))a.alert=Math.min(1,a.alert+dt/(hiddenAt(hunter.x,hunter.y)?4:2));if(distance<HUNT_AREA.contact)a.alert=1}
    this.projectiles(dt);
    if(this.target){const a=this.target,c=a.herd;if(!W.critters.includes(c)||!c.n||!this.inside(c)||!c.inView(vis())){this.lost=(this.lost||0)+dt;if(this.lost>=HUNT_AREA.escape){this.target=null;this.phase='Prey escaped · choose another';this.bar()}}else this.lost=0}
    const target=this.target,prey=target?.herd,threat=target&&target.alert>=1;
    for(const u of this.sources){
      if(!this.inside(u)){this.setGoal(u,{x:this.x,y:this.y});continue}
      if(this.body&&this.collecting){this.setGoal(u,this.body);if(Math.hypot(u.x-this.body.x,u.y-this.body.y)<=HUNT_AREA.collect){huntRewards(this.body.herd,1);this.body=null;this.collecting=false;this.goals.clear();this.revision++;this.phase='Game collected · choose prey';this.bar();break}continue}
      if(this.body){this.setGoal(u,u);continue}if(this.manual){this.setGoal(u,this.manual);continue}if(!prey||this.lost){this.setGoal(u,u);continue}
      const stats=u.character?P.heroStats():ST[u.type],range=this.method==='ranged'?Math.min(HUNT_AREA.range,(stats.range||(u.character?heroRange():0))*WORLD_BATTLE.sprite/WORLD_BATTLE.scale):Math.max(2,(stats.reach||11)*WORLD_BATTLE.sprite/WORLD_BATTLE.scale),dist=Math.hypot(prey.x-u.x,prey.y-u.y);
      if(dist>range){if(!threat||this.pursue){this.setGoal(u,prey);this.phase=threat?'Pursuing':'Approaching'}else{this.setGoal(u,u);this.phase='Prey fleeing · Pursue to follow'}}else{
        this.setGoal(u,u);this.phase=this.method==='ranged'?'Taking the shot':'Melee hunting';
        if(this.time>=(this.cooldowns.get(u)||0)){this.cooldowns.set(u,this.time+Math.max(.6,stats.cd||HUNT_AREA.interval));if(this.method==='ranged'){if(this.shots<HUNT_AREA.shots)this.fire(u,target);else this.phase='Out of shots · switch to melee'}else{target.alert=1;this.damage(target,stats.dmg||5);if(this.body)break}}
      }
    }
    if(P.tx!=null&&this.sources.some(u=>u.type==='hero')&&Math.hypot(P.x-P.tx,P.y-P.ty)<2)P.tx=P.ty=null;
    if(this.time>=(this.uiAt||0)){this.uiAt=this.time+.25;this.bar()}
  }
  methodTo(method){const pool=WildHunt.pool(method);if(!pool.length)return false;P.tx=P.ty=null;this.method=method;this.sources=pool.slice(0,HUNT_AREA.hunters);this.goals.clear();this.revision++;this.manual=null;this.bar();return true}
  bar(){
    let el=document.getElementById('huntBar');if(!el){el=document.createElement('div');el.id='huntBar';el.className='hunt-bar';el.innerHTML='<div class="hunt-heading"><strong></strong><span></span></div><div class="hunt-actions"><button type="button" data-hunt="pursue"></button><button type="button" data-hunt="method"></button><button type="button" data-hunt="move">Move</button><button type="button" data-hunt="collect">Collect</button><button type="button" data-hunt="end">End hunt</button></div><div class="hunt-targets"></div>';document.getElementById('screen').appendChild(el);
      el.addEventListener('click',e=>{const b=e.target.closest('[data-hunt]');if(!b)return;const a=b.dataset.hunt;if(a==='end')this.finish('You end the hunt.');else if(a==='collect')this.collect();else if(a==='pursue'){this.pursue=!this.pursue;this.bar()}else if(a==='move'){this.moveArmed=true;toast('Tap inside the hunting circle to position your hunters.')}else if(a==='method')this.methodTo(b.dataset.method);else if(a==='target')this.select(W.critters[+b.dataset.index])});
    }
    el.querySelector('strong').textContent='Hunting area · '+this.method;el.querySelector('.hunt-heading span').textContent=this.phase+(this.target?' · '+EscapeStamina.state(this.target.herd)+' '+Math.round(EscapeStamina.ratio(this.target.herd)*100)+'%':'');
    const pursue=el.querySelector('[data-hunt="pursue"]'),method=el.querySelector('[data-hunt="method"]');pursue.textContent=this.pursue?'Pursuing':'Approach';pursue.setAttribute('aria-pressed',String(this.pursue));method.textContent=this.method==='ranged'?'Melee':'Ranged';method.dataset.method=this.method==='ranged'?'melee':'ranged';method.disabled=!WildHunt.pool(method.dataset.method).length;el.querySelector('[data-hunt="collect"]').disabled=!this.body;
    const list=el.querySelector('.hunt-targets'),text=WildHunt.prey(this).map(c=>'<button type="button" data-hunt="target" data-index="'+W.critters.indexOf(c)+'" aria-pressed="'+(this.target?.herd===c)+'">'+htmlText(CRITTERS[c.id].n)+' '+c.n+'</button>').join('');if(list.innerHTML!==text)list.innerHTML=text;
  }
  finish(message){
    if(WildHunt.active!==this)return;WildHunt.active=null;document.getElementById('huntBar')?.remove();P.tx=P.ty=null;G.chase=null;G.paused=this.oldPause;const army=MARCH_ARMIES.get(P);if(army)army.ground=null;WildHunt.controls();if(message)toast(message);updateHUD(true);
  }
  draw(ents,cam){
    if(this.body){const b=this.body;ents.push({y:b.y,f:()=>{const s=critterSprite(b.id);ctx.save();ctx.translate(Math.round(b.x-cam.x),Math.round(b.y-cam.y));ctx.scale(1,.35);ctx.drawImage(s,-(s.width>>1),-s.height+1);ctx.restore()}})}
    for(const a of this.arrows)ents.push({y:a.y,f:()=>{ctx.save();ctx.translate(a.x-cam.x,a.y-cam.y);ctx.rotate(Math.atan2(a.vy,a.vx));ctx.fillStyle='#e8e4d0';ctx.fillRect(-3,0,6,1);ctx.restore()}});
  }
  static drawArea(cam){const a=this.active||this.choice;if(!a)return;const k=(window.devicePixelRatio||1)/VS;ctx.save();ctx.strokeStyle='#d8c179';ctx.lineWidth=1.5*k;ctx.setLineDash([6*k,4*k]);ctx.beginPath();ctx.arc(a.x-cam.x,a.y-cam.y,HUNT_AREA.radius,0,Math.PI*2);ctx.stroke();ctx.restore()}
}
onAct('hunt-',(a,arg)=>{if(a==='hunt-area')return WildHunt.toggle();if(a==='hunt-start')return WildHunt.start();const c=WildHunt.choice;if(a==='hunt-back'){WildHunt.choice=null;G.mode='world';hidePanel();return}if(!c)return;if(a==='hunt-method'&&WildHunt.pool(arg).length){c.method=arg;c.selected=WildHunt.hunters(arg).map(u=>u.id)}if(a==='hunt-pick'){const id=+arg;if(c.selected.includes(id))c.selected=c.selected.filter(n=>n!==id);else if(c.selected.length<HUNT_AREA.hunters)c.selected.push(id)}WildHunt.setup()});
onWorld(()=>{WildHunt.active=null;WildHunt.choice=null;WildHunt.armed=false;document.getElementById('huntBar')?.remove()});
Systems.add({name:'hunting',order:{frame:119},frame:(d,dt)=>{WildHunt.active?.step(d,dt);return false}});
