import { Injectable } from '@angular/core';
import * as localData from '../../assets/lichess_db_puzzle_reduit.json';

@Injectable({
  providedIn: 'root'
})
export class PuzzleScraper {

  public puzzles: any[] = [];

  readPuzzle() {
    console.log("Tentative de récupération des puzzles hors ligne");
    try {
      const data = (localData as any).default || localData; // Gère les différences d'importation

      if (!Array.isArray(data)) {
        throw new Error("Le format des données JSON est invalide.");
      }

      for (const item of data) {
        if (item.OpeningTags) {
          this.puzzles.push(item.OpeningTags); // Ajoute directement OpeningTags
        } else {
          console.warn("L'élément ne contient pas de propriété 'OpeningTags' valide :", item);
        }
      }

      console.log("Les données ont été récupérées :", this.puzzles);
    } catch (error) {
      console.error("Erreur lors de la récupération des puzzles hors ligne", error);
    }
  }
}
