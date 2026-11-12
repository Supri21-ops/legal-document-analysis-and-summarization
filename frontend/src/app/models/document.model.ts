export interface DocumentUploadResponse {
  message: string;
  document_id: number;
  document_hash: string;
  status: string;
}

export interface DocumentListItem {
  id: number;
  original_filename: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  processing_step?: string;
  error_message?: string;
  document_hash: string;
  created_at: string;
  file_type: string;
  file_size: number;
  overall_risk_score?: number | null;
  risk_level?: 'Low' | 'Medium' | 'High' | null;
}

export interface ClauseItem {
  text: string;
  category: string;
  risk_level: 'Low' | 'Medium' | 'High';
  risk_score: number;
}

export interface DocumentAnalysis {
  summary: string;
  parties: { name: string; type: string }[];
  important_dates: { date: string; context: string }[];
  obligations: string[];
  clauses: ClauseItem[];
  entities: Record<string, string[]>;
  overall_risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  high_risk_clauses_count: number;
  total_clauses_count: number;
}

export interface BlockchainRecord {
  document_hash: string;
  transaction_hash: string;
  block_number: number;
  network: string;
  timestamp: string;
  is_verified: boolean;
}

export interface DocumentDetail {
  id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  document_hash: string;
  status: string;
  processing_step?: string;
  error_message?: string;
  created_at: string;
  document_type?: string;
  is_legal_contract?: boolean;
  anomaly_warning?: string;
  analysis: DocumentAnalysis | null;
  blockchain: BlockchainRecord | null;
}
