import React, { useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { VideoModelInfo, AVAILABLE_VIDEO_MODELS, VideoGenerationOptions } from "@/lib/video-router";

interface VideoSettingsControlsProps {
    modelName: string;
    onModelChange: (model: string) => void;
    settings: VideoGenerationOptions;
    onSettingsChange: (settings: VideoGenerationOptions) => void;
    disabled?: boolean;
}

export const VideoSettingsControls: React.FC<VideoSettingsControlsProps> = ({
    modelName,
    onModelChange,
    settings,
    onSettingsChange,
    disabled
}) => {
    const selectedModel = AVAILABLE_VIDEO_MODELS.find(m => m.modelName === modelName) || AVAILABLE_VIDEO_MODELS[0];

    // Effect to reset invalid settings when model changes
    useEffect(() => {
        const newSettings = { ...settings };
        let changed = false;

        if (selectedModel) {
            if (!settings.aspectRatio || !selectedModel.aspectRatios.includes(settings.aspectRatio)) {
                // Default to first available or 16:9 if available
                if (selectedModel.aspectRatios.includes('16:9')) newSettings.aspectRatio = '16:9';
                else newSettings.aspectRatio = selectedModel.aspectRatios[0];
                changed = true;
            }
            if (!settings.resolution || !selectedModel.resolutions.includes(settings.resolution)) {
                if (selectedModel.resolutions.includes('720p')) newSettings.resolution = '720p';
                else newSettings.resolution = selectedModel.resolutions[0];
                changed = true;
            }
            // Duration handling needs logic because it's number in config but string in UI often?
            // The model defines maxDuration, but specific allowed values "4", "6", "8" are in the table.
            // Let's assume user picks from specific options if restricted, or we enforce valid ones.
            // The Interface allows any number, but table says "4", "6", "8".
            // Let's coerce to a valid default if missing.
            if (!settings.durationSeconds || settings.durationSeconds > selectedModel.maxDuration) {
                newSettings.durationSeconds = selectedModel.maxDuration; // Default to max? Or min? 
                // Usually safest is max or 4? Table says "4", "6", "8".
                changed = true;
            }

            if (!settings.personGeneration || !selectedModel.personGeneration.includes(settings.personGeneration as any)) {
                if (selectedModel.personGeneration.includes('allow_adult')) newSettings.personGeneration = 'allow_adult';
                else newSettings.personGeneration = selectedModel.personGeneration[0];
                changed = true;
            }
        }

        if (changed) {
            onSettingsChange(newSettings);
        }
    }, [modelName, selectedModel]); // Run when model changes

    const handleSettingChange = (key: keyof VideoGenerationOptions, value: any) => {
        onSettingsChange({
            ...settings,
            [key]: value
        });
    };

    if (!selectedModel) return null;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Model</Label>
                <Select value={modelName} onValueChange={onModelChange} disabled={disabled}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                        {AVAILABLE_VIDEO_MODELS.map(model => (
                            <SelectItem key={model.modelName} value={model.modelName}>
                                {model.displayName} {model.isPreview ? '(Preview)' : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{selectedModel.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select
                        value={settings.aspectRatio}
                        onValueChange={(v) => handleSettingChange('aspectRatio', v)}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedModel.aspectRatios.map(ratio => (
                                <SelectItem key={ratio} value={ratio}>{ratio}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select
                        value={settings.resolution}
                        onValueChange={(v) => handleSettingChange('resolution', v)}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedModel.resolutions.map(res => (
                                <SelectItem key={res} value={res}>{res}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Duration (Seconds)</Label>
                <Select
                    value={String(settings.durationSeconds)}
                    onValueChange={(v) => handleSettingChange('durationSeconds', Number(v))}
                    disabled={disabled}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Hardcoding common durations based on typical Veo support */}
                        {[4, 6, 8, 5].filter(d => d <= selectedModel.maxDuration).sort((a, b) => a - b).map(d => (
                            <SelectItem key={d} value={String(d)}>{d}s</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Person Generation</Label>
                <Select
                    value={settings.personGeneration}
                    onValueChange={(v) => handleSettingChange('personGeneration', v)}
                    disabled={disabled}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {selectedModel.personGeneration.map(pg => (
                            <SelectItem key={pg} value={pg}>{pg.replace('_', ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Negative Prompt</Label>
                <Input
                    placeholder="What to exclude (e.g. blurry, distorted)"
                    value={settings.negativePrompt || ''}
                    onChange={(e) => handleSettingChange('negativePrompt', e.target.value)}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};
