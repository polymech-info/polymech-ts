import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Sidebar({ children, className, ...props }: SidebarProps) {
    return (
        <aside
            className={cn(
                "hidden lg:block w-64 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto",
                className
            )}
            {...props}
        >
            {children}
        </aside>
    );
}
