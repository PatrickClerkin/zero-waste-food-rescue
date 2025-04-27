// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, IonicModule, RouterLink],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
      
      <ion-tabs *ngIf="showTabs">
        <ion-tab-bar slot="bottom">
          <ion-tab-button tab="food-listings" [routerLink]="['/food-listings']">
            <ion-icon name="basket-outline"></ion-icon>
            <ion-label>Food</ion-label>
          </ion-tab-button>
          
          <ion-tab-button tab="map" [routerLink]="['/map']">
            <ion-icon name="map-outline"></ion-icon>
            <ion-label>Map</ion-label>
          </ion-tab-button>
          
          <ion-tab-button tab="messages" [routerLink]="['/messages']">
            <ion-icon name="chatbubble-outline"></ion-icon>
            <ion-label>Messages</ion-label>
          </ion-tab-button>
          
          <ion-tab-button tab="notifications" [routerLink]="['/notifications']">
            <ion-icon name="notifications-outline"></ion-icon>
            <ion-label>Alerts</ion-label>
            <ion-badge *ngIf="unreadNotificationCount > 0" color="danger">{{ unreadNotificationCount }}</ion-badge>
          </ion-tab-button>
          
          <ion-tab-button tab="profile" [routerLink]="['/profile']">
            <ion-icon name="person-outline"></ion-icon>
            <ion-label>Profile</ion-label>
          </ion-tab-button>
        </ion-tab-bar>
      </ion-tabs>
    </ion-app>
  `,
  styles: [`
    .ios ion-tab-button {
      --padding-top: 8px;
      --padding-bottom: 8px;
    }
  `]
})
export class AppComponent implements OnInit {
  showTabs = false;
  unreadNotificationCount = 0;
  
  private authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    // Debug Firebase initialization
    try {
      const auth = getAuth();
      console.log('Firebase Auth initialized:', auth);
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }

    // Hide tabs on auth pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.showTabs = !this.authRoutes.some(route => url.startsWith(route));
    });
    
    // Get unread notification count
    this.authService.currentUser$.subscribe({
      next: user => {
        if (user) {
          this.subscribeToNotifications();
        }
      },
      error: err => {
        console.error('Error in currentUser$ subscription:', err);
      }
    });
  }
  
  private subscribeToNotifications(): void {
    this.notificationService.getUserNotifications().subscribe({
      next: notifications => {
        this.unreadNotificationCount = notifications.filter(n => !n.isRead).length;
      },
      error: err => {
        console.error('Error getting notifications:', err);
      }
    });
  }
}