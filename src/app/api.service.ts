import { Injectable } from '@angular/core';
import * as localData from '../../assets/games.json';

@Injectable({
  providedIn: 'root'
})



/***************/

export class Api {

allGames: any[] = []; /* Constante contenant toutes les parties d'un type (ou tous les types), Utiliser APRES avoir appelé sortbytype*/
allGamesAllTypes: any[] = []; /* Réponse de l'api, ne pas utiliser directement, prendre "allGames" */

/* Utiliser après avoir appelé setTimeTinterval */

public dateDebut: Date = new Date();
public dateFin: Date = new Date();

public nombrePartiesTotal = 0; /* Utiliser après avoir appelé getNombrePartiesTotal */
public username = ""; /* Utiliser après avoir appelé getUsername */

/* Constantes */

 BLACK = 0;
 WHITE = 1;

 BULLET = 0;
 BLITZ = 1;
 RAPID = 2;
 CLASSIC = 3;
 ALL_GENRES = 4;

 NULL = -1;
 WEEK = 0;
 MONTH = 1;
 YEAR = 2;
 ALL_TIME = 3;
 CUSTOM = 4;
 RegExpDate = /\[UTCDate\s+"([^"]+)"\]/;
 DATENULL = new Date(0);



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


/* return le nombre de parties jouées par l'utilisateur dans la période donnée */
 getNombrePartiesTotal() {
  this.nombrePartiesTotal = this.allGames.filter((game: any) => {
    const gameDate = new Date(game.pgn.match(this.RegExpDate)[1]);
    return gameDate >= this.dateDebut && gameDate <= this.dateFin;
  }).length;
}

/* Initialisation des dates de début et de fin */
 initTimeInterval() {
  this.dateDebut = new Date(this.allGames[0].pgn.match(this.RegExpDate)[1]);
  this.dateFin = new Date(this.allGames[this.allGames.length - 1].pgn.match(this.RegExpDate)[1]);
}

