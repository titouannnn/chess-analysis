import { RouterOutlet } from '@angular/router';
import { LitchessApi } from '../api/litchess-api.service';
import { Component, OnInit } from '@angular/core';
import { Api } from '../api/api.service';

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

  constructor(private api: Api, private LitchessApi: LitchessApi) {} // Injection du service

  ngOnInit(): void {
    console.log("Initialisation de l'application");
    this.message = this.api.getUsername(""); // Appel de la fonction getUsername
    //this.initializeSettings();
    console.log("Tests lichess");
    this.lichessTests();
  }
  

  async initializeSettings(): Promise<void> {
    console.log("===== Démarrage des tests =====");

    // Initialisation de l'username
    const username = this.api.getUsername("titouannnnnn");
    console.log("Utilisateur : " + username);

    // Chargement des parties hors ligne
    this.api.getAllGamesOFFLINE();
    console.log("Parties chargées (OFFLINE) :", this.api.allGamesAllTypes.length);

    // Tri par type de jeu (RAPID)
    this.api.sortByGameType(this.api.RAPID);
    console.log("Parties triées (RAPID) :", this.api.allGames.length);

    // Initialisation de l'intervalle de temps
    this.api.initTimeInterval();
    console.log("Date de début :", this.api.dateDebut);
    console.log("Date de fin :", this.api.dateFin);

    // Modification de l'intervalle (1 an)
    this.api.setTimeTinterval(this.api.YEAR, this.api.DATENULL, this.api.DATENULL);
    console.log("Nouvelle date de début :", this.api.dateDebut);

    // Nombre de parties total
    this.api.getNombrePartiesTotal();
    console.log("Nombre total de parties dans l'intervalle :", this.api.nombrePartiesTotal);

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

    console.log("===== Fin des tests =====");
  }

  async lichessTests(): Promise<void> {
    await this.LitchessApi.getIDLichessGames('TITOUAN', 10);
    console.log(this.LitchessApi.gamesID);
    await this.LitchessApi.getInfoLichessGames();
    console.log(this.LitchessApi.allGames);
    
  }
}
