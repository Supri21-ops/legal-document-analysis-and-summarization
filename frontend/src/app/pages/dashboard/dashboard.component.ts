import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { DocumentService } from '../../services/document.service';
import { DocumentListItem } from '../../models/document.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  styles: [`
    .page-bg { min-height: 100vh; background: #F7F6F3; }
    .stat-card {
      background: #fff;
      border: 1px solid #ECEAE6;
      border-radius: 14px;
      padding: 20px;
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.15s;
    }
    .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
    .stat-accent {
      position: absolute; left: 0; top: 0; bottom: 0;
      width: 4px; border-radius: 14px 0 0 14px;
    }
    .stat-icon-wrap {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .stat-value { font-size: 28px; font-weight: 700; color: #1A1A2E; letter-spacing: -0.04em; }
    .stat-label { font-size: 12.5px; color: #7C7069; margin-top: 2px; }
    .stat-change { font-size: 12px; margin-top: 8px; }

    .panel {
      background: #fff;
      border: 1px solid #ECEAE6;
      border-radius: 14px;
      overflow: hidden;
    }
    .panel-header {
      padding: 18px 20px;
      border-bottom: 1px solid #ECEAE6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .panel-title { font-size: 14px; font-weight: 600; color: #1A1A2E; }

    .doc-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid #F4F2EE;
      text-decoration: none;
      transition: background 0.12s;
    }
    .doc-row:last-child { border-bottom: none; }
    .doc-row:hover { background: #FAFAF9; }
    .doc-icon {
      width: 36px; height: 36px; border-radius: 9px;
      background: #EBF0F8;
      display: flex; align-items: center; justify-content: center;
    }

    .status-badge {
      font-size: 11.5px; font-weight: 500;
      padding: 3px 9px; border-radius: 100px;
    }

    .tech-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 20px;
      border-bottom: 1px solid #F4F2EE;
    }
    .tech-row:last-child { border-bottom: none; }
    .tech-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

    .upload-cta {
      background: linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%);
      border-radius: 14px; padding: 20px;
      text-decoration: none; display: block;
      transition: opacity 0.15s, transform 0.15s;
    }
    .upload-cta:hover { opacity: 0.95; transform: translateY(-1px); }

    .blockchain-indicator {
      width: 8px; height: 8px; border-radius: 50%;
    }
    .pulse-green { animation: pulse-anim 2s ease-in-out infinite; background: #10B981; }
    @keyframes pulse-anim {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Portfolio analytics */
    .risk-bar-track { height: 8px; background: #F0EEE9; border-radius: 100px; overflow: hidden; margin-top: 5px; }
    .risk-bar-fill { height: 100%; border-radius: 100px; transition: width 0.4s ease; }

    .type-pill {
      font-size: 12px; font-weight: 500; background: #F4F2EE; color: #4A4540;
      padding: 4px 10px; border-radius: 100px; border: 1px solid #E2E0DC;
      display: inline-flex; align-items: center; gap: 6px;
    }
  `],
  template: `
    <div class="page-bg">
      <app-navbar />

      <main style="max-width:1200px;margin:0 auto;padding:28px 24px;">
        <!-- Header -->
        <div style="margin-bottom:24px;">
          <h1 style="font-size:22px;font-weight:700;color:#1A1A2E;letter-spacing:-0.03em;">Overview</h1>
          <p style="font-size:14px;color:#7C7069;margin-top:3px;">AI-powered legal contract analysis, ML risk scoring & blockchain audit</p>
        </div>

        <!-- Stat Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:24px;">
          @for (stat of stats(); track stat.label) {
            <div class="stat-card">
              <div class="stat-accent" [style.background]="stat.accentColor"></div>
              <div style="padding-left:8px;">
                <div class="stat-icon-wrap" [style.background]="stat.iconBg">
                  <svg [attr.width]="18" [attr.height]="18" viewBox="0 0 24 24" fill="none"
                    [attr.stroke]="stat.iconColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path [attr.d]="stat.iconPath"/>
                  </svg>
                </div>
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
                @if (stat.change) {
                  <div class="stat-change" [style.color]="stat.changeColor">{{ stat.change }}</div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Portfolio Risk Intelligence Panel (If analytics available) -->
        @if (portfolio()) {
          <div class="panel" style="margin-bottom:24px;padding:20px 24px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
              <div>
                <div style="font-size:15px;font-weight:700;color:#1A1A2E;">Portfolio Risk Intelligence</div>
                <div style="font-size:12.5px;color:#7C7069;margin-top:2px;">Real-time risk distribution across all evaluated contracts</div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:12px;color:#7C7069;">Avg Portfolio Risk:</span>
                <span style="font-size:16px;font-weight:700;padding:2px 10px;border-radius:100px;"
                  [style.background]="getAvgRiskBg(portfolio().average_risk_score)"
                  [style.color]="getAvgRiskColor(portfolio().average_risk_score)">
                  {{ portfolio().average_risk_score }}%
                </span>
                @if (portfolio().top_risk_category && portfolio().top_risk_category !== 'N/A') {
                  <span style="font-size:12px;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;padding:3px 10px;border-radius:100px;font-weight:500;">
                    Top Risk: {{ portfolio().top_risk_category }}
                  </span>
                }
              </div>
            </div>

            <!-- Risk Distribution Bar -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:16px;">
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12.5px;">
                  <span style="color:#DC2626;font-weight:600;">High Risk ({{ portfolio().risk_distribution?.high || 0 }})</span>
                  <span style="color:#7C7069;">{{ getRiskPercentage(portfolio().risk_distribution?.high) }}%</span>
                </div>
                <div class="risk-bar-track">
                  <div class="risk-bar-fill" [style.width.%]="getRiskPercentage(portfolio().risk_distribution?.high)" style="background:#EF4444;"></div>
                </div>
              </div>
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12.5px;">
                  <span style="color:#D97706;font-weight:600;">Medium Risk ({{ portfolio().risk_distribution?.medium || 0 }})</span>
                  <span style="color:#7C7069;">{{ getRiskPercentage(portfolio().risk_distribution?.medium) }}%</span>
                </div>
                <div class="risk-bar-track">
                  <div class="risk-bar-fill" [style.width.%]="getRiskPercentage(portfolio().risk_distribution?.medium)" style="background:#F59E0B;"></div>
                </div>
              </div>
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12.5px;">
                  <span style="color:#059669;font-weight:600;">Low Risk ({{ portfolio().risk_distribution?.low || 0 }})</span>
                  <span style="color:#7C7069;">{{ getRiskPercentage(portfolio().risk_distribution?.low) }}%</span>
                </div>
                <div class="risk-bar-track">
                  <div class="risk-bar-fill" [style.width.%]="getRiskPercentage(portfolio().risk_distribution?.low)" style="background:#10B981;"></div>
                </div>
              </div>
            </div>

            <!-- Document Types Tag Cloud -->
            @if (getDocumentTypesList().length > 0) {
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:12px;border-top:1px solid #F0EEE9;">
                <span style="font-size:12px;color:#7C7069;font-weight:500;">Classified Types:</span>
                @for (item of getDocumentTypesList(); track item.type) {
                  <span class="type-pill">
                    {{ item.type }}
                    <strong style="color:#1A1A2E;">{{ item.count }}</strong>
                  </span>
                }
              </div>
            }
          </div>
        }

        <!-- Main Grid -->
        <div style="display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start;">

          <!-- Left Column -->
          <div style="display:flex;flex-direction:column;gap:16px;">

            <!-- Recent Documents -->
            <div class="panel">
              <div class="panel-header">
                <span class="panel-title">Recent Documents</span>
                <a routerLink="/documents" style="font-size:13px;color:#2563EB;font-weight:500;text-decoration:none;">View all →</a>
              </div>

              @if (loading()) {
                <div style="padding:40px;text-align:center;color:#A9A29A;font-size:14px;">Loading documents...</div>
              } @else if (recentDocs().length === 0) {
                <div style="padding:48px 24px;text-align:center;">
                  <div style="width:48px;height:48px;background:#F4F2EE;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A9A29A" stroke-width="1.8">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
                    </svg>
                  </div>
                  <p style="color:#7C7069;font-size:14px;">No documents yet</p>
                  <a routerLink="/documents" style="display:inline-block;margin-top:12px;font-size:13px;color:#2563EB;font-weight:500;text-decoration:none;">Upload your first document →</a>
                </div>
              } @else {
                @for (doc of recentDocs(); track doc.id) {
                  <a [routerLink]="['/documents', doc.id]" class="doc-row">
                    <div style="display:flex;align-items:center;gap:12px;">
                      <div class="doc-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div>
                        <p style="font-size:13.5px;font-weight:500;color:#1A1A2E;margin-bottom:2px;">{{ doc.original_filename }}</p>
                        <div style="display:flex;align-items:center;gap:6px;">
                          <span style="font-size:12px;color:#A9A29A;">{{ formatDate(doc.created_at) }}</span>
                          @if (doc.risk_level) {
                            <span style="font-size:11px;font-weight:600;padding:1px 6px;border-radius:4px;"
                              [style.background]="doc.risk_level === 'High' ? '#FEF2F2' : doc.risk_level === 'Medium' ? '#FFFBEB' : '#ECFDF5'"
                              [style.color]="doc.risk_level === 'High' ? '#DC2626' : doc.risk_level === 'Medium' ? '#B45309' : '#059669'">
                              {{ doc.risk_level }} Risk
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                    <span class="status-badge" [class]="getStatusClass(doc.status)">{{ doc.status }}</span>
                  </a>
                }
              }
            </div>

            <!-- Upcoming Contract Deadlines & Renewals Panel -->
            <div class="panel">
              <div class="panel-header">
                <div style="display:flex;align-items:center;gap:8px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span class="panel-title">Upcoming Contract Deadlines & Renewals</span>
                </div>
                <span style="font-size:11.5px;color:#7C7069;background:#F4F2EE;padding:2px 8px;border-radius:100px;">
                  {{ deadlines().length }} Recorded
                </span>
              </div>

              @if (deadlines().length === 0) {
                <div style="padding:28px 20px;text-align:center;color:#A9A29A;font-size:13px;">
                  No explicit termination dates or renewal deadlines identified yet. Upload contracts to populate dates.
                </div>
              } @else {
                <div style="display:flex;flex-direction:column;">
                  @for (item of deadlines().slice(0, 6); track $index) {
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #F4F2EE;flex-wrap:wrap;gap:8px;">
                      <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:32px;height:32px;background:#EFF6FF;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                          📅
                        </div>
                        <div>
                          <div style="font-size:13.5px;font-weight:600;color:#1A1A2E;">{{ item.date }}</div>
                          <div style="font-size:12px;color:#7C7069;">{{ item.context }} · <a [routerLink]="['/documents', item.document_id]" style="color:#2563EB;text-decoration:none;">{{ item.document_name }}</a></div>
                        </div>
                      </div>
                      <span style="font-size:11.5px;font-weight:500;padding:3px 9px;border-radius:100px;background:#EFF6FF;color:#1E40AF;border:1px solid #DBEAFE;">
                        {{ item.document_type || 'Milestone' }}
                      </span>
                    </div>
                  }
                </div>
              }
            </div>

          </div>

          <!-- Right Column -->
          <div style="display:flex;flex-direction:column;gap:14px;">

            <!-- Upload CTA -->
            <a routerLink="/documents" class="upload-cta">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div style="width:32px;height:32px;background:rgba(255,255,255,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                <span style="color:#fff;font-weight:600;font-size:14px;">Upload Legal Document</span>
              </div>
              <p style="color:rgba(255,255,255,0.75);font-size:12.5px;line-height:1.5;">Drop a PDF, DOCX, or TXT file for automated clause extraction & risk evaluation.</p>
            </a>

            <!-- Compare Contracts Quick Link -->
            <a routerLink="/documents" class="panel" style="padding:16px 20px;display:flex;align-items:center;gap:12px;text-decoration:none;border:1px solid #E2E8F0;background:#F8FAFC;">
              <div style="width:36px;height:36px;border-radius:9px;background:#EDE9FE;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 3h5v5M4 20L20.2 3.8M21 16v5h-5M15 15l5.1 5.1M4 4l5 5"/>
                </svg>
              </div>
              <div>
                <div style="font-size:13px;font-weight:600;color:#1A1A2E;">Compare Two Contracts</div>
                <div style="font-size:11.5px;color:#7C7069;margin-top:1px;">Diff clauses and compare risk shifts</div>
              </div>
            </a>

            <!-- Live System Health Panel -->
            <div class="panel">
              <div class="panel-header">
                <span class="panel-title">System Status & Architecture</span>
                <span style="font-size:11px;font-weight:600;color:#10B981;background:#ECFDF5;padding:2px 8px;border-radius:100px;">Active</span>
              </div>
              <div class="tech-row">
                <div class="tech-dot" style="background:#3B82F6;"></div>
                <div>
                  <div style="font-size:13px;font-weight:600;color:#1A1A2E;">NLP Processing</div>
                  <div style="font-size:11.5px;color:#64748B;">{{ health()?.nlp_engine || 'Legal NLP Suite' }}</div>
                </div>
              </div>
              <div class="tech-row">
                <div class="tech-dot" style="background:#8B5CF6;"></div>
                <div>
                  <div style="font-size:13px;font-weight:600;color:#1A1A2E;">Generative AI</div>
                  <div style="font-size:11.5px;color:#64748B;">{{ health()?.genai_provider || 'Google Gemini / Local RAG' }}</div>
                </div>
              </div>
              <div class="tech-row">
                <div class="tech-dot" style="background:#10B981;"></div>
                <div>
                  <div style="font-size:13px;font-weight:600;color:#1A1A2E;">Semantic Vector Index</div>
                  <div style="font-size:11.5px;color:#64748B;">TF-IDF + Cosine Similarity RAG</div>
                </div>
              </div>
              <div class="tech-row">
                <div class="tech-dot" style="background:#F59E0B;"></div>
                <div>
                  <div style="font-size:13px;font-weight:600;color:#1A1A2E;">Blockchain Ledger</div>
                  <div style="font-size:11.5px;color:#64748B;">{{ health()?.blockchain_network || 'Ganache Testnet' }}</div>
                </div>
              </div>
            </div>

            <!-- Blockchain Connectivity -->
            <div class="panel" style="padding:16px 20px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span class="panel-title">Blockchain Node</span>
                <div style="display:flex;align-items:center;gap:6px;">
                  <div class="blockchain-indicator" [class]="blockchainConnected() ? 'pulse-green' : ''" [style.background]="blockchainConnected() ? '' : '#EF4444'"></div>
                  <span style="font-size:12px;font-weight:500;" [style.color]="blockchainConnected() ? '#10B981' : '#EF4444'">
                    {{ blockchainConnected() ? 'Connected' : 'Simulated Ledger' }}
                  </span>
                </div>
              </div>
              <p style="font-size:12px;color:#A9A29A;line-height:1.5;">
                {{ blockchainConnected() ? 'Ganache node active on 8545. Transaction receipts recorded on-chain.' : 'Run start-blockchain.bat or npx ganache to toggle live Ethereum testnet.' }}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  recentDocs = signal<DocumentListItem[]>([]);
  blockchainConnected = signal(false);
  health = signal<any>(null);
  portfolio = signal<any>(null);
  deadlines = signal<any[]>([]);

  stats = signal([
    {
      label: 'Total Documents', value: '0', accentColor: '#2563EB', iconBg: '#EBF0F8',
      iconColor: '#2563EB', iconPath: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
      change: '', changeColor: '#7C7069'
    },
    {
      label: 'Analysed', value: '0', accentColor: '#10B981', iconBg: '#ECFDF5',
      iconColor: '#10B981', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      change: 'Completed', changeColor: '#10B981'
    },
    {
      label: 'High Risk', value: '0', accentColor: '#EF4444', iconBg: '#FEF2F2',
      iconColor: '#EF4444', iconPath: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
      change: 'Needs review', changeColor: '#EF4444'
    },
    {
      label: 'On-Chain', value: '0', accentColor: '#8B5CF6', iconBg: '#F5F3FF',
      iconColor: '#8B5CF6', iconPath: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
      change: 'Audit trail', changeColor: '#8B5CF6'
    },
  ]);

  constructor(private docService: DocumentService) {}

  ngOnInit() {
    this.loadDashboardData();
    this.loadHealth();
    this.loadPortfolio();
    this.loadDeadlines();
  }

  loadDashboardData() {
    this.docService.listDocuments().subscribe({
      next: (docs) => {
        this.recentDocs.set(docs.slice(0, 5));
        const completed = docs.filter(d => d.status === 'completed').length;
        const highRisk = docs.filter(d => (d as any).risk_level === 'High').length;
        this.stats.update(s => [
          { ...s[0], value: docs.length.toString() },
          { ...s[1], value: completed.toString() },
          { ...s[2], value: highRisk.toString() },
          { ...s[3], value: completed.toString() },
        ]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.docService.getBlockchainStatus().subscribe({
      next: (status: any) => this.blockchainConnected.set(status?.connected === true),
      error: () => this.blockchainConnected.set(false)
    });
  }

  loadPortfolio() {
    this.docService.getPortfolioAnalytics().subscribe({
      next: (data) => {
        if (data && data.total_documents > 0) {
          this.portfolio.set(data);
        }
      },
      error: () => {}
    });
  }

  loadDeadlines() {
    this.docService.getDeadlines().subscribe({
      next: (res) => {
        if (res && res.deadlines) {
          this.deadlines.set(res.deadlines);
        }
      },
      error: () => {}
    });
  }

  loadHealth() {
    this.docService.getSystemHealth().subscribe({
      next: (res) => this.health.set(res),
      error: () => {}
    });
  }

  getRiskPercentage(count: number | undefined): number {
    if (!count || !this.portfolio()?.analyzed_documents) return 0;
    return Math.round((count / this.portfolio().analyzed_documents) * 100);
  }

  getAvgRiskColor(score: number): string {
    if (score >= 60) return '#DC2626';
    if (score >= 35) return '#D97706';
    return '#059669';
  }

  getAvgRiskBg(score: number): string {
    if (score >= 60) return '#FEF2F2';
    if (score >= 35) return '#FFFBEB';
    return '#ECFDF5';
  }

  getDocumentTypesList(): { type: string; count: number }[] {
    const types = this.portfolio()?.document_types || {};
    return Object.entries(types).map(([type, count]) => ({ type, count: count as number }));
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
