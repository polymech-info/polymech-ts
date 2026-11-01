import React, { useMemo } from 'react';

interface GameResult {
    score: number;
    lines: number;
    level: number;
    weights: any;
    timestamp: number;
}

interface StatsPanelProps {
    score: number;
    lines: number;
    level: number;
    debugInfo: any;
    gameHistory?: GameResult[];
    gameCounter?: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
    score,
    lines,
    level,
    debugInfo,
    gameHistory = [],
    gameCounter = 0,
}) => {
    const avgHeight = parseFloat(debugInfo?.avgHeight) || 0;
    const heightRatio = avgHeight / 15;
    let mode = 'Normal';
    let modeColor = 'text-green-400';
    let modeIcon = '🎯';

    if (heightRatio > 0.8) {
        mode = 'Crisis';
        modeColor = 'text-red-400';
        modeIcon = '🚨';
    } else if (heightRatio > 0.6) {
        mode = 'Defensive';
        modeColor = 'text-yellow-400';
        modeIcon = '⚠️';
    }

    // Calculate performance trends
    const trends = useMemo(() => {
        if (gameHistory.length < 2) {
            return { scoreChange: 0, linesChange: 0, hasData: false, avgScore: 0, maxScore: 0 };
        }

        // Get last 10 games (excluding current)
        const recentGames = gameHistory.slice(-10);
        const avgScore = recentGames.reduce((sum, g) => sum + g.score, 0) / recentGames.length;
        const avgLines = recentGames.reduce((sum, g) => sum + g.lines, 0) / recentGames.length;

        // Get last 5 games for comparison
        const olderGames = gameHistory.slice(-15, -5);
        const olderAvgScore = olderGames.length > 0
            ? olderGames.reduce((sum, g) => sum + g.score, 0) / olderGames.length
            : avgScore;
        const olderAvgLines = olderGames.length > 0
            ? olderGames.reduce((sum, g) => sum + g.lines, 0) / olderGames.length
            : avgLines;

        const scoreChange = ((avgScore - olderAvgScore) / (olderAvgScore || 1)) * 100;
        const linesChange = ((avgLines - olderAvgLines) / (olderAvgLines || 1)) * 100;

        // Calculate min/max scores
        const allScores = gameHistory.map(g => g.score);
        const minScore = Math.min(...allScores);
        const maxScore = Math.max(...allScores);

        return {
            scoreChange: Math.round(scoreChange),
            linesChange: Math.round(linesChange),
            avgScore: Math.round(avgScore),
            avgLines: Math.round(avgLines),
            minScore,
            maxScore,
            hasData: gameHistory.length >= 5,
        };
    }, [gameHistory]);

    const getTrendIcon = (change: number) => {
        if (change > 5) return '📈';
        if (change < -5) return '📉';
        return '➡️';
    };

    const getTrendColor = (change: number) => {
        if (change > 5) return 'text-green-400';
        if (change < -5) return 'text-red-400';
        return 'text-gray-400';
    };

    return (
        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-purple-500/20 w-full h-full flex flex-col justify-center gap-4">
            <h2 className="text-xl font-bold text-cyan-400 mb-2 md:hidden">Stats</h2>

            {/* Primary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-x-8 gap-y-2 text-gray-200 items-center">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Score</span>
                    <span className="font-bold text-2xl text-purple-400 font-mono">{score.toLocaleString()}</span>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Lines</span>
                    <span className="font-bold text-2xl text-cyan-400 font-mono">{lines}</span>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Level</span>
                    <span className="font-bold text-2xl text-green-400 font-mono">{level}</span>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">AI Mode</span>
                    <span className={`font-bold text-lg ${modeColor} flex items-center gap-2`}>
                        {modeIcon} {mode}
                    </span>
                </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-purple-500/10 pt-3">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Games Played</span>
                    <span className="font-mono text-sm text-gray-300 font-semibold">{gameCounter.toLocaleString()}</span>
                </div>

                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Best Score</span>
                    <span className="font-mono text-sm text-yellow-500 font-semibold">
                        {trends.hasData ? trends.maxScore.toLocaleString() : '-'}
                    </span>
                </div>

                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">L10 Avg</span>
                    <div className="flex items-center gap-2">
                        <span className={`font-mono text-sm font-semibold ${trends.hasData ? getTrendColor(trends.scoreChange) : 'text-gray-500'}`}>
                            {trends.hasData ? trends.avgScore.toLocaleString() : '-'}
                        </span>
                        {trends.hasData && <span className="text-xs">{getTrendIcon(trends.scoreChange)}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};
