import { Injectable } from '@angular/core';

interface Game {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  white: Player;
  black: Player;
  eco?: string;
}

interface Player {
  rating: number;
  result: string;
  username: string;
  uuid: string;
}

interface InputJson {
  id: string;
  rated: boolean;
  moves: string;
  pgn: string;
  clock: { initial: number; increment: number; totalTime: number };
  players: { white: PlayerData; black: PlayerData };
  status: string;
  winner: string;
  createdAt: number;
  lastMoveAt: number;
  opening: { eco: string; name: string; ply: number };
}

interface PlayerData {
  user: { name: string; id: string };
  rating: number;
  provisional: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class LitchessApiService {

  public gamesID: any[] = [];
  public allGames: any[] = [];
  public allGamesJson: any[] = [];
    // Fonction permettant de récupérer les parties d'un joueur sur lichess
  async getIDLichessGames(username: string, max: number = 200): Promise<void> {
    // URL pour spécifier le type de parties, le nombre de parties à récupérer, etc.
    const url = `https://lichess.org/api/games/user/${username}?max=${max}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/x-ndjson',
        },
      });

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

      const games: any[] = result.split('\n').filter(Boolean).map((line) => JSON.parse(line));

      this.gamesID = games.map(game => game.id)

      // Exemple d'accès à une propriété spécifique
      //console.log(games[1].clock);

    } catch (error) {
      console.error('Erreur en récupérant les parties:', error);
    }
  }

  async getInfoLichessGames() {
    const baseUrl = `https://lichess.org/game/export/`;

    // On itere le nombre de fois qu'il y a d'id dans le fichier JSON
    if (!this.gamesID || this.gamesID.length === 0) {
      console.warn('Aucun ID de partie fourni.');
      return;
    }

    for (let i = 0; i < this.gamesID.length; i++) {
      try {
        const url = `${baseUrl}${this.gamesID[i]}?pgnInJson=true`;
        //console.log(url);
        const response = await fetch(url, {
          
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const game = await response.json();
  
        this.allGames.push(game);
  
      } catch (error) {
        console.error('Erreur en récupérant les parties:', error);
      }
    }
  }
  
  async sortJson(inputs: InputJson[]): Promise<Game[]> {
    return inputs.map((input) => {
      const { players, pgn, clock, lastMoveAt, rated, opening, id, winner } = input;
  
      return {
        url: `https://lichess.org/${id}`,
        pgn: pgn,
        time_control: `${clock.initial}`,
        end_time: Math.floor(lastMoveAt / 1000), // Conversion du timestamp en secondes
        rated: rated,
        white: {
          rating: players.white.rating,
          result: winner === 'white' ? 'win' : 'lose',
          username: players.white.user.name,
          uuid: players.white.user.id,
        },
        black: {
          rating: players.black.rating,
          result: winner === 'black' ? 'win' : 'lose',
          username: players.black.user.name,
          uuid: players.black.user.id,
        },
        eco: opening?.eco ? `https://lichess.org/openings/${opening.eco.replace(/\s/g, '-')}` : undefined,
      };
    });
  }
}


