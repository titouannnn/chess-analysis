//// filepath: /info/etu/l3info/s2202364/Documents/web/src/api/analysisApi.service.ts
import { Injectable } from '@angular/core';
import { Chess } from 'chess.js';

const API_URL = 'https://chess-api.com/v1';

@Injectable({
    providedIn: 'root'
})
export class AnalysisApi {

    constructor() {}

    async postChessApi(data: object): Promise<any> {
        const startTime = performance.now();
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const endTime = performance.now();
            console.log(`API response time: ${endTime - startTime} ms`);

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return undefined;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return undefined;
        }
    }

    async requestConstructor(Userfen: string): Promise<any> {
        const data = {
            fen: Userfen,
            depth: 12
        };

        try {
            const response = await this.postChessApi(data);
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error:', error);
            return undefined;
        }
    }

    fenDiviser(pgn: string): string[] {
        const chess = new Chess();
        try {
            chess.loadPgn(pgn);
        } catch (error) {
            throw new Error('PGN invalide');
        }
        const moves = chess.history();
        chess.reset();
        const positions: string[] = [];
        positions.push(chess.fen());
        for (const move of moves) {
            const result = chess.move(move);
            if (!result) {
                throw new Error(`Coup invalide: ${move}`);
            }
            positions.push(chess.fen());
        }
        console.log(positions);
        return positions;
    }

    async gameAnalysis(pgn: string): Promise<void> {
        const tab: any[] = [];
        for (const fen of this.fenDiviser(pgn)) {
            const response: any = await this.requestConstructor(fen);
            tab.push(response);
        }
        console.log(tab);
    }
}