import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2 } from 'lucide-react';
import { type PlacesSettings } from './usePlacesSettings';

interface PlacesSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: PlacesSettings;
    updateExcludedTypes: (types: string[]) => Promise<void>;
}

export const PlacesSettingsDialog: React.FC<PlacesSettingsDialogProps> = ({
    open,
    onOpenChange,
    settings,
    updateExcludedTypes,
}) => {
    // const { settings, loading, updateExcludedTypes } = useCompetitorSettings();
    const loading = false; // We can pass loading if needed, or handle it differently.
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingExcluded, setPendingExcluded] = useState<string[] | null>(null);

    // Use pending state if editing, otherwise source of truth
    const currentExcluded = pendingExcluded ?? settings.excluded_types;

    // Initialize pending state when dialog opens
    React.useEffect(() => {
        if (open) {
            setPendingExcluded(settings.excluded_types);
        } else {
            setPendingExcluded(null);
            setSearchTerm('');
        }
    }, [open, settings.excluded_types]);

    const handleToggle = (type: string) => {
        if (!pendingExcluded) return;

        if (pendingExcluded.includes(type)) {
            setPendingExcluded(pendingExcluded.filter(t => t !== type));
        } else {
            setPendingExcluded([...pendingExcluded, type]);
        }
    };

    const handleSave = async () => {
        if (pendingExcluded) {
            await updateExcludedTypes(pendingExcluded);
            onOpenChange(false);
        }
    };

    const allTypes = React.useMemo(() => {
        const types = new Set([...settings.known_types, ...(currentExcluded || [])]);
        return Array.from(types).sort();
    }, [settings.known_types, currentExcluded]);

    const filteredTypes = allTypes.filter(t =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Excluded Location Types</DialogTitle>
                    <DialogDescription>
                        Select types to exclude from search results. These settings are saved to your profile.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2 my-4">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search types..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 h-8"
                    />
                </div>

                <div className="border rounded-md">
                    <ScrollArea className="h-[300px] p-4">
                        {loading && filteredTypes.length === 0 ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : filteredTypes.length === 0 ? (
                            <div className="text-center text-sm text-gray-500 py-8">
                                No types found matching "{searchTerm}"
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTypes.map((type) => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`type-${type}`}
                                            checked={currentExcluded.includes(type)}
                                            onCheckedChange={() => handleToggle(type)}
                                        />
                                        <label
                                            htmlFor={`type-${type}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {type}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
