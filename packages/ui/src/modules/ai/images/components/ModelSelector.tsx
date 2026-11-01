import React from 'react';
import { T } from '@/i18n';

import { AVAILABLE_MODELS, getModelString } from '@/lib/image-router';

interface ModelSelectorProps {
    selectedModel: string;
    onChange: (model: string) => void;
    label?: string;
    showStepNumber?: boolean;
}

/**
 * Model Selector Component
 * 
 * Displays a dropdown to select AI image generation models,
 * grouped by provider (Google, Replicate, Bria, AIML API).
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModel,
    onChange,
    label = 'AI Model',
    showStepNumber = true,
}) => {
    return (
        <div>
            <label className="text-sm md:text-base font-medium mb-2 block">
                {showStepNumber && <span className="text-xs text-muted-foreground mr-2">1.</span>}
                <T>{label}</T>
            </label>

            <select
                value={selectedModel}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 md:py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
                {/* Google Gemini Models */}
                <optgroup label="Google Gemini">
                    {AVAILABLE_MODELS.filter(m => m.provider === 'google').map((model) => (
                        <option
                            key={getModelString(model.provider, model.modelName)}
                            value={getModelString(model.provider, model.modelName)}
                        >
                            {model.displayName.replace('Google ', '')}
                        </option>
                    ))}
                </optgroup>

                {/* Replicate Models */}
                <optgroup label="Replicate">
                    {AVAILABLE_MODELS.filter(m => m.provider === 'replicate').map((model) => (
                        <option
                            key={getModelString(model.provider, model.modelName)}
                            value={getModelString(model.provider, model.modelName)}
                        >
                            {model.displayName.replace('Replicate ', '')}
                        </option>
                    ))}
                </optgroup>

                {/* Bria.ai Models (Commercial Safe) */}
                <optgroup label="Bria.ai (Commercial Safe)">
                    {AVAILABLE_MODELS.filter(m => m.provider === 'bria').map((model) => (
                        <option
                            key={getModelString(model.provider, model.modelName)}
                            value={getModelString(model.provider, model.modelName)}
                        >
                            {model.displayName.replace('Bria.ai ', '')}
                        </option>
                    ))}
                </optgroup>

                {/* AIML API Models (Multi-Model Gateway) */}
                <optgroup label="AIML API (Multi-Model Gateway)">
                    {AVAILABLE_MODELS.filter(m => m.provider === 'aimlapi').map((model) => (
                        <option
                            key={getModelString(model.provider, model.modelName)}
                            value={getModelString(model.provider, model.modelName)}
                        >
                            {model.displayName.replace('AIML API - ', '')}
                        </option>
                    ))}
                </optgroup>
            </select>

            <p className="text-xs text-muted-foreground mt-1">
                <T>Select the AI model for image generation</T>
            </p>
        </div>
    );
};

export default ModelSelector;
