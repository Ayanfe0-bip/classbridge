"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("administrator");
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (role === "administrator" && !schoolName.trim()) {
      setError("Please enter your school name.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          data: {
            full_name: fullName.trim(),
            requested_role: role,
            requested_school_name: schoolName.trim(),
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="auth-page">
        <section className="auth-card auth-success">
          <div className="auth-logo">C</div>

          <div className="auth-success-icon">✓</div>

          <h1>You're almost there!</h1>

          <p>
            Your CLASSBRIDGE account registration has been submitted.
            Please check your email for a confirmation link.
          </p>

          <p className="auth-small">
            After confirming your email, we'll guide you through the
            next steps for your selected account type.
          </p>

          <Link href="/login" className="auth-primary-button">
            Continue to Sign In
          </Link>
        </section>
      </main>
    );
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
          <span className="auth-label">JOIN OUR COMMUNITY</span>
          <h1>Create your account</h1>
          <p>
            Start your journey with a smarter and more connected
            school management experience.
          </p>
        </div>

        <form onSubmit={handleSignup} className="auth-form">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            required
          />

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

          <label htmlFor="role">I am registering as a</label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="administrator">School Administrator</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>

          {role === "administrator" && (
            <>
              <label htmlFor="schoolName">School name</label>
              <input
                id="schoolName"
                type="text"
                placeholder="Enter your school's name"
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                required
              />
              <p className="auth-hint">
                You'll complete school setup after confirming your email.
              </p>
            </>
          )}

          {role !== "administrator" && (
            <p className="auth-hint">
              Your school will need to verify and approve your
              membership before you can access its records.
            </p>
          )}

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Enter your password again"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            autoComplete="new-password"
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
            {loading ? "Creating your account..." : "Create Account →"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>

        <p className="auth-legal">
          By creating an account, you agree to use CLASSBRIDGE
          responsibly and protect school and student information.
        </p>
      </section>
    </main>
  );
}
