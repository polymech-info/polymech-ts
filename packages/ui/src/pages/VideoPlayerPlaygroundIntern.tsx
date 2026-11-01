import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import VideoCard from "@/components/VideoCard";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { serverUrl } from "@/lib/db";

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

interface VideoJob {
    id: string;
    status: 'created' | 'active' | 'completed' | 'failed';
    progress: number;
    resultUrl?: string;
    error?: string;
}

const VideoPlayerPlaygroundIntern = () => {
    const { user } = useAuth();
    const [title, setTitle] = useState("My Internal Video");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [jobId, setJobId] = useState<string | null>(null);
    const [dbId, setDbId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // Result state
    const [videoUrl, setVideoUrl] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [meta, setMeta] = useState<any>(null);
    const [previewKey, setPreviewKey] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
        }
    };

    const trackProgress = (id: string) => {
        const eventSource = new EventSource(`${serverUrl}/api/videos/jobs/${id}/progress`);
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.connected) {
                    console.log('SSE Connected');
                    return;
                }
                if (data.progress !== undefined) {
                    setUploadProgress(data.progress);
                }
                if (data.log) {
                    setLogs(prev => [...prev, data.log]);
                }
            } catch (e) {
                console.error('SSE Parse Error', e);
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE Error', err);
            eventSource.close();
        };

        return eventSource;
    };

    const pollJob = async (id: string) => {
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes

        // Start SSE Tracking
        const sse = trackProgress(id);

        const check = async () => {
            try {
                const res = await fetch(`${serverUrl}/api/videos/jobs/${id}`);
                if (!res.ok) throw new Error('Failed to check job status');

                const data: VideoJob = await res.json();
                console.log('Job status:', data.status);

                if (data.status === 'completed' && data.resultUrl) {
                    setUploadStatus('ready');
                    setVideoUrl(data.resultUrl);
                    toast.success('Video processing complete!');
                    sse.close(); // Close SSE on completion
                } else if (data.status === 'failed') {
                    setUploadStatus('error');
                    toast.error(`Processing failed: ${data.error}`);
                    sse.close();
                } else {
                    // Pending
                    if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(check, 2000);
                    } else {
                        setUploadStatus('error');
                        toast.error('Processing timed out');
                        sse.close();
                    }
                }
            } catch (err) {
                console.error('Polling error', err);
                setUploadStatus('error');
                sse.close();
            }
        };

        check();
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setUploadStatus('uploading');
        setUploadProgress(0); // Fake progress for now
        setLogs([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${serverUrl}/api/videos/upload?userId=${user.id}&title=${encodeURIComponent(title)}&preset=original`);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(percent);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    console.log('Upload success', data);
                    setJobId(data.jobId);
                    setDbId(data.dbId);
                    setThumbnailUrl(data.thumbnailUrl);
                    setMeta(data.meta);
                    setUploadStatus('processing');
                    pollJob(data.jobId);
                    toast.success('Upload complete, processing...');
                } else {
                    console.error('Upload failed', xhr.responseText);
                    setUploadStatus('error');
                    toast.error('Upload failed');
                }
            };

            xhr.onerror = () => {
                setUploadStatus('error');
                toast.error('Network error during upload');
            };

            xhr.send(formData);

        } catch (err) {
            console.error(err);
            setUploadStatus('error');
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Internal Video Player Playground</h1>
                <p className="text-muted-foreground">
                    Test internal video upload and processing pipeline (ffmpeg + pg-boss)
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Video</CardTitle>
                        <CardDescription>Upload to local server storage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select File</Label>
                            <Input type="file" accept="video/*" onChange={handleFileChange} ref={fileInputRef} />
                        </div>

                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={description} onChange={e => setDescription(e.target.value)} />
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={!file || !user || uploadStatus === 'uploading' || uploadStatus === 'processing'}
                            className="w-full"
                        >
                            {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
                        </Button>

                        {/* Status Display */}
                        {uploadStatus !== 'idle' && (
                            <div className="space-y-2 pt-4 border-t">
                                {uploadStatus === 'uploading' && (
                                    <Alert>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <AlertDescription>Uploading: {uploadProgress}%</AlertDescription>
                                    </Alert>
                                )}
                                {uploadStatus === 'processing' && (
                                    <Alert>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <AlertDescription>Processing video on server: {uploadProgress}%</AlertDescription>
                                    </Alert>
                                )}
                                {uploadStatus === 'ready' && (
                                    <Alert>
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <AlertDescription>Video Ready!</AlertDescription>
                                    </Alert>
                                )}
                                {uploadStatus === 'error' && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>Operation failed</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {videoUrl ? (
                            <VideoCard
                                key={previewKey}
                                videoId={dbId || jobId || 'preview'}
                                videoUrl={videoUrl}
                                thumbnailUrl={thumbnailUrl}
                                title={title}
                                author={user?.email || 'User'} // email is likely not on user object directly here depending on definition, but acceptable for demo
                                authorId={user?.id || 'uid'}
                                likes={0}
                                comments={0}
                                isLiked={false}
                                description={description}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-muted rounded-lg border-2 border-dashed">
                                <p className="text-muted-foreground">Video preview will appear here</p>
                            </div>
                        )}

                        {/* Debug Info & Logs */}
                        {(jobId || logs.length > 0) && (
                            <div className="mt-4 p-2 bg-muted rounded text-xs">
                                {jobId && <p className="font-bold mb-2">Job ID: {jobId}</p>}

                                <p className="font-semibold mt-2">FFmpeg Logs:</p>
                                <div className="h-32 overflow-y-auto font-mono bg-black text-green-400 p-2 rounded text-[10px] whitespace-pre-wrap">
                                    {logs.map((log, i) => (
                                        <div key={i}>{log}</div>
                                    ))}
                                    {logs.length === 0 && <span className="text-gray-500">Waiting for logs...</span>}
                                </div>

                                {meta && (
                                    <div className="mt-2 pt-2 border-t">
                                        <p className="font-semibold">Metadata:</p>
                                        <pre className="mt-1 p-2 bg-background rounded border overflow-auto text-[10px]">
                                            {JSON.stringify(meta, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default VideoPlayerPlaygroundIntern;
