import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import AdmZip from 'adm-zip';
const script=path.resolve('scripts/materials.mjs');
test('extracts PPTX slide text in numeric order and rejects unnumbered material',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'russian-material-test-'));
 try{
 await fs.mkdir(path.join(dir,'classroom-materials'));
 const zip=new AdmZip();
 for(const n of [10,2])zip.addFile(`ppt/slides/slide${n}.xml`,Buffer.from(`<p:sld><a:t>Привет ${n}</a:t></p:sld>`));
 zip.writeZip(path.join(dir,'classroom-materials','Week 2.pptx'));
 execFileSync(process.execPath,[script],{cwd:dir});
 const materials=JSON.parse(await fs.readFile(path.join(dir,'generated/materials.json'),'utf8'));
 assert.equal(materials[0].week,2);assert.ok(materials[0].text.indexOf('Привет 2')<materials[0].text.indexOf('Привет 10'));
 await fs.writeFile(path.join(dir,'classroom-materials','advanced.txt'),'неизвестный');
 assert.throws(()=>execFileSync(process.execPath,[script],{cwd:dir,stdio:'pipe'}));
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
