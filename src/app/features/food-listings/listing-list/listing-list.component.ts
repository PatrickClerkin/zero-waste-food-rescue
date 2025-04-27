// src/app/features/food-listings/listing-list/listing-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FoodListing, FoodCategory } from '../../../core/models/food-listing.model';
import { FoodListingService } from '../../../core/services/food-listing.service';
import { LocationService } from '../../../core/services/location.service';
import { AuthService } from '../../../core/services/auth.service';
import { FoodCardComponent } from '../../../shared/components/food-card/food-card.component';
import { CategoryFilterComponent } from '../../../shared/components/category-filter/category-filter.component';

@Component({
  selector: 'app-listing-list',
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule, 
    RouterLink, 
    FoodCardComponent,
    CategoryFilterComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Available Food</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/map">
            <ion-icon name="map-outline"></ion-icon>
          </ion-button>
          <ion-button *ngIf="isDonor" routerLink="/food-listings/create">
            <ion-icon name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      
      <ion-toolbar>
        <app-category-filter
          [selectedCategory]="selectedCategory"
          (categorySelected)="filterByCategory($event)"
        ></app-category-filter>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refreshListings($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      
      <div class="content-container">
        <div *ngIf="isLoading" class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Loading available food...</p>
        </div>
        
        <ng-container *ngIf="!isLoading">
          <div *ngIf="listings.length === 0" class="empty-state">
            <ion-icon name="sad-outline" class="empty-icon"></ion-icon>
            <h2>No food available</h2>
            <p *ngIf="selectedCategory">
              There are no {{ selectedCategory }} items available right now.
              <a (click)="filterByCategory(null)">See all categories</a>
            </p>
            <p *ngIf="!selectedCategory">
              There are no food items available right now. Check back soon!
            </p>
          </div>
          
          <div class="listings-container">
            <app-food-card
              *ngFor="let listing of listings"
              [listing]="listing"
              [userLocation]="userLocation"
              [showClaimButton]="isRecipient"
              (claim)="claimListing($event)"
            ></app-food-card>
          </div>
        </ng-container>
      </div>
      
      <ion-fab *ngIf="isDonor" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button routerLink="/food-listings/create">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .content-container {
      padding: 16px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: var(--ion-color-medium);
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
      color: var(--ion-color-medium);
    }
    
    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    
    .listings-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `]
})
export class ListingListComponent implements OnInit, OnDestroy {
  listings: FoodListing[] = [];
  isLoading = true;
  selectedCategory: FoodCategory | null = null;
  userLocation?: { latitude: number, longitude: number };
  
  private subscriptions = new Subscription();
  isDonor = false;
  isRecipient = false;
  
  constructor(
    private foodListingService: FoodListingService,
    private locationService: LocationService,
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Check user type
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.isDonor = user?.userType === 'donor' || user?.userType === 'both';
        this.isRecipient = user?.userType === 'recipient' || user?.userType === 'both';
      })
    );
    
    // Get user location
    this.subscriptions.add(
      this.locationService.getCurrentLocation().subscribe({
        next: (position) => {
          this.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.loadListings();
        },
        error: (error) => {
          console.error('Error getting location:', error);
          this.loadListings();
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  loadListings(): void {
    this.isLoading = true;
    
    let listingsObservable = this.selectedCategory ? 
      this.foodListingService.getListingsByCategory(this.selectedCategory) : 
      this.foodListingService.getAvailableListings();
    
    this.subscriptions.add(
      listingsObservable.subscribe({
        next: (listings) => {
          this.listings = listings;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading listings:', error);
          this.isLoading = false;
        }
      })
    );
  }
  
  filterByCategory(category: FoodCategory | null): void {
    this.selectedCategory = category;
    this.loadListings();
  }
  
  async claimListing(listingId: string): Promise<void> {
    try {
      await this.foodListingService.claimListing(listingId);
      this.router.navigate(['/food-listings', listingId]);
    } catch (error) {
      console.error('Error claiming listing:', error);
    }
  }
  
  refreshListings(event: any): void {
    this.loadListings();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}