import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

type Provider = "openai" | "anthropic" | "perplexity" | "groq" | "gemini" | "mistral" | "openrouter";

interface RequestBody {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  profile?: {
    board: string;
    region: string;
    city: string;
    class_level: string;
    subject: string;
  };
  mode?: "learn" | "test" | "generate_quiz" | "evaluate_quiz" | "test_connection";
  quizConfig?: {
    quizType: "quiz" | "mock_exam";
    topic: string;
    numQuestions: number;
    questionTypes: string[];
    difficulty: string;
  };
  quizData?: {
    questions: any[];
    answers: any[];
  };
}

const SYSTEM_PROMPT_LEARN = (profile: any) => `You are an expert AI tutor for Indian students. The student is studying under the ${profile?.board || "CBSE"} board in ${profile?.region || "India"}, ${profile?.city || ""}. They are in Class ${profile?.class_level || "10"} and want to learn ${profile?.subject || "Science"}.

Your role:
- Be a patient, encouraging, and knowledgeable tutor.
- Explain concepts clearly with examples relevant to the Indian curriculum.
- Use simple language appropriate for the student's class level.
- When a topic is requested, break it down into subtopics and teach step by step.
- Ask checking questions to ensure understanding.
- If the student asks to learn chapter by chapter, structure your teaching like a textbook with clear sections.
- Use formatting (headings, bullet points, bold) to make content readable.
- Always be encouraging and positive.`;

const SYSTEM_PROMPT_GENERATE_QUIZ = (profile: any, config: any) => `You are an expert exam setter for Indian education boards. The student is in Class ${profile?.class_level || "10"}, ${profile?.board || "CBSE"} board, studying ${profile?.subject || "Science"}.

Generate a ${config?.quizType || "quiz"} on the topic: "${config?.topic || "General"}".
Number of questions: ${config?.numQuestions || 10}.
Difficulty: ${config?.difficulty || "medium"}.
Question types: ${(config?.questionTypes || ["mcq"]).join(", ")}.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no text before or after) in this exact format:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "The question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why the correct answer is correct",
      "marks": 1
    },
    {
      "id": 2,
      "type": "short_answer",
      "question": "The question text",
      "modelAnswer": "The ideal answer",
      "explanation": "What a good answer should include",
      "marks": 2
    }
  ]
}

For MCQ questions: "correctAnswer" is the 0-based index of the correct option.
For short_answer questions: "modelAnswer" is the reference answer.
Make questions age-appropriate and aligned with the ${profile?.board || "CBSE"} Class ${profile?.class_level || "10"} ${profile?.subject || "Science"} syllabus.`;

const SYSTEM_PROMPT_EVALUATE_QUIZ = (profile: any) => `You are an expert exam evaluator for Indian education boards. The student is in Class ${profile?.class_level || "10"}, ${profile?.board || "CBSE"} board, studying ${profile?.subject || "Science"}.

You will receive the quiz questions and the student's answers. Evaluate each answer and provide:
1. A score for each question (0 or full marks for MCQ; partial marks possible for short answers)
2. Whether each answer is correct or incorrect
3. Detailed feedback explaining the correct answer
4. Overall score
5. Areas of improvement suggestions

You MUST respond with ONLY a valid JSON object (no markdown, no code fences, no text before or after) in this exact format:
{
  "results": [
    {
      "id": 1,
      "correct": true,
      "awardedMarks": 1,
      "feedback": "Explanation of why this is correct/incorrect"
    }
  ],
  "totalScore": 8,
  "totalMarks": 10,
  "percentage": 80,
  "grade": "A",
  "overallFeedback": "General feedback about performance",
  "improvementAreas": ["Topic 1", "Topic 2", "Topic 3"],
  "strengths": ["What the student did well"]
}`;

// --- Provider API call functions ---

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  providerLabel: string,
  extraHeaders?: Record<string, string>
): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${providerLabel} API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callOpenAI(messages: ChatMessage[], apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
  return callOpenAICompatible("https://api.openai.com/v1", apiKey, model || "gpt-4o-mini", messages, temperature, maxTokens, "OpenAI");
}

async function callPerplexity(messages: ChatMessage[], apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
  return callOpenAICompatible("https://api.perplexity.ai", apiKey, model || "sonar-pro", messages, temperature, maxTokens, "Perplexity");
}

async function callGroq(messages: ChatMessage[], apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
  return callOpenAICompatible("https://api.groq.com/openai/v1", apiKey, model || "openai/gpt-oss-120b", messages, temperature, maxTokens, "Groq");
}

async function callMistral(messages: ChatMessage[], apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
  return callOpenAICompatible("https://api.mistral.ai/v1", apiKey, model || "mistral-large-latest", messages, temperature, maxTokens, "Mistral");
}

async function callOpenRouter(messages: ChatMessage[], apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
  return callOpenAICompatible(
    "https://openrouter.ai/api/v1",
    apiKey,
    model || "openai/gpt-4o-mini",
    messages,
    temperature,
    maxTokens,
    "OpenRouter",
    {
      "HTTP-Referer": "https://ai-tutor.app",
      "X-Title": "AI Tutor",
    }
  );
}

