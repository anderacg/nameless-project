'use strict';
/* Travel groups can wait in cover while their leader draws an enemy toward them. */
const TRAVEL_AMBUSH={leash:220,memory:8,quiet:.5,moving:1.35,size:.035,maxSize:.25};
class MarchAmbush{
  static held(id){return P.army?.concealed?.[id]||null}
  static set(id,on){
    if(id==='hero'||!partyRoster(P).groups.some(g=>g.id===id))return false;
    const a=MarchArmy.of(P);a.sync();const m=a.forGroup(id);if(!m.length)return false;
    if(on){const x=m.reduce((n,u)=>n+u.x,0)/m.length,y=m.reduce((n,u)=>n+u.y,0)/m.length;(P.army.concealed||(P.army.concealed={}))[id]={x,y,face:a.face};}
    else if(P.army.concealed)delete P.army.concealed[id];a.goalGround=null;return true;
  }
  static releaseFar(){
    for(const [id,p] of Object.entries(P.army?.concealed||{}))if(!partyRoster(P).groups.some(g=>g.id===id)||Math.hypot(P.x-p.x,P.y-p.y)>TRAVEL_AMBUSH.leash){delete P.army.concealed[id];const a=MARCH_ARMIES.get(P);if(a)a.goalGround=null}
  }
  static groups(){
    const hero={id:'hero',type:'hero',count:1,x:P.x,y:P.y,cover:!!hiddenAt(P.x,P.y),moving:P.tx!=null,extent:0,power:rating(['hero'])};
    if(!WORLD_BATTLE.on)return[hero];const a=MARCH_ARMIES.get(P);if(!a)return[hero];a.sync();
    const out=[hero];for(const row of a.rows){if(row.id==='hero')continue;const m=a.forGroup(row.id).filter(u=>!u.dead);if(!m.length)continue;
      const x=m.reduce((n,u)=>n+u.x,0)/m.length,y=m.reduce((n,u)=>n+u.y,0)/m.length,type=row.type.replace(/^comp_/,''),hold=!!this.held(row.id);
      out.push({id:row.id,type,count:m.length,x,y,hold,cover:m.every(u=>hiddenAt(u.x,u.y)),moving:m.some(u=>u.walking),extent:Math.max(0,...m.map(u=>Math.hypot(u.x-x,u.y-y))),power:rating(Array(m.length).fill(type))});
    }return out;
  }
  static battle(){
    for(const g of Object.values(B.groups))if(g.player&&this.held(g.sourceGroupId||g.id.replace(/^p_/,''))){g.concealHold=true;g.firm=true;g.cease=true;g.aiCmd=false}
  }
  static releaseBattle(ids){for(const id of ids){const g=B?.groups[id];if(g?.concealHold){delete g.concealHold;g.firm=false;g.cease=false}}}
  static finish(){if(P.army)delete P.army.concealed}
}
onAct('conceal-',(a,id)=>{if(a==='conceal-toggle'&&G.mode==='char'){MarchAmbush.set(id,!MarchAmbush.held(id));renderChar()}});
