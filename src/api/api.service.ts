import { Injectable } from '@angular/core';
import * as localData from '../assets/games.json';
import { get } from 'node:http';
import { LitchessApi } from './litchess-api.service';
import { ChesscomApi } from './chesscomapi.service';

export namespace Constantes
{
    export enum CouleurPiece
    {
      BLACK = 0,
      WHITE = 1
    }

    export enum TypeJeuChessCom {
      BULLET = "bullet",
      BLITZ = "blitz",
      RAPID = "rapid",
      CLASSIC = "classic",
      DAILY = "daily",
      ALL_GENRES = 4
    }

    export enum Time {
      NULL = -1,
      WEEK = 0,
      MONTH = 1,
      YEAR = 2,
      ALL_TIME = 3,
      CUSTOM = 4,
    }
    
}

@Injectable({
  providedIn: 'root'
})
/***************/
export abstract class Api {

allGames: any[] = []; /* Constante contenant toutes les parties d'un type (ou tous les types), Utiliser APRES avoir appelé sortbytype*/
allGamesAllTypes: any[] = []; /* Réponse de l'api, ne pas utiliser directement, prendre "allGames" */

/* Utiliser après avoir appelé setTimeTinterval */

public dateDebut: Date = new Date();
public dateFin: Date = new Date();

public nombrePartiesTotal = 0; /* Utiliser après avoir appelé getNombrePartiesTotal */
public username = ""; /* Utiliser après avoir appelé getUsername */

/* Constantes */

 RegExpDate = /\[UTCDate\s+"([^"]+)"\]/;
 DATENULL = new Date(0);
  LitchessApi: any;
  ChesscomApi: any;

/**
 * Initialisation de l'API Chess.com. 
 * On utilise une méthode intermédiaire qui est 
 * capable d'initialiser toutes les différentes API
 */

private datesInitialized = false;


async initializeChesCom(){
  
   console.log(" ============= Chess.com API Initialisation (api service) ============ ");
   this.ChesscomApi.getAllGamesONLINE();
  
   this.initialize( this.ChesscomApi.allGamesAllTypes, 'titouannnnnn' );
   console.log("NOmbre de parties : ", this.ChesscomApi.allGamesAllTypes.length);
 }

/**
* Initialisation de l'API LiChess.org. 
* On utilise une méthode intermédiaire qui est 
* capable d'initialiser toutes les différentes API
*/
async initializeLichess(){
console.log(" ========= Lichess.org API Initialisation ========== ");
  await this.LitchessApi.getIDLichessGames('titouannn', 100);
   await this.LitchessApi.getInfoLichessGames();

   this.LitchessApi.dataFormatage();
   this.allGames = JSON.parse(JSON.stringify(this.LitchessApi.allGamesJson));
  
   this.initialize( this.allGames, 'titouannn' );
 }

/**
 * Méthode permettant d'initialiser tout type d'API
 * 
 * @param tab Données RAW a traiter (allGamesAllTypes)
 * @param username Utilisateur passé en paramètre
 */
protected initialize(tab: any[][], username: string) {
  this.username = username;
  this.allGamesAllTypes = tab;
  
  // Initialiser les dates une seule fois
  if (!this.datesInitialized) {
    this.initTimeInterval();
    this.setTimeTinterval(Constantes.Time.ALL_TIME, this.DATENULL, this.DATENULL);
    this.datesInitialized = true;
  } else {
    console.log("Dates déjà initialisées, réutilisation des valeurs existantes");
  }
}

/* Initialisation des dates de début et de fin */

