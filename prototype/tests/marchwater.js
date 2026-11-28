'use strict';
// The water a marching man walks into (the owner, 2026-11-28: "recheck pathfinding on bridges jump down water"; world/march.js
// MARCH_MOVE.wet, MarchGround place, dip, cap, soft; MarchArmy wetStep; battle/route.js routeRoom's soft cells): a band crossing a bridge
// goes over its deck, every man of it, none wading or swimming the river beside it (8 to 13 of 13 did: their places lay on the river
// past the one tile shut each side of a bridge, a straight walk to a place took no heed of the water between, and no way found went
// over a deck at all, its first and last cells without a footman's room off its rails); a way found for a man's body goes over the
// deck; water over knee deep is no place of his and dear to his way unless his army's own way goes through it; where it does (a river
// swum, no crossing near) his men go in with it.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,WM=t.WM,MW=t.MW,MH=t.MH,K=WM.kind,TILE=t.TILE,M=t.MARCH_MOVE.wet;Kit.begin('soldier',1);Kit.clear();Kit.world();G.quietEvents=true;t.holdShut(true);
 P.troops={hum_foot:8,hum_bow:4};P.food=9999;
 const cx=k=>(k%MW+.5)*TILE,cy=k=>((k/MW|0)+.5)*TILE,tileOf=(x,y)=>Math.floor(y/TILE)*MW+Math.floor(x/TILE),shut=i=>!!(t.SHUT&&t.SHUT[i]),dry=(x,y)=>t.passable(t.terrAt(x,y))&&!shut(tileOf(x,y));
 const past=(e,f,d)=>{const ex=cx(e),ey=cy(e),fx=cx(f),fy=cy(f),l=Math.hypot(fx-ex,fy-ey)||1;return [ex-(fx-ex)/l*d,ey-(fy-ey)/l*d]};
 // (well into water over knee deep: its tile's and those 5 px each way)
 const deep=(x,y)=>[[0,0],[5,0],[-5,0],[0,5],[0,-5]].every(([a,b])=>{const k=tileOf(x+a,y+b);return K[k]===t.T_WATER&&t.waterBand(k)>M.own});
 // (you sent from (x0, y0) to (x1, y1): the men who were ever well into deep water, those ever on tiles on, the deepest water your
 // army's way took (MarchArmy wet), whether you got there, how far your farthest man stands from you at the end)
 const walk=(x0,y0,x1,y1,on,max=2400)=>{Kit.goTo(x0,y0);P.bsta=100;G.chase=null;for(let i=0;i<40;i++)t.updateWorld(1/30);const s=t.Router.open(x1,y1,P);P.tx=s.x;P.ty=s.y;P.stuck=0;
  const wet=new Set(),deck=new Set();let most=0,rest=0,n=0;
  for(let f=0;f<max&&rest<200;f++){t.updateWorld(1/30);const A=t.MARCH_ARMIES.get(P);if(!A)continue;most=Math.max(most,A.wet);for(const u of A.units){if(u.dead)continue;if(deep(u.x,u.y))wet.add(u);if(on&&on.has(tileOf(u.x,u.y)))deck.add(u)}if(P.tx==null)rest++;n=f}
  const A=t.MARCH_ARMIES.get(P),men=A?A.units.filter(u=>!u.dead):[];return{wet:wet.size,deck:deck.size,most,men:men.length,there:P.tx==null,far:Math.max(0,...men.map(u=>Math.hypot(u.x-P.x,u.y-P.y))),n}};
 const wb=t.WORLD_BATTLE.on;t.WORLD_BATTLE.on=true;
 try{
  // ---- a bridge of two tiles or more over water a man would swim or wade waist deep, dry land past both its ends, no holding's walls on it
  const B=WM.crossings.filter(c=>c.kind==='bridge'&&c.tiles.length>=2&&![c.i,c.j,...c.tiles].some(shut)&&[56,-56].every(d=>dry(...past(d>0?c.i:c.j,d>0?c.j:c.i,56)))&&(()=>{const a=c.tiles[1]-c.tiles[0],s=Math.abs(a)===1?MW:1;return [2,-2].every(d=>{const k=c.tiles[0]+s*d;return K[k]===t.T_WATER&&t.waterBand(k)>M.own})})());
  if(!B.length)info('no bridge over deep water with dry land past both ends');else{const c=B[0],[ax,ay]=past(c.i,c.j,56),[bx,by]=past(c.j,c.i,56),on=new Set(c.tiles);
   const r=walk(ax,ay,bx,by,on),b=walk(bx,by,ax,ay,on);
   info('the bridge at '+(c.i%MW)+','+(c.i/MW|0)+' ('+c.tiles.length+' tiles): over in '+r.n+' frames, back in '+b.n);
   ok(r.there&&b.there&&r.far<60&&b.far<60,'a band of '+r.men+' sent over a bridge and back gets there with all its men ('+r.far.toFixed(0)+' and '+b.far.toFixed(0)+' px its farthest man)');
   ok(r.deck===r.men&&b.deck===b.men,'every man of it crosses on the deck ('+r.deck+' and '+b.deck+' of '+r.men+')');
   ok(r.wet===0&&b.wet===0&&r.most===M.own,'none of them wades or swims the river beside it ('+r.wet+' and '+b.wet+' men well into water over knee deep; its way\'s water band '+r.most+')');
   // ---- a way found for a footman's body goes over the deck: its rails take no room of his (route.js routeRoom soft)
   {Kit.goTo(ax,ay);const g=new t.MarchGround(P,[{x:bx,y:by}],48,M.own),u={x:cx(c.i),y:cy(c.i),type:'hum_foot'},q={x:cx(c.j),y:cy(c.j)},p=g.path(u,q);let len=0,px=u.x,py=u.y,off=0;
    for(const w of p){const l=Math.hypot(w.x-px,w.y-py),n=Math.max(1,Math.ceil(l/2));for(let k=1;k<=n;k++){const x=px+(w.x-px)*k/n,y=py+(w.y-py)*k/n,i=tileOf(x,y);if(K[i]===t.T_WATER)off++}len+=l;px=w.x;py=w.y}
    const straight=Math.hypot(q.x-u.x,q.y-u.y),soft=g.grid.soft.reduce((a,v)=>a+v,0);
    ok(p.ok&&off===0&&len<=straight+8,'a footman\'s way from one end to the other is the deck ('+len.toFixed(0)+' px, '+straight.toFixed(0)+' straight; '+soft+' cells of rail that take no room of his)');
    // ---- water over knee deep: no place of his, dear to his way; as deep as his army's way goes, a place as ever
    const a=c.tiles[1]-c.tiles[0],s=Math.abs(a)===1?MW:1,k=c.tiles[0]+s*2,w={x:cx(k),y:cy(k),type:'hum_foot'},i=t.routeIx(g.grid,w.x-g.x,w.y-g.y),g4=new t.MarchGround(P,[{x:bx,y:by}],48,4);
    ok(g.stand(w)&&!g.place(w)&&g.grid.cost[i]===t.ROUTE.unit*M.dear&&g.grid.cost[i]>g.cap,'water band '+t.waterBand(k)+' two tiles off the deck: no place of his, a cell of it '+M.dear+' times open ground, no straight walk through it');
    ok(g4.place(w)&&g4.grid.cost[i]===Math.round(t.ROUTE.unit*t.WATER.cost[t.waterBand(k)])&&g4.cap===255,'his army\'s way through water that deep: a place as ever, at its own cost');
    const bank={x:u.x,y:u.y,type:'hum_foot'};ok(g.dip(bank,w)&&!g.dip(w,bank)&&!g4.dip(bank,w),'no side step, slide or push takes him from the bank into it; one in it walks out')}}
  // ---- a river swum where the army's own way goes: no crossing near, its men go in with it
  {const Rv=WM.river,X=WM.crossings,farX=i=>X.every(c=>Math.hypot(c.i%MW-i%MW,(c.i/MW|0)-(i/MW|0))>10);let S=null;
   for(let y=8;y<MH-8&&!S;y++)for(let x=8;x<MW-8&&!S;x++){const i=y*MW+x;if(K[i]!==t.T_WATER||!(Rv[i]&3)||t.waterBand(i)<=M.own||!farX(i))continue;
    for(const d of [1,MW]){let a=0,b=0;while(a<4&&K[i-(a+1)*d]===t.T_WATER)a++;while(b<4&&K[i+(b+1)*d]===t.T_WATER)b++;const p=i-(a+3)*d,r=i+(b+3)*d;
     if(a+b+1<=3&&[p,r,i-(a+1)*d,i+(b+1)*d,i-(a+2)*d,i+(b+2)*d].every(j=>t.passable(K[j])&&!shut(j))){S={p,r,w:a+b+1,band:t.waterBand(i)};break}}}
   if(!S)info('no river stretch over knee deep far from a crossing');else{const r=walk(cx(S.p),cy(S.p),cx(S.r),cy(S.r),null,5000);
    info('a river '+S.w+' tiles wide, band '+S.band+', at '+(S.p%MW)+','+(S.p/MW|0)+': '+r.n+' frames, '+r.wet+' men in it, the deepest its way took band '+r.most);
    ok(r.there&&r.far<60,'a band sent straight over a river with no crossing near gets there with all its men ('+r.far.toFixed(0)+' px its farthest)');
    ok(r.most>M.own&&r.wet>0,'its own way through the water, its men go in with it (band '+r.most+', '+r.wet+' of '+r.men+' men well into it)')}}
  // ---- the water its men walk into: as deep as under its guide, kept its length and hold px after, then its own again
  {const A=new t.MarchArmy(P),o=P,r=t.marchOuter(o);let wi=-1;for(let i=0;i<K.length&&wi<0;i++)if(K[i]===t.T_WATER&&t.waterBand(i)===4&&!t.bridgeSide(i)&&!t.bridgeSide(i-1))wi=i;const si=Array.from(K.keys()).find(i=>t.bridgeSide(i)&&t.waterBand(i)>M.own);let li=-1;for(let i=0;i<K.length&&li<0;i++)if(K[i]===t.T_OPEN)li=i;
   A.wetStep(o,cx(li),cy(li),0,null,true,null);const a=A.wet;A.wetStep(o,cx(wi),cy(wi),1,null,false,null);const b=A.wet;A.wetStep(o,cx(li),cy(li),1,null,false,null);const c=A.wet,left=A.wetLeft;
   A.wetStep(o,cx(li),cy(li),left+1,null,false,null);const d=A.wet;A.wetStep(o,cx(li),cy(li),1,null,false,[[cx(li)+r+40,cy(li)]]);const e=A.wet;A.wetStep(o,cx(wi),cy(wi),0,null,false,null);const h=A.wet;
   A.wetStep(o,cx(si),cy(si),1,null,false,null);const sd=A.wet;A.wetStep(o,cx(wi)-TILE,cy(wi),1,null,false,[[cx(wi),cy(wi)]]);
   ok(a===M.own&&b===4&&c===4&&Math.abs(left-(2*r+M.hold-1))<1e-6&&d===M.own&&e===M.own&&h===M.own&&sd===M.own&&A.wet===4,'on land '+a+'; its guide in water swum 4; out of it 4 still for its ring across and '+M.hold+' px ('+(left+1).toFixed(0)+'), then '+d+'; halted over water, or its guide over the river beside a bridge: as it was; its way ahead within its ring counts')}
 }finally{t.WORLD_BATTLE.on=wb}
});
