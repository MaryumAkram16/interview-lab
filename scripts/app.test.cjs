const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function harness(){
 const elements=new Map(),storage=new Map();
 const context={console,URL,Blob,setTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},confirm:()=>true,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  window:{scrollTo:()=>{},INTERVIEW_LAB_CONFIG:{supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'sb_publishable_test'}},
  document:{querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',value:'',style:{}});return elements.get(s)},getElementById:s=>context.document.querySelector('#'+s)},
  fetch:async()=>{throw Error('No network in tests')},navigator:{clipboard:{writeText:async()=>{}}},atob:s=>Buffer.from(s,'base64').toString()};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'assets/cloud.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(root,'assets/app.js'),'utf8').replace(/boot\(\);\s*$/,''),context);
 context.content=Object.fromEntries(['topics','questions','cheat-sheets','cheatsheet-catalog','learning-resources'].map(n=>[n,JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'))]));
 vm.runInContext('topics=content.topics;bank=content.questions;cheats=content["cheat-sheets"];sheetCatalog=content["cheatsheet-catalog"];learningResources=content["learning-resources"];',context);
 return {context,run:s=>vm.runInContext(s,context),elements};
}
test('legacy numeric backups migrate without losing answers or notes',()=>{
 const {run}=harness();const data=run(`normalizeState({attempts:[{id:0,rating:'Needs retry',date:'2026-11-15T00:00:00Z',answer:'original',note:'fix edge case',minutes:2}],drafts:{0:'draft'},notes:{0:'note'}})`);
 assert.equal(data.attempts[0].id,'q-001');assert.equal(data.drafts['q-001'],'draft');assert.equal(data.notes['q-001'],'note');
});
test('question reorder preserves confidence and retry mapping by stable ID',()=>{
 const {run}=harness();run(`state.attempts=[{id:'q-001',rating:'Needs retry'}];bank.reverse()`);
 assert.equal(run('bank[queue()[0].i].id'),'q-001');
 run(`state.attempts.push({id:'q-001',rating:'Confident'})`);
 assert.equal(run('queue().length'),0);assert.equal(run('mastery(0)'),50);
});
test('all workspace views render and guided steps survive reordering',()=>{
 const {run,elements}=harness();for(const p of ['Overview','Guided sessions','Question box','Coding practice','Review queue','Progress','Cheat sheets','Practice & Learn','Cloud backup']){run('go('+JSON.stringify(p)+')');assert(elements.get('#view').innerHTML.length>100,p)}
 run('bank.reverse();startSession()');assert.equal(run('bank[active].id'),'q-002');
});
test('malformed imports are rejected and unknown archived questions retained',()=>{
 const {run}=harness();assert.throws(()=>run(`normalizeState({attempts:[{id:'q-001',rating:'<script>',answer:'x',date:'bad',minutes:0}],drafts:{},notes:{}})`));
 assert.equal(run(`normalizeState({attempts:[{id:'q-retired',rating:'Confident',answer:'old',date:'2026-11-15',minutes:0}],drafts:{},notes:{}}).attempts[0].answer`),'old');
});
test('cloud writes use optimistic revision checks and reject stale updates',async()=>{
 const {context,run,elements}=harness();let request;
 context.fetch=async(url,options)=>{request={url,options};return {ok:true,text:async()=>JSON.stringify([])}};
 run(`cloudSession={access_token:'test',user:{id:'user-a',email:'a@example.com'}};cloudRevision=3;page='Cloud backup';render()`);
 await run('cloudSave()');assert.match(request.url,/revision=eq.3/);assert.equal(JSON.parse(request.options.body).revision,4);
 assert.match(elements.get('#cloudStatus').textContent,/another device/);assert.equal(run('cloudRevision'),3);
});
test('new devices insert rather than overwrite an existing backup',async()=>{
 const {context,run,elements}=harness();let request;
 context.fetch=async(url,options)=>{request={url,options};return {ok:false,status:409,text:async()=>JSON.stringify({})}};
 run(`cloudSession={access_token:'test',user:{id:'user-a',email:'a@example.com'}};page='Cloud backup';render()`);
 await run('cloudSave()');assert.equal(request.options.method,'POST');assert.match(elements.get('#cloudStatus').textContent,/Restore it before saving/);
});
test('cloud restore cancellation leaves browser state intact',async()=>{
 const {context,run}=harness();context.confirm=()=>false;
 context.fetch=async()=>({ok:true,text:async()=>JSON.stringify([{revision:4,updated_at:'2026-11-15',payload:{attempts:[],drafts:{},notes:{}}}])});
 run(`cloudSession={access_token:'test',user:{id:'a'}};state.drafts['q-001']='keep me';page='Cloud backup';render()`);
 await run('cloudRestore()');assert.equal(run(`state.drafts['q-001']`),'keep me');assert.equal(run('cloudRevision'),null);
});

test('sheet search and category filters include only matching original topics',()=>{
 const {run}=harness();assert.equal(run('catalogMatches().length'),25);
 run("sheetCategory='APIs & Reliability'");assert.equal(run('catalogMatches().length'),4);
 run("sheetSearch='backoff'");assert.equal(run('catalogMatches()[0].id'),'retry-backoff');
 run("sheetCategory='DSA & Python'");assert.equal(run('catalogMatches().length'),0);
 run("sheetCategory='All topics';sheetSearch='HaShInG'");assert.equal(run('catalogMatches()[0].id'),'hashing');
});
test('cheat sheet cards link to deployed HTML assets in a separate tab',()=>{
 const {run,elements}=harness();run("go('Cheat sheets')");
 const cards=elements.get('#sheetResults').innerHTML;
 assert.equal((cards.match(/class="catalog-item"/g)||[]).length,25);
 assert.match(cards,/href=".\/data\/cheatsheets\/hashing-cheat-sheet.html"/);
 assert.match(cards,/target="_blank" rel="noopener noreferrer"/);
});

test('topic groups are visibly separated and every sheet appears exactly once',()=>{
 const {run,elements}=harness();run("go('Cheat sheets')");
 assert.equal(run('catalogGroups(sheetCatalog).length'),6);
 assert.equal(run('new Set(catalogGroups(sheetCatalog).flatMap(group=>group.items.map(item=>item.id))).size'),25);
 const html=elements.get('#sheetResults').innerHTML;
 assert.equal((html.match(/class="catalog-topic"/g)||[]).length,6);
 for(const topic of ['DSA &amp; Python','APIs &amp; Reliability','Databases &amp; Concurrency','Applied AI &amp; LLMs','Machine Learning','Deep Learning'])assert(html.includes(topic));
 run("sheetCategory='Databases & Concurrency';renderCatalogResults()");
 assert.equal((elements.get('#sheetResults').innerHTML.match(/class="catalog-topic"/g)||[]).length,1);
 assert.equal(run('catalogMatches().length'),4);
});

test('resource filters combine topic, content and text preference',()=>{
 const {run}=harness();assert.equal(run('resourceMatches().length'),16);
 run("resourceTopic='Coding & Python'");assert.equal(run('resourceMatches().length'),4);
 run('resourceTextOnly=true');assert.equal(run('resourceMatches().length'),3);
 run("resourceTopic='All topics';resourceQuery='cross-validation'");assert.equal(run('resourceMatches()[0].id'),'sklearn-mooc');
 run("resourceQuery='not-a-real-resource'");assert.equal(run('resourceMatches().length'),0);
});
test('learning directory has five groups and safe external buttons',()=>{
 const {run,elements}=harness();run("go('Practice & Learn')");
 const markup=elements.get('#resourceResults').innerHTML;
 assert.equal((markup.match(/class="resource-card"/g)||[]).length,16);
 assert.equal((markup.match(/class="catalog-topic"/g)||[]).length,5);
 assert.equal((markup.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,16);
 assert.match(markup,/https:\/\/leetcode.com\/problemset\//);
 assert.match(markup,/Free \+ paid options/);
 run("resourceQuery='nothing matches';renderLearningResults()");assert.match(elements.get('#resourceResults').innerHTML,/No resources match/);
});
