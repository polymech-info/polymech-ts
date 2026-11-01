export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Position {
    x: number;
    y: number;
}

export interface Tetromino {
    type: TetrominoType;
    shape: number[][];
    color: string;
}

export interface GameState {
    board: number[][];
    currentPiece: Tetromino | null;
    currentPosition: Position;
    nextPiece: Tetromino | null;
    score: number;
    level: number;
    lines: number;
    gameOver: boolean;
    isPaused: boolean;
    isAutoPlay: boolean;
}

export interface Move {
    position: Position;
    rotation: number;
    score: number;
    breakdown?: any;
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CELL_SIZE = 30;
