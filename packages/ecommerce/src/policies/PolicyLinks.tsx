import React from "react";
import { cn } from "@/lib/utils";

export interface PolicyLink {
    label: string;
    href: string;
}

const defaultLinks: PolicyLink[] = [
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Shipping", href: "/shipping" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
];

export interface PolicyLinksProps {
    links?: PolicyLink[];
    className?: string;
}

/**
 * Small footer row of policy links for cart / checkout pages.
 */
export function PolicyLinks({ links = defaultLinks, className }: PolicyLinksProps) {
    return (
        <nav className={cn("flex flex-wrap items-center justify-center gap-y-2 text-xs text-muted-foreground", className)}>
            {links.map((l, i) => (
                <React.Fragment key={l.href}>
                    {i > 0 && <span className="mx-2 select-none" aria-hidden>·</span>}
                    <a href={l.href} className="hover:text-foreground hover:underline transition-colors">
                        {l.label}
                    </a>
                </React.Fragment>
            ))}
        </nav>
    );
}
