'use strict';
// Deterministic obstacle fixtures: no campaign generation or wandering randomness.
Kit.suite(({ok})=>{
 const t=T,saved={w:t.MW,h:t.MH,tiles:t.tiles,climate:t.climate,shut:t.SHUT},rng=Math.random;
 window.requestAnimationFrame=()=>0;
 const fixture=(blocked)=>{const w=33,h=33,kind=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(!x||!y||x===w-1||y===h-1||blocked?.(x,y))kind[y*w+x]=t.T_WATER;
  window.__fleeFixture={w,h,kind};window.eval('MW=__fleeFixture.w;MH=__fleeFixture.h;tiles=__fleeFixture.kind;climate=new Uint8Array(MW*MH);SHUT=null');t.FleeRoutes.paths=new WeakMap();return kind};
 const point=(x,y)=>({x:(x+.5)*t.TILE,y:(y+.5)*t.TILE});
 try{
  fixture();const threat=point(4,10),open=point(8,10),x=open.x;t.Router.flee(open,threat,5);
  ok(open.x===x+5&&open.y===threat.y&&t.WALKED.get(open)===5,'open-ground flight keeps its heading, speed and actual movement accounting');
  fixture((x,y)=>(x===12||x===20)&&y>=10&&y<=18||y===18&&x>=12&&x<=20);
  const pursuer=point(16,7),old=point(16,15),animal=point(16,15),start=animal.y;
  for(let i=0;i<600;i++)t.walk(old,old.x-pursuer.x,old.y-pursuer.y,.8);
  ok(old.x>12*t.TILE&&old.x<21*t.TILE&&old.y>10*t.TILE&&old.y<19*t.TILE,'the old angle-steering rule reproduces the trapped U-shaped obstacle');
  let legal=true,backtrack=false,committed=false,first=null;
  for(let i=0;i<600;i++){const before={...animal};t.Router.flee(animal,pursuer,.8);legal=legal&&t.FleeRoutes.clear(before,animal)&&Math.hypot(animal.x-before.x,animal.y-before.y)<=.800001;backtrack=backtrack||animal.y<start-t.TILE;
   const route=t.FleeRoutes.paths.get(animal);if(!first)first=route;else if(route===first)committed=true}
  ok(backtrack&&(animal.x<12*t.TILE||animal.x>21*t.TILE)&&Math.hypot(animal.x-pursuer.x,animal.y-pursuer.y)>start-pursuer.y,'flight backs out of the pocket and escapes around the wall');
  ok(legal&&committed,'escape follows a committed route, stays on reachable ground and never exceeds its movement budget');
  fixture((x,y)=>x===17);const shore=point(16,16),hunter=point(14,16);let flips=0,last=0;
  for(let i=0;i<120;i++){const y=shore.y;t.Router.flee(shore,hunter,1);const dir=Math.sign(shore.y-y);if(last&&dir&&last!==dir)flips++;if(dir)last=dir}
  ok(flips<=1&&shore.x<17*t.TILE,'shoreline flight commits to one side instead of alternating left and right');
  fixture((x,y)=>x!==16||y!==16);const trapped=point(16,16),at={...trapped};for(let i=0;i<40;i++)t.Router.flee(trapped,point(14,16),4);
  ok(trapped.x===at.x&&trapped.y===at.y,'an enclosed entity waits rather than jittering or entering blocked ground');
  const cache=t.FleeRoutes.paths.get(trapped);t.Router.flee(trapped,point(22,16),1);
  ok(t.FleeRoutes.paths.get(trapped)!==cache,'a substantially shifted threat invalidates the escape route');
  const a=point(16,16);t.Router.flee(a,point(14,16),1);const route=t.FleeRoutes.paths.get(a);window.eval('WAYV++');t.Router.flee(a,point(14,16),1);
  ok(t.FleeRoutes.paths.get(a)!==route,'crossing changes invalidate a cached escape, including a failed one');
  fixture((x,y)=>x===17&&y===16||x===16&&y===17);const corner=point(16,16),corner0={...corner};t.Router.flee(corner,point(14,14),40);
  ok(t.FleeRoutes.clear(corner0,corner)&&!(corner.x>=17*t.TILE&&corner.y>=17*t.TILE),'a fast escape cannot cut through blocked diagonal corners');
  let draws=0;Math.random=()=>{draws++;return .5};fixture((x,y)=>x===17);const deterministic=point(16,16);for(let i=0;i<30;i++)t.Router.flee(deterministic,point(14,16),1);ok(draws===0,'escape routing consumes no simulation randomness');
 }finally{Math.random=rng;window.__fleeSaved=saved;window.eval('MW=__fleeSaved.w;MH=__fleeSaved.h;tiles=__fleeSaved.tiles;climate=__fleeSaved.climate;SHUT=__fleeSaved.shut');t.FleeRoutes.paths=new WeakMap();delete window.__fleeSaved;delete window.__fleeFixture}
});
