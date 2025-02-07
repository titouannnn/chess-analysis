import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { StatsEloComponent } from './app/stats-elo/stats-elo.component';


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));




