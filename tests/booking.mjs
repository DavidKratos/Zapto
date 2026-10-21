import assert from 'node:assert/strict';
import worker from '../lib/worker.mjs';
const req=(body)=>new Request('https://zapto.test/api/requests',{method:'POST',headers:{Origin:'https://zapto.test','Content-Type':'application/json'},body:JSON.stringify(body)});
assert.equal((await worker.fetch(req({}),{})).status,503);
let stored=false,notifications=[];
const env={RESEND_API_KEY:'test',EMAIL_FROM:'test@example.com',TURNSTILE_SECRET_KEY:'test',TURNSTILE_SITE_KEY:'test',DB:{prepare(sql){return{bind(...args){return{async run(){if(sql.startsWith('INSERT')){if(stored)return{meta:{changes:0}};stored=true;return{meta:{changes:1}}}notifications=args;return{meta:{changes:1}}}}}}}}};
const savedFetch=globalThis.fetch;let sends=0;
globalThis.fetch=async(url,options)=>{if(url.includes('turnstile'))return Response.json({success:true});sends++;if(url.includes('resend')){const payload=JSON.parse(options.body);assert.equal(payload.to[0],'itsmedavidraj@gmail.com');assert.match(payload.text,/INR 158/);return Response.json({id:'email'})}throw Error('Unexpected provider call: '+url)};
try{
 assert.equal((await worker.fetch(req({}),env)).status,400);
 const body={id:'12345678-1234-1234-1234-123456789abc',name:'Test',phone:'9000000000',address:'Test address',date:'2026-11-01',time:'9 am – 12 pm',notes:'',items:[{id:'Electrical0',qty:2}],token:'test'};
 const r=await worker.fetch(req(body),env);assert.equal(r.status,201);assert.equal((await r.json()).notifications.sms,'disabled');assert.deepEqual(notifications.slice(0,2),['accepted','disabled']);
 await worker.fetch(req(body),env);assert.equal(sends,1,'Duplicate must not resend notifications');
 console.log('Passed: missing configuration, validation, server prices, notification recipients, email-only notifications, duplicate prevention.');
}finally{globalThis.fetch=savedFetch}
