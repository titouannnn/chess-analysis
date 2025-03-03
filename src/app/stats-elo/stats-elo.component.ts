import { afterNextRender,OnInit, Component, ElementRef, Injectable, ViewChild } from '@angular/core';
import { Api, Constantes } from '../../api/api.service';
import * as Plot from "@observablehq/plot";
import { time } from 'console';
import { LitchessApi } from '../../api/litchess-api.service';
import { ChesscomApi } from '../../api/chesscomapi.service';
import { ActivatedRoute , Params } from '@angular/router'; 


@Component({
  selector: 'app-stats-elo:not(p)',
  imports: [],
  templateUrl: './stats-elo.component.html',
  styleUrl: './stats-elo.component.css'
})
@Injectable({  providedIn: 'root'})
export class StatsEloComponent implements OnInit {  
  @ViewChild('eloStats') eloStats !: ElementRef
  pseudo: string = ''; // Récupération du pseudo de la route
  // Variable utilisé pour le HTML
  typeJeu = Constantes.TypeJeuChessCom;

  private api: Api;
  constructor(private route: ActivatedRoute,chessApi : ChesscomApi, lichessApi : LitchessApi ){ 
    this.api = chessApi;
    afterNextRender(()=>{
      this.showEloStat(Constantes.TypeJeuChessCom.RAPID);
    })
  }

  ngOnInit(): void {
    // Récupérer le pseudo depuis les paramètres de la route
    this.route.queryParams.subscribe((params: Params) => {
      this.pseudo = params['pseudo'];
    });
    this.showEloStat(Constantes.TypeJeuChessCom.RAPID);
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
    this.eloStats.nativeElement.replaceChildren( plot );
    console.log("Plot append correctement, elo : ", eloList);

  }
}

