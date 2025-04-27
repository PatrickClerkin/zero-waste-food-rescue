// src/app/features/food-listings/listing-detail/listing-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FoodListing } from '../../../core/models/food-listing.model';
import { FoodListingService } from '../../../core/services/food-listing.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { MessagingService } from '../../../core/services/messaging.service';
import { LocationService } from '../../../core/services/location.service';
import { MapViewComponent } from '../../../shared/components/map-view/map-view.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  
  imports: [CommonModule, IonicModule, RouterLink, MapViewComponent, TimeAgoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/food-listings"></ion-back-button>
        </ion-buttons>
        <ion-title>Food Details</ion-title>
        <ion-buttons slot="end" *ngIf="isOwner">
          <ion-button [routerLink]="['/food-listings/edit', listingId]">
            <ion-icon name="create-outline"></ion-icon>
          </ion-button>
          <ion-button (click)="presentDeleteAlert()">
            <ion-icon name="trash-outline" color="danger"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading...</p>
      </div>
      
      <ng-container *ngIf="!isLoading && listing">
        <ion-slides pager="true" [options]="slideOpts" class="image-slider">
          <ion-slide *ngFor="let image of listing.images">
            <img [src]="image" [alt]="listing.title">
          </ion-slide>
          <ion-slide *ngIf="!listing.images || listing.images.length === 0">
            <img src="assets/images/placeholder-food.jpg" [alt]="listing.title">
          </ion-slide>
        </ion-slides>
        
        <div class="content-container">
          <div class="listing-header">
            <ion-badge color="primary" class="category-badge">{{ listing.category }}</ion-badge>
            <h1 class="listing-title">{{ listing.title }}</h1>
            <p class="listing-meta">
              <ion-icon name="time-outline"></ion-icon> Posted {{ listing.createdAt | timeAgo }}
            </p>
          </div>
          
          <div class="listing-stats">
            <div class="stat-item">
              <ion-icon name="cube-outline"></ion-icon>
              <div class="stat-text">
                <span class="stat-value">{{ listing.quantity }} {{ listing.unit }}</span>
                <span class="stat-label">Quantity</span>
              </div>
            </div>
            
            <div class="stat-item">
              <ion-icon name="calendar-outline"></ion-icon>
              <div class="stat-text">
                <span class="stat-value">{{ listing.expiryDate | date:'MMM d, y' }}</span>
                <span class="stat-label">Expiry Date</span>
              </div>
            </div>
          </div>
          
          <div class="listing-section">
            <h2>Description</h2>
            <p>{{ listing.description }}</p>
          </div>
          
          <div class="listing-section" *ngIf="listing.allergensInfo && listing.allergensInfo.length > 0">
            <h2>Allergens</h2>
            <div class="tags-container">
              <ion-chip *ngFor="let allergen of listing.allergensInfo">
                <ion-label>{{ allergen }}</ion-label>
              </ion-chip>
            </div>
          </div>
          
          <div class="listing-section" *ngIf="listing.dietaryInfo && listing.dietaryInfo.length > 0">
            <h2>Dietary Info</h2>
            <div class="tags-container">
              <ion-chip *ngFor="let diet of listing.dietaryInfo">
                <ion-label>{{ diet }}</ion-label>
              </ion-chip>
            </div>
          </div>
          
          <div class="listing-section">
            <h2>Pickup Location</h2>
            <p class="address">
              <ion-icon name="location-outline"></ion-icon>
              {{ listing.address }}
            </p>
            
            <div class="map-container">
              <app-map-view
                [listings]="[listing]"
                [userLocation]="userLocation"
                height="200px"
              ></app-map-view>
            </div>
          </div>
          
          <div class="listing-section">
            <h2>Donor Information</h2>
            <div class="donor-info">
              <ion-avatar>
                <img [src]="listing.donorPhoto || 'assets/images/avatar-placeholder.jpg'" alt="Donor">
              </ion-avatar>
              <div class="donor-details">
                <h3>{{ listing.donorName }}</h3>
                <ion-button 
                  fill="clear" 
                  size="small" 
                  (click)="messageOwner()"
                  *ngIf="!isOwner && isAuthenticated"
                >
                  <ion-icon name="chatbubble-outline" slot="start"></ion-icon>
                  Message
                </ion-button>
              </div>
            </div>
          </div>
          
          <div class="listing-section" *ngIf="listing.pickupInstructions">
            <h2>Pickup Instructions</h2>
            <p>{{ listing.pickupInstructions }}</p>
          </div>
          
          <div class="listing-status" *ngIf="listing.status !== 'available'">
            <ion-badge 
              [color]="
                listing.status === 'claimed' ? 'warning' : 
                listing.status === 'completed' ? 'success' : 'danger'
              "
            >
              {{ listing.status | titlecase }}
            </ion-badge>
            
            <p *ngIf="listing.status === 'claimed' && isOwner">
              This item has been claimed and is waiting for pickup.
            </p>
            
            <p *ngIf="listing.status === 'claimed' && isClaimer">
              You've claimed this item. Please follow the pickup instructions.
            </p>
          </div>
        </div>
      </ng-container>
      
      <ion-fab vertical="bottom" horizontal="end" slot="fixed" *ngIf="canClaim">
        <ion-fab-button (click)="claimListing()">
          <ion-icon name="hand-left"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--ion-color-medium);
    }
    
    .image-slider {
      height: 300px;
    }
    
    .image-slider img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .content-container {
      padding: 16px;
    }
    
    .listing-header {
      margin-bottom: 24px;
    }
    
    .category-badge {
      margin-bottom: 8px;
      text-transform: capitalize;
    }
    
    .listing-title {
      font-size: 24px;
      font-weight: 700;
      margin: 8px 0;
    }
    
    .listing-meta {
      display: flex;
      align-items: center;
      color: var(--ion-color-medium);
      font-size: 14px;
    }
    
    .listing-meta ion-icon {
      margin-right: 4px;
    }
    
    .listing-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 24px;
      padding: 16px;
      background: var(--ion-color-light);
      border-radius: 8px;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
    }
    
    .stat-item ion-icon {
      font-size: 24px;
      margin-right: 8px;
      color: var(--ion-color-primary);
    }
    
    .stat-text {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-weight: 600;
    }
    
    .stat-label {
      font-size: 12px;
      color: var(--ion-color-medium);
    }
    
    .listing-section {
      margin-bottom: 24px;
    }
    
    .listing-section h2 {
      font-size: 18px;
      margin-bottom: 8px;
      color: var(--ion-color-dark);
    }
    
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .address {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .address ion-icon {
      margin-right: 8px;
      color: var(--ion-color-danger);
    }
    
    .map-container {
      height: 200px;
      margin-bottom: 16px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--ion-color-light);
    }
    
    .donor-info {
      display: flex;
      align-items: center;
      padding: 16px;
      background: var(--ion-color-light);
      border-radius: 8px;
    }
    
    .donor-info ion-avatar {
      width: 60px;
      height: 60px;
      margin-right: 16px;
    }
    
    .donor-details h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
    }
    
    .listing-status {
      margin-top: 24px;
      padding: 16px;
      background: var(--ion-color-light);
      border-radius: 8px;
      text-align: center;
    }
    
    .listing-status ion-badge {
      font-size: 16px;
      padding: 8px 16px;
      margin-bottom: 12px;
    }
  `]
})
export class ListingDetailComponent implements OnInit {
  listingId: string = '';
  listing: FoodListing | null = null;
  isLoading = true;
  isOwner = false;
  isClaimer = false;
  isAuthenticated = false;
  userLocation?: { latitude: number, longitude: number };
  
  slideOpts = {
    initialSlide: 0,
    speed: 400,
    loop: false,
    zoom: {
      maxRatio: 3
    }
  };
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private foodListingService: FoodListingService,
    private authService: AuthService,
    private messagingService: MessagingService,
    private locationService: LocationService
  ) {}
  
  ngOnInit(): void {
    this.listingId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.listingId) {
      this.router.navigate(['/food-listings']);
      return;
    }
    
    // Get user location
    this.locationService.getCurrentLocation().subscribe({
      next: (position) => {
        this.userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      },
      error: (error) => {
        console.error('Error getting location:', error);
      }
    });
    
    // Check if user is authenticated
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.loadListing();
    });
  }
  async loadListing(): Promise<void> {
    this.isLoading = true;
    
    try {
      const listing = await this.foodListingService.getListing(this.listingId);
      
      if (!listing) {
        this.router.navigate(['/food-listings']);
        return;
      }
      
      this.listing = listing;
      
      // Check if current user is the owner - using firstValueFrom instead of getValue()
      const currentUser = await firstValueFrom(this.authService.currentUser$);
      this.isOwner = currentUser?.uid === listing.donorId;
      this.isClaimer = currentUser?.uid === listing.claimedBy;
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading listing:', error);
      this.isLoading = false;
      this.router.navigate(['/food-listings']);
    }
  }
  get canClaim(): boolean {
    if (!this.listing || !this.isAuthenticated) return false;
    
    return (
      this.listing.status === 'available' && 
      !this.isOwner && 
      this.authService.isRecipient()
    );
  }
  
  async claimListing(): Promise<void> {
    if (!this.listing) return;
    
    try {
      await this.foodListingService.claimListing(this.listingId);
      this.loadListing(); // Reload the listing to update status
    } catch (error) {
      console.error('Error claiming listing:', error);
    }
  }
  
  async messageOwner(): Promise<void> {
    if (!this.listing) return;
    
    try {
      await this.messagingService.sendMessage(
        this.listing.donorId,
        `Hi, I'm interested in your listing: ${this.listing.title}`,
        this.listingId
      );
      
      this.router.navigate(['/messages', this.listing.donorId]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
  
  async presentDeleteAlert(): Promise<void> {
    const alert = document.createElement('ion-alert');
    alert.header = 'Confirm Deletion';
    alert.message = 'Are you sure you want to delete this listing?';
    alert.buttons = [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        handler: () => {
          this.deleteListing();
        }
      }
    ];
    
    document.body.appendChild(alert);
    await alert.present();
  }
  
  async deleteListing(): Promise<void> {
    try {
      await this.foodListingService.deleteListing(this.listingId);
      this.router.navigate(['/food-listings']);
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  }
}
