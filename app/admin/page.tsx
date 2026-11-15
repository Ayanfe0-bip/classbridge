import React from "react";

const navigation = [
{ icon: "▦", label: "Dashboard", active: true },
{ icon: "♙", label: "Students" },
{ icon: "♧", label: "Teachers" },
{ icon: "▣", label: "Classes & Subjects" },
{ icon: "◷", label: "Attendance" },
{ icon: "✎", label: "Examinations" },
{ icon: "▤", label: "Results & Reports" },
];

const management = [
{ icon: "₦", label: "School Fees" },
{ icon: "▥", label: "Timetable" },
{ icon: "✉", label: "Announcements" },
{ icon: "⚙", label: "Settings" },
];

const stats = [
{
label: "Total Students",
value: "1,284",
note: "Across all classes",
icon: "♙",
background: "#eaf2ff",
color: "#1769e0",
},
{
label: "Total Teachers",
value: "64",
note: "Teaching staff",
icon: "♧",
background: "#e8f8f1",
color: "#159b69",
},
{
label: "Attendance Rate",
value: "94.6%",
note: "Illustrative demo figure",
icon: "◷",
background: "#fff4e4",
color: "#e69a28",
},
{
label: "Outstanding Fees",
value: "₦2.4m",
note: "Illustrative demo figure",
icon: "₦",
background: "#ffeded",
color: "#e45c62",
},
];

const activities = [
{
color: "#1769e0",
title: "New student registration",
detail: "A student record was added.",
time: "Today · 9:30 AM",
},
{
color: "#159b69",
title: "Attendance updated",
detail: "Class attendance was recorded.",
time: "Today · 9:10 AM",
},
{
color: "#e69a28",
title: "Examination preparation",
detail: "A new examination schedule was prepared.",
time: "Yesterday · 2:15 PM",
},
{
color: "#8c65d8",
title: "School announcement",
detail: "A notice was shared with staff.",
time: "Yesterday · 11:45 AM",
},
];

const chartData = [
{ day: "Mon", height: 55 },
{ day: "Tue", height: 76 },
{ day: "Wed", height: 65 },
{ day: "Thu", height: 88 },
{ day: "Fri", height: 72 },
{ day: "Sat", height: 42 },
{ day: "Sun", height: 30 },
];

const quickActions = [
{ icon: "＋", label: "Add Student" },
{ icon: "♙", label: "Add Teacher" },
{ icon: "◷", label: "Take Attendance" },
{ icon: "✎", label: "Create Examination" },
];

export default function Home() {
return (
<main className="dashboard-shell">
<aside className="sidebar">
<div className="brand">
<div className="brand-icon">C</div>
<div className="brand-name">
CLASS<span>BRIDGE</span>
</div>
</div>

    <div className="nav-label">MAIN MENU</div>

    <nav className="nav-list">
      {navigation.map((item) => (
        <a
          href="#"
          key={item.label}
          className={`nav-item ${item.active ? "active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </a>
      ))}
    </nav>

    <div className="nav-label">SCHOOL MANAGEMENT</div>

    <nav className="nav-list">
      {management.map((item) => (
        <a href="#" key={item.label} className="nav-item">
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </a>
      ))}
    </nav>

    <div className="sidebar-bottom">
      <div className="sidebar-profile">
        <div className="avatar">SA</div>
        <div>
          <div className="profile-name">School Administrator</div>
          <div className="profile-role">Administrator account</div>
        </div>
      </div>
    </div>
  </aside>

  <section className="main-area">
    <header className="topbar">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome back! Here's what's happening in your school.
        </p>
      </div>

      <div className="topbar-actions">
        <button
          className="icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          ♧
        </button>
        <div className="school-selector">Greenfield Academy ▾</div>
      </div>
    </header>

    <section className="welcome-banner">
      <div>
        <h2>Good day, Administrator 👋</h2>
        <p>
          Manage your school, support your teachers and help every
          student reach their full potential.
          <br />
          Your school management starts here.
        </p>
      </div>

      <button className="banner-button">Explore Dashboard →</button>
    </section>

    <section className="stats-grid">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <div className="stat-top">
            <span className="stat-label">{stat.label}</span>
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

          <div className="stat-value">{stat.value}</div>
          <div className="stat-note">{stat.note}</div>
        </article>
      ))}
    </section>

    <section className="content-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">School Attendance Overview</h3>
            <p className="panel-caption">
              Illustrative weekly attendance activity
            </p>
          </div>
          <span className="panel-link">This Week ▾</span>
        </div>

        <div className="chart-placeholder">
          {chartData.map((item) => (
            <div className="chart-column" key={item.day}>
              <div
                className={`chart-bar ${
                  item.day === "Thu" ? "highlight" : ""
                }`}
                style={{ height: `${item.height}%` }}
              />
            </div>
          ))}
        </div>

        <div className="chart-labels">
          {chartData.map((item) => (
            <span key={item.day}>{item.day}</span>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Recent Activities</h3>
            <p className="panel-caption">Latest school updates</p>
          </div>
          <span className="panel-link">View all</span>
        </div>

        <div className="activity-list">
          {activities.map((activity) => (
            <div className="activity-item" key={activity.title}>
              <span
                className="activity-dot"
                style={{ background: activity.color }}
              />
              <div>
                <div className="activity-text">{activity.title}</div>
                <div className="activity-time">{activity.detail}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>

    <section className="ai-card">
      <span className="ai-badge">✦ CLASSBRIDGE AI</span>
      <h3>Your intelligent teaching and learning assistant.</h3>
      <p>
        Prepare lesson notes, generate examination questions, explain
        difficult topics and support better learning experiences.
        Powered by the ZENTRIX AI engine, developed by Ayanfe Innovation
        Labs Limited.
      </p>
      <button className="ai-button">Explore CLASSBRIDGE AI →</button>
    </section>

    <section className="panel">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Quick Actions</h3>
          <p className="panel-caption">
            Common school management activities
          </p>
        </div>
      </div>

      <div className="quick-actions">
        {quickActions.map((action) => (
          <button className="quick-action" key={action.label}>
            <div className="quick-action-icon">{action.icon}</div>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
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
