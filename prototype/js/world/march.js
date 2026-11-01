'use strict';
/* ---------- campaign formations around each army leader ---------- */
const MARCH_FACING=new WeakMap();
let MARCH_ARMIES=new WeakMap();
function marchFacing(o){
  const army=MARCH_ARMIES.get(o);if(army)return army.face;
  const now=performance.now()/1000,old=MARCH_FACING.get(o),dx=old?o.x-old.x:0,dy=old?o.y-old.y:0,to=Math.hypot(dx,dy)>.05?Math.atan2(dy,dx):old?.to??((o.look?.().dir||o.dir||1)<0?Math.PI:0);
  const dt=old?clamp(now-old.at,0,.1):0,gap=old?Math.atan2(Math.sin(to-old.a),Math.cos(to-old.a)):0,a=old?old.a+clamp(gap,-WORLD_BATTLE.turn*dt,WORLD_BATTLE.turn*dt):to;
  MARCH_FACING.set(o,{x:o.x,y:o.y,a,to,at:now});return a;
}
// (a group's men as they march: their form's slots spread for their bodies (marchRoomK), facing a, world px from its middle; pad:
// the px a man's body takes past his spot, a rider's or a big beast's more)
const marchSlots=(row,a)=>formSlots(row.form||'line',row.count||1,a,row.files,WORLD_BATTLE.sprite*marchRoomK(row));
const marchPad=row=>Math.max(3,marchBodyOf(row.type)*WORLD_BATTLE.sprite/WORLD_BATTLE.scale/2);
const marchExtent=row=>marchPad(row)+Math.max(0,...marchSlots(row,0).map(p=>Math.hypot(...p)))/WORLD_BATTLE.scale;
// (a group set at x, y: how far from the army's middle its farthest man stands, as it is formed and faces; marchPlace: the place
// nearest x, y, along the way from the middle, where every man is inside outer: a line along the ring goes as far as its men do)
const marchFoot=(row,x,y)=>marchPad(row)+Math.max(0,...marchSlots(row,row.face||0).map(([a,b])=>Math.hypot(x+a/WORLD_BATTLE.scale,y+b/WORLD_BATTLE.scale)));
function marchPlace(row,x,y,outer){if(marchFoot(row,x,y)<=outer)return{x,y};let lo=0,hi=1;for(let i=0;i<24;i++){const m=(lo+hi)/2;if(marchFoot(row,x*m,y*m)<=outer)lo=m;else hi=m}return{x:x*lo,y:y*lo}}
const marchCore=o=>WORLD_BATTLE.inner+Math.sqrt(partyRoster(o).size+partyRoster(o).reserved)*2;
// (the room an army's layout is given: yours to place your groups in (the March formation window); marchSpace: at least
// WORLD_BATTLE.outer, more by its size and its widest group; marchRoom: that, or as far as its default layout (its style's) goes)
const marchSpace=o=>Math.max(WORLD_BATTLE.outer,marchCore(o)+4+Math.max(0,...partyRoster(o).groups.map(marchExtent)));
const marchRoom=o=>marchLayout(o).room;
// (the owner, 2026-10-31: "big army, bigger interaction touchpoint, otherwise the army units may collide each other in order to talk
// to the lord") every army's ring, yours too, one rule: its room, and its whole layout, its farthest man's body MARCH_STYLES.margin
// px inside it; its interaction ring (marchInteractRadius) WORLD_BATTLE.interaction past that
const marchOuter=o=>marchLayout(o).outer;
// March offsets are in world pixels, relative to the army's middle (east is the front). Missing entries use a stable default.
// (the owner, 2026-10-31: "an invisible point at the center now hero can be placed any where in the army circle"; "make sure
// that all other lords, bandits and other world entity apply the same concept") every army's middle is no one's: its leader (your
// hero, a lord, a companion, a chief not among its troops: the row 'leader') has his place in it as each group has. Every army
// stands in its style (marchstyles.js MarchStyle); yours, and any with a layout saved, in battle lanes (MARCH_STYLES.yours: the
// owner, 2026-11-01), your hero at the middle, each group where you placed it, if you did (the march formation window)
const marchRows=o=>marchLayout(o).rows;
/* an army's rows, room and ring (style: the MARCH_STYLES key it stands in), made again only when what they are made of changes
   (key: its style, size, rows and saved layout), never each frame: marchRows and marchOuter are asked for every army each frame
   (its march, its reach) */
