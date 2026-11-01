import React, { useRef, useState, useEffect } from 'react';
import { AIWeights, DEFAULT_WEIGHTS, AdaptiveScaling, AdaptiveScalingMode, DEFAULT_ADAPTIVE_SCALING } from './aiPlayer';
import { HelpCircle, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';
import { setManualOverride, clearManualOverride, hasManualOverride, trainOnManualAdjustment, getNeuralNetwork, extractBoardFeatures } from './neuralAI';

interface AIWeightsPanelProps {
    debugInfo: any;
    aiWeights: AIWeights;
    gameHistory: any[];
    weightChanges: any[];
    gameCounter: number;
    onWeightsChange: (weights: AIWeights) => void;
    onHelpOpen: () => void;
    onResetAI: () => void;
    adaptiveScaling?: AdaptiveScaling;
    onAdaptiveScalingChange?: (scaling: AdaptiveScaling) => void;
}

export const AIWeightsPanel: React.FC<AIWeightsPanelProps> = ({
    debugInfo,
    aiWeights,
    gameHistory,
    weightChanges,
    gameCounter,
    onWeightsChange,
    onHelpOpen,
    onResetAI,
    adaptiveScaling = DEFAULT_ADAPTIVE_SCALING,
    onAdaptiveScalingChange,
}) => {
    const aiMoveRef = useRef<any>(null);
    const lastProcessedPieceRef = useRef<string | null>(null);
    const [isManualOverride, setIsManualOverride] = useState(() => hasManualOverride());
    const [showAdaptiveScaling, setShowAdaptiveScaling] = useState(false);
    const [activeMode, setActiveMode] = useState<'normal' | 'defense' | 'crisis'>('normal');

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('tetris-weights-panel-collapsed') === 'true';
    });

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('tetris-weights-panel-collapsed', String(newState));
    };

    useEffect(() => {
        setIsManualOverride(hasManualOverride());
    }, [aiWeights]);

    const handleWeightChange = (key: keyof AIWeights, value: number) => {
        const newWeights = { ...aiWeights, [key]: value };
        onWeightsChange(newWeights);

        // If manual override is enabled, save to override
        if (isManualOverride) {
            setManualOverride(newWeights);
        } else {
            localStorage.setItem('tetris-ai-weights', JSON.stringify(newWeights));
        }

        aiMoveRef.current = null;
        lastProcessedPieceRef.current = null;
        onResetAI();
    };

    // ... (rest of the functions remain the same) ...
    const toggleManualOverride = () => {
        if (isManualOverride) {
            // Disable override
            clearManualOverride();
            setIsManualOverride(false);
            console.log('[UI] Manual override disabled');
        } else {
            // Enable override with current weights
            setManualOverride(aiWeights);
            setIsManualOverride(true);
            console.log('[UI] Manual override enabled');
        }
        onResetAI();
    };

    const trainOnCurrentWeights = () => {
        if (!debugInfo) return;

        const boardFeatures = extractBoardFeatures(debugInfo);
        const network = getNeuralNetwork();
        trainOnManualAdjustment(network, boardFeatures, aiWeights, 1.0);
        alert('✅ Neural network trained on current weights!');
    };

    const handleExport = () => {
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            aiWeights,
            gameHistory,
            weightChanges,
            gameCounter,
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tetris-ai-data-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importData = JSON.parse(event.target?.result as string);

                    if (importData.aiWeights) {
                        onWeightsChange(importData.aiWeights);
                        localStorage.setItem('tetris-ai-weights', JSON.stringify(importData.aiWeights));
                    }

                    if (importData.gameHistory) {
                        localStorage.setItem('tetris-game-history', JSON.stringify(importData.gameHistory));
                    }

                    if (importData.weightChanges) {
                        localStorage.setItem('tetris-weight-changes', JSON.stringify(importData.weightChanges));
                    }

                    if (importData.gameCounter !== undefined) {
                        localStorage.setItem('tetris-game-counter', importData.gameCounter.toString());
                    }

                    onResetAI();
                    alert('Data imported successfully!');
                } catch (error) {
                    alert('Failed to import data. Please check the file format.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleReset = () => {
        onWeightsChange(DEFAULT_WEIGHTS);
        localStorage.setItem('tetris-ai-weights', JSON.stringify(DEFAULT_WEIGHTS));
        onResetAI();
    };

    const weightFields = [
        { key: 'lineCleared', label: 'Lines Cleared', color: 'text-green-400', sign: '+' },
        { key: 'contact', label: 'Contact', color: 'text-blue-400', sign: '+' },
        { key: 'holesCreated', label: 'Holes Created', color: 'text-red-600', sign: '-' },
        { key: 'overhangsCreated', label: 'Overhangs Created', color: 'text-pink-600', sign: '-' },
        { key: 'overhangsFilled', label: 'Overhangs Filled', color: 'text-emerald-400', sign: '+' },
        { key: 'heightAdded', label: 'Height Added', color: 'text-amber-400', sign: '-' },
        { key: 'wellDepthSquared', label: 'Well Depth²', color: 'text-rose-500', sign: '-' },
        { key: 'bumpiness', label: 'Bumpiness', color: 'text-violet-400', sign: '-' },
        { key: 'avgHeight', label: 'Avg Height', color: 'text-yellow-400', sign: '-' },
        { key: 'rowTransitions', label: 'Row Transitions', color: 'text-cyan-400', sign: '-' },
    ] as const;

    // Calculate distributions
    const rewards = [
        { key: 'lineCleared', value: aiWeights.lineCleared, label: 'Lines', color: '#10b981' },
        { key: 'contact', value: aiWeights.contact, label: 'Contact', color: '#34d399' },
        { key: 'overhangsFilled', value: aiWeights.overhangsFilled, label: 'Fill', color: '#6ee7b7' },
    ];
    const penalties = [
        { key: 'holesCreated', value: aiWeights.holesCreated, label: 'Holes', color: '#ef4444' },
        { key: 'overhangsCreated', value: aiWeights.overhangsCreated, label: 'Overhangs', color: '#f87171' },
        { key: 'heightAdded', value: aiWeights.heightAdded, label: 'Height', color: '#fca5a5' },
        { key: 'wellDepthSquared', value: aiWeights.wellDepthSquared, label: 'Wells', color: '#fb923c' },
        { key: 'bumpiness', value: aiWeights.bumpiness, label: 'Bumpiness', color: '#fdba74' },
        { key: 'avgHeight', value: aiWeights.avgHeight, label: 'Avg Height', color: '#fed7aa' },
        { key: 'rowTransitions', value: aiWeights.rowTransitions, label: 'Row Trans', color: '#fef3c7' },
    ];

    const totalRewards = rewards.reduce((sum, r) => sum + r.value, 0);
    const totalPenalties = penalties.reduce((sum, p) => sum + p.value, 0);

    return (
        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-purple-500/20 transition-all duration-200">
            <div
                className="flex items-center justify-between cursor-pointer mb-3"
                onClick={toggleCollapse}
            >
                <div className="flex items-center gap-2">
                    <h5 className="text-lg font-bold text-cyan-400">Weights</h5>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onHelpOpen();
                        }}
                        className="text-gray-400 hover:text-cyan-400 transition-colors"
                        title="Help"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>
                </div>
                <button className="text-purple-400 hover:text-cyan-400 transition-colors p-1">
                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
            </div>

            {!isCollapsed && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                        <button
                            onClick={handleExport}
                            className="px-2.5 py-1 text-xs font-medium bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 backdrop-blur-sm border border-green-400/40 hover:border-green-400/60 rounded-lg text-green-300 hover:text-green-200 transition-all duration-200 shadow-lg hover:shadow-green-500/20"
                            title="Export weights and history"
                        >
                            Export
                        </button>
                        <button
                            onClick={handleImport}
                            className="px-2.5 py-1 text-xs font-medium bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 backdrop-blur-sm border border-blue-400/40 hover:border-blue-400/60 rounded-lg text-blue-300 hover:text-blue-200 transition-all duration-200 shadow-lg hover:shadow-blue-500/20"
                            title="Import weights and history"
                        >
                            Import
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-2.5 py-1 text-xs font-medium bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 backdrop-blur-sm border border-purple-400/40 hover:border-purple-400/60 rounded-lg text-purple-300 hover:text-purple-200 transition-all duration-200 shadow-lg hover:shadow-purple-500/20"
                            title="Reset to default weights"
                        >
                            Reset
                        </button>
                        <button
                            onClick={toggleManualOverride}
                            className={`px-2.5 py-1 text-xs font-medium backdrop-blur-sm rounded-lg transition-all duration-200 shadow-lg flex items-center gap-1 ${isManualOverride
                                ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-400/40 hover:border-amber-400/60 text-amber-300 hover:text-amber-200 hover:shadow-amber-500/20'
                                : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 border border-gray-400/40 hover:border-gray-400/60 text-gray-300 hover:text-gray-200 hover:shadow-gray-500/20'
                                }`}
                            title={isManualOverride ? 'Disable manual override (use neural network)' : 'Enable manual override (lock current weights)'}
                        >
                            {isManualOverride ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            {isManualOverride ? 'Locked' : 'Auto'}
                        </button>
                        {isManualOverride && (
                            <button
                                onClick={trainOnCurrentWeights}
                                className="px-2.5 py-1 text-xs font-medium bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 backdrop-blur-sm border border-cyan-400/40 hover:border-cyan-400/60 rounded-lg text-cyan-300 hover:text-cyan-200 transition-all duration-200 shadow-lg hover:shadow-cyan-500/20"
                                title="Train neural network to learn these weights"
                            >
                                Train NN
                            </button>
                        )}
                    </div>

                    {/* Weight Distribution Visualization */}
                    <div className="mb-3">
                        <h3 className="text-xs font-semibold text-purple-400 mb-2">Weight Distribution</h3>
                        <div className="space-y-1.5">
                            {/* Rewards Bar */}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-green-400 font-semibold w-20">Rewards</span>
                                    <span className="text-xs text-gray-400">{totalRewards.toFixed(0)}</span>
                                </div>
                                <div className="flex h-6 rounded overflow-hidden bg-gray-800/50">
                                    {rewards.map((r) => {
                                        const percentage = totalRewards > 0 ? (r.value / totalRewards) * 100 : 0;
                                        return percentage > 0 ? (
                                            <div
                                                key={r.key}
                                                className="flex items-center justify-center text-xs font-semibold text-white/90 transition-all duration-300"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: r.color,
                                                }}
                                                title={`${r.label}: ${r.value} (${percentage.toFixed(1)}%)`}
                                            >
                                                {percentage > 15 && r.label}
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>

                            {/* Penalties Bar */}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-red-400 font-semibold w-20">Penalties</span>
                                    <span className="text-xs text-gray-400">{totalPenalties.toFixed(0)}</span>
                                </div>
                                <div className="flex h-6 rounded overflow-hidden bg-gray-800/50">
                                    {penalties.map((p) => {
                                        const percentage = totalPenalties > 0 ? (p.value / totalPenalties) * 100 : 0;
                                        return percentage > 0 ? (
                                            <div
                                                key={p.key}
                                                className="flex items-center justify-center text-xs font-semibold text-white/90 transition-all duration-300"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: p.color,
                                                }}
                                                title={`${p.label}: ${p.value} (${percentage.toFixed(1)}%)`}
                                            >
                                                {percentage > 8 && (percentage > 15 ? p.label : p.label.slice(0, 3))}
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>

                            {/* Overall Balance */}
                            <div className="pt-0.5">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-purple-400 font-semibold w-20">Balance</span>
                                    <span className="text-xs text-gray-400">
                                        {totalRewards > 0 && totalPenalties > 0
                                            ? `${((totalRewards / (totalRewards + totalPenalties)) * 100).toFixed(0)}% / ${((totalPenalties / (totalRewards + totalPenalties)) * 100).toFixed(0)}%`
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex h-4 rounded overflow-hidden bg-gray-800/50">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                                        style={{
                                            width: `${totalRewards > 0 && totalPenalties > 0 ? (totalRewards / (totalRewards + totalPenalties)) * 100 : 50}%`,
                                        }}
                                    />
                                    <div
                                        className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-300"
                                        style={{
                                            width: `${totalRewards > 0 && totalPenalties > 0 ? (totalPenalties / (totalRewards + totalPenalties)) * 100 : 50}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Adaptive Scaling Section */}
                    <div className="mb-3">
                        <button
                            onClick={() => setShowAdaptiveScaling(!showAdaptiveScaling)}
                            className="w-full flex items-center justify-between text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors mb-2"
                        >
                            <span>⚡ Adaptive Scaling</span>
                            {showAdaptiveScaling ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>


                        {showAdaptiveScaling && onAdaptiveScalingChange && (
                            <div className="space-y-2 text-xs bg-purple-500/5 border border-purple-500/20 rounded-lg p-2">
                                {/* Slim Tab Toggles */}
                                <div className="flex gap-1 bg-black/40 rounded p-0.5">
                                    {[
                                        { key: 'normal' as const, label: 'Normal', desc: '0-9', color: 'text-green-400' },
                                        { key: 'defense' as const, label: 'Defense', desc: '9-12', color: 'text-yellow-400' },
                                        { key: 'crisis' as const, label: 'Crisis', desc: '12+', color: 'text-red-400' },
                                    ].map(({ key, label, desc, color }) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveMode(key)}
                                            className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition-all ${activeMode === key
                                                ? `bg-purple-500/30 ${color} border border-purple-400/50`
                                                : 'text-gray-400 hover:text-gray-300'
                                                }`}
                                        >
                                            <div>{label}</div>
                                            <div className="text-[10px] opacity-70">h:{desc}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Mode Description */}
                                <p className="text-gray-400 text-[10px] italic">
                                    {activeMode === 'normal' && '📊 Base strategy - focus on score'}
                                    {activeMode === 'defense' && '⚠️ Moderate caution - balance score & safety'}
                                    {activeMode === 'crisis' && '🚨 Survival mode - avoid death at all costs'}
                                </p>

                                {/* Multiplier Controls */}
                                <div className="space-y-1">
                                    {[
                                        { key: 'lineCleared', label: 'Lines ↓', type: 'decrease' },
                                        { key: 'contact', label: 'Contact ↓', type: 'decrease' },
                                        { key: 'overhangsFilled', label: 'Fill ↓', type: 'decrease' },
                                        { key: 'holesCreated', label: 'Holes ↑', type: 'increase' },
                                        { key: 'overhangsCreated', label: 'Overhangs ↑', type: 'increase' },
                                        { key: 'heightAdded', label: 'Height ↑', type: 'increase' },
                                        { key: 'avgHeight', label: 'Avg Height ↑', type: 'increase' },
                                        { key: 'wellDepthSquared', label: 'Wells ↓', type: 'decrease' },
                                        { key: 'bumpiness', label: 'Bumpiness ↑', type: 'increase' },
                                        { key: 'rowTransitions', label: 'Row Trans ↑', type: 'increase' },
                                    ].map(({ key, label, type }) => {
                                        const currentMode = adaptiveScaling[activeMode];
                                        return (
                                            <div key={key} className="flex justify-between gap-2 items-center">
                                                <span className={`flex-shrink-0 text-xs ${type === 'decrease' ? 'text-blue-400' : 'text-orange-400'}`}>
                                                    {label}:
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={currentMode[key as keyof AdaptiveScalingMode].toFixed(1)}
                                                    onChange={(e) => {
                                                        const newMode = { ...currentMode, [key]: parseFloat(e.target.value) || 0 };
                                                        const newScaling = { ...adaptiveScaling, [activeMode]: newMode };
                                                        onAdaptiveScalingChange(newScaling);
                                                    }}
                                                    className="text-purple-300 text-right bg-black/40 border border-purple-500/30 rounded px-2 py-0.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 w-16 text-xs"
                                                />
                                                <span className="text-gray-500 text-xs w-12">
                                                    {type === 'decrease'
                                                        ? `-${(currentMode[key as keyof AdaptiveScalingMode] * 100).toFixed(0)}%`
                                                        : `+${(currentMode[key as keyof AdaptiveScalingMode] * 100).toFixed(0)}%`
                                                    }
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-300 font-mono">
                        {weightFields.map(({ key, label, color, sign }) => (
                            <div key={key} className="flex justify-between gap-2 items-center">
                                <span className="flex-shrink-0 text-xs">
                                    <span className={sign === '+' ? 'text-green-400' : 'text-red-400'}>{sign}</span>
                                    {' '}{label}:
                                </span>
                                <input
                                    key={`${key}-${aiWeights[key as keyof AIWeights]}`}
                                    type="number"
                                    defaultValue={Math.round(aiWeights[key as keyof AIWeights] ?? 0)}
                                    onBlur={(e) => handleWeightChange(key as keyof AIWeights, parseFloat(e.target.value) || 0)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const value = parseFloat((e.target as HTMLInputElement).value) || 0;
                                            handleWeightChange(key as keyof AIWeights, value);
                                            (e.target as HTMLInputElement).blur();
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            const currentValue = parseFloat((e.target as HTMLInputElement).value) || 0;
                                            const step = key === 'lineCleared' ? 100 : key.includes('Height') ? 5 : 10;
                                            const newValue = Math.round(currentValue + step);
                                            (e.target as HTMLInputElement).value = newValue.toString();
                                            handleWeightChange(key as keyof AIWeights, newValue);
                                        } else if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            const currentValue = parseFloat((e.target as HTMLInputElement).value) || 0;
                                            const step = key === 'lineCleared' ? 100 : key.includes('Height') ? 5 : 10;
                                            const newValue = Math.max(0, Math.round(currentValue - step));
                                            (e.target as HTMLInputElement).value = newValue.toString();
                                            handleWeightChange(key as keyof AIWeights, newValue);
                                        }
                                    }}
                                    className={`${color} text-right bg-black/40 border border-purple-500/30 rounded px-2 py-0.5 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 w-28 text-sm`}
                                />
                            </div>
                        ))}
                        <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between gap-4 font-bold">
                            <span className="flex-shrink-0">Total Score:</span>
                            <span className="text-purple-400 text-right">{debugInfo.totalScore}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
