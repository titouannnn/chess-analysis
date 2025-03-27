import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PuzzleScraper } from "../../analyse/puzzle.service";
import { RouterModule } from "@angular/router";
import { Api } from "../../api/api.service"; // Importer le service API
import { ChesscomApi } from "../../api/chesscomapi.service";
import { StatsEloComponent } from "../stats-elo/stats-elo.component"; // Import StatsEloComponent


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
  openingsStats: any[] = [];
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
  constructor(
    private puzzleService: PuzzleScraper,
    private apiService: Api, // Ajouter le service API
    private statsEloComponent: StatsEloComponent // Ajouter StatsEloComponent
  ) {}

  ngOnInit(): void {
    this.loadPuzzles();
    this.initializeUserData();
  }

  initializeUserData(): void {
    try {
      // S'assurer que l'API est prête avec les bons filtres
      this.apiService.sortByGameType("4"); // Utiliser un identifiant explicite pour ALL_GENRES
      
      // Initialiser les intervalles de temps comme dans StatsEloComponent
      this.apiService.initTimeInterval();
      this.apiService.setTimeTinterval(
        3, // ALL_TIME
        this.apiService.DATENULL,
        this.apiService.DATENULL
      );
      
      // Utiliser getSortedOpeningsData de StatsEloComponent pour obtenir les données formatées
      this.openingsStats = this.statsEloComponent.getSortedOpeningsData();
      console.log("Statistiques d'ouvertures depuis StatsEloComponent:", this.openingsStats);
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
      const puzzles = this.puzzleService.collectPuzzlesByOpening(formattedOpening);

      // Trouver le taux de victoire de cette ouverture spécifique
      const openingObj = this.findOpeningStats(this.selectedOpening);
      const winRate = openingObj ? openingObj.winRate : 0;

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
        const puzzles = this.puzzleService.collectPuzzlesByOpening(formattedOpening);

        // Ajouter l'information d'ouverture à chaque puzzle avec son taux exact
        const puzzlesWithOpening = puzzles.map((p) => ({
          ...p,
          opening,
          winRate,
        }));
        allRecommendedPuzzles = [...allRecommendedPuzzles, ...puzzlesWithOpening];
      }
    }

    // Le reste de la méthode reste inchangé...
    // ...

    this.filteredPuzzles = allRecommendedPuzzles.map((recPuzzle) => {
      const puzzleId = recPuzzle.URL.split("/").pop() || "";
      const originalPuzzle = this.puzzles.find((p) => p.PuzzleId === puzzleId);

      if (originalPuzzle) {
        return {
          ...originalPuzzle,
          calculatedWinRate: recPuzzle.winRate,
        };
      } else {
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

    // Les données sont déjà triées, il suffit de filtrer par nombre minimum de parties
    const minGames = 3;
    const validOpenings = this.openingsStats.filter(o => o.totalGames >= minGames);

    // Si le tri est inversé par rapport à celui de StatsEloComponent, on inverse la liste
    if ((this.winRateFilter === WinRateFilter.HIGH && this.statsEloComponent.openingsSortOrder === 'asc') ||
        (this.winRateFilter === WinRateFilter.LOW && this.statsEloComponent.openingsSortOrder === 'desc')) {
      validOpenings.reverse();
    }

    // Prendre les 5 premières ouvertures
    return validOpenings.slice(0, 5).map(o => o.name);
  }

  getOpeningWinRate(openingTags: string): number {
    if (!openingTags || !this.openingsStats || this.openingsStats.length === 0) {
      return 0;
    }
    
    // Convertir le format des tags d'ouverture pour correspondre au format dans openingsStats
    const formattedOpening = openingTags.replace(/_/g, ' ');
    
    // Rechercher l'ouverture dans les statistiques avec différentes méthodes de correspondance
    let openingStats = this.findOpeningStats(formattedOpening);
    
    if (!openingStats) {
      return 0;
    }
    
    // Utiliser directement le taux de victoire stocké
    return openingStats.winRate;
  }

  // Méthode auxiliaire pour trouver les statistiques d'une ouverture avec différentes stratégies
  private findOpeningStats(openingName: string): any {
    // 1. Correspondance exacte (insensible à la casse)
    let openingStats = this.openingsStats.find(
      opening => opening.name.toLowerCase() === openingName.toLowerCase()
    );
    
    // 2. Si pas de correspondance exacte, chercher par mots clés significatifs
    if (!openingStats) {
      const openingWords = openingName.toLowerCase().split(' ')
        .filter(word => word.length > 3); // Ignorer les mots courts comme "the", "of", etc.
      
      openingStats = this.openingsStats.find(opening => {
        const statsName = opening.name.toLowerCase();
        // Vérifier si au moins la moitié des mots significatifs correspondent
        const matchingWords = openingWords.filter(word => statsName.includes(word));
        return matchingWords.length > 0 && matchingWords.length >= Math.ceil(openingWords.length / 2);
      });
    }
    
    return openingStats;
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
  getOpeningsDataByWinRate(): any[] {
    if (!this.openingsStats || this.openingsStats.length === 0) {
      return [];
    }

    // Filtrer pour le nombre minimum de parties
    const minGames = 3;
    const validOpenings = this.openingsStats.filter(o => o.totalGames >= minGames);

    // Si besoin, inverser le tri pour correspondre au filtre sélectionné
    let result = [...validOpenings];
    if ((this.winRateFilter === WinRateFilter.HIGH && this.statsEloComponent.openingsSortOrder === 'asc') ||
        (this.winRateFilter === WinRateFilter.LOW && this.statsEloComponent.openingsSortOrder === 'desc')) {
      result.reverse();
    }

    // Limiter à 5 ouvertures
    return result.slice(0, 5);
  }
}