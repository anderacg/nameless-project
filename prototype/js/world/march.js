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
const marchSlots=(row,a)=>formSlots(mapForm(row.form||'line'),row.count||1,a,row.files,WORLD_BATTLE.sprite*marchRoomK(row));
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
  const style=o===P||saved?MARCH_STYLES.yours:MarchStyle.pick(o,gs),col=TravelStyle.column(o),key=style+'|'+r.size+'|'+r.reserved+'|'+lead+'|'+ids.map(id=>{const g=gs.find(g=>g.id===id);return g?id+':'+g.type+':'+g.count+':'+g.form+':'+g.files:id}).join()+(saved?'|'+JSON.stringify(saved):'')+(o.army?.column?'|c'+o.army.column.join():'')+(col?'|column':'');
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
  L={key,style,rows,room,outer:Math.max(room,...rows.map(row=>marchFoot(row,row.x,row.y)+MARCH_STYLES.margin)),column:null};
  // (marching in a column (marchstyles.js TravelStyle): its men along its way, in its style's order; its ring round the whole of it)
  if(col){L.column=new MarchColumn(rows,o);L.outer=Math.max(L.outer,L.column.reach+MARCH_STYLES.margin)}MARCH_LAYOUTS.set(o,L);return L;
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
// (an army whose men march round it now: its MarchArmy stepping (in range, not idle), its point within its ring of where they put
// it, yours not in camp or a holding; null: not marched man by man (world.js armyGround: its ground by its point))
// (where an army stands, as one following it reads it (world.js followStep, hosts.js Host's trail): its point, where its men are
// (a column's middle along its way), even while its guide (a column's head) is lent to its brain (march guides); else o itself;
// TRAVEL_STYLES.on false: o, as before. One answer, written afresh each time)
const MARCH_POINT={x:0,y:0};
function marchPoint(o){const a=TRAVEL_STYLES.on&&MARCH_ARMIES.get(o);if(!(a&&a.lent))return o;MARCH_POINT.x=a.wx;MARCH_POINT.y=a.wy;return MARCH_POINT}
function marchMen(o){const a=WORLD_BATTLE.on&&MARCH_ARMIES.get(o);return a&&a.units.length&&!a.idle&&Math.hypot(o.x-a.x,o.y-a.y)<=marchOuter(o)&&!(o===P&&(P.stay||P.camp))?a:null}
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
// (where your army makes for to meet o (world.js approach, a chase): its man nearest you, the near edge of its army, not its middle
// (the owner, 2026-11-02: "I interact with other army, like meet, follow, it'll focus on the center"); not marched man by man, or
// MARCH_MOVE.meetEdge off: its point. One answer, written afresh)
const MARCH_MEET={x:0,y:0};
function marchMeetAt(o){const M=MARCH_MEET,a=MARCH_MOVE.meetEdge&&o!==P&&marchLive(o);M.x=o.x;M.y=o.y;if(!a)return M;const dx=o.x-a.x,dy=o.y-a.y;let b=Infinity;
  for(const u of a.units){if(u.dead)continue;const d=Math.hypot(u.x+dx-P.x,u.y+dy-P.y);if(d<b){b=d;M.x=u.x+dx;M.y=u.y+dy}}return M}
// (in a column on the march (the caller's: never a crowd standing, nor a formation), the comrade just ahead of a marcher in his file, walking his way (within MARCH_MOVE.follow.look px past their bodies, beside him
// by less than their bodies, facing within 60 degrees of it): he keeps pace behind him, his speed at most the comrade's (none if he
// stands) and gain a second for each px past their bodies and gap, rather than halting at him for want of a sidestep (the owner,
// 2026-11-02: "the unit will walk a bit, then stop, then walk again"). null: none such (follow off), the sidesteps as before)
const MARCH_LEAD={cap:0,v:null};
function marchLead(u,want,friends,ru){const F=MARCH_MOVE.follow;if(!F)return null;const c=Math.cos(want),s=Math.sin(want);let best=null,bd=Infinity;
  for(const v of friends){if(v===u||v.dead)continue;const dx=v.x-u.x,dy=v.y-u.y,along=dx*c+dy*s,need=(ru+marchBody(v))/2;
    if(along<=0||along>need+F.gap+F.look||Math.abs(dy*c-dx*s)>need*.9||Math.cos((v.hd??want)-want)<.5)continue;if(along<bd){bd=along;best=v}}
  if(!best)return null;const go=best.rest||!best.walking?0:best.vel||0;if(go<F.moving)return null;// (one standing or barely moving: stepped round, as before)
  MARCH_LEAD.v=best;MARCH_LEAD.cap=Math.max(0,go+(bd-(ru+marchBody(best))/2-F.gap)*F.gain);return MARCH_LEAD}
function marchNear(x,y){const a=marchLive(P);if(!a)return Math.hypot(x-P.x,y-P.y);const ax=P.x-a.x,ay=P.y-a.y;let v=Infinity;for(const u of a.units){if(u.dead)continue;const d=Math.hypot(u.x+ax-x,u.y+ay-y)-marchDisc(u);if(d<v)v=d}return v}
// (you arrive at x, y, your march's point there (world.js marchStep): menCentre, when your men's middle is within MARCH_MOVE.arrive
// px of it, or your men stand in their places (a spot they cannot all stand round); not marched man by man, at once.
// headArrive (the owner, 2026-11-01: "in order the guide to consider to be counted as arrived, only the head should be enough but
// only when the formation is completed"): your march's point at x, y (its head on your goal: marchAim) and its formation complete,
// every man in his place (within the column's place px of it, or resting there), or its guide stood there arriveWait s (men held off
// their places: a building, water))
function marchArrived(x,y){const a=MARCH_MOVE.menCentre&&WORLD_BATTLE.on&&MARCH_ARMIES.get(P);if(!a||!a.units.length||Math.hypot(P.x-a.x,P.y-a.y)>MARCH_MOVE.teleport)return true;
  if(MARCH_MOVE.headArrive){const pl=TRAVEL_STYLES.column.place;return a.units.every(u=>u.dead||u.rest||!u.goal||Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<=pl)||(a.still||0)>=MARCH_MOVE.arriveWait}
  return Math.hypot(a.wx-x,a.wy-y)<=MARCH_MOVE.arrive||a.units.every(u=>u.dead||u.rest||!u.goal)}
// (where your march's point makes for, bound for tx, ty, so that its head stands there (headArrive): short of it by its formation's
// front, its foremost place's reach ahead of its middle as it faces that way (kept till its layout or the way turns); a column's
// guide is its head already, a chase, a follow or a camp to pitch (its middle there: supply.js) its goal itself; nearer than that, where it stands. One answer, written afresh)
const MARCH_AIM={x:0,y:0,key:null,f:0,m:0};
// (TRAVEL_STYLES.steady; the owner, 2026-11-02: "just fix the reforming logic bug": a short click along the road turned your column's
// head back down its own file, and it re-formed round its middle again and again) your column sent to a spot on its own file, behind
// its head and before its tail (MarchColumn along): its head on by as far as the spot is from its middle, so its middle stands there,
// none turning back (the spot ahead of its middle); behind its middle, it stands (its file is on the spot already)
function marchAim(tx,ty){const A=MARCH_AIM,a=MARCH_MOVE.headArrive&&!G.chase&&!G.follow&&!G.pitch&&marchLive(P);A.x=tx;A.y=ty;if(!a)return A;
  if(a.col&&TRAVEL_STYLES.steady){const c=a.colOf();if(c&&c.nv>1&&(tx-c.vx[0])*(c.vx[0]-c.vx[1])+(ty-c.vy[0])*(c.vy[0]-c.vy[1])<0){const s=c.along(tx,ty);
    if(s<c.len){if(s<=c.mid){A.x=P.x+tx-a.wx;A.y=P.y+ty-a.wy}else{A.x=P.x;A.y=P.y}}}return A}
  if(a.col||!a.rows)return A;
  const dx=tx-P.x,dy=ty-P.y,l=Math.hypot(dx,dy);if(l<1e-6)return A;const f=Math.atan2(dy,dx);
  if(A.key!==a.key||Math.abs(Math.atan2(Math.sin(f-A.f),Math.cos(f-A.f)))>.05){const co=Math.cos(f),si=Math.sin(f);let m=0;
    for(const row of a.rows){const x=row.x*co-row.y*si,y=row.x*si+row.y*co;for(const [sx,sy] of marchSlots(row,f+(row.face||0))){const k=(x+sx/WORLD_BATTLE.scale)*co+(y+sy/WORLD_BATTLE.scale)*si;if(k>m)m=k}}
    A.key=a.key;A.f=f;A.m=m}
  const k=Math.max(0,l-A.m)/l;A.x=P.x+dx*k;A.y=P.y+dy*k;return A}
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
// (Outriders on the map (the owner, 2026-11-01): an army's pace × MASTERY.outriders.spd while every group of it rides and has the
// perk (a mastery pick: battle/unitkit.js UnitKit); yours, your hero and the companions with you riding too; else 1, its slowest
// setting its pace. world.js travelMul, partySpeed. An army with no roster made (none marched yet) has no picks: 1, none made)
function marchOutriders(o){if(o!==P&&(!o?.army||!(o.troops||[]).every(k=>ST[k]?.mounted)))return 1;
  const gs=partyRoster(o).groups.filter(g=>g.count>0);if(!gs.length||!gs.every(g=>ST[g.type]?.mounted&&UnitKit.of(g).perk('outriders',true)))return 1;
  return o===P&&(!mountDef()||compsInBand().some(id=>!ST[id]?.mounted))?1:MASTERY.outriders.spd}
// (a caravan's wagon stands at its middle: caravans.js draws it there, its guards round it)
const marchCentrePiece=o=>o.mapKind==='caravan';
// (a caravan's wagon, ox and drover at its middle, along the way it faces (o.dir): each [px along, its body as marchBody's], from
// its picture at the guards' scale (caravans.js caravanSprite: some 30 x 13 px, the cart behind, the ox, the drover at its head);
// no man's goal on them, none pushed onto them, its outline round them (the owner, 2026-11-01: the caravan redrawn)); at: where it
// stands, o's point (in a column, while its men step: the column's, MarchColumn cx, cy)
const MARCH_CART=[[-9,12],[4,10],[13,7]];
const marchCart=(o,at=o)=>{const d=o.dir<0?-1:1;return MARCH_CART.map(([x,r])=>({x:at.x+d*x,y:at.y,r,fixed:true}))};
// The battle's full sprites at its world scale, with weapons included and movement-driven poses (bare: the melee weapon left
// off, drawn apart: a flag's spear, gfx/marchgear.js).
// (his look, as his sprite's: sprites.js spriteLook, kept on him)
function marchLook(u,o){const type=u.character?u.type.replace(/^comp_/,''):u.type,hero=type==='hero',col=o.look().col;
  if(!u.mLook||u.mLookC!==col){u.mLook=spriteLook(type,o.mapKind==='monster'?1:0,hero,hero||u.row==='leader'?0:u.id%6,col);u.mLookC=col}return u.mLook}
function marchSprite(u,o,pose,bare){
  const type=u.character?u.type.replace(/^comp_/,''):u.type,hero=type==='hero',lead=hero||u.row==='leader';
  return unitSprite(type,o.mapKind==='monster'?1:0,hero,lead?0:u.id%6,pose??(u.walking?2+(Math.floor((u.stepT||0)*MARCH_MOVE.cadence)+u.id)%4:0),!!bare,false,o.look().col);
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
  // (another's men only those in your sight, each by his own ground (worldobject.js spotted, manSpotted): a host's van seen as it comes
  // on, the rest still in the fog; yours and your companions' all)
  const own=o===P||o.faction==='player',S=!own&&SIGHT_EYES.armies&&G.mode==='world'&&!B?yourSight():null;
  for(const u of army.units)if(!S||manSpotted(S,u))ents.push({y:u.y,own,f:()=>drawMarcher(u,o,cam)});
  // (a beast's marker over its middle)
  const u0=army.units[0];if(u0&&o.mapKind==='monster')ents.push({y:o.y,f:()=>BANNERQ.push({o,marker:{h:marchSprite(u0,o).height*WORLD_BATTLE.sprite/WORLD_BATTLE.scale,col:o.look().col}})});return true;
}
function drawMarcher(u,o,cam){
  // (standing: his fidgets, as in battle: render.js idleLife, on the real clock)
  const S=ST[u.type]||{},I=!u.walking?idleLife(u.id,performance.now()/1000,S.beast?'beast':S.mounted?'mount':'foot'):null;
  // (what he carries besides, gfx/marchgear.js: his army's flag (on a spear of its own, his body bare; else at his back, before
  // his body), a torch after dark)
  subT(u);const k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale,x=Math.round(u.x-cam.x),y=Math.round(u.y-cam.y),sx=Math.cos(u.dir??marchFacing(o))<0?-k:k,G=marchGear(u,o,x,y,sx);
  // (his body bare, his weapon apart in his hand, as in battle: weapons.js mapHeld; none for a flag-bearer, nor a beast)
  const s=marchSprite(u,o,I?.pose,true),bx=-Math.floor(s.width/2)+(I?.dx||0),by=-s.height+2,H=G.bare||S.beast?null:mapHeld(marchLook(u,o),s,u.walking);
  ctx.save();ctx.translate(x,y);ctx.scale(sx,k);G.back(s,bx,by);if(H&&H.back)ctx.drawImage(H.w,bx+H.x,by+H.y);ctx.drawImage(s,bx,by);if(H&&!H.back)ctx.drawImage(H.w,bx+H.x,by+H.y);G.front(s,bx,by);ctx.restore();
}
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
/* about: about face (the owner, 2026-11-01: a column sent the other way was "kind of chaos, it takes several seconds just to turn
   around"): every man turns where he stands, the tail the head; none changes place, so the turn is at once, its guide going on at
   full pace. A column turned back on its way (TRAVEL_STYLES.column.about): its file the other way round (MarchColumn turn); a march
   formation sent more than cos round: its whole layout laid as it stood (MarchArmy layFace), its facing the new way at once (each
   man's own body turns at his kind's rate; its guide put at its men's middle, a lead ahead of them no longer). Its order is
   then the other way round for that leg (archers may lead); it comes back (MarchArmy reorder) once it has gone leg px the new way, or
   its guide stood halt s: each group's places its chosen ones again, its men only slowing or hastening along the way, none walking
   back through the file: a man more than pass px ahead of his place (along its way, as it faces) stands aside while it marches till
   his place comes level with him: a formation's man out past its flank on his side, a column's out of its file on his side (side:
   × his body past it), where one more than lag px behind his place hastens up beside it twice as far out, look px on at a time
   (MarchColumn pass); halted, a column's man ahead walks back down beside its file. Meanwhile its guide goes slow of the way it is
   moved; over when none is so far off, or after most s. on false: as before (a column out of its file and into a new one, a
   formation wheeling about its middle at turn). (Not yours bound to a spot by your own file, nor one turned back again before it
   has gone its length: as before, MarchArmy aboutColumn)
   loop: a countermarch (the owner, 2026-11-01, of the above: "once finish walk they try to change the head back to the original
   head. it turns out that the unit use quite sometimes to figured out how to rotate or move back"; "why don't just move in long
   oval arc or circle for this? make them one line each and move around in circle to rotate between head and tail"). A column's
   order comes back only at a halt (none at leg, none walked back): its guide stood halt s and its men in their places, it walks a
   racetrack oval round where it stands (marchstyles.js MarchLoop) in single file, half a lap, then stands as the straight column in
   the chosen order, facing the way it went. Its lanes gap px apart (its files' width at least; a caravan's margin px clear of its
   wagon), its ends end px past its head and tail (0: round); each man's place slid round at pace × the march's walk (up to it over
   ease s; no faster than its slowest turning men keep to its ends at), each on by as far as he trails it braking. None when the
   oval, or margin px round it, is off ground a man stands on (water, a building, a cliff): its order kept the other way round,
   tried again at its next halt (or back when it forms out of its column, as ever). Sent on mid-loop: the loop stops, its men to
   their places as it stands (still turned), a new loop at its next halt. A march formation's order: as above. on false: as above
   for a column too */
