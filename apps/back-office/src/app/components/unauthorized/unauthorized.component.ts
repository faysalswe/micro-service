import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './unauthorized.component.html',
})
export class UnauthorizedComponent {
  private router = inject(Router);
  protected authService = inject(AuthService);

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
