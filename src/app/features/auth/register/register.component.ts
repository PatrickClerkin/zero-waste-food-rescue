// src/app/features/auth/register/register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/auth/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Create Account</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="register-container">
        <h2>Join Zero Waste Food Rescue</h2>
        <p class="subtitle">Sign up to start sharing or claiming surplus food</p>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
          <ion-item>
            <ion-label position="floating">Full Name</ion-label>
            <ion-input type="text" formControlName="displayName"></ion-input>
          </ion-item>
          <div class="error-message" *ngIf="displayName?.invalid && (displayName?.dirty || displayName?.touched)">
            <div *ngIf="displayName?.errors?.['required']">Name is required</div>
          </div>
          
          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input type="email" formControlName="email"></ion-input>
          </ion-item>
          <div class="error-message" *ngIf="email?.invalid && (email?.dirty || email?.touched)">
            <div *ngIf="email?.errors?.['required']">Email is required</div>
            <div *ngIf="email?.errors?.['email']">Please enter a valid email</div>
          </div>
          
          <ion-item>
            <ion-label position="floating">Password</ion-label>
            <ion-input type="password" formControlName="password"></ion-input>
          </ion-item>
          <div class="error-message" *ngIf="password?.invalid && (password?.dirty || password?.touched)">
            <div *ngIf="password?.errors?.['required']">Password is required</div>
            <div *ngIf="password?.errors?.['minlength']">Password must be at least 6 characters</div>
          </div>
          
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
          
          <ion-button expand="block" type="submit" [disabled]="registerForm.invalid || isLoading">
            <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
            <span *ngIf="!isLoading">Create Account</span>
          </ion-button>
          
          <div class="error-message auth-error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
        </form>
        
        <div class="login-prompt">
          <p>Already have an account? <a [routerLink]="['/auth/login']">Log In</a></p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .register-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h2 {
      font-size: 24px;
      color: var(--ion-color-primary);
      margin-bottom: 8px;
      text-align: center;
    }
    
    .subtitle {
      text-align: center;
      margin-bottom: 30px;
      color: var(--ion-color-medium);
    }
    
    .register-form {
      margin-bottom: 20px;
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
    
    .auth-error {
      text-align: center;
      margin-top: 16px;
      font-size: 14px;
    }
    
    ion-button {
      margin-top: 16px;
    }
    
    .login-prompt {
      text-align: center;
      margin-top: 30px;
      border-top: 1px solid var(--ion-color-light);
      padding-top: 20px;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      displayName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      userType: ['recipient', Validators.required]
    });
  }
  
  get displayName() { return this.registerForm.get('displayName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get userType() { return this.registerForm.get('userType'); }
  
  async onSubmit() {
    if (this.registerForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const { email, password, displayName, userType } = this.registerForm.value;
      await this.authService.register(email, password, displayName, userType);
      this.router.navigate(['/food-listings']);
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already in use. Please try another or log in';
      case 'auth/invalid-email':
        return 'Invalid email format';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password';
      default:
        return error.message || 'An unexpected error occurred. Please try again';
    }
  }
}
