'use strict';
/* The ink look (the owner, 2026-11-24, with a picture of a hand-inked mobile RPG: "Can we adjust ui to have similar vibe like this?",
   then "Can you remove the outer frame? ... ensure that all ui sharing the same color tone? I want a frame to be golden and torn out"):
   one warm tone (dark see-through panels, cream words, gold), every frame in the game a golden band torn along its outer edge (the
   forged rim's place in campaign-hud.css and game-panels.css: --campaign-frame, --ui-rim), round buttons in a torn gold ring, a round
   parchment minimap in one, and on a phone your hero's card top left (your level in a ring, health, stamina, morale, experience). Its
   look is ink-hud.css (every rule under .screen.ink); its art is drawn here once, from INK.
   on: the look (Settings → Interface look); frame: the frame's picture (px across; slice, the part of each edge a border shows, as the
   forged rim's 176; period, how often a side's tear repeats; out, how far in the tear reaches; gold, where the gold ends; fill, the
   panel's own dark inside the gold; its golds and inks); ring: a round button's ring (px across, its band, how deep its tear); rim: the
   minimap's ring, a share of its radius */
const INK={on:true,seed:7,
  frame:{px:1024,slice:176,period:672,out:[4,64],gold:84,goldVar:10,fill:'rgba(23,19,14,.86)',gilt:'#c8963a',hi:'#f2d27e',burn:'#4a3010',ink:'#1b130a'},
  ring:{px:96,band:7,tear:4},rim:{share:.14,tear:5}};
// (a small seeded stream for the art, so the gold tears the same way each time: never the game's dice)
const inkRand=s=>()=>(s=(s*1103515245+12345)>>>0)/4294967296;
// (a tear along a side, 0–1 at t: waves of a few lengths and now and then a deep bite, repeating every p so the tiles of a long side meet)
function inkTear(seed,p){const rnd=inkRand(seed),w=[1,2,3,5,8].map(k=>[k,rnd()*7,(rnd()*.6+.4)/Math.sqrt(k)]),sum=w.reduce((a,v)=>a+v[2],0),bite=[[3,rnd()*7],[7,rnd()*7]];
  return t=>{let v=0;for(const [k,ph,a] of w)v+=a*Math.sin(2*Math.PI*k*t/p+ph);let f=.42+.3*v/sum;for(const [k,ph] of bite)f+=.4*Math.pow(Math.abs(Math.sin(Math.PI*k*t/p+ph)),14);return Math.max(0,Math.min(1,f))}}
