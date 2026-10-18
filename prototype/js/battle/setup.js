'use strict';
/* ---------- battle construction and field setup ---------- */
/* ---------- the field's size (FIELD_SIZES), chosen as a battle starts, before anything is laid out on it ----------
   THE CONTRACT with the ground's generator (terrain.js) and whatever else lays out the field: BattleSetup.start sets BW, BH (field
   px) and BFIELD (the size: {key, n, w, h, back, depth, band}; null with sizes off) FIRST, before groundSpec, spawning,
   measureField and buildTerrain. Generation reads BW/BH (or spec.W) as ever, and may read BFIELD.key for a recipe's density;
   fieldZone(team) is each side's deployment zone (field px, BFIELD.back px of open ground behind it), fieldBand(top,bot) the rows
   its lines form up over. Out of a battle BH is FIELD_H again (fieldDone), so the world's previews of a field (encounters.js
   coverAt, terrain.js groundEnv) read today's field.
   on: off (tests/harness.js), today's field: FIELD_H high, as wide as the screen's shape (FIELD_W), each side against its edge.
   order: smallest first; w, h: the field (px: multiples of 32 across, 16 down: route and fog cells 16 px, spatial 32); back: open
   ground behind each side's deployment zone (px), depth: the zone's depth (px); band: the rows a side's lines form up over (px, the
   field's middle; 0 the whole field); heads: under this many soldiers in the battle that size, else the largest; the world tile
   steps it one up on open plains, one down in forest, a mountain pass or a swamp (fieldNudge); types: a typed battle's sizes
   ([least, most]: a bridge's river and an ambush's road keep their measure) */
const FIELD_SIZES={on:true,order:['small','big','large','vlarge','huge'],
  small:{n:'Small',w:960,h:544,back:32,depth:288,band:0},big:{n:'Big',w:1280,h:720,back:96,depth:320,band:0},
  large:{n:'Large',w:1792,h:1008,back:256,depth:352,band:760},vlarge:{n:'Very large',w:2400,h:1344,back:512,depth:384,band:840},
  huge:{n:'Huge',w:3200,h:1792,back:832,depth:416,band:920},
  heads:[60,150,300,600],types:{bridge:['big','large'],ambush:['small','big']}};
let BFIELD=null;
// (the size for a battle of heads soldiers on world tile r ({t, c}: regionAt's; none for a tournament), of battle type kind)
function fieldSizeFor(heads,r,kind){
  const F=FIELD_SIZES,O=F.order,T=kind&&F.types[kind];let i=F.heads.findIndex(n=>heads<n);if(i<0)i=O.length-1;if(r)i+=fieldNudge(r);
  return O[clamp(i,T?O.indexOf(T[0]):0,T?O.indexOf(T[1]):O.length-1)]}
