import { Injectable } from '@angular/core';

import { Chess, Square } from "chess.js";
import * as puzzlesData from '../../assets/lichess_db_puzzle_reduit.json';
import * as gamesData from '../../assets/games_small.json';


@Injectable({
  providedIn: 'root'
})

// Récupere et tri les puzzles à conseiller au joueur :

// Tri en fonction de l'opening joué par le joueur
// Tri en fonction de son élo
export class PuzzleScraper {

    public puzzlesRecommendedByOpening: any[] = [];
    public puzzlesRecommendedByFen: any[] = [];
    public losesPlayerData: { [key: string]: number } = {
        opening: 0,
        middlegame: 0,
        endgame: 0,
        mate: 0,
        kingsideAttack: 0,
        fork: 0
    };

    collectPuzzlesByOpening(opening: string): { recommendedPoints: number; Rating: number; URL: string }[] {
        console.log("Tentative de récupération des puzzles hors ligne");
        this.puzzlesRecommendedByOpening = []; // Réinitialisation

        try {
            const data = (puzzlesData as any).default || puzzlesData;
            if (!Array.isArray(data)) {
                throw new Error("Le format des données JSON est invalide.");
            }

            let matchCount: { [puzzleId: string]: number } = {}; // Stocke les correspondances
            let ratingId: { [puzzleId: string]: number } = {}; // Stocke les ratings

            let openings: string[] = opening
                .split("-")
                .filter(tag => tag.toLowerCase() !== "game"); // Enlève "Game"

            if (openings.length === 0) return [];

            const mainOpening = openings[0].toLowerCase(); // Ouverture principale
            const otherTags = openings.slice(1); // Configuration

            for (const item of data) {
                if (item.OpeningTags && typeof item.OpeningTags === 'string' && item.PuzzleId) {
                    let count = 0;

                    // Vérifie si l'OpeningTags contient l'ouverture principale et donne un bonus
                    if (item.OpeningTags.toLowerCase().includes(mainOpening)) {
                        count += 10; // Priorité forte pour le nom de l'ouverture
                    }

                    // Vérifie les autres tags et ajoute au score
                    for (const openingTag of otherTags) {
                        if (item.OpeningTags.toLowerCase().includes(openingTag.toLowerCase())) {
                            count++; // Priorité normale pour la configuration
                        }
                    }

                    if (count > 0) {
                        matchCount[item.PuzzleId] = count;
                        ratingId[item.PuzzleId] = item.Rating;
                    }
                }
            }

            // Trier par score décroissant et récupérer les 30 meilleurs
            this.puzzlesRecommendedByOpening = Object.keys(matchCount)
                .sort((a, b) => matchCount[b] - matchCount[a])
                .slice(0, 30)
                .map(puzzleId => ({
                    recommendedPoints: matchCount[puzzleId],
                    Rating: ratingId[puzzleId],
                    URL: `https://lichess.org/training/${puzzleId}`
                }));

            console.log("Puzzles trouvés et triés :", this.puzzlesRecommendedByOpening);
        } catch (error) {
            console.error("Erreur lors de la récupération des puzzles hors ligne", error);
        }

        return this.puzzlesRecommendedByOpening;
    }
    /*
    collectPuzzleByFen(fen: string): { recommendedPoints: number; Rating: number; URL: string }[] {
        console.log("Tentative de récupération des puzzles hors ligne");
        this.puzzlesRecommendedByOpening = []; // Réinitialisation

        try {
            const data = (localData as any).default || localData;
            if (!Array.isArray(data)) {
                throw new Error("Le format des données JSON est invalide.");
            }

            let matchCount: { [puzzleId: string]: number } = {}; // Stocke les correspondances
            let ratingId: { [puzzleId: string]: number } = {}; // Stocke les ratings

            let fens: string[] = fen.split("/");

            if (fens.length === 0) return [];

            for (const item of data) {
                if (item.FEN && typeof item.FEN === 'string' && item.PuzzleId) {
                    let count = 0;

                    for (let i = 0; i < fen.length; i++) {
                        if (fen[i] == )
                    }

                    if (count > 0) {
                        matchCount[item.PuzzleId] = count;
                        ratingId[item.PuzzleId] = item.Rating;
                    }
                }
            }

            // Trier par score décroissant et récupérer les 30 meilleurs
            this.puzzlesRecommendedByOpening = Object.keys(matchCount)
                .sort((a, b) => matchCount[b] - matchCount[a])
                .slice(0, 30)
                .map(puzzleId => ({
                    recommendedPoints: matchCount[puzzleId],
                    Rating: ratingId[puzzleId],
                    URL: `https://lichess.org/training/${puzzleId}`
                }));

            console.log("Puzzles trouvés et triés :", this.puzzlesRecommendedByOpening);
        } catch (error) {
            console.error("Erreur lors de la récupération des puzzles hors ligne", error);
        }

        return this.puzzlesRecommendedByOpening;
    }
        */    

    
    sortJsonKeepOpenings(): any[] {
        console.log("Tri des données en gardant les ouvertures");
        let jsonSorted: any[] = [];

        try {
            const data = (puzzlesData as any).default || puzzlesData;

            if (!Array.isArray(data)) {
                throw new Error("Le format des données JSON est invalide.");
            }

            jsonSorted = data.filter(item => item.OpeningTags); // Garde uniquement ceux avec une ouverture

            console.log("Nombre d'éléments triés :", jsonSorted.length);
        } catch (error) {
            console.error("Erreur lors du tri des puzzles", error);
        }

        return jsonSorted;
    }