async function callAnthropic(messages: ChatMessage[], apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
  const systemMessage = messages.find(m => m.role === "system");
  const chatMessages = messages.filter(m => m.role !== "system");

  const body: any = {
    model: model || "claude-3-5-sonnet-20241022",
    messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
    temperature,
    max_tokens: maxTokens,
  };

  if (systemMessage) {
    body.system = systemMessage.content;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

async function callGemini(messages: ChatMessage[], apiKey: string, model: string, temperature: number, maxTokens: number): Promise<string> {
  const systemMessage = messages.find(m => m.role === "system");
  const chatMessages = messages.filter(m => m.role !== "system");

  // Gemini uses "contents" array with "parts" containing "text"
  const contents = chatMessages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (systemMessage) {
    body.systemInstruction = { parts: [{ text: systemMessage.content }] };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-3.6-flash"}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

const PROVIDER_CALLERS: Record<Provider, (messages: ChatMessage[], apiKey: string, model: string, temperature: number, maxTokens: number) => Promise<string>> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  perplexity: callPerplexity,
  groq: callGroq,
  gemini: callGemini,
  mistral: callMistral,
  openrouter: callOpenRouter,
};

function extractJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  cleaned = cleaned.trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // --- Authenticate the user via JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required. Please sign in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Create a client impersonating the user (for RLS-scoped reads)
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verify the token and get user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Fetch the user's API key from the database (RLS-scoped) ---
    const { data: settingsRow, error: settingsError } = await userClient
      .from("user_settings")
      .select("provider, model, api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError || !settingsRow || !settingsRow.api_key) {
      return new Response(
        JSON.stringify({ error: "No AI provider API key configured. Please add your API key in Settings." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = settingsRow.api_key;
    const provider = settingsRow.provider as Provider;
    const dbModel = settingsRow.model;

    // --- Parse request body ---
    const body: RequestBody = await req.json();
    const { messages, model, profile, mode = "learn", quizConfig, quizData } = body;

    const effectiveModel = model || dbModel;

    let systemPrompt = "";
    let finalMessages: ChatMessage[] = [];
    const temperature = body.temperature ?? 0.7;
    const maxTokens = body.maxTokens ?? 2000;

    if (mode === "learn") {
      systemPrompt = SYSTEM_PROMPT_LEARN(profile);
      finalMessages = [{ role: "system", content: systemPrompt }, ...messages];
    } else if (mode === "test") {
      systemPrompt = SYSTEM_PROMPT_LEARN(profile) + "\n\nThe student is currently in a test/discussion mode. Help them understand concepts they're confused about, but don't just give direct answers to quiz questions — guide them to think.";
      finalMessages = [{ role: "system", content: systemPrompt }, ...messages];
    } else if (mode === "generate_quiz") {
      systemPrompt = SYSTEM_PROMPT_GENERATE_QUIZ(profile, quizConfig);
      finalMessages = [{ role: "system", content: systemPrompt }, { role: "user", content: `Generate the ${quizConfig?.quizType || "quiz"} now.` }];
    } else if (mode === "evaluate_quiz") {
      systemPrompt = SYSTEM_PROMPT_EVALUATE_QUIZ(profile);
      finalMessages = [{
        role: "system",
        content: systemPrompt,
      }, {
        role: "user",
        content: `Questions: ${JSON.stringify(quizData?.questions)}\n\nStudent Answers: ${JSON.stringify(quizData?.answers)}`,
      }];
    } else if (mode === "test_connection") {
      finalMessages = [
        { role: "user", content: "Say hello in one sentence." },
      ];
    } else {
      systemPrompt = SYSTEM_PROMPT_LEARN(profile);
      finalMessages = [{ role: "system", content: systemPrompt }, ...messages];
    }

    const caller = PROVIDER_CALLERS[provider] || callOpenAI;
    const effectiveTemp = (mode === "generate_quiz" || mode === "evaluate_quiz") ? 0.3 : temperature;
    const effectiveMaxTokens = (mode === "generate_quiz" || mode === "evaluate_quiz") ? 4000 : (mode === "test_connection" ? 100 : maxTokens);

    let responseText: string;
    try {
      responseText = await caller(finalMessages, apiKey, effectiveModel || "", effectiveTemp, effectiveMaxTokens);
    } catch (apiError) {
      const errorMsg = apiError instanceof Error ? apiError.message : "Unknown API error";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For test_connection mode, just return success with the response
    if (mode === "test_connection") {
      return new Response(
        JSON.stringify({ data: responseText, connected: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "generate_quiz" || mode === "evaluate_quiz") {
      try {
        const parsed = extractJson(responseText);
        return new Response(
          JSON.stringify({ data: parsed, raw: responseText }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response as JSON. Please try again.", raw: responseText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ data: responseText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
