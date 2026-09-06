import { useState } from "react";
import type { LLMSettings, LLMProvider, UserProfile } from "@/types";
import { LLM_PROVIDERS } from "@/lib/constants";
import { saveSettings, clearSettings, testConnection } from "@/lib/api";
import { ArrowLeft, Key, ExternalLink, Check, Trash2, Loader2, ShieldCheck, Sparkles, Zap, CheckCircle2, XCircle } from "lucide-react";

interface SettingsViewProps {
  settings: LLMSettings | null;
  profile: UserProfile;
  onSave: (settings: LLMSettings) => void;
  onClear: () => void;
  onBack: () => void;
}

export default function SettingsView({ settings, profile, onSave, onClear, onBack }: SettingsViewProps) {
  const [provider, setProvider] = useState<LLMProvider>(settings?.provider || "openai");
  const [apiKey, setApiKey] = useState(settings?.apiKey || "");
  const [model, setModel] = useState(settings?.model || LLM_PROVIDERS[0].models[0].value);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const currentProvider = LLM_PROVIDERS.find((p) => p.value === provider)!;

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setError("");
    setTestResult(null);
    try {
      const newSettings: LLMSettings = { provider, apiKey: apiKey.trim(), model };
      await saveSettings(newSettings);
      onSave(newSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setError("");
    setTestResult(null);
    try {
      await clearSettings();
      setApiKey("");
      onClear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear settings");
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your API key first");
      return;
    }
    setError("");
    setTestResult(null);

    // Save settings first so the edge function can read them from DB
    setSaving(true);
    try {
      const newSettings: LLMSettings = { provider, apiKey: apiKey.trim(), model };
      await saveSettings(newSettings);
      onSave(newSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
      setSaving(false);
      return;
    }
    setSaving(false);

    // Now test the connection
    setTesting(true);
    try {
      const result = await testConnection(profile);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : "Connection failed" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">Settings</h2>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Connect Your AI Copilot</h3>
              <p className="text-sm text-slate-500 mt-1">
                The AI Tutor needs an intelligence engine to teach, generate tests, and evaluate answers.
                Choose a provider, select a model, enter your API key, then test the connection to make sure it works.
                Your key is stored securely with your account and is never shared with other users.
              </p>
            </div>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Choose AI Provider</label>
          <div className="grid grid-cols-1 gap-3">
            {LLM_PROVIDERS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setProvider(p.value);
                  setModel(p.models[0].value);
                  setTestResult(null);
                }}
                className={`px-4 py-4 rounded-xl border-2 text-left transition-all ${
                  provider === p.value
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${provider === p.value ? "text-blue-700" : "text-slate-700"}`}>{p.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                  </div>
                  {provider === p.value && <Check className="w-5 h-5 text-blue-600" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model + API Key */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 space-y-5">
          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setTestResult(null);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
            >
              {currentProvider.models.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="Paste your API key here..."
                className="w-full pl-10 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <a
              href={currentProvider.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
            >
              {currentProvider.helpText} <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Test Connection Result */}
          {testResult && (
            <div className={`rounded-xl p-4 flex items-start gap-3 ${
              testResult.success
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${testResult.success ? "text-emerald-700" : "text-red-700"}`}>
                  {testResult.success ? "Connection Successful" : "Connection Failed"}
                </p>
                <p className={`text-xs mt-1 break-words ${testResult.success ? "text-emerald-600" : "text-red-600"}`}>
                  {testResult.message}
                </p>
                {testResult.success && (
                  <p className="text-xs text-emerald-500 mt-1">
                    Your {currentProvider.label} connection is working. You can now save and start learning!
                  </p>
                )}
                {!testResult.success && (
                  <p className="text-xs text-red-500 mt-1">
                    Check that your API key is valid and the model name is correct for {currentProvider.label}.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Privacy note */}
          <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">
              Your API key is stored securely with your account and is only used to relay requests to {currentProvider.label}. It is never shared with other users or exposed in the browser.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={!apiKey.trim() || testing || saving}
              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {testing ? "Testing..." : "Test Connection"}
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saved ? "Saved!" : "Save Settings"}
            </button>
            {settings && (
              <button
                onClick={handleClear}
                className="px-4 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
