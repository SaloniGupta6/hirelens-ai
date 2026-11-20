import { useState } from "react";
import { Sparkles, Send, Bot, User, RotateCcw } from "lucide-react";

const KEY = "hirelens_screening_history";

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function generateAnswer(question, sessions) {
  const candidates = sessions.flatMap((s) => s.candidates || []);
  const scored = candidates.filter((c) => Number.isFinite(Number(c.overall_score)));
  const q = question.toLowerCase();

  if (!sessions.length) {
    return "You haven't completed a screening yet. Head to Candidates, upload resumes, enter a job description, and run AI Screening. Once you have results, I can help you identify top matches, missing skills, compare candidates, and summarize your hiring insights.";
  }

  const sorted = [...scored].sort(
    (a, b) => Number(b.overall_score) - Number(a.overall_score)
  );
  const best = sorted[0];

  if (/best|top|strongest|highest|recommend|recommendation|shortlist/.test(q)) {
    if (!best) return "I don't have scored candidates available in your screening history yet.";
    const skills = (best.matched_skills || []).slice(0, 8);
    return `Your highest-scoring candidate is ${best.candidate_name || "Unknown Candidate"} with a match score of ${Number(best.overall_score).toFixed(1)}%. Their rank was #${best.rank || 1}.\n\nMatched skills: ${skills.length ? skills.join(", ") : "No matched skills listed"}.\n\nThis score reflects the job description comparison. Review their experience and missing skills before making a final hiring decision.`;
  }

  if (/missing skill|skill gap|gap|lack|unmatched/.test(q)) {
    const counts = {};
    candidates.forEach((c) =>
      (c.missing_skills || []).forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      })
    );
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return top.length
      ? `Most frequently missing skills across your screened candidates:\n\n${top.map(([skill, count], i) => `${i + 1}. ${skill} — missing in ${count} candidate(s)`).join("\n")}\n\nConsider whether these skills are essential requirements or trainable skills for the role.`
      : "No missing skill data was found in your screening history.";
  }

  if (/summar|overview|screening|result|performance|how many|total/.test(q)) {
    const average = scored.length
      ? scored.reduce((sum, c) => sum + Number(c.overall_score), 0) / scored.length
      : 0;
    const strong = scored.filter((c) => Number(c.overall_score) >= 80).length;
    const good = scored.filter((c) => Number(c.overall_score) >= 60 && Number(c.overall_score) < 80).length;
    const low = scored.filter((c) => Number(c.overall_score) < 60).length;
    return `Here's your screening overview:\n\n• Screening sessions: ${sessions.length}\n• Candidates evaluated: ${candidates.length}\n• Candidates with scores: ${scored.length}\n• Average match score: ${average.toFixed(1)}%\n• Strong matches (80%+): ${strong}\n• Good matches (60–79%): ${good}\n• Lower matches (below 60%): ${low}\n\n${best ? `Top candidate: ${best.candidate_name || "Unknown"} (${Number(best.overall_score).toFixed(1)}%).` : ""}`;
  }

  if (/compare|difference|versus|vs\.?|between/.test(q)) {
    if (sorted.length < 2) return "You need at least two scored candidates in your screening history to compare them.";
    const first = sorted[0];
    const second = sorted[1];
    const shared = (first.matched_skills || []).filter((s) =>
      (second.matched_skills || []).some((other) => other.toLowerCase() === s.toLowerCase())
    );
    return `Top two candidates:\n\n1. ${first.candidate_name || "Candidate 1"} — ${Number(first.overall_score).toFixed(1)}%\n2. ${second.candidate_name || "Candidate 2"} — ${Number(second.overall_score).toFixed(1)}%\n\nScore difference: ${(Number(first.overall_score) - Number(second.overall_score)).toFixed(1)} points.\n\nShared matched skills: ${shared.length ? shared.join(", ") : "No common matched skills identified"}.\n\nCompare their individual experience and education analysis as well before deciding.`;
  }

  if (/experience|education|qualification/.test(q)) {
    const details = sorted.slice(0, 5).map((c) =>
      `${c.candidate_name || "Unknown"} (${Number(c.overall_score).toFixed(1)}%): Experience ${c.experience_analysis?.score ?? "N/A"}%, Education ${c.education_analysis?.score ?? "N/A"}%`
    );
    return details.length
      ? `Candidate experience and education breakdown:\n\n${details.join("\n")}\n\nUse these scores as supporting indicators alongside the overall match and resume details.`
      : "Experience and education analysis isn't available in your saved results yet.";
  }

  return `I can help analyze your saved screening results. Try asking:\n\n• Who is my best candidate?\n• Summarize my screening results.\n• What skills are most commonly missing?\n• Compare my top candidates.\n• Show experience and education analysis.\n\nI currently use your saved screening data to generate recruitment insights.`;
}

