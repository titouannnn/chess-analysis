import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LitchessApiService } from './litchess-api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'WEb';
  constructor(private LitchessApiService: LitchessApiService) {}

  async ngOnInit() {
    console.log('Hello, world!');
    await this.LitchessApiService.getIDLichessGames('TITOUAN', 10);
    console.log(this.LitchessApiService.gamesID);
    await this.LitchessApiService.getInfoLichessGames();
    console.log(this.LitchessApiService.allGames);
    await this.LitchessApiService.sortJson(this.LitchessApiService.allGames);
  }
}
