
import React from 'react';
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

interface YouTubeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    onUrlChange: (url: string) => void;
    onConfirm: () => void;
}

export const YouTubeDialog: React.FC<YouTubeDialogProps> = ({
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
                    <AlertDialogTitle><T>Add YouTube Video</T></AlertDialogTitle>
                    <AlertDialogDescription>
                        <T>Paste the YouTube video URL below to add it to your post.</T>
                    </AlertDialogDescription>
                    <div className="py-4">
                        <Input
                            placeholder="https://www.youtube.com/watch?v=..."
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
