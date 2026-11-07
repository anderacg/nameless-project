'use strict';
/* ---------- what a marching man carries on the map besides his kit (the owner, 2026-11-01): his army's flag and, after dark, a
   torch. A share of each group's men (MARCH_GEAR.flag, one at least) fly its colours (o.banner(): its field as sprites.js
   bannerSprite shades it, a small device): a spearman (a spear, a pike, a javelin, a lance: weapons.js POLE) on a longer spear
   of his own (MARCH_GEAR.pole), its cloth hung under its head and trailing behind him, never turned with the pole; anyone else on
   a short pole at his back (a sashimono), behind his body, riders too. After dark a share of the men with a free off hand (no
   shield; MARCH_GEAR.torch) hold a torch in it (the figure's free hand: people.js drawFigureBody), its light cast (render.js
   LIGHTQ); an army with no free hand lights one all the same. Who: by a hash of his marcher id, ranked within his group, so a man
   keeps his flag or torch as the army shares its places out again (never Math.random, nor the story's streams); the torches go to
   the men without a flag first. Each picture drawn once and kept (MARCH_FLAGS); a man off the screen shows none. march.js
   drawMarcher draws them: marchGear, then back before his body and front after it ---------- */
/* MARCH_GEAR, the one table. flags, torches: each on or off; flag, torch: the share of a group's men who carry one; pole: a
   flag's spear by the weapon it stands for, [the weapon it is drawn as, its length] (the flags themselves the battle's:
   BATTLE_BANNER); brand: the torch held [angle (degrees: 0 forward, -90 up), haft px]; light: its light's reach (px); fade: the
   darkness by which a torch is fully lit (it fades in as night falls, out before dawn); flutter: a flag's waves a second as he
   walks; cull: px past the screen's edge a man still shows his */
const MARCH_GEAR={flags:true,torches:true,flag:.2,torch:.2,pole:{spear:['spear',15],pike:['pike',18],javelin:['javelin',14],lance:['spear',18]},
  brand:[-104,5],light:14,fade:.25,flutter:3,cull:40};
// (a marcher id's hash: his rank in his group)
const marchHash=id=>{let h=Math.imul((id|0)^0x5bd1e995,0x9e3779b1);h^=h>>>15;h=Math.imul(h,0x85ebca6b);return(h^h>>>13)>>>0};
// (of a group's n men, the share s: rounded, one at least)
const gearShare=(n,s)=>n&&s>0?Math.max(1,Math.round(n*s)):0;
// (what a man carries, by his kind's look (people.js lookOf; his variant's skin, as march.js marchSprite draws him): pole, his
// weapon if it is one; free, his off hand empty (no shield; a rider's is never drawn); skin, his hand's; null for a beast)
function marchKit(u){const type=u.character?u.type.replace(/^comp_/,''):u.type,S=ST[type];if(S?.beast||S?.wildlife)return null;
  const hero=type==='hero',cid=COMPS[type]?type:'',L=lookOf(type,0,hero,hero||u.row==='leader'?0:u.id%6,cid,cid&&P.comps?.[type]?.gear||null);
  return{pole:POLE(L.weapon)?L.weapon:null,free:!shieldLook(L)||!!L.mount,skin:pal(L.skin)[1]}}
/* each man's part in his army (army.units: worked out again only when its men change (MarchArmy sync) or a share does): by group,
   his men ranked by marchHash; the first share of them flag men (no leader: a character's row), then the torches, the men with a
   free hand without a flag first; none in a beast's army. A map of man to {flag, pole, torch, kit} */
const MARCH_ROLES=new WeakMap();
function marchRoles(A){const G=MARCH_GEAR;let R=MARCH_ROLES.get(A.units);if(R&&R.flag===G.flag&&R.torch===G.torch)return R;R=new Map();R.flag=G.flag;R.torch=G.torch;MARCH_ROLES.set(A.units,R);
  if(A.owner.mapKind==='monster')return R;const groups=new Map();
  for(const u of A.units){const kit=!u.dead&&marchKit(u);if(!kit)continue;const g=groups.get(u.row);if(g)g.push(u);else groups.set(u.row,[u]);R.set(u,{flag:false,pole:null,torch:false,kit})}
  let lit=0;
  for(const men of groups.values()){men.sort((a,b)=>marchHash(a.id)-marchHash(b.id)||a.id-b.id);const nf=men[0].character?0:gearShare(men.length,G.flag);let nt=gearShare(men.length,G.torch);
    men.forEach((u,i)=>{if(i<nf){const r=R.get(u);r.flag=true;r.pole=r.kit.pole}});
    for(const pass of [false,true])for(const u of men){const r=R.get(u);if(nt>0&&r.kit.free&&!r.torch&&(pass||!r.flag)){r.torch=true;nt--;lit++}}}
  // (no free hand in it: its leader, else its first man, holds one by his shield)
  if(!lit&&G.torch>0){const u=A.units.find(u=>R.get(u)?.kit&&u.character)||[...R.keys()].sort((a,b)=>marchHash(a.id)-marchHash(b.id))[0];if(u)R.get(u).torch=true}
  return R}