private getDateDebut(): Date {
  // Si le tableau est vide, retourner une date par défaut (un an en arrière)
  if (!this.allGamesAllTypes || this.allGamesAllTypes.length === 0) {
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 1);
    console.warn("Tableau de parties vide, utilisation date par défaut:", defaultDate);
    return defaultDate;
  }

  // Parcourir toutes les parties pour trouver la date la plus ancienne
  let oldestDate: Date | null = null;
  
  // Utiliser allGamesAllTypes au lieu de allGames pour avoir TOUTES les parties disponibles
  for (const game of this.allGamesAllTypes) {
    if (game && game.pgn) {
      const match = game.pgn.match(this.RegExpDate);
      if (match && match[1]) {
        const gameDate = new Date(match[1]);
        
        // Vérifier que la date est valide
        if (isNaN(gameDate.getTime())) {
          continue;
        }
        
        // Si c'est la première date valide ou si elle est plus ancienne
        if (oldestDate === null || gameDate < oldestDate) {
          oldestDate = gameDate;
        }
      }
    }
  }
  
  // Si aucune date valide trouvée, utiliser une date par défaut
  if (oldestDate === null) {
    console.warn("Aucune date valide trouvée, utilisation d'une date par défaut");
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 1);
    return defaultDate;
  }
  
  console.log("Date la plus ancienne trouvée:", oldestDate);
  return oldestDate;
}


initTimeInterval() {
  // Ne pas initialiser si déjà fait
  if (this.datesInitialized) {
    console.log("Dates déjà initialisées, réutilisation des valeurs existantes");
    return;
  }
  
  // On initialise la dateDebut à la date de la partie la plus ancienne
  if (!this.allGames || !this.allGames[0]) {
    console.log("Attention : Variable allGames initialisé par défault (ALL_GENRES)");
    this.sortByGameType();
  }
  
  try {
    this.dateDebut = this.getDateDebut();
    // La dateFin est la date d'aujourd'hui
    this.dateFin = new Date();
    console.log("Dates initialisées : ", this.dateDebut, this.dateFin);
  } catch (error) {
    console.error("Erreur lors de l'initialisation des dates:", error);
    // Fallback sur des dates par défaut
    const defaultDate = new Date();
    this.dateFin = defaultDate;
    this.dateDebut = new Date(defaultDate);
    this.dateDebut.setFullYear(this.dateDebut.getFullYear() - 1);
  }
}

/* return le tableau : [winrate, nombre de victoires, nombre de défaites, nombre de matchs nuls] */
 WinrateByColor(color : number) {
  
  let win = 0;
  let lose = 0;
  let draw = 0;
  console.log("All games :", this.allGames);
  for (const game of this.allGames) {
    const gameDate = new Date(game.pgn.match(this.RegExpDate)[1]);
    if (gameDate >= this.dateDebut && gameDate <= this.dateFin) {
      
      const result = game.pgn.match(/\[Result\s+"([^"]+)"\]/)[1];
      let playerColor = -1;
      
      if (game.white.username.toLowerCase() === this.username.toLowerCase()) {
        playerColor = Constantes.CouleurPiece.WHITE;
      } else if (game.black.username.toLowerCase() === this.username.toLowerCase()) {
        playerColor = Constantes.CouleurPiece.WHITE;
      } else {
        console.error("Erreur couleur joueur");
        console.log(game.white.username, game.black.username, this.username);
      }
      if (playerColor === color) {
        if (color == Constantes.CouleurPiece.WHITE) {
          if (game.white.result == "win") {
        win++;
          } else if (game.black.result == "win") {
        lose++;
          } else {
        draw++;
          }
        } else if (color == Constantes.CouleurPiece.WHITE) {
          if (game.black.result == "win") {
        win++;
          } else if (game.white.result == "win") {
        lose++;
          } else {
        draw++;
          }
        }
      }
    }
  }
  return {
    winrate: (win / (win + lose + draw)) * 100,
    win,
    lose,
    draw,
  };
}


