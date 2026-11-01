import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { T } from '@/i18n';
import {
    ExternalLink,
    FileText,
    FolderTree,
    FolderOpen,
    Link as LinkIcon,
    Menu as MenuIcon,
    ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchCategories, type Category } from '@/modules/categories/client-categories';

// ─── Types (shared with Edit) ─────────────────────────────────

export interface MenuItemData {
    id: string;
    label: string;
    type: 'custom' | 'page' | 'category' | 'file';
    fileMount?: string;
    filePath?: string;
    href?: string;
    targetPageId?: string;
    targetPageSlug?: string;
    targetPageOwner?: string;
    categoryId?: string;
    categorySlug?: string;
    showChildren?: boolean;
    openInNewTab?: boolean;
}

export type MenuWidgetSize = 'sm' | 'md' | 'lg' | 'xl';
export type MenuWidgetAlign = 'left' | 'center' | 'right';
export type MenuWidgetVariant = 'plain' | 'bar' | 'glass' | 'pill' | 'underline';
export type MenuWidgetSpacing = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type MenuWidgetBg = 'none' | 'custom' | 'muted' | 'dark' | 'primary' | 'accent'
    | 'gradient-primary' | 'gradient-dark' | 'gradient-ocean'
    | 'gradient-sunset' | 'gradient-forest' | 'gradient-brand';

export interface MenuWidgetViewProps {
    items?: MenuItemData[];
    orientation?: 'horizontal' | 'vertical';
    size?: MenuWidgetSize;
    align?: MenuWidgetAlign;
    variant?: MenuWidgetVariant;
    padding?: MenuWidgetSpacing;
    margin?: MenuWidgetSpacing;
    bg?: MenuWidgetBg;
    bgFrom?: string;
    bgTo?: string;
    [key: string]: any;
}

// ─── Helpers ──────────────────────────────────────────────────

export const resolveHref = (item: MenuItemData, ownerUserId?: string): string => {
    switch (item.type) {
        case 'page':
            if (item.targetPageSlug) {
                const owner = item.targetPageOwner || ownerUserId || '';
                return `/user/${owner}/pages/${item.targetPageSlug}`;
            }
            return '#';
        case 'category':
            return item.categorySlug ? `/categories/${item.categorySlug}` : '#';
        case 'file': {
            if (item.fileMount && item.filePath) {
                const cleanPath = item.filePath.replace(/^\/+/, '');
                // Check if it's a file (has extension) vs folder
                const lastSegment = cleanPath.split('/').pop() || '';
                const isFile = lastSegment.includes('.');
                if (isFile) {
                    // Files: /app/filebrowser/{mount}/{dir}?file={filename}
                    const dir = cleanPath.substring(0, cleanPath.lastIndexOf('/'));
                    const basePath = dir
                        ? `/app/filebrowser/${item.fileMount}/${dir}`
                        : `/app/filebrowser/${item.fileMount}`;
                    return `${basePath}?file=${encodeURIComponent(lastSegment)}`;
                }
                // Folders: /app/filebrowser/{mount}/{path}
                return cleanPath
                    ? `/app/filebrowser/${item.fileMount}/${cleanPath}`
                    : `/app/filebrowser/${item.fileMount}`;
            }
            return item.href || '#';
        }
        case 'custom':
        default:
            return item.href || '#';
    }
};

export const typeIcon = (type: MenuItemData['type']) => {
    switch (type) {
        case 'page': return <FileText className="h-3 w-3" />;
        case 'category': return <FolderTree className="h-3 w-3" />;
        case 'file': return <FolderOpen className="h-3 w-3" />;
        default: return <LinkIcon className="h-3 w-3" />;
    }
};

// ─── Category Children Sub-Menu (Desktop) ─────────────────────

