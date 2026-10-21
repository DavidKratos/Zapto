import fs from 'node:fs';
import vm from 'node:vm';
const dir=new URL('../public/',import.meta.url);
const assets={};for(const [file,type] of [['index.html','text/html; charset=utf-8'],['style.css','text/css'],['app.js','text/javascript']])assets['/'+file]={type,body:fs.readFileSync(new URL(file,dir),'utf8')};
const context=vm.createContext({});vm.runInContext(assets['/app.js'].body.split("let trade=")[0]+';globalThis.data=catalogue;',context);
const services={};for(const [trade,rows]of Object.entries(context.data))rows.forEach(([category,name,price],i)=>services[trade+i]={trade,category,name,price});
fs.writeFileSync(new URL('../lib/assets.mjs',import.meta.url),'export const assets='+JSON.stringify(assets)+';\nexport const services='+JSON.stringify(services)+';\n');
