let allGames = []; /* Constante contenant toutes les parties d'un type (ou tous les types), Utiliser APRES avoir appelé sortbytype*/
let allGamesAllTypes = []; /* Réponse de l'api, ne pas utiliser directement, prendre "allGames" */


/* Utiliser après avoir appelé setTimeTinterval */

let dateDebut;
let dateFin;

let nombrePartiesTotal = 0; /* Utiliser après avoir appelé getNombrePartiesTotal */
let username = ""; /* Utiliser après avoir appelé getUsername */

/* Constantes */

const BLACK = 0;
const WHITE = 1;

const BULLET = 0;
const BLITZ = 1;
const RAPID = 2;
const CLASSIC = 3;
const ALL_GENRES = 4;

const NULL = -1;
const WEEK = 0;
const MONTH = 1;
const YEAR = 2;
const ALL_TIME = 3;
const CUSTOM = 4;
const RegExpDate = /\[UTCDate\s+"([^"]+)"\]/;

/***************/

// pas utile, fonction de test, à modifier par ceux qui font le front end pour avoir l'username rentré dans la page
export function getUsername(name) {
  //username = name;
  // vaut "titouannnnnn" pour test 
  username = "titouannnnnn";
  console.log("username :", username);
  return username;
}

/* Récupère dans allGamesAllTypes toutes les parties de l'utilisateur */
async function getAllGamesONLINE() {
  try {
    const archiveResponse = await fetch(
      `https://api.chess.com/pub/player/${username}/games/archives`
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
      allGamesAllTypes.push(...data.games);
    }
    
    console.log(allGamesAllTypes);
  } catch (error) {
    console.error("Erreur :", error);
  }
}

/* A utiliser en phase de test - Récupère dans allGamesAllTypes toutes les parties de l'utilisateur via le fichier chargé */
async function getAllGamesOFFLINE() {
  try {
    const response = await fetch(`games.json`);
    if (!response.ok) {
      throw new Error(
        `Erreur lors de la récupération des parties: ${response.status}`
      );
    }
    const data = await response.json();
    for (const item of data) {
      allGamesAllTypes.push(...item.games);
    }
  } catch (error) {
    console.error("Erreur requete parties", error);
  }
}

/* return le nombre de parties jouées par l'utilisateur dans la période donnée */
function getNombrePartiesTotal() {
  nombrePartiesTotal = allGames.filter((game) => {
    const gameDate = new Date(game.pgn.match(RegExpDate)[1]);
    return gameDate >= dateDebut && gameDate <= dateFin;
  }).length;
}

/* Initialisation des dates de début et de fin */
function initTimeInterval() {
  dateDebut = new Date(allGames[0].pgn.match(RegExpDate)[1]);
  dateFin = new Date(allGames[allGames.length - 1].pgn.match(RegExpDate)[1]);
}

