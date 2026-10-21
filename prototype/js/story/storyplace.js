'use strict';
/* ---------- a story place (split from story/context.js): what a happening's conditions read about a spot on the map, worked out
   once, when first read: its terrain and climate, whose land it is, a road or the mountains near, a wood's edge, the cover for an
   ambush. StoryContext (context.js) is the one where you stand, with the when and who; Story.at(tx, ty) one for any tile;
   road.js roadLand reads one directly. It only reads: no Math.random, no changes. ---------- */
class StoryPlace{
  constructor(x,y){
    this.x=x;
    this.y=y;
    this.tx=Math.floor(x/TILE);
    this.ty=Math.floor(y/TILE);
    this.known={};
  }
  // (a fact worked out once, when first read)
  once(k,fn){
    const m=this.known;
    if(!(k in m))m[k]=fn();
    return m[k];
  }
  // ---- where
  // its terrain (T_*) and climate ('grass', 'frost', 'desert', 'swamp')
  get terrain(){
    return this.once('terrain',()=>tAt(this.tx,this.ty));
  }
  get climate(){
    return this.once('climate',()=>climAt(this.x,this.y));
  }
  // whose land it is (the holding, or null), and that holding only if it has a lord (a realm's, or yours)
  get land(){
    return this.once('land',()=>landHold(this.x,this.y));
  }
  get owned(){
    const t=this.land;
    return t&&t.owner?t:null;
  }
  // a tile of a terrain within r tiles (sites.js nearTile)
  by(type,r){
    return nearTile(this.tx,this.ty,type,r);
  }
  // on a road or a tile by one; by the mountains (within 2 tiles)
  get byRoad(){
    return this.once('byRoad',()=>this.by(T_ROAD,1));
  }
  get byMountains(){
    return this.once('byMountains',()=>this.by(T_MOUNT,2));
  }
  // the land, as the road's chance counts it: 'road' (on one or a tile by), 'held' (a holding's land) or 'wild'
  get landKind(){
    return this.byRoad?'road':this.land?'held':'wild';
  }
  // a wood's edge: open land with the trees beside or behind it, none in the row in front (so a camp there shows)
  get woodsEdge(){
    return this.once('woodsEdge',()=>this.terrain===T_OPEN&&this.by(T_FOREST,1)&&![-1,0,1].some(i=>tAt(this.tx+i,this.ty+1)===T_FOREST));
  }
  // the cover here for an ambush (battle/engage.js coverAt: 'forest', 'hills', 'field' or null)
  get cover(){
    return this.once('cover',()=>coverAt(this.x,this.y));
  }
}
