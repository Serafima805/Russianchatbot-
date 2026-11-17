export function encodePCM(samples,rate){
  const step=rate/16000, count=Math.floor(samples.length/step), bytes=new Uint8Array(count*2),view=new DataView(bytes.buffer);
  for(let i=0;i<count;i++){const start=Math.floor(i*step),end=Math.min(samples.length,Math.floor((i+1)*step));let sum=0;for(let j=start;j<end;j++)sum+=samples[j];const s=Math.max(-1,Math.min(1,sum/Math.max(1,end-start)));view.setInt16(i*2,s<0?s*32768:s*32767,true);}
  let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary);
}
export function decodePCM(base64){const b=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const v=new DataView(b.buffer),out=new Float32Array(Math.floor(b.length/2));for(let i=0;i<out.length;i++)out[i]=v.getInt16(i*2,true)/32768;return out;}
