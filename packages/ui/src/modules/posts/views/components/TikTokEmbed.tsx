
import React, { useEffect } from 'react';
import { getTikTokId } from '../utils';

interface TikTokEmbedProps {
    url: string;
}

declare global {
    interface Window {
        tiktok?: {
            embed?: {
                check: () => void;
            };
        };
    }
}

export const TikTokEmbed: React.FC<TikTokEmbedProps> = ({ url }) => {
    const videoId = getTikTokId(url);

    useEffect(() => {
        // Load TikTok script if not already present
        const SCRIPT_ID = 'tiktok-embed-script';
        let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement;

        if (!script) {
            script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
        } else {
            // If script exists, re-check for new embeds
            if (window.tiktok?.embed) {
                window.tiktok.embed.check();
            }
        }

        // Cleanup not really needed for script, but we might want to handle unmount quirks
    }, [url]);

    if (!videoId) {
        return <div className="p-4 text-red-500">Invalid TikTok URL</div>;
    }

    return (
        <div className="flex justify-center w-full">
            <blockquote
                className="tiktok-embed"
                cite={url}
                data-video-id={videoId}
                data-embed-from="oembed"
                style={{ maxWidth: '605px', minWidth: '325px', width: '100%', margin: '0 0' }}
            >
                <section>
                    <a target="_blank" href={url} rel="noreferrer">
                        {url}
                    </a>
                </section>
            </blockquote>
        </div>
    );
};
