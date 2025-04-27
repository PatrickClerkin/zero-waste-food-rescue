// src/app/features/food-listings/listing-create/listing-create.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FoodListingService } from '../../../core/services/food-listing.service';
import { LocationService } from '../../../core/services/location.service';
import { FoodCategory } from '../../../core/models/food-listing.model';

@Component({
  selector: 'app-listing-create',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/food-listings"></ion-back-button>
        </ion-buttons>
        <ion-title>Create Listing</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <form [formGroup]="listingForm" (ngSubmit)="onSubmit()">
        <div class="form-section">
          <h2>Food Details</h2>
          
          <ion-item>
            <ion-label position="floating">Title *</ion-label>
            <ion-input type="text" formControlName="title"></ion-input>
          </ion-item>
          <div class="error-message" *ngIf="title?.invalid && (title?.dirty || title?.touched)">
            <div *ngIf="title?.errors?.['required']">Title is required</div>
          </div>
          
          <ion-item>
            <ion-label position="floating">Description *</ion-label>
            <ion-textarea rows="4" formControlName="description"></ion-textarea>
          </ion-item>
          <div class="error-message" *ngIf="description?.invalid && (description?.dirty || description?.touched)">
            <div *ngIf="description?.errors?.['required']">Description is required</div>
          </div>
          
          <ion-item>
            <ion-label>Category *</ion-label>
            <ion-select formControlName="category">
              <ion-select-option value="produce">Produce</ion-select-option>
              <ion-select-option value="bakery">Bakery</ion-select-option>
              <ion-select-option value="dairy">Dairy</ion-select-option>
              <ion-select-option value="meat">Meat</ion-select-option>
              <ion-select-option value="prepared">Prepared Food</ion-select-option>
              <ion-select-option value="pantry">Pantry Items</ion-select-option>
              <ion-select-option value="beverages">Beverages</ion-select-option>
              <ion-select-option value="other">Other</ion-select-option>
            </ion-select>
          </ion-item>
          <div class="error-message" *ngIf="category?.invalid && (category?.dirty || category?.touched)">
            <div *ngIf="category?.errors?.['required']">Category is required</div>
          </div>
        </div>
        
        <div class="form-section">
          <h2>Quantity & Expiration</h2>
          
          <div class="quantity-container">
            <ion-item class="quantity-input">
              <ion-label position="floating">Quantity *</ion-label>
              <ion-input type="number" formControlName="quantity"></ion-input>
            </ion-item>
            
            <ion-item class="unit-input">
              <ion-label position="floating">Unit *</ion-label>
              <ion-select formControlName="unit">
                <ion-select-option value="items">items</ion-select-option>
                <ion-select-option value="kg">kg</ion-select-option>
                <ion-select-option value="g">g</ion-select-option>
                <ion-select-option value="lb">lb</ion-select-option>
                <ion-select-option value="oz">oz</ion-select-option>
                <ion-select-option value="servings">servings</ion-select-option>
                <ion-select-option value="packages">packages</ion-select-option>
                <ion-select-option value="liters">liters</ion-select-option>
              </ion-select>
            </ion-item>
          </div>
          <div class="error-message" *ngIf="quantity?.invalid && (quantity?.dirty || quantity?.touched)">
            <div *ngIf="quantity?.errors?.['required']">Quantity is required</div>
            <div *ngIf="quantity?.errors?.['min']">Quantity must be greater than 0</div>
          </div>
          
          <ion-item>
            <ion-label position="floating">Expiry Date *</ion-label>
            <ion-datetime-button datetime="expiry-date"></ion-datetime-button>
            <ion-modal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime 
                  id="expiry-date" 
                  [min]="today"
                  formControlName="expiryDate"
                  presentation="date"
                ></ion-datetime>
              </ng-template>
            </ion-modal>
          </ion-item>
          <div class="error-message" *ngIf="expiryDate?.invalid && (expiryDate?.dirty || expiryDate?.touched)">
            <div *ngIf="expiryDate?.errors?.['required']">Expiry date is required</div>
          </div>
        </div>
        
        <div class="form-section">
          <h2>Location</h2>
          
          <ion-item>
            <ion-label position="floating">Pickup Address *</ion-label>
            <ion-input type="text" formControlName="address"></ion-input>
          </ion-item>
          <div class="error-message" *ngIf="address?.invalid && (address?.dirty || address?.touched)">
            <div *ngIf="address?.errors?.['required']">Address is required</div>
          </div>
          
          <ion-button expand="block" fill="outline" (click)="useCurrentLocation()" class="location-button">
            <ion-icon name="locate-outline" slot="start"></ion-icon>
            Use My Current Location
          </ion-button>
          
          <ion-item>
            <ion-label position="floating">Pickup Instructions</ion-label>
            <ion-textarea rows="3" formControlName="pickupInstructions"></ion-textarea>
          </ion-item>
        </div>
        
        <div class="form-section">
          <h2>Additional Information</h2>
          
          <ion-item>
            <ion-label position="floating">Allergens (comma separated)</ion-label>
            <ion-input type="text" formControlName="allergensInfo"></ion-input>
          </ion-item>
          
          <ion-item>
            <ion-label position="floating">Dietary Info (comma separated)</ion-label>
            <ion-input type="text" formControlName="dietaryInfo"></ion-input>
          </ion-item>
        </div>
        
        <div class="form-section">
          <h2>Photos</h2>
          
          <div class="photo-upload-container">
            <div 
              *ngFor="let preview of imagePreviewUrls; let i = index" 
              class="image-preview"
            >
              <img [src]="preview" alt="Preview">
              <ion-button fill="clear" class="remove-button" (click)="removeImage(i)">
                <ion-icon name="close-circle"></ion-icon>
              </ion-button>
            </div>
            
            <ion-button 
              expand="block" 
              fill="outline" 
              class="upload-button"
              (click)="fileInput.click()"
            >
              <ion-icon name="camera-outline" slot="start"></ion-icon>
              Add Photos
            </ion-button>
            <input 
              #fileInput 
              type="file" 
              accept="image/*" 
              multiple 
              (change)="onFileSelected($event)" 
              style="display: none;"
            >
          </div>
        </div>
        
        <ion-button 
          expand="block" 
          type="submit" 
          [disabled]="listingForm.invalid || isSubmitting"
          class="submit-button"
        >
          <ion-spinner *ngIf="isSubmitting" name="crescent"></ion-spinner>
          <span *ngIf="!isSubmitting">Create Listing</span>
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: [`
    .form-section {
      margin-bottom: 24px;
    }
    
    h2 {
      font-size: 18px;
      margin-bottom: 16px;
      color: var(--ion-color-primary);
    }
    
    ion-item {
      margin-bottom: 16px;
      --padding-start: 0;
    }
    
    .error-message {
      color: var(--ion-color-danger);
      font-size: 12px;
      margin: -12px 0 16px 0;
      padding-left: 16px;
    }
    
    .quantity-container {
      display: flex;
      gap: 16px;
    }
    
    .quantity-input {
      flex: 1;
    }
    
    .unit-input {
      flex: 1;
    }
    
    .location-button {
      margin: 8px 0 16px 0;
    }
    
    .photo-upload-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .image-preview {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--ion-color-light);
    }
    
    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .remove-button {
      position: absolute;
      top: 0;
      right: 0;
      --padding-start: 4px;
      --padding-end: 4px;
      --padding-top: 4px;
      --padding-bottom: 4px;
      margin: 0;
    }
    
    .upload-button {
      height: 100px;
      width: 100px;
    }
    
    .submit-button {
      margin-top: 32px;
      margin-bottom: 32px;
    }
  `]
})
export class ListingCreateComponent implements OnInit {
  listingForm: FormGroup;
  isSubmitting = false;
  today = new Date().toISOString();
  selectedFiles: File[] = [];
  imagePreviewUrls: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private foodListingService: FoodListingService,
    private locationService: LocationService,
    private router: Router
  ) {
    this.listingForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['produce', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: ['items', Validators.required],
      expiryDate: [this.today, Validators.required],
      address: ['', Validators.required],
      latitude: [0],
      longitude: [0],
      pickupInstructions: [''],
      allergensInfo: [''],
      dietaryInfo: ['']
    });
  }
  
  ngOnInit(): void {
    // Try to get user's current location when component initializes
    this.locationService.getCurrentLocation().subscribe({
      next: (position) => {
        // Convert coordinates to address
        this.locationService.reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        ).subscribe(address => {
          if (address) {
            this.listingForm.patchValue({
              address,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        });
      },
      error: (error) => {
        console.error('Error getting location:', error);
      }
    });
  }
  
  get title() { return this.listingForm.get('title'); }
  get description() { return this.listingForm.get('description'); }
  get category() { return this.listingForm.get('category'); }
  get quantity() { return this.listingForm.get('quantity'); }
  get unit() { return this.listingForm.get('unit'); }
  get expiryDate() { return this.listingForm.get('expiryDate'); }
  get address() { return this.listingForm.get('address'); }
  
  useCurrentLocation(): void {
    this.locationService.getCurrentLocation().subscribe({
      next: (position) => {
        this.locationService.reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        ).subscribe(address => {
          if (address) {
            this.listingForm.patchValue({
              address,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        });
      },
      error: (error) => {
        console.error('Error getting location:', error);
      }
    });
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files) {
      // Convert FileList to array and add to selectedFiles
      const newFiles = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
      
      // Generate preview URLs
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreviewUrls.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }
  
  removeImage(index: number): void {
    this.imagePreviewUrls.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }
  
  async onSubmit(): Promise<void> {
    if (this.listingForm.invalid) return;
    
    this.isSubmitting = true;
    
    try {
      // If address is provided but not coordinates, geocode the address
      if (this.listingForm.value.address && 
          (!this.listingForm.value.latitude || !this.listingForm.value.longitude)) {
        const location = await this.locationService.geocodeAddress(this.listingForm.value.address).toPromise();
        
        if (location) {
          this.listingForm.patchValue({
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address // Use formatted address
          });
        } else {
          // If geocoding fails, show error
          throw new Error('Could not determine location coordinates. Please check the address or use current location.');
        }
      }
      
      // Process allergens and dietary info
      const allergensInfo = this.listingForm.value.allergensInfo ?
        this.listingForm.value.allergensInfo.split(',').map((s: string) => s.trim()).filter((s: string) => s) :
        [];
      
      const dietaryInfo = this.listingForm.value.dietaryInfo ?
        this.listingForm.value.dietaryInfo.split(',').map((s: string) => s.trim()).filter((s: string) => s) :
        [];
      
      // Create the listing
      const listingData = {
        ...this.listingForm.value,
        allergensInfo,
        dietaryInfo,
        expiryDate: new Date(this.listingForm.value.expiryDate)
      };
      
      const listingId = await this.foodListingService.createListing(listingData, this.selectedFiles);
      this.router.navigate(['/food-listings', listingId]);
    } catch (error) {
      console.error('Error creating listing:', error);
      
      // Show error to user
      const alert = document.createElement('ion-alert');
      alert.header = 'Error';
      alert.message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      alert.buttons = ['OK'];
      
      document.body.appendChild(alert);
      await alert.present();
    } finally {
      this.isSubmitting = false;
    }
  }
}