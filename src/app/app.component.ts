import { RouterOutlet } from '@angular/router';
import { LitchessApi } from '../api/litchess-api.service';
import { Component, OnInit } from '@angular/core';
import { Api } from '../api/api.service';
import { ChesscomApi} from '../api/chesscomapi.service';
import { PuzzleScraper } from '../analyse/puzzle'
import { AnalysisApi } from '../api/analysisApi.service';
import { LocalAnalysis } from '../analyse/localAnalysis.service';
// import test from 'node:test';

@Component({
  selector: 'unique-app-root',
  standalone: true, // Ajoutez cette ligne
  imports: [RouterOutlet],
  templateUrl: './app.component.html', // Gardez seulement templateUrl, supprimez template
  styleUrl: './app.component.css',
  host: { 'id': 'main-app-component' } // Ajoutez un identifiant unique
})
export class AppComponent implements OnInit {
  message: string = ''; // Variable pour afficher le résultat

  constructor(private LocalAnalysis : LocalAnalysis, private api: Api, private LitchessApi: LitchessApi, private ChesscomApi: ChesscomApi, private PuzzleScraper: PuzzleScraper, private AnalysisApi: AnalysisApi) {} // Injection du service

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
    //this.chess_comTests();
    //this.testPuzzle();
    this.localAnalysisTests();
  }


  async localAnalysisTests(): Promise<void> {
    
    console.log("======== Local Analysis =========");

    console.log("======== Tests Stockfish =========");
    this.LocalAnalysis.analyzeGame(this.pgnEx, 18);
    
  }

  async chess_comTests(): Promise<void> {

    console.log("======== Chess.com API =========");

    // Chargement des parties hors ligne
    this.ChesscomApi.getAllGamesOFFLINE();
    console.log("Parties chargées (OFFLINE) :", this.ChesscomApi.allGamesAllTypes.length);
  
    //this.testApi(this.ChesscomApi.allGamesAllTypes, "titouannnnnn");
  
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
