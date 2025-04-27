import { TestBed } from '@angular/core/testing';

import { FoodListingService } from './food-listing.service';

describe('FoodListingService', () => {
  let service: FoodListingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FoodListingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
