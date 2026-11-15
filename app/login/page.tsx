"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      const { data: memberships, error: membershipError } =
        await supabase
          .from("school_memberships")
          .select("school_id, role, status")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
          .eq("status", "active");

      if (membershipError) {
        throw membershipError;
      }

      if (!memberships || memberships.length === 0) {
        router.push("/onboarding");
        router.refresh();
        return;
      }

      if (memberships.length > 1) {
        router.push("/select-school");
        router.refresh();
        return;
      }

      const membership = memberships[0];

      if (membership.role === "admin") {
        router.push("/admin");
      } else if (membership.role === "teacher") {
        router.push("/teacher");
      } else if (membership.role === "parent") {
        router.push("/parent");
      } else {
        throw new Error("Your account has an unrecognized role.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-brand">
          <span className="auth-logo">C</span>
          <span>
            CLASS<span>BRIDGE</span>
          </span>
        </Link>

        <div className="auth-heading">
          <span className="auth-label">WELCOME BACK</span>
          <h1>Sign in to your account</h1>
          <p>
            Access your school workspace and stay connected
            with your school community.
          </p>
        </div>

        {searchParams.get("error") === "confirmation_failed" && (
          <div className="auth-error" role="alert">
            Your email confirmation link could not be verified.
            Please try registering again or request a new link.
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-primary-button"
            disabled={loading}
          >
            {loading ? "Signing you in..." : "Sign In →"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link href="/signup">Create an account</Link>
        </p>

        <p className="auth-legal">
          Your school information and account access are protected
          by CLASSBRIDGE security controls.
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-page">
          <div className="auth-card">Loading sign in...</div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
