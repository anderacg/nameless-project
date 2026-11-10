'use strict';
/* ---------- standards (doc/STANDARDS_DESIGN.md, phase 1; the owner, 2026-11-10: "every factions will also have a static flag in
   their territory, and around that they may have tower or buildings to defense ... This tower and flag can be captured"): a
   realm's standard on its land, at a road crossing, a pass, a ford or a natural resource (Standards.place), a site of its own kind
   in W.sites (saved with them). Its level (1-3): the standard alone, a wooden watchtower by it, a stone tower; its guards
   (STANDARD.guards) by it, back a day while its realm holds it. You take one by beating its guards and staying by it STANDARD.hold
   hours: for the realm you serve (P.fac), for yourself once you hold a holding of your own, else for a realm near it you hand it
   to, or no one. Phase 1: placed, drawn, held, saved, taken by you. Phase 2: its sentries walking their beat round it; held in
   peace it grows a level, paid in timber and stone from its realm's nearest holding (STANDARD.grow); taken, its tower is broken
   (fewer guards) and mended slowly, again on timber and stone (STANDARD.repair) ---------- */
// (what stands there by its level, in words: the owner, 2026-11-10, "can we rename it to something more straightforward?": an outpost
// to the player, a standard in the code)
const STANDARD_LV=['','a flag post','a flag post and a watchtower','a flag post and a stone tower'];
class Standard extends Site{
  get T(){return STANDARD.T}
  get screen(){return PAGE_SCREEN}
  get scoutable(){return false}
  get empties(){return false}
  // (known once you have seen its ground, as a holding is)
  known(){return this.seen||seenAt(this.x,this.y)}
  // (its realm: a realm of the world's, yours ('player'), or none; band: the bandits, raiders, bog raiders or goblins who hold it
  // as their lair, phase 3)
  get realm(){return this.owner&&(this.owner==='player'||FACS[this.owner])?this.owner:null}
  get band(){return STANDARD.lair.kinds.includes(this.owner)?this.owner:null}
  ownerName(){const f=this.realm,b=this.band;return f==='player'?'yours':f?'the '+FACS[f].n:b?LAIR_SAY[b].toLowerCase():''}
  col(){const f=this.realm,b=this.band;return f?FACS[f].col:b?(b==='goblins'?GOBLINS.col:BAND_FLAG[b]||BAND_FLAG.bandits):STANDARD_ART.rag}
  banner(){const f=this.realm,b=this.band;return f?{k:'banner',col:FACS[f].col,dev:f==='player'?'crown':f}:b?{k:'rag',col:this.col(),dev:'skull'}:null}
  flag(){return this.banner()||{k:'rag',col:STANDARD_ART.rag,dev:null}}
  // (yours to keep: your realm's, or your employer's)
  get ours(){const f=this.realm;return !!f&&(f==='player'||f===P.fac)}
  // (as many guards as its level keeps: one level fewer while its tower lies broken)
  get most(){return STANDARD.guards[Math.max(1,this.lv-(this.broken?1:0))]||0}
  // (its tower standing to fight from (phase 5): its level, 0 for a flag post alone or a tower lying broken, its top gone)
  get towerLv(){return this.lv>=2&&!this.broken?this.lv:0}
  // its guards, as its realm's soldiers
  guardList(){const f=this.realm,b=this.band,t=this.supplier();if(this.guards<=0)return [];if(b)return b==='goblins'?goblinList(this.guards,true):makeEnemies(this.guards,true,b);
    return f==='player'?(t?garList({...t,gar:this.guards}):[]):f?armyOf(f,this.guards):[]}
  // (beaten off or withdrawn from: those of its guards you slew stay dead: engage.js ON_WIN.standard lost)
  held(slain){const n=(slain||[]).filter(k=>ST[k]&&!ST[k].beast&&k!=='chief').length;this.guards=Math.max(0,this.guards-n)}
  whyText(){return this.why==='deposit'||this.why==='fish'?'by the '+(GOODS[this.g]?GOODS[this.g].n.toLowerCase():'')+' '+(this.why==='fish'?'waters':'deposit'):'at the '+STANDARD_WHY[this.why]}
  // the day: its realm fallen, it is no one's; else its realm sends a guard back while it holds it in peace
  day(){const f=this.realm;if(f&&f!=='player'&&W.dead[f]){this.owner=null;this.guards=0;return}
    if(this.taking||this.choose)return;if(this.band){this.raid();return}if(!f)return;
    if(this.guards<this.most){if(f!=='player')this.guards=Math.min(this.most,this.guards+STANDARD.regrow);
      else{const t=this.supplier();if(t&&t.gar>STANDARD.own.keep){t.gar--;this.guards++}}}// (yours: a man a day from your nearest holding's garrison, while it keeps STANDARD.own.keep)
    this.work()}
  /* (a band's lair, phase 3: every STANDARD.lair.every days, while fewer than STANDARD.lair.most of its raiders are out, a band
     rides out of it to raid the roads round it (world.js bandits; a goblins' warband), its own men left at the lair) */
  raid(){const L=STANDARD.lair,b=this.band;if(G.day-(this.raided||0)<L.every)return;const out=bandits.filter(o=>o.lair===this.i&&!o.gone).length;if(out>=L.most)return;this.raided=G.day;
    const n=rint(...L.n)+Math.floor(G.day/15),x=this.x,y=this.y+20,ld=newChief(b,1+Math.floor(G.day/25));
    bandits.push(asParty(b==='goblins'?{x,y,n,kind:'goblins',list:goblinList(n,false),t:0,a:0,idle:false,cool:0,ld,haunt:{x:this.x,y:this.y},lair:this.i}:{x,y,n,kind:b,list:makeEnemies(n,false,b),t:0,a:0,idle:false,cool:0,ld,lair:this.i}))}
  /* (the world's captures, phase 3, once a day: a lord at war with its realm, or come for a lair or a standard no one holds, with
     STANDARD.capture.more times its guards or more within capture.r tiles takes it for his realm (his realm's again, if it was
     theirs); a band within reach of one held by STANDARD.capture.weak guards or fewer, of its realm or of no one, takes it for its
     lair, its men its guards, its chieftain theirs) */
  contest(){const C=STANDARD.capture,R=C.r*TILE,f=this.realm,b=this.band;if(this.taking||this.choose)return;
    const near=o=>Math.hypot(o.x-this.x,o.y-this.y)<R,want=l=>!l.dead&&!l.inside&&!l.fight&&l.fac!==f&&(b||!f||f!=='player'&&atWar(l.fac,f)||f==='player'&&hostileTo(l.fac))&&near(l)&&l.troops.length>=Math.max(1,this.guards)*C.more;
    const L=W.lords.find(want);if(L&&Math.random()<C.chance)return this.taken(L.fac,lordName(L));
    if(b||f==='player'||this.guards>C.weak)return;const B=bandits.find(o=>!o.gone&&STANDARD.lair.kinds.includes(o.kind)&&near(o)&&o.troops.length>this.guards&&!o.lair);
    if(B&&Math.random()<C.chance){const n=B.troops.length,ld=B.ld;bandits=bandits.filter(o=>o!==B);worldEmit('band:beaten',{band:B});this.taken(B.kind,null);this.guards=Math.min(C.lairMost,n);this.ld=ld||null}}
  // (taken in the world: its new holder, its tower broken, word of it to you as the world's news go: worldlog.js worldEvent)
  taken(to,who){const was=this.realm||this.band;this.owner=to;this.choose=false;this.taking=null;this.guards=this.realm&&this.realm!=='player'?Math.max(1,this.guards>>1):0;
    if(this.lv>=2)this.broken=true;this.fix=0;this.since=G.day;this.need=null;worldEmit('standard:taken',{standard:this,from:was,to,by:who||to});
    const W0=n=>n&&FACS[n]?'the '+FACS[n].n:n?LAIR_SAY[n]||n:'no one',text=(who?who+' takes':cap1(W0(to))+' take')+' the '+this.name+(was?' from '+W0(was):'')+'.';
    worldEvent({text,cls:to===P.fac||was===P.fac&&!!was?(to===P.fac?'good':'bad'):'',fac:[to,was].filter(k=>FACS[k]),x:this.x,y:this.y,kind:'war'})}
  // (an hour: your banner going up; and yours and your employer's lifting the fog round them, STANDARD.sight tiles)
  watch(){if(this.ours)revealDisk(this.x,this.y,STANDARD.sight*TILE)}
  // (the holding of its realm that pays for its works: the nearest of its realm's)
  supplier(){const f=this.realm;if(!f)return null;const F=fiefsOf(f);return F.length?Spatial.nearest(F,this.x,this.y):null}
  // (its works this day: a broken tower mended, STANDARD.repair days on, once its goods are paid; else, held in peace long enough,
  // the next level, once paid. need: what it waits for, for its page)
  work(){const R=STANDARD.repair,Gw=STANDARD.grow,t=this.supplier();this.need=null;
    if(this.broken){this.fix=(this.fix||0)+1;if(this.fix>=R.days){if(this.pay(t,R.cost)){this.broken=false;this.fix=0}else this.need=R.cost}return}
    if(this.lv>=3||G.day-(this.since||0)<Gw.days[this.lv])return;const c=Gw.cost[this.lv+1];
    if(this.pay(t,c)){this.lv++;this.since=G.day;Standards.reserve();worldEmit('standard:grown',{standard:this})}else this.need=c}
  // (its goods out of a holding's stores: all or none)
  pay(t,cost){if(!t||!t.stock)return false;for(const g in cost)if((t.stock[g]||0)<cost[g])return false;for(const g in cost)t.stock[g]-=cost[g];return true}
  costText(c){return Object.entries(c).map(([g,n])=>n+' '+GOODS[g].n.toLowerCase()).join(' and ')}
  // put back after a load: its point, and its tiles kept free of building (Standards.reserve)
  placed(){super.placed();Standards.reserve()}
  // (its tiles: its plinth's, the tile in front, its tower's beside it)
  tiles(){const L=[];for(let j=-1;j<=1;j++)for(let i=this.lv>=2?-3:-1;i<=1;i++)L.push([this.tx+i,this.ty+j]);return L}
  mapDot(V){return this.known()?[this.col(),2]:null}
  tip(){const f=this.ownerName();return '<b>'+Discovery.nameOf(this)+'</b><small>'+(f?'Held by '+f:'Held by no one')+', '+STANDARD_LV[this.lv]+(this.broken?' (broken)':'')+(this.guards?', '+roughly(this.guards)+' guards':'')+'</small><span class="act">Click: go there</span>'}
  sprite(){return standardSprite(this)}
  // (on the map: it, and its sentries walking their beat round it in your sight, a lap each STANDARD.sentries.lap game minutes)
  // (not while a battle is fought on the map: its guards are in it, StandardTower)
  draw(ents,cam,V){super.draw(ents,cam,V);const X=STANDARD.sentries,n=Math.min(X.most,this.guards),f=this.realm;if(!n||!f||B&&B.world||!this.inView(V)||!yourSight(V).sees(this.x,this.y,1))return;
    const type=this.sentryType(),col=FACS[f].col,mins=(G.day+Clock.frac)*1440;
    for(let i=0;i<n;i++){const a=(mins/X.lap+i/n)*Math.PI*2,x=this.x+Math.cos(a)*X.r,y=this.y+4+Math.sin(a)*X.r*.5,dir=-Math.sin(a)<0?-1:1,step=Math.floor(mins/X.stride+i)%4;
      ents.push({y,f:()=>reduced(()=>{const s=unitSprite(type,0,false,(this.seed+i)%6,2+step,false,false,col),k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale;
        ctx.save();ctx.translate(Math.round(x-cam.x),Math.round(y-cam.y));ctx.scale(dir*k,k);ctx.drawImage(s,-Math.floor(s.width/2),-s.height+2);ctx.restore()})})}}
  // (who they are: its realm's foot soldiers, as its nearest holding's garrison is made: realms.js garList)
  sentryType(){if(this._st&&this._st[0]===this.realm)return this._st[1];const t=this.supplier(),k=t?garList({...t,gar:1})[0]:'militia';Object.defineProperty(this,'_st',{value:[this.realm,k],configurable:true,writable:true});return k}
  // (what stands in the way, world px: its plinth, and its tower beside it)
  footing(){const sp=this.sprite(),X=this.x-sp.ax,Y=this.y+8-sp.ay,f=[{x:this.x-8,y:this.y+2,w:16,h:6}];if(this.lv>=2){const tw=sp.width-22;f.push({x:X+tw*.25,y:Y+sp.height-tw*.45,w:tw*.5,h:tw*.3})}return f}
  box(box,camp){camp(this,this.sprite())}
  /* its page: whose it is, what stands there, its guards; Attack its guards (an act of war on a realm at peace with you) or, none
     left, raise your banner; while your banner goes up, how long yet; once up, with no realm of your own and no employer, the
     realms near it to hand it to, or no one */
  page(r){const s=this,f=s.ownerName(),facts=pageFacts([f?'<span style="color:'+s.col()+'">held by '+f+'</span>':'held by no one',STANDARD_LV[s.lv],
      s.guards?insight(['guards by it',roughly(s.guards)+' guards',s.guards+' guards'],'know how many'):'no guards',s.whyText()]);
    const t=s.supplier(),works=!s.realm?'':s.broken?'<p class="muted">Its tower lies broken'+(s.need?': its mending waits on '+s.costText(s.need)+' from '+(t?t.name:'its realm'):', mended in '+Math.max(1,STANDARD.repair.days-(s.fix||0))+' days')+'.</p>'
      :s.lv<3?'<p class="muted">'+(s.need?'It would grow, but waits on '+s.costText(s.need)+' from '+(t?t.name:'its realm'):'Held in peace, it grows in '+Math.max(1,STANDARD.grow.days[s.lv]-(G.day-(s.since||0)))+' days, for '+s.costText(STANDARD.grow.cost[s.lv+1])+' from '+(t?t.name:'its realm'))+'.</p>':'';
    const body='<p>An outpost '+s.whyText()+': a tall flag pole on a stepped stone plinth, '+(f?'its banners hung from a crossbar':'its banners torn to rags')+'.</p>'+facts+works;
    if(s.choose)return{title:'Your banner flies',body:body+'<p>Your men hold it. You have no realm of your own and serve no one: hand it to a realm near, or leave it to no one.</p>',
      acts:[...s.nearRealms().map(([k,d])=>({icon:'banner',label:'Hand it to the '+FACS[k].n,act:'site-hand',arg:k,facts:['renown +'+STANDARD.renown,'their thanks',Math.round(d)+' tiles to their nearest holding']})),
        {icon:'truce',label:'Leave it to no one',act:'site-hand',arg:'none',facts:['renown +'+STANDARD.renown]}]};
    if(s.taking)return{body:body+'<p class="gold">Your banner goes up: '+s.taking.h+' of '+STANDARD.hold+' hours. Stay by it.</p>'};
    const C=STANDARD.repair.cost,can=Object.entries(C).every(([g,n])=>goodN(g)>=n),mend=s.broken&&s.realm&&(s.ours||!hostileTo(s.realm))?[{icon:'tools',label:'Mend its tower',act:'site-mend',facts:[s.costText(C)+' from your packs'],why:can?'':'You need '+s.costText(C)}]:[];
    if(s.ours)return{body:body+'<p class="muted">It flies '+(s.realm==='player'?'your own colours':'the colours of the realm you serve')+'.</p>',acts:mend};
    const war=s.realm&&s.realm!=='player'&&!hostileTo(s.realm),fight=s.guards>0,lair=s.band?'<p class="bad">'+LAIR_SAY[s.band]+' have made it their lair: their raiders ride out of it onto the roads round it.</p>':'';
    return{body:body+lair,acts:[...mend,{icon:'sword',label:fight?(s.band?'Drive them out':'Attack its guards'):'Raise your banner',act:'site-attack',facts:[fight?roughly(s.guards)+' guards':'no guards',war?'an act of war on the '+FACS[s.realm].n:'',STANDARD.hold+' hours by it'].filter(Boolean),
      why:partySize()<1&&fight?'You have no men':''}]}}
  act(a,arg,done){
    if(a==='site-attack'&&!this.ours&&!this.taking&&!this.choose){const f=this.realm;this.was=f;
      if(f&&f!=='player'&&!hostileTo(f)){const X=STANDARD.hostile;Timed.of(P,'hostile').extend(f,X.days);addHonor(f,X.honor,true)}
      if(this.guards>0){G.site=null;const b=this.band;startEncounter({kind:'standard',ref:this,list:this.guardList(),title:b?LAIR_SAY[b]+' at the '+this.name:'Guards of the '+this.name,word:b?'raiders':'guards',band:b||undefined,mine:true});return true}
      this.taking={h:0};done('Your men plant your banner by the '+this.name+'. Stay by it '+STANDARD.hold+' hours.');return true}
    if(a==='site-hand'&&this.choose){done(this.give(arg==='none'?null:arg));return true}
    // (its tower mended with the timber and stone you carry: at once, the deed a mending job waits on)
    if(a==='site-mend'&&this.broken&&this.realm){const C=STANDARD.repair.cost;if(!Object.entries(C).every(([g,n])=>goodN(g)>=n))return true;for(const g in C)goodTake(g,C[g]);
      this.broken=false;this.fix=0;this.need=null;worldEmit('standard:mended',{standard:this,by:'you'});done('Your men mend the tower of the '+this.name+'.');return true}
    return false}
  // its guards beaten (engage.js ON_WIN.standard): your banner goes up while you stay by it
  beaten(){const b=this.band;this.guards=0;this.taking={h:0};if(b){this.owner=null;this.ld=null;worldEmit('site:cleared',{site:this})}
    return (b?' The '+LAIR_SAY[b].toLowerCase()+' are driven out of it.':' Its guards are beaten.')+' Stay by the '+this.name+' '+STANDARD.hold+' hours to raise your banner.'}
  // an hour by it: your banner goes up; gone well off, it is broken off
  hour(){const t=this.taking;if(!t)return;const d=Math.hypot(P.x-this.x,P.y-this.y);
    if(d<=STANDARD.r){if(++t.h>=STANDARD.hold)this.raised()}else if(d>STANDARD.r*3){this.taking=null;log('You leave the '+this.name+': your banner never went up.','bad')}}
  // your banner up: the realm you serve's, yours, or yours to hand on
  raised(){this.taking=null;const who=P.fac&&FACS[P.fac]?P.fac:fiefsOf('player').length?'player':null;
    if(who){log(this.give(who),'good');return}
    this.choose=true;log('Your men hold the '+this.name+'. Whose banner shall fly over it?','gold');if(G.mode==='world'&&!G.modal){G.site=this;G.siteTab=null;G.mode='site';showSite()}}
  // its new holder (none: no one's); your renown and its realm's thanks
  give(f){const was=this.realm;this.owner=f&&(f==='player'||FACS[f])?f:null;this.choose=false;this.taking=null;this.guards=this.realm&&this.realm!=='player'?1:0;
    if(this.lv>=2)this.broken=true;this.fix=0;this.since=G.day;this.need=null;// (its tower broken in the taking: mended slowly, work)
    P.renown+=STANDARD.renown;if(this.realm&&this.realm!=='player')addHonor(this.realm,STANDARD.thanks,true);worldEmit('standard:taken',{standard:this,from:was,to:this.realm,by:'you'});
    return this.realm?'The '+this.name+' flies '+(this.realm==='player'?'your colours':'the colours of the '+FACS[this.realm].n)+' now. Renown +'+STANDARD.renown+'.':'You cut down its banners and leave the '+this.name+' to no one. Renown +'+STANDARD.renown+'.'}
  // the realms near it you may hand it to: [realm, tiles to its nearest holding], the nearest three, not the one you took it from
  nearRealms(){const out=[];for(const k of Object.keys(FACS)){if(k==='player'||k===this.was)continue;const F=fiefsOf(k);if(!F.length)continue;
    out.push([k,Math.min(...F.map(t=>Math.hypot(t.x-this.x,t.y-this.y)))/TILE])}out.sort((a,b)=>a[1]-b[1]);
    // (the nearest three, and any realm whose job for it you have: world/quests.js OutpostQuest)
    const job=new Set((P.quests||[]).filter(q=>q.type==='outpost'&&q.site===this.i).map(q=>q.fac));return out.filter((e,i)=>i<3||job.has(e[0]))}
}
SITE_CLASS.standard=Standard;

