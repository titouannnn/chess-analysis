import { Component, OnInit, ViewChild } from '@angular/core';
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
}

@Component({
  selector: 'app-chessboard-puzzle',
  standalone: true,
  imports: [CommonModule, ChessboardComponent],
  templateUrl: './chessboard-puzzle.component.html',
  styleUrl: './chessboard-puzzle.component.css'
})
export class ChessboardPuzzleComponent implements OnInit {
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

  private chess = new Chess();

  constructor() {}

  ngOnInit(): void {
    this.loadPuzzles();
  }

  loadPuzzles(): void {
    try {
      const data = (puzzlesData as any).default || puzzlesData;
      if (!Array.isArray(data)) {
        this.errorMessage = "Invalid JSON data format";
        return;
      }
      
      // Take the first 100 puzzles as sample
      this.puzzles = data.slice(0, 10).filter(item => 
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
      
      // Load the first puzzle once data is ready
      if (this.puzzles.length > 0) {
        this.loadRandomPuzzle();
      } else {
        this.errorMessage = "No puzzles available";
      }
    } catch (error) {
      console.error("Error loading puzzles:", error);
      this.errorMessage = "Failed to load puzzles";
    }
  }

  loadRandomPuzzle(): void {
    if (this.puzzles.length === 0) {
      this.errorMessage = 'No puzzles available.';
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

    // Set up the puzzle
    this.currentFen = this.currentPuzzle.FEN;
    this.puzzleRating = this.currentPuzzle.Rating;
    this.puzzleThemes = this.currentPuzzle.Themes;
    
    // Parse moves correctly
    this.parseMoves();

    // Initialize the chess engine with the puzzle position
    this.chess.load(this.currentFen);

    // If the ChessboardComponent is already initialized, reset it
    if (this.chessboard) {
      setTimeout(() => {
        this.chessboard.resetBoard();
        this.chessboard.fen = this.currentFen;
      });
    }
  }

  parseMoves(): void {
    if (!this.currentPuzzle || !this.currentPuzzle.Moves) {
      return;
    }
    
    const movesStr = this.currentPuzzle.Moves;
    this.playerMoves = [];
    this.opponentMoves = [];
    this.allMoves = [];
    
    // Split moves into chunks of 4 characters (fromTo format)
    const movesList = movesStr.match(/.{1,4}/g) || [];
    
    // Process each move
    movesList.forEach((move, index) => {
      if (move.length === 4) {
        const chessMove = {
          from: move.substring(0, 2),
          to: move.substring(2, 4)
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
  }

  onBoardMove(move: any): void {
    if (!this.isPlayerTurn) return;
    
    const expectedMove = this.playerMoves[Math.floor(this.currentMoveIndex / 2)];
    
    if (move.from === expectedMove.from && move.to === expectedMove.to) {
      // Correct move
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
      this.puzzleError = true;
      setTimeout(() => {
        // Reset board to the current puzzle position
        this.chessboard.resetBoard();
        this.chessboard.fen = this.getCurrentPosition();
        this.puzzleError = false;
      }, 300);
    }
  }

  makeNextOpponentMove(): void {
  const opponentMoveIndex = Math.floor(this.currentMoveIndex / 2);
  
  if (opponentMoveIndex < this.opponentMoves.length) {
    const opponentMove = this.opponentMoves[opponentMoveIndex];
    
    // Convert the move object to a string format that makeMove() accepts
    const moveString = `${opponentMove.from}${opponentMove.to}`;
    
    // Make the move on the chessboard using string notation
    this.chessboard.makeMove(moveString);
    
    // Increment move index and set back to player's turn
    this.currentMoveIndex++;
    this.isPlayerTurn = true;
  }
}

  getCurrentPosition(): string {
    // Reset chess engine
    this.chess.load(this.currentPuzzle!.FEN);
    
    // Apply moves up to the current index (excluding player's incorrect move)
    for (let i = 0; i < this.currentMoveIndex; i++) {
      const move = this.allMoves[i];
      
      this.chess.move({
        from: move.from,
        to: move.to,
        promotion: 'q' // Default to queen for simplicity
      });
    }
    
    return this.chess.fen();
  }

  loadNextPuzzle(): void {
    this.loadRandomPuzzle();
  }
}