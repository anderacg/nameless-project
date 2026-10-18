'use strict';
/* Isolated battle fixtures. Campaign records are swapped for private copies, then restored by identity. */
class LabBattleSetup extends BattleSetup{
  constructor(config){super({enemies:[],lv:1,tournament:false,deploy:config.deploy,pauseAfterDeploy:config.paused,sandbox:true});this.config=config;this.rows=[]}
  spawn(...args){const u=super.spawn(...args);u.s=structuredClone(u.s);return u}
  createUnits(){
    const c=this.config;this.env={c:c.climate,t:{open:T_OPEN,forest:T_FOREST,hill:T_HILL}[c.terrain],name:'Battle laboratory',text:'Test battle: no campaign rewards or losses.'};
    this.ground=this.groundSpec();groundEnv(this.env,this.ground);// (its ground, before anyone spawns: terrain.js)
    const hero=this.hero=this.spawn(charOf(P),0,72,BH/2);hero.hp=0;
    for(const [team,rows] of [[0,c.leftGroups],[1,c.rightGroups]])rows.forEach((row,index)=>{
      const id=row.type==='hero'?'hero':'lab_'+(team?'r_':'l_')+index,character=Object.hasOwn(COMPS,row.type),
        unit=character?charOf(BattleLab.companion(row.type),row.type):row.type==='hero'?charOf(P):troopOf(row.type),
        slots=formation(Array(row.count).fill(row.type==='hero'?'hum_foot':row.type),team),cx=slots.reduce((n,p)=>n+p.x,0)/row.count,target=BW/2+(team?1:-1)*c.distance/2;
      this.rows.push({...row,id,team,index});
      slots.forEach(pos=>{const u=row.type==='hero'?hero:this.spawn(unit,team,clamp(pos.x-cx+target,16,BW-16),pos.y);
        if(row.type==='hero'){u.hp=u.max;u.x=target;u.y=BH/2}
        if(character)u.leader={name:COMPS[row.type].n+' (test)',lv:1,ref:unit.o,type:'lab-companion'};
        u.grp=id;this.units.push(u);
      });
    });
  }
  /* the lab's ground (config.ground): 'none' (no terrain, the old whole-field hill rule), 'auto' (the recipe of its terrain and
     climate, seeded by its seed), {recipe, seed, oasis, river} (a recipe by name, fairness-checked; oasis: a desert's by water;
     river: true or {bridge, frozen, stream}, a river down the middle as the world gives one; recipe 'river' is the open recipe
     with one) or {hills, woods, marsh, rivers, seed} (its own features: x, y as shares of the field, r in px, a hill's top 1-2;
     a river {x, meander (px), crossings: [{kind: 'ford'|'bridge', y, w (px)}], frozen, stream}; phase 4: a hill's cliff (sheer
     all round), oneway (its cliffs climbed nowhere, dropped down anywhere), ramps ([degrees]: 0 east, 90 south; [90] by default),
     rocks [{x, y, r, h (its peak, in levels of 14 px)}]: mountains and spires; no fairness checks). Recipe 'crags': the hills recipe with its
     cliffs and mountains always (fairness-checked). A frost lab field is a frost one (more rock). Not tied to TERRAIN.on.
     Field variety (terrain.js): a recipe's layout (one of its own: terrainLayouts), edges {n, s, w, e: 'forest', 'hills', 'peaks',
     'water', 'marsh', 'open'} (the neighbours), road (true: a road across; 'ns': on north to south too), elven (elven woods); 'auto'
     on a forest is a forest tile (in the swamp, the mire wood) */
  groundSpec(){const c=this.config,g=c.ground==='none'&&c.type!=='field'?'auto':c.ground;if(!g||g==='none'||!this.env)return null;// (a typed battle needs ground: 'auto' for 'none')
    const frost=this.env.c==='frost',forest=this.env.t===T_FOREST;if(g==='auto')return{recipe:terrainRecipeOf(this.env.t,this.env.c,0),seed:c.seed,frost,forest};
    return g.recipe?{recipe:g.recipe==='river'?'open':g.recipe==='crags'?'hills':g.recipe,seed:g.seed??c.seed,oasis:!!g.oasis,river:g.recipe==='river'?{...g.river||{}}:g.river?{...g.river}:null,frost,crags:g.recipe==='crags',forest,
      ...(g.layout?{layout:g.layout}:{}),...(g.edges?{edges:{...g.edges}}:{}),...(g.road?{road:{ew:true,ns:g.road==='ns'}}:{}),...(g.elven?{elven:true}:{})}:{explicit:g,seed:g.seed??c.seed}}
  /* the lab's battle type (config.type, setup.js BTYPE): 'field' (none); 'bridge' or 'ambush' with the left side the one set upon
     (holding the bridge, or caught on the road); {kind, side: the one set upon ('left' or 'right'), ford (a bridge's: a ford far
     off it, true or false; by the seed when not given)}. Its ground as config.ground has it ('none': 'auto'); an ambush's is its own */
  battleType(){const t=this.config.type;if(!t||t==='field'||!this.ground)return null;const k=typeof t==='string'?t:t.kind,s=typeof t==='object'&&t.side==='right'?1:0;
    return k==='bridge'?{kind:k,def:s,ford:typeof t==='object'&&t.ford!=null?t.ford:hash(this.config.seed|0,7,4447)<BTYPE.ford}:{kind:'ambush',hid:1-s}}
  /* the lab's field size (config.size: a FIELD_SIZES key, forced, sizes on or off); else, sizes on, by its soldiers, its terrain and
     climate as a world tile's, and its type (setup.js fieldSizeFor) */
  fieldSize(){const c=this.config;if(c.size)return c.size;if(!FIELD_SIZES.on)return null;const k=typeof c.type==='string'?c.type:c.type&&c.type.kind;
    return fieldSizeFor([...c.leftGroups,...c.rightGroups].reduce((n,g)=>n+g.count,0),{t:{open:T_OPEN,forest:T_FOREST,hill:T_HILL}[c.terrain],c:c.climate},k==='bridge'||k==='ambush'?k:null)}
  createGroups(){
    super.createGroups();const c=this.config,top=this.field.top,bottom=this.field.bot,Z=[fieldZone(0),fieldZone(1)];
    for(const row of this.rows){const gr=this.groups[row.id],m=this.units.filter(u=>u.grp===row.id),rows=row.team?c.rightGroups:c.leftGroups;
      gr.player=row.team===0;gr.ally=false;gr.foe=row.team===1;gr.form=row.form;gr.files=row.files;
      if(row.name){gr.name=row.name;gr.customName=true}
      if(c.mode==='duel')continue;
      // Two columns for large armies keep ten formations from sharing one narrow vertical lane.
      const columns=Math.ceil(rows.length/5),perColumn=Math.ceil(rows.length/columns),column=Math.floor(row.index/perColumn),lane=row.index%perColumn,
        gx=FORMS[row.form].gx,files=row.files||Math.max(1,Math.min(8,Math.floor((bottom-top)/perColumn/gx)-1));
      if(!FORMS[row.form].wedge)gr.files=files;
      const S=formSlots(gr.form,m.length,gr.face,gr.files),xs=S.map(p=>p[0]),ys=S.map(p=>p[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
      if(ymax-ymin>bottom-top-4)throw Error('A formation is too wide for the field. Reduce its files.');
      // (deploying, each side in its zone (setup.js fieldZone); today's field: the outer .3 of it, as ever)
      const left=c.deploy&&row.team?(BFIELD?Z[1].x0:BW*.7)+12:12,right=c.deploy&&!row.team?(BFIELD?Z[0].x1:BW*.3)-12:BW-12;
      if(xmax-xmin>right-left)throw Error('A formation is too deep for its starting zone. Increase its files.');
      const centre=c.deploy?(BFIELD?(Z[row.team].x0+Z[row.team].x1)/2:BW*(row.team?.74:.26)):BW/2+(row.team?1:-1)*c.distance/2,
        x=centre+(row.team?1:-1)*column*150,y=top+(bottom-top)*(lane+.5)/perColumn;
      gr.ax=clamp(x,left-xmin,right-xmax);gr.ay=clamp(y,top-ymin,bottom-ymax);
      m.forEach((u,i)=>{u.sx=S[i][0];u.sy=S[i][1];u.x=gr.ax+u.sx;u.y=gr.ay+u.sy;u.dir=gr.face;u.face=row.team?-1:1});
    }
    this.playerOrder=this.rows.filter(r=>!r.team).map(r=>r.id);
  }
  // (fog of war: the config's fog key, else as the game has it (FOG.on): battlefog.js)
  fogOn(){const f=this.config.fog;return f==null?FOG.on:!!f}
  initialize(){super.initialize();const c=this.config;for(const u of this.units){u.mor0=Math.round(clamp(unitMoraleOf(u.s),20,100));u.mor=u.mor0}groupMoraleInit(this.units);B.noMorale=!c.morale;B.auto=c.ai;B.paused=c.paused;heroState();this.powers()}
  /* commander powers (commandpowers.js): the config's powers key (true/false; left out, COMMAND_POWERS.on); commander {left, right}:
     a side's null (none), or {group (its row index: that group's first soldier commands; left out, the game's rule: your hero,
     their first leader), lead (his Leadership, 0-10)} */
  powers(){const c=this.config;if(c.powers!=null)B.cmdOn=c.powers;const C=c.commander;if(!C)return;B.cmdForce={};B.cmdLead={};
    for(const [side,team] of [['left',0],['right',1]]){if(!Object.hasOwn(C,side))continue;const v=C[side];if(v===null){B.cmdForce[team]=null;continue}
      if(v.group!=null){const row=this.rows.find(r=>r.team===team&&r.index===v.group),u=row&&B.units.find(x=>x.grp===row.id&&x.hp>0);B.cmdForce[team]=u?u.id:null}if(v.lead!=null)B.cmdLead[team]=v.lead}}
}
const BattleLab={
  session:null,last:null,
  get active(){return !!this.session},
  presetKey:'ashmark.lab.presets.v1',
  companion(id){return {ap:0,role:'',lv:1,xp:0,gear:{},sk:Object.fromEntries(Object.keys(COMP_SK).map(k=>[k,{lv:COMP_START[id]?.[k]||0,xp:0}])),perks:[],perkPend:0,party:null,hurt:0}},
  eventLimit:5000,moraleLimit:3600,
  beginTelemetry(){
    const groups={};for(const [id,g] of Object.entries(B.groups)){const roster=B.units.filter(u=>u.grp===id).map(u=>({id:u.id,type:u.type,max:u.max}));groups[id]={id,side:g.team?'right':'left',name:g.name||id,role:g.role||null,roster,damageDealt:0,damageTaken:0,kills:0,events:[],morale:[],truncated:{events:0,morale:0}}}
    this.session.telemetry={version:2,config:structuredClone(this.last),seed:this.last.seed,definitions:{morale:'One authoritative formation resolve value; average/minimum aliases are identical. State, confidence, cohesion, recent-loss strain and unanswered missile pressure are group-owned. Unbreakable groups have no morale value.',effectiveDamage:'Final post-mitigation HP removed, capped at target HP remaining; dodge and other zero-HP-loss hits do not count. Attacker and target must be members of configured groups or damage is reported as uncredited.',kills:'One per target changed from positive HP to zero by a sourced damaging hit. Routing or leaving the field is not a kill.',survivors:'Living units, including living units that left the field; exited units retain hpLeft.'},uncredited:{damageDealt:0,damageTaken:0,kills:0},groups,events:[],truncated:{events:0},final:null,nextMoraleAt:1};this.sampleMorale(true)
  },
  event(type,unit,extra={}){const t=this.session?.telemetry;if(!t||this.session.result)return;const row={time:Math.round(B.t*1000)/1000,type,unitId:unit?.id??null,unitType:unit?.type??null,groupId:unit?.grp??extra.groupId??null};const g=t.groups[row.groupId];if(g){if(g.events.length<this.eventLimit)g.events.push({...row,...extra});else g.truncated.events++}if(t.events.length<this.eventLimit)t.events.push({...row,...extra});else t.truncated.events++},
  damage(target,amount,source){const t=this.session?.telemetry;if(!t||this.session.result||!target||target.hp<=0)return;const n=Math.max(0,amount);if(!n)return;const tg=t.groups[target.grp],sg=source&&t.groups[source.grp];if(tg)tg.damageTaken+=n;else t.uncredited.damageTaken+=n;if(sg)sg.damageDealt+=n;else t.uncredited.damageDealt+=n},
  kill(target,source){const t=this.session?.telemetry;if(!t||this.session.result)return;const g=source&&t.groups[source.grp];if(g)g.kills++;else t.uncredited.kills++},
  sampleMorale(force=false){const t=this.session?.telemetry;if(!t||this.session.result||!B)return;if(!force&&B.t<t.nextMoraleAt)return;t.nextMoraleAt=Math.floor(B.t)+1;for(const [id,g] of Object.entries(t.groups)){const units=B.units.filter(u=>u.grp===id),alive=units.filter(u=>u.hp>0),r=B.groups[id]?.resolve; r?.refreshState();const value=r&&alive.length?Math.round(r.mor*10)/10:null;const sample={time:Math.round(B.t*1000)/1000,average:value,minimum:value,state:B.noMorale?'disabled':r?.state??'unbreakable',confidence:r?.confidence??0,cohesion:r?.cohesion??null,lossStrain:r?.lossStrain??0,missilePressure:r?.missilePressure??0,alive:alive.length,dead:units.filter(u=>u.hp<=0&&!u.left).length,routing:alive.filter(u=>u.rout).length,exited:units.filter(u=>u.left).length},last=g.morale[g.morale.length-1];if(force&&last&&last.time===sample.time)g.morale[g.morale.length-1]=sample;else if(g.morale.length<this.moraleLimit)g.morale.push(sample);else if(force){g.morale[g.morale.length-1]=sample;g.truncated.morale++}else g.truncated.morale++}},
  report(){if(this.session?.completedReport)return structuredClone(this.session.completedReport);const t=this.session?.telemetry;if(!t)return null;const report=structuredClone(t);if(!report.final&&B)report.final={time:Math.round(B.t*1000)/1000,result:null,units:B.units.filter(u=>u.grp&&t.groups[u.grp]).map(u=>({id:u.id,groupId:u.grp,side:u.team?'right':'left',type:u.type,hpLeft:u.left?Math.max(0,u.hpLeft??u.hp):Math.max(0,u.hp),alive:!u.left&&u.hp>0,dead:!u.left&&u.hp<=0,routing:!!u.rout,exited:!!u.left,exitCause:u.left?(u.rout?'routed':'withdrawn'):null}))};if(report.final)for(const g of Object.values(report.groups)){const units=report.final.units.filter(u=>u.groupId===g.id);g.final={survivors:units.filter(u=>u.alive||u.exited&&u.hpLeft>0).length,remaining:units.filter(u=>u.alive).length,dead:units.filter(u=>u.dead).length,routing:units.filter(u=>u.routing&&u.alive).length,exited:units.filter(u=>u.exited).length,routedExits:units.filter(u=>u.exitCause==='routed').length,withdrawnExits:units.filter(u=>u.exitCause==='withdrawn').length}}return report},
  exportReport(){const report=this.report();if(!report)throw Error('No battle laboratory report is available.');const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ashmark-battle-lab-seed-'+report.seed+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},
  validate(raw){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Supply a battle configuration.');
    const mode=raw.mode||(raw.leftGroups!==undefined||raw.rightGroups!==undefined?'army':'duel');if(!['duel','army'].includes(mode))throw Error('Unknown battle configuration mode.');
    const c={left:'hum_bow',leftCount:1,right:'hum_foot',rightCount:1,distance:220,terrain:'open',climate:'grass',seed:42,ai:true,paused:true,morale:true,deploy:mode==='army',ground:'none',type:'field',...raw,mode};
    // (size: a field size (setup.js FIELD_SIZES: small, big, large, vlarge or 'very large', huge), forced; none: as the battle would choose)
    if(c.size!=null){const k=c.size==='very large'?'vlarge':c.size;if(typeof k!=='string'||!FIELD_SIZES.order.includes(k))throw Error('Size: use '+FIELD_SIZES.order.join(', ')+'.');c.size=k}
    for(const [side,team] of [['left',0],['right',1]]){
      const rows=c[side+'Groups']??[{type:c[side],count:c[side+'Count']}],seen=new Set();
      if(!Array.isArray(rows)||!rows.length||rows.length>ARMY_LIMIT||mode==='duel'&&rows.length!==1)throw Error('Each army needs 1–10 groups, including characters.');
      c[side+'Groups']=Array.from(rows,row=>{
        if(!row||typeof row!=='object'||row.type!=='hero'&&!Object.hasOwn(ST,row.type))throw Error('Choose valid unit IDs (units lists them).');
        const type=row.type,character=type==='hero'||Object.hasOwn(COMPS,type),count=row.count,form=row.form??'line',files=row.files===0||row.files==null?null:row.files,name=row.name??'';
        if(!Number.isInteger(count)||count<1||count>100)throw Error('Each group needs 1–100 fighters.');
        if(character&&(count!==1||seen.has(type))||type==='hero'&&team!==0)throw Error('Characters need count 1 and may appear once per army; the current hero is left-side only.');
        if(character)seen.add(type);
        if(!Object.hasOwn(FORMS,form)||character&&form!=='line'||FORMS[form].who&&!FORM_WHO[FORMS[form].who]({s:ST[type]})||form==='wedge'&&count<WEDGE.min)throw Error('Formation does not suit this group (wedge requires at least 6 cavalry).');
        if(files!==null&&(!Number.isInteger(files)||files<1||files>count))throw Error('Files must be 0 (auto) or a whole number up to the group count.');
        if(typeof name!=='string'||/[\u0000-\u001f\u007f]/.test(name)||Array.from(name.trim()).length>32)throw Error('Group names allow up to 32 characters without controls.');
        return {type,count,form,files,name:name.trim()};
      });
      if(c[side+'Groups'].reduce((n,g)=>n+g.count,0)>200)throw Error('Limit each army to 200 fighters for sandbox performance.');
    }
    if(!Number.isFinite(c.distance)||c.distance<40||c.distance>Math.max(800,c.size?FIELD_SIZES[c.size].w-400:0))throw Error('Separation must be 40–'+Math.max(800,c.size?FIELD_SIZES[c.size].w-400:0)+' field pixels.');
    if(!['open','forest','hill'].includes(c.terrain)||!CLIMS.includes(c.climate))throw Error('Unknown terrain or climate.');
    if(!Number.isInteger(c.seed)||c.seed<0||c.seed>4294967295)throw Error('Seed must be an unsigned 32-bit integer.');
    for(const k of ['ai','paused','morale','deploy'])if(typeof c[k]!=='boolean')throw Error(k+' must be true or false.');
    c.ground=this.validGround(c.ground);c.type=this.validType(c.type);if(c.fog!=null&&typeof c.fog!=='boolean')throw Error('fog must be true or false.');
    if(c.powers!=null&&typeof c.powers!=='boolean')throw Error('powers must be true or false.');if(c.commander!=null)c.commander=this.validCommander(c.commander,c);
    return Object.fromEntries(['mode','leftGroups','rightGroups','distance','terrain','climate','seed','ai','paused','morale','deploy','ground','type',...(c.fog!=null?['fog']:[]),...(c.size!=null?['size']:[]),...(c.powers!=null?['powers']:[]),...(c.commander!=null?['commander']:[])].map(k=>[k,c[k]]));
  },
  // (the commander key, normalized: see LabBattleSetup.powers)
  validCommander(v,c){const bad=m=>{throw Error('Commander: '+m)};if(typeof v!=='object'||Array.isArray(v))bad('use {left, right}, each null or {group, lead}.');const o={};
    for(const side of ['left','right']){if(!Object.hasOwn(v,side))continue;const s=v[side];if(s===null){o[side]=null;continue}if(typeof s!=='object'||Array.isArray(s))bad(side+' is null or {group, lead}.');const q={};
      if(s.group!=null){if(!Number.isInteger(s.group)||s.group<0||s.group>=c[side+'Groups'].length)bad(side+' group is the index of one of its rows.');q.group=s.group}
      if(s.lead!=null){if(typeof s.lead!=='number'||!(s.lead>=0&&s.lead<=10))bad(side+' lead is 0-10.');q.lead=s.lead}o[side]=q}
    return o
  },
  // (the type key, normalized: see LabBattleSetup.battleType)
  validType(t){if(t==null||t==='field'||t==='bridge'||t==='ambush')return t??'field';const bad=m=>{throw Error('Type: '+m)};
    if(typeof t!=='object'||Array.isArray(t)||!['bridge','ambush'].includes(t.kind))bad("use 'field', 'bridge', 'ambush' or {kind, side, ford}.");const o={kind:t.kind};
    if(t.side!=null){if(t.side!=='left'&&t.side!=='right')bad("side is 'left' or 'right' (the side set upon).");o.side=t.side}
    if(t.ford!=null){if(t.kind!=='bridge'||typeof t.ford!=='boolean')bad('ford (true or false) is for a bridge.');o.ford=t.ford}return o},
  // (the ground key, normalized: see LabBattleSetup.groundSpec)
  validGround(g){
    if(g==null||g==='none'||g==='auto')return g??'none';const bad=m=>{throw Error('Ground: '+m)};if(typeof g!=='object'||Array.isArray(g))bad("use 'none', 'auto', {recipe, seed, river} or {hills, woods, marsh, rivers, seed}.");
    const seed=g.seed==null?undefined:g.seed;if(seed!==undefined&&!(Number.isInteger(seed)&&seed>=0&&seed<=4294967295))bad('seed must be an unsigned 32-bit integer.');
    const num=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b,flags=(v,ks,w)=>{const o={};for(const k of ks)if(v[k]!=null){if(typeof v[k]!=='boolean')bad(w+' '+k+' must be true or false.');if(v[k])o[k]=true}return o};
    if(g.recipe!=null){if(g.recipe!=='river'&&g.recipe!=='crags'&&!Object.hasOwn(TERRAIN_RECIPE,g.recipe))bad('unknown recipe ('+Object.keys(TERRAIN_RECIPE).join(', ')+', river, crags).');const r={recipe:g.recipe};if(seed!==undefined)r.seed=seed;if(g.oasis)r.oasis=true;
      if(g.river!=null&&g.river!==false){if(g.river!==true&&(typeof g.river!=='object'||Array.isArray(g.river)))bad('river must be true or {bridge, frozen, stream}.');r.river=g.river===true?{}:flags(g.river,['bridge','frozen','stream'],'river')}
      else if(g.recipe==='river')r.river={};
      // (field variety: a layout of the recipe's own, the edges, a road, elven woods)
      if(g.layout!=null){const L=terrainLayouts(g.recipe==='river'?'open':g.recipe==='crags'?'hills':g.recipe);if(!L.includes(g.layout))bad('layout must be one of '+L.join(', ')+'.');r.layout=g.layout}
      if(g.edges!=null){if(typeof g.edges!=='object'||Array.isArray(g.edges))bad('edges must be {n, s, w, e}.');const K=['forest','hills','peaks','water','marsh','open'],o={};for(const k of Object.keys(g.edges)){if(!['n','s','w','e'].includes(k)||!K.includes(g.edges[k]))bad('edges: n, s, w or e, each one of '+K.join(', ')+'.');o[k]=g.edges[k]}r.edges=o}
      if(g.road!=null&&g.road!==false){if(g.road!==true&&g.road!=='ns')bad("road must be true or 'ns'.");r.road=g.road}
      if(g.elven!=null){if(typeof g.elven!=='boolean')bad('elven must be true or false.');if(g.elven)r.elven=true}
      return r}
    const out={};
    for(const k of ['hills','woods','marsh']){const l=g[k]??[];if(!Array.isArray(l)||l.length>8)bad(k+' must be a list of at most 8.');
      out[k]=l.map(p=>{if(!p||!num(p.x,0,1)||!num(p.y,0,1)||!num(p.r,16,400))bad(k+' need x, y (0-1) and r (16-400 px).');
        if(k!=='hills')return{x:p.x,y:p.y,r:p.r};const top=p.top??1;if(top!==1&&top!==2)bad('a hill top is 1 or 2.');
        const h={x:p.x,y:p.y,r:p.r,top};for(const q of ['rx','ry'])if(p[q]!=null){if(!num(p[q],16,600))bad(q+' must be 16-600 px.');h[q]=p[q]}
        Object.assign(h,flags(p,['cliff','oneway'],'a hill'));if(p.ramps!=null){if(!h.cliff&&!h.oneway)bad('ramps need cliff or oneway.');if(!Array.isArray(p.ramps)||!p.ramps.length||p.ramps.length>4||!p.ramps.every(a=>num(a,-360,360)))bad('ramps must be a list of 1-4 angles (degrees, 0 east, 90 south).');h.ramps=p.ramps.slice()}return h})}
    {const l=g.rocks??[];if(!Array.isArray(l)||l.length>12)bad('rocks must be a list of at most 12.');
      if(l.length)out.rocks=l.map(p=>{if(!p||!num(p.x,0,1)||!num(p.y,0,1)||!num(p.r,8,200))bad('rocks need x, y (0-1) and r (8-200 px).');if(p.h!=null&&!(Number.isInteger(p.h)&&num(p.h,1,18)))bad('a rock h is 1-18 levels (whole).');const o={x:p.x,y:p.y,r:p.r};if(p.h!=null)o.h=p.h;return o})}
    {const l=g.rivers??[];if(!Array.isArray(l)||l.length>2)bad('rivers must be a list of at most 2.');
      if(l.length)out.rivers=l.map(v=>{if(!v||!num(v.x,.05,.95))bad('a river needs x (0.05-0.95).');if(v.meander!=null&&!num(v.meander,0,64))bad('a river meander is 0-64 px.');const cr=v.crossings??[];if(!Array.isArray(cr)||cr.length>4)bad('a river has at most 4 crossings.');
        const o={x:v.x,crossings:cr.map(c=>{if(!c||!['ford','bridge'].includes(c.kind)||!num(c.y,0,1))bad("a crossing needs kind ('ford' or 'bridge') and y (0-1).");if(c.w!=null&&!num(c.w,16,200))bad('a crossing w is 16-200 px.');const q={kind:c.kind,y:c.y};if(c.w!=null)q.w=c.w;return q}),...flags(v,['frozen','stream'],'river')};
        if(v.meander!=null)o.meander=v.meander;return o})}
    // (a road across its own features: true (west to east), 'ns' (north to south too) or the share of the field's height it crosses at)
    if(g.road!=null&&g.road!==false){if(g.road!==true&&g.road!=='ns'&&!num(g.road,0,1))bad("road must be true, 'ns' or a y share (0-1).");out.road=g.road}
    if(seed!==undefined)out.seed=seed;return out},
  builtins(){return [
    {name:'Combined arms',config:{leftGroups:[{type:'hum_foot',count:20},{type:'hum_bow',count:12},{type:'hum_knight',count:6,form:'wedge'}],rightGroups:[{type:'hum_foot',count:20},{type:'hum_bow',count:12},{type:'hum_knight',count:6,form:'wedge'}]}},
    {name:'Duplicate formations',config:{leftGroups:[{type:'hum_foot',count:15,name:'Left guard'},{type:'hum_foot',count:15,name:'Right guard'},{type:'hum_bow',count:12}],rightGroups:[{type:'dw_clan',count:15},{type:'dw_clan',count:15},{type:'dw_sling',count:12}]}},
    {name:'Mounted archers vs footmen',config:{leftGroups:[{type:'hum_hbow',count:50}],rightGroups:[{type:'hum_foot',count:100}]}},
    {name:'Footmen vs berserkers',config:{leftGroups:[{type:'hum_foot',count:100}],rightGroups:[{type:'dw_berserk',count:100}]}}
  ].map(p=>({...p,config:this.validate(p.config)}))},
  savedPresets(){try{const value=JSON.parse(localStorage.getItem(this.presetKey)||'[]');if(!Array.isArray(value))return [];return value.slice(0,20).flatMap(p=>{try{return [{name:this.presetName(p.name),config:this.validate(p.config)}]}catch(e){return []}})}catch(e){return []}},
  presetName(value){if(typeof value!=='string'||!value.trim()||/[\u0000-\u001f\u007f]/.test(value)||Array.from(value.trim()).length>32)throw Error('Preset names need 1–32 characters without controls.');return value.trim()},
  savePreset(name,raw){name=this.presetName(name);const config=this.validate(raw),all=this.savedPresets(),i=all.findIndex(p=>p.name===name);if(i<0&&all.length>=20)throw Error('Limit reached: 20 saved lab presets.');if(i<0)all.push({name,config});else all[i]={name,config};localStorage.setItem(this.presetKey,JSON.stringify(all));return {name,config}},
  deletePreset(name){const all=this.savedPresets();if(!all.some(p=>p.name===name))throw Error('Choose a saved user preset to delete.');localStorage.setItem(this.presetKey,JSON.stringify(all.filter(p=>p.name!==name)))},
  restoreRecord(record,descriptors){for(const k of Object.keys(record))delete record[k];Object.defineProperties(record,descriptors)},
  start(raw){
    const c=this.validate(raw);if(this.active)throw Error('Exit or restart the current test first.');
    if(B||!['title','world'].includes(G.mode)||G.mode==='world'&&G.modal)throw Error('Start a test from the title screen or the unobstructed world map.');
    const player=JSON.parse(JSON.stringify(P));
    this.session={player:Object.getOwnPropertyDescriptors(P),game:Object.getOwnPropertyDescriptors(G),html:panel.innerHTML,wide:panel.classList.contains('wide'),overlay:ov.hidden,bar:bbar.hidden,width:BW,random:Math.random,mood:BATTLE_MOOD};
    try{
      const hasHero=c.leftGroups.some(g=>g.type==='hero'),troops={};for(const g of c.leftGroups)if(g.type!=='hero'&&!Object.hasOwn(COMPS,g.type))troops[g.type]=(troops[g.type]||0)+g.count;
      this.restoreRecord(P,Object.getOwnPropertyDescriptors({...player,...(hasHero?{}:{tree:['start'],perks:[]}),morale:100,comps:{},army:{nextId:1,groups:[]},troops,wounded:{},woundedGroups:[],captives:[],prisoners:{},stay:null,siege:null,raid:null,hp:null,sp:null,mp:null}));
      if(typeof P.changed==='function')P.changed();
      this.restoreRecord(G,Object.getOwnPropertyDescriptors({...makeRuntimeState(),mode:'world',modal:false,day:G.day,quietEvents:true}));
      Math.random=seeded(c.seed);new LabBattleSetup(c).start();this.last=structuredClone(c);this.session.result=null;this.beginTelemetry();
      if(typeof DevConsole!=='undefined'){DevConsole.close();DevConsole.labStatus()}
      return 'Battle test started. Use the normal orders, or the test toolbar to pause, step, restart and exit.';
    }catch(e){this.exit();throw e}
  },
  finish(){if(!this.active||!B||this.session.completedReport)return;B.paused=true;this.sampleMorale(true);this.session.result=B.win?'Left side wins':'Right side wins';this.session.telemetry.final={time:Math.round(B.t*1000)/1000,result:this.session.result,units:B.units.filter(u=>u.grp&&this.session.telemetry.groups[u.grp]).map(u=>({id:u.id,groupId:u.grp,side:u.team?'right':'left',type:u.type,hpLeft:u.left?Math.max(0,u.hpLeft??u.hp):Math.max(0,u.hp),alive:!u.left&&u.hp>0,dead:!u.left&&u.hp<=0,routing:!!u.rout,exited:!!u.left,exitCause:u.left?(u.rout?'routed':'withdrawn'):null}))};this.session.completedReport=this.report();battleSpeedUI();if(typeof DevConsole!=='undefined')DevConsole.labStatus()},
  step(n=1){
    if(!this.active||!B)throw Error('Start a battle test first.');if(!Number.isInteger(n)||n<1||n>600)throw Error('Step accepts 1–600 frames.');
    if(this.session.result)return 'Test finished; restart to run it again.';
    if(B.deploy)throw Error('Finish deployment with Begin before stepping the battle.');
    B.paused=false;try{for(let i=0;i<n&&!this.session.result;i++)updateBattle(1/60)}finally{if(B)B.paused=true;battleSpeedUI();if(typeof DevConsole!=='undefined')DevConsole.labStatus()}
    return 'Stepped '+n+' frame(s); test paused.';
  },
  restart(){if(!this.active)throw Error('No active battle test.');const c=structuredClone(this.last);this.exit();return this.start(c)},
  exit(){
    const s=this.session;if(!s)return 'No active battle test.';B=null;Math.random=s.random;fieldDone();BW=s.width;BATTLE_MOOD=s.mood;
    this.restoreRecord(P,s.player);this.restoreRecord(G,s.game);this.session=null;
    panel.innerHTML=s.html;panel.classList.toggle('wide',s.wide);ov.hidden=s.overlay;bbar.hidden=s.bar;updateHUD(true);updateHint();
    if(typeof DevConsole!=='undefined')DevConsole.labStatus();return 'Exited test; campaign restored. No rewards or losses applied.';
  }
};
