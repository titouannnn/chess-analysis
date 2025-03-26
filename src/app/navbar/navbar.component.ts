import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  // Navigation links that match your routes
  navLinks = [
    { path: '/', label: 'Accueil', icon: '🏠', exact: true },
    { path: '/chessboard', label: 'Échiquier', icon: '♟' },
    { path: '/puzzles', label: 'Puzzles', icon: '♞' },
    { path: '/stats', label: 'Statistiques', icon: '📈' }
  ];
}