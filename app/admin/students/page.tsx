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

type SchoolClass = {
id: string;
class_name: string;
class_level: string | null;
};

type Student = {
id: string;
school_id: string;
admission_number: string;
first_name: string;
last_name: string;
middle_name: string | null;
gender: string | null;
date_of_birth: string | null;
class_name: string | null;
class_id: string | null;
photo_url: string | null;
created_at: string;
status: string;
};

const initialForm = {
admission_number: "",
first_name: "",
last_name: "",
middle_name: "",
gender: "",
date_of_birth: "",
class_id: "",
};

export default function AdminStudentsPage() {
const router = useRouter();

const [schools, setSchools] = useState<School[]>([]);
const [schoolId, setSchoolId] = useState("");
const [schoolName, setSchoolName] = useState("");
const [classes, setClasses] = useState<SchoolClass[]>([]);
const [students, setStudents] = useState<Student[]>([]);
const [form, setForm] = useState(initialForm);
const [photo, setPhoto] = useState<File | null>(null);
const [editingId, setEditingId] = useState("");
const [search, setSearch] = useState("");
const [classFilter, setClassFilter] = useState("all");
const [statusFilter, setStatusFilter] = useState("active");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [notice, setNotice] = useState("");

useEffect(() => {
async function init() {
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

    const { data: memberships, error: membershipError } =
      await supabase
        .from("school_memberships")
        .select("school_id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .eq("status", "active");

    if (membershipError) throw membershipError;

    if (!memberships?.length) {
      throw new Error("No active administrator school was found.");
    }

    const { data, error: schoolError } = await supabase
      .from("schools")
      .select("id, school_name, school_code")
      .in(
        "id",
        memberships.map((m) => m.school_id)
      );

    if (schoolError) throw schoolError;

    const available = (data || []) as School[];

    setSchools(available);

    if (available[0]) {
      setSchoolId(available[0].id);
      setSchoolName(available[0].school_name);
    }
  } catch (e) {
    setError(
      e instanceof Error
        ? e.message
        : "Unable to load student management."
    );
  } finally {
    setLoading(false);
  }
}

init();

}, [router]);

const loadData = useCallback(async () => {
if (!schoolId) return;

setError("");

const supabase = createClient();

const [studentResult, classResult] = await Promise.all([
  supabase
    .from("students")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false }),

  supabase
    .from("classes")
    .select("id, class_name, class_level")
    .eq("school_id", schoolId)
    .order("class_name"),
]);

if (studentResult.error) {
  setError(studentResult.error.message);
} else {
  setStudents((studentResult.data || []) as Student[]);
}

if (classResult.error) {
  setError(classResult.error.message);
} else {
  setClasses((classResult.data || []) as SchoolClass[]);
}

}, [schoolId]);

useEffect(() => {
loadData();
}, [loadData]);

