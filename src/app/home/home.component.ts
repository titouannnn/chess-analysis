import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChesscomApi } from '../../api/chesscomapi.service';
import { LitchessApi } from '../../api/litchess-api.service';

@Component({
  selector: 'app-home-page-custom',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  selectedButton: string = 'chess.com';
  username: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  loadingProgress: number = 0;

  Math = Math;

  constructor(
    private router: Router,
    private chesscomApi: ChesscomApi,
    private lichessApi: LitchessApi,
    private cdr: ChangeDetectorRef // Ajout du ChangeDetectorRef
  ) {}

  selectButton(button: string) {
    this.selectedButton = button;
    this.errorMessage = '';
  }

  async submitUsername() {
    if (!this.username.trim()) {
      this.errorMessage = 'Veuillez entrer un nom d\'utilisateur';
      return;
    }
  
    this.isLoading = true;
    this.loadingProgress = 0;
    this.errorMessage = '';
    this.cdr.detectChanges(); // Force la mise à jour de la vue
  
    try {
      if (this.selectedButton === 'chess.com') {
        this.chesscomApi.getUsername(this.username);
        
        // Utiliser la méthode initWithProgress au lieu de initialize
        await this.chesscomApi.initWithProgress((progress) => {
          console.log("Progression: ", progress);
          this.loadingProgress = progress;
          this.cdr.detectChanges();
        });
        
        console.log("Parties Chess.com chargées pour", this.username);
      } else if (this.selectedButton === 'lichess') {
        // Afficher une progression simulée pour Lichess
        for (let i = 0; i <= 100; i += 10) {
          this.loadingProgress = i;
          this.cdr.detectChanges();
          await new Promise(resolve => setTimeout(resolve, 200)); // Simule un délai
        }
        
        await this.lichessApi.getIDLichessGames(this.username, 100);
        await this.lichessApi.getInfoLichessGames();
        this.lichessApi.dataFormatage();
        console.log("Parties Lichess chargées pour", this.username);
      } else {
        throw new Error('Veuillez sélectionner une plateforme d\'échecs');
      }
      
      this.router.navigate(['stats-elo'], {
        queryParams: { pseudo: this.username, platform: this.selectedButton } 
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      this.errorMessage = "Erreur lors du chargement des parties. Vérifiez le nom d'utilisateur.";
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}