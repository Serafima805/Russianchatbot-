import test from 'node:test';
import assert from 'node:assert/strict';
import {buildInstruction} from '../netlify/functions/session.mjs';
const settings={maxWeek:5,assignment:'Interview a classmate.'};
test('empty materials allow general beginner practice',()=>{
 const prompt=buildInstruction(settings,[],'');
 assert.match(prompt,/GENERAL BEGINNER PRACTICE/);
 assert.match(prompt,/Do not claim to know what the class has learned/);
 assert.doesNotMatch(prompt,/Use only vocabulary/);
});
test('eligible materials retain classroom restrictions and assignment',()=>{
 const prompt=buildInstruction(settings,[{file:'Week 5.pptx'}],'Меня зовут');
 assert.match(prompt,/Use only vocabulary/);
 assert.match(prompt,/through week 5/);
 assert.match(prompt,/Interview a classmate/);
 assert.match(prompt,/Меня зовут/);
 assert.doesNotMatch(prompt,/GENERAL BEGINNER PRACTICE/);
});
