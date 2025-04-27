// src/app/shared/pipes/distance.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'distance',
  standalone: true
})
export class DistancePipe implements PipeTransform {
  transform(listing: any, userLat?: number, userLng?: number): string {
    if (!userLat || !userLng || !listing.latitude || !listing.longitude) {
      return '';
    }
    
    const distance = this.calculateDistance(
      userLat, userLng,
      listing.latitude, listing.longitude
    );
    
    if (distance < 1) {
      // Convert to meters and round
      const meters = Math.round(distance * 1000);
      return `${meters} m away`;
    } else if (distance < 10) {
      // Show with one decimal for short distances
      return `${distance.toFixed(1)} km away`;
    } else {
      // Round to whole number for longer distances
      return `${Math.round(distance)} km away`;
    }
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}