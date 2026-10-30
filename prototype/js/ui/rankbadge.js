'use strict';
/* ---------- a group's rank badge (doc/RANKS_DESIGN.md §2): a pixel shield 12×13, its metal its tier (RANKS.metal, RANKS.col),
   a chevron for each rank; a peasants' plain iron. Drawn once a metal and rank, kept as an image (BADGES) ---------- */
const BADGES=new Map();
// (the shield: its row's inset from each side; a chevron: two rows, its pixels across)
const BADGE_SHAPE={w:12,h:13,inset:r=>r<8?0:r-7,chev:[[3,4,7,8],[4,5,6,7]]};
function badgeSrc(metal,rank){const key=metal+rank;if(BADGES.has(key))return BADGES.get(key);
  const S=BADGE_SHAPE,[face,shade,rim,mark]=RANKS.col[metal],c=document.createElement('canvas');c.width=S.w;c.height=S.h;const g=c.getContext('2d');
  for(let y=0;y<S.h;y++){const a=S.inset(y),b=S.w-1-S.inset(y);for(let x=a;x<=b;x++){g.fillStyle=x===a||x===b||y===0||y===S.h-1?rim:x<S.w/2?face:shade;g.fillRect(x,y,1,1)}}
  g.fillStyle=mark;for(let i=0;i<rank;i++)S.chev.forEach((xs,j)=>{for(const x of xs)g.fillRect(x,1+i*2+j,1,1)});
  const src=c.toDataURL();BADGES.set(key,src);return src}
// a kind's badge at a rank, size px wide: an image
function rankBadge(type,rank,size=14){const t=Math.min(3,Math.max(0,ST[type]?.tier||0)),metal=RANKS.metal[t],r=t?rank:0,
  tip=t?'Rank '+r+' of '+RANKS.max+' · '+cap1(metal)+' (tier '+t+')':'Peasants: no rank';
  return '<img class="rbadge" src="'+badgeSrc(metal,r)+'" width="'+size+'" height="'+Math.round(size*BADGE_SHAPE.h/BADGE_SHAPE.w)+'" alt="'+tip+'" title="'+tip+'">'}
// (a group's)
const groupBadge=(g,size)=>rankBadge(g.type,rankOf(g),size);
