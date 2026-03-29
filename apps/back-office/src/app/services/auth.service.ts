import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface DecodedToken {
  role?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly authUrl = `${environment.apiUrl}/auth/login`;
  private http = inject(HttpClient);
  
  currentUserRole = signal<string | null>(null);
  isAuthenticated = computed(() => !!this.currentUserRole());

  constructor() {
    this.loadToken();
  }

  login(credentials: any): Observable<{token: string}> {
    return this.http.post<{token: string}>(this.authUrl, credentials).pipe(
      tap(response => {
        this.setToken(response.token);
      })
    );
  }

  setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.loadToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserRole.set(null);
  }

  isAdmin(): boolean {
    const role = this.currentUserRole();
    return role === 'Admin' || role === 'ADMIN';
  }

  private loadToken() {
    const token = this.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        // Try multiple common role claim keys
        const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
                     decoded['role'] || 
                     decoded['roles'] ||
                     null;
        
        if (role) {
          this.currentUserRole.set(Array.isArray(role) ? role[0] : role);
        } else {
          // If no role but token is valid, at least mark as authenticated with a generic role
          this.currentUserRole.set('User');
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        this.logout();
      }
    }
  }
}
