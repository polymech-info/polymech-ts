import React, { useRef, useState } from 'react';
import { usePublisher, insertImage$ } from '@mdxeditor/editor';
import { ImageIcon, Mic, MicOff, Loader2, Maximize, Minimize, Save } from 'lucide-react';
import { toast } from 'sonner';
import { T, translate } from '@/i18n';
import { transcribeAudio } from '@/lib/openai';
import { useLog } from '@/contexts/LogContext';

interface InsertCustomImageProps {
  onRequestImage: () => Promise<string>;
}

export function InsertCustomImage({ onRequestImage }: InsertCustomImageProps) {
  const insertImage = usePublisher(insertImage$);
  const { addLog } = useLog();

  const handleClick = async () => {
    console.log('InsertCustomImage: Button clicked');
    try {
      addLog('info', 'InsertCustomImage: Requesting image...');
      const imageUrl = await onRequestImage();
      addLog('info', `InsertCustomImage: Received imageUrl: ${imageUrl}`);
      if (imageUrl) {
        addLog('success', 'InsertCustomImage: Inserting image into editor');
        insertImage({
          src: imageUrl,
          altText: 'Selected image'
        });
      } else {
        addLog('error', 'InsertCustomImage: imageUrl is empty/undefined');
      }
    } catch (error) {
      console.error('InsertCustomImage: Failed to insert image', error);
      addLog('error', `InsertCustomImage: Failed to insert image - ${error}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center p-1 rounded hover:bg-accent transition-colors"
      title="Insert image from gallery"
    >
      <ImageIcon className="h-4 w-4" />
    </button>
  )
}

interface MicrophoneTranscribeProps {
  onTranscribed: (text: string) => void;
}

export function MicrophoneTranscribe({ onTranscribed }: MicrophoneTranscribeProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { addLog } = useLog();

  const handleToggle = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        addLog('info', 'MicrophoneTranscribe: Stopping recording...');
        mediaRecorderRef.current.stop();
      }
      return;
    }

    // Start recording
    try {
      addLog('info', 'MicrophoneTranscribe: Starting audio recording...');
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
        setIsRecording(false);
        setIsTranscribing(true);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

        try {
          addLog('info', 'MicrophoneTranscribe: Transcribing audio with Whisper...');
          const transcription = await transcribeAudio(audioFile, 'whisper-1');

          if (transcription) {
            addLog('success', `MicrophoneTranscribe: Transcription successful (${transcription.length} chars)`);
            onTranscribed(transcription);
            toast.success(translate('Audio transcribed successfully!'));
          } else {
            addLog('error', 'MicrophoneTranscribe: Transcription returned empty result');
            toast.error(translate('Failed to transcribe audio'));
          }
        } catch (error: any) {
          addLog('error', `MicrophoneTranscribe: Transcription failed - ${error.message}`);
          toast.error(translate('Error transcribing audio'));
        } finally {
          setIsTranscribing(false);
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      addLog('success', 'MicrophoneTranscribe: Recording started');
      toast.info(translate('Recording... Click again to stop'));
    } catch (error: any) {
      addLog('error', `MicrophoneTranscribe: Could not access microphone - ${error.message}`);
      toast.error(translate('Could not access microphone'));
      setIsRecording(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isTranscribing}
      className={`flex items-center justify-center p-1 rounded transition-colors ${isRecording
        ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
        : 'hover:bg-accent'
        }`}
      title={isTranscribing ? 'Transcribing...' : isRecording ? 'Stop recording' : 'Record audio'}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}

interface FullscreenToggleProps {
  isFullscreen: boolean;
  onToggle: () => void;
}

export function FullscreenToggle({ isFullscreen, onToggle }: FullscreenToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-center p-1 rounded hover:bg-accent transition-colors"
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? (
        <Minimize className="h-4 w-4" />
      ) : (
        <Maximize className="h-4 w-4" />
      )}
    </button>
  );
}

interface SaveButtonProps {
  onSave?: () => void;
}

export function SaveButton({ onSave }: SaveButtonProps) {
  const { addLog } = useLog();

  if (!onSave) return null;

  const handleClick = () => {
    addLog('info', 'SaveButton: Saving content...');
    onSave();
    addLog('success', 'SaveButton: Content saved successfully');
    toast.success(translate('Content saved!'));
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center p-1 rounded hover:bg-accent transition-colors"
      title="Save content (Ctrl+S)"
    >
      <Save className="h-4 w-4" />
    </button>
  );
}
