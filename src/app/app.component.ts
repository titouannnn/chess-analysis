import { Component, OnInit } from '@angular/core';
import { Api } from './api.service';
import { HomeComponent } from './home/home.component';

@Component({
  selector: 'app-root',
  imports: [HomeComponent],
  templateUrl: './app.component.html',
  styleUrl: "./app.component.css"
})

export class AppComponent implements OnInit {
  message: string = ''; // Variable pour afficher le résultat

  constructor(private api: Api) {} // Injection du service

  ngOnInit(): void {
    //console.log("Initialisation de l'application");
    //this.message = this.api.getUsername(""); // Appel de la fonction getUsername
    //this.initializeSettings();
  }
  

  async initializeSettings(): Promise<void> {
    //console.log("Récupération des parties en ligne");
    //console.log("user : " + this.api.username);
    //this.api.getAllGamesOFFLINE();

    /*
    this.api.sortByGameType(this.api.RAPID);
    this.api.initTimeInterval();
    this.api.setTimeTinterval(this.api.YEAR,this.api.DATENULL,this.api.DATENULL);
    console.log(this.api.allGames);
    */
    
  }
}
