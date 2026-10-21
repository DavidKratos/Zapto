import {neon} from '@neondatabase/serverless';
import worker from './worker.mjs';
import {database} from './adapter.js';
export default async function handler(req,res){
 try{
 const hostname=process.env.VERCEL_URL;
 const host=hostname||req.headers.host;
 const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):value);
 // Origin comparison follows the actual requested deployment/custom domain.
 const origin='https://'+req.headers.host;
 const body=['GET','HEAD'].includes(req.method)?undefined:JSON.stringify(req.body);
 const request=new Request(origin+req.url,{method:req.method,headers,body});
 const env={...process.env,DB:process.env.DATABASE_URL?database(neon(process.env.DATABASE_URL)):undefined};
 const response=await worker.fetch(request,env);
 response.headers.forEach((value,key)=>res.setHeader(key,value));res.status(response.status).send(await response.text());
 }catch{res.status(503).json({error:'Unable to process this request. Please call Zapto at 9092348258 before trying again.'})}
}
