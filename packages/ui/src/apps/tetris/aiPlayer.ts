import { Tetromino, Position, Move, BOARD_WIDTH, BOARD_HEIGHT } from './types';
import { checkCollision, mergePieceToBoard, rotateTetromino, clearLines } from './gameLogic';

export interface AIWeights {
    lineCleared: number;
    contact: number;
    holesCreated: number;
    overhangsCreated: number;
    overhangsFilled: number;
    heightAdded: number;
    wellDepthSquared: number;
    bumpiness: number;
    avgHeight: number;
    rowTransitions: number;
}

export const DEFAULT_WEIGHTS: AIWeights = {
    lineCleared: 500,
    contact: 400,
    holesCreated: 400,
    overhangsCreated: 400,
    overhangsFilled: 200,
    heightAdded: 800,
    wellDepthSquared: 500,
    bumpiness: 50,
    avgHeight: 20,
    rowTransitions: 40,
};

export interface AdaptiveScalingMode {
    // How much each weight changes at this mode's maximum (0-1 scale)
    lineCleared: number;      // Decrease multiplier (e.g., 0.3 = -30% at max)
    contact: number;          // Decrease multiplier
    overhangsFilled: number;  // Decrease multiplier
    holesCreated: number;     // Increase multiplier (e.g., 2.0 = +200% at max)
    overhangsCreated: number; // Increase multiplier
    heightAdded: number;      // Increase multiplier
    avgHeight: number;        // Increase multiplier
    wellDepthSquared: number; // Decrease multiplier
    bumpiness: number;        // Increase multiplier
    rowTransitions: number;   // Increase multiplier
}

export interface AdaptiveScaling {
    normal: AdaptiveScalingMode;   // Height 0-9
    defense: AdaptiveScalingMode;  // Height 9-12
    crisis: AdaptiveScalingMode;   // Height 12+
}

export const DEFAULT_ADAPTIVE_SCALING: AdaptiveScaling = {
    normal: {
        lineCleared: 0,      // No change in normal mode
        contact: 0,
        overhangsFilled: 0,
        holesCreated: 0,
        overhangsCreated: 0,
        heightAdded: 0,
        avgHeight: 0,
        wellDepthSquared: 0,
        bumpiness: 0,
        rowTransitions: 0,
    },
    defense: {
        lineCleared: 0.15,   // -15% at defense mode
        contact: 0.35,       // -35% at defense mode
        overhangsFilled: 0.25,
        holesCreated: 1.0,   // +100% at defense mode
        overhangsCreated: 0.75,
        heightAdded: 1.5,
        avgHeight: 1.25,
        wellDepthSquared: 0.2,
        bumpiness: 0.25,
        rowTransitions: 0.3,
    },
    crisis: {
        lineCleared: 0.3,    // -30% at crisis
        contact: 0.7,        // -70% at crisis
        overhangsFilled: 0.5,
        holesCreated: 2.0,   // +200-300% at crisis
        overhangsCreated: 1.5,
        heightAdded: 3.0,
        avgHeight: 2.5,
        wellDepthSquared: 0.4,
        bumpiness: 0.5,
        rowTransitions: 0.6,
    },
};

/**
 * Adaptive weight scaling based on board height
 * As the board fills up, the AI becomes more defensive:
 * - Heavily penalizes height increases and hole creation
 * - Reduces emphasis on score optimization (line clearing, contact)
 * - Prioritizes survival over points
 */
export function getAdaptiveWeights(
    baseWeights: AIWeights,
    avgHeight: number,
    scaling: AdaptiveScaling = DEFAULT_ADAPTIVE_SCALING
): AIWeights {
    // Determine which mode and ratio
    let mode: AdaptiveScalingMode;
    let ratio: number;
    let crisisMultiplier = 1.0;

    if (avgHeight < 9) {
        // Normal mode (0-9): minimal scaling
        mode = scaling.normal;
        ratio = Math.min(avgHeight / 9, 1.0);
    } else if (avgHeight < 12) {
        // Defense mode (9-12): moderate scaling
        mode = scaling.defense;
        ratio = Math.min((avgHeight - 9) / 3, 1.0);
    } else {
        // Crisis mode (12+): aggressive scaling with multiplier
        mode = scaling.crisis;
        ratio = Math.min((avgHeight - 12) / 3, 1.0);
        crisisMultiplier = 1.5; // Extra aggressive in crisis
    }

    return {
        // Bonuses decrease (focus shifts from score to survival)
        lineCleared: baseWeights.lineCleared * (1 - ratio * mode.lineCleared),
        contact: baseWeights.contact * (1 - ratio * mode.contact),
        overhangsFilled: baseWeights.overhangsFilled * (1 - ratio * mode.overhangsFilled),

        // Critical penalties increase
        holesCreated: baseWeights.holesCreated * (1 + ratio * mode.holesCreated * crisisMultiplier),
        overhangsCreated: baseWeights.overhangsCreated * (1 + ratio * mode.overhangsCreated * crisisMultiplier),
        heightAdded: baseWeights.heightAdded * (1 + ratio * mode.heightAdded * crisisMultiplier),
        avgHeight: baseWeights.avgHeight * (1 + ratio * mode.avgHeight * crisisMultiplier),

        // Moderate adjustments
        wellDepthSquared: baseWeights.wellDepthSquared * (1 - ratio * mode.wellDepthSquared),
        bumpiness: baseWeights.bumpiness * (1 + ratio * mode.bumpiness),
        rowTransitions: baseWeights.rowTransitions * (1 + ratio * mode.rowTransitions),
    };
}

