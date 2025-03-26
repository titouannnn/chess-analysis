import { Component } from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatProgressBarModule} from '@angular/material/progress-bar';


@Component({
  selector: 'app-loading-bar',
  imports: [MatProgressBarModule],
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.css'
})
export class LoadingBarComponent {

  progress : number = 0;

  constructor( readonly dialog : MatDialogRef<LoadingBarComponent> ){}

  increaseProgress( pourcentage : number ){
    
    this.progress += pourcentage;
    if (this.progress >= 100) {
      this.progress = 100; 
      this.dialog.close(); 
    }
  }


}
