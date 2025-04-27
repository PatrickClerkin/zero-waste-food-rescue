// src/app/shared/directives/swipe.directive.ts
import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appSwipe]',
  standalone: true
})
export class SwipeDirective {
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();
  @Output() swipeUp = new EventEmitter<void>();
  @Output() swipeDown = new EventEmitter<void>();
  
  @Input() swipeThreshold = 50; // Minimum distance required for a swipe
  
  private startX: number = 0;
  private startY: number = 0;
  
  constructor(private el: ElementRef) {}
  
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
  }
  
  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;
    
    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    
    // Determine if the swipe was horizontal or vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > this.swipeThreshold) {
        if (deltaX > 0) {
          this.swipeRight.emit();
        } else {
          this.swipeLeft.emit();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > this.swipeThreshold) {
        if (deltaY > 0) {
          this.swipeDown.emit();
        } else {
          this.swipeUp.emit();
        }
      }
    }
  }
  
  // Support for mouse events (for testing on desktop)
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.startX = event.clientX;
    this.startY = event.clientY;
  }
  
  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    
    // Determine if the swipe was horizontal or vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > this.swipeThreshold) {
        if (deltaX > 0) {
          this.swipeRight.emit();
        } else {
          this.swipeLeft.emit();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > this.swipeThreshold) {
        if (deltaY > 0) {
          this.swipeDown.emit();
        } else {
          this.swipeUp.emit();
        }
      }
    }
  }
}