import { RouterOutlet } from '@angular/router';
import { LitchessApi } from '../api/litchess-api.service';
import { Component, OnInit } from '@angular/core';
import { Api } from '../api/api.service';
import { ChesscomApi} from '../api/chesscomapi.service';
import { PuzzleScraper } from '../analyse/puzzle'
// import test from 'node:test';

@Component({
  selector: 'app-root',
  template: '<div>{{ message }}</div>',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
/*
export class AppComponent {
  title = 'WEb';
  constructor(private LitchessApiService: LitchessApiService) {}

  async ngOnInit() {
    console.log('Hello, world!');
    await this.LitchessApiService.getIDLichessGames('TITOUAN', 10);
    console.log(this.LitchessApiService.gamesID);
    await this.LitchessApiService.getInfoLichessGames();
    console.log(this.LitchessApiService.allGames);
    await this.LitchessApiService.sortJson(this.LitchessApiService.allGames);
  }
*/
export class AppComponent implements OnInit {
  message: string = ''; // Variable pour afficher le résultat

  constructor(private api: Api, private LitchessApi: LitchessApi, private ChesscomApi: ChesscomApi, private PuzzleScraper: PuzzleScraper) {} // Injection du service

  ngOnInit(): void {
    console.log("Initialisation de l'application");
    //this.lichessTests();
    //this.chess_comTests();
    this.testPuzzle();
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
    this.PuzzleScraper.collectPuzzlesByOpening("Kings Dresden");
    console.log("URL des puzzles conseillés : ");
    for(let url of this.PuzzleScraper.puzzlesUrl) {
      console.log(url);
    }
    console.log("Nombre d'URL : " + this.PuzzleScraper.puzzlesUrl.length);
    

  }
}
