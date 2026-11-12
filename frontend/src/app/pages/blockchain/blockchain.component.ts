import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-blockchain',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  styles: [`
    .page-bg { min-height: 100vh; background: #F7F6F3; }
    .panel { background:#fff; border:1px solid #ECEAE6; border-radius:16px; overflow:hidden; }
    .panel-body { padding:24px; }
    .panel-title { font-size:14px; font-weight:600; color:#1A1A2E; }

    .step-node {
      display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1;
    }
    .step-circle {
      width: 36px; height: 36px; border-radius: 50%;
      background: #EBF0F8; border: 2px solid #BFDBFE;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #1E3A5F;
      position: relative; z-index: 1;
    }
    .step-label { font-size: 11.5px; color: #7C7069; text-align: center; line-height: 1.4; }
    .step-connector {
      flex: 1; height: 2px; background: #DBEAFE; margin: 0 -4px; margin-top: -18px; position: relative; z-index: 0;
    }

    .stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; }
    .stat-box {
      background:#F4F2EE; border:1px solid #E2E0DC; border-radius:10px; padding:14px 16px;
    }
    .stat-box-label { font-size:11.5px; color:#A9A29A; margin-bottom:5px; }
    .stat-box-value { font-size:15px; font-weight:600; color:#1A1A2E; }

    .record-row {
      padding:18px 24px; border-bottom:1px solid #F4F2EE; transition:background 0.12s;
    }
    .record-row:last-child { border-bottom:none; }
    .record-row:hover { background:#FAFAF9; }

    .hash-chip {
      font-family:'Courier New',monospace; font-size:11.5px;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .hash-box-sm {
      background:#F4F2EE; border-radius:7px; padding:8px 12px; min-width:0;
    }
    .hash-lbl { font-size:11px; color:#A9A29A; margin-bottom:3px; }

    .verified-pill {
      font-size:11.5px; font-weight:500; padding:4px 10px; border-radius:100px;
      white-space:nowrap; flex-shrink:0;
    }
    .verified-yes { background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; }
    .verified-pending { background:#FFFBEB; color:#B45309; border:1px solid #FDE68A; }

    .status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .pulse-green { background:#10B981; animation:pulse-anim 2s ease-in-out infinite; }
    @keyframes pulse-anim { 0%,100%{opacity:1} 50%{opacity:0.4} }

    .info-banner {
      background:#EFF6FF; border:1px solid #BFDBFE; border-radius:12px;
      padding:16px 20px; display:flex; align-items:flex-start; gap:12px;
    }
  `],
  template: `
    <div class="page-bg">
      <app-navbar />

      <main style="max-width:1100px;margin:0 auto;padding:28px 24px;">
        <!-- Header -->
        <div style="margin-bottom:24px;">
          <h1 style="font-size:22px;font-weight:700;color:#1A1A2E;letter-spacing:-0.03em;">Blockchain Verification</h1>
          <p style="font-size:14px;color:#7C7069;margin-top:3px;">Tamper-proof document integrity using SHA-256 hashing on Ethereum / Ganache</p>
        </div>

        <!-- Info Banner -->
        <div class="info-banner" style="margin-bottom:20px;">
          <div style="width:32px;height:32px;background:#DBEAFE;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <div style="font-size:13.5px;font-weight:600;color:#1E40AF;margin-bottom:3px;">How Blockchain Integrity Works</div>
            <p style="font-size:13px;color:#3B82F6;line-height:1.6;">
              Every uploaded document is SHA-256 hashed server-side. The hash is recorded on the Ethereum testnet (Ganache) as an immutable transaction — proving the document existed at that exact timestamp without alteration.
            </p>
          </div>
        </div>

        <!-- Steps -->
        <div class="panel" style="margin-bottom:20px;">
          <div class="panel-body">
            <div class="panel-title" style="margin-bottom:20px;">Process Flow</div>
            <div style="display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding-bottom:4px;">
              @for (step of steps; track step.label; let last = $last; let i = $index) {
                <div class="step-node" style="min-width:90px;">
                  <div class="step-circle">{{ step.num }}</div>
                  <div class="step-label">{{ step.label }}</div>
                </div>
                @if (!last) {
                  <div style="flex:1;min-width:24px;height:2px;background:#DBEAFE;margin-top:17px;flex-shrink:0;"></div>
                }
              }
            </div>
          </div>
        </div>

        <!-- Network Status + Stats -->
        <div class="panel" style="margin-bottom:20px;">
          <div class="panel-body">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px;">
              <div class="panel-title">Network Status</div>
              @if (networkStatus()) {
                <div style="display:flex;align-items:center;gap:7px;">
                  <div class="status-dot" [class]="networkStatus().connected ? 'pulse-green' : ''" [style.background]="networkStatus().connected ? '' : '#EF4444'"></div>
                  <span style="font-size:13px;font-weight:500;" [style.color]="networkStatus().connected ? '#059669' : '#EF4444'">
                    {{ networkStatus().connected ? 'Ganache Connected' : 'Offline — Simulated Mode' }}
                  </span>
                </div>
              }
            </div>

            @if (networkStatus()) {
              <div class="stat-grid">
                <div class="stat-box">
                  <div class="stat-box-label">Network</div>
                  <div class="stat-box-value">{{ networkStatus().network || 'Local Testnet' }}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-box-label">Latest Block</div>
                  <div class="stat-box-value">#{{ networkStatus().block_number || '—' }}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-box-label">Smart Contract</div>
                  <div class="stat-box-value" [style.color]="networkStatus().contract_deployed ? '#059669' : '#B45309'">
                    {{ networkStatus().contract_deployed ? 'Deployed' : 'Local Proof Active' }}
                  </div>
                </div>
                <div class="stat-box">
                  <div class="stat-box-label">Total Records</div>
                  <div class="stat-box-value">{{ records().length }}</div>
                </div>
              </div>
            } @else {
              <div style="color:#A9A29A;font-size:14px;">Checking network status...</div>
            }
          </div>
        </div>

        <!-- Records Table -->
        <div class="panel">
          <div style="padding:16px 24px;border-bottom:1px solid #ECEAE6;display:flex;align-items:center;justify-content:space-between;">
            <span class="panel-title">
              Hash Records
              <span style="color:#A9A29A;font-weight:400;font-size:13px;margin-left:4px;">({{ records().length }})</span>
            </span>
            <a routerLink="/documents" style="font-size:13px;color:#2563EB;font-weight:500;text-decoration:none;">+ Upload Document</a>
          </div>

          @if (records().length === 0) {
            <div style="padding:60px 24px;text-align:center;">
              <div style="width:52px;height:52px;background:#F4F2EE;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4BFB9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <p style="color:#7C7069;font-size:14px;margin-bottom:4px;">No blockchain records yet</p>
              <p style="color:#C4BFB9;font-size:13px;">Upload and analyze a document to create an immutable on-chain proof</p>
            </div>
          } @else {
            @for (record of records(); track record.document_id) {
              <div class="record-row">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
                  <div>
                    <p style="font-size:14px;font-weight:600;color:#1A1A2E;margin-bottom:3px;">{{ record.original_filename }}</p>
                    <p style="font-size:12px;color:#A9A29A;">Contract ID: CNT-{{ record.document_id }}</p>
                  </div>
                  <span class="verified-pill" [class]="record.is_verified ? 'verified-yes' : 'verified-pending'">
                    {{ record.is_verified ? 'Verified On-Chain' : 'Pending' }}
                  </span>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">
                  <div class="hash-box-sm">
                    <div class="hash-lbl">SHA-256 Document Hash</div>
                    <div class="hash-chip" style="color:#059669;">{{ record.document_hash }}</div>
                  </div>
                  <div class="hash-box-sm">
                    <div class="hash-lbl">Transaction Hash</div>
                    <div class="hash-chip" style="color:#2563EB;">{{ record.transaction_hash }}</div>
                  </div>
                </div>

                <div style="display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap;">
                  <span style="font-size:12px;color:#A9A29A;">Block #{{ record.block_number }}</span>
                  <span style="color:#D1CDC5;">·</span>
                  <span style="font-size:12px;color:#A9A29A;">{{ record.network }}</span>
                  <span style="color:#D1CDC5;">·</span>
                  <span style="font-size:12px;color:#A9A29A;">{{ formatDate(record.timestamp) }}</span>
                  <a [routerLink]="['/documents', record.document_id]"
                    style="font-size:12px;color:#2563EB;font-weight:500;text-decoration:none;margin-left:auto;">
                    View Document →
                  </a>
                </div>
              </div>
            }
          }
        </div>
      </main>
    </div>
  `
})
export class BlockchainComponent implements OnInit {
  records = signal<any[]>([]);
  networkStatus = signal<any>(null);

  steps = [
    { num: '1', label: 'Document Uploaded' },
    { num: '2', label: 'SHA-256 Hash Computed' },
    { num: '3', label: 'Hash → Blockchain Tx' },
    { num: '4', label: 'Block Confirmed' },
    { num: '5', label: 'Immutable Proof' },
  ];

  constructor(private docService: DocumentService) {}

  ngOnInit() {
    this.docService.getBlockchainRecords().subscribe({
      next: (r) => this.records.set(r || []),
      error: () => this.records.set([])
    });
    this.docService.getBlockchainStatus().subscribe({
      next: (s) => this.networkStatus.set(s),
      error: () => this.networkStatus.set({ connected: false, network: 'Simulated' })
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
