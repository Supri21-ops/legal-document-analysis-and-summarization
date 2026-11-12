import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styles: [`
    nav {
      background: #ffffff;
      border-bottom: 1px solid #ECEAE6;
      position: sticky; top: 0; z-index: 50;
    }
    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo-mark {
      width: 32px; height: 32px;
      background: #1E3A5F;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-name {
      font-weight: 700; font-size: 16px; color: #1A1A2E; letter-spacing: -0.02em;
    }
    .nav-links {
      display: flex; align-items: center; gap: 2px;
    }
    .nav-link {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 8px;
      font-size: 13.5px; font-weight: 500;
      color: #6B6560; text-decoration: none;
      transition: color 0.15s, background 0.15s;
    }
    .nav-link:hover { color: #1A1A2E; background: #F4F2EE; }
    .nav-link.active { color: #1E3A5F; background: #EBF0F8; font-weight: 600; }
    .user-area { display: flex; align-items: center; gap: 10px; }
    .user-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, #1E3A5F, #2563EB);
      color: #fff; font-size: 12px; font-weight: 600;
      display: flex; align-items: center; justify-content: center;
    }
    .user-name { font-size: 13px; color: #4A4540; font-weight: 500; }
    .logout-btn {
      font-size: 13px; color: #7C7069;
      background: none; border: 1px solid #E2E0DC;
      border-radius: 7px; padding: 5px 12px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .logout-btn:hover { background: #FEF2F2; color: #DC2626; border-color: #FECACA; }
    .nav-icon { opacity: 0.65; }
  `],
  template: `
    <nav>
      <div class="nav-inner">
        <!-- Logo -->
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="logo-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3L4 7v5c0 4.5 3.4 8.7 8 9.9C17.6 20.7 21 16.5 21 12V7l-8-4z"/>
            </svg>
          </div>
          <span class="brand-name">LegalAI</span>
        </div>

        <!-- Nav Links -->
        <div class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <svg class="nav-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </a>
          <a routerLink="/documents" routerLinkActive="active" class="nav-link">
            <svg class="nav-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            Documents
          </a>
          <a routerLink="/blockchain" routerLinkActive="active" class="nav-link">
            <svg class="nav-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
            Blockchain
          </a>
        </div>

        <!-- User area -->
        <div class="user-area">
          @if (user()?.full_name) {
            <div class="user-avatar">{{ user()!.full_name.charAt(0).toUpperCase() }}</div>
            <span class="user-name hidden sm:block">{{ user()?.full_name }}</span>
          }
          <button (click)="logout()" class="logout-btn">Sign out</button>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  user = computed(() => this.authService.currentUser());
  constructor(private authService: AuthService) {}
  logout() { this.authService.logout(); }
}
