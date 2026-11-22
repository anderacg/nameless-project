'use strict';
// Desktop and phone share one placement owner, including controls nested inside another moved group.
Kit.suite(({ok})=>{
 const H=T.HudControls,records=H.records,host=document.createElement('div');document.body.appendChild(host);H.records=new Map();
 const make=parent=>{const e=document.createElement('div');parent.appendChild(e);return e},home=make(host),desktop=make(host),phone=make(host),group=make(home),control=make(group);let wide=false,narrow=false;
 try{
  const a=H.bind(group,desktop,()=>wide,10),b=H.bind(group,phone,()=>narrow,20),c=H.bind(control,phone,()=>narrow,20);
  ok(a.home===b.home&&H.records.size===2,'each shared control has exactly one original home');
  wide=true;H.sync();ok(group.parentNode===desktop&&control.parentNode===group,'desktop moves the group with its existing children');
  narrow=true;H.sync();ok(group.parentNode===phone&&control.parentNode===phone,'phone wins when both presenters temporarily request a control');
  const observer=new MutationObserver(()=>{});observer.observe(host,{subtree:true,childList:true});H.sync();H.sync();ok(!observer.takeRecords().length,'repeated synchronization does not mutate settled DOM');observer.disconnect();
  narrow=false;H.sync();ok(group.parentNode===desktop&&control.previousSibling===c.home,'switching back restores a nested control inside the desktop group');
  wide=false;H.sync();ok(group.previousSibling===a.home&&control.parentNode===group,'leaving both layouts restores the original hierarchy');
 }finally{H.records=records;host.remove()}
});
