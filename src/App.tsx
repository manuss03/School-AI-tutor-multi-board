import { useState, useEffect } from "react";
import type { UserProfile, LLMSettings, AppMode, AuthUser } from "@/types";
import { supabase } from "@/lib/supabase";
import {
  getSession,
  getProfile,
  createProfile,
  loadSettings,
  signOut,
} from "@/lib/api";
import AuthScreen from "@/components/AuthScreen";
import Onboarding from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";
import LearnMode from "@/components/LearnMode";
import TestMode from "@/components/TestMode";
import ProgressView from "@/components/ProgressView";
import SettingsView from "@/components/SettingsView";

type Screen = "auth" | "onboarding" | "dashboard" | AppMode;

export default function App() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    initApp();

    // Listen for auth state changes (handles OAuth redirects, sign in/out)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const authUser: AuthUser = { id: session.user.id, email: session.user.email || "" };
          setUser(authUser);
          await loadUserData(authUser);
        } else {
          setUser(null);
          setProfile(null);
          setSettings(null);
          setScreen("auth");
        }
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const initApp = async () => {
    try {
      const sessionUser = await getSession();
      if (sessionUser) {
        setUser(sessionUser);
        await loadUserData(sessionUser);
      } else {
        setScreen("auth");
      }
    } catch (err) {
      console.error("Failed to init app:", err);
      setScreen("auth");
    } finally {
      setBooting(false);
    }
  };

  const loadUserData = async (authUser: AuthUser) => {
    try {
      const userProfile = await getProfile();
      const userSettings = await loadSettings();
      setSettings(userSettings);
      if (userProfile) {
        setProfile(userProfile);
        setScreen("dashboard");
      } else {
        setProfile(null);
        setScreen("onboarding");
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
      setScreen("onboarding");
    }
  };

  const handleOnboardingComplete = async (profileData: Omit<UserProfile, "id">) => {
    try {
      const newProfile = await createProfile(profileData);
      setProfile(newProfile);
      setScreen("dashboard");
    } catch (err) {
      console.error("Failed to create profile:", err);
      alert("Something went wrong saving your profile. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    setSettings(null);
    setScreen("auth");
  };

  const handleSaveSettings = (newSettings: LLMSettings) => {
    setSettings(newSettings);
  };

  const handleClearSettings = () => {
    setSettings(null);
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-lg shadow-blue-200 mb-4 animate-pulse">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">Loading AI Tutor...</p>
        </div>
      </div>
    );
  }

  // Not signed in → show auth screen
  if (!user || screen === "auth") {
    return <AuthScreen />;
  }

  // Signed in but no profile → onboarding
  if (screen === "onboarding" || !profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (screen === "dashboard") {
    return (
      <Dashboard
        profile={profile}
        userEmail={user.email}
        onSelectMode={(mode) => setScreen(mode)}
        onSignOut={handleSignOut}
        hasApiKey={!!settings?.apiKey}
        onUpdateProfile={(updated) => setProfile(updated)}
      />
    );
  }

  if (screen === "learn") {
    return settings ? (
      <LearnMode profile={profile} onBack={() => setScreen("dashboard")} />
    ) : (
      <Dashboard
        profile={profile}
        userEmail={user.email}
        onSelectMode={(m) => setScreen(m)}
        onSignOut={handleSignOut}
        hasApiKey={false}
        onUpdateProfile={(updated) => setProfile(updated)}
      />
    );
  }

  if (screen === "test") {
    return settings ? (
      <TestMode profile={profile} onBack={() => setScreen("dashboard")} />
    ) : (
      <Dashboard
        profile={profile}
        userEmail={user.email}
        onSelectMode={(m) => setScreen(m)}
        onSignOut={handleSignOut}
        hasApiKey={false}
        onUpdateProfile={(updated) => setProfile(updated)}
      />
    );
  }

  if (screen === "progress") {
    return <ProgressView profile={profile} onBack={() => setScreen("dashboard")} />;
  }

  if (screen === "settings") {
    return (
      <SettingsView
        settings={settings}
        profile={profile}
        onSave={handleSaveSettings}
        onClear={handleClearSettings}
        onBack={() => setScreen("dashboard")}
      />
    );
  }

  return (
    <Dashboard
      profile={profile}
      userEmail={user.email}
      onSelectMode={(m) => setScreen(m)}
      onSignOut={handleSignOut}
      hasApiKey={!!settings?.apiKey}
      onUpdateProfile={(updated) => setProfile(updated)}
    />
  );
}
