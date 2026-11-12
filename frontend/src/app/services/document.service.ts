import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentListItem, DocumentDetail, DocumentUploadResponse } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly API_URL = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  uploadDocument(file: File): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DocumentUploadResponse>(`${this.API_URL}/api/documents/upload`, formData);
  }

  listDocuments(): Observable<DocumentListItem[]> {
    return this.http.get<DocumentListItem[]>(`${this.API_URL}/api/documents/`);
  }

  getDocument(id: number): Observable<DocumentDetail> {
    return this.http.get<DocumentDetail>(`${this.API_URL}/api/documents/${id}`);
  }

  getDocumentStatus(id: number): Observable<{ id: number; status: string; error_message?: string }> {
    return this.http.get<{ id: number; status: string; error_message?: string }>(`${this.API_URL}/api/documents/${id}/status`);
  }

  deleteDocument(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/api/documents/${id}`);
  }

  askQuestion(documentId: number, question: string): Observable<{ question: string; answer: string }> {
    return this.http.post<{ question: string; answer: string }>(
      `${this.API_URL}/api/analysis/${documentId}/ask`,
      { question }
    );
  }

  explainClause(clauseText: string): Observable<{ clause: string; explanation: string }> {
    return this.http.post<{ clause: string; explanation: string }>(
      `${this.API_URL}/api/analysis/explain-clause`,
      { clause_text: clauseText }
    );
  }

  getRecommendations(documentId: number): Observable<{ recommendations: string }> {
    return this.http.get<{ recommendations: string }>(
      `${this.API_URL}/api/analysis/${documentId}/recommendations`
    );
  }

  compareDocuments(doc1Id: number, doc2Id: number): Observable<any> {
    return this.http.post<any>(
      `${this.API_URL}/api/documents/compare`,
      { doc1_id: doc1Id, doc2_id: doc2Id }
    );
  }

  getBlockchainStatus(): Observable<any> {
    return this.http.get(`${this.API_URL}/api/blockchain/status`);
  }

  getBlockchainRecords(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/api/blockchain/records`);
  }

  verifyDocument(documentId: number, file?: File): Observable<any> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    return this.http.post(`${this.API_URL}/api/blockchain/verify/${documentId}`, formData);
  }

  getSystemHealth(): Observable<any> {
    return this.http.get(`${this.API_URL}/api/health`);
  }

  rewriteClause(clauseText: string, riskTolerance: string): Observable<any> {
    return this.http.post(`${this.API_URL}/api/analysis/rewrite-clause`, {
      clause_text: clauseText,
      risk_tolerance: riskTolerance
    });
  }

  getPortfolioAnalytics(): Observable<any> {
    return this.http.get(`${this.API_URL}/api/documents/analytics/portfolio`);
  }

  getDeadlines(): Observable<{ deadlines: any[]; total: number }> {
    return this.http.get<{ deadlines: any[]; total: number }>(`${this.API_URL}/api/documents/analytics/deadlines`);
  }

  chatWithDocument(documentId: number, messages: { role: string; content: string }[]): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(
      `${this.API_URL}/api/analysis/${documentId}/chat`,
      { messages }
    );
  }

  exportRedraftedDocx(documentId: number, originalClause: string, rewrittenClause: string, riskTolerance: string): Observable<Blob> {
    return this.http.post(
      `${this.API_URL}/api/analysis/${documentId}/export-redrafted`,
      {
        original_clause: originalClause,
        rewritten_clause: rewrittenClause,
        risk_tolerance: riskTolerance
      },
      { responseType: 'blob' }
    );
  }
}
