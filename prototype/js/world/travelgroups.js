'use strict';
/* Physical marching groups observed by travel awareness. */
const TRAVEL_GROUPS={memory:8,moving:1.35,size:.035,maxSize:.25};
class TravelGroups{
  static groups(){
    const hero={id:'hero',type:'hero',count:1,x:P.x,y:P.y,cover:!!hiddenAt(P.x,P.y),moving:P.tx!=null,extent:0,power:rating(['hero'])};
    if(!WORLD_BATTLE.on)return[hero];const a=MARCH_ARMIES.get(P);if(!a)return[hero];a.sync();
    const out=[hero];for(const row of a.rows){if(row.id==='hero')continue;const m=a.forGroup(row.id).filter(u=>!u.dead);if(!m.length)continue;
      const x=m.reduce((n,u)=>n+u.x,0)/m.length,y=m.reduce((n,u)=>n+u.y,0)/m.length,type=row.type.replace(/^comp_/,'');
      out.push({id:row.id,type,count:m.length,x,y,cover:m.every(u=>hiddenAt(u.x,u.y)),moving:m.some(u=>u.walking),extent:Math.max(0,...m.map(u=>Math.hypot(u.x-x,u.y-y))),power:rating(Array(m.length).fill(type))});
    }return out;
  }
}
