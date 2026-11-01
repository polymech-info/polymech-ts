import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { encodeWav } from '@/lib/audioUtils';

export interface NativeAudioResult {
  base64Wav: string;
  durationMs: number;
}

export const useNativeVoiceInput = (onRecordingComplete: (audio: NativeAudioResult) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const handleMicrophoneToggle = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstart = () => {
          startTimeRef.current = Date.now();
        };

        mediaRecorder.onstop = async () => {
          const durationMs = Date.now() - startTimeRef.current;
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          try {
            const base64Wav = await encodeWav(audioBlob);
            onRecordingComplete({ base64Wav, durationMs });
          } catch (error) {
            console.error('Error encoding audio to WAV:', error);
            toast.error(translate('Failed to encode audio.'));
          }

          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast.error(translate('Could not access microphone.'));
      }
    }
  };

  return {
    isRecording,
    handleMicrophoneToggle,
  };
};
