// src/app/features/auth/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="login-container">
        <div class="logo-container">
          <img src="assets/images/logo.png" alt="Zero Waste Food Rescue" class="logo">
          <h1>Zero Waste Food Rescue</h1>
          <p>Connect, share, and reduce food waste in your community</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
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
          </div>
          
          <ion-button expand="block" type="submit" [disabled]="loginForm.invalid || isLoading">
            <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
            <span *ngIf="!isLoading">Log In</span>
          </ion-button>
          
          <div class="forgot-password">
            <a [routerLink]="['/auth/forgot-password']">Forgot Password?</a>
          </div>
          
          <div class="error-message auth-error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
        </form>
        
        <div class="register-prompt">
          <p>Don't have an account? <a [routerLink]="['/auth/register']">Sign Up</a></p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .logo-container {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .logo {
      width: 120px;
      height: auto;
      margin-bottom: 16px;
    }
    
    h1 {
      font-size: 24px;
      color: var(--ion-color-primary);
      margin-bottom: 8px;
    }
    
    .login-form {
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
    
    .forgot-password {
      text-align: center;
      margin-top: 16px;
    }
    
    .register-prompt {
      text-align: center;
      margin-top: 30px;
      border-top: 1px solid var(--ion-color-light);
      padding-top: 20px;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    
    // Get return URL from route parameters or default to home
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/food-listings';
  }
  
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  
  async onSubmit() {
    if (this.loginForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const { email, password } = this.loginForm.value;
      await this.authService.login(email, password);
      this.router.navigateByUrl(this.returnUrl);
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }
  
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No user found with this email address';
      case 'auth/wrong-password':
        return 'Invalid password';
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later';
      default:
        return error.message || 'An unexpected error occurred. Please try again';
    }
  }
}