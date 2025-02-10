import { afterNextRender, AfterRenderPhase, Component, ElementRef, Injectable, viewChild, ViewChild } from '@angular/core';
import { Api } from '../../api/api.service';
import * as Plot from "@observablehq/plot";

@Component({
  selector: 'app-stats-elo',
  imports: [],
  templateUrl: './stats-elo.component.html',
  styleUrl: './stats-elo.component.css'
})
@Injectable({  providedIn: 'root'})
export class StatsEloComponent {  
  @ViewChild('eloStats') eloStats !: ElementRef

  constructor(private api: Api ){ 
    afterNextRender(()=>{
      const eloList = this.api.getElo();
      
      let plot = Plot.plot({
        marks: [
          Plot.ruleY([0]),
          Plot.rectY(eloList, Plot.binX({y: "sum"}, {x: "rating", thresholds: 15}))
        ]
      })
      this.eloStats.nativeElement.append( plot );
    })
   }

  testConstructor(){
    console.log("Username initialised : ", this.api.username, "All games : ", this.api.allGames)
  }

  showEloStat(){
    const eloList = this.api.getElo();
    console.log("Stats -> Liste des ELOs :", eloList);
  }
}

