import { Injectable } from '@angular/core';
import { Api, Constantes } from './api.service';

interface EndgameWinLoseData {
  checkmate: number;
  timeout: number;
  resign: number;
  abandonned: number;
  [key: string]: number; // Permet d'utiliser n'importe quelle chaîne comme clé
}

interface EndgameDrawData {
  stalemate: number;
  repetition: number;
  insufficient: number;
  agreement: number;
  [key: string]: number; // Permet d'utiliser n'importe quelle chaîne comme clé
}

@Injectable({
  providedIn: 'root'
})


export class LitchessApi extends Api {
  public gamesID: string[] = [];
  public override allGames: any[] = []; 
  public allGamesJson: any[] = [];
  public override username: string = ''; 

  // Fonction permettant de récupérer les parties d'un joueur sur lichess
  async getIDLichessGames(username: string, max: number = 200): Promise<void> {
    this.username = username; // Stocker le nom d'utilisateur
    // URL pour spécifier le type de parties, le nombre de parties à récupérer, etc.
    const url = `https://lichess.org/api/games/user/${username}?max=${max}`;

    try {
      console.log(`Récupération des parties Lichess pour ${username}...`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/x-ndjson',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Le corps de la réponse est vide.');
      }

      const decoder = new TextDecoder('utf-8');
      let result = '';
      let done = false;

      // Lecture des données en flux et traitement
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        result += decoder.decode(value || new Uint8Array(), { stream: !done });
      }

      // Traiter les données en JSON
      const games: any[] = result.split('\n').filter(Boolean).map((line) => JSON.parse(line));
      this.gamesID = games.map(game => game.id);
      console.log(`✅ ${this.gamesID.length} IDs de parties Lichess récupérés pour ${username}`);
      
      // Stocker directement les parties complètes
      this.allGames = games;
      
      // Formater les données immédiatement
      this.dataFormatage();
      
      // Initialiser les dates par défaut
      this.initTimeInterval();
      
