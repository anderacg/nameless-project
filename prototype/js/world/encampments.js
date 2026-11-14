'use strict';
/* ---------- encampments: camps where people live (doc/ENCAMPMENTS_DESIGN.md; the owner, 2026-11-14: "make a camp or location like
   actual places", "some people standing there have their life", "camp can be more larger area or have more tents etc based on
   people live there") ----------
   A camp (a site of type travelers, W.sites) is a kind of people (data/encampments.js ENCAMP_KINDS: merchants, prospectors,
   pilgrims, hunters, a hermit, refugees...) and how many live there (pop). Its tents follow them (CampSite: a tent for every
   ENCAMP.tents.per, round its fire, where the ground lets each stand); its people (CampFolk) live their day within your sight. A
   settled camp stays; a seasonal or wandering one moves on after its days, while you cannot see it (phase 1: doc §5). What you do
   there is its page: their wares, their sellswords or levies, their fire (a blessing, a song, a hermit's counsel, alms for
   refugees, news, rest) ---------- */
const travPrice=g=>Math.max(2,Math.ceil(GOODS[g].base*1.1*(1-.015*skillSafe('trade'))));
// (a sellsword a tier up costs his training too)
const mercCost=(k,u)=>Math.round((hireCost(u||k)+(u&&u!==k?trainCost(k):0))*1.3);
const SWORD_BYNAMES=['the Tall','Redhand','Ashfoot','the Quiet','Longstride','of the Marches','Two-Blades','the Grey','Stonefist','the Lucky','Crowfeather','Half-Ear'];
// where each kind pitches (ENCAMP_KINDS ground), by its tile: road (2-4 tiles off one, never by its side), a wood's edge, under the
// mountains, the desert, the wilds (sites.js wildLand: far from holdings and roads, out of the trees), by water near a road
const ENCAMP_GROUND={
  road:(tx,ty)=>tAt(tx,ty)===T_OPEN&&!nearTile(tx,ty,T_ROAD,1)&&nearTile(tx,ty,T_ROAD,4),
  wood:(tx,ty)=>tAt(tx,ty)===T_OPEN&&nearTile(tx,ty,T_FOREST,2)&&!nearTile(tx,ty,T_ROAD,1),
  hills:(tx,ty)=>(tAt(tx,ty)===T_OPEN||tAt(tx,ty)===T_HILL)&&nearTile(tx,ty,T_MOUNT,5)&&!nearTile(tx,ty,T_ROAD,1),
  desert:(tx,ty)=>tAt(tx,ty)===T_OPEN&&climAt((tx+.5)*TILE,(ty+.5)*TILE)==='desert'&&!nearTile(tx,ty,T_ROAD,1),
  wild:(tx,ty)=>tAt(tx,ty)!==T_FOREST&&wildLand().at[ty*MW+tx]===1,
  water:(tx,ty)=>tAt(tx,ty)===T_OPEN&&nearTile(tx,ty,T_WATER,3)&&!nearTile(tx,ty,T_ROAD,1)&&nearTile(tx,ty,T_ROAD,7)
};
// (room for its tents: 5 tiles by 3 round it with no water, peak, ford, road or lot, and few trees)
function encampClear(tx,ty){let wood=0;for(let j=-1;j<=1;j++)for(let i=-2;i<=2;i++){const t=tAt(tx+i,ty+j);if(t===T_WATER||t===T_MOUNT||t===T_FORD||t===T_ROAD||occAt(tx+i,ty+j))return false;if(t===T_FOREST)wood++}return wood<=4}
class Encampment extends Site{
  // (the old travellers' rules, for a kind not given: by a road)
  static ground(tx,ty){return ENCAMP_GROUND.road(tx,ty)}
  static pick(){return Encampment.spec(0).pick()}
  static clear(tx,ty){return encampClear(tx,ty)}
  // (the rules siteSpot places kind i by: its ground; a tile to try (by a road, or in the wilds, among those tiles; else anywhere))
  static spec(i){const K=ENCAMP_KINDS[i],g=ENCAMP_GROUND[K.ground]||ENCAMP_GROUND.road;
    const pick=K.ground==='road'||K.ground==='water'?()=>{const R=ROAD_TILES||(ROAD_TILES=tiles.reduce((a,k,i)=>(k===T_ROAD&&a.push(i),a),[]));if(!R.length)return Site.pick();const j=R[rint(0,R.length-1)];return[j%MW+rint(-4,4),(j-j%MW)/MW+rint(-4,4)]}:
      K.ground==='wild'?()=>{const L=wildLand().list;if(!L.length)return Site.pick();const j=L[rint(0,L.length-1)];return[j%MW,(j-j%MW)/MW]}:()=>Site.pick();
    return{pick,ground:g,clear:encampClear,fits:()=>true,reachRow:ty=>ty,point:Site.point}}
  // (how many of kind i world m holds: its count grown by the land, at least one (the owner: "at least one for each and scale based
  // on the world"); no world: the base)
  static count(i,m){const K=ENCAMP_KINDS[i];return m?Math.max(1,Math.round(K.count*Math.pow(worldMeasures(m).land,ENCAMP.count.pow))):K.count}
  // (a world's camps, kind by kind; a kind whose ground the world lacks (no desert) has none)
  static genAll(sites){ENCAMP_KINDS.forEach((K,i)=>{for(let n=Encampment.count(i,WM);n>0;n--){const p=siteSpot('travelers',sites,9,Encampment.spec(i));if(p)sites.push(makeSite('travelers',p[0],p[1],sites,{kind:i}))}})}
  get TR(){return ENCAMP_KINDS[this.kind]||ENCAMP_KINDS[0]}
  // (their people: the kind's, or those of the land it stands in (pilgrims, minstrels, refugees: race, set when made))
  get folkRace(){return this.TR.race||this.race||'human'}
  setup(){if(this.kind==null)this.kind=rint(0,ENCAMP_KINDS.length-1);this.settle();this.stockUp()}
  // (who lives here: how many, and the people of the land for a kind of no people of its own: the nearest holding's)
  settle(){const T=this.TR;this.pop=rint(T.pop[0],T.pop[1]);if(!T.race){const t=TOWNS.reduce((a,b)=>!a||Math.hypot(b.x-this.x,b.y-this.y)<Math.hypot(a.x-this.x,a.y-this.y)?b:a,null);this.race=t&&t.races?t.races[0]:'human'}}
  // (a camp from an older save: its people as many as the middle of its kind's)
  restore(){const T=this.TR;if(this.pop==null)this.pop=Math.round((T.pop[0]+T.pop[1])/2)}
  get settled(){return this.TR.life==='settled'}
  // who they are this time: their goods, their sellswords (or levies: refugees), and the days until they move on (none: settled)
  stockUp(){const T=this.TR,race=this.folkRace,st=ENCAMP.stay[T.life];this.name=T.n;this.until=st?G.day+rint(st[0],st[1]):null;this.stock=Object.fromEntries(T.goods.map(g=>[g,rint(8,20)]));
    this.unit=T.levy?peasantLevy(race):T.mercs?(Math.random()<.5?RACES[race].melee:RACES[race].ranged):null;this.mercs=this.unit?rint(2,4):0;this.news=false;this.special=false;this.fire=0;delete this.hired}
  // its sellswords (mercs: how many are still willing), each someone, seeded from the camp (its seed) and their place in line: a
  // name of their people, a look, and one in three a tier higher (dearer). Those hired leave the fire (hired: their places, kept
  // only once one is: the save is as it was until then)
  swords(){const u=this.unit,h=this.hired||[];if(!u)return [];const R=seeded(this.seed*977+31),N=FOLK_NAMES[this.folkRace]||FOLK_NAMES.human,used=new Set(),out=[];
    for(let i=0;i<this.mercs+h.length;i++){const k=R()<.34&&UP[u]&&UP[u][0]||u;let nm='';for(let j=0;j<20&&(!nm||used.has(nm));j++)nm=N[Math.floor(R()*N.length)]+' '+SWORD_BYNAMES[Math.floor(R()*SWORD_BYNAMES.length)];used.add(nm);
      const v=Math.floor(R()*6);if(!h.includes(i))out.push({i,k,name:nm,v,c:mercCost(k,u)})}return out}
  scoutLine(){return this.TR.see||'a camp of '+this.name.toLowerCase()}
  get empties(){return false}
  // (a seasonal or wandering camp moves on at its time, unseen (in your sight, it waits): the same people, to their kind's ground
  // elsewhere, new wares)
  day(){super.day();if(this.until==null||G.day<this.until||G.site===this||yourSight().sees(this.x,this.y,1.3))return;
    const p=siteSpot('travelers',W.sites.filter(o=>o!==this),9,Encampment.spec(this.kind));if(p){this.tx=p[0];this.ty=p[1];this.placed()}
    this.seen=false;this.stockUp();CampFolk.forget(this);if(G.lastSite===this)G.lastSite=null}
  // (its flag: a travelling band's pennant in its colour, its people's device (figures.js SHIELD_ART))
  flag(){return{k:'pennant',col:this.TR.col,dev:SHIELD_ART.dev[this.folkRace]||null}}
  banner(){return this.TR.col}
  /* on the map: its tents round its fire (CampSite), as many as its people need; its people about them within your sight. Its
     ground: the box its tents may take (tents: the ring CampSite lays them in) */
  get key(){return 'enc'+this.i+':'+this.seed}
  get tents(){const T=ENCAMP.tents;return clamp(Math.ceil(this.pop/T.per),1,T.most)}
  area(){const X=CAMP_SITE,r=this.tents>1?X.ring:4;return[this.x-r-8,this.y-r*X.squash-14,this.x+r+8,this.y+r*X.squash+3]}
  box(box){const a=this.area();box(this,a[0],a[1],a[2],a[3])}
  reachRadius(){const a=this.area();return boxReach(this,{x0:a[0],y0:a[1],x1:a[2],y1:a[3]})}
  footing(){return []}// (walked among: its tents are cloth)
  inView(V){return this.known()}
  // (its tents round its fire: CampSite's, a tent for every ENCAMP.tents.per of its people, within ENCAMP.tents.rings rings)
  layout(){const T=ENCAMP.tents;return CampSite.layout(this.key,this.x,this.y,this.pop,T.per,T.most,T.rings)}
  /* (its fire's ground, once, when it is first drawn: where it was placed, if enough of its tents may stand round it (CAMP_SITE.spot
     need); else the spot ENCAMP.ground.step px apart within ground.r of it, on ground a tent may take (no road: CampSite.tentOk), reachable from it, where the most do (trees and rocks
     the generator does not see, worldart.js). Kept with it (grounded) */
  ground(){if(this.grounded)return;this.grounded=true;const G=ENCAMP.ground,k=this.tents,need=Math.ceil(k*CAMP_SITE.spot.need),count=(x,y)=>CampSite.place(x,y,k,ENCAMP.tents.rings).length;
    let best={x:this.x,y:this.y,n:count(this.x,this.y)};if(best.n>=need)return;
    const c=[];for(let j=-G.r;j<=G.r;j+=G.step)for(let i=-G.r;i<=G.r;i+=G.step)if(i||j)c.push([Math.hypot(i,j),this.x+i,this.y+j]);c.sort((a,b)=>a[0]-b[0]);
    for(const [,x,y] of c){if(!passable(tAt(Math.floor(x/TILE),Math.floor(y/TILE)))||!CampSite.tentOk(x,y+4)||!Router.reach(this,{x,y}))continue;const n=count(x,y);if(n>best.n)best={x,y,n};if(n>=need)break}
    if(best.x!==this.x||best.y!==this.y){CampSite.strike(this.key);ENC_PROPS.delete(this.key);this.x=best.x;this.y=best.y;this.tx=Math.floor(best.x/TILE);this.ty=Math.floor(best.y/TILE)}}
  draw(ents,cam,V){if(!this.inView(V))return;const a=this.area();if(a[2]<cam.x-16||a[0]>cam.x+VW+16||a[3]<cam.y-16||a[1]>cam.y+VH+40)return;this.ground();
    CampSite.draw(ents,cam,{key:this.key,x:this.x,y:this.y,n:this.pop,per:ENCAMP.tents.per,most:ENCAMP.tents.most,rings:ENCAMP.tents.rings,seed:this.seed,pic:(q,i,clim)=>this.tentPic(q,i,clim)});this.drawProps(ents,cam);CampFolk.draw(this,ents,cam,V)}
  /* its pieces (ENCAMP_KINDS props: wagons, carts, crates, a shrine, drying racks, charcoal mounds), each where the ground lets it
     stand round its tents (CampSite.tentOk), ENCAMP_PROPS.gap from a tent and from one another, laid once from its seed */
  props(){const s=this,c=ENC_PROPS.get(s.key);if(c&&c.x===s.x&&c.y===s.y)return c.p;const X=ENCAMP_PROPS,sq=CAMP_SITE.squash,R=seeded(s.seed*131+71),out=[],
      L=s.layout(),r0=Math.max(10,...L.map(q=>Math.hypot(q.x-s.x,(q.y-s.y)/sq)))+X.ring,
      free=(x,y)=>Math.hypot(x-s.x,y-s.y)>=X.gap&&L.every(q=>Math.hypot(q.x-x,q.y-y)>=X.gap)&&out.every(q=>Math.hypot(q.x-x,q.y-y)>=X.gap)&&CampSite.tentOk(x,y);
    // (a piece that stacks: one heap of all of it; else each its own)
    for(const [type,n] of s.TR.props||[])for(let k=0,m=X[type].stack?1:n;k<m;k++){const a0=R()*Math.PI*2;let put=null;
      for(let r=r0-X.ring*.6;r<=r0+X.ring&&!put;r+=6)for(let j=0;j<16&&!put;j++){const a=a0+j/16*Math.PI*2,x=Math.round(s.x+Math.cos(a)*r),y=Math.round(s.y+Math.sin(a)*r*sq);if(free(x,y))put={type,x,y,s:Math.floor(R()*9),n:X[type].stack?n:1}}
      if(put)out.push(put)}
    ENC_PROPS.set(s.key,{x:s.x,y:s.y,p:out});return out}
  drawProps(ents,cam){const clim=CLIMS[climate[Math.floor(this.y/TILE)*MW+Math.floor(this.x/TILE)]]||'grass';
    const look=this.look(0);for(const q of this.props()){const pic=propPic(q,clim,look);ents.push({y:q.y,nf:1,f:()=>{const x=Math.round(q.x-cam.x-pic.ax),y=Math.round(q.y-cam.y-pic.ay+1);
      if(pic.sh){ctx.globalAlpha=SHADOW.a;ctx.drawImage(pic.sh,x,y);ctx.globalAlpha=1}ctx.drawImage(pic,x,y);if(ENCAMP_PROPS[q.type].smoke)propSmoke(x+(pic.width>>1),y+pic.height-7,q.s)}})}}
  // (its tents' look (ENCAMP_KINDS tents): tent i's style, cloth and trim; its biggest, the first, in the first style)
  look(i,seed=0){const T=this.TR.tents||{styles:['ridge'],cloth:CAMP_ART.canvas,trim:['#8a6a4a']},h=(this.seed+seed*7+i*13)>>>0;
    return{style:i===0?T.styles[0]:T.styles[h%T.styles.length],cloth:T.cloth[(h>>2)%T.cloth.length],trim:T.trim[(h>>4)%T.trim.length]}}
  tentPic(q,i,clim){const L=this.look(i,q.s);return CampArt.tent(L.style,L,this.seed+i,clim)}
  // (its picture on its page: its tents and fire as they stand)
  view(){const s=this,L=s.layout(),clim=CLIMS[climate[Math.floor(s.y/TILE)*MW+Math.floor(s.x/TILE)]]||'grass',fl=campFlame();
    if(!L.length)return super.view();
    const all=[...L.map((q,i)=>[q,s.tentPic(q,i,clim)]),...s.props().map(q=>[q,propPic(q,clim,s.look(0))])].sort((a,b)=>a[0].y-b[0].y);
    return{key:'enc:'+s.seed+':'+s.kind+':'+all.length,x:s.x,y:s.y,alt:s.name,ps:[...all.map(([q,p])=>[p,q.x-p.ax,q.y-p.ay+1]),fl&&[fl.img,s.x-fl.ax,s.y-fl.ay]].filter(Boolean)}}
  about(r){const T=this.TR;return '<p>'+T.d+'</p><p class="muted">'+(this.pop>1?'About '+this.pop+' people live here, in '+this.tents+' tent'+(this.tents>1?'s':'')+'.':'He lives here alone.')+
    (this.until!=null?' They break camp in '+Math.max(1,this.until-G.day)+' days.':' They stay.')+'</p>'}
  get stayLine(){return this.until!=null?'They move on in '+Math.max(1,this.until-G.day)+' days':'They stay here'}
  // their wagons (the traders: their goods, your trophies) and their campfire (each sellsword, the pilgrims or minstrels, whoever
  // has news, and the fire to rest by)
  // (its sellswords at the hiring desk, as a town's barracks (ui/hiredesk.js, acts site-rec-*): a row for each kind, those of it
  // by name; hired, the first in line of that kind take your coin. The order (G.siteHire) belongs to this visit)
  deskOf(){const s=this,sw=s.swords(),of=k=>sw.filter(w=>w.k===k),lv=s.TR.levy;
    return new HireDesk('site-rec-',{state:G.siteHire||(G.siteHire={}),kinds:[...new Set(sw.map(w=>w.k))],cost:k=>mercCost(k,s.unit),avail:k=>of(k).length,willing:s.mercs,
      line:k=>of(k).map(w=>w.name).join(', '),note:lv?'They will follow you for bread and a little coin, and the hope of a home. Too few for a unit of their own, they can still refill yours.':
        'Sellswords need no standing, only coin. Too few for a unit of their own, they can still refill yours. '+(s.until!=null?'They move on with the camp in '+Math.max(1,s.until-G.day)+' days.':''),
      hire:(k,n,tgt)=>{const ws=of(k).slice(0,n),cost=ws.reduce((a,w)=>a+w.c,0);
        if(ws.length<n)return {ok:false,why:'Not that many willing'};if(P.gold<cost)return {ok:false,why:'Not enough gold'};if(partySize()+n>partyCap())return {ok:false,why:'No room in your band'};
        if(partyRoster(P).add(k,n,tgt)!==n)return {ok:false,why:'No room in a group for more '+ST[k].n};
        P.gold-=cost;s.mercs-=n;s.pop=Math.max(1,s.pop-(lv?n:0));(s.hired=s.hired||[]).push(...ws.map(w=>w.i));log(ws.map(w=>w.name).join(', ')+(n>1?' take':' takes')+' your coin and '+(n>1?'join':'joins')+' you as '+(n>1?n+' × '+ST[k].n:an(ST[k].n.toLowerCase()))+'.');return {ok:true,cost}}})}
  places(r){const TR=this.TR,s=this,left=Object.keys(s.stock).filter(g=>s.stock[g]>0).length,race=s.folkRace,u=s.unit,lv=TR.levy,sp=TR.special;
    return [TR.goods.length&&{k:'trade',n:'Wagons',ico:'stall',note:left?left+' goods for sale':'sold out',
      body:railCards([{pic:personPic('merchant',race),name:'The traders',role:TR.n,facts:[left?left+' goods for sale':['Sold out','bad'],s.stayLine]}])+'<div class="lab">Goods</div>'+
        Object.keys(s.stock).map(g=>{const p=travPrice(g),n=s.stock[g],k=Math.min(5,n);return railRow(GOODS[g].n,p+'g each, '+n+' left, you have '+goodN(g)+(k?', '+k+' for '+p*k+'g':''),railBtn('site-buy',g,'Buy',!k?'Sold out':P.gold<p*k?'Not enough gold':goodRoom(g)<k?'No room in your bag':''))}).join('')+
        (P.inv.some(x=>x&&x.k==='mat')?railRow('Your trophies','They pay a little less than a town market: '+Math.round(P.inv.reduce((a,x)=>a+(x&&x.k==='mat'?matPrice(x.id)*x.n:0),0)*.85)+'g for all',railBtn('site-sellpick',null,'Sell')):'')},
      u&&{k:'hire',n:lv?'Volunteers':'Sellswords',short:'Hire',ico:'shield',note:s.mercs?s.mercs+(lv?' willing to follow you':' sellsword'+(s.mercs>1?'s':'')+' willing'):lv?'no one else will go':'no sellswords left',
        body:'<div class="top rec-top"><span class="lab">'+RACES[race].n+(lv?' volunteers, ':' sellswords, ')+unitsLine()+'</span><span class="lab">'+s.mercs+' willing</span></div>'+
          (s.mercs?s.deskOf().body():'<p class="muted">'+(lv?'No one else is fit or willing to go.':'No one is left to hire: the sellswords went with their pay.')+'</p>')},
      {k:'fire',n:'Campfire',short:'Fire',ico:'fire',note:[sp&&!s.special&&{bless:'a blessing',song:'a song',counsel:'counsel',alms:'alms'}[sp],sp==='counsel'||s.news===G.day?'':'news',s.fire===G.day?'rested today':'rest'].filter(Boolean).join(', '),
      body:railCards([
        sp==='bless'&&{pic:personPic('priest',race),name:'The pilgrims',role:'Robed, singing softly',facts:[s.special?'They have blessed you':'A blessing: your mana restored, morale +8'],acts:[['site-bless',null,'Kneel',s.special?'They have blessed you already':'']]},
        sp==='song'&&{pic:personPic('innkeeper',race,2),name:'The minstrels',role:'A fiddle and painted wagons',facts:[s.special?'They sing of you already':'15 gold: renown +3, morale +5'],acts:[['site-song',null,'Pay 15g',s.special?'They already sing of you':P.gold<15?'Not enough gold':'']]},
        sp==='counsel'&&{pic:personPic('priest',race,3),name:'The hermit',role:'Has watched these lands for years',facts:[s.counsel&&G.day-s.counsel<7?'He has counselled you this week':'His counsel: the places nearest you have not found, Survival practice, morale +4'],acts:[['site-counsel',null,'Ask his counsel',s.counsel&&G.day-s.counsel<7?'Come back in '+(7-(G.day-s.counsel))+' days':'']]},
        sp==='alms'&&{pic:personPic('folk',race,4),name:'An elder of the refugees',role:'Fled the fighting with her kin',facts:[s.alms===G.day?'You gave them alms today':'20 gold for food: renown +1, morale +3'],acts:[['site-alms',null,'Give 20g',s.alms===G.day?'You gave today':P.gold<20?'Not enough gold':'']]},
        sp!=='counsel'&&{pic:personPic('folk',race,5),name:'A greybeard by the fire',role:'Knows the roads',facts:[s.news===G.day?'You have heard his news today':s.news?'Tells what he hears on the roads':'Tells of places you have not found'],acts:[['site-news',null,'Ask for news',s.news===G.day?'You have heard their news today':'']]}])+
        '<div class="lab">The fire</div>'+railRow('Share their fire','Recover half your missing health, stamina and mana. Morale +5',railBtn('site-fire',null,'Rest',s.fire===G.day?'You rested here today':''))}].filter(Boolean)}
  // (the places nearest it you have not found (not a camp): n of them, now on your map)
  unfound(n){const s=this;return W.sites.filter(o=>!o.seen&&o.scoutable&&!(o instanceof Encampment)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)).slice(0,n)}
  act(a,arg,done){const s=this,tell=far=>far.length?'the '+far.map(o=>o.label+' to the '+compass(o.x-s.x,o.y-s.y)).join(', and the ')+'. '+(far.length>1?'Both are':'It is')+' on your map now.':'';
    if(a==='site-buy'){const g=arg,p=travPrice(g),k=Math.min(5,s.stock[g]||0);if(k&&P.gold>=p*k&&goodRoom(g)>=k){P.gold-=p*k;s.stock[g]-=k;invAdd('good',g,k);train('trade',k*p/40);done('You buy '+k+' '+GOODS[g].n.toLowerCase()+' for '+p*k+' gold.')}}
    // (Sell chooses first: which trophies; its Confirm sends site-sell with the bag's slots)
    else if(a==='site-sellpick'){const it=P.inv.map((x,i)=>[x,i]).filter(([x])=>x&&x.k==='mat');if(it.length)railPicker({title:'Sell trophies',sub:s.name,total:'They pay',unit:'g',confirm:['site-sell','Sell'],back:['site-tab','trade','Back'],encode:sel=>Object.keys(sel).filter(i=>sel[i]).join(','),
      items:it.map(([x,i])=>({id:i,name:MATS[x.id].n+' ×'+x.n,sub:Math.round(matPrice(x.id)*x.n*.85)+'g',max:1,unit:Math.round(matPrice(x.id)*x.n*.85)}))});return true}
    else if(a==='site-sell'){let g=0;const pick=arg?String(arg).split(',').map(Number):null;P.inv.forEach((x,i)=>{if(x&&x.k==='mat'&&(!pick||pick.includes(i))){g+=matPrice(x.id)*x.n;P.inv[i]=null}});g=Math.round(g*.85);if(g){P.gold+=g;train('trade',g/20);done('The travellers buy your trophies for '+g+' gold.')}}
    // (the hiring desk's acts: drawn again where it was, the focus back on the button pressed, or the list where you left it)
    else if(a.startsWith('site-rec-')){const d=s.deskOf();if(!d.act(a,arg))return true;updateHUD(true);const keep=panelScroll();showSite();panelScroll(keep);if(!d.focus(a))railFocus(a,arg);return true}
    else if(a==='site-fire'&&s.fire!==G.day){const m=vitals();s.fire=G.day;P.hp+=(m[0]-P.hp)/2;P.sp+=(m[1]-P.sp)/2;P.mp+=(m[2]-P.mp)/2;P.morale=clamp(P.morale+5,0,100);done('You share their fire and their stew. Everyone sleeps well.')}
    else if(a==='site-news'&&s.news!==G.day){const first=!s.news;s.news=G.day;
      const far=first?s.unfound(2):[];far.forEach(o=>o.seen=true);const it=rumourFrom(rumourSource('camp',s.tx+','+s.ty,s)).today[0];
      done([far.length?'They tell you of '+tell(far):'',it?'“'+rumourText(it)+'”':''].filter(Boolean).join(' ')||'They have no news you have not heard.')}
    else if(a==='site-counsel'&&!(s.counsel&&G.day-s.counsel<7)){s.counsel=G.day;const far=s.unfound(2);far.forEach(o=>o.seen=true);train('surv',6);P.morale=clamp(P.morale+4,0,100);
      done(far.length?'The hermit draws in the ash with a stick: '+tell(far):'The hermit talks of weather, roots and old roads. You learn more than you expected.')}
    else if(a==='site-alms'&&s.alms!==G.day&&P.gold>=20){s.alms=G.day;P.gold-=20;P.renown+=1;s.helped=(s.helped||0)+1;P.morale=clamp(P.morale+3,0,100);done('They buy bread with your coin. The children stare at your banner. (+1 renown)')}
    else if(a==='site-bless'&&!s.special){s.special=true;vitals();P.mp=maxMP();P.morale=clamp(P.morale+8,0,100);done('The pilgrims pray over you. Your mind is clear.')}
    else if(a==='site-song'&&!s.special&&P.gold>=15){s.special=true;P.gold-=15;P.renown+=3;P.morale=clamp(P.morale+5,0,100);done('By the next town, children are singing of you. (+3 renown)')}
    return true}
}
const TravellersCamp=Encampment;// (the old name)
const ENC_PROPS=new Map();onWorld(()=>ENC_PROPS.clear());
// (a piece's picture (gfx/campart.js), a heap of n for one that stacks, in its camp's colours, of the ground's climate)
const propPic=(q,clim,L)=>CampArt.prop(q.type,q.n||1,q.s,clim,L);
// (a mound's thin smoke, rising and fading on the real clock)
function propSmoke(x,y,s){const t=performance.now()/1000;ctx.save();for(let k=0;k<3;k++){const u=(t*.4+k/3+s*.1)%1;ctx.globalAlpha=.45*(1-u);ctx.fillStyle='#bdb6a8';ctx.fillRect(Math.round(x+Math.sin(u*5+s)*2),Math.round(y-u*14),1,1)}ctx.restore()}
/* a camp's person on the map (CampFolk makes them): a world object you can click within your sight, to talk to him: the camp's page
   opens at his place there (ENCAMP_ROLES at), his greeting over it */