const MARCH_LAYOUTS=new WeakMap();
function marchLayout(o){
  const r=partyRoster(o),gs=r.groups,lead=marchLeaderOf(o),saved=o.army?.march,ids=o===P?r.order.filter(id=>id==='hero'||(id.startsWith('comp_')?compsInBand().includes(id.slice(5)):gs.some(g=>g.id===id&&g.count>0))):[...(lead?['leader']:[]),...gs.filter(g=>g.count>0).map(g=>g.id)];
  const style=o===P||saved?MARCH_STYLES.yours:MarchStyle.pick(o,gs),key=style+'|'+r.size+'|'+r.reserved+'|'+lead+'|'+ids.map(id=>{const g=gs.find(g=>g.id===id);return g?id+':'+g.type+':'+g.count+':'+g.form+':'+g.files:id}).join()+(saved?'|'+JSON.stringify(saved):'');
  let L=MARCH_LAYOUTS.get(o);if(L?.key===key)return L;
  const base=ids.map(id=>{const g=gs.find(g=>g.id===id);return{id,type:g?.type||(id==='leader'?lead:id),count:g?.count||1,face:Number.isFinite(saved?.[id]?.face)?saved[id].face:0,form:g?.form||'line',files:g?.files||null,character:!g}});
  // (a group you placed where you placed it, inside the room you have to place it in)
  const laid=MarchStyle.of(style).lay(base,o),room=Math.max(marchSpace(o),...laid.map(row=>marchFoot(row,row.x,row.y)));
  const rows=laid.map(row=>{const s=saved?.[row.id];if(!(s&&Number.isFinite(s.x)&&Number.isFinite(s.y)))return row;const q=marchPlace(row,s.x,s.y,room);return{...row,x:q.x,y:q.y}});
  // (a layout you placed stands as you placed it while its groups are there; with some of them away (placed, now none of them
  // marching), centred on the groups it has now (the box round their places): the army's middle among its men, its ring round
  // them, not round places of groups away (the owner, 2026-11-01: his hero placed at the front, alone, the ring off him and
  // swinging round him as the march turned))
  if(saved&&rows.length&&Object.keys(saved).some(id=>!ids.includes(id))){const xs=rows.map(r=>r.x),ys=rows.map(r=>r.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
    if(Math.abs(cx)>.5||Math.abs(cy)>.5)for(let i=0;i<rows.length;i++)rows[i]={...rows[i],x:rows[i].x-cx,y:rows[i].y-cy}}
  L={key,style,rows,room,outer:Math.max(room,...rows.map(row=>marchFoot(row,row.x,row.y)+MARCH_STYLES.margin))};MARCH_LAYOUTS.set(o,L);return L;
}
// (the march row a battle group stands for: its roster group's, a leader's 'leader' (a lord, a companion, a chief not among his
// troops), else its own id (your hero's 'hero', a companion of yours 'comp_id'); u: one of its men)
const marchRowOf=(g,u)=>g.sourceGroupId||(u?.leader?'leader':g.id);
const marchNumbers=o=>Object.fromEntries(marchRows(o).map((r,i)=>[r.id,(i+1)%10]));
const marchInteractRadius=(o,r=marchOuter(o))=>r+WORLD_BATTLE.interaction;
// how near your army comes to meet o (world.js approach, a chase's arrival): with the world's battles on, another army when the two
// rings touch; anything else when your ring touches it (ringReach); off, or nothing there, at touching distance (REACH) as ever
// (the owner, 2026-11-01: meetings measure to the shape) both marched man by man (marchLive), when their outlines touch: the
// nearest two of their men (marchGap); the reach given back is the distance between their middles less that gap, so a caller's
// dist <= reach holds just when they touch
const worldBattleReach=o=>{if(!WORLD_BATTLE.on||!o||o===P)return REACH;const b=marchLive(o),g=b&&marchGap(o,b);
  return g!=null?Math.hypot(o.x-P.x,o.y-P.y)-g:o instanceof Party?marchInteractRadius(P)+marchInteractRadius(o):ringReach(o)};
// (the owner, 2026-11-01: "my hero have to be near camp or building to interact"; as for the lords: "big army, bigger interaction
// touchpoint") a place (a camp, a site, a holding, an estate) is reached when your interaction ring touches its footprint: your ring
// and how far that reaches from its point toward you (WorldObject reachRadius: REACH for one with none; null, at touching distance
// only: a holding at war with you, its siege's leash as it was). Your army halts at its edge; your hero never walks into it. Your
// army marched man by man, when your outline does: your man nearest its point, his disc and WORLD_BATTLE.interaction past him
function ringReach(o){const r=o.reachRadius?o.reachRadius():REACH;if(r==null)return REACH;const g=marchPlaceGap(o,r);return g!=null?Math.hypot(o.x-P.x,o.y-P.y)-g:marchInteractRadius(P)+r}
// (an army marched man by man now: its MarchArmy with men, not left behind by a leap, yours not in camp or a holding; null with
// MARCH_RING.meet off: the circles. Its men stand where they did, carried by how far its middle went since it last stepped)
function marchLive(o){const a=MARCH_RING.meet&&MARCH_ARMIES.get(o);return a&&a.units.length&&Math.hypot(o.x-a.x,o.y-a.y)<=MARCH_MOVE.teleport&&!(o===P&&(P.stay||P.camp))?a:null}
// (px between your army's outline and o's (army b): the nearest two men, each less his disc (marchDisc), less WORLD_BATTLE.interaction;
// their boxes first: apart, no nearer than they are. Asked again in a frame with both where they were: the last answer)
function marchGap(o,b){const a=marchLive(P);if(!a)return null;const K=b.gapAt||(b.gapAt={n:-1}),n=WORLD_LOD.n;if(K.n===n&&K.ox===o.x&&K.oy===o.y&&K.px===P.x&&K.py===P.y)return K.v;
  const I=WORLD_BATTLE.interaction,A=a.box(),B=b.box(),ax=P.x-a.x,ay=P.y-a.y,bx=o.x-b.x,by=o.y-b.y,dx=Math.max(0,B[0]+bx-A[2]-ax,A[0]+ax-B[2]-bx),dy=Math.max(0,B[1]+by-A[3]-ay,A[1]+ay-B[3]-by);
  let v=Math.hypot(dx,dy);if(v<=I){v=Infinity;for(const u of a.units){if(u.dead)continue;const x=u.x+ax,y=u.y+ay,r=marchDisc(u);for(const w of b.units){if(w.dead)continue;const d=Math.hypot(w.x+bx-x,w.y+by-y)-r-marchDisc(w);if(d<v)v=d}}}
  K.n=n;K.ox=o.x;K.oy=o.y;K.px=P.x;K.py=P.y;K.v=v-I;return K.v}
// (px between your army's outline and a place's footprint, r px out from its point toward you: your man nearest its point)
function marchPlaceGap(o,r){const a=marchLive(P);if(!a)return null;const I=WORLD_BATTLE.interaction,A=a.box(),ax=P.x-a.x,ay=P.y-a.y,dx=Math.max(0,A[0]+ax-o.x,o.x-A[2]-ax),dy=Math.max(0,A[1]+ay-o.y,o.y-A[3]-ay);
  let v=Math.hypot(dx,dy);if(v<=r+I){v=Infinity;for(const u of a.units){if(u.dead)continue;const d=Math.hypot(u.x+ax-o.x,u.y+ay-o.y)-marchDisc(u);if(d<v)v=d}}return v-r-I}
// (px from x, y to your army's nearest man's disc, marched man by man (marchLive); else to your middle: where one walking up hails
// you, an ambush springs: story/encounter.js)
function marchNear(x,y){const a=marchLive(P);if(!a)return Math.hypot(x-P.x,y-P.y);const ax=P.x-a.x,ay=P.y-a.y;let v=Infinity;for(const u of a.units){if(u.dead)continue;const d=Math.hypot(u.x+ax-x,u.y+ay-y)-marchDisc(u);if(d<v)v=d}return v}
// (you arrive at x, y, your march's point there (world.js marchStep): menCentre, when your men's middle is within MARCH_MOVE.arrive
// px of it, or your men stand in their places (a spot they cannot all stand round); not marched man by man, at once)
function marchArrived(x,y){const a=MARCH_MOVE.menCentre&&WORLD_BATTLE.on&&MARCH_ARMIES.get(P);if(!a||!a.units.length||Math.hypot(P.x-a.x,P.y-a.y)>MARCH_MOVE.teleport)return true;
  return Math.hypot(a.wx-x,a.wy-y)<=MARCH_MOVE.arrive||a.units.every(u=>u.dead||u.rest||!u.goal)}
// (a man's disc on the map: his body's half and MARCH_RING.pad: what his army's outline wraps)
const marchDisc=u=>marchBody(u)/2+MARCH_RING.pad;
// (px from o's point to the edge of box b (world px: x0, y0, x1, y1) on the way to your army: its footprint's reach toward you)
function boxReach(o,b){const dx=P.x-o.x,dy=P.y-o.y,d=Math.hypot(dx,dy);if(d<1e-6)return 0;const ux=dx/d,uy=dy/d;
  return Math.max(0,Math.min(ux>0?(b.x1-o.x)/ux:ux<0?(b.x0-o.x)/ux:Infinity,uy>0?(b.y1-o.y)/uy:uy<0?(b.y0-o.y)/uy:Infinity))}
// (an army's leader who is no troop of it, by his kind: a lord, a companion leading his party, a chief not counted among his
// band's troops; null for none. Yours is your hero, the row 'hero'. (His kind as his Character names it, without making one: a lord's
// is made with his stats, rolled the first time)
const marchLeaderOf=o=>o===P||o.mapKind==='caravan'?null:o.cid?o.cid:o.mapKind==='lord'?lordUnit(o):o.ld&&!o.troops.includes('chief')?'chief':null;
// (an army's march pace where it stands, before its brain's errand (a lord's, a patrol's, a caravan's own share of it: MarchArmy
// step takes what it went as its step, this the least): yours as world.js moves you, any other's its men's)
const marchPace=o=>o===P?MAP_BASE*travelMul()*(P.morale<25?.8:1):partySpeed(o,o.troops);
// (a caravan's wagon stands at its middle: caravans.js draws it there, its guards round it)
const marchCentrePiece=o=>o.mapKind==='caravan';
// (a caravan's wagon, ox and drover at its middle, along the way it faces (o.dir): each [px along, its body as marchBody's], from
// its picture at the guards' scale (caravans.js caravanSprite: some 30 x 13 px, the cart behind, the ox, the drover at its head);
// no man's goal on them, none pushed onto them, its outline round them (the owner, 2026-11-01: the caravan redrawn))
const MARCH_CART=[[-9,12],[4,10],[13,7]];
const marchCart=o=>{const d=o.dir<0?-1:1;return MARCH_CART.map(([x,r])=>({x:o.x+d*x,y:o.y,r,fixed:true}))};
// The battle's full sprites at its world scale, with weapons included and movement-driven poses.
function marchSprite(u,o,pose){
  const type=u.character?u.type.replace(/^comp_/,''):u.type,hero=type==='hero',lead=hero||u.row==='leader';
  return unitSprite(type,o.mapKind==='monster'?1:0,hero,lead?0:u.id%6,pose??(u.walking?2+(Math.floor((u.stepT||0)*MARCH_MOVE.cadence)+u.id)%4:0),false,false,o.look().col);
}
// Leaders use the same character kind and equipment as battle; cached cells also serve map picking and banner height.
const MARCH_LEADERS=new WeakMap();
function marchLeaderSprite(o,f){
  const hero=o===P,cid=o.cid,type=hero?'hero':cid?charOf(compInit(cid),cid).key:o.mapKind==='lord'?charOf(o).key:o.ld?charOf(o.ld).key:partyRoster(o).groups[0]?.type||'militia';
  const pose=f?2+Math.floor(f/2)%4:0,base=unitSprite(type,0,hero,0,pose,false,false,o.look().col);
  let s=MARCH_LEADERS.get(base);if(!s){const k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale;s=mkc(Math.ceil(base.width*k),Math.ceil(base.height*k),g=>g.drawImage(base,0,0,base.width*k,base.height*k));s.base=base;MARCH_LEADERS.set(base,s)}return s;
}
function marchDraw(ents,o,cam){
  if(!WORLD_BATTLE.on)return false;const army=MarchArmy.of(o);army.sync();marchCircle(ents,o,cam,undefined,undefined,army);
  for(const u of army.units)ents.push({y:u.y,own:o===P||o.faction==='player',f:()=>drawMarcher(u,o,cam)});
  // (a beast's marker over its middle)
  const u0=army.units[0];if(u0&&o.mapKind==='monster')ents.push({y:o.y,f:()=>BANNERQ.push({o,marker:{h:marchSprite(u0,o).height*WORLD_BATTLE.sprite/WORLD_BATTLE.scale,col:o.look().col}})});return true;
}
function drawMarcher(u,o,cam){
  // (standing: his fidgets, as in battle: render.js idleLife, on the real clock)
  const S=ST[u.type]||{},I=!u.walking?idleLife(u.id,performance.now()/1000,S.beast?'beast':S.mounted?'mount':'foot'):null;
  subT(u);const s=marchSprite(u,o,I?.pose),k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale,x=Math.round(u.x-cam.x),y=Math.round(u.y-cam.y);
  ctx.save();ctx.translate(x,y);ctx.scale(Math.cos(u.dir??marchFacing(o))<0?-k:k,k);ctx.drawImage(s,-Math.floor(s.width/2)+(I?.dx||0),-s.height+2);ctx.restore();
}
// a torch on the march (a night watch's: parties.js) in its carrier's hand (MarchArmy hand), going with him, its light (LIGHTQ)
// cast there; fwd: its share of his figure's width before him; foot, ride: of its height up from his feet (a rider's, on his horse)
const MARCH_TORCH={fwd:.2,foot:.45,ride:.6};
function marchTorch(ents,o,cam){const h=MARCH_ARMIES.get(o)?.hand();if(!h)return false;
  ents.push({y:h.u.y+.01,f:()=>{subT(h.u);const x=Math.round(h.x-cam.x),y=Math.round(h.y-cam.y);rect(ctx,'#5a3e24',x,y,1,4);LIGHTQ.push({x,y:y-1,r:16})}});return true}
// (the owner, 2026-10-31: "the army ring speed is based on the overall unit speed so it can keep centered") its rings drawn on the
// middle its men make (MarchArmy mid: each man's spot less his place in it, their median), so they go as the men go, and settle
// on the army's own as they do; no men formed near, on the army's own. Its army given (marchDraw), the outline of its men's ground
// instead (MarchOutline, MARCH_RING), drawn as the circles are, about its middle
function marchCircle(ents,o,cam,r=marchOuter(o),col=o===P?B?'#e4c777':travelDetectionColor(travelDetectionState()):o.look().col,army=null){
  const L=army&&MARCH_RING.on&&army.units.length?army.ring||(army.ring=new MarchOutline()):null;
  if(L){L.update(army);ents.push({y:o.y+L.top,f:()=>{const x=o.x-cam.x,y=o.y-cam.y;ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=.55;L.path(L.out[0],x,y);ctx.stroke();
    ctx.globalAlpha=.28;ctx.setLineDash(RING_DASH);L.path(L.out[1],x,y);ctx.stroke();ctx.restore()}});return}
  const m=MARCH_ARMIES.get(o)?.mid,c=m&&Math.hypot(m.x-o.x,m.y-o.y)<r?m:o;
  ents.push({y:c.y-r,f:()=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(c.x-cam.x,c.y-cam.y,r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.28;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(c.x-cam.x,c.y-cam.y,marchInteractRadius(o,r),0,Math.PI*2);ctx.stroke();ctx.restore()}});
}

// Positions are runtime state. Saved group offsets remain the destination, never a rigid transform of the men.
// (the owner, 2026-10-31: units forming up "not walking but shaking") stride: s a man still shows walking after his last step, so a
// march is one walk, not a flicker; wake: px off his place before a settled man moves again while the army stands; squeeze:
// [s hemmed in by his own side, the share of a step he then squeezes through at, px he must be short of his place, his share of
// the parting's push against one not squeezing (the other gives way the rest)], the army standing; jam: s one stuck while it
// marches before he squeezes through too (the owner, 2026-11-01: men jammed in a ford held its middle (leash) for good: none may freeze)
// (and "not smooth when turning") turn: the army's wheel, rad/s (was 1.5: its outer places swept faster than a man marches, and
// none hurries: marchwheeling); body: × the time each takes to come up to pace (marchKind);
// leash: [px, s of its pace] the army's middle may run ahead of where its men put it (step's end): the s, as far as a man marching
// at pace trails his place (he brakes as he nears it), so only men held back (a ford, a bridge, a wood) hold it;
// cadence: his walk's frames a second, by the time he has walked (as an arena battle's: sprites.js procPose), never by the ground
// he covers (the map's time runs fast: by distance, his legs flicked five strides a second, "like running or shaking")
const MARCH_MOVE={cell:4,pad:48,chunk:64,repath:.45,refresh:2,catchup:1,turn:.9,settle:.2,gap:2.4,active:180,queries:6,teleport:160,bucket:8,waypoint:.15,sidestep:[0,.65,-.65,1.2,-1.2],part:3,stride:.3,wake:1,squeeze:[.4,1,2,0],road:1.45,jam:1.5,cadence:9,body:1,leash:[4,.6],menCentre:true,lead:[4,.6],wide:192,arrive:2};
/* (the owner, 2026-11-01: "how about making a ring like freeform based on the area?") the ring drawn round an army is the outline
   of the ground its men stand on: each man a soft disc (his body and pad px; a caravan's wagon one too), their fields summed on a
   grid of cell px round its middle, the outline where the field is threshold (1: a lone man's disc's edge). Men within about merge
   px of each other make one shape; along a wall it is concave; men far apart make islands. The dashed line is the same field's
   outline at the level a lone man's reaches WORLD_BATTLE.interaction px further. Eased by the army's time (a cell's field rises at
   grow a s, falls at shrink), so it takes in a straggler at once and lets him go slowly; made again only when a man has moved tol
   px about the middle, or while it eases (every cell within eps: settled); at most most cells (a straggler far off: coarser).
   Made afresh, no easing from its old shape, when a man moved jump px about the middle at once, or men moved with no time gone
   (a battle's end puts its survivors where they fought, a fallen man is left out: the outline round them at once).
   Drawn only, for armies on screen: the rules (meetings, reach, interaction) measure the circle (marchOuter). on false: the circles */
const MARCH_RING={on:true,meet:true,pad:2,merge:10,cell:3,grow:14,shrink:4,threshold:1,tol:.4,jump:12,eps:.004,most:30000};
// (each corner case of a cell, tl 8, tr 4, br 2, bl 1 inside: its outline's pieces, from edge to edge, the inside on the right; edges
// top 0, right 1, bottom 2, left 3; the two saddles, 5 and 10, by the cell's middle: MarchOutline trace)
const RING_SEGS=[[],[3,2],[2,1],[3,1],[1,0],null,[2,0],[3,0],[0,3],[0,2],null,[0,1],[1,3],[1,2],[2,3],[]],RING_DASH=[3,4];
const ringK=x=>x<1?(1-x)*(1-x):0;// (a disc's field at the square of its distance over its reach)
class MarchOutline{
  constructor(){this.n=-1;this.cs=0;this.time=null;this.settled=false;this.C=0;this.R=0;this.ix0=0;this.iy0=0;this.cap=0;this.rel=new Float32Array(0);this.top=0;
    this.out=[{pts:new Float32Array(0),at:new Int32Array(1),n:0},{pts:new Float32Array(0),at:new Int32Array(1),n:0}]}
  // (its men's discs, at most n: x, y about the middle, reach s, weight w; the wagon last)
  discs(A){const o=A.owner,U=A.units,K=MARCH_RING,I=WORLD_BATTLE.interaction,cart=marchCentrePiece(o)?marchCart(o):null;let live=0;for(const u of U)if(!u.dead)live++;
    const n=live+(cart?cart.length:0);if(this.rel.length<4*n)this.rel=new Float32Array(8*n);const q=this.rel;let moved=n!==this.n,far=moved;
    for(let i=0,k=0;k<n;i++){const u=U[i];if(u&&u.dead)continue;const c=u?null:cart[k-live],x=u?u.x-o.x:c.x-o.x,y=u?u.y-o.y:c.y-o.y,m=moved?0:Math.abs(x-q[4*k])+Math.abs(y-q[4*k+1]);if(m>K.tol)moved=true;if(m>K.jump)far=true;k++}
    this.leap=this.leap||far;if(!moved)return false;let rs=0;
    for(let i=0,k=0;k<n;i++){const u=U[i];if(u&&u.dead)continue;const c=u?null:cart[k-live],r=u?marchDisc(u):c.r/2+K.pad,s=r+Math.max(K.merge,I+K.cell);
      q[4*k]=u?u.x-o.x:c.x-o.x;q[4*k+1]=u?u.y-o.y:c.y-o.y;q[4*k+2]=s;q[4*k+3]=1/ringK(r*r/(s*s));rs+=r;k++}
    // (the dashed line's level: where a disc of the army's mean size reaches interaction px further)
    {const r=rs/n,s=r+Math.max(K.merge,I+K.cell);this.dash=K.threshold*ringK((r+I)**2/(s*s))/ringK(r*r/(s*s))}
    this.n=n;return true}
  // (made again if a man moved, else eased on while it is not settled; true when its outline changed)
  update(A){
    const K=MARCH_RING,dt=this.time==null?0:Math.max(0,A.time-this.time);this.time=A.time;const moved=this.discs(A);if(!moved&&(this.settled||!dt))return false;if(!this.n){this.out[0].n=this.out[1].n=0;return true}
    const n=this.n,q=this.rel;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
    for(let i=0;i<n;i++){const x=q[4*i],y=q[4*i+1],s=q[4*i+2];x0=Math.min(x0,x-s);y0=Math.min(y0,y-s);x1=Math.max(x1,x+s);y1=Math.max(y1,y+s)}
    // (its box of cells: its men's, and what of the last is still fading)
    const cs=Math.max(K.cell,Math.sqrt((x1-x0)*(y1-y0)/K.most));
    let ix0=Math.floor(x0/cs)-1,iy0=Math.floor(y0/cs)-1,ix1=Math.ceil(x1/cs)+1,iy1=Math.ceil(y1/cs)+1;
    if(cs===this.cs&&this.E){const E=this.E,C=this.C;for(let j=0;j<this.R;j++)for(let i=0;i<C;i++)if(E[j*C+i]>K.eps){ix0=Math.min(ix0,this.ix0+i-1);ix1=Math.max(ix1,this.ix0+i+1);iy0=Math.min(iy0,this.iy0+j-1);iy1=Math.max(iy1,this.iy0+j+1)}}
    const C=ix1-ix0+1,R=iy1-iy0+1,N=C*R;
    if(N>this.cap){this.cap=N*2;const old=this.E;this.E=new Float32Array(this.cap);this.F=new Float32Array(this.cap);this.S=new Float32Array(this.cap);this.next=new Int32Array(2*this.cap);this.ex=new Float32Array(2*this.cap);this.ey=new Float32Array(2*this.cap);
      for(const o of this.out){o.pts=new Float32Array(4*this.cap);o.at=new Int32Array(this.cap+1)}if(old)this.S.set(old.subarray(0,this.C*this.R));else this.S.fill(0)}
    else if(this.E)this.S.set(this.E.subarray(0,this.C*this.R));
    // (the eased field into the new box, cell for cell about the middle)
    const E=this.E,F=this.F,S=this.S,keep=this.cs===cs&&this.C>0&&dt>0&&!this.leap;this.leap=false;E.fill(0,0,N);
    if(keep)for(let j=0;j<this.R;j++){const y=this.iy0+j-iy0;if(y<0||y>=R)continue;for(let i=0;i<this.C;i++){const x=this.ix0+i-ix0;if(x>=0&&x<C)E[y*C+x]=S[j*this.C+i]}}
    // (the men's field: each disc over the cells it reaches)
    F.fill(0,0,N);for(let k=0;k<n;k++){const mx=q[4*k],my=q[4*k+1],s=q[4*k+2],w=q[4*k+3],s2=s*s;
      for(let j=Math.max(0,Math.ceil((my-s)/cs)-iy0),j1=Math.min(R-1,Math.floor((my+s)/cs)-iy0);j<=j1;j++){const dy=(iy0+j)*cs-my;
        for(let i=Math.max(0,Math.ceil((mx-s)/cs)-ix0),i1=Math.min(C-1,Math.floor((mx+s)/cs)-ix0);i<=i1;i++){const dx=(ix0+i)*cs-mx,d2=dx*dx+dy*dy;if(d2<s2)F[j*C+i]+=w*ringK(d2/s2)}}}
    let gap=0;if(!keep)E.set(F.subarray(0,N));else{const g=Math.min(1,K.grow*dt),h=Math.min(1,K.shrink*dt);for(let i=0;i<N;i++){const f=F[i],e=E[i],v=e+(f-e)*(f>e?g:h);E[i]=v;gap=Math.max(gap,Math.abs(f-v))}}
    this.settled=gap<K.eps;this.cs=cs;this.C=C;this.R=R;this.ix0=ix0;this.iy0=iy0;
    this.trace(K.threshold,this.out[0]);this.trace(this.level(this.out[0]),this.out[1]);return true;
  }
  // (the dashed line's level: the field WORLD_BATTLE.interaction px out from the outline, the median of a few points round it (each
  // out the way its loop's outside lies: on its left); none, where a disc of the army's mean size reaches so far: discs)
  level(out){const P=out.pts,at=out.at,I=WORLD_BATTLE.interaction,S=RING_LEVELS;let k=0;
    for(let l=0;l<out.n&&k<S.length;l++){const a=at[l],n=at[l+1]-a;if(n<3)continue;for(let j=0;j<4&&k<S.length;j++){const i=a+Math.floor(j*n/4),q=a+(i-a+1)%n,r=a+(i-a+n-1)%n,tx=P[2*q]-P[2*r],ty=P[2*q+1]-P[2*r+1],m=Math.hypot(tx,ty)||1;
      S[k++]=this.field(P[2*i]+ty/m*I,P[2*i+1]-tx/m*I)}}
    if(!k)return this.dash;for(let i=1;i<k;i++){const v=S[i];let j=i-1;while(j>=0&&S[j]>v){S[j+1]=S[j];j--}S[j+1]=v}return Math.max(MARCH_RING.eps*4,Math.min(this.dash,S[k>>1]))}
  // (marching squares at level lv over the eased field: closed loops of points about the middle, into out)
  trace(lv,out){
    const C=this.C,R=this.R,N=C*R,E=this.E,nx=this.next,ex=this.ex,ey=this.ey,cs=this.cs,ids=RING_EDGE;nx.fill(-1,0,2*N);
    for(let j=0;j<R-1;j++)for(let i=0;i<C-1;i++){const a=E[j*C+i],b=E[j*C+i+1],c=E[(j+1)*C+i+1],d=E[(j+1)*C+i],m=(a>=lv?8:0)|(b>=lv?4:0)|(c>=lv?2:0)|(d>=lv?1:0);if(!m||m===15)continue;
      const T=ids[0]=j*C+i,Rt=ids[1]=N+j*C+i+1,Bt=ids[2]=(j+1)*C+i,L=ids[3]=N+j*C+i;
      if((a>=lv)!==(b>=lv)){ex[T]=i+(lv-a)/(b-a);ey[T]=j}if((b>=lv)!==(c>=lv)){ex[Rt]=i+1;ey[Rt]=j+(lv-b)/(c-b)}
      if((d>=lv)!==(c>=lv)){ex[Bt]=i+(lv-d)/(c-d);ey[Bt]=j+1}if((a>=lv)!==(d>=lv)){ex[L]=i;ey[L]=j+(lv-a)/(d-a)}
      const s=RING_SEGS[m];if(s){nx[ids[s[0]]]=ids[s[1]];continue}
      const mid=(a+b+c+d)/4>=lv;if(m===5){if(mid){nx[L]=T;nx[Rt]=Bt}else{nx[Rt]=T;nx[L]=Bt}}else if(mid){nx[T]=Rt;nx[Bt]=L}else{nx[T]=L;nx[Bt]=Rt}}
    let np=0,nl=0,top=Infinity;const P=out.pts,at=out.at;
    // (each loop, the inside on its right: one round a shape winds one way, one round a hole in it (ground none stands on, ringed
    // by his men) the other; the holes left out: the outline is each shape's rim)
    for(let e=0;e<2*N;e++){if(nx[e]<0)continue;const s=np;let k=e,A=0,y0=Infinity;
      do{const x=(this.ix0+ex[k])*cs,y=(this.iy0+ey[k])*cs;P[2*np]=x;P[2*np+1]=y;if(np>s)A+=P[2*np-2]*y-x*P[2*np-1];np++;if(y<y0)y0=y;const t=nx[k];nx[k]=-2;k=t}while(k>=0&&nx[k]!==-2);
      A+=P[2*np-2]*P[2*s+1]-P[2*s]*P[2*np-1];if(A>0){at[nl++]=s;if(y0<top)top=y0}else np=s}
    at[nl]=np;out.n=nl;if(out===this.out[0])this.top=top===Infinity?0:top;
  }
  // (a loop's points as one smooth closed path: from each two's middle to the next's, curved over the point between; at x, y on
  // the screen)
  path(out,x,y){const P=out.pts,at=out.at;ctx.beginPath();
    for(let l=0;l<out.n;l++){const a=2*at[l],n=at[l+1]-at[l];if(n<3)continue;ctx.moveTo((P[a]+P[a+2])/2+x,(P[a+1]+P[a+3])/2+y);
      for(let i=1;i<=n;i++){const p=a+2*(i%n),q=a+2*((i+1)%n);ctx.quadraticCurveTo(P[p]+x,P[p+1]+y,(P[p]+P[q])/2+x,(P[p+1]+P[q+1])/2+y)}ctx.closePath()}}
  // (whether a world point about the middle (dx, dy) is inside its outline, lv: the solid's by default; the eased field there)
  field(dx,dy){const cs=this.cs,fx=dx/cs-this.ix0,fy=dy/cs-this.iy0,i=Math.floor(fx),j=Math.floor(fy);if(!this.E||i<0||j<0||i>=this.C-1||j>=this.R-1)return 0;
    const E=this.E,C=this.C,u=fx-i,v=fy-j;return E[j*C+i]*(1-u)*(1-v)+E[j*C+i+1]*u*(1-v)+E[(j+1)*C+i]*(1-u)*v+E[(j+1)*C+i+1]*u*v}
  inside(dx,dy,lv=MARCH_RING.threshold){return this.field(dx,dy)>=lv}
}
const RING_EDGE=new Int32Array(4),RING_LEVELS=new Float32Array(32);
/* no two marchers on each other (the owner, 2026-10-30: "make sure units cannot overlap"): each has his body, as in battle
   (battle.js JOSTLE: foot, mounted, a big one 18), drawn WORLD_BATTLE.sprite/scale as big on the map; a row of bigger bodies
   than its formation's spacing marches that much wider (marchRoomK); after each step, MARCH_MOVE.part passes push apart any two
   closer than their bodies, half each, onto open ground (a caravan's wagon at its middle never pushed: the others give way) */
// (a marcher's body: his battle kind's turn rates (physics.js PHYSICS.kinds), and t, the s he takes to come up to the army's pace (his
// kind's battle speed over its acceleration, × MARCH_MOVE.body))
const MARCH_KINDS=new Map();
const marchKind=type=>{let k=MARCH_KINDS.get(type);if(!k){const s=ST[type]||ST.militia,K=physKind({s,type});k={turn:K.turn,turn0:K.turn0,t:Math.max(.08,(s.spd||40)/K.acc*MARCH_MOVE.body)};MARCH_KINDS.set(type,k)}return k};
const marchBodyOf=type=>{const s=ST[type]||{};return s.big?18:s.mounted?JOSTLE.mount:JOSTLE.foot};
const marchBody=u=>marchBodyOf(u.type)*WORLD_BATTLE.sprite/WORLD_BATTLE.scale;
const marchRoomK=row=>{const F=FORMS[row.form]||FORMS.line;return Math.max(1,marchBodyOf(row.type)/Math.min(F.gx,F.gy))};
const marchFootprints=(x0,y0,x1,y1)=>TOWNS.flatMap(t=>(t.lots||[]).filter(l=>l.st!=='ruined'&&l.k!=='field'&&l.k!=='pasture'&&l.x*TILE<x1&&l.y*TILE<y1&&(l.x+l.n)*TILE>x0&&(l.y+l.n)*TILE>y0).map(l=>{
  const b=opaqueBox(lotSprite(t,l)),h=Math.min(12,l.n*TILE*.3);return{x:l.x*TILE+b[0],y:l.y*TILE+Math.max(b[1],b[3]-h),w:b[2]-b[0]+1,h};
}));
class MarchGround{
  constructor(o,units,pad=MARCH_MOVE.pad){
    const r=marchOuter(o),chunk=MARCH_MOVE.chunk,cs=MARCH_MOVE.cell,fly=o.mapKind==='monster'&&MONSTERS[o.id]?.mythic?.fly;this.fly=!!fly;
    this.x=Math.max(0,Math.floor((Math.min(o.x-r,...units.map(u=>u.x))-pad)/chunk)*chunk);this.y=Math.max(0,Math.floor((Math.min(o.y-r,...units.map(u=>u.y))-pad)/chunk)*chunk);
    const x1=Math.min(MW*TILE,Math.ceil((Math.max(o.x+r,...units.map(u=>u.x))+pad)/chunk)*chunk),y1=Math.min(MH*TILE,Math.ceil((Math.max(o.y+r,...units.map(u=>u.y))+pad)/chunk)*chunk);
    const g=this.grid=routeGrid(Math.max(1,Math.ceil((x1-this.x)/cs)),Math.max(1,Math.ceil((y1-this.y)/cs)),cs);this.version=WAYV;this.blocks=marchFootprints(this.x,this.y,x1,y1).filter(b=>b.x<x1&&b.y<y1&&b.x+b.w>this.x&&b.y+b.h>this.y);
    const ferries=WM.crossings.filter((c,i)=>c.kind==='ferry'&&!WM.graph?.closed[i]).map(c=>{const [x,y]=wayCentre(c.i),[tx,ty]=wayCentre(c.j);return{x,y,tx,ty}}).filter(f=>Math.max(f.x,f.tx)>=this.x-cs&&Math.min(f.x,f.tx)<=x1+cs&&Math.max(f.y,f.ty)>=this.y-cs&&Math.min(f.y,f.ty)<=y1+cs);
    for(let i=0;i<g.cost.length;i++){const x=this.x+(i%g.C+.5)*cs,y=this.y+(Math.floor(i/g.C)+.5)*cs,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),k=ty*MW+tx;
      let open=WM.has(tx,ty)&&(fly||wayOpen(k));if(!open&&tAt(tx,ty)===T_WATER)open=ferries.some(f=>{const dx=f.tx-f.x,dy=f.ty-f.y,d=dx*dx+dy*dy,t=clamp(((x-f.x)*dx+(y-f.y)*dy)/d,0,1);return Math.hypot(x-f.x-t*dx,y-f.y-t*dy)<cs});
      g.cost[i]=open&&(fly||!this.blocks.some(b=>x+cs/2>b.x&&x-cs/2<b.x+b.w&&y+cs/2>b.y&&y-cs/2<b.y+b.h))?ROUTE.unit:0;
      if(!fly&&WM.has(tx,ty)){const edge=WM.edge[k];if(x%TILE<cs&&edge&4)g.wall[i]|=4;if(x%TILE>TILE-cs&&edge&1)g.wall[i]|=1;if(y%TILE<cs&&edge&8)g.wall[i]|=8;if(y%TILE>TILE-cs&&edge&2)g.wall[i]|=2}
    }
  }
  local(p){return{x:p.x-this.x,y:p.y-this.y}}
  world(p){return{x:p.x+this.x,y:p.y+this.y}}
  contains(p,pad=0){const g=this.grid;return p.x>=this.x+pad&&p.y>=this.y+pad&&p.x<this.x+g.C*g.cs-pad&&p.y<this.y+g.R*g.cs-pad}
  covers(p,pad){const g=this.grid,x1=this.x+g.C*g.cs,y1=this.y+g.R*g.cs;return p.x>=this.x+(this.x>0?pad:0)&&p.y>=this.y+(this.y>0?pad:0)&&p.x<x1-(x1<MW*TILE?pad:0)&&p.y<y1-(y1<MH*TILE?pad:0)}
  open(p){return this.contains(p)&&!!this.grid.cost[routeIx(this.grid,p.x-this.x,p.y-this.y)]}
  stand(p){return this.open(p)&&(this.fly||terrAt(p.x,p.y)!==T_WATER)}
  clear(a,b){return this.contains(a)&&this.contains(b)&&lineClear(this.grid,a.x-this.x,a.y-this.y,b.x-this.x,b.y-this.y)}
  // Keep blocked slots on the leader's connected ground; distinct nearby slots prevent a pile on a riverbank or building.
  snap(p,reach,reserved,inside){
    const g=this.grid,a=this.local(p),i=routeIx(g,a.x,a.y),rb=p.type?marchBody(p):MARCH_MOVE.gap+.2,space=q=>!reserved?.points?.some(v=>Math.hypot(v.x-q.x,v.y-q.y)<(rb+(v.r??rb))/2),at=j=>({x:this.x+(j%g.C+.5)*g.cs,y:this.y+(Math.floor(j/g.C)+.5)*g.cs}),ok=j=>g.cost[j]&&this.stand(at(j))&&(!reach||reach[j])&&(!reserved||!reserved.has(j))&&(!inside||inside(at(j)))&&space(at(j)),keep=(q,j)=>{if(reserved){reserved.add(j);(reserved.points||(reserved.points=[])).push({...q,r:rb})}return q};// (a body's room kept round each goal taken: marchBody)
    // (its own spot when there is a body's room there: never moved off it for another goal in the same cell, the cells smaller
    // than a body, or the slots would hop from cell to cell as the army moves)
    if(this.contains(p)&&this.stand(p)&&g.cost[i]&&(!reach||reach[i])&&(!inside||inside(p))&&space(p))return keep({x:p.x,y:p.y},i);
    // (a body in the way, the leader's or another's: pushed straight out of it, just clear, so the place moves with the army rather
    // than hop to a cell's middle)
    {const v=reserved?.points?.find(v=>Math.hypot(v.x-p.x,v.y-p.y)<(rb+(v.r??rb))/2);if(v){const d=Math.hypot(p.x-v.x,p.y-v.y)||1,n=(rb+(v.r??rb))/2+.05,q={x:v.x+(p.x-v.x)/d*n,y:v.y+(p.y-v.y)/d*n},a=this.local(q),j=routeIx(g,a.x,a.y);
      if(this.contains(q)&&this.stand(q)&&g.cost[j]&&(!reach||reach[j])&&(!inside||inside(q))&&space(q))return keep(q,j)}}
    const c0=i%g.C,r0=Math.floor(i/g.C);let best=-1,dist=Infinity;
    for(let k=0;k<Math.max(g.C,g.R)&&!(best>=0&&k*k>dist);k++)for(let r=Math.max(0,r0-k);r<=Math.min(g.R-1,r0+k);r++){
      const edge=r===r0-k||r===r0+k;for(let c=c0-k;c<=c0+k;c+=edge||k===0?1:2*k){if(c<0||c>=g.C)continue;const j=r*g.C+c,d=(c-c0)**2+(r-r0)**2;if(ok(j)&&d<dist){best=j;dist=d}}}
    if(best<0)return null;return keep(at(best),best);
  }
  reachable(p){const a=this.local(p),i=routeNear(this.grid,routeIx(this.grid,a.x,a.y));if(this.root!==i){this.root=i;this.reach=routeFlood(this.grid,i)}return this.reach}
  island(p){const q=this.local(p),i=routeNear(this.grid,routeIx(this.grid,q.x,q.y));this.islands||=[];let reach=this.islands.find(r=>r[i]);if(!reach){reach=routeFlood(this.grid,i);this.islands.push(reach)}return reach}
  path(a,b){const p=routePath(this.grid,a.x-this.x,a.y-this.y,b.x-this.x,b.y-this.y);return p.map(([x,y])=>({x:x+this.x,y:y+this.y}))}
}
class MarchArmy{
  constructor(o){this.owner=o;this.face=this.heading=marchFacing(o);this.x=this.wx=this.gx=o.x;this.y=this.wy=this.gy=o.y;this.units=[];this.serial=0;this.time=0;this.key='';this.ground=null}
  // (a true jump, o put at x, y (a gate, a load, a battle's end): its army re-placed round it at its next step)
  static jump(o,x,y){o.x=x;o.y=y;const a=MARCH_ARMIES.get(o);if(a)a.jumped=true}
  static of(o){let a=MARCH_ARMIES.get(o);if(a&&Math.hypot(o.x-a.x,o.y-a.y)>MARCH_MOVE.teleport){MARCH_ARMIES.delete(o);a=null}if(!a){a=new MarchArmy(o);MARCH_ARMIES.set(o,a);a.sync()}return a}
  static spread(o){const a=MARCH_ARMIES.get(o);return a&&Math.hypot(o.x-a.x,o.y-a.y)<=MARCH_MOVE.teleport?Math.max(0,...a.units.map(u=>Math.hypot(u.x-o.x,u.y-o.y)+3)):0}
  relocate(x,y){
    const dx=x-this.owner.x,dy=y-this.owner.y;this.owner.x=x;this.owner.y=y;this.x+=dx;this.y+=dy;this.ground=null;this.mid=null;
    for(const u of this.units){u.x+=dx;u.y+=dy;if(u.goal){u.goal.x+=dx;u.goal.y+=dy}u.plan=null;u.walking=false}
  }
  targets(){
    const o=this.owner,co=Math.cos(this.face),si=Math.sin(this.face),out=[];
    for(const row of this.rows){
      const x=o.x+row.x*co-row.y*si,y=o.y+row.x*si+row.y*co,slots=marchSlots(row,this.face+(row.face||0));
      slots.forEach(([sx,sy],i)=>out.push({row:row.id,index:i,type:row.type,character:row.character,x:x+sx/WORLD_BATTLE.scale,y:y+sy/WORLD_BATTLE.scale}));
    }return out;
  }
  // (the middle that a member of row id standing at p puts the army at: his row's place turned to its facing, taken off)
  middleOf(id,p){const r=(this.rows||marchRows(this.owner)).find(r=>r.id===id),co=Math.cos(this.face),si=Math.sin(this.face);return r?{x:p.x-(r.x*co-r.y*si),y:p.y-(r.x*si+r.y*co)}:{x:p.x,y:p.y}}
  // (its men to its rows: only when they are made again (marchLayout) or a man has fallen)
  sync(){
    const rows=marchRows(this.owner),dead=this.units.some(u=>u.dead);if(rows===this.rows&&!dead)return;this.rows=rows;const key=JSON.stringify(rows);if(key===this.key&&!dead)return;this.key=key;
    const targets=this.targets(),old=this.units.filter(u=>!u.dead),used=new Set(),units=[];
    this.ground=new MarchGround(this.owner,old);this.refresh=this.time+MARCH_MOVE.refresh;const g=this.ground,reach=g.reachable(this.owner),reserved=new Set();
    for(const p of targets){let u=old.find(u=>!used.has(u)&&u.row===p.row&&u.type===p.type);if(u){used.add(u);reserved.add(routeIx(g.grid,u.x-g.x,u.y-g.y))}else{const q=g.snap(p,reach,reserved)||g.snap(this.owner,null,reserved);if(!q)continue;u={id:++this.serial,x:q.x,y:q.y,walk:0,walking:false};}
      Object.assign(u,{row:p.row,index:p.index,type:p.type,character:p.character,goal:{x:p.x,y:p.y},plan:null});units.push(u)}this.units=units;
    this.carrier=units.find(u=>u.row==='leader'||u.row==='hero')||units[0]||null;
  }
  // (where its carrier holds a torch: its leader's marcher (yours: your hero), else its first, at his hand's height, before him as
  // he faces; world px)
  hand(){const u=this.carrier;if(!u)return null;const s=marchSprite(u,this.owner),k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale,fd=Math.cos(u.dir??this.face)<0?-1:1;
    return{u,x:u.x+fd*s.width*k*MARCH_TORCH.fwd,y:u.y+2*k-s.height*k*(ST[u.type]?.mounted?MARCH_TORCH.ride:MARCH_TORCH.foot)}}
  step(d,sync=true,bounds=null,inside=null){
    if(!(d>0))return;const o=this.owner,C=MARCH_MOVE.menCentre;if(Math.hypot(o.x-this.x,o.y-this.y)>MARCH_MOVE.teleport){MARCH_ARMIES.delete(o);MarchArmy.of(o);return}
    if(sync)this.sync();this.time+=d;
    // (the owner, 2026-11-01: "why don't you calculate the center based on unit's position": menCentre) the army is where its men
    // are: its owner's x, y are its men's middle, written back at the end of each step; what moves it (a brain, your march, a test)
    // moves its guide (gx, gy), round which its men's places are laid. Moved since the last step by one of them (the march guides
    // system gives the guide back first), the guide goes so far; put where it stands with its men (relocate, settle, a battle's
    // end), the guide there; a jump (flagged: MarchArmy.jump, or a move while it was not marched: out of a holding, a camp, out of
    // range; or one between moments, march guides; or one past its own ring in a moment, as no march goes), every man re-placed
    // round it
    let jump=false,dx=o.x-this.x,dy=o.y-this.y;if(C){jump=this.jumped||this.idle&&(dx||dy)||Math.hypot(dx,dy)>marchOuter(o);const placed=!this.lent&&(this.x!==this.wx||this.y!==this.wy);this.jumped=this.idle=this.lent=false;
      if(jump||placed){dx=dy=0;this.gx=o.x;this.gy=o.y}else{this.gx+=dx;this.gy+=dy}o.x=this.gx;o.y=this.gy}
    const moved=Math.hypot(dx,dy),to=moved>.001?(this.heading=Math.atan2(dy,dx)):this.heading,gap=Math.atan2(Math.sin(to-this.face),Math.cos(to-this.face));this.face+=clamp(gap,-MARCH_MOVE.turn*d,MARCH_MOVE.turn*d);this.x=o.x;this.y=o.y;
    if(jump)this.ground=new MarchGround(o,[]);
    if(!this.ground||this.ground.version!==WAYV||this.time>=(this.refresh||0)||!this.ground.covers(o,marchOuter(o)+8)||!jump&&this.units.some(u=>!this.ground.covers(u,8))){this.ground=new MarchGround(o,jump?[]:this.units,C&&this.split?MARCH_MOVE.wide:MARCH_MOVE.pad);this.refresh=this.time+MARCH_MOVE.refresh}
    // (menCentre: men on ground their middle's does not reach in its box (across a river, the bridge or the ford past its edge: a
    // battle's end), its box made MARCH_MOVE.wide px wider round them, so their way round is in it, while they are so)
    let reach=this.ground.reachable(o);if(C){const g=this.ground,off=this.units.some(u=>!u.dead&&!reach[routeIx(g.grid,u.x-g.x,u.y-g.y)]);if(off&&!this.split){this.split=true;this.ground=new MarchGround(o,this.units,MARCH_MOVE.wide);this.refresh=this.time+MARCH_MOVE.refresh;reach=this.ground.reachable(o)}else if(!off)this.split=false}
    const nav=this.ground,reserved=new Set(),targets=this.targets();this.queries=0;
    // (each man his march pace; menCentre: the army's own step this moment, at least that, at most road times it: its step how far
    // its guide went over the time since it last moved, at most a mid tier's moment (worldobject.js WORLD_LOD: such a one steps
    // every few frames, its whole step at once). Without: the army's step, its road with it, a leap past it no march)
    const walk=moveStep(marchPace(o),d,!B?.world);let step;
    if(C){const span=Math.min(d*WORLD_LOD.midEvery,d+(this.still||0));step=Math.max(walk,Math.min(moved*d/span,walk*MARCH_MOVE.road))*MARCH_MOVE.catchup;this.still=moved>.001?0:(this.still||0)+d;
      // (a jump: each man at his place round it (as a new man is set, sync); then any man on shut ground (a building's feet: put
      // there by a battle) put on the nearest open ground its middle's reaches, so none stands on a building or is left behind it)
      if(jump){const at=new Map(targets.map(p=>[p.row+':'+p.index,p])),kept=new Set();for(const u of this.units){const p=at.get(u.row+':'+u.index),q=p&&(nav.snap(p,reach,kept)||nav.snap(o,null,kept));if(q){u.x=q.x;u.y=q.y}u.goal=null;u.plan=null;u.vel=0;u.hd=this.face;u.walking=false}this.goalGround=null}
      for(const u of this.units)if(!nav.open(u)){const q=nav.snap({x:u.x,y:u.y,type:u.type},reach);if(q){u.x=q.x;u.y=q.y;u.plan=null}}}
    else{step=(moved>walk&&moved<=walk*MARCH_MOVE.road?moved:walk)*MARCH_MOVE.catchup}
    const buckets=new Map(),cell=MARCH_MOVE.bucket,key=(x,y)=>Math.floor(x/cell)+','+Math.floor(y/cell),put=u=>{const k=key(u.x,u.y),a=buckets.get(k)||[];if(!buckets.has(k))buckets.set(k,a);a.push(u);u.bucket=k};this.units.forEach(put);
    const near=u=>{const out=[],cx=Math.floor(u.x/cell),cy=Math.floor(u.y/cell);for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)out.push(...buckets.get(x+','+y)||[]);return out};
    const wanted=new Map(targets.map(p=>[p.row+':'+p.index,p])),requests=[],sameGoals=this.goalGround===nav&&this.goalX===o.x&&this.goalY===o.y&&this.goalFace===this.face&&this.goalRoster===this.key&&this.goalBounds===bounds;
    this.goalGround=nav;this.goalX=o.x;this.goalY=o.y;this.goalFace=this.face;this.goalRoster=this.key;this.goalBounds=bounds;
    if(marchCentrePiece(o))(reserved.points=[]).push(...marchCart(o));// (a caravan's wagon, ox and drover stand there: no goal on them)
    for(const u of this.units){u.walkT=Math.max(0,(u.walkT||0)-d);u.walking=u.walkT>0;const p=wanted.get(u.row+':'+u.index);if(!sameGoals){const at=routeIx(nav.grid,u.x-nav.x,u.y-nav.y),local=reach[at]?reach:nav.island(u);u.goal=p&&nav.snap(bounds?{...bounds(p),type:p.type}:p,local,reserved,inside)}if(!u.goal)continue;
      u.straight=nav.clear(u,u.goal);if(u.straight){u.plan=null;delete u.needAt;continue}
      const w=u.plan;if(!w||w.ground!==nav||this.time>=w.at||Math.hypot(w.goal.x-u.goal.x,w.goal.y-u.goal.y)>nav.grid.cs){u.needAt??=this.time;requests.push(u)}}
    requests.sort((a,b)=>a.needAt-b.needAt||a.id-b.id);for(const u of requests.slice(0,MARCH_MOVE.queries)){this.queries++;u.plan={ground:nav,p:nav.path(u,u.goal),i:0,goal:u.goal,at:this.time+MARCH_MOVE.repath+u.id%7*.025};delete u.needAt}
    for(const u of this.units){u.squeeze=false;const goal=u.goal,gd=goal?Math.hypot(goal.x-u.x,goal.y-u.y):0;if(!goal||gd<=MARCH_MOVE.settle){u.rest=!!goal;continue}if(u.rest&&moved<=.001&&gd<MARCH_MOVE.wake&&(!C||Math.abs(gap)<1e-3))continue;u.rest=false;
      let aim=goal;if(!u.straight){const w=u.plan;if(!w||w.ground!==nav||!w.p.length)continue;while(w.i<w.p.length-1&&(Math.hypot(w.p[w.i].x-u.x,w.p[w.i].y-u.y)<MARCH_MOVE.waypoint||nav.clear(u,w.p[w.i+1])))w.i++;aim=w.p[w.i]}
      const ax=aim.x-u.x,ay=aim.y-u.y,l=Math.hypot(ax,ay);if(l<.001)continue;const friends=near(u),want=Math.atan2(ay,ax),ru=marchBody(u),K=marchKind(u.type),top=step/d,probe=Math.min(l,Math.max(step,ru*.5));
      // (a body (the owner, 2026-10-31: "like unit really have physics"): his heading turns at his kind's rate, his speed rises and
      // falls over its time, braking as he nears his place; he goes only the way he faces: no jump aside, no sudden stop.
      // The way: straight at his place, else the first of the sidesteps a friend leaves open; none open, he slows to a halt)
      if(u.hd==null){u.hd=u.dir??want;u.vel=0}let way=null;
      // (round a friend, the side he took last, while he still goes round: no flip from one side to the other)
      const sides=u.side?MARCH_MOVE.sidestep.filter(o=>!o||Math.sign(o)===u.side):MARCH_MOVE.sidestep;
      for(const off of sides){const a=want+off,p={x:u.x+Math.cos(a)*probe,y:u.y+Math.sin(a)*probe};if(nav.clear(u,p)&&!friends.some(v=>v!==u&&Math.hypot(v.x-p.x,v.y-p.y)<(ru+marchBody(v))/2&&Math.hypot(v.x-p.x,v.y-p.y)<Math.hypot(v.x-u.x,v.y-u.y)-.001)){way=a;break}}
      // (the army standing, he hemmed in by his own side a while (blocked, or only stepping round them), well short of his place: he
      // squeezes through, the parting pass below making room; the army marching, after MARCH_MOVE.jam s of it: a crowd in a ford)
      u.side=way!=null&&way!==want?Math.sign(Math.atan2(Math.sin(way-want),Math.cos(way-want))):0;let cap=top;if(way===want)u.stuck=Math.max(0,(u.stuck||0)-d/2);else if(way!=null)u.stuck=(u.stuck||0)+d/2;else{u.stuck=(u.stuck||0)+d;}u.squeeze=u.stuck>=(moved<=.001?MARCH_MOVE.squeeze[0]:MARCH_MOVE.jam)&&gd>MARCH_MOVE.squeeze[2];if(u.squeeze){way=want;cap=top*MARCH_MOVE.squeeze[1]}
      const df=way==null?0:Math.atan2(Math.sin(way-u.hd),Math.cos(way-u.hd)),rate=K.turn0+(K.turn-K.turn0)*Math.min(1,u.vel/Math.max(1e-6,top));u.hd+=clamp(df,-rate*d,rate*d);
      const off=Math.atan2(Math.sin((way??want)-u.hd),Math.cos((way??want)-u.hd)),tgt=way==null?0:Math.min(cap*Math.max(0,Math.cos(off))**2,Math.sqrt(2*top/K.t*.6*l));
      u.vel=clamp(tgt,u.vel-top/K.t*d*1.6,u.vel+top/K.t*d);if(!(u.vel>1e-4)){u.vel=0;continue}
      const s1=Math.min(u.vel*d,l),last=s1>=l-.001&&Math.abs(off)<.35,q=last?{x:aim.x,y:aim.y}:{x:u.x+Math.cos(u.hd)*s1,y:u.y+Math.sin(u.hd)*s1};
      if(!nav.clear(u,q)||friends.some(v=>v!==u&&way!==want&&Math.hypot(v.x-q.x,v.y-q.y)<(ru+marchBody(v))/2-.05&&Math.hypot(v.x-q.x,v.y-q.y)<Math.hypot(v.x-u.x,v.y-u.y))){u.vel*=.5;continue}
      const at=buckets.get(u.bucket);at.splice(at.indexOf(u),1);u.dir=u.hd;u.x=q.x;u.y=q.y;u.walk+=s1;u.stepT=(u.stepT||0)+d;u.walking=true;u.walkT=MARCH_MOVE.stride;put(u);
    }
    // (then apart: no two closer than their bodies; a caravan's wagon is a body too, never pushed; one squeezing through takes
    // little of the push, those he passes give way)
    const lead=marchCentrePiece(o)?marchCart(o):null,move=(u,x,y)=>{const p={x,y};if(!nav.clear(u,p)||!nav.stand(p))return;const at=buckets.get(u.bucket);at.splice(at.indexOf(u),1);u.x=x;u.y=y;put(u)};
    for(let pass=0;pass<MARCH_MOVE.part;pass++)for(const u of this.units){const ru=marchBody(u);
      for(const v of lead?[...near(u),...lead]:near(u)){if(v===u)continue;const dx=u.x-v.x,dy=u.y-v.y,dd=Math.hypot(dx,dy),need=(ru+(v.r??marchBody(v)))/2;if(dd>=need)continue;
        const k=v.fixed?1:u.squeeze===!!v.squeeze?.5:u.squeeze?MARCH_MOVE.squeeze[3]:1-MARCH_MOVE.squeeze[3],a=dd>1e-6?Math.atan2(dy,dx):u.id*2.39996;move(u,u.x+Math.cos(a)*(need-dd)*k,u.y+Math.sin(a)*(need-dd)*k)}}
    // (the owner, 2026-10-31: "the army radius move too fast, it should follow the speed of all units") its middle never runs ahead
    // of its men: each man's spot less his place in it is where he puts it, their median where they do (no man placed: their
    // midst). menCentre: that is the army's middle, its owner put there; its guide never more than MARCH_MOVE.lead (px, s of its
    // pace) from it, any way, so men held by a building hold it. Without: more than MARCH_MOVE.leash ahead of that along its way
    // (men only wheeling round it, beside it, never hold it), it gives back what it went this moment, along its own way (never back
    // past where it stood); a leap (a town's gate, under MARCH_MOVE.teleport) is no march: never held
    // (menCentre: each man's place turned as his army stands now (the turn that best lays its places on its men: a wheel under way
    // they still swing through neither drags it back nor flings it out))
    {if(C)this.mid=this.middle(wanted);else{const M=[];for(const u of this.units){const p=wanted.get(u.row+':'+u.index);if(p)M.push([u.x-p.x+o.x,u.y-p.y+o.y])}
        const med=k=>M.map(q=>q[k]).sort((a,b)=>a-b)[M.length>>1];this.mid=M.length?{x:med(0),y:med(1)}:null}
      if(C){const c=this.mid,L=MARCH_MOVE.lead,lim=L[0]+L[1]*step/d,gx=this.gx-c.x,gy=this.gy-c.y,l=Math.hypot(gx,gy);
        if(l>lim){this.gx=c.x+gx/l*lim;this.gy=c.y+gy/l*lim}this.mid=c;o.x=this.x=this.wx=c.x;o.y=this.y=this.wy=c.y}
      else if(moved>.001&&moved<=walk*MARCH_MOVE.road&&this.mid){const gap=((o.x-this.mid.x)*dx+(o.y-this.mid.y)*dy)/moved-MARCH_MOVE.leash[0]-MARCH_MOVE.leash[1]*step/d;
        if(gap>0){const back=Math.min(gap,moved);o.x-=dx/moved*back;o.y-=dy/moved*back;this.x=o.x;this.y=o.y}}}
  }
  // (the box round its men's discs (marchDisc), world px about where they stand: x0, y0, x1, y1; made again when they have moved)
  box(){const b=this.bx||(this.bx=new Float32Array(4));if(this.bxT===this.time&&this.bxU===this.units&&this.bxX===this.x&&this.bxY===this.y)return b;b[0]=b[1]=Infinity;b[2]=b[3]=-Infinity;
    for(const u of this.units){if(u.dead)continue;const r=marchDisc(u);if(u.x-r<b[0])b[0]=u.x-r;if(u.y-r<b[1])b[1]=u.y-r;if(u.x+r>b[2])b[2]=u.x+r;if(u.y+r>b[3])b[3]=u.y+r}this.bxT=this.time;this.bxU=this.units;this.bxX=this.x;this.bxY=this.y;return b}
  // (menCentre: its men's middle, its fallen left out, wanted: each man's place by row:index (its targets): each man's spot less his
  // place, the places turned as the army stands now (the turn that best lays them on its men: a wheel under way they still swing
  // through neither drags it back nor flings it out), their median; no man placed, their midst; none, its owner's point)
  middle(wanted){const o=this.owner;let n=0,ax=0,ay=0,ux=0,uy=0,dd=0,dc=0,co=1,si=0;
    for(const u of this.units){if(u.dead)continue;const p=wanted.get(u.row+':'+u.index);if(p){n++;ax+=p.x-o.x;ay+=p.y-o.y;ux+=u.x;uy+=u.y}}
    if(n>1){ax/=n;ay/=n;ux/=n;uy/=n;for(const u of this.units){const p=!u.dead&&wanted.get(u.row+':'+u.index);if(!p)continue;const X=p.x-o.x-ax,Y=p.y-o.y-ay,U=u.x-ux,V=u.y-uy;dd+=X*U+Y*V;dc+=X*V-Y*U}
      if(dd||dc){const a=Math.atan2(dc,dd);co=Math.cos(a);si=Math.sin(a)}}
    const M=[];for(const u of this.units){const p=!u.dead&&wanted.get(u.row+':'+u.index);if(p){const X=p.x-o.x,Y=p.y-o.y;M.push([u.x-(X*co-Y*si),u.y-(X*si+Y*co)])}}
    if(M.length){const med=k=>M.map(q=>q[k]).sort((a,b)=>a-b)[M.length>>1];return{x:med(0),y:med(1)}}
    const live=this.units.filter(u=>!u.dead);return live.length?{x:live.reduce((s,u)=>s+u.x,0)/live.length,y:live.reduce((s,u)=>s+u.y,0)/live.length}:{x:o.x,y:o.y}}
  // (its men's middle as they stand now, between its steps (a battle's end, the game paused): the banner's place, render.js
  // bannerHome; worked out again only when they, its owner or its facing have moved)
  centre(){const o=this.owner,k=this.cn;if(k&&k.t===this.time&&k.x===o.x&&k.y===o.y&&k.f===this.face&&k.u===this.units&&k.d===this.units.filter(u=>u.dead).length)return k.c;
    const rows=this.rows||marchRows(o);if(!this.rows)this.rows=rows;const c=this.middle(new Map(this.targets().map(p=>[p.row+':'+p.index,p])));
    this.cn={t:this.time,x:o.x,y:o.y,f:this.face,u:this.units,d:this.units.filter(u=>u.dead).length,c};return c}
  forGroup(id){return this.units.filter(u=>u.row===id)}
  // (after a battle on the map, its middle where its survivors stand: by its leader's place, else their midst; yours by your
  // hero's, worldbattle.js. Its outline made afresh round its survivors; menCentre: its next step puts it at its men's middle, its
  // banner there meanwhile (render.js bannerHome, MarchArmy#centre)
  settle(){
    const o=this.owner,live=this.units.filter(u=>!u.dead);if(this.ring)this.ring.leap=true;if(o===P||!live.length)return;const L=live.find(u=>u.row==='leader');
    const q=L?this.middleOf('leader',L):{x:live.reduce((n,u)=>n+u.x,0)/live.length,y:live.reduce((n,u)=>n+u.y,0)/live.length};o.x=this.x=q.x;o.y=this.y=q.y;
  }
  // (the owner, 2026-11-01: "make a whole army clickable") what of it is at world x, y (world.js pickAt): one of its men's figures
  // as drawn ({kind 'figure', d: from the middle of the nearest's box, 0, to its edge, 1}), else inside its outline (its field at
  // MARCH_RING.threshold: {kind 'outline', d: px to its nearest man's disc}), else null; tol: px of slack (a finger's tap). One
  // answer kept and given again (no new one each pointer move)
  hit(x,y,tol=0){const o=this.owner,b=this.box(),M=MARCH_PICK,R=this.hr||(this.hr={kind:'',d:0});let f=Infinity;
    if(x>=b[0]-M.side-tol&&x<=b[2]+M.side+tol&&y>=b[1]-M.up-tol&&y<=b[3]+tol)for(const u of this.units){if(u.dead)continue;const F=this.figure(u),fl=Math.cos(u.dir??this.face)<0,
      x0=u.x+(fl?-F[2]:F[0])-tol,x1=u.x+(fl?-F[0]:F[2])+tol,y0=u.y+F[1]-tol,y1=u.y+F[3]+tol;
      if(x>=x0&&x<x1&&y>=y0&&y<y1){const v=Math.max(Math.abs(2*x-x0-x1)/(x1-x0),Math.abs(2*y-y0-y1)/(y1-y0));if(v<f)f=v}}
    if(f<Infinity){R.kind='figure';R.d=f;return R}
    const L=MARCH_RING.on&&this.ring,dx=x-o.x,dy=y-o.y;if(!L||!(L.inside(dx,dy)||tol>0&&this.nearOutline(L,dx,dy,tol)))return null;
    R.kind='outline';R.d=this.near(x,y);return R}
  // (inside outline L within tol px of dx, dy about the middle: tried half and all the way out, eight ways)
  nearOutline(L,dx,dy,tol){for(let k=0;k<16;k++){const r=k<8?tol/2:tol,a=k*Math.PI/4;if(L.inside(dx+r*Math.cos(a),dy+r*Math.sin(a)))return true}return false}
  // (a man's figure as drawn (drawMarcher), standing, facing east: its drawn pixels' box about his feet, world px x0, y0, x1, y1;
  // worked out once for his kind)
  figure(u){const c=MARCH_FIGS.get(u);if(c&&c.t===u.type)return c.b;const s=marchSprite(u,this.owner,0),q=opaqueBox(s),k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale,h=-Math.floor(s.width/2),y=2-s.height,
    b=[k*(h+q[0]),k*(y+q[1]),k*(h+q[2]+1),k*(y+q[3]+1)];MARCH_FIGS.set(u,{t:u.type,b});return b}
  // (px from world x, y to its nearest man's disc (marchDisc), a caravan's wagon, ox and drover among them; 0 on one)
  near(x,y){const o=this.owner;let v=Infinity;for(const u of this.units){if(u.dead)continue;const d=Math.hypot(u.x-x,u.y-y)-marchDisc(u);if(d<v)v=d}
    if(marchCentrePiece(o)){const s=o.dir<0?-1:1;for(const c of MARCH_CART){const d=Math.hypot(o.x+s*c[0]-x,o.y-y)-c[1]/2;if(d<v)v=d}}return Math.max(0,v)}
  // (the box round its men's figures as drawn, world px x0, y0, x1, y1: the pointer's brackets round it, worldui.js wuiBox; made
  // again when they have moved)
  figBox(){const b=this.fbx||(this.fbx=[0,0,0,0]);if(this.fbT===this.time&&this.fbU===this.units&&this.fbX===this.x&&this.fbY===this.y)return b;b[0]=b[1]=Infinity;b[2]=b[3]=-Infinity;
    for(const u of this.units){if(u.dead)continue;const F=this.figure(u),fl=Math.cos(u.dir??this.face)<0,x0=u.x+(fl?-F[2]:F[0]),x1=u.x+(fl?-F[0]:F[2]);
      if(x0<b[0])b[0]=x0;if(x1>b[2])b[2]=x1;if(u.y+F[1]<b[1])b[1]=u.y+F[1];if(u.y+F[3]>b[3])b[3]=u.y+F[3]}this.fbT=this.time;this.fbU=this.units;this.fbX=this.x;this.fbY=this.y;return b}
}
/* picking an army on the map by its men (world.js pickAt, MarchArmy hit): tap: CSS px of slack a finger's tap gets, round each
   figure and the outline; side, up: px beside and over its men's feet their figures may reach (its box's quick look first) */
