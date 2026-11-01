import { useAppConfig } from '@/hooks/useSystemInfo';
import { T } from '@/i18n';

const policyLinks = [
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Shipping", href: "/shipping" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Impressum", href: "/impressum" },
];

const Footer = () => {
    const config = useAppConfig();
    if (!config) return null;
    const { footer_left = [], footer_right = [], metadata } = config;
    const allLinks = [...footer_left, ...footer_right];
    return (
        <footer className="border-t border-border/40 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Column 1: Navigation links */}
                    {allLinks.length > 0 && (
                        <nav className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 mb-1"><T>Links</T></span>
                            {allLinks.map((link, i) => {
                                const isExternal = link.href.startsWith('http');
                                return (
                                    <a
                                        key={i}
                                        href={link.href}
                                        target={isExternal ? '_blank' : undefined}
                                        rel={isExternal ? 'noopener noreferrer' : undefined}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <T>{link.text}</T>
                                    </a>
                                );
                            })}
                        </nav>
                    )}

                    {/* Column 2: Policy links */}
                    <nav className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 mb-1"><T>Policies</T></span>
                        {policyLinks.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                            >
                                <T>{l.label}</T>
                            </a>
                        ))}
                    </nav>

                    {/* Column 3: Copyright / meta */}
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:items-end">
                        {metadata?.author && (
                            <span>
                                © {new Date().getFullYear()}{' '}
                                {metadata.author_url ? (
                                    <a
                                        href={metadata.author_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-foreground transition-colors underline underline-offset-2"
                                    >
                                        {metadata.author}
                                    </a>
                                ) : (
                                    metadata.author
                                )}
                            </span>
                        )}
                        {metadata?.description && (
                            <span className="max-w-xs sm:text-right">{metadata.description}</span>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