/* return le tableau : [winrate, nombre de victoires, nombre de défaites, nombre de matchs nuls] */
 WinrateByColor(color : number) {
  let win = 0;
  let lose = 0;
  let draw = 0;
  for (const game of this.allGames) {
    const gameDate = new Date(game.pgn.match(this.RegExpDate)[1]);
    if (gameDate >= this.dateDebut && gameDate <= this.dateFin) {
      const result = game.pgn.match(/\[Result\s+"([^"]+)"\]/)[1];
      let playerColor = -1;
      // On détermine la couleur du joueur
      if (game.white.username == this.username) {
        playerColor = this.WHITE;
      } else if (game.black.username == this.username) {
        playerColor = this.BLACK;
      } else {
        console.error("Erreur couleur joueur");
      }
      if (playerColor === color) {
        if (
          (result === "1-0" && color === 1) ||
          (result === "0-1" && color === 0)
        ) {
          win++;
        } else if (
          (result === "0-1" && color === 1) ||
          (result === "1-0" && color === 0)
        ) {
          lose++;
        } else {
          draw++;
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

/* Init le tableau allGames avec les parties du type donné : bullet/blitz/rapide/classic */
 sortByGameType(type : number) {
  switch (type) {
    case this.BULLET:
      return (this.allGames = this.allGamesAllTypes.filter(
        (game: any) => game.time_class === "bullet"
      ));
    case this.BLITZ:
      return (this.allGames = this.allGamesAllTypes.filter(
        (game: any) => game.time_class === "blitz"
      ));
    case this.RAPID:
      return (this.allGames = this.allGamesAllTypes.filter(
        (game: any) => game.time_class === "rapid"
      ));
    case this.CLASSIC:
      return (this.allGames = this.allGamesAllTypes.filter(
        (game: any) => game.time_class === "classic"
      ));
    case this.ALL_GENRES:
      return (this.allGames = this.allGamesAllTypes);
    default:
      console.error("Erreur type de partie");
      return -1;
  }
  //console.log("All games :", this.allGames);
}

/*
  type : type de temps (semaine, mois, année, all time, custom)
  debut : date de début (format : "YYYY-MM-DD")
  fin : date de fin (format : "YYYY-MM-DD")

  par défaut si aucun argement donné -> all time
*/

setTimeTinterval(type : number, debut : Date, fin : Date) {
  switch (type) {
    case this.CUSTOM:
      this.dateDebut = new Date(debut);
      this.dateFin = new Date(fin);
      break;
    case this.WEEK:
      this.dateDebut = new Date(this.dateFin.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case this.MONTH:
      this.dateDebut = new Date(this.dateFin.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case this.YEAR:
      this.dateDebut = new Date(this.dateFin.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case this.ALL_TIME:
      this.dateDebut = new Date(this.allGames[0].pgn.match(this.RegExpDate)[1]);
      break;
    default:
      this.dateDebut = new Date(this.allGames[0].pgn.match(this.RegExpDate)[1]);
      console.error("type de temps non défnini, all time par défaut");
  }
  this.applyTimeInterval();
}

/* Applique les changements de date */
  applyTimeInterval() {
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
      if (game.white.username == this.username) {
        playerColor = this.WHITE;
      } else if (game.black.username == this.username) {
        playerColor = this.BLACK;
      } else {
        console.error("Erreur couleur joueur");
      }
      if (game.accuracies) {
        nbGames++;
        accuracy += game.accuracies[playerColor === this.WHITE ? "white" : "black"];
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
        if (game.white.username == this.username) {
          playerColor = this.WHITE;
        } else if (game.black.username == this.username) {
          playerColor = this.BLACK;
        } else {
          console.error("Erreur couleur joueur");
        }
        if (game.accuracies) {
          accuracyList.push({
            timestamp: game.end_time,
            accuracy: game.accuracies[playerColor === this.WHITE ? "white" : "black"],
            color : playerColor
          });
        }
      }
    }
  }
  //console.log(accuracyList);
  return accuracyList;
}




/* return tableau contenant les elos du joueur dans la période donnée 
 format : 
 { timestamp: 1703440514, rating: 996 }
 */
 getElo() {
  let eloList = [];
  for (const game of this.allGames) {
    const match = game.pgn.match(this.RegExpDate);
    if (match) {
      const gameDate = new Date(match[1]);
      if (gameDate >= this.dateDebut && gameDate <= this.dateFin) {
        if (game.white.username == this.username) {
          if (game.white.rating) {
            eloList.push({ timestamp: game.end_time, rating: game.white.rating });
          }
        } else if (game.black.username == this.username) {
          if (game.black.rating) {
            eloList.push({ timestamp: game.end_time, rating: game.black.rating });
          }
        } else {
          console.error("Erreur couleur joueur");
        }
      }
    }
  }

  //console.log(eloList);
  return eloList;
}

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

    if (game.white.username === this.username) {
      playerColor = this.WHITE;
      if (game.white.result === "win") {
        whiteWin++;
      } else if (game.white.result === "draw") {
        whiteDraw++;
      } else {
        whiteLose++;
      }
    } else if (game.black.username === this.username) {
      playerColor = this.BLACK;
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

    let isWin = (playerColor === this.WHITE && game.white.result === "win")
             || (playerColor === this.BLACK && game.black.result === "win");
    let isDraw = (playerColor === this.WHITE && game.white.result === "draw")
              || (playerColor === this.BLACK && game.black.result === "draw");

    if (existingOpening) {
      existingOpening.games.push(game.end_time);
      existingOpening.total++;
      if (isWin) {
        existingOpening.wins++;
        if (playerColor === this.WHITE) existingOpening.WinAsWhite++;
        else existingOpening.WinAsBlack++;
      } else if (isDraw) {
        existingOpening.draws++;
        if (playerColor === this.WHITE) existingOpening.DrawAsWhite++;
        else existingOpening.DrawAsBlack++;
      } else {
        existingOpening.losses++;
        if (playerColor === this.WHITE) existingOpening.LooseAsWhite++;
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
        WinAsBlack: playerColor === this.BLACK && isWin ? 1 : 0,
        WinAsWhite: playerColor === this.WHITE && isWin ? 1 : 0,
        LooseAsWhite: playerColor === this.WHITE && !isWin && !isDraw ? 1 : 0,
        LooseAsBlack: playerColor === this.BLACK && !isWin && !isDraw ? 1 : 0,
        DrawAsWhite: playerColor === this.WHITE && isDraw ? 1 : 0,
        DrawAsBlack: playerColor === this.BLACK && isDraw ? 1 : 0,
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

getEndgames() {
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
        if (game.white.username === this.username) {
          playerColor = this.WHITE;
          if (game.white.result === "win") {
            tab[whiteWin][game.black.result] = (tab[whiteWin][game.black.result] || 0) + 1;
          }
          if (game.black.result === "win") {
            tab[whiteLoose][game.white.result] = (tab[whiteLoose][game.white.result] || 0) + 1;
          }
          if (game.white.result !== "win" && game.black.result !== "win") {
            tab[whiteDraw][game.white.result] = (tab[whiteDraw][game.white.result] || 0) + 1;
          }
        } else if (game.black.username === this.username) {
          playerColor = this.BLACK;
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