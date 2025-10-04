/**
 * Seed Data Types for Literacy Assessment System
 */

export interface QuestionOption {
  id: number;
  text: string;
}

export interface TestTemplateSeed {
  templateCode: string;
  grade: number;
  title: string;
  version: string;
  totalQuestions: number;
  timeLimit: number;
  isActive: boolean;
}

export interface QuestionSeed {
  templateCode: string;
  questionNumber: number;
  category: 'vocabulary' | 'reading' | 'grammar' | 'reasoning';
  questionType: 'choice' | 'short_answer' | 'essay';
  questionText: string;
  passage?: string;
  options?: QuestionOption[];
  correctAnswer: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

export interface GradeSeedData {
  template: TestTemplateSeed;
  questions: QuestionSeed[];
}
