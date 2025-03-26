import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LitchessApi } from '../api/litchess-api.service';
import { Api, Constantes } from '../api/api.service';
import { ChesscomApi} from '../api/chesscomapi.service';
import { PuzzleScraper } from '../analyse/puzzle.service';
import { AnalysisApi } from '../api/analysisApi.service';
import { LocalAnalysis } from '../analyse/localAnalysis.service';
import { NavbarComponent } from './navbar/navbar.component';


@Component({
  selector: 'unique-app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule, 
    FormsModule,
    NavbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  host: { 'id': 'main-app-component' }
})

export class AppComponent implements OnInit {
  message: string = '';
  showChessboard: boolean = false; // Propriété pour contrôler l'affichage
  currentFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Position initiale par défaut

  constructor(private LocalAnalysis : LocalAnalysis, private api: Api, private LitchessApi: LitchessApi, 
              private ChesscomApi: ChesscomApi, private PuzzleScraper: PuzzleScraper, 
              private AnalysisApi: AnalysisApi) {}

  // Ajouter une propriété pour stocker l'historique des coups
  moveHistory: any[] = [];

  // Méthode pour afficher l'échiquier
  displayChessboard() {
    this.showChessboard = true;
  }

  // Méthode pour masquer l'échiquier
  hideChessboard() {
    this.showChessboard = false;
  }

  // Méthode pour basculer l'affichage de l'échiquier
  toggleChessboard() {
    this.showChessboard = !this.showChessboard;
  }

  updatePosition() {
    // La position est déjà mise à jour par ngModel, 
    // mais nous pouvons effectuer des actions supplémentaires ici
    console.log('Mise à jour de la position FEN:', this.currentFen);
    
    // Afficher l'échiquier s'il n'est pas déjà visible
    if (!this.showChessboard) {
      this.showChessboard = true;
    }
  }

  pgnEx = `1. e3 d5 2. Ne2 Nc6 3. Ng3 e5 4. Be2 Nf6 5. O-O Bd6 6. Bd3 e4 7. Bb5 Bd7 8. Nh5
                                                                                              O-O 9. Nxf6+ Qxf6 10. Nc3 Qh6 11. g3 Bh3 12. Re1 Qg5 13. Ne2 h5 14. Nf4 Bxf4 15.
                                                                                              exf4 Qg6 16. Bxc6 bxc6 17. d4 h4 18. Be3 hxg3 19. fxg3 Bg4 20. Qd2 Bf3 21. b4 f5
                                                                                              22. c3 Kf7 23. a4 Rh8 24. Kf1 Rh6 25. Bg1 Rah8 26. c4 e3 27. Rxe3 Be4 28. cxd5
                                                                                              cxd5 29. b5 Qf6 30. Qc3 Rc8 31. a5 Qe6 32. b6 axb6 33. axb6 c6 34. b7 Rb8 35.
                                                                                              Ra7 Qd7 36. Qb4 Rhh8 37. Rb3 g5 38. fxg5 f4 39. Ra8 Qh3+ 40. Kf2 Qg2+ 41. Ke1
                                                                                              Qxg1+ 42. Kd2 Rxh2+ 43. Kc3 Qe1# 0-1`;

  ngOnInit(): void {
    console.log("Initialisation de l'application");
    //this.lichessTests();
    this.chess_comTests();
    //this.testPuzzle();

    //this.localAnalysisTests();
    //this.localAnalysisTests();
    //this.displayChessboard();
  }

  

  async localAnalysisTests(): Promise<void> {
    
    console.log("======== Local Analysis =========");

    console.log("======== Tests Stockfish =========");
    this.LocalAnalysis.analyzeGame(this.pgnEx, 2);
    
  }

  async chess_comTests(): Promise<void> {

    console.log("======== Chess.com API =========");
    // Chargement des parties hors ligne
    this.ChesscomApi.getAllGamesOFFLINE();
    console.log("Parties chargées (OFFLINE) :", this.ChesscomApi.allGamesAllTypes.length);
  
    this.testApi(this.ChesscomApi.allGamesAllTypes, "titouannnnnn");

  }

  async lichessTests(): Promise<void> {
    await this.LitchessApi.getIDLichessGames('coffeechessclub2023', 100);
    await this.LitchessApi.getInfoLichessGames();
    console.log(this.LitchessApi.allGames);
    this.LitchessApi.dataFormatage();
    console.log(this.LitchessApi.allGamesJson);
    
    console.log("======== Lichess API =========");

    this.api.allGames = JSON.parse(JSON.stringify(this.LitchessApi.allGamesJson));
    
    this.testApi(this.api.allGames, 'coffeechessclub2023');
    
  }

