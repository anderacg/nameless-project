'use strict';
/* ---------- defence: a melee blow met where he stands (the owner, 2026-10-29: battles about 1.5 times as long, each man blocking,
   parrying or dodging in his stance; no words over him, only the look). A blow of a troop, a character or your hero is rolled
   against the man it is aimed at; stopped, it does nothing. His chance: base, his tier past the first (tier each), less the
   attacker's (att each), a shield toward the blow (shield: not on a mount), by the side it comes from (side), tired less, spent
   less again, a big one's blow less (big), at most cap. How: a shield toward it, a block; else, lightly armoured, now and then a
   dodge (a lean back on the spot: never a roll, which stays your hero's and the champions' own); else a parry with his weapon.
   Never stopped: a hard attack, a combo's finisher, a charge's blow (chargeMul past charge), a shove or bash, an ability, a
   missile (a shield's front already turns those: matchups.js); nor a blow at your hero (yours to block) but with duels on
   (battle/duel.js: theirs as everyone's, your block on top), a man down, stunned,
   routing or winding up a hard blow. Beasts have no stance: the big ones never defend, the rest dodge now and then (beast).
   on: false, every blow lands as before (tests/harness.js turns it off for the older suites, whose fingerprints it would move;
   tests/defence.js turns it on) ---------- */
const DEFENCE={on:true,base:.22,tier:.04,att:.03,shield:.1,side:{front:1,flank:.55,rear:.1},tired:.8,spent:.6,big:.5,cap:.6,
  light:.35,// (lightly armoured (no mail or plate): this share of his stops are dodges)
  beast:.12,charge:1.05,anim:.3,
  // (the auto-resolve's reckoning (engage.js power): his chance from the front against a first-tier man, × this for the sides)
  expect:.8};
const Defence={
  // (a soldier's tier is his kind's; a character's, your hero's, a veteran's)
  tier(u){return u.s.tier||(u.hero||isFighter(u)?3:1)},
  shieldOf(s){return tagsOf(s).includes('shield')&&!s.mounted},
  // (his chance against a blow from att, and from which side: 0 when he cannot meet it)
  chance(att,t){const D=DEFENCE,s=t.s;
    if(!D.on||t.hero&&!DUEL.on||t.hp<=0||t.rout||t.stun>0||t.wind||physDownPose(t)!=null||s.big)return 0;
    const side=sideOf(t,att),T=tiredMul(t).dmg;
    let p=s.beast?D.beast:D.base+D.tier*(this.tier(t)-1)+(side==='front'&&this.shieldOf(s)?D.shield:0);
    p=(p-D.att*(this.tier(att)-1))*D.side[side]*(T<.8?D.spent:T<1?D.tired:1)*(att.s.big?D.big:1);
    return clamp(Duel.mod(att,t,p),0,Duel.cap(att,t))},// (in a duel: battle/duel.js)
  // (is a blow from att stopped by t? If so, how (block, parry, dodge), shown on him: none of it lands)
  stops(att,t){const p=this.chance(att,t);if(!(p>0)||Math.random()>=p)return null;const s=t.s;
    const k=s.beast?'dodge':sideOf(t,att)==='front'&&this.shieldOf(s)?'block':!heldWeapon(unitLook(t))||!/^(mail|plate)$/.test(armorOf(s))&&Math.random()<DEFENCE.light?'dodge':'parry';
    this.show(att,t,k);return k},
  // (his look while it lasts: defAt, defK, the way he turns to meet it (defFace: drawn only); a spark or dust where it met, its sound)
  show(att,t,k){t.defAt=B.t;t.defK=k;t.defFace=att.x>=t.x?1:-1;
    const mx=(att.x+t.x)/2,my=Math.min(att.y,t.y)-7;
    if(k==='dodge')fx(t.x,t.y,'#a89a78',2);else fx(mx,my,k==='block'?'#e8d8b0':'#fff2c0',3);
    if(k!=='dodge'&&sfxOn()){const q=k==='block'?'block':'clash';if(sndTurn(q))sfxAt(q,t.x,t.y)}Duel.shown(att,t,k)},
  // (meeting a blow now: its kind, else null)
  now(u){return u.defAt!=null&&B.t-u.defAt<DEFENCE.anim?u.defK:null},
  // (his expected share of blows stopped, for the auto-resolve: engage.js power)
  expect(s){const D=DEFENCE;if(!D.on||s.big)return 0;return s.beast?D.beast:(D.base+D.tier*((s.tier||3)-1)+(this.shieldOf(s)?D.shield:0))*D.expect}
};