const visibleStudents = useMemo(() => {
  const term = search.trim().toLowerCase();

  return students.filter((s) => {
    const name = [
      s.first_name,
      s.middle_name,
      s.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesText =
      !term ||
      name.includes(term) ||
      (s.admission_number || "").toLowerCase().includes(term);

    return (
      matchesText &&
      (classFilter === "all" || s.class_id === classFilter) &&
      (statusFilter === "all" || s.status === statusFilter)
    );
  });
}, [students, search, classFilter, statusFilter]);
function startEdit(student: Student) {
setEditingId(student.id);

setForm({
  admission_number: student.admission_number || "",
  first_name: student.first_name || "",
  last_name: student.last_name || "",
  middle_name: student.middle_name || "",
  gender: student.gender || "",
  date_of_birth: student.date_of_birth || "",
  class_id: student.class_id || "",
});

setPhoto(null);

window.scrollTo({
  top: 0,
  behavior: "smooth",
});

}

async function saveStudent(
event: React.FormEvent<HTMLFormElement>
) {
event.preventDefault();

if (!schoolId) return;

if (
  !form.first_name.trim() ||
  !form.last_name.trim() ||
  !form.admission_number.trim()
) {
  setError(
    "Enter the student's first name, last name and admission number."
  );
  return;
}

setSaving(true);
setError("");
setNotice("");

const supabase = createClient();

const selectedClass = classes.find(
  (c) => c.id === form.class_id
);

const payload = {
  school_id: schoolId,
  admission_number: form.admission_number.trim(),
  first_name: form.first_name.trim(),
  last_name: form.last_name.trim(),
  middle_name: form.middle_name.trim() || null,
  gender: form.gender || null,
  date_of_birth: form.date_of_birth || null,
  class_id: selectedClass?.id || null,
  class_name: selectedClass?.class_name || null,
};

try {
  let studentId = editingId;

  if (editingId) {
    const { error: updateError } = await supabase
      .from("students")
      .update(payload)
      .eq("id", editingId)
      .eq("school_id", schoolId);

    if (updateError) throw updateError;
  } else {
    const { data, error: insertError } = await supabase
      .from("students")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) throw insertError;

    studentId = data.id;
  }

  if (photo && studentId) {
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(photo.type)
    ) {
      throw new Error(
        "Choose a JPG, PNG or WebP photograph."
      );
    }

    if (photo.size > 2 * 1024 * 1024) {
      throw new Error(
        "Photograph must be 2MB or smaller."
      );
    }

    const extension =
      photo.name.split(".").pop()?.toLowerCase() || "jpg";

    const path = `${schoolId}/${studentId}/passport.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("student-photos")
      .upload(path, photo, {
        upsert: true,
        contentType: photo.type,
      });

    if (uploadError) throw uploadError;

    const { error: photoUpdateError } = await supabase
      .from("students")
      .update({ photo_url: path })
      .eq("id", studentId)
      .eq("school_id", schoolId);

    if (photoUpdateError) throw photoUpdateError;
  }

  setNotice(
    editingId
      ? "Student record updated successfully."
      : "Student registered successfully."
  );

  resetForm();
  await loadData();
} catch (e) {
  setError(
    e instanceof Error
      ? e.message
      : "Unable to save student record."
  );
} finally {
  setSaving(false);
}

}

async function deleteStudent(student: Student) {
const confirmed = window.confirm(
"Mark ${student.first_name} ${student.last_name} as withdrawn? Their records and photograph will be preserved."
);

if (!confirmed) return;

setError("");
setNotice("");

const supabase = createClient();

try {
const { error: updateError } = await supabase
.from("students")
.update({ status: "withdrawn" })
.eq("id", student.id)
.eq("school_id", schoolId);

if (updateError) throw updateError;

setNotice("Student marked as withdrawn. Their records have been preserved.");

await loadData();

} catch (e) {
setError(
e instanceof Error
? e.message
: "Unable to update student status."
);
}
}
const function changeSchool(id: string) {
const selected = schools.find((s) => s.id === id);

setSchoolId(id);
setSchoolName(selected?.school_name || "");

resetForm();
setStudents([]);
setClasses([]);

}

if (loading) {
return (
<main className="student-page">
<div className="student-state">
Loading Student Management...
</div>
</main>
);
}

return (
<main className="student-page">
<style jsx>{`
.student-page {
min-height: 100vh;
background: #f3f6fb;
color: #172b49;
padding: 25px 16px 45px;
}

    .student-wrap {
      max-width: 1180px;
      margin: auto;
    }

    .student-back {
      color: #1769e0;
      font-weight: 800;
      font-size: 13px;
    }

    .student-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin: 20px 0 24px;
    }

    .student-head h1 {
      font-size: 30px;
      margin: 0 0 7px;
      font-weight: 850;
    }

    .student-head p,
    .muted {
      color: #718198;
      font-size: 13px;
      line-height: 1.6;
    }

    .school-select,
    .student-input,
    .student-select {
      width: 100%;
      padding: 12px 13px;
      border: 1px solid #dce5f0;
      border-radius: 10px;
      background: #fff;
      color: #243b59;
      outline: none;
    }

    .school-select {
      max-width: 260px;
    }

    .student-grid {
      display: grid;
      grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.5fr);
      gap: 18px;
      align-items: start;
    }

    .student-panel {
      background: #fff;
      border: 1px solid #e4ebf4;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 8px 24px rgba(35, 65, 105, 0.04);
    }

    .student-panel h2 {
      font-size: 17px;
      margin-bottom: 5px;
    }

    .student-panel .muted {
      margin-bottom: 18px;
    }

    .student-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .student-field {
      display: flex;
      flex-direction: column;
      gap: 7px;
      margin-bottom: 12px;
    }

    .student-field label {
      font-size: 11px;
      font-weight: 800;
      color: #536781;
    }

    .student-field.full {
      grid-column: 1 / -1;
    }

    .student-actions {
      display: flex;
      gap: 9px;
      flex-wrap: wrap;
      margin-top: 5px;
    }

    .student-btn {
      border: 0;
      border-radius: 10px;
      padding: 12px 15px;
      font-weight: 800;
      font-size: 12px;
    }

    .student-primary {
      background: #1769e0;
      color: white;
    }

    .student-secondary {
      background: #edf2f8;
      color: #52657d;
    }

    .student-danger {
      background: #fff0f0;
      color: #bd3d47;
    }

    .student-btn:disabled {
      opacity: 0.6;
      cursor: wait;
    }

    .student-alert {
      padding: 12px 14px;
      border-radius: 10px;
      margin: 14px 0;
      font-size: 13px;
      line-height: 1.5;
      background: #fff0f0;
      color: #ad3540;
    }

    .student-success {
      background: #eaf8f1;
      color: #13764e;
    }

    .student-toolbar {
      display: flex;
      gap: 10px;
      margin: 16px 0;
      flex-wrap: wrap;
    }

    .student-toolbar .student-input {
      flex: 1;
      min-width: 160px;
    }

    .student-table-wrap {
      overflow-x: auto;
    }

    .student-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 600px;
    }

    .student-table th,
    .student-table td {
      text-align: left;
      padding: 13px 10px;
      border-bottom: 1px solid #edf1f6;
      font-size: 12px;
    }

    .student-table th {
      color: #8290a5;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .student-name {
      font-weight: 800;
      color: #233c5c;
    }

    .student-sub {
      font-size: 10px;
      color: #8290a5;
      margin-top: 4px;
    }

    .student-count {
      font-size: 12px;
      color: #718198;
      margin-bottom: 12px;
    }

    .student-empty {
      text-align: center;
      padding: 35px 10px;
      color: #8290a5;
      font-size: 13px;
    }

    .student-photo {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      object-fit: cover;
      background: #edf3fb;
    }

    .student-footer {
      text-align: center;
      color: #8a98aa;
      font-size: 11px;
      margin-top: 30px;
    }

    @media (max-width: 850px) {
      .student-grid {
        grid-template-columns: 1fr;
      }

      .student-head {
        align-items: flex-start;
        flex-direction: column;
      }

      .school-select {
        max-width: none;
      }
    }

    @media (max-width: 520px) {
      .student-fields {
        grid-template-columns: 1fr;
      }

      .student-field.full {
        grid-column: auto;
      }

      .student-page {
        padding: 20px 12px 35px;
      }

      .student-head h1 {
        font-size: 25px;
      }
    
    /* PREMIUM STUDENT PORTAL DESIGN */

.student-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 8% 0%, rgba(37,112,232,.10), transparent 28rem),
    linear-gradient(180deg, #f5f8ff 0%, #eef3fa 100%);
  color: #172b49;
  padding: 22px 16px 48px;
}