  testApi(tab: any[][], username: string) {

    console.log("===== Démarrage des tests =====");
    this.api.username = username;
    console.log("Parties passées en parametre à la fonction test :", tab.slice(0, 10));
    this.api.allGamesAllTypes = tab;
    console.log("Parties chargées :", this.api.allGamesAllTypes.slice(0, 10));
    // Tri par type de jeu (ALL GENparse
    // Initialisation de l'intervalle de temps

    this.api.initTimeInterval();
    
    this.api.setTimeTinterval(Constantes.Time.ALL_TIME,this.api.DATENULL, this.api.DATENULL);
    
    console.log("Date de début :", this.api.dateDebut);
    console.log("Date de fin :", this.api.dateFin);
    // Nombre de parties total

    console.log("Nombre total de parties dans l'intervalle :", this.api.allGames.length);

    // Winrate par couleur (WHITE)
    const winrateWhite = this.api.WinrateByColor(Constantes.CouleurPiece.WHITE);
    console.log("Statistiques pour les blancs :", winrateWhite);

    // Winrate par couleur (BLACK)
    const winrateBlack = this.api.WinrateByColor(Constantes.CouleurPiece.BLACK);
    console.log("Statistiques pour les noirs :", winrateBlack);

    // Liste des accuracies
    const accuracyList = this.api.getAccuracyList();
    console.log("Liste des accuracies :", accuracyList);

    // Accuracy moyenne
    const averageAccuracy = this.api.GetAccuracy();
    console.log("Accuracy moyenne :", averageAccuracy);

    // Liste des ELOs
    const eloList = this.api.getElo(Constantes.TypeJeuChessCom.RAPID);
    console.log("Liste des ELOs :", eloList);

    // Liste des ouvertures
    const openings = this.api.getOpenings();
    console.log("Liste des ouvertures :", openings);

    // Liste des fins de parties
    const endgames = this.api.getEndgames();
    console.log("Liste des fins de parties :", endgames);

    // Tableau des 10 dernières parties
    console.log("Tableau des parties :", this.api.allGames.slice(0, 10));
    
    console.log("===== Fin des tests =====");
  
  }

