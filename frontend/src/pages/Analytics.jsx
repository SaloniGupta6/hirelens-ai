import { useMemo, useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Target,
  Trophy,
  TrendingUp,
  Activity,
} from "lucide-react";

const STORAGE_KEY = "hirelens_screening_history";

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

const cardStyle = {
  background: "var(--panel, #fff)",
  border: "1px solid var(--border, #e8e8e4)",
  borderRadius: 16,
  padding: 20,
};

function Analytics() {
  const [sessions, setSessions] = useState(readHistory);

  useEffect(() => {
    const refresh = () => setSessions(readHistory());
    window.addEventListener("storage", refresh);
    window.addEventListener("hirelens-screening-saved", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("hirelens-screening-saved", refresh);
    };
  }, []);

  const data = useMemo(() => {
    const candidates = sessions.flatMap((session) =>
      (session.candidates || []).map((candidate) => ({
        ...candidate,
        sessionDate: session.createdAt,
        jobDescription: session.jobDescription || "",
      }))
    );

    const scored = candidates.filter((candidate) =>
      Number.isFinite(Number(candidate.overall_score))
    );

    const average = scored.length
      ? scored.reduce((sum, candidate) => sum + Number(candidate.overall_score), 0) /
        scored.length
      : 0;

    const strong = scored.filter((candidate) => Number(candidate.overall_score) >= 80);
    const buckets = [
      { label: "0–39%", min: 0, max: 40 },
      { label: "40–59%", min: 40, max: 60 },
      { label: "60–79%", min: 60, max: 80 },
      { label: "80–100%", min: 80, max: 101 },
    ].map((bucket) => ({
      ...bucket,
      count: scored.filter(
        (candidate) =>
          Number(candidate.overall_score) >= bucket.min &&
          Number(candidate.overall_score) < bucket.max
      ).length,
    }));

    const skillCounts = {};
    candidates.forEach((candidate) => {
      (candidate.matched_skills || []).forEach((skill) => {
        const key = String(skill).trim();
        if (key) skillCounts[key] = (skillCounts[key] || 0) + 1;
      });
    });

    const skills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return { candidates, scored, average, strong, buckets, skills };
  }, [sessions]);

  const maxBucket = Math.max(1, ...data.buckets.map((bucket) => bucket.count));
  const maxSkill = Math.max(1, ...data.skills.map((skill) => skill[1]));

  if (!sessions.length) {
    return (
      <div style={{ display: "grid", gap: 20 }}>
        <section style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BarChart3 size={22} />
            <div>
              <h2 style={{ margin: 0 }}>Recruitment Analytics</h2>
              <p style={{ margin: "6px 0 0", opacity: 0.7 }}>
                Insights based on your actual resume screenings.
              </p>
            </div>
          </div>
        </section>
        <section style={{ ...cardStyle, textAlign: "center", padding: "48px 20px" }}>
          <Activity size={36} style={{ opacity: 0.5, marginBottom: 12 }} />
          <h3>No screening data yet</h3>
          <p style={{ opacity: 0.7 }}>
            Complete a candidate screening to see match scores, skill trends,
            candidate distributions, and screening history here.
          </p>
        </section>
      </div>
    );
  }

  const metricCards = [
    { label: "Screening Sessions", value: sessions.length, icon: Activity },
    { label: "Candidates Screened", value: data.candidates.length, icon: Users },
    { label: "Average Match Score", value: `${data.average.toFixed(1)}%`, icon: Target },
    { label: "Strong Matches (80%+)", value: data.strong.length, icon: Trophy },
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BarChart3 size={22} />
          <div>
            <h2 style={{ margin: 0 }}>Recruitment Analytics</h2>
            <p style={{ margin: "6px 0 0", opacity: 0.7 }}>
              Insights calculated from your completed screenings.
            </p>
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {metricCards.map(({ label, value, icon: Icon }) => (
          <article key={label} style={cardStyle}>
            <Icon size={20} style={{ opacity: 0.7 }} />
            <p style={{ margin: "12px 0 6px", opacity: 0.7 }}>{label}</p>
            <strong style={{ fontSize: 28 }}>{value}</strong>
          </article>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Candidate Match Distribution</h3>
          {data.buckets.map((bucket) => (
            <div key={bucket.label} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>{bucket.label}</span>
                <strong>{bucket.count}</strong>
              </div>
              <div style={{ height: 9, borderRadius: 99, background: "#ecece8", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(bucket.count / maxBucket) * 100}%`, background: "#718b79", borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </section>

        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Most Matched Skills</h3>
          {data.skills.length ? data.skills.map(([skill, count]) => (
            <div key={skill} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span>{skill}</span>
                <strong>{count}</strong>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "#ecece8", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / maxSkill) * 100}%`, background: "#c58c70", borderRadius: 99 }} />
              </div>
            </div>
          )) : (
            <p style={{ opacity: 0.7 }}>Matched skills will appear after screenings.</p>
          )}
        </section>
      </div>

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>
          <TrendingUp size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
          Top Candidate Matches
        </h3>
        {data.scored.length ? Object.values(
          data.scored.reduce((unique, candidate) => {
            const key = String(
              candidate.candidate_name || candidate.original_filename || candidate.filename || "unknown"
            ).trim().toLowerCase();

            if (!unique[key] || Number(candidate.overall_score) > Number(unique[key].overall_score)) {
              unique[key] = candidate;
            }

            return unique;
          }, {})
        )
          .sort((a, b) => Number(b.overall_score) - Number(a.overall_score))
          .slice(0, 5)
          .map((candidate, index) => (
            <div key={`${candidate.filename || candidate.candidate_name}-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #eeeeeb" }}>
              <div>
                <strong>{index + 1}. {candidate.candidate_name || "Unknown Candidate"}</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.65 }}>{candidate.original_filename || candidate.filename || "Resume"}</p>
              </div>
              <strong>{Number(candidate.overall_score).toFixed(1)}%</strong>
            </div>
          )) : <p>No scored candidates available.</p>}
      </section>

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Recent Screening History</h3>
        {[...sessions].reverse().slice(0, 10).map((session) => (
          <div key={session.id} style={{ padding: "12px 0", borderBottom: "1px solid #eeeeeb" }}>
            <strong>{session.candidates?.length || 0} candidate(s)</strong>
            <p style={{ margin: "5px 0", fontSize: 13, opacity: 0.7 }}>
              {session.createdAt ? new Date(session.createdAt).toLocaleString() : "Date unavailable"}
            </p>
            <p style={{ margin: 0, fontSize: 13 }}>
              {(session.jobDescription || "Job description not saved").slice(0, 140)}
              {(session.jobDescription || "").length > 140 ? "…" : ""}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Analytics;
