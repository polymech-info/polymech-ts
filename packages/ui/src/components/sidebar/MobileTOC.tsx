import React, { useState } from 'react';
import { TableOfContents } from './TableOfContents';
import { MarkdownHeading } from '@/lib/toc';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { T } from '@/i18n';

interface MobileTOCProps {
    headings: MarkdownHeading[];
}

export function MobileTOC({ headings }: MobileTOCProps) {
    const [open, setOpen] = useState(false);

    if (!headings || headings.length === 0) return null;

    return (
        <div className="lg:hidden mb-6 pt-4">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            <T>Table of Contents</T>
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {headings.length} <T>items</T>
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onClickCapture={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('a')) setOpen(false);
                    }}
                >
                    <div className="max-h-[50vh] overflow-y-auto p-4">
                        <div className="mt-0 pt-0 border-t-0">
                            <TableOfContents
                                headings={headings}
                                minHeadingLevel={1}
                                title="Contents"
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
