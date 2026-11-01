import React from 'react';
import { Tetromino } from './types';
import { getColorForCell } from './gameLogic';

interface NextPieceDisplayProps {
    nextPiece: Tetromino | null;
}

export const NextPieceDisplay: React.FC<NextPieceDisplayProps> = ({ nextPiece }) => {
    if (!nextPiece) return null;

    // Create a 4x4 grid and center the piece
    const grid: number[][] = Array(4).fill(0).map(() => Array(4).fill(0));
    const piece = nextPiece;

    // Calculate offset to center the piece in the 4x4 grid
    const offsetY = Math.floor((4 - piece.shape.length) / 2);
    const offsetX = Math.floor((4 - piece.shape[0].length) / 2);

    // Place piece in the center of the grid
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                grid[y + offsetY][x + offsetX] = 1;
            }
        }
    }

    return (
        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-purple-500/20 flex-1">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">Next</h2>
            <div className="flex flex-col items-center gap-0">
                {grid.map((row, y) => (
                    <div key={y} className="flex">
                        {row.map((cell, x) => (
                            <div
                                key={`${y}-${x}`}
                                className="w-6 h-6 border border-gray-700/20"
                                style={{
                                    backgroundColor: cell ? nextPiece.color : 'transparent',
                                    boxShadow: cell ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' : 'none',
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