/* return le tableau : [winrate, nombre de victoires, nombre de défaites, nombre de matchs nuls] */
function WinrateByColor(color) {
  let win = 0;
  let lose = 0;
  let draw = 0;
  for (const game of allGames) {
    const gameDate = new Date(game.pgn.match(RegExpDate)[1]);
    if (gameDate >= dateDebut && gameDate <= dateFin) {
      const result = game.pgn.match(/\[Result\s+"([^"]+)"\]/)[1];
      let playerColor = -1;
      // On détermine la couleur du joueur
      if (game.white.username == username) {
        playerColor = WHITE;
      } else if (game.black.username == username) {
        playerColor = BLACK;
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
function sortByGameType(type) {
  switch (type) {
    case BULLET:
      return (allGames = allGamesAllTypes.filter(
        (game) => game.time_class === "bullet"
      ));
    case BLITZ:
      return (allGames = allGamesAllTypes.filter(
        (game) => game.time_class === "blitz"
      ));
    case RAPID:
      return (allGames = allGamesAllTypes.filter(
        (game) => game.time_class === "rapid"
      ));
    case CLASSIC:
      return (allGames = allGamesAllTypes.filter(
        (game) => game.time_class === "classic"
      ));
    case ALL_GENRES:
      return (allGames = allGamesAllTypes);
    default:
      console.error("Erreur type de partie");
  }
  console.log("All games :", allGames);
}

/*
  type : type de temps (semaine, mois, année, all time, custom)
  debut : date de début (format : "YYYY-MM-DD")
  fin : date de fin (format : "YYYY-MM-DD")

  par défaut si aucun argement donné -> all time
*/

function setTimeTinterval(type, debut, fin) {
  switch (type) {
    case CUSTOM:
      dateDebut = new Date(debut);
      dateFin = new Date(fin);
      break;
    case WEEK:
      dateDebut = new Date(dateFin.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case MONTH:
      dateDebut = new Date(dateFin.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case YEAR:
      dateDebut = new Date(dateFin.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case ALL_TIME:
      dateDebut = new Date(allGames[0].pgn.match(RegExpDate)[1]);
      break;
    default:
      dateDebut = new Date(allGames[0].pgn.match(RegExpDate)[1]);
      console.error("type de temps non défnini, all time par défaut");
  }
}

/* return accuracy sous forme de float  */
function GetAccuracy() {
  let accuracy = 0;
  let nbGames = 0;
  let playerColor = -1;
  for (const game of allGames) {
    const gameDate = new Date(game.pgn.match(RegExpDate)[1]);
    if (gameDate >= dateDebut && gameDate <= dateFin) {
      if (game.white.username == username) {
        playerColor = WHITE;
      } else if (game.black.username == username) {
        playerColor = BLACK;
      } else {
        console.error("Erreur couleur joueur");
      }
      if (game.accuracies) {
        nbGames++;
        accuracy += game.accuracies[playerColor === WHITE ? "white" : "black"];
      }
    }
  }
  return accuracy / nbGames;
}

/* return tableau contenant les timestamps et les accuracies des parties dans la période donnée
 { timestamp: 1703440514, accuracy: 98.5, color: 1 }
  rappel : color = 1 -> blanc, color = 0 -> noir
 */
function getAccuracyList() {
  let accuracyList = [];
  console.log("Récupération des accuracies");

  for (const game of allGames) {
    const match = game.pgn.match(RegExpDate);
    if (match) {
      const gameDate = new Date(match[1]);
      if (gameDate >= dateDebut && gameDate <= dateFin) {
        let playerColor = -1;
        if (game.white.username == username) {
          playerColor = WHITE;
        } else if (game.black.username == username) {
          playerColor = BLACK;
        } else {
          console.error("Erreur couleur joueur");
        }
        if (game.accuracies) {
          accuracyList.push({
            timestamp: game.end_time,
            accuracy: game.accuracies[playerColor === WHITE ? "white" : "black"],
            color : playerColor
          });
        }
      }
    }
  }
  console.log(accuracyList);
  return accuracyList;
}




/* return tableau contenant les elos du joueur dans la période donnée 
 format : 
 { timestamp: 1703440514, rating: 996 }
 */
function getElo() {
  let eloList = [];
  for (const game of allGames) {
    const match = game.pgn.match(RegExpDate);
    if (match) {
      const gameDate = new Date(match[1]);
      if (gameDate >= dateDebut && gameDate <= dateFin) {
        if (game.white.username == username) {
          if (game.white.rating) {
            eloList.push({ timestamp: game.end_time, rating: game.white.rating });
          }
        } else if (game.black.username == username) {
          if (game.black.rating) {
            eloList.push({ timestamp: game.end_time, rating: game.black.rating });
          }
        } else {
          console.error("Erreur couleur joueur");
        }
      }
    }
  }

  console.log(eloList);
  return eloList;
}

/*
* return un tableau contenant les openings joués par le joueur dans la période donnée
* format :
* { opening: "A00", total: 1, wins: 1, losses: 0, draws: 0, games: [1703440514], WinAsBlack: 0, WinAsWhite: 1, LooseAsWhite: 0, LooseAsBlack: 0, DrawAsWhite: 0, DrawAsBlack: 0 }
* rappel : color = 1 -> blanc, color = 0 -> noir / result = 1 -> win, result = 0 -> lose
*/

function getOpenings() {
  let openingsTab = [];
  let whiteWin = 0, whiteLose = 0, whiteDraw = 0;
  let blackWin = 0, blackLose = 0, blackDraw = 0;
  let playerColor = -1;

  for (const game of allGames) {
    const match = game.pgn.match(RegExpDate);
    if (!match) continue;
    const gameDate = new Date(match[1]);
    if (gameDate < dateDebut || gameDate > dateFin) continue;

    if (game.white.username === username) {
      playerColor = WHITE;
      if (game.white.result === "win") {
        whiteWin++;
      } else if (game.white.result === "draw") {
        whiteDraw++;
      } else {
        whiteLose++;
      }
    } else if (game.black.username === username) {
      playerColor = BLACK;
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

    let isWin = (playerColor === WHITE && game.white.result === "win")
             || (playerColor === BLACK && game.black.result === "win");
    let isDraw = (playerColor === WHITE && game.white.result === "draw")
              || (playerColor === BLACK && game.black.result === "draw");

    if (existingOpening) {
      existingOpening.games.push(game.end_time);
      existingOpening.total++;
      if (isWin) {
        existingOpening.wins++;
        if (playerColor === WHITE) existingOpening.WinAsWhite++;
        else existingOpening.WinAsBlack++;
      } else if (isDraw) {
        existingOpening.draws++;
        if (playerColor === WHITE) existingOpening.DrawAsWhite++;
        else existingOpening.DrawAsBlack++;
      } else {
        existingOpening.losses++;
        if (playerColor === WHITE) existingOpening.LooseAsWhite++;
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
        WinAsBlack: playerColor === BLACK && isWin ? 1 : 0,
        WinAsWhite: playerColor === WHITE && isWin ? 1 : 0,
        LooseAsWhite: playerColor === WHITE && !isWin && !isDraw ? 1 : 0,
        LooseAsBlack: playerColor === BLACK && !isWin && !isDraw ? 1 : 0,
        DrawAsWhite: playerColor === WHITE && isDraw ? 1 : 0,
        DrawAsBlack: playerColor === BLACK && isDraw ? 1 : 0,
      });
    }
  }

  console.log(openingsTab);
  let tab = sortOpenings(openingsTab);
  console.log(tab);
  tab = CleanOpening(tab);
  return tab;
}

function CleanOpening(openingsTab) {
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
  
  
  
  console.log(openingsTab);
  return openingsTab;
}



function sortOpenings(openingsTab) {
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
function getMostPlayedOpenings(openingsTab) {
  let mostPlayed = openingsTab.sort((a, b) => b.total - a.total).slice(0, 5);
  // renvoie un dictio avec les openings les plus joués, la clé opening contient le nom de l'ouverture et la clé total contient le nombre de fois que l'ouverture a été jouée
  let dict = mostPlayed.map(o => ({ opening: o.opening, total: o.total }));
  return dict;
}

// Fonction pour récupérer les openings les plus gagnants
function getMostWinningOpenings(openingsTab) {
  

  // On ne prend que les openings joués plus de 3 fois car forcement quand l'ouverture est jouée une seule fois et elle gagne, elle est gagnante a 100%
  let mostWinning = openingsTab.filter(a => a.total > 3).sort((a, b) => (b.wins / b.total) - (a.wins / a.total)).slice(0, 5);
  // renvoie un dictio avec les openings les plus gagnants, la clé opening contient le nom de l'ouverture et la clé winrate contient le winrate de l'ouverture
  let dict = mostWinning.map(o => ({ opening: o.opening, winrate: ((o.wins / o.total) * 100).toFixed(2) }));
  return dict;
}

// Fonction pour récupérer les openings les plus perdants
function getMostLoosingOpenings(openingsTab) {
  
  let mostLoosing = openingsTab.filter(a => a.total > 3).sort((a, b) => (b.losses / b.total) - (a.losses / a.total)).slice(0, 5);
  // renvoie un dictio avec les openings les plus perdants, la clé opening contient le nom de l'ouverture et la clé winrate contient le winrate de l'ouverture
  let dict = mostLoosing.map(o => ({ opening: o.opening, winrate: ((o.wins / o.total) * 100).toFixed(2) }));
  return dict;
}



(async () => {
    getUsername();
    console.log("Récupération des parties hors ligne");
    await getAllGamesOFFLINE();
    sortByGameType(RAPID);
    initTimeInterval();
    setTimeTinterval(YEAR);

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
    console.log(WinrateByColor(0));
    getElo();
    const openingsTab = getOpenings();
<<<<<<< HEAD
=======

    sortOpenings(openingsTab);

    /*
    console.log("Les openings les plus gagnants sont : ", getMostWinningOpenings(openingsTab));
    console.log("Les openings les plus perdants sont : ", getMostLoosingOpenings(openingsTab));
    console.log("Les openings les plus joués sont : ", getMostPlayedOpenings(openingsTab));
    */
>>>>>>> 16645992e76d6d18ccdf354d762d1a7cf4c8c5c2
})(); 
