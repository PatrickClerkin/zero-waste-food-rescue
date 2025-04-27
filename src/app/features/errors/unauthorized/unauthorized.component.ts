// src/app/features/errors/unauthorized/unauthorized.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Unauthorized</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="error-container">
        <ion-icon name="lock-closed-outline" class="error-icon"></ion-icon>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <ion-button routerLink="/food-listings">Back to Home</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      height: 70vh;
    }
    
    .error-icon {
      font-size: 80px;
      color: var(--ion-color-danger);
      margin-bottom: 24px;
    }
    
    h2 {
      font-size: 24px;
      margin-bottom: 16px;
    }
    
    p {
      margin-bottom: 32px;
      color: var(--ion-color-medium);
    }
  `]
})
export class UnauthorizedComponent {}