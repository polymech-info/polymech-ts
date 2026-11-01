import React from "react";
import { getAuthToken, serverUrl } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Navigate } from "react-router-dom";
import { CreationWizardPopup } from "@/components/CreationWizardPopup";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const NewPost = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sharedImages, setSharedImages] = React.useState<any[]>([]);
  const [sharedTitle, setSharedTitle] = React.useState("");
  const [sharedText, setSharedText] = React.useState("");
  const [debugLogs, setDebugLogs] = React.useState<string[]>([]);
  const [showLogs, setShowLogs] = React.useState(false);

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLogs(prev => [...prev, new Date().toISOString().split('T')[1].split('.')[0] + ': ' + msg]);
  };

  // Helper to process URL like GlobalDragDrop does
  const processSharedUrl = async (url: string) => {
    addLog(`Processing shared URL: ${url}`);
    try {
      // Use relative path for API calls to support mobile/PWA proxying
      // Fallback to localhost only if strictly needed in dev without proxy, but empty string is safer for Vite proxy
      addLog(`Fetching site info from: ${serverUrl || '/api'}/serving/site-info`);

      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Ensure we have a valid URL protocol
      let targetUrl = url;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        // If just a domain or text, try to extract or prepend
        const urlMatch = url.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch && urlMatch.length > 0) {
          targetUrl = urlMatch[0];
        } else {
          // fallback
          targetUrl = 'https://' + url;
        }
      }

      const response = await fetch(`${serverUrl}/api/serving/site-info?url=${encodeURIComponent(targetUrl)}`, {
        headers
      });
      addLog(`Response status: ${response.status}`);

      let siteInfo = {};
      if (response.ok) {
        siteInfo = await response.json();
        addLog(`Site info fetched: ${JSON.stringify(siteInfo).slice(0, 100)}...`);
      } else {
        const txt = await response.text();
        addLog(`Failed to fetch site info: ${response.status} ${response.statusText} - ${txt}`);
        // Open logs on error
        setShowLogs(true);
      }

      const virtualItem = {
        id: `shared-link-${Date.now()}`,
        path: url,
        src: (siteInfo as any).page?.image || 'https://picsum.photos/800/600',
        title: (siteInfo as any).page?.title || (siteInfo as any).title || url,
        description: (siteInfo as any).page?.description || (siteInfo as any).description || '',
        type: 'page-external',
        meta: siteInfo,
        file: null,
        selected: true
      } as any;

      return virtualItem;
    } catch (err: any) {
      addLog(`Error processing shared URL: ${err.message || err}`);
      toast.error("Could not fetch link details. See debug logs.");
      setShowLogs(true);
      return {
        id: `shared-link-${Date.now()}`,
        path: url,
        src: 'https://picsum.photos/800/600',
        title: url,
        description: '',
        type: 'page-external',
        meta: { url },
        file: null,
        selected: true
      } as any;
    }
  };

  React.useEffect(() => {
    const checkShared = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('shared') === 'true') {
        try {
          // Dynamic import to avoid SSR/build issues if any, though likely fine as is
          const { get, del } = await import('idb-keyval');
          const data = await get('share-target');

          if (data) {
            console.log("Found shared data:", data);
            const { files, title, text, url, items } = data; // Destructure items

            let newImages = [];

            // Handle virtual items (pre-processed in GlobalDragDrop)
            if (items && items.length > 0) {
              newImages = [...newImages, ...items];
            }

            // Handle raw files (legacy share target)
            if (files && files.length > 0) {
              const fileImages = Array.from(files).map((f: any) => ({
                id: `shared-${Date.now()}-${Math.random()}`,
                file: f,
                src: URL.createObjectURL(f),
                title: f.name,
                selected: true,
                isGenerated: false,
                type: f.type.startsWith('video/') ? 'video' : 'image'
              }));
              newImages = [...newImages, ...fileImages];
            }

            // Handle raw URL share (Mobile Share Target)
            // TikTok/others often share text like "Check this out https://vm.tiktok.com/..."
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const textHasUrl = text && urlRegex.test(text);

            if (newImages.length === 0 && (url || textHasUrl)) {
              let targetUrl = url;
              if (!targetUrl && textHasUrl) {
                const match = text.match(urlRegex);
                if (match && match.length > 0) targetUrl = match[0];
              }

              if (targetUrl) {
                toast.info("Processing shared link...");
                const virtualItem = await processSharedUrl(targetUrl);
                newImages = [virtualItem];

                // If we extracted the URL from the text, we might want to clean up the sharedText 
                // or keep it as the description? 
                // Let's keep the full text as description for context, 
                // but if the text was ONLY the URL, we might want to clear it?
                // For now, keep as is.
              }
            }

            if (newImages.length > 0) {
              setSharedImages(newImages);
            }

            if (title) setSharedTitle(title);

            let description = text || "";
            if (url) description += (description ? "\n\n" : "") + url;
            setSharedText(description);

            // Clean up
            await del('share-target');
          }
        } catch (err) {
          console.error("Error reading shared data:", err);
        }
      }
    };
    checkShared();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background pt-14 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pt-14">
      {/* Show CreationWizardPopup with shared images */}
      <CreationWizardPopup
        isOpen={true}
        onClose={() => navigate('/')}
        preloadedImages={sharedImages}
      />

      {/* Debug Logs Dialog */}
      <Dialog open={showLogs} onOpenChange={setShowLogs}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Debug Logs</DialogTitle>
            <DialogDescription>Use these logs to troubleshoot connectivity issues.</DialogDescription>
          </DialogHeader>
          <div className="h-[300px] w-full border rounded-md p-2 bg-muted/50 overflow-auto font-mono text-xs">
            {debugLogs.length === 0 ? (
              <div className="text-muted-foreground italic">No logs yet...</div>
            ) : (
              debugLogs.map((log, i) => (
                <div key={i} className="border-b border-border/50 py-1 break-words">
                  {log}
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(debugLogs.join('\n'))}>
              Copy
            </Button>
            <Button size="sm" onClick={() => setShowLogs(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewPost;
