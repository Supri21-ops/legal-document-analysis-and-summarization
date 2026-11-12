import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { DocumentService } from '../../services/document.service';
import { DocumentDetail } from '../../models/document.model';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  styles: [`
    .page-bg { min-height: 100vh; background: #F7F6F3; }

    .doc-header {
      background: #fff;
      border: 1px solid #ECEAE6;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .file-icon-ring {
      width: 48px; height: 48px; border-radius: 12px;
      background: #EBF0F8; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }

    /* Risk gauge */
    .risk-gauge {
      position: relative;
      width: 88px; height: 88px;
    }
    .risk-gauge svg { transform: rotate(-90deg); }
    .risk-gauge-label {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
    }

    .stat-chip {
      background: #F4F2EE;
      border: 1px solid #ECEAE6;
      border-radius: 10px;
      padding: 12px 16px;
      text-align: center;
    }

    /* Tabs */
    .tab-bar {
      display: flex; gap: 4px;
      background: #fff;
      border: 1px solid #ECEAE6;
      border-radius: 12px;
      padding: 5px;
      width: fit-content;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .tab-btn {
      padding: 7px 16px; border-radius: 8px; border: none; cursor: pointer;
      font-size: 13.5px; font-weight: 500;
      color: #7C7069; background: transparent;
      transition: background 0.15s, color 0.15s;
      display: flex; align-items: center; gap: 6px;
    }
    .tab-btn:hover { color: #1A1A2E; background: #F4F2EE; }
    .tab-btn.active { background: #1E3A5F; color: #fff; }

    /* Panels */
    .panel {
      background: #fff;
      border: 1px solid #ECEAE6;
      border-radius: 14px;
      overflow: hidden;
    }
    .panel-body { padding: 24px; }
    .panel-section-title { font-size: 14px; font-weight: 600; color: #1A1A2E; margin-bottom: 14px; }

    /* Clause cards */
    .clause-card {
      background: #fff;
      border: 1px solid #ECEAE6;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 10px;
      transition: box-shadow 0.15s;
    }
    .clause-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .clause-left-bar { width: 4px; flex-shrink: 0; align-self: stretch; }
    .clause-inner { padding: 16px 18px; flex: 1; }

    .risk-bar-track {
      height: 5px; background: #F0EEE9; border-radius: 100px; overflow: hidden;
    }
    .risk-bar-fill { height: 100%; border-radius: 100px; transition: width 0.5s ease; }

    /* Parties */
    .party-card {
      background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px;
      padding: 12px 16px;
    }

    /* Q&A */
    .qa-input {
      flex: 1;
      background: #FAFAF9;
      border: 1.5px solid #E2E0DC;
      border-radius: 10px;
      padding: 10px 16px;
      font-size: 14px; color: #1A1A2E;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .qa-input::placeholder { color: #A9A29A; }
    .qa-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }

    .qa-submit {
      background: #1E3A5F; color: #fff;
      border: none; border-radius: 10px;
      padding: 10px 18px; font-size: 14px; font-weight: 500;
      cursor: pointer; transition: background 0.15s;
      white-space: nowrap;
    }
    .qa-submit:hover:not(:disabled) { background: #16304F; }
    .qa-submit:disabled { opacity: 0.55; cursor: not-allowed; }

    .suggestion-chip {
      background: #F4F2EE; border: 1px solid #E2E0DC;
      color: #4A4540; font-size: 12px;
      padding: 5px 12px; border-radius: 100px;
      cursor: pointer; border: none;
      transition: background 0.12s, color 0.12s;
    }
    .suggestion-chip:hover { background: #EBF0F8; color: #1E3A5F; }

    .q-bubble {
      background: #F4F2EE; border-radius: 10px; padding: 10px 14px;
    }
    .a-bubble {
      background: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 10px; padding: 10px 14px;
    }

    /* Blockchain */
    .hash-box {
      background: #FAFAF9; border: 1px solid #E2E0DC; border-radius: 10px; padding: 14px 16px;
    }
    .hash-label { font-size: 11.5px; color: #A9A29A; margin-bottom: 5px; }
    .hash-value { font-family: 'Courier New', monospace; font-size: 12px; word-break: break-all; }

    .verified-banner {
      border-radius: 10px; padding: 14px 18px;
      display: flex; align-items: center; gap: 10px;
    }

    .btn-verify {
      background: #1E3A5F; color: #fff; border: none;
      border-radius: 9px; padding: 9px 18px;
      font-size: 13px; font-weight: 500; cursor: pointer;
      transition: background 0.15s;
    }
    .btn-verify:hover { background: #16304F; }

    .explain-btn {
      background: none; border: none; cursor: pointer;
      color: #2563EB; font-size: 12.5px; font-weight: 500;
      padding: 0; margin-top: 10px;
      display: flex; align-items: center; gap: 4px;
      transition: color 0.12s;
    }
    .explain-btn:hover { color: #1D4ED8; }

    .rewrite-btn {
      background: none; border: none; cursor: pointer;
      color: #7C3AED; font-size: 12.5px; font-weight: 500;
      padding: 0; margin-top: 6px;
      display: flex; align-items: center; gap: 4px;
      transition: color 0.12s;
    }
    .rewrite-btn:hover { color: #6D28D9; }

    .explain-box {
      background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px;
      padding: 12px 14px; margin-top: 10px;
      color: #1E40AF; font-size: 13px; line-height: 1.6;
    }

    /* Rewrite Modal Overlay */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 24px;
    }
    .modal-box {
      background: #fff; border-radius: 16px;
      padding: 28px; max-width: 640px; width: 100%;
      max-height: 80vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .tolerance-btn {
      flex: 1; border: 1.5px solid #E2E0DC; border-radius: 9px;
      padding: 10px 14px; cursor: pointer; font-size: 13px; font-weight: 500;
      background: #fff; transition: all 0.15s;
    }
    .tolerance-btn:hover { background: #F4F2EE; }
    .tolerance-btn.selected { border-color: #7C3AED; background: #F5F3FF; color: #7C3AED; }

    /* Redline diff */
    .redline-removed { color: #DC2626; text-decoration: line-through; background: #FEF2F2; border-radius: 3px; padding: 0 2px; }
    .redline-added { color: #059669; background: #ECFDF5; border-radius: 3px; padding: 0 2px; }

    /* Filter pills */
    .filter-pill {
      padding: 5px 14px; border-radius: 100px; border: 1.5px solid #E2E0DC;
      font-size: 12.5px; font-weight: 500; cursor: pointer;
      background: #fff; color: #7C7069;
      transition: all 0.12s;
    }
    .filter-pill:hover { background: #F4F2EE; }
    .filter-pill.active { background: #1E3A5F; color: #fff; border-color: #1E3A5F; }
    .filter-pill.high { background: #FEF2F2; color: #DC2626; border-color: #FECACA; }
    .filter-pill.high.active { background: #DC2626; color: #fff; border-color: #DC2626; }
    .filter-pill.medium { background: #FFFBEB; color: #B45309; border-color: #FDE68A; }
    .filter-pill.medium.active { background: #F59E0B; color: #fff; border-color: #F59E0B; }
    .filter-pill.low { background: #ECFDF5; color: #059669; border-color: #A7F3D0; }
    .filter-pill.low.active { background: #10B981; color: #fff; border-color: #10B981; }

    /* Anomaly banner */
    .anomaly-banner {
      background: #FFFBEB; border: 1px solid #FDE68A;
      border-radius: 12px; padding: 14px 18px;
      display: flex; align-items: flex-start; gap: 12px;
      margin-bottom: 16px;
    }

    .spinner { animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fade-in { animation: fadeIn 0.25s ease-out; }
    @keyframes fadeIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform:translateY(0); } }

    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13.5px; color: #7C7069; text-decoration: none;
      margin-bottom: 18px;
      transition: color 0.12s;
    }
    .back-link:hover { color: #1A1A2E; }

    /* Streaming cursor */
    .streaming-cursor::after {
      content: '▌';
      animation: blink 0.8s step-start infinite;
      color: #2563EB;
    }
    @keyframes blink { 50% { opacity: 0; } }
  `],
  template: `
    <div class="page-bg">
      <app-navbar />
      <main style="max-width:1100px;margin:0 auto;padding:28px 24px;">

        <a routerLink="/documents" class="back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Documents
        </a>

        @if (loading()) {
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;gap:14px;">
            <svg class="spinner" style="width:32px;height:32px;color:#2563EB;" viewBox="0 0 24 24" fill="none">
              <circle style="opacity:0.2" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path style="opacity:0.8" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p style="color:#7C7069;font-size:14px;">Loading document analysis...</p>
          </div>
        } @else if (document()) {

          <!-- Anomaly Warning Banner -->
          @if (document()!.anomaly_warning) {
            <div class="anomaly-banner fade-in">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <div style="font-size:13.5px;font-weight:600;color:#B45309;margin-bottom:3px;">
                  Document Type Warning
                </div>
                <div style="font-size:13px;color:#92400E;line-height:1.5;">{{ document()!.anomaly_warning }}</div>
              </div>
            </div>
          }

          <!-- Document Header -->
          <div class="doc-header">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:14px;">
                <div class="file-icon-ring">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    [attr.stroke]="document()!.file_type === 'pdf' ? '#EF4444' : '#2563EB'"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <h1 style="font-size:18px;font-weight:700;color:#1A1A2E;letter-spacing:-0.02em;margin-bottom:5px;">{{ document()!.original_filename }}</h1>
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:13px;color:#A9A29A;">{{ formatSize(document()!.file_size) }}</span>
                    <span style="color:#D1CDC5;">·</span>
                    <span class="status-badge" [class]="getStatusClass(document()!.status)" style="font-size:11.5px;font-weight:500;padding:3px 9px;border-radius:100px;">{{ document()!.status }}</span>
                    @if (document()!.document_type) {
                      <span style="font-size:11.5px;font-weight:500;background:#F5F3FF;color:#7C3AED;border:1px solid #DDD6FE;padding:3px 10px;border-radius:100px;">
                        {{ document()!.document_type }}
                      </span>
                    }
                    @if (document()!.error_message) {
                      <span style="font-size:12px;color:#DC2626;background:#FEF2F2;padding:2px 8px;border-radius:6px;">{{ document()!.error_message }}</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Risk Gauge -->
              @if (document()!.analysis) {
                <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                  <div class="risk-gauge">
                    <svg width="88" height="88" viewBox="0 0 88 88">
                      <!-- Track -->
                      <circle cx="44" cy="44" r="36" fill="none" stroke="#F0EEE9" stroke-width="8"/>
                      <!-- Fill -->
                      <circle cx="44" cy="44" r="36" fill="none"
                        [attr.stroke]="getRiskColor(document()!.analysis!.risk_level)"
                        stroke-width="8"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="226.19"
                        [attr.stroke-dashoffset]="226.19 * (1 - document()!.analysis!.overall_risk_score / 100)"/>
                    </svg>
                    <div class="risk-gauge-label">
                      <span style="font-size:17px;font-weight:700;color:#1A1A2E;letter-spacing:-0.03em;">{{ document()!.analysis!.overall_risk_score }}%</span>
                      <span style="font-size:10px;color:#A9A29A;margin-top:1px;">Risk</span>
                    </div>
                  </div>
                  <span style="font-size:12.5px;font-weight:600;" [style.color]="getRiskColor(document()!.analysis!.risk_level)">
                    {{ document()!.analysis!.risk_level }} Risk
                  </span>
                </div>
              }
            </div>

            <!-- Quick Stats -->
            @if (document()!.analysis) {
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-top:20px;padding-top:20px;border-top:1px solid #F0EEE9;">
                <div class="stat-chip">
                  <div style="font-size:22px;font-weight:700;color:#1A1A2E;letter-spacing:-0.04em;">{{ document()!.analysis!.total_clauses_count }}</div>
                  <div style="font-size:12px;color:#7C7069;margin-top:2px;">Clauses</div>
                </div>
                <div class="stat-chip">
                  <div style="font-size:22px;font-weight:700;color:#DC2626;letter-spacing:-0.04em;">{{ document()!.analysis!.high_risk_clauses_count }}</div>
                  <div style="font-size:12px;color:#7C7069;margin-top:2px;">High Risk</div>
                </div>
                <div class="stat-chip">
                  <div style="font-size:22px;font-weight:700;color:#2563EB;letter-spacing:-0.04em;">{{ document()!.analysis!.parties ? document()!.analysis!.parties.length : 0 }}</div>
                  <div style="font-size:12px;color:#7C7069;margin-top:2px;">Parties</div>
                </div>
                <div class="stat-chip">
                  <div style="font-size:22px;font-weight:700;color:#059669;letter-spacing:-0.04em;">{{ document()!.analysis!.important_dates ? document()!.analysis!.important_dates.length : 0 }}</div>
                  <div style="font-size:12px;color:#7C7069;margin-top:2px;">Key Dates</div>
                </div>
                <div class="stat-chip">
                  <div style="font-size:22px;font-weight:700;color:#8B5CF6;letter-spacing:-0.04em;">{{ document()!.analysis!.obligations ? document()!.analysis!.obligations.length : 0 }}</div>
                  <div style="font-size:12px;color:#7C7069;margin-top:2px;">Obligations</div>
                </div>
              </div>
            }
          </div>

          <!-- Tab Bar -->
          <div class="tab-bar">
            @for (tab of tabs; track tab.id) {
              <button (click)="selectTab(tab.id)" class="tab-btn" [class.active]="activeTab() === tab.id">
                <svg [attr.width]="13" [attr.height]="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path [attr.d]="tab.iconPath"/>
                </svg>
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- Tab Content -->
          @if (document()!.analysis) {

            <!-- Summary Tab -->
            @if (activeTab() === 'summary') {
              <div class="fade-in" style="display:flex;flex-direction:column;gap:14px;">
                <div class="panel">
                  <div class="panel-body">
                    <h3 class="panel-section-title">Executive Document Summary</h3>
                    <div style="font-size:14px;color:#4A4540;line-height:1.8;white-space:pre-line;">{{ document()!.analysis!.summary }}</div>
                  </div>
                </div>

                @if (document()!.analysis!.parties && document()!.analysis!.parties.length > 0) {
                  <div class="panel">
                    <div class="panel-body">
                      <h3 class="panel-section-title">Identified Parties</h3>
                      <div style="display:flex;flex-wrap:wrap;gap:10px;">
                        @for (party of document()!.analysis!.parties; track party.name) {
                          <div class="party-card">
                            <div style="font-size:13.5px;font-weight:600;color:#1E40AF;margin-bottom:2px;">{{ party.name }}</div>
                            <div style="font-size:12px;color:#3B82F6;">{{ party.type }}</div>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }

                @if (document()!.analysis!.obligations && document()!.analysis!.obligations.length > 0) {
                  <div class="panel">
                    <div class="panel-body">
                      <h3 class="panel-section-title">Key Binding Obligations</h3>
                      <ul style="display:flex;flex-direction:column;gap:10px;list-style:none;padding:0;margin:0;">
                        @for (ob of document()!.analysis!.obligations.slice(0, 10); track $index) {
                          <li style="display:flex;align-items:flex-start;gap:10px;font-size:13.5px;color:#4A4540;line-height:1.5;">
                            <span style="color:#2563EB;font-size:12px;margin-top:3px;flex-shrink:0;">▸</span>
                            {{ ob }}
                          </li>
                        }
                      </ul>
                    </div>
                  </div>
                }

                @if (document()!.analysis!.important_dates && document()!.analysis!.important_dates.length > 0) {
                  <div class="panel">
                    <div class="panel-body">
                      <h3 class="panel-section-title">Key Dates & Deadlines</h3>
                      <div style="display:flex;flex-direction:column;gap:10px;">
                        @for (d of document()!.analysis!.important_dates; track $index) {
                          <div style="display:flex;align-items:center;gap:14px;padding:10px 14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:9px;">
                            <div style="width:36px;height:36px;background:#EFF6FF;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                            </div>
                            <div>
                              <div style="font-size:13.5px;font-weight:600;color:#1A1A2E;">{{ d.date }}</div>
                              <div style="font-size:12px;color:#7C7069;">{{ d.context }}</div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Clauses Tab -->
            @if (activeTab() === 'clauses') {
              <div class="fade-in">
                <!-- Filter Bar -->
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                  <span style="font-size:12.5px;color:#7C7069;font-weight:500;">Filter:</span>
                  <button class="filter-pill" [class.active]="clauseFilter() === 'all'" (click)="setClauseFilter('all')">
                    All ({{ document()!.analysis!.clauses.length }})
                  </button>
                  <button class="filter-pill high" [class.active]="clauseFilter() === 'High'" (click)="setClauseFilter('High')">
                    🔴 High Risk ({{ countRisk('High') }})
                  </button>
                  <button class="filter-pill medium" [class.active]="clauseFilter() === 'Medium'" (click)="setClauseFilter('Medium')">
                    🟡 Medium Risk ({{ countRisk('Medium') }})
                  </button>
                  <button class="filter-pill low" [class.active]="clauseFilter() === 'Low'" (click)="setClauseFilter('Low')">
                    🟢 Low Risk ({{ countRisk('Low') }})
                  </button>
                  @for (cat of uniqueCategories(); track cat) {
                    <button class="filter-pill" [class.active]="clauseFilter() === cat" (click)="setClauseFilter(cat)"
                      style="background:#F4F2EE;color:#4A4540;border-color:#E2E0DC;">
                      {{ cat }}
                    </button>
                  }
                </div>

                @if (filteredClauses().length === 0) {
                  <div style="padding:40px;text-align:center;color:#A9A29A;font-size:14px;">
                    No clauses match this filter.
                  </div>
                }

                @for (clause of filteredClauses(); track $index) {
                  <div class="clause-card" style="display:flex;">
                    <div class="clause-left-bar" [style.background]="getRiskColor(clause.risk_level)"></div>
                    <div class="clause-inner">
                      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;flex-wrap:wrap;">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                          <span style="font-size:11.5px;font-weight:500;background:#F4F2EE;color:#4A4540;border:1px solid #E2E0DC;padding:3px 9px;border-radius:100px;">{{ clause.category }}</span>
                          <span style="font-size:11.5px;font-weight:500;padding:3px 9px;border-radius:100px;" [class]="getRiskBadgeClass(clause.risk_level)">{{ clause.risk_level }} Risk</span>
                        </div>
                        <div style="text-align:right;flex-shrink:0;">
                          <span style="font-size:16px;font-weight:700;color:#1A1A2E;letter-spacing:-0.03em;">{{ clause.risk_score }}%</span>
                          <span style="font-size:11px;color:#A9A29A;margin-left:3px;">risk</span>
                        </div>
                      </div>

                      <div class="risk-bar-track" style="margin-bottom:12px;">
                        <div class="risk-bar-fill" [style.width.%]="clause.risk_score" [style.background]="getRiskColor(clause.risk_level)"></div>
                      </div>

                      <p style="font-size:13.5px;color:#4A4540;line-height:1.65;">{{ clause.text }}</p>

                      <!-- Action Buttons Row -->
                      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;">
                        <button class="explain-btn" [disabled]="loadingExplaining()[clause.text]" (click)="explainClause(clause.text)">
                          @if (loadingExplaining()[clause.text]) {
                            <svg class="spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.8"/>
                            </svg>
                            Analyzing...
                          } @else {
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            Explain in plain English
                          }
                        </button>

                        <button class="rewrite-btn" (click)="openRewriteModal(clause.text)">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Fix with AI ✦
                        </button>
                      </div>

                      @if (streamingClause() === clause.text && streamingText()) {
                        <div class="explain-box" [class.streaming-cursor]="isStreaming()">{{ streamingText() }}</div>
                      } @else if (explanations()[clause.text]) {
                        <div class="explain-box">{{ explanations()[clause.text] }}</div>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <!-- AI Advice & Recommendations Tab -->
            @if (activeTab() === 'advice') {
              <div class="fade-in">
                <div class="panel">
                  <div class="panel-body">
                    <h3 class="panel-section-title">Strategic Legal Risk Remediation Advice</h3>
                    <p style="font-size:13px;color:#7C7069;margin-bottom:18px;">Automated legal counsel counter-proposals and mitigation steps derived from contract analysis.</p>

                    @if (loadingAdvice()) {
                      <div style="display:flex;align-items:center;gap:10px;padding:30px;color:#7C7069;">
                        <svg class="spinner" style="width:20px;height:20px;color:#2563EB;" viewBox="0 0 24 24" fill="none">
                          <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                          <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <span>Synthesizing legal counsel recommendations...</span>
                      </div>
                    } @else {
                      <div style="font-size:14px;color:#334155;line-height:1.8;white-space:pre-line;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;">
                        {{ adviceText() }}
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- Co-Pilot Chat Tab -->
            @if (activeTab() === 'qa') {
              <div class="fade-in">
                <div class="panel">
                  <div class="panel-body">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:28px;height:28px;border-radius:8px;background:#EDE9FE;display:flex;align-items:center;justify-content:center;">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
                          </svg>
                        </div>
                        <h3 class="panel-section-title" style="margin:0;">Contract Co-Pilot (Multi-Turn Legal Chat)</h3>
                      </div>
                      @if (chatMessages().length > 0) {
                        <button (click)="clearChat()" style="background:none;border:1px solid #E2E8F0;border-radius:7px;padding:4px 10px;font-size:12px;color:#64748B;cursor:pointer;">
                          Clear Conversation
                        </button>
                      }
                    </div>
                    <p style="font-size:13px;color:#A9A29A;margin-bottom:18px;">Conversational legal intelligence with contextual memory & RAG retrieval.</p>

                    <!-- Quick Suggestions -->
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
                      @for (q of suggestedQuestions; track q) {
                        <button (click)="sendChatMessage(q)" class="suggestion-chip">{{ q }}</button>
                      }
                    </div>

                    <!-- Chat Message Stream -->
                    <div style="min-height:220px;max-height:460px;overflow-y:auto;background:#FAFAF9;border:1px solid #ECEAE6;border-radius:12px;padding:16px;margin-bottom:16px;display:flex;flex-direction:column;gap:14px;">
                      @if (chatMessages().length === 0) {
                        <div style="text-align:center;padding:40px 20px;color:#A9A29A;">
                          <div style="width:40px;height:40px;border-radius:50%;background:#F4F2EE;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
                            💬
                          </div>
                          <p style="font-size:13.5px;font-weight:500;color:#7C7069;">Start a conversation with Contract Co-Pilot</p>
                          <p style="font-size:12px;margin-top:4px;">Ask follow-ups, clarify ambiguities, or request clause summaries.</p>
                        </div>
                      } @else {
                        @for (msg of chatMessages(); track $index) {
                          <div style="display:flex;align-items:flex-start;gap:10px;" [style.justify-content]="msg.role === 'user' ? 'flex-end' : 'flex-start'">
                            @if (msg.role === 'assistant') {
                              <div style="width:28px;height:28px;background:#7C3AED;border-radius:50%;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">AI</div>
                            }
                            <div [class]="msg.role === 'user' ? 'q-bubble' : 'a-bubble'"
                              [style.background]="msg.role === 'user' ? '#1E3A5F' : '#EFF6FF'"
                              [style.color]="msg.role === 'user' ? '#FFFFFF' : '#1E40AF'"
                              style="max-width:80%;font-size:13.5px;line-height:1.65;white-space:pre-line;border-radius:12px;padding:12px 16px;">
                              {{ msg.content }}
                            </div>
                            @if (msg.role === 'user') {
                              <div style="width:28px;height:28px;background:#2563EB;border-radius:50%;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">You</div>
                            }
                          </div>
                        }

                        @if (sendingChat()) {
                          <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#EFF6FF;border-radius:10px;width:fit-content;">
                            <svg class="spinner" style="width:14px;height:14px;color:#7C3AED;" viewBox="0 0 24 24" fill="none">
                              <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                              <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            <span style="font-size:12.5px;color:#4338CA;">Contract Co-Pilot is reviewing contract...</span>
                          </div>
                        }
                      }
                    </div>

                    <!-- Input bar -->
                    <div style="display:flex;gap:10px;">
                      <input [(ngModel)]="chatInput" (keyup.enter)="sendChatMessage()"
                        placeholder="Ask anything about this contract (e.g. Can the client withhold payment without notice?)"
                        class="qa-input"/>
                      <button (click)="sendChatMessage()" [disabled]="sendingChat() || !chatInput.trim()" class="qa-submit" style="background:#7C3AED;">
                        @if (sendingChat()) {
                          <svg class="spinner" style="width:14px;height:14px;display:inline;" viewBox="0 0 24 24" fill="none">
                            <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        } @else { Send }
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Blockchain Tab -->
            @if (activeTab() === 'blockchain') {
              <div class="fade-in">
                <div class="panel">
                  <div class="panel-body">
                    <h3 class="panel-section-title">Cryptographic Blockchain Verification</h3>

                    @if (document()!.blockchain) {
                      <div style="display:flex;flex-direction:column;gap:14px;">

                        <!-- Verified banner -->
                        <div class="verified-banner"
                          [style.background]="document()!.blockchain!.is_verified ? '#ECFDF5' : '#FFFBEB'"
                          [style.border]="document()!.blockchain!.is_verified ? '1px solid #A7F3D0' : '1px solid #FDE68A'">
                          <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
                            [style.background]="document()!.blockchain!.is_verified ? '#D1FAE5' : '#FEF3C7'">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                              [attr.stroke]="document()!.blockchain!.is_verified ? '#059669' : '#B45309'"
                              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <path [attr.d]="document()!.blockchain!.is_verified ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'"/>
                            </svg>
                          </div>
                          <div>
                            <div style="font-size:14px;font-weight:600;" [style.color]="document()!.blockchain!.is_verified ? '#059669' : '#B45309'">
                              {{ document()!.blockchain!.is_verified ? 'Recorded on Immutable Ledger' : 'Stored On-Chain' }}
                            </div>
                            <div style="font-size:12.5px;color:#7C7069;margin-top:2px;">Recorded {{ formatDate(document()!.blockchain!.timestamp) }}</div>
                          </div>
                        </div>

                        <!-- Hash details grid -->
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                          <div class="hash-box">
                            <div class="hash-label">Document Hash (SHA-256)</div>
                            <div class="hash-value" style="color:#059669;">{{ document()!.blockchain!.document_hash }}</div>
                          </div>
                          <div class="hash-box">
                            <div class="hash-label">Transaction Hash</div>
                            <div class="hash-value" style="color:#2563EB;">{{ document()!.blockchain!.transaction_hash }}</div>
                          </div>
                          <div class="hash-box">
                            <div class="hash-label">Block Number</div>
                            <div class="hash-value" style="color:#1A1A2E;font-size:16px;font-weight:700;">#{{ document()!.blockchain!.block_number }}</div>
                          </div>
                          <div class="hash-box">
                            <div class="hash-label">Network</div>
                            <div style="font-size:14px;font-weight:500;color:#1A1A2E;margin-top:2px;">{{ document()!.blockchain!.network }}</div>
                          </div>
                        </div>

                        <!-- Verify section -->
                        <div style="background:#F4F2EE;border:1px solid #E2E0DC;border-radius:12px;padding:18px;">
                          <h4 style="font-size:13.5px;font-weight:600;color:#1A1A2E;margin-bottom:6px;">Verify Document Integrity Against Blockchain</h4>
                          <p style="font-size:13px;color:#7C7069;line-height:1.5;margin-bottom:14px;">Upload a file to check if it matches the immutable on-chain record, or verify the stored server copy directly.</p>
                          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                            <input type="file" accept=".pdf,.docx,.txt" #verifyInput style="display:none;" (change)="onVerifyFile($event)" />
                            <button (click)="verifyInput.click()" class="btn-verify">
                              <svg style="display:inline;margin-right:6px;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                              </svg>
                              Verify New File
                            </button>
                            <button (click)="verifyStoredCopy()" class="btn-verify" style="background:#475569;">
                              Verify Stored Copy
                            </button>
                          </div>

                          @if (verifying()) {
                            <div style="margin-top:12px;color:#7C7069;font-size:13px;">Checking cryptographic hash on-chain...</div>
                          }

                          @if (verificationResult()) {
                            <div style="margin-top:14px;padding:14px 18px;border-radius:10px;"
                              [style.background]="verificationResult()!.verified ? '#ECFDF5' : '#FEF2F2'"
                              [style.border]="verificationResult()!.verified ? '1px solid #A7F3D0' : '1px solid #FECACA'">
                              <p style="font-size:14px;font-weight:600;margin-bottom:4px;"
                                [style.color]="verificationResult()!.verified ? '#059669' : '#DC2626'">
                                {{ verificationResult()!.message }}
                              </p>
                              <div style="font-size:12px;color:#64748B;font-family:monospace;margin-top:6px;">
                                Network: {{ verificationResult()!.blockchain_network }} | Tamper Detected: {{ verificationResult()!.tamper_detected ? 'YES' : 'NO' }}
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    } @else {
                      <div style="padding:48px;text-align:center;color:#A9A29A;font-size:14px;">
                        No blockchain record found for this document.
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

          } @else {
            <div class="panel" style="padding:48px;text-align:center;">
              <svg class="spinner" style="width:28px;height:28px;color:#2563EB;margin:0 auto 14px;display:block;" viewBox="0 0 24 24" fill="none">
                <circle style="opacity:0.2" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path style="opacity:0.8" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p style="font-size:15px;font-weight:600;color:#1A1A2E;margin-bottom:6px;">Analysis in progress</p>
              <p style="font-size:13.5px;color:#7C7069;">Running NLP extraction, ML risk scoring, and RAG vector indexing...</p>
            </div>
          }
        }
      </main>
    </div>

    <!-- AI Rewrite Modal -->
    @if (showRewriteModal()) {
      <div class="modal-overlay" (click)="closeRewriteModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
            <div>
              <h2 style="font-size:17px;font-weight:700;color:#1A1A2E;margin-bottom:3px;">✦ Fix with AI — Clause Rewriter</h2>
              <p style="font-size:12.5px;color:#7C7069;">Select your risk tolerance and let Gemini redraft this clause.</p>
            </div>
            <button (click)="closeRewriteModal()" style="background:none;border:none;cursor:pointer;color:#A9A29A;padding:4px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Original Clause -->
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px 16px;margin-bottom:18px;">
            <div style="font-size:11.5px;font-weight:600;color:#A9A29A;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Original Clause</div>
            <p style="font-size:13px;color:#334155;line-height:1.65;">{{ rewriteClauseText() }}</p>
          </div>

          <!-- Risk Tolerance Selector -->
          <div style="margin-bottom:18px;">
            <div style="font-size:12.5px;font-weight:600;color:#1A1A2E;margin-bottom:10px;">Risk Tolerance</div>
            <div style="display:flex;gap:8px;">
              <button class="tolerance-btn" [class.selected]="selectedTolerance() === 'aggressive'" (click)="selectedTolerance.set('aggressive')">
                🔴 Aggressive
                <div style="font-size:11px;color:#7C7069;font-weight:400;margin-top:2px;">Remove protections, simplify terms</div>
              </button>
              <button class="tolerance-btn" [class.selected]="selectedTolerance() === 'balanced'" (click)="selectedTolerance.set('balanced')">
                🟡 Balanced
                <div style="font-size:11px;color:#7C7069;font-weight:400;margin-top:2px;">Fair to both parties</div>
              </button>
              <button class="tolerance-btn" [class.selected]="selectedTolerance() === 'conservative'" (click)="selectedTolerance.set('conservative')">
                🟢 Conservative
                <div style="font-size:11px;color:#7C7069;font-weight:400;margin-top:2px;">Maximum protection clauses</div>
              </button>
            </div>
          </div>

          <!-- Rewrite Button -->
          <button (click)="executeRewrite()" [disabled]="rewriteLoading()"
            style="width:100%;background:#7C3AED;color:#fff;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.15s;margin-bottom:16px;"
            [style.opacity]="rewriteLoading() ? '0.65' : '1'">
            @if (rewriteLoading()) {
              <svg class="spinner" style="width:14px;height:14px;display:inline;margin-right:6px;" viewBox="0 0 24 24" fill="none">
                <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Rewriting with Gemini...
            } @else {
              ✦ Rewrite Clause
            }
          </button>

          <!-- Rewrite Result (Redline Diff) -->
          @if (rewriteResult()) {
            <div style="border:1px solid #DDD6FE;border-radius:10px;overflow:hidden;">
              <div style="background:#F5F3FF;padding:10px 16px;border-bottom:1px solid #DDD6FE;">
                <span style="font-size:12px;font-weight:600;color:#7C3AED;">AI Suggested Revision</span>
                <span style="font-size:11px;color:#A9A29A;margin-left:8px;">{{ selectedTolerance() | titlecase }} mode</span>
              </div>
              <div style="padding:16px;">
                <!-- Redline: original in red strikethrough -->
                <div style="margin-bottom:12px;">
                  <span style="font-size:11px;font-weight:600;color:#DC2626;text-transform:uppercase;letter-spacing:0.05em;">— Removed</span>
                  <p class="redline-removed" style="font-size:13px;line-height:1.65;margin-top:6px;">{{ rewriteClauseText() }}</p>
                </div>
                <!-- New version in green -->
                <div>
                  <span style="font-size:11px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:0.05em;">+ Suggested</span>
                  <p class="redline-added" style="font-size:13px;line-height:1.65;margin-top:6px;">{{ rewriteResult()!.rewritten_clause }}</p>
                </div>
                @if (rewriteResult()!.explanation) {
                  <div style="margin-top:12px;padding:10px 14px;background:#F0FDF4;border:1px solid #A7F3D0;border-radius:8px;font-size:12.5px;color:#166534;line-height:1.5;">
                    <strong>Why this change:</strong> {{ rewriteResult()!.explanation }}
                  </div>
                }

                <!-- Accept Revision & Export Action -->
                <div style="margin-top:16px;padding-top:14px;border-top:1px solid #EDE9FE;display:flex;gap:10px;">
                  <button (click)="acceptAndDownloadDocx()" [disabled]="downloadingDocx()"
                    style="flex:1;background:#059669;color:#fff;border:none;border-radius:10px;padding:11px 18px;font-size:13.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:background 0.15s;"
                    [style.opacity]="downloadingDocx() ? '0.7' : '1'">
                    @if (downloadingDocx()) {
                      <svg class="spinner" style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none">
                        <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Generating Redrafted Contract (.docx)...
                    } @else {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                      </svg>
                      Accept & Download Redrafted Contract (.docx)
                    }
                  </button>
                </div>
              </div>
            </div>
          }

          @if (rewriteError()) {
            <div style="padding:12px 16px;background:#FEF2F2;border:1px solid #FECACA;border-radius:9px;font-size:13px;color:#DC2626;">
              {{ rewriteError() }}
            </div>
          }
        </div>
      </div>
    }
  `
})
export class DocumentDetailComponent implements OnInit {
  document = signal<DocumentDetail | null>(null);
  loading = signal(true);
  activeTab = signal('summary');
  question = '';
  askingQuestion = signal(false);
  qaHistory = signal<{ question: string; answer: string }[]>([]);
  explanations = signal<Record<string, string>>({});
  loadingExplaining = signal<Record<string, boolean>>({});
  verificationResult = signal<any>(null);
  verifying = signal(false);
  adviceText = signal<string>('');
  loadingAdvice = signal(false);

