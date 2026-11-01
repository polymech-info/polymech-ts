import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { T, translate } from '@/i18n';
import { GridSearchRunPicker } from './GridSearchRunPicker';
import { GridSearchSummary, mergePlacesGridSearches } from '@/modules/places/client-gridsearch';
import { toast } from 'sonner';
import { Loader2, Merge, CheckCircle2 } from 'lucide-react';

interface MergeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetId: string;
    onMergeComplete?: (mergedCount: number) => void;
}

export const MergeDialog: React.FC<MergeDialogProps> = ({
    open,
    onOpenChange,
    targetId,
    onMergeComplete
}) => {
    const [selectedRun, setSelectedRun] = useState<GridSearchSummary | null>(null);
    const [merging, setMerging] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [mergedCount, setMergedCount] = useState(0);

    const handleMerge = async () => {
        if (!selectedRun) return;

        setMerging(true);
        try {
            // we merge into picked search (target) and keep current open (source) intact
            const res = await mergePlacesGridSearches(selectedRun.id, targetId);
            if (res.success) {
                setMergedCount(res.mergedCount);
                setIsComplete(true);
                toast.success(translate("Results added to target search successfully!"));
            } else {
                toast.error(translate("Failed to merge searches."));
            }
        } catch (error: any) {
            console.error(error);
            toast.error(translate("An error occurred during merge."));
        } finally {
            setMerging(false);
        }
    };

    const handleClose = () => {
        if (isComplete && onMergeComplete) {
            onMergeComplete(mergedCount);
        }
        onOpenChange(false);
        // Reset state after closure
        setTimeout(() => {
            setIsComplete(false);
            setSelectedRun(null);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <DialogHeader className="p-8 bg-gradient-to-br from-primary/10 via-background to-background border-b">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-inner">
                            <Merge className="w-8 h-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-2">
                                <T>Merge Results</T>
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium">
                                <T>Select another search run to import its results into this session.</T>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8">
                    {!isComplete ? (
                        <>
                            <GridSearchRunPicker 
                                excludeId={targetId}
                                onSelect={setSelectedRun}
                                className="h-[400px] border-none shadow-none"
                            />
                            
                            <DialogFooter className="mt-8 pt-6 border-t gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-xl h-12 px-6 font-bold uppercase tracking-wider text-xs"
                                >
                                    <T>Cancel</T>
                                </Button>
                                <Button 
                                    disabled={!selectedRun || merging} 
                                    onClick={handleMerge}
                                    className="rounded-xl h-12 px-8 font-black uppercase tracking-wider text-xs shadow-lg shadow-primary/20 group relative overflow-hidden"
                                >
                                    {merging ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Merge className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                    )}
                                    <T>Confirm Merge</T>
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6 text-green-500 shadow-inner">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-2"><T>Merge Successful</T></h3>
                            <p className="text-muted-foreground font-medium mb-8">
                                {translate("Successfully merged results into target. It now contains")} {mergedCount} <T>total locations.</T>
                            </p>
                            <Button 
                                onClick={handleClose}
                                className="rounded-xl h-14 px-12 font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/30"
                            >
                                <T>Got it</T>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
