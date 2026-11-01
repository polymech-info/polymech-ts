import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ControlsPanelProps {
    gameStarted: boolean;
    gameOver: boolean;
    isAutoPlay: boolean;
    isMaxSpeed: boolean;
    aiMode: 'standard' | 'neural';
    startLevel: number;
    onAutoPlayChange: (checked: boolean) => void;
    onMaxSpeedChange: (checked: boolean) => void;
    onAiModeChange: (mode: 'standard' | 'neural') => void;
    onStartLevelChange: (level: number) => void;
    onNewGame: () => void;
    randomizerMode: 'tgm3' | 'classic';
    onRandomizerModeChange: (mode: 'tgm3' | 'classic') => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
    gameStarted,
    gameOver,
    isAutoPlay,
    isMaxSpeed,
    aiMode,
    startLevel,
    onAutoPlayChange,
    onMaxSpeedChange,
    onAiModeChange,
    onStartLevelChange,
    onNewGame,
    randomizerMode,
    onRandomizerModeChange,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('tetris-controls-collapsed') === 'true';
    });

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('tetris-controls-collapsed', String(newState));
    };

    const [localStartLevel, setLocalStartLevel] = useState(startLevel.toString());

    useEffect(() => {
        setLocalStartLevel(startLevel.toString());
    }, [startLevel]);

    const handleLevelSubmit = () => {
        const val = parseInt(localStartLevel);
        if (!isNaN(val)) {
            onStartLevelChange(Math.max(0, val));
        } else {
            setLocalStartLevel(startLevel.toString());
        }
    };

    return (
        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-purple-500/20 transition-all duration-200">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={toggleCollapse}
            >
                <h2 className="text-xl font-bold text-cyan-400">Controls</h2>
                <div className="flex items-center gap-4">
                    <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Switch
                            id="max-speed-header"
                            checked={isMaxSpeed}
                            onCheckedChange={onMaxSpeedChange}
                        />
                        <Label htmlFor="max-speed-header" className="text-sm text-yellow-400 font-bold cursor-pointer mr-2">
                            ⚡ Max
                        </Label>

                        <Switch
                            id="autoplay-header"
                            checked={isAutoPlay}
                            onCheckedChange={onAutoPlayChange}
                            disabled={!gameStarted || gameOver}
                        />
                        <Label htmlFor="autoplay-header" className="text-sm text-gray-300 cursor-pointer">
                            Auto Play
                        </Label>
                    </div>
                    <button className="text-purple-400 hover:text-cyan-400 transition-colors p-1">
                        {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="space-y-4 mt-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="pt-3 border-t border-gray-700">
                        <p className="font-semibold mb-2 text-gray-200">RNG Mode:</p>
                        <div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-700">
                            <button
                                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${randomizerMode === 'tgm3'
                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    }`}
                                onClick={() => onRandomizerModeChange('tgm3')}
                            >
                                Balanced (TGM3)
                            </button>
                            <button
                                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${randomizerMode === 'classic'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    }`}
                                onClick={() => onRandomizerModeChange('classic')}
                            >
                                Classic (History 3)
                            </button>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-gray-700">
                        <p className="font-semibold mb-2 text-gray-200">AI Mode:</p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => onAiModeChange('standard')}
                                variant={activeStyle(aiMode === 'standard')}
                                size="sm"
                                className={activeClass(aiMode === 'standard', 'purple')}
                            >
                                Standard
                            </Button>
                            <Button
                                onClick={() => onAiModeChange('neural')}
                                variant={activeStyle(aiMode === 'neural')}
                                size="sm"
                                className={activeClass(aiMode === 'neural', 'cyan')}
                            >
                                Neural Net
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            {aiMode === 'neural' ? '🧠 Learning from past games' : '⚙️ Using manual weights'}
                        </p>
                    </div>

                    <div className="pt-3 border-t border-gray-700">
                        <p className="font-semibold mb-2 text-gray-200">Start Level:</p>
                        <div className="flex items-center gap-3 mb-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={startLevel}
                                onChange={(e) => onStartLevelChange(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <input
                                type="number"
                                min="0"
                                max="10000"
                                value={localStartLevel}
                                onChange={(e) => setLocalStartLevel(e.target.value)}
                                onBlur={handleLevelSubmit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleLevelSubmit();
                                        (e.target as HTMLInputElement).blur();
                                    }
                                }}
                                className="w-12 bg-gray-800 text-center font-bold text-purple-400 border border-gray-600 rounded text-sm focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            {[20, 50, 100].map((lvl, idx) => (
                                <Button
                                    key={lvl}
                                    onClick={() => onStartLevelChange(lvl)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs border-gray-600 hover:bg-gray-700"
                                >
                                    {['Slow', 'Med', 'Fast'][idx]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-gray-700">
                        <p className="font-semibold mb-2 text-gray-200">Keyboard:</p>
                        <ul className="space-y-1 text-xs text-gray-300">
                            <li>← → Move (stops auto)</li>
                            <li>↑ ↓ Rotate (stops auto)</li>
                            <li>Space: Hard Drop (stops auto)</li>
                            <li>P: Pause</li>
                        </ul>
                    </div>

                    {gameStarted && (
                        <Button
                            onClick={onNewGame}
                            variant="outline"
                            className="border-purple-500/50 hover:bg-purple-500/20 mt-4 w-full"
                        >
                            New Game
                        </Button>
                    )}

                    <Button
                        onClick={() => {
                            if (confirm('⚠️ This will clear ALL saved data:\n\n• AI weights\n• Neural network\n• Game history\n• Weight changes\n• Start level\n\nAre you sure?')) {
                                // Clear all Tetris-related localStorage
                                localStorage.removeItem('tetris-ai-weights');
                                localStorage.removeItem('tetris-neural-network');
                                localStorage.removeItem('tetris-neural-network-version');
                                localStorage.removeItem('tetris-game-history');
                                localStorage.removeItem('tetris-weight-changes');
                                localStorage.removeItem('tetris-game-counter');
                                localStorage.removeItem('tetris-start-level');
                                localStorage.removeItem('tetris-hall-of-fame');
                                localStorage.removeItem('tetris-neural-network-best');
                                localStorage.removeItem('tetris-best-performance');
                                localStorage.removeItem('tetris-ai-strategies-config');

                                // Reload page to reinitialize
                                window.location.reload();
                            }
                        }}
                        variant="outline"
                        className="border-red-500/50 hover:bg-red-500/20 text-red-400 hover:text-red-300 mt-2 w-full"
                    >
                        🗑️ Reset All Data
                    </Button>
                </div>
            )}
        </div>
    );
};

// Helper for button styles to keep JSX clean
const activeStyle = (isActive: boolean) => isActive ? 'default' : 'outline';
const activeClass = (isActive: boolean, color: 'purple' | 'cyan') => {
    if (color === 'purple') {
        return isActive ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-500/50 hover:bg-purple-500/20';
    }
    return isActive ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-500/50 hover:bg-cyan-500/20';
};
