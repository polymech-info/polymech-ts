import React from 'react';

interface GameResult {
    score: number;
    lines: number;
    level: number;
    timestamp: number;
}

interface PerformanceChartProps {
    history: GameResult[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ history }) => {
    if (history.length === 0) {
        return (
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-purple-500/20">
                <h3 className="text-lg font-bold text-cyan-400 mb-3">Performance Trend</h3>
                <p className="text-gray-400 text-sm">No games played yet. Start playing to see improvement!</p>
            </div>
        );
    }

    // Take last 20 games for visualization
    const recentGames = history.slice(-20);

    // Calculate adaptive max with 10% padding so bars don't hit the top
    const dataMaxScore = Math.max(...recentGames.map(g => g.score), 100);
    const maxScore = Math.ceil(dataMaxScore * 1.1);
    const maxLevel = Math.max(...recentGames.map(g => g.level), 5);

    // Calculate statistics
    const avgScore = recentGames.reduce((sum, g) => sum + g.score, 0) / recentGames.length;
    const avgLevel = recentGames.reduce((sum, g) => sum + g.level, 0) / recentGames.length;
    const bestGame = recentGames.reduce((best, game) =>
        game.score > best.score ? game : best
        , recentGames[0]);

    // Calculate trend (simple moving average)
    const trendWindow = 5;
    const trends = recentGames.map((_, idx) => {
        const start = Math.max(0, idx - trendWindow + 1);
        const window = recentGames.slice(start, idx + 1);
        return window.reduce((sum, g) => sum + g.score, 0) / window.length;
    });

    const isImproving = trends.length > 1 && trends[trends.length - 1] > trends[0];

    // Format number for y-axis labels
    const formatYAxis = (value: number): string => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
        return value.toString();
    };

    return (
        <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-purple-500/20">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">Performance Trend</h3>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-black/30 p-3 rounded-lg border border-purple-500/10">
                    <div className="text-xs text-gray-400">Avg Score</div>
                    <div className="text-xl font-bold text-purple-400">{Math.round(avgScore)}</div>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-purple-500/10">
                    <div className="text-xs text-gray-400">Best Score</div>
                    <div className="text-xl font-bold text-green-400">{bestGame.score}</div>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-purple-500/10">
                    <div className="text-xs text-gray-400">Avg Level</div>
                    <div className="text-xl font-bold text-cyan-400">{avgLevel.toFixed(1)}</div>
                </div>
            </div>

            {/* Trend Indicator */}
            <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-gray-400">Trend:</span>
                <span className={`text-sm font-semibold ${isImproving ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isImproving ? '📈 Improving' : '📊 Stable'}
                </span>
            </div>

            {/* Chart */}
            <div className="relative h-48 bg-black/30 rounded-lg p-4 border border-gray-700">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                    <span>{formatYAxis(maxScore)}</span>
                    <span>{formatYAxis(maxScore / 2)}</span>
                    <span>0</span>
                </div>

                {/* Chart area */}
                <div className="ml-12 h-full relative">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                        {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} className="border-t border-gray-800" />
                        ))}
                    </div>

                    {/* SVG Line Chart */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <defs>
                            {/* Gradient for score line */}
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>

                        {/* Calculate SVG path for score line */}
                        {(() => {
                            const width = 100; // percentage
                            const height = 100; // percentage
                            const points = recentGames.map((game, idx) => {
                                // Prevent division by zero when only 1 game
                                const x = (idx / Math.max(1, recentGames.length - 1)) * width;
                                const y = height - (game.score / maxScore) * height;
                                return { x, y, game, idx };
                            });

                            // Create path for score line
                            const scorePath = points.map((p, i) =>
                                `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                            ).join(' ');

                            // Create filled area path
                            const areaPath = `${scorePath} L ${points[points.length - 1].x} ${height} L 0 ${height} Z`;

                            // Create path for trend line
                            const trendPath = points.map((p, i) => {
                                const trendY = height - (trends[i] / maxScore) * height;
                                return `${i === 0 ? 'M' : 'L'} ${p.x} ${trendY}`;
                            }).join(' ');

                            return (
                                <>
                                    {/* Horizontal reference line for best score */}
                                    {(() => {
                                        const bestY = height - (bestGame.score / maxScore) * height;
                                        return (
                                            <line
                                                x1="0"
                                                y1={`${bestY}%`}
                                                x2="100"
                                                y2={`${bestY}%`}
                                                stroke="rgb(34, 197, 94)"
                                                strokeWidth="0.2"
                                                strokeDasharray="4,4"
                                                opacity="0.3"
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        );
                                    })()}

                                    {/* Filled area under score line */}
                                    <path
                                        d={areaPath}
                                        fill="url(#scoreGradient)"
                                        vectorEffect="non-scaling-stroke"
                                    />

                                    {/* Trend line (moving average) */}
                                    <path
                                        d={trendPath}
                                        fill="none"
                                        stroke="rgb(250, 204, 21)"
                                        strokeWidth="0.4"
                                        strokeDasharray="3,2"
                                        opacity="0.7"
                                        vectorEffect="non-scaling-stroke"
                                    />

                                    {/* Score line (actual scores) */}
                                    <path
                                        d={scorePath}
                                        fill="none"
                                        stroke="rgb(139, 92, 246)"
                                        strokeWidth="0.6"
                                        vectorEffect="non-scaling-stroke"
                                    />

                                    {/* Data points */}
                                    {points.map((p) => (
                                        <g key={p.idx}>
                                            {/* Highlight best score with larger, glowing marker */}
                                            {p.game.score === bestGame.score && (
                                                <>
                                                    {/* Glow effect */}
                                                    <circle
                                                        cx={`${p.x}%`}
                                                        cy={`${p.y}%`}
                                                        r="2.5"
                                                        fill="rgb(34, 197, 94)"
                                                        opacity="0.2"
                                                    />
                                                    {/* Main marker */}
                                                    <circle
                                                        cx={`${p.x}%`}
                                                        cy={`${p.y}%`}
                                                        r="1.8"
                                                        fill="rgb(34, 197, 94)"
                                                        stroke="rgb(134, 239, 172)"
                                                        strokeWidth="0.4"
                                                        opacity="0.95"
                                                    />
                                                </>
                                            )}
                                            {/* Regular point (smaller for non-best scores) */}
                                            {p.game.score !== bestGame.score && (
                                                <circle
                                                    cx={`${p.x}%`}
                                                    cy={`${p.y}%`}
                                                    r="0.7"
                                                    fill="rgb(139, 92, 246)"
                                                    stroke="rgb(168, 85, 247)"
                                                    strokeWidth="0.2"
                                                    opacity="0.8"
                                                    className="hover:r-2 transition-all cursor-pointer"
                                                />
                                            )}
                                        </g>
                                    ))}
                                </>
                            );
                        })()}
                    </svg>

                    {/* Interactive hover points (HTML overlay) */}
                    <div className="absolute inset-0">
                        {recentGames.map((game, idx) => {
                            // Use the same calculation as SVG points for perfect alignment
                            const xPercent = (idx / Math.max(1, recentGames.length - 1)) * 100;
                            const yPercent = 100 - (game.score / maxScore) * 100;

                            return (
                                <div
                                    key={idx}
                                    className="absolute group"
                                    style={{
                                        left: `${xPercent}%`,
                                        top: `${yPercent}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                >
                                    {/* Invisible hover target - larger circle for easier hovering */}
                                    <div className="w-6 h-6 -m-3 cursor-pointer" />

                                    {/* Tooltip on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/90 border border-cyan-400/50 rounded px-2 py-1 whitespace-nowrap text-xs pointer-events-none z-10 transition-opacity">
                                        <div className="font-bold text-cyan-400">Game #{history.length - recentGames.length + idx + 1}</div>
                                        <div className="text-gray-300">Score: <span className="text-purple-400 font-bold">{game.score}</span></div>
                                        <div className="text-gray-300">Level: <span className="text-green-400">{game.level}</span></div>
                                        <div className="text-gray-300">Lines: <span className="text-cyan-400">{game.lines}</span></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* X-axis label */}
                <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-500 mt-2">
                    Last {recentGames.length} Games
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-t from-cyan-500 to-purple-500 rounded" />
                    <span className="text-gray-400">Score</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-yellow-400/50" />
                    <span className="text-gray-400">Trend (avg)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-t from-green-500 to-green-400 rounded" />
                    <span className="text-gray-400">Best score</span>
                </div>
            </div>
        </div>
    );
};
