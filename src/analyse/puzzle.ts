import { Injectable } from '@angular/core';
import * as localData from '../assets/lichess_db_puzzle_reduit.json';

@Injectable({
  providedIn: 'root'
})
export class PuzzleScraper {

    public puzzlesUrl: string[] = [];

    collectPuzzlesByOpening(opening: string): string[] {
        console.log("Tentative de récupération des puzzles hors ligne");
        this.puzzlesUrl = []; // Réinitialisation
    
        try {
            const data = (localData as any).default || localData;
            if (!Array.isArray(data)) {
                throw new Error("Le format des données JSON est invalide.");
            }
    
            let matchCount: { [puzzleId: string]: number } = {}; // Stocke les correspondances
    
            let openings: string[] = opening
                .split("-")             
                .filter(tag => tag.toLowerCase() !== "game");  // Enlève "Game"
    
            if (openings.length === 0) return [];
    
            const mainOpening = openings[0].toLowerCase(); // Ouverture principale
            const otherTags = openings.slice(1); // Configuration
    
            for (const item of data) {
                if (item.OpeningTags && typeof item.OpeningTags === 'string' && item.PuzzleId) {
                    let count = 0;
    
                    // Vérifie si l'OpeningTags contient l'ouverture principale et donne un bonus
                    if (item.OpeningTags.toLowerCase().includes(mainOpening)) {
                        count += 10; // Priorité forte pour le nom de l'ouverture
                    }
    
                    // Vérifie les autres tags et ajoute au score
                    for (const openingTag of otherTags) {
                        if (item.OpeningTags.toLowerCase().includes(openingTag.toLowerCase())) {
                            count++; // Priorité normale pour la configuration
                        }
                    }
    
                    if (count > 0) {
                        matchCount[item.PuzzleId] = count;
                    }
                }
            }
    
            // Trier par score décroissant (priorité forte sur le premier tag)
            this.puzzlesUrl = Object.keys(matchCount)
                .sort((a, b) => matchCount[b] - matchCount[a])
                .slice(0,10);

            this.puzzlesUrl = this.puzzlesUrl.map(url => "https://lichess.org/training/" + url);
            console.log("Puzzles trouvés et triés :", this.puzzlesUrl);
        } catch (error) {
            console.error("Erreur lors de la récupération des puzzles hors ligne", error);
        }

        return this.puzzlesUrl;
        
    }
    

    
    sortJsonKeepOpenings(): any[] {
        console.log("Tri des données en gardant les ouvertures");
        let jsonSorted: any[] = [];

        try {
            const data = (localData as any).default || localData;

            if (!Array.isArray(data)) {
                throw new Error("Le format des données JSON est invalide.");
            }

            jsonSorted = data.filter(item => item.OpeningTags); // Garde uniquement ceux avec une ouverture

            console.log("Nombre d'éléments triés :", jsonSorted.length);
        } catch (error) {
            console.error("Erreur lors du tri des puzzles", error);
        }

        return jsonSorted;
    }
    
}
