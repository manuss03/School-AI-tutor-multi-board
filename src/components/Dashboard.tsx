import { useState, useRef, useEffect } from "react";
import type { UserProfile, AppMode } from "@/types";
import { SUBJECTS_BY_CLASS, SUBJECTS_DEFAULT } from "@/lib/constants";
import { updateProfile } from "@/lib/api";
import { BookOpen, PenSquare, ChartLine, Settings, GraduationCap, Sparkles, LogOut, ChevronDown, Check, Loader2 } from "lucide-react";

interface DashboardProps {
  profile: UserProfile;
  userEmail: string;
  onSelectMode: (mode: AppMode) => void;
  onSignOut: () => void;
  hasApiKey: boolean;
  onUpdateProfile: (profile: UserProfile) => void;
}

const MODES: { mode: AppMode; title: string; description: string; icon: typeof BookOpen; color: string; bgColor: string }[] = [
  {
    mode: "learn",
    title: "Learn",
    description: "Chat with your AI tutor, learn chapter by chapter, ask questions",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "from-blue-500 to-cyan-500",
  },
  {
    mode: "test",
    title: "Take a Test",
    description: "Generate quizzes & mock exams, answer questions, get scored",
    icon: PenSquare,
    color: "text-emerald-600",
    bgColor: "from-emerald-500 to-teal-500",
  },
  {
    mode: "progress",
    title: "Progress",
    description: "View your test history, scores, and areas for improvement",
    icon: ChartLine,
    color: "text-amber-600",
    bgColor: "from-amber-500 to-orange-500",
  },
  {
    mode: "settings",
    title: "Settings",
    description: "Connect your AI copilot (ChatGPT, Claude, Gemini, & more)",
    icon: Settings,
    color: "text-slate-600",
    bgColor: "from-slate-500 to-slate-600",
  },
];

export default function Dashboard({ profile, userEmail, onSelectMode, onSignOut, hasApiKey, onUpdateProfile }: DashboardProps) {
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [changingSubject, setChangingSubject] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableSubjects = SUBJECTS_BY_CLASS[profile.class_level] || SUBJECTS_DEFAULT;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSubjectDropdownOpen(false);
      }
    };
    if (subjectDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [subjectDropdownOpen]);

  const handleSubjectChange = async (newSubject: string) => {
    if (newSubject === profile.subject) {
      setSubjectDropdownOpen(false);
      return;
    }
    setChangingSubject(true);
    try {
      const updated = await updateProfile({ subject: newSubject });
      onUpdateProfile(updated);
    } catch (err) {
      console.error("Failed to update subject:", err);
    } finally {
      setChangingSubject(false);
      setSubjectDropdownOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-lg shadow-blue-200">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">AI Tutor</h1>
              <p className="text-sm text-slate-500">Your personal learning companion</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-slate-600">{userEmail}</p>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Board</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">{profile.board}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Class</span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">{profile.class_level}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Subject</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-all"
                >
                  {changingSubject ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${subjectDropdownOpen ? "rotate-180" : ""}`} />
                  )}
                  {profile.subject}
                </button>
                {subjectDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl shadow-lg border border-slate-200 py-2 min-w-[200px] max-h-[280px] overflow-y-auto animate-[fadeIn_0.15s_ease]">
                    <p className="px-3 py-1.5 text-xs text-slate-400 font-medium">Change Subject</p>
                    {availableSubjects.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSubjectChange(s)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-all hover:bg-amber-50 ${
                          s === profile.subject ? "text-amber-700 font-medium bg-amber-50/50" : "text-slate-700"
                        }`}
                      >
                        {s}
                        {s === profile.subject && <Check className="w-4 h-4 text-amber-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Location</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">{profile.city}, {profile.region}</span>
            </div>
          </div>
        </div>

        {/* API Key Warning */}
        {!hasApiKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Connect your AI Copilot to get started</p>
              <p className="text-xs text-amber-600 mt-1">
                The tutor needs an AI engine to work. Go to Settings to connect your AI provider.
              </p>
            </div>
            <button
              onClick={() => onSelectMode("settings")}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-all"
            >
              Go to Settings
            </button>
          </div>
        )}

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.mode}
                onClick={() => onSelectMode(m.mode)}
                className="group bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-left hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${m.bgColor} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{m.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{m.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
