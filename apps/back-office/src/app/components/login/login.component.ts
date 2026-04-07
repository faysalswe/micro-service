import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessageModule
  ],
  template: `
    <div class="flex items-center justify-center min-h-screen px-4 animate-in" style="background: var(--slate-50);">
      <div class="admin-card w-full max-w-md">
        <div class="text-center" style="margin-bottom: var(--space-8);">
          <div class="brand-icon-container">
            <i class="pi pi-shield"></i>
          </div>
          <h1 class="page-title">Identity Manager</h1>
          <p style="color: var(--slate-500); font-weight: 500;">Secure portal for InventoryCore administrators.</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
          <div class="flex flex-col gap-2">
            <label for="username" class="section-title" style="margin-bottom: 0;">Username</label>
            <input pInputText id="username" formControlName="username" placeholder="admin" class="w-full" />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="section-title" style="margin-bottom: 0;">Password</label>
            <p-password 
                id="password" 
                formControlName="password" 
                [feedback]="false" 
                [toggleMask]="true" 
                styleClass="w-full" 
                inputStyleClass="w-full"
                placeholder="••••••••"
            ></p-password>
          </div>

          <p-message *ngIf="errorMessage" severity="error" [text]="errorMessage" styleClass="w-full"></p-message>

          <p-button 
            label="Sign In" 
            type="submit" 
            [loading]="loading" 
            styleClass="w-full p-button-lg"
            [disabled]="loginForm.invalid"
            severity="primary"
          ></p-button>
        </form>

        <div class="mt-10 pt-6 border-t border-gray-100 text-center">
          <p style="font-size: var(--text-xs); color: var(--slate-400); font-weight: 600;">InventoryCore System v1.0.0</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .brand-icon-container {
      width: 48px;
      height: 48px;
      background: var(--brand-50);
      color: var(--brand-500);
      border-radius: var(--radius-main);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-4) auto;
      font-size: 1.5rem;
    }
    
    :host ::ng-deep .p-inputtext {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-main);
    }

    :host ::ng-deep .p-button {
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-main);
      font-weight: 700;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Redirect immediately if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.status === 401 
          ? 'Invalid credentials. Access denied.' 
          : 'Identity service unavailable. Please retry later.';
        this.loading = false;
      }
    });
  }
}
