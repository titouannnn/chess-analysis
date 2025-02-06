import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsEloComponent } from './stats-elo.component';

describe('StatsEloComponent', () => {
  let component: StatsEloComponent;
  let fixture: ComponentFixture<StatsEloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsEloComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatsEloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
