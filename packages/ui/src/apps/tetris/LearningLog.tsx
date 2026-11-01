import React from 'react';
import { AIWeights } from './aiPlayer';

interface WeightChange {
    timestamp: number;
    gameNumber: number;
    score: number;
    lines: number;
    oldWeights: AIWeights;
    newWeights: AIWeights;
}

interface LearningLogProps {
    changes: WeightChange[];
}

export const LearningLog: React.FC<LearningLogProps> = ({ changes }) => {
    if (changes.length === 0) {
        return (
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-purple-500/20">
                <h3 className="text-lg font-bold text-cyan-400 mb-3">Learning Log</h3>
                <p className="text-gray-400 text-sm">No weight changes yet. Play some games in Neural mode!</p>
            </div>
        );
    }

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
                if (newValue === undefined || newValue === null) return null; // Skip if new value is missing
                return { key, delta: result.delta, percent: result.percent, newValue };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null) // Filter out null values
            .sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent))
            .slice(0, 3); // Top 3 changes

        return significant;
    };

    return (
        <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-purple-500/20">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">Learning Log</h3>
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
        </div>
    );
};
