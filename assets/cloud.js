/* Optional Supabase backup. Authentication tokens stay in memory and expire normally.
   Backups are explicit snapshots, not automatic multi-device merging. */
let cloudSession = null;
let cloudRevision = null;
let cloudBusy = false;
function cloudConfig() {
  const c = window.INTERVIEW_LAB_CONFIG || {};
  if (!c.supabaseUrl || !c.supabasePublishableKey) return null;
  const url = new URL(c.supabaseUrl);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) throw Error('Use your HTTPS Supabase project URL.');
  if (c.supabasePublishableKey.startsWith('sb_secret_')) throw Error('A secret key must never be used in the browser.');
  // Reject legacy service-role JWTs too. The public anon JWT remains supported.
  try { if (JSON.parse(atob(c.supabasePublishableKey.split('.')[1])).role === 'service_role') throw Error('Service role key'); }
  catch (e) { if (e.message === 'Service role key') throw Error('Remove the service-role key from config.js.'); }
  return {url:url.origin, key:c.supabasePublishableKey};
}
function cloudView(v) {
  let config;try{config=cloudConfig()}catch(e){v.innerHTML=heading('CLOUD BACKUP','Configuration needs attention.',esc(e.message));return}
  v.innerHTML=heading('OPTIONAL PERSISTENT STORAGE','Keep your practice beyond this browser.','Study material lives in GitHub. Personal progress can be backed up to your Supabase account.')+
    (!config ? `<div class="card"><h2>Supabase is not connected yet</h2><p class="smalltext">Your browser progress and JSON exports work now. To enable cloud backups, follow docs/SUPABASE_SETUP.md in your repository and fill in config.js with your project URL and public publishable key.</p><div class="notice">No cloud backup has been created. Export your progress regularly until setup is complete.</div></div>` :
    `<div class="card"><h2>${cloudSession?'Signed in as '+esc(cloudSession.user.email):'Sign in to your backup account'}</h2>${cloudSession?`<p class="smalltext">Save uploads a snapshot of this browser. Restore replaces this browser’s record with the cloud snapshot. Export a local backup before restoring. Updates from another device are protected by a revision check.</p><div class="actions"><button class="btn" onclick="cloudSave()">Save cloud backup</button><button class="btn secondary" onclick="cloudRestore()">Restore cloud backup</button><button class="btn secondary" onclick="exportData()">Export local backup</button><button class="btn secondary" onclick="cloudSignOut()">Sign out</button></div>`:`<form onsubmit="event.preventDefault();cloudSignIn()"><div style="display:grid;gap:12px;max-width:420px;margin-top:18px"><label>Email<input id="cloudEmail" style="display:block;width:100%;margin-top:6px" type="email" autocomplete="username" required></label><label>Password<input id="cloudPassword" style="display:block;width:100%;margin-top:6px" type="password" autocomplete="current-password" required></label><button class="btn" type="submit">Sign in</button></div></form><p class="smalltext">Create your user in Supabase first. Sign in again after refreshing this page; this app does not persist your login token.</p>`}<p id="cloudStatus" class="smalltext" role="status"></p></div>`)+`<div class="callout">Cloud backups are manual. Changes made after your last backup remain browser-local until you select Save cloud backup. This is a single-record snapshot, not live synchronization.</div>`;
}
function cloudStatus(message) { const el=document.getElementById('cloudStatus');if(el)el.textContent=message;else toast(message); }
async function cloudRequest(path, options={}) {
  const c=cloudConfig();if(!c)throw Error('Supabase is not configured.');
  const headers={apikey:c.key,'Content-Type':'application/json',...options.headers};
  if (cloudSession) headers.Authorization='Bearer '+cloudSession.access_token;
  const response=await fetch(c.url+path,{...options,headers});
  const raw=await response.text();let body;try{body=raw?JSON.parse(raw):null}catch{body=null}
  if(!response.ok) {
    if(response.status===401) throw Error('Sign in again; your session may have expired.');
    if(response.status===409) throw Error('A cloud backup already exists. Restore it before saving from this device.');
    throw Error(body?.message||body?.error_description||'Cloud request failed ('+response.status+').');
  }
  return body;
}
async function cloudAction(fn) {
  if(cloudBusy)return;cloudBusy=true;cloudStatus('Working…');
  try{await fn()}catch(e){cloudStatus(e.message)}finally{cloudBusy=false}
}
async function cloudSignIn(){return cloudAction(async()=>{
  const email=document.getElementById('cloudEmail').value.trim(),password=document.getElementById('cloudPassword').value;
  const session=await cloudRequest('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
  cloudSession=session;cloudRevision=null;render();cloudStatus('Signed in. Restore an existing backup before saving, or save your first backup.');
})}
async function cloudSignOut(){return cloudAction(async()=>{
  await cloudRequest('/auth/v1/logout',{method:'POST'});cloudSession=null;cloudRevision=null;render();cloudStatus('Signed out. Browser progress is still saved.');
})}
async function cloudSave(){return cloudAction(async()=>{
  if(!cloudSession)throw Error('Sign in first.');
  const owner=encodeURIComponent(cloudSession.user.id);
  const snapshot=normalizeState(JSON.parse(JSON.stringify(state)));
  if(cloudRevision===null){
    // INSERT only. A unique-key conflict prevents a blind overwrite by a new device.
    const rows=await cloudRequest('/rest/v1/practice_backups',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({user_id:cloudSession.user.id,payload:snapshot,revision:1})});
    cloudRevision=rows[0].revision;
  }else{
    const rows=await cloudRequest('/rest/v1/practice_backups?user_id=eq.'+owner+'&revision=eq.'+cloudRevision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({payload:snapshot,revision:cloudRevision+1,updated_at:new Date().toISOString()})});
    if(!rows.length)throw Error('Cloud backup changed on another device. Export this browser’s progress, then restore the latest backup before saving again.');
    cloudRevision=rows[0].revision;
  }
  cloudStatus('Cloud backup saved successfully. Revision '+cloudRevision+'.');
})}
async function cloudRestore(){return cloudAction(async()=>{
  if(!cloudSession)throw Error('Sign in first.');
  const rows=await cloudRequest('/rest/v1/practice_backups?select=payload,revision,updated_at&user_id=eq.'+encodeURIComponent(cloudSession.user.id));
  if(!rows.length){cloudRevision=null;cloudStatus('No cloud backup yet. Save your first backup from the device with your progress.');return}
  const restored=normalizeState(rows[0].payload);
  if(!confirm('Replace this browser’s progress with your cloud backup? Export this browser’s record first if you need to keep it.')){cloudStatus('Restore cancelled.');return}
  // Keep an additional local recovery snapshot. Regular JSON exports are still recommended.
  localStorage.setItem('interviewlab-before-cloud-restore',JSON.stringify(state));
  state=restored;save();cloudRevision=rows[0].revision;render();cloudStatus('Restored cloud backup from '+new Date(rows[0].updated_at).toLocaleString()+'.');
})}