/* where they stand (doc §2; STANDARD_PLACE): a pure reckoning of the map and its holdings (no random draw: the world's streams as
   they were), so a world always has the same standards. Every road crossing (a road tile with three roads by it), ford, pass (a
   road with peaks on both sides) and deposit (resources.js) on a realm's land, clear of the holdings, scored by why and more on a
   border with another realm; each province (provinces.js) its best, base + one for each per of its holdings (most), one more on a
   border, gap tiles apart. Each stands on open ground beside its spot (near tiles), off the road */
const Standards={
  all(){return (W.sites||[]).filter(s=>s instanceof Standard)},
  /* (the land each held one claims round it (doc §4; world/territory.js landCompute), its realm's nearest holding's, its reach by
     its level (STANDARD.land); none for a band's lair, one no one holds or one you have yet to hand over. live: this game's placed
     (a new game's, or a save's put back: reserve); off while a new world is made, its first land reckoned without them) */
  live:false,
  claims(){if(!this.live)return [];const out=[],R=STANDARD.land.reach;for(const s of this.all()){if(s.choose||s.band)continue;const t=s.supplier(),i=t?TOWNS.indexOf(t):-1;
    if(i>=0)out.push({s,i,lim:R[Math.max(1,s.lv-(s.broken?1:0))]})}return out},
  // (what the claims hang on besides the holdings' own (their owners, territory.js landFresh): each one's holder and level)
  // (a number, territory.js landOwnId: 0 for none (not live, or none placed: as the unset key, territory.js), else never 0)
  landKey(){if(!this.live)return 0;let h=1,n=0;for(const s of W.sites||[])if(s.type==='standard'){n++;h=Math.imul(h^landOwnId(s.owner)*8^s.lv*2^(s.broken?1:0)^(s.choose?64:0),0x9e3779b1)+s.i|0}return n?h>>>0||1:0},
  of(i){return this.all().find(s=>s.i===i)||null},
  // (their tiles kept free of every holding's building: lots.js occReserve, lotFits)
  reserve(){this.live=true;if(typeof OCC==='undefined'||!OCC)return;for(const s of this.all())for(const [x,y] of s.tiles())if(x>=0&&y>=0&&x<MW&&y<MH&&!OCC[y*MW+x])OCC[y*MW+x]=-3},// (-3: a standard's, no lot's: Standards.stand looks past them)
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
      const oc=(a,b)=>{const v=occAt(a,b);return v&&v!==-3};if(k!==T_OPEN||!passable(f)||oc(x,y)||oc(x,y+1)||oc(x-1,y))continue;const d=i*i+j*j+(hash(x,y,9301)*.5);if(d<bd){bd=d;best=[x,y]}}
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
    const out=[];chosen.forEach((p,k)=>{const s=this.make(p,k),h=Spatial.nearestHolding(s.x,s.y);
      if(h&&out.some(o=>o.name===s.name))s.name=h.name+' '+compass(s.x-h.x,s.y-h.y)+s.name.slice(h.name.length);out.push(s)});// (two of one name: the second by its compass from the holding)
    return out},
  make(p,k){const [tx,ty]=p.at,[x,y]=Standard.point(tx,ty),S=STANDARD_PLACE,lv=p.score>=S.lv[1]?3:p.score>=S.lv[0]?2:1,h=Spatial.nearestHolding(x,y),
      s=Object.assign(Object.create(Standard.prototype),{i:STANDARD.I0+k,type:'standard',tx,ty,x,y,seed:1+Math.floor(hash(tx,ty,4243)*99998),seen:false,cleared:false,back:0,
        owner:p.f,home0:p.f,lv,why:p.why,g:p.g||null,guards:STANDARD.guards[lv],taking:null,choose:false});
    s.name=(h?h.name+' ':'')+(p.why==='deposit'&&GOODS[p.g]?GOODS[p.g].n.toLowerCase()+' ':'')+STANDARD_WHY[p.why]+' outpost';return s},
  hour(){for(const s of this.all()){s.hour();s.watch()}if(typeof outpostJobsHour==='function')outpostJobsHour()},// (and the outposts' jobs that run by the hour: world/quests.js)
  // (the world's captures, once a day after the sites' own day: Standard#contest)
  day(){for(const s of this.all())s.contest()},
  // (a held standard of a realm's or yours within STANDARD.safe tiles of a point: no band is raised there, world.js spawnBandit)
  guarded(x,y){const r=STANDARD.safe*TILE;return this.all().some(s=>s.realm&&s.guards>0&&Math.hypot(s.x-x,s.y-y)<r)}
};
Systems.add({name:'standards',order:{hour:45,day:72},hour:()=>Standards.hour(),day:()=>Standards.day()});
onWorld(()=>{Standards.live=false});// (a new world: no claims till this game's are placed)

