import type {
  AuthUser,
  ChatMessageUI,
  LLMSettings,
  QuizConfig,
  QuizEvaluation,
  QuizQuestion,
  UserProfile,
} from "@/types";
import { supabase } from "./supabase";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor-chat`;

// --- Auth helpers ---

export async function getSession(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return { id: session.user.id, email: session.user.email || "" };
  }
  return null;
}

export async function signUpWithEmail(email: string, password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signInWithEmail(email: string, password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signInWithApple(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo: window.location.origin },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// --- LLM API calls (now use the user's session token, no apiKey in body) ---

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  return {
    Authorization: `Bearer ${token}`,
    apikey: anonKey,
    "Content-Type": "application/json",
  };
}

interface LLMCallParams {
  messages: ChatMessageUI[];
  profile: UserProfile;
  mode?: "learn" | "test";
}

export async function callTutor({ messages, profile, mode = "learn" }: LLMCallParams): Promise<string> {
  const headers = await getAuthHeaders();
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      profile: {
        board: profile.board,
        region: profile.region,
        city: profile.city,
        class_level: profile.class_level,
        subject: profile.subject,
      },
      mode,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errorData.error || `Request failed (${response.status})`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.data as string;
}

export async function generateQuiz(profile: UserProfile, config: QuizConfig): Promise<QuizQuestion[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      profile: {
        board: profile.board,
        region: profile.region,
        city: profile.city,
        class_level: profile.class_level,
        subject: profile.subject,
      },
      mode: "generate_quiz",
      quizConfig: config,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errorData.error || `Request failed (${response.status})`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.data.questions as QuizQuestion[];
}

export async function evaluateQuiz(
  profile: UserProfile,
  questions: QuizQuestion[],
  answers: { questionId: number; answer: string | number | null }[]
): Promise<QuizEvaluation> {
  const headers = await getAuthHeaders();
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      profile: {
        board: profile.board,
        region: profile.region,
        city: profile.city,
        class_level: profile.class_level,
        subject: profile.subject,
      },
      mode: "evaluate_quiz",
      quizData: { questions, answers },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errorData.error || `Request failed (${response.status})`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.data as QuizEvaluation;
}

export async function testConnection(profile: UserProfile): Promise<{ success: boolean; message: string }> {
  const headers = await getAuthHeaders();
  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        profile: {
          board: profile.board,
          region: profile.region,
          city: profile.city,
          class_level: profile.class_level,
          subject: profile.subject,
        },
        mode: "test_connection",
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return { success: false, message: data.error || `Request failed (${response.status})` };
    }
    return { success: true, message: data.data || "Connection successful" };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// --- LLM Settings (now stored in DB per user, NOT localStorage) ---

export async function loadSettings(): Promise<LLMSettings | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from("user_settings")
    .select("provider, model, api_key")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !data) return null;
  return { provider: data.provider, apiKey: data.api_key, model: data.model };
}

export async function saveSettings(settings: LLMSettings): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: session.user.id,
      provider: settings.provider,
      model: settings.model,
      api_key: settings.apiKey,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) throw error;
}

export async function clearSettings(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_settings")
    .delete()
    .eq("user_id", session.user.id);

  if (error) throw error;
}

// --- DB operations (all now scoped to the authenticated user via RLS) ---

export async function getProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

export async function createProfile(profile: Omit<UserProfile, "id">): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .insert(profile)
    .select()
    .single();
  if (error) throw error;
  return data as UserProfile;
}

export async function updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", session.user.id)
    .select()
    .single();
  if (error) throw error;
  return data as UserProfile;
}

export async function saveChatMessage(role: "user" | "assistant", content: string, mode: "learn" | "test"): Promise<void> {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ role, content, mode });
  if (error) throw error;
}

export async function loadChatHistory(mode: "learn" | "test"): Promise<ChatMessageUI[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("mode", mode)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((m: any) => ({ role: m.role, content: m.content, id: m.id }));
}

export async function clearChatHistory(mode: "learn" | "test"): Promise<void> {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("mode", mode);
  if (error) throw error;
}

export async function createQuizSession(session: {
  subject: string;
  topic: string;
  quiz_type: "quiz" | "mock_exam";
  questions: QuizQuestion[];
  status: "in_progress";
}): Promise<string> {
  const { data, error } = await supabase
    .from("quiz_sessions")
    .insert({
      subject: session.subject,
      topic: session.topic,
      quiz_type: session.quiz_type,
      questions: session.questions,
      answers: [],
      score: 0,
      total: 0,
      status: "in_progress",
    })
    .select()
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateQuizSession(id: string, updates: any): Promise<void> {
  const { error } = await supabase
    .from("quiz_sessions")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function getQuizSessions(): Promise<any[]> {
  const { data, error } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("status", "completed")
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