/* Init le tableau allGames avec les parties du type donné : bullet/blitz/rapide/classic(daily ?) */
sortByGameType(type?: Constantes.TypeJeuChessCom | string) {
  // Déclaration d'une variable pour stocker le résultat
  let result: any[] = [];

  switch (type) {
    case Constantes.TypeJeuChessCom.BULLET:
      result = this.allGamesAllTypes.filter(
        (game: any) => game.time_class === "bullet"
      );
      break;
    case Constantes.TypeJeuChessCom.BLITZ:
      result = this.allGamesAllTypes.filter(
        (game: any) => game.time_class === "blitz"
      );
      break;
    case Constantes.TypeJeuChessCom.RAPID:
      result = this.allGamesAllTypes.filter(
        (game: any) => game.time_class === "rapid"
      );
      break;
    case Constantes.TypeJeuChessCom.DAILY:
      result = this.allGamesAllTypes.filter(
        (game: any) => game.time_class === "daily"
      );
      break;
    case Constantes.TypeJeuChessCom.CLASSIC:
      result = this.allGamesAllTypes.filter(
        (game: any) => game.time_class === "classic" || game.time_class === "classical"
      );
      break;
    default:
      result = [...this.allGamesAllTypes]; // Créer une copie pour éviter les modifications accidentelles
  }

  // Mettre à jour allGames et retourner le résultat
  this.allGames = result;
  console.log(`Après filtrage, ${this.allGames.length} parties du type ${type || 'ALL_GENRES'}`);
  return this.allGames;
}

/*
  type : type de temps (semaine, mois, année, all time, custom)
  debut : date de début (format : "YYYY-MM-DD")
  fin : date de fin (format : "YYYY-MM-DD")

  par défaut si aucun argement donné -> all time
*/
setTimeTinterval(type: Constantes.Time, debut: Date, fin: Date) {
  // Sauvegarder les dates originales avant modification
  const originalDateDebut = this.dateDebut ? new Date(this.dateDebut) : null;
  const originalDateFin = this.dateFin ? new Date(this.dateFin) : null;
  
  switch (type) {
    case Constantes.Time.CUSTOM:
      this.dateDebut = new Date(debut);
      this.dateFin = new Date(fin);
      break;
    case Constantes.Time.WEEK:
      const now = new Date();
      this.dateDebut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      this.dateFin = now;
      break;
    case Constantes.Time.MONTH:
      const nowMonth = new Date();
      this.dateDebut = new Date(nowMonth.getTime() - 30 * 24 * 60 * 60 * 1000);
      this.dateFin = nowMonth;
      break;
    case Constantes.Time.YEAR:
      const nowYear = new Date();
      this.dateDebut = new Date(nowYear.getTime() - 365 * 24 * 60 * 60 * 1000);
      this.dateFin = nowYear;
      break;
    case Constantes.Time.ALL_TIME:
      // Pour ALL_TIME, utiliser la date de la première partie comme dateDebut
      this.dateDebut = this.getDateDebut();
      this.dateFin = new Date();
      break;
    default:
      // Par défaut, utiliser ALL_TIME
      this.dateDebut = this.getDateDebut();
      this.dateFin = new Date();
  }
}

/**
 * Méthode pour réinitialiser le cache de dates si nécessaire (par exemple pour forcer une réinitialisation)
 */
resetDatesInitialization() {
  this.datesInitialized = false;
  console.log("Cache de dates réinitialisé");
}

/* Applique les changements de date */
  private applyTimeInterval() {
    this.allGames = this.allGames.filter((game: any) => {
      const gameDate = new Date(game.pgn.match(this.RegExpDate)[1]);
      return gameDate >= this.dateDebut && gameDate <= this.dateFin;
    });
  }

