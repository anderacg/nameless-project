'use strict';
// Not a test: a battle's field where the world puts it (battle follows the world, doc/TERRAIN_DESIGN.md §8), for a screenshot.
// Ashmark.html?test=visual/battleworld&at=x,y[&off=1][&size=big][&zones=1]: the generated world's tile (x, y), its field built and
// painted as a battle's (BattleSite, terrainOf, buildTerrain, PX.battleGround over the climate's arena) with its standing props,
// whole at x1; off=1 the same with TERRAIN_WORLD off (the field as it was before: the "before" shot); mirror=0 a climates' edge
// as the world lays it (TERRAIN_MIX.mirror off); zones=1 the deployment zones' outlines. A line of words: the tile, its site's
// world (mix, pond, brook, lane, lots) and the field's words.
window.RUN=()=>{const t=T,o=[],q=new URLSearchParams(location.search);
 try{
  if(q.get('mirror')==='0')t.TERRAIN_MIX.mirror=false;
  window.requestAnimationFrame=()=>0;(0,eval)('TERRAIN.on=true;FIELD_SIZES.on=true');
  const [x,y]=(q.get('at')||'246,45').split(',').map(Number),off=!!q.get('off');t.fieldSet(q.get('size')||'big');t.TERRAIN_WORLD.on=!off;
  t.P.x=(x+.5)*16;t.P.y=(y+.5)*16;const S=t.WM.battleSite(x,y),env=t.battleEnv(false,S),g=t.terrainOf(S,env),W=t.BW,H=t.BH,T0=t.buildTerrain({...g,W,H,top:24,bot:H-8});
  const cv=t.PX.battleGround({...T0,climate:env.c,base:t.paintArena(env.c)}),lab=40,pg=document.createElement('canvas');pg.width=W;pg.height=H+lab;
  pg.style.cssText='position:absolute;left:0;top:0;z-index:9999';document.body.appendChild(pg);const c=pg.getContext('2d', { willReadFrequently: true });c.imageSmoothingEnabled=false;c.fillStyle='#1a1c26';c.fillRect(0,0,pg.width,pg.height);
  c.drawImage(cv,0,lab);c.save();c.translate(0,lab);t.PX.battleProps(c,cv);
  if(q.get('zones')){c.strokeStyle='rgba(255,255,255,.55)';c.setLineDash([6,4]);for(const tm of [0,1]){const z=t.fieldZone(tm);c.strokeRect(z.x0+.5,24.5,z.x1-z.x0,H-32)}}
  c.restore();const w=S.mix?'mix '+S.mix.c+' '+S.mix.share.toFixed(2):'',p=S.pond?'pond '+S.pond.kind:'',b=S.brook?'brook':'',l=S.lane?(S.lane.track?'track':'lane'):'',lt=S.lots?'lots '+S.lots.length:'';
  c.fillStyle='#e8e0c8';c.font='13px Arial';c.fillText((off?'BEFORE':'AFTER')+' · '+x+','+y+' · '+env.name+' ('+env.c+', '+g.recipe+'/'+T0.recipe.layout+') · '+[w,p,b,l,lt].filter(Boolean).join(' · '),6,15);
  c.font='11px Arial';c.fillText((T0.recipe.text||'').slice(0,230),6,32);
  o.push('PASS drawn '+x+','+y+' '+(off?'off':'on'));
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.style.display='none';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
