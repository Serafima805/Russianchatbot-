import {GoogleGenAI} from '@google/genai';
import {encodePCM,decodePCM} from './audio.js';
import './style.css';
const $=id=>document.getElementById(id);
let session,stream,ctx,mic,source,timer,muted=false,active=false,connecting=false,nextTime=0,sources=new Set(),rows=[],current={};
function status(text){$('status').textContent=text;}
function captions(role,text){if(!text)return;if(!current[role]){const p=document.createElement('p');p.className=role==='Anna'?'anna':'student';$('transcript').append(p);const row={role,text:'',p};rows.push(row);current[role]=row;}current[role].text+=text;current[role].p.textContent=role+': '+current[role].text;$('download').disabled=false;}
function clearAudio(){for(const s of sources){try{s.stop();}catch{}}sources.clear();nextTime=0;}
async function finish(message='Conversation finished. You can download your transcript.'){
  active=false;connecting=false;clearTimeout(timer);try{session?.close();}catch{}session=null;
  mic?.disconnect();source?.disconnect();stream?.getTracks().forEach(t=>t.stop());clearAudio();if(ctx&&ctx.state!=='closed')await ctx.close();ctx=null;
  $('start').disabled=false;$('stop').disabled=true;$('mute').disabled=true;status(message);
}
function receive(message){
  if(!active)return;
  const c=message.serverContent;if(!c)return;
  if(c.interrupted){clearAudio();current={};}
  captions('You',c.inputTranscription?.text);captions('Anna',c.outputTranscription?.text);
  for(const part of c.modelTurn?.parts||[]){if(part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/pcm')){
    const samples=decodePCM(part.inlineData.data),rate=Number(part.inlineData.mimeType.match(/rate=(\d+)/)?.[1]||24000),buffer=ctx.createBuffer(1,samples.length,rate);buffer.copyToChannel(samples,0);
    const s=ctx.createBufferSource();s.buffer=buffer;s.connect(ctx.destination);nextTime=Math.max(nextTime,ctx.currentTime);s.start(nextTime);nextTime+=buffer.duration;sources.add(s);s.onended=()=>sources.delete(s);
  }}
  if(c.turnComplete)current={};
}
$('start').onclick=async()=>{
  if(active||connecting)return;connecting=true;$('start').disabled=true;status('Connecting…');
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Use a modern browser on the secure Netlify website.');
    ctx=new AudioContext();await ctx.resume();
    stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const response=await fetch('/.netlify/functions/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:$('code').value})});
    const data=await response.json();if(!response.ok)throw new Error(data.error);
    await ctx.audioWorklet.addModule('/mic-worklet.js');
    const ai=new GoogleGenAI({apiKey:data.token,httpOptions:{apiVersion:data.apiVersion}});
    active=true;
    session=await ai.live.connect({model:data.model,config:{responseModalities:['AUDIO']},callbacks:{onmessage:receive,onerror:()=>void finish('Connection error. Please start again.'),onclose:()=>{if(active)void finish('Connection ended. Download your transcript or start again.');}}});
    if(!active){session.close();return;}
    source=ctx.createMediaStreamSource(stream);mic=new AudioWorkletNode(ctx,'microphone');
    mic.port.onmessage=e=>{if(active&&!muted&&session){try{session.sendRealtimeInput({audio:{data:encodePCM(e.data,ctx.sampleRate),mimeType:'audio/pcm;rate=16000'}});}catch{void finish('Audio connection ended. Please start again.');}}};
    source.connect(mic);mic.connect(ctx.destination);
    rows=[];current={};$('transcript').replaceChildren();$('download').disabled=true;muted=false;$('mute').textContent='Mute microphone';$('stop').disabled=false;$('mute').disabled=false;connecting=false;
    $('materials').textContent=data.practiceMode==='general'?'General beginner practice — classroom materials have not been added for the active week.':'Course materials: '+data.files.join(', ');
    status('Connected — listen to Anna, then answer in Russian.');
    session.sendRealtimeInput({text:'Begin the five-question practice now, following your system instructions. Greet me briefly and ask the first question.'});
    timer=setTimeout(()=>void finish('Practice time is complete. Download your transcript.'),data.minutes*60000);
  }catch(e){await finish(e.name==='NotAllowedError'?'Microphone permission was denied. Allow it in your browser, then try again.':e.message||'Could not connect. Please try again.');}
};
$('mute').onclick=()=>{muted=!muted;stream?.getAudioTracks().forEach(t=>t.enabled=!muted);if(muted)session?.sendRealtimeInput({audioStreamEnd:true});$('mute').textContent=muted?'Unmute microphone':'Mute microphone';status(muted?'Microphone muted.':'Listening — answer in Russian.');};
$('stop').onclick=()=>void finish();
$('download').onclick=()=>{const url=URL.createObjectURL(new Blob([rows.map(r=>r.role+': '+r.text).join('\n\n')],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='russian-practice-transcript.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('pagehide',()=>{active=false;stream?.getTracks().forEach(t=>t.stop());try{session?.close();}catch{}});
