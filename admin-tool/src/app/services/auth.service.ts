import { Injectable, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  role: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  currentUserRole = signal<string | null>(null);

  constructor() {
    this.loadToken();
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
        const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role;
        this.currentUserRole.set(role);
      } catch {
        this.logout();
      }
    }
  }
}
