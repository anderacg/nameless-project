'use strict';
window.ARENA=true;// (the battle screen's own field: tests/harness.js)
// Not a test (run by name: -Suites visual/sharpbattle): the battle screen drawn sharp (core.js bview; the owner, 2026-11-01: "why
// separated battle screen seems not sharp like the world screen?"), before and after. The game's page in a frame at a real
// window's size (?v=; tests/sharpbattle.js's page), a lab battle of 150 on a large field with its terrain: the same piece of the
// screen as the screen shows it, today's canvas (RENDER.sharpBattle off: BVW x BVH stretched to the window, pixelated, as the
// browser does) beside the sharp one, the whole field and zoomed in, each piece enlarged 2x. Its picture is the IMG line, a PNG
// as a data URL. Then the cost: ms a drawn frame (frame(), paused, its pixels made (a pixel read back: the canvas draws lazily), the best of RUNS runs of N), before and after, on a desktop
// (1920 x 1080, density 1) and a phone on its side (844 x 390, density 3) at each Resolution (Full, Balanced, Fast)
window.RUN=()=>{const RUNS=3,N=20;
  const o=[],info=m=>o.push('INFO '+m);let done=false;window.requestAnimationFrame=()=>0;Kit.fresh();
  const finish=()=>{if(done)return;done=true;clearTimeout(timer);document.querySelectorAll('iframe').forEach(f=>f.remove());const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
  const timer=setTimeout(()=>{o.push('FAIL the pages and their measures finish within 280 seconds');finish()},280000);
  const open=(W,H,dpr)=>new Promise((res,rej)=>{const f=document.createElement('iframe');f.width=W;f.height=H;f.style.cssText='position:absolute;left:-12000px;top:0;border:0';
    f.src='Ashmark.html?test=sharpbattle&v=1';document.body.appendChild(f);const t0=performance.now();
    const poll=()=>{const w=f.contentWindow;if(w&&w.SHARP_READY){Object.defineProperty(w,'devicePixelRatio',{configurable:true,value:dpr});w.eval('fitScreen()');return res(f)}
      if(performance.now()-t0>90000)return rej(Error('the page in the frame never came up'));setTimeout(poll,100)};poll()});
  const battle=w=>w.eval(`TERRAIN.on=true;G.mode='world';G.modal=false;hidePanel();BattleLab.start({leftGroups:[{type:'hum_foot',count:40},{type:'hum_bow',count:20},{type:'hum_knight',count:15}],rightGroups:[{type:'orc_grunt',count:40},{type:'dw_sling',count:20},{type:'hum_knight',count:15}],deploy:false,ai:false,paused:true,morale:false,seed:7,size:'large',distance:300});B.cmdT=1e9;B.sel='lab_l_0';setOrderUI();frame()`);
  // (the screen as shown, in device px: today's canvas stretched to it pixelated, or the sharp canvas as it is)
  const shown=w=>{const cv=w.document.getElementById('game'),r=cv.getBoundingClientRect(),d=w.eval('dprOf()'),W=Math.round(r.width*d),H=Math.round(r.height*d);
    return T.mkc(W,H,g=>{g.imageSmoothingEnabled=false;g.drawImage(cv,0,0,W,H)})};
  // (the camera on the left army's foot at device scale px a field px (sharp) or view zoom z (today's), drawn a few times)
  const look=(w,sharp,{px,z})=>{w.eval(`RENDER.sharpBattle=${sharp};camReset();frame()`);if(px||z)w.eval(`B.cam.ease=null;B.cam.fit=false;B.cam.z=${px?px+'/bview().k':z};const m=grpUnits('lab_l_0');camCentre(m.reduce((a,u)=>a+u.x,0)/m.length+40,m.reduce((a,u)=>a+u.y,0)/m.length-10)`);
    for(let i=0;i<4;i++)w.eval('frame()');return shown(w)};
  (async()=>{
    try{
      // ---- the picture: 1920 x 1080 at density 1 (1.8 device px a view px)
      {const f=await open(1920,1080,1),w=f.contentWindow;battle(w);
        const K=w.eval('RENDER.sharpBattle=true;bview().k'),far=w.eval('camZooms()[0]*bview().k');
        const rows=[['the whole field',{},{}],['zoomed in a step',{z:w.eval('BCAM.zooms.find(z=>z>camFit()+.01)')},{px:2}],['zoomed in further',{z:1.5},{px:3}],['closest',{z:3},{px:w.eval('Math.round(BCAM.zooms[BCAM.zooms.length-1]*bview().k)')}]];
        const CW=440,CH=250,S=2,pad=8,top=20,rowH=CH*S+top+pad,sheet=T.mkc(2*CW*S+3*pad,rows.length*rowH+pad,()=>{}),g=sheet.getContext('2d');
        g.fillStyle='#14161c';g.fillRect(0,0,sheet.width,sheet.height);g.imageSmoothingEnabled=false;g.font='14px Arial';g.fillStyle='#e8e4d0';
        rows.forEach(([name,before,after],i)=>{const y=pad+i*rowH;
          for(const [j,sharp,o,lab] of [[0,false,before,'today'],[1,true,after,'sharp']]){const pic=look(w,sharp,o),dz=w.eval('B.cam.z')*K;
            // (the piece: round the left army's foot (view px to the screen's device px: K, or today's stretch))
            const m=w.eval(`(()=>{const m=grpUnits('lab_l_0');return fromField({x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length})})()`),kx=sharp?K:pic.width/w.eval('BVW'),ky=sharp?K:pic.height/w.eval('BVH');
            const sx=Math.round(Math.min(pic.width-CW,Math.max(0,m.x*kx-CW/2))),sy=Math.round(Math.min(pic.height-CH,Math.max(0,m.y*ky-CH/2)));
            const x=pad+j*(CW*S+pad);g.drawImage(pic,sx,sy,CW,CH,x,y+top,CW*S,CH*S);g.fillText(name+': '+lab+' ('+(+dz.toFixed(3))+' device px a field px'+(sharp?'':', stretched')+')',x,y+15)}});
        info('the sheet: 1920 x 1080 at density 1, '+K+' device px a view px; the whole field at '+(+far.toFixed(3))+' sharp');
        o.push('IMG '+sheet.toDataURL('image/png'));f.remove()}
      // ---- the cost: ms a frame, before and after
      // (the same view both ways: the whole field, or 2 device px a field px on the left army's foot; each set drawn in turn, RUNS rounds, the best)
      const set=(w,sharp,zoom)=>{w.eval(`RENDER.sharpBattle=${sharp};camReset();B.cam.ease=null;B.cam.fit=false;B.cam.z=${zoom?'2*BVH/(MAPZOOM.vh*MAPZOOM.s0)':'camZooms()[0]'};const m=grpUnits('lab_l_0');camCentre(m.reduce((a,u)=>a+u.x,0)/m.length,m.reduce((a,u)=>a+u.y,0)/m.length)`)},draw=w=>w.eval('frame();ctx0.getImageData(0,0,1,1)');
      const costs=w=>{const K=[[false,false],[true,false],[false,true],[true,true]],best=K.map(()=>1e9);for(const k of K){set(w,...k);for(let i=0;i<8;i++)draw(w)}
        for(let r=0;r<RUNS;r++)K.forEach((k,j)=>{set(w,...k);draw(w);const a=w.performance.now();for(let i=0;i<N;i++)draw(w);best[j]=Math.min(best[j],(w.performance.now()-a)/N)});return best};
      for(const [W,H,dpr,caps] of [[1920,1080,1,[['Full',1e9]]],[844,390,3,[['Full',1e9],['Balanced',2],['Fast',1.5]]]]){const f=await open(W,H,dpr),w=f.contentWindow;battle(w);
        for(const [name,cap] of caps){w.eval(`RENDER.cap=${cap};fitScreen()`);const cvs=s=>{w.eval(`RENDER.sharpBattle=${s};frame()`);const c=w.document.getElementById('game');return c.width+'x'+c.height};
          const [a,b,c,d]=costs(w);
          info(W+' x '+H+' density '+dpr+', '+name+': today '+cvs(false)+' '+a.toFixed(1)+' ms (zoomed '+c.toFixed(1)+'), sharp '+cvs(true)+' '+b.toFixed(1)+' ms (zoomed '+d.toFixed(1)+'): x'+(b/a).toFixed(2)+' (zoomed x'+(d/c).toFixed(2)+')')}
        f.remove()}
    }catch(e){o.push('EXC '+e.message+' '+e.stack)}
    finish()})();
};
