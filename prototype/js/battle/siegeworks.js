'use strict';
/* ---------- a siege's walls on the field (the owner, 2026-11-06: real siege walls, now; doc/INTERIORS_DESIGN.md §4): the
   assault on a walled holding (kind 'siege', wallOf > 0) is fought against its wall, not across an open field. The wall runs
   down the field, the holding behind it (east), your army before it (west): a wall-walk raised SIEGE_WALL.lv levels (a
   palisade 1, stone 2) with a sheer face outside (no climbing it but by a ladder) and inside but for its stairs; towers along
   it; the gate in its middle, shut (rock on the cells: no way through, nothing seen through) till the ram breaks it, then a
   way in. Your ladders (built in camp: the assault needs them) are the places the outer face can be climbed, a man at a time;
   the ram (built in camp by RAM_DAYS) is worked by your foot standing at the gate. The defenders' shooters man the wall-walk,
   their foot waits behind the gate, their lords in the yard, all of them holding their posts till roused (interior.js
   insideRoused: a foe near, one of theirs hurt, the gate broken). Everyone on foot. The wall is the battle terrain's (levels,
   cliffs and rock: BattleTerrain.raster plan.siege), so routes, sight, high ground and the ways off the field obey it; its
   look is painted over the climate's ground (SiegeArt). SIEGE_WALL.on false: the open field, as before ---------- */
/* SIEGE_WALL, the one table. on; x: the wall's outer face, a share of the field's width; thick: the wall-walk's width (cells);
   lv: its height by the holding's walls (WALL_N: none, palisade, stone, great); gate: the gate's rows (cells); hp: its strength by
   the walls; ram: its harm a second for each of your foot at it (px: within ramR of its face); towers: one every so many rows
   (cells; great walls tower: as many again); stairs: one every so many rows (cells), stair: its width (cells); ladders: how
   many, ladder: each one's width (cells); look: each kind of wall's colours [light, mid, dark, deep] */
// cover: the harm taken by a man on the wall-walk from a shot loosed below it (its merlons); hold: px inside a gap the defenders' foot stand to hold it
const SIEGE_WALL={on:true,x:.6,thick:3,lv:[0,1,2,2],gate:4,hp:[0,260,480,720],ram:12,ramR:26,towers:12,tower:2,stairs:9,stair:2,ladders:3,ladder:1,cover:.5,hold:34,
  look:{stake:['#cb804a','#a15735','#682a19','#3a1c10'],stone:['#d8d2c6','#b0a99c','#857e74','#4e4a45'],great:['#e4dfd4','#bfb8aa','#918a7e','#56514a']}};
/* SIEGE_ENGINE, the siege engines (the owner, 2026-11-10: "wall collapse from siege weapons"): your camp's trebuchets (world/siege.js:
   the first after days of the siege, one more each more days, most at most) stand back range px from the wall's outer face, gap px
   apart, each loosing a stone every every s (its first at first s) at its mark: the section you clicked, else the weakest standing;
   a stone flies flight s, hits its section by hit (else lands miss px off), takes dmg from it and hurts men within splash px by
   hurt. The wall in sections of section rows between the gate and its towers, each hp[walls] strong, a tower tower times that; one
   at nothing collapses into a rubble slope (rubble levels: climbed from either side, sheer to the walk still standing beside it),
   its men falling, hurt by fall. def: behind walls of lv or more the defenders' mangonel on the tower nearest the gate, a stone at
   one of your engines every every s, by hit, dmg of its hp; its tower down, it is lost */
const SIEGE_ENGINE={on:true,days:6,more:3,most:3,range:330,gap:90,every:[8,11],first:[3,6],flight:1.8,hit:.7,miss:[26,60],dmg:[85,125],splash:22,hurt:[18,34],
  section:5,hp:[0,220,380,520],tower:1.6,rubble:1,fall:[16,32],hp0:200,def:{lv:2,every:[10,13],first:[6,9],hit:.45,dmg:[60,90]}};
/* SIEGE_TOWN, the town behind the wall (the owner: "check and improve siege battle"; its yard was bare grass): its centre building (its
   kind's: a citadel, a keep, a hall, a fort) at centre of the yard's width on the gate's street, its houses (its own lots' kinds) in
   cells of cell px across the yard, fill of them taken, jit px off their cell's middle, none within street px of the gate's row
   nor within inset px of the wall nor edge px of the field's ends; each drawn k times its model and a footprint foot (its share of
   the picture's width and height) at its feet that the field's buildings block, gap px kept between two; the centre one kc times
   its model (the castle's keep, big), k if it does not fit, towers towers flanking it; the bailey's ground trodden earth (earth by
   climate) but for patches of grass, a cobbled road road[0] px wide from the gate to the court, road[1] on to the keep */
const SIEGE_TOWN={on:true,k:2,kc:3,towers:2,road:[24,18],earth:{grass:['#8d7c5a','#7d6c4c','#9c8a66'],swamp:['#6e6248','#5e5440','#7c6e52'],forest:['#806e4e','#705f42','#8e7c5a'],frost:['#d6dbde','#c2c8cc','#e4e8ea'],desert:['#c8a878','#b89868','#d4b88a']},centre:.6,cell:74,fill:.55,jit:10,street:46,inset:84,edge:22,foot:[.72,.42],gap:6,kinds:['house','smithy','tavern','chapel','granary','warehouse']};
/* SIEGE_FIGHT, the fight at the wall (the owner, 2026-11-10: "improve the walls and ladders and siege details"). ladder: a defender
   on the walk within reach px of a ladder's top, none of yours up there and one of yours on it or at its foot, they throw it down by
   odds each look s, those of yours on it falling (hurt by fall); its row's face sheer till your foot stand within foot px of its foot
   for raise s. pitch: while the ram works the gate's defenders pour pitch (a palisade's, stones) on its crew within r px of the gate,
   every every s (the first after first), each man hurt by hurt. mantlet: your camp's n wooden mantlets stand out px from the wall, gap
   px apart, none within gate px of the gate's middle nor on a ladder's rows (where one thrown down lies); a man of yours behind one (within back px west of it, half px of its middle)
   takes cover of the harm of a shot from the wall's side. flag: the lord's standard in the castle's court, x px in from the wall
   (short of its keep), its court court px about it kept clear; held by yours alone within r px of it for hold s (lost again at
   decay a second while theirs alone stand there), it is taken and every defender breaks */
const SIEGE_FIGHT={flag:{on:true,x:130,court:62,r:44,hold:8,decay:.5,k:2},ladder:{on:true,look:1.2,reach:26,odds:.3,foot:34,raise:5,fall:[10,20]},pitch:{on:true,every:[8,11],first:[4,6],hurt:[6,12],r:28},
  mantlet:{on:true,n:[3,5],out:60,gap:70,gate:40,back:20,half:12,cover:.5}};
