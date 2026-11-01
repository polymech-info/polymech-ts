import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Position, BOARD_WIDTH, BOARD_HEIGHT } from './types';
import {
    createEmptyBoard,
    getRandomTetromino,
    resetRandomizer,
    rotateTetromino,
    checkCollision,
    mergePieceToBoard,
    clearLines,
    calculateScore,
    getColorForCell,
    getStartPosition,
    getDropSpeed,
    RandomizerMode,
} from './gameLogic';
import { findBestMove, AIWeights, DEFAULT_WEIGHTS, AdaptiveScaling, DEFAULT_ADAPTIVE_SCALING } from './aiPlayer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getNeuralNetwork, saveNeuralNetwork, trainOnHistory, getNeuralWeights, calculateReward, extractBoardFeatures, weightsToOutput, NETWORK_CONFIG, notifyGameEnd } from './neuralAI';
import { NeuralNetworkVisualizer } from './NeuralNetworkVisualizer';
import { WeightsHistoryChart } from './WeightsHistoryChart';
import { AIStrategyControl } from './AIStrategyControl';
import { PerformanceChart } from './PerformanceChart';
import { AIWeightsPanel } from './AIWeightsPanel';
import { ControlsPanel } from './ControlsPanel';
import { StatsPanel } from './StatsPanel';
import { NextPieceDisplay } from './NextPieceDisplay';
import { LearningLog } from './LearningLog';
import { TrainingDataModal } from './TrainingDataModal';
import { Database } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

// Game history tracking
interface GameResult {
    score: number;
    lines: number;
    level: number;
    weights: AIWeights;
    boardFeatures: number[]; // Average board state during the game
    timestamp: number;
}

interface WeightChange {
    timestamp: number;
    gameNumber: number;
    score: number;
    lines: number;
    oldWeights: AIWeights;
    newWeights: AIWeights;
}

const saveGameResult = (score: number, lines: number, level: number, weights: AIWeights, boardFeatures: number[], isAutoTraining: boolean = true) => {
    try {
        const history: GameResult[] = JSON.parse(localStorage.getItem('tetris-game-history') || '[]');
        history.push({
            score,
            lines,
            level,
            weights,
            boardFeatures,
            timestamp: Date.now(),
        });
        // Keep only last 1000 games for training
        if (history.length > 1000) {
            history.shift();
        }
        localStorage.setItem('tetris-game-history', JSON.stringify(history));

        // Notify AI strategies (Hall of Fame, Auto-Revert)
        notifyGameEnd({
            score,
            lines,
            level,
            weights,
            boardFeatures,
            timestamp: Date.now(),
        }, history);

        // Train neural network on new data ONLY if auto-training is enabled
        if (isAutoTraining) {
            const network = getNeuralNetwork();
            trainOnHistory(network);
        }
    } catch (error) {
        console.error("Failed to save game result:", error);
    }
};



