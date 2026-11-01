import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/sonner';
import FileBrowser from '@/modules/storage/FileBrowser';

interface FileBrowserAppProps {
    allowPanels?: boolean;
    mode?: 'simple' | 'advanced';
    index?: boolean;
    /** When true (default), initial URL includes `?ribbon=1` so {@link FileBrowser} shows the ribbon. Set false for toolbar chrome. */
    showRibbon?: boolean;
}

const FileBrowserApp: React.FC<FileBrowserAppProps> = ({
    allowPanels = true,
    mode = 'advanced',
    index = true,
    showRibbon = true,
}) => {
    const initialEntry = `/app/filebrowser${showRibbon ? '?ribbon=1' : '?ribbon=0'}`;

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <MemoryRouter initialEntries={[initialEntry]}>
                    <div className="flex flex-col h-full w-full bg-background text-foreground">
                        <FileBrowser allowPanels={allowPanels} mode={mode} index={index} showRibbon={showRibbon} />
                    </div>
                    <Toaster />
                </MemoryRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
};

export default FileBrowserApp;
