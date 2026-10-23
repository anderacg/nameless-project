'use strict';
/* ---------- drawing the road's encounters (split from world/road.js, which keeps their rules: what each is, its pieces (roadPieces),
   how it moves and ends). The pictures of their people, riders, horses, the fallen, tents and props, and EncounterScene,
   which lays them out and draws them (ENC_SCENE: the map, the page's banner) ---------- */
/* its figures: an EncounterScene lays out each kind's pieces from its data (scene(e): [piece, which, dx, dy, opts], dx
   mirrored as it faces left: walk / stand (a person of ENC_LOOK, stepping as it moves), kneel (one kneeling), down (the fallen pose), soldier (a
   follower: a realm's colour, or a band's; down with blood: lying in a pool of it), refugee, worker, beast (a herd's animal), cart (the caravan's), bld (a tent, a
   shrine, a mine's head), prop, fire, cloth (dice on it), wreck; rider (a person of ENC_LOOK on a horse: o.coat, in o.col),
   horse (saddled, no rider), carcass (a herd's beast lying dead), mud, oldcart (the caravan's cart left behind); wisp, dust,
   smoke and notes (music) drawn live), each its feet at its point (o.at: at that point of the map, not with the encounter: one
   left behind as it runs), for the map (draw: each piece by its feet in the depth order, at the encounter's own place to the
   screen's pixel: subT) and for its page's banner (pics). The new kinds' pieces are stand-ins until the props of phase 3 */
function roadPerson(key,race,v,f){const k='rp'+key+race+v+f;return spr[k]||(spr[k]=mapPerson(ENC_LOOK[key](race,v),f))}
function roadRider(key,race,v,f,col,coat){const k='rr'+key+race+v+f+col+coat;return spr[k]||(spr[k]=mapFigure({...ENC_LOOK[key](race,v),team:col||'leather'},f,coat||'horse'))}
// (a saddled horse with no rider: the map's horse, a saddle and its blanket on its back, a stirrup hanging)
function roadHorse(coat,f){const k='rh'+coat+f;if(spr[k])return spr[k];const g=pgrid(15,8),hs=drawMapHorse(g,coat,f,2,1),L=pal('leather'),R=pal('red');
  hs(3,1,L[2]);hs(4,1,L[1]);hs(5,1,L[1]);hs(6,1,L[2]);hs(4,2,R[1]);hs(5,2,R[2]);hs(4,3,'#27272c');poutline(g);return spr[k]=cellOf(pcanvas(g))}
// (a beast lying dead: its map figure on its back, legs up, in a little blood)
function roadCarcass(id){const k='rpc'+id;if(spr[k])return spr[k];const s=critterSprite(id,0),h=s.ch||s.height;
  return spr[k]=cellOf(mkc(s.width,h+1,g=>{rect(g,'#6e1a18',(s.width>>1)-4,h-1,8,2);rect(g,'#8a2a22',(s.width>>1)-2,h-1,4,1);g.save();g.translate(0,h);g.scale(1,-1);g.drawImage(s,0,s.height-h,s.width,h,0,0,s.width,h);g.restore()}))}
// (kneeling: the standing figure with its thighs folded away, ENC_KNEEL rows from its hips, on the ground)
const ENC_KNEEL=3;
function roadKneel(key,race,v){const k='rpk'+key+race+v;if(spr[k])return spr[k];const s=roadPerson(key,race,v,0),w=s.width,h=s.height,c=h-6;
  return spr[k]=mkc(w,h-ENC_KNEEL,g=>{g.drawImage(s,0,0,w,c,0,0,w,c);g.drawImage(s,0,c+ENC_KNEEL,w,h-c-ENC_KNEEL,0,c,w,h-c-ENC_KNEEL)})}
const roadMud=()=>spr.rpMud||(spr.rpMud=mkc(16,4,g=>{rect(g,'#3e2e20',2,0,12,4);rect(g,'#4e3a28',0,1,16,2);rect(g,'#5e4630',3,1,5,1);rect(g,'#6a5a48',10,2,3,1)}));
// (lying: the figure turned a quarter, head to the right, as the battle's fallen are (sprites.js corpseOf), on the ground)
function roadDown(key,race,v,blood){const k='rpd'+key+race+v+(blood?'b':'');if(spr[k])return spr[k];if(blood){const b=roadDown(key,race,v);return spr[k]=mkc(16,16,g=>{rect(g,'#5a1414',3,13,10,1);rect(g,'#6e1a18',1,14,14,1);rect(g,'#8a2a22',5,14,5,1);rect(g,'#5a1414',3,15,10,1);g.drawImage(b,0,-1)})}
  const L=pturn(mapGrid(ENC_LOOK[key](race,v),0));let h=L.h;
  while(h>1&&!L.p.slice((h-1)*L.w,h*L.w).some(Boolean))h--;L.h=h+1;L.p.length=L.w*L.h;L.p.fill(null,h*L.w);poutline(L);return spr[k]=cellOf(pcanvas(L))}
