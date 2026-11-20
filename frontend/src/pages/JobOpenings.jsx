
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  MapPin,
  BriefcaseBusiness,
  Users,
  X,
  CalendarDays,
  Building2,
  Sparkles,
  Trash2,
  Pencil,
} from "lucide-react";

const STORAGE_KEY = "hirelens_job_openings";

const initialJobs = [
  {
    id: 1,
    title: "Machine Learning Engineer",
    department: "Engineering",
    location: "Bangalore",
    type: "Full-time",
    experience: "2–4 years",
    skills: ["Python", "TensorFlow", "NLP"],
    applicants: 48,
    status: "Active",
    description: "Build and deploy intelligent machine learning solutions.",
  },
  {
    id: 2,
    title: "Data Scientist",
    department: "Data & Analytics",
    location: "Remote",
    type: "Full-time",
    experience: "1–3 years",
    skills: ["Python", "SQL", "Machine Learning"],
    applicants: 36,
    status: "Active",
    description: "Analyze complex datasets and develop predictive models.",
  },
  {
    id: 3,
    title: "Frontend Developer",
    department: "Engineering",
    location: "Chandigarh",
    type: "Full-time",
    experience: "0–2 years",
    skills: ["React", "JavaScript", "CSS"],
    applicants: 29,
    status: "Active",
    description: "Develop responsive and engaging web applications.",
  },
];

const emptyForm = {
  title: "",
  department: "",
  location: "",
  type: "Full-time",
  experience: "",
  skills: "",
  description: "",
};