// formGiveUp, formTry, formMove, formGain: a man short of his place, no nearer it by formGain px in formTry s, stands where he is, till its guide goes formMove px
// or it is ordered anew (MarchArmy formWatch; the owner, 2026-11-02); off: they try on, as before
const MARCH_MOVE={formGiveUp:true,formTry:5,formMove:8,formGain:2,cell:4,pad:48,chunk:64,repath:.45,refresh:2,catchup:1,turn:.9,settle:.2,gap:2.4,active:180,queries:6,teleport:160,bucket:8,waypoint:.15,sidestep:[0,.65,-.65,1.2,-1.2],part:3,stride:.3,wake:1,squeeze:[.4,1,2,0],road:1.45,jam:1.5,cadence:9,body:1,leash:[4,.6],menCentre:true,lead:[4,.6],wide:192,arrive:2,meetEdge:true,follow:{look:6,gap:1.5,gain:4,moving:2},headArrive:true,arriveWait:3,footing:true,
  about:{on:true,cos:-.7,leg:200,halt:.6,pass:6,side:1.2,look:16,slow:.7,most:20,loop:{on:true,gap:10,end:0,pace:.8,ease:1,margin:2}}};
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
const marchRoomK=row=>{const F=FORMS[mapForm(row.form)]||FORMS.line;return Math.max(1,marchBodyOf(row.type)/Math.min(F.gx,F.gy))};
const marchFootprints=(x0,y0,x1,y1)=>TOWNS.flatMap(t=>(t.lots||[]).filter(l=>l.st!=='ruined'&&l.k!=='field'&&l.k!=='pasture'&&l.x*TILE<x1&&l.y*TILE<y1&&(l.x+l.n)*TILE>x0&&(l.y+l.n)*TILE>y0).map(l=>{
  const b=opaqueBox(lotSprite(t,l)),h=Math.min(12,l.n*TILE*.3);return{x:l.x*TILE+b[0],y:l.y*TILE+Math.max(b[1],b[3]-h),w:b[2]-b[0]+1,h};
}));
/* (PATHS.footing; the owner, 2026-11-01: "make sure that you also make the buildings actually have hidden wall that cannot be walked
   by in the map (only certain part should be allowed like if this building is tall then you can partially walk behind with building
   sprite transparent") a building is solid on its ground plan alone: the parts of its model that stand on the ground (walls, towers,
   chimneys, fences' posts and rails, props; no roof, no eaves, no storey jettied out above), laid on the map as its picture is, so a
   man walks in the band its tall part covers on the screen, behind it, faded through it (gfx/depth.js). Every town's and estate's
   lot (gfx/structures.js lotSprite: its picture's corner at its lot's; a holding's centre its picture's foot, as before: lotFooting)
   and every site and camp you know of (siteSprite: at its point less its ax, ay); a gatehouse, a fence's gated run and what lies
   flat left open; as rects {x, y, w, h} (world px), each lot's kept on it, a site's on its picture, till its picture changes */
// (a model's footing on its own picture (px), kept on it: its faces (PX.model px.F, at the picture's offset: modelOffset) of each part
// whose foot is on the ground (z under foot px), a flat part's tops each (a fence's posts and rails, its gates open), any other's
// hull, filled on the picture's pixels and read back as rects (each row's runs, rows alike run together); a gatehouse (a part with
// a gate drawn on it: gate, its decal's kind) is no wall, one walks through it into a walled place, nor what lies flat (no more
// than low px high: a paved ring, a pool, a bed); a part with no top nor roof over it (a ring of wall, open within) only its walls'
// feet; gap: px of plan a fence's run may leave between its posts and rails and have no gate in it; null: no faces)
const MARCH_FOOT={foot:1.5,low:2,gate:/gate/i,gap:2.5};
function modelFooting(m){
  if(m._ft!==undefined)return m._ft;const F=m.px&&m.px.F,N=m.cell;if(!F||!N)return m._ft=null;const off=modelOffset(m);if(!off)return m._ft=null;const [ex,ey]=off;
  const parts=new Map();for(const f of F){if(!f.P)continue;const k=f.part||'';let p=parts.get(k);if(!p)parts.set(k,p={z:Infinity,top:-Infinity,flat:!!f.flat,gate:false,shut:false,fs:[]});
    if(f.cls!=='wall')p.shut=true;if(f.cls==='roof'||f.cls==='lip')continue;for(const q of f.P){if(q[2]<p.z)p.z=q[2];if(q[2]>p.top)p.top=q[2]}if(f.dec&&f.dec.some(d=>MARCH_FOOT.gate.test(d.kind)))p.gate=true;p.fs.push(f)}
  const mask=new Uint8Array(N*N),fill=pts=>{let y0=Infinity,y1=-Infinity,x0=Infinity,x1=-Infinity;for(const q of pts){if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1];if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0]}
    // (a sliver no pixel's middle falls in (a post, a rail, a wall's foot: the ground's depth is halved on the screen) takes the
    // pixels it touches)
    if(y1-y0<1||x1-x0<1){for(let y=Math.max(0,Math.floor(y0));y<=Math.min(N-1,Math.max(Math.floor(y0),Math.ceil(y1)-1));y++)for(let x=Math.max(0,Math.floor(x0));x<=Math.min(N-1,Math.max(Math.floor(x0),Math.ceil(x1)-1));x++)mask[y*N+x]=1;return}
    for(let y=Math.max(0,Math.floor(y0));y<=Math.min(N-1,Math.ceil(y1));y++){const cy=y+.5;let a=Infinity,b=-Infinity;
      for(let i=0;i<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%pts.length];if(ay<=cy&&by>cy||by<=cy&&ay>cy){const x=ax+(cy-ay)/(by-ay)*(bx-ax);if(x<a)a=x;if(x>b)b=x}}
      for(let x=Math.max(0,Math.round(a));x<=Math.min(N-1,Math.round(b)-1);x++)mask[y*N+x]=1}};
  // (a wall's foot: the line its points stand on, each pixel it passes)
  const foot=pts=>{let a=pts[0],b=pts[0],l=0;for(const q of pts)for(const r of pts){const d=Math.hypot(q[0]-r[0],q[1]-r[1]);if(d>l){l=d;a=q;b=r}}
    for(let k=0,n=Math.ceil(l*2)+1;k<=n;k++){const x=Math.floor(a[0]+(b[0]-a[0])*k/n),y=Math.floor(a[1]+(b[1]-a[1])*k/n);if(x>=0&&y>=0&&x<N&&y<N)mask[y*N+x]=1}};
  const G=q=>[q[0]+ex,q[1]+ey];
  // (a fence's run with a gate in it (its posts and rails a gap of more than MARCH_FOOT.gap px apart along it) left open whole: the
  // map's cells are coarser than a gate's few px, which would shut it, and a yard or a pen with it)
  const gated=p=>{const B=p.fs.map(f=>{let a=Infinity,b=-Infinity,c=Infinity,d=-Infinity;for(const q of f.P){if(q[0]<a)a=q[0];if(q[0]>b)b=q[0];if(q[1]<c)c=q[1];if(q[1]>d)d=q[1]}return[a,b,c,d]});
    let a=Infinity,b=-Infinity,c=Infinity,d=-Infinity;for(const q of B){a=Math.min(a,q[0]);b=Math.max(b,q[1]);c=Math.min(c,q[2]);d=Math.max(d,q[3])}const u=b-a>=d-c,I=B.map(q=>u?[q[0],q[1]]:[q[2],q[3]]).sort((x,y)=>x[0]-y[0]);
    let e=I.length?I[0][1]:0;for(const [x0,x1] of I){if(x0-e>MARCH_FOOT.gap*(u?1:PX.MODEL_CAMERA.depth))return true;if(x1>e)e=x1}return false};
  for(const p of parts.values()){if(p.z>MARCH_FOOT.foot||p.top-p.z<=MARCH_FOOT.low||p.gate)continue;if(p.flat){if(!gated(p))for(const f of p.fs)fill(f.P.map(G))}else if(p.shut)fill(marchHull(p.fs.flatMap(f=>f.P.map(G))));else for(const f of p.fs)foot(f.P.map(G))}
  // (only where the picture shows something: what stands covers its own ground on the screen, so none of it is a wall unseen)
  for(let i=0;i<N*N;i++)if(!m.mask[i])mask[i]=0;
  return m._ft=footRects(mask,N)}
// (a mask of N x N px read back as rects {x, y, w, h}: each row's runs, rows alike run together)
function footRects(mask,N){const out=[];let open=new Map();
  for(let y=0;y<=N;y++){const runs=new Map();if(y<N)for(let x=0;x<N;x++){if(!mask[y*N+x])continue;let e=x;while(e+1<N&&mask[y*N+e+1])e++;runs.set(x+','+e,[x,e]);x=e}
    const next=new Map();for(const [k,[x,e]] of runs){const r=open.get(k);if(r){r.h++;next.set(k,r)}else{const n={x,y,w:e-x+1,h:1};out.push(n);next.set(k,n)}}open=next}
  return out}
/* (PATHS.holding; the owner, 2026-11-02: "the holding walls is not correct because the unit can walk through it", drawing its solid
   as the walls' ground, about the lower three quarters of the citadel's picture, the gate in the front wall) a holding's centre's
   footing on its picture: its ground plan (the feet of every part standing on the ground, its gatehouse's too) filled whole, its
   courtyard with it (none walks in it: a holding is entered at its gate), swept up the picture by back of the plan's depth (its
   back walls as they stand on the screen), there only where the picture shows something; its gate (the feet of a part with a gate drawn
   on it, else the model's gate mark gate px wide) open from its front, gateIn px deep at least. A centre with no gate (no walled
   front: PX gateX): its ground parts, as any building's (modelFooting). Kept on the model */
const HOLD_FOOT={back:.5,gate:12,gateIn:8};
function holdFooting(m){
  if(m._hf!==undefined)return m._hf;const F=m.px&&m.px.F,N=m.cell,off=F&&N&&m.gateX!=null?modelOffset(m):null;if(!off)return m._hf=modelFooting(m);const [ex,ey]=off,K=HOLD_FOOT,ft=MARCH_FOOT.foot;
  const pts=[];let gx0=Infinity,gx1=-Infinity,gy0=Infinity,y0=Infinity,y1=-Infinity;
  for(const f of F){if(!f.P||f.cls==='roof'||f.cls==='lip'||f.flat)continue;const gate=f.dec&&f.dec.some(d=>MARCH_FOOT.gate.test(d.kind));
    for(const q of f.P){if(q[2]>ft)continue;const x=q[0]+ex,y=q[1]+ey;pts.push([x,y]);if(y<y0)y0=y;if(y>y1)y1=y;if(gate){if(x<gx0)gx0=x;if(x>gx1)gx1=x;if(y<gy0)gy0=y}}}
  if(pts.length<3)return m._hf=modelFooting(m);const E=(y1-y0)*K.back,H=marchHull(pts.concat(pts.map(([x,y])=>[x,y-E]))),mask=new Uint8Array(N*N);
  for(let y=0;y<N;y++){const cy=y+.5;let a=Infinity,b=-Infinity;
    for(let i=0;i<H.length;i++){const [ax,ay]=H[i],[bx,by]=H[(i+1)%H.length];if(ay<=cy&&by>cy||by<=cy&&ay>cy){const x=ax+(cy-ay)/(by-ay)*(bx-ax);if(x<a)a=x;if(x>b)b=x}}
    for(let x=Math.max(0,Math.round(a));x<=Math.min(N-1,Math.round(b)-1);x++)if(cy>=y0||m.mask[y*N+x])mask[y*N+x]=1}
  if(!(gx1>gx0)){const g=m.marks&&m.marks.gate;gx0=(g?g[0]:N/2)-K.gate/2;gx1=gx0+K.gate;gy0=y1}
  for(let y=Math.max(0,Math.floor(Math.min(gy0,N-K.gateIn)));y<N;y++)for(let x=Math.max(0,Math.floor(gx0));x<Math.min(N,Math.ceil(gx1));x++)mask[y*N+x]=0;
  return m._hf=footRects(mask,N)}
