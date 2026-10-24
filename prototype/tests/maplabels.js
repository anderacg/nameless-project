'use strict';
// Map labels are drawn at native device resolution, including fractional camera positions and high-DPI/zoom changes.
Kit.suite(({ok})=>{
 const t=T,c=t.ctx;window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world();
 const old=c.drawImage,calls=[];c.drawImage=function(img,...a){calls.push({img,a,m:this.getTransform()});return old.call(this,img,...a)};
 const ink=img=>{const a=img.getContext('2d').getImageData(0,0,img.width,img.height).data;let n=0,edge=false;for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++){if(!a[(y*img.width+x)*4+3])continue;n++;if(x===0||y===0||x===img.width-1||y===img.height-1)edge=true}return {n,edge}};
 try{
  for(const [scale,dpr] of [[1,1],[2,1],[3,1],[4,1],[1,2],[3,1.25],[4,2]]){
   const p=t.mapTxtPic('Briarhurst · Pilgrims 18','#e4e0cf','center',scale,dpr),i=ink(p);
   ok(p.deviceText&&p.labelSize/dpr>=11&&i.n>30&&!i.edge,'at scale '+scale+', DPR '+dpr+': readable native-size glyphs and outline fit inside the picture');
   ok(p===t.mapTxtPic('Briarhurst · Pilgrims 18','#e4e0cf','center',scale,dpr),'repeated labels reuse the device-size cache at scale '+scale+', DPR '+dpr);
  }
  const small=t.mapTxtPic('Smithy',null,'left',1,1),large=t.mapTxtPic('Smithy',null,'left',3,1);
  ok(large!==small&&large.width>small.width&&large.height>small.height,'zooming rasterizes a larger label instead of stretching its small bitmap');
  ok(t.mapTxtPic('Army','#ff9a90','center',3,1)!==t.mapTxtPic('Army','#76d86a','center',3,1),'hostile and friendly labels retain separate colors');
  for(const align of ['left','center','right']){calls.length=0;c.save();c.setTransform(3,0,0,3,-1,-2);c.globalAlpha=.7;
   const before=c.getTransform();t.mapTxt('Army 18',42+1/3,35+2/3,'#e4e0cf',align);const after=c.getTransform(),p=calls.at(-1);
   ok(p.img.deviceText&&p.a.length===2&&p.m.a===1&&p.m.d===1&&p.m.b===0&&p.m.c===0,'a '+align+' label is copied 1:1, with no canvas scaling');
   ok(Number.isInteger(p.a[0])&&Number.isInteger(p.a[1])&&p.a[0]+p.img.ox===126&&p.a[1]+p.img.oy===105,'a '+align+' label keeps its anchor on the exact device pixel through a fractional camera');
   ok(before.a===after.a&&before.e===after.e&&before.f===after.f&&c.globalAlpha===.7,'a '+align+' label restores camera and opacity for later map drawing');c.restore();
  }
  for(const s of ['Ålderbrook','Briarhurst','Pilgrims','Smithy','???','18','Agility +2'])ok(!ink(t.mapTxtPic(s,'#e4e0cf','center',3,1)).edge,'no glyph or outline clipping: '+s);
  calls.length=0;t.frame();const labels=calls.filter(p=>p.img.deviceText);
  ok(labels.length>0&&labels.every(p=>p.m.a===1&&p.m.d===1&&p.a.length===2),'a real world frame uses native pictures for queued map labels');
  ok(!t.txtPic('Army 18',null,'left').deviceText,'legacy battle/street label pictures keep their existing rendering path');
  ok(!calls.some(p=>!p.img.deviceText&&p.img.ox!=null),'the world frame does not enlarge the legacy 8px label pictures');
  for(let i=0;i<650;i++)t.mapTxtPic('Label '+i,null,'left',3,1);ok(t.TXTC.size<=601,'the shared label cache remains bounded');
 }finally{c.drawImage=old}
});
