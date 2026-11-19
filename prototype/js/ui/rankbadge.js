'use strict';
/* ---------- a group's rank badge (doc/RANKS_DESIGN.md §2): a painted metal shield 12×13, steel, or its mastery's metal (bronze, silver,
   gold: RANKS.mastery.metal, RANKS.col), a chevron for each rank; a peasants' plain iron. Drawn once a metal and rank, kept as an image (BADGES) ---------- */
const BADGES=new Map();
// Logical size stays the same; the shaded source is eight times larger.
const BADGE_SHAPE={w:12,h:13};
function badgeSrc(metal,rank){const key=metal+rank;if(BADGES.has(key))return BADGES.get(key);
 const [face,shade,rim,mark]=RANKS.col[metal],c=document.createElement('canvas');c.width=96;c.height=104;const g=c.getContext('2d');g.scale(8,8);
 const p=new Path2D('M1 .8Q6 -.1 11 .8L10.8 7.5Q10.2 10.4 6 12.3Q1.8 10.4 1.2 7.5Z'),light=g.createLinearGradient(1,0,11,13);light.addColorStop(0,mark);light.addColorStop(.3,face);light.addColorStop(.72,shade);light.addColorStop(1,rim);
 g.fillStyle=light;g.fill(p);g.strokeStyle=rim;g.lineWidth=.7;g.stroke(p);g.save();g.clip(p);g.strokeStyle=mark;g.lineWidth=.65;g.lineJoin='round';
 for(let i=0;i<rank;i++){const y=2+i*1.6;g.beginPath();g.moveTo(3,y);g.lineTo(6,y+1.3);g.lineTo(9,y);g.stroke()}g.restore();
 const src=c.toDataURL();BADGES.set(key,src);return src}
// a kind's badge at a rank and mastery (0 none: steel; 1 to 3: RANKS.mastery.metal), size px wide: an image
function rankBadge(type,rank,size=14,mastery=0){const peasant=rankPeasant(type),metal=peasant?'iron':mastery?RANKS.mastery.metal[mastery-1]:'steel',r=peasant?0:rank,
  tip=peasant?'Peasants: no rank':'Rank '+r+' of '+RANKS.max+(rankWord(r)?' ('+rankWord(r)+')':'')+(mastery?', '+(masteryWord(mastery)||cap1(metal)+' mastery'):'');// (the ranks' and masteries' names: core/ranks.js)
  return '<img class="rbadge" src="'+badgeSrc(metal,r)+'" width="'+size+'" height="'+Math.round(size*BADGE_SHAPE.h/BADGE_SHAPE.w)+'" alt="'+tip+'" title="'+tip+'">'}
// (a group's)
const groupBadge=(g,size)=>rankBadge(g.type,rankOf(g),size,masteryOf(g));
