'use strict';
/* The ink look (the owner, 2026-11-24, with a picture of a hand-inked mobile RPG: "Can we adjust ui to have similar vibe like this?",
   then "Can you remove the outer frame? ... ensure that all ui sharing the same color tone? I want a frame to be golden and ..." and
   "why I see black border and look squared, golden rusted", then "The rust seems a bit too much ... just make it like a golden frame
   with thinner border"): one warm tone (dark see-through panels, cream words, gold), every frame
   in the game a thin band of gold (a faint grain, no rust) with rounded corners and no black line (the forged rim's place in campaign-hud.css and
   game-panels.css: --campaign-frame, --ui-rim; each framed thing's corners rounded to it, its fill no longer showing square past
   them), round buttons, your army's flag and the minimap in a ring of the same gold, and on a phone your army's card top left (its flag,
   health, stamina, morale, gold, food and drink). Its look is ink-hud.css (every rule under .screen.ink); its art is drawn here once, from INK.
   on: the look (Settings → Interface look); frame: the frame's picture (px across; slice, the part of each edge a border shows, as the
   forged rim's 176; band, the gold's width in it; its golds; rust and spots, its blotches (none now); pits and pit, its faint grain); ring: a round button's ring (px across, its
   band); rim: the minimap's ring, a share of its radius; dayLap: how far the day's line rises over the minimap's foot, px (under 0: below it); dial:
   the day and night round the minimap's rim (the owner, 2026-11-24: "Can you make day and night as a circle integrated with map"):
   where it lies inside the rim and how wide (shares of the minimap's width), its stars, its gold lines, the sky through the day (a share of the day, a colour: dawn at its left,
   noon at its top, dusk at its right, midnight at its foot) */
const INK={on:true,seed:7,
  frame:{px:512,slice:176,band:40,gilt:['#f4da94','#d6a84e','#a87a30'],edge:'#7d5824',rust:['rgba(146,74,26,.68)','rgba(98,50,18,.6)','rgba(112,128,80,.34)'],spots:0,pits:500,pit:['rgba(120,80,28,.22)','rgba(255,242,196,.3)']},
  ring:{px:96,band:5},rim:{share:.075},dayLap:-2,
  dial:{rim:.0375,band:.078,stars:14,line:'#e2bd68',star:'#f4ecd0',
    sky:[[0,'#e48a52'],[.08,'#eeb86a'],[.25,'#f5dc8e'],[.42,'#eeb86a'],[.5,'#d9774a'],[.56,'#4a3e66'],[.63,'#25305a'],[.87,'#1d2748'],[.95,'#3d3a63'],[1,'#e48a52']]}};
