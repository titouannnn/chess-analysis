import { LitchessApi } from '../api/litchess-api.service';
import { Component, OnInit } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { PuzzleScraper } from '../analyse/puzzle'
import { StatsEloComponent } from './stats-elo/stats-elo.component';
import { NgModule } from '@angular/core';
import { Chess } from 'chess.js';
import { Api, Constantes } from '../api/api.service';
import { ChesscomApi} from '../api/chesscomapi.service';
import { AnalysisApi } from '../api/analysisApi.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule ,FormsModule ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private message: string = ''; // Variable pour afficher le résultat
  private api: Api;
  constructor( private LitchessApi: LitchessApi, private ChesscomApi: ChesscomApi, private PuzzleScraper: PuzzleScraper, private AnalysisApi: AnalysisApi, private statsComponent : StatsEloComponent) {
    this.api = ChesscomApi;
  } // Injection du service

  pgnEx = "[Event \"Live Chess\"]\n[Site \"Chess.com\"]\n[Date \"2021.02.06\"]\n[Round \"-\"]\n[White \"titouannnnnn\"]\n[Black \"lexus2002\"]\n[Result \"0-1\"]\n[CurrentPosition \"r1b1r1k1/pppp2pp/8/5p2/P1Pb2n1/R6P/1P1P2Bq/1NB2Q1K w - -\"]\n[Timezone \"UTC\"]\n[ECO \"C44\"]\n[ECOUrl \"https://www.chess.com/openings/Dresden-Opening-3...Nf6\"]\n[UTCDate \"2021.02.06\"]\n[UTCTime \"11:42:39\"]\n[WhiteElo \"623\"]\n[BlackElo \"816\"]\n[TimeControl \"600\"]\n[Termination \"lexus2002 won by checkmate\"]\n[StartTime \"11:42:39\"]\n[EndDate \"2021.02.06\"]\n[EndTime \"11:55:43\"]\n[Link \"https://www.chess.com/game/live/6468368822\"]\n\n1. e4 {[%clk 0:10:00]} 1... e5 {[%clk 0:09:54.7]} 2. Nf3 {[%clk 0:09:52.8]} 2... Nf6 {[%clk 0:09:34.8]} 3. c4 {[%clk 0:09:50.4]} 3... Nc6 {[%clk 0:08:59.5]} 4. Be2 {[%clk 0:09:44.3]} 4... Bc5 {[%clk 0:08:24.9]} 5. O-O {[%clk 0:09:38.1]} 5... Nxe4 {[%clk 0:08:15.6]} 6. Bd3 {[%clk 0:09:29.9]} 6... f5 {[%clk 0:07:20.8]} 7. Re1 {[%clk 0:09:22.6]} 7... Bxf2+ {[%clk 0:07:03.5]} 8. Kh1 {[%clk 0:09:02.3]} 8... O-O {[%clk 0:06:19.4]} 9. h3 {[%clk 0:08:58.4]} 9... Ng3+ {[%clk 0:06:00.7]} 10. Kh2 {[%clk 0:08:46.6]} 10... Re8 {[%clk 0:05:23.4]} 11. Rf1 {[%clk 0:08:33.9]} 11... Nxf1+ {[%clk 0:04:37.7]} 12. Qxf1 {[%clk 0:08:25.7]} 12... Bd4 {[%clk 0:04:27]} 13. g4 {[%clk 0:08:12.1]} 13... e4 {[%clk 0:04:10.8]} 14. Be2 {[%clk 0:07:19.8]} 14... exf3 {[%clk 0:03:50.3]} 15. Bxf3 {[%clk 0:07:14.4]} 15... Ne5 {[%clk 0:03:30.4]} 16. Bg2 {[%clk 0:06:58.5]} 16... Qh4 {[%clk 0:02:56.1]} 17. a4 {[%clk 0:06:53]} 17... Nxg4+ {[%clk 0:02:40.9]} 18. Kh1 {[%clk 0:06:44.8]} 18... Nf2+ {[%clk 0:02:30.5]} 19. Kg1 {[%clk 0:06:22.6]} 19... Qg3 {[%clk 0:02:17.4]} 20. Ra3 {[%clk 0:06:19.5]} 20... Ng4+ {[%clk 0:01:29.2]} 21. Kh1 {[%clk 0:05:48.5]} 21... Qh2# {[%clk 0:01:18]} 0-1\n";

  ngOnInit(): void {
    console.log("Initialisation de l'application");
    //this.lichessTests();
    //this.chess_comTests();
    //this.testPuzzle();
    //this.analysisApiTests();
    //this.statsComponent.showEloStat();
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
    console.log("URL des puzzles conseillés : ");
    console.log(this.PuzzleScraper.puzzlesUrl[0]);
    /*
    for(let url of this.PuzzleScraper.puzzlesUrl) {
      console.log(url);
    }
      */
    console.log("Nombre d'URL : " + this.PuzzleScraper.puzzlesUrl.length);
    /*
    console.log("Objet json du fichier trié : ");
    console.log(this.PuzzleScraper.sortJsonKeepOpenings());
    */
    
  }
  
}

