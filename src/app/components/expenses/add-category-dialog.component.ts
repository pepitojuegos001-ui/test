import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

export interface DialogData {
  existingCategories: string[];
}

@Component({
  selector: 'app-add-category-dialog',
  template: `
    <h2 mat-dialog-title>Add Custom Category</h2>
    
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width: 100%;">
        <mat-label>Category Name</mat-label>
        <input matInput [formControl]="categoryControl" placeholder="Enter category name">
        <mat-error *ngIf="categoryControl.hasError('required')">
          Category name is required
        </mat-error>
        <mat-error *ngIf="categoryControl.hasError('duplicate')">
          Category already exists
        </mat-error>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              [disabled]="categoryControl.invalid" 
              (click)="onSave()">
        <mat-icon>add</mat-icon>
        Add Category
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      padding: 20px 0;
    }
    
    mat-dialog-actions button {
      margin-left: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class AddCategoryDialogComponent {
  categoryControl = new FormControl('', {
    validators: [Validators.required, this.duplicateValidator.bind(this)]
  });

  constructor(
    public dialogRef: MatDialogRef<AddCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  private duplicateValidator(control: any) {
    const value = control.value?.trim();
    if (value && this.data.existingCategories.includes(value)) {
      return { duplicate: true };
    }
    return null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.categoryControl.valid && this.categoryControl.value) {
      this.dialogRef.close(this.categoryControl.value.trim());
    }
  }
}
