"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type School = {
  id: string;
  school_name: string;
};

type RequestRow = {
  membership_id: string;
  school_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  full_name: string;
  email: string;
};

export default function MembershipRequestsPage() {
  const router = useRouter();

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSchools() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: memberships, error: membershipError } =
        await supabase
          .from("school_memberships")
          .select("school_id")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .eq("status", "active");

      if (membershipError) {
        setError(membershipError.message);
        setLoading(false);
        return;
      }

      const ids = (memberships || []).map(
        (item) => item.school_id
      );

      if (!ids.length) {
        setError("No active administrator membership was found.");
        setLoading(false);
        return;
      }

      const { data: schoolRows, error: schoolError } =
        await supabase
          .from("schools")
          .select("id, school_name")
          .in("id", ids)
          .order("school_name");

      if (schoolError) {
        setError(schoolError.message);
        setLoading(false);
        return;
      }

      const available = (schoolRows || []) as School[];

      setSchools(available);

      if (available.length) {
        setSchoolId(available[0].id);
      }

      setLoading(false);
    }

    loadSchools();
  }, [router]);

  useEffect(() => {
    if (!schoolId) return;

    async function loadRequests() {
      setLoading(true);
      setError("");

      const supabase = createClient();

      const { data, error: requestError } =
        await supabase.rpc(
          "list_school_membership_requests",
          { p_school_id: schoolId }
        );

      if (requestError) {
        setError(requestError.message);
        setRequests([]);
      } else {
        setRequests((data || []) as RequestRow[]);
      }

      setLoading(false);
    }

    loadRequests();
  }, [schoolId]);

  async function reviewRequest(
    request: RequestRow,
    decision: "approve" | "reject"
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to ${decision} ${request.full_name}'s ${request.role} request?`
    );

    if (!confirmed) return;

    setWorkingId(request.membership_id);
    setError("");
    setMessage("");

    const supabase = createClient();

    const { error: reviewError } = await supabase.rpc(
      "review_school_membership",
      {
        p_membership_id: request.membership_id,
        p_decision: decision,
      }
    );

    if (reviewError) {
      setError(reviewError.message);
    } else {
      setMessage(
        decision === "approve"
          ? `${request.full_name} has been approved successfully.`
          : `${request.full_name}'s request has been rejected.`
      );

      setRequests((current) =>
        current.filter(
          (item) =>
            item.membership_id !== request.membership_id
        )
      );
    }

    setWorkingId("");
  }

  return (
    <main className="membership-page">
      <style jsx>{`
        .membership-page {
          min-height: 100vh;
          padding: 32px 20px 60px;
          background: #f4f7fc;
          color: #172b4d;
        }

        .membership-wrap {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }

        .membership-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 42px;
        }

        .membership-brand {
          color: #173b70;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.8px;
          text-decoration: none;
        }

        .membership-brand span {
          color: #2684dc;
        }

        .membership-back {
          color: #2475bf;
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
        }

        .membership-back:hover {
          color: #12477f;
          text-decoration: underline;
        }

        .membership-heading {
          margin-bottom: 28px;
        }

        .membership-eyebrow {
          display: inline-block;
          margin-bottom: 12px;
          padding: 7px 12px;
          border-radius: 30px;
          background: #e6f1ff;
          color: #236ab1;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .membership-heading h1 {
          margin: 0 0 10px;
          color: #142b4b;
          font-size: clamp(28px, 5vw, 38px);
          line-height: 1.15;
          letter-spacing: -1.2px;
        }

        .membership-heading p {
          max-width: 650px;
          margin: 0;
          color: #718096;
          font-size: 15px;
          line-height: 1.75;
        }

        .membership-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          margin: 22px 0;
        }

        .membership-school-control {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .membership-school-control label {
          color: #43546b;
          font-size: 13px;
          font-weight: 800;
        }

        .membership-select {
          min-width: 240px;
          max-width: 100%;
          padding: 12px 38px 12px 14px;
          border: 1px solid #dce5f0;
          border-radius: 11px;
          outline: none;
          background: #fff;
          color: #243b5a;
          font-size: 14px;
          font-weight: 650;
          box-shadow: 0 2px 8px rgba(23, 59, 112, 0.04);
        }

        .membership-select:focus {
          border-color: #3989d8;
          box-shadow: 0 0 0 3px rgba(57, 137, 216, 0.13);
        }

        .membership-count {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 10px 14px;
          border: 1px solid #e3eaf3;
          border-radius: 30px;
          background: #fff;
          color: #425875;
          font-size: 13px;
          font-weight: 850;
        }

        .membership-count::before {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #e49b32;
          content: "";
        }

        .membership-section-label {
          margin: 28px 0 15px;
          color: #253e60;
          font-size: 16px;
          font-weight: 850;
        }

        .membership-card {
          margin: 14px 0;
          padding: 24px;
          border: 1px solid #e4ebf4;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 7px 24px rgba(31, 61, 99, 0.055);
          transition:
            border-color 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .membership-card:hover {
          transform: translateY(-2px);
          border-color: #cbdced;
          box-shadow: 0 12px 30px rgba(31, 61, 99, 0.09);
        }

        .membership-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .membership-person {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .membership-avatar {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background: #e8f2ff;
          color: #236ab1;
          font-size: 19px;
          font-weight: 900;
        }

        .membership-name {
          margin: 0 0 6px;
          color: #1b3455;
          font-size: 18px;
          font-weight: 850;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .membership-email {
          color: #718096;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .membership-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 13px;
          border: 1px solid #d7e8fb;
          border-radius: 30px;
          background: #edf5ff;
          color: #2366ad;
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .membership-divider {
          height: 1px;
          margin: 20px 0;
          background: #edf1f6;
        }

        .membership-meta {
          display: flex;
          align-items: center;
          gap: 12px 25px;
          flex-wrap: wrap;
          color: #718096;
          font-size: 12px;
          line-height: 1.6;
        }

        .membership-meta strong {
          color: #425875;
          font-weight: 750;
        }

        .membership-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #ad741d;
          font-weight: 800;
        }

        .membership-status::before {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e4a43d;
          content: "";
        }

        .membership-actions {
          display: flex;
          align-items: center;
          gap: 11px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        .membership-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 115px;
          min-height: 42px;
          padding: 11px 19px;
          border: 0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
          transition:
            background 0.2s ease,
            transform 0.2s ease,
            opacity 0.2s ease;
        }

        .membership-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .membership-approve {
          background: #13845b;
          color: #fff;
        }

        .membership-approve:hover:not(:disabled) {
          background: #0e6d49;
        }

        .membership-reject {
          border: 1px solid #f3d7d9;
          background: #fff5f5;
          color: #c23d46;
        }

        .membership-reject:hover:not(:disabled) {
          background: #ffe8e9;
        }

        .membership-button:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        .membership-alert {
          margin: 18px 0;
          padding: 15px 17px;
          border: 1px solid #f2d3d5;
          border-radius: 12px;
          background: #fff1f1;
          color: #a62d37;
          font-size: 14px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .membership-success {
          border-color: #c8ead8;
          background: #eaf8f1;
          color: #13754e;
        }

        .membership-empty,
        .membership-loading {
          padding: 55px 22px;
          border: 1px solid #e4ebf4;
          border-radius: 18px;
          background: #fff;
          color: #718096;
          text-align: center;
          box-shadow: 0 7px 24px rgba(31, 61, 99, 0.04);
        }

        .membership-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          margin: 0 auto 17px;
          border-radius: 18px;
          background: #edf5ff;
          color: #2778c1;
          font-size: 25px;
          font-weight: 900;
        }

        .membership-empty h3 {
          margin: 0 0 9px;
          color: #263f60;
          font-size: 19px;
          font-weight: 850;
        }

        .membership-empty p {
          max-width: 400px;
          margin: 0 auto;
          font-size: 13px;
          line-height: 1.7;
        }

        .membership-loading {
          font-size: 14px;
          font-weight: 700;
        }

        .membership-footer {
          margin-top: 38px;
          padding-top: 18px;
          border-top: 1px solid #e3eaf2;
          color: #8a98aa;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 650px) {
          .membership-page {
            padding: 22px 14px 40px;
          }

          .membership-top {
            margin-bottom: 34px;
          }

          .membership-brand {
            font-size: 19px;
          }

          .membership-back {
            font-size: 12px;
          }

          .membership-heading {
            margin-bottom: 23px;
          }

          .membership-heading p {
            font-size: 14px;
          }

          .membership-toolbar {
            align-items: stretch;
          }

          .membership-school-control {
            align-items: stretch;
            flex-direction: column;
            width: 100%;
          }

          .membership-select {
            width: 100%;
            min-width: 0;
          }

          .membership-card {
            padding: 18px;
            border-radius: 15px;
          }

          .membership-card-head {
            flex-direction: column;
            gap: 15px;
          }

          .membership-person {
            align-items: flex-start;
          }

          .membership-name {
            font-size: 16px;
          }

          .membership-badge {
            margin-left: 62px;
          }

          .membership-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .membership-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .membership-button {
            min-width: 0;
            width: 100%;
            padding: 11px 10px;
          }
        }

        @media (max-width: 380px) {
          .membership-top {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
          }

          .membership-actions {
            grid-template-columns: 1fr;
          }

          .membership-person {
            gap: 10px;
          }

          .membership-avatar {
            width: 42px;
            height: 42px;
          }

          .membership-badge {
            margin-left: 52px;
          }
        }
      `}</style>

      <div className="membership-wrap">
        <div className="membership-top">
          <Link href="/admin" className="membership-brand">
            CLASS<span>BRIDGE</span>
          </Link>

          <Link href="/admin" className="membership-back">
            ← Back to Dashboard
          </Link>
        </div>

        <header className="membership-heading">
          <span className="membership-eyebrow">
            Administration
          </span>

          <h1>Membership Requests</h1>

          <p>
            Manage applications from teachers and parents requesting
            access to your school. Review each application and decide
            who can join your school community.
          </p>
        </header>

        {schools.length > 1 && (
          <div className="membership-toolbar">
            <div className="membership-school-control">
              <label htmlFor="request-school">
                Select school
              </label>

              <select
                id="request-school"
                className="membership-select"
                value={schoolId}
                onChange={(event) =>
                  setSchoolId(event.target.value)
                }
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.school_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="membership-alert" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div
            className="membership-alert membership-success"
            role="status"
          >
            {message}
          </div>
        )}

        <div className="membership-toolbar">
          <span className="membership-count">
            {requests.length} pending request
            {requests.length === 1 ? "" : "s"}
          </span>

          <Link href="/admin" className="membership-back">
            Dashboard →
          </Link>
        </div>

        <h2 className="membership-section-label">
          Applications awaiting review
        </h2>

        {loading ? (
          <div className="membership-loading">
            Loading membership requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="membership-empty">
            <div className="membership-empty-icon">
              ✓
            </div>

            <h3>No pending requests</h3>

            <p>
              You're all caught up. New teacher and parent
              applications will appear here when they request
              access to your school.
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <article
              className="membership-card"
              key={request.membership_id}
            >
              <div className="membership-card-head">
                <div className="membership-person">
                  <div className="membership-avatar">
                    {(request.full_name || "A")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h2 className="membership-name">
                      {request.full_name || "Applicant"}
                    </h2>

                    <div className="membership-email">
                      {request.email || "Email unavailable"}
                    </div>
                  </div>
                </div>

                <span className="membership-badge">
                  {request.role}
                </span>
              </div>

              <div className="membership-divider" />

              <div className="membership-meta">
                <span>
                  <strong>Requested:</strong>{" "}
                  {new Date(request.created_at).toLocaleString()}
                </span>

                <span className="membership-status">
                  Pending review
                </span>
              </div>

              <div className="membership-actions">
                <button
                  className="membership-button membership-approve"
                  disabled={
                    workingId === request.membership_id
                  }
                  onClick={() =>
                    reviewRequest(request, "approve")
                  }
                >
                  {workingId === request.membership_id
                    ? "Processing..."
                    : "✓ Approve"}
                </butt
