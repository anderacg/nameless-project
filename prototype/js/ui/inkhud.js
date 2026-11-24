'use strict';
/* The ink look (the owner, 2026-11-24, with a picture of a hand-inked mobile RPG: "Can we adjust ui to have similar vibe like this?",
   then "Can you remove the outer frame? ... ensure that all ui sharing the same color tone? I want a frame to be golden and ..." and
   "why I see black border and look squared, golden rusted", then "The rust seems a bit too much ... just make it like a golden frame
   with thinner border"): one warm tone (dark see-through panels, cream words, gold), every frame
   in the game a thin band of gold (a faint grain, no rust) with rounded corners and no black line (the forged rim's place in campaign-hud.css and
   game-panels.css: --campaign-frame, --ui-rim; each framed thing's corners rounded to it, its fill no longer showing square past
   them), round buttons, your level and the minimap in a ring of the same gold, and on a phone your hero's card top left (your level,
   health, stamina, morale, experience). Its look is ink-hud.css (every rule under .screen.ink); its art is drawn here once, from INK.
   on: the look (Settings → Interface look); frame: the frame's picture (px across; slice, the part of each edge a border shows, as the
   forged rim's 176; band, the gold's width in it; its golds; rust and spots, its blotches (none now); pits and pit, its faint grain); ring: a round button's ring (px across, its
   band); rim: the minimap's ring, a share of its radius; dayLap: how far the day's plate rises over the minimap's foot, px */
const INK={on:true,seed:7,
  frame:{px:512,slice:176,band:40,gilt:['#f4da94','#d6a84e','#a87a30'],edge:'#7d5824',rust:['rgba(146,74,26,.68)','rgba(98,50,18,.6)','rgba(112,128,80,.34)'],spots:0,pits:500,pit:['rgba(120,80,28,.22)','rgba(255,242,196,.3)']},
  ring:{px:96,band:5},rim:{share:.075},dayLap:12};
