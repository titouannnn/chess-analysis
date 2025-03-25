import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PuzzleScraper } from "../../analyse/puzzle.service";
import { RouterModule } from "@angular/router";
import { Api } from "../../api/api.service"; // Importer le service API
import { ChesscomApi } from "../../api/chesscomapi.service";

interface Puzzle {
  PuzzleId: string;
  Rating: number;
  Themes: string;
  OpeningTags: string;
  GameUrl: string;
  FEN: string;
  calculatedWinRate?: number; // Nouvelle propriété pour stocker le taux précalculé
}

enum WinRateFilter {
  NONE = "none",
  HIGH = "high",
  LOW = "low",
}

@Component({
  selector: "app-puzzles",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./puzzles.component.html",
  styleUrl: "./puzzles.component.css",
})
export class PuzzlesComponent implements OnInit {
  searchOpening: string = "";
  showOpeningDropdown: boolean = false;
  puzzles: Puzzle[] = [];
  filteredPuzzles: Puzzle[] = [];
  isLoading: boolean = true;
  errorMessage: string = "";

  // Filtres
  openings: string[] = [];
  selectedOpening: string = "";

  // Nouvelles propriétés pour les thèmes
  availableThemes: string[] = [];
  selectedThemes: string[] = [];
  showThemeDropdown: boolean = false;
  searchTheme: string = "";

  // Filtre par taux de victoire
  winRateFilter: WinRateFilter = WinRateFilter.NONE;
  winRateOptions = [
    { value: WinRateFilter.NONE, label: "Pas de filtre par taux de victoire" },
    {
      value: WinRateFilter.HIGH,
      label: "Ouvertures avec haut taux de victoire",
    },
    {
      value: WinRateFilter.LOW,
      label: "Ouvertures avec faible taux de victoire",
    },
  ];

