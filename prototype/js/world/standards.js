'use strict';
/* ---------- standards (doc/STANDARDS_DESIGN.md, phase 1; the owner, 2026-11-10: "every factions will also have a static flag in
   their territory, and around that they may have tower or buildings to defense ... This tower and flag can be captured"): a
   realm's standard on its land, at a road crossing, a pass, a ford or a natural resource (Standards.place), a site of its own kind
   in W.sites (saved with them). Its level (1-3): the standard alone, a wooden watchtower by it, a stone tower; its guards
   (STANDARD.guards) by it, back a day while its realm holds it. You take one by beating its guards and staying by it STANDARD.hold
   hours: for the realm you serve (P.fac), for yourself once you hold a holding of your own, else for a realm near it you hand it
   to, or no one. Phase 1: placed, drawn, held, saved, taken by you ---------- */
const STANDARD_LV=['','a standard','a standard and a watchtower','a standard and a stone tower'];
class Standard extends Site{
  get T(){return STANDARD.T}
  get screen(){return PAGE_SCREEN}
  get scoutable(){return false}
  get empties(){return false}
  // (known once you have seen its ground, as a holding is)
  known(){return this.seen||seenAt(this.x,this.y)}
  // (its realm: a realm of the world's, yours ('player'), or none)
  get realm(){return this.owner&&(this.owner==='player'||FACS[this.owner])?this.owner:null}
  ownerName(){const f=this.realm;return f==='player'?'yours':f?'the '+FACS[f].n:''}
  col(){const f=this.realm;return f?FACS[f].col:STANDARD_ART.rag}
  banner(){const f=this.realm;return f?{k:'banner',col:FACS[f].col,dev:f==='player'?'crown':f}:null}
  flag(){return this.banner()||{k:'rag',col:STANDARD_ART.rag,dev:null}}
  // (yours to keep: your realm's, or your employer's)
  get ours(){const f=this.realm;return !!f&&(f==='player'||f===P.fac)}
  get most(){return STANDARD.guards[this.lv]||0}
  // its guards, as its realm's soldiers
  guardList(){const f=this.realm;return f&&f!=='player'&&this.guards>0?armyOf(f,this.guards):[]}
  whyText(){return this.why==='deposit'||this.why==='fish'?'by the '+(GOODS[this.g]?GOODS[this.g].n.toLowerCase():'')+' '+(this.why==='fish'?'waters':'deposit'):'at the '+STANDARD_WHY[this.why]}
  // the day: its realm sends a guard back while it holds it in peace
  day(){if(this.realm&&this.realm!=='player'&&!this.taking&&!this.choose&&this.guards<this.most)this.guards=Math.min(this.most,this.guards+STANDARD.regrow)}
  mapDot(V){return this.known()?[this.col(),2]:null}
  tip(){const f=this.ownerName();return '<b>'+Discovery.nameOf(this)+'</b><small>'+(f?'Held by '+f:'Held by no one')+', '+STANDARD_LV[this.lv]+(this.guards?', '+roughly(this.guards)+' guards':'')+'</small><span class="act">Click: go there</span>'}
  sprite(){return standardSprite(this)}
  // (what stands in the way, world px: its plinth, and its tower beside it)
  footing(){const sp=this.sprite(),X=this.x-sp.ax,Y=this.y+8-sp.ay,f=[{x:this.x-8,y:this.y+2,w:16,h:6}];if(this.lv>=2){const tw=sp.width-22;f.push({x:X+tw*.25,y:Y+sp.height-tw*.45,w:tw*.5,h:tw*.3})}return f}
  box(box,camp){camp(this,this.sprite())}
  /* its page: whose it is, what stands there, its guards; Attack its guards (an act of war on a realm at peace with you) or, none
     left, raise your banner; while your banner goes up, how long yet; once up, with no realm of your own and no employer, the
     realms near it to hand it to, or no one */
  page(r){const s=this,f=s.ownerName(),facts=pageFacts([f?'<span style="color:'+s.col()+'">held by '+f+'</span>':'held by no one',STANDARD_LV[s.lv],
      s.guards?insight(['guards by it',roughly(s.guards)+' guards',s.guards+' guards'],'know how many'):'no guards',s.whyText()]);
    const body='<p>A standard '+s.whyText()+': a tall pole on a stepped stone plinth, '+(f?'its banners hung from a crossbar':'its banners torn to rags')+'.</p>'+facts;
    if(s.choose)return{title:'Your banner flies',body:body+'<p>Your men hold it. You have no realm of your own and serve no one: hand it to a realm near, or leave it to no one.</p>',
      acts:[...s.nearRealms().map(([k,d])=>({icon:'banner',label:'Hand it to the '+FACS[k].n,act:'site-hand',arg:k,facts:['renown +'+STANDARD.renown,'their thanks',Math.round(d)+' tiles to their nearest holding']})),
        {icon:'truce',label:'Leave it to no one',act:'site-hand',arg:'none',facts:['renown +'+STANDARD.renown]}]};
    if(s.taking)return{body:body+'<p class="gold">Your banner goes up: '+s.taking.h+' of '+STANDARD.hold+' hours. Stay by it.</p>'};
    if(s.ours)return{body:body+'<p class="muted">It flies '+(s.realm==='player'?'your own colours':'the colours of the realm you serve')+'.</p>'};
    const war=s.realm&&s.realm!=='player'&&!hostileTo(s.realm),fight=s.guards>0;
    return{body,acts:[{icon:'sword',label:fight?'Attack its guards':'Raise your banner',act:'site-attack',facts:[fight?roughly(s.guards)+' guards':'no guards',war?'an act of war on the '+FACS[s.realm].n:'',STANDARD.hold+' hours by it'].filter(Boolean),
      why:partySize()<1&&fight?'You have no men':''}]}}
  act(a,arg,done){
    if(a==='site-attack'&&!this.ours&&!this.taking&&!this.choose){const f=this.realm;this.was=f;
      if(f&&f!=='player'&&!hostileTo(f)){const X=STANDARD.hostile;Timed.of(P,'hostile').extend(f,X.days);addHonor(f,X.honor,true)}
      if(this.guards>0){G.site=null;startEncounter({kind:'standard',ref:this,list:this.guardList(),title:'Guards of the '+this.name,word:'guards',mine:true});return true}
      this.taking={h:0};done('Your men plant your banner by the '+this.name+'. Stay by it '+STANDARD.hold+' hours.');return true}
    if(a==='site-hand'&&this.choose){done(this.give(arg==='none'?null:arg));return true}
    return false}
  // its guards beaten (engage.js ON_WIN.standard): your banner goes up while you stay by it
  beaten(){this.guards=0;this.taking={h:0};return ' Its guards are beaten. Stay by the '+this.name+' '+STANDARD.hold+' hours to raise your banner.'}
  // an hour by it: your banner goes up; gone well off, it is broken off
  hour(){const t=this.taking;if(!t)return;const d=Math.hypot(P.x-this.x,P.y-this.y);
    if(d<=STANDARD.r){if(++t.h>=STANDARD.hold)this.raised()}else if(d>STANDARD.r*3){this.taking=null;log('You leave the '+this.name+': your banner never went up.','bad')}}
  // your banner up: the realm you serve's, yours, or yours to hand on
  raised(){this.taking=null;const who=P.fac&&FACS[P.fac]?P.fac:fiefsOf('player').length?'player':null;
    if(who){log(this.give(who),'good');return}
    this.choose=true;log('Your men hold the '+this.name+'. Whose banner shall fly over it?','gold');if(G.mode==='world'&&!G.modal){G.site=this;G.siteTab=null;G.mode='site';showSite()}}
  // its new holder (none: no one's); your renown and its realm's thanks
  give(f){const was=this.realm;this.owner=f&&(f==='player'||FACS[f])?f:null;this.choose=false;this.taking=null;this.guards=this.realm&&this.realm!=='player'?1:0;
    P.renown+=STANDARD.renown;if(this.realm&&this.realm!=='player')addHonor(this.realm,STANDARD.thanks,true);worldEmit('standard:taken',{standard:this,from:was,to:this.realm,by:'you'});
    return this.realm?'The '+this.name+' flies '+(this.realm==='player'?'your colours':'the colours of the '+FACS[this.realm].n)+' now. Renown +'+STANDARD.renown+'.':'You cut down its banners and leave the '+this.name+' to no one. Renown +'+STANDARD.renown+'.'}
  // the realms near it you may hand it to: [realm, tiles to its nearest holding], the nearest three, not the one you took it from
  nearRealms(){const out=[];for(const k of Object.keys(FACS)){if(k==='player'||k===this.was)continue;const F=fiefsOf(k);if(!F.length)continue;
    out.push([k,Math.min(...F.map(t=>Math.hypot(t.x-this.x,t.y-this.y)))/TILE])}return out.sort((a,b)=>a[1]-b[1]).slice(0,3)}
}
SITE_CLASS.standard=Standard;

