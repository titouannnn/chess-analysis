import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  // Navigation links that match your routes
  navLinks = [
    { path: '/chessboard', label: 'Échiquier', icon: '♟' },
    { path: '/puzzles', label: 'Puzzles', icon: '♞' },
    { path: '/stats', label: 'Statistiques', icon: '📈' },
    { path: '/', label: 'Accueil', icon: '🏠', exact: true }
  ];

  isHomePage: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Vérifier l'URL initiale
    this.checkIfHomePage(this.router.url);

    // S'abonner aux changements de route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkIfHomePage(event.url);
    });
  }

  // Vérifier si on est sur la page d'accueil
  private checkIfHomePage(url: string): void {
    this.isHomePage = url === '/' || url === '';
  }
}