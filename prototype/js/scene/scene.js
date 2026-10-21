'use strict';
/* ---------- scenes: walkable maps of the places you enter ---------- */
// G.scene = {kind, ref (the place's name), W, H, tiles, blds, npcs, folk, deco, gate, p (you)}. Tiles: S_GROUND and S_PATH
// are walkable, S_SOLID (walls, buildings, trees, stalls) and S_WATER are not, S_PIER is walkable over water.
// A kind of place has a scene once SCENES has a generator for it. Its text panel stays the quick way in, with a choice to
// walk in; inside, talking to someone opens the panel tab they keep, and walking out through the gate goes back to the panel.
// World time stands still inside, as it does in the panels.
const S_GROUND=0,S_PATH=1,S_SOLID=2,S_WATER=3,S_PIER=4;
const SCENES={town:{gen:t=>genTown(t),hint:'Walk the streets'}};// by name: a holding's kind says which it has (holdings.js scene)
const hasScene=t=>!!(t&&SCENES[t.T.scene]);
const sceneAt=(S,tx,ty)=>tx<0||ty<0||tx>=S.W||ty>=S.H?S_SOLID:S.tiles[ty*S.W+tx];
const sceneOpen=(S,tx,ty)=>{const v=sceneAt(S,tx,ty);return v===S_GROUND||v===S_PATH||v===S_PIER};
// can something stand at pixel (x, y)? its feet are a small box
const sceneFree=(S,x,y)=>[[-4,0],[4,0],[-4,-3],[4,-3]].every(([dx,dy])=>sceneOpen(S,Math.floor((x+dx)/TILE),Math.floor((y+dy)/TILE)));
const SCENE_SPD=64,FOLK_SPD=20,TALK_R=20;

/* in and out */
function enterScene(t){
  if(!hasScene(t))return;const S=SCENES[t.T.scene].gen(t);G.scene=S;
  S.p={x:S.start.x,y:S.start.y,dir:1,path:null,goal:null,moving:false,t:0};
  if(G.town)G.town.inScene=false;G.mode='scene';hidePanel();updateHint();log('You walk into '+t.name+'.');
}
// out through the gate: back to the place's panel
function exitScene(){G.scene=null;G.mode='town';if(G.town){G.town.inScene=false;renderTown()}else toWorld();updateHint()}
// back from a panel or a talk to the street
function backToScene(){if(!G.scene)return;if(G.town)G.town.inScene=false;G.mode='scene';hidePanel();updateHint()}

/* paths: breadth-first over the tiles, 4 ways */
function scenePath(S,fx,fy,tx,ty){
  if(!sceneOpen(S,tx,ty))return null;const W=S.W,prev=new Int32Array(W*S.H).fill(-1),q=[fy*W+fx];prev[fy*W+fx]=fy*W+fx;
  for(let h=0;h<q.length;h++){const i=q[h];if(i===ty*W+tx)break;const x=i%W,y=(i/W)|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,j=ny*W+nx;if(sceneOpen(S,nx,ny)&&prev[j]<0){prev[j]=i;q.push(j)}}}
  if(prev[ty*W+tx]<0)return null;const out=[];for(let i=ty*W+tx;i!==fy*W+fx;i=prev[i])out.push({x:(i%W+.5)*TILE,y:((i/W|0)+1)*TILE-3});return out.reverse();
}
// the nearest open tile to a pixel
function sceneNearOpen(S,x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);for(let r=0;r<4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(sceneOpen(S,tx+dx,ty+dy))return[tx+dx,ty+dy];return null}
// step o toward (x, y) by up to d pixels, sliding along walls; true if it moved
function sceneStep(S,o,x,y,d){
  const dx=x-o.x,dy=y-o.y,l=Math.hypot(dx,dy);if(l<.5)return false;const k=Math.min(1,d/l),nx=o.x+dx*k,ny=o.y+dy*k;let moved=false;
  if(sceneFree(S,nx,o.y)){o.x=nx;moved=true}if(sceneFree(S,o.x,ny)){o.y=ny;moved=true}if(Math.abs(dx)>.3)o.dir=dx>0?1:-1;return moved;
}

