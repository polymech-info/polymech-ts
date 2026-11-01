import React, { useState, useEffect, useRef } from 'react';
import { AIWeights, DEFAULT_WEIGHTS } from './aiPlayer';
import { Button } from '@/components/ui/button';
import { X, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'tetris-ai-weights';

interface WeightsTunerProps {
    isOpen: boolean;
    onClose: () => void;
    onWeightsChange: (weights: AIWeights) => void;
}

export const WeightsTuner: React.FC<WeightsTunerProps> = ({ isOpen, onClose, onWeightsChange }) => {
    const [weights, setWeights] = useState<AIWeights>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_WEIGHTS;
    });

    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Focus first input when opened
            const firstInput = popupRef.current?.querySelector('input');
            firstInput?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const updateWeight = (key: keyof AIWeights, value: number) => {
        const newWeights = { ...weights, [key]: value };
        setWeights(newWeights);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newWeights));
        onWeightsChange(newWeights);
    };

    const resetToDefaults = () => {
        setWeights(DEFAULT_WEIGHTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WEIGHTS));
        onWeightsChange(DEFAULT_WEIGHTS);
    };

    if (!isOpen) return null;

    const weightFields: { key: keyof AIWeights; label: string; step: number }[] = [
        { key: 'lineCleared', label: 'Lines Cleared', step: 100 },
        { key: 'contact', label: 'Contact', step: 10 },
        { key: 'holesCreated', label: 'Holes Created (penalty)', step: 10 },
        { key: 'overhangsCreated', label: 'Overhangs Created (penalty)', step: 10 },
        { key: 'overhangsFilled', label: 'Overhangs Filled (bonus)', step: 10 },
        { key: 'heightAdded', label: 'Height Added (penalty)', step: 10 },
        { key: 'wellDepthSquared', label: 'Well Depth² (penalty)', step: 10 },
        { key: 'bumpiness', label: 'Bumpiness (penalty)', step: 5 },
        { key: 'avgHeight', label: 'Avg Height (penalty)', step: 5 },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div
                ref={popupRef}
                className="bg-black/95 backdrop-blur-md border-2 border-purple-500/50 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto pointer-events-auto"
                style={{
                    boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={resetToDefaults}
                            variant="outline"
                            size="icon"
                            className="border-purple-500/50 hover:bg-purple-500/20 h-9 w-9"
                            title="Reset to defaults"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            size="icon"
                            className="border-purple-500/50 hover:bg-purple-500/20 h-9 w-9"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <p className="text-sm text-gray-300">
                        <kbd className="px-2 py-1 bg-gray-800 rounded text-xs mr-2">↑↓</kbd>
                        Adjust values
                        <kbd className="px-2 py-1 bg-gray-800 rounded text-xs mx-2">Tab</kbd>
                        Navigate fields
                        <kbd className="px-2 py-1 bg-gray-800 rounded text-xs mx-2">Esc</kbd>
                        Close
                    </p>
                </div>

                {/* Visual Charts */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                    {/* Rewards Chart */}
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-green-400 mb-3">Rewards</h3>
                        <svg viewBox="0 0 200 120" className="w-full h-24">
                            {/* Grid lines */}
                            <line x1="0" y1="100" x2="200" y2="100" stroke="#ffffff10" strokeWidth="1" />
                            <line x1="0" y1="50" x2="200" y2="50" stroke="#ffffff10" strokeWidth="1" />

                            {/* Line Cleared - tallest */}
                            <path
                                d={`M 20 ${100 - (weights.lineCleared / 200)} Q 30 ${100 - (weights.lineCleared / 200)} 40 100`}
                                fill="url(#greenGradient1)"
                                stroke="#10b981"
                                strokeWidth="2"
                            />
                            <text x="30" y="115" fontSize="10" fill="#10b981" textAnchor="middle">Lines</text>

                            {/* Contact */}
                            <path
                                d={`M 60 ${100 - (weights.contact / 10)} Q 70 ${100 - (weights.contact / 10)} 80 100`}
                                fill="url(#greenGradient2)"
                                stroke="#34d399"
                                strokeWidth="2"
                            />
                            <text x="70" y="115" fontSize="10" fill="#34d399" textAnchor="middle">Contact</text>

                            {/* Overhangs Filled */}
                            <path
                                d={`M 100 ${100 - (weights.overhangsFilled / 20)} Q 110 ${100 - (weights.overhangsFilled / 20)} 120 100`}
                                fill="url(#greenGradient3)"
                                stroke="#6ee7b7"
                                strokeWidth="2"
                            />
                            <text x="110" y="115" fontSize="10" fill="#6ee7b7" textAnchor="middle">Fill</text>

                            {/* Gradients */}
                            <defs>
                                <linearGradient id="greenGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                                </linearGradient>
                                <linearGradient id="greenGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.1" />
                                </linearGradient>
                                <linearGradient id="greenGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.1" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* Penalties Chart */}
                    <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-red-400 mb-3">Penalties</h3>
                        <svg viewBox="0 0 200 120" className="w-full h-24">
                            {/* Grid lines */}
                            <line x1="0" y1="100" x2="200" y2="100" stroke="#ffffff10" strokeWidth="1" />
                            <line x1="0" y1="50" x2="200" y2="50" stroke="#ffffff10" strokeWidth="1" />

                            {/* Holes Created */}
                            <path
                                d={`M 15 ${100 - (weights.holesCreated / 40)} Q 22 ${100 - (weights.holesCreated / 40)} 29 100`}
                                fill="url(#redGradient1)"
                                stroke="#ef4444"
                                strokeWidth="2"
                            />
                            <text x="22" y="115" fontSize="9" fill="#ef4444" textAnchor="middle">Holes</text>

                            {/* Overhangs Created */}
                            <path
                                d={`M 35 ${100 - (weights.overhangsCreated / 50)} Q 42 ${100 - (weights.overhangsCreated / 50)} 49 100`}
                                fill="url(#redGradient2)"
                                stroke="#f87171"
                                strokeWidth="2"
                            />
                            <text x="42" y="115" fontSize="9" fill="#f87171" textAnchor="middle">Over</text>

                            {/* Height Added */}
                            <path
                                d={`M 55 ${100 - (weights.heightAdded / 40)} Q 62 ${100 - (weights.heightAdded / 40)} 69 100`}
                                fill="url(#redGradient3)"
                                stroke="#fca5a5"
                                strokeWidth="2"
                            />
                            <text x="62" y="115" fontSize="9" fill="#fca5a5" textAnchor="middle">Height</text>

                            {/* Well Depth */}
                            <path
                                d={`M 75 ${100 - (weights.wellDepthSquared / 10)} Q 82 ${100 - (weights.wellDepthSquared / 10)} 89 100`}
                                fill="url(#redGradient4)"
                                stroke="#fb923c"
                                strokeWidth="2"
                            />
                            <text x="82" y="115" fontSize="9" fill="#fb923c" textAnchor="middle">Well</text>

                            {/* Bumpiness */}
                            <path
                                d={`M 95 ${100 - (weights.bumpiness / 2)} Q 102 ${100 - (weights.bumpiness / 2)} 109 100`}
                                fill="url(#redGradient5)"
                                stroke="#fdba74"
                                strokeWidth="2"
                            />
                            <text x="102" y="115" fontSize="9" fill="#fdba74" textAnchor="middle">Bump</text>

                            {/* Avg Height */}
                            <path
                                d={`M 115 ${100 - (weights.avgHeight / 2)} Q 122 ${100 - (weights.avgHeight / 2)} 129 100`}
                                fill="url(#redGradient6)"
                                stroke="#fed7aa"
                                strokeWidth="2"
                            />
                            <text x="122" y="115" fontSize="9" fill="#fed7aa" textAnchor="middle">Avg</text>

                            {/* Row Transitions */}
                            <path
                                d={`M 135 ${100 - (weights.rowTransitions / 2)} Q 142 ${100 - (weights.rowTransitions / 2)} 149 100`}
                                fill="url(#redGradient7)"
                                stroke="#fef3c7"
                                strokeWidth="2"
                            />
                            <text x="142" y="115" fontSize="9" fill="#fef3c7" textAnchor="middle">Row</text>

                            {/* Gradients */}
                            <defs>
                                <linearGradient id="redGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                                </linearGradient>
                                <linearGradient id="redGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#f87171" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#f87171" stopOpacity="0.1" />
                                </linearGradient>
                                <linearGradient id="redGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#fca5a5" stopOpacity="0.1" />
                                </linearGradient>
                                <linearGradient id="redGradient4" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#fb923c" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#fb923c" stopOpacity="0.1" />
                                </linearGradient>
                                <linearGradient id="redGradient5" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#fdba74" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#fdba74" stopOpacity="0.1" />
                                </linearGradient>
                                <linearGradient id="redGradient6" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.1" />
                                </linearGradient>
                                <linearGradient id="redGradient7" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.1" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* Weight Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weightFields.map(({ key, label, step }) => (
                        <div key={key} className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">
                                {label}
                            </label>
                            <input
                                type="number"
                                value={weights[key]}
                                onChange={(e) => updateWeight(key, parseFloat(e.target.value) || 0)}
                                step={step}
                                className="bg-gray-900/50 border border-purple-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        updateWeight(key, weights[key] + step);
                                    } else if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        updateWeight(key, weights[key] - step);
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-purple-500/20">
                    <p className="text-xs text-gray-400 text-center">
                        Weights are automatically saved to localStorage
                    </p>
                </div>
            </div>
        </div>
    );
};

// Hook to load weights from localStorage
export const useAIWeights = (): AIWeights => {
    const [weights, setWeights] = useState<AIWeights>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_WEIGHTS;
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setWeights(JSON.parse(stored));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return weights;
};