const sRand=([a,b])=>a+Math.random()*(b-a);// (a draw between a and b: the battle's, Math.random)
class SiegeWorks{
  static on(e){return SIEGE_WALL.on&&!!e&&e.kind==='siege'&&!!e.ref&&typeof e.ref.walled==='function'&&e.ref.walled()&&wallOf(e.ref)>0}
  // t: the holding; W, top, bot: the field; o: {ram: the ram built, seed}
  constructor(t,W,top,bot,o){const S=SIEGE_WALL,cs=TERRAIN.cs,w=wallOf(t);Object.assign(this,{t,W,top,bot,cs,w,ram:!!o.ram,seed:o.seed>>>0});
    this.kind=w>=3?'great':w>=2?'stone':'stake';this.L=S.lv[w]||1;this.hp=this.hp0=S.hp[w]||S.hp[1];this.open=false;
    const C=Math.ceil(W/cs),R0=Math.max(0,Math.floor(top/cs)),R1=Math.min(Math.ceil(bot/cs)-1,Math.ceil(BH/cs)-1),c0=Math.round(W*S.x/cs);
    Object.assign(this,{C,R0,R1,c0,c1:c0+S.thick-1});const mid=Math.round((R0+R1)/2),R=seeded(this.seed||1),g=S.gate;
    this.g0=mid-(g>>1);this.g1=this.g0+g-1;
    // (towers flank the gate and stand every S.towers rows; stairs inside between them; ladders on stretches clear of both)
    const T=[this.g0-S.tower-1,this.g1+2],every=w>=3?S.towers>>1:S.towers;for(let r=this.g0-S.tower-1-every;r>R0+1;r-=every)T.push(r);for(let r=this.g1+2+every;r<R1-S.tower;r+=every)T.push(r);
    this.towers=T.filter(r=>r>R0&&r+S.tower-1<R1);const busy=r=>r>=this.g0-1&&r<=this.g1+1||this.towers.some(q=>r>=q-1&&r<=q+S.tower);
    this.stairs=[];for(let r=R0+3;r<R1-2;r+=S.stairs){let q=r;while(q<R1-2&&busy(q))q++;if(q<R1-2&&!this.stairs.includes(q))this.stairs.push(q)}
    let free=[];for(let r=R0+2;r<R1-1;r++)if(!busy(r)&&!this.stairs.some(q=>Math.abs(q-r)<=1))free.push(r);
    this.ladders=[];for(let k=0;k<S.ladders&&free.length;k++){const want=R0+(R1-R0)*(k+1)/(S.ladders+1)+(R()-.5)*3;let best=free[0];for(const r of free)if(Math.abs(r-want)<Math.abs(best-want))best=r;this.ladders.push(best);free=free.filter(r=>Math.abs(r-best)>2)}
    this.lad=this.ladders.map(r=>({r,up:true,look:0,raise:0,tilt:0}));this.mantlets=[];this.sections();this.engines=[];this.shots=[];this.mangonel=null;this.nEngines=Math.max(0,o.engines|0);this.aim=null;const F=SIEGE_FIGHT.flag;this.flag={x:this.x1+F.x,y:Math.round((this.gy0+this.gy1)/2),court:F.court,prog:0,taken:false};this.houses=this.townPlan()}
  // (its sections: each stretch of the walk between the gate and its towers in SIEGE_ENGINE.section rows at most, and each tower; each
  // {r0, r1, hp, hp0, tower, down})
  sections(){const E=SIEGE_ENGINE,h=E.hp[Math.min(3,this.w)]||E.hp[1],out=[];let run=[];
    const flush=()=>{for(let i=0;i<run.length;i+=E.section){const r0=run[i],r1=run[Math.min(run.length,i+E.section)-1];out.push({r0,r1,hp:h,hp0:h,tower:false,down:false})}run=[]};
    for(let r=this.R0;r<=this.R1;r++){if(r>=this.g0&&r<=this.g1||this.isTower(r)){flush();continue}if(run.length&&run[run.length-1]!==r-1)flush();run.push(r)}flush();
    for(const q of this.towers)out.push({r0:q,r1:q+SIEGE_WALL.tower-1,hp:h*E.tower,hp0:h*E.tower,tower:true,down:false});this.secs=out}
  get x0(){return this.c0*this.cs}
  get x1(){return (this.c1+1)*this.cs}
  get gy0(){return this.g0*this.cs}
  get gy1(){return (this.g1+1)*this.cs}
  isTower(r){return this.towers.some(q=>r>=q&&r<q+SIEGE_WALL.tower)}
  // (the town behind it, SIEGE_TOWN: each building {x, y, w, h} its footprint, type, n its picture's size (px), the centre one big)
  townPlan(){const S=SIEGE_TOWN,t=this.t,MS=(typeof PX!=='undefined'&&PX.MODEL_SIZES&&PX.MODEL_SIZES.types)||{};if(!S.on||!MS.cottage)return[];
    const R=seeded(((this.seed||1)^0x70A2E5)>>>0),out=[],x0=this.x1+S.inset,x1=this.W-S.edge,y0=this.top+S.edge,y1=this.bot-S.edge,gy=(this.gy0+this.gy1)/2;
    const c0=HOLDING_TYPES[t.kind]&&HOLDING_TYPES[t.kind].centre&&HOLDING_TYPES[t.kind].centre._,centre=MS[c0]?c0:'keep';
    let kinds=[...new Set((t.lots||[]).filter(l=>S.kinds.includes(l.k)).map(l=>l.type))].filter(k=>MS[k]&&MS[k].cell>=32);if(!kinds.length)kinds=['cottage'];
    let put=(type,x,y,big,k=S.k)=>{const n=MS[type].cell*k,w=n*S.foot[0],h=n*S.foot[1],b={x:Math.round(x-w/2),y:Math.round(y-h),w:Math.round(w),h:Math.round(h),type,n,big,k};
      if(b.x<x0-(big?40:0)||b.x+b.w>x1||b.y<y0||b.y+b.h>y1||Math.abs(y-gy)<S.street+(big?0:h)&&!big)return false;
      if(out.some(o=>b.x<o.x+o.w+S.gap&&o.x<b.x+b.w+S.gap&&b.y<o.y+o.h+S.gap&&o.y<b.y+b.h+S.gap))return false;out.push(b);return true};
    const F=SIEGE_FIGHT.flag,kx=x0+(x1-x0)*S.centre,big=k=>put(centre,kx,gy+MS[centre].cell*k*S.foot[1]/2,true,k);if(!big(S.kc))big(S.k);
    // (the lord's standard in the court before the keep, its court kept clear of houses)
    const kp=out[0]&&out[0].big?out[0]:null,fx=kp?Math.max(this.x1+60,Math.min(this.x1+F.x,(this.x1+kp.x)/2)):this.x1+F.x,court=kp?Math.max(30,Math.min(F.court,(kp.x-this.x1)/2-12)):F.court;
    this.flag={x:Math.round(fx),y:Math.round(gy),court,prog:0,taken:false};
    if(kp&&MS.tower)for(let i=0;i<S.towers;i++){const n=MS.tower.cell*S.k,y=i?kp.y+kp.h+n*S.foot[1]+12:kp.y-12;put('tower',kp.x+kp.w+n*S.foot[0]/2-10,y,false)}
    const clear=put;put=(type,x,y,b)=>{const n=MS[type].cell*S.k;if(Math.abs(x-fx)<court+n/2&&y>gy-court&&y-n<gy+court+4)return false;return clear(type,x,y,b)};// (its picture clear of the court)
    for(let y=y0+S.cell/2;y<y1;y+=S.cell)for(let x=x0+S.cell/2;x<x1;x+=S.cell)if(R()<S.fill)put(kinds[Math.floor(R()*kinds.length)],x+(R()-.5)*S.jit,y+(R()-.5)*S.jit+S.cell*.3,false);
    return out}
  // (its plan for the battle's terrain: open ground, the wall laid by raster, the town's buildings standing behind it)
  plan(W,H,top,bot){return{recipe:'siege',layout:this.kind,W,H,top,bot,hills:[],woods:[],marsh:[],rocks:[],rivers:[],lane:null,siege:this,...(this.houses.length?{built:{houses:this.houses,fields:[]}}:{})}}
  /* laid on the cells (raster): the wall-walk L levels up, its outer face a cliff both ways but at the ladders, its inner one
     but at the stairs; towers rock (a cell wider, outside); the gate's cells rock till it breaks (its sides cliffs) */
  lay(kind,lvl,C,R,wall,rockH){const S=SIEGE_WALL,bit=(i,q)=>{wall[i]|=1<<q},at=(c,r)=>r*C+c,{c0,c1,L}=this;
    for(let r=this.R0;r<=this.R1;r++){const gate=r>=this.g0&&r<=this.g1,tw=this.isTower(r);
      for(let c=c0;c<=c1;c++){const i=at(c,r);if(gate||tw){kind[i]=TKIND.rock;lvl[i]=0;rockH[i]=L+1}else lvl[i]=L}
      if(tw){const i=at(c0-1,r);kind[i]=TKIND.rock;rockH[i]=L+1;continue}if(gate)continue;
      if(!this.ladders.some(q=>r>=q&&r<q+S.ladder)){bit(at(c0-1,r),0);bit(at(c0,r),2)}
      if(!this.stairs.some(q=>r>=q&&r<q+S.stair)){bit(at(c1+1,r),2);bit(at(c1,r),0)}}
    // (the gate's passage walled from the wall-walk over it, and the field's ends closed)
    for(let c=c0;c<=c1;c++){bit(at(c,this.g0),3);if(this.g0>0)bit(at(c,this.g0-1),1);bit(at(c,this.g1),1);if(this.g1<R-1)bit(at(c,this.g1+1),3)}
    return wall}
  // (the ram at work: each second, your foot at the gate's face (not running, not routing) take SIEGE_WALL.ram from it; broken, open)
  // (each frame: the ram at the gate; the engines and their stones)
  step(dt){this.ramStep(dt);this.engineStep(dt);this.ladderStep(dt);this.pitchStep(dt);this.liftStep();this.flagStep(dt)}
  // (the walk's height drawn, SIEGE_ART.wallZ; a ladder's run, px from its foot to the wall)
  get run(){return this.L*10+16}
  get z(){return SIEGE_ART.wallZ[Math.min(3,this.w)]||SIEGE_ART.wallZ[1]}
  /* (each man drawn up at the height he stands at: the walk's (a rubble slope's its share), up a ladder by how far up it he is,
     down the stairs by how far down; drawn only (u.z): a leap's own height left to it) */
  zAt(u){const cs=this.cs,x0=this.x0,x1=this.x1,Z=this.z,T=B.terrain;if(u.x<x0-this.run||u.x>x1+16)return 0;const r=Math.floor(u.y/cs);
    if(u.x<x0){const l=this.lad.find(q=>q.up&&r>=q.r&&r<q.r+SIEGE_WALL.ladder);return l?Z*clamp((u.x-(x0-this.run))/this.run,0,1):0}
    if(u.x>=x1-8&&this.stairs.some(q=>r>=q&&r<q+SIEGE_WALL.stair))return Z*clamp(1-(u.x-(x1-8))/20,0,1);
    if(u.x>=x1)return 0;return Z*Math.min(1,T.levelAt(u.x,u.y)/this.L)}
  liftStep(){for(const u of B.units){if(u.hp<=0||u.left)continue;const z=this.zAt(u);if(!u.z||Math.abs(u.z-(u.wz||0))<.01){u.z=z;u.lifted=z>0}u.wz=z}}
  /* (the lord's standard, SIEGE_FIGHT.flag: yours alone by it, its taking goes on; theirs alone, it is lost again; taken, every
     defender breaks, your banner raised on it) */
  flagStep(dt){const F=SIEGE_FIGHT.flag,f=this.flag;if(!F.on||!f||f.taken||B.over)return;const near=k=>B.units.some(u=>(k?u.team!==0:u.team===0)&&u.hp>0&&!u.rout&&!u.left&&Math.hypot(u.x-f.x,u.y-f.y)<F.r);
    const me=near(0),them=near(1);if(me&&!them)f.prog+=dt;else if(them&&!me)f.prog=Math.max(0,f.prog-F.decay*dt);if(f.prog>=F.hold)this.takeFlag()}
  takeFlag(){const f=this.flag;f.taken=true;f.prog=SIEGE_FIGHT.flag.hold;for(const u of B.units)if(u.team!==0&&u.hp>0&&!u.rout&&!u.left)rout(u);if(this.art)this.art.raiseFlag();
    toast('The banner of '+this.t.name+' is taken!','good');log('Your men take the banner of '+this.t.name+' in its court: its defenders break.','good','war');battleEvent('breach',{text:'The banner is taken',team:0})}
  ramStep(dt){if(this.open||!this.ram)return;const S=SIEGE_WALL,x=this.x0,n=B.units.filter(u=>u.team===0&&u.hp>0&&!u.rout&&!u.left&&!u.s.range&&!u.hero&&u.x>x-S.ramR&&u.x<x+4&&u.y>this.gy0-6&&u.y<this.gy1+6).length;
    if(!n)return;this.ramT=B.t;this.hp-=n*S.ram*dt;this.hit=(this.hit||0)+dt;if(this.hit>.5){this.hit=0;sfxAt&&sfxAt('hit',x,(this.gy0+this.gy1)/2,{vol:.6});B.floats.push({x:x-6,y:this.gy0-8,t:'Ram!',life:.8,c:'#ffd08a'})}
    if(this.hp<=0)this.breach()}
  /* ---- the ladders (SIEGE_FIGHT.ladder): each up, looked at every look s for defenders at its top to throw it down, or down till
     your men at its foot raise it */
  ladderStep(dt){const D=SIEGE_FIGHT.ladder;if(!D.on||!this.lad.length)return;const cs=this.cs,T=B.terrain,L=this.L,live=u=>u.hp>0&&!u.rout&&!u.left;
    for(const l of this.lad){const s=this.secAt(l.r);if(s&&s.down)continue;const y=(l.r+.5)*cs;
      if(l.up){if((l.look-=dt)>0)continue;l.look=D.look;const tx=this.x0+cs*.5,top=u=>live(u)&&Math.hypot(u.x-tx,u.y-y)<D.reach&&T.levelAt(u.x,u.y)>=L;
        if(!B.units.some(u=>u.team!==0&&top(u))||B.units.some(u=>u.team===0&&top(u)))continue;
        if(!B.units.some(u=>u.team===0&&live(u)&&Math.abs(u.y-y)<cs&&u.x>this.x0-D.foot&&u.x<this.x0+4))continue;
        if(Math.random()<D.odds)this.throwDown(l)}
      else if(B.units.some(u=>u.team===0&&live(u)&&!u.s.range&&Math.hypot(u.x-(this.x0-D.foot*.5),u.y-y)<D.foot)&&(l.raise+=dt)>=D.raise)this.raiseUp(l)}}
  // (the section of row r, or null)
  secAt(r){return (this.secs||[]).find(q=>r>=q.r0&&r<=q.r1)||null}
  // (its rows' outer face sheer (true) or climbable; the field's ways made again)
  ladderFace(l,shut){const T=B.terrain,C=T.C;if(!T.wall)return;for(let r=l.r;r<l.r+SIEGE_WALL.ladder;r++){const a=r*C+this.c0-1,b=r*C+this.c0;if(shut){T.wall[a]|=1;T.wall[b]|=4}else{T.wall[a]&=~1;T.wall[b]&=~4}}
    T.routes.build(T.rows[0],T.rows[1]);T.index()}
  throwDown(l){const D=SIEGE_FIGHT.ladder,y=(l.r+.5)*this.cs;l.up=false;l.raise=0;l.tilt=(Math.random()-.5)*.5;this.ladderFace(l,true);
    for(const u of B.units)if(u.team===0&&u.hp>0&&!u.left&&Math.abs(u.y-y)<this.cs*.8&&u.x>this.x0-12&&u.x<this.x0+2)this.hurt(u,sRand(D.fall));
    if(typeof sfxAt==='function')sfxAt('hit',this.x0,y,{vol:.7});B.floats.push({x:this.x0-20,y:y-12,t:'Ladder thrown down!',life:1.2,c:'#ff9a7a'})}
  raiseUp(l){const y=(l.r+.5)*this.cs;l.up=true;l.look=SIEGE_FIGHT.ladder.look;this.ladderFace(l,false);B.floats.push({x:this.x0-20,y:y-12,t:'Ladder up!',life:1,c:'#bfe3a0'})}
  // (pitch on the ram's crew (SIEGE_FIGHT.pitch): the gate shut, the ram at work, a defender standing)
  pitchStep(dt){const D=SIEGE_FIGHT.pitch;if(!D.on||this.open||!this.ram||!B||B.t-(this.ramT??-9)>.5)return;if(this.pitchCool==null)this.pitchCool=sRand(D.first);if((this.pitchCool-=dt)>0)return;this.pitchCool=sRand(D.every);
    if(!B.units.some(u=>u.team!==0&&u.hp>0&&!u.rout&&!u.left))return;const x=this.x0,y=(this.gy0+this.gy1)/2;this.pitchT=B.t;
    for(const u of B.units)if(u.team===0&&u.hp>0&&!u.left&&u.x>x-D.r&&u.x<x+4&&u.y>this.gy0-6&&u.y<this.gy1+6)this.hurt(u,sRand(D.hurt));
    const stake=this.kind==='stake';if(typeof vfx==='function')for(let k=0;k<8;k++)vfx({k:'dust',x:x-6-Math.random()*14,y:y+(Math.random()-.5)*(this.gy1-this.gy0),vx:(Math.random()-.5)*20,vy:-18-Math.random()*16,r:2,grow:7,life:1.1,col:stake?'150,130,100':'200,200,196'});
    if(typeof sfxAt==='function')sfxAt('hit',x,y,{vol:.5});B.floats.push({x:x-14,y:this.gy0-10,t:stake?'Stones!':'Pitch!',life:.9,c:'#ffb070'})}
  // (your mantlets (SIEGE_FIGHT.mantlet) set out as the battle musters, each painted on the field's layer)
  placeMantlets(){const M=SIEGE_FIGHT.mantlet;this.mantlets=[];if(!M.on)return;const n=Math.round(sRand(M.n)),my=(this.gy0+this.gy1)/2,lo=this.R0*this.cs+40,hi=(this.R1+1)*this.cs-40;
    for(let i=0;i<n;i++){let y=my+(i-(n-1)/2)*M.gap;if(Math.abs(y-my)<M.gate)y+=(y<my?-1:1)*M.gate;y=clamp(y+(Math.random()-.5)*10,lo,hi);for(let k=0;k<6&&this.ladders.some(r=>Math.abs((r+.5)*this.cs-y)<M.half+this.cs*1.5);k++)y+=(y<my?-1:1)*this.cs;this.mantlets.push({x:this.x0-M.out+(Math.random()-.5)*10,y})}
    if(this.art)for(const m of this.mantlets)this.art.mantlet(m)}
  /* ---- the engines (SIEGE_ENGINE): yours placed as the battle musters, in a file across the field's middle range px out from the
     wall; the defenders' mangonel on the tower nearest the gate, behind walls of SIEGE_ENGINE.def.lv or more */
  placeEngines(){const E=SIEGE_ENGINE,n=E.on?this.nEngines:0,my=(this.gy0+this.gy1)/2,lo=this.R0*this.cs+40,hi=(this.R1+1)*this.cs-40;this.engines=[];
    for(let i=0;i<n;i++){const y=clamp(my+(i-(n-1)/2)*E.gap,lo,hi);this.engines.push({x:Math.max(40,this.x0-E.range),y,hp:E.hp0,hp0:E.hp0,cool:sRand(E.first),shotT:-9})}
    const q=this.w>=E.def.lv&&E.on&&this.towers.length?this.towers.slice().sort((a,b)=>Math.abs(a-this.g0)-Math.abs(b-this.g0))[0]:null;
    this.mangonel=q!=null?{r:q,x:(this.x0+this.x1)/2,y:(q+1)*this.cs,cool:sRand(E.def.first),shotT:-9,lost:false}:null}
  // (where your engines aim: the section you set (its click, aimAt), else the weakest standing, the nearest the gate of those)
  mark(){if(this.aim&&!this.aim.down)return this.aim;const gm=(this.g0+this.g1)/2,up=this.secs.filter(s=>!s.down);if(!up.length)return null;
    return up.reduce((a,s)=>{const ka=a.hp/a.hp0,ks=s.hp/s.hp0;return ks<ka-1e-6||Math.abs(ks-ka)<1e-6&&Math.abs((s.r0+s.r1)/2-gm)<Math.abs((a.r0+a.r1)/2-gm)?s:a})}
  // (a click on the wall: the section there your engines' mark; true: taken)
  aimAt(x,y){if(!this.engines.some(e=>e.hp>0)||x<this.x0-SIEGE_ART.foot-SIEGE_WALL.tower*this.cs||x>this.x1)return false;const r=Math.floor(y/this.cs),s=this.secs.find(q=>!q.down&&r>=q.r0&&r<=q.r1);
    if(!s)return false;this.aim=s;toast('Your engines aim at that '+(s.tower?'tower':'stretch of wall')+'.');return true}
  engineStep(dt){const E=SIEGE_ENGINE;if(!E.on)return;
    for(const e of this.engines){if(e.hp<=0||(e.cool-=dt)>0)continue;const s=this.mark();if(!s){e.cool=1;continue}e.cool=sRand(E.every);e.shotT=B.t;this.loose(e,s)}
    const m=this.mangonel,live=this.engines.filter(e=>e.hp>0);
    if(m&&!m.lost&&live.length&&(m.cool-=dt)<=0){const D=E.def,e=live[Math.floor(Math.random()*live.length)],hit=Math.random()<D.hit;m.cool=sRand(D.every);m.shotT=B.t;
      this.shots.push({fx:m.x,fy:m.y,tx:e.x+(hit?0:(Math.random()<.5?-1:1)*sRand(E.miss)),ty:e.y+(Math.random()-.5)*10,t:0,T:E.flight,at:hit?e:null,def:true})}
    for(let i=this.shots.length-1;i>=0;i--){const q=this.shots[i];if((q.t+=dt)>=q.T){this.shots.splice(i,1);this.land(q)}}}
  // (a stone loosed at section s: at a point of it, or short of it by a miss)
  loose(e,s){const E=SIEGE_ENGINE,cs=this.cs,hit=Math.random()<E.hit,x=s.tower?this.x0-cs*.5+Math.random()*(this.x1-this.x0+cs*.5):this.x0+Math.random()*(this.x1-this.x0),y=(s.r0+Math.random()*(s.r1-s.r0+1))*cs;
    this.shots.push({fx:e.x+10,fy:e.y-34,tx:hit?x:x-sRand(E.miss),ty:y+(hit?0:(Math.random()-.5)*20),t:0,T:E.flight,sec:hit?s:null})}
  // (a stone down: its dust, the men by it hurt; a section's or an engine's strength taken)
  land(q){const E=SIEGE_ENGINE;if(typeof vfx==='function')for(let k=0;k<6;k++)vfx({k:'dust',x:q.tx+(Math.random()-.5)*10,y:q.ty+(Math.random()-.5)*6,vx:(Math.random()-.5)*40,vy:-10-Math.random()*20,r:2,grow:8,life:.9,col:'184,171,152'});
    B.rings.push({x:q.tx,y:q.ty,r:E.splash,life:.3,max:.3,col:'200,180,150'});if(typeof sfxAt==='function')sfxAt('hit',q.tx,q.ty,{vol:.9});
    for(const u of B.units)if(u.hp>0&&!u.left&&Math.hypot(u.x-q.tx,u.y-q.ty)<E.splash)this.hurt(u,sRand(E.hurt));
    if(q.def){const e=q.at;if(e&&e.hp>0&&(e.hp-=sRand(E.def.dmg))<=0){e.hp=0;toast('A trebuchet is smashed!','bad');log('The defenders\' mangonel smashes one of your trebuchets.','bad','war')}return}
    const s=q.sec;if(!s||s.down)return;s.hp-=sRand(E.dmg);if(s.hp<=0)this.collapse(s)}
  // (a way in made (the gate down, a section fallen): the defenders' foot not yet fighting to hold it, standing SIEGE_WALL.hold px
  // inside it, facing out, at their posts still till a foe comes on them (interior.js insideRoused); their lords and the rest roused;
  // their shooters on the walk as they were)
  holdGap(y){for(const g of Object.values(B.groups)){if(g.team===0)continue;const m=grpUnits(g.id).filter(u=>u.hp>0);if(!m.length)continue;
    if((g.role==='inf'||g.role==='cav')&&!g.roused){g.standAt(this.x1+SIEGE_WALL.hold,y);g.face=g.currentFacing=Math.PI}else if(g.role!=='arc'&&g.role!=='mag')g.roused=true}}
  // (the harm a shot does to e: less behind one of your mantlets from the wall's side (SIEGE_FIGHT.mantlet), less on the wall-walk from one loosed below it (its merlons, SIEGE_WALL.cover))
  cover(e,by){const T=B.terrain,M=SIEGE_FIGHT.mantlet;if(by&&e.team===0&&by.x>e.x)for(const m of this.mantlets||[])if(e.x<=m.x&&e.x>=m.x-M.back&&Math.abs(e.y-m.y)<=M.half)return M.cover;
    if(!T||!by||e.x<this.x0||e.x>=this.x1)return 1;const r=Math.floor(e.y/this.cs),s=(this.secs||[]).find(q=>r>=q.r0&&r<=q.r1);
    if(!s||s.down||s.tower)return 1;return T.levelAt(e.x,e.y)>=this.L&&T.levelAt(by.x,by.y)<this.L?SIEGE_WALL.cover:1}
  // (hurt where he stands: a stone, a fall; nobody's blow)
  hurt(u,amt){Actor.of(u).wound(amt,1,'blunt',null,true)}
  /* (a section's fall: its cells a rubble slope of SIEGE_ENGINE.rubble levels (none for a palisade's one), its faces and the tower's
     rock gone, sheer to the walk still standing beside it; its men falling; the ways and sight made again; every defender roused) */
  collapse(s){if(s.down)return;s.down=true;s.hp=0;const T=B.terrain,C=T.C,R=T.R,E=SIEGE_ENGINE,rub=Math.min(E.rubble,Math.max(0,this.L-1)),cs=this.cs,at=(c,r)=>r*C+c,bit=(i,q)=>{T.wall[i]|=1<<q};
    for(let r=s.r0;r<=s.r1;r++)for(let c=this.c0-1;c<=this.c1+1;c++){const i=at(c,r);T.kind[i]=TKIND.open;T.lvl[i]=c>=this.c0&&c<=this.c1?rub:0;if(T.rockH)T.rockH[i]=0;if(T.wall)T.wall[i]=0}
    if(T.wall)for(let c=this.c0;c<=this.c1;c++){if(s.r0>0&&T.lvl[at(c,s.r0-1)]>rub){bit(at(c,s.r0),3);bit(at(c,s.r0-1),1)}if(s.r1<R-1&&T.lvl[at(c,s.r1+1)]>rub){bit(at(c,s.r1),1);bit(at(c,s.r1+1),3)}}
    const y0=s.r0*cs,y1=(s.r1+1)*cs;for(const u of B.units)if(u.hp>0&&!u.left&&u.y>=y0&&u.y<y1&&u.x>=this.x0-cs&&u.x<this.x1+cs)this.hurt(u,sRand(E.fall));
    if(s.tower&&this.mangonel&&this.mangonel.r===s.r0)this.mangonel.lost=true;if(this.aim===s)this.aim=null;
    T.routes.build(T.rows[0],T.rows[1]);T.index();if(B.sight&&B.sight.fogCast)B.sight.fogCast.clear();if(this.art)this.art.rubble(s);
    this.holdGap((y0+y1)/2);
    const what=s.tower?'A tower':'The wall';toast(what+' comes down!','good');log(what+' of '+this.t.name+' comes down under your engines.','good','war');battleEvent('breach',{text:what+' is down',team:0})}
  // the gate gives way: its cells open ground, the ways and sight made again; every defender roused
  breach(){if(this.open)return;this.open=true;this.hp=0;const T=B.terrain,C=T.C;
    for(let r=this.g0;r<=this.g1;r++)for(let c=this.c0;c<=this.c1;c++){const i=r*C+c;T.kind[i]=TKIND.open;T.lvl[i]=0;if(T.rockH)T.rockH[i]=0}
    T.routes.build(T.rows[0],T.rows[1]);T.index();if(B.sight&&B.sight.fogCast)B.sight.fogCast.clear();
    this.holdGap((this.gy0+this.gy1)/2);
    toast('The gate gives way!','good');log('The gate of '+this.t.name+' gives way under the ram.','good','war');battleEvent('breach',{text:'The gate is down',team:0})}
}
/* ---------- its look (the owner, 2026-11-06: "improve the sprites in siege"), in the holding's culture (TOURNEY_ARENA.walls: its
   stone, its timber), over the climate's ground. Painted once into the field's layer: the wall's sloped foot outside, its walk of
   flagstones (a palisade's planks), its parapet's merlons each with its face, the inner lip, its shadow; the stairs; the gate's
   cobbled passage; your ladders leaning on it. Standing (props, sorted with the soldiers by their feet, faded when one of yours
   is behind: render.js propsInView): each tower, raised (its crenellated top, its face of courses and arrow slits, the lord's
   banner). Each frame: the gate's doors and portcullis (whole, battered, broken) and the ram, its head swinging while it works ---------- */
