"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type School = {
  id: string;
  school_name: string;
};

type Assignment = {
id: string;
class_id: string;
subject_id: string;
classes: {
class_name: string;
class_level: string | null;
academic_session: string | null;
} | null;
subjects: {
subject_name: string;
} | null;
};

type ExamSubmission = {
id: string;
title: string;
status: "pending" | "approved" | "rejected";
submitted_at: string;
admin_feedback: string | null;
};

export default function TeacherDashboard() {
const router = useRouter();

const [teacherName, setTeacherName] = useState("");
const [schools, setSchools] = useState<School[]>([]);
const [schoolId, setSchoolId] = useState("");
const [schoolName, setSchoolName] = useState("");

const [assignments, setAssignments] = useState<Assignment[]>([]);
const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);

const [loading, setLoading] = useState(true);
const [workspaceLoading, setWorkspaceLoading] = useState(false);
const [error, setError] = useState("");

useEffect(() => {
async function loadTeacherAccount() {
try {
const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    setTeacherName(
      profile?.full_name ||
      user.user_metadata?.full_name ||
      "Teacher"
    );

    const { data: memberships, error: membershipError } =
      await supabase
        .from("school_memberships")
        .select("school_id")
        .eq("user_id", user.id)
        .eq("role", "teacher")
        .eq("status", "active");

    if (membershipError) {
      throw membershipError;
    }

    if (!memberships || memberships.length === 0) {
      setError(
        "Your teacher account has not yet been approved by a school administrator."
      );
      setLoading(false);
      return;
    }

    const schoolIds = memberships.map(
      (membership) => membership.school_id
    );

    const { data: schoolRecords, error: schoolError } =
      await supabase
        .from("schools")
        .select("id, school_name")
        .in("id", schoolIds);

    if (schoolError) {
      throw schoolError;
    }

    const availableSchools = (schoolRecords || []) as School[];

    setSchools(availableSchools);

    if (availableSchools.length > 0) {
      setSchoolId(availableSchools[0].id);
      setSchoolName(availableSchools[0].school_name);
    } else {
      setError("We couldn't find your school workspace.");
    }

    setLoading(false);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to load your teacher workspace."
    );
    setLoading(false);
  }
}

loadTeacherAccount();

}, [router]);

useEffect(() => {
if (!schoolId) return;

async function loadWorkspace() {
  setWorkspaceLoading(true);
  setError("");

  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: assignmentData, error: assignmentError } =
      await supabase
        .from("teacher_assignments")
        .select(`
          id,
          class_id,
          subject_id,
          classes (
            class_name,
            class_level,
            academic_session
          ),
          subjects (
            subject_name
          )
        `)
        .eq("school_id", schoolId)
        .eq("teacher_user_id", user.id);

    if (assignmentError) {
      throw assignmentError;
    }

    setAssignments(
      (assignmentData || []) as unknown as Assignment[]
    );

    const { data: submissionData, error: submissionError } =
      await supabase
        .from("exam_question_submissions")
        .select(
          "id, title, status, submitted_at, admin_feedback"
        )
        .eq("school_id", schoolId)
        .eq("teacher_user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(5);

    if (submissionError) {
      throw submissionError;
    }

    setSubmissions(
      (submissionData || []) as ExamSubmission[]
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to load your assigned classes."
    );
  } finally {
    setWorkspaceLoading(false);
  }
}

loadWorkspace();

}, [schoolId, router]);

function changeSchool(id: string) {
const selectedSchool = schools.find(
(school) => school.id === id
);

setSchoolId(id);
setSchoolName(selectedSchool.school_name || "");

}

async function handleSignOut() {
const supabase = createClient();
await supabase.auth.signOut();
router.replace("/login");
router.refresh();
}

const uniqueClasses = new Set(
assignments.map((item) => item.class_id)
).size;

const uniqueSubjects = new Set(
assignments.map((item) => item.subject_id)
).size;

const pendingSubmissions = submissions.filter(
(item) => item.status === "pending"
).length;

if (loading) {
return (
<main className="teacher-loading">
<div className="teacher-loading-card">
<div className="teacher-loader" />
<h2>Preparing your workspace</h2>
<p>Connecting to your school account...</p>
</div>
</main>
);
}

if (error && schools.length === 0) {
return (
<main className="teacher-loading">
<div className="teacher-loading-card">
<div className="teacher-error-icon">!</div>
<h2>Workspace unavailable</h2>
<p>{error}</p>
<button
className="teacher-primary-button"
onClick={handleSignOut}
>
Sign Out
</button>
</div>
</main>
);
}

