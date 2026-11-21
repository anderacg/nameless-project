'use strict';

const HEROES = {
  champion: { name:'Champion', role:'Fight at the front', description:'A powerful frontline fighter. Challenge dashes into the fight. Second wind restores your health.', q:'Challenge', e:'Second wind', icons:['⚔','✦'], cooldowns:[8,16], hp:360, damage:27, range:35 },
  captain: { name:'Captain', role:'Lead the company', description:'Win through your company. Rally strengthens nearby squads. Advance gives the whole company a burst of speed.', q:'Rally', e:'Advance', icons:['⚑','➶'], cooldowns:[12,14], hp:290, damage:15, range:32 },
  ranger: { name:'Ranger', role:'Strike from range', description:'A mobile ranged hero. Volley rains arrows on a target. Withdraw jumps back and restores some health.', q:'Volley', e:'Withdraw', icons:['➶','↶'], cooldowns:[8,10], hp:230, damage:22, range:220 },
  warden: { name:'Warden', role:'Protect your allies', description:'Keep the company standing. Sanctuary protects allies. Mend heals nearby soldiers and your hero.', q:'Sanctuary', e:'Mend', icons:['◈','✦'], cooldowns:[14,12], hp:330, damage:15, range:65 }
};
const TYPES = {
  shield: { hp:88, damage:11, range:30, speed:48, interval:.85 },
  pike: { hp:67, damage:14, range:53, speed:48, interval:1.1 },
  archer: { hp:43, damage:10, range:225, speed:51, interval:1.45 },
  cavalry: { hp:110, damage:20, range:40, speed:86, interval:1.05 },
  levy: { hp:66, damage:10, range:30, speed:43, interval:1 },
  bruiser: { hp:148, damage:20, range:42, speed:34, interval:1.45 }
};
const SQUAD_SPECS = [
  { id:'shields', name:'Shields', type:'shield', count:8, columns:4, x:350, y:428, icon:'◈' },
  { id:'pikes', name:'Pikes', type:'pike', count:6, columns:3, x:430, y:250, icon:'➶' },
  { id:'archers', name:'Archers', type:'archer', count:6, columns:3, x:185, y:310, icon:'⌁' },
  { id:'cavalry', name:'Riders', type:'cavalry', count:3, columns:2, x:630, y:490, icon:'♞' },
  { id:'bandits', name:'Bandits', type:'levy', count:6, columns:3, x:820, y:315, icon:'⚔', enemy:true },
  { id:'bows', name:'Poachers', type:'archer', count:4, columns:2, x:965, y:190, icon:'⌁', enemy:true },
  { id:'bruisers', name:'Bruisers', type:'bruiser', count:2, columns:2, x:1000, y:448, icon:'✦', enemy:true }
];
const field = document.getElementById('field');
const ctx = field.getContext('2d');
const $ = id => document.getElementById(id);
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const terrain = Art.terrain();
const keys = new Set();
const squadButtons = [...document.querySelectorAll('[data-squad]')];
const orderButtons = [...document.querySelectorAll('[data-order]')];
const view = { width:0, height:0, scale:1, x:0, y:0 };
let chosenHero = 'champion';
let last = 0;
let noticeUntil = 0;