/* ---------- its tower in battle (doc/STANDARDS_DESIGN.md §7, phase 5; the owner: "Its tower in battle: yes", archers shooting
   from it): in a fight on the world map (battle/worldbattle.js) a standing tower's footprint is raised STANDARD.tower.rise[lv]
   levels over the ground, sheer all round but its ladder, on the side away from your army (climbed as a siege's ladder is: no
   cliff on it); its men drawn up on its top (the field's lift, terrain.js update). In a fight for the outpost, up to perch[lv] of
   its archers are posted on it, their own group holding its post (no captain moves it: commander.js, the muster: worldbattle.js),
   shooting from its height (terrain.js rangeMul: HILL.range a level); no blade between its top and the ground (terrain.js apart) ---------- */
const StandardTower={
  // (the standing towers on a world battle's field, each with its cells [c0, r0, c1, r1] in the field's grid T)
  on(area,T){const out=[];for(const s of Standards.all()){if(!s.towerLv||!s.known())continue;const f=s.footing()[1],k=area.scale/T.cs;if(!f)continue;
      const c0=Math.floor((f.x-area.x0)*k),r0=Math.floor((f.y-area.y0)*k),c1=Math.ceil((f.x+f.w-area.x0)*k)-1,r1=Math.ceil((f.y+f.h-area.y0)*k)-1;
      if(c0>=1&&r0>=1&&c1<T.C-1&&r1<T.R-1&&c1>=c0&&r1>=r0)out.push({s,c0,r0,c1,r1})}return out},
  // (laid on the field's cells after its buildings: open, raised, its men lifted; cliffs on its faces (wall bits 0 east, 1 south,
  // 2 west, 3 north, as terrain.js), but for its ladder's cells in the middle of the side away from you)
  // (you: the side that comes at it, yours or, holding it, theirs)
  lay(T,area){const X=STANDARD.tower,W=this.on(area,T);if(!W.length)return;const C=T.C,N=C*T.R,you=area.field(area.starts[G.enc&&G.enc.post?1:0]);T.lift=new Uint8Array(N);T.towers=W;
    for(const w of W){const {c0,r0,c1,r1}=w,cs=T.cs,mx=(c0+c1+1)/2*cs,my=(r0+r1+1)/2*cs,dx=you.x-mx,dy=you.y-my;let g=0;
      for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)g=Math.max(g,T.lvl[r*C+c]);
      w.lv=g+X.rise[w.s.towerLv];w.ladder=Math.abs(dx)>Math.abs(dy)?(dx>0?2:0):(dy>0?3:1);const z=w.z=Math.round(this.top(w.s)*area.scale/WORLD_BATTLE.sprite);
      const lm=(w.ladder&1?c0:r0)+Math.max(0,Math.floor(((w.ladder&1?c1-c0:r1-r0)+1-X.ladder)/2)),lad=(q,c,r)=>{if(q!==w.ladder)return false;const k=q&1?c:r;return k>=lm&&k<lm+X.ladder},face=(i,j,q)=>{T.wall[i]|=1<<q;if(j>=0&&j<N)T.wall[j]|=1<<(q+2&3)};
      w.l0=lm;w.l1=lm+X.ladder;
      for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const i=r*C+c;T.built[i]=0;T.kind[i]=TKIND.open;T.road[i]=0;T.lvl[i]=w.lv;T.lift[i]=z;
        if(c===c1&&!lad(0,c,r))face(i,i+1,0);if(r===r1&&!lad(1,c,r))face(i,i+C,1);if(c===c0&&!lad(2,c,r))face(i,i-1,2);if(r===r0&&!lad(3,c,r))face(i,i-C,3)}}},
  // (its top, world px over its foot: a share of its model's height)
  top(s){return (s.sprite().width-22)*STANDARD.tower.top[s.towerLv]},
  // (the outpost a fight is for: one you attack (its guards your foes), or one you hold (its guards beside you, world/quests.js HoldQuest))
  of(e){return e&&(e.kind==='standard'?e.ref:e.post)||null},
  // (a fight for it: up to perch[lv] of its archers, no leader, their own group's, before the groups are made)
  man(units){const e=G.enc,s=this.of(e);if(!s||!s.towerLv)return;const ours=u=>e.post?!!u.sourceArmy&&u.sourceArmy.src===s:u.team===1;// (holding it: its guards, by their source (an ally's team may be its own while the sides are made: sides.js))
    units.filter(u=>ours(u)&&!u.leader&&!u.hero&&!u.comp&&grpOf(u.s)==='arc').slice(0,STANDARD.tower.perch[s.towerLv]).forEach(u=>{u.grp=u.grp.split('_')[0]+'_tower'})},
  // (its archers' group on the field)
  group(b){return Object.values(b.groups||{}).find(g=>g.id.endsWith('_tower'))||null},
  // (and once placed, posted on its top: a man a cell from its middle out, the ladder's cells last, facing your army)
  post(b,area){const g=this.group(b),e=G.enc,s=this.of(e),w=b.terrain?.towers?.find(x=>x.s===s);if(!g||!w)return;const m=grpUnits(g.id),cs=b.terrain.cs,you=area.field(area.starts[e.post?1:0]);
    const cells=[];for(let r=w.r0;r<=w.r1;r++)for(let c=w.c0;c<=w.c1;c++)cells.push({x:(c+.5)*cs,y:(r+.5)*cs});const ax=(w.c0+w.c1+1)/2*cs,ay=(w.r0+w.r1+1)/2*cs;
    cells.sort((a,b)=>Math.hypot(a.x-ax,a.y-ay)-Math.hypot(b.x-ax,b.y-ay));w.cells=cells;g.post=true;g.order='hold';g.ax=ax;g.ay=ay;g.face=g.currentFacing=Math.atan2(you.y-ay,you.x-ax);g.tgt=null;g.queue=[];
    m.forEach((u,i)=>{const q=cells[i%cells.length];u.x=q.x;u.y=q.y;u.sx=q.x-ax;u.sy=q.y-ay;u.dir=g.face;u.face=Math.cos(g.face)>=0?1:-1})},
  // (the foot of its ladder's middle, field px: where a climber comes up)
  foot(w,cs){const q=w.ladder,m=(w.l0+w.l1)/2*cs;return q===0?{x:(w.c1+1)*cs,y:m}:q===2?{x:w.c0*cs,y:m}:q===1?{x:m,y:(w.r1+1)*cs}:{x:m,y:w.r0*cs}},
  // (each frame of a world battle: a foe up on its top, its archers fall back to the cells farthest from the ladder, once; looked at
  // every STANDARD.tower.look s)
  step(b){const g=this.group(b),T=b.terrain,w=T&&T.towers&&T.towers.find(x=>x.cells);if(!g||!w||w.back||b.t<(w.seen||0))return;w.seen=b.t+STANDARD.tower.look;
    const on=u=>{const c=Math.floor(u.x/T.cs),r=Math.floor(u.y/T.cs);return c>=w.c0&&c<=w.c1&&r>=w.r0&&r<=w.r1};
    if(!b.units.some(u=>u.hp>0&&u.team!==g.team&&!u.rout&&on(u)))return;w.back=true;const f=this.foot(w,T.cs),far=w.cells.slice().sort((a,b)=>Math.hypot(b.x-f.x,b.y-f.y)-Math.hypot(a.x-f.x,a.y-f.y));
    grpUnits(g.id).forEach((u,i)=>{const q=far[i%far.length];u.sx=q.x-g.ax;u.sy=q.y-g.ay})},
  /* (its ladder drawn on the field, over the world's picture (worldbattle.js draw): two rails and their rungs from the ground to its
     top against the side it stands on; behind it (the side away to the north), only its top showing over the parapet. Field px,
     a world px each scale of them) */
  draw(area){const T=B&&B.terrain;if(!T||!T.towers)return;const A=STANDARD_ART.ladder,k=area.scale,cs=T.cs;
    for(const w of T.towers){if(w.l0==null)continue;const f=this.foot(w,cs),top=w.z*WORLD_BATTLE.sprite,y1=f.y-top-(w.ladder===3?A.over*k:0),y0=w.ladder===3?f.y-top+A.over*k:(w.r1+1)*cs,half=A.w*k/2;// (its foot on the ground at the tower's front)
      ctx.save();ctx.fillStyle=A.rail;ctx.fillRect(f.x-half,y1,k,y0-y1);ctx.fillRect(f.x+half-k,y1,k,y0-y1);ctx.fillStyle=A.rung;
      for(let y=y0-A.step*k;y>y1;y-=A.step*k)ctx.fillRect(f.x-half+k,y,A.w*k-2*k,k);ctx.restore()}}
};