class InkHud{
  constructor(screen){
    INK.on=prefGet('inklook');this.screen=screen;
    this.hero=document.createElement('button');this.hero.type='button';this.hero.className='ink-hero';this.hero.hidden=true;this.hero.setAttribute('aria-controls','stats');
    // (the click kept from the page: the phone HUD shuts its drawers on a click outside it, input.js MobileWorldHud)
    this.hero.addEventListener('click',e=>{e.stopPropagation();document.getElementById('partyToggle')?.click();this.hero.setAttribute('aria-expanded',String(this.screen.classList.contains('party-open')))});
    this.purse=document.createElement('div');this.purse.className='ink-purse';this.purse.hidden=true;
    const layer=screen.querySelector('.hudlayer');layer.appendChild(this.hero);layer.appendChild(this.purse);
    this.frameUrl='url('+this.frame().toDataURL()+')';
    const root=document.documentElement.style;root.setProperty('--ink-frame',this.frameUrl);root.setProperty('--ink-ring','url('+this.ring(INK.ring.px,INK.ring.band,INK.ring.tear,11).toDataURL()+')');
    root.setProperty('--ink-rim','url('+this.ring(256,256/2*INK.rim.share,INK.rim.tear,23).toDataURL()+')');
    this.apply();
  }
  // (on: the screen's class, and the game's two frames swapped for the torn gold one; off: both as the stylesheets have them)
  apply(){this.screen.classList.toggle('ink',INK.on);for(const v of ['--campaign-frame','--ui-rim'])if(INK.on)this.screen.style.setProperty(v,this.frameUrl);else this.screen.style.removeProperty(v)}
  // the frame: a band of gold torn along its outer edge (a burnt line on the tear), a dark line on its inner edge, the panel's dark inside
  // it; each side's tear repeats every period, so a long side, its middle tiled (ink-hud.css: border-image-repeat round), never shows a seam
  frame(){
    const F=INK.frame,n=F.px,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),rnd=inkRand(INK.seed+41);
    const tears=[0,1,2,3].map(i=>[inkTear(INK.seed+11+i,F.period),inkTear(INK.seed+31+i,F.period)]);
    const at=(s,t,d)=>s===0?[t,d]:s===1?[n-d,t]:s===2?[n-t,n-d]:[d,n-t];
    // (each side from the depth of the deepest tear to as far from its end: its corners cut across, never a sliver to the picture's corner)
    const loop=fn=>{const pts=[],e=F.out[1];for(let s=0;s<4;s++)for(let t=e;t<=n-e;t+=3)pts.push(at(s,t,fn(s,t)));return pts};
    const path=(pts,go=true)=>{if(go)g.beginPath();pts.forEach(([x,y],i)=>g[i?'lineTo':'moveTo'](x,y));g.closePath()};
    const outer=loop((s,t)=>F.out[0]+(F.out[1]-F.out[0])*tears[s][0](t)),inner=loop((s,t)=>F.gold+F.goldVar*(tears[s][1](t)-.5)),shine=loop((s,t)=>F.out[0]+(F.out[1]-F.out[0])*tears[s][0](t)+12);
    path(inner);g.fillStyle=F.fill;g.fill();
    g.beginPath();path(outer,false);path(inner,false);g.fillStyle=F.gilt;g.fill('evenodd');
    g.save();g.beginPath();path(outer,false);path(inner,false);g.clip('evenodd');
    path(shine);g.strokeStyle=F.hi;g.lineWidth=7;g.globalAlpha=.75;g.stroke();g.globalAlpha=1;
    for(let i=0;i<3000;i++){const x=rnd()*n,y=rnd()*n;g.fillStyle=rnd()<.5?'rgba(255,236,170,.35)':'rgba(90,55,12,.35)';g.fillRect(x,y,3,3)}g.restore();
    path(outer);g.strokeStyle=F.burn;g.lineWidth=6;g.stroke();path(inner);g.strokeStyle=F.ink;g.lineWidth=7;g.stroke();
    return c;
  }
  // a ring of the same gold for round things (px across, its band, how deep its outer edge is torn, its seed): the buttons, the minimap
  ring(px,band,tear,seed){
    const F=INK.frame,c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d'),m=px/2,T=inkTear(INK.seed+seed,2*Math.PI),N=180;
    const r0=a=>m-1-tear*T(a),r1=m-1-tear-band,pt=(a,r)=>[m+Math.cos(a)*r,m+Math.sin(a)*r];
    g.beginPath();for(let i=0;i<=N;i++){const a=i/N*2*Math.PI;g[i?'lineTo':'moveTo'](...pt(a,r0(a)))}g.closePath();g.arc(m,m,r1,0,2*Math.PI,true);g.fillStyle=F.gilt;g.fill();
    g.save();g.clip();g.strokeStyle=F.hi;g.lineWidth=Math.max(1.5,band*.3);g.globalAlpha=.7;g.beginPath();g.arc(m,m,r1+band*.62,0,2*Math.PI);g.stroke();g.restore();
    g.beginPath();for(let i=0;i<=N;i++){const a=i/N*2*Math.PI;g[i?'lineTo':'moveTo'](...pt(a,r0(a)))}g.closePath();g.strokeStyle=F.burn;g.lineWidth=Math.max(1.2,px/80);g.stroke();
    g.beginPath();g.arc(m,m,r1,0,2*Math.PI);g.strokeStyle=F.ink;g.lineWidth=Math.max(1.5,px/60);g.stroke();
    return c;
  }
  // your hero's card on a phone's map, and your purse under the minimap; the old status strip's conditions behind the card's tap
  update(S){
    const on=INK.on&&!!window.campaignHud?.phone;this.hero.hidden=this.purse.hidden=!on;if(!on)return;
    const st=P.heroStats(),max=Math.max(1,Math.round(st.hp)),hp=Math.round(P.hp==null?max:Math.min(max,P.hp)),need=leaderOf(P).xpNeed(),xp=Math.max(0,Math.min(100,100*P.xp/Math.max(1,need)));
    const sta=Math.round(P.bsta),mor=Math.round(P.morale);
    const bar=(cls,label,v,txt,low)=>'<span class="ink-bar '+cls+(low?' low':'')+'"><b>'+label+'</b><i><em style="width:'+Math.max(0,Math.min(100,v))+'%"></em><small>'+txt+'</small></i></span>';
    const html='<span class="ink-lv" aria-hidden="true"><small>LV</small>'+P.level+'</span><span class="ink-who"><span class="ink-name"><strong>'+htmlText(heroName()||bandName())+'</strong><small>'+htmlText(rankName())+'</small></span>'+
      bar('hp','HP',100*hp/max,hp+' / '+max,hp<max*.35)+bar('sta','STA',sta,sta+'%',sta<SUPPLY.tired)+bar('mor','MOR',mor,mor+'%',mor<30)+
      '<span class="ink-bar xp"><b>EXP</b><i><em style="width:'+xp+'%"></em></i><small>'+xp.toFixed(1)+'%</small></span></span>';
    setHtml(this.hero,html);this.hero.setAttribute('aria-label','Your hero, level '+P.level+': health '+hp+' of '+max+', stamina '+sta+'%, morale '+mor+'%. Party status');
    this.hero.setAttribute('aria-expanded',String(this.screen.classList.contains('party-open')));
    // (one quest shown, the tracked one, and how many more on its tag: ink-hud.css)
    const head=document.querySelector('#qtrack .qt-list:not(.qt-road) .qt-head');if(head){const n=head.parentNode.querySelectorAll('.qt-row').length,more=n>1?'+'+(n-1)+' more':'';if(head.dataset.more!==more)head.dataset.more=more}
    const days=n=>(n>=10?Math.floor(n):Math.floor(n*10)/10)+'d';
    const m=window.campaignHud.mobileMini,host=m.parentNode.getBoundingClientRect(),r=m.getBoundingClientRect();this.purse.style.top=r.top-host.top+'px';this.purse.style.right=host.right-r.left+8+'px';
    setHtml(this.purse,'<span title="Gold">'+icon('gold',14)+'<b>'+P.gold.toLocaleString('en')+'</b></span><span class="'+(S.foodDays<1?'low':'')+'" title="Food">'+icon('food',14)+'<b>'+days(S.foodDays)+'</b></span><span class="'+(S.drinkDays<1?'low':'')+'" title="Drink">'+icon('mug',14)+'<b>'+days(S.drinkDays)+'</b></span>');
  }
}
window.inkHud=document.getElementById('screen')?new InkHud(document.getElementById('screen')):null;
