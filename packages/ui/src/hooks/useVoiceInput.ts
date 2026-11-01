import { useState, useRef } from 'react';
import { transcribeAudio } from '@/lib/openai';
import { toast } from 'sonner';
import { translate } from '@/i18n';

export const useVoiceInput = (onTranscriptionComplete: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleMicrophoneToggle = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
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

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 'voice_prompt.webm', { type: 'audio/webm' });

          setIsTranscribing(true);
          toast.info(translate('Transcribing audio...'));

          try {
            const transcribedText = await transcribeAudio(audioFile);
            if (transcribedText) {
              onTranscriptionComplete(transcribedText);
              toast.success(translate('Transcription complete!'));
            } else {
              toast.error(translate('Transcription failed.'));
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast.error(translate('An error occurred during transcription.'));
          } finally {
            setIsTranscribing(false);
          }
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
    isTranscribing,
    handleMicrophoneToggle,
  };
};
