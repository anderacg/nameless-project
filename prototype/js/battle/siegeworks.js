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
const SIEGE_WALL={on:true,x:.6,thick:3,lv:[0,1,2,2],gate:4,hp:[0,260,480,720],ram:12,ramR:26,towers:12,tower:2,stairs:9,stair:2,ladders:3,ladder:1,
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
    this.sections();this.engines=[];this.shots=[];this.mangonel=null;this.nEngines=Math.max(0,o.engines|0);this.aim=null}
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
  // (its plan for the battle's terrain: open ground, and the wall laid by raster)
  plan(W,H,top,bot){return{recipe:'siege',layout:this.kind,W,H,top,bot,hills:[],woods:[],marsh:[],rocks:[],rivers:[],lane:null,siege:this}}
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
  step(dt){this.ramStep(dt);this.engineStep(dt)}
  ramStep(dt){if(this.open||!this.ram)return;const S=SIEGE_WALL,x=this.x0,n=B.units.filter(u=>u.team===0&&u.hp>0&&!u.rout&&!u.left&&!u.s.range&&!u.hero&&u.x>x-S.ramR&&u.x<x+4&&u.y>this.gy0-6&&u.y<this.gy1+6).length;
    if(!n)return;this.ramT=B.t;this.hp-=n*S.ram*dt;this.hit=(this.hit||0)+dt;if(this.hit>.5){this.hit=0;sfxAt&&sfxAt('hit',x,(this.gy0+this.gy1)/2,{vol:.6});B.floats.push({x:x-6,y:this.gy0-8,t:'Ram!',life:.8,c:'#ffd08a'})}
    if(this.hp<=0)this.breach()}
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
  land(q){const E=SIEGE_ENGINE;if(typeof vfx==='function')for(let k=0;k<6;k++)vfx({k:'dust',x:q.tx+(Math.random()-.5)*10,y:q.ty+(Math.random()-.5)*6,vx:(Math.random()-.5)*40,vy:-10-Math.random()*20,r:2,grow:8,life:.9,col:'#b8ab98'});
    B.rings.push({x:q.tx,y:q.ty,r:E.splash,life:.3,max:.3,col:'200,180,150'});if(typeof sfxAt==='function')sfxAt('hit',q.tx,q.ty,{vol:.9});
    for(const u of B.units)if(u.hp>0&&!u.left&&Math.hypot(u.x-q.tx,u.y-q.ty)<E.splash)this.hurt(u,sRand(E.hurt));
    if(q.def){const e=q.at;if(e&&e.hp>0&&(e.hp-=sRand(E.def.dmg))<=0){e.hp=0;toast('A trebuchet is smashed!','bad');log('The defenders\' mangonel smashes one of your trebuchets.','bad','war')}return}
    const s=q.sec;if(!s||s.down)return;s.hp-=sRand(E.dmg);if(s.hp<=0)this.collapse(s)}
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
    for(const g of Object.values(B.groups))if(g.team!==0)g.roused=true;
    const what=s.tower?'A tower':'The wall';toast(what+' comes down!','good');log(what+' of '+this.t.name+' comes down under your engines.','good','war');battleEvent('breach',{text:what+' is down',team:0})}
  // the gate gives way: its cells open ground, the ways and sight made again; every defender roused
  breach(){if(this.open)return;this.open=true;this.hp=0;const T=B.terrain,C=T.C;
    for(let r=this.g0;r<=this.g1;r++)for(let c=this.c0;c<=this.c1;c++){const i=r*C+c;T.kind[i]=TKIND.open;T.lvl[i]=0;if(T.rockH)T.rockH[i]=0}
    T.routes.build(T.rows[0],T.rows[1]);T.index();if(B.sight&&B.sight.fogCast)B.sight.fogCast.clear();
    for(const g of Object.values(B.groups))if(g.team!==0)g.roused=true;
    toast('The gate gives way!','good');log('The gate of '+this.t.name+' gives way under the ram.','good','war');battleEvent('breach',{text:'The gate is down',team:0})}
}
/* ---------- its look (the owner, 2026-11-06: "improve the sprites in siege"), in the holding's culture (TOURNEY_ARENA.walls: its
   stone, its timber), over the climate's ground. Painted once into the field's layer: the wall's sloped foot outside, its walk of
   flagstones (a palisade's planks), its parapet's merlons each with its face, the inner lip, its shadow; the stairs; the gate's
   cobbled passage; your ladders leaning on it. Standing (props, sorted with the soldiers by their feet, faded when one of yours
   is behind: render.js propsInView): each tower, raised (its crenellated top, its face of courses and arrow slits, the lord's
   banner). Each frame: the gate's doors and portcullis (whole, battered, broken) and the ram, its head swinging while it works ---------- */
