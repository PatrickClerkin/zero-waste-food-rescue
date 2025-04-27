// src/app/core/services/location.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Location } from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
  private readonly geocodingApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  
  constructor() {}

  // Get current location using browser Geolocation API
  getCurrentLocation(): Observable<GeolocationPosition> {
    return new Observable<GeolocationPosition>(observer => {
      if (!navigator.geolocation) {
        observer.error('Geolocation is not supported by your browser');
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            observer.next(position);
            observer.complete();
          },
          (error) => {
            observer.error(error);
          }
        );
      }
    });
  }

  // Convert address to coordinates using Google Geocoding API
  geocodeAddress(address: string): Observable<Location | null> {
    const params = {
      address: address,
      key: environment.googleMapsApiKey
    };

    return this.http.get(this.geocodingApiUrl, { params }).pipe(
      map((response: any) => {
        if (response.status === 'OK' && response.results && response.results.length > 0) {
          const result = response.results[0];
          const location = result.geometry.location;
          
          return {
            address: result.formatted_address,
            latitude: location.lat,
            longitude: location.lng
          };
        }
        return null;
      }),
      catchError(error => {
        console.error('Geocoding error:', error);
        return of(null);
      })
    );
  }

  // Convert coordinates to address (reverse geocoding)
  reverseGeocode(lat: number, lng: number): Observable<string | null> {
    const params = {
      latlng: `${lat},${lng}`,
      key: environment.googleMapsApiKey
    };

    return this.http.get(this.geocodingApiUrl, { params }).pipe(
      map((response: any) => {
        if (response.status === 'OK' && response.results && response.results.length > 0) {
          return response.results[0].formatted_address;
        }
        return null;
      }),
      catchError(error => {
        console.error('Reverse geocoding error:', error);
        return of(null);
      })
    );
  }

  // Calculate distance between two points
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}