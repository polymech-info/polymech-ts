import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { AIStrategyPanel } from './AIStrategyPanel';

export const AIStrategyControl: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('tetris-strategies-collapsed') === 'true';
    });

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('tetris-strategies-collapsed', String(newState));
    };

    return (
        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-purple-500/20 transition-all duration-200 mt-4">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={toggleCollapse}
            >
                <h2 className="text-xl font-bold text-pink-500">AI Strategies</h2>
                <button className="text-purple-400 hover:text-pink-500 transition-colors p-1">
                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
            </div>

            {!isCollapsed && (
                <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                    <AIStrategyPanel />
                </div>
            )}
        </div>
    );
};
