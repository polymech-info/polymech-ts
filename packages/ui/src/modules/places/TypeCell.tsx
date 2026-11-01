import React from 'react';
import {
    Ban
} from 'lucide-react';
import { T } from '../../i18n';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Badge } from "@/components/ui/badge"

interface TypeCellProps {
    types: string[];
    excludedTypes: string[];
    onToggle: (type: string) => void;
}

export const TypeCell: React.FC<TypeCellProps> = ({ types, excludedTypes = [], onToggle }) => {
    // We'll display up to 2 types, and a "+X" if more.
    // Clicking a type or the extra indicator could open a menu?
    // User asked to "exclude types from there".
    // Let's use badges that have a context menu or hover effect.
    // Shadcn badges are simple. A dropdown menu on the cell might be cleaner.

    if (!types || types.length === 0) return null;

    // Sanitize: filter out any non-string entries (objects, nulls, numbers)
    const safeTypes = types.filter((t): t is string => typeof t === 'string');

    const displayTypes = safeTypes.slice(0, 2);
    const hasMore = safeTypes.length > 2;

    const renderBadge = (type: string) => {
        const isExcluded = excludedTypes.includes(type);
        return (
            <DropdownMenu key={type}>
                <DropdownMenuTrigger asChild>
                    <Badge
                        variant={isExcluded ? "destructive" : "secondary"}
                        className={`cursor-pointer hover:opacity-80 whitespace-nowrap px-1.5 py-0 text-xs font-normal border-gray-200 dark:border-gray-700 ${isExcluded ? 'line-through opacity-70' : 'text-gray-600 dark:text-gray-300'
                            }`}
                    >
                        {type.replace(/_/g, ' ')}
                    </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onToggle(type)}
                    >
                        {isExcluded ? (
                            <>
                                <span className="mr-2"><T>Restore</T> "{type}"</span>
                            </>
                        ) : (
                            <>
                                <Ban className="mr-2 h-4 w-4 text-red-600 dark:text-red-500" />
                                <span className="text-red-600 dark:text-red-500"><T>Exclude</T> "{type}"</span>
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    return (
        <div className="flex items-center gap-1 flex-wrap h-full overflow-hidden">
            {displayTypes.map(type => renderBadge(type))}
            {hasMore && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Badge variant="outline" className="cursor-pointer text-xs px-1.5 py-0">
                            +{safeTypes.length - 2}
                        </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel><T>Other Types</T></DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {safeTypes.slice(2).map(type => {
                            const isExcluded = excludedTypes.includes(type);
                            return (
                                <DropdownMenuItem
                                    key={type}
                                    className="cursor-pointer flex justify-between"
                                    onClick={() => onToggle(type)}
                                >
                                    <span className={isExcluded ? "line-through text-gray-400 dark:text-gray-500" : ""}>
                                        {type.replace(/_/g, ' ')}
                                    </span>
                                    {!isExcluded && <Ban className="ml-2 h-3 w-3 opacity-50 text-red-600 dark:text-red-500" />}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
};
