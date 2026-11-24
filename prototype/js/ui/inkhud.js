'use strict';
/* The ink look (the owner, 2026-11-24, with a picture of a hand-inked mobile RPG: "Can we adjust ui to have similar vibe like this?"):
   a torn paper edge round the screen, dark see-through panels in a pale ink rim, round buttons in a brushed ring, a round parchment
   minimap, and on a phone your hero's card top left (your level in a ring, health, stamina, morale, experience). Its look is
   ink-hud.css (every rule under .screen.ink); its art is drawn here once, from INK, and redrawn only when the screen's size changes.
   on: the look (Settings → Interface look); edge: the paper's width and how ragged its inner edge is, css px; ring: the brushed ring's
   picture (px across, its stroke, how much the stroke swells); rim: the minimap's paper rim, a share of its radius */
const INK={on:true,edge:{w:6,rag:2.6,paper:'#dccfae',fold:'#b6a57c',ink:'#26221c'},ring:{px:96,w:7,swell:.35,ink:'#ece3cb',dark:'#141210'},
  rim:{share:.13,paper:'#d8caa4',ink:'#3a3226'},seed:7};
// (a small seeded stream for the art, so the paper tears the same way each time: never the game's dice)
const inkRand=s=>()=>(s=(s*1103515245+12345)>>>0)/4294967296;
class InkHud{
  constructor(screen){
    INK.on=prefGet('inklook');this.screen=screen;this.edge=document.createElement('canvas');this.edge.className='ink-edge';this.edge.setAttribute('aria-hidden','true');screen.appendChild(this.edge);
    this.hero=document.createElement('button');this.hero.type='button';this.hero.className='ink-hero';this.hero.hidden=true;this.hero.setAttribute('aria-controls','stats');
    // (the click kept from the page: the phone HUD shuts its drawers on a click outside it, input.js MobileWorldHud)
    this.hero.addEventListener('click',e=>{e.stopPropagation();document.getElementById('partyToggle')?.click();this.hero.setAttribute('aria-expanded',String(this.screen.classList.contains('party-open')))});
    this.purse=document.createElement('div');this.purse.className='ink-purse';this.purse.hidden=true;
    const layer=screen.querySelector('.hudlayer');layer.appendChild(this.hero);layer.appendChild(this.purse);
    const root=document.documentElement.style;root.setProperty('--ink-ring','url('+this.ring(INK.ring.ink).toDataURL()+')');root.setProperty('--ink-rim','url('+this.rim().toDataURL()+')');
    new ResizeObserver(()=>this.paper()).observe(screen);this.apply();
  }
  apply(){this.screen.classList.toggle('ink',INK.on);this.edge.hidden=!INK.on;if(INK.on)this.paper()}
  // the torn paper round the screen: a band of paper, its inner edge torn (a wandering line, a little grit on it), inked along the tear
  paper(){
    if(!INK.on)return;const r=this.screen.getBoundingClientRect(),k=Math.min(2,devicePixelRatio||1),W=Math.round(r.width*k),H=Math.round(r.height*k);if(!W||!H||this.edge.width===W&&this.edge.height===H)return;
    const c=this.edge;c.width=W;c.height=H;const g=c.getContext('2d'),E=INK.edge,rnd=inkRand(INK.seed),pts=[],step=3*k;
    let d=0;const tear=()=>{d+=(rnd()-.5)*E.rag*.9*k;d*=.82;return E.w*k+d+(rnd()-.5)*E.rag*.6*k};
    for(let x=0;x<W;x+=step)pts.push([x,tear()]);for(let y=0;y<H;y+=step)pts.push([W-tear(),y]);
    for(let x=W;x>0;x-=step)pts.push([x,H-tear()]);for(let y=H;y>0;y-=step)pts.push([tear(),y]);
    g.clearRect(0,0,W,H);g.beginPath();g.rect(0,0,W,H);g.moveTo(pts[0][0],pts[0][1]);for(const [x,y] of pts)g.lineTo(x,y);g.closePath();
    g.fillStyle=E.paper;g.fill('evenodd');
    // (its fold: a darker line a little inside the outer edge; then the ink along the tear)
    g.strokeStyle=E.fold;g.lineWidth=1*k;g.strokeRect(2.5*k,2.5*k,W-5*k,H-5*k);
    g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const [x,y] of pts)g.lineTo(x,y);g.closePath();g.strokeStyle=E.ink;g.lineWidth=1.4*k;g.stroke();
  }
  // a brushed ring: a stroke that swells and thins round the circle, as a brush laid it, with a dark hairline outside it
  ring(col){
    const R=INK.ring,n=R.px,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),rnd=inkRand(INK.seed+3),m=n/2,rad=m-R.w/2-2;
    g.lineCap='round';g.strokeStyle=R.dark;g.lineWidth=R.w+3;g.beginPath();g.arc(m,m,rad,0,7);g.stroke();
    const N=48;let w=R.w;for(let i=0;i<N;i++){w=Math.max(R.w*(1-R.swell),Math.min(R.w*(1+R.swell),w+(rnd()-.5)*2));const a0=i/N*Math.PI*2,a1=(i+1.15)/N*Math.PI*2;
      g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.arc(m,m,rad+(rnd()-.5)*.8,a0,a1);g.stroke()}
    return c;
  }
  // the minimap's rim: a ring of paper, torn a little on both edges, inked on its inside
  rim(){
    const R=INK.rim,n=256,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),rnd=inkRand(INK.seed+5),m=n/2,band=m*R.share,N=120,rr=[];
    for(let i=0;i<=N;i++)rr.push([m-1-rnd()*3,m-band+(rnd()-.5)*3]);
    g.beginPath();for(let i=0;i<=N;i++){const a=i/N*Math.PI*2;g[i?'lineTo':'moveTo'](m+Math.cos(a)*rr[i][0],m+Math.sin(a)*rr[i][0])}
    for(let i=N;i>=0;i--){const a=i/N*Math.PI*2;g.lineTo(m+Math.cos(a)*rr[i][1],m+Math.sin(a)*rr[i][1])}g.closePath();g.fillStyle=R.paper;g.fill();
    g.beginPath();for(let i=0;i<=N;i++){const a=i/N*Math.PI*2;g[i?'lineTo':'moveTo'](m+Math.cos(a)*rr[i][1],m+Math.sin(a)*rr[i][1])}g.strokeStyle=R.ink;g.lineWidth=2.5;g.stroke();
    g.strokeStyle='#8c7c58';g.lineWidth=1;g.beginPath();g.arc(m,m,m-band*.45,0,7);g.stroke();
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