// (a building or an object: its model (engine/buildmodels.js) in the climate there, its shadow under it, the frost's snow on it)
function roadBld(type,e){const c=climAt(e.x,e.y),sd=e.seed%4,k='rb'+type+sd+c;if(spr[k])return spr[k];
  const b=PX.buildingModel({type,seed:sd,env:c,snow:c==='frost'?1:0,glow:'#7fd8e8'});
  return spr[k]=mkc(b.w,b.h,g=>{g.globalAlpha=SHADOW.a;g.drawImage(b.shadow,0,0);g.globalAlpha=1;g.drawImage(b.img,0,0);if(b.snow)g.drawImage(b.snow.img,0,0)})}
const roadProp=t=>spr['rpp'+t]||(spr['rpp'+t]=PX.objectModel({type:t}).img);
const roadFire=()=>spr.rpFire||(spr.rpFire=PX.outline(PX.canvas(8,3,g=>{const P=PX.paint(g),q=PX.kit.tone;P.rect(q('stone',1),0,1,8,2);P.rect(q('stone',0),0,1,8,1);P.rect(q('log',1),2,0,4,2);P.px(q('log',0),2,0)})));
const roadCloth=()=>spr.rpCloth||(spr.rpCloth=mkc(7,4,g=>{rect(g,'#1a1c26',0,0,7,4);rect(g,'#8a3a2a',1,1,5,2);rect(g,'#a8483a',1,1,5,1);rect(g,'#f4f0e0',2,1);rect(g,'#f4f0e0',4,2)}));
// (the caravan's cart without its ox and drover: left behind, or, burnt, the burnt wagon: charred)
const roadCart=burnt=>{const k=burnt?'rpWreck':'rpCart';return spr[k]||(spr[k]=cellOf(mkc(14,12,g=>{g.drawImage(caravanSprite('#6a5a48',0),0,20,14,12,0,0,14,12);if(burnt){g.globalCompositeOperation='source-atop';g.fillStyle='rgba(28,20,16,.62)';g.fillRect(0,0,14,12)}})))};
const ROAD_FLIP=new WeakMap(),roadFlip=s=>{let c=ROAD_FLIP.get(s);if(!c){c=mkc(s.width,s.height,g=>{g.scale(-1,1);g.drawImage(s,-s.width,0)});ROAD_FLIP.set(s,c)}return c};
const ROAD_LIVE=['wisp','dust','smoke','notes'];
class EncounterScene{
  // its pieces now: {k, s (the picture, null for one drawn live), x, y (its feet on the map), face, a, o}; still: standing (the banner)
  lay(e,still){const m=e.dir<0?-1:1,go=!still&&mapStepping(e),f=go?frameOf(e,WALK.foot,WALK.n):0,out=[];
    for(const [k,w,dx,dy,o={}] of roadPieces(e)){const fr=go&&!o.at?(f+(o.v||0)*3)%WALK.n:0;
      out.push({k,s:ROAD_LIVE.includes(k)?null:this.pic(k,w,e,o,fr),x:o.at?o.at[0]:e.x+dx*m,y:o.at?o.at[1]:e.y+dy,face:(o.face||1)*(o.at?1:m),a:o.a??1,o})}
    return out}
  pic(k,w,e,o,f){const r=e.race||'human',v=o.v||0;
    return k==='walk'?roadPerson(w,r,v,f):k==='stand'?roadPerson(w,r,v,0):k==='kneel'?roadKneel(w,r,v):k==='down'?roadDown(w,r,v,o.blood):k==='soldier'?followerSprite(o.col||ENC_RAIDER,f,v,r,o.band):k==='refugee'?refugeeSprite(f,v):
      k==='worker'?workerSprite(w,f,r,v):k==='beast'?critterSprite(w,f):k==='cart'?caravanSprite(o.col||'#8a7a5a',f):k==='bld'?roadBld(w,e):k==='prop'?roadProp(w):k==='fire'?roadFire():k==='cloth'?roadCloth():k==='wreck'?roadCart(1):
      k==='rider'?roadRider(w,r,v,f,o.col,o.coat):k==='horse'?roadHorse(o.coat||'horse',f):k==='carcass'?roadCarcass(w):k==='mud'?roadMud():k==='oldcart'?roadCart(0):null}
  // the box it covers on the map [x0, y0, x1, y1] (a click anywhere on it, the highlights round it; not what it left behind)
  box(e){let b=null;for(const p of this.lay(e,true)){if(p.o.at)continue;const w=p.s?p.s.width:12,h=p.s?(p.s.ch||p.s.height):12,x0=Math.round(p.x)-(w>>1),y0=Math.round(p.y)+1-h;
    b=b?[Math.min(b[0],x0),Math.min(b[1],y0),Math.max(b[2],x0+w),Math.max(b[3],p.y+1)]:[x0,y0,x0+w,p.y+1]}
    return b||[e.x-6,e.y-12,e.x+6,e.y+2]}
  // onto the frame's list, each piece by its feet (a trace fading over its last six hours)
  draw(e,ents,cam){const fade=e.trace?clamp((e.end-roadNow())/6,0,1):1,t=performance.now()/1000,rm=reducedMotion();
    for(const p of this.lay(e,false))ents.push({y:p.y,f:()=>{if(!p.o.at)subT(e);const X=Math.round(p.x-cam.x),Y=Math.round(p.y-cam.y);ctx.globalAlpha=p.a*fade;
      if(p.k==='wisp'){const ph=e.seed%7+p.o.v*2.1,x=X+(rm?0:Math.round(Math.sin(t*.9+ph)*3)),y=Y-6+(rm?0:Math.round(Math.sin(t*1.7+ph)*2)),g=ctx.createRadialGradient(x,y,0,x,y,7);
        g.addColorStop(0,'rgba(170,255,235,.55)');g.addColorStop(1,'rgba(120,230,220,0)');ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(x-7,y-7,14,14);ctx.restore();rect(ctx,'#c8fff0',x-1,y-1,2,2);rect(ctx,'#ffffff',x,y-1)}
      else if(p.k==='dust'){for(let i=0;i<5;i++){const a=t*3+i*1.26,r=5+2*Math.sin(t*5+i);ctx.fillStyle='rgba(200,184,150,'+(.35+.15*Math.sin(t*6.7+i)).toFixed(2)+')';ctx.fillRect(Math.round(X+Math.cos(a)*r)-2,Math.round(Y-4+Math.sin(a)*r*.5)-1,3,2)}
        for(let i=-2;i<=2;i++){rect(ctx,'#1a1c26',X+i-1,Y-18+i,3,3);rect(ctx,'#1a1c26',X-i-1,Y-18+i,3,3)}for(let i=-2;i<=2;i++){rect(ctx,'#e4e0cf',X+i,Y-17+i);rect(ctx,'#e4e0cf',X-i,Y-17+i)}// (crossed blades over it, as a fight on the map has)
        if(Math.floor(t*8)%3===0)rect(ctx,'#fff8d0',X+Math.round(Math.sin(t*13)*5),Y-6-Math.round((1+Math.sin(t*7))*3))}
      else if(p.k==='notes'){for(let i=0;i<2;i++){const q=((rm?0:t*.6)+i/2)%1,x=X-3+i*5+Math.round(Math.sin(q*6.3+i)*2),y=Y-17-Math.round(q*9);ctx.globalAlpha=p.a*fade*(1-q);
        for(const [c,ox,oy] of [['#1a1c26',-1,0],['#1a1c26',1,0],['#1a1c26',0,-1],['#1a1c26',0,1],['#fff2c8',0,0]]){rect(ctx,c,x+ox,y+oy,1,3);rect(ctx,c,x-1+ox,y+2+oy,2,1)}}}
      else if(p.k==='smoke'){for(let i=0;i<3;i++){const q=((rm?0:t*.35)+i/3)%1;ctx.fillStyle='rgba(70,64,60,'+(.45*(1-q)).toFixed(2)+')';ctx.fillRect(X+Math.round(Math.sin(q*5+i)*2)-1,Y-Math.round(q*12),2+Math.round(q*2),2)}}
      else{const s=p.s;if(['walk','stand','kneel','soldier','refugee','worker','beast'].includes(p.k)){ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(X-3,Y-1,6,2)}
        ctx.save();ctx.translate(X,Y);if(p.face<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),1-s.height);ctx.restore();
        if(p.k==='fire'){drawFire(X,Y-1,e.seed);LIGHTQ.push({x:X,y:Y-3,r:22})}}
      ctx.globalAlpha=1}})}
  // its pictures for the page's banner: [picture, x, y (top left, map px), alpha], a fire's flame and the lights as they stand
  pics(e){const out=[];for(const p of this.lay(e,true)){
    if(p.s)out.push([p.face<0?roadFlip(p.s):p.s,Math.round(p.x)-(p.s.width>>1),Math.round(p.y)+1-p.s.height,p.a]);
    if(p.k==='fire'){const fl=spr.flm0||(spr.flm0=PX.flame(0));out.push([fl.img,Math.round(p.x)-fl.ax,Math.round(p.y)-1-fl.ay])}
    if(p.k==='wisp')out.push([spr.rpWisp||(spr.rpWisp=mkc(5,5,g=>{rect(g,'rgba(150,240,225,.45)',0,1,5,3);rect(g,'rgba(150,240,225,.45)',1,0,3,5);rect(g,'#c8fff0',1,1,3,3);rect(g,'#ffffff',2,1)})),Math.round(p.x)-2,Math.round(p.y)-8])}
    return out}
}
const ENC_SCENE=new EncounterScene();