  // Puzzles recommandés par ouverture
  recommendedPuzzles: {
    recommendedPoints: number;
    Rating: number;
    URL: string;
  }[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  openingsStats: any[] = [];

  constructor(
    private puzzleService: PuzzleScraper,
    private apiService: Api // Ajouter le service API
  ) {}

  ngOnInit(): void {
    this.loadPuzzles();
    this.initializeUserData();
  }

  // Méthode pour initialiser les données utilisateur
  initializeUserData(): void {
    try {
      // Utiliser une chaîne vide ou "4" au lieu de l'enum
      this.apiService.sortByGameType("");
      
      // Initialiser les intervalles de temps
      this.apiService.initTimeInterval();
      // Utiliser 3 au lieu de l'enum
      this.apiService.setTimeTinterval(
        3, // Valeur numérique de ALL_TIME (3)
        this.apiService.DATENULL,
        this.apiService.DATENULL
      );
      
      // Récupérer les statistiques d'ouvertures
      this.openingsStats = this.apiService.getOpenings();
      console.log("Statistiques d'ouvertures chargées:", this.openingsStats);
    } catch (error) {
      console.error("Erreur lors de l'initialisation des données utilisateur:", error);
    }
  }

  loadPuzzles(): void {
    this.isLoading = true;

    this.puzzleService.getPuzzles().subscribe({
      next: (data) => {
        this.puzzles = data;
        this.extractOpenings();
        this.extractThemes();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error loading puzzles", error);
        this.errorMessage =
          "Erreur lors du chargement des puzzles. Veuillez réessayer.";
        this.isLoading = false;
      },
    });
  }

  extractOpenings(): void {
    // Extraire toutes les ouvertures uniques des puzzles
    const openingsSet = new Set<string>();

    this.puzzles.forEach((puzzle) => {
      if (puzzle.OpeningTags) {
        const openingsList = puzzle.OpeningTags.split(" ");
        openingsList.forEach((opening) => {
          if (opening) {
            // Convertir les underscores en espaces pour l'affichage
            const formattedOpening = opening.replace(/_/g, " ");
            openingsSet.add(formattedOpening);
          }
        });
      }
    });

    this.openings = Array.from(openingsSet).sort();
  }

  // Nouvelle méthode pour extraire les thèmes
  extractThemes(): void {
    const themesSet = new Set<string>();

    this.puzzles.forEach((puzzle) => {
      if (puzzle.Themes) {
        const themesList = puzzle.Themes.split(" ");
        themesList.forEach((theme) => {
          if (theme) {
            themesSet.add(theme);
          }
        });
      }
    });

    this.availableThemes = Array.from(themesSet).sort();
  }

  applyFilters(): void {
    // Si le filtre de taux de victoire est activé, utiliser collectPuzzlesByOpening
    if (this.winRateFilter !== WinRateFilter.NONE) {
      this.applyWinRateFilter();
      return;
    }

    this.filteredPuzzles = this.puzzles.filter((puzzle) => {
      // Filtre SOIT par ouverture SOIT par thème
      if (this.selectedThemes.length > 0) {
        // Si des thèmes sont sélectionnés, on filtre uniquement par thème
        if (puzzle.Themes) {
          // Vérifie si au moins un des thèmes sélectionnés est présent
          return this.selectedThemes.some((selectedTheme) =>
            puzzle.Themes.split(" ").includes(selectedTheme)
          );
        } else {
          return false;
        }
      } else if (this.selectedOpening && puzzle.OpeningTags) {
        // Sinon, on filtre par ouverture (si sélectionnée)
        const formattedOpenings = puzzle.OpeningTags.replace(/_/g, " ");
        if (!formattedOpenings.includes(this.selectedOpening)) {
          return false;
        }
      }

      return true;
    });

    // Réinitialiser la pagination
    this.currentPage = 1;
  }

  // Modifier la méthode applyWinRateFilter()

  applyWinRateFilter(): void {
    this.isLoading = true;
    this.filteredPuzzles = [];

    // Récupérer les ouvertures en fonction du taux de victoire avec leurs taux
    const openingsData = this.getOpeningsDataByWinRate();

    if (openingsData.length === 0) {
      this.isLoading = false;
      return;
    }

    // On va stocker ici tous les puzzles recommandés avec leur taux de victoire
    let allRecommendedPuzzles: {
      recommendedPoints: number;
      Rating: number;
      URL: string;
      opening: string;
      winRate: number;
    }[] = [];

    // Si une ouverture spécifique est sélectionnée, l'utiliser en priorité
    if (this.selectedOpening) {
      const formattedOpening = this.selectedOpening.replace(/ /g, "_");
      const puzzles =
        this.puzzleService.collectPuzzlesByOpening(formattedOpening);

      // Trouver le taux de victoire de cette ouverture spécifique
      const openingObj = this.openingsStats.find(
        (o) => o.nom.toLowerCase() === this.selectedOpening.toLowerCase()
      );
      const winRate = openingObj ? this.calculateWinRate(openingObj.stats) : 0;

      allRecommendedPuzzles = puzzles.map((p) => ({
        ...p,
        opening: this.selectedOpening,
        winRate,
      }));
    } else {
      // Sinon, collecter les puzzles pour chaque ouverture recommandée
      for (let i = 0; i < Math.min(3, openingsData.length); i++) {
        const opening = openingsData[i].name;
        const winRate = openingsData[i].winRate;
        const formattedOpening = opening.replace(/ /g, "_");
        const puzzles =
          this.puzzleService.collectPuzzlesByOpening(formattedOpening);

        // Ajouter l'information d'ouverture à chaque puzzle avec son taux exact
        const puzzlesWithOpening = puzzles.map((p) => ({
          ...p,
          opening,
          winRate,
        }));
        allRecommendedPuzzles = [
          ...allRecommendedPuzzles,
          ...puzzlesWithOpening,
        ];
      }
    }

    // Maintenant, il faut récupérer les informations complètes des puzzles
    this.filteredPuzzles = allRecommendedPuzzles.map((recPuzzle) => {
      const puzzleId = recPuzzle.URL.split("/").pop() || "";

      // Chercher le puzzle correspondant dans la liste originale
      const originalPuzzle = this.puzzles.find((p) => p.PuzzleId === puzzleId);

      if (originalPuzzle) {
        // Retourner le puzzle original mais en ajoutant le taux précalculé
        return {
          ...originalPuzzle,
          calculatedWinRate: recPuzzle.winRate,
        };
      } else {
        // Sinon, créer un puzzle avec l'information d'ouverture et son taux
        return {
          PuzzleId: puzzleId,
          Rating: recPuzzle.Rating,
          Themes: "",
          OpeningTags: recPuzzle.opening.replace(/ /g, "_"),
          GameUrl: "",
          FEN: "",
          calculatedWinRate: recPuzzle.winRate,
        };
      }
    });

    this.currentPage = 1;
    this.isLoading = false;
  }

  // Helper pour calculer le taux de victoire de manière cohérente
  calculateWinRate(stats: any): number {
    const totalGames =
      stats.WinAsWhite +
      stats.WinAsBlack +
      stats.LooseAsWhite +
      stats.LooseAsBlack +
      stats.DrawAsWhite +
      stats.DrawAsBlack;

    if (totalGames === 0) return 0;

    const wins = stats.WinAsWhite + stats.WinAsBlack;
    return (wins / totalGames) * 100;
  }

  // Nouvelle méthode pour obtenir les ouvertures selon le taux de victoire
  getOpeningsByWinRate(): string[] {
    if (!this.openingsStats || this.openingsStats.length === 0) {
      return [];
    }

    // Calculer le taux de victoire pour chaque ouverture
    const openingsWithWinRate = this.openingsStats.map((opening) => {
      const stats = opening.stats;
      const totalGames =
        stats.WinAsWhite +
        stats.WinAsBlack +
        stats.LooseAsWhite +
        stats.LooseAsBlack +
        stats.DrawAsWhite +
        stats.DrawAsBlack;

      const wins = stats.WinAsWhite + stats.WinAsBlack;
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

      return {
        name: opening.nom,
        winRate,
        totalGames,
      };
    });

    // Filtrer pour ne garder que les ouvertures avec un nombre minimum de parties
    const minGames = 3;
    const validOpenings = openingsWithWinRate.filter(
      (o) => o.totalGames >= minGames
    );

    // Trier selon le filtre sélectionné
    if (this.winRateFilter === WinRateFilter.HIGH) {
      validOpenings.sort((a, b) => b.winRate - a.winRate);
    } else if (this.winRateFilter === WinRateFilter.LOW) {
      validOpenings.sort((a, b) => a.winRate - b.winRate);
    }

    // Prendre les 5 premières ouvertures
    return validOpenings.slice(0, 5).map((o) => o.name);
  }

  getOpeningWinRate(openingTags: string): number {
    if (
      !openingTags ||
      !this.openingsStats ||
      this.openingsStats.length === 0
    ) {
      return 0;
    }

    // Convertir le format des tags d'ouverture pour correspondre au format dans openingsStats
    const formattedOpening = openingTags.replace(/_/g, " ");

    // Rechercher l'ouverture dans les statistiques - essayer plusieurs méthodes de correspondance
    // 1. Chercher correspondance exacte
    let openingStats = this.openingsStats.find(
      (opening) => opening.nom.toLowerCase() === formattedOpening.toLowerCase()
    );

    // 2. Si pas de correspondance exacte, chercher correspondance partielle
    if (!openingStats) {
      const openingWords = formattedOpening.toLowerCase().split(" ");
      openingStats = this.openingsStats.find((opening) => {
        const statsName = opening.nom.toLowerCase();
        return openingWords.some(
          (word) => statsName.includes(word) && word.length > 3
        );
      });
    }

    if (!openingStats) {
      return 0;
    }

    const stats = openingStats.stats;
    const totalGames =
      stats.WinAsWhite +
      stats.WinAsBlack +
      stats.LooseAsWhite +
      stats.LooseAsBlack +
      stats.DrawAsWhite +
      stats.DrawAsBlack;

    if (totalGames === 0) {
      return 0;
    }

    const wins = stats.WinAsWhite + stats.WinAsBlack;
    return (wins / totalGames) * 100;
  }

  resetFilters(): void {
    this.selectedOpening = "";
    this.selectedThemes = [];
    this.winRateFilter = WinRateFilter.NONE;
    this.applyFilters();
  }

  toggleTheme(theme: string): void {
    const index = this.selectedThemes.indexOf(theme);
    if (index === -1) {
      // Thème pas encore sélectionné, on l'ajoute
      this.selectedThemes.push(theme);
    } else {
      // Thème déjà sélectionné, on le retire
      this.selectedThemes.splice(index, 1);
    }

    // Si on sélectionne des thèmes, on réinitialise l'ouverture sélectionnée
    if (this.selectedThemes.length > 0) {
      this.selectedOpening = "";
      this.winRateFilter = WinRateFilter.NONE; // Désactiver aussi le filtre de taux de victoire
    }

    this.applyFilters();
  }

  // Méthode pour filtrer les ouvertures dans le dropdown de recherche
  get filteredOpenings(): string[] {
    if (!this.searchOpening) return this.openings;

    return this.openings.filter((opening) =>
      opening.toLowerCase().includes(this.searchOpening.toLowerCase())
    );
  }

  // Méthode pour basculer l'affichage du dropdown d'ouvertures
  toggleOpeningDropdown(): void {
    this.showOpeningDropdown = !this.showOpeningDropdown;
  }

  // Méthode pour sélectionner une ouverture à partir de la recherche
  selectOpening(opening: string): void {
    this.selectedOpening = opening;
    this.showOpeningDropdown = false;
    this.applyFilters();
  }

  toggleThemeDropdown(): void {
    this.showThemeDropdown = !this.showThemeDropdown;
  }

  onWinRateFilterChange(): void {
    if (this.winRateFilter !== WinRateFilter.NONE) {
      this.selectedThemes = []; // Désélectionner les thèmes
    }
    this.applyFilters();
  }

  // Méthode pour filtrer les thèmes dans le dropdown de recherche
  get filteredThemes(): string[] {
    if (!this.searchTheme) return this.availableThemes;

    return this.availableThemes.filter((theme) =>
      theme.toLowerCase().includes(this.searchTheme.toLowerCase())
    );
  }

  get paginatedPuzzles(): Puzzle[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPuzzles.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPuzzles.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPuzzleUrl(puzzleId: string): string {
    return `https://lichess.org/training/${puzzleId}`;
  }

  getGameUrl(gameUrl: string): string {
    return gameUrl || "#";
  }

  getPages(): number[] {
    const pages = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(
        1,
        this.currentPage - Math.floor(maxPagesToShow / 2)
      );
      let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  formatOpeningTags(tags: string): string {
    if (!tags) return "";
    return tags.replace(/_/g, " ");
  }

  // Renommée pour clarifier qu'elle retourne des objets complets, pas juste des noms
  getOpeningsDataByWinRate(): {
    name: string;
    winRate: number;
    totalGames: number;
  }[] {
    if (!this.openingsStats || this.openingsStats.length === 0) {
      return [];
    }

    // Calculer le taux de victoire pour chaque ouverture
    const openingsWithWinRate = this.openingsStats.map((opening) => {
      const stats = opening.stats;
      const totalGames =
        stats.WinAsWhite +
        stats.WinAsBlack +
        stats.LooseAsWhite +
        stats.LooseAsBlack +
        stats.DrawAsWhite +
        stats.DrawAsBlack;

      const wins = stats.WinAsWhite + stats.WinAsBlack;
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

      return {
        name: opening.nom,
        winRate,
        totalGames,
      };
    });

    // Filtrer pour ne garder que les ouvertures avec un nombre minimum de parties
    const minGames = 3;
    const validOpenings = openingsWithWinRate.filter(
      (o) => o.totalGames >= minGames
    );

    // Trier selon le filtre sélectionné
    if (this.winRateFilter === WinRateFilter.HIGH) {
      validOpenings.sort((a, b) => b.winRate - a.winRate);
    } else if (this.winRateFilter === WinRateFilter.LOW) {
      validOpenings.sort((a, b) => a.winRate - b.winRate);
    }

    // Prendre les 5 premières ouvertures
    return validOpenings.slice(0, 5);
  }
}