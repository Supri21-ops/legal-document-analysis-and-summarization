import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { DocumentService } from '../../services/document.service';
import { DocumentListItem } from '../../models/document.model';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  styles: [`
    .page-bg { min-height: 100vh; background: #F7F6F3; }

    .upload-zone {
      background: #fff;
      border: 2px dashed #D1CDC5;
      border-radius: 16px;
      padding: 40px 24px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      position: relative;
    }
    .upload-zone:hover { border-color: #2563EB; background: #F8FAFF; }
    .upload-zone.dragging { border-color: #2563EB; background: #EBF0F8; }

    .upload-icon-ring {
      width: 52px; height: 52px;
      background: #EBF0F8; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 14px;
    }

    .panel {
      background: #fff;
      border: 1px solid #ECEAE6;
      border-radius: 16px;
      overflow: hidden;
    }
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #ECEAE6;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 10px;
    }
    .panel-title { font-size: 14px; font-weight: 600; color: #1A1A2E; }

    .doc-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid #F4F2EE;
      transition: background 0.12s;
    }
    .doc-row:last-child { border-bottom: none; }
    .doc-row:hover { background: #FAFAF9; }

    .doc-icon {
      width: 38px; height: 38px; border-radius: 10px;
      background: #EBF0F8;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .hash-chip {
      font-family: 'Courier New', monospace;
      font-size: 11px; color: #A9A29A;
      background: #F4F2EE; border-radius: 4px;
      padding: 2px 6px;
    }

    .status-badge { font-size: 11.5px; font-weight: 500; padding: 3px 9px; border-radius: 100px; }

    .btn-view {
      font-size: 12.5px; font-weight: 500; color: #2563EB;
      background: #EBF0F8; border: none;
      border-radius: 7px; padding: 6px 12px;
      cursor: pointer; text-decoration: none;
      transition: background 0.12s;
    }
    .btn-view:hover { background: #DBEAFE; }

    .btn-delete {
      background: none; border: none; cursor: pointer;
      color: #C4BFB9; padding: 6px; border-radius: 6px;
      transition: color 0.12s, background 0.12s;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-delete:hover { color: #DC2626; background: #FEF2F2; }

    .btn-action {
      font-size: 13px; color: #7C7069;
      background: none; border: 1px solid #E2E0DC;
      border-radius: 7px; padding: 5px 12px;
      cursor: pointer; transition: background 0.12s, color 0.12s;
    }
    .btn-action:hover { background: #F4F2EE; color: #1A1A2E; }

    .btn-compare {
      background: #1E3A5F; color: #fff; border: none;
      border-radius: 7px; padding: 6px 14px; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-compare:hover { background: #16304F; }

    .alert-success { background:#ECFDF5; border:1px solid #A7F3D0; border-radius:10px; padding:10px 16px; color:#059669; font-size:13px; }
    .alert-error   { background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; padding:10px 16px; color:#DC2626; font-size:13px; }

    .compare-box {
      background: #F8FAFC; border: 1px solid #E2E8F0;
      border-radius: 14px; padding: 20px; margin-bottom: 20px;
    }

    .spinner { animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  template: `
    <div class="page-bg">
      <app-navbar />

      <main style="max-width:1200px;margin:0 auto;padding:28px 24px;">
        <!-- Header -->
        <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:22px;font-weight:700;color:#1A1A2E;letter-spacing:-0.03em;">Legal Documents</h1>
            <p style="font-size:14px;color:#7C7069;margin-top:3px;">Automated NLP Extraction, ML Risk Scoring, RAG Q&A & Blockchain Verification</p>
          </div>
          <button (click)="toggleCompareBox()" class="btn-compare">
            {{ showCompare() ? 'Close Comparison' : '⇄ Compare Two Contracts' }}
          </button>
        </div>

        <!-- Contract Comparison Workspace -->
        @if (showCompare()) {
          <div class="compare-box">
            <h3 style="font-size:15px;font-weight:700;color:#1E293B;margin-bottom:6px;">Contract Differential & Risk Trend Analyzer</h3>
            <p style="font-size:13px;color:#64748B;margin-bottom:16px;">Select two analyzed documents to compute risk deltas, clause modifications, and categorical shifts.</p>

            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px;">
              <select [(ngModel)]="compareDoc1" style="padding:8px 12px;border-radius:8px;border:1px solid #CBD5E1;font-size:13px;min-width:200px;">
                <option [ngValue]="null">Select Baseline Contract (V1)</option>
                @for (d of completedDocs(); track d.id) {
                  <option [ngValue]="d.id">{{ d.original_filename }} (Risk: {{ d.overall_risk_score ?? 'N/A' }}%)</option>
                }
              </select>

              <span style="font-weight:700;color:#94A3B8;">VS</span>

              <select [(ngModel)]="compareDoc2" style="padding:8px 12px;border-radius:8px;border:1px solid #CBD5E1;font-size:13px;min-width:200px;">
                <option [ngValue]="null">Select Revised Contract (V2)</option>
                @for (d of completedDocs(); track d.id) {
                  <option [ngValue]="d.id">{{ d.original_filename }} (Risk: {{ d.overall_risk_score ?? 'N/A' }}%)</option>
                }
              </select>

              <button (click)="runComparison()" [disabled]="!compareDoc1 || !compareDoc2 || comparing()" class="btn-compare">
                @if (comparing()) { Analyzing Delta... } @else { Run Comparison }
              </button>
            </div>

            <!-- Comparison Results Output -->
            @if (compareResult()) {
              <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:18px;margin-top:14px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
                  <span style="font-size:14px;font-weight:700;color:#0F172A;">Comparison Overview</span>
                  <span style="font-size:12px;font-weight:600;padding:4px 10px;border-radius:100px;"
                    [style.background]="compareResult().risk_delta > 0 ? '#FEF2F2' : '#ECFDF5'"
                    [style.color]="compareResult().risk_delta > 0 ? '#DC2626' : '#059669'">
                    Trend: {{ compareResult().risk_trend }} (Delta: {{ compareResult().risk_delta > 0 ? '+' : '' }}{{ compareResult().risk_delta }}%)
                  </span>
                </div>

                <p style="font-size:13.5px;color:#334155;line-height:1.6;margin-bottom:16px;">{{ compareResult().summary }}</p>

                <!-- Side by side stats -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                  <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px;">
                    <div style="font-size:12px;color:#64748B;">Baseline: {{ compareResult().doc1.filename }}</div>
                    <div style="font-size:18px;font-weight:700;color:#1E293B;margin-top:4px;">{{ compareResult().doc1.risk_score }}% Risk</div>
                    <div style="font-size:12px;color:#94A3B8;">{{ compareResult().doc1.clause_count }} Clauses · {{ compareResult().high_risk_clauses_doc1_count }} High Risk</div>
                  </div>
                  <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px;">
                    <div style="font-size:12px;color:#64748B;">Revised: {{ compareResult().doc2.filename }}</div>
                    <div style="font-size:18px;font-weight:700;color:#1E293B;margin-top:4px;">{{ compareResult().doc2.risk_score }}% Risk</div>
                    <div style="font-size:12px;color:#94A3B8;">{{ compareResult().doc2.clause_count }} Clauses · {{ compareResult().high_risk_clauses_doc2_count }} High Risk</div>
                  </div>
                </div>

                <!-- Categorical changes table -->
                <h4 style="font-size:13px;font-weight:600;color:#334155;margin-bottom:8px;">Clause Distribution Shift</h4>
                <div style="overflow-x:auto;">
                  <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
                    <thead>
                      <tr style="border-bottom:1px solid #E2E8F0;color:#64748B;text-align:left;">
                        <th style="padding:6px 8px;">Clause Category</th>
                        <th style="padding:6px 8px;text-align:center;">V1 Count</th>
                        <th style="padding:6px 8px;text-align:center;">V2 Count</th>
                        <th style="padding:6px 8px;text-align:right;">Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of compareResult().category_distribution; track row.category) {
                        <tr style="border-bottom:1px solid #F1F5F9;">
                          <td style="padding:6px 8px;font-weight:500;color:#1E293B;">{{ row.category }}</td>
                          <td style="padding:6px 8px;text-align:center;color:#64748B;">{{ row.doc1_count }}</td>
                          <td style="padding:6px 8px;text-align:center;color:#64748B;">{{ row.doc2_count }}</td>
                          <td style="padding:6px 8px;text-align:right;font-weight:600;"
                            [style.color]="row.delta > 0 ? '#2563EB' : row.delta < 0 ? '#DC2626' : '#94A3B8'">
                            {{ row.delta > 0 ? '+' : '' }}{{ row.delta }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        }

        <!-- Upload Area -->
        <div
          class="upload-zone"
          [class.dragging]="isDragging()"
          (dragover)="onDragOver($event)"
          (dragleave)="isDragging.set(false)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
          style="margin-bottom:20px;"
        >
          <input #fileInput type="file" accept=".pdf,.docx,.txt" style="display:none;" (change)="onFileSelect($event)" />

          @if (uploading()) {
            <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
              <div class="upload-icon-ring">
                <svg class="spinner" style="width:24px;height:24px;color:#2563EB;" viewBox="0 0 24 24" fill="none">
                  <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
              <p style="font-size:14px;font-weight:500;color:#2563EB;">Streaming & processing document...</p>
              <p style="font-size:12.5px;color:#A9A29A;">NLP extraction, ML risk scoring & vector indexing in progress</p>
            </div>
          } @else {
            <div class="upload-icon-ring">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
              </svg>
            </div>
            <p style="font-size:15px;font-weight:600;color:#1A1A2E;margin-bottom:4px;">Drop your contract here</p>
            <p style="font-size:13.5px;color:#7C7069;margin-bottom:8px;">or <span style="color:#2563EB;font-weight:500;">browse files</span> to upload</p>
            <p style="font-size:12px;color:#C4BFB9;">PDF, DOCX, TXT supported · Stream-validated upload up to 50MB</p>
          }
        </div>

        @if (uploadError()) {
          <div class="alert-error" style="margin-bottom:14px;">{{ uploadError() }}</div>
        }
        @if (uploadSuccess()) {
          <div class="alert-success" style="margin-bottom:14px;">{{ uploadSuccess() }}</div>
        }

        <!-- Documents Table -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">All Documents <span style="color:#A9A29A;font-weight:400;">({{ documents().length }})</span></span>
            <button (click)="loadDocuments()" class="btn-action">↻ Refresh</button>
          </div>

          @if (loading()) {
            <div style="padding:40px;text-align:center;color:#A9A29A;font-size:14px;">Loading documents...</div>
          } @else if (documents().length === 0) {
            <div style="padding:56px 24px;text-align:center;">
              <div style="width:52px;height:52px;background:#F4F2EE;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4BFB9" stroke-width="1.8">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p style="color:#7C7069;font-size:14px;margin-bottom:4px;">No documents uploaded yet</p>
              <p style="color:#C4BFB9;font-size:13px;">Drop a file above to start analysis</p>
            </div>
          } @else {
            @for (doc of documents(); track doc.id) {
              <div class="doc-row">
                <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0;">
                  <div class="doc-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                      [attr.stroke]="doc.file_type === 'pdf' ? '#EF4444' : doc.file_type === 'docx' ? '#2563EB' : '#6B7280'"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div style="min-width:0;">
                    <p style="font-size:14px;font-weight:500;color:#1A1A2E;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ doc.original_filename }}</p>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                      <span style="font-size:12px;color:#A9A29A;">{{ formatSize(doc.file_size) }}</span>
                      <span style="color:#D1CDC5;font-size:11px;">·</span>
                      <span style="font-size:12px;color:#A9A29A;">{{ formatDate(doc.created_at) }}</span>
                      <span style="color:#D1CDC5;font-size:11px;">·</span>
                      <span class="hash-chip">{{ doc.document_hash.substring(0, 10) }}…</span>

                      @if (doc.status === 'processing') {
                        <span style="color:#D1CDC5;font-size:11px;">·</span>
                        <span style="font-size:12px;color:#2563EB;font-weight:500;">
                          <svg class="spinner" style="width:10px;height:10px;display:inline;margin-right:3px;" viewBox="0 0 24 24" fill="none">
                            <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          {{ doc.processing_step || 'Processing in background...' }}
                        </span>
                      }

                      @if (doc.status === 'failed') {
                        <span style="color:#D1CDC5;font-size:11px;">·</span>
                        <span style="font-size:12px;color:#DC2626;font-weight:500;">{{ doc.error_message || 'Processing failed' }}</span>
                      }
                    </div>
                  </div>
                </div>

                <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;margin-left:16px;">
                  <span class="status-badge" [class]="getStatusClass(doc.status)">{{ doc.status }}</span>
                  @if (doc.status === 'completed') {
                    <a [routerLink]="['/documents', doc.id]" class="btn-view">View Analysis</a>
                  }
                  <button (click)="deleteDoc(doc.id)" class="btn-delete" title="Delete document">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </main>
    </div>
  `
})
export class DocumentsComponent implements OnInit, OnDestroy {
  documents = signal<DocumentListItem[]>([]);
  loading = signal(true);
  uploading = signal(false);
  isDragging = signal(false);
  uploadError = signal('');
  uploadSuccess = signal('');

  showCompare = signal(false);
  compareDoc1: number | null = null;
  compareDoc2: number | null = null;
  comparing = signal(false);
  compareResult = signal<any>(null);

  private pollInterval: any;

  constructor(private docService: DocumentService) {}

  ngOnInit() { this.loadDocuments(); this.startPolling(); }
  ngOnDestroy() { if (this.pollInterval) clearInterval(this.pollInterval); }

  startPolling() {
    this.pollInterval = setInterval(() => {
      const hasProcessing = this.documents().some(d => d.status === 'processing' || d.status === 'uploaded');
      if (hasProcessing) this.loadDocuments();
    }, 4000);
  }

  loadDocuments() {
    this.docService.listDocuments().subscribe({
      next: (docs) => { this.documents.set(docs); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  completedDocs() {
    return this.documents().filter(d => d.status === 'completed');
  }

  toggleCompareBox() {
    this.showCompare.update(v => !v);
  }

  runComparison() {
    if (!this.compareDoc1 || !this.compareDoc2) return;
    this.comparing.set(true);
    this.docService.compareDocuments(this.compareDoc1, this.compareDoc2).subscribe({
      next: (res) => {
        this.compareResult.set(res);
        this.comparing.set(false);
      },
      error: (err) => {
        alert(err.error?.detail || 'Comparison failed.');
        this.comparing.set(false);
      }
    });
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging.set(true); }

  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  onFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.uploadFile(file);
  }

  uploadFile(file: File) {
    this.uploading.set(true); this.uploadError.set(''); this.uploadSuccess.set('');
    this.docService.uploadDocument(file).subscribe({
      next: (res) => {
        this.uploadSuccess.set(`Document uploaded successfully! Analysis started.`);
        this.uploading.set(false);
        this.loadDocuments();
      },
      error: (err) => {
        this.uploadError.set(err.error?.detail || 'Upload failed. Please check file format.');
        this.uploading.set(false);
      }
    });
  }

  deleteDoc(id: number) {
    if (confirm('Delete this document and its analysis record?')) {
      this.docService.deleteDocument(id).subscribe(() => this.loadDocuments());
    }
  }

  getStatusClass(status: string) {
    const map: Record<string, string> = {
      completed: 'status-completed',
      processing: 'status-processing',
      uploaded: 'status-uploaded',
      failed: 'status-failed',
    };
    return map[status] || 'status-default';
  }

  formatSize(bytes: number) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