/* SIEGE_ART: rise, riseL: a tower's face (px, and px a level); foot: the gate's doors this far out; plinth: the stone wall's battered
   foot (px); merlon: [its length, the crenel's] (rows px), face: its face; shadow: the wall's on the yard (px, and 4 a level); clutter:
   the walk's heaps (stones, arrows, a barrel, a brazier) one in so many rows (cells); spent: one spent arrow in the field before the
   wall for so many px of it; wallZ: the walk's height drawn (px, by the walls: the men on it drawn up so, the ladders leaning to
   it); brick: a brick's [length, height] (px); hang: a hanging of the lord's colours on the outer face one in so many rows, torch: a
   torch in its sconce one in so many; moss: the foot's growth by climate; ladder: your ladders (SiegeArt#ladPic: w px wide, a rung every step px; STANDARD_ART.ladder's colours) */
const SIEGE_ART={rise:18,riseL:8,foot:6,plinth:14,wallZ:[0,15,22,26],brick:[7,3],hang:11,torch:7,merlon:[6,4],face:2,shadow:14,clutter:5,spent:5,
  moss:{grass:'#5e6e3c',swamp:'#4e6038',forest:'#556a36',frost:'#e6ecf0',desert:'#cbb27c'},ladder:{...STANDARD_ART.ladder,w:11,step:5,broken:.3}};
