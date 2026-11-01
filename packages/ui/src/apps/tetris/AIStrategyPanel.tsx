import React, { useState, useEffect } from 'react';
import { StrategyManager, AIStrategy } from './aiStrategies';
import { Switch } from '@/components/ui/switch';
import { Brain, Save, ShieldAlert, FileText } from 'lucide-react';

export const AIStrategyPanel: React.FC = () => {
    const [strategies, setStrategies] = useState<AIStrategy[]>([]);
    const manager = StrategyManager.getInstance();

    useEffect(() => {
        setStrategies(manager.getStrategies());
    }, []);

    const toggleStrategy = (id: string, enabled: boolean) => {
        manager.toggleStrategy(id, enabled);
        // Force update local state to reflect change immediately
        setStrategies(manager.getStrategies().map(s =>
            s.id === id ? { ...s, isEnabled: enabled } : s
        ));
    };

    const toggleLogs = (id: string, enabled: boolean) => {
        manager.toggleLogs(id, enabled);
        setStrategies(manager.getStrategies().map(s =>
            s.id === id ? { ...s, logsEnabled: enabled } : s
        ));
    };

    const getIcon = (id: string) => {
        switch (id) {
            case 'hall-of-fame': return <Save className="w-4 h-4 text-yellow-400" />;
            case 'auto-revert': return <ShieldAlert className="w-4 h-4 text-green-400" />;
            default: return <Brain className="w-4 h-4 text-purple-400" />;
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Active Learning Strategies
            </h3>

            <div className="grid grid-cols-1 gap-2">
                {strategies.map((strategy) => (
                    <div
                        key={strategy.id}
                        className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${strategy.isEnabled
                            ? 'bg-purple-500/10 border-purple-500/40'
                            : 'bg-gray-900/40 border-gray-800'
                            }`}
                    >
                        <div className="mt-1">
                            {getIcon(strategy.id)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-medium ${strategy.isEnabled ? 'text-white' : 'text-gray-400'}`}>
                                    {strategy.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleLogs(strategy.id, !strategy.logsEnabled)}
                                        className={`p-1.5 rounded-md transition-colors ${strategy.logsEnabled
                                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                            : 'bg-gray-800 text-gray-500 hover:text-gray-400'
                                            }`}
                                        title={strategy.logsEnabled ? "Disable Logs" : "Enable Logs"}
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                    </button>
                                    <Switch
                                        checked={strategy.isEnabled}
                                        onCheckedChange={(checked) => toggleStrategy(strategy.id, checked)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                {strategy.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 rounded-lg border bg-gray-900/40 border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Training Sample Size</span>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                        defaultValue={localStorage.getItem('tetris-training-sample-size') || '3'}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val > 0) {
                                localStorage.setItem('tetris-training-sample-size', val.toString());
                            }
                        }}
                    />
                </div>
                <p className="text-xs text-gray-500">
                    AI will train only after every N games to build a batch. Default: 3.
                </p>
            </div>
        </div>
    );
};
