import React, { useState, useEffect } from 'react';
import { X, Trash2, Play, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateReward } from './neuralAI';

interface TrainingDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTrain: () => void;
    history: any[];
    setHistory: (history: any[]) => void;
}

export const TrainingDataModal: React.FC<TrainingDataModalProps> = ({
    isOpen,
    onClose,
    onTrain,
    history,
    setHistory,
}) => {
    const [selectedGames, setSelectedGames] = useState<number[]>([]);

    // Calculate stats
    const avgScore = history.length > 0
        ? Math.round(history.reduce((sum, g) => sum + g.score, 0) / history.length)
        : 0;

    if (!isOpen) return null;

    const handleDelete = (index: number) => {
        const newHistory = [...history];
        newHistory.splice(index, 1);
        setHistory(newHistory);
        localStorage.setItem('tetris-game-history', JSON.stringify(newHistory));
    };

    const handleDeleteSelected = () => {
        const newHistory = history.filter((_, idx) => !selectedGames.includes(idx));
        setHistory(newHistory);
        localStorage.setItem('tetris-game-history', JSON.stringify(newHistory));
        setSelectedGames([]);
    };

    const toggleSelection = (index: number) => {
        if (selectedGames.includes(index)) {
            setSelectedGames(selectedGames.filter(i => i !== index));
        } else {
            setSelectedGames([...selectedGames, index]);
        }
    };

    const getGradeColor = (score: number) => {
        if (score > avgScore * 1.5) return 'text-purple-400';
        if (score > avgScore) return 'text-green-400';
        if (score < avgScore * 0.5) return 'text-red-400';
        return 'text-gray-400';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-purple-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Database className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Training Data Curator</h2>
                            <p className="text-sm text-gray-400">
                                {history.length} games in buffer • Avg Score: {avgScore.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/10">
                    <div className="flex gap-2">
                        {selectedGames.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteSelected}
                                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Selected ({selectedGames.length})
                            </Button>
                        )}
                        <span className="text-sm text-gray-500 self-center ml-2">
                            Select bad games to remove them from training.
                        </span>
                    </div>
                    <Button
                        onClick={() => {
                            onTrain();
                            onClose();
                        }}
                        className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Train on {history.length} Games
                    </Button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="space-y-2">
                        {history.slice().reverse().map((game, reverseIdx) => {
                            const realIdx = history.length - 1 - reverseIdx;
                            const isSelected = selectedGames.includes(realIdx);
                            const reward = calculateReward(game.score, game.lines, game.level);

                            return (
                                <div
                                    key={game.timestamp}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${isSelected
                                            ? 'bg-red-900/20 border-red-500/50'
                                            : 'bg-black/40 border-white/5 hover:border-white/10'
                                        }`}
                                    onClick={() => toggleSelection(realIdx)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-4 h-4 rounded border ${isSelected ? 'bg-red-500 border-red-500' : 'border-gray-600'}`} />

                                        <div className="w-16 text-xs text-gray-500">
                                            {new Date(game.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </div>

                                        <div className="flex items-baseline gap-4 w-48">
                                            <span className={`font-mono font-bold text-lg ${getGradeColor(game.score)}`}>
                                                {game.score.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-500">score</span>
                                        </div>

                                        <div className="flex gap-6 text-sm text-gray-300">
                                            <span>Lines: <b className="text-white">{game.lines}</b></span>
                                            <span>Lvl: <b className="text-white">{game.level}</b></span>
                                            <span title="Calculated Training Reward (0.0 - 1.0)">
                                                Reward: <b className={reward > 0.5 ? 'text-green-400' : 'text-yellow-400'}>{reward.toFixed(2)}</b>
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-500 hover:text-red-400"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(realIdx);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            );
                        })}

                        {history.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No games in history buffer.</p>
                                <p className="text-sm">Play some games to collect training data!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
