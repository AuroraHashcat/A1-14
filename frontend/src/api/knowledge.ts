import { apiFetch, API_BASE_URL } from './client';
import { KnowledgeAnswer, KnowledgeSearchResult } from '../types/api';
import { FileDownload, extractFilenameFromResponse } from '../utils/download';

export type GeneratedQuestion = {
  question: string;
  options?: string[] | Record<string, string>;
  answer?: string;
  correct_answer?: string;
  explanation?: string;
  analysis?: string;
};

type KnowledgeAnswerRecord = {
  question: string;
  answer: string;
  confidence: number;
  sources: Array<{
    title?: string;
    url?: string;
    source?: string;
    score?: number;
    rawScore?: number;
    snippet?: string;
    content?: string;
  }>;
};

type KnowledgeSearchRecord = {
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

type GeneratedQuestionRecord = {
  topic: string;
  difficulty: string;
  questions: GeneratedQuestion[];
};

export async function queryKnowledge(question: string): Promise<KnowledgeAnswer> {
  const data = await apiFetch<KnowledgeAnswerRecord>('/knowledge/query', {
    method: 'POST',
    body: JSON.stringify({ question })
  });
  return {
    question: data.question,
    answer: data.answer,
    confidence: data.confidence,
    sources: data.sources ?? []
  };
}

export async function searchKnowledge(query: string, limit = 5): Promise<KnowledgeSearchResult> {
  const data = await apiFetch<KnowledgeSearchRecord>('/knowledge/search', {
    method: 'POST',
    body: JSON.stringify({ query, limit })
  });
  return {
    query: data.query,
    results: data.results ?? []
  };
}

export async function generateQuestions(
  topic: string,
  difficulty: string,
  count: number
): Promise<GeneratedQuestion[]> {
  const data = await apiFetch<GeneratedQuestionRecord>('/knowledge/generate-questions', {
    method: 'POST',
    body: JSON.stringify({ topic, difficulty, count })
  });
  return data.questions;
}

export async function exportQuestionsDocx(
  topic: string,
  difficulty: string,
  questions: GeneratedQuestion[]
): Promise<FileDownload> {
  const response = await fetch(`${API_BASE_URL}/knowledge/questions/export`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ topic, difficulty, questions })
  });

  if (!response.ok) {
    let message = '题库导出失败';
    try {
      const payload = await response.json();
      message = payload?.error ?? message;
    } catch (error) {
      console.error('Failed to parse export error response', error);
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename = extractFilenameFromResponse(response, '密评题库.docx');

  return { blob, filename };
}
