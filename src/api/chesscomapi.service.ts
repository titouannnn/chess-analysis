import { Injectable } from '@angular/core';
import * as localData from '../assets/games.json';
import { Api, Constantes } from './api.service';

@Injectable({
  providedIn: 'root'
})
/***************/

export class ChesscomApi extends Api {
  constructor() {
    super();
    // Ne plus appeler this.initialize() ici
    // L'initialisation sera appelée explicitement depuis la page d'accueil
  }

  // pas utile, fonction de test, à modifier par ceux qui font le front end pour avoir l'username rentré dans la page
  getUsername(name: string) {
    this.username = name;
    // Supprimer cette ligne qui écrase le nom d'utilisateur
    // this.username = "titouannnnnn"; 
    console.log("username :", this.username);
    return this.username;
  }

/* Récupère dans allGamesAllTypes toutes les parties de l'utilisateur */



async getAllGamesONLINE(progressCallback?: (progress: number) => void) {
  console.log(`Récupération des parties en ligne pour ${this.username}...`);
  
  // Vider le tableau des parties pour éviter les doublons si la fonction est appelée plusieurs fois
  this.allGamesAllTypes = [];
  
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

    // Ajouter un log pour voir le nombre d'archives
    console.log(`${archiveData.archives.length} archives trouvées pour ${this.username}`);

    const archivesToProcess = archiveData.archives;
    const totalArchives = archivesToProcess.length;
    
    // Initialiser la progression à 0
    if (progressCallback) {
      progressCallback(0);
    }

    for (let i = 0; i < archivesToProcess.length; i++) {
      const archiveUrl = archivesToProcess[i];
      console.log(`Récupération des parties de ${archiveUrl} (${i+1}/${totalArchives})`);
      
      const response = await fetch(archiveUrl);
      if (!response.ok) {
        console.warn(`Erreur pour ${archiveUrl}: ${response.status}`);
        continue; // Passer à l'archive suivante en cas d'erreur
      }
      const data = await response.json();
      
      if (data.games && Array.isArray(data.games)) {
        this.allGamesAllTypes.push(...data.games);
        console.log(`+ ${data.games.length} parties ajoutées`);
      }
      
      // Mise à jour de la progression
      if (progressCallback) {
        const progress = Math.round(((i + 1) / totalArchives) * 100);
        progressCallback(progress);
      }
    }
    
    console.log(`Total: ${this.allGamesAllTypes.length} parties récupérées`);
  } catch (error) {
    console.error("Erreur lors de la récupération des parties en ligne:", error);
    throw error; // Propager l'erreur pour pouvoir la gérer dans le composant
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
 * Une fois l'initialisation spécifique  Chess.com est réalisé
 * On utilise la méthode abstraite de @see Api intermédiaire qui est 
 * capable d'initialiser toutes les différentes API
 */
async initWithProgress(progressCallback?: (progress: number) => void): Promise<void> {
  console.log(" ============= Chess.com API Initialisation avec progression ============ ");
  await this.getAllGamesONLINE(progressCallback);
  this.initialize(this.allGamesAllTypes, this.username);
}

/**
 * Implémentation de la méthode initialize héritée de la classe Api
 * Cette signature doit correspondre exactement à celle de la classe parente
 */
override initialize(tab: any[][], username: string): void {
  console.log(" ============= Chess.com API Initialize (méthode héritée) ============ ");
  super.initialize(tab, username);
}

override getElo(time_class?: Constantes.TypeJeuChessCom): { timestamp: number; rating: number; }[] | undefined {
  const result: { timestamp: number; rating: number; }[] = [];
  
  console.log(`Récupération des données ELO pour le type de jeu: ${time_class}`);
  
  // Vérifier que allGames contient des données
  if (!this.allGames || this.allGames.length === 0) {
    console.warn("Aucune partie disponible pour récupérer l'ELO");
    return [];
  }
  
  // Debug des dates actuelles
  console.log(`Filtrage par période: ${this.dateDebut.toISOString()} à ${this.dateFin.toISOString()}`);
  
  // Map pour suivre les elos uniques et éviter les doublons proches dans le temps
  // (souvent plusieurs parties le même jour avec le même elo)
  const eloMap = new Map<string, number>();
  
  // Parcourir toutes les parties déjà filtrées par type de jeu via sortByGameType
  for (const game of this.allGames) {
    try {
      // Vérification des données nécessaires
      if (!game || !game.pgn || !game.end_time) {
        continue;
      }
      
      // Extraire la date du PGN pour le filtre temporel
      const dateMatch = game.pgn.match(this.RegExpDate);
      if (!dateMatch || !dateMatch[1]) {
        continue;
      }
      
      const gameDate = new Date(dateMatch[1]);
      
      // Vérifier si la date est dans la plage demandée
      if (gameDate < this.dateDebut || gameDate > this.dateFin) {
        continue;
      }
      
      // Identifier le joueur (blanc ou noir)
      const isWhite = game.white && game.white.username && 
                      game.white.username.toLowerCase() === this.username.toLowerCase();
      const isBlack = game.black && game.black.username && 
                      game.black.username.toLowerCase() === this.username.toLowerCase();
      
      if (!isWhite && !isBlack) {
        continue;
      }
      
      // Obtenir les données du joueur
      const playerData = isWhite ? game.white : game.black;
      
      // Vérifier que le rating est disponible
      if (!playerData || !playerData.rating) {
        continue;
      }
      
      // Créer une clé unique pour cette entrée d'ELO (par jour)
      const date = new Date(game.end_time * 1000); // Convertir timestamp UNIX en ms
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      // N'ajouter que si on n'a pas déjà une entrée pour cette date
      // ou si le rating est différent (progression dans la journée)
      if (!eloMap.has(dateKey) || Math.abs(eloMap.get(dateKey)! - playerData.rating) > 5) {
        eloMap.set(dateKey, playerData.rating);
        
        result.push({
          timestamp: game.end_time,
          rating: playerData.rating
        });
      }
    } catch (error) {
      console.error("Erreur lors du traitement d'une partie:", error);
    }
  }
  
  // Trier le résultat par timestamp croissant
  result.sort((a, b) => a.timestamp - b.timestamp);
  
  console.log(`${result.length} entrées ELO trouvées pour ${time_class || 'tous les types'}`);
  
  // Si aucune entrée n'est trouvée, retourner un tableau vide mais pas undefined
  return result.length > 0 ? result : [];
}



}