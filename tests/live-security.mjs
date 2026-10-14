// Explicitly run against the owner's site; never creates users, orders or payments.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const origin = 'https://campusbucket.live';
const provider = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert.equal(provider, 'https://zbdezzafnqwmqmdxdmmo.supabase.co');
assert.ok(key, 'Load the existing public Supabase environment variables');
const checks = [];
async function check(name, run) {
  try { await run(); checks.push({name, passed:true}); }
  catch (error) { checks.push({name, passed:false, error:error.message}); }
}
for (const path of ['/.env.local','/.git/config','/supabase/schema.sql','/output/campus-bucket-source.zip','/google-login.html','/_next/source.map','/%2eenv'])
  await check(`private file ${path}`, async () => assert.equal((await fetch(origin+path)).status,404));
await check('anonymous admin access and spoofed middleware headers',async()=>{
  for (const headers of [{},{'x-middleware-subrequest':'middleware:middleware:middleware:middleware:middleware'}]) {
    const r=await fetch(origin+'/admin',{headers,redirect:'manual'});
    assert.ok([302,303,307,308].includes(r.status));
    assert.equal(new URL(r.headers.get('location'),origin).pathname,'/login');
  }
});
await check('private account pages are not cached',async()=>{
  const r=await fetch(origin+'/login'); assert.match(r.headers.get('cache-control')||'',/no-store/);
  assert.equal(r.headers.get('x-frame-options'),'DENY');
  assert.equal(r.headers.get('x-content-type-options'),'nosniff');
  assert.match(r.headers.get('strict-transport-security')||'',/max-age=/);
  const csp=r.headers.get('content-security-policy')||'';
  assert.match(csp,/nonce-/);assert.match(csp,/frame-ancestors 'none'/);assert.ok(!csp.includes('unsafe-eval'));
});
await check('cross-origin account writes rejected',async()=>{
  const r=await fetch(origin+'/api/account/signup',{method:'POST',headers:{origin:'https://attacker.example','content-type':'application/json'},body:'{}'});
  assert.equal(r.status,403);assert.equal(r.headers.get('access-control-allow-origin'),null);
});
for (const table of ['orders','users','admin_users']) await check(`anonymous ${table} access rejected`,async()=>{
  const r=await fetch(`${provider}/rest/v1/${table}?select=*&limit=1`,{headers:{apikey:key}});
  assert.ok([401,403].includes(r.status));
});
await check('forged user token rejected',async()=>{
  const r=await fetch(`${provider}/rest/v1/orders?select=id&limit=1`,{headers:{apikey:key,authorization:'Bearer eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYXV0aGVudGljYXRlZCIsInN1YiI6IjExMTExMTExLTExMTEtNDExMS04MTExLTExMTExMTExMTExMSJ9.'}});
  assert.equal(r.status,401);
});
await check('anonymous privileged RPC rejected',async()=>{
  const r=await fetch(`${provider}/rest/v1/rpc/save_kit`,{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify({p_kit:{}})});
  assert.ok([401,403].includes(r.status));
});
// Invalid email never reaches SMTP. The edge limiter is approximate and permits brief bursts.
await check('account gateway limits repeated invalid requests',async()=>{
  const statuses=[];
  for(let i=0;i<12;i++) {
    statuses.push((await fetch(origin+'/api/account/signup',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:'invalid'})})).status);
    if (statuses.at(-1) === 429) break;
    await new Promise(resolve => setTimeout(resolve,300));
  }
  assert.ok(statuses.every(status=>[400,429].includes(status)));
  assert.ok(statuses.includes(429),'Expected sustained invalid attempts to be rate limited');
});
writeFileSync('output/live-security-audit.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));
console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.passed).length,failures:checks.filter(c=>!c.passed)}));
assert.ok(checks.every(c=>c.passed),'Live security checks failed');