.student-wrap {
  max-width: 1220px;
  margin: auto;
}

/* MODERN DASHBOARD BACK BUTTON */

.student-back {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 7px 16px 7px 8px;
  border: 1px solid #dce7f7;
  border-radius: 999px;
  background: rgba(255,255,255,.95);
  color: #245b9f;
  font-weight: 800;
  font-size: 13px;
  text-decoration: none;
  box-shadow: 0 5px 18px rgba(31,73,130,.07);
  transition: .2s ease;
}

.student-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 24px rgba(31,73,130,.12);
}

.student-back-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg,#1769e0,#4597f5);
  color: #fff;
  font-size: 19px;
  line-height: 1;
}

/* PREMIUM BLUE HEADER */

.student-head {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin: 20px 0 24px;
  padding: 27px 30px;
  border: 1px solid rgba(255,255,255,.55);
  border-radius: 25px;
  background: linear-gradient(118deg,#123b75 0%,#1769c8 58%,#398ce9 100%);
  color: #fff;
  box-shadow: 0 16px 38px rgba(24,83,153,.19);
}

.student-head::after {
  content: "";
  position: absolute;
  width: 250px;
  height: 250px;
  right: 10%;
  top: -155px;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 50%;
  box-shadow:
    0 0 0 28px rgba(255,255,255,.045),
    0 0 0 58px rgba(255,255,255,.035);
  pointer-events: none;
}

.student-head-copy {
  position: relative;
  z-index: 1;
}

.student-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: #c9e3ff;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1.6px;
  text-transform: uppercase;
}

