import { afterNextRender,OnInit,Component, ElementRef, Injectable, ViewChild } from '@angular/core';
import { Api, Constantes } from '../../api/api.service';
import * as Plot from "@observablehq/plot";
import { time } from 'console';
import { LitchessApi } from '../../api/litchess-api.service';
import { ChesscomApi } from '../../api/chesscomapi.service';
import { ActivatedRoute , Params } from '@angular/router'; 
import { LoadingBarComponent } from '../loading-bar/loading-bar.component';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-elo-stats-custom',
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
  constructor(private route: ActivatedRoute,chessApi : ChesscomApi, lichessApi : LitchessApi, public matDialog:MatDialog ){ 
    this.api = chessApi;}
   /* afterNextRender(()=>{
      const dialogRef  = this.matDialog.open(LoadingBarComponent, {
        height: '100%',
        width: '100%',
        panelClass: 'full-screen-dialog',  // Une classe CSS personnalisée pour prendre tout l'écran
        hasBackdrop: true,  // Ajoute un fond semi-transparent
        disableClose: true // Empêche la fermeture de la popup lors d'un clic en dehors
      });
      this.showEloStat(Constantes.TypeJeuChessCom.RAPID);
      
      for(let i : number = 0; i < 10; i++){
        setTimeout(
          function (){ 
            dialogRef.componentInstance.increaseProgress(10)
          }, 10000 * (i + 1)); // Attendre 1 seconde avant de progresser
        
      }
      
    })
  
*/
  // Définir correctement ngOnInit
  /*ngOnInit(): void {
    // On s'assure que les paramètres sont bien chargés avant de manipuler les données
    this.route.queryParams.subscribe((params: Params) => {
      this.pseudo = params['pseudo'];

      // Après avoir récupéré le pseudo, on affiche les stats ELO
      if (this.eloStats) {
        this.showEloStat(Constantes.TypeJeuChessCom.RAPID);
      }
    });
  }*/
    ngOnInit(): void {
      // Récupérer le pseudo depuis les paramètres de l'URL
      this.route.queryParams.subscribe((params: Params) => {
        this.pseudo = params['pseudo'];
      });
  
      // Appeler la méthode de chargement avec la barre de progression
      this.showEloStatWithLoading();
    }

    // Méthode pour afficher les stats Elo avec la barre de chargement
  showEloStatWithLoading() {
    // Ouvrir le dialog de la barre de progression
    // Utilisation de 'panelClass: full-screen-dialog' pour appliquer des styles personnalisés
    // au conteneur global de la boîte de dialogue (mat-mdc-dialog-surface).
    // Ces styles sont définis dans styles.css car le CSS du composant ne peut pas cibler les éléments
    // générés en dehors du composant Angular.

    const dialogRef  = this.matDialog.open(LoadingBarComponent, {
      height: '100vh',    // Assurez-vous que la boîte de dialogue prend toute la hauteur
      width: '100vw',
      maxWidth: '100vw',     // Assurez-vous que la boîte de dialogue prend toute la largeur
      panelClass: 'full-screen-dialog',  // La classe qui définit les styles
      hasBackdrop: true,  // Ajoute un fond semi-transparent
      disableClose: true  // Empêche la fermeture du dialogue en cliquant en dehors
    });
    

    // Simuler un délai de chargement pour la progression
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      dialogRef.componentInstance.increaseProgress(progress); // Augmenter la progression
      if (progress >= 100) {
        clearInterval(interval); // Stoppe l'intervalle lorsque la progression atteint 100%
        dialogRef.close(); // Ferme la barre de progression une fois le chargement terminé
        this.showEloStat(Constantes.TypeJeuChessCom.RAPID);
      }
    }, 1000); // Mise à jour toutes les secondes
  }

 
  /**
   * 
   * Méthode à utiliser uniquement avec afterNextRender, ou afterRender
   * Elle "append" un graphe generée grace à Plot de Observable. 
   * 
   * Ce graphe va correspondre au différents niveau d'Elo de Chess.com
   */
  showEloStat(time_class?: Constantes.TypeJeuChessCom): void {
    const eloList = this.api.getElo(time_class);

    let plot = Plot.plot({
      marks: [
        Plot.lineY(eloList, { y: 'rating', x: 'timestamp' })
      ]
    });

    if (this.eloStats) {
      this.eloStats.nativeElement.replaceChildren(plot);
    }
  }
}
