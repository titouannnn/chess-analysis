import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Chess, Square } from "chess.js";
import { Chessground } from "chessground";
import { Key } from "chessground/types";
import { LocalAnalysis } from "../../analyse/localAnalysis.service"; // Import du service d'analyse

// Interfaces pour le système de variantes
interface MoveNode {
  move: any; // Le coup Chess.js
  fen: string; // Position après ce coup
  san: string; // Notation algébrique standard
  variations: MoveTree[]; // Variantes à partir de ce coup
  parent: MoveNode | null; // Référence au nœud parent
  isMainline: boolean; // Si ce coup fait partie de la ligne principale
}

interface FormattedMove {
  white: string;
  black: string;
  path?: number[];
  isVariation?: boolean;
  isActiveVariation?: boolean;
  depth?: number;
  moveNumber?: number;
  isBlackContinuation?: boolean;
  isVariationStart?: boolean;
  isVariationEnd?: boolean;
  parentPath?: number[];

  // Évaluations séparées pour blanc et noir
  whiteEvaluation?: string;
  whitePrecision?: number;
  whiteBestMove?: string;
  whiteDelta?: number;

  blackEvaluation?: string;
  blackPrecision?: number;
  blackBestMove?: string;
  blackDelta?: number;
}

interface GroupedMove {
  moveNumber: number;
  white?: string;
  black?: string;
  whitePath?: number[];
  blackPath?: number[];
  whiteEvaluation?: string;
  whitePrecision?: number;
  blackEvaluation?: string;
  blackPrecision?: number;
}

interface DisplayMove {
  white: string;
  black: string;
  moveNumber: number;
  whiteNodePath?: number[];
  blackNodePath?: number[];
  isMainline: boolean;
  depth: number;
  variations: DisplayMove[][]; // Les variantes associées à ce coup
  isBlackContinuation?: boolean;
}

interface MoveTree {
  nodes: MoveNode[]; // Liste des coups dans cette variante
  parentNode: MoveNode | null; // Nœud à partir duquel cette variante démarre
}

@Component({
  selector: "app-chessboard",
  templateUrl: "./chessboard.component.html",
  styleUrls: ["./chessboard.component.css"],
  imports: [CommonModule],
  standalone: true,
})
export class ChessboardComponent implements AfterViewInit, OnChanges {
  @ViewChild("board", { static: true }) boardElement: ElementRef | undefined;
  @Input() fen: string =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  @Output() positionChanged = new EventEmitter<string>();
  @Output() moveHistoryChanged = new EventEmitter<any[]>();

  chess: Chess;
  chessground: any;

  // Structure pour l'historique et les variantes
  mainline: MoveTree = { nodes: [], parentNode: null };
  currentNode: MoveNode | null = null;

  currentPrecision: number | undefined = undefined;

  // Propriétés pour l'historique des positions (conservées pour compatibilité)
  history: string[] = [];
  moves: any[] = [];
  currentMoveIndex: number = -1;
  isReviewing: boolean = false;

  formattedMoves: FormattedMove[] = [];

  // Nouvelles propriétés pour les variantes
  currentVariation: MoveTree;

  isAnalyzing: boolean = false;
  analysisResults: any[] = [];
  hasPgn: boolean = false;
  analysisProgress: number = 0;
  analysisProgressText: string = "";

  // pour rejouer les erreurs :
  isReplayingMistakes: boolean = false;
  mistakeThreshold: number = 1;
  mistakesList: {
    index: number;
    path: number[];
    color: "white" | "black";
    delta: number;
    originalMove?: any; // Pour stocker le coup original
    moveNumber?: number; // Pour stocker le numéro du coup
  }[] = [];
  currentMistakeIndex: number = -1;
  mistakeCorrectMove: string | null = null; // Stocke le coup correct à jouer
  replayMistakesColor: "both" | "white" | "black" = "both";


  // Propriétés pour le feedback visuel
  showFeedback: boolean = false;
  feedbackClass: string = "";
  feedbackMessage: string = "";

  private moveEvaluations: Map<
    string,
    {
      evaluation?: string;
      bestMove?: string;
      delta?: number;
      precision?: number;
    }
  > = new Map();

  constructor(private localAnalysis: LocalAnalysis) {
    // Modifier le constructeur
    this.chess = new Chess();
    this.currentVariation = this.mainline;
  }

