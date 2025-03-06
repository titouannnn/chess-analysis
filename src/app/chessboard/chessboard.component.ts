import { Component, AfterViewInit, ElementRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Chess, Square } from 'chess.js'; // Importez le type Square
import { Chessground } from 'chessground';
import { Key } from 'chessground/types';

@Component({
  selector: 'app-chessboard',
  templateUrl: './chessboard.component.html',
  styleUrls: ['./chessboard.component.css']
})
export class ChessboardComponent implements AfterViewInit, OnChanges {
  @ViewChild('board', { static: true }) boardElement: ElementRef | undefined;
  @Input() fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  chess: Chess;
  chessground: any;

  constructor() {
    this.chess = new Chess();
  }

  ngAfterViewInit() {
    if (this.boardElement) {
      try {
        this.chess.load(this.fen);
        this.initChessground();
      } catch (error) {
        console.error('Error initializing Chessground:', error);
      }
    } else {
      console.error('Board element not found!');
    }
  }

  // Fonction pour générer les mouvements légaux
  getLegalMoves() {
    const dests = new Map();
    const squares = [
      'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
      'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
      'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
      'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
      'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
      'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
      'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
      'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'
    ];
    
    for (const s of squares) {
      // Conversion en type Square
      const square = s as Square;
      const piece = this.chess.get(square);
      if (piece && piece.color === this.chess.turn()) {
        const moves = this.chess.moves({ 
          square: square,
          verbose: true 
        });
        if (moves.length > 0) {
          dests.set(s, moves.map(move => move.to));
        }
      }
    }
    return dests;
  }

  // Fonction appelée après un mouvement
  onMove(orig: string, dest: string) {
    const move = this.chess.move({ 
      from: orig as Square, 
      to: dest as Square, 
      promotion: 'q' 
    });
    if (move) {
      this.chessground.set({
        fen: this.chess.fen(),
        turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
        movable: {
          color: 'both',
          dests: this.getLegalMoves()
        },
        lastMove: [orig, dest]
      });
    }
  }

  initChessground() {
    // Calculer les destinations légales
    const dests = this.getLegalMoves();
    
    // Configuration complète de l'échiquier
    this.chessground = Chessground(this.boardElement!.nativeElement, {
      fen: this.fen,
      orientation: 'white',
      turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
      lastMove: undefined,
      coordinates: true,
      coordinatesOnSquares: false,
      autoCastle: true,
      viewOnly: false,
      disableContextMenu: true,
      highlight: {
        lastMove: true,
        check: true,
      },
      animation: {
        enabled: true,
        duration: 200,
      },
      movable: {
        free: false,
        color: 'both',
        dests: dests,
        showDests: true,
        rookCastle: true,
        events: {
          after: (orig, dest) => this.onMove(orig, dest)
        }
      },
      premovable: {
        enabled: true,
        showDests: true,
        castle: true,
        events: {
          set: (orig, dest) => console.log('Premove set', orig, dest),
          unset: () => console.log('Premove unset')
        }
      },
      draggable: {
        enabled: true,
        distance: 3,
        autoDistance: true, 
        showGhost: true,
        deleteOnDropOff: false
      },
      selectable: {
        enabled: true
      },
      events: {
        change: () => console.log('Board position changed'),
        move: (orig, dest, capturedPiece) => {
          console.log('Move', orig, dest, capturedPiece);
        },
        select: (key) => console.log('Square selected', key)
      },
      drawable: {
        enabled: true,
        visible: true,
        defaultSnapToValidMove: true,
        eraseOnClick: true,
        shapes: [],
        autoShapes: [],
        brushes: {
          green: { key: 'g', color: '#15781B', opacity: 1, lineWidth: 10 },
          red: { key: 'r', color: '#882020', opacity: 1, lineWidth: 10 },
          blue: { key: 'b', color: '#003088', opacity: 1, lineWidth: 10 },
          yellow: { key: 'y', color: '#e68f00', opacity: 1, lineWidth: 10 }
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fen'] && this.chessground) {
      try {
        this.chess.load(this.fen);
        const dests = this.getLegalMoves();
        
        this.chessground.set({
          fen: this.fen,
          turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
          movable: {
            color: 'both',
            dests: dests
          },
        });
      } catch (error) {
        console.error('Invalid FEN position:', error);
      }
    }
  }

  makeMove(move: string) {
    const result = this.chess.move(move);
    if (result) {
      const dests = this.getLegalMoves();
      
      this.chessground.set({
        fen: this.chess.fen(),
        turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
        movable: {
          color: 'both',
          dests: dests
        },
        lastMove: [result.from, result.to],
      });
      
      return true;
    }
    return false;
  }
  
  resetBoard() {
    this.chess.reset();
    const dests = this.getLegalMoves();
    
    this.chessground.set({
      fen: this.chess.fen(),
      turnColor: 'white',
      movable: {
        color: 'both',
        dests: dests
      },
      check: false,
      lastMove: undefined
    });
  }

  // Retourne le FEN actuel
  getFen(): string {
    return this.chess.fen();
  }

  // Retourne la liste des coups joués en notation PGN
  getPgn(): string {
    return this.chess.pgn();
  }
}