import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { transcribeAudio } from '@/lib/openai';
import { T, translate } from '@/i18n';

interface VoiceRecordingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptionComplete: (transcribedText: string) => void;
  onGenerateImage?: (prompt: string) => Promise<void>;
  apiKey?: string;
  showToolCalls?: boolean; // Show tool call progress
  onToolCallUpdate?: (toolCall: string) => void; // Tool call callback
}

export interface VoiceRecordingPopupHandle {
  addToolCall: (toolName: string) => void;
  setGenerating: (generating: boolean) => void;
}

const VoiceRecordingPopup = React.forwardRef<VoiceRecordingPopupHandle, VoiceRecordingPopupProps>(({
  isOpen,
  onClose,
  onTranscriptionComplete,
  onGenerateImage,
  apiKey,
  showToolCalls = false,
  onToolCallUpdate,
}, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const [currentTool, setCurrentTool] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    addToolCall: (toolName: string) => {
      const toolMessage = `🔧 ${toolName}`;
      setToolCalls(prev => [...prev, toolMessage]);
      setCurrentTool(toolName);
      onToolCallUpdate?.(toolName);
    },
    setGenerating: (generating: boolean) => {
      setIsGenerating(generating);
    }
  }));

  // Auto-start recording when dialog opens
  useEffect(() => {
    if (isOpen && !isRecording && !isTranscribing && !transcribedText) {
      startRecording();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options = { mimeType: 'audio/webm' };
      let mediaRecorder: MediaRecorder;

      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await handleRecordingStop();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.info(translate('Recording started...'));
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      toast.error(translate('Failed to access microphone. Please check permissions.'));
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleRecordingStop = async () => {
    setIsTranscribing(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size === 0) {
        throw new Error('No audio recorded');
      }

      // Create File object for transcription
      const audioFile = new File([audioBlob], 'recording.webm', {
        type: 'audio/webm',
      });

      // Transcribe audio
      const transcribedText = await transcribeAudio(audioFile, 'whisper-1', apiKey);

      if (!transcribedText) {
        throw new Error('Transcription failed');
      }

      setTranscribedText(transcribedText);
      onTranscriptionComplete(transcribedText);

      toast.success(translate('Transcription complete!'));

      // Auto-generate image if handler provided
      if (onGenerateImage) {
        try {
          await onGenerateImage(transcribedText);
          // Close popup after generation completes (if not showing tool calls)
          if (!showToolCalls) {
            setTimeout(() => {
              handleClose();
            }, 1000);
          }
        } catch (error: any) {
          console.error('Error generating image:', error);
          toast.error('Failed to generate image');
          setIsGenerating(false);
        }
      }
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      toast.error(translate('Failed to transcribe audio: ') + error.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setRecordingTime(0);
    setTranscribedText('');
    setToolCalls([]);
    setCurrentTool('');
    setIsGenerating(false);
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <T>Voice Recording</T>
          </DialogTitle>
          <DialogDescription>
            {isRecording && <T>Recording your voice... Click stop when done.</T>}
            {isTranscribing && <T>Transcribing audio...</T>}
            {isGenerating && showToolCalls && <T>Agent working...</T>}
            {transcribedText && !isGenerating && <T>Transcription complete!</T>}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          {/* Recording Indicator */}
          <div className="relative">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 animate-pulse'
                  : isTranscribing
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            >
              {isTranscribing ? (
                <Loader2 className="w-16 h-16 text-white animate-spin" />
              ) : isRecording ? (
                <Mic className="w-16 h-16 text-white" />
              ) : (
                <MicOff className="w-16 h-16 text-white" />
              )}
            </div>

            {/* Recording pulse effect */}
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                <div className="absolute inset-0 rounded-full bg-red-500 opacity-25"></div>
              </>
            )}
          </div>

          {/* Timer */}
          {isRecording && (
            <div className="text-3xl font-mono font-bold text-red-600">
              {formatTime(recordingTime)}
            </div>
          )}

          {/* Status Text */}
          <div className="text-center space-y-2 min-h-[100px]">
            {isRecording && (
              <p className="text-sm font-medium">
                <T>Recording in progress...</T>
              </p>
            )}
            {isTranscribing && (
              <p className="text-sm font-medium">
                <T>Transcribing audio...</T>
              </p>
            )}
            {transcribedText && !isGenerating && (
              <div className="max-w-md">
                <p className="text-sm font-medium mb-2">
                  <T>Transcribed text:</T>
                </p>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {transcribedText}
                </p>
              </div>
            )}
            
            {/* Tool Calls Progress */}
            {isGenerating && showToolCalls && (
              <div className="max-w-md space-y-2">
                <p className="text-sm font-medium mb-2">
                  <T>Agent Progress:</T>
                </p>
                <div className="text-left bg-muted p-3 rounded-md space-y-1 max-h-48 overflow-y-auto">
                  {toolCalls.map((call, index) => (
                    <div 
                      key={index} 
                      className={`text-xs ${index === toolCalls.length - 1 ? 'font-semibold text-primary' : 'text-muted-foreground'}`}
                    >
                      {call}
                    </div>
                  ))}
                  {currentTool && (
                    <div className="text-xs text-primary animate-pulse">
                      Working on: {currentTool}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            {isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="gap-2"
              >
                <MicOff className="w-5 h-5" />
                <T>Stop Recording</T>
              </Button>
            )}

            {!isRecording && !isTranscribing && !transcribedText && (
              <Button onClick={startRecording} size="lg" className="gap-2">
                <Mic className="w-5 h-5" />
                <T>Start Recording</T>
              </Button>
            )}

            <Button 
              onClick={handleClose} 
              size="lg" 
              variant="outline" 
              className="gap-2"
              disabled={isGenerating}
            >
              <X className="w-5 h-5" />
              <T>{isGenerating ? 'Close When Done' : 'Cancel'}</T>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

VoiceRecordingPopup.displayName = 'VoiceRecordingPopup';

export default VoiceRecordingPopup;