/* the pictures, each drawn once and kept, outlined as the weapons are (weapons.js weaponSprite): a flag's cloth, a spearman's flag
   on his spear (by its angle's step, the army's banner, his skin, its wave), a back flag (by banner and wave) and a torch (by his
   skin and its flame's flicker) */
const MARCH_FLAGS=new Map();
// a spearman's flag (the owner, 2026-11-07: "align flags in all places"): the battle's (BATTLE_BANNER): his spear held as at the
// march (a doll's HOLD_DOLL.pole.march, else WPN_REST), BATTLE_BANNER.pole longer, its cloth (clothSprite) hung just under its
// head (poleTip); round his hand at the middle (R), as a weapon's: on the map (MarchKit) and in the army screen's previews alike
function poleFlagSprite(k,b,skin,f){const [kind]=MARCH_GEAR.pole[k]||['spear'],doll=DOLL_FIGS.on,deg=doll?HOLD_DOLL.pole.march:WPN_REST[kind]??-90,i=((Math.round(deg/360*WEAPON_STEPS))%WEAPON_STEPS+WEAPON_STEPS)%WEAPON_STEPS,
    key='fp'+kind+i+(doll?1:0)+b.k+b.col+b.dev+skin+f;let c=MARCH_FLAGS.get(key);if(c)return c;
  const w=weaponSprite(kind,'blue',skin,i,WPN[kind][0]+BATTLE_BANNER.pole,doll),[tx,ty]=poleTip(w),l=Math.hypot(tx,ty)||1,q=Math.max(0,l-2)/l,cl=clothSprite(b,f),R=w.R+cl.width+cl.height;
  c=mkc(2*R+1,2*R+1,g=>{g.drawImage(w,R-w.R,R-w.R);g.drawImage(cl,Math.round(R+tx*q)-cl.ax,Math.round(R+ty*q)-cl.ay)});c.R=R;MARCH_FLAGS.set(key,c);return c}
// a torch in his free hand: a short haft at MARCH_GEAR.brand's angle (a pixel line, its corners filled, as weapons.js drawBlade's),
// its pitch-wrapped head, the flame over it: as it burns (fire.js: frame f of FLAMES.frames, unoutlined, its tips trailing lean px
// as he walks), FLAMES off the old two frames (f 0, 1) swaying; round the hand at the middle (R); fx, fy: the flame's foot from the
// hand (its light: LIGHTQ)
const MARCH_FLAME=[[[0,-1,'#fff2a0'],[-1,-1,'#ffd24a'],[0,-2,'#ffd24a'],[-1,-2,'#ff7a30'],[0,-3,'#ff7a30']],[[0,-1,'#fff2a0'],[-1,-1,'#ffd24a'],[-1,-2,'#ffd24a'],[0,-2,'#ff7a30'],[-1,-3,'#ff7a30']]];
function torchSprite(skin,f,lean){const on=FLAMES.on,key=(on?'fT'+(lean|0)+',':'ft')+skin+f;let c=MARCH_FLAGS.get(key);if(c)return c;
  const [deg,n]=MARCH_GEAR.brand,R=n+4+(on?3:0),g=pgrid(2*R+1,2*R+1),a=deg*Math.PI/180,W=PPAL.wood;let q=null;
  for(let i=0;i<n;i++){const x=Math.round(R+Math.cos(a)*i),y=Math.round(R+Math.sin(a)*i);if(q&&q[0]!==x&&q[1]!==y)pset(g,q[0],y,W[2]);pset(g,x,y,i===n-1?'#3a2a1a':W[i<2?2:1]);q=[x,y]}
  if(!on)for(const [dx,dy,col] of MARCH_FLAME[f])pset(g,q[0]+dx,q[1]+dy,col);pset(g,R,R,skin);
  g.edge=true;poutline(g);c=pcanvas(g);if(on){const s=fireFlame('torch',f,lean);c.getContext('2d').drawImage(s.img,q[0]-s.ax,q[1]-s.ay)}
  c.R=R;c.fx=q[0]-R;c.fy=q[1]-1-R;MARCH_FLAGS.set(key,c);return c}
