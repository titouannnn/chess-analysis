import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  selectedButton: string = '';  // Variable pour stocker le bouton sélectionné

  selectButton(button: string) {
    // On ne désélectionne pas le bouton si c'est déjà sélectionné, il reste sélectionné
    if (this.selectedButton === button) {
      return;  // Si le bouton est déjà sélectionné, on ne fait rien
    } else {
      this.selectedButton = button;  // Sélectionne le bouton
    }
  }

}
