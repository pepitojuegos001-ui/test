import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-datepicker-test',
  templateUrl: './datepicker-test.component.html',
  styleUrls: ['./datepicker-test.component.scss']
})
export class DatepickerTestComponent implements OnInit {
  testForm: FormGroup;
  selectedLanguage: string = 'en';
  availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' }
  ];

  constructor(
    private fb: FormBuilder,
    private translationService: TranslationService
  ) {
    this.testForm = this.fb.group({
      singleDate: ['', Validators.required],
      startDate: [''],
      endDate: [''],
      requiredDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.selectedLanguage = this.translationService.getCurrentLanguage();

    // Set sample dates to demonstrate locale formatting
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.testForm.patchValue({
      singleDate: today,
      startDate: startDate,
      endDate: endDate
    });
  }

  onLanguageChange(): void {
    this.translationService.setLanguage(this.selectedLanguage);
  }

  onFormSubmit(): void {
    if (this.testForm.valid) {
      console.log('Form Values:', this.testForm.value);
      alert('Form submitted successfully! Check console for values.');
    } else {
      console.log('Form is invalid:', this.testForm.errors);
      alert('Please fill all required fields.');
    }
  }

  resetForm(): void {
    this.testForm.reset();
  }

  get formData(): string {
    return JSON.stringify(this.testForm.value, null, 2);
  }
}
