import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariantesPopupComponent } from './variantes-popup.component';

describe('VariantesPopupComponent', () => {
  let component: VariantesPopupComponent;
  let fixture: ComponentFixture<VariantesPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantesPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VariantesPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
