// src/app/shared/components/category-filter/category-filter.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FoodCategory } from '../../../core/models/food-listing.model';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="category-filter">
      <ion-chip 
        [color]="selectedCategory === null ? 'primary' : 'medium'"
        (click)="selectCategory(null)"
      >
        <ion-label>All</ion-label>
      </ion-chip>
      
      <ion-chip 
        *ngFor="let category of categories"
        [color]="selectedCategory === category ? 'primary' : 'medium'"
        (click)="selectCategory(category)"
      >
        <ion-icon [name]="getCategoryIcon(category)"></ion-icon>
        <ion-label>{{ category | titlecase }}</ion-label>
      </ion-chip>
    </div>
  `,
  styles: [`
    .category-filter {
      display: flex;
      overflow-x: auto;
      padding: 8px 0;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
    }
    
    .category-filter::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
    
    ion-chip {
      margin: 0 4px;
    }
  `]
})
export class CategoryFilterComponent {
  @Input() selectedCategory: FoodCategory | null = null;
  @Output() categorySelected = new EventEmitter<FoodCategory | null>();
  
  categories: FoodCategory[] = [
    'produce',
    'bakery',
    'dairy',
    'meat',
    'prepared',
    'pantry',
    'beverages',
    'other'
  ];
  
  selectCategory(category: FoodCategory | null): void {
    this.selectedCategory = category;
    this.categorySelected.emit(category);
  }
  
  getCategoryIcon(category: FoodCategory): string {
    switch (category) {
      case 'produce': return 'leaf';
      case 'bakery': return 'pizza';
      case 'dairy': return 'water';
      case 'meat': return 'restaurant';
      case 'prepared': return 'fast-food';
      case 'pantry': return 'archive';
      case 'beverages': return 'beer';
      case 'other': return 'apps';
      default: return 'help-circle';
    }
  }
}