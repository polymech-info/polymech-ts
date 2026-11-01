import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Smartphone } from "lucide-react";
import { Page } from "../types";
import { getCurrentLang } from "@/i18n";
import { serverUrl } from "@/lib/db";

interface EmailPreviewPanelProps {
    page: Page;
    orgSlug?: string;
    previewMode: 'desktop' | 'mobile';
    onSetPreviewMode: (mode: 'desktop' | 'mobile') => void;
    iframeRef: RefObject<HTMLIFrameElement>;
    authToken: string | null;
}

export const EmailPreviewPanel = ({
    page,
    orgSlug,
    previewMode,
    onSetPreviewMode,
    iframeRef,
    authToken,
}: EmailPreviewPanelProps) => {
    const previewPath = orgSlug
        ? `/org/${orgSlug}/user/${page.owner}/pages/${page.slug}/email-preview`
        : `/user/${page.owner}/pages/${page.slug}/email-preview`;

    return (
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 border rounded-md shadow-sm overflow-hidden">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-center gap-2 p-2 border-b bg-background">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        if (iframeRef.current?.contentWindow) {
                            iframeRef.current.contentWindow.history.back();
                        }
                    }}
                    title="Go Back"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div className="h-4 w-px bg-border mx-2" />
                <Button
                    variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => onSetPreviewMode('desktop')}
                    title="Desktop View"
                >
                    <Monitor className="h-4 w-4 mr-2" />
                    Desktop
                </Button>
                <Button
                    variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => onSetPreviewMode('mobile')}
                    title="Mobile View"
                >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile
                </Button>
            </div>

            {/* Preview Container */}
            <div className="flex-1 min-h-0 overflow-auto flex justify-center p-4 md:p-8">
                <div
                    className={`transition-all duration-300 bg-white shadow-lg overflow-hidden ${previewMode === 'mobile' ? 'w-[375px] h-[667px] rounded-3xl border-8 border-gray-800' : 'w-full h-[calc(100vh-12rem)] rounded-md'}`}
                >
                    <iframe
                        ref={iframeRef as any}
                        src={`${serverUrl}${previewPath}?token=${authToken || ''}&lang=${getCurrentLang()}`}
                        className="w-full h-full border-0"
                        title="Email Preview"
                    />
                </div>
            </div>
        </div>
    );
};
