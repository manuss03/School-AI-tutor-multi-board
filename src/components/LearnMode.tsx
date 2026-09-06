import { useState, useRef, useEffect } from "react";
import type { UserProfile, ChatMessageUI } from "@/types";
import { callTutor, saveChatMessage, loadChatHistory, clearChatHistory } from "@/lib/api";
import { ArrowLeft, Send, Trash2, Bot, User, Loader2, BookOpen, ListTree, Lightbulb } from "lucide-react";

interface LearnModeProps {
  profile: UserProfile;
  onBack: () => void;
}

const SUGGESTIONS = [
  { label: "Learn a topic", prompt: "I want to learn a new topic. What topics are in my syllabus?", icon: BookOpen },
  { label: "Chapter-by-chapter", prompt: "Please take me through the chapters of my subject one by one, starting from the first chapter. Teach me step by step.", icon: ListTree },
  { label: "Explain a concept", prompt: "Can you explain a difficult concept from my syllabus with examples?", icon: Lightbulb },
];

export default function LearnMode({ profile, onBack }: LearnModeProps) {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const history = await loadChatHistory("learn");
      setMessages(history);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setHistoryLoaded(true);
    }
  };

  const handleSend = async (content?: string) => {
    const messageContent = (content || input).trim();
    if (!messageContent || loading) return;

    setError("");
    const userMsg: ChatMessageUI = { role: "user", content: messageContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      await saveChatMessage("user", messageContent, "learn");
      const response = await callTutor({
        messages: newMessages,
        profile,
        mode: "learn",
      });
      const assistantMsg: ChatMessageUI = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveChatMessage("assistant", response, "learn");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMsg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Clear all chat history? This cannot be undone.")) return;
    try {
      await clearChatHistory("learn");
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return <h4 key={i} className="font-semibold text-slate-800 mt-3 mb-1 text-sm">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={i} className="font-semibold text-slate-800 mt-3 mb-1">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={i} className="font-bold text-slate-800 mt-3 mb-1 text-lg">{line.replace("# ", "")}</h2>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <div key={i} className="flex gap-2 ml-3"><span className="text-blue-500">•</span><span>{line.substring(2)}</span></div>;
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-semibold text-slate-800">{line.slice(2, -2)}</p>;
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">Learn: {profile.subject}</h2>
              <p className="text-xs text-slate-400">{profile.board} · {profile.class_level}</p>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClearHistory} className="p-2 rounded-lg hover:bg-red-50 transition-all group">
            <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
        {!historyLoaded ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Start Learning {profile.subject}</h3>
            <p className="text-sm text-slate-500 mb-6">Ask a question, request a topic, or choose an option below</p>
            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.prompt)}
                    className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
                  >
                    <Icon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 font-medium">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  msg.role === "user" ? "bg-slate-200" : "bg-gradient-to-br from-blue-600 to-cyan-500"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-100 text-slate-700"
                }`}>
                  <div className={`text-sm leading-relaxed space-y-1 ${msg.role === "user" ? "" : "prose-sm"}`}>
                    {formatContent(msg.content)}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-100 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask your tutor anything..."
              rows={1}
              className="flex-1 resize-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all max-h-32"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
