// src/app/features/profile/profile-edit/profile-edit.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { User } from '../../../core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { LocationService } from '../../../core/services/location.service';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Edit Profile</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
        <div class="avatar-container">
          <ion-avatar class="profile-avatar">
            <img [src]="profileImageUrl || 'assets/images/avatar-placeholder.jpg'" alt="Profile">
          </ion-avatar>
          
          <ion-button 
            fill="clear" 
            class="change-photo-button"
            (click)="fileInput.click()"
          >
            <ion-icon name="camera-outline" slot="start"></ion-icon>
            Change Photo
          </ion-button>
          <input 
            #fileInput 
            type="file" 
            accept="image/*" 
            (change)="onFileSelected($event)" 
            style="display: none;"
          >
        </div>
        
        <div class="form-section">
          <h2>Personal Information</h2>
          
          <ion-item>
            <ion-label position="floating">Name *</ion-label>
            <ion-input type="text" formControlName="displayName"></ion-input>
          </ion-item>
          <div class="error-message" *ngIf="displayName?.invalid && (displayName?.dirty || displayName?.touched)">
            <div *ngIf="displayName?.errors?.['required']">Name is required</div>
          </div>
          
          <ion-item>
            <ion-label position="floating">Phone Number</ion-label>
            <ion-input type="tel" formControlName="phoneNumber"></ion-input>
          </ion-item>
          
          <ion-item>
            <ion-label position="floating">Bio</ion-label>
            <ion-textarea rows="4" formControlName="bio"></ion-textarea>
          </ion-item>
        </div>
        
        <div class="form-section">
          <h2>Address</h2>
          
          <ion-item>
            <ion-label position="floating">Address</ion-label>
            <ion-input type="text" formControlName="address"></ion-input>
          </ion-item>
          
          <ion-button expand="block" fill="outline" (click)="useCurrentLocation()" class="location-button">
            <ion-icon name="locate-outline" slot="start"></ion-icon>
            Use My Current Location
          </ion-button>
        </div>
        
        <div class="form-section">
          <h2>Account Type</h2>
          
          <ion-item>
            <ion-label>I want to</ion-label>
            <ion-select formControlName="userType">
              <ion-select-option value="donor">Donate Food</ion-select-option>
              <ion-select-option value="recipient">Receive Food</ion-select-option>
              <ion-select-option value="both">Both</ion-select-option>
            </ion-select>
          </ion-item>
          <div class="error-message" *ngIf="userType?.invalid && (userType?.dirty || userType?.touched)">
            <div *ngIf="userType?.errors?.['required']">Please select your user type</div>
          </div>
        </div>
        
        <ion-button 
          expand="block" 
          type="submit" 
          [disabled]="profileForm.invalid || isSubmitting"
          class="submit-button"
        >
          <ion-spinner *ngIf="isSubmitting" name="crescent"></ion-spinner>
          <span *ngIf="!isSubmitting">Save Changes</span>
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: [`
    .avatar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .profile-avatar {
      width: 120px;
      height: 120px;
      margin-bottom: 16px;
      border: 4px solid var(--ion-color-light);
    }
    
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
    
    .location-button {
      margin: 8px 0 16px 0;
    }
    
    .submit-button {
      margin-top: 32px;
      margin-bottom: 32px;
    }
  `]
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  user: User | null = null;
  isSubmitting = false;
  
  profileImageUrl: string | null = null;
  selectedProfileImage: File | null = null;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private locationService: LocationService,
    private storage: Storage,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', Validators.required],
      phoneNumber: [''],
      bio: [''],
      address: [''],
      latitude: [0],
      longitude: [0],
      userType: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.profileImageUrl = user.photoURL || null;
        
        this.profileForm.patchValue({
          displayName: user.displayName,
          phoneNumber: user.phoneNumber || '',
          bio: user.bio || '',
          address: user.address || '',
          latitude: user.latitude || 0,
          longitude: user.longitude || 0,
          userType: user.userType
        });
      }
    });
  }
  
  get displayName() { return this.profileForm.get('displayName'); }
  get userType() { return this.profileForm.get('userType'); }
  
  useCurrentLocation(): void {
    this.locationService.getCurrentLocation().subscribe({
      next: (position) => {
        this.locationService.reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        ).subscribe(address => {
          if (address) {
            this.profileForm.patchValue({
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
    
    if (input.files && input.files.length > 0) {
      this.selectedProfileImage = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImageUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedProfileImage);
    }
  }
  
  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) return;
    
    this.isSubmitting = true;
    
    try {
      let photoURL = this.user?.photoURL;
      
      // If a new profile image was selected, upload it
      if (this.selectedProfileImage) {
        photoURL = await this.uploadProfileImage(this.selectedProfileImage);
      }
      
      // Check if address needs to be geocoded
      if (
        this.profileForm.value.address && 
        this.profileForm.value.address !== this.user?.address &&
        (!this.profileForm.value.latitude || !this.profileForm.value.longitude)
      ) {
        const location = await this.locationService.geocodeAddress(this.profileForm.value.address).toPromise();
        
        if (location) {
          this.profileForm.patchValue({
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address // Use formatted address
          });
        }
      }
      
      // Update user profile
      const userData: Partial<User> = {
        displayName: this.profileForm.value.displayName,
        phoneNumber: this.profileForm.value.phoneNumber || null,
        bio: this.profileForm.value.bio || null,
        address: this.profileForm.value.address || null,
        latitude: this.profileForm.value.latitude || null,
        longitude: this.profileForm.value.longitude || null,
        userType: this.profileForm.value.userType,
        photoURL
      };
      
      await this.authService.updateUserProfile(userData);
      this.router.navigate(['/profile']);
    } catch (error) {
      console.error('Error updating profile:', error);
      
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
  
  private async uploadProfileImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.user) {
        reject(new Error('User not authenticated'));
        return;
      }
      
      const timestamp = new Date().getTime();
      const path = `profiles/${this.user.uid}_${timestamp}`;
      const storageRef = ref(this.storage, path);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Handle progress if needed
        },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }
}