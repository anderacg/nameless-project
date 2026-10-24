'use strict';
// Visual review: seed 0 wetland, 1 desert, 2 night wood, 3 frost, 4 returning flock. Real habitats with a few residents placed
// for inspection; the atlas shows their native pixel silhouettes at 4x. This is a scene, not a density or gameplay test.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,S=t.AMBV,A=t.AMBIENT;Kit.begin('soldier',73);Kit.clear();Kit.world();A.on=true;S.q=4242;
 const scene=+(new URLSearchParams(location.search).get('seed')||0),names=['Wetland residents','Desert residents','Woodland at night','Frost residents','Returning to the roost'],want=['duck','lizard','bat','hare','flock'][scene],cl=['swamp','desert','grass','frost','grass'][scene];let h=null;
 for(let y=0;y<Math.ceil(t.MH/A.homes.tiles)&&!h;y++)for(let x=0;x<Math.ceil(t.MW/A.homes.tiles)&&!h;x++)h=t.ambHomes(x,y).find(q=>q.k===want&&t.climAt(q.x,q.y)===cl)||null;
 if(!h)throw Error('No '+want+' habitat for visual scene');
 G.clock=t.DAY*(scene===2?.75:scene===4?.53:.25);P.x=h.x+(scene===2?25:50);P.y=h.y+8;P.tx=P.ty=null;G.paused=true;G.encCool=1e9;t.reveal();
 S.list.length=0;const add=(k,x,y,species)=>{const e=t.ambSpawn(k,x,y);e.t=1;e.species=species||null;S.list.push(e);return e},near=(k)=>{
  for(let r=1;r<6;r++)for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){const x=h.x+a*t.TILE,y=h.y+b*t.TILE;if(t.inSight(x,y)&&t.ambHabitat(k,x,y)&&Math.hypot(x-P.x,y-P.y)>A[k].scare)return{x,y}}
 };
 if(scene===0){add('duck',h.x,h.y);const p=near('heron');if(p)add('heron',p.x,p.y);const f=add('fish',h.x+2,h.y+4);f.t=.5}
 if(scene===1){add('lizard',h.x,h.y);add('vulture',h.x+5,h.y-5);const e=add('crow',h.x-12,h.y+8,'vulture');e.ak='visual';}
 if(scene===2){add('bat',h.x,h.y);add('owl',h.x+12,h.y-8);for(let i=0;i<6;i++){const x=h.x-12+i*4,y=h.y+8;t.ambHabitat('glow',x,y)&&add('glow',x,y)}}
 if(scene===3){add('hare',h.x,h.y);add('peck',h.x+8,h.y-8,'raven');const e=add('crow',h.x-12,h.y-10,'raven');e.ak='visual'}
 if(scene===4){const e=t.ambPlace(t.ambSpawn('flock',h.x,h.y),h);S.list.push(e);for(let i=0;i<12;i++){e.t+=.1;t.ambStep(e,.1,[],()=>true)}}
 for(const k of t.AMB_KINDS)A[k].every=1e9;performance.now=()=>1e7;t.updateHUD(true);t.drawWorld();
 const title=document.createElement('div');title.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:52px;z-index:9999;background:#17251fe8;color:#f0eddd;padding:7px 10px;font:14px Arial;pointer-events:none';title.textContent=names[scene]+' — ambient visual review';document.body.appendChild(title);
 const cv=document.createElement('canvas');cv.dataset.ambientAtlas='';cv.width=400;cv.height=96;cv.style.cssText='position:fixed;left:12px;bottom:12px;z-index:9999;pointer-events:none';document.body.appendChild(cv);const c=cv.getContext('2d', { willReadFrequently: true }),sp=t.ambSpr();c.imageSmoothingEnabled=false;c.fillStyle='#17251ff2';c.fillRect(0,0,400,96);c.font='10px Arial';c.fillStyle='#ede8d7';c.fillText('Sprite detail · 4× pixels',10,14);
 const atlas=[['bat',sp.bat[0]],['owl',sp.owl[1]],['heron',sp.heron[0]],['duck',sp.duck[0]],['lizard',sp.lizard[0]],['vulture',sp.vulture[1]],['raven',sp.raven[0][0]],['snow hare',sp.hare[1][0][0]]];
 atlas.forEach(([name,s],i)=>{const x=12+i*48;c.drawImage(s,x,28,4*s.width,4*s.height);c.fillStyle='#ede8d7';c.fillText(name,x,80)});
 ok(true,names[scene]+' drawn on a real resident habitat');info('Placed examples are for visual inspection; normal rates remain covered by ambient and ambientlife');
});