/* where they stand (doc §2; STANDARD_PLACE): a pure reckoning of the map and its holdings (no random draw: the world's streams as
   they were), so a world always has the same standards. Every road crossing (a road tile with three roads by it), ford, pass (a
   road with peaks on both sides) and deposit (resources.js) on a realm's land, clear of the holdings, scored by why and more on a
   border with another realm; each province (provinces.js) its best, base + one for each per of its holdings (most), one more on a
   border, gap tiles apart. Each stands on open ground beside its spot (near tiles), off the road */
const Standards={
  all(){return W.sites.filter(s=>s instanceof Standard)},
  spots(){const S=STANDARD_PLACE,road=(x,y)=>{const k=tAt(x,y);return k===T_ROAD||k===T_FORD},peak=(x,y)=>tAt(x,y)===T_MOUNT,out=[];
    for(let ty=3;ty<MH-3;ty++)for(let tx=3;tx<MW-3;tx++){const k=tAt(tx,ty);let why=null;
      if(k===T_FORD)why='ford';
      else if(k===T_ROAD){const n=[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>road(tx+a,ty+b)).length;
        if(n>=3)why='crossing';else if((peak(tx-1,ty)||peak(tx-2,ty))&&(peak(tx+1,ty)||peak(tx+2,ty))||(peak(tx,ty-1)||peak(tx,ty-2))&&(peak(tx,ty+1)||peak(tx,ty+2)))why='pass'}
      if(why)out.push({tx,ty,why})}
    for(const d of DEPOSITS||[])out.push({tx:d.tx,ty:d.ty,why:d.kind==='fish'?'fish':'deposit',g:d.g});
    return out},
  // (open ground by a spot to stand on: off the road, nothing built, a clear tile under the plinth and in front)
  stand(tx,ty){const N=STANDARD_PLACE.near;let best=null,bd=1e9;
    for(let j=-N;j<=N;j++)for(let i=-N;i<=N;i++){const x=tx+i,y=ty+j;if(x<2||y<2||x>=MW-2||y>=MH-2)continue;const k=tAt(x,y),f=tAt(x,y+1);
      if(k!==T_OPEN||!passable(f)||occAt(x,y)||occAt(x,y+1)||occAt(x-1,y))continue;const d=i*i+j*j+(hash(x,y,9301)*.5);if(d<bd){bd=d;best=[x,y]}}
    return best},
  // (anything built within STANDARD_PLACE.clear tiles: a holding's lots, its estates, its walls)
  built(tx,ty){const r=STANDARD_PLACE.clear;for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(occAt(tx+i,ty+j)>0)return true;return false},
  // (the realm holding the land at a tile, and whether another realm's land lies within r tiles)
  realmAt(tx,ty){const h=landHold((tx+.5)*TILE,(ty+.5)*TILE);return h&&h.owner&&h.owner!=='player'&&FACS[h.owner]?h.owner:null},
  border(tx,ty,f){const r=STANDARD_PLACE.border.r;for(let a=0;a<16;a++){const o=this.realmAt(Math.round(tx+Math.cos(a*Math.PI/8)*r),Math.round(ty+Math.sin(a*Math.PI/8)*r));if(o&&o!==f)return true}return false},
  place(){if(!STANDARD.on)return [];const S=STANDARD_PLACE,byProv=new Map();
        for(const p of this.spots()){const f=this.realmAt(p.tx,p.ty);if(!f||TOWNS.some(t=>Math.hypot(t.tx-p.tx,t.ty-p.ty)<S.town))continue;
      const at=this.stand(p.tx,p.ty);if(!at||this.built(at[0],at[1])||this.realmAt(at[0],at[1])!==f)continue;const pr=Provinces.at((at[0]+.5)*TILE,(at[1]+.5)*TILE);if(!pr)continue;
      const border=this.border(p.tx,p.ty,f);p.f=f;p.at=at;p.border=border;p.score=S.score[p.why]+(border?S.border.add:0)+hash(p.tx,p.ty,7717)*.01;
      if(!byProv.has(pr))byProv.set(pr,[]);byProv.get(pr).push(p)}
    const chosen=[];
    // (each province's best in turn, a kind already taken there worth S.same less: its crossings, fords and passes as well as its deposits)
    for(const [pr,L] of byProv){const n=Math.min(S.most,S.base+Math.floor(pr.holdings.length/S.per)),took={};let k=0,extra=false;
      while(true){let best=null,bs=-1e9;for(const p of L){if(p.used||!chosen.every(q=>Math.hypot(q.at[0]-p.at[0],q.at[1]-p.at[1])>=S.gap))continue;if(k>=n&&(extra||!p.border))continue;
          const v=p.score-S.same*(took[p.why==='fish'?'deposit':p.why]||0);if(v>bs){bs=v;best=p}}
        if(!best)break;best.used=true;chosen.push(best);took[best.why==='fish'?'deposit':best.why]=(took[best.why==='fish'?'deposit':best.why]||0)+1;if(k<n)k++;else extra=true}}
    return chosen.map((p,k)=>this.make(p,k))},
  make(p,k){const [tx,ty]=p.at,[x,y]=Standard.point(tx,ty),S=STANDARD_PLACE,lv=p.score>=S.lv[1]?3:p.score>=S.lv[0]?2:1,h=Spatial.nearestHolding(x,y),
      s=Object.assign(Object.create(Standard.prototype),{i:STANDARD.I0+k,type:'standard',tx,ty,x,y,seed:1+Math.floor(hash(tx,ty,4243)*99998),seen:false,cleared:false,back:0,
        owner:p.f,lv,why:p.why,g:p.g||null,guards:STANDARD.guards[lv],taking:null,choose:false});
    s.name=(h?h.name+' ':'')+(p.why==='deposit'&&GOODS[p.g]?GOODS[p.g].n.toLowerCase()+' ':'')+STANDARD_WHY[p.why];return s},
  hour(){for(const s of this.all())s.hour()}
};
Systems.add({name:'standards',order:{hour:45},hour:()=>Standards.hour()});

