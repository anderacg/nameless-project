'use strict';
// The world map's labels laid out as they are drawn (render.js labelLayout), on a 3x screen (core.js VS): the holdings' names stay
// where they are; a party's label (its size and stance, over its banner) that would cover one is nudged up just clear of it, and
// one that cannot be cleared is hidden while it is covered, never yours (a companion's party). Labels still follow their parties
// to 1/VS px; passing over a name one hops over it once, rests on it, goes on with its party, and is never hidden.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
const t=T,G=t.G,P=t.P,W=t.W,ev=s=>(0,eval)(s),pn=performance.now;
try{
 try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;G.encCool=1e9;
 t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.chase=null;P.tx=null;
 const S=3;ev('VS='+S);G.clock=t.DAY*.3;let now=1e7;performance.now=()=>now;
 t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];W.ships=[];W.fights=[];
 const A=t.townBy('Ashford');P.x=A.x+60.4;P.y=A.y+40.2;P.stay=null;P.troops={hum_levy:12};t.reveal();
 const L=W.lords.find(l=>!l.dead&&!t.lordsInside(A).includes(l));Object.assign(L,{inside:null,fight:null,dead:false,dir:1,state:'rest'});
 // (each frame: the labels as queued and as laid out, read through labelLayout)
 window.__lay=t.labelLayout;let got=null;window.__got=v=>got=v;
 ev('labelLayout=(q,n,cam)=>{const pre=q.map(a=>Object.assign([...a],{who:a.who||0}));const r=__lay(q,n,cam);__got({pre,out:r.map(a=>Object.assign([...a],{who:a.who||0}))});return r}');
 const frame=()=>{now+=16;t.frame();return got};
 const box=a=>t.labelBox(a),over=(a,b)=>{const p=box(a),q=box(b),e=.01;return p[0]<q[0]+q[2]-e&&q[0]<p[0]+p[2]-e&&p[1]<q[1]+q[3]-e&&q[1]<p[1]+p[3]-e};
 const name=f=>f.out.find(a=>!a.who&&a[0]===A.name),lbl=(f,s,w)=>f.out.find(a=>a.who===w&&a[0]===s),raw=(f,s,w)=>f.pre.find(a=>a.who===w&&a[0]===s);
 const scr=o=>[o.x-G.cam.x,o.y-G.cam.y],grid=v=>Math.abs(v*S-Math.round(v*S))<1e-4;
 // (where a party's label, as queued, would lie right on the holding's name, south of its centre: it is put there)
 const spot=(p,s,w)=>{let best=null;for(let dy=0;dy<=60;dy++)for(const dx of [0,-6,6]){p.x=A.x+dx+.37;p.y=A.y+dy+.21;const f=frame(),n=name(f),r=raw(f,s,w);
   if(n&&r&&over(r,n)){const d=Math.abs(r[2]-n[2])+Math.abs(dx);if(!best||d<best.d)best={dx,dy,d}}}if(best){p.x=A.x+best.dx+.37;p.y=A.y+best.dy+.21}return best};
 try{
  // ---- a lord standing by Ashford: his label clear of its name, nudged up, not hidden
  const ls=String(L.size),at=spot(L,ls,2);ok(!!at,'a lord by '+A.name+' whose label, as queued, would cover its name'+(at?' ('+at.dx+', +'+at.dy+' px from its centre)':' (no such spot found)'));
  if(at){const f=frame(),n=name(f),a=lbl(f,ls,2),r=raw(f,ls,2),N=f.pre.find(q=>!q.who&&q[0]===A.name);
   ok(n&&N&&n[1]===N[1]&&n[2]===N[2],'the holding\'s name stays where it was ('+n[1]+', '+n[2]+')');
   ok(a&&!over(a,n)&&a[1]===r[1]&&a[2]<r[2]&&r[2]-a[2]<=t.LABEL_LAY.max&&grid(a[2]),'the lord\'s label "'+ls+'" is nudged up '+(a?(r[2]-a[2]).toFixed(2):'?')+' px, clear of "'+A.name+'", on the screen\'s pixels');
   ok(f.out.every((p,i)=>f.out.every((q,j)=>j<=i||!(p.who||q.who)||!over(p,q))),'no label drawn over another ('+f.out.length+' drawn)')}
  // ---- yours: a companion's party by the same spot is nudged clear too; with no room to nudge (max 0) it is still drawn, the lord's hidden
  P.comps={brann:{ap:5,role:''}};const c=t.compInit('brann');c.lv=3;t.cpGive('brann','hum_levy',4);const cp=c.party;Object.assign(cp,{inside:null,order:'follow'});const cs=cp.look().label;
  {const at2=spot(cp,cs,1),f=frame(),n=name(f),a=lbl(f,cs,1),r=raw(f,cs,1);ok(!!at2&&a&&!over(a,n)&&a[2]<r[2],'your companion\'s party by '+A.name+': its label "'+cs+'" nudged clear of the name, '+(a&&r?(r[2]-a[2]).toFixed(2):'?')+' px up')}
  {const M=t.LABEL_LAY.max;t.LABEL_LAY.max=0;let seen=0,hid=0,mine=0,n=0;
   try{for(let dy=0;dy<=40;dy++){cp.x=L.x=A.x+.37;cp.y=L.y=A.y+dy+.21;L.x+=1;const f=frame(),nm=name(f),rc=raw(f,cs,1),rl=raw(f,ls,2);if(!nm)continue;
     if(rc&&over(rc,nm)){n++;if(lbl(f,cs,1))mine++}if(rl&&(over(rl,nm)||rc&&over(rl,rc))){seen++;if(!lbl(f,ls,2))hid++}}}finally{t.LABEL_LAY.max=M}
   ok(n>0&&mine===n,'with no room to nudge: your label is never hidden, covering the name '+n+' times, drawn '+mine);
   ok(seen>0&&hid===seen,'and the lord\'s label, covered, is hidden while it is ('+hid+' of '+seen+')')}
  cp.x=cp.y=-9999;
  // ---- labels follow their parties: to 1/VS px, out in the open and passing over the name (resting still on it, never hidden)
  {const x0=A.x+.37,y0=A.y+80.21;let bad=0,steps=0,off=null;
   for(let i=0;i<12;i++){L.x=x0+i/S;L.y=y0-i/S;const f=frame(),a=lbl(f,ls,2),r=raw(f,ls,2),s=scr(L);if(!a||!r){bad++;continue}const d=[a[1]-s[0],a[2]-s[1]].map(v=>+v.toFixed(4));
    if(off==null)off=d;if(d[0]!==off[0]||d[1]!==off[1]||!grid(a[1]+G.cam.x-Math.floor(G.cam.x))||!grid(a[2])||a[2]!==r[2])bad++;steps++}
   ok(steps===12&&!bad,'a lord walking by in steps of 1/'+S+' px, away from the name: his label keeps its place over him to the screen pixel ('+(off||[]).join(', ')+')');
   let last=null,back=0,hop=0,hidden=0,rest=0,moved=0;
   for(let i=0;i<=70*S;i++){L.x=A.x+.37;L.y=A.y+80.21-i/S;const f=frame(),a=lbl(f,ls,2);if(!a){hidden++;continue}
    if(last!=null){const dy=a[2]-last;if(dy>1e-4)back++;else if(dy<-1/S-1e-4)hop++;else if(dy<-1e-4)moved++;else rest++}last=a[2]}
   ok(!hidden&&!back&&hop===1&&rest>0&&moved>0,'walking north over '+A.name+'\'s name, 1/'+S+' px a frame: his label goes up with him ('+moved+' frames), hops over the name once as it meets it ('+hop+'), rests there while it would cover it ('+rest+'), never goes back down ('+back+') nor hides ('+hidden+')')}
 }finally{ev('labelLayout=__lay')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{performance.now=pn}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
