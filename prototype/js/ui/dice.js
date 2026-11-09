'use strict';
/* ---------- the dice (the owner, 2026-11-09: "Can we add a cool dice animations when rolling something?") ----------
   A check you make (a bribe, a break-out, words with a lord, a road's chance, the roll to live) is shown as it falls: two dice
   roll onto the board and land on your roll (a hundred: the tens die and the ones die, 00 and 0 a hundred), the bar under them
   the odds you had (won at or under the mark; won in part, the amber beyond it), then what came of it. Only the showing: the
   roll is the check's own draw (Dice.check draws it once, as the check did; Dice.show shows one already drawn), so no stream, no
   fingerprint moves.
   The dice ("Can we have a dice like this?", a photo of light wooden polyhedrals, 2026-11-09): ten-sided (D10), light haldu
   wood with its fine grain, the numbers burnt in, drawn on a canvas in 3D (lit faces, the grain turning with them), thrown in
   from the left, hopping and rolling, coming to rest each with its number to you. Never a draw of the game's: their tumble
   comes from the roll. DICE: on; tumble, how long they roll (ms); hold, how long the result stays; die, their look and throw.
   Reduced motion (the system's): the dice at rest, still. A click dismisses it; a new roll replaces it. The overlay is over the
   screen, not in the window: no page's content changes ---------- */
const DICE={on:true,tumble:1000,hold:1400,
  // (r a die's size, px; gap between the two; h the canvas's height; lag the tens die thrown after the ones (ms), the ones ahead; spin its turns;
  // hop how high it bounces (px); tilt and roll how it rests (radians); far the eye's distance (perspective); wood light to dark;
  // ink and scorch the burnt numbers; light where the light comes from)
  die:{r:30,gap:18,h:112,lag:110,spin:[2.4,2.9],hop:22,tilt:-.5,roll:[.2,-.16],far:5,
    wood:[[242,206,152],[226,178,118],[204,148,90]],ink:'rgba(30,15,5,.92)',scorch:'rgba(120,60,18,.6)',light:[-.42,.62,.66]}};
// (vector helpers for the dice's solid)
const v3={add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  norm:a=>v3.mul(a,1/Math.hypot(a[0],a[1],a[2])),
  ap:(M,p)=>[M[0]*p[0]+M[1]*p[1]+M[2]*p[2],M[3]*p[0]+M[4]*p[1]+M[5]*p[2],M[6]*p[0]+M[7]*p[1]+M[8]*p[2]],
  mm:(A,B)=>{const C=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++)C.push(A[i*3]*B[j]+A[i*3+1]*B[3+j]+A[i*3+2]*B[6+j]);return C},
  rot:(ax,t)=>{const[x,y,z]=v3.norm(ax),c=Math.cos(t),s=Math.sin(t),k=1-c;return [c+x*x*k,x*y*k-z*s,x*z*k+y*s,y*x*k+z*s,c+y*y*k,y*z*k-x*s,z*x*k-y*s,z*y*k+x*s,c+z*z*k]}};
/* (the ten-sided die: two apexes and two rings of five, ten kites, each flat (its apex's height from the rings' by that); each face
   its number (opposite faces add to 9, odds round the top), its centre, where its number sits, and its frame: u to the right, v up
   towards its apex, n out of it) */
