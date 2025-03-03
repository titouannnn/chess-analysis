import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  selectedButton: string = '';

  selectButton(button: string) {
    if (this.selectedButton === button) {
      this.selectedButton = '';
    } else {
      this.selectedButton = button;
    }
  }



}