  // Clause filter
  clauseFilter = signal<string>('all');

  // Streaming explanation
  streamingClause = signal<string>('');
  streamingText = signal<string>('');
  isStreaming = signal(false);

  // Rewrite modal
  showRewriteModal = signal(false);
  rewriteClauseText = signal<string>('');
  selectedTolerance = signal<string>('balanced');
  rewriteLoading = signal(false);
  rewriteResult = signal<any>(null);
  rewriteError = signal<string>('');
  downloadingDocx = signal(false);

  // Multi-turn Co-Pilot Chat
  chatMessages = signal<{ role: 'user' | 'assistant'; content: string }[]>([]);
  chatInput = '';
  sendingChat = signal(false);

  tabs = [
    { id: 'summary',    label: 'Summary',        iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'clauses',    label: 'Clauses & Risk', iconPath: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
    { id: 'advice',     label: 'AI Advice',      iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id: 'qa',         label: 'Co-Pilot Chat',  iconPath: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'blockchain', label: 'Blockchain',      iconPath: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71' },
  ];

  suggestedQuestions = [
    'What are the termination conditions?',
    'Who are the parties involved?',
    'What are the payment terms?',
    'What happens in case of breach?',
    'What is the governing law?',
  ];

  constructor(
    private route: ActivatedRoute,
    private docService: DocumentService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.params['id']);
    if (id) this.loadDocument(id);
  }

  loadDocument(id: number) {
    this.docService.getDocument(id).subscribe({
      next: (doc) => { this.document.set(doc); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  selectTab(tabId: string) {
    this.activeTab.set(tabId);
    if (tabId === 'advice' && !this.adviceText() && this.document()) {
      this.loadAdvice();
    }
  }

  loadAdvice() {
    if (!this.document()) return;
    this.loadingAdvice.set(true);
    this.docService.getRecommendations(this.document()!.id).subscribe({
      next: (res) => {
        this.adviceText.set(res.recommendations);
        this.loadingAdvice.set(false);
      },
      error: () => this.loadingAdvice.set(false)
    });
  }

  askQuestion() {
    if (!this.question.trim() || !this.document()) return;
    this.sendChatMessage(this.question);
    this.question = '';
  }

  sendChatMessage(promptText?: string) {
    const textToSend = (promptText || this.chatInput).trim();
    if (!textToSend || !this.document() || this.sendingChat()) return;

    const newMsg = { role: 'user' as const, content: textToSend };
    const updatedHistory = [...this.chatMessages(), newMsg];
    this.chatMessages.set(updatedHistory);
    this.chatInput = '';
    this.sendingChat.set(true);

    this.docService.chatWithDocument(this.document()!.id, updatedHistory).subscribe({
      next: (res) => {
        this.chatMessages.update(msgs => [...msgs, { role: 'assistant', content: res.reply }]);
        this.sendingChat.set(false);
      },
      error: (err) => {
        this.chatMessages.update(msgs => [...msgs, {
          role: 'assistant',
          content: 'Unable to query Contract Co-Pilot: ' + (err.error?.detail || err.message || 'Check if server is running.')
        }]);
        this.sendingChat.set(false);
      }
    });
  }

  clearChat() {
    this.chatMessages.set([]);
  }

  acceptAndDownloadDocx() {
    if (!this.document() || !this.rewriteResult()) return;
    this.downloadingDocx.set(true);

    this.docService.exportRedraftedDocx(
      this.document()!.id,
      this.rewriteClauseText(),
      this.rewriteResult().rewritten_clause,
      this.selectedTolerance()
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const baseName = this.document()!.original_filename.replace(/\.[^/.]+$/, "");
        a.download = `${baseName}_Redrafted.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.downloadingDocx.set(false);
      },
      error: (err) => {
        alert('Could not export document: ' + (err.error?.detail || err.message || 'Error creating file'));
        this.downloadingDocx.set(false);
      }
    });
  }

  explainClause(clauseText: string) {
    if (this.streamingClause() === clauseText && this.streamingText()) return;
    if (this.loadingExplaining()[clauseText]) return;

    // Try SSE streaming first
    this.streamingClause.set(clauseText);
    this.streamingText.set('');
    this.isStreaming.set(true);
    this.loadingExplaining.update(m => ({ ...m, [clauseText]: true }));

    const API_URL = 'http://localhost:8000';
    const token = localStorage.getItem('access_token');

    fetch(`${API_URL}/api/analysis/explain-clause/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ clause_text: clauseText })
    }).then(response => {
      if (!response.ok || !response.body) {
        // Fallback to regular explain
        this.isStreaming.set(false);
        this.loadingExplaining.update(m => ({ ...m, [clauseText]: false }));
        this.docService.explainClause(clauseText).subscribe({
          next: (res) => {
            this.streamingText.set(res.explanation);
            this.explanations.update(e => ({ ...e, [clauseText]: res.explanation }));
          },
          error: (err) => {
            this.streamingText.set('AI Explanation failed: ' + (err.error?.detail || err.message || 'Check if backend is running.'));
          }
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      const pump = (): Promise<void> => reader.read().then(({ done, value }) => {
        if (done) {
          this.isStreaming.set(false);
          this.loadingExplaining.update(m => ({ ...m, [clauseText]: false }));
          this.explanations.update(e => ({ ...e, [clauseText]: accumulated }));
          return;
        }
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              this.isStreaming.set(false);
              this.loadingExplaining.update(m => ({ ...m, [clauseText]: false }));
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                accumulated += parsed.token;
                this.streamingText.set(accumulated);
              }
            } catch {
              // Not JSON, skip
            }
          }
        }
        return pump();
      });

      pump().catch(() => {
        this.isStreaming.set(false);
        this.loadingExplaining.update(m => ({ ...m, [clauseText]: false }));
      });

    }).catch(() => {
      // Network error — fallback
      this.isStreaming.set(false);
      this.loadingExplaining.update(m => ({ ...m, [clauseText]: false }));
      this.streamingText.set('Could not connect to backend. Please ensure the server is running.');
    });
  }

  // Clause filter helpers
  setClauseFilter(filter: string) {
    this.clauseFilter.set(filter);
  }

  get filteredClauses() {
    return () => {
      const clauses = this.document()?.analysis?.clauses ?? [];
      const f = this.clauseFilter();
      if (f === 'all') return clauses;
      if (f === 'High' || f === 'Medium' || f === 'Low') {
        return clauses.filter(c => c.risk_level === f);
      }
      // Category filter
      return clauses.filter(c => c.category === f);
    };
  }

  get uniqueCategories() {
    return () => {
      const clauses = this.document()?.analysis?.clauses ?? [];
      const cats = Array.from(new Set(clauses.map(c => c.category))).filter(Boolean);
      return cats.slice(0, 8); // show max 8 category chips
    };
  }

  countRisk(level: string): number {
    return (this.document()?.analysis?.clauses ?? []).filter(c => c.risk_level === level).length;
  }

  // Rewrite modal
  openRewriteModal(clauseText: string) {
    this.rewriteClauseText.set(clauseText);
    this.rewriteResult.set(null);
    this.rewriteError.set('');
    this.showRewriteModal.set(true);
  }

  closeRewriteModal() {
    this.showRewriteModal.set(false);
  }

  executeRewrite() {
    this.rewriteLoading.set(true);
    this.rewriteResult.set(null);
    this.rewriteError.set('');

    this.docService.rewriteClause(this.rewriteClauseText(), this.selectedTolerance()).subscribe({
      next: (res) => {
        this.rewriteResult.set(res);
        this.rewriteLoading.set(false);
      },
      error: (err) => {
        this.rewriteError.set('Rewrite failed: ' + (err.error?.detail || err.message || 'Backend error.'));
        this.rewriteLoading.set(false);
      }
    });
  }

  onVerifyFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !this.document()) return;
    this.verifying.set(true);
    this.docService.verifyDocument(this.document()!.id, file).subscribe({
      next: (res) => { this.verificationResult.set(res); this.verifying.set(false); },
      error: (err) => { this.verificationResult.set({ verified: false, message: 'Verification error: ' + err.message }); this.verifying.set(false); }
    });
  }

  verifyStoredCopy() {
    if (!this.document()) return;
    this.verifying.set(true);
    this.docService.verifyDocument(this.document()!.id).subscribe({
      next: (res) => { this.verificationResult.set(res); this.verifying.set(false); },
      error: (err) => { this.verificationResult.set({ verified: false, message: 'Verification error: ' + err.message }); this.verifying.set(false); }
    });
  }

  getRiskColor(level: string): string {
    return level === 'High' ? '#EF4444' : level === 'Medium' ? '#F59E0B' : '#10B981';
  }

  getRiskBadgeClass(level: string): string {
    return level === 'High' ? 'risk-high' : level === 'Medium' ? 'risk-medium' : 'risk-low';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      completed: 'status-completed',
      processing: 'status-processing',
      uploaded: 'status-uploaded',
      failed: 'status-failed',
    };
    return map[status] || 'status-default';
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}
