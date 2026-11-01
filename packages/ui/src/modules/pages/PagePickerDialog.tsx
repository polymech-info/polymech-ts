import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { T, translate } from '@/i18n';
import { Search, FileText, Check, Users, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { fetchFeed } from '@/modules/feed/client-feed';

/** Simplified page shape returned from the feed API */
interface FeedPage {
    id: string;
    title: string;
    slug: string;       // from meta.slug
    user_id: string;    // owner UUID
    author?: { display_name?: string; username?: string };
}

interface PagePickerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (page: FeedPage | null) => void;
    currentValue?: string | null;
    forbiddenIds?: string[];
}

export const PagePickerDialog: React.FC<PagePickerDialogProps> = ({
    isOpen,
    onClose,
    onSelect,
    currentValue,
    forbiddenIds = []
}) => {
    const { user } = useAuth();
    const [pages, setPages] = useState<FeedPage[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(currentValue || null);
    const [showAllUsers, setShowAllUsers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPages();
            setSelectedId(currentValue || null);
        }
    }, [isOpen, currentValue, showAllUsers]);

    const fetchPages = async () => {
        setLoading(true);
        try {
            const feedItems: any[] = await fetchFeed({
                contentType: 'pages',
                limit: 200,
                sortBy: 'latest',
                visibilityFilter: 'invisible',
                ...(!showAllUsers && user?.id ? { source: 'user', sourceId: user.id } : {}),
            });

            // Transform feed items into simple page objects
            const transformed: FeedPage[] = feedItems
                .filter((item: any) => item.type === 'page-intern' || item.meta?.slug)
                .map((item: any) => ({
                    id: item.id,
                    title: item.title || 'Untitled',
                    slug: item.meta?.slug || item.slug || item.id,
                    user_id: item.user_id || item.owner || '',
                    author: item.author,
                }));

            setPages(transformed);
        } catch (err) {
            console.error('Error fetching pages:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredPages = useMemo(() => {
        return pages
            .filter(page => !forbiddenIds.includes(page.id))
            .filter(page => {
                const q = searchQuery.toLowerCase();
                return page.title.toLowerCase().includes(q) ||
                    page.slug.toLowerCase().includes(q) ||
                    (page.author?.display_name || '').toLowerCase().includes(q);
            });
    }, [pages, searchQuery, forbiddenIds]);

    const handleConfirm = () => {
        if (selectedId) {
            const selectedPage = pages.find(p => p.id === selectedId) || null;
            onSelect(selectedPage);
        } else {
            onSelect(null);
        }
        onClose();
    };

    const handleClear = () => {
        setSelectedId(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle><T>Select Page</T></DialogTitle>
                    <DialogDescription>
                        <T>Choose a page to link in the menu.</T>
                    </DialogDescription>
                </DialogHeader>

                {/* Search + scope toggle */}
                <div className="flex gap-2 my-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={translate('Search pages...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button
                        variant={showAllUsers ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowAllUsers(!showAllUsers)}
                        className="shrink-0 h-10"
                        title={showAllUsers ? translate('Showing all users') : translate('Showing my pages')}
                    >
                        {showAllUsers ? <Users className="h-4 w-4 mr-1.5" /> : <User className="h-4 w-4 mr-1.5" />}
                        {showAllUsers ? <T>All</T> : <T>Mine</T>}
                    </Button>
                </div>

                {/* Pages Grid */}
                <div className="flex-1 overflow-y-auto min-h-0 border rounded-md bg-muted/10 p-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredPages.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">
                                <T>{searchQuery ? 'No pages found' : 'No pages available'}</T>
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Option for None */}
                            <div
                                onClick={handleClear}
                                className={cn(
                                    "cursor-pointer rounded-lg border-2 p-3 flex items-center gap-3 transition-all hover:border-primary/50 bg-background",
                                    selectedId === null ? "border-primary" : "border-transparent"
                                )}
                            >
                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">/</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate"><T>None</T></p>
                                    <p className="text-xs text-muted-foreground truncate"><T>Clear selection</T></p>
                                </div>
                                {selectedId === null && <Check className="h-4 w-4 text-primary" />}
                            </div>

                            {filteredPages.map((page) => (
                                <div
                                    key={page.id}
                                    onClick={() => setSelectedId(page.id)}
                                    onDoubleClick={() => {
                                        setSelectedId(page.id);
                                        onSelect(page);
                                        onClose();
                                    }}
                                    className={cn(
                                        "cursor-pointer rounded-lg border-2 p-3 flex items-center gap-3 transition-all hover:border-primary/50 bg-background",
                                        selectedId === page.id ? "border-primary" : "border-transparent"
                                    )}
                                >
                                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{page.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            /{page.slug}
                                            {showAllUsers && page.author?.display_name && (
                                                <span className="ml-1 opacity-60">• {page.author.display_name}</span>
                                            )}
                                        </p>
                                    </div>
                                    {selectedId === page.id && <Check className="h-4 w-4 text-primary" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end items-center pt-4 gap-2">
                    <Button variant="outline" onClick={onClose}>
                        <T>Cancel</T>
                    </Button>
                    <Button onClick={handleConfirm}>
                        <T>Confirm Selection</T>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
