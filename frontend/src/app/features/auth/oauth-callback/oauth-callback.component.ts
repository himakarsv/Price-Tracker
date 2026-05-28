import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="callback-wrapper">
      <mat-spinner diameter="48"></mat-spinner>
      <p>Signing you in…</p>
    </div>
  `,
  styles: [
    `
      .callback-wrapper {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        color: #6b7280;
      }
    `,
  ],
})
export class OAuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.authService.setAccessToken(token);
      this.authService.getProfile().subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () =>
          this.router.navigate(['/login'], {
            queryParams: { error: 'oauth_failed' },
          }),
      });
    } else {
      this.router.navigate(['/login'], {
        queryParams: { error: 'oauth_failed' },
      });
    }
  }
}
