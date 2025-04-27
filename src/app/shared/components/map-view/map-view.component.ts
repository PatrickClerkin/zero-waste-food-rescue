// src/app/shared/components/map-view/map-view.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FoodListing } from '../../../core/models/food-listing.model';
import { environment } from '../../../../environments/environment';

// Define the Google Maps types we need
declare global {
  interface Window {
    initMap: () => void;
  }
}

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="map-container">
      <div #mapElement id="map"></div>
      
      <ion-button 
        class="center-button" 
        color="primary" 
        fill="solid" 
        (click)="centerOnUser()"
      >
        <ion-icon name="locate"></ion-icon>
      </ion-button>
    </div>
  `,
  styles: [`
    .map-container {
      position: relative;
      height: 100%;
      width: 100%;
    }
    
    #map {
      height: 100%;
      width: 100%;
    }
    
    .center-button {
      position: absolute;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }
  `]
})
export class MapViewComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() listings: FoodListing[] = [];
  @Input() userLocation?: { latitude: number, longitude: number };
  @Input() height = '400px';
  
  @Output() markerClick = new EventEmitter<FoodListing>();
  
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  private userMarker: google.maps.Marker | null = null;
  private loaded = false;
  private apiLoaded = false;
  
  ngOnInit(): void {
    this.loadGoogleMapsScript();
  }
  
  ngAfterViewInit(): void {
    // If API is already loaded, initialize map
    if (this.apiLoaded) {
      this.initializeMap();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['listings'] || changes['userLocation']) && this.map) {
      this.updateMarkers();
    }
  }
  
  private loadGoogleMapsScript(): void {
    if (window.google && window.google.maps) {
      this.apiLoaded = true;
      this.initializeMap();
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    window.initMap = () => {
      this.apiLoaded = true;
      this.initializeMap();
    };
    
    document.head.appendChild(script);
  }
  
  private initializeMap(): void {
    if (this.loaded || !this.apiLoaded) return;
    
    const mapOptions: google.maps.MapOptions = {
      zoom: 13,
      center: this.userLocation ? 
        new google.maps.LatLng(this.userLocation.latitude, this.userLocation.longitude) : 
        new google.maps.LatLng(37.7749, -122.4194), // Default to San Francisco
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    };
    
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    this.map = new google.maps.Map(mapElement, mapOptions);
    this.loaded = true;
    
    // Add markers
    this.updateMarkers();
  }
  
  private updateMarkers(): void {
    if (!this.map) return;
    
    // Clear existing markers
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    
    // Add user marker if location is available
    if (this.userLocation) {
      if (this.userMarker) {
        this.userMarker.setMap(null);
      }
      
      this.userMarker = new google.maps.Marker({
        position: new google.maps.LatLng(this.userLocation.latitude, this.userLocation.longitude),
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: 'white'
        },
        title: 'Your Location'
      });
    }
    
    // Add listing markers
    this.listings.forEach(listing => {
      if (listing.latitude && listing.longitude) {
        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(listing.latitude, listing.longitude),
          map: this.map!,
          title: listing.title,
          animation: google.maps.Animation.DROP
        });
        
        // Info window
        const infoContent = `
          <div class="info-window">
            <h3>${listing.title}</h3>
            <p>${listing.category} - ${listing.quantity} ${listing.unit}</p>
            <p>Posted by ${listing.donorName}</p>
          </div>
        `;
        
        const infoWindow = new google.maps.InfoWindow({
          content: infoContent
        });
        
        marker.addListener('click', () => {
          infoWindow.open(this.map!, marker);
          this.markerClick.emit(listing);
        });
        
        this.markers.push(marker);
      }
    });
    
    // Adjust bounds to show all markers
    if (this.markers.length > 0 || this.userMarker) {
      const bounds = new google.maps.LatLngBounds();
      
      if (this.userMarker) {
        bounds.extend(this.userMarker.getPosition()!);
      }
      
      this.markers.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      
      this.map.fitBounds(bounds);
      
      // Don't zoom in too far
      if (this.map.getZoom()! > 15) {
        this.map.setZoom(15);
      }
    }
  }
  
  centerOnUser(): void {
    if (!this.map || !this.userLocation) return;
    
    this.map.setCenter(new google.maps.LatLng(
      this.userLocation.latitude, 
      this.userLocation.longitude
    ));
    this.map.setZoom(15);
  }
}