// (a picture's offset from its model's world points: a point (x, g, z) shows at (x + ex, g - z + ey); found by its pixels, each on
// a face whose box on the screen holds it: of the offsets (nearly) all of them agree on, the one whose faces themselves hold most)
function modelOffset(m){
  const I=m.px,F=I.F,N=m.cell,B=F.map(f=>{let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;for(const q of f.P){const y=q[1]-q[2];if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(y<y0)y0=y;if(y>y1)y1=y}return[x0,x1,y0,y1]});
  const W=8*N,vx=new Int32Array(2*W),vy=new Int32Array(2*W),px=[];
  for(let q=0;q<N*N;q++){const fi=I.fi[q];if(fi<0||!m.mask[q]||m.mask[q]>2)continue;const b=B[fi],X=q%N+.5,Y=Math.floor(q/N)+.5;px.push(q);
    for(let e=Math.ceil(X-b[1]);e<=Math.floor(X-b[0]);e++)if(e>-W&&e<W)vx[e+W]++;for(let e=Math.ceil(Y-b[3]);e<=Math.floor(Y-b[2]);e++)if(e>-W&&e<W)vy[e+W]++}
  if(!px.length)return null;const top=v=>{let m=0;for(const n of v)if(n>m)m=n;const out=[];for(let i=0;i<v.length&&out.length<12;i++)if(v[i]>=m*.97)out.push(i-W);return out},cx=top(vx),cy=top(vy);
  const inside=(f,X,Y,a,b)=>{const P=f.P;let s=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],c=(q[0]-p[0])*(Y-(p[1]-p[2]+b))-(q[1]-q[2]-p[1]+p[2])*(X-(p[0]+a));if(Math.abs(c)<1e-7)continue;const g=c>0?1:-1;if(s&&g!==s)return false;s=g}return true};
  const step=Math.max(1,Math.floor(px.length/300));let best=null,bn=-1;
  for(const a of cx)for(const b of cy){let n=0;for(let k=0;k<px.length;k+=step){const q=px[k];if(inside(F[I.fi[q]],q%N+.5,Math.floor(q/N)+.5,a,b))n++}if(n>bn){bn=n;best=[a,b]}}
  return best}
// (the convex hull of points [x, y]: monotone chain)
function marchHull(P){if(P.length<3)return P;const S=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];
  for(const p of S){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}
  for(let i=S.length-1;i>=0;i--){const p=S[i];while(hi.length>=2&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p)}
  hi.pop();lo.pop();return lo.concat(hi)}
// (a lot's footing on the map, kept on it with the picture it was read off; its picture's own foot (marchFootprints) where its model
// has no faces. A holding's centre's (PATHS.holding): its walls solid, its gate open (holdFooting; the world's ways shut its tiles:
// router.js holdShut); off, its picture's foot, as before)
function lotFooting(t,l){const s=lotSprite(t,l),X=l.x*TILE,Y=l.y*TILE,hold=l.k==='centre'&&PATHS.holding;if(l._ft&&l._ftS===s&&l._ftX===X&&l._ftY===Y&&l._ftH===hold)return l._ft;
  const f=l.k==='centre'?(hold?holdFooting(lotModel(t,l)):null):modelFooting(lotModel(t,l));l._ftS=s;l._ftX=X;l._ftY=Y;l._ftH=hold;
  if(!f){const b=opaqueBox(s),h=Math.min(12,l.n*TILE*.3);return l._ft=[{x:X+b[0],y:Y+Math.max(b[1],b[3]-h),w:b[2]-b[0]+1,h}]}
  return l._ft=f.map(r=>({x:X+r.x,y:Y+r.y,w:r.w,h:r.h}))}
// (a site's or camp's model, as gfx/structures.js siteSprite makes it (its snow aside: the same shape))
function siteModel(s){const c=climAt(s.x,s.y),k=s instanceof BanditCamp?'bandit':SITE_KIND[s.type]?s.type:null;
  return k?PX.clusterModel({kind:SITE_KIND[k],seed:s.seed*131+7,env:c,snow:0}):PX.buildingModel({type:s.type,seed:s.seed,env:c,snow:0,glow:c==='desert'?'#e8c040':'#7fd8e8'})}
function siteFooting(s){const sp=siteSprite(s);if(!sp._ft)sp._ft=modelFooting(siteModel(s))||[];const X=s.x-sp.ax,Y=s.y+8-sp.ay;return sp._ft.map(r=>({x:X+r.x,y:Y+r.y,w:r.w,h:r.h}))}
// (every footing in the box x0..x1, y0..y1, world px: the lots standing there (not ruins, fields nor pastures), the sites you know of)
const marchFootings=(x0,y0,x1,y1)=>TOWNS.flatMap(t=>(t.lots||[]).filter(l=>l.st!=='ruined'&&l.k!=='field'&&l.k!=='pasture'&&l.x*TILE<x1&&l.y*TILE<y1&&(l.x+l.n)*TILE>x0&&(l.y+l.n)*TILE>y0).flatMap(l=>lotFooting(t,l)))
  .concat((W.sites||[]).filter(s=>s.known&&s.known()&&s.x>x0-96&&s.x<x1+96&&s.y>y0-96&&s.y<y1+96).flatMap(siteFooting));
// (what those footings are made of, in the box: each lot there, its state and its picture (structures.js lotSprite, the same one
// till it changes: its stage, level, walls, facing, a ruin), each site near, its picture while you know it; a grid made over them
// is stale when any differs (MarchGround fresh: a building raised, finished or burnt, a site found, change no world version))
function marchBlocksSig(x0,y0,x1,y1){const out=[];
  for(const t of TOWNS)for(const l of t.lots||[])if(l.x*TILE<x1&&l.y*TILE<y1&&(l.x+l.n)*TILE>x0&&(l.y+l.n)*TILE>y0)out.push(l,l.st,l.st==='ruined'||l.k==='field'||l.k==='pasture'?null:lotSprite(t,l));
  for(const s of W.sites||[])if(s.x>x0-96&&s.x<x1+96&&s.y>y0-96&&s.y<y1+96)out.push(s,s.known&&s.known()?siteSprite(s):null);return out}
