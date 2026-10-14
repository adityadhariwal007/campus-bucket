// Bounded public checks only: no accounts, listings, chat messages or emails are created.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const provider = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.equal(provider,'https://zbdezzafnqwmqmdxdmmo.supabase.co');assert.ok(key);
const results=[];
async function check(name,run){try{await run();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message});}}
for(const table of ['market_members','market_listings','market_threads','market_messages','market_meetups','market_contacts','market_saves','market_blocks','market_reports','market_notifications'])await check(`Anonymous ${table} access denied`,async()=>{const r=await fetch(`${provider}/rest/v1/${table}?select=*&limit=1`,{headers:{apikey:key}});assert.ok([401,403].includes(r.status),`Unexpected ${r.status}`);});
for(const [name,body]of [['market_read',{p_section:'feed'}],['market_action',{p_action:'join',p_data:{display_name:'Unauthorized probe'}}]])await check(`Anonymous ${name} denied`,async()=>{const r=await fetch(`${provider}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify(body)});assert.ok([401,403].includes(r.status),`Unexpected ${r.status}`);});
await check('Private marketplace bucket cannot be listed anonymously',async()=>{const r=await fetch(`${provider}/storage/v1/object/list/marketplace`,{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify({prefix:'',limit:1})});assert.ok([200,400,401,403].includes(r.status));const body=await r.json();if(r.status===200)assert.deepEqual(body,[]);else assert.ok(body.error||body.message||body.statusCode);});
const origin='https://campusbucket.live';
for(const path of ['/marketplace','/marketplace/guide','/marketplace/sell','/marketplace/mine','/marketplace/inbox'])await check(`Live page ${path}`,async()=>{const r=await fetch(origin+path);assert.equal(r.status,200);assert.match(r.headers.get('cache-control')||'',/no-store/);assert.equal(r.headers.get('x-frame-options'),'DENY');assert.match(r.headers.get('content-security-policy')||'',/nonce-/);const html=await r.text();assert.ok(!html.includes('Internal Server Error'));});
await check('Marketplace moderation requires sign-in',async()=>{const r=await fetch(origin+'/admin/marketplace',{redirect:'manual'});assert.ok([302,303,307,308].includes(r.status));assert.equal(new URL(r.headers.get('location'),origin).pathname,'/login');});
for(const path of ['/supabase/marketplace.sql','/supabase/marketplace-email.sql','/.env.local'])await check(`Source file ${path} stays private`,async()=>assert.equal((await fetch(origin+path)).status,404));
mkdirSync('output',{recursive:true});writeFileSync('output/marketplace-live-checks.json',JSON.stringify({at:new Date().toISOString(),results},null,2));console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.passed).length,failures:results.filter(r=>!r.passed)}));assert.ok(results.every(r=>r.passed));
