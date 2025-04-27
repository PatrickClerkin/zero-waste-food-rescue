// src/app/shared/components/food-card/food-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { FoodListing } from '../../../core/models/food-listing.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { DistancePipe } from '../../pipes/distance.pipe';

@Component({
  selector: 'app-food-card',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, TimeAgoPipe, DistancePipe],
  template: `
    <ion-card class="food-card">
      <ion-img 
        [src]="listing.images && listing.images.length ? listing.images[0] : 'assets/images/placeholder-food.jpg'" 
        class="food-image"
      ></ion-img>
      
      <ion-card-header>
        <ion-badge color="primary" class="category-badge">{{ listing.category }}</ion-badge>
        <ion-card-title>{{ listing.title }}</ion-card-title>
        <ion-card-subtitle>
          {{ listing.quantity }} {{ listing.unit }}
          <span *ngIf="userLocation">
            &bull; {{ listing | distance: userLocation.latitude : userLocation.longitude }}
          </span>
        </ion-card-subtitle>
      </ion-card-header>
      
      <ion-card-content>
        <p class="description">{{ listing.description | slice:0:100 }}{{ listing.description.length > 100 ? '...' : '' }}</p>
        
        <div class="donor-info">
          <ion-avatar class="donor-avatar">
            <img [src]="listing.donorPhoto || 'assets/images/avatar-placeholder.jpg'" alt="Donor">
          </ion-avatar>
          <div class="donor-details">
            <span class="donor-name">{{ listing.donorName }}</span>
            <span class="listing-time">{{ listing.createdAt | timeAgo }}</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <ion-button fill="clear" [routerLink]="['/food-listings', listing.id]">
            View Details
          </ion-button>
          <ion-button *ngIf="showClaimButton" color="primary" (click)="onClaimClick()">
            Claim
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .food-card {
      margin-bottom: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .food-image {
      height: 180px;
      object-fit: cover;
    }
    
    .category-badge {
      margin-bottom: 8px;
      text-transform: capitalize;
    }
    
    .description {
      margin-bottom: 16px;
      color: var(--ion-color-medium);
    }
    
    .donor-info {
      display: flex;
      align-items: center;
      margin-top: 12px;
      margin-bottom: 12px;
    }
    
    .donor-avatar {
      width: 40px;
      height: 40px;
      margin-right: 12px;
    }
    
    .donor-details {
      display: flex;
      flex-direction: column;
    }
    
    .donor-name {
      font-weight: 500;
    }
    
    .listing-time {
      font-size: 12px;
      color: var(--ion-color-medium);
    }
    
    .action-buttons {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }
  `]
})
export class FoodCardComponent {
  @Input() listing!: FoodListing;
  @Input() showClaimButton = true;
  @Input() userLocation?: { latitude: number, longitude: number };
  
  @Output() claim = new EventEmitter<string>();
  
  onClaimClick(): void {
    this.claim.emit(this.listing.id);
  }
}
