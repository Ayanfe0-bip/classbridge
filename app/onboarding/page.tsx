"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type School = {
  id: string;
  school_name: string;
  school_code: string;
};

export default function OnboardingPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");

  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] =
    useState<School | null>(null);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      setFullName(user.user_metadata?.full_name || "");
      setRole(user.user_metadata?.requested_role || "");

      setLoading(false);
    }

    loadAccount();
  }, [router]);

  async function searchSchools() {
    setError("");
    setSuccess("");
    setSelectedSchool(null);
    setSchools([]);

    if (searchTerm.trim().length < 3) {
      setError("Enter at least 3 characters to search.");
      return;
    }

    setSearching(true);

    try {
      const supabase = createClient();

      const { data, error: searchError } =
        await supabase.rpc("search_schools", {
          p_search: searchTerm.trim(),
        });

      if (searchError) {
        throw searchError;
      }

      setSchools((data || []) as School[]);

      if (!data || data.length === 0) {
        setError(
          "No registered school was found. Check the school name and try again."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "School search failed."
      );
    } finally {
      setSearching(false);
    }
  }

  async function submitMembershipRequest(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedSchool) {
      setError("Please select your school first.");
      return;
    }

    if (role !== "teacher" && role !== "parent") {
      setError("Invalid account type.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const { error: requestError } = await supabase.rpc(
        "request_school_membership",
        {
          p_school_id: selectedSchool.id,
          p_role: role,
        }
      );

      if (requestError) {
        throw requestError;
      }

      setSuccess(
        `Your request to join ${selectedSchool.school_name} has been submitted. The school administrator will review your application.`
      );

      setSelectedSchool(null);
      setSchools([]);
      setSearchTerm("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your request could not be submitted."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createSchool(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please sign in again.");
      }

      const generatedCode =
        "CB-" +
        crypto.randomUUID().slice(0, 8).toUpperCase();

      const { data, error: schoolError } = await supabase
        .from("schools")
        .insert({
          school_name: schoolName.trim(),
          school_code: generatedCode,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (schoolError) {
        throw schoolError;
      }

      if (!data) {
        throw new Error("School creation could not be confirmed.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't create your school."
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

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-brand">
          <span className="auth-logo">C</span>
          <span>CLASS<span>BRIDGE</span></span>
        </Link>

        <div className="auth-heading">
          <span className="auth-label">ACCOUNT SETUP</span>

          <h1>
            Welcome, {fullName || "to CLASSBRIDGE"}!
          </h1>

          {role === "administrator" ? (
            <p>
              Create your school's official workspace to
              begin managing your school.
            </p>
          ) : (
            <p>
              Find your school and request access to its
              CLASSBRIDGE workspace.
            </p>
          )}
        </div>

        {role === "administrator" && (
          <form
            onSubmit={createSchool}
            className="auth-form"
          >
            <label htmlFor="schoolName">School name</label>

            <input
              id="schoolName"
              type="text"
              placeholder="Enter your school's full name"
              value={schoolName}
              onChange={(event) =>
                setSchoolName(event.target.value)
              }
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
        )}

        {(role === "teacher" || role === "parent") && (
          <>
            <div className="auth-form">
              <label htmlFor="schoolSearch">
                Search for your school
              </label>

              <input
                id="schoolSearch"
                type="text"
                placeholder="Enter your school's name"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                minLength={3}
              />

              <button
                type="button"
                className="auth-primary-button"
                onClick={searchSchools}
                disabled={searching}
              >
                {searching ? "Searching..." : "Find School →"}
              </button>
            </div>

            {schools.length > 0 && (
              <div className="school-search-results">
                <h3>Registered schools</h3>

                {schools.map((school) => (
                  <button
                    type="button"
                    key={school.id}
                    className={`school-search-option ${
                      selectedSchool?.id === school.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedSchool(school);
                      setError("");
                      setSuccess("");
                    }}
                  >
                    <strong>{school.school_name}</strong>
                    <span>
                      School Code: {school.school_code}
                    </span>
                    <small>
                      {selectedSchool?.id === school.id
                        ? "✓ Selected"
                        : "Select this school"}
                    </small>
                  </button>
                ))}
              </div>
            )}

            {selectedSchool && (
              <form
                onSubmit={submitMembershipRequest}
                className="auth-form"
              >
                <div className="auth-hint">
                  Selected school:{" "}
                  <strong>
                    {selectedSchool.school_name}
                  </strong>
                  <br />
                  Account type:{" "}
                  <strong>{role}</strong>
                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Submitting request..."
                    : "Submit Joining Request →"}
                </button>
              </form>
            )}
          </>
        )}

        {success && (
          <div className="auth-hint" role="status">
            ✓ {success}
            <br />
            <br />
            You can sign in again after your school
            administrator approves your membership.
          </div>
        )}

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <p className="auth-switch">
          <Link href="/login">Return to Sign In</Link>
        </p>

        <p className="auth-legal">
          CLASSBRIDGE protects school information and
          only grants access to approved members.
        </p>
      </section>
    </main>
  );
        }
