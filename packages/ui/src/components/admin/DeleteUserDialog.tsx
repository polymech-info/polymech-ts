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

interface DeleteUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    username?: string;
}

export const DeleteUserDialog = ({ open, onOpenChange, onConfirm, username }: DeleteUserDialogProps) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <T>Are you sure you want to delete this user?</T>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <T>This action cannot be undone. This will permanently delete the user</T>
                        {username && <span className="font-bold"> {username}</span>}
                        <T> and all associated data.</T>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel><T>Cancel</T></AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
                        <T>Delete</T>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
