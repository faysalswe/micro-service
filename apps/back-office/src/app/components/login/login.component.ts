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
    <div class="flex items-center justify-center min-h-screen px-4 animate-in fade-in duration-700" style="background: #0f172a;">
      <p-card styleClass="w-full max-w-md shadow-2xl border-none rounded-3xl overflow-hidden">
        <div style="background: var(--primary-color); padding: 3rem 2rem; text-align: center;">
          <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; backdrop-filter: blur(8px);">
            <i class="pi pi-shield" style="color: white; font-size: 2rem;"></i>
          </div>
          <h2 style="margin: 0; color: white; font-size: 1.75rem; font-weight: 800; letter-spacing: -0.025em;">Secure Access</h2>
          <p style="margin: 0.5rem 0 0 0; color: rgba(255,255,255,0.8); font-weight: 500;">InventoryCore Management</p>
        </div>

        <div class="p-8">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
              <label for="username" class="text-sm font-bold text-gray-500 uppercase tracking-widest">Username</label>
              <input pInputText id="username" formControlName="username" placeholder="Enter your username" class="w-full py-4 px-4 rounded-xl border-gray-200" />
            </div>

            <div class="flex flex-col gap-2">
              <label for="password" class="text-sm font-bold text-gray-500 uppercase tracking-widest">Password</label>
              <p-password 
                  id="password" 
                  formControlName="password" 
                  [feedback]="false" 
                  [toggleMask]="true" 
                  styleClass="w-full" 
                  inputStyleClass="w-full py-4 px-4 rounded-xl border-gray-200"
                  placeholder="••••••••"
              ></p-password>
            </div>

            <p-message *ngIf="errorMessage" severity="error" [text]="errorMessage" styleClass="w-full mt-2"></p-message>

            <p-button 
              label="Authenticate" 
              type="submit" 
              [loading]="loading" 
              styleClass="w-full py-5 text-lg font-black bg-indigo-600 border-none hover:bg-indigo-700 transition-all shadow-xl hover:translate-y-[-2px]"
              [disabled]="loginForm.invalid"
            ></p-button>
          </form>

          <div class="mt-10 pt-6 border-t border-gray-100 text-center">
            <p class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black italic">InventoryCore OS v1.0.0</p>
          </div>
        </div>
      </p-card>
    </div>
  `
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