  currentEvaluation: string = "0,00";
  activeMovePath: number[] | undefined;
  activeColor: "white" | "black" | undefined;

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ignorer les événements si une zone de texte est active
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        this.goToPreviousMove();
        event.preventDefault();
        break;
      case "ArrowRight":
        this.goToNextMove();
        event.preventDefault();
        break;
      case "ArrowUp":
        this.goToStart();
        event.preventDefault();
        break;
      case "ArrowDown":
        this.goToEnd();
        event.preventDefault();
        break;
    }
  }

  defaultPgn = `1. e3 d5 2. Ne2 Nc6 3. Ng3 e5 4. Be2 Nf6 5. O-O Bd6 6. Bd3 e4 7. Bb5 Bd7 8. Nh5
  O-O 9. Nxf6+ Qxf6 10. Nc3 Qh6 11. g3 Bh3 12. Re1 Qg5 13. Ne2 h5 14. Nf4 Bxf4 15.
  exf4 Qg6 16. Bxc6 bxc6 17. d4 h4 18. Be3 hxg3 19. fxg3 Bg4 20. Qd2 Bf3 21. b4 f5
  22. c3 Kf7 23. a4 Rh8 24. Kf1 Rh6 25. Bg1 Rah8 26. c4 e3 27. Rxe3 Be4 28. cxd5
  cxd5 29. b5 Qf6 30. Qc3 Rc8 31. a5 Qe6 32. b6 axb6 33. axb6 c6 34. b7 Rb8 35.
  Ra7 Qd7 36. Qb4 Rhh8 37. Rb3 g5 38. fxg5 f4 39. Ra8 Qh3+ 40. Kf2 Qg2+ 41. Ke1
  Qxg1+ 42. Kd2 Rxh2+ 43. Kc3 Qe1# 0-1`;

  initChessground() {
    // Calculer les destinations légales
    const dests = this.getLegalMoves();

    // Configuration complète de l'échiquier
    this.chessground = Chessground(this.boardElement!.nativeElement, {
      fen: this.fen,
      orientation: "white",
      turnColor: this.chess.turn() === "w" ? "white" : "black",
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
        color: "both",
        dests: dests,
        showDests: true,
        rookCastle: true,
        events: {
          after: (orig, dest) => this.onMove(orig, dest),
        },
      },
      premovable: {
        enabled: true,
        showDests: true,
        castle: true,
        events: {
          set: (orig, dest) => console.log("Premove set", orig, dest),
          unset: () => console.log("Premove unset"),
        },
      },
      draggable: {
        enabled: true,
        distance: 3,
        autoDistance: true,
        showGhost: true,
        deleteOnDropOff: false,
      },
      selectable: {
        enabled: true,
      },
      events: {
        change: () => console.log("Board position changed"),
        move: (orig, dest, capturedPiece) => {
          console.log("Move", orig, dest, capturedPiece);
        },
        select: (key) => console.log("Square selected", key),
      },
      drawable: {
        enabled: true,
        visible: true,
        defaultSnapToValidMove: true,
        eraseOnClick: true,
        shapes: [],
        autoShapes: [],
        brushes: {
          green: { key: "g", color: "#15781B", opacity: 1, lineWidth: 10 },
          red: { key: "r", color: "#882020", opacity: 1, lineWidth: 10 },
          blue: { key: "b", color: "#003088", opacity: 1, lineWidth: 10 },
          yellow: { key: "y", color: "#e68f00", opacity: 1, lineWidth: 10 },
        },
      },
    });
  }

  updateFormattedMoves() {
    this.formattedMoves = [];

    for (let i = 0; i < this.moves.length; i += 2) {
      const whiteMove = this.moves[i] ? this.moves[i].san : "";
      const blackMove = this.moves[i + 1] ? this.moves[i + 1].san : "";

      this.formattedMoves.push({
        white: whiteMove,
        black: blackMove,
      });
    }
  }

  // Méthode pour aller à un coup spécifique
  goToMove(moveIndex: number) {
    if (moveIndex < 0 || moveIndex >= this.moves.length) return;

    // Trouver le nœud correspondant dans la ligne principale
    const node = this.mainline.nodes[moveIndex];
    if (!node) return;

    // Utiliser goToPosition avec le chemin du nœud
    this.goToPosition([moveIndex], node.move.color === "w" ? "white" : "black");
  }

  ngAfterViewInit() {
    if (this.boardElement) {
      try {
        this.chess.load(this.fen);
        // Initialiser l'historique avec la position de départ
        this.history = [this.fen];
        this.currentMoveIndex = 0;
        this.initChessground();
      } catch (error) {
        console.error("Error initializing Chessground:", error);
      }
    } else {
      console.error("Board element not found!");
    }
  }

  // Fonction pour générer les mouvements légaux
  getLegalMoves() {
    const dests = new Map();
    const squares = [
      "a1",
      "b1",
      "c1",
      "d1",
      "e1",
      "f1",
      "g1",
      "h1",
      "a2",
      "b2",
      "c2",
      "d2",
      "e2",
      "f2",
      "g2",
      "h2",
      "a3",
      "b3",
      "c3",
      "d3",
      "e3",
      "f3",
      "g3",
      "h3",
      "a4",
      "b4",
      "c4",
      "d4",
      "e4",
      "f4",
      "g4",
      "h4",
      "a5",
      "b5",
      "c5",
      "d5",
      "e5",
      "f5",
      "g5",
      "h5",
      "a6",
      "b6",
      "c6",
      "d6",
      "e6",
      "f6",
      "g6",
      "h6",
      "a7",
      "b7",
      "c7",
      "d7",
      "e7",
      "f7",
      "g7",
      "h7",
      "a8",
      "b8",
      "c8",
      "d8",
      "e8",
      "f8",
      "g8",
      "h8",
    ];

    // Toujours permettre les mouvements légaux, même en mode révision
    // Supprimer ou commenter cette condition:
    // if (this.isReviewing && this.currentMoveIndex < this.history.length - 1) {
    //   return new Map();
    // }

    for (const s of squares) {
      const square = s as Square;
      const piece = this.chess.get(square);
      if (piece && piece.color === this.chess.turn()) {
        const moves = this.chess.moves({
          square: square,
          verbose: true,
        });
        if (moves.length > 0) {
          dests.set(
            s,
            moves.map((move) => move.to)
          );
        }
      }
    }
    return dests;
  }

  // Méthode pour charger un PGN avec support des variantes
  loadPgn(pgn: string): boolean {
    try {
      const tempChess = new Chess();
      tempChess.loadPgn(pgn);

      this.chess = tempChess;
      this.resetHistory();
      this.hasPgn = true;

      // Initialiser la structure de l'arbre des coups
      this.mainline = { nodes: [], parentNode: null };
      this.currentVariation = this.mainline;

      const startFen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      this.history = [startFen];

      // Recréer l'historique en rejouant les coups
      const tempHistoryChess = new Chess();
      const moves = this.chess.history({ verbose: true });

      // Stocker les coups dans notre tableau d'historique
      this.moves = [...moves];

      // Pour chaque coup, créer un nœud dans l'arbre principal
      for (const move of moves) {
        tempHistoryChess.move({
          from: move.from as Square,
          to: move.to as Square,
          promotion: move.promotion as any,
        });
        const fen = tempHistoryChess.fen();
        this.history.push(fen);

        const moveNode: MoveNode = {
          move: move,
          fen: fen,
          san: move.san,
          variations: [],
          parent: this.currentNode,
          isMainline: true,
        };

        this.mainline.nodes.push(moveNode);
        this.currentNode = moveNode;
      }

      console.log("Moves loaded:", this.moves);
      // Mettre à jour les coups formatés pour l'affichage
      this.updateFormattedMovesWithVariations(); // au lieu de this.updateFormattedMoves()
      console.log("Formatted moves:", this.formattedMoves);

      // Afficher la position finale
      this.currentMoveIndex = this.history.length - 1;
      const lastMove =
        moves.length > 0
          ? [moves[moves.length - 1].from, moves[moves.length - 1].to]
          : undefined;

      this.chessground.set({
        fen: this.chess.fen(),
        turnColor: this.chess.turn() === "w" ? "white" : "black",
        movable: {
          color: "both",
          dests: this.getLegalMoves(),
        },
        lastMove: lastMove,
      });

      this.isReviewing = true;

      // If we want to start at the beginning of the game:
      this.goToStart(); // Uncomment this if you want to start at the beginning

      // Create proper history entries for arrow navigation
      if (this.moves.length > 0) {
        // Make sure the currentMoveIndex is tracking correctly
        if (this.history.length !== this.moves.length + 1) {
          console.warn("History and moves mismatch - rebuilding history");
          this.resetHistory();
          const chess = new Chess();
          this.history = [chess.fen()];

          for (const move of this.moves) {
            chess.move({
              from: move.from as Square,
              to: move.to as Square,
              promotion: move.promotion as any,
            });
            this.history.push(chess.fen());
          }
        }
      }

      this.positionChanged.emit(this.chess.fen());
      this.moveHistoryChanged.emit([...this.moves]);

      return true;
    } catch (error) {
      console.error("Error loading PGN:", error);
      this.hasPgn = false;
      return false;
    }
  }

  // Fonction modifiée pour gérer les variantes
  onMove(orig: string, dest: string) {
    // Créer une copie de Chess pour tester le coup
    const chessCopy = new Chess(this.chess.fen());

    const move = chessCopy.move({
      from: orig as Square,
      to: dest as Square,
      promotion: "q",
    });

    if (!move) return false;

    // Si nous sommes en mode révision et pas à la fin de la ligne principale
    // OU si nous sommes déjà dans une variante qui n'est pas la ligne principale
    if (
      !(
        (this.isReviewing && this.currentMoveIndex < this.history.length - 1) ||
        this.currentVariation !== this.mainline
      )
    ) {
      // Si c'est le premier coup de la variante
      if (
        this.isReviewing &&
        this.currentMoveIndex < this.history.length - 1 &&
        this.currentVariation === this.mainline
      ) {
        return this.createVariation(orig, dest);
      }

      // Sinon c'est un coup qui continue la variante en cours
      return this.continueVariation(orig, dest);
    }

    // Sinon, c'est un coup normal qui continue l'historique
    this.chess.move({
      from: orig as Square,
      to: dest as Square,
      promotion: "q",
    });

    const newFen = this.chess.fen();

    // Ajouter le coup à la structure actuelle
    const moveNode: MoveNode = {
      move: move,
      fen: newFen,
      san: move.san,
      variations: [],
      parent: this.currentNode,
      isMainline: this.currentVariation === this.mainline,
    };

    this.currentVariation.nodes.push(moveNode);
    this.currentNode = moveNode;
    this.updateArrowsForMove(moveNode);
    // Mettre à jour l'historique linéaire
    this.history.push(newFen);
    this.moves.push(move);
    this.currentMoveIndex = this.history.length - 1;

    // Mettre à jour les coups formatés
    this.updateFormattedMovesWithVariations(); // au lieu de this.updateFormattedMoves()

    // Mettre à jour l'échiquier
    this.chessground.set({
      fen: newFen,
      turnColor: this.chess.turn() === "w" ? "white" : "black",
      movable: {
        color: "both",
        dests: this.getLegalMoves(),
      },
      lastMove: [orig, dest],
    });

    this.positionChanged.emit(newFen);
    this.moveHistoryChanged.emit([...this.moves]);

    return true;
  }

  // Nouvelle méthode pour créer une variante
  createVariation(orig: string, dest: string): boolean {
    // On doit trouver le nœud parent à partir duquel créer la variante
    const parentNode = this.findNodeByIndex(this.currentMoveIndex);
    if (!parentNode) return false;

    // Créer une nouvelle position d'échecs à partir de la position du parent
    const tempChess = new Chess(parentNode.fen);

    // Jouer le nouveau coup
    const move = tempChess.move({
      from: orig as Square,
      to: dest as Square,
      promotion: "q",
    });

    if (!move) return false;

    // Créer un nouveau nœud pour ce coup
    const newNode: MoveNode = {
      move: move,
      fen: tempChess.fen(),
      san: move.san,
      variations: [],
      parent: parentNode,
      isMainline: false,
    };

    // Créer une nouvelle variante
    const newVariation: MoveTree = {
      nodes: [newNode],
      parentNode: parentNode,
    };

    // Ajouter cette variante au nœud parent
    parentNode.variations.push(newVariation);

    // Mettre à jour l'état actuel
    this.currentVariation = newVariation;
    this.currentNode = newNode;
    this.chess = tempChess;

    // Mettre à jour l'interface
    this.chessground.set({
      fen: tempChess.fen(),
      turnColor: tempChess.turn() === "w" ? "white" : "black",
      movable: {
        color: "both",
        dests: this.getLegalMoves(),
      },
      lastMove: [orig, dest],
    });

    // Mettre à jour les coups formatés avec les variantes
    this.updateFormattedMovesWithVariations();

    this.positionChanged.emit(tempChess.fen());

    return true;
  }

  // Nouvelle méthode pour continuer une variante existante
  continueVariation(orig: string, dest: string): boolean {
    // Jouer le coup
    const move = this.chess.move({
      from: orig as Square,
      to: dest as Square,
      promotion: "q",
    });

    if (!move) return false;

    const newFen = this.chess.fen();

    // Créer un nouveau nœud pour ce coup
    const newNode: MoveNode = {
      move: move,
      fen: newFen,
      san: move.san,
      variations: [],
      parent: this.currentNode,
      isMainline: false,
    };

    // Ajouter ce nœud à la variante actuelle
    this.currentVariation.nodes.push(newNode);
    this.currentNode = newNode;

    // Mettre à jour l'interface
    this.chessground.set({
      fen: newFen,
      turnColor: this.chess.turn() === "w" ? "white" : "black",
      movable: {
        color: "both",
        dests: this.getLegalMoves(),
      },
      lastMove: [orig, dest],
    });

    // Mettre à jour l'affichage des coups
    this.updateFormattedMovesWithVariations();

    this.positionChanged.emit(newFen);

    return true;
  }

  // Trouver un nœud dans l'arbre par son index
  findNodeByIndex(index: number): MoveNode | null {
    // Index 0 est la position initiale
    if (index === 0) return null;

    // Index -1 est invalide
    if (index < 0) return null;

    // Si on est dans la ligne principale
    if (index <= this.mainline.nodes.length) {
      return this.mainline.nodes[index - 1];
    }

    // Sinon il faut chercher dans les variantes (implémentation plus complexe)
    return null; // Pour simplifier, cette partie nécessiterait une recherche récursive
  }

  // Formater les coups d'une variante avec ses sous-variantes
  formatMovesForVariationRecursive(
    variation: MoveTree,
    path: number[]
  ): {
    white: string;
    black: string;
    path?: number[];
    isVariation?: boolean;
    moveNumber?: number;
  }[] {
    // Ajout du type explicite FormattedMove[] ici
    const formattedMoves: FormattedMove[] = [];

    let currentPair: FormattedMove = {
      white: "",
      black: "",
      path: [...path],
      isVariation: variation !== this.mainline,
    };

    // Si la variation est vide, retourner un tableau vide
    if (!variation.nodes || variation.nodes.length === 0) {
      return formattedMoves;
    }

    // Déterminer le numéro du premier coup et qui joue
    let moveNumber = 1;
    let isBlackToMove = false;

    if (variation.parentNode) {
      // Obtenir les informations de la position parente
      const parentFen = variation.parentNode.fen;
      const fenParts = parentFen.split(" ");
      moveNumber = parseInt(fenParts[5]);
      isBlackToMove = fenParts[1] === "b";

      // Si c'est aux noirs de jouer, on doit commencer par un coup noir
      if (isBlackToMove && variation.nodes.length > 0) {
        currentPair = {
          white: "",
          black: variation.nodes[0].san,
          path: [...path, 0],
          isVariation: variation !== this.mainline,
          moveNumber: moveNumber,
        };
        formattedMoves.push(currentPair);
        currentPair = {
          white: "",
          black: "",
          path: [...path, 1],
          isVariation: variation !== this.mainline,
        };
      }
    }

    // Formater les coups normalement
    for (let i = isBlackToMove ? 1 : 0; i < variation.nodes.length; i++) {
      const node = variation.nodes[i];
      const move = node.move;
      const currentPath = [...path, i];

      if (move.color === "w") {
        // Nouveau coup blanc
        if (currentPair.black) {
          formattedMoves.push(currentPair);
          currentPair = {
            white: move.san,
            black: "",
            path: currentPath,
            isVariation: variation !== this.mainline,
          };
        } else {
          currentPair.white = move.san;
          currentPair.path = currentPath;
        }
      } else {
        // Coup noir
        currentPair.black = move.san;
        currentPair.path = currentPath;
        formattedMoves.push(currentPair);
        currentPair = {
          white: "",
          black: "",
          path: [...path, i + 1],
          isVariation: variation !== this.mainline,
        };
      }
    }

    // Ne pas oublier le dernier coup s'il est blanc
    if (currentPair.white && !currentPair.black) {
      formattedMoves.push(currentPair);
    }

    return formattedMoves;
  }

  // Formater les coups d'une variante donnée
  formatMovesForVariation(variation: MoveTree) {
    let moveCounter = 0;
    let currentPair = { white: "", black: "" };

    for (const node of variation.nodes) {
      const move = node.move;
      if (move.color === "w") {
        // Nouveau coup blanc
        if (currentPair.black) {
          this.formattedMoves.push(currentPair);
          currentPair = { white: move.san, black: "" };
        } else {
          currentPair.white = move.san;
        }
      } else {
        // Coup noir
        currentPair.black = move.san;
        this.formattedMoves.push(currentPair);
        currentPair = { white: "", black: "" };
      }
    }

    // Ne pas oublier le dernier coup s'il est blanc
    if (currentPair.white && !currentPair.black) {
      this.formattedMoves.push(currentPair);
    }
  }

  // Réinitialiser l'historique
  resetHistory() {
    this.history = ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"];
    this.moves = [];
    this.currentMoveIndex = 0;
  }

  // Aller au début de la partie
  goToStart() {
    if (this.history.length === 0) return;

    this.currentMoveIndex = 0;
    const fen = this.history[0];

    this.chess.load(fen);
    this.chessground.set({
      fen: fen,
      turnColor: this.chess.turn() === "w" ? "white" : "black",
      movable: {
        color: "both",
        dests: this.getLegalMoves(),
      },
      lastMove: undefined,
    });

    // Mise à jour de l'affichage actif (si un nœud existe)
    const node = this.findNodeByIndex(this.currentMoveIndex);
    if (node) {
      this.updateArrowsForMove(node);
      const newPath = this.getPathToNode(node);
      this.activeMovePath = newPath ?? undefined;
      this.activeColor = node.move.color === "w" ? "white" : "black";
      this.updateCurrentEvaluation(newPath ?? undefined, this.activeColor);
      this.updatePrecision(newPath ?? undefined, this.activeColor);
    } else {
      // Pour la position initiale sans coup joué, on peut réinitialiser
      this.currentEvaluation = "0.00";
      this.activeMovePath = undefined;
      this.activeColor = undefined;
    }

    this.isReviewing = true;
    this.positionChanged.emit(fen);
  }

  // Aller à la fin de la partie
  goToEnd() {
    if (this.history.length === 0) return;

    this.currentMoveIndex = this.history.length - 1;
    const fen = this.history[this.currentMoveIndex];

    this.chess.load(fen);

    let lastMove = undefined;
    if (this.moves.length > 0) {
      const lastMoveObj = this.moves[this.moves.length - 1];
      lastMove = [lastMoveObj.from, lastMoveObj.to];
    }

    this.chessground.set({
      fen: fen,
      turnColor: this.chess.turn() === "w" ? "white" : "black",
      movable: {
        color: "both",
        dests: this.getLegalMoves(),
      },
      lastMove: lastMove,
    });

    // Mise à jour du coup actif
    const node = this.findNodeByIndex(this.currentMoveIndex);
    if (node) {
      this.updateArrowsForMove(node);
      const newPath = this.getPathToNode(node);
      this.activeMovePath = newPath ?? undefined;
      this.activeColor = node.move.color === "w" ? "white" : "black";
      this.updateCurrentEvaluation(newPath ?? undefined, this.activeColor);
      this.updatePrecision(newPath ?? undefined, this.activeColor);
    } else {
      this.currentEvaluation = "0.00";
      this.activeMovePath = undefined;
      this.activeColor = undefined;
    }

    this.isReviewing = true;
    this.positionChanged.emit(fen);
  }

  // Aller au coup précédent
  goToPreviousMove() {
    if (this.currentMoveIndex <= 0) return;

    this.currentMoveIndex--;
    const fen = this.history[this.currentMoveIndex];
    this.chess.load(fen);

    // Définir le dernier coup (si applicable)
    let lastMove;
    if (this.currentMoveIndex - 1 >= 0) {
      const lastMoveObj = this.moves[this.currentMoveIndex - 1];
      lastMove = [lastMoveObj.from, lastMoveObj.to];
    } else {
      lastMove = undefined;
    }

    // Mettre à jour le coup actif en récupérant le nœud correspondant
    const node = this.findNodeByIndex(this.currentMoveIndex);
    if (node) {
      this.currentNode = node;
      const newPath = this.getPathToNode(node);

      // Utilisez cette syntaxe pour éviter l'erreur Type 'number[] | null'
      this.activeMovePath = newPath ?? undefined;
      // Important: utilisez la couleur réelle du nœud
      this.activeColor = node.move.color === "w" ? "white" : "black";
      // Passer la couleur réelle à updateCurrentEvaluation
      this.updateCurrentEvaluation(newPath ?? undefined, this.activeColor);
      this.updatePrecision(newPath ?? undefined, this.activeColor);

      // Ajouter du logging pour le débogage
      console.log(
        `Coup actif mis à jour: chemin=${JSON.stringify(
          this.activeMovePath
        )}, couleur=${this.activeColor}`
      );
    } else {
      this.currentEvaluation = "0.00"; // Réinitialisation si pas de node trouvé
      this.activeMovePath = undefined;
      this.activeColor = undefined;
    }

    this.chessground.set({
      fen: fen,
      turnColor: this.chess.turn() === "w" ? "white" : "black",
      movable: {
        color: "both",
        dests: this.getLegalMoves(),
      },
      lastMove: lastMove,
    });

    this.isReviewing = true;
    this.positionChanged.emit(fen);
    if (node) {
      this.updateArrowsForMove(node);
    }
  }

  // Aller au coup suivant
  goToNextMove() {
    if (this.currentMoveIndex >= this.history.length - 1) return;

    this.currentMoveIndex++;
    const fen = this.history[this.currentMoveIndex];
    this.chess.load(fen);

    const lastMoveObj = this.moves[this.currentMoveIndex - 1];
    const lastMove = [lastMoveObj.from, lastMoveObj.to];

    // Mettre à jour le coup actif en récupérant le nœud correspondant
    const node = this.findNodeByIndex(this.currentMoveIndex);
    if (node) {
      this.currentNode = node;
      const newPath = this.getPathToNode(node);
      // Utilisez cette syntaxe pour éviter l'erreur Type 'number[] | null'
      this.activeMovePath = newPath ?? undefined;
      // Important: utilisez la couleur réelle du nœud
      this.activeColor = node.move.color === "w" ? "white" : "black";
      // Passer la couleur réelle à updateCurrentEvaluation
      this.updateCurrentEvaluation(newPath ?? undefined, this.activeColor);
      this.updatePrecision(newPath ?? undefined, this.activeColor);

      // Ajouter du logging pour le débogage
      console.log(
        `Coup actif mis à jour: chemin=${JSON.stringify(
          this.activeMovePath
        )}, couleur=${this.activeColor}`
      );
    }

    this.chessground.set({
      fen: fen,
      turnColor: this.chess.turn() === "w" ? "white" : "black",
      movable: {
        color: "both",
        dests: this.getLegalMoves(),
      },
      lastMove: lastMove,
    });

    if (this.currentMoveIndex === this.history.length - 1) {
      this.isReviewing = false;
    }
    if (node) {
      this.updateArrowsForMove(node);
    }
    this.positionChanged.emit(fen);
  }

  // Vérifie si nous sommes au début de l'historique
  isAtStart(): boolean {
    return this.currentMoveIndex <= 0;
  }

  // Vérifie si nous sommes à la fin de l'historique
  isAtEnd(): boolean {
    return this.currentMoveIndex >= this.history.length - 1;
  }

  // Méthodes existantes
  ngOnChanges(changes: SimpleChanges) {
    if (changes["fen"] && this.chessground) {
      try {
        this.chess.load(this.fen);
        const dests = this.getLegalMoves();

        this.chessground.set({
          fen: this.fen,
          turnColor: this.chess.turn() === "w" ? "white" : "black",
          movable: {
            color: "both",
            dests: dests,
          },
        });
      } catch (error) {
        console.error("Invalid FEN position:", error);
      }
    }
  }

  makeMove(move: string) {
    const result = this.chess.move(move);
    if (result) {
      const dests = this.getLegalMoves();

      // Ajouter à l'historique
      this.history.push(this.chess.fen());
      this.moves.push(result);
      this.currentMoveIndex = this.history.length - 1;

      this.chessground.set({
        fen: this.chess.fen(),
        turnColor: this.chess.turn() === "w" ? "white" : "black",
        movable: {
          color: "both",
          dests: dests,
        },
        lastMove: [result.from, result.to],
      });

      this.positionChanged.emit(this.chess.fen());
      this.moveHistoryChanged.emit([...this.moves]);

      return true;
    }
    return false;
  }

  resetBoard() {
    this.chess.reset();
    this.resetHistory();

    const dests = this.getLegalMoves();

    this.chessground.set({
      fen: this.chess.fen(),
      turnColor: "white",
      movable: {
        color: "both",
        dests: dests,
      },
      check: false,
      lastMove: undefined,
    });

    this.positionChanged.emit(this.chess.fen());
    this.moveHistoryChanged.emit([]);
  }

  // Retourne le FEN actuel
  getFen(): string {
    return this.chess.fen();
  }

  // Retourne la liste des coups joués en notation PGN
  // Remplacer la méthode getPgn
  getPgn(): string {
    // Si nous avons des coups dans l'historique, reconstruire le PGN complet
    if (this.moves && this.moves.length > 0) {
      // Créer un nouvel objet Chess
      const tempChess = new Chess();

      try {
        // Rejouer tous les coups dans l'ordre
        for (const move of this.moves) {
          tempChess.move({
            from: move.from as Square,
            to: move.to as Square,
            promotion: move.promotion as any,
          });
        }

        // Récupérer le PGN complet avec l'historique
        const completePgn = tempChess.pgn();
        console.log("PGN complet reconstruit:", completePgn);
        return completePgn;
      } catch (error) {
        console.error("Erreur lors de la reconstruction du PGN:", error);
      }
    }

    // Si pas de coups ou erreur, retourner le PGN actuel (qui sera incomplet)
    const currentPgn = this.chess.pgn();
    console.log("PGN actuel (incomplet):", currentPgn);
    return currentPgn;
  }

  // Trouver le chemin vers une variante donnée dans l'arbre des coups
  findVariationPath(variation: MoveTree): number[] | null {
    if (variation === this.mainline) {
      return []; // La ligne principale a un chemin vide
    }

    // Recherche récursive dans l'arbre des coups
    const findPath = (
      tree: MoveTree,
      target: MoveTree,
      currentPath: number[]
    ): number[] | null => {
      // Vérifier si la variante actuelle est celle que nous cherchons
      if (tree === target) {
        return [...currentPath];
      }

      // Parcourir tous les nœuds de cette variante
      for (let i = 0; i < tree.nodes.length; i++) {
        const node = tree.nodes[i];

        // Rechercher dans chaque sous-variante
        for (let v = 0; v < node.variations.length; v++) {
          const subVariation = node.variations[v];
          const path = findPath(subVariation, target, [...currentPath, i, v]);
          if (path) return path;
        }
      }

      return null; // Variante non trouvée dans cette branche
    };

    return findPath(this.mainline, variation, []);
  }

  // Mettre en évidence les coups de la variante active dans l'affichage
  highlightActiveVariation(moves: any[], variationPath: number[]): any[] {
    // Créer une copie des coups formatés
    const result = [...moves];

    // Si le chemin est vide (ligne principale), retourner les coups tels quels
    if (!variationPath.length) return result;

    // Fonction pour comparer deux chemins
    const isSubPath = (path1: number[], path2: number[]): boolean => {
      if (!path1 || !path2) return false;
      if (path1.length > path2.length) return false;

      for (let i = 0; i < path1.length; i++) {
        if (path1[i] !== path2[i]) return false;
      }
      return true;
    };

    // Parcourir tous les coups et marquer ceux qui font partie de la variante active
    for (let i = 0; i < result.length; i++) {
      const move = result[i];
      if (move.path && isSubPath(variationPath, move.path)) {
        // Ce coup fait partie de la variante active ou d'une sous-variante
        move.isActiveVariation = true;
      }
    }

    return result;
  }

  // Déterminer si un coup est le coup actuellement affiché
  isActiveMove(path: number[] | undefined, color: "white" | "black"): boolean {
    if (!this.currentNode || !path) return false;

    // Pour retrouver le noeud correspondant au chemin
    let node = this.findNodeByPath(path);
    if (!node) return false;

    // Vérifier si ce noeud est le noeud actuel et correspond à la couleur
    return (
      this.currentNode === node &&
      ((color === "white" && node.move.color === "w") ||
        (color === "black" && node.move.color === "b"))
    );
  }

  // Mettre à jour cette méthode dans votre composant
  goToPosition(path: number[] | undefined, color: "white" | "black"): void {
    if (!path) return;

    const node = this.findNodeByPath(path);
    if (!node) return;

    console.log("Navigation vers le nœud:", node);

    // Charger la position FEN de ce nœud
    this.chess.load(node.fen);

    // Utiliser la couleur réelle du coup via node.move.color
    const actualColor = node.move.color === "w" ? "white" : "black";

    // IMPORTANT: D'abord mettre à jour l'échiquier
    this.chessground.set({
      fen: node.fen,
      turnColor: this.chess.turn() === "w" ? "white" : "black",
      movable: {
        color: "both",
        dests: this.getLegalMoves(),
      },
      lastMove: [node.move.from, node.move.to],
    });

    // Mise à jour de l'état courant
    this.currentNode = node;
    this.currentVariation = this.findVariationForNode(node);
    this.isReviewing = true;

    this.saveCurrentEvaluations();
    this.updateFormattedMovesWithVariations();
    this.restoreEvaluations();

    this.activeMovePath = [...path];
    this.activeColor = actualColor;

    this.updateCurrentEvaluation(path, actualColor);
    this.updatePrecision(path, actualColor); // Ajoutez cette ligne pour mettre à jour la précision

    console.log(
      `Mise à jour du coup actif: chemin=${path}, couleur=${actualColor}, évaluation=${this.currentEvaluation}`
    );

    // IMPORTANT: Dessiner les flèches EN DERNIER après un court délai
    setTimeout(() => {
      this.updateArrowsForMove(node);
    }, 50);

    this.positionChanged.emit(node.fen);
  }

  // Méthode auxiliaire pour trouver un noeud par son chemin
  // Modify the goToPosition method to ensure it works for both player and opponent moves
  private findNodeByPath(path: number[]): MoveNode | null {
    if (!path || path.length === 0) return null;

    // Ensure we're using the correct root variation
    let variation: MoveTree = this.mainline;

    // Simple case - direct index in mainline
    if (path.length === 1) {
      const index = path[0];
      if (index >= 0 && index < this.mainline.nodes.length) {
        return this.mainline.nodes[index];
      }
      return null;
    }

    // For variations - ensure correct traversal with proper path handling
    let currentPath = [...path];
    let nodeIndex = currentPath[0];

    // If we have a more complex path, handle variations properly
    if (currentPath.length > 1) {
      // Correctly navigate through the variation tree
      for (let i = 0; i < currentPath.length - 1; i += 2) {
        if (i + 1 >= currentPath.length) break;

        const moveIndex = currentPath[i];
        const varIndex = currentPath[i + 1];

        if (moveIndex >= variation.nodes.length) return null;

        const node = variation.nodes[moveIndex];
        if (!node || varIndex >= node.variations.length) return null;

        variation = node.variations[varIndex];
      }

      // Get the final index
      nodeIndex = currentPath[currentPath.length - 1];
    }

    if (nodeIndex >= variation.nodes.length) return null;
    return variation.nodes[nodeIndex];
  }

  // Trouver la variante à laquelle appartient un noeud
  findVariationForNode(node: MoveNode): MoveTree {
    // Chercher dans la ligne principale
    if (this.mainline.nodes.includes(node)) {
      return this.mainline;
    }

    // Fonction récursive pour chercher dans les variantes
    const findInVariation = (variation: MoveTree): MoveTree | null => {
      for (const n of variation.nodes) {
        if (n === node) return variation;

        for (const subVar of n.variations) {
          const found = findInVariation(subVar);
          if (found) return found;
        }
      }
      return null;
    };

    // Chercher dans toutes les variantes
    const result = findInVariation(this.mainline);
    return result || this.mainline; // Retourner la ligne principale par défaut
  }

  // Remplacer la méthode updateFormattedMovesWithVariations

  updateFormattedMovesWithVariations() {
    // Convertir l'arbre en structure hiérarchique
    const displayMoves = this.convertTreeToDisplayMoves(this.mainline);

    // Convertir la structure hiérarchique en liste plate pour l'affichage
    this.formattedMoves = this.flattenDisplayMoves(displayMoves);
  }

  // Nouvelle méthode pour convertir l'arbre en structure hiérarchique
  convertTreeToDisplayMoves(tree: MoveTree, depth: number = 0): DisplayMove[] {
    const result: DisplayMove[] = [];
    let moveNumber = 1;
    let currentPair: DisplayMove | null = null;

    // Déterminer le numéro initial du coup et si c'est au noir de jouer
    if (tree.parentNode) {
      const fenParts = tree.parentNode.fen.split(" ");
      moveNumber = parseInt(fenParts[5]);
      const isBlackToMove = fenParts[1] === "b";

      // Si c'est au noir de jouer, nous commençons par un coup noir
      if (isBlackToMove) {
        currentPair = {
          white: "",
          black: "",
          moveNumber: moveNumber,
          isMainline: tree === this.mainline,
          depth: depth,
          variations: [],
          isBlackContinuation: true,
        };
      }
    }

    // Traiter chaque nœud de l'arbre
    for (let i = 0; i < tree.nodes.length; i++) {
      const node = tree.nodes[i];
      const path = [...(tree === this.mainline ? [] : []), i];

      if (!currentPair || node.move.color === "w") {
        // Nouveau coup blanc ou début de la séquence
        if (currentPair) {
          result.push(currentPair);
        }

        currentPair = {
          white: node.move.color === "w" ? node.san : "",
          black: node.move.color === "b" ? node.san : "",
          moveNumber: moveNumber,
          whiteNodePath: node.move.color === "w" ? path : undefined,
          blackNodePath: node.move.color === "b" ? path : undefined,
          isMainline: tree === this.mainline,
          depth: depth,
          variations: [],
        };

        if (node.move.color === "w") {
          moveNumber++;
        }
      } else {
        // Coup noir qui complète le coup blanc
        currentPair.black = node.san;
        currentPair.blackNodePath = path;
        result.push(currentPair);
        currentPair = null;
      }

      // Traiter les variantes associées à ce nœud
      if (node.variations && node.variations.length > 0) {
        for (const variation of node.variations) {
          const variationMoves = this.convertTreeToDisplayMoves(
            variation,
            depth + 1
          );

          // Ajouter la variante au bon endroit
          if (currentPair) {
            currentPair.variations.push(variationMoves);
          } else if (result.length > 0) {
            result[result.length - 1].variations.push(variationMoves);
          }
        }
      }
    }

    // Ne pas oublier le dernier coup s'il n'a pas été ajouté
    if (currentPair) {
      result.push(currentPair);
    }

    return result;
  }

  // Nouvelle méthode pour aplatir la structure hiérarchique
  // Modifier la méthode flattenDisplayMoves pour créer des entrées distinctes pour chaque coup
  flattenDisplayMoves(moves: DisplayMove[]): FormattedMove[] {
    const result: FormattedMove[] = [];

    for (const move of moves) {
      // Si nous avons un coup blanc, l'ajouter comme entrée indépendante
      if (move.white) {
        const whiteMove: FormattedMove = {
          white: move.white,
          black: "",
          moveNumber: move.moveNumber,
          isVariation: !move.isMainline,
          depth: move.depth,
          path: move.whiteNodePath,
          isBlackContinuation: false,
        };
        result.push(whiteMove);
      }

      // Si nous avons un coup noir, l'ajouter comme entrée indépendante
      if (move.black) {
        const blackMove: FormattedMove = {
          white: "",
          black: move.black,
          moveNumber: move.moveNumber,
          isVariation: !move.isMainline,
          depth: move.depth,
          path: move.blackNodePath,
          isBlackContinuation: move.isBlackContinuation || move.white === "",
        };
        result.push(blackMove);
      }

      // Ajouter les variantes directement après le coup approprié
      for (const variationMoves of move.variations) {
        const flattenedVariation = this.flattenDisplayMoves(variationMoves);

        // Marquer le premier et le dernier coup de la variante
        if (flattenedVariation.length > 0) {
          flattenedVariation[0].isVariationStart = true;
          flattenedVariation[flattenedVariation.length - 1].isVariationEnd =
            true;
        }

        result.push(...flattenedVariation);
      }
    }

    return result;
  }

  // Nouvelle méthode pour formater tous les coups d'un arbre
  formatMovesForTree(
    tree: MoveTree,
    basePath: number[] = [],
    depth: number = 0,
    previousPosition?: string
  ): FormattedMove[] {
    const result: FormattedMove[] = [];

    let moveNumber = 1;
    let isBlackToMove = false;

    // Déterminer le numéro de coup et qui joue
    if (previousPosition) {
      const positionParts = previousPosition.split(" ");
      moveNumber = parseInt(positionParts[5]);
      isBlackToMove = positionParts[1] === "b";
    } else if (tree.parentNode) {
      const parentFen = tree.parentNode.fen;
      const fenParts = parentFen.split(" ");
      moveNumber = parseInt(fenParts[5]);
      isBlackToMove = fenParts[1] === "b";
    }

    // Formater les coups de cette variante
    const moveList = this.formatMovesForVariationRecursive(tree, basePath);

    // Enrichir chaque coup avec des données de formatage
    for (let i = 0; i < moveList.length; i++) {
      const baseMove = moveList[i];
      const move: FormattedMove = {
        white: baseMove.white,
        black: baseMove.black,
        path: baseMove.path,
        isVariation: baseMove.isVariation,
        moveNumber: baseMove.moveNumber,

        depth: depth,
        isBlackContinuation: false,
        isVariationStart: false,
        isVariationEnd: false,
        parentPath: depth > 0 ? basePath.slice(0, -2) : undefined,
      };

      // Ajouter le numéro de coup
      if (move.white) {
        move.moveNumber = moveNumber;
        moveNumber++;
      } else if (move.black && i === 0) {
        move.moveNumber = moveNumber - 1;
        move.isBlackContinuation = true;
      }

      // Marquer clairement le début et la fin de variante
      if (i === 0 && depth > 0) {
        move.isVariationStart = true;
      }
      if (i === moveList.length - 1 && depth > 0) {
        move.isVariationEnd = true;
      }

      result.push(move);
    }

    // Traiter les variantes immédiatement après leur coup parent
    for (let i = 0; i < tree.nodes.length; i++) {
      const node = tree.nodes[i];

      if (node.variations && node.variations.length > 0) {
        for (let v = 0; v < node.variations.length; v++) {
          // Trouver la position exacte où insérer cette variante
          const parentPath = [...basePath, i];

          // Trouver l'index du coup parent dans le résultat
          const insertIndex = result.findIndex(
            (m) =>
              m.path &&
              m.path.length === parentPath.length &&
              m.path.every((val, idx) => val === parentPath[idx])
          );

          if (insertIndex !== -1) {
            // Formater les coups de la variante
            const varMoves = this.formatMovesForTree(
              node.variations[v],
              [...parentPath, v],
              depth + 1,
              node.fen
            );

            // Insérer immédiatement après le coup parent
            result.splice(insertIndex + 1, 0, ...varMoves);
          }
        }
      }
    }

    return result;
  }

  // Vérifier si un coup fait partie de la variante actuelle
  isMoveInCurrentVariation(path: number[] | undefined): boolean {
    if (!path || !this.currentNode) return false;

    // Trouver le chemin vers le nœud actuel
    const currentPath = this.getPathToNode(this.currentNode);
    if (!currentPath) return false;

    // Un coup est dans la même variante si son chemin commence par le même préfixe
    const minLength = Math.min(path.length, currentPath.length);
    for (let i = 0; i < minLength; i++) {
      if (path[i] !== currentPath[i]) return false;
    }

    return true;
  }

  // Trouver le chemin vers un nœud donné
  getPathToNode(node: MoveNode): number[] | null {
    // Rechercher dans la ligne principale
    const mainIndex = this.mainline.nodes.indexOf(node);
    if (mainIndex !== -1) {
      return [mainIndex];
    }

    // Recherche récursive dans les variantes
    const findInTree = (
      tree: MoveTree,
      basePath: number[] = []
    ): number[] | null => {
      for (let i = 0; i < tree.nodes.length; i++) {
        const currentNode = tree.nodes[i];
        if (currentNode === node) {
          return [...basePath, i];
        }

        for (let v = 0; v < currentNode.variations.length; v++) {
          const varPath = [...basePath, i, v];
          const path = findInTree(currentNode.variations[v], varPath);
          if (path !== null) return path;
        }
      }
      return null;
    };

    return findInTree(this.mainline);
  }

  // Détermine si on doit afficher le numéro de coup pour cet élément
  showMoveNumber(move: FormattedMove, index: number): boolean {
    // Toujours montrer le numéro pour les coups blancs
    if (move.white) return true;

    // Pour les coups noirs, vérifier si c'est le début d'une variante ou une continuation
    return (
      !!move.isBlackContinuation ||
      (!!move.black && !move.white && !!move.isVariationStart)
    );
  }

  // Remplacer votre fonction analysePgn pour inclure l'association des résultats
  analyzePgn() {
    if (!this.hasPgn) return;

    this.isAnalyzing = true;
    this.analysisProgress = 0;
    this.analysisProgressText = "Initialisation de l'analyse...";

    const pgn = this.getPgn();
    console.log("Démarrage de l'analyse du PGN...");
    console.log("PGN:", pgn);

    // Lancer l'analyse avec le service LocalAnalysis
    this.localAnalysis
      .analyzeGame(pgn, 15, (progress) => {
        // Mise à jour de la progression
        this.analysisProgress = progress;
        this.analysisProgressText = `Analyse en cours (${progress}%)...`;
      })
      .then((analysis) => {
        console.log("Analyse terminée:", analysis);
        this.analysisResults = analysis;

        // Associer les résultats à l'interface
        this.linkAnalysisToMoves();

        this.isAnalyzing = false;
        this.analysisProgress = 100;
        this.analysisProgressText = "Analyse terminée!";

        setTimeout(() => {
          this.analysisProgress = 0;
          this.analysisProgressText = "";
        }, 2000);
      })
      .catch((error) => {
        console.error("Erreur lors de l'analyse:", error);
        this.isAnalyzing = false;
        this.analysisProgressText = "Erreur lors de l'analyse";
      });
  }

  // Ajouter cette méthode pour associer les résultats d'analyse aux coups formatés
  private linkAnalysisToMoves() {
    if (!this.analysisResults || this.analysisResults.length <= 1) {
      console.error(
        "Pas assez de résultats d'analyse:",
        this.analysisResults?.length
      );
      return;
    }

    console.log(
      "Nombre total de coups analysés:",
      this.analysisResults.length - 1
    );
    console.log("Nombre de coups formatés:", this.formattedMoves.length);

    // Convertir les coups formatés en une structure plate pour faciliter la correspondance
    const flatMoves: {
      index: number;
      formattedIndex: number;
      isWhite: boolean;
    }[] = [];

    for (let i = 0; i < this.formattedMoves.length; i++) {
      const move = this.formattedMoves[i];
      if (move.white) {
        flatMoves.push({
          index: flatMoves.length,
          formattedIndex: i,
          isWhite: true,
        });
      }
      if (move.black) {
        flatMoves.push({
          index: flatMoves.length,
          formattedIndex: i,
          isWhite: false,
        });
      }
    }

    console.log("Nombre total de coups mis à plat:", flatMoves.length);

    // Parcourir les analyses (en sautant la position initiale à l'index 0)
    for (
      let i = 1;
      i < this.analysisResults.length && i - 1 < flatMoves.length;
      i++
    ) {
      const analysis = this.analysisResults[i];
      const flatIndex = i - 1; // L'index 0 dans analysisResults correspond à la position initiale

      if (flatIndex >= flatMoves.length) {
        console.warn(`Pas de coup correspondant à l'analyse ${i}`);
        continue;
      }

      const flatMove = flatMoves[flatIndex];
      const formattedMove = this.formattedMoves[flatMove.formattedIndex];

      // Calculer la précision (1 - delta)
      const precision =
        analysis.delta !== undefined
          ? Math.max(0, Math.min(1, 1 - (analysis.delta || 0)))
          : undefined;

      // Associer les données d'analyse au coup correspondant (blanc ou noir)
      if (flatMove.isWhite) {
        console.log(
          `Associer analyse au coup blanc: ${analysis.moveNumber}.${analysis.movePlayed}`
        );
        formattedMove.whiteEvaluation = analysis.evaluation?.formattedScore;
        formattedMove.whiteBestMove = analysis.bestMoveForPlayer;
        formattedMove.whiteDelta = analysis.delta;
        formattedMove.whitePrecision = precision;
      } else {
        console.log(
          `Associer analyse au coup noir: ${analysis.moveNumber}...${analysis.movePlayed}`
        );
        formattedMove.blackEvaluation = analysis.evaluation?.formattedScore;
        formattedMove.blackBestMove = analysis.bestMoveForPlayer;
        formattedMove.blackDelta = analysis.delta;
        formattedMove.blackPrecision = precision;
      }

      // Afficher les détails dans la console
      console.log(
        `Coup ${analysis.moveNumber}${flatMove.isWhite ? "." : "..."} ${
          analysis.movePlayed
        }`
      );
      console.log(
        `  Évaluation: ${analysis.evaluation?.formattedScore || "N/A"}`
      );
      console.log(
        `  Précision: ${
          precision !== undefined ? (precision * 100).toFixed(1) + "%" : "N/A"
        }`
      );
      console.log(`  Meilleur coup: ${analysis.bestMoveForPlayer || "N/A"}`);
    }
    this.saveCurrentEvaluations();
    // Forcer la mise à jour de l'affichage
    this.formattedMoves = [...this.formattedMoves];
  }

  private saveCurrentEvaluations(): void {
    if (!this.formattedMoves) return;

    // Parcourir tous les coups formatés et sauvegarder leurs évaluations
    for (const move of this.formattedMoves) {
      // Créer une clé unique pour chaque coup (blanc ou noir)
      if (move.white && move.path) {
        const key = `w_${move.path.join("_")}`;
        if (
          move.whiteEvaluation ||
          move.whiteBestMove ||
          move.whiteDelta !== undefined ||
          move.whitePrecision !== undefined
        ) {
          this.moveEvaluations.set(key, {
            evaluation: move.whiteEvaluation,
            bestMove: move.whiteBestMove,
            delta: move.whiteDelta,
            precision: move.whitePrecision,
          });
        }
      }

      if (move.black && move.path) {
        const key = `b_${move.path.join("_")}`;
        if (
          move.blackEvaluation ||
          move.blackBestMove ||
          move.blackDelta !== undefined ||
          move.blackPrecision !== undefined
        ) {
          this.moveEvaluations.set(key, {
            evaluation: move.blackEvaluation,
            bestMove: move.blackBestMove,
            delta: move.blackDelta,
            precision: move.blackPrecision,
          });
        }
      }
    }

    console.log("Évaluations sauvegardées:", this.moveEvaluations.size);
  }

  private restoreEvaluations(): void {
    if (!this.formattedMoves || this.moveEvaluations.size === 0) return;

    // Parcourir tous les coups formatés et restaurer leurs évaluations
    for (const move of this.formattedMoves) {
      // Restaurer les évaluations pour les coups blancs
      if (move.white && move.path) {
        const key = `w_${move.path.join("_")}`;
        const evaluation = this.moveEvaluations.get(key);
        if (evaluation) {
          move.whiteEvaluation = evaluation.evaluation;
          move.whiteBestMove = evaluation.bestMove;
          move.whiteDelta = evaluation.delta;
          move.whitePrecision = evaluation.precision;
        }
      }

      // Restaurer les évaluations pour les coups noirs
      if (move.black && move.path) {
        const key = `b_${move.path.join("_")}`;
        const evaluation = this.moveEvaluations.get(key);
        if (evaluation) {
          move.blackEvaluation = evaluation.evaluation;
          move.blackBestMove = evaluation.bestMove;
          move.blackDelta = evaluation.delta;
          move.blackPrecision = evaluation.precision;
        }
      }
    }

    console.log("Évaluations restaurées aux coups formatés");
  }

  getPrecisionClass(precision: number): string {
    if (precision >= 0.9) return "precision-excellent";
    if (precision >= 0.7) return "precision-good";
    if (precision >= 0.5) return "precision-inaccuracy";
    if (precision >= 0.3) return "precision-mistake";
    return "precision-blunder";
  }

  // Améliorer la méthode updateCurrentEvaluation pour mieux gérer les évaluations
  private updateCurrentEvaluation(
    path: number[] | undefined,
    color: "white" | "black"
  ): void {
    // Position initiale ou cas invalide - évaluation à 0.00
    if (!path || !this.formattedMoves || this.formattedMoves.length === 0) {
      this.currentEvaluation = "0.00";
      this.activeMovePath = undefined;
      this.activeColor = undefined;
      return;
    }

    console.log(
      `Recherche d'évaluation pour: chemin=${path}, couleur=${color}`
    );

    // Trouver le move formaté correspondant
    for (const move of this.formattedMoves) {
      // Vérifier si les chemins correspondent
      if (!move.path || move.path.length !== path.length) continue;

      const pathMatches = move.path.every((val, idx) => val === path[idx]);

      if (pathMatches) {
        // CORRECTION: Vérifier explicitement la correspondance avec le coup blanc ou noir
        if (color === "white" && move.white) {
          this.currentEvaluation = move.whiteEvaluation || "0.00";
          console.log(
            `Coup blanc trouvé avec évaluation: ${this.currentEvaluation}`
          );
          return;
        }
        if (color === "black" && move.black) {
          this.currentEvaluation = move.blackEvaluation || "0.00";
          console.log(
            `Coup noir trouvé avec évaluation: ${this.currentEvaluation}`
          );
          return;
        }
      }
    }

    // Si aucun coup correspondant n'est trouvé
    this.currentEvaluation = "0.00";
    console.log("Aucun coup correspondant trouvé, évaluation par défaut: 0.00");
  }

  private arraysEqual(
    a: number[] | undefined,
    b: number[] | undefined
  ): boolean {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }

  // Remplacer votre méthode isActiveMoveInList pour qu'elle soit plus robuste
  isActiveMoveInList(
    path: number[] | undefined,
    color: "white" | "black"
  ): boolean {
    if (!path || !this.activeMovePath || !this.activeColor) return false;

    // Vérifier si ce coup correspond exactement au coup actif (chemin et couleur)
    return (
      this.activeColor === color && this.arraysEqual(path, this.activeMovePath)
    );
  }
  // Méthode pour obtenir la classe CSS du score d'évaluation
  getEvaluationClass(score: string | undefined): string {
    if (!score) return "";

    if (score.includes("Mat")) {
      return score.includes("contre vous")
        ? "evaluation-losing-mate"
        : "evaluation-winning-mate";
    }

    // Pour les scores numériques
    if (score.startsWith("+")) return "evaluation-positive";
    if (score.startsWith("-")) return "evaluation-negative";

    return "evaluation-equal";
  }

  get groupedMoves(): GroupedMove[] {
    const groups: GroupedMove[] = [];

    for (const move of this.formattedMoves) {
      // S'assurer que move.moveNumber est un nombre en lui assignant 0 par défaut
      const moveNum: number =
        move.moveNumber !== undefined ? move.moveNumber : 0;
      // Rechercher un groupe existant par numéro de coup
      let group = groups.find((g) => g.moveNumber === moveNum);
      if (!group) {
        group = { moveNumber: moveNum };
        groups.push(group);
      }
      if (move.white) {
        group.white = move.white;
        group.whitePath = move.path;
        group.whiteEvaluation = move.whiteEvaluation;
        group.whitePrecision = move.whitePrecision;
      }
      if (move.black) {
        group.black = move.black;
        group.blackPath = move.path;
        group.blackEvaluation = move.blackEvaluation;
        group.blackPrecision = move.blackPrecision;
      }
    }
    return groups;
  }

  private findNextNode(currentNode: MoveNode): MoveNode | null {
    if (!currentNode) return null;

    // Déterminer la variante contenant ce nœud
    const variation = this.findVariationForNode(currentNode);
    if (!variation || !variation.nodes || variation.nodes.length === 0)
      return null;

    // Trouver l'index du nœud actuel dans cette variante
    const nodeIndex = variation.nodes.indexOf(currentNode);
    if (nodeIndex === -1) return null;

    // S'il y a un nœud suivant dans cette variante, le renvoyer
    if (nodeIndex < variation.nodes.length - 1) {
      return variation.nodes[nodeIndex + 1];
    }

    // Sinon, pas de coup suivant dans cette variante
    return null;
  }

  // Format de l'évaluation pour l'affichage
  formatEvaluation(evaluation: string): string {
    if (!evaluation) return "0.00";

    // Si c'est un mat
    if (evaluation.includes("Mat")) {
      return evaluation;
    }

    // Pour les valeurs numériques
    let numericValue = parseFloat(
      evaluation.replace(",", ".").replace("+", "")
    );

    // Si la valeur est supérieure à 10, la limiter pour l'affichage
    if (Math.abs(numericValue) > 10) {
      return numericValue > 0 ? "+10" : "-10";
    }

    // Formater avec le signe + si positif
    if (numericValue > 0) {
      return "+" + numericValue.toFixed(2).replace(".", ",");
    } else {
      return numericValue.toFixed(2).replace(".", ",");
    }
  }

  // Calculer la hauteur de la barre noire
  getBlackBarHeight(): string {
    if (!this.currentEvaluation) return "50%";

    // Si c'est un mat
    if (this.currentEvaluation.includes("Mat")) {
      if (this.currentEvaluation.includes("contre vous")) return "100%";
      return "0%";
    }

    // Convertir l'évaluation en nombre
    const evaluation = parseFloat(
      this.currentEvaluation.replace(",", ".").replace("+", "")
    );

    // Calculer la hauteur basée sur l'évaluation
    // L'évaluation va de -15 à +15, ce qui correspond à 0% à 100%
    let blackBarHeight = 50 - (evaluation / 15) * 100;

    // Limiter la hauteur entre 0% et 100%
    blackBarHeight = Math.max(0, Math.min(100, blackBarHeight));

    return blackBarHeight + "%";
  }

  updatePrecision(path: number[] | undefined, color: "white" | "black"): void {
    this.currentPrecision = undefined;

    if (!path || !this.formattedMoves) return;

    // Trouver le move formaté correspondant
    for (const move of this.formattedMoves) {
      if (!move.path || !this.arraysEqual(move.path, path)) continue;

      if (color === "white" && move.white) {
        this.currentPrecision = move.whitePrecision;
      } else if (color === "black" && move.black) {
        this.currentPrecision = move.blackPrecision;
      }
    }
  }

  // Méthode pour démarrer le mode replay des erreurs
  startReplayMistakes(color: "both" | "white" | "black" = "both"): void {
    this.replayMistakesColor = color;
    this.findMistakes();
  
    if (this.mistakesList.length === 0) {
      alert("Aucune erreur significative n'a été trouvée pour cette couleur.");
      return;
    }
  
    this.isReplayingMistakes = true;
    this.currentMistakeIndex = 0;
    this.goToMistake(0);
  }

  // Méthode pour aller à une erreur spécifique - version corrigée avec orientation inversée
  goToMistake(index: number): void {
    if (index < 0 || index >= this.mistakesList.length) return;
    
    const mistake = this.mistakesList[index];
    this.currentMistakeIndex = index;
    
    // Trouver le coup précédent pour afficher la position avant l'erreur
    const previousPosition = this.findPreviousPosition(mistake.path);
    if (!previousPosition) return;
    
    // Charger la position précédant l'erreur
    this.chess.load(previousPosition.fen);
    
    // Stocker le coup original qui était une erreur (pour référence)
    this.mistakeCorrectMove = `${mistake.originalMove.from}${mistake.originalMove.to}`;
    
    // Calculer qui doit jouer (blanc ou noir)
    const turnColor = this.chess.turn() === 'w' ? 'white' : 'black';
    
    // CORRECTION: INVERSER l'orientation par rapport à la couleur qui a commis l'erreur
    // Si l'erreur est des blancs, orienter pour voir du point de vue des noirs, et vice versa
    const boardOrientation = mistake.color === "white" ? "black" : "white";
    
    console.log(`Erreur de: ${mistake.color}, Trait aux: ${turnColor}, Orientation: ${boardOrientation}`);
    
    // CORRECTION DU BUG DE DÉCALAGE : Détruire et recréer l'échiquier
    if (this.chessground) {
      this.chessground.destroy();
      
      // Attendre que le DOM soit prêt
      setTimeout(() => {
        // Réinitialiser l'échiquier avec les nouvelles dimensions et positions
        this.chessground = Chessground(this.boardElement!.nativeElement, {
          fen: previousPosition.fen,
          turnColor: turnColor,
          orientation: boardOrientation, // Utiliser l'orientation inversée
          coordinates: true,
          movable: {
            color: turnColor,
            free: false,
            dests: this.getLegalMoves(),
            events: {
              after: (orig: string, dest: string) => this.handleMistakeMove(orig, dest, mistake)
            }
          },
          highlight: {
            lastMove: true,
            check: true,
          },
          animation: {
            enabled: true,
            duration: 200,
          },
          draggable: {
            enabled: true,
            distance: 3,
            autoDistance: true,
            showGhost: true,
          },
          lastMove: previousPosition.lastMove as Key[] | undefined
        });
        
        // Forcer un recalcul de la mise en page
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  }
  
  
  // Gérer le coup joué pendant le mode "rejouer erreurs" avec feedback amélioré
  handleMistakeMove(orig: string, dest: string, mistake: any): void {
    // Récupérer le coup joué
    const moveString = `${orig}${dest}`;
    
    // Récupérer le coup original (qui était une erreur)
    const originalMove = `${mistake.originalMove.from}${mistake.originalMove.to}`;
    
    // Trouver le meilleur coup selon l'analyse
    const bestMove = this.getBestMoveForPosition(mistake.path, mistake.color);
    
    console.log("----DÉBOGAGE RÉPONSE----");
    console.log(`Coup joué: ${moveString}`);
    console.log(`Coup erreur original: ${originalMove}`);
    console.log(`Meilleur coup à trouver: ${bestMove}`);
    console.log(`Couleur à jouer: ${mistake.color}`);
    console.log(`Position FEN: ${this.chess.fen()}`);
    console.log(`Trait aux: ${this.chess.turn() === 'w' ? 'Blancs' : 'Noirs'}`);
    console.log("-----------------------");
    
    // Obtenir la notation SAN du meilleur coup pour l'utiliser en interne seulement
    let bestMoveDisplay = "non disponible";
    if (bestMove) {
      try {
        const tempAnalysisChess = new Chess(this.chess.fen());
        const sanMove = tempAnalysisChess.move({
          from: bestMove.substring(0, 2) as Square,
          to: bestMove.substring(2, 4) as Square,
          promotion: bestMove.length > 4 ? bestMove.substring(4, 5) as any : undefined
        });
        
        if (sanMove) {
          bestMoveDisplay = sanMove.san;
        } else {
          bestMoveDisplay = `${bestMove.substring(0, 2)} → ${bestMove.substring(2, 4)}`;
        }
      } catch (e) {
        bestMoveDisplay = `${bestMove.substring(0, 2)} → ${bestMove.substring(2, 4)}`;
      }
    }
    
    // Jouer le coup que le joueur vient de faire
    const tempChess = new Chess(this.chess.fen());
    const move = tempChess.move({
      from: orig as Square,
      to: dest as Square,
      promotion: 'q'
    });
    
    if (!move) return;
    
    // Mise à jour de l'échiquier temporairement
    this.chessground.set({
      fen: tempChess.fen(),
      lastMove: [orig, dest]
    });
    
    // Si le joueur a trouvé le meilleur coup
    if (bestMove && moveString === bestMove) {
      // Feedback positif sans montrer le coup (puisque le joueur l'a déjà trouvé)
      this.feedbackMessage = `Excellent! Vous avez trouvé le meilleur coup.`;
      this.feedbackClass = "feedback-success";
      this.showFeedback = true;
      
      // Laisser le temps de voir le coup
      setTimeout(() => {
        this.showFeedback = false;
        setTimeout(() => this.nextMistake(), 800);
      }, 2000);
    }
    // Si le joueur a rejoué le même coup erroné
    else if (moveString === originalMove) {
      // Feedback négatif sans montrer le meilleur coup
      this.feedbackMessage = `C'était l'erreur originale. Essayez un autre coup.`;
      this.feedbackClass = "feedback-error";
      this.showFeedback = true;
      
      setTimeout(() => {
        this.chess.load(this.findPreviousPosition(mistake.path)!.fen);
        this.showFeedback = false;
        
        this.chessground.set({
          fen: this.chess.fen(),
          turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
          movable: {
            color: this.chess.turn() === 'w' ? 'white' : 'black',
            dests: this.getLegalMoves(),
            events: {
              after: (o: string, d: string) => this.handleMistakeMove(o, d, mistake)
            }
          }
        });
      }, 2000);
    }
    // Si le joueur a joué un autre coup qui n'est pas le meilleur
    else {
      // Feedback pour coup sous-optimal sans montrer le meilleur coup
      this.feedbackMessage = `Essayez de trouver un meilleur coup.`;
      this.feedbackClass = "feedback-warning";
      this.showFeedback = true;
      
      setTimeout(() => {
        this.chess.load(this.findPreviousPosition(mistake.path)!.fen);
        this.showFeedback = false;
        
        this.chessground.set({
          fen: this.chess.fen(),
          turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
          movable: {
            color: this.chess.turn() === 'w' ? 'white' : 'black',
            dests: this.getLegalMoves(),
            events: {
              after: (o: string, d: string) => this.handleMistakeMove(o, d, mistake)
            }
          }
        });
      }, 2000);
    }
  }
    

  // Nouvelle version de getBestMoveForPosition qui utilise directement la position FEN
  getBestMoveForPosition(path: number[], color: "white" | "black"): string | null {
    if (!path || path.length === 0 || !this.analysisResults || this.analysisResults.length === 0) return null;
    
    // Obtenir la position FEN actuelle
    const currentFEN = this.chess.fen();
    console.log(`Recherche du meilleur coup pour la position: ${currentFEN}`);
    
    // Rechercher cette position exacte dans les résultats d'analyse
    for (const analysis of this.analysisResults) {
      // Comparer les parties importantes du FEN (ignorer le compteur de demi-coups et le numéro de coup)
      const currentPositionParts = currentFEN.split(' ').slice(0, 4).join(' ');
      
      // Utiliser analysis.position au lieu de analysis.fen
      const analysisPositionParts = analysis.position?.split(' ').slice(0, 4).join(' ');
      
      if (currentPositionParts === analysisPositionParts) {
        console.log("✓ Position trouvée dans l'analyse!");
        console.log(`  bestMove: ${analysis.bestMove}`);
        
        // Utiliser directement le champ bestMove de l'analyse
        if (analysis.bestMove) {
          return analysis.bestMove;
        }
      }
    }
    
    // Si la position n'est pas trouvée, revenir à la méthode précédente comme fallback
    console.log("Position non trouvée dans analysisResults, utilisation de la méthode de secours");
    
    // Recherche dans moveEvaluations (méthode précédente)
    const key = color === "white" ? `w_${path.join("_")}` : `b_${path.join("_")}`;
    const evalData = this.moveEvaluations.get(key);
    
    if (evalData?.bestMove) {
      console.log(`✓ bestMove trouvé via moveEvaluations: ${evalData.bestMove}`);
      return evalData.bestMove;
    }
    
    // Recherche dans formattedMoves (méthode précédente)
    for (const move of this.formattedMoves) {
      if (!move.path || !this.arraysEqual(move.path, path)) continue;
      
      if (color === "white" && move.whiteBestMove) {
        console.log(`✓ bestMove trouvé via whiteBestMove: ${move.whiteBestMove}`);
        return move.whiteBestMove;
      }
      
      if (color === "black" && move.blackBestMove) {
        console.log(`✓ bestMove trouvé via blackBestMove: ${move.blackBestMove}`);
        return move.blackBestMove;
      }
    }
    
    console.log("✗ Aucun bestMove trouvé pour cette position");
    return null;
  }


  // Aller à l'erreur suivante
  nextMistake(): void {
    if (this.currentMistakeIndex < this.mistakesList.length - 1) {
      this.goToMistake(this.currentMistakeIndex + 1);
    } else {
      // Boucler au début si désiré
      // this.goToMistake(0);
      alert("C'était la dernière erreur.");
    }
  }

  // Aller à l'erreur précédente
  previousMistake(): void {
    if (this.currentMistakeIndex > 0) {
      this.goToMistake(this.currentMistakeIndex - 1);
    }
  }

  // Quitter le mode replay des erreurs avec vérifications améliorées
  exitReplayMistakes(): void {
    this.isReplayingMistakes = false;
    this.currentMistakeIndex = -1;
    this.mistakeCorrectMove = null;
    
    // Restaurer l'état de l'échiquier avec une recréation complète
    if (this.currentNode) {
      // Stocker une référence au currentNode avant le setTimeout
      const nodeToRestore = this.currentNode;
      
      // Détruire et recréer l'instance
      if (this.chessground) {
        this.chessground.destroy();
        
        setTimeout(() => {
          // Vérifier à nouveau que nodeToRestore est toujours valide
          if (!nodeToRestore) return;
          
          // Recréer l'échiquier avec l'état normal
          this.chessground = Chessground(this.boardElement!.nativeElement, {
            fen: nodeToRestore.fen,
            turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
            orientation: 'white',
            coordinates: true,
            movable: {
              color: 'both',
              free: false,
              dests: this.getLegalMoves(),
              events: {
                after: (orig: string, dest: string) => this.onMove(orig, dest)
              }
            },
            highlight: {
              lastMove: true,
              check: true,
            },
            animation: {
              enabled: true,
              duration: 200,
            },
            draggable: {
              enabled: true,
              distance: 3,
              autoDistance: true,
              showGhost: true,
            },
            lastMove: nodeToRestore.move ? 
                      [nodeToRestore.move.from, nodeToRestore.move.to] as Key[] : 
                      undefined
          });
          
          // Synchroniser et forcer un recalcul
          window.dispatchEvent(new Event('resize'));
          
          // Vérifier à nouveau que this.currentNode est toujours valide
          if (this.currentNode) {
            this.updateArrowsForMove(this.currentNode);
          }
        }, 50);
      }
    } else {
      // Si pas de currentNode, réinitialiser l'échiquier à sa position initiale
      this.resetBoard();
    }
  }

  // Nouveau - Trouver la position précédant une erreur
  findPreviousPosition(
    path: number[]
  ): { fen: string; lastMove?: [string, string] } | null {
    // Si nous sommes au premier coup, retourner la position initiale
    if (path.length === 0 || path[0] === 0) {
      return {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      };
    }

    // Obtenir l'index du coup précédent
    const previousIndex = path[0] - 1;

    // Trouver le nœud du coup précédent
    const previousNode = this.findNodeByIndex(previousIndex);
    if (!previousNode) return null;

    return {
      fen: previousNode.fen,
      lastMove: previousNode.move
        ? [previousNode.move.from, previousNode.move.to]
        : undefined,
    };
  }

  // Modifications à findMistakes pour afficher correctement les erreurs par couleur
  findMistakes(): void {
    this.mistakesList = [];

    if (!this.formattedMoves) return;

    for (const move of this.formattedMoves) {
      // CORRECTION: Quand on choisit "erreurs des blancs", on veut jouer en tant que blancs
      // donc on cherche les erreurs des noirs qui précèdent un coup blanc
      if (
        (this.replayMistakesColor === "both" || this.replayMistakesColor === "black") &&
        move.white &&
        move.whiteDelta !== undefined &&
        move.whiteDelta > this.mistakeThreshold &&
        move.path
      ) {
        // Trouver le node original correspondant à ce coup
        const node = this.findNodeByPath(move.path);
        if (node) {
          this.mistakesList.push({
            index: this.mistakesList.length,
            path: move.path,
            color: "white",  // C'est une erreur des blancs
            delta: move.whiteDelta,
            originalMove: node.move,
            moveNumber: move.moveNumber,
          });
        }
      }

      // CORRECTION: Quand on choisit "erreurs des noirs", on veut jouer en tant que noirs
      // donc on cherche les erreurs des blancs qui précèdent un coup noir
      if (
        (this.replayMistakesColor === "both" || this.replayMistakesColor === "white") &&
        move.black &&
        move.blackDelta !== undefined &&
        move.blackDelta > this.mistakeThreshold &&
        move.path
      ) {
        const node = this.findNodeByPath(move.path);
        if (node) {
          this.mistakesList.push({
            index: this.mistakesList.length,
            path: move.path,
            color: "black",  // C'est une erreur des noirs
            delta: move.blackDelta,
            originalMove: node.move,
            moveNumber: move.moveNumber,
          });
        }
      }
    }

    this.mistakesList.sort((a, b) => b.delta - a.delta); // Trier du plus grand delta au plus petit
    console.log(
      `Trouvé ${this.mistakesList.length} erreurs (${this.replayMistakesColor}) avec delta > ${this.mistakeThreshold}`
    );
  }

  // Modifier la méthode updateArrowsForMove pour prendre en compte le mode replay erreurs
  private updateArrowsForMove(node: MoveNode): void {
    console.log("Préparation des flèches pour le nœud:", node);

    // Créer un tableau de formes vide
    const shapes: Array<{
      orig: string;
      dest: string;
      brush: string;
      shape: string;
    }> = [];

    // Trouver le PROCHAIN coup dans la même variante pour la flèche rouge
    const nextNode = this.findNextNode(node);
    if (nextNode && nextNode.move.from && nextNode.move.to) {
      console.log(
        "Coup suivant trouvé:",
        nextNode.move.from,
        "→",
        nextNode.move.to
      );
      shapes.push({
        orig: nextNode.move.from,
        dest: nextNode.move.to,
        brush: "red",
        shape: "arrow",
      });

      // Flèche bleue pour le meilleur coup suivant (pas celui du coup actuel)
      // Ne pas montrer la flèche bleue si en mode replay des erreurs
      if (!this.isReplayingMistakes) {
        const nextPath = this.getPathToNode(nextNode);
        if (nextPath) {
          const nextKey =
            nextNode.move.color === "w"
              ? `w_${nextPath.join("_")}`
              : `b_${nextPath.join("_")}`;
          const nextEvalData = this.moveEvaluations.get(nextKey);
          if (nextEvalData?.bestMove?.length === 4) {
            shapes.push({
              orig: nextEvalData.bestMove.substring(0, 2),
              dest: nextEvalData.bestMove.substring(2, 4),
              brush: "blue",
              shape: "arrow",
            });
            console.log(
              "Meilleur coup alternatif trouvé:",
              nextEvalData.bestMove.substring(0, 2),
              "→",
              nextEvalData.bestMove.substring(2, 4)
            );
          }
        }
      }
    }

    // Le reste de la méthode reste identique...

    // Appliquer les flèches avec un léger délai
    setTimeout(() => {
      this.chessground.set({
        drawable: {
          enabled: true,
          visible: true,
          autoShapes: [],
          shapes: shapes,
        },
      });
      console.log("Flèches appliquées:", shapes);
    }, 50);
  }

  
}
