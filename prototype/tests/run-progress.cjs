// Optional runner: Node + Playwright, explicit suites only, at most two browser pages.
// CHROME_BIN chooses the browser; ASHMARK_TEST_JOBS is 1 or 2 (default 2).
// ASHMARK_TEST_STALL_SECONDS and ASHMARK_TEST_TOTAL_SECONDS bound each seed-1 run.
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'ashmark-progress-'));
const suites=process.argv.slice(2),mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'};
if(!suites.length||suites.some(s=>!/^(visual\/)?\w+$/.test(s)||!fs.existsSync(path.join(root,'prototype/tests',s+'.js')))){
  console.error('Usage: node tests/run-progress.cjs suite [suite ...]');process.exit(2);
}
const browserPath=process.env.CHROME_BIN||['/usr/bin/chromium','C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p))||chromium.executablePath();
const jobs=Number(process.env.ASHMARK_TEST_JOBS||2);
if(![1,2].includes(jobs)){console.error('ASHMARK_TEST_JOBS must be 1 or 2.');process.exit(2)}
const stall=Number(process.env.ASHMARK_TEST_STALL_SECONDS||180)*1000,total=Number(process.env.ASHMARK_TEST_TOTAL_SECONDS||2400)*1000;
if(!(Number.isFinite(stall)&&Number.isFinite(total)&&stall>0&&total>0)){console.error('Timeouts must be positive seconds.');process.exit(2)}
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  const relative=path.relative(root,file);
  if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative)){res.statusCode=403;res.end();return}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  fs.readFile(file,(err,body)=>{
    if(err){res.statusCode=404;res.end();return}
    res.end(file.endsWith('.html')?body.toString().replace(/<link[^>]*https:\/\/fonts[^>]*>/g,''):body);
  });
});
async function runSuite(browser,suite,port){
  const phone=/^window\.PHONE=true/m.test(fs.readFileSync(path.join(root,'prototype/tests',suite+'.js'),'utf8'));
  const page=await browser.newPage(phone?{viewport:{width:844,height:390},hasTouch:true,isMobile:true}:{viewport:{width:1152,height:720}});
  const errors=[],started=Date.now(),progressFile=path.join(out,suite.replace('/','-')+'.progress.jsonl');
  let last=started,stage='page startup',watchdog;
  fs.writeFileSync(progressFile,'');
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{
    const text=message.text();if(!text.startsWith('TEST_PROGRESS '))return;
    try{
      const event=JSON.parse(text.slice(14));last=Date.now();stage=event.stage;
      fs.appendFileSync(progressFile,JSON.stringify(event)+'\n');
      if(!['painting chunk','painted chunk'].includes(stage)||event.id%8===0)console.log(JSON.stringify({suite,seconds:Math.round((last-started)/1000),...event}));
    }catch(e){console.error('Progress message: '+e.message)}
  });
  let result;
  try{
    const stopped=new Promise((_,reject)=>{
      watchdog=setInterval(()=>{if(Date.now()-last>stall||Date.now()-started>total)reject(Error('Watchdog at '+stage))},1000);
    });
    await Promise.race([(async()=>{
      await page.goto('http://127.0.0.1:'+port+'/prototype/Ashmark.html?test='+suite+'&seed=1',{waitUntil:'domcontentloaded',timeout:0});
      await page.waitForSelector('#OUT',{timeout:0});
    })(),stopped]);
    const report=await page.locator('#OUT').textContent(),fails=report.split('\n').filter(s=>/^(FAIL|EXC|ERR)/.test(s));
    fs.writeFileSync(path.join(out,suite.replace('/','-')+'.txt'),report);
    result={suite,pass:(report.match(/^PASS /gm)||[]).length,fails,errors,seconds:(Date.now()-started)/1000};
    if(fails.length||errors.length)process.exitCode=1;
  }catch(e){result={suite,error:e.message,stage,errors,seconds:(Date.now()-started)/1000};process.exitCode=1}
  finally{clearInterval(watchdog);await page.close()}
  fs.writeFileSync(path.join(out,suite.replace('/','-')+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
(async()=>{
  console.log('Reports: '+out);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({executablePath:browserPath,headless:true,args:['--no-sandbox']});
    const queue=suites.slice();await Promise.all(Array.from({length:Math.min(jobs,queue.length)},async()=>{
      while(queue.length)await runSuite(browser,queue.shift(),server.address().port);
    }));
  }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
