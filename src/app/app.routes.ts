import { Routes } from '@angular/router';
import { PuzzlesComponent } from './puzzles/puzzles.component';
import { ChessboardComponent } from './chessboard/chessboard.component';

export const routes: Routes = [
    {path:'puzzles', component: PuzzlesComponent},
    { path: 'chessboard', component: ChessboardComponent }
];
