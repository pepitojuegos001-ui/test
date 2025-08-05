import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { LayoutModule } from '@angular/cdk/layout';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatOptionModule } from '@angular/material/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Components
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { IncomeComponent } from './components/income/income.component';
import { ExpensesComponent } from './components/expenses/expenses.component';
import { ReportsComponent } from './components/reports/reports.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AddCategoryDialogComponent } from './components/expenses/add-category-dialog.component';

// Shared Components
import { SummaryCardComponent } from './shared/components/summary-card/summary-card.component';

// Services
import { FinancialDataService } from './services/financial-data.service';
import { ExportService } from './services/export.service';
import { ChartService } from './services/chart.service';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    IncomeComponent,
    ExpensesComponent,
    ReportsComponent,
    SidebarComponent,
    SummaryCardComponent,
    AddCategoryDialogComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    LayoutModule,
    AppRoutingModule,

    // Angular Material
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatOptionModule
  ],
  providers: [
    FinancialDataService,
    ExportService,
    ChartService,
    DatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
