/**
 * Chat Playground — page wrapper using the reusable ChatPanel.
 *
 * Uses 'developer' preset for the full-featured experience.
 */

import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatPanel from '@/modules/ai/ChatPanel';
import { useChatEngine } from '@/modules/ai/useChatEngine';

const PlaygroundChat: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const engine = useChatEngine();
    const loadedSessionRef = useRef<string | null>(null);

    // Initial load from URL
    useEffect(() => {
        const sessionParam = searchParams.get('session');
        if (sessionParam && sessionParam !== loadedSessionRef.current && sessionParam !== engine.sessionId) {
            loadedSessionRef.current = sessionParam;
            engine.handleLoadSession(sessionParam);
        }
    }, [searchParams, engine]);

    // Sync URL when session changes internally (e.g. from sidebar)
    useEffect(() => {
        if (engine.sessionId && engine.sessionId !== loadedSessionRef.current) {
            loadedSessionRef.current = engine.sessionId;
            setSearchParams({ session: engine.sessionId }, { replace: true });
        }
    }, [engine.sessionId, setSearchParams]);

    return (
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)]">
            <ChatPanel preset="developer" engine={engine} />
        </div>
    );
};

export default PlaygroundChat;
