import { Tetromino, TetrominoType, Position, BOARD_WIDTH, BOARD_HEIGHT } from './types';

const TETROMINO_SHAPES: Record<TetrominoType, number[][][]> = {
    I: [
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
        [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    ],
    O: [
        [[1, 1], [1, 1]],
    ],
    T: [
        [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
        [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
    ],
    S: [
        [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
        [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
        [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
    ],
    Z: [
        [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
        [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
        [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
    ],
    J: [
        [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
        [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
    ],
    L: [
        [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
        [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
        [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
    ],
};

const TETROMINO_COLORS: Record<TetrominoType, string> = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000',
};

export function createEmptyBoard(): number[][] {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
}

export function createTetromino(type: TetrominoType, rotation: number = 0): Tetromino {
    return {
        type,
        shape: TETROMINO_SHAPES[type][rotation % TETROMINO_SHAPES[type].length],
        color: TETROMINO_COLORS[type],
    };
}

// TGM3 Randomizer - provides better piece distribution
let tgm3Generator: Generator<TetrominoType, never, unknown> | null = null;
let classicGenerator: Generator<TetrominoType, never, unknown> | null = null;

function* tgm3Randomizer(): Generator<TetrominoType, never, unknown> {
    const pieces: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
    let order: TetrominoType[] = [];

    // Create 35 pool (5 of each piece)
    let pool: TetrominoType[] = pieces.concat(pieces, pieces, pieces, pieces);

    // First piece special conditions (I, J, L, or T only)
    const firstPiece: TetrominoType = ["I", "J", "L", "T"][Math.floor(Math.random() * 4)] as TetrominoType;
    yield firstPiece;

    let history: TetrominoType[] = ["S", "Z", "S", firstPiece];

    while (true) {
        let roll: number;
        let i: number = 0;
        let piece: TetrominoType = "I";

        // Roll for piece (up to 6 attempts)
        for (roll = 0; roll < 6; ++roll) {
            i = Math.floor(Math.random() * 35);
            piece = pool[i];
            if (!history.includes(piece) || roll === 5) {
                break;
            }
            if (order.length) pool[i] = order[0];
        }

        // Update piece order
        if (order.includes(piece)) {
            order.splice(order.indexOf(piece), 1);
        }
        order.push(piece);

        pool[i] = order[0];

        // Update history
        history.shift();
        history[3] = piece;

        yield piece;
    }
}

// Classic Randomizer (History 3, Roll 4) - "Stupid" logic
function* classicRandomizer(historyLength: number = 3): Generator<TetrominoType, never, unknown> {
    const pieces: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
    // Initialize history with dummy values
    const history: TetrominoType[] = (["Z", "Z", "Z"] as TetrominoType[]).slice(0, historyLength); // Fill with duplicates to encourage start variety? No, just random.
    // Actually, TGM classic starts with history ZZZZ or similar.

    while (true) {
        let piece: TetrominoType = pieces[Math.floor(Math.random() * pieces.length)];

        // Roll up to 4 times to find a piece not in history
        for (let i = 0; i < 4; i++) {
            if (!history.includes(piece)) {
                break;
            }
            piece = pieces[Math.floor(Math.random() * pieces.length)];
        }

        history.shift();
        history.push(piece);
        yield piece;
    }
}

function getNextTGM3Piece(): TetrominoType {
    if (!tgm3Generator) {
        tgm3Generator = tgm3Randomizer();
    }
    return tgm3Generator.next().value;
}

function getNextClassicPiece(): TetrominoType {
    if (!classicGenerator) {
        classicGenerator = classicRandomizer(3);
    }
    return classicGenerator.next().value;
}

export type RandomizerMode = 'tgm3' | 'classic';

export function getRandomTetromino(mode: RandomizerMode = 'tgm3'): Tetromino {
    const randomType = mode === 'classic' ? getNextClassicPiece() : getNextTGM3Piece();
    return createTetromino(randomType);
}

// Reset the randomizer (useful for new games)
export function resetRandomizer(): void {
    tgm3Generator = null;
    classicGenerator = null;
}

export function rotateTetromino(piece: Tetromino): Tetromino {
    const rotations = TETROMINO_SHAPES[piece.type];
    const currentIndex = rotations.findIndex(
        (shape) => JSON.stringify(shape) === JSON.stringify(piece.shape)
    );
    const nextIndex = (currentIndex + 1) % rotations.length;
    return {
        ...piece,
        shape: rotations[nextIndex],
    };
}

export function rotateTetrominoReverse(piece: Tetromino): Tetromino {
    const rotations = TETROMINO_SHAPES[piece.type];
    const currentIndex = rotations.findIndex(
        (shape) => JSON.stringify(shape) === JSON.stringify(piece.shape)
    );
    // Go backwards: subtract 1 and add length to handle negative modulo
    const prevIndex = (currentIndex - 1 + rotations.length) % rotations.length;
    return {
        ...piece,
        shape: rotations[prevIndex],
    };
}

export function checkCollision(
    board: number[][],
    piece: Tetromino,
    position: Position
): boolean {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = position.x + x;
                const newY = position.y + y;

                if (
                    newX < 0 ||
                    newX >= BOARD_WIDTH ||
                    newY >= BOARD_HEIGHT ||
                    (newY >= 0 && board[newY][newX])
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function mergePieceToBoard(
    board: number[][],
    piece: Tetromino,
    position: Position
): number[][] {
    const newBoard = board.map(row => [...row]);

    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardY = position.y + y;
                const boardX = position.x + x;
                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    // Store color index (1-7) based on piece type
                    const colorIndex = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'].indexOf(piece.type) + 1;
                    newBoard[boardY][boardX] = colorIndex;
                }
            }
        }
    }

    return newBoard;
}

export function clearLines(board: number[][]): { newBoard: number[][], linesCleared: number } {
    let linesCleared = 0;
    const newBoard = board.filter(row => {
        if (row.every(cell => cell !== 0)) {
            linesCleared++;
            return false;
        }
        return true;
    });

    while (newBoard.length < BOARD_HEIGHT) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }

    return { newBoard, linesCleared };
}

// NES Tetris speed curve (frames per drop)
const FRAMES_PER_DROP: Record<number, number> = {
    0: 48, 1: 43, 2: 38, 3: 33, 4: 28, 5: 23, 6: 18, 7: 13, 8: 8, 9: 6,
    10: 5, 11: 5, 12: 5, 13: 4, 14: 4, 15: 4, 16: 3, 17: 3, 18: 3,
    19: 2, 20: 2, 21: 2, 22: 2, 23: 2, 24: 2, 25: 2, 26: 2, 27: 2, 28: 2,
    29: 1, // Kill screen
};

export function getFramesPerDrop(level: number): number {
    if (level >= 29) return 1;
    return FRAMES_PER_DROP[level] || 1;
}

export function getDropSpeed(level: number): number {
    // Convert frames to milliseconds (assuming 60 FPS)
    const frames = getFramesPerDrop(level);
    return Math.max((frames * 1000) / 60, 50); // Minimum 50ms
}

export function calculateScore(linesCleared: number, level: number): number {
    // NES Tetris scoring formula
    const baseScores: Record<number, number> = {
        0: 0,
        1: 40,      // Single
        2: 100,     // Double
        3: 300,     // Triple
        4: 1200,    // Tetris
    };
    return (baseScores[linesCleared] || 0) * (level + 1);
}

export function getColorForCell(cellValue: number): string {
    const colors = ['transparent', '#00f0f0', '#f0f000', '#a000f0', '#00f000', '#f00000', '#0000f0', '#f0a000'];
    return colors[cellValue] || 'transparent';
}

export function getStartPosition(): Position {
    return { x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 };
}
