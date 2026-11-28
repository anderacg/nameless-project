'use strict';
/* ---------- hunters: the holdings' men out after the wild game (the owner, 2026-11-15: "Add hunters and they will hunt wildlife";
   numbers: data/hunters.js HUNTERS) ----------
   Only round holdings near you, never saved, as the estates' workers (world/folk.js). Each village and hamlet keeps a band or two of
   one to three hunters (HunterBand). On a day that is theirs (by the band's id and the day) they set out from its gate in the morning
   for the nearest wild herd within HUNTERS.range of it, walk up to it and stalk it: slowly, noticed only within a share of its shy
   reach (noticeAt: the herds see them as they see anyone, critters.js WildlifeThreats, and bolt). In bow range they draw and loose: a
   short arrow, each man a chance to bring one down (the herd one less, gone at none, as a hunt's end: battle/hunting.js finish), and
   the herd bolts. They dress the kill and carry it home on their backs (one man, two for a big one), its meat into the holding's
   stock; too few to lift it, or driven off by bandits or a beast before they do, it lies where it fell (a Carcass with its meat:
   world/carcasses.js). Missed, they follow and stalk again, a few shots a day; home by dusk, never out at night. Their own seeded
   draws (a stream by band and day): the world's Math.random untouched ---------- */
// (each man's place in the band, px behind and beside the first, mirrored by its facing)
const HUNTER_AT=[[0,0],[-5,-2],[-3,3]];
// a band on the map: a world object, seen and hovered while out of doors
class HunterBand extends WorldObject{
  get mapKind(){return 'hunter'}
  here(){return Hunters.list.includes(this)&&this.st!=='in'}
  get meetsAnyTime(){return true}
  get inside(){return this.st==='in'}
  inView(V){return this.st!=='in'&&spotted(this,V)}
  pick(at){if(this.inView(at.V))at.add(this,7,4)}
  meet(){toast(this.names()+': '+this.doing()+'.')}
  names(){const n=this.men.length;return n>1?this.men[0].name+' and '+(n-1)+' more':this.men[0].name}
  doing(){const D=c=>CRITTERS[c]||{n:'game',one:'beast'},c=this.herd&&D(this.herd.id);
    return this.st==='fetch'?'dressing the '+D(this.fell.id).one+' they brought down':this.st==='home'?(this.load.length?'carrying home '+an(D(this.load[0]).one):'on the way home'):(this.st==='stalk'?'stalking ':'out after ')+(c?c.n.toLowerCase():'game')}
  tip(){return '<b>'+this.names()+'</b><small>'+(this.men.length>1?'Hunters':'A hunter')+' of '+this.home+'</small><small>'+cap1(this.doing())+'</small>'}
  // (today's draws, a stream of their own by band and day: whether it is their day out, the hour they set out)
  plan(){const X=HUNTERS;this.R=seeded(folkHash(this.id+'|'+G.day));this.day=G.day;this.out=this.R()<X.share;this.sets=X.leave[0]+this.R()*(X.leave[1]-X.leave[0]);this.done=false;this.tries=0}
  // the nearest wild herd within range of their holding, on land they can walk to, that no other band is after (none in a fight on the map)
  prey(t){const X=HUNTERS;let best=null,bd=Infinity;
    for(const c of W.critters){if(!(c.n>0)||c.gone||!CRITTERS[c.id]||CRITTERS[c.id].live||fightHolds(c)||Math.hypot(c.x-t.x,c.y-t.y)>X.range||Hunters.list.some(h=>h!==this&&h.herd===c)||!Router.reach(t,c))continue;
      const d=Math.hypot(c.x-this.x,c.y-this.y);if(d<bd){bd=d;best=c}}
    return best}
  // a step toward (x, y) of s px: straight while near or the way is clear (world.js walk: round what is in the way), else by the
  // router's ways to that tile; false when it gets no nearer
  go(x,y,s,near){const dx=x-this.x,dy=y-this.y,dd=Math.hypot(dx,dy),x0=this.x,y0=this.y;s=Math.min(s,dd);if(dd<.01)return false;
    if(!(near||dd<3*TILE||clearLine(x0,y0,x,y))||!walk(this,dx,dy,s))Router.travel(this,{x:(Math.floor(x/TILE)+.5)*TILE,y:(Math.floor(y/TILE)+.5)*TILE,road:WAY.folk},s);
    const mx=this.x-x0;if(Math.abs(mx)>.05)this.dir=mx>0?1:-1;return this.moving=Math.hypot(mx,this.y-y0)>.01}
  step(d){const X=HUNTERS,t=townBy(this.home),now=Clock.frac;if(this.arrow&&(this.arrow.t-=d)<=0)this.arrow=null;
    if(this.st==='in'&&this.day!==G.day)this.plan();
    // at home: out on their day at their hour, game in range, the holding neither besieged nor afraid (none in range: they look
    // again a little later)
    if(this.st==='in'){this.moving=false;if(this.out&&!this.done&&now>=this.sets&&now<X.turn&&!besieged(t)&&!Timed.of(t).has('fear')&&!((this.look-=d)>0)){const c=this.prey(t);
      if(c){this.herd=c;this.st='out';this.noticeAt=1;this.x=t.x;this.y=t.y+10}else this.look=X.look}return}
    // (night, or a new day: in at once with what they carry; a kill not lifted stays where it fell)
    if(now>=X.night||this.day!==G.day)return this.goIn(t);
    // (bandits or a beast near: home at a run; the day's end or their shots spent: home, but for a kill they are lifting)
    const fear=folkThreat(this.x,this.y,X.danger);
    if(this.st!=='home'&&(fear||this.st!=='fetch'&&(now>=X.turn||this.tries>=X.tries)))this.homeward();
    if(this.st==='home')return this.walkHome(t,d,fear);
    if(this.st==='fetch')return this.fetch(d);
    let c=this.herd;
    if(!c||!(c.n>0)||!W.critters.includes(c)||fightHolds(c)||Math.hypot(c.x-t.x,c.y-t.y)>X.range+X.close){c=this.herd=this.prey(t);this.st='out';this.noticeAt=1;if(!c)return this.homeward()}
    const dx=c.x-this.x,dy=c.y-this.y,dd=Math.hypot(dx,dy);
    // (out after it: at a walk to stalking distance, past its shy reach, and while it runs from them)
    if(this.st==='out'){if(dd>X.close||WildlifeThreats.chosen.get(c)===this){this.go(c.x,c.y,footStep(X.walk,d));return}this.st='stalk';this.noticeAt=X.quiet[0]+this.R()*(X.quiet[1]-X.quiet[0]);this.aimT=X.aim}
    // (stalking: slowly in to bow range, then draw and loose; seen (it bolts from them) or lost, a try spent and after it again)
    if(WildlifeThreats.chosen.get(c)===this||dd>X.close*1.2){this.tries++;this.st='out';this.noticeAt=1;return}
    if(dd>X.bow){this.aimT=X.aim;this.go(c.x,c.y,footStep(X.stalk,d),true);return}
    this.moving=false;if(Math.abs(dx)>.5)this.dir=dx>0?1:-1;if((this.aimT-=d)<=0)this.shoot(c)}
  // a shot: its arrow, each man's chance, and the herd sees them now; one down, the herd one less (none left: gone) and they go to it
  shoot(c){const X=HUNTERS,R=this.R;this.tries++;this.noticeAt=1;this.aimT=X.aim;this.arrow={x0:this.x,y0:this.y,x1:c.x,y1:c.y,t:X.arrow};
    if(R()>=1-Math.pow(1-X.hit,this.men.length)){this.st='out';return}
    const a=R()*6.283,r=R()*4;this.fell={x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r*.6,id:c.id,face:c.dir||1};c.n--;if(!c.n){c.gone=true;W.critters=W.critters.filter(o=>o!==c)}
    this.herd=null;this.st='fetch';this.wait=X.pick;this.lost=0}
  // (to the kill, a while to dress it, and on their backs if they are men enough to lift it; else it stays, and home)
  fetch(d){const X=HUNTERS,f=this.fell;if(Math.hypot(f.x-this.x,f.y-this.y)>3){if(!this.go(f.x,f.y,footStep(X.walk,d),true)&&(this.lost+=d)>X.pick*5)this.homeward();return}
    this.moving=false;if((this.wait-=d)>0)return;if(this.men.length>=(X.lift[CRITTERS[f.id].size]||1)){this.load.push(f.id);this.fell=null}this.homeward()}
  // (home: a kill not lifted left where it fell)
  homeward(){this.st='home';this.herd=null;this.noticeAt=1;this.drop()}
  walkHome(t,d,fear){const X=HUNTERS,g={x:t.x,y:t.y+12,tw:t};if(Math.hypot(g.x-this.x,g.y-this.y)>3){const x0=this.x,y0=this.y;Router.travel(this,g,footStep(fear?X.run:this.load.length?X.carry:X.walk,d));
    const mx=this.x-x0;if(Math.abs(mx)>.05)this.dir=mx>0?1:-1;if(this.moving=Math.hypot(mx,this.y-y0)>.01)return}
    this.goIn(t)}
  // in at the gate: what they carry into the holding's stock (its meat, up to the store's room)
  goIn(t){this.drop();if(t&&this.load.length){ensureEcon(t);const n=this.load.reduce((a,id)=>a+(CRITTERS[id]?.meat||0),0),s=t.stock.meat||0;t.stock.meat=Math.max(s,Math.min(storeCap(t),s+n))}
    this.load=[];this.st='in';this.done=true;this.herd=null;this.arrow=null;this.moving=false;if(t){this.x=t.x;this.y=t.y+10}}
  // (a kill left lying: a carcass where it fell, its meat on it and maybe its trophy, for whoever finds it)
  drop(){const f=this.fell;this.fell=null;if(!f||!CARCASS.on)return;const D=CRITTERS[f.id],items=[{k:'good',id:'meat',n:D.meat}];if(D.mat&&this.R()<D.mat[1])items.push({k:'mat',id:D.mat[0],n:1});
    Carcass.list.push(asCarcass({x:f.x,y:f.y,type:null,wild:f.id,mon:null,bst:true,face:f.face,items,day:G.day+Clock.frac}));Carcass.prune()}
  // each man by his feet, his people's hunter in his land's clothes with his bow (the road's hunter, world/encounters.js ENC_LOOK),
  // those carrying a kill with it on their backs; a shot's arrow in flight
  draw(ents,cam,V){if(!this.inView(V)||B?.world?.hides(this))return;const h=this,cl=dressClimAt(h.x,h.y),go=h.moving,st=go?footFrame(WALKED.get(h)):0,
      lift=h.load.reduce((a,id)=>a+(HUNTERS.lift[CRITTERS[id]?.size]||1),0);
    h.men.forEach((m,i)=>{const [ox,oy]=HUNTER_AT[i%HUNTER_AT.length];ents.push({x:h.x,y:h.y+oy,f:()=>{const sx=Math.round(h.x+ox*h.dir-cam.x),sy=Math.round(h.y+oy-cam.y);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-2,sy-1,5,2);dressedIn(cl,()=>drawFig(hunterFig(h.race,m.v,cl,figPose(st+i,go),i<lift),sx,sy,h.dir))}})});
    const a=h.arrow;if(a)ents.push({x:a.x0,y:Math.max(a.y0,a.y1),f:()=>{const u=1-a.t/HUNTERS.arrow,L=Math.hypot(a.x1-a.x0,a.y1-a.y0+1)||1,ux=(a.x1-a.x0)/L,uy=(a.y1-a.y0+1)/L,
      x=a.x0+(a.x1-a.x0)*u,y=a.y0-4+(a.y1-a.y0+1)*u;ctx.fillStyle='#e8dcc0';for(let k=0;k<4;k++)ctx.fillRect(Math.round(x-ux*k-cam.x),Math.round(y-uy*k-cam.y),1,1)}})}
}
// a hunter's figure: the road's hunter (ENC_LOOK.hunter, an odd look: his bow) of his people, in his land's clothes (people.js
// folkDress), kept by its key; carry: a kill on his back (LOADS bundle), his bow still in his hand
function hunterFig(race,v,clim,pose,carry){return figKeep('mhn'+race+v+(clim||'')+'p'+pose+(carry?'c':''),()=>{const L=folkDress(ENC_LOOK.hunter(race,v*2+1),clim||'grass',v*2+1,true);
  return figOf(carry?{...L,load:'bundle'}:L,pose)})}
