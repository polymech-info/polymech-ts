// Neural Network AI Player for Tetris
import { NeuralNetwork, TrainingExample } from './neuralNetwork';
import { AIWeights } from './aiPlayer';

const NETWORK_STORAGE_KEY = 'tetris-neural-network';
const NETWORK_VERSION_KEY = 'tetris-neural-network-version';

const CURRENT_VERSION = '5'; // Increment when network structure changes (now with rebalanced weights - v5)
const MANUAL_OVERRIDE_KEY = 'tetris-neural-manual-override';
import { strategyManager } from './aiStrategies';

// Network configuration
export const NETWORK_CONFIG = {
    inputSize: 10,
    hiddenLayers: [16, 12],
    outputSize: 10,
    learningRate: 0.01,
};

// Extract board features from debug info for neural network input
export const extractBoardFeatures = (debugInfo: any): number[] => {
    // Normalize all features to 0-1 range
    return [
        Math.min(debugInfo.linesCleared / 4, 1), // 0-4 lines
        Math.min(debugInfo.contacts / 12, 1), // 0-12 contacts
        Math.min(debugInfo.holesCreated / 5, 1), // 0-5 holes
        Math.min(debugInfo.overhangsCreated / 5, 1), // 0-5 overhangs
        Math.min(debugInfo.overhangsFilled / 5, 1), // 0-5 filled
        Math.min(debugInfo.heightAdded / 10, 1), // 0-10 height added
        Math.min(debugInfo.wellDepth / 10, 1), // 0-10 depth
        Math.min(debugInfo.bumpiness / 20, 1), // 0-20 bumpiness
        Math.min(parseFloat(debugInfo.avgHeight) / 10, 1), // 0-10 avg height
        Math.min((debugInfo.rowTransitions || 0) / 50, 1), // 0-50 row transitions
    ];
};

// Convert neural network output to weights
export const outputToWeights = (output: number[]): AIWeights => {
    // Scale outputs to reasonable weight ranges - heavily tuned for stability over greed
    return {
        lineCleared: output[0] * 1000,    // was 20000 - drastically reduced to prevent suicide for lines
        contact: output[1] * 500,         // unchanged
        holesCreated: output[2] * 3000,   // was 2000 - increased to penalize holes more
        overhangsCreated: output[3] * 3000, // unchanged
        overhangsFilled: output[4] * 1000, // unchanged
        heightAdded: output[5] * 3000,    // was 2000 - significantly increased penalty cap
        wellDepthSquared: output[6] * 1000, // was 500
        bumpiness: output[7] * 500,       // was 200
        avgHeight: output[8] * 200,       // was 100
        rowTransitions: output[9] * 200,  // was 100
    };
};

// Convert weights to neural network output format (for training)
export const weightsToOutput = (weights: AIWeights): number[] => {
    return [
        Math.min(weights.lineCleared / 1000, 1),
        Math.min(weights.contact / 500, 1),
        Math.min(weights.holesCreated / 3000, 1),
        Math.min(weights.overhangsCreated / 3000, 1),
        Math.min(weights.overhangsFilled / 1000, 1),
        Math.min(weights.heightAdded / 3000, 1),
        Math.min(weights.wellDepthSquared / 1000, 1),
        Math.min(weights.bumpiness / 500, 1),
        Math.min(weights.avgHeight / 200, 1),
        Math.min(weights.rowTransitions / 200, 1),
    ];
};

// Calculate reward based on game performance
export const calculateReward = (score: number, lines: number, level: number): number => {
    // Reward function: prioritize score and lines cleared
    // Normalize to 0-1 range, with exponential scaling for high scores
    const scoreReward = Math.min(score / 100000, 1) ** 0.5; // Square root for smoother scaling
    const linesReward = Math.min(lines / 100, 1);
    const levelReward = Math.min(level / 10, 1);

    // Weighted combination
    return scoreReward * 0.6 + linesReward * 0.3 + levelReward * 0.1;
};

