'use strict';
/* Character faces and corrected animal poses use compact WebP artwork. Named faces stay independent of equipment and allegiance;
   full PNG artwork stays in art/portrait. Extra generated lords retain a stable individual sprite look. */
const NAMED_PORTRAITS={
  "brann": "brann.webp?v=eb6e933d",
  "elske": "elske.webp?v=eec0d775",
  "tavi": "tavi.webp?v=1d1d699e",
  "ander": "ander.webp?v=a042c19e",
  "Lord Aldric": "lord_vale0.webp?v=0f02e5a6",
  "Lady Maren": "lord_vale1.webp?v=fca4d4cb",
  "Ser Corwin": "lord_vale2.webp?v=650036c2",
  "Lady Rowena": "lord_vale3.webp?v=f81576f6",
  "Thane Borka": "lord_karn0.webp?v=d97964f7",
  "Thane Hroth": "lord_karn1.webp?v=a44d9d70",
  "Thane Dain": "lord_karn2.webp?v=f5c79e19",
  "Thane Gimra": "lord_karn3.webp?v=ad7eaa66",
  "Lady Ithriel": "lord_sylvan0.webp?v=1ada833a",
  "Lord Caelan": "lord_sylvan1.webp?v=a37d100a",
  "Warden Sylas": "lord_sylvan2.webp?v=4198d035",
  "Lord Faelar": "lord_sylvan3.webp?v=daf869b2",
  "Warchief Ulgra": "lord_horde0.webp?v=39b70ce4",
  "Gash Bonecleaver": "lord_horde1.webp?v=a9065b84",
  "Mok the Red": "lord_horde2.webp?v=1fe6f74a",
  "Grukk Ironjaw": "lord_horde3.webp?v=3d4abf7f",
  "Admiral Cass": "lord_salt0.webp?v=0751c151",
  "Captain Ivo": "lord_salt1.webp?v=db0e092d",
  "Admiral Neri": "lord_salt2.webp?v=10dca47e",
  "Captain Mirelle": "lord_salt3.webp?v=fb560a66",
  "wolf": "wolf.webp?v=62f3f6d9",
  "dragon": "dragon.webp?v=b732f432",
  "boar": "boar.webp?v=9347dcf3",
  "tiger": "tiger.webp?v=b8988491",
  "bear": "bear.webp?v=86eccd29",
  "griffin": "griffin.webp?v=d24cc600"
};
class NamedPortraits{
  static of(key){return Object.hasOwn(NAMED_PORTRAITS,key)?'art/portrait/game/'+NAMED_PORTRAITS[key]:''}
  static lord(l){
    const art=this.of(l.name);if(art)return art;
    const key=l.name||l.id||'lord';let h=2166136261;for(const c of key)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
    return spritePic('lord:'+key,()=>{const L=lookOf(lordUnit(l),0,false,h%6);
      return peopleSprite({...L,mount:null,helm:['bare','cap','circlet','kettle'][(h>>>4)%4],hair:['brown','black','grey','ginger','blond'][(h>>>8)%5],weapon:null,shield:null},0)})
  }
}
const lordPic=l=>NamedPortraits.lord(l);
