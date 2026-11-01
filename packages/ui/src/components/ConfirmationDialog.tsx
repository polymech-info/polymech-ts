import React, { useRef, useEffect } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { T } from "@/i18n";

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "destructive";
}

export const ConfirmationDialog = ({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    onCancel,
    confirmLabel = "Continue",
    cancelLabel = "Cancel",
    variant = "default",
}: ConfirmationDialogProps) => {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const lastFocusedRef = useRef<HTMLElement | null>(null);

    // Initial focus when opening and restore logic
    useEffect(() => {
        if (open) {
            lastFocusedRef.current = document.activeElement as HTMLElement;
            // Slight delay to ensure content is mounted and capable of receiving focus
            // Radix UI handles initial focus too, but we might want to enforce "Cancel" as default for safety
            setTimeout(() => {
                cancelRef.current?.focus();
            }, 50);
        } else {
            // Restore focus when closed
            if (lastFocusedRef.current) {
                lastFocusedRef.current.focus();
                lastFocusedRef.current = null;
            }
        }
    }, [open]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") {
            e.preventDefault();
            confirmRef.current?.focus();
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            cancelRef.current?.focus();
        }
    };

    const handleConfirm = (e: React.MouseEvent) => {
        e.preventDefault();
        onConfirm();
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onCancel) onCancel();
        else onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent onKeyDown={handleKeyDown}>
                <AlertDialogHeader>
                    <AlertDialogTitle><T>{title}</T></AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="text-muted-foreground">
                            {typeof description === 'string' ? <T>{description}</T> : description}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel
                        ref={cancelRef}
                        onClick={handleCancel}
                    >
                        <T>{cancelLabel}</T>
                    </AlertDialogCancel>
                    <AlertDialogAction
                        ref={confirmRef}
                        onClick={handleConfirm}
                        className={cn(variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                    >
                        <T>{confirmLabel}</T>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
