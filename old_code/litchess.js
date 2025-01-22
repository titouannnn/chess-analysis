let Allgames = [];
let gamesJSON = [];

// Fonction permettant de récupérer les parties d'un joueur sur lichess
async function getIDLichessGames(username, max = 200) {

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

    gamesJSON = games.map(game => game.id)

  } catch (error) {
    console.error('Erreur en récupérant les parties:', error);
  }
}

async function getInfoLichessGames() {
  const url = `https://lichess.org/api/games/export/`;
  // On itere le nombre de fois qu'il y a d'id dans le fichier JSON

  for (let i = 0; i < gamesJSON.length; i++) {
    try {
      const response = await fetch(url + gamesJSON[i], {
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

      const game = JSON.parse(result);
      Allgames.push(game)

    } catch (error) {
      console.error('Erreur en récupérant les parties:', error);
    }
  }
}

function downloadJSON(data, filename = 'gamesLitchess.json') {
  // Convertir l'objet JavaScript en une chaîne JSON
  const jsonData = JSON.stringify(data, null, 2);

  // Créer un objet Blob avec le contenu JSON
  const blob = new Blob([jsonData], { type: 'application/json' });

  // Créer un lien temporaire pour le téléchargement
  const link = document.createElement('a');

  // Définir l'URL de téléchargement pour le Blob
  link.href = URL.createObjectURL(blob);

  // Définir le nom du fichier
  link.download = filename;

  // Ajouter le lien à la page (il ne sera pas visible)
  document.body.appendChild(link);

  // Déclencher le téléchargement en simulant un clic sur le lien
  link.click();

  // Supprimer le lien temporaire
  document.body.removeChild(link);
}


(async () => {
  
  await downloadJSON(Allgames, 'gamesLitchessInfo.json');
})(); 