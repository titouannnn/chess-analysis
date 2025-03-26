import { Routes } from '@angular/router';
import { PuzzlesComponent } from './puzzles/puzzles.component';
import { ChessboardComponent } from './chessboard/chessboard.component';
import { HomeComponent } from './home/home.component';
import { StatsEloComponent } from './stats-elo/stats-elo.component'; 

export const routes: Routes = [
    {path:'puzzles', component: PuzzlesComponent},
    { path: 'chessboard', component: ChessboardComponent },
    {path:'', component:HomeComponent},
    {path: 'stats', component: StatsEloComponent }
];