  async testPuzzle() {
    console.log("======== Puzzles Recommended =========");
    this.PuzzleScraper.collectPuzzlesByOpening("Italian-Game-Rousseau-Gambit");
    //this.PuzzleScraper.collectPuzzleByFen("r3kb1r/ppq2ppp/4pn2/2Ppn3/1P4bP/2P2N2/P3BPP1/RNBQ1RK1 b kq - 2 10")
    this.PuzzleScraper.sortPuzzlesByRating(500);
    console.log("Puzzles conseillés par openings : ");
    console.log(this.PuzzleScraper.puzzlesRecommendedByOpening);
    console.log("Themes d'un PGN : ");
    console.log(this.PuzzleScraper.detectThemesFromPGN(`
        [Event \"Live Chess\"]\n[Site \"Chess.com\"]\n[Date \"2021.02.06\"]\n[Round \"-\"]\n[White \"titouannnnnn\"]\n[Black \"g8614\"]\n[Result \"0-1\"]\n[CurrentPosition \"6k1/4ppbp/1p4p1/6P1/5P2/2rq3P/1r6/3KR3 w - -\"]\n[Timezone \"UTC\"]\n[ECO \"B07\"]\n[ECOUrl \"https://www.chess.com/openings/Pirc-Defense-Lions-Jaw-Variation-3...g6\"]\n[UTCDate \"2021.02.06\"]\n[UTCTime \"13:41:56\"]\n[WhiteElo \"519\"]\n[BlackElo \"576\"]\n[TimeControl \"600\"]\n[Termination \"g8614 won by checkmate\"]\n[StartTime \"13:41:56\"]\n[EndDate \"2021.02.06\"]\n[EndTime \"13:53:22\"]\n[Link \"https://www.chess.com/game/live/6469243047\"]\n\n1. e4 {[%clk 0:09:57.1]} 1... Nf6 {[%clk 0:09:57.5]} 2. f3 {[%clk 0:09:44.7]} 2... g6 {[%clk 0:09:47.4]} 3. d4 {[%clk 0:09:42.5]} 3... d6 {[%clk 0:09:42.6]} 4. Ne2 {[%clk 0:09:36.9]} 4... Bg7 {[%clk 0:09:40]} 5. Nec3 {[%clk 0:09:34.3]} 5... Nbd7 {[%clk 0:09:32.9]} 6. Be2 {[%clk 0:09:28.1]} 6... b6 {[%clk 0:09:20.7]} 7. O-O {[%clk 0:09:25.7]} 7... Bb7 {[%clk 0:09:13.7]} 8. b4 {[%clk 0:09:24.1]} 8... O-O {[%clk 0:09:10.8]} 9. h3 {[%clk 0:09:20.5]} 9... a5 {[%clk 0:09:00.1]} 10. a3 {[%clk 0:09:16.1]} 10... axb4 {[%clk 0:08:53]} 11. axb4 {[%clk 0:09:09.1]} 11... Rxa1 {[%clk 0:08:47.8]} 12. Ba3 {[%clk 0:08:55.3]} 12... c6 {[%clk 0:08:16.7]} 13. Bb2 {[%clk 0:08:38.5]} 13... Ra7 {[%clk 0:07:51.2]} 14. b5 {[%clk 0:08:27.9]} 14... cxb5 {[%clk 0:07:44.9]} 15. Nxb5 {[%clk 0:08:26]} 15... Ra4 {[%clk 0:07:27.5]} 16. N1c3 {[%clk 0:08:16]} 16... Ra5 {[%clk 0:06:59.3]} 17. g4 {[%clk 0:08:04.4]} 17... Bc6 {[%clk 0:06:47.9]} 18. e5 {[%clk 0:07:54.2]} 18... dxe5 {[%clk 0:06:32.6]} 19. dxe5 {[%clk 0:07:51.8]} 19... Bxb5 {[%clk 0:06:19]} 20. Nxb5 {[%clk 0:07:48.4]} 20... Ra2 {[%clk 0:06:01.8]} 21. Qc1 {[%clk 0:07:41.1]} 21... Nxe5 {[%clk 0:05:52.9]} 22. Rd1 {[%clk 0:07:37.1]} 22... Qa8 {[%clk 0:05:36.6]} 23. f4 {[%clk 0:07:19.6]} 23... Nc6 {[%clk 0:05:01.9]} 24. g5 {[%clk 0:07:09.3]} 24... Ne4 {[%clk 0:04:50.7]} 25. Bd3 {[%clk 0:06:58.3]} 25... Ng3 {[%clk 0:04:35.2]} 26. Re1 {[%clk 0:06:49.4]} 26... Rd8 {[%clk 0:04:23.1]} 27. Be2 {[%clk 0:06:35.3]} 27... Nd4 {[%clk 0:04:01.7]} 28. c3 {[%clk 0:06:30.3]} 28... Ndxe2+ {[%clk 0:03:57.9]} 29. Kf2 {[%clk 0:06:20.7]} 29... Nxc1 {[%clk 0:03:48.7]} 30. Rxc1 {[%clk 0:06:11.6]} 30... Rxb2+ {[%clk 0:03:42.4]} 31. Kxg3 {[%clk 0:06:08.6]} 31... Rxb5 {[%clk 0:03:41]} 32. Rf1 {[%clk 0:06:00.6]} 32... Rd3+ {[%clk 0:03:37.6]} 33. Kf2 {[%clk 0:05:54.1]} 33... Rxc3 {[%clk 0:03:33.9]} 34. Ke2 {[%clk 0:05:51.1]} 34... Rb2+ {[%clk 0:03:30.1]} 35. Kd1 {[%clk 0:05:47.3]} 35... Qe4 {[%clk 0:03:19.6]} 36. Re1 {[%clk 0:05:41.4]} 36... Qd3# {[%clk 0:03:11.2]} 0-1\n

      `));
    /*
    for(let url of this.PuzzleScraper.puzzlesUrl) {
      console.log(url);
    }
      */
      
    console.log("Nombre d'URL : " + this.PuzzleScraper.puzzlesRecommendedByOpening.length);
    await this.PuzzleScraper.detectMostFrequentThemes();
    console.log("Themes les plus fréquents : ");
    console.log(this.PuzzleScraper.losesPlayerData);

    /*
    console.log("Objet json du fichier trié : ");
    console.log(this.PuzzleScraper.sortJsonKeepOpenings());
    */
    
  }

  // Méthode appelée quand la position de l'échiquier change
  onPositionChanged(fenPosition: string) {
    console.log('Position FEN mise à jour:', fenPosition);
    this.currentFen = fenPosition;
  }
  
  // Méthode appelée quand l'historique des coups change
  onMoveHistoryChanged(moves: any[]) {
    console.log('Historique des coups mis à jour:', moves);
    this.moveHistory = moves;
  }
}

