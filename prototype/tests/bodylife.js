'use strict';
// Livelier bodies (people.js BLOW_RIG, NUDGE; vfx.js FALLS; herofx.js spinFace; render.js BODY_LIFE; the owner, 2026-10-30: "more
// realistic body compositions"): each blow frame his own body (turned into it, the fist carrying the weapon), a pole's swing a
// thrust, a rider's blows his standing body still; struck, a flinch; standing about, a glance back and the weight shifted; three
// ways to fall, the weapon flung; a spin turning him round. All drawn only.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),random=Math.random;try{
 const px=s=>Array.from(s.getContext('2d').getImageData(0,0,s.width,s.height).data).join(),spr=(ty,p)=>t.unitSprite(ty,0,false,0,p,true);
 L.start({leftGroups:[{type:'militia',count:2}],rightGroups:[{type:'militia',count:2}],morale:false,deploy:false,paused:true,ai:false,seed:4});const B=t.B,u=B.units[0];
 // ======== a blow: nine frames of the body
 {const st=px(spr('militia',0)),fr=[6,7,8,9,10,11,12,13,14].map(p=>spr('militia',p)),dif=new Set(fr.map(px));
  ok(fr.every(s=>px(s)!==st)&&dif.size>=8,'a swordsman\'s nine blow frames each his own body ('+dif.size+' different), none the standing one');
  ok(fr.every(s=>s.rig&&s.hand)&&fr[0].hand.join()!==fr[1].hand.join()&&fr[6].hand[1]<fr[8].hand[1],'his fist carries the weapon: back in the wind-up, forward in the strike, high for the chop and low after ('+fr[6].hand+' → '+fr[8].hand+')');
  ok(!spr('militia',0).rig,'standing, his weapon in the hand as before')}
 ok([6,7,8].every(p=>px(spr('hum_levy',p))===px(spr('hum_levy',p+3))),'a spearman\'s swing is a thrust from the hips');
 ok(px(spr('chief',7))!==px(spr('militia',7)),'a two-handed axe: both hands on it');
 {const r=[0,6,7,8].map(p=>px(spr('horse',p)));ok(r[1]===r[0]&&r[2]===r[0],'a rider\'s blows: his body as it stands (his mount is not rigged)')}
 // ======== the small life: struck, glancing, shifting
 {const st=px(spr('militia',0));ok([t.FLINCH_POSE,t.LOOK_POSE,t.SHIFT_POSE].every(p=>px(spr('militia',p))!==st),'struck, a flinch; standing, a glance back and the weight shifted: each its own frame');
  ok(spr('militia',t.FLINCH_POSE).rig&&spr('militia',t.SHIFT_POSE).hand[0]===spr('militia',0).hand[0]-1,'the weapon stays in his hand as he moves (the shift: his hand a pixel back)')}
 // ======== standing about (the owner, 2026-10-31: idle animation, "breathing + fidgets"): everyone breathes, a px up part of the
 // time, each at his own; on foot a glance and a shift; a horse tosses its head; a beast sways
 {const L=t.idleLife,ts=[...Array(200)].map((_,i)=>i*.05),share=(id,k)=>ts.filter(x=>L(id,x,k).dy<0).length/ts.length,flat=k=>ts.map(x=>L(7,x,k).dx);
  ok(share(1,'foot')>.3&&share(1,'foot')<.6&&ts.some(x=>L(1,x,'foot').dy!==L(2,x,'foot').dy),'breathing: a px up '+Math.round(share(1,'foot')*100)+'% of the time, two men not in step');
  const P0=[...Array(400)].map((_,i)=>L(3,i*.25,'foot').pose);ok(P0.includes(t.LOOK_POSE)&&P0.includes(t.SHIFT_POSE)&&[...Array(400)].every((_,i)=>L(3,i*.25,'mount').pose==null),'on foot now and then a glance and a shift; a rider keeps his seat');
  ok(flat('mount').some(d=>d===1)&&new Set(flat('beast')).size>=3&&flat('foot').every(d=>d===0),'a horse tosses its head, a beast sways, a man on foot keeps his place')}
 // ======== three ways to fall, the weapon flung
 {const S0=t.corpseOf(u),seen=new Set();for(let x=0;x<9;x++)seen.add(t.fallOf({x,y:0}));ok(seen.size===3,'three ways to fall, by where he lies: '+[...seen].join(', '));
  const g=document.createElement('canvas').getContext('2d');let bad=0,n=0;Math.random=()=>{n++;return random()};
  for(const how of ['over','back','knees'])for(const q of [0,.3,.6,.9,1]){try{t.drawBody(g,{sp:S0,x:20,y:20,face:1,td:0,dry:true,pool:6,seed:0,wi:3,wx:7,wy:2,skin:t.PPAL.wood[2],fall:how},q,0)}catch(e){bad++}}
  Math.random=random;ok(!bad&&!n,'each drawn through its fall, his weapon flying, with no random draw')}
 // ======== a spin: turned round, then back
 {const m=t.stateMark(u);m.spin=B.t;const fs=[];for(let i=0;i<6;i++){B.t+=t.SPIN.t/6;fs.push(t.spinFace(u,1))}B.t+=1;
  ok(fs.includes(-1)&&fs.includes(1)&&t.spinFace(u,1)===1,'a spin turns him round and back ('+fs.join(' ')+'), then he faces as before');
  t.battleEvent('cast',{u,id:'whirl',st:{}});ok(t.STATE_MARKS.get(u).spin===B.t,'Whirlwind spins him')}
 // ======== in a frame: struck and standing men drawn
 {B.units[1].hitAt=B.t;const snap=()=>JSON.stringify(B.units.map(x=>[x.x,x.y,x.hp,x.cd])),s0=snap();for(let i=0;i<5;i++){B.t+=1/60;t.drawBattle()}ok(!ERR.length&&snap()===s0,'a frame with a struck man draws, and changes nothing in the fight')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=random;if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
