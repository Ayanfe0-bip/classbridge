"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type School = {
  id: string;
  school_name: string;
  school_code: string;
};

type Teacher = {
  membership_id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  joined_at: string;
  assignment_count: number;
};

export default function AdminTeachersPage() {
  const router = useRouter();

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdmin() {
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

        if (membershipError) throw membershipError;

        if (!memberships?.length) {
          throw new Error("No active administrator membership found.");
        }

        const { data: records, error: schoolError } =
          await supabase
            .from("schools")
            .select("id, school_name, school_code")
            .in(
              "id",
              memberships.map((m) => m.school_id)
            );

        if (schoolError) throw schoolError;

        const available = (records || []) as School[];

        setSchools(available);

        if (available.length > 0) {
          setSchoolId(available[0].id);
          setSchoolName(available[0].school_name);
        } else {
          throw new Error("No registered school was found.");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load administrator account."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAdmin();
  }, [router]);

  const loadTeachers = useCallback(async () => {
    if (!schoolId) return;

    setListLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: listError } = await supabase.rpc(
        "list_school_teachers",
        { p_school_id: schoolId }
      );

      if (listError) throw listError;

      setTeachers((data || []) as Teacher[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load teachers."
      );
    } finally {
      setListLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const visibleTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesSearch =
        !term ||
        teacher.full_name.toLowerCase().includes(term) ||
        teacher.email.toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" || teacher.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [teachers, search, filter]);

  const activeCount = teachers.filter(
    (t) => t.status === "active"
  ).length;

  const pendingCount = teachers.filter(
    (t) => t.status === "pending"
  ).length;

  function changeSchool(id: string) {
    const school = schools.find((item) => item.id === id);

    setSchoolId(id);
    setSchoolName(school?.school_name || "");
  }

  if (loading) {
    return (
      <main className="page-state">
        <p>Loading teacher management...</p>
      </main>
    );
  }

  return (
    <main className="teachers-page">
      <style jsx>{`
        .teachers-page {
          min-height: 100vh;
          background: #f4f7fb;
          color: #17243a;
          padding: 28px 18px 48px;
        }

        .wrap {
          max-width: 1120px;
          margin: auto;
        }

        .back {
          color: #2864c5;
          text-decoration: none;
          font-weight: 700;
        }

        .brand {
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.3px;
          margin-top: 15px;
        }

        h1 {
          margin: 8px 0;
          font-size: 32px;
        }

        .sub {
          color: #64748b;
          font-size: 14px;
        }

        .school-select,
        .search,
        .filter {
          padding: 12px;
          border: 1px solid #dbe3ef;
          border-radius: 10px;
          background: white;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin: 25px 0;
        }

        .stat,
        .panel {
          background: white;
          border: 1px solid #e5ebf3;
          border-radius: 16px;
          padding: 20px;
        }

        .stat span {
          color: #718096;
          font-size: 13px;
        }

        .stat strong {
          display: block;
          font-size: 28px;
          margin-top: 8px;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .controls {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
        }

        .search {
          min-width: 220px;
        }

        .refresh {
          background: #eaf1ff;
          color: #2459ad;
          border: 0;
          border-radius: 10px;
          padding: 11px 15px;
          font-weight: 800;
        }

        .teacher-list {
          display: grid;
          gap: 12px;
        }

        .teacher {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border: 1px solid #edf1f6;
          border-radius: 13px;
        }

        .identity {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .avatar {
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #e9f1ff;
          color: #2864c5;
          font-weight: 800;
        }

        .name {
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .email {
          color: #718096;
          font-size: 13px;
          margin-top: 4px;
          overflow-wrap: anywhere;
        }

        .details {
          display: flex;
          align-items: center;
          gap: 13px;
          color: #64748b;
          font-size: 13px;
          flex-wrap: wrap;
        }

        .badge {
          padding: 6px 10px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 800;
          text-transform: capitalize;
          background: #edf2f7;
        }

        .badge.active {
          background: #e5f8ed;
          color: #16834b;
        }

        .badge.pending {
          background: #fff5df;
          color: #a66a00;
        }

        .badge.rejected {
          background: #ffebeb;
          color: #bd3434;
        }

        .empty {
          text-align: center;
          padding: 40px 12px;
          color: #718096;
        }

        .error {
          padding: 13px;
          border-radius: 10px;
          background: #fff0f0;
          color: #b42318;
          margin: 15px 0;
        }

        .footer {
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          margin-top: 28px;
          line-height: 1.8;
        }

        @media (max-width: 650px) {
          .teachers-page {
            padding: 20px 12px;
          }

          .stats {
            gap: 8px;
          }

          .stat {
            padding: 12px;
          }

          .stat strong {
            font-size: 23px;
          }

          .stat span {
            font-size: 11px;
          }

          .teacher {
            align-items: flex-start;
            flex-direction: column;
          }

          .details {
            padding-left: 55px;
          }

          .controls,
          .search {
            width: 100%;
          }

          .filter {
            flex: 1;
          }
        }
      `}</style>

      <div className="wrap">
        <Link href="/admin" className="back">
          ← Back to Admin Dashboard
        </Link>

        <div className="brand">
          CLASSBRIDGE ADMINISTRATION
        </div>

        <h1>Teacher Management</h1>

        <p className="sub">
          Welcome, {adminName}. Manage teachers in {schoolName}.
        </p>

        {schools.length > 1 && (
          <select
            className="school-select"
            value={schoolId}
            onChange={(e) => changeSchool(e.target.value)}
          >
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.school_name}
              </option>
            ))}
          </select>
        )}

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        <section className="stats">
          <div className="stat">
            <span>Total teachers</span>
            <strong>{teachers.length}</strong>
          </div>

          <div className="stat">
            <span>Active teachers</span>
            <strong>{activeCount}</strong>
          </div>

          <div className="stat">
            <span>Pending requests</span>
            <strong>{pendingCount}</strong>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Teacher Directory</h2>

            <div className="controls">
              <input
                className="search"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                className="refresh"
                onClick={loadTeachers}
                disabled={listLoading}
              >
                {listLoading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>
          </div>

          {listLoading ? (
            <div className="empty">
              Loading teacher records...
            </div>
          ) : visibleTeachers.length === 0 ? (
            <div className="empty">
              {teachers.length === 0
                ? "No teacher records found for this school yet."
                : "No teachers match your search."}
            </div>
          ) : (
            <div className="teacher-list">
              {visibleTeachers.map((teacher) => (
                <article
                  className="teacher"
                  key={teacher.membership_id}
                >
                  <div className="identity">
                    <div className="avatar">
                      {(teacher.full_name || "T")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <div className="name">
                        {teacher.full_name || "Teacher"}
                      </div>

                      <div className="email">
                        {teacher.email || "Email unavailable"}
                      </div>
                    </div>
                  </div>

                  <div className="details">
                    <span>
                      {teacher.assignment_count} assignments
                    </span>

                    <span>
                      Joined{" "}
                      {new Date(
                        teacher.joined_at
                      ).toLocaleDateString()}
                    </span>

                    <span className={`badge ${teacher.status}`}>
                      {teacher.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="footer">
          CLASSBRIDGE · School Management Platform
          <br />
          Created by Ayanfe Innovation Labs Limited.
        </footer>
      </div>
    </main>
  );
}