class D10{
  static get faces(){if(this.F)return this.F;const c=Math.cos(Math.PI/5),z=.13,H=z*(1+c)/(1-c),ring=(k,y)=>[Math.cos(k*Math.PI/5),y,Math.sin(k*Math.PI/5)];
    const T=[0,H,0],B=[0,-H,0],U=i=>ring(2*i,z),L=i=>ring(2*i+1,-z),top=[1,3,5,7,9],F=[];
    for(let i=0;i<5;i++){F.push({v:[T,U(i),L(i),U(i+1)],tip:T,low:L(i),d:top[i]});F.push({v:[B,L(i),U(i+1),L(i+1)],tip:B,low:U(i+1),d:9-top[(i+3)%5]})}
    for(const f of F){const m=v3.mul(f.v.reduce(v3.add),1/4);let n=v3.norm(v3.cross(v3.sub(f.v[1],f.v[0]),v3.sub(f.v[2],f.v[0])));if(v3.dot(n,m)<0){n=v3.mul(n,-1);f.v.reverse()}
      f.n=n;f.c=m;f.q=v3.add(v3.mul(m,.72),v3.mul(f.low,.28));const t=v3.sub(f.tip,f.q);f.fv=v3.norm(v3.sub(t,v3.mul(n,v3.dot(t,n))));f.fu=v3.cross(f.fv,n);f.g=(f.d*47)%180}
    return this.F=F}
  // (how it lies at rest with face d to you: its frame turned onto the eye's, then tipped back (tilt) and turned (roll))
  static rest(d,roll=0){const f=this.faces.find(o=>o.d===d),Ft=[...f.fu,...f.fv,...f.n],X=DICE.die.tilt,cx=Math.cos(X),sx=Math.sin(X),cz=Math.cos(roll),sz=Math.sin(roll);
    return v3.mm(v3.mm([1,0,0,0,cx,-sx,0,sx,cx],[cz,-sz,0,sz,cz,0,0,0,1]),Ft)}
  // (the face nearest the eye under a turn: the one read)
  static up(M){let b=null,z=-2;for(const f of this.faces){const n=v3.ap(M,f.n);if(n[2]>z){z=n[2];b=f}}return b.d}
}
class Dice{
  // (a chance p tried: drawn (draw: the check's own, Math.random unless given), shown, true when won)
  static check(p,label,draw=Math.random){const r=draw(),won=r<p;this.show({p,r,label});return won}
  /* (a roll already drawn, shown: p its odds, r the draw, label what it was for; part: the share beyond p that wins in part;
     won: what came of it when the check is its own (the roll to live: won is living)) */
  static show(o){if(!DICE.on||typeof document==='undefined'||!document.body)return;const s=this.face(o);setTimeout(()=>this.draw(s),0)}
  // (what the dice say: the number, the mark, what came of it; the number kept on the right side of the mark)
  static face({p,r,label,part=0}){const need=Math.max(0,Math.min(100,Math.round(p*100))),won=r<p,half=!won&&part>0&&r<p+part;
    let n=Math.min(100,Math.floor(r*100)+1);if(won&&n>need)n=Math.max(1,need);if(!won&&n<=need)n=Math.min(100,need+1);
    return {label,need,n,part:Math.round(Math.min(1,p+part)*100),res:won?'won':half?'part':'lost'}}
  // (a roll as the two dice read it: the tens and the ones; a hundred is 00 and 0)
  static pair(n){return [Math.floor(n%100/10),n%10]}
  static draw(s){this.clear();const quiet=matchMedia('(prefers-reduced-motion: reduce)').matches,W={won:'Success',part:'In part',lost:'Failed'}[s.res];
    const el=document.createElement('div');el.className='dice-ov'+(quiet?' quiet':'');el.setAttribute('role','status');el.setAttribute('aria-live','polite');
    el.innerHTML='<div class="dice-card dice-'+s.res+'">'+(s.label?'<div class="dice-lab">'+s.label+'</div>':'')+
      '<canvas class="dice-cv" aria-hidden="true"></canvas>'+
      '<div class="dice-bar"><b style="width:'+s.need+'%"></b>'+(s.part>s.need?'<u style="left:'+s.need+'%;width:'+(s.part-s.need)+'%"></u>':'')+'<em style="left:'+s.n+'%"></em></div>'+
      '<div class="dice-res"><span>Rolled '+s.n+' · needed '+s.need+' or less'+(s.part>s.need?' ('+s.part+' in part)':'')+'</span><strong>'+W+'</strong></div></div>';
    el.style.setProperty('--tumble',(quiet?0:DICE.tumble)+'ms');el.addEventListener('click',()=>this.clear());document.body.appendChild(el);this.el=el;
    this.roll(el.querySelector('.dice-cv'),s.n,quiet);this.timer=setTimeout(()=>this.clear(),(quiet?0:DICE.tumble)+DICE.hold+300)}
  static clear(){clearTimeout(this.timer);cancelAnimationFrame(this.raf);if(this.el)this.el.remove();this.el=null}
  // (the throw: each die from the left, hopping lower each time, its turns running out as it comes to rest on its number)
  static roll(cv,n,quiet){const D=DICE.die,dpr=Math.min(2,window.devicePixelRatio||1),w=cv.clientWidth||200,h=D.h,x=cv.getContext('2d');if(!x)return;
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);const ds=this.pair(n).map((d,k)=>({d,k,rest:D10.rest(d,D.roll[k]),ax:[.3+.1*((n+k)%3),k?-.4:.35,1],
      at:w/2+(k?1:-1)*(D.r+D.gap/2),spin:D.spin[k]+((n*7+k*3)%5)*.08})),t0=performance.now(),T=quiet?0:DICE.tumble;
    const frame=now=>{if(!cv.isConnected)return;x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);
      for(const o of ds){const t=T?Math.max(0,Math.min(1,(now-t0-(1-o.k)*D.lag)/(T-D.lag))):1,e=1-Math.pow(1-t,2.4),
          lift=D.hop*Math.abs(Math.cos(2.5*Math.PI*t))*Math.pow(1-t,1.6),M=t<1?v3.mm(v3.rot(o.ax,o.spin*2*Math.PI*Math.pow(1-t,2.2)),o.rest):o.rest;
        this.paint(x,o.at-(1-e)*(o.at+D.r*1.6),h/2+4-lift,lift,M,!o.k)}
      if(T&&now-t0<T+20)this.raf=requestAnimationFrame(frame)};
    frame(t0)}
  // (a die drawn: its shadow on the board, then the faces that look to you, each its wood, its light and its burnt number)
  static paint(x,cx,cy,lift,M,tens){const D=DICE.die,r=D.r,f=D.far,P=p=>{const q=v3.ap(M,p),k=f/(f-q[2]);return [cx+q[0]*r*k,cy-q[1]*r*k]},L=v3.norm(D.light);
    const g=x.createRadialGradient(cx+3,cy+r*1.02+lift,1,cx+3,cy+r*1.02+lift,r*1.15);g.addColorStop(0,'rgba(8,4,1,'+(.6-lift*.012)+')');g.addColorStop(1,'rgba(8,4,1,0)');
    x.save();x.fillStyle=g;x.translate(cx+3,cy+r*1.02+lift);x.scale(1,.32);x.translate(-cx-3,-(cy+r*1.02+lift));x.beginPath();x.arc(cx+3,cy+r*1.02+lift,r*1.15,0,7);x.fill();x.restore();
    const pat=x.createPattern(this.wood(),'repeat');
    for(const F of D10.faces){const n=v3.ap(M,F.n),c=v3.ap(M,F.c),see=v3.dot(n,v3.norm(v3.sub([0,0,f],c)));if(see<=0)continue;
      const pts=F.v.map(P),q=P(F.q),pu=P(v3.add(F.q,v3.mul(F.fu,.1))),pv=P(v3.add(F.q,v3.mul(F.fv,.1))),s=.1*r,A=[(pu[0]-q[0])/s,(pu[1]-q[1])/s,-(pv[0]-q[0])/s,-(pv[1]-q[1])/s,q[0],q[1]];
      x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();
      if(pat.setTransform)pat.setTransform(new DOMMatrix(A).rotate(F.g).scale(.5));x.fillStyle=pat;x.fill();
      const l=v3.dot(n,L),sh=l>0?.34*(1-l):.34+.3*Math.min(1,-l),hi=Math.pow(Math.max(0,v3.dot(v3.norm(v3.add(L,[0,0,1])),n)),14)*.38;
      x.fillStyle='rgba(70,32,8,'+sh.toFixed(3)+')';x.fill();if(hi>.01){x.fillStyle='rgba(255,246,226,'+hi.toFixed(3)+')';x.fill()}
      x.lineJoin='round';x.lineWidth=1.1;x.strokeStyle='rgba(255,232,196,'+(.16+.22*Math.max(0,l)).toFixed(3)+')';x.stroke();
      const a=Math.max(0,Math.min(1,(see-.12)/.3));if(a<=0)continue;
      const txt=tens?(F.d?F.d+'0':'00'):String(F.d);x.save();x.transform(...A);x.globalAlpha=a;
      x.font='700 '+Math.round(r*(tens?.5:.66))+'px "Trebuchet MS",Verdana,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';
      x.shadowColor=D.scorch;x.shadowBlur=2.2;x.fillStyle=D.ink;x.fillText(txt,0,0);
      if(!tens&&(F.d===6||F.d===9)){const m=x.measureText(txt).width;x.fillRect(-m/2,r*.27,m,r*.055)}x.restore()}}
  // (the haldu wood: a light, warm block with its fine straight grain and a few darker fibres; from a hash, never a draw)
  static wood(){if(this.W)return this.W;const S=128,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),im=g.createImageData(S,S),C=DICE.die.wood;
    const h=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)},nz=(t,p)=>{const i=Math.floor(t),u=t-i,a=h(((i%p)+p)%p),b=h((((i+1)%p)+p)%p),k=u*u*(3-2*u);return a+(b-a)*k};
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){const w=x+6*nz(y/16,8)+2.5*nz(y/5+3,26),ring=.5+.5*Math.sin(w*2*Math.PI*9/S+3*nz(y/32,4)),fib=h(x*7.3+Math.floor(y/3)*.01)>.93?.35:0;
      const k=Math.min(1,Math.pow(ring,4)*.7+fib+h(x*13+y*101)*.08),o=k<.5?k*2:(k-.5)*2,lo=k<.5?C[0]:C[1],hi=k<.5?C[1]:C[2],i=(y*S+x)*4;
      for(let j=0;j<3;j++)im.data[i+j]=lo[j]+(hi[j]-lo[j])*o;im.data[i+3]=255}
    g.putImageData(im,0,0);return this.W=c}
}
