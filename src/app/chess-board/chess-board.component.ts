import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss']
})
export class ChessBoardComponent implements AfterViewInit {
  @ViewChild('board') myCanvas!: ElementRef<HTMLCanvasElement>;
  private context!: CanvasRenderingContext2D | null;

  ngAfterViewInit(): void {
    console.log('Canvas récupéré:', this.myCanvas);
    if (this.myCanvas) {
      this.context = this.myCanvas.nativeElement.getContext('2d');
      if (!this.context) {
        console.error('Impossible d\'obtenir le contexte 2D du canvas.');
      } else {
        this.drawBoard();
      }
    }
  }

  private drawBoard(): void {
    if (!this.context) return;

    const size = 400; // Taille du plateau
    const cellSize = size / 8;
    const colors = ['#f6dfc0', '#b88767'];

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        this.context.fillStyle = colors[(x + y) % 2];
        this.context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
}
