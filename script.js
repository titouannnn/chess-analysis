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
  console.log("Récupération des elos");
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
    console.log(WinrateByColor(0));

    console.log("Calcul de l'accuracy");
    console.log(GetAccuracy());

    */
    getElo();
    getAccuracyList();
    

})(); 
