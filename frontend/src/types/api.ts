export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export interface Evaluation {
  id: number;
  uuid: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: number;
  filename: string;
  fileType: string;
  fileSize: number;
  hasExtractedText: boolean;
  createdAt: string;
}

export interface EvidenceDetail extends Evidence {
  extractedText: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ReportSummary {
  id: number;
  uuid: string;
  title: string;
  status: string;
  score: number | null;
  summary: string | null;
  createdAt: string;
  evaluation: {
    id: number;
    title: string;
    status: string;
  };
}

export interface ReportDetail extends ReportSummary {
  content: string | null;
  recommendations: string[];
  updatedAt: string;
  evaluation: {
    id: number;
    uuid: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface GeneratedReport {
  systemId: string;
  systemName: string;
  generatedAt: string;
  reportId?: number | null;
  score?: number | null;
  content: string;
  sourceData: Record<string, unknown>;
}

export type KnowledgeAnswer = {
  question: string;
  answer: string;
  sources: Array<{
    title?: string;
    url?: string;
    source?: string;
    score?: number;
    rawScore?: number;
    snippet?: string;
    content?: string;
  }>;
  confidence: number;
};

export type KnowledgeSearchResult = {
  query: string;
  results: Array<{
    id?: string;
    title: string;
    snippet: string;
    score?: number;
    rawScore?: number;
    content?: string;
    source?: string;
  }>;
};

export interface DashboardStats {
  totalEvaluations: number;
  totalReports: number;
  totalEvidences: number;
  pendingEvaluations: number;
}

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
};