// (a slid step, route.js routeSlide's: reused)
const MARCH_SLIDE=[0,0];
// (PATHS.corridor: the corridors made so far, each one's id; px from x, y to polyline pts (world px); whether man u's way p (its
// points after him) strays more than PATHS.stray px from pts anywhere along it, a point every few px)
const MARCH_COR={n:0},MARCH_ON=[0,0];// (MARCH_ON: marchOff's nearest point)
function marchOff(pts,x,y){let v=Infinity;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[i+1]||a,dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy,f=L?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/L)):0,px=a[0]+dx*f,py=a[1]+dy*f,d=Math.hypot(px-x,py-y);if(d<v){v=d;MARCH_ON[0]=px;MARCH_ON[1]=py}}return v}
function marchStrays(pts,u,p){let ax=u.x,ay=u.y;for(const q of p){const l=Math.hypot(q.x-ax,q.y-ay),n=Math.max(1,Math.ceil(l/4));for(let k=1;k<=n;k++)if(marchOff(pts,ax+(q.x-ax)*k/n,ay+(q.y-ay)*k/n)>PATHS.stray)return true;ax=q.x;ay=q.y}return false}
class MarchGround{
  constructor(o,units,pad=MARCH_MOVE.pad){
    const r=marchOuter(o),chunk=MARCH_MOVE.chunk,cs=MARCH_MOVE.cell,fly=o.mapKind==='monster'&&MONSTERS[o.id]?.mythic?.fly;this.fly=!!fly;
    this.x=Math.max(0,Math.floor((Math.min(o.x-r,...units.map(u=>u.x))-pad)/chunk)*chunk);this.y=Math.max(0,Math.floor((Math.min(o.y-r,...units.map(u=>u.y))-pad)/chunk)*chunk);
    const x1=Math.min(MW*TILE,Math.ceil((Math.max(o.x+r,...units.map(u=>u.x))+pad)/chunk)*chunk),y1=Math.min(MH*TILE,Math.ceil((Math.max(o.y+r,...units.map(u=>u.y))+pad)/chunk)*chunk);
    const g=this.grid=routeGrid(Math.max(1,Math.ceil((x1-this.x)/cs)),Math.max(1,Math.ceil((y1-this.y)/cs)),cs);this.version=WAYV;this.x1=x1;this.y1=y1;this.sig=marchBlocksSig(this.x,this.y,x1,y1);this.blocks=(PATHS.footing?marchFootings:marchFootprints)(this.x,this.y,x1,y1).filter(b=>b.x<x1&&b.y<y1&&b.x+b.w>this.x&&b.y+b.h>this.y);
    // (a ferry's way over the water: the cells within cs of its line; PATHS.clear, two cs, so a body has its room on it)
    const fw=cs*(PATHS.clear?2:1),ferries=WM.crossings.filter((c,i)=>c.kind==='ferry'&&!WM.graph?.closed[i]).map(c=>{const [x,y]=wayCentre(c.i),[tx,ty]=wayCentre(c.j);return{x,y,tx,ty}}).filter(f=>Math.max(f.x,f.tx)>=this.x-fw&&Math.min(f.x,f.tx)<=x1+fw&&Math.max(f.y,f.ty)>=this.y-fw&&Math.min(f.y,f.ty)<=y1+fw);
    // (the cells a building's footing reaches into: each block laid on the grid once, its cells those whose box it overlaps)
    const shut=this.foot=new Uint8Array(g.cost.length);if(!fly)for(const b of this.blocks){const c0=Math.max(0,Math.floor((b.x-this.x)/cs)),c1=Math.min(g.C-1,Math.ceil((b.x+b.w-this.x)/cs)-1),r0=Math.max(0,Math.floor((b.y-this.y)/cs)),r1=Math.min(g.R-1,Math.ceil((b.y+b.h-this.y)/cs)-1);
      for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const x=this.x+(c+.5)*cs,y=this.y+(r+.5)*cs;if(x+cs/2>b.x&&x-cs/2<b.x+b.w&&y+cs/2>b.y&&y-cs/2<b.y+b.h)shut[r*g.C+c]=1}}
    for(let i=0;i<g.cost.length;i++){const x=this.x+(i%g.C+.5)*cs,y=this.y+(Math.floor(i/g.C)+.5)*cs,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),k=ty*MW+tx;
      let open=WM.has(tx,ty)&&(fly||wayLand(k));if(!open&&tAt(tx,ty)===T_WATER)open=ferries.some(f=>{const dx=f.tx-f.x,dy=f.ty-f.y,d=dx*dx+dy*dy,t=clamp(((x-f.x)*dx+(y-f.y)*dy)/d,0,1);return Math.hypot(x-f.x-t*dx,y-f.y-t*dy)<fw});
      g.cost[i]=open&&!shut[i]?ROUTE.unit:0;
      if(!fly&&WM.has(tx,ty)){const edge=WM.edge[k];if(x%TILE<cs&&edge&4)g.wall[i]|=4;if(x%TILE>TILE-cs&&edge&1)g.wall[i]|=1;if(y%TILE<cs&&edge&8)g.wall[i]|=8;if(y%TILE>TILE-cs&&edge&2)g.wall[i]|=2}
    }
  }
  // (still true to the land: no world version since (terrain, a crossing shut, a holding's walls: router.js WAYV) and its buildings and
  // sites as they were (marchBlocksSig))
  fresh(){if(this.version!==WAYV)return false;const a=this.sig,b=marchBlocksSig(this.x,this.y,this.x1,this.y1);if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true}
  local(p){return{x:p.x-this.x,y:p.y-this.y}}
  world(p){return{x:p.x+this.x,y:p.y+this.y}}
  contains(p,pad=0){const g=this.grid;return p.x>=this.x+pad&&p.y>=this.y+pad&&p.x<this.x+g.C*g.cs-pad&&p.y<this.y+g.R*g.cs-pad}
  covers(p,pad){const g=this.grid,x1=this.x+g.C*g.cs,y1=this.y+g.R*g.cs;return p.x>=this.x+(this.x>0?pad:0)&&p.y>=this.y+(this.y>0?pad:0)&&p.x<x1-(x1<MW*TILE?pad:0)&&p.y<y1-(y1<MH*TILE?pad:0)}
  open(p){return this.contains(p)&&!!this.grid.cost[routeIx(this.grid,p.x-this.x,p.y-this.y)]}
  stand(p){return this.open(p)&&(this.fly||terrAt(p.x,p.y)!==T_WATER)}
  // (PATHS.clear: a man's (one with a type) half his body (marchBody), the room he keeps off walls; else, or one squeezing out of a
  // pocket (tight: MarchArmy step), none)
  body(p){return PATHS.clear&&p.type&&!p.tight?marchBody(p)/2:0}
  // (PATHS.clear: his room kept to the line's end (route.js lineRoom): no step, way or goal brings him nearer a wall than it, or than he is)
  clear(a,b){if(!this.contains(a)||!this.contains(b))return false;const g=this.grid,ax=a.x-this.x,ay=a.y-this.y,bx=b.x-this.x,by=b.y-this.y,r=this.body(a);return lineClear(g,ax,ay,bx,by)&&(!r||lineRoom(g,ax,ay,bx,by,r,false))}
  // (may man u walk straight to his goal q: clear; PATHS.clear, reckoned again only when he or it changes cell (u.sk: kept on him),
  // the room along it read once a cell)
  straight(u,q){if(!PATHS.clear)return this.clear(u,q);const g=this.grid,a=routeIx(g,u.x-this.x,u.y-this.y),b=routeIx(g,q.x-this.x,q.y-this.y),K=u.sk||(u.sk={g:null,v:0,a:-1,b:-1,ok:false});
    if(K.g===g&&K.v===g.v&&K.a===a&&K.b===b)return K.ok;K.g=g;K.v=g.v;K.a=a;K.b=b;return K.ok=this.clear(u,q)}
  // (PATHS.clear: px from p to the nearest shut cell (route.js routeGap: exact under r), and whether one of r keeps his room
  // there (routeNeed), or is no nearer a wall than at from)
  gap(p,r){return routeGap(this.grid,p.x-this.x,p.y-this.y,r)}
  roomy(p,r,from){if(!(r>0))return true;const g=this.grid,cl=routeRoom(g),i=routeIx(g,p.x-this.x,p.y-this.y);if(cl[i]-g.cs*.7072>=r)return true;const w=routeNeed(g,i,r),v=this.gap(p,w);return v>=w-1e-6||!!from&&v>=this.gap(from,w)-1e-6}
  // Keep blocked slots on the leader's connected ground; distinct nearby slots prevent a pile on a riverbank or building.
  snap(p,reach,reserved,inside){
    const g=this.grid,a=this.local(p),i=routeIx(g,a.x,a.y),rb=p.type?marchBody(p):MARCH_MOVE.gap+.2,space=q=>!reserved?.points?.some(v=>Math.hypot(v.x-q.x,v.y-q.y)<(rb+(v.r??rb))/2),at=j=>({x:this.x+(j%g.C+.5)*g.cs,y:this.y+(Math.floor(j/g.C)+.5)*g.cs}),ok=j=>g.cost[j]&&this.stand(at(j))&&(!reach||reach[j])&&(!reserved||!reserved.has(j))&&(!inside||inside(at(j)))&&space(at(j))&&(!rr||cl[j]>=routeNeed(g,j,rr)),keep=(q,j)=>{if(reserved){reserved.add(j);(reserved.points||(reserved.points=[])).push({...q,r:rb})}return q};// (a body's room kept round each goal taken: marchBody)
    // (PATHS.clear: a man's place where his body has its room off walls, the room his half needs: routeNeed)
    const rr=this.body(p),cl=rr?routeRoom(g):null;
    // (its own spot when there is a body's room there: never moved off it for another goal in the same cell, the cells smaller
    // than a body, or the slots would hop from cell to cell as the army moves)
    if(this.contains(p)&&this.stand(p)&&g.cost[i]&&(!reach||reach[i])&&(!inside||inside(p))&&space(p)&&this.roomy(p,rr))return keep({x:p.x,y:p.y},i);
    // (a body in the way, the leader's or another's: pushed straight out of it, just clear, so the place moves with the army rather
    // than hop to a cell's middle)
    {const v=reserved?.points?.find(v=>Math.hypot(v.x-p.x,v.y-p.y)<(rb+(v.r??rb))/2);if(v){const d=Math.hypot(p.x-v.x,p.y-v.y)||1,n=(rb+(v.r??rb))/2+.05,q={x:v.x+(p.x-v.x)/d*n,y:v.y+(p.y-v.y)/d*n},a=this.local(q),j=routeIx(g,a.x,a.y);
      if(this.contains(q)&&this.stand(q)&&g.cost[j]&&(!reach||reach[j])&&(!inside||inside(q))&&space(q)&&this.roomy(q,rr))return keep(q,j)}}
    const c0=i%g.C,r0=Math.floor(i/g.C);let best=-1,dist=Infinity;
    for(let k=0;k<Math.max(g.C,g.R)&&!(best>=0&&k*k>dist);k++)for(let r=Math.max(0,r0-k);r<=Math.min(g.R-1,r0+k);r++){
      const edge=r===r0-k||r===r0+k;for(let c=c0-k;c<=c0+k;c+=edge||k===0?1:2*k){if(c<0||c>=g.C)continue;const j=r*g.C+c,d=(c-c0)**2+(r-r0)**2;if(ok(j)&&d<dist){best=j;dist=d}}}
    if(best<0)return null;return keep(at(best),best);
  }
  reachable(p){const a=this.local(p),i=routeNear(this.grid,routeIx(this.grid,a.x,a.y));if(this.root!==i){this.root=i;this.reach=routeFlood(this.grid,i)}return this.reach}
  island(p){const q=this.local(p),i=routeNear(this.grid,routeIx(this.grid,q.x,q.y));this.islands||=[];let reach=this.islands.find(r=>r[i]);if(!reach){reach=routeFlood(this.grid,i);this.islands.push(reach)}return reach}
  path(a,b){const p=routePath(this.grid,a.x-this.x,a.y-this.y,b.x-this.x,b.y-this.y,{need:this.body(a)});return p.map(([x,y])=>({x:x+this.x,y:y+this.y}))}
  /* (PATHS.flow) the field toward (x, y) (world px) for bodies of half r (route.js routeFlow), one kept for each r and side (0 its
     front, 1 its rear: MarchArmy step), its room kept to each aim's end (strict: routeFlowAim): made again when the grid's version
     moves, its goal moves PATHS.move cells, or one of want (world points) is where it was not made out to; made: the fields made on
     this ground so far (each field's id the count it was made at) */
  flow(x,y,r,want,side=0){const g=this.grid,M=this.flows||(this.flows=new Map()),key=r*2+side,F0=M.get(key),lx=x-this.x,ly=y-this.y;
    let fresh=!F0||F0.v!==g.v||Math.hypot(F0.x-lx,F0.y-ly)>PATHS.move*g.cs;
    if(!fresh&&F0.lim<Infinity)for(const p of want)if(!(F0.D[routeIx(g,p.x-this.x,p.y-this.y)]<Infinity)){fresh=true;break}
    if(!fresh)return F0;const F=routeFlow(g,lx,ly,r,want.map(p=>routeIx(g,p.x-this.x,p.y-this.y)),F0);F.id=this.made=(this.made||0)+1;F.strict=true;M.set(key,F);return F}
  // (PATHS.corridor) the field along an army's corridor C (MarchArmy corridor) for bodies of half r, side 0 on down it, 1 back up it
  // (route.js routeFlowWay, its room kept to each aim's end: strict), one kept for each r and side till the corridor or the grid
  // changes or one of want (world points) is where it was not made out to; counted with the fields (made)
  flowWay(C,r,want,side){const g=this.grid,M=this.ways||(this.ways=new Map()),key=r*2+side,F0=M.get(key);let fresh=!F0||F0.v!==g.v||F0.cid!==C.id;
    if(!fresh&&F0.lim<Infinity)for(const p of want)if(!(F0.D[routeIx(g,p.x-this.x,p.y-this.y)]<Infinity)){fresh=true;break}
    if(!fresh)return F0;const F=routeFlowWay(g,C.loc,r,want.map(p=>routeIx(g,p.x-this.x,p.y-this.y)),F0,!!side);F.cid=C.id;F.id=this.made=(this.made||0)+1;F.strict=true;M.set(key,F);return F}
  // (PATHS.pull: a place on a building's footing (foot) pulled in toward its army's way (C: its corridor on this ground, the
  // nearest point of it), else its guide (gx, gy): the first spot along the way there one stands on, so it lies on that side of what
  // covers it; p itself elsewhere (water, a peak: snapped as ever))
  pull(p,C,gx,gy){if(!this.contains(p)||!this.foot[routeIx(this.grid,p.x-this.x,p.y-this.y)])return p;if(C&&C.ground===this){marchOff(C.pts,p.x,p.y);gx=MARCH_ON[0];gy=MARCH_ON[1]}
    for(let k=1;k<=10;k++){const q={x:p.x+(gx-p.x)*k/10,y:p.y+(gy-p.y)*k/10,type:p.type};if(this.stand(q))return q}return p}
  // (PATHS.smooth: man u's way w (MarchArmy step: u.plan) mended for his goal moved, no search: on this ground, he still walking
  // straight to its point he makes for, one of its points from there on reaching his goal straight with his room; the way to it
  // kept, his goal after it. False: searched afresh)
  mend(u,w){if(!w||w.ground!==this||!w.p.length)return false;const p=w.p,i=Math.min(w.i,p.length-1),q=u.goal;if(!this.clear(u,p[i]))return false;
    for(let k=p.length-1;k>=i;k--)if(this.clear({x:p[k].x,y:p[k].y,type:u.type},q)){p.length=k+1;if(p[k].x!==q.x||p[k].y!==q.y)p.push({x:q.x,y:q.y});w.goal=q;return true}
    return false}
  // (the point a man going down field F makes for (route.js routeFlowAim), world px: kept on him (u.fa) till he changes cell or the
  // field is made again; null where it does not reach him)
  flowAim(u,F){const g=this.grid,c=routeIx(g,u.x-this.x,u.y-this.y),A=u.fa||(u.fa={id:-1,c:-1,g:null,x:0,y:0,p:[0,0]});
    if(A.g!==g||A.id!==F.id||A.c!==c){const q=routeFlowAim(F,u.x-this.x,u.y-this.y,this.body(u),A.p);if(!q)return null;A.g=g;A.id=F.id;A.c=c;A.x=q[0]+this.x;A.y=q[1]+this.y}
    return A}
}
class MarchArmy{
  constructor(o){this.owner=o;this.face=this.heading=marchFacing(o);this.x=this.wx=this.gx=o.x;this.y=this.wy=this.gy=o.y;this.units=[];this.serial=0;this.time=0;this.key='';this.ground=null;
    this.trail=new MarchTrail();this.col=false;this.forming=null;this.about=false;this.fillFace=this.face;this.fillT=SLOTFILL.march.every;this.fillDue=false;this.fillOff=null;this.midSpread=0;
    // (about face, MARCH_MOVE.about: turned, its order the other way round; leg, px gone since; since, px since its column last turned;
    // reorder, its order coming back ({t: s so far}); loop, its countermarch (MarchLoop); loopNo, no room for one at this halt)
    this.turned=false;this.leg=0;this.since=Infinity;this.reorder=null;this.loop=null;this.loopNo=false}
  // (a true jump, o put at x, y (a gate, a load, a battle's end): its army re-placed round it at its next step)
  static jump(o,x,y){o.x=x;o.y=y;const a=MARCH_ARMIES.get(o);if(a)a.jumped=true}
  static of(o){let a=MARCH_ARMIES.get(o);if(a&&Math.hypot(o.x-a.x,o.y-a.y)>MARCH_MOVE.teleport){MARCH_ARMIES.delete(o);a=null}if(!a){a=new MarchArmy(o);MARCH_ARMIES.set(o,a);a.sync()}return a}
  static spread(o){const a=MARCH_ARMIES.get(o);return a&&Math.hypot(o.x-a.x,o.y-a.y)<=MARCH_MOVE.teleport?Math.max(0,...a.units.map(u=>Math.hypot(u.x-o.x,u.y-o.y)+3)):0}
  relocate(x,y){
    const dx=x-this.owner.x,dy=y-this.owner.y;this.owner.x=x;this.owner.y=y;this.x+=dx;this.y+=dy;this.ground=null;this.mid=null;
    for(const u of this.units){u.x+=dx;u.y+=dy;if(u.goal){u.goal.x+=dx;u.goal.y+=dy}u.plan=null;u.walking=false}
  }
  // (its column, if it marches in one now (marchstyles.js TravelStyle), the other way round while turned; none while it turns about
  // (MARCH_MOVE.about off), re-forming to go back the way it came)
  colOf(){if(this.about)return null;const c=marchLayout(this.owner).column;if(c&&c.back!==this.turned)c.flip();return c}
  targets(){
    // (a column: along its guide's trail, else back the way it goes; looping, round its oval)
    const o=this.owner,col=this.colOf();if(col){const T=col.lay(this.trail,MARCH_MOVE.menCentre?this.gx:o.x,MARCH_MOVE.menCentre?this.gy:o.y,this.heading);if(this.loop?.col===col)this.loop.place(T);return T}
    const f=this.layFace(),co=Math.cos(f),si=Math.sin(f),out=[];
    for(const row of this.rows){
      const x=o.x+row.x*co-row.y*si,y=o.y+row.x*si+row.y*co,slots=marchSlots(row,f+(row.face||0));
      slots.forEach(([sx,sy],i)=>out.push({row:row.id,index:i,type:row.type,character:row.character,x:x+sx/WORLD_BATTLE.scale,y:y+sy/WORLD_BATTLE.scale}));
    }return out;
  }
  // (the middle that a member of row id standing at p puts the army at: his row's place turned to its facing, taken off)
  // (the facing its places are laid by: its own; turned (about face), the other way: its whole layout as it stood, each man where he
  // stands, its order the other way round as it goes)
  layFace(){return this.turned?this.face+Math.PI:this.face}
  middleOf(id,p){const r=(this.rows||marchRows(this.owner)).find(r=>r.id===id),f=this.layFace(),co=Math.cos(f),si=Math.sin(f);return r?{x:p.x-(r.x*co-r.y*si),y:p.y-(r.x*si+r.y*co)}:{x:p.x,y:p.y}}
  // (its men to its rows: only when they are made again (marchLayout) or a man has fallen)
  sync(){
    const rows=marchRows(this.owner),dead=this.units.some(u=>u.dead);if(rows===this.rows&&!dead)return;this.rows=rows;const key=JSON.stringify(rows);if(key===this.key&&!dead)return;this.key=key;
    const targets=this.targets(),old=this.units.filter(u=>!u.dead),used=new Set(),units=[],pick=SLOTFILL.on?this.pick(targets,old):null;
    this.ground=new MarchGround(this.owner,old);this.refresh=this.time+MARCH_MOVE.refresh;const g=this.ground,reach=g.reachable(this.owner),reserved=new Set();
    for(let k=0;k<targets.length;k++){const p=targets[k];let u=pick&&!p.character?pick[k]:old.find(u=>!used.has(u)&&u.row===p.row&&u.type===p.type);if(u){used.add(u);reserved.add(routeIx(g.grid,u.x-g.x,u.y-g.y))}else{const q=g.snap(p,reach,reserved)||g.snap(this.owner,null,reserved);if(!q)continue;u={id:++this.serial,x:q.x,y:q.y,walk:0,walking:false};}
      Object.assign(u,{row:p.row,index:p.index,type:p.type,character:p.character,goal:{x:p.x,y:p.y},plan:null});units.push(u)}this.units=units;
    this.carrier=units.find(u=>u.row==='leader'||u.row==='hero')||units[0]||null;// (its leader's marcher (yours: your hero): your badges over him, render.js heroTagAt)
    this.fillFace=this.face;this.fillOff=null;
  }
  // (SLOTFILL, core/assign.js: each of targets its man of old, group by group, by the least walking in all (a man fallen: the rest
  // close the gap); null where none is left (a new man there). A character's: none here (sync: his own, as before))
  pick(targets,old){const out=new Array(targets.length).fill(null),by=new Map();
    targets.forEach((p,k)=>{if(p.character)return;let a=by.get(p.row);if(!a)by.set(p.row,a=[]);a.push(k)});
    for(const [row,ks] of by){const type=targets[ks[0]].type,men=old.filter(u=>u.row===row&&u.type===type).sort((a,b)=>a.id-b.id),F=fillRoom(Math.max(men.length,ks.length));
      men.forEach((u,i)=>{F.mx[i]=u.x;F.my[i]=u.y});ks.forEach((k,j)=>{F.px[j]=targets[k].x;F.py[j]=targets[k].y});assignSlots(men.length,ks.length);men.forEach((u,i)=>{if(F.out[i]>=0)out[ks[F.out[i]]]=u})}
    return out}
  // (SLOTFILL, core/assign.js: its men's places shared out again within each of its groups (their characters keep theirs) by the
  // least walking in all, each man the index of the place he is given; force: whenever that is less (its column formed or
  // broken), else only when it saves SLOTFILL.march.gain px of walking (men out of order on the march). Any changed: their goals
  // made afresh, and its outline (MarchOutline leap). Its point never moves with a share (the same places, its men only traded among
  // them): where its men put it by their new places is off where they put it by their old by fillOff, given back as they walk to
  // them (middle). col: in its column. Its buffers kept: MARCH_FILL, core/assign.js FILL)
  refill(targets,force,col=false){const M=MARCH_FILL,F=fillRoom(targets.length),at=new Map(targets.map(p=>[p.row+':'+p.index,p])),was=this.middle(at,col);let changed=false;
    for(const row of this.rows){if(row.character)continue;const men=M.men,ix=M.ix,of=M.of;men.length=ix.length=of.length=0;
      for(const u of this.units)if(!u.dead&&u.row===row.id)men.push(u);if(men.length<2)continue;men.sort((a,b)=>a.id-b.id);
      let k=0;for(const p of targets)if(p.row===row.id){F.px[k]=p.x;F.py[k]=p.y;ix[k]=p.index;of[p.index]=k;k++}const n=men.length;if(n>k)continue;
      for(let i=0;i<n;i++){const u=men[i];F.mx[i]=u.x;F.my[i]=u.y;M.cur[i]=of[u.index]??-1}
      let was=0,bad=false;for(let i=0;i<n;i++){const j=M.cur[i];if(j<0)bad=true;else was+=fillCost(i,j)}const now=assignSlots(n,k);
      if(!bad&&(force?now>=was-1e-9:fillWalk(n,F.out)>=fillWalk(n,M.cur)-SLOTFILL.march.gain))continue;
      for(let i=0;i<n;i++)if(F.out[i]>=0&&men[i].index!==ix[F.out[i]]){men[i].index=ix[F.out[i]];changed=true}}
    if(changed){this.goalGround=null;if(this.ring)this.ring.leap=true;this.fillOff=null;const now=this.middle(at,col),w=this.midSpread;this.fillOff=w>0?{x:was.x-now.x,y:was.y-now.y,w,k:1}:null}
    return changed}
  // (when it shares them out again: a column formed or broken (fillDue: whenever that is less walking); its places turned
  // SLOTFILL.march.turn since the last time (none in a column: its places go by its trail) and every SLOTFILL.march.every s while
  // it marches, when it saves SLOTFILL.march.gain px (no share for a px or two: its middle, where its men put it, kept steady))
  fillStep(targets,d,moved,col){const S=SLOTFILL.march,turned=!col&&Math.abs(Math.atan2(Math.sin(this.face-this.fillFace),Math.cos(this.face-this.fillFace)))>=S.turn;this.fillT-=d;
    if(this.fillDue||turned){this.fillFace=this.face;this.fillT=S.every;this.refill(targets,this.fillDue,!!col);this.fillDue=false}
    else if(this.fillT<=0&&moved>.001){this.fillT=S.every;this.refill(targets,false,!!col)}}
  // ---- its grid (MarchGround), its lifetime alone (a code review, 2026-11-03: made apart from the step, as it was): made afresh on a
  // jump (no men in it); made again when the land under it changed (fresh), the army or one of its men stands off it, or, while
  // any of its men is still making for his place, its timer is up (MARCH_MOVE.refresh: an army settled, every man at rest in his
  // place or given up, keeps its grid; a code review found standing armies making theirs again every 2 s); menCentre (C): men on ground its middle's does not reach in its box (across a river, the bridge or the ford past its edge: a
  // battle's end), its box made MARCH_MOVE.wide px wider round them, so their way round is in it, while they are so (split). Returns
  // what its middle reaches
  groundStep(o,jump,C){
    if(jump)this.ground=new MarchGround(o,[]);
    if(!this.ground||!this.ground.fresh()||this.time>=(this.refresh||0)&&this.units.some(u=>!u.dead&&!u.rest)||!this.ground.covers(o,marchOuter(o)+8)||!jump&&this.units.some(u=>!this.ground.covers(u,8))){this.ground=new MarchGround(o,jump?[]:this.units,C&&this.split?MARCH_MOVE.wide:MARCH_MOVE.pad);this.refresh=this.time+MARCH_MOVE.refresh}
    let reach=this.ground.reachable(o);if(C){const g=this.ground,off=this.units.some(u=>!u.dead&&!reach[routeIx(g.grid,u.x-g.x,u.y-g.y)]);if(off&&!this.split){this.split=true;this.ground=new MarchGround(o,this.units,MARCH_MOVE.wide);this.refresh=this.time+MARCH_MOVE.refresh;reach=this.ground.reachable(o)}else if(!off)this.split=false}
    return reach}
  step(d,sync=true,bounds=null,inside=null){
    if(!(d>0))return;const o=this.owner,C=MARCH_MOVE.menCentre,ox0=o.x,oy0=o.y;if(Math.hypot(o.x-this.x,o.y-this.y)>MARCH_MOVE.teleport){MARCH_ARMIES.delete(o);MarchArmy.of(o);return}
    if(sync)this.sync();this.time+=d;
    // (the owner, 2026-11-01: "why don't you calculate the center based on unit's position": menCentre) the army is where its men
    // are: its owner's x, y are its men's middle, written back at the end of each step; what moves it (a brain, your march, a test)
    // moves its guide (gx, gy), round which its men's places are laid. Moved since the last step by one of them (the march guides
    // system gives the guide back first), the guide goes so far; put where it stands with its men (relocate, settle, a battle's
    // end), the guide there; a jump (flagged: MarchArmy.jump, or a move while it was not marched: out of a holding, a camp, out of
    // range; or one between moments, march guides; or one past its own ring in a moment, as no march goes), every man re-placed
    // round it
    // (forming: a column forming or breaking up, its guide goes k of the way it is moved: TRAVEL_STYLES.column.slow)
    const F=TRAVEL_STYLES.column,AF=MARCH_MOVE.about;let jump=false,dx=o.x-this.x,dy=o.y-this.y;if(C){jump=this.jumped||this.idle&&(dx||dy)||Math.hypot(dx,dy)>marchOuter(o);const placed=!this.lent&&(this.x!==this.wx||this.y!==this.wy);this.jumped=this.idle=this.lent=false;
      if(jump||placed){dx=dy=0;this.gx=o.x;this.gy=o.y;this.trail.clear()}else{const k=this.forming?this.forming.k:this.reorder?AF.slow:1;dx*=k;dy*=k;this.gx+=dx;this.gy+=dy}o.x=this.gx;o.y=this.gy}
    // (a column whose head turns back on its own way (more than about: cos of the turn) turns about: its file where it stands, its
    // tail the head (MARCH_MOVE.about, aboutColumn); else (off, or that would not do) as an army does: out of its column, formed
    // round its middle, then into a new one the way it now goes (forming, below); never its van back down its file)
    if(!marchLayout(o).column||jump)this.about=false;else if(this.col&&!this.about&&C&&Math.hypot(dx,dy)>.05){const T=this.trail,hx=this.gx-dx,hy=this.gy-dy;
      for(let k=0;k<Math.min(3,T.n);k++){const j=T.at(k),fx=hx-T.x[j],fy=hy-T.y[j],f=Math.hypot(fx,fy);if(f<2)continue;if((dx*fx+dy*fy)/(Math.hypot(dx,dy)*f)<F.about&&!(AF.on&&this.aboutColumn(dx,dy)))this.about=true;break}}
    const col=this.colOf();
    // (into a column or out of one (marchstyles.js TravelStyle): its men walk to their new places at their own pace, forming till
    // most stand in them (below); out of one, it forms round the column's middle, its guide put there; a jump: at once. Either way
    // into its own order (not turned))
    if(!!col!==this.col){this.col=!!col;this.goalGround=null;this.turned=false;this.reorder=null;this.loop=null;this.forming=jump?null:{t:0,k:F.slow[col?0:1]};if(!col&&C&&!jump){dx=dy=0;o.x=this.gx=this.wx;o.y=this.gy=this.wy}if(!jump&&SLOTFILL.on)this.fillDue=true;else if(col&&!jump)this.fileIn()}
    if(col)this.trail.room(col.len+F.leap);
    const moved=Math.hypot(dx,dy),to=moved>.001?(this.heading=Math.atan2(dy,dx)):this.heading;
    // (looping (MARCH_MOVE.about.loop): sent on, a jump, or its column made afresh, the loop stops, its order as it stands)
    if(moved>.001)this.loopNo=false;if(this.loop&&(jump||moved>.001||this.loop.col!==col))this.loopEnd(false);
    // (a march formation sent more than about round (MARCH_MOVE.about): about face, its facing the new way at once; its guide (a lead
    // ahead of its men the old way) put at its men's middle, so its places are where they stand, going on the new way from there)
    if(AF.on&&!col&&!jump&&moved>.001&&Math.cos(to-this.face)<AF.cos){this.face+=Math.PI;this.turnAbout();if(C){o.x=this.gx=this.wx+dx;o.y=this.gy=this.wy+dy}}
    const gap=Math.atan2(Math.sin(to-this.face),Math.cos(to-this.face));this.face+=clamp(gap,-MARCH_MOVE.turn*d,MARCH_MOVE.turn*d);this.x=o.x;this.y=o.y;
    // (turned: its own order back once it has gone leg px the new way, or its guide has stood halt s; a column's by its loop instead
    // (below), at a halt)
    this.since+=moved;if(this.turned){this.leg+=moved;if((!AF.loop.on||!col)&&(this.leg>=AF.leg||moved<=.001&&(this.still||0)+d>=AF.halt))this.reorderStart(col)}
    if(jump){this.fillOff=null;this.turned=false;this.reorder=null}
    let reach=this.groundStep(o,jump,C);
    // (each man his march pace; menCentre: the army's own step this moment, at least that, at most road times it: its step how far
    // its guide went over the time since it last moved, at most a mid tier's moment (worldobject.js WORLD_LOD: such a one steps
    // every few frames, its whole step at once). Without: the army's step, its road with it, a leap past it no march)
    const nav=this.ground,walk=moveStep(marchPace(o),d,!B?.world);let step;
    // (turned, its column halted halt s, its men in their places (within place px: TRAVEL_STYLES.column; or most s gone): its loop
    // (MARCH_MOVE.about.loop), if there is room; its pace up over ease s, each man's place on by as far as he trails one going so,
    // braking for it (b × his kind's t: as below); half round, the chosen order)
    // (formGiveUp: a loop not round in formTry s more than its own time stops, its order as it stands, none tried again at this halt)
    if(this.loop){const L=this.loop,V=walk/d,v=L.speed(V*AF.loop.pace,V)*Math.min(1,(L.t+=d)/AF.loop.ease);L.b=v*v/(1.2*V);if((L.u+=v*d)>=L.half)this.loopEnd(true);
      else if(MARCH_MOVE.formGiveUp&&L.t>MARCH_MOVE.formTry+AF.loop.ease+L.half/Math.max(1e-6,L.speed(V*AF.loop.pace,V))){this.loopEnd(false);this.loopNo=true}}
    else if(AF.loop.on&&this.turned&&col&&!jump&&!this.forming&&!this.loopNo&&moved<=.001&&(this.still||0)+d>=AF.halt&&((this.still||0)>=AF.most||this.units.every(u=>u.dead||!u.goal||Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<=F.place)))this.loopStart(col,nav);
    const reserved=new Set(),targets=this.targets(),blocked=[],FT=MARCH_MOVE.formGiveUp?this.formWatch(jump,moved,C?this.gx:o.x,C?this.gy:o.y):null;this.queries=0;this.fields=0;if(SLOTFILL.on&&!jump&&!(FT&&FT.done))this.fillStep(targets,d,moved,col);
    if(C){const span=Math.min(d*WORLD_LOD.midEvery,d+(this.still||0));step=Math.max(walk,Math.min(moved*d/span,walk*MARCH_MOVE.road))*MARCH_MOVE.catchup;this.still=moved>.001?0:(this.still||0)+d;
      // (a jump: each man at his place round it (as a new man is set, sync); then any man on shut ground (a building's feet: put
      // there by a battle) put on the nearest open ground its middle's reaches, so none stands on a building or is left behind it)
      if(jump){const at=new Map(targets.map(p=>[p.row+':'+p.index,p])),kept=new Set();for(const u of this.units){const p=at.get(u.row+':'+u.index),q=p&&(nav.snap(p,reach,kept)||nav.snap(o,null,kept));if(q){u.x=q.x;u.y=q.y}u.goal=null;u.plan=null;u.vel=0;u.hd=this.face;u.walking=false}this.goalGround=null}
      for(const u of this.units)if(!nav.open(u)){const q=nav.snap({x:u.x,y:u.y,type:u.type},reach);if(q){u.x=q.x;u.y=q.y;u.plan=null}}}
    else{step=(moved>walk&&moved<=walk*MARCH_MOVE.road?moved:walk)*MARCH_MOVE.catchup}
    // (each man in his bucket of cell px, keyed by its column × 65536 + its row: no strings made, the same order)
    const buckets=new Map(),cell=MARCH_MOVE.bucket,key=(x,y)=>Math.floor(x/cell)*65536+Math.floor(y/cell),put=u=>{const k=key(u.x,u.y);let a=buckets.get(k);if(!a)buckets.set(k,a=[]);a.push(u);u.bucket=k};this.units.forEach(put);
    const near=u=>{const out=[],cx=Math.floor(u.x/cell),cy=Math.floor(u.y/cell);for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){const a=buckets.get(x*65536+y);if(a)for(let i=0;i<a.length;i++)out.push(a[i])}return out};
    const wanted=new Map(targets.map(p=>[p.row+':'+p.index,p])),requests=[],sameGoals=!!(FT&&FT.done&&moved<=.001)||this.goalGround===nav&&this.goalX===o.x&&this.goalY===o.y&&this.goalFace===this.face&&this.goalRoster===this.key&&this.goalBounds===bounds&&!this.forming&&!this.reorder&&!this.loop;
    this.goalGround=nav;this.goalX=o.x;this.goalY=o.y;this.goalFace=this.face;this.goalRoster=this.key;this.goalBounds=bounds;
    // (formGiveUp: given up, standing, its men's places kept as they are, so none chases a middle that drifts as its men stand)
    // (a man's own way asked for when he has none, or it is old (MARCH_MOVE.repath) or for a goal a cell off; PATHS.smooth: mended
    // instead where it can be (MarchGround mend), no search; one stuck (rescue) searches afresh)
    const ask=u=>{const w=u.plan;if(!w||w.ground!==nav||this.time>=w.at||Math.hypot(w.goal.x-u.goal.x,w.goal.y-u.goal.y)>nav.grid.cs){if(PATHS.smooth&&u.rescue!==1&&nav.mend(u,w))w.at=this.time+MARCH_MOVE.repath+u.id%7*.025;else{u.needAt??=this.time;requests.push(u)}}};
    if(marchCentrePiece(o))(reserved.points=[]).push(...marchCart(o,col?{x:col.cx,y:col.cy}:o));// (a caravan's wagon, ox and drover stand there: no goal on them)
    // (a column forming on the march: a man ahead of his place along its way holds his ground there, beside it, till his place comes
    // up to him (falling in), rather than walk back to it)
    // (its order coming back after an about face (reorder, MARCH_MOVE.about): one well ahead of his place stands aside while it
    // marches, his place coming back to him: a formation's out past its flank on his side (wide: px its places reach to a side;
    // aside: his px to the side there, set as he steps out, so its men keep their spacing), a column's beside its file (behind his,
    // hastening up beside it: MarchColumn pass; halted, one ahead walking back down beside it); over when none is)
    const hold=!!col&&!!this.forming&&moved>.001,H=MARCH_HOLD,R=this.reorder,marching=(this.still||0)<AF.halt,fx=Math.cos(this.face),fy=Math.sin(this.face);let off=0,wide=0;
    const pull=PATHS.corridor&&PATHS.pull&&!col&&marching&&!!this.cor&&this.cor.ground===nav;
    if(R&&!col)for(const p of targets)wide=Math.max(wide,Math.abs((p.y-o.y)*fx-(p.x-o.x)*fy));
    for(const u of this.units){u.walkT=Math.max(0,(u.walkT||0)-d);u.walking=u.walkT>0;const p=wanted.get(u.row+':'+u.index);u.tg=p;if(!sameGoals){const at=routeIx(nav.grid,u.x-nav.x,u.y-nav.y),local=reach[at]?reach:nav.island(u);let q=p;
        if(R&&p){let on=false;if(col)on=col.pass(u.x,u.y,p,marching,u.held,H);
          else if(marching&&(u.x-p.x)*fx+(u.y-p.y)*fy>(u.held?1:AF.pass)){const s=(u.x-o.x)*fx+(u.y-o.y)*fy,l=(u.y-o.y)*fx-(u.x-o.x)*fy;if(!u.held||u.aside==null)u.aside=l+(l<0?-1:1)*(wide+marchBody(u)*(.5+AF.side));
            H.x=o.x+fx*s-fy*u.aside;H.y=o.y+fy*s+fx*u.aside;on=true}
          if(on){H.type=p.type;q=H;off++}}
        else if(hold&&p){const a=(u.x-p.x)*p.hx+(u.y-p.y)*p.hy;if(a>0){H.x=p.x+p.hx*a;H.y=p.y+p.hy*a;H.type=p.type;q=H}}u.held=q===H;
        // (a formation's man standing aside for his order (reorder) keeps no room: else another's place where he stands carries him on)
        // (PATHS.pull: on the march past what its corridor goes round, a place on a building's footing pulled in toward its corridor,
        // MarchGround pull: no man sent round the far side of it for his place)
        if(q&&pull&&q!==H)q=nav.pull(q,this.cor,C?this.gx:o.x,C?this.gy:o.y);
        u.goal=q&&nav.snap(bounds?{...bounds(q),type:q.type}:q,local,R&&!col&&q===H?null:reserved,inside)}if(!u.goal)continue;
      // (formGiveUp: one given up looks for no way)
      if(u.gave){u.plan=null;u.flow=null;u.straight=false;delete u.needAt;continue}
      // (PATHS.slide: one within PATHS.near px of his place, his way only grazing a wall (through no shut cell), walks straight at it,
      // sliding along the wall, no way laid; stuck so (rescue), he asks one)
      u.straight=nav.straight(u,u.goal)||PATHS.slide&&!u.rescue&&Math.hypot(u.goal.x-u.x,u.goal.y-u.y)<PATHS.near&&lineClear(nav.grid,u.x-nav.x,u.y-nav.y,u.goal.x-nav.x,u.goal.y-nav.y);if(u.straight){u.plan=null;u.flow=null;delete u.needAt;continue}
      if(PATHS.flow&&!u.rescue){blocked.push(u);continue}
      ask(u)}
    if(R){R.t+=d;if(!off||R.t>=AF.most)this.reorder=null}
    // (PATHS.flow: those whose straight way is blocked go down the army's field toward its guide (MarchGround flow, one for each
    // body's room), each to his own place from where his straight way opens; one whose place lies no nearer the guide by the ground
    // than he does (ahead of it, round a wall from it), or one stuck (rescue), asks a way of his own, as before)
    let cor=null;
    if(blocked.length){const by=new Map(),g=nav.grid,n0=nav.made||0,gx=C?this.gx:o.x,gy=C?this.gy:o.y;let front=0,back=0;for(const p of targets){const k=(p.x-gx)*fx+(p.y-gy)*fy;if(k>front)front=k;if(k<back)back=k}
      for(const u of blocked){const r=nav.body(u);let a=by.get(r);if(!a)by.set(r,a=[]);a.push(u)}
      // (PATHS.corridor, on the march: the army's way first (corridor), then its men: each down its field on along it, his place
      // further along it than he leads in (S), else back up it; one neither reaches asks his own way, as before. Halted, they fan out
      // to their places by the fields and ways as before)
      if(PATHS.corridor&&marching){cor=this.corridor(nav,gx,gy,fx,fy,back,front,Router.ahead(o,ox0,oy0)||(o===P&&P.tx!=null?[[P.tx,P.ty]]:null));
        for(const [r,a] of by){const want=a.flatMap(u=>[u,u.goal]),F=nav.flowWay(cor,r,want,0);let F2=null;
          for(const u of a){const me=routeIx(g,u.x-nav.x,u.y-nav.y),q=routeIx(g,u.goal.x-nav.x,u.goal.y-nav.y);u.cf=null;
            if(F.D[me]<Infinity&&F.D[q]<Infinity){u.cf=F;if(F.S[q]<=F.S[me]){u.flow=F;delete u.needAt;continue}F2=F2||nav.flowWay(cor,r,want,1);if(F2.D[me]<Infinity){u.flow=F2;delete u.needAt;continue}}
            u.flow=null;ask(u)}}
        by.clear()}
      // (its goals: its front, its foremost place's reach ahead of its guide as it faces, so the places of those trailing theirs lie
      // nearer it than they do; for those its way does not lead (ahead of their places, or one round a wall from his), its rear; a man's
      // own way kept meanwhile, to be mended should he need it again)
      const down=(F,u)=>{const me=F.D[routeIx(g,u.x-nav.x,u.y-nav.y)];return me<Infinity&&F.D[routeIx(g,u.goal.x-nav.x,u.goal.y-nav.y)]<me};
      for(const [r,a] of by){let rest=[];const F=nav.flow(gx+fx*front,gy+fy*front,r,a.flatMap(u=>[u,u.goal]),0);for(const u of a){if(down(F,u)){u.flow=F;delete u.needAt}else rest.push(u)}
        if(rest.length){const F2=nav.flow(gx+fx*back,gy+fy*back,r,rest.flatMap(u=>[u,u.goal]),1);rest=rest.filter(u=>{if(!down(F2,u))return true;u.flow=F2;delete u.needAt;return false})}
        for(const u of rest){u.flow=null;ask(u)}}
      this.fields+=(nav.made||0)-n0}
    // (PATHS.corridor: on the march a man's own way taken only while it keeps within PATHS.stray px of the army's, else down its field,
    // if it reaches him; halted (re-forming: its men fan out to their places) or stuck (rescue), his own)
    requests.sort((a,b)=>a.needAt-b.needAt||a.id-b.id);for(const u of requests.slice(0,MARCH_MOVE.queries)){this.queries++;if(u.rescue)u.rescue=2;const p=nav.path(u,u.goal);delete u.needAt;
      const cf=PATHS.corridor&&marching&&!u.rescue&&u.cf&&this.cor&&u.cf.cid===this.cor.id?u.cf:null;if(cf&&marchStrays(this.cor.pts,u,p)){u.flow=cf;u.plan=null;continue}
      u.plan={ground:nav,p,i:0,goal:u.goal,at:this.time+MARCH_MOVE.repath+u.id%7*.025}}
    for(const u of this.units){u.squeeze=false;const goal=u.goal,gd=goal?Math.hypot(goal.x-u.x,goal.y-u.y):0;if(!goal||gd<=MARCH_MOVE.settle){u.rest=!!goal;continue}
      // (formGiveUp: one given up stands where he is, at rest)
      if(u.gave){u.rest=true;u.vel=0;continue}if(u.rest&&moved<=.001&&!this.loop&&gd<MARCH_MOVE.wake&&(!C||Math.abs(gap)<1e-3))continue;u.rest=false;
      // (PATHS.slide: one held by a wall (his step met one within PATHS.stuck s: u.wt; not a column's on the march, along its way),
      // who has gone no more than half PATHS.back px
      // in PATHS.stuck s, his place still off, asks a way of his own
      // first (rescue: no field, his search before the others'), then, still held, squeezes (tight: no room kept off walls, as before
      // PATHS.clear) till he has gone on, then steps back PATHS.back px off the wall nearest him (or back from his heading); held so
      // on ground his army's middle does not reach (a pocket the buildings shut him in), he is put on the nearest it does (no man
      // may freeze); one going on again is let be)
      if(PATHS.slide){const k=u.pk||(u.pk={x:u.x,y:u.y,t:0,n:0});if(Math.hypot(u.x-k.x,u.y-k.y)>PATHS.back/2){k.x=u.x;k.y=u.y;k.t=0;k.n=0;u.rescue=false;u.tight=false}
        else if(!(this.time-(u.wt??-Infinity)<=PATHS.stuck)||col&&moved>.001)k.t=0;else if((k.t+=d)>=PATHS.stuck){k.t=0;const n=k.n++;if(!n){u.rescue=1;u.flow=null;u.plan=null;u.needAt=-1}
          else{const p=n<2?null:n>2&&!reach[routeIx(nav.grid,u.x-nav.x,u.y-nav.y)]?nav.snap({x:u.x,y:u.y,type:u.type},reach):this.backOff(u,nav);u.tight=true;u.rescue=1;u.plan=null;u.needAt=-1;
            if(p){const at=buckets.get(u.bucket);at.splice(at.indexOf(u),1);u.x=p.x;u.y=p.y;put(u);k.x=u.x;k.y=u.y;k.n=0}}}}
      let aim=goal;if(!u.straight&&u.flow){aim=nav.flowAim(u,u.flow);if(!aim)continue}else if(!u.straight){const w=u.plan;if(!w||w.ground!==nav||!w.p.length)continue;while(w.i<w.p.length-1&&(Math.hypot(w.p[w.i].x-u.x,w.p[w.i].y-u.y)<MARCH_MOVE.waypoint||nav.clear(u,w.p[w.i+1])))w.i++;aim=w.p[w.i]}
      // (a column on the march: he heads along its way, a step on from where he is, round its bends (MarchColumn steer); he brakes
      // for his place all the same)
      const ax=aim.x-u.x,ay=aim.y-u.y,l=Math.hypot(ax,ay);if(l<.001)continue;const S=MARCH_STEER,on=u.straight&&u.tg&&(this.loop?this.loop.steer(u.x,u.y,u.tg,S):col&&moved>.001&&!(R&&u.held)&&col.steer(u.x,u.y,u.tg,S));
      const friends=near(u),want=on?Math.atan2(S.y-u.y,S.x-u.x):Math.atan2(ay,ax),ru=marchBody(u),K=marchKind(u.type),top=step/d,probe=Math.min(l,Math.max(step,ru*.5));
      // (a body (the owner, 2026-10-31: "like unit really have physics"): his heading turns at his kind's rate, his speed rises and
      // falls over its time, braking as he nears his place; he goes only the way he faces: no jump aside, no sudden stop.
      // The way: straight at his place, else the first of the sidesteps a friend leaves open; none open, he slows to a halt)
      if(u.hd==null){u.hd=u.dir??want;u.vel=0}let way=null;
      // (round a friend, the side he took last, while he still goes round: no flip from one side to the other)
      const sides=u.side?MARCH_MOVE.sidestep.filter(o=>!o||Math.sign(o)===u.side):MARCH_MOVE.sidestep;
      // (a comrade just ahead in his file, walking his way: he keeps pace behind him (marchLead: his speed capped, the way found as
      // ever), so he never comes up on him to be stopped)
      const lead=col&&moved>.001?marchLead(u,want,friends,ru):null;
      for(const off of sides){const a=want+off,p={x:u.x+Math.cos(a)*probe,y:u.y+Math.sin(a)*probe};if(nav.clear(u,p)&&!friends.some(v=>v!==u&&Math.hypot(v.x-p.x,v.y-p.y)<(ru+marchBody(v))/2&&Math.hypot(v.x-p.x,v.y-p.y)<Math.hypot(v.x-u.x,v.y-u.y)-.001)){way=a;break}}
      // (the army standing, he hemmed in by his own side a while (blocked, or only stepping round them), well short of his place: he
      // squeezes through, the parting pass below making room; the army marching, after MARCH_MOVE.jam s of it: a crowd in a ford)
      u.side=way!=null&&way!==want?Math.sign(Math.atan2(Math.sin(way-want),Math.cos(way-want))):0;let cap=top;if(way===want)u.stuck=Math.max(0,(u.stuck||0)-d/2);else if(way!=null)u.stuck=(u.stuck||0)+d/2;else{u.stuck=(u.stuck||0)+d;}u.squeeze=u.stuck>=(moved<=.001?MARCH_MOVE.squeeze[0]:MARCH_MOVE.jam)&&gd>MARCH_MOVE.squeeze[2];if(u.squeeze){way=want;cap=top*MARCH_MOVE.squeeze[1]}else if(lead)cap=Math.min(cap,lead.cap)
      const df=way==null?0:Math.atan2(Math.sin(way-u.hd),Math.cos(way-u.hd)),rate=K.turn0+(K.turn-K.turn0)*Math.min(1,u.vel/Math.max(1e-6,top));u.hd+=clamp(df,-rate*d,rate*d);
      const off=Math.atan2(Math.sin((way??want)-u.hd),Math.cos((way??want)-u.hd)),tgt=way==null?0:Math.min(cap*Math.max(0,Math.cos(off))**2,Math.sqrt(2*top/K.t*.6*l));
      u.vel=clamp(tgt,u.vel-top/K.t*d*1.6,u.vel+top/K.t*d);if(!(u.vel>1e-4)){u.vel=0;continue}
      const s1=Math.min(u.vel*d,l),last=s1>=l-.001&&Math.abs(off)<.35;let q=last?{x:aim.x,y:aim.y}:{x:u.x+Math.cos(u.hd)*s1,y:u.y+Math.sin(u.hd)*s1},wall=!nav.clear(u,q);if(wall&&PATHS.slide)u.wt=this.time;
      // (PATHS.slide: a step that meets a wall slides along it (route.js routeSlide), his pace kept, rather than halving it to a stop)
      if(wall&&PATHS.slide&&routeSlide(nav.grid,u.x-nav.x,u.y-nav.y,q.x-u.x,q.y-u.y,marchBody(u)/2,MARCH_SLIDE)){const p={x:u.x+MARCH_SLIDE[0],y:u.y+MARCH_SLIDE[1]};if(nav.clear(u,p)&&nav.stand(p)){q=p;wall=false}}
      if(wall||friends.some(v=>v!==u&&way!==want&&Math.hypot(v.x-q.x,v.y-q.y)<(ru+marchBody(v))/2-.05&&Math.hypot(v.x-q.x,v.y-q.y)<Math.hypot(v.x-u.x,v.y-u.y))){u.vel*=.5;continue}
      const at=buckets.get(u.bucket);at.splice(at.indexOf(u),1);u.dir=u.hd;u.x=q.x;u.y=q.y;u.walk+=s1;u.stepT=(u.stepT||0)+d;u.walking=true;u.walkT=MARCH_MOVE.stride;put(u);
    }
    if(FT)this.formEnd(FT,d,moved);
    // (then apart: no two closer than their bodies; a caravan's wagon is a body too, never pushed; one squeezing through takes
    // little of the push, those he passes give way)
    const lead=marchCentrePiece(o)?marchCart(o,col?{x:col.cx,y:col.cy}:o):null,move=(u,x,y)=>{const p={x,y};if(!nav.clear(u,p)||!nav.stand(p))return;const at=buckets.get(u.bucket);at.splice(at.indexOf(u),1);u.x=x;u.y=y;put(u)};
    for(let pass=0;pass<MARCH_MOVE.part;pass++)for(const u of this.units){const ru=marchBody(u);
      for(const v of lead?[...near(u),...lead]:near(u)){if(v===u)continue;const dx=u.x-v.x,dy=u.y-v.y,dd=Math.hypot(dx,dy),need=(ru+(v.r??marchBody(v)))/2;if(dd>=need)continue;
        const k=v.fixed?1:u.squeeze===!!v.squeeze?.5:u.squeeze?MARCH_MOVE.squeeze[3]:1-MARCH_MOVE.squeeze[3],a=dd>1e-6?Math.atan2(dy,dx):u.id*2.39996;move(u,u.x+Math.cos(a)*(need-dd)*k,u.y+Math.sin(a)*(need-dd)*k)}}
    // (PATHS.slide with PATHS.clear: one pushed nearer a wall than his room (by his friends, a jump's placing) pushed out of it)
    if(PATHS.slide&&PATHS.clear){const g=nav.grid,cl=routeRoom(g),sq=g.cs*.7072;for(const u of this.units){const r=nav.body(u);if(!r||!nav.contains(u))continue;const i=routeIx(g,u.x-nav.x,u.y-nav.y);if(cl[i]-sq>=r)continue;const w=routeNeed(g,i,r),v=nav.gap(u,w);
      if(v<w-1e-3&&(ROUTE_GAP.nx||ROUTE_GAP.ny))move(u,u.x+ROUTE_GAP.nx*(w-v+1e-3),u.y+ROUTE_GAP.ny*(w-v+1e-3))}}
    // (the owner, 2026-10-31: "the army radius move too fast, it should follow the speed of all units") its middle never runs ahead
    // of its men: each man's spot less his place in it is where he puts it, their median where they do (no man placed: their
    // midst). menCentre: that is the army's middle, its owner put there; its guide never more than MARCH_MOVE.lead (px, s of its
    // pace) from it, any way, so men held by a building hold it. Without: more than MARCH_MOVE.leash ahead of that along its way
    // (men only wheeling round it, beside it, never hold it), it gives back what it went this moment, along its own way (never back
    // past where it stood); a leap (a town's gate, under MARCH_MOVE.teleport) is no march: never held
    // (menCentre: each man's place turned as his army stands now (the turn that best lays its places on its men: a wheel under way
    // they still swing through neither drags it back nor flings it out))
    // (a column: where its men put its head, its guide held to that only along its own way (as without menCentre: it gives back
    // what it went this moment, never back past where it stood), so its head never leaves the way it went (its trail, the road);
    // the army's point its middle along that way, col ox, oy past its guide: still while its guide is, as its men settle)
    {if(C)this.mid=this.middle(wanted,!!col);else{const M=[];for(const u of this.units){const p=wanted.get(u.row+':'+u.index);if(p)M.push([u.x-p.x+o.x,u.y-p.y+o.y])}
        const med=k=>M.map(q=>q[k]).sort((a,b)=>a-b)[M.length>>1];this.mid=M.length?{x:med(0),y:med(1)}:null}
      // (forming: over once form of its men stand within place px of their places (their goals: one put off a building), as the
      // whole of it trails them (by where they put it, mid: on the march every man lags his place alike, as far as his brake lets
      // him keep up), or after most s; one holding his ground to fall in is not yet in his place)
      // (TRAVEL_STYLES.steady: into a column, run out of time with more than stuck of its men blocked short of their places (no
      // straight way to them), it gives up: its formation a while, TravelStyle giveUp)
      if(this.forming){const f=this.forming,lx=this.mid?this.mid.x-o.x:0,ly=this.mid?this.mid.y-o.y:0;f.t+=d;let n=0,k=0,b=0;
        for(const u of this.units){const p=!u.dead&&wanted.get(u.row+':'+u.index);if(!p)continue;n++;const g=!u.held&&u.goal||p;if(Math.hypot(u.x-g.x-lx,u.y-g.y-ly)<=F.place)k++;else if(u.goal&&!u.straight)b++}
        if(!n||k>=n*F.form||f.t>=F.most){if(col&&n&&k<n*F.form&&b>n*TRAVEL_STYLES.stuck)TravelStyle.giveUp(o,this);this.forming=null;if(this.about){this.about=false;this.trail.clear()}}}
      if(C){const c=this.mid,L=MARCH_MOVE.lead,lim=L[0]+L[1]*step/d,gx=this.gx-c.x,gy=this.gy-c.y,l=Math.hypot(gx,gy);
        if(col){const ahead=moved>.001?(gx*dx+gy*dy)/moved-lim:0;if(ahead>0){const back=Math.min(ahead,moved);this.gx-=dx/moved*back;this.gy-=dy/moved*back}}
        else if(l>lim){this.gx=c.x+gx/l*lim;this.gy=c.y+gy/l*lim}
        // (footing: its guide and its point never on ground no man stands on (water, a peak: a river between its men on both banks):
        // put on the nearest a man could stand on, else its way on the map (from its guide, march guides) starts in the water, finds
        // none, and every order is dropped (the owner, 2026-11-01: "my army get stuck when the unit try to form a formation near
        // blocking or water"); a ferry's water is open; a building's feet are not the map's, so its way starts there as ever)
        const foot=(x,y)=>{const p={x,y};return MARCH_MOVE.footing&&!passable(terrAt(x,y))&&nav.contains(p)&&!nav.open(p)?nav.snap(p,null):null};{const q=foot(this.gx,this.gy);if(q){this.gx=q.x;this.gy=q.y}}let px=col?this.gx+col.ox:c.x,py=col?this.gy+col.oy:c.y;
        if(col&&!jump){const ex=px-this.wx,ey=py-this.wy,e=Math.hypot(ex,ey),g=F.glide*step;if(e>g){px=this.wx+ex/e*g;py=this.wy+ey/e*g}}
        {const q=foot(px,py);if(q){px=q.x;py=q.y}}
        this.mid=col?{x:px,y:py}:c;o.x=this.x=this.wx=px;o.y=this.y=this.wy=py}
      else if(moved>.001&&moved<=walk*MARCH_MOVE.road&&this.mid){const gap=((o.x-this.mid.x)*dx+(o.y-this.mid.y)*dy)/moved-MARCH_MOVE.leash[0]-MARCH_MOVE.leash[1]*step/d;
        if(gap>0){const back=Math.min(gap,moved);o.x-=dx/moved*back;o.y-=dy/moved*back;this.x=o.x;this.y=o.y}}}
    this.trail.add(C?this.gx:o.x,C?this.gy:o.y);// (its guide's trail: a column's way)
  }
  /* (PATHS.corridor; the owner, 2026-11-02: "should the pathfinder calculated as a whole group first then make the unit move
     together?") its way through ground nav, as one: from its rear (its hindmost place's reach behind its guide, back px as it faces)
     by its guide (gx, gy) along the guide's own way ahead (ahead: router.js Router.ahead; yours, walked straight, your goal; none:
     its front, front px ahead), cut where it leaves the ground, each leg searched on nav's grid with its widest body's room (route.js
     routePath need): {pts (world px), loc (the grid's px), id}. Kept (this.cor) till its ground, the grid's version or its guide's
     goal changes */
  corridor(nav,gx,gy,fx,fy,back,front,ahead){const g=nav.grid,K=this.cor,end=ahead?ahead[ahead.length-1]:null,gk=end?Math.round(end[0])+','+Math.round(end[1]):'front';
    if(K&&K.ground===nav&&K.v===g.v&&K.gk===gk)return K;
    let r=0;for(const u of this.units)if(!u.dead)r=Math.max(r,nav.body(u));
    // (made again for the same goal (new ground, the grid changed): by the old one's points still ahead of its rear, so it keeps the
    // side it took; its guide only where one stands (a march's guide walks through a house the world's ways know nothing of))
    const R=[gx+fx*back,gy+fy*back],m=g.cs*2,inn=p=>nav.contains({x:p[0],y:p[1]},m),along=p=>(p[0]-gx)*fx+(p[1]-gy)*fy,W=[R];
    if(K&&K.gk===gk){for(const p of K.pts)if(along(p)>back&&inn(p))W.push(p)}else if(nav.stand({x:gx,y:gy}))W.push([gx,gy]);
    {const e=W.length>1?along(W[W.length-1]):back;for(const p of ahead||[[gx+fx*front,gy+fy*front]])if(W.length<2||along(p)>e)W.push(p)}
    const pts=[R];
    for(let i=1;i<W.length;i++){const a=pts[pts.length-1];let b=W[i];const out=!inn(b);
      if(out){const c=W[i-1];let lo=0,hi=1;if(!inn(c))break;for(let k=0;k<20;k++){const f=(lo+hi)/2;if(inn([c[0]+(b[0]-c[0])*f,c[1]+(b[1]-c[1])*f]))lo=f;else hi=f}b=[c[0]+(b[0]-c[0])*lo,c[1]+(b[1]-c[1])*lo]}
      // (a point of it on ground none stands on (a house the world's ways know nothing of) carried on through, the way it goes)
      // (a leg of no length has no way to go on: it stays (else it stepped in place for ever, the game frozen); at most a grid's width)
      if(!nav.stand({x:b[0],y:b[1]})){const l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>1e-6){const ux=(b[0]-a[0])/l,uy=(b[1]-a[1])/l,most=(g.C+g.R)*g.cs;for(let s=g.cs;s<=most;s+=g.cs){const q=[b[0]+ux*s,b[1]+uy*s];if(!inn(q))break;if(nav.stand({x:q[0],y:q[1]})){b=q;break}}}}
      for(const [x,y] of routePath(g,a[0]-nav.x,a[1]-nav.y,b[0]-nav.x,b[1]-nav.y,{need:r}))pts.push([x+nav.x,y+nav.y]);if(out)break}
    // (string-pulled across its legs, its room kept: no spur where a leg met the next)
    {const q=[pts[0]];for(let a=0;a<pts.length-1;){let k=a+1;while(k<pts.length-1&&lineBody(g,pts[a][0]-nav.x,pts[a][1]-nav.y,pts[k+1][0]-nav.x,pts[k+1][1]-nav.y,255,r))k++;q.push(pts[k]);a=k}pts.length=0;pts.push(...q)}
    return this.cor={ground:nav,v:g.v,gk,id:++MARCH_COR.n,pts,loc:pts.map(([x,y])=>[x-nav.x,y-nav.y])}}
  /* (MARCH_MOVE.formGiveUp; the owner, 2026-11-02: "if you cannot form a column it's ok, just stick with the army and let unit standing
     there. the unit can try to get into a formation but after 5 secs or xxx cooldown timer then it just stop trying and stand there")
     its forming's watch, this.fw {m: px its guide has been moved since it began (by its brain, your march: moved, held back by its
     men or not), key: its rows, facing and order then (a column or not, turned, its order coming back, looping), done: all those
     short of their places given up} (each man's own: u.fb, the nearest he came to his place, u.fbt, s since): begun afresh, every
     man trying again, at a jump, a new key, or its guide moved formMove px (an order, marching on); a man given up farther than its
     ring (marchOuter) from its guide, left behind, follows it again, its places no longer kept */
  formWatch(jump,moved,gx,gy){const f=Math.round(this.face*8),T=this.fw||(this.fw={m:0,key:this.key,f,col:this.col,turned:this.turned,re:!!this.reorder,loop:!!this.loop,done:false}),M=MARCH_MOVE;
    if(jump||T.key!==this.key||T.f!==f||T.col!==this.col||T.turned!==this.turned||T.re!==!!this.reorder||T.loop!==!!this.loop||(T.m+=moved)>M.formMove){
      T.m=0;T.key=this.key;T.f=f;T.col=this.col;T.turned=this.turned;T.re=!!this.reorder;T.loop=!!this.loop;T.done=false;for(const u of this.units){u.gave=false;u.fb=null}}
    else if(T.done){const r=marchOuter(this.owner);for(const u of this.units)if(u.gave&&Math.hypot(u.x-gx,u.y-gy)>r){u.gave=false;u.fb=null;T.done=false}}return T}
  // (a man short of his place (not settled in it: rest) who has come no nearer it by formGain px in formTry s stands where he is,
  // facing its way, given up (no way, no squeeze, no rescue, no new share); all those short given up, its forming over and its men's
  // places kept (done). Only while it stands: not on the move (a column forming on the march gives up by its own time: TravelStyle
  // giveUp), nor while it loops (its own time: the step))
  formEnd(T,d,moved){if(this.loop||moved>.001){for(const u of this.units)u.fb=null;return}let short=0,left=0;
    for(const u of this.units){if(u.dead||!u.goal||u.gave)continue;if(u.rest){u.fb=null;continue}short++;const gd=Math.hypot(u.x-u.goal.x,u.y-u.goal.y);
      if(u.fb==null||gd<u.fb-MARCH_MOVE.formGain){u.fb=gd;u.fbt=0;left++}else if((u.fbt+=d)>=MARCH_MOVE.formTry){u.gave=true;u.rest=true;u.vel=0;u.plan=null;u.flow=null;u.rescue=false;u.tight=false;u.hd=u.dir=this.face}else left++}
    if(short&&!left&&!T.done){T.done=true;this.forming=null}}
  // (falling into a column, SLOTFILL off (on: refill): each group's places (by index, front to back) to its men in the order they
  // stand along the way it goes (heading: not its facing, which turns slowly), the foremost first, so none walks back through his
  // file to a place at its front)
  // (PATHS.slide: where a man stuck against a wall steps back to, PATHS.back px off the wall nearest him (route.js routeGap), when one
  // is within that of his room: open ground he may walk to straight; null: no wall near, or nowhere to step)
  backOff(u,nav){if(!nav.contains(u))return null;const r=marchBody(u)/2;if(!(nav.gap(u,r+PATHS.back)<r+PATHS.back)||!(ROUTE_GAP.nx||ROUTE_GAP.ny))return null;
    const p={x:u.x+ROUTE_GAP.nx*PATHS.back,y:u.y+ROUTE_GAP.ny*PATHS.back};return nav.clear(u,p)&&nav.stand(p)?p:null}
  fileIn(){const cx=Math.cos(this.heading),cy=Math.sin(this.heading),by=new Map();for(const u of this.units){if(u.dead)continue;let a=by.get(u.row);if(!a)by.set(u.row,a=[]);a.push(u)}
    for(const a of by.values()){const ix=a.map(u=>u.index).sort((p,q)=>p-q);a.sort((u,v)=>(v.x-u.x)*cx+(v.y-u.y)*cy).forEach((u,i)=>{u.index=ix[i]})}}
  /* (about face, MARCH_MOVE.about: a column turned back on its own way (dx, dy: its guide's move this moment): its file the other way
     round where it stands, its guide at its tail, now its head, going on from there at once (MarchColumn turn; its way to where it
     goes found afresh from there: router.js ROUTES). False when that would not do, so it turns as before (out of its column, round
     its middle): yours bound short of its tail (a spot by its own file), any other turned back again before it has gone its own
     length since it last did (not to and fro over a spot by its file)) */
  aboutColumn(dx,dy){const o=this.owner,col=this.colOf();if(!col)return false;col.lay(this.trail,this.gx-dx,this.gy-dy,this.heading);
    if(o===P?P.tx!=null&&col.along(P.tx,P.ty)<col.len:this.since<col.len)return false;
    col.turn(this.trail,MARCH_HOLD);o.x=this.gx=MARCH_HOLD.x;o.y=this.gy=MARCH_HOLD.y;this.face=Math.atan2(dy,dx);this.since=0;this.turnAbout();ROUTES.delete(o);return true}
  // (its order the other way round (about face), or back again; its leg counted afresh (a reorder under way goes on, to the new
  // places))
  turnAbout(){this.turned=!this.turned;this.leg=0;this.goalGround=null;if(this.reorder)this.reorder.t=0}
  // (its own order back after an about face, each group's places its chosen ones again, its men shuffling into them (reorder, in
  // the step); a group's men each the one of them nearest along its way (SLOTFILL; off: fileIn))
  reorderStart(col){this.turned=false;this.reorder={t:0};this.goalGround=null;if(SLOTFILL.on)this.fillDue=true;else if(col)this.fileIn()}
  /* (its countermarch, MARCH_MOVE.about.loop: its column (turned, halted) laid as an oval round where it stands (MarchLoop), its
     lanes gap px apart or its files' width, a caravan's margin px clear of its wagon (its bodies, MARCH_CART, and a man's), its
     pace held by its slowest turning men (marchKind); none when it, or margin px round it, is off ground a man stands on (nav:
     water, a building, a cliff): its order kept the other way round till its next halt) */
  loopStart(col,nav){const AL=MARCH_MOVE.about.loop,o=this.owner;this.targets();let h=Math.max(AL.gap/2,...col.T.map(t=>Math.abs(t.side)));
    if(marchCentrePiece(o)){const a=col.at(col.mid-1,0,{x:0,y:0}),b=col.at(col.mid+1,0,{x:0,y:0}),l=Math.hypot(b.x-a.x,b.y-a.y)||1,w=Math.max(...col.T.map(t=>marchBodyOf(t.type)))*WORLD_BATTLE.sprite/WORLD_BATTLE.scale;
      for(const c of marchCart(o,{x:col.cx,y:col.cy}))h=Math.max(h,Math.abs((c.x-col.cx)*(b.y-a.y)-(c.y-col.cy)*(b.x-a.x))/l+(c.r+w)/2+AL.margin)}
    const K=col.T.map(t=>marchKind(t.type)),L=new MarchLoop(col,h,AL.end||h,Math.min(...K.map(k=>k.turn0)),Math.min(...K.map(k=>k.turn)));if(L.fits(nav,AL.margin)){this.loop=L;this.goalGround=null}else this.loopNo=true}
  // (its loop over: done, half round, its order the chosen one (its column flipped back: colOf); stopped, its men to their places
  // as it stands, each group's by the least walking (SLOTFILL))
  loopEnd(done){this.loop=null;this.goalGround=null;if(done){this.turned=false;this.leg=0;this.colOf()}else if(SLOTFILL.on)this.fillDue=true}
  // (the box round its men's discs (marchDisc), world px about where they stand: x0, y0, x1, y1; made again when they have moved)
  box(){const b=this.bx||(this.bx=new Float32Array(4));if(this.bxT===this.time&&this.bxU===this.units&&this.bxX===this.x&&this.bxY===this.y)return b;b[0]=b[1]=Infinity;b[2]=b[3]=-Infinity;
    for(const u of this.units){if(u.dead)continue;const r=marchDisc(u);if(u.x-r<b[0])b[0]=u.x-r;if(u.y-r<b[1])b[1]=u.y-r;if(u.x+r>b[2])b[2]=u.x+r;if(u.y+r>b[3])b[3]=u.y+r}this.bxT=this.time;this.bxU=this.units;this.bxX=this.x;this.bxY=this.y;return b}
  // (menCentre: its men's middle, its fallen left out, wanted: each man's place by row:index (its targets): each man's spot less his
  // place, the places turned as the army stands now (the turn that best lays them on its men: a wheel under way they still swing
  // through neither drags it back nor flings it out), their median; no man placed, their midst; none, its owner's point. A column's
  // (col: its places laid from its head, hx, hy), unturned: where its men put its head. midSpread: px its men stand off the shape
  // of their places in all (each one's spot less his place, about their mean); after a new share (refill), fillOff (the old middle
  // less the new) added, a share of it as that spread is of what it was at the share (never more), till under 2% of it: its point
  // kept where it was, then eased to where its men stand as they walk to their new places)
  middle(wanted,col=false,hx=this.owner.x,hy=this.owner.y){const o=this.owner,out=u=>u.dead;let n=0,ax=0,ay=0,ux=0,uy=0,dd=0,dc=0,co=1,si=0;
    for(const u of this.units){if(out(u))continue;const p=wanted.get(u.row+':'+u.index);if(p){n++;ax+=p.x-hx;ay+=p.y-hy;ux+=u.x;uy+=u.y}}
    if(n>1&&!col){ax/=n;ay/=n;ux/=n;uy/=n;for(const u of this.units){const p=!out(u)&&wanted.get(u.row+':'+u.index);if(!p)continue;const X=p.x-hx-ax,Y=p.y-hy-ay,U=u.x-ux,V=u.y-uy;dd+=X*U+Y*V;dc+=X*V-Y*U}
      if(dd||dc){const a=Math.atan2(dc,dd);co=Math.cos(a);si=Math.sin(a)}}
    const M=[];for(const u of this.units){const p=!out(u)&&wanted.get(u.row+':'+u.index);if(p){const X=p.x-hx,Y=p.y-hy;M.push([u.x-(X*co-Y*si),u.y-(X*si+Y*co)])}}
    if(M.length){const med=k=>M.map(q=>q[k]).sort((a,b)=>a-b)[M.length>>1],r={x:med(0),y:med(1)};let mx=0,my=0,w=0;for(const q of M){mx+=q[0];my+=q[1]}mx/=M.length;my/=M.length;
      for(const q of M)w+=Math.hypot(q[0]-mx,q[1]-my);this.midSpread=w;const f=this.fillOff;
      if(f){f.k=Math.min(f.k,w/f.w);if(f.k<.02)this.fillOff=null;else{r.x+=f.x*f.k;r.y+=f.y*f.k}}return r}
    const live=this.units.filter(u=>!u.dead);return live.length?{x:live.reduce((s,u)=>s+u.x,0)/live.length,y:live.reduce((s,u)=>s+u.y,0)/live.length}:{x:o.x,y:o.y}}
  // (its men's middle as they stand now, between its steps (a battle's end, the game paused): its label's place, render.js
  // armyHome; worked out again only when they, its owner or its facing have moved)
  centre(){const o=this.owner,k=this.cn;if(k&&k.t===this.time&&k.x===o.x&&k.y===o.y&&k.f===this.face&&k.u===this.units&&k.d===this.units.filter(u=>u.dead).length)return k.c;
    const rows=this.rows||marchRows(o);if(!this.rows)this.rows=rows;const T=this.targets(),col=this.colOf();
    const c=col?{x:col.cx,y:col.cy}:this.middle(new Map(T.map(p=>[p.row+':'+p.index,p])));// (a column's point: its middle along its way)
    this.cn={t:this.time,x:o.x,y:o.y,f:this.face,u:this.units,d:this.units.filter(u=>u.dead).length,c};return c}
  // (a group's men; SLOTFILL: in the order of their places, so a world battle sets each where his place's man stood: worldbattle.js place)
  forGroup(id){const a=this.units.filter(u=>u.row===id);return SLOTFILL.on?a.sort((p,q)=>p.index-q.index):a}
  // (after a battle on the map, its middle where its survivors stand: by its leader's place, else their midst; yours by your
  // hero's, worldbattle.js. Its outline made afresh round its survivors; menCentre: its next step puts it at its men's middle, its
  // label there meanwhile (render.js armyHome, MarchArmy#centre)
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
// (the place a man falling into a column holds meanwhile (MarchArmy step): one, written afresh for each)
const MARCH_HOLD={x:0,y:0,type:null},MARCH_STEER={x:0,y:0};
// (MarchArmy refill's buffers: a group's men, its places' indices, the place of each index, each man's place now)
const MARCH_FILL={men:[],ix:[],of:[],cur:[]};
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
