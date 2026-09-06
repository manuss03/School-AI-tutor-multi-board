export interface UserProfile {
  id: string;
  user_id?: string;
  board: string;
  region: string;
  city: string;
  class_level: string;
  subject: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessageDB {
  id?: string;
  profile_id?: string;
  user_id?: string;
  role: "user" | "assistant";
  content: string;
  mode: "learn" | "test";
  created_at?: string;
}

export interface ChatMessageUI {
  role: "user" | "assistant";
  content: string;
  id?: string;
}

export interface QuizQuestion {
  id: number;
  type: "mcq" | "short_answer";
  question: string;
  options?: string[];
  correctAnswer?: number;
  modelAnswer?: string;
  explanation?: string;
  marks: number;
}

export interface QuizAnswer {
  questionId: number;
  answer: string | number | null;
}

export interface QuizEvaluationResult {
  id: number;
  correct: boolean;
  awardedMarks: number;
  feedback: string;
}

export interface QuizEvaluation {
  results: QuizEvaluationResult[];
  totalScore: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  overallFeedback: string;
  improvementAreas: string[];
  strengths: string[];
}

export interface QuizSession {
  id: string;
  profile_id: string;
  user_id?: string;
  subject: string;
  topic: string;
  quiz_type: "quiz" | "mock_exam";
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  score: number;
  total: number;
  feedback?: QuizEvaluation | null;
  status: "in_progress" | "completed";
  created_at?: string;
  completed_at?: string | null;
}

export type LLMProvider = "openai" | "anthropic" | "perplexity" | "groq" | "gemini" | "mistral" | "openrouter";

export interface LLMSettings {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type AppMode = "learn" | "test" | "progress" | "settings";

export type QuizConfig = {
  quizType: "quiz" | "mock_exam";
  topic: string;
  numQuestions: number;
  questionTypes: string[];
  difficulty: string;
};