function countContacts(board: number[][], piece: Tetromino, position: Position): number {
    let contacts = 0;

    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardY = position.y + y;
                const boardX = position.x + x;

                // Check below
                if (boardY + 1 >= BOARD_HEIGHT || (boardY + 1 >= 0 && board[boardY + 1]?.[boardX])) {
                    contacts++;
                }
                // Check left
                if (boardX - 1 < 0 || (boardY >= 0 && board[boardY]?.[boardX - 1])) {
                    contacts++;
                }
                // Check right
                if (boardX + 1 >= BOARD_WIDTH || (boardY >= 0 && board[boardY]?.[boardX + 1])) {
                    contacts++;
                }
            }
        }
    }

    return contacts;
}

function countCompletedLines(board: number[][]): number {
    let completedLines = 0;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        if (board[y].every(cell => cell !== 0)) {
            completedLines++;
        }
    }
    return completedLines;
}

function countHoles(board: number[][]): number {
    let holes = 0;

    for (let x = 0; x < BOARD_WIDTH; x++) {
        let blockFound = false;
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (board[y][x] !== 0) {
                blockFound = true;
            } else if (blockFound) {
                holes++;
            }
        }
    }

    return holes;
}

function getColumnHeights(board: number[][]): number[] {
    const heights: number[] = [];

    for (let x = 0; x < BOARD_WIDTH; x++) {
        let height = 0;
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (board[y][x] !== 0) {
                height = BOARD_HEIGHT - y;
                break;
            }
        }
        heights.push(height);
    }

    return heights;
}

function countWells(board: number[][]): { wells: number; wellDepth: number } {
    const heights = getColumnHeights(board);
    let totalWells = 0;
    let maxWellDepth = 0;

    for (let x = 0; x < BOARD_WIDTH; x++) {
        const currentHeight = heights[x];
        const leftHeight = x > 0 ? heights[x - 1] : 0;
        const rightHeight = x < BOARD_WIDTH - 1 ? heights[x + 1] : 0;

        // A well is when both neighbors are higher
        const wellDepth = Math.min(leftHeight, rightHeight) - currentHeight;
        if (wellDepth > 0) {
            totalWells++;
            maxWellDepth = Math.max(maxWellDepth, wellDepth);
        }
    }

    return { wells: totalWells, wellDepth: maxWellDepth };
}

function countBumpiness(board: number[][]): number {
    const heights = getColumnHeights(board);
    let bumpiness = 0;

    for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        bumpiness += Math.abs(heights[x] - heights[x + 1]);
    }

    return bumpiness;
}


function countRowTransitions(board: number[][]): number {
    let transitions = 0;

    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH - 1; x++) {
            // Count transition from filled to empty or empty to filled
            if ((board[y][x] === 0) !== (board[y][x + 1] === 0)) {
                transitions++;
            }
        }
    }

    return transitions;
}

function countOverhangs(board: number[][]): number {
    let overhangs = 0;

    for (let y = 0; y < BOARD_HEIGHT - 1; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            // If there's a block with empty space below it
            if (board[y][x] !== 0 && board[y + 1][x] === 0) {
                // Check if there's a block further below (overhang)
                for (let checkY = y + 2; checkY < BOARD_HEIGHT; checkY++) {
                    if (board[checkY][x] !== 0) {
                        overhangs++;
                        break;
                    }
                }
            }
        }
    }

    return overhangs;
}

function countOverhangsFilled(boardBefore: number[][], boardAfter: number[][], piece: Tetromino, position: Position): number {
    let filled = 0;

    // Check each cell of the placed piece
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardY = position.y + y;
                const boardX = position.x + x;

                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    // Check if there's a block above this position (we're filling under it)
                    for (let checkY = boardY - 1; checkY >= 0; checkY--) {
                        if (boardBefore[checkY][boardX] !== 0) {
                            filled++;
                            break;
                        }
                    }
                }
            }
        }
    }

    return filled;
}

