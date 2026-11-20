
import { useState } from "react";
import axios from "axios";
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Trophy,
  Target,
  GraduationCap,
  BriefcaseBusiness,
  RefreshCw,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function Candidates() {
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState("");
  const [results, setResults] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    setFiles((previous) => [
      ...previous,
      ...selected.filter(
        (file) =>
          !previous.some(
            (existing) =>
              existing.name === file.name &&
              existing.size === file.size
          )
      ),
    ]);
    setError("");
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index)
    );
  };

  const handleScreening = async (event) => {
    event.preventDefault();
    setError("");
    setResults(null);
    setUploadSummary(null);

    if (files.length === 0) {
      setError("Please select at least one PDF or DOCX resume.");
      return;
    }

    if (jobDescription.trim().length < 20) {
      setError("Please enter a job description containing at least 20 characters.");
      return;
    }

    const invalidFile = files.find(
      (file) =>
        !["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
          file.type
        ) &&
        !/\.(pdf|docx)$/i.test(file.name)
    );

    if (invalidFile) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const uploadResponse = await axios.post(
        `${API_URL}/api/resumes/upload`,
        formData
      );

      const uploadData = uploadResponse.data;
      setUploadSummary(uploadData);

      const successfulFiles = (uploadData.results || [])
        .filter((item) => item.success && item.stored_filename)
        .map((item) => item.stored_filename);

      if (successfulFiles.length === 0) {
        throw new Error(
          "No resumes were successfully uploaded. Please check your files."
        );
      }

      const rankingResponse = await axios.post(
        `${API_URL}/api/ranking/rank-uploaded`,
        {
          job_description: jobDescription.trim(),
          filenames: successfulFiles,
        }
      );
      
      // Map stored (hashed) filenames to their original uploaded names
      const originalFilenameMap = Object.fromEntries(
        (uploadData.results || [])
          .filter((item) => item.stored_filename && item.filename)
          .map((item) => [item.stored_filename, item.filename])
      );
      
      const rankingData = rankingResponse.data;
      
      rankingData.ranked_candidates = rankingData.ranked_candidates.map(
        (candidate) => ({
          ...candidate,
          original_filename:
            originalFilenameMap[candidate.filename] ||
            candidate.original_filename ||
            candidate.filename,
        })
      );
      
      setResults(rankingData);

      // Persist real screening results for the Analytics page.
      try {
        const storageKey = "hirelens_screening_history";
        const history = JSON.parse(localStorage.getItem(storageKey) || "[]");
        history.push({
          id: `${Date.now()}`,
          createdAt: new Date().toISOString(),
          jobDescription: jobDescription.trim(),
          candidates: rankingData.ranked_candidates || [],
          failedFiles: rankingData.failed_files || [],
        });
        localStorage.setItem(storageKey, JSON.stringify(history.slice(-100)));
        window.dispatchEvent(new Event("hirelens-screening-saved"));
      } catch (storageError) {
        console.warn("Could not save screening history for Analytics:", storageError);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : detail?.message ||
            err.message ||
            "Something went wrong while screening resumes."
      );
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name || name === "Unknown Candidate") return "UC";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getScoreLabel = (score) => {
    if (score == null) return "Not Assessed";
    if (score >= 80) return "Strong Match";
    if (score >= 60) return "Good Match";
    return "Low Match";
  };

  return (
    <div className="candidates-page">
      <section className="screening-intro">
        <div>
          <div className="jobs-eyebrow">
            <Sparkles size={14} />
            INTELLIGENT CANDIDATE SCREENING
          </div>
          <h2>Find your next great hire.</h2>
          <p>
            Upload resumes, define the role, and let HireLens AI
            evaluate candidates against your hiring requirements.
          </p>
        </div>

        <div className="screening-intro-icon">
          <Users size={27} />
        </div>
      </section>

      <form className="screening-form" onSubmit={handleScreening}>
        <section className="screening-panel">
          <div className="screening-section-heading">
            <div className="screening-step">01</div>
            <div>
              <h3>Upload candidate resumes</h3>
              <p>Add multiple PDF or DOCX resumes for evaluation.</p>
            </div>
          </div>

          <label className="resume-dropzone">
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={handleFileChange}
              disabled={loading}
            />

            <div className="resume-upload-icon">
              <UploadCloud size={25} />
            </div>

            <strong>Click to browse resumes</strong>
            <span>PDF or DOCX · Multiple files supported</span>
          </label>

          {files.length > 0 && (
            <div className="selected-files">
              <div className="selected-files-heading">
                <strong>Selected resumes</strong>
                <span>{files.length} files</span>
              </div>

              {files.map((file, index) => (
                <div className="selected-file" key={`${file.name}-${index}`}>
                  <div className="selected-file-icon">
                    <FileText size={18} />
                  </div>

                  <div className="selected-file-info">
                    <strong>{file.name}</strong>
                    <span>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>

                  <button
                    type="button"
                    className="remove-file"
                    onClick={() => removeFile(index)}
                    disabled={loading}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="screening-panel">
          <div className="screening-section-heading">
            <div className="screening-step">02</div>
            <div>
              <h3>Define the job requirements</h3>
              <p>
                Provide the job description used to calculate candidate
                compatibility.
              </p>
            </div>
          </div>

          <label className="job-description-label" htmlFor="job-description">
            Job description
          </label>

          <textarea
            id="job-description"
            className="screening-textarea"
            placeholder="Example: We are looking for a Python Developer with experience in FastAPI, React, SQL, REST APIs, Docker, and software development..."
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            disabled={loading}
            rows={7}
          />

          <div className="description-footer">
            <span>Include required skills, experience, and education.</span>
            <span>{jobDescription.length} characters</span>
          </div>
        </section>

        {error && (
          <div className="screening-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="screening-submit-row">
          <div>
            <strong>Ready to evaluate candidates?</strong>
            <p>Resumes will be parsed and ranked against this job description.</p>
          </div>

          <button
            type="submit"
            className="primary-button screening-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={17} className="spin-icon" />
                Screening...
              </>
            ) : (
              <>
                <Sparkles size={17} />
                Start AI Screening
              </>
            )}
          </button>
        </div>
      </form>

      {uploadSummary && (
        <section className="screening-upload-summary">
          <div>
            <CheckCircle2 size={18} />
            <strong>Resume upload completed</strong>
          </div>
          <p>
            {uploadSummary.successful_uploads} of{" "}
            {uploadSummary.total_files} resumes uploaded successfully.
            {uploadSummary.failed_uploads > 0 &&
              ` ${uploadSummary.failed_uploads} upload(s) failed.`}
          </p>
        </section>
      )}

      {results && (
        <section className="screening-results">
          <div className="screening-results-heading">
            <div>
              <div className="jobs-eyebrow">
                <Sparkles size={14} />
                SCREENING RESULTS
              </div>
              <h2>Candidate rankings</h2>
              <p>
                Candidates ranked according to the job requirements.
              </p>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setResults(null);
                setUploadSummary(null);
              }}
            >
              <RefreshCw size={14} />
              New screening
            </button>
          </div>

          <div className="result-summary-grid">
            <article className="result-summary-card">
              <Users size={20} />
              <span>Resumes processed</span>
              <strong>{results.successfully_parsed}</strong>
            </article>

            <article className="result-summary-card">
              <Trophy size={20} />
              <span>Ranked candidates</span>
              <strong>{results.ranked_candidates.length}</strong>
            </article>

            <article className="result-summary-card">
              <AlertCircle size={20} />
              <span>Failed to parse</span>
              <strong>{results.failed_files?.length || 0}</strong>
            </article>
          </div>

          {results.ranked_candidates.length > 1 && (
            <section className="candidate-comparison" style={{
              marginTop: 24,
              padding: 24,
              background: "var(--surface, #ffffff)",
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: 16,
              overflowX: "auto"
            }}>
              <div className="jobs-eyebrow">
                <Trophy size={14} />
                COMPARATIVE ANALYSIS
              </div>
              <h3 style={{margin: "10px 0 6px"}}>Candidate performance comparison</h3>
              <p style={{marginBottom: 24, opacity: 0.7}}>
                Compare candidate scores at a glance to identify the strongest matches.
              </p>

              <div style={{display: "grid", gap: 16, marginBottom: 28}}>
                {results.ranked_candidates.map((candidate, index) => {
                  const score = Number(candidate.overall_score) || 0;
                  const barColor = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc5252";
                  return (
                    <div key={candidate.filename || index}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", gap: 12, marginBottom: 7
                      }}>
                        <span style={{fontWeight: 600, minWidth: 0}}>
                          #{candidate.rank || index + 1} {candidate.candidate_name || "Unknown"}
                        </span>
                        <strong style={{color: barColor, flexShrink: 0}}>{score.toFixed(2)}%</strong>
                      </div>
                      <div style={{
                        height: 12, borderRadius: 20, overflow: "hidden",
                        background: "var(--border, #e5e7eb)"
                      }}>
                        <div style={{
                          width: `${Math.min(100, Math.max(0, score))}%`,
                          height: "100%", background: barColor,
                          borderRadius: 20, transition: "width 0.5s ease"
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 style={{marginBottom: 12}}>Detailed comparison</h3>
              <table style={{
                width: "100%", minWidth: 600, borderCollapse: "collapse",
                textAlign: "left"
              }}>
                <thead>
                  <tr style={{borderBottom: "2px solid var(--border, #e5e7eb)"}}>
                    {["Rank", "Candidate", "Skills", "Experience", "Education", "Overall"].map(header => (
                      <th key={header} style={{padding: "12px 10px", fontSize: 12, whiteSpace: "nowrap"}}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.ranked_candidates.map((candidate, index) => {
                    const breakdown = candidate.score_breakdown || {};
                    const overall = Number(candidate.overall_score) || 0;
                    const color = overall >= 75 ? "#16a34a" : overall >= 50 ? "#d97706" : "#dc5252";
                    return (
                      <tr key={candidate.filename || index} style={{borderBottom: "1px solid var(--border, #e5e7eb)"}}>
                        <td style={{padding: 12}}>#{candidate.rank || index + 1}</td>
                        <td style={{padding: 12, fontWeight: 600}}>{candidate.candidate_name || "Unknown"}</td>
                        <td style={{padding: 12}}>{breakdown.skills?.score ?? "N/A"}{breakdown.skills?.score != null ? "%" : ""}</td>
                        <td style={{padding: 12}}>{breakdown.experience?.score ?? "N/A"}{breakdown.experience?.score != null ? "%" : ""}</td>
                        <td style={{padding: 12}}>{breakdown.education?.score ?? "N/A"}{breakdown.education?.score != null ? "%" : ""}</td>
                        <td style={{padding: 12, fontWeight: 700, color}}>{overall.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          {results.ranked_candidates.map((candidate, index) => {
            const score =
            candidate.overall_score == null ? null : Number(candidate.overall_score);
            const breakdown = candidate.score_breakdown || {};

            return (
              <article
                className="ranked-candidate-card"
                key={candidate.filename || index}
              >
                <div className="ranked-candidate-top">
                  <div className="ranked-candidate-identity">
                    <div className="rank-number">
                      #{candidate.rank || index + 1}
                    </div>

                    <div className="ranked-avatar">
                      {getInitials(candidate.candidate_name)}
                    </div>

                    <div>
                      <h3>
                        {candidate.candidate_name || "Unknown Candidate"}
                      </h3>
                      <p>{candidate.original_filename || candidate.filename}</p>
                    </div>
                  </div>

                  <div className="candidate-score">
                  <strong>{score == null ? "N/A" : `${score}%`}</strong>
                    <span>{getScoreLabel(score)}</span>
                  </div>
                </div>

                <div className="candidate-score-track">
                <div
  style={{
    width: `${score == null ? 0 : Math.min(100, Math.max(0, score))}%`,
  }}
/>
                </div>

                <div className="score-breakdown">
                  {[
                    { key: "skills", label: "Skills" },
                    { key: "experience", label: "Experience" },
                    { key: "education", label: "Education" },
                  ].map((item) => {
                    const value = breakdown[item.key];

                    return (
                      <div className="breakdown-item" key={item.key}>
                        <span>{item.label}</span>
                        <strong>{value?.score == null ? "N/A" : `${value.score}%`}</strong>
                        <small>
                        {value?.score == null ? "Not assessed" : `${value.weighted_score ?? 0} weighted points`}
                        </small>
                      </div>
                    );
                  })}
                </div>

                <div className="candidate-match-details">
                  <div>
                    <h4>
                      <CheckCircle2 size={15} />
                      Matched skills
                    </h4>
                    <div className="result-skill-list matched">
                      {(candidate.matched_skills || []).length > 0 ? (
                        candidate.matched_skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))
                      ) : (
                        <small>No matching skills identified.</small>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4>
                      <AlertCircle size={15} />
                      Missing skills
                    </h4>
                    <div className="result-skill-list missing">
                      {(candidate.missing_skills || []).length > 0 ? (
                        candidate.missing_skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))
                      ) : (
                        <small>No missing skills identified.</small>
                      )}
                    </div>
                  </div>
                </div>

                <div className="candidate-analysis">
                  <div>
                    <BriefcaseBusiness size={16} />
                    <strong>Experience analysis</strong>
                    <span>
                    {candidate.experience_analysis?.score == null
  ? "Not assessed"
  : `${candidate.experience_analysis.score}% match`}
                    </span>
                  </div>

                  <p>
                    Matched:{" "}
                    {(candidate.experience_analysis?.matched_terms || []).join(", ") || "None"}
                  </p>
                  <p>
                    Missing:{" "}
                    {(candidate.experience_analysis?.missing_terms || []).join(", ") || "None"}
                  </p>

                  {candidate.experience_analysis?.duration_analysis && (
                    <div className="duration-summary">
                      <strong>Experience duration</strong>
                      <span>
                        {candidate.experience_analysis.duration_analysis.duration_confidence === "unknown"
                          ? "Duration unavailable from resume dates"
                          : `~${candidate.experience_analysis.duration_analysis.total_known_years} years estimated`}
                      </span>

                      {(candidate.experience_analysis.duration_analysis.entries || []).map((entry, index) => (
                        <p key={index}>
                          {entry.role || "Experience"} — {entry.date_range || "Dates unavailable"}
                          {entry.duration_months != null
                            ? ` (${entry.duration_months} months)`
                            : " (duration unknown)"}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="education-analysis">
                    <GraduationCap size={16} />
                    <strong>Education analysis</strong>
                    <span>
                    {candidate.education_analysis?.score == null
  ? "Not assessed"
  : `${candidate.education_analysis.score}% match`}
                    </span>
                  </div>

                  <p>
                    Matched requirements:{" "}
                    {(candidate.education_analysis?.matched_requirements || []).join(", ") || "None"}
                  </p>
                  <p>
                    Missing requirements:{" "}
                    {(candidate.education_analysis?.missing_requirements || []).join(", ") || "None"}
                  </p>
                </div>
              </article>
            );
          })}

          {results.failed_files?.length > 0 && (
            <div className="failed-files-panel">
              <h3>Files that could not be processed</h3>
              {results.failed_files.map((file, index) => (
                <p key={`${file.filename}-${index}`}>
                  <AlertCircle size={14} />
                  <strong>{file.filename}:</strong> {file.reason}
                </p>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Candidates;
