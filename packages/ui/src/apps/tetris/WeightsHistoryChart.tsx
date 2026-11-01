import React, { useState, useMemo } from 'react';
import { AIWeights } from './aiPlayer';

interface WeightChange {
    timestamp: number;
    gameNumber: number;
    score: number;
    lines: number;
    oldWeights: AIWeights;
    newWeights: AIWeights;
}

interface WeightsHistoryChartProps {
    changes: WeightChange[];
}

const WEIGHT_COLORS: Record<keyof AIWeights, string> = {
    lineCleared: 'rgb(34, 197, 94)',      // green
    contact: 'rgb(59, 130, 246)',         // blue
    holesCreated: 'rgb(239, 68, 68)',     // red
    overhangsCreated: 'rgb(236, 72, 153)', // pink
    overhangsFilled: 'rgb(16, 185, 129)', // emerald
    heightAdded: 'rgb(251, 146, 60)',     // orange
    wellDepthSquared: 'rgb(168, 85, 247)', // purple
    bumpiness: 'rgb(234, 179, 8)',        // yellow
    avgHeight: 'rgb(249, 115, 22)',       // orange-500
    rowTransitions: 'rgb(14, 165, 233)',  // sky
};

const WEIGHT_LABELS: Record<keyof AIWeights, string> = {
    lineCleared: 'Lines',
    contact: 'Contact',
    holesCreated: 'Holes',
    overhangsCreated: 'Overhangs',
    overhangsFilled: 'Fill',
    heightAdded: 'Height',
    wellDepthSquared: 'Wells',
    bumpiness: 'Bumpy',
    avgHeight: 'Avg H',
    rowTransitions: 'Transitions',
};