.student-kicker-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #78e2c1;
  box-shadow: 0 0 0 4px rgba(120,226,193,.15);
}

.student-head h1 {
  font-size: clamp(25px,4vw,34px);
  margin: 0 0 7px;
  font-weight: 900;
  letter-spacing: -.8px;
  color: #fff;
}

.student-head p {
  max-width: 560px;
  margin: 0;
  color: #d9eaff;
  font-size: 13px;
  line-height: 1.65;
}

/* SCHOOL IDENTITY CARD */

.student-school-chip {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 310px;
  min-width: 190px;
  padding: 12px 15px;
  border: 1px solid rgba(255,255,255,.23);
  border-radius: 15px;
  background: rgba(255,255,255,.13);
  color: #fff;
  backdrop-filter: blur(12px);
}

.student-school-mark {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: rgba(255,255,255,.18);
  font-size: 18px;
}

.student-school-label {
  display: block;
  margin-bottom: 3px;
  color: #c8e2ff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.student-school-name {
  display: block;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.4;
}

.student-head .school-select {
  position: relative;
  z-index: 1;
  max-width: 280px;
  border: 1px solid rgba(255,255,255,.35);
  background: rgba(255,255,255,.96);
}

.student-head .muted {
  position: relative;
  z-index: 1;
  max-width: 280px;
  padding: 13px 16px;
  border: 1px solid rgba(255,255,255,.23);
  border-radius: 14px;
  background: rgba(255,255,255,.13);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

/* MOBILE RESPONSIVENESS */

@media (max-width: 850px) {
  .student-grid {
    grid-template-columns: 1fr;
  }

  .student-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .student-head .school-select,
  .student-head .muted,
  .student-school-chip {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 520px) {
  .student-page {
    padding: 14px 11px 30px;
  }

  .student-back {
    min-height: 42px;
    padding-right: 14px;
    font-size: 12px;
  }

  .student-head {
    gap: 17px;
    margin: 15px 0 18px;
    padding: 22px 18px;
    border-radius: 20px;
  }

  .student-head h1 {
    font-size: 27px;
  }

  .student-head p {
    font-size: 12px;
  }

  .student-grid {
    gap: 14px;
  }

  .student-panel {
    padding: 16px 14px;
    border-radius: 18px;
  }

  .student-fields {
    grid-template-columns: 1fr;
  }

  .student-field.full {
    grid-column: auto;
  }

  .student-toolbar {
    flex-direction: column;
  }

  .student-toolbar .student-input,
  .student-toolbar .student-select {
    max-width: none !important;
    width: 100%;
  }

  .student-actions .student-btn {
    flex: 1;
  }
    }
    /* PREMIUM REGISTERED STUDENTS TABLE */

.student-table-wrap {
  border: 1px solid #e5edf7;
  border-radius: 15px;
  overflow-x: auto;
  background: #fff;
}

.student-table {
  width: 100%;
  min-width: 600px;
  border-collapse: separate;
  border-spacing: 0;
}

.student-table th {
  padding: 15px 12px;
  background: #f1f6fd;
  color: #526b8c;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1px;
  border-bottom: 1px solid #e1eaf5;
}

.student-table td {
  padding: 13px 12px;
  color: #405570;
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid #edf2f8;
  vertical-align: middle;
}

.student-table tbody tr {
  transition: background .2s ease;
}

.student-table tbody tr:hover {
  background: #f7faff;
}

.student-table tbody tr:last-child td {
  border-bottom: none;
}

/* SMALLER STUDENT PHOTOS */

.student-photo {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid #e5effc;
  box-shadow: 0 2px 6px rgba(25,70,130,.08);
}

/* STUDENT NAME TYPOGRAPHY */

.student-name {
  color: #183b68;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: .1px;
  line-height: 1.5;
}

.student-sub {
  color: #8a9bb1;
  font-size: 10px;
  font-weight: 600;
  margin-top: 3px;
}

/* MODERN ACTION BUTTONS */

.student-table .student-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 34px;
  padding: 7px 11px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 850;
  cursor: pointer;
  transition: all .2s ease;
  white-space: nowrap;
}

.student-table .student-secondary {
  background: #eaf3ff;
  color: #1769d2;
  border: 1px solid #d5e7ff;
}

.student-table .student-secondary:hover {
  background: #1769d2;
  color: #fff;
  transform: translateY(-1px);
}

.student-table .student-danger {
  background: #fff0f0;
  color: #d34450;
  border: 1px solid #ffdddd;
}

.student-table .student-danger:hover {
  background: #d34450;
  color: #fff;
  transform: translateY(-1px);
}
`}</style>

<div className="student-wrap">

  <Link href="/admin" className="student-back">
  <span className="student-back-icon">‹</span>
  <span>Administrator Dashboard</span>
</Link>

<header className="student-head">
  <div className="student-head-copy">
    <div className="student-kicker">
      <span className="student-kicker-dot" />
      Administrator workspace
    </div>

    <h1>Student Portal</h1>

    <p>
      Manage admissions, student profiles, class placement
      and official school records from one organised workspace.
    </p>
  </div>

  {schools.length > 1 ? (
    <select
      className="school-select"
      value={schoolId}
      onChange={(e) => changeSchool(e.target.value)}
      aria-label="Select school"
    >
      {schools.map((s) => (
        <option key={s.id} value={s.id}>
          {s.school_name}
        </option>
      ))}
    </select>
  ) : (
    <div className="student-school-chip">
      <span className="student-school-mark">⌂</span>
      <span>
        <span className="student-school-label">
          Managing school
        </span>
        <span className="student-school-name">
          {schoolName}
        </span>
      </span>
    </div>
  )}
</header>

    {error && (
      <div className="student-alert" role="alert">
        {error}
      </div>
    )}

    {notice && (
      <div
        className="student-alert student-success"
        role="status"
      >
        {notice}
      </div>
    )}

    <div className="student-grid">
      <section className="student-panel">
        <h2>
          {editingId
            ? "Edit student record"
            : "Register a student"}
        </h2>

        <p className="muted">
          Complete the student's details below. Class
          assignment is managed by the school administrator.
        </p>

        <form onSubmit={saveStudent}>
          <div className="student-fields">
            <div className="student-field full">
              <label>Admission number *</label>
              <input
                className="student-input"
                value={form.admission_number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    admission_number: e.target.value,
                  })
                }
                placeholder="e.g. OSC/2026/001"
                required
              />
            </div>

            <div className="student-field">
              <label>First name *</label>
              <input
                className="student-input"
                value={form.first_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    first_name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="student-field">
              <label>Last name *</label>
              <input
                className="student-input"
                value={form.last_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    last_name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="student-field full">
              <label>Middle name</label>
              <input
                className="student-input"
                value={form.middle_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    middle_name: e.target.value,
                  })
                }
              />
            </div>

            <div className="student-field">
              <label>Gender</label>
              <select
                className="student-select"
                value={form.gender}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gender: e.target.value,
                  })
                }
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="student-field">
              <label>Date of birth</label>
              <input
                className="student-input"
                type="date"
                value={form.date_of_birth}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date_of_birth: e.target.value,
                  })
                }
              />
            </div>

            <div className="student-field full">
              <label>Assign class</label>
              <select
                className="student-select"
                value={form.class_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    class_id: e.target.value,
                  })
                }
              >
                <option value="">Not assigned</option>

                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.class_name}
                    {c.class_level
                      ? ` — ${c.class_level}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="student-field full">
              <label>
                Passport photograph (JPG, PNG or WebP; max 2MB)
              </label>

              <input
                id="student-photo"
                className="student-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  setPhoto(e.target.files?.[0] || null)
                }
              />
            </div>
          </div>

          <div className="student-actions">
            <button
              className="student-btn student-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Register student"}
            </button>

            {editingId && (
              <button
                type="button"
                className="student-btn student-secondary"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="student-panel">
        <h2>Registered students</h2>

        <p className="muted">
          Search records and filter students by class.
        </p>

        <div className="student-toolbar">
          <input
            className="student-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or admission number..."
          />

          <select
            className="student-select"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ maxWidth: 190 }}
          >
            <option value="all">All classes</option>

                        {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name}
              </option>
            ))}
          </select>
            <select
  className="student-select"
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  style={{ maxWidth: 190 }}
>
  <option value="active">Active students</option>
  <option value="all">All students</option>
  <option value="graduated">Graduated</option>
  <option value="withdrawn">Withdrawn</option>
  <option value="transferred">Transferred</option>
  <option value="suspended">Suspended</option>
