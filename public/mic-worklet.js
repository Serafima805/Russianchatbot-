class Microphone extends AudioWorkletProcessor {
  constructor(){super();this.samples=[];}
  process(inputs,outputs){
    const input=inputs[0]?.[0];
    if(input){this.samples.push(...input);if(this.samples.length>=2048){this.port.postMessage(new Float32Array(this.samples));this.samples=[];}}
    return true;
  }
}
registerProcessor('microphone',Microphone);