const fieldNudge=r=>r.t===T_FOREST||r.t===T_MOUNT||r.c==='swamp'?-1:r.t===T_OPEN||r.t===T_ROAD?1:0;
// (the field set to a size (BW, BH, BFIELD), or today's (key null); back to today's height out of a battle)
function fieldSet(key){if(!key){BFIELD=null;BW=clamp(BVW,FIELD_W.min,FIELD_W.max);BH=FIELD_H;return null}const S=FIELD_SIZES[key];BFIELD={key,...S};BW=S.w;BH=S.h;return BFIELD}
function fieldDone(){BH=FIELD_H;BFIELD=null}
// a side's deployment zone (field px): BFIELD.back off its own edge, BFIELD.depth deep; today's from its edge (deploy.js DEPLOY.zone)
function fieldZone(team){const F=BFIELD,a=F?F.back:8,b=F?F.back+F.depth:Math.round(BW*DEPLOY.zone);return{x0:team?BW-b:a,x1:team?BW-a:b,y0:fieldTop(),y1:fieldBot()}}
// (where a side's line stands: 97 px into its zone, today's 105 off its edge; the rows it forms up over: the field's middle band)
const fieldLine=team=>{const x=(BFIELD?BFIELD.back:8)+97;return team?BW-x:x};
function fieldBand(top,bot){const b=BFIELD&&BFIELD.band;if(!b||bot-top<=b)return[top,bot];const m=(top+bot)/2;return[m-b/2,m+b/2]}
function formation(list,team){
  const dir=team?-1:1,base=team?BW-72:72,out=[];// (each side starts at its edge of the field)
  // (infantry in front; mages a step behind them (their reach is short); archers at the back; riders on the flanks)
  const front=[],mid=[],back=[],flank=[];list.forEach(t=>{(ST[t].range?(ST[t].magic?mid:back):ST[t].charge?flank:front).push(t)});
  const lay=(arr,x0)=>{const per=8;arr.forEach((t,i)=>{const col=Math.floor(i/per),row=i%per,rows=Math.min(per,arr.length-col*per),gap=Math.min(20,(BH-60)/Math.max(rows,1));out.push({t,x:x0-dir*col*13,y:BH/2+(row-(rows-1)/2)*gap})})};
  lay(front,base+dir*32);lay(mid,base+dir*14);lay(back,base-dir*8);
  flank.forEach((t,i)=>{const up=i%2===0;out.push({t,x:base+dir*10-dir*Math.floor(i/2)*12,y:up?40+Math.floor(i/2)*12:BH-34-Math.floor(i/2)*12})});
  return out;
}
// the ground under the player decides the battle's look and its one rule
function battleEnv(tourney){
  if(tourney)return{c:'grass',t:T_OPEN,name:'Tournament ground',text:'An open field with no tricks.'};
  const r=regionAt(P.x,P.y),t=r.t===T_MOUNT||r.t===T_WATER?T_HILL:r.t,c=r.c;
  const text=t===T_FOREST?'Trees block movement and stop some arrows. Elves shoot through them.':t===T_HILL?'High ground: archers reach 15% farther.'
    :c==='frost'?'Snow slows everyone but dwarves and wolves.':c==='desert'?'The heat slows melee attacks, except for orcs and scorpions.':c==='swamp'?'Mud slows everyone and stalls cavalry charges. Orcs wade through.':'Open ground: cavalry rides 15% faster.';
  return{c,t,name:r.name,text};
}
function envStats(s,race,env){
  if(s.big)return s;const o={...s},home=race?RACES[race].home:s.home||[],c=env.c,t=env.t;
  if(t===T_FOREST||t===T_HILL){if(t===T_HILL&&s.range&&!env.terrain)o.range*=1.15}// (with terrain the hills earn it where they stand, D2: terrain.js)
  else if(c==='frost'&&!home.includes('frost'))o.spd*=.85;
  else if(c==='desert'&&!s.range&&!home.includes('desert'))o.cd*=1.1;
  else if(c==='swamp'&&!home.includes('swamp'))o.spd*=s.mounted?.65:.8;
  else if(c==='grass'&&s.mounted)o.spd*=1.15;
  return o;
}
function placeObstacles(env,y0,y1){y0=y0==null?FIELD_EDGE.top:y0;y1=y1==null?BH-FIELD_EDGE.bot:y1;
  const obs=[],c=env.c,list=env.t===T_FOREST?Array(12).fill('tree'):env.t===T_HILL?Array(6).fill('rock'):c==='desert'?['cactus','cactus','cactus','cactus','rock','rock']
    :c==='swamp'?Array(5).fill('tree'):c==='frost'?['tree','tree','rock','rock']:['tree','tree','rock'];
  // (as many again for each screen's worth of field: the larger field keeps its look)
  // (rocks and trees keep room to pass between them and the field's edges; fewer where the field in sight is shorter)
  const lo=y0+FIELD_EDGE.pass+6,hi=Math.max(lo,y1-FIELD_EDGE.pass-6),many=Math.max(1,Math.round(BW*(y1-y0)/(VW*VH)));for(const kind of Array(many).fill(list).flat())for(let k=0;k<30;k++){const x=rint(110,BW-110),y=rint(lo,hi);if(obs.every(o=>Math.hypot(o.x-x,o.y-y)>26)){obs.push({kind,x,y,r:kind==='rock'?7:kind==='cactus'?5:6});break}}
  return obs;
}
/* the field's edges: where the battle HUD leaves it in sight. Its top bar and speed buttons cover the top of the field, its
   orders and unit cards the bottom: nobody fights under them (measured once a battle starts; the field's own edges if the HUD
   cannot be measured). A soldier's feet are its place, so the top leaves room for its body. */
