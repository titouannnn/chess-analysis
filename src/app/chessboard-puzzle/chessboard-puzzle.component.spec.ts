import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChessboardPuzzleComponent } from './chessboard-puzzle.component';

describe('ChessboardPuzzleComponent', () => {
  let component: ChessboardPuzzleComponent;
  let fixture: ComponentFixture<ChessboardPuzzleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChessboardPuzzleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChessboardPuzzleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
