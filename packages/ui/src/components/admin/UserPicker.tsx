import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2, User } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { serverUrl } from "@/lib/db";

interface UserPickerProps {
    value?: string;
    onSelect: (userId: string, user: any) => void;
    disabled?: boolean;
}

export function UserPicker({ value, onSelect, disabled }: UserPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { session } = useAuth();

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query && open) {
                searchUsers(query);
            } else if (open && !query) {
                // Optionally load recent/default users
                searchUsers("");
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, open]);

    const searchUsers = async (q: string) => {
        try {
            setLoading(true);
            const url = q
                ? `${serverUrl}/api/profiles?q=${encodeURIComponent(q)}`
                : `${serverUrl}/api/profiles`;

            // Remove early return to allow fetching defaults
            // if (!q) { ... }

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const selectedUser = users.find((u) => u.user_id === value) || (value ? { user_id: value, display_name: value } : null);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {selectedUser ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={selectedUser.avatar_url} />
                                <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                            </Avatar>
                            <span>{selectedUser.display_name || selectedUser.username || selectedUser.user_id}</span>
                        </div>
                    ) : (
                        "Select user..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Search users..." value={query} onValueChange={setQuery} />
                    <CommandList>
                        {loading && <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>}

                        {!loading && users.length === 0 && (
                            <CommandEmpty>No users found.</CommandEmpty>
                        )}

                        <CommandGroup>
                            {users.map((user) => (
                                <CommandItem
                                    key={user.user_id}
                                    value={user.user_id}
                                    onSelect={() => {
                                        onSelect(user.user_id, user);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === user.user_id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <Avatar className="h-6 w-6 mr-2">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.display_name || 'No Name'}</span>
                                        <span className="text-xs text-muted-foreground">@{user.username || 'unknown'}</span>
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