/* its picture: the standard (a stepped stone plinth, an iron pole with a gilt finial, a crossbar, two banners hung from it in its
   realm's colours with its device, a rope's tassel at an end; ragged, no one's) and, level 2 and 3, a watchtower or a stone tower
   (buildmodels.js) beside it in its realm's builders' style; ax, ay: the pole's foot. One picture a look */
const STANDARD_PICS=new Map();
function standardSprite(s){const f=s.realm,col=f?FACS[f].col:null,dev=f==='player'?'crown':f,key=(col||'-')+(dev||'')+s.lv+s.seed%3;let c=STANDARD_PICS.get(key);if(c)return c;
  const A=STANDARD_ART,W=22,H=40,g=pgrid(W,H),p=(x,y,c)=>pset(g,x,y,c),St=A.stone,I=A.iron,G=PPAL.gold;
  // (the plinth: three steps, each lit along its top, its right side in shade, mortar between its blocks)
  for(const [x0,w,y0,h] of [[3,16,36,4],[5,12,33,3],[7,8,30,3]])for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)p(x,y,y===y0?St[0]:x>=x0+w-2?St[2]:(x+y*3)%5===0?St[2]:St[1]);
  // (the pole, two pixels, lit on its left; its finial; the crossbar and its knobs)
  for(let y=3;y<30;y++){p(10,y,I[0]);p(11,y,I[1])}p(10,1,G[0]);p(11,1,G[1]);p(10,2,G[1]);p(11,2,G[2]);p(10,0,G[0]);
  for(let x=1;x<=20;x++){p(x,5,I[0]);p(x,6,I[2])}p(1,5,G[1]);p(20,5,G[1]);p(1,6,G[2]);p(20,6,G[2]);
  // (a rope's tassel from the crossbar's left end)
  for(let y=7;y<12;y++)p(1,y,A.rope);p(1,12,G[2]);p(2,12,A.rope);
  // (its two banners, 7 x 13, hung under the crossbar: the realm's colours, its device, their feet torn ragged; no one's: short rags)
  const R=col?PX.ramp(col):null,lum=col?[1,3,5].reduce((a,i,k)=>a+parseInt(col.slice(i,i+2),16)*[.3,.59,.11][k],0)/255:0,D=lum>.6?['#4a2226','#2a1418']:['#f6eedc','#d0c4a6'],T=dev&&BANNER_DEV[dev];
  for(const x0 of [3,13]){const len=R?13:7;for(let i=0;i<7;i++){const torn=Math.floor(hash(x0+i,s.seed%3,511)*(R?3:4));for(let r=0;r<len-torn;r++){
      const cR=R?(i===0?R[0]:i===6?R[2]:r>=len-torn-2?R[2]:R[1]):A.rag;p(x0+i,7+r,cR)}}
    if(R&&T&&T.length===5){const dv=new Set();T.forEach((row,y)=>[...row].forEach((q,x)=>{if(q!=='.')dv.add((x+1)+','+(y+3))}));
      for(const k of dv){const [i,r]=k.split(',').map(Number);for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])if(!dv.has((i+a)+','+(r+b))&&i+a>0&&i+a<6)p(x0+i+a,7+r+b,R[3])}
      T.forEach((row,y)=>[...row].forEach((q,x)=>{if(q!=='.')p(x0+x+1,7+y+3,q==='x'?D[1]:D[0])}))}}
  g.edge=true;poutline(g);const fl=pcanvas(g);
  // (its tower beside it, level 2 a watchtower, 3 a stone tower, in its realm's builders' style)
  let m=null;if(s.lv>=2&&typeof PX!=='undefined'&&PX.buildingModel)try{m=PX.buildingModel({type:s.lv>=3?'tower':'watchtower',culture:f&&f!=='player'&&FAC_CULTURE[f]||'vale',seed:s.seed%7+1})}catch(e){m=null}
  const tw=m?m.cell:0,CW=tw+W,CH=Math.max(H,tw),fx=tw?tw-6:0;
  c=mkc(CW,CH,q=>{if(m)q.drawImage(m.img,0,CH-tw);q.drawImage(fl,fx,CH-H)});c.ax=fx+11;c.ay=CH-2;
  if(m){c.gr=mkc(CW,CH,q=>q.drawImage(m.ground,0,CH-tw));c.sh=mkc(CW,CH,q=>q.drawImage(m.shadow,0,CH-tw))}
  STANDARD_PICS.set(key,c);return c}
