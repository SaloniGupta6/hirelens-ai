
import { useState, lazy, Suspense } from "react";




import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  ChartNoAxesCombined,
  Sparkles,
  Settings,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  UserCheck,
  Target,
  Clock3,
  MoreHorizontal,
  ChevronRight,
  SlidersHorizontal,
  BrainCircuit,
  Menu,
  X,
  UploadCloud,
  MessageCircle,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const JobOpenings = lazy(() => import("./pages/JobOpenings"));
const Candidates = lazy(() => import("./pages/Candidates"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Copilot = lazy(() => import("./pages/Copilot"));
const SettingsPage = lazy(() => import("./pages/Settings"));

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Job Openings", icon: BriefcaseBusiness },
  { name: "Candidates", icon: Users },
  { name: "Analytics", icon: ChartNoAxesCombined },
  { name: "AI Copilot", icon: Sparkles },
];

const getScreeningHistory = () => {
  try {
    return JSON.parse(localStorage.getItem("hirelens_screening_history") || "[]");
  } catch {
    return [];
  }
};

const getSavedJobs = () => {
  try {
    return JSON.parse(localStorage.getItem("hirelens_job_openings") || "[]");
  } catch {
    return [];
  }
};

const getDashboardData = () => {
  const history = getScreeningHistory();
  const jobs = getSavedJobs();
  const candidates = history.flatMap((session) => session.candidates || []);
  const totalApplicants = candidates.length;
  const shortlisted = candidates.filter((c) => Number(c.overall_score) >= 80).length;
  const avgMatch = totalApplicants
    ? candidates.reduce((sum, c) => sum + (Number(c.overall_score) || 0), 0) / totalApplicants
    : 0;

  const recentSessions = [...history].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const monthlyData = {};
  history.forEach((session) => {
    const date = new Date(session.createdAt);
    const month = date.toLocaleString("en", { month: "short" });
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!monthlyData[key]) monthlyData[key] = { month, applicants: 0, shortlisted: 0, sort: date.getTime() };
    const sessionCandidates = session.candidates || [];
    monthlyData[key].applicants += sessionCandidates.length;
    monthlyData[key].shortlisted += sessionCandidates.filter(
      (c) => Number(c.overall_score) >= 80
    ).length;
  });

  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.sort - b.sort)
    .slice(-6);

  const topSkills = {};
  candidates.forEach((candidate) => {
    (candidate.matched_skills || []).forEach((skill) => {
      topSkills[skill] = (topSkills[skill] || 0) + 1;
    });
  });

  const topSkill = Object.entries(topSkills).sort((a, b) => b[1] - a[1])[0];

  const recentActivities = recentSessions.slice(0, 4).map((session) => ({
    icon: FileText,
    color: "peach",
    title: "Screening completed",
    detail: `${(session.candidates || []).length} candidates analyzed`,
    time: new Date(session.createdAt).toLocaleString(),
  }));

  return {
    history,
    jobs,
    candidates,
    totalApplicants,
    shortlisted,
    avgMatch,
    activeJobs: jobs.filter((job) => job.status === "Active").length,
    chartData,
    topSkill,
    recentActivities,
  };
};