const FIELD_EDGE={top:18,bot:6,body:22,pass:18};
const fieldTop=()=>B&&B.ftop!=null?B.ftop:FIELD_EDGE.top,fieldBot=()=>B&&B.fbot!=null?B.fbot:BH-FIELD_EDGE.bot;
// (measured before the field is laid out, so its rocks and trees go where the fight can be seen)
function measureField(){
  const def={top:FIELD_EDGE.top,bot:BH-FIELD_EDGE.bot};bbar.hidden=false;{const sc=document.getElementById('screen');if(sc)sc.dataset.mode='battle'}// (the HUD laid out as in battle)
  const cv=document.querySelector('canvas'),r=cv&&cv.getBoundingClientRect();if(!r||r.height<50)return def;const k=BVH/r.height/camFit(),box=sel=>{const e=bbar.querySelector(sel);return e&&e.offsetParent!==null?e.getBoundingClientRect():null};
  // (measured without the unit-ability buttons (battlehud.js): which abilities show depends on the selection, and the last battle's
  // were still there, so the field and the groups' widths would change with them)
  const ab=bbar.querySelector('.abils'),abH=ab&&ab.hidden;if(ab)ab.hidden=true;
  try{const tops=['.btop','.btime'].map(box).filter(Boolean),bot=box('.bcmd');
    const top=tops.length?Math.max(...tops.map(b=>b.bottom))-r.top:0,bh=bot?r.bottom-bot.top:0;
    return{top:Math.round(clamp(top*k+FIELD_EDGE.body,FIELD_EDGE.top,BH*.3)),bot:Math.round(clamp(BH-bh*k-FIELD_EDGE.bot,BH*.6,BH-FIELD_EDGE.bot))}}
  finally{if(ab)ab.hidden=abH}}
/* ---------- battle types (IMPLEMENTATION_PLAN §4 item 5; doc/TERRAIN_DESIGN.md §8, phase 5): B.btype, absent on an open field ----------
   {kind:'bridge', def, ford}: a fight at a river crossing: one bridge over deep water nobody can wade (ford: and a ford far off
   it); def, the team set upon, stands on its bank by the bridge, the other comes on from its own edge and must cross.
   {kind:'ambush', hid}: hid, the team lying in wait, starts hidden in cover on one flank of a road or both; the other in march
   order on the road down the middle, with no deployment. Only with terrain (B.terrain): the world asks for them
   (encounters.js battleTypeFor, the pre-battle panel's Spring an ambush), and the lab (lab.js type).
   bridgeY: the bridge's middle off the open lane's (share of the field's height, either way); ford: the chance of a ford far off
   it (by the world tile; the lab's by its seed); fordGap: the least ground between them (px); front: the holders' line this far
   off the water (px, besides half its depth), behind: their shooters this much behind it (characters 1.6×, riders 2.4×), flank:
   their riders this far off the bridge's middle (px, either side); back, alert: the holders' foot stands this much further back from
   the water (px) while none of theirs who fight hand to hand is within alert px of its place; wait: s with no blow struck before the holders give up
   waiting and go over (commander.js) */
// road: the column's road this far either side of it (px, kept clear of cover); files: the column's files; colGap: room between its
// groups (px); gap: the column's edge to the front of those lying in wait (px: beyond SIGHT.near); r0: a wood's least radius
// round a group (px); sep: room between two (px); edge: the share of the field's width kept clear at each end; both: the chance
// of cover on both flanks (else one); ridge: on hills, the chance cover is a low ridge (deserts always: no woods there); ridgeX:
// a ridge runs this far past the furthest group behind it (px, then ÷.7: its ends are thin); march: the AI's column marches this share of the
// field's width on along the road; rush: s from the start the AI's men lying in wait go straight in, before its usual orders
// take (commander.js typeTake: a bridge's takers going over as one): stage, form: they wait this far back from the crossing's near
// mouth, and form up this far beyond its far one (px, besides half their depth); spread: groups this far apart along it (px); near:
// a group is at its place within this (px); share: a group is over with this share of its men; held: their strength this near the
// far mouth holds a crossing (px); pick: s between looks for the crossing least held; volleys: their shooters' volleys (× FOE_CMD.volley
// s) before they go to the crossing; waitMax, stageMax, formMax: s at most waiting for them, gathering at the crossing, forming
const BTYPE={bridgeY:.15,ford:.4,fordGap:100,front:24,behind:50,flank:110,back:30,alert:260,wait:60,road:20,files:4,colGap:14,gap:84,r0:56,sep:12,edge:.1,both:.5,ridge:.5,ridgeX:60,march:.5,rush:6,
  take:{stage:60,form:50,spread:70,near:40,share:.75,held:150,pick:3,volleys:2,waitMax:30,stageMax:15,formMax:20}};
