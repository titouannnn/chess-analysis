let Allgames = [];

// Fonction permettant de récupérer les parties d'un joueur sur lichess
async function getLichessGamesOnline(username, max = 200) {

  // C'est dans cette url que l'on pourra spécifier le type de parties, le nombre de parties à récupérer, etc.
  const url = `https://lichess.org/api/games/user/${username}?max=${max}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/x-ndjson',
      }
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
    let done = false;
    
    // Convertie et traite les données reçues pour les ranger dans un tableau
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      result += decoder.decode(value || new Uint8Array(), { stream: !done });
    }

    const games = result.split('\n').filter(Boolean).map(JSON.parse);
    console.log(games);

    //console.log(games[1].clock);

    

  } catch (error) {
    console.error('Erreur en récupérant les parties:', error);
  }
}


(async () => {
     console.log("Récupération des 10 dernieres parties litchess...");
     getLichessGamesOnline('titouan41', 10);
})(); 