import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { StatsEloComponent } from './stats-elo/stats-elo.component';  // Importer StatsEloComponent


export const routes: Routes = [
    {path:'', component:HomeComponent},
    {path: 'stats', component: StatsEloComponent },
];