class CampDweller extends WorldObject{
  get mapKind(){return 'dweller'}
  here(){const C=CampFolk.of.get(this.site);return !!C&&C.ppl.includes(this)}
  get meetsAnyTime(){return true}
  inView(V){return !this.hid&&yourSight(V).sees(this.x,this.y,1.2)}
  pick(at){if(this.inView(at.V))at.add(this,6,4)}
  meet(){CampFolk.meet(this)}
  get calling(){return this.role==='folk'?'one of the '+this.site.name.toLowerCase():an(this.role)}
  tip(){return '<b>'+this.name+'</b><small>'+cap1(this.calling)+', of the '+this.site.name.toLowerCase()+'</small><span class="act">Click: talk</span>'}
}
SITE_CLASS.travelers=Encampment;

/* ---------- a camp's people (doc §4): made from its seed when it comes near you (ENCAMP.folk.near), never saved, as the estates'
   workers are (world/folk.js); each where the hour says: asleep in his tent by night (the watch by the fire, another walking the
   ring), round the fire at dawn and dusk, at his work by day (ENCAMP_ROLES: the fire, the ring, the wares, his tent's door, out to
   the woods or the rocks and back, a prayer at midday, music, children at play). A band or a beast near sends them into their tents,
   the guards to the fire. Drawn only within your sight. Their own seeded draws: the world's Math.random untouched ---------- */
