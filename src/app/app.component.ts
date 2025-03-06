import { RouterOutlet } from '@angular/router';
import { LitchessApi } from '../api/litchess-api.service';
import { Component, OnInit } from '@angular/core';
import { Api } from '../api/api.service';
import { ChesscomApi} from '../api/chesscomapi.service';
import { PuzzleScraper } from '../analyse/puzzle'
import { AnalysisApi } from '../api/analysisApi.service';
// import test from 'node:test';

@Component({
  selector: 'app-root',
  template: '<div>{{ message }}</div>',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})


export class AppComponent implements OnInit {
  message: string = ''; // Variable pour afficher le résultat

  constructor(private api: Api, private LitchessApi: LitchessApi, private ChesscomApi: ChesscomApi, private PuzzleScraper: PuzzleScraper, private AnalysisApi: AnalysisApi) {} // Injection du service

  pgnEx = "[Event \"Live Chess\"]\n[Site \"Chess.com\"]\n[Date \"2021.02.06\"]\n[Round \"-\"]\n[White \"titouannnnnn\"]\n[Black \"lexus2002\"]\n[Result \"0-1\"]\n[CurrentPosition \"r1b1r1k1/pppp2pp/8/5p2/P1Pb2n1/R6P/1P1P2Bq/1NB2Q1K w - -\"]\n[Timezone \"UTC\"]\n[ECO \"C44\"]\n[ECOUrl \"https://www.chess.com/openings/Dresden-Opening-3...Nf6\"]\n[UTCDate \"2021.02.06\"]\n[UTCTime \"11:42:39\"]\n[WhiteElo \"623\"]\n[BlackElo \"816\"]\n[TimeControl \"600\"]\n[Termination \"lexus2002 won by checkmate\"]\n[StartTime \"11:42:39\"]\n[EndDate \"2021.02.06\"]\n[EndTime \"11:55:43\"]\n[Link \"https://www.chess.com/game/live/6468368822\"]\n\n1. e4 {[%clk 0:10:00]} 1... e5 {[%clk 0:09:54.7]} 2. Nf3 {[%clk 0:09:52.8]} 2... Nf6 {[%clk 0:09:34.8]} 3. c4 {[%clk 0:09:50.4]} 3... Nc6 {[%clk 0:08:59.5]} 4. Be2 {[%clk 0:09:44.3]} 4... Bc5 {[%clk 0:08:24.9]} 5. O-O {[%clk 0:09:38.1]} 5... Nxe4 {[%clk 0:08:15.6]} 6. Bd3 {[%clk 0:09:29.9]} 6... f5 {[%clk 0:07:20.8]} 7. Re1 {[%clk 0:09:22.6]} 7... Bxf2+ {[%clk 0:07:03.5]} 8. Kh1 {[%clk 0:09:02.3]} 8... O-O {[%clk 0:06:19.4]} 9. h3 {[%clk 0:08:58.4]} 9... Ng3+ {[%clk 0:06:00.7]} 10. Kh2 {[%clk 0:08:46.6]} 10... Re8 {[%clk 0:05:23.4]} 11. Rf1 {[%clk 0:08:33.9]} 11... Nxf1+ {[%clk 0:04:37.7]} 12. Qxf1 {[%clk 0:08:25.7]} 12... Bd4 {[%clk 0:04:27]} 13. g4 {[%clk 0:08:12.1]} 13... e4 {[%clk 0:04:10.8]} 14. Be2 {[%clk 0:07:19.8]} 14... exf3 {[%clk 0:03:50.3]} 15. Bxf3 {[%clk 0:07:14.4]} 15... Ne5 {[%clk 0:03:30.4]} 16. Bg2 {[%clk 0:06:58.5]} 16... Qh4 {[%clk 0:02:56.1]} 17. a4 {[%clk 0:06:53]} 17... Nxg4+ {[%clk 0:02:40.9]} 18. Kh1 {[%clk 0:06:44.8]} 18... Nf2+ {[%clk 0:02:30.5]} 19. Kg1 {[%clk 0:06:22.6]} 19... Qg3 {[%clk 0:02:17.4]} 20. Ra3 {[%clk 0:06:19.5]} 20... Ng4+ {[%clk 0:01:29.2]} 21. Kh1 {[%clk 0:05:48.5]} 21... Qh2# {[%clk 0:01:18]} 0-1\n";

  ngOnInit(): void {
    console.log("Initialisation de l'application");
    //this.lichessTests();
    this.chess_comTests();
    //this.testPuzzle();
    //this.analysisApiTests();
  }
  
  async analysisApiTests(): Promise<void> {

    console.log("======== Analysis API =========");


    console.log("======== Tests fen diviser =========");
    this.AnalysisApi.gameAnalysis(this.pgnEx);
    
  }

  async chess_comTests(): Promise<void> {

    console.log("======== Chess.com API =========");

    // Chargement des parties hors ligne
    this.ChesscomApi.getAllGamesOFFLINE();
    console.log("Parties chargées (OFFLINE) :", this.ChesscomApi.allGamesAllTypes.length);
  
    this.testApi(this.ChesscomApi.allGamesAllTypes, "titouannnnnn");
  
  }

  async lichessTests(): Promise<void> {
    await this.LitchessApi.getIDLichessGames('titouannn', 100);
    await this.LitchessApi.getInfoLichessGames();
    console.log(this.LitchessApi.allGames);
    this.LitchessApi.dataFormatage();
    console.log(this.LitchessApi.allGamesJson);
    
    console.log("======== Lichess API =========");

    this.api.allGames = JSON.parse(JSON.stringify(this.LitchessApi.allGamesJson));
    
    this.testApi(this.api.allGames, 'titouannn');
    
  }

  testApi(tab: any[][], username: string) {

    console.log("===== Démarrage des tests =====");
    this.api.username = username;
    console.log("Parties passées en parametre à la fonction test :", tab.slice(0, 10));
    this.api.allGamesAllTypes = tab;
    console.log("Parties chargées :", this.api.allGamesAllTypes.slice(0, 10));
    // Tri par type de jeu (ALL GENRES)
    this.api.sortByGameType(this.api.ALL_GENRES);
    console.log("Parties triées (ALL GENRES) :", this.api.allGames.slice(0, 10));

    // Initialisation de l'intervalle de temps
    this.api.initTimeInterval();
    this.api.setTimeTinterval(this.api.ALL_TIME,this.api.DATENULL, this.api.DATENULL);
    
    console.log("Date de début :", this.api.dateDebut);
    console.log("Date de fin :", this.api.dateFin);
    // Nombre de parties total

    console.log("Nombre total de parties dans l'intervalle :", this.api.allGames.length);

    // Winrate par couleur (WHITE)
    const winrateWhite = this.api.WinrateByColor(this.api.WHITE);
    console.log("Statistiques pour les blancs :", winrateWhite);

    // Winrate par couleur (BLACK)
    const winrateBlack = this.api.WinrateByColor(this.api.BLACK);
    console.log("Statistiques pour les noirs :", winrateBlack);

    
    // Liste des accuracies
    const accuracyList = this.api.getAccuracyList();
    console.log("Liste des accuracies :", accuracyList);

    // Accuracy moyenne
    const averageAccuracy = this.api.GetAccuracy();
    console.log("Accuracy moyenne :", averageAccuracy);

    // Liste des ELOs
    const eloList = this.api.getElo();
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
}
