import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/db';
import { updatePicture } from '@/modules/posts/client-pictures';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Mic, MicOff, Loader2, Bookmark } from 'lucide-react';
import MarkdownEditor from '@/components/MarkdownEditor';
import { transcribeAudio } from '@/lib/openai';
import { T, translate } from '@/i18n';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_public: boolean;
}

const editSchema = z.object({
  title: z.string().max(100, 'Title must be less than 100 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  visible: z.boolean(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  currentTitle: string;
  currentDescription: string | null;
  currentVisible: boolean;
  onUpdateSuccess: () => void;
}

const EditVideoModal = ({ 
  open, 
  onOpenChange, 
  videoId, 
  currentTitle, 
  currentDescription,
  currentVisible,
  onUpdateSuccess 
}: EditVideoModalProps) => {
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  
  // Microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Collections state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [loadingCollections, setLoadingCollections] = useState(false);

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: currentTitle,
      description: currentDescription || '',
      visible: currentVisible,
    },
  });

  // Load collections when modal opens
  useEffect(() => {
    if (open && user) {
      fetchCollections();
      fetchVideoCollections();
    }
  }, [open, user, videoId]);

  const fetchCollections = async () => {
    if (!user) return;

    setLoadingCollections(true);
    try {
      const data = await apiClient<Collection[]>(`/api/collections?userId=${user.id}`);
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error(translate('Failed to load collections'));
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchVideoCollections = async () => {
    if (!user) return;

    try {
      const data = await apiClient<{ collection_id: string }[]>(`/api/collection-pictures?pictureId=${videoId}`);
      setSelectedCollections(new Set(data.map(cp => cp.collection_id)));
    } catch (error) {
      console.error('Error fetching video collections:', error);
    }
  };

  const handleCollectionToggle = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  const onSubmit = async (data: EditFormData) => {
    if (!user) return;

    setUpdating(true);
    try {
      await updatePicture(videoId, {
        title: data.title?.trim() || null,
        description: data.description?.trim() || null,
        visible: data.visible,
        updated_at: new Date().toISOString(),
      } as any);

      try {
        await apiClient('/api/collection-pictures', {
          method: 'DELETE',
          body: JSON.stringify({ picture_id: videoId, deleteAll: true }),
        });
        if (selectedCollections.size > 0) {
          const inserts = Array.from(selectedCollections).map(collectionId => ({
            collection_id: collectionId,
            picture_id: videoId,
          }));
          await apiClient('/api/collection-pictures', { method: 'POST', body: JSON.stringify({ inserts }) });
        }
      } catch (collectionError) {
        console.error('Collection update failed:', collectionError);
        toast.error(translate('Failed to update collections'));
      }

      toast.success(translate('Video updated successfully'));
      onUpdateSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error(translate('Failed to update video'));
    } finally {
      setUpdating(false);
    }
  };

  const handleMicrophone = async (field: 'title' | 'description') => {
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
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          
          // Transcribe audio
          setIsTranscribing(true);
          try {
            const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
            const transcription = await transcribeAudio(audioFile);
            
            if (transcription) {
              if (field === 'title') {
                form.setValue('title', transcription);
              } else {
                const currentDesc = form.getValues('description') || '';
                form.setValue('description', currentDesc ? `${currentDesc}\n\n${transcription}` : transcription);
              }
              toast.success(translate('Voice transcribed successfully!'));
            }
          } catch (error) {
            console.error('Error transcribing audio:', error);
            toast.error(translate('Failed to transcribe audio'));
          } finally {
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast.info(translate('Recording... Click again to stop'));
      } catch (error) {
        console.error('Error starting recording:', error);
        toast.error(translate('Failed to start recording. Please check microphone permissions.'));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle><T>Edit Video</T></DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="metadata" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="metadata"><T>Metadata</T></TabsTrigger>
                <TabsTrigger value="collections">
                  <Bookmark className="h-4 w-4 mr-1" />
                  <T>Collections</T>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="metadata" className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><T>Title</T></FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input placeholder={translate('Video title')} {...field} />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => handleMicrophone('title')}
                          disabled={isTranscribing}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-accent transition-colors"
                        >
                          {isTranscribing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isRecording ? (
                            <MicOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><T>Description</T></FormLabel>
                      <div className="relative">
                        <FormControl>
                          <MarkdownEditor
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder={translate('Add a description (supports Markdown)')}
                            className="min-h-[120px]"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => handleMicrophone('description')}
                          disabled={isTranscribing}
                          className="absolute right-2 top-2 p-1.5 rounded-md hover:bg-accent transition-colors z-10"
                        >
                          {isTranscribing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isRecording ? (
                            <MicOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base"><T>Visibility</T></FormLabel>
                        <div className="text-sm text-muted-foreground">
                          <T>Make this video visible to others</T>
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="collections" className="space-y-4">
                {loadingCollections ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : collections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p><T>No collections yet</T></p>
                    <p className="text-sm"><T>Create a collection first to organize your videos</T></p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collections.map((collection) => (
                      <Card key={collection.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedCollections.has(collection.id)}
                              onCheckedChange={() => handleCollectionToggle(collection.id)}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{collection.name}</h4>
                              {collection.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {collection.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                <T>Cancel</T>
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <T>Updating...</T>
                  </>
                ) : (
                  <T>Save Changes</T>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditVideoModal;