/* its picture: the standard (a stepped stone plinth, an iron pole with a gilt finial, a crossbar, two banners hung from it in its
   realm's colours with its device, a rope's tassel at an end; ragged, no one's) and, level 2 and 3, a watchtower or a stone tower
   (buildmodels.js) beside it in its realm's builders' style; ax, ay: the pole's foot. One picture a look */
const STANDARD_PICS=new Map();
function standardSprite(s){const f=s.realm,col=f||s.band?s.col():null,dev=f==='player'?'crown':f||(s.band?'skull':null),key=(col||'-')+(dev||'')+s.lv+s.seed%3+(s.broken?'b':'');let c=STANDARD_PICS.get(key);if(c)return c;
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
  // (broken: its tower's top gone, its lower part standing, rubble at its foot)
  const cut=s.broken&&m?Math.round(tw*STANDARD_ART.broken):0;
  c=mkc(CW,CH,q=>{if(m)q.drawImage(m.img,0,cut,tw,tw-cut,0,CH-tw+cut,tw,tw-cut);
    if(cut){q.fillStyle=STANDARD_ART.stone[2];for(let i=0;i<7;i++)q.fillRect(Math.round(tw*.2+hash(i,s.seed,77)*tw*.6),CH-3-Math.round(hash(i,s.seed,78)*3),2,1)}
    q.drawImage(fl,fx,CH-H)});c.ax=fx+11;c.ay=CH-2;
  if(m){c.gr=mkc(CW,CH,q=>q.drawImage(m.ground,0,CH-tw));c.sh=mkc(CW,CH,q=>q.drawImage(m.shadow,0,CH-tw))}
  STANDARD_PICS.set(key,c);return c}