const Tetris: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>({
        board: createEmptyBoard(),
        currentPiece: null,
        currentPosition: getStartPosition(),
        nextPiece: getRandomTetromino(),
        score: 0,
        level: 1,
        lines: 0,
        gameOver: false,
        isPaused: false,
        isAutoPlay: true,
    });

    const [gameStarted, setGameStarted] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any>({
        linesCleared: 0,
        lineScore: 0,
        contacts: 0,
        contactScore: 0,
        holes: 0,
        holesCreated: 0,
        holesCreatedPenalty: 0,
        overhangs: 0,
        overhangsCreated: 0,
        overhangsCreatedPenalty: 0,
        overhangsFilled: 0,
        overhangsFilledBonus: 0,
        heightAdded: 0,
        heightAddedPenalty: 0,
        wells: 0,
        wellDepth: 0,
        wellsPenalty: 0,
        bumpiness: 0,
        bumpinessPenalty: 0,
        maxHeight: 0,
        avgHeight: '0.0',
        avgHeightPenalty: '0',
        rowTransitions: 0,
        rowTransitionsPenalty: 0,
        totalScore: 0,
    });
    const [clearedLines, setClearedLines] = useState<number[]>([]);
    const [aiWeights, setAiWeights] = useState<AIWeights>(() => {
        const stored = localStorage.getItem('tetris-ai-weights');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Filter out undefined/null values and merge with defaults
                const cleanParsed = Object.fromEntries(
                    Object.entries(parsed).filter(([_, v]) => v !== undefined && v !== null && !isNaN(v as number))
                );
                return { ...DEFAULT_WEIGHTS, ...cleanParsed };
            } catch {
                return DEFAULT_WEIGHTS;
            }
        }
        return DEFAULT_WEIGHTS;
    });
    const [aiMode, setAiMode] = useState<'standard' | 'neural'>('neural');
    const [startLevel, setStartLevel] = useState(() => {
        const stored = localStorage.getItem('tetris-start-level');
        return stored ? parseInt(stored) : 40;
    });
    const [neuralNetwork] = useState(() => getNeuralNetwork());
    const [currentNNInput, setCurrentNNInput] = useState<number[]>();
    const [currentNNOutput, setCurrentNNOutput] = useState<number[]>();
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [weightChanges, setWeightChanges] = useState<WeightChange[]>(() => {
        const stored = localStorage.getItem('tetris-weight-changes');
        return stored ? JSON.parse(stored) : [];
    });
    const [isMaxSpeed, setIsMaxSpeed] = useState(() => {
        return localStorage.getItem('tetris-max-speed') === 'true';
    });
    const [gameCounter, setGameCounter] = useState(() => {
        const stored = localStorage.getItem('tetris-game-counter');
        return stored ? parseInt(stored) : 0;
    });
    const [gameHistory, setGameHistory] = useState<GameResult[]>(() => {
        const stored = localStorage.getItem('tetris-game-history');
        return stored ? JSON.parse(stored) : [];
    });
    const [adaptiveScaling, setAdaptiveScaling] = useState<AdaptiveScaling>(() => {
        const stored = localStorage.getItem('tetris-adaptive-scaling');
        return stored ? JSON.parse(stored) : DEFAULT_ADAPTIVE_SCALING;
    });
    const [randomizerMode, setRandomizerMode] = useState<RandomizerMode>(() => {
        return (localStorage.getItem('tetris-randomizer-mode') as RandomizerMode) || 'tgm3';
    });
    const [activeTab, setActiveTab] = useState<'game' | 'manual' | 'log'>('game');
    const [manualContent, setManualContent] = useState<string>('');

    const gameLoopRef = useRef<number | null>(null);
    const lastDropTimeRef = useRef<number>(0);
    const aiMoveRef = useRef<any>(null);
    const lastProcessedPieceRef = useRef<string | null>(null); // Track which piece we've processed
    const aiStateRef = useRef<'idle' | 'calculating' | 'executing' | 'dropping'>('idle');
    const aiStateStartTimeRef = useRef<number>(0);
    const inactivityTimerRef = useRef<number | null>(null);
    const boardFeaturesAccumulator = useRef<number[][]>([]); // Accumulate board features during game

    // Load manual content
    useEffect(() => {
        fetch('/tetris.md')
            .then(res => res.text())
            .then(text => setManualContent(text))
            .catch(err => console.error('Failed to load manual:', err));
    }, []);

    const handleMaxSpeedChange = (checked: boolean) => {
        setIsMaxSpeed(checked);
        localStorage.setItem('tetris-max-speed', String(checked));
    };

    const handleRandomizerModeChange = (mode: RandomizerMode) => {
        setRandomizerMode(mode);
        localStorage.setItem('tetris-randomizer-mode', mode);
        // Reset randomizers to clear history/generators when switching modes
        resetRandomizer();
    };

    const startGame = useCallback(() => {
        // Save previous game result if it was a completed game
        if (gameStarted && gameState.gameOver) {
            // Calculate average board features from accumulator
            const avgBoardFeatures = boardFeaturesAccumulator.current.length > 0
                ? boardFeaturesAccumulator.current[0].map((_, i) =>
                    boardFeaturesAccumulator.current.reduce((sum, features) => sum + features[i], 0) /
                    boardFeaturesAccumulator.current.length
                )
                : Array(10).fill(0.5); // Fallback if no features collected

            saveGameResult(gameState.score, gameState.lines, gameState.level, aiWeights, avgBoardFeatures);

            // Update game history state
            const newResult: GameResult = {
                score: gameState.score,
                lines: gameState.lines,
                level: gameState.level,
                weights: aiWeights,
                boardFeatures: avgBoardFeatures,
                timestamp: Date.now(),
            };
            setGameHistory(prev => {
                const updated = [...prev, newResult];
                // Keep only last 1000 games
                return updated.length > 1000 ? updated.slice(-1000) : updated;
            });
        }

        // Reset board features accumulator for new game
        boardFeaturesAccumulator.current = [];

        // Load weights based on AI mode
        const oldWeights = aiWeights;
        const newWeights = aiMode === 'neural' ? getNeuralWeights() : aiWeights;

        if (aiMode === 'neural') {
            // Track weight changes
            const newGameNumber = gameCounter + 1;
            setGameCounter(newGameNumber);
            localStorage.setItem('tetris-game-counter', newGameNumber.toString());

            // Log the weight change ONLY if weights have actually changed
            const areWeightsDifferent = (w1: AIWeights, w2: AIWeights) => {
                return Object.keys(w1).some(key => {
                    const k = key as keyof AIWeights;
                    return Math.abs(w1[k] - w2[k]) > 0.001;
                });
            };

            if (areWeightsDifferent(oldWeights, newWeights)) {
                const change: WeightChange = {
                    timestamp: Date.now(),
                    gameNumber: newGameNumber,
                    score: gameState.score,
                    lines: gameState.lines,
                    oldWeights,
                    newWeights,
                };

                let updatedChanges = [...weightChanges, change];
                if (updatedChanges.length > 1000) {
                    updatedChanges = updatedChanges.slice(-1000);
                }
                setWeightChanges(updatedChanges);
                try {
                    localStorage.setItem('tetris-weight-changes', JSON.stringify(updatedChanges));
                } catch (e) {
                    console.error("Failed to save weight changes", e);
                }
            }

            setAiWeights(newWeights);
        }

        aiMoveRef.current = null;
        lastProcessedPieceRef.current = null;
        aiStateRef.current = 'idle';
        setClearedLines([]);
        setDebugInfo({
            linesCleared: 0,
            lineScore: 0,
            contacts: 0,
            contactScore: 0,
            holes: 0,
            holesCreated: 0,
            holesCreatedPenalty: 0,
            overhangs: 0,
            overhangsCreated: 0,
            overhangsCreatedPenalty: 0,
            overhangsFilled: 0,
            overhangsFilledBonus: 0,
            heightAdded: 0,
            heightAddedPenalty: 0,
            wells: 0,
            wellDepth: 0,
            wellsPenalty: 0,
            bumpiness: 0,
            bumpinessPenalty: 0,
            maxHeight: 0,
            avgHeight: '0.0',
            avgHeightPenalty: '0',
            rowTransitions: 0,
            rowTransitionsPenalty: 0,
            totalScore: 0,
        });

        // Reset the TGM3 randomizer for a fresh start
        resetRandomizer();

        setGameState({
            board: createEmptyBoard(),
            currentPiece: getRandomTetromino(randomizerMode),
            currentPosition: getStartPosition(),
            nextPiece: getRandomTetromino(randomizerMode),
            score: 0,
            level: startLevel,
            lines: 0,
            gameOver: false,
            isPaused: false,
            isAutoPlay: true,
        });
        setGameStarted(true);
    }, [gameStarted, gameState.gameOver, gameState.score, gameState.lines, gameState.level, aiWeights, aiMode, weightChanges, gameCounter, startLevel, randomizerMode]);

    const movePiece = useCallback((dx: number, dy: number) => {
        setGameState((prev) => {
            if (!prev.currentPiece || prev.gameOver || prev.isPaused) return prev;

            const newPosition: Position = {
                x: prev.currentPosition.x + dx,
                y: prev.currentPosition.y + dy,
            };

            if (!checkCollision(prev.board, prev.currentPiece, newPosition)) {
                return { ...prev, currentPosition: newPosition };
            }

            return prev;
        });
    }, []);

    const rotate = useCallback(() => {
        setGameState((prev) => {
            if (!prev.currentPiece || prev.gameOver || prev.isPaused) return prev;

            const rotated = rotateTetromino(prev.currentPiece);
            if (!checkCollision(prev.board, rotated, prev.currentPosition)) {
                return { ...prev, currentPiece: rotated };
            }

            return prev;
        });
    }, []);

    const hardDrop = useCallback(() => {
        setGameState((prev) => {
            if (!prev.currentPiece || prev.gameOver || prev.isPaused) return prev;

            let newPosition = { ...prev.currentPosition };
            while (!checkCollision(prev.board, prev.currentPiece, { x: newPosition.x, y: newPosition.y + 1 })) {
                newPosition.y++;
            }

            return { ...prev, currentPosition: newPosition };
        });
    }, []);

    const lockPiece = useCallback(() => {
        setGameState((prev) => {
            if (!prev.currentPiece) return prev;

            const newBoard = mergePieceToBoard(prev.board, prev.currentPiece, prev.currentPosition);
            const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

            // Find which lines were cleared for animation
            const linesToClear: number[] = [];
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (newBoard[y].every(cell => cell !== 0)) {
                    linesToClear.push(y);
                }
            }

            // Show animation if lines were cleared
            if (linesToClear.length > 0) {
                setClearedLines(linesToClear);
                setTimeout(() => setClearedLines([]), isMaxSpeed ? 0 : 300);
            }

            const newScore = prev.score + calculateScore(linesCleared, prev.level);
            const newLines = prev.lines + linesCleared;
            const newLevel = startLevel + Math.floor(newLines / 10);

            if (clearedBoard[0].some(cell => cell !== 0)) {
                return { ...prev, gameOver: true };
            }

            return {
                ...prev,
                board: clearedBoard,
                currentPiece: prev.nextPiece,
                currentPosition: getStartPosition(),
                nextPiece: getRandomTetromino(),
                score: newScore,
                level: newLevel,
                lines: newLines,
            };
        });
    }, [startLevel, isMaxSpeed]);

    const drop = useCallback(() => {
        setGameState((prev) => {
            if (!prev.currentPiece || prev.gameOver || prev.isPaused) return prev;

            const newPosition: Position = {
                x: prev.currentPosition.x,
                y: prev.currentPosition.y + 1,
            };

            if (!checkCollision(prev.board, prev.currentPiece, newPosition)) {
                return { ...prev, currentPosition: newPosition };
            }

            return prev;
        });

        // Check if piece should lock after state update
        setGameState((prev) => {
            if (!prev.currentPiece) return prev;

            const nextPosition: Position = {
                x: prev.currentPosition.x,
                y: prev.currentPosition.y + 1,
            };

            if (checkCollision(prev.board, prev.currentPiece, nextPosition)) {
                // Piece has landed, lock it
                const newBoard = mergePieceToBoard(prev.board, prev.currentPiece, prev.currentPosition);
                const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

                // Find which lines were cleared for animation
                const linesToClear: number[] = [];
                for (let y = 0; y < BOARD_HEIGHT; y++) {
                    if (newBoard[y].every(cell => cell !== 0)) {
                        linesToClear.push(y);
                    }
                }

                // Show animation if lines were cleared
                if (linesToClear.length > 0) {
                    setClearedLines(linesToClear);
                    setTimeout(() => setClearedLines([]), isMaxSpeed ? 0 : 300);
                }

                const newScore = prev.score + calculateScore(linesCleared, prev.level);
                const newLines = prev.lines + linesCleared;
                const newLevel = startLevel + Math.floor(newLines / 10);

                if (clearedBoard[0].some(cell => cell !== 0)) {
                    return { ...prev, gameOver: true };
                }

                return {
                    ...prev,
                    board: clearedBoard,
                    currentPiece: prev.nextPiece,
                    currentPosition: getStartPosition(),
                    nextPiece: getRandomTetromino(randomizerMode),
                    score: newScore,
                    level: newLevel,
                    lines: newLines,
                };
            }

            return prev;
        });
    }, [startLevel, isMaxSpeed, randomizerMode]);

    // Auto-start game on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!gameStarted) {
                startGame();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [gameStarted, startGame]);

    // Reset AI state when lines are cleared (board changes significantly)
    useEffect(() => {
        if (gameState.isAutoPlay && clearedLines.length > 0) {

            aiMoveRef.current = null;
            lastProcessedPieceRef.current = null;
            aiStateRef.current = 'idle';
        }
    }, [clearedLines, gameState.isAutoPlay]);

    // AI logic with state machine
    useEffect(() => {
        if (!gameState.isAutoPlay || gameState.gameOver || gameState.isPaused || !gameState.currentPiece) {
            return;
        }

        // Watchdog: if AI has been in non-idle state for > 2 seconds, force reset
        if (aiStateRef.current !== 'idle' && Date.now() - aiStateStartTimeRef.current > 2000) {
            console.error('AI WATCHDOG: Stuck in state', aiStateRef.current, 'for > 2s, forcing reset');
            hardDrop();
            aiMoveRef.current = null;
            lastProcessedPieceRef.current = null;
            aiStateRef.current = 'idle';
            return;
        }

        // State: IDLE - waiting for new piece
        if (aiStateRef.current === 'idle' && gameState.currentPosition.y <= 1) {
            const pieceId = `${gameState.currentPiece.type}-${gameState.currentPosition.x}`;

            if (lastProcessedPieceRef.current !== pieceId) {

                aiStateRef.current = 'calculating';
                aiStateStartTimeRef.current = Date.now();
                lastProcessedPieceRef.current = pieceId;
                aiMoveRef.current = null;


                const bestMove = findBestMove(gameState.board, gameState.currentPiece, aiWeights);
                if (bestMove) {
                    aiMoveRef.current = {
                        ...bestMove,
                        rotationsNeeded: bestMove.rotation,
                        rotationsDone: 0,
                        pieceType: gameState.currentPiece.type,
                        movesDone: 0,
                    };
                    setDebugInfo(bestMove.breakdown);

                    // Collect board features for neural network training
                    const boardFeatures = extractBoardFeatures(bestMove.breakdown);
                    boardFeaturesAccumulator.current.push(boardFeatures);
                    if (boardFeaturesAccumulator.current.length % 50 === 0) {
                        // console.log(`[Neural AI] Collected ${boardFeaturesAccumulator.current.length} board feature samples`);
                    }

                    aiStateRef.current = 'executing';
                } else {

                    aiStateRef.current = 'dropping';
                    aiStateRef.current = 'dropping';
                    setTimeout(() => {
                        hardDrop();
                        aiStateRef.current = 'idle';
                    }, isMaxSpeed ? 0 : 50);
                }
                // Don't return here - let it fall through to executing state
            }
        }

        // State: EXECUTING - rotating and moving piece
        if (aiStateRef.current === 'executing' && aiMoveRef.current) {
            const aiMove = aiMoveRef.current;

            // Handle rotation
            if (aiMove.rotationsDone < aiMove.rotationsNeeded) {
                setTimeout(() => {
                    rotate();
                    if (aiMoveRef.current) {
                        aiMoveRef.current.rotationsDone++;
                    }
                }, isMaxSpeed ? 0 : 20);
                return;
            }

            // Handle horizontal movement
            const targetX = aiMove.position.x;
            const currentX = gameState.currentPosition.x;

            if (currentX < targetX) {
                aiMove.movesDone = (aiMove.movesDone || 0) + 1;
                if (aiMove.movesDone > 20) {

                    aiStateRef.current = 'dropping';
                    setTimeout(() => {
                        hardDrop();
                        aiMoveRef.current = null;
                        lastProcessedPieceRef.current = null;
                        aiStateRef.current = 'idle';
                    }, isMaxSpeed ? 0 : 50);
                    return;
                }
                setTimeout(() => movePiece(1, 0), isMaxSpeed ? 0 : 5);
                return;
            } else if (currentX > targetX) {
                aiMove.movesDone = (aiMove.movesDone || 0) + 1;
                if (aiMove.movesDone > 20) {

                    aiStateRef.current = 'dropping';
                    setTimeout(() => {
                        hardDrop();
                        aiMoveRef.current = null;
                        lastProcessedPieceRef.current = null;
                        aiStateRef.current = 'idle';
                    }, isMaxSpeed ? 0 : 50);
                    return;
                }
                setTimeout(() => movePiece(-1, 0), isMaxSpeed ? 0 : 5);
                return;
            } else {
                // At target position, transition to dropping

                aiStateRef.current = 'dropping';
                setTimeout(() => {
                    hardDrop();
                    aiMoveRef.current = null;
                    lastProcessedPieceRef.current = null; // Clear so AI can process next piece
                    aiStateRef.current = 'idle';

                }, isMaxSpeed ? 0 : 50);
            }
        }
    }, [gameState.isAutoPlay, gameState.currentPiece, gameState.currentPosition, gameState.gameOver, gameState.isPaused, gameState.board, aiWeights, movePiece, rotate, hardDrop, isMaxSpeed]);


    // Store startGame in a ref to avoid dependency issues
    const startGameRef = useRef(startGame);
    useEffect(() => {
        startGameRef.current = startGame;
    }, [startGame]);

    // Auto-restart after game over
    useEffect(() => {
        if (gameState.gameOver && gameState.isAutoPlay) {
            const timer = setTimeout(() => {
                startGameRef.current();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [gameState.gameOver, gameState.isAutoPlay]);

    // Game loop
    useEffect(() => {
        if (!gameStarted || gameState.gameOver || gameState.isPaused) return;

        const speed = isMaxSpeed ? 0 : getDropSpeed(gameState.level);
        const interval = setInterval(() => {
            // Don't drop if AI is still rotating (horizontal movement is fast enough)
            if (gameState.isAutoPlay && aiMoveRef.current) {
                const aiMove = aiMoveRef.current;
                const isRotating = aiMove.rotationsDone < aiMove.rotationsNeeded;

                if (isRotating) {
                    return; // Skip this drop while rotating
                }
            }

            drop();
        }, speed);

        return () => clearInterval(interval);
    }, [gameStarted, gameState.gameOver, gameState.isPaused, gameState.level, gameState.isAutoPlay, drop, isMaxSpeed]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore keyboard events when focused on input fields (weight tuning)
            if (e.target instanceof HTMLInputElement) {
                return;
            }

            if (!gameStarted) {
                startGame();
                return;
            }

            if (gameState.gameOver) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    setGameState((prev) => ({ ...prev, isAutoPlay: false, level: prev.isAutoPlay ? 0 : prev.level }));
                    // Reset inactivity timer
                    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                    inactivityTimerRef.current = window.setTimeout(() => {
                        setGameState((prev) => ({ ...prev, isAutoPlay: true, level: 10 }));
                    }, 10000);
                    movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    setGameState((prev) => ({ ...prev, isAutoPlay: false, level: prev.isAutoPlay ? 0 : prev.level }));
                    // Reset inactivity timer
                    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                    inactivityTimerRef.current = window.setTimeout(() => {
                        setGameState((prev) => ({ ...prev, isAutoPlay: true, level: 10 }));
                    }, 10000);
                    movePiece(1, 0);
                    break;
                case 'ArrowDown':
                case 'ArrowUp':
                    e.preventDefault();
                    setGameState((prev) => ({ ...prev, isAutoPlay: false, level: prev.isAutoPlay ? 0 : prev.level }));
                    // Reset inactivity timer
                    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                    inactivityTimerRef.current = window.setTimeout(() => {
                        setGameState((prev) => ({ ...prev, isAutoPlay: true, level: 10 }));
                    }, 10000);
                    rotate();
                    break;
                case ' ':
                    e.preventDefault();
                    setGameState((prev) => ({ ...prev, isAutoPlay: false, level: prev.isAutoPlay ? 0 : prev.level }));
                    // Reset inactivity timer
                    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                    inactivityTimerRef.current = window.setTimeout(() => {
                        setGameState((prev) => ({ ...prev, isAutoPlay: true, level: 10 }));
                    }, 10000);
                    hardDrop();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameStarted, gameState.gameOver, startGame, movePiece, drop, rotate]);

    // Update neural network visualization
    useEffect(() => {
        if (aiMode === 'neural' && debugInfo) {
            const input = extractBoardFeatures(debugInfo);
            const output = weightsToOutput(aiWeights);
            setCurrentNNInput(input);
            setCurrentNNOutput(output);
        }
    }, [aiMode, debugInfo, aiWeights]);

    const renderBoard = () => {
        // Calculate ghost piece position
        let ghostY = gameState.currentPosition.y;
        if (gameState.currentPiece) {
            while (!checkCollision(gameState.board, gameState.currentPiece, { x: gameState.currentPosition.x, y: ghostY + 1 })) {
                ghostY++;
            }
        }

        const displayBoard = gameState.currentPiece
            ? mergePieceToBoard(gameState.board, gameState.currentPiece, gameState.currentPosition)
            : gameState.board;

        return displayBoard.map((row, y) => (
            <div key={y} className="flex">
                {row.map((cell, x) => {
                    const isClearing = clearedLines.includes(y);

                    // Check if this cell is part of the ghost piece
                    let isGhost = false;
                    if (!gameState.isAutoPlay && gameState.currentPiece && ghostY !== gameState.currentPosition.y) {
                        for (let py = 0; py < gameState.currentPiece.shape.length; py++) {
                            for (let px = 0; px < gameState.currentPiece.shape[py].length; px++) {
                                if (gameState.currentPiece.shape[py][px]) {
                                    const ghostX = gameState.currentPosition.x + px;
                                    const ghostYPos = ghostY + py;
                                    if (ghostX === x && ghostYPos === y && !cell) {
                                        isGhost = true;
                                    }
                                }
                            }
                        }
                    }

                    return (
                        <div
                            key={x}
                            className={`w-[30px] h-[30px] border border-gray-800 transition-all duration-200 ${isClearing ? 'animate-pulse' : ''}`}
                            style={{
                                backgroundColor: isClearing ? '#ffffff' : (isGhost ? 'transparent' : getColorForCell(cell)),
                                boxShadow: cell && !isClearing ? 'inset 0 0 10px rgba(0,0,0,0.3)' : (isGhost ? 'inset 0 0 0 2px rgba(255,255,255,0.3)' : 'none'),
                            }}
                        />
                    );
                })}
            </div>
        ));
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 w-full max-w-5xl mx-auto">
                    <button
                        onClick={() => setActiveTab('game')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'game'
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                            : 'bg-black/40 text-gray-400 hover:text-gray-200 border border-purple-500/20'
                            }`}
                    >
                        🎮 Game
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'manual'
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                            : 'bg-black/40 text-gray-400 hover:text-gray-200 border border-purple-500/20'
                            }`}
                    >
                        📚 Manual
                    </button>
                    <button
                        onClick={() => setActiveTab('log')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'log'
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                            : 'bg-black/40 text-gray-400 hover:text-gray-200 border border-purple-500/20'
                            }`}
                    >
                        📝 Log
                    </button>
                </div>

                {/* Game Tab Content */}
                {activeTab === 'game' && (
                    <div className="flex flex-col items-center w-full max-w-5xl mx-auto">
                        {/* Top Dashboard: Next Piece + Stats */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full items-stretch justify-center">
                            <div className="flex-shrink-0 flex w-full md:w-auto">
                                <NextPieceDisplay nextPiece={gameState.nextPiece} />
                            </div>
                            <div className="flex-grow min-w-0 flex">
                                <StatsPanel
                                    score={gameState.score}
                                    lines={gameState.lines}
                                    level={gameState.level}
                                    debugInfo={debugInfo}
                                    gameHistory={gameHistory}
                                    gameCounter={gameCounter}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full mb-8 items-start">
                            {/* Left Column: Game Board + Controls */}
                            <div className="flex flex-col gap-4 w-full">
                                <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-purple-500/20 flex flex-col w-full">
                                    <div className="mb-4">
                                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                                            Tetris
                                        </h1>
                                        {!gameStarted && (
                                            <p className="text-gray-300 text-sm">Press any arrow key to start!</p>
                                        )}
                                    </div>

                                    <div className="bg-black/60 p-2 rounded-lg self-center shadow-lg">
                                        {renderBoard()}
                                    </div>

                                    {gameState.gameOver && (
                                        <div className="mt-4 text-center">
                                            <p className="text-2xl font-bold text-red-400 mb-2">Game Over!</p>
                                            <Button onClick={startGame} className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                                                New Game
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Controls - Below Game Board */}
                                <div className="w-full">
                                    <ControlsPanel
                                        gameStarted={gameStarted}
                                        gameOver={gameState.gameOver}
                                        isAutoPlay={gameState.isAutoPlay}
                                        isMaxSpeed={isMaxSpeed}
                                        aiMode={aiMode}
                                        startLevel={startLevel}
                                        onAutoPlayChange={(checked) => {
                                            setGameState((prev) => ({ ...prev, isAutoPlay: checked }));
                                            aiMoveRef.current = null;
                                        }}
                                        onMaxSpeedChange={handleMaxSpeedChange}
                                        onAiModeChange={setAiMode}
                                        onStartLevelChange={(level) => {
                                            setStartLevel(level);
                                            localStorage.setItem('tetris-start-level', level.toString());
                                        }}
                                        onNewGame={startGame}
                                        randomizerMode={randomizerMode}
                                        onRandomizerModeChange={handleRandomizerModeChange}
                                    />

                                </div>
                            </div>

                            {/* Right Column: Weights (and other future panels) */}
                            <div className="flex flex-col gap-4 w-full">
                                {/* AI Weights Panel */}
                                {debugInfo && (
                                    <AIWeightsPanel
                                        debugInfo={debugInfo}
                                        aiWeights={aiWeights}
                                        gameHistory={gameHistory}
                                        weightChanges={weightChanges}
                                        gameCounter={gameCounter}
                                        onWeightsChange={setAiWeights}
                                        onHelpOpen={() => setIsHelpOpen(true)}
                                        onResetAI={() => {
                                            aiMoveRef.current = null;
                                            lastProcessedPieceRef.current = null;
                                        }}
                                        adaptiveScaling={adaptiveScaling}
                                        onAdaptiveScalingChange={(scaling) => {
                                            setAdaptiveScaling(scaling);
                                            localStorage.setItem('tetris-adaptive-scaling', JSON.stringify(scaling));
                                        }}
                                    />
                                )}
                                {aiMode === 'neural' && <AIStrategyControl />}
                            </div>
                        </div>

                        {/* Weights History Chart - Full Width Row */}
                        {aiMode === 'neural' && (
                            <div className="mb-8 w-full">
                                <WeightsHistoryChart changes={weightChanges} />
                            </div>
                        )}
                    </div>
                )}

                {/* Help Popup */}
                {
                    isHelpOpen && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-purple-500/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="sticky top-0 bg-gradient-to-br from-slate-900 to-purple-900 border-b border-purple-500/30 p-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-cyan-400">AI Weights Guide</h2>
                                    <button
                                        onClick={() => setIsHelpOpen(false)}
                                        className="text-gray-400 hover:text-cyan-400 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4 text-gray-300">
                                    <p className="text-sm text-gray-400 mb-4">
                                        These weights control how the AI evaluates each possible move. Higher values make the AI prioritize (for bonuses) or avoid (for penalties) that factor more strongly.
                                    </p>

                                    <div className="space-y-3">
                                        <div className="bg-black/30 p-4 rounded-lg border border-green-500/20">
                                            <h3 className="font-bold text-green-400 mb-2">+ Lines Cleared (Bonus)</h3>
                                            <p className="text-sm">Rewards clearing lines. Higher values make the AI prioritize moves that clear multiple lines at once (Tetris = 4 lines).</p>
                                        </div>

                                        <div className="bg-black/30 p-4 rounded-lg border border-blue-500/20">
                                            <h3 className="font-bold text-blue-400 mb-2">+ Contact (Bonus)</h3>
                                            <p className="text-sm">Rewards placing pieces adjacent to existing blocks. Encourages compact, connected structures rather than isolated pieces.</p>
                                        </div>

                                        <div className="bg-black/30 p-4 rounded-lg border border-red-600/20">
                                            <h3 className="font-bold text-red-600 mb-2">- Holes Created (Penalty)</h3>
                                            <p className="text-sm">Penalty for moves that create NEW holes. Holes are empty cells with blocks above them, making them hard to fill and leading to game over.</p>
                                        </div>

                                        <div className="bg-black/30 p-4 rounded-lg border border-pink-600/20">
                                            <h3 className="font-bold text-pink-600 mb-2">- Overhangs Created (Penalty)</h3>
                                            <p className="text-sm">Extra penalty for creating NEW overhangs. Prevents the AI from making moves that create problematic structures.</p>
                                        </div>

                                        <div className="bg-black/30 p-4 rounded-lg border border-emerald-500/20">
                                            <h3 className="font-bold text-emerald-400 mb-2">+ Overhangs Filled (Bonus)</h3>
                                            <p className="text-sm">Rewards filling in existing overhangs. Encourages the AI to fix problematic structures when possible.</p>
                                        </div>

                                        <div className="bg-black/30 p-4 rounded-lg border border-amber-500/20">
                                            <h3 className="font-bold text-amber-400 mb-2">- Height Added (Penalty)</h3>
                                            <p className="text-sm">Penalizes moves that increase the stack height. Keeps the board low to avoid game over and maintain flexibility.</p>
                                        </div>

                                        <div className="bg-black/30 p-4 rounded-lg border border-rose-600/20">
                                            <h3 className="font-bold text-rose-500 mb-2">- Well Depth² (Penalty)</h3>
                                            <p className="text-sm">Squared penalty for well depth. Deep vertical gaps (wells) limit placement options. A 4-deep well is penalized 16x more than a 1-deep well.</p>
                                        </div>

                                        <div className="bg-black/30 p-4 rounded-lg border border-violet-500/20">
                                            <h3 className="font-bold text-violet-400 mb-2">- Bumpiness (Penalty)</h3>
                                            <p className="text-sm">Penalizes uneven column heights. Smooth, flat surfaces are easier to work with and reduce the chance of creating holes.</p>
                                        </div>



                                        <div className="bg-black/30 p-4 rounded-lg border border-yellow-500/20">
                                            <h3 className="font-bold text-yellow-400 mb-2">- Avg Height (Penalty)</h3>
                                            <p className="text-sm">Penalizes the average height across all columns. Encourages keeping the overall board low and clearing lines regularly.</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                        <h3 className="font-bold text-purple-400 mb-2">💡 Tuning Tips</h3>
                                        <ul className="text-sm space-y-1 list-disc list-inside">
                                            <li>Start with default values and adjust one weight at a time</li>
                                            <li>Use arrow keys (↑↓) to fine-tune values while watching the AI play</li>
                                            <li>Higher penalty values make the AI avoid that factor more aggressively</li>
                                            <li>Balance is key - extreme values can cause unexpected behavior</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Neural Network Visualization - Full Width Below */}
                {
                    aiMode === 'neural' && (
                        <div className="mt-8 max-w-5xl mx-auto w-full">
                            <div className="flex flex-col gap-8 w-full">
                                <div className="w-full">
                                    <NeuralNetworkVisualizer
                                        network={neuralNetwork}
                                        currentInput={currentNNInput}
                                        currentOutput={currentNNOutput}
                                    />
                                </div>
                                <div className="w-full">
                                    <PerformanceChart history={gameHistory} />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Manual Tab Content */}
                {activeTab === 'manual' && (
                    <div className="bg-black/40 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-purple-500/20 max-w-4xl mx-auto">
                        <MarkdownRenderer
                            content={manualContent || '# Loading...'}
                            className="prose-invert"
                        />
                    </div>
                )}

                {/* Log Tab Content */}
                {activeTab === 'log' && (
                    <div className="max-w-4xl mx-auto mb-8">
                        <LearningLog changes={weightChanges} />
                    </div>
                )}
            </div>
        </div >
    );
};

export default Tetris;