const getInitials = (name = "Candidate") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function App() {
  const dashboardData = getDashboardData();

  const candidates = dashboardData.candidates.map((candidate, index) => {
    const score = Number(candidate.overall_score) || 0;
    const name = candidate.candidate_name || candidate.name || "Unknown candidate";
    return {
      ...candidate,
      name,
      initials: getInitials(name),
      role: candidate.job_title || candidate.role || "Candidate",
      skills: candidate.matched_skills || [],
      experience: candidate.experience_summary || candidate.experience || "Not specified",
      score,
      status: score >= 80 ? "Strong Match" : score >= 60 ? "Good Match" : "Needs Review",
      color: ["sage", "blush", "peach", "rose"][index % 4],
    };
  });

  const stats = [
    {
      title: "Total Applicants",
      value: dashboardData.totalApplicants.toLocaleString(),
      change: `${dashboardData.history.length} screenings`,
      trend: "up",
      description: "Candidates analyzed",
      icon: Users,
      color: "sage",
    },
    {
      title: "Shortlisted",
      value: dashboardData.shortlisted.toLocaleString(),
      change: "80%+ match",
      trend: "up",
      description: "Strong matches",
      icon: UserCheck,
      color: "peach",
    },
    {
      title: "Average Match",
      value: `${dashboardData.avgMatch.toFixed(1)}%`,
      change: "All screenings",
      trend: "up",
      description: "Average compatibility",
      icon: Target,
      color: "blush",
    },
    {
      title: "Active Positions",
      value: dashboardData.activeJobs.toLocaleString(),
      change: `${dashboardData.jobs.length} total`,
      trend: "up",
      description: "Saved job openings",
      icon: BriefcaseBusiness,
      color: "rose",
    },
  ];

  const chartData = dashboardData.chartData;
  const activities = dashboardData.recentActivities;
  const [activePage, setActivePage] = useState("Overview");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const uniqueCandidates = Object.values(
    candidates.reduce((acc, candidate) => {
      const key = candidate.name.trim().toLowerCase();
      if (!acc[key] || candidate.score > acc[key].score) {
        acc[key] = candidate;
      }
      return acc;
    }, {})
  ).sort((a, b) => b.score - a.score);

  const filteredCandidates = uniqueCandidates
    .filter((candidate) =>
      `${candidate.name} ${candidate.role} ${candidate.skills.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .slice(0, 4);

  const pageDescriptions = {
    Overview: "Here's what's happening with your recruitment today.",
    "Job Openings": "Manage your open positions and hiring requirements.",
    Candidates: "Explore and compare your candidate profiles.",
    Analytics: "Understand your recruitment performance.",
    "AI Copilot": "Your intelligent assistant for recruitment insights.",
    Settings: "Manage your recruiter profile and workspace preferences.",
  };

  const SidebarContent = () => (
    <>
      <div className="brand">
        <div className="brand-icon">
          <BrainCircuit size={23} />
        </div>
        <div>
          <h2>HireLens<span> AI</span></h2>
          <p>RECRUITMENT INTELLIGENCE</p>
        </div>
      </div>

      <div className="workspace">
        <div className="workspace-avatar">H</div>
        <div className="workspace-info">
          <strong>Hiring Workspace</strong>
          <span>Recruiter account</span>
        </div>
        <MoreHorizontal size={19} />
      </div>

      <p className="nav-label">WORKSPACE</p>

      <nav className="navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => {
                setActivePage(item.name);
                setMobileOpen(false);
              }}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{item.name}</span>
              {item.name === "AI Copilot" && (
                <span className="new-label">AI</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <Sparkles size={19} />
          <strong>AI-powered hiring</strong>
          <p>Make smarter recruitment decisions with intelligent insights.</p>
        </div>

        <button
          className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
          onClick={() => {
            setActivePage("Settings");
            setMobileOpen(false);
          }}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <div className="profile">
          <div className="profile-avatar">R</div>
          <div>
            <strong>Recruiter</strong>
            <span>Administrator</span>
          </div>
          <MoreHorizontal size={19} />
        </div>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "mobile-visible" : ""}`}>
        <button
          className="mobile-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={21} />
        </button>
        <SidebarContent />
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            Workspace <ChevronRight size={15} />{" "}
            <span>{activePage}</span>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </div>

            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span />
              </button>

              {showNotifications && (
                <div className="notification-popover">
                  <strong>Notifications</strong>
                  <p>You have 24 new resumes waiting for review.</p>
                  <p>AI analysis completed for Data Scientist.</p>
                </div>
              )}
            </div>

            <div className="top-avatar">R</div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <div className="eyebrow">
                <span className="live-dot" />
                RECRUITMENT OVERVIEW
              </div>
              <h1>
                Good morning, Recruiter <span>✦</span>
              </h1>
              <p>{pageDescriptions[activePage]}</p>
            </div>

            <button
              className="primary-button"
              onClick={() => setActivePage("Job Openings")}
            >
              <Plus size={18} />
              Create new job
            </button>
          </section>

          <Suspense fallback={<div className="page-loading">Loading page...</div>}>
          {activePage === "Overview" ? (
            <>
              <section className="stats-grid">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  const TrendIcon =
                    stat.trend === "up" ? ArrowUpRight : ArrowDownRight;

                  return (
                    <article className="stat-card" key={stat.title}>
                      <div className="stat-top">
                        <div className={`stat-icon ${stat.color}`}>
                          <Icon size={21} strokeWidth={1.8} />
                        </div>
                        <button
                          className="more-button"
                          aria-label={`More about ${stat.title}`}
                        >
                          <MoreHorizontal size={20} />
                        </button>
                      </div>

                      <p className="stat-title">{stat.title}</p>
                      <div className="stat-bottom">
                        <h2>{stat.value}</h2>
                        <div className="stat-change">
                          <TrendIcon size={14} />
                          {stat.change}
                        </div>
                      </div>
                      <span className="stat-description">
                        {stat.description}
                      </span>
                    </article>
                  );
                })}
              </section>

              <section className="middle-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recruitment activity</h3>
                      <p>Applicant and shortlist trends over time</p>
                    </div>
                    <select className="period-select" defaultValue="6">
                      <option value="6">Last 6 months</option>
                      <option value="3">Last 3 months</option>
                    </select>
                  </div>

                  <div className="chart-legend">
                    <span><i className="legend-applicants" /> Applicants</span>
                    <span><i className="legend-shortlisted" /> Shortlisted</span>
                  </div>

                  <div className="chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="applicantGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#C6D5CC" stopOpacity={0.65} />
                            <stop offset="100%" stopColor="#C6D5CC" stopOpacity={0.04} />
                          </linearGradient>
                          <linearGradient
                            id="shortlistGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#E7AEB8" stopOpacity={0.55} />
                            <stop offset="100%" stopColor="#E7AEB8" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 5"
                          vertical={false}
                          stroke="#ECEAE7"
                        />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#92928E", fontSize: 12 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#92928E", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #EEE8E5",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="applicants"
                          stroke="#91AA9B"
                          strokeWidth={2.5}
                          fill="url(#applicantGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="shortlisted"
                          stroke="#D795A2"
                          strokeWidth={2.5}
                          fill="url(#shortlistGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="panel insights-panel">
                  <div className="insight-heading">
                    <div className="insight-icon">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3>AI Insights</h3>
                      <p>Intelligence at a glance</p>
                    </div>
                    <span className="ai-badge">LIVE</span>
                  </div>

                  <div className="insight-feature">
                    <span className="insight-kicker">TOP MATCHING SKILL</span>
                    <h2>{dashboardData.topSkill?.[0] || "No data yet"}</h2>
                    <p>{dashboardData.topSkill ? `Matched in ${dashboardData.topSkill[1]} candidate profile(s).` : "Upload resumes and run a screening to generate skill insights."}</p>
                    <div className="insight-progress">
                      <div style={{ width: dashboardData.totalApplicants ? `${Math.min(100, dashboardData.topSkill?.[1] / dashboardData.totalApplicants * 100)}%` : "0%" }} />
                    </div>
                    <span className="progress-caption">{dashboardData.totalApplicants ? "Based on screened candidates" : "Waiting for screening data"}</span>
                  </div>

                  <div className="insight-divider" />

                  <div className="insight-footer">
                    <div className="insight-mini-icon">
                      <BrainCircuit size={19} />
                    </div>
                    <p>
                      <strong>Smart recommendation</strong>
                      <span>{dashboardData.shortlisted ? `You have ${dashboardData.shortlisted} strong-match candidate(s) to review.` : "Screen resumes to discover your strongest candidates."}</span>
                    </p>
                  </div>
                </article>
              </section>

              <section className="bottom-grid">
                <article className="panel candidates-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Top matching candidates</h3>
                      <p>Ranked by AI compatibility score</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setActivePage("Candidates")}
                    >
                      View all <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Experience</th>
                          <th>Skills</th>
                          <th>AI Match</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCandidates.map((candidate) => (
                          <tr key={candidate.name}>
                            <td>
                              <div className="candidate-name">
                                <div className={`candidate-avatar ${candidate.color}`}>
                                  {candidate.initials}
                                </div>
                                <div>
                                  <strong>{candidate.name}</strong>
                                  <span>{candidate.role}</span>
                                </div>
                              </div>
                            </td>
                            <td>{candidate.experience}</td>
                            <td>
                              <div className="skill-list">
                                {candidate.skills.slice(0, 2).map((skill) => (
                                  <span key={skill}>{skill}</span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className="match-score">
                                <strong>{candidate.score}%</strong>
                                <div>
                                  <span style={{ width: `${candidate.score}%` }} />
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`status-pill ${
                                candidate.score >= 90 ? "strong" : "good"
                              }`}>
                                {candidate.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {filteredCandidates.length === 0 && (
                          <tr>
                            <td colSpan="5" className="empty-state">
                              No candidates match your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent activity</h3>
                      <p>Latest recruitment updates</p>
                    </div>
                    <MoreHorizontal size={20} />
                  </div>

                  <div className="activity-list">
                    {activities.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div className="activity-item" key={index}>
                          <div className={`activity-icon ${activity.color}`}>
                            <Icon size={18} />
                          </div>
                          <div className="activity-content">
                            <strong>{activity.title}</strong>
                            <p>{activity.detail}</p>
                            <span><Clock3 size={12} /> {activity.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    className="activity-link"
                    onClick={() => setActivePage("Analytics")}
                  >
                    View recruitment insights <ChevronRight size={16} />
                  </button>
                </article>
              </section>

              <section className="quick-actions">
                <div>
                  <div className="quick-icon"><UploadCloud size={20} /></div>
                  <div>
                    <strong>Ready to screen new candidates?</strong>
                    <p>Upload resumes and let HireLens AI find your best matches.</p>
                  </div>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setActivePage("Candidates")}
                >
                  Start screening <ArrowUpRight size={17} />
                </button>
              </section>
            </>
                    ) : activePage === "Job Openings" ? (
                      <JobOpenings />
                    ) : activePage === "Candidates" ? (
                      <Candidates />
                    ) : activePage === "AI Copilot" ? (
                      <Copilot />
                    ) : activePage === "Analytics" ? (
                      <Analytics />
                    ) : activePage === "Settings" ? (
                      <SettingsPage />
                    ) : (
                      <section className="panel placeholder-page">
              <div className="placeholder-icon">
                {activePage === "AI Copilot" ? (
                  <MessageCircle size={30} />
                ) : activePage === "Candidates" ? (
                  <Users size={30} />
                ) : activePage === "Analytics" ? (
                  <ChartNoAxesCombined size={30} />
                ) : (
                  <BriefcaseBusiness size={30} />
                )}
              </div>
              <h2>{activePage}</h2>
              <p>
                This workspace is ready for development. We'll build this
                module in the upcoming development steps.
              </p>
              <button
                className="primary-button"
                onClick={() => setActivePage("Overview")}
              >
                Back to overview
              </button>
            </section>
          )}

          </Suspense>
          <footer className="footer">
            <span>© 2026 HireLens AI. Intelligent hiring, made thoughtful.</span>
            <span>Built for smarter recruitment ✦</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