class Hunters{
  static list=[];
  // (those out of doors: seen, hovered and feared by the game: world.js worldObjects, critters.js WildlifeThreats)
  static seen(){return this.list.filter(h=>h.st!=='in')}
  // (a holding's band i: its men (HUNTERS.men, their number, names and looks by its id: folk.js folkName), at home)
  static make(t,i){const X=HUNTERS,id=t.name+'|hunt|'+i,R=seeded(folkHash(id)),n=X.men[0]+Math.floor(R()*(X.men[1]-X.men[0]+1)),race=t.races?.[0]||'human',men=[];
    for(let j=0;j<n;j++)men.push(folkName({id:id+'|'+j},race));
    return Object.assign(new HunterBand(),{id,home:t.name,race,men,x:t.x,y:t.y+10,st:'in',day:-1,dir:1,moving:false,load:[],tries:0,noticeAt:1,herd:null,fell:null,arrow:null})}
  // each moment: the holdings near you have their bands (HUNTERS.kinds), those far or ruined forget them (what they carry home with
  // them); each band's step
  static step(d){const X=HUNTERS;if(!X.on){this.list.length=0;return}
    this.list=this.list.filter(h=>{const t=townBy(h.home),keep=t&&!ruined(t)&&Math.hypot(t.x-P.x,t.y-P.y)<X.near+X.forget;if(!keep&&h.st!=='in')h.goIn(t);return keep});
    const have=new Set(this.list.map(h=>h.id));
    for(const t of TOWNS){const n=X.kinds[t.kind];if(!n||ruined(t)||Math.hypot(t.x-P.x,t.y-P.y)>X.near)continue;for(let i=0;i<n;i++)if(!have.has(t.name+'|hunt|'+i))this.list.push(this.make(t,i))}
    for(const h of this.list)if(!fightHolds(h))h.step(d)}
  static drawAll(ents,cam,V){for(const h of this.list)h.draw(ents,cam,V)}
}
// its work in the world's frame (core/systems.js)
Systems.add({name:'hunters',order:{frame:144},frame:d=>Hunters.step(d)});
onWorld(()=>{Hunters.list=[]});
