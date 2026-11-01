import React, { useEffect, useRef, useCallback } from 'react';
import { ModelSelector } from './ModelSelector';
import { useAuth } from '@/hooks/useAuth';
import { T } from '@/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


interface ModelSelectorPanelProps {
    /** Controlled model value */
    value?: string;
    /** Called when model changes */
    onChange?: (model: string) => void;

    /** Persistence: load saved model. Receives userId, returns model string or null. Defaults to wizardDb.loadWizardModel */
    onLoadModel?: (userId: string) => Promise<string | null>;
    /** Persistence: save model. Receives userId and model string. Defaults to wizardDb.saveWizardModel */
    onSaveModel?: (userId: string, model: string) => Promise<void>;

    /** Google-specific: aspect ratio */
    aspectRatio?: string;
    onAspectRatioChange?: (ratio: string) => void;

    /** Google-specific: resolution */
    resolution?: string;
    onResolutionChange?: (res: string) => void;

    /** Google-specific: search grounding */
    searchGrounding?: boolean;
    onSearchGroundingChange?: (enabled: boolean) => void;

    /** Google-specific: image search */
    imageSearch?: boolean;
    onImageSearchChange?: (enabled: boolean) => void;

    /** Label override */
    label?: string;
    /** Hide step-number prefix */
    showStepNumber?: boolean;
}

/**
 * Self-contained AI-model selector with built-in persistence
 * and Google-model advanced options (aspect ratio, resolution, grounding).
 *
 * Works both controlled (`value`+`onChange`) and uncontrolled.
 * Drop inside a `<CollapsibleSection>` wherever you need it.
 */
export const ModelSelectorPanel: React.FC<ModelSelectorPanelProps> = ({
    value,
    onChange,
    onLoadModel,
    onSaveModel,
    aspectRatio = '1:1',
    onAspectRatioChange,
    resolution = '1K',
    onResolutionChange,
    searchGrounding = false,
    onSearchGroundingChange,
    imageSearch = false,
    onImageSearchChange,
    label,
    showStepNumber = false,
}) => {
    const { user } = useAuth();
    const [internalModel, setInternalModel] = React.useState('google:gemini-2.0-flash-exp');
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadedRef = useRef(false);

    const selectedModel = value ?? internalModel;
    const isGoogle = selectedModel.startsWith('google/');

    // Load persisted model on mount (only if handler provided)
    useEffect(() => {
        if (!user?.id || loadedRef.current || !onLoadModel) return;
        loadedRef.current = true;
        onLoadModel(user.id).then((model) => {
            if (model) {
                setInternalModel(model);
                onChange?.(model);
            }
        });
    }, [user?.id, onLoadModel]);

    // Debounced save (only if handler provided)
    const persist = useCallback(
        (model: string) => {
            if (!user?.id || !onSaveModel) return;
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(() => {
                onSaveModel(user.id, model);
            }, 500);
        },
        [user?.id, onSaveModel],
    );

    useEffect(() => () => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
    }, []);

    const handleChange = useCallback(
        (model: string) => {
            setInternalModel(model);
            onChange?.(model);
            persist(model);
        },
        [onChange, persist],
    );

    return (
        <div className="space-y-3">
            <ModelSelector
                selectedModel={selectedModel}
                onChange={handleChange}
                label={label}
                showStepNumber={showStepNumber}
            />

            {/* Google Model Advanced Options */}
            {isGoogle && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground"><T>Aspect Ratio</T></label>
                        <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Aspect Ratio" />
                            </SelectTrigger>
                            <SelectContent>
                                {["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"].map(ratio => (
                                    <SelectItem key={ratio} value={ratio} className="text-xs">{ratio}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground"><T>Resolution</T></label>
                        <Select value={resolution} onValueChange={onResolutionChange}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Resolution" />
                            </SelectTrigger>
                            <SelectContent>
                                {["1K", "2K", "4K"].map(res => (
                                    <SelectItem key={res} value={res} className="text-xs">{res}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Search Grounding */}
            {isGoogle && (
                <div className="flex items-center justify-between">
                    <Label htmlFor="search-grounding" className="flex flex-col space-y-1">
                        <span className="font-medium text-sm"><T>Grounding with Google Search</T></span>
                        <span className="text-xs text-muted-foreground">
                            <T>Use Google Search to improve image relevance and accuracy.</T>
                        </span>
                    </Label>
                    <Switch
                        id="search-grounding"
                        checked={searchGrounding}
                        onCheckedChange={onSearchGroundingChange}
                    />
                </div>
            )}

            {/* Image Search Grounding */}
            {isGoogle && (
                <div className="flex items-center justify-between">
                    <Label htmlFor="image-search-wizard" className="flex flex-col space-y-1">
                        <span className="font-medium text-sm"><T>Grounding with Image Search</T></span>
                        <span className="text-xs text-muted-foreground">
                            <T>Use Google Image Search for visual context.</T>
                        </span>
                    </Label>
                    <Switch
                        id="image-search-wizard"
                        checked={imageSearch}
                        onCheckedChange={(checked) => {
                            onImageSearchChange?.(checked);
                            if (checked) onSearchGroundingChange?.(true);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default ModelSelectorPanel;