class Battle {
  constructor(heroKind) {
    this.heroKind = heroKind;
    this.time = 0;
    this.speed = 1;
    this.paused = false;
    this.started = false;
    this.ended = false;
    this.won = false;
    this.capture = 0;
    this.contested = false;
    this.cooldowns = [0,0];
    this.effects = [];
    this.arrows = [];
    this.selected = 'shields';
    this.marker = null;
    this.buffUntil = 0;
    this.protectUntil = 0;
    this.hasteUntil = 0;
    this.squads = SQUAD_SPECS.map(spec => ({ ...spec, order:spec.enemy?'guard':'hold', goal:{x:spec.x,y:spec.y}, focus:null }));
    this.units = [];
    for (const squad of this.squads) {
      for (let i=0;i<squad.count;i++) {
        const spacing = squad.type==='cavalry'?68:43;
        const offset = { x:(i%squad.columns-(squad.columns-1)/2)*spacing, y:Math.floor(i/squad.columns)*40 };
        const stats = TYPES[squad.type];
        this.units.push({ ...stats, max:stats.hp, id:this.units.length, type:squad.type, squad:squad.id, team:squad.enemy?'red':'blue', x:squad.x+offset.x, y:squad.y+offset.y, offset, face:squad.enemy?-1:1, timer:(i%3)*.12, moving:false, flash:0, dead:false, hit:0 });
      }
    }
    const hero = HEROES[heroKind];
    this.hero = { id:this.units.length, hero:heroKind, type:heroKind==='ranger'?'archer':'melee', team:'blue', x:490,y:408, hp:hero.hp,max:hero.hp,damage:hero.damage,range:hero.range,speed:86,interval:.8,offset:{x:0,y:0},face:1,timer:0,flash:0,hit:0,goal:null,dead:false,moving:false };
    this.units.push(this.hero);
  }
  living(team) { return this.units.filter(u=>!u.dead&&(!team||u.team===team)); }
  members(id) { return this.units.filter(u=>u.squad===id&&!u.dead); }
  selectedSquads() { return this.squads.filter(s=>!s.enemy&&(this.selected==='all'||this.selected===s.id)); }
  select(id) {
    if (id!=='hero'&&id!=='all'&&!this.members(id).length) return;
    this.selected=id;
    updateHud();
  }
  nearest(unit, enemies) {
    let best=null, d=Infinity;
    for(const enemy of enemies) { const n=distance(unit,enemy); if(n<d) { d=n;best=enemy; } }
    return { unit:best,distance:d };
  }
  command(order, point=null, focus=null) {
    if(this.ended||!this.started)return;
    if(this.selected==='hero') {
      this.hero.goal=point||{x:1080,y:270};
      if(order==='hold')this.hero.goal=null;
      if(order==='attack'&&!point) {
        const enemy=this.nearest(this.hero,this.living('red')).unit;
        this.hero.goal=enemy?{x:enemy.x,y:enemy.y}:{x:1080,y:270};
      }
    } else {
      const squads=this.selectedSquads();
      squads.forEach((s,i)=>{
        const alive=this.members(s.id);
        if(order==='hold') s.goal=centroid(alive);
        if(point) s.goal={x:clamp(point.x+(squads.length>1?(i-1.5)*85:0),70,1190),y:clamp(point.y,125,575)};
        s.order=order;
        s.focus=focus;
      });
    }
    if(point)this.marker={...point,t:1.5};
    updateHud();
  }
  ability(index) {
    if(!this.started||this.ended||this.paused||this.cooldowns[index]>0||this.hero.dead)return false;
    const kind=this.heroKind,h=this.hero;
    this.cooldowns[index]=HEROES[kind].cooldowns[index];
    const enemies=this.living('red');
    const target=this.nearest(h,enemies).unit;
    if(kind==='champion'&&index===0) {
      if(target&&distance(h,target)<310){h.x=target.x-34;h.y=target.y+8;}
      for(const u of enemies)if(distance(h,u)<105)this.hurt(u,52);
      this.ring(h.x,h.y,110,'#f0c86a');
    } else if(kind==='champion') {
      h.hp=Math.min(h.max,h.hp+110);this.ring(h.x,h.y,90,'#b7db8b');
    } else if(kind==='captain'&&index===0) {
      this.buffUntil=this.time+8;
      for(const u of this.living('blue'))u.hp=Math.min(u.max,u.hp+12);
      this.ring(h.x,h.y,250,'#e8c86f');
    } else if(kind==='captain') {
      this.hasteUntil=this.time+7;this.ring(h.x,h.y,270,'#91c8d8');
    } else if(kind==='ranger'&&index===0) {
      if(target){for(const u of enemies)if(distance(u,target)<105){this.hurt(u,48);this.arrows.push({x:h.x,y:h.y-45,tx:u.x,ty:u.y-25,t:.45,max:.45});}this.ring(target.x,target.y,100,'#d9da91');}
    } else if(kind==='ranger') {
      h.x=clamp(h.x-115,50,1200);h.hp=Math.min(h.max,h.hp+45);h.goal=null;this.ring(h.x,h.y,70,'#adc991');
    } else if(index===0) {
      this.protectUntil=this.time+8;this.ring(h.x,h.y,260,'#c1b1d5');
    } else {
      for(const u of this.living('blue'))if(distance(u,h)<310)u.hp=Math.min(u.max,u.hp+u.max*.4);
      this.ring(h.x,h.y,310,'#c5d99e');
    }
    notice(HEROES[kind][index===0?'q':'e']+'!');updateHud();return true;
  }
  ring(x,y,r,color) { this.effects.push({x,y,r,color,t:.8,max:.8}); }
  hurt(unit,damage) {
    if(unit.dead)return;
    const protection=unit.team==='blue'&&this.time<this.protectUntil ? 0.4 : 1;
    unit.hp=Math.max(0,unit.hp-damage*protection);unit.hit=.16;
    if(unit.hp===0){unit.dead=true;unit.moving=false;unit.fell=this.time;}
  }
  move(unit,goal,dt,speed=1) {
    const dx=goal.x-unit.x,dy=goal.y-unit.y,d=Math.hypot(dx,dy);
    if(d<3)return;
    const n=Math.min(d,unit.speed*speed*dt);
    unit.x=clamp(unit.x+dx/d*n,35,1240);unit.y=clamp(unit.y+dy/d*n,115,585);
    if(Math.abs(dx)>1)unit.face=dx>0?1:-1;
    unit.moving=true;
  }
  step(dt) {
    if(!this.started||this.paused||this.ended)return;
    this.time+=dt;
    this.cooldowns=this.cooldowns.map(t=>Math.max(0,t-dt));
    const blue=this.living('blue'),red=this.living('red');
    for(const u of [...blue,...red]) {
      if(u.dead)continue;
      u.timer-=dt;u.flash=Math.max(0,u.flash-dt);u.hit=Math.max(0,u.hit-dt);u.moving=false;
      const squad=this.squads.find(s=>s.id===u.squad);
      let nearest=this.nearest(u,u.team==='blue'?red:blue);
      if(squad?.focus&&!squad.focus.dead)nearest={unit:squad.focus,distance:distance(u,squad.focus)};
      const enemy=nearest.unit;
      const haste=u.team==='blue'&&this.time<this.hasteUntil?1.5:1;
      if(u.hero) {
        let dx=0,dy=0;
        if(keys.has('w')||keys.has('arrowup'))dy--;
        if(keys.has('s')||keys.has('arrowdown'))dy++;
        if(keys.has('a')||keys.has('arrowleft'))dx--;
        if(keys.has('d')||keys.has('arrowright'))dx++;
        if(dx||dy){u.goal=null;this.move(u,{x:u.x+dx*100,y:u.y+dy*100},dt,haste);}
        else if(u.goal){this.move(u,u.goal,dt,haste);if(distance(u,u.goal)<5)u.goal=null;}
        else if(enemy&&nearest.distance>u.range&&nearest.distance<115)this.move(u,enemy,dt,haste);
      } else {
        let goal={x:squad.goal.x+u.offset.x,y:squad.goal.y+u.offset.y};
        if(squad.order==='follow')goal={x:this.hero.x-90+u.offset.x,y:clamp(this.hero.y+50+u.offset.y,125,575)};
        if(squad.order==='attack')goal=enemy||{x:1065+u.offset.x*.3,y:275+u.offset.y*.3};
        if(squad.order==='guard'&&enemy&&nearest.distance<285)goal=enemy;
        const firing=enemy&&nearest.distance<=u.range;
        if(!firing||squad.order==='move'||squad.order==='follow'&&distance(u,goal)>140)this.move(u,goal,dt,haste);
      }
      if(enemy&&!enemy.dead&&distance(u,enemy)<=u.range+5&&u.timer<=0) {
        u.timer=u.interval;u.flash=.32;u.face=enemy.x>=u.x?1:-1;
        let damage=u.damage;
        if(u.team==='blue'&&this.time<this.buffUntil)damage*=1.65;
        if(u.type==='cavalry'&&u.moving)damage*=1.5;
        this.hurt(enemy,damage);
        if(u.range>120)this.arrows.push({x:u.x,y:u.y-41,tx:enemy.x,ty:enemy.y-24,t:.3,max:.3});
        else this.effects.push({x:enemy.x,y:enemy.y-30,r:15,color:'#ffe2a0',t:.22,max:.22,spark:true});
      }
    }
    // A small local separation pass stops squads becoming a single pile in melee.
    const alive=this.living();
    for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++) {
      const a=alive[i],b=alive[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
      const room=a.type==='cavalry'||b.type==='cavalry'?29:21;
      if(d<room&&d>.01) {
        const push=(room-d)*Math.min(.5,dt*5)/d;
        a.x=clamp(a.x-dx*push,35,1240);a.y=clamp(a.y-dy*push,115,585);
        b.x=clamp(b.x+dx*push,35,1240);b.y=clamp(b.y+dy*push,115,585);
      }
    }
    const zone={x:1085,y:280};
    const friendly=this.living('blue').some(u=>distance(u,zone)<100);
    const hostile=this.living('red').some(u=>distance(u,zone)<145);
    this.contested=friendly&&hostile;
    if(friendly&&!hostile)this.capture=Math.min(8,this.capture+dt);
    else if(!friendly)this.capture=Math.max(0,this.capture-dt*.35);
    if(!this.living('red').length) {
      // When the way is clear, the company finishes the rescue without another order.
      for(const s of this.squads.filter(s=>!s.enemy)){s.order='move';s.goal={x:1060,y:275};s.focus=null;}
      if(!this.hero.goal)this.hero.goal={x:1060,y:275};
    }
    if(this.capture>=8)this.finish(true);
    else if(this.hero.dead||!this.living('blue').length)this.finish(false);
    this.effects=this.effects.filter(e=>(e.t-=dt)>0);
    this.arrows=this.arrows.filter(e=>(e.t-=dt)>0);
    if(this.marker)this.marker.t-=dt;
  }
  finish(won) {
    if(this.ended)return;
    this.ended=true;this.won=won;keys.clear();
    $('result-eyebrow').textContent=won?'CONTRACT COMPLETE':'THE COMPANY RETREATS';
    $('result-title').textContent=won?'Supplies secured':'Live to fight again';
    const wounded=this.units.filter(u=>u.team==='blue'&&u.dead).length;
    $('result-description').textContent=won?'The wagon is yours. The village will eat tonight.':'Your hero was overwhelmed. Bring the company together, protect the archers and try another approach.';
    $('result-stats').innerHTML=`<span><b>${won?'120':'0'}</b>gold earned</span><span><b>${wounded}</b>wounded</span><span><b>${Math.floor(this.time/60)}:${String(Math.floor(this.time%60)).padStart(2,'0')}</b>battle time</span>`;
    $('result').hidden=false;updateHud();
  }
}