// (a small seeded stream for the art, so the gold's grain lies the same way each time: never the game's dice)
const inkRand=s=>()=>(s=(s*1103515245+12345)>>>0)/4294967296;
class InkHud{
  constructor(screen){
    INK.on=prefGet('inklook');this.screen=screen;
    this.hero=document.createElement('button');this.hero.type='button';this.hero.className='ink-hero';this.hero.hidden=true;this.hero.setAttribute('aria-controls','stats');
    // (the click kept from the page: the phone HUD shuts its drawers on a click outside it, input.js MobileWorldHud)
    this.hero.addEventListener('click',e=>{e.stopPropagation();document.getElementById('partyToggle')?.click();this.hero.setAttribute('aria-expanded',String(this.screen.classList.contains('party-open')))});
    this.purse=document.createElement('div');this.purse.className='ink-purse';this.purse.hidden=true;
    // (the day on a plate hung from the minimap, the owner, 2026-11-24: "can you make the day and time integrated with the mini map?")
    this.day=document.createElement('div');this.day.className='ink-day';this.day.hidden=true;this.day.setAttribute('role','status');
    const layer=screen.querySelector('.hudlayer');layer.appendChild(this.hero);layer.appendChild(this.purse);layer.appendChild(this.day);
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
  // a ring of the same gold for round things (px across, its band, its seed): the buttons, your level, the minimap
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
  // your hero's card on a phone's map, and your purse under the minimap; the old status strip's conditions behind the card's tap
  update(S){
    const on=INK.on&&!!window.campaignHud?.phone;this.hero.hidden=this.purse.hidden=this.day.hidden=!on;if(!on)return;
    const st=P.heroStats(),max=Math.max(1,Math.round(st.hp)),hp=Math.round(P.hp==null?max:Math.min(max,P.hp)),need=leaderOf(P).xpNeed(),xp=Math.max(0,Math.min(100,100*P.xp/Math.max(1,need)));
    const sta=Math.round(P.bsta),mor=Math.round(P.morale);
    const bar=(cls,label,v,txt,low)=>'<span class="ink-bar '+cls+(low?' low':'')+'"><b>'+label+'</b><i><em style="width:'+Math.max(0,Math.min(100,v))+'%"></em><small>'+txt+'</small></i></span>';
    // (your army's flag in the ring, the owner, 2026-11-24: "Change level to army flag"; your level beside your rank)
    const html='<span class="ink-lv" aria-hidden="true"><img src="'+flagUrl(P.banner())+'" alt=""></span><span class="ink-who"><span class="ink-name"><strong>'+htmlText(heroName()||bandName())+'</strong><small><span class="ink-rank">'+htmlText(rankName())+' · </span>Lv '+P.level+'</small></span>'+
      bar('hp','HP',100*hp/max,hp+' / '+max,hp<max*.35)+bar('sta','STA',sta,sta+'%',sta<SUPPLY.tired)+bar('mor','MOR',mor,mor+'%',mor<30)+
      '<span class="ink-bar xp"><b>EXP</b><i><em style="width:'+xp+'%"></em></i><small>'+xp.toFixed(1)+'%</small></span></span>';
    setHtml(this.hero,html);this.hero.setAttribute('aria-label',htmlText(bandName())+'. Your hero, level '+P.level+': health '+hp+' of '+max+', stamina '+sta+'%, morale '+mor+'%. Party status');
    this.hero.setAttribute('aria-expanded',String(this.screen.classList.contains('party-open')));
    // (one quest shown, the tracked one, and how many more on its tag: ink-hud.css)
    const head=document.querySelector('#qtrack .qt-list:not(.qt-road) .qt-head');if(head){const n=head.parentNode.querySelectorAll('.qt-row').length,more=n>1?'+'+(n-1)+' more':'';if(head.dataset.more!==more)head.dataset.more=more}
    const days=n=>(n>=10?Math.floor(n):Math.floor(n*10)/10)+'d';
    setHtml(this.purse,'<span title="Gold">'+icon('gold',14)+'<b>'+P.gold.toLocaleString('en')+'</b></span><span class="'+(S.foodDays<1?'low':'')+'" title="Food">'+icon('food',14)+'<b>'+days(S.foodDays)+'</b></span><span class="'+(S.drinkDays<1?'low':'')+'" title="Drink">'+icon('mug',14)+'<b>'+days(S.drinkDays)+'</b></span>');
    // (the day: the sky's icon in a ring, the day and its season over its time and weather, on a plate across the minimap's foot)
    const D=dayParts(),line=D.day+(D.season?' · '+D.season:''),sub=D.time+(D.weather?' · '+D.weather:'');
    setHtml(this.day,'<span class="ink-sky" title="'+htmlText(D.tip||D.time)+'">'+D.sky+'</span><span class="ink-date"><b>'+line+'</b><small>'+sub+(G.paused?' · Paused':'')+'</small></span>');this.day.setAttribute('aria-label',line+', '+sub);
    const m=window.campaignHud.mobileMini,host=m.parentNode.getBoundingClientRect(),r=m.getBoundingClientRect(),hr=this.hero.getBoundingClientRect();
    // (centred under it, but never past its right side: the minimap stands at the screen's edge and the plate is the wider)
    this.day.style.left=Math.min(r.left+r.width/2,r.right-this.day.offsetWidth/2)-host.left+'px';this.day.style.top=r.bottom-host.top-INK.dayLap+'px';const dr=this.day.getBoundingClientRect();
    // (the purse beside the minimap where it clears your hero's card, else under the day: a phone held upright)
    const beside=r.left-8-this.purse.offsetWidth>=hr.right+6;this.purse.style.top=(beside?r.top:dr.bottom+6)-host.top+'px';this.purse.style.right=host.right-(beside?r.left-8:r.right)+'px';
  }
}
window.inkHud=document.getElementById('screen')?new InkHud(document.getElementById('screen')):null;
