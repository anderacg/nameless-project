'use strict';
// Mobile polish: a phone on its side (Android Chrome, iOS Safari). The HUD, its buttons, the messages and the long-press card
// keep clear of a notch (the safe-area tokens --sa-*, here set by hand, as env() is 0 on a desktop); a pinch or double tap on the
// HUD never zooms the page (touch-action, iOS gesture events) while windows and the unit cards still scroll; the line ghost is
// bold on a small or touch screen and only draws; the page installs to a home screen when served (manifest, icons, iOS tags).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,random0=Math.random,root=document.documentElement;
  window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
  const cv=document.querySelector('canvas'),scr=document.getElementById('screen'),cs=el=>getComputedStyle(el),q=s=>document.querySelector(s),rect=el=>el.getBoundingClientRect();
  const SA={t:24,r:44,b:21,l:44},setSA=on=>{for(const k of ['t','r','b','l'])on?root.style.setProperty('--sa-'+k,SA[k]+'px'):root.style.removeProperty('--sa-'+k)};
  // (an element inside the safe area of the screen, 0.5 px leeway)
  const inside=(el,sides)=>{const r=rect(el),s=rect(scr),e=.5;return (!sides.includes('l')||r.left>=s.left+SA.l-e)&&(!sides.includes('r')||r.right<=s.right-SA.r+e)&&(!sides.includes('t')||r.top>=s.top+SA.t-e)&&(!sides.includes('b')||r.bottom<=s.bottom-SA.b+e)};
  const box=el=>{const r=rect(el),s=rect(scr);return Math.round(r.left-s.left)+','+Math.round(r.top-s.top)+' '+Math.round(r.width)+'x'+Math.round(r.height)};
  let icons=[];
  try{
    Math.random=t.seeded(5100);t.act('begin','soldier');G.quietEvents=true;t.W.lords=[];t.GUIDE.on=false;G.mode='world';G.modal=false;t.hidePanel();t.updateHUD(true);
    // ---- install to a home screen: the iOS tags, the touch icon, and the manifest (linked only when served over http(s)) ----
    const meta=n=>{const m=q('meta[name="'+n+'"]');return m?m.content:null},vp=meta('viewport')||'';
    ok(/viewport-fit=cover/.test(vp)&&/width=device-width/.test(vp),'the viewport covers the whole screen, notch included ('+vp+')');
    ok(meta('apple-mobile-web-app-capable')==='yes'&&meta('mobile-web-app-capable')==='yes'&&meta('apple-mobile-web-app-status-bar-style')==='black-translucent'&&meta('apple-mobile-web-app-title')==='Ashmark','the iOS home-screen tags are there (capable, translucent status bar, title)');
    const touchIcon=q('link[rel="apple-touch-icon"]');ok(touchIcon&&/icon-192\.png$/.test(touchIcon.getAttribute('href')),'an apple-touch-icon is linked');
    const linker=[...document.head.querySelectorAll('script')].find(s=>/manifest\.webmanifest/.test(s.textContent));
    ok(location.protocol==='file:'?!q('link[rel="manifest"]')&&!!linker:!!q('link[rel="manifest"]'),'the manifest is linked only when served ('+location.protocol+': '+(q('link[rel="manifest"]')?'linked':'not linked')+')');
    let man=null;try{const x=new XMLHttpRequest();x.open('GET','manifest.webmanifest',false);x.send();man=JSON.parse(x.responseText)}catch(e){o.push('FAIL the manifest reads as JSON: '+e.message)}
    if(man){const voidCol=cs(root).getPropertyValue('--void').trim().toLowerCase();
      ok(man.name==='Ashmark'&&man.short_name==='Ashmark'&&man.start_url&&man.orientation==='landscape'&&['fullscreen','standalone'].includes(man.display),'the manifest: Ashmark, landscape, '+man.display+', from '+man.start_url);
      ok(man.theme_color===voidCol&&man.background_color===voidCol&&meta('theme-color')===voidCol,'its colours are the CSS --void token ('+voidCol+'), as is the theme-color tag');
      const sz=man.icons.map(i=>i.sizes);ok(sz.includes('192x192')&&sz.includes('512x512')&&man.icons.some(i=>/maskable/.test(i.purpose||''))&&man.icons.every(i=>i.type==='image/png'),'its icons: 192 and 512 PNGs, one maskable');
      icons=man.icons.map(i=>({i,img:Object.assign(new Image(),{src:i.src})}))}
    // ---- touch-action: the HUD never zooms the page; its lists slide; windows scroll and never zoom ----
    const ta=el=>el?cs(el).touchAction:'(none there)';
    const hudOnes=['#stats','#wtop','.tbtn','.dbtn','#pause','.dock'].map(q);ok(ta(cv)==='none'&&hudOnes.every(el=>el&&ta(el)==='none'),'the canvas and the world HUD (party card, day bar, its buttons, the dock): touch-action none');
    ok(cs(root).overscrollBehaviorY==='none'&&cs(document.body).overscrollBehaviorY==='none','no pull-to-refresh or rubber band on the page');
    const ev=new Event('gesturestart',{bubbles:true,cancelable:true});q('.dbtn').dispatchEvent(ev);ok(ev.defaultPrevented,'an iOS gesture (pinch) begun on the HUD is stopped');
    t.openHelp();const pb=q('#panel button'),ov=q('#ov');ok(['pan-x pan-y','pan-y pan-x'].includes(ta(ov))&&['pan-x pan-y','pan-y pan-x'].includes(ta(q('#panel')))&&pb&&['pan-x pan-y','pan-y pan-x'].includes(ta(pb)),'a window and its buttons scroll both ways, never zoom ('+ta(q('#panel'))+')');t.closeOver();G.mode='world';G.modal=false;t.hidePanel();
    // ---- safe areas, on the map ----
    setSA(true);t.updateHUD(true);t.log('A message by the notch.');t.frame();ok(scr.dataset.mode==='world','on the map ('+scr.dataset.mode+')');
    const si=t.safeInsets();ok(si.t===SA.t&&si.r===SA.r&&si.b===SA.b&&si.l===SA.l,'the safe area reads in px off the HUD layer ('+JSON.stringify(si)+')');
    ok(inside(q('#stats'),'lt')&&inside(q('#wtop'),'t')&&inside(q('.dock'),'rb')&&inside(q('#log'),'lb'),'the map HUD clears the notch: party '+box(q('#stats'))+', day bar '+box(q('#wtop'))+', dock '+box(q('.dock'))+', messages '+box(q('#log')));
    // the long-press card: held by the left edge, the right edge, the top
    const tip=q('#tip'),s=rect(scr);t.holdCard('<b>Ashford</b><small class="act">Click: travel there</small>',s.left+3,s.top+200);
    ok(!tip.hidden&&tip.classList.contains('hold')&&rect(tip).left>=s.left+SA.l+6-.5,'a card held by the left edge stays clear of the notch ('+box(tip)+')');
    t.holdCard('<b>Ashford</b><small class="act">Click: travel there</small>',s.right-3,s.top+200);ok(rect(tip).right<=s.right-SA.r-6+.5,'and by the right edge ('+box(tip)+')');
    t.holdCard('<b>Ashford</b><small class="act">Click: travel there</small>',s.left+s.width/2,s.top+4);ok(rect(tip).top>=s.top+SA.t+6-.5&&rect(tip).bottom<=s.bottom-SA.b+.5,'held at the top: under the finger, inside the safe area ('+box(tip)+')');
    ok(rect(tip).width<=s.width-SA.l-SA.r-12+.5,'the card is never wider than the safe area');t.hideTip();
    // ---- safe areas, in a battle ----
    P.troops={hum_foot:4,hum_bow:3,hum_mage:2,hum_knight:2};P.comps={};G.enc={kind:'party',ref:{x:P.x+8,y:P.y,cool:0},list:['militia','archer','horse'],allies:[],foes:[]};
    t.BDEPLOY.on=false;t.BAUTO.on=false;t.startBattle({enemies:G.enc.list,tournament:false,deploy:true});const B=t.B;t.frame();B.paused=true;t.setOrderUI();t.log('A message in battle.');
    t.callout('The enemy wavers and falls back across the whole field',1,'mb_test',{major:true});t.calloutTick(0);
    const co=q('.bhud>.callouts');ok(scr.dataset.mode==='battle'&&inside(q('.btop'),'lt')&&inside(q('.btime'),'rt')&&inside(q('.bcmd'),'lrb')&&inside(q('#log'),'lt'),'the battle HUD clears the notch: power '+box(q('.btop'))+', time '+box(q('.btime'))+', orders '+box(q('.bcmd'))+', messages '+box(q('#log')));
    ok(!co||!co.children.length||inside(co,'lrt'),'the battle banners stay inside it too'+(co&&co.children.length?' ('+box(co)+')':' (none showing)'));
    ok(['.btop','.btime','.borders','.obtn','.btime .btn'].every(sel=>ta(q(sel))==='none')&&ta(q('.bcards'))==='pan-x'&&ta(q('.bcards .ucard'))==='pan-x'&&ta(q('.binfo'))==='pan-y','the battle HUD: no zoom; the unit cards still slide across ('+ta(q('.bcards .ucard'))+'), the selected unit down');
    setSA(false);const si0=t.safeInsets();ok(!si0.t&&!si0.r&&!si0.b&&!si0.l,'with no notch the insets are 0');
    t.holdCard('<b>X</b>',s.left+3,s.top+200);ok(Math.abs(rect(tip).left-(s.left+6))<.6,'and the card keeps its old 6 px margin');t.hideTip();
    // ---- the line ghost: bold on a phone, as it was on a desktop; it only draws ----
    const GH=t.GHOST,mq0=GH.mq;ok(GH.mq&&/pointer:\s*coarse/.test(GH.mq.media)&&/max-height:\s*600px/.test(GH.mq.media),'the bold ghost follows the compact media query ('+(GH.mq&&GH.mq.media)+')');
    const inf=t.playerGroups().find(g=>B.groups[g].role==='inf'&&t.grpUnits(g).length);B.sel=inf;B.rdrag={x0:400,y0:150,x1:400,y1:420,shift:false};
    const snap=()=>JSON.stringify([B.sel,B.rdrag,Object.values(B.groups).map(g=>[g.id,g.ax,g.ay,g.face,g.files,g.form,g.order]),B.units.map(u=>[u.x,u.y,u.hp])]);
    const c=t.ctx,st0=c.stroke,fr0=c.fillRect;let lines=[],dots=[];c.stroke=function(){lines.push(this.lineWidth);return st0.apply(this,arguments)};c.fillRect=function(x,y,w,h){dots.push(w);return fr0.apply(this,arguments)};
    let randoms=0;const sd=t.seeded(5200);Math.random=()=>{randoms++;return sd()};const before=snap();
    const run=bold=>{GH.mq={matches:bold,media:'test'};lines=[];dots=[];c.save();t.drawFormGhost();c.restore();return{line:Math.max(...lines),dot:Math.max(...dots),n:dots.length}};
    let plain,bold;try{plain=run(false);bold=run(true)}finally{c.stroke=st0;c.fillRect=fr0;GH.mq=mq0}
    const r=rect(cv),k=cv.width/r.width/(B.cam?B.cam.z:1),F=t.FORMS.line;
    ok(plain.line===1&&plain.dot===4,'on a desktop the ghost is as it was: a 1 px line, 4 px dots');
    ok(bold.line>=Math.max(1,GH.line*k)-1e-6&&bold.line>plain.line*1.5,'on a phone its line is '+GH.line+' CSS px over a dark edge ('+(bold.line/k).toFixed(1)+' CSS px in all; it was '+(1/k).toFixed(2)+' CSS px)');
    ok(bold.dot>plain.dot&&bold.dot<=Math.min(F.gx,F.gy)*.7+2*Math.max(1,k)+1e-6,'its slot dots are bigger ('+bold.dot.toFixed(1)+' field px with their dark edge), still apart');
    ok(snap()===before&&!randoms,'drawing the ghost changes nothing in the battle and draws on no chance');
    ok(c.lineWidth===1&&c.lineCap==='butt','and leaves the brush as it found it');
    let drew=true;try{GH.mq={matches:true,media:'test'};t.frame()}catch(e){drew=false}finally{GH.mq=mq0}ok(drew,'a whole frame draws with the bold ghost');
    B.rdrag=null;
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=random0;setSA(false)}
  const end=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
  // the icons load at the sizes the manifest says
  const wait=Date.now();const done=()=>{if(icons.some(x=>!x.img.complete)&&Date.now()-wait<3000)return setTimeout(done,50);
    if(icons.length)ok(icons.every(x=>x.img.naturalWidth+'x'+x.img.naturalHeight===x.i.sizes),'the icons load at their sizes ('+icons.map(x=>x.i.src+' '+x.img.naturalWidth+'x'+x.img.naturalHeight).join(', ')+')');end()};
  done();
};
