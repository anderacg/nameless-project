'use strict';
/* ---------- the main menu (the owner, 2026-10-22: the game opens on it, no world made until a campaign starts or a save loads) ----------
   One screen over the game's canvas (Ashmark.html #mainmenu): the scene drawn in code behind it all (gfx/menuart.js MenuScene),
   down the left the banner (its iron and cloth, the emblem, ASHMARK, an ornament) with five buttons: New Campaign (the New game
   page, then the New world screen, then forging: ui.js showTitle, session.js begin), Continue (the latest save,
   dimmed with none: save.js loadGame), Load game (the save slots), Settings (ui.js's Settings window), Quit (the tab closed where the browser lets a page
   close itself, else the farewell page that says to close it); under them Wiki. A line of lore at the bottom right
   changes every MAINMENU.loreMs. The title's other pages (ui.js showTitle) are windows over the scene, the banner hidden.
   On mobile the menu fills the screen, centred, with no scene or cloth drawn; the emblem hides on short screens.
   Arrows move between the buttons, Enter presses one; Esc does nothing here (ui.js onEscape).
   Its pixels: the scene MAINMENU.artH game pixels high or near it (a whole number of device pixels each), the banner and the
   scene drawn at that one scale, the emblem and the title at the largest whole scale that fits. The scene is baked once a size
   and only its moving bits drawn after (MENU_ART.fps a second; still with reducedMotion), and only while it shows */
const MAINMENU={artH:420,loreMs:9000,
  mobileQuery:'(max-width:720px), (max-width:960px) and (max-height:540px), (pointer:coarse) and (max-width:1100px)',
  lore:['The road was built to feed the valleys.','Every holding remembers who burned it.','In the Vale, a shield wall is a wall of neighbours.',
    'The Karn Clans keep their oaths as they keep their gates: shut.','A banner is only cloth until someone rides beneath it.',
    'Salt League ships carry anything that pays, and a few things that bite.','The Ashgor Horde counts its wealth in horses and in grudges.',
    'The elves planted the southern woods before anyone counted years.']};