    // Tri puzzleRecommended en fonction du rang du puzzle
    sortPuzzlesByRating(rank: number): void {
        this.puzzlesRecommendedByOpening = this.puzzlesRecommendedByOpening
            .filter(puzzle => puzzle.Rating >= rank) // Filtre les puzzles au-dessus du rank donné
            .sort((a, b) => a.Rating - b.Rating); // Trie par rating décroissant
    }

    detectThemesFromPGN(pgn: string) {
        const chess = new Chess();
        chess.loadPgn(pgn);
        const themes = new Set(); // Using Set to avoid duplicates
        
        // Get the full history of moves
        const history = chess.history({ verbose: true });
        
        // Reset the board to start analyzing from the beginning
        const analyzeBoard = new Chess();
        
        if (history.length < 20) {
            themes.add('opening');
        } else if (history.length > 20 && history.length < 40) {
            themes.add('middlegame');
        } else {
            themes.add('endgame');
        }

        // Analyze each move
        for (let i = 0; i < history.length; i++) {
            // Make the current move on our analysis board
            analyzeBoard.move(history[i].san);
            
            // For move-specific properties, use the move object itself
            const move = history[i];

            // Now check for themes after this move
            if (analyzeBoard.isCheckmate()) {
                themes.add('mate');
                themes.add(`mateIn${i + 1}`);
            }
            
            if (move.promotion) themes.add('promotion');

            // Check for kingside attack
            const kingSquare = analyzeBoard.board().flat().find(piece => piece?.type === 'k' && piece.color === analyzeBoard.turn());
            if (kingSquare && ['g', 'h'].includes(kingSquare.square[0])) {
                themes.add('kingsideAttack');
            }
        }

        if(this.detectFork(pgn)) {
            themes.add('fork');
        }
        
    return themes;
    }

    private detectFork(pgn: string): boolean {
        const chess = new Chess();
        chess.loadPgn(pgn);
    
        for (const move of chess.history({ verbose: true })) {
            const fenBefore = chess.fen(); // Sauvegarde l'état actuel de la partie
            chess.undo(); // Annule le dernier coup
    
            const attackingSquare = move.to as Square;
            const attacker = chess.get(attackingSquare);
            if (!attacker) {
                chess.load(fenBefore); // Rétablir la position initiale avant de passer au prochain coup
                continue;
            }
    
            let attackedPieces = 0;
    
            // Parcours de l'échiquier pour trouver les pièces adverses attaquées
            chess.board().forEach((row, rank) => {
                row.forEach((piece, file) => {
                    if (!piece || piece.color === attacker.color) return;
    
                    // Conversion en notation PGN et cast explicite en Square
                    const square = `${String.fromCharCode(97 + file)}${8 - rank}` as Square;
                    const moves = chess.moves({ square, verbose: true });
    
                    if (moves.some(m => m.to === attackingSquare)) {
                        attackedPieces++;
                    }
                });
            });
    
            chess.load(fenBefore); // Revenir à l'état original
    
            if (attackedPieces >= 2) {
                return true;
            }
        }
    
        return false;
    }

    // Récupere pour l'ensemble des PGNs du joueur les thèmes les plus fréquents
    async detectMostFrequentThemes(): Promise<void> {
        const data = (gamesData as any).default || gamesData;
        if (!Array.isArray(data)) {
            throw new Error("Le format des données JSON est invalide.");
        }

        const themesCount: { [key: string]: number } = {
            opening: 0,
            middlegame: 0,
            endgame: 0,
            mate: 0,
            kingsideAttack: 0,
            fork: 0
        };

        for (const item of data) {
            for (const game of item.games) {
                
                if ((game.black.username === "titouannnnnn" && game.black.result !== "win") || (game.white.username === "titouannnnnn" && game.white.result !== "win")) { // Assuming '0-1' or '1-0' indicates a loss
                    const gameThemes = this.detectThemesFromPGN(game.pgn);
                    (gameThemes as Set<string>).forEach((theme: string) => {
                        if (themesCount[theme] !== undefined) {
                            themesCount[theme]++;
                        }
                    });
                }
            }
        }

        this.losesPlayerData = themesCount;
    }
}

    /*
    Thèmes généraux

    advantage → L'un des joueurs obtient un avantage matériel ou positionnel.
    crushing → Une position où un camp a un avantage écrasant.
    middlegame → Le puzzle se déroule en milieu de partie.
    opening → Le puzzle provient de l'ouverture.
    endgame → Le puzzle concerne une position de finale.

Thèmes tactiques

    fork → Un coup attaque deux pièces en même temps.
    discoveredAttack → Une pièce se déplace, révélant une attaque d'une autre pièce.
    sacrifice → Un sacrifice de matériel est nécessaire pour gagner.
    trappedPiece → Une pièce adverse est piégée et ne peut pas s'échapper.
    hangingPiece → Une pièce non protégée est capturable.

Thèmes liés aux mats

    mate → Le puzzle se termine par un mat.
    mateIn1 → Mat en un coup.
    mateIn2 → Mat en deux coups.
    bodenMate → Un mat spécifique où deux fous contrôlent la case du roi adverse.
    kingsideAttack → Une attaque est menée sur l’aile roi.

Autres thèmes spécifiques

    oneMove → Le puzzle se résout en un seul coup décisif.
    short → Une solution courte, généralement 1 à 3 coups.
    long → Une séquence tactique plus longue.
    master → Un puzzle issu d'une partie entre joueurs forts.
    masterVsMaster → Le puzzle est tiré d'une partie entre joueurs de haut niveau.
*/