class CampFolk{
  static of=new Map();
  static forget(s){this.of.delete(s)}
  // (who lives there: pop people (most at most), their roles filled in the kind's order and shares, each his tent, his seat at the
  // fire, his look, his own stream)
  static make(s){s.ground();const T=s.TR,F=ENCAMP.folk,n=Math.min(s.pop,F.most),L=s.layout().slice(),R=seeded(s.seed*7919+13),roles=[];
    for(const [r,sh] of T.roles){const k=Math.max(1,Math.round(sh*n));for(let j=0;j<k&&roles.length<n;j++)roles.push(r)}while(roles.length<n)roles.push(T.roles[0][0]);
    const bare=!L.length;if(bare)L.push({x:s.x+10,y:s.y-4});
    const N=FOLK_NAMES[s.folkRace]||FOLK_NAMES.human,ppl=roles.map((role,i)=>{const a=(i+.5)/n*Math.PI*2,q=L[i%L.length];return Object.assign(new CampDweller(),{site:s,name:N[folkHash(s.seed+'|'+i)%N.length],role,R:ENCAMP_ROLES[role],i,v:Math.floor(R()*7),door:{x:q.x+3,y:q.y+3},seat:{x:s.x+Math.cos(a)*F.seat,y:s.y+3+Math.sin(a)*F.seat*CAMP_SITE.squash},
      x:s.x,y:s.y,tx:s.x,ty:s.y,wait:0,walked:0,dir:R()<.5?-1:1,mode:null,hid:false,R2:seeded(s.seed*31+i*977+5)})});
    const watch=ppl.filter(p=>p.R.watch);watch.forEach((p,j)=>p.watch=j===0?'fire':j===1?'ring':null);
    const C={s,L,bare,ppl,P:s.props(),beasts:this.herd(s,L,s.props()),ring:Math.max(...L.map(q=>Math.hypot(q.x-s.x,(q.y-s.y)/CAMP_SITE.squash)),8)+F.ring};this.of.set(s,C);
    // (placed where the hour has them: as if you had watched all along)
    for(const p of ppl){this.aim(C,p,this.mode(C,p),true);p.x=p.tx;p.y=p.ty;p.wait=p.R2()*2;if(p.mode==='sleep')p.hid=true}
    return C}
  // (what he does now: sleep, watch (by the fire), ring (walking it), seat (at the fire), work, hide (in his tent: danger))
  static mode(C,p){const m=this.mode0(C,p);return m==='sleep'&&C.bare?'seat':m}// (no tent stands: they sleep round the fire)
  static mode0(C,p){const f=Clock.frac,D=ENCAMP.day,night=f>=D.dusk,danger=C.danger;
    if(danger)return p.R.watch||p.role==='guard'?'seat':'sleep';
    if(night)return p.watch==='fire'?'seat':p.watch==='ring'?'ring':'sleep';
    if(f<D.dawn||f>=D.work)return 'seat';
    return 'work'}
  // (its animals (ENCAMP_KINDS beasts: the prospectors' goats, the nomads' camels and goats): each tethered past the tents on ground
  // it may stand (not water, rock or a road, clear of tents and pieces), grazing round it)
  static herd(s,L,P){const G=ENCAMP.folk.graze,R=seeded(s.seed*577+29),out=[],r0=Math.max(10,...L.map(q=>Math.hypot(q.x-s.x,(q.y-s.y)/CAMP_SITE.squash)))+G.out;
    const ok=(x,y)=>{const t=tAt(Math.floor(x/TILE),Math.floor(y/TILE));return passable(t)&&t!==T_ROAD&&t!==T_FORD&&[...L,...P,...out].every(q=>Math.hypot(q.x-x,q.y-y)>=10)};
    for(const [id,n] of s.TR.beasts||[]){if(!CRITTERS[id])continue;const a0=R()*Math.PI*2;for(let k=0;k<n;k++){let put=null;
      for(let j=0;j<24&&!put;j++){const a=a0+(k*.35+j/24)*Math.PI*2,x=s.x+Math.cos(a)*r0,y=s.y+Math.sin(a)*r0*CAMP_SITE.squash;if(ok(x,y))put={id,x,y,hx:x,hy:y,tx:x,ty:y,wait:R()*G.pause[1],walked:0,dir:R()<.5?-1:1,v:Math.floor(R()*5),R:seeded(s.seed*13+out.length*101+7)}}
      if(put)out.push(put)}}
    return out}
  // (an animal's moment: by day it grazes, a few px at a time round its tether; by night, or with danger near, it stands)
  static graze(C,b,d){const G=ENCAMP.folk.graze,f=Clock.frac;b.moving=false;if(f>=ENCAMP.day.dusk||C.danger)return;if(b.wait>0){b.wait-=d;return}
    const dx=b.tx-b.x,dy=b.ty-b.y,dd=Math.hypot(dx,dy);
    if(dd>.5){const st=Math.min(dd,moveStep(G.speed,d));b.x+=dx/dd*st;b.y+=dy/dd*st;b.walked+=st;if(Math.abs(dx)>.2)b.dir=dx>0?1:-1;b.moving=true;return}
    const a=b.R()*Math.PI*2,r=b.R()*G.r,x=b.hx+Math.cos(a)*r,y=b.hy+Math.sin(a)*r*.7;if(passable(tAt(Math.floor(x/TILE),Math.floor(y/TILE)))){b.tx=x;b.ty=y}b.wait=G.pause[0]+b.R()*(G.pause[1]-G.pause[0])}
  // (where he goes next for that, from where he is; fresh: placed there at once)
  static aim(C,p,mode,fresh){const s=C.s,F=ENCAMP.folk,R=p.R2,w=p.R.work,f=Clock.frac,pray=f>=ENCAMP.day.pray[0]&&f<ENCAMP.day.pray[1];p.mode=mode;p.kneel=false;p.play=false;
    const go=(x,y,wait)=>{p.tx=x;p.ty=y;p.wait=wait||0};
    if(mode==='sleep')return go(p.door.x,p.door.y);
    if(mode==='seat'){p.play=w==='play';return go(p.seat.x,p.seat.y)}
    const ring=()=>{p.wi=((p.wi??Math.floor(R()*8))+1)%8;const a=p.wi/8*Math.PI*2;go(s.x+Math.cos(a)*C.ring,s.y+Math.sin(a)*C.ring*CAMP_SITE.squash,R()*1.2)};
    if(mode==='ring')return ring();
    if(w==='ring')return ring();
    if(w==='fire')return go(s.x+(p.i%2?7:-7),s.y+2+R()*2,F.pause[0]);
    // (by the wares: a wagon, a stall or the crates; about the carts and barrels; a burner at his mound; else by the first tent)
    const by=ks=>C.P.find(q=>ks.includes(q.type));
    if(w==='goods'){const q=by(['stall','wagon','crates'])||C.L[0];return go(q.x-8+R()*4,q.y+5,F.pause[0]+R()*F.pause[1])}
    if(w==='tend'){const q=by(['wagon','cart','barrels'])||C.L[0];return go(q.x-12+R()*10,q.y+6+R()*3,F.pause[0]+R()*F.pause[1])}
    if(w==='tent'){const q=p.role==='burner'&&by(['mound']);if(q)return go(q.x+(p.i%2?9:-9),q.y+2,F.pause[1]);return go(p.door.x+4,p.door.y,F.pause[1])}
    if(w==='pray'){if(pray){p.kneel=true;return go(p.seat.x,p.seat.y,F.pause[1])}return go(p.door.x+R()*6-3,p.door.y+2,F.pause[0]+R()*F.pause[1])}
    if(w==='play'){p.play=true;return go(p.seat.x+R()*4-2,p.seat.y,F.pause[1])}
    if(w==='run'){const q=C.L[Math.floor(R()*C.L.length)];return go(q.x+R()*10-5,q.y+4+R()*4,R()*F.pause[0])}
    if(w==='out'){// (out to his day's spot on his ground and back, again and again; fresh: at it)
      if(!p.spot||p.spotDay!==G.day){p.spot=this.spot(C,p);p.spotDay=G.day}
      if(fresh||!p.leg||p.leg==='back'){p.leg='go';return go(p.spot.x,p.spot.y,fresh?0:F.pause[0]+R()*F.pause[1])}p.leg='back';return go(p.door.x,p.door.y)}
    const q=C.L[Math.floor(R()*C.L.length)];return go(q.x+R()*16-8,q.y+6+R()*6,F.pause[0]+R()*F.pause[1])}
  // (his work spot: a tile of his kind of ground (to) out ENCAMP.folk.out tiles, one he can walk to (Router.reach: round water and rock
  // by the router's ways, step); none: near the camp)
  static spot(C,p){const s=C.s,F=ENCAMP.folk,R=p.R2,to=p.R.to,ok=k=>to==='wood'?k===T_FOREST:to==='rock'?k===T_HILL||k===T_MOUNT:to==='grass'?k===T_OPEN:k!==T_WATER&&k!==T_ROAD&&k!==T_FORD;
    for(let k=0;k<40;k++){const a=R()*Math.PI*2,d=(F.out[0]+R()*(F.out[1]-F.out[0]))*TILE,x=s.x+Math.cos(a)*d,y=s.y+Math.sin(a)*d,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),t=tAt(tx,ty);
      if(!ok(t)||t===T_MOUNT&&!nearTile(tx,ty,T_HILL,0)||!passable(t))continue;if(Router.reach({x:s.x,y:s.y},{x,y}))return{x,y}}
    return{x:s.x+(R()<.5?-1:1)*TILE*2,y:s.y+TILE}}
  // (everyone out of his tent, for a click: world.js worldObjects)
  static all(){const out=[];for(const C of this.of.values())for(const p of C.ppl)if(!p.hid)out.push(p);return out}
  // (talked to: his camp's page, at his place in it if it has one (no wares: its fire), his greeting over it)
  static meet(p){const s=p.site,at=p.R.at==='trade'&&!s.TR.goods.length||p.R.at==='hire'&&!s.unit?'fire':p.R.at;s.meet();if(G.site!==s)return;
    G.siteTab=at;G.siteMsg=htmlText(p.name)+', '+p.calling+', '+p.R.say+'.';showSite()}
  // each moment: the camps near you have their people, those far forget them; each walks to where he is going, stops a while, and
  // goes on to the next; going to sleep, he goes into his tent at its door (unseen), and out of it again when he wakes
  static step(d){const F=ENCAMP.folk;if(!W.sites)return;
    for(const [s] of this.of)if(!W.sites.includes(s)||s.cleared||Math.hypot(s.x-P.x,s.y-P.y)>F.near+120)this.of.delete(s);
    for(const s of W.sites){if(!(s instanceof Encampment)||s.cleared||!s.known()||Math.hypot(s.x-P.x,s.y-P.y)>F.near)continue;
      const C=this.of.get(s)||this.make(s);C.danger=folkThreat(s.x,s.y,F.danger);for(const b of C.beasts)this.graze(C,b,d);
      for(const p of C.ppl){const m=this.mode(C,p);if(m!==p.mode){if(p.hid&&m!=='sleep'){p.hid=false;p.x=p.door.x;p.y=p.door.y}this.aim(C,p,m)}
        if(p.hid){p.moving=false;continue}
        if(p.wait>0){p.wait-=d;p.moving=false;continue}
        const dx=p.tx-p.x,dy=p.ty-p.y,dd=Math.hypot(dx,dy);
        // (a long walk, out to his work or home from it, by the router's ways (WAY.folk: a worker's); within the camp, or none found, straight)
        if(dd>1){const st=Math.min(dd,moveStep(F.speed*(p.R.child?F.run:1)*(C.danger?1.6:1),d)),x0=p.x,y0=p.y;
          if(!(dd>F.route*TILE&&Router.travel(p,{x:p.tx,y:p.ty,road:WAY.folk},st)&&Math.hypot(p.x-x0,p.y-y0)>st*.2)){p.x=x0+dx/dd*st;p.y=y0+dy/dd*st}
          const m=Math.hypot(p.x-x0,p.y-y0);p.walked+=m;if(Math.abs(p.x-x0)>.05)p.dir=p.x>x0?1:-1;p.moving=true;continue}
        p.moving=false;if(p.mode==='sleep'){p.hid=true;continue}
        // (there: at work out on his ground a while; else on to the next of his round)
        if(p.R.work==='out'&&p.mode==='work'&&p.leg==='go'){p.wait=F.work[0]+p.R2()*(F.work[1]-F.work[0]);p.leg='at';continue}
        this.aim(C,p,p.mode)}}}
  // (its people within your sight, each by his feet: a soldier of their people for a guard, a hunter or a ranger, else in their dress
  // (people.js folkLook); sitting or kneeling at the fire: his legs hidden; a child smaller; the players bob to their tune)
  static draw(s,ents,cam,V){const C=this.of.get(s);if(!C)return;const cl=dressClimAt(s.x,s.y),S=yourSight(V),k0=WORLD_BATTLE.sprite/WORLD_BATTLE.scale,race=s.folkRace,now=performance.now()/1000;
    // (its animals as the herds are drawn (critters.js, gfx/sprites.js critterArt): their battle figure at the marchers' scale)
    for(const b of C.beasts){if(!S.sees(b.x,b.y,1.2))continue;ents.push({y:b.y,f:()=>{const A0=critterArt(b.id,0,b.v),N=PX.MAP_STEPS,fr=b.moving?Math.floor(b.walked/Math.max(4,A0.w)*N)%N:0,A=critterArt(b.id,fr,b.v),sx=Math.round(b.x-cam.x),sy=Math.round(b.y-cam.y),w=Math.max(4,A.w-2);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-(w>>1),sy-1,w,2);ctx.save();ctx.translate(sx,sy);ctx.scale(b.dir<0?-A.k:A.k,A.k);ctx.drawImage(A.s,-(A.s.width>>1),-A.s.height+(A.k<1?2:1));ctx.restore()}})}
    for(const p of C.ppl){if(p.hid||!S.sees(p.x,p.y,1.2))continue;
      ents.push({y:p.y,f:()=>dressedIn(cl,()=>{const pose=p.moving?2+Math.floor(p.walked/WALK.foot)%4:0,sp=p.R.unit?unitSprite(RACES[race][p.R.unit],0,false,p.v,pose,false,false,s.TR.col):personSprite(p.R.look,race,p.v+p.i,pose),
        k=k0*(p.R.child?.72:1),low=!p.moving&&(p.kneel||p.mode==='seat'&&!p.R.watch&&!p.play)?4:0,bob=p.play&&!p.moving&&Math.floor(now*3+p.i)%2?1:0,sx=Math.round(p.x-cam.x),sy=Math.round(p.y-cam.y),W2=sp.width,H=sp.height;
        ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-2,sy-1,5,2);ctx.save();ctx.translate(sx,sy-bob);ctx.scale(p.dir<0?-k:k,k);ctx.drawImage(sp,0,0,W2,H-low,-Math.floor(W2/2),-H+2+low,W2,H-low);ctx.restore()})})}}
}
Systems.add({name:'camp folk',order:{frame:141},frame:d=>CampFolk.step(d)});
onWorld(()=>CampFolk.of.clear());
