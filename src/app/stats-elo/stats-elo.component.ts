import { afterNextRender, Component, ElementRef, Injectable, ViewChild, AfterViewInit, ChangeDetectorRef, NgZone, OnInit, ActivatedRoute , Params } from '@angular/core';
import { Api, Constantes } from '../../api/api.service';
import { LitchessApi } from '../../api/litchess-api.service';
import { ChesscomApi } from '../../api/chesscomapi.service';
import { ChartJS } from '../../api/ChartJS.service';
import { CommonModule } from '@angular/common';
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
  host: { id: 'stats-elo-unique' } // Ajout d'un ID unique pour éviter les collisions
})
@Injectable({ providedIn: 'root'})
export class StatsEloComponent implements AfterViewInit {  
  @ViewChild('eloStats') eloStats !: ElementRef;
  @ViewChild('playFrequencyStats') frequencyStats !: ElementRef;
  @ViewChild('gamesBy') gamesByStats !: ElementRef;
  
  // Variables utilisées pour le HTML
  timePeriod = Constantes.Time; 
  typeJeu = Constantes.TypeJeuChessCom;
  annee = new Date().getFullYear();
  w_b : W_B = W_B.Black; // Initialisation avec pièces noires par défaut
  activeTimeClass: Constantes.TypeJeuChessCom = Constantes.TypeJeuChessCom.RAPID; // Parties rapides par défaut
  
  // Indicateur de chargement initial
  private initialized = false;

