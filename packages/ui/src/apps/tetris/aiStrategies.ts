import { NeuralNetwork, TrainingExample } from './neuralNetwork';
import { AIWeights } from './aiPlayer';
import { calculateReward, weightsToOutput, saveNeuralNetwork, getNeuralNetwork } from './neuralAI';

// --- Types ---

export interface GameResult {
    score: number;
    lines: number;
    level: number;
    weights: AIWeights;
    boardFeatures: number[];
    timestamp: number;
}

export interface AIStrategy {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    logsEnabled?: boolean;

    // Called when a game finishes
    onGameEnd?(result: GameResult, allHistory: GameResult[]): void;

    // Called before training a batch - allows injecting/modifying examples
    onTrainingStart?(network: NeuralNetwork, currentBatch: TrainingExample[]): TrainingExample[];

    // Called when the AI needs weights - allows overriding the network entirely
    onWeightsRequested?(currentWeights: AIWeights, boardState: any): AIWeights | null;
}

// --- Strategy Manager ---

export class StrategyManager {
    private static instance: StrategyManager;
    private strategies: Map<string, AIStrategy> = new Map();
    private storageKey = 'tetris-ai-strategies-config';

    private constructor() {
        // Config is loaded when strategies are registered
    }

    public static getInstance(): StrategyManager {
        if (!StrategyManager.instance) {
            StrategyManager.instance = new StrategyManager();
        }
        return StrategyManager.instance;
    }

    public registerStrategy(strategy: AIStrategy): void {
        // Load enabled state from config if it exists
        const config = this.getStoredConfig();
        if (config[strategy.id] !== undefined) {
            const stored = config[strategy.id];
            // Handle migration from old boolean format
            if (typeof stored === 'boolean') {
                strategy.isEnabled = stored;
                strategy.logsEnabled = true;
            } else {
                strategy.isEnabled = stored.isEnabled;
                strategy.logsEnabled = stored.logsEnabled ?? true;
            }
        } else {
            // Default logs to true if new strategy
            if (strategy.logsEnabled === undefined) strategy.logsEnabled = true;
        }
        this.strategies.set(strategy.id, strategy);
    }

    public getStrategies(): AIStrategy[] {
        return Array.from(this.strategies.values());
    }

    public toggleStrategy(id: string, enabled: boolean): void {
        const strategy = this.strategies.get(id);
        if (strategy) {
            strategy.isEnabled = enabled;
            this.saveConfig();
        }
    }

    public toggleLogs(id: string, enabled: boolean): void {
        const strategy = this.strategies.get(id);
        if (strategy) {
            strategy.logsEnabled = enabled;
            this.saveConfig();
        }
    }

    private getStoredConfig(): Record<string, any> {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        } catch {
            return {};
        }
    }

    private saveConfig(): void {
        const config: Record<string, { isEnabled: boolean, logsEnabled: boolean }> = {};
        this.strategies.forEach(s => {
            config[s.id] = {
                isEnabled: s.isEnabled,
                logsEnabled: s.logsEnabled ?? true
            };
        });
        localStorage.setItem(this.storageKey, JSON.stringify(config));
    }

    // --- Hooks ---

    public runOnGameEnd(result: GameResult, allHistory: GameResult[]): void {
        this.strategies.forEach(s => {
            if (s.isEnabled && s.onGameEnd) {
                try {
                    s.onGameEnd(result, allHistory);
                } catch (e) {
                    console.error(`[AI Strategy] Error in ${s.name}.onGameEnd:`, e);
                }
            }
        });
    }

    public processTrainingBatch(network: NeuralNetwork, batch: TrainingExample[]): TrainingExample[] {
        let currentBatch = [...batch];
        this.strategies.forEach(s => {
            if (s.isEnabled && s.onTrainingStart) {
                try {
                    currentBatch = s.onTrainingStart(network, currentBatch);
                } catch (e) {
                    console.error(`[AI Strategy] Error in ${s.name}.onTrainingStart:`, e);
                }
            }
        });
        return currentBatch;
    }

    public getWeightOverride(currentWeights: AIWeights, boardState: any): AIWeights | null {
        for (const s of this.strategies.values()) {
            if (s.isEnabled && s.onWeightsRequested) {
                try {
                    const override = s.onWeightsRequested(currentWeights, boardState);
                    if (override) return override;
                } catch (e) {
                    console.error(`[AI Strategy] Error in ${s.name}.onWeightsRequested:`, e);
                }
            }
        }
        return null; // No override
    }
}

// --- Implementations ---

export class HallOfFameStrategy implements AIStrategy {
    id = 'hall-of-fame';
    name = 'Hall of Fame (Experience Replay)';
    description = 'Keeps top 20 games and mixes them (50/50) into training to reinforce winning habits.';
    isEnabled = true;
    logsEnabled = true;
    private storageKey = 'tetris-hall-of-fame';

