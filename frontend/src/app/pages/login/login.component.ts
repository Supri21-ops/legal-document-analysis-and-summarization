import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    :host { display: block; }
    .page-bg {
      min-height: 100vh;
      background: #F7F6F3;
      background-image:
        radial-gradient(circle at 20% 20%, rgba(37,99,235,0.06) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(16,185,129,0.05) 0%, transparent 50%);
    }
    .left-panel {
      background: linear-gradient(160deg, #1E3A5F 0%, #0F2340 60%, #162D4A 100%);
      border-radius: 20px;
      overflow: hidden;
      position: relative;
    }
    .left-panel::before {
      content: '';
      position: absolute;
      top: -60px; right: -60px;
      width: 240px; height: 240px;
      background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
    }
    .left-panel::after {
      content: '';
      position: absolute;
      bottom: -40px; left: -40px;
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
    }
    .form-card {
      background: #ffffff;
      border: 1px solid #E8E5DF;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -1px rgba(0,0,0,0.02), 0 20px 40px rgba(0,0,0,0.06);
    }
    .brand-mark {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #F7F6F3 0%, #E8E5DF 100%);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .input-wrap {
      position: relative;
    }
    .form-input {
      width: 100%;
      background: #FAFAF9;
      border: 1.5px solid #E2E0DC;
      border-radius: 10px;
      padding: 11px 16px;
      font-size: 14px;
      color: #1A1A2E;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      outline: none;
    }
    .form-input::placeholder { color: #A9A29A; }
    .form-input:focus {
      border-color: #2563EB;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
    }
    .btn-submit {
      width: 100%;
      background: #1E3A5F;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
      box-shadow: 0 2px 8px rgba(30,58,95,0.25);
      letter-spacing: 0.01em;
    }
    .btn-submit:hover:not(:disabled) {
      background: #16304F;
      box-shadow: 0 4px 14px rgba(30,58,95,0.35);
      transform: translateY(-1px);
    }
    .btn-submit:active:not(:disabled) { transform: translateY(0); }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
    .feature-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 100px;
      padding: 5px 12px;
      color: rgba(255,255,255,0.7);
      font-size: 11.5px;
    }
    .feature-pill-dot {
      width: 6px; height: 6px; border-radius: 50%;
    }
    .demo-box {
      background: #F0F4FF;
      border: 1px solid #C7D7F8;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .error-box {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .spinner { animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .divider {
      display: flex; align-items: center; gap: 12px;
      color: #C4BFB9; font-size: 12px;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1; height: 1px; background: #E8E5DF;
    }
    .scale-svg {
      position: absolute;
      bottom: 24px; right: 24px;
      opacity: 0.07;
    }
    .stat-item {
      text-align: center;
      padding: 16px 12px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 12px;
    }
  `],
  template: `
    <div class="page-bg flex items-center justify-center p-5" style="min-height:100vh;">
      <div class="w-full flex items-stretch gap-5" style="max-width:960px; min-height:600px;">

        <!-- Left Branding Panel -->
        <div class="left-panel hidden lg:flex flex-col justify-between flex-1 p-10 relative">
          <!-- Brand -->
          <div class="relative z-10">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:40px;">
              <div class="brand-mark">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 1l3 6.5 7 1-5 4.9 1.2 7L12 17l-6.2 3.4L7 13.4 2 8.5l7-1z"/>
                </svg>
              </div>
              <div>
                <div style="color:#fff;font-weight:700;font-size:17px;letter-spacing:-0.02em;">LegalAI</div>
                <div style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:1px;">Intelligent Contract Platform</div>
              </div>
            </div>

            <h2 style="color:#fff;font-size:30px;font-weight:700;line-height:1.25;letter-spacing:-0.03em;margin-bottom:12px;">
              Review contracts<br/>
              <span style="color:#7DD3FC;">10× faster with AI</span>
            </h2>
            <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.75;max-width:340px;margin-bottom:36px;">
              Upload any legal document and get instant risk scores, NLP clause detection, AI-powered summaries, and blockchain-verified integrity.
            </p>

            <!-- Feature Pills -->
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:40px;">
              @for (f of features; track f.label) {
                <div class="feature-pill">
                  <span class="feature-pill-dot" [style.background]="f.color"></span>
                  {{ f.label }}
                </div>
              }
            </div>

            <!-- Stats Row -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
              @for (s of heroStats; track s.label) {
                <div class="stat-item">
                  <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.03em;">{{ s.val }}</div>
                  <div style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:2px;">{{ s.label }}</div>
                </div>
              }
            </div>
          </div>

          <!-- Decorative scale SVG -->
          <svg class="scale-svg" width="160" height="160" viewBox="0 0 24 24" fill="white">
            <path d="M12 3L4 7v5c0 4.5 3.4 8.7 8 9.9C17.6 20.7 21 16.5 21 12V7l-8-4z"/>
          </svg>
        </div>

        <!-- Right: Login Form -->
        <div class="form-card w-full lg:w-96 p-8 flex flex-col justify-center">
          <!-- Mobile logo -->
          <div class="flex lg:hidden items-center gap-3 mb-8">
            <div style="width:36px;height:36px;background:#1E3A5F;border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2">
                <path d="M12 3L4 7v5c0 4.5 3.4 8.7 8 9.9C17.6 20.7 21 16.5 21 12V7l-8-4z"/>
              </svg>
            </div>
            <span style="font-weight:700;font-size:17px;color:#1A1A2E;">LegalAI</span>
          </div>

          <h2 style="font-size:24px;font-weight:700;color:#1A1A2E;letter-spacing:-0.03em;margin-bottom:4px;">Welcome back</h2>
          <p style="font-size:14px;color:#7C7069;margin-bottom:24px;">Sign in to your account</p>

          <!-- Demo box -->
          <div class="demo-box" style="margin-bottom:20px;">
            <p style="font-size:11.5px;font-weight:600;color:#2563EB;margin-bottom:3px;">Demo credentials</p>
            <p style="font-size:12.5px;color:#4B6FA8;font-family:monospace;">demo&#64;legalai.com &nbsp;·&nbsp; password123</p>
          </div>

          <!-- Error -->
          @if (error()) {
            <div class="error-box" style="margin-bottom:16px;">
              <p style="font-size:13px;color:#DC2626;">{{ error() }}</p>
            </div>
          }

          <form (ngSubmit)="onLogin()" #loginForm="ngForm" style="display:flex;flex-direction:column;gap:16px;">
            <div>
              <label style="display:block;font-size:13px;font-weight:500;color:#4A4540;margin-bottom:6px;">Email address</label>
              <input
                type="email"
                name="email"
                [(ngModel)]="email"
                required
                class="form-input"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label style="display:block;font-size:13px;font-weight:500;color:#4A4540;margin-bottom:6px;">Password</label>
              <input
                type="password"
                name="password"
                [(ngModel)]="password"
                required
                class="form-input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" [disabled]="loading()" class="btn-submit" style="margin-top:4px;">
              @if (loading()) {
                <span style="display:inline-flex;align-items:center;gap:8px;justify-content:center;">
                  <svg class="spinner" style="width:15px;height:15px;" viewBox="0 0 24 24" fill="none">
                    <circle style="opacity:0.3" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path style="opacity:0.9" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              } @else {
                Sign In
              }
            </button>
          </form>

          <div class="divider" style="margin:24px 0;">or</div>

          <p style="text-align:center;font-size:13.5px;color:#7C7069;">
            Don't have an account?
            <a routerLink="/register" style="color:#2563EB;font-weight:600;text-decoration:none;margin-left:4px;">Create one free</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  features = [
    { label: 'NLP Analysis', color: '#60A5FA' },
    { label: 'Risk Scoring', color: '#F87171' },
    { label: 'AI Summaries', color: '#A78BFA' },
    { label: 'Blockchain Proof', color: '#34D399' },
  ];

  heroStats = [
    { val: '21+', label: 'Clause Types' },
    { val: '99%', label: 'Accuracy' },
    { val: '<2s', label: 'Analysis' },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.authService.login({ username: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        if (err.status === 0) {
          this.error.set('Cannot connect to server. Make sure the backend is running on port 8000.');
        } else {
          this.error.set(err.error?.detail || 'Login failed. Check your credentials and try again.');
        }
        this.loading.set(false);
      }
    });
  }
}
