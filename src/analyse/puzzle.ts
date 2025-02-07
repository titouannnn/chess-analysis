import { Injectable } from '@angular/core';
import * as localData from '../../assets/lichess_db_puzzle_reduit.json';

@Injectable({
  providedIn: 'root'
})
export class PuzzleScraper {

    public puzzlesUrl: string[] = [];

    collectPuzzlesByOpening(opening: String) {
        console.log("Tentative de récupération des puzzles hors ligne");
        try {
            const data = (localData as any).default || localData; // Gère les différences d'importation

            if (!Array.isArray(data)) {
                throw new Error("Le format des données JSON est invalide.");
        }

            for (const item of data) {
                if(item.OpeningTags) {

                    if(item.OpeningTags.toLowerCase().includes(opening.toLowerCase())) {
                        if(item.GameUrl) {
                            this.puzzlesUrl.push(item.GameUrl);
                        }
                        else {
                            console.warn("Pas de Game URL");
                        }
                    }
                }
                else {
                    console.warn("L'élément ne contient rien ou non valide");
                }
            }

            console.log("Les données ont été récupérées :");
        } catch (error) {
            console.error("Erreur lors de la récupération des puzzles hors ligne", error);
        }
        return this.puzzlesUrl;

    }
}
