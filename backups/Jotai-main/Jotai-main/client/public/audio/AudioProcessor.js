class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (event) => {
      // Handle any messages sent from the AudioWorkletNode (if needed)
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const inputData = input[0]; // Getting the first channel's data
      const float32Data = new Float32Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        float32Data[i] = inputData[i]; // Send raw float data
      }
      // Send the data to the WebSocket if it's open
      if (this.port && this.port.onmessage) {
        this.port.postMessage(float32Data.buffer); // Send ArrayBuffer
      }
    }
    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
