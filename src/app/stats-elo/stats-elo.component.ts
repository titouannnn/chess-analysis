import { AfterViewInit, Component, ElementRef, Injectable, viewChild, ViewChild } from '@angular/core';
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

  
  userInfoElement = viewChild<ElementRef<HTMLElement>>('myplot');
  constructor(private api: Api ){
    
  }

  
  testConstructor(){
    console.log("Username initialised : ", this.api.username, "All games : ", this.api.allGames)
  }

  testPlot(){

    const plot = Plot.rectY({length: 10000}, Plot.binX({y: "count"}, {x: Math.random})).plot();
    const elementRef = this.userInfoElement();
    const div = elementRef?.nativeElement;
    if(div){
      div.append(plot);
    }
    

  }

  showEloStat(){
    const eloList = this.api.getElo();
    console.log("Stats -> Liste des ELOs :", eloList);
    this.testPlot();

  }
}