function JobOpenings() {
  const [jobs, setJobs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialJobs;
    } catch {
      return initialJobs;
    }
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Persist jobs across refreshes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = `${job.title} ${job.department} ${job.location} ${job.skills.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter = filter === "All" || job.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [jobs, search, filter]);

  const activeJobs = jobs.filter((job) => job.status === "Active").length;

  const totalApplicants = jobs.reduce(
    (sum, job) => sum + (Number(job.applicants) || 0),
    0
  );

  const updateField = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.title.trim() ||
      !form.department.trim() ||
      !form.location.trim() ||
      !form.experience.trim() ||
      !form.description.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const jobData = {
      ...form,
      title: form.title.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      experience: form.experience.trim(),
      description: form.description.trim(),
      skills: form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    if (editingId !== null) {
      setJobs((previous) =>
        previous.map((job) =>
          job.id === editingId ? { ...job, ...jobData } : job
        )
      );
    } else {
      const newJob = {
        ...jobData,
        id: Date.now(),
        applicants: 0,
        status: "Active",
      };

      setJobs((previous) => [newJob, ...previous]);
    }

    resetForm();
  };

  const editJob = (job) => {
    setForm({
      title: job.title || "",
      department: job.department || "",
      location: job.location || "",
      type: job.type || "Full-time",
      experience: job.experience || "",
      skills: (job.skills || []).join(", "),
      description: job.description || "",
    });

    setEditingId(job.id);
    setShowForm(true);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = (id) => {
    setJobs((previous) =>
      previous.map((job) =>
        job.id === id
          ? {
              ...job,
              status: job.status === "Active" ? "Closed" : "Active",
            }
          : job
      )
    );
  };

  const deleteJob = (id) => {
    const job = jobs.find((item) => item.id === id);

    if (!window.confirm(`Delete "${job?.title}"? This cannot be undone.`)) {
      return;
    }

    setJobs((previous) => previous.filter((job) => job.id !== id));

    if (editingId === id) resetForm();
  };

  return (
    <div className="jobs-page">
      <section className="jobs-welcome">
        <div>
          <div className="jobs-eyebrow">
            <Sparkles size={13} /> RECRUITMENT WORKSPACE
          </div>
          <h2>Find the right people.</h2>
          <p>Create job opportunities and discover talent that fits your team.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(true);
            }
          }}
        >
          {showForm ? <X size={17} /> : <Plus size={17} />}
          {showForm ? "Close form" : "Create job opening"}
        </button>
      </section>

      <section className="job-stats">
        <div className="job-stat">
          <div className="job-stat-icon sage">
            <BriefcaseBusiness />
          </div>
          <div>
            <span>Total positions</span>
            <strong>{jobs.length}</strong>
          </div>
        </div>

        <div className="job-stat">
          <div className="job-stat-icon peach">
            <Building2 />
          </div>
          <div>
            <span>Active positions</span>
            <strong>{activeJobs}</strong>
          </div>
        </div>

        <div className="job-stat">
          <div className="job-stat-icon blush">
            <Users />
          </div>
          <div>
            <span>Total applicants</span>
            <strong>{totalApplicants}</strong>
          </div>
        </div>
      </section>

      {showForm && (
        <section className="job-form-panel">
          <div className="job-form-heading">
            <div>
              <h3>{editingId !== null ? "Edit position" : "Create a new position"}</h3>
              <p>
                {editingId !== null
                  ? "Update your job requirements and role details."
                  : "Define the requirements for your next great hire."}
              </p>
            </div>

            <button
              className="form-close"
              onClick={resetForm}
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="job-form-grid">
              <label>
                Job title *
                <input
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="e.g. AI Engineer"
                />
              </label>

              <label>
                Department *
                <input
                  name="department"
                  value={form.department}
                  onChange={updateField}
                  placeholder="e.g. Engineering"
                />
              </label>

              <label>
                Location *
                <input
                  name="location"
                  value={form.location}
                  onChange={updateField}
                  placeholder="e.g. Bangalore / Remote"
                />
              </label>

              <label>
                Employment type
                <select name="type" value={form.type} onChange={updateField}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                </select>
              </label>

              <label>
                Experience required *
                <input
                  name="experience"
                  value={form.experience}
                  onChange={updateField}
                  placeholder="e.g. 0–2 years"
                />
              </label>

              <label>
                Required skills
                <input
                  name="skills"
                  value={form.skills}
                  onChange={updateField}
                  placeholder="Python, NLP, SQL"
                />
              </label>

              <label className="full-width">
                Job description *
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Describe the role, responsibilities and requirements..."
                  rows={4}
                />
              </label>
            </div>

            {error && <p className="job-error">{error}</p>}

            <div className="job-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button type="submit" className="primary-button">
                {editingId !== null ? (
                  <Pencil size={16} />
                ) : (
                  <Plus size={16} />
                )}
                {editingId !== null ? "Save changes" : "Publish job opening"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="job-list-section">
        <div className="job-list-heading">
          <div>
            <h3>Your job openings</h3>
            <p>Manage your hiring requirements and opportunities.</p>
          </div>
          <span className="job-count">{jobs.length} positions</span>
        </div>

        <div className="job-toolbar">
          <div className="job-search">
            <Search size={17} />
            <input
              placeholder="Search job title, skills or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="job-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All positions</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="job-cards">
          {filteredJobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="job-card-top">
                <div className="job-title-icon">
                  <BriefcaseBusiness size={21} />
                </div>

                <div className="job-card-menu">
                  <button
                    className="job-status"
                    onClick={() => toggleStatus(job.id)}
                    title="Click to change job status"
                  >
                    <span
                      className={
                        job.status === "Active" ? "active-dot" : "closed-dot"
                      }
                    />
                    {job.status}
                  </button>

                  <button
                    className="delete-job"
                    onClick={() => editJob(job)}
                    aria-label="Edit job"
                    title="Edit job"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="delete-job"
                    onClick={() => deleteJob(job.id)}
                    aria-label="Delete job"
                    title="Delete job"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3>{job.title}</h3>
              <p className="job-department">{job.department}</p>
              <p className="job-description">{job.description}</p>

              <div className="job-metadata">
                <span>
                  <MapPin size={14} /> {job.location}
                </span>
                <span>
                  <BriefcaseBusiness size={14} /> {job.type}
                </span>
                <span>
                  <CalendarDays size={14} /> {job.experience}
                </span>
              </div>

              <div className="job-skills">
                {job.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>

              <div className="job-card-footer">
                <div>
                  <Users size={16} />
                  <strong>{job.applicants}</strong>
                  <span>Applicants</span>
                </div>

                <button
                  className="job-manage-button"
                  onClick={() => toggleStatus(job.id)}
                >
                  {job.status === "Active" ? "Close position" : "Reopen position"}
                </button>
              </div>
            </article>
          ))}

          {filteredJobs.length === 0 && (
            <div className="jobs-empty">
              <Search size={28} />
              <h3>No matching positions found</h3>
              <p>Try another search or change your filters.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default JobOpenings;
