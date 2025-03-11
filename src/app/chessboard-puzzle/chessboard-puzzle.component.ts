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

@Component({
  selector: 'app-chessboard-puzzle',
  imports: [CommonModule, ChessboardComponent],
  templateUrl: './chessboard-puzzle.component.html',
  styleUrl: './chessboard-puzzle.component.css'
})
export class ChessboardPuzzleComponent implements OnInit {
  @ViewChild('chessboard') chessboard!: ChessboardComponent;

  puzzles: Puzzle[] = [];
  currentPuzzle: Puzzle | null = null;
  currentFen: string = '';
  moveSequence: string[] = [];
  currentMoveIndex: number = 0;
  puzzleComplete: boolean = false;
  puzzleError: boolean = false;
  errorMessage: string = '';
  puzzleRating: number = 0;
  puzzleThemes: string = '';

  private chess = new Chess();

  constructor() {}

  ngOnInit(): void {
    this.loadPuzzles();
  }

  loadPuzzles(): void {
    this.puzzles = (puzzlesData as Puzzle[]).slice(0, 10);
    for (let item of this.puzzles) {
      console.log(item);
    }
    this.loadRandomPuzzle();
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

    // Set up the puzzle
    this.currentFen = this.currentPuzzle.FEN;
    this.moveSequence = this.currentPuzzle.Moves.split(' ');
    this.puzzleRating = this.currentPuzzle.Rating;
    this.puzzleThemes = this.currentPuzzle.Themes;

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

  onBoardMove(move: any): void {
    const moveString = `${move.from}${move.to}`;
    const expectedMove = this.moveSequence[this.currentMoveIndex];

    if (moveString === expectedMove) {
      // Correct move
      this.currentMoveIndex++;
      
      // If there are more moves in the sequence, make the opponent's move
      if (this.currentMoveIndex < this.moveSequence.length) {
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
    if (this.currentMoveIndex < this.moveSequence.length) {
      const opponentMove = this.moveSequence[this.currentMoveIndex];
      
      // Make the move on the chessboard
      const from = opponentMove.substring(0, 2);
      const to = opponentMove.substring(2, 4);
      
      this.chessboard.makeMove(from + to);
      
      // Increment move index
      this.currentMoveIndex++;
    }
  }

  getCurrentPosition(): string {
    // Reset chess engine
    this.chess.load(this.currentPuzzle!.FEN);
    
    // Apply moves up to the current index (excluding player's incorrect move)
    for (let i = 0; i < this.currentMoveIndex; i++) {
      const move = this.moveSequence[i];
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      
      this.chess.move({
        from: from,
        to: to,
        promotion: 'q' // Default to queen for simplicity
      });
    }
    
    return this.chess.fen();
  }

  loadNextPuzzle(): void {
    this.loadRandomPuzzle();
  }
}