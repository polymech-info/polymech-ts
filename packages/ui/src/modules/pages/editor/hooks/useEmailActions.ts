import { useState, useEffect, useRef } from "react";
import { getAuthToken, serverUrl } from "@/lib/db";
import { toast } from "sonner";
import { translate, getCurrentLang } from "@/i18n";

interface UseEmailActionsParams {
    page: { owner: string; slug: string };
    orgSlug?: string;
}

export function useEmailActions({ page, orgSlug }: UseEmailActionsParams) {
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
    const [emailRecipient, setEmailRecipient] = useState('cgoflyn@gmail.com');
    const [emailSubject, setEmailSubject] = useState(() => {
        const now = new Date();
        return `${now.toISOString().slice(0, 10)}::${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        getAuthToken().then(token => setAuthToken(token ?? null));
    }, []);

    const handleSendEmail = async () => {
        if (!emailRecipient) {
            toast.error(translate("Email is required"));
            return;
        }

        setIsSendingEmail(true);
        try {
            const lang = getCurrentLang();
            const endpoint = orgSlug
                ? `${serverUrl}/org/${orgSlug}/user/${page.owner}/pages/${page.slug}/email-send?lang=${lang}`
                : `${serverUrl}/user/${page.owner}/pages/${page.slug}/email-send?lang=${lang}`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: emailRecipient, subject: emailSubject || undefined })
            });

            if (!res.ok) {
                const text = await res.text();
                let errorMessage = text;
                try {
                    const json = JSON.parse(text);
                    if (json && json.error) errorMessage = json.error;
                } catch (e) { /* Not JSON */ }
                throw new Error(errorMessage || 'Failed to send email');
            }

            const data = await res.json();
            if (data.success) {
                toast.success(translate("Email sent successfully!"));
                setShowSendEmailDialog(false);
                setEmailRecipient('cgoflyn@gmail.com');
            } else {
                throw new Error(data.error || 'Failed to send email');
            }
        } catch (err: any) {
            console.error("Email send failed", err);
            toast.error(translate("Failed to send email: ") + err.message);
        } finally {
            setIsSendingEmail(false);
        }
    };

    return {
        showEmailPreview,
        setShowEmailPreview,
        showSendEmailDialog,
        setShowSendEmailDialog: (open: boolean) => {
            if (open) {
                // Refresh default subject with current time when opening
                const now = new Date();
                setEmailSubject(`${now.toISOString().slice(0, 10)}::${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
            }
            setShowSendEmailDialog(open);
        },
        emailRecipient,
        setEmailRecipient,
        emailSubject,
        setEmailSubject,
        isSendingEmail,
        authToken,
        previewMode,
        setPreviewMode,
        iframeRef,
        handleSendEmail,
    };
}
