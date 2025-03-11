import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChessboardComponent } from '../chessboard/chessboard.component';
import { Chess } from 'chess.js';
import * as puzzlesData from '../../assets/lichess_db_puzzle_reduit.json';

interface Puzzle {
  PuzzleId: string;
  FEN: string;
  Moves: string;
  Rating: number;
  Themes: string;
  OpeningTags?: string;
}

interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
}

@Component({
  selector: 'app-chessboard-puzzle',
  standalone: true,
  imports: [CommonModule, ChessboardComponent],
  templateUrl: './chessboard-puzzle.component.html',
  styleUrl: './chessboard-puzzle.component.css'
})
export class ChessboardPuzzleComponent implements OnInit, AfterViewInit {
  @ViewChild('chessboard') chessboard!: ChessboardComponent;

  puzzles: Puzzle[] = [];
  currentPuzzle: Puzzle | null = null;
  currentFen: string = '';
  playerMoves: ChessMove[] = [];
  opponentMoves: ChessMove[] = [];
  allMoves: ChessMove[] = [];
  currentMoveIndex: number = 0;
  puzzleComplete: boolean = false;
  puzzleError: boolean = false;
  errorMessage: string = '';
  puzzleRating: number = 0;
  puzzleThemes: string = '';
  isPlayerTurn: boolean = true;
  private isResetting: boolean = false;
  private isProcessingEvent: boolean = false;

  private chess = new Chess();

  constructor() {}

  ngOnInit(): void {
    this.loadPuzzles();
  }

  ngAfterViewInit(): void {
    if (this.chessboard) {
      console.log('Chessboard component initialized');
      
      // On écoute les événements moveHistoryChanged qui nous donnent les mouvements effectués
      this.chessboard.moveHistoryChanged.subscribe((moves: any[]) => {
        if (this.isResetting || this.isProcessingEvent) return;
        
        console.log('Move history changed:', moves);
        if (moves && moves.length > 0) {
          const lastMove = moves[moves.length - 1];
          this.handlePlayerMove(lastMove);
        }
      });
    }
  }

  loadPuzzles(): void {
    try {
      const data = (puzzlesData as any).default || puzzlesData;
      if (!Array.isArray(data)) {
        this.errorMessage = "Format JSON invalide";
        return;
      }
      
      this.puzzles = data.filter(item => 
        item.PuzzleId && item.FEN && item.Moves && 
        typeof item.Moves === 'string' && item.Moves.length >= 4
      ).map((item: any) => ({
        PuzzleId: item.PuzzleId,
        FEN: item.FEN,
        Moves: item.Moves,
        Rating: item.Rating,
        Themes: item.Themes,
        OpeningTags: item.OpeningTags
      }));
      
      console.log(`Loaded ${this.puzzles.length} puzzles`);
      
      if (this.puzzles.length > 0) {
        this.loadRandomPuzzle();
      } else {
        this.errorMessage = "Aucun puzzle disponible";
      }
    } catch (error) {
      console.error("Erreur lors du chargement des puzzles:", error);
      this.errorMessage = "Échec du chargement des puzzles";
    }
  }

  loadRandomPuzzle(): void {
    if (this.puzzles.length === 0) {
      this.errorMessage = 'Aucun puzzle disponible.';
      return;
    }

    const randomIndex = Math.floor(Math.random() * this.puzzles.length);
    this.currentPuzzle = this.puzzles[randomIndex];
    this.setupPuzzle();
  }

  setupPuzzle(): void {
    if (!this.currentPuzzle) return;

    // Reset state
    this.puzzleComplete = false;
    this.puzzleError = false;
    this.errorMessage = '';
    this.currentMoveIndex = 0;
    this.isPlayerTurn = true;
    this.isResetting = false;
    this.isProcessingEvent = false;
    
    // Setup puzzle
    this.currentFen = this.currentPuzzle.FEN;
    this.puzzleRating = this.currentPuzzle.Rating;
    this.puzzleThemes = this.currentPuzzle.Themes;
    
    // Parse moves correctly
    this.parseMoves();

    // Initialize chess engine
    this.chess.load(this.currentFen);

    // Reset chessboard component
    if (this.chessboard) {
      setTimeout(() => {
        this.chessboard.resetBoard();
        this.chessboard.fen = this.currentFen;
      }, 100);
    }
  }

  parseMoves(): void {
    if (!this.currentPuzzle || !this.currentPuzzle.Moves) return;
    
    const movesStr = this.currentPuzzle.Moves;
    this.playerMoves = [];
    this.opponentMoves = [];
    this.allMoves = [];
    
    console.log('Parsing moves string:', movesStr);
    const movesList = movesStr.split(' ');
    
    // Process each move
    movesList.forEach((move, index) => {
      if (move.length >= 4) {
        const chessMove: ChessMove = {
          from: move.substring(0, 2),
          to: move.substring(2, 4),
          promotion: move.length > 4 ? move.substring(4, 5) : undefined
        };
        
        // Even indices are player moves, odd indices are opponent moves
        if (index % 2 === 0) {
          this.playerMoves.push(chessMove);
        } else {
          this.opponentMoves.push(chessMove);
        }
        
        this.allMoves.push(chessMove);
      }
    });
    
    console.log('Player moves:', this.playerMoves);
    console.log('Opponent moves:', this.opponentMoves);
    console.log('All moves:', this.allMoves);
  }

