import { afterNextRender, AfterRenderPhase, Component, ElementRef, Injectable, viewChild, ViewChild } from '@angular/core';
import { Api, Constantes } from '../../api/api.service';
import * as Plot from "@observablehq/plot";
import { time } from 'console';
import { LitchessApi } from '../../api/litchess-api.service';
import { ChesscomApi } from '../../api/chesscomapi.service';

@Component({
  selector: 'app-stats-elo',
  imports: [],
  templateUrl: './stats-elo.component.html',
  styleUrl: './stats-elo.component.css'
})
@Injectable({  providedIn: 'root'})
export class StatsEloComponent {  
  @ViewChild('eloStats') eloStats !: ElementRef

  private api: Api;
  constructor(chessApi : ChesscomApi, lichessApi : LitchessApi ){ 
    this.api = chessApi;
    afterNextRender(()=>{
      this.showEloStat(Constantes.TypeJeuChessCom.RAPID);
    })
   }

  /**
   * 
   * Méthode à utiliser uniquement avec afterNextRender, ou afterRender
   * Elle "append" un graphe generée grace à Plot de Observable. 
   * 
   * Ce graphe va correspondre au différents niveau d'Elo de Chess.com
   */
  showEloStat( time_class ?: Constantes.TypeJeuChessCom ){
    const eloList = this.api.getElo(time_class);
    
    let plot = Plot.plot({
      marks: [
        Plot.lineY(eloList, {y: "rating", x: "timestamp"})
      ]
    })
    this.eloStats.nativeElement.append( plot );
    console.log("Plot append correctement, elo : ", eloList);

  }
}

