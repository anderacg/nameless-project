'use strict';
/* ---------- a fight on a field of its own, copied from the map where it is met (the owner, 2026-11-26: "make it into a small battle
   map square based on what we already have but we use a place as actual place like x * y tiles, like create a copy version of the
   area and battle in a separate map"; "I want style 2") ----------
   A first cut, behind its switch (the developer console's separate on|off, kept between games: PREFS.copyfield): a fight with an army
   or a beast met on the map (kinds) is fought on a field of its own, not on the map. The field's size by the soldiers coming to it,
   as any field's (FIELD_SIZES); its ground the map round the fight's middle (fightArea) copied into its grid, s field px a world px
   as a fight on the map reads it (worldbattle.js worldGrid: the water by its depth, fords, woods, marsh, rock, roads, the height and
   its steps, the climate, the buildings' footprints), painted as a field is (engine/ground.js). The world waits while it is fought,
   as a field battle's always has; your band forms up on the left and theirs on the right, as on any field, a man set down on rock or
   deep water moved to the nearest open ground (CopyBattleSetup#initialize); its end and spoils a field battle's. COPY_FIELD: on, the
   rule itself; scale, field px a world px (a fight on the map's: WORLD_BATTLE.scale); kinds, the encounters it takes; hs, a building's model drawn so many times its size (the map's: scale) */
const COPY_FIELD={on:true,scale:6,hs:6,kinds:['party','lord','patrol','caravan','monster']};
const CopyField={
  wants(e,opts){return COPY_FIELD.on&&!!prefGet('copyfield')&&!!e&&COPY_FIELD.kinds.includes(e.kind)&&!opts.tournament&&!opts.sandbox},
  // (the fight's middle on the map, as a fight on the map would centre it: between your army and theirs)
  middle(e){const a=fightArea(e);return a?{x:a.x,y:a.y}:{x:P.x,y:P.y}},
  // (the map's roads and paths in the window (worldways.js waysOf: its segments, game px) as the field's ways, field px, each run of
  // joined segments one line ({kind, p}: engine/ground.js paints them); pad px past the field's edge kept so a way runs off it)
  ways(x0,y0,s,W,H,pad=48){const P=WorldArt.ensure(),Y=P&&typeof waysOf==='function'?waysOf(P):null;if(!Y||!Y.RA)return[];const A=Y.RA,K=Y.RK,out=[],at=(x,y)=>[(x-x0)*s,(y-y0)*s],inside=q=>q[0]>-pad&&q[1]>-pad&&q[0]<W+pad&&q[1]<H+pad;let cur=null,ex=NaN,ey=NaN;
    for(let k=0;k<K.length;k++){const o=k*6,a=at(A[o],A[o+1]),b=at(A[o+2],A[o+3]),kind=K[k]?'path':'road';if(!inside(a)&&!inside(b)){cur=null;continue}
      if(cur&&cur.kind===kind&&A[o]===ex&&A[o+1]===ey)cur.p.push(b);else out.push(cur={kind,p:[a,b]});ex=A[o+2];ey=A[o+3]}return out},
  // (the holdings' buildings in the window, where they stand, field px: each lot's footprint as the map draws it, its model drawn hs
  // times its size (engine/ground.js, the field's built houses; their cells barred as on the map: worldGrid))
  houses(x0,y0,s,W,H){const out=[];for(const t of TOWNS)for(const l of t.lots||[]){if(l.st==='ruined'||l.k==='field'||l.k==='pasture')continue;const x=(l.x*TILE-x0)*s,y=(l.y*TILE-y0)*s,n=l.n*TILE*s;
    if(x+n<=0||y+n<=0||x>=W||y>=H)continue;out.push({x,y,w:n,h:n,s:COPY_FIELD.hs,k:l.k,type:l.type,people:lotPeople(t,l),culture:holdingCulture(t),seed:l.seed|0})}return out},
  // (the nearest open cell's middle to field point (x, y) on T: none solid (rock, deep water), searched out in rings of cells)
  open(T,x,y){const i=tIx(T,x,y);if(!T.solid||!T.solid[i])return null;const cs=T.cs,c0=i%T.C,r0=(i/T.C)|0;
    for(let d=1;d<Math.max(T.C,T.R);d++)for(let r=r0-d;r<=r0+d;r++)for(let c=c0-d;c<=c0+d;c++){if(Math.max(Math.abs(r-r0),Math.abs(c-c0))!==d||c<0||r<0||c>=T.C||r>=T.R)continue;if(!T.solid[r*T.C+c])return{x:(c+.5)*cs,y:(r+.5)*cs}}return null}};
class CopyBattleSetup extends BattleSetup{
  // (the field's middle: the fight's on the map; its site, the tile there)
  battleSite(){const m=this.mid||(this.mid=CopyField.middle(G.enc));return battleSiteAt(m.x,m.y)}
  groundSpec(){const S=this.site;return{recipe:'world',seed:Math.floor(hash(S.tx,S.ty,991+S.salt)*4294967296)>>>0,copy:true}}
  battleType(){return null}
  // (its grid: the map round its middle, the field's size, s field px a world px; its routes and its reading as any field's)
  terrain(){const s=COPY_FIELD.scale,m=this.mid,FI=this.field,x0=m.x-BW/2/s,y0=m.y-BH/2/s,T=worldGrid(x0,y0,BW,BH,s,this.env);
    // (its height from its lowest ground: a field all on one rise is level ground, not high ground everywhere)
    {let lo=255;for(const v of T.lvl)if(v<lo)lo=v;if(lo)for(let i=0;i<T.lvl.length;i++)T.lvl[i]-=lo}
    const houses=CopyField.houses(x0,y0,s,BW,BH);if(!T.built.some(v=>v)&&!houses.length)T.built=null;T.ways=CopyField.ways(x0,y0,s,BW,BH);// (no buildings in it: none told of; the map's roads painted on it)
    T.routes.build(FI.top,FI.bot);T.finish({seed:this.ground.seed},{recipe:'world',hills:[],woods:[],marsh:[],rocks:[],rivers:[],lane:0,built:{houses,fields:[]}},BW,FI.top,FI.bot,1,[]);
    T.copy={x0,y0,s};this.env.text=groundEnvText(this.env,T);return this.TR=T}
  // (the armies formed up as on any field; a man set down on rock or deep water stands on the nearest open ground)
  initialize(){super.initialize();const T=B.terrain;if(!T)return;for(const u of B.units){const q=CopyField.open(T,u.x,u.y);if(q){u.x=q.x;u.y=q.y}}}
}
