import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/session.mjs';
test('session rejects invalid requests before contacting Google',async()=>{
 const oldKey=process.env.GEMINI_API_KEY,oldCode=process.env.CLASS_ACCESS_CODE;
 process.env.GEMINI_API_KEY='test';process.env.CLASS_ACCESS_CODE='secret';
 try{
 assert.equal((await handler(new Request('https://class.example/.netlify/functions/session'))).status,405);
 assert.equal((await handler(new Request('https://class.example/.netlify/functions/session',{method:'POST',headers:{origin:'https://other.example'},body:'{}'}))).status,403);
 assert.equal((await handler(new Request('https://class.example/.netlify/functions/session',{method:'POST',body:JSON.stringify({code:'wrong'})}))).status,401);
 }finally{if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;if(oldCode===undefined)delete process.env.CLASS_ACCESS_CODE;else process.env.CLASS_ACCESS_CODE=oldCode;}
});