      return;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des parties Lichess:', error);
      throw error;
    }
  }

  async getInfoLichessGames() {
    // Cette méthode n'est plus strictement nécessaire si nous utilisons directement
    // les données du flux, mais nous la conservons pour la compatibilité
    if (this.allGames && this.allGames.length > 0 && this.allGamesJson.length > 0) {
      console.log("Utilisation des données déjà formatées");
      return;
    }
    
    console.log("Récupération des détails des parties Lichess...");
    // Si allGames est déjà rempli, pas besoin de refaire des appels API
    if (this.allGames.length > 0) {
      this.dataFormatage();
      return;
    }
    
    // Si nécessaire, récupérer les détails des parties
    if (!this.gamesID || this.gamesID.length === 0) {
      console.warn('Aucun ID de partie à récupérer.');
      return;
    }
    
    // Limiter la quantité de requêtes pour éviter de surcharger l'API
    const maxGames = Math.min(this.gamesID.length, 100);
    this.allGames = [];
    
    for (let i = 0; i < maxGames; i++) {
      try {
        const url = `https://lichess.org/game/export/${this.gamesID[i]}?pgnInJson=true`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        
        const game = await response.json();
        this.allGames.push(game);
        
        // Afficher la progression
        if (i % 10 === 0) {
          console.log(`Progression: ${i}/${maxGames} parties récupérées...`);
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération de la partie ${i}:`, error);
      }
    }
    
    console.log(`✅ ${this.allGames.length} parties récupérées avec succès`);
    this.dataFormatage();
  }
  
  dataFormatage() {
    console.log(`Formatage de ${this.allGames.length} parties Lichess...`);
    this.allGamesJson = [];
    
    // Logging d'un exemple de partie pour debug
    if (this.allGames.length > 0) {
      console.log("Exemple de structure d'une partie Lichess:", 
                  JSON.stringify(this.allGames[0].opening, null, 2));
    }
    
    for (const game of this.allGames) {
      try {
        // Extraire les informations importantes
        const white = {
          username: game.players?.white?.user?.name || 'Anonymous',
          rating: game.players?.white?.rating || 0,
          result: game.winner === 'white' ? 'win' : (game.status === 'draw' ? 'draw' : 'loss')
        };
        
        const black = {
          username: game.players?.black?.user?.name || 'Anonymous',
          rating: game.players?.black?.rating || 0,
          result: game.winner === 'black' ? 'win' : (game.status === 'draw' ? 'draw' : 'loss')
        };
        
        // Récupération améliorée des données d'ouverture
        let ecoCode = '';
        let openingName = 'Unknown Opening';
        
        // Vérifier si l'ouverture est définie et extraire ses propriétés
        if (game.opening) {
          if (typeof game.opening === 'object') {
            ecoCode = game.opening.eco || '';
            openingName = game.opening.name || 'Unknown Opening';
          } else if (typeof game.opening === 'string') {
            openingName = game.opening;
          }
        }
        
        // Format compatible avec l'API Chess.com
        const formattedGame = {
          url: `https://lichess.org/${game.id}`,
          pgn: game.pgn || '',
          time_class: game.speed || 'rapid',
          end_time: game.lastMoveAt || game.createdAt,
          white,
          black,
          // Utiliser les variables extraites explicitement
          eco: ecoCode,
          opening: openingName,
          // Ajouter des champs supplémentaires pour assurer la compatibilité
          status: game.status,
          variant: game.variant,
          moves: game.moves,
          // Ajout d'un champ pour aider à déboguer
          _original_opening: game.opening ? JSON.stringify(game.opening) : null
        };
        
        this.allGamesJson.push(formattedGame);
      } catch (error) {
        console.error('Erreur lors du formatage d\'une partie:', error);
      }
    }
    
    // Vérifier les ouvertures extraites
    const openingsCount = this.allGamesJson.reduce((acc, game) => {
      if (game.opening !== 'Unknown Opening') acc++;
      return acc;
    }, 0);
    
    console.log(`✅ ${this.allGamesJson.length} parties formatées avec succès`);
    console.log(`📊 ${openingsCount} parties avec des ouvertures identifiées`);
    
    // Afficher quelques exemples d'ouvertures pour vérification
    if (this.allGamesJson.length > 0) {
      console.log("Exemples d'ouvertures extraites:");
      for (let i = 0; i < Math.min(5, this.allGamesJson.length); i++) {
        console.log(`${i+1}. ECO: ${this.allGamesJson[i].eco || 'N/A'}, Nom: ${this.allGamesJson[i].opening}`);
      }
    }
  }
  
  // Implémentation des méthodes requises par l'interface Api
  
  getElo(time_class?: Constantes.TypeJeuChessCom): { timestamp: number; rating: number; }[] {
    console.log(`LitchessApi.getElo appelée pour ${time_class || 'tous les types'}`);
    
    if (!this.allGamesJson || this.allGamesJson.length === 0) {
      console.warn('Aucune partie disponible pour récupérer les données ELO');
      return [];
    }
    
    const result: { timestamp: number; rating: number; }[] = [];
    
    try {
      // Trier les parties par date
      const sortedGames = [...this.allGamesJson].sort((a, b) => {
        return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
      });
      
      // Map pour éviter les doublons par jour
      const eloMap = new Map<string, number>();
      
      for (const game of sortedGames) {
        // Convertir end_time en timestamp
        const gameDate = new Date(game.end_time);
        
        // Vérifier si la partie est dans la plage de dates demandée
        if (this.dateDebut && this.dateFin) {
          if (gameDate < this.dateDebut || gameDate > this.dateFin) {
            continue;
          }
        }
        
        // Vérifier le type de jeu si spécifié
        if (time_class && game.time_class !== time_class) {
          continue;
        }
        
        // Déterminer si le joueur est blanc ou noir
        const isWhite = game.white.username.toLowerCase() === this.username.toLowerCase();
        const playerRating = isWhite ? game.white.rating : game.black.rating;
        
        // Créer une clé unique pour cette entrée d'ELO (par jour)
        const dateKey = `${gameDate.getFullYear()}-${gameDate.getMonth()}-${gameDate.getDate()}`;
        
        // N'ajouter que si pas déjà une entrée pour cette date ou si rating différent
        if (!eloMap.has(dateKey) || Math.abs(eloMap.get(dateKey)! - playerRating) > 5) {
          eloMap.set(dateKey, playerRating);
          
          result.push({
            timestamp: Math.floor(gameDate.getTime() / 1000),
            rating: playerRating
          });
        }
      }
      
      console.log(`${result.length} entrées ELO trouvées pour ${time_class || 'tous les types'}`);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données ELO:', error);
    }
    
    return result;
  }




  override getOpenings(): any[] {
  console.log('LitchessApi.getOpenings appelée');
  
  if (!this.allGamesJson || this.allGamesJson.length === 0) {
    console.warn('Aucune partie disponible pour les ouvertures');
    return [];
  }
  
  // Map pour regrouper les ouvertures
  const openingsMap = new Map();
  
  try {
    for (const game of this.allGamesJson) {
      // Vérifier si la partie est dans la plage de dates demandée
      const gameDate = new Date(game.end_time);
      
      if (this.dateDebut && this.dateFin) {
        if (gameDate < this.dateDebut || gameDate > this.dateFin) {
          continue;
        }
      }
      
      // Obtenir le nom de l'ouverture
      const openingName = game.opening || 'Unknown Opening';
      const ecoCode = game.eco || '';
      // On combine le code ECO et le nom pour une meilleure identification
      const fullOpeningName = ecoCode ? `${ecoCode}: ${openingName}` : openingName;
      
      // Déterminer si le joueur est blanc ou noir
      const isWhite = game.white.username.toLowerCase() === this.username.toLowerCase();
      
      // Initialiser l'entrée si elle n'existe pas encore
      if (!openingsMap.has(fullOpeningName)) {
        openingsMap.set(fullOpeningName, {
          nom: fullOpeningName,
          stats: {
            WinAsWhite: 0, DrawAsWhite: 0, LooseAsWhite: 0,
            WinAsBlack: 0, DrawAsBlack: 0, LooseAsBlack: 0
          }
        });
      }
      
      const opening = openingsMap.get(fullOpeningName);
      
      // Mettre à jour les statistiques
      if (isWhite) {
        if (game.white.result === 'win') opening.stats.WinAsWhite++;
        else if (game.white.result === 'draw') opening.stats.DrawAsWhite++;
        else opening.stats.LooseAsWhite++;
      } else {
        if (game.black.result === 'win') opening.stats.WinAsBlack++;
        else if (game.black.result === 'draw') opening.stats.DrawAsBlack++;
        else opening.stats.LooseAsBlack++;
      }
    }
    
    const result = Array.from(openingsMap.values());
    console.log(`${result.length} ouvertures trouvées dans l'API Lichess`);
    
    // Trier les ouvertures par nombre total de parties
    result.sort((a, b) => {
      const totalA = a.stats.WinAsWhite + a.stats.DrawAsWhite + a.stats.LooseAsWhite +
                    a.stats.WinAsBlack + a.stats.DrawAsBlack + a.stats.LooseAsBlack;
      const totalB = b.stats.WinAsWhite + b.stats.DrawAsWhite + b.stats.LooseAsWhite +
                    b.stats.WinAsBlack + b.stats.DrawAsBlack + b.stats.LooseAsBlack;
      return totalB - totalA;
    });
    
    return result;
    
  } catch (error) {
    console.error('Erreur lors de la génération des statistiques d\'ouvertures Lichess:', error);
    return [];
  }
}
  
  
  
  override getEndgames(): { [key: string]: { [key: string]: number; }; } {
    console.log('LitchessApi.getEndgames appelée');
    
    interface EndgameResult {
      whiteWin: EndgameWinLoseData;
      whiteLoose: EndgameWinLoseData;
      whiteDraw: EndgameDrawData;
      blackWin: EndgameWinLoseData;
      blackLoose: EndgameWinLoseData;
      blackDraw: EndgameDrawData;
      [key: string]: EndgameWinLoseData | EndgameDrawData;
    }
    
    const result: EndgameResult = {
      whiteWin: { checkmate: 0, timeout: 0, resign: 0, abandonned: 0 },
      whiteLoose: { checkmate: 0, timeout: 0, resign: 0, abandonned: 0 },
      whiteDraw: { stalemate: 0, repetition: 0, insufficient: 0, agreement: 0 },
      blackWin: { checkmate: 0, timeout: 0, resign: 0, abandonned: 0 },
      blackLoose: { checkmate: 0, timeout: 0, resign: 0, abandonned: 0 },
      blackDraw: { stalemate: 0, repetition: 0, insufficient: 0, agreement: 0 }
    };
    
    if (!this.allGamesJson || this.allGamesJson.length === 0) {
      console.warn('Aucune partie disponible pour les fins de partie');
      return result;
    }
    
    try {
      for (const game of this.allGamesJson) {
        // Vérifier si la partie est dans la plage de dates
        const gameDate = new Date(game.end_time);
        if (this.dateDebut && this.dateFin) {
          if (gameDate < this.dateDebut || gameDate > this.dateFin) {
            continue;
          }
        }
        
        // Déterminer si le joueur est blanc ou noir
        const isWhite = game.white.username.toLowerCase() === this.username.toLowerCase();
        
        // Transformer le status Lichess en type d'endgame pour Chess.com
        let endgameType = 'resign'; // Valeur par défaut
        
        // Mappage des statuts Lichess vers les types de fins de parties Chess.com
        switch (game.status) {
          case 'mate': endgameType = 'checkmate'; break;
          case 'outoftime': endgameType = 'timeout'; break;
          case 'resign': endgameType = 'resign'; break;
          case 'stalemate': endgameType = 'stalemate'; break;
          case 'draw':
            if (game.winner === undefined) {
              if (game.variant === 'threeCheck') endgameType = 'stalemate';
              else endgameType = 'agreement';
            }
            break;
          case 'timeout':
            if (game.winner) endgameType = 'timeout';
            else endgameType = 'insufficient';
            break;
          default: endgameType = 'resign'; break;
        }

        
        
        // Mettre à jour les statistiques
        if (isWhite) {
          if (game.white.result === 'win') {
            result['whiteWin'][endgameType] = (result['whiteWin'][endgameType] || 0) + 1;
          } else if (game.white.result === 'loss') {
            result['whiteLoose'][endgameType] = (result['whiteLoose'][endgameType] || 0) + 1;
          } else {
            result['whiteDraw'][endgameType] = (result['whiteDraw'][endgameType] || 0) + 1;
          }
        } else {
          if (game.black.result === 'win') {
            result['blackWin'][endgameType] = (result['blackWin'][endgameType] || 0) + 1;
          } else if (game.black.result === 'loss') {
            result['blackLoose'][endgameType] = (result['blackLoose'][endgameType] || 0) + 1;
          } else {
            result['blackDraw'][endgameType] = (result['blackDraw'][endgameType] || 0) + 1;
          }
        }
      }
      
      console.log('Statistiques de fin de partie générées', result);
      return result;
      
    } catch (error) {
      console.error('Erreur lors de la génération des statistiques de fin de partie:', error);
      return result;
    }
  }
  
  // Autres méthodes nécessaires...
}