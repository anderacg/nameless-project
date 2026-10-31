'use strict';
// The wounded in the March formation window (ui/march.js marchHurt; the owner, 2026-10-30: "March formation should show current
// wounded units as well"): each group's wounded drawn in its last places, faded, a red cross over each; the selected group's line
// says how many are fit and how many wounded; a group all wounded is named under the field, out of the formation.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();
 P.troops={hum_bow:3,hum_foot:4};const r=t.partyRoster(P),bow=r.groups.find(g=>g.type==='hum_bow'),foot=r.groups.find(g=>g.type==='hum_foot');
 P.wounded={hum_bow:2,hum_foot:3};P.woundedGroups=[{id:bow.id,type:'hum_bow',count:2},{id:foot.id,type:'hum_foot',count:3}];r.remove('hum_foot',4,foot.id);
 G.mode='char';t.openMarch();t.act('march-select',bow.id);const row=t.marchDraftRows().find(x=>x.id===bow.id),v=t.marchCanvasView();
 {const p=t.marchPreviewFigures(row,v.scale);ok(p.figures.length===5&&p.figures.filter(f=>f.hurt).length===2&&p.figures.slice(0,3).every(f=>!f.hurt),'3 fit and 2 wounded longbowmen drawn, the wounded last')}
 {const al=[],g={save(){},restore(){},fillRect(){al.push('x')},set globalAlpha(a){al.push(a)},get globalAlpha(){return 1},drawImage(){}};t.marchUnitPreview(g,row,100,100,v.scale);
  ok(al.filter(a=>a===t.MARCH_PREVIEW.hurt).length===2&&al.filter(a=>a==='x').length===4,'the wounded faded, a red cross over each')}
 ok(/3 fit, 2 wounded/.test(document.getElementById('marchLabel').textContent),'its line: '+document.getElementById('marchLabel').textContent);
 ok(!t.marchDraftRows().some(x=>x.id===foot.id)&&/All wounded, out of the formation: 3 /.test(document.getElementById('panel').textContent),'a group all wounded: named under the field, not in the formation');
 t.act('march-back');
 // (the wounded of a march's sickness and of an outcome: under their own groups too, so the window shows them)
 {P.woundedGroups=[];P.wounded={};const f=r.groups.find(g=>g.type==='hum_bow');t.supplyHurt('the cold');t.applyOutcome({wounded:{hum_bow:1}},{});
  const w=r.wounded(f.id);G.mode='char';t.openMarch();t.act('march-select',f.id);
  ok(w===2&&/1 fit, 2 wounded/.test(document.getElementById('marchLabel').textContent),'one fallen sick on the march, one hurt by an outcome: both shown under their group ('+document.getElementById('marchLabel').textContent+')');t.act('march-back')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
