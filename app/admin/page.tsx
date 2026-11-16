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

type DashboardStats = {
  students: number;
  teachers: number;
  parents: number;
  classes: number;
  subjects: number;
  pendingExams: number;
};

const emptyStats: DashboardStats = {
  students: 0,
  teachers: 0,
  parents: 0,
  classes: 0,
  subjects: 0,
  pendingExams: 0,
};

export default function AdminDashboard() {
  const router = useRouter();

  const [adminName, setAdminName] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");

  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminAccount() {
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

        setAdminName(
          profile?.full_name ||
            user.user_metadata?.full_name ||
            "Administrator"
        );

        const { data: memberships, error: membershipError } =
          await supabase
            .from("school_memberships")
            .select("school_id")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .eq("status", "active");

        if (membershipError) {
          throw membershipError;
        }

        if (!memberships || memberships.length === 0) {
          setError(
            "Your administrator account does not have an active school membership."
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
            .select("id, school_name, school_code")
            .in("id", schoolIds);

        if (schoolError) {
          throw schoolError;
        }

        const availableSchools = (schoolRecords || []) as School[];

        setSchools(availableSchools);

        if (availableSchools.length === 0) {
          setError("We could not find your registered school.");
          setLoading(false);
          return;
        }

        setSchoolId(availableSchools[0].id);
        setSchoolName(availableSchools[0].school_name);
        setSchoolCode(availableSchools[0].school_code);

        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your administrator workspace."
        );
        setLoading(false);
      }
    }

    loadAdminAccount();
  }, [router]);

  useEffect(() => {
    if (!schoolId) return;

    async function loadSchoolStatistics() {
      setStatsLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const [
          students,
          teachers,
          parents,
          classes,
          subjects,
          exams,
        ] = await Promise.all([
          supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("school_id", schoolId),

          supabase
            .from("school_memberships")
            .select("*", { count: "exact", head: true })
            .eq("school_id", schoolId)
            .eq("role", "teacher")
            .eq("status", "active"),

          supabase
            .from("school_memberships")
            .select("*", { count: "exact", head: true })
            .eq("school_id", schoolId)
            .eq("role", "parent")
            .eq("status", "active"),

          supabase
            .from("classes")
            .select("*", { count: "exact", head: true })
            .eq("school_id", schoolId),

          supabase
            .from("subjects")
            .select("*", { count: "exact", head: true })
            .eq("school_id", schoolId),

          supabase
            .from("exam_question_submissions")
            .select("*", { count: "exact", head: true })
            .eq("school_id", schoolId)
            .eq("status", "pending"),
        ]);

        const results = [
          students,
          teachers,
          parents,
          classes,
          subjects,
          exams,
        ];

        const failedQuery = results.find(
          (result) => result.error
        );

        if (failedQuery?.error) {
          throw failedQuery.error;
        }

        setStats({
          students: students.count || 0,
          teachers: teachers.count || 0,
          parents: parents.count || 0,
          classes: classes.count || 0,
          subjects: subjects.count || 0,
          pendingExams: exams.count || 0,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load school statistics."
        );
      } finally {
        setStatsLoading(false);
      }
    }

    loadSchoolStatistics();
  }, [schoolId]);

  function changeSchool(id: string) {
    const selectedSchool = schools.find(
      (school) => school.id === id
    );

    setSchoolId(id);
    setSchoolName(selectedSchool?.school_name || "");
    setSchoolCode(selectedSchool?.school_code || "");
    setStats(emptyStats);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="teacher-loading">
        <div className="teacher-loading-card">
          <div className="teacher-loader" />
          <h2>Preparing your school workspace</h2>
          <p>Connecting to CLASSBRIDGE...</p>
        </div>
      </main>
    );
  }

  if (error && schools.length === 0) {
    return (
      <main className="teacher-loading">
        <div className="teacher-loading-card">
          <div className="teacher-error-icon">!</div>
          <h2>Administrator workspace unavailable</h2>
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
    <main className="dashboard-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <div className="brand-icon">C</div>
          <div className="brand-name">
            CLASS<span>BRIDGE</span>
          </div>
        </Link>

        <div className="nav-label">MAIN MENU</div>

        <nav className="nav-list">
          <a href="#overview" className="nav-item active">
            <span className="nav-icon">▦</span>
            Dashboard
          </a>

          <a href="#students" className="nav-item">
            <span className="nav-icon">♙</span>
            Students
          </a>

          <a href="#teachers" className="nav-item">
            <span className="nav-icon">♧</span>
            Teachers
          </a>

          <a href="#classes" className="nav-item">
            <span className="nav-icon">▣</span>
            Classes & Subjects
          </a>

          <a href="#attendance" className="nav-item">
            <span className="nav-icon">◷</span>
            Attendance
          </a>

          <a href="#examinations" className="nav-item">
            <span className="nav-icon">✎</span>
            Examinations
          </a>

          <a href="#results" className="nav-item">
            <span className="nav-icon">▤</span>
            Results & Reports
          </a>
        </nav>

        <div className="nav-label">SCHOOL MANAGEMENT</div>

        <nav className="nav-list">
          <a href="#fees" className="nav-item">
            <span className="nav-icon">₦</span>
            School Fees
          </a>

          <a href="#salaries" className="nav-item">
            <span className="nav-icon">₦</span>
            Teacher Salaries
          </a>

          <a href="#timetable" className="nav-item">
            <span className="nav-icon">▥</span>
            Timetable
          </a>

          <a href="#announcements" className="nav-item">
            <span className="nav-icon">✉</span>
            Announcements
          </a>

          <a href="#settings" className="nav-item">
            <span className="nav-icon">⚙</span>
            Settings
          </a>

          <button
            className="nav-item"
            onClick={handleSignOut}
          >
            <span className="nav-icon">↪</span>
            Sign Out
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="avatar">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="profile-name">{adminName}</div>
              <div className="profile-role">
                School Administrator
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Your school's management and administration centre.
            </p>
          </div>

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
            <div className="school-selector">
              {schoolName}
            </div>
          )}
        </header>

        <section className="admin-school-letterhead">
          <div className="admin-school-emblem">
            {schoolName.charAt(0).toUpperCase()}
          </div>

          <div className="admin-school-heading">
            <span>OFFICIAL SCHOOL WORKSPACE</span>
            <h2>{schoolName}</h2>
            <p>CLASSBRIDGE SCHOOL MANAGEMENT PORTAL</p>
            <small>School Code: {schoolCode}</small>
          </div>
        </section>

        {error && (
          <div className="teacher-inline-error" role="alert">
            {error}
          </div>
        )}

        <section className="welcome-banner" id="overview">
          <div>
            <h2>
              Welcome back, {adminName.split(" ")[0]}!
            </h2>
            <p>
              Manage your school, support your teachers and
              help every student reach their full potential.
              <br />
              Your school management starts here.
            </p>
          </div>
          <a href="#school-statistics" className="banner-button">
            View School Statistics →
          </a>
        </section>

        <section
          className="stats-grid"
          id="school-statistics"
        >
          {[
            {
              label: "Total Students",
              value: stats.students,
              note: "Registered student records",
              icon: "♙",
              background: "#eaf2ff",
              color: "#1769e0",
            },
            {
              label: "Active Teachers",
              value: stats.teachers,
              note: "Approved teaching staff",
              icon: "♧",
              background: "#e8f8f1",
              color: "#159b69",
            },
            {
              label: "Active Parents",
              value: stats.parents,
              note: "Approved parent accounts",
              icon: "♧",
              background: "#f2edff",
              color: "#8055c9",
            },
            {
              label: "Classes",
              value: stats.classes,
              note: "Registered school classes",
              icon: "▣",
              background: "#fff4e4",
              color: "#e69a28",
            },
            {
              label: "Subjects",
              value: stats.subjects,
              note: "Available school subjects",
              icon: "▤",
              background: "#e8f8f1",
              color: "#159b69",
            },
            {
              label: "Pending Examinations",
              value: stats.pendingExams,
              note: "Awaiting your review",
              icon: "✎",
              background: "#ffeded",
              color: "#e45c62",
            },
          ].map((stat) => (
            <article className="stat-card" key={stat.label}>
              <div className="stat-top">
                <span className="stat-label">
                  {stat.label}
                </span>
                <span
                  className="stat-icon"
                  style={{
                    background: stat.background,
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </span>
              </div>

              <div className="stat-value">
                {statsLoading ? "—" : stat.value}
              </div>

              <div className="stat-note">{stat.note}</div>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  School Overview
                </h3>
                <p className="panel-caption">
                  Your school's current registration summary.
                </p>
              </div>
            </div>

            <div className="admin-overview-list">
              <div>
                <span>Registered students</span>
                <strong>{stats.students}</strong>
              </div>
              <div>
                <span>Active teachers</span>
                <strong>{stats.teachers}</strong>
              </div>
              <div>
                <span>Active parents</span>
                <strong>{stats.parents}</strong>
              </div>
              <div>
                <span>Classes and subjects</span>
                <strong>
                  {stats.classes} / {stats.subjects}
                </strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">
                  Administrator's Guide
                </h3>
                <p className="panel-caption">
                  Your school management starts here.
                </p>
              </div>
            </div>

            <div className="admin-guide">
              <div className="admin-guide-icon">✦</div>
              <h3>Build a better school experience</h3>
              <p>
                Register students, approve teachers, organise
                classes, review examinations and manage your
                school's academic activities.
              </p>
            </div>
          </article>
        </section>

        <section className="ai-card">
          <span className="ai-badge">✦ CLASSBRIDGE AI</span>
          <h3>
            Your intelligent teaching and learning assistant.
          </h3>
          <p>
            Prepare lesson notes, generate examination
            questions and support better learning experiences.
            Powered by ZENTRIX AI, developed by Ayanfe
            Innovation Labs Limited.
          </p>
        </section>

        <footer className="footer">
          CLASSBRIDGE © 2026 · Created by{" "}
          <strong>Ayanfe Innovation Labs Limited.</strong>
          <br />
          <span>Powered by ZENTRIX AI technology.</span>
        </footer>
      </section>
    </main>
  );
              }
