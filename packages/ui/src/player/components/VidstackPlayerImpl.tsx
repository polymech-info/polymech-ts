import React, { forwardRef } from 'react';
import { MediaPlayer, MediaProvider, type MediaPlayerInstance, type MediaPlayerProps } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';

// Import Vidstack styles
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

interface VidstackPlayerImplProps extends Omit<MediaPlayerProps, 'children'> {
    children?: React.ReactNode;
    layoutProps?: {
        icons?: typeof defaultLayoutIcons;
        noScrubGesture?: boolean;
    };
}

export const VidstackPlayerImpl = forwardRef<MediaPlayerInstance, VidstackPlayerImplProps>(({ children, layoutProps, ...props }, ref) => {
    return (
        <MediaPlayer ref={ref} {...props}>
            <MediaProvider />
            <DefaultVideoLayout
                icons={layoutProps?.icons || defaultLayoutIcons}
                {...layoutProps}
            />
            {children}
        </MediaPlayer>
    );
});

VidstackPlayerImpl.displayName = 'VidstackPlayerImpl';
