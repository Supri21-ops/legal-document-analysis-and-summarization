import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'http://localhost:8000';
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('current_user');
    if (token && user) {
      if (this.isTokenExpired(token)) {
        this.logout();
      } else {
        this.currentUser.set(JSON.parse(user));
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username.trim());
    formData.append('password', credentials.password);

    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/login`, formData).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('current_user', JSON.stringify(response.user));
        this.currentUser.set(response.user);
      })
    );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/api/auth/register`, {
      email: data.email.trim(),
      full_name: data.full_name.trim(),
      password: data.password
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  getToken(): string | null {
    const token = localStorage.getItem('access_token');
    if (token && this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    return token;
  }
}