const CategoryWithChildren: React.FC<{
    item: MenuItemData;
    linkClasses: string;
}> = ({ item, linkClasses }) => {
    const [children, setChildren] = useState<Category[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [open, setOpen] = useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const panelRef = React.useRef<HTMLDivElement>(null);
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch eagerly on mount (cached/deduped)
    useEffect(() => {
        if (loaded || !item.categorySlug) return;
        fetchCategories({ parentSlug: item.categorySlug })
            .then(cats => { setChildren(cats); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, [loaded, item.categorySlug]);

    // Click-outside to close
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const parentHref = resolveHref(item);

    const handleEnter = () => {
        if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
        setOpen(true);
    };
    const handleLeave = () => {
        closeTimer.current = setTimeout(() => setOpen(false), 200);
    };

    // Compute dropdown position from trigger rect
    const rect = triggerRef.current?.getBoundingClientRect();
    const portalStyle: React.CSSProperties = rect ? {
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 9999,
    } : { display: 'none' };

    return (
        <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(o => !o)}
                className={cn(linkClasses, "inline-flex items-center gap-1")}
            >
                <T>{item.label}</T>
                <ChevronDown className={cn("h-3 w-3 opacity-40 transition-transform", open && "rotate-180")} />
            </button>

            {open && ReactDOM.createPortal(
                <div
                    ref={panelRef}
                    style={portalStyle}
                    className="min-w-[180px] py-1 bg-popover border rounded-md shadow-md animate-in fade-in-0 zoom-in-95"
                    onMouseEnter={handleEnter}
                    onMouseLeave={handleLeave}
                >
                    {/* Parent category link */}
                    <Link
                        to={parentHref}
                        className="block px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors border-b border-border/50 mb-1"
                    >
                        <T>{item.label}</T>
                    </Link>
                    {!loaded ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">…</div>
                    ) : children.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground"><T>No subcategories</T></div>
                    ) : (
                        children.map(child => (
                            <Link
                                key={child.id}
                                to={`/categories/${child.slug}`}
                                className="block px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                            >
                                <T>{child.name}</T>
                            </Link>
                        ))
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

// ─── View Component ───────────────────────────────────────────

const sizeClasses: Record<MenuWidgetSize, { link: string; icon: string }> = {
    sm: { link: 'text-xs px-2 py-1', icon: 'h-2.5 w-2.5' },
    md: { link: 'text-sm px-3 py-1.5', icon: 'h-3 w-3' },
    lg: { link: 'text-base px-4 py-2', icon: 'h-4 w-4' },
    xl: { link: 'text-lg px-5 py-2.5', icon: 'h-5 w-5' },
};

const paddingClasses: Record<MenuWidgetSpacing, string> = {
    none: '', xs: 'p-1', sm: 'p-2', md: 'p-3', lg: 'p-4', xl: 'p-6',
};
const marginClasses: Record<MenuWidgetSpacing, string> = {
    none: '', xs: 'm-1', sm: 'm-2', md: 'm-3', lg: 'm-4', xl: 'm-6',
};

const bgClasses: Record<MenuWidgetBg, string> = {
    none: '',
    custom: '', // handled via inline style
    muted: 'bg-muted text-muted-foreground',
    dark: 'bg-zinc-900 dark:bg-zinc-950 text-zinc-100',
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
    'gradient-primary': 'bg-gradient-to-r from-primary/80 to-primary/40 text-primary-foreground',
    'gradient-dark': 'bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-800 dark:to-zinc-600 text-zinc-100',
    'gradient-ocean': 'bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-700 dark:to-cyan-600 text-white',
    'gradient-sunset': 'bg-gradient-to-r from-orange-500 to-pink-500 dark:from-orange-600 dark:to-pink-600 text-white',
    'gradient-forest': 'bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-700 dark:to-teal-600 text-white',
    'gradient-brand': 'bg-gradient-to-r from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 text-zinc-900',
};

const alignClasses: Record<MenuWidgetAlign, string> = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
};

const variantNavClasses: Record<MenuWidgetVariant, string> = {
    plain: '',
    bar: 'bg-muted/60 rounded-lg px-2 py-1',
    glass: 'bg-background/40 backdrop-blur-md border border-border/30 rounded-lg px-2 py-1 shadow-sm',
    pill: 'gap-2',
    underline: 'border-b border-border/50 rounded-none pb-0.5',
};

const variantLinkClasses: Record<MenuWidgetVariant, string> = {
    plain: 'hover:bg-muted/50 rounded-md',
    bar: 'hover:bg-background/60 rounded-md',
    glass: 'hover:bg-white/10 rounded-md',
    pill: 'bg-muted/40 hover:bg-muted rounded-full',
    underline: 'rounded-none border-b-2 border-transparent hover:border-primary hover:bg-transparent',
};

const MenuWidgetView: React.FC<MenuWidgetViewProps> = ({
    items = [],
    orientation = 'horizontal',
    size = 'md',
    align = 'left',
    variant = 'plain',
    padding = 'none',
    margin = 'none',
    bg = 'none',
    bgFrom = '#3b82f6',
    bgTo = '#8b5cf6',
}) => {
    const { user } = useAuth();

    if (items.length === 0) return null;

    const ownerUserId = user?.id;
    const sz = sizeClasses[size] || sizeClasses.md;
    const vLink = variantLinkClasses[variant] || variantLinkClasses.plain;

    const hasBg = bg !== 'none';
    const linkClasses = cn(
        "font-medium transition-colors whitespace-nowrap",
        hasBg ? "text-inherit hover:opacity-80" : "text-foreground/80 hover:text-primary",
        sz.link,
        vLink
    );

    const renderLink = (item: MenuItemData) => {
        // Category with showChildren → render sub-menu component
        if (item.type === 'category' && item.showChildren) {
            return <CategoryWithChildren key={item.id} item={item} linkClasses={linkClasses} />;
        }

        const href = resolveHref(item, ownerUserId);
        const isExternal = item.type === 'custom' && href.startsWith('http');
        const isFileLink = item.type === 'file';

        if (isExternal || isFileLink || item.openInNewTab) {
            return (
                <a
                    key={item.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(linkClasses, "inline-flex items-center gap-1")}
                >
                    <T>{item.label}</T>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
            );
        }

        return (
            <Link key={item.id} to={href} className={linkClasses}>
                <T>{item.label}</T>
            </Link>
        );
    };

    // Mobile: render category children as DropdownMenuSub
    const renderMobileItem = (item: MenuItemData) => {
        if (item.type === 'category' && item.showChildren) {
            return <MobileCategorySubMenu key={item.id} item={item} ownerUserId={ownerUserId} />;
        }

        const href = resolveHref(item, ownerUserId);
        const isExternal = item.type === 'custom' && href.startsWith('http');
        const isFileLink = item.type === 'file';

        if (isExternal || isFileLink || item.openInNewTab) {
            return (
                <DropdownMenuItem key={item.id} asChild>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        {typeIcon(item.type)}
                        <T>{item.label}</T>
                        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                    </a>
                </DropdownMenuItem>
            );
        }

        return (
            <DropdownMenuItem key={item.id} asChild>
                <Link to={href} className="flex items-center gap-2">
                    {typeIcon(item.type)}
                    <T>{item.label}</T>
                </Link>
            </DropdownMenuItem>
        );
    };

    return (
        <div
            className={cn(
                bg !== 'none' && bg !== 'custom' && (bgClasses[bg] || ''),
                bg === 'custom' && 'text-white',
                variantNavClasses[variant] || '',
                paddingClasses[padding] || '',
                marginClasses[margin] || '',
                bg !== 'none' && 'rounded-md'
            )}
            style={bg === 'custom' ? {
                background: `linear-gradient(to right, ${bgFrom}, ${bgTo})`,
            } : undefined}
        >
            {/* Desktop: horizontal/vertical nav */}
            <nav
                className={cn(
                    "hidden md:flex items-center gap-1 flex-wrap",
                    orientation === 'vertical' && "md:flex-col md:items-start",
                    orientation === 'horizontal' && (alignClasses[align] || alignClasses.left),
                )}
            >
                {items.map(renderLink)}
            </nav>

            {/* Mobile: dropdown */}
            <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant={hasBg ? "ghost" : "outline"} size="sm" className={cn(
                            "w-full justify-between",
                            hasBg && "text-inherit border-current/20 hover:bg-white/20"
                        )}>
                            <span className="flex items-center gap-2">
                                <MenuIcon className="h-4 w-4" />
                                <T>Menu</T>
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        {items.map(renderMobileItem)}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

// ─── Mobile Category Sub-Menu ─────────────────────────────────

const MobileCategorySubMenu: React.FC<{
    item: MenuItemData;
    ownerUserId?: string;
}> = ({ item }) => {
    const [children, setChildren] = useState<Category[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (loaded || !item.categorySlug) return;
        fetchCategories({ parentSlug: item.categorySlug })
            .then(cats => { setChildren(cats); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, [loaded, item.categorySlug]);

    const parentHref = resolveHref(item);

    if (loaded && children.length === 0) {
        return (
            <DropdownMenuItem asChild>
                <Link to={parentHref} className="flex items-center gap-2">
                    {typeIcon(item.type)}
                    <T>{item.label}</T>
                </Link>
            </DropdownMenuItem>
        );
    }

    return (
        <>
            {/* Toggle row — prevent dropdown close */}
            <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); setExpanded(o => !o); }}
                className="flex items-center gap-2 cursor-pointer"
            >
                {typeIcon(item.type)}
                <span className="flex-1"><T>{item.label}</T></span>
                <ChevronDown className={cn(
                    "h-3 w-3 opacity-50 transition-transform",
                    expanded && "rotate-180"
                )} />
            </DropdownMenuItem>

            {/* Expanded children inline */}
            {expanded && (
                <div className="pl-4 border-l-2 border-border/50 ml-3 my-0.5">
                    <DropdownMenuItem asChild>
                        <Link to={parentHref} className="flex items-center gap-2 font-medium text-xs">
                            <FolderTree className="h-3 w-3" />
                            <T>{item.label}</T>
                        </Link>
                    </DropdownMenuItem>
                    {children.map(child => (
                        <DropdownMenuItem key={child.id} asChild>
                            <Link to={`/categories/${child.slug}`} className="flex items-center gap-2 text-xs">
                                <T>{child.name}</T>
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </div>
            )}
        </>
    );
};

export default MenuWidgetView;
