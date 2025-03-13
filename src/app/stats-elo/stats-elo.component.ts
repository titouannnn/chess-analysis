import { afterNextRender, Component, ElementRef, Injectable, ViewChild, ViewEncapsulation } from '@angular/core';
import { Api, Constantes } from '../../api/api.service';
import { time } from 'console';
import { LitchessApi } from '../../api/litchess-api.service';
import { ChesscomApi } from '../../api/chesscomapi.service';
import { ChartJS } from '../../api/ChartJS.service';
import { ChartConfiguration } from 'chart.js';

enum W_B {
  Black = "black",
  White = "white",
  W_B = "w/b"
}

@Component({
  selector: 'app-stats-elo:not(p)',
  imports: [],
  templateUrl: './stats-elo.component.html',
  styleUrl: './stats-elo.component.css'
})
@Injectable({  providedIn: 'root'})
export class StatsEloComponent {  
  @ViewChild('eloStats') eloStats !: ElementRef
  @ViewChild('playFrequencyStats') frequencyStats !: ElementRef
  @ViewChild('gamesBy') gamesByStats !: ElementRef
  
  
  // Variable utilisé pour le HTML
  typeJeu = Constantes.TypeJeuChessCom;
  annee = new Date().getFullYear();
  w_b : W_B = W_B.Black;

  private api: Api;
  private chartGenerator: ChartJS;
  constructor(chessApi : ChesscomApi, lichessApi : LitchessApi, chartGenerator: ChartJS ){ 
    this.api = chessApi;
    this.chartGenerator = chartGenerator;

    afterNextRender(()=>{
      this.showEloStat(Constantes.TypeJeuChessCom.RAPID);
      this.showPlayFrequency();
      this.showGamesBy();
    })
  }

  
  /**
   * Méthode à utiliser uniquement avec afterNextRender, ou afterRender
   * Elle "append" un graphe generée grace à Chart.js. 
   * 
   * Ce graphe va correspondre au différents niveau d'Elo de Chess.com
  */
  eloChart : any = null;
  showEloStat( time_class ?: Constantes.TypeJeuChessCom ){
    this.api.initTimeInterval();

    const eloList = this.api.getElo(time_class);
    if(eloList === undefined) return;
    if(this.eloChart != null){
      this.eloChart.destroy();
    }
    this.eloChart = this.chartGenerator.getLineGraph( this.eloStats.nativeElement, 
      eloList.map( row => row.rating ),
      'Elo', eloList.map(row => row.timestamp ) );
    
  }

  /**
   * Cette méthode va permettre de donner la date de début et de fin 
   * d'un mois spécifié dans une année spécifiée.
   * 
   * @param year Année de l'intervalle de dates voulu
   * @param month Mois de l'intervalle de dates voulu
   * @returns 
   */
  getMonthDates(year: number, month: number): { firstDay: Date; lastDay: Date } {
      const firstDay = new Date(year, month - 1, 1); 
      const lastDay = new Date(year, month, 0); 

      return { firstDay, lastDay };
  }

  /**
   * Cette méthode va permettre de calculer la fréquence, sur laquelle l'utilisateur 
   * à jouée pour une année spécifique.
   * 
   * @param year Année à analyser la fréquence de jeu
   * @returns Frequence de jeu en fonction du mois d'une année spécifié
   */
  getPlayFrequency(year : number) : Array<{ "occurences" : number, "mois": string  }> {
    const months = [
      "Janvier", 
      "Fevrier", 
      "Mai", 
      "Avril", 
      "Mai",
      "Juin",
      "Juillet", 
      "Aout", 
      "Septembre", 
      "Octobre",
      "Novembre",
      "Décembre"
    ];
    let data = [];
    for(let i = 1; i <= 12; i++ ){
      const { firstDay, lastDay } = this.getMonthDates(year, i);

      this.api.initTimeInterval();
      this.api.setTimeTinterval(Constantes.Time.CUSTOM, firstDay, lastDay);

      data.push( {"occurences":this.api.allGames.length, "mois":months[i-1]} );
    }
    return data;
  }

  /**
   * Méthode d'affichage de la fréquence de jeu de l'utilisateur dans une année spécifique
   * à analyser.
   * 
   */
  playFreqChart : any = null;
  showPlayFrequency( ){
    let data = this.getPlayFrequency(this.annee);

    if(this.playFreqChart != null){
      this.playFreqChart.destroy();
    }

    this.playFreqChart = this.chartGenerator.getSimpleBarChart( this.frequencyStats.nativeElement, 
     data.map(row => row.occurences), 
     'Nb Parties', 
     data.map( row => row.mois ) );

  }
  /**
   * Event handler for frequencyStat
   */
  frequencyRightArrowClick(){
    if(this.annee < new Date().getFullYear()) this.annee++;
    else return;
    this.showPlayFrequency();
  }
  /**
   * Event handler for frequencyStat
   */
  frequencyLeftArrowClick(){
    this.api.initTimeInterval();
    if( this.annee > this.api.dateDebut.getFullYear() ) this.annee--;
    else return;
    this.showPlayFrequency();
  }

  /**
   * Cette méthode va nous permettre d'afficher un graphe qui nous permet d'analyser le résultat de nos parties
   * On devrait être capable d'afficher ces informations en fonction du couleur du joueur, ainsi que du type de jeu
   * 
   */
  chartGamesBy : any[] = [];
  showGamesBy(){
    
    this.api.initTimeInterval();
    this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
    const endgames = this.api.getEndgames();

    let win_data: any, draw_data: any, lose_data :any;
    switch(this.w_b){
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

    if(this.chartGamesBy.length == 3){
      this.chartGamesBy[0].destroy();
      this.chartGamesBy[1].destroy();
      this.chartGamesBy[2].destroy();
    }

    let optionsChart : ChartConfiguration['options'] = { 
      aspectRatio: 2.5, 
      layout: { 
        padding: 
        { left: 0, right: 0, top: 10, bottom: 20} 
      }, 
      plugins : {
        title: {
          display: true,
          text: 'Jeu gagnés par : '
        }
      }};
    
    
    this.chartGamesBy[0] = this.chartGenerator.getDoughnutGraph( this.gamesByStats.nativeElement.children[0], Object.values(win_data), Object.keys(win_data), optionsChart );
    optionsChart.plugins!.title!.text = 'Match nul par :';
    this.chartGamesBy[1] = this.chartGenerator.getDoughnutGraph( this.gamesByStats.nativeElement.children[1], Object.values(draw_data), Object.keys(draw_data), optionsChart );
    optionsChart.plugins!.title!.text = 'Jeu perdus par :';
    this.chartGamesBy[2] = this.chartGenerator.getDoughnutGraph( this.gamesByStats.nativeElement.children[2], Object.values(lose_data), Object.keys(lose_data), optionsChart );

  }

  resetgamesBy(){
    switch( this.w_b ){
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