function Copilot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your HireLens recruitment assistant. ✨ I can help you understand candidate rankings, find skill gaps, compare applicants, and summarize your screening results. What would you like to know?",
    },
  ]);
  const [question, setQuestion] = useState("");

  const ask = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const history = getHistory();
    const answer = generateAnswer(trimmed, history);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }, { role: "assistant", text: answer }]);
    setQuestion("");
  };

  const prompts = [
    "Who is my best candidate?",
    "Summarize my screening results",
    "What skills are most commonly missing?",
    "Compare my top candidates",
  ];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ padding: 22, borderRadius: 16, border: "1px solid var(--border, #e8e8e4)", background: "var(--panel, #fff)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#e9efe9", color: "#54745a", padding: 12, borderRadius: 12 }}>
            <Sparkles size={23} />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>HireLens AI Copilot</h2>
            <p style={{ margin: "5px 0 0", opacity: 0.7 }}>Your recruitment insights assistant</p>
          </div>
        </div>
      </section>

      <section style={{ border: "1px solid var(--border, #e8e8e4)", background: "var(--panel, #fff)", borderRadius: 16, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <strong>Conversation</strong>
          <button onClick={() => setMessages([{ role: "assistant", text: "Conversation cleared. What recruitment insights can I help you with?" }])} style={{ background: "none", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, opacity: 0.65 }}>
            <RotateCcw size={14} /> Clear
          </button>
        </div>

        <div style={{ display: "grid", gap: 14, maxHeight: 430, overflowY: "auto", padding: "4px 0" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 9, alignItems: "flex-start" }}>
              {msg.role === "assistant" && <span style={{ background: "#e9efe9", color: "#54745a", padding: 8, borderRadius: 10, flexShrink: 0 }}><Bot size={17} /></span>}
              <div style={{ maxWidth: "85%", padding: 13, borderRadius: 13, background: msg.role === "user" ? "#718b79" : "#f4f4f1", color: msg.role === "user" ? "#fff" : "inherit", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 14 }}>
                {msg.text}
              </div>
              {msg.role === "user" && <span style={{ background: "#f0e8e3", padding: 8, borderRadius: 10, flexShrink: 0 }}><User size={17} /></span>}
            </div>
          ))}
        </div>

        {messages.length === 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
            {prompts.map((prompt) => (
              <button key={prompt} onClick={() => ask(prompt)} style={{ border: "1px solid var(--border, #e5e5e0)", background: "transparent", borderRadius: 20, padding: "9px 12px", cursor: "pointer", fontSize: 13 }}>
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); ask(question); }} style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about your candidates or screening data..." style={{ flex: 1, minWidth: 0, padding: 12, border: "1px solid var(--border, #deded8)", borderRadius: 12, background: "transparent", color: "inherit" }} />
          <button type="submit" disabled={!question.trim()} style={{ background: "#718b79", color: "white", border: 0, borderRadius: 12, padding: "0 16px", cursor: "pointer", opacity: question.trim() ? 1 : 0.5 }} aria-label="Send message"><Send size={17} /></button>
        </form>
      </section>
    </div>
  );
}

export default Copilot;