export const WeightsHistoryChart: React.FC<WeightsHistoryChartProps> = ({ changes }) => {
    const [activeTab, setActiveTab] = useState<'log' | 'chart'>(() => {
        const stored = localStorage.getItem('tetris-history-tab');
        return (stored === 'chart' ? 'chart' : 'log');
    });

    const [selectedWeights, setSelectedWeights] = useState<Set<keyof AIWeights | 'score'>>(() => {
        const stored = localStorage.getItem('tetris-history-weights');
        if (stored) {
            try {
                return new Set(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse stored weights", e);
            }
        }
        return new Set(['lineCleared', 'holesCreated', 'heightAdded', 'wellDepthSquared', 'score']);
    });
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Prepare data for chart - MUST be before any early returns to satisfy Rules of Hooks
    const recentChanges = useMemo(() => changes.slice(-20), [changes]);
    const weightKeys = Object.keys(WEIGHT_COLORS) as (keyof AIWeights)[];
    const allKeys = ['score', ...weightKeys] as const;

    const handleTabChange = (tab: 'log' | 'chart') => {
        setActiveTab(tab);
        localStorage.setItem('tetris-history-tab', tab);
    };

    if (changes.length === 0) {
        return (
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-purple-500/20">
                <h3 className="text-lg font-bold text-cyan-400 mb-3">Learning History</h3>
                <p className="text-gray-400 text-sm">No weight changes yet. Play some games in Neural mode!</p>
            </div>
        );
    }

    const toggleWeight = (weight: keyof AIWeights | 'score') => {
        const newSet = new Set(selectedWeights);
        if (newSet.has(weight)) {
            newSet.delete(weight);
        } else {
            newSet.add(weight);
        }
        setSelectedWeights(newSet);
        localStorage.setItem('tetris-history-weights', JSON.stringify(Array.from(newSet)));
    };

    const calculateWeightDelta = (oldVal: number | undefined, newVal: number | undefined): { delta: number; percent: number } | null => {
        if (oldVal === undefined || newVal === undefined) return null;
        const delta = newVal - oldVal;
        const percent = oldVal !== 0 ? (delta / oldVal) * 100 : 0;
        return { delta, percent };
    };

    const getSignificantChanges = (change: WeightChange) => {
        const keys = Object.keys(change.newWeights) as (keyof AIWeights)[];
        const significant = keys
            .map(key => {
                const result = calculateWeightDelta(change.oldWeights[key], change.newWeights[key]);
                if (!result) return null;
                const newValue = change.newWeights[key];
                if (newValue === undefined || newValue === null) return null;
                return { key, delta: result.delta, percent: result.percent, newValue };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent))
            .slice(0, 3);

        return significant;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (recentChanges.length === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        // Find closest index
        const index = Math.round((x / width) * (recentChanges.length - 1));
        const clampedIndex = Math.max(0, Math.min(recentChanges.length - 1, index));
        setHoveredIndex(clampedIndex);
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
    };

    return (
        <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-cyan-400">Learning History</h3>

                {/* Tab Toggles */}
                <div className="flex gap-1 bg-black/40 rounded p-1">
                    <button
                        onClick={() => handleTabChange('log')}
                        className={`px-3 py-1 rounded text-sm font-semibold transition-all ${activeTab === 'log'
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        📋 Log
                    </button>
                    <button
                        onClick={() => handleTabChange('chart')}
                        className={`px-3 py-1 rounded text-sm font-semibold transition-all ${activeTab === 'chart'
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        📊 Chart
                    </button>
                </div>
            </div>

            {/* Log View */}
            {activeTab === 'log' && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {changes.slice().reverse().map((change, idx) => {
                        const significantChanges = getSignificantChanges(change);
                        const timeAgo = new Date(change.timestamp).toLocaleTimeString();

                        return (
                            <div
                                key={idx}
                                className="bg-black/30 p-4 rounded-lg border border-purple-500/10 hover:border-purple-500/30 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-purple-400 font-bold">Game #{change.gameNumber}</span>
                                        <span className="text-gray-500 text-xs">{timeAgo}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Score: <span className="text-cyan-400 font-semibold">{change.score}</span> |
                                        Lines: <span className="text-green-400 font-semibold">{change.lines}</span>
                                    </div>
                                </div>

                                {significantChanges.length > 0 ? (
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 mb-1">Top weight changes:</p>
                                        {significantChanges.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-gray-300">{item.key}:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">{(item.newValue ?? 0).toFixed(0)}</span>
                                                    <span className={`font-semibold ${item.percent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {item.percent > 0 ? '+' : ''}{item.percent.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">No significant changes</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Chart View */}
            {activeTab === 'chart' && (
                <div className="space-y-4">
                    {/* Weight Selection */}
                    <div className="bg-black/30 p-3 rounded-lg border border-purple-500/10">
                        <p className="text-xs text-gray-400 mb-2">
                            Select metrics to display (Trends normalized to chart height):
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {allKeys.map(key => {
                                const label = key === 'score' ? 'Score' : WEIGHT_LABELS[key as keyof AIWeights];
                                const color = key === 'score' ? '#ffffff' : WEIGHT_COLORS[key as keyof AIWeights];

                                return (
                                    <button
                                        key={key}
                                        onClick={() => toggleWeight(key)}
                                        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${selectedWeights.has(key)
                                            ? 'border-2 opacity-100'
                                            : 'border border-gray-600 opacity-50 hover:opacity-70'
                                            }`}
                                        style={{
                                            borderColor: selectedWeights.has(key) ? color : undefined,
                                            color: color,
                                        }}
                                    >
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Chart */}
                    <div
                        className="relative h-64 bg-black/30 rounded-lg p-4 border border-gray-700 cursor-crosshair"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Chart area */}
                        <div className="w-full h-full relative">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div key={i} className="border-t border-gray-800" />
                                ))}
                            </div>

                            {/* SVG Multi-line Chart */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {Array.from(selectedWeights).map(weightKey => {
                                    const color = weightKey === 'score' ? '#ffffff' : WEIGHT_COLORS[weightKey as keyof AIWeights];

                                    // Calculate range for THIS metric
                                    const values = recentChanges.map(c =>
                                        weightKey === 'score' ? c.score : (c.newWeights[weightKey as keyof AIWeights] || 0)
                                    );
                                    let min = Math.min(...values);
                                    let max = Math.max(...values);

                                    // Handle flat lines (min === max) by centering them or adding small range
                                    if (min === max) {
                                        min = min - 10;
                                        max = max + 10;
                                    } else {
                                        // Add 5% padding
                                        const range = max - min;
                                        min -= range * 0.05;
                                        max += range * 0.05;
                                    }
                                    const range = max - min;

                                    const points = recentChanges.map((change, idx) => {
                                        const x = (idx / Math.max(1, recentChanges.length - 1)) * 100;
                                        const value = weightKey === 'score'
                                            ? change.score
                                            : (change.newWeights[weightKey as keyof AIWeights] || 0);

                                        // Inverse Y (100% is bottom, 0% is top is standard SVG coords logic, but usually 0,0 is top-left)
                                        // Here: value - min / range gives 0..1.
                                        // We want MAX at TOP (y=0%) and MIN at BOTTOM (y=100%).
                                        const y = 100 - ((value - min) / range) * 100;
                                        return { x, y, value, idx };
                                    });

                                    const path = points.map((p, i) =>
                                        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                                    ).join(' ');

                                    const isActive = hoveredIndex !== null && points[hoveredIndex];

                                    return (
                                        <g key={weightKey}>
                                            {/* Line */}
                                            <path
                                                d={path}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth={weightKey === 'score' ? "2" : "1.5"}
                                                strokeDasharray={weightKey === 'score' ? "4 2" : "none"}
                                                vectorEffect="non-scaling-stroke"
                                                opacity={weightKey === 'score' ? "0.9" : "0.7"}
                                            />
                                            {/* Data Points (only show on hover or endpoints if needed, but clean is better) */}
                                            {/* Hover Highlight Point */}
                                            {hoveredIndex !== null && points[hoveredIndex] && (
                                                <circle
                                                    cx={`${points[hoveredIndex].x}%`}
                                                    cy={`${points[hoveredIndex].y}%`}
                                                    r="3"
                                                    fill={color}
                                                    stroke="#000"
                                                    strokeWidth="1"
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Hover Vertical Line */}
                            {hoveredIndex !== null && (
                                <div
                                    className="absolute top-0 bottom-0 w-px bg-white/20 pointer-events-none transition-all duration-75"
                                    style={{
                                        left: `${(hoveredIndex / Math.max(1, recentChanges.length - 1)) * 100}%`
                                    }}
                                />
                            )}
                        </div>

                        {/* X-axis label */}
                        <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-500 mt-2 pointer-events-none">
                            Last {recentChanges.length} Games
                        </div>

                        {/* Hover Tooltip */}
                        {hoveredIndex !== null && recentChanges[hoveredIndex] && (
                            <div
                                className="absolute z-10 bg-black/90 border border-purple-500/30 p-3 rounded-lg shadow-xl text-xs pointer-events-none backdrop-blur-md"
                                style={{
                                    top: '10px',
                                    left: hoveredIndex < recentChanges.length / 2
                                        ? `${(hoveredIndex / Math.max(1, recentChanges.length - 1)) * 100 + 5}%`
                                        : 'auto',
                                    right: hoveredIndex >= recentChanges.length / 2
                                        ? `${100 - (hoveredIndex / Math.max(1, recentChanges.length - 1)) * 100 + 5}%`
                                        : 'auto',
                                }}
                            >
                                <div className="font-bold text-gray-300 mb-2 border-b border-gray-700 pb-1">
                                    Game #{recentChanges[hoveredIndex].gameNumber}
                                </div>
                                <div className="space-y-1">
                                    {Array.from(selectedWeights).map(key => {
                                        const color = key === 'score' ? '#ffffff' : WEIGHT_COLORS[key as keyof AIWeights];
                                        const label = key === 'score' ? 'Score' : WEIGHT_LABELS[key as keyof AIWeights];
                                        const value = key === 'score'
                                            ? recentChanges[hoveredIndex!].score
                                            : recentChanges[hoveredIndex!].newWeights[key as keyof AIWeights];

                                        return (
                                            <div key={key} className="flex items-center gap-2 whitespace-nowrap">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                                <span className="text-gray-400">{label}:</span>
                                                <span className="font-mono font-bold" style={{ color }}>
                                                    {value?.toFixed(0)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="text-xs text-gray-400">
                        <span className="font-semibold text-purple-400">{changes.length}</span> total updates
                    </div>
                </div>
            )}
        </div>
    );
};
