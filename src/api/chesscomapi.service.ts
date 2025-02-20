import { Injectable } from '@angular/core';
import * as localData from '../../assets/games.json';
import { Api, Constantes } from './api.service';

@Injectable({
  providedIn: 'root'
})
/***************/

export class ChesscomApi extends Api {

  constructor(){
    super();
    this.initialize();
  }

// pas utile, fonction de test, à modifier par ceux qui font le front end pour avoir l'username rentré dans la page
getUsername(name: string) {
  this.username = name;
  // vaut "titouannnnnn" pour test 
  this.username = "titouannnnnn";
  console.log("username :", this.username);
  return this.username;
}

/* Récupère dans allGamesAllTypes toutes les parties de l'utilisateur */

async getAllGamesONLINE() {
  try {
    const archiveResponse = await fetch(
      `https://api.chess.com/pub/player/${this.username}/games/archives`
    );
    if (!archiveResponse.ok) {
      throw new Error(
        `Erreur lors de la récupération des archives: ${archiveResponse.status}`
      );
    }

    const archiveData = await archiveResponse.json();

    for (const archiveUrl of archiveData.archives) {
      const response = await fetch(archiveUrl);
      if (!response.ok) {
        throw new Error(
          `Erreur lors de la récupération des parties: ${response.status}`
        );
      }
      const data = await response.json();
      // Itère les valeurs dans AllGamesAllTypes
      this.allGamesAllTypes.push(...data.games);
    }
    console.log("ouaisss")
    console.log(this.allGamesAllTypes);
  } catch (error) {
    console.error("Erreur :", error);
  }
}

/* A utiliser en phase de test - Récupère dans allGamesAllTypes toutes les parties de l'utilisateur via le fichier chargé */
getAllGamesOFFLINE() {
  console.log("Tentative de récupération des parties hors ligne");
  try {
    // Vérifie que localData est un tableau et qu'il contient des objets avec la clé "games".
    const data = (localData as any).default || localData; // Gère les différences d'importation
    if (!Array.isArray(data)) {
      throw new Error("Le format des données JSON est invalide.");
    }

    for (const item of data) {
      if (item.games && Array.isArray(item.games)) {
        this.allGamesAllTypes.push(...item.games);
      } else {
        console.warn("L'élément ne contient pas de propriété 'games' valide :", item);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des parties hors ligne", error);
  }
  //console.log("Les données ont été récupérées :", this.allGamesAllTypes);
  console.log("Les données ont été récupérées ");
}

/**
 * Initialisation de l'API Chess.com. 
 * On utilise une méthode intermédiaire qui est 
 * capable d'initialiser toutes les différentes API
 */
  override async initialize(){
    
    console.log(" ============= Chess.com API Initialisation ============ ");
    this.getAllGamesOFFLINE();
    
    super.initialize( this.allGamesAllTypes, 'titouannnnnn' );
  }

  override getElo( time_class ?: Constantes.TypeJeuChessCom ) {
    let eloList = [];
    for (const game of this.allGames) {
      const match = game.pgn.match(this.RegExpDate);
      if(!match) continue;
      const gameDate = new Date(match[1]);
      if( !(gameDate >= this.dateDebut) || !(gameDate <= this.dateFin)) continue;

      if (game.white.username == this.username && game.white.rating && (!game.time_class || game.time_class == time_class)) {
        eloList.push({ timestamp: game.end_time, rating: game.white.rating });
      } else if (game.black.username == this.username && game.black.rating && (!game.time_class || game.time_class == time_class)) {
        eloList.push({ timestamp: game.end_time, rating: game.black.rating });
      } else {
        console.error("Erreur couleur joueur");
      }  
    
    }
    return eloList;
  }

}