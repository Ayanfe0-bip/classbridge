"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();

  const [schoolName, setSchoolName] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient();

      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      setFullName(
        user.user_metadata?.full_name || ""
      );

      setRole(
        user.user_metadata?.requested_role || ""
      );

      setLoading(false);
    }

    loadAccount();
  }, [router]);

  async function createSchool(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!schoolName.trim()) {
      setError("Please enter your school name.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const schoolCode =
        "CB-" + crypto.randomUUID().slice(0, 8).toUpperCase();

      const { error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: schoolName.trim(),
          code: schoolCode,
          created_by: user.id,
        });

      if (schoolError) {
        throw schoolError;
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't create your school. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          Preparing your CLASSBRIDGE workspace...
        </section>
      </main>
    );
  }

  if (role !== "administrator") {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <Link href="/" className="auth-brand">
            <span className="auth-logo">C</span>
            <span>CLASSBRIDGE</span>
          </Link>

          <div className="auth-heading">
            <span className="auth-label">ACCOUNT SETUP</span>
            <h1>Welcome, {fullName || "to CLASSBRIDGE"}!</h1>
            <p>
              Your account has been created. To protect school
              information, your school must approve your membership
              before you can access its workspace.
            </p>
          </div>

          <div className="auth-hint">
            Teacher and parent school-joining requests are coming
            in the next development stage.
          </div>

          <Link href="/login" className="auth-primary-button">
            Return to Sign In
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
          <span>CLASSBRIDGE</span>
        </Link>

        <div className="auth-heading">
          <span className="auth-label">SCHOOL SETUP</span>
          <h1>Let's set up your school.</h1>
          <p>
            Create your school's workspace to begin managing
            teachers, students, parents and academic activities.
          </p>
        </div>

        <form onSubmit={createSchool} className="auth-form">
          <label htmlFor="schoolName">School name</label>

          <input
            id="schoolName"
            type="text"
            placeholder="Enter your school's full name"
            value={schoolName}
            onChange={(event) => setSchoolName(event.target.value)}
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
            disabled={saving}
          >
            {saving ? "Creating school..." : "Create School →"}
          </button>
        </form>

        <p className="auth-legal">
          Your school will have its own protected workspace.
          Only authorized school members will access its records.
        </p>
      </section>
    </main>
  );
}
