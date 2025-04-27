// src/app/features/auth/forgot-password/forgot-password.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/auth/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Reset Password</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="forgot-password-container">
        <h2>Reset Your Password</h2>
        <p class="subtitle">Enter your email address and we'll send you a link to reset your password</p>
        
        <ng-container *ngIf="!resetEmailSent; else successMessage">
          <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="reset-form">
            <ion-item>
              <ion-label position="floating">Email</ion-label>
              <ion-input type="email" formControlName="email"></ion-input>
            </ion-item>
            <div class="error-message" *ngIf="email?.invalid && (email?.dirty || email?.touched)">
              <div *ngIf="email?.errors?.['required']">Email is required</div>
              <div *ngIf="email?.errors?.['email']">Please enter a valid email</div>
            </div>
            
            <ion-button expand="block" type="submit" [disabled]="resetForm.invalid || isLoading">
              <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
              <span *ngIf="!isLoading">Send Reset Link</span>
            </ion-button>
            
            <div class="error-message auth-error" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>
          </form>
        </ng-container>
        
        <ng-template #successMessage>
          <div class="success-message">
            <ion-icon name="checkmark-circle" color="success"></ion-icon>
            <h3>Email Sent</h3>
            <p>We've sent a password reset link to {{ resetForm.get('email')?.value }}</p>
            <p>Please check your email and follow the instructions to reset your password.</p>
            
            <ion-button expand="block" [routerLink]="['/auth/login']" class="back-to-login">
              Back to Login
            </ion-button>
          </div>
        </ng-template>
        
        <div class="login-prompt" *ngIf="!resetEmailSent">
          <p>Remember your password? <a [routerLink]="['/auth/login']">Log In</a></p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .forgot-password-container {
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
    
    .reset-form {
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
    
    .success-message {
      text-align: center;
      padding: 20px;
    }
    
    .success-message ion-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    
    .success-message h3 {
      font-size: 24px;
      margin-bottom: 16px;
      color: var(--ion-color-success);
    }
    
    .back-to-login {
      margin-top: 32px;
    }
  `]
})
export class ForgotPasswordComponent {
  resetForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  resetEmailSent = false;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
  
  get email() { return this.resetForm.get('email'); }
  
  async onSubmit() {
    if (this.resetForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      await this.authService.resetPassword(this.resetForm.value.email);
      this.resetEmailSent = true;
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/invalid-email':
        return 'Invalid email format';
      default:
        return error.message || 'An unexpected error occurred. Please try again';
    }
  }
}