// (a small seeded stream for the art, so the gold's grain lies the same way each time: never the game's dice)
const inkRand=s=>()=>(s=(s*1103515245+12345)>>>0)/4294967296;
class InkHud{
  constructor(screen){
    INK.on=prefGet('inklook');this.screen=screen;
    this.hero=document.createElement('button');this.hero.type='button';this.hero.className='ink-hero';this.hero.hidden=true;this.hero.setAttribute('aria-controls','stats');
    // (the click kept from the page: the phone HUD shuts its drawers on a click outside it, input.js MobileWorldHud)
    this.hero.addEventListener('click',e=>{e.stopPropagation();document.getElementById('partyToggle')?.click();this.hero.setAttribute('aria-expanded',String(this.screen.classList.contains('party-open')))});
    // (the day in a line under the minimap, the owner, 2026-11-24: "can you make the day and time integrated with the mini map?")
    this.day=document.createElement('div');this.day.className='ink-day';this.day.hidden=true;this.day.setAttribute('role','status');
    // (the sky's icon at the hour on the dial: the bar's own, the sun, the moon or the weather's, the owner: "Why dont you use icon from the bar?")
    this.hour=document.createElement('span');this.hour.className='ink-hour';this.hour.hidden=true;
    this.dial=document.createElement('canvas');this.dial.className='ink-dial';this.dial.hidden=true;this.dial.setAttribute('aria-hidden','true');
    const layer=screen.querySelector('.hudlayer');layer.appendChild(this.hero);layer.appendChild(this.dial);layer.appendChild(this.hour);layer.appendChild(this.day);
    this.frameUrl='url('+this.frame().toDataURL()+')';
    const root=document.documentElement.style;root.setProperty('--ink-frame',this.frameUrl);root.setProperty('--ink-ring','url('+this.ring(INK.ring.px,INK.ring.band,11).toDataURL()+')');
    root.setProperty('--ink-rim','url('+this.ring(256,256/2*INK.rim.share,23).toDataURL()+')');
    this.corners();this.apply();
  }
  // (on: the screen's class, and the game's two frames swapped for the gold one; off: both as the stylesheets have them)
  apply(){this.screen.classList.toggle('ink',INK.on);for(const v of ['--campaign-frame','--ui-rim'])if(INK.on)this.screen.style.setProperty(v,this.frameUrl);else this.screen.style.removeProperty(v)}
  // every framed thing's corners rounded to the frame's: each stylesheet rule that lays a frame, its own selector, a radius of its frame's width
  // (the gold's corners are a quarter circle the frame's width across), in the same @media; so no fill shows square past the gold
  corners(){
    const out=[],each=(rules,media)=>{for(const r of rules){if(r.media&&r.cssRules){each(r.cssRules,r.media.mediaText);continue}
      // (its border-image as written: a shorthand with var() in it leaves its longhands blank to the stylesheet's eye)
      const bi=r.style&&r.style.getPropertyValue('border-image')||'',m=/var\(--(?:campaign-frame|ui-rim|ink-frame)\)\s*[\d.]+\s*\/\s*([\d.]+)px/.exec(bi);if(!r.selectorText||!m)continue;
      const px=parseFloat(m[1]),sel=r.selectorText.split(',').filter(x=>!x.includes('::')).join(',');if(!px||!sel)continue;
      const rule='.screen.ink :is('+sel+'){border-radius:'+px+'px}';out.push(media?'@media '+media+'{'+rule+'}':rule)}};
    for(const sh of document.styleSheets){let rs;try{rs=sh.cssRules}catch(e){continue}if(rs)each(rs,'')}
    const el=document.createElement('style');el.id='ink-corners';el.textContent=out.join('\n');document.head.appendChild(el);this.cornerRules=out.length;
  }
  // the gold's surface, clipped to the band: blotches of rust and a little green (spots: none now), then its faint grain (pits); the band lit along its outer side, deepened along its inner
  rust(g,n,rnd){const F=INK.frame;for(let i=0;i<F.spots;i++){const x=rnd()*n,y=rnd()*n,r=5+rnd()*rnd()*28,col=F.rust[rnd()<.12?2:rnd()<.55?0:1],gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r)}
    for(let i=0;i<F.pits;i++){g.fillStyle=F.pit[rnd()<.6?0:1];g.fillRect(rnd()*n,rnd()*n,2+rnd()*2,2)}}
  // the frame: a thin band of gold round a rounded square, its corners a quarter circle the slice across; nothing inside it (each
  // framed thing keeps its own fill, clipped to the same round corners: corners)
  frame(){
    const F=INK.frame,n=F.px,S=F.slice,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),rnd=inkRand(INK.seed+41);
    const rr=(i)=>{g.roundRect(1+i,1+i,n-2-2*i,n-2-2*i,Math.max(2,S-1-i))};
    g.beginPath();rr(0);rr(F.band);g.fillStyle=F.gilt[1];g.fill('evenodd');
    g.save();g.beginPath();rr(0);rr(F.band);g.clip('evenodd');
    g.lineWidth=F.band*.42;g.strokeStyle=F.gilt[0];g.globalAlpha=.8;g.beginPath();rr(F.band*.3);g.stroke();
    g.lineWidth=F.band*.3;g.strokeStyle=F.gilt[2];g.globalAlpha=.85;g.beginPath();rr(F.band*.85);g.stroke();g.globalAlpha=1;
    this.rust(g,n,rnd);g.restore();
    g.lineWidth=4;g.strokeStyle=F.edge;g.beginPath();rr(2);g.stroke();g.beginPath();rr(F.band-2);g.stroke();
    return c;
  }
  // a ring of the same gold for round things (px across, its band, its seed): the buttons, your army's flag, the minimap
  ring(px,band,seed){
    const F=INK.frame,c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d'),m=px/2,r0=m-1,r1=m-1-band,rnd=inkRand(INK.seed+seed);
    const ring=()=>{g.beginPath();g.arc(m,m,r0,0,2*Math.PI);g.arc(m,m,r1,0,2*Math.PI,true)};
    ring();g.fillStyle=F.gilt[1];g.fill();g.save();ring();g.clip();
    g.lineWidth=band*.42;g.strokeStyle=F.gilt[0];g.globalAlpha=.8;g.beginPath();g.arc(m,m,r0-band*.3,0,2*Math.PI);g.stroke();
    g.lineWidth=band*.3;g.strokeStyle=F.gilt[2];g.globalAlpha=.85;g.beginPath();g.arc(m,m,r1+band*.15,0,2*Math.PI);g.stroke();g.globalAlpha=1;
    const k=px/INK.frame.px;g.scale(k*2,k*2);this.rust(g,px/(k*2),rnd);g.restore();
    g.lineWidth=Math.max(1,px/90);g.strokeStyle=F.edge;g.beginPath();g.arc(m,m,r0-.5,0,2*Math.PI);g.stroke();g.beginPath();g.arc(m,m,r1+.5,0,2*Math.PI);g.stroke();
    return c;
  }
  // (the sky's colour at t, a share of the day: between the two of INK.dial.sky about it)
  sky(t){const S=INK.dial.sky;let i=1;while(i<S.length-1&&S[i][0]<t)i++;const [a,ca]=S[i-1],[b,cb]=S[i],k=b>a?Math.max(0,Math.min(1,(t-a)/(b-a))):0,h=(c,j)=>parseInt(c.slice(j,j+2),16);
    return 'rgb('+[1,3,5].map(j=>Math.round(h(ca,j)+(h(cb,j)-h(ca,j))*k)).join(',')+')'}
  // the dial: the day's sky round a band inside the minimap's rim (dawn left, noon top, dusk right, midnight at its foot), stars on its
  // night, gold lines on its edges and at the four quarters; drawn again only when the minimap's size changes (the hour's icon rides
  // over it: update)
  dialDraw(D){
    const k=Math.min(2,devicePixelRatio||1),n=Math.round(D*k),key=String(n);if(!n||this.dialKey===key)return;this.dialKey=key;
    const c=this.dial,A=INK.dial;c.width=c.height=n;const g=c.getContext('2d'),m=n/2,ro=m-A.rim*n,ri=ro-A.band*n,rc=(ro+ri)/2,ang=t=>Math.PI+t*2*Math.PI,N=96,w=Math.max(1,k);
    for(let i=0;i<N;i++){const t0=i/N,t1=(i+1)/N;g.beginPath();g.arc(m,m,ro,ang(t0),ang(t1)+.01);g.arc(m,m,ri,ang(t1)+.01,ang(t0),true);g.closePath();g.fillStyle=this.sky((t0+t1)/2);g.fill()}
    const rnd=inkRand(INK.seed+61);g.fillStyle=A.star;for(let i=0;i<A.stars;i++){const t=NIGHT_AT+.06+rnd()*(.88-NIGHT_AT),q=ri+(ro-ri)*(.25+rnd()*.5),a=ang(t);g.fillRect(m+Math.cos(a)*q,m+Math.sin(a)*q,w,w)}
    g.strokeStyle=A.line;g.lineWidth=w;for(const q of [ro,ri]){g.beginPath();g.arc(m,m,q,0,2*Math.PI);g.stroke()}
    for(const t of [0,.25,.5,.75]){const a=ang(t),q=ri+(ro-ri)*.45;g.beginPath();g.moveTo(m+Math.cos(a)*ri,m+Math.sin(a)*ri);g.lineTo(m+Math.cos(a)*q,m+Math.sin(a)*q);g.stroke()}
  }
  // your army's card on a phone's map (the owner, 2026-11-24: "make the top left ui panel smaller and more compact. Make gold, food, water
  // integrated with army info"): its flag and its name; health over stamina and morale, each its number inside; your gold,
  // food and drink (your level and experience in the Hero window: "Remove level from army", then its experience thread too); the old
  // status strip's conditions behind its tap
  update(S){
    const on=INK.on&&!!window.campaignHud?.phone;this.hero.hidden=this.day.hidden=this.dial.hidden=this.hour.hidden=!on;if(!on)return;
    const st=P.heroStats(),max=Math.max(1,Math.round(st.hp)),hp=Math.round(P.hp==null?max:Math.min(max,P.hp));
    const sta=Math.round(P.bsta),mor=Math.round(P.morale);
    const days=n=>(n>=10?Math.floor(n):Math.floor(n*10)/10)+'d',pct=v=>Math.max(0,Math.min(100,v));
    const bar=(cls,label,v,txt,low)=>'<span class="ink-bar '+cls+(low?' low':'')+'" title="'+label+' '+txt+'"><em style="width:'+pct(v)+'%"></em><small><b>'+label+'</b>'+txt+'</small></span>';
    const res=(ic,n,v,low)=>'<span class="'+(low?'low':'')+'" title="'+n+'">'+icon(ic,12)+'<b>'+v+'</b></span>';
    // (your army's flag in the ring, the owner, 2026-11-24: "Change level to army flag"; no level on it: "Remove level from army")
    const html='<span class="ink-lv" aria-hidden="true"><img src="'+flagUrl(P.banner())+'" alt=""></span><span class="ink-who"><span class="ink-name"><strong>'+htmlText(heroName()||bandName())+'</strong></span>'+
      bar('hp','HP',100*hp/max,hp+'/'+max,hp<max*.35)+'<span class="ink-pair">'+bar('sta','STA',sta,sta+'%',sta<SUPPLY.tired)+bar('mor','MOR',mor,mor+'%',mor<30)+'</span>'+
      '<span class="ink-res">'+res('gold','Gold',P.gold.toLocaleString('en'))+res('food','Food',days(S.foodDays),S.foodDays<1)+res('mug','Drink',days(S.drinkDays),S.drinkDays<1)+'</span></span>';
    setHtml(this.hero,html);this.hero.setAttribute('aria-label',htmlText(bandName())+'. Your hero\'s health '+hp+' of '+max+', stamina '+sta+'%, morale '+mor+'%; gold '+P.gold+', food '+days(S.foodDays)+', drink '+days(S.drinkDays)+'. Party status');
    // (the quests and the party's details start under the card, however tall it stands)
    this.screen.style.setProperty('--ink-hero-h',this.hero.offsetHeight+'px');
    this.hero.setAttribute('aria-expanded',String(this.screen.classList.contains('party-open')));
    // (one quest shown, the tracked one, and how many more on its tag: ink-hud.css)
    const head=document.querySelector('#qtrack .qt-list:not(.qt-road) .qt-head');if(head){const n=head.parentNode.querySelectorAll('.qt-row').length,more=n>1?'+'+(n-1)+' more':'';if(head.dataset.more!==more)head.dataset.more=more}
    // (the day in one short line under the minimap, the owner: "Remove that bar and show only compact below text": its day, its season,
    //  its weather; its time is the dial's)
    const D=dayParts(),line=[D.day,D.season,D.weather].filter(Boolean).join(' · ');
    setHtml(this.day,htmlText(line));this.day.setAttribute('aria-label',line+', '+D.time);this.day.title=D.tip||D.time;setHtml(this.hour,D.sky);this.hour.title=D.time;
    const m=window.campaignHud.mobileMini,host=m.parentNode.getBoundingClientRect(),r=m.getBoundingClientRect();
    // (the day and night round its rim, laid over it; drawn again as the hour moves on)
    Object.assign(this.dial.style,{left:r.left-host.left+'px',top:r.top-host.top+'px',width:r.width+'px',height:r.height+'px'});this.dialDraw(r.width);
    {const A=INK.dial,ro=r.width/2-A.rim*r.width,rc=ro-A.band*r.width/2,a=Math.PI+Clock.frac*2*Math.PI;this.hour.style.left=r.left+r.width/2+Math.cos(a)*rc-host.left+'px';this.hour.style.top=r.top+r.height/2+Math.sin(a)*rc-host.top+'px'}
    // (centred under it, but never past its right side: the minimap stands at the screen's edge and the line can be the wider)
    this.day.style.left=Math.min(r.left+r.width/2,r.right-this.day.offsetWidth/2)-host.left+'px';this.day.style.top=r.bottom-host.top-INK.dayLap+'px';
  }
}
window.inkHud=document.getElementById('screen')?new InkHud(document.getElementById('screen')):null;
