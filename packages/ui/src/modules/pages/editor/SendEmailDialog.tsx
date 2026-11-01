import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { T } from "@/i18n";

interface SendEmailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    emailRecipient: string;
    onEmailRecipientChange: (value: string) => void;
    emailSubject: string;
    onEmailSubjectChange: (value: string) => void;
    pageTitle?: string;
    onSend: () => void;
    isSending: boolean;
}

export const SendEmailDialog = ({
    open,
    onOpenChange,
    emailRecipient,
    onEmailRecipientChange,
    emailSubject,
    onEmailSubjectChange,
    pageTitle,
    onSend,
    isSending,
}: SendEmailDialogProps) => {
    const [includeTitle, setIncludeTitle] = useState(false);

    const handleToggleTitle = (checked: boolean) => {
        setIncludeTitle(checked);
        if (checked && pageTitle) {
            onEmailSubjectChange(`${pageTitle} ${emailSubject}`);
        } else if (!checked && pageTitle && emailSubject.startsWith(pageTitle)) {
            onEmailSubjectChange(emailSubject.slice(pageTitle.length).trimStart());
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle><T>Send Email Preview</T></DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2"><T>Subject</T></label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-md bg-background"
                            placeholder="Email subject..."
                            value={emailSubject}
                            onChange={(e) => onEmailSubjectChange(e.target.value)}
                        />
                    </div>

                    {/* Options */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeTitle}
                                onChange={(e) => handleToggleTitle(e.target.checked)}
                                className="rounded"
                            />
                            <T>Include page title</T>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2"><T>Recipient Email</T></label>
                        <input
                            type="email"
                            className="w-full p-2 border rounded-md bg-background"
                            placeholder="user@example.com"
                            value={emailRecipient}
                            onChange={(e) => onEmailRecipientChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSend()}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}><T>Cancel</T></Button>
                    <Button onClick={onSend} disabled={isSending}>
                        {isSending ? <T>Sending...</T> : <T>Send</T>}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