function centroid(units) {
  if(!units.length)return{x:0,y:0};
  return{x:units.reduce((n,u)=>n+u.x,0)/units.length,y:units.reduce((n,u)=>n+u.y,0)/units.length};
}
let game=new Battle(chosenHero);
// Expose the prototype state for inspection and repeatable browser smoke checks.
window.battlePrototype={get game(){return game;},heroes:HEROES};
function notice(text) { $('notice').textContent=text;noticeUntil=performance.now()+2600;$('notice').classList.add('visible'); }
function reset(kind=chosenHero,start=true) {
  chosenHero=kind;game=new Battle(kind);game.started=start;keys.clear();
  $('result').hidden=true;$('menu').hidden=start;
  updateHud();
  if(start)notice('Tap a squad, then tap where it should go. Secure the wagon!');
}
function togglePause() {
  if(!game.started||game.ended||$('help').open)return;
  game.paused=!game.paused;updateHud();
}
function updateHud() {
  $('allies').textContent=game.living('blue').length;
  $('enemies').textContent=game.living('red').length;
  $('capture').style.width=game.capture/8*100+'%';
  $('objective').textContent=game.contested?'Wagon contested':game.capture>0?'Securing the wagon…':'Capture the wagon';
  $('hero-health').style.width=game.hero.hp/game.hero.max*100+'%';
  $('paused').hidden=!game.paused||!game.started||game.ended;
  $('pause').innerHTML=game.paused?'▶':'<span class="pause-glyph" aria-hidden="true"></span>';
  $('pause').setAttribute('aria-label',game.paused?'Resume battle':'Pause battle');
  $('pause').setAttribute('aria-pressed',String(game.paused));
  $('speed').textContent=game.speed+'×';
  $('hero-button').classList.toggle('selected',game.selected==='hero');
  $('hero-button').setAttribute('aria-pressed',String(game.selected==='hero'));
  for(const button of squadButtons) {
    const id=button.dataset.squad,alive=game.members(id),all=game.units.filter(u=>u.squad===id);
    button.querySelector('b').textContent=alive.length;
    button.style.setProperty('--hp',alive.reduce((n,u)=>n+u.hp,0)/all.reduce((n,u)=>n+u.max,0)*100+'%');
    button.classList.toggle('selected',game.selected===id||game.selected==='all');
    button.setAttribute('aria-pressed',String(game.selected===id||game.selected==='all'));
    button.setAttribute('aria-label',`${button.querySelector('span').textContent}, ${alive.length} soldiers`);
    button.disabled=!alive.length;
  }
  for(const button of orderButtons) {
    const selected=game.selectedSquads();
    const active=selected.length>0&&selected.every(s=>s.order===button.dataset.order);
    button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));
  }
  const h=HEROES[game.heroKind];
  ['q','e'].forEach((id,i)=>{
    const b=$('ability-'+id),cool=game.cooldowns[i];
    b.querySelector('.ability-label').textContent=h[id];b.querySelector('.ability-icon').textContent=h.icons[i];
    b.querySelector('.cooldown').textContent=cool>0?Math.ceil(cool):'';
    b.disabled=cool>0||game.paused||game.ended;
    b.setAttribute('aria-label',h[id]+(cool>0?`, ready in ${Math.ceil(cool)} seconds`:''));
    b.title=h[id]+' ('+id.toUpperCase()+')';
  });
  const selection=game.selected==='hero'?h.name:game.selected==='all'?'Company':game.squads.find(s=>s.id===game.selected)?.name;
  $('selection-hint').textContent=selection+' selected · tap ground to move';
  const portrait=$('portrait').getContext('2d');portrait.clearRect(0,0,100,100);Art.unit(portrait,game.hero,48,108,1.1,0);
}
function resize() {
  const ratio=Math.min(devicePixelRatio||1,2);
  view.width=innerWidth;view.height=innerHeight;
  field.width=Math.round(innerWidth*ratio);field.height=Math.round(innerHeight*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);
  view.scale=Math.min(innerWidth/1280,innerHeight/720);
  view.x=(innerWidth-1280*view.scale)/2;view.y=(innerHeight-720*view.scale)/2;
}
function banner(g,x,y,squad,alive) {
  const size=game.selected===squad.id||game.selected==='all'&&!squad.enemy?1.12:1;
  g.save();g.translate(x,y);g.scale(size,size);
  const color=squad.enemy?'#ad654a':'#4b86a4';
  Art.path(g,'M-17 -22 L17 -22 L17 6 L0 14 L-17 6Z',Art.gradient(g,-15,-22,32,35,[squad.enemy?'#da9770':'#8bbbc4',color]),'#50452d',2);
  g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f5e5b8';g.font='bold 23px Georgia';g.fillText(squad.icon,0,-4);
  const hp=alive.reduce((n,u)=>n+u.hp,0)/(squad.count*TYPES[squad.type].hp);
  g.beginPath();g.roundRect(-23,19,46,7,4);g.fillStyle='#3f4a2b';g.fill();
  g.beginPath();g.roundRect(-21.5,20.5,Math.max(1,43*hp),4,2);g.fillStyle=squad.enemy?'#d9ab6a':'#b6ce73';g.fill();
  g.restore();
}
function draw() {
  const g=ctx;
  g.clearRect(0,0,view.width,view.height);g.fillStyle='#8da35c';g.fillRect(0,0,view.width,view.height);
  g.save();g.translate(view.x,view.y);g.scale(view.scale,view.scale);
  g.drawImage(terrain,0,0);
  const pulse=(Math.sin(game.time*2)+1)/2;
  g.beginPath();g.ellipse(1085,280,105,61,0,0,Math.PI*2);g.fillStyle=game.contested?'#be765b24':'#f6dd8f25';g.fill();g.strokeStyle=game.contested?'#ae725a':'#eed383';g.lineWidth=2+pulse;g.setLineDash([7,7]);g.stroke();g.setLineDash([]);
  Art.wagon(g,1100,233,game.won);
  if(game.capture>0) {
    g.beginPath();g.ellipse(1085,280,105,61,0,-Math.PI/2,-Math.PI/2+Math.PI*2*game.capture/8);g.strokeStyle='#ffe2a0';g.lineWidth=5;g.stroke();
  }
  const selected=game.selectedSquads();
  for(const s of selected) {
    const alive=game.members(s.id);if(!alive.length)continue;
    const c=centroid(alive),width=s.type==='cavalry'?140:((s.columns-1)*43+65),height=s.type==='cavalry'?110:90;
    g.beginPath();g.roundRect(c.x-width/2,c.y-height/2+14,width,height,24);g.fillStyle='#8bd4e918';g.fill();g.strokeStyle='#b7def0aa';g.lineWidth=2;g.stroke();
    if(s.order==='move') {
      g.beginPath();g.moveTo(c.x,c.y+16);g.lineTo(s.goal.x,s.goal.y+12);g.strokeStyle='#d8e7ba88';g.lineWidth=2;g.setLineDash([6,7]);g.stroke();g.setLineDash([]);
    }
  }
  for(const u of game.units.slice().sort((a,b)=>a.y-b.y)) {
    if(u.dead&&game.time-u.fell>3)continue;
    const chosen=u.hero?game.selected==='hero':game.selected===u.squad||game.selected==='all'&&u.team==='blue';
    if(!u.dead) {
      Art.ellipse(g,u.x,u.y+2,u.type==='cavalry'?32:17,5,u.hero?'#e8cc70aa':u.team==='blue'?'#5793af55':'#a6614555');
      if(chosen||u.hero) {
        g.beginPath();g.ellipse(u.x,u.y+2,u.type==='cavalry'?33:20,7,0,0,Math.PI*2);g.strokeStyle=u.hero?'#ffe8a4':'#a3d6e8';g.lineWidth=2;g.stroke();
      }
    }
    g.save();if(u.hit>0)g.filter='brightness(1.4)';
    Art.unit(g,u,u.x,u.y,u.hero ? 0.86 : 0.72,game.time);g.restore();
    if(u.hero&&!u.dead){g.font='24px Georgia';g.textAlign='center';g.fillStyle='#ffe6a0';g.strokeStyle='#7f6535';g.lineWidth=2;g.strokeText('★',u.x,u.y-81);g.fillText('★',u.x,u.y-81);}
  }
  for(const s of game.squads) {
    const alive=game.members(s.id);if(!alive.length)continue;
    const c=centroid(alive),y=Math.min(...alive.map(u=>u.y))-(s.type==='cavalry'?91:86);
    banner(g,c.x,y,s,alive);
  }
  for(const arrow of game.arrows) {
    const t=1-arrow.t/arrow.max,x=arrow.x+(arrow.tx-arrow.x)*t,y=arrow.y+(arrow.ty-arrow.y)*t-Math.sin(t*Math.PI)*25;
    g.save();g.translate(x,y);g.rotate(Math.atan2(arrow.ty-arrow.y,arrow.tx-arrow.x));
    Art.path(g,'M-13 0 L5 0',null,'#57482e',2);Art.path(g,'M5 -3 L12 0 L5 3Z','#f2e7c1','#776e4d',1);g.restore();
  }
  for(const e of game.effects) {
    const t=1-e.t/e.max;g.save();g.globalAlpha=1-t;
    g.strokeStyle=e.color;g.lineWidth=e.spark?2:4;g.beginPath();
    if(e.spark){for(let i=0;i<6;i++){const a=i*Math.PI/3;g.moveTo(e.x+Math.cos(a)*3,e.y+Math.sin(a)*3);g.lineTo(e.x+Math.cos(a)*(e.r+t*12),e.y+Math.sin(a)*(e.r+t*12));}}
    else g.ellipse(e.x,e.y,e.r*(.6+t*.4),e.r*(.6+t*.4)*.55,0,0,Math.PI*2);
    g.stroke();g.restore();
  }
  if(game.marker&&game.marker.t>0){g.save();g.globalAlpha=Math.min(1,game.marker.t);g.strokeStyle='#fff1ac';g.lineWidth=3;g.beginPath();g.ellipse(game.marker.x,game.marker.y,20,8,0,0,Math.PI*2);g.stroke();g.restore();}
  g.restore();
}
function canvasPoint(event) {
  const r=field.getBoundingClientRect();
  return{x:(event.clientX-r.left-view.x)/view.scale,y:(event.clientY-r.top-view.y)/view.scale};
}
field.addEventListener('pointerdown',event=>{
  if(!game.started||game.ended||$('help').open)return;
  event.preventDefault();field.focus({preventScroll:true});
  const p=canvasPoint(event),touch=event.pointerType==='touch';
  let bannerHit=null,best=Infinity;
  for(const s of game.squads.filter(s=>!s.enemy)) {
    const alive=game.members(s.id);if(!alive.length)continue;
    const c=centroid(alive),y=Math.min(...alive.map(u=>u.y))-(s.type==='cavalry'?91:86);
    const d=Math.hypot(p.x-c.x,p.y-y);
    if(d<(touch?24/view.scale:28)&&d<best){bannerHit=s.id;best=d;}
  }
  if(bannerHit){game.select(bannerHit);return;}
  const clicked=game.units.filter(u=>!u.dead).map(u=>({u,d:Math.hypot(p.x-u.x,p.y-(u.y-23))})).sort((a,b)=>a.d-b.d)[0];
  if(clicked&&clicked.d<(touch?22/view.scale:26)) {
    if(clicked.u.team==='blue'){game.select(clicked.u.hero?'hero':clicked.u.squad);return;}
    game.command('attack',{x:clicked.u.x,y:clicked.u.y},clicked.u);notice('Focus the enemy!');return;
  }
  game.command('move',{x:clamp(p.x,40,1210),y:clamp(p.y,125,575)});
});
squadButtons.forEach(button=>{
  button.addEventListener('click',()=>game.select(button.dataset.squad));
  const unit=game.units.find(u=>u.squad===button.dataset.squad),g=button.querySelector('canvas').getContext('2d');
  Art.unit(g,unit,22,51,.46,0);
});
orderButtons.forEach(button=>button.addEventListener('click',()=>{
  game.command(button.dataset.order);
  notice(button.textContent.trim()+' · '+(game.selected==='all'?'whole company':game.selected==='hero'?HEROES[game.heroKind].name:game.squads.find(s=>s.id===game.selected).name));
}));
$('hero-button').addEventListener('click',()=>game.select('hero'));
$('all').addEventListener('click',()=>game.select('all'));
$('ability-q').addEventListener('click',()=>game.ability(0));
$('ability-e').addEventListener('click',()=>game.ability(1));
$('pause').addEventListener('click',togglePause);
$('speed').addEventListener('click',()=>{game.speed=game.speed===1?2:1;updateHud();});
$('begin').addEventListener('click',()=>reset(chosenHero));
$('again').addEventListener('click',()=>reset(chosenHero));
$('change-hero').addEventListener('click',()=>reset(chosenHero,false));
let wasPaused=false;
$('mission').addEventListener('click',()=>{wasPaused=game.paused;game.paused=true;keys.clear();$('help').showModal();updateHud();});
$('close-help').addEventListener('click',()=>$('help').close());
$('help').addEventListener('close',()=>{game.paused=wasPaused;updateHud();});
for(const [id,h] of Object.entries(HEROES)) {
  const button=document.createElement('button');button.type='button';button.dataset.hero=id;
  button.innerHTML=`<canvas width="100" height="100"></canvas><strong>${h.name}</strong><small>${h.role}</small>`;
  const u=new Battle(id).hero;
  Art.unit(button.querySelector('canvas').getContext('2d'),u,48,96,.9,0);
  button.addEventListener('click',()=>{
    chosenHero=id;
    document.querySelectorAll('[data-hero]').forEach(b=>{b.classList.toggle('selected',b.dataset.hero===id);b.setAttribute('aria-pressed',String(b.dataset.hero===id));});
    $('hero-description').textContent=h.description;
  });
  $('hero-choices').appendChild(button);
}
document.querySelector('[data-hero="champion"]').click();
addEventListener('keydown',event=>{
  if($('help').open||!game.started||game.ended)return;
  const key=event.key.toLowerCase();
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))event.preventDefault();
  keys.add(key);
  if(event.repeat)return;
  if(key===' ')togglePause();
  if(key==='h')game.select('hero');
  if(key==='q')game.ability(0);
  if(key==='e')game.ability(1);
  if('1234'.includes(key))game.select(SQUAD_SPECS[Number(key)-1].id);
  if(key==='f')game.select('all');
});
addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
addEventListener('blur',()=>{keys.clear();if(game.started&&!game.ended){game.paused=true;updateHud();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.started&&!game.ended){game.paused=true;keys.clear();updateHud();}});
addEventListener('resize',resize);
let hudTimer=0;
function loop(now) {
  const dt=Math.min(.05,(now-last)/1000||0);last=now;
  let left=dt*game.speed;
  while(left>0){const step=Math.min(left,1/60);game.step(step);left-=step;}
  draw();
  hudTimer+=dt;if(hudTimer>.1){updateHud();hudTimer=0;}
  if(now>noticeUntil)$('notice').classList.remove('visible');
  requestAnimationFrame(loop);
}
resize();updateHud();requestAnimationFrame(loop);
