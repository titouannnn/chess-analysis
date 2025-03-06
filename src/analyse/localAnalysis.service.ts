import { Chess } from 'chess.js';
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Interface pour typer le résultat de l'analyse de chaque coup
interface MoveAnalysis {
  moveNumber: number;
  ply: number;
  playerColor: 'white' | 'black';
  movePlayed: string;
  position: string; // FEN
  evaluation: {
    score?: number;
    type: 'cp' | 'mate';
    formattedScore: string;
  };
  bestMove: string;
  bestMoveForPlayer?: string; // Meilleur coup que le joueur aurait dû jouer
  depth: number;
  delta?: number; // Ajout de la propriété delta optionnelle
  evaluationData?: [any, any, number, number]; // Données d'évaluation pour l'analyse des erreurs
}

interface PositionAnalysisRequest {
  fen: string;
  depth: number;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  activeColor: 'w' | 'b'; // Ajout du joueur actif (white/black)
}

@Injectable({
    providedIn: 'root'
})
export class LocalAnalysis {
    private isBrowser: boolean;
    private engine: Worker | null = null;
    private engineReady = false;
    private analysisQueue: PositionAnalysisRequest[] = [];
    private currentAnalysis: PositionAnalysisRequest | null = null;
    private evaluation: any = null;
    private bestMove: string = '';

