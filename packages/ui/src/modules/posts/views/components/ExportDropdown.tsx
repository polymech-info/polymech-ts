import React, { useState } from "react";
import { FileText, Download, Code, Mail, Archive, MoreVertical, Share2, Link } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateOfflineZip } from "@/utils/zipGenerator";

import { PostItem, UserProfile } from "../types";
import { Picture } from "@/types-server";
import { serverUrl } from "../db";

interface ExportDropdownProps {
    post: PostItem | null;
    mediaItems: Picture[];
    authorProfile: UserProfile | null;
    onExportMarkdown?: () => void;
    className?: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
    post,
    mediaItems,
    authorProfile,
    onExportMarkdown,
    className
}) => {
    const [isZipping, setIsZipping] = useState(false);
    const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [emailHtml, setEmailHtml] = useState('');

    const baseUrl = serverUrl;
    const embedUrl = `${baseUrl}/embed/${post?.id}`;
    const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;

    const loadEmailHtml = async () => {
        if (!post?.id) {
            console.error('No post ID available');
            setEmailHtml('Error: Post data missing');
            return;
        }
        try {
            const res = await fetch(`${baseUrl}/api/render/email/${post.id}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || res.statusText);
            }
            const html = await res.text();
            setEmailHtml(html);
        } catch (e) {
            console.error("Failed to load email html", e);
            toast.error("Failed to load email template");
            setEmailHtml('Error loading template. Please try again later.');
        }
    };

    const handleExportPdf = async () => {
        if (!post?.id) return;
        try {
            // Get current URL and append .pdf extension
            const currentUrl = new URL(window.location.href);
            const pathWithExtension = currentUrl.pathname + '.pdf';
            const exportUrl = `${currentUrl.origin}${pathWithExtension}${currentUrl.search}`;

            // Open in new tab to trigger download
            window.open(exportUrl, '_blank');
            toast.success("PDF export opened");
        } catch (e) {
            console.error(e);
            toast.error("Failed to export PDF");
        }
    };

    const handleDownloadZip = async () => {
        if (!post) return;
        setIsZipping(true);
        toast.info("Generating ZIP...");
        try {
            await generateOfflineZip(
                post,
                mediaItems,
                authorProfile?.display_name || 'Author'
            );
            toast.success("ZIP downloaded!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate ZIP");
        } finally {
            setIsZipping(false);
        }
    };

    const handleCopyLink = async () => {
        if (!post) return;
        const url = window.location.href;
        const title = post.title || 'PolyMech Post';
        const text = post.description || '';

        if (navigator.share && navigator.canShare({ url, title, text })) {
            try {
                await navigator.share({ url, title, text });
                return;
            } catch (e) {
                // Ignore abort errors
                if ((e as Error).name !== 'AbortError') console.error('Share failed', e);
            }
        }

        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard");
        } catch (e) {
            console.error('Clipboard failed', e);
            toast.error("Failed to copy link");
        }
    };

    return (
        <div className={className}>
            <Dialog open={isEmbedDialogOpen} onOpenChange={setIsEmbedDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Embed Post</DialogTitle>
                        <DialogDescription>
                            Copy the code below to embed this post on your website.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-md relative group">
                            <code className="text-sm break-all font-mono">{embedCode}</code>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    navigator.clipboard.writeText(embedCode);
                                    toast.success("Copied to clipboard");
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Preview:
                            <div className="mt-2 border rounded overflow-hidden aspect-video relative">
                                <iframe src={embedUrl} width="100%" height="100%" frameBorder="0" className="absolute inset-0" />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export as Email</DialogTitle>
                        <DialogDescription>
                            Copy the HTML below to use in your email marketing tool.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-md relative group h-64 overflow-y-auto">
                            <code className="text-xs break-all font-mono whitespace-pre-wrap">{emailHtml || 'Loading...'}</code>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    navigator.clipboard.writeText(emailHtml);
                                    toast.success("Copied to clipboard");
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-muted-foreground hover:text-primary">
                        <Download className="h-4 w-4" />
                        <span className="hidden lg:inline">Export</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Export & Share</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleCopyLink}>
                        <Link className="h-4 w-4 mr-2" />
                        <span>Copy Link</span>
                    </DropdownMenuItem>

                    {onExportMarkdown && (
                        <DropdownMenuItem onClick={onExportMarkdown}>
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Export Markdown</span>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={handleExportPdf}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Export PDF</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleDownloadZip} disabled={isZipping}>
                        <Archive className="h-4 w-4 mr-2" />
                        <span>{isZipping ? 'Zipping...' : 'Download ZIP'}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setIsEmbedDialogOpen(true)}>
                        <Code className="h-4 w-4 mr-2" />
                        <span>Embed</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => {
                        setIsEmailDialogOpen(true);
                        loadEmailHtml();
                    }}>
                        <Mail className="h-4 w-4 mr-2" />
                        <span>Export as Email</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
