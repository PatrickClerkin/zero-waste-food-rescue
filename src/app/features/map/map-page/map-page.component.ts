// src/app/features/map/map-page/map-page.component.ts
// Fix the "type" error in the AlertInput component
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FoodListing, FoodCategory } from '../../../core/models/food-listing.model';
import { FoodListingService } from '../../../core/services/food-listing.service';
import { LocationService } from '../../../core/services/location.service';
import { MapViewComponent } from '../../../shared/components/map-view/map-view.component';
import { CategoryFilterComponent } from '../../../shared/components/category-filter/category-filter.component';
import { FoodCardComponent } from '../../../shared/components/food-card/food-card.component';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule, 
    MapViewComponent, 
    CategoryFilterComponent, 
    FoodCardComponent,
    RouterLink
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/food-listings"></ion-back-button>
        </ion-buttons>
        <ion-title>Map View</ion-title>
      </ion-toolbar>
      
      <ion-toolbar>
        <app-category-filter
          [selectedCategory]="selectedCategory"
          (categorySelected)="filterByCategory($event)"
        ></app-category-filter>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="map-container">
        <app-map-view
          [listings]="listings"
          [userLocation]="userLocation"
          (markerClick)="onMarkerClick($event)"
        ></app-map-view>
      </div>
      
      <ion-card *ngIf="selectedListing" class="listing-card">
        <ion-card-header>
          <ion-button
            fill="clear"
            size="small"
            class="close-button"
            (click)="selectedListing = null"
          >
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
          <ion-card-title>{{ selectedListing.title }}</ion-card-title>
          <ion-card-subtitle>{{ selectedListing.category | titlecase }}</ion-card-subtitle>
        </ion-card-header>
        
        <ion-card-content>
          <ion-img 
            [src]="selectedListing.images && selectedListing.images.length ? selectedListing.images[0] : 'assets/images/placeholder-food.jpg'" 
            class="card-image"
          ></ion-img>
          
          <p class="listing-details">
            <ion-icon name="cube-outline"></ion-icon>
            {{ selectedListing.quantity }} {{ selectedListing.unit }}
          </p>
          
          <p class="listing-details">
            <ion-icon name="location-outline"></ion-icon>
            {{ selectedListing.address | slice:0:50 }}{{ selectedListing.address.length > 50 ? '...' : '' }}
          </p>
          
          <ion-button expand="block" [routerLink]="['/food-listings', selectedListing.id]">
            View Details
          </ion-button>
        </ion-card-content>
      </ion-card>
      
      <ion-fab vertical="top" horizontal="end" slot="fixed" class="distance-fab">
        <ion-fab-button size="small" (click)="presentDistanceFilter()">
          <ion-icon name="options-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .map-container {
      height: 100%;
      width: 100%;
    }
    
    .listing-card {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      margin: 16px;
      z-index: 1000;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .close-button {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1001;
    }
    
    .card-image {
      height: 160px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .listing-details {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .listing-details ion-icon {
      margin-right: 8px;
      color: var(--ion-color-primary);
    }
    
    .distance-fab {
      margin-top: 16px;
      margin-right: 16px;
    }
  `]
})
export class MapPageComponent implements OnInit, OnDestroy {
  listings: FoodListing[] = [];
  filteredListings: FoodListing[] = [];
  isLoading = true;
  selectedCategory: FoodCategory | null = null;
  userLocation?: { latitude: number, longitude: number };
  selectedListing: FoodListing | null = null;
  maxDistance = 20; // Default 20km radius
  
  private subscriptions = new Subscription();
  
  constructor(
    private foodListingService: FoodListingService,
    private locationService: LocationService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
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
          this.filterByDistance();
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
  
  filterByDistance(): void {
    if (!this.userLocation) {
      this.filteredListings = this.listings;
      return;
    }
    
    this.filteredListings = this.listings.filter(listing => {
      const distance = this.locationService.calculateDistance(
        this.userLocation!.latitude, 
        this.userLocation!.longitude,
        listing.latitude,
        listing.longitude
      );
      
      return distance <= this.maxDistance;
    });
  }
  
  onMarkerClick(listing: FoodListing): void {
    this.selectedListing = listing;
  }
  
  async presentDistanceFilter(): Promise<void> {
    const alert = document.createElement('ion-alert');
    alert.header = 'Filter by Distance';
    alert.subHeader = 'Maximum distance from your location';
    alert.inputs = [
      {
        name: 'distance',
        type: 'text',
        min: 1,
        max: 50,
        value: this.maxDistance
      }
    ];
    alert.buttons = [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Apply',
        handler: (data) => {
          this.maxDistance = data.distance;
          this.filterByDistance();
        }
      }
    ];
    
    document.body.appendChild(alert);
    await alert.present();
  }
}