import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  constructor(private router : Router){

  }

  public goStats(){
    this.router.navigate(['/stats']);
  }

  public goEchequier(){
    
  }
  public goHome(){
    this.router.navigate(['/']);
  }

}
