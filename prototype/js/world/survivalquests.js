'use strict';
/* Optional survival tasks: existing wildlife, water filling and quest markers do the work. */
const SURVIVAL_QUESTS={days:.5,cool:12,show:25,every:3,waterRadius:80,searchRadius:3};
class SurvivalQuest extends StepQuest{
  setup(t,lord,s){this.need=s.need;this.to=s.to;this.title=this.need==='food'?'Hunt for food':'Find drinking water';this.text=this.need==='food'?'Follow the wildlife marker, hunt an individual animal and collect its meat. Click the carcass to take the meat.':'Follow the water marker and fill your waterskins. Empty waterskins can be bought at a settlement market.';this.giver='Your company';this.takes({quiet:true});this.startWater=goodN('water');this.hunted=0}
  get abandonable(){return true}
  seek(){return this.to?{...this.to}:null}
  givenBy(){return 'Your company'}
  reportLine(){return 'Complete on the road; no turn-in required'}
  rewardLine(){return this.need==='food'?'Meat for your company':'Water for your company'}
  gotLine(state){return state==='done'?this.rewardLine():''}
  abandon(){this.fail('You gave it up.','left')}
  todo(){return this.to?(this.need==='food'?(this.to.collect?'Collect meat from the marked carcass.':'Track wildlife, hunt an animal and collect its meat.'):skinsEmpty()||goodN('water')?'Reach the water and fill your waterskins.':'Buy empty waterskins at a market, then fill them.'):'No reachable source found nearby. Keep exploring; the marker will update.'}
  finish(why){this.done=true;this.fate=why||'supplied';P.quests=P.quests.filter(q=>q.id!==this.id);log((why==='supplied'?'Supplies restored: ':'Survival task complete: ')+this.title+'.','good','story',this.journalKey);this.announceEnd('paid');updateHUD(true)}
}
defineKinds('step',{},{survivalfood:{cls:SurvivalQuest},survivalwater:{cls:SurvivalQuest}});
class SurvivalGuide{
  constructor(){this.reset()}
  reset(v={}){this.enabled=v.enabled!==false;this.cool={...v.cool};this.prompted={...v.prompted};this.offer=null;this.wait=0;this.waterCache=null}
  save(){if(this.enabled&&!Object.keys(this.cool).length&&!Object.keys(this.prompted).length)return;return {enabled:this.enabled,cool:{...this.cool},prompted:{...this.prompted}}}
  active(need){return P.quests.map(q=>Quest.as(q)).find(q=>q instanceof SurvivalQuest&&q.need===need)}
  low(need){const S=supplyNow();return need==='food'?BAND.hungry>0||S.foodDays<SURVIVAL_QUESTS.days:BAND.dry>0||S.drinkDays<SURVIVAL_QUESTS.days}
  huntGoal(){
    let best=null,dist=Infinity;const V=vis();
    for(const c of W.critters){if(!c.wild||c.n<=0||!CRITTERS[c.id]?.meat)continue;
      for(let i=0;i<c.n;i++){const m=HERD_FLOCK.get(c)?.m[i];if(m?.dead)continue;const p=herdSpotNow(c,i),d=(p.x-P.x)**2+(p.y-P.y)**2;if(d>=dist||!Router.reach(P,p))continue;
        const visible=m&&c.memberVisible(m,V);dist=d;best={x:p.x,y:p.y,name:CRITTERS[c.id].one,...(visible?{}:{r:SURVIVAL_QUESTS.searchRadius})};
      }
    }
    return best;
  }
  carcassGoal(){
    let best=null,dist=vis()**2;for(const c of Carcass.list){if(!c.wild||c.huntLeft===0||BodyRot.stage(c.day)!=='fresh'||!c.items.some(s=>s.k==='good'&&s.id==='meat'&&s.n>0)||!c.inView(vis()))continue;
      const d=(c.x-P.x)**2+(c.y-P.y)**2;if(d<dist&&Router.reach(P,c)){dist=d;best={x:c.x,y:c.y,name:(CRITTERS[c.wild]?.one||'Animal')+' carcass',collect:true}}}return best;
  }
  waterGoal(){
    const c=this.waterCache,now=performance.now()/1000,skins=!!(skinsEmpty()+goodN('water')),reach=fillReach();
    if(c&&c.skins===skins&&c.reach===reach&&now-c.at<15&&Math.hypot(P.x-c.x,P.y-c.y)<4*TILE)return c.goal;
    const goal=this.waterSearch();this.waterCache={x:P.x,y:P.y,skins,reach,at:now,goal};return goal;
  }
  waterSearch(){
    // A well at an admitted holding, or dry ground at the real water's edge. Never point into a lake.
    let best=null,dist=Infinity;const candidates=[];
    const towns=TOWNS.slice().sort((a,b)=>(a.x-P.x)**2+(a.y-P.y)**2-(b.x-P.x)**2-(b.y-P.y)**2);
    for(const t of towns){if(Math.hypot(t.x-P.x,t.y-P.y)-(GATE.r+3)*TILE>=Math.sqrt(dist)||t.ruined()||foeAt(t)||closedNow(t)||!Gates.admits(t).ok)continue;const p=wellGate(t),d=(p.x-P.x)**2+(p.y-P.y)**2;if(d<dist&&Router.reach(P,p)){best={x:p.x,y:p.y,name:t.name+' well'};dist=d}}
    if(!skinsEmpty()&&goodN('water')<=0)return best;
    const K=WorldArt.ensure().wk,r=Math.min(SURVIVAL_QUESTS.waterRadius,Math.ceil(Math.sqrt(dist)/TILE)),tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE),reach=fillReach(),pad=Math.ceil(reach/TILE)+1;
    for(let y=Math.max(1,ty-r);y<=Math.min(MH-2,ty+r);y++)for(let x=Math.max(1,tx-r);x<=Math.min(MW-2,tx+r);x++){
      const p={x:(x+.5)*TILE,y:(y+.5)*TILE},d=(p.x-P.x)**2+(p.y-P.y)**2;if(d>=dist||!passable(tAt(x,y))||occAt(x,y)||!Router.reach(P,p))continue;
      let wet=false;for(let j=Math.max(1,y-pad);j<=Math.min(MH-2,y+pad)&&!wet;j++)for(let i=Math.max(1,x-pad);i<=Math.min(MW-2,x+pad);i++)if(K[j*MW+i]){wet=true;break}
      if(wet)candidates.push({...p,d});
    }
    candidates.sort((a,b)=>a.d-b.d);for(const p of candidates)if(waterEdge(p.x,p.y,reach)){best={x:p.x,y:p.y,name:'Water’s edge'};break}
    return best;
  }
  goal(need){return need==='food'?this.huntGoal()||this.carcassGoal():this.waterGoal()}
  dismiss(){this.offer=null;updateHUD(true)}
  accept(need){
    if(G.mode!=='world'||G.modal||this.offer?.need!==need||this.active(need)||!this.low(need))return false;
    const to=this.goal(need),t=Spatial.nearestHolding(P.x,P.y);if(!to||!t){this.dismiss();return false}
    const q=Quest.make(need==='food'?'survivalfood':'survivalwater',t,null,{need,to});if(!q?.accept())return false;
    QuestTrack.set('q'+q.id);QT.pops=QT.pops.filter(p=>p.k!=='q'+q.id);this.offer=null;updateHUD(true);return true;
  }
  frame(dt){
    if(G.mode!=='world'||G.modal||G.paused||G.dead||Captivity.held)return;
    if((this.wait-=dt)>0)return;this.wait=SURVIVAL_QUESTS.every;
    const now=Clock.hours(),low={food:this.low('food'),water:this.low('water')};
    for(const need of ['food','water'])if(!low[need])delete this.prompted[need];
    for(const q of P.quests.map(q=>Quest.as(q)).filter(q=>q instanceof SurvivalQuest)){
      if(q.need==='food'&&q.hunted>0&&goodN('meat')>0||q.need==='water'&&goodN('water')>q.startWater){q.finish();continue}
      if(!low[q.need]){q.finish('supplied');continue}
      q.to=q.need==='food'?this.carcassGoal()||this.goal('food'):this.goal(q.need);
    }
    if(this.offer&&(performance.now()/1000>=this.offer.until||!low[this.offer.need]))this.offer=null;
    if(!this.enabled||G.quietEvents||this.offer)return;
    for(const need of ['water','food']){
      if(this.active(need)||this.prompted[need]||now<(this.cool[need]||0)||!low[need])continue;
      const goal=this.goal(need);if(!goal)continue;
      this.prompted[need]=true;this.cool[need]=now+SURVIVAL_QUESTS.cool;this.offer={need,goal,until:performance.now()/1000+SURVIVAL_QUESTS.show};updateHUD(true);break;
    }
  }
  popup(){const o=this.offer;if(!o)return '';const food=o.need==='food',name=food?'Hunt for food':'Find drinking water';return '<div class="qt-pop qt-survival" data-k="survival-'+o.need+'" role="status"><button type="button" class="qt-x" data-act="surv-dismiss" aria-label="Dismiss survival task">×</button><span class="qt-new">Optional survival task</span><b>'+name+'</b><small>'+(food?'Food is running low.':'Drink is running low.')+' '+htmlText(o.goal.name)+': '+htmlText(questWay(o.goal))+'.</small><div class="qt-btns"><button type="button" class="btn sm primary" data-act="surv-accept" data-arg="'+o.need+'">'+(food?'Track wildlife':'Find water')+'</button><button type="button" class="btn sm" data-act="surv-dismiss">Not now</button></div></div>'}
}
const survivalGuide=new SurvivalGuide();
onWorld(()=>survivalGuide.reset());
Saves.add({key:'survivalGuide',order:286,defaults:{},save:()=>survivalGuide.save(),load:v=>survivalGuide.reset(v)});
Systems.add({name:'survival guidance',order:{frame:149},frame:(d,dt)=>survivalGuide.frame(dt)});
worldOn('meat:hunted',d=>{const q=survivalGuide.active('food');if(q&&d.n>0)q.hunted+=d.n});
worldOn('quest:ended',d=>{const q=d?.e;if(q instanceof SurvivalQuest)survivalGuide.cool[q.need]=Clock.hours()+SURVIVAL_QUESTS.cool});
onAct('surv-',(a,arg)=>{if(a==='surv-accept')survivalGuide.accept(arg);else if(a==='surv-dismiss')survivalGuide.dismiss();else if(a==='surv-toggle'&&G.mode==='char'){survivalGuide.enabled=!survivalGuide.enabled;survivalGuide.offer=null;renderChar()}});
