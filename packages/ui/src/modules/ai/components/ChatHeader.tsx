/**
 * ChatHeader — responsive top bar with provider badge and action buttons.
 * On mobile: wraps, icon-only buttons, smaller title.
 */

import React from 'react';
import { MessageSquare, Download, FileText, Trash2, Settings2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ChatMessage } from '../types';
import type { ImageAttachment } from '../types';

interface ChatHeaderProps {
    provider: string;
    model: string;
    messages: ChatMessage[];
    attachments: ImageAttachment[];
    showSettings: boolean;
    onToggleSettings: () => void;
    onExportJson: () => void;
    onExportMarkdown: () => void;
    onClear: () => void;
    onNewSession: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
    provider, model, messages, attachments, showSettings,
    onToggleSettings, onExportJson, onExportMarkdown, onClear, onNewSession,
}) => (
    <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <h1 data-testid="chat-heading" className="text-lg sm:text-2xl font-bold truncate">
                Chat
            </h1>
            <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                {provider}/{model}
            </Badge>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Button
                variant="outline" size="sm"
                className="h-8 px-2 sm:px-3"
                onClick={onNewSession}
                title="Start a new chat session"
                data-testid="chat-new-btn"
            >
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">New</span>
            </Button>
            <Button
                variant="outline" size="sm"
                className="h-8 px-2 sm:px-3"
                onClick={onExportJson}
                disabled={messages.length === 0}
                title="Export chat as JSON"
                data-testid="chat-export-btn"
            >
                <Download className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">JSON</span>
            </Button>
            <Button
                variant="outline" size="sm"
                className="h-8 px-2 sm:px-3"
                onClick={onExportMarkdown}
                disabled={messages.length === 0}
                title="Copy chat as Markdown to clipboard"
                data-testid="chat-export-md-btn"
            >
                <FileText className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">MD</span>
            </Button>
            <Button
                variant="outline" size="sm"
                className="h-8 px-2 sm:px-3"
                onClick={onClear}
                disabled={messages.length === 0 && attachments.length === 0}
                data-testid="chat-clear-btn"
            >
                <Trash2 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Clear</span>
            </Button>
            <Button
                variant="outline" size="sm"
                className="h-8 px-2 sm:px-3"
                onClick={onToggleSettings}
                data-testid="chat-settings-toggle"
            >
                <Settings2 className="h-4 w-4 sm:mr-1" />
                <span className="hidden md:inline">{showSettings ? 'Hide' : 'Show'} Settings</span>
            </Button>
        </div>
    </div>
);

export default ChatHeader;
