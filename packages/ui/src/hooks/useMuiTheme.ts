import { useMemo, useSyncExternalStore } from 'react';
import { createTheme, Theme } from '@mui/material/styles';

/**
 * Observe the resolved theme from the <html> element's class list.
 * Returns a MUI theme that stays in sync with the app's dark/light mode.
 */

function subscribe(cb: () => void) {
    const target = document.documentElement;
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                cb();
                break;
            }
        }
    });
    observer.observe(target, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
}

function getSnapshot(): 'dark' | 'light' {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useMuiTheme(): Theme {
    const mode = useSyncExternalStore(subscribe, getSnapshot);
    return useMemo(() => createTheme({ palette: { mode } }), [mode]);
}