/* return accuracy sous forme de float  */
 GetAccuracy() {
  let accuracy = 0;
  let nbGames = 0;
  let playerColor = -1;
  for (const game of this.allGames) {
    const gameDate = new Date(game.pgn.match(this.RegExpDate)[1]);
    if (gameDate >= this.dateDebut && gameDate <= this.dateFin) {
      if (game.white.username.toLowerCase() == this.username.toLowerCase()) {
        playerColor = Constantes.CouleurPiece.WHITE;
      } else if (game.black.username.toLowerCase() == this.username.toLowerCase()) {
        playerColor = Constantes.CouleurPiece.BLACK;
      } else {
        console.error("Erreur couleur joueur");
      }
      if (game.accuracies) {
        nbGames++;
        accuracy += game.accuracies[playerColor === Constantes.CouleurPiece.WHITE ? "white" : "black"];
      }
    }
  }
  return accuracy / nbGames;
}

/* return tableau contenant les timestamps et les accuracies des parties dans la période donnée
 { timestamp: 1703440514, accuracy: 98.5, color: 1 }
  rappel : color = 1 -> blanc, color = 0 -> noir
 */
 getAccuracyList() {
  let accuracyList = [];
  //console.log("Récupération des accuracies");

  for (const game of this.allGames) {
    const match = game.pgn.match(this.RegExpDate);
    if (match) {
      const gameDate = new Date(match[1]);
      if (gameDate >= this.dateDebut && gameDate <= this.dateFin) {
        let playerColor = -1;
        if (game.white.username.toLowerCase() == this.username.toLowerCase()) {
          playerColor = Constantes.CouleurPiece.WHITE;
        } else if (game.black.username.toLowerCase() == this.username.toLowerCase()) {
          playerColor = Constantes.CouleurPiece.BLACK;
        } else {
          console.error("Erreur couleur joueur");
        }
        if (game.accuracies) {
          accuracyList.push({
            timestamp: game.end_time,
            accuracy: game.accuracies[playerColor === Constantes.CouleurPiece.WHITE ? "white" : "black"],
            color : playerColor
          });
        }
      }
    }
  }
  //console.log(accuracyList);
  return accuracyList;
}


/**
 * return tableau contenant les elos du joueur dans la période donnée 
 * format : 
 * { timestamp: 1703440514, rating: 996 }
 * Ici on est entrain de melanger tous les différents élos qui existent : Bullet, Blitz, Rapid, Daily
 * Il convient de créer des fonction pour récuperer chaqun de manière indépendante.
 * A noter que cette méthode doit être ecrite dans la classe qui l'implémente
 * 
 * */ 
abstract getElo(): { timestamp: any; rating: any; }[] | undefined;
/**
 * Fonction adaptée a chess.com
 * On fait usage du polymorphisme Ad hoc adapté pour typescript pour la réalisation de cette adaptation
 * Il est essentiel de réaliser la déclaration de ses méthodes pour ensuite les ecrire.
 * 
 * @param time_class : variable permettant de selectionner un type de mode jeu spécifique : Options possibles -> bullet, blitz, Rapid, Daily
 */
abstract getElo( time_class ?: Constantes.TypeJeuChessCom): { timestamp: any; rating: any; }[] | undefined;


