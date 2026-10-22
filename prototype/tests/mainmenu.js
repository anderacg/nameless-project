'use strict';
// The main menu (ui/mainmenu.js) on the game's own page, loaded in a frame as a player opens it (no ?test=, so no world made at
// load): no map, holdings or camps until a campaign starts or a save loads; the menu alone, its four buttons, Continue dimmed with
// no save; the arrows move between the buttons and Esc does nothing there; New Campaign opens the New game page (with WORLD.gen a
// past then the New world screen, whose Back comes back); it fits a phone on its side (844 x 390) and a desktop (1600 x 900); its
// scene is seeded (drawn twice, the same pixels); a campaign started makes the world, and the Esc menu's Main menu lets it go again.
window.RUN=()=>{
  const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);let done=false;
  window.requestAnimationFrame=()=>0;Kit.fresh();
  const gen0=/[?&]gen=0/.test(location.search),frame=document.createElement('iframe');frame.width=844;frame.height=390;frame.style.cssText='position:absolute;left:-12000px;top:0;border:0';
  const finish=()=>{if(done)return;done=true;clearTimeout(timer);frame.remove();const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
  const timer=setTimeout(()=>{ok(false,'the page and its checks finish within 60 seconds');finish()},60000);
  const later=(ms,fn)=>setTimeout(()=>{try{fn()}catch(e){o.push('EXC '+e.message+' '+e.stack);finish()}},ms);
  frame.onload=()=>later(400,()=>{
    const w=frame.contentWindow,d=frame.contentDocument,ev=s=>w.eval(s),mm=d.getElementById('mainmenu'),q=s=>mm.querySelector(s);
    const errs=[];w.addEventListener('error',e=>errs.push(e.message));
    // ---- at load: no world, the menu alone
    ok(ev('WM')===null&&ev('TOWNS.length')===0&&ev('CAMP_SPOTS.length')===0&&ev('MADE_HOLDINGS.length')===0,'the page opens with no world made: no map, holdings or camps');
    ok(ev('G.mode')==='title'&&ev('G.menu')==='main'&&!mm.hidden&&d.getElementById('ov').hidden&&d.getElementById('screen').dataset.mode==='title','on the main menu, alone (no window over it, the HUD hidden)');
    const names=[...mm.querySelectorAll('.mm-btn')].map(b=>b.textContent);
    ok(names.join()==='New Campaign,Continue,Settings,Quit','its four buttons: '+names.join(', '));
    ok(q('[data-mm="continue"]').disabled&&/No saved game/.test(q('[data-mm="continue"]').title),'Continue is dimmed with no save');
    // ---- it fits: every button and the lore on the screen, apart; no scrolling; buttons big enough for a thumb
    const fits=(W,H,tag)=>{const ban=q('.mm-banner').getBoundingClientRect(),lore=q('.mm-lore').getBoundingClientRect(),bs=[...mm.querySelectorAll('.mm-btn,.mm-more button')].map(b=>b.getBoundingClientRect());
      const inside=r=>r.left>=0&&r.top>=0&&r.right<=W+.5&&r.bottom<=H+.5;
      ok(bs.every(inside)&&inside(lore)&&lore.left>=ban.right&&d.documentElement.scrollWidth<=W&&d.documentElement.scrollHeight<=H,tag+': the buttons and the lore fit, apart, nothing scrolls (banner '+Math.round(ban.width)+' px, lore at '+Math.round(lore.left)+')');
      ok(bs.slice(0,4).every(r=>r.height>=40&&r.width>=150),tag+': the four buttons big enough to press ('+bs.slice(0,4).map(r=>Math.round(r.width)+'×'+Math.round(r.height)).join(', ')+')');
      const em=q('.mm-emblem canvas').getBoundingClientRect(),ti=q('.mm-title canvas').getBoundingClientRect(),art=q('.mm-art');
      ok(em.width>0&&em.bottom<=ti.top+1&&ti.width<=ban.width&&art.width>0&&art.getBoundingClientRect().width>=W-1&&art.getBoundingClientRect().height>=H-1,tag+': the emblem above the title, the title in the banner, the scene over the whole screen ('+art.width+'×'+art.height+' game px)')};
    ev("MainMenu.size='';MainMenu.frame(performance.now())");fits(844,390,'844 × 390');
    // ---- the scene: seeded, the same pixels drawn twice
    ok(ev(`(()=>{const a=PX.canvas(400,240),b=PX.canvas(400,240);new MenuArt.MenuScene(400,240,100).draw(a.getContext('2d'),3);new MenuArt.MenuScene(400,240,100).draw(b.getContext('2d'),3);
      const x=a.getContext('2d').getImageData(0,0,400,240).data,y=b.getContext('2d').getImageData(0,0,400,240).data;for(let i=0;i<x.length;i++)if(x[i]!==y[i])return false;return true})()`),'the scene is seeded: drawn twice, the same pixels');
    // ---- the keys: arrows between the open buttons (Continue skipped), Esc nothing
    const key=k=>w.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,code:k,bubbles:true}));
    q('[data-mm="new"]').focus();key('ArrowDown');const a1=d.activeElement.textContent;key('ArrowUp');key('ArrowUp');const a2=d.activeElement.textContent;key('Escape');
    ok(a1==='Settings'&&a2==='Quit'&&ev('G.menu')==='main'&&ev('G.mode')==='title','the arrows move between the open buttons (down: '+a1+', up twice: '+a2+'); Esc does nothing on the main menu');
    // ---- New Campaign: the New game page over the scene; with WORLD.gen a past opens the New world screen, Back comes back
    q('[data-mm="new"]').click();
    ok(ev('G.menu')==='new'&&mm.dataset.page==='new'&&w.getComputedStyle(q('.mm-banner')).display==='none'&&!d.getElementById('ov').hidden,'New Campaign: the New game page, the scene behind it, the banner put away');
    if(!gen0){d.querySelector('#panel [data-act="begin"][data-arg="world:soldier"]').click();ok(ev('G.menu')==='world'&&/New world/.test(d.getElementById('panel').textContent)&&ev('WM')===null,'a past: the New world screen, still no world made');
      d.querySelector('#panel [data-act="ws-back"]').click();ok(ev('G.menu')==='new','its Back: the New game page')}
    d.querySelector('#panel .nav [data-nav="back"]').click();ok(ev('G.menu')==='main'&&!mm.hidden&&mm.dataset.page==='main'&&d.getElementById('ov').hidden,'Back: the main menu again');
    // ---- the desktop
    frame.width=1600;frame.height=900;
    later(300,()=>{ev('MainMenu.frame(performance.now())');fits(1600,900,'1600 × 900');const bw=q('.mm-banner').getBoundingClientRect().width/1600;ok(bw>=.22&&bw<=.3,'the banner about a quarter of the width ('+Math.round(bw*100)+'%)');
      // ---- a campaign makes the world; the Esc menu's Main menu lets it go, the menu alone again
      ev("LOADING.sync=true;G.quietEvents=true;act('begin','soldier')");ok(!!ev('WM')&&ev('TOWNS.length')>0&&ev('G.mode')==='world','a campaign started makes its world ('+ev('WM.gen')+', '+ev('TOWNS.length')+' holdings)');
      ev('MainMenu.frame(performance.now())');ok(mm.hidden,'and the menu steps aside');
      ev("showEsc();escAct('esc-main')");ev('MainMenu.frame(performance.now())');
      ok(ev('WM')===null&&ev('TOWNS.length')===0&&ev('G.mode')==='title'&&!mm.hidden&&mm.dataset.page==='main','the Esc menu’s Main menu: back on the main menu, the world let go');
      ok(!errs.length,'no errors on the page'+(errs.length?': '+errs.join('; '):''));finish()})});
  frame.src='Ashmark.html'+(gen0?'?gen=0':'');document.body.appendChild(frame);
};
