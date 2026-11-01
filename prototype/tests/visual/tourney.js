'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
// Not a test (run by name: -Suites visual/tourney): the sheet of the arena (gfx/tourney.js TourneyArena; the owner, 2026-11-01:
// "can you have some small arena battle screen instead of open green field?"). Each culture and climate's ring as a bout in its
// lists opens there (the real start: setup.js), its two fighters in it (render.js drawUnit), the field's edge shade as render.js
// lays it: the whole picture painted (the field and its margins) at 1x, then its middle at 2x; the first with the views a 16:9
// screen, a phone on its side and a 4:3 screen see (camera.js camFit), one with the crowd cheering a blow, one roaring at the
// end; last, the battle's own first frame (render.js drawBattle) on this window's canvas. Its picture is the IMG line, a PNG.
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,A=t.TOURNEY_ARENA,now0=performance.now,setCtx=(0,eval)('c=>{const k=ctx;ctx=c;return k}');
 try{
  Kit.begin('soldier',3);G.quietEvents=true;t.GUIDE.on=false;
  // (the HUD's edges as a desktop screen measures them, every bout alike: this small window's HUD covers far more of it)
  window.__tourneyMeasure=t.measureField;(0,eval)('measureField=()=>({top:32,bot:229})');
  const looks=[['Vale, on grass (Ashford)','Ashford',null,null],['Salt League, in the marsh (Brinewatch)','Brinewatch',null,'hit'],['Karn, in the frost (Dunrak)','Dunrak',null,null],
   ['Ashgor, in the desert (Greywell)','Greywell',null,'roar'],['Sylvan, on grass (Elderglen)','Elderglen',null,null],['Vale, in the frost','Ashford',{climate:'frost'},null]];
  const [MX,MY]=A.margin,PW=t.FIELD_SIZES.tourney.w,PH=t.FIELD_SIZES.tourney.h,shots=[];
  for(const [label,town,more,mood] of looks){G.mode='world';G.modal=false;t.hidePanel();G.enc=null;G.town={ref:t.townBy(town),tab:'tourney'};
   t.startBattle({enemies:['chief'],tournament:true,arena:more||true});const B=t.B,h=B.hero,c=B.units.find(u=>u.team===1),W=t.BW+2*MX,H=t.BH+2*MY;
   if(mood){h.x=t.BW/2-9;c.x=t.BW/2+9;h.face=1;c.face=-1}
   performance.now=()=>777000;const C=B.arena.crowd;C.watch(777);C.cheers=[];if(mood==='hit')C.cheer(c.x,1.1,776.6);if(mood==='roar')C.cheer(t.BW/2,1.4,776.4,true,'roar');
   const cv=t.mkc(W,H,()=>{}),g=cv.getContext('2d'),k=setCtx(g);
   g.save();try{g.translate(MX,MY);B.arena.drawView(g,-MX,-MY,t.BW+MX,t.BH+MY);
     const top=t.fieldTop()-t.FIELD_EDGE.body+6,bot=t.fieldBot()+4;g.fillStyle='rgba(8,10,16,.35)';g.fillRect(0,-MY,t.BW,top+MY);g.fillRect(0,bot,t.BW,t.BH+MY-bot);g.fillStyle='rgba(232,224,200,.18)';g.fillRect(0,top,t.BW,1);g.fillRect(0,bot,t.BW,1);
     for(const u of [...B.units].sort((a,b)=>a.y-b.y))t.drawUnit(u)}finally{g.restore();setCtx(k);performance.now=now0}
   shots.push({label,cv,B,key:B.arena.key,ring:[B.ftop,B.fbot],h:{x:h.x,y:h.y},c:{x:c.x,y:c.y},seats:B.arena.seats.length});
   o.push('INFO '+label+': key '+B.arena.key+'; ring rows '+B.ftop+'-'+B.fbot+'; fighters '+Math.round(c.x-h.x)+' px apart; '+B.arena.seats.length+' seats; camera x'+t.camFit().toFixed(2));
   if(label===looks[looks.length-1][0])break;B.over=true;B.endT=0;B.units.filter(u=>u.team===1).forEach(u=>u.hp=0);t.finishBattle();t.hidePanel()}
  // ---- the sheet
  const W=PW+2*MX,H=PH+2*MY,Z=2,cw=W+Z*W/2+24,out=document.createElement('canvas');out.width=cw;out.height=shots.length*(H+22)+H+40;const g=out.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#14121a';g.fillRect(0,0,out.width,out.height);
  const label=(s,x,y)=>{g.fillStyle='#e4e0cf';g.font='12px Arial';g.fillText(s,x,y)};let y=16;
  shots.forEach((s,i)=>{label(s.label+(i===0?': the views of a 16:9 screen (yellow), a phone on its side (cyan) and a 4:3 screen (pink)':''),8,y);y+=6;g.drawImage(s.cv,8,y);
   if(i===0)for(const [aspect,col] of [[16/9,'#e8d050'],[844/390,'#50d0e8'],[4/3,'#e070c0']]){const vw=Math.round(600*aspect),z=Math.min(vw/PW,600/PH),w=vw/z,hh=600/z;g.strokeStyle=col;g.lineWidth=1;g.strokeRect(8+MX+(PW-w)/2+.5,y+MY+(PH-hh)/2+.5,w-1,hh-1)}
   const cx=MX+Math.round((s.h.x+s.c.x)/2),cy=MY+Math.round((s.ring[0]+s.ring[1])/2)-30,sw=W/2,sh=H/2,sx=Math.max(0,Math.min(W-sw,cx-sw/2)),sy=Math.max(0,Math.min(H-sh,cy-sh/2));
   g.drawImage(s.cv,sx,sy,sw,sh,16+W,y,sw*Z,sh*Z);y+=H+16});
  // ---- the battle's own frame, on this window's canvas
  {const B=t.B;performance.now=()=>778000;try{t.drawBattle()}finally{performance.now=now0}const src=document.querySelector('canvas');label('the battle\'s own frame (render.js drawBattle), this window\'s canvas '+src.width+'x'+src.height,8,y);y+=6;
   const k=Math.min(1,(cw-16)/src.width,(out.height-y-8)/src.height);g.drawImage(src,8,y,src.width*k,src.height*k);B.over=true;B.endT=0;B.units.filter(u=>u.team===1).forEach(u=>u.hp=0);t.finishBattle()}
  o.push('INFO sheet '+out.width+'x'+out.height+'; the field '+PW+'x'+PH+' with '+MX+'x'+MY+' px painted beyond it');
  o.push('IMG '+out.toDataURL('image/png'));
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 finally{performance.now=now0;if(window.__tourneyMeasure){(0,eval)('measureField=window.__tourneyMeasure');delete window.__tourneyMeasure}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
