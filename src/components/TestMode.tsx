import { useState } from "react";
import type { UserProfile, QuizQuestion, QuizAnswer, QuizConfig, QuizEvaluation } from "@/types";
import { generateQuiz, evaluateQuiz, createQuizSession, updateQuizSession } from "@/lib/api";
import { QUIZ_TYPES, DIFFICULTY_LEVELS, QUESTION_TYPES } from "@/lib/constants";
import { ArrowLeft, PenSquare, Loader2, FileText, ChevronRight, AlertCircle } from "lucide-react";
import QuizResults from "./QuizResults";

interface TestModeProps {
  profile: UserProfile;
  onBack: () => void;
}

type Phase = "config" | "generating" | "taking" | "evaluating" | "results";

export default function TestMode({ profile, onBack }: TestModeProps) {
  const [phase, setPhase] = useState<Phase>("config");
  const [quizType, setQuizType] = useState<"quiz" | "mock_exam">("quiz");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [questionTypes, setQuestionTypes] = useState<string[]>(["mcq"]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const toggleQuestionType = (type: string) => {
    setQuestionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic for your test");
      return;
    }
    if (questionTypes.length === 0) {
      setError("Please select at least one question type");
      return;
    }
    setError("");
    setPhase("generating");

    const config: QuizConfig = {
      quizType,
      topic: topic.trim(),
      numQuestions,
      questionTypes,
      difficulty,
    };

    try {
      const generatedQuestions = await generateQuiz(profile, config);
      setQuestions(generatedQuestions);
      setAnswers(generatedQuestions.map((q) => ({ questionId: q.id, answer: null })));
      const newSessionId = await createQuizSession({
        subject: profile.subject,
        topic: topic.trim(),
        quiz_type: quizType,
        questions: generatedQuestions,
        status: "in_progress",
      });
      setSessionId(newSessionId);
      setCurrentQuestion(0);
      setPhase("taking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
      setPhase("config");
    }
  };

  const handleAnswer = (answer: string | number) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionId === questions[currentQuestion].id ? { ...a, answer } : a
      )
    );
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    const unanswered = answers.filter((a) => a.answer === null || a.answer === "").length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
    setPhase("evaluating");
    try {
      const result = await evaluateQuiz(profile, questions, answers);
      setEvaluation(result);
      if (sessionId) {
        await updateQuizSession(sessionId, {
          answers,
          score: result.totalScore,
          total: result.totalMarks,
          feedback: result,
          status: "completed",
          completed_at: new Date().toISOString(),
        });
      }
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate quiz");
      setPhase("taking");
    }
  };

  const handleRetake = () => {
    setPhase("config");
    setQuestions([]);
    setAnswers([]);
    setEvaluation(null);
    setSessionId(null);
    setError("");
  };

  // --- Config Phase ---
  if (phase === "config") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <PenSquare className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Take a Test</h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Quiz Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Test Type</label>
              <div className="grid grid-cols-2 gap-3">
                {QUIZ_TYPES.map((qt) => (
                  <button
                    key={qt.value}
                    onClick={() => setQuizType(qt.value)}
                    className={`px-4 py-4 rounded-xl border-2 text-left transition-all ${
                      quizType === qt.value
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <p className={`font-medium text-sm ${quizType === qt.value ? "text-emerald-700" : "text-slate-700"}`}>{qt.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{qt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, Quadratic Equations, French Revolution..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">Or enter "Full Syllabus" for a comprehensive test</p>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Number of Questions: <span className="text-emerald-600 font-bold">{numQuestions}</span>
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5</span><span>15</span><span>30</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTY_LEVELS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      difficulty === d
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Types */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Question Types</label>
              <div className="flex gap-2">
                {QUESTION_TYPES.map((qt) => (
                  <button
                    key={qt.value}
                    onClick={() => toggleQuestionType(qt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      questionTypes.includes(qt.value)
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate */}
            <button
              onClick={handleGenerate}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              Generate Test <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Generating Phase ---
  if (phase === "generating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Generating Your Test</h3>
          <p className="text-sm text-slate-500 mt-1">Creating {numQuestions} questions on "{topic}"...</p>
        </div>
      </div>
    );
  }

  // --- Evaluating Phase ---
  if (phase === "evaluating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Evaluating Your Answers</h3>
          <p className="text-sm text-slate-500 mt-1">Your tutor is reviewing your responses...</p>
        </div>
      </div>
    );
  }

  // --- Results Phase ---
  if (phase === "results" && evaluation) {
    return (
      <QuizResults
        questions={questions}
        answers={answers}
        evaluation={evaluation}
        topic={topic}
        quizType={quizType}
        subject={profile.subject}
        onRetake={handleRetake}
        onBack={onBack}
      />
    );
  }

  // --- Taking Phase ---
  const question = questions[currentQuestion];
  const currentAnswer = answers.find((a) => a.questionId === question?.id);
  const answeredCount = answers.filter((a) => a.answer !== null && a.answer !== "").length;
  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => { if (confirm("Leave the test? Your progress will be lost.")) onBack(); }} className="p-2 rounded-lg hover:bg-slate-100 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">{quizType === "mock_exam" ? "Mock Exam" : "Quiz"}: {topic}</h2>
              <p className="text-xs text-slate-400">{profile.subject} · {difficulty}</p>
            </div>
          </div>
        </div>
        <div className="text-sm font-medium text-slate-600">
          {answeredCount}/{questions.length} answered
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 max-w-2xl w-full self-center">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-xs text-slate-400">{question.marks} mark{question.marks > 1 ? "s" : ""}</span>
            </div>

            <h3 className="text-lg font-medium text-slate-800 mb-6 leading-relaxed">{question.question}</h3>

            {/* MCQ */}
            {question.type === "mcq" && question.options && (
              <div className="space-y-3">
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      currentAnswer?.answer === i
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                    }`}
                  >
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentAnswer?.answer === i
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className={`text-sm ${currentAnswer?.answer === i ? "text-emerald-700 font-medium" : "text-slate-700"}`}>
                      {opt}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Short Answer */}
            {question.type === "short_answer" && (
              <textarea
                value={(currentAnswer?.answer as string) || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Write your answer here..."
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePrev}
              disabled={currentQuestion === 0}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentQuestion === 0
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Previous
            </button>

            {/* Question palette */}
            <div className="flex flex-wrap gap-1.5 max-w-[50%]">
              {questions.map((q, i) => {
                const ans = answers.find((a) => a.questionId === q.id);
                const isAnswered = ans?.answer !== null && ans?.answer !== "";
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                      i === currentQuestion
                        ? "bg-emerald-600 text-white"
                        : isAnswered
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all"
              >
                Submit Test
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
