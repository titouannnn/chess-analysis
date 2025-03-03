import { TestBed } from '@angular/core/testing';

import { LitchessApiService } from './litchess-api.service';

describe('LitchessApiService', () => {
  let service: LitchessApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LitchessApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