/* the gear a marcher shows this frame: one record, set again for each man (march.js drawMarcher: marchGear(u, o, x, y, sx), x, y
   his feet on the screen, sx his scale and the way he faces). bare: his spear drawn apart, with the flag on it (march.js
   marchSprite's bare body); back(s, bx, by) before his body, front(s, bx, by) after it, in drawMarcher's frame (s his sprite, bx,
   by its corner) */
class MarchKit{
  of(u,o,x,y,sx){this.u=u;this.x=x;this.y=y;this.sx=sx;this.flag=null;this.torch=0;this.bare=false;this.r=null;const G=MARCH_GEAR,m=G.cull;
    if(!(G.flags||G.torches)||x<-m||y<-m||x>VW+m||y>VH+m)return this;const A=MARCH_ARMIES.get(o),r=A&&marchRoles(A).get(u);if(!r)return this;this.r=r;
    if(r.flag&&G.flags){const b=o.banner?.();if(b&&typeof b==='object'){this.flag=b;this.bare=!!r.pole}}
    if(r.torch&&G.torches&&Clock.isNight)this.torch=Math.min(1,Clock.darkness()/G.fade);return this}
  // (a flag's wave: still while he stands, MARCH_GEAR.flutter a second as he walks)
  wave(){return this.u.walking?Math.floor((this.u.stepT||0)*MARCH_GEAR.flutter)%2:0}
  // (the same flags as in battle (the owner, 2026-11-07: "the same sprites", "check the flags"): the battle's back pole and banner
  // (battleBackFlag); a flag man's own spear drawn as in battle, a doll's hold and BATTLE_BANNER.pole longer, its cloth under its
  // head (clothSprite, poleTip))
  back(s,bx,by){if(!this.flag||this.bare||!s.back)return;const c=battleBackFlag(this.flag,this.wave());ctx.drawImage(c,bx+s.back[0]-c.ax,by+s.back[1]-c.ay)}
  front(s,bx,by){
    if(this.bare&&s.hand){const c=poleFlagSprite(this.r.pole,this.flag,this.r.kit.skin,this.wave());ctx.drawImage(c,bx+s.hand[0]-c.R,by+s.hand[1]-c.R)}
    // (its torch: as it burns, its frame by the clock and his id (fire.js fireFrameAt), its flame trailing back as he walks; its
    // light at the flame's foot, with its pool on the ground at his feet (g))
    if(this.torch>0&&s.free){const on=FLAMES.on,c=on?torchSprite(this.r.kit.skin,fireFrameAt(fireTime(),this.u.id),this.u.walking?-FLAMES.lean:0):torchSprite(this.r.kit.skin,Math.floor(performance.now()/120+this.u.id)%2),a=ctx.globalAlpha,hx=bx+s.free[0],hy=by+s.free[1];
      ctx.globalAlpha=a*this.torch;ctx.drawImage(c,hx-c.R,hy-c.R);ctx.globalAlpha=a;
      const L={x:Math.round(this.x+this.sx*(hx+c.fx)),y:Math.round(this.y+Math.abs(this.sx)*(hy+c.fy)),r:MARCH_GEAR.light};if(on){L.id=this.u.id;L.g=Math.max(0,this.y-L.y)}LIGHTQ.push(L)}}
}
const MARCH_KIT=new MarchKit();
const marchGear=(u,o,x,y,sx)=>MARCH_KIT.of(u,o,x,y,sx);
/* ---------- the same flags in battle (the owner, 2026-11-01: "the flag should be at the battle as well?"): a share of each group's
   men (MARCH_GEAR.flag, one at least, ranked by the same hash of their ids) fly their own army's colours (u.sourceArmy's banner;
   yours, P's): a spearman's cloth hung under his spear's head as he holds it, levelled or upright (weapons.js heldNow), none while
   his spear is out of his hand; anyone else's at his back. Drawing only: no morale. None for a character, a beast, nor a side of
   no army (the lab's foes; its other side yours). render.js drawUnit draws them: battleFlagBack before his body, battleFlagFront after his weapon ---------- */
const BATTLE_FLAGS=new WeakMap();
// (his army's banner if he is one of his group's flag men, else null; the group's flag men picked once, its men as they first stood)
function battleFlag(u){if(!MARCH_GEAR.flags||!B||u.hero||u.comp||u.leader)return null;const g=B.groups[u.grp];if(!g)return null;let F=BATTLE_FLAGS.get(g);
  if(!F||F.share!==MARCH_GEAR.flag){F=new Set();F.share=MARCH_GEAR.flag;BATTLE_FLAGS.set(g,F);
    const men=B.units.filter(v=>v.grp===u.grp&&!v.hero&&!v.comp&&!v.leader&&!ST[v.type]?.beast&&!ST[v.type]?.wildlife).sort((a,b)=>marchHash(a.id)-marchHash(b.id)||a.id-b.id);
    men.slice(0,gearShare(men.length,MARCH_GEAR.flag)).forEach(v=>F.add(v))}
  if(!F.has(u))return null;const o=u.sourceArmy||(u.team===0&&!u.lord?P:null),b=o?.banner?.();return b&&typeof b==='object'?b:null}
