import type { QuizQuestion, QuizAnswer, QuizEvaluation } from "@/types";
import { GRADE_COLORS } from "@/lib/constants";
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, Trophy, TrendingUp, Lightbulb, Star } from "lucide-react";

interface QuizResultsProps {
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  evaluation: QuizEvaluation;
  topic: string;
  quizType: "quiz" | "mock_exam";
  subject: string;
  onRetake: () => void;
  onBack: () => void;
}

export default function QuizResults({
  questions,
  answers,
  evaluation,
  topic,
  quizType,
  subject,
  onRetake,
  onBack,
}: QuizResultsProps) {
  const percentage = evaluation.percentage;
  const gradeColor = GRADE_COLORS[evaluation.grade] || "text-slate-600";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">Test Results</h2>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-8 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-200 mb-4">
              <Trophy className="w-9 h-9 text-white" />
            </div>
            <p className="text-sm text-slate-500 mb-1">{quizType === "mock_exam" ? "Mock Exam" : "Quiz"} · {subject} · {topic}</p>
            <div className="flex items-center justify-center gap-4 my-4">
              <div>
                <p className={`text-5xl font-bold ${gradeColor}`}>{evaluation.grade}</p>
                <p className="text-xs text-slate-400 mt-1">Grade</p>
              </div>
              <div className="w-px h-16 bg-slate-200" />
              <div>
                <p className="text-5xl font-bold text-slate-800">{percentage}<span className="text-2xl">%</span></p>
                <p className="text-xs text-slate-400 mt-1">Score</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-700">
              {evaluation.totalScore} / {evaluation.totalMarks} marks
            </p>
          </div>

          {/* Progress ring */}
          <div className="mt-6 relative">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  percentage >= 75 ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : percentage >= 50 ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                  : percentage >= 35 ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-gradient-to-r from-red-500 to-rose-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Overall Feedback */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Tutor's Feedback
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">{evaluation.overallFeedback}</p>

          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Strengths
              </p>
              <div className="flex flex-wrap gap-2">
                {evaluation.strengths.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {evaluation.improvementAreas && evaluation.improvementAreas.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Areas for Improvement
              </p>
              <div className="flex flex-wrap gap-2">
                {evaluation.improvementAreas.map((area, i) => (
                  <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-500" />
            Question Review
          </h3>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const answer = answers.find((a) => a.questionId === q.id);
              const result = evaluation.results?.find((r) => r.id === q.id);
              const isCorrect = result?.correct;

              return (
                <div key={q.id} className={`rounded-xl border-2 p-4 ${
                  isCorrect ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"
                }`}>
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 mb-2">
                        {i + 1}. {q.question}
                      </p>

                      {/* MCQ display */}
                      {q.type === "mcq" && q.options && (
                        <div className="space-y-1.5 mb-3">
                          {q.options.map((opt, j) => (
                            <div
                              key={j}
                              className={`text-sm px-3 py-2 rounded-lg flex items-center gap-2 ${
                                j === q.correctAnswer
                                  ? "bg-emerald-100 text-emerald-800 font-medium"
                                  : answer?.answer === j
                                  ? "bg-red-100 text-red-700"
                                  : "text-slate-600"
                              }`}
                            >
                              <span className="text-xs font-medium">{String.fromCharCode(65 + j)}.</span>
                              <span>{opt}</span>
                              {j === q.correctAnswer && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                              {answer?.answer === j && j !== q.correctAnswer && <XCircle className="w-4 h-4 ml-auto" />}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Short Answer display */}
                      {q.type === "short_answer" && (
                        <div className="space-y-2 mb-3">
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-slate-400 mb-1">Your Answer:</p>
                            <p className="text-sm text-slate-700">{(answer?.answer as string) || "No answer provided"}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-emerald-600 mb-1">Model Answer:</p>
                            <p className="text-sm text-emerald-800">{q.modelAnswer}</p>
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      {result?.feedback && (
                        <div className="bg-white/80 rounded-lg p-3 mt-2 border border-slate-100">
                          <p className="text-xs font-medium text-slate-400 mb-1">Tutor's Explanation:</p>
                          <p className="text-sm text-slate-600">{result.feedback}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-slate-400">
                          Marks: <span className="font-medium text-slate-600">{result?.awardedMarks || 0}/{q.marks}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRetake}
            className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Take Another Test
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
