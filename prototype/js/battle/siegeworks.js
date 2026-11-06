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
    this.ladders=[];for(let k=0;k<S.ladders&&free.length;k++){const want=R0+(R1-R0)*(k+1)/(S.ladders+1)+(R()-.5)*3;let best=free[0];for(const r of free)if(Math.abs(r-want)<Math.abs(best-want))best=r;this.ladders.push(best);free=free.filter(r=>Math.abs(r-best)>2)}}
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
  step(dt){if(this.open||!this.ram)return;const S=SIEGE_WALL,x=this.x0,n=B.units.filter(u=>u.team===0&&u.hp>0&&!u.rout&&!u.left&&!u.s.range&&!u.hero&&u.x>x-S.ramR&&u.x<x+4&&u.y>this.gy0-6&&u.y<this.gy1+6).length;
    if(!n)return;this.hp-=n*S.ram*dt;this.hit=(this.hit||0)+dt;if(this.hit>.5){this.hit=0;sfxAt&&sfxAt('hit',x,(this.gy0+this.gy1)/2,{vol:.6});B.floats.push({x:x-6,y:this.gy0-8,t:'Ram!',life:.8,c:'#ffd08a'})}
    if(this.hp<=0)this.breach()}
  // the gate gives way: its cells open ground, the ways and sight made again; every defender roused
  breach(){if(this.open)return;this.open=true;this.hp=0;const T=B.terrain,C=T.C;
    for(let r=this.g0;r<=this.g1;r++)for(let c=this.c0;c<=this.c1;c++){const i=r*C+c;T.kind[i]=TKIND.open;T.lvl[i]=0;if(T.rockH)T.rockH[i]=0}
    T.routes.build(T.rows[0],T.rows[1]);T.index();if(B.sight&&B.sight.fogCast)B.sight.fogCast.clear();
    for(const g of Object.values(B.groups))if(g.team!==0)g.roused=true;
    toast('The gate gives way!','good');log('The gate of '+this.t.name+' gives way under the ram.','good','war');battleEvent('breach',{text:'The gate is down',team:0})}
}
/* ---------- its look: over the climate's ground (the arena's), the wall: its walk, its parapet and merlons outside, the
   shadow it casts, the stairs, the towers' tops and south faces, the gatehouse (its doors shut, or broken), your ladders, the
   ram; a palisade its stakes. Painted once (in a canvas the field's size), the gate's state each frame ---------- */
