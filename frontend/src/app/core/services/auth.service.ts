import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

interface AuthResponse {
  success: boolean;
  data: { user: User; accessToken: string };
  message?: string;
}

interface ProfileResponse {
  success: boolean;
  data: { user: User };
}

interface RefreshResponse {
  success: boolean;
  data: { accessToken: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  private readonly accessToken$ = new BehaviorSubject<string | null>(null);
  private readonly currentUser$ = new BehaviorSubject<User | null>(null);

  readonly isLoggedIn$: Observable<boolean> = this.accessToken$
    .asObservable()
    .pipe(map((token) => !!token));

  register(name: string, email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, {
        name,
        email,
        password,
      })
      .pipe(
        tap((res) => this.setAccessToken(res.data.accessToken)),
        tap((res) => this.currentUser$.next(res.data.user)),
        map((res) => res.data.user),
      );
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => this.setAccessToken(res.data.accessToken)),
        tap((res) => this.currentUser$.next(res.data.user)),
        map((res) => res.data.user),
      );
  }

  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  handleOAuthCallback(token: string): void {
    this.setAccessToken(token);
    this.getProfile().subscribe();
  }

  getProfile(): Observable<User> {
    return this.http
      .get<ProfileResponse>(`${this.apiUrl}/auth/me`)
      .pipe(
        map((res) => res.data.user),
        tap((user) => this.currentUser$.next(user)),
      );
  }

  refreshToken(): Observable<string> {
    return this.http
      .post<RefreshResponse>(`${this.apiUrl}/auth/refresh`, {})
      .pipe(
        map((res) => res.data.accessToken),
        tap((token) => this.setAccessToken(token)),
      );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession(): void {
    this.accessToken$.next(null);
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  setAccessToken(token: string): void {
    this.accessToken$.next(token);
  }

  getAccessToken(): string | null {
    return this.accessToken$.getValue();
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
