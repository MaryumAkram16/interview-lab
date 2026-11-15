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