class SiegeArt{
  constructor(w,base){this.w=w;this.base=base;this.cv=null}
  *paintSteps(){const w=this.w,cv=mkcv(BW,BH),g=cv.getContext('2d'),cs=w.cs,C=SIEGE_WALL.look[w.kind],x0=w.x0,x1=w.x1,y0=w.R0*cs,y1=(w.R1+1)*cs,H=w.L*7,s=w.seed%9973;
    // (the shadow it casts east, then the walk)
    for(let k=0;k<12+w.L*4;k++){g.fillStyle='rgba(10,12,18,'+(.4*(1-k/(12+w.L*4))).toFixed(3)+')';g.fillRect(x1+k,y0,1,y1-y0)}yield;
    if(w.kind==='stake'){for(let y=y0;y<y1;y+=3){if(this.gateRow(y)||w.isTower(Math.floor(y/cs)))continue;const t=hs(1,y,s)<.5?1:0;rect(g,C[3],x0,y,x1-x0,3);rect(g,C[1],x0+2,y,x1-x0-4,2);rect(g,C[2],x0+2,y+2,x1-x0-4,1);
        rect(g,C[0],x0-2-t,y,4+t,2);rect(g,C[2],x0-2-t,y+2,4+t,1)}}// (the palisade: stakes laid side by side, their sharpened tops outside, a fighting walk behind)
    else{for(let y=y0;y<y1;y++){if(this.gateRow(y)||w.isTower(Math.floor(y/cs)))continue;
        for(let x=x0;x<x1;x++){const v=hs(x>>2,(y+((x>>3)&1)*2)>>2,s),edge=x<x0+3;g.fillStyle=edge?C[2]:v<.12?C[2]:v>.9?C[0]:C[1];g.fillRect(x,y,1,1)}
        if(!(y&3))rect(g,C[2],x0+8,y,x1-x0-8,1);rect(g,C[3],x0,y,2,1);rect(g,C[2],x0+2,y,5,1);if((y%10)<6){rect(g,C[0],x0-5,y,8,1);rect(g,C[3],x0+3,y,2,1)}else rect(g,'rgba(10,12,18,.45)',x0-5,y,5,1);rect(g,C[3],x1-3,y,1,1)}// (stone courses; the parapet outside, its merlons with gaps between, their shade)
      rect(g,C[3],x1-1,y0,1,y1-y0)}
    yield;
    for(const r of w.stairs){const y=r*cs;for(let k=0;k<SIEGE_WALL.stair*cs;k+=3)rect(g,k%6?C[2]:C[0],x1-14,y+k,14,2)}
    for(const r of w.towers)this.tower(g,r);this.gatehouse(g);
    for(const r of w.ladders)this.ladder(g,x0,r*cs);
    this.cv=cv;return this}
  gateRow(y){const w=this.w;return y>=w.gy0&&y<w.gy1}
  // (a tower: its top a cell wider outside, crenellated, and its south face below it)
  tower(g,r){const w=this.w,cs=w.cs,C=SIEGE_WALL.look[w.kind],x=w.x0-cs,y=r*cs,W=w.x1-x,h=SIEGE_WALL.tower*cs,f=6+w.L*4;
    g.fillStyle='rgba(10,12,18,.3)';g.fillRect(x+W,y+4,8,h);rect(g,C[3],x-1,y-f,W+2,h+1);rect(g,C[1],x,y-f,W,h-1);rect(g,C[2],x+3,y-f+3,W-6,h-7);
    for(let k=0;k<W;k+=6)rect(g,C[0],x+k,y-f,3,2);rect(g,C[2],x,y+h-f,W,f);for(let k=0;k<f;k+=4)rect(g,C[3],x,y+h-f+k,W,1);rect(g,'#1a1612',x+W/2-2,y+h-f+2,3,4)}
  // (the gatehouse: two towers' worth over the gate rows; its doors drawn each frame, shut or broken)
  gatehouse(g){const w=this.w,C=SIEGE_WALL.look[w.kind];rect(g,C[3],w.x0-2,w.gy0-2,w.x1-w.x0+4,2);rect(g,C[3],w.x0-2,w.gy1,w.x1-w.x0+4,2)}
  // (a ladder leaning on the wall's face, its foot outside)
  ladder(g,x,y){const L=this.w.L*8+10;for(let k=0;k<L;k+=4)rect(g,'#9a7448',x-L+k,y+3,2,10);rect(g,'#6a4a2a',x-L,y+3,L,2);rect(g,'#6a4a2a',x-L,y+11,L,2)}
  // (the field in view: the ground, the wall, the gate's doors or its wreck, the ram before it)
  drawView(g,x0,y0,x1,y1,z){const L=this.base.ground||this.base;if(L.drawView)L.drawView(g,x0,y0,x1,y1,z);else drawInView(L);if(!this.cv)return;
    const a=Math.max(0,Math.floor(x0)),b=Math.max(0,Math.floor(y0)),c=Math.min(BW,Math.ceil(x1)),d=Math.min(BH,Math.ceil(y1));if(c>a&&d>b)g.drawImage(this.cv,a,b,c-a,d-b,a,b,c-a,d-b);
    const w=this.w,X=w.x0,Y0=w.gy0,Y1=w.gy1,Wd=w.x1-X;
    if(!w.open){const k=w.hp/w.hp0;rect(g,'#3a2410',X,Y0,Wd,Y1-Y0);for(let y=Y0+2;y<Y1-2;y+=5)rect(g,'#7a5030',X+2,y,Wd-4,3);rect(g,'#2a2a2a',X,Y0+(Y1-Y0)/2-1,Wd,2);if(k<.6)rect(g,'#1a1008',X+4,Y0+6,3,Y1-Y0-12)}
    else{for(let k=0;k<6;k++)rect(g,'#5a3a1e',X+Math.round(hs(k,1,w.seed)*Wd),Y0+Math.round(hs(k,2,w.seed)*(Y1-Y0)),5,2)}
    if(w.ram){const rx=X-34,ry=(Y0+Y1)/2;rect(g,'#2a1a0c',rx,ry-9,30,18);rect(g,'#6a4a2a',rx+1,ry-8,28,16);for(let k=0;k<28;k+=5)rect(g,'#8a6a3a',rx+1+k,ry-8,2,16);rect(g,'#4a4a4e',rx+26,ry-2,8,4)}}
  get mini(){if(this._mini||!this.cv)return this._mini||null;const cs=TERRAIN.cs,C=Math.ceil(BW/cs),R=Math.ceil(BH/cs),cv=mkcv(C,R),g=cv.getContext('2d');g.imageSmoothingEnabled=true;
    g.fillStyle='rgb(84,110,62)';g.fillRect(0,0,C,R);g.drawImage(this.cv,0,0,BW,BH,0,0,C,R);return this._mini=cv}
}
/* ---------- the assault (startBattle: SiegeWorks.on): BattleSetup's steps against the wall ---------- */
class SiegeSetup extends BattleSetup{
  constructor(opts){super(opts);const e=G.enc,t=e.ref,s=mySiege(t);this.ram=!!G.capWith||!!s&&s.days>=RAM_DAYS;this.seed=Math.floor(hash(t.tx||0,t.ty||0,431)*4294967296)>>>0}
  groundSpec(){const E=this.env;E.t=T_OPEN;E.name='Shadow of the walls';E.text='The walls of '+G.enc.ref.name+': climb them by your ladders'+(this.ram?', or break the gate with the ram':'')+'; their archers hold the wall-walk.';return{siege:true,seed:this.seed}}
  terrain(){const FI=this.field;this.works=new SiegeWorks(G.enc.ref,BW,FI.top,FI.bot,{ram:this.ram,seed:this.seed});return this.TR=buildTerrain({...this.ground,W:BW,top:FI.top,bot:FI.bot,siege:this.works})}
  *paint(){const base=yield* arenaSteps(this.env.c);this.painted=yield* new SiegeArt(this.works,base).paintSteps()}
  muster(){super.muster();B.works=this.works;B.holds=true;for(const u of B.units)if(isRider(u))Dismount.down(u,'none');this.post()}
  /* (the defenders at their posts: shooters along the wall-walk, clear of the gate and towers, in a file facing out; foot behind
     the gate; the rest (lords, characters) in the yard behind them) */
  post(){const w=this.works,cs=w.cs,gs=Object.values(B.groups).filter(g=>g.team!==0&&grpUnits(g.id).length),arc=gs.filter(g=>g.role==='arc'||g.role==='mag'),foot=gs.filter(g=>g.role==='inf'||g.role==='cav'),rest=gs.filter(g=>!arc.includes(g)&&!foot.includes(g));
    const walk=[];for(let r=w.R0+1;r<w.R1;r++)if(!(r>=w.g0-1&&r<=w.g1+1)&&!w.isTower(r))walk.push(r);
    const put=(g,x,y,files)=>{const m=grpUnits(g.id);g.form='line';g.files=Math.max(1,Math.min(files,m.length));g.face=g.currentFacing=Math.PI;g.ax=x;g.ay=y;g.tgt=null;g.queue=[];
      const S=formSlots(g.form,m.length,g.face,g.files);m.forEach((u,i)=>{u.sx=S[i][0];u.sy=S[i][1];u.x=x+u.sx;u.y=y+u.sy;u.dir=g.face;u.face=-1})};
    const wx=(w.x0+w.x1)/2;arc.forEach((g,i)=>{const r=walk[Math.floor((i+.5)*walk.length/Math.max(1,arc.length))]||walk[0];const m=grpUnits(g.id);put(g,wx,(r+.5)*cs,m.length)});
    const gy=(w.gy0+w.gy1)/2;foot.forEach((g,i)=>put(g,w.x1+50+Math.floor(i/3)*40,gy+((i%3)-1)*56,4));rest.forEach((g,i)=>put(g,Math.min(BW-40,w.x1+160+i*24),gy+(i%2?40:-40),4))}
}
