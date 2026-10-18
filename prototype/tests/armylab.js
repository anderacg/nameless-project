'use strict';
window.RUN=()=>{const t=T,L=t.BattleLab,D=t.DevConsole,P=t.P,G=t.G,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),originalPresets=localStorage.getItem(L.presetKey),deploymentPreference=t.BDEPLOY.on;
const rejects=(fn,label)=>{let failed=false;try{fn()}catch(e){failed=true}ok(failed,label)};
try{
 t.begin('soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();P.comps.brann={ap:5,role:''};t.compInit('brann').lv=7;
 const player=JSON.stringify(P),game=JSON.stringify(G),world=JSON.stringify(t.W),refs={troops:P.troops,comps:P.comps,attr:P.attr,msgs:G.msgs},rng=Math.random,save=localStorage.getItem(t.slotKey('quick'));
 const config={leftGroups:[{type:'hum_foot',count:8,name:'First <Guard>',form:'loose',files:4},{type:'hum_foot',count:6,name:'Second Guard'},{type:'hum_knight',count:6,form:'wedge'}],rightGroups:[{type:'hum_foot',count:7},{type:'hum_bow',count:5}],deploy:false,paused:true,ai:false,seed:9};
 const normalized=L.validate(config);ok(normalized.mode==='army'&&normalized.leftGroups.length===3&&normalized.leftGroups[1].form==='line','army configurations normalize defaults without merging duplicate types');
 const cloned=L.validate(config);cloned.leftGroups[0].count=1;ok(config.leftGroups[0].count===8,'validation returns independent group records');
 for(const rows of [[],Array(11).fill({type:'hum_foot',count:1})])rejects(()=>L.start({...config,leftGroups:rows}),'invalid army size is rejected before session creation ('+rows.length+' groups)');
 rejects(()=>L.start({...config,leftGroups:Array(1)}),'sparse group arrays cannot create an empty participating army');
 for(const count of [0,-1,.5,101,NaN,Infinity,'5'])rejects(()=>L.start({...config,leftGroups:[{type:'hum_foot',count}]}),'invalid group count '+count+' is rejected');
 rejects(()=>L.start({...config,leftGroups:Array(3).fill({type:'hum_foot',count:100})}),'army totals above 200 are rejected');
 rejects(()=>L.start({...config,leftGroups:[{type:'missing',count:1}]}),'unknown unit types are rejected');
 rejects(()=>L.start({...config,rightGroups:[{type:'hero',count:1}]}),'the current hero cannot be duplicated as a right-side actor');
 rejects(()=>L.start({...config,leftGroups:[{type:'hero',count:1},{type:'hero',count:1}]}),'duplicate hero slots are rejected');
 rejects(()=>L.start({...config,leftGroups:[{type:'brann',count:2}]}),'companion templates require count one');
 rejects(()=>L.start({...config,leftGroups:[{type:'brann',count:1},{type:'brann',count:1}]}),'one companion template cannot occupy two slots in the same army');
 rejects(()=>L.start({...config,leftGroups:[{type:'hum_foot',count:6,form:'wedge'}]}),'infantry cannot request a cavalry wedge');
 rejects(()=>L.start({...config,leftGroups:[{type:'hum_knight',count:5,form:'wedge'}]}),'wedge requires at least six cavalry');
 rejects(()=>L.start({...config,leftGroups:[{type:'hum_knight',count:6,form:'loose'}]}),'mounted units cannot request loose foot formation');
 rejects(()=>L.start({...config,leftGroups:[{type:'hum_foot',count:3,files:4}]}),'frontage cannot exceed group count');
 rejects(()=>L.start({...config,leftGroups:[{type:'hum_foot',count:3,name:'x'.repeat(33)}]}),'oversized group names are rejected');
 ok(!L.active&&JSON.stringify(P)===player&&JSON.stringify(G)===game,'invalid configurations leave campaign and session untouched');
 L.start(config);let b=t.B,ids=t.playerGroups(),first=b.groups[ids[0]],second=b.groups[ids[1]];
 ok(b.units.filter(u=>!u.team).length===20&&b.units.filter(u=>u.team).length===12,'mixed armies spawn exact requested counts');
 ok(ids.length===3&&first!==second&&t.grpUnits(first.id).length===8&&t.grpUnits(second.id).length===6,'duplicate troop types have independent IDs and cards');
 ok(first.form==='loose'&&first.files===4&&b.groups[ids[2]].form==='wedge','formation and frontage settings reach their exact groups');
 ok(b.units.every(u=>!u.hero)&&b.hero.hp===0,'troop-only armies contain no extra participating hero');
 {const c=document.querySelector('[data-grp="'+first.id+'"]');ok(c.title.startsWith('First <Guard>: ')&&c.getAttribute('aria-label')===c.title&&!c.querySelector('Guard'),'custom army labels remain safe literal text (the card’s tooltip and label)')}
 t.selectGroup(first.id);t.setOrder('withdraw');ok(first.order==='withdraw'&&second.order==='hold','commands stay independent across duplicate groups');
 L.step(3);ok(b.t>0&&b.paused,'multi-group simulation advances through normal stepping');
 const initial=JSON.stringify(L.last);D.applyBattleConfig({...config,leftGroups:[{type:'dragon',count:1}]});b.units[0].s.dmg=999;L.restart();
 ok(JSON.stringify(L.last)===initial&&t.B.units.length===32&&t.B.units[0].s.dmg!==999,'restart uses a deep original configuration, not edited draft or runtime stats');L.exit();
 ok(P.troops===refs.troops&&P.comps===refs.comps&&P.attr===refs.attr&&G.msgs===refs.msgs,'mixed-army exit restores campaign nested identities');
 ok(JSON.stringify(P)===player&&JSON.stringify(G)===game&&JSON.stringify(t.W)===world&&Math.random===rng,'mixed battles and restarts restore campaign, world and random source exactly');
 const lastGood=JSON.stringify(L.last);rejects(()=>L.start({...config,deploy:true,leftGroups:[{type:'hum_foot',count:100,files:1}]}),'formations too deep for deployment fail with an explicit error');
 ok(!L.active&&JSON.stringify(P)===player&&JSON.stringify(G)===game&&JSON.stringify(L.last)===lastGood,'failed setup restores campaign and retains the last successful test');
 // Deployment is independent of the campaign preference and starts with all actors inside their zones.
 t.BDEPLOY.on=false;L.start({...config,deploy:true});b=t.B;
 ok(b.deploy&&b.paused&&!t.BDEPLOY.on,'sandbox deployment works without changing the campaign deployment preference');
 ok(b.units.filter(u=>!u.team).every(u=>u.x>=8&&u.x<=t.deployZone().x1),'initial left formations fit the deployment zone');
 // Deployment is deliberately frozen until Begin.
 if(L.active&&t.B.deploy){const b=t.B;rejects(()=>L.step(1),'stepping cannot silently bypass deployment');ok(b.t===0,'deployment does not advance simulation time');
  const id=t.playerGroups()[0];t.selectGroup(id);t.rtsOrder(80,t.fieldTop()+40);ok(b.groups[id].ax<=t.deployZone().x1,'normal group deployment orders remain available');
  t.beginFight();ok(!b.deploy&&b.paused,'Begin respects the requested post-deployment paused state');L.step(2);ok(b.t>0&&b.paused,'stepping works after Begin');L.exit();
 }
 t.BDEPLOY.on=false;
 const chars={leftGroups:[{type:'hero',count:1},{type:'brann',count:1},{type:'hum_foot',count:2}],rightGroups:[{type:'brann',count:1},{type:'tavi',count:1},{type:'hum_foot',count:2}],deploy:false,paused:true,morale:false};
 const charPlayer=JSON.stringify(P),charWorld=JSON.stringify(t.W);L.start(chars);b=t.B;
 ok(t.playerGroups().length===3&&b.units.filter(u=>u.hero).length===1,'hero and companion each consume their own controllable group');
 const twins=b.units.filter(u=>u.type==='brann');ok(twins.length===2&&twins[0].unit.o!==twins[1].unit.o&&twins.every(u=>u.leader.lv===1),'opposing companion templates have independent level-one records');
 ok(twins[0].max===twins[1].max&&twins[0].s.dmg===twins[1].s.dmg,'mirrored companion templates have symmetric starting stats');
 t.applyDmg(twins[0],10000);L.step(4);L.exit();ok(JSON.stringify(P)===charPlayer&&JSON.stringify(t.W)===charWorld&&P.comps.brann.lv===7,'template injuries and skills never change the actual campaign companion');
 // Maximum group count and hotkeys, with the declared performance limit.
 L.start({leftGroups:Array.from({length:10},()=>({type:'hum_foot',count:20})),rightGroups:Array.from({length:10},()=>({type:'hum_foot',count:20})),paused:true,deploy:true});
 ok(t.B.units.length===400&&t.playerGroups().length===10&&Object.values(t.B.groups).filter(g=>g.foe).length===10,'ten independent groups per side support the 200-fighter army limit');
 t.B.ctrl={};t.ctrlGroup('0');ok(t.B.sel===t.playerGroups()[9],'number key zero selects the tenth lab group');t.frame();L.exit();
 // Presets live in their own namespace and carry all group/settings fields.
 localStorage.removeItem(L.presetKey);const raw={leftGroups:[{type:'hum_bow',count:5,name:'<b>Archers</b>'},{type:'hum_foot',count:5,form:'loose',files:3}],rightGroups:[{type:'hum_knight',count:6,form:'wedge'}],seed:17,terrain:'hill',climate:'frost',deploy:true,paused:false,ai:false,morale:false};
 const saved=L.savePreset('Mixed <test>',raw);raw.leftGroups[0].count=1;ok(L.savedPresets()[0].config.leftGroups[0].count===5,'saved presets are independent of caller mutations');
 ok(L.savedPresets()[0].config.seed===17&&L.savedPresets()[0].config.deploy&&!L.savedPresets()[0].config.morale,'presets retain terrain, seed, timing and morale options');
 L.savePreset('Mixed <test>',{...raw,seed:18});ok(L.savedPresets().length===1&&L.savedPresets()[0].config.seed===18,'saving the same user name deliberately replaces that preset');
 rejects(()=>L.savePreset('',raw),'empty preset names are rejected');rejects(()=>L.savePreset('bad\nname',raw),'preset names reject control characters');
 ok(L.builtins().length>=4&&L.builtins().every(p=>L.validate(p.config)),'built-in mixed and regression matchups are valid');
 ok(localStorage.getItem(t.slotKey('quick'))===save,'presets never overwrite the campaign quick-save key');
 L.deletePreset('Mixed <test>');ok(!L.savedPresets().length,'only the selected user preset is removed');
 localStorage.setItem(L.presetKey,'not JSON');ok(!L.savedPresets().length,'malformed stored presets fail safely');localStorage.removeItem(L.presetKey);
 // Actual builder controls: independent rows, stable input, row ordering, preset buttons and launch.
 D.show('battle');D.applyBattleConfig({leftGroups:[{type:'hum_foot',count:5}],rightGroups:[{type:'hum_bow',count:4}],deploy:true});
 ok(D.root.scrollWidth<=D.root.clientWidth+1,'army builder stays within the available overlay width');
 const f=D.root.querySelector('[data-dev-battle]'),left=f.querySelector('[data-lab-side="left"]'),count=left.querySelector('[data-lab-field="count"]');count.focus();count.value='6';count.dispatchEvent(new Event('input',{bubbles:true}));
 ok(document.activeElement===count&&left.querySelector('[data-lab-field="count"]')===count&&left.querySelector('[data-lab-budget]').textContent.includes('6 / 200'),'live army totals preserve input focus and identity');
 left.querySelector('[data-lab-add]').click();let rows=[...left.querySelectorAll('[data-lab-row]')];ok(rows.length===2&&D.readBattleForm().leftGroups[1].type==='hum_foot','Add creates another independent group of the same type');
 rows[1].querySelector('[data-lab-row-action="up"]').click();ok(D.readBattleForm().leftGroups[0].count===10&&D.readBattleForm().leftGroups[1].count===6,'row reordering controls actual army card order');
 left.querySelector('[data-lab-row-action="remove"]').click();ok(D.readBattleForm().leftGroups.length===1,'Remove affects only one draft group');
 f.querySelector('[data-lab-preset-name]').value='UI preset';f.querySelector('[data-lab-action="save"]').click();ok(L.savedPresets().some(p=>p.name==='UI preset'),'actual preset Save button persists a validated army');
 count.value='1';f.querySelector('[data-lab-action="load"]').click();ok(D.readBattleForm().leftGroups[0].count===6,'actual Load restores saved group quantities');
 ok(!f.querySelector('[data-lab-preset] option').textContent.includes('<b>'),'preset display uses safe literal labels');
 f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));ok(L.active&&!D.opened&&t.B.deploy&&f.querySelector('[data-lab-start]').disabled,'real form starts an isolated deployable army and blocks duplicate starts');
 ok(document.querySelector('[data-dev-tool="step"]').disabled&&document.querySelector('[data-dev-tool="pause"]').textContent==='Begin','deployment toolbar exposes Begin and disables ineffective stepping');
 document.querySelector('[data-dev-tool="pause"]').click();document.querySelector('[data-dev-tool="step"]').click();ok(!t.B.deploy&&t.B.t>0,'toolbar Begin then Step drives the real battle');
 document.querySelector('[data-dev-tool="exit"]').click();ok(!L.active&&!f.querySelector('[data-lab-start]').disabled,'Exit restores the map and makes the builder available again');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit();D.close();t.BDEPLOY.on=deploymentPreference;if(originalPresets===null)localStorage.removeItem(L.presetKey);else localStorage.setItem(L.presetKey,originalPresets)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
