
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { T } from "@/i18n";

interface TikTokDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    onUrlChange: (url: string) => void;
    onConfirm: () => void;
}

export const TikTokDialog: React.FC<TikTokDialogProps> = ({
    open,
    onOpenChange,
    url,
    onUrlChange,
    onConfirm
}) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle><T>Add TikTok Video</T></AlertDialogTitle>
                    <AlertDialogDescription>
                        <T>Paste the TikTok video URL below to add it to your post.</T>
                        <div className="text-xs text-muted-foreground mt-2">
                            Example: https://www.tiktok.com/@user/video/1234567890
                        </div>
                    </AlertDialogDescription>
                    <div className="py-4">
                        <Input
                            placeholder="https://www.tiktok.com/@user/video/..."
                            value={url}
                            onChange={(e) => onUrlChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onConfirm();
                                }
                            }}
                            autoFocus
                        />
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}><T>Cancel</T></AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={!url}><T>Add Video</T></AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
