/* Constante contenant toutes les parties, chargée par la fonction getAllGames(username)*/
let allGames = [];
let allGamesAllTypes = [];
let nombrePartiesTotal = 0;
let dateDebut;
let dateFin;
const RegExpDate = /\[UTCDate\s+"([^"]+)"\]/;
let username = "";

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

export function getUsername() {
  username = "titouannnnnn";
  console.log("username :", username);
  return username;
}

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
      allGamesAllTypes.push(...data.games);
    }
    console.log(
      `Nombre total de parties pour ${username} : ${allGamesAllTypes.length}`
    );
    console.log(allGamesAllTypes);
  } catch (error) {
    console.error("Erreur :", error);
  }
}

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

function getNombrePartiesTotal() {
  nombrePartiesTotal = allGames.filter((game) => {
    const gameDate = new Date(game.pgn.match(RegExpDate)[1]);
    return gameDate >= dateDebut && gameDate <= dateFin;
  }).length;
}

function initTimeInterval() {
  dateDebut = new Date(allGames[0].pgn.match(RegExpDate)[1]);
  dateFin = new Date(allGames[allGames.length - 1].pgn.match(RegExpDate)[1]);
}

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
      console.error("Erreur type de temps");
  }
}

function GetAccuracy() {
  let accuracy = 0;
  let nbGames = 0;
  for (const game of allGames) {
    const gameDate = new Date(game.pgn.match(RegExpDate)[1]);
    if (gameDate >= dateDebut && gameDate <= dateFin) {
      //get the color of the player
      if (game.white.username == username) {
        playerColor = 1;
      } else if (game.black.username == username) {
        playerColor = 0;
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
/*
(async () => {
    getUsername();
    console.log("Récupération des parties hors ligne");
    await getAllGamesOFFLINE();
    sortByGameType(RAPID);
    initTimeInterval();
    setTimeTinterval(YEAR);
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
    

})(); */