function evaluatePosition(board: number[][], piece: Tetromino, position: Position, weights: AIWeights): { score: number; breakdown: any } {
    // Simulate placing the piece
    const testBoard = mergePieceToBoard(board, piece, position);
    const { newBoard, linesCleared } = clearLines(testBoard);

    // Count metrics
    const contacts = countContacts(board, piece, position);
    const holesBefore = countHoles(board);
    const holesAfter = countHoles(newBoard);
    const holesCreated = Math.max(0, holesAfter - holesBefore);
    const overhangsBefore = countOverhangs(board);
    const overhangsAfter = countOverhangs(newBoard);
    const overhangsCreated = Math.max(0, overhangsAfter - overhangsBefore);
    const overhangsFilled = countOverhangsFilled(board, testBoard, piece, position);

    const heightsBefore = getColumnHeights(board);
    const heightsAfter = getColumnHeights(newBoard);
    const maxHeightBefore = Math.max(...heightsBefore);
    const maxHeightAfter = Math.max(...heightsAfter);
    const heightAdded = Math.max(0, maxHeightAfter - maxHeightBefore);

    const { wells, wellDepth } = countWells(newBoard);
    const bumpiness = countBumpiness(newBoard);
    const avgHeight = heightsAfter.reduce((a, b) => a + b, 0) / heightsAfter.length;
    const rowTransitions = countRowTransitions(newBoard);

    // Calculate score components using configurable weights
    const lineScore = linesCleared * weights.lineCleared;
    const contactScore = contacts * weights.contact;
    const holesCreatedPenalty = holesCreated * weights.holesCreated;
    const overhangsCreatedPenalty = overhangsCreated * weights.overhangsCreated;
    const overhangsFilledBonus = overhangsFilled * weights.overhangsFilled;


    // Height added penalty - scales with current stack height
    // The taller the stack, the worse it is to add more height
    const heightMultiplier = 1 + (maxHeightBefore / BOARD_HEIGHT); // 1x at height 0, 2x at max height
    const contactRatio = Math.min(contacts / 8, 1); // Normalize to 0-1
    const heightAddedPenalty = heightAdded * weights.heightAdded * heightMultiplier * (1 - contactRatio * 0.7); // Up to 70% reduction

    // Wells penalty - exponential with depth to heavily penalize deep gaps
    const wellsPenalty = (wellDepth * wellDepth * weights.wellDepthSquared);

    // Bumpiness penalty - encourage smooth surface
    const bumpinessPenalty = bumpiness * weights.bumpiness;

    const avgHeightPenalty = avgHeight * weights.avgHeight;

    // Row transitions penalty - encourage smooth, fillable rows
    const rowTransitionsPenalty = rowTransitions * weights.rowTransitions;

    const totalScore = lineScore + contactScore - holesCreatedPenalty - overhangsCreatedPenalty + overhangsFilledBonus - heightAddedPenalty - wellsPenalty - bumpinessPenalty - avgHeightPenalty - rowTransitionsPenalty;

    return {
        score: totalScore,
        breakdown: {
            linesCleared,
            lineScore,
            contacts,
            contactScore,
            holes: holesAfter,
            holesCreated,
            holesCreatedPenalty,
            overhangs: overhangsAfter,
            overhangsCreated,
            overhangsCreatedPenalty,
            overhangsFilled,
            overhangsFilledBonus,
            heightAdded,
            heightAddedPenalty: Math.round(heightAddedPenalty),
            wells,
            wellDepth,
            wellsPenalty,
            bumpiness,
            bumpinessPenalty,
            maxHeight: maxHeightAfter,
            avgHeight: avgHeight.toFixed(1),
            avgHeightPenalty: avgHeightPenalty.toFixed(0),
            rowTransitions,
            rowTransitionsPenalty,
            totalScore,
        }
    };
}


export function findBestMove(board: number[][], piece: Tetromino, weights: AIWeights = DEFAULT_WEIGHTS): Move | null {
    // Calculate current board average height for adaptive weighting
    const columnHeights = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
        let height = 0;
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (board[y][x] !== 0) {
                height = BOARD_HEIGHT - y;
                break;
            }
        }
        columnHeights.push(height);
    }
    const currentAvgHeight = columnHeights.reduce((sum, h) => sum + h, 0) / BOARD_WIDTH;

    // Apply adaptive weights based on current board height
    const adaptiveWeights = getAdaptiveWeights(weights, currentAvgHeight);

    let bestMove: Move | null = null;
    let bestScore = -Infinity;

    // Try all 4 rotations
    let currentPiece = piece;
    for (let rotation = 0; rotation < 4; rotation++) {
        // Try all horizontal positions
        for (let x = -3; x <= BOARD_WIDTH; x++) {
            const position: Position = { x, y: 0 };

            // Drop piece down until collision
            let dropPosition = { ...position };
            while (!checkCollision(board, currentPiece, { x: dropPosition.x, y: dropPosition.y + 1 })) {
                dropPosition.y++;
            }

            // Check if this position is valid
            if (!checkCollision(board, currentPiece, dropPosition)) {
                // Evaluate this position with adaptive weights
                const evaluation = evaluatePosition(board, currentPiece, dropPosition, adaptiveWeights);

                if (evaluation.score > bestScore) {
                    bestScore = evaluation.score;
                    bestMove = {
                        position: dropPosition,
                        rotation,
                        score: evaluation.score,
                        breakdown: evaluation.breakdown,
                    };
                }
            }
        }

        // Rotate for next iteration
        currentPiece = rotateTetromino(currentPiece);
    }

    return bestMove;
}


export function getRotationCount(piece: Tetromino, targetRotation: number): number {
    let currentPiece = piece;
    let count = 0;

    for (let i = 0; i < 4; i++) {
        if (i === targetRotation) {
            return count;
        }
        currentPiece = rotateTetromino(currentPiece);
        count++;
    }

    return 0;
}
