export interface ImportJobError {
  row: number;
  name: string;
  reason: string;
}

export interface ImportJobSummary {
  total: number;
  imported: number;
  merged: number;
  skipped: number;
  errors: ImportJobError[];
}

export interface ImportJob {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  platform: string;
  collection_id: string | null;
  summary: ImportJobSummary | null;
  created_at: string;
  updated_at: string;
}
