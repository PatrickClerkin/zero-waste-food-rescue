// src/app/shared/pipes/time-ago.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '';
    
    // Convert to date object if it's not already
    const date = value instanceof Date ? value : new Date(value);
    
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffMonth / 12);
    
    if (diffSec < 60) {
      return diffSec <= 5 ? 'just now' : `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    } else if (diffHour < 24) {
      return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
    } else if (diffDay < 30) {
      return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
    } else if (diffMonth < 12) {
      return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
    } else {
      return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
    }
  }
}