    constructor(@Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);
        // Initialiser le worker si on est dans un navigateur
        if (this.isBrowser) {
            this.initEngine();
        }
    }

    private initEngine(): void {
        try {
            this.engine = new Worker('/assets/analysis/stockfish.js');
            
            this.engine.onmessage = (msg: any) => {
                const output = msg.data || msg;
                
                if (output === 'uciok') {
                    this.engineReady = true;
                    this.processNextPositionInQueue();
                }
                
                // Capturer l'évaluation en centipions
                if (typeof output === 'string' && output.includes('score cp')) {
                    const scoreMatch = output.match(/score cp (-?\d+)/);
                    if (scoreMatch) {
                        let score = parseInt(scoreMatch[1]) / 100;
                        
                        // Ajuster le score en fonction du joueur actif
                        if (this.currentAnalysis && this.currentAnalysis.activeColor === 'b') {
                            score = -score; // Inverser le score pour les noirs
                        }
                        
                        this.evaluation = { 
                            score: score,
                            type: 'cp',
                            formattedScore: score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)
                        };
                    }
                }
                
                // Capturer un mat forcé
                if (typeof output === 'string' && output.includes('score mate')) {
                    const mateMatch = output.match(/score mate (-?\d+)/);
                    if (mateMatch) {
                        let moves = parseInt(mateMatch[1]);
                        
                        // Ajuster le nombre de coups pour le mat en fonction du joueur actif
                        if (this.currentAnalysis && this.currentAnalysis.activeColor === 'b') {
                            moves = -moves; // Inverser pour les noirs
                        }
                        
                        this.evaluation = {
                            score: moves,
                            type: 'mate',
                            formattedScore: moves > 0 ? `Mat en ${moves}` : `Mat en ${-moves} contre vous`
                        };
                    }
                }
                
                // Capturer le meilleur coup et terminer l'analyse courante
                if (typeof output === 'string' && output.startsWith('bestmove') && this.currentAnalysis) {
                    const moveMatch = output.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
                    if (moveMatch) {
                        this.bestMove = moveMatch[1];
                    }
                    
                    // Résoudre la promesse de l'analyse courante
                    if (this.currentAnalysis) {
                        this.currentAnalysis.resolve({
                            position: this.currentAnalysis.fen,
                            evaluation: this.evaluation,
                            bestMove: this.bestMove,
                            depth: this.currentAnalysis.depth
                        });
                        
                        // Réinitialiser les données d'analyse
                        this.currentAnalysis = null;
                        this.evaluation = null;
                        this.bestMove = '';
                        
                        // Passer à la position suivante dans la file d'attente
                        this.processNextPositionInQueue();
                    }
                }
            };
            
            // Initialiser le moteur
            this.engine.postMessage('uci');
            
            // Timeout de sécurité au démarrage
            setTimeout(() => {
                if (!this.engineReady && this.engine) {
                    console.error("Le moteur n'a pas répondu dans le délai imparti lors de l'initialisation");
                    this.cleanupEngine();
                    this.initEngine(); // Tentative de réinitialisation
                }
            }, 5000);
            
        } catch (error) {
            console.error("Erreur lors de l'initialisation du moteur:", error);
        }
    }

    private cleanupEngine(): void {
        if (this.engine) {
            this.engine.terminate();
            this.engine = null;
            this.engineReady = false;
        }
    }

    private processNextPositionInQueue(): void {
        // Si déjà en train d'analyser ou file vide, on ne fait rien
        if (this.currentAnalysis || this.analysisQueue.length === 0 || !this.engine || !this.engineReady) {
            return;
        }
        
        // Prendre la position suivante à analyser
        this.currentAnalysis = this.analysisQueue.shift() || null;
        
        if (this.currentAnalysis) {
            try {
                // Envoyer la position et la commande d'analyse
                this.engine.postMessage(`position fen ${this.currentAnalysis.fen}`);
                this.engine.postMessage(`go depth ${this.currentAnalysis.depth}`);
            } catch (error) {
                if (this.currentAnalysis) {
                    this.currentAnalysis.reject(error);
                    this.currentAnalysis = null;
                    this.processNextPositionInQueue();
                }
            }
        }
    }

    /**
     * Fonction principale: Analyse chaque coup d'une partie
     * @param pgn Notation PGN de la partie
     * @param depth Profondeur d'analyse pour Stockfish
     * @returns Un tableau avec l'analyse de chaque coup
     */
    async analyzeGame(pgn: string, depth: number = 15): Promise<MoveAnalysis[]> {
        console.log("Analyse de la partie");
        // Vérifier l'environnement d'exécution
        if (!this.isBrowser) {
            throw new Error("Web Workers ne sont pas disponibles dans cet environnement");
        }

        // S'assurer que le moteur est initialisé
        if (!this.engine) {
            this.initEngine();
        }

        // Extraire les positions et coups
        const { positions, moves } = this.extractPositionsAndMoves(pgn);
        const analyses: MoveAnalysis[] = [];
        
        // On analyse chaque position
        for (let i = 0; i < positions.length; i++) {
            console.log(`Analyse du coup ${i}/${positions.length}`);
            try {
                // Récupérer le joueur actif à partir de la position FEN
                const activeColor = this.getActiveColorFromFEN(positions[i]);
                
                // Pour la position initiale
                if (i === 0) {
                    const initialAnalysis = await this.evaluatePosition(positions[0], depth, activeColor);
                    analyses.push({
                        moveNumber: 0,
                        ply: 0,
                        playerColor: 'white',
                        movePlayed: 'Position initiale',
                        position: positions[0],
                        evaluation: initialAnalysis.evaluation,
                        bestMove: initialAnalysis.bestMove,
                        depth: initialAnalysis.depth
                    });
                } 
                // Pour les coups suivants
                else {
                    const moveNumber = Math.floor((i - 1) / 2) + 1;
                    const playerColor = i % 2 === 1 ? 'white' : 'black';
                    
                    const analysis = await this.evaluatePosition(positions[i], depth, activeColor);
                    
                    analyses.push({
                        moveNumber: moveNumber,
                        ply: i,
                        playerColor: playerColor,
                        movePlayed: moves[i - 1],
                        position: positions[i],
                        evaluation: analysis.evaluation,
                        bestMove: analysis.bestMove,
                        depth: analysis.depth
                    });
                }
            } catch (error) {
                console.error(`Erreur lors de l'analyse du coup ${i}:`, error);
            }
        }
        
        console.log("Analyse terminée: ", analyses);
        console.log("Deltas calculés : ", this.ErrorAnalysis(analyses));
        return analyses;
    }
    
    /**
     * Évalue une position avec Stockfish
     */
    private evaluatePosition(fen: string, depth: number, activeColor: 'w' | 'b' = 'w'): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.isBrowser) {
                reject(new Error("Web Workers ne sont pas disponibles dans cet environnement"));
                return;
            }
            
            if (!this.engine) {
                this.initEngine();
            }
            
            // Ajouter la demande d'analyse à la file d'attente
            this.analysisQueue.push({
                fen,
                depth,
                activeColor, // Inclure l'information sur le joueur actif
                resolve,
                reject
            });
            
            // Démarrer le traitement si aucune analyse n'est en cours
            if (!this.currentAnalysis) {
                this.processNextPositionInQueue();
            }
        });
    }

    /**
     * Extrait le joueur actif (blanc/noir) à partir d'une position FEN
     */
    private getActiveColorFromFEN(fen: string): 'w' | 'b' {
        const parts = fen.split(' ');
        return (parts.length > 1 ? parts[1] : 'w') as 'w' | 'b';
    }
    
    /**
     * Extrait les positions et coups à partir d'un PGN
     */
    private extractPositionsAndMoves(pgn: string): { positions: string[], moves: string[] } {
        const chess = new Chess();
        
        try {
            chess.loadPgn(pgn);
        } catch (error) {
            throw new Error('PGN invalide');
        }
        
        // Récupérer les coups en notation SAN
        const moves = chess.history();
        
        // Reconstruire les positions
        chess.reset();
        const positions: string[] = [chess.fen()]; // Position initiale
        
        for (const move of moves) {
            chess.move(move);
            positions.push(chess.fen());
        }
        
        return { positions, moves };
    }


        
        /**
         * Calcule la différence de score entre chaque coup et le précédent
         * pour identifier les erreurs et les classer par ordre d'importance.
         * Compare le coup joué avec le meilleur coup possible pour le même joueur.
         */
        public ErrorAnalysis(moves: MoveAnalysis[]): MoveAnalysis[] {
            if (!moves || moves.length <= 1) {
                return moves;
            }

            // Créer une copie des mouvements pour préserver l'original
            const analyzedMoves = [...moves];

            // On commence à 1 car le coup 0 est la position initiale
            for (let i = 1; i < analyzedMoves.length - 1; i++) {
                const previousMove = analyzedMoves[i - 1];
                const currentMove = analyzedMoves[i];
                const nextMove = analyzedMoves[i + 1]; // Le coup suivant contient le meilleur coup pour le joueur actuel

                // Conversion des évaluations en scores numériques pour comparaison
                const previousScore = this.getNumericScore(previousMove.evaluation);
                const currentScore = this.getNumericScore(currentMove.evaluation);
                const rawDifference = currentScore - previousScore;

                // Déterminer qui a joué le coup actuel
                const isWhiteTurn = currentMove.playerColor === 'white';

                let delta = 0;

                // Si un score est extrême et l'autre proche de 0, delta = 0
                if (
                    (Math.abs(previousScore) >= 50 && Math.abs(currentScore) < 5) ||
                    (Math.abs(currentScore) >= 50 && Math.abs(previousScore) < 5)
                ) {
                    delta = 0;
                    console.log("Score extrême détecté, delta mis à 0");
                } else {
                    const weight = this.getDeltaWeight(previousScore, currentScore);
                    const rawDiff = currentScore - previousScore;
                    // Pour les blancs, une diminution du score est une erreur, pour les noirs c'est une augmentation
                    const isError = (isWhiteTurn && rawDiff < 0) || (!isWhiteTurn && rawDiff > 0);

                    // Attribuer le delta uniquement si c'est une erreur
                    if (isError) {
                        delta = weight; // On utilise ici le poids calculé
                        
                        // Attribution du meilleur coup que le joueur AURAIT DÛ jouer
                        // C'est le bestMove de previousMove (position AVANT que le joueur ne joue)
                        currentMove.bestMoveForPlayer = previousMove.bestMove;
                    } else {
                        delta = 0; // Ce n'est pas une erreur mais une amélioration
                    }
                }
                
                // Attribution du delta calculé au coup actuel
                currentMove.delta = delta;
                
                // Stocker les données d'évaluation pour l'interface
                currentMove.evaluationData = [
                    previousMove.evaluation,  // évaluation avant le coup
                    currentMove.evaluation,   // évaluation après le coup
                    rawDifference,            // différence brute
                    delta                     // différence pondérée
                ];
                
                console.log(`Coup: ${currentMove.moveNumber}${currentMove.playerColor === 'white' ? '.' : '...'} ${currentMove.movePlayed}, Score précédent: ${previousScore}, Score actuel: ${currentScore}, Delta: ${delta}`);
                
                // Si c'est une erreur, afficher le coup joué et le meilleur coup
                if (delta > 0) {
                    console.log(`Erreur! ${currentMove.playerColor === 'white' ? 'Blanc' : 'Noir'} a joué ${currentMove.movePlayed}, mais aurait dû jouer ${currentMove.bestMoveForPlayer || previousMove.bestMove}`);
                }
            }

            // Le premier coup n'a pas de coup précédent à comparer
            analyzedMoves[0].delta = 0;
            analyzedMoves[0].evaluationData = [null, analyzedMoves[0].evaluation, 0, 0];

            // Le dernier coup n'est pas évalué correctement car pas de coup suivant
            analyzedMoves[analyzedMoves.length - 1].delta = 0;
            analyzedMoves[analyzedMoves.length - 1].evaluationData = [
                analyzedMoves[analyzedMoves.length - 2].evaluation,
                analyzedMoves[analyzedMoves.length - 1].evaluation,
                this.getNumericScore(analyzedMoves[analyzedMoves.length - 1].evaluation) -
                this.getNumericScore(analyzedMoves[analyzedMoves.length - 2].evaluation),
                0
            ];

            // Trier les coups par delta décroissant (les erreurs les plus importantes en premier)
            return analyzedMoves.sort((a, b) => (b.delta || 0) - (a.delta || 0));
        }
        
        // Helper method to convert any evaluation type to a numeric score
        private getNumericScore(evaluation: any): number {
            if (!evaluation) return 0;
        
            if (evaluation.type === 'cp') {
            return evaluation.score || 0;
            } else if (evaluation.type === 'mate') {
            // Convertir les scores de mat en valeurs élevées/faibles
            const mateScore = evaluation.score || 0;
            return mateScore > 0 ? 100 : mateScore < 0 ? -100 : 0;
            }
        
            return 0;
        }
        
        private getDeltaWeight(previousScore: number, currentScore: number): number {
            const alpha = 0.5;
            const scoreDifference = Math.abs(previousScore - currentScore);
            const avgAbsScore = (Math.abs(previousScore) + Math.abs(currentScore)) / 2;
            
            return scoreDifference / (1 + alpha * avgAbsScore);
        }
        
        /**
         * Calcule le delta pondéré selon la formule :
         * Δ′(s1,s2)=|s1-s2| * (1 - tanh(β * max(|s1|,|s2|)))
         * Ceci réduit l'importance des erreurs lorsque les scores sont extrêmes.
         */
        private calculateDeltaPrime(s1: number, s2: number): number {
            const beta = 0.2;
            const scoreDifference = Math.abs(s1 - s2);
            const maxAbsScore = Math.max(Math.abs(s1), Math.abs(s2));
            return scoreDifference * (1 - Math.tanh(beta * maxAbsScore));
        }

    // Nettoyage quand le service est détruit
    ngOnDestroy() {
        this.cleanupEngine();
    }
}