import { useState, useEffect } from "react";
import type { UserProfile } from "@/types";
import { getQuizSessions } from "@/lib/api";
import { ArrowLeft, Trophy, TrendingUp, BookOpen, Calendar, ChartLine, Award, Loader2, Inbox } from "lucide-react";
import { GRADE_COLORS } from "@/lib/constants";

interface ProgressViewProps {
  profile: UserProfile;
  onBack: () => void;
}

interface SessionRow {
  id: string;
  subject: string;
  topic: string;
  quiz_type: "quiz" | "mock_exam";
  score: number;
  total: number;
  feedback: any;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export default function ProgressView({ profile, onBack }: ProgressViewProps) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getQuizSessions();
      setSessions(data as SessionRow[]);
    } catch (err) {
      console.error("Failed to load quiz sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalTests = sessions.length;
  const avgScore = totalTests > 0
    ? Math.round(sessions.reduce((sum, s) => {
        const pct = s.total > 0 ? (s.score / s.total) * 100 : 0;
        return sum + pct;
      }, 0) / totalTests)
    : 0;
  const bestScore = totalTests > 0
    ? Math.max(...sessions.map((s) => (s.total > 0 ? (s.score / s.total) * 100 : 0)))
    : 0;

  // Aggregate improvement areas
  const allImprovementAreas: Record<string, number> = {};
  sessions.forEach((s) => {
    if (s.feedback?.improvementAreas) {
      s.feedback.improvementAreas.forEach((area: string) => {
        allImprovementAreas[area] = (allImprovementAreas[area] || 0) + 1;
      });
    }
  });
  const topImprovementAreas = Object.entries(allImprovementAreas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <ChartLine className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Your Progress</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : totalTests === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
              <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Tests Yet</h3>
            <p className="text-sm text-slate-500">Take your first quiz or mock exam to see your progress here.</p>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{totalTests}</p>
                <p className="text-xs text-slate-400 mt-1">Tests Taken</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-xl mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{avgScore}<span className="text-lg">%</span></p>
                <p className="text-xs text-slate-400 mt-1">Average Score</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-100 rounded-xl mb-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{Math.round(bestScore)}<span className="text-lg">%</span></p>
                <p className="text-xs text-slate-400 mt-1">Best Score</p>
              </div>
            </div>

            {/* Improvement Areas */}
            {topImprovementAreas.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  Focus Areas for Improvement
                </h3>
                <div className="space-y-3">
                  {topImprovementAreas.map(([area, count]) => (
                    <div key={area} className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 flex-1">{area}</span>
                      <div className="flex-1 max-w-[150px] h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                          style={{ width: `${(count / totalTests) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-12 text-right">{count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-500" />
                Test History
              </h3>
              <div className="space-y-3">
                {sessions.map((session) => {
                  const percentage = session.total > 0 ? (session.score / session.total) * 100 : 0;
                  const grade = session.feedback?.grade || "N/A";
                  const gradeColor = GRADE_COLORS[grade] || "text-slate-600";
                  return (
                    <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                        session.quiz_type === "mock_exam" ? "bg-orange-100" : "bg-emerald-100"
                      }`}>
                        <Award className={`w-6 h-6 ${session.quiz_type === "mock_exam" ? "text-orange-600" : "text-emerald-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{session.topic}</p>
                        <p className="text-xs text-slate-400">
                          {session.quiz_type === "mock_exam" ? "Mock Exam" : "Quiz"} · {session.subject}
                          {session.completed_at && ` · ${new Date(session.completed_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-bold ${gradeColor}`}>{Math.round(percentage)}%</p>
                        <p className="text-xs text-slate-400">{session.score}/{session.total}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
