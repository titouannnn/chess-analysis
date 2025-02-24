import { Chess } from 'chess.js';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root' // Cela permet à Angular de le fournir à toute l'application
})

export class LocalAnalysis {

    constructor() {}

    // Convert a PGN string into a series of moves suitable for Stockfish.
    parsePgnToMoves(pgn: string): string {
        const chess = new Chess();
        chess.loadPgn(pgn);
        if (chess.history().length === 0) {
            throw new Error("Invalid PGN");
        }
        return chess.history().join(' ');
    }

    // Test function: set up a PGN, initialize Stockfish, and analyze the game.

    testStockfishAnalysis() {
        if (typeof Worker === 'undefined') {
            console.error("Web Workers are not supported in this environment.");
            return;
        }
        
        const engine = new Worker('../assets/analysis/stockfish.js');
        
        engine.onmessage = (msg: any) => {
            const output = msg.data || msg;
            console.log('Engine output:', output);
            if (typeof output === 'string' && output.startsWith('bestmove')) {
                console.log('Analysis finished.');
            }
        };

        const pgn = `
    [Event "Test game"]
    [Site "Local"]
    [Date "2023.10.01"]
    [Round "?"]
    [White "White"]
    [Black "Black"]
    [Result "*"]

    1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
    `;

        let moves: string;
        try {
            moves = this.parsePgnToMoves(pgn);
        } catch (error) {
            console.error('Error parsing PGN:', error);
            return;
        }

        // Set the engine's position and start analysis.
        engine.postMessage(`position startpos moves ${moves}`);
        engine.postMessage('go depth 15');
    }
}