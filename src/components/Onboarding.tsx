import { useState } from "react";
import {
  BOARDS,
  ALL_REGIONS,
  REGIONS,
  CITIES,
  CLASS_LEVELS,
  SUBJECTS_BY_CLASS,
  SUBJECTS_DEFAULT,
} from "@/lib/constants";
import type { UserProfile } from "@/types";
import { GraduationCap, MapPin, School, BookOpen, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";

interface OnboardingProps {
  onComplete: (profile: Omit<UserProfile, "id">) => void;
}

const STEPS = ["Board", "Region", "City", "Class", "Subject"] as const;

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [board, setBoard] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");

  const canProceed = () => {
    switch (step) {
      case 0: return !!board;
      case 1: return !!region;
      case 2: return !!city;
      case 3: return !!classLevel;
      case 4: return !!subject;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete({ board, region, city, class_level: classLevel, subject });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleRegionSelect = (selectedRegion: string) => {
    setRegion(selectedRegion);
    setCity("");
  };

  const availableStates = REGIONS[region] || [];
  const availableCities = availableStates.flatMap((state) => CITIES[state] || []);
  const availableSubjects = SUBJECTS_BY_CLASS[classLevel] || SUBJECTS_DEFAULT;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">AI Tutor</h1>
          <p className="text-slate-500 mt-2">Your personal AI-powered learning companion</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                    ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 transition-all duration-300 ${i < step ? "bg-emerald-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          {/* Step 0: Board */}
          {step === 0 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <School className="w-5 h-5" />
                <h2 className="text-xl font-semibold text-slate-800">Select your Education Board</h2>
              </div>
              <p className="text-slate-500 text-sm mb-4">Choose the board you study under</p>
              <div className="grid grid-cols-2 gap-3">
                {BOARDS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBoard(b)}
                    className={`px-4 py-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      board === b
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-100"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700"
                    }`}
                  >
                    <span className="font-medium">{b}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Region */}
          {step === 1 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <MapPin className="w-5 h-5" />
                <h2 className="text-xl font-semibold text-slate-800">Select your Region</h2>
              </div>
              <p className="text-slate-500 text-sm mb-4">Which part of India are you from?</p>
              <div className="grid grid-cols-1 gap-2">
                {ALL_REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRegionSelect(r)}
                    className={`px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      region === r
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-100"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700"
                    }`}
                  >
                    <span className="font-medium">{r}</span>
                    <span className="text-xs text-slate-400 ml-2">({REGIONS[r].length} states)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: City */}
          {step === 2 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <MapPin className="w-5 h-5" />
                <h2 className="text-xl font-semibold text-slate-800">Select your City</h2>
              </div>
              <p className="text-slate-500 text-sm mb-4">
                States in {region}: {availableStates.join(", ")}
              </p>
              {availableCities.length === 0 ? (
                <p className="text-slate-400 text-sm">Please go back and select a region first.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {availableCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCity(c)}
                      className={`px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
                        city === c
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-100"
                          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700"
                      }`}
                    >
                      <span className="text-sm font-medium">{c}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Class */}
          {step === 3 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <GraduationCap className="w-5 h-5" />
                <h2 className="text-xl font-semibold text-slate-800">Select your Class</h2>
              </div>
              <p className="text-slate-500 text-sm mb-4">Which class are you in?</p>
              <div className="grid grid-cols-2 gap-3">
                {CLASS_LEVELS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setClassLevel(c)}
                    className={`px-4 py-4 rounded-xl border-2 text-center transition-all duration-200 ${
                      classLevel === c
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-100"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700"
                    }`}
                  >
                    <span className="font-medium">{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Subject */}
          {step === 4 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-xl font-semibold text-slate-800">Select your Subject</h2>
              </div>
              <p className="text-slate-500 text-sm mb-4">What would you like to learn today?</p>
              <div className="grid grid-cols-2 gap-3">
                {availableSubjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      subject === s
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-100"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700"
                    }`}
                  >
                    <span className="font-medium text-sm">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={`flex items-center gap-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                step === 0
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-1 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                canProceed()
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {step === STEPS.length - 1 ? (
                <>
                  Start Learning <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
