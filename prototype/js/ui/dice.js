'use strict';
/* ---------- the dice (the owner, 2026-11-09: "Can we add a cool dice animations when rolling something?") ----------
   A check you make (a bribe, a break-out, words with a lord, a road's chance, the roll to live) is shown as it falls, by the d20's
   rules (the owner: "Use d20 rules for the dice"): a twenty-sided die rolls onto the board, your bonus (what your skills add to the
   chance, 5% a point) is added, and you win on its DC or over; a natural 20 always wins, a natural 1 always fails. The bar under
   it the faces you needed (green, the win from the mark up; amber, won in part just under it), then what came of it.
   Only the showing: the chance is the check's own, and the roll its one draw (Dice.check draws it once, as the check did;
   Dice.show shows one already drawn), so no stream, no fingerprint moves. The die reads it in twentieths: the face you needed
   is 21 less your chance's faces (kept to 2..20, so a 1 can always fail and a 20 always win), and the face shown is kept on the
   side of it that the draw fell (a draw at the edge of a twentieth: the face beside it).
   The die ("Can we have a dice like this?", a photo of light wooden polyhedrals): light haldu wood with its fine grain, the
   numbers burnt in, drawn on a canvas in 3D (lit faces, the grain turning with them), thrown in from the left, hopping and
   rolling, coming to rest with its number to you. Never a draw of the game's: its tumble comes from the roll. DICE: on; tumble,
   how long it rolls (ms); die, its look and throw. Reduced motion (the system's): the die at rest, still. It stays till you close
   it (the owner: "Please wait the player to close the panel, dont auto close"): Continue, a click anywhere, Enter, Space or Esc
   (ui/input.js: while it is up no other key reaches the game); a new roll replaces it. The overlay is over the screen, not in the
   window ---------- */
const DICE={on:true,tumble:1000,
  // (r the die's size, px; h the canvas's height; spin its turns; hop how high it bounces (px); tilt and roll how it rests
  // (radians); far the eye's distance (perspective); wood light to dark; ink and scorch the burnt numbers; light where it comes from)
  die:{r:40,h:120,spin:2.7,hop:22,tilt:-.26,roll:.14,far:5,
    wood:[[242,206,152],[226,178,118],[204,148,90]],ink:'rgba(30,15,5,.92)',scorch:'rgba(120,60,18,.6)',light:[-.42,.62,.66]}};
// (vector helpers for the dice's solid)
const v3={add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  norm:a=>v3.mul(a,1/Math.hypot(a[0],a[1],a[2])),
  ap:(M,p)=>[M[0]*p[0]+M[1]*p[1]+M[2]*p[2],M[3]*p[0]+M[4]*p[1]+M[5]*p[2],M[6]*p[0]+M[7]*p[1]+M[8]*p[2]],
  mm:(A,B)=>{const C=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++)C.push(A[i*3]*B[j]+A[i*3+1]*B[3+j]+A[i*3+2]*B[6+j]);return C},
  rot:(ax,t)=>{const[x,y,z]=v3.norm(ax),c=Math.cos(t),s=Math.sin(t),k=1-c;return [c+x*x*k,x*y*k-z*s,x*z*k+y*s,y*x*k+z*s,c+y*y*k,y*z*k-x*s,z*x*k-y*s,z*y*k+x*s,c+z*z*k]}};
/* (the twenty-sided die: twelve corners (0, ±1, ±φ and their turns), twenty flat triangles; each face its number (opposite faces
   add to 21, the high numbers on one side), its centre (where its number sits) and its frame: u to the right, v up towards its
   top corner, n out of it) */
