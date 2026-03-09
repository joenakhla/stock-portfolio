"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [signupAllowed, setSignupAllowed] = useState<boolean | null>(null);
  const [checkingSignup, setCheckingSignup] = useState(false);

  // Check if signup is allowed when switching to signup mode
  useEffect(() => {
    if (mode === "signup") {
      setCheckingSignup(true);
      fetch("/api/auth/check-signup")
        .then((res) => res.json())
        .then((data) => {
          setSignupAllowed(data.allowed);
          if (!data.allowed) {
            setError(
              "This app is limited to 2 users. No more accounts can be created."
            );
          }
        })
        .catch(() => {
          setSignupAllowed(true); // fail-open on network error
        })
        .finally(() => setCheckingSignup(false));
    } else {
      setSignupAllowed(null);
      setError("");
    }
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (mode === "signup") {
      // Double-check user limit before signup
      try {
        const checkRes = await fetch("/api/auth/check-signup");
        const checkData = await checkRes.json();
        if (!checkData.allowed) {
          setError(
            "Sorry, this app is limited to 2 users. No new accounts can be created."
          );
          setLoading(false);
          return;
        }
      } catch {
        // If check fails, proceed anyway (fail-open)
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage(
          "Account created! Check your email to confirm, then sign in."
        );
        setMode("signin");
        setPassword("");
        setDisplayName("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
    }

    setLoading(false);
  }

  const isSignupDisabled =
    mode === "signup" && (signupAllowed === false || checkingSignup);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <h1 className="text-3xl font-bold text-gray-900">
              My Stock Tracker
            </h1>
          </div>
          <p className="text-gray-500">
            Track your stocks and see how your money is doing
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => {
                setMode("signin");
                setError("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === "signin"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create Account
            </button>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {checkingSignup && mode === "signup" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Checking availability...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base"
                  required
                  disabled={isSignupDisabled}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base"
                required
                disabled={isSignupDisabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "signup"
                    ? "At least 6 characters"
                    : "Your password"
                }
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base"
                required
                disabled={isSignupDisabled}
              />
            </div>

            <button
              type="submit"
              disabled={loading || isSignupDisabled}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Your portfolio data is private and only visible to you.
        </p>
      </div>
    </div>
  );
}
