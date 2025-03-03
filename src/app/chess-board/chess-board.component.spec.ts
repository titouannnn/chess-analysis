import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChessBoardComponent } from './chess-board.component';

describe('ChessBoardComponent', () => {
  let component: ChessBoardComponent;
  let fixture: ComponentFixture<ChessBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChessBoardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChessBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