class SiegeArt{
  constructor(w,base){this.w=w;this.base=base;this.cv=null;const t=w.t,A=TOURNEY_ARENA.walls,cul=holdingCulture(t),own=t.owner&&FACS[t.owner];
    this.cul=cul;this.col=own?own.col:'#9a9a9a';this.dev=own&&t.owner!=='player'?t.owner:'star';
    const st=A[cul]&&A[cul].kind==='stone'?A[cul]:A.vale,wood=A[cul]&&A[cul].kind!=='stone'?A[cul]:A.timber;
    this.C=w.kind==='stake'?wood.c:w.kind==='great'?st.c.map(c=>shade(c,1.06)):st.c;this.trim=(w.kind==='stake'?wood:st).trim;this.wood=wood.c;this.props=[];this.braziers=[];this.torches=[];this.moss=SIEGE_ART.moss[w.clim]||null;w.art=this}
  *paintSteps(){const w=this.w,cv=mkcv(BW,BH),g=cv.getContext('2d'),cs=w.cs,C=this.C,x0=w.x0,x1=w.x1,y0=w.R0*cs,y1=(w.R1+1)*cs,A=SIEGE_ART;
    const skip=y=>this.gateRow(y)||w.isTower(Math.floor(y/cs));
    this.bailey(g);yield;
    // (its shadow on the yard, soft)
    for(let k=0;k<A.shadow+w.L*4;k++){g.fillStyle='rgba(10,12,18,'+(.42*(1-k/(A.shadow+w.L*4))).toFixed(3)+')';g.fillRect(x1+k,y0,1,y1-y0)}yield;
    if(w.kind==='stake')this.palisade(g,y0,y1,skip);else this.stone(g,y0,y1,skip);yield;
    // (the stairs down into the yard: five steps east from the walk, each a shade lower, its nose lit, its riser dark; their sides' kerbs)
    for(const r of w.stairs){const y=r*cs,h=SIEGE_WALL.stair*cs,n=5,X=x1-8;
      for(let i=0;i<n;i++){const x=X+i*4;rect(g,shade(C[1],1-.09*i),x,y+2,4,h-4);rect(g,shade(C[0],1-.08*i),x,y+2,1,h-4);rect(g,shade(C[2],1-.06*i),x+3,y+2,1,h-4)}
      rect(g,C[2],X,y,n*4,2);rect(g,C[3],X,y+h-2,n*4,2);rect(g,C[0],X,y,n*4,1);rect(g,'rgba(10,12,18,.35)',X,y+h,n*4,2)}
    this.passage(g);this.clutter(g);this.spent(g);if(w.kind!=='stake')this.face(g);this.court(g);
    for(const r of w.towers)this.props.push(this.tower(r));yield;for(const h of w.houses||[])if(!h.out){const p=this.house(g,h);if(p)this.props.push(p)}const fl=this.flagProp();if(fl)this.props.push(fl);this.props.sort((a,b)=>a.y-b.y);
    this.cv=cv;return this}
  gateRow(y){const w=this.w;return y>=w.gy0&&y<w.gy1}
  // (a building of the town (SIEGE_TOWN): the holding's builders' model, SIEGE_TOWN.k times it, crisp; its ground and shadow painted
  // on the layer under it; standing, a prop whose feet are its footprint's south edge)
  house(g,h){if(typeof PX==='undefined'||!PX.buildingModel)return null;let m=null;try{m=PX.buildingModel({type:h.type,people:'human',culture:this.cul,seed:(this.w.seed+h.x)%4,yaw:0,env:this.w.clim||'grass',snow:this.w.clim==='frost'})}catch(e){m=null}
    if(!m||!m.img)return null;const k=h.k||SIEGE_TOWN.k,n=m.img.width*k,X=Math.round(h.x+h.w/2-n/2),Y=Math.round(h.y+h.h-n),cv=mkcv(n,n),q=cv.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(m.img,0,0,n,n);if(m.snow&&m.snow.img)q.drawImage(m.snow.img,0,0,n,n);
    g.save();g.imageSmoothingEnabled=false;if(m.shadow)g.drawImage(m.shadow,X,Y,n,n);if(m.ground)g.drawImage(m.ground,X,Y,n,n);g.restore();
    return{dk:5,x:h.x+h.w/2,y:h.y+h.h,s:cv,dx:X,dy:Y,box:[X,Y,X+n,h.y+h.h]}}
  /* (stone: its battered foot outside, courses of big blocks lit toward the wall, its base grimed (moss, snow, sand by the climate)
     and scree before it; the walk's flags, worn down its middle, the parapet's shadow on them; the merlons, each a block with its top
     lit and its face below, every other one with its loop; dark crenels between; the inner lip) */
  stone(g,y0,y1,skip){const w=this.w,C=this.C,x0=w.x0,x1=w.x1,s=w.seed%9973,A=SIEGE_ART,[mh,mg]=A.merlon,P=A.plinth,M=this.moss,mid=(x0+8+x1-3)/2;
    for(let y=y0;y<y1;y++){if(skip(y))continue;const row=Math.floor(y/5);
      // (its outer face, seen aslant: a base of big blocks, then courses of bricks up to the parapet (each course a column here,
      // the wall's length down it), staggered, each its own tone, lit at its top end, mortar between; here and there one gone)
      for(let x=x0-P;x<x0;x++){const fx=x-(x0-P),k=fx/P,[bw,bh]=A.brick;let c;
        if(fx<4){const bi=Math.floor((y+(hs(Math.floor(y/10),2,s)*4|0))/10),j=fx===0||y%10===0;c=j?C[3]:hs(bi,5,s)<.4?shade(C[2],.86):shade(C[2],.94);if(M&&hs(x,y,s+9)<.65-fx*.12)c=M}
        else{const q=fx-4,co=Math.floor(q/bh),of=(co&1)?(bw>>1)+1:0,bi=Math.floor((y+of)/bw),j=q%bh===0||(y+of)%bw===0,v=hs(bi,co,s+5);
          c=j?C[3]:v<.035?'#1e1a16':v<.3?C[2]:v>.75?shade(C[1],1.04):k>.6?C[1]:shade(C[1],.9);if(!j&&v>=.035&&(y+of)%bw===1)c=shade(c,1.08);if(!j&&v>=.035&&q%bh===bh-1)c=shade(c,.94);
          if(M&&k<.5&&hs(x,y,s+19)<.08)c=M}
        g.fillStyle=c;g.fillRect(x,y,1,1)}
      if(hs(row,y,s+11)<.03)rect(g,'rgba(20,16,12,.2)',x0-P+2,y,P-2,1);// (a stain run down the face)
      for(let x=x0-P-6;x<x0-P;x++)if(hs(x,y,s+13)<.12)rect(g,hs(x,y,s+14)<.5?C[2]:C[3],x,y,1,1);// (scree at its foot)
      for(let x=x0+8;x<x1-3;x++){const fx=x-(x0+8),row=Math.floor(y/6),col=Math.floor((fx+(row&1)*5)/10),v=hs(col,row,s);let c=(y%6===0||(fx+(row&1)*5)%10===0)?C[2]:v<.15?shade(C[1],.92):v>.85?shade(C[1],1.06):C[1];
        if(Math.abs(x-mid)<5&&hs(x,y,s+3)<.45)c=shade(c,1.04);g.fillStyle=c;g.fillRect(x,y,1,1)}// (flagstones, worn down the middle)
      rect(g,'rgba(10,12,18,.16)',x0+8,y,2,1);rect(g,C[2],x0,y,8,1);rect(g,C[3],x0+7,y,1,1);rect(g,C[0],x1-3,y,2,1);rect(g,C[3],x1-1,y,1,1)}
    for(let y=y0,n=0;y<y1;y+=mh+mg,n++){if(skip(y)||skip(y+mh+1))continue;rect(g,'rgba(10,12,18,.3)',x0+8,y+1,3,mh);
      rect(g,C[0],x0,y,7,mh);rect(g,shade(C[0],1.1),x0+1,y,5,1);rect(g,C[2],x0,y+mh,7,A.face);rect(g,C[3],x0+6,y,1,mh+A.face);
      if(n%2)rect(g,'#16120e',x0+1,y+2,5,1);rect(g,'rgba(10,12,18,.5)',x0,y+mh+A.face,7,mg-A.face)}}
  // (a palisade: logs side by side, their sharpened tops outside lit, a plank walk on posts behind, the logs' lashing)
  palisade(g,y0,y1,skip){const w=this.w,C=this.C,x0=w.x0,x1=w.x1,s=w.seed%9973;
    for(let y=y0;y<y1;y++){if(skip(y))continue;const pl=Math.floor(y/4)%2;rect(g,pl?C[1]:shade(C[1],.92),x0+10,y,x1-x0-12,1);if(y%4===0)rect(g,C[3],x0+10,y,x1-x0-12,1)}
    for(let y=y0;y<y1;y+=4){if(skip(y)||skip(y+3))continue;const t=hs(1,y,s)<.5?1:0;
      rect(g,C[3],x0-4-t,y,14+t,4);rect(g,C[1],x0-3-t,y,12+t,3);rect(g,C[0],x0-3-t,y,3,2);rect(g,C[2],x0+3,y+1,6,2);rect(g,'#e8d8b0',x0-4-t,y+1,1,1)}// (each log: its point west, lit, its length to the walk)
    for(let y=y0;y<y1;y+=18){if(skip(y))continue;rect(g,'#3a2a1a',x0+4,y,2,4)}
    for(let y=y0;y<y1;y++){if(skip(y))continue;if(y%12<8){rect(g,'#cdb67a',x0+1,y,1,1);rect(g,y%2?'#cdb67a':'#8a7448',x0+6,y,1,1)}}}// (rope lashed across the logs, two bands)
  // (the gate's passage: cobbles through the wall, dark at its mouths)
  passage(g){const w=this.w,X=w.x0-SIEGE_ART.foot,W2=w.x1-X+4,Y0=w.gy0,Y1=w.gy1,s=w.seed;
    for(let y=Y0;y<Y1;y++){const row=Math.floor(y/5),off=hs(row,7,s)*6|0;for(let x=X;x<X+W2;x++){const cx=Math.floor((x+off)/(5+(row%2))),v=hs(cx,row,s+3),e=(x+off)%(5+(row%2))===0||y%5===0;g.fillStyle=w.kind==='stake'?(v<.3?'#6a5236':v<.7?'#7a6040':'#8a6e4a'):e?'#3e3834':v<.3?'#6e665e':v<.7?'#7e766c':'#8e867a';g.fillRect(x,y,1,1)}}// (cobbles of uneven size, row by row; a palisade's trodden earth)
    rect(g,'rgba(10,12,18,.45)',X,Y0,W2,3);rect(g,'rgba(10,12,18,.3)',X,Y1-2,W2,2);
    // (the arch's sill at each mouth: dressed blocks across the passage, lit along their tops; a palisade's, a squared log)
    for(const sx of [w.x0-1,w.x1-5])for(let y=Y0+3;y<Y1-2;y+=4){rect(g,hs(y,sx,s)<.5?this.C[1]:this.C[2],sx,y,5,3);rect(g,this.C[0],sx,y,5,1);rect(g,this.C[3],sx,y+3,5,1)}}
  /* (the walk's heaps by its inner lip, SIEGE_ART.clutter rows apart at least, clear of the gate, the towers (and the rows their tops
     stand over), stairs and ladders: a pile of stones to drop, a basket of arrows, a barrel, a brazier (its glow each frame, drawView)) */
  clutter(g){const w=this.w,cs=w.cs,C=this.C,x=w.x1-12,S=SIEGE_WALL,A=SIEGE_ART,up=Math.ceil((A.rise+w.L*A.riseL+22)/cs),
      busy=r=>w.towers.some(q=>r>=q-up&&r<q+S.tower)||r>=w.g0-1&&r<=w.g1+1||w.stairs.some(q=>r>=q-1&&r<=q+S.stair)||w.ladders.some(q=>Math.abs(q-r)<=1);
    for(let r=w.R0+1,last=-99;r<w.R1;r++){if(busy(r)||r-last<A.clutter)continue;last=r;const y=r*cs+5,k=Math.floor(hs(r,3,w.seed)*4),Wd=this.wood;rect(g,'rgba(10,12,18,.3)',x+1,y+5,8,2);
      if(k===0)for(const [dx,dy] of [[0,2],[3,0],[5,3],[2,4],[6,0],[4,5]]){rect(g,C[3],x+dx,y+dy+1,3,2);rect(g,C[1],x+dx,y+dy,3,2);rect(g,C[0],x+dx,y+dy,1,1)}
      else if(k===1){rect(g,Wd[3],x,y,7,6);rect(g,Wd[1],x+1,y+1,5,4);for(let i=0;i<4;i++){rect(g,'#e8e0d0',x+1+i,y+1+(i%2),1,1);rect(g,'#a03028',x+2+i%3,y+3,1,1)}}
      else if(k===2){rect(g,Wd[3],x,y,7,7);rect(g,Wd[1],x+1,y+1,5,5);rect(g,Wd[0],x+2,y+1,3,1);rect(g,'#3a3a40',x,y+2,7,1);rect(g,'#3a3a40',x,y+5,7,1)}
      else{rect(g,'#2a2a30',x+1,y+1,6,5);rect(g,'#4a4a52',x+2,y+1,4,1);rect(g,'#7a2a10',x+2,y+2,4,3);rect(g,'#1a1a1e',x+3,y+5,2,2);this.braziers.push({x:x+4,y:y+3})}}}
  /* (the outer face's details, on stretches clear of the gate, towers, ladders: a hanging of the lord's colours from the parapet
     every SIEGE_ART.hang rows, its device, its gold fringe; a torch in its iron sconce every SIEGE_ART.torch (its flame each frame,
     drawView); an arrow loop through the face every other course of rows; a stone spout and its stain) */
  face(g){const w=this.w,cs=w.cs,A=SIEGE_ART,x0=w.x0,P=A.plinth,R=PX.ramp(this.col),S=SIEGE_WALL,busy=r=>w.isTower(r)||w.isTower(r+1)||r>=w.g0-1&&r<=w.g1+1||w.ladders.some(q=>Math.abs(q-r)<=1);
    for(let r=w.R0+1,lh=-99,lt=-99;r<w.R1;r++){if(busy(r))continue;const y=r*cs;
      if(r-lh>=A.hang&&hs(r,8,w.seed)<.7){lh=r;for(let x=x0-P+1;x<x0;x++){for(let k=0;k<7;k++)rect(g,k===0?R[0]:k===6?R[2]:R[1],x,y+4+k,1,1)}
        rect(g,'rgba(10,12,18,.35)',x0-P+1,y+11,P-1,1);rect(g,'#2a2a30',x0-1,y+3,2,9);for(let k=0;k<7;k+=2)rect(g,PPAL.gold[1],x0-P,y+4+k,1,1);rect(g,R[3],x0-P+5,y+6,4,3);rect(g,'#f0e6cc',x0-P+6,y+7,2,1);continue}
      if(r-lt>=A.torch){lt=r;rect(g,'#2a2a30',x0-6,y+6,3,2);rect(g,'#4a3020',x0-8,y+6,2,1);rect(g,'rgba(20,16,12,.25)',x0-P+2,y+5,P-8,4);this.torches.push({x:x0-8,y:y+5});continue}
      if(r%3===1){rect(g,'#16120e',x0-9,y+7,5,1);rect(g,shade(this.C[1],1.06),x0-9,y+8,5,1)}
      else if(hs(r,9,w.seed)<.25){rect(g,this.C[3],x0-3,y+7,3,2);rect(g,'rgba(30,40,30,.28)',x0-P+2,y+8,P-5,1)}}}
  /* (the bailey behind the wall (SIEGE_TOWN.earth): trodden earth in 2 px blocks but for patches of the grass under it (a soft
     noise), stones in it; a cobbled street from the gate's inner mouth to the court and on to the keep's door) */
  bailey(g){const w=this.w,S=SIEGE_TOWN,E=S.earth[w.clim]||S.earth.grass,s=w.seed+41,X0=w.x1,X1=BW,Y0=w.R0*w.cs,Y1=(w.R1+1)*w.cs,G=24,f=w.flag;
    const nz=(x,y)=>{const gx=Math.floor(x/G),gy=Math.floor(y/G),tx=x/G-gx,ty=y/G-gy,a=hs(gx,gy,s),b=hs(gx+1,gy,s),c=hs(gx,gy+1,s),d=hs(gx+1,gy+1,s);return a+(b-a)*tx+(c-a)*ty+(a-b-c+d)*tx*ty};
    for(let y=Y0;y<Y1;y+=2)for(let x=X0;x<X1;x+=2){const n=nz(x,y)+(Math.abs(y-(w.gy0+w.gy1)/2)<40?.25:0);if(n<.42)continue;const v=hs(x>>1,y>>1,s+1);g.fillStyle=v<.12?E[1]:v>.9?E[2]:E[0];g.fillRect(x,y,2,2);if(v>.985){g.fillStyle='#8a8478';g.fillRect(x,y,1,1)}}
    if(!f)return;const kp=(w.houses||[]).find(h=>h.big),cob=(x0,x1,wd)=>{const yc=f.y;for(let y=Math.round(yc-wd/2);y<yc+wd/2;y++)for(let x=Math.round(x0);x<x1;x++){const row=Math.floor(y/4),off=(row&1)*3,j=y%4===0||(x+off)%6===0,v=hs(Math.floor((x+off)/6),row,s+3);
      g.fillStyle=j?'#4e4840':v<.3?'#7a7268':v<.7?'#8a8276':'#9a9284';g.fillRect(x,y,1,1)}rect(g,'rgba(10,12,18,.3)',Math.round(x0),Math.round(yc+wd/2),Math.round(x1-x0),1)};
    cob(X0,f.x-f.court,S.road[0]);if(kp)cob(f.x+f.court,kp.x+kp.w/2,S.road[1])}
  /* (the castle's court: flagstones about the lord's standard before its keep, a kerb round them; its standard standing in the middle
     (flagProp), yours once taken (raiseFlag); its taking each frame (drawView)) */
  court(g){const f=this.w.flag;if(!f||!SIEGE_FIGHT.flag.on)return;const C=this.C,R=Math.round(f.court),s=this.w.seed+5;
    for(let y=f.y-R;y<f.y+R;y++)for(let x=f.x-R;x<f.x+R;x++){const row=Math.floor((y-f.y+R)/8),off=(row&1)*5,col=Math.floor((x-f.x+R+off)/10),j=(y-f.y+R)%8===0||(x-f.x+R+off)%10===0,v=hs(col,row,s);
      g.fillStyle=j?C[2]:v<.2?shade(C[1],.9):v>.85?shade(C[1],1.05):C[1];g.fillRect(x,y,1,1)}
    rect(g,C[3],f.x-R-1,f.y-R-1,2*R+2,1);rect(g,C[3],f.x-R-1,f.y+R,2*R+2,2);rect(g,C[3],f.x-R-1,f.y-R,1,2*R);rect(g,C[3],f.x+R,f.y-R,1,2*R);
    for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=f.x+dx*(R-8),y=f.y+dy*(R-8);rect(g,'rgba(10,12,18,.3)',x-3,y+1,7,3);rect(g,'#2a2a30',x-2,y-2,5,4);rect(g,'#7a2a10',x-1,y-2,3,2);this.braziers.push({x,y:y-2})}}
  // (the standard, standing: world/standards.js standardSprite of its owner (or yours, taken), SIEGE_FIGHT.flag.k times; a prop)
  flagProp(mine){const f=this.w.flag,t=this.w.t;if(!f||!SIEGE_FIGHT.flag.on||typeof standardSprite!=='function')return null;const k=SIEGE_FIGHT.flag.k,own=mine?'player':t.owner;
    const sp=standardSprite({realm:own,band:false,col:()=>(FACS[own]&&FACS[own].col)||this.col,lv:1,seed:this.w.seed,broken:false}),cv=mkcv(sp.width*k,sp.height*k),q=cv.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(sp,0,0,cv.width,cv.height);
    const X=Math.round(f.x-sp.ax*k),Y=Math.round(f.y-sp.ay*k);return{dk:6,flag:true,x:f.x,y:f.y+2,s:cv,dx:X,dy:Y,box:[X,Y,X+cv.width,f.y+2]}}
  raiseFlag(){const p=this.flagProp(true);if(!p)return;this.props=this.props.filter(q=>!q.flag);this.props.push(p);this.props.sort((a,b)=>a.y-b.y)}
  // (spent arrows stuck in the field before the wall, thicker near it, leaning back toward it, their fletching up)
  spent(g){const w=this.w,cs=w.cs,y0=w.R0*cs,y1=(w.R1+1)*cs,n=Math.round((y1-y0)/SIEGE_ART.spent),s=w.seed+7;
    for(let k=0;k<n;k++){const x=Math.round(w.x0-SIEGE_ART.plinth-6-Math.pow(hs(k,1,s),1.7)*130),y=Math.round(y0+hs(k,2,s)*(y1-y0));
      rect(g,'rgba(10,12,18,.22)',x+1,y,4,1);for(let j=0;j<3;j++)rect(g,'#7a5a38',x+j,y-j,1,1);rect(g,hs(k,3,s)<.5?'#e6dccb':'#b8b0a0',x+3,y-3,1,1)}}
  /* (a mantlet of yours (SIEGE_FIGHT.mantlet): planks leaning toward the wall, lit on the west, iron-banded, propped on two struts behind,
     a few of their arrows in it, its shadow; painted on the field's layer) */
  mantlet(m){const g=this.cv&&this.cv.getContext('2d');if(!g)return;const x=Math.round(m.x)-5,y=Math.round(m.y)-12,R=SIEGE_ART.ladder.rail,G=SIEGE_ART.ladder.rung,H=24;
    rect(g,'rgba(10,12,18,.3)',x+9,y+3,7,H-2);rect(g,'#2a1a0c',x+9,y+4,4,1);rect(g,'#2a1a0c',x+9,y+H-5,4,1);// (its shadow behind it, its struts)
    rect(g,'#2a1a0c',x-1,y-1,11,H+2);for(let k=0;k<9;k++){const c=k===0?G[0]:k>=7?R[2]:k%3===2?shade(R[1],.9):R[1];rect(g,c,x+k,y,1,H)}rect(g,R[2],x,y+H-1,9,1);// (its planks, lit west, its top edge dark)
    for(const by of [y+4,y+H-6]){rect(g,'#4a4a52',x,by,9,1);rect(g,'#7a7a84',x,by,2,1)}
    for(const [dx,dy] of [[2,8],[5,13],[3,17]]){rect(g,'#7a5a38',x+dx,y+dy,3,1);rect(g,'#e6dccb',x+dx-1,y+dy-1,1,2)}}// (their arrows in it)
  /* (a ladder's picture, its foot west and its top east, run px from one to the other (seen from above, leaning on the wall): two
     rails of split poles two px thick, lit along their north edge, a knot here and there; a rung every step px, its west face lit,
     its east shaded, rope lashed at its ends every other one, by its seed one snapped; two iron hooks over its top. One a ladder) */
  ladPic(l){if(l.pic)return l.pic;const A=SIEGE_ART.ladder,run=this.w.run,W=run+4,H=A.w+3,cv=mkcv(W,H),g=cv.getContext('2d'),R=A.rail,G=A.rung,s=this.w.seed+l.r*7;
    const cut=hs(s,3,911)<A.broken?2+Math.floor(hs(s,4,912)*(run/A.step-3)):-1;
    for(const [y0,dy] of [[1,1],[A.w,-1]])for(let x=0;x<run;x++){const y=y0+(x>run*.6?dy:0);rect(g,'#2a1a0c',x,y-1,1,4);rect(g,R[0],x,y,1,1);rect(g,hs(x,y0,s)<.06?A.knot:R[1],x,y+1,1,1)}// (each rail closing in a px toward its top)
    for(let x=3,n=0;x<run-2;x+=A.step,n++){const y0=3,y1=A.w-1,half=n===cut?(y0+y1)>>1:y1;rect(g,'#2a1a0c',x-1,y0,4,half-y0+1);rect(g,G[0],x,y0,1,half-y0+1);rect(g,G[1],x+1,y0,1,half-y0+1);
      if(n%2===0){rect(g,A.rope,x,y0-1,2,1);rect(g,A.rope,x,y1+1,2,1)}}
    for(const y of [1,A.w]){rect(g,'#2e2e34',run,y-1,3,2);rect(g,'#6a6a72',run+2,y-1,1,3)}// (its hooks)
    return l.pic=cv}
  /* (a ladder up, drawn leaning: each column of its picture raised by how far up the wall's height it is there (its foot on the
     ground, its top at the walk's height, wallZ), its rungs upright; its shadow: its flat picture on the ground beneath it) */
  leanPic(l,sp){if(l.lean)return l.lean;const Z=this.w.z,run=this.w.run,cv=mkcv(sp.width,sp.height+Z),g=cv.getContext('2d');
    for(let x=0;x<sp.width;x++)g.drawImage(sp,x,0,1,sp.height,x,Z-Math.round(Z*Math.min(1,x/run)),1,sp.height);
    cv.sh=mkcv(sp.width,sp.height);const q=cv.sh.getContext('2d');q.drawImage(sp,0,0);q.globalCompositeOperation='source-in';q.fillStyle='rgba(10,12,18,.32)';q.fillRect(0,0,sp.width,sp.height);return l.lean=cv}
  /* (the ladders each frame: up, leaning from its foot out in the field to the parapet, its iron hooks over the merlons; thrown down,
     lying in the field before the wall, askew) */
  ladders(g){const w=this.w,cs=w.cs;for(const l of w.lad||[]){const s=w.secAt(l.r);if(l.up&&s&&s.down)continue;const sp=this.ladPic(l),y=Math.round((l.r+.5)*cs);g.save();g.imageSmoothingEnabled=false;
      const X=w.x0+3-sp.width,Y=y-(sp.height>>1);if(l.up){const lp=this.leanPic(l,sp);g.drawImage(lp.sh,X+1,Y+1);g.drawImage(lp,X,Y-w.z)}
      else{g.translate(X-sp.width*.55,y);g.rotate(l.tilt);rect(g,'rgba(10,12,18,.25)',-sp.width/2+1,sp.height/2-2,sp.width-2,2);g.drawImage(sp,-sp.width/2,-sp.height/2)}g.restore()}}
  // (a tower, standing: its top raised over its footprint (crenellated, a hatch), its face below (courses, two arrow slits, lit to
  // the west), the lord's banner on its top; a prop: its feet its footprint's south edge)
  tower(r){const w=this.w,cs=w.cs,C=this.C,X=w.x0-cs,Y=r*cs,W2=w.x1-X+2,h=SIEGE_WALL.tower*cs,H=SIEGE_ART.rise+w.L*SIEGE_ART.riseL,FL=22,stake=w.kind==='stake';
    const cv=mkcv(W2+2,FL+h+H),g=cv.getContext('2d'),ty=FL,fy=FL+h;// (its top from ty to fy, its face from fy to fy + H)
    for(let y=0;y<H;y++)for(let x=0;x<W2;x++){let c;if(stake)c=x%4===0?C[3]:x%4===1?C[0]:C[1];else{const [bw,bh]=SIEGE_ART.brick,row=Math.floor(y/bh),of=(row&1)?4:0,j=y%bh===0||(x+of)%bw===0,v=hs(Math.floor((x+of)/bw),row,w.seed+r);c=j?shade(C[3],1.12):x<3?C[0]:x>W2-4?C[3]:v<.2?C[2]:v>.8?shade(C[1],1.05):v<.24?'#2a2520':C[1];
      if(!j&&x>=3&&x<=W2-4&&(x+of)%bw===1)c=shade(c,1.06);if(y>=H-5)c=y===H-5?C[0]:(x+of)%bw===0||y%4===0?C[3]:C[2]}g.fillStyle=c;g.fillRect(x,fy+y,1,1)}// (its bricks in staggered courses, each its own tone, one here and there gone; its plinth at its foot)
    rect(g,'rgba(10,12,18,.35)',0,fy,W2,2);if(!stake)for(let x=1;x<W2-2;x+=4){rect(g,C[3],x,fy+2,2,2);rect(g,C[1],x,fy+2,2,1)}// (the corbels under its top)
    for(const sx of [Math.round(W2*.3),Math.round(W2*.65)]){const sl=Math.min(9,H-10);rect(g,'#14100c',sx,fy+6,2,sl);if(!stake)rect(g,'#14100c',sx-2,fy+6+(sl>>1)-1,6,2);rect(g,C[0],sx-1,fy+5,4,1)}// (arrow slits, a stone wall's crosslets)
    rect(g,C[3],0,ty,W2,h);rect(g,stake?C[2]:shade(C[1],.95),1,ty+1,W2-2,h-2);rect(g,C[2],5,ty+5,W2-10,h-10);
    for(let x=0;x<W2;x+=6){rect(g,C[0],x,ty,4,3);rect(g,C[2],x,ty+3,4,1)}for(let y=ty;y<fy;y+=6){rect(g,C[0],0,y,3,4);rect(g,C[0],W2-3,y,3,4)}// (its merlons round the top)
    rect(g,stake?'#3a2a1a':'#4a4440',W2-14,ty+8,6,5);rect(g,'#2a2420',W2-13,ty+9,4,3);// (a hatch)
    if(this.trim)rect(g,this.trim,0,fy-1,W2,1);
    const b=bannerSprite({k:'banner',col:this.col,dev:this.dev},0);g.drawImage(b,8-b.px,ty+6-b.py);
    // (the defenders' mangonel on it: its frame and its arm, cocked)
    if(w.w>=SIEGE_ENGINE.def.lv&&SIEGE_ENGINE.on&&w.towers.slice().sort((a,b)=>Math.abs(a-w.g0)-Math.abs(b-w.g0))[0]===r){const mx=W2/2-6,my=ty+h/2-4,Wd=this.wood;
      rect(g,Wd[3],mx,my+6,14,4);rect(g,Wd[1],mx+1,my+6,12,2);rect(g,Wd[2],mx+2,my,2,7);rect(g,Wd[2],mx+10,my,2,7);rect(g,Wd[0],mx+2,my,10,2);rect(g,Wd[1],mx+5,my-6,2,9);rect(g,'#5a5a60',mx+4,my-8,4,3)}
    return{dk:6,x:X+W2/2,y:Y+h,s:cv,dx:X,dy:Y-H-FL,box:[X,Y-H-FL+8,X+W2,Y+h],r}}
  // (a section down (SiegeWorks collapse): its stretch of the layer a slope of rubble, its blocks tumbled out on both sides, its dust;
  // a tower's standing prop gone)
  rubble(sec){const w=this.w,cs=w.cs,C=this.C,g=this.cv&&this.cv.getContext('2d'),F=SIEGE_ART.foot;if(!g)return;const X0=w.x0-F-(sec.tower?cs:0),X1=w.x1+4,Y0=sec.r0*cs,Y1=(sec.r1+1)*cs,s=w.seed+sec.r0*31;
    rect(g,shade(C[2],.82),X0,Y0,X1-X0,Y1-Y0);for(let k=0;k<(Y1-Y0)*(X1-X0)/14;k++){const x=X0-8+hs(k,1,s)*(X1-X0+16),y=Y0+hs(k,2,s)*(Y1-Y0),z=1+Math.floor(hs(k,3,s)*4),c=C[Math.floor(hs(k,4,s)*4)];rect(g,'rgba(10,12,18,.35)',x+1,y+1,z,z-1||1);rect(g,c,x,y,z,Math.max(1,z-1))}
    for(let k=0;k<5;k++)rect(g,'rgba(10,12,18,.28)',X0+hs(k,5,s)*(X1-X0),Y0,2,Y1-Y0);if(sec.tower)this.props=this.props.filter(p=>p.r!==sec.r0)}
  // (the field in view: the ground, the wall's layer, the gate (its doors and portcullis whole, battered or broken), the ram)
  drawView(g,x0,y0,x1,y1,z){const L=this.base.ground||this.base;if(L.drawView)L.drawView(g,x0,y0,x1,y1,z);else drawInView(L);if(!this.cv)return;
    const a=Math.max(0,Math.floor(x0)),b=Math.max(0,Math.floor(y0)),c=Math.min(BW,Math.ceil(x1)),d=Math.min(BH,Math.ceil(y1));if(c>a&&d>b)g.drawImage(this.cv,a,b,c-a,d-b,a,b,c-a,d-b);
    const w=this.w,X=w.x0-SIEGE_ART.foot,Y0=w.gy0,Y1=w.gy1,now=performance.now()/1000,Wd=this.wood;
    if(!w.open){const ram=!!B&&B.t-(w.ramT??-9)<.4,k=w.hp/w.hp0,sh=ram?Math.round(Math.sin(now*40)):0;
      // (the doors: heavy planks, iron bands and studs, shut across the passage's outer mouth; cracks as the ram works; the portcullis behind)
      rect(g,'#1a120a',X-1+sh,Y0,8,Y1-Y0);for(let y=Y0+1;y<Y1-1;y+=4){rect(g,Wd[1],X+sh,y,6,3);rect(g,Wd[0],X+sh,y,6,1)}for(const fy of [Y0+8,Y1-10])rect(g,'#3a3a40',X+sh,fy,6,2);
      for(let y=Y0+4;y<Y1-4;y+=8)rect(g,'#c8c8d0',X+2+sh,y,1,1);if(k<.66)rect(g,'#0a0806',X+2,Y0+10,1,Math.round((Y1-Y0-20)*(1-k)));if(k<.33)rect(g,'#0a0806',X+4,Y0+18,1,Math.round((Y1-Y0-28)*(1-k)));
      for(let y=Y0;y<Y1;y+=4)rect(g,'#2a2a30',X+12,y,4,1);rect(g,'#3a3a42',X+11,Y0,1,Y1-Y0);rect(g,'#3a3a42',X+16,Y0,1,Y1-Y0)}
    else{for(let k=0;k<9;k++){const px=X-14+Math.round(hs(k,1,w.seed)*24),py=Y0+Math.round(hs(k,2,w.seed)*(Y1-Y0-4));rect(g,Wd[k%2?1:2],px,py,6+(k%3),2);rect(g,Wd[3],px,py+2,6+(k%3),1)}}
    // (each standing section's cracks as its strength goes: zigzags down its outer face)
    for(const q of w.secs||[]){if(q.down||q.hp>=q.hp0)continue;const n=Math.ceil((1-q.hp/q.hp0)*4),y0=q.r0*w.cs,y1=(q.r1+1)*w.cs;
      for(let k=0;k<n;k++){let x=w.x0-2+Math.round(hs(k,q.r0,w.seed)*8),y=y0+hs(k,q.r1,w.seed)*(y1-y0-10);for(let j=0;j<6;j++){rect(g,'#120e0a',x,y,1,2);x+=hs(k,j,w.seed)<.5?-1:1;y+=2}}}
    this.ladders(g);
    // (the braziers on the walk: their coals' flicker and glow)
    for(const q of this.braziers){const f=.6+.4*Math.sin(now*9+q.x*.7+q.y);g.save();g.globalAlpha=.16*f;g.fillStyle='#ff9a40';g.beginPath();g.arc(q.x,q.y,7+f*2,0,6.283);g.fill();g.restore();rect(g,f>.8?'#ffd070':'#ff8a30',q.x-1,q.y-1,2,2)}
    // (the torches on the outer face: their flames' flicker and glow)
    for(const q of this.torches){const f=.6+.4*Math.sin(now*11+q.y*.9);g.save();g.globalAlpha=.18*f;g.fillStyle='#ffb050';g.beginPath();g.arc(q.x,q.y,6+f*2,0,6.283);g.fill();g.restore();rect(g,'#ff8a30',q.x-1,q.y-1,2,2);rect(g,f>.75?'#ffe08a':'#ffb050',q.x-1,q.y-2-Math.round(f),1,2)}
    // (the standard's ring in its court, faint; its taking as an arc of your colour round it)
    {const f=w.flag,F=SIEGE_FIGHT.flag;if(f&&F.on&&!f.taken){g.save();g.strokeStyle='rgba(255,240,200,.22)';g.lineWidth=1;g.setLineDash([4,4]);g.beginPath();g.arc(f.x,f.y,F.r,0,6.283);g.stroke();g.setLineDash([]);
      if(f.prog>0){g.strokeStyle='rgba(110,170,255,.85)';g.lineWidth=3;g.beginPath();g.arc(f.x,f.y,F.r,-Math.PI/2,-Math.PI/2+6.283*f.prog/F.hold);g.stroke()}g.restore()}}
    // (pitch poured on the ram's crew: black runs down over the doors, as it falls; a palisade's stones)
    if(B&&!w.open&&B.t-(w.pitchT??-9)<.8){const k=(B.t-w.pitchT)/.8;for(let i=0;i<5;i++){const py=Y0+4+i*(Y1-Y0-8)/4;rect(g,w.kind==='stake'?'#6e665e':'#0e0c0a',X-2-Math.round(k*10),Math.round(py),Math.round(4+k*8),2)}}
    // (your trebuchets: their frame, the arm swung up as it looses and back down to cock, the counterweight; smashed, a heap)
    for(const e of w.engines||[])this.trebuchet(g,e,now);
    // (stones in flight: high in their arc, their shadow on the ground under them)
    for(const q of w.shots||[]){const k=q.t/q.T,x=q.fx+(q.tx-q.fx)*k,y=q.fy+(q.ty-q.fy)*k,h=Math.sin(Math.PI*k)*Math.min(160,Math.abs(q.tx-q.fx)*.35);
      rect(g,'rgba(10,12,18,.25)',Math.round(x-2),Math.round(y),4,2);rect(g,'#6e665e',Math.round(x-2),Math.round(y-h-3),5,5);rect(g,'#9a9286',Math.round(x-2),Math.round(y-h-3),3,2)}
    if(w.ram){const swing=!!B&&B.t-(w.ramT??-9)<.4&&!w.open?Math.round(3*Math.sin(now*6)):0,rx=X-40,ry=(Y0+Y1)/2;
      // (the ram: a shed on wheels, its roof of hides, the beam slung under it, its iron head toward the gate)
      rect(g,'rgba(10,12,18,.3)',rx+2,ry+10,34,4);for(const wx of [rx+4,rx+26])for(const wy of [ry-11,ry+8]){rect(g,'#2a1a0c',wx,wy,6,4);rect(g,'#6a4a2a',wx+1,wy+1,4,2)}
      rect(g,'#3a2614',rx+swing+16,ry-2,26,4);rect(g,'#6a6a72',rx+swing+40,ry-3,6,6);rect(g,'#9a9aa2',rx+swing+41,ry-3,4,1);
      rect(g,'#2a1a0c',rx,ry-10,34,20);for(let k=0;k<34;k+=4)rect(g,k%8?'#8a6a44':'#a07a4c',rx+k,ry-9,3,18);rect(g,'#c8a87a',rx,ry-10,34,1);rect(g,'#4a3020',rx,ry+9,34,1)}}
  trebuchet(g,e,now){const Wd=this.wood,x=Math.round(e.x),y=Math.round(e.y);rect(g,'rgba(10,12,18,.3)',x-16,y+2,36,5);
    if(e.hp<=0){for(let k=0;k<6;k++)rect(g,Wd[k%3],x-14+k*5,y-4+((k*7)%5),12,3);rect(g,'#3a2a1a',x-4,y-10,3,10);return}
    const since=B?B.t-e.shotT:9,R0=3.5,R1=1,a=since<.35?R0+(R1-R0)*(since/.35):since<3?R1+(R0-R1)*Math.min(1,(since-.35)/2.6):R0;// (its long arm back and down at rest (west, from the wall), up over the top to the east as it looses, then wound back)
    rect(g,Wd[3],x-17,y-3,34,5);rect(g,Wd[1],x-16,y-3,32,2);rect(g,Wd[0],x-16,y-3,32,1);for(const wx of [x-15,x+9]){rect(g,'#2a1a0c',wx,y,6,5);rect(g,'#6a4a2a',wx+1,y+1,4,3);rect(g,'#9a7a4a',wx+2,y+2,2,1)}// (its base of squared timbers and its wheels)
    for(const s of [-1,1])for(let k=0;k<31;k++){const lx=x+s*Math.round(10-k*.3);rect(g,s<0?Wd[0]:Wd[2],lx,y-3-k,2,1);rect(g,Wd[3],lx+(s<0?2:-1),y-3-k,1,1)}// (its A-frame, two timbers a side, lit on the west)
    rect(g,Wd[2],x-7,y-16,14,2);rect(g,Wd[1],x-6,y-16,12,1);rect(g,Wd[3],x-3,y-35,6,4);rect(g,'#5a5a62',x-1,y-34,2,2);// (its brace across the frame, the axle block and its iron pin)
    const ax=x,ay=y-33,L1=32,L2=11,ca=Math.cos(a),sa=Math.sin(a);for(let k=-L2;k<=L1;k++){const px=Math.round(ax+ca*k),py=Math.round(ay-sa*k);rect(g,k<0?Wd[2]:Wd[1],px,py,2,2);rect(g,Wd[0],px,py,1,1)}// (its arm: long to the sling, short to the weight)
    {const tx=Math.round(ax+ca*L1),ty=Math.round(ay-sa*L1),hang=since<.35?0:8;rect(g,'#d8c8a0',tx,ty,1,hang+2);if(hang)rect(g,'#6e665e',tx-1,ty+hang+2,3,3)}// (its sling, and the next stone in it once wound back)
    const wx=Math.round(ax-ca*L2),wy=Math.round(ay+sa*L2);rect(g,'#2e2e34',wx-5,wy,10,9);rect(g,'#4e4e56',wx-4,wy+1,8,3);rect(g,'#7a6a50',wx-5,wy+3,10,1);rect(g,'#7a6a50',wx-5,wy+7,10,1);// (the counterweight box, iron-banded)
    if(e.hp<e.hp0)rect(g,'#120e0a',x-6,y-12,1,6)}
  get mini(){if(this._mini||!this.cv)return this._mini||null;const cs=TERRAIN.cs,C=Math.ceil(BW/cs),R=Math.ceil(BH/cs),cv=mkcv(C,R),g=cv.getContext('2d');g.imageSmoothingEnabled=true;
    g.fillStyle='rgb(84,110,62)';g.fillRect(0,0,C,R);g.drawImage(this.cv,0,0,BW,BH,0,0,C,R);g.fillStyle=this.C[1];for(const r of this.w.towers)g.fillRect(this.w.c0-1,r,4,SIEGE_WALL.tower);return this._mini=cv}
}
/* ---------- the assault (startBattle: SiegeWorks.on): BattleSetup's steps against the wall ---------- */
class SiegeSetup extends BattleSetup{
  constructor(opts){super(opts);const e=G.enc,t=e.ref,s=mySiege(t);this.ram=!!G.capWith||!!s&&s.days>=RAM_DAYS;this.seed=Math.floor(hash(t.tx||0,t.ty||0,431)*4294967296)>>>0}
  groundSpec(){const E=this.env,n=siegeEngines(G.enc.ref);E.t=T_OPEN;E.name='Shadow of the walls';E.text='The walls of '+G.enc.ref.name+': climb them by your ladders'+(this.ram?', or break the gate with the ram':'')+(n?'; your '+(n>1?n+' trebuchets':'trebuchet')+' batter the wall (click a stretch of it to aim them)':'')+'; their archers hold the wall-walk.';return{siege:true,seed:this.seed}}
  terrain(){const FI=this.field;this.works=new SiegeWorks(G.enc.ref,BW,FI.top,FI.bot,{ram:this.ram,seed:this.seed,engines:siegeEngines(G.enc.ref)});return this.TR=buildTerrain({...this.ground,W:BW,top:FI.top,bot:FI.bot,siege:this.works})}
  *paint(){this.works.clim=this.env.c;const base=yield* arenaSteps(this.env.c);this.painted=yield* new SiegeArt(this.works,base).paintSteps()}
  muster(){super.muster();B.works=this.works;B.holds=true;for(const u of B.units)if(isRider(u))Dismount.down(u,'none');this.post();this.works.placeEngines();this.works.placeMantlets()}
  /* (the defenders at their posts: shooters along the wall-walk, clear of the gate and towers, in a file facing out; foot behind
     the gate; the rest (lords, characters) by the lord's standard in the court) */
  post(){const w=this.works,cs=w.cs,gs=Object.values(B.groups).filter(g=>g.team!==0&&grpUnits(g.id).length),arc=gs.filter(g=>g.role==='arc'||g.role==='mag'),foot=gs.filter(g=>g.role==='inf'||g.role==='cav'),rest=gs.filter(g=>!arc.includes(g)&&!foot.includes(g));
    const walk=[];for(let r=w.R0+1;r<w.R1;r++)if(!(r>=w.g0-1&&r<=w.g1+1)&&!w.isTower(r))walk.push(r);
    const put=(g,x,y,files)=>{const m=grpUnits(g.id);g.form='line';g.files=Math.max(1,Math.min(files,m.length));g.face=g.currentFacing=Math.PI;g.ax=x;g.ay=y;g.tgt=null;g.queue=[];
      const S=formSlots(g.form,m.length,g.face,g.files);m.forEach((u,i)=>{u.sx=S[i][0];u.sy=S[i][1];u.x=x+u.sx;u.y=y+u.sy;u.dir=g.face;u.face=-1})};
    const wx=(w.x0+w.x1)/2;arc.forEach((g,i)=>{const r=walk[Math.floor((i+.5)*walk.length/Math.max(1,arc.length))]||walk[0];const m=grpUnits(g.id);put(g,wx,(r+.5)*cs,m.length)});
    const gy=(w.gy0+w.gy1)/2;foot.forEach((g,i)=>put(g,w.x1+50+Math.floor(i/3)*40,gy+((i%3)-1)*56,4));const f=w.flag;rest.forEach((g,i)=>put(g,Math.min(BW-40,f.x+16+i*20),f.y+(i%2?28:-28),4))}
}