class D20{
  static get faces(){if(this.F)return this.F;const g=(1+Math.sqrt(5))/2,V=[];for(const a of[-1,1])for(const b of[-g,g])V.push([0,a,b],[a,b,0],[b,0,a]);
    const C=V.map(v3.norm),e=Math.hypot(...v3.sub(C[0],C.find((c,i)=>i&&v3.dot(c,C[0])>.4))),near=(i,j)=>Math.abs(Math.hypot(...v3.sub(C[i],C[j]))-e)<1e-6,F=[];
    for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)for(let k=j+1;k<12;k++)if(near(i,j)&&near(j,k)&&near(i,k))F.push({v:[C[i],C[j],C[k]]});
    for(const f of F){const m=v3.mul(f.v.reduce(v3.add),1/3);let n=v3.norm(v3.cross(v3.sub(f.v[1],f.v[0]),v3.sub(f.v[2],f.v[0])));if(v3.dot(n,m)<0){n=v3.mul(n,-1);f.v.reverse()}
      f.n=n;f.c=m;f.q=m;const top=f.v.reduce((a,b)=>b[1]+.01*b[0]>a[1]+.01*a[0]?b:a),t=v3.sub(top,m);f.fv=v3.norm(v3.sub(t,v3.mul(n,v3.dot(t,n))));f.fu=v3.cross(f.fv,n);f.g=(F.indexOf(f)*47)%180}
    const k=[.31,.88,.12],hi=F.filter(f=>v3.dot(f.n,k)>0).sort((a,b)=>v3.dot(b.n,k)-v3.dot(a.n,k)||Math.atan2(a.n[2],a.n[0])-Math.atan2(b.n[2],b.n[0]));
    hi.forEach((f,i)=>{f.d=20-i;F.find(o=>v3.dot(o.n,f.n)<-.999).d=1+i});return this.F=F}
  // (how it lies at rest with face d to you: its frame turned onto the eye's, then tipped back (tilt) and turned (roll))
  static rest(d,roll=0){const f=this.faces.find(o=>o.d===d),Ft=[...f.fu,...f.fv,...f.n],X=DICE.die.tilt,cx=Math.cos(X),sx=Math.sin(X),cz=Math.cos(roll),sz=Math.sin(roll);
    return v3.mm(v3.mm([1,0,0,0,cx,-sx,0,sx,cx],[cz,-sz,0,sz,cz,0,0,0,1]),Ft)}
  // (the face nearest the eye under a turn: the one read)
  static up(M){let b=null,z=-2;for(const f of this.faces){const n=v3.ap(M,f.n);if(n[2]>z){z=n[2];b=f}}return b.d}
}
class Dice{
  /* (a chance p tried: drawn (draw: the check's own, Math.random unless given), shown, true when won; bonus: the share of p your
     skills give, shown as the die's bonus) */
  static check(p,label,draw=Math.random,bonus=0){const r=draw(),won=r<p;this.show({p,r,label,bonus});return won}
  /* (a roll already drawn, shown: p its odds, r the draw, label what it was for; part: the share beyond p that wins in part;
     bonus: your skills' share of p) */
  static show(o){if(!DICE.on||typeof document==='undefined'||!document.body)return;const s=this.face(o);setTimeout(()=>this.draw(s),0)}
  /* (what the die says: need the face you needed (won on it or over), low the lowest that wins in part, n the face rolled (kept on
     the right side of both), b your bonus (a point each 5%), dc what the roll and bonus had to make) */
  static face({p,r,label,part=0,bonus=0}){const F=v=>Math.round(Math.max(0,Math.min(1,v))*20),need=Math.max(2,Math.min(20,21-F(p))),won=r<p,half=!won&&part>0&&r<p+part;
    let low=part>0?Math.max(2,Math.min(need,21-F(p+part))):need;if(half&&low===need)low=need-1;
    let n=20-Math.min(19,Math.floor(Math.max(0,r)*20));n=won?Math.max(n,need):half?Math.max(low,Math.min(need-1,n)):Math.min(n,low-1);
    const b=Math.max(0,Math.round(bonus*20));return {label,need,low,n,b,dc:need+b,pct:Math.round(Math.max(0,Math.min(1,p))*100),res:won?'won':half?'part':'lost'}}
  static draw(s){this.clear();const quiet=matchMedia('(prefers-reduced-motion: reduce)').matches,W={won:'Success',part:'In part',lost:'Failed'}[s.res],pc=v=>(v-1)*5+'%';
    const nat=s.n===20&&s.res==='won'?'A natural 20!':s.n===1&&s.res==='lost'?'A natural 1':'';
    const el=document.createElement('div');el.className='dice-ov'+(quiet?' quiet':'');el.setAttribute('role','status');el.setAttribute('aria-live','polite');
    el.innerHTML='<div class="dice-card dice-'+s.res+'">'+(s.label?'<div class="dice-lab">'+s.label+'</div>':'')+
      '<canvas class="dice-cv" aria-hidden="true"></canvas>'+
      '<div class="dice-bar"><b style="left:'+pc(s.need)+'"></b>'+(s.low<s.need?'<u style="left:'+pc(s.low)+';width:'+(s.need-s.low)*5+'%"></u>':'')+'<em style="left:'+((s.n-.5)*5)+'%"></em></div>'+
      '<div class="dice-res"><span>Rolled '+s.n+(s.b?' + '+s.b+' = '+(s.n+s.b):'')+', DC '+s.dc+' ('+s.pct+'%)'+(s.low<s.need?', in part on '+(s.low+s.b):'')+'</span>'+
      (nat?'<em class="dice-nat">'+nat+'</em>':'')+'<strong>'+W+'</strong></div><button class="dice-go" type="button">Continue</button></div>';
    el.style.setProperty('--tumble',(quiet?0:DICE.tumble)+'ms');el.addEventListener('click',e=>{e.stopPropagation();this.clear()});document.body.appendChild(el);this.el=el;
    this.roll(el.querySelector('.dice-cv'),s.n,quiet);el.querySelector('.dice-go').focus({preventScroll:true})}
  // (a key while it is up (ui/input.js): Enter, Space or Esc close it; true: the key is the die's, nothing else hears it)
  static key(k){if(!this.el)return false;if(k==='escape'||k==='enter'||k===' ')this.clear();return true}
  static clear(){cancelAnimationFrame(this.raf);if(this.el)this.el.remove();this.el=null}
  // (the throw: the die from the left, hopping lower each time, its turns running out as it comes to rest on its number)
  static roll(cv,n,quiet){const D=DICE.die,dpr=Math.min(2,window.devicePixelRatio||1),w=cv.clientWidth||200,h=D.h,x=cv.getContext('2d');if(!x)return;
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);const rest=D20.rest(n,D.roll),ax=[.3+.1*(n%3),.35,1],spin=D.spin+(n*7%5)*.08,at=w/2,t0=performance.now(),T=quiet?0:DICE.tumble;
    const frame=now=>{if(!cv.isConnected)return;x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);
      const t=T?Math.max(0,Math.min(1,(now-t0)/T)):1,e=1-Math.pow(1-t,2.4),lift=D.hop*Math.abs(Math.cos(2.5*Math.PI*t))*Math.pow(1-t,1.6),
        M=t<1?v3.mm(v3.rot(ax,spin*2*Math.PI*Math.pow(1-t,2.2)),rest):rest;
      this.paint(x,at-(1-e)*(at+D.r*1.6),h/2+2-lift,lift,M);if(T&&now-t0<T+20)this.raf=requestAnimationFrame(frame)};
    frame(t0)}
  // (the die drawn: its shadow on the board, then the faces that look to you, each its wood, its light and its burnt number)
  static paint(x,cx,cy,lift,M){const D=DICE.die,r=D.r,f=D.far,P=p=>{const q=v3.ap(M,p),k=f/(f-q[2]);return [cx+q[0]*r*k,cy-q[1]*r*k]},L=v3.norm(D.light),gy=cy+r*.98+lift;
    const g=x.createRadialGradient(cx+3,gy,1,cx+3,gy,r*1.1);g.addColorStop(0,'rgba(8,4,1,'+(.6-lift*.012)+')');g.addColorStop(1,'rgba(8,4,1,0)');
    x.save();x.fillStyle=g;x.translate(cx+3,gy);x.scale(1,.3);x.beginPath();x.arc(0,0,r*1.1,0,7);x.fill();x.restore();
    const pat=x.createPattern(this.wood(),'repeat');
    for(const F of D20.faces){const n=v3.ap(M,F.n),c=v3.ap(M,F.c),see=v3.dot(n,v3.norm(v3.sub([0,0,f],c)));if(see<=0)continue;
      const pts=F.v.map(P),q=P(F.q),pu=P(v3.add(F.q,v3.mul(F.fu,.1))),pv=P(v3.add(F.q,v3.mul(F.fv,.1))),s=.1*r,A=[(pu[0]-q[0])/s,(pu[1]-q[1])/s,-(pv[0]-q[0])/s,-(pv[1]-q[1])/s,q[0],q[1]];
      x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();
      if(pat.setTransform)pat.setTransform(new DOMMatrix(A).rotate(F.g).scale(.5));x.fillStyle=pat;x.fill();
      const l=v3.dot(n,L),sh=l>0?.34*(1-l):.34+.3*Math.min(1,-l),hi=Math.pow(Math.max(0,v3.dot(v3.norm(v3.add(L,[0,0,1])),n)),14)*.38;
      x.fillStyle='rgba(70,32,8,'+sh.toFixed(3)+')';x.fill();if(hi>.01){x.fillStyle='rgba(255,246,226,'+hi.toFixed(3)+')';x.fill()}
      x.lineJoin='round';x.lineWidth=1.1;x.strokeStyle='rgba(255,232,196,'+(.16+.22*Math.max(0,l)).toFixed(3)+')';x.stroke();
      const a=Math.max(0,Math.min(1,(see-.12)/.3));if(a<=0)continue;
      const txt=String(F.d);x.save();x.transform(...A);x.globalAlpha=a;
      x.font='700 '+Math.round(r*.36)+'px "Trebuchet MS",Verdana,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';
      x.shadowColor=D.scorch;x.shadowBlur=2;x.fillStyle=D.ink;x.fillText(txt,0,r*.02);
      if(F.d===6||F.d===9){const m=x.measureText(txt).width;x.fillRect(-m/2,r*.16,m,r*.04)}x.restore()}}
  // (the haldu wood: a light, warm block with its fine straight grain and a few darker fibres; from a hash, never a draw)
  static wood(){if(this.W)return this.W;const S=128,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),im=g.createImageData(S,S),C=DICE.die.wood;
    const h=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)},nz=(t,p)=>{const i=Math.floor(t),u=t-i,a=h(((i%p)+p)%p),b=h((((i+1)%p)+p)%p),k=u*u*(3-2*u);return a+(b-a)*k};
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){const w=x+6*nz(y/16,8)+2.5*nz(y/5+3,26),ring=.5+.5*Math.sin(w*2*Math.PI*9/S+3*nz(y/32,4)),fib=h(x*7.3+Math.floor(y/3)*.01)>.93?.35:0;
      const k=Math.min(1,Math.pow(ring,4)*.7+fib+h(x*13+y*101)*.08),o=k<.5?k*2:(k-.5)*2,lo=k<.5?C[0]:C[1],hi=k<.5?C[1]:C[2],i=(y*S+x)*4;
      for(let j=0;j<3;j++)im.data[i+j]=lo[j]+(hi[j]-lo[j])*o;im.data[i+3]=255}
    g.putImageData(im,0,0);return this.W=c}
}