    onGameEnd(result: GameResult): void {
        try {
            const hallOfFame = this.getHallOfFame();
            hallOfFame.push(result);
            hallOfFame.sort((a: any, b: any) => b.score - a.score);
            if (hallOfFame.length > 50) hallOfFame.length = 50;
            localStorage.setItem(this.storageKey, JSON.stringify(hallOfFame));

            if (this.logsEnabled && result.score > 0) {
                // Only log significant updates or if user wants verbose
            }
        } catch (e) {
            if (this.logsEnabled) console.error('[HoF Strategy] Failed to save result', e);
        }
    }

    onTrainingStart(network: NeuralNetwork, batch: TrainingExample[]): TrainingExample[] {
        const hallOfFame = this.getHallOfFame();
        if (hallOfFame.length === 0) return batch;

        const hofExamples: TrainingExample[] = hallOfFame.map((game: any) => {
            const reward = calculateReward(game.score, game.lines, game.level);
            // Use actual board features if available, otherwise fallback to neutral
            const input = game.boardFeatures || Array(10).fill(0.5);
            const expectedOutput = weightsToOutput(game.weights);
            return { input, expectedOutput, reward };
        });

        // Mix 50/50
        const mixedBatch: TrainingExample[] = [];
        const targetSize = batch.length; // Keep same batch size usually, or extend?
        // Let's match the original logic: mix recent (batch) and HoF

        // Note: The input 'batch' here is usually the recent history batch.
        // We will return a new batch that mixes them.

        // Take 50% from recent (batch)
        const recentCount = Math.ceil(targetSize * 0.5);
        for (let i = 0; i < recentCount && i < batch.length; i++) {
            mixedBatch.push(batch[batch.length - 1 - i]); // Latest first
        }

        // Fill rest with HoF
        const remainingSlots = targetSize - mixedBatch.length;
        for (let i = 0; i < remainingSlots; i++) {
            const randomHoF = hofExamples[Math.floor(Math.random() * hofExamples.length)];
            mixedBatch.push(randomHoF);
        }

        return mixedBatch;
    }

    private getHallOfFame(): any[] {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch {
            return [];
        }
    }
}

export class AutoRevertStrategy implements AIStrategy {
    id = 'auto-revert';
    name = 'Auto-Revert Safety Net';
    description = 'Snapshots best performance. If average score drops by 50%, reverts network to backup.';
    isEnabled = true;
    logsEnabled = true;

    private bestNetworkKey = 'tetris-neural-network-best';
    private bestPerformanceKey = 'tetris-best-performance';

    onGameEnd(result: GameResult, allHistory: GameResult[]): void {
        // Calculate recent performance (last 10 games)
        const recentGames = allHistory.slice(-50);
        if (recentGames.length < 10) return;

        const currentAvg = recentGames.reduce((sum, g) => sum + g.score, 0) / recentGames.length;

        this.checkAndSaveBest(currentAvg);
        this.checkAndRevert(currentAvg);
    }

    private checkAndSaveBest(currentAvg: number) {
        try {
            const storedBest = localStorage.getItem(this.bestPerformanceKey);
            const bestPerf = storedBest ? parseFloat(storedBest) : 0;

            if (currentAvg > bestPerf) {
                if (this.logsEnabled) console.log(`[Auto-Revert] New best performance: ${currentAvg} (prev: ${bestPerf}). Saving snapshot.`);
                const network = getNeuralNetwork(); // Get current state
                localStorage.setItem(this.bestNetworkKey, JSON.stringify(network.toJSON()));
                localStorage.setItem(this.bestPerformanceKey, currentAvg.toString());
            }
        } catch (e) {
            if (this.logsEnabled) console.error('[Auto-Revert] Failed to save best', e);
        }
    }

    private checkAndRevert(currentAvg: number) {
        try {
            const bestPerf = parseFloat(localStorage.getItem(this.bestPerformanceKey) || '0');
            // Check for 50% drop, but only if we have a meaningful baseline (> 1000 score)
            if (bestPerf > 1000 && currentAvg < bestPerf * 0.5) {
                if (this.logsEnabled) console.warn(`[Auto-Revert] COLLAPSE DETECTED (Current: ${currentAvg}, Best: ${bestPerf}). Reverting...`);

                const stored = localStorage.getItem(this.bestNetworkKey);
                if (stored) {
                    const data = JSON.parse(stored);
                    const bestNetwork = NeuralNetwork.fromJSON(data);
                    saveNeuralNetwork(bestNetwork); // Overwrite IDB/LocalStorage
                    if (this.logsEnabled) console.log('[Auto-Revert] Network restored to best snapshot.');
                }
            }
        } catch (e) {
            if (this.logsEnabled) console.error('[Auto-Revert] Failed to revert', e);
        }
    }
}

// Initialize and export singleton
export const strategyManager = StrategyManager.getInstance();
strategyManager.registerStrategy(new HallOfFameStrategy());
strategyManager.registerStrategy(new AutoRevertStrategy());
