import { afterNextRender, Component, ElementRef, Injectable, ViewChild } from '@angular/core';
import { Api, Constantes } from '../../api/api.service';
import * as Plot from "@observablehq/plot";
import { time } from 'console';
import { LitchessApi } from '../../api/litchess-api.service';
import { ChesscomApi } from '../../api/chesscomapi.service';

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

  // Variable utilisé pour le HTML
  typeJeu = Constantes.TypeJeuChessCom;
  annee = new Date().getFullYear();

  private api: Api;
  constructor(chessApi : ChesscomApi, lichessApi : LitchessApi ){ 
    this.api = chessApi;
    afterNextRender(()=>{
      this.showEloStat(Constantes.TypeJeuChessCom.RAPID);
      this.showPlayFrequency();
    })
  }

  /**
   * Méthode à utiliser uniquement avec afterNextRender, ou afterRender
   * Elle "append" un graphe generée grace à Plot de Observable. 
   * 
   * Ce graphe va correspondre au différents niveau d'Elo de Chess.com
   */
  showEloStat( time_class ?: Constantes.TypeJeuChessCom ){
    this.api.initTimeInterval();
    this.api.setTimeTinterval(Constantes.Time.ALL_TIME, this.api.DATENULL, this.api.DATENULL);
    
    const eloList = this.api.getElo(time_class);
    
    let plot = Plot.plot({
      marks: [
        Plot.lineY(eloList, {y: "rating", x: "timestamp"})
      ]
    });
    console.log(eloList);
    this.eloStats.nativeElement.replaceChildren( plot );
  }

  /**
   * Cette méthode va permettre de donner la date de début et de fin fin 
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
  getPlayFrequency(year : number) : Array<{ "occurences" : number, "mois": string  }>{
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
   */
  showPlayFrequency(){
    let data = this.getPlayFrequency(this.annee);

    const plot = Plot.plot(
      {
        x: {padding: 0.4, domain: data.map(d => d.mois)},
        grid: true,
        marks : [
          Plot.ruleY([0]),
          Plot.barY(data, {y:"occurences", x:"mois", fill: "green"})          
        ],
      }
    );
    this.frequencyStats.nativeElement.replaceChildren( plot );
  }

  frequencyRightArrowClick(){
    this.annee--;
  }
  frequencyLeftArrowClick(){
    if(this.annee < new Date().getFullYear()) this.annee++;
  }

}


