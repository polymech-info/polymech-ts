import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchGlobalGroups, GlobalAclGroup } from "@/modules/user/client-acl";

interface GroupPickerProps {
    value?: string | string[];
    onSelect: (groupIdOrName: string, group: any) => void;
    onRemove?: (groupIdOrName: string) => void;
    disabled?: boolean;
    multi?: boolean;
}

export function GroupPicker({ value, onSelect, onRemove, disabled, multi = false }: GroupPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const { data: groups = [], isLoading } = useQuery<GlobalAclGroup[]>({
        queryKey: ['global-acl-groups'],
        queryFn: async () => await fetchGlobalGroups()
    });

    const isSelected = (identifier: string) => {
        if (multi && Array.isArray(value)) {
            return value.includes(identifier);
        }
        return value === identifier;
    };

    const selectedGroups = groups.filter(g => isSelected(g.name) || isSelected(g.id));
    
    // For values that might not be existing IDs but just text strings
    const multiValueArray = Array.isArray(value) ? value : [];
    
    // Resolve what to display on the trigger button
    let displayContent = (
        <span className="text-muted-foreground truncate">Select group...</span>
    );

    if (multi && multiValueArray.length > 0) {
        displayContent = (
            <div className="flex gap-1 flex-wrap items-center">
                {multiValueArray.map(val => {
                    const matched = groups.find(g => g.name === val || g.id === val);
                    const displayName = matched ? matched.name : val;
                    return (
                        <Badge key={val} variant="secondary" className="mr-1 mb-1 truncate max-w-[120px]" onClick={(e) => {
                            if (onRemove) {
                                e.stopPropagation();
                                onRemove(val);
                            }
                        }}>
                            {displayName}
                            {onRemove && <X className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" />}
                        </Badge>
                    );
                })}
            </div>
        );
    } else if (!multi && value) {
        const matched = selectedGroups[0];
        displayContent = (
            <div className="flex items-center gap-2 truncate">
                <Shield className="h-4 w-4 text-primary" />
                <span className="truncate">{matched ? matched.name : value}</span>
            </div>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div 
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
                        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                >
                    <div className="flex-1 flex flex-wrap gap-1 overflow-hidden">
                        {displayContent}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search groups..." value={query} onValueChange={setQuery} />
                    <CommandList>
                        {isLoading && <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>}

                        {!isLoading && groups.length === 0 && (
                            <CommandEmpty>No groups found.</CommandEmpty>
                        )}

                        <CommandGroup>
                            {groups.map((group) => (
                                <CommandItem
                                    key={group.id}
                                    value={group.name}
                                    onSelect={() => {
                                        // Store by name for explicit readability in ACLs / settings, or by ID?
                                        // Typically name is used if settings represent textual groups
                                        onSelect(group.name, group);
                                        if (!multi) {
                                            setOpen(false);
                                        }
                                        setQuery("");
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            isSelected(group.name) || isSelected(group.id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{group.name}</span>
                                        {group.native_type && <span className="text-[10px] text-muted-foreground">{group.native_type}</span>}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
