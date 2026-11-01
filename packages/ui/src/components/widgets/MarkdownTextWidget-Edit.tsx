import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, translate } from '@/i18n';
import {
    FileText,
    Minimize,
    Maximize,
    PanelLeftClose,
    PanelLeftOpen,
    Wand2,
} from 'lucide-react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import MarkdownEditor from '@/components/MarkdownEditorEx';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import CollapsibleSection from '@/components/CollapsibleSection';
import ChatPanel from '@/modules/ai/ChatPanel';
import { useMarkdownEditAI } from '@/modules/ai/useMarkdownEditAI';

interface MarkdownTextWidgetEditProps {
    content?: string;
    placeholder?: string;
    templates?: Array<{ name: string; template: string }>;
    onPropsChange?: (props: Record<string, any>) => void;
    contextVariables?: Record<string, any>;
    onClose: () => void;
}

const MarkdownTextWidgetEdit: React.FC<MarkdownTextWidgetEditProps> = ({
    content: propContent = '',
    placeholder: propPlaceholder = 'Enter your text here...',
    templates: propTemplates = [],
    onPropsChange,
    contextVariables,
    onClose
}) => {
    // ── Editor state ─────────────────────────────────────────────────────
    const [content, setContent] = useState<string>(propContent);
    const [templates, setTemplates] = useState(propTemplates);
    const [selectedText, setSelectedText] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLeftPaneCollapsed, setIsLeftPaneCollapsed] = useState(false);

    const editorRef = useRef<any>(null);
    const lastSubmittedContentRef = useRef<string>(propContent);
    const componentMountedRef = useRef(false);

    useEffect(() => {
        componentMountedRef.current = true;
        return () => { componentMountedRef.current = false; };
    }, []);

    // ── AI hook — wires context + markdown tools into the shared engine ──
    const { chatEngine, chatExtraToggles } = useMarkdownEditAI({
        content,
        selectedText,
        onContentChange: setContent,
        editorRef,
        contextVariables,
    });

    // ── Sync templates from props ────────────────────────────────────────
    useEffect(() => {
        if (JSON.stringify(propTemplates) !== JSON.stringify(templates)) {
            setTemplates(propTemplates || []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propTemplates]);

    // ── Editor handlers ──────────────────────────────────────────────────
    const handleContentChange = useCallback((newContent: string) => {
        if (!componentMountedRef.current) return;
        setContent(newContent);
    }, []);

    const handleSave = useCallback(() => {
        lastSubmittedContentRef.current = content;
        onPropsChange?.({
            content,
            placeholder: propPlaceholder,
            templates
        });
        toast.success(translate('Saved'));
    }, [content, onPropsChange, propPlaceholder, templates]);

    const handleSelectionChange = useCallback((newSelectedText: string) => {
        setSelectedText(newSelectedText);
    }, []);

    const handleFullscreenToggle = useCallback(() => {
        setIsFullscreen(prev => {
            const newValue = !prev;
            if (newValue) {
                document.body.style.setProperty('overflow', 'hidden', 'important');
            } else {
                document.body.style.removeProperty('overflow');
            }
            return newValue;
        });
    }, []);

    useEffect(() => {
        return () => {
            if (isFullscreen) document.body.style.removeProperty('overflow');
        };
    }, [isFullscreen]);

    // Save content and close editor
    const handleClose = useCallback(() => {
        lastSubmittedContentRef.current = content;
        onPropsChange?.({
            content,
            placeholder: propPlaceholder,
            templates
        });
        onClose();
    }, [content, onPropsChange, propPlaceholder, templates, onClose]);

    // ── Fullscreen render ────────────────────────────────────────────────
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b bg-background flex-shrink-0">
                    <div className="flex items-center gap-2 text-lg font-medium">
                        <FileText className="h-5 w-5" />
                        <span><T>Fullscreen Editor</T></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant={!isLeftPaneCollapsed ? "default" : "outline"}
                            onClick={() => setIsLeftPaneCollapsed(!isLeftPaneCollapsed)}
                            title={isLeftPaneCollapsed ? "Show AI Chat" : "Hide AI Chat"}
                        >
                            {isLeftPaneCollapsed ? <PanelLeftOpen className="h-4 w-4 mr-2" /> : <PanelLeftClose className="h-4 w-4 mr-2" />}
                            <T>{isLeftPaneCollapsed ? "Show AI" : "AI Chat"}</T>
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleFullscreenToggle}>
                            <Minimize className="h-4 w-4 mr-2" />
                            <T>Exit Fullscreen</T>
                        </Button>
                        <Button size="sm" variant="default" onClick={handleClose}>
                            <T>Done</T>
                        </Button>
                    </div>
                </div>

                <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
                    <ResizablePanel
                        defaultSize={50}
                        collapsible={true}
                        collapsedSize={0}
                        onCollapse={() => setIsLeftPaneCollapsed(true)}
                        onExpand={() => setIsLeftPaneCollapsed(false)}
                        className={isLeftPaneCollapsed ? "hidden" : ""}
                    >
                        <ChatPanel
                            preset="standard"
                            engine={chatEngine}
                            extraToggles={chatExtraToggles}
                            layoutId="md-edit-chat-fs"
                            className="h-full"
                        />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                        <div className="h-full flex flex-col bg-background">
                            <MarkdownEditor
                                value={content}
                                onChange={handleContentChange}
                                placeholder={propPlaceholder}
                                className="h-full w-full border-0"
                                onSelectionChange={handleSelectionChange}
                                onSave={handleSave}
                                editorRef={editorRef}
                            />
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        );
    }

    // ── Normal card layout ───────────────────────────────────────────────
    return (
        <Card onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between flex-nowrap">
                    <div className="flex items-center gap-2 flex-nowrap shrink-0">
                        <Button
                            size="sm"
                            variant={isFullscreen ? "default" : "outline"}
                            onClick={handleFullscreenToggle}
                        >
                            {isFullscreen ? (
                                <><Minimize className="h-3 w-3 mr-2" /><T>Exit Fullscreen</T></>
                            ) : (
                                <><Maximize className="h-3 w-3 mr-2" /><T>Fullscreen</T></>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="default"
                            onClick={handleClose}
                            disabled={isFullscreen}
                        >
                            <T>Done</T>
                        </Button>
                    </div>
                </div>

                <MarkdownEditor
                    value={content}
                    onChange={handleContentChange}
                    placeholder={propPlaceholder}
                    className="min-h-[200px]"
                    onSelectionChange={handleSelectionChange}
                    onSave={handleSave}
                    editorRef={editorRef}
                />

                <div className="pt-3 border-t">
                    <CollapsibleSection
                        title={<div className="flex items-center gap-2"><Wand2 className="h-4 w-4" /><T>AI Assistant</T></div>}
                        initiallyOpen={true}
                        storageKey="markdown-widget-ai-chat"
                        minimal={true}
                        className="border-none p-0"
                        headerClassName="flex justify-between items-center py-2 cursor-pointer hover:bg-muted/50 rounded-md px-2"
                        contentClassName="pt-2"
                    >
                        <div className="h-[400px]">
                            <ChatPanel
                                preset="simple"
                                engine={chatEngine}
                                extraToggles={chatExtraToggles}
                                layoutId="md-edit-chat-inline"
                                className="h-full"
                            />
                        </div>
                    </CollapsibleSection>
                </div>
            </CardContent>
        </Card>
    );
};

export default MarkdownTextWidgetEdit;