  // Palettes de couleurs enrichies pour les graphiques d'échecs
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
      // Palette de couleurs distinctes pour les victoires
      ['#2ed573', '#1abc9c', '#3498db', '#3742fa'],
      // Palette de couleurs distinctes pour les nulles
      ['#ffb266', '#ffa502', '#ff9f43', '#f6b93b'],
      // Palette de couleurs distinctes pour les défaites
      ['#ff6b81', '#ff4757', '#ff5252', '#ff3838']
    ]
  };

  customStartDate: Date | null = null;
  customEndDate: Date | null = null;

  private api: Api;
  private chartGenerator: ChartJS;
  
  constructor(
    chessApi: ChesscomApi, 
    lichessApi: LitchessApi, 
    chartGenerator: ChartJS,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) { 
    this.api = chessApi;
    this.chartGenerator = chartGenerator;
    
    // Pré-initialiser l'API et les données avec ALL_TIME par défaut
    this.api.initTimeInterval();
    this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
  }
  
  // Cette méthode est déclenchée après l'initialisation de la vue et garantit que les références au DOM sont disponibles
  ngAfterViewInit(): void {
    setTimeout(() => {
      console.log('Initialisation des graphiques');
      this.initializeCharts();
      // Supprimez les modifications programmatiques de style ici
      this.cdr.detectChanges();
    }, 100);
  }
  
  // Méthode d'initialisation des graphiques
  private initializeCharts(): void {
    if (this.initialized) return;
    
    // Exécuter les opérations de graphiques en dehors de la zone
    this.zone.runOutsideAngular(() => {
      try {
        // Initialiser tous les graphiques dans l'ordre
        this.showEloStat(this.activeTimeClass, this.activePeriod);
        this.showPlayFrequency();
        this.showGamesBy();
        
        // Marquer comme initialisé
        this.initialized = true;
        
        // Revenir dans la zone Angular pour déclencher la détection des changements
        this.zone.run(() => {
          // S'assurer que l'interface utilisateur est mise à jour
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

  // Fonction pour formater les timestamps en dates lisibles
  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  }

  // Cette fonction va étendre le graphique avec des options avancées
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
    
    const data: FrequencyData[] = [];
    for (let i = 1; i <= 12; i++) {
      const { firstDay, lastDay } = this.getMonthDates(year, i);
      this.api.initTimeInterval();
      this.api.setTimeTinterval(Constantes.Time.CUSTOM, firstDay, lastDay);
      data.push({ occurences: this.api.allGames.length, mois: months[i-1] });
    }
    return data;
  }

  setCustomDateRange(start: Date, end: Date): void {
    this.customStartDate = start;
    this.customEndDate = end;
    this.showEloStat(undefined, Constantes.Time.CUSTOM);
  }

  activePeriod: Constantes.Time = Constantes.Time.ALL_TIME;

  eloChart: any = null;
  showEloStat(time_class?: Constantes.TypeJeuChessCom, timePeriod?: Constantes.Time) {
    // Vérifier que la référence DOM existe
    if (!this.eloStats?.nativeElement) {
      console.warn('Référence DOM manquante pour le graphique ELO');
      return;
    }

    // Mettre à jour les classes actives
    this.activeTimeClass = time_class || this.activeTimeClass || Constantes.TypeJeuChessCom.RAPID;
    this.activePeriod = timePeriod !== undefined ? timePeriod : this.activePeriod;
    
    // Initialiser l'API et définir la période
    this.api.initTimeInterval();
    
    // Définir la période selon le paramètre
    switch (this.activePeriod) {
      case Constantes.Time.WEEK:
        this.api.setTimeTinterval(Constantes.Time.WEEK, this.api.DATENULL, this.api.DATENULL);
        break;
      case Constantes.Time.MONTH:
        this.api.setTimeTinterval(Constantes.Time.MONTH, this.api.DATENULL, this.api.DATENULL);
        break;
      case Constantes.Time.YEAR:
        this.api.setTimeTinterval(Constantes.Time.YEAR, this.api.DATENULL, this.api.DATENULL);
        break;
      case Constantes.Time.CUSTOM:
        // Pour le mode personnalisé, utilisez les dates stockées dans le composant
        if (this.customStartDate && this.customEndDate) {
          this.api.setTimeTinterval(Constantes.Time.CUSTOM, this.customStartDate, this.customEndDate);
        } else {
          // Si pas de dates personnalisées, revenir à ALL_TIME
          this.activePeriod = Constantes.Time.ALL_TIME;
          this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
        }
        break;
      case Constantes.Time.ALL_TIME:
      default:
        this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
        break;
    }
    
    const eloList = this.api.getElo(this.activeTimeClass) as EloData[];
    if (!eloList || eloList.length === 0) {
      console.warn('Données ELO manquantes');
      return;
    }
    
    if (this.eloChart != null) {
      this.eloChart.destroy();
    }
    
    try {
      // Formater les timestamps en dates
      const formattedDates = eloList.map((row: EloData) => this.formatDate(row.timestamp));
      
      this.eloChart = this.chartGenerator.getLineGraph(
        this.eloStats.nativeElement, 
        eloList.map((row: EloData) => row.rating), 
        'Elo', 
        formattedDates
      );
      
      // Personnaliser le graphique après sa création
      this.extendChartOptions(this.eloChart, {
        colors: {
          borderColor: this.chartColors.elo.borderColor,
          backgroundColor: this.chartColors.elo.backgroundColor,
          pointRadius: 0, // Rendre les points invisibles
          pointHoverRadius: 5, // Afficher les points uniquement au survol
          borderWidth: 3, // Augmenter légèrement l'épaisseur de la ligne pour meilleure visibilité
          tension: 0.4
        },
        // Le reste des options reste inchangé...
      });
    } catch (error) {
      console.error('Erreur lors de la création du graphique ELO:', error);
    }
  }

  playFreqChart: any = null;
  showPlayFrequency() {
    // Vérifier que la référence DOM existe
    if (!this.frequencyStats?.nativeElement) {
      console.warn('Référence DOM manquante pour le graphique de fréquence');
      return;
    }

    const data = this.getPlayFrequency(this.annee);

    if (this.playFreqChart != null) {
      this.playFreqChart.destroy();
    }

    try {
      this.playFreqChart = this.chartGenerator.getSimpleBarChart(
        this.frequencyStats.nativeElement, 
        data.map((row: FrequencyData) => row.occurences), 
        'Parties jouées', 
        data.map((row: FrequencyData) => row.mois)
      );
      
      // Personnaliser le graphique après sa création
      this.extendChartOptions(this.playFreqChart, {
        colors: {
          backgroundColor: this.chartColors.frequency.backgroundColor,
          hoverBackgroundColor: this.chartColors.frequency.hoverBackgroundColor,
          borderRadius: 6,
          borderWidth: 0,
          maxBarThickness: 40
        },
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(22, 22, 31, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(129, 129, 255, 0.3)',
            borderWidth: 1,
            padding: 10,
            bodyFont: {
              size: 14,
              weight: 'bold'
            }
          },
          legend: {
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: {
                family: "'Roboto', sans-serif",
                size: 13
              }
            }
          }
        }
      });
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
    console.log('Modification de la période à:', period);
    // Appliquer la période directement et s'assurer que le changement est détecté
    this.activePeriod = period;
    
    // Utiliser setTimeout pour garantir que l'UI est mise à jour avant les opérations lourdes
    setTimeout(() => {
      this.zone.run(() => {
        this.showEloStat(undefined, period);
        // Forcer la détection des changements
        this.cdr.detectChanges();
      });
    }, 10);
  }

  chartGamesBy: any[] = [];
  showGamesBy(): void {
    // Vérifier que la référence DOM existe
    if (!this.gamesByStats?.nativeElement) {
      console.warn('Référence DOM manquante pour les graphiques par type');
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
    }

    // Assurer que les données existent
    if (!win_data || !draw_data || !lose_data) {
      console.warn('Données des résultats manquantes');
      return;
    }

    if (this.chartGamesBy.length == 3) {
      this.chartGamesBy.forEach(chart => chart?.destroy());
    }

    try {
      // S'assurer que tous les éléments DOM nécessaires sont disponibles
      const canvasElements = this.gamesByStats.nativeElement.querySelectorAll('canvas');
      if (canvasElements.length < 3) {
        console.warn('Éléments canvas manquants pour les graphiques de résultats');
        return;
      }

      // Créer les camemberts avec des couleurs distinctes
      this.chartGamesBy[0] = this.chartGenerator.getDoughnutGraph(
        canvasElements[0], 
        Object.values(win_data), 
        Object.keys(win_data)
      );
      
      // Appliquer des couleurs différentes pour chaque segment
      this.extendChartOptions(this.chartGamesBy[0], {
        colors: this.chartColors.games[0].map((color: string) => ({ backgroundColor: color })),
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(22, 22, 31, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(46, 213, 115, 0.3)',
            borderWidth: 1,
            padding: 10,
            bodyFont: {
              size: 14,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              boxWidth: 10,
              padding: 10,
              font: {
                family: "'Roboto', sans-serif",
                size: 11
              }
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
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 178, 102, 0.3)',
            borderWidth: 1,
            padding: 10,
            bodyFont: {
              size: 14,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              boxWidth: 10,
              padding: 10,
              font: {
                family: "'Roboto', sans-serif",
                size: 11
              }
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
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 107, 129, 0.3)',
            borderWidth: 1,
            padding: 10,
            bodyFont: {
              size: 14,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              boxWidth: 10,
              padding: 10,
              font: {
                family: "'Roboto', sans-serif",
                size: 11
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la création des graphiques de résultats:', error);
    }
  }

  resetgamesBy(): void {
    switch(this.w_b) {
      case W_B.Black:
        this.w_b = W_B.White;
        break;
      case W_B.White:
        this.w_b = W_B.Black;
        break;
      default:
        this.w_b = W_B.Black;
        break;
    }
    this.showGamesBy();
  }
}
