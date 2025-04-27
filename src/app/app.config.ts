// src/app/app.config.ts
import { ApplicationConfig } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideIonicAngular({
      mode: 'md'
    })
    // No Firebase providers here - we're initializing Firebase separately
  ]
};