const MainMenu={el:null,scene:null,size:'',drawn:0,lore:0,loreAt:0,still:false,
  init(){const el=this.el=document.getElementById('mainmenu');if(!el)return;
    el.addEventListener('click',e=>{const b=e.target.closest('[data-mm]');if(b&&!b.disabled)this.pick(b.dataset.mm)});
    addEventListener('keydown',e=>this.key(e));addEventListener('resize',()=>{this.size=''});
    this.loreAt=performance.now();this.lore=Math.floor(Date.now()/MAINMENU.loreMs)%MAINMENU.lore.length;this.loreShow()},
  // (a button: what it does is the title's own act)
  pick(k){({new:()=>act('menu','new'),continue:()=>act('load'),settings:()=>act('menu','settings'),quit:()=>act('menu','exit'),load:()=>act('menu','load'),wiki:()=>act('menu','wiki')}[k]||(()=>{}))()},
  shown(){return !!this.el&&!this.el.hidden},
  // the title is on (ui.js showTitle): the menu shows, its page named (main: the banner and the lore; another: the scene only)
  show(){if(!this.el)return;this.el.hidden=false;this.el.dataset.page=G.menu||'main';this.layout()},
  // the main page: Continue open with a save (its line as the button's title), the first open button focused
  main(sv){if(!this.el)return;const c=this.el.querySelector('[data-mm="continue"]');c.disabled=!sv;c.title=sv?'Continue: '+saveLine(sv):'No saved game yet';
    const f=this.el.querySelector('.mm-btn:not([disabled])');if(f)f.focus({preventScroll:true})},
  // arrows: up and down the buttons (round at the ends)
  key(e){if(!this.shown()||G.mode!=='title'||G.menu!=='main'||!/^Arrow(Up|Down)$/.test(e.key))return;e.preventDefault();
    const L=[...this.el.querySelectorAll('.mm-btn:not([disabled])')],i=L.indexOf(document.activeElement),d=e.key==='ArrowDown'?1:-1;
    const n=L[i<0?(d>0?0:L.length-1):(i+d+L.length)%L.length];if(n)n.focus()},
  /* every frame (main.js loop): shown on the title and behind the loading that leaves it; the screen's mode kept to the title
     (render.js frame does that elsewhere: the HUD hides on it); the scene drawn when its time comes */
  frame(now){if(!this.el)return;const L=typeof LOADING!=='undefined'&&LOADING,on=G.mode==='title'||G.mode==='loading'&&!!L.keep&&L.keep.mode==='title';
    if(this.el.hidden!==!on){this.el.hidden=!on;if(!on){this.scene=null;this.size=''}}if(!on)return;
    if(G.mode==='title'){const sc=document.getElementById('screen');if(sc&&sc.dataset.mode!=='title'){sc.dataset.mode='title';if(typeof hideTip==='function')hideTip()}this.el.dataset.page=G.menu||'main'}
    if(!this.size)this.layout();if(this.el.dataset.mobile==='true')return;
    if(now-this.loreAt>=MAINMENU.loreMs){this.loreAt=now;this.lore=(this.lore+1)%MAINMENU.lore.length;this.loreShow()}
    const still=reducedMotion();if(still&&this.drawn&&this.still)return;if(!still&&now-this.drawn<1000/MENU_ART.fps)return;
    this.drawn=now;this.still=still;if(this.scene)this.scene.draw(this.cv.getContext('2d', { willReadFrequently: true }),still?4:now/1000)},
  loreShow(){const p=this.el&&this.el.querySelector('.mm-lore p');if(!p)return;p.textContent=MAINMENU.lore[this.lore];p.classList.remove('in');void p.offsetWidth;p.classList.add('in')},
  /* the sizes (the screen's, a scale s of whole device pixels to a game pixel): the scene, the banner's cloth (under the
     emblem's flag), the emblem and the title at the largest whole scale their places allow; baked again when the size changes */
  layout(){const el=this.el,sc=document.getElementById('screen');if(!el||el.hidden||!sc)return;const dpr=dprOf(),cw=sc.clientWidth,ch=sc.clientHeight;if(!cw||!ch)return;
    const mobile=matchMedia(MAINMENU.mobileQuery).matches;el.dataset.mobile=String(mobile);
    const s=Math.max(1,Math.round(dpr*ch/MAINMENU.artH)),W=Math.ceil(cw*dpr/s),H=Math.ceil(ch*dpr/s),ban=el.querySelector('.mm-banner'),br=ban.getBoundingClientRect(),
      bw=Math.ceil(br.width*dpr/s),key=[W,H,s,bw,dpr,mobile,el.dataset.page].join();if(key===this.size)return;this.size=key;
    const px=(c,w,h,k)=>{c.width=w;c.height=h;c.style.width=w*k/dpr+'px';c.style.height=h*k/dpr+'px'};
    this.cv=el.querySelector('.mm-art');this.drawn=0;
    if(mobile){this.scene=null;px(this.cv,1,1,1);px(el.querySelector('.mm-cloth'),1,1,1)}
    else{px(this.cv,W,H,s);this.scene=new MenuArt.MenuScene(W,H,bw)}
    // (the title and emblem stay as small static pictures; mobile draws neither a scene nor a cloth background)
    const tc=el.querySelector('.mm-title canvas'),T=this.word||(this.word=MenuArt.menuTitle()),tr=el.querySelector('.mm-title').getBoundingClientRect(),
      tk=Math.max(1,Math.floor(Math.min(tr.width*dpr/T.width,ch*dpr*.1/T.height)));px(tc,T.width,T.height,tk);tc.getContext('2d', { willReadFrequently: true }).drawImage(T,0,0);
    const em=el.querySelector('.mm-emblem'),ec=em.querySelector('canvas'),er=em.getBoundingClientRect();
    if(er.width&&er.height){const E=this.emb||(this.emb=MenuArt.menuEmblem()),ek=Math.max(1,Math.floor(Math.min(er.width*dpr/(E.width+8),er.height*dpr/(E.height+6))));px(ec,E.width,E.height,ek);ec.getContext('2d', { willReadFrequently: true }).drawImage(E,0,0)}
    if(mobile)return;
    // (the cloth, its flag hung from the rod behind the emblem)
    const cl=el.querySelector('.mm-cloth'),q=v=>Math.round(v*dpr/s),ff=ec.getBoundingClientRect(),fl=[q(ff.left-br.left)-4,5,q(ff.width)+8,q(ff.bottom-br.top)+3];
    px(cl,bw,H,s);cl.getContext('2d', { willReadFrequently: true }).drawImage(MenuArt.menuBanner(bw,H,fl),0,0)}
};
