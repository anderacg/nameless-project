'use strict';
/* Optional road choices. Sites, hunting, supply and company rules retain their own actions and rewards. */
const ROAD_GUIDE={radius:80,refresh:1};
class RoadGuide{
  constructor(){this.reset()}
  reset(v={}){const g=v.target;this.target=g&&Number.isFinite(g.x)&&Number.isFinite(g.y)&&['hunt','clear','explore'].includes(g.kind)?{kind:g.kind,x:g.x,y:g.y,name:String(g.name||'Destination'),...(Number.isInteger(g.site)?{site:g.site}:{})}:null;this.animal=null;this.choices=[];this.next=0}
  save(){const g=this.goal();return g?{target:{...g}}:undefined}
  known(s){return !s.cleared&&!s.looted&&s.known()&&Math.hypot(s.x-P.x,s.y-P.y)<=ROAD_GUIDE.radius*TILE}
  options(){
    const found=[],V=vis();
    for(const c of W.critters){if(!c.wild||!CRITTERS[c.id]?.meat)continue;
      for(let i=0;i<c.n;i++){const m=HERD_FLOCK.get(c)?.m[i];if(!m||m.dead||!c.memberVisible(m,V))continue;const p=herdSpotNow(c,i);found.push({kind:'hunt',...p,name:CRITTERS[c.id].one,reward:'Meat; possible hide or materials',animal:{c,m,i}})}
    }
    for(const s of W.sites){if(!this.known(s))continue;const kind=['camp','hideout','goblins'].includes(s.type)?'clear':['ruins','cave'].includes(s.type)?'explore':null;if(!kind)continue;
      found.push({kind,x:s.x,y:s.y,site:s.i,name:Discovery.nameOf(s),reward:kind==='clear'?'Combat experience; loot to collect':'Exploration; possible treasure'})}
    found.sort((a,b)=>qTiles(a,P)-qTiles(b,P));const choices=[];
    for(const kind of ['hunt','clear','explore']){for(const g of found){if(g.kind!==kind||!Router.reach(P,g))continue;const days=Router.days(P,g,MAP_BASE*travelMul());if(!Number.isFinite(days))continue;
        const risk=MonsterRegions.forecast(g.x,g.y);choices.push({...g,hours:days*24,risk:risk.word});break}}
    this.choices=choices;return choices;
  }
  track(i){const g=this.choices[i];if(!g)return false;
    if(g.site!=null){const s=W.sites.find(s=>s.i===g.site);if(!s||!this.known(s))return false}
    else if(!g.animal||g.animal.m.dead||!g.animal.c.memberVisible(g.animal.m,vis()))return false;
    this.target={kind:g.kind,x:g.x,y:g.y,name:g.name,...(g.site!=null?{site:g.site}:{})};this.animal=g.animal||null;this.next=0;return true;
  }
  goal(){
    const g=this.target;if(!g)return null;
    if(g.site!=null){const s=W.sites.find(s=>s.i===g.site);if(!s||s.cleared||s.looted||!s.known()){this.target=null;return null}}
    const now=performance.now()/1000;
    if(this.animal&&now>=this.next){this.next=now+ROAD_GUIDE.refresh;const {c,m,i}=this.animal;
      if(!W.critters.includes(c)||m.dead||HERD_FLOCK.get(c)?.m[i]!==m){this.target=null;this.animal=null;return null}
      if(c.memberVisible(m,vis())){const p=herdSpotNow(c,i);g.x=p.x;g.y=p.y}}
    return g;
  }
  clear(){this.target=null;this.animal=null}
}
const roadGuide=new RoadGuide();
onWorld(()=>roadGuide.reset());
Saves.add({key:'roadGuide',order:287,defaults:{},save:()=>roadGuide.save(),load:v=>roadGuide.reset(v)});
const roadTime=h=>!Number.isFinite(h)?'Unavailable':h<1?Math.max(1,Math.ceil(h*60))+' game min':h.toFixed(1)+' game hours';
function roadRestInfo(){
  const L=supplyLand(),dr=drinkNext(L)||(L.well||canFill(L)?'water':null),rate=staminaRate(false,dr,L),base=P.camp||P.stay?rate.n:rate.n*SUPPLY.rest.camp/SUPPLY.rest.stop;
  const why=P.camp?.pack?'Camp is packing':P.stay?'Already lodging in a holding':P.siege||P.raid?'Finish your current operation':Captivity.held?'You are captive':dangerInSight()?'Hostiles are in sight':P.bsta>=100?'Stamina is already full':base<=0?'Water is needed before you can recover':'';
  return {why,hours:base>0?Math.max(0,100-P.bsta)/base:Infinity,rate:base,note:rate.why.filter(s=>s.includes('×')||s.includes('no water')).join('; ')};
}
function openRoadGuide(){if(G.mode!=='world'||G.modal)return false;if(!openOver('roadguide',''))return false;renderRoadGuide();return true}
function renderRoadGuide(){
  const choices=roadGuide.options(),rest=roadRestInfo(),titles={hunt:'Hunt wildlife',clear:'Clear a camp',explore:'Explore a site'},icons={hunt:'bow',clear:'sword',explore:'map'},goal=roadGuide.goal();
  const cards=['hunt','clear','explore'].map(kind=>{const g=choices.find(g=>g.kind===kind),i=choices.indexOf(g);return {ico:icons[kind],name:titles[kind],role:g?htmlText(g.name):'Keep scouting',facts:g?[roadTime(g.hours)+' travel','Area: '+g.risk,g.reward]:[],note:g?'Track the destination, then choose how to approach.':'No discovered, reachable opportunity nearby.',acts:g?[['road-track',i,'Track destination']]:[]}});
  PAGE_SCREEN.show({ico:'map',title:'On the road',sub:'Choose your next adventure or rest your band',body:
    (goal?railRow('Tracking '+htmlText(goal.name),htmlText(questWay(goal))+(goal.kind==='hunt'?' · Last seen position':''),railBtn('road-clear',null,'Stop tracking')):'')+
    railCards(cards)+railRow('Rest until ready',Math.round(P.bsta)+'% stamina · '+roadTime(rest.hours)+' to full stamina in camp'+(rest.note?' · '+htmlText(rest.note):'')+(companyRules.recover?' · Rest in progress':''),railBtn(companyRules.recover?'road-stop':'road-rest',null,companyRules.recover?'Stop recovery':'Rest until ready',companyRules.recover?'':rest.why))+
    (!P.camp?railRow('Set up camp','Pitch tents without a recovery target',railBtn('road-camp',null,'Make camp',P.stay||P.siege||P.raid||Captivity.held?'Unavailable during this activity':'')):'')+
    (P.camp&&!P.camp.pack?railRow('Leave camp','Pack your tents before travelling',railBtn('road-pack',null,'Pack camp')):'')+
    '<p class="muted">Rest advances time at 4× (or your faster setting). Food and water are consumed normally. Wounded soldiers heal on their usual schedule. Danger interrupts recovery; departure still requires packing camp.</p><p class="muted">Travel and area danger are estimates. Wildlife markers retain the last seen position when animals leave sight. Loot is collected manually.</p>',back:['road-close',null,'Back'],close:['road-close',null,'Return to world']},'roadguide');
}
onAct('road-',(a,arg)=>{
  if(a==='road-open'){openRoadGuide();return}if(G.mode!=='roadguide')return;
  if(a==='road-close')closeOver();
  else if(a==='road-track'){if(roadGuide.track(+arg)){closeOver();toast('Destination tracked. Choose your approach.','gold','story')}else renderRoadGuide()}
  else if(a==='road-clear'){roadGuide.clear();renderRoadGuide()}
  else if(a==='road-stop'){companyRules.stopRecovery();renderRoadGuide()}
  else if(a==='road-camp'){closeOver();toggleCamp()}
  else if(a==='road-pack'){closeOver();breakCamp()}
  else if(a==='road-rest'){closeOver();if(!companyRules.beginRecovery())toast('Unable to rest here. Find safe, clear ground with supplies.','bad','band')}
  updateHUD(true);
});
