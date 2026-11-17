import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import mammoth from 'mammoth';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse/lib/pdf-parse.js');
const root = 'classroom-materials';
const xml = new XMLParser({ignoreAttributes:false});
function texts(node) {
  if (!node || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([k,v]) => k === 'a:t' ? (Array.isArray(v)?v:[v]).map(t=>typeof t==='object'?String(t['#text']||''):String(t)) : (Array.isArray(v)?v:[v]).flatMap(texts));
}
async function walk(dir) {
  const result=[];
  for (const e of await fs.readdir(dir,{withFileTypes:true})) {
    const p=path.join(dir,e.name);
    if(e.isDirectory()) result.push(...await walk(p)); else result.push(p);
  }
  return result.sort();
}
const materials=[];
for (const file of await walk(root)) {
  if(path.basename(file).toLowerCase()==='readme.md') continue;
  const ext=path.extname(file).toLowerCase();
  if(!['.txt','.md','.pptx','.pdf','.docx'].includes(ext)) throw new Error(`Unsupported material: ${file}. Upload PPTX, PDF, DOCX, TXT or MD; unzip ZIP archives first.`);
  const buffer=await fs.readFile(file);
  let text='';
  if(ext==='.pptx') {
    const slides=new AdmZip(buffer).getEntries().filter(e=>/^ppt\/slides\/slide\d+\.xml$/.test(e.entryName)).sort((a,b)=>a.entryName.localeCompare(b.entryName,undefined,{numeric:true}));
    text=slides.map((s,i)=>{const value=texts(xml.parse(s.getData().toString())).join(' ').trim();return value?`Slide ${i+1}: ${value}`:'';}).filter(Boolean).join('\n');
  } else if(ext==='.docx') text=(await mammoth.extractRawText({buffer})).value;
  else if(ext==='.pdf') text=(await pdf(buffer)).text;
  else text=buffer.toString('utf8');
  if(!text.trim()) throw new Error(`No readable text in ${file}. Export image-only slides/scans as text first.`);
  const match=path.basename(file).match(/week[ _-]*(\d+)/i);
  if(!match) throw new Error(`Include Week N in the filename: ${file}`);
  materials.push({file:path.relative(root,file),week:Number(match[1]),text:text.trim()});
}
await fs.mkdir('generated',{recursive:true});
await fs.writeFile('generated/materials.json',JSON.stringify(materials));
console.log(`Extracted ${materials.length} classroom files.`);
