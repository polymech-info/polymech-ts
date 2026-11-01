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
import { apiClient } from '@/lib/db';
import { updatePicture } from '@/modules/posts/client-pictures';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Edit3, GitBranch, Sparkles, Mic, MicOff, Loader2, Bookmark } from 'lucide-react';
import MarkdownEditor from '@/components/MarkdownEditor';
import VersionSelector from '@/components/VersionSelector';
import { analyzeImages, transcribeAudio } from '@/lib/openai';
import { AI_IMAGE_ANALYSIS_PROMPT } from '@/constants';
import { T, translate } from '@/i18n';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_public: boolean;
}

interface EditFormData {
  title?: string;
  description?: string;
  visible: boolean;
}

interface EditImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pictureId: string;
  currentTitle: string;
  currentDescription: string | null;
  currentVisible: boolean;
  imageUrl?: string;
  onUpdateSuccess: () => void;
}

const EditImageModal = ({
  open,
  onOpenChange,
  pictureId,
  currentTitle,
  currentDescription,
  currentVisible,
  imageUrl,
  onUpdateSuccess
}: EditImageModalProps) => {
  const [updating, setUpdating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
      fetchPictureCollections();
    }
  }, [open, user, pictureId]);

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

  const fetchPictureCollections = async () => {
    if (!user) return;

    try {
      const data = await apiClient<{ collection_id: string }[]>(`/api/collection-pictures?pictureId=${pictureId}`);
      setSelectedCollections(new Set(data.map(item => item.collection_id)));
    } catch (error) {
      console.error('Error fetching picture collections:', error);
    }
  };

  const handleToggleCollection = async (collectionId: string) => {
    if (!user) return;

    const isSelected = selectedCollections.has(collectionId);

    try {
      if (isSelected) {
        await apiClient(`/api/collection-pictures`, {
          method: 'DELETE',
          body: JSON.stringify({ collection_id: collectionId, picture_id: pictureId }),
        });
        setSelectedCollections(prev => {
          const newSet = new Set(prev);
          newSet.delete(collectionId);
          return newSet;
        });
        toast.success(translate('Removed from collection'));
      } else {
        await apiClient(`/api/collection-pictures`, {
          method: 'POST',
          body: JSON.stringify({ inserts: [{ collection_id: collectionId, picture_id: pictureId }] }),
        });
        setSelectedCollections(prev => new Set([...prev, collectionId]));
        toast.success(translate('Added to collection'));
      }
    } catch (error) {
      console.error('Error toggling collection:', error);
      toast.error(translate('Failed to update collection'));
    }
  };

  const onSubmit = async (data: EditFormData) => {
    if (!user) return;

    setUpdating(true);
    try {
      await updatePicture(pictureId, {
        title: data.title?.trim() || '',
        description: data.description || null,
        visible: data.visible,
        updated_at: new Date().toISOString(),
      });

      toast.success(translate('Picture updated successfully!'));
      onUpdateSuccess();
    } catch (error: any) {
      console.error('Error updating picture:', error);
      toast.error(translate('Failed to update picture'));
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleMagicGenerate = async () => {
    if (!imageUrl) {
      toast.error(translate('No image URL available'));
      return;
    }

    setIsGenerating(true);
    try {
      // Fetch the image and convert to File
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'image.png', { type: blob.type || 'image/png' });

      // Call OpenAI to analyze the image
      const result = await analyzeImages([file], AI_IMAGE_ANALYSIS_PROMPT);

      if (!result) {
        toast.error(translate('OpenAI API key not configured. Please add your OpenAI API key in your profile settings.'));
        return;
      }

      // Update form fields with generated content
      form.setValue('title', result.title);
      form.setValue('description', result.description);

      toast.success(translate('Title and description generated!'));
    } catch (error: any) {
      console.error('Error generating metadata:', error);
      toast.error(error.message || translate('Failed to generate metadata. Please check your OpenAI API key.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMicrophone = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        // Check if MediaRecorder is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error(translate('Audio recording is not supported in your browser'));
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create MediaRecorder with common audio format
        const options = { mimeType: 'audio/webm' };
        let mediaRecorder: MediaRecorder;

        try {
          mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
          // Fallback without options if the format is not supported
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
          setIsTranscribing(true);

          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

            toast.info(translate('Transcribing audio...'));
            const transcribedText = await transcribeAudio(audioFile);

            if (transcribedText) {
              // Append transcribed text to description field
              const currentDescription = form.getValues('description') || '';
              const trimmed = currentDescription.trim();
              const newDescription = trimmed ? `${trimmed}\n\n${transcribedText}` : transcribedText;

              form.setValue('description', newDescription);
              toast.success(translate('Audio transcribed successfully!'));
            } else {
              toast.error(translate('Failed to transcribe audio. Please check your OpenAI API key.'));
            }
          } catch (error: any) {
            console.error('Error transcribing audio:', error);
            toast.error(error.message || translate('Failed to transcribe audio'));
          } finally {
            setIsTranscribing(false);
            audioChunksRef.current = [];

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast.info(translate('Recording started... Click again to stop'));

      } catch (error: any) {
        console.error('Error accessing microphone:', error);
        if (error.name === 'NotAllowedError') {
          toast.error(translate('Microphone access denied. Please allow microphone access in your browser settings.'));
        } else {
          toast.error(translate('Failed to access microphone') + ': ' + error.message);
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            <T>Edit Picture</T>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              <T>Edit Details</T>
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              <T>Collections</T>
            </TabsTrigger>
            <TabsTrigger value="versions" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <T>Versions</T>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Magic Generate Button */}
                {imageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleMagicGenerate}
                    disabled={isGenerating || updating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2"></div>
                        <T>Generating...</T>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        <T>Generate Title & Description with AI</T>
                      </>
                    )}
                  </Button>
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><T>Title (Optional)</T></FormLabel>
                      <FormControl>
                        <Input
                          placeholder={translate("Enter a title...")}
                          {...field}
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel><T>Description (Optional)</T></FormLabel>
                        <button
                          type="button"
                          onClick={handleMicrophone}
                          disabled={isTranscribing || updating}
                          className={`p-1.5 rounded-md transition-colors ${isRecording
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                          title={translate(isRecording ? 'Stop recording' : 'Record audio')}
                        >
                          {isTranscribing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isRecording ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormControl>
                        <MarkdownEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder={translate("Describe your photo... You can use **markdown** formatting!")}
                          className="min-h-[120px]"
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                      </FormControl>
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
                        <FormLabel className="text-base">
                          <T>Visible</T>
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          <T>Make this picture visible to others</T>
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
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    disabled={updating}
                  >
                    <T>Cancel</T>
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={updating}
                  >
                    <T>{updating ? 'Updating...' : 'Update'}</T>
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="collections" className="mt-4">
            <div className="space-y-4">
              {loadingCollections ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-8">
                  <Bookmark className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    <T>No collections yet</T>
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleClose();
                      // Navigate to create collection - could be improved with proper navigation
                      window.location.href = '/collections/new';
                    }}
                  >
                    <T>Create Collection</T>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {collections.map((collection) => (
                    <Card
                      key={collection.id}
                      className={`cursor-pointer transition-colors ${selectedCollections.has(collection.id)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                        }`}
                      onClick={() => handleToggleCollection(collection.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{collection.name}</h4>
                              {!collection.is_public && (
                                <span className="text-xs text-muted-foreground">(Private)</span>
                              )}
                            </div>
                            {collection.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {collection.description}
                              </p>
                            )}
                          </div>
                          <Checkbox
                            checked={selectedCollections.has(collection.id)}
                            onCheckedChange={() => handleToggleCollection(collection.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="pt-2 text-sm text-muted-foreground text-center">
                <T>
                  {selectedCollections.size === 0
                    ? 'Not in any collections'
                    : selectedCollections.size === 1
                      ? 'In 1 collection'
                      : `In ${selectedCollections.size} collections`}
                </T>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="versions" className="mt-4">
            <VersionSelector
              currentPictureId={pictureId}
              onVersionSelect={() => { /* stay open — user may toggle multiple versions */ }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditImageModal;
