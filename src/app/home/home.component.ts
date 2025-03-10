import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home-page-custom',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  selectedButton: string = '';  // Variable pour stocker le bouton sélectionné
  pseudo: string = '';

  constructor(private router: Router) {}
  selectButton(button: string) {
    // On ne désélectionne pas le bouton si c'est déjà sélectionné, il reste sélectionné
    if (this.selectedButton === button) {
      return;  // Si le bouton est déjà sélectionné, on ne fait rien
    } else {
      this.selectedButton = button;  // Sélectionne le bouton
    }
  }
  searchStats() {
    if (this.pseudo) {
      this.router.navigate(['/stats'], { queryParams: { pseudo: this.pseudo } });
    } else {
      console.log('Le pseudo est vide!');
    }
  }
  

}