/* people */
const sceneNear=S=>{let best=null,bd=TALK_R;for(const n of S.npcs){const d=Math.hypot(n.x-S.p.x,n.y-S.p.y);if(d<bd){bd=d;best=n}}for(const f of S.folk){const d=Math.hypot(f.x-S.p.x,f.y-S.p.y);if(d<bd*.8){bd=d;best=f}}return best};
function sceneUse(){const S=G.scene;if(!S||G.modal)return;const n=sceneNear(S);if(n)sceneTalk(n)}
function sceneTalk(n){
  const S=G.scene,t=townBy(S.ref);S.p.goal=null;S.p.path=null;
  if(n.folk)return sceneSay(n.name||'A townsperson','&ldquo;'+sceneGossip(t)+'&rdquo;');
  if(n.lord){const l=W.lords.find(x=>x.id===n.lord);if(l&&!l.dead)return lordMeet(l);return}
  if(n.guard)return sceneSay('Guard','&ldquo;'+(hostileTo(t.owner)?'Keep your hand off your sword, stranger.':'Move along. The gate shuts at nightfall.')+'&rdquo;');
  const R=SCENE_ROLES[n.role];
  if(n.role==='priest'){const fresh=t.blessDay!==G.day;if(fresh){t.blessDay=G.day;P.morale=clamp(P.morale+BLESSING.morale,0,100);updateHUD(true)}
    return sceneSay(R.n,'&ldquo;'+R.say+'&rdquo;'+(fresh?'<br><span class="good">You rest in the cool of the temple. Morale +'+BLESSING.morale+'.</span>':'<br><span class="muted">You have prayed here today.</span>'))}
  if(R.tab&&G.town){G.town.tab=R.tab;G.town.bld=null;G.town.direct=true;G.town.inScene=true;G.town.greet=R.n+': &ldquo;'+R.say+'&rdquo;';G.mode='town';renderTown();updateHint()}
}
function sceneSay(who,html){showPanel('<h2>'+who+'</h2><p>'+html+'</p>'+nav(null,['scene-back',null,'Back to the streets']))}
// a townsperson's news: the place itself, a war, a monster abroad, or idle talk
function sceneGossip(t){
  const opts=[...SCENE_GOSSIP];ensureEcon(t);
  const short=Object.keys(GOODS).filter(g=>itemGood(g)&&marketState(t,g)==='shortage').map(g=>GOODS[g].n.toLowerCase());if(short.length)opts.push('We are short of '+short.slice(0,2).join(' and ')+'. Prices are up.');
  if(foodDays(t)<3)opts.push('There is hardly any bread left. People are leaving.');
  const war=FIDS.flatMap(a=>FIDS.filter(b=>a<b&&atWar(a,b)).map(b=>[a,b]))[0];if(war)opts.push('The '+FACS[war[0]].n+' and the '+FACS[war[1]].n+' are at war. Bad for trade.');
  const myth=mythicNews('was seen');if(myth)opts.push(myth+' Nobody sleeps well.');
  return opts[rint(0,opts.length-1)];
}

/* the update */
function updateScene(dt){
  const S=G.scene;if(!S||G.modal)return;const p=S.p,d=dt;let mv=0,my=0;
  if(G.keys.w||G.keys.arrowup)my--;if(G.keys.s||G.keys.arrowdown)my++;if(G.keys.a||G.keys.arrowleft)mv--;if(G.keys.d||G.keys.arrowright)mv++;
  const run=SCENE_SPD*(G.keys.shift?1.5:1);p.moving=false;
  if(mv||my){p.path=null;p.goal=null;const l=Math.hypot(mv,my);p.moving=sceneStep(S,p,p.x+mv/l*20,p.y+my/l*20,run*d)}
  else if(p.path&&p.path.length){const w=p.path[0];p.moving=sceneStep(S,p,w.x,w.y,run*d);if(Math.hypot(w.x-p.x,w.y-p.y)<2)p.path.shift();else if(!p.moving)p.path=null}
  if(p.goal&&Math.hypot(p.goal.x-p.x,p.goal.y-p.y)<TALK_R){const g=p.goal;p.goal=null;p.path=null;return sceneTalk(g)}
  if(p.moving)p.t+=d;
  // out of the gate
  if(p.y>S.H*TILE-6)return exitScene();
  for(const f of S.folk){
    if(f.wait>0){f.wait-=d;f.moving=false;continue}
    if(!f.path||!f.path.length){const tgt=S.walk[rint(0,S.walk.length-1)];f.path=scenePath(S,Math.floor(f.x/TILE),Math.floor(f.y/TILE),tgt[0],tgt[1])||[];if(!f.path.length)f.wait=1+Math.random()*2;continue}
    const w=f.path[0];f.moving=sceneStep(S,f,w.x,w.y,FOLK_SPD*d);if(Math.hypot(w.x-f.x,w.y-f.y)<2)f.path.shift();else if(!f.moving){f.path=null;f.wait=.5}
    if(!f.path||!f.path.length)f.wait=1+Math.random()*3;f.t=(f.t||0)+d;
  }
}
// a click: walk there, or to someone and talk to them
function sceneClick(sx,sy){
  const S=G.scene;if(!S)return;const c=sceneCam(S),x=c.x+sx/SCENE_ZOOM,y=c.y+sy/SCENE_ZOOM;
  const who=[...S.npcs,...S.folk].find(n=>Math.hypot(n.x-x,n.y-(y+6))<10);
  if(who&&Math.hypot(who.x-S.p.x,who.y-S.p.y)<TALK_R)return sceneTalk(who);
  const to=sceneNearOpen(S,who?who.x:x,who?who.y-2:y);if(!to)return;
  S.p.path=scenePath(S,Math.floor(S.p.x/TILE),Math.floor(S.p.y/TILE),to[0],to[1]);S.p.goal=who||null;
}
// the camera: centred on you, kept inside the map
function sceneCam(S){const vw=VW/SCENE_ZOOM,vh=VH/SCENE_ZOOM,mw=S.W*TILE,mh=S.H*TILE;
  return{x:Math.round(mw<=vw?(mw-vw)/2:clamp(S.p.x-vw/2,0,mw-vw)),y:Math.round(mh<=vh?(mh-vh)/2:clamp(S.p.y-vh/2,0,mh-vh))}}

function sceneAct(a){
  if(a==='scene-enter'){const t=G.town&&G.town.ref;if(t)enterScene(t);return true}
  if(a==='scene-back'){backToScene();return true}
  if(a==='scene-exit'){exitScene();return true}
  return true;
}
onAct('scene-',sceneAct);
