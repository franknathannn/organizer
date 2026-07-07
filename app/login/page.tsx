"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/ui/PageTransition";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mode, setMode] = useState<"sign_in" | "sign_up" | "forgot_password">("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // For existing users signing in who don't have a name yet
  const [askName, setAskName] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    // Check lockout status
    const storedLockout = localStorage.getItem("login_lockout");
    if (storedLockout) {
      const unlockTime = parseInt(storedLockout, 10);
      if (Date.now() < unlockTime) {
        setLockoutTime(unlockTime);
      } else {
        localStorage.removeItem("login_lockout");
        localStorage.removeItem("login_attempts");
      }
    } else {
      const storedAttempts = localStorage.getItem("login_attempts");
      if (storedAttempts) setAttempts(parseInt(storedAttempts, 10));
    }
  }, []);

  useEffect(() => {
    if (!lockoutTime) return;
    const interval = setInterval(() => {
      if (Date.now() >= lockoutTime) {
        setLockoutTime(null);
        setAttempts(0);
        localStorage.removeItem("login_lockout");
        localStorage.removeItem("login_attempts");
        setError(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lockoutTime) return;
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (mode === "sign_in") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          localStorage.setItem("login_attempts", String(newAttempts));

          if (newAttempts >= 5) {
            const unlockTime = Date.now() + 5 * 60 * 1000; // 5 mins
            setLockoutTime(unlockTime);
            localStorage.setItem("login_lockout", String(unlockTime));
            setError("Too many failed attempts. Please try again in 5 minutes.");
            setLoading(false);
            return;
          }
          setError(error.message);
          setLoading(false);
          return;
        }
        // Check if user already has a display name
        const name = data.user?.user_metadata?.display_name;
        if (name) {
          localStorage.setItem("display_name", name);
          router.push("/home");
          router.refresh();
        } else {
          // Existing user with no name — ask them
          setAskName(true);
        }
      } else {
        if (!displayName.trim()) {
          setError("Please tell us what to call you!");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { display_name: displayName.trim() },
          },
        });
        if (error) setError(error.message);
        else setNotice("Check your inbox to confirm your email, then sign in.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) setError(error.message);
      else setNotice("Check your inbox for a password reset link.");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function saveName() {
    if (!pendingName.trim()) return;
    setLoading(true);
    await supabase.auth.updateUser({
      data: { display_name: pendingName.trim() },
    });
    localStorage.setItem("display_name", pendingName.trim());
    router.push("/home");
    router.refresh();
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber/5 via-base to-teal/5 dark:from-amber/5 dark:via-base dark:to-teal/5 relative">
        <Link
          href="/"
          className="absolute top-6 left-6 p-2 rounded-lg border border-border bg-panel text-muted hover:text-ink transition-colors shadow-sm flex items-center justify-center"
          aria-label="Back to Home"
        >
          <ArrowLeft size={17} />
        </Link>

        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-lg border border-border bg-panel text-muted hover:text-ink transition-colors shadow-sm"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <h2 className="font-display text-lg md:text-xl text-muted mb-6 tracking-wide">Task Organizer & Budget Tracking</h2>
        {askName ? (
          // Name prompt for existing users
          <Panel className="w-full max-w-sm p-6 border border-border/40 bg-panel rounded-xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-amber mb-1">
              Task Organizer & Budget Tracking
            </p>
            <h1 className="font-display text-2xl text-ink mb-2">One more thing</h1>
            <p className="text-sm text-muted mb-6">What should I call you?</p>

            <Input
              type="text"
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              placeholder="Your name"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && saveName()}
            />

            <Button onClick={saveName} disabled={loading || !pendingName.trim()} className="w-full mt-4">
              {loading ? "Saving..." : "Let's go"}
            </Button>
          </Panel>
        ) : (
          // Normal sign in / sign up form
          <Panel className="w-full max-w-sm p-6 border border-border/40 bg-panel rounded-xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-amber mb-1">
              For Students & Personal Use
            </p>
            <h1 className="font-display text-2xl text-ink mb-6">
              {mode === "sign_in" ? "Sign in" : mode === "sign_up" ? "Create your account" : "Reset password"}
            </h1>

            <form onSubmit={mode === "forgot_password" ? handleResetPassword : handleSubmit} className="space-y-3">
              {mode === "sign_up" && (
                <div>
                  <label className="font-mono text-[11px] uppercase tracking-wide text-muted block mb-1.5">
                    What should I call you?
                  </label>
                  <Input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                  />
                </div>
              )}
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wide text-muted block mb-1.5">
                  Email
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                />
              </div>
              {mode !== "forgot_password" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-mono text-[11px] uppercase tracking-wide text-muted block">
                      Password
                    </label>
                    {mode === "sign_in" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot_password");
                          setError(null);
                          setNotice(null);
                        }}
                        className="font-mono text-[10px] text-amber hover:text-amber/80 transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              )}

              {error && <p className="text-sm text-danger">{error}</p>}
              {notice && <p className="text-sm text-teal">{notice}</p>}

              <Button type="submit" disabled={loading} className="w-full mt-2">
                {loading ? "Working..." : mode === "sign_in" ? "Sign in" : mode === "sign_up" ? "Sign up" : "Send reset link"}
              </Button>
            </form>

            <button
              onClick={() => {
                if (mode === "sign_in") setMode("sign_up");
                else setMode("sign_in");
                setError(null);
                setNotice(null);
              }}
              className="mt-4 text-sm text-muted hover:text-ink transition-colors w-full text-center"
            >
              {mode === "sign_in"
                ? "New here? Create an account"
                : "Back to sign in"}
            </button>
          </Panel>
        )}
      </div>
    </PageTransition>
  );
}
