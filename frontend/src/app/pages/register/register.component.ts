import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    :host { display: block; }
    .page-bg {
      min-height: 100vh;
      background: #F7F6F3;
      background-image:
        radial-gradient(circle at 80% 10%, rgba(37,99,235,0.06) 0%, transparent 50%),
        radial-gradient(circle at 10% 90%, rgba(16,185,129,0.05) 0%, transparent 50%);
    }
    .left-panel {
      background: linear-gradient(160deg, #1E3A5F 0%, #0F2340 60%, #162D4A 100%);
      border-radius: 20px; overflow: hidden; position: relative;
    }
    .left-panel::before {
      content: ''; position: absolute;
      top: -60px; left: -60px; width: 240px; height: 240px;
      background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
    }
    .form-card {
      background: #ffffff;
      border: 1px solid #E8E5DF;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 40px rgba(0,0,0,0.06);
    }
    .brand-mark {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #F7F6F3 0%, #E8E5DF 100%);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
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
      color: #fff; border: none;
      border-radius: 10px;
      padding: 12px 20px;
      font-size: 14px; font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
      box-shadow: 0 2px 8px rgba(30,58,95,0.25);
    }
    .btn-submit:hover:not(:disabled) {
      background: #16304F;
      box-shadow: 0 4px 14px rgba(30,58,95,0.35);
      transform: translateY(-1px);
    }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
    .check-row {
      display: flex; align-items: flex-start; gap: 10px;
      color: rgba(255,255,255,0.65); font-size: 13.5px; line-height: 1.5;
    }
    .check-icon {
      flex-shrink: 0; margin-top: 2px;
      width: 18px; height: 18px;
      background: rgba(52,211,153,0.2); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .error-box { background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; padding:10px 14px; }
    .success-box { background:#F0FDF4; border:1px solid #BBF7D0; border-radius:10px; padding:10px 14px; }
    .spinner { animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .divider { display:flex;align-items:center;gap:12px;color:#C4BFB9;font-size:12px; }
    .divider::before, .divider::after { content:'';flex:1;height:1px;background:#E8E5DF; }
    .badge-strip {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 32px;
    }
    .badge {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.55);
      font-size: 11px;
      padding: 4px 10px; border-radius: 100px;
    }
  `],
  template: `
    <div class="page-bg flex items-center justify-center p-5" style="min-height:100vh;">
      <div class="w-full flex items-stretch gap-5" style="max-width:960px; min-height:600px;">

        <!-- Left Branding Panel -->
        <div class="left-panel hidden lg:flex flex-col justify-between flex-1 p-10 relative">
          <div style="position:relative;z-index:10;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:40px;">
              <div class="brand-mark">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3L4 7v5c0 4.5 3.4 8.7 8 9.9C17.6 20.7 21 16.5 21 12V7l-8-4z"/>
                </svg>
              </div>
              <div>
                <div style="color:#fff;font-weight:700;font-size:17px;letter-spacing:-0.02em;">LegalAI</div>
                <div style="color:rgba(255,255,255,0.4);font-size:11px;margin-top:1px;">Intelligent Contract Platform</div>
              </div>
            </div>

            <h2 style="color:#fff;font-size:28px;font-weight:700;line-height:1.25;letter-spacing:-0.03em;margin-bottom:12px;">
              Start reviewing contracts<br/>
              <span style="color:#7DD3FC;">smarter, not harder</span>
            </h2>
            <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.75;max-width:340px;margin-bottom:32px;">
              Get instant access to AI-powered legal analysis — no legal training required.
            </p>

            <div style="display:flex;flex-direction:column;gap:12px;">
              @for (item of checkItems; track item) {
                <div class="check-row">
                  <div class="check-icon">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <span>{{ item }}</span>
                </div>
              }
            </div>

            <div class="badge-strip">
              @for (b of badges; track b) {
                <span class="badge">{{ b }}</span>
              }
            </div>
          </div>
        </div>

        <!-- Right: Register Form -->
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

          <h2 style="font-size:24px;font-weight:700;color:#1A1A2E;letter-spacing:-0.03em;margin-bottom:4px;">Create your account</h2>
          <p style="font-size:14px;color:#7C7069;margin-bottom:24px;">Free to get started</p>

          @if (error()) {
            <div class="error-box" style="margin-bottom:16px;">
              <p style="font-size:13px;color:#DC2626;">{{ error() }}</p>
            </div>
          }
          @if (success()) {
            <div class="success-box" style="margin-bottom:16px;">
              <p style="font-size:13px;color:#15803D;">Account created! Redirecting to login...</p>
            </div>
          }

          <form (ngSubmit)="onRegister()" #regForm="ngForm" style="display:flex;flex-direction:column;gap:14px;">
            <div>
              <label style="display:block;font-size:13px;font-weight:500;color:#4A4540;margin-bottom:6px;">Full Name</label>
              <input type="text" name="full_name" [(ngModel)]="fullName" required class="form-input" placeholder="John Doe"/>
            </div>
            <div>
              <label style="display:block;font-size:13px;font-weight:500;color:#4A4540;margin-bottom:6px;">Email address</label>
              <input type="email" name="email" [(ngModel)]="email" required class="form-input" placeholder="you@company.com"/>
            </div>
            <div>
              <label style="display:block;font-size:13px;font-weight:500;color:#4A4540;margin-bottom:6px;">Password</label>
              <input type="password" name="password" [(ngModel)]="password" required minlength="6" class="form-input" placeholder="Min. 6 characters"/>
            </div>

            <button type="submit" [disabled]="loading()" class="btn-submit" style="margin-top:6px;">
              @if (loading()) {
                <span style="display:inline-flex;align-items:center;gap:8px;justify-content:center;">
                  <svg class="spinner" style="width:15px;height:15px;" viewBox="0 0 24 24" fill="none">
                    <circle style="opacity:0.3" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path style="opacity:0.9" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account...
                </span>
              } @else {
                Create Account
              }
            </button>
          </form>

          <div class="divider" style="margin:22px 0;">or</div>

          <p style="text-align:center;font-size:13.5px;color:#7C7069;">
            Already have an account?
            <a routerLink="/login" style="color:#2563EB;font-weight:600;text-decoration:none;margin-left:4px;">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  success = signal(false);

  checkItems = [
    'Upload PDF, DOCX, or TXT contracts',
    'Instant NLP clause & entity detection',
    'AI risk scoring with Legal-BERT',
    'Plain-English explanations via Claude AI',
    'Blockchain document integrity proof',
    'Interactive Q&A on your documents',
  ];

  badges = ['FastAPI', 'Angular 17', 'spaCy', 'Legal-BERT', 'Claude AI', 'Blockchain'];

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    if (!this.fullName || !this.email || !this.password) return;
    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.register({ full_name: this.fullName, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        if (err.status === 0) {
          this.error.set('Cannot connect to server. Make sure the backend is running on port 8000.');
        } else {
          this.error.set(err.error?.detail || 'Registration failed. Please try again.');
        }
        this.loading.set(false);
      }
    });
  }
}
