import test from 'node:test';
import assert from 'node:assert/strict';
import {encodePCM,decodePCM} from '../src/audio.js';
import {equal} from '../netlify/functions/session.mjs';
test('PCM resamples 48kHz to 16kHz and preserves signed amplitude',()=>{const x=new Float32Array(4800).fill(-0.5);const y=decodePCM(encodePCM(x,48000));assert.equal(y.length,1600);assert.ok(Math.abs(y[500]+0.5)<0.001);});
test('PCM clamps out-of-range samples',()=>{const y=decodePCM(encodePCM(new Float32Array([2,-2]),16000));assert.ok(y[0]<=1 && y[0]>.99);assert.equal(y[1],-1);});
test('access code equality rejects mismatches and different lengths',()=>{assert.ok(equal('class secret','class secret'));assert.ok(!equal('secret','secrex'));assert.ok(!equal('secret',''));});