return (
<main className="teacher-shell">
<aside className="teacher-sidebar">
<Link href="/" className="teacher-brand">
<span className="teacher-brand-icon">C</span>
<span>
CLASS<span>BRIDGE</span>
</span>
</Link>

    <div className="teacher-nav-label">TEACHING WORKSPACE</div>

    <nav className="teacher-nav">
      <a href="#overview" className="teacher-nav-item active">
        <span>▦</span>
        Dashboard
      </a>

      <a href="#my-classes" className="teacher-nav-item">
        <span>▤</span>
        My Classes
      </a>

      <a href="#examinations" className="teacher-nav-item">
        <span>✎</span>
        Examinations
      </a>

      <a href="#teaching-tools" className="teacher-nav-item">
        <span>▣</span>
        Teaching Tools
      </a>
    </nav>

    <div className="teacher-nav-label">ACCOUNT</div>

    <nav className="teacher-nav">
      <button
        className="teacher-nav-item"
        onClick={handleSignOut}
      >
        <span>↪</span>
        Sign Out
      </button>
    </nav>

    <div className="teacher-sidebar-bottom">
      <div className="teacher-avatar">
        {teacherName.charAt(0).toUpperCase()}
      </div>

      <div className="teacher-profile-info">
        <strong>{teacherName}</strong>
        <span>Teacher Account</span>
      </div>
    </div>
  </aside>

  <section className="teacher-main">
    <header className="teacher-topbar">
      <div>
        <p className="teacher-breadcrumb">
          CLASSBRIDGE / TEACHER
        </p>
        <h1>Teacher Dashboard</h1>
        <p className="teacher-topbar-subtitle">
          Your personal teaching and academic workspace.
        </p>
      </div>

      <div className="teacher-topbar-right">
        {schools.length > 1 ? (
          <select
            className="teacher-school-select"
            value={schoolId}
            onChange={(event) =>
              changeSchool(event.target.value)
            }
            aria-label="Select school"
          >
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.school_name}
              </option>
            ))}
          </select>
        ) : (
          <div className="teacher-school-name">
            <span>▣</span>
            {schoolName}
          </div>
        )}
      </div>
    </header>

    {error && (
      <div className="teacher-inline-error" role="alert">
        {error}
      </div>
    )}

    <section className="teacher-welcome" id="overview">
      <div className="teacher-welcome-content">
        <span className="teacher-welcome-label">
          YOUR TEACHING SPACE
        </span>

        <h2>
          Welcome back, {teacherName.split(" ")[0]}!
        </h2>

        <p>
          Stay organised, manage your assigned classes and
          prepare meaningful learning experiences for your
          students.
        </p>

        <a href="#my-classes" className="teacher-welcome-button">
          View My Classes →
        </a>
      </div>

      <div className="teacher-welcome-symbol">✦</div>
    </section>

    <section className="teacher-stat-grid">
      <article className="teacher-stat-card">
        <div className="teacher-stat-icon blue">▤</div>
        <span>Assigned Classes</span>
        <strong>
          {workspaceLoading ? "—" : uniqueClasses}
        </strong>
        <small>Your active class assignments</small>
      </article>

      <article className="teacher-stat-card">
        <div className="teacher-stat-icon green">▣</div>
        <span>Assigned Subjects</span>
        <strong>
          {workspaceLoading ? "—" : uniqueSubjects}
        </strong>
        <small>Subjects assigned to you</small>
      </article>

      <article className="teacher-stat-card">
        <div className="teacher-stat-icon orange">✎</div>
        <span>Exam Submissions</span>
        <strong>
          {workspaceLoading ? "—" : submissions.length}
        </strong>
        <small>Your latest five submissions</small>
      </article>

      <article className="teacher-stat-card">
        <div className="teacher-stat-icon purple">◷</div>
        <span>Awaiting Review</span>
        <strong>
          {workspaceLoading ? "—" : pendingSubmissions}
        </strong>
        <small>Pending administrator review</small>
      </article>
    </section>

    <section className="teacher-section" id="my-classes">
      <div className="teacher-section-heading">
        <div>
          <span className="teacher-section-label">
            YOUR ASSIGNMENTS
          </span>
          <h2>My Classes & Subjects</h2>
          <p>
            Classes and subjects assigned to your teacher account.
          </p>
        </div>

        <span className="teacher-count-badge">
          {assignments.length} Assignments
        </span>
      </div>

      {workspaceLoading ? (
        <div className="teacher-empty-state">
          Loading your assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="teacher-empty-state">
          <div className="teacher-empty-icon">▤</div>
          <h3>No assignments yet</h3>
          <p>
            Your school administrator has not assigned any
            classes or subjects to your account yet.
          </p>
        </div>
      ) : (
        <div className="teacher-assignment-grid">
          {assignments.map((assignment) => (
            <article
              className="teacher-assignment-card"
              key={assignment.id}
            >
              <div className="teacher-assignment-top">
                <span className="teacher-assignment-icon">
                  ▤
                </span>
                <span className="teacher-assigned-tag">
                  Assigned
                </span>
              </div>

              <h3>
                {assignment.classes?.class_name ||
                  "Class information unavailable"}
              </h3>

              <p className="teacher-assignment-subject">
                {assignment.subjects?.subject_name ||
                  "Subject information unavailable"}
              </p>

              <div className="teacher-assignment-details">
                <span>
                  Level:{" "}
                  {assignment.classes?.class_level || "Not specified"}
                </span>
                <span>
                  Session:{" "}
                  {assignment.classes?.academic_session ||
                    "Not specified"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>

    <section
      className="teacher-section"
      id="examinations"
    >
      <div className="teacher-section-heading">
        <div>
          <span className="teacher-section-label">
            ASSESSMENT MANAGEMENT
          </span>
          <h2>Examination Centre</h2>
          <p>
            Prepare examination questions and submit them
            to your school administrator for review.
          </p>
        </div>
      </div>

      <div className="teacher-exam-banner">
        <div className="teacher-exam-icon">✎</div>

        <div className="teacher-exam-content">
          <h3>Examination Question Submission</h3>
          <p>
            Prepare question papers for your assigned classes
            and subjects. Administrators will review and
            approve papers before they become available
            for printing.
          </p>
          <span className="teacher-coming-soon">
            Submission interface is the next development step
          </span>
        </div>
      </div>

      <div className="teacher-submission-list">
        <div className="teacher-submission-heading">
          <h3>Recent Submissions</h3>
          <span>Latest 5 records</span>
        </div>

        {workspaceLoading ? (
          <p className="teacher-submission-empty">
            Loading examination records...
          </p>
        ) : submissions.length === 0 ? (
          <p className="teacher-submission-empty">
            You have not submitted any examination papers yet.
          </p>
        ) : (
          submissions.map((submission) => (
            <article
              className="teacher-submission-row"
              key={submission.id}
            >
              <div>
                <strong>{submission.title}</strong>
                <span>
                  Submitted{" "}
                  {new Date(
                    submission.submitted_at
                  ).toLocaleDateString()}
                </span>

                {submission.admin_feedback && (
                  <p className="teacher-feedback">
                    Admin feedback: {submission.admin_feedback}
                  </p>
                )}
              </div>

              <span
                className={`teacher-status ${submission.status}`}
              >
                {submission.status}
              </span>
            </article>
          ))
        )}
      </div>
    </section>

    <section
      className="teacher-section"
      id="teaching-tools"
    >
      <div className="teacher-section-heading">
        <div>
          <span className="teacher-section-label">
            TEACHING SUPPORT
          </span>
          <h2>Your Teaching Tools</h2>
          <p>
            More tools will be connected to your school workspace.
          </p>
        </div>
      </div>

      <div className="teacher-tools-grid">
        <article className="teacher-tool-card">
          <span>✦</span>
          <h3>CLASSBRIDGE AI</h3>
          <p>
            Prepare lesson notes, teaching resources and
            examination questions with AI assistance.
          </p>
          <small>Powered by ZENTRIX AI</small>
        </article>

        <article className="teacher-tool-card">
          <span>◷</span>
          <h3>Attendance</h3>
          <p>
            Record and manage attendance for your assigned
            classes.
          </p>
          <small>Teacher workspace tool</small>
        </article>

        <article className="teacher-tool-card">
          <span>▤</span>
          <h3>Academic Records</h3>
          <p>
            Support student assessment, grading and
            academic progress tracking.
          </p>
          <small>School-connected records</small>
        </article>
      </div>
    </section>

    <footer className="teacher-footer">
      CLASSBRIDGE © 2026 · Created by{" "}
      <strong>Ayanfe Innovation Labs Limited.</strong>
      <br />
      <span>Powered by ZENTRIX AI technology.</span>
    </footer>
  </section>
</main>

);
}