const MARCH_PICK={tap:8,side:40,up:64};
const MARCH_FIGS=new WeakMap();
// (an army picked by its men: marched man by man now (world battles on, a man of it standing, not left behind by a leap; yours not
// in camp or a holding); null: by its old circle)
function marchPicked(o){const a=WORLD_BATTLE.on&&MARCH_ARMIES.get(o);return a&&a.units.some(u=>!u.dead)&&Math.hypot(o.x-a.x,o.y-a.y)<=MARCH_MOVE.teleport&&!(o===P&&(P.stay||P.camp))?a:null}
onWorld(()=>{MARCH_ARMIES=new WeakMap()});
// (every army that marches man by man, near you: yours, the parties, the caravans, the beasts)
const marchOwners=()=>[P,...W.parties,...W.caravans,...W.monsters.map(asMonster)];
// (menCentre: before anything moves (the brains, your march), each army marched last moment gives its owner its guide back to move;
// one moved since by other than its march (Kit.goTo, a gate between moments): a jump, re-placed at its next step)
Systems.add({name:'march guides',order:{frame:48},frame:()=>{
  if(!WORLD_BATTLE.on||!MARCH_MOVE.menCentre)return;
  for(const o of marchOwners()){const a=MARCH_ARMIES.get(o);if(!a||a.idle||a.lent)continue;if(o.x===a.wx&&o.y===a.wy&&a.x===a.wx&&a.y===a.wy){o.x=a.x=a.gx;o.y=a.y=a.gy;a.lent=true}else if(o.x!==a.x||o.y!==a.y)a.jumped=true}
}});
Systems.add({name:'march formations',order:{frame:145},frame:d=>{
  if(!WORLD_BATTLE.on)return;const range=vis()+MARCH_MOVE.active;
  for(const o of marchOwners()){if(o===P?(P.stay||P.camp):o.dead||o.gone||o.inside||o.fight||Math.hypot(o.x-P.x,o.y-P.y)>range){const a=MARCH_ARMIES.get(o);if(a)a.idle=true;continue}MarchArmy.of(o).step(d)}
}});