// Get or create neural network
export const getNeuralNetwork = (): NeuralNetwork => {
    try {
        const storedVersion = localStorage.getItem(NETWORK_VERSION_KEY);
        const stored = localStorage.getItem(NETWORK_STORAGE_KEY);


        // If version mismatch, clear old network and start fresh
        if (storedVersion !== CURRENT_VERSION) {
            localStorage.removeItem(NETWORK_STORAGE_KEY);
            localStorage.removeItem('tetris-game-history'); // Clear old history without board features
            localStorage.setItem(NETWORK_VERSION_KEY, CURRENT_VERSION);
            const newNetwork = new NeuralNetwork(NETWORK_CONFIG);
            return newNetwork;
        }

        // Version matches - try to load stored network
        if (stored) {
            try {
                const data = JSON.parse(stored);
                return NeuralNetwork.fromJSON(data);
            } catch (error) {
                console.error('[Neural AI] Failed to load network:', error);
            }
        }

        // Create new network if loading failed
        return new NeuralNetwork(NETWORK_CONFIG);
    } catch (error) {
        console.error('[Neural AI] Failed to access localStorage or initialize network:', error);
        return new NeuralNetwork(NETWORK_CONFIG);
    }
};

// Save neural network to localStorage
export const saveNeuralNetwork = (network: NeuralNetwork): void => {
    try {
        const data = network.toJSON();
        localStorage.setItem(NETWORK_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('[Neural AI] Failed to save network:', error);
    }
};

// Notify strategies about game end
export const notifyGameEnd = (gameResult: any, allHistory: any[]): void => {
    strategyManager.runOnGameEnd(gameResult, allHistory);
};

// Train network on game history
export const trainOnHistory = (network: NeuralNetwork): void => {
    try {
        const historyData = localStorage.getItem('tetris-game-history');
        const history = historyData ? JSON.parse(historyData) : [];

        if (history.length === 0) return;

        // Check sample size configuration
        // Check sample size configuration
        const sampleSize = parseInt(localStorage.getItem('tetris-training-sample-size') || '3');
        const gameCounter = parseInt(localStorage.getItem('tetris-game-counter') || '0');

        // Use game counter (total games played) instead of history length (which caps at 1000)
        if (gameCounter % sampleSize !== 0) {
            console.log(`[Neural AI] Skipping training (Sample Size: ${sampleSize}, Game: ${gameCounter})`);
            return;
        }

        // Create base training examples from recent history
        let examples: TrainingExample[] = history.map((game: any) => {
            const reward = calculateReward(game.score, game.lines, game.level);

            // Use actual board features if available, otherwise fallback to neutral
            const input = game.boardFeatures || Array(10).fill(0.5);
            const expectedOutput = weightsToOutput(game.weights);

            return { input, expectedOutput, reward };
        });

        // Apply strategies (modifiers)
        examples = strategyManager.processTrainingBatch(network, examples);

        // Train in batches
        const batchSize = 10;
        for (let i = 0; i < examples.length; i += batchSize) {
            const batch = examples.slice(i, i + batchSize);
            network.train(batch);
        }

        saveNeuralNetwork(network);
    } catch (error) {
        console.error('[Neural AI] Failed to train on history:', error);
    }
};

// Get weights from neural network based on current board state
export const getNeuralWeights = (boardFeatures?: number[]): AIWeights => {
    const network = getNeuralNetwork();

    // Check for manual override
    const override = getManualOverride();
    if (override) {
        return override;
    }

    // Use provided features or default to neutral state
    const input = boardFeatures || Array(10).fill(0.5);
    const output = network.predict(input);

    return outputToWeights(output);
};

// Manual override functions
export const setManualOverride = (weights: AIWeights): void => {
    localStorage.setItem(MANUAL_OVERRIDE_KEY, JSON.stringify(weights));
};

export const getManualOverride = (): AIWeights | null => {
    const stored = localStorage.getItem(MANUAL_OVERRIDE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }
    return null;
};

export const clearManualOverride = (): void => {
    localStorage.removeItem(MANUAL_OVERRIDE_KEY);
};

export const hasManualOverride = (): boolean => {
    return localStorage.getItem(MANUAL_OVERRIDE_KEY) !== null;
};

// Train network on manual adjustment
export const trainOnManualAdjustment = (
    network: NeuralNetwork,
    boardFeatures: number[],
    manualWeights: AIWeights,
    reward: number = 1.0 // High reward for manual adjustments
): void => {
    const example: TrainingExample = {
        input: boardFeatures,
        expectedOutput: weightsToOutput(manualWeights),
        reward,
    };

    network.train([example]);
    saveNeuralNetwork(network);
};