/*
* return un tableau contenant les openings joués par le joueur dans la période donnée
* format :
* { opening: "A00", total: 1, wins: 1, losses: 0, draws: 0, games: [1703440514], WinAsBlack: 0, WinAsWhite: 1, LooseAsWhite: 0, LooseAsBlack: 0, DrawAsWhite: 0, DrawAsBlack: 0 }
* rappel : color = 1 -> blanc, color = 0 -> noir / result = 1 -> win, result = 0 -> lose
*/

 getOpenings() {
  let openingsTab = [];
  let whiteWin = 0, whiteLose = 0, whiteDraw = 0;
  let blackWin = 0, blackLose = 0, blackDraw = 0;
  let playerColor = -1;

  for (const game of this.allGames) {
    const match = game.pgn.match(this.RegExpDate);
    if (!match) continue;
    const gameDate = new Date(match[1]);
    if (gameDate < this.dateDebut || gameDate > this.dateFin) continue;

    if (game.white.username.toLowerCase() === this.username.toLowerCase()) {
      playerColor = Constantes.CouleurPiece.WHITE;
      if (game.white.result === "win") {
        whiteWin++;
      } else if (game.white.result === "draw") {
        whiteDraw++;
      } else {
        whiteLose++;
      }
    } else if (game.black.username.toLowerCase() === this.username.toLowerCase()) {
      playerColor = Constantes.CouleurPiece.BLACK;
      if (game.black.result === "win") {
        blackWin++;
      } else if (game.black.result === "draw") {
        blackDraw++;
      } else {
        blackLose++;
      }
    } else {
      console.error("Erreur couleur joueur");
    }

    let opening = game.eco.substring(game.eco.lastIndexOf("/") + 1);
    let existingOpening = openingsTab.find(o => o.opening === opening);

    let isWin = (playerColor === Constantes.CouleurPiece.WHITE && game.white.result === "win")
             || (playerColor === Constantes.CouleurPiece.BLACK && game.black.result === "win");
    let isDraw = (playerColor === Constantes.CouleurPiece.WHITE && game.white.result === "draw")
              || (playerColor === Constantes.CouleurPiece.BLACK && game.black.result === "draw");

    if (existingOpening) {
      existingOpening.games.push(game.end_time);
      existingOpening.total++;
      if (isWin) {
        existingOpening.wins++;
        if (playerColor === Constantes.CouleurPiece.WHITE) existingOpening.WinAsWhite++;
        else existingOpening.WinAsBlack++;
      } else if (isDraw) {
        existingOpening.draws++;
        if (playerColor === Constantes.CouleurPiece.WHITE) existingOpening.DrawAsWhite++;
        else existingOpening.DrawAsBlack++;
      } else {
        existingOpening.losses++;
        if (playerColor === Constantes.CouleurPiece.WHITE) existingOpening.LooseAsWhite++;
        else existingOpening.LooseAsBlack++;
      }
    } else {
      openingsTab.push({
        opening,
        total: 1,
        wins: isWin ? 1 : 0,
        losses: !isWin && !isDraw ? 1 : 0,
        draws: isDraw ? 1 : 0,
        games: [game.end_time],
        WinAsBlack: playerColor === Constantes.CouleurPiece.BLACK && isWin ? 1 : 0,
        WinAsWhite: playerColor === Constantes.CouleurPiece.WHITE && isWin ? 1 : 0,
        LooseAsWhite: playerColor === Constantes.CouleurPiece.WHITE && !isWin && !isDraw ? 1 : 0,
        LooseAsBlack: playerColor === Constantes.CouleurPiece.BLACK && !isWin && !isDraw ? 1 : 0,
        DrawAsWhite: playerColor === Constantes.CouleurPiece.WHITE && isDraw ? 1 : 0,
        DrawAsBlack: playerColor === Constantes.CouleurPiece.BLACK && isDraw ? 1 : 0,
      });
    }
  }

  //console.log(openingsTab);
  let tab = this.sortOpenings(openingsTab);
  
  tab = this.CleanOpening(tab);

  console.log("tableau des ouvertures");
  console.log(tab);
  
  return tab;
}

 CleanOpening(openingsTab : any[]) {
  // AJout des liens chess.com pour chaque ouverture
  const baseUrl = "https://www.chess.com/openings/";

  for (const opening of openingsTab) {
    for (const variante of opening.variantes) {
      const formattedOpening = variante.opening.replace(/\s+/g, '-');
      variante.link = `${baseUrl}${formattedOpening}`;
    }
    const formattedOpening = opening.nom.split(/[-.]/).slice(0, 3).join(' ');
    if (!isNaN(formattedOpening.charAt(formattedOpening.length - 1))) {
      opening.nom = formattedOpening.slice(0, -1);
    } else {
      opening.nom = formattedOpening;
    }
  }

  //console.log(openingsTab);
  return openingsTab;
}

 sortOpenings(openingsTab : any[]) {
  // Trier les ouvertures par nom
  
  openingsTab.sort((a, b) => a.opening.localeCompare(b.opening));

  const result = [];

  for (const opening of openingsTab) {
    if (!result.length) {
      result.push({
        nom: opening.opening,
        variantes: [opening],
        stats: {
          DrawAsBlack: opening.DrawAsBlack || 0,
          DrawAsWhite: opening.DrawAsWhite || 0,
          LooseAsBlack: opening.LooseAsBlack || 0,
          LooseAsWhite: opening.LooseAsWhite || 0,
          WinAsBlack: opening.WinAsBlack || 0,
          WinAsWhite: opening.WinAsWhite || 0,
        },
      });
      continue;
    }

    const last = result[result.length - 1];
    const lastPrefix = last.nom.split(/[-.]/).slice(0, 2).join('-');
    const currentPrefix = opening.opening.split(/[-.]/).slice(0, 2).join('-');

    if (lastPrefix === currentPrefix) {
      last.variantes.push(opening);
      // Mettre à jour les statistiques
      last.stats.DrawAsBlack += opening.DrawAsBlack || 0;
      last.stats.DrawAsWhite += opening.DrawAsWhite || 0;
      last.stats.LooseAsBlack += opening.LooseAsBlack || 0;
      last.stats.LooseAsWhite += opening.LooseAsWhite || 0;
      last.stats.WinAsBlack += opening.WinAsBlack || 0;
      last.stats.WinAsWhite += opening.WinAsWhite || 0;
    } else {
      result.push({
        nom: opening.opening,
        variantes: [opening],
        stats: {
          DrawAsBlack: opening.DrawAsBlack || 0,
          DrawAsWhite: opening.DrawAsWhite || 0,
          LooseAsBlack: opening.LooseAsBlack || 0,
          LooseAsWhite: opening.LooseAsWhite || 0,
          WinAsBlack: opening.WinAsBlack || 0,
          WinAsWhite: opening.WinAsWhite || 0,
        },
      });
    }
  }

  return result;
}

