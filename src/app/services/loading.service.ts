import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingMessageSubject = new BehaviorSubject<string>('');
  
  public isLoading$: Observable<boolean> = this.loadingSubject.asObservable();
  public loadingMessage$: Observable<string> = this.loadingMessageSubject.asObservable();

  constructor() {}

  /**
   * Show the global loading overlay
   * @param message Optional loading message to display
   */
  show(message: string = ''): void {
    this.loadingMessageSubject.next(message);
    this.loadingSubject.next(true);
  }

  /**
   * Hide the global loading overlay
   */
  hide(): void {
    this.loadingSubject.next(false);
    this.loadingMessageSubject.next('');
  }

  /**
   * Show loading overlay with a simulated 3-second delay
   * @param message Optional loading message to display
   * @returns Observable that completes when loading is finished
   */
  showWithDelay(message: string = ''): Observable<any> {
    this.show(message);
    
    return timer(3000).pipe(
      finalize(() => this.hide())
    );
  }

  /**
   * Execute an operation with loading overlay
   * @param operation Function that returns an Observable
   * @param message Optional loading message to display
   * @returns Observable of the operation result
   */
  withLoading<T>(operation: () => Observable<T>, message: string = ''): Observable<T> {
    this.show(message);
    
    return operation().pipe(
      finalize(() => this.hide())
    );
  }

  /**
   * Execute an operation with loading overlay and simulated delay
   * @param operation Function to execute after delay
   * @param message Optional loading message to display
   * @returns Observable that completes when operation is finished
   */
  withDelayedLoading(operation: () => void, message: string = ''): Observable<any> {
    this.show(message);
    
    return timer(3000).pipe(
      finalize(() => {
        operation();
        this.hide();
      })
    );
  }

  /**
   * Get current loading state
   * @returns Current loading state
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Get current loading message
   * @returns Current loading message
   */
  get loadingMessage(): string {
    return this.loadingMessageSubject.value;
  }
}
