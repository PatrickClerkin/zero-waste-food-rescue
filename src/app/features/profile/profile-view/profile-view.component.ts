// src/app/features/profile/profile-view/profile-view.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { FoodListing } from '../../../core/models/food-listing.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { FoodListingService } from 'src/app/core/services/food-listing.service';
import { FoodCardComponent } from 'src/app/shared/components/food-card/food-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, FoodCardComponent, FormsModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>My Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/profile/edit">
            <ion-icon name="create-outline"></ion-icon>
          </ion-button>
          <ion-button (click)="logout()">
            <ion-icon name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      
      <ion-toolbar>
        <ion-segment [(ngModel)]="selectedSegment" (ionChange)="segmentChanged()">
          <ion-segment-button value="info">
            <ion-label>Info</ion-label>
          </ion-segment-button>
          <ion-segment-button value="listings" *ngIf="isDonor">
            <ion-label>My Listings</ion-label>
          </ion-segment-button>
          <ion-segment-button value="claimed" *ngIf="isRecipient">
            <ion-label>Claimed Items</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="content-container">
        <div *ngIf="selectedSegment === 'info'" class="profile-info-container">
          <div class="profile-header">
            <ion-avatar class="profile-avatar">
              <img [src]="user?.photoURL || 'assets/images/avatar-placeholder.jpg'" alt="Profile">
            </ion-avatar>
            <h1 class="profile-name">{{ user?.displayName }}</h1>
            <p class="profile-type">
              <ion-badge color="primary">
                {{ getUserTypeBadge() }}
              </ion-badge>
            </p>
          </div>
          
          <ion-card class="info-card">
            <ion-card-header>
              <ion-card-title>Contact Information</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item lines="none">
                <ion-icon name="mail-outline" slot="start"></ion-icon>
                <ion-label>
                  <h2>Email</h2>
                  <p>{{ user?.email }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item lines="none" *ngIf="user?.phoneNumber">
                <ion-icon name="call-outline" slot="start"></ion-icon>
                <ion-label>
                  <h2>Phone</h2>
                  <p>{{ user?.phoneNumber }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item lines="none" *ngIf="user?.address">
                <ion-icon name="location-outline" slot="start"></ion-icon>
                <ion-label>
                  <h2>Address</h2>
                  <p>{{ user?.address }}</p>
                </ion-label>
              </ion-item>
            </ion-card-content>
          </ion-card>
          
          <ion-card class="info-card" *ngIf="user?.bio">
            <ion-card-header>
              <ion-card-title>About</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ user?.bio }}</p>
            </ion-card-content>
          </ion-card>
          
          <ion-card class="info-card" *ngIf="hasRatings()">
            <ion-card-header>
              <ion-card-title>Ratings</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="rating-container">
                <div class="rating-stars">
                  <ion-icon 
                    *ngFor="let star of [1, 2, 3, 4, 5]" 
                    [name]="star <= averageRating ? 'star' : 'star-outline'"
                    color="warning"
                  ></ion-icon>
                </div>
                <div class="rating-text">
                  {{ averageRating.toFixed(1) }} / 5 ({{ user?.ratingCount }} reviews)
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
        
        <div *ngIf="selectedSegment === 'listings'" class="listings-container">
          <div *ngIf="isLoadingListings" class="loading-container">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Loading your listings...</p>
          </div>
          
          <div *ngIf="!isLoadingListings && myListings.length === 0" class="empty-state">
            <ion-icon name="basket-outline" class="empty-icon"></ion-icon>
            <h2>No listings yet</h2>
            <p>You haven't created any food listings yet.</p>
            <ion-button routerLink="/food-listings/create">
              Create Your First Listing
            </ion-button>
          </div>
          
          <div *ngIf="!isLoadingListings && myListings.length > 0">
            <app-food-card
              *ngFor="let listing of myListings"
              [listing]="listing"
              [showClaimButton]="false"
            ></app-food-card>
          </div>
        </div>
        
        <div *ngIf="selectedSegment === 'claimed'" class="listings-container">
          <div *ngIf="isLoadingListings" class="loading-container">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Loading your claimed items...</p>
          </div>
          
          <div *ngIf="!isLoadingListings && claimedListings.length === 0" class="empty-state">
            <ion-icon name="hand-left-outline" class="empty-icon"></ion-icon>
            <h2>No claimed items</h2>
            <p>You haven't claimed any food items yet.</p>
            <ion-button routerLink="/food-listings">
              Browse Available Food
            </ion-button>
          </div>
          
          <div *ngIf="!isLoadingListings && claimedListings.length > 0">
            <app-food-card
              *ngFor="let listing of claimedListings"
              [listing]="listing"
              [showClaimButton]="false"
            ></app-food-card>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .content-container {
      padding: 16px;
    }
    
    .profile-info-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .profile-avatar {
      width: 120px;
      height: 120px;
      margin-bottom: 16px;
      border: 4px solid var(--ion-color-light);
    }
    
    .profile-name {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }
    
    .profile-type {
      margin: 0;
    }
    
    .info-card {
      margin-bottom: 16px;
    }
    
    ion-item h2 {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin-bottom: 4px;
    }
    
    ion-item p {
      font-size: 16px;
    }
    
    .rating-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .rating-stars {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .rating-text {
      font-weight: 600;
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
export class ProfileViewComponent implements OnInit, OnDestroy {
  user: User | null = null;
  selectedSegment = 'info';
  myListings: FoodListing[] = [];
  claimedListings: FoodListing[] = [];
  isLoadingListings = false;
  
  isDonor = false;
  isRecipient = false;
  
  private subscriptions = new Subscription();
  
  constructor(
    private authService: AuthService,
    private foodListingService: FoodListingService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.user = user;
        
        if (user) {
          this.isDonor = user.userType === 'donor' || user.userType === 'both';
          this.isRecipient = user.userType === 'recipient' || user.userType === 'both';
          
          // Load appropriate listings based on user type
          if (this.isDonor && this.selectedSegment === 'listings') {
            this.loadMyListings();
          } else if (this.isRecipient && this.selectedSegment === 'claimed') {
            this.loadClaimedListings();
          }
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  getUserTypeBadge(): string {
    switch (this.user?.userType) {
      case 'donor':
        return 'Food Donor';
      case 'recipient':
        return 'Food Recipient';
      case 'both':
        return 'Donor & Recipient';
      default:
        return '';
    }
  }
  
  // Helper method to check if user has ratings
  hasRatings(): boolean {
    return !!(this.user && this.user.ratingCount && this.user.ratingCount > 0);
  }
  
  get averageRating(): number {
    if (!this.user || !this.user.ratings || !this.user.ratingCount || this.user.ratingCount === 0) {
      return 0;
    }
    
    return this.user.ratings / this.user.ratingCount;
  }
  
  segmentChanged(): void {
    switch (this.selectedSegment) {
      case 'listings':
        this.loadMyListings();
        break;
      case 'claimed':
        this.loadClaimedListings();
        break;
    }
  }
  
  loadMyListings(): void {
    if (!this.user) return;
    
    this.isLoadingListings = true;
    
    this.subscriptions.add(
      this.foodListingService.getListingsByDonor(this.user.uid).subscribe({
        next: (listings) => {
          this.myListings = listings;
          this.isLoadingListings = false;
        },
        error: (error) => {
          console.error('Error loading listings:', error);
          this.isLoadingListings = false;
        }
      })
    );
  }
  
  loadClaimedListings(): void {
    if (!this.user) return;
    
    this.isLoadingListings = true;
    
    this.subscriptions.add(
      this.foodListingService.getClaimedListings(this.user.uid).subscribe({
        next: (listings) => {
          this.claimedListings = listings;
          this.isLoadingListings = false;
        },
        error: (error) => {
          console.error('Error loading claimed listings:', error);
          this.isLoadingListings = false;
        }
      })
    );
  }
  
  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}