/* the battle's flags (the owner, 2026-11-07: "a flag attached to some units, not too square and big enough to be distinctive"): the
   army cards' banner in small (sprites.js bannerCloth): a swallow-tailed banner, a rag, a pennant, its folds lit, its fly waving, the
   army's device in its middle; cloth: each shape's [w, h]; fold, fly: its folds and where its fly begins to wave; notch: its
   swallow tail's cut; back: a back
   flag's pole (h px, up: its foot under his shoulders), tall enough that the cloth flies over his head; pole: how much longer a flag
   man's spear is drawn, so his cloth flies over his head too (drawing only: his reach is his spear's) */
const BATTLE_BANNER={cloth:{banner:[10,8],rag:[10,8],pennant:[11,7],trade:[7,4]},fold:1.2,fly:6,notch:2,back:{h:22,up:3},pole:7};
// (a flag's cloth alone, hung from (ax, ay) by its first column, trailing back to the left: a spear's in battle)
function clothSprite(b,f){const key='fc'+b.k+b.col+b.dev+f;let c=MARCH_FLAGS.get(key);if(c)return c;const Q=BATTLE_BANNER,[cw,ch]=Q.cloth[b.k]||Q.cloth.banner,g=pgrid(cw+2,ch+4);
  bannerCloth((x,y,c)=>pset(g,x,y,c),cw,2,b,f,Q.cloth,-1,Q);g.edge=true;poutline(g);c=pcanvas(g);c.ax=cw+1;c.ay=2;MARCH_FLAGS.set(key,c);return c}
// (a flag at his back in battle: a tall pole up from under his shoulders, a gilt knob atop, the banner hung under it; ax, ay: the
// shoulders' point)
function battleBackFlag(b,f){const key='fB'+b.k+b.col+b.dev+f;let c=MARCH_FLAGS.get(key);if(c)return c;
  const Q=BATTLE_BANNER,{h,up}=Q.back,[cw]=Q.cloth[b.k]||Q.cloth.banner,g=pgrid(cw+3,h+4),x=cw+1,W=PPAL.wood;
  for(let y=2;y<=h+1;y++)pset(g,x,y,W[y>h-2?2:1]);pset(g,x,1,PPAL.gold[1]);pset(g,x,0,PPAL.gold[0]);bannerCloth((X,Y,c)=>pset(g,X,Y,c),x-1,3,b,f,Q.cloth,-1,Q);
  g.edge=true;poutline(g);c=pcanvas(g);c.ax=x;c.ay=h+1-up;MARCH_FLAGS.set(key,c);return c}
// (its wave: still while he stands, MARCH_GEAR.flutter a second as he moves)
const battleWave=(u,moved)=>moved?Math.floor(B.t*MARCH_GEAR.flutter+(u.id||0)*.37)%2:0;
// (in drawUnit's frame: X, Y his sprite's corner; a spearman's flag is on his spear (battleFlagFront), not his back)
function battleFlagBack(u,b,sp,X,Y,f){if(!sp.back||POLE(heldWeapon(unitLook(u))))return;const c=battleBackFlag(b,f);ctx.drawImage(c,X+sp.back[0]-c.ax,Y+sp.back[1]-c.ay)}
// (the cloth hung just under the spear's head, found on the spear's own picture (poleTip): whatever its length and
// however it is drawn, thin or not, it hangs on the shaft (the owner, 2026-11-07: "the spear still has no flag attached"))
function battleFlagFront(u,b,hw,X,Y,f){if(!hw||!POLE(hw.k))return;const [tx,ty]=poleTip(hw.w),l=Math.hypot(tx,ty)||1,k=Math.max(0,l-2)/l,c=clothSprite(b,f);
  ctx.drawImage(c,Math.round(X+hw.x+hw.w.R+tx*k)-c.ax,Math.round(Y+hw.y+hw.w.R+ty*k)-c.ay)}
// (a weapon picture's tip: its pixel farthest from the hand at its middle (R), kept on the picture)
function poleTip(w){if(w.tip)return w.tip;const R=w.R,d=w.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w.width,w.height).data;let best=0,tip=[0,-1];
  for(let y=0;y<w.height;y++)for(let x=0;x<w.width;x++)if(d[(y*w.width+x)*4+3]){const r=Math.hypot(x-R,y-R);if(r>best){best=r;tip=[x-R,y-R]}}return w.tip=tip}