// One short-lived coordinator per battle. Runtime units remain plain records; saved campaign records are not copied.
// Construction order is deliberate: preserve random draws, chief reuse, HUD measurement and post-layout initialization.
class BattleSetup{
  constructor(opts){this.opts=opts;this.units=[];this.id=0}
  spawn(unit,team,x,y){
    const s=unit.fieldStats(this.env,team,this.opts.lv||1);
    return{id:this.id++,v:Math.floor(Math.random()*6),type:unit.key,unit,team,x,y,hp:s.hp,max:s.hp,cd:Math.random()*.6,hero:unit.role==='hero',face:team?-1:1,s,spdNow:0,tgt:null,rt:0,swing:0};
  }
  createUnits(){
    const {opts,env,units}=this,lv=opts.lv||1,mk=(...args)=>this.spawn(...args),enc=!opts.tournament&&G.enc;
    const hero=this.hero=mk(charOf(P),0,116,BH/2);hero.cd=0;vitals();hero.hp=Math.max(1,Math.round(P.hp));hero.grp='hero';units.push(hero);
    if(!opts.tournament)compsInBand().forEach((id,i)=>{const u=mk(charOf(compInit(id),id),0,90,BH/2+(i+1)*18);u.comp=true;u.grp='comp_'+id;units.push(u)});
    // Each source army retains its own ten-slot budget, even when several armies reinforce the same side.
    const addArmy=(source,list,team,prefix,player=false,reinforcement=false)=>{
      const owner=source?asParty(source):asParty({troops:list.slice()}),roster=partyRoster(owner);
      for(const group of roster.groups)for(const f of formation(Array(group.count).fill(group.type),team)){
        const u=mk(troopOf(f.t),team,f.x,f.y);u.grp=prefix+group.id;u.sourceGroupId=group.id;u.sourceArmy=owner;
        if(source&&reinforcement)u.lord=source;units.push(u);
      }
    };
    if(!opts.tournament)addArmy(P,P.list,0,'p_',true);
    const raw=enc&&['lord','party','patrol'].includes(enc.kind)?enc.ref:null;
    if(raw&&!(raw instanceof Party)&&!raw.tc&&!raw.troops&&!raw.list)raw.troops=opts.enemies.slice();
    const main=raw?asParty(raw):null;
    addArmy(main,opts.enemies,1,'e0_');
    if(enc){(enc.allies||[]).forEach((l,i)=>addArmy(l,l.troops,0,'a'+i+'_',false,true));(enc.foes||[]).forEach((l,i)=>addArmy(l,l.troops,1,'e'+(i+1)+'_',false,true))}
    // Characters are their own formations, not mixed into cavalry or infantry.
    if(enc)for(const L of battleLeaders(enc)){
      let u=L.type==='chief'&&L.team===1&&units.find(x=>x.team===1&&x.type==='chief'&&!x.leader);
      const C=L.comp?charOf(compInit(L.comp),L.comp):charOf(L.ref);
      if(!u){u=mk(C,L.team,L.team?BW-96:96,BH/2+(L.team?0:30));units.push(u)}
      else{u.s=C.fieldStats(env,L.team,lv);u.unit=C;u.type=C.key}
      u.hp=u.max=u.s.hp;u.leader=L;if(L.comp)u.comp=true;
      const owner=L.ref=== (enc.ref&&enc.ref.ld)?main:L.ref;
      const i=(L.team?enc.foes:enc.allies||[]).indexOf(L.ref),prefix=L.team?(i<0?'e0_':'e'+(i+1)+'_'):'a'+i+'_';
      u.grp=prefix+'leader';u.sourceArmy=owner;
    }
  }
  createGroups(){
    const {units}=this,groups=this.groups={};
    for(const u of units){
      if(!u.grp)u.grp=(u.hero?'hero':u.team?'e0_':'p_')+u.type; // isolated lab fixtures
      let gr=groups[u.grp];
      if(!gr){
        const player=u.team===0&&!u.lord&&!u.leader,source=u.sourceArmy&&partyRoster(u.sourceArmy).groups.find(g=>g.id===u.sourceGroupId);
        gr=groups[u.grp]=new BattleControl(u.grp,u.team,{player,ally:u.team===0&&!player,foe:u.team===1,
          role:u.hero||u.comp||u.leader?'hero':grpOf(u.s),type:u.type,sourceGroupId:u.sourceGroupId,
          name:u.hero?(P.name||'Hero'):u.comp?COMPS[u.type].n:u.leader?u.leader.name:ST[u.type].n,
          form:source&&FORMS[source.form]?source.form:'line',files:source&&source.files||null});
        const label=player?partyRoster(P).nameOf(u.hero?'hero':u.comp?'comp_'+u.type:u.sourceGroupId):source?.name;
        if(label){gr.name=label;gr.customName=true}
      }
    }
    if(!this.opts.sandbox&&!this.opts.tournament)this.playerOrder=partyRoster(P).order.map(id=>groups[id]?id:'p_'+id).filter(id=>groups[id]?.player);
    // Duplicate types receive distinct labels and non-overlapping deployment lanes.
    for(const player of [true,false])for(const team of [0,1]){
      const ids=Object.keys(groups).filter(id=>groups[id].player===player&&groups[id].team===team);
      if(player&&this.playerOrder)ids.sort((a,b)=>this.playerOrder.indexOf(a)-this.playerOrder.indexOf(b));
      ids.forEach((id,index)=>{
        const gr=groups[id],m=units.filter(u=>u.grp===id),same=ids.filter(k=>groups[k].type===gr.type);
        if(same.length>1&&!gr.customName)gr.name+=' '+(same.indexOf(id)+1);
        const [top,bottom]=fieldBand(this.field.top,this.field.bot);
        gr.ax=fieldLine(team);gr.ay=top+(bottom-top)*(index+.5)/Math.max(1,ids.length);
        if(gr.role==='arc')gr.ax+=team?35:-35;if(gr.role==='mag')gr.ax+=team?20:-20;
        if(this.opts.sandbox){gr.ax=m.reduce((n,u)=>n+u.x,0)/m.length;gr.ay=m.reduce((n,u)=>n+u.y,0)/m.length}
        else if(gr.role!=='hero'&&!gr.files)gr.files=Math.max(1,Math.min(8,Math.floor((bottom-top)/Math.max(1,ids.length)/FORMS.line.gx)));
        const S=formSlots(gr.form,m.length,gr.face,gr.files);m.forEach((u,i)=>{u.sx=S[i][0];u.sy=S[i][1];u.x=gr.ax+u.sx;u.y=gr.ay+u.sy});
      });
    }
  }
  createState(){
    const {units,hero,groups,env,opts}=this,FI=this.field;
    // (an ambush's cover is laid round the groups lying in wait: ambushLayout)
    if(this.btype&&this.btype.kind==='ambush')this.ground.ambush=this.ambushLayout();
    // (the ground: only a battle with terrain gets B.terrain, and then no scattered trees, rocks or cacti: its woods, hills and
    // marsh are the field's only features (the owner, 2026-10-17, reversing D10); without terrain the obstacles as ever: terrain.js)
    const TR=this.ground?buildTerrain({...this.ground,W:BW,top:FI.top,bot:FI.bot}):null;if(TR&&!opts.sandbox)env.text=groundEnvText(env,TR);
    const st={units,hero,groups,env,arena:arenaFor(env.c),ftop:FI.top,fbot:FI.bot,obs:opts.tournament||TR?[]:placeObstacles(env,FI.top,FI.bot),sel:'all',rings:[],arrows:[],parts:[],floats:[],slashes:[],corpses:[],aim:0,blocking:false,touchBlock:false,mt:null,over:false,endT:0,kills:0,slain:[],lost:{},heroDown:false,opts,t:0};
    if(TR)st.terrain=TR;if(TR&&this.btype)st.btype=this.btype;if(this.fogOn())st.fog=true;if(BFIELD)st.fsize=BFIELD.key;return st;
  }
  // (fog of war: field battles, terrain or none, with the setting on; never a tournament, a siege or a raid: battlefog.js)
  fogOn(){const e=G.enc;return FOG.on&&!this.opts.tournament&&!this.opts.sandbox&&!(e&&['siege','raid','tourney'].includes(e.kind))}
  // (the battle's type (BTYPE): the encounter's (encounters.js battleTypeFor), only with terrain; the lab's own: lab.js)
  // (an ambush is sprung once: run down after it, you face them again on an open field (e.btype false))
  battleType(){const e=!this.opts.tournament&&!this.opts.sandbox&&G.enc,bt=e&&e.btype;if(!bt||!this.ground||bt.kind!=='bridge'&&bt.kind!=='ambush')return null;if(bt.kind==='ambush')e.btype=false;return{...bt}}
  // (its ground: a held bridge's river; an ambush's has no recipe of its own (its cover: createState), and no deployment)
  typeGround(){const bt=this.btype,g=this.ground;
    if(bt.kind==='bridge')g.river={bridge:true,hold:true,ford:!!bt.ford,frozen:false};else{g.river=null;this.opts.deploy=false}}
  /* (the groups where the type puts them: a bridge's holders on their bank by it (its riders and characters behind), the other
     side where it would be; an ambush's as ambushLayout laid them, and a column of the AI's marching on along the road. Your zone,
     holding a bridge, runs to the bank: B.dzone, deploy.js) */
  arrangeType(){
    const bt=B.btype,T=B.terrain,put=(g,x,y,face,files)=>{const m=grpUnits(g.id);if(!m.length)return;if(FORMS[g.form]&&FORMS[g.form].wedge||g.form==='loose')g.form='line';if(files!=null)g.files=Math.max(1,Math.min(files,m.length));
      g.face=face;g.currentFacing=face;g.ax=clamp(x,8,BW-8);g.ay=clamp(y,fieldTop(),fieldBot());const S=formSlots(g.form,m.length,face,g.files);m.forEach((u,i)=>{u.sx=S[i][0];u.sy=S[i][1];u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.dir=face})};
    if(bt.kind==='ambush'){const L=this.ground.ambush.place;for(const id of Object.keys(L))if(B.groups[id])put(B.groups[id],L[id].x,L[id].y,L[id].face,L[id].files);
      // (the AI's column marches on along the road, west, till it sees whoever lies in wait (commander.js))
      if(bt.hid===0)for(const g of Object.values(B.groups))if(g.team===1&&L[g.id])g.standAt(Math.max(BW*BTYPE.edge,g.ax-BW*BTYPE.march),g.ay);return}
    const c=T.ai.crossings.find(k=>k.kind==='bridge');if(!c){B.btype=null;return}
    const d=bt.def,fd=d?-1:1,bank=fd>0?c.x0:c.x1,face=fd>0?0:Math.PI,A=BTYPE,gs=Object.values(B.groups).filter(g=>g.team===d&&grpUnits(g.id).length),by=r=>gs.filter(g=>g.role===r);
    // (the bank by each group's own stretch of it: the water's edge nearest them over the rows it covers)
    const rv=T.recipe.rivers[0],edge=(y,h)=>{let b=fd>0?Infinity:-Infinity;for(let r=Math.max(0,Math.floor((y-h)/T.cs));r<=Math.min(T.R-1,Math.floor((y+h)/T.cs));r++){const a=fd>0?rv.sp0[r]:rv.sp1[r];if(a>=0)b=fd>0?Math.min(b,a):Math.max(b,a)}return isFinite(b)?b:bank};
    const lay=(list,dx,spread)=>list.forEach((g,i)=>{const sh=formSlots(g.form,grpUnits(g.id).length,face,g.files),dep=sh.length?Math.max(...sh.map(p=>p[0]*Math.cos(face)))-Math.min(...sh.map(p=>p[0]*Math.cos(face))):0,w=sh.length?Math.max(...sh.map(p=>Math.abs(p[1])))+8:8,y=c.y+(i-(list.length-1)/2)*spread;
      put(g,edge(y,w)-fd*(dx+dep/2),y,face)});
    const inf=by('inf'),dep=inf.reduce((a,g)=>Math.max(a,Math.ceil(grpUnits(g.id).length/(g.files||FORMS.line.files))*FORMS.line.gy),0);
    lay(inf,A.front,120);lay(by('arc'),A.front+dep+A.behind,120);lay(by('mag'),A.front+dep+A.behind*.5,90);lay(by('hero'),A.front+dep+A.behind*1.6,30);
    by('cav').forEach((g,i)=>{const y=c.y+(i%2?-1:1)*(A.flank+Math.floor(i/2)*60);put(g,edge(y,48)-fd*(A.front+dep+A.behind*2.4),y,face)});
    if(d===0)B.dzone={x0:8,x1:Math.round(T.ai.river.x0-A.front)}}
  /* (an ambush's lay-out (BTYPE), before its ground is built: the column on a road down the middle, each group BTYPE.files wide in
     march order (riders the van, then the foot, the characters, the shooters), facing on (yours east, theirs west); those lying in
     wait on one flank or both, each group facing the road with its front BTYPE.gap px off the column's edge (beyond SIGHT.near), in
     a wood of its own round it, or (deserts; half the time on hills) behind a low ridge the length of the flank. Its own stream
     from the ground's seed. {road, woods, ridges (terrain.js ambushPlan), place: {group id: {x, y, face, files}}} */
  ambushLayout(){
    const bt=this.btype,A=BTYPE,F=FORMS.line,top=this.field.top,bot=this.field.bot,mid=Math.round((top+bot)/2),rnd=seeded((this.ground.seed^0xA3B5C701)>>>0),W=BW,place={};
    const rank=r=>['cav','inf','hero','arc','mag'].indexOf(r),n=g=>this.units.filter(u=>u.grp===g.id).length,side=t=>Object.values(this.groups).filter(g=>g.team===t&&n(g)).sort((a,b)=>rank(a.role)-rank(b.role));
    const col=side(1-bt.hid),hid=side(bt.hid),dir=bt.hid?1:-1,h=Math.min(A.files,Math.max(1,...col.map(n)))*F.gx/2;
    // (the column: its van at the front, centred on the field)
    const len=g=>Math.ceil(n(g)/Math.min(A.files,n(g)))*F.gy;let x=W/2+dir*(col.reduce((a,g)=>a+len(g)+A.colGap,-A.colGap))/2;
    for(const g of col){place[g.id]={x:x-dir*len(g)/2,y:mid,face:dir>0?0:Math.PI,files:A.files};x-=dir*(len(g)+A.colGap)}
    // (those lying in wait: their flank or flanks, each group in turn out from the middle, alternately right and left of it)
    const ridge=ambushRidge(this.ground.recipe,this.ground.seed),s0=rnd()<.5?-1:1,both=rnd()<A.both,fl={[-1]:[],[1]:[]},woods=[];
    hid.forEach((g,i)=>{const k=n(g),f=Math.min(k,Math.max(1,Math.min(8,Math.ceil(Math.sqrt(k*2.5))))),w=(f-1)*F.gx,d=(Math.ceil(k/f)-1)*F.gy,r=Math.max(A.r0,Math.hypot(w/2+F.gx,d/2+F.gy)/.8);
      let s=both?(i%2?-s0:s0):s0;const room=q=>{const l=fl[q];return !l.length||Math.max(...l.map(p=>p.x+p.r))+A.sep+2*r<W*(1-A.edge)||Math.min(...l.map(p=>p.x-p.r))-A.sep-2*r>W*A.edge};if(!room(s)&&room(-s))s=-s;
      const l=fl[s],right=l.length%2===0,px=!l.length?W/2:right?Math.max(...l.map(p=>p.x+p.r))+A.sep+r:Math.min(...l.map(p=>p.x-p.r))-A.sep-r,y=mid+s*(h+A.gap+d/2);
      const p={x:clamp(px,W*A.edge,W*(1-A.edge)),y,r};l.push(p);woods.push({x:p.x,y:p.y,r});place[g.id]={x:p.x,y,face:s>0?-Math.PI/2:Math.PI/2,files:f}});
    // (ridges: one along each flank in use, between the road and those behind it, past the furthest of them)
    const ridges=ridge?[-1,1].filter(s=>fl[s].length).map(s=>{const l=fl[s],span=Math.max(...l.map(p=>Math.abs(p.x-W/2)+p.r),col.reduce((a,g)=>a+len(g),0)/2)+A.ridgeX;
      return{x:W/2,y:mid+s*(h+A.gap*.5),rx:Math.min(W/2-8,span/.7),ry:A.gap*.3}}):[];
    return{road:[mid-h-A.road,mid+h+A.road],woods:ridge?[]:woods,ridges,place}}
  initialize(){
    B.speed=BSPEED.v;B.paused=false;
    for(const g of Object.keys(B.groups))layForm(g);
    moraleInit(this.units,this.opts);
    fatigueInit(this.units);
    camInit();
    warmBattle(this.units);
    deployInit(this.opts);
  }
  present(){
    G.mode='battle';hidePanel();bbar.hidden=false;buildSlotBar();setOrderUI();battleSpeedUI();autoUI();updateHint();
    for(const u of this.units)u.y=clamp(u.y,fieldTop(),fieldBot());for(const g of playerGroups())if(B.groups[g].ay)B.groups[g].placeAt(B.groups[g].ax,clamp(B.groups[g].ay,fieldTop(),fieldBot()));
    log((this.opts.tournament?'The crowd roars. Defeat the champion.':'The lines meet in the '+this.env.name.toLowerCase()+'. '+this.env.text)+(BFIELD?' '+BFIELD.n+' field.':''));
    if(B.btype)typeSay();
  }
  // (the battle's terrain: its recipe and seed, or null; the lab's own: lab.js)
  groundSpec(){return groundSpecFor(this.opts,this.env)}
  /* (the field's size (FIELD_SIZES): by the soldiers coming to it, the world tile and the battle's type; null with sizes off. Counted
     from the armies before anyone spawns: the ground's recipe and the spawns already read the field) */
  fieldSize(){if(!FIELD_SIZES.on)return null;const o=this.opts,e=!o.tournament&&G.enc,bt=e&&e.btype,n=x=>Array.isArray(x)?x.length:x&&typeof x==='object'?Object.values(x).reduce((a,v)=>a+(+v||0),0):0;
    let heads=1+o.enemies.length;if(!o.tournament)heads+=compsInBand().length+P.list.length;if(e)for(const l of [...(e.allies||[]),...(e.foes||[])])heads+=n(l.troops)+1;
    const kind=bt&&TERRAIN.on&&!['siege','raid','tourney'].includes(e.kind)&&(bt.kind==='bridge'||bt.kind==='ambush')?bt.kind:null;
    return fieldSizeFor(heads,o.tournament?null:regionAt(P.x,P.y),kind)}
  start(){
    fieldSet(this.fieldSize());// (the field's size first: everything after lays out on it, the ground's generation too)
    damageTypesInit();
    this.env=battleEnv(this.opts.tournament);
    this.ground=this.groundSpec();groundEnv(this.env,this.ground);// (the ground's recipe and seed before anyone spawns: D2, terrain.js)
    this.createUnits();
    this.btype=this.battleType();if(this.btype)this.typeGround();// (its type, if any: BTYPE)
    this.field=measureField();
    this.createGroups();
    B=this.createState();
    if(this.playerOrder)B.playerOrder=this.playerOrder;
    if(B.btype)this.arrangeType();
    this.initialize();
    this.present();
    terrainStep();// (shooters on high ground: their range from where they stand at the start, terrain.js)
    sightStep(true);// (who sees whom from the start: those in woods, behind a rise or out of sight in the fog unseen, terrain.js)
  }
}
// (an ambush's cover a ridge, not woods: always in a desert, BTYPE.ridge of the time on hills, by the ground's seed)
const ambushRidge=(recipe,seed)=>recipe==='desert'||recipe==='hills'&&seeded((seed^0x5EED41D)>>>0)()<BTYPE.ridge;
// the battle's type told as it opens (B.btype): a line in the log and a banner (its event: battlehud.js); its words (BTYPE_SAY)
const BTYPE_SAY={hold:['Hold the bridge!','Hold the bridge: they must come over the river to you, by the bridge or not at all.'],take:['Take the bridge!','Take the bridge: they hold the far bank, and you must cross under their arrows.'],
  wait:['Lie in wait','Your band lies hidden beside the road. Charge out of hiding when you choose: the first blow lands harder.'],caught:['Ambushed!','Ambush! They lie hidden beside the road, and your band is caught in march order.']};
function typeSay(){const bt=B.btype;if(!bt)return;const mine=bt.kind==='bridge'?bt.def===0:bt.hid===0,k=bt.kind==='bridge'?(mine?'hold':'take'):mine?'wait':'caught',[t,txt]=BTYPE_SAY[k];
  log(txt,k==='caught'?'bad':k==='wait'?'good':'');battleEvent('btype',{text:t,team:k==='caught'?1:0})}
// Compatibility entry point used by encounters, tournaments, tests and other callers.
function startBattle(opts){return new BattleSetup(opts).start()}