</select>
        </div>

        <p className="student-count">
          Showing {visibleStudents.length} of {students.length} students
        </p>

        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Student</th>
<th>Admission no.</th>
<th>Class</th>
<th>Status</th>
<th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleStudents.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  onEdit={() => startEdit(s)}
                  onDelete={() => deleteStudent(s)}
                />
              ))}
            </tbody>
          </table>

          {visibleStudents.length === 0 && (
            <div className="student-empty">
              No student records found.
            </div>
          )}
        </div>
      </section>
    </div>

    <footer className="student-footer">
      Created by Ayanfe Innovation Labs Limited.
    </footer>
  </div>
</main>

);
}

function StudentRow({
student,
onEdit,
onDelete,
}: {
student: Student;
onEdit: () => void;
onDelete: () => void;
}) {
const [imageUrl, setImageUrl] = useState("");

useEffect(() => {
let active = true;

async function loadPhoto() {
  if (!student.photo_url) return;

  const { data } = await createClient()
    .storage.from("student-photos")
    .createSignedUrl(student.photo_url, 3600);

  if (active) {
    setImageUrl(data?.signedUrl || "");
  }
}

loadPhoto();

return () => {
  active = false;
};

}, [student.photo_url]);

return (
<tr>
<td>
<div
style={{
display: "flex",
alignItems: "center",
gap: 10,
}}
>
{imageUrl ? (
<img
           className="student-photo"
           src={imageUrl}
           alt=""
         />
) : (
<div
className="student-photo"
style={{
display: "grid",
placeItems: "center",
fontWeight: 800,
color: "#1769e0",
}}
>
{student.first_name.charAt(0)}
</div>
)}

      <div>
        <div className="student-name">
          {student.first_name}{" "}
          {student.middle_name
            ? student.middle_name + " "
            : ""}
          {student.last_name}
        </div>

        <div className="student-sub">
          {student.gender || "Gender not set"}
        </div>
      </div>
    </div>
  </td>

  <td>{student.admission_number}</td>

  <td>{student.class_name || "Not assigned"}</td>
<td>
  <span className={`student-status status-${student.status}`}>
    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
  </span>
</td>
  <td>
    <div style={{ display: "flex", gap: 6 }}>
      <button
  type="button"
  className="student-btn student-secondary"
  onClick={onEdit}
  title="Edit student"
>
  <span aria-hidden="true">✎</span>
  Edit
</button>

      <button
  type="button"
  className="student-btn student-danger"
  onClick={onDelete}
  title="Delete student"
>
  <span aria-hidden="true">⌫</span>
  Delete
</button>
    </div>
  </td>
</tr>

);
}