// Fonction pour récupérer les openings les plus joués
 getMostPlayedOpenings(openingsTab : any[]) {
  let mostPlayed = openingsTab.sort((a, b) => b.total - a.total).slice(0, 5);
  // renvoie un dictio avec les openings les plus joués, la clé opening contient le nom de l'ouverture et la clé total contient le nombre de fois que l'ouverture a été jouée
  let dict = mostPlayed.map(o => ({ opening: o.opening, total: o.total }));
  return dict;
}

// Fonction pour récupérer les openings les plus gagnants
getMostWinningOpenings(openingsTab : any[]) {
  
  // On ne prend que les openings joués plus de 3 fois car forcement quand l'ouverture est jouée une seule fois et elle gagne, elle est gagnante a 100%
  let mostWinning = openingsTab.filter(a => a.total > 3).sort((a, b) => (b.wins / b.total) - (a.wins / a.total)).slice(0, 5);
  // renvoie un dictio avec les openings les plus gagnants, la clé opening contient le nom de l'ouverture et la clé winrate contient le winrate de l'ouverture
  let dict = mostWinning.map(o => ({ opening: o.opening, winrate: ((o.wins / o.total) * 100).toFixed(2) }));
  return dict;
}

// Fonction pour récupérer les openings les plus perdants
 getMostLoosingOpenings(openingsTab : any[]) {
  
  let mostLoosing = openingsTab.filter(a => a.total > 3).sort((a, b) => (b.losses / b.total) - (a.losses / a.total)).slice(0, 5);
  // renvoie un dictio avec les openings les plus perdants, la clé opening contient le nom de l'ouverture et la clé winrate contient le winrate de l'ouverture
  let dict = mostLoosing.map(o => ({ opening: o.opening, winrate: ((o.wins / o.total) * 100).toFixed(2) }));
  return dict;
}
/**
 * Cette méthode va utiliser la variable allGames afin de savoir les différentes raison de la 
 * fin d'une partie. On va diviser cette information en fonction des victoires, defaites et egalités
 * de l'utilisateur si ces pièces étaient blanc ou noir.
 * 
 * On aura donc les clés 
 * 'whiteWin', 'whiteDraw', 'whiteLoose', 'blackWin', 'blackDraw', 'blackLoose' stockés dans un liste.
 * Ces clés vont a sa fois stocker des clés variables en fonction de si c'est une victoire, perte, ou égalité. 
 * 
 * @returns liste contenant les informations correspondant au résultat des parties.
 */
