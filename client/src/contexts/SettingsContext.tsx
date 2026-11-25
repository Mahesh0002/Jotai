import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { preferencesApi } from "@/lib/api";

type SettingsState = {
  // Profile
  displayName: string;
  username: string;
  timezone: string;
  weekStartsOn: string;

  // Quick Preferences
  theme: string;
  accentColor: string;
  interfaceDensity: string;

  // Focus Settings
  defaultSessionDuration: string;
  shortBreakDuration: string;
  longBreakDuration: string;
  sessionsBeforeLongBreak: string;
  autoStartBreaks: boolean;
  autoStartNextSession: boolean;
  playNotificationSound: boolean;

  // Notification Settings
  taskDue: boolean;
  habitReminders: boolean;
  calendarEvents: boolean;
  focusSessionCompleted: boolean;
  aiInsights: boolean;
  weeklySummary: boolean;

  // AI Assistant
  aiAssistant: boolean;
  personality: string;
  proactiveSuggestions: boolean;
  askBeforeMakingChanges: boolean;
  useHistoryForPersonalization: boolean;

  // Data & Export
  automaticBackups: string;

  // Keyboard Shortcuts
  enableVimMode: boolean;
  enableCommandPalette: boolean;
};

type SettingsContextType = {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
};

const initialSettings: SettingsState = {
  displayName: "Jōtai Runner",
  username: "jotai_runner",
  timezone: "Asia/Kolkata (GMT +5:30)",
  weekStartsOn: "Monday",
  theme: "Dark",
  accentColor: "Purple",
  interfaceDensity: "Comfortable",
  defaultSessionDuration: "25 minutes",
  shortBreakDuration: "5 minutes",
  longBreakDuration: "15 minutes",
  sessionsBeforeLongBreak: "4 sessions",
  autoStartBreaks: false,
  autoStartNextSession: true,
  playNotificationSound: true,
  taskDue: true,
  habitReminders: true,
  calendarEvents: true,
  focusSessionCompleted: true,
  aiInsights: false,
  weeklySummary: true,
  aiAssistant: true,
  personality: "Balanced",
  proactiveSuggestions: true,
  askBeforeMakingChanges: true,
  useHistoryForPersonalization: true,
  automaticBackups: "Daily",
  enableVimMode: false,
  enableCommandPalette: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(initialSettings);
  const [activeCategory, setActiveCategory] = useState("Profile");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    preferencesApi
      .get()
      .then((preference) => {
        if (preference.settings && typeof preference.settings === "object") {
          setSettings({ ...initialSettings, ...(preference.settings as Partial<SettingsState>) });
        }
      })
      .catch(() => {
        // Backend unavailable — keep in-memory defaults.
      });
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!dirty.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      preferencesApi
        .update({ settings: settings as unknown as Record<string, unknown> })
        .catch(() => {
          // Backend unavailable — settings remain in memory only.
        });
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    dirty.current = true;
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSetting, activeCategory, setActiveCategory }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
