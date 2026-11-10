// In src/App.tsx
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { NeuCard } from "./components/ui/NeuCard";
import { NeuButton } from "./components/ui/NeuButton";
import { NeuInput } from "./components/ui/NeuInput";
import { NeuCategorySelect } from "./components/ui/NeuCategorySelect";
import { UserAvatar } from "./components/ui/UserAvatar";
import { HabitCard } from "./components/habit/HabitCard";
import { ProfileView } from "./components/profile/ProfileView";
import { PlusCircle, LogOut, Flame, ImagePlus } from "lucide-react";
import { useToast } from "./context/ToastContext";
import { parseConvexError } from "./lib/errorUtils";
import type { Id } from "../convex/_generated/dataModel";

export function App() {
  const toast = useToast();
  const [token, setToken] = useState<string>(() => localStorage.getItem("habit_token") || "");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [currentView, setCurrentView] = useState<"dashboard" | "profile">("dashboard");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [habitTitle, setHabitTitle] = useState("");
  const [category, setCategory] = useState("Health");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Convex Reactive Hooks
  const currentUser = useQuery(api.auth.index.getMe, { sessionToken: token || undefined });
  const habits = useQuery(api.habits.index.listWithLogs, token ? { sessionToken: token } : "skip");

  const loginMutation = useMutation(api.auth.index.login);
  const registerMutation = useMutation(api.auth.index.register);
  const createHabitMutation = useMutation(api.habits.index.create);
  const updateHabitMutation = useMutation(api.habits.index.updateWithVersionCheck);
  const toggleTodayMutation = useMutation(api.habits.index.toggleToday);
  const generateUploadUrlMutation = useMutation(api.storage.index.generateUploadUrl);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === "login") {
        const res = await loginMutation({ email, password });
        localStorage.setItem("habit_token", res.token);
        setToken(res.token);
        toast.success(`Welcome back, ${res.name}!`);
      } else {
        const res = await registerMutation({ email, password, name });
        localStorage.setItem("habit_token", res.token);
        setToken(res.token);
        toast.success("Account created successfully!");
      }
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("habit_token");
    setToken("");
    setCurrentView("dashboard");
    toast.info("Logged out successfully");
  };

  const uploadToConvexStorage = async (file: File): Promise<Id<"_storage">> => {
    const postUrl = await generateUploadUrlMutation({ sessionToken: token });
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    return storageId;
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentName = habitTitle.trim();
    if (!currentName) return;

    try {
      setIsUploading(true);
      let customImageStorageId: Id<"_storage"> | undefined = undefined;

      if (selectedFile) {
        customImageStorageId = await uploadToConvexStorage(selectedFile);
      }

      await createHabitMutation({
        sessionToken: token,
        title: currentName,
        category,
        reminderTime,
        timezoneOffset: new Date().getTimezoneOffset(),
        customImageStorageId,
      });

      toast.success(`Habit "${currentName}" created!`);
      setHabitTitle("");
      setSelectedFile(null);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <NeuCard className="w-full max-w-md flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-12 h-12 rounded-2xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent mb-2">
              <Flame className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-bold text-neu-dark tracking-tight">Habit Pulse</h1>
            <p className="text-xs text-neu-muted">Track your habits, build your future</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            {authMode === "register" && (
              <NeuInput
                label="Full Name"
                placeholder="Dharmesh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <NeuInput
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <NeuInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <NeuButton type="submit" variant="primary" className="mt-2 w-full">
              {authMode === "login" ? "Sign In" : "Create Account"}
            </NeuButton>
          </form>

          <div className="flex justify-center">
            <button
              onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              className="text-xs font-semibold text-neu-muted hover:text-neu-dark transition-colors"
            >
              {authMode === "login"
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </NeuCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Top Bar with Avatar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            onClick={() => setCurrentView("dashboard")}
            className="w-10 h-10 rounded-xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent cursor-pointer active:shadow-neu-pressed transition-all"
          >
            <Flame className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1
              onClick={() => setCurrentView("dashboard")}
              className="text-lg font-bold text-neu-dark cursor-pointer hover:text-neu-accent transition-colors"
            >
              Habit Pulse
            </h1>
            <p className="text-xs text-neu-muted">Welcome back, {currentUser.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tactile Profile Avatar Button */}
          <UserAvatar
            name={currentUser.name}
            avatarStorageId={currentUser.avatarStorageId}
            size="md"
            onClick={() => setCurrentView(currentView === "profile" ? "dashboard" : "profile")}
            className={currentView === "profile" ? "ring-2 ring-neu-accent" : ""}
          />

          <NeuButton size="sm" onClick={handleLogout} className="flex items-center gap-1.5">
            <LogOut className="w-4 h-4" />
            <span>Exit</span>
          </NeuButton>
        </div>
      </header>

      {/* View Switcher: Profile vs Dashboard */}
      {currentView === "profile" ? (
        <ProfileView
          user={currentUser}
          sessionToken={token}
          onBack={() => setCurrentView("dashboard")}
        />
      ) : (
        <>
          {/* Add Habit Bar */}
          <NeuCard>
            <form onSubmit={handleCreateHabit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <NeuInput
                    label="New Habit Name"
                    placeholder="e.g. 50 Weighted Pullups"
                    value={habitTitle}
                    onChange={(e) => setHabitTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <NeuCategorySelect
                    value={category}
                    onChange={(cat) => setCategory(cat)}
                  />
                </div>
                <div className="md:col-span-2">
                  <NeuInput
                    label="Reminder"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <NeuButton
                    type="submit"
                    variant="primary"
                    disabled={isUploading}
                    className="flex items-center justify-center gap-1.5 w-full h-[42px]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isUploading ? "Uploading..." : "Add"}</span>
                  </NeuButton>
                </div>
              </div>

              {/* Habit attachment */}
              <div className="flex items-center gap-3 pt-1 border-t border-black/5 text-xs text-neu-muted">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-neu-dark font-medium px-2 py-1 rounded-lg shadow-neu-flat-sm active:shadow-neu-pressed transition-all">
                  <ImagePlus className="w-3.5 h-3.5 text-neu-accent" />
                  <span>{selectedFile ? selectedFile.name : "Attach icon / image (Convex Storage)"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                  />
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-[11px] text-neu-danger hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </form>
          </NeuCard>

          {/* Habit Cards Stream */}
          <main className="flex flex-col gap-4">
            {habits === undefined ? (
              <p className="text-xs text-neu-muted text-center py-8">Syncing with Convex backend...</p>
            ) : habits.length === 0 ? (
              <NeuCard inset className="text-center py-12 text-neu-muted text-sm">
                No habits yet. Add your first habit above to begin tracking.
              </NeuCard>
            ) : (
              habits.map((habit) => (
                <HabitCard
                  key={habit._id}
                  habit={habit as any}
                  onToggleToday={async (id, date) => {
                    try {
                      const done = await toggleTodayMutation({ sessionToken: token, habitId: id as any, date });
                      toast.info(done ? `Completed: "${habit.title}"` : `Unmarked: "${habit.title}"`);
                    } catch (err: unknown) {
                      toast.error(parseConvexError(err));
                    }
                  }}
                  onUpdate={async (id, title, cat, expVersion) => {
                    await updateHabitMutation({
                      sessionToken: token,
                      habitId: id as any,
                      title,
                      category: cat,
                      expectedVersion: expVersion,
                    });
                    toast.success(`Updated "${title}"`);
                  }}
                />
              ))
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;