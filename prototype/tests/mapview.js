'use strict';
// Map check: every holding and camp is reachable, each climate covers a sensible share of the land, and the whole map is drawn
// on top of the page (open Ashmark.html?test=mapview, or screenshot it headless) so the layout can be eyeballed.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,TOWNS=t.TOWNS,CAMPS=t.CAMPS,MW=t.MW,MH=t.MH,TILE=t.TILE;
 const f=t.flowTo(TOWNS[0]),far=[...TOWNS.map(x=>[x.name,x.tx,x.ty]),...CAMPS.map((c,i)=>['camp '+i,c.tx,c.ty])].filter(([,x,y])=>!isFinite(f[y*MW+x]));
 ok(!far.length,'every holding and camp reachable from Ashford'+(far.length?': unreachable '+far.map(x=>x[0]).join(', '):''));
 const cnt={},land=[...t.tiles].filter(x=>t.passable(x)).length;
 for(let i=0;i<MW*MH;i++)if(t.passable(t.tiles[i])){const c=t.CLIMS[t.climate[i]];cnt[c]=(cnt[c]||0)+1}
 ok(t.CLIMS.every(c=>cnt[c]>land*.06),'climate share of land: '+t.CLIMS.map(c=>c+' '+Math.round((cnt[c]||0)/land*100)+'%').join(', '));
 const mt=[...t.tiles].filter(x=>x===t.T_MOUNT).length;ok(mt>8,'mountain tiles: '+mt);
 ok(TOWNS.every(x=>t.climAt(x.x,x.y)===x.clim),'each holding sits in its own climate');
 const cv=document.createElement('canvas');cv.width=MW*TILE;cv.height=MH*TILE;const g=cv.getContext('2d');g.drawImage(t.worldCv(),0,0);
 g.font='bold 14px sans-serif';g.textAlign='center';for(const x of TOWNS){g.fillStyle='#000';g.fillText(x.name,x.x+1,x.y-11);g.fillStyle='#fff';g.fillText(x.name,x.x,x.y-12)}
 Object.assign(cv.style,{position:'fixed',left:0,top:0,width:'100vw',height:'auto',zIndex:99,imageRendering:'pixelated'});document.body.appendChild(cv);
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
