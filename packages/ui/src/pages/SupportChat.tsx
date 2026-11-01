import React from 'react';
import ChatPanel from '@/modules/ai/ChatPanel';
import type { SupportContextKey } from '@/modules/ai/defaults';
import { cn } from '@/lib/utils';

interface SupportChatProps {
    /** Context additions to append to the base support prompt */
    context?: SupportContextKey[];
    /** AI provider. Default: 'support' */
    provider?: string;
    /** AI model. Default: 'openai/gpt-4o' */
    model?: string;
    /** Enable site search tools. Default: true */
    searchTools?: boolean;
    /** Enable page tools. Default: false */
    pageTools?: boolean;
    /** Enable image generation tool. Default: false */
    imageTools?: boolean;
    /** Enable VFS file tools. Default: false */
    vfsTools?: boolean;
    /** Initial user input to populate in the text area when loaded */
    initialPrompt?: string;
    /** If true, auto-submit the initialPrompt immediately */
    autoSend?: boolean;
    className?: string;
    /** Persisted LocalStorage key name for the ResizablePanel splitters */
    layoutId?: string;
    /** Dynamic context to inject into the system prompt */
    getContext?: () => string | null;
}

const SupportChat: React.FC<SupportChatProps> = ({
    context,
    provider = 'support',
    model = 'openai/gpt-4o',
    searchTools = true,
    pageTools = false,
    imageTools = false,
    vfsTools = false,
    initialPrompt,
    autoSend,
    className,
    layoutId = "support-chat-layout",
    getContext,
}) => (
    <div className={cn("flex flex-col min-h-0", className || "h-[calc(100svh-4rem)] p-3 sm:p-4")}>
        <ChatPanel
            preset="support"
            layoutId={layoutId}
            initialProvider={provider}
            initialModel={model}
            context={context}
            initialSearchToolsEnabled={searchTools}
            initialPageToolsEnabled={pageTools}
            initialImageToolsEnabled={imageTools}
            initialVfsToolsEnabled={vfsTools}
            initialPrompt={initialPrompt}
            initialAutoSend={autoSend}
            getContext={getContext}
        />
    </div>
);

export default SupportChat;