  handlePlayerMove(move: any): void {
    if (!this.isPlayerTurn || this.isResetting || this.isProcessingEvent) {
      console.log('Move ignored: not player turn or resetting');
      return;
    }
    
    this.isProcessingEvent = true;
    
    const expectedMoveIndex = Math.floor(this.currentMoveIndex / 2);
    console.log('Expected move index:', expectedMoveIndex, 'Current index:', this.currentMoveIndex);
    
    if (!this.playerMoves || expectedMoveIndex >= this.playerMoves.length) {
      console.error('No expected move found at index', expectedMoveIndex);
      this.isProcessingEvent = false;
      return;
    }
    
    const expectedMove = this.playerMoves[expectedMoveIndex];
    const moveFrom = move.from || "";
    const moveTo = move.to || "";
    
    console.log(`Player move: ${moveFrom}${moveTo}, Expected: ${expectedMove.from}${expectedMove.to}`);
    
    // Calculate expected FEN after the expected move
    const tempChess = new Chess(this.chess.fen());
    tempChess.move({
      from: expectedMove.from,
      to: expectedMove.to,
      promotion: expectedMove.promotion || 'q'
    });
    const expectedFEN = tempChess.fen();
    
    // Make the actual move on another temp chess instance
    const actualChess = new Chess(this.chess.fen());
    try {
      actualChess.move({
        from: moveFrom,
        to: moveTo,
        promotion: move.promotion || 'q'
      });
      const actualFEN = actualChess.fen();
      
      // Compare the FENs (ignoring move counters which might differ)
      const expectedFENParts = expectedFEN.split(' ');
      const actualFENParts = actualFEN.split(' ');
      
      // Compare only the piece positions, active color, and castling rights
      const isCorrectMove = (
        expectedFENParts[0] === actualFENParts[0] &&
        expectedFENParts[1] === actualFENParts[1] &&
        expectedFENParts[2] === actualFENParts[2]
      );
      
      if (isCorrectMove) {
        // Correct move
        console.log('Correct move!');
        this.chess.move({from: moveFrom, to: moveTo, promotion: move.promotion || 'q'});
        this.currentMoveIndex++;
        this.isPlayerTurn = false;
        
        // If there are more moves in the sequence, make the opponent's move
        if (this.currentMoveIndex < this.allMoves.length) {
          setTimeout(() => {
            this.makeNextOpponentMove();
          }, 500);
        } else {
          // Puzzle completed
          this.puzzleComplete = true;
        }
      } else {
        // Incorrect move, revert to the previous position
        console.log('Incorrect move! Expected FEN:', expectedFEN, 'Actual FEN:', actualFEN);
        this.puzzleError = true;
        this.revertToCurrentPosition();
        
        setTimeout(() => {
          this.puzzleError = false;
        }, 1000);
      }
    } catch (e) {
      // Invalid move
      console.error('Invalid move:', e);
      this.puzzleError = true;
      this.revertToCurrentPosition();
      
      setTimeout(() => {
        this.puzzleError = false;
      }, 1000);
    }
    
    setTimeout(() => {
      this.isProcessingEvent = false;
    }, 200);
  }

  revertToCurrentPosition(): void {
    this.isResetting = true;
    console.log('Reverting to current position');
    
    // Reset to the current position based on the moves made so far
    this.chess.load(this.currentPuzzle!.FEN);
    
    // Replay moves up to the current index
    for (let i = 0; i < this.currentMoveIndex; i++) {
      const move = this.allMoves[i];
      this.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });
    }
    
    const currentPosition = this.chess.fen();
    
    // Apply the position to the chessboard
    if (this.chessboard) {
      // First reset the board to clear all pieces
      this.chessboard.resetBoard();
      
      // Then set the new position
      setTimeout(() => {
        this.chessboard.fen = currentPosition;
        
        setTimeout(() => {
          this.isResetting = false;
        }, 200);
      }, 50);
    } else {
      this.isResetting = false;
    }
  }

  makeNextOpponentMove(): void {
    this.isResetting = true;
    
    const opponentMoveIndex = Math.floor(this.currentMoveIndex / 2);
    console.log('Making opponent move:', opponentMoveIndex);
    
    if (opponentMoveIndex < this.opponentMoves.length) {
      const opponentMove = this.opponentMoves[opponentMoveIndex];
      console.log('Opponent move:', opponentMove);
      
      // Update internal chess engine state
      this.chess.move({
        from: opponentMove.from,
        to: opponentMove.to,
        promotion: opponentMove.promotion || 'q'
      });
      
      // Get the updated FEN
      this.currentFen = this.chess.fen();
      
      // Update the chessboard - IMPORTANT: Use a complete reset + set FEN approach
      if (this.chessboard) {
        this.chessboard.resetBoard();
        
        setTimeout(() => {
          // Set the new FEN
          this.chessboard.fen = this.currentFen;
          
          // Increment move index and set back to player's turn
          this.currentMoveIndex++;
          this.isPlayerTurn = true;
          
          setTimeout(() => {
            this.isResetting = false;
          }, 200);
        }, 50);
      }
    } else {
      this.isResetting = false;
    }
  }

  loadNextPuzzle(): void {
    this.loadRandomPuzzle();
  }
}