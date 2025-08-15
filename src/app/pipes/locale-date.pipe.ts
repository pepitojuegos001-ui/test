import { Pipe, PipeTransform } from '@angular/core';
import { LocaleDateService } from '../services/locale-date.service';

@Pipe({
  name: 'localeDate',
  pure: false // Make it impure to react to locale changes
})
export class LocaleDatePipe implements PipeTransform {
  
  constructor(private localeDateService: LocaleDateService) {}

  transform(
    value: Date | string | number | null | undefined, 
    format: 'short' | 'medium' | 'long' | 'full' | string = 'medium'
  ): string {
    if (!value) return '';
    
    return this.localeDateService.formatDate(value, format);
  }
}
