const features = [
  {
    icon: "🏫",
    title: "School Management",
    description:
      "Manage students, teachers, classes, academic records and everyday school operations from one platform.",
  },
  {
    icon: "👩‍🏫",
    title: "Teacher Workspace",
    description:
      "Give every teacher an independent account to manage assigned classes, attendance, assignments and results.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Parent Connection",
    description:
      "Keep parents informed about their children's attendance, academic progress, assignments and school activities.",
  },
  {
    icon: "💬",
    title: "Smart Communication",
    description:
      "Connect administrators, teachers and parents through a central school communication system.",
  },
  {
    icon: "📊",
    title: "Academic Insights",
    description:
      "Monitor student performance, examination results and attendance through organised reports.",
  },
  {
    icon: "✨",
    title: "CLASSBRIDGE AI",
    description:
      "Support lesson planning, question generation and learning with intelligent AI assistance.",
  },
];

const audiences = [
  {
    number: "01",
    title: "Administrators",
    description:
      "Take control of your school operations, oversee teachers, manage student records and communicate with your entire school community.",
  },
  {
    number: "02",
    title: "Teachers",
    description:
      "Enjoy your own professional workspace. Manage your assigned classes, record attendance, prepare lessons and communicate with parents.",
  },
  {
    number: "03",
    title: "Parents",
    description:
      "Stay connected to your children's education. Follow their progress, receive school announcements and communicate with teachers.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="landing-header">
        <a href="/" className="landing-brand">
          <span className="landing-logo">C</span>
          <span>
            CLASS<span className="brand-blue">BRIDGE</span>
          </span>
        </a>

        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#community">Our Community</a>
          <a href="#about">About</a>
        </nav>

        <div className="landing-actions">
          <a href="/login" className="login-link">
            Sign In
          </a>
          <a href="/signup" className="primary-button">
            Get Started →
          </a>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-label">
            ✦ A SMARTER WAY TO CONNECT EDUCATION
          </span>

          <h1>
            Building Better Schools.
            <br />
            <span>Connecting Brighter Futures.</span>
          </h1>

          <p>
            One connected platform for school administrators, teachers and
            parents. Manage school activities, support learning and keep
            everyone connected.
          </p>

          <div className="hero-buttons">
            <a href="/signup" className="primary-button hero-cta">
              Get Started Today →
            </a>

            <a href="#features" className="secondary-button">
              Explore Platform
            </a>
          </div>

          <div className="hero-trust">
            <span>✓ School management</span>
            <span>✓ Teacher collaboration</span>
            <span>✓ Parent connection</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-glow" />

          <div className="preview-window">
            <div className="preview-top">
              <div className="preview-dots">
                <i />
                <i />
                <i />
              </div>
              <span>CLASSBRIDGE Dashboard</span>
            </div>

            <div className="preview-body">
              <div className="preview-sidebar">
                <div className="preview-mark">C</div>
                <span className="preview-active">▦</span>
                <span>♙</span>
                <span>♧</span>
                <span>▤</span>
                <span>⚙</span>
              </div>

              <div className="preview-content">
                <h3>School Overview</h3>
                <p>Your school at a glance</p>

                <div className="preview-stats">
                  <div>
                    <small>Students</small>
                    <strong>1,284</strong>
                  </div>
                  <div>
                    <small>Teachers</small>
                    <strong>64</strong>
                  </div>
                </div>

                <div className="preview-chart">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="preview-message">
                  <span>✦</span>
                  <div>
                    <strong>CLASSBRIDGE AI</strong>
                    <small>Smarter teaching starts here.</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="floating-card floating-one">
            <span>✓</span>
            <div>
              <strong>Connected</strong>
              <small>School community</small>
            </div>
          </div>

          <div className="floating-card floating-two">
            <span>✦</span>
            <div>
              <strong>Powered by AI</strong>
              <small>Intelligent learning</small>
            </div>
          </div>
        </div>
      </section>

      <section className="community-strip">
        <p>ONE PLATFORM. THREE CONNECTED COMMUNITIES.</p>
        <div>
          <span>🏫 School Administrators</span>
          <span>👩‍🏫 Teachers</span>
          <span>👨‍👩‍👧 Parents</span>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="section-heading">
          <span className="section-label">WHAT WE OFFER</span>
          <h2>
            Everything your school needs,
            <br />
            <span>connected in one place.</span>
          </h2>
          <p>
            CLASSBRIDGE brings school operations, academic management and
            communication together in one organised digital environment.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-arrow">Explore →</span>
            </article>
          ))}
        </div>
      </section>

      <section className="audience-section" id="community">
        <div className="section-heading">
          <span className="section-label">BUILT FOR EVERYONE</span>
          <h2>
            Three communities.
            <br />
            <span>One connected school.</span>
          </h2>
          <p>
            Everyone gets an individual account and a dedicated workspace,
            while staying connected through their school.
          </p>
        </div>

        <div className="audience-grid">
          {audiences.map((person) => (
            <article className="audience-card" key={person.title}>
              <span className="audience-number">{person.number}</span>
              <h3>{person.title}</h3>
              <p>{person.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ai-section" id="about">
        <div className="ai-content">
          <span className="ai-label">✦ INTELLIGENCE MEETS EDUCATION</span>
          <h2>
            Meet your new
            <br />
            <span>teaching companion.</span>
          </h2>
          <p>
            CLASSBRIDGE AI helps teachers prepare lessons, generate
            examination questions and explain difficult topics. It also
            supports students with guided learning.
          </p>
          <div className="ai-powered">
            Powered by ZENTRIX AI technology
            <br />
            Developed by Ayanfe Innovation Labs Limited.
          </div>
        </div>

        <div className="ai-symbol">
          <div className="ai-orbit orbit-one" />
          <div className="ai-orbit orbit-two" />
          <div className="ai-center">✦</div>
          <span className="ai-node node-one">AI</span>
          <span className="ai-node node-two">✎</span>
          <span className="ai-node node-three">✓</span>
        </div>
      </section>

      <section className="closing-section">
        <span className="section-label">YOUR SCHOOL'S NEXT CHAPTER</span>
        <h2>
          Let's build a better
          <br />
          <span>learning experience together.</span>
        </h2>
        <p>
          Bring your administrators, teachers and parents closer with
          CLASSBRIDGE.
        </p>
        <a href="/signup" className="primary-button hero-cta">
          Join CLASSBRIDGE →
        </a>
      </section>

      <footer className="landing-footer">
        <a href="/" className="landing-brand">
          <span className="landing-logo">C</span>
          <span>
            CLASS<span className="brand-blue">BRIDGE</span>
          </span>
        </a>

        <p>
          Connecting schools, teachers and families.
        </p>

        <div>
          © 2026 CLASSBRIDGE.
          <br />
          Created by Ayanfe Innovation Labs Limited.
          <br />
          Powered by ZENTRIX AI technology.
        </div>
      </footer>
    </main>
  );
}
