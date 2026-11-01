export const encodeWav = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = reader.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const numOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length * numOfChannels * 2;
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);

        // RIFF chunk descriptor
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(view, 8, 'WAVE');

        // fmt sub-chunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM format
        view.setUint16(22, numOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numOfChannels * 2, true);
        view.setUint16(32, numOfChannels * 2, true);
        view.setUint16(34, 16, true); // 16-bit

        // data sub-chunk
        writeString(view, 36, 'data');
        view.setUint32(40, length, true);

        // write PCM samples
        let offset = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
          for (let channel = 0; channel < numOfChannels; channel++) {
            let sample = audioBuffer.getChannelData(channel)[i];
            sample = Math.max(-1, Math.min(1, sample));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, sample, true);
            offset += 2;
          }
        }

        const wavBlob = new Blob([view], { type: 'audio/wav' });
        const wavReader = new FileReader();
        wavReader.onload = () => {
          const result = wavReader.result as string;
          resolve(result.split(',')[1]); // return base64 part
        };
        wavReader.onerror = reject;
        wavReader.readAsDataURL(wavBlob);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
