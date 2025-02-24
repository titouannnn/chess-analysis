import { Injectable } from '@angular/core';
import * as localData from '../assets/games.json';

@Injectable({
  providedIn: 'root'
})



/***************/

export class ChesscomApi {

allGames: any[] = []; /* Constante contenant toutes les parties d'un type (ou tous les types), Utiliser APRES avoir appelé sortbytype*/
allGamesAllTypes: any[] = []; /* Réponse de l'api, ne pas utiliser directement, prendre "allGames" */


public username = ""; /* Utiliser après avoir appelé getUsername */


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



}