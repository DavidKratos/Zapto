import { assets, services } from './assets.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/config')return json({enabled:!!(env.DB&&env.RESEND_API_KEY&&env.EMAIL_FROM&&env.TURNSTILE_SECRET_KEY&&env.TURNSTILE_SITE_KEY),siteKey:env.TURNSTILE_SITE_KEY||''});
 if(url.pathname==='/api/requests'){
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(request.headers.get('Origin')!==url.origin)return json({error:'Origin rejected'},403);
  if(!(env.DB&&env.RESEND_API_KEY&&env.EMAIL_FROM&&env.TURNSTILE_SECRET_KEY))return json({error:'Online requests are not configured. Please call 9092348258.'},503);
  if(Number(request.headers.get('Content-Length'))>16000)return json({error:'Request too large'},413);
  let b;try{const raw=await request.text();if(raw.length>16000)return json({error:'Request too large'},413);b=JSON.parse(raw)}catch{return json({error:'Invalid request'},400)}
  if(!/^[a-f0-9-]{36}$/i.test(b.id||'')||typeof b.name!=='string'||!b.name.trim()||b.name.length>100||!/^\+?[0-9 ()-]{10,16}$/.test(b.phone||'')||typeof b.address!=='string'||!b.address.trim()||b.address.length>1000||!/^\d{4}-\d{2}-\d{2}$/.test(b.date||'')||!['9 am – 12 pm','12 pm – 3 pm','3 pm – 6 pm'].includes(b.time)||typeof b.notes!=='string'||b.notes.length>2000||!Array.isArray(b.items)||!b.items.length||b.items.length>58||b.items.some(i=>!services[i.id]||!Number.isInteger(i.qty)||i.qty<1||i.qty>20))return json({error:'Please check your details and selected services.'},400);
  const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:b.token||''})});
  if(!(await verification.json()).success)return json({error:'Please complete the security check again.'},400);
  const entries=b.items.map(i=>({...services[i.id],qty:i.qty}));const total=entries.reduce((n,i)=>n+i.price*i.qty,0);
  // Store once before notifying; repeated submissions never send duplicate notifications.
  const inserted=await env.DB.prepare('INSERT OR IGNORE INTO requests (id, payload, email_status, sms_status) VALUES (?, ?, ?, ?)').bind(b.id,JSON.stringify({...b,token:undefined,items:entries,total}),'pending','disabled').run();
  if(!inserted.meta.changes)return json({id:b.id,status:'received',message:'This request was already received. Please call Zapto for updates.'});
  const text=[`Zapto request ${b.id}`,`Name: ${b.name}`,`Phone: ${b.phone}`,`Address: ${b.address}`,`Preferred visit: ${b.date}, ${b.time}`,...entries.map(i=>`${i.name} x ${i.qty}: from INR ${i.price*i.qty}`),`Starting estimate: INR ${total}`,`Notes: ${b.notes}`,'Visit and final quote require confirmation.'].join('\n');
  const tasks=[async()=>{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':b.id},body:JSON.stringify({from:env.EMAIL_FROM,to:['itsmedavidraj@gmail.com'],subject:`Zapto service request ${b.id}`,text})});if(!r.ok)throw Error('Email provider rejected');}];
  const result=await Promise.allSettled(tasks.map(f=>f()));const states=[result[0].status==='fulfilled'?'accepted':'failed','disabled'];
  await env.DB.prepare('UPDATE requests SET email_status=?, sms_status=? WHERE id=?').bind(...states,b.id).run();
  return json({id:b.id,status:'received',notifications:{email:states[0],sms:states[1]},message:states[0]==='accepted'?'Request received. Zapto will confirm availability and the final quote.':'Request saved, but an owner notification failed. Please call 9092348258 with your request ID.'},201);
 }
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
 const asset=assets[url.pathname==='/'?'/index.html':url.pathname];return asset?new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff'}}):new Response('Not found',{status:404});
}};
