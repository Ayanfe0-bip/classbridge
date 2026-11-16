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
          ? \`\${request.full_name} has been approved successfully.\`
          : \`\${request.full_name}'s request has been rejected.\`
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
background: #f4f7fb;
padding: 28px 18px;
color: #17243a;
}

    .membership-wrap {
      max-width: 1050px;
      margin: 0 auto;
    }

    .membership-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
    }

    .membership-brand {
      font-size: 20px;
      font-weight: 900;
      color: #173b70;
      text-decoration: none;
    }

    .membership-brand span {
      color: #2684dc;
    }

    .membership-back {
      color: #1769b2;
      text-decoration: none;
      font-weight: 700;
    }

    .membership-heading h1 {
      font-size: clamp(25px, 4vw, 34px);
      margin: 0 0 8px;
    }

    .membership-heading p {
      color: #66758b;
      margin: 0 0 22px;
      line-height: 1.6;
    }

    .membership-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }

    .membership-select {
      padding: 12px 14px;
      border: 1px solid #d8e1ed;
      border-radius: 10px;
      background: #fff;
      min-width: 220px;
      color: #17243a;
    }

    .membership-count {
      font-weight: 700;
      color: #52647c;
    }

    .membership-card {
      background: #fff;
      border: 1px solid #e4eaf2;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 14px;
      box-shadow: 0 5px 20px rgba(25, 55, 90, .04);
    }

    .membership-card-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    .membership-name {
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 6px;
    }

    .membership-email {
      color: #63748b;
      overflow-wrap: anywhere;
    }

    .membership-badge {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 30px;
      background: #edf4ff;
      color: #2366ad;
      font-size: 12px;
      font-weight: 800;
      text-transform: capitalize;
    }

    .membership-meta {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      color: #687990;
      font-size: 13px;
      margin: 17px 0;
    }

    .membership-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .membership-button {
      border: 0;
      border-radius: 9px;
      padding: 10px 17px;
      font-weight: 800;
      cursor: pointer;
    }

    .membership-approve {
      background: #16865c;
      color: white;
    }

    .membership-reject {
      background: #fff0f0;
      color: #c23d46;
    }

    .membership-button:disabled {
      opacity: .55;
      cursor: wait;
    }

    .membership-alert {
      padding: 13px 15px;
      border-radius: 10px;
      margin: 14px 0;
      background: #fff0f0;
      color: #a62d37;
    }

    .membership-success {
      background: #eaf8f1;
      color: #13754e;
    }

    .membership-empty,
    .membership-loading {
      padding: 38px 20px;
      text-align: center;
      background: #fff;
      border: 1px solid #e4eaf2;
      border-radius: 16px;
      color: #687990;
    }

    @media (max-width: 600px) {
      .membership-page {
        padding: 18px 12px;
      }

      .membership-card {
        padding: 16px;
      }

      .membership-card-head {
        flex-direction: column;
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
      <h1>Membership Requests</h1>
      <p>
        Review teachers and parents who have requested
        access to your school.
      </p>
    </header>

    {schools.length > 1 && (
      <div className="membership-toolbar">
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
        Dashboard
      </Link>
    </div>

    {loading ? (
      <div className="membership-loading">
        Loading membership requests...
      </div>
    ) : requests.length === 0 ? (
      <div className="membership-empty">
        <h3>No pending requests</h3>
        <p>
          New teacher and parent applications will appear here.
        </p>
      </div>
    ) : (
      requests.map((request) => (
        <article
          className="membership-card"
          key={request.membership_id}
        >
          <div className="membership-card-head">
            <div>
              <h2 className="membership-name">
                {request.full_name || "Applicant"}
              </h2>

              <div className="membership-email">
                {request.email || "Email unavailable"}
              </div>
            </div>

            <span className="membership-badge">
              {request.role}
            </span>
          </div>

          <div className="membership-meta">
            <span>
              Requested:{" "}
              {new Date(request.created_at).toLocaleString()}
            </span>

            <span>Application status: Pending</span>
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
                : "Approve"}
            </button>

            <button
              className="membership-button membership-reject"
              disabled={
                workingId === request.membership_id
              }
              onClick={() =>
                reviewRequest(request, "reject")
              }
            >
              Reject
            </button>
          </div>
        </article>
      ))
    )}
  </div>
</main>

);
}