getEndgames() : { [key: string]: { [key: string]: number; }; } {
  let tab: { [key: string]: { [key: string]: number } } = {};
  let whiteWin = 'whiteWin', whiteLoose = 'whiteLoose', whiteDraw = 'whiteDraw';
  let blackWin = 'blackWin', blackLoose = 'blackLoose', blackDraw = 'blackDraw';
  tab[whiteWin] = {};
  tab[whiteLoose] = {};
  tab[whiteDraw] = {};
  tab[blackWin] = {};
  tab[blackLoose] = {};
  tab[blackDraw] = {};

  for (const game of this.allGames) {
    const match = game.pgn.match(this.RegExpDate);
    if (match) {
      const gameDate = new Date(match[1]);
      if (gameDate >= this.dateDebut && gameDate <= this.dateFin) {
        let playerColor = -1;
        if (game.white.username.toLowerCase() === this.username.toLowerCase()) {
          playerColor = Constantes.CouleurPiece.WHITE;
          if (game.white.result === "win") {
            tab[whiteWin][game.black.result] = (tab[whiteWin][game.black.result] || 0) + 1;
          }
          if (game.black.result === "win") {
            tab[whiteLoose][game.white.result] = (tab[whiteLoose][game.white.result] || 0) + 1;
          }
          if (game.white.result !== "win" && game.black.result !== "win") {
            tab[whiteDraw][game.white.result] = (tab[whiteDraw][game.white.result] || 0) + 1;
          }
        } else if (game.black.username.toLowerCase() === this.username.toLowerCase()) {
          playerColor = Constantes.CouleurPiece.BLACK;
          if (game.black.result === "win") {
            tab[blackWin][game.white.result] = (tab[blackWin][game.white.result] || 0) + 1;
          }
          if (game.white.result === "win") {
            tab[blackLoose][game.black.result] = (tab[blackLoose][game.black.result] || 0) + 1;
          }
          if (game.white.result !== "win" && game.black.result !== "win") {
            tab[blackDraw][game.black.result] = (tab[blackDraw][game.black.result] || 0) + 1;
          }
        } else {
          console.error("Erreur couleur joueur");
        }
      }
    }
  }
  console.log(tab);
  return tab;
}


async main() {

  /*
  getUsername("");
  console.log("Récupération des parties hors ligne");
  await getAllGamesOFFLINE();
  sortByGameType(RAPID);
  initTimeInterval();
  setTimeTinterval(YEAR, DATENULL, DATENULL);

  /*
  console.log(allGames);
  getNombrePartiesTotal();
  console.log("nombre parties total :",nombrePartiesTotal);

  console.log("initialisation des dates");
  
  console.log("date debut :",dateDebut);
  console.log("date fin :",dateFin);

  console.log("Calcul du winrate pour les blancs");
  console.log(WinrateByColor(1));
  console.log("Calcul du winrate pour les noirs");
  

  console.log("Calcul de l'accuracy");
  console.log(GetAccuracy());

  */
  //getEndpointsWin();

  /* A FIX
  console.log("Les openings les plus gagnants sont : ", getMostWinningOpenings(openingsTab));
  console.log("Les openings les plus perdants sont : ", getMostLoosingOpenings(openingsTab));
  console.log("Les openings les plus joués sont : ", getMostPlayedOpenings(openingsTab));
  */
}

}