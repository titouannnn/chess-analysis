import { Component, ElementRef, Injectable, ViewChild, AfterViewInit, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { Api, Constantes } from '../../api/api.service';
import { LitchessApi } from '../../api/litchess-api.service';
import { ChesscomApi } from '../../api/chesscomapi.service';
import { ChartJS } from '../../api/ChartJS.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import Chart from 'chart.js/auto';


// Interface pour les données de fréquence de jeu
interface FrequencyData {
  occurences: number;
  mois: string;
}

// Interface pour les données d'ELO
interface EloData {
  rating: number;
  timestamp: number;
}

enum W_B {
  Black = "black",
  White = "white",
  W_B = "w/b"
}

@Component({
  selector: 'app-stats-elo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-elo.component.html',
  styleUrl: './stats-elo.component.css',
  host: { id: 'stats-elo-unique' }
})
@Injectable({ providedIn: 'root'})
export class StatsEloComponent implements AfterViewInit, OnInit {  
  @ViewChild('eloStats') eloStats !: ElementRef;
  @ViewChild('playFrequencyStats') frequencyStats !: ElementRef;
  @ViewChild('gamesBy') gamesByStats !: ElementRef;
  @ViewChild('openingsStats') openingsStats!: ElementRef; // Ajout de la référence pour le graphique des ouvertures
  
  W_B = W_B; // Exporter l'énumération pour l'utiliser dans le HTML
  // Variables utilisées pour le HTML
  timePeriod = Constantes.Time; 
  typeJeu = Constantes.TypeJeuChessCom;
  annee = 2024;
  w_b : W_B = W_B.Black;
  activeTimeClass: Constantes.TypeJeuChessCom = Constantes.TypeJeuChessCom.RAPID;
  activePeriod: Constantes.Time = Constantes.Time.ALL_TIME;

  openingsForPuzzles: any[] = [];

  eloChart: any = null;
  playFreqChart: any = null;
  chartGamesBy: any[] = [];
  openingsChart: any = null; 

  openingsSortOrder: 'asc' | 'desc' = 'desc'; // 'desc' par défaut (du plus élevé au plus faible)

  
  // Indicateur de chargement initial
  private initialized = false;

  // Palettes de couleurs pour les graphiques
  chartColors = {
    elo: {
      borderColor: 'rgba(78, 203, 255, 1)',
      backgroundColor: 'rgba(78, 203, 255, 0.1)',
      pointBackgroundColor: 'rgba(78, 203, 255, 1)',
      pointBorderColor: '#1e1e2f',
    },
    frequency: {
      backgroundColor: 'rgba(129, 129, 255, 0.5)',
      hoverBackgroundColor: 'rgba(129, 129, 255, 0.75)',
    },
    games: [
      // Remplacer les couleurs actuelles des victoires par une palette plus contrastée
      ['#2ed573', '#9b59b6', '#3498db', '#ff9f43'],  // Vert, Violet, Bleu, Orange
      ['#2ed573', '#9b59b6', '#3498db', '#ff9f43'],  // Couleurs pour les nulles (inchangées)
      ['#2ed573', '#9b59b6', '#3498db', '#ff9f43']   // Couleurs pour les défaites (inchangées)
    ]
  };

  // Pour le filtre de dates personnalisé
  customStartDate: Date | null = null;
  customEndDate: Date | null = null;


  // Référence à l'API utilisée (Chess.com ou Lichess)
  private api!: Api;
  private chartGenerator: ChartJS;
  
  constructor(
    private chessApi: ChesscomApi, 
    private lichessApi: LitchessApi, 
    chartGenerator: ChartJS,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { 
    this.chartGenerator = chartGenerator;
  }
  
  ngOnInit(): void {
    // Récupérer les paramètres d'URL s'ils existent
    this.route.queryParams.subscribe(params => {
      const platform = params['platform'];
      const username = params['pseudo'];
      
      if (username) {
        console.log(`Paramètres d'URL détectés: platform=${platform}, username=${username}`);
        
        // Définir les valeurs par défaut
        this.activeTimeClass = Constantes.TypeJeuChessCom.RAPID;
        this.activePeriod = Constantes.Time.ALL_TIME;
      }
    });
    
    // Déterminer quelle API utiliser
    this.detectAndUseInitializedApi();
  }

  private cleanupCharts(): void {
    // Nettoyer proprement le graphique d'ELO
    if (this.eloChart) {
      this.eloChart.destroy();
      this.eloChart = null;
    }

    // Nettoyer proprement le graphique de fréquence
    if (this.playFreqChart) {
      this.playFreqChart.destroy();
      this.playFreqChart = null;
    }

    // Nettoyer proprement les graphiques de résultats
    if (this.chartGamesBy && this.chartGamesBy.length > 0) {
      this.chartGamesBy.forEach((chart) => {
        if (chart) chart.destroy();
      });
      this.chartGamesBy = [];
    }
  }
  
  private detectAndUseInitializedApi(): void {
    // Vérifier si des données sont déjà chargées dans l'API Chess.com
    if (this.chessApi.allGamesAllTypes && this.chessApi.allGamesAllTypes.length > 0) {
      console.log('Utilisation des données Chess.com déjà chargées');
      this.api = this.chessApi;
    } 
    // Vérifier si des données sont déjà chargées dans l'API Lichess
    else if (this.lichessApi.allGamesJson && this.lichessApi.allGamesJson.length > 0) {
      console.log('Utilisation des données Lichess déjà chargées');
      // Utiliser un cast pour contourner la vérification de type
      this.api = this.lichessApi as unknown as Api;
    } 
    // Si aucune donnée n'est chargée, afficher une erreur et utiliser Chess.com par défaut
    else {
      console.error('Aucune donnée préchargée trouvée, veuillez charger des données depuis la page d\'accueil');
      this.api = this.chessApi; // Fallback par défaut
    }
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      // Vérifier si l'API est initialisée
      if (!this.api) {
        console.error('API non initialisée, impossible de charger les graphiques');
        return;
      }
      
      console.log('Initialisation des graphiques avec les données existantes');
      
      // Configurer les valeurs par défaut
      this.activeTimeClass = Constantes.TypeJeuChessCom.RAPID;  // "Rapide" par défaut
      this.activePeriod = Constantes.Time.ALL_TIME;            // "Tout" par défaut
      this.annee = 2024;                                      // Année 2024 par défaut
      
      // Initialiser les graphiques avec les valeurs par défaut
      this.api.sortByGameType(this.activeTimeClass);
      this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
      
      this.initializeCharts();
      this.cdr.detectChanges();
    }, 100);
  }
  
  private initializeCharts(): void {
    if (this.initialized) return;
    
    // Exécuter les opérations de graphiques en dehors de la zone
    this.zone.runOutsideAngular(() => {
      try {
        // Initialiser tous les graphiques dans l'ordre
        this.showEloStat(this.activeTimeClass, this.activePeriod);
        this.showPlayFrequency();
        this.showGamesBy();
        this.showOpeningsStats(); // Ajout du graphique des ouvertures
        
        this.initialized = true;
        
        // Revenir dans la zone Angular pour déclencher la détection des changements
        this.zone.run(() => {
          this.cdr.detectChanges();
        });
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des graphiques:', error);
        
        // Nouvelle tentative si l'initialisation échoue
        setTimeout(() => {
          this.initialized = false;
          this.initializeCharts();
        }, 500);
      }
    });
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  }

  extendChartOptions(chart: any, options: any): void {
    if (!chart || !chart.options) return;
    
    // Appliquer des animations
    chart.options.animation = {
      duration: 800,
      easing: 'easeOutCubic'
    };
    
    // Appliquer d'autres options
    if (options.colors) {
      if (Array.isArray(options.colors)) {
        // Pour les camemberts avec des couleurs différentes par segment
        const backgroundColors = options.colors.map((color: any) => color.backgroundColor);
        chart.data.datasets[0].backgroundColor = backgroundColors;
      } else {
        // Pour les autres types de graphiques
        for (const key in options.colors) {
          if (options.colors.hasOwnProperty(key)) {
            chart.data.datasets[0][key] = options.colors[key];
          }
        }
      }
    }
    
    if (options.plugins) {
      chart.options.plugins = {
        ...chart.options.plugins,
        ...options.plugins
      };
    }
    
    // Mettre à jour le graphique
    chart.update();
  }

  // Récupère les dates de début et de fin pour un mois donné
  getMonthDates(year: number, month: number): { firstDay: Date; lastDay: Date } {
    const firstDay = new Date(year, month - 1, 1); 
    const lastDay = new Date(year, month, 0); 
    return { firstDay, lastDay };
  }

  // Récupère les données de fréquence de jeu pour une année donnée
  getPlayFrequency(year: number): FrequencyData[] {
    const months = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Août", "Sept", "Oct", "Nov", "Déc"
    ];
    
    // Sauvegarder les filtres actuels
    const savedDateDebut = this.api.dateDebut ? new Date(this.api.dateDebut) : null;
    const savedDateFin = this.api.dateFin ? new Date(this.api.dateFin) : null;
    const savedTimeClass = this.activeTimeClass;
    const savedAllGames = [...this.api.allGames]; // Sauvegarder la liste des parties courante
    
    const data: FrequencyData[] = [];
    
    for (let i = 1; i <= 12; i++) {
      const { firstDay, lastDay } = this.getMonthDates(year, i);
      
      // Filtrer explicitement les parties pour ce mois
      const partiesForMonth = this.api.allGamesAllTypes.filter((game: any) => {
        if (!game.pgn) return false;
        
        const match = game.pgn.match(this.api.RegExpDate);
        if (!match || !match[1]) return false;
        
        const gameDate = new Date(match[1]);
        return gameDate >= firstDay && gameDate <= lastDay && 
               (!savedTimeClass || game.time_class === savedTimeClass);
      });
      
      data.push({ 
        occurences: partiesForMonth.length, 
        mois: months[i-1] 
      });
    }
    
    // Restaurer les dates et filtres originaux
    if (savedDateDebut && savedDateFin) {
      this.api.setTimeTinterval(Constantes.Time.CUSTOM, savedDateDebut, savedDateFin);
    } else {
      this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
    }
    
    // Restaurer le filtre de type de jeu
    this.api.sortByGameType(savedTimeClass);
    
    return data;
  }

  setCustomDateRange(start: Date, end: Date): void {
    this.customStartDate = start;
    this.customEndDate = end;
    this.showEloStat(undefined, Constantes.Time.CUSTOM);
  }

  showEloStat(time_class?: Constantes.TypeJeuChessCom, timePeriod?: Constantes.Time) {
    if (!this.eloStats?.nativeElement || !this.api) {
      console.warn('Référence DOM manquante ou API non initialisée');
      return;
    }
  
    // Mettre à jour les classes actives
    const previousTimeClass = this.activeTimeClass;
    const previousPeriod = this.activePeriod;
    
    this.activeTimeClass = time_class || this.activeTimeClass;
    this.activePeriod = timePeriod !== undefined ? timePeriod : this.activePeriod;
    
    // Toujours appliquer le filtrage pour garantir les données à jour
    // Filtrage par type de jeu
    console.log(`Application du filtrage par type de jeu: ${this.activeTimeClass}`);
    this.api.sortByGameType(this.activeTimeClass);
    
    // Filtrage par période
    console.log(`Application du filtrage par période: ${this.activePeriod}`);
    switch (this.activePeriod) {
      case Constantes.Time.WEEK:
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        this.api.setTimeTinterval(Constantes.Time.CUSTOM, weekAgo, new Date());
        break;
      case Constantes.Time.MONTH:
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        this.api.setTimeTinterval(Constantes.Time.CUSTOM, monthAgo, new Date());
        break;
      case Constantes.Time.YEAR:
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        this.api.setTimeTinterval(Constantes.Time.CUSTOM, yearAgo, new Date());
        break;
      case Constantes.Time.CUSTOM:
        if (this.customStartDate && this.customEndDate) {
          this.api.setTimeTinterval(Constantes.Time.CUSTOM, this.customStartDate, this.customEndDate);
        } else {
          this.activePeriod = Constantes.Time.ALL_TIME;
          this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
        }
        break;
      default:
        this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
    }
    
    // Récupérer les données ELO filtrées
    let eloList = this.api.getElo(this.activeTimeClass) as EloData[];
    
    // Si aucune donnée n'est trouvée pour cette période, chercher le dernier ELO connu
    if (!eloList || eloList.length === 0) {
      console.warn('Données ELO manquantes pour la période sélectionnée, affichage du dernier ELO connu');
      
      // Sauvegarder les dates actuelles
      const currentDateDebut = this.api.dateDebut;
      const currentDateFin = this.api.dateFin;
      
      // Temporairement définir la période à ALL_TIME pour trouver le dernier ELO
      this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
      const allTimeElo = this.api.getElo(this.activeTimeClass) as EloData[];
      
      // Restaurer les dates originales
      this.api.setTimeTinterval(Constantes.Time.CUSTOM, currentDateDebut, currentDateFin);
      
      // Si aucun ELO n'est disponible même pour ALL_TIME, abandonner
      if (!allTimeElo || allTimeElo.length === 0) {
        if (this.eloChart) {
          this.eloChart.destroy();
          this.eloChart = null;
        }
        return;
      }
      
      // Récupérer le dernier ELO connu
      const lastKnownElo = allTimeElo[allTimeElo.length - 1].rating;
      
      // Créer des points artificiels avec le dernier ELO connu
      eloList = [
        { timestamp: Math.floor(currentDateDebut.getTime() / 1000), rating: lastKnownElo },
        { timestamp: Math.floor(currentDateFin.getTime() / 1000), rating: lastKnownElo }
      ];
    }
    
    // Détruire le graphique existant s'il y en a un
    if (this.eloChart != null) {
      this.eloChart.destroy();
    }
    try {
      // Formater les timestamps en dates
      const formattedDates = eloList.map((row: EloData) => this.formatDate(row.timestamp));
      
      // Assurer que le conteneur est prêt et visible avant de créer le graphique
      setTimeout(() => {
        // Configurer le canvas pour qu'il se redimensionne proprement
        const canvas = this.eloStats.nativeElement;
        
        // Créer des options de configuration propres à Chart.js sans propriétés qui causent des erreurs TypeScript
        const chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { display: false }
            }
          }
        };
        
        // Créer le graphique avec les options
        this.eloChart = this.chartGenerator.getLineGraph(
          canvas, 
          eloList.map((row: EloData) => row.rating), 
          'Elo', 
          formattedDates,
          chartOptions
        );
        
        // Configurer l'axe Y et autres options après la création
        if (this.eloChart) {
          // Utiliser as any pour éviter les erreurs de TypeScript
          const chartInstance = this.eloChart as any;
          
          // Régler les options d'affichage
          chartInstance.options.plugins.legend = {
            display: false  // Cacher la légende pour donner plus d'espace au graphique
          };
          
          // Ajuster l'axe Y
          chartInstance.options.scales.y = {
            beginAtZero: false,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              padding: 10,
              font: {
                size: 11
              }
            }
          };
  
          // Définir la hauteur du canvas parent
          canvas.parentNode.style.height = '300px';
          
          // Forcer une mise à jour complète du graphique
          chartInstance.resize();
          chartInstance.update();
          
          // Appliquer les styles de couleur
          this.extendChartOptions(this.eloChart, {
            colors: {
              borderColor: this.chartColors.elo.borderColor,
              backgroundColor: this.chartColors.elo.backgroundColor,
              pointRadius: 0,
              pointHoverRadius: 5,
              borderWidth: 3,
              tension: 0.4
            }
          });
        }
      }, 50);
    } catch (error) {
      console.error('Erreur lors de la création du graphique ELO:', error);
    }
  }

  
  showPlayFrequency() {
    if (!this.frequencyStats?.nativeElement || !this.api) {
      console.warn('Référence DOM manquante ou API non initialisée');
      return;
    }
  
    console.log(`Génération du graphique de fréquence pour l'année: ${this.annee}`);
    
    const data = this.getPlayFrequency(this.annee);
  
    // Vérifier si on a des données
    if (data.every(item => item.occurences === 0)) {
      console.warn(`Aucune partie trouvée pour l'année ${this.annee}, essai avec l'année courante`);
      this.annee = new Date().getFullYear();
      const currentYearData = this.getPlayFrequency(this.annee);
      
      // Si toujours pas de données, essayer avec l'année précédente
      if (currentYearData.every(item => item.occurences === 0)) {
        this.annee--;
        const prevYearData = this.getPlayFrequency(this.annee);
        data.splice(0, data.length, ...prevYearData);
      } else {
        data.splice(0, data.length, ...currentYearData);
      }
    }
  
    if (this.playFreqChart != null) {
      this.playFreqChart.destroy();
    }
  
    try {
      this.playFreqChart = this.chartGenerator.getSimpleBarChart(
        this.frequencyStats.nativeElement, 
        data.map((row: FrequencyData) => row.occurences), 
        'Parties jouées', 
        data.map((row: FrequencyData) => row.mois),
        {
          responsive: true,
          maintainAspectRatio: false,  // Important pour prendre toute la largeur
          scales: {
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      );
      
      // Reste du code inchangé...
    } catch (error) {
      console.error('Erreur lors de la création du graphique de fréquence:', error);
    }
  }



  frequencyRightArrowClick(): void {
    if (this.annee < new Date().getFullYear()) {
      this.annee++;
      this.showPlayFrequency();
    }
  }

  frequencyLeftArrowClick(): void {
    this.annee--;
    this.showPlayFrequency();
  }

  setPeriod(period: Constantes.Time): void {
    this.activePeriod = period;
    
    this.zone.run(() => {
      this.showEloStat(undefined, period);
      this.cdr.detectChanges();
    });
  }

  showGamesBy(): void {
    if (!this.gamesByStats?.nativeElement || !this.api) {
      console.warn('Référence DOM manquante ou API non initialisée');
      return;
    }

    this.api.initTimeInterval();
    this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
    const endgames = this.api.getEndgames();

    let win_data: any, draw_data: any, lose_data: any;
    switch (this.w_b) {
      case W_B.Black:
        win_data = endgames["blackWin"];
        draw_data = endgames["blackDraw"];
        lose_data = endgames["blackLoose"];
        break;
      case W_B.White:
        win_data = endgames["whiteWin"];
        draw_data = endgames["whiteDraw"];
        lose_data = endgames["whiteLoose"];
        break;
      default:
        return;
    }

    // Détruire les graphiques existants s'il y en a
    if (this.chartGamesBy.length == 3) {
      this.chartGamesBy.forEach(chart => chart?.destroy());
    }

    try {
      const canvasElements = this.gamesByStats.nativeElement.querySelectorAll('canvas');
      if (canvasElements.length < 3) {
        console.warn('Éléments canvas manquants pour les graphiques de résultats');
        return;
      }

      // Créer les trois graphiques en camembert
      this.chartGamesBy[0] = this.chartGenerator.getDoughnutGraph(
        canvasElements[0], 
        Object.values(win_data), 
        Object.keys(win_data)
      );
      
      this.extendChartOptions(this.chartGamesBy[0], {
        colors: this.chartColors.games[0].map((color: string) => ({ backgroundColor: color })),
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(22, 22, 31, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(46, 213, 115, 0.3)',
            borderWidth: 1,
            padding: 10
          },
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              boxWidth: 10,
              padding: 10,
              font: { size: 11 }
            }
          }
        }
      });

      this.chartGamesBy[1] = this.chartGenerator.getDoughnutGraph(
        canvasElements[1], 
        Object.values(draw_data), 
        Object.keys(draw_data)
      );
      
      this.extendChartOptions(this.chartGamesBy[1], {
        colors: this.chartColors.games[1].map((color: string) => ({ backgroundColor: color })),
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(22, 22, 31, 0.9)',
            borderColor: 'rgba(255, 178, 102, 0.3)',
          },
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              boxWidth: 10,
              padding: 10,
              font: { size: 11 }
            }
          }
        }
      });

      this.chartGamesBy[2] = this.chartGenerator.getDoughnutGraph(
        canvasElements[2], 
        Object.values(lose_data), 
        Object.keys(lose_data)
      );
      
      this.extendChartOptions(this.chartGamesBy[2], {
        colors: this.chartColors.games[2].map((color: string) => ({ backgroundColor: color })),
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(22, 22, 31, 0.9)',
            borderColor: 'rgba(255, 107, 129, 0.3)',
          },
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              boxWidth: 10,
              font: { size: 11 }
            }
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la création des graphiques de résultats:', error);
    }
  }

  resetgamesBy(): void {
    this.w_b = (this.w_b === W_B.Black) ? W_B.White : W_B.Black;
    this.showGamesBy();
  }

  showOpeningsStats() {
    if (!this.openingsStats?.nativeElement || !this.api) {
      console.warn('Référence DOM manquante ou API non initialisée');
      return;
    }
    
    const executionId = new Date().getTime();
    console.log(`⚡ Début de showOpeningsStats [${executionId}] - État actuel:`, {
      couleur: this.w_b,
      tri: this.openingsSortOrder
    });
    
    // Référence au conteneur
    const chartContainer = this.openingsStats.nativeElement.parentElement;
    chartContainer.classList.add('chart-body-scrollable');
    
    try {
      // Récupérer les ouvertures depuis l'API
      const openingsData = this.api.getOpenings();
      
      if (!openingsData || openingsData.length === 0) {
        console.warn('Aucune donnée d\'ouverture disponible');
        return;
      }
      
      console.log(`[${executionId}] Filtrage des ouvertures pour: ${this.w_b}, tri: ${this.openingsSortOrder}, données: ${openingsData.length}`);
      
      // Filtrer pour ne retenir que les ouvertures jouées au moins 10 fois pour la couleur choisie
      const filteredOpenings = openingsData.filter(opening => {
        let total = 0;
        if (this.w_b === W_B.White) {
          total = opening.stats.WinAsWhite + opening.stats.DrawAsWhite + opening.stats.LooseAsWhite;
        } else {
          total = opening.stats.WinAsBlack + opening.stats.DrawAsBlack + opening.stats.LooseAsBlack;
        }
        return total >= 10;
      });
      
      console.log(`[${executionId}] Ouvertures filtrées: ${filteredOpenings.length}`);
      
      // Calculer le pourcentage de victoire pour chaque ouverture en fonction de la couleur sélectionnée
      const openingsWithWinRate = filteredOpenings.map(opening => {
        let wins = 0, total = 0;
        
        if (this.w_b === W_B.White) {
          wins = opening.stats.WinAsWhite;
          total = opening.stats.WinAsWhite + opening.stats.DrawAsWhite + opening.stats.LooseAsWhite;
        } else {
          wins = opening.stats.WinAsBlack;
          total = opening.stats.WinAsBlack + opening.stats.DrawAsBlack + opening.stats.LooseAsBlack;
        }
        
        const winRate = total > 0 ? (wins / total) * 100 : 0;
        
        return {
          ...opening,
          winRate: winRate,
          totalGames: total
        };
      });
      
      // Trier les ouvertures par pourcentage de victoire
      const sortedOpenings = [...openingsWithWinRate].sort((a, b) => {
        if (this.openingsSortOrder === 'desc') {
          return b.winRate - a.winRate; // Du plus grand au plus petit
        } else {
          return a.winRate - b.winRate; // Du plus petit au plus grand
        }
      });
      
      console.log(`[${executionId}] Ouvertures triées (${sortedOpenings.length}):`, 
        sortedOpenings.slice(0, 5).map(o => `${o.nom}: ${o.winRate.toFixed(1)}%`));
      
    
      // Convertir les données d'ouvertures triées en format JSON pour utilisation future
      this.openingsForPuzzles = sortedOpenings.map(opening => {
        let wins = 0, draws = 0, losses = 0;
        
        if (this.w_b === W_B.White) {
          wins = opening.stats.WinAsWhite;
          draws = opening.stats.DrawAsWhite;
          losses = opening.stats.LooseAsWhite;
        } else {
          wins = opening.stats.WinAsBlack;
          draws = opening.stats.DrawAsBlack;
          losses = opening.stats.LooseAsBlack;
        }
        
        const total = wins + draws + losses;
        
        return {
          name: opening.nom,
          winRate: opening.winRate.toFixed(1),
          wins: wins,
          draws: draws,
          losses: losses,
          totalGames: total
        };
      });

      // Afficher les données en JSON pour débogage
      console.log(`[${executionId}] Données JSON des ouvertures:`, JSON.stringify(this.openingsForPuzzles));
      
      // Limiter à 20 ouvertures pour des raisons de performance et lisibilité
      const displayOpenings = sortedOpenings.slice(0, Math.min(sortedOpenings.length, 20));
      
      // CHANGEMENT IMPORTANT: vérifier si un canvas existe déjà
      let canvas;
      if (chartContainer.querySelector('canvas')) {
        // Utiliser le canvas existant
        canvas = chartContainer.querySelector('canvas');
        console.log(`[${executionId}] Utilisation du canvas existant`);
      } else {
        // Créer un nouveau canvas seulement si nécessaire
        console.log(`[${executionId}] Création d'un nouveau canvas`);
        chartContainer.innerHTML = '';
        canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        canvas.style.width = '100%';
        canvas.style.height = '300px';
      }
      
      // Si un graphique existe déjà, le détruire proprement
      if (this.openingsChart) {
        console.log(`[${executionId}] Destruction de l'ancien graphique`);
        this.openingsChart.destroy();
        this.openingsChart = null;
      }
      
      // Préparer les données pour le graphique en fonction de la couleur sélectionnée
      let wins: number[], draws: number[], losses: number[];
      if (this.w_b === W_B.White) {
        wins = displayOpenings.map(opening => opening.stats.WinAsWhite);
        draws = displayOpenings.map(opening => opening.stats.DrawAsWhite);
        losses = displayOpenings.map(opening => opening.stats.LooseAsWhite);
      } else {
        wins = displayOpenings.map(opening => opening.stats.WinAsBlack);
        draws = displayOpenings.map(opening => opening.stats.DrawAsBlack);
        losses = displayOpenings.map(opening => opening.stats.LooseAsBlack);
      }
      
      // Préparer les labels avec pourcentage de victoire
      const labels = displayOpenings.map(opening => {
        const winRate = opening.winRate.toFixed(0);
        return `${opening.nom} (${winRate}%)`;
      });
      
      // Créer le graphique avec les couleurs et options désirées
      console.log(`[${executionId}] Création du graphique avec ${labels.length} ouvertures`);
      this.openingsChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Victoires',
              data: wins,
              backgroundColor: '#2ed573', // Vert
              borderWidth: 0,
              barPercentage: 0.8,
              categoryPercentage: 0.9
            },
            {
              label: 'Nulles',
              data: draws,
              backgroundColor: '#a0a0a0', // Gris
              borderWidth: 0,
              barPercentage: 0.8,
              categoryPercentage: 0.9
            },
            {
              label: 'Défaites',
              data: losses,
              backgroundColor: '#ff5252', // Rouge
              borderWidth: 0,
              barPercentage: 0.8,
              categoryPercentage: 0.9
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              left: 10,
              right: 20,
              top: 20,
              bottom: 10
            }
          },
          scales: {
            x: {
              stacked: true,
              ticks: {
                autoSkip: false,
                maxRotation: 45,
                minRotation: 45,
                font: {
                  size: 10
                }
              },
              grid: {
                display: false
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  return `${label}: ${value}`;
                },
                title: function(tooltipItems) {
                  const index = tooltipItems[0].dataIndex;
                  const opening = displayOpenings[index];
                  const winRate = opening.winRate.toFixed(1);
                  const total = opening.totalGames;
                  return `${opening.nom} (${winRate}% - ${total} parties)`;
                }
              }
            },
            legend: {
              position: 'top',
              labels: {
                boxWidth: 15,
                padding: 15
              }
            }
          },
          animation: {
            duration: 500 // Animation plus courte pour une mise à jour plus rapide
          }
        }
      });
      
      console.log(`✅ [${executionId}] Graphique des ouvertures mis à jour avec succès`);
      
    } catch (error) {
      console.error(`❌ [${executionId}] Erreur lors de la création du graphique des ouvertures:`, error);
    }
  }
  
  setOpeningsColor(color: 'white' | 'black'): void {
    console.log(`Changement de couleur: ${color}`);
    if (color === 'white') {
      this.w_b = W_B.White;
    } else {
      this.w_b = W_B.Black;
    }
    
    // Modification importante : utiliser setTimeout au lieu de requestAnimationFrame
    setTimeout(() => {
      this.zone.run(() => {
        if (this.openingsChart) {
          // Stocker une référence au canvas actuel avant de détruire le graphique
          const currentCanvas = this.openingsChart.canvas;
          const parentElement = currentCanvas.parentElement;
          
          // Stocker les dimensions actuelles
          const currentWidth = currentCanvas.width;
          const currentHeight = currentCanvas.height;
          
          // Détruire le graphique existant
          this.openingsChart.destroy();
          this.openingsChart = null;
          
          // Maintenant mettre à jour le graphique
          this.showOpeningsStats();
        } else {
          this.showOpeningsStats();
        }
        this.cdr.detectChanges();
      });
    }, 50); // Un délai légèrement plus long pour s'assurer que tout est synchronisé
  }
  
  setOpeningsSortOrder(order: 'asc' | 'desc'): void {
    console.log(`Changement de l'ordre de tri: ${order}`);
    this.openingsSortOrder = order;
    
    // Utiliser la même approche que pour setOpeningsColor
    setTimeout(() => {
      this.zone.run(() => {
        if (this.openingsChart) {
          // Stocker une référence au canvas actuel avant de détruire le graphique
          const currentCanvas = this.openingsChart.canvas;
          
          // Détruire le graphique existant
          this.openingsChart.destroy();
          this.openingsChart = null;
          
          // Maintenant mettre à jour le graphique
          this.showOpeningsStats();
        } else {
          this.showOpeningsStats();
        }
        this.cdr.detectChanges();
      });
    }, 50);
  }
  
  // Méthode de test pour forcer une mise à jour
  forceUpdateOpeningsChart(): void {
    console.log("Force update demandée - État actuel:", {
      couleur: this.w_b,
      tri: this.openingsSortOrder
    });
    
    // Utiliser un setTimeout pour déconnecter l'exécution de l'événement actuel
    setTimeout(() => {
      this.zone.run(() => {
        // Détruire explicitement le graphique existant si il existe
        if (this.openingsChart) {
          this.openingsChart.destroy();
          this.openingsChart = null;
        }
        
        this.showOpeningsStats();
        this.cdr.detectChanges();
      });
    }, 0);
  }

  getSortedOpeningsData(): any[] {
    if (!this.api) {
      console.warn('API not initialized');
      return [];
    }
    
    // Get openings data from API
    const openingsData = this.api.getOpenings();
    
    if (!openingsData || openingsData.length === 0) {
      console.warn('No openings data available');
      return [];
    }
    
    // Filter to keep only openings played a minimum number of times for the selected color
    const filteredOpenings = openingsData.filter(opening => {
      let total = 0;
      if (this.w_b === W_B.White) {
        total = opening.stats.WinAsWhite + opening.stats.DrawAsWhite + opening.stats.LooseAsWhite;
      } else {
        total = opening.stats.WinAsBlack + opening.stats.DrawAsBlack + opening.stats.LooseAsBlack;
      }
      return total >= 5; // You can adjust this minimum threshold
    });
    
    // Calculate win rate for each opening based on the selected color
    const openingsWithWinRate = filteredOpenings.map(opening => {
      let wins = 0, draws = 0, losses = 0, total = 0;
      
      if (this.w_b === W_B.White) {
        wins = opening.stats.WinAsWhite;
        draws = opening.stats.DrawAsWhite;
        losses = opening.stats.LooseAsWhite;
        total = wins + draws + losses;
      } else {
        wins = opening.stats.WinAsBlack;
        draws = opening.stats.DrawAsBlack;
        losses = opening.stats.LooseAsBlack;
        total = wins + draws + losses;
      }
      
      const winRate = total > 0 ? (wins / total) * 100 : 0;
      
      console.log(`Opening: ${opening.nom}, Wins: ${wins}, Draws: ${draws}, Losses: ${losses}, Total: ${total}, Win Rate: ${winRate.toFixed(1)}%`);
      return {
        name: opening.nom,
        winRate: winRate,
        wins: wins,
        draws: draws,
        losses: losses,
        totalGames: total
      };
    });
    
    // Sort the openings by win rate according to the current sort order
    return [...openingsWithWinRate].sort((a, b) => {
      if (this.openingsSortOrder === 'desc') {
        return b.winRate - a.winRate; // Highest to lowest
      } else {
        return a.winRate - b.winRate; // Lowest to highest
      }
    });
  }

  

  
  

// Ajouter une méthode pour nettoyer l'observateur lors de la destruction du composant
ngOnDestroy(): void {
  // Nettoyer les graphiques lors de la destruction du composant
  this.cleanupCharts();
}


  
}