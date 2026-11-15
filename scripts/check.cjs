const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
for(const f of ['assets/app.js','assets/cloud.js','config.js'])new vm.Script(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const topics=read('topics'),questions=read('questions'),sheets=read('cheat-sheets');
assert(topics.length===8,'Keep the eight topic indexes stable.');
const ids=new Set();
for(const q of questions){
 assert(/^q-[a-zA-Z0-9-]+$/.test(q.id)&&!ids.has(q.id),'Question IDs must be unique and stable.');ids.add(q.id);
 for(const f of ['title','q','s'])assert(typeof q[f]==='string'&&q[f].trim(),q.id+' needs '+f);
 assert(Number.isInteger(q.t)&&q.t>=0&&q.t<topics.length);
 assert(['Coding','Concept','Scenario'].includes(q.type));
 assert(Number.isFinite(q.min)&&q.min>0);
 assert(Array.isArray(q.h)&&q.h.length===2&&q.h.every(h=>typeof h==='string'&&h.trim()));
}
for(let i=1;i<=9;i++)assert(ids.has('q-'+String(i).padStart(3,'0')),'Retain seed questions used by guided sessions.');
for(const name of ['Backend','DSA'])assert(Array.isArray(sheets[name])&&sheets[name].every(row=>row.length===2&&row.every(x=>typeof x==='string')));
for(const f of ['assets/app.js','assets/cloud.js','assets/styles.css','config.js','index.html'])assert(fs.existsSync(path.join(root,f)));
console.log('JavaScript syntax, question IDs, topic mapping, cheat sheets and web assets verified.');

const crypto=require('node:crypto');
const catalog=read('cheatsheet-catalog'),catalogIds=new Set(),catalogPaths=new Set(),hashes=new Set();
assert(catalog.length>0,'Cheat sheet catalog must not be empty.');
for(const entry of catalog){
 assert(!catalogIds.has(entry.id)&&!catalogPaths.has(entry.path),'Duplicate catalog entry.');catalogIds.add(entry.id);catalogPaths.add(entry.path);
 assert(/^data\/cheatsheets\/[a-z0-9-]+\.html$/.test(entry.path),'Unsafe sheet path.');
 assert(typeof entry.title==='string'&&typeof entry.category==='string'&&typeof entry.keywords==='string');
 const bytes=fs.readFileSync(path.join(root,entry.path)),hash=crypto.createHash('sha256').update(bytes).digest('hex');
 assert.equal(entry.sha256,hash,'Original sheet hash mismatch: '+entry.path);assert(!hashes.has(hash),'Duplicate sheet content.');hashes.add(hash);
 assert(!/<(?:script|iframe|form)\b|\bon[a-z]+\s*=/i.test(bytes.toString()),'Active content in sheet.');
}
const diskSheets=fs.readdirSync(path.join(root,'data/cheatsheets')).filter(p=>p.endsWith('.html'));
assert.equal(diskSheets.length,catalog.length,'Unindexed sheet files.');
console.log(catalog.length+' unique, indexed cheat sheets verified with content hashes.');

const topicOrders=new Map();
for(const entry of catalog){
 assert(typeof entry.topic==='string'&&entry.topic.trim(),'Missing topic.');
 assert(Number.isInteger(entry.topicOrder)&&entry.topicOrder>0&&Number.isInteger(entry.order)&&entry.order>0,'Invalid topic ordering.');
 if(topicOrders.has(entry.topic))assert.equal(topicOrders.get(entry.topic),entry.topicOrder,'Inconsistent topic rank.');
 topicOrders.set(entry.topic,entry.topicOrder);
}
assert.equal(new Set(topicOrders.values()).size,topicOrders.size,'Each topic needs a distinct rank.');
console.log(topicOrders.size+' topic groups verified.');

const resources=read('learning-resources'),resourceIds=new Set(),resourceUrls=new Set();
for(const r of resources){
 assert(typeof r.id==='string'&&!resourceIds.has(r.id),'Duplicate resource ID.');resourceIds.add(r.id);
 const url=new URL(r.url);assert.equal(url.protocol,'https:');assert(!url.username&&!url.password,'Credentials in resource URL.');
 assert(!resourceUrls.has(url.href),'Duplicate learning resource.');resourceUrls.add(url.href);
 for(const field of ['title','provider','topic','format','level','access','description','startWith','accessNote','checkedAt'])assert(typeof r[field]==='string'&&r[field].trim(),'Missing resource '+field);
 assert.equal(typeof r.textFriendly,'boolean');assert(Array.isArray(r.sources)&&r.sources.includes(r.url));
 for(const source of r.sources)assert.equal(new URL(source).protocol,'https:');
}
assert(resources.length>0,'No learning resources.');
console.log(resources.length+' unique external learning resources and source URLs verified.');