const SIEGE_ART={rise:18,riseL:8,foot:6,merlon:[6,4],face:2,shadow:14};
class SiegeArt{
  constructor(w,base){this.w=w;this.base=base;this.cv=null;const t=w.t,A=TOURNEY_ARENA.walls,cul=holdingCulture(t),own=t.owner&&FACS[t.owner];
    this.cul=cul;this.col=own?own.col:'#9a9a9a';this.dev=own&&t.owner!=='player'?t.owner:'star';
    const st=A[cul]&&A[cul].kind==='stone'?A[cul]:A.vale,wood=A[cul]&&A[cul].kind!=='stone'?A[cul]:A.timber;
    this.C=w.kind==='stake'?wood.c:w.kind==='great'?st.c.map(c=>shade(c,1.06)):st.c;this.trim=(w.kind==='stake'?wood:st).trim;this.wood=wood.c;this.props=[];w.art=this}
  *paintSteps(){const w=this.w,cv=mkcv(BW,BH),g=cv.getContext('2d'),cs=w.cs,C=this.C,x0=w.x0,x1=w.x1,y0=w.R0*cs,y1=(w.R1+1)*cs,A=SIEGE_ART;
    const skip=y=>this.gateRow(y)||w.isTower(Math.floor(y/cs));
    // (its shadow on the yard, soft)
    for(let k=0;k<A.shadow+w.L*4;k++){g.fillStyle='rgba(10,12,18,'+(.42*(1-k/(A.shadow+w.L*4))).toFixed(3)+')';g.fillRect(x1+k,y0,1,y1-y0)}yield;
    if(w.kind==='stake')this.palisade(g,y0,y1,skip);else this.stone(g,y0,y1,skip);yield;
    // (the stairs down into the yard: steps across the inner lip)
    for(const r of w.stairs){const y=r*cs,h=SIEGE_WALL.stair*cs;for(let k=0;k<h;k+=3){rect(g,C[3],x1-12,y+k,14,1);rect(g,C[1],x1-12,y+k+1,14,2)}rect(g,C[3],x1+2,y,1,h)}
    this.passage(g);for(const r of w.ladders)this.ladder(g,x0,r*cs);
    for(const r of w.towers)this.props.push(this.tower(r));this.props.sort((a,b)=>a.y-b.y);
    this.cv=cv;return this}
  gateRow(y){const w=this.w;return y>=w.gy0&&y<w.gy1}
  // (stone: the sloped foot outside, the walk's flags, the parapet and its merlons, the inner lip)
  stone(g,y0,y1,skip){const w=this.w,C=this.C,x0=w.x0,x1=w.x1,s=w.seed%9973,[mh,mg]=SIEGE_ART.merlon,F=SIEGE_ART.foot;
    for(let y=y0;y<y1;y++){if(skip(y))continue;
      for(let x=x0-F;x<x0;x++){const k=(x-(x0-F))/F;g.fillStyle=k<.25?C[3]:hs(x>>1,y>>2,s)<.2?C[3]:k<.6?C[2]:C[1];g.fillRect(x,y,1,1)}// (the talus: dark at its foot, lit toward the wall)
      if(!((y+((y>>3)&1)*3)%6))rect(g,C[3],x0-F+2,y,F-2,1);
      for(let x=x0+8;x<x1-3;x++){const fx=x-(x0+8),row=Math.floor(y/6),col=Math.floor((fx+(row&1)*5)/10),v=hs(col,row,s);g.fillStyle=(y%6===0||(fx+(row&1)*5)%10===0)?C[2]:v<.15?shade(C[1],.92):v>.85?shade(C[1],1.06):C[1];g.fillRect(x,y,1,1)}// (flagstones)
      rect(g,C[2],x0,y,8,1);rect(g,C[3],x0+7,y,1,1);rect(g,C[0],x1-3,y,2,1);rect(g,C[3],x1-1,y,1,1)}
    // (the merlons: each a block with its top lit and its face below it; dark crenels between)
    for(let y=y0;y<y1;y+=mh+mg){if(skip(y)||skip(y+mh+1))continue;rect(g,C[0],x0,y,7,mh);rect(g,shade(C[0],1.08),x0+1,y,5,1);rect(g,C[2],x0,y+mh,7,SIEGE_ART.face);rect(g,C[3],x0+6,y,1,mh+SIEGE_ART.face);rect(g,'rgba(10,12,18,.5)',x0,y+mh+SIEGE_ART.face,7,mg-SIEGE_ART.face)}}
  // (a palisade: logs side by side, their sharpened tops outside lit, a plank walk on posts behind, the logs' lashing)
  palisade(g,y0,y1,skip){const w=this.w,C=this.C,x0=w.x0,x1=w.x1,s=w.seed%9973;
    for(let y=y0;y<y1;y++){if(skip(y))continue;const pl=Math.floor(y/4)%2;rect(g,pl?C[1]:shade(C[1],.92),x0+10,y,x1-x0-12,1);if(y%4===0)rect(g,C[3],x0+10,y,x1-x0-12,1)}
    for(let y=y0;y<y1;y+=4){if(skip(y)||skip(y+3))continue;const t=hs(1,y,s)<.5?1:0;
      rect(g,C[3],x0-4-t,y,14+t,4);rect(g,C[1],x0-3-t,y,12+t,3);rect(g,C[0],x0-3-t,y,3,2);rect(g,C[2],x0+3,y+1,6,2);rect(g,'#e8d8b0',x0-4-t,y+1,1,1)}// (each log: its point west, lit, its length to the walk)
    for(let y=y0;y<y1;y+=18){if(skip(y))continue;rect(g,'#3a2a1a',x0+4,y,2,4)}}
  // (the gate's passage: cobbles through the wall, dark at its mouths)
  passage(g){const w=this.w,X=w.x0-SIEGE_ART.foot,W2=w.x1-X+4,Y0=w.gy0,Y1=w.gy1,s=w.seed;
    for(let y=Y0;y<Y1;y++){const row=Math.floor(y/5),off=hs(row,7,s)*6|0;for(let x=X;x<X+W2;x++){const cx=Math.floor((x+off)/(5+(row%2))),v=hs(cx,row,s+3),e=(x+off)%(5+(row%2))===0||y%5===0;g.fillStyle=w.kind==='stake'?(v<.3?'#6a5236':v<.7?'#7a6040':'#8a6e4a'):e?'#3e3834':v<.3?'#6e665e':v<.7?'#7e766c':'#8e867a';g.fillRect(x,y,1,1)}}// (cobbles of uneven size, row by row; a palisade's trodden earth)
    rect(g,'rgba(10,12,18,.45)',X,Y0,W2,3);rect(g,'rgba(10,12,18,.3)',X,Y1-2,W2,2)}
  // (a ladder leaning on the wall: two rails from its foot outside to the parapet, rungs, its shadow)
  ladder(g,x,y){const L=this.w.L*10+16,X=x-L;rect(g,'rgba(10,12,18,.3)',X+2,y+12,L,3);
    for(const dy of [2,10]){for(let k=0;k<L;k++){const t=k/L;rect(g,t<.5?'#7a5634':'#9a7448',X+k,y+dy-Math.round(t*1),1,2)}}for(let k=3;k<L;k+=5){rect(g,'#b08a5a',X+k,y+3,2,8);rect(g,'#5a3e26',X+k+2,y+4,1,7)}}
  // (a tower, standing: its top raised over its footprint (crenellated, a hatch), its face below (courses, two arrow slits, lit to
  // the west), the lord's banner on its top; a prop: its feet its footprint's south edge)
  tower(r){const w=this.w,cs=w.cs,C=this.C,X=w.x0-cs,Y=r*cs,W2=w.x1-X+2,h=SIEGE_WALL.tower*cs,H=SIEGE_ART.rise+w.L*SIEGE_ART.riseL,FL=22,stake=w.kind==='stake';
    const cv=mkcv(W2+2,FL+h+H),g=cv.getContext('2d'),ty=FL,fy=FL+h;// (its top from ty to fy, its face from fy to fy + H)
    for(let y=0;y<H;y++)for(let x=0;x<W2;x++){let c;if(stake)c=x%4===0?C[3]:x%4===1?C[0]:C[1];else{const row=Math.floor(y/4),j=(x+(row&1)*4)%8===0;c=y%4===0||j?C[2]:x<3?C[0]:x>W2-4?C[3]:C[1]}g.fillStyle=c;g.fillRect(x,fy+y,1,1)}
    rect(g,'rgba(10,12,18,.35)',0,fy,W2,2);for(const sx of [Math.round(W2*.3),Math.round(W2*.65)]){rect(g,'#14100c',sx,fy+5,2,Math.min(8,H-8));rect(g,C[0],sx-1,fy+4,4,1)}// (arrow slits)
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
  *paint(){const base=yield* arenaSteps(this.env.c);this.painted=yield* new SiegeArt(this.works,base).paintSteps()}
  muster(){super.muster();B.works=this.works;B.holds=true;for(const u of B.units)if(isRider(u))Dismount.down(u,'none');this.post();this.works.placeEngines()}
  /* (the defenders at their posts: shooters along the wall-walk, clear of the gate and towers, in a file facing out; foot behind
     the gate; the rest (lords, characters) in the yard behind them) */
  post(){const w=this.works,cs=w.cs,gs=Object.values(B.groups).filter(g=>g.team!==0&&grpUnits(g.id).length),arc=gs.filter(g=>g.role==='arc'||g.role==='mag'),foot=gs.filter(g=>g.role==='inf'||g.role==='cav'),rest=gs.filter(g=>!arc.includes(g)&&!foot.includes(g));
    const walk=[];for(let r=w.R0+1;r<w.R1;r++)if(!(r>=w.g0-1&&r<=w.g1+1)&&!w.isTower(r))walk.push(r);
    const put=(g,x,y,files)=>{const m=grpUnits(g.id);g.form='line';g.files=Math.max(1,Math.min(files,m.length));g.face=g.currentFacing=Math.PI;g.ax=x;g.ay=y;g.tgt=null;g.queue=[];
      const S=formSlots(g.form,m.length,g.face,g.files);m.forEach((u,i)=>{u.sx=S[i][0];u.sy=S[i][1];u.x=x+u.sx;u.y=y+u.sy;u.dir=g.face;u.face=-1})};
    const wx=(w.x0+w.x1)/2;arc.forEach((g,i)=>{const r=walk[Math.floor((i+.5)*walk.length/Math.max(1,arc.length))]||walk[0];const m=grpUnits(g.id);put(g,wx,(r+.5)*cs,m.length)});
    const gy=(w.gy0+w.gy1)/2;foot.forEach((g,i)=>put(g,w.x1+50+Math.floor(i/3)*40,gy+((i%3)-1)*56,4));rest.forEach((g,i)=>put(g,Math.min(BW-40,w.x1+160+i*24),gy+(i%2?40:-40),4